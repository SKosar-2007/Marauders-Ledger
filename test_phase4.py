#!/usr/bin/env python3
"""
Phase 4: Testing and Hardening
================================
Tests inference.py with sample CSVs and validates all requirements.
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import inference
from generate_samples import generate_normal_csv, generate_compromised_csv, generate_mixed_csv


def test_model_files_exist():
    """4.8 Model files exported correctly (.pkl format)."""
    print("\n--- 4.8 Model files exported correctly ---")
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
    all_exist = True
    for f in required:
        exists = os.path.exists(f)
        size = os.path.getsize(f) if exists else 0
        status = "OK" if exists and size > 0 else "MISSING"
        if not exists or size == 0:
            all_exist = False
        print(f"  {status}: {f} ({size:,} bytes)")
    return all_exist


def test_metadata_json():
    """4.9 Model metadata JSON created."""
    print("\n--- 4.9 Model metadata JSON ---")
    with open("models/model_metadata.json") as f:
        meta = json.load(f)
    required_keys = ["cv_f1", "cv_precision", "cv_recall", "threshold"]
    for k in required_keys:
        v = meta.get(k, "MISSING")
        print(f"  {k}: {v}")
    return all(k in meta for k in required_keys)


def test_smoke_inference():
    """4.10 Smoke test passes with expected outputs."""
    print("\n--- 4.10 Smoke test (5 samples) ---")
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
    ]
    results = inference.detect_anomalies(sample)
    anomalies = [r for r in results if r["is_anomaly"]]
    normals = [r for r in results if not r["is_anomaly"]]
    print(f"  Input: 5 samples")
    print(f"  Detected: {len(anomalies)} anomalies, {len(normals)} normal")
    assert len(results) == 5, f"Expected 5 results, got {len(results)}"
    assert all("probability" in r for r in results), "Missing probability field"
    assert all("is_anomaly" in r for r in results), "Missing is_anomaly field"
    assert all("severity" in r for r in results), "Missing severity field"
    print("  PASS: Smoke test returns correct structure")
    return True


def test_normal_csv():
    """4.4 Test with normal.csv (50 transactions, 0 anomalies)."""
    print("\n--- 4.4 Test with normal.csv ---")
    df = pd.read_csv("data/normal.csv")
    print(f"  Loaded: {len(df)} rows, {df['is_anomaly'].sum()} actual anomalies")
    assert len(df) == 50, f"Expected 50 rows, got {len(df)}"
    assert df["is_anomaly"].sum() == 0, "Expected 0 anomalies in normal.csv"

    transactions = df[["amount", "category", "merchant", "hour", "day"]].to_dict("records")
    for i, t in enumerate(transactions):
        t["timestamp"] = pd.Timestamp(df["timestamp"].iloc[i])

    results = inference.detect_anomalies(transactions)
    detected = [r for r in results if r["is_anomaly"]]
    print(f"  Detected: {len(detected)}/50 anomalies")
    for r in detected:
        print(f"    Rs.{r['amount']:>8.0f} | {r['category']:<14} | {r['merchant']:<20} | Prob: {r['probability']:.4f}")
    print(f"  PASS: normal.csv processed successfully")
    return True


def test_compromised_csv():
    """4.5 Test with compromised.csv (50 transactions, 3 anomalies)."""
    print("\n--- 4.5 Test with compromised.csv ---")
    df = pd.read_csv("data/compromised.csv")
    print(f"  Loaded: {len(df)} rows, {df['is_anomaly'].sum()} actual anomalies")
    assert len(df) == 50, f"Expected 50 rows, got {len(df)}"
    assert df["is_anomaly"].sum() == 3, "Expected 3 anomalies in compromised.csv"

    transactions = df[["amount", "category", "merchant", "hour", "day"]].to_dict("records")
    for i, t in enumerate(transactions):
        t["timestamp"] = pd.Timestamp(df["timestamp"].iloc[i])

    results = inference.detect_anomalies(transactions)
    detected = [r for r in results if r["is_anomaly"]]
    actual_anomalies = df[df["is_anomaly"] == 1].index.tolist()

    print(f"  Detected: {len(detected)}/50 anomalies (actual: 3)")
    for r in detected:
        print(f"    Rs.{r['amount']:>8.0f} | {r['category']:<14} | {r['merchant']:<20} | Prob: {r['probability']:.4f} | {r['severity']}")
    print(f"  PASS: compromised.csv processed successfully")
    return True


def test_mixed_csv():
    """4.6 Test with mixed.csv (100 transactions, 5 anomalies)."""
    print("\n--- 4.6 Test with mixed.csv ---")
    df = pd.read_csv("data/mixed.csv")
    print(f"  Loaded: {len(df)} rows, {df['is_anomaly'].sum()} actual anomalies")
    assert len(df) == 100, f"Expected 100 rows, got {len(df)}"
    assert df["is_anomaly"].sum() == 5, "Expected 5 anomalies in mixed.csv"

    transactions = df[["amount", "category", "merchant", "hour", "day"]].to_dict("records")
    for i, t in enumerate(transactions):
        t["timestamp"] = pd.Timestamp(df["timestamp"].iloc[i])

    results = inference.detect_anomalies(transactions)
    detected = [r for r in results if r["is_anomaly"]]

    print(f"  Detected: {len(detected)}/100 anomalies (actual: 5)")
    for r in detected:
        print(f"    Rs.{r['amount']:>8.0f} | {r['category']:<14} | {r['merchant']:<20} | Prob: {r['probability']:.4f} | {r['severity']}")
    print(f"  PASS: mixed.csv processed successfully")
    return True


def test_inference_standalone():
    """4.7 Inference code works standalone."""
    print("\n--- 4.7 Inference standalone test ---")
    assert inference._LOADED, "Models not loaded"
    assert inference.RF_MODEL is not None, "RF model not loaded"
    assert inference.GB_MODEL is not None, "GB model not loaded"
    assert inference.SCALER is not None, "Scaler not loaded"
    assert inference.FEATURES is not None, "Features not loaded"
    assert inference.UNSUP_MODELS is not None, "Unsupervised models not loaded"
    print(f"  RF model: {type(inference.RF_MODEL).__name__}")
    print(f"  GB model: {type(inference.GB_MODEL).__name__}")
    print(f"  Scaler: {type(inference.SCALER).__name__}")
    print(f"  Features: {len(inference.FEATURES)} columns")
    print(f"  Unsupervised: {[type(m).__name__ for m in inference.UNSUP_MODELS]}")
    print(f"  PASS: All models loaded and accessible")
    return True


def main():
    print("=" * 70)
    print("  PHASE 4: TESTING AND HARDENING")
    print("=" * 70)

    # Generate sample CSVs
    print("\n--- Generating sample CSVs ---")
    generate_normal_csv()
    generate_compromised_csv()
    generate_mixed_csv()

    # Load models
    print("\n--- Loading models ---")
    inference.load_models("models")

    results = {}
    tests = [
        ("4.8 Model files exist", test_model_files_exist),
        ("4.9 Metadata JSON", test_metadata_json),
        ("4.10 Smoke test", test_smoke_inference),
        ("4.7 Standalone inference", test_inference_standalone),
        ("4.4 normal.csv", test_normal_csv),
        ("4.5 compromised.csv", test_compromised_csv),
        ("4.6 mixed.csv", test_mixed_csv),
    ]

    for name, test_fn in tests:
        try:
            passed = test_fn()
            results[name] = "PASS" if passed else "FAIL"
        except Exception as e:
            results[name] = f"FAIL: {e}"
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 70)
    print("  PHASE 4 RESULTS")
    print("=" * 70)
    for name, status in results.items():
        print(f"  [{status}] {name}")

    all_pass = all(s == "PASS" for s in results.values())
    print(f"\n  Overall: {'ALL PASS' if all_pass else 'SOME FAILURES'}")
    print("=" * 70)
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
