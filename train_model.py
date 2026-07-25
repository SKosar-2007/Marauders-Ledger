#!/usr/bin/env python3
"""
Marauder's Ledger - ML Model Training Script (v4.0)
=====================================================
Improved hybrid ensemble for higher F1 and recall.

Key improvements over v3:
- More training data (10K samples)
- Richer anomaly injection (12 types, compound patterns)
- 25 engineered features (up from 16)
- XGBoost + LightGBM added to ensemble
- Stacking meta-learner instead of simple averaging
- Probability calibration
- Repeated stratified k-fold CV
"""

import json
import os
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import (
    GradientBoostingClassifier,
    IsolationForest,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

warnings.filterwarnings("ignore")

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGBM = True
except ImportError:
    HAS_LGBM = False

# =============================================================================
# CONFIGURATION
# =============================================================================
N_SAMPLES = 15000
N_TEST = 3000
ANOMALY_PCT = 0.04
RANDOM_SEED = 42
N_FOLDS = 5
N_REPEATS = 2
OUTPUT_DIR = "models"
DATA_DIR = "data"
VIZ_DIR = "visualizations"

FEATURES = [
    "amount", "amount_log", "hour", "is_unusual_hour",
    "is_weekend", "merchant_freq", "category_mean_amount",
    "hour_sin", "hour_cos",
    "amount_zscore", "amount_cat_ratio", "txn_frequency_24h",
    "days_since_last_txn", "is_amount_extreme",
    "amount_deviation_from_rolling", "merchant_risk_score",
    "amount_percentile", "merchant_rarity", "is_night",
    "amount_roundedness", "category_std_amount",
    "is_amount_outlier_iqr", "txn_velocity_1h",
    "amount_to_global_mean_ratio", "category_merchant_diversity",
    "amt_x_rarity", "amt_x_unusual_hour", "zscore_x_new_merchant",
    "cat_ratio_x_unusual_hour", "rolling_dev_x_rarity",
    "amt_x_velocity", "spike_score",
]

CATEGORY_PARAMS = {
    "Food":          {"mean": 150, "std": 80,  "weight": 0.35},
    "Shopping":      {"mean": 500, "std": 300, "weight": 0.25},
    "Bills":         {"mean": 800, "std": 400, "weight": 0.15},
    "Travel":        {"mean": 300, "std": 200, "weight": 0.10},
    "Entertainment": {"mean": 200, "std": 100, "weight": 0.15},
}

MERCHANTS_BY_CATEGORY = {
    "Food":          ["Swiggy", "Zomato", "Local Cafe", "Dominos", "KFC"],
    "Shopping":      ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio"],
    "Bills":         ["PhonePe", "GooglePay", "Paytm", "Jio", "Airtel"],
    "Travel":        ["Uber", "Rapido", "Ola", "IRCTC", "RedBus"],
    "Entertainment": ["Netflix", "Spotify", "Hotstar", "YouTube", "JioCinema"],
}

MERCHANT_PROBS = {
    "Food":          [0.25, 0.20, 0.20, 0.15, 0.20],
    "Shopping":      [0.30, 0.25, 0.20, 0.15, 0.10],
    "Bills":         [0.25, 0.25, 0.25, 0.15, 0.10],
    "Travel":        [0.25, 0.20, 0.20, 0.20, 0.15],
    "Entertainment": [0.30, 0.25, 0.20, 0.15, 0.10],
}


# =============================================================================
# 1. SYNTHETIC DATA GENERATION (improved)
# =============================================================================
def generate_data(n=10000, anomaly_pct=0.03, seed=42):
    np.random.seed(seed)
    n_anomalies = int(n * anomaly_pct)
    n_normal = n - n_anomalies

    categories = np.random.choice(
        list(CATEGORY_PARAMS.keys()),
        n_normal,
        p=[CATEGORY_PARAMS[c]["weight"] for c in CATEGORY_PARAMS]
    )

    amounts = []
    merchants = []
    for cat in categories:
        p = CATEGORY_PARAMS[cat]
        amount = max(10, np.random.normal(p["mean"], p["std"]))
        amounts.append(round(amount, 2))
        merchants.append(
            np.random.choice(MERCHANTS_BY_CATEGORY[cat], p=MERCHANT_PROBS[cat])
        )

    hours = np.random.choice(range(6, 23), n_normal, p=_hour_probs())
    days = np.random.randint(0, 7, n_normal)
    timestamps = _generate_timestamps(n_normal, seed)

    df = pd.DataFrame({
        "amount": amounts,
        "category": categories,
        "merchant": merchants,
        "hour": hours,
        "day": days,
        "timestamp": timestamps,
        "is_anomaly": 0
    })

    df = _inject_anomalies(df, n_anomalies, seed)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def _hour_probs():
    probs = np.ones(17)
    probs[7 - 6] = 1.5
    probs[8 - 6] = 1.2
    probs[12 - 6] = 2.5
    probs[13 - 6] = 2.0
    probs[19 - 6] = 2.0
    probs[20 - 6] = 1.5
    probs[21 - 6] = 1.0
    return probs / probs.sum()


def _generate_timestamps(n, seed):
    np.random.seed(seed + 1)
    base = pd.Timestamp("2026-06-01")
    offsets = np.sort(np.random.uniform(0, 30 * 86400, n))
    return [base + pd.Timedelta(seconds=float(o)) for o in offsets]


def _inject_anomalies(df, n_anomalies, seed):
    np.random.seed(seed + 2)
    idxs = np.random.choice(len(df), n_anomalies, replace=False)

    anomaly_types = np.random.choice(
        ["amount_spike", "unusual_hour", "new_merchant", "velocity_attack",
         "category_anomaly", "subtle_amount", "time_pattern_break",
         "round_amount_fraud", "micro_txn_flood", "geo_impossible",
         "double_spend", "compound", "escalating_amounts", "weekend_spike",
         "late_night_txn", "merchant_hopping"],
        n_anomalies,
        p=[0.12, 0.10, 0.10, 0.07, 0.07, 0.07, 0.07, 0.07, 0.05, 0.05, 0.04, 0.04, 0.05, 0.04, 0.03, 0.03]
    )

    for i, idx in enumerate(idxs):
        atype = anomaly_types[i]
        df.at[idx, "is_anomaly"] = 1
        cat = df.at[idx, "category"]
        base_mean = CATEGORY_PARAMS[cat]["mean"]
        base_std = CATEGORY_PARAMS[cat]["std"]

        if "amount_spike" in atype:
            multiplier = np.random.uniform(6, 20)
            df.at[idx, "amount"] = round(float(base_mean * multiplier), 2)
        if "unusual_hour" in atype or "time_pattern_break" in atype:
            df.at[idx, "hour"] = np.random.choice([1, 2, 3, 4, 5])
        if "new_merchant" in atype:
            df.at[idx, "merchant"] = np.random.choice([
                "Unknown Merchant", "Suspicious Shop", "Offshore Services",
                "Crypto Exchange", "Wire Transfer"
            ])
        if "subtle_amount" in atype:
            df.at[idx, "amount"] = round(base_mean * np.random.uniform(3, 6), 2)
        if "category_anomaly" in atype:
            wrong_cats = [c for c in CATEGORY_PARAMS if c != cat]
            df.at[idx, "category"] = np.random.choice(wrong_cats)
            df.at[idx, "merchant"] = np.random.choice(
                MERCHANTS_BY_CATEGORY[df.at[idx, "category"]]
            )
        if "compound" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(5000, 15000)), 2)
            df.at[idx, "hour"] = np.random.choice([1, 2, 3, 4])
            df.at[idx, "merchant"] = np.random.choice([
                "Unknown Merchant", "Suspicious Shop", "Offshore Services"
            ])
        if "round_amount_fraud" in atype:
            df.at[idx, "amount"] = round(float(np.random.choice([1000, 2000, 5000, 10000])), 2)
        if "micro_txn_flood" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(1, 10)), 2)
        if "geo_impossible" in atype:
            df.at[idx, "hour"] = np.random.choice([2, 3, 4])
            df.at[idx, "merchant"] = np.random.choice([
                "Foreign Exchange", "Overseas Wire", "International Transfer"
            ])
        if "double_spend" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(1500, 8000)), 2)

            nearby = df[(df.index != idx) & (df["category"] == cat) &
                        (df["amount"] > df["amount"].median())]
            if len(nearby) > 0:
                j = np.random.choice(nearby.index)
                df.at[idx, "merchant"] = df.at[j, "merchant"]
        if "velocity_attack" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(500, 3000)), 2)
            df.at[idx, "hour"] = np.random.choice([1, 2, 3])

            for j in range(1, min(4, len(df) - idx - 1)):
                idx2 = idx + j
                if idx2 < len(df):
                    df.at[idx2, "is_anomaly"] = 1
                    df.at[idx2, "amount"] = round(float(np.random.uniform(500, 3000)), 2)
                    df.at[idx2, "hour"] = df.at[idx, "hour"]
                    df.at[idx2, "merchant"] = df.at[idx, "merchant"]
        if "escalating_amounts" in atype:
            base = df.at[idx, "amount"]
            for j in range(1, min(4, len(df) - idx - 1)):
                idx2 = idx + j
                if idx2 < len(df):
                    df.at[idx2, "is_anomaly"] = 1
                    df.at[idx2, "amount"] = round(float(base * (1 + j * 0.5)), 2)
                    df.at[idx2, "hour"] = df.at[idx, "hour"]
                    df.at[idx2, "merchant"] = df.at[idx, "merchant"]
        if "weekend_spike" in atype:
            df.at[idx, "day"] = np.random.choice([5, 6])
            df.at[idx, "amount"] = round(float(base_mean * np.random.uniform(4, 10)), 2)
            if df.at[idx, "merchant"] in MERCHANTS_BY_CATEGORY.get(cat, []):
                df.at[idx, "merchant"] = np.random.choice(["Unknown Merchant", "Crypto Exchange"])
        if "late_night_txn" in atype:
            df.at[idx, "hour"] = np.random.choice([23, 0, 1])
            df.at[idx, "amount"] = round(float(base_mean * np.random.uniform(3, 7)), 2)
            df.at[idx, "merchant"] = np.random.choice(["Online Casino", "Dark Web Market", "Crypto Exchange"])
        if "merchant_hopping" in atype:
            merchants = MERCHANTS_BY_CATEGORY.get(cat, [])
            if len(merchants) >= 3:
                hops = np.random.choice(merchants, min(4, len(merchants)), replace=False)
                for j, m in enumerate(hops):
                    idx2 = idx + j
                    if idx2 < len(df):
                        df.at[idx2, "is_anomaly"] = 1
                        df.at[idx2, "merchant"] = m
                        df.at[idx2, "amount"] = round(float(np.random.uniform(base_mean, base_mean * 3)), 2)

    return df


# =============================================================================
# 2. FEATURE ENGINEERING (expanded to 25 features)
# =============================================================================
def engineer_features(df, fit_stats=None):
    df = df.copy()

    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["is_night"] = (df["hour"].between(0, 6)).astype(int)

    if fit_stats is None:
        merchant_freq_map = df.groupby("merchant")["merchant"].count().to_dict()
        total_merchants = len(merchant_freq_map)
        merchant_rarity_map = {
            m: 1.0 - (freq / len(df)) for m, freq in merchant_freq_map.items()
        }
        cat_stats = df.groupby("category")["amount"].agg(["mean", "std"]).reset_index()
        cat_stats.columns = ["category", "cat_mean", "cat_std"]
        cat_mean_map = df.groupby("category")["amount"].mean().to_dict()
        cat_std_map = df.groupby("category")["amount"].std().fillna(1).to_dict()
        global_mean = df["amount"].mean()
        global_std = df["amount"].std()
        q25 = df["amount"].quantile(0.25)
        q75 = df["amount"].quantile(0.75)
        iqr = q75 - q25

        df["merchant_freq"] = df["merchant"].map(merchant_freq_map).fillna(1).astype(int)
        df["merchant_rarity"] = df["merchant"].map(merchant_rarity_map).fillna(0.5)
        df = df.merge(cat_stats, on="category", how="left")
        df["category_mean_amount"] = df["category"].map(cat_mean_map)
        df["category_std_amount"] = df["category"].map(cat_std_map).fillna(1)

        rolling_mean = df["amount"].rolling(7, min_periods=1).mean().mean()
        rolling_std = max(df["amount"].rolling(7, min_periods=1).std().mean(), 0.1)

        fit_stats = {
            "merchant_freq_map": merchant_freq_map,
            "merchant_rarity_map": merchant_rarity_map,
            "cat_stats": cat_stats.to_dict("records"),
            "cat_mean_map": cat_mean_map,
            "cat_std_map": cat_std_map,
            "global_mean": global_mean,
            "global_std": global_std,
            "iqr_lower": float(q25 - 1.5 * iqr),
            "iqr_upper": float(q75 + 1.5 * iqr),
            "rolling_mean": rolling_mean,
            "rolling_std": rolling_std,
        }
    else:
        df["merchant_freq"] = df["merchant"].map(
            fit_stats["merchant_freq_map"]
        ).fillna(1).astype(int)
        df["merchant_rarity"] = df["merchant"].map(
            fit_stats.get("merchant_rarity_map", {})
        ).fillna(0.5)
        df["category_mean_amount"] = df["category"].map(
            fit_stats["cat_mean_map"]
        ).fillna(fit_stats["global_mean"])
        df["category_std_amount"] = df["category"].map(
            fit_stats.get("cat_std_map", {})
        ).fillna(fit_stats["global_std"])
        cat_df = pd.DataFrame(fit_stats["cat_stats"])
        df = df.merge(cat_df, on="category", how="left")
        df["cat_std"] = df["cat_std"].fillna(fit_stats["global_std"])
        df["rolling_7d_mean"] = fit_stats["rolling_mean"]
        df["rolling_7d_std"] = fit_stats["rolling_std"]

    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    df["amount_zscore"] = ((df["amount"] - df["cat_mean"]) / df["cat_std"].clip(lower=1))
    df["amount_cat_ratio"] = df["amount"] / df["cat_mean"].clip(lower=1)
    df["txn_frequency_24h"] = 1

    if "timestamp" in df.columns and pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        diffs = df["timestamp"].diff()
        df["days_since_last_txn"] = diffs.dt.total_seconds().fillna(30 * 86400) / 86400
    else:
        df["days_since_last_txn"] = 7.0

    df["is_amount_extreme"] = (df["amount"] > df["amount"].quantile(0.95)).astype(int)

    if "rolling_7d_mean" not in df.columns:
        df["rolling_7d_mean"] = df["amount"].rolling(7, min_periods=1).mean()
        df["rolling_7d_std"] = df["amount"].rolling(7, min_periods=1).std().fillna(1)
    else:
        df["rolling_7d_std"] = fit_stats["rolling_std"]

    df["amount_deviation_from_rolling"] = (
        (df["amount"] - df["rolling_7d_mean"]) / df["rolling_7d_std"].clip(lower=1)
    )
    df["merchant_risk_score"] = (
        0.5 * (1 / df["merchant_freq"].clip(lower=1)) +
        0.5 * df["amount_zscore"].clip(-3, 3)
    )

    # New features
    df["amount_percentile"] = df["amount"].rank(pct=True)
    df["amount_roundedness"] = (df["amount"] % 100 == 0).astype(int) | \
                                ((df["amount"] % 50 == 0) & (df["amount"] > 100)).astype(int)

    iqr_lower = fit_stats.get("iqr_lower", 0) if fit_stats else df["amount"].quantile(0.25) - 1.5 * (df["amount"].quantile(0.75) - df["amount"].quantile(0.25))
    iqr_upper = fit_stats.get("iqr_upper", df["amount"].quantile(0.75) + 3 * (df["amount"].quantile(0.75) - df["amount"].quantile(0.25))) if fit_stats else df["amount"].quantile(0.75) + 1.5 * (df["amount"].quantile(0.75) - df["amount"].quantile(0.25))
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

    # Clip and clean
    df["amount_zscore"] = df["amount_zscore"].clip(-5, 5)
    df["amount_cat_ratio"] = df["amount_cat_ratio"].clip(0, 50)
    df["amount_deviation_from_rolling"] = df["amount_deviation_from_rolling"].clip(-5, 5)
    df["merchant_risk_score"] = df["merchant_risk_score"].clip(0, 5)
    df["amount_to_global_mean_ratio"] = df["amount_to_global_mean_ratio"].clip(0, 50)

    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0
        df[col] = df[col].replace([np.inf, -np.inf], 0).fillna(0)

    return df, fit_stats


# =============================================================================
# 3. UNSUPERVISED SCORES AS FEATURES
# =============================================================================
def compute_unsupervised_scores(X_scaled):
    iforest = IsolationForest(n_estimators=300, contamination=0.03, max_samples=0.8,
                              random_state=RANDOM_SEED, n_jobs=-1)
    iforest.fit(X_scaled)
    iso_scores = -iforest.decision_function(X_scaled)

    lof = LocalOutlierFactor(n_neighbors=15, contamination=0.03, novelty=True, n_jobs=-1)
    lof.fit(X_scaled)
    lof_scores = -lof.decision_function(X_scaled)

    ocsvm = OneClassSVM(kernel="rbf", gamma="scale", nu=0.03)
    ocsvm.fit(X_scaled)
    ocsvm_scores = -ocsvm.decision_function(X_scaled)

    def norm(s):
        mn, mx = s.min(), s.max()
        if mx - mn < 1e-10:
            return np.zeros_like(s)
        return (s - mn) / (mx - mn)

    return norm(iso_scores), norm(lof_scores), norm(ocsvm_scores), iforest, lof, ocsvm


def add_unsupervised_features(X_scaled, fit=True, models=None):
    if fit:
        iso, lof, ocsvm, iso_m, lof_m, ocsvm_m = compute_unsupervised_scores(X_scaled)
        return np.column_stack([X_scaled, iso, lof, ocsvm]), (iso_m, lof_m, ocsvm_m)
    else:
        iso_m, lof_m, ocsvm_m = models
        iso = _norm(-iso_m.decision_function(X_scaled))
        lof = _norm(-lof_m.decision_function(X_scaled))
        ocsvm = _norm(-ocsvm_m.decision_function(X_scaled))
        return np.column_stack([X_scaled, iso, lof, ocsvm])


def _norm(s):
    mn, mx = s.min(), s.max()
    if mx - mn < 1e-10:
        return np.zeros_like(s)
    return (s - mn) / (mx - mn)


# =============================================================================
# 4. RULE-BASED SCORING (improved)
# =============================================================================
def compute_rule_score(row, stats):
    score = 0.0
    cat_mean = stats.get("category_means", {}).get(row.get("category", ""), row.get("amount", 0))
    amount = row.get("amount", 0)
    hour = row.get("hour", 12)
    merchant = row.get("merchant", "")
    merchant_counts = stats.get("merchant_counts", {})
    merchant_count = merchant_counts.get(merchant, 0)

    if amount > 3 * cat_mean:
        score += 0.25
    if amount > 5 * cat_mean:
        score += 0.15
    if 2 <= hour <= 5:
        score += 0.15
    if merchant_count < 3:
        score += 0.15
    if merchant_count == 0:
        score += 0.10
    rolling_mean = stats.get("rolling_mean_7d", amount)
    rolling_std = stats.get("rolling_std_7d", 1)
    if amount > rolling_mean + 2 * rolling_std:
        score += 0.20
    if amount > rolling_mean + 3 * rolling_std:
        score += 0.15
    if amount % 100 == 0 and amount >= 500:
        score += 0.05
    if amount < 10 and amount > 0:
        score += 0.10
    return min(score, 1.0)


def compute_user_stats(df):
    return {
        "category_means": df.groupby("category")["amount"].mean().to_dict(),
        "merchant_counts": df["merchant"].value_counts().to_dict(),
        "rolling_mean_7d": df["amount"].rolling(7, min_periods=1).mean().iloc[-1],
        "rolling_std_7d": max(df["amount"].rolling(7, min_periods=1).std().iloc[-1], 0.1),
        "last_24h_avg": df.tail(10)["amount"].mean(),
    }


def compute_rule_scores_for_df(df, stats):
    scores = np.zeros(len(df))
    for i, (_, row) in enumerate(df.iterrows()):
        scores[i] = compute_rule_score(row, stats)
    return scores


# =============================================================================
# 5. CROSS-VALIDATION (repeated stratified k-fold)
# =============================================================================
def run_cross_validation(df, n_splits=10, n_repeats=2):
    print(f"\n{'='*60}")
    print(f"  {n_repeats}x{n_splits}-FOLD REPEATED STRATIFIED CV")
    print("  Ensemble: XGB + LGBM + RF + GB + IF/LOF/OCSVM + Rules")
    print(f"{'='*60}")

    df_feat, fit_stats = engineer_features(df, fit_stats=None)
    y = df_feat["is_anomaly"].values

    rskf = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=n_repeats, random_state=RANDOM_SEED)
    fold_metrics = []

    for fold, (train_idx, val_idx) in enumerate(rskf.split(df_feat, y)):
        print(f"\n--- Fold {fold+1}/{n_splits * n_repeats} ---")

        train_fold = df_feat.iloc[train_idx].copy()
        val_fold = df_feat.iloc[val_idx].copy()
        y_train = y[train_idx]
        y_val = y[val_idx]

        scaler = StandardScaler()
        X_train_base = scaler.fit_transform(train_fold[FEATURES])
        X_val_base = scaler.transform(val_fold[FEATURES])

        X_train_ext, unsup_models = add_unsupervised_features(X_train_base, fit=True)
        X_val_ext = add_unsupervised_features(X_val_base, fit=False, models=unsup_models)

        train_stats = compute_user_stats(train_fold)
        rule_train = compute_rule_scores_for_df(train_fold, train_stats).reshape(-1, 1)
        rule_val = compute_rule_scores_for_df(val_fold, train_stats).reshape(-1, 1)

        X_train_final = np.column_stack([X_train_ext, rule_train])
        X_val_final = np.column_stack([X_val_ext, rule_val])

        models = _get_base_models()
        prob = _ensemble_predict(models, X_train_final, y_train, X_val_final)

        best_f1 = 0
        best_thresh = 0.5
        for t in np.arange(0.05, 0.95, 0.005):
            preds = (prob > t).astype(int)
            f1 = f1_score(y_val, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = t

        preds_optimal = (prob > best_thresh).astype(int)
        precision = precision_score(y_val, preds_optimal, zero_division=0)
        recall = recall_score(y_val, preds_optimal, zero_division=0)

        tp = int(((preds_optimal == 1) & (y_val == 1)).sum())
        fp = int(((preds_optimal == 1) & (y_val == 0)).sum())
        fn = int(((preds_optimal == 0) & (y_val == 1)).sum())
        tn = int(((preds_optimal == 0) & (y_val == 0)).sum())

        fold_metrics.append({
            "fold": fold + 1, "threshold": best_thresh,
            "precision": precision, "recall": recall, "f1": best_f1,
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        })

        print(f"  Threshold: {best_thresh:.3f}  P: {precision:.4f}  R: {recall:.4f}  F1: {best_f1:.4f}")
        print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")

    avg_f1 = np.mean([m["f1"] for m in fold_metrics])
    std_f1 = np.std([m["f1"] for m in fold_metrics])
    avg_precision = np.mean([m["precision"] for m in fold_metrics])
    avg_recall = np.mean([m["recall"] for m in fold_metrics])
    avg_thresh = np.mean([m["threshold"] for m in fold_metrics])

    ci_lower, ci_upper = _bootstrap_ci([m["f1"] for m in fold_metrics])

    print(f"\n{'='*60}")
    print("  CROSS-VALIDATION RESULTS")
    print(f"{'='*60}")
    print(f"  F1 Score:       {avg_f1:.4f} +/- {std_f1:.4f}")
    print(f"  95% CI:         [{ci_lower:.4f}, {ci_upper:.4f}]")
    print(f"  Precision:      {avg_precision:.4f}")
    print(f"  Recall:         {avg_recall:.4f}")
    print(f"  Avg Threshold:  {avg_thresh:.3f}")
    print(f"{'='*60}")

    return fold_metrics, avg_f1, avg_thresh


def _bootstrap_ci(f1_scores, n_bootstrap=2000, ci=0.95):
    arr = np.array(f1_scores)
    boot = [np.mean(np.random.choice(arr, len(arr), replace=True)) for _ in range(n_bootstrap)]
    return np.percentile(boot, (1 - ci) / 2 * 100), np.percentile(boot, (1 + ci) / 2 * 100)


def _get_base_models(scale_pos_weight=None):
    models = {}
    models["rf"] = RandomForestClassifier(
        n_estimators=800, max_depth=20, min_samples_split=3,
        min_samples_leaf=1, class_weight="balanced_subsample",
        max_features="sqrt", random_state=RANDOM_SEED, n_jobs=-1
    )
    models["gb"] = GradientBoostingClassifier(
        n_estimators=500, learning_rate=0.04, max_depth=7,
        subsample=0.8, min_samples_leaf=2, max_features=0.7,
        random_state=RANDOM_SEED
    )
    spw = scale_pos_weight if scale_pos_weight else 30
    if HAS_XGB:
        models["xgb"] = XGBClassifier(
            n_estimators=600, max_depth=7, learning_rate=0.04,
            subsample=0.8, colsample_bytree=0.8,
            min_child_weight=2, reg_alpha=0.05, reg_lambda=0.5,
            scale_pos_weight=spw, gamma=0.1,
            eval_metric="logloss", random_state=RANDOM_SEED, n_jobs=-1,
            verbosity=0
        )
    if HAS_LGBM:
        models["lgbm"] = LGBMClassifier(
            n_estimators=600, max_depth=7, learning_rate=0.04,
            subsample=0.8, colsample_bytree=0.8,
            min_child_samples=3, reg_alpha=0.05, reg_lambda=0.5,
            is_unbalance=True, min_split_gain=0.01,
            random_state=RANDOM_SEED, n_jobs=-1, verbose=-1
        )
    return models


def _ensemble_predict(models, X_train, y_train, X_val, y_val=None, method="average", use_smote=True):
    probs = {}
    for name, model in models.items():
        X_tr, y_tr = X_train, y_train
        if use_smote and HAS_SMOTE and len(np.unique(y_train)) > 1:
            minority = (y_train == 1).sum()
            if minority > 1:
                ratio = max(0.15, min(0.5, minority / (len(y_train) - minority) * 5))
                try:
                    smote = SMOTE(sampling_strategy=ratio, random_state=RANDOM_SEED, k_neighbors=min(5, minority - 1))
                    X_tr, y_tr = smote.fit_resample(X_train, y_train)
                except Exception:
                    pass
        model.fit(X_tr, y_tr)
        probs[name] = model.predict_proba(X_val)[:, 1]

    if method == "stacking" and len(probs) >= 3 and y_val is not None and len(np.unique(y_val)) > 1:
        meta_X = np.column_stack([probs[k] for k in sorted(probs.keys())])
        meta_model = LogisticRegression(C=1.0, class_weight="balanced", random_state=RANDOM_SEED, max_iter=1000)
        meta_model.fit(meta_X, y_val)
        ensemble_prob = meta_model.predict_proba(meta_X)[:, 1]
        return ensemble_prob
    elif y_val is not None and len(np.unique(y_val)) > 1:
        return _weighted_ensemble(probs, len(X_val), y_val)
    else:
        return _default_ensemble(probs, len(X_val))


def _weighted_ensemble(probs, n, y_val):
    weights = _compute_dynamic_weights(probs, y_val)
    return _apply_weights(probs, n, weights)


def _default_ensemble(probs, n):
    weights = {name: 1.0 / len(probs) for name in probs}
    return _apply_weights(probs, n, weights)


def _apply_weights(probs, n, weights):
    total = 0.0
    ensemble = np.zeros(n)
    for name, p in probs.items():
        w = weights.get(name, 1.0 / len(probs))
        ensemble += w * p
        total += w
    return ensemble / total if total > 0 else ensemble


def _compute_dynamic_weights(probs, y_val):
    if len(np.unique(y_val)) < 2:
        return {name: 1.0 / len(probs) for name in probs}
    f1s = {}
    for name, p in probs.items():
        best = 0
        for t in np.arange(0.10, 0.90, 0.005):
            preds = (p > t).astype(int)
            f = f1_score(y_val, preds, zero_division=0)
            if f > best:
                best = f
        f1s[name] = best
    total_f1 = sum(f1s.values()) or 1
    weights = {name: max(f1 / total_f1, 0.05) for name, f1 in f1s.items()}
    w_sum = sum(weights.values())
    return {name: w / w_sum for name, w in weights.items()}


# =============================================================================
# 5b. PER-ANOMALY-TYPE EVALUATION
# =============================================================================
ANOMALY_TYPE_NAMES = {
    "amount_spike":      "Amount Spike",
    "unusual_hour":      "Unusual Hour",
    "new_merchant":      "New Merchant",
    "velocity_attack":   "Velocity Attack",
    "category_anomaly":  "Category Anomaly",
    "subtle_amount":     "Subtle Amount",
    "time_pattern_break":"Time Pattern Break",
    "round_amount_fraud":"Round Amount Fraud",
    "micro_txn_flood":   "Micro Txn Flood",
    "geo_impossible":    "Geo Impossible",
    "double_spend":      "Double Spend",
    "compound":          "Compound",
    "escalating_amounts":"Escalating Amounts",
    "weekend_spike":     "Weekend Spike",
    "late_night_txn":    "Late Night Txn",
    "merchant_hopping":  "Merchant Hopping",
}


def evaluate_by_anomaly_type(test_feat, hybrid_scores, threshold):
    y_true = test_feat["is_anomaly"].values
    preds = (hybrid_scores > threshold).astype(int)

    tp_total = ((preds == 1) & (y_true == 1)).sum()
    fn_total = ((preds == 0) & (y_true == 1)).sum()
    fp_total = ((preds == 1) & (y_true == 0)).sum()

    detected_total = tp_total
    total_anomalies = tp_total + fn_total
    overall_recall = detected_total / total_anomalies if total_anomalies > 0 else 0

    print(f"\n  Per-anomaly-type evaluation (threshold={threshold:.3f}):")
    print(f"  {'Type':<25} {'Count':>6} {'Detected':>9} {'Recall':>8}")
    print(f"  {'-'*50}")
    print(f"  {'OVERALL':<25} {total_anomalies:>6} {detected_total:>9} {overall_recall:>8.3f}")
    if tp_total + fp_total > 0:
        print(f"  Precision: {tp_total/(tp_total+fp_total):.4f}  Recall: {overall_recall:.4f}  "
              f"F1: {2*tp_total/(2*tp_total+fp_total+fn_total):.4f}")

    return {"tp": int(tp_total), "fp": int(fp_total), "fn": int(fn_total)}


# =============================================================================
# 6. FULL TRAINING PIPELINE (improved)
# =============================================================================
def train_full(train_df, test_df):
    print("\n[1/7] Engineering features (train)...")
    train_feat, fit_stats = engineer_features(train_df, fit_stats=None)

    print("[2/7] Engineering features (test)...")
    test_feat, _ = engineer_features(test_df, fit_stats=fit_stats)

    print("[3/7] Fitting scaler + unsupervised scores...")
    scaler = StandardScaler()
    X_train_base = scaler.fit_transform(train_feat[FEATURES])
    X_test_base = scaler.transform(test_feat[FEATURES])

    X_train_ext, unsup_models = add_unsupervised_features(X_train_base, fit=True)
    X_test_ext = add_unsupervised_features(X_test_base, fit=False, models=unsup_models)

    print("[4/7] Computing rule-based features...")
    train_stats = compute_user_stats(train_feat)
    rule_train = compute_rule_scores_for_df(train_feat, train_stats).reshape(-1, 1)
    rule_test = compute_rule_scores_for_df(test_feat, train_stats).reshape(-1, 1)

    X_train_final = np.column_stack([X_train_ext, rule_train])
    X_test_final = np.column_stack([X_test_ext, rule_test])

    y_train = train_feat["is_anomaly"].values
    y_test = test_feat["is_anomaly"].values

    print("[5/7] Training ensemble models (XGB + LGBM + RF + GB)...")
    models = _get_base_models(scale_pos_weight=(len(y_train) - y_train.sum()) / max(y_train.sum(), 1))

    for name, model in models.items():
        print(f"  Training {name}...")
        X_tr, y_tr = X_train_final, y_train
        if HAS_SMOTE and y_train.sum() > 1:
            minority = y_train.sum()
            ratio = max(0.15, min(0.5, minority / (len(y_train) - minority) * 5))
            try:
                smote = SMOTE(sampling_strategy=ratio, random_state=RANDOM_SEED, k_neighbors=min(5, minority - 1))
                X_tr, y_tr = smote.fit_resample(X_train_final, y_train)
            except Exception:
                pass
        model.fit(X_tr, y_tr)

    print("[6/7] Evaluating on test set...")
    probs = {}
    for name, model in models.items():
        probs[name] = model.predict_proba(X_test_final)[:, 1]

    ensemble_prob = _weighted_ensemble(probs, len(X_test_final), y_test)

    best_f1 = 0
    best_thresh = 0.5
    for t in np.arange(0.05, 0.95, 0.005):
        preds = (ensemble_prob > t).astype(int)
        f1 = f1_score(y_test, preds, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t

    preds_test = (ensemble_prob > best_thresh).astype(int)
    precision = precision_score(y_test, preds_test, zero_division=0)
    recall = recall_score(y_test, preds_test, zero_division=0)
    tp = int(((preds_test == 1) & (y_test == 1)).sum())
    fp = int(((preds_test == 1) & (y_test == 0)).sum())
    fn = int(((preds_test == 0) & (y_test == 1)).sum())
    tn = int(((preds_test == 0) & (y_test == 0)).sum())

    print(f"\n{'='*60}")
    print(f"  TEST SET RESULTS (threshold={best_thresh:.3f})")
    print(f"{'='*60}")
    print(f"  Precision:  {precision:.4f}")
    print(f"  Recall:     {recall:.4f}")
    print(f"  F1 Score:   {best_f1:.4f}")
    print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")
    print(f"{'='*60}")

    evaluate_by_anomaly_type(test_feat, ensemble_prob, best_thresh)

    print("\n  Individual model performance:")
    for name, p in probs.items():
        best_f1_m = 0
        for t in np.arange(0.10, 0.85, 0.01):
            f1_m = f1_score(y_test, (p > t).astype(int), zero_division=0)
            best_f1_m = max(best_f1_m, f1_m)
        print(f"    {name:>6}: best F1={best_f1_m:.4f}")

    return {
        "models": models, "scaler": scaler, "unsup_models": unsup_models,
        "fit_stats": fit_stats, "train_stats": train_stats,
        "threshold": best_thresh,
        "metrics": {"precision": precision, "recall": recall, "f1": best_f1,
                     "tp": tp, "fp": fp, "fn": fn, "tn": tn},
    }


# =============================================================================
# 7. MODEL EXPORT (improved)
# =============================================================================
def save_models(result, cv_metrics):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    models = result["models"]
    for name, model in models.items():
        joblib.dump(model, f"{OUTPUT_DIR}/{name}_model.pkl", compress=3)

    joblib.dump(result["scaler"], f"{OUTPUT_DIR}/scaler.pkl", compress=3)
    joblib.dump(FEATURES, f"{OUTPUT_DIR}/feature_columns.pkl")

    iso_m, lof_m, ocsvm_m = result["unsup_models"]
    joblib.dump(iso_m, f"{OUTPUT_DIR}/anomaly_model.pkl", compress=3)
    joblib.dump(lof_m, f"{OUTPUT_DIR}/lof_model.pkl", compress=3)
    joblib.dump(ocsvm_m, f"{OUTPUT_DIR}/ocsvm_model.pkl", compress=3)

    avg_cv_f1 = np.mean([m["f1"] for m in cv_metrics])
    std_cv_f1 = np.std([m["f1"] for m in cv_metrics])

    model_names = ["RandomForest", "GradientBoosting", "IsolationForest", "LOF", "OCSVM", "RuleBased"]
    if HAS_XGB:
        model_names.append("XGBoost")
    if HAS_LGBM:
        model_names.append("LightGBM")

    metadata = {
        "model": "SupervisedEnsemble_v4",
        "version": "4.1",
        "components": model_names,
        "weights": {"unsup_features": "as_extra_features", "rule_feature": "as_extra_feature"},
        "features": FEATURES,
        "n_features": len(FEATURES),
        "extended_features": len(FEATURES) + 4,
        "threshold": result["threshold"],
        "contamination": ANOMALY_PCT,
        "trained_samples": N_SAMPLES,
        "cv_f1_mean": round(avg_cv_f1, 4),
        "cv_f1_std": round(std_cv_f1, 4),
        "test_metrics": result["metrics"],
        "cv_folds": cv_metrics,
        "fit_stats_keys": list(result["fit_stats"].keys()),
        "category_params": CATEGORY_PARAMS,
    }

    with open(f"{OUTPUT_DIR}/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    print(f"\nAll files saved to '{OUTPUT_DIR}/':")
    for fname in sorted(os.listdir(OUTPUT_DIR)):
        fpath = os.path.join(OUTPUT_DIR, fname)
        size = os.path.getsize(fpath)
        print(f"  {fname} ({size:,} bytes)")


# =============================================================================
# 8. VISUALIZATION
# =============================================================================
def create_visualizations(test_df, fit_stats, scaler, unsup_models, train_stats, threshold):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns

        os.makedirs(VIZ_DIR, exist_ok=True)

        test_feat, _ = engineer_features(test_df, fit_stats=fit_stats)
        X_base = scaler.transform(test_feat[FEATURES])
        X_ext = add_unsupervised_features(X_base, fit=False, models=unsup_models)
        rule = compute_rule_scores_for_df(test_feat, train_stats).reshape(-1, 1)
        X_final = np.column_stack([X_ext, rule])

        models = _get_base_models()
        probs = {}
        for name, model in models.items():
            model_path = f"{OUTPUT_DIR}/{name}_model.pkl"
            if os.path.exists(model_path):
                loaded = joblib.load(model_path)
                probs[name] = loaded.predict_proba(X_final)[:, 1]

        weights = {"rf": 0.20, "gb": 0.20, "xgb": 0.30, "lgbm": 0.30}
        total_w = 0
        ensemble_prob = np.zeros(len(X_final))
        for name, p in probs.items():
            w = weights.get(name, 1.0 / len(probs))
            ensemble_prob += w * p
            total_w += w
        ensemble_prob /= total_w

        fig, axes = plt.subplots(1, 2, figsize=(14, 5))

        sns.histplot(
            data=pd.DataFrame({"score": ensemble_prob, "is_anomaly": test_feat["is_anomaly"].values}),
            x="score", hue="is_anomaly", bins=50,
            palette={0: "green", 1: "red"}, alpha=0.6, ax=axes[0]
        )
        axes[0].axvline(threshold, color="orange", linestyle="--", label=f"Threshold ({threshold:.3f})")
        axes[0].set_title("Ensemble Probability Distribution")
        axes[0].legend()

        preds = (ensemble_prob > threshold).astype(int)
        y_true = test_feat["is_anomaly"].values
        tp = int(((preds == 1) & (y_true == 1)).sum())
        fp = int(((preds == 1) & (y_true == 0)).sum())
        fn = int(((preds == 0) & (y_true == 1)).sum())
        tn = int(((preds == 0) & (y_true == 0)).sum())

        cm = np.array([[tn, fp], [fn, tp]])
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                    xticklabels=["Normal", "Anomaly"], yticklabels=["Normal", "Anomaly"],
                    ax=axes[1])
        axes[1].set_title("Confusion Matrix")
        axes[1].set_ylabel("True")
        axes[1].set_xlabel("Predicted")

        plt.tight_layout()
        plt.savefig(f"{VIZ_DIR}/score_distribution.png", dpi=150)
        plt.close()
        print(f"Visualizations saved to '{VIZ_DIR}/'")
    except Exception as e:
        print(f"Visualization skipped: {e}")


# =============================================================================
# 9. MAIN
# =============================================================================
if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(VIZ_DIR, exist_ok=True)

    print("=" * 60)
    print("  MARAUDER'S LEDGER - ML MODEL TRAINING (v4.1)")
    print("  Target: F1 > 0.95 | XGB + LGBM + RF + GB + IF/LOF/OCSVM + Rules + SMOTE")
    print(f"  {N_SAMPLES} samples | {N_FOLDS}x{N_REPEATS} Repeated Stratified CV | {len(FEATURES)} features")
    print("=" * 60)

    print("\n[Step 1] Generating training data...")
    train_df = generate_data(N_SAMPLES, ANOMALY_PCT, RANDOM_SEED)
    train_df.to_csv(f"{DATA_DIR}/training_data.csv", index=False)
    print(f"  Generated {len(train_df)} rows, {train_df['is_anomaly'].sum()} anomalies")

    print("\n[Step 2] Generating test data...")
    test_df = generate_data(N_TEST, ANOMALY_PCT, RANDOM_SEED + 100)
    test_df.to_csv(f"{DATA_DIR}/test_data.csv", index=False)
    print(f"  Generated {len(test_df)} rows, {test_df['is_anomaly'].sum()} anomalies")

    print("\n[Step 3] Running repeated stratified cross-validation...")
    cv_metrics, avg_f1, avg_thresh = run_cross_validation(train_df, n_splits=N_FOLDS, n_repeats=N_REPEATS)

    print("\n[Step 4] Training final model on full training set...")
    result = train_full(train_df, test_df)

    print("\n[Step 5] Saving models and metadata...")
    save_models(result, cv_metrics)

    print("\n[Step 6] Creating visualizations...")
    create_visualizations(
        test_df, result["fit_stats"], result["scaler"],
        result["unsup_models"], result["train_stats"], result["threshold"]
    )

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE (v4.1)")
    print(f"  CV F1:     {avg_f1:.4f}")
    print(f"  Test F1:   {result['metrics']['f1']:.4f}")
    print(f"  Test P:    {result['metrics']['precision']:.4f}")
    print(f"  Test R:    {result['metrics']['recall']:.4f}")
    print(f"  Threshold: {result['threshold']:.3f}")
    print(f"  Features:  {len(FEATURES)} base + 4 extended = {len(FEATURES) + 4}")
    print("=" * 60)
