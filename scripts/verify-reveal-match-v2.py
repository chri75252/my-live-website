from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
index_path = repo / 'index.html'
if not index_path.exists():
    raise SystemExit(f'Missing {index_path}')

index = index_path.read_text(encoding='utf-8')
js_path = repo / 'js' / 'hero-3d-reveal-match-v2.js'
css_path = repo / 'css' / 'hero-reveal-match-v2.css'
js = js_path.read_text(encoding='utf-8') if js_path.exists() else ''
checks = {
    'new JS exists': js_path.exists(),
    'new CSS exists': css_path.exists(),
    'index loads V2 JS once': index.count('src="js/hero-3d-reveal-match-v2.js"') == 1,
    'index does not load original JS': 'src="js/hero-3d.js"' not in index,
    'index loads V2 CSS once': index.count('href="css/hero-reveal-match-v2.css"') == 1,
    'import map exists once': index.count('id="tbm-three-importmap"') == 1,
    'three core mapping pinned': '"three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"' in index,
    'three addons mapping pinned': '"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"' in index,
    'all addon imports use mapped prefix': not re.search(r"from ['\"]https?://.*examples/jsm", js),
    'original JS preserved': (repo / 'js' / 'hero-3d.js').exists(),
    'original CSS preserved': (repo / 'css' / 'hero-scroll.css').exists(),
    'Forge intro preserved': (repo / 'js' / 'forge-intro.js').exists(),
    'Forge frame renderer preserved': (repo / 'js' / 'forge-frame-sequence.js').exists(),
    'Forge CSS preserved': (repo / 'css' / 'forge-intro.css').exists(),
    'five ring definitions': js.count("kind: 'torus'") + js.count("kind: 'irregular'") == 5,
    'no pedestal geometry': 'pedestal' not in js.lower(),
    'composer path present': 'new EffectComposer(renderer)' in js,
    'direct path present': 'else renderer.render(scene, camera)' in js,
    'reduced motion integrated': "prefers-reduced-motion: reduce" in js,
    'motion toggle integrated': "motionToggle?.addEventListener('click'" in js,
    'performance diagnostics exposed': 'frameTiming' in js and 'renderer.info.render.triangles' in js,
}

for name, ok in checks.items():
    print(f"{'PASS' if ok else 'FAIL'}: {name}")

protected = [
    'js/hero-3d.js', 'css/hero-scroll.css', 'js/home-v2.js', 'css/site-v2.css',
    'js/forge-intro.js', 'js/forge-frame-sequence.js', 'css/forge-intro.css',
]
print('Protected file SHA-256 values:')
for rel in protected:
    p = repo / rel
    if p.exists():
        print(f"  {hashlib.sha256(p.read_bytes()).hexdigest()}  {rel}")

if not all(checks.values()):
    raise SystemExit(1)

summary = {
    'status': 'pass',
    'checks': checks,
    'protected_sha256': {
        rel: hashlib.sha256((repo / rel).read_bytes()).hexdigest()
        for rel in protected if (repo / rel).exists()
    },
}
out = repo / 'artifacts' / 'reveal-match-v2'
out.mkdir(parents=True, exist_ok=True)
(out / 'static-verification.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
