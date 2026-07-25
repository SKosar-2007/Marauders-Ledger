#!/usr/bin/env python3
"""End-to-end test for The Marauder's Ledger backend API."""
from __future__ import annotations

import sys
import time

import httpx

BASE = "http://localhost:8000"


def test_health(client: httpx.Client) -> bool:
    r = client.get(f"{BASE}/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    print("  [PASS] /api/health")
    return True


def test_upload(client: httpx.Client) -> str:
    with open("../data/compromised.csv", "rb") as f:
        r = client.post(f"{BASE}/api/upload", files={"file": ("compromised.csv", f, "text/csv")})
    assert r.status_code == 200
    data = r.json()
    assert "batch_id" in data
    assert data["txn_count"] == 50
    print(f"  [PASS] /api/upload -> batch_id={data['batch_id']}, txns={data['txn_count']}")
    return data["batch_id"]


def test_analyze(client: httpx.Client, batch_id: str) -> int:
    r = client.post(f"{BASE}/api/analyze?batch_id={batch_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "completed"
    assert data["anomalies_found"] > 0
    print(f"  [PASS] /api/analyze -> {data['anomalies_found']} anomalies found")
    return data["anomalies_found"]


def test_get_anomalies(client: httpx.Client) -> list:
    r = client.get(f"{BASE}/api/anomalies?user_id=default")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "anomaly_id" in data[0]
    assert "severity" in data[0]
    assert "triggered_rules" in data[0]
    print(f"  [PASS] /api/anomalies -> {len(data)} anomalies returned")
    return data


def test_get_narrative(client: httpx.Client, anomaly_id: str) -> str:
    r = client.get(f"{BASE}/api/narratives/{anomaly_id}")
    assert r.status_code == 200
    data = r.json()
    assert "text" in data
    assert len(data["text"]) > 0
    print(f"  [PASS] /api/narratives/{anomaly_id} -> '{data['text'][:60]}...'")
    return data["text"]


def test_get_audio(client: httpx.Client, anomaly_id: str) -> None:
    r = client.get(f"{BASE}/api/narratives/{anomaly_id}/audio")
    # 501 if no ElevenLabs key, 200 if key is set
    if r.status_code == 501:
        print(f"  [PASS] /api/narratives/{anomaly_id}/audio -> 501 (TTS not configured, fallback OK)")
    elif r.status_code == 200:
        assert len(r.content) > 0
        print(f"  [PASS] /api/narratives/{anomaly_id}/audio -> 200 ({len(r.content)} bytes)")
    else:
        assert False, f"Unexpected status {r.status_code}"


def test_cors(client: httpx.Client) -> None:
    r = client.options(f"{BASE}/api/health", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    })
    assert r.status_code == 200
    print("  [PASS] CORS preflight OK")


def main():
    print("\n=== The Marauder's Ledger — E2E Test Suite ===\n")
    client = httpx.Client(timeout=30)
    passed = 0
    failed = 0

    tests = [
        ("Health Check", lambda: test_health(client)),
        ("Upload CSV", lambda: test_upload(client)),
    ]

    # Run upload first to get batch_id
    batch_id = None
    try:
        batch_id = test_upload(client)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] Upload: {e}")
        failed += 1
        print(f"\nResults: {passed} passed, {failed} failed")
        sys.exit(1)

    # Analyze
    try:
        test_analyze(client, batch_id)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] Analyze: {e}")
        failed += 1

    # Get anomalies
    anomalies = None
    try:
        anomalies = test_get_anomalies(client)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] Get Anomalies: {e}")
        failed += 1

    # Get narrative for first anomaly
    if anomalies:
        anomaly_id = anomalies[0]["anomaly_id"]
        try:
            test_get_narrative(client, anomaly_id)
            passed += 1
        except Exception as e:
            print(f"  [FAIL] Narrative: {e}")
            failed += 1

        try:
            test_get_audio(client, anomaly_id)
            passed += 1
        except Exception as e:
            print(f"  [FAIL] Audio: {e}")
            failed += 1

    # CORS
    try:
        test_cors(client)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] CORS: {e}")
        failed += 1

    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"{'='*50}\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
