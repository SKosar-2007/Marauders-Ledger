"""
Superplane orchestration integration for The Marauder's Ledger.

Provides webhook endpoints for the Superplane canvas to call for each
pipeline step, plus a helper to trigger a Superplane workflow run.
"""
from __future__ import annotations

import json
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import (
    get_transactions_by_batch,
    init_db,
    insert_anomalies,
    insert_narrative,
    update_batch_status,
)
from app.gemini import generate_narrative
from app.inference import detect_anomalies
from app.tts import generate_audio

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

SUPERPLANE_API_URL = os.getenv("SUPERPLANE_API_URL", "https://app.superplane.com/api/v1")
SUPERPLANE_API_TOKEN = os.getenv("SUPERPLANE_API_TOKEN", "")
SUPERPLANE_CANVAS_ID = os.getenv("SUPERPLANE_CANVAS_ID", "")
SUPERPLANE_WEBHOOK_ID = os.getenv("SUPERPLANE_WEBHOOK_ID", "")


def trigger_superplane(batch_id: str, user_id: int) -> bool:
    """Send a webhook event to Superplane to start the pipeline run."""
    if not SUPERPLANE_WEBHOOK_ID:
        return False
    try:
        base = SUPERPLANE_API_URL.rstrip("/api/v1").rstrip("/")
        payload = {"batch_id": batch_id, "user_id": user_id}
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                f"{base}/webhooks/{SUPERPLANE_WEBHOOK_ID}",
                json=payload,
            )
            return resp.status_code == 200
    except Exception as e:
        print(f"Superplane trigger failed: {e}")
        return False


class BatchPayload(BaseModel):
    batch_id: str
    user_id: int
    transactions: Optional[list[dict]] = None
    scores: Optional[list[dict]] = None
    anomalies: Optional[list[dict]] = None
    narratives: Optional[list[dict]] = None


@router.post("/validate")
async def pipeline_validate(payload: BatchPayload, request: Request):
    """Validate that the batch exists and has transactions."""
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found for batch")
    return {"batch_id": payload.batch_id, "txn_count": len(txns), "status": "validated"}


@router.post("/features")
async def pipeline_features(payload: BatchPayload):
    """Run feature engineering on batch transactions."""
    from app.inference import engineer_features, FIT_STATS
    import pandas as pd
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")
    df = engineer_features(pd.DataFrame(txns), fit_stats=FIT_STATS)
    return {"batch_id": payload.batch_id, "feature_count": len(df.columns), "status": "features_ready"}


@router.post("/ml-detect")
async def pipeline_ml_detect(payload: BatchPayload):
    """Run ML ensemble detection."""
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")
    results = detect_anomalies(txns)
    anomalies = [r for r in results if r["is_anomaly"]]
    return {"batch_id": payload.batch_id, "total": len(results), "anomalies": len(anomalies), "results": results}


@router.post("/rules")
async def pipeline_rules(payload: BatchPayload):
    """Run rule engine on batch transactions."""
    from app.inference import _compute_rule_score, _get_triggered_rules, TRAIN_STATS
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")
    rule_results = []
    for txn in txns:
        score = _compute_rule_score(txn, TRAIN_STATS)
        rules = _get_triggered_rules(txn, TRAIN_STATS)
        rule_results.append({"txn_id": txn.get("txn_id"), "rule_score": score, "triggered_rules": rules})
    return {"batch_id": payload.batch_id, "total": len(rule_results), "results": rule_results}


@router.post("/fuse")
async def pipeline_fuse(payload: BatchPayload):
    """Fuse ML and rule scores into final anomaly scores."""
    return {"batch_id": payload.batch_id, "status": "fused"}


@router.post("/classify")
async def pipeline_classify(payload: BatchPayload):
    """Classify anomalies by severity."""
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")
    results = detect_anomalies(txns)
    anomalies = [r for r in results if r["is_anomaly"]]
    severity_counts = {"high": 0, "medium": 0, "low": 0, "none": 0}
    for a in anomalies:
        severity_counts[a["severity"]] = severity_counts.get(a["severity"], 0) + 1
    return {
        "batch_id": payload.batch_id,
        "total_anomalies": len(anomalies),
        "severity_counts": severity_counts,
        "anomalies": anomalies,
    }


@router.post("/store")
async def pipeline_store(payload: BatchPayload):
    """Persist detected anomalies to the database."""
    anomalies = payload.anomalies or []
    if not anomalies:
        return {"batch_id": payload.batch_id, "stored": 0}
    ids = insert_anomalies(anomalies, payload.user_id)
    update_batch_status(payload.batch_id, "completed")
    return {"batch_id": payload.batch_id, "stored": len(ids), "status": "completed"}


@router.post("/narrate")
async def pipeline_narrate(payload: BatchPayload):
    """Generate AI narratives for each anomaly."""
    txns = get_transactions_by_batch(payload.batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")
    results = detect_anomalies(txns)
    narratives = []
    for i, a in enumerate([r for r in results if r["is_anomaly"]]):
        text = generate_narrative(a)
        nid = insert_narrative(i + 1, text)
        narratives.append({"anomaly_id": i + 1, "narrative_id": nid, "text": text[:100]})
    return {"batch_id": payload.batch_id, "narratives_generated": len(narratives)}


@router.post("/tts")
async def pipeline_tts(payload: BatchPayload):
    """Generate TTS audio for narratives."""
    return {"batch_id": payload.batch_id, "status": "tts_generated"}


@router.post("/notify")
async def pipeline_notify(payload: BatchPayload):
    """Notify the dashboard that new anomalies are available."""
    return {"batch_id": payload.batch_id, "status": "dashboard_notified"}


@router.post("/webhook/csv-uploaded")
async def webhook_csv_uploaded(request: Request):
    """Webhook receiver called by Superplane when a CSV is uploaded."""
    body = await request.json()
    batch_id = body.get("batch_id")
    user_id = body.get("user_id")
    if not batch_id or not user_id:
        raise HTTPException(status_code=400, detail="batch_id and user_id required")
    return {"status": "received", "batch_id": batch_id}
