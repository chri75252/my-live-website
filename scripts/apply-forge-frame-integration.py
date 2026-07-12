#!/usr/bin/env python3
"""Apply the minimal additive index.html integration for the audited frame intro."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

PRELOAD_BLOCK = '''  <link rel="stylesheet" href="css/forge-intro.css">
  <link rel="preload" as="image" href="assets/forge-reveal/desktop/frame_0001.webp" type="image/webp" media="(min-width:701px)">
  <link rel="preload" as="image" href="assets/forge-reveal/mobile/frame_0001.webp" type="image/webp" media="(max-width:700px)">
  <noscript><style>
    .forge-intro{display:none!important}
    body.forge-intro-pending>.skip-link,
    body.forge-intro-pending>.site-header,
    body.forge-intro-pending>main,
    body.forge-intro-pending>.site-footer{pointer-events:auto!important;user-select:auto!important}
  </style></noscript>'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0 and new in text:
        return text
    if count != 1:
        raise SystemExit(f"Expected exactly one {label} anchor, found {count}.")
    return text.replace(old, new, 1)


def main() -> None:
    text = INDEX.read_text(encoding="utf-8")
    text = replace_once(
        text,
        '  <link rel="stylesheet" href="css/forge-intro.css">',
        PRELOAD_BLOCK,
        "forge stylesheet",
    )
    text = replace_once(text, '<body class="home-v2">', '<body class="home-v2 forge-intro-pending">', "body class")
    text = replace_once(
        text,
        '<div class="forge-intro" id="forge-intro" data-phase="opening" role="img" aria-label="A forged bronze gate opens to reveal The Blacksmith Market homepage">',
        '<div class="forge-intro" id="forge-intro" data-phase="opening" data-load-state="loading" data-frame-count="32" role="img" aria-label="A forged bronze gate opens to reveal The Blacksmith Market homepage">',
        "intro root",
    )
    text = replace_once(
        text,
        '  <span class="forge-intro__instruction">Scroll to forge</span>\n  <span class="forge-intro__meter" aria-hidden="true"></span>',
        '  <span class="forge-intro__instruction">Scroll to forge</span>\n  <span class="forge-intro__status" id="forge-intro-status" role="status" aria-live="polite">Preparing the forge</span>\n  <span class="forge-intro__meter" aria-hidden="true"></span>',
        "intro status",
    )
    INDEX.write_text(text, encoding="utf-8", newline="\n")
    print("Applied minimal frame-intro integration to index.html.")


if __name__ == "__main__":
    main()
