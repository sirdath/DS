"""Render the DS2 assistant prompts with Arya's local Kokoro Heart voice.

Usage from the repository root (PowerShell):
  node --experimental-strip-types scripts/export-assistant-voice-prompts.mjs |
    <chit-chat-python> scripts/generate-assistant-voice.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline


VOICE = "af_heart"
SAMPLE_RATE = 24_000
OUTPUT_ROOT = Path(__file__).resolve().parents[1] / "apps" / "ds-site" / "public" / "audio" / "arya"


def main() -> None:
    prompts = json.load(sys.stdin)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipeline = KPipeline(lang_code="a", device=device)

    for index, prompt in enumerate(prompts, start=1):
        destination = OUTPUT_ROOT / prompt["lang"] / f'{prompt["key"]}.mp3'
        destination.parent.mkdir(parents=True, exist_ok=True)
        chunks = [audio.numpy() for _, _, audio in pipeline(prompt["text"], voice=VOICE)]
        if not chunks:
            raise RuntimeError(f'Kokoro produced no audio for {prompt["lang"]}/{prompt["key"]}')
        sf.write(destination, np.concatenate(chunks), SAMPLE_RATE, format="MP3")
        print(f"[{index:02d}/{len(prompts):02d}] {destination.relative_to(OUTPUT_ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
