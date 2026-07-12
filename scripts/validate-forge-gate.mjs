import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => readFileSync(path, 'utf8');
const index = read('index.html');
const gate = read('js/forge-gate.js');
const scene = read('js/forge-scene.js');
const css = read('css/forge-gate.css');

const checks = [
  ['Forge stylesheet v2 is loaded', index.includes('css/forge-gate.css?v=20260712-2')],
  ['Forge runtime v2 is loaded', index.includes('js/forge-gate.js?v=20260712-2')],
  ['Retired hero runtime is not loaded', !index.includes('js/hero-3d.js')],
  ['Retired hero stylesheet is not loaded', !index.includes('css/hero-scroll.css')],
  ['Native sticky story exists', css.includes('position: sticky')],
  ['No ScrollTrigger pinning remains', !/\bpin\s*:/.test(gate) && !gate.includes('ScrollTrigger')],
  ['No scroll velocity acceleration remains', !gate.includes('getVelocity') && !scene.includes('scrollBoost')],
  ['No forge comet implementation remains', !scene.includes('createForgeComet') && !scene.includes('cometConfigs')],
  ['No energy halo remains', !scene.includes('createEnergyHalo') && !scene.includes('Fresnel')],
  ['No pedestal ring remains', !scene.includes('const pedestal =') && !scene.includes('const baseRing =')],
  ['No RoomEnvironment chrome reflections remain', !scene.includes('RoomEnvironment') && !scene.includes('scene.environment')],
  ['No sprite-based external glints remain', !scene.includes('SpriteMaterial') && !scene.includes('new THREE.Sprite')],
  ['Six node coordinates are declared', (scene.match(/nodeCoordinates\s*=\s*\[/) && (scene.match(/^\s*\[[^\]]+\],?$/gm) || []).length >= 6)],
  ['Exactly three shader reflection longitudes are used', scene.includes('uGlintLongitudes') && scene.includes('g1 + g2 + g3')],
  ['Skip control does not persist across reloads', index.includes('id="forge-skip"') && !gate.includes('sessionStorage') && !index.includes('forge-intro-skipped')],
  ['Replay intro control exists', index.includes('id="forge-replay"') && gate.includes('replayButton')],
  ['Visible intro progress indicator exists', index.includes('forge-progress-track') && css.includes('scaleX(var(--forge-progress))')],
  ['Mobile bypass rules exist', css.includes('@media (max-width: 899px)')],
  ['Reduced-motion bypass rules exist', css.includes('@media (prefers-reduced-motion: reduce)')]
];

let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`);
  if (!passed) failed = true;
}

for (const file of ['js/forge-scene.js', 'js/forge-gate.js', 'js/home-v2.js']) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  const passed = result.status === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'}  Syntax: ${file}`);
  if (!passed) {
    failed = true;
    console.error(result.stderr);
  }
}

if (failed) process.exit(1);
console.log('\nForge Gate v2 static validation completed successfully.');
