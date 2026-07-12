import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(process.env.TBM_CAPTURE_DIR || 'artifacts/reveal-match-v2');
const screenshotsDir = path.join(output, 'screenshots');
const videosDir = path.join(output, 'recordings');
const stagesDir = path.join(output, 'stage-crops');
const allViewports = [
  ['1920x1080', 1920, 1080],
  ['1680x900', 1680, 900],
  ['1366x768', 1366, 768],
  ['390x844', 390, 844],
  ['430x932', 430, 932],
];
const viewportFilter = new Set(
  (process.env.TBM_VIEWPORT_FILTER || '').split(',').map(value => value.trim()).filter(Boolean),
);
const viewports = viewportFilter.size
  ? allViewports.filter(([name]) => viewportFilter.has(name))
  : allViewports;
const skipRecordings = process.env.TBM_SKIP_RECORDINGS === '1';

await Promise.all([
  fs.mkdir(screenshotsDir, { recursive: true }),
  fs.mkdir(videosDir, { recursive: true }),
  fs.mkdir(stagesDir, { recursive: true }),
]);

const diagnostics = {
  generatedAtUtc: new Date().toISOString(),
  baseURL,
  requiredViewports: allViewports.map(([name, width, height]) => ({ name, width, height })),
  executedViewports: viewports.map(([name, width, height]) => ({ name, width, height })),
  scenarios: [],
  assertions: [],
  fatalErrors: [],
};

function recordingSize(width, height) {
  const scale = Math.min(1, 1280 / width, 720 / height);
  return {
    width: Math.max(2, Math.floor((width * scale) / 2) * 2),
    height: Math.max(2, Math.floor((height * scale) / 2) * 2),
  };
}

function attachDiagnostics(page, scenario) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || 'unknown',
    });
  });
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() });
  });
  scenario.runtime = { pageErrors, consoleErrors, failedRequests, badResponses };
}

function criticalNetworkFailures(items) {
  return items.filter(item => item.url.startsWith(baseURL) || item.url.includes('cdn.jsdelivr.net/npm/three@'));
}

function assertScenario(name, condition, detail) {
  diagnostics.assertions.push({ name, pass: Boolean(condition), detail });
}

async function launchScenario({ width, height, reducedMotion = false, recordVideo = false }) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-dev-shm-usage',
    ],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    recordVideo: recordVideo
      ? { dir: videosDir, size: recordingSize(width, height) }
      : undefined,
  });
  const page = await context.newPage();
  return { browser, context, page, video: recordVideo ? page.video() : null };
}

async function closeScenario(runtime, videoTarget = null) {
  try {
    await runtime.page.close();
    if (runtime.video && videoTarget) await runtime.video.saveAs(videoTarget);
  } finally {
    await runtime.context.close().catch(() => {});
    await runtime.browser.close().catch(() => {});
  }
}

async function waitForHero(page) {
  await page.waitForFunction(() => Boolean(window.__tbmRevealMatchHero), null, { timeout: 45000 });
  await page.waitForFunction(
    () => document.documentElement.classList.contains('webgl-ready'),
    null,
    { timeout: 45000 },
  );
}

async function waitForForgeFrames(page) {
  await page.waitForFunction(() => {
    const state = window.__tbmForgeIntro?.getState?.();
    return state?.loadState === 'ready'
      && state?.sequence?.loaded === state?.sequence?.frameCount
      && state?.sequence?.failed === 0;
  }, null, { timeout: 180000 });
}

async function verifyImportMap(page) {
  return page.evaluate(async () => {
    const mapNode = document.getElementById('tbm-three-importmap');
    const map = JSON.parse(mapNode?.textContent || '{}');
    const [three, addon] = await Promise.all([
      import('three'),
      import('three/addons/postprocessing/EffectComposer.js'),
    ]);
    return {
      mapCount: document.querySelectorAll('#tbm-three-importmap').length,
      imports: map.imports || null,
      threeRevision: three.REVISION,
      addonExport: typeof addon.EffectComposer,
    };
  });
}

async function forgeRange(page) {
  return page.evaluate(() => window.__tbmForgeIntro?.getRange?.() ?? null);
}

async function scrollForge(page, progress, settleMs = 500) {
  const range = await forgeRange(page);
  if (!range) throw new Error('Forge range is unavailable.');
  const y = range.start + (range.end - range.start) * progress;
  await page.evaluate(value => {
    window.scrollTo({ top: value, left: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, y);
  await page.waitForFunction(expected => {
    const state = window.__tbmForgeIntro?.getState?.();
    return state && Math.abs(state.progress - expected) <= 0.035;
  }, progress, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(settleMs);
  return page.evaluate(() => window.__tbmForgeIntro?.getState?.() ?? null);
}

async function hideForgeForIsolatedHero(page) {
  await page.evaluate(() => {
    const intro = document.getElementById('forge-intro');
    if (intro) {
      intro.style.display = 'none';
      intro.setAttribute('aria-hidden', 'true');
    }
    [
      document.querySelector('.skip-link'),
      document.getElementById('site-header'),
      document.getElementById('main-content'),
      document.querySelector('.site-footer'),
    ].filter(Boolean).forEach(element => {
      element.inert = false;
      element.removeAttribute('aria-hidden');
    });
    document.body.classList.remove('forge-intro-active', 'forge-intro-pending');
    document.body.classList.add('forge-intro-released');
  });
}

async function heroScrollRange(page) {
  await page.waitForFunction(() => window.ScrollTrigger?.getAll?.().length > 0, null, { timeout: 15000 }).catch(() => {});
  return page.evaluate(() => {
    const hero = document.querySelector('.hero-scroll-sequence');
    const trigger = window.ScrollTrigger?.getAll?.().find(item => item.trigger === hero);
    if (trigger && Number.isFinite(trigger.start) && Number.isFinite(trigger.end)) {
      return { start: trigger.start, end: trigger.end, source: 'ScrollTrigger' };
    }
    const top = hero.getBoundingClientRect().top + window.scrollY;
    const travel = window.innerWidth >= 900
      ? Math.max(window.innerHeight * 1.08, 820)
      : Math.max(hero.scrollHeight - window.innerHeight * 0.2, 640);
    return { start: top, end: top + travel, source: 'native-fallback' };
  });
}

async function scrollHeroFraction(page, fraction, settleMs = 900) {
  const range = await heroScrollRange(page);
  const y = range.start + (range.end - range.start) * fraction;
  await page.evaluate(value => {
    window.scrollTo({ top: value, left: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    window.ScrollTrigger?.update?.(true);
  }, y);
  if (fraction > 0.001) {
    await page.waitForFunction(expected => {
      const state = window.__tbmRevealMatchHero?.getState?.();
      return state && Math.abs(state.targetProgress - expected) <= 0.08;
    }, fraction, { timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(settleMs);
  await hideForgeForIsolatedHero(page);
  return {
    y,
    range,
    state: await page.evaluate(() => window.__tbmRevealMatchHero?.getState?.() ?? null),
  };
}

async function captureStage(page, filename) {
  await page.locator('#hero-canvas').screenshot({ path: path.join(stagesDir, filename), omitBackground: false });
}

async function captureRealHandoff(name, width, height, recordVideo = false) {
  const scenario = { name: `${name}-real-forge-handoff`, width, height, kind: 'real-forge-handoff' };
  const runtime = await launchScenario({ width, height, recordVideo });
  attachDiagnostics(runtime.page, scenario);
  try {
    await runtime.page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await runtime.page.waitForFunction(() => Boolean(window.__tbmForgeIntro), null, { timeout: 45000 });
    await waitForHero(runtime.page);
    await waitForForgeFrames(runtime.page);
    scenario.importMap = await verifyImportMap(runtime.page);

    await scrollForge(runtime.page, 0, 250);
    scenario.finalClean = await scrollForge(runtime.page, 0.83, 750);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${name}--forge-final-clean.png`) });

    scenario.midHandoff = await scrollForge(runtime.page, 0.92, 750);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${name}--handoff-mid.png`) });

    scenario.released = await scrollForge(runtime.page, 1, 1000);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${name}--live-hero-handoff.png`) });
    await captureStage(runtime.page, `${name}--live-hero-handoff-stage.png`);

    scenario.reverseMid = await scrollForge(runtime.page, 0.72, 700);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${name}--reverse-forge.png`) });
    scenario.reverseOpening = await scrollForge(runtime.page, 0.03, 500);

    assertScenario(`${name} import map singleton`, scenario.importMap.mapCount === 1, JSON.stringify(scenario.importMap));
    assertScenario(`${name} Three.js revision pinned`, scenario.importMap.threeRevision === '180', JSON.stringify(scenario.importMap));
    assertScenario(`${name} addon module resolves`, scenario.importMap.addonExport === 'function', JSON.stringify(scenario.importMap));
    assertScenario(`${name} all 32 Forge frames loaded`, scenario.finalClean?.sequence?.loaded === 32 && scenario.finalClean?.sequence?.failed === 0, JSON.stringify(scenario.finalClean));
    assertScenario(`${name} final clean hold`, scenario.finalClean?.phase === 'final-clean-hold', JSON.stringify(scenario.finalClean));
    assertScenario(`${name} real Forge release`, scenario.released?.progress >= 0.995 && scenario.released?.release >= 0.995, JSON.stringify(scenario.released));
    assertScenario(`${name} reverse Forge restoration`, scenario.reverseMid?.interactionSuppressed === true && scenario.reverseMid?.progress < scenario.released?.progress, JSON.stringify(scenario.reverseMid));
    assertScenario(`${name} no page errors`, scenario.runtime.pageErrors.length === 0, JSON.stringify(scenario.runtime.pageErrors));
    assertScenario(`${name} no console errors`, scenario.runtime.consoleErrors.length === 0, JSON.stringify(scenario.runtime.consoleErrors));
    assertScenario(`${name} no critical request failures`, criticalNetworkFailures(scenario.runtime.failedRequests).length === 0, JSON.stringify(criticalNetworkFailures(scenario.runtime.failedRequests)));
  } catch (error) {
    scenario.error = String(error?.stack || error);
    diagnostics.fatalErrors.push({ scenario: scenario.name, error: scenario.error });
    assertScenario(`${name} real handoff scenario completed`, false, scenario.error);
  } finally {
    diagnostics.scenarios.push(scenario);
    const videoTarget = recordVideo ? path.join(videosDir, `${name}--forge-forward-reverse.webm`) : null;
    await closeScenario(runtime, videoTarget);
  }
}

async function captureIsolatedHero(name, width, height, options = {}) {
  const label = options.label || 'isolated-hero';
  const scenario = { name: `${name}-${label}`, width, height, kind: 'isolated-hero', options };
  const runtime = await launchScenario({
    width,
    height,
    reducedMotion: Boolean(options.reducedMotion),
    recordVideo: Boolean(options.recordVideo),
  });
  attachDiagnostics(runtime.page, scenario);
  try {
    await runtime.page.addInitScript(config => {
      window.__TBM_HERO_TEST_FORCE_DIRECT__ = Boolean(config.forceDirect);
      window.__TBM_HERO_TEST_FORCE_COMPOSER__ = Boolean(config.forceComposer);
      localStorage.removeItem('tbm-3d-motion-v3');
    }, options);

    await runtime.page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await runtime.page.waitForFunction(() => Boolean(window.__tbmForgeIntro), null, { timeout: 45000 });
    await waitForHero(runtime.page);

    if (options.reducedMotion) {
      await runtime.page.waitForFunction(() => {
        const state = window.__tbmForgeIntro?.getState?.();
        return state?.phase === 'released' && state.loadState === 'bypassed';
      }, null, { timeout: 30000 });
    }
    await hideForgeForIsolatedHero(runtime.page);
    scenario.importMap = await verifyImportMap(runtime.page);

    scenario.initial = await scrollHeroFraction(runtime.page, 0, 850);
    const primaryNames = label === 'composer' || label === 'mobile-direct';
    const prefix = primaryNames ? name : `${name}--${label}`;
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${prefix}--hero-initial.png`) });
    if (primaryNames) await captureStage(runtime.page, `${name}--hero-initial-stage.png`);

    scenario.progress25 = await scrollHeroFraction(runtime.page, 0.25);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${prefix}--hero-progress-25.png`) });

    scenario.progress50 = await scrollHeroFraction(runtime.page, 0.5);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${prefix}--hero-progress-50.png`) });
    if (primaryNames) await captureStage(runtime.page, `${name}--hero-progress-50-stage.png`);

    scenario.progress85 = await scrollHeroFraction(runtime.page, 0.85);
    scenario.reverse25 = await scrollHeroFraction(runtime.page, 0.25);
    await runtime.page.screenshot({ path: path.join(screenshotsDir, `${prefix}--hero-reverse-25.png`) });

    const toggle = runtime.page.locator('#motion-toggle');
    if (!options.reducedMotion) {
      await toggle.click();
      await runtime.page.waitForTimeout(350);
      scenario.paused = await runtime.page.evaluate(() => window.__tbmRevealMatchHero.getState());
      await runtime.page.screenshot({ path: path.join(screenshotsDir, `${prefix}--hero-motion-paused.png`) });
      assertScenario(`${scenario.name} motion toggle pauses`, scenario.paused.motionEnabled === false, JSON.stringify(scenario.paused));
    } else {
      scenario.paused = await runtime.page.evaluate(() => window.__tbmRevealMatchHero.getState());
      assertScenario(`${scenario.name} reduced motion active`, scenario.paused.reducedMotion === true, JSON.stringify(scenario.paused));
      assertScenario(`${scenario.name} reduced motion uses direct renderer`, scenario.paused.renderPath === 'direct', JSON.stringify(scenario.paused));
      assertScenario(`${scenario.name} reduced motion toggle disabled`, await toggle.isDisabled(), 'motion toggle should be disabled');
    }

    await runtime.page.waitForTimeout(1400);
    scenario.performance = await runtime.page.evaluate(() => window.__tbmRevealMatchHero.getState());

    assertScenario(`${scenario.name} five principal ring forms`, scenario.performance.ringCount === 5, JSON.stringify(scenario.performance));
    assertScenario(`${scenario.name} core/outer ratio`, scenario.performance.geometry?.coreOuterDiameterRatio >= 0.34 && scenario.performance.geometry?.coreOuterDiameterRatio <= 0.40, JSON.stringify(scenario.performance.geometry));
    assertScenario(`${scenario.name} shell density bounded`, scenario.performance.shellJointCount > 0 && scenario.performance.shellJointCount <= 72, JSON.stringify(scenario.performance));
    assertScenario(`${scenario.name} renderer produced draw calls`, scenario.performance.renderer?.calls > 0, JSON.stringify(scenario.performance));
    assertScenario(`${scenario.name} renderer produced triangles`, scenario.performance.renderer?.triangles > 0, JSON.stringify(scenario.performance));
    if (options.forceComposer) assertScenario(`${scenario.name} composer path`, scenario.performance.renderPath === 'composer', JSON.stringify(scenario.performance));
    if (options.forceDirect || options.reducedMotion || width <= 700) assertScenario(`${scenario.name} direct path`, scenario.performance.renderPath === 'direct', JSON.stringify(scenario.performance));
    if (label === 'composer' || label === 'mobile-direct') {
      assertScenario(
        `${scenario.name} forward scroll target`,
        scenario.progress85.state.targetProgress >= 0.75,
        JSON.stringify(scenario.progress85.state),
      );
      assertScenario(
        `${scenario.name} reverse scroll target`,
        scenario.reverse25.state.targetProgress <= 0.35,
        JSON.stringify(scenario.reverse25.state),
      );
      assertScenario(
        `${scenario.name} reverse scroll`,
        scenario.reverse25.state.targetProgress < scenario.progress85.state.targetProgress - 0.25,
        JSON.stringify({ reverse: scenario.reverse25.state, forward: scenario.progress85.state }),
      );
    }
    assertScenario(`${scenario.name} no page errors`, scenario.runtime.pageErrors.length === 0, JSON.stringify(scenario.runtime.pageErrors));
    assertScenario(`${scenario.name} no console errors`, scenario.runtime.consoleErrors.length === 0, JSON.stringify(scenario.runtime.consoleErrors));
    assertScenario(`${scenario.name} no critical request failures`, criticalNetworkFailures(scenario.runtime.failedRequests).length === 0, JSON.stringify(criticalNetworkFailures(scenario.runtime.failedRequests)));
  } catch (error) {
    scenario.error = String(error?.stack || error);
    diagnostics.fatalErrors.push({ scenario: scenario.name, error: scenario.error });
    assertScenario(`${scenario.name} completed`, false, scenario.error);
  } finally {
    diagnostics.scenarios.push(scenario);
    const videoTarget = options.recordVideo
      ? path.join(videosDir, `${name}--live-hero-forward-reverse.webm`)
      : null;
    await closeScenario(runtime, videoTarget);
  }
}

for (const [name, width, height] of viewports) {
  const recordHero = !skipRecordings && (name === '1920x1080' || name === '390x844');
  const recordForge = !skipRecordings && name === '390x844';
  await captureRealHandoff(name, width, height, recordForge);
  await captureIsolatedHero(name, width, height, {
    label: width > 700 ? 'composer' : 'mobile-direct',
    forceComposer: width > 700,
    forceDirect: width <= 700,
    recordVideo: recordHero,
  });
}

if (!viewportFilter.size || viewportFilter.has('1366x768')) {
  await captureIsolatedHero('1366x768', 1366, 768, {
    label: 'forced-direct-desktop',
    forceDirect: true,
  });
  await captureIsolatedHero('1366x768', 1366, 768, {
    label: 'reduced-motion',
    reducedMotion: true,
  });
}

const failedAssertions = diagnostics.assertions.filter(assertion => !assertion.pass);
await fs.writeFile(path.join(output, 'diagnostics.json'), JSON.stringify(diagnostics, null, 2));
await fs.writeFile(path.join(output, 'performance-report.json'), JSON.stringify(
  diagnostics.scenarios.map(scenario => ({
    name: scenario.name,
    width: scenario.width,
    height: scenario.height,
    performance: scenario.performance || scenario.released || null,
    runtime: scenario.runtime || null,
    error: scenario.error || null,
  })),
  null,
  2,
));

if (failedAssertions.length || diagnostics.fatalErrors.length) {
  throw new Error(`${failedAssertions.length} assertions failed; ${diagnostics.fatalErrors.length} scenarios had fatal errors.`);
}
