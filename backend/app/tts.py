import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


def generate_audio(text: str) -> bytes | None:
    if not API_KEY or API_KEY == "your_key_here":
        return None

    resp = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{_VOICE_ID}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.content
