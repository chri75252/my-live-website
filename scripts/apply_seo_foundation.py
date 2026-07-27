#!/usr/bin/env python3
"""Apply the repository-side SEO, trust and AI-discovery foundation.

This migration is intentionally deterministic. It rewrites only public content and
search-discovery files that can be corrected without inventing business facts.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.theblacksmithmarket.com"
EMAIL = "info@theblacksmithmarket.com"
COMPANY_NO = "14106759"
TODAY = date.today().isoformat()
INDEXNOW_KEY = "b7e3f0129a4c4dd78c6543b9f2a1d0e6"


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")


def json_ld(data: dict | list) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": f"{SITE}/#organization",
    "name": "The Blacksmith Market Ltd",
    "alternateName": "The Blacksmith Market",
    "url": f"{SITE}/",
    "logo": {
        "@type": "ImageObject",
        "url": f"{SITE}/images/tbm-logo-actual.svg",
    },
    "email": EMAIL,
    "identifier": {
        "@type": "PropertyValue",
        "propertyID": "UK company number",
        "value": COMPANY_NO,
    },
}


def head(title: str, description: str, path: str, *, robots: str = "index,follow", page_type: str = "website", schema: dict | list | None = None) -> str:
    canonical = f"{SITE}{path}"
    payload = schema or {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        "url": canonical,
        "name": title,
        "description": description,
        "isPartOf": {"@id": f"{SITE}/#website"},
        "publisher": {"@id": f"{SITE}/#organization"},
    }
    return f"""<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <meta name=\"theme-color\" content=\"#020302\">
  <meta name=\"robots\" content=\"{robots}\">
  <title>{html.escape(title)}</title>
  <meta name=\"description\" content=\"{html.escape(description, quote=True)}\">
  <link rel=\"canonical\" href=\"{canonical}\">
  <link rel=\"icon\" href=\"/images/tbm-logo-actual.svg\" type=\"image/svg+xml\">
  <meta property=\"og:site_name\" content=\"The Blacksmith Market\">
  <meta property=\"og:type\" content=\"{page_type}\">
  <meta property=\"og:title\" content=\"{html.escape(title, quote=True)}\">
  <meta property=\"og:description\" content=\"{html.escape(description, quote=True)}\">
  <meta property=\"og:url\" content=\"{canonical}\">
  <meta property=\"og:image\" content=\"{SITE}/images/og-image.jpg\">
  <meta property=\"og:image:alt\" content=\"The Blacksmith Market\">
  <meta name=\"twitter:card\" content=\"summary_large_image\">
  <meta name=\"twitter:title\" content=\"{html.escape(title, quote=True)}\">
  <meta name=\"twitter:description\" content=\"{html.escape(description, quote=True)}\">
  <meta name=\"twitter:image\" content=\"{SITE}/images/og-image.jpg\">
  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
  <link href=\"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">
  <link rel=\"stylesheet\" href=\"/css/site-v2.css\">
  <link rel=\"stylesheet\" href=\"/css/seo-content.css\">
  <script type=\"application/ld+json\">{json_ld(payload)}</script>
</head>"""


def header(active: str = "") -> str:
    links = [
        ("Home", "/index.html", "home"),
        ("About", "/about.html", "about"),
        ("Product Focus", "/products.html", "products"),
        ("Sell to Us", "/partnership.html", "partnership"),
        ("Insights", "/blog.html", "blog"),
        ("Contact", "/contact.html", "contact"),
    ]
    nav = "".join(
        f'<a class="nav-link{" is-active" if key == active else ""}" href="{href}"{" aria-current=\"page\"" if key == active else ""}>{label}</a>'
        for label, href, key in links
    )
    return f"""<a class=\"skip-link\" href=\"#main-content\">Skip to main content</a>
<header class=\"site-header seo-site-header\"><div class=\"shell header-shell\">
  <a class=\"brand\" href=\"/index.html\" aria-label=\"The Blacksmith Market home\"><span class=\"brand-mark brand-mark--actual\"><img src=\"/images/tbm-logo-actual.svg\" alt=\"\" width=\"58\" height=\"58\"></span><span class=\"brand-name\"><small>The</small>Blacksmith Market</span></a>
  <nav class=\"desktop-nav seo-nav\" aria-label=\"Primary navigation\">{nav}</nav>
  <a class=\"button button-gold header-cta\" href=\"/contact.html\">Contact</a>
</div></header>"""


def footer() -> str:
    return f"""<footer class=\"site-footer seo-footer\"><div class=\"shell footer-grid\">
  <div class=\"footer-brand\"><a class=\"brand\" href=\"/index.html\"><span class=\"brand-mark\"><img src=\"/images/tbm-logo.svg\" alt=\"\" width=\"48\" height=\"48\"></span><span class=\"brand-name\"><small>The</small>Blacksmith Market</span></a><p>Wholesale stock evaluation, supplier conversations and operator-led commerce research.</p></div>
  <div><h3>Company</h3><a href=\"/about.html\">About</a><a href=\"/products.html\">Product Focus</a><a href=\"/partnership.html\">Sell to Us</a><a href=\"/contact.html\">Contact</a></div>
  <div><h3>Research</h3><a href=\"/blog.html\">Insights</a><a href=\"/research-methodology.html\">Methodology</a><a href=\"/editorial-policy.html\">Editorial Policy</a><a href=\"/ai-content-policy.html\">AI Content Policy</a></div>
  <div><h3>Legal</h3><a href=\"/privacy-policy.html\">Privacy Policy</a><a href=\"/terms.html\">Website Terms</a><a href=\"mailto:{EMAIL}\">{EMAIL}</a></div>
</div><div class=\"shell footer-bottom\"><span>© 2026 The Blacksmith Market Ltd · Company no. {COMPANY_NO}</span><span>United Kingdom</span></div></footer>"""


def page(title: str, description: str, path: str, active: str, eyebrow: str, heading: str, lead: str, body: str, *, robots: str = "index,follow", schema: dict | list | None = None) -> str:
    return f"""<!DOCTYPE html>
<html lang=\"en-GB\">
{head(title, description, path, robots=robots, schema=schema)}
<body class=\"home-v2 seo-page\">
{header(active)}
<main id=\"main-content\" class=\"seo-main\">
  <section class=\"seo-hero\"><div class=\"shell seo-shell\"><p class=\"eyebrow\"><span></span>{eyebrow}</p><h1>{heading}</h1><p class=\"seo-lead\">{lead}</p></div></section>
  {body}
</main>
{footer()}
</body>
</html>"""


CSS = r"""
:root { color-scheme: dark; }
body.seo-page { background:#020302; color:#f2efe6; font-family:Manrope,system-ui,sans-serif; }
.seo-site-header { position:sticky; top:0; }
.seo-nav { display:flex; gap:1.2rem; align-items:center; }
.seo-main { min-height:65vh; padding-top:92px; }
.seo-hero { padding:5.5rem 0 3rem; border-bottom:1px solid rgba(211,165,83,.22); background:radial-gradient(circle at 80% 20%,rgba(166,107,35,.15),transparent 38%); }
.seo-hero h1 { max-width:900px; margin:.5rem 0 1rem; font-family:"Cormorant Garamond",serif; font-size:clamp(3rem,7vw,6rem); line-height:.94; }
.seo-lead { max-width:780px; color:#c9c4b9; font-size:1.12rem; line-height:1.75; }
.seo-section { padding:4.5rem 0; }
.seo-section + .seo-section { border-top:1px solid rgba(255,255,255,.08); }
.seo-section h2 { font-family:"Cormorant Garamond",serif; font-size:clamp(2.2rem,4vw,3.8rem); margin:0 0 1rem; }
.seo-section h3 { margin:0 0 .6rem; font-size:1.15rem; }
.seo-section p,.seo-section li { color:#c9c4b9; line-height:1.75; }
.seo-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1.25rem; margin-top:2rem; }
.seo-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
.seo-card { display:block; padding:1.5rem; border:1px solid rgba(211,165,83,.28); border-radius:18px; background:rgba(255,255,255,.025); color:inherit; text-decoration:none; }
.seo-card:hover { border-color:rgba(211,165,83,.65); transform:translateY(-2px); }
.seo-card p { margin-bottom:0; }
.seo-kicker { color:#d3a553!important; font-size:.78rem; letter-spacing:.12em; text-transform:uppercase; }
.seo-list { padding-left:1.25rem; }
.seo-note { padding:1.25rem 1.4rem; border-left:3px solid #d3a553; background:rgba(211,165,83,.08); }
.seo-actions { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:1.5rem; }
.seo-article { max-width:850px; }
.seo-article h2 { margin-top:3rem; }
.seo-article a { color:#e3bb72; }
.seo-meta { color:#98938a; font-size:.9rem; }
.seo-footer { margin-top:0; }
@media (max-width:900px) { .seo-nav { display:none; } .seo-grid,.seo-grid.two { grid-template-columns:1fr; } .seo-main { padding-top:78px; } .seo-hero { padding-top:3.5rem; } }
"""


ABOUT_BODY = """
<section class="seo-section"><div class="shell seo-shell"><h2>What the company does</h2><div class="seo-grid"><article class="seo-card"><p class="seo-kicker">Stock evaluation</p><h3>Review selected opportunities</h3><p>We review branded and excess consumer stock using product information, pricing, pack details, documentation and practical resale considerations.</p></article><article class="seo-card"><p class="seo-kicker">Supplier route</p><h3>Keep the process direct</h3><p>Suppliers can submit a range for an initial commercial review. Submission does not guarantee an offer or purchase.</p></article><article class="seo-card"><p class="seo-kicker">Research</p><h3>Publish useful operating knowledge</h3><p>The Insights section focuses on product-data verification, FBA unit economics, wholesale sourcing and ecommerce automation.</p></article></div></div></section>
<section class="seo-section"><div class="shell seo-shell"><h2>Operating principles</h2><ul class="seo-list"><li>Use evidence before promotional claims.</li><li>Distinguish confirmed facts from assumptions and estimates.</li><li>Check EANs, pack sizes, titles and commercial terms rather than relying on one matching field.</li><li>Do not present planned capabilities as current services.</li></ul></div></section>
"""

PRODUCTS_BODY = """
<section class="seo-section"><div class="shell seo-shell"><h2>Current areas of interest</h2><div class="seo-grid"><article class="seo-card"><h3>Beauty &amp; personal care</h3><p>Selected branded products where documentation, pack configuration and commercial terms can be assessed clearly.</p></article><article class="seo-card"><h3>Home &amp; kitchen</h3><p>Practical consumer goods with clear identifiers, case quantities and replenishment information.</p></article><article class="seo-card"><h3>Toys &amp; games</h3><p>Products reviewed with particular attention to age grading, compliance, seasonality and exact edition or pack matching.</p></article><article class="seo-card"><h3>Consumer electronics</h3><p>Selective review subject to model accuracy, specifications, warranty information and applicable compliance documents.</p></article><article class="seo-card"><h3>General merchandise</h3><p>Other opportunities may be considered where the product data and commercial case are sufficiently clear.</p></article></div></div></section>
<section class="seo-section"><div class="shell seo-shell"><h2>What a useful product file contains</h2><ul class="seo-list"><li>Product title and brand</li><li>EAN, GTIN, UPC or model number</li><li>Unit count, pack size and case quantity</li><li>Ex-VAT and VAT-inclusive pricing where applicable</li><li>MOQ, lead time and available quantity</li><li>Product images and documentation</li></ul><div class="seo-actions"><a class="button button-gold" href="/partnership.html">Supplier information</a></div></div></section>
"""

PARTNERSHIP_BODY = f"""
<section class="seo-section"><div class="shell seo-shell"><h2>Information to send</h2><div class="seo-grid two"><article class="seo-card"><h3>Product data</h3><ul class="seo-list"><li>Brand and product title</li><li>EAN/GTIN and model details</li><li>Pack size and case quantity</li><li>Images and specification sheets</li></ul></article><article class="seo-card"><h3>Commercial data</h3><ul class="seo-list"><li>Unit and case pricing</li><li>VAT treatment</li><li>MOQ and available quantity</li><li>Lead time and delivery terms</li></ul></article></div><p class="seo-note">A submitted range is reviewed for fit and data quality. Submission does not create an obligation to purchase, distribute or respond within a fixed period.</p><div class="seo-actions"><a class="button button-gold" href="mailto:{EMAIL}?subject=Supplier%20range%20submission">Email your range</a><a class="button button-outline" href="/faq.html">Read the FAQ</a></div></div></section>
<section class="seo-section"><div class="shell seo-shell"><h2>How the review works</h2><ol class="seo-list"><li>Confirm the essential supplier and product information is present.</li><li>Check identifiers, titles, variants, pack sizes and documents.</li><li>Review pricing, quantities, logistics and commercial viability.</li><li>Continue the conversation only where the opportunity appears relevant.</li></ol></div></section>
"""

CONTACT_BODY = f"""
<section class="seo-section"><div class="shell seo-shell"><div class="seo-grid two"><article class="seo-card"><p class="seo-kicker">Supplier enquiries</p><h2>Submit a product range</h2><p>Include a product file, prices, pack sizes, available quantities, lead times and relevant documentation.</p><div class="seo-actions"><a class="button button-gold" href="mailto:{EMAIL}?subject=Supplier%20range%20submission">{EMAIL}</a></div></article><article class="seo-card"><p class="seo-kicker">General contact</p><h2>Website and research</h2><p>Use the same address for questions about the website, published material or corrections.</p><div class="seo-actions"><a class="button button-outline" href="mailto:{EMAIL}?subject=Website%20enquiry">Email us</a></div></article></div><p class="seo-note">The website does not currently publish a telephone number, visitor address, careers programme or guaranteed response time.</p></div></section>
"""

FAQ_BODY = """
<section class="seo-section"><div class="shell seo-shell"><div class="seo-grid two"><article class="seo-card"><h2>What does The Blacksmith Market review?</h2><p>Selected branded and excess consumer stock where product identity, pack configuration, documentation and commercial terms can be assessed.</p></article><article class="seo-card"><h2>What should a supplier provide?</h2><p>A product file with identifiers, titles, pack sizes, prices, quantities, lead times, images and applicable compliance information.</p></article><article class="seo-card"><h2>Does submission guarantee an order?</h2><p>No. Submission starts an initial review only and does not create an obligation to purchase or distribute stock.</p></article><article class="seo-card"><h2>Does the site sell products to consumers?</h2><p>No. The current website is informational and supplier-facing; it does not provide consumer checkout or order management.</p></article><article class="seo-card"><h2>What is published in Insights?</h2><p>Operator-led material on FBA unit economics, product matching, wholesale sourcing, data quality and ecommerce automation.</p></article><article class="seo-card"><h2>How can a correction be requested?</h2><p>Send the page URL and the issue to the contact email. Material corrections will be reviewed and dated where appropriate.</p></article></div></div></section>
"""

BLOG_BODY = """
<section class="seo-section"><div class="shell seo-shell"><h2>Research areas</h2><div class="seo-grid"><article class="seo-card"><p class="seo-kicker">Amazon FBA</p><h3>Unit economics and product validation</h3><p>Fees, VAT, ROI, MOQ exposure, pack-size verification and practical decision rules.</p></article><article class="seo-card"><p class="seo-kicker">Wholesale sourcing</p><h3>Supplier and catalogue analysis</h3><p>Product-data quality, identifier matching, supplier comparison and commercial review methods.</p></article><article class="seo-card"><p class="seo-kicker">Automation</p><h3>AI-assisted commerce operations</h3><p>Deterministic workflows, agent systems, report auditing and search/AI visibility experiments.</p></article></div></div></section>
<section class="seo-section"><div class="shell seo-shell"><h2>Published guide</h2><a class="seo-card" href="/blog/search-ai-discovery-checklist.html"><p class="seo-kicker">Search and AI discovery</p><h3>A practical checklist for making a small-business website easier to understand</h3><p>Canonical signals, crawl paths, evidence, authorship, structured data and the limited role of AI-specific files.</p></a></div></section>
<section class="seo-section"><div class="shell seo-shell"><h2>How content is prepared</h2><div class="seo-actions"><a class="button button-outline" href="/research-methodology.html">Research methodology</a><a class="button button-outline" href="/editorial-policy.html">Editorial policy</a><a class="button button-outline" href="/ai-content-policy.html">AI content policy</a></div></div></section>
"""

POLICY_BODY = """
<section class="seo-section"><div class="shell seo-shell seo-article"><h2>Editorial standard</h2><p>Published material should identify its subject clearly, distinguish evidence from interpretation and avoid presenting assumptions as established facts.</p><h2>Authorship and review</h2><p>Content is published by The Blacksmith Market Ltd until an individual public author profile is approved. A named person will not be invented to imply expertise or company scale.</p><h2>Sources and corrections</h2><p>Externally verifiable claims should link to primary or authoritative sources where practical. Material corrections should update the page and its modified date.</p><h2>Commercial independence</h2><p>Any sponsorship, affiliate arrangement or commercial relationship affecting an article will be disclosed on that page.</p></div></section>
"""

METHODOLOGY_BODY = """
<section class="seo-section"><div class="shell seo-shell seo-article"><h2>Evidence hierarchy</h2><ol class="seo-list"><li>Primary records, official documentation and direct operational data.</li><li>Reputable institutional or technical sources.</li><li>Commercial tools and third-party estimates, clearly labelled.</li><li>Reasoned inference, identified as inference rather than fact.</li></ol><h2>Commerce analysis</h2><p>Product analysis should check titles, identifiers, unit count, pack size, model or variation, pricing, fees, VAT, logistics and available quantity. An exact EAN match is useful evidence but is not always sufficient on its own.</p><h2>Limitations</h2><p>Search volumes, marketplace sales estimates, rankings and third-party authority metrics are estimates or snapshots. Their source and date should be stated when they materially affect a conclusion.</p></div></section>
"""

AI_POLICY_BODY = """
<section class="seo-section"><div class="shell seo-shell seo-article"><h2>Permitted use</h2><p>AI tools may assist with outlining, editing, code, data transformation and quality checks. They are not treated as evidence by themselves.</p><h2>Human accountability</h2><p>Published calculations, claims, examples and recommendations remain the responsibility of the publisher. Unsupported names, testimonials, statistics and business capabilities are not acceptable.</p><h2>Original value</h2><p>Articles should add methodology, examples, data, tested workflows or experienced judgement rather than merely rewriting material already available elsewhere.</p><h2>Disclosure</h2><p>Where AI assistance materially affects the production of an article, the page may include a short disclosure describing its role.</p></div></section>
"""

TESTIMONIALS_BODY = """
<section class="seo-section"><div class="shell seo-shell seo-article"><h2>No public endorsements are currently published</h2><p>This legacy URL previously contained unverified testimonial names, ratings and partner statistics. Those claims have been removed.</p><p>Future references will be published only with supporting evidence and permission. Supplier information remains available on the partnership page.</p><div class="seo-actions"><a class="button button-gold" href="/partnership.html">Supplier information</a></div></div></section>
"""

ARTICLE_DESCRIPTION = "A practical search and AI-discovery checklist covering canonical URLs, sitemaps, crawlability, evidence, authorship, structured data and content quality."
ARTICLE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": f"{SITE}/blog/search-ai-discovery-checklist.html#article",
    "headline": "A Practical Search and AI-Discovery Checklist for Small-Business Websites",
    "description": ARTICLE_DESCRIPTION,
    "url": f"{SITE}/blog/search-ai-discovery-checklist.html",
    "mainEntityOfPage": f"{SITE}/blog/search-ai-discovery-checklist.html",
    "datePublished": TODAY,
    "dateModified": TODAY,
    "author": {"@id": f"{SITE}/#organization"},
    "publisher": {"@id": f"{SITE}/#organization"},
    "image": f"{SITE}/images/og-image.jpg",
}
ARTICLE_BODY = """
<section class="seo-section"><div class="shell seo-shell seo-article"><p class="seo-meta">Published by The Blacksmith Market · Updated <time datetime=""" + TODAY + "">" + TODAY + """</time></p><p>Search engines and answer systems do not need a website to use a special writing style. They do need consistent URLs, accessible pages, reliable identity signals and content that is worth retrieving.</p><h2>1. Establish one canonical domain</h2><p>Choose one HTTPS hostname and make the sitemap, canonical tags, Open Graph URLs, internal links and structured data agree. Conflicting hosts divide signals and make diagnosis harder.</p><h2>2. Publish an accurate sitemap</h2><p>A sitemap should contain only canonical, indexable pages that actually exist. The presence of a sitemap is not a pass when it lists obsolete or missing URLs.</p><h2>3. Keep important content in normal HTML</h2><p>Page titles, headings, explanations, authorship and key facts should be available without requiring a user interaction. JavaScript can enhance the experience but should not be the only location of essential information.</p><h2>4. Remove credibility shortcuts</h2><p>Invented authors, testimonials, addresses, ratings and operating statistics are more damaging than missing schema. Search and AI systems can compare a site with company records and other public sources.</p><h2>5. Use structured data as a description, not decoration</h2><p>Organization, WebSite, BlogPosting and breadcrumb data can clarify entities and relationships. The markup must match the visible page and should not introduce claims the visitor cannot verify.</p><h2>6. Create non-commodity content</h2><p>Useful content contributes tested methods, original examples, calculations, data or experienced judgement. Generic summaries are unlikely to earn durable rankings, citations or links.</p><h2>7. Treat AI-specific files as optional</h2><p>A clear <code>robots.txt</code>, canonical structure and substantive content matter more than optional conventions such as <code>llms.txt</code>. An AI-specific file cannot repair weak indexing or unsupported claims.</p><h2>8. Measure conventional and AI discovery</h2><p>Use Search Console for queries, pages, impressions, clicks and canonical issues. Track referral traffic from answer systems and review which pages are cited by AI products where reporting is available.</p><h2>Implementation checklist</h2><ul class="seo-list"><li>One canonical HTTPS hostname</li><li>Correct robots and sitemap references</li><li>No broken editorial links or fake archive controls</li><li>Truthful entity and contact information</li><li>Unique titles and descriptions</li><li>Visible authorship and update dates</li><li>Valid structured data</li><li>Original content with sources and limitations</li><li>Automated link and canonical validation</li></ul><p class="seo-note">This checklist describes eligibility and good practice. It cannot guarantee indexing, ranking or citation by any search or AI system.</p></div></section>
"""


def patch_homepage() -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    text = text.replace("https://www.theblacksmithmarket.co.uk", SITE)
    text = text.replace('href="#commercial-insights">Insights</a>', 'href="blog.html">Insights</a>')
    text = re.sub(r'<meta\s+name=["\']keywords["\'][^>]*>\s*', '', text, flags=re.I)
    if 'name="robots"' not in text:
        text = text.replace('<meta name="theme-color" content="#020302">', '<meta name="theme-color" content="#020302">\n  <meta name="robots" content="index,follow">')
    canonical = '<link rel="canonical" href="https://www.theblacksmithmarket.com/">'
    extras = f'''{canonical}
  <meta property="og:site_name" content="The Blacksmith Market">
  <meta property="og:type" content="website">
  <meta property="og:title" content="The Blacksmith Market | Wholesale Stock Buying & Supplier Partnerships">
  <meta property="og:description" content="A focused UK wholesale buyer reviewing branded and excess consumer stock across selected product categories.">
  <meta property="og:url" content="{SITE}/">
  <meta property="og:image" content="{SITE}/images/og-image.jpg">
  <meta property="og:image:alt" content="The Blacksmith Market">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Blacksmith Market | Wholesale Stock Buying & Supplier Partnerships">
  <meta name="twitter:description" content="A focused UK wholesale buyer reviewing branded and excess consumer stock across selected product categories.">
  <meta name="twitter:image" content="{SITE}/images/og-image.jpg">'''
    if 'property="og:site_name"' not in text:
        text = text.replace(canonical, extras)
    if '"@id": "https://www.theblacksmithmarket.com/#website"' not in text:
        website_schema = [ORG, {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": f"{SITE}/#website",
            "url": f"{SITE}/",
            "name": "The Blacksmith Market",
            "publisher": {"@id": f"{SITE}/#organization"},
            "inLanguage": "en-GB",
        }]
        text = text.replace('</head>', f'  <script type="application/ld+json">{json_ld(website_schema)}</script>\n</head>')
    path.write_text(text, encoding="utf-8")


def normalize_remaining_html() -> None:
    rewritten = {
        "index.html", "about.html", "products.html", "partnership.html", "contact.html",
        "faq.html", "testimonials.html", "blog.html", "editorial-policy.html",
        "research-methodology.html", "ai-content-policy.html", "404.html",
        "blog/search-ai-discovery-checklist.html", "blog/uk-wholesale-distributor-guide.html",
    }
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT).as_posix()
        if rel in rewritten or rel.startswith(("artifacts/", "backup/", "node_modules/")):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        original = text
        text = text.replace("theblacksmithmarket.co.uk", "theblacksmithmarket.com")
        text = text.replace("suppliers@theblacksmithmarket.com", EMAIL)
        text = text.replace("CRN-12345678", COMPANY_NO)
        text = text.replace("Company Registration Number: 12345678", f"Company Registration Number: {COMPANY_NO}")
        text = text.replace("123 Commerce Park", "United Kingdom")
        text = text.replace("Manchester, M1 1AA", "")
        text = text.replace("+44 (0) 161 123 4567", "")
        text = text.replace("UK VAT Registered Business", "UK registered company")
        text = text.replace("Professional wholesale distribution of branded products throughout the UK and Europe.", "Wholesale stock evaluation and supplier conversations for selected consumer products.")
        text = re.sub(r'<meta\s+name=["\']keywords["\'][^>]*>\s*', '', text, flags=re.I)
        text = re.sub(r'<a\s+href=["\']#["\'][^>]*>.*?</a>', '', text, flags=re.I | re.S)
        if '<head' in text.lower() and 'rel="canonical"' not in text and "rel='canonical'" not in text:
            url_path = "/" if rel == "index.html" else "/" + rel
            text = re.sub(r'</title>', f'</title>\n    <link rel="canonical" href="{SITE}{url_path}">', text, count=1, flags=re.I)
        if '<head' in text.lower() and 'name="robots"' not in text and "name='robots'" not in text:
            text = re.sub(r'(<meta\s+name=["\']viewport["\'][^>]*>)', r'\1\n    <meta name="robots" content="index,follow">', text, count=1, flags=re.I)
        if text != original:
            path.write_text(text, encoding="utf-8")


def write_pages() -> None:
    write("css/seo-content.css", CSS)
    write("about.html", page(
        "About The Blacksmith Market | Wholesale Sourcing & Commerce Research",
        "Learn how The Blacksmith Market reviews supplier opportunities and publishes practical research on wholesale sourcing, FBA and ecommerce operations.",
        "/about.html", "about", "About", "Evidence-led supplier evaluation and commerce research.",
        "The Blacksmith Market Ltd is a UK-registered company focused on selected wholesale stock opportunities and practical operating knowledge.", ABOUT_BODY))
    write("products.html", page(
        "Product Focus | The Blacksmith Market",
        "See the consumer-product areas The Blacksmith Market may review and the product data suppliers should provide.",
        "/products.html", "products", "Product focus", "Selected categories. Clear product data.",
        "Product interest is selective and depends on exact product identity, pack configuration, documentation, availability and commercial terms.", PRODUCTS_BODY))
    write("partnership.html", page(
        "Sell Stock to Us | Supplier Information | The Blacksmith Market",
        "Supplier information for submitting branded or excess consumer stock to The Blacksmith Market for an initial commercial review.",
        "/partnership.html", "partnership", "Supplier information", "Submit a clear, reviewable product range.",
        "Useful submissions make it possible to verify the product, pack size, available quantity and commercial terms without guesswork.", PARTNERSHIP_BODY))
    write("contact.html", page(
        "Contact The Blacksmith Market",
        "Contact The Blacksmith Market about supplier ranges, website research or factual corrections.",
        "/contact.html", "contact", "Contact", "One verified contact route.",
        "The previous placeholder address, phone number and non-functional form have been removed.", CONTACT_BODY))
    faq_schema = {
        "@context": "https://schema.org", "@type": "FAQPage", "@id": f"{SITE}/faq.html#faq",
        "mainEntity": [
            {"@type": "Question", "name": "What does The Blacksmith Market review?", "acceptedAnswer": {"@type": "Answer", "text": "Selected branded and excess consumer stock where product identity, pack configuration, documentation and commercial terms can be assessed."}},
            {"@type": "Question", "name": "What should a supplier provide?", "acceptedAnswer": {"@type": "Answer", "text": "A product file with identifiers, titles, pack sizes, prices, quantities, lead times, images and applicable compliance information."}},
            {"@type": "Question", "name": "Does submission guarantee an order?", "acceptedAnswer": {"@type": "Answer", "text": "No. Submission starts an initial review only and does not create an obligation to purchase or distribute stock."}},
            {"@type": "Question", "name": "Does the site sell products to consumers?", "acceptedAnswer": {"@type": "Answer", "text": "No. The current website is informational and supplier-facing; it does not provide consumer checkout or order management."}},
        ]}
    write("faq.html", page(
        "Supplier FAQ | The Blacksmith Market",
        "Answers about supplier submissions, product information, the review process and The Blacksmith Market's current website.",
        "/faq.html", "", "Frequently asked questions", "Clear answers without unsupported operating claims.",
        "These answers describe the current public process. Individual commercial discussions may require additional information.", FAQ_BODY, schema=faq_schema))
    write("testimonials.html", page(
        "Supplier References | The Blacksmith Market",
        "Legacy supplier-reference page retained for visitors while unsupported testimonials and statistics are removed.",
        "/testimonials.html", "", "Supplier references", "Evidence before endorsement.",
        "The site will not publish testimonial names, ratings or partner figures without verification and permission.", TESTIMONIALS_BODY, robots="noindex,follow"))
    write("blog.html", page(
        "The Forge | FBA, Wholesale Sourcing & Ecommerce Automation",
        "Operator-led insights on Amazon FBA unit economics, wholesale product validation, supplier analysis and AI-assisted ecommerce operations.",
        "/blog.html", "blog", "The Forge", "Commerce operations, FBA and automation.",
        "The editorial focus is practical: methods, calculations, evidence, limitations and reusable operating tools.", BLOG_BODY))
    write("editorial-policy.html", page(
        "Editorial Policy | The Blacksmith Market",
        "How The Blacksmith Market handles evidence, authorship, corrections, disclosures and commercial independence.",
        "/editorial-policy.html", "", "Editorial policy", "Accuracy and traceability before volume.",
        "This policy applies to the Insights section and other research material published on the site.", POLICY_BODY))
    write("research-methodology.html", page(
        "Research Methodology | The Blacksmith Market",
        "The evidence hierarchy and validation methods used for commerce, sourcing and search research.",
        "/research-methodology.html", "", "Research methodology", "How claims, calculations and product matches are checked.",
        "Methods vary by subject, but the distinction between verified facts, third-party estimates and inference remains explicit.", METHODOLOGY_BODY))
    write("ai-content-policy.html", page(
        "AI Content Policy | The Blacksmith Market",
        "How AI tools may assist content and analysis without replacing evidence, verification or publisher accountability.",
        "/ai-content-policy.html", "", "AI content policy", "AI may assist. It does not become the evidence.",
        "Automation is useful when its output is checked against the question, source data and real-world constraints.", AI_POLICY_BODY))
    write("blog/search-ai-discovery-checklist.html", page(
        "A Practical Search and AI-Discovery Checklist for Small-Business Websites",
        ARTICLE_DESCRIPTION,
        "/blog/search-ai-discovery-checklist.html", "blog", "Search and AI discovery", "Make the website understandable before adding AI-specific files.",
        "A durable foundation combines consistent URLs, accurate crawl instructions, truthful identity signals and content with original value.", ARTICLE_BODY, schema=ARTICLE_SCHEMA))
    archived_schema = {"@context": "https://schema.org", "@type": "WebPage", "url": f"{SITE}/blog/uk-wholesale-distributor-guide.html", "name": "Archived article URL"}
    write("blog/uk-wholesale-distributor-guide.html", page(
        "Archived Article | The Blacksmith Market",
        "This legacy article has been withdrawn because its author attribution and unsupported business claims could not be verified.",
        "/blog/uk-wholesale-distributor-guide.html", "blog", "Archived article", "This content has been withdrawn.",
        "The former article used unverified authorship and business claims. It is retained only to provide a clear destination for old links.", '<section class="seo-section"><div class="shell seo-shell seo-article"><p>No replacement claim is being made. Visit the Insights hub for current published material.</p><div class="seo-actions"><a class="button button-gold" href="/blog.html">Go to Insights</a></div></div></section>', robots="noindex,follow", schema=archived_schema))


def write_discovery_files() -> None:
    robots = f"""User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: {SITE}/sitemap.xml
"""
    write("robots.txt", robots)
    urls = [
        "/", "/about.html", "/products.html", "/partnership.html", "/contact.html", "/faq.html",
        "/blog.html", "/blog/search-ai-discovery-checklist.html", "/editorial-policy.html",
        "/research-methodology.html", "/ai-content-policy.html", "/privacy-policy.html", "/terms.html",
    ]
    items = "\n".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod></url>" for u in urls)
    write("sitemap.xml", f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{items}
</urlset>''')
    write("llms.txt", f'''# The Blacksmith Market
> UK-based wholesale stock evaluation and operator-led research on Amazon FBA, product validation, supplier analysis and ecommerce automation.

## Primary pages
- [Home]({SITE}/)
- [About]({SITE}/about.html)
- [Product focus]({SITE}/products.html)
- [Supplier information]({SITE}/partnership.html)
- [Insights]({SITE}/blog.html)
- [Research methodology]({SITE}/research-methodology.html)
- [Editorial policy]({SITE}/editorial-policy.html)
- [AI content policy]({SITE}/ai-content-policy.html)

## Published guide
- [Search and AI-discovery checklist]({SITE}/blog/search-ai-discovery-checklist.html)

## Content principles
- Distinguish verified facts, estimates and inference.
- Do not invent authors, testimonials, statistics or operating capabilities.
- Prefer original methods, examples, calculations and reusable tools.

## Contact
- {EMAIL}
''')
    write(f"{INDEXNOW_KEY}.txt", INDEXNOW_KEY)


def write_404() -> None:
    write("404.html", page(
        "Page Not Found | The Blacksmith Market",
        "The requested page could not be found. Continue to The Blacksmith Market homepage or Insights hub.",
        "/404.html", "", "404", "The requested page was not found.",
        "The page may have been removed, renamed or linked incorrectly.", '<section class="seo-section"><div class="shell seo-shell"><div class="seo-actions"><a class="button button-gold" href="/index.html">Homepage</a><a class="button button-outline" href="/blog.html">Insights</a></div></div></section>', robots="noindex,follow"))


def write_content_manifest() -> None:
    manifest = {
        "site": SITE,
        "updated": TODAY,
        "articles": [
            {
                "slug": "search-ai-discovery-checklist",
                "path": "/blog/search-ai-discovery-checklist.html",
                "title": "A Practical Search and AI-Discovery Checklist for Small-Business Websites",
                "description": ARTICLE_DESCRIPTION,
                "publisher": "The Blacksmith Market Ltd",
                "published": TODAY,
                "modified": TODAY,
                "status": "published",
                "topic": "search-ai-discovery",
            }
        ],
    }
    write("data/content-manifest.json", json.dumps(manifest, indent=2))
    write("docs/EDITORIAL_PUBLISHING_CHECKLIST.md", '''# Editorial publishing checklist

- [ ] The subject fits an approved topic cluster.
- [ ] The page has one canonical URL on `https://www.theblacksmithmarket.com`.
- [ ] Title, description, H1 and visible content agree.
- [ ] Author or publisher attribution is accurate.
- [ ] Publication and modification dates are real.
- [ ] External factual claims use suitable sources.
- [ ] Estimates and inferences are labelled.
- [ ] Examples are real, anonymised or clearly illustrative.
- [ ] The article adds original methodology, evidence, data or experienced judgement.
- [ ] Internal links point to existing canonical pages.
- [ ] BlogPosting and breadcrumb data match visible content.
- [ ] No placeholder links, testimonials, people, addresses or statistics remain.
''')


def main() -> None:
    patch_homepage()
    write_pages()
    write_discovery_files()
    write_404()
    write_content_manifest()
    normalize_remaining_html()
    print("SEO foundation migration applied.")


if __name__ == "__main__":
    main()
