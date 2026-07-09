# iMash Docs — Tooling & Contributor Guide

Everything you need to **grow and improve the docs**: how the site works, how to
add/edit guides, how to capture the real app screenshots (zoomed, both themes,
emails blurred), how to translate to Spanish, how to white-label for a reseller
domain, and how to preview/QA before shipping.

> These scripts drive a **real, logged-in iMash app** with Playwright to capture
> genuine screenshots, then wire them into JSON content files. No mock-ups.

---

## 1. How the docs work (2-minute mental model)

The docs are a **static single-page app** served by `APP/server.js` on the
`docs.*` subdomains (same `imash-app` pod as the dashboard).

| Thing | Where | What it is |
|---|---|---|
| **Content** | `docs/files/<category>/<page>.json` | One JSON per page: title, lede, steps (HTML + screenshots), nextSteps, support, meta. |
| **Spanish** | `docs/files/es/<category>/<page>.json` | 1:1 translated mirror of each EN file. |
| **Screenshots** | `docs/images/<category>/<name>-{light,dark}.png` | Real app screenshots, one pair per theme. |
| **Renderer / router** | `docs/script.js` | Client SPA: routing, `/es` language layer, white-label branding, renders JSON → HTML. |
| **Shell** | `docs/index.html`, `docs/styles.css` | Header, sidebar chrome, theme. |
| **Server side** | `APP/server.js` (`getDocsPageWithMeta`, `getDocsBrand`, `applyDocsBrand`) | SSR meta + pre-rendered first paint, `/es` handling, per-host white-label. |

A page is reachable at `/<category>/<page>` because it's mapped in **three**
places that must stay in sync when you add a page:
1. `contentMap` in `docs/script.js` (client route → JSON file)
2. `pathMapping` in `APP/server.js` (SSR route → JSON file)
3. the sidebar `<li>` list in `docs/script.js` (`updateSidebarForTab`)

---

## 2. Prerequisites

```bash
pip install playwright pillow
playwright install chromium         # once
```

You need a **running app to screenshot**. In dev we run `node server.js` with
`kfwd-lite` (DB/redis port-forwards) and expose it via an ngrok tunnel, then set
that URL in `config.py`. You can also point `config.py` at
`https://dashboard.imash.io`.

**Login accounts** — use the audit accounts (clean demo data, no real PII;
created by `APP/Audit/Scripts/01_create_test_accounts.sql`):
- `audit_access_t1_main@imash.io` — admin/main view (full nav + demo data)
- `audit_access_t1_sub_g_a@imash.io` — a plain human-agent view (pinned dialer)
- password: `audit_access_test_password_do_not_use`

All of this lives in **`config.py`** — edit it first.

---

## 3. The scripts

| Script | Purpose |
|---|---|
| `config.py` | Shared config: app URL, audit creds, paths, redaction snippet. **Edit first.** |
| `login.py` | Log in once, save the Playwright session (`admin` + `agent`). Run at the start of a session (JWT ~1h). |
| `shoot.py` | Capture **one** screen into `images/` — both themes, optional clicks, optional `--clip` to zoom into an element. The everyday tool. |
| `capture_batch.py` | Capture a whole `TARGETS` list in one run. Edit `TARGETS` to add screens. |
| `bake_whitelabel.py` | Paint a brand logo over the iMash logo in full-app screenshots → `*.sophia.png` variants. |
| `preview_server.py` | Serve the docs locally (SPA routing) to eyeball changes. |
| `qa.py` | Validate: JSON parses, images exist, ES mirrors EN. Run before every commit. |

---

## 4. Common workflows

### A) Add or edit a guide page

1. Create/edit `docs/files/<category>/<page>.json`. Schema:
   ```json
   {
     "title": "…", "lede": "…", "timeToComplete": "5 minutes",
     "videoUrl": "https://youtu.be/…",            // optional; omit if none
     "steps": [
       { "id": "kebab-id", "title": "Step heading",
         "content": "<ol><li>Do <strong>this</strong>.</li></ol>",
         "images": [
           {"src":"images/<cat>/<name>-light.png","alt":"…","caption":"…","theme":"light"},
           {"src":"images/<cat>/<name>-dark.png","alt":"…","caption":"…","theme":"dark"}
         ] }
     ],
     "nextSteps": { "title":"What's Next?", "description":"…",
       "cards":[{"href":"/<cat>/<other>","title":"…","description":"…"}] },
     "support": { "title":"Need Help?", "content":"<p>…support@imash.io…</p>" },
     "metaTitle":"…", "metaDescription":"…", "metaKeywords":"…"
   }
   ```
   Rules: every screenshot needs a **light AND dark** entry; `src` is
   `images/…` (no leading slash); keep steps short and dummy-proof.
2. **New page?** also add it to `contentMap` (script.js), `pathMapping`
   (server.js), and the sidebar list (script.js). Give it a sidebar icon in
   `NAV_ICON_FOR` (script.js).
3. Translate it (workflow C) and run `qa.py`.

### B) Capture / refresh a screenshot

```bash
python login.py                       # once per session
# a full screen:
python shoot.py --route /crm/leads --out crm/leads
# ZOOM into one element (looks like a focused guide, not a page dump):
python shoot.py --auth agent --route /callcenter/contact-center \
  --out contact-center/agent-dialer --wait 5000 \
  --clip "SELECTOR-OR-JS-FOR-THE-ELEMENT"
# open a tab/modal first:
python shoot.py --route "/assistants?assistantId=<ID>" --out agents/voice-config \
  --click "text=Voice (TTS)" --wait 2500 --clip ".ant-modal-content"
```
- Emails are **blurred automatically** (audit data). Pass `--no-redact` to keep them.
- `--clip` accepts a Playwright selector **or** a `(()=>{…})()` JS expression
  returning the element; the shot is cropped to it (that's the "zoom in").
- After capture, wire the image into the page JSON (workflow A) and re-QA.

Tips learned the hard way:
- **Zoom for small controls** (dialer, popovers, a lifecycle bar). A full-page
  shot of a tiny control reads badly.
- The app dialer opens via the top-right phone icon; some agent views pin it
  open. Assistant editor is `/assistants?assistantId=<id>`; its feature panels
  open by clicking their row label.
- Live call states (incoming call, in-call transfer/conference, post-call
  disposition) need a **real connected call** and can't be reliably automated
  headless — capture those manually.

### C) Translate a page to Spanish

Mirror the EN file into `docs/files/es/<category>/<page>.json`. Translate all
human text; keep **identical** structure — same keys, step `id`s, `href`s,
`videoUrl`, image `src`, `theme`. Keep English UI button names with a short
Spanish gloss on first mention, e.g. `<strong>Save</strong> (Guardar)`. Keep
lowercase URLs/emails as-is. Then `python qa.py` (it checks the mirror).

### D) White-label a docs domain (e.g. docs.soph-ia.ai)

1. **Brand config** — add/adjust the host in `getDocsBrand()` in `APP/server.js`
   (`name`, `logo`, `hideSocials`, `textReplace`, `swapImages`, `hideVideos`,
   `supportEmail`). Text replace is **case-sensitive** so it only swaps the
   display brand ("iMash"/"iMash.io"), never lowercase `imash.io` in URLs.
2. **Header logo** — self-host the brand's full logo at
   `docs/images/brand/<brand>-full.png`. For Soph-ia it's the affiliate's
   `logo.png` (icon) + `name_image.png` (wordmark) composited side by side.
3. **Screenshot logos** — run `python bake_whitelabel.py` to paint the brand
   logo over the iMash logo in the full-app screenshots (`*.sophia.png`). The
   client swaps to these on that host and falls back to the original elsewhere.
4. The brand is passed to the client via a **`<script type="application/json">`
   block** (the docs CSP blocks inline executable `<script>`, so a plain
   `window.x =` would be blocked — don't use one).

### E) Preview, QA, deploy

```bash
python preview_server.py       # http://127.0.0.1:8898  — click around
python qa.py                   # must pass (JSON valid, images exist, ES mirrors)
git add -A && git commit -m "…" && git push     # docs is its own submodule (iMash-io/docs)
```
**Going live:** the docs are baked into the `iadsmedia/imash-app` image, so
`docs.imash.io` / `docs.soph-ia.ai` only update after **imash-app is rebuilt
with the bumped submodule pointer** (and any `server.js` changes) and rolled out.

---

## 5. Gotchas baked into the current code (don't regress these)

- **CSP blocks inline scripts.** Pass client data via `<script type="application/json">`
  data blocks, never inline `window.x = …`.
- **First paint uses SSR content.** `showPage` matches server-rendered
  `#dynamic-content` by `[data-route]` directly, so any client post-processing
  (brand image swap, text) must run in that path too — not only the
  dynamic-load path.
- **Image sizing.** Content images use `max-width: min(90%, 1200px)` with **no**
  forced width, so small zoomed shots aren't upscaled. SSR images need an
  absolute `/images/…` src or they 404 on a deep-link/refresh.
- **Both themes.** Every screenshot is captured light + dark; the renderer hides
  the off-theme one. Keep pairs in sync.
- **Videos** come from `videoUrl` (YouTube). The CSP must allow
  `frame-src youtube.com` and `img-src img.youtube.com` (for thumbnails).
- **Root & videos redirects.** `/` → `/get-started/quick-start`; white-label
  brands with `hideVideos` redirect `/videos` away.
