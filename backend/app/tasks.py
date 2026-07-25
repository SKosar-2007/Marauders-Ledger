"""
Background tasks for The Marauder's Ledger.
Handles async processing of CSV uploads, anomaly detection, narrative generation, and TTS.
"""
from __future__ import annotations

import traceback

from app.celery_app import app as celery
from app.database import (
    get_transactions_by_batch,
    init_db,
    insert_anomalies,
    insert_narrative,
    update_batch_status,
    update_narrative_audio,
)
from app.gemini import generate_narrative
from app.inference import detect_anomalies, load_models
from app.tts import generate_audio

_worker_initialized = False


def _ensure_init():
    global _worker_initialized
    if not _worker_initialized:
        init_db()
        load_models("models")
        _worker_initialized = True


@celery.task(bind=True, name="app.tasks.process_upload")
def process_upload(self, batch_id: str, user_id: int):
    """
    Background task to process an uploaded CSV batch.
    Steps: load transactions -> detect anomalies -> store results -> update status.
    """
    try:
        _ensure_init()
        update_batch_status(batch_id, "processing")

        txns = get_transactions_by_batch(batch_id)
        if not txns:
            update_batch_status(batch_id, "failed")
            return {"status": "failed", "error": "No transactions found for batch"}

        results = detect_anomalies(txns)
        anomalies = [r for r in results if r["is_anomaly"]]

        if anomalies:
            insert_anomalies(anomalies, user_id)

        update_batch_status(batch_id, "completed")

        return {
            "status": "completed",
            "batch_id": batch_id,
            "total_txns": len(txns),
            "anomalies_found": len(anomalies),
        }

    except Exception as e:
        update_batch_status(batch_id, "failed")
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}


@celery.task(bind=True, name="app.tasks.generate_narrative_task")
def generate_narrative_task(self, anomaly_id: int, anomaly: dict):
    """
    Background task to generate a narrative for an anomaly via Gemini.
    """
    try:
        text = generate_narrative(anomaly)
        nid = insert_narrative(anomaly_id, text)
        return {
            "status": "completed",
            "anomaly_id": anomaly_id,
            "narrative_id": nid,
            "text": text,
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}


@celery.task(bind=True, name="app.tasks.generate_audio_task")
def generate_audio_task(self, narrative_id: int, text: str):
    """
    Background task to generate TTS audio for a narrative via ElevenLabs.
    """
    try:
        audio = generate_audio(text)
        if audio is None:
            return {"status": "skipped", "error": "TTS not configured"}
        update_narrative_audio(narrative_id, audio)
        return {
            "status": "completed",
            "narrative_id": narrative_id,
            "audio_size": len(audio),
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}
