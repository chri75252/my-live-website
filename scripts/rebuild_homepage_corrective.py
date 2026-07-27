#!/usr/bin/env python3
"""Rebuild the corrective homepage from the unmodified main-branch V10 baseline."""
from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SHA256 = "a958081fd57d53e3a6da0bd88b02d0896729778bc967931b716e139443cf60d3"


def replace_required(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Required homepage snippet not found: {old[:140]}")
    return text.replace(old, new)


text = subprocess.check_output(
    ["git", "show", "origin/main:index.html"], cwd=ROOT, text=True, encoding="utf-8"
)

replacements = [
    ("The Blacksmith Market | Wholesale Stock Buying & Supplier Partnerships", "The Blacksmith Market | Products, Partnerships & Modern Commerce"),
    ("A focused UK wholesale buyer reviewing branded and excess consumer stock across selected product categories.", "The Blacksmith Market explores selected product opportunities, supplier partnerships and practical ideas shaping ecommerce, retail and online business."),
    ("A focused UK wholesale buyer for branded and excess consumer stock. Clear evaluation, commercially grounded offers and a straightforward supplier process.", "A UK company exploring selected product opportunities, supplier relationships and the technologies reshaping how businesses discover, sell and grow."),
    ("<p class=\"eyebrow\"><span></span>Premium wholesale partnerships</p>", "<p class=\"eyebrow\"><span></span>Products, partnerships and modern commerce</p>"),
    ("<a class=\"button button-gold\" href=\"contact.html\"><span>Sell to Us</span>", "<a class=\"button button-gold\" href=\"products.html\"><span>Explore Opportunities</span>"),
    ("<a class=\"button button-outline\" href=\"#product-focus\"><span>Explore Product Focus</span>", "<a class=\"button button-outline\" href=\"blog.html\"><span>Visit The Forge</span>"),
    ("aria-label=\"Supplier process highlights\"", "aria-label=\"Business focus highlights\""),
    ("<strong>Clear review</strong><small>Structured product evaluation</small>", "<strong>Practical review</strong><small>Clear opportunity assessment</small>"),
    ("<strong>Commercial focus</strong><small>Data-led buying decisions</small>", "<strong>Commercial focus</strong><small>Terms and fit considered</small>"),
    ("<strong>Direct process</strong><small>One clear supplier route</small>", "<strong>Open direction</strong><small>Products, partnerships and ideas</small>"),
    ("Built for practical supplier conversations", "Built for practical commercial conversations"),
    ("<strong>UK-focused</strong><small>Consumer stock sourcing</small>", "<strong>UK company</strong><small>Registered commercial platform</small>"),
    ("<strong>Multi-category</strong><small>Selected product sectors</small>", "<strong>Multi-category</strong><small>Selected opportunity areas</small>"),
    ("<strong>Data-led</strong><small>Commercial evaluation</small>", "<strong>Practical</strong><small>Clear information and review</small>"),
    ("<strong>Direct contact</strong><small>Supplier-first process</small>", "<strong>The Forge</strong><small>Modern commerce resources</small>"),
    ("<p class=\"eyebrow\"><span></span>Product focus</p>", "<p class=\"eyebrow\"><span></span>Products &amp; opportunities</p>"),
    ("Selected consumer categories with practical resale demand.", "Selected categories considered through a practical commercial lens."),
    ("Explore the connected category lens used to structure a clear commercial conversation.<a class=\"v6-heading__link\" href=\"#how-we-buy\">How we evaluate</a>", "Explore broad opportunity areas without treating every category as continuously purchased or offered for sale.<a class=\"v6-heading__link\" href=\"products.html\">View all opportunities</a>"),
    (">High demand</button>", ">Category relevance</button>"),
    (">Evergreen</button>", ">Everyday use</button>"),
    (">Fast moving</button>", ">Seasonal fit</button>"),
    (">High margin</button>", ">Commercial review</button>"),
    ("Demand — high and rising across multiple channels.", "Market lens — consumer relevance and category fit."),
    ("Review route — category specialists and streamlined checks.", "Review lens — identity, documentation and commercial terms."),
    ("Buying fit — repeat potential with commercial margin.", "Opportunity lens — assessed case by case."),
    ("Demand — practical, repeat consumer categories.", "Market lens — practical use and category relevance."),
    ("Review route — product and pack-detail checks.", "Review lens — product identity, terms and route to market."),
    ("Buying fit — established resale demand.", "Opportunity lens — assessed case by case."),
    ("Demand — seasonal and repeat customer demand.", "Market lens — audience, seasonality and category fit."),
    ("Review route — demand, documentation and channel fit.", "Review lens — documentation, product identity and route to market."),
    ("Buying fit — strong margin potential with repeat sales.", "Opportunity lens — assessed case by case."),
    ("Demand — strong channel-specific replacement demand.", "Market lens — use case, compatibility and category fit."),
    ("Review route — compliance, product detail and sell-through.", "Review lens — specifications, documentation and commercial terms."),
    ("Buying fit — selective opportunities with clear data.", "Opportunity lens — assessed case by case."),
    ("Demand — broad opportunities across practical categories.", "Market lens — broad category relevance."),
    ("Review route — range, fulfilment and commercial checks.", "Review lens — range, availability and commercial terms."),
    ("Buying fit — flexible category scope.", "Opportunity lens — assessed case by case."),
    ("All sectors connect to one sourcing and review system for consistent commercial outcomes.", "Categories are considered through one practical commercial framework."),
    ("<p class=\"eyebrow\"><span></span>How we buy</p>", "<p class=\"eyebrow\"><span></span>How opportunities are reviewed</p>"),
    ("Simple. Transparent. Built for suppliers.", "Clear information. Practical assessment. Direct conversation."),
    ("Four clear stages from initial product information to a commercially grounded decision.", "A simple route from initial information to a decision on whether a conversation should continue."),
    ("<h3>Submit Your Range</h3><p>Share your product file, pricing, pack sizes and essential supplier information.</p>", "<h3>Share the opportunity</h3><p>Provide the product, quantity, pricing, availability and essential context.</p>"),
    ("<h3>Commercial Review</h3><p>We assess demand, competition, margin, documentation and operational fit.</p>", "<h3>Review the fit</h3><p>Consider identity, terms, documentation, route to market and operational requirements.</p>"),
    ("<h3>Clarification</h3><p>We may request samples, documents or further commercial information.</p>", "<h3>Clarify where relevant</h3><p>Resolve material questions before treating an opportunity as commercially actionable.</p>"),
    ("<h3>Offer &amp; Purchase</h3><p>Where the range fits, we agree the commercial route and next steps.</p>", "<h3>Continue or close</h3><p>Move forward only where a potential fit exists; submission does not guarantee a purchase.</p>"),
    ("<p class=\"eyebrow\"><span></span>Commercial insights</p>", "<p class=\"eyebrow\"><span></span>Commercial lens</p>"),
    ("What makes a range commercially workable?", "A clearer way to evaluate an opportunity."),
    ("Commercial context can be assessed through a small set of practical buying signals.", "Evaluation signals are contextual. They are not a live market-data feed or a promise of purchase."),
    ("Evidence before instinct.", "Evidence before assumptions."),
    ("Useful supplier data makes it easier to identify, validate and evaluate a product range before a buying decision.", "Useful review brings the product, commercial terms and operational reality into the same conversation."),
    ("Product Identity", "Product fit"),
    ("EAN, title, pack size and exact variant", "Identity, use and category context"),
    ("Commercial Inputs", "Commercial terms"),
    ("Cost, VAT basis, fees and minimum order", "Price, quantity and conditions"),
    ("Operational Readiness", "Operational fit"),
    ("Stock depth, lead time and documentation", "Availability, documentation and delivery"),
    ("<p class=\"eyebrow\"><span></span>Supplier readiness</p><h2>Help us evaluate your range efficiently.</h2><p>Clean commercial data and accurate product identifiers create a faster, more reliable review.</p>", "<p class=\"eyebrow\"><span></span>Supplier route</p><h2>Have a product or stock opportunity?</h2><p>Use the dedicated supplier route to share product, quantity, pricing, availability and documentation.</p>"),
    ("View Supplier Requirements", "Sell to Us"),
    ("Useful submission data", "Useful starting information"),
    ("EAN or GTIN identifiers", "Product and brand"),
    ("Wholesale pricing and VAT basis", "Price and VAT basis"),
    ("Case-pack quantities", "Unit or case configuration"),
    ("Available stock and lead times", "Quantity and lead time"),
    ("Brand and compliance documents", "Images and relevant documents"),
    ("<p class=\"eyebrow\">Ready to talk?</p><h2>Submit your product range.</h2><p>Start a clear, commercially focused supplier conversation.</p></div><a class=\"button button-gold\" href=\"contact.html\">Submit Your Range</a>", "<p class=\"eyebrow\">Start a conversation</p><h2>Products, partnerships or ideas worth discussing.</h2><p>Use the contact route that best matches your enquiry.</p></div><a class=\"button button-gold\" href=\"contact.html\">Contact</a>"),
]

for old, new in replacements:
    text = replace_required(text, old, new)

old_desktop = '<nav class="desktop-nav" aria-label="Primary navigation"><a class="nav-link is-active" href="#top" aria-current="page">Home</a><a class="nav-link" href="partnership.html">Sell to Us</a><a class="nav-link" href="#product-focus">Product Focus</a><a class="nav-link" href="#how-we-buy">How We Buy</a><a class="nav-link" href="blog.html">Insights</a><a class="nav-link" href="contact.html">Contact</a></nav>'
new_desktop = '<nav class="desktop-nav" aria-label="Primary navigation"><a class="nav-link is-active" href="#top" aria-current="page">Home</a><a class="nav-link" href="about.html">About</a><a class="nav-link" href="products.html">Products &amp; Opportunities</a><a class="nav-link" href="blog.html">Blog &amp; Resources</a><a class="nav-link" href="partnership.html">Sell to Us</a><a class="nav-link" href="contact.html">Contact</a></nav>'
text = replace_required(text, old_desktop, new_desktop)
old_mobile = '<nav class="mobile-navigation" id="mobile-navigation" aria-label="Mobile navigation" hidden><a href="#top">Home</a><a href="partnership.html">Sell to Us</a><a href="#product-focus">Product Focus</a><a href="#how-we-buy">How We Buy</a><a href="blog.html">Insights</a><a href="contact.html">Contact</a><a class="button button-gold" href="contact.html">Submit Your Range</a></nav>'
new_mobile = '<nav class="mobile-navigation" id="mobile-navigation" aria-label="Mobile navigation" hidden><a href="#top">Home</a><a href="about.html">About</a><a href="products.html">Products &amp; Opportunities</a><a href="blog.html">Blog &amp; Resources</a><a href="partnership.html">Sell to Us</a><a href="contact.html">Contact</a></nav>'
text = replace_required(text, old_mobile, new_mobile)
text = replace_required(text, '<span>Submit Your Range</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><button class="menu-toggle"', '<span>Get in touch</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><button class="menu-toggle"')

css_anchor = '<link rel="stylesheet" href="css/tbm-cinematic-v10.css">'
text = replace_required(text, css_anchor, css_anchor + '<link rel="stylesheet" href="css/seo-content-v2.css">')

forge_section = '''<section class="content-band content-band--soft home-forge-section" aria-labelledby="forge-home-title"><div class="shell seo-shell"><p class="eyebrow"><span></span>From The Forge</p><header class="v6-heading"><div><h2 id="forge-home-title">Ideas, tools and shifts shaping modern commerce.</h2></div><div class="v6-heading__body">Practical analysis of AI automation, ecommerce, digital retail, emerging technology and B2B commerce.<a class="v6-heading__link" href="blog.html">Blog &amp; Resources</a></div></header><div class="article-grid"><a class="article-card" href="blog/agentic-commerce-2026.html"><span class="article-meta">AI &amp; Automation</span><h3>Agentic Commerce in 2026</h3><p>What is live, what remains emerging and how businesses can prepare without chasing hype.</p><span class="article-link">Read article →</span></a><a class="article-card" href="blog/search-chat-cart-product-discovery.html"><span class="article-meta">Digital Retail</span><h3>From Search to Chat to Cart</h3><p>How discovery is spreading across search, AI, social, creators and images.</p><span class="article-link">Read article →</span></a><a class="article-card" href="blog/ecommerce-tools-technologies-2026.html"><span class="article-meta">Tools &amp; Technology</span><h3>Technologies to Watch in 2026</h3><p>A practical watchlist focused on meaningful operational change.</p><span class="article-link">Read article →</span></a></div></div></section>'''
anchor = '<section class="section"><div class="shell readiness-panel">'
text = replace_required(text, anchor, forge_section + anchor)

old_footer = '<footer class="site-footer"><div class="shell footer-grid"><div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark"><img src="images/tbm-logo.svg" alt="" width="48" height="48"></span><span class="brand-name"><small>The</small>Blacksmith Market</span></a><p>Focused wholesale buying and supplier partnerships for selected branded consumer stock.</p></div><div><h3>Company</h3><a href="about.html">About</a><a href="#how-we-buy">How We Buy</a><a href="partnership.html">Sell to Us</a><a href="contact.html">Contact</a></div><div><h3>Product Focus</h3><a href="products.html#home">Home &amp; Living</a><a href="products.html#beauty">Health &amp; Beauty</a><a href="products.html#toys">Toys &amp; Games</a><a href="products.html#electronics">Electronics</a></div><div><h3>Resources</h3><a href="faq.html">Supplier FAQ</a><a href="blog.html">Insights</a><a href="privacy-policy.html">Privacy Policy</a><a href="terms.html">Website Terms</a></div></div><div class="shell footer-bottom"><span>© <span id="current-year">2026</span> The Blacksmith Market Ltd · Company no. 14106759</span><span>Built for clear supplier conversations.</span></div></footer>'
new_footer = '<footer class="site-footer"><div class="shell footer-grid"><div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark"><img src="images/tbm-logo.svg" alt="" width="48" height="48"></span><span class="brand-name"><small>The</small>Blacksmith Market</span></a><p>Products, partnerships and practical ideas shaping modern commerce.</p></div><div><h3>Company</h3><a href="about.html">About</a><a href="products.html">Products &amp; Opportunities</a><a href="partnership.html">Sell to Us</a><a href="contact.html">Contact</a></div><div><h3>The Forge</h3><a href="blog.html">Blog &amp; Resources</a><a href="blog.html#ai-automation">AI &amp; Automation</a><a href="blog.html#digital-retail">Digital Retail</a><a href="blog.html#wholesale-b2b">Wholesale &amp; B2B</a></div><div><h3>Information</h3><a href="faq.html">FAQ</a><a href="editorial-standards.html">Editorial Standards</a><a href="privacy-policy.html">Privacy</a><a href="terms.html">Website Terms</a></div></div><div class="shell footer-bottom"><span>© <span id="current-year">2026</span> The Blacksmith Market Ltd · Company no. 14106759</span><span>United Kingdom</span></div></footer>'
text = replace_required(text, old_footer, new_footer)

ROOT.joinpath("index.html").write_text(text, encoding="utf-8")
digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
print(f"homepage sha256: {digest}")
if digest != EXPECTED_SHA256:
    raise SystemExit(f"Unexpected homepage output hash: {digest} != {EXPECTED_SHA256}")
