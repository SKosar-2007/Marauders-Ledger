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
    global _client, _vectorai_available
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

        existing = set(_client.collections.list())
        for name in COLLECTIONS:
            if name not in existing:
                _client.collections.create(
                    name,
                    vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.Cosine),
                )
                print(f"VectorAI: created '{name}' collection")
            else:
                print(f"VectorAI: collection '{name}' exists")

        print(f"VectorAI: all collections ready — {sorted(_client.collections.list())}")
        _vectorai_available = True
        return True
    except Exception as e:
        print(f"VectorAI: connection failed ({e}) — using SQLite fallback")
        _vectorai_available = False
        _client = None
        return False


def is_vectorai_available() -> bool:
    return _vectorai_available and _client is not None


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
        vec = _encode_transaction(payload)
        points.append(PointStruct(id=pid, vector=vec, payload=payload))
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
        vec = _encode_transaction(payload)
        points.append(PointStruct(id=pid, vector=vec, payload=payload))
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
            vec = _encode_text(text)
            _client.points.upsert("narratives", [PointStruct(id=p.id, vector=vec, payload=p.payload)])
            return p.id

    pid = _fb_gen_id()
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
    results = _client.points.search("transactions", vector=vector, limit=limit)
    return [r.payload for r in results]


def search_similar_anomalies(vector: list[float], limit: int = 10) -> list[dict]:
    if not is_vectorai_available():
        return []
    results = _client.points.search("anomalies", vector=vector, limit=limit)
    return [r.payload for r in results]


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
