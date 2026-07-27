#!/usr/bin/env python3
"""Build deterministic Forge-reveal WebP sequences from the approved MP4."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_VIDEO = ROOT / "Master_Execution_Prompt_—_TBM.mp4"
APPROVED_VIDEO_SHA256 = "3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95"
SOURCE_FPS = 24
SOURCE_SIZE = (1280, 720)
MOBILE_SIZE = (800, 450)
SOURCE_FRAME_COUNT = 240
SUPPORTED_SAMPLE_COUNTS = (48, 64, 80)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def reset_directory(directory: Path) -> None:
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True, exist_ok=True)


def probe_video(video: Path) -> dict:
    output = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=codec_name,width,height,avg_frame_rate,nb_frames",
            "-of", "json", str(video),
        ],
        text=True,
    )
    return json.loads(output)


def selected_source_frames(exclusive_cutoff: int, sample_count: int) -> list[int]:
    if exclusive_cutoff < sample_count:
        raise ValueError("The exclusive cutoff must be at least the selected sample count.")
    if exclusive_cutoff > SOURCE_FRAME_COUNT:
        raise ValueError(f"The exclusive cutoff cannot exceed {SOURCE_FRAME_COUNT}.")
    last_clean = exclusive_cutoff - 1
    selected = [round(position * last_clean / (sample_count - 1)) for position in range(sample_count)]
    if selected[0] != 0 or selected[-1] != last_clean or len(set(selected)) != sample_count:
        raise ValueError("Selected source frames are not a unique inclusive clean-frame range.")
    return selected


def extract_lossless_frames(video: Path, source_frames: list[int], destination: Path) -> list[Path]:
    expression = "+".join(f"eq(n\\,{index})" for index in source_frames)
    output_pattern = destination / "source_%04d.png"
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
        "-vf", f"select='{expression}'", "-vsync", "0", str(output_pattern),
    ])
    files = sorted(destination.glob("source_*.png"))
    if len(files) != len(source_frames):
        raise RuntimeError(f"Expected {len(source_frames)} extracted frames, received {len(files)}.")
    return files


def output_path(directory: Path, index: int) -> Path:
    return directory / f"frame_{index:04d}.webp"


def build_derivatives(lossless_frames: list[Path], desktop_dir: Path, mobile_dir: Path) -> list[dict]:
    reset_directory(desktop_dir)
    reset_directory(mobile_dir)
    records: list[dict] = []
    for production_index, source_path in enumerate(lossless_frames, start=1):
        desktop_path = output_path(desktop_dir, production_index)
        mobile_path = output_path(mobile_dir, production_index)
        with Image.open(source_path) as source:
            image = source.convert("RGB")
            if image.size != SOURCE_SIZE:
                raise RuntimeError(f"Source frame {production_index:04d} has unexpected dimensions {image.size}.")
            image.save(desktop_path, "WEBP", quality=88, method=6)
            image.resize(MOBILE_SIZE, Image.Resampling.LANCZOS).save(mobile_path, "WEBP", quality=86, method=6)
        records.append({
            "productionIndex": production_index - 1,
            "desktop": desktop_path.relative_to(ROOT).as_posix(),
            "mobile": mobile_path.relative_to(ROOT).as_posix(),
            "desktopSha256": file_sha256(desktop_path),
            "mobileSha256": file_sha256(mobile_path),
        })
    return records


def load_font(size: int):
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf", size)
    except OSError:
        return ImageFont.load_default()


def make_contact_sheet(lossless_frames: list[Path], source_frames: list[int], destination: Path) -> None:
    columns = 4
    thumb_width = 400
    thumb_height = round(thumb_width * SOURCE_SIZE[1] / SOURCE_SIZE[0])
    label_height = 34
    rows = math.ceil(len(lossless_frames) / columns)
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "#071011")
    draw = ImageDraw.Draw(sheet)
    font = load_font(18)
    for position, (path, source_frame) in enumerate(zip(lossless_frames, source_frames, strict=True)):
        with Image.open(path) as source:
            frame = source.convert("RGB").resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        x = (position % columns) * thumb_width
        y = (position // columns) * (thumb_height + label_height)
        sheet.paste(frame, (x, y + label_height))
        draw.text((10 + x, 8 + y), f"PROD {position + 1:04d} / SOURCE {source_frame:03d}", fill="#e3b874", font=font)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, quality=90)


def directory_report(directory: Path, dimensions: tuple[int, int]) -> dict:
    files = sorted(directory.glob("frame_*.webp"))
    sizes = {path.name: path.stat().st_size for path in files}
    return {
        "assetCount": len(files),
        "totalBytes": sum(sizes.values()),
        "largestAsset": {"file": max(sizes, key=sizes.get), "bytes": max(sizes.values())},
        "decodedRgbaBytes": dimensions[0] * dimensions[1] * 4 * len(files),
        "dimensions": {"width": dimensions[0], "height": dimensions[1]},
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", type=Path, default=DEFAULT_VIDEO)
    parser.add_argument("--exclusive-cutoff", type=int, required=True,
                        help="First contaminated source-frame index; clean frames end at this value minus one.")
    parser.add_argument("--sample-count", type=int, choices=SUPPORTED_SAMPLE_COUNTS, default=64)
    parser.add_argument("--output-root", type=Path, default=ROOT,
                        help="Repository root for production assets, or an artifact subdirectory for a candidate build.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    video = args.video.resolve()
    output_root = args.output_root.resolve()
    if not video.is_file():
        raise SystemExit(f"Source video not found: {video}")
    if not output_root.is_relative_to(ROOT):
        raise SystemExit("--output-root must remain inside this repository.")
    if file_sha256(video) != APPROVED_VIDEO_SHA256:
        raise SystemExit("Source video SHA-256 does not match the approved user asset.")

    stream = probe_video(video)["streams"][0]
    if (
        stream["width"], stream["height"], stream["avg_frame_rate"], int(stream["nb_frames"])
    ) != (*SOURCE_SIZE, "24/1", SOURCE_FRAME_COUNT):
        raise SystemExit("Source video metadata does not match the approved 1280x720, 24fps, 240-frame asset.")

    source_frames = selected_source_frames(args.exclusive_cutoff, args.sample_count)
    desktop_dir = output_root / "assets" / "forge-reveal" / "desktop"
    mobile_dir = output_root / "assets" / "forge-reveal" / "mobile"
    manifest_path = output_root / "assets" / "forge-reveal" / "frame-manifest.json"
    with tempfile.TemporaryDirectory(prefix="tbm-forge-reveal-") as temporary:
        lossless_frames = extract_lossless_frames(video, source_frames, Path(temporary))
        records = build_derivatives(lossless_frames, desktop_dir, mobile_dir)
        contact_sheet = output_root / "source-selection-contact-sheet.jpg"
        make_contact_sheet(lossless_frames, source_frames, contact_sheet)

    for record, source_frame in zip(records, source_frames, strict=True):
        record["sourceFrame"] = source_frame
        record["sourceTimeSeconds"] = round(source_frame / SOURCE_FPS, 6)

    manifest = {
        "version": 1,
        "source": {
            "file": video.name,
            "sha256": APPROVED_VIDEO_SHA256,
            "width": SOURCE_SIZE[0],
            "height": SOURCE_SIZE[1],
            "fps": SOURCE_FPS,
            "totalFrames": SOURCE_FRAME_COUNT,
        },
        "selection": {
            "lastCleanSourceFrame": args.exclusive_cutoff - 1,
            "firstContaminatedSourceFrame": args.exclusive_cutoff,
            "sampleCount": args.sample_count,
        },
        "variants": {
            "desktop": {"width": SOURCE_SIZE[0], "height": SOURCE_SIZE[1]},
            "mobile": {"width": MOBILE_SIZE[0], "height": MOBILE_SIZE[1]},
        },
        "frames": records,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    report = {
        "sourceAudit": "Approved MP4 inspected through source frame 166; 160 is the first homepage-contaminated frame.",
        "manifest": manifest,
        "desktop": directory_report(desktop_dir, SOURCE_SIZE),
        "mobile": directory_report(mobile_dir, MOBILE_SIZE),
        "outputRoot": output_root.relative_to(ROOT).as_posix() or ".",
    }
    report_path = output_root / "performance-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(manifest_path), "report": str(report_path), "sampleCount": args.sample_count}, indent=2))


if __name__ == "__main__":
    main()
