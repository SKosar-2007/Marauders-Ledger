"""
In-memory database fallback for local development.
Replaces VectorAI when it's not available.
"""
import uuid
from typing import Optional

_transactions: list[dict] = []
_anomalies: list[dict] = []
_narratives: list[dict] = []
_batches: list[dict] = []
_next_id = 1


def _gen_id() -> int:
    global _next_id
    n = _next_id
    _next_id += 1
    return n


def _gen_uuid() -> str:
    return uuid.uuid4().hex[:12]


def init_db():
    print("InMemory DB: initialized (no VectorAI)")


def create_upload_batch(user_id: str, txn_count: int) -> str:
    batch_id = _gen_uuid()
    _batches.append({
        "batch_id": batch_id,
        "user_id": user_id,
        "txn_count": txn_count,
        "status": "processing",
    })
    return batch_id


def update_batch_status(batch_id: str, status: str):
    for b in _batches:
        if b["batch_id"] == batch_id:
            b["status"] = status
            break


def insert_transactions(txns: list[dict], user_id: str, batch_id: str) -> list[int]:
    ids = []
    for txn in txns:
        pid = _gen_id()
        txn_with_meta = {**txn, "txn_id": pid, "user_id": user_id, "batch_id": batch_id}
        _transactions.append(txn_with_meta)
        ids.append(pid)
    return ids


def get_transactions_by_batch(batch_id: str) -> list[dict]:
    return [t for t in _transactions if t.get("batch_id") == batch_id]


def insert_anomalies(anomalies: list[dict], user_id: str) -> list[int]:
    ids = []
    for a in anomalies:
        pid = _gen_id()
        a_with_meta = {**a, "anomaly_id": pid, "user_id": user_id}
        _anomalies.append(a_with_meta)
        ids.append(pid)
    return ids


def get_anomalies(user_id: Optional[str] = None, severity: Optional[str] = None) -> list[dict]:
    results = [a for a in _anomalies if a.get("is_anomaly")]
    if user_id:
        results = [a for a in results if a.get("user_id") == user_id]
    if severity:
        results = [a for a in results if a.get("severity") == severity]
    return results


def get_anomaly_by_id(anomaly_id: int) -> Optional[dict]:
    for a in _anomalies:
        if a.get("anomaly_id") == anomaly_id:
            return a
    return None


def insert_narrative(anomaly_id: int, text: str) -> int:
    for n in _narratives:
        if n.get("anomaly_id") == anomaly_id:
            n["text"] = text
            return n["narrative_id"]
    pid = _gen_id()
    _narratives.append({"narrative_id": pid, "anomaly_id": anomaly_id, "text": text})
    return pid


def get_narrative_by_anomaly_id(anomaly_id: int) -> Optional[dict]:
    for n in _narratives:
        if n.get("anomaly_id") == anomaly_id:
            return n
    return None


def update_narrative_audio(narrative_id: int, audio_data: bytes):
    for n in _narratives:
        if n.get("narrative_id") == narrative_id:
            n["audio_data"] = audio_data
            break


def update_anomaly_status(anomaly_id: int, status: str) -> bool:
    for a in _anomalies:
        if a.get("anomaly_id") == anomaly_id:
            a["status"] = status
            return True
    return False


def get_spending_by_category(user_id: str) -> list[dict]:
    txns = [t for t in _transactions if t.get("user_id") == user_id]
    cats: dict[str, float] = {}
    for t in txns:
        cat = t.get("category", "Unknown")
        cats[cat] = cats.get(cat, 0) + t.get("amount", 0)
    return [{"category": k, "total": v} for k, v in cats.items()]


def get_spending_by_day(user_id: str) -> list[dict]:
    txns = [t for t in _transactions if t.get("user_id") == user_id]
    days: dict[str, float] = {}
    for t in txns:
        day = str(t.get("day", 0))
        days[day] = days.get(day, 0) + t.get("amount", 0)
    return [{"day": k, "amount": v} for k, v in sorted(days.items())]
