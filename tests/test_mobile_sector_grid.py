"""Mobile regression checks for homepage sector-card containment and filters."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright

BASE = "http://127.0.0.1:4173/index.html"
OUT = Path("artifacts/mobile-sector-grid")
VIEWPORTS = (
    {"name": "iphone-390", "width": 390, "height": 844},
    {"name": "iphone-430", "width": 430, "height": 932},
)


def visible_boxes(page: Page) -> list[dict[str, float | str]]:
    return page.locator("#product-focus [data-sector-card]:not([hidden])").evaluate_all(
        """
        cards => cards.map(card => {
          const box = card.getBoundingClientRect();
          const style = getComputedStyle(card);
          return {
            sector: card.dataset.sectorCard,
            left: box.left,
            right: box.right,
            top: box.top,
            bottom: box.bottom,
            width: box.width,
            height: box.height,
            minWidth: style.minWidth,
            transform: style.transform
          };
        })
        """
    )


def assert_contained_and_separate(page: Page, label: str) -> list[dict[str, float | str]]:
    cards = visible_boxes(page)
    assert cards, f"{label}: no visible sector cards"

    container = page.locator("#product-focus .sector-cards").bounding_box()
    assert container, f"{label}: sector-card grid has no box"

    tolerance = 1.5
    for card in cards:
        assert card["left"] >= container["x"] - tolerance, (
            f"{label}: {card['sector']} escapes the left grid boundary: {card} / {container}"
        )
        assert card["right"] <= container["x"] + container["width"] + tolerance, (
            f"{label}: {card['sector']} escapes the right grid boundary: {card} / {container}"
        )
        assert card["width"] <= container["width"] + tolerance, (
            f"{label}: {card['sector']} is wider than the grid: {card} / {container}"
        )

    collisions: list[dict[str, object]] = []
    for index, first in enumerate(cards):
        for second in cards[index + 1 :]:
            overlap_x = min(first["right"], second["right"]) - max(first["left"], second["left"])
            overlap_y = min(first["bottom"], second["bottom"]) - max(first["top"], second["top"])
            if overlap_x > tolerance and overlap_y > tolerance:
                collisions.append(
                    {
                        "first": first["sector"],
                        "second": second["sector"],
                        "overlap_x": round(overlap_x, 2),
                        "overlap_y": round(overlap_y, 2),
                    }
                )

    assert not collisions, f"{label}: overlapping sector cards: {json.dumps(collisions)}"
    return cards


def open_product_section(browser: Browser, viewport: dict[str, int | str]) -> Page:
    context = browser.new_context(
        viewport={"width": int(viewport["width"]), "height": int(viewport["height"])},
        device_scale_factor=1,
        is_mobile=True,
        has_touch=True,
    )
    page = context.new_page()
    response = page.goto(BASE, wait_until="networkidle")
    assert response and response.status == 200
    page.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
    product_top = page.locator("#product-focus").evaluate("element => element.offsetTop")
    page.evaluate("y => scrollTo(0, y)", product_top - 76)
    page.wait_for_timeout(700)
    page.locator("[data-network-status]").wait_for(state="attached")
    return page


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        for viewport in VIEWPORTS:
            page = open_product_section(browser, viewport)
            name = str(viewport["name"])

            all_cards = assert_contained_and_separate(page, f"{name}/all")
            assert len(all_cards) == 5, f"{name}: expected five cards, got {len(all_cards)}"
            page.screenshot(path=str(OUT / f"{name}-all.png"), full_page=False)

            everyday = page.locator('[data-sector-filter="evergreen"]')
            everyday.click()
            page.wait_for_timeout(700)
            filtered_cards = assert_contained_and_separate(page, f"{name}/everyday")
            assert {card["sector"] for card in filtered_cards} == {
                "home-kitchen",
                "general-merchandise",
            }, f"{name}: unexpected everyday-use cards: {filtered_cards}"
            page.screenshot(path=str(OUT / f"{name}-everyday.png"), full_page=False)

            # Selecting the second visible card must not reintroduce a transform collision.
            page.locator('[data-sector-card="general-merchandise"]').click()
            page.wait_for_timeout(350)
            selected_cards = assert_contained_and_separate(page, f"{name}/everyday-selected")
            selected = next(card for card in selected_cards if card["sector"] == "general-merchandise")
            assert selected["transform"] == "none", (
                f"{name}: selected mobile card retained a collision-prone transform: {selected}"
            )

            page.context.close()

        browser.close()


if __name__ == "__main__":
    main()
