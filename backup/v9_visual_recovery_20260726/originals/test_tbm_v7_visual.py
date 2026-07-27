"""V7 browser regression checks for reveal reversibility and category geometry."""

from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "http://127.0.0.1:4173/index.html"
OUT = Path("artifacts/reference-match-v7")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1904, "height": 900}, device_scale_factor=1)
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = page.goto(BASE, wait_until="networkidle")
        assert response and response.status == 200

        reveal = page.locator("#tbm-reveal-v6")
        reveal.wait_for(state="visible")
        page.locator('#tbm-reveal-v6[data-ready="true"]').wait_for(timeout=60000)
        assert reveal.get_attribute("data-frame") in {"1", None}

        stage = page.locator("[data-reveal-stage]")
        stage_box = stage.bounding_box()
        assert stage_box
        travel = stage_box["height"] - 900

        page.evaluate("(y) => scrollTo(0, y)", stage_box["y"] + travel * 0.50)
        page.wait_for_timeout(900)
        midpoint = float(reveal.get_attribute("data-progress"))
        assert 0.45 <= midpoint <= 0.55, midpoint
        page.screenshot(path=str(OUT / "reveal-50.png"))

        page.evaluate("(y) => scrollTo(0, y)", stage_box["y"] + travel)
        page.wait_for_timeout(900)
        assert float(reveal.get_attribute("data-progress")) >= 0.98

        page.evaluate("(y) => scrollTo(0, y)", stage_box["y"] + travel * 0.25)
        page.wait_for_timeout(900)
        reverse = float(reveal.get_attribute("data-progress"))
        assert 0.20 <= reverse <= 0.30, reverse
        page.screenshot(path=str(OUT / "reveal-reversed-25.png"))

        product = page.locator("#product-focus")
        page.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
        product_top = product.evaluate("element => element.offsetTop")
        page.evaluate("y => scrollTo(0, y)", product_top - 92)
        page.wait_for_timeout(500)
        cards = page.locator("[data-sector-card]:not([hidden])")
        assert cards.count() == 5
        tops = [round(cards.nth(index).bounding_box()["y"]) for index in range(5)]
        assert len(set(tops)) >= 3, tops
        detail = page.locator("[data-sector-detail]").bounding_box()
        assert detail and detail["y"] + detail["height"] <= 900, detail
        callout = page.locator(".sector-network__callout").bounding_box()
        legend = page.locator(".sector-network__legend").bounding_box()
        assert callout and callout["y"] + callout["height"] <= 900, callout
        assert legend and legend["y"] + legend["height"] <= 900, legend
        page.screenshot(path=str(OUT / "product-constellation.png"))

        page.locator('[data-sector-card="electronics"]').click()
        assert page.locator("#product-focus").get_attribute("data-active-sector") == "electronics"
        route = page.locator("[data-active-route]").get_attribute("d")
        assert route == "M 785 145 L 600 545", route

        assert not errors, errors
        browser.close()


if __name__ == "__main__":
    main()
