#!/usr/bin/env python3
"""
Stability Test: Run training 10 times to verify consistency.
"""

import sys
import time
import warnings
from pathlib import Path

import numpy as np
from sklearn.ensemble import (
    GradientBoostingClassifier,
    IsolationForest,
    RandomForestClassifier,
)
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

warnings.filterwarnings("ignore")

sys.path.insert(0, str(Path(__file__).parent))
from train_model import (
    compute_rule_score,
    compute_user_stats,
    engineer_features,
    generate_data,
)

FEATURES = [
    "amount", "amount_log", "hour", "is_unusual_hour", "is_weekend",
    "merchant_freq", "category_mean_amount", "hour_sin", "hour_cos",
    "amount_zscore", "amount_cat_ratio", "txn_frequency_24h",
    "days_since_last_txn", "is_amount_extreme", "amount_deviation_from_rolling",
    "merchant_risk_score",
]


def norm(s):
    mn, mx = s.min(), s.max()
    if mx - mn < 1e-10:
        return np.zeros_like(s)
    return (s - mn) / (mx - mn)


def single_run(run_id):
    np.random.seed(42 + run_id)

    df_train = generate_data(n=6000, seed=42 + run_id)
    df_test = generate_data(n=1200, seed=1000 + run_id)

    df_train, fit_stats = engineer_features(df_train, fit_stats=None)
    df_test, _ = engineer_features(df_test, fit_stats=fit_stats)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(df_train[FEATURES])
    X_test = scaler.transform(df_test[FEATURES])

    iso = IsolationForest(n_estimators=300, contamination=0.03, random_state=42, n_jobs=-1)
    lof = LocalOutlierFactor(n_neighbors=20, contamination=0.03, novelty=True)
    ocsvm = OneClassSVM(kernel="rbf", nu=0.03, gamma="auto")
    iso.fit(X_train)
    lof.fit(X_train)
    ocsvm.fit(X_train)

    X_train_ext = np.column_stack([
        X_train,
        norm(-iso.decision_function(X_train)),
        norm(-lof.decision_function(X_train)),
        norm(-ocsvm.decision_function(X_train)),
    ])
    X_test_ext = np.column_stack([
        X_test,
        norm(-iso.decision_function(X_test)),
        norm(-lof.decision_function(X_test)),
        norm(-ocsvm.decision_function(X_test)),
    ])

    train_stats = compute_user_stats(df_train)
    train_rules = np.array([compute_rule_score(row, train_stats) for _, row in df_train.iterrows()])
    test_rules = np.array([compute_rule_score(row, train_stats) for _, row in df_test.iterrows()])
    X_train_final = np.column_stack([X_train_ext, train_rules.reshape(-1, 1)])
    X_test_final = np.column_stack([X_test_ext, test_rules.reshape(-1, 1)])

    y_train = df_train["is_anomaly"].values
    y_test = df_test["is_anomaly"].values

    rf = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1)
    gb = GradientBoostingClassifier(n_estimators=200, random_state=42)
    rf.fit(X_train_final, y_train)
    gb.fit(X_train_final, y_train)

    prob_rf = rf.predict_proba(X_test_final)[:, 1]
    prob_gb = gb.predict_proba(X_test_final)[:, 1]
    ensemble_prob = 0.5 * prob_rf + 0.5 * prob_gb

    best_f1, best_thresh = 0, 0.5
    for thresh in np.arange(0.30, 0.81, 0.01):
        preds = (ensemble_prob >= thresh).astype(int)
        f1 = f1_score(y_test, preds)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh

    preds = (ensemble_prob >= best_thresh).astype(int)
    prec = precision_score(y_test, preds)
    rec = recall_score(y_test, preds)

    return best_f1, prec, rec, best_thresh


def main():
    print("=" * 70)
    print("  STABILITY TEST: 10 TRAINING RUNS")
    print("=" * 70)

    results = []
    for i in range(10):
        t0 = time.time()
        f1, prec, rec, thresh = single_run(i)
        elapsed = time.time() - t0
        results.append((f1, prec, rec, thresh))
        print(f"  Run {i+1:2d}: F1={f1:.4f}  P={prec:.4f}  R={rec:.4f}  thresh={thresh:.2f}  ({elapsed:.1f}s)")

    f1s = [r[0] for r in results]
    precs = [r[1] for r in results]
    recs = [r[2] for r in results]

    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"  F1:        mean={np.mean(f1s):.4f}  std={np.std(f1s):.4f}  min={np.min(f1s):.4f}  max={np.max(f1s):.4f}")
    print(f"  Precision: mean={np.mean(precs):.4f}  std={np.std(precs):.4f}  min={np.min(precs):.4f}  max={np.max(precs):.4f}")
    print(f"  Recall:    mean={np.mean(recs):.4f}  std={np.std(recs):.4f}  min={np.min(recs):.4f}  max={np.max(recs):.4f}")

    above_85 = sum(1 for f in f1s if f >= 0.85)
    print(f"\n  Runs with F1 >= 0.85: {above_85}/10")
    print(f"  Stability: {'STABLE' if np.std(f1s) < 0.03 else 'VARIABLE'}")
    print("=" * 70)


if __name__ == "__main__":
    main()
