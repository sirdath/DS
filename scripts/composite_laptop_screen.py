"""Track the Veo laptop green screen and composite a desktop capture into it."""

from __future__ import annotations

import argparse
import subprocess
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


WIDTH = 1280
HEIGHT = 720
FPS = 24
FRAME_COUNT = 96
CROP = (160, 90, 1120, 630)


def read_exact(stream, size: int) -> bytes:
    chunks: list[bytes] = []
    remaining = size
    while remaining:
        chunk = stream.read(remaining)
        if not chunk:
            break
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def largest_upper_component(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    """Find the dominant green component on a quarter-resolution mask."""
    small = mask[::4, ::4]
    rows, cols = small.shape
    visited = np.zeros_like(small, dtype=bool)
    components: list[tuple[int, int, int, int, int]] = []

    for y in range(rows):
        for x in range(cols):
            if not small[y, x] or visited[y, x]:
                continue
            queue = deque([(x, y)])
            visited[y, x] = True
            area = 0
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                px, py = queue.popleft()
                area += 1
                min_x = min(min_x, px)
                max_x = max(max_x, px)
                min_y = min(min_y, py)
                max_y = max(max_y, py)
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < cols and 0 <= ny < rows and small[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((nx, ny))
            component_width = max_x - min_x + 1
            if area >= 8 and component_width >= 18:
                components.append((area, min_x, min_y, max_x, max_y))

    if not components:
        return None
    max_area = max(item[0] for item in components)
    plausible = [item for item in components if item[0] >= max_area * 0.22]
    _, min_x, min_y, max_x, max_y = min(plausible, key=lambda item: (item[2], -item[0]))
    return min_x * 4, min_y * 4, min((max_x + 1) * 4, WIDTH), min((max_y + 1) * 4, HEIGHT)


def detect_screen_quad(frame: np.ndarray) -> list[tuple[float, float]] | None:
    red = frame[:, :, 0].astype(np.int16)
    green = frame[:, :, 1].astype(np.int16)
    blue = frame[:, :, 2].astype(np.int16)
    mask = (green > 62) & (green - red > 34) & (green - blue > 28)
    roi = np.zeros_like(mask)
    roi[55:625, 170:1110] = True
    mask &= roi
    bounds = largest_upper_component(mask)
    if bounds is None:
        return None

    x0, y0, x1, y1 = bounds
    region = mask[y0:y1, x0:x1]
    samples: list[tuple[int, int, int]] = []
    minimum_pixels = max(5, int((x1 - x0) * 0.08))
    for offset, row in enumerate(region):
        xs = np.flatnonzero(row)
        if xs.size >= minimum_pixels:
            samples.append((y0 + offset, x0 + int(xs.min()), x0 + int(xs.max())))
    if len(samples) < 2:
        return None

    ys = np.asarray([sample[0] for sample in samples], dtype=float)
    lefts = np.asarray([sample[1] for sample in samples], dtype=float)
    rights = np.asarray([sample[2] for sample in samples], dtype=float)
    top_y = float(ys.min())
    bottom_y = float(ys.max())
    if bottom_y - top_y < 2:
        left_top = float(np.percentile(lefts, 12))
        right_top = float(np.percentile(rights, 88))
        return [(left_top, top_y), (right_top, top_y), (right_top, bottom_y + 2), (left_top, bottom_y + 2)]

    left_fit = np.polyfit(ys, lefts, 1)
    right_fit = np.polyfit(ys, rights, 1)
    left_top = float(np.polyval(left_fit, top_y))
    left_bottom = float(np.polyval(left_fit, bottom_y))
    right_top = float(np.polyval(right_fit, top_y))
    right_bottom = float(np.polyval(right_fit, bottom_y))
    inset = 1.0
    return [
        (left_top + inset, top_y + inset),
        (right_top - inset, top_y + inset),
        (right_bottom - inset, bottom_y - inset),
        (left_bottom + inset, bottom_y - inset),
    ]


def perspective_coefficients(
    destination: list[tuple[float, float]], source: list[tuple[float, float]]
) -> tuple[float, ...]:
    matrix: list[list[float]] = []
    values: list[float] = []
    for (x, y), (u, v) in zip(destination, source, strict=True):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.append(v)
    return tuple(np.linalg.solve(np.asarray(matrix), np.asarray(values)).tolist())


def add_alpha(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    brightness = rgb.max(axis=2).astype(np.int16)
    alpha = np.clip((brightness - 4) * 20, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack((rgb, alpha)), "RGBA")


def composite_frame(frame: np.ndarray, desktop: Image.Image) -> tuple[Image.Image, list[tuple[float, float]] | None]:
    quad = detect_screen_quad(frame)
    cleaned = frame.copy()
    red = cleaned[:, :, 0].astype(np.int16)
    green = cleaned[:, :, 1].astype(np.int16)
    blue = cleaned[:, :, 2].astype(np.int16)
    green_spill = (green > 24) & (green - red > 5) & (green - blue > 5)
    neutral = np.clip((red + blue) / 2.0, 0, 255).astype(np.uint8)
    cleaned[:, :, 1][green_spill] = neutral[green_spill]
    hardware_gray = np.clip(
        cleaned[:, :, 0].astype(np.float32) * 0.299
        + cleaned[:, :, 1].astype(np.float32) * 0.587
        + cleaned[:, :, 2].astype(np.float32) * 0.114,
        0,
        255,
    ).astype(np.uint8)
    cleaned = np.repeat(hardware_gray[:, :, None], 3, axis=2)
    deep_black = cleaned.max(axis=2) < 18
    cleaned[deep_black] = 0
    base = Image.fromarray(cleaned, "RGB")
    if quad is None:
        return add_alpha(base.crop(CROP)), None

    source_quad = [
        (0.0, 0.0),
        (float(desktop.width - 1), 0.0),
        (float(desktop.width - 1), float(desktop.height - 1)),
        (0.0, float(desktop.height - 1)),
    ]
    coefficients = perspective_coefficients(quad, source_quad)
    warped = desktop.transform(
        (WIDTH, HEIGHT),
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
    )
    mask = Image.new("L", (WIDTH, HEIGHT), 0)
    ImageDraw.Draw(mask).polygon(quad, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.55))
    composed = Image.composite(warped, base, mask)
    return add_alpha(composed.crop(CROP)), quad


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--desktop", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    desktop = Image.open(args.desktop).convert("RGB")
    decoder = subprocess.Popen(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(args.source),
            "-frames:v", str(FRAME_COUNT), "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
        ],
        stdout=subprocess.PIPE,
    )
    encoder = subprocess.Popen(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
            "-s", "960x540", "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libvpx-vp9",
            "-b:v", "0", "-crf", "18", "-deadline", "good", "-cpu-used", "2", "-auto-alt-ref", "0",
            "-pix_fmt", "yuva420p", "-metadata:s:v:0", "alpha_mode=1", str(args.output),
        ],
        stdin=subprocess.PIPE,
    )
    if decoder.stdout is None or encoder.stdin is None:
        raise RuntimeError("Unable to open video pipes")

    frame_bytes = WIDTH * HEIGHT * 3
    tracked = 0
    sampled_quads: dict[int, list[tuple[float, float]]] = {}
    for index in range(FRAME_COUNT):
        raw = read_exact(decoder.stdout, frame_bytes)
        if len(raw) != frame_bytes:
            raise RuntimeError(f"Source ended at frame {index}")
        frame = np.frombuffer(raw, dtype=np.uint8).reshape((HEIGHT, WIDTH, 3))
        composed, quad = composite_frame(frame, desktop)
        if quad is not None:
            tracked += 1
            if index in {36, 48, 60, 72, 84, 95}:
                sampled_quads[index] = quad
        encoder.stdin.write(np.asarray(composed, dtype=np.uint8).tobytes())

    encoder.stdin.close()
    decoder_code = decoder.wait()
    encoder_code = encoder.wait()
    if decoder_code or encoder_code:
        raise RuntimeError(f"ffmpeg failed: decoder={decoder_code}, encoder={encoder_code}")
    print(f"Wrote {args.output} with {tracked}/{FRAME_COUNT} tracked screen frames")
    for frame_number, quad in sampled_quads.items():
        print(f"frame {frame_number}: {quad}")


if __name__ == "__main__":
    main()
