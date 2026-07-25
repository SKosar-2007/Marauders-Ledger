-- Actian Data Platform schema for The Marauder's Ledger
-- Compatible with SQLite as fallback

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    txn_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT NOT NULL,
    hour INTEGER NOT NULL,
    day INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_features (
    feature_id INTEGER PRIMARY KEY AUTOINCREMENT,
    txn_id INTEGER NOT NULL REFERENCES transactions(txn_id),
    amount_log REAL,
    is_unusual_hour INTEGER,
    is_weekend INTEGER,
    is_night INTEGER,
    merchant_freq INTEGER,
    merchant_rarity REAL,
    category_mean_amount REAL,
    category_std_amount REAL,
    hour_sin REAL,
    hour_cos REAL,
    amount_zscore REAL,
    amount_cat_ratio REAL,
    days_since_last_txn REAL,
    is_amount_extreme INTEGER,
    rolling_7d_mean REAL,
    rolling_7d_std REAL,
    amount_deviation_from_rolling REAL,
    merchant_risk_score REAL,
    amount_percentile REAL,
    amount_roundedness INTEGER,
    is_amount_outlier_iqr INTEGER,
    amount_to_global_mean_ratio REAL,
    category_merchant_diversity INTEGER
);

CREATE TABLE IF NOT EXISTS anomalies (
    anomaly_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    txn_id TEXT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT NOT NULL,
    hour INTEGER NOT NULL,
    isolation_score REAL DEFAULT 0,
    rule_score REAL DEFAULT 0,
    final_score REAL DEFAULT 0,
    is_anomaly INTEGER NOT NULL DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'none',
    triggered_rules TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS narratives (
    narrative_id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_id INTEGER NOT NULL REFERENCES anomalies(anomaly_id),
    text TEXT NOT NULL,
    audio_data BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upload_batches (
    batch_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    status TEXT NOT NULL DEFAULT 'pending',
    txn_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_batches_user ON upload_batches(user_id);

CREATE VIEW IF NOT EXISTS daily_user_summary AS
SELECT
    user_id,
    DATE(timestamp) as day,
    COUNT(*) as txn_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    SUM(CASE WHEN is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_count
FROM transactions
GROUP BY user_id, DATE(timestamp);
