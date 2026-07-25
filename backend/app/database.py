import os
import sqlite3
import uuid

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
            _sqlite_conn = sqlite3.connect("marauders.db", check_same_thread=False)
            _sqlite_conn.row_factory = sqlite3.Row
        return _sqlite_conn


def _conn_str() -> str:
    host = os.environ["ACTIAN_HOST"]
    port = os.environ["ACTIAN_PORT"]
    db = os.environ["ACTIAN_DATABASE"]
    user = os.environ["ACTIAN_USER"]
    pwd = os.environ["ACTIAN_PASSWORD"]
    return f"DSN=actian;HOST={host};PORT={port};DATABASE={db};UID={user};PWD={pwd}"


def init_db() -> None:
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path) as f:
        sql = f.read()
    if _USE_SQLITE:
        conn = _get_sqlite()
        conn.executescript(sql)
        conn.commit()
    else:
        conn = pyodbc.connect(_conn_str(), autocommit=True)
        conn.execute(sql)
        conn.close()


def _get_conn():
    if _USE_SQLITE:
        return _get_sqlite()
    return pyodbc.connect(_conn_str(), autocommit=False)


def create_upload_batch(user_id: str, txn_count: int) -> str:
    batch_id = uuid.uuid4().hex[:12]
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO upload_batches (batch_id, user_id, status, txn_count) VALUES (?, ?, ?, ?)",
            (batch_id, user_id, "processing", txn_count),
        )
        conn.commit()
    finally:
        if not _USE_SQLITE:
            conn.close()
    return batch_id


def _clean_txn(txn: dict) -> tuple:
    return (
        txn["amount"],
        txn["category"],
        txn["merchant"],
        int(txn["hour"]),
        int(txn["day"]),
        str(txn.get("timestamp", "")) if txn.get("timestamp") else None,
    )


def insert_transactions(txns: list[dict], user_id: str) -> list[str]:
    ids: list[str] = []
    conn = _get_conn()
    try:
        for txn in txns:
            cur = conn.execute(
                "INSERT INTO transactions (user_id, amount, category, merchant, hour, day, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, *_clean_txn(txn)),
            )
            ids.append(str(cur.lastrowid))
        conn.commit()
    finally:
        if not _USE_SQLITE:
            conn.close()
    return ids


def insert_anomalies(anomalies: list[dict], user_id: str) -> None:
    conn = _get_conn()
    try:
        for a in anomalies:
            conn.execute(
                "INSERT INTO anomalies (user_id, txn_id, amount, category, merchant, hour, isolation_score, rule_score, final_score, is_anomaly, severity, triggered_rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
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
                ),
            )
        conn.commit()
    finally:
        if not _USE_SQLITE:
            conn.close()


def get_user_transactions(user_id: str) -> list[dict]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp", (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        if not _USE_SQLITE:
            conn.close()


def get_user_anomalies(user_id: str) -> list[dict]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM anomalies WHERE user_id = ? AND is_anomaly = 1", (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        if not _USE_SQLITE:
            conn.close()


def get_batch_status(batch_id: str) -> dict | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM upload_batches WHERE batch_id = ?", (batch_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        if not _USE_SQLITE:
            conn.close()
