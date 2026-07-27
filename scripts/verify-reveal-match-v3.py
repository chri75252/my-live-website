#!/usr/bin/env python3
"""Static contract checks for the approved V3 Forge reveal and live armillary."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    index = read("index.html")
    intro = read("js/forge-intro.js")
    sequence = read("js/forge-frame-sequence.js")
    hero = read("js/hero-3d-reveal-match-v3.js")
    manifest = json.loads(read("assets/forge-reveal/frame-manifest.json"))

    require("hero-reveal-match-v3.css" in index, "V3 hero CSS is not loaded.")
    require("hero-3d-reveal-match-v3.js" in index, "V3 hero JS is not loaded.")
    require("hero-3d-reveal-match-v2.js" not in index, "V2 and V3 hero modules are both loaded.")
    require(manifest["source"]["sha256"] == "3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95", "Reveal manifest does not point to the approved MP4.")
    require(manifest["selection"]["sampleCount"] == 64, "The selected production sequence must contain 64 frames.")
    require(manifest["selection"]["lastCleanSourceFrame"] == 159 and manifest["selection"]["firstContaminatedSourceFrame"] == 160, "The committed source cutoff is not the verified 159/160 boundary.")
    require(len(manifest["frames"]) == 64 and manifest["frames"][-1]["sourceFrame"] == 159, "The active sequence does not terminate on the final clean frame.")
    require("drawProgress(" in intro and "setProgress(" not in intro, "Intro still uses the old asynchronous sequence API.")
    require("requestAnimationFrame(draw)" not in sequence and "context.filter" not in sequence, "Reveal renderer retains the prohibited second RAF or canvas blur.")
    require("scrubReady" in sequence and "nearestLoadedBeforeReady" in sequence, "Reveal readiness/fallback boundary is incomplete.")
    for state in ("suspended", "prewarming", "handoff-ready", "active", "offscreen"):
        require(state in hero, f"V3 hero lifecycle state missing: {state}")
    for required in ("new THREE.SphereGeometry(coreRadius, 96, 96)", "new THREE.TorusGeometry(", "new THREE.InstancedMesh(", "createIrregularNetwork"):
        require(required in hero, f"V3 armillary construction missing: {required}")
    for forbidden in ("createForgeComet", "cometTrail", "pedestal", "yellowHalo"):
        require(forbidden not in hero, f"Forbidden V3 treatment found: {forbidden}")
    for relative in ("js/hero-3d-reveal-match-v3.js", "assets/forge-reveal/frame-manifest.json"):
        require(not re.search(r"<generated>|TODO|TBD|FIXME", read(relative)), f"Unresolved placeholder in {relative}.")
    print("Reveal-match V3 static verification passed.")


if __name__ == "__main__":
    main()
