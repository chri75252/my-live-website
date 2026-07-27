import { createForgeFrameSequence } from './forge-frame-sequence.js';

const intro = document.getElementById('forge-intro');
const canvas = document.getElementById('forge-intro-canvas');
const hero = document.querySelector('.hero-scroll-sequence');
const status = document.getElementById('forge-intro-status');
const handoffProxy = document.getElementById('forge-handoff-proxy');
const heroCanvas = document.getElementById('hero-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const REVEAL_MOTION_END = 0.78;
const HERO_PREWARM_START = 0.74;
const HANDOFF_START = 0.86;
const HANDOFF_COMPLETE = 0.995;

if (intro && canvas && hero) initialise();

function initialise() {
  const body = document.body;
  const protectedTargets = [
    document.querySelector('.skip-link'),
    document.getElementById('site-header'),
    document.getElementById('main-content'),
    document.querySelector('.site-footer')
  ].filter(Boolean);
  const supportsInert = 'inert' in HTMLElement.prototype;
  const fallbackTabStops = new Map();
  const fallbackAria = new Map();
  const scrollSpace = document.createElement('div');
  scrollSpace.className = 'forge-intro__scroll-space';
  scrollSpace.setAttribute('aria-hidden', 'true');
  document.getElementById('main-content')?.before(scrollSpace);
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = (from, to, value) => {
    if (to <= from) return value >= to ? 1 : 0;
    const x = clamp((value - from) / (to - from));
    return x * x * (3 - 2 * x);
  };

  let sequence = null;
  let frameRequest = 0;
  let currentProgress = -1;
  let currentRelease = 0;
  let firstFrameReady = false;
  let scrubReady = false;
  let fatalFailure = false;
  let interactionSuppressed = false;
  let range = { start: 0, end: 1 };
  let pageVisible = !document.hidden;
  let lastHeroLifecycle = '';
  let handoffGeometry = null;

  function publishHeroLifecycle(state, progress = 0) {
    document.documentElement.dataset.tbmHeroLifecycle = state;
    document.documentElement.style.setProperty('--tbm-handoff-progress', progress.toFixed(4));
    if (state === lastHeroLifecycle && state !== 'handoff-ready') return;
    lastHeroLifecycle = state;
    window.dispatchEvent(new CustomEvent('tbm:hero-lifecycle', { detail: { state, progress } }));
  }

  function updateHeroLifecycle(progress) {
    if (progress < HERO_PREWARM_START) return publishHeroLifecycle('suspended');
    if (progress < HANDOFF_START) return publishHeroLifecycle('prewarming');
    if (progress < HANDOFF_COMPLETE) return publishHeroLifecycle('handoff-ready', smooth(HANDOFF_START, HANDOFF_COMPLETE, progress));
    return publishHeroLifecycle('active', 1);
  }

  function measureHandoffGeometry() {
    const rect = heroCanvas?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) {
      handoffGeometry = null;
      return;
    }
    handoffGeometry = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function renderHandoff(progress) {
    if (!handoffProxy) return;
    measureHandoffGeometry();
    if (progress < HANDOFF_START || !handoffGeometry) {
      handoffProxy.style.setProperty('--tbm-handoff-opacity', '0');
      handoffProxy.dataset.progress = '0';
      return;
    }

    const handoff = smooth(HANDOFF_START, HANDOFF_COMPLETE, progress);
    const left = handoffGeometry.left * handoff;
    const top = handoffGeometry.top * handoff;
    const width = window.innerWidth + (handoffGeometry.width - window.innerWidth) * handoff;
    const height = window.innerHeight + (handoffGeometry.height - window.innerHeight) * handoff;
    const proxyOpacity = 1 - smooth(.84, 1, handoff);

    handoffProxy.style.setProperty('--tbm-handoff-x', left.toFixed(2) + 'px');
    handoffProxy.style.setProperty('--tbm-handoff-y', top.toFixed(2) + 'px');
    handoffProxy.style.setProperty('--tbm-handoff-width', Math.max(1, width).toFixed(2) + 'px');
    handoffProxy.style.setProperty('--tbm-handoff-height', Math.max(1, height).toFixed(2) + 'px');
    handoffProxy.style.setProperty('--tbm-handoff-opacity', proxyOpacity.toFixed(4));
    handoffProxy.dataset.progress = handoff.toFixed(4);
  }

  function suppressFallback(target) {
    if (!fallbackAria.has(target)) fallbackAria.set(target, target.getAttribute('aria-hidden'));
    target.setAttribute('aria-hidden', 'true');
    const focusable = target.matches('a,button,input,select,textarea,[tabindex]')
      ? [target]
      : [];
    focusable.push(...target.querySelectorAll('a,button,input,select,textarea,[tabindex]'));
    focusable.forEach(element => {
      if (!fallbackTabStops.has(element)) fallbackTabStops.set(element, element.getAttribute('tabindex'));
      element.setAttribute('tabindex', '-1');
    });
  }

  function restoreFallback() {
    fallbackTabStops.forEach((tabindex, element) => {
      if (!element.isConnected) return;
      if (tabindex === null) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', tabindex);
    });
    fallbackTabStops.clear();
    fallbackAria.forEach((ariaHidden, element) => {
      if (!element.isConnected) return;
      if (ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', ariaHidden);
    });
    fallbackAria.clear();
  }

  function setInteractionSuppressed(shouldSuppress) {
    if (shouldSuppress === interactionSuppressed) return;
    interactionSuppressed = shouldSuppress;

    if (shouldSuppress) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && protectedTargets.some(target => target.contains(active))) active.blur();
      protectedTargets.forEach(target => {
        if (supportsInert) target.inert = true;
        else suppressFallback(target);
      });
      body.classList.add('forge-intro-active');
      body.classList.remove('forge-intro-released');
    } else {
      protectedTargets.forEach(target => {
        if (supportsInert) target.inert = false;
      });
      if (!supportsInert) restoreFallback();
      body.classList.remove('forge-intro-active', 'forge-intro-pending');
      body.classList.add('forge-intro-released');
    }
  }

  function startSequence() {
    if (sequence || fatalFailure || reducedMotion.matches) return;
    const testFailure = Boolean(window.__FORGE_TEST_FRAME_FAILURE__);
    sequence = createForgeFrameSequence(canvas, {
      manifestUrl: testFailure ? 'assets/forge-reveal-v5/__missing__/frame-manifest.json' : 'assets/forge-reveal-v5/frame-manifest.json',
      onFirstFrame() {
        firstFrameReady = true;
        intro.dataset.loadState = 'ready';
        intro.classList.add('is-ready');
        if (status) status.textContent = '';
        currentProgress = -1;
        requestRender();
      },
      onProgress({ loaded, failed, total, variant, scrubReady: nextScrubReady }) {
        scrubReady = nextScrubReady;
        intro.dataset.loadedFrames = String(loaded);
        intro.dataset.failedFrames = String(failed);
        intro.dataset.assetVariant = variant;
        intro.dataset.totalFrames = String(total);
        intro.dataset.scrubReady = String(scrubReady);
      },
      onFatal(error) {
        console.warn('Forge frame reveal released to the homepage.', error.message);
        sequence?.dispose();
        sequence = null;
        releaseImmediately('frame-load-failure');
      }
    });
  }

  function measure() {
    const desktop = window.innerWidth >= 900;
    const travel = desktop
      ? Math.max(window.innerHeight * 1.08, 820)
      : Math.max(window.innerHeight * 0.92, 640);
    scrollSpace.style.height = `${Math.round(travel)}px`;
    range = {
      start: 0,
      end: Math.max(1, travel)
    };
    sequence?.resize();
    measureHandoffGeometry();
  }

  function releaseImmediately(reason = 'bypass') {
    fatalFailure = reason === 'frame-load-failure';
    currentProgress = 1;
    currentRelease = 1;
    intro.style.setProperty('--forge-progress', '1');
    intro.style.setProperty('--forge-sequence-progress', '1');
    intro.style.setProperty('--forge-release', '1');
    intro.style.setProperty('--forge-ready', firstFrameReady ? '1' : '0');
    intro.dataset.phase = 'released';
    intro.dataset.loadState = fatalFailure ? 'failed' : 'bypassed';
    intro.classList.add('is-complete');
    handoffProxy?.style.setProperty('--tbm-handoff-opacity', '0');
    scrollSpace.style.height = '0px';
    intro.setAttribute('aria-hidden', 'true');
    if (status) status.textContent = fatalFailure ? 'Reveal unavailable. Homepage shown.' : '';
    body.classList.remove('forge-intro-active', 'forge-intro-pending');
    body.classList.add('forge-intro-released');
    setInteractionSuppressed(false);
    publishHeroLifecycle('active', 1);
  }

  function render() {
    frameRequest = 0;
    if (!pageVisible || reducedMotion.matches || fatalFailure) return;

    const progress = clamp((window.scrollY - range.start) / (range.end - range.start));
    if (Math.abs(progress - currentProgress) < 0.0004 && firstFrameReady) return;
    currentProgress = progress;

    const sequenceProgress = clamp(progress / REVEAL_MOTION_END);
    const release = smooth(0.84, 1, progress);
    currentRelease = release;

    intro.style.setProperty('--forge-progress', progress.toFixed(4));
    intro.style.setProperty('--forge-sequence-progress', sequenceProgress.toFixed(4));
    intro.style.setProperty('--forge-release', release.toFixed(4));
    intro.style.setProperty('--forge-ready', firstFrameReady ? '1' : '0');
    intro.dataset.phase = progress < 0.1
      ? 'opening'
      : progress < REVEAL_MOTION_END
        ? 'progression'
        : progress < 0.84
          ? 'final-clean-hold'
          : 'dom-handoff';

    sequence?.drawProgress(sequenceProgress, { allowFallback: !scrubReady });
    renderHandoff(progress);
    updateHeroLifecycle(progress);

    const complete = progress >= HANDOFF_COMPLETE;
    intro.classList.toggle('is-complete', complete);
    intro.setAttribute('aria-hidden', String(complete));
    setInteractionSuppressed(!complete);
  }

  function requestRender() {
    if (!frameRequest && pageVisible) frameRequest = requestAnimationFrame(render);
  }

  function handleResize() {
    measure();
    currentProgress = -1;
    requestRender();
  }

  function handleVisibility() {
    pageVisible = !document.hidden;
    if (pageVisible) requestRender();
    else if (frameRequest) {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    }
  }

  function handleReducedMotion() {
    if (reducedMotion.matches) releaseImmediately('reduced-motion');
    else {
      fatalFailure = false;
      intro.dataset.loadState = firstFrameReady ? 'ready' : 'loading';
      intro.classList.remove('is-complete');
      setInteractionSuppressed(true);
      startSequence();
      currentProgress = -1;
      requestRender();
    }
  }

  measure();

  if (reducedMotion.matches) {
    releaseImmediately('reduced-motion');
  } else {
    publishHeroLifecycle('suspended');
    setInteractionSuppressed(true);
    intro.dataset.loadState = 'loading';
    startSequence();
    render();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);
  reducedMotion.addEventListener?.('change', handleReducedMotion);

  window.__tbmForgeIntro = {
    getState() {
      return {
        progress: currentProgress,
        release: currentRelease,
        phase: intro.dataset.phase,
        loadState: intro.dataset.loadState,
        interactionSuppressed,
        firstFrameReady,
        scrubReady,
        fatalFailure,
        heroLifecycle: document.documentElement.dataset.tbmHeroLifecycle || null,
        handoff: handoffProxy ? {
          progress: Number(handoffProxy.dataset.progress || 0),
          geometry: handoffGeometry ? { ...handoffGeometry } : null,
          opacity: handoffProxy.style.getPropertyValue('--tbm-handoff-opacity') || '0'
        } : null,
        range: { ...range },
        sequence: sequence?.getState() ?? null
      };
    },
    getRange() {
      return { ...range };
    }
  };

  window.addEventListener('pagehide', () => {
    if (frameRequest) cancelAnimationFrame(frameRequest);
    sequence?.dispose();
    handoffProxy?.style.setProperty('--tbm-handoff-opacity', '0');
    publishHeroLifecycle('offscreen');
    delete window.__tbmForgeIntro;
  }, { once: true });
}
