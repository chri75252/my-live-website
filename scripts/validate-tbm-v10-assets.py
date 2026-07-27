"""Validate V10 manifest completeness before any rendered asset set is trusted."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/tbm-cinematic-v10/frame-manifest.json"
EXPECTED_REVEAL = 132
EXPECTED_IDLE = 72


def validate_frames(group: str, frames: list[dict], expected: int) -> None:
    assert len(frames) == expected, f"{group}: expected {expected} frames, found {len(frames)}"
    for index, frame in enumerate(frames, start=1):
        for viewport in ("desktop", "mobile"):
            path = ROOT / frame[viewport]
            assert path.is_file(), f"{group} {viewport} frame {index}: missing {path}"
            assert path.stat().st_size > 1024, f"{group} {viewport} frame {index}: suspiciously small {path}"


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert manifest.get("version") == 10
    assert manifest.get("status") != "staged-v9-until-v10-render-completes", "V10 render is not ready to publish."
    validate_frames("reveal", manifest["reveal"]["frames"], EXPECTED_REVEAL)
    validate_frames("idle", manifest["idle"]["frames"], EXPECTED_IDLE)
    assert manifest["idle"]["durationMs"] == 4000


if __name__ == "__main__":
    main()
