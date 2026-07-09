#!/usr/bin/env python3
"""Capture ONE app screenshot into docs/images/ — the everyday workhorse.

Logs in via the saved storage state, navigates to a route, optionally clicks
things, and saves a screenshot for BOTH themes (or one). Can clip to an element
("zoom in") which is what makes a screenshot look like a focused, high-level
guide instead of a whole-page dump.

Examples:
    # a full-page screenshot of the leads list, light + dark, into images/crm/
    python shoot.py --route /crm/leads --out crm/leads

    # zoom into just one element (CSS selector) — e.g. the web dialer panel
    python shoot.py --route /callcenter/contact-center --out contact-center/agent-dialer \
        --auth agent --clip "button:has-text('5') >> xpath=ancestor::div[3]"

    # open a modal/tab first, then shoot
    python shoot.py --route /assistants?assistantId=<ID> --out agents/voice-config \
        --click "text=Voice (TTS)" --wait 2000

    # emails are blurred by default; pass --no-redact to keep them
Notes:
  • --auth admin|agent picks which saved session to use (see config.py).
  • --out is relative to docs/images, WITHOUT the theme suffix or .png.
  • --clip takes a Playwright selector; the shot is cropped to that element.
"""
import argparse, os
from playwright.sync_api import sync_playwright
import config as C


def run(a):
    auth = C.AGENT_AUTH if a.auth == "agent" else C.ADMIN_AUTH
    themes = C.THEMES if a.theme == "both" else (a.theme,)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for theme in themes:
            ctx = b.new_context(storage_state=auth, viewport={"width": a.width, "height": a.height},
                                extra_http_headers=C.EXTRA_HEADERS, color_scheme=theme)
            ctx.add_init_script(f"localStorage.setItem('theme','{theme}')")
            pg = ctx.new_page()
            pg.goto(C.APP_BASE + a.route, wait_until="domcontentloaded", timeout=45000)
            pg.wait_for_timeout(a.wait)
            for sel in a.click or []:
                try:
                    pg.click(sel, timeout=6000); pg.wait_for_timeout(1200)
                except Exception as e:
                    print("  click miss:", sel, str(e)[:60])
            pg.wait_for_timeout(400)
            if not a.no_redact:
                pg.evaluate(C.REDACT_EMAILS_JS)
            out = os.path.join(C.IMAGES_DIR, f"{a.out}-{theme}.png")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            if a.clip:
                el = pg.query_selector(a.clip)
                (el or pg).screenshot(path=out)
            elif a.full:
                pg.screenshot(path=out, full_page=True)
            else:
                pg.screenshot(path=out)
            print("saved", out)
            ctx.close()
        b.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--route", required=True, help="app path, e.g. /crm/leads")
    ap.add_argument("--out", required=True, help="images/ path w/o theme+ext, e.g. crm/leads")
    ap.add_argument("--auth", choices=["admin", "agent"], default="admin")
    ap.add_argument("--theme", choices=["light", "dark", "both"], default="both")
    ap.add_argument("--click", action="append", help="selector to click (repeatable)")
    ap.add_argument("--clip", help="selector to crop the screenshot to (zoom)")
    ap.add_argument("--wait", type=int, default=3000, help="ms to settle after load")
    ap.add_argument("--full", action="store_true", help="full-page screenshot")
    ap.add_argument("--no-redact", action="store_true", help="don't blur emails")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    run(ap.parse_args())
