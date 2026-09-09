"""Build the frame-accurate transparent HD laptop plate used by DS2.

The source is a 1280x720 Veo render on black.  We keep the first 96 frames,
remove the sparkle watermark by isolating the central laptop, cut the green
display out as transparency, restore the metal/detail without generative
frame drift, and upscale every frame to 1920x1080 before encoding VP9 alpha.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from scipy import ndimage
from scipy.signal import savgol_filter

from composite_laptop_screen import detect_screen_quad, read_exact


SOURCE_WIDTH = 1280
SOURCE_HEIGHT = 720
OUTPUT_WIDTH = 1920
OUTPUT_HEIGHT = 1080
FPS = 24
FRAME_COUNT = 96


def read_frames(source: Path) -> list[np.ndarray]:
    decoder = subprocess.Popen(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(source),
            "-frames:v", str(FRAME_COUNT), "-an", "-f", "rawvideo",
            "-pix_fmt", "rgb24", "pipe:1",
        ],
        stdout=subprocess.PIPE,
    )
    if decoder.stdout is None:
        raise RuntimeError("Unable to open the ffmpeg decoder")

    frames: list[np.ndarray] = []
    frame_bytes = SOURCE_WIDTH * SOURCE_HEIGHT * 3
    for index in range(FRAME_COUNT):
        raw = read_exact(decoder.stdout, frame_bytes)
        if len(raw) != frame_bytes:
            raise RuntimeError(f"Source ended at frame {index}")
        frames.append(np.frombuffer(raw, dtype=np.uint8).reshape((SOURCE_HEIGHT, SOURCE_WIDTH, 3)).copy())
    if decoder.wait() != 0:
        raise RuntimeError("ffmpeg failed while decoding the source")
    return frames


def smooth_quads(detected: list[list[tuple[float, float]] | None]) -> list[list[list[float]] | None]:
    valid = np.asarray([index for index, quad in enumerate(detected) if quad is not None], dtype=int)
    if valid.size == 0:
        return [None] * len(detected)

    first = int(valid.min())
    last = int(valid.max())
    timeline = np.arange(first, last + 1)
    points = np.asarray([detected[index] for index in valid], dtype=np.float64)
    smoothed = np.empty((timeline.size, 4, 2), dtype=np.float64)
    window = min(11, valid.size if valid.size % 2 else valid.size - 1)
    for point in range(4):
        for axis in range(2):
            values = np.interp(timeline, valid, points[:, point, axis])
            if window >= 5:
                values = savgol_filter(values, window_length=window, polyorder=2, mode="interp")
            smoothed[:, point, axis] = values

    result: list[list[list[float]] | None] = [None] * len(detected)
    for offset, index in enumerate(timeline):
        quad = smoothed[offset]
        width = ((quad[1, 0] - quad[0, 0]) + (quad[2, 0] - quad[3, 0])) * 0.5
        height = ((quad[3, 1] - quad[0, 1]) + (quad[2, 1] - quad[1, 1])) * 0.5
        # Very shallow detections are reflections, not yet a usable display.
        if width > 90 and height > 5:
            result[int(index)] = [[float(x), float(y)] for x, y in quad]
    return result


def laptop_matte(frame: np.ndarray) -> np.ndarray:
    """Recover the continuous laptop silhouette from a black studio render."""
    rgb = frame.astype(np.float32)
    luminance = rgb.max(axis=2)
    seed = luminance > 11
    seed[:, :155] = False
    seed[:, 1110:] = False  # removes the bottom-right Veo sparkle watermark
    seed[:70] = False
    seed[655:] = False

    matte = np.zeros((SOURCE_HEIGHT, SOURCE_WIDTH), dtype=bool)
    for y in range(70, 655):
        row = seed[y].astype(np.float32)
        density = ndimage.uniform_filter1d(row, size=31, mode="constant")
        xs = np.flatnonzero(density > 0.045)
        if xs.size < 2:
            continue
        left = int(xs.min())
        right = int(xs.max())
        if right - left < 85 or not (left < 700 and right > 580):
            continue
        matte[y, max(0, left - 3):min(SOURCE_WIDTH, right + 4)] = True

    matte = ndimage.binary_closing(matte, structure=np.ones((5, 9), dtype=bool), iterations=1)
    matte = ndimage.binary_opening(matte, structure=np.ones((2, 3), dtype=bool), iterations=1)
    labels, count = ndimage.label(matte)
    if count:
        sizes = ndimage.sum(matte, labels, range(1, count + 1))
        keep = np.zeros(count + 1, dtype=bool)
        for label_index in np.argsort(sizes)[-4:]:
            if sizes[label_index] > 180:
                keep[label_index + 1] = True
        matte = keep[labels]
    return ndimage.binary_fill_holes(matte)


def expanded_polygon(quad: list[list[float]], pixels: float = 4.5) -> list[tuple[float, float]]:
    points = np.asarray(quad, dtype=np.float64)
    center = points.mean(axis=0)
    distances = np.linalg.norm(points - center, axis=1, keepdims=True)
    expanded = points + (points - center) / np.maximum(distances, 1.0) * pixels
    return [(float(x), float(y)) for x, y in expanded]


def restore_frame(frame: np.ndarray, quad: list[list[float]] | None) -> Image.Image:
    matte = laptop_matte(frame)
    alpha = Image.fromarray((matte * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.8))

    if quad is not None:
        display = Image.new("L", (SOURCE_WIDTH, SOURCE_HEIGHT), 0)
        ImageDraw.Draw(display).polygon(expanded_polygon(quad), fill=255)
        display = display.filter(ImageFilter.GaussianBlur(0.55))
        alpha_array = np.asarray(alpha, dtype=np.int16)
        display_array = np.asarray(display, dtype=np.int16)
        alpha = Image.fromarray(np.clip(alpha_array - display_array, 0, 255).astype(np.uint8), "L")

    cleaned = frame.astype(np.float32)
    red, green, blue = cleaned[:, :, 0], cleaned[:, :, 1], cleaned[:, :, 2]
    green_spill = (green > 20) & (green > red * 1.08 + 3) & (green > blue * 1.08 + 3)
    green[green_spill] = np.maximum(red[green_spill], blue[green_spill]) * 1.04
    cleaned[:, :, 1] = green

    gray = cleaned[:, :, 0] * 0.299 + cleaned[:, :, 1] * 0.587 + cleaned[:, :, 2] * 0.114
    cleaned = gray[:, :, None] + (cleaned - gray[:, :, None]) * 0.58
    cleaned = np.clip((cleaned - 8) * 1.075 + 8, 0, 255).astype(np.uint8)

    rgba = Image.fromarray(cleaned, "RGB")
    rgba = ImageEnhance.Contrast(rgba).enhance(1.06)
    rgba.putalpha(alpha)
    rgba = rgba.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS)
    rgb = rgba.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.75, percent=72, threshold=3))
    rgb.putalpha(rgba.getchannel("A"))
    return rgb


def encode_video(frames_dir: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-framerate", str(FPS), "-i", str(frames_dir / "frame-%03d.png"),
            "-frames:v", str(FRAME_COUNT), "-an", "-c:v", "libvpx-vp9",
            "-b:v", "0", "-crf", "16", "-deadline", "good", "-cpu-used", "2",
            "-row-mt", "1", "-auto-alt-ref", "0", "-pix_fmt", "yuva420p",
            "-metadata:s:v:0", "alpha_mode=1", str(output),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--frames", type=Path, required=True)
    parser.add_argument("--track", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    args.frames.mkdir(parents=True, exist_ok=True)
    args.track.parent.mkdir(parents=True, exist_ok=True)
    frames = read_frames(args.source)
    tracked = smooth_quads([detect_screen_quad(frame) for frame in frames])

    normalized: list[list[list[float]] | None] = []
    for index, (frame, quad) in enumerate(zip(frames, tracked, strict=True)):
        restored = restore_frame(frame, quad)
        restored.save(args.frames / f"frame-{index:03d}.png", optimize=True)
        normalized.append(
            None if quad is None else [[x / SOURCE_WIDTH, y / SOURCE_HEIGHT] for x, y in quad]
        )
        print(f"restored {index + 1:02d}/{FRAME_COUNT}", flush=True)

    args.track.write_text(json.dumps(normalized, separators=(",", ":")), encoding="utf-8")
    encode_video(args.frames, args.output)
    print(f"Wrote {FRAME_COUNT} HD frames to {args.frames}")
    print(f"Wrote transparent plate to {args.output}")
    print(f"Wrote {sum(item is not None for item in normalized)} tracked display frames to {args.track}")


if __name__ == "__main__":
    main()
