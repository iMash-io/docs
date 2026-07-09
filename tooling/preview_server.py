#!/usr/bin/env python3
"""Serve the docs locally for previewing edits (SPA-style routing).

The docs are a single-page app: unknown paths must serve index.html so the
client router can handle them, while real files (/images/*, /files/*, /script.js
…) are served as-is and MISSING files 404 (so the /es-fallback logic behaves
like production).

    python preview_server.py           # http://127.0.0.1:8898
    python preview_server.py 9000      # custom port

Then open e.g. http://127.0.0.1:8898/contact-center/agent-guide

Note: this serves the raw static docs. It does NOT run server.js, so the
server-side pieces (SSR meta, white-label logo/text/video, /es SSR) aren't
exercised — those need `node server.js`. For white-label testing, inject the
brand at runtime (see README "Testing white-label locally").
"""
import http.server, socketserver, os, posixpath, urllib.parse, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8898


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = posixpath.normpath(urllib.parse.unquote(urllib.parse.urlparse(path).path))
        fs = os.path.join(ROOT, p.lstrip("/"))
        if os.path.isfile(fs):
            return fs
        # missing asset/data files -> let it 404 (mirror production, never HTML-fallback)
        if p.startswith("/files/") or p.startswith("/images/") or "." in posixpath.basename(p):
            return fs
        # page route -> SPA fallback
        return os.path.join(ROOT, "index.html")

    def log_message(self, *a):
        pass


os.chdir(ROOT)
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"docs preview on http://127.0.0.1:{PORT}  (Ctrl-C to stop)")
    httpd.serve_forever()
