"""One-off script to generate Soniox TTS audio samples across candidate
voices so they can be compared by ear for accent/tone fit. Not used by the
agents at runtime. Usage: python generate_samples.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv

load_dotenv(ROOT_DIR / ".env.local")
load_dotenv(ROOT_DIR / ".env")

API_KEY = os.getenv("SONIOX_API_KEY", "").strip().strip('"').strip("'")
if not API_KEY:
    raise SystemExit("SONIOX_API_KEY not set")

URL = "https://tts-rt.soniox.com/tts"
TEXT = (
    "Mitchell's Fruit Farms میں خوش آمدید، 1933 سے پاکستان کا trusted food "
    "brand۔ میں عائشہ ہوں۔ کیا آپ English میں بات کریں گے یا Urdu میں؟"
)

VOICES = [
    ("Maya", 1.0),
    ("Priya", 1.0),
    ("Meera", 1.0),
    ("Nina", 1.0),
    ("Grace", 1.0),
    ("Emma", 1.0),
    ("Rohan", 1.0),
    ("Meera", 0.92),
]

OUT_DIR = Path(__file__).resolve().parent
OUT_DIR.mkdir(exist_ok=True)


def main() -> None:
    for voice, speed in VOICES:
        body = {
            "model": "tts-rt-v1",
            "language": "ur",
            "voice": voice,
            "audio_format": "mp3",
            "text": TEXT,
            "speed": speed,
        }
        resp = requests.post(
            URL,
            headers={"Authorization": f"Bearer {API_KEY}"},
            json=body,
            timeout=30,
        )
        suffix = "" if speed == 1.0 else f"_speed{speed}"
        out_path = OUT_DIR / f"{voice}{suffix}.mp3"
        if resp.status_code != 200:
            print(f"{voice}{suffix}: FAILED {resp.status_code} {resp.text[:300]}")
            continue
        out_path.write_bytes(resp.content)
        print(f"{voice}{suffix}: saved {out_path} ({len(resp.content)} bytes)")


if __name__ == "__main__":
    main()
