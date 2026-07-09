#!/usr/bin/env python3
"""Bake white-label logo variants of the screenshots.

For a white-label docs domain (e.g. docs.soph-ia.ai) we don't recapture the app
under that brand — instead we paint the brand's logo OVER the iMash app-logo in
each full-app screenshot, producing a `<name>.sophia.png` next to the original.
The docs client (script.js `applyBrandImages`) swaps `<name>.png` -> the variant
on that domain, and falls back to the original where no variant exists.

How it works per screenshot:
  1. Only allow-listed "full sidebar" screenshots are touched (they show the app
     logo top-left). The list is ALLOW below.
  2. A cheap pixel check confirms the iMash logo is actually there (skips any
     allow-listed page that happens not to show it).
  3. The logo region is filled with the sidebar background (sampled per theme so
     light/dark both look native), then the brand logo is pasted in.

Prereqs: the brand's full logo PNG (icon + wordmark) — for Soph-ia this is
docs/images/brand/sophia-full.png, composited from the affiliate's logo.png +
name_image.png (see README "White-label a docs domain").

Usage:  python bake_whitelabel.py            # (re)bake all variants
        python bake_whitelabel.py --clean     # delete all *.sophia.png first
"""
import glob, os, re, sys
from PIL import Image, ImageDraw
import config as C

SUFFIX = "sophia"                                   # -> foo-light.sophia.png
BRAND_LOGO = os.path.join(C.IMAGES_DIR, "brand", "sophia-full.png")
LOGO_H = 38                                         # painted logo height (px)
DETECT = (14, 14, 188, 46)                          # where the iMash logo strokes live
FILL = (6, 4, 236, 60)                              # region painted over

# Only pages that show the app's LEFT SIDEBAR (iMash logo top-left). Editor
# screens (assistant editor, zoomed dialer/lead crops, modals) are NOT here —
# they don't show the app logo, so they keep the original.
# Some screenshots have a LOGIN-PAGE logo (not the sidebar) that we simply CROP
# OUT rather than paint over — the variant shows just the login card. Value is
# the (left, top, right, bottom) crop box.
CROPS = {
    "contact-center/agent-login": (446, 212, 992, 792),   # login card only; drop the logo above it
}

ALLOW = re.compile(
    r"/(get-started/(dashboard-overview-main|api-keys)|"
    r"phone/(phone-numbers|sip-providers|call-logs|add-phone-number)|"
    r"campaigns/(campaigns-list|campaign-reports|campaign-stats|do-not-call|campaign-detail|new-campaign)|"
    r"crm/(contacts|leads|accounts|import-people|import-export)|"
    r"automations/(automation-overview|custom-tools|automation-builder)|analytics/(billing|overview-stats)|"
    r"settings/(user-management|audit)|agents/assistants-list|"
    r"contact-center/(cc-live-monitor|cc-reporting|cc-groups-overview|cc-group-[a-z-]+|cc-call-transfer|agent-home|agent-contact-center|"
    r"agent-lead-detail|agent-lead-stage|agent-lifecycle|agent-lead-additional|agent-lead-calllogs)|"
    r"dashboard-overview)-(light|dark)\.png$")


def has_logo(im):
    bg = im.getpixel((232, 30))
    px = im.load(); d = 0
    for x in range(DETECT[0], DETECT[2], 2):
        for y in range(DETECT[1], DETECT[3], 2):
            p = px[x, y]
            if abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2]) > 60:
                d += 1
    return d > 120


def main(clean=False):
    for f in glob.glob(f"{C.IMAGES_DIR}/**/*.{SUFFIX}.png", recursive=True):
        os.remove(f)
    if clean:
        print("cleaned all *.%s.png" % SUFFIX); return
    logo = Image.open(BRAND_LOGO).convert("RGBA")
    lw = int(logo.size[0] * LOGO_H / logo.size[1])
    logo = logo.resize((lw, LOGO_H), Image.LANCZOS)
    n = 0
    for p in glob.glob(f"{C.IMAGES_DIR}/**/*.png", recursive=True):
        if p.endswith(f".{SUFFIX}.png") or not ALLOW.search(p):
            continue
        im = Image.open(p).convert("RGB")
        if not has_logo(im):
            continue
        bg = im.getpixel((232, 30))
        d = ImageDraw.Draw(im); d.rectangle(FILL, fill=bg)
        iy = FILL[1] + (FILL[3] - FILL[1] - LOGO_H) // 2
        im.paste(logo, (14, iy), logo)
        im.save(p[:-4] + f".{SUFFIX}.png"); n += 1

    # Crop-based variants (login card, etc.)
    c = 0
    for rel, box in CROPS.items():
        for theme in ("light", "dark"):
            src = os.path.join(C.IMAGES_DIR, f"{rel}-{theme}.png")
            if os.path.exists(src):
                Image.open(src).convert("RGB").crop(box).save(src[:-4] + f".{SUFFIX}.png"); c += 1
    print(f"baked {n} logo + {c} crop '{SUFFIX}' variants")


if __name__ == "__main__":
    main(clean="--clean" in sys.argv)
