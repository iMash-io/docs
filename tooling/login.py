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


def login(email, password, out_path, attempts=3):
    with sync_playwright() as p:
        b = p.chromium.launch()
        for attempt in range(1, attempts + 1):
            ctx = b.new_context(viewport=C.VIEWPORT, extra_http_headers=C.EXTRA_HEADERS)
            pg = ctx.new_page()
            # FOOTGUN: on mount the login page fires /api/impersonate/session ->
            # /api/impersonate/stop, and that cleanup ends with a GLOBAL signOut.
            # If those API calls are slow (local dev ~5s each), the signOut lands
            # AFTER our fresh login and silently kills the new session. Track the
            # impersonate traffic and only submit once it has settled.
            import time
            last_imp = {"t": time.time()}
            def _mark(r):
                if "/api/impersonate" in r.url or "auth/v1/logout" in r.url:
                    last_imp["t"] = time.time()
            pg.on("request", _mark)
            pg.on("response", _mark)
            pg.goto(C.APP_BASE + "/login", wait_until="domcontentloaded", timeout=60000)
            loaded = time.time()
            deadline = time.time() + 30
            # BOTH: a hard minimum settle (slow local API can take >10s to finish
            # the cleanup chain) AND 4s of impersonate/logout network silence.
            while time.time() < deadline and (
                time.time() - loaded < 15 or time.time() - last_imp["t"] < 4
            ):
                pg.wait_for_timeout(300)
            pg.wait_for_timeout(800)
            pg.fill("#email", email, timeout=8000)
            pg.fill("#password", password, timeout=8000)
            pg.click("button[type=submit]", timeout=8000)
            pg.wait_for_timeout(9000)  # let the SPA settle + tokens land
            if "/login" not in pg.url:
                ctx.storage_state(path=out_path)
                print(f"OK  {email}  ->  {out_path}  (landed on {pg.url})")
                b.close()
                return
            ctx.close()
            print(f"attempt {attempt}/{attempts} still on /login for {email}; retrying")
        b.close()
        raise SystemExit(f"LOGIN FAILED for {email} (still on /login after {attempts} attempts)")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    if which in ("admin", "both"):
        login(C.ADMIN_EMAIL, C.AUDIT_PASSWORD, C.ADMIN_AUTH)
    if which in ("agent", "both"):
        login(C.AGENT_EMAIL, C.AUDIT_PASSWORD, C.AGENT_AUTH)
