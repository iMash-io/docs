#!/usr/bin/env python3
"""Log into the iMash app and save the Playwright session (storage state).

Run this ONCE per session (the JWT lasts ~1h). All the capture scripts reuse the
saved state so they don't each have to log in.

Usage:
    python login.py            # logs in BOTH admin + agent accounts
    python login.py admin      # just the admin (t1_main) account
    python login.py agent      # just the agent (t1_sub_g_a) account
"""
import sys
from playwright.sync_api import sync_playwright
import config as C


def login(email, password, out_path):
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport=C.VIEWPORT, extra_http_headers=C.EXTRA_HEADERS)
        pg = ctx.new_page()
        pg.goto(C.APP_BASE + "/login", wait_until="domcontentloaded", timeout=60000)
        pg.wait_for_timeout(1500)
        pg.fill("#email", email, timeout=8000)
        pg.fill("#password", password, timeout=8000)
        pg.click("button[type=submit]", timeout=8000)
        pg.wait_for_timeout(9000)  # let the SPA settle + tokens land
        if "/login" in pg.url:
            raise SystemExit(f"LOGIN FAILED for {email} (still on /login)")
        ctx.storage_state(path=out_path)
        print(f"OK  {email}  ->  {out_path}  (landed on {pg.url})")
        b.close()


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    if which in ("admin", "both"):
        login(C.ADMIN_EMAIL, C.AUDIT_PASSWORD, C.ADMIN_AUTH)
    if which in ("agent", "both"):
        login(C.AGENT_EMAIL, C.AUDIT_PASSWORD, C.AGENT_AUTH)
