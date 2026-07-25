#!/usr/bin/env python3
"""
Superplane Script: Parse CSV
Parses and validates uploaded CSV files for the Marauder's Ledger pipeline.
"""
from __future__ import annotations

import json
import sys

import pandas as pd

REQUIRED_COLUMNS = {"amount", "category", "merchant", "hour", "day"}


def parse_csv(input_path: str) -> dict:
    """Parse CSV file and validate required columns."""
    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        return {"status": "error", "error": f"Failed to parse CSV: {e}"}

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return {
            "status": "error",
            "error": f"Missing required columns: {', '.join(sorted(missing))}",
        }

    # Basic validation
    if df.empty:
        return {"status": "error", "error": "CSV file is empty"}

    if len(df) > 10000:
        return {"status": "error", "error": "CSV exceeds maximum row limit (10,000)"}

    # Type validation
    if not pd.api.types.is_numeric_dtype(df["amount"]):
        return {"status": "error", "error": "Amount column must be numeric"}

    if not pd.api.types.is_integer_dtype(df["hour"]):
        df["hour"] = df["hour"].astype(int)

    if not pd.api.types.is_integer_dtype(df["day"]):
        df["day"] = df["day"].astype(int)

    # Save validated output
    output_path = input_path.replace(".csv", "_validated.csv")
    df.to_csv(output_path, index=False)

    return {
        "status": "success",
        "output_path": output_path,
        "row_count": len(df),
        "columns": list(df.columns),
        "categories": df["category"].unique().tolist(),
        "merchants": df["merchant"].nunique(),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: parse_csv.py <input_path>"}))
        sys.exit(1)

    result = parse_csv(sys.argv[1])
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)
