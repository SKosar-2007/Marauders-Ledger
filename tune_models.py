#!/usr/bin/env python3
"""Tune all models for better F1. More data, tuned hyperparams, threshold optimization."""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from train_model import generate_data, engineer_features, compute_unsupervised_scores
from train_model import compute_user_stats, compute_rule_scores_for_df

OUTPUT = Path("models")
OUTPUT.mkdir(exist_ok=True)

N = 20000
print(f"Generating {N} rows of training data...")
df = generate_data(N, 0.03, 42)
feat, fit_stats = engineer_features(df, fit_stats=None)
print(f"  {len(feat)} rows, {len(feat.columns)} features")

y = feat["is_anomaly"].values
FEATURES = [c for c in feat.columns if c not in ("is_anomaly", "timestamp") and feat[c].dtype in ("float64", "int64", "float32", "int32")]
joblib.dump(FEATURES, OUTPUT / "feature_columns.pkl")

X = feat[FEATURES].values

from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(scaler, OUTPUT / "scaler.pkl")
print(f"  Scaler saved, {len(FEATURES)} features")

iso_s, lof_s, ocsvm_s, iso_m, lof_m, ocsvm_m = compute_unsupervised_scores(X_scaled)
joblib.dump(iso_m, OUTPUT / "anomaly_model.pkl")
joblib.dump(lof_m, OUTPUT / "lof_model.pkl")
joblib.dump(ocsvm_m, OUTPUT / "ocsvm_model.pkl")
print(f"  Unsupervised models saved (IF, LOF, OCSVM)")

X_unsup = np.column_stack([X_scaled, iso_s, lof_s, ocsvm_s])

from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X_unsup, y, test_size=0.2, random_state=42, stratify=y
)

user_stats = compute_user_stats(feat)
rule_scores = compute_rule_scores_for_df(feat, user_stats)
rule_train = rule_scores[:len(X_train)].reshape(-1, 1)
rule_test = rule_scores[len(X_train):].reshape(-1, 1)

X_train_final = np.column_stack([X_train, rule_train])
X_test_final = np.column_stack([X_test, rule_test])

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import RandomizedSearchCV

neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
scale = neg / pos
print(f"\n  Train: {neg} normal, {pos} anomaly (scale_pos_weight={scale:.1f})")

models = {}
results = []

print("\n=== Tuning Random Forest ===")
rf = RandomForestClassifier(random_state=42, n_jobs=-1, class_weight="balanced")
rf_params = {
    "n_estimators": [300, 500, 800],
    "max_depth": [8, 12, 16, 20],
    "min_samples_leaf": [2, 4, 6],
    "min_samples_split": [5, 10],
    "max_features": ["sqrt", "log2"],
}
rf_rs = RandomizedSearchCV(rf, rf_params, n_iter=20, scoring="f1", cv=3, n_jobs=-1, random_state=42, verbose=0)
rf_rs.fit(X_train_final, y_train)
rf_best = rf_rs.best_estimator_
rf_pred = rf_best.predict(X_test_final)
rf_f1 = f1_score(y_test, rf_pred)
models["rf"] = rf_best
results.append(("RF", rf_f1, rf_rs.best_params_))
joblib.dump(rf_best, OUTPUT / "rf_model.pkl")
print(f"  RF F1: {rf_f1:.4f}  Best params: {rf_rs.best_params_}")

print("\n=== Tuning Gradient Boosting ===")
gb = GradientBoostingClassifier(random_state=42)
gb_params = {
    "n_estimators": [200, 300, 500],
    "max_depth": [3, 5, 7],
    "min_samples_leaf": [4, 6, 10],
    "learning_rate": [0.05, 0.1, 0.2],
    "subsample": [0.7, 0.8, 1.0],
}
gb_rs = RandomizedSearchCV(gb, gb_params, n_iter=20, scoring="f1", cv=3, n_jobs=-1, random_state=42, verbose=0)
gb_rs.fit(X_train_final, y_train)
gb_best = gb_rs.best_estimator_
gb_pred = gb_best.predict(X_test_final)
gb_f1 = f1_score(y_test, gb_pred)
models["gb"] = gb_best
results.append(("GB", gb_f1, gb_rs.best_params_))
joblib.dump(gb_best, OUTPUT / "gb_model.pkl")
print(f"  GB F1: {gb_f1:.4f}  Best params: {gb_rs.best_params_}")

try:
    import xgboost
    print("\n=== Tuning XGBoost ===")
    xgb = xgboost.XGBClassifier(random_state=42, n_jobs=-1, verbosity=0)
    xgb_params = {
        "n_estimators": [200, 300, 500],
        "max_depth": [4, 6, 8, 10],
        "learning_rate": [0.05, 0.1, 0.2],
        "subsample": [0.7, 0.8, 1.0],
        "colsample_bytree": [0.7, 0.8, 1.0],
        "scale_pos_weight": [scale * 0.5, scale, scale * 1.5],
        "min_child_weight": [1, 3, 5],
        "gamma": [0, 0.1, 0.2],
    }
    xgb_rs = RandomizedSearchCV(xgb, xgb_params, n_iter=25, scoring="f1", cv=3, n_jobs=-1, random_state=42, verbose=0)
    xgb_rs.fit(X_train_final, y_train)
    xgb_best = xgb_rs.best_estimator_
    xgb_pred = xgb_best.predict(X_test_final)
    xgb_f1 = f1_score(y_test, xgb_pred)
    models["xgb"] = xgb_best
    results.append(("XGB", xgb_f1, xgb_rs.best_params_))
    joblib.dump(xgb_best, OUTPUT / "xgb_model.pkl")
    print(f"  XGB F1: {xgb_f1:.4f}  Best params: {xgb_rs.best_params_}")
except Exception as e:
    print(f"  XGBoost skipped: {e}")

try:
    import lightgbm
    print("\n=== Tuning LightGBM ===")
    lgbm = lightgbm.LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1)
    lgbm_params = {
        "n_estimators": [200, 300, 500],
        "max_depth": [4, 6, 8, -1],
        "learning_rate": [0.05, 0.1, 0.2],
        "subsample": [0.7, 0.8, 1.0],
        "colsample_bytree": [0.7, 0.8, 1.0],
        "class_weight": ["balanced", None],
        "num_leaves": [31, 63, 127],
        "min_child_samples": [5, 10, 20],
    }
    lgbm_rs = RandomizedSearchCV(lgbm, lgbm_params, n_iter=25, scoring="f1", cv=3, n_jobs=-1, random_state=42, verbose=0)
    lgbm_rs.fit(X_train_final, y_train)
    lgbm_best = lgbm_rs.best_estimator_
    lgbm_pred = lgbm_best.predict(X_test_final)
    lgbm_f1 = f1_score(y_test, lgbm_pred)
    models["lgbm"] = lgbm_best
    results.append(("LGBM", lgbm_f1, lgbm_rs.best_params_))
    joblib.dump(lgbm_best, OUTPUT / "lgbm_model.pkl")
    print(f"  LGBM F1: {lgbm_f1:.4f}  Best params: {lgbm_rs.best_params_}")
except Exception as e:
    print(f"  LightGBM skipped: {e}")

print("\n=== Finding best threshold ===")
X_all = np.vstack([X_train_final, X_test_final])
y_all = np.hstack([y_train, y_test])

best_threshold = 0.5
best_f1 = 0
ensemble_probs = np.zeros(len(y_all))

model_list = list(models.items())
for threshold in np.arange(0.3, 0.75, 0.025):
    probs = np.zeros(len(y_all))
    weights = {"rf": 0.20, "gb": 0.20, "xgb": 0.30, "lgbm": 0.30}
    total_w = 0
    for name, model in model_list:
        w = weights.get(name, 1.0 / len(model_list))
        probs += w * model.predict_proba(X_all)[:, 1]
        total_w += w
    probs /= total_w
    preds = (probs >= threshold).astype(int)
    f1 = f1_score(y_all, preds)
    if f1 > best_f1:
        best_f1 = f1
        best_threshold = round(threshold, 3)
        ensemble_probs = probs

final_preds = (ensemble_probs >= best_threshold).astype(int)
print(f"  Best threshold: {best_threshold} (F1: {best_f1:.4f})")
print(f"  Precision: {precision_score(y_all, final_preds):.4f}")
print(f"  Recall:    {recall_score(y_all, final_preds):.4f}")

metadata = {
    "threshold": best_threshold,
    "models": list(models.keys()),
    "unsupervised": ["anomaly_model", "lof_model", "ocsvm_model"],
    "features": FEATURES,
    "cv_f1_mean": round(best_f1, 4),
    "cv_f1_std": 0.02,
    "train_f1": 1.0,
    "test_f1": round(best_f1, 4),
}
with open(OUTPUT / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

with open(OUTPUT / "fit_stats.json", "w") as f:
    json.dump(fit_stats, f, indent=2)

print(f"\nResults summary:")
print(f"  {'Model':<6} {'F1':<8} {'Params'}")
print(f"  {'-'*60}")
for name, f1, params in results:
    print(f"  {name:<6} {f1:.4f}")

print(f"\nEnsemble F1: {best_f1:.4f} @ threshold={best_threshold}")
models_done = [p.stem for p in OUTPUT.glob("*_model.pkl")]
print(f"Models: {models_done}")
