#!/usr/bin/env python3
"""
Marauder's Ledger - Inference Code (v5.0)
==========================================
Load pre-trained ensemble (XGB + LGBM + RF + GB + CatBoost + ET) and run anomaly detection.
Designed for FastAPI /analyze endpoint integration.
"""
from __future__ import annotations

import importlib
import json
import os
from typing import Optional

import joblib
import numpy as np
import pandas as pd

_xgb_available = importlib.util.find_spec("xgboost") is not None
_lgbm_available = importlib.util.find_spec("lightgbm") is not None
_catboost_available = importlib.util.find_spec("catboost") is not None

# =============================================================================
# LOAD MODELS (call once at server startup)
# =============================================================================
_LOADED = False
MODELS = {}
SCALER = None
FEATURES = None
METADATA = None
UNSUP_MODELS = None
FIT_STATS = None
TRAIN_STATS = None


def _try_load(path):
    try:
        return joblib.load(path)
    except Exception as e:  # noqa: BLE001
        print(f"  Warning: failed to load {path}: {e}")
        return None


def load_models(model_dir: str = "models"):
    global SCALER, FEATURES, METADATA
    global UNSUP_MODELS, FIT_STATS, TRAIN_STATS, _LOADED

    for name in ["rf", "gb", "xgb", "lgbm", "catboost", "et"]:
        path = f"{model_dir}/{name}_model.pkl"
        if os.path.exists(path):
            model = _try_load(path)
            if model is not None:
                MODELS[name] = model

    if not MODELS:
        for name in ["rf", "gb"]:
            model = _try_load(f"{model_dir}/{name}_model.pkl")
            if model is not None:
                MODELS[name] = model

    SCALER = _try_load(f"{model_dir}/scaler.pkl")
    FEATURES = _try_load(f"{model_dir}/feature_columns.pkl")

    iso = _try_load(f"{model_dir}/anomaly_model.pkl")
    lof = _try_load(f"{model_dir}/lof_model.pkl")
    ocsvm = _try_load(f"{model_dir}/ocsvm_model.pkl")
    unsup = [m for m in (iso, lof, ocsvm) if m is not None]
    UNSUP_MODELS = tuple(unsup) if unsup else None

    meta_path = f"{model_dir}/model_metadata.json"
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            METADATA = json.load(f)
    else:
        METADATA = {"threshold": 0.50}

    fit_stats_path = f"{model_dir}/fit_stats.json"
    if os.path.exists(fit_stats_path):
        with open(fit_stats_path) as f:
            FIT_STATS = json.load(f)
    else:
        FIT_STATS = {
            "merchant_freq_map": {},
            "merchant_rarity_map": {},
            "cat_mean_map": {},
            "cat_std_map": {},
            "global_mean": 100,
            "global_std": 200,
            "cat_stats": [],
            "rolling_mean": 100,
            "rolling_std": 50,
            "iqr_lower": 0,
            "iqr_upper": 500,
        }

    TRAIN_STATS = {
        "category_means": FIT_STATS.get("cat_mean_map", {}),
        "merchant_counts": FIT_STATS.get("merchant_freq_map", {}),
        "rolling_mean_7d": FIT_STATS.get("rolling_mean", 100),
        "rolling_std_7d": FIT_STATS.get("rolling_std", 50),
        "last_24h_avg": FIT_STATS.get("global_mean", 100),
    }

    _LOADED = True
    threshold = METADATA.get("threshold", 0.50)
    print(f"Models loaded from '{model_dir}/' ({len(MODELS)} models, threshold={threshold:.3f})")
    return threshold


# =============================================================================
# FEATURE ENGINEERING (48 features — must match train_model.py v5 exactly)
# =============================================================================
def engineer_features(df: pd.DataFrame, fit_stats: Optional[dict] = None) -> pd.DataFrame:
    df = df.copy()

    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["is_night"] = (df["hour"].between(0, 6)).astype(int)

    if fit_stats and fit_stats.get("merchant_freq_map"):
        mfm = fit_stats["merchant_freq_map"]
        df["merchant_freq"] = df["merchant"].map(mfm).fillna(1).astype(int)
        df["merchant_rarity"] = df["merchant"].map(
            fit_stats.get("merchant_rarity_map", {})
        ).fillna(0.5)
        df["category_mean_amount"] = df["category"].map(
            fit_stats.get("cat_mean_map", {})
        ).fillna(fit_stats.get("global_mean", 100))
        df["category_std_amount"] = df["category"].map(
            fit_stats.get("cat_std_map", {})
        ).fillna(fit_stats.get("global_std", 200))
    else:
        df["merchant_freq"] = df.groupby("merchant")["merchant"].transform("count")
        df["merchant_rarity"] = 0.5
        df["category_mean_amount"] = df.groupby("category")["amount"].transform("mean")
        df["category_std_amount"] = df.groupby("category")["amount"].transform("std").fillna(1)

    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    if fit_stats and fit_stats.get("cat_stats"):
        cat_df = pd.DataFrame(fit_stats["cat_stats"])
        df = df.merge(cat_df, on="category", how="left")
        df["cat_std"] = df["cat_std"].fillna(fit_stats.get("global_std", 200))
    else:
        cat_stats = df.groupby("category")["amount"].agg(["mean", "std"]).reset_index()
        cat_stats.columns = ["category", "cat_mean", "cat_std"]
        df = df.merge(cat_stats, on="category", how="left")
        df["cat_std"] = df["cat_std"].fillna(1)

    df["cat_mean"] = df.get("cat_mean", df.get("category_mean_amount", df["amount"]))

    df["amount_zscore"] = ((df["amount"] - df["cat_mean"]) / df["cat_std"].clip(lower=1))
    df["amount_cat_ratio"] = df["amount"] / df["cat_mean"].clip(lower=1)
    df["txn_frequency_24h"] = 1

    if "timestamp" in df.columns and pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        diffs = df["timestamp"].diff()
        df["days_since_last_txn"] = diffs.dt.total_seconds().fillna(30 * 86400) / 86400
    else:
        df["days_since_last_txn"] = 7.0

    df["is_amount_extreme"] = (df["amount"] > df["amount"].quantile(0.95)).astype(int)

    if fit_stats and fit_stats.get("rolling_mean") is not None:
        df["rolling_7d_mean"] = fit_stats["rolling_mean"]
        df["rolling_7d_std"] = fit_stats["rolling_std"]
    else:
        df["rolling_7d_mean"] = df["amount"].rolling(7, min_periods=1).mean()
        df["rolling_7d_std"] = df["amount"].rolling(7, min_periods=1).std().fillna(1)

    df["amount_deviation_from_rolling"] = (
        (df["amount"] - df["rolling_7d_mean"]) / df["rolling_7d_std"].clip(lower=1)
    )
    df["merchant_risk_score"] = (
        0.5 * (1 / df["merchant_freq"].clip(lower=1)) +
        0.5 * df["amount_zscore"].clip(-3, 3)
    )

    df["amount_percentile"] = df["amount"].rank(pct=True)
    df["amount_roundedness"] = (df["amount"] % 100 == 0).astype(int) | \
                                ((df["amount"] % 50 == 0) & (df["amount"] > 100)).astype(int)

    iqr_lower = fit_stats.get("iqr_lower", 0) if fit_stats else df["amount"].quantile(0.25) - 1.5 * (df["amount"].quantile(0.75) - df["amount"].quantile(0.25))
    iqr_upper = fit_stats.get("iqr_upper", df["amount"].quantile(0.75) + 300) if fit_stats else df["amount"].quantile(0.75) + 1.5 * (df["amount"].quantile(0.75) - df["amount"].quantile(0.25))
    df["is_amount_outlier_iqr"] = ((df["amount"] < iqr_lower) | (df["amount"] > iqr_upper)).astype(int)

    df["txn_velocity_1h"] = 1
    df["amount_to_global_mean_ratio"] = df["amount"] / fit_stats["global_mean"] if fit_stats else df["amount"] / df["amount"].mean()
    df["category_merchant_diversity"] = df.groupby("category")["merchant"].transform("nunique")

    df["amt_x_rarity"] = df["amount"] * df["merchant_rarity"]
    df["amt_x_unusual_hour"] = df["amount"] * df["is_unusual_hour"]
    df["zscore_x_new_merchant"] = df["amount_zscore"] * (df["merchant_freq"] == 1).astype(int)
    df["cat_ratio_x_unusual_hour"] = df["amount_cat_ratio"] * df["is_unusual_hour"]
    df["rolling_dev_x_rarity"] = df["amount_deviation_from_rolling"] * df["merchant_rarity"]
    df["amt_x_velocity"] = df["amount"] * np.log1p(df["txn_velocity_1h"])
    df["spike_score"] = df["amount_cat_ratio"] * df["amount_zscore"].clip(0, 5)

    # v5 features — must match train_model.py exactly
    global_std = fit_stats["global_std"] if fit_stats else df["amount"].std()
    df["amount_log_zscore"] = (df["amount_log"] - df["amount_log"].mean()) / max(df["amount_log"].std(), 0.1)
    df["merchant_amt_ratio"] = df["amount"] / df.groupby("merchant")["amount"].transform("mean").clip(lower=1)
    df["category_entropy"] = -df.groupby("category")["merchant"].transform(
        lambda x: x.value_counts(normalize=True).apply(lambda p: p * np.log2(p + 1e-10)).sum()
    )
    df["hour_category_interaction"] = df["hour"] * df["category_mean_amount"]
    if "timestamp" in df.columns and pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["txn_recency_score"] = 1.0 / (1.0 + df["days_since_last_txn"])
    else:
        df["txn_recency_score"] = 0.5
    df["amount_binned"] = pd.cut(df["amount"], bins=[0, 50, 100, 200, 500, 1000, 5000, 100000],
                                  labels=[0, 1, 2, 3, 4, 5, 6]).astype(float).fillna(3)
    df["is_high_risk_hour"] = ((df["hour"] <= 5) | (df["hour"] >= 23)).astype(int)
    df["merchant_category_risk"] = df["merchant_freq"] * df["is_unusual_hour"]
    df["rolling_mean_ratio"] = df["amount"] / df["rolling_7d_mean"].clip(lower=1)
    df["rolling_std_ratio"] = (df["amount"] - df["rolling_7d_mean"]) / df["rolling_7d_std"].clip(lower=1)
    df["amount_percentile_category"] = df.groupby("category")["amount"].rank(pct=True)
    df["is_new_merchant_risk"] = ((df["merchant_freq"] <= 2) & (df["amount_zscore"] > 1.5)).astype(int)
    df["compound_risk_score"] = (
        df["is_unusual_hour"] * 0.3 +
        (df["merchant_freq"] <= 2).astype(int) * 0.3 +
        (df["amount_zscore"] > 2).astype(int) * 0.4
    )
    if "timestamp" in df.columns and pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["time_since_midnight"] = df["timestamp"].dt.hour * 60 + df["timestamp"].dt.minute
    else:
        df["time_since_midnight"] = df["hour"] * 60
    if "timestamp" in df.columns and pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        day_of_month = df["timestamp"].dt.day
        df["is_payday_window"] = ((day_of_month >= 25) | (day_of_month <= 3)).astype(int)
    else:
        df["is_payday_window"] = 0
    df["amount_deviation_squared"] = df["amount_deviation_from_rolling"] ** 2

    # Clip and clean
    df["amount_zscore"] = df["amount_zscore"].clip(-5, 5)
    df["amount_cat_ratio"] = df["amount_cat_ratio"].clip(0, 50)
    df["amount_deviation_from_rolling"] = df["amount_deviation_from_rolling"].clip(-5, 5)
    df["merchant_risk_score"] = df["merchant_risk_score"].clip(0, 5)
    df["amount_to_global_mean_ratio"] = df["amount_to_global_mean_ratio"].clip(0, 50)

    if FEATURES is not None:
        for col in FEATURES:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].replace([np.inf, -np.inf], 0).fillna(0)

    return df


# =============================================================================
# UNSUPERVISED SCORES
# =============================================================================
def _norm(s):
    mn, mx = s.min(), s.max()
    if mx - mn < 1e-10:
        return np.zeros_like(s)
    return (s - mn) / (mx - mn)


def add_unsupervised_features(X_scaled, models):
    iso, lof, ocsvm = models
    iso_scores = _norm(-iso.decision_function(X_scaled))
    lof_scores = _norm(-lof.decision_function(X_scaled))
    ocsvm_scores = _norm(-ocsvm.decision_function(X_scaled))
    return np.column_stack([X_scaled, iso_scores, lof_scores, ocsvm_scores])


# =============================================================================
# RULE SCORING
# =============================================================================
def _compute_rule_score(row, stats):
    score = 0.0
    cat_mean = stats.get("category_means", {}).get(row.get("category", ""), row.get("amount", 0))
    if row.get("amount", 0) > 3 * cat_mean:
        score += 0.25
    if 2 <= row.get("hour", 12) <= 5:
        score += 0.15
    if stats.get("merchant_counts", {}).get(row.get("merchant", ""), 0) < 3:
        score += 0.15
    rm = stats.get("rolling_mean_7d", row.get("amount", 0))
    rs = stats.get("rolling_std_7d", 1)
    if row.get("amount", 0) > rm + 2 * rs:
        score += 0.20
    if row.get("amount", 0) > rm + 3 * rs:
        score += 0.15
    if stats.get("merchant_counts", {}).get(row.get("merchant", ""), 0) == 0:
        score += 0.10
    if row.get("amount", 0) % 100 == 0 and row.get("amount", 0) >= 500:
        score += 0.05
    return min(score, 1.0)


def _classify(score):
    if score > 0.65:
        return True, "high"
    elif score > 0.55:
        return True, "medium"
    elif score > 0.45:
        return True, "low"
    return False, "none"


def _get_triggered_rules(row, stats):
    rules = []
    cat_mean = stats.get("category_means", {}).get(row.get("category", ""), row.get("amount", 0))
    if row.get("amount", 0) > 3 * cat_mean:
        rules.append("amount_spike")
    if 2 <= row.get("hour", 12) <= 5:
        rules.append("unusual_hour")
    if stats.get("merchant_counts", {}).get(row.get("merchant", ""), 0) < 3:
        rules.append("new_merchant")
    rm = stats.get("rolling_mean_7d", row.get("amount", 0))
    rs = stats.get("rolling_std_7d", 1)
    if row.get("amount", 0) > rm + 2 * rs:
        rules.append("rolling_avg_exceeded")
    return rules


# =============================================================================
# MAIN INFERENCE FUNCTION
# =============================================================================
def detect_anomalies(transactions: list[dict], threshold: Optional[float] = None) -> list[dict]:
    if not _LOADED:
        load_models()

    if threshold is None:
        threshold = METADATA.get("threshold", 0.50)

    df = pd.DataFrame(transactions)

    if "timestamp" not in df.columns:
        df["timestamp"] = pd.Timestamp.now()

    df = engineer_features(df, fit_stats=FIT_STATS)

    if SCALER is not None and FEATURES is not None:
        X_base = SCALER.transform(df[FEATURES])
    else:
        X_base = df.select_dtypes(include=[np.number]).values

    if UNSUP_MODELS:
        X_ext = add_unsupervised_features(X_base, UNSUP_MODELS)
    else:
        X_ext = X_base

    rule_scores = np.zeros(len(df))
    for i, (_, row) in enumerate(df.iterrows()):
        rule_scores[i] = _compute_rule_score(row, TRAIN_STATS)

    X_final = np.column_stack([X_ext, rule_scores.reshape(-1, 1)])

    probs = {}
    model_weights = {"rf": 0.15, "gb": 0.15, "xgb": 0.25, "lgbm": 0.25, "catboost": 0.10, "et": 0.10}
    for name, model in MODELS.items():
        probs[name] = model.predict_proba(X_final)[:, 1]

    n_models = len(probs)
    total_w = 0
    ensemble_prob = np.zeros(len(X_final))
    for name, p in probs.items():
        w = model_weights.get(name, 1.0 / n_models)
        ensemble_prob += w * p
        total_w += w
    if total_w > 0:
        ensemble_prob /= total_w

    # Individual model scores for debugging
    model_scores = {}
    for name, p in probs.items():
        model_scores[name] = float(np.mean(p))

    results = []
    for i, row in df.iterrows():
        prob = float(ensemble_prob[i])
        is_anomaly, severity = _classify(prob)
        triggered_rules = _get_triggered_rules(row, TRAIN_STATS)

        # Compute component scores
        rule_score = float(rule_scores[i])
        iso_score = float(rule_score * 0.25) if UNSUP_MODELS else 0.0
        ml_score = float(prob * 0.75)

        results.append({
            "amount": float(row["amount"]),
            "category": row["category"],
            "merchant": row["merchant"],
            "hour": int(row["hour"]),
            "day": int(row["day"]),
            "probability": round(prob, 4),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "triggered_rules": triggered_rules,
            "isolation_score": round(iso_score, 4),
            "rule_score": round(rule_score, 4),
            "final_score": round(prob, 4),
        })

    return results


# =============================================================================
# CLI TEST
# =============================================================================
if __name__ == "__main__":
    threshold = load_models("models")

    sample = [
        {"amount": 150, "category": "Food", "merchant": "Swiggy", "hour": 13, "day": 2,
         "timestamp": pd.Timestamp("2026-06-10 13:22:00")},
        {"amount": 8500, "category": "Food", "merchant": "Unknown Merchant", "hour": 3, "day": 4,
         "timestamp": pd.Timestamp("2026-06-10 03:15:00")},
        {"amount": 4200, "category": "Shopping", "merchant": "Unknown Merchant", "hour": 2, "day": 1,
         "timestamp": pd.Timestamp("2026-06-10 02:47:00")},
        {"amount": 85, "category": "Food", "merchant": "Zomato", "hour": 19, "day": 5,
         "timestamp": pd.Timestamp("2026-06-10 19:30:00")},
        {"amount": 2499, "category": "Shopping", "merchant": "Amazon", "hour": 20, "day": 3,
         "timestamp": pd.Timestamp("2026-06-10 20:15:00")},
        {"amount": 5000, "category": "Bills", "merchant": "Suspicious Shop", "hour": 3, "day": 1,
         "timestamp": pd.Timestamp("2026-06-10 03:45:00")},
        {"amount": 10000, "category": "Food", "merchant": "Crypto Exchange", "hour": 2, "day": 0,
         "timestamp": pd.Timestamp("2026-06-10 02:10:00")},
    ]

    print(f"\nRunning inference on 7 samples (threshold={threshold:.3f})...")
    results = detect_anomalies(sample)

    for r in results:
        status = "ANOMALY" if r["is_anomaly"] else "Normal"
        print(f"  Rs.{r['amount']:>8.0f} | {r['category']:<14} | {r['merchant']:<20} "
              f"| {r['hour']:02d}:00 | Prob: {r['probability']:.4f} | {status} ({r['severity']})")
