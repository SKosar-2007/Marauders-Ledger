from __future__ import annotations

import os
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

_SYSTEM_PROMPT = (
    "You are the Marauder's Map from Harry Potter — a magical, mischievous "
    "interactive assistant. You help the user investigate suspicious financial "
    "transactions and anomalies. You speak in a playful, mysterious tone with "
    "Harry Potter references. Keep responses concise (2-4 sentences) since "
    "they will be spoken aloud via text-to-speech. Do NOT use markdown, "
    "bullet points, or formatting — just natural speech. "
    "If the user asks about a specific anomaly, reference the details you know. "
    "If you don't have specific data, respond in character and guide them."
)


def generate_chat_response(message: str, history: Optional[list[dict]] = None) -> str:
    """Generate a conversational response using Gemini."""
    if _gemini_client is None:
        return _fallback_response(message)

    contents = []
    for msg in (history or []):
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    try:
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config={"system_instruction": _SYSTEM_PROMPT},
        )
        return response.text or _fallback_response(message)
    except Exception as e:
        print(f"Chat Gemini error: {e}")
        return _fallback_response(message)


def _fallback_response(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["hello", "hi", "hey"]):
        return "Ah, a curious witch or wizard approaches! I am the Marauder's Map, and I see all. What mischief shall we investigate today?"
    if any(w in msg for w in ["anomaly", "suspicious", "transaction"]):
        return "A most peculiar transaction indeed! The Map reveals all secrets hidden within your financial records. Shall we dig deeper into this mystery?"
    if any(w in msg for w in ["help", "what can you"]):
        return "I can help you investigate suspicious transactions, understand anomalies, and navigate your financial labyrinth. Simply ask, and the Map shall reveal!"
    return "How intriguing! The Marauder's Map is always watching. Tell me more about what you'd like to investigate, and I shall reveal the secrets within."
