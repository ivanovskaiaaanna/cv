#!/usr/bin/env python3
"""Сжимает фото из photos/ для веба и переводит в ч/б.

Запуск:  python3 tools/prepare_photos.py
Берёт любые jpg/jpeg/png/heic из photos/, кладёт результат в img/<имя>.webp
(ширина до 1600px, WebP ~80%). Все фото, включая афишу, переводятся в ч/б.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "photos", ROOT / "img"
KEEP_COLOR = set()  # афишу тоже в ч/б: розовый на ней — второй акцентный цвет
# кадрирование (доли ширины/высоты: лево, верх, право, низ)
CROP = {"portrait-bw": (0.15, 0.34, 0.85, 1.0)}
MAX_W = {"portrait-bw": 1200, "portrait-street": 1000}  # полароиды меньше по размеру
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}

OUT.mkdir(parents=True, exist_ok=True)
files = sorted(p for p in SRC.iterdir() if p.suffix.lower() in EXTS)
if not files:
    print(f"В {SRC} нет фото"); raise SystemExit(1)

for p in files:
    im = ImageOps.exif_transpose(Image.open(p))
    if p.stem in CROP:
        l, t, r, b = CROP[p.stem]
        im = im.crop((round(im.width*l), round(im.height*t), round(im.width*r), round(im.height*b)))
    limit = MAX_W.get(p.stem, 1600)
    if im.width > limit:
        im = im.resize((limit, round(im.height * limit / im.width)), Image.LANCZOS)
    if p.stem in KEEP_COLOR:
        im = im.convert("RGB")
    else:
        im = ImageOps.grayscale(im)
        im = ImageOps.autocontrast(im, cutoff=0.5)
        im = ImageEnhance.Contrast(im).enhance(1.06)
    dst = OUT / f"{p.stem}.webp"
    im.save(dst, "WEBP", quality=80, method=6)
    print(f"{p.name:40} {p.stat().st_size//1024:>6} КБ → {dst.name} {dst.stat().st_size//1024} КБ, {im.width}×{im.height}")
