#!/usr/bin/env python3
"""Validate the corrective visible surface and protect V10 runtime files."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/content-manifest.json"
ERRORS: list[str] = []
PROTECTED = [
    "js/tbm-cinematic-v10.js",
    "js/home-v2.js",
    "js/tbm-product-network-v7.js",
    "css/tbm-cinematic-v10.css",
    "css/site-v2.css",
    "assets/tbm-cinematic-v9",
]
TEMPORARY_RECOVERY_PATHS = [
    ".index-rebuild",
    "scripts/rebuild_homepage_corrective.py",
    ".github/workflows/rebuild-corrective-homepage.yml",
    ".github/workflows/rebuild-homepage-shell.yml",
    "homepage-rebuild-diagnostic.txt",
]
CARD_PAGES = {
    "products.html": 9,
    "about.html": 3,
    "blog.html": 10,
    "partnership.html": 3,
    "contact.html": 4,
}
CARD_ASSETS = [
    "css/secondary-cards.css",
    "js/card-spotlight.js",
    "images/site/digital-commerce.svg",
    "images/site/about-products.svg",
    "images/site/about-partnerships.svg",
    "images/site/about-modern-commerce.svg",
]
PRODUCT_IMAGES = [
    "/assets/tbm-cinematic-v6/product-focus/beauty.webp",
    "/assets/tbm-cinematic-v6/product-focus/home-kitchen.webp",
    "/assets/tbm-cinematic-v6/product-focus/toys-games.webp",
    "/assets/tbm-cinematic-v6/product-focus/electronics.webp",
    "/assets/tbm-cinematic-v6/product-focus/general-merchandise.webp",
    "/images/site/digital-commerce.svg",
]


def fail(message: str) -> None:
    ERRORS.append(message)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f"missing file: {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


try:
    manifest = json.loads(read("data/content-manifest.json"))
except json.JSONDecodeError as exc:
    fail(f"invalid manifest JSON: {exc}")
    manifest = {"pages": [], "articles": []}

for rel in TEMPORARY_RECOVERY_PATHS:
    if (ROOT / rel).exists():
        fail(f"temporary homepage-recovery path remains in the branch: {rel}")

for rel in CARD_ASSETS:
    if not (ROOT / rel).is_file():
        fail(f"required card asset is missing: {rel}")

public_files = [page["file"] for page in manifest.get("pages", []) if page.get("indexable")]
for rel in public_files:
    text = read(rel)
    if rel not in {"privacy-policy.html", "terms.html"} and "Blog &amp; Resources" not in text and "Blog & Resources" not in text:
        fail(f"{rel}: clear Blog & Resources label missing")
    if re.search(r">Insights<", text):
        fail(f"{rel}: legacy Insights-only label remains")
    if "href=\"/testimonials.html\"" in text or "href=\"testimonials.html\"" in text:
        fail(f"{rel}: retired testimonials page is publicly linked")
    for retired in ("editorial-policy.html", "research-methodology.html", "ai-content-policy.html"):
        if f'href="/{retired}"' in text or f'href="{retired}"' in text:
            fail(f"{rel}: retired policy page is publicly linked")

for rel, minimum_cards in CARD_PAGES.items():
    text = read(rel)
    if 'class="category-card"' in text:
        fail(f"{rel}: legacy conflicting category-card class remains")
    if 'class="category-grid"' in text:
        fail(f"{rel}: legacy conflicting category-grid class remains")
    if text.count("data-spotlight-card") < minimum_cards:
        fail(f"{rel}: expected at least {minimum_cards} spotlight cards")
    if "/css/secondary-cards.css" not in text:
        fail(f"{rel}: secondary card stylesheet missing")
    if "/js/card-spotlight.js" not in text:
        fail(f"{rel}: spotlight script missing")
    if 'aria-current="page"' not in text:
        fail(f"{rel}: active navigation lacks aria-current")

products = read("products.html")
products_lower = products.lower()
for phrase in ("what a useful product file contains", "useful product file", "product file contains"):
    if phrase in products_lower:
        fail("products.html still presents supplier-file requirements as product content")
for image in PRODUCT_IMAGES:
    if image not in products:
        fail(f"products.html missing product-card image: {image}")
    if not (ROOT / image.lstrip("/")).is_file():
        fail(f"referenced product-card image does not exist: {image}")

spotlight_script = read("js/card-spotlight.js")
for marker in ("data-spotlight-card", "--spotlight-x", "--spotlight-y", "requestAnimationFrame"):
    if marker not in spotlight_script:
        fail(f"spotlight script missing implementation marker: {marker}")

card_css = read("css/secondary-cards.css")
for marker in (".tbm-card-grid", ".tbm-card__media", "radial-gradient", "prefers-reduced-motion"):
    if marker not in card_css:
        fail(f"secondary card stylesheet missing marker: {marker}")

homepage = read("index.html")
for marker in (
    "Products &amp; Opportunities",
    "Blog &amp; Resources",
    "From The Forge",
    "Clarify where relevant",
    "Continue or close",
    "Product fit",
    "Commercial terms",
    "js/tbm-cinematic-v10.js",
    "js/home-v2.js",
    "js/tbm-product-network-v7.js",
):
    if marker not in homepage:
        fail(f"index.html missing required marker: {marker}")
for unsupported in (
    "high and rising across multiple channels",
    "category specialists",
    "strong margin potential with repeat sales",
    "Discuss the Opportunity",
    "Agree Clear Terms",
    "Commercial evaluation brings demand, margin",
):
    if unsupported.lower() in homepage.lower():
        fail(f"index.html retains superseded or unsupported wording: {unsupported}")
for script in ("js/tbm-cinematic-v10.js", "js/home-v2.js", "js/tbm-product-network-v7.js"):
    if homepage.count(script) != 1:
        fail(f"index.html has an unexpected import count for {script}: {homepage.count(script)}")

blog = read("blog.html")
if "The Forge" not in blog or "Blog &amp; Resources" not in blog:
    fail("blog.html must use The Forge as the editorial brand and Blog & Resources as the functional label")
for article in manifest.get("articles", []):
    if article.get("status") != "published":
        continue
    path = article.get("path", "")
    if path not in blog:
        fail(f"blog.html missing published article: {path}")
    article_text = read(path.lstrip("/"))
    for marker in ('"@type":"BlogPosting"', '"@type":"BreadcrumbList"', "Disclosure:"):
        if marker not in article_text:
            fail(f"{path}: missing article marker {marker}")

robots = read("robots.txt")
expected = "User-agent: *\nAllow: /\n\nSitemap: https://www.theblacksmithmarket.com/sitemap.xml\n"
if robots != expected:
    fail("robots.txt differs from the approved minimal policy")

base = os.environ.get("PR_BASE_SHA")
if base:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...HEAD", "--", *PROTECTED],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode:
        fail(f"protected-file diff check failed: {result.stderr.strip()}")
    elif result.stdout.strip():
        fail("protected V10 files changed unexpectedly:\n" + result.stdout.strip())

if ERRORS:
    print("Corrective surface validation failed:")
    for item in ERRORS:
        print(f"- {item}")
    sys.exit(1)
print("Corrective surface validation passed.")
