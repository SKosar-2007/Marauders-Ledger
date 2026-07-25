#!/usr/bin/env python3
"""
Marauder's Ledger - Sample CSV Generator
==========================================
Generate 3 sample CSV files for demo and testing.
"""

import os

import numpy as np
import pandas as pd

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)


def generate_normal_csv(n=50, seed=42):
    """50 transactions, all normal, no anomalies."""
    np.random.seed(seed)

    categories = np.random.choice(
        ["Food", "Shopping", "Bills", "Travel", "Entertainment"],
        n, p=[0.35, 0.25, 0.15, 0.10, 0.15]
    )

    merchants_by_cat = {
        "Food": ["Swiggy", "Zomato", "Local Cafe", "Dominos", "KFC"],
        "Shopping": ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio"],
        "Bills": ["PhonePe", "GooglePay", "Paytm", "Jio", "Airtel"],
        "Travel": ["Uber", "Rapido", "Ola", "IRCTC", "RedBus"],
        "Entertainment": ["Netflix", "Spotify", "Hotstar", "YouTube", "JioCinema"],
    }

    cat_params = {
        "Food": (150, 80), "Shopping": (500, 300), "Bills": (800, 400),
        "Travel": (300, 200), "Entertainment": (200, 100),
    }

    amounts = []
    merchants = []
    for cat in categories:
        mean, std = cat_params[cat]
        amounts.append(round(max(10, np.random.normal(mean, std)), 2))
        merchants.append(np.random.choice(merchants_by_cat[cat]))

    hours = np.random.choice(range(7, 22), n)
    days = np.random.randint(0, 7, n)
    base = pd.Timestamp("2026-06-01")
    timestamps = [base + pd.Timedelta(days=i, hours=int(hours[i])) for i in range(n)]

    df = pd.DataFrame({
        "amount": amounts,
        "category": categories,
        "merchant": merchants,
        "hour": hours,
        "day": days,
        "timestamp": timestamps,
        "is_anomaly": 0
    })

    df.to_csv(f"{DATA_DIR}/normal.csv", index=False)
    print(f"Created {DATA_DIR}/normal.csv ({len(df)} rows, 0 anomalies)")
    return df


def generate_compromised_csv(n=50, n_anomalies=3, seed=43):
    """50 transactions with 3 clear anomalies."""
    np.random.seed(seed)

    categories = np.random.choice(
        ["Food", "Shopping", "Bills", "Travel", "Entertainment"],
        n, p=[0.35, 0.25, 0.15, 0.10, 0.15]
    )

    merchants_by_cat = {
        "Food": ["Swiggy", "Zomato", "Local Cafe", "Dominos", "KFC"],
        "Shopping": ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio"],
        "Bills": ["PhonePe", "GooglePay", "Paytm", "Jio", "Airtel"],
        "Travel": ["Uber", "Rapido", "Ola", "IRCTC", "RedBus"],
        "Entertainment": ["Netflix", "Spotify", "Hotstar", "YouTube", "JioCinema"],
    }

    cat_params = {
        "Food": (150, 80), "Shopping": (500, 300), "Bills": (800, 400),
        "Travel": (300, 200), "Entertainment": (200, 100),
    }

    amounts = []
    merchants = []
    for cat in categories:
        mean, std = cat_params[cat]
        amounts.append(round(max(10, np.random.normal(mean, std)), 2))
        merchants.append(np.random.choice(merchants_by_cat[cat]))

    hours = np.random.choice(range(7, 22), n)
    days = np.random.randint(0, 7, n)

    is_anomaly = [0] * n

    anomaly_indices = np.random.choice(range(10, n - 10), n_anomalies, replace=False)
    anomaly_descriptions = [
        {"amount": 7500, "category": "Food", "merchant": "Unknown Merchant", "hour": 3,
         "desc": "Rs.7500 food order at 3:15 AM from unknown merchant"},
        {"amount": 4200, "category": "Shopping", "merchant": "Unknown Merchant", "hour": 2,
         "desc": "Rs.4200 shopping at 2:47 AM from unknown merchant"},
        {"amount": 2800, "category": "Bills", "merchant": "Unknown Merchant", "hour": 4,
         "desc": "Rs.2800 bill payment at 4:00 AM from unknown merchant"},
    ]

    for i, idx in enumerate(anomaly_indices):
        ad = anomaly_descriptions[i]
        amounts[idx] = ad["amount"]
        categories[idx] = ad["category"]
        merchants[idx] = ad["merchant"]
        hours[idx] = ad["hour"]
        is_anomaly[idx] = 1

    base = pd.Timestamp("2026-06-01")
    timestamps = [base + pd.Timedelta(days=i, hours=int(hours[i])) for i in range(n)]

    df = pd.DataFrame({
        "amount": amounts,
        "category": categories,
        "merchant": merchants,
        "hour": hours,
        "day": days,
        "timestamp": timestamps,
        "is_anomaly": is_anomaly
    })

    df.to_csv(f"{DATA_DIR}/compromised.csv", index=False)
    print(f"Created {DATA_DIR}/compromised.csv ({len(df)} rows, {n_anomalies} anomalies)")
    print("  Anomalies:")
    for i, idx in enumerate(anomaly_indices):
        print(f"    {anomaly_descriptions[i]['desc']}")
    return df


def generate_mixed_csv(n=100, n_anomalies=5, seed=44):
    """100 transactions with 5 subtle anomalies."""
    np.random.seed(seed)

    categories = np.random.choice(
        ["Food", "Shopping", "Bills", "Travel", "Entertainment"],
        n, p=[0.35, 0.25, 0.15, 0.10, 0.15]
    )

    merchants_by_cat = {
        "Food": ["Swiggy", "Zomato", "Local Cafe", "Dominos", "KFC"],
        "Shopping": ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio"],
        "Bills": ["PhonePe", "GooglePay", "Paytm", "Jio", "Airtel"],
        "Travel": ["Uber", "Rapido", "Ola", "IRCTC", "RedBus"],
        "Entertainment": ["Netflix", "Spotify", "Hotstar", "YouTube", "JioCinema"],
    }

    cat_params = {
        "Food": (150, 80), "Shopping": (500, 300), "Bills": (800, 400),
        "Travel": (300, 200), "Entertainment": (200, 100),
    }

    amounts = []
    merchants = []
    for cat in categories:
        mean, std = cat_params[cat]
        amounts.append(round(max(10, np.random.normal(mean, std)), 2))
        merchants.append(np.random.choice(merchants_by_cat[cat]))

    hours = np.random.choice(range(6, 23), n)
    days = np.random.randint(0, 7, n)

    is_anomaly = [0] * n

    anomaly_indices = np.random.choice(range(15, n - 15), n_anomalies, replace=False)
    anomaly_descriptions = [
        {"amount": 8500, "category": "Food", "merchant": "Unknown Merchant", "hour": 3,
         "desc": "Rs.8500 food at 3:00 AM (amount spike + unusual hour)"},
        {"amount": 4500, "category": "Shopping", "merchant": "Unknown Merchant", "hour": 2,
         "desc": "Rs.4500 shopping at 2:30 AM (new merchant + unusual hour)"},
        {"amount": 1200, "category": "Food", "merchant": "Swiggy", "hour": 14,
         "desc": "Rs.1200 food order (subtle amount spike, 8x average)"},
        {"amount": 3500, "category": "Bills", "merchant": "Unknown Merchant", "hour": 4,
         "desc": "Rs.3500 bill at 4:00 AM (unusual hour + new merchant)"},
        {"amount": 6000, "category": "Entertainment", "merchant": "Unknown Merchant", "hour": 1,
         "desc": "Rs.6000 entertainment at 1:00 AM (compound anomaly)"},
    ]

    for i, idx in enumerate(anomaly_indices):
        ad = anomaly_descriptions[i]
        amounts[idx] = ad["amount"]
        categories[idx] = ad["category"]
        merchants[idx] = ad["merchant"]
        hours[idx] = ad["hour"]
        is_anomaly[idx] = 1

    base = pd.Timestamp("2026-06-01")
    timestamps = [base + pd.Timedelta(days=i, hours=int(hours[i])) for i in range(n)]

    df = pd.DataFrame({
        "amount": amounts,
        "category": categories,
        "merchant": merchants,
        "hour": hours,
        "day": days,
        "timestamp": timestamps,
        "is_anomaly": is_anomaly
    })

    df.to_csv(f"{DATA_DIR}/mixed.csv", index=False)
    print(f"Created {DATA_DIR}/mixed.csv ({len(df)} rows, {n_anomalies} anomalies)")
    print("  Anomalies:")
    for i, idx in enumerate(anomaly_indices):
        print(f"    {anomaly_descriptions[i]['desc']}")
    return df


if __name__ == "__main__":
    print("=" * 60)
    print("  GENERATING SAMPLE CSV FILES")
    print("=" * 60)

    print()
    generate_normal_csv()
    print()
    generate_compromised_csv()
    print()
    generate_mixed_csv()

    print()
    print("=" * 60)
    print("  ALL SAMPLE CSVs CREATED")
    print("=" * 60)
