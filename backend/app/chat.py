from __future__ import annotations

import os
import random
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

_gemini_client = None
if GEMINI_API_KEY and GEMINI_API_KEY not in ("your_key_here", "your_gemini_api_key_here"):
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        _gemini_client = None

_BASE_SYSTEM_PROMPT = (
    "You are a concise, professional assistant for reviewing financial transactions and anomalies. "
    "Answer the user's latest question directly and specifically, using the current screen context when it is relevant. "
    "Keep responses short, factual, and easy to speak aloud. Do not use markdown, bullet points, or formatting."
)

# Lazy import to avoid circular deps at module level
_anomaly_cache: dict[int, dict] = {}
_batch_cache: dict[str, str] = {}


def _build_context_block(anomaly_id: int | None = None, batch_id: str | None = None, user_id: int | None = None) -> str:
    parts = []
    if anomaly_id is not None and anomaly_id not in _anomaly_cache:
        try:
            from app.vector_store import get_anomaly_by_id
            a = get_anomaly_by_id(anomaly_id)
            if a:
                _anomaly_cache[anomaly_id] = a
        except Exception:
            pass
    if anomaly_id is not None and anomaly_id in _anomaly_cache:
        a = _anomaly_cache[anomaly_id]
        rules = a.get("triggered_rules", [])
        rules_str = ", ".join(rules) if isinstance(rules, list) else str(rules)
        parts.append(f"The user is looking at anomaly #{a.get('anomaly_id', anomaly_id)}.")
        parts.append(f"Amount: {a.get('amount', '?')}, Category: {a.get('category', '?')}, Merchant: {a.get('merchant', '?')}.")
        parts.append(f"Status: {a.get('status', 'pending')}. Triggered rules: {rules_str}.")

    if batch_id is not None:
        if batch_id not in _batch_cache:
            try:
                from app.database import get_batch_by_id
                b = get_batch_by_id(batch_id)
                if b:
                    _batch_cache[batch_id] = b.get("status", "unknown") + "|" + str(b.get("txn_count", "?"))
            except Exception:
                pass
        if batch_id in _batch_cache:
            status_count = _batch_cache[batch_id]
            parts.append(f"The user is reviewing batch {batch_id[:8]}... (status: {status_count.replace('|', ', ')} transactions).")

    if not parts:
        return ""
    context_block = " ".join(parts)
    return (
        "\n\nHere is the data currently on the user's screen — reference it naturally if their question relates:\n"
        + context_block
    )


def generate_chat_response(
    message: str,
    history: Optional[list[dict]] = None,
    anomaly_id: Optional[int] = None,
    batch_id: Optional[str] = None,
    user_id: Optional[int] = None,
) -> str:
    """Generate a conversational response using Gemini (or fallback)."""
    system_prompt = _BASE_SYSTEM_PROMPT + _build_context_block(anomaly_id, batch_id, user_id)

    if _gemini_client is None:
        return _fallback_response(message, anomaly_id, batch_id, history)

    contents = []
    for msg in (history or []):
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    try:
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config={"system_instruction": system_prompt},
        )
        return response.text or _fallback_response(message, anomaly_id, batch_id, history)
    except Exception as e:
        print(f"Chat Gemini error: {e} — using fallback")
        return _fallback_response(message, anomaly_id, batch_id, history)


_BASIC_GREETINGS = {
    "hello": "Hello. I can help explain anomalies, transaction details, or current review status.",
    "hi": "Hi. I can help explain anomalies, transaction details, or current review status.",
    "hey": "Hey. I can help explain anomalies, transaction details, or current review status.",
    "help": "I can help review transactions, explain anomaly flags, or summarize the current context.",
}

def _fallback_response(
    message: str,
    anomaly_id: Optional[int] = None,
    batch_id: Optional[str] = None,
    history: Optional[list[dict]] = None,
) -> str:
    msg = message.lower().strip()
    for keyword, reply in _BASIC_GREETINGS.items():
        if msg == keyword or msg.startswith(keyword + " ") or msg.startswith(keyword + ","):
            return reply

    if anomaly_id is not None and anomaly_id in _anomaly_cache:
        a = _anomaly_cache[anomaly_id]
        rules_list = a.get("triggered_rules", [])
        if isinstance(rules_list, list):
            rules_str = ", ".join(rules_list[:3])
        else:
            rules_str = str(rules_list)[:60]
        amount = a.get("amount", "?")
        category = a.get("category", "?")
        merchant = a.get("merchant", "?")
        status = a.get("status", "pending")

        if any(k in msg for k in ["why", "reason", "trigger", "flagged", "rule"]):
            return (
                f"Anomaly #{anomaly_id} was flagged because {rules_str or 'the pattern matched the review rules'}. "
                f"It is a {category} transaction for {amount} at {merchant}, and its current status is {status}."
            )

        if any(k in msg for k in ["status", "valid", "fraud", "pending"]):
            return f"Anomaly #{anomaly_id} is currently {status}. It is a {category} transaction for {amount} at {merchant}."

        if any(k in msg for k in ["merchant", "where", "from"]):
            return f"The transaction came from {merchant}."

        if any(k in msg for k in ["category", "type"]):
            return f"It falls under the {category} category."

        if any(k in msg for k in ["amount", "how much"]):
            return f"The transaction amount is {amount}."

        return (
            f"Anomaly #{anomaly_id} is a {category} transaction for {amount} at {merchant}. "
            f"The current status is {status}, and the triggered rules were {rules_str or 'not listed'}."
        )

    if batch_id is not None:
        return (
            f"You are looking at batch {batch_id[:8]}... I can help explain its anomalies, review the flagged patterns, "
            f"or summarize the transactions that matter most right now."
        )

    if history:
        last_user = next((item.get("text", "") for item in reversed(history) if item.get("role") == "user"), "")
        if last_user:
            topic = last_user.strip()[:50].strip() or "this matter"
            return f"You asked about {topic}. I can help explain the anomaly, the triggering rules, or the transaction context in more detail."

    topic = message.strip()[:50].strip() or "this matter"
    return f"You asked about {topic}. I can help explain the anomaly details, the triggered rules, or the transaction context in more detail."
