import { createForgeScene } from './forge-scene.js?v=20260712-3';

const BUILD = '2026-07-12-direct-hero-v3';
document.documentElement.dataset.forgeBuild = BUILD;
document.documentElement.classList.add('forge-direct');

const viewport = document.querySelector('[data-forge-viewport]');
const canvas = document.getElementById('forge-canvas');
const target = document.querySelector('[data-forge-target]');
const header = document.querySelector('[data-forge-header]');
const finalLayer = document.querySelector('[data-forge-final]');
const motionButton = document.getElementById('motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!viewport || !canvas || !target || !finalLayer) {
  document.documentElement.classList.add('forge-fallback-active');
} else {
  startDirectHero();
}

async function startDirectHero() {
  let scene;
  let ambientEnabled = true;

  try {
    ambientEnabled = localStorage.getItem('tbm-ambient-motion-v5') !== 'off';
  } catch {
    ambientEnabled = true;
  }

  finalLayer.style.pointerEvents = 'auto';
  finalLayer.style.opacity = '1';
  header?.removeAttribute('inert');
  header?.setAttribute('aria-hidden', 'false');
  if (header) header.style.pointerEvents = 'auto';

  try {
    scene = await createForgeScene({
      canvas,
      viewport,
      target,
      reducedMotion: reducedMotion.matches
    });
    scene.setProgress(1);
    scene.setAmbientEnabled(ambientEnabled);
    document.documentElement.classList.add('forge-webgl-ready');
    document.documentElement.classList.remove('forge-fallback-active');
  } catch (error) {
    console.error('Direct 3D hero failed to initialise.', error);
    document.documentElement.classList.add('forge-fallback-active');
    return;
  }

  updateMotionButton();
  installPointerInteraction();
  installMotionControl();

  window.addEventListener('resize', onResize, { passive: true });
  reducedMotion.addEventListener?.('change', () => window.location.reload());
  window.addEventListener('pagehide', destroy, { once: true });

  function installPointerInteraction() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    target.addEventListener('pointermove', event => {
      if (!ambientEnabled) return;
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
      } catch {}
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

  function onResize() { scene?.resize(); }
  function destroy() {
    window.removeEventListener('resize', onResize);
    scene?.destroy();
  }
}
