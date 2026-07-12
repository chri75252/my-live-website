#!/usr/bin/env python3
"""Validate TEVEAL against the uploaded-ZIP audit and build production frame assets."""
from __future__ import annotations

import hashlib
import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "TEVEAL"
AUDIT_DIR = ROOT / "artifacts" / "forge-frame-audit"
MANIFEST_PATH = AUDIT_DIR / "frame-manifest.json"
DESKTOP_DIR = ROOT / "assets" / "forge-reveal" / "desktop"
MOBILE_DIR = ROOT / "assets" / "forge-reveal" / "mobile"

EXPECTED_SOURCE_COUNT = 48
EXPECTED_LAST_CLEAN = 32
EXPECTED_FIRST_SYNTHETIC = 33
DESKTOP_SIZE = (1280, 720)
MOBILE_SIZE = (800, 450)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def frame_path(index: int) -> Path:
    return SOURCE_DIR / f"ezgif-frame-{index:03d}.jpg"


def output_path(directory: Path, index: int) -> Path:
    return directory / f"frame_{index:04d}.webp"


def load_font(size: int):
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf", size)
    except OSError:
        return ImageFont.load_default()


def make_contact_sheet(records: list[dict], destination: Path, columns: int = 4) -> None:
    thumb_width = 640
    label_height = 46
    thumb_height = round(thumb_width * 720 / 1280)
    rows = math.ceil(len(records) / columns)
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "#080706")
    draw = ImageDraw.Draw(sheet)
    font = load_font(30)

    for position, record in enumerate(records):
        source = ROOT / record["source"]
        with Image.open(source) as image:
            frame = ImageOps.fit(image.convert("RGB"), (thumb_width, thumb_height), method=Image.Resampling.LANCZOS)
        column = position % columns
        row = position // columns
        x = column * thumb_width
        y = row * (thumb_height + label_height)
        sheet.paste(frame, (x, y + label_height))
        draw.rectangle((x, y, x + thumb_width, y + label_height), fill="#080706")
        state = "SELECTED" if record["selected"] else "EXCLUDED"
        draw.text((14, y + 7), f"FRAME {record['index']:03d}  {state}", fill="#f2c078", font=font)

    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, quality=92, optimize=True, progressive=True)


def reset_directory(directory: Path) -> None:
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True, exist_ok=True)


def build_derivatives(selected_records: list[dict]) -> None:
    reset_directory(DESKTOP_DIR)
    reset_directory(MOBILE_DIR)
    for record in selected_records:
        index = record["index"]
        with Image.open(ROOT / record["source"]) as source:
            image = source.convert("RGB")
            if image.size != DESKTOP_SIZE:
                raise SystemExit(f"Frame {index:03d} has unexpected dimensions {image.size}.")
            image.save(output_path(DESKTOP_DIR, index), "WEBP", quality=84, method=6)
            mobile = image.resize(MOBILE_SIZE, Image.Resampling.LANCZOS)
            mobile.save(output_path(MOBILE_DIR, index), "WEBP", quality=82, method=6)


def directory_report(directory: Path, decoded_size: tuple[int, int]) -> dict:
    files = sorted(directory.glob("frame_*.webp"))
    sizes = {path.name: path.stat().st_size for path in files}
    largest_name = max(sizes, key=sizes.get)
    return {
        "asset_count": len(files),
        "total_bytes": sum(sizes.values()),
        "largest_asset": {"file": largest_name, "bytes": sizes[largest_name]},
        "decoded_rgba_bytes_all_frames": decoded_size[0] * decoded_size[1] * 4 * len(files),
        "decoded_rgba_bytes_initial_10": decoded_size[0] * decoded_size[1] * 4 * min(10, len(files)),
        "dimensions": {"width": decoded_size[0], "height": decoded_size[1]},
    }


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    records = manifest["frames"]
    if manifest["SOURCE_FRAME_COUNT"] != EXPECTED_SOURCE_COUNT or len(records) != EXPECTED_SOURCE_COUNT:
        raise SystemExit("The audit manifest must contain exactly 48 source-frame records.")
    if manifest["LAST_CLEAN_FRAME"] != EXPECTED_LAST_CLEAN:
        raise SystemExit("LAST_CLEAN_FRAME must remain 32 unless a new full-size visual audit is committed.")
    if manifest["FIRST_SYNTHETIC_HOMEPAGE_FRAME"] != EXPECTED_FIRST_SYNTHETIC:
        raise SystemExit("FIRST_SYNTHETIC_HOMEPAGE_FRAME must remain 33 unless a new visual audit is committed.")

    expected_names = [f"ezgif-frame-{index:03d}.jpg" for index in range(1, EXPECTED_SOURCE_COUNT + 1)]
    actual_names = sorted(path.name for path in SOURCE_DIR.glob("ezgif-frame-*.jpg"))
    if actual_names != expected_names:
        raise SystemExit(f"TEVEAL must contain the contiguous 001..048 source sequence; got {actual_names}.")

    source_total = 0
    for expected_index, record in enumerate(records, start=1):
        if record["index"] != expected_index:
            raise SystemExit(f"Manifest record order is not contiguous at {expected_index}.")
        path = frame_path(expected_index)
        if record["source"] != path.relative_to(ROOT).as_posix():
            raise SystemExit(f"Manifest source mismatch for frame {expected_index:03d}.")
        actual_bytes = path.stat().st_size
        actual_hash = file_sha256(path)
        with Image.open(path) as image:
            actual_size = image.size
            image.verify()
        if actual_hash != record["sha256"] or actual_bytes != record["bytes"] or list(actual_size) != [record["width"], record["height"]]:
            raise SystemExit(
                f"Repository frame {expected_index:03d} does not byte-match the user-uploaded ZIP audit. "
                f"Expected sha256={record['sha256']} bytes={record['bytes']} size={record['width']}x{record['height']}; "
                f"got sha256={actual_hash} bytes={actual_bytes} size={actual_size[0]}x{actual_size[1]}."
            )
        source_total += actual_bytes

    selected = [record for record in records if record["selected"]]
    if [record["index"] for record in selected] != list(range(1, EXPECTED_LAST_CLEAN + 1)):
        raise SystemExit("Selected production frames must be the contiguous prefix 001..032.")
    if any(record["selected"] for record in records[EXPECTED_LAST_CLEAN:]):
        raise SystemExit("No frame from 033 onward may be selected.")

    build_derivatives(selected)
    make_contact_sheet(records, AUDIT_DIR / "all-48-contact-sheet.jpg")
    make_contact_sheet(selected, AUDIT_DIR / "selected-range-contact-sheet.jpg")

    desktop = directory_report(DESKTOP_DIR, DESKTOP_SIZE)
    mobile = directory_report(MOBILE_DIR, MOBILE_SIZE)
    selected_source_bytes = sum(record["bytes"] for record in selected)
    report = {
        "audit_source": "User-uploaded TEVEAL ZIP, visually inspected at full 1280x720 resolution",
        "repository_source_verification": "All 48 repository JPEGs byte-match the uploaded-ZIP SHA-256 manifest",
        "SOURCE_FRAME_COUNT": EXPECTED_SOURCE_COUNT,
        "SELECTED_FRAME_COUNT": len(selected),
        "LAST_CLEAN_FRAME": EXPECTED_LAST_CLEAN,
        "FIRST_SYNTHETIC_HOMEPAGE_FRAME": EXPECTED_FIRST_SYNTHETIC,
        "source_dimensions": {"width": DESKTOP_SIZE[0], "height": DESKTOP_SIZE[1]},
        "total_source_bytes": source_total,
        "selected_source_bytes": selected_source_bytes,
        "largest_source_frame": max(
            ({"file": Path(record["source"]).name, "index": record["index"], "bytes": record["bytes"]} for record in records),
            key=lambda item: item["bytes"],
        ),
        "desktop": desktop,
        "mobile": mobile,
        "renderer": {
            "interpolation": "fractional two-frame alpha blending",
            "generated_intermediate_frames": 0,
            "initial_preload_frames": 10,
            "background_preload_concurrency": 4,
        },
    }
    (AUDIT_DIR / "performance-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
