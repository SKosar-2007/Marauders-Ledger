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
    "You are the Marauder's Map from Harry Potter -- a magical, mischievous "
    "interactive assistant. You help the user investigate suspicious financial "
    "transactions and anomalies. You speak in a playful, mysterious tone with "
    "Harry Potter references. Keep responses concise (2-4 sentences) since "
    "they will be spoken aloud via text-to-speech. Do NOT use markdown, "
    "bullet points, or formatting -- just natural speech."
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
        return _fallback_response(message, anomaly_id, batch_id)

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
        return response.text or _fallback_response(message, anomaly_id, batch_id)
    except Exception as e:
        print(f"Chat Gemini error: {e} — using fallback")
        return _fallback_response(message, anomaly_id, batch_id)


_RESPONSES = [
    "Ah, I hear you asking about '{topic}'! The Marauder's Map sees all, you know. Keep your questions coming, and the secrets shall unfold.",
    "'{topic}', you say? How fascinating. The enchanted parchment reveals patterns invisible to the ordinary eye. What else do you seek?",
    "The Map quivers with interest at '{topic}'! There's more mischief in these numbers than meets the eye. Shall we press on?",
    "You speak of '{topic}' -- a wise line of inquiry. The Map has its own ways of knowing. Let's see what other secrets the ledger holds.",
    "Every transaction tells a story, and '{topic}' is no exception. The Map is ever watchful. What would you like to uncover next?",
    "A most curious topic, '{topic}'! I solemnly swear I am up to no good in my investigations. Care to explore further?",
    "The parchment stirs at '{topic}'! Mischief managed in one corner, but there's always more afoot. Ask away!",
    "You have a keen eye for '{topic}'. Even the most hidden details find their way onto this map. What else draws your attention?",
]

_ANOMALY_RESPONSES = [
    "Ah yes, anomaly #{aid} -- I've been watching that one. A {cat} transaction of {amt} at {merchant}. The rules have spoken: {rules}. What do you make of it?",
    "Anomaly #{aid} is quite the puzzle. A {amt} charge in '{cat}' from {merchant}. My instincts say {status}. Care to investigate further?",
    "The Map has its eye on anomaly #{aid}. {amt} galleons at {merchant} in '{cat}' -- most peculiar. Triggered by: {rules}. Your move, detective.",
    "Oho, anomaly #{aid}! A curious little entry. {amt} from {merchant} under '{cat}' -- the Map flagged it for {rules}. Currently {status}. Intriguing, isn't it?",
]

_THEMED = {
    "hello": "Well, well, well -- a new visitor to the Map! I am the Marauder's Map, keeper of secrets and revealer of truths. What brings you here?",
    "hi": "Greetings, friend! The ink swirls and the Map awakens at your arrival. Ready to uncover some financial mischief together?",
    "hey": "Hey there! The passages of this castle hold many secrets, and so does your ledger. What shall we look into?",
    "help": "Need guidance? The Map has your back. Ask about your transactions, anomalies I've flagged, or just chat about your financial mysteries. Try 'what anomalies are there?' or 'tell me about this batch'.",
}

def _fallback_response(message: str, anomaly_id: Optional[int] = None, batch_id: Optional[str] = None) -> str:
    msg = message.lower().strip()
    for keyword, reply in _THEMED.items():
        if msg == keyword or msg.startswith(keyword + " ") or msg.startswith(keyword + ","):
            return reply

    # If the message mentions anomaly keywords and we have anomaly context, use anomaly-specific reply
    if anomaly_id is not None and anomaly_id in _anomaly_cache:
        a = _anomaly_cache[anomaly_id]
        rules_list = a.get("triggered_rules", [])
        if isinstance(rules_list, list):
            rules_str = ", ".join(rules_list[:3])
        else:
            rules_str = str(rules_list)[:60]
        return random.choice(_ANOMALY_RESPONSES).format(
            aid=anomaly_id,
            amt=a.get("amount", "?"),
            cat=a.get("category", "?"),
            merchant=a.get("merchant", "?"),
            status=a.get("status", "pending"),
            rules=rules_str or "unknown pattern",
        )

    if batch_id is not None:
        return (
            f"I see you're looking at batch {batch_id[:8]}... The Map has a lot to say about this batch — "
            f"transactions flowing like floo powder through the ledger. Ask me about specific anomalies or trends you've spotted!"
        )

    topic = message.strip()[:50].strip() or "this matter"
    return random.choice(_RESPONSES).format(topic=topic)
