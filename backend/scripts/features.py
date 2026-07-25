#!/usr/bin/env python3
"""
Superplane Script: Feature Engineering
Extracts ML features from validated transaction data.
"""
from __future__ import annotations

import json
import sys

import numpy as np
import pandas as pd


def engineer_features(input_path: str, fit_stats_path: str | None = None) -> dict:
    """Engineer features for ML model from validated transactions."""
    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        return {"status": "error", "error": f"Failed to read input: {e}"}

    # Load fit stats if available
    fit_stats = None
    if fit_stats_path:
        try:
            with open(fit_stats_path) as f:
                fit_stats = json.load(f)
        except Exception:
            pass

    # Basic features
    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["is_night"] = (df["hour"].between(0, 6)).astype(int)

    # Category statistics
    if fit_stats and fit_stats.get("cat_mean_map"):
        df["category_mean_amount"] = df["category"].map(fit_stats["cat_mean_map"]).fillna(fit_stats.get("global_mean", 100))
        df["category_std_amount"] = df["category"].map(fit_stats.get("cat_std_map", {})).fillna(fit_stats.get("global_std", 200))
    else:
        df["category_mean_amount"] = df.groupby("category")["amount"].transform("mean")
        df["category_std_amount"] = df.groupby("category")["amount"].transform("std").fillna(1)

    # Merchant frequency
    if fit_stats and fit_stats.get("merchant_freq_map"):
        df["merchant_freq"] = df["merchant"].map(fit_stats["merchant_freq_map"]).fillna(1).astype(int)
    else:
        df["merchant_freq"] = df.groupby("merchant")["merchant"].transform("count")

    # Z-scores
    df["amount_zscore"] = ((df["amount"] - df["category_mean_amount"]) / df["category_std_amount"].clip(lower=1))
    df["amount_cat_ratio"] = df["amount"] / df["category_mean_amount"].clip(lower=1)

    # Time features
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    # Rolling stats
    df["rolling_7d_mean"] = df["amount"].rolling(7, min_periods=1).mean()
    df["rolling_7d_std"] = df["amount"].rolling(7, min_periods=1).std().fillna(1)
    df["amount_deviation_from_rolling"] = (
        (df["amount"] - df["rolling_7d_mean"]) / df["rolling_7d_std"].clip(lower=1)
    )

    # Risk scores
    df["merchant_risk_score"] = (
        0.5 * (1 / df["merchant_freq"].clip(lower=1)) +
        0.5 * df["amount_zscore"].clip(-3, 3)
    )

    # Clip and clean
    df["amount_zscore"] = df["amount_zscore"].clip(-5, 5)
    df["amount_cat_ratio"] = df["amount_cat_ratio"].clip(0, 50)
    df["amount_deviation_from_rolling"] = df["amount_deviation_from_rolling"].clip(-5, 5)
    df["merchant_risk_score"] = df["merchant_risk_score"].clip(0, 5)

    # Replace inf/nan
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col] = df[col].replace([np.inf, -np.inf], 0).fillna(0)

    # Save output
    output_path = input_path.replace(".csv", "_features.csv")
    df.to_csv(output_path, index=False)

    return {
        "status": "success",
        "output_path": output_path,
        "feature_count": len(df.select_dtypes(include=[np.number]).columns),
        "row_count": len(df),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: features.py <input_path> [fit_stats_path]"}))
        sys.exit(1)

    fit_stats = sys.argv[2] if len(sys.argv) > 2 else None
    result = engineer_features(sys.argv[1], fit_stats)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)
