import { createForgeScene } from './forge-scene.js?v=20260712-1';

const BUILD = '2026-07-12-forge-gate-v1';
document.documentElement.dataset.forgeBuild = BUILD;

const story = document.querySelector('[data-forge-story]');
const viewport = document.querySelector('[data-forge-viewport]');
const canvas = document.getElementById('forge-canvas');
const target = document.querySelector('[data-forge-target]');
const intro = document.querySelector('[data-forge-intro]');
const finalLayer = document.querySelector('[data-forge-final]');
const copy = document.querySelector('[data-forge-copy]');
const proof = document.querySelector('[data-forge-proof]');
const cards = [...document.querySelectorAll('[data-forge-card]')];
const header = document.querySelector('[data-forge-header]');
const skipButton = document.getElementById('forge-skip');
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
    document.documentElement.classList.contains('forge-intro-skipped') ||
    reduceMotion.matches ||
    mobileLayout.matches ||
    (window.location.hash && window.location.hash !== '#top')
  );

  if (reduceMotion.matches) document.documentElement.classList.add('forge-reduced');
  if (mobileLayout.matches) document.documentElement.classList.add('forge-mobile');
  document.documentElement.classList.add('forge-active');

  let scene;
  let currentProgress = shouldBypass ? 1 : 0;
  let ambientEnabled = true;
  let nativeCleanup = null;
  let scrollTrigger = null;

  try {
    ambientEnabled = localStorage.getItem('tbm-ambient-motion-v4') !== 'off';
  } catch {
    ambientEnabled = true;
  }

  updateMotionButton();
  renderDom(currentProgress);
  syncCanvasBounds();
  window.addEventListener('resize', onLayoutResize, { passive: true });

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
  } else {
    installScrollDriver();
  }

  installPointerInteraction();
  installMotionControl();
  installSkipControl();

  reduceMotion.addEventListener?.('change', onPreferenceChange);
  mobileLayout.addEventListener?.('change', onPreferenceChange);
  window.addEventListener('pagehide', destroy, { once: true });

  function smooth(start, end, value) {
    const normal = Math.min(1, Math.max(0, (value - start) / (end - start)));
    return normal * normal * (3 - 2 * normal);
  }

  function renderDom(progress) {
    currentProgress = Math.min(1, Math.max(0, Number(progress) || 0));

    const introOpacity = 1 - smooth(0.08, 0.40, currentProgress);
    const finalOpacity = smooth(0.58, 0.86, currentProgress);
    const copyProgress = smooth(0.66, 0.86, currentProgress);
    const proofProgress = smooth(0.78, 0.95, currentProgress);
    const headerProgress = smooth(0.69, 0.84, currentProgress);

    document.documentElement.style.setProperty('--forge-progress', currentProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-intro-opacity', introOpacity.toFixed(4));
    document.documentElement.style.setProperty('--forge-final-opacity', finalOpacity.toFixed(4));
    document.documentElement.style.setProperty('--forge-copy-opacity', copyProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-copy-y', `${((1 - copyProgress) * 28).toFixed(2)}px`);
    document.documentElement.style.setProperty('--forge-proof-opacity', proofProgress.toFixed(4));
    document.documentElement.style.setProperty('--forge-header-opacity', headerProgress.toFixed(4));

    intro.style.pointerEvents = introOpacity > 0.12 ? 'auto' : 'none';
    intro.setAttribute('aria-hidden', String(introOpacity <= 0.05));
    finalLayer.style.pointerEvents = finalOpacity > 0.94 ? 'auto' : 'none';

    if (header) {
      const headerLocked = headerProgress < 0.96;
      header.toggleAttribute('inert', headerLocked);
      header.setAttribute('aria-hidden', String(headerLocked));
      header.style.pointerEvents = headerLocked ? 'none' : 'auto';
    }

    cards.forEach((card, index) => {
      const cardProgress = smooth(0.70 + index * 0.035, 0.87 + index * 0.03, currentProgress);
      card.style.opacity = cardProgress.toFixed(4);
      card.style.transform = `translate3d(0, ${((1 - cardProgress) * 18).toFixed(2)}px, 0) scale(${(0.97 + cardProgress * 0.03).toFixed(4)})`;
      card.style.pointerEvents = cardProgress > 0.94 ? 'auto' : 'none';
    });

    scene?.setProgress(currentProgress);
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

  function syncCanvasBounds() {
    if (!shouldBypass) {
      canvas.style.removeProperty('left');
      canvas.style.removeProperty('top');
      canvas.style.removeProperty('right');
      canvas.style.removeProperty('bottom');
      canvas.style.removeProperty('width');
      canvas.style.removeProperty('height');
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

  function installScrollDriver() {
    const install = () => {
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        scrollTrigger = window.ScrollTrigger.create({
          trigger: story,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.85,
          invalidateOnRefresh: true,
          onUpdate(self) {
            renderDom(self.progress);
          },
          onRefresh(self) {
            scene?.resize();
            renderDom(self.progress);
          }
        });
        renderDom(scrollTrigger.progress);
        return;
      }
      nativeCleanup = installNativeProgressDriver();
    };

    if (document.readyState === 'complete') install();
    else window.addEventListener('load', install, { once: true });
  }

  function installNativeProgressDriver() {
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const start = story.offsetTop;
      const distance = Math.max(1, story.offsetHeight - window.innerHeight);
      renderDom((window.scrollY - start) / distance);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }

  function installPointerInteraction() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    target.addEventListener('pointermove', event => {
      if (!ambientEnabled || currentProgress < 0.62) return;
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
        localStorage.setItem('tbm-ambient-motion-v4', ambientEnabled ? 'on' : 'off');
      } catch {
        // The scene remains functional when storage is blocked.
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

  function installSkipControl() {
    skipButton?.addEventListener('click', () => {
      try {
        sessionStorage.setItem('tbm-forge-intro', 'skip');
      } catch {
        // Session persistence is optional.
      }
      const endPosition = story.offsetTop + story.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: Math.max(0, endPosition),
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });
    });
  }

  function onPreferenceChange() {
    window.location.reload();
  }

  function destroy() {
    scrollTrigger?.kill?.();
    nativeCleanup?.();
    scene?.destroy();
    reduceMotion.removeEventListener?.('change', onPreferenceChange);
    mobileLayout.removeEventListener?.('change', onPreferenceChange);
    window.removeEventListener('resize', onLayoutResize);
  }
}
