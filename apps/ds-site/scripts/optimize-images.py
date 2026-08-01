#!/usr/bin/env python3
"""One pass: (1) regenerate the 10 hero placeholder interfaces DARK to match the
hero, as small WebP; (2) convert the real screenshots to right-sized WebP;
(3) recompress the other heavy PNGs in place. Reports before/after bytes."""
from PIL import Image, ImageDraw
from pathlib import Path
import math

PUB = Path("/Users/dath/Desktop/ds2-site-review/apps/ds-site/public")

def kb(p): return p.stat().st_size / 1024 if p.exists() else 0

# ───────────────────────── dark placeholder interfaces ─────────────────────────
W, H = 800, 500
BG1, BG2 = (26, 29, 35), (13, 15, 18)
PANEL = (32, 36, 44)
PANEL2 = (40, 45, 54)
LINE = (255, 255, 255, 26)
ICE = (141, 203, 255)
ICE_DIM = (141, 203, 255, 70)
TXT = (150, 152, 150)
TXT_DIM = (95, 98, 102)

# ex index → (label, style). ex-01/12 are real photos (atelier/padel), left alone.
SPEC = {
    2: ("Web apps", "dash"), 3: ("SaaS products", "chart"), 4: ("Web shops", "grid"),
    5: ("Platforms", "feed"), 6: ("Automation", "nodes"), 7: ("AI agents", "chat"),
    8: ("AI integration", "tiles"), 9: ("Data & predictions", "bars"),
    10: ("CRM systems", "kanban"), 11: ("Marketplaces", "photos"),
}

def vgrad(c1, c2):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return img

def panel(d, box, r=13, fill=PANEL, outline=LINE):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=1)

def draw(ov, style):
    d = ImageDraw.Draw(ov)
    ice = ICE + (255,)
    iced = ICE_DIM
    # top chrome
    panel(d, (28, 24, W - 28, 66), r=11, fill=(30, 34, 41, 240))
    for i, col in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse((48 + i * 20, 39, 60 + i * 20, 51), fill=col + (170,))
    d.rounded_rectangle((W - 150, 38, W - 44, 52), radius=6, fill=(255, 255, 255, 16))
    if style == "dash":
        panel(d, (28, 82, 210, H - 28))
        for i in range(5):
            d.rounded_rectangle((48, 108 + i * 34, 190, 128 + i * 34), radius=6,
                                fill=(iced if i == 0 else (255, 255, 255, 22)))
        panel(d, (230, 82, W - 28, 250))
        d.rounded_rectangle((252, 108, 420, 132), radius=6, fill=(255, 255, 255, 34))
        d.rounded_rectangle((252, 150, 360, 214), radius=8, fill=iced)
        for i in range(3):
            panel(d, (230 + i * 190, 268, 400 + i * 190, H - 28), fill=PANEL2)
    elif style == "chart":
        panel(d, (28, 82, 500, H - 28))
        base, pts = 0, [(60, 360), (150, 300), (240, 330), (330, 240), (420, 280), (490, 190)]
        for a, b in zip(pts, pts[1:]):
            d.line([a, b], fill=ice, width=5)
        for x, y in pts:
            d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=ice)
        for i in range(3):
            panel(d, (520, 82 + i * 118, W - 28, 180 + i * 118), fill=PANEL2)
            d.rounded_rectangle((540, 104 + i * 118, 640, 124 + i * 118), radius=5, fill=iced)
    elif style in ("grid", "photos"):
        for r_ in range(2):
            for c_ in range(4):
                x, y = 40 + c_ * 188, 90 + r_ * 156
                panel(d, (x, y, x + 168, y + 132), fill=PANEL2)
                d.rounded_rectangle((x + 14, y + 14, x + 154, y + 92), radius=8,
                                    fill=iced if (r_ + c_) % 2 == 0 else (255, 255, 255, 24))
    elif style == "feed":
        for i in range(4):
            panel(d, (40, 92 + i * 96, W - 40, 172 + i * 96), fill=PANEL2)
            d.ellipse((62, 112 + i * 96, 110, 152 + i * 96), fill=iced)
            d.rounded_rectangle((128, 116 + i * 96, 420, 132 + i * 96), radius=5, fill=(255, 255, 255, 30))
            d.rounded_rectangle((128, 142 + i * 96, 300, 154 + i * 96), radius=5, fill=(255, 255, 255, 18))
    elif style == "nodes":
        nodes = [(150, 260), (360, 150), (360, 370), (580, 260), (700, 150), (700, 370)]
        edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (3, 5)]
        for a, b in edges:
            d.line([nodes[a], nodes[b]], fill=iced, width=3)
        for x, y in nodes:
            panel(d, (x - 58, y - 28, x + 58, y + 28), fill=PANEL2)
            d.ellipse((x - 42, y - 11, x - 20, y + 11), fill=ice)
    elif style == "chat":
        for i in range(4):
            left = i % 2 == 0
            w = 300 + (i % 3) * 110
            x = 60 if left else W - 60 - w
            y = 108 + i * 92
            d.rounded_rectangle((x, y, x + w, y + 68), radius=16,
                                fill=(255, 255, 255, 26) if left else (ICE[0], ICE[1], ICE[2], 150))
    elif style == "tiles":
        for r_ in range(2):
            for c_ in range(5):
                x, y = 56 + c_ * 142, 108 + r_ * 168
                panel(d, (x, y, x + 118, y + 128), r=18, fill=PANEL2)
                d.ellipse((x + 38, y + 32, x + 80, y + 74), fill=iced)
    elif style == "bars":
        panel(d, (28, 82, W - 28, H - 28))
        base = H - 70
        for i in range(9):
            h = 44 + (i * 41) % 240
            x = 66 + i * 76
            d.rounded_rectangle((x, base - h, x + 42, base), radius=6, fill=ice if i % 3 == 0 else iced)
    elif style == "kanban":
        for c_ in range(4):
            x = 40 + c_ * 188
            panel(d, (x, 82, x + 168, H - 28), fill=(30, 34, 41, 200))
            for i in range(3):
                d.rounded_rectangle((x + 14, 112 + i * 108, x + 154, 200 + i * 108), radius=8,
                                    fill=iced if i == 0 else (255, 255, 255, 20))

def build_placeholder(i, style):
    img = vgrad(BG1, BG2).convert("RGBA")
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw(ov, style)
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, H - 1), outline=(255, 255, 255, 18), width=1)
    out = PUB / "hero-core/uploads" / f"ex-{i:02d}.webp"
    img.convert("RGB").save(out, "WEBP", quality=80, method=6)
    return out

# ───────────────────────── real screenshots → right-sized WebP ─────────────────────────
def to_webp(src: Path, dst: Path, max_w: int, q=80):
    if not src.exists():
        print("  MISS", src.name); return None
    im = Image.open(src).convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "WEBP", quality=q, method=6)
    return dst

def recompress_png(src: Path, max_w: int):
    if not src.exists():
        print("  MISS", src.name); return
    before = kb(src)
    im = Image.open(src)
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(src, optimize=True)
    print(f"  png  {src.name}: {before:.0f}KB -> {kb(src):.0f}KB")

before_total = sum(f.stat().st_size for f in PUB.rglob("*")
                   if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))

print("== dark placeholders (ex-02..ex-11.webp) ==")
for i, (label, style) in SPEC.items():
    p = build_placeholder(i, style)
    print(f"  ex-{i:02d}.webp ({label}) {kb(p):.0f}KB")

print("== real hero photos ex-01/ex-12 -> webp ==")
to_webp(PUB / "templates/atelier.png", PUB / "hero-core/uploads/ex-01.webp", 820)
to_webp(PUB / "templates/padel.png", PUB / "hero-core/uploads/ex-12.webp", 820)

print("== portfolio covers -> webp (1200w) ==")
for name in ["nodebook", "dreambug", "dataportfolio", "globalteamplans", "neurovault", "panoptes"]:
    src = PUB / "portfolio" / f"{name}.png"
    d = to_webp(src, PUB / "portfolio" / f"{name}.webp", 1200)
    if d: print(f"  {name}: {kb(src):.0f}KB -> {kb(d):.0f}KB")

print("== templates (projects) -> webp (1200w) ==")
for name in ["atelier", "padel"]:
    src = PUB / "templates" / f"{name}.png"
    d = to_webp(src, PUB / "templates" / f"{name}.webp", 1200)
    if d: print(f"  {name}: {kb(src):.0f}KB -> {kb(d):.0f}KB")

print("== tools posters -> webp (1200w) ==")
for src in sorted((PUB / "tools/posters").glob("*.png")):
    d = to_webp(src, src.with_suffix(".webp"), 1200)
    if d: print(f"  {src.stem}: {kb(src):.0f}KB -> {kb(d):.0f}KB")

print("== recompress other heavy PNGs in place ==")
for rel, mw in [("founders/athens.png", 1500), ("founders/london.png", 1500),
                ("contact-section-bg.png", 1600), ("backgrounds/anodized-curves.png", 1600),
                ("logos/ds2-a.png", 900), ("logos/black_DS2_logo.png", 900)]:
    recompress_png(PUB / rel, mw)
for p in (PUB / "portals").glob("*.png"):
    recompress_png(p, 1300)

after_total = sum(f.stat().st_size for f in PUB.rglob("*")
                  if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
print(f"\nTOTAL image weight: {before_total/1048576:.1f} MB -> {after_total/1048576:.1f} MB")
