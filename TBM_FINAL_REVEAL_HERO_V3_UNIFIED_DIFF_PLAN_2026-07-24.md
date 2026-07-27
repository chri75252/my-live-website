# TBM Final Reveal + Hero V3 — Unified Diff Implementation Plan

**Prepared:** 2026-07-24  
**Baseline:** `main` at `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`  
**Status:** implementation plan only; the patches below have not been applied  
**Controlling specification:** `TBM_FINAL_REVEAL_AND_HERO_IMPLEMENTATION_SPEC_2026-07-24.md`

This file translates the approved specification into an ordered, file-by-file patch plan. Every code example is written in unified-diff format so implementation can be reviewed before editing.

Binary reveal frames cannot be represented usefully in a text diff. Their exact generation command, manifest format, naming and verification patch are included instead.

Diff convention: lines containing `...` only represent existing sections that remain unchanged or are replaced wholesale by the shown implementation. They are review separators, not literal patch content and must never be copied into a source file. Added (`+`) implementation lines are concrete unless the plan explicitly labels a value as calibration-dependent.

---

## 1. Scope and implementation decision

### Minimum required result

- Regenerate the reveal from `Master_Execution_Prompt_—_TBM.mp4`.
- Start with the 64-frame candidate and compare it against 48 and 80 frames.
- Replace the two-stage reveal rendering path with one scheduler.
- Prevent nearest-loaded fallback after the reveal is ready.
- Remove dynamic canvas blur from the scroll hot path.
- Add an explicit hero lifecycle:
  - `suspended`;
  - `prewarming`;
  - `handoff-ready`;
  - `active`;
  - `offscreen`.
- Add an isolated V3 Three.js armillary.
- Load V3 while retaining V2 files as rollback references.
- Match the live V3 pose to the last clean reveal frame.
- Update tests and workflows without weakening protected-site checks.

### Explicit non-goals

- no wording changes;
- no secondary-page changes;
- no new homepage section;
- no Spline, React, React Three Fiber, Lenis or GLTF requirement;
- no second large 3D object;
- no pedestal, comet, external glowing ball or yellow halo;
- no merge or deployment in the implementation pass.

---

## 2. Mandatory pre-edit backup patch

Before applying any production diff:

```diff
*** create directory
+ backup/final-forge-hero-recovery_20260724/

*** add file
+ backup/final-forge-hero-recovery_20260724/REVERT_TRACKING.md
```

Required initial content:

```diff
--- /dev/null
+++ b/backup/final-forge-hero-recovery_20260724/REVERT_TRACKING.md
@@
+# TBM Final Forge + Hero V3 Revert Tracking
+
+Baseline commit: 65cdf3c34ad6fc87837bee9969b1d382cf3bb762
+Implementation branch: codex/final-forge-hero-recovery-v3
+Backup ref: backup/pre-final-forge-hero-recovery-20260724
+
+| Production path | Backup path | Planned change | Validation | Status |
+|---|---|---|---|---|
+| index.html | backup/final-forge-hero-recovery_20260724/index.html | V3 and manifest integration | index integration validator | pending |
+| js/forge-intro.js | backup/final-forge-hero-recovery_20260724/js/forge-intro.js | one scheduler and lifecycle events | node check + browser capture | pending |
+| js/forge-frame-sequence.js | backup/final-forge-hero-recovery_20260724/js/forge-frame-sequence.js | manifest loading and synchronous drawing | node check + sequence tests | pending |
+| css/forge-intro.css | backup/final-forge-hero-recovery_20260724/css/forge-intro.css | remove expensive hot-path treatment | visual capture | pending |
+| scripts/build-forge-frame-assets.py | backup/final-forge-hero-recovery_20260724/scripts/build-forge-frame-assets.py | video-derived frame builder | deterministic rebuild | pending |
+| scripts/validate-forge-frame-sequence.mjs | backup/final-forge-hero-recovery_20260724/scripts/validate-forge-frame-sequence.mjs | manifest/V3 assertions | node execution | pending |
+| .github/workflows/forge-intro-visual.yml | backup/final-forge-hero-recovery_20260724/.github/workflows/forge-intro-visual.yml | V3 paths/evidence | action validation | pending |
+| .github/workflows/reveal-match-v2-evidence.yml | backup/final-forge-hero-recovery_20260724/.github/workflows/reveal-match-v2-evidence.yml | supersede with V3 workflow | action validation | pending |
+
+New files:
+
+| New path | Purpose | Removal rollback |
+|---|---|---|
+| assets/forge-reveal/frame-manifest.json | exact source-to-production mapping | remove file |
+| js/hero-3d-reveal-match-v3.js | isolated V3 armillary | remove file and restore index |
+| css/hero-reveal-match-v3.css | isolated V3 styling | remove file and restore index |
+| scripts/capture-reveal-match-v3.mjs | V3 evidence capture | remove file |
+| scripts/verify-reveal-match-v3.py | V3 static/evidence verifier | remove file |
+| .github/workflows/reveal-match-v3-evidence.yml | V3 CI evidence | remove file |
+
+Restore procedure:
+
+1. Verify the target repository and branch.
+2. Restore each production file from the matching backup path.
+3. Remove only the new files listed above.
+4. Restore the original reveal asset directories from their backup manifest/archive.
+5. Run the original V2 validators.
```

Backup copies must be created before the associated production file is edited. Add the original Git blob or SHA-256 beside each row during execution.

---

## 3. Patch 1 — source-video asset builder

### Target

`scripts/build-forge-frame-assets.py`

### Purpose

Replace the JPEG-derived fixed `001..032` builder with a deterministic MP4-derived candidate builder. The final clean source frame is a required command argument until it has been visually approved.

### Planned diff

```diff
--- a/scripts/build-forge-frame-assets.py
+++ b/scripts/build-forge-frame-assets.py
@@
-from pathlib import Path
+from pathlib import Path
+import argparse
+import subprocess
+import tempfile
@@
-SOURCE_DIR = ROOT / "TEVEAL"
+DEFAULT_VIDEO = ROOT / "Master_Execution_Prompt_—_TBM.mp4"
 MANIFEST_PATH = ROOT / "artifacts" / "forge-frame-audit" / "frame-manifest.json"
+PRODUCTION_MANIFEST_PATH = ROOT / "assets" / "forge-reveal" / "frame-manifest.json"
 DESKTOP_DIR = ROOT / "assets" / "forge-reveal" / "desktop"
 MOBILE_DIR = ROOT / "assets" / "forge-reveal" / "mobile"
@@
-EXPECTED_SOURCE_COUNT = 48
-EXPECTED_LAST_CLEAN = 32
-EXPECTED_FIRST_SYNTHETIC = 33
 DESKTOP_SIZE = (1280, 720)
 MOBILE_SIZE = (800, 450)
+SOURCE_FPS = 24
+DEFAULT_SAMPLE_COUNT = 64
+SUPPORTED_SAMPLE_COUNTS = (48, 64, 80)
@@
-def frame_path(index: int) -> Path:
-    return SOURCE_DIR / f"ezgif-frame-{index:03d}.jpg"
+def run(command: list[str]) -> None:
+    subprocess.run(command, check=True)
+
+
+def probe_video(video: Path) -> dict:
+    output = subprocess.check_output(
+        [
+            "ffprobe", "-v", "error",
+            "-select_streams", "v:0",
+            "-show_entries",
+            "stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames",
+            "-show_entries", "format=duration,size,bit_rate",
+            "-of", "json",
+            str(video),
+        ],
+        text=True,
+    )
+    return json.loads(output)
+
+
+def selected_source_frames(last_clean_frame: int, sample_count: int) -> list[int]:
+    if sample_count < 2:
+        raise ValueError("sample_count must be at least 2")
+    last_index = last_clean_frame - 1
+    selected = [
+        round(position * last_index / (sample_count - 1))
+        for position in range(sample_count)
+    ]
+    if selected[0] != 0 or selected[-1] != last_index:
+        raise AssertionError("First and last clean source frames must be preserved.")
+    if len(set(selected)) != sample_count:
+        raise ValueError("Requested sample count produces duplicate source frames.")
+    return selected
+
+
+def extract_lossless_frames(
+    video: Path,
+    source_frames: list[int],
+    destination: Path,
+) -> list[Path]:
+    expression = "+".join(f"eq(n\\,{index})" for index in source_frames)
+    output_pattern = destination / "source_%04d.png"
+    run([
+        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
+        "-i", str(video),
+        "-vf", f"select='{expression}'",
+        "-vsync", "0",
+        str(output_pattern),
+    ])
+    files = sorted(destination.glob("source_*.png"))
+    if len(files) != len(source_frames):
+        raise RuntimeError(
+            f"Expected {len(source_frames)} lossless frames, got {len(files)}."
+        )
+    return files
@@
-def build_derivatives(selected_records: list[dict]) -> None:
+def build_derivatives(lossless_frames: list[Path]) -> list[dict]:
     reset_directory(DESKTOP_DIR)
     reset_directory(MOBILE_DIR)
-    for record in selected_records:
-        index = record["index"]
-        with Image.open(ROOT / record["source"]) as source:
+    records = []
+    for production_index, source_path in enumerate(lossless_frames, start=1):
+        with Image.open(source_path) as source:
             image = source.convert("RGB")
             if image.size != DESKTOP_SIZE:
-                raise SystemExit(f"Frame {index:03d} has unexpected dimensions {image.size}.")
-            image.save(output_path(DESKTOP_DIR, index), "WEBP", quality=84, method=6)
+                raise SystemExit(
+                    f"Frame {production_index:04d} has unexpected dimensions {image.size}."
+                )
+            desktop_path = output_path(DESKTOP_DIR, production_index)
+            mobile_path = output_path(MOBILE_DIR, production_index)
+            image.save(desktop_path, "WEBP", quality=88, method=6)
             mobile = image.resize(MOBILE_SIZE, Image.Resampling.LANCZOS)
-            mobile.save(output_path(MOBILE_DIR, index), "WEBP", quality=82, method=6)
+            mobile.save(mobile_path, "WEBP", quality=86, method=6)
+        records.append({
+            "productionIndex": production_index - 1,
+            "desktop": desktop_path.relative_to(ROOT).as_posix(),
+            "mobile": mobile_path.relative_to(ROOT).as_posix(),
+            "desktopSha256": file_sha256(desktop_path),
+            "mobileSha256": file_sha256(mobile_path),
+        })
+    return records
@@
-def main() -> None:
-    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
-    records = manifest["frames"]
-    if manifest["SOURCE_FRAME_COUNT"] != EXPECTED_SOURCE_COUNT or len(records) != EXPECTED_SOURCE_COUNT:
-        raise SystemExit("The audit manifest must contain exactly 48 source-frame records.")
-    if manifest["LAST_CLEAN_FRAME"] != EXPECTED_LAST_CLEAN:
-        raise SystemExit("LAST_CLEAN_FRAME must remain 32 unless a new full-size visual audit is committed.")
-    if manifest["FIRST_SYNTHETIC_HOMEPAGE_FRAME"] != EXPECTED_FIRST_SYNTHETIC:
-        raise SystemExit("FIRST_SYNTHETIC_HOMEPAGE_FRAME must remain 33 unless a new visual audit is committed.")
-
-    ...
-
-    build_derivatives(selected)
+def parse_args() -> argparse.Namespace:
+    parser = argparse.ArgumentParser()
+    parser.add_argument("--video", type=Path, default=DEFAULT_VIDEO)
+    parser.add_argument("--last-clean-frame", type=int, required=True)
+    parser.add_argument(
+        "--sample-count",
+        type=int,
+        choices=SUPPORTED_SAMPLE_COUNTS,
+        default=DEFAULT_SAMPLE_COUNT,
+    )
+    return parser.parse_args()
+
+
+def main() -> None:
+    args = parse_args()
+    video = args.video.resolve()
+    if not video.is_file():
+        raise SystemExit(f"Source video not found: {video}")
+    source_hash = file_sha256(video)
+    if source_hash != "3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95":
+        raise SystemExit("Source video SHA-256 does not match the approved user asset.")
+
+    probe = probe_video(video)
+    stream = probe["streams"][0]
+    if (
+        stream["width"] != 1280
+        or stream["height"] != 720
+        or stream["avg_frame_rate"] != "24/1"
+        or int(stream["nb_frames"]) != 240
+    ):
+        raise SystemExit("Source video metadata does not match the approved audit.")
+
+    source_frames = selected_source_frames(
+        args.last_clean_frame,
+        args.sample_count,
+    )
+    with tempfile.TemporaryDirectory(prefix="tbm-reveal-") as temp:
+        lossless = extract_lossless_frames(video, source_frames, Path(temp))
+        records = build_derivatives(lossless)
+
+    for record, source_frame in zip(records, source_frames, strict=True):
+        record["sourceFrame"] = source_frame
+        record["sourceTimeSeconds"] = round(source_frame / SOURCE_FPS, 6)
+
+    production_manifest = {
+        "version": 1,
+        "source": {
+            "file": video.name,
+            "sha256": source_hash,
+            "width": 1280,
+            "height": 720,
+            "fps": SOURCE_FPS,
+            "totalFrames": 240,
+        },
+        "selection": {
+            "lastCleanSourceFrame": args.last_clean_frame - 1,
+            "firstContaminatedSourceFrame": args.last_clean_frame,
+            "sampleCount": args.sample_count,
+        },
+        "variants": {
+            "desktop": {"width": 1280, "height": 720},
+            "mobile": {"width": 800, "height": 450},
+        },
+        "frames": records,
+    }
+    PRODUCTION_MANIFEST_PATH.write_text(
+        json.dumps(production_manifest, indent=2) + "\n",
+        encoding="utf-8",
+    )
+    print(json.dumps(production_manifest, indent=2))
```

### Exact execution sequence

First generate all three candidates outside the production directories:

```powershell
python scripts/build-forge-frame-assets.py `
  --video "Master_Execution_Prompt_—_TBM.mp4" `
  --last-clean-frame <APPROVED_EXCLUSIVE_CUTOFF> `
  --sample-count 48

python scripts/build-forge-frame-assets.py `
  --video "Master_Execution_Prompt_—_TBM.mp4" `
  --last-clean-frame <APPROVED_EXCLUSIVE_CUTOFF> `
  --sample-count 64

python scripts/build-forge-frame-assets.py `
  --video "Master_Execution_Prompt_—_TBM.mp4" `
  --last-clean-frame <APPROVED_EXCLUSIVE_CUTOFF> `
  --sample-count 80
```

`<APPROVED_EXCLUSIVE_CUTOFF>` is intentionally not fabricated here. It must be replaced with the visually verified first contaminated source-frame number. Current evidence places it near 160–162.

The selected production run must write exactly one active variant inventory. Candidate outputs used for comparison belong in CI artifacts, not the repository.

---

## 4. Patch 2 — production frame manifest

### New file

`assets/forge-reveal/frame-manifest.json`

### Exact schema

```diff
--- /dev/null
+++ b/assets/forge-reveal/frame-manifest.json
@@
+{
+  "version": 1,
+  "source": {
+    "file": "Master_Execution_Prompt_—_TBM.mp4",
+    "sha256": "3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95",
+    "width": 1280,
+    "height": 720,
+    "fps": 24,
+    "totalFrames": 240
+  },
+  "selection": {
+    "lastCleanSourceFrame": 0,
+    "firstContaminatedSourceFrame": 0,
+    "sampleCount": 64
+  },
+  "variants": {
+    "desktop": {
+      "width": 1280,
+      "height": 720
+    },
+    "mobile": {
+      "width": 800,
+      "height": 450
+    }
+  },
+  "frames": [
+    {
+      "productionIndex": 0,
+      "sourceFrame": 0,
+      "sourceTimeSeconds": 0.0,
+      "desktop": "assets/forge-reveal/desktop/frame_0001.webp",
+      "mobile": "assets/forge-reveal/mobile/frame_0001.webp",
+      "desktopSha256": "<generated>",
+      "mobileSha256": "<generated>"
+    }
+  ]
+}
```

The builder replaces all zeros and `<generated>` values. Validation must reject this illustrative one-record state.

---

## 5. Patch 3 — frame-sequence renderer

### Target

`js/forge-frame-sequence.js`

### Purpose

- Load the manifest instead of hard-coding 32 frames.
- Decode only the selected desktop or mobile variant.
- Require contiguous readiness.
- Draw synchronously from the intro controller.
- Remove the second RAF.
- Remove dynamic canvas blur.
- Never substitute a nearby frame after readiness.

### Planned diff

```diff
--- a/js/forge-frame-sequence.js
+++ b/js/forge-frame-sequence.js
@@
 const DEFAULTS = {
-  frameCount: 32,
-  initialBatchSize: 10,
+  manifestUrl: 'assets/forge-reveal/frame-manifest.json',
+  frameCount: 0,
+  initialBatchSize: 8,
   firstFrameTimeoutMs: 5500,
   mobileBreakpoint: 700,
   backgroundConcurrency: 4,
@@
-  const frames = new Array(options.frameCount).fill(null);
-  const frameFailures = new Uint8Array(options.frameCount);
-  const backgroundColours = new Array(options.frameCount).fill(null);
-  const loadedFlags = new Uint8Array(options.frameCount);
+  let manifest = null;
+  let frames = [];
+  let frameFailures = new Uint8Array();
+  let loadedFlags = new Uint8Array();
+  let frameCount = 0;
   let readyCount = 0;
   let loadErrors = 0;
-  let renderRequest = 0;
   let requestedProgress = 0;
+  let requestedIndex = 0;
+  let renderedIndex = -1;
+  let contiguousDecodedThrough = -1;
+  let scrubReady = false;
+  let fallbackUsed = false;
@@
-  function frameUrl(index) {
-    return `assets/forge-reveal/${variant}/frame_${String(index + 1).padStart(4, '0')}.webp`;
+  function frameUrl(index) {
+    return manifest.frames[index][variant];
   }
+
+  async function loadManifest() {
+    const response = await fetch(options.manifestUrl, { cache: 'no-cache' });
+    if (!response.ok) throw new Error(`Reveal manifest failed: ${response.status}`);
+    manifest = await response.json();
+    frameCount = manifest.selection.sampleCount;
+    if (manifest.frames.length !== frameCount) {
+      throw new Error('Reveal manifest frame count mismatch.');
+    }
+    frames = new Array(frameCount).fill(null);
+    frameFailures = new Uint8Array(frameCount);
+    loadedFlags = new Uint8Array(frameCount);
+  }
@@
   async function loadFrame(index) {
     try {
       const image = new Image();
       image.decoding = 'async';
       image.src = frameUrl(index);
       await image.decode();
       frames[index] = image;
       loadedFlags[index] = 1;
       readyCount += 1;
+      while (
+        contiguousDecodedThrough + 1 < frameCount
+        && loadedFlags[contiguousDecodedThrough + 1]
+      ) {
+        contiguousDecodedThrough += 1;
+      }
+      scrubReady = contiguousDecodedThrough === frameCount - 1;
       options.onProgress?.({
         loaded: readyCount,
         failed: loadErrors,
-        total: options.frameCount,
+        total: frameCount,
+        contiguousDecodedThrough,
+        scrubReady,
         variant
       });
@@
-  function nearestLoaded(index) {
+  function nearestLoadedBeforeReady(index) {
     if (loadedFlags[index]) return index;
-    for (let distance = 1; distance < options.frameCount; distance += 1) {
+    for (let distance = 1; distance < frameCount; distance += 1) {
       const previous = index - distance;
       const next = index + distance;
       if (previous >= 0 && loadedFlags[previous]) return previous;
-      if (next < options.frameCount && loadedFlags[next]) return next;
+      if (next < frameCount && loadedFlags[next]) return next;
     }
     return -1;
   }
@@
-  function drawCoverBackground(image, width, height) {
-    context.save();
-    context.filter = variant === 'mobile'
-      ? 'blur(24px) brightness(0.50) saturate(0.78)'
-      : 'blur(18px) brightness(0.55) saturate(0.82)';
-    context.drawImage(image, ...);
-    context.restore();
-  }
+  function fillBackground() {
+    context.fillStyle = '#071011';
+    context.fillRect(0, 0, canvas.width, canvas.height);
+  }
@@
-  function draw() {
-    renderRequest = 0;
-    const frameFloat = requestedProgress * (options.frameCount - 1);
-    const frameA = Math.floor(frameFloat);
-    const frameB = Math.min(frameA + 1, options.frameCount - 1);
-    const blend = frameFloat - frameA;
-    const resolvedA = nearestLoaded(frameA);
-    const resolvedB = nearestLoaded(frameB);
-    ...
-    drawCoverBackground(...);
-    context.globalAlpha = 1 - blend;
-    context.drawImage(frames[resolvedA], ...);
-    context.globalAlpha = blend;
-    context.drawImage(frames[resolvedB], ...);
-    context.globalAlpha = 1;
+  function drawProgress(value, { allowFallback = false } = {}) {
+    requestedProgress = clamp(value);
+    requestedIndex = Math.min(
+      frameCount - 1,
+      Math.round(requestedProgress * (frameCount - 1))
+    );
+    let resolvedIndex = loadedFlags[requestedIndex]
+      ? requestedIndex
+      : -1;
+
+    if (resolvedIndex < 0 && allowFallback && !scrubReady) {
+      resolvedIndex = nearestLoadedBeforeReady(requestedIndex);
+      fallbackUsed = resolvedIndex !== requestedIndex;
+    }
+    if (resolvedIndex < 0) {
+      return {
+        drawn: false,
+        requestedIndex,
+        renderedIndex,
+        fallbackUsed,
+        scrubReady
+      };
+    }
+    if (resolvedIndex === renderedIndex) {
+      return {
+        drawn: false,
+        requestedIndex,
+        renderedIndex,
+        fallbackUsed,
+        scrubReady
+      };
+    }
+
+    const started = performance.now();
+    fillBackground();
+    drawContainedFrame(frames[resolvedIndex]);
+    renderedIndex = resolvedIndex;
+    return {
+      drawn: true,
+      requestedIndex,
+      renderedIndex,
+      fallbackUsed,
+      scrubReady,
+      drawMs: performance.now() - started
+    };
   }
@@
-  function requestDraw() {
-    if (!renderRequest && visible && !disposed) {
-      renderRequest = requestAnimationFrame(draw);
-    }
-  }
-
-  function setProgress(value) {
-    requestedProgress = clamp(value);
-    requestDraw();
-  }
-
   async function initialise() {
+    await loadManifest();
     ...
   }
@@
   return {
     initialise,
-    setProgress,
+    drawProgress,
+    isScrubReady: () => scrubReady,
     resize,
     setVisible,
     dispose,
     getState() {
       return {
-        frameCount: options.frameCount,
+        frameCount,
         readyCount,
         loadErrors,
+        contiguousDecodedThrough,
+        scrubReady,
+        requestedIndex,
+        renderedIndex,
+        fallbackUsed,
         variant
       };
     }
   };
```

### Required implementation detail

`drawContainedFrame()` must retain the current correct aspect-fit calculations but perform only:

1. one background fill;
2. one foreground `drawImage`.

It must not set `context.filter`.

---

## 6. Patch 4 — intro controller and hero lifecycle bridge

### Target

`js/forge-intro.js`

### Event contract

Use a DOM event so module load order cannot lose the current state:

```js
document.documentElement.dataset.tbmHeroLifecycle = state;
window.dispatchEvent(new CustomEvent('tbm:hero-lifecycle', {
  detail: { state, progress }
}));
```

V3 reads the dataset during initialization and listens for subsequent events.

### Planned diff

```diff
--- a/js/forge-intro.js
+++ b/js/forge-intro.js
@@
 const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
+const REVEAL_MOTION_END = 0.78;
+const HERO_PREWARM_START = 0.74;
+const HANDOFF_START = 0.86;
@@
   let firstFrameReady = false;
+  let scrubReady = false;
   let fatalFailure = false;
+  let lastHeroLifecycle = '';
@@
+  function publishHeroLifecycle(state, progress = 0) {
+    document.documentElement.dataset.tbmHeroLifecycle = state;
+    document.documentElement.style.setProperty(
+      '--tbm-handoff-progress',
+      progress.toFixed(4)
+    );
+    if (state === lastHeroLifecycle && state !== 'handoff-ready') return;
+    lastHeroLifecycle = state;
+    window.dispatchEvent(new CustomEvent('tbm:hero-lifecycle', {
+      detail: { state, progress }
+    }));
+  }
+
+  function updateHeroLifecycle(progress) {
+    if (progress < HERO_PREWARM_START) {
+      publishHeroLifecycle('suspended', 0);
+      return;
+    }
+    if (progress < HANDOFF_START) {
+      publishHeroLifecycle('prewarming', 0);
+      return;
+    }
+    if (progress < 1) {
+      publishHeroLifecycle(
+        'handoff-ready',
+        smooth(HANDOFF_START, 1, progress)
+      );
+      return;
+    }
+    publishHeroLifecycle('active', 1);
+  }
@@
     sequence = createForgeFrameSequence(canvas, {
-      frameCount: 32,
+      manifestUrl: 'assets/forge-reveal/frame-manifest.json',
       onFirstFrame() {
         firstFrameReady = true;
         intro.dataset.loadState = 'first-frame';
       },
       onProgress(detail) {
+        scrubReady = detail.scrubReady;
+        intro.dataset.scrubReady = String(scrubReady);
         ...
       },
       onComplete(detail) {
-        intro.dataset.loadState = detail.failed ? 'partial' : 'ready';
+        intro.dataset.loadState =
+          detail.failed || !detail.scrubReady ? 'partial' : 'ready';
       }
     });
@@
   function render() {
     frameRequest = 0;
     const progress = readProgress();
-    const sequenceProgress = clamp(progress / 0.82);
-    const release = smooth(0.84, 1, progress);
+    const sequenceProgress = clamp(progress / REVEAL_MOTION_END);
+    const release = smooth(HANDOFF_START, 1, progress);
@@
-    sequence?.setProgress(sequenceProgress);
+    const drawResult = sequence?.drawProgress(sequenceProgress, {
+      allowFallback: !scrubReady
+    });
+    if (
+      scrubReady
+      && drawResult
+      && drawResult.requestedIndex !== drawResult.renderedIndex
+    ) {
+      intro.dataset.loadState = 'invariant-failure';
+      releaseImmediately('frame-invariant-failure');
+      return;
+    }
+    updateHeroLifecycle(progress);
@@
   function releaseImmediately(reason) {
     ...
+    publishHeroLifecycle('active', 1);
   }
@@
   function onVisibilityChange() {
     pageVisible = !document.hidden;
     sequence?.setVisible(pageVisible);
+    if (!pageVisible) {
+      publishHeroLifecycle('offscreen', 0);
+    } else {
+      scheduleRender();
+    }
   }
@@
+  publishHeroLifecycle('suspended', 0);
   sequence.initialise();
```

### Readiness behavior

Until `scrubReady`:

- first frame may display;
- scrolling may be clamped to the highest contiguous decoded frame or the intro may remain in its loading state;
- the homepage must still fail open after timeout;
- no silent substitution is allowed after readiness.

The selected approach must be fixed in tests. The recommended first implementation is to clamp interaction until all selected frames decode because the sequence is short.

---

## 7. Patch 5 — intro CSS

### Target

`css/forge-intro.css`

### Purpose

Keep the cinematic overlay while ensuring the renderer—not CSS filters—is responsible for frame imagery.

### Planned diff

```diff
--- a/css/forge-intro.css
+++ b/css/forge-intro.css
@@
 .forge-intro__canvas {
   position: absolute;
   inset: 0;
   width: 100%;
   height: 100%;
+  background: #071011;
 }
@@
-.forge-intro__canvas {
-  filter: saturate(1.05) contrast(1.03);
-}
+.forge-intro[data-scrub-ready="false"] .forge-intro__meter {
+  opacity: 1;
+}
+
+.forge-intro[data-scrub-ready="true"] .forge-intro__meter {
+  opacity: 0;
+}
@@
+.forge-intro[data-load-state="invariant-failure"] {
+  visibility: hidden;
+  pointer-events: none;
+}
@@
 @media (prefers-reduced-motion: reduce) {
   .forge-intro {
-    ...
+    display: none;
   }
+  body.forge-intro-pending > .skip-link,
+  body.forge-intro-pending > .site-header,
+  body.forge-intro-pending > main,
+  body.forge-intro-pending > .site-footer {
+    pointer-events: auto;
+    user-select: auto;
+  }
 }
```

Do not alter the approved intro wording.

---

## 8. Patch 6 — isolated V3 hero module

### New file

`js/hero-3d-reveal-match-v3.js`

### Construction strategy

Copy the proven V2 setup, environment, resize, visibility, renderer diagnostics and disposal sections, then replace:

- geometry;
- materials;
- ring definitions;
- node system;
- scene progress;
- animation lifecycle;
- ScrollTrigger ownership.

Do not copy the V2 five-equal-ring design or continuous hidden RAF behavior.

### Exact module skeleton

```diff
--- /dev/null
+++ b/js/hero-3d-reveal-match-v3.js
@@
+import * as THREE from 'three';
+import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
+import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
+import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
+
+const canvas = document.getElementById('hero-3d-canvas');
+const stage = document.querySelector('.hero-3d-stage');
+const hero = document.querySelector('.hero-scroll-sequence');
+const cards = [...document.querySelectorAll('.hero-card')];
+const motionToggle = document.querySelector('[data-hero-motion]');
+const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
+const mobile = window.matchMedia('(max-width: 899px)');
+
+const HERO_STATE = Object.freeze({
+  SUSPENDED: 'suspended',
+  PREWARMING: 'prewarming',
+  HANDOFF_READY: 'handoff-ready',
+  ACTIVE: 'active',
+  OFFSCREEN: 'offscreen'
+});
+
+const VALID_STATES = new Set(Object.values(HERO_STATE));
+
+if (canvas && stage && hero) initialiseHeroV3();
+
+function initialiseHeroV3() {
+  const usePostProcessing =
+    !mobile.matches
+    && !reducedMotion.matches
+    && new URLSearchParams(location.search).get('renderer') !== 'direct';
+
+  const renderer = new THREE.WebGLRenderer({
+    canvas,
+    alpha: true,
+    antialias: !usePostProcessing && window.devicePixelRatio <= 1.5,
+    powerPreference: 'high-performance',
+    failIfMajorPerformanceCaveat: false
+  });
+  renderer.outputColorSpace = THREE.SRGBColorSpace;
+  renderer.toneMapping = THREE.ACESFilmicToneMapping;
+  renderer.toneMappingExposure = 1.08;
+
+  const scene = new THREE.Scene();
+  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
+  camera.position.set(0, 0.04, 10.9);
+
+  const environment = createStudioEnvironment(renderer);
+  scene.environment = environment.texture;
+
+  const armillaryRoot = new THREE.Group();
+  armillaryRoot.name = 'armillaryRoot';
+  armillaryRoot.rotation.set(-0.07, -0.16, 0.025);
+  scene.add(armillaryRoot);
+
+  const coreRadius = 0.96;
+  const outerRadius = 2.02;
+  const coreGeometry = new THREE.SphereGeometry(coreRadius, 96, 96);
+  const coreMaterial = new THREE.MeshPhysicalMaterial({
+    color: 0x030506,
+    metalness: 0.15,
+    roughness: 0.18,
+    clearcoat: 1,
+    clearcoatRoughness: 0.12,
+    specularIntensity: 1,
+    specularColor: new THREE.Color(0xdde5e4),
+    envMapIntensity: 1.1
+  });
+  const core = new THREE.Mesh(coreGeometry, coreMaterial);
+  core.name = 'lacquerCore';
+  armillaryRoot.add(core);
+
+  const dominantBronze = new THREE.MeshPhysicalMaterial({
+    color: 0x845642,
+    metalness: 0.94,
+    roughness: 0.29,
+    clearcoat: 0.34,
+    clearcoatRoughness: 0.18,
+    envMapIntensity: 1.02
+  });
+  const cageBronze = new THREE.MeshPhysicalMaterial({
+    color: 0x654639,
+    metalness: 0.9,
+    roughness: 0.4,
+    clearcoat: 0.16,
+    clearcoatRoughness: 0.28,
+    envMapIntensity: 0.72
+  });
+
+  const ringDefinitions = [
+    {
+      id: 'outer-silhouette',
+      radius: outerRadius,
+      tube: 0.018,
+      rotation: [0.015, 0.03, -0.015],
+      material: cageBronze,
+      speed: 0.003
+    },
+    {
+      id: 'diagonal-a',
+      radius: 1.65,
+      tube: 0.035,
+      rotation: [0.86, 0.22, 0.68],
+      material: dominantBronze,
+      speed: 0.014
+    },
+    {
+      id: 'diagonal-b',
+      radius: 1.69,
+      tube: 0.033,
+      rotation: [-0.62, 0.38, -0.88],
+      material: dominantBronze,
+      speed: -0.011
+    },
+    {
+      id: 'vertical',
+      radius: 1.61,
+      tube: 0.03,
+      rotation: [Math.PI / 2, 0.08, 0.04],
+      material: dominantBronze,
+      speed: 0.009
+    }
+  ];
+
+  const rings = ringDefinitions.map(definition => {
+    const geometry = new THREE.TorusGeometry(
+      definition.radius,
+      definition.tube,
+      18,
+      192
+    );
+    const ring = new THREE.Mesh(geometry, definition.material);
+    ring.name = definition.id;
+    ring.rotation.set(...definition.rotation);
+    ring.userData.baseRotation = new THREE.Euler(...definition.rotation);
+    ring.userData.speed = definition.speed;
+    armillaryRoot.add(ring);
+    return ring;
+  });
+
+  const network = createIrregularNetwork({
+    THREE,
+    radius: 1.34,
+    material: cageBronze,
+    seed: 0x54424d33
+  });
+  network.name = 'irregularWireNetwork';
+  armillaryRoot.add(network);
+
+  const nodeCoordinates = [
+    [-1.34, 1.12, 0.42],
+    [-1.24, -0.56, 0.88],
+    [-1.05, -0.68, 0.96],
+    [-0.88, -0.77, 1.02],
+    [1.31, -0.92, 0.58],
+    [0.94, 0.84, -0.88]
+  ];
+  const nodeGeometry = new THREE.SphereGeometry(0.075, 20, 20);
+  const nodeMaterial = dominantBronze.clone();
+  const nodes = new THREE.InstancedMesh(
+    nodeGeometry,
+    nodeMaterial,
+    nodeCoordinates.length
+  );
+  const nodeMatrix = new THREE.Matrix4();
+  nodeCoordinates.forEach((position, index) => {
+    nodeMatrix.makeTranslation(...position);
+    nodes.setMatrixAt(index, nodeMatrix);
+  });
+  nodes.instanceMatrix.needsUpdate = true;
+  nodes.name = 'intentionalNodes';
+  armillaryRoot.add(nodes);
+
+  addStudioLights(scene);
+  const atmosphere = createRestrainedAtmosphere(THREE, mobile.matches ? 70 : 120);
+  scene.add(atmosphere.points);
+
+  let composer = null;
+  let bloomPass = null;
+  if (usePostProcessing) {
+    composer = new EffectComposer(renderer);
+    composer.addPass(new RenderPass(scene, camera));
+    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.18, 0.91);
+    composer.addPass(bloomPass);
+  }
+
+  const clock = new THREE.Clock(false);
+  const pointerTarget = new THREE.Vector2();
+  const pointerCurrent = new THREE.Vector2();
+  let lifecycle = readInitialLifecycle();
+  let homepageProgress = 0;
+  let handoffProgress = 0;
+  let phase = 0;
+  let motionEnabled = true;
+  let pageVisible = !document.hidden;
+  let stageVisible = true;
+  let rafId = 0;
+  let prewarmRendered = false;
+
+  function readInitialLifecycle() {
+    const value = document.documentElement.dataset.tbmHeroLifecycle;
+    return VALID_STATES.has(value) ? value : HERO_STATE.SUSPENDED;
+  }
+
+  function renderOnce() {
+    if (composer) composer.render();
+    else renderer.render(scene, camera);
+  }
+
+  function applyCalibratedPose() {
+    armillaryRoot.position.set(0, -0.03, 0);
+    armillaryRoot.scale.setScalar(mobile.matches ? 0.91 : 1.04);
+    armillaryRoot.rotation.set(-0.07, -0.16, 0.025);
+    rings.forEach((ring, index) => {
+      ring.rotation.copy(ring.userData.baseRotation);
+      if (index > 0) ring.rotation.y += handoffProgress * 0.01;
+    });
+  }
+
+  function applyActivePose(delta) {
+    if (motionEnabled && !reducedMotion.matches) phase += delta;
+    pointerCurrent.lerp(pointerTarget, 1 - Math.exp(-delta * 7));
+    armillaryRoot.rotation.x =
+      -0.07 - pointerCurrent.y * 0.12 + Math.sin(phase * 0.21) * 0.005;
+    armillaryRoot.rotation.y =
+      -0.16 + pointerCurrent.x * 0.16 + phase * 0.018 + homepageProgress * 0.08;
+    armillaryRoot.rotation.z =
+      0.025 + Math.sin(phase * 0.17) * 0.004;
+    core.rotation.y = -phase * 0.022;
+    network.rotation.y = phase * 0.014;
+    rings.forEach((ring, index) => {
+      ring.rotation.copy(ring.userData.baseRotation);
+      if (index > 0) {
+        ring.rotation.y += phase * ring.userData.speed;
+        ring.rotation.z += Math.sin(phase * 0.18 + index) * 0.006;
+      }
+    });
+    atmosphere.points.rotation.y = phase * 0.006;
+  }
+
+  function shouldRunContinuously() {
+    return (
+      lifecycle === HERO_STATE.ACTIVE
+      && pageVisible
+      && stageVisible
+      && !reducedMotion.matches
+    );
+  }
+
+  function scheduleFrame() {
+    if (!rafId && shouldRunContinuously()) {
+      clock.start();
+      rafId = requestAnimationFrame(frame);
+    }
+  }
+
+  function frame() {
+    rafId = 0;
+    if (!shouldRunContinuously()) {
+      clock.stop();
+      return;
+    }
+    const delta = Math.min(clock.getDelta(), 0.05);
+    applyActivePose(delta);
+    renderOnce();
+    scheduleFrame();
+  }
+
+  function setLifecycle(nextState) {
+    if (!VALID_STATES.has(nextState)) return;
+    lifecycle = nextState;
+    if (nextState === HERO_STATE.SUSPENDED) {
+      prewarmRendered = false;
+      cancelAnimationFrame(rafId);
+      rafId = 0;
+      applyCalibratedPose();
+      return;
+    }
+    if (nextState === HERO_STATE.PREWARMING && !prewarmRendered) {
+      applyCalibratedPose();
+      renderOnce();
+      prewarmRendered = true;
+      return;
+    }
+    if (nextState === HERO_STATE.HANDOFF_READY) {
+      cancelAnimationFrame(rafId);
+      rafId = 0;
+      applyCalibratedPose();
+      renderOnce();
+      return;
+    }
+    if (nextState === HERO_STATE.ACTIVE) {
+      applyActivePose(0);
+      renderOnce();
+      scheduleFrame();
+      return;
+    }
+    cancelAnimationFrame(rafId);
+    rafId = 0;
+  }
+
+  function setHandoffProgress(value) {
+    handoffProgress = THREE.MathUtils.clamp(value, 0, 1);
+    if (lifecycle === HERO_STATE.HANDOFF_READY) {
+      applyCalibratedPose();
+      renderOnce();
+    }
+  }
+
+  function setHomepageProgress(value) {
+    homepageProgress = THREE.MathUtils.clamp(value, 0, 1);
+  }
+
+  function onLifecycle(event) {
+    const detail = event.detail || {};
+    setHandoffProgress(detail.progress || 0);
+    setLifecycle(detail.state);
+  }
+  window.addEventListener('tbm:hero-lifecycle', onLifecycle);
+
+  installHomepageScroll(setHomepageProgress);
+  installPointerInteraction(stage, pointerTarget, motionEnabled, reducedMotion);
+  installResize();
+  installVisibility();
+  installMotionToggle();
+
+  resize();
+  applyCalibratedPose();
+  if (lifecycle !== HERO_STATE.SUSPENDED) renderOnce();
+  setLifecycle(lifecycle);
+
+  window.__tbmHeroV3 = {
+    setLifecycle,
+    setHandoffProgress,
+    setHomepageProgress,
+    renderOnce,
+    getState() {
+      return {
+        lifecycle,
+        handoffProgress,
+        homepageProgress,
+        motionEnabled,
+        reducedMotion: reducedMotion.matches,
+        renderPath: composer ? 'composer' : 'direct',
+        camera: {
+          fov: camera.fov,
+          position: camera.position.toArray()
+        },
+        root: {
+          position: armillaryRoot.position.toArray(),
+          rotation: armillaryRoot.rotation.toArray(),
+          scale: armillaryRoot.scale.toArray()
+        },
+        ringQuaternions: rings.map(ring => ring.quaternion.toArray()),
+        render: { ...renderer.info.render },
+        memory: { ...renderer.info.memory }
+      };
+    },
+    dispose
+  };
+
+  function dispose() {
+    cancelAnimationFrame(rafId);
+    window.removeEventListener('tbm:hero-lifecycle', onLifecycle);
+    scene.traverse(object => {
+      object.geometry?.dispose?.();
+      if (Array.isArray(object.material)) {
+        object.material.forEach(material => material.dispose?.());
+      } else {
+        object.material?.dispose?.();
+      }
+    });
+    environment.dispose();
+    composer?.dispose?.();
+    renderer.dispose();
+    delete window.__tbmHeroV3;
+  }
+}
```

### Required helper functions in the same file

The final module must include complete implementations of:

```diff
@@
+function createStudioEnvironment(renderer) {
+  // Reuse V2 PMREM lifecycle, but use two elongated neutral panels,
+  // one restrained warm panel and a dark teal-black environment.
+}
+
+function createIrregularNetwork({ THREE, radius, material, seed }) {
+  // Deterministic 18–30 shell anchors and a curated sparse edge list.
+  // Return one Group and do not create geometry in the animation loop.
+}
+
+function createRestrainedAtmosphere(THREE, count) {
+  // Reuse one Points geometry/material. No comet heads or trails.
+}
+
+function addStudioLights(scene) {
+  // Cool/neutral key, restrained fill and warm bronze rim.
+  // No visible light meshes.
+}
+
+function installHomepageScroll(setProgress) {
+  // One ScrollTrigger only, disabled from controlling handoff state.
+  // It may update homepage progress while lifecycle is active.
+}
+
+function installPointerInteraction(stage, target, motionEnabled, reducedMotion) {
+  // Fine pointer only; low-amplitude normalized target.
+}
```

These helpers should be copied selectively from V2/PR #8 where already proven. No placeholder or stub may remain in implemented code.

### Calibration warning

The geometry numbers in this plan are exact starting values for the first V3 render, not a claim that they already match the video. The approved implementation must replace them with measured values after source/live overlays. Tests should snapshot the final calibrated values.

---

## 9. Patch 7 — V3 CSS

### New file

`css/hero-reveal-match-v3.css`

### Planned diff

```diff
--- /dev/null
+++ b/css/hero-reveal-match-v3.css
@@
+html[data-tbm-hero-lifecycle="suspended"] .hero-3d-canvas,
+html[data-tbm-hero-lifecycle="prewarming"] .hero-3d-canvas {
+  opacity: 0;
+}
+
+html[data-tbm-hero-lifecycle="handoff-ready"] .hero-3d-canvas {
+  opacity: var(--tbm-handoff-progress, 0);
+}
+
+html[data-tbm-hero-lifecycle="active"] .hero-3d-canvas {
+  opacity: 1;
+}
+
+.hero-3d-stage {
+  isolation: isolate;
+}
+
+.hero-3d-canvas {
+  transition: none;
+  will-change: opacity;
+}
+
+.hero-3d-stage::before {
+  content: "";
+  position: absolute;
+  inset: 5% 2% 4%;
+  z-index: -1;
+  pointer-events: none;
+  background:
+    radial-gradient(circle at 54% 44%, rgba(28, 45, 43, 0.18), transparent 46%),
+    radial-gradient(circle at 72% 68%, rgba(112, 65, 38, 0.08), transparent 34%);
+  filter: blur(20px);
+}
+
+@media (max-width: 899px) {
+  .hero-3d-stage::before {
+    inset: 10% 0 2%;
+    opacity: 0.74;
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+  .hero-3d-canvas {
+    transition: none;
+  }
+}
```

Most current card/layout rules should be imported or copied unchanged from `hero-reveal-match-v2.css`. Do not create a second conflicting layout system.

---

## 10. Patch 8 — index.html integration

### Purpose

- Load V3, not V2.
- Keep V2 files for rollback.
- Read frame count from the manifest at runtime; the data attribute becomes descriptive rather than authoritative.
- Preserve all wording and unrelated markup.

### Planned diff

```diff
--- a/index.html
+++ b/index.html
@@
-  <link rel="stylesheet" href="css/hero-reveal-match-v2.css">
+  <link rel="stylesheet" href="css/hero-reveal-match-v3.css">
   <link rel="stylesheet" href="css/forge-intro.css">
@@
-<div class="forge-intro" id="forge-intro" data-phase="opening" data-load-state="loading" data-frame-count="32" role="img" aria-label="A forged bronze gate opens to reveal The Blacksmith Market homepage">
+<div class="forge-intro" id="forge-intro" data-phase="opening" data-load-state="loading" data-scrub-ready="false" role="img" aria-label="A forged bronze gate opens to reveal The Blacksmith Market homepage">
@@
-<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>
+<script type="module" src="js/hero-3d-reveal-match-v3.js"></script>
```

No other homepage content is permitted to change in this patch.

---

## 11. Patch 9 — sequence validator

### Target

`scripts/validate-forge-frame-sequence.mjs`

### Problem being corrected

The current validator hard-codes:

- 48 JPEG sources;
- cutoff 32/33;
- exactly 32 production WebPs;
- V2 stylesheet/module;
- a reconstructed `index.html` based on the old baseline.

That validator must be updated to validate the new source manifest and V3 integration without discarding protected-site checks.

### Planned diff

```diff
--- a/scripts/validate-forge-frame-sequence.mjs
+++ b/scripts/validate-forge-frame-sequence.mjs
@@
 const protectedHashes={
   'css/hero-scroll.css':'82070a5ead77c7d7926beb486553b8a657f872ed',
   'js/hero-3d.js':'8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b',
   'js/home-v2.js':'89b4ad5aa06cf425d71789c1917106c439ebe594',
   'css/site-v2.css':'730c2a3abf3e850a155287264d7107a37a4975a7'
 };
@@
-const manifest=JSON.parse(await read('artifacts/forge-frame-audit/frame-manifest.json'));
-if(manifest.SOURCE_FRAME_COUNT!==48 || manifest.frames.length!==48) fail('Frame manifest must contain 48 records.');
-if(manifest.LAST_CLEAN_FRAME!==32 || manifest.FIRST_SYNTHETIC_HOMEPAGE_FRAME!==33 || manifest.SELECTED_FRAME_COUNT!==32){
-  fail('Audited cutoff must be LAST_CLEAN_FRAME=32, FIRST_SYNTHETIC_HOMEPAGE_FRAME=33, SELECTED_FRAME_COUNT=32.');
-}
-const selected=manifest.frames.filter(frame=>frame.selected).map(frame=>frame.index);
-...
+const manifest=JSON.parse(await read('assets/forge-reveal/frame-manifest.json'));
+if(manifest.version!==1) fail('Reveal manifest version must be 1.');
+if(manifest.source.sha256!=='3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95'){
+  fail('Reveal manifest source hash does not match the approved MP4.');
+}
+if(
+  manifest.source.width!==1280
+  || manifest.source.height!==720
+  || manifest.source.fps!==24
+  || manifest.source.totalFrames!==240
+){
+  fail('Reveal source metadata does not match the approved MP4.');
+}
+const frameCount=manifest.selection.sampleCount;
+if(![48,64,80].includes(frameCount)){
+  fail(`Unsupported selected frame count: ${frameCount}.`);
+}
+if(manifest.frames.length!==frameCount){
+  fail('Manifest records do not match selected frame count.');
+}
+if(
+  manifest.selection.lastCleanSourceFrame
+  >= manifest.selection.firstContaminatedSourceFrame
+){
+  fail('Clean/contaminated source boundary is invalid.');
+}
+const productionIndices=manifest.frames.map(frame=>frame.productionIndex);
+if(JSON.stringify(productionIndices)!==JSON.stringify(
+  Array.from({length:frameCount},(_,index)=>index)
+)){
+  fail('Production frame indices are not contiguous.');
+}
+for(let index=1; index<manifest.frames.length; index+=1){
+  if(manifest.frames[index].sourceFrame<=manifest.frames[index-1].sourceFrame){
+    fail('Source frame mapping must be strictly increasing.');
+  }
+}
+if(manifest.frames.at(-1).sourceFrame!==manifest.selection.lastCleanSourceFrame){
+  fail('Final production frame is not the approved last clean source frame.');
+}
@@
-const expectedAssets=Array.from({length:32},(_,index)=>`frame_${String(index+1).padStart(4,'0')}.webp`);
+const expectedAssets=Array.from(
+  {length:frameCount},
+  (_,index)=>`frame_${String(index+1).padStart(4,'0')}.webp`
+);
 for(const variant of ['desktop','mobile']){
   const files=(await readdir(path.join(root,'assets','forge-reveal',variant))).sort();
-  if(JSON.stringify(files)!==JSON.stringify(expectedAssets)) fail(`${variant} asset inventory is not exactly frame_0001.webp..frame_0032.webp.`);
+  if(JSON.stringify(files)!==JSON.stringify(expectedAssets)){
+    fail(`${variant} asset inventory does not match the manifest.`);
+  }
 }
@@
-for(const term of ['getVelocity(','ScrollTrigger.getVelocity','sessionStorage.setItem','frame_0033.webp','ezgif-frame-033.jpg']){
+for(const term of [
+  'getVelocity(',
+  'ScrollTrigger.getVelocity',
+  'sessionStorage.setItem',
+  'context.filter',
+  'requestAnimationFrame(draw)'
+]){
   if(combined.includes(term)) fail(`Forbidden implementation term found: ${term}`);
 }
+if(!combined.includes('drawProgress(')){
+  fail('Single-scheduler drawProgress integration is missing.');
+}
+if(!combined.includes("tbm:hero-lifecycle")){
+  fail('Hero lifecycle bridge is missing.');
+}
@@
-const applyExpectedLiveHeroV2=text=>text
+const applyExpectedLiveHeroV3=text=>text
@@
-    '  <link rel="stylesheet" href="css/hero-scroll.css">\n  <link rel="stylesheet" href="css/hero-reveal-match-v2.css">'
+    '  <link rel="stylesheet" href="css/hero-scroll.css">\n  <link rel="stylesheet" href="css/hero-reveal-match-v3.css">'
@@
-    '<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>'
+    '<script type="module" src="js/hero-3d-reveal-match-v3.js"></script>'
@@
-const expectedIndex=applyExpectedLiveHeroV2(applyExpectedIntegration(baseline)).replace(/\r\n/g,'\n');
+const expectedIndex=applyExpectedLiveHeroV3(applyExpectedIntegration(baseline))
+  .replace(' data-frame-count="32"',' data-scrub-ready="false"')
+  .replace(/\r\n/g,'\n');
@@
-console.log('Frame-sequence validation passed: protected homepage and Forge assets are intact, audited frames 001..032 are deployable, and only the approved live-hero V2 additions are present.');
+console.log(
+  `Frame-sequence validation passed: ${frameCount} video-derived frames, `
+  + 'protected homepage files intact, single-scheduler reveal and V3 integration present.'
+);
```

The exact baseline reconstruction should be replaced with a fixture or carefully updated transformation if its string replacement becomes fragile. It must still prove that no unrelated homepage markup changed.

---

## 12. Patch 10 — V3 verifier

### New file

`scripts/verify-reveal-match-v3.py`

### Planned diff

```diff
--- /dev/null
+++ b/scripts/verify-reveal-match-v3.py
@@
+from pathlib import Path
+import json
+import re
+
+ROOT = Path(__file__).resolve().parents[1]
+
+
+def read(relative: str) -> str:
+    return (ROOT / relative).read_text(encoding="utf-8")
+
+
+def require(condition: bool, message: str) -> None:
+    if not condition:
+        raise SystemExit(message)
+
+
+def main() -> None:
+    index = read("index.html")
+    hero = read("js/hero-3d-reveal-match-v3.js")
+    intro = read("js/forge-intro.js")
+    sequence = read("js/forge-frame-sequence.js")
+    manifest = json.loads(read("assets/forge-reveal/frame-manifest.json"))
+
+    require("hero-reveal-match-v3.css" in index, "V3 CSS is not loaded.")
+    require("hero-3d-reveal-match-v3.js" in index, "V3 JS is not loaded.")
+    require("hero-3d-reveal-match-v2.js" not in index, "V2 and V3 are both loaded.")
+    require("HERO_STATE" in hero, "Hero lifecycle enum is missing.")
+    for state in (
+        "suspended",
+        "prewarming",
+        "handoff-ready",
+        "active",
+        "offscreen",
+    ):
+        require(state in hero, f"Hero lifecycle state missing: {state}")
+
+    require("new THREE.SphereGeometry(coreRadius, 96, 96)" in hero,
+            "High-quality lacquer core is missing.")
+    require(hero.count("new THREE.TorusGeometry(") >= 1,
+            "Dominant ring geometry is missing.")
+    require("new THREE.InstancedMesh(" in hero,
+            "Instanced intentional nodes are missing.")
+    require("createIrregularNetwork" in hero,
+            "Irregular network is missing.")
+    for forbidden in ("createForgeComet", "cometTrail", "pedestal", "yellowHalo"):
+        require(forbidden not in hero, f"Forbidden V3 treatment found: {forbidden}")
+
+    require("drawProgress(" in intro, "Intro does not use synchronous drawProgress.")
+    require("setProgress(" not in intro, "Old asynchronous setProgress path remains.")
+    require("requestAnimationFrame(draw)" not in sequence,
+            "Second reveal RAF remains.")
+    require("context.filter" not in sequence,
+            "Dynamic canvas blur remains.")
+    require("scrubReady" in sequence,
+            "Scrub readiness invariant is missing.")
+    require("nearestLoadedBeforeReady" in sequence,
+            "Pre-ready fallback function is missing.")
+
+    require(manifest["frames"][-1]["sourceFrame"]
+            == manifest["selection"]["lastCleanSourceFrame"],
+            "Final asset is not the selected clean source frame.")
+    require(manifest["selection"]["sampleCount"] in (48, 64, 80),
+            "Unexpected production frame count.")
+
+    placeholder_pattern = re.compile(r"<generated>|TODO|TBD|FIXME")
+    for path in (
+        "js/hero-3d-reveal-match-v3.js",
+        "assets/forge-reveal/frame-manifest.json",
+    ):
+        require(not placeholder_pattern.search(read(path)),
+                f"Unresolved placeholder in {path}.")
+
+    print("Reveal-match V3 static verification passed.")
+
+
+if __name__ == "__main__":
+    main()
```

Static source assertions do not prove visual quality. This verifier supplements browser evidence.

---

## 13. Patch 11 — browser capture diagnostics

### New file

`scripts/capture-reveal-match-v3.mjs`

### Required capture contract

```diff
--- /dev/null
+++ b/scripts/capture-reveal-match-v3.mjs
@@
+import { chromium } from 'playwright';
+import { mkdir, writeFile } from 'node:fs/promises';
+
+const baseURL = process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/index.html';
+const output = 'artifacts/reveal-match-v3';
+const viewports = [
+  { name: '1920x1080', width: 1920, height: 1080 },
+  { name: '1680x900', width: 1680, height: 900 },
+  { name: '1366x768', width: 1366, height: 768 },
+  { name: '390x844', width: 390, height: 844 },
+  { name: '430x932', width: 430, height: 932 }
+];
+
+await mkdir(output, { recursive: true });
+const browser = await chromium.launch({ headless: true });
+const report = [];
+
+for (const viewport of viewports) {
+  const context = await browser.newContext({
+    viewport: { width: viewport.width, height: viewport.height },
+    deviceScaleFactor: 1
+  });
+  const page = await context.newPage();
+  const errors = [];
+  page.on('console', message => {
+    if (message.type() === 'error') errors.push(message.text());
+  });
+  page.on('pageerror', error => errors.push(error.message));
+
+  await page.goto(baseURL, { waitUntil: 'networkidle' });
+  await page.waitForFunction(() =>
+    document.querySelector('#forge-intro')?.dataset.scrubReady === 'true'
+  );
+
+  const intro = await page.locator('#forge-intro').boundingBox();
+  const travel = Math.max(1, intro.height - viewport.height);
+  const samples = [];
+
+  for (const direction of ['down', 'up']) {
+    const positions = direction === 'down'
+      ? Array.from({ length: 41 }, (_, index) => index / 40)
+      : Array.from({ length: 41 }, (_, index) => 1 - index / 40);
+    for (const progress of positions) {
+      await page.evaluate(
+        y => window.scrollTo(0, y),
+        intro.y + travel * progress
+      );
+      await page.evaluate(() => new Promise(requestAnimationFrame));
+      samples.push(await page.evaluate(() => ({
+        scrollY: window.scrollY,
+        intro: window.__tbmForgeIntro?.getState?.() || null,
+        hero: window.__tbmHeroV3?.getState?.() || null
+      })));
+    }
+  }
+
+  await page.screenshot({
+    path: `${output}/${viewport.name}-handoff.png`,
+    fullPage: false
+  });
+
+  report.push({ viewport, errors, samples });
+  await context.close();
+}
+
+await browser.close();
+await writeFile(
+  `${output}/diagnostics.json`,
+  JSON.stringify(report, null, 2)
+);
```

Extend this file during implementation to:

- record videos;
- capture direct/composer variants;
- assert monotonic requested/rendered indices;
- calculate frame intervals;
- capture exact final-frame and handoff overlays.

---

## 14. Patch 12 — workflow changes

### Reveal workflow

Target: `.github/workflows/forge-intro-visual.yml`

```diff
--- a/.github/workflows/forge-intro-visual.yml
+++ b/.github/workflows/forge-intro-visual.yml
@@
 on:
   push:
     branches:
-      - feature/forge-intro-reveal-v2
+      - codex/final-forge-hero-recovery-v3
@@
       - assets/forge-reveal/**
+      - js/hero-3d-reveal-match-v3.js
+      - css/hero-reveal-match-v3.css
+      - scripts/verify-reveal-match-v3.py
+      - scripts/capture-reveal-match-v3.mjs
@@
-      - name: Rebuild and verify audited production assets
-        run: |
-          python scripts/build-forge-frame-assets.py
-          git diff --exit-code -- assets/forge-reveal artifacts/forge-frame-audit/performance-report.json
+      - name: Verify committed video-derived production assets
+        run: |
+          python scripts/verify-reveal-match-v3.py
+          node scripts/validate-forge-frame-sequence.mjs
@@
       - name: Validate syntax and audited cutoff
         run: |
           node --check js/forge-intro.js
           node --check js/forge-frame-sequence.js
+          node --check js/hero-3d-reveal-match-v3.js
+          node --check scripts/capture-reveal-match-v3.mjs
           node scripts/validate-forge-frame-sequence.mjs
+          python scripts/verify-reveal-match-v3.py
@@
       - name: Capture screenshots, reverse motion and diagnostics
         run: |
           mkdir -p artifacts/forge-intro
           node scripts/capture-forge-intro.mjs
+          node scripts/capture-reveal-match-v3.mjs
@@
           path: |
             artifacts/forge-frame-audit/*
             artifacts/forge-intro/**
+            artifacts/reveal-match-v3/**
@@
-          git push origin HEAD:feature/forge-intro-reveal-v2
+          git push origin HEAD:codex/final-forge-hero-recovery-v3
```

### V3 workflow

Create `.github/workflows/reveal-match-v3-evidence.yml` by copying V2 workflow mechanics and changing:

```diff
--- /dev/null
+++ b/.github/workflows/reveal-match-v3-evidence.yml
@@
+name: Reveal-Matched Live Armillary V3 Evidence
+
+on:
+  pull_request:
+    branches: [main]
+    paths:
+      - index.html
+      - css/hero-reveal-match-v3.css
+      - js/hero-3d-reveal-match-v3.js
+      - js/forge-intro.js
+      - js/forge-frame-sequence.js
+      - assets/forge-reveal/**
+      - scripts/capture-reveal-match-v3.mjs
+      - scripts/verify-reveal-match-v3.py
+      - .github/workflows/reveal-match-v3-evidence.yml
+  workflow_dispatch:
+
+permissions:
+  contents: read
+
+jobs:
+  evidence:
+    runs-on: ubuntu-latest
+    timeout-minutes: 30
+    steps:
+      - uses: actions/checkout@v4
+        with:
+          fetch-depth: 0
+      - uses: actions/setup-node@v4
+        with:
+          node-version: '22'
+      - uses: actions/setup-python@v5
+        with:
+          python-version: '3.13'
+      - name: Validate V3 source
+        run: |
+          node --check js/hero-3d-reveal-match-v3.js
+          node --check js/forge-intro.js
+          node --check js/forge-frame-sequence.js
+          python scripts/verify-reveal-match-v3.py
+          node scripts/validate-forge-frame-sequence.mjs
+      - name: Install browser
+        run: |
+          npm install --no-save playwright@1.53.2
+          npx playwright install --with-deps chromium
+      - name: Start preview
+        run: |
+          python3 -m http.server 4173 --bind 127.0.0.1 > /tmp/tbm-preview.log 2>&1 &
+          for attempt in {1..45}; do
+            curl --fail --silent http://127.0.0.1:4173/index.html > /dev/null && exit 0
+            sleep 1
+          done
+          cat /tmp/tbm-preview.log
+          exit 1
+      - name: Capture V3
+        run: node scripts/capture-reveal-match-v3.mjs
+      - uses: actions/upload-artifact@v4
+        if: always()
+        with:
+          name: reveal-match-v3-evidence
+          path: artifacts/reveal-match-v3/**
+          if-no-files-found: error
+          retention-days: 30
```

Do not delete the V2 workflow until the V3 draft PR has passed and rollback evidence is preserved. Disable duplicate triggering by narrowing V2 paths or renaming it as historical if needed.

---

## 15. Patch 13 — diagnostics exposed by the reveal

Add a test-only/read-only API to `forge-intro.js`:

```diff
--- a/js/forge-intro.js
+++ b/js/forge-intro.js
@@
+  window.__tbmForgeIntro = {
+    getState() {
+      return {
+        progress: currentProgress,
+        release: currentRelease,
+        firstFrameReady,
+        scrubReady,
+        fatalFailure,
+        loadState: intro.dataset.loadState,
+        phase: intro.dataset.phase,
+        sequence: sequence?.getState?.() || null,
+        heroLifecycle:
+          document.documentElement.dataset.tbmHeroLifecycle || null
+      };
+    }
+  };
@@
   function releaseImmediately(reason) {
     ...
+    document.documentElement.dataset.tbmForgeReleaseReason = reason;
   }
```

Remove the diagnostic API during disposal/page teardown if the current controller adds a disposer.

---

## 16. Patch and validation order

Apply in this exact order:

1. Create branch and backup ref.
2. Create backup directory and `REVERT_TRACKING.md`.
3. Back up the source-video builder and current asset inventories.
4. Perform frame-accurate cutoff audit.
5. Patch asset builder.
6. Generate 48/64/80 candidate evidence.
7. Select and commit one production frame set and manifest.
8. Patch `forge-frame-sequence.js`.
9. Run syntax and sequence unit checks.
10. Patch `forge-intro.js`.
11. Patch `forge-intro.css`.
12. Run reveal-only browser tests with V2 hero still loaded.
13. Add V3 JS and CSS.
14. Patch `index.html` to load V3.
15. Run static V3 screenshots with motion disabled.
16. Calibrate geometry, camera, background and highlights.
17. Implement lifecycle and handoff.
18. Add active ambient motion/pointer behavior.
19. Compare direct and composer paths.
20. Patch validators and workflows.
21. Run all local validation and browser matrices.
22. Update `REVERT_TRACKING.md` statuses.
23. Open one draft PR.
24. Stop before merge.

This order prevents visual geometry problems from being hidden by motion or post-processing and prevents reveal regressions from being confused with V3 rendering cost.

---

## 17. Required validation commands

After reveal code:

```powershell
node --check js/forge-frame-sequence.js
node --check js/forge-intro.js
node scripts/validate-forge-frame-sequence.mjs
```

After V3:

```powershell
node --check js/hero-3d-reveal-match-v3.js
python scripts/verify-reveal-match-v3.py
node --check scripts/capture-reveal-match-v3.mjs
```

Full local pass:

```powershell
python -m http.server 4173 --bind 127.0.0.1
node scripts/capture-forge-intro.mjs
node scripts/capture-reveal-match-v3.mjs
```

Manual/hardware pass:

- headed Chrome at 1920×1080;
- headed Chrome at 1680×900;
- headed Chrome at 1366×768;
- mobile emulation 390×844;
- mobile emulation 430×932;
- at least one real hardware-accelerated desktop run;
- physical mobile if available.

Required behavior:

- down-scroll frame indices monotonic;
- reverse mapping deterministic;
- `requestedIndex === renderedIndex` after `scrubReady`;
- zero `fallbackUsed` after readiness;
- lifecycle follows the defined sequence;
- hero does not continuously render while suspended;
- no flash or pose jump at handoff;
- pause freezes without resetting;
- reduced-motion page remains usable and polished;
- no console/network errors.

---

## 18. Acceptance and rollback gate

Do not call implementation complete unless:

- video-derived frames are used;
- exact clean cutoff is recorded;
- one selected frame count is justified by evidence;
- dynamic blur and second RAF are absent;
- no post-ready fallback occurs;
- V3 is materially closer to the source;
- all five viewports pass;
- protected hashes remain unchanged;
- approved wording remains unchanged;
- V2 remains available for rollback;
- evidence workflows pass on the same head;
- user reviews the draft PR;
- PR remains unmerged.

Rollback is:

1. restore `index.html` to V2 CSS/JS references;
2. restore reveal JS/CSS and assets from backup;
3. remove new V3/manifest/test/workflow files;
4. run V2 validators;
5. abandon the feature branch if necessary.

---

## 19. Important distinction about “exact”

The structural patches, interfaces, event names, lifecycle states, file paths, tests and execution order above are exact.

The following values cannot honestly be declared final before visual measurement:

- exact last clean source frame near 160–162;
- final selected sample count among 48/64/80;
- final V3 ring Euler angles;
- final camera position/scale;
- final light panel positions/intensities;
- final material roughness/exposure;
- final handoff thresholds if testing reveals a better hold duration.

The plan provides exact starting values and exact tests for replacing them. Inventing final calibration numbers before rendering would contradict the evidence-first requirement.
