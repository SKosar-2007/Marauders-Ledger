import asyncio
import io
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    create_upload_batch,
    init_db,
    insert_transactions,
)
from app.schemas import AnomalyResult, BatchResponse, HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
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

    txn_ids = await asyncio.to_thread(insert_transactions, txns, user_id)
    batch_id = await asyncio.to_thread(create_upload_batch, user_id, len(txn_ids))

    return BatchResponse(batch_id=batch_id, status="processing", txn_count=len(txn_ids))


@app.post("/api/analyze")
async def analyze_batch(batch_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/anomalies", response_model=list[AnomalyResult])
async def get_anomalies(user_id: str | None = None, severity: str | None = None):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/anomalies/{anomaly_id}", response_model=AnomalyResult)
async def get_anomaly(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/narratives/{anomaly_id}")
async def get_narrative(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/narratives/{anomaly_id}/audio")
async def get_narrative_audio(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")
