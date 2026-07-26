"""
Actian VectorAI — Primary database for The Marauder's Ledger.
Community Edition with license key configured.
Falls back to SQLite when VectorAI is unavailable.
"""
import json
import math
import os
import sqlite3
import threading
import uuid
from hashlib import md5
from typing import Optional

import numpy as np

VECTOR_DIM = 128
COLLECTIONS = {"transactions", "anomalies", "narratives"}

# Lazy imports for VectorAI FilterBuilder (avoids ImportError when package is absent)
_Field = None
_FilterBuilder = None


def _ensure_filter_imports():
    global _Field, _FilterBuilder
    if _Field is None:
        try:
            from actian_vectorai import Field, FilterBuilder
            _Field = Field
            _FilterBuilder = FilterBuilder
        except ImportError:
            pass

VECTORAI_HOST = os.getenv("VECTORAI_HOST", "localhost")
VECTORAI_PORT = os.getenv("VECTORAI_PORT", "6574")
VECTORAI_LICENSE = os.getenv("VECTORAI_LICENSE_KEY") or os.getenv("VECTORAI_LICENSE") or ""

_client = None
_vectorai_available = False
_use_named_vectors = False
_fallback_conn: Optional[sqlite3.Connection] = None
_fallback_lock = threading.Lock()
_next_id: int = 1
_next_id_lock = threading.Lock()


def _try_import():
    global _vectorai_available
    try:
        # Try the primary package name first, then a couple of likely variants
        try:
            from actian_vectorai import VectorAIClient  # type: ignore
        except Exception:
            try:
                # some installs expose a slightly different module name
                from actian_vectorai_client import VectorAIClient  # type: ignore
            except Exception:
                # final fallback: try the hyphenated package import alias
                from actian_vectorai import VectorAIClient  # type: ignore
        _vectorai_available = True
        return True
    except ImportError:
        print("VectorAI: actian_vectorai package not installed — falling back to SQLite")
        return False
    except Exception as e:
        print(f"VectorAI: import failed ({e}) — falling back to SQLite")
        return False


def _get_fallback_conn() -> sqlite3.Connection:
    global _fallback_conn
    with _fallback_lock:
        if _fallback_conn is None:
            db_path = os.getenv("DATABASE_PATH", "marauders.db")
            _fallback_conn = sqlite3.connect(db_path, check_same_thread=False)
            _fallback_conn.row_factory = sqlite3.Row
            _fallback_conn.execute("PRAGMA journal_mode=WAL")
            _fallback_conn.execute("PRAGMA foreign_keys=ON")
            _init_fallback_tables(_fallback_conn)
            # initialize internal id generator to avoid collisions
            try:
                cur = _fallback_conn.execute(
                    "SELECT MAX(id) as m1 FROM vector_transactions"
                ).fetchone()
                m1 = cur["m1"] if cur and cur["m1"] is not None else 0
                cur = _fallback_conn.execute(
                    "SELECT MAX(id) as m2 FROM vector_anomalies"
                ).fetchone()
                m2 = cur["m2"] if cur and cur["m2"] is not None else 0
                cur = _fallback_conn.execute(
                    "SELECT MAX(id) as m3 FROM vector_narratives"
                ).fetchone()
                m3 = cur["m3"] if cur and cur["m3"] is not None else 0
                maxid = max(m1, m2, m3, 0)
                with _next_id_lock:
                    global _next_id
                    _next_id = maxid + 1
            except Exception:
                # non-fatal: keep default _next_id
                pass
        return _fallback_conn


def _init_fallback_tables(conn: sqlite3.Connection):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS vector_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT, user_id INTEGER, amount REAL, category TEXT,
            merchant TEXT, hour INTEGER, day INTEGER, timestamp TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS vector_anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER, txn_id INTEGER, amount REAL, category TEXT,
            merchant TEXT, hour INTEGER, day INTEGER,
            isolation_score REAL DEFAULT 0, rule_score REAL DEFAULT 0,
            final_score REAL DEFAULT 0, is_anomaly INTEGER DEFAULT 0,
            severity TEXT DEFAULT 'low', triggered_rules TEXT DEFAULT '[]',
            status TEXT DEFAULT 'pending', detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS vector_narratives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anomaly_id INTEGER UNIQUE, text TEXT, audio_data BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_vt_batch ON vector_transactions(batch_id);
        CREATE INDEX IF NOT EXISTS idx_vt_user ON vector_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_va_user ON vector_anomalies(user_id);
    """)
    conn.commit()


# ─── VectorAI Connection ───

def init_vector_store() -> bool:
    global _client, _vectorai_available, _use_named_vectors
    if not _try_import():
        return False
    try:
        from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
        from actian_vectorai import VectorAIClient, VectorParams, Distance

        os.environ["VECTORAI_LICENSE_KEY"] = VECTORAI_LICENSE

        print(f"VectorAI: connecting to {VECTORAI_HOST}:{VECTORAI_PORT} ...")
        _client = VectorAIClient(f"{VECTORAI_HOST}:{VECTORAI_PORT}")

        with ThreadPoolExecutor(1) as pool:
            future = pool.submit(_client.connect)
            future.result(timeout=5)

        info = _client.health_check()
        print(f"VectorAI: {info.get('title', 'VectorAI')} v{info.get('version', '?')} — CONNECTED")

        named_vectors_config = {
            "numerical": VectorParams(size=VECTOR_DIM, distance=Distance.Cosine),
            "semantic": VectorParams(size=VECTOR_DIM, distance=Distance.Cosine),
        }
        single_vector_config = VectorParams(size=VECTOR_DIM, distance=Distance.Cosine)

        existing = set(_client.collections.list())
        for name in COLLECTIONS:
            if name not in existing:
                try:
                    _client.collections.create(name, vectors_config=named_vectors_config)
                    _use_named_vectors = True
                    print(f"VectorAI: created '{name}' collection with named vectors")
                except Exception:
                    _client.collections.create(name, vectors_config=single_vector_config)
                    print(f"VectorAI: created '{name}' collection (single vector)")
            else:
                print(f"VectorAI: collection '{name}' exists")

        if not _use_named_vectors:
            try:
                from actian_vectorai import PointStruct as _PS
                _probe_id = 999999999
                _client.points.upsert("transactions", [
                    _PS(id=_probe_id, vector={"numerical": [0.0]*128, "semantic": [0.0]*128}, payload={}),
                ])
                _client.points.delete("transactions", ids=[_probe_id])
                _use_named_vectors = True
                print("VectorAI: named vectors are supported")
            except Exception:
                _use_named_vectors = False
                print("VectorAI: named vectors NOT supported — using single vector mode")

        print(f"VectorAI: all collections ready — {sorted(_client.collections.list())}")
        _vectorai_available = True
        return True
    except Exception as e:
        print(f"VectorAI: connection failed ({e}) — using SQLite fallback")
        _vectorai_available = False
        _client = None
        return False


def is_vectorai_available() -> bool:
    global _vectorai_available
    if _vectorai_available and _client is not None:
        try:
            _client.health_check()
            return True
        except Exception:
            _vectorai_available = False
    if not _vectorai_available and _try_import():
        try:
            init_vector_store()
            return _vectorai_available
        except Exception:
            return False
    return False


# ─── Vector Encoding ───

def _encode_transaction(txn: dict) -> list[float]:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    idx = 0

    vec[idx] = min(txn.get("amount", 0) / 50000.0, 1.0)
    idx += 1

    hour = txn.get("hour", 12)
    vec[idx] = math.sin(2 * math.pi * hour / 24)
    vec[idx + 1] = math.cos(2 * math.pi * hour / 24)
    idx += 2

    day = txn.get("day", 0)
    vec[idx] = math.sin(2 * math.pi * day / 7)
    vec[idx + 1] = math.cos(2 * math.pi * day / 7)
    idx += 2

    cat_hash = int(md5(txn.get("category", "").encode()).hexdigest()[:8], 16)
    vec[idx + cat_hash % 32] = 1.0
    idx += 32

    merch_hash = int(md5(txn.get("merchant", "").encode()).hexdigest()[:8], 16)
    vec[idx + merch_hash % 32] = 1.0
    idx += 32

    id_hash = int(md5(str(txn.get("id", txn.get("txn_id", ""))).encode()).hexdigest()[:8], 16)
    vec[idx + id_hash % max(VECTOR_DIM - idx, 1)] = 1.0

    return vec.tolist()


def _encode_text(text: str) -> list[float]:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    for i, ch in enumerate(text[:VECTOR_DIM]):
        vec[i] = ord(ch) / 255.0
    return vec.tolist()


def _encode_semantic(text: str) -> list[float]:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    t = text.lower()
    for i in range(len(t) - 2):
        trigram = t[i:i+3]
        h = int(md5(trigram.encode()).hexdigest()[:8], 16)
        vec[h % VECTOR_DIM] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec.tolist()


# ─── Transactions ───

def insert_transactions(txns: list[dict], user_id: int, batch_id: str) -> list[int]:
    if is_vectorai_available():
        return _vt_insert_transactions(txns, user_id, batch_id)
    return _fb_insert_transactions(txns, user_id, batch_id)


def _vt_insert_transactions(txns: list[dict], user_id: int, batch_id: str) -> list[int]:
    from actian_vectorai import PointStruct
    points = []
    ids = []
    for txn in txns:
        pid = txn.get("txn_id") or _fb_gen_id()
        payload = {**txn, "user_id": user_id, "batch_id": batch_id, "txn_id": pid}
        numeric_vec = _encode_transaction(payload)
        if _use_named_vectors:
            semantic_text = f"{payload.get('merchant', '')} {payload.get('category', '')}"
            semantic_vec = _encode_semantic(semantic_text)
            points.append(PointStruct(
                id=pid,
                vector={"numerical": numeric_vec, "semantic": semantic_vec},
                payload=payload,
            ))
        else:
            points.append(PointStruct(id=pid, vector=numeric_vec, payload=payload))
        ids.append(pid)
    _client.points.upsert("transactions", points)
    return ids


def _fb_insert_transactions(txns: list[dict], user_id: int, batch_id: str) -> list[int]:
    conn = _get_fallback_conn()
    with _fallback_lock:
        rows_data = []
        for txn in txns:
            rows_data.append((
                batch_id, user_id, txn.get("amount"), txn.get("category"), txn.get("merchant"),
                txn.get("hour"), txn.get("day"), txn.get("timestamp"),
            ))
        cur = conn.executemany(
            """INSERT INTO vector_transactions (batch_id, user_id, amount, category, merchant, hour, day, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            rows_data,
        )
        conn.commit()
        first_id = cur.lastrowid
        return list(range(first_id, first_id + len(rows_data)))


def get_transactions_by_batch(batch_id: str) -> list[dict]:
    if is_vectorai_available():
        return _vt_get_transactions_by_batch(batch_id)
    return _fb_get_transactions_by_batch(batch_id)


def _vt_get_transactions_by_batch(batch_id: str) -> list[dict]:
    results = []
    next_offset = None
    _ensure_filter_imports()
    try:
        filt = _FilterBuilder().must(_Field("batch_id").eq(batch_id)).build() if _FilterBuilder else None
    except Exception:
        filt = None
    while True:
        kwargs = dict(limit=100, offset=next_offset, with_payload=True, with_vectors=False)
        if filt is not None:
            kwargs["filter"] = filt
        page = _client.points.scroll("transactions", **kwargs)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            results.append({**p.payload, "txn_id": p.id})
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return results


def _fb_get_transactions_by_batch(batch_id: str) -> list[dict]:
    conn = _get_fallback_conn()
    rows = conn.execute("SELECT * FROM vector_transactions WHERE batch_id = ?", (batch_id,)).fetchall()
    return [dict(r) for r in rows]


def get_transactions_by_user(user_id: int, offset: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    if is_vectorai_available():
        return _vt_get_transactions_by_user_paged(user_id, offset, limit)
    return _fb_get_transactions_by_user_paged(user_id, offset, limit)


def get_transactions_by_user_all(user_id: int) -> list[dict]:
    if is_vectorai_available():
        return _vt_get_transactions_by_user(user_id)
    return _fb_get_transactions_by_user(user_id)


def _vt_get_transactions_by_user(user_id: int) -> list[dict]:
    results = []
    next_offset = None
    _ensure_filter_imports()
    try:
        filt = _FilterBuilder().must(_Field("user_id").eq(user_id)).build() if _FilterBuilder else None
    except Exception:
        filt = None
    while True:
        kwargs = dict(limit=100, offset=next_offset, with_payload=True, with_vectors=False)
        if filt is not None:
            kwargs["filter"] = filt
        page = _client.points.scroll("transactions", **kwargs)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            results.append({**p.payload, "txn_id": p.id})
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return results


def _fb_get_transactions_by_user(user_id: int) -> list[dict]:
    conn = _get_fallback_conn()
    rows = conn.execute(
        "SELECT * FROM vector_transactions WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def _vt_get_transactions_by_user_paged(user_id: int, offset: int, limit: int) -> tuple[list[dict], int]:
    _ensure_filter_imports()
    try:
        filt = _FilterBuilder().must(_Field("user_id").eq(user_id)).build()
    except Exception:
        filt = None
    count_kwargs = dict(count_filter=filt) if filt else {}
    try:
        total = _client.points.count("transactions", **count_kwargs)
    except Exception:
        total = None
    scroll_kwargs = dict(limit=limit, offset=offset, with_payload=True, with_vectors=False)
    if filt is not None:
        scroll_kwargs["filter"] = filt
    page = _client.points.scroll("transactions", **scroll_kwargs)
    points = page[0] if isinstance(page, tuple) else page
    results = [{**p.payload, "txn_id": p.id} for p in points]
    if total is None:
        total = len(results) + offset
    return results, total


def _fb_get_transactions_by_user_paged(user_id: int, offset: int, limit: int) -> tuple[list[dict], int]:
    conn = _get_fallback_conn()
    total = conn.execute(
        "SELECT COUNT(*) FROM vector_transactions WHERE user_id = ?", (user_id,)
    ).fetchone()[0]
    rows = conn.execute(
        "SELECT * FROM vector_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (user_id, limit, offset),
    ).fetchall()
    return [dict(r) for r in rows], total


# ─── Anomalies ───

def insert_anomalies(anomalies: list[dict], user_id: int) -> list[int]:
    if is_vectorai_available():
        return _vt_insert_anomalies(anomalies, user_id)
    return _fb_insert_anomalies(anomalies, user_id)


def _vt_insert_anomalies(anomalies: list[dict], user_id: int) -> list[int]:
    from actian_vectorai import PointStruct
    points = []
    ids = []
    for a in anomalies:
        pid = a.get("anomaly_id") or _fb_gen_id()
        rules = a.get("triggered_rules", [])
        if isinstance(rules, list):
            rules_str = json.dumps(rules)
        else:
            rules_str = rules
        payload = {
            **a, "user_id": user_id, "anomaly_id": pid,
            "triggered_rules": rules_str,
            "is_anomaly": 1 if a.get("is_anomaly") else 0,
        }
        numeric_vec = _encode_transaction(payload)
        if _use_named_vectors:
            semantic_text = f"{payload.get('merchant', '')} {payload.get('category', '')}"
            semantic_vec = _encode_semantic(semantic_text)
            points.append(PointStruct(
                id=pid,
                vector={"numerical": numeric_vec, "semantic": semantic_vec},
                payload=payload,
            ))
        else:
            points.append(PointStruct(id=pid, vector=numeric_vec, payload=payload))
        ids.append(pid)
    if points:
        _client.points.upsert("anomalies", points)
    return ids


def _fb_insert_anomalies(anomalies: list[dict], user_id: int) -> list[int]:
    conn = _get_fallback_conn()
    with _fallback_lock:
        rows_data = []
        for a in anomalies:
            rules = a.get("triggered_rules", [])
            if isinstance(rules, list):
                rules = json.dumps(rules)
            rows_data.append((
                user_id, a.get("txn_id"), a.get("amount"), a.get("category"), a.get("merchant"),
                a.get("hour"), a.get("day"), a.get("isolation_score", 0), a.get("rule_score", 0),
                a.get("final_score", 0), 1 if a.get("is_anomaly") else 0, a.get("severity", "low"),
                rules, a.get("detected_at"),
            ))
        cur = conn.executemany(
            """INSERT INTO vector_anomalies (user_id, txn_id, amount, category, merchant, hour, day,
               isolation_score, rule_score, final_score, is_anomaly, severity, triggered_rules, detected_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            rows_data,
        )
        conn.commit()
        first_id = cur.lastrowid
        return list(range(first_id, first_id + len(rows_data)))


def get_anomalies(user_id: Optional[int] = None, severity: Optional[str] = None, offset: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    if is_vectorai_available():
        return _vt_get_anomalies_paged(user_id, severity, offset, limit)
    return _fb_get_anomalies_paged(user_id, severity, offset, limit)


def get_anomalies_all(user_id: Optional[int] = None, severity: Optional[str] = None) -> list[dict]:
    if is_vectorai_available():
        return _vt_get_anomalies(user_id, severity)
    return _fb_get_anomalies(user_id, severity)


def _vt_get_anomalies(user_id: Optional[int] = None, severity: Optional[str] = None) -> list[dict]:
    results = []
    next_offset = None
    _ensure_filter_imports()
    filt = None
    if _FilterBuilder:
        try:
            builder = _FilterBuilder().must(_Field("is_anomaly").eq(1))
            if user_id is not None:
                builder = builder.must(_Field("user_id").eq(user_id))
            if severity:
                builder = builder.must(_Field("severity").eq(severity))
            filt = builder.build()
        except Exception:
            filt = None
    while True:
        kwargs = dict(limit=100, offset=next_offset, with_payload=True, with_vectors=False)
        if filt is not None:
            kwargs["filter"] = filt
        page = _client.points.scroll("anomalies", **kwargs)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            d = {**p.payload, "anomaly_id": p.id}
            if isinstance(d.get("triggered_rules"), str):
                try:
                    d["triggered_rules"] = json.loads(d["triggered_rules"])
                except (json.JSONDecodeError, TypeError):
                    d["triggered_rules"] = []
            results.append(d)
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return results


def _fb_get_anomalies(user_id: Optional[int] = None, severity: Optional[str] = None) -> list[dict]:
    conn = _get_fallback_conn()
    query = "SELECT * FROM vector_anomalies WHERE is_anomaly = 1"
    params: list = []
    if user_id is not None:
        query += " AND user_id = ?"
        params.append(user_id)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    query += " ORDER BY detected_at DESC"
    rows = conn.execute(query, params).fetchall()
    results = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get("triggered_rules"), str):
            try:
                d["triggered_rules"] = json.loads(d["triggered_rules"])
            except (json.JSONDecodeError, TypeError):
                d["triggered_rules"] = []
        results.append(d)
    return results


def _build_anomaly_filter(user_id: Optional[int], severity: Optional[str]):
    _ensure_filter_imports()
    if not _FilterBuilder:
        return None
    try:
        builder = _FilterBuilder().must(_Field("is_anomaly").eq(1))
        if user_id is not None:
            builder = builder.must(_Field("user_id").eq(user_id))
        if severity:
            builder = builder.must(_Field("severity").eq(severity))
        return builder.build()
    except Exception:
        return None


def _parse_anomaly_point(p) -> dict:
    d = {**p.payload, "anomaly_id": p.id}
    if isinstance(d.get("triggered_rules"), str):
        try:
            d["triggered_rules"] = json.loads(d["triggered_rules"])
        except (json.JSONDecodeError, TypeError):
            d["triggered_rules"] = []
    return d


def _vt_get_anomalies_paged(user_id: Optional[int], severity: Optional[str], offset: int, limit: int) -> tuple[list[dict], int]:
    filt = _build_anomaly_filter(user_id, severity)
    count_kwargs = dict(count_filter=filt) if filt else {}
    try:
        total = _client.points.count("anomalies", **count_kwargs)
    except Exception:
        total = None
    scroll_kwargs = dict(limit=limit, offset=offset, with_payload=True, with_vectors=False)
    if filt is not None:
        scroll_kwargs["filter"] = filt
    page = _client.points.scroll("anomalies", **scroll_kwargs)
    points = page[0] if isinstance(page, tuple) else page
    results = [_parse_anomaly_point(p) for p in points]
    if total is None:
        total = len(results) + offset
    return results, total


def _fb_get_anomalies_paged(user_id: Optional[int], severity: Optional[str], offset: int, limit: int) -> tuple[list[dict], int]:
    conn = _get_fallback_conn()
    where = "WHERE is_anomaly = 1"
    params: list = []
    if user_id is not None:
        where += " AND user_id = ?"
        params.append(user_id)
    if severity:
        where += " AND severity = ?"
        params.append(severity)
    total = conn.execute(f"SELECT COUNT(*) FROM vector_anomalies {where}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM vector_anomalies {where} ORDER BY detected_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    results = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get("triggered_rules"), str):
            try:
                d["triggered_rules"] = json.loads(d["triggered_rules"])
            except (json.JSONDecodeError, TypeError):
                d["triggered_rules"] = []
        results.append(d)
    return results, total


def get_anomaly_by_id(anomaly_id: int) -> Optional[dict]:
    if is_vectorai_available():
        return _vt_get_anomaly_by_id(anomaly_id)
    return _fb_get_anomaly_by_id(anomaly_id)


def _vt_get_anomaly_by_id(anomaly_id: int) -> Optional[dict]:
    points = _client.points.get("anomalies", ids=[anomaly_id])
    if not points:
        return None
    d = {**points[0].payload, "anomaly_id": points[0].id}
    if isinstance(d.get("triggered_rules"), str):
        try:
            d["triggered_rules"] = json.loads(d["triggered_rules"])
        except (json.JSONDecodeError, TypeError):
            d["triggered_rules"] = []
    return d


def _fb_get_anomaly_by_id(anomaly_id: int) -> Optional[dict]:
    conn = _get_fallback_conn()
    row = conn.execute("SELECT * FROM vector_anomalies WHERE id = ?", (anomaly_id,)).fetchone()
    if not row:
        return None
    d = dict(row)
    d["anomaly_id"] = d["id"]
    if isinstance(d.get("triggered_rules"), str):
        try:
            d["triggered_rules"] = json.loads(d["triggered_rules"])
        except (json.JSONDecodeError, TypeError):
            d["triggered_rules"] = []
    return d


def update_anomaly_status(anomaly_id: int, status: str) -> bool:
    if is_vectorai_available():
        return _vt_update_anomaly_status(anomaly_id, status)
    return _fb_update_anomaly_status(anomaly_id, status)


def _vt_update_anomaly_status(anomaly_id: int, status: str) -> bool:
    points = _client.points.get("anomalies", ids=[anomaly_id], with_vectors=True)
    if not points:
        return False
    p = points[0]
    p.payload["status"] = status
    from actian_vectorai import PointStruct
    vec = getattr(p, "vectors", None) or getattr(p, "vector", None) or []
    _client.points.upsert("anomalies", [PointStruct(id=p.id, vector=vec, payload=p.payload)])
    return True


def _fb_update_anomaly_status(anomaly_id: int, status: str) -> bool:
    conn = _get_fallback_conn()
    cur = conn.execute("UPDATE vector_anomalies SET status = ? WHERE id = ?", (status, anomaly_id))
    conn.commit()
    return cur.rowcount > 0


# ─── Narratives ───

def insert_narrative(anomaly_id: int, text: str) -> int:
    if is_vectorai_available():
        return _vt_insert_narrative(anomaly_id, text)
    return _fb_insert_narrative(anomaly_id, text)


def _vt_insert_narrative(anomaly_id: int, text: str) -> int:
    from actian_vectorai import PointStruct
    _ensure_filter_imports()
    filt = None
    if _FilterBuilder:
        try:
            filt = _FilterBuilder().must(_Field("anomaly_id").eq(anomaly_id)).build()
        except Exception:
            filt = None
    kwargs = dict(limit=10, with_payload=True, with_vectors=True)
    if filt is not None:
        kwargs["filter"] = filt
    page = _client.points.scroll("narratives", **kwargs)
    points = page[0] if isinstance(page, tuple) else page
    for p in points:
        if p.payload.get("anomaly_id") == anomaly_id:
            p.payload["text"] = text
            if _use_named_vectors:
                vec = {"numerical": _encode_text(text), "semantic": _encode_semantic(text)}
            else:
                vec = _encode_text(text)
            _client.points.upsert("narratives", [PointStruct(id=p.id, vector=vec, payload=p.payload)])
            return p.id

    pid = _fb_gen_id()
    if _use_named_vectors:
        vec = {"numerical": _encode_text(text), "semantic": _encode_semantic(text)}
    else:
        vec = _encode_text(text)
    _client.points.upsert(
        "narratives",
        [PointStruct(id=pid, vector=vec, payload={"anomaly_id": anomaly_id, "text": text})],
    )
    return pid


def _fb_insert_narrative(anomaly_id: int, text: str) -> int:
    conn = _get_fallback_conn()
    existing = conn.execute("SELECT id FROM vector_narratives WHERE anomaly_id = ?", (anomaly_id,)).fetchone()
    if existing:
        conn.execute("UPDATE vector_narratives SET text = ? WHERE anomaly_id = ?", (text, anomaly_id))
        conn.commit()
        return existing["id"]
    cur = conn.execute("INSERT INTO vector_narratives (anomaly_id, text) VALUES (?, ?)", (anomaly_id, text))
    conn.commit()
    return cur.lastrowid


def get_narrative_by_anomaly_id(anomaly_id: int) -> Optional[dict]:
    if is_vectorai_available():
        return _vt_get_narrative_by_anomaly_id(anomaly_id)
    return _fb_get_narrative_by_anomaly_id(anomaly_id)


def _vt_get_narrative_by_anomaly_id(anomaly_id: int) -> Optional[dict]:
    next_offset = None
    _ensure_filter_imports()
    filt = None
    if _FilterBuilder:
        try:
            filt = _FilterBuilder().must(_Field("anomaly_id").eq(anomaly_id)).build()
        except Exception:
            filt = None
    while True:
        kwargs = dict(limit=100, offset=next_offset, with_payload=True, with_vectors=False)
        if filt is not None:
            kwargs["filter"] = filt
        page = _client.points.scroll("narratives", **kwargs)
        points = page[0] if isinstance(page, tuple) else page
        for p in points:
            if p.payload.get("anomaly_id") == anomaly_id:
                return {**p.payload, "narrative_id": p.id}
        if isinstance(page, tuple) and len(page) > 1 and page[1]:
            next_offset = page[1]
        else:
            break
    return None


def _fb_get_narrative_by_anomaly_id(anomaly_id: int) -> Optional[dict]:
    conn = _get_fallback_conn()
    row = conn.execute("SELECT * FROM vector_narratives WHERE anomaly_id = ?", (anomaly_id,)).fetchone()
    return dict(row) if row else None


def update_narrative_audio(narrative_id: int, audio_data: bytes):
    if is_vectorai_available():
        _vt_update_narrative_audio(narrative_id, audio_data)
    else:
        _fb_update_narrative_audio(narrative_id, audio_data)


def _vt_update_narrative_audio(narrative_id: int, audio_data: bytes):
    points = _client.points.get("narratives", ids=[narrative_id], with_vectors=True)
    if points:
        p = points[0]
        p.payload["audio_data"] = audio_data.hex()
        from actian_vectorai import PointStruct
        vec = getattr(p, "vectors", None) or getattr(p, "vector", None) or []
        _client.points.upsert("narratives", [PointStruct(id=p.id, vector=vec, payload=p.payload)])


def _fb_update_narrative_audio(narrative_id: int, audio_data: bytes):
    conn = _get_fallback_conn()
    conn.execute("UPDATE vector_narratives SET audio_data = ? WHERE id = ?", (audio_data, narrative_id))
    conn.commit()


# ─── Spending Aggregations ───

def get_spending_by_category(user_id: int) -> list[dict]:
    if is_vectorai_available():
        txns = _vt_get_transactions_by_user(user_id)
    else:
        txns = _fb_get_transactions_by_user(user_id)
    cats: dict[str, float] = {}
    for t in txns:
        cat = t.get("category", "Unknown")
        cats[cat] = cats.get(cat, 0) + t.get("amount", 0)
    return [{"category": k, "total": v} for k, v in cats.items()]


def get_spending_by_day(user_id: int) -> list[dict]:
    if is_vectorai_available():
        txns = _vt_get_transactions_by_user(user_id)
    else:
        txns = _fb_get_transactions_by_user(user_id)
    days: dict[str, float] = {}
    for t in txns:
        ts = t.get("timestamp", "")
        if ts and isinstance(ts, str) and len(ts) >= 10:
            day = ts[:10]
        else:
            day = str(t.get("day", 0))
        days[day] = days.get(day, 0) + t.get("amount", 0)
    return [{"day": k, "amount": v} for k, v in sorted(days.items())]


# ─── Similarity Search (VectorAI-only feature) ───

def search_similar_transactions(vector: list[float], limit: int = 10) -> list[dict]:
    if not is_vectorai_available():
        return []
    kwargs = dict(vector=vector, limit=limit)
    if _use_named_vectors:
        kwargs["using"] = "numerical"
    results = _client.points.search("transactions", **kwargs)
    return [r.payload for r in results]


def search_similar_anomalies(vector: list[float], limit: int = 10) -> list[dict]:
    if not is_vectorai_available():
        return []
    kwargs = dict(vector=vector, limit=limit)
    if _use_named_vectors:
        kwargs["using"] = "numerical"
    results = _client.points.search("anomalies", **kwargs)
    return [r.payload for r in results]


# ─── Filtered Search ───

def _build_search_filter(
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
):
    _ensure_filter_imports()
    if not _FilterBuilder:
        return None
    try:
        builder = _FilterBuilder()
        if category is not None:
            builder = builder.must(_Field("category").eq(category))
        if merchant is not None:
            builder = builder.must(_Field("merchant").eq(merchant))
        if amount_min is not None:
            builder = builder.must(_Field("amount").gte(amount_min))
        if amount_max is not None:
            builder = builder.must(_Field("amount").lte(amount_max))
        if severity is not None:
            builder = builder.must(_Field("severity").eq(severity))
        if status is not None:
            builder = builder.must(_Field("status").eq(status))
        if batch_id is not None:
            builder = builder.must(_Field("batch_id").eq(batch_id))
        if user_id is not None:
            builder = builder.must(_Field("user_id").eq(user_id))
        return builder.build()
    except Exception:
        return None


def filtered_search_transactions(
    query_vector: Optional[list[float]] = None,
    vector_name: str = "numerical",
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    if not is_vectorai_available() or query_vector is None:
        return _fb_filtered_search_transactions(category, merchant, amount_min, amount_max, batch_id, user_id, limit)
    filt = _build_search_filter(category=category, merchant=merchant, amount_min=amount_min, amount_max=amount_max, batch_id=batch_id, user_id=user_id)
    kwargs = dict(vector=query_vector, limit=limit, with_payload=True)
    if _use_named_vectors:
        kwargs["using"] = vector_name
    if filt is not None:
        kwargs["filter"] = filt
    results = _client.points.search("transactions", **kwargs)
    return [{**r.payload, "txn_id": r.id, "score": r.score} for r in results]


def _fb_filtered_search_transactions(
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    conn = _get_fallback_conn()
    where = []
    params: list = []
    if category is not None:
        where.append("category = ?")
        params.append(category)
    if merchant is not None:
        where.append("merchant = ?")
        params.append(merchant)
    if amount_min is not None:
        where.append("amount >= ?")
        params.append(amount_min)
    if amount_max is not None:
        where.append("amount <= ?")
        params.append(amount_max)
    if batch_id is not None:
        where.append("batch_id = ?")
        params.append(batch_id)
    if user_id is not None:
        where.append("user_id = ?")
        params.append(user_id)
    where_clause = " AND ".join(where) if where else "1"
    rows = conn.execute(
        f"SELECT * FROM vector_transactions WHERE {where_clause} ORDER BY created_at DESC LIMIT ?",
        params + [limit],
    ).fetchall()
    return [dict(r) for r in rows]


def filtered_search_anomalies(
    query_vector: Optional[list[float]] = None,
    vector_name: str = "numerical",
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    if not is_vectorai_available() or query_vector is None:
        return _fb_filtered_search_anomalies(category, merchant, severity, status, batch_id, user_id, limit)
    filt = _build_search_filter(category=category, merchant=merchant, severity=severity, status=status, batch_id=batch_id, user_id=user_id)
    kwargs = dict(vector=query_vector, limit=limit, with_payload=True)
    if _use_named_vectors:
        kwargs["using"] = vector_name
    if filt is not None:
        kwargs["filter"] = filt
    results = _client.points.search("anomalies", **kwargs)
    return [{**r.payload, "anomaly_id": r.id, "score": r.score} for r in results]


def _fb_filtered_search_anomalies(
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    conn = _get_fallback_conn()
    where = ["is_anomaly = 1"]
    params: list = []
    if category is not None:
        where.append("category = ?")
        params.append(category)
    if merchant is not None:
        where.append("merchant = ?")
        params.append(merchant)
    if severity is not None:
        where.append("severity = ?")
        params.append(severity)
    if status is not None:
        where.append("status = ?")
        params.append(status)
    if batch_id is not None:
        where.append("batch_id = ?")
        params.append(batch_id)
    if user_id is not None:
        where.append("user_id = ?")
        params.append(user_id)
    rows = conn.execute(
        f"SELECT * FROM vector_anomalies WHERE {' AND '.join(where)} ORDER BY detected_at DESC LIMIT ?",
        params + [limit],
    ).fetchall()
    results = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get("triggered_rules"), str):
            try:
                d["triggered_rules"] = json.loads(d["triggered_rules"])
            except (json.JSONDecodeError, TypeError):
                d["triggered_rules"] = []
        results.append(d)
    return results


# ─── Hybrid Fusion (vector + keyword) ───

def hybrid_search_transactions(
    query_text: str,
    query_vector: Optional[list[float]] = None,
    category: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
) -> list[dict]:
    if not is_vectorai_available():
        return _fb_filtered_search_transactions(category=category, user_id=user_id, limit=limit)

    steps = 3
    results: dict[int, dict] = {}
    vector_ranks: dict[int, int] = {}
    keyword_ranks: dict[int, int] = {}

    step_stride = max(limit * steps, 60)

    if query_vector is not None:
        filt = _build_search_filter(category=category, user_id=user_id)
        kwargs = dict(vector=query_vector, limit=step_stride, with_payload=True)
        if _use_named_vectors:
            kwargs["using"] = "numerical"
        if filt is not None:
            kwargs["filter"] = filt
        try:
            vt_results = _client.points.search("transactions", **kwargs)
            for rank, r in enumerate(vt_results):
                pid = r.id if hasattr(r, "id") else hash(str(r.payload))
                if pid not in vector_ranks:
                    vector_ranks[pid] = rank
                results.setdefault(pid, {**r.payload, "txn_id": pid})["_vector_score"] = r.score
        except Exception:
            pass

    if query_text:
        tokens = [t.lower() for t in query_text.split() if len(t) > 2]
        _ensure_filter_imports()
        if _FilterBuilder and tokens:
            try:
                builder = _FilterBuilder()
                for token in tokens:
                    builder = builder.should(_Field("merchant").match(token))
                    builder = builder.should(_Field("category").match(token))
                if category is not None:
                    builder = builder.must(_Field("category").eq(category))
                if user_id is not None:
                    builder = builder.must(_Field("user_id").eq(user_id))
                builder = builder.build()
                kw_results = _client.points.scroll("transactions", limit=step_stride, filter=builder, with_payload=True, with_vectors=False)
                kw_points = kw_results[0] if isinstance(kw_results, tuple) else kw_results
                for rank, r in enumerate(kw_points):
                    pid = r.id if hasattr(r, "id") else hash(str(r.payload))
                    if pid not in keyword_ranks:
                        keyword_ranks[pid] = rank
                    results.setdefault(pid, {**r.payload, "txn_id": pid})["_keyword_match"] = True
            except Exception:
                pass

    scored = []
    const_k = 60
    for pid, item in results.items():
        vr = vector_ranks.get(pid)
        kr = keyword_ranks.get(pid)
        fusion_score = 0.0
        if vr is not None:
            fusion_score += 1.0 / (const_k + vr)
        if kr is not None:
            fusion_score += 1.0 / (const_k + kr)
        item["fusion_score"] = round(fusion_score, 6)
        if vr is not None:
            item["score"] = round(item.get("_vector_score", 0), 6)
        else:
            item["score"] = 0.0
        scored.append(item)

    scored.sort(key=lambda x: x["fusion_score"], reverse=True)
    for item in scored:
        item.pop("_vector_score", None)
        item.pop("_keyword_match", None)

    return scored[:limit]


# ─── Narrative Search ───

def search_narratives(
    query_text: str,
    limit: int = 20,
) -> list[dict]:
    if not is_vectorai_available():
        return _fb_search_narratives(query_text, limit)
    query_vec = _encode_semantic(query_text)
    kwargs = dict(vector=query_vec, limit=limit, with_payload=True)
    if _use_named_vectors:
        kwargs["using"] = "semantic"
    results = _client.points.search("narratives", **kwargs)
    return [{**r.payload, "narrative_id": r.id, "score": r.score} for r in results]


def _fb_search_narratives(query_text: str, limit: int = 20) -> list[dict]:
    conn = _get_fallback_conn()
    tokens = [t.lower() for t in query_text.split() if len(t) > 2]
    if not tokens:
        return []
    like_clauses = " OR ".join(["text LIKE ?" for _ in tokens])
    params = [f"%{t}%" for t in tokens]
    rows = conn.execute(
        f"SELECT * FROM vector_narratives WHERE {like_clauses} ORDER BY created_at DESC LIMIT ?",
        params + [limit],
    ).fetchall()
    return [dict(r) for r in rows]


# ─── Utility ───


def _fb_gen_id() -> int:
    global _next_id
    with _next_id_lock:
        n = _next_id
        _next_id += 1
        return n


# ─── Batch Progress ───

def count_anomalies_by_batch(batch_id: str) -> int:
    if is_vectorai_available():
        return _vt_count_anomalies_by_batch(batch_id)
    return _fb_count_anomalies_by_batch(batch_id)


def _vt_count_anomalies_by_batch(batch_id: str) -> int:
    _ensure_filter_imports()
    try:
        filt = _FilterBuilder().must(_Field("batch_id").eq(batch_id)).build()
        return _client.points.count("anomalies", count_filter=filt)
    except Exception:
        pass
    try:
        return _client.points.count("anomalies")
    except Exception:
        return 0


def _fb_count_anomalies_by_batch(batch_id: str) -> int:
    conn = _get_fallback_conn()
    row = conn.execute("SELECT COUNT(*) FROM vector_anomalies WHERE is_anomaly = 1").fetchone()
    return row[0] if row else 0
