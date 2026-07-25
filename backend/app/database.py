import os
import sqlite3
from contextlib import asynccontextmanager

try:
    import pyodbc
    _HAS_PYODBC = True
except ImportError:
    _HAS_PYODBC = False

_USE_SQLITE = (
    not _HAS_PYODBC
    or os.environ.get("ACTIAN_HOST") in (None, "", "your_host")
)

if _USE_SQLITE:
    _sqlite_conn: sqlite3.Connection | None = None

    def _get_sqlite() -> sqlite3.Connection:
        global _sqlite_conn
        if _sqlite_conn is None:
            _sqlite_conn = sqlite3.connect("marauders.db")
            _sqlite_conn.row_factory = sqlite3.Row
        return _sqlite_conn


def _conn_str() -> str:
    host = os.environ["ACTIAN_HOST"]
    port = os.environ["ACTIAN_PORT"]
    db = os.environ["ACTIAN_DATABASE"]
    user = os.environ["ACTIAN_USER"]
    pwd = os.environ["ACTIAN_PASSWORD"]
    return f"DSN=actian;HOST={host};PORT={port};DATABASE={db};UID={user};PWD={pwd}"


@asynccontextmanager
async def get_connection():
    if _USE_SQLITE:
        yield _get_sqlite()
        return
    conn = pyodbc.connect(_conn_str(), autocommit=False)
    try:
        yield conn
    finally:
        conn.close()


async def insert_transactions(txns: list[dict], user_id: str) -> list[str]:
    ids: list[str] = []
    async with get_connection() as conn:
        for txn in txns:
            cur = conn.execute(
                """INSERT INTO transactions (user_id, amount, category, merchant, hour, day, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                user_id,
                txn["amount"],
                txn["category"],
                txn["merchant"],
                txn["hour"],
                txn["day"],
                txn.get("timestamp"),
            )
            ids.append(str(cur.lastrowid))
        conn.commit()
    return ids


async def insert_anomalies(anomalies: list[dict], user_id: str) -> None:
    async with get_connection() as conn:
        for a in anomalies:
            conn.execute(
                """INSERT INTO anomalies (user_id, txn_id, amount, category, merchant, hour,
                   isolation_score, rule_score, final_score, is_anomaly, severity, triggered_rules)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                user_id,
                a.get("txn_id"),
                a["amount"],
                a["category"],
                a["merchant"],
                a["hour"],
                a.get("isolation_score", 0),
                a.get("rule_score", 0),
                a.get("final_score", 0),
                a["is_anomaly"],
                a["severity"],
                ",".join(a.get("triggered_rules", [])),
            )
        conn.commit()


async def get_user_transactions(user_id: str) -> list[dict]:
    async with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp", user_id
        ).fetchall()
        return [dict(r) for r in rows]


async def get_user_anomalies(user_id: str) -> list[dict]:
    async with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM anomalies WHERE user_id = ? AND is_anomaly = 1", user_id
        ).fetchall()
        return [dict(r) for r in rows]


async def get_batch_status(batch_id: str) -> dict | None:
    async with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM upload_batches WHERE batch_id = ?", batch_id
        ).fetchone()
        return dict(row) if row else None
