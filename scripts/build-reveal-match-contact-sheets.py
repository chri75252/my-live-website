from __future__ import annotations

import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

repo = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
artifact = repo / 'artifacts' / 'reveal-match-v2'
stages = artifact / 'stage-crops'
out = artifact / 'comparisons'
out.mkdir(parents=True, exist_ok=True)
refs = [repo / 'TEVEAL' / f'ezgif-frame-{index:03d}.jpg' for index in (29, 30, 31)]
viewports = ['1920x1080', '1680x900', '1366x768', '390x844', '430x932']
cell = (560, 315)
label_height = 34
records = []

def fit(path: Path) -> Image.Image:
    image = Image.open(path).convert('RGB')
    return ImageOps.pad(image, cell, color=(3, 6, 6), method=Image.Resampling.LANCZOS)

for viewport in viewports:
    live = [
        stages / f'{viewport}--live-hero-handoff-stage.png',
        stages / f'{viewport}--hero-initial-stage.png',
        stages / f'{viewport}--hero-progress-50-stage.png',
    ]
    paths = refs + live
    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        raise SystemExit(f'Missing comparison images for {viewport}: {missing}')
    sheet = Image.new('RGB', (cell[0] * 3, (cell[1] + label_height) * 2), (5, 8, 8))
    draw = ImageDraw.Draw(sheet)
    labels = ['Reference frame 029', 'Reference frame 030', 'Reference frame 031',
              'Live handoff', 'Live initial', 'Live 50% scroll']
    for i, (path, label) in enumerate(zip(paths, labels)):
        row, col = divmod(i, 3)
        x = col * cell[0]
        y = row * (cell[1] + label_height)
        sheet.paste(fit(path), (x, y + label_height))
        draw.text((x + 12, y + 10), label, fill=(226, 218, 207))
    target = out / f'{viewport}--reference-comparison.jpg'
    sheet.save(target, quality=91, optimize=True)
    records.append({'viewport': viewport, 'sheet': str(target.relative_to(repo))})

(out / 'comparison-manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
