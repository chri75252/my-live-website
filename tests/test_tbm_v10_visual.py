"""V10 browser contract: one canvas owns reversible reveal and hero idle state."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright


BASE = "http://127.0.0.1:4173/index.html"
OUT = Path("artifacts/tbm-v10-approval/browser")


def wait_for_ready(page: Page) -> None:
    page.locator('[data-cinematic-stage][data-ready="true"]').wait_for(timeout=60000)
    page.wait_for_function("() => window.__tbmCinematicV10?.getState?.().ready === true", timeout=10000)


def scroll_progress(page: Page, progress: float, viewport_height: int) -> dict:
    page.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
    page.evaluate(
        """progress => {
          const range = window.__tbmCinematicV10.getRange();
          window.scrollTo(0, range.start + (range.end - range.start) * progress);
        }""",
        progress,
    )
    page.wait_for_function(
        "expected => Math.abs(Number(document.querySelector('[data-cinematic-stage]').dataset.progress) - expected) < .025",
        arg=progress,
        timeout=10000,
    )
    page.wait_for_timeout(180)
    return page.locator('[data-cinematic-stage]').evaluate(
        "node => ({progress: Number(node.dataset.progress), frame: Number(node.dataset.frame), mode: node.dataset.mode, idleFrame: Number(node.dataset.idleFrame || 0)})"
    )


def run_viewport(browser: Browser, viewport: dict, errors: list[str], failed: list[str]) -> None:
    page = browser.new_page(viewport=viewport, device_scale_factor=1)
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("requestfailed", lambda request: failed.append(f"{request.url}: {request.failure}"))
    response = page.goto(BASE, wait_until="networkidle")
    assert response and response.status == 200
    wait_for_ready(page)
    assert page.locator("#tbm-cinematic-v10-canvas").count() == 1
    assert page.locator(".hero-v9__plate img").count() == 0

    opening = scroll_progress(page, 0, viewport["height"])
    page.screenshot(path=str(OUT / f"{viewport['width']}x{viewport['height']}-opening.png"))
    middle = scroll_progress(page, .5, viewport["height"])
    handoff = scroll_progress(page, 1, viewport["height"])
    page.screenshot(path=str(OUT / f"{viewport['width']}x{viewport['height']}-handoff.png"))
    page.wait_for_timeout(350)
    idle_a = page.locator('[data-cinematic-stage]').evaluate("node => Number(node.dataset.idleFrame || 0)")
    page.wait_for_timeout(450)
    idle_b = page.locator('[data-cinematic-stage]').evaluate("node => Number(node.dataset.idleFrame || 0)")
    reversed_state = scroll_progress(page, .25, viewport["height"])

    assert opening["frame"] >= 1
    assert middle["frame"] > opening["frame"]
    assert handoff["frame"] >= 115
    assert handoff["mode"] in {"idle-playing", "reveal-complete"}
    assert page.locator(".hero-v10").evaluate("node => Number(getComputedStyle(node.querySelector('.hero-copy')).opacity)") >= .98
    if handoff["mode"] == "idle-playing":
        assert idle_b != idle_a, (idle_a, idle_b)
    assert reversed_state["frame"] < handoff["frame"]
    source = page.locator('[data-cinematic-stage]').get_attribute("data-asset-source")
    runtime = page.evaluate("() => window.__tbmCinematicV10.getState()")
    if source is None:
        assert runtime["revealFrames"] == 132, runtime
        assert runtime["idleFrames"] == 72, runtime
    else:
        assert source == "v9-staged"
    page.screenshot(path=str(OUT / f"{viewport['width']}x{viewport['height']}-reverse.png"))
    alternate = {"width": 390, "height": 844} if viewport["width"] > 700 else {"width": 1904, "height": 900}
    page.set_viewport_size(alternate)
    page.locator('[data-cinematic-stage][data-ready="true"]').wait_for(timeout=30000)
    assert page.locator('[data-cinematic-stage]').get_attribute("data-asset-source") in {None, "v9-staged"}
    page.close()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    failed: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        run_viewport(browser, {"width": 1904, "height": 900}, errors, failed)
        run_viewport(browser, {"width": 390, "height": 844}, errors, failed)
        browser.close()
    assert not errors, errors
    assert not failed, failed


if __name__ == "__main__":
    main()
