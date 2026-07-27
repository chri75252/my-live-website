#!/usr/bin/env python3
"""Validate the canonical public SEO, trust and link contracts."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.theblacksmithmarket.com"
PUBLIC_HTML = [
    "index.html",
    "about.html",
    "products.html",
    "partnership.html",
    "contact.html",
    "faq.html",
    "blog.html",
    "blog/search-ai-discovery-checklist.html",
    "editorial-policy.html",
    "research-methodology.html",
    "ai-content-policy.html",
    "privacy-policy.html",
    "terms.html",
    "testimonials.html",
    "blog/uk-wholesale-distributor-guide.html",
    "404.html",
]
REQUIRED = PUBLIC_HTML + [
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
    "data/content-manifest.json",
    "css/seo-content.css",
]
NOINDEX = {
    "testimonials.html",
    "blog/uk-wholesale-distributor-guide.html",
    "404.html",
}
FORBIDDEN = [
    "theblacksmithmarket.co.uk",
    "https://formspree.io/f/your-form-id",
    "123 Commerce Park",
    "+44 (0) 161 123 4567",
    "James Harrison",
    "CRN-12345678",
    "Average Partner Rating",
    "Partner Retention Rate",
    "Active Manufacturer Partners",
    "GB123456789",
]
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


for rel in REQUIRED:
    if not (ROOT / rel).is_file():
        fail(f"missing required file: {rel}")

for rel in PUBLIC_HTML + ["robots.txt", "sitemap.xml", "llms.txt", "data/content-manifest.json"]:
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    for value in FORBIDDEN:
        if value.lower() in text.lower():
            fail(f"forbidden placeholder or conflicting signal in {rel}: {value}")

for rel in PUBLIC_HTML:
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    low = text.lower()
    if '<meta name="keywords"' in low or "<meta name='keywords'" in low:
        fail(f"obsolete meta keywords in {rel}")
    if re.search(r'href=["\']#["\']', text, re.I):
        fail(f"placeholder href in {rel}")

    canonicals = re.findall(
        r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)',
        text,
        re.I,
    )
    robots = re.findall(
        r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)',
        text,
        re.I,
    )
    is_noindex = any("noindex" in value.lower() for value in robots)
    if not canonicals:
        fail(f"missing canonical in {rel}")
    if len(canonicals) > 1:
        fail(f"multiple canonicals in {rel}: {canonicals}")
    if canonicals and not canonicals[0].startswith(SITE):
        fail(f"non-canonical hostname in {rel}: {canonicals[0]}")
    if not robots:
        fail(f"missing robots meta in {rel}")
    if rel in NOINDEX and not is_noindex:
        fail(f"legacy/error page must be noindex: {rel}")
    if rel not in NOINDEX and is_noindex:
        fail(f"canonical public page unexpectedly noindex: {rel}")
    if not is_noindex:
        for required_meta in ("og:title", "og:description", "og:url"):
            if required_meta not in low:
                fail(f"missing {required_meta} in {rel}")

    payloads = re.findall(
        r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
        text,
        re.I | re.S,
    )
    if rel not in {"404.html"} and not payloads:
        fail(f"missing JSON-LD in {rel}")
    for payload in payloads:
        try:
            json.loads(payload)
        except json.JSONDecodeError as exc:
            fail(f"invalid JSON-LD in {rel}: {exc}")

    for href in re.findall(r'href=["\']([^"\']+)', text, re.I):
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:")):
            continue
        clean = href.split("#", 1)[0].split("?", 1)[0]
        if not clean:
            continue
        if clean.startswith("/"):
            target = ROOT / (clean.lstrip("/") or "index.html")
        else:
            target = path.parent / clean
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            fail(f"broken internal link in {rel}: {href}")

robots_path = ROOT / "robots.txt"
robots = robots_path.read_text(encoding="utf-8") if robots_path.exists() else ""
if f"Sitemap: {SITE}/sitemap.xml" not in robots:
    fail("robots.txt does not advertise the canonical sitemap")
for bot in ("OAI-SearchBot", "PerplexityBot", "Googlebot", "Bingbot"):
    if f"User-agent: {bot}" not in robots:
        fail(f"robots.txt missing explicit policy for {bot}")

sitemap_path = ROOT / "sitemap.xml"
if sitemap_path.exists():
    try:
        tree = ET.parse(sitemap_path)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = [node.text or "" for node in tree.findall(".//sm:loc", ns)]
        if len(urls) != len(set(urls)):
            fail("duplicate URLs in sitemap")
        for url in urls:
            if not url.startswith(SITE):
                fail(f"sitemap uses non-canonical host: {url}")
                continue
            parsed = urlparse(url)
            rel = parsed.path.lstrip("/") or "index.html"
            if not (ROOT / rel).exists():
                fail(f"sitemap URL has no file: {url}")
        for excluded in NOINDEX:
            if any(url.endswith(excluded) for url in urls):
                fail(f"noindex/legacy URL included in sitemap: {excluded}")
    except ET.ParseError as exc:
        fail(f"invalid sitemap XML: {exc}")

manifest_path = ROOT / "data/content-manifest.json"
if manifest_path.exists():
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for article in manifest.get("articles", []):
            target = ROOT / article["path"].lstrip("/")
            if not target.exists():
                fail(f"content manifest points to missing article: {article['path']}")
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        fail(f"invalid content manifest: {exc}")

if errors:
    print("SEO validation failed:")
    for item in errors:
        print(f"- {item}")
    sys.exit(1)

print("SEO validation passed.")
