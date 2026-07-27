"""Create non-destructive V7/V9 visual review boards and their evidence manifest.

This script does not alter source imagery. It records source SHA-256 values and
creates one fixed, labelled comparison board per checkpoint so visual changes
can be reviewed without treating a browser smoke test as design approval.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "tbm-v9-approval" / "gate-01-source-stills-r01"
V7 = ROOT / "assets" / "tbm-cinematic-v7" / "keyframes"
V9 = ROOT / "assets" / "tbm-cinematic-v9" / "keyframes"
CHECKPOINTS = (
    ("opening", "phase-opening.png", "phase-ignition.png"),
    ("outer-formation", "phase-outer-formation.png", "phase-ignition.png"),
    ("network", "phase-network.png", "phase-network.png"),
    ("handoff", "phase-handoff.png", "phase-handoff.png"),
)
FONT = ImageFont.load_default()


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS)


def label(canvas: Image.Image, xy: tuple[int, int], text: str) -> None:
    draw = ImageDraw.Draw(canvas)
    x, y = xy
    draw.rectangle((x, y, x + 290, y + 26), fill=(5, 7, 6))
    draw.text((x + 8, y + 7), text, fill=(242, 194, 126), font=FONT)


def bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    # A deliberately conservative luminance mask: the black scene background
    # stays out, while the bronze construction is marked for review only.
    luminance = image.convert("L")
    mask = luminance.point(lambda value: 255 if value > 35 else 0)
    return mask.getbbox()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, object] = {
        "version": 9,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "approval": {"status": "pending-headed-browser-review"},
        "boards": [],
    }
    tile = (800, 450)
    for name, proposed_name, baseline_name in CHECKPOINTS:
        proposed_path = V9 / proposed_name
        baseline_path = V7 / baseline_name
        if not proposed_path.exists() or not baseline_path.exists():
            raise FileNotFoundError(f"Missing review source: {proposed_path} / {baseline_path}")
        proposed = fit(Image.open(proposed_path), tile)
        baseline = fit(Image.open(baseline_path), tile)
        overlay = Image.blend(baseline, proposed, 0.5)
        difference = ImageOps.autocontrast(ImageChops.difference(baseline, proposed))
        board = Image.new("RGB", (1600, 980), (2, 3, 2))
        board.paste(baseline, (0, 40))
        board.paste(proposed, (800, 40))
        board.paste(overlay, (0, 530))
        board.paste(difference, (800, 530))
        label(board, (10, 8), f"V7 baseline - {baseline_name}")
        label(board, (810, 8), f"V9 proposed - {proposed_name}")
        label(board, (10, 498), "50% overlay - diagnostic")
        label(board, (810, 498), "absolute difference - diagnostic")
        footer = (
            f"V9 checkpoint: {name} | V7 SHA {digest(baseline_path)[:12]} | "
            f"V9 SHA {digest(proposed_path)[:12]} | human visual approval required"
        )
        ImageDraw.Draw(board).text((12, 955), footer, fill=(220, 220, 210), font=FONT)
        output = OUT / f"{name}-board.png"
        board.save(output)
        evidence["boards"].append({
            "checkpoint": name,
            "board": output.relative_to(ROOT).as_posix(),
            "baseline": baseline_path.relative_to(ROOT).as_posix(),
            "proposed": proposed_path.relative_to(ROOT).as_posix(),
            "baselineSha256": digest(baseline_path),
            "proposedSha256": digest(proposed_path),
            "baselineSubjectBox": bbox(baseline),
            "proposedSubjectBox": bbox(proposed),
        })
    (OUT / "approval-manifest.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
