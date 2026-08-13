#!/usr/bin/env python3
"""Normalize canonical-home internal links and refresh changed-page sitemap dates.

This is intentionally narrow: it does not change page content, canonicals, robots
policy, or redirect stubs. It only removes internal links to the duplicate
/index.html homepage alias, updates lastmod for pages whose HTML changed, and
regenerates sitemap.xml from the canonical content manifest.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/content-manifest.json"
CHANGE_DATE = "2026-08-13"

HOME_LINK_PATTERNS = (
    (re.compile(r'href="/index\.html"'), 'href="/"'),
    (re.compile(r"href='/index\.html'"), "href='/'"),
    (re.compile(r'href="index\.html"'), 'href="/"'),
    (re.compile(r"href='index\.html'"), "href='/'"),
)


def normalize_html(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    for pattern, replacement in HOME_LINK_PATTERNS:
        updated = pattern.sub(replacement, updated)
    if updated == original:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def render_sitemap(manifest: dict) -> str:
    site = str(manifest["site"]).rstrip("/")
    rows: list[str] = []
    for page in manifest.get("pages", []):
        if not page.get("indexable", False):
            continue
        rows.append(
            f"  <url><loc>{site + page['path']}</loc><lastmod>{page['lastmod']}</lastmod></url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    changed_files: set[str] = set()

    for page in manifest.get("pages", []):
        rel = page.get("file")
        if not rel:
            continue
        path = ROOT / rel
        if path.suffix.lower() != ".html" or not path.is_file():
            continue
        if normalize_html(path):
            changed_files.add(rel)
            if page.get("indexable", False):
                page["lastmod"] = CHANGE_DATE

    if changed_files:
        manifest["updated"] = CHANGE_DATE
        MANIFEST_PATH.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        (ROOT / "sitemap.xml").write_text(render_sitemap(manifest), encoding="utf-8")

    print(f"Normalized duplicate-home links in {len(changed_files)} HTML files.")
    for rel in sorted(changed_files):
        print(f"- {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
