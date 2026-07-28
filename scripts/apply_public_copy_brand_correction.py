#!/usr/bin/env python3
"""Apply the public-copy, category-image, logo, favicon and Forge hierarchy correction."""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
TODAY = "2026-07-28"

CATEGORY_SOURCES = {
    "beauty-personal-care.webp": "images/B75086DF-B093-46BE-9B15-74A6BBACA7CE.png",
    "home-living.webp": "images/FFACE2C1-A8BB-4D83-95AD-C995528F8270.png",
    "toys-games-leisure.webp": "images/4B901950-2163-4529-B8CE-DED92E9144BC.png",
    "consumer-technology.webp": "images/17B43E80-8F87-4FB4-B977-1B2B26745549.png",
    "general-merchandise.webp": "images/B73F8008-0E27-4BA2-BE43-AB8C05A4467C.png",
    "digital-commerce.webp": "images/D245B908-57CD-4E15-8354-FECADDAF5845.png",
}

FAVICON_BLOCK = """
  <link rel="icon" href="/images/favicon-tbm.svg" type="image/svg+xml">
  <link rel="icon" href="/images/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
""".rstrip()

FORGE_FOOTER = (
    '<div><h3>The Forge</h3>'
    '<a href="/blog.html">Blog &amp; Resources</a>'
    '<a href="/blog.html#latest-articles">Latest articles</a>'
    '<a href="/blog.html#browse-topics">Browse topics</a>'
    '</div><div><h3>Information</h3>'
)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one exact match, found {count}")
    return text.replace(old, new, 1)


def sub_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"{label}: expected one regex match, found {count}")
    return updated


def common_html(text: str) -> str:
    # Use a new favicon URL to avoid stale browser cache and use the canonical logo everywhere.
    text = re.sub(r"\s*<link rel=\"(?:icon|apple-touch-icon)\"[^>]*>", "", text)
    text = text.replace("</head>", f"\n{FAVICON_BLOCK}\n</head>", 1)
    text = text.replace("tbm-logo.svg", "tbm-logo-actual.svg")

    footer_pattern = r'<div><h3>The Forge</h3>.*?</div><div><h3>Information</h3>'
    text = re.sub(footer_pattern, FORGE_FOOTER, text, flags=re.DOTALL)
    return text


def update_index() -> None:
    text = read("index.html")

    text = replace_once(
        text,
        "Selected categories considered through a practical commercial lens.",
        "Explore products for modern life.",
        "homepage category heading",
    )
    text = replace_once(
        text,
        "Explore broad opportunity areas without treating every category as continuously purchased or offered for sale.",
        "Discover categories spanning beauty, home, leisure, technology and more.",
        "homepage category introduction",
    )
    text = replace_once(text, "View all opportunities", "Browse all categories", "homepage category link")

    text = sub_once(
        text,
        r'<div class="sector-filters".*?</div>',
        "",
        "homepage sector filters",
    )
    text = re.sub(r'<p class="sector-network__callout">.*?</p>', "", text, flags=re.DOTALL)
    text = re.sub(r'<p class="sector-network__legend">.*?</p>', "", text, flags=re.DOTALL)

    sector_updates = {
        "beauty": (
            "Beauty &amp; Personal Care",
            "Skincare, cosmetics and everyday personal-care products.",
            "Established brands, emerging ideas and distinctive ranges.",
            "Explore Beauty &amp; Personal Care.",
            "images/categories/beauty-personal-care.webp",
            "Beauty &amp;<br>Personal Care",
        ),
        "home-kitchen": (
            "Home &amp; Living",
            "Products for the home, kitchen and everyday living.",
            "Practical essentials and design-led ranges.",
            "Explore Home &amp; Living.",
            "images/categories/home-living.webp",
            "Home &amp;<br>Living",
        ),
        "toys-games": (
            "Toys, Games &amp; Leisure",
            "Toys, games and leisure products for different interests and occasions.",
            "From familiar favourites to new entertainment ideas.",
            "Explore Toys, Games &amp; Leisure.",
            "images/categories/toys-games-leisure.webp",
            "Toys, Games<br>&amp; Leisure",
        ),
        "electronics": (
            "Consumer Technology",
            "Devices, accessories and connected everyday technology.",
            "Practical products shaped by changing consumer habits.",
            "Explore Consumer Technology.",
            "images/categories/consumer-technology.webp",
            "Consumer<br>Technology",
        ),
        "general-merchandise": (
            "General Merchandise",
            "A varied mix of useful products across everyday categories.",
            "Flexible opportunities across different consumer needs.",
            "Explore General Merchandise.",
            "images/categories/general-merchandise.webp",
            "General<br>Merchandise",
        ),
    }

    for key, (title, demand, review, fit, image, heading) in sector_updates.items():
        pattern = (
            rf'(data-sector-card="{re.escape(key)}") '
            r'data-tags="[^"]*" data-title="[^"]*" data-demand="[^"]*" '
            r'data-review="[^"]*" data-fit="[^"]*"'
        )
        replacement = (
            rf'\1 data-tags="all" data-title="{title}" '
            rf'data-demand="{demand}" data-review="{review}" data-fit="{fit}"'
        )
        text, count = re.subn(pattern, replacement, text, count=1)
        if count != 1:
            raise RuntimeError(f"homepage {key} card attributes: expected one match, found {count}")

        card_pattern = (
            rf'(<button class="sector-card[^"]*"[^>]*data-sector-card="{re.escape(key)}".*?'
            r'<img class="sector-card__image" src=")[^"]+(" alt="">.*?<h3>).*?(</h3>)'
        )
        card_replacement = rf'\1{image}\2{heading}\3'
        text, count = re.subn(card_pattern, card_replacement, text, count=1, flags=re.DOTALL)
        if count != 1:
            raise RuntimeError(f"homepage {key} card image/title: expected one match, found {count}")

    text = sub_once(
        text,
        r'<div class="sector-detail" data-sector-detail aria-live="polite">.*?</div>',
        '<div class="sector-detail" data-sector-detail aria-live="polite"><strong>Toys, Games &amp; Leisure</strong><span>Toys, games and leisure products for different interests and occasions.</span><span>From familiar favourites to new entertainment ideas.</span><span>Explore Toys, Games &amp; Leisure.</span></div>',
        "homepage initial sector detail",
    )

    how_section = '''<section class="v6-section" id="how-we-buy" aria-labelledby="how-title"><div class="shell"><header class="v6-heading"><div><p class="eyebrow"><span></span>How we connect</p><h2 id="how-title">From first introduction to the right next step.</h2></div><p class="v6-heading__body">A straightforward way to explore products, partnerships and ideas.</p></header><ol class="process-v6"><li class="process-v6__step"><span class="process-v6__number">01</span><h3>Discover</h3><p>Explore product categories, partnerships and ideas across modern commerce.</p><i>→</i></li><li class="process-v6__step"><span class="process-v6__number">02</span><h3>Introduce</h3><p>Share a product, range, business or opportunity worth discussing.</p><i>→</i></li><li class="process-v6__step"><span class="process-v6__number">03</span><h3>Explore</h3><p>Talk through the potential and identify the most useful next step.</p><i>→</i></li><li class="process-v6__step"><span class="process-v6__number">04</span><h3>Build</h3><p>Move forward together when the opportunity and timing are right.</p><i>✓</i></li></ol></div></section>'''
    text = sub_once(
        text,
        r'<section class="v6-section" id="how-we-buy".*?</section>',
        how_section,
        "homepage how-we-connect section",
    )

    values_section = '''<section class="v6-section" id="commercial-insights" aria-labelledby="insights-title"><div class="shell"><header class="v6-heading"><div><p class="eyebrow"><span></span>What matters</p><h2 id="insights-title">Good products. Strong relationships. Clear potential.</h2></div><p class="v6-heading__body">We focus on opportunities that make sense for the people and businesses involved.</p></header><div class="insights-v6"><article class="insights-v6__main"><h3>Built around the right fit.</h3><p>The best opportunities combine a relevant product, a clear proposition and a practical route forward.</p><div class="insights-v6__signal" aria-hidden="true"><svg viewBox="0 0 640 170" preserveAspectRatio="none"><path d="M0 142 C80 116 108 132 160 88 S254 112 305 62 S415 104 470 52 S555 64 640 18"/></svg></div></article><aside class="insights-v6__criteria" aria-label="What matters to The Blacksmith Market"><div><b>01</b><div><strong>Relevant products</strong><span>Useful, distinctive or well-positioned ideas</span></div><i aria-hidden="true"></i></div><div><b>02</b><div><strong>Strong partnerships</strong><span>Clear communication and shared potential</span></div><i aria-hidden="true"></i></div><div><b>03</b><div><strong>Practical progress</strong><span>A sensible path from conversation to action</span></div><i aria-hidden="true"></i></div></aside></div></div></section>'''
    text = sub_once(
        text,
        r'<section class="v6-section" id="commercial-insights".*?</section>',
        values_section,
        "homepage values section",
    )

    supplier_section = '''<section class="section"><div class="shell readiness-panel"><div class="readiness-copy"><p class="eyebrow"><span></span>Supplier partnerships</p><h2>Have a product or range to share?</h2><p>Introduce your business and tell us what makes the opportunity worth exploring.</p><a class="button button-outline" href="partnership.html">Sell to Us</a></div><div class="readiness-visual" aria-hidden="true"></div><div class="readiness-list"><h3>Start with the essentials</h3><ul><li><span>01</span>Your business</li><li><span>02</span>Products or range</li><li><span>03</span>Availability</li><li><span>04</span>Commercial overview</li><li><span>05</span>Contact details</li></ul></div></div></section>'''
    text = sub_once(
        text,
        r'<section class="section"><div class="shell readiness-panel">.*?</section>',
        supplier_section,
        "homepage supplier section",
    )

    text = text.replace("<small>Registered commercial platform</small>", "<small>Registered in England and Wales</small>")
    text = text.replace("<small>Selected opportunity areas</small>", "<small>Products across varied sectors</small>")
    text = text.replace("<small>Clear information and review</small>", "<small>Direct commercial conversations</small>")
    text = text.replace("<small>Modern commerce resources</small>", "<small>Blog and resources</small>")

    write("index.html", common_html(text))


def update_products() -> None:
    text = read("products.html")
    text = replace_once(text, "Selected categories. Open commercial thinking.", "Products, categories and new possibilities.", "products hero heading")
    text = replace_once(
        text,
        "The Blacksmith Market considers product and partnership opportunities across selected categories, subject to product fit, commercial terms, availability and route to market.",
        "Explore the areas shaping The Blacksmith Market—from everyday essentials to technology and digital commerce.",
        "products hero lead",
    )
    text = replace_once(text, "Categories currently considered", "Browse by category", "products category heading")
    text = replace_once(
        text,
        "Interest varies by opportunity. A category appearing here does not mean every product is continuously purchased or currently offered for sale.",
        "Discover a growing mix of product areas, ideas and commercial opportunities.",
        "products category introduction",
    )

    replacements = {
        "/assets/tbm-cinematic-v6/product-focus/beauty.webp": "/images/categories/beauty-personal-care.webp",
        "/assets/tbm-cinematic-v6/product-focus/home-kitchen.webp": "/images/categories/home-living.webp",
        "/assets/tbm-cinematic-v6/product-focus/toys-games.webp": "/images/categories/toys-games-leisure.webp",
        "/assets/tbm-cinematic-v6/product-focus/electronics.webp": "/images/categories/consumer-technology.webp",
        "/assets/tbm-cinematic-v6/product-focus/general-merchandise.webp": "/images/categories/general-merchandise.webp",
        "/images/site/digital-commerce.svg": "/images/categories/digital-commerce.webp",
        "Selected branded and commercial opportunities, subject to product fit, documentation and route-to-market considerations.": "Beauty, skincare and personal-care products for everyday routines and evolving consumer tastes.",
        "Practical products across home, kitchen, organisation and lifestyle categories.": "Products for the home, kitchen, organisation and everyday living.",
        "Opportunities assessed with attention to seasonality, audience, product identity and compliance.": "Toys, games and leisure products for different ages, interests and occasions.",
        "Selected devices, accessories and related products where specifications and commercial terms are clear.": "Devices and accessories for connected, practical everyday use.",
        "Other product opportunities that do not fit neatly into one category but have a clear proposition.": "A varied mix of useful products across multiple consumer categories.",
        "Future digital offerings": "Digital commerce",
        "Tools, resources or services connected to modern commerce may be developed separately and will be clearly labelled when available.": "Ideas, tools and resources connected to ecommerce, retail and modern business.",
    }
    for old, new in replacements.items():
        if old not in text:
            raise RuntimeError(f"products replacement missing: {old}")
        text = text.replace(old, new, 1)

    ways_section = '''<section class="content-band content-band--soft"><div class="shell seo-shell split-layout"><div><h2>Ways we connect</h2><div class="feature-list"><div class="feature-row"><strong>01</strong><div><h3>Products &amp; ranges</h3><p>Selected products, brands and ranges across our core categories.</p></div></div><div class="feature-row"><strong>02</strong><div><h3>Supplier partnerships</h3><p>Direct relationships built around shared commercial potential.</p></div></div><div class="feature-row"><strong>03</strong><div><h3>Wholesale &amp; B2B</h3><p>Business-to-business opportunities across products, supply and commercial partnerships.</p></div></div><div class="feature-row"><strong>04</strong><div><h3>Digital commerce</h3><p>Ideas, resources and projects connected to ecommerce, retail and modern business.</p></div></div></div></div><aside class="info-panel"><p class="seo-kicker">Start a conversation</p><h3>Have a product, range or partnership in mind?</h3><p>Tell us what you are working on and where you see the opportunity.</p><a class="button button-gold" href="/contact.html">Get in touch</a></aside></div></section>'''
    text = sub_once(
        text,
        r'<section class="content-band content-band--soft"><div class="shell seo-shell split-layout"><div><h2>Opportunity types</h2>.*?</section>',
        ways_section,
        "products ways-we-connect section",
    )

    old_description = "Explore product categories and commercial opportunities considered by The Blacksmith Market, from consumer goods to future modern-commerce offerings."
    new_description = "Explore beauty, home, leisure, technology, general merchandise and digital commerce at The Blacksmith Market."
    text = text.replace(old_description, new_description)
    write("products.html", common_html(text))


def update_about() -> None:
    text = read("about.html")
    text = replace_once(
        text,
        "A flexible commercial platform for products, partnerships and modern commerce.",
        "Built around products, partnerships and new possibilities.",
        "about hero heading",
    )
    text = replace_once(
        text,
        "The Blacksmith Market connects selected commercial opportunities with practical thinking about how modern commerce is changing.",
        "The Blacksmith Market brings together selected product categories, commercial relationships and ideas for modern commerce.",
        "about hero lead",
    )
    forge_section = '''<section class="content-band"><div class="shell seo-shell split-layout"><div><p class="eyebrow"><span></span>The Forge</p><h2>Ideas for a changing market.</h2><p class="content-intro">Through The Forge, we share perspectives on ecommerce, retail technology, AI and the tools influencing modern business.</p><div class="seo-actions"><a class="button button-gold" href="/blog.html">Explore Blog &amp; Resources</a></div></div></div></section>'''
    text = sub_once(
        text,
        r'<section class="content-band"><div class="shell seo-shell split-layout"><div><p class="eyebrow"><span></span>The Forge</p>.*?</section>',
        forge_section,
        "about Forge section",
    )
    write("about.html", common_html(text))


def update_contact() -> None:
    text = read("contact.html")
    text = replace_once(text, "Start the right conversation.", "Let’s talk.", "contact hero heading")
    text = replace_once(
        text,
        "Use the route that best matches your enquiry, with email available as the verified fallback.",
        "Whether you have a product, partnership or idea to discuss, choose the route that fits best.",
        "contact hero lead",
    )
    text = replace_once(
        text,
        "This is the verified fallback contact route until a form provider is configured and documented.",
        "Email us directly for general enquiries and introductions.",
        "contact email card",
    )
    contact_cta = '''<section class="content-band content-band--soft"><div class="shell seo-shell split-layout"><div><h2>Have something worth discussing?</h2><p class="content-intro">Send a short introduction and we’ll take it from there.</p></div><div class="seo-actions"><a class="button button-gold" href="mailto:info@theblacksmithmarket.com">Email The Blacksmith Market</a></div></div></section>'''
    text = sub_once(
        text,
        r'<section class="content-band content-band--soft"><div class="shell seo-shell split-layout"><div><h2>Optional website form</h2>.*?</section>',
        contact_cta,
        "contact closing CTA",
    )
    old_description = "Contact The Blacksmith Market about product opportunities, commercial partnerships, The Forge resources or factual corrections."
    new_description = "Contact The Blacksmith Market about products, supplier partnerships, commercial opportunities or The Forge."
    text = text.replace(old_description, new_description)
    write("contact.html", common_html(text))


def update_blog() -> None:
    text = read("blog.html")
    old_description = "The Forge publishes practical resources about AI, ecommerce, online business, digital retail, emerging technology, wholesale and B2B commerce."
    new_description = "Explore practical guides from The Forge about ecommerce, AI, retail technology, digital discovery and modern business."
    text = text.replace(old_description, new_description)
    text = replace_once(
        text,
        "Ideas, tools and shifts shaping modern commerce.",
        "Practical guides and perspectives on ecommerce, AI, retail technology and modern business.",
        "blog hero lead",
    )
    text = replace_once(text, "Broad topics. Practical interpretation.", "Explore ideas shaping modern commerce.", "blog introduction heading")
    text = replace_once(
        text,
        "The Forge covers changes that affect how products and businesses are discovered, sold and operated. Articles separate live capability from emerging claims and focus on what can be acted on.",
        "Read practical perspectives on the technologies, channels and ideas changing how modern businesses operate and grow.",
        "blog introduction copy",
    )
    text = sub_once(
        text,
        r'<div class="tag-list">.*?</div>',
        '<div class="tag-list"><a href="#latest-articles">Latest articles</a><a href="#browse-topics">Browse topics</a><a href="/editorial-standards.html">Editorial standards</a></div>',
        "blog quick navigation",
    )
    text = text.replace('<div class="tbm-card-grid">', '<div class="tbm-card-grid" id="latest-articles">', 1)
    text = text.replace('href="/blog/agentic-commerce-2026.html"', 'id="topic-ai-automation" href="/blog/agentic-commerce-2026.html"', 1)
    text = text.replace('href="/blog/search-chat-cart-product-discovery.html"', 'id="topic-digital-retail" href="/blog/search-chat-cart-product-discovery.html"', 1)
    text = text.replace('href="/blog/unified-commerce-small-business.html"', 'id="topic-ecommerce" href="/blog/unified-commerce-small-business.html"', 1)
    text = text.replace('href="/blog/ecommerce-tools-technologies-2026.html"', 'id="topic-technology" href="/blog/ecommerce-tools-technologies-2026.html"', 1)

    checklist_card = '''<div class="tbm-card-grid tbm-card-grid--single"><a class="tbm-card tbm-card--resource" data-spotlight-card href="/blog/search-ai-discovery-checklist.html"><div class="tbm-card__content"><span class="tbm-card__label">Site &amp; Search</span><h3>A Practical Search and AI-Discovery Checklist</h3><p>A technical guide to crawlability, structured data, internal links and search visibility.</p><span class="article-link">Read article →</span></div></a></div>'''
    text = sub_once(
        text,
        r'<div class="info-panel" style="margin-top:1\.5rem">.*?</div>',
        checklist_card,
        "blog checklist card",
    )

    topics_section = '''<section class="content-band content-band--soft" id="browse-topics"><div class="shell seo-shell"><p class="eyebrow"><span></span>Browse the collection</p><h2>Browse by topic</h2><nav class="topic-navigation" aria-label="Browse articles by topic"><a href="#latest-articles">All articles</a><a href="#topic-ai-automation">AI &amp; Automation</a><a href="#topic-ecommerce">Ecommerce &amp; Online Business</a><a href="#topic-digital-retail">Discovery &amp; Digital Retail</a><a href="#topic-technology">Tools &amp; Technology</a></nav></div></section>'''
    text = sub_once(
        text,
        r'<section class="content-band content-band--soft"><div class="shell seo-shell"><h2>Research areas</h2>.*?</section>',
        topics_section,
        "blog topic navigation",
    )

    about_forge = '''<section class="content-band"><div class="shell seo-shell split-layout"><div><h2>About The Forge</h2><p class="content-intro">The Forge is the editorial home of The Blacksmith Market, bringing together articles and resources about ecommerce, AI, digital retail and modern business.</p><div class="seo-actions"><a class="button button-outline" href="/editorial-standards.html">Editorial Standards</a></div></div></div></section>'''
    text = sub_once(
        text,
        r'<section class="content-band"><div class="shell seo-shell split-layout"><div><h2>How The Forge is prepared</h2>.*?</section>',
        about_forge,
        "blog About The Forge section",
    )
    write("blog.html", common_html(text))


def update_common_pages() -> None:
    handled = {"index.html", "products.html", "about.html", "contact.html", "blog.html"}
    targets = list(ROOT.glob("*.html")) + list((ROOT / "blog").glob("*.html"))
    for path in targets:
        rel = path.relative_to(ROOT).as_posix()
        if rel in handled:
            continue
        text = common_html(path.read_text(encoding="utf-8"))
        path.write_text(text, encoding="utf-8")


def update_styles() -> None:
    path = ROOT / "css/seo-content-v2.css"
    text = path.read_text(encoding="utf-8")
    marker = "/* Public-copy and navigation correction */"
    if marker in text:
        return
    text += '''

/* Public-copy and navigation correction */
.topic-navigation{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.5rem}.topic-navigation a{display:inline-flex;align-items:center;min-height:44px;padding:.72rem 1rem;border:1px solid rgba(200,164,91,.32);border-radius:999px;color:#e8e2d6;text-decoration:none;background:rgba(255,255,255,.025);transition:border-color .2s ease,background .2s ease,transform .2s ease}.topic-navigation a:hover,.topic-navigation a:focus-visible{border-color:rgba(220,176,88,.8);background:rgba(200,164,91,.09);transform:translateY(-1px)}.tbm-card-grid--single{grid-template-columns:minmax(0,1fr);max-width:760px;margin-top:1.5rem}.seo-page .seo-menu-toggle{position:relative;display:inline-grid;place-items:center;width:56px;height:56px;padding:0}.seo-page .seo-menu-toggle span{position:absolute;left:50%;top:50%;width:22px;height:1px;background:#f3efe5;transform-origin:center}.seo-page .seo-menu-toggle span:first-child{transform:translate(-50%,-4px)}.seo-page .seo-menu-toggle span:last-child{transform:translate(-50%,4px)}.seo-page .seo-menu-toggle[aria-expanded="true"] span:first-child{transform:translate(-50%,0) rotate(45deg)}.seo-page .seo-menu-toggle[aria-expanded="true"] span:last-child{transform:translate(-50%,0) rotate(-45deg)}@media(max-width:700px){#product-focus .v6-heading h2{font-size:clamp(3rem,14vw,4.6rem);line-height:.94}.topic-navigation{display:grid;grid-template-columns:1fr}.topic-navigation a{width:100%}}
'''
    path.write_text(text, encoding="utf-8")


def prepare_images() -> None:
    output_dir = ROOT / "images/categories"
    output_dir.mkdir(parents=True, exist_ok=True)
    for output_name, source_rel in CATEGORY_SOURCES.items():
        source = ROOT / source_rel
        if not source.is_file():
            raise RuntimeError(f"missing uploaded category image: {source_rel}")
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            image = ImageOps.fit(image, (1200, 1500), method=Image.Resampling.LANCZOS)
            image.save(output_dir / output_name, "WEBP", quality=84, method=6)

    favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title"><title id="title">The Blacksmith Market</title><circle cx="256" cy="256" r="246" fill="#f4e8bd"/><circle cx="256" cy="256" r="226" fill="none" stroke="#080908" stroke-width="14"/><circle cx="256" cy="256" r="182" fill="none" stroke="#080908" stroke-width="8"/><text x="256" y="236" text-anchor="middle" fill="#080908" font-family="Arial Black,Arial,sans-serif" font-size="86" font-weight="900" letter-spacing="4">TBM</text><path fill="#080908" d="M142 270h228v24h-38c-18 0-34 7-47 20l-18 18c-13 13-15 32-4 47 8 12 22 19 37 19h18v48h-54l-8 10-8-10h-54v-48h18c15 0 29-7 37-19 11-15 9-34-4-47l-18-18c-13-13-29-20-47-20h-38z"/></svg>'''
    (ROOT / "images/favicon-tbm.svg").write_text(favicon_svg, encoding="utf-8")

    def build_icon(size: int, path: Path) -> None:
        scale = 4
        canvas_size = size * scale
        image = Image.new("RGB", (canvas_size, canvas_size), "#f4e8bd")
        draw = ImageDraw.Draw(image)
        dark = "#080908"
        margin = int(canvas_size * .035)
        draw.ellipse((margin, margin, canvas_size - margin, canvas_size - margin), outline=dark, width=max(3, int(canvas_size * .026)))
        inner = int(canvas_size * .115)
        draw.ellipse((inner, inner, canvas_size - inner, canvas_size - inner), outline=dark, width=max(2, int(canvas_size * .014)))
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(canvas_size * .17))
        except OSError:
            font = ImageFont.load_default()
        draw.text((canvas_size / 2, canvas_size * .43), "TBM", fill=dark, font=font, anchor="mm")
        y = canvas_size * .56
        draw.rectangle((canvas_size * .27, y, canvas_size * .73, y + canvas_size * .05), fill=dark)
        draw.polygon([
            (canvas_size * .36, y + canvas_size * .05),
            (canvas_size * .64, y + canvas_size * .05),
            (canvas_size * .58, y + canvas_size * .16),
            (canvas_size * .42, y + canvas_size * .16),
        ], fill=dark)
        image.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG", optimize=True)

    build_icon(48, ROOT / "images/favicon-48.png")
    build_icon(180, ROOT / "images/apple-touch-icon.png")


def update_manifest() -> None:
    path = ROOT / "data/content-manifest.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["updated"] = TODAY
    changed = {
        "/", "/about.html", "/products.html", "/blog.html", "/partnership.html",
        "/contact.html", "/faq.html", "/editorial-standards.html", "/privacy-policy.html",
        "/terms.html", "/404.html",
    }
    changed.update(article["path"] for article in data.get("articles", []))
    for page in data.get("pages", []):
        if page.get("path") in changed:
            page["lastmod"] = TODAY
    for article in data.get("articles", []):
        article["modified"] = TODAY
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def update_validator() -> None:
    path = ROOT / "scripts/validate_corrective_surface.py"
    text = path.read_text(encoding="utf-8")

    old_assets = '''CARD_ASSETS = [
    "css/secondary-cards.css",
    "js/card-spotlight.js",
    "images/site/digital-commerce.svg",
    "images/site/about-products.svg",
    "images/site/about-partnerships.svg",
    "images/site/about-modern-commerce.svg",
]'''
    new_assets = '''CARD_ASSETS = [
    "css/secondary-cards.css",
    "js/card-spotlight.js",
    "images/site/about-products.svg",
    "images/site/about-partnerships.svg",
    "images/site/about-modern-commerce.svg",
    "images/favicon-tbm.svg",
    "images/favicon-48.png",
    "images/apple-touch-icon.png",
    "images/categories/beauty-personal-care.webp",
    "images/categories/home-living.webp",
    "images/categories/toys-games-leisure.webp",
    "images/categories/consumer-technology.webp",
    "images/categories/general-merchandise.webp",
    "images/categories/digital-commerce.webp",
]'''
    text = replace_once(text, old_assets, new_assets, "validator card assets")

    old_images = '''PRODUCT_IMAGES = [
    "/assets/tbm-cinematic-v6/product-focus/beauty.webp",
    "/assets/tbm-cinematic-v6/product-focus/home-kitchen.webp",
    "/assets/tbm-cinematic-v6/product-focus/toys-games.webp",
    "/assets/tbm-cinematic-v6/product-focus/electronics.webp",
    "/assets/tbm-cinematic-v6/product-focus/general-merchandise.webp",
    "/images/site/digital-commerce.svg",
]'''
    new_images = '''PRODUCT_IMAGES = [
    "/images/categories/beauty-personal-care.webp",
    "/images/categories/home-living.webp",
    "/images/categories/toys-games-leisure.webp",
    "/images/categories/consumer-technology.webp",
    "/images/categories/general-merchandise.webp",
    "/images/categories/digital-commerce.webp",
]'''
    text = replace_once(text, old_images, new_images, "validator product images")

    insertion = '''

PROHIBITED_PUBLIC_COPY = (
    "does not mean every product is continuously purchased",
    "without treating every category as continuously purchased",
    "only presented as live once",
    "the website should not imply a capability",
    "verified fallback contact route",
    "optional website form",
    "no placeholder form endpoint",
    "market lens",
    "review lens",
    "opportunity lens",
    "conceptual evaluation signals only",
    "submission does not guarantee a purchase",
)
'''
    text = text.replace("\n\ndef fail(message: str) -> None:", insertion + "\n\ndef fail(message: str) -> None:", 1)

    common_checks = '''

for rel in public_files:
    text = read(rel)
    lower = text.lower()
    for phrase in PROHIBITED_PUBLIC_COPY:
        if phrase in lower:
            fail(f"{rel}: internal or disclaimer-style public copy remains: {phrase}")
    if "tbm-logo.svg" in text:
        fail(f"{rel}: legacy visible logo reference remains")
    if "/images/favicon-tbm.svg" not in text:
        fail(f"{rel}: canonical favicon reference missing")
    if "blog.html#ai-automation" in text or "blog.html#digital-retail" in text or "blog.html#wholesale-b2b" in text:
        fail(f"{rel}: topic link is incorrectly exposed as a global footer section")
'''
    text = text.replace("\nfor rel, minimum_cards in CARD_PAGES.items():", common_checks + "\nfor rel, minimum_cards in CARD_PAGES.items():", 1)

    old_markers = '''for marker in (
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
):'''
    new_markers = '''for marker in (
    "Products &amp; Opportunities",
    "Blog &amp; Resources",
    "From The Forge",
    "Explore products for modern life.",
    "From first introduction to the right next step.",
    "Good products. Strong relationships. Clear potential.",
    "js/tbm-cinematic-v10.js",
    "js/home-v2.js",
    "js/tbm-product-network-v7.js",
):'''
    text = replace_once(text, old_markers, new_markers, "validator homepage markers")

    blog_check = '''
for marker in ('id="latest-articles"', 'id="browse-topics"', "Browse by topic"):
    if marker not in blog:
        fail(f"blog.html missing hub hierarchy marker: {marker}")
if "Research areas" in blog:
    fail("blog.html still presents topics as separate research-area sections")
'''
    text = text.replace(
        'if "The Forge" not in blog or "Blog &amp; Resources" not in blog:\n    fail("blog.html must use The Forge as the editorial brand and Blog & Resources as the functional label")\n',
        'if "The Forge" not in blog or "Blog &amp; Resources" not in blog:\n    fail("blog.html must use The Forge as the editorial brand and Blog & Resources as the functional label")\n' + blog_check,
        1,
    )
    path.write_text(text, encoding="utf-8")


def main() -> None:
    prepare_images()
    update_index()
    update_products()
    update_about()
    update_contact()
    update_blog()
    update_common_pages()
    update_styles()
    update_manifest()
    update_validator()
    print("Public copy, brand assets, category images and Forge hierarchy updated.")


if __name__ == "__main__":
    main()
