"""Regression: V10 reveal remains active when the browser requests reduced motion."""

from __future__ import annotations

from playwright.sync_api import sync_playwright


BASE = "http://127.0.0.1:4173/index.html"


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1365, "height": 768}, device_scale_factor=1)
        page.emulate_media(reduced_motion="reduce")

        response = page.goto(BASE, wait_until="domcontentloaded")
        assert response and response.status == 200
        assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches") is True

        stage = page.locator('[data-cinematic-stage]')
        stage.locator('canvas#tbm-cinematic-v10-canvas').wait_for(state="visible", timeout=60000)
        stage.locator('[data-cinematic-stage][data-ready="true"]') if False else None
        page.locator('[data-cinematic-stage][data-ready="true"]').wait_for(timeout=60000)
        page.wait_for_function("() => window.__tbmCinematicV10?.getState?.().ready === true", timeout=10000)

        assert stage.get_attribute("data-fallback") is None
        assert page.locator(".tbm-cinematic-v10-visual").evaluate(
            "node => getComputedStyle(node).display"
        ) != "none"

        page.evaluate(
            """() => {
              const range = window.__tbmCinematicV10.getRange();
              window.scrollTo(0, range.start + (range.end - range.start) * 0.5);
            }"""
        )
        page.wait_for_function(
            "() => Math.abs(Number(document.querySelector('[data-cinematic-stage]').dataset.progress) - 0.5) < 0.03",
            timeout=10000,
        )
        frame = int(stage.get_attribute("data-frame") or "0")
        assert frame > 1, frame

        browser.close()


if __name__ == "__main__":
    main()
