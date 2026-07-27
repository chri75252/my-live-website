import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/index.html';
const output = 'artifacts/reveal-match-v3';
const viewports = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 }
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate(() => {
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
      document.body.style.setProperty('scroll-behavior', 'auto', 'important');
    });
    await page.waitForFunction(() => document.querySelector('#forge-intro')?.dataset.scrubReady === 'true', undefined, { timeout: 20000 });
    const samples = [];
    for (const progress of [0, 0.5, 0.78, 0.9, 1, 0.5, 0]) {
      await page.evaluate(value => {
        const range = window.__tbmForgeIntro?.getRange?.();
        window.scrollTo(0, range ? range.start + (range.end - range.start) * value : 0);
        window.dispatchEvent(new Event('scroll'));
      }, progress);
      await page.waitForTimeout(50);
      if (progress === 1) await page.waitForTimeout(520);
      samples.push(await page.evaluate(() => ({
        progress: window.__tbmForgeIntro?.getState?.().progress ?? null,
        intro: window.__tbmForgeIntro?.getState?.() ?? null,
        hero: window.__tbmHeroV3?.getState?.() ?? null
      })));
      await page.screenshot({ path: `${output}/${viewport.name}-${String(progress).replace('.', '_')}.png`, fullPage: false });
    }
    const afterReady = samples.filter(sample => sample.intro?.sequence?.scrubReady);
    if (!afterReady.length || afterReady.some(sample => sample.intro.sequence.requestedIndex !== sample.intro.sequence.renderedIndex)) {
      throw new Error(`${viewport.name}: ready renderer did not draw requested frame indices exactly.`);
    }
    if (samples.at(0)?.hero?.lifecycle !== 'suspended' || samples[4]?.hero?.lifecycle !== 'active') {
      throw new Error(`${viewport.name}: lifecycle did not begin suspended and end active.`);
    }
    if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(' | ')}`);
    report.push({ viewport, errors, samples });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/diagnostics.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Captured V3 reveal and handoff evidence in ${output}.`);
