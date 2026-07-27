#!/usr/bin/env python3
"""Validate the canonical public SEO, trust and link contracts."""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/content-manifest.json"
STATIC_REQUIRED = [
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
    "data/content-manifest.json",
    "css/seo-content.css",
]
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


class PageParser(HTMLParser):
    """Collect relevant HTML metadata without depending on attribute order."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.robots: list[str] = []
        self.meta_properties: dict[str, list[str]] = {}
        self.hrefs: list[str] = []
        self.jsonld: list[str] = []
        self._in_jsonld = False
        self._jsonld_buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): (value or "") for key, value in attrs}
        tag = tag.lower()
        href = attributes.get("href")
        if href:
            self.hrefs.append(href)
        if tag == "link":
            rel_tokens = {token.lower() for token in attributes.get("rel", "").split()}
            if "canonical" in rel_tokens and href:
                self.canonicals.append(href)
        elif tag == "meta":
            name = attributes.get("name", "").lower()
            prop = attributes.get("property", "").lower()
            content = attributes.get("content", "")
            if name == "robots":
                self.robots.append(content)
            if prop:
                self.meta_properties.setdefault(prop, []).append(content)
        elif tag == "script" and attributes.get("type", "").lower() == "application/ld+json":
            self._in_jsonld = True
            self._jsonld_buffer = []

    def handle_data(self, data: str) -> None:
        if self._in_jsonld:
            self._jsonld_buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_buffer).strip())
            self._in_jsonld = False
            self._jsonld_buffer = []


try:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    print(f"SEO validation failed:\n- invalid or missing content manifest: {exc}")
    raise SystemExit(1)

site = str(manifest.get("site", "")).rstrip("/")
pages = manifest.get("pages", [])
if not site.startswith("https://"):
    fail("content manifest must define an HTTPS site URL")
if not isinstance(pages, list) or not pages:
    fail("content manifest must define at least one page")

page_by_file: dict[str, dict] = {}
for page in pages:
    try:
        file_path = page["file"]
        url_path = page["path"]
        indexable = bool(page["indexable"])
    except (KeyError, TypeError) as exc:
        fail(f"invalid page entry in content manifest: {exc}")
        continue
    if file_path in page_by_file:
        fail(f"duplicate file in content manifest: {file_path}")
    page_by_file[file_path] = page
    if not isinstance(url_path, str) or not url_path.startswith("/"):
        fail(f"invalid canonical path in content manifest: {url_path!r}")
    if indexable and not page.get("lastmod"):
        fail(f"indexable page missing lastmod in content manifest: {file_path}")

for rel in list(page_by_file) + STATIC_REQUIRED:
    if not (ROOT / rel).is_file():
        fail(f"missing required file: {rel}")

for rel in list(page_by_file) + ["robots.txt", "sitemap.xml", "llms.txt", "data/content-manifest.json"]:
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    for value in FORBIDDEN:
        if value.lower() in text.lower():
            fail(f"forbidden placeholder or conflicting signal in {rel}: {value}")

for rel, page in page_by_file.items():
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    low = text.lower()
    parser = PageParser()
    parser.feed(text)

    if '<meta name="keywords"' in low or "<meta name='keywords'" in low:
        fail(f"obsolete meta keywords in {rel}")
    if any(href == "#" for href in parser.hrefs):
        fail(f"placeholder href in {rel}")

    expected_canonical = site + page["path"]
    if not parser.canonicals:
        fail(f"missing canonical in {rel}")
    elif len(parser.canonicals) > 1:
        fail(f"multiple canonicals in {rel}: {parser.canonicals}")
    elif parser.canonicals[0] != expected_canonical:
        fail(
            f"canonical does not match manifest in {rel}: "
            f"{parser.canonicals[0]} != {expected_canonical}"
        )

    is_noindex = any("noindex" in value.lower() for value in parser.robots)
    should_index = bool(page["indexable"])
    if not parser.robots:
        fail(f"missing robots meta in {rel}")
    if should_index and is_noindex:
        fail(f"canonical public page unexpectedly noindex: {rel}")
    if not should_index and not is_noindex:
        fail(f"legacy/error page must be noindex: {rel}")

    if should_index:
        for required_meta in ("og:title", "og:description", "og:url"):
            if required_meta not in parser.meta_properties:
                fail(f"missing {required_meta} in {rel}")
        og_urls = parser.meta_properties.get("og:url", [])
        if og_urls and og_urls != [expected_canonical]:
            fail(f"og:url does not match manifest in {rel}: {og_urls}")

    if rel != "404.html" and not parser.jsonld:
        fail(f"missing JSON-LD in {rel}")
    for payload in parser.jsonld:
        try:
            json.loads(payload)
        except json.JSONDecodeError as exc:
            fail(f"invalid JSON-LD in {rel}: {exc}")

    for href in parser.hrefs:
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
if f"Sitemap: {site}/sitemap.xml" not in robots:
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
        expected_urls = [site + page["path"] for page in pages if page.get("indexable")]
        if len(urls) != len(set(urls)):
            fail("duplicate URLs in sitemap")
        if urls != expected_urls:
            fail("sitemap URLs or order do not match the indexable content manifest")
        for url in urls:
            parsed = urlparse(url)
            rel = parsed.path.lstrip("/") or "index.html"
            if not (ROOT / rel).exists():
                fail(f"sitemap URL has no file: {url}")
    except ET.ParseError as exc:
        fail(f"invalid sitemap XML: {exc}")

for article in manifest.get("articles", []):
    try:
        target = ROOT / article["path"].lstrip("/")
    except (KeyError, TypeError) as exc:
        fail(f"invalid article entry in content manifest: {exc}")
        continue
    if not target.exists():
        fail(f"content manifest points to missing article: {article.get('path')}")

if errors:
    print("SEO validation failed:")
    for item in errors:
        print(f"- {item}")
    sys.exit(1)

print("SEO validation passed.")
