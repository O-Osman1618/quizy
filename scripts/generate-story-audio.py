#!/usr/bin/env python3
"""
Generate multi-voice story page MP3s from a dialogue manifest.

Reads data/<story>-dialogue.json (or --manifest), calls ElevenLabs once per
line with that speaker's voice, then stitches the clips into
public/stories/<storyId>/audio/page-N.mp3.

Usage
-----
    python3 scripts/generate-story-audio.py
    python3 scripts/generate-story-audio.py --force
    python3 scripts/generate-story-audio.py --manifest data/arkan-al-islam-dialogue.json
    python3 scripts/generate-story-audio.py --page 1
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
DEFAULT_MANIFEST = ROOT / "data" / "arkan-al-islam-dialogue.json"

ELEVEN_BASE = "https://api.elevenlabs.io/v1"
ELEVEN_MODEL = "eleven_multilingual_v2"
ELEVEN_SPEED = 0.9
# Gap of near-silence between speakers (raw MP3 frames at 44.1kHz / 64kbps).
GAP_MS = 350


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def eleven_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Missing ELEVENLABS_API_KEY in .env.local")
    return key


def eleven_request(url: str, body: dict | None = None) -> bytes:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={
            "xi-api-key": eleven_key(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg" if body is not None else "application/json",
            "User-Agent": "quizy-story-audio/1.0",
        },
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:400]
        sys.exit(f"ElevenLabs returned HTTP {err.code}: {detail}")


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


def silent_mp3(duration_ms: int = GAP_MS) -> bytes:
    """Build a short silent CBR MP3 (44.1kHz mono 64kbps) via lameenc when available.

    Falls back to an empty byte string (clips still concat fine).
    """
    try:
        import lameenc
    except ImportError:
        return b""

    sample_rate = 44100
    n_samples = int(sample_rate * duration_ms / 1000)
    pcm = b"\x00\x00" * n_samples
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    return encoder.encode(pcm) + encoder.flush()


def line_cache_path(cache_dir: Path, voice_id: str, text: str) -> Path:
    digest = hashlib.sha1(f"{voice_id}\n{text}".encode("utf-8")).hexdigest()[:16]
    return cache_dir / f"{digest}.mp3"


def concat_mp3(parts: list[bytes], gap: bytes) -> bytes:
    out = bytearray()
    for i, part in enumerate(parts):
        if i and gap:
            out.extend(gap)
        out.extend(part)
    return bytes(out)


def generate_page(
    page: dict,
    voices: dict,
    out_path: Path,
    cache_dir: Path,
    gap: bytes,
    force: bool,
) -> str:
    if out_path.exists() and not force:
        return "skipped"

    clips: list[bytes] = []
    for i, line in enumerate(page["lines"], start=1):
        speaker = line["speaker"]
        text = line["text"].strip()
        voice = voices[speaker]
        voice_id = voice["id"]
        cached = line_cache_path(cache_dir, voice_id, text)
        if cached.exists() and not force:
            audio = cached.read_bytes()
            status = "cache"
        else:
            print(f"  line {i}/{len(page['lines'])}  {speaker}: {text[:40]}…")
            audio = eleven_mp3(text, voice_id)
            cached.write_bytes(audio)
            status = "tts"
        clips.append(audio)
        if status == "cache":
            print(f"  line {i}/{len(page['lines'])}  {speaker}  (cached)")

    out_path.write_bytes(concat_mp3(clips, gap))
    return "generated"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="path to dialogue JSON",
    )
    parser.add_argument("--force", action="store_true", help="regenerate even if present")
    parser.add_argument("--page", type=int, help="only generate this page id")
    args = parser.parse_args()

    load_env()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    story_id = manifest["storyId"]
    voices = manifest["voices"]

    out_dir = ROOT / "public" / "stories" / story_id / "audio"
    cache_dir = ROOT / "tmp-story-audio-cache" / story_id
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)

    gap = silent_mp3(GAP_MS)
    if not gap:
        print("note: lameenc not installed — stitching without silence gaps")

    made = skipped = 0
    for page in manifest["pages"]:
        if args.page is not None and page["id"] != args.page:
            continue
        out_path = out_dir / f"page-{page['id']}.mp3"
        print(f"page {page['id']} → {out_path.relative_to(ROOT)}")
        result = generate_page(page, voices, out_path, cache_dir, gap, args.force)
        if result == "skipped":
            skipped += 1
            print("  skipped (exists)")
        else:
            made += 1
            print(f"  {result}")

    print(f"done: {made} generated, {skipped} skipped")


if __name__ == "__main__":
    main()
