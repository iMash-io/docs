#!/usr/bin/env python3
"""Shared config for the docs tooling scripts.

Edit these values for your environment, then use the other scripts in this folder.
Everything runs against a LIVE, logged-in iMash app to capture real screenshots.
"""
import os

# ── The running iMash app (server.js) to screenshot ──────────────────────────
# Point this at wherever the app is reachable. During development we expose the
# local `node server.js` (with kfwd-lite for DB/redis) over an ngrok tunnel.
# You can also use https://dashboard.imash.io directly.
APP_BASE = os.environ.get("DOCS_APP_BASE", "https://great-right-crawdad.ngrok-free.app")

# ngrok needs this header to skip its interstitial. Harmless on other hosts.
EXTRA_HEADERS = {"ngrok-skip-browser-warning": "1"}

# ── Login credentials for the screenshot account ─────────────────────────────
# The AUDIT accounts (audit_access_*@imash.io) exist in the DB for exactly this:
# clean demo data, no real customer PII. Password is shared across all of them.
# See APP/Audit/Scripts/01_create_test_accounts.sql.
#   • Admin/main view (full nav, demo data):  audit_access_t1_main@imash.io
#   • Simple human-agent view (pinned dialer): audit_access_t1_sub_g_a@imash.io
ADMIN_EMAIL = "audit_access_t1_main@imash.io"
AGENT_EMAIL = "audit_access_t1_sub_g_a@imash.io"
AUDIT_PASSWORD = "audit_access_test_password_do_not_use"

# Saved Playwright storage-state (cookies/session) written by login.py
ADMIN_AUTH = "/tmp/imash_admin_auth.json"
AGENT_AUTH = "/tmp/imash_agent_auth.json"

# ── Paths ────────────────────────────────────────────────────────────────────
DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMAGES_DIR = os.path.join(DOCS_DIR, "images")
FILES_DIR = os.path.join(DOCS_DIR, "files")          # EN content JSON
ES_FILES_DIR = os.path.join(FILES_DIR, "es")          # Spanish content JSON

# ── Screenshot defaults ──────────────────────────────────────────────────────
VIEWPORT = {"width": 1440, "height": 900}
THEMES = ("light", "dark")   # docs support both; capture both by default

# JS snippet that blurs any email-looking text before a screenshot, so audit
# emails never leak into the docs. Pass to page.evaluate().
# It installs a MutationObserver so the blur SURVIVES re-renders (the header's
# "Owner — <email>" badge re-renders on live-count polling and used to wipe a
# one-shot blur between evaluate() and screenshot()).
REDACT_EMAILS_JS = r"""() => {
  const rx = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const blur = () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (w.nextNode()) { if (rx.test(w.currentNode.nodeValue)) hits.push(w.currentNode); }
    hits.forEach(n => { if (n.parentElement) n.parentElement.style.filter = 'blur(6px)'; });
  };
  blur();
  if (!window.__redactObserver) {
    window.__redactObserver = new MutationObserver(() => blur());
    window.__redactObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}"""
