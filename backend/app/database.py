import uuid

from app.vector_store import (  # noqa: F401
    get_anomalies,
    get_anomaly_by_id,
    get_narrative_by_anomaly_id,
    get_transactions_by_batch,
    init_vector_store,
    search_similar_transactions,
)
from app.vector_store import (
    insert_anomalies as _insert_anomalies,
)
from app.vector_store import (
    insert_transactions as _insert_transactions,
)


def init_db() -> None:
    init_vector_store()


def create_upload_batch(user_id: str, txn_count: int) -> str:
    return uuid.uuid4().hex[:12]


def update_batch_status(batch_id: str, status: str) -> None:
    pass


def insert_transactions(txns: list[dict], user_id: str, batch_id: str) -> list:
    for txn in txns:
        txn["user_id"] = user_id
        txn["batch_id"] = batch_id
    return _insert_transactions(txns)


def insert_anomalies(anomalies: list[dict], user_id: str) -> None:
    for a in anomalies:
        a["user_id"] = user_id
    _insert_anomalies(anomalies)


def insert_narrative(anomaly_id: int, text: str) -> int:
    from app.vector_store import upsert_narrative

    return upsert_narrative(anomaly_id, text)


def update_narrative_audio(narrative_id: int, audio_data: bytes) -> None:
    pass
