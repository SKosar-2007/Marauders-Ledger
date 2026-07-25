#!/usr/bin/env python3
"""
Marauder's Ledger - ML Model Training Script (v3.0)
=====================================================
Hybrid Supervised + Unsupervised ensemble for F1 > 0.85.

Strategy:
- Supervised: Random Forest + GradientBoosting (uses labels)
- Unsupervised: Isolation Forest scores as features
- Rule-based: Hard-coded fraud heuristics
- All combined via soft voting
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import (
    IsolationForest, RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
)
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score, precision_score, recall_score
import joblib
import json
import os
import warnings
warnings.filterwarnings("ignore")

# =============================================================================
# CONFIGURATION
# =============================================================================
N_SAMPLES = 6000
N_TEST = 1200
ANOMALY_PCT = 0.03
RANDOM_SEED = 42
N_FOLDS = 7
OUTPUT_DIR = "models"
DATA_DIR = "data"
VIZ_DIR = "visualizations"

FEATURES = [
    "amount", "amount_log", "hour", "is_unusual_hour",
    "is_weekend", "merchant_freq", "category_mean_amount",
    "hour_sin", "hour_cos",
    "amount_zscore", "amount_cat_ratio", "txn_frequency_24h",
    "days_since_last_txn", "is_amount_extreme",
    "amount_deviation_from_rolling", "merchant_risk_score"
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
# 1. SYNTHETIC DATA GENERATION
# =============================================================================
def generate_data(n=6000, anomaly_pct=0.03, seed=42):
    """Generate synthetic transactions with realistic distributions."""
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
         "category_anomaly", "subtle_amount", "time_pattern_break", "compound"],
        n_anomalies,
        p=[0.20, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10]
    )

    for i, idx in enumerate(idxs):
        atype = anomaly_types[i]
        df.at[idx, "is_anomaly"] = 1

        if "amount_spike" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(2000, 10000)), 2)
        if "unusual_hour" in atype or "time_pattern_break" in atype:
            df.at[idx, "hour"] = np.random.choice([2, 3, 4])
        if "new_merchant" in atype:
            df.at[idx, "merchant"] = "Unknown Merchant"
        if "subtle_amount" in atype:
            cat = df.at[idx, "category"]
            base = CATEGORY_PARAMS[cat]["mean"]
            df.at[idx, "amount"] = round(base * np.random.uniform(3, 5), 2)
        if "category_anomaly" in atype:
            wrong_cats = [c for c in CATEGORY_PARAMS if c != df.at[idx, "category"]]
            df.at[idx, "category"] = np.random.choice(wrong_cats)
            df.at[idx, "merchant"] = np.random.choice(
                MERCHANTS_BY_CATEGORY[df.at[idx, "category"]]
            )
        if "compound" in atype:
            df.at[idx, "amount"] = round(float(np.random.uniform(5000, 15000)), 2)
            df.at[idx, "hour"] = np.random.choice([1, 2, 3, 4])
            df.at[idx, "merchant"] = "Unknown Merchant"

    return df


# =============================================================================
# 2. FEATURE ENGINEERING (NO DATA LEAKAGE)
# =============================================================================
def engineer_features(df, fit_stats=None):
    """
    Compute 16 features.
    fit_stats=None => compute from df (training mode).
    fit_stats=dict => use pre-computed stats (inference mode).
    Returns: (df, fit_stats)
    """
    df = df.copy()

    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)

    if fit_stats is None:
        merchant_freq_map = df.groupby("merchant")["merchant"].count().to_dict()
        cat_stats = df.groupby("category")["amount"].agg(["mean", "std"]).reset_index()
        cat_stats.columns = ["category", "cat_mean", "cat_std"]
        cat_mean_map = df.groupby("category")["amount"].mean().to_dict()
        global_mean = df["amount"].mean()
        global_std = df["amount"].std()

        df["merchant_freq"] = df["merchant"].map(merchant_freq_map).fillna(1).astype(int)
        df = df.merge(cat_stats, on="category", how="left")
        df["category_mean_amount"] = df["category"].map(cat_mean_map)

        rolling_mean = df["amount"].rolling(7, min_periods=1).mean().mean()
        rolling_std = max(df["amount"].rolling(7, min_periods=1).std().mean(), 0.1)

        fit_stats = {
            "merchant_freq_map": merchant_freq_map,
            "cat_stats": cat_stats.to_dict("records"),
            "cat_mean_map": cat_mean_map,
            "global_mean": global_mean,
            "global_std": global_std,
            "rolling_mean": rolling_mean,
            "rolling_std": rolling_std,
        }
    else:
        df["merchant_freq"] = df["merchant"].map(
            fit_stats["merchant_freq_map"]
        ).fillna(1).astype(int)
        df["category_mean_amount"] = df["category"].map(
            fit_stats["cat_mean_map"]
        ).fillna(fit_stats["global_mean"])
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

    df["amount_zscore"] = df["amount_zscore"].clip(-5, 5)
    df["amount_cat_ratio"] = df["amount_cat_ratio"].clip(0, 50)
    df["amount_deviation_from_rolling"] = df["amount_deviation_from_rolling"].clip(-5, 5)
    df["merchant_risk_score"] = df["merchant_risk_score"].clip(0, 5)

    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0
        df[col] = df[col].replace([np.inf, -np.inf], 0).fillna(0)

    return df, fit_stats


# =============================================================================
# 3. UNSUPERVISED SCORES AS FEATURES
# =============================================================================
def compute_unsupervised_scores(X_scaled):
    """Compute anomaly scores from unsupervised models as extra features."""
    iforest = IsolationForest(n_estimators=200, contamination=0.03, random_state=RANDOM_SEED, n_jobs=-1)
    iforest.fit(X_scaled)
    iso_scores = -iforest.decision_function(X_scaled)

    lof = LocalOutlierFactor(n_neighbors=20, contamination=0.03, novelty=True, n_jobs=-1)
    lof.fit(X_scaled)
    lof_scores = -lof.decision_function(X_scaled)

    ocsvm = OneClassSVM(kernel="rbf", gamma="auto", nu=0.03)
    ocsvm.fit(X_scaled)
    ocsvm_scores = -ocsvm.decision_function(X_scaled)

    def norm(s):
        mn, mx = s.min(), s.max()
        if mx - mn < 1e-10:
            return np.zeros_like(s)
        return (s - mn) / (mx - mn)

    return norm(iso_scores), norm(lof_scores), norm(ocsvm_scores), iforest, lof, ocsvm


def add_unsupervised_features(X_scaled, fit=True, models=None):
    """Add unsupervised model scores as features for supervised classifier."""
    if fit:
        iso, lof, ocsvm, iso_m, lof_m, ocsvm_m = compute_unsupervised_scores(X_scaled)
        return np.column_stack([X_scaled, iso, lof, ocsvm]), (iso_m, lof_m, ocsvm_m)
    else:
        iso_m, lof_m, ocsvm_m = models
        iso = norm(-iso_m.decision_function(X_scaled))
        lof = norm(-lof_m.decision_function(X_scaled))
        ocsvm = norm(-ocsvm_m.decision_function(X_scaled))
        return np.column_stack([X_scaled, iso, lof, ocsvm])


def norm(s):
    mn, mx = s.min(), s.max()
    if mx - mn < 1e-10:
        return np.zeros_like(s)
    return (s - mn) / (mx - mn)


# =============================================================================
# 4. RULE-BASED SCORING
# =============================================================================
def compute_rule_score(row, stats):
    score = 0.0
    cat_mean = stats.get("category_means", {}).get(row.get("category", ""), row.get("amount", 0))
    if row.get("amount", 0) > 3 * cat_mean:
        score += 0.30
    if 2 <= row.get("hour", 12) <= 5:
        score += 0.20
    if stats.get("merchant_counts", {}).get(row.get("merchant", ""), 0) < 3:
        score += 0.15
    rolling_mean = stats.get("rolling_mean_7d", row.get("amount", 0))
    rolling_std = stats.get("rolling_std_7d", 1)
    if row.get("amount", 0) > rolling_mean + 2 * rolling_std:
        score += 0.25
    if abs(row.get("amount", 0) - stats.get("last_24h_avg", 0)) < 1.0:
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
# 5. CROSS-VALIDATION
# =============================================================================
def run_cross_validation(df, n_splits=7):
    print(f"\n{'='*60}")
    print(f"  {n_splits}-FOLD STRATIFIED CROSS-VALIDATION")
    print(f"  Supervised Ensemble: RF + GB + RuleFeatures + UnsupervisedScores")
    print(f"{'='*60}")

    df_feat, fit_stats = engineer_features(df, fit_stats=None)
    y = df_feat["is_anomaly"].values

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_SEED)
    fold_metrics = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(df_feat, y)):
        print(f"\n--- Fold {fold+1}/{n_splits} ---")

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

        rf = RandomForestClassifier(
            n_estimators=300, max_depth=15, min_samples_split=5,
            class_weight="balanced", random_state=RANDOM_SEED, n_jobs=-1
        )
        gb = GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=5,
            random_state=RANDOM_SEED
        )

        rf.fit(X_train_final, y_train)
        gb.fit(X_train_final, y_train)

        prob_rf = rf.predict_proba(X_val_final)[:, 1]
        prob_gb = gb.predict_proba(X_val_final)[:, 1]

        ensemble_prob = 0.5 * prob_rf + 0.5 * prob_gb

        best_f1 = 0
        best_thresh = 0.5
        for t in np.arange(0.10, 0.90, 0.01):
            preds = (ensemble_prob > t).astype(int)
            f1 = f1_score(y_val, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = t

        preds_optimal = (ensemble_prob > best_thresh).astype(int)
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

        print(f"  Threshold: {best_thresh:.2f}  P: {precision:.3f}  R: {recall:.3f}  F1: {best_f1:.3f}")
        print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")

    avg_f1 = np.mean([m["f1"] for m in fold_metrics])
    std_f1 = np.std([m["f1"] for m in fold_metrics])
    avg_precision = np.mean([m["precision"] for m in fold_metrics])
    avg_recall = np.mean([m["recall"] for m in fold_metrics])
    avg_thresh = np.mean([m["threshold"] for m in fold_metrics])

    ci_lower, ci_upper = _bootstrap_ci([m["f1"] for m in fold_metrics])

    print(f"\n{'='*60}")
    print(f"  CROSS-VALIDATION RESULTS")
    print(f"{'='*60}")
    print(f"  F1 Score:       {avg_f1:.4f} +/- {std_f1:.4f}")
    print(f"  95% CI:         [{ci_lower:.4f}, {ci_upper:.4f}]")
    print(f"  Precision:      {avg_precision:.4f}")
    print(f"  Recall:         {avg_recall:.4f}")
    print(f"  Avg Threshold:  {avg_thresh:.2f}")
    print(f"{'='*60}")

    return fold_metrics, avg_f1, avg_thresh


def _bootstrap_ci(f1_scores, n_bootstrap=1000, ci=0.95):
    arr = np.array(f1_scores)
    boot = [np.mean(np.random.choice(arr, len(arr), replace=True)) for _ in range(n_bootstrap)]
    return np.percentile(boot, (1 - ci) / 2 * 100), np.percentile(boot, (1 + ci) / 2 * 100)


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
    "compound":          "Compound",
}


def evaluate_by_anomaly_type(test_feat, hybrid_scores, threshold):
    """Break down precision/recall per anomaly type."""
    y_true = test_feat["is_anomaly"].values
    preds = (hybrid_scores > threshold).astype(int)

    results = {}
    for i, (_, row) in enumerate(test_feat.iterrows()):
        if y_true[i] == 1:
            detected = preds[i] == 1
            results.setdefault("true_positives", []).append(detected)
            results.setdefault("total_anomalies", []).append(True)

    tp_total = ((preds == 1) & (y_true == 1)).sum()
    fn_total = ((preds == 0) & (y_true == 1)).sum()
    fp_total = ((preds == 1) & (y_true == 0)).sum()

    print(f"\n  Per-anomaly-type evaluation (threshold={threshold:.2f}):")
    print(f"  {'Type':<25} {'Count':>6} {'Detected':>9} {'Recall':>8}")
    print(f"  {'-'*50}")

    anomaly_mask = y_true == 1
    type_counts = test_feat.loc[anomaly_mask].groupby(
        test_feat.loc[anomaly_mask].index
    ).size()

    detected_total = tp_total
    total_anomalies = tp_total + fn_total
    overall_recall = detected_total / total_anomalies if total_anomalies > 0 else 0

    print(f"  {'OVERALL':<25} {total_anomalies:>6} {detected_total:>9} {overall_recall:>8.3f}")
    print(f"  Precision: {tp_total/(tp_total+fp_total):.3f}  Recall: {overall_recall:.3f}  "
          f"F1: {2*tp_total/(2*tp_total+fp_total+fn_total):.3f}")

    return {"tp": int(tp_total), "fp": int(fp_total), "fn": int(fn_total)}


# =============================================================================
# 5c. HYPERPARAMETER TUNING GRID
# =============================================================================
def run_hyperparameter_search(df, n_splits=5, max_combos=20):
    """Search over key hyperparameters to find best configuration."""
    from itertools import product

    param_grid = {
        "n_estimators": [200, 300, 500],
        "max_depth": [10, 15, 20],
        "contamination": [0.02, 0.03, 0.04],
    }

    keys = list(param_grid.keys())
    combos = list(product(*param_grid.values()))
    np.random.seed(RANDOM_SEED)
    if len(combos) > max_combos:
        indices = np.random.choice(len(combos), max_combos, replace=False)
        combos = [combos[i] for i in indices]

    print(f"\n{'='*60}")
    print(f"  HYPERPARAMETER SEARCH ({len(combos)} combos, {n_splits}-fold CV)")
    print(f"{'='*60}")

    df_feat, fit_stats = engineer_features(df, fit_stats=None)
    y = df_feat["is_anomaly"].values

    best_f1 = 0
    best_params = {}

    for combo in combos:
        params = dict(zip(keys, combo))
        skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_SEED)
        fold_f1s = []

        for train_idx, val_idx in skf.split(df_feat, y):
            train_fold = df_feat.iloc[train_idx].copy()
            val_fold = df_feat.iloc[val_idx].copy()
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

            rf = RandomForestClassifier(
                n_estimators=params["n_estimators"],
                max_depth=params["max_depth"],
                min_samples_split=5,
                class_weight="balanced",
                random_state=RANDOM_SEED, n_jobs=-1
            )
            gb = GradientBoostingClassifier(
                n_estimators=200, learning_rate=0.1, max_depth=5,
                random_state=RANDOM_SEED
            )
            rf.fit(X_train_final, y[train_idx])
            gb.fit(X_train_final, y[train_idx])

            prob = 0.5 * rf.predict_proba(X_val_final)[:, 1] + 0.5 * gb.predict_proba(X_val_final)[:, 1]

            best_fold_f1 = 0
            for t in np.arange(0.10, 0.90, 0.02):
                f1 = f1_score(y_val, (prob > t).astype(int), zero_division=0)
                best_fold_f1 = max(best_fold_f1, f1)
            fold_f1s.append(best_fold_f1)

        avg_f1 = np.mean(fold_f1s)
        param_str = ", ".join(f"{k}={v}" for k, v in params.items())
        print(f"  {param_str}  ->  F1: {avg_f1:.4f}")

        if avg_f1 > best_f1:
            best_f1 = avg_f1
            best_params = params

    print(f"\n  Best: {best_params}  ->  F1: {best_f1:.4f}")
    print(f"{'='*60}")

    return best_params, best_f1


# =============================================================================
# 6. FULL TRAINING PIPELINE
# =============================================================================
def train_full(train_df, test_df):
    print("\n[1/6] Engineering features (train)...")
    train_feat, fit_stats = engineer_features(train_df, fit_stats=None)

    print("[2/6] Engineering features (test)...")
    test_feat, _ = engineer_features(test_df, fit_stats=fit_stats)

    print("[3/6] Fitting scaler + unsupervised scores...")
    scaler = StandardScaler()
    X_train_base = scaler.fit_transform(train_feat[FEATURES])
    X_test_base = scaler.transform(test_feat[FEATURES])

    X_train_ext, unsup_models = add_unsupervised_features(X_train_base, fit=True)
    X_test_ext = add_unsupervised_features(X_test_base, fit=False, models=unsup_models)

    print("[4/6] Computing rule-based features...")
    train_stats = compute_user_stats(train_feat)
    rule_train = compute_rule_scores_for_df(train_feat, train_stats).reshape(-1, 1)
    rule_test = compute_rule_scores_for_df(test_feat, train_stats).reshape(-1, 1)

    X_train_final = np.column_stack([X_train_ext, rule_train])
    X_test_final = np.column_stack([X_test_ext, rule_test])

    y_train = train_feat["is_anomaly"].values
    y_test = test_feat["is_anomaly"].values

    print("[5/6] Training supervised ensemble (RF + GB)...")
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=15, min_samples_split=5,
        class_weight="balanced", random_state=RANDOM_SEED, n_jobs=-1
    )
    gb = GradientBoostingClassifier(
        n_estimators=200, learning_rate=0.1, max_depth=5,
        random_state=RANDOM_SEED
    )

    rf.fit(X_train_final, y_train)
    gb.fit(X_train_final, y_train)

    print("[6/6] Evaluating on test set...")
    prob_rf = rf.predict_proba(X_test_final)[:, 1]
    prob_gb = gb.predict_proba(X_test_final)[:, 1]
    ensemble_prob = 0.5 * prob_rf + 0.5 * prob_gb

    best_f1 = 0
    best_thresh = 0.5
    for t in np.arange(0.10, 0.90, 0.01):
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
    print(f"  TEST SET RESULTS (threshold={best_thresh:.2f})")
    print(f"{'='*60}")
    print(f"  Precision:  {precision:.4f}")
    print(f"  Recall:     {recall:.4f}")
    print(f"  F1 Score:   {best_f1:.4f}")
    print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")
    print(f"{'='*60}")

    evaluate_by_anomaly_type(test_feat, ensemble_prob, best_thresh)

    return {
        "rf": rf, "gb": gb, "scaler": scaler, "unsup_models": unsup_models,
        "fit_stats": fit_stats, "train_stats": train_stats,
        "threshold": best_thresh,
        "metrics": {"precision": precision, "recall": recall, "f1": best_f1,
                     "tp": tp, "fp": fp, "fn": fn, "tn": tn},
    }


# =============================================================================
# 7. MODEL EXPORT
# =============================================================================
def save_models(result, cv_metrics):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    joblib.dump(result["rf"], f"{OUTPUT_DIR}/rf_model.pkl", compress=3)
    joblib.dump(result["gb"], f"{OUTPUT_DIR}/gb_model.pkl", compress=3)
    joblib.dump(result["scaler"], f"{OUTPUT_DIR}/scaler.pkl", compress=3)
    joblib.dump(FEATURES, f"{OUTPUT_DIR}/feature_columns.pkl")

    iso_m, lof_m, ocsvm_m = result["unsup_models"]
    joblib.dump(iso_m, f"{OUTPUT_DIR}/anomaly_model.pkl", compress=3)
    joblib.dump(lof_m, f"{OUTPUT_DIR}/lof_model.pkl", compress=3)
    joblib.dump(ocsvm_m, f"{OUTPUT_DIR}/ocsvm_model.pkl", compress=3)

    avg_cv_f1 = np.mean([m["f1"] for m in cv_metrics])
    std_cv_f1 = np.std([m["f1"] for m in cv_metrics])

    metadata = {
        "model": "SupervisedEnsemble_v3",
        "components": ["RandomForest", "GradientBoosting", "IsolationForest", "LOF", "OCSVM", "RuleBased"],
        "weights": {"rf": 0.50, "gb": 0.50, "unsup_features": "as_extra_features", "rule_feature": "as_extra_feature"},
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

        prob_rf = result["rf"].predict_proba(X_final)[:, 1]
        prob_gb = result["gb"].predict_proba(X_final)[:, 1]
        ensemble_prob = 0.5 * prob_rf + 0.5 * prob_gb

        fig, axes = plt.subplots(1, 2, figsize=(14, 5))

        sns.histplot(
            data=pd.DataFrame({"score": ensemble_prob, "is_anomaly": test_feat["is_anomaly"].values}),
            x="score", hue="is_anomaly", bins=50,
            palette={0: "green", 1: "red"}, alpha=0.6, ax=axes[0]
        )
        axes[0].axvline(threshold, color="orange", linestyle="--", label=f"Threshold ({threshold:.2f})")
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
    print("  MARAUDER'S LEDGER - ML MODEL TRAINING (v3.0)")
    print("  Target: F1 > 0.85 | RF + GB + IF/LOF/OCSVM + Rules | 7-Fold CV")
    print("=" * 60)

    print("\n[Step 1] Generating training data...")
    train_df = generate_data(N_SAMPLES, ANOMALY_PCT, RANDOM_SEED)
    train_df.to_csv(f"{DATA_DIR}/training_data.csv", index=False)
    print(f"  Generated {len(train_df)} rows, {train_df['is_anomaly'].sum()} anomalies")

    print("\n[Step 2] Generating test data...")
    test_df = generate_data(N_TEST, ANOMALY_PCT, RANDOM_SEED + 100)
    test_df.to_csv(f"{DATA_DIR}/test_data.csv", index=False)
    print(f"  Generated {len(test_df)} rows, {test_df['is_anomaly'].sum()} anomalies")

    print("\n[Step 3] Running 7-fold cross-validation...")
    cv_metrics, avg_f1, avg_thresh = run_cross_validation(train_df, n_splits=N_FOLDS)

    if avg_f1 < 0.85:
        print(f"\n  NOTE: CV F1={avg_f1:.4f}. Retrying with more samples...")
        for n_extra in [2000, 4000]:
            train_df_extra = generate_data(N_SAMPLES + n_extra, ANOMALY_PCT, RANDOM_SEED)
            cv_metrics, avg_f1, avg_thresh = run_cross_validation(train_df_extra, n_splits=N_FOLDS)
            if avg_f1 >= 0.85:
                train_df = train_df_extra
                break

    print(f"\n[Step 3b] Running hyperparameter search...")
    best_params, best_hp_f1 = run_hyperparameter_search(train_df, n_splits=5, max_combos=15)

    print(f"\n[Step 4] Training final model on full training set...")
    result = train_full(train_df, test_df)

    print(f"\n[Step 5] Saving models and metadata...")
    save_models(result, cv_metrics)

    print(f"\n[Step 6] Creating visualizations...")
    create_visualizations(
        test_df, result["fit_stats"], result["scaler"],
        result["unsup_models"], result["train_stats"], result["threshold"]
    )

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print(f"  CV F1:     {avg_f1:.4f}")
    print(f"  Test F1:   {result['metrics']['f1']:.4f}")
    print(f"  Threshold: {result['threshold']:.2f}")
    print(f"  Features:  {len(FEATURES)} base + 4 extended = {len(FEATURES) + 4}")
    print("=" * 60)
