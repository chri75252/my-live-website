import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => readFileSync(path, 'utf8');
const index = read('index.html');
const gate = read('js/forge-gate.js');
const scene = read('js/forge-scene.js');
const css = read('css/forge-gate.css');

const checks = [
  ['Direct hero stylesheet v3 is loaded', index.includes('css/forge-gate.css?v=20260712-3')],
  ['Direct hero runtime v3 is loaded', index.includes('js/forge-gate.js?v=20260712-3')],
  ['Intro markup is parked', !index.includes('data-forge-intro') && !index.includes('forge-replay')],
  ['No GSAP reveal runtime is loaded', !index.includes('gsap.min.js') && !index.includes('ScrollTrigger')],
  ['Normal-flow hero is used', css.includes('.forge-story { position: relative; height: auto;') && css.includes('.forge-story__sticky { position: relative;')],
  ['No scroll driver remains', !gate.includes('scrollToProgress') && !gate.includes('readScrollProgress') && !gate.includes('ScrollTrigger')],
  ['No comet implementation remains', !scene.includes('createForgeComet') && !scene.includes('cometConfigs')],
  ['No energy halo or pedestal remains', !scene.includes('createEnergyHalo') && !scene.includes('baseRing')],
  ['No RoomEnvironment chrome reflections remain', !scene.includes('RoomEnvironment') && !scene.includes('scene.environment')],
  ['Six restrained node coordinates exist', (scene.match(/^\s*\[[^\]]+\],?$/gm) || []).length >= 6],
  ['Exactly three surface glint configurations exist', (scene.match(/xRadius:/g) || []).length === 3],
  ['Pointer interaction remains', gate.includes("target.addEventListener('pointermove'")],
  ['Pause/resume remains', gate.includes('tbm-ambient-motion-v5')]
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
console.log('\nDirect premium hero v3 validation completed successfully.');
