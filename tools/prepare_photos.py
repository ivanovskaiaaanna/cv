#!/usr/bin/env python3
"""Сжимает фото из photos/ для веба и кладёт в img/<имя>.webp.

Запуск:  python3 tools/prepare_photos.py
По умолчанию фото переводятся в ч/б. В цвете остаются портреты для первого
экрана и «Обо мне» и рабочие материалы Вольтны (это документы).
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "photos", ROOT / "img"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}

COLOR = {"portrait-color", "portrait-street"}
COLOR_PREFIX = ("voltna-",)
MAX_W = {"portrait-color": 1200, "portrait-bw": 1200, "portrait-street": 1000,
         "voltna-logo": 1200, "voltna-site-map": 2200}  # карту крупнее, чтобы читались подписи
# кадрирование (доли ширины/высоты: лево, верх, право, низ)
CROP = {"portrait-bw": (0.15, 0.34, 0.85, 1.0)}
# дополнительные кадры: имя -> (исходник, кадр, ширина)
EXTRA = {"voltna-site-map-card": ("voltna-site-map", (0.10, 0.17, 0.62, 0.70), 1000)}


def is_color(stem):
    return stem in COLOR or stem.startswith(COLOR_PREFIX)


def process(im, stem, crop=None, limit=1600):
    im = ImageOps.exif_transpose(im)
    if crop:
        l, t, r, b = crop
        im = im.crop((round(im.width * l), round(im.height * t), round(im.width * r), round(im.height * b)))
    if im.width > limit:
        im = im.resize((limit, round(im.height * limit / im.width)), Image.LANCZOS)
    if is_color(stem):
        return im.convert("RGB")
    im = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=0.5)
    return ImageEnhance.Contrast(im).enhance(1.06)


def save(im, name, src_size):
    dst = OUT / f"{name}.webp"
    im.save(dst, "WEBP", quality=80, method=6)
    print(f"{name:32} {src_size // 1024:>6} КБ → {dst.stat().st_size // 1024:>4} КБ, {im.width}×{im.height}")


OUT.mkdir(parents=True, exist_ok=True)
files = {p.stem: p for p in sorted(SRC.iterdir()) if p.suffix.lower() in EXTS} if SRC.exists() else {}
if not files:
    print(f"В {SRC} нет фото"); raise SystemExit(1)

for stem, p in files.items():
    save(process(Image.open(p), stem, CROP.get(stem), MAX_W.get(stem, 1600)), stem, p.stat().st_size)

for name, (stem, crop, width) in EXTRA.items():
    if stem in files:
        p = files[stem]
        save(process(Image.open(p), stem, crop, width), name, p.stat().st_size)
