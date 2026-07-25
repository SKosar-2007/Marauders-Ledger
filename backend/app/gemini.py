import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

API_KEY = os.environ.get("GEMINI_API_KEY", "")

_model = None

if API_KEY and API_KEY != "your_key_here":
    import google.generativeai as genai

    genai.configure(api_key=API_KEY)
    _model = genai.GenerativeModel("gemini-2.0-flash")


def generate_narrative(anomaly: dict) -> str:
    if _model is None:
        return _fallback_narrative(anomaly)

    prompt = (
        "You are the Marauder's Map from Harry Potter. Speak mischievously "
        "and mysteriously in 2-3 sentences. Given this suspicious financial "
        "transaction, describe what mischief is afoot. Do NOT give financial advice.\n\n"
        f"Amount: Rs.{anomaly['amount']}\n"
        f"Category: {anomaly['category']}\n"
        f"Merchant: {anomaly['merchant']}\n"
        f"Hour: {anomaly['hour']}:00\n"
        f"Day: {anomaly['day']}\n"
        f"Severity: {anomaly['severity']}\n"
        f"Triggered rules: {', '.join(anomaly.get('triggered_rules', []))}"
    )
    response = _model.generate_content(prompt)
    return response.text


def _fallback_narrative(anomaly: dict) -> str:
    triggers = anomaly.get("triggered_rules", [])
    parts = [f"A suspicious transaction of Rs.{anomaly['amount']} at {anomaly['merchant']}"]
    if "amount_spike" in triggers:
        parts.append(f"far exceeding typical spending in {anomaly['category']}")
    if "unusual_hour" in triggers:
        parts.append("at an unusual hour")
    if "new_merchant" in triggers:
        parts.append("from an unfamiliar merchant")
    parts.append("— mischief managed.")
    return " ".join(parts)
