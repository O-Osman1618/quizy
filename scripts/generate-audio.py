#!/usr/bin/env python3
"""
Generate one MP3 per question (Modern Standard Arabic) into public/audio/.

Files are named <categoryId>-<questionId>.mp3 and played by lib/speech.ts.

Providers
---------
elevenlabs (default)
                 ElevenLabs multilingual voice. Very natural and expressive.
                 The free plan (10,000 credits/month, no card) is enough for the
                 questions but is for NON-commercial use only, and the API on
                 the free plan can only use the stock "premade" voices.
                 Put your key in .env.local (git-ignored) at the project root:

                     ELEVENLABS_API_KEY=<your key>
                     ELEVENLABS_VOICE_ID=<voice id, see --list-voices>   # optional

azure            Azure Speech neural voice ar-SA-HamedNeural. Natural sounding,
                 commercial use allowed, free tier of 500K characters/month.
                 Needs no Python packages. Put your credentials in .env.local
                 (git-ignored) at the project root:

                     AZURE_SPEECH_KEY=<key 1 from the Speech resource>
                     AZURE_SPEECH_REGION=<e.g. westeurope>

say              The built-in macOS "Majed" voice (offline, robotic).
                 Needs: python3 -m venv .venv && .venv/bin/pip install lameenc

Usage
-----
    python3 scripts/generate-audio.py --list-voices         # voices your key can use
    python3 scripts/generate-audio.py --samples             # one test clip per voice
    python3 scripts/generate-audio.py                       # only missing files
    python3 scripts/generate-audio.py --force               # regenerate everything
    python3 scripts/generate-audio.py --voice <voice id>    # choose the voice
    python3 scripts/generate-audio.py --provider azure      # Azure instead
    python3 scripts/generate-audio.py --provider say        # offline fallback voice
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


# --- ElevenLabs --------------------------------------------------------------

ELEVEN_BASE = "https://api.elevenlabs.io/v1"
ELEVEN_MODEL = "eleven_multilingual_v2"  # supports Arabic
# Slightly slower than normal speech so young children can follow (0.7 - 1.2).
ELEVEN_SPEED = 0.9


def eleven_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit(
            "Missing ELEVENLABS_API_KEY. Add it to .env.local "
            "(see the top of this file)."
        )
    return key


def eleven_request(url: str, body: dict | None = None) -> bytes:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={
            "xi-api-key": eleven_key(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg" if body is not None else "application/json",
            # Some CDNs reject the default Python user agent.
            "User-Agent": "quizy-audio-generator/1.0",
        },
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:300]
        sys.exit(f"ElevenLabs returned HTTP {err.code}: {detail}")


def eleven_voices() -> list[dict]:
    data = json.loads(eleven_request(f"{ELEVEN_BASE}/voices"))
    return data.get("voices", [])


def eleven_mp3(text: str, voice_id: str) -> bytes:
    return eleven_request(
        f"{ELEVEN_BASE}/text-to-speech/{voice_id}?output_format=mp3_44100_64",
        {
            "text": text,
            "model_id": ELEVEN_MODEL,
            "voice_settings": {
                "stability": 0.6,
                "similarity_boost": 0.8,
                "speed": ELEVEN_SPEED,
            },
        },
    )


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
    parser.add_argument(
        "--provider", choices=["elevenlabs", "azure", "say"], default="elevenlabs"
    )
    parser.add_argument("--voice", help="voice id (ElevenLabs) or name (Azure)")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--list-voices", action="store_true")
    parser.add_argument("--samples", action="store_true")
    args = parser.parse_args()

    load_env()

    if args.list_voices:
        for v in eleven_voices():
            print(f"{v['voice_id']}  {v['name']}  [{v.get('category', '')}]")
        return

    categories = json.loads(DATA.read_text(encoding="utf-8"))

    if args.samples:
        # One short clip per voice, so you can listen and pick the best one.
        sample_text = categories[2]["questions"][0]["question"]
        sample_dir = ROOT / "tmp-voice-samples"
        sample_dir.mkdir(exist_ok=True)
        for v in eleven_voices():
            if v.get("category") not in (None, "premade"):
                continue
            path = sample_dir / f"{v['name']}-{v['voice_id']}.mp3"
            path.write_bytes(eleven_mp3(sample_text, v["voice_id"]))
            print(path.name)
        print(f"samples saved in {sample_dir}")
        return

    OUT.mkdir(parents=True, exist_ok=True)
    voice = args.voice
    if args.provider == "elevenlabs":
        voice = voice or os.environ.get("ELEVENLABS_VOICE_ID")
        if not voice:
            sys.exit("Choose a voice: pass --voice <id> or set ELEVENLABS_VOICE_ID.")
    elif args.provider == "azure":
        voice = voice or "ar-SA-HamedNeural"

    made = skipped = 0
    for category in categories:
        for q in category["questions"]:
            mp3_path = OUT / f"{category['id']}-{q['id']}.mp3"
            if mp3_path.exists() and not args.force:
                skipped += 1
                continue
            if args.provider == "elevenlabs":
                audio = eleven_mp3(q["question"], voice)
            elif args.provider == "azure":
                audio = azure_mp3(q["question"], voice)
            else:
                audio = say_mp3(q["question"])
            mp3_path.write_bytes(audio)
            made += 1
            print(f"{mp3_path.name}  {q['question']}")
    print(f"done: {made} generated, {skipped} skipped")


if __name__ == "__main__":
    main()
