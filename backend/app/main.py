import asyncio
import io
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    create_upload_batch,
    get_anomalies,
    get_anomaly_by_id,
    get_narrative_by_anomaly_id,
    get_transactions_by_batch,
    init_db,
    insert_anomalies,
    insert_narrative,
    insert_transactions,
    update_batch_status,
    update_narrative_audio,
)
from app.gemini import generate_narrative
from app.inference import detect_anomalies, load_models
from app.schemas import AnomalyResult, BatchResponse, HealthResponse, NarrativeResponse
from app.tts import generate_audio
from app.vector_store import (
    _encode_transaction as _encode_txn_for_vec,
)
from app.vector_store import (
    search_similar_transactions,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_models("models")
    yield


app = FastAPI(
    title="The Marauder's Ledger",
    description="Financial anomaly detection API with AI narration",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUIRED_COLUMNS = {"amount", "category", "merchant", "hour", "day"}


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="0.1.0")


@app.post("/api/upload", response_model=BatchResponse)
async def upload_csv(file: UploadFile = File(...)):  # noqa: B008
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Failed to parse CSV")

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}",
        )

    txns = df.to_dict(orient="records")
    user_id = "default"

    batch_id = await asyncio.to_thread(create_upload_batch, user_id, len(txns))
    txn_ids = await asyncio.to_thread(insert_transactions, txns, user_id, batch_id)

    return BatchResponse(batch_id=batch_id, status="processing", txn_count=len(txn_ids))


@app.post("/api/analyze")
async def analyze_batch(batch_id: str):
    txns = await asyncio.to_thread(get_transactions_by_batch, batch_id)
    if not txns:
        raise HTTPException(status_code=404, detail="Batch not found")

    results = await asyncio.to_thread(detect_anomalies, txns)
    anomalies = [r for r in results if r["is_anomaly"]]

    if anomalies:
        await asyncio.to_thread(insert_anomalies, anomalies, "default")

    await asyncio.to_thread(update_batch_status, batch_id, "completed")

    return {
        "anomalies_found": len(anomalies),
        "total_txns": len(txns),
        "status": "completed",
    }


def _row_to_anomaly(row: dict) -> dict:
    return {
        "anomaly_id": row["anomaly_id"],
        "txn_id": row.get("txn_id"),
        "amount": row["amount"],
        "category": row["category"],
        "merchant": row["merchant"],
        "hour": row["hour"],
        "day": row.get("day"),
        "isolation_score": row.get("isolation_score", 0),
        "rule_score": row.get("rule_score", 0),
        "final_score": row.get("final_score", 0),
        "is_anomaly": bool(row["is_anomaly"]),
        "severity": row["severity"],
        "triggered_rules": row["triggered_rules"] if isinstance(row.get("triggered_rules"), list) else
                          row["triggered_rules"].split(",") if row.get("triggered_rules") else [],
        "detected_at": row.get("detected_at"),
    }


@app.get("/api/anomalies", response_model=list[AnomalyResult])
async def list_anomalies(user_id: str | None = None, severity: str | None = None):
    rows = await asyncio.to_thread(get_anomalies, user_id, severity)
    return [_row_to_anomaly(r) for r in rows]


@app.get("/api/anomalies/{anomaly_id}", response_model=AnomalyResult)
async def get_anomaly(anomaly_id: int):
    row = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not row:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return _row_to_anomaly(row)


@app.post("/api/transactions/similar")
async def similar_transactions(amount: float, category: str, merchant: str, hour: int, day: int):
    vec = _encode_txn_for_vec({"amount": amount, "category": category, "merchant": merchant, "hour": hour, "day": day})
    results = await asyncio.to_thread(search_similar_transactions, vec, 5)
    return [
        {
            "amount": r["amount"],
            "category": r.get("category"),
            "merchant": r.get("merchant"),
            "hour": r.get("hour"),
            "day": r.get("day"),
        }
        for r in results
    ]


@app.get("/api/narratives/{anomaly_id}", response_model=NarrativeResponse)
async def get_narrative(anomaly_id: int):
    existing = await asyncio.to_thread(get_narrative_by_anomaly_id, anomaly_id)
    if existing:
        return NarrativeResponse(
            narrative_id=existing["narrative_id"],
            anomaly_id=existing["anomaly_id"],
            text=existing["text"],
            created_at=existing.get("created_at"),
        )

    anomaly = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    text = await asyncio.to_thread(generate_narrative, anomaly)
    nid = await asyncio.to_thread(insert_narrative, anomaly_id, text)

    return NarrativeResponse(
        narrative_id=nid,
        anomaly_id=anomaly_id,
        text=text,
    )


@app.get("/api/narratives/{anomaly_id}/audio")
async def get_narrative_audio(anomaly_id: int):
    narrative = await asyncio.to_thread(get_narrative_by_anomaly_id, anomaly_id)

    if not narrative:
        anomaly = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
        if not anomaly:
            raise HTTPException(status_code=404, detail="Anomaly not found")
        text = await asyncio.to_thread(generate_narrative, anomaly)
        nid = await asyncio.to_thread(insert_narrative, anomaly_id, text)
        narrative = {"narrative_id": nid, "text": text, "audio_data": None}
    else:
        text = narrative["text"]

    if narrative.get("audio_data"):
        return Response(content=narrative["audio_data"], media_type="audio/mpeg")

    audio = await asyncio.to_thread(generate_audio, text)
    if audio is None:
        raise HTTPException(status_code=501, detail="TTS not configured (set ELEVENLABS_API_KEY)")

    await asyncio.to_thread(update_narrative_audio, narrative["narrative_id"], audio)
    return Response(content=audio, media_type="audio/mpeg")
