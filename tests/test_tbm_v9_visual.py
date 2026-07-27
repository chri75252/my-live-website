"""V9 browser evidence: reversible exact-frame scrub and final-frame handoff.

Run only after V9 is activated in index.html. Captures are diagnostic when the
headed CDP browser is unavailable; this script intentionally does not mark
human visual approval as complete.
"""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright


BASE = "http://127.0.0.1:4173/index.html"
OUT = Path("artifacts/reference-match-v9/browser")
FINAL_DESKTOP = "frame_0120.webp"
FINAL_MOBILE = "frame_0120.webp"


def wait_for_ready(page: Page) -> None:
    page.locator('#tbm-reveal-v6[data-ready="true"]').wait_for(timeout=60000)
    page.wait_for_function(
        """() => {
          const reveal = document.querySelector('#tbm-reveal-v6');
          return reveal && Number(reveal.dataset.frame || 0) >= 1;
        }""",
        timeout=10000,
    )


def scroll_progress(page: Page, progress: float, viewport_height: int) -> tuple[float, int]:
    page.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
    stage = page.locator("[data-reveal-stage]")
    box = stage.bounding_box()
    assert box, "reveal stage has no geometry"
    travel = box["height"] - viewport_height
    # Bounding-box y is viewport-relative and changes after each previous
    # scroll. offsetTop keeps each probe anchored to the document.
    stage_top = stage.evaluate("element => element.offsetTop")
    page.evaluate("y => window.scrollTo(0, y)", stage_top + travel * progress)
    page.wait_for_function(
        """expected => {
          const reveal = document.querySelector('#tbm-reveal-v6');
          return reveal && Math.abs(Number(reveal.dataset.progress) - expected) <= .025;
        }""",
        arg=progress,
        timeout=8000,
    )
    page.wait_for_timeout(150)
    reveal = page.locator("#tbm-reveal-v6")
    return float(reveal.get_attribute("data-progress")), int(reveal.get_attribute("data-frame") or "0")


def assert_final_plate(page: Page, expected_name: str) -> None:
    plate = page.locator(".hero-v9__plate img")
    assert plate.count() == 1
    source = plate.get_attribute("src") or ""
    assert source.endswith(expected_name), source
    assert plate.evaluate("image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0")


def run_desktop(browser: Browser, errors: list[str], failed: list[str]) -> None:
    page = browser.new_page(viewport={"width": 1904, "height": 900}, device_scale_factor=1)
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("requestfailed", lambda request: failed.append(f"{request.url}: {request.failure}"))
    response = page.goto(BASE, wait_until="networkidle")
    assert response and response.status == 200
    wait_for_ready(page)
    assert_final_plate(page, FINAL_DESKTOP)

    zero_progress, zero_frame = scroll_progress(page, 0.0, 900)
    mid_progress, mid_frame = scroll_progress(page, 0.5, 900)
    end_progress, end_frame = scroll_progress(page, 1.0, 900)
    reverse_progress, reverse_frame = scroll_progress(page, 0.25, 900)
    final_progress, final_frame = scroll_progress(page, 0.0, 900)
    assert zero_progress <= .025 and zero_frame >= 1
    assert .475 <= mid_progress <= .525 and mid_frame > zero_frame
    assert end_progress >= .975 and end_frame >= 116
    assert .225 <= reverse_progress <= .275 and reverse_frame < end_frame
    assert final_progress <= .025 and final_frame <= 4
    assert page.locator("#tbm-reveal-v6").get_attribute("data-awaiting-frame") is None
    page.screenshot(path=str(OUT / "desktop-reversed-to-opening.png"))

    page.locator(".hero-v9").scroll_into_view_if_needed()
    page.wait_for_timeout(150)
    page.screenshot(path=str(OUT / "desktop-final-hero.png"))
    page.close()


def run_mobile(browser: Browser, errors: list[str], failed: list[str]) -> None:
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("requestfailed", lambda request: failed.append(f"{request.url}: {request.failure}"))
    response = page.goto(BASE, wait_until="networkidle")
    assert response and response.status == 200
    wait_for_ready(page)
    assert_final_plate(page, FINAL_MOBILE)
    _, opening = scroll_progress(page, 0.0, 844)
    _, end = scroll_progress(page, 1.0, 844)
    _, reverse = scroll_progress(page, 0.25, 844)
    assert end > opening and reverse < end
    page.screenshot(path=str(OUT / "mobile-reversed-25.png"))
    page.close()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    failed: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        run_desktop(browser, errors, failed)
        run_mobile(browser, errors, failed)
        browser.close()
    assert not errors, errors
    assert not failed, failed


if __name__ == "__main__":
    main()
