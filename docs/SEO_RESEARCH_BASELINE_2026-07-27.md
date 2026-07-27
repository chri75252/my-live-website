# Search, content and AI-discovery baseline

**Property:** `sc-domain:theblacksmithmarket.com`

**Research date:** 27 July 2026

**Market:** United Kingdom unless stated otherwise

## 1. Google Search Console baseline

Markifact and Windsor.ai both confirmed access to the verified domain property.

### Last six months

| Metric | Result |
|---|---:|
| Clicks | 15 |
| Impressions | 392 |
| CTR | 3.83% |
| Average position | 5.06 |

### Pages

| Page | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| Homepage | 15 | 249 | 6.02% | 4.78 |
| FAQ | 0 | 232 | 0% | 5.22 |
| About | 0 | 14 | 0% | 4.07 |
| Partnership | 0 | 14 | 0% | 4.07 |
| Products | 0 | 14 | 0% | 4.07 |
| Testimonials | 0 | 14 | 0% | 4.07 |
| Blog | 0 | 2 | 0% | 10.50 |
| Contact | 0 | 2 | 0% | 10.50 |

**Connector reconciliation note:** the page-level rows above total 541 impressions, while a separate property-level request returned 392 impressions for the nominal six-month range. These values came from separate connector requests and are therefore not treated as an additive accounting table. The available outputs do not expose enough request metadata to determine whether the difference comes from date-boundary handling, fresh-data settings, aggregation behaviour or connector caching. The property-level figure is retained as the overall baseline; page rows are used directionally to identify which URLs Google displayed. This should be reconciled against the native Search Console interface or a single exported report before setting numeric targets.

### Exposed queries

The connector exposed only four queries: `blacksmith market`, `blacksmith market place`, `blacksmith marketing`, and `smith market`. Low-volume queries may be withheld by Search Console for privacy, but the available evidence shows no meaningful non-brand footprint yet.

### Interpretation

- The homepage generates essentially all search clicks.
- The FAQ receives many impressions but no clicks, making it a high-priority trust and snippet page.
- The legacy blog has almost no visibility.
- Average position is misleadingly strong because the impressions are mostly branded or near-branded.
- Search Console exposed impressions for HTTP and non-`www` variants, so the canonical and external redirect configuration should be monitored after deployment.

## 2. Google Trends observations

Two UK, web-search comparisons were run for the previous 12 months.

- `Amazon FBA` showed persistent measurable interest.
- `Amazon wholesale`, `AI SEO`, and `product research` also showed measurable interest.
- Highly specific phrases such as `EAN to ASIN`, `FBA profit calculator`, and `wholesale sourcing` frequently registered zero in Trends. This means Trends lacks sufficient relative volume at that granularity; it does not prove no search demand exists.
- `ecommerce automation` was comparatively low-volume in the UK Trends sample.

### Strategic implication

Use broad subjects for the topic architecture, but target operational long-tail questions for individual articles. The long-tail selection should be based on SERP gaps, user intent, first-hand expertise and future Search Console data rather than Trends alone.

## 3. SERP observations

### `EAN to ASIN matching`

The first page is dominated by identifier-conversion tools and generic barcode explainers. Few results address the harder problem: verifying that the supplier product is genuinely the same item after checking pack size, unit count, model, variation, packaging and images.

**Opportunity:** publish an evidence-led product-match methodology rather than another barcode converter.

### `Amazon FBA profit calculator UK`

Amazon controls several leading results, followed by fee calculators. Most results focus on a calculator interface or a high-level fee estimate.

**Opportunity:** do not compete with another basic calculator initially. Publish a transparent methodology covering VAT treatment, landed costs, prep, inbound shipping, returns, storage, cash exposure, ROI denominator and uncertainty. A later calculator can implement that model.

### `how to evaluate wholesale suppliers UK`

The results include supplier directories, generic buying guides, Amazon, retail-fair content and one operational YouTube workflow. There is limited evidence of rigorous, reusable scoring models combining legitimacy, catalogue quality, data matchability, operational fit, commercial effort and replenishment potential.

**Opportunity:** publish the supplier-prioritisation model and a downloadable scorecard.

## 4. Google AI Mode observations

### Product-to-ASIN verification

AI Mode organised its answer around identifiers, pack quantity, child variations, brand and images. Its sources were fragmented across Amazon forums, help pages, YouTube, software vendors and blogs.

**Content gap:** one source that combines all checks, defines confidence levels, documents false-positive cases and distinguishes an exact EAN match from an exact commercial product match.

### UK FBA net profit

AI Mode covered acquisition, Amazon fees, logistics, VAT and overhead. It also produced specific fee, tax and return-rate statements that require current primary-source verification before reuse.

**Content gap:** a version-controlled UK methodology that cites official fee/tax sources, identifies reclaimable versus non-reclaimable VAT correctly, separates unit economics from business overhead, and records assumptions rather than presenting them as universal facts.

## 5. Editorial positioning decision

The recommended subject is:

> **AI-assisted commerce operations, Amazon FBA sourcing, wholesale product analysis and profitability engineering.**

This is more defensible than a general AI, SEO or FBA publication because it combines actual operating experience with product-data validation, procurement logic and workflow automation.

## 6. Measurement cautions

- Google Trends values are relative indices, not search volumes.
- Search Console hides some low-volume query data.
- Separate connector requests may return non-additive dimensional summaries; native exports should be used for exact reconciliation.
- SERPs and AI answers are snapshots and may change by date, location, device and personalisation.
- AI-generated answers may contain unsupported or outdated specifics; they are research inputs, not source evidence.
- No ranking or AI citation is guaranteed by implementing the recommendations.
