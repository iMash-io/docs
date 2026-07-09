#!/usr/bin/env python3
"""Batch-capture a whole set of app screens in one run (both themes, emails
blurred). Edit the TARGETS list to add/replace screens. This is how the bulk of
the docs screenshots were produced.

Each target: (out_path, route, auth, [actions])
  out_path : images/ path WITHOUT theme suffix / .png  (e.g. "crm/leads")
  route    : app path (e.g. "/crm/leads")
  auth     : "admin" or "agent"
  actions  : list of steps run before the shot; each is one of
             ("wait", ms) | ("click", selector) | ("clip", selector)
             A trailing ("clip", sel) crops the shot to that element (zoom).

Usage:  python capture_batch.py            # all targets
        python capture_batch.py crm        # only targets whose out_path starts "crm/"
"""
import sys, os
from playwright.sync_api import sync_playwright
import config as C

TARGETS = [
    # ── Get started ──
    ("get-started/dashboard-overview-main", "/", "admin", [("wait", 2500)]),
    ("get-started/api-keys", "/apikeys", "admin", [("wait", 2000)]),
    # ── CRM ──
    ("crm/contacts", "/crm/contacts", "admin", [("wait", 2500)]),
    ("crm/leads", "/crm/leads", "admin", [("wait", 2500)]),
    ("crm/accounts", "/crm/accounts", "admin", [("wait", 2500)]),
    # ── Phone ──
    ("phone/phone-numbers", "/phonenumbers", "admin", [("wait", 2000)]),
    ("phone/sip-providers", "/phoneproviders", "admin", [("wait", 2000)]),
    ("phone/call-logs", "/logs", "admin", [("wait", 2500)]),
    # ── Campaigns ──
    ("campaigns/campaigns-list", "/campaigns", "admin", [("wait", 2000)]),
    ("campaigns/campaign-reports", "/campaigns/reports", "admin", [("wait", 2000)]),
    ("campaigns/campaign-stats", "/campaigns/stats", "admin", [("wait", 2000)]),
    # ── Automations / Analytics / Settings ──
    ("automations/automation-overview", "/automation", "admin", [("wait", 2500)]),
    ("automations/custom-tools", "/tools", "admin", [("wait", 2000)]),
    ("analytics/billing", "/billing", "admin", [("wait", 2500)]),
    ("settings/user-management", "/user-management", "admin", [("wait", 2000)]),
    ("settings/audit", "/audit", "admin", [("wait", 2000)]),
    # ── Agents (list; the editor tabs are captured with shoot.py --click) ──
    ("agents/assistants-list", "/assistants", "admin", [("wait", 2500)]),
    # ── Contact Center admin (Groups → inner tabs need clicks; see README) ──
    ("contact-center/cc-live-monitor", "/callcenter/contact-center", "admin", [("wait", 4000)]),
    # ── Human-agent view (agent account; dialer is pinned open) ──
    ("contact-center/agent-home", "/callcenter/contact-center", "agent", [("wait", 5000)]),
    ("contact-center/agent-dialer", "/callcenter/contact-center", "agent",
        [("wait", 5000), ("clip", "(()=>{let e=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='5');for(let i=0;i<10&&e;i++){e=e.parentElement;const r=e.getBoundingClientRect();if(r.width>=280&&r.width<=560&&r.height>460)return e;}return null;})()")]),
]


def clip_box(pg, js):
    box = pg.evaluate("(js)=>{const el=eval(js);if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}", js)
    if not box:
        return None
    pad = 14
    return {"x": max(0, box["x"] - pad), "y": max(0, box["y"] - pad),
            "width": box["w"] + pad * 2, "height": box["h"] + pad * 2}


def run(prefix=None):
    with sync_playwright() as p:
        b = p.chromium.launch()
        for theme in C.THEMES:
            for auth_kind in ("admin", "agent"):
                auth = C.AGENT_AUTH if auth_kind == "agent" else C.ADMIN_AUTH
                if not os.path.exists(auth):
                    continue
                ctx = b.new_context(storage_state=auth, viewport={"width": 1500, "height": 950},
                                    extra_http_headers=C.EXTRA_HEADERS, color_scheme=theme)
                ctx.add_init_script(f"localStorage.setItem('theme','{theme}')")
                pg = ctx.new_page()
                for out, route, tauth, actions in TARGETS:
                    if tauth != auth_kind:
                        continue
                    if prefix and not out.startswith(prefix):
                        continue
                    try:
                        pg.goto(C.APP_BASE + route, wait_until="domcontentloaded", timeout=45000)
                        clip = None
                        for act in actions:
                            if act[0] == "wait":
                                pg.wait_for_timeout(act[1])
                            elif act[0] == "click":
                                try:
                                    pg.click(act[1], timeout=6000); pg.wait_for_timeout(1200)
                                except Exception:
                                    pass
                            elif act[0] == "clip":
                                clip = clip_box(pg, act[1])
                        pg.wait_for_timeout(400)
                        pg.evaluate(C.REDACT_EMAILS_JS)
                        path = os.path.join(C.IMAGES_DIR, f"{out}-{theme}.png")
                        os.makedirs(os.path.dirname(path), exist_ok=True)
                        if clip:
                            pg.screenshot(path=path, clip=clip)
                        else:
                            pg.screenshot(path=path)
                        print("OK", theme, out)
                    except Exception as e:
                        print("ERR", theme, out, str(e)[:80])
                ctx.close()
        b.close()


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else None)
