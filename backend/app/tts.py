from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"  # Roger - Laid-Back, Casual, Resonant


def _tts_headers() -> dict:
    return {"xi-api-key": API_KEY, "Content-Type": "application/json"}


def _tts_body(text: str) -> dict:
    return {
        "text": text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5,
        },
    }


def generate_audio(text: str) -> Optional[bytes]:
    if not API_KEY or API_KEY in ("your_key_here", "your_elevenlabs_api_key_here"):
        return None

    try:
        resp = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{_VOICE_ID}",
            headers=_tts_headers(),
            json=_tts_body(text),
            timeout=30,
        )
        if resp.status_code != 200:
            print(f"TTS: ElevenLabs returned {resp.status_code}: {resp.text[:200]}")
            return None
        return resp.content
    except Exception as e:
        print(f"TTS: ElevenLabs error: {e}")
        return None


def stream_audio(text: str):
    """Yield MP3 chunks from ElevenLabs streaming TTS endpoint."""
    if not API_KEY or API_KEY in ("your_key_here", "your_elevenlabs_api_key_here"):
        return

    try:
        with httpx.stream(
            "POST",
            f"https://api.elevenlabs.io/v1/text-to-speech/{_VOICE_ID}/stream",
            headers=_tts_headers(),
            json=_tts_body(text),
            timeout=httpx.Timeout(connect=10, read=30, write=10, pool=10),
        ) as resp:
            if resp.status_code != 200:
                print(f"TTS stream: ElevenLabs returned {resp.status_code}: {resp.read(200)}")
                return
            for chunk in resp.iter_bytes(chunk_size=1024):
                if chunk:
                    yield chunk
    except Exception as e:
        print(f"TTS stream error: {e}")
