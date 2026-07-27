"""Create labelled V9/V10 checkpoint boards without mutating source imagery."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "tbm-v10-approval" / "source-checkpoints"
V9 = ROOT / "assets" / "tbm-cinematic-v9" / "keyframes"
V10 = ROOT / "assets" / "tbm-cinematic-v10" / "keyframes"
CHECKPOINTS = (
    ("opening", "phase-opening.png", "phase-opening.png"),
    ("contact-push", "phase-cinematic-push.png", "phase-contact-push.png"),
    ("network-orbit", "phase-network.png", "phase-network-orbit.png"),
    ("handoff", "phase-handoff.png", "phase-handoff.png"),
)
FONT = ImageFont.load_default()


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS)


def label(canvas: Image.Image, xy: tuple[int, int], text: str) -> None:
    x, y = xy
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((x, y, x + 350, y + 26), fill=(5, 7, 6))
    draw.text((x + 8, y + 7), text, fill=(242, 194, 126), font=FONT)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, object] = {
        "version": 10,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "approval": {"status": "pending-headed-browser-review"},
        "boards": [],
    }
    tile = (800, 450)
    for checkpoint, baseline_name, proposed_name in CHECKPOINTS:
        baseline_path = V9 / baseline_name
        proposed_path = V10 / proposed_name
        if not baseline_path.is_file() or not proposed_path.is_file():
            raise FileNotFoundError(f"Missing source still: {baseline_path} / {proposed_path}")
        baseline = fit(Image.open(baseline_path), tile)
        proposed = fit(Image.open(proposed_path), tile)
        board = Image.new("RGB", (1600, 980), (2, 3, 2))
        board.paste(baseline, (0, 40))
        board.paste(proposed, (800, 40))
        board.paste(Image.blend(baseline, proposed, .5), (0, 530))
        board.paste(ImageOps.autocontrast(ImageChops.difference(baseline, proposed)), (800, 530))
        label(board, (10, 8), f"V9 baseline - {baseline_name}")
        label(board, (810, 8), f"V10 proposal - {proposed_name}")
        label(board, (10, 498), "50% overlay - diagnostic")
        label(board, (810, 498), "absolute difference - diagnostic")
        footer = f"V10 checkpoint: {checkpoint} | V9 SHA {digest(baseline_path)[:12]} | V10 SHA {digest(proposed_path)[:12]}"
        ImageDraw.Draw(board).text((12, 955), footer, fill=(220, 220, 210), font=FONT)
        output = OUT / f"{checkpoint}-board.png"
        board.save(output)
        evidence["boards"].append({
            "checkpoint": checkpoint,
            "board": output.relative_to(ROOT).as_posix(),
            "baseline": baseline_path.relative_to(ROOT).as_posix(),
            "proposal": proposed_path.relative_to(ROOT).as_posix(),
            "baselineSha256": digest(baseline_path),
            "proposalSha256": digest(proposed_path),
        })
    (OUT / "approval-manifest.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
