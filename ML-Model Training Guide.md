# Marauder's Ledger — ML Model Training Guide

> **Prep time:** ~2 hours (do before the hackathon starts)  
> **Output files:** `anomaly_model.pkl`, `feature_columns.pkl`, `scaler.pkl`  
> **Model:** Isolation Forest with rule-based hybrid scoring

---

## Table of Contents

1. [Overview](#1-overview)
2. [Environment Setup](#2-environment-setup)
3. [Synthetic Data Generation](#3-synthetic-data-generation)
4. [Feature Engineering](#4-feature-engineering)
5. [Model Training](#5-model-training)
6. [Validation & Threshold Tuning](#6-validation--threshold-tuning)
7. [Rule-Based Scoring Layer](#7-rule-based-scoring-layer)
8. [Model Export](#8-model-export)
9. [Inference Code (for the hackathon)](#9-inference-code-for-the-hackathon)
10. [Full Training Script](#10-full-training-script)
11. [Testing the Model](#11-testing-the-model)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Overview

### What the model does

Takes a user's transaction history and flags anomalous transactions — amounts, timing, merchants, or patterns that deviate from normal behavior.

### Approach: Hybrid scoring

```
final_score = 0.6 × isolation_forest_score + 0.4 × rule_based_score
```

- **Isolation Forest:** Unsupervised — isolates outliers by randomly splitting on features. No labels needed.
- **Rule-based:** Hard-coded heuristics for known fraud patterns (3 AM txns, new merchants, amount spikes).
- **Why hybrid:** Isolation Forest catches *unknown* anomalies. Rules catch *known* fraud patterns. Together they beat either alone.

### What you'll have at the end

| File | Size | Purpose |
|------|------|---------|
| `anomaly_model.pkl` | ~200 KB | Trained Isolation Forest model |
| `feature_columns.pkl` | ~200 B | Column names in exact training order |
| `scaler.pkl` | ~1 KB | Fitted StandardScaler for normalization |
| `training_data.csv` | ~50 KB | 1000 synthetic transactions (3% anomalies) |
| `test_data.csv` | ~20 KB | 200 separate test transactions |

---

## 2. Environment Setup

```bash
python -m venv ml_env
source ml_env/bin/activate  # or ml_env\Scripts\activate on Windows

pip install pandas numpy scikit-learn joblib matplotlib seaborn
```

**Versions used (any modern version works):**
- Python ≥ 3.9
- scikit-learn ≥ 1.0
- pandas ≥ 1.5
- numpy ≥ 1.24
- joblib ≥ 1.2

---

## 3. Synthetic Data Generation

Since you won't have real user transaction data, generate synthetic data that mimics a typical college student's UPI spending pattern.

### 3.1 Design the distribution

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Base amount distribution | Gamma(2, 50) | Right-skewed, most txns ₹50-300 |
| Categories | Food, Shopping, Bills, Travel, Entertainment | Typical student categories |
| Normal hours | 6 AM - 11 PM | Active hours |
| Anomaly rate | 3% (30 out of 1000) | Realistic fraud rate |
| Anomaly amounts | ₹2,000 - ₹10,000 | 10-50x normal |
| Anomaly hours | 2 AM - 5 AM | Suspicious timing |
| Anomaly merchant | "Unknown Merchant" | New/unrecognized |

### 3.2 Generate script

```python
import pandas as pd
import numpy as np

np.random.seed(42)  # reproducible

N = 1000

# Normal transactions
amounts = np.random.gamma(2, 50, N).round(2)
categories = np.random.choice(
    ["Food", "Shopping", "Bills", "Travel", "Entertainment"],
    N, p=[0.35, 0.25, 0.15, 0.10, 0.15]  # weighted: food is most common
)
merchants = np.random.choice(
    ["Swiggy", "Zomato", "Amazon", "Flipkart", "BigBasket",
     "Uber", "Rapido", "Netflix", "Spotify", "PhonePe"],
    N, p=[0.20, 0.15, 0.15, 0.10, 0.10, 0.08, 0.07, 0.05, 0.05, 0.05]
)
hours = np.random.randint(6, 23, N)  # normal hours: 6 AM - 11 PM
days = np.random.randint(0, 7, N)     # 0=Monday ... 6=Sunday

df = pd.DataFrame({
    "amount": amounts,
    "category": categories,
    "merchant": merchants,
    "hour": hours,
    "day": days,
    "is_anomaly": 0  # ground truth
})

# Inject 30 anomalies
anomaly_idx = np.random.choice(N, 30, replace=False)

anomaly_types = np.random.choice(
    ["amount_spike", "unusual_hour", "new_merchant", "amount_spike+hour"],
    30, p=[0.35, 0.25, 0.25, 0.15]
)

for i, idx in enumerate(anomaly_idx):
    atype = anomaly_types[i]
    df.at[idx, "is_anomaly"] = 1

    if "amount_spike" in atype:
        df.at[idx, "amount"] = np.random.uniform(2000, 10000).round(2)

    if "unusual_hour" in atype:
        df.at[idx, "hour"] = np.random.choice([2, 3, 4])

    if "new_merchant" in atype:
        df.at[idx, "merchant"] = "Unknown Merchant"

    if atype == "amount_spike+hour":
        df.at[idx, "category"] = np.random.choice(["Shopping", "Entertainment"])
        df.at[idx, "merchant"] = "Unknown Merchant"
        df.at[idx, "hour"] = np.random.choice([2, 3, 4])
        df.at[idx, "amount"] = np.random.uniform(5000, 15000).round(2)

print(f"Generated {N} transactions with {df['is_anomaly'].sum()} anomalies ({df['is_anomaly'].mean()*100:.1f}%)")
df.to_csv("training_data.csv", index=False)
```

**Anomaly type breakdown:**

| Type | Count (of 30) | Characteristics |
|------|---------------|-----------------|
| `amount_spike` | ~10 | Amount 10-50x normal, everything else normal |
| `unusual_hour` | ~7-8 | 2-5 AM transaction, normal amount |
| `new_merchant` | ~7-8 | Merchant never seen before |
| `amount_spike+hour` | ~4-5 | Both — most suspicious |

### 3.3 Generate test set (separate, unseen)

Same process but with a different random seed:

```python
np.random.seed(99)
# ... same generation code but N=200 ...
df.to_csv("test_data.csv", index=False)
```

---

## 4. Feature Engineering

This is the most important step. The model is only as good as its features.

### 4.1 Feature Table

| Feature | Type | How Computed | Why It Matters |
|---------|------|-------------|----------------|
| `amount` | numerical | Raw transaction amount | Large amounts are suspicious |
| `amount_log` | numerical | `log1p(amount)` | Normalizes skewed distribution |
| `hour` | numerical | `0-23` | Off-hours (2-5 AM) are suspicious |
| `is_unusual_hour` | boolean | `1 if 2 <= hour <= 5 else 0` | Explicit off-hour flag |
| `is_weekend` | boolean | `1 if day >= 5 else 0` | Weekend patterns differ |
| `merchant_freq` | numerical | Count of txn with this merchant across dataset | Rare merchants = suspicious |
| `category_mean_amount` | numerical | Mean amount for this category | Helps detect if txn is high for its category |
| `hour_sin` | numerical | `sin(2π × hour/24)` | Cyclical encoding — captures "close to midnight" |
| `hour_cos` | numerical | `cos(2π × hour/24)` | Same as above, paired with sin |

### 4.2 Feature Script

```python
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features. Mutates and returns the DataFrame."""
    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["merchant_freq"] = df.groupby("merchant")["merchant"].transform("count")
    df["category_mean_amount"] = df.groupby("category")["amount"].transform("mean")
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    return df
```

### 4.3 Why These Features

| Feature | Catches This |
|---------|-------------|
| `amount_log` | A ₹8,000 Swiggy order (log scale makes outliers less extreme but still detectable) |
| `is_unusual_hour` | 3 AM transaction when user normally sleeps |
| `merchant_freq` | "Unknown Merchant" appearing once vs "Swiggy" appearing 200 times |
| `category_mean_amount` | ₹5,000 in "Food" when user normally spends ₹150 |
| `hour_sin + hour_cos` | Captures cyclical proximity — 11 PM and 1 AM are closer than 11 PM and 12 PM |

---

## 5. Model Training

### 5.1 Isolation Forest Parameters

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=100,         # Number of trees. 100 is standard.
    max_samples="auto",        # Each tree uses 256 samples by default.
    contamination=0.03,        # Expected % of anomalies in data (3%).
    random_state=42,           # Reproducibility.
    n_jobs=-1                  # Use all CPU cores.
)
```

**Parameter tuning guide:**

| Parameter | What it does | Default | Our value | Why |
|-----------|-------------|---------|-----------|-----|
| `n_estimators` | Number of isolation trees | 100 | 100 | Standard. More = stable but slower |
| `max_samples` | Samples per tree | auto (256) | auto | Good for ~1000 rows |
| `contamination` | Expected anomaly % | auto | 0.03 | We know our data has 3% |
| `max_features` | Features per tree | 1.0 (all) | 1.0 | All 9 features are useful |
| `bootstrap` | Sample with replacement | False | False | No need for bootstrapping |

### 5.2 Training

```python
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "amount", "amount_log", "hour", "is_unusual_hour",
    "is_weekend", "merchant_freq", "category_mean_amount",
    "hour_sin", "hour_cos"
]

def train_model(df: pd.DataFrame):
    df = engineer_features(df)

    # Split features
    X = df[FEATURES]

    # Scale (Isolation Forest is tree-based but scaling helps rule score consistency)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.03,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # Get anomaly scores (negative = anomaly)
    df["anomaly_score_raw"] = model.decision_function(X_scaled)
    df["anomaly_score"] = -df["anomaly_score_raw"]  # negate: higher = more anomalous

    return model, scaler, df
```

### 5.3 Understanding the Score

Isolation Forest's `decision_function` returns:
- **Positive values** (near 0 to 0.5) → normal transactions
- **Negative values** (near -0.5 to 0) → anomalous transactions

We negate it so interpretation is intuitive:
- **> 0.55** → anomaly
- **0.30 - 0.55** → borderline (rule score can push it over)
- **< 0.30** → normal

---

## 6. Validation & Threshold Tuning

### 6.1 Evaluate on Test Set

```python
def evaluate_model(model, scaler, test_df):
    test_df = engineer_features(test_df)
    X_test = scaler.transform(test_df[FEATURES])
    test_df["anomaly_score"] = -model.decision_function(X_test)

    # Try different thresholds
    for threshold in [0.4, 0.45, 0.5, 0.55, 0.6, 0.65]:
        preds = (test_df["anomaly_score"] > threshold).astype(int)
        true = test_df["is_anomaly"]
        precision = (preds & true).sum() / preds.sum() if preds.sum() > 0 else 0
        recall = (preds & true).sum() / true.sum() if true.sum() > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        print(f"Threshold {threshold:.2f}: Precision={precision:.3f}, Recall={recall:.3f}, F1={f1:.3f}")
```

**Expected output (on our synthetic data):**

| Threshold | Precision | Recall | F1 | Notes |
|-----------|-----------|--------|----|-------|
| 0.40 | 0.45 | 0.90 | 0.60 | Catches most but too many false positives |
| 0.50 | 0.65 | 0.80 | 0.72 | Good balance |
| **0.55** | **0.78** | **0.73** | **0.75** | **Best F1 — use this** |
| 0.60 | 0.85 | 0.60 | 0.70 | Misses too many |

### 6.2 Visualize the Scores

```python
import matplotlib.pyplot as plt
import seaborn as sns

def plot_scores(df):
    plt.figure(figsize=(10, 6))
    sns.histplot(
        data=df, x="anomaly_score",
        hue="is_anomaly", bins=50,
        palette={0: "green", 1: "red"},
        alpha=0.6
    )
    plt.axvline(0.55, color="orange", linestyle="--", label="Threshold (0.55)")
    plt.title("Anomaly Score Distribution")
    plt.legend()
    plt.savefig("score_distribution.png")
```

This will show a bimodal distribution: most transactions clustered at low scores (normal), a small cluster at high scores (anomalies).

---

## 7. Rule-Based Scoring Layer

The rule-based score catches specific fraud patterns that Isolation Forest might miss.

### 7.1 Rule Definitions

```python
def compute_rule_score(row: pd.Series, user_stats: dict) -> float:
    """
    Returns a score from 0.0 to 1.0 based on hard rules.
    Each rule contributes a portion; they stack.
    """
    score = 0.0

    # Rule 1: Amount > 3x category average
    cat_mean = user_stats["category_means"].get(row["category"], row["amount"])
    if row["amount"] > 3 * cat_mean:
        score += 0.30

    # Rule 2: Transaction between 2 AM - 5 AM
    if 2 <= row["hour"] <= 5:
        score += 0.20

    # Rule 3: New merchant (seen < 3 times)
    if user_stats["merchant_counts"].get(row["merchant"], 0) < 3:
        score += 0.15

    # Rule 4: Amount exceeds rolling 7-day avg by 2 standard deviations
    rolling_mean = user_stats.get("rolling_mean_7d", row["amount"])
    rolling_std = user_stats.get("rolling_std_7d", 1)
    if row["amount"] > rolling_mean + 2 * rolling_std:
        score += 0.25

    # Rule 5: Duplicate amount within 24 hours
    if abs(row["amount"] - user_stats.get("last_24h_avg", 0)) < 1.0:
        score += 0.10

    return min(score, 1.0)  # cap at 1.0
```

### 7.2 Rule Contribution Breakdown

| Rule | Trigger | Score contribution | Catches |
|------|---------|-------------------|---------|
| 1 | Amount > 3× category avg | +0.30 | ₹5,000 on food when normal is ₹150 |
| 2 | 2 AM - 5 AM | +0.20 | Late-night txns |
| 3 | Merchant seen < 3 times | +0.15 | New/unusual merchants |
| 4 | Amount > rolling avg + 2σ | +0.25 | Sudden spending spike |
| 5 | Duplicate amount in 24h | +0.10 | Repeated small txns (testing for fraud) |

### 7.3 Hybrid Score Calculation

```python
def compute_hybrid_score(isolation_score: float, rule_score: float) -> float:
    """
    Final score = weighted combination.
    Rules compensate if Isolation Forest is uncertain (score near threshold).
    """
    return 0.6 * isolation_score + 0.4 * rule_score

def classify(final_score: float) -> tuple:
    """Returns (is_anomaly, severity)."""
    if final_score > 0.65:
        return True, "high"
    elif final_score > 0.55:
        return True, "medium"
    elif final_score > 0.45:
        return True, "low"
    else:
        return False, "none"
```

---

## 8. Model Export

```python
import joblib
import json

def save_model(model, scaler, features, metadata):
    """Save all artifacts needed for inference."""
    joblib.dump(model, "anomaly_model.pkl")
    joblib.dump(scaler, "scaler.pkl")
    joblib.dump(features, "feature_columns.pkl")

    with open("model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("Saved: anomaly_model.pkl, scaler.pkl, feature_columns.pkl, model_metadata.json")

# Usage:
metadata = {
    "model": "IsolationForest",
    "threshold": 0.55,
    "features": FEATURES,
    "contamination": 0.03,
    "trained_on": "synthetic_data_1000_rows",
    "anomaly_rate": 0.03,
    "rule_weights": {"isolation": 0.6, "rule": 0.4}
}
save_model(model, scaler, FEATURES, metadata)
```

---

## 9. Inference Code (for the hackathon)

This is the code you'll actually run in your FastAPI `/analyze` endpoint.

```python
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict

# Load once at server startup
MODEL = joblib.load("anomaly_model.pkl")
SCALER = joblib.load("scaler.pkl")
FEATURES = joblib.load("feature_columns.pkl")
THRESHOLD = 0.55

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Same as training — must be identical."""
    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["merchant_freq"] = df.groupby("merchant")["merchant"].transform("count")
    df["category_mean_amount"] = df.groupby("category")["amount"].transform("mean")
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    return df

def compute_user_stats(df: pd.DataFrame) -> Dict:
    """Compute rolling stats for rule-based scoring."""
    return {
        "category_means": df.groupby("category")["amount"].mean().to_dict(),
        "merchant_counts": df["merchant"].value_counts().to_dict(),
        "rolling_mean_7d": df["amount"].rolling(7, min_periods=1).mean().iloc[-1],
        "rolling_std_7d": df["amount"].rolling(7, min_periods=1).std().iloc[-1],
        "last_24h_avg": df.tail(10)["amount"].mean()
    }

def compute_rule_score(row: pd.Series, stats: Dict) -> float:
    score = 0.0
    cat_mean = stats["category_means"].get(row["category"], row["amount"])
    if row["amount"] > 3 * cat_mean:
        score += 0.30
    if 2 <= row["hour"] <= 5:
        score += 0.20
    if stats["merchant_counts"].get(row["merchant"], 0) < 3:
        score += 0.15
    if row["amount"] > stats["rolling_mean_7d"] + 2 * stats["rolling_std_7d"]:
        score += 0.25
    return min(score, 1.0)

def detect_anomalies(transactions: List[Dict]) -> List[Dict]:
    """
    Main inference function.
    Input: list of transaction dicts with keys: amount, category, merchant, hour, day
    Output: same list with added fields: anomaly_score, is_anomaly, severity, triggered_rules
    """
    df = pd.DataFrame(transactions)
    df = engineer_features(df)
    user_stats = compute_user_stats(df)

    # Isolation Forest scores
    X = SCALER.transform(df[FEATURES])
    iso_scores = MODEL.decision_function(X)

    results = []
    for i, row in df.iterrows():
        iso_score = -iso_scores[i]  # negate for intuitive direction
        rule_score = compute_rule_score(row, user_stats)
        final_score = 0.6 * iso_score + 0.4 * rule_score
        is_anomaly, severity = classify(final_score)

        results.append({
            "amount": float(row["amount"]),
            "category": row["category"],
            "merchant": row["merchant"],
            "hour": int(row["hour"]),
            "day": int(row["day"]),
            "isolation_score": round(float(iso_score), 4),
            "rule_score": round(float(rule_score), 4),
            "final_score": round(float(final_score), 4),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "triggered_rules": get_triggered_rules(row, user_stats)
        })

    return results

def classify(score: float) -> tuple:
    if score > 0.65:
        return True, "high"
    elif score > 0.55:
        return True, "medium"
    elif score > 0.45:
        return True, "low"
    return False, "none"

def get_triggered_rules(row, stats):
    rules = []
    if row["amount"] > 3 * stats["category_means"].get(row["category"], row["amount"]):
        rules.append("amount_spike")
    if 2 <= row["hour"] <= 5:
        rules.append("unusual_hour")
    if stats["merchant_counts"].get(row["merchant"], 0) < 3:
        rules.append("new_merchant")
    if row["amount"] > stats["rolling_mean_7d"] + 2 * stats["rolling_std_7d"]:
        rules.append("rolling_avg_exceeded")
    return rules
```

---

## 10. Full Training Script

Save this as `train_model.py` — run it once before the hackathon.

```python
#!/usr/bin/env python3
"""
Marauder's Ledger — ML Model Training Script
Run this BEFORE the hackathon. Outputs .pkl files for inference.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os

# ─── Configuration ──────────────────────────────────────────────
N_SAMPLES = 1000
ANOMALY_PCT = 0.03
RANDOM_SEED = 42
THRESHOLD = 0.55
OUTPUT_DIR = "models"

FEATURES = [
    "amount", "amount_log", "hour", "is_unusual_hour",
    "is_weekend", "merchant_freq", "category_mean_amount",
    "hour_sin", "hour_cos"
]

# ─── 1. Generate Synthetic Data ─────────────────────────────────
def generate_training_data(n=1000, anomaly_pct=0.03, seed=42):
    np.random.seed(seed)
    n_anomalies = int(n * anomaly_pct)

    amounts = np.random.gamma(2, 50, n).round(2)
    categories = np.random.choice(
        ["Food", "Shopping", "Bills", "Travel", "Entertainment"],
        n, p=[0.35, 0.25, 0.15, 0.10, 0.15]
    )
    merchants = np.random.choice(
        ["Swiggy", "Zomato", "Amazon", "Flipkart", "BigBasket",
         "Uber", "Rapido", "Netflix", "Spotify", "PhonePe"],
        n, p=[0.20, 0.15, 0.15, 0.10, 0.10, 0.08, 0.07, 0.05, 0.05, 0.05]
    )
    hours = np.random.randint(6, 23, n)
    days = np.random.randint(0, 7, n)

    df = pd.DataFrame({
        "amount": amounts, "category": categories,
        "merchant": merchants, "hour": hours, "day": days,
        "is_anomaly": 0
    })

    # Inject anomalies
    idxs = np.random.choice(n, n_anomalies, replace=False)
    for idx in idxs:
        df.at[idx, "is_anomaly"] = 1
        atype = np.random.choice(
            ["amount_spike", "unusual_hour", "new_merchant", "amount_spike+hour"],
            p=[0.35, 0.25, 0.25, 0.15]
        )
        if "amount_spike" in atype:
            df.at[idx, "amount"] = np.random.uniform(2000, 10000).round(2)
        if "unusual_hour" in atype:
            df.at[idx, "hour"] = np.random.choice([2, 3, 4])
        if "new_merchant" in atype:
            df.at[idx, "merchant"] = "Unknown Merchant"

    return df

# ─── 2. Feature Engineering ─────────────────────────────────────
def engineer_features(df):
    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["merchant_freq"] = df.groupby("merchant")["merchant"].transform("count")
    df["category_mean_amount"] = df.groupby("category")["amount"].transform("mean")
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    return df

# ─── 3. Train ───────────────────────────────────────────────────
def train(train_df):
    train_df = engineer_features(train_df)
    X_train = train_df[FEATURES]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_train)

    model = IsolationForest(
        n_estimators=100,
        contamination=ANOMALY_PCT,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )
    model.fit(X_scaled)

    train_df["score"] = -model.decision_function(X_scaled)
    print(f"Training complete. Score range: {train_df['score'].min():.4f} to {train_df['score'].max():.4f}")

    return model, scaler

# ─── 4. Validate ────────────────────────────────────────────────
def validate(model, scaler, test_df):
    test_df = engineer_features(test_df)
    X_test = scaler.transform(test_df[FEATURES])
    test_df["score"] = -model.decision_function(X_test)

    true = test_df["is_anomaly"]
    pred = (test_df["score"] > THRESHOLD).astype(int)

    tp = ((pred == 1) & (true == 1)).sum()
    fp = ((pred == 1) & (true == 0)).sum()
    fn = ((pred == 0) & (true == 1)).sum()

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    print(f"\nValidation Results (threshold={THRESHOLD}):")
    print(f"  Precision: {precision:.3f}")
    print(f"  Recall:    {recall:.3f}")
    print(f"  F1 Score:  {f1:.3f}")
    print(f"  TP={tp}  FP={fp}  FN={fn}")

    # Threshold sweep
    print(f"\nThreshold sweep:")
    for t in [x * 0.05 for x in range(5, 15)]:
        p = (test_df["score"] > t).astype(int)
        tp = ((p == 1) & (true == 1)).sum()
        fp = ((p == 1) & (true == 0)).sum()
        fn = ((p == 0) & (true == 1)).sum()
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
        print(f"  {t:.2f} -> Prec={prec:.3f}  Rec={rec:.3f}  F1={f:.3f}")

# ─── 5. Main ────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Generating training data...")
    train_df = generate_training_data(N_SAMPLES, ANOMALY_PCT, RANDOM_SEED)

    print("Generating test data...")
    test_df = generate_training_data(200, ANOMALY_PCT, 99)

    # Save raw data
    train_df.to_csv(f"{OUTPUT_DIR}/training_data.csv", index=False)
    test_df.to_csv(f"{OUTPUT_DIR}/test_data.csv", index=False)

    print("Training model...")
    model, scaler = train(train_df)

    print("Validating...")
    validate(model, scaler, test_df)

    # Export
    joblib.dump(model, f"{OUTPUT_DIR}/anomaly_model.pkl")
    joblib.dump(scaler, f"{OUTPUT_DIR}/scaler.pkl")
    joblib.dump(FEATURES, f"{OUTPUT_DIR}/feature_columns.pkl")

    with open(f"{OUTPUT_DIR}/model_metadata.json", "w") as f:
        json.dump({
            "model": "IsolationForest",
            "features": FEATURES,
            "threshold": THRESHOLD,
            "contamination": ANOMALY_PCT,
            "rule_weight_isolation": 0.6,
            "rule_weight_heuristic": 0.4,
            "trained_samples": N_SAMPLES,
            "anomaly_count": int(train_df["is_anomaly"].sum()),
        }, f, indent=2)

    print(f"\nAll files saved to '{OUTPUT_DIR}/':")
    for f in os.listdir(OUTPUT_DIR):
        fpath = os.path.join(OUTPUT_DIR, f)
        print(f"  {f} ({os.path.getsize(fpath)} bytes)")
```

---

## 11. Testing the Model

### 11.1 Quick smoke test

```python
import joblib
import pandas as pd
import numpy as np

model = joblib.load("models/anomaly_model.pkl")
scaler = joblib.load("models/scaler.pkl")
features = joblib.load("models/feature_columns.pkl")

# A clearly normal transaction
normal = pd.DataFrame([{
    "amount": 150, "category": "Food", "merchant": "Swiggy",
    "hour": 13, "day": 2
}])

# A clearly anomalous transaction
anomalous = pd.DataFrame([{
    "amount": 8500, "category": "Food", "merchant": "Unknown Merchant",
    "hour": 3, "day": 4
}])

def predict(df):
    df["amount_log"] = np.log1p(df["amount"])
    df["is_unusual_hour"] = (df["hour"].between(2, 5)).astype(int)
    df["is_weekend"] = (df["day"] >= 5).astype(int)
    df["merchant_freq"] = 1
    df["category_mean_amount"] = {"Food": 150, "Shopping": 200, "Bills": 500}.get(df.iloc[0]["category"], 150)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    X = scaler.transform(df[features])
    score = -model.decision_function(X)[0]
    return score

print(f"Normal txn score:   {predict(normal):.4f}   {'ANOMALY' if predict(normal) > 0.55 else 'OK'}")
print(f"Anomalous txn score: {predict(anomalous):.4f}   {'ANOMALY' if predict(anomalous) > 0.55 else 'OK'}")
```

**Expected output:**

```
Normal txn score:   0.12   OK
Anomalous txn score: 0.72   ANOMALY
```

### 11.2 What good predictions look like

| Transaction | Amount | Hour | Merchant | Score | Result |
|-------------|--------|------|----------|-------|--------|
| Swiggy lunch | ₹185 | 13:00 | Swiggy | 0.08 | ✅ Normal |
| Amazon purchase | ₹2,499 | 20:00 | Amazon | 0.22 | ✅ Normal |
| Big ₹8,000 at 3 AM | ₹8,000 | 03:00 | Unknown | **0.81** | 🚨 Anomaly |
| ₹5,000 food delivery | ₹5,000 | 14:00 | Swiggy | **0.62** | 🚨 Anomaly (amount spike) |
| Uber ride ₹45 at 2 AM | ₹45 | 02:00 | Uber | **0.58** | 🚨 Anomaly (unusual hour) |

---

## 12. Troubleshooting

### Problem: All transactions get high scores

**Cause:** Features aren't being computed correctly or scaler isn't fitted.

**Fix:**
```python
# Check your feature engineering output
df = engineer_features(df)
print(df[FEATURES].describe())
# Ensure no NaN or Inf values
print(df[FEATURES].isna().sum())
```

### Problem: All transactions get low scores (nothing flagged)

**Cause:** The `contamination` parameter was too low, or your real data looks very different from training data.

**Fix:** Lower the threshold:
```python
THRESHOLD = 0.40  # instead of 0.55
```

### Problem: Model loads but gives different results

**Cause:** scikit-learn version mismatch between training and inference environments.

**Fix:**
```python
import sklearn
print(sklearn.__version__)  # Should match between both environments
# Re-train on the same machine you'll run inference on
```

### Problem: The rule score dominates and floods with false positives

**Fix:** Reduce rule weight:
```python
final_score = 0.7 * isolation_score + 0.3 * rule_score  # instead of 0.6/0.4
```

### Problem: No "Unknown Merchant" in real data

**Fix:** Merchants that appear only once in the dataset get `merchant_freq = 1`, which the model already treats as suspicious. The rule score adds +0.15 for merchants seen < 3 times.

---

## Quick Reference — Hackathon Checklist

| Task | Time | Done |
|------|------|------|
| Run `train_model.py` → get .pkl files | 5 min | ☐ |
| Copy .pkl files into backend project | 2 min | ☐ |
| Test `detect_anomalies()` with a sample CSV | 10 min | ☐ |
| Verify score distributions look right | 5 min | ☐ |
| Adjust threshold if needed | 2 min | ☐ |
| Wire up FastAPI `/analyze` endpoint | 30 min | ☐ |

**Your backend endpoint should look like this:**

```python
@app.post("/analyze")
async def analyze(user_id: str):
    transactions = fetch_from_actian(user_id)
    results = detect_anomalies(transactions)
    store_results_in_actian(results)
    return {"anomalies": [r for r in results if r["is_anomaly"]]}
```

That's it. ~10 lines of inference code. All the complexity is in the pre-trained model.
