const stage = document.querySelector('[data-cinematic-stage]');
const visual = document.querySelector('.tbm-cinematic-v10-visual');
const canvas = document.getElementById('tbm-cinematic-v10-canvas');
const status = document.getElementById('tbm-cinematic-v10-status');
const skip = document.getElementById('tbm-cinematic-v10-skip');
const fallback = document.querySelector('.hero-v10__fallback');
const viewportMedia = matchMedia('(max-width: 700px)');
const MANIFEST_URL = 'assets/tbm-cinematic-v10/frame-manifest.json';
const INITIAL_REVEAL_WINDOW = 12;

if (stage && visual && canvas) {
  initialise().catch(showFallback);
} else if (stage) {
  showFallback();
}

async function initialise() {
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) throw new Error('2D canvas context is unavailable.');

  let manifest;
  try {
    manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Manifest request failed (${response.status}).`);
      return response.json();
    });
  } catch {
    // V10 rendering is deliberately non-destructive. Keep the approved V9
    // sequence live until the V10 manifest and all of its frames exist.
    manifest = stagedV9Manifest();
    stage.dataset.assetSource = 'v9-staged';
  }
  let revealSources = selectSources(manifest?.reveal?.frames);
  let idleSources = selectSources(manifest?.idle?.frames);
  if (manifest?.status === 'staged-v9-until-v10-render-completes') {
    manifest = stagedV9Manifest();
    revealSources = selectSources(manifest.reveal.frames);
    idleSources = selectSources(manifest.idle.frames);
    stage.dataset.assetSource = 'v9-staged';
  }
  if (!revealSources.length) throw new Error('No reveal frame sources were supplied.');

  const state = {
    mode: 'loading-reveal',
    ready: false,
    visible: true,
    revealProgress: 0,
    revealIndex: 0,
    idleIndex: 0,
    idleStartedAt: 0,
    idleReady: false,
    renderQueued: false,
    idleRaf: 0,
    drawing: false,
  };
  const revealFrames = new Array(revealSources.length);
  const idleFrames = new Array(idleSources.length);
  const idleDurationMs = Number(manifest?.idle?.durationMs) || 4000;

  const draw = image => {
    if (!image?.complete || !image.naturalWidth) return false;
    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.fillStyle = '#020302';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    return true;
  };

  const getRevealFrame = () => revealFrames[state.revealIndex] || findNearest(revealFrames, state.revealIndex);
  const getIdleFrame = () => idleFrames[state.idleIndex] || findNearest(idleFrames, state.idleIndex);

  const render = now => {
    state.renderQueued = false;
    if (!state.ready) return;
    if (state.mode === 'idle-playing' && state.idleReady && state.visible && !document.hidden) {
      const elapsed = (now - state.idleStartedAt) % idleDurationMs;
      state.idleIndex = Math.min(idleFrames.length - 1, Math.floor(elapsed / idleDurationMs * idleFrames.length));
      draw(getIdleFrame());
      stage.dataset.idleFrame = String(state.idleIndex + 1);
      state.idleRaf = requestAnimationFrame(render);
      return;
    }
    cancelAnimationFrame(state.idleRaf);
    draw(getRevealFrame());
  };

  const scheduleRender = () => {
    if (!state.renderQueued) {
      state.renderQueued = true;
      requestAnimationFrame(render);
    }
  };

  const setStatus = value => {
    if (status) status.textContent = value;
  };

  const updateScrollState = () => {
    const travel = Math.max(1, stage.offsetHeight - innerHeight);
    const rawProgress = (scrollY - stage.offsetTop) / travel;
    state.revealProgress = clamp(rawProgress, 0, 1);
    state.revealIndex = Math.round(state.revealProgress * (revealFrames.length - 1));
    const handoff = clamp((state.revealProgress - .88) / .12, 0, 1);
    stage.style.setProperty('--handoff-progress', handoff.toFixed(4));
    stage.dataset.progress = state.revealProgress.toFixed(4);
    stage.dataset.frame = String(state.revealIndex + 1);

    if (state.revealProgress < 1) {
      state.mode = 'reveal-interactive';
      state.idleStartedAt = 0;
      setStatus(state.revealProgress < .12 ? 'Scroll to forge' : 'Forging the system');
    } else if (state.idleReady) {
      if (!state.idleStartedAt) state.idleStartedAt = performance.now();
      state.mode = 'idle-playing';
      setStatus('Forged for clear decisions');
    } else {
      state.mode = 'reveal-complete';
      setStatus('Preparing ambient motion');
    }
    stage.dataset.mode = state.mode;
    scheduleRender();
  };

  const resize = () => {
    const bounds = visual.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    scheduleRender();
  };

  const initial = await loadFirstWindow(revealSources, revealFrames, INITIAL_REVEAL_WINDOW);
  if (!initial) throw new Error('The first reveal frame window could not be decoded.');
  state.ready = true;
  stage.dataset.ready = 'true';
  document.body.classList.add('tbm-cinematic-v10-ready');
  fallback?.setAttribute('aria-hidden', 'true');
  resize();
  updateScrollState();
  preloadRemaining(revealSources, revealFrames, INITIAL_REVEAL_WINDOW, () => {
    if (state.revealProgress >= .7) startIdleLoad();
  });

  function startIdleLoad() {
    if (state.idleLoading || state.idleReady || !idleSources.length) return;
    state.idleLoading = true;
    preloadRemaining(idleSources, idleFrames, 0, () => {
      state.idleReady = idleFrames.filter(Boolean).length === idleFrames.length;
      if (state.idleReady && state.revealProgress >= 1) {
        state.idleStartedAt = performance.now();
        state.mode = 'idle-playing';
        stage.dataset.mode = state.mode;
        scheduleRender();
      }
    });
  }

  addEventListener('scroll', () => {
    updateScrollState();
    if (state.revealProgress >= .7) startIdleLoad();
  }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  addEventListener('orientationchange', resize, { passive: true });
  viewportMedia.addEventListener('change', () => {
    // The desktop and mobile renders are separately authored, not crops. A
    // one-time reload on the breakpoint boundary chooses the correct source
    // set and prevents a stretched desktop frame after orientation changes.
    location.reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.mode === 'idle-playing') state.idleStartedAt = performance.now();
    scheduleRender();
  });
  new IntersectionObserver(entries => {
    state.visible = entries.some(entry => entry.isIntersecting);
    if (state.visible) scheduleRender();
  }, { threshold: .01 }).observe(stage);
  skip?.addEventListener('click', () => {
    const target = stage.offsetTop + stage.offsetHeight - innerHeight;
    scrollTo({ top: target, behavior: 'smooth' });
  });

  window.__tbmCinematicV10 = {
    getState: () => ({ ...state, revealFrames: revealFrames.filter(Boolean).length, idleFrames: idleFrames.filter(Boolean).length }),
    getRange: () => ({ start: stage.offsetTop, end: stage.offsetTop + stage.offsetHeight - innerHeight }),
  };
}

function selectSources(frames) {
  if (!Array.isArray(frames)) return [];
  const mobile = viewportMedia.matches;
  return frames.map(frame => mobile ? frame.mobile : frame.desktop).filter(Boolean);
}

async function loadFirstWindow(sources, target, count) {
  const initial = await Promise.all(sources.slice(0, count).map((source, index) => loadImage(source).then(image => {
    target[index] = image;
    return image;
  }).catch(() => null)));
  return initial.every(Boolean);
}

function preloadRemaining(sources, target, from, done) {
  const remaining = sources.slice(from);
  if (!remaining.length) {
    done?.();
    return;
  }
  let completed = 0;
  remaining.forEach((source, offset) => {
    loadImage(source).then(image => {
      target[from + offset] = image;
    }).catch(() => {}).finally(() => {
      completed += 1;
      if (completed === remaining.length) done?.();
    });
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        resolve(image);
      } catch {
        resolve(image);
      }
    };
    image.onerror = reject;
    image.src = source;
  });
}

function findNearest(items, index) {
  for (let offset = 0; offset < items.length; offset += 1) {
    if (items[index - offset]) return items[index - offset];
    if (items[index + offset]) return items[index + offset];
  }
  return null;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function showFallback() {
  stage?.setAttribute('data-fallback', 'true');
  document.body.classList.remove('tbm-cinematic-v10-ready');
}

function stagedV9Manifest() {
  const path = index => `assets/tbm-cinematic-v9/reveal-${viewportMedia.matches ? 'mobile' : 'desktop'}/frame_${String(index).padStart(4, '0')}.webp`;
  const reveal = Array.from({ length: 120 }, (_, index) => {
    const source = path(index + 1);
    return { desktop: source, mobile: source };
  });
  // The first idle frame must be the exact final reveal pose. The staged V9
  // loop then breathes a few frames backwards/forwards without a handoff pop.
  const idleIndices = [120, 119, 117, 114, 111, 109, 111, 114, 117, 119, 120];
  const idle = idleIndices.map(index => {
    const source = path(index);
    return { desktop: source, mobile: source };
  });
  return { reveal: { frames: reveal }, idle: { durationMs: 4000, frames: idle } };
}
