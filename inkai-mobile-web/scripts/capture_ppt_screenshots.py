#!/usr/bin/env python3
"""Capture left-panel slide visuals from inkai-mobile-web.vercel.app."""

from __future__ import annotations

import os
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

# Reuse theme keys from asset generator
sys.path.insert(0, str(Path(__file__).resolve().parent))
from download_ppt_assets import THEME_META  # noqa: E402

BASE_URL = "https://inkai-mobile-web.vercel.app"
SCREENSHOTS_DIR = Path(__file__).resolve().parent.parent / "docs" / "ppt-screenshots"

VIEWPORT = {"width": 390, "height": 844}
PANEL_SIZE = (730, 1080)

# Map each slide theme to a live route on the deployed app
THEME_ROUTES: dict[str, str] = {
    "hero": "/",
    "agenda": "/",
    "challenge": "/",
    "solution": "/store",
    "vision": "/register",
    "executive": "/login",
    "technology": "/login",
    "organization": "/register",
    "public_web": "/",
    "registration": "/register",
    "store": "/store",
    "member": "/login",
    "dashboard": "/dashboard",
    "attendance": "/absensi",
    "billing": "/billing",
    "events": "/events",
    "tournament": "/events",
    "tatami": "/events",
    "scoring": "/events",
    "ukt": "/achievement",
    "achievement": "/achievement",
    "documents": "/documents",
    "guide": "/guide",
    "admin": "/admin/login",
    "members": "/admin/members",
    "verification": "/admin/verification",
    "broadcast": "/admin/broadcast",
    "features": "/store",
    "workflow": "/register",
    "stakeholder": "/",
    "roadmap": "/dashboard",
    "security": "/login",
    "demo": "/",
    "cost": "/billing",
    "deploy": "/",
    "infrastructure": "/admin",
    "maintenance": "/admin/settings",
    "investment": "/admin/billing",
    "payment": "/register",
    "closing": "/",
    "leadership": "/",
}


def asset_path(key: str) -> Path:
    return SCREENSHOTS_DIR / f"{key}.jpg"


def _cover_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def _save_jpeg(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, "JPEG", quality=92, optimize=True)


def _member_login(page, identifier: str, password: str) -> bool:
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(800)
    page.fill("#login-identifier", identifier)
    page.fill("#login-password", password)
    page.click('button[type="submit"]')
    try:
        page.wait_for_url(f"{BASE_URL}/dashboard**", timeout=15000)
        return True
    except Exception:
        return "/dashboard" in page.url


def _admin_login(page, identifier: str, password: str) -> bool:
    page.goto(f"{BASE_URL}/admin/login", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(800)
    page.locator('input[type="text"]').first.fill(identifier)
    page.locator('input[type="password"]').first.fill(password)
    page.locator('button[type="submit"]').click()
    try:
        page.wait_for_url(f"{BASE_URL}/admin**", timeout=15000)
        return "/admin/login" not in page.url
    except Exception:
        return "/admin/login" not in page.url and "/admin" in page.url


def _capture_route(page, route: str) -> Image.Image:
    url = f"{BASE_URL}{route}"
    page.goto(url, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(2000)
    png = page.screenshot(type="png", full_page=False)
    return Image.open(BytesIO(png)).convert("RGB")


def capture_all(force: bool = False) -> int:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    themes = list(THEME_META.keys()) + ["leadership"]
    themes = list(dict.fromkeys(themes))

    member_id = os.environ.get("INKAI_MEMBER_ID", "")
    member_pass = os.environ.get("INKAI_MEMBER_PASSWORD", "")
    admin_id = os.environ.get("INKAI_ADMIN_ID", "")
    admin_pass = os.environ.get("INKAI_ADMIN_PASSWORD", "")

    route_cache: dict[str, Image.Image] = {}
    count = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            ),
        )
        page = ctx.new_page()

        member_ok = bool(member_id and member_pass and _member_login(page, member_id, member_pass))
        if member_ok:
            print("  member login ok")
        elif member_id:
            print("  member login failed — using public pages only")

        admin_page = ctx.new_page()
        admin_ok = bool(admin_id and admin_pass and _admin_login(admin_page, admin_id, admin_pass))
        if admin_ok:
            print("  admin login ok")
        elif admin_id:
            print("  admin login failed — admin routes may show login screen")

        member_routes = {
            "/dashboard",
            "/absensi",
            "/billing",
            "/events",
            "/achievement",
            "/documents",
            "/guide",
        }
        admin_routes = {r for r in THEME_ROUTES.values() if r.startswith("/admin") and r != "/admin/login"}

        for key in themes:
            out = asset_path(key)
            if out.is_file() and not force:
                continue

            route = THEME_ROUTES.get(key, "/")
            if route not in route_cache:
                if route in admin_routes and admin_ok:
                    route_cache[route] = _capture_route(admin_page, route)
                elif route in member_routes and member_ok:
                    route_cache[route] = _capture_route(page, route)
                else:
                    route_cache[route] = _capture_route(page, route)
                print(f"  capture {route}")

            panel = _cover_resize(route_cache[route], PANEL_SIZE)
            _save_jpeg(panel, out)
            count += 1
            print(f"  ok {key}.jpg <- {route}")

        browser.close()

    return count


if __name__ == "__main__":
    n = capture_all(force="--force" in sys.argv)
    print(f"Captured {n} screenshots -> {SCREENSHOTS_DIR}")
