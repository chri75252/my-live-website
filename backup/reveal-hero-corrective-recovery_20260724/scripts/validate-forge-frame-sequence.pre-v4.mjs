import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = relative => readFile(path.join(root, relative), 'utf8');
const bytes = relative => readFile(path.join(root, relative));
const fail = message => { throw new Error(message); };
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');

const protectedHashes = {
  'css/hero-scroll.css': '82070a5ead77c7d7926beb486553b8a657f872ed',
  'js/hero-3d.js': '8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b',
  'js/home-v2.js': '89b4ad5aa06cf425d71789c1917106c439ebe594',
  'css/site-v2.css': '730c2a3abf3e850a155287264d7107a37a4975a7'
};
for (const [relative, expected] of Object.entries(protectedHashes)) {
  const actual = execFileSync('git', ['hash-object', '--', relative], { cwd: root, encoding: 'utf8' }).trim();
  if (actual !== expected) fail(`Protected homepage file changed: ${relative}.`);
}

const manifest = JSON.parse(await read('assets/forge-reveal/frame-manifest.json'));
if (manifest.version !== 1) fail('Reveal manifest version must be 1.');
if (manifest.source?.sha256 !== '3eb0ffa03aa261677087f781354429373240bf48cea34fae10307a618384bb95') fail('Reveal manifest MP4 hash is not approved.');
if (manifest.source?.width !== 1280 || manifest.source?.height !== 720 || manifest.source?.fps !== 24 || manifest.source?.totalFrames !== 240) fail('Reveal source metadata is invalid.');
if (manifest.selection?.sampleCount !== 64 || manifest.frames?.length !== 64) fail('Production reveal inventory must contain 64 frames.');
if (manifest.selection.lastCleanSourceFrame !== 159 || manifest.selection.firstContaminatedSourceFrame !== 160) fail('The 159/160 source cutoff is not preserved.');
if (manifest.frames.at(-1)?.sourceFrame !== 159) fail('The last production frame is not the last clean frame.');

const expectedAssets = Array.from({ length: 64 }, (_, index) => `frame_${String(index + 1).padStart(4, '0')}.webp`);
for (const variant of ['desktop', 'mobile']) {
  const directory = path.join(root, 'assets', 'forge-reveal', variant);
  const inventory = (await readdir(directory)).sort();
  if (JSON.stringify(inventory) !== JSON.stringify(expectedAssets)) fail(`${variant} inventory does not match the manifest.`);
  for (const [index, frame] of manifest.frames.entries()) {
    if (frame.productionIndex !== index || frame.sourceFrame < 0 || frame.sourceFrame > 159) fail(`Invalid manifest record ${index}.`);
    if (index && frame.sourceFrame <= manifest.frames[index - 1].sourceFrame) fail('Manifest source frames must be strictly increasing.');
    const actualHash = sha256(await bytes(frame[variant]));
    if (actualHash !== frame[`${variant}Sha256`]) fail(`Manifest hash mismatch for ${frame[variant]}.`);
  }
}

const integration = await read('index.html');
if (!integration.includes('hero-reveal-match-v3.css') || !integration.includes('hero-3d-reveal-match-v3.js')) fail('V3 integration is not loaded by index.html.');
if (integration.includes('hero-3d-reveal-match-v2.js') || integration.includes('hero-reveal-match-v2.css')) fail('V2 integration remains active in index.html.');
if (!integration.includes('data-scrub-ready="false"')) fail('Reveal scrub-readiness state is missing from index.html.');

const combined = await Promise.all([
  read('js/forge-frame-sequence.js'), read('js/forge-intro.js'), read('js/hero-3d-reveal-match-v3.js')
]).then(parts => parts.join('\n'));
for (const forbidden of ['getVelocity(', 'ScrollTrigger.getVelocity', 'sessionStorage.setItem', 'context.filter', 'requestAnimationFrame(draw)']) {
  if (combined.includes(forbidden)) fail(`Forbidden implementation term found: ${forbidden}`);
}
for (const required of ['drawProgress(', 'scrubReady', 'nearestLoadedBeforeReady', 'tbm:hero-lifecycle', 'createIrregularNetwork']) {
  if (!combined.includes(required)) fail(`Required V3 implementation term missing: ${required}`);
}

console.log('Frame-sequence validation passed: 64 MP4-derived frames, verified 159/160 cutoff, protected homepage files intact, one reveal scheduler, and V3 integration present.');
