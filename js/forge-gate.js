import { createForgeScene } from './forge-scene.js?v=20260712-2';

const BUILD = '2026-07-12-forge-gate-v2';
document.documentElement.dataset.forgeBuild = BUILD;

const story = document.querySelector('[data-forge-story]');
const viewport = document.querySelector('[data-forge-viewport]');
const canvas = document.getElementById('forge-canvas');
const target = document.querySelector('[data-forge-target]');
const intro = document.querySelector('[data-forge-intro]');
const finalLayer = document.querySelector('[data-forge-final]');
const cards = [...document.querySelectorAll('[data-forge-card]')];
const header = document.querySelector('[data-forge-header]');
const skipButton = document.getElementById('forge-skip');
const replayButton = document.getElementById('forge-replay');
const motionButton = document.getElementById('motion-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 899px)');

if (!story || !viewport || !canvas || !target || !intro || !finalLayer) {
  document.documentElement.classList.add('forge-fallback-active');
} else {
  startForgeGate();
}

async function startForgeGate() {
  const shouldBypass = Boolean(
    reduceMotion.matches ||
    mobileLayout.matches ||
    (window.location.hash && window.location.hash !== '#top')
  );

  if (reduceMotion.matches) document.documentElement.classList.add('forge-reduced');
  if (mobileLayout.matches) document.documentElement.classList.add('forge-mobile');
  document.documentElement.classList.add('forge-active');

  if (!shouldBypass) {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation?.type !== 'back_forward') {
      history.scrollRestoration = 'manual';
      window.scrollTo({ top: story.offsetTop, behavior: 'auto' });
    }
  }

  let scene;
  let currentProgress = shouldBypass ? 1 : 0;
  let targetProgress = currentProgress;
  let ambientEnabled = true;
  let progressFrame = 0;
  let scrollScheduled = false;

  try {
    ambientEnabled = localStorage.getItem('tbm-ambient-motion-v5') !== 'off';
  } catch {
    ambientEnabled = true;
  }

  updateMotionButton();
  renderDom(currentProgress);
  syncCanvasBounds();

  try {
    scene = await createForgeScene({
      canvas,
      viewport,
      target,
      reducedMotion: reduceMotion.matches
    });
    scene.setAmbientEnabled(ambientEnabled);
    scene.setProgress(currentProgress);
    document.documentElement.classList.add('forge-webgl-ready');
    document.documentElement.classList.remove('forge-fallback-active');
  } catch (error) {
    console.error('Forge Gate scene failed to initialise.', error);
    document.documentElement.classList.add('forge-fallback-active');
    renderDom(1);
    releaseInteractiveContent();
    return;
  }

  if (shouldBypass) {
    scene.setProgress(1);
    renderDom(1);
    releaseInteractiveContent();
    syncCanvasBounds();
  } else {
    installNativeScrollDriver();
  }

  installPointerInteraction();
  installMotionControl();
  installIntroControls();

  window.addEventListener('resize', onLayoutResize, { passive: true });
  reduceMotion.addEventListener?.('change', onPreferenceChange);
  mobileLayout.addEventListener?.('change', onPreferenceChange);
  window.addEventListener('pagehide', destroy, { once: true });

  function smooth(start, end, value) {
    const normal = Math.min(1, Math.max(0, (value - start) / (end - start)));
    return normal * normal * (3 - 2 * normal);
  }

  function renderDom(progress) {
    currentProgress = Math.min(1, Math.max(0, Number(progress) || 0));

    const introOpacity = 1 - smooth(0.10, 0.38, currentProgress);
    const finalOpacity = smooth(0.55, 0.82, currentProgress);
    const copyProgress = smooth(0.63, 0.84, currentProgress);
    const proofProgress = smooth(0.76, 0.94, currentProgress);
    const headerProgress = smooth(0.66, 0.82, currentProgress);

    document.documentElement.style.setProperty('--forge-progress', currentProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-intro-opacity', introOpacity.toFixed(4));
    document.documentElement.style.setProperty('--forge-final-opacity', finalOpacity.toFixed(4));
    document.documentElement.style.setProperty('--forge-copy-opacity', copyProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-copy-y', `${((1 - copyProgress) * 30).toFixed(2)}px`);
    document.documentElement.style.setProperty('--forge-proof-opacity', proofProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-header-opacity', headerProgress.toFixed(4));

    intro.style.pointerEvents = introOpacity > 0.12 ? 'auto' : 'none';
    intro.setAttribute('aria-hidden', String(introOpacity <= 0.05));
    finalLayer.style.pointerEvents = finalOpacity > 0.94 ? 'auto' : 'none';

    if (header) {
      const locked = headerProgress < 0.96;
      header.toggleAttribute('inert', locked);
      header.setAttribute('aria-hidden', String(locked));
      header.style.pointerEvents = locked ? 'none' : 'auto';
    }

    cards.forEach((card, index) => {
      const cardProgress = smooth(0.68 + index * 0.035, 0.84 + index * 0.03, currentProgress);
      card.style.opacity = cardProgress.toFixed(4);
      card.style.transform = `translate3d(0, ${((1 - cardProgress) * 20).toFixed(2)}px, 0) scale(${(0.965 + cardProgress * 0.035).toFixed(4)})`;
      card.style.pointerEvents = cardProgress > 0.94 ? 'auto' : 'none';
    });

    scene?.setProgress(currentProgress);

    if (currentProgress > 0.985) releaseInteractiveContent();
  }

  function releaseInteractiveContent() {
    finalLayer.style.pointerEvents = 'auto';
    intro.style.pointerEvents = 'none';
    if (header) {
      header.removeAttribute('inert');
      header.setAttribute('aria-hidden', 'false');
      header.style.pointerEvents = 'auto';
    }
  }

  function readScrollProgress() {
    const start = story.offsetTop;
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    return Math.min(1, Math.max(0, (window.scrollY - start) / distance));
  }

  function installNativeScrollDriver() {
    targetProgress = readScrollProgress();
    currentProgress = targetProgress;
    renderDom(currentProgress);

    const schedule = () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        targetProgress = readScrollProgress();
        startProgressAnimation();
      });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    startProgressAnimation();
  }

  function startProgressAnimation() {
    if (progressFrame) return;

    const tick = () => {
      const difference = targetProgress - currentProgress;
      currentProgress += difference * 0.16;
      if (Math.abs(difference) < 0.00035) currentProgress = targetProgress;
      renderDom(currentProgress);

      if (currentProgress !== targetProgress) {
        progressFrame = requestAnimationFrame(tick);
      } else {
        progressFrame = 0;
      }
    };

    progressFrame = requestAnimationFrame(tick);
  }

  function syncCanvasBounds() {
    if (!shouldBypass) {
      canvas.style.removeProperty('left');
      canvas.style.removeProperty('top');
      canvas.style.removeProperty('right');
      canvas.style.removeProperty('bottom');
      canvas.style.removeProperty('width');
      canvas.style.removeProperty('height');
      canvas.style.removeProperty('inset');
      return;
    }

    const viewportBounds = viewport.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    canvas.style.inset = 'auto';
    canvas.style.left = `${targetBounds.left - viewportBounds.left}px`;
    canvas.style.top = `${targetBounds.top - viewportBounds.top}px`;
    canvas.style.width = `${targetBounds.width}px`;
    canvas.style.height = `${targetBounds.height}px`;
  }

  function onLayoutResize() {
    syncCanvasBounds();
    scene?.resize();
  }

  function installPointerInteraction() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    target.addEventListener('pointermove', event => {
      if (!ambientEnabled || currentProgress < 0.72) return;
      const bounds = target.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      scene?.setPointer(x, y);
    }, { passive: true });

    target.addEventListener('pointerleave', () => scene?.resetPointer());
  }

  function installMotionControl() {
    motionButton?.addEventListener('click', () => {
      ambientEnabled = !ambientEnabled;
      try {
        localStorage.setItem('tbm-ambient-motion-v5', ambientEnabled ? 'on' : 'off');
      } catch {
        // Storage is optional.
      }
      scene?.setAmbientEnabled(ambientEnabled);
      updateMotionButton();
    });
  }

  function updateMotionButton() {
    if (!motionButton) return;
    motionButton.textContent = ambientEnabled ? 'Pause ambient motion' : 'Resume ambient motion';
    motionButton.setAttribute('aria-pressed', String(ambientEnabled));
    document.documentElement.dataset.heroMotion = ambientEnabled ? 'running' : 'paused';
  }

  function installIntroControls() {
    skipButton?.addEventListener('click', () => scrollToProgress(1));
    replayButton?.addEventListener('click', () => scrollToProgress(0));
  }

  function scrollToProgress(progress) {
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    const top = story.offsetTop + distance * Math.min(1, Math.max(0, progress));
    window.scrollTo({
      top,
      behavior: reduceMotion.matches ? 'auto' : 'smooth'
    });
  }

  function onPreferenceChange() {
    window.location.reload();
  }

  function destroy() {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    scene?.destroy();
    reduceMotion.removeEventListener?.('change', onPreferenceChange);
    mobileLayout.removeEventListener?.('change', onPreferenceChange);
    window.removeEventListener('resize', onLayoutResize);
  }
}
