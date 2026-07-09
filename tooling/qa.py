#!/usr/bin/env python3
"""Validate the docs content before committing.

Checks:
  1. Every files/**/*.json parses as valid JSON.
  2. Every referenced image (steps[].images[].src) exists on disk.
  3. Every ES file (files/es/**) structurally mirrors its EN counterpart:
     same top-level keys, same step ids/order, same image srcs, same videoUrl,
     same nextSteps hrefs. (Text differs; structure must not.)

Usage:  python qa.py           # exits non-zero if anything fails
"""
import json, glob, os, sys
import config as C


def load(path):
    try:
        return json.load(open(path)), None
    except Exception as e:
        return None, str(e)


def main():
    en_files = [f for f in glob.glob(f"{C.FILES_DIR}/**/*.json", recursive=True) if "/es/" not in f]
    problems = []

    # 1 + 2: valid JSON + images exist
    for f in sorted(en_files + glob.glob(f"{C.ES_FILES_DIR}/**/*.json", recursive=True)):
        d, err = load(f)
        rel = os.path.relpath(f, C.DOCS_DIR)
        if err:
            problems.append(f"BAD JSON  {rel}: {err}"); continue
        for s in d.get("steps") or []:
            for im in s.get("images") or []:
                src = (im.get("src") or "").lstrip("/")
                if src and not os.path.exists(os.path.join(C.DOCS_DIR, src)):
                    problems.append(f"MISSING IMG  {rel}: {src}")

    # 3: ES mirrors EN
    for en in sorted(en_files):
        rel = os.path.relpath(en, C.FILES_DIR)
        es = os.path.join(C.ES_FILES_DIR, rel)
        if not os.path.exists(es):
            problems.append(f"MISSING ES  {rel}"); continue
        e, _ = load(en); s, _ = load(es)
        if not e or not s:
            continue
        if set(e.keys()) != set(s.keys()):
            problems.append(f"KEY MISMATCH  es/{rel}")
        if e.get("videoUrl") != s.get("videoUrl"):
            problems.append(f"videoUrl DIFFERS  es/{rel}")
        es_steps, en_steps = s.get("steps") or [], e.get("steps") or []
        if len(es_steps) != len(en_steps):
            problems.append(f"STEP COUNT  es/{rel} ({len(en_steps)} vs {len(es_steps)})"); continue
        for i, (a, b) in enumerate(zip(en_steps, es_steps)):
            if a.get("id") != b.get("id"):
                problems.append(f"STEP ID  es/{rel} #{i}")
            if [x.get("src") for x in a.get("images") or []] != [x.get("src") for x in b.get("images") or []]:
                problems.append(f"IMG SRC  es/{rel} #{i}")
        eh = [c.get("href") for c in (e.get("nextSteps") or {}).get("cards") or []]
        sh = [c.get("href") for c in (s.get("nextSteps") or {}).get("cards") or []]
        if eh != sh:
            problems.append(f"nextSteps hrefs  es/{rel}")

    print(f"EN files: {len(en_files)}  |  problems: {len(problems)}")
    for p in problems:
        print("  -", p)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
