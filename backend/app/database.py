"""
Database router for The Marauder's Ledger.
- Users/auth: always SQLite (relational data)
- Transactions, anomalies, narratives: Actian VectorAI (primary), SQLite fallback
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import uuid
from typing import Optional

from app import vector_store

AUTH_DB_PATH = os.getenv("DATABASE_PATH", "marauders.db")
_auth_conn: Optional[sqlite3.Connection] = None
_auth_lock = threading.Lock()


def _get_auth_conn() -> sqlite3.Connection:
    global _auth_conn
    if _auth_conn is None:
        _auth_conn = sqlite3.connect(AUTH_DB_PATH, check_same_thread=False)
        _auth_conn.row_factory = sqlite3.Row
        _auth_conn.execute("PRAGMA journal_mode=WAL")
        _auth_conn.execute("PRAGMA foreign_keys=ON")
        _auth_conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS batches (
                batch_id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                txn_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'processing',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );
        """)
        _auth_conn.commit()
    return _auth_conn


def init_db():
    _get_auth_conn()
    import time
    # Try to initialize VectorAI (Actian) as primary; if it fails we'll use SQLite fallback
    try:
        vector_store.init_vector_store()
    except Exception:
        # init_vector_store handles its own logging; ensure we continue with SQLite
        pass
    if vector_store.is_vectorai_available():
        print("Database: Actian VectorAI PRIMARY — SQLite for auth only")
        time.sleep(3)
    else:
        print("Database: VectorAI unavailable — using SQLite fallback for vector data")
    _seed_test_data()


# ── User operations (always SQLite, thread-safe) ──

def create_user(email: str, name: str, password_hash: str) -> int:
    with _auth_lock:
        conn = _get_auth_conn()
        cur = conn.execute(
            "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
            (email, name, password_hash),
        )
        conn.commit()
        return cur.lastrowid


def get_user_by_email(email: str) -> Optional[dict]:
    with _auth_lock:
        conn = _get_auth_conn()
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _auth_lock:
        conn = _get_auth_conn()
        row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


# ── Batch operations (SQLite — lightweight metadata, thread-safe) ──

def create_upload_batch(user_id: int, txn_count: int) -> str:
    batch_id = uuid.uuid4().hex[:12]
    with _auth_lock:
        conn = _get_auth_conn()
        conn.execute(
            "INSERT INTO batches (batch_id, user_id, txn_count, status) VALUES (?, ?, ?, 'processing')",
            (batch_id, user_id, txn_count),
        )
        conn.commit()
    return batch_id


def update_batch_status(batch_id: str, status: str):
    with _auth_lock:
        conn = _get_auth_conn()
        conn.execute("UPDATE batches SET status = ? WHERE batch_id = ?", (status, batch_id))
        conn.commit()


def get_batches_by_user(user_id: int) -> list[dict]:
    with _auth_lock:
        conn = _get_auth_conn()
        rows = conn.execute(
            "SELECT * FROM batches WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_batch_by_id(batch_id: str) -> Optional[dict]:
    with _auth_lock:
        conn = _get_auth_conn()
        row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        return dict(row) if row else None


# ── Data operations (VectorAI primary, SQLite fallback) ──

def insert_transactions(txns: list[dict], user_id: int, batch_id: str) -> list[int]:
    return vector_store.insert_transactions(txns, user_id, batch_id)


def get_transactions_by_batch(batch_id: str) -> list[dict]:
    return vector_store.get_transactions_by_batch(batch_id)


def get_transactions_by_user(user_id: int, offset: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    return vector_store.get_transactions_by_user(user_id, offset, limit)


def get_transactions_by_user_all(user_id: int) -> list[dict]:
    return vector_store.get_transactions_by_user_all(user_id)


def insert_anomalies(anomalies: list[dict], user_id: int) -> list[int]:
    return vector_store.insert_anomalies(anomalies, user_id)


def get_anomalies(user_id: Optional[int] = None, severity: Optional[str] = None, offset: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    return vector_store.get_anomalies(user_id, severity, offset, limit)


def get_anomalies_all(user_id: Optional[int] = None, severity: Optional[str] = None) -> list[dict]:
    return vector_store.get_anomalies_all(user_id, severity)


def get_anomaly_by_id(anomaly_id: int) -> Optional[dict]:
    return vector_store.get_anomaly_by_id(anomaly_id)


def update_anomaly_status(anomaly_id: int, status: str) -> bool:
    return vector_store.update_anomaly_status(anomaly_id, status)


def insert_narrative(anomaly_id: int, text: str) -> int:
    return vector_store.insert_narrative(anomaly_id, text)


def get_narrative_by_anomaly_id(anomaly_id: int) -> Optional[dict]:
    return vector_store.get_narrative_by_anomaly_id(anomaly_id)


def update_narrative_audio(narrative_id: int, audio_data: bytes):
    vector_store.update_narrative_audio(narrative_id, audio_data)


def get_spending_by_category(user_id: int) -> list[dict]:
    return vector_store.get_spending_by_category(user_id)


def get_spending_by_day(user_id: int) -> list[dict]:
    return vector_store.get_spending_by_day(user_id)


def count_anomalies_by_batch(batch_id: str) -> int:
    return vector_store.count_anomalies_by_batch(batch_id)


# ── Vector Search (VectorAI-only features) ──

def filtered_search_transactions(
    query_vector=None,
    vector_name: str = "numerical",
    category=None, merchant=None,
    amount_min=None, amount_max=None,
    batch_id=None, user_id=None,
    limit: int = 20,
):
    return vector_store.filtered_search_transactions(
        query_vector=query_vector, vector_name=vector_name,
        category=category, merchant=merchant,
        amount_min=amount_min, amount_max=amount_max,
        batch_id=batch_id, user_id=user_id,
        limit=limit,
    )


def filtered_search_anomalies(
    query_vector=None,
    vector_name: str = "numerical",
    category=None, merchant=None,
    severity=None, status=None,
    batch_id=None, user_id=None,
    limit: int = 20,
):
    return vector_store.filtered_search_anomalies(
        query_vector=query_vector, vector_name=vector_name,
        category=category, merchant=merchant,
        severity=severity, status=status,
        batch_id=batch_id, user_id=user_id,
        limit=limit,
    )


def hybrid_search_transactions(
    query_text: str,
    query_vector=None,
    category=None, user_id=None,
    limit: int = 20,
):
    return vector_store.hybrid_search_transactions(
        query_text=query_text, query_vector=query_vector,
        category=category, user_id=user_id,
        limit=limit,
    )


def search_narratives(query_text: str, limit: int = 20):
    return vector_store.search_narratives(query_text=query_text, limit=limit)


def _delete_test_user_data(user_id: int):
    from app import vector_store as vs
    if vs.is_vectorai_available():
        try:
            vs._ensure_filter_imports()
            if vs._FilterBuilder:
                filt_txns = vs._FilterBuilder().must(vs._Field("user_id").eq(user_id)).build()
                vs._client.points.delete("transactions", filter=filt_txns)
                filt_anom = vs._FilterBuilder().must(vs._Field("user_id").eq(user_id)).build()
                vs._client.points.delete("anomalies", filter=filt_anom)
        except Exception:
            pass
    else:
        conn = _get_fallback_conn()
        with _auth_lock:
            conn.execute("DELETE FROM vector_transactions WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM vector_anomalies WHERE user_id = ?", (user_id,))
            conn.commit()
    with _auth_lock:
        conn = _get_auth_conn()
        conn.execute("DELETE FROM batches WHERE user_id = ?", (user_id,))
        conn.commit()


# ── Test data seeding ──

def _seed_test_data():
    from app.auth import hash_password

    TEST_EMAIL = "test@test.com"
    TEST_PASSWORD = "test123"
    TEST_NAME = "Test User"

    existing = get_user_by_email(TEST_EMAIL)
    if existing:
        _delete_test_user_data(existing["user_id"])
        with _auth_lock:
            conn = _get_auth_conn()
            conn.execute("DELETE FROM users WHERE email = ?", (TEST_EMAIL,))
            conn.commit()
    uid = create_user(TEST_EMAIL, TEST_NAME, hash_password(TEST_PASSWORD))
    print(f"Seeded test user: {TEST_EMAIL} (id={uid})")

    batch_id = create_upload_batch(uid, 20)

    sample_txns = [
        {"amount": 24.99, "category": "Food", "merchant": "Starbucks", "hour": 8, "day": 1, "timestamp": "2026-07-01 08:15:00"},
        {"amount": 142.50, "category": "Groceries", "merchant": "Whole Foods", "hour": 18, "day": 1, "timestamp": "2026-07-01 18:30:00"},
        {"amount": 9.99, "category": "Entertainment", "merchant": "Netflix", "hour": 20, "day": 1, "timestamp": "2026-07-01 20:00:00"},
        {"amount": 55.00, "category": "Transport", "merchant": "Uber", "hour": 22, "day": 1, "timestamp": "2026-07-01 22:10:00"},
        {"amount": 320.00, "category": "Shopping", "merchant": "Amazon", "hour": 14, "day": 2, "timestamp": "2026-07-02 14:00:00"},
        {"amount": 18.75, "category": "Food", "merchant": "Chipotle", "hour": 12, "day": 2, "timestamp": "2026-07-02 12:30:00"},
        {"amount": 89.99, "category": "Bills", "merchant": "Verizon", "hour": 10, "day": 3, "timestamp": "2026-07-03 10:00:00"},
        {"amount": 15.00, "category": "Entertainment", "merchant": "Spotify", "hour": 9, "day": 3, "timestamp": "2026-07-03 09:00:00"},
        {"amount": 67.50, "category": "Groceries", "merchant": "Trader Joes", "hour": 17, "day": 4, "timestamp": "2026-07-04 17:45:00"},
        {"amount": 12.99, "category": "Food", "merchant": "Dominos", "hour": 19, "day": 4, "timestamp": "2026-07-04 19:20:00"},
        {"amount": 45.00, "category": "Transport", "merchant": "Lyft", "hour": 23, "day": 5, "timestamp": "2026-07-05 23:05:00"},
        {"amount": 210.00, "category": "Shopping", "merchant": "Target", "hour": 15, "day": 5, "timestamp": "2026-07-05 15:30:00"},
        {"amount": 8.50, "category": "Food", "merchant": "Starbucks", "hour": 7, "day": 6, "timestamp": "2026-07-06 07:45:00"},
        {"amount": 99.00, "category": "Entertainment", "merchant": "AMC Theatres", "hour": 21, "day": 6, "timestamp": "2026-07-06 21:00:00"},
        {"amount": 175.00, "category": "Bills", "merchant": "Electric Co", "hour": 10, "day": 7, "timestamp": "2026-07-07 10:00:00"},
        # anomalous spikes
        {"amount": 4999.99, "category": "Shopping", "merchant": "Unknown Vendor", "hour": 3, "day": 3, "timestamp": "2026-07-03 03:15:00"},
        {"amount": 2750.00, "category": "Travel", "merchant": "CryptoExchange", "hour": 2, "day": 5, "timestamp": "2026-07-05 02:30:00"},
        {"amount": 1500.00, "category": "Entertainment", "merchant": "Offshore Casino", "hour": 1, "day": 6, "timestamp": "2026-07-06 01:00:00"},
        {"amount": 890.00, "category": "Food", "merchant": "Luxury Dining", "hour": 23, "day": 4, "timestamp": "2026-07-04 23:45:00"},
        {"amount": 3200.00, "category": "Bills", "merchant": "Shell Company LLC", "hour": 4, "day": 7, "timestamp": "2026-07-07 04:00:00"},
    ]

    txn_ids = vector_store.insert_transactions(sample_txns, uid, batch_id)
    update_batch_status(batch_id, "completed")
    print(f"Seeded {len(txn_ids)} transactions for test user (batch={batch_id})")

    sample_anomalies = [
        {"txn_id": txn_ids[15], "amount": 4999.99, "category": "Shopping", "merchant": "Unknown Vendor", "hour": 3, "day": 3, "isolation_score": 0.95, "rule_score": 0.9, "final_score": 0.93, "is_anomaly": True, "severity": "critical", "triggered_rules": ["large_amount", "unusual_merchant", "unusual_hour"], "status": "pending"},
        {"txn_id": txn_ids[16], "amount": 2750.00, "category": "Travel", "merchant": "CryptoExchange", "hour": 2, "day": 5, "isolation_score": 0.88, "rule_score": 0.85, "final_score": 0.87, "is_anomaly": True, "severity": "high", "triggered_rules": ["large_amount", "suspicious_category"], "status": "pending"},
        {"txn_id": txn_ids[17], "amount": 1500.00, "category": "Entertainment", "merchant": "Offshore Casino", "hour": 1, "day": 6, "isolation_score": 0.82, "rule_score": 0.78, "final_score": 0.80, "is_anomaly": True, "severity": "high", "triggered_rules": ["unusual_hour", "unusual_merchant"], "status": "pending"},
        {"txn_id": txn_ids[18], "amount": 890.00, "category": "Food", "merchant": "Luxury Dining", "hour": 23, "day": 4, "isolation_score": 0.70, "rule_score": 0.65, "final_score": 0.68, "is_anomaly": True, "severity": "medium", "triggered_rules": ["large_amount", "unusual_hour"], "status": "pending"},
        {"txn_id": txn_ids[19], "amount": 3200.00, "category": "Bills", "merchant": "Shell Company LLC", "hour": 4, "day": 7, "isolation_score": 0.91, "rule_score": 0.88, "final_score": 0.90, "is_anomaly": True, "severity": "critical", "triggered_rules": ["large_amount", "unusual_merchant", "unusual_hour", "suspicious_category"], "status": "valid"},
    ]

    anomaly_ids = vector_store.insert_anomalies(sample_anomalies, uid)
    print(f"Seeded {len(anomaly_ids)} anomalies for test user")
