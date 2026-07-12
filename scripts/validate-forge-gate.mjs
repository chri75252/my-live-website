import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => readFileSync(path, 'utf8');
const index = read('index.html');
const gate = read('js/forge-gate.js');
const scene = read('js/forge-scene.js');
const css = read('css/forge-gate.css');

const checks = [
  ['Forge stylesheet is loaded', index.includes('css/forge-gate.css')],
  ['Forge runtime is loaded', index.includes('js/forge-gate.js')],
  ['Retired hero runtime is not loaded', !index.includes('js/hero-3d.js')],
  ['Retired hero stylesheet is not loaded', !index.includes('css/hero-scroll.css')],
  ['Native sticky story exists', css.includes('position: sticky')],
  ['ScrollTrigger does not pin the homepage', !/\bpin\s*:/.test(gate)],
  ['Scroll velocity is not used', !gate.includes('getVelocity') && !scene.includes('scrollBoost')],
  ['No forge comet implementation remains', !scene.includes('createForgeComet') && !scene.includes('cometConfigs')],
  ['No energy halo remains', !scene.includes('createEnergyHalo') && !scene.includes('halo.uniforms')],
  ['No pedestal ring remains', !scene.includes('const pedestal =') && !scene.includes('const baseRing =')],
  ['Six node coordinates are declared', (scene.match(/nodeCoordinates\s*=\s*\[/) && (scene.match(/^\s*\[[^\]]+\],?$/gm) || []).length >= 6)],
  ['Exactly three reflection configurations are declared', (scene.match(/speed:/g) || []).length >= 8 && scene.includes('Exactly three elongated highlights')],
  ['Mobile bypass rules exist', css.includes('@media (max-width: 899px)')],
  ['Reduced-motion bypass rules exist', css.includes('@media (prefers-reduced-motion: reduce)')],
  ['Skip intro control exists', index.includes('id="forge-skip"') && gate.includes("sessionStorage.setItem('tbm-forge-intro', 'skip')")]
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
console.log('\nForge Gate static validation completed successfully.');
