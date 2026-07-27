import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nodeModuleCandidates = [
  process.env.TBM_NODE_MODULES,
  process.env.USERPROFILE && path.join(
    process.env.USERPROFILE,
    '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules'
  ),
  process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules')
].filter(Boolean);
const globalNodeModules = nodeModuleCandidates.find(candidate =>
  existsSync(path.join(candidate, 'playwright', 'package.json'))
) || (process.platform === 'win32'
  ? ''
  : execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim());
if (!globalNodeModules) {
  throw new Error('Playwright was not found. Set TBM_NODE_MODULES to a node_modules directory containing Playwright.');
}
const { chromium } = require(path.join(globalNodeModules, 'playwright'));

const baseUrl = process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/index.html';
const chromePath = process.env.TBM_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const output = 'artifacts/final-forge-v4/automated-capture';
const viewports = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1680x900', width: 1680, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 }
];
const phases = [
  { name: 'opening', progress: 0 },
  { name: 'mid-reveal', progress: 0.5 },
  { name: 'final-hold', progress: 0.78 },
  { name: 'spatial-midpoint', progress: 0.93 },
  { name: 'swap', progress: 0.992 },
  { name: 'settled', progress: 1 },
  { name: 'reverse', progress: 0.5 },
  { name: 'rewound', progress: 0 }
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const report = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', error => errors.push(error.message));
    const captureUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}capture=v4-${viewport.name}`;
    await page.goto(captureUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.evaluate(() => {
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
      document.body.style.setProperty('scroll-behavior', 'auto', 'important');
    });
    await page.waitForFunction(() => document.querySelector('#forge-intro')?.dataset.scrubReady === 'true', undefined, { timeout: 20000 });
    const samples = [];
    for (const phase of phases) {
      await page.evaluate(value => {
        const range = window.__tbmForgeIntro?.getRange?.();
        window.scrollTo(0, range ? range.start + (range.end - range.start) * value : 0);
        window.dispatchEvent(new Event('scroll'));
      }, phase.progress);
      await page.waitForTimeout(50);
      if (phase.name === 'settled') await page.waitForTimeout(520);
      samples.push(await page.evaluate(() => ({
        intro: window.__tbmForgeIntro?.getState?.() ?? null,
        hero: window.__tbmHeroV4?.getState?.() ?? null,
        pinSpacerCount: document.querySelectorAll('.pin-spacer').length,
        mainTop: document.querySelector('main')?.getBoundingClientRect().top ?? null
      })));
      samples.at(-1).phase = phase.name;
      await page.screenshot({ path: `${output}/${viewport.name}-${phase.name}.png`, fullPage: false });
    }
    const afterReady = samples.filter(sample => sample.intro?.sequence?.scrubReady);
    if (!afterReady.length || afterReady.some(sample => sample.intro.sequence.requestedIndex !== sample.intro.sequence.renderedIndex)) {
      throw new Error(`${viewport.name}: ready renderer did not draw requested frame indices exactly.`);
    }
    if (samples.at(0)?.hero?.heroLifecycle !== 'suspended' || samples[5]?.hero?.heroLifecycle !== 'active') {
      throw new Error(`${viewport.name}: lifecycle did not begin suspended and end active.`);
    }
    if (samples.some(sample => sample.pinSpacerCount !== 0)) {
      throw new Error(`${viewport.name}: an independent hero pin spacer was created.`);
    }
    if (samples[5]?.hero?.targetProgress !== 0) {
      throw new Error(`${viewport.name}: hero scroll progressed behind the reveal.`);
    }
    if (samples[6]?.intro?.handoff?.progress !== 0 || samples[6]?.hero?.heroLifecycle !== 'suspended') {
      throw new Error(`${viewport.name}: reverse scroll did not reset the handoff and hero lifecycle.`);
    }
    if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(' | ')}`);
    report.push({ viewport, errors, samples });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/diagnostics.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Captured V4 reveal and handoff evidence in ${output}.`);
