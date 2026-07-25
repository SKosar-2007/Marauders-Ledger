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
    vs_ok = vector_store.init_vector_store()
    if vs_ok:
        print("Database: Actian VectorAI PRIMARY — SQLite for auth only")
    else:
        print("Database: SQLite FALLBACK — VectorAI unavailable")


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
