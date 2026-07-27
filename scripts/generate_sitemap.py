#!/usr/bin/env python3
"""Generate sitemap.xml from the canonical content manifest."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/content-manifest.json"
FALLBACK_DATE = "2026-07-27"


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def render() -> str:
    manifest = load_manifest()
    site = manifest["site"].rstrip("/")
    rows: list[str] = []
    for page in manifest.get("pages", []):
        if not page.get("indexable", False):
            continue
        file_path = page["file"]
        if not (ROOT / file_path).exists():
            raise FileNotFoundError(f"Approved sitemap page is missing: {file_path}")
        url_path = page["path"]
        lastmod = page.get("lastmod") or manifest.get("updated") or FALLBACK_DATE
        rows.append(
            f"  <url><loc>{escape(site + url_path)}</loc><lastmod>{lastmod}</lastmod></url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows)
        + "\n</urlset>\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    target = ROOT / "sitemap.xml"
    if args.check:
        actual = target.read_text(encoding="utf-8") if target.exists() else ""
        if actual != expected:
            print("sitemap.xml is not synchronized; run python scripts/generate_sitemap.py")
            return 1
        print("sitemap.xml is synchronized.")
        return 0
    target.write_text(expected, encoding="utf-8")
    print("sitemap.xml generated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
