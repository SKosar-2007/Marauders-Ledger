import math
import os
from hashlib import md5

import numpy as np
from actian_vectorai import (
    Distance,
    PointStruct,
    VectorAIClient,
    VectorParams,
)

VECTOR_DIM = 128
COLLECTIONS = {
    "transactions",
    "anomalies",
    "narratives",
}

VECTORAI_HOST = os.getenv("VECTORAI_HOST", "localhost")

_client: VectorAIClient | None = None


def _ensure_collections(client: VectorAIClient) -> None:
    existing = set(client.collections.list())
    for name in COLLECTIONS:
        if name not in existing:
            client.collections.create(
                name,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.Cosine),
            )
            print(f"VectorAI: created '{name}' collection")


def init_vector_store() -> None:
    global _client
    _client = VectorAIClient(f"{VECTORAI_HOST}:6574")
    _client.connect()
    info = _client.health_check()
    print(f"VectorAI: {info['title']} v{info['version']}")
    _ensure_collections(_client)
    print(f"VectorAI: collections ready — {sorted(_client.collections.list())}")


def _get_client() -> VectorAIClient:
    c = _client
    if c is None:
        init_vector_store()
        c = _client
    return c


def _encode_transaction(txn: dict) -> list[float]:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)

    idx = 0
    vec[idx] = min(txn["amount"] / 50000.0, 1.0)
    idx += 1

    hour = txn.get("hour", 12)
    vec[idx] = math.sin(2 * math.pi * hour / 24)
    vec[idx + 1] = math.cos(2 * math.pi * hour / 24)
    idx += 2

    day = txn.get("day", 0)
    vec[idx] = math.sin(2 * math.pi * day / 7)
    vec[idx + 1] = math.cos(2 * math.pi * day / 7)
    idx += 2

    cat_bytes = txn.get("category", "").encode()
    cat_hash = int(md5(cat_bytes).hexdigest()[:8], 16)
    vec[idx + cat_hash % 32] = 1.0
    idx += 32

    merch_bytes = txn.get("merchant", "").encode()
    merch_hash = int(md5(merch_bytes).hexdigest()[:8], 16)
    vec[idx + merch_hash % 32] = 1.0
    idx += 32

    txn_id_hash = int(md5(str(txn.get("txn_id", "")).encode()).hexdigest()[:8], 16)
    vec[idx + txn_id_hash % (VECTOR_DIM - idx)] = 1.0

    return vec.tolist()


_next_id: int = 1


def _gen_id() -> int:
    global _next_id
    n = _next_id
    _next_id += 1
    return n


def insert_transactions(txns: list[dict]) -> list[int]:
    client = _get_client()
    points = []
    ids = []
    for txn in txns:
        pid = txn.get("txn_id") or _gen_id()
        vec = _encode_transaction(txn)
        points.append(PointStruct(id=pid, vector=vec, payload=txn))
        ids.append(pid)
    client.points.upsert("transactions", points)
    return ids


def _with_id(payload: dict, pid: int, id_key: str = "txn_id") -> dict:
    if id_key not in payload:
        payload = {**payload, id_key: pid}
    return payload


def get_transactions_by_batch(batch_id: str) -> list[dict]:
    client = _get_client()
    results = []
    next_offset: str | None = None
    while True:
        page = client.points.scroll("transactions", limit=100, offset=next_offset)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            if p.payload.get("batch_id") == batch_id:
                results.append(_with_id(p.payload, p.id, "txn_id"))
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return results


def get_transaction_by_id(txn_id: int) -> dict | None:
    client = _get_client()
    points = client.points.get("transactions", ids=[txn_id])
    return _with_id(points[0].payload, txn_id, "txn_id") if points else None


def insert_anomalies(anomalies: list[dict]) -> list[int]:
    client = _get_client()
    points = []
    ids = []
    for a in anomalies:
        pid = a.get("anomaly_id") or _gen_id()
        vec = _encode_transaction(a)
        points.append(PointStruct(id=pid, vector=vec, payload=a))
        ids.append(pid)
    if points:
        client.points.upsert("anomalies", points)
    return ids


def get_anomalies(user_id: str | None = None, severity: str | None = None) -> list[dict]:
    client = _get_client()
    results = []
    next_offset: str | None = None
    while True:
        page = client.points.scroll("anomalies", limit=100, offset=next_offset)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            if not p.payload.get("is_anomaly", False):
                continue
            if user_id and p.payload.get("user_id") != user_id:
                continue
            if severity and p.payload.get("severity") != severity:
                continue
            results.append(_with_id(p.payload, p.id, "anomaly_id"))
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return results


def get_anomaly_by_id(anomaly_id: int) -> dict | None:
    client = _get_client()
    points = client.points.get("anomalies", ids=[anomaly_id])
    return _with_id(points[0].payload, anomaly_id, "anomaly_id") if points else None


def upsert_narrative(anomaly_id: int, text: str) -> int:
    client = _get_client()
    existing = client.points.scroll("narratives", limit=100)
    points_list = existing[0] if isinstance(existing, tuple) else existing
    for p in points_list:
        if p.payload.get("anomaly_id") == anomaly_id:
            p.payload["text"] = text
            vec = _encode_text(text)
            client.points.upsert("narratives", [PointStruct(id=p.id, vector=vec, payload=p.payload)])
            return p.id

    pid = _gen_id()
    vec = _encode_text(text)
    client.points.upsert(
        "narratives",
        [PointStruct(id=pid, vector=vec, payload={"anomaly_id": anomaly_id, "text": text})],
    )
    return pid


def get_narrative_by_anomaly_id(anomaly_id: int) -> dict | None:
    client = _get_client()
    next_offset: str | None = None
    while True:
        page = client.points.scroll("narratives", limit=100, offset=next_offset)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            if p.payload.get("anomaly_id") == anomaly_id:
                return {**p.payload, "narrative_id": p.id}
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return None


def search_similar_transactions(vector: list[float], limit: int = 10) -> list[dict]:
    client = _get_client()
    results = client.points.search("transactions", vector=vector, limit=limit)
    return [r.payload for r in results]


def _encode_text(text: str) -> list[float]:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    for i, ch in enumerate(text[:VECTOR_DIM]):
        vec[i] = ord(ch) / 255.0
    return vec.tolist()
