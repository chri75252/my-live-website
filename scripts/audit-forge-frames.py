#!/usr/bin/env python3
"""Generate deterministic inventory and contact sheet for the 48 TEVEAL source frames."""
from __future__ import annotations

import hashlib
import json
import math
import os
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "TEVEAL"
OUTPUT_DIR = ROOT / "artifacts" / "forge-frame-audit"
PATTERN = re.compile(r"^ezgif-frame-(\d{3})\.jpg$")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def average_hash(image: Image.Image, size: int = 16) -> str:
    sample = ImageOps.grayscale(image).resize((size, size), Image.Resampling.LANCZOS)
    pixels = list(sample.getdata())
    average = sum(pixels) / len(pixels)
    bits = "".join("1" if value >= average else "0" for value in pixels)
    return f"{int(bits, 2):0{size * size // 4}x}"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = []
    for path in sorted(SOURCE_DIR.glob("ezgif-frame-*.jpg")):
        match = PATTERN.match(path.name)
        if match:
            frames.append((int(match.group(1)), path))

    expected = list(range(1, 49))
    actual = [index for index, _ in frames]
    if actual != expected:
        raise SystemExit(f"Expected contiguous frames 001..048, got: {actual}")

    records = []
    opened = []
    total_bytes = 0
    dimensions = set()
    largest = {"index": None, "bytes": -1, "source": None}

    for index, path in frames:
        size_bytes = path.stat().st_size
        total_bytes += size_bytes
        with Image.open(path) as source:
            source.verify()
        image = Image.open(path).convert("RGB")
        dimensions.add(image.size)
        opened.append((index, path, image))
        if size_bytes > largest["bytes"]:
            largest = {"index": index, "bytes": size_bytes, "source": path.relative_to(ROOT).as_posix()}
        records.append(
            {
                "index": index,
                "source": path.relative_to(ROOT).as_posix(),
                "width": image.width,
                "height": image.height,
                "bytes": size_bytes,
                "sha256": sha256(path),
                "average_hash_16": average_hash(image),
                "classification": "other",
                "reason": "Pending full-size visual inspection",
                "selected": False,
            }
        )

    columns = 4
    thumb_width = 640
    label_height = 46
    first_image = opened[0][2]
    aspect = first_image.height / first_image.width
    thumb_height = round(thumb_width * aspect)
    rows = math.ceil(len(opened) / columns)
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "#080706")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 30)
    except OSError:
        font = ImageFont.load_default()

    for position, (index, _path, image) in enumerate(opened):
        col = position % columns
        row = position // columns
        x = col * thumb_width
        y = row * (thumb_height + label_height)
        thumb = ImageOps.fit(image, (thumb_width, thumb_height), method=Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x, y + label_height))
        draw.rectangle((x, y, x + thumb_width, y + label_height), fill="#080706")
        draw.text((14, y + 7), f"FRAME {index:03d}", fill="#f2c078", font=font)

    sheet_path = OUTPUT_DIR / "all-48-contact-sheet.jpg"
    sheet.save(sheet_path, quality=92, optimize=True, progressive=True)

    width, height = next(iter(dimensions)) if len(dimensions) == 1 else (None, None)
    report = {
        "SOURCE_FRAME_COUNT": len(records),
        "numbering_contiguous": actual == expected,
        "dimensions_consistent": len(dimensions) == 1,
        "source_width": width,
        "source_height": height,
        "source_dimensions_seen": sorted([list(item) for item in dimensions]),
        "total_source_bytes": total_bytes,
        "largest_source_frame": largest,
        "estimated_full_sequence_decoded_rgba_bytes": (width * height * 4 * len(records)) if width and height else None,
        "frames": records,
    }
    (OUTPUT_DIR / "source-inventory.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "frames"}, indent=2))


if __name__ == "__main__":
    main()
