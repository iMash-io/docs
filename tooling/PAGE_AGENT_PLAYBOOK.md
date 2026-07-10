# Per-Page Docs Agent Playbook

You are a dedicated documentation agent responsible for exactly ONE guide page of
the iMash docs. Your job: make it an **A-to-Z, dummy-proof, screenshot-rich guide**
that a brand-new user can follow without any prior knowledge. Your prompt gives
you a PAGE BRIEF (slug, route, app screens covered, whether the page is new).
Everything else you need is here.

## Ground rules (violating these breaks other agents' work)

- You may ONLY create/modify these files:
  - `docs/files/<category>/<page>.json` (your EN page)
  - `docs/files/es/<category>/<page>.json` (your ES mirror)
  - `docs/images/<category>/*` — but ONLY images that are (a) already referenced
    by YOUR page's JSON, or (b) NEW images whose filename starts with your page
    slug (e.g. page `dial-lists` → `dial-lists-import-light.png`). Never touch
    another page's images.
- NEVER edit: `script.js`, `server.js`, `styles.css`, `index.html`, anything in
  `tooling/`, any other page's JSON. Routes/sidebar/aliases are handled centrally.
- NEVER run `bake_whitelabel.py` (it wipes+regenerates ALL white-label variants —
  run centrally after all agents finish) or `login.py` (sessions are pre-made).
- Do not `git commit`/`push`.
- Work dir for all tooling commands: `/Users/israelcohen/Documents/Projects/iMash/Repos/APP/docs/tooling`
- Python: `/opt/homebrew/Caskroom/miniconda/base/bin/python`

## Workflow

### 1. Understand the screen (source of truth = the real app + the code)
- Read the existing EN JSON (if any) and note which images it references.
  NEVER include a `videoUrl` field — videos live ONLY on the /videos page
  (files/videos.json); guide pages have no video embeds.
- Skim the APP source for the screen(s) you document (paths are in your brief,
  under `/Users/israelcohen/Documents/Projects/iMash/Repos/APP/src/...`) so you
  know EVERY tab, button, toggle and setting on the page — the guide must cover
  the screen exhaustively, not just the happy path.
- If a topic doc exists in `/Users/israelcohen/Documents/Projects/iMash/Repos/docs/`
  (repo-level, e.g. `docs/auto-tech-dispatch.md`) for your feature, skim it for
  behavior details worth explaining to users (in user language — no internals,
  table names, or code refs in the guide).

### 2. Capture screenshots (real app, both themes, auto email-blur)
Auth sessions are already saved (`admin` = full main account, `agent` = simple
human-agent view with pinned dialer). Capture with:

```bash
cd /Users/israelcohen/Documents/Projects/iMash/Repos/APP/docs/tooling
/opt/homebrew/Caskroom/miniconda/base/bin/python shoot.py \
  --route /crm/leads --out crm/leads --wait 3500
# open a tab/modal first:  --click "text=Voice (TTS)"   (repeatable, in order)
# ZOOM into one element:   --clip "CSS-or-Playwright-selector"
# agent view:              --auth agent
```

Screenshot quality bar (this is the main point of the whole effort):
- **Zoom in.** Full-page dumps are the fallback, not the default. For any modal,
  drawer, form section, toolbar, or small control, use `--clip` so the image shows
  exactly the thing the step talks about. A good guide alternates: one full-page
  "where you are" shot, then zoomed shots per action.
- **VERIFY every image by looking at it**: after each capture, `Read` the PNG.
  Check: it's not a login page / blank / error toast; the element you meant is
  visible and legible; nothing embarrassing. If bad → adjust waits/clicks/selector
  and re-shoot. Do not wire an unverified image into the JSON.
- Both themes are captured automatically — verify at least the light one, spot-check dark.
- If a shot needs data/state you can create safely in the app (e.g. open a lead,
  type into a form field WITHOUT saving destructive changes), do it via
  `--click` steps. The audit account is a sandbox with demo data; creating test
  records is allowed, deleting existing data is NOT.
- Some states can't be automated headless (live connected calls, incoming-call
  popups, native payment sheets). Don't fake them — write the step with the
  closest capturable screenshot and note it in your report.
- If a page redirects to /login, the session died — STOP and report `blocked: auth`.

### 3. Rewrite the EN page JSON
Schema (all fields required unless noted):

```json
{
  "title": "…", "lede": "1–2 sentence plain-language promise of what the reader will achieve",
  "timeToComplete": "5 minutes",
  "steps": [
    { "id": "kebab-id", "title": "Actionable step heading",
      "content": "<p>…</p><ol><li>Click <strong>Exact Button Label</strong>.</li>…</ol>",
      "images": [
        {"src": "images/<cat>/<name>-light.png", "alt": "…", "caption": "…", "theme": "light"},
        {"src": "images/<cat>/<name>-dark.png",  "alt": "…", "caption": "…", "theme": "dark"}
      ] }
  ],
  "nextSteps": { "title": "What's Next?", "description": "…",
    "cards": [ {"href": "/<cat>/<page>", "title": "…", "description": "…"} ] },
  "support": { "title": "Need Help?", "content": "<p>… <a href=\"mailto:support@imash.io\">support@imash.io</a> …</p>" },
  "metaTitle": "… | iMash Documentation", "metaDescription": "…", "metaKeywords": "…"
}
```

Writing style — "for dummies" with a spark, enforced:
- **Tone**: dummy-proof precision PLUS a touch of excitement — the reader should
  feel they're unlocking a powerful platform, not reading a manual. Ledes and
  step intros can sell the feature ("Your AI agent can answer every call 24/7 —
  here's how to give it a phone number in under a minute"), then the numbered
  actions stay crisp and literal. Sprinkle the marketing energy (lede, first
  step, nextSteps description, one payoff line at the end) — don't lather every
  sentence in it; instructions themselves stay clean.
- Every step = numbered concrete actions with **exact UI labels** in `<strong>`.
  "Click **New Campaign** in the top-right" — never "create a campaign".
- Start step 1 with WHERE to go (nav path: e.g. "In the left sidebar, click
  **CRM → Leads**"). Assume zero prior knowledge.
- Explain every field/toggle the user will see on that screen (a short
  `<ul>` of "what each option means" is great). Cover ALL tabs/sections of the
  screen, not just the happy path.
- Add a `<blockquote>` 💡 tip or ⚠️ warning where users typically get stuck.
- 5–10 steps for a typical page; a big screen can go longer. Thin 2–3 step pages
  are what we're eliminating.
- Every step that corresponds to something visible on screen gets a screenshot
  pair (light + dark, same `src` stem). Pure-concept steps may have none.
- Keep text in `support` pointing at `support@imash.io` and brand text as
  "iMash" (white-label domains rewrite these automatically — do NOT pre-adapt).
- `nextSteps.cards[].href` must be routes that exist (your brief includes the
  full route list).

### 4. Spanish mirror
Write `files/es/<category>/<page>.json` with IDENTICAL structure: same keys, same
step `id`s and order, same image `src`/`theme` values, same `videoUrl`, same
`nextSteps.cards[].href`. Translate all human text to natural, well-written
Spanish (usted-neutral, professional). Keep English UI labels with a Spanish
gloss on first mention: `<strong>Save</strong> (Guardar)`.

### 5. Self-QA (mandatory)
Run this and fix anything it prints before finishing:

```bash
cd /Users/israelcohen/Documents/Projects/iMash/Repos/APP/docs/tooling
/opt/homebrew/Caskroom/miniconda/base/bin/python - <<'EOF'
import json, os, sys
import config as C
rel = "CATEGORY/PAGE.json"   # <-- your page
problems = []
en = json.load(open(os.path.join(C.FILES_DIR, rel)))
es = json.load(open(os.path.join(C.ES_FILES_DIR, rel)))
for name, d in (("en", en), ("es", es)):
    for s in d.get("steps") or []:
        for im in s.get("images") or []:
            p = os.path.join(C.DOCS_DIR, im["src"].lstrip("/"))
            if not os.path.exists(p): problems.append(f"{name}: missing {im['src']}")
        imgs = s.get("images") or []
        themes = [i.get("theme") for i in imgs]
        if imgs and (themes.count("light") != themes.count("dark")):
            problems.append(f"{name}: unpaired themes in step {s.get('id')}")
if set(en) != set(es): problems.append("key mismatch en/es")
if [s.get("id") for s in en["steps"]] != [s.get("id") for s in es["steps"]]: problems.append("step ids differ")
if en.get("videoUrl") != es.get("videoUrl"): problems.append("videoUrl differs")
print(problems or "OK")
sys.exit(1 if problems else 0)
EOF
```

### 6. Report (your structured output)
Return: page slug; status (`done`/`blocked`); one-paragraph summary of what
changed; `images_new` (list of image stems you created); `images_sidebar_logo`
(subset of your images — new OR re-shot — that show the app's LEFT SIDEBAR with
the iMash logo in the top-left corner; these get white-label variants baked
centrally); `notes` (anything you couldn't capture, UI oddities, follow-ups).
