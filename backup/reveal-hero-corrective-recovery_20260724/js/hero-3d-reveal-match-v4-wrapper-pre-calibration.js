const root = document.documentElement;
const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');

let lifecycle = root.dataset.tbmHeroLifecycle || 'suspended';
let handoffProgress = 0;

function applyLifecycle(nextState, nextProgress = 0) {
  lifecycle = nextState || 'suspended';
  handoffProgress = Number.isFinite(nextProgress) ? nextProgress : 0;
  root.dataset.tbmHeroLifecycle = lifecycle;
  root.style.setProperty('--tbm-hero-webgl-opacity',
    lifecycle === 'active' ? '1' : lifecycle === 'handoff-ready' ? handoffProgress.toFixed(4) : '0');
}

window.addEventListener('tbm:hero-lifecycle', event => {
  applyLifecycle(event.detail?.state, event.detail?.progress);
});

applyLifecycle(lifecycle, 0);

window.__tbmHeroV4 = {
  getState() {
    const v2State = window.__tbmRevealMatchHero?.getState?.() ?? null;
    return {
      lifecycle,
      handoffProgress,
      canvasVisible: Boolean(canvas?.getBoundingClientRect().width),
      stageVisible: Boolean(stage?.getBoundingClientRect().width),
      renderer: v2State
    };
  }
};

window.addEventListener('pagehide', () => {
  delete window.__tbmHeroV4;
}, { once: true });
