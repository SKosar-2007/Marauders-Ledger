#!/usr/bin/env python3
"""
Superplane Script: Full Pipeline Runner
Orchestrates the complete anomaly detection pipeline.
"""
from __future__ import annotations

import json
import sys
import time

from scripts.parse_csv import parse_csv
from scripts.features import engineer_features
from scripts.detect import detect_anomalies


def run_pipeline(csv_path: str, model_dir: str = "models", fit_stats_path: str | None = None) -> dict:
    """Run the full anomaly detection pipeline."""
    start_time = time.time()
    results = {"steps": []}

    # Step 1: Parse and validate CSV
    print("[1/4] Parsing and validating CSV...")
    parse_result = parse_csv(csv_path)
    results["steps"].append({"step": "parse_csv", "result": parse_result})
    if parse_result["status"] == "error":
        return {"status": "failed", "error": parse_result["error"], "results": results}
    validated_path = parse_result["output_path"]

    # Step 2: Feature engineering
    print("[2/4] Engineering features...")
    features_result = engineer_features(validated_path, fit_stats_path)
    results["steps"].append({"step": "feature_engineering", "result": features_result})
    if features_result["status"] == "error":
        return {"status": "failed", "error": features_result["error"], "results": results}
    features_path = features_result["output_path"]

    # Step 3: Anomaly detection
    print("[3/4] Running anomaly detection...")
    detection_result = detect_anomalies(features_path, model_dir)
    results["steps"].append({"step": "anomaly_detection", "result": detection_result})
    if detection_result["status"] == "error":
        return {"status": "failed", "error": detection_result["error"], "results": results}

    # Step 4: Summary
    elapsed = time.time() - start_time
    results["summary"] = {
        "total_transactions": parse_result["row_count"],
        "anomalies_found": detection_result["anomalies_found"],
        "processing_time_seconds": round(elapsed, 2),
        "output_files": {
            "validated_csv": parse_result["output_path"],
            "features_csv": features_result["output_path"],
            "results_json": detection_result["output_path"],
        },
    }

    print(f"[4/4] Pipeline complete! Found {detection_result['anomalies_found']} anomalies in {elapsed:.2f}s")
    return {"status": "success", "results": results}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: run_pipeline.py <csv_path> [model_dir] [fit_stats_path]"}))
        sys.exit(1)

    csv_path = sys.argv[1]
    model_dir = sys.argv[2] if len(sys.argv) > 2 else "models"
    fit_stats = sys.argv[3] if len(sys.argv) > 3 else None

    result = run_pipeline(csv_path, model_dir, fit_stats)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)
