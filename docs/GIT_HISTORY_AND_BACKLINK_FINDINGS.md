# Git history and backlink-origin findings

## Repository origin

The repository's initial commit is:

- `26a29a3c628618156f5f5153dd46ae4eddde8b45`
- Message: `Initial commit`
- Recorded creation: 9 October 2025
- Content: README only

The false corporate and SEO template content was not present in that initial commit.

## Commit that introduced the legacy website template

Commit:

- `ffdf6a922614cb1ee9e4a0ab4ba6b918ca725e0f`
- Message: `Add files via upload`

The patch for this upload added the old public pages and includes, among other items:

- `.co.uk` Open Graph URLs
- Claims that the business was a “premier UK wholesale distributor”
- A claimed 2018 founding date
- Claimed multi-channel distribution and logistics capabilities
- The invented leadership identity “James Harrison — CEO & Founder”
- Additional invented team identities
- Other broad, unsupported corporate claims

The same uploaded template family also contained placeholder contact/legal data and the later-visible testimonial/blog material that has now been withdrawn or rewritten on the SEO branch.

## Was it added by an LLM?

The repository evidence supports only this conclusion:

- GitHub recorded the files as a browser-style upload under the generic message `Add files via upload`.
- The commit does not identify the tool that originally generated the files.
- The wording and complete template structure are consistent with generated or stock-template content, but that is an inference rather than proof of a specific model.

Therefore, the exact LLM or agent cannot be attributed from the available commit metadata.

## Backlink clarification

Incoming backlinks are not created merely by adding links inside this repository. Third-party sites create them independently.

Two public references identified during the audit were:

1. **MerchantGenius** — an automated historical profile of the earlier Shopify/domain configuration. Its record predates the recent coding-agent work.
2. **BuiltWith relationship pages** — automated associations based on values detected on public websites. A placeholder registration identifier could cause unrelated domains using the same template value to be grouped together.

The upload commit is relevant because false or placeholder public identifiers may have supplied data to automated databases. It does not show that an LLM actively created an external backlink.

## What remains unverifiable

A complete first-seen timeline for every backlink requires one of:

- Google Search Console Links export
- Ahrefs, Majestic or Semrush backlink export
- Historical crawl/archive data from the backlink provider

The currently connected Search Console reporting operations expose performance data, not the full Links report.
