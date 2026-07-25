#!/usr/bin/env python3
"""
Marauder's Ledger - Model Test Suite (v3.0)
=============================================
Tests for supervised ensemble: RF + GB + IF/LOF/OCSVM + Rules.
Run after train_model.py to validate.
"""

import json
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))


def test_data_generation():
    """Test data generation produces correct shapes and anomaly rates."""
    from train_model import generate_data

    train = generate_data(6000, 0.03, 42)
    test = generate_data(1200, 0.03, 142)

    assert len(train) >= 5500, f"Expected ~6000 train rows, got {len(train)}"
    assert len(test) >= 1100, f"Expected ~1200 test rows, got {len(test)}"

    train_rate = train["is_anomaly"].mean()
    test_rate = test["is_anomaly"].mean()
    assert 0.02 <= train_rate <= 0.06, f"Train anomaly rate {train_rate:.3f} out of range"
    assert 0.02 <= test_rate <= 0.06, f"Test anomaly rate {test_rate:.3f} out of range"

    assert "timestamp" in train.columns, "Missing timestamp column"
    assert train["timestamp"].is_monotonic_increasing, "Timestamps not sorted"

    print("  PASS: Data generation")
    return train, test


def test_feature_engineering():
    """Test features are computed correctly with no NaN/inf."""
    from train_model import FEATURES, engineer_features, generate_data

    train = generate_data(1000, 0.03, 42)
    test = generate_data(200, 0.03, 142)

    train_feat, fit_stats = engineer_features(train, fit_stats=None)
    test_feat, _ = engineer_features(test, fit_stats=fit_stats)

    for col in FEATURES:
        assert col in train_feat.columns, f"Missing feature '{col}' in train"
        assert col in test_feat.columns, f"Missing feature '{col}' in test"

    nan_train = train_feat[FEATURES].isna().sum().sum()
    nan_test = test_feat[FEATURES].isna().sum().sum()
    assert nan_train == 0, f"Found {nan_train} NaN in train features"
    assert nan_test == 0, f"Found {nan_test} NaN in test features"

    print("  PASS: Feature engineering")


def test_supervised_training():
    """Test that RF + GB train successfully."""
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
    from sklearn.preprocessing import StandardScaler

    from train_model import (
        FEATURES,
        add_unsupervised_features,
        compute_rule_scores_for_df,
        compute_user_stats,
        engineer_features,
        generate_data,
    )

    train = generate_data(1000, 0.03, 42)
    train_feat, _ = engineer_features(train, fit_stats=None)

    scaler = StandardScaler()
    X_base = scaler.fit_transform(train_feat[FEATURES])
    X_ext, unsup_models = add_unsupervised_features(X_base, fit=True)

    stats = compute_user_stats(train_feat)
    rule = compute_rule_scores_for_df(train_feat, stats).reshape(-1, 1)
    X_final = np.column_stack([X_ext, rule])

    y = train_feat["is_anomaly"].values

    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)

    rf.fit(X_final, y)
    gb.fit(X_final, y)

    prob = 0.5 * rf.predict_proba(X_final)[:, 1] + 0.5 * gb.predict_proba(X_final)[:, 1]
    assert prob.min() >= 0 and prob.max() <= 1, "Probabilities out of [0,1] range"

    from sklearn.metrics import f1_score
    preds = (prob > 0.5).astype(int)
    f1 = f1_score(y, preds, zero_division=0)
    assert f1 > 0.5, f"Training F1={f1:.3f} seems too low"

    print(f"  PASS: Supervised training (train F1={f1:.3f})")


def test_rule_scoring():
    """Test rule-based scoring logic."""
    from train_model import compute_rule_score

    stats = {
        "category_means": {"Food": 150},
        "merchant_counts": {"Swiggy": 50},
        "rolling_mean_7d": 150,
        "rolling_std_7d": 50,
        "last_24h_avg": 120,
    }
    score_normal = compute_rule_score(
        {"amount": 150, "category": "Food", "merchant": "Swiggy", "hour": 13}, stats
    )
    assert score_normal == 0.0, f"Normal should score 0, got {score_normal}"

    score_anomaly = compute_rule_score(
        {"amount": 8500, "category": "Food", "merchant": "Unknown Merchant", "hour": 3}, stats
    )
    assert score_anomaly > 0.5, f"Anomaly should score > 0.5, got {score_anomaly}"

    print("  PASS: Rule scoring")


def test_hybrid_pipeline():
    """Test full pipeline: features -> models -> hybrid scores."""
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
    from sklearn.preprocessing import StandardScaler

    from train_model import (
        FEATURES,
        add_unsupervised_features,
        compute_rule_scores_for_df,
        compute_user_stats,
        engineer_features,
        generate_data,
    )

    train = generate_data(1000, 0.03, 42)
    test = generate_data(200, 0.03, 142)

    train_feat, fit_stats = engineer_features(train, fit_stats=None)
    test_feat, _ = engineer_features(test, fit_stats=fit_stats)

    scaler = StandardScaler()
    X_train_base = scaler.fit_transform(train_feat[FEATURES])
    X_test_base = scaler.transform(test_feat[FEATURES])

    X_train_ext, unsup = add_unsupervised_features(X_train_base, fit=True)
    X_test_ext = add_unsupervised_features(X_test_base, fit=False, models=unsup)

    stats = compute_user_stats(train_feat)
    rule_train = compute_rule_scores_for_df(train_feat, stats).reshape(-1, 1)
    rule_test = compute_rule_scores_for_df(test_feat, stats).reshape(-1, 1)

    X_train_final = np.column_stack([X_train_ext, rule_train])
    X_test_final = np.column_stack([X_test_ext, rule_test])

    y_train = train_feat["is_anomaly"].values
    y_test = test_feat["is_anomaly"].values

    rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    gb = GradientBoostingClassifier(n_estimators=200, random_state=42)
    rf.fit(X_train_final, y_train)
    gb.fit(X_train_final, y_train)

    prob = 0.5 * rf.predict_proba(X_test_final)[:, 1] + 0.5 * gb.predict_proba(X_test_final)[:, 1]

    from sklearn.metrics import f1_score
    best_f1 = 0
    for t in np.arange(0.1, 0.9, 0.01):
        f1 = f1_score(y_test, (prob > t).astype(int), zero_division=0)
        best_f1 = max(best_f1, f1)

    assert best_f1 > 0.5, f"Test F1={best_f1:.3f} too low"
    print(f"  PASS: Hybrid pipeline (best test F1={best_f1:.3f})")


def test_smoke_predictions():
    """Test predictions with realistic transaction context."""
    from inference import detect_anomalies, load_models

    load_models("models")

    context_txns = []
    np.random.seed(99)
    for i in range(50):
        context_txns.append({
            "amount": round(float(np.random.normal(150, 80)), 2),
            "category": np.random.choice(["Food", "Shopping", "Bills"]),
            "merchant": np.random.choice(["Swiggy", "Zomato", "Amazon", "PhonePe"]),
            "hour": np.random.randint(7, 22),
            "day": np.random.randint(0, 7),
            "timestamp": pd.Timestamp("2026-06-10") + pd.Timedelta(hours=i),
        })

    normal_txn = {
        "amount": 150, "category": "Food", "merchant": "Swiggy",
        "hour": 13, "day": 2, "timestamp": pd.Timestamp("2026-06-12 13:22:00")
    }
    anomaly_txn = {
        "amount": 8500, "category": "Food", "merchant": "Unknown Merchant",
        "hour": 3, "day": 4, "timestamp": pd.Timestamp("2026-06-12 03:15:00")
    }

    all_txns = context_txns + [normal_txn, anomaly_txn]
    results = detect_anomalies(all_txns)

    normal_result = results[-2]
    anomaly_result = results[-1]

    assert anomaly_result["is_anomaly"], \
        f"Anomaly txn (prob={anomaly_result['probability']:.4f}) not flagged"
    assert anomaly_result["probability"] > normal_result["probability"], \
        f"Anomaly ({anomaly_result['probability']:.4f}) should score higher than normal ({normal_result['probability']:.4f})"

    print(f"  PASS: Smoke predictions (normal={normal_result['probability']:.4f}, "
          f"anomaly={anomaly_result['probability']:.4f})")


def test_model_files_exist():
    """Test all required model files exist and are valid."""
    required = [
        "models/rf_model.pkl",
        "models/gb_model.pkl",
        "models/anomaly_model.pkl",
        "models/lof_model.pkl",
        "models/ocsvm_model.pkl",
        "models/scaler.pkl",
        "models/feature_columns.pkl",
        "models/model_metadata.json",
    ]
    missing = [f for f in required if not os.path.exists(f)]
    assert not missing, f"Missing files: {missing}"

    with open("models/model_metadata.json") as f:
        meta = json.load(f)
    assert "features" in meta, "Missing features in metadata"
    assert "threshold" in meta, "Missing threshold in metadata"
    assert "cv_f1_mean" in meta, "Missing cv_f1_mean in metadata"
    assert meta["cv_f1_mean"] >= 0.80, f"CV F1={meta['cv_f1_mean']} below 0.80"

    print(f"  PASS: Model files exist (CV F1: {meta['cv_f1_mean']})")


def test_cross_validation():
    """Test cross-validation runs and produces valid results."""
    from train_model import generate_data, run_cross_validation

    train = generate_data(2000, 0.03, 42)
    cv_metrics, avg_f1, avg_thresh = run_cross_validation(train, n_splits=3)

    assert len(cv_metrics) == 3, f"Expected 3 folds, got {len(cv_metrics)}"
    assert avg_f1 > 0.5, f"CV F1 {avg_f1:.4f} too low"
    assert 0.0 <= avg_thresh <= 1.0, f"Threshold {avg_thresh:.2f} out of range"

    for m in cv_metrics:
        assert 0 <= m["f1"] <= 1, f"F1 {m['f1']} out of range"

    print(f"  PASS: Cross-validation (avg F1={avg_f1:.4f})")


# =============================================================================
# MAIN
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("  MARAUDER'S LEDGER - MODEL TEST SUITE (v3.0)")
    print("=" * 60)

    tests = [
        ("Data Generation", test_data_generation),
        ("Feature Engineering", test_feature_engineering),
        ("Supervised Training", test_supervised_training),
        ("Rule Scoring", test_rule_scoring),
        ("Hybrid Pipeline", test_hybrid_pipeline),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        try:
            test_fn()
            passed += 1
        except Exception as e:
            print(f"  FAIL: {name} - {e}")
            failed += 1

    if os.path.exists("models/rf_model.pkl"):
        try:
            test_smoke_predictions()
            passed += 1
        except Exception as e:
            print(f"  FAIL: Smoke Predictions - {e}")
            failed += 1

        try:
            test_model_files_exist()
            passed += 1
        except Exception as e:
            print(f"  FAIL: Model Files - {e}")
            failed += 1
    else:
        print("\n  SKIP: Model-dependent tests (run train_model.py first)")

    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {passed} passed, {failed} failed")
    print(f"{'=' * 60}")

    sys.exit(0 if failed == 0 else 1)
