#!/usr/bin/env python3
"""Generate sitemap.xml from the approved canonical public page set."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.theblacksmithmarket.com"
PAGES = [
    ("/", "index.html"),
    ("/about.html", "about.html"),
    ("/products.html", "products.html"),
    ("/partnership.html", "partnership.html"),
    ("/contact.html", "contact.html"),
    ("/faq.html", "faq.html"),
    ("/blog.html", "blog.html"),
    ("/blog/search-ai-discovery-checklist.html", "blog/search-ai-discovery-checklist.html"),
    ("/editorial-policy.html", "editorial-policy.html"),
    ("/research-methodology.html", "research-methodology.html"),
    ("/ai-content-policy.html", "ai-content-policy.html"),
    ("/privacy-policy.html", "privacy-policy.html"),
    ("/terms.html", "terms.html"),
]


def last_modified(path: str) -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", path],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    value = result.stdout.strip()
    return value or "2026-07-27"


def render() -> str:
    rows = []
    for url_path, file_path in PAGES:
        if not (ROOT / file_path).exists():
            raise FileNotFoundError(f"Approved sitemap page is missing: {file_path}")
        rows.append(
            f"  <url><loc>{escape(SITE + url_path)}</loc><lastmod>{last_modified(file_path)}</lastmod></url>"
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
