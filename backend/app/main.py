from __future__ import annotations

import asyncio
import io
import os
import threading
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import (
    count_anomalies_by_batch,
    create_upload_batch,
    create_user,
    get_anomalies,
    get_anomaly_by_id,
    get_batch_by_id,
    get_batches_by_user,
    get_narrative_by_anomaly_id,
    get_spending_by_category,
    get_spending_by_day,
    get_transactions_by_batch,
    get_transactions_by_user,
    get_transactions_by_user_all,
    get_user_by_email,
    init_db,
    insert_anomalies,
    insert_narrative,
    insert_transactions,
    update_anomaly_status,
    update_batch_status,
    update_narrative_audio,
)
from app.gemini import generate_narrative
from app.inference import detect_anomalies, load_models
from app.schemas import (
    AnomalyResult,
    BatchProgressResponse,
    BatchResponse,
    HealthResponse,
    NarrativeResponse,
    PaginatedAnomalies,
    PaginatedTransactions,
    TokenResponse,
    TransactionResult,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.tasks import process_upload
from app.tts import generate_audio, stream_audio
from app.chat import generate_chat_response

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


class ChatMessage(BaseModel):
    message: str
    history: Optional[list[dict]] = None

_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_rate_limit_lock = threading.Lock()
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # per window per IP
RATE_LIMIT_CLEANUP_INTERVAL = 300  # cleanup stale entries every 5 minutes
_last_rate_limit_cleanup: float = time.time()

_narrative_locks: dict[int, threading.Lock] = {}
_narrative_locks_lock = threading.Lock()


def _get_narrative_lock(anomaly_id: int) -> threading.Lock:
    with _narrative_locks_lock:
        if anomaly_id not in _narrative_locks:
            _narrative_locks[anomaly_id] = threading.Lock()
        return _narrative_locks[anomaly_id]


def _check_rate_limit(ip: str) -> bool:
    global _last_rate_limit_cleanup
    now = time.time()
    with _rate_limit_lock:
        _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]
        if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX_REQUESTS:
            return False
        _rate_limit_store[ip].append(now)
        if now - _last_rate_limit_cleanup > RATE_LIMIT_CLEANUP_INTERVAL:
            cutoff = now - RATE_LIMIT_WINDOW
            _rate_limit_store = {k: v for k, v in _rate_limit_store.items() if v and v[-1] > cutoff}
            _last_rate_limit_cleanup = now
        return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_models("models")
    yield


app = FastAPI(
    title="The Marauder's Ledger",
    description="Financial anomaly detection API with AI narration",
    version="0.2.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

REQUIRED_COLUMNS = {"amount", "category", "merchant", "hour", "day"}


# ── Health ──

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="0.2.0")


# ── Auth ──

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(body: UserRegister, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Too many requests")

    if get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = await asyncio.to_thread(create_user, body.email, body.name, hash_password(body.password))
    token = create_access_token({"sub": str(uid), "email": body.email, "name": body.name})
    return TokenResponse(
        access_token=token,
        user=UserResponse(user_id=uid, name=body.name, email=body.email),
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(body: UserLogin, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Too many requests")

    user = await asyncio.to_thread(get_user_by_email, body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user["user_id"]), "email": user["email"], "name": user["name"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(user_id=user["user_id"], name=user["name"], email=user["email"]),
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        user_id=int(current_user["sub"]),
        name=current_user["name"],
        email=current_user["email"],
    )


# ── Upload & Analyze ──

@app.post("/api/upload", response_model=BatchResponse)
async def upload_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)}MB")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV")

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}",
        )

    txns = df.to_dict(orient="records")
    batch_id = await asyncio.to_thread(create_upload_batch, user_id, len(txns))
    txn_ids = await asyncio.to_thread(insert_transactions, txns, user_id, batch_id)

    try:
        from app.tasks import process_upload
        process_upload.delay(batch_id, user_id)
    except Exception:
        print("Celery unavailable — processing synchronously")
        from app.inference import detect_anomalies
        from app.database import update_batch_status
        results = await asyncio.to_thread(detect_anomalies, txns)
        anomalies = [r for r in results if r["is_anomaly"]]
        if anomalies:
            await asyncio.to_thread(insert_anomalies, anomalies, user_id)
        await asyncio.to_thread(update_batch_status, batch_id, "completed")

    return BatchResponse(batch_id=batch_id, status="processing", txn_count=len(txn_ids))


# ── Anomalies ──

def _row_to_anomaly(row: dict) -> dict:
    return {
        "anomaly_id": str(row["anomaly_id"]),
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


@app.get("/api/anomalies", response_model=PaginatedAnomalies)
async def list_anomalies(
    severity: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["sub"])
    limit = min(limit, 200)
    rows, total = await asyncio.to_thread(get_anomalies, user_id, severity, offset, limit)
    return PaginatedAnomalies(
        items=[_row_to_anomaly(r) for r in rows],
        total=total,
        offset=offset,
        limit=limit,
    )


@app.get("/api/anomalies/{anomaly_id}", response_model=AnomalyResult)
async def get_anomaly(anomaly_id: int, current_user: dict = Depends(get_current_user)):
    row = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not row:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if row["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    return _row_to_anomaly(row)


# ── Narratives ──

@app.get("/api/narratives/{anomaly_id}", response_model=NarrativeResponse)
async def get_narrative(anomaly_id: int, current_user: dict = Depends(get_current_user)):
    anomaly = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if anomaly["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    existing = await asyncio.to_thread(get_narrative_by_anomaly_id, anomaly_id)
    if existing:
        return NarrativeResponse(
            narrative_id=str(existing["narrative_id"]),
            anomaly_id=str(existing["anomaly_id"]),
            text=existing["text"],
            created_at=existing.get("created_at"),
        )

    lock = _get_narrative_lock(anomaly_id)
    with lock:
        existing = await asyncio.to_thread(get_narrative_by_anomaly_id, anomaly_id)
        if existing:
            return NarrativeResponse(
                narrative_id=str(existing["narrative_id"]),
                anomaly_id=str(existing["anomaly_id"]),
                text=existing["text"],
                created_at=existing.get("created_at"),
            )

        text = await asyncio.to_thread(generate_narrative, anomaly)
        nid = await asyncio.to_thread(insert_narrative, anomaly_id, text)

    return NarrativeResponse(
        narrative_id=str(nid),
        anomaly_id=str(anomaly_id),
        text=text,
    )


@app.get("/api/narratives/{anomaly_id}/audio")
async def get_narrative_audio(anomaly_id: int, current_user: dict = Depends(get_current_user)):
    anomaly = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if anomaly["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    narrative = await asyncio.to_thread(get_narrative_by_anomaly_id, anomaly_id)

    if not narrative:
        text = await asyncio.to_thread(generate_narrative, anomaly)
        nid = await asyncio.to_thread(insert_narrative, anomaly_id, text)
        narrative = {"narrative_id": nid, "text": text, "audio_data": None}
    else:
        text = narrative["text"]

    if narrative.get("audio_data"):
        audio = bytes.fromhex(narrative["audio_data"]) if isinstance(narrative["audio_data"], str) else narrative["audio_data"]
        return Response(content=audio, media_type="audio/mpeg")

    audio = await asyncio.to_thread(generate_audio, text)
    if audio is None:
        raise HTTPException(status_code=501, detail="TTS not configured (set ELEVENLABS_API_KEY)")

    try:
        await asyncio.to_thread(update_narrative_audio, narrative["narrative_id"], audio)
    except Exception:
        pass
    return Response(content=audio, media_type="audio/mpeg")


@app.post("/api/anomalies/{anomaly_id}/status")
async def set_anomaly_status(anomaly_id: int, status: str, current_user: dict = Depends(get_current_user)):
    if status not in ("valid", "mischief", "pending"):
        raise HTTPException(status_code=400, detail="Status must be valid, mischief, or pending")
    anomaly = await asyncio.to_thread(get_anomaly_by_id, anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if anomaly["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    await asyncio.to_thread(update_anomaly_status, anomaly_id, status)
    return {"anomaly_id": anomaly_id, "status": status}


# ── Spending ──

@app.get("/api/spending/category")
async def spending_by_category(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    return await asyncio.to_thread(get_spending_by_category, user_id)


@app.get("/api/spending/daily")
async def spending_by_day(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    return await asyncio.to_thread(get_spending_by_day, user_id)


# ── Batches ──

@app.get("/api/batches")
async def list_batches(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    return await asyncio.to_thread(get_batches_by_user, user_id)


@app.get("/api/batches/{batch_id}")
async def get_batch_status(batch_id: str, current_user: dict = Depends(get_current_user)):
    batch = await asyncio.to_thread(get_batch_by_id, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    return batch


@app.get("/api/batches/{batch_id}/progress", response_model=BatchProgressResponse)
async def get_batch_progress(batch_id: str, current_user: dict = Depends(get_current_user)):
    batch = await asyncio.to_thread(get_batch_by_id, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch["user_id"] != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    status = batch["status"]
    txn_count = batch["txn_count"]

    if status == "completed":
        anomalies_found = await asyncio.to_thread(count_anomalies_by_batch, batch_id)
        progress = 100.0
    elif status == "failed":
        anomalies_found = 0
        progress = 0.0
    else:
        anomalies_found = await asyncio.to_thread(count_anomalies_by_batch, batch_id)
        progress = min(99.0, (anomalies_found / max(txn_count, 1)) * 100) if txn_count > 0 else 0.0

    return BatchProgressResponse(
        batch_id=batch_id,
        status=status,
        txn_count=txn_count,
        anomalies_found=anomalies_found,
        progress=progress,
    )


# ── Transactions ──

@app.get("/api/transactions", response_model=PaginatedTransactions)
async def list_transactions(
    offset: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["sub"])
    limit = min(limit, 200)
    rows, total = await asyncio.to_thread(get_transactions_by_user, user_id, offset, limit)
    items = [
        TransactionResult(
            txn_id=str(r.get("txn_id", r.get("id", ""))),
            amount=r["amount"],
            category=r["category"],
            merchant=r["merchant"],
            hour=r["hour"],
            day=r.get("day"),
            timestamp=r.get("timestamp"),
            batch_id=r.get("batch_id"),
        )
        for r in rows
    ]
    return PaginatedTransactions(items=items, total=total, offset=offset, limit=limit)


# ── Voice Chat ──

@app.post("/api/chat/message")
async def chat_message(body: ChatMessage, current_user: dict = Depends(get_current_user)):
    response_text = await asyncio.to_thread(
        generate_chat_response, body.message, body.history
    )

    def generate():
        for chunk in stream_audio(response_text):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="audio/mpeg",
        headers={
            "X-Chat-Response": response_text,
            "Cache-Control": "no-cache",
        },
    )
