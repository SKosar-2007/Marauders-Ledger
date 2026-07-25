#!/usr/bin/env python3
"""
Superplane Script: Anomaly Detection
Runs the ML ensemble to detect anomalies in feature-engineered data.
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def detect_anomalies(input_path: str, model_dir: str = "models") -> dict:
    """Run anomaly detection on feature-engineered data."""
    try:
        from app.inference import detect_anomalies as _detect, load_models
    except ImportError as e:
        return {"status": "error", "error": f"Failed to import inference module: {e}"}

    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        return {"status": "error", "error": f"Failed to read input: {e}"}

    # Load models if not already loaded
    try:
        load_models(model_dir)
    except Exception as e:
        return {"status": "error", "error": f"Failed to load models: {e}"}

    # Convert to list of dicts for inference
    transactions = df.to_dict(orient="records")

    # Add timestamp if missing
    for txn in transactions:
        if "timestamp" not in txn:
            txn["timestamp"] = pd.Timestamp.now().isoformat()

    # Run detection
    try:
        results = _detect(transactions)
    except Exception as e:
        return {"status": "error", "error": f"Detection failed: {e}"}

    # Separate anomalies from normal transactions
    anomalies = [r for r in results if r["is_anomaly"]]
    normal = [r for r in results if not r["is_anomaly"]]

    # Save results
    output_path = input_path.replace(".csv", "_results.json")
    with open(output_path, "w") as f:
        json.dump({
            "total_transactions": len(results),
            "anomalies_found": len(anomalies),
            "anomalies": anomalies,
            "normal_count": len(normal),
        }, f, indent=2)

    # Also save anomalies as CSV for easy viewing
    if anomalies:
        anomalies_df = pd.DataFrame(anomalies)
        anomalies_csv_path = input_path.replace(".csv", "_anomalies.csv")
        anomalies_df.to_csv(anomalies_csv_path, index=False)

    return {
        "status": "success",
        "output_path": output_path,
        "total_transactions": len(results),
        "anomalies_found": len(anomalies),
        "anomalies": anomalies[:10],  # Return first 10 for preview
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: detect.py <input_path> [model_dir]"}))
        sys.exit(1)

    model_dir = sys.argv[2] if len(sys.argv) > 2 else "models"
    result = detect_anomalies(sys.argv[1], model_dir)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)
