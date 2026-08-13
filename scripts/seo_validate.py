#!/usr/bin/env python3
"""Validate the canonical public SEO, content, crawl-discovery and link contracts."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/content-manifest.json"
STATIC_REQUIRED = [
    "robots.txt", "sitemap.xml", "llms.txt", "data/content-manifest.json",
    "css/seo-content.css", "css/seo-content-v2.css", "js/secondary-nav.js",
]
FORBIDDEN = [
    "theblacksmithmarket.co.uk", "https://formspree.io/f/your-form-id", "FORM_ENDPOINT",
    "123 Commerce Park", "+44 (0) 161 123 4567", "James Harrison", "CRN-12345678",
    "Average Partner Rating", "Partner Retention Rate", "Active Manufacturer Partners",
    "GB123456789",
]
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


class PageParser(HTMLParser):
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
articles = manifest.get("articles", [])
site_parts = urlparse(site)
if not site.startswith("https://"):
    fail("content manifest must define an HTTPS site URL")
if not isinstance(pages, list) or not pages:
    fail("content manifest must define at least one page")

page_by_file: dict[str, dict] = {}
page_by_path: dict[str, dict] = {}
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
    if url_path in page_by_path:
        fail(f"duplicate canonical path in content manifest: {url_path}")
    page_by_file[file_path] = page
    page_by_path[url_path] = page
    if not isinstance(url_path, str) or not url_path.startswith("/"):
        fail(f"invalid canonical path in content manifest: {url_path!r}")
    if indexable and not page.get("lastmod"):
        fail(f"indexable page missing lastmod in content manifest: {file_path}")

indexable_paths = {page["path"] for page in pages if page.get("indexable")}
link_graph: dict[str, set[str]] = {path: set() for path in indexable_paths}


def internal_manifest_path(href: str, source_path: str) -> str | None:
    """Resolve an href to a same-host path, or return None for non-HTML navigation."""
    if href.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    resolved = urlparse(urljoin(site + source_path, href))
    if resolved.scheme not in {"http", "https"}:
        return None
    if resolved.netloc != site_parts.netloc:
        return None
    return resolved.path or "/"


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
    elif page["indexable"] and parser.canonicals[0] != expected_canonical:
        fail(f"canonical does not match manifest in {rel}: {parser.canonicals[0]} != {expected_canonical}")

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

    if should_index and rel != "404.html" and not parser.jsonld:
        fail(f"missing JSON-LD in {rel}")
    for payload in parser.jsonld:
        try:
            json.loads(payload)
        except json.JSONDecodeError as exc:
            fail(f"invalid JSON-LD in {rel}: {exc}")

    for href in parser.hrefs:
        target_path = internal_manifest_path(href, page["path"])
        if should_index and target_path == "/index.html":
            fail(f"indexable page links duplicate homepage alias instead of '/': {rel}: {href}")
        if should_index and target_path in page_by_path:
            target_page = page_by_path[target_path]
            if not target_page.get("indexable"):
                fail(f"indexable page links retired/non-indexable URL: {rel}: {href}")
            else:
                link_graph[page["path"]].add(target_path)

        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:")):
            continue
        clean = href.split("#", 1)[0].split("?", 1)[0]
        if not clean:
            continue
        target = ROOT / (clean.lstrip("/") or "index.html") if clean.startswith("/") else path.parent / clean
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            fail(f"broken internal link in {rel}: {href}")

    if should_index and rel not in {"index.html", "privacy-policy.html", "terms.html"}:
        if "Blog &amp; Resources" not in text and "Blog & Resources" not in text:
            fail(f"public page missing clear Blog & Resources label: {rel}")
    if should_index and rel != "index.html" and re.search(r">Insights<", text):
        fail(f"legacy Insights-only navigation remains in {rel}")

if "/" not in indexable_paths:
    fail("canonical homepage '/' must be indexable")
else:
    reachable = {"/"}
    pending = ["/"]
    while pending:
        source = pending.pop()
        for target in link_graph.get(source, set()):
            if target not in reachable:
                reachable.add(target)
                pending.append(target)
    orphaned = sorted(indexable_paths - reachable)
    if orphaned:
        fail("indexable canonical pages are not crawl-reachable from '/': " + ", ".join(orphaned))

robots_path = ROOT / "robots.txt"
robots = robots_path.read_text(encoding="utf-8") if robots_path.exists() else ""
expected_robots = f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n"
if robots != expected_robots:
    fail("robots.txt must use the approved minimal public crawl policy")

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
        if any(urlparse(url).path == "/index.html" for url in urls):
            fail("sitemap must not contain duplicate homepage alias /index.html")
        for url in urls:
            parsed = urlparse(url)
            rel = parsed.path.lstrip("/") or "index.html"
            if not (ROOT / rel).exists():
                fail(f"sitemap URL has no file: {url}")
    except ET.ParseError as exc:
        fail(f"invalid sitemap XML: {exc}")

blog_text = (ROOT / "blog.html").read_text(encoding="utf-8", errors="ignore") if (ROOT / "blog.html").exists() else ""
for article in articles:
    try:
        target = ROOT / article["path"].lstrip("/")
    except (KeyError, TypeError) as exc:
        fail(f"invalid article entry in content manifest: {exc}")
        continue
    if not target.exists():
        fail(f"content manifest points to missing article: {article.get('path')}")
        continue
    if article.get("status") == "published" and article.get("path") not in blog_text:
        fail(f"blog hub does not link published article: {article.get('path')}")
    content = target.read_text(encoding="utf-8", errors="ignore")
    if article.get("status") == "published":
        if article.get("path") not in indexable_paths:
            fail(f"published article is not an indexable canonical page: {article.get('path')}")
        if '"@type":"BlogPosting"' not in content:
            fail(f"published article missing BlogPosting schema: {target.relative_to(ROOT)}")
        if '"@type":"BreadcrumbList"' not in content:
            fail(f"published article missing BreadcrumbList schema: {target.relative_to(ROOT)}")

if errors:
    print("SEO validation failed:")
    for item in errors:
        print(f"- {item}")
    sys.exit(1)
print("SEO validation passed.")
