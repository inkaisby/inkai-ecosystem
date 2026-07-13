#!/usr/bin/env python3
"""Generate presidential-grade themed slide visuals locally."""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS_DIR = Path(__file__).resolve().parent.parent / "docs" / "ppt-assets"
LOGO_PATH = Path(r"D:\website\inkai\logo.png")

THEME_META: dict[str, tuple[str, tuple[int, int, int]]] = {
    "hero": ("INKAI DIGITAL", (201, 169, 98)),
    "agenda": ("AGENDA", (180, 190, 200)),
    "challenge": ("TANTANGAN", (140, 155, 175)),
    "solution": ("SOLUSI", (201, 169, 98)),
    "vision": ("VISI & MISI", (201, 169, 98)),
    "executive": ("EKSEKUTIF", (190, 200, 210)),
    "technology": ("TEKNOLOGI", (120, 170, 210)),
    "organization": ("ORGANISASI", (160, 175, 195)),
    "public_web": ("PORTAL PUBLIK", (175, 185, 200)),
    "registration": ("REGISTRASI", (201, 169, 98)),
    "store": ("INKAI STORE", (201, 169, 98)),
    "member": ("PORTAL ANGGOTA", (201, 169, 98)),
    "dashboard": ("DASHBOARD", (150, 180, 210)),
    "attendance": ("ABSENSI QR", (130, 190, 160)),
    "billing": ("IURAN", (201, 169, 98)),
    "events": ("EVENT & UKT", (190, 160, 130)),
    "tournament": ("PERTANDINGAN", (201, 169, 98)),
    "tatami": ("TATAMI LIVE", (190, 150, 120)),
    "scoring": ("PENILAIAN JURI", (180, 190, 130)),
    "ukt": ("UKT DIGITAL", (201, 169, 98)),
    "achievement": ("PRESTASI", (201, 169, 98)),
    "documents": ("DOKUMEN", (170, 180, 195)),
    "guide": ("PANDUAN", (160, 185, 175)),
    "admin": ("PANEL ADMIN", (180, 170, 200)),
    "members": ("KEANGGOTAAN", (175, 185, 200)),
    "verification": ("VERIFIKASI", (150, 175, 210)),
    "broadcast": ("BROADCAST", (190, 175, 155)),
    "features": ("FITUR UNGGULAN", (201, 169, 98)),
    "workflow": ("ALUR KERJA", (165, 180, 195)),
    "stakeholder": ("STAKEHOLDER", (201, 169, 98)),
    "roadmap": ("ROADMAP", (150, 170, 200)),
    "security": ("KEAMANAN", (140, 165, 200)),
    "demo": ("DEMO PLATFORM", (175, 190, 205)),
    "cost": ("ESTIMASI BIAYA", (201, 169, 98)),
    "deploy": ("DEPLOY www", (130, 175, 210)),
    "infrastructure": ("INFRASTRUKTUR", (145, 165, 195)),
    "maintenance": ("PEMELIHARAAN", (170, 175, 185)),
    "investment": ("INVESTASI", (201, 169, 98)),
    "payment": ("PEMBAYARAN", (201, 169, 98)),
    "closing": ("TERIMA KASIH", (201, 169, 98)),
}


def asset_path(key: str) -> Path:
    return ASSETS_DIR / f"{key}.jpg"


def _fast_gradient(w: int, h: int, accent: tuple[int, int, int]) -> Image.Image:
    top, bot = (8, 18, 36), tuple(min(255, int(c * 0.38 + 18)) for c in accent)
    band = Image.new("RGB", (1, h))
    px = band.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = (
            int(top[0] + (bot[0] - top[0]) * t),
            int(top[1] + (bot[1] - top[1]) * t),
            int(top[2] + (bot[2] - top[2]) * t),
        )
    return band.resize((w, h), Image.Resampling.BILINEAR)


def generate_theme_image(key: str, label: str, accent: tuple[int, int, int]) -> None:
    w, h = 1920, 1080
    seed = sum(ord(c) for c in key)
    rng = random.Random(seed)
    img = _fast_gradient(w, h, accent).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Gold frame lines
    for i in range(5):
        y = int(h * (0.12 + i * 0.14))
        draw.line([(0, y), (int(w * 0.52), y + rng.randint(-6, 6))], fill=(201, 169, 98, 160), width=1)
    draw.rectangle([0, 0, w, 5], fill=(201, 169, 98))
    draw.rectangle([0, h - 3, w, h], fill=(201, 169, 98))

    cx, cy, r = int(w * 0.28), int(h * 0.42), 220
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(201, 169, 98), width=5)
    draw.ellipse([cx - r + 24, cy - r + 24, cx + r - 24, cy + r - 24], outline=(100, 130, 170), width=2)

    if LOGO_PATH.is_file():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_px = int(r * 2 * 0.72)
        logo = logo.resize((logo_px, logo_px), Image.Resampling.LANCZOS)
        img.paste(logo, (cx - logo_px // 2, cy - logo_px // 2), logo)

    try:
        font_lg = ImageFont.truetype("arial.ttf", 54)
        font_sm = ImageFont.truetype("arial.ttf", 24)
    except OSError:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()

    draw.text((int(w * 0.07), int(h * 0.73)), label, fill=(245, 240, 232), font=font_lg)
    draw.text((int(w * 0.07), int(h * 0.83)), "Institut Karate-Do Indonesia", fill=(184, 196, 206), font=font_sm)

    out = img.convert("RGB").filter(ImageFilter.GaussianBlur(radius=0.25))
    out.save(asset_path(key), "JPEG", quality=93, optimize=True)


def download_all(force: bool = False) -> int:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for key, (label, accent) in THEME_META.items():
        if asset_path(key).is_file() and not force:
            continue
        generate_theme_image(key, label, accent)
        count += 1
        print(f"  ok {key}.jpg")
    return count


if __name__ == "__main__":
    n = download_all(force=True)
    print(f"Generated {n} images -> {ASSETS_DIR}")
