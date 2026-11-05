#!/usr/bin/env python3
"""
Generate one MP3 per question (Modern Standard Arabic) into public/audio/.

Files are named <categoryId>-<questionId>.mp3 and played by lib/speech.ts.

Requirements (macOS only, because it uses the built-in "Majed" ar_001 voice):
    python3 -m venv .venv && .venv/bin/pip install lameenc
    .venv/bin/python scripts/generate-audio.py            # only missing files
    .venv/bin/python scripts/generate-audio.py --force    # regenerate everything

To use a different (e.g. neural) voice, replace `synthesize()` so that it
writes a 16-bit mono WAV file; the rest of the script stays the same.
"""

import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import lameenc

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "categories.json"
OUT = ROOT / "public" / "audio"
VOICE = "Majed"  # ar_001 = Modern Standard Arabic
SAMPLE_RATE = 22050


def synthesize(text: str, wav_path: Path) -> None:
    subprocess.run(
        [
            "say",
            "-v",
            VOICE,
            "--file-format=WAVE",
            f"--data-format=LEI16@{SAMPLE_RATE}",
            "-o",
            str(wav_path),
            text,
        ],
        check=True,
    )


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    with wave.open(str(wav_path), "rb") as w:
        assert w.getsampwidth() == 2 and w.getnchannels() == 1
        rate = w.getframerate()
        pcm = w.readframes(w.getnframes())

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    mp3_path.write_bytes(encoder.encode(pcm) + encoder.flush())


def main() -> None:
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    categories = json.loads(DATA.read_text(encoding="utf-8"))

    made = skipped = 0
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "q.wav"
        for category in categories:
            for q in category["questions"]:
                mp3_path = OUT / f"{category['id']}-{q['id']}.mp3"
                if mp3_path.exists() and not force:
                    skipped += 1
                    continue
                synthesize(q["question"], wav_path)
                wav_to_mp3(wav_path, mp3_path)
                made += 1
                print(f"{mp3_path.name}  {q['question']}")
    print(f"done: {made} generated, {skipped} skipped")


if __name__ == "__main__":
    main()
