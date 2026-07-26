from app.chat import _anomaly_cache, _fallback_response


def test_fallback_response_uses_anomaly_context_for_specific_questions():
    _anomaly_cache[42] = {
        "anomaly_id": 42,
        "amount": 128.4,
        "category": "Shopping",
        "merchant": "Northwind Market",
        "status": "pending",
        "triggered_rules": ["velocity spike", "geolocation mismatch"],
    }

    response = _fallback_response("why was this anomaly flagged", anomaly_id=42, batch_id=None)

    assert "42" in response
    assert "Northwind Market" in response
    assert "Shopping" in response
    assert "velocity spike" in response
