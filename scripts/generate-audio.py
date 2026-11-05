#!/usr/bin/env python3
"""
Generate one MP3 per question (Modern Standard Arabic) into public/audio/.

Files are named <categoryId>-<questionId>.mp3 and played by lib/speech.ts.

Providers
---------
azure (default)  Azure Speech neural voice ar-SA-HamedNeural. Natural sounding,
                 commercial use allowed, free tier of 500K characters/month.
                 Needs no Python packages. Put your credentials in .env.local
                 (git-ignored) at the project root:

                     AZURE_SPEECH_KEY=<key 1 from the Speech resource>
                     AZURE_SPEECH_REGION=<e.g. westeurope>

say              The built-in macOS "Majed" voice (offline, robotic).
                 Needs: python3 -m venv .venv && .venv/bin/pip install lameenc

Usage
-----
    python3 scripts/generate-audio.py                      # azure, only missing files
    python3 scripts/generate-audio.py --force              # regenerate everything
    python3 scripts/generate-audio.py --provider say       # offline fallback voice
    python3 scripts/generate-audio.py --voice ar-SA-ZariyahNeural   # female voice
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import wave
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "categories.json"
OUT = ROOT / "public" / "audio"
ENV_FILE = ROOT / ".env.local"

# Slightly slower than normal speech so young children can follow.
AZURE_RATE = "-10%"
AZURE_FORMAT = "audio-24khz-48kbitrate-mono-mp3"


def load_env() -> None:
    """Read KEY=VALUE lines from .env.local without printing anything."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


# --- Azure -----------------------------------------------------------------


def azure_mp3(text: str, voice: str) -> bytes:
    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        sys.exit(
            "Missing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION. "
            "Add them to .env.local (see the top of this file)."
        )

    ssml = (
        "<speak version='1.0' xml:lang='ar-SA' "
        "xmlns='http://www.w3.org/2001/10/synthesis'>"
        f"<voice xml:lang='ar-SA' name='{voice}'>"
        f"<prosody rate='{AZURE_RATE}'>{escape(text)}</prosody>"
        "</voice></speak>"
    )
    request = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml; charset=utf-8",
            "X-Microsoft-OutputFormat": AZURE_FORMAT,
            "User-Agent": "quizy-audio-generator",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:200]
        sys.exit(f"Azure returned HTTP {err.code}: {detail}")


# --- macOS "say" -----------------------------------------------------------


def say_mp3(text: str) -> bytes:
    import lameenc  # only needed for this provider

    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "q.wav"
        subprocess.run(
            [
                "say",
                "-v",
                "Majed",  # ar_001 = Modern Standard Arabic
                "--file-format=WAVE",
                "--data-format=LEI16@22050",
                "-o",
                str(wav_path),
                text,
            ],
            check=True,
        )
        with wave.open(str(wav_path), "rb") as w:
            assert w.getsampwidth() == 2 and w.getnchannels() == 1
            rate = w.getframerate()
            pcm = w.readframes(w.getnframes())

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    return encoder.encode(pcm) + encoder.flush()


# --- main ------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--provider", choices=["azure", "say"], default="azure")
    parser.add_argument("--voice", default="ar-SA-HamedNeural")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    load_env()
    OUT.mkdir(parents=True, exist_ok=True)
    categories = json.loads(DATA.read_text(encoding="utf-8"))

    made = skipped = 0
    for category in categories:
        for q in category["questions"]:
            mp3_path = OUT / f"{category['id']}-{q['id']}.mp3"
            if mp3_path.exists() and not args.force:
                skipped += 1
                continue
            if args.provider == "azure":
                audio = azure_mp3(q["question"], args.voice)
            else:
                audio = say_mp3(q["question"])
            mp3_path.write_bytes(audio)
            made += 1
            print(f"{mp3_path.name}  {q['question']}")
    print(f"done: {made} generated, {skipped} skipped")


if __name__ == "__main__":
    main()
