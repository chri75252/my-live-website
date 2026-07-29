#!/usr/bin/env python3
"""Restore the homepage sector filters and adopt the latest logo/favicon package."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FAVICON_BLOCK = '''  <link rel="icon" href="/images/favicon/favicon.ico" sizes="any">
  <link rel="icon" href="/images/favicon/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/images/favicon/favicon-16x16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png">'''

FILTER_BAR = '''<div class="sector-filters" role="group" aria-label="Filter product sectors"><button class="sector-filter is-active" type="button" data-sector-filter="all" aria-pressed="true">All sectors</button><button class="sector-filter" type="button" data-sector-filter="demand" aria-pressed="false">Category relevance</button><button class="sector-filter" type="button" data-sector-filter="evergreen" aria-pressed="false">Everyday use</button><button class="sector-filter" type="button" data-sector-filter="fast" aria-pressed="false">Seasonal fit</button><button class="sector-filter" type="button" data-sector-filter="margin" aria-pressed="false">Commercial review</button></div>'''

TAG_MAP = {
    "beauty": "demand margin",
    "home-kitchen": "evergreen demand",
    "toys-games": "fast demand margin",
    "electronics": "fast margin",
    "general-merchandise": "evergreen fast",
}


def update_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    # Remove only favicon/touch-icon declarations; preserve all unrelated head metadata.
    text = re.sub(r"\s*<link\s+rel=\"icon\"[^>]*>", "", text)
    text = re.sub(r"\s*<link\s+rel=\"apple-touch-icon\"[^>]*>", "", text)
    if "</head>" not in text:
        raise RuntimeError(f"{path}: missing </head>")
    text = text.replace("</head>", f"\n{FAVICON_BLOCK}\n</head>", 1)

    # Use the user's latest uploaded artwork through a stable, space-free alias.
    text = text.replace("tbm-logo-actual.svg", "tbm-logo-latest.png")
    text = text.replace("tbm-logo.svg", "tbm-logo-latest.png")

    path.write_text(text, encoding="utf-8")


def update_homepage() -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")

    section_start = text.find('<section class="v6-section" id="product-focus"')
    if section_start < 0:
        raise RuntimeError("index.html: product-focus section not found")
    section_end = text.find("</section>", section_start)
    if section_end < 0:
        raise RuntimeError("index.html: product-focus section end not found")

    section = text[section_start:section_end]
    if "data-sector-filter=" in section:
        raise RuntimeError("index.html: sector filter bar already exists")

    marker = '</header><div class="sector-network">'
    if section.count(marker) != 1:
        raise RuntimeError(f"index.html: expected one product filter insertion marker, found {section.count(marker)}")
    section = section.replace(marker, f"</header>{FILTER_BAR}<div class=\"sector-network\">", 1)

    for card, tags in TAG_MAP.items():
        pattern = rf'(data-sector-card="{re.escape(card)}"\s+data-tags=")[^"]*(")'
        section, count = re.subn(pattern, rf'\1{tags}\2', section, count=1)
        if count != 1:
            raise RuntimeError(f"index.html: unable to restore tags for {card}")

    text = text[:section_start] + section + text[section_end:]
    path.write_text(text, encoding="utf-8")


def update_validator() -> None:
    path = ROOT / "scripts/validate_corrective_surface.py"
    text = path.read_text(encoding="utf-8")

    text = text.replace(
        '''    "images/favicon-tbm.svg",
    "images/favicon-48.png",
    "images/apple-touch-icon.png",''',
        '''    "images/tbm-logo-latest.png",
    "images/favicon/favicon.ico",
    "images/favicon/favicon-32x32.png",
    "images/favicon/favicon-16x16.png",
    "images/favicon/apple-touch-icon.png",''',
        1,
    )

    text = text.replace(
        '''    if "tbm-logo.svg" in text:
        fail(f"{rel}: legacy visible logo reference remains")
    if "/images/favicon-tbm.svg" not in text:
        fail(f"{rel}: canonical favicon reference missing")''',
        '''    if "tbm-logo.svg" in text or "tbm-logo-actual.svg" in text:
        fail(f"{rel}: legacy visible logo reference remains")
    if "tbm-logo-latest.png" not in text:
        fail(f"{rel}: latest visible logo reference missing")
    if "/images/favicon/favicon.ico" not in text:
        fail(f"{rel}: canonical favicon package reference missing")''',
        1,
    )

    insertion_point = 'for unsupported in (\n'
    restoration_checks = '''for marker in (
    'class="sector-filters"',
    'data-sector-filter="all"',
    'data-sector-filter="demand"',
    'data-sector-filter="evergreen"',
    'data-sector-filter="fast"',
    'data-sector-filter="margin"',
):
    if marker not in homepage:
        fail(f"index.html missing restored sector filter marker: {marker}")
for card, tags in {
    "beauty": "demand margin",
    "home-kitchen": "evergreen demand",
    "toys-games": "fast demand margin",
    "electronics": "fast margin",
    "general-merchandise": "evergreen fast",
}.items():
    pattern = rf'data-sector-card="{re.escape(card)}"\\s+data-tags="{re.escape(tags)}"'
    if not re.search(pattern, homepage):
        fail(f"index.html missing restored filter tags for {card}: {tags}")
'''
    if insertion_point not in text:
        raise RuntimeError("validator: homepage unsupported-copy marker not found")
    text = text.replace(insertion_point, restoration_checks + insertion_point, 1)

    path.write_text(text, encoding="utf-8")


def main() -> None:
    public_html = sorted(ROOT.glob("*.html")) + sorted((ROOT / "blog").glob("*.html"))
    for path in public_html:
        update_html(path)
    update_homepage()
    update_validator()
    print(f"Updated {len(public_html)} public HTML files; restored filters and latest branding.")


if __name__ == "__main__":
    main()
