/* V9-R04: exact, reversible Cycles image-sequence reveal. */
const revealStage = document.querySelector('[data-reveal-stage]');
const reveal = document.getElementById('tbm-reveal-v6');
const canvas = document.getElementById('tbm-reveal-v6-canvas');
const status = document.getElementById('tbm-reveal-v6-status');
const skip = document.getElementById('tbm-reveal-v6-skip');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const INITIAL_CONTIGUOUS_FRAMES = 12;
const DECODE_CONCURRENCY = 6;
const FINAL_DESKTOP_FRAME = 'assets/tbm-cinematic-v9/reveal-desktop/frame_0120.webp';
const FINAL_MOBILE_FRAME = 'assets/tbm-cinematic-v9/reveal-mobile/frame_0120.webp';

if (revealStage && reveal && canvas && !reducedMotion.matches) {
  initialiseReveal().catch(disableReveal);
} else {
  disableReveal();
}

async function initialiseReveal() {
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) throw new Error('2D canvas is unavailable');

  const response = await fetch('assets/tbm-cinematic-v9/frame-manifest.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Reveal manifest unavailable (${response.status})`);

  const manifest = await response.json();
  if (!Array.isArray(manifest.frames) || manifest.frames.length < INITIAL_CONTIGUOUS_FRAMES) {
    throw new Error('Reveal manifest does not contain the required contiguous frame window');
  }

  const isMobile = window.matchMedia('(max-width: 700px)').matches;
  const sources = manifest.frames.map(frame => isMobile ? frame.mobile : frame.desktop);
  const frames = new Array(sources.length);
  const pending = new Map();
  const backgroundQueue = Array.from({ length: sources.length - INITIAL_CONTIGUOUS_FRAMES }, (_, offset) => offset + INITIAL_CONTIGUOUS_FRAMES);
  let decodedCount = 0;
  let targetProgress = 0;
  let renderQueued = false;
  let renderedIndex = -1;
  let destroyed = false;

  setHeroPlate(isMobile);
  resize();

  const loadFrame = index => {
    if (frames[index]) return Promise.resolve(frames[index]);
    if (pending.has(index)) return pending.get(index);
    const request = fetch(sources[index], { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Frame ${index + 1} unavailable (${response.status})`);
        return response.blob();
      })
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        frames[index] = bitmap;
        decodedCount += 1;
        reveal.style.setProperty('--load-progress', String(decodedCount / frames.length));
        return bitmap;
      })
      .finally(() => pending.delete(index));
    pending.set(index, request);
    return request;
  };

  if (status) status.textContent = `Preparing the forge 0/${INITIAL_CONTIGUOUS_FRAMES}`;
  await Promise.all(Array.from({ length: INITIAL_CONTIGUOUS_FRAMES }, (_, index) => loadFrame(index)));
  if (!frames.slice(0, INITIAL_CONTIGUOUS_FRAMES).every(Boolean)) {
    throw new Error('Initial contiguous frame window was not decoded');
  }

  reveal.dataset.ready = 'true';
  reveal.dataset.decodeState = 'interactive';
  if (status) status.textContent = 'Scroll to forge';
  updateTarget();
  scheduleRender();
  void decodeBackground();

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  skip?.addEventListener('click', skipToEnd);
  window.addEventListener('pagehide', () => {
    destroyed = true;
    frames.forEach(frame => frame?.close?.());
  }, { once: true });

  async function decodeBackground() {
    async function worker() {
      while (!destroyed && backgroundQueue.length) {
        const index = backgroundQueue.shift();
        if (index === undefined) return;
        await loadFrame(index);
      }
    }
    await Promise.all(Array.from({ length: DECODE_CONCURRENCY }, worker));
    if (!destroyed) {
      reveal.dataset.decodeState = 'complete';
      if (status) status.textContent = 'Scroll to forge';
    }
  }

  function onResize() {
    resize();
    updateTarget();
  }

  function updateTarget() {
    const stageTop = revealStage.offsetTop;
    const available = Math.max(1, revealStage.offsetHeight - window.innerHeight);
    targetProgress = clamp((window.scrollY - stageTop) / available, 0, 1);
    reveal.dataset.progress = targetProgress.toFixed(4);
    scheduleRender();
  }

  function scheduleRender() {
    if (renderQueued || destroyed) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      draw(indexFor(targetProgress));
      updatePhase(targetProgress);
    });
  }

  function indexFor(progress) {
    return Math.round(progress * (frames.length - 1));
  }

  function draw(index) {
    const frame = frames[index];
    if (!frame) {
      // Exact-frame policy: do not substitute a neighbouring frame after the
      // reveal becomes interactive. Prioritise the requested image instead.
      reveal.dataset.awaitingFrame = String(index + 1);
      if (status) status.textContent = `Preparing frame ${index + 1}/${frames.length}`;
      void loadFrame(index).then(() => {
        if (!destroyed && indexFor(targetProgress) === index) scheduleRender();
      }).catch(disableReveal);
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const sourceRatio = frame.width / frame.height;
    const targetRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let x = 0;
    let y = 0;
    // Contain rather than cover: Blender owns camera composition, so browser
    // rendering must not crop the essential outer bands at wide viewports.
    if (sourceRatio > targetRatio) {
      drawHeight = width / sourceRatio;
      y = (height - drawHeight) / 2;
    } else {
      drawWidth = height * sourceRatio;
      x = (width - drawWidth) / 2;
    }
    context.fillStyle = '#020302';
    context.fillRect(0, 0, width, height);
    context.drawImage(frame, x, y, drawWidth, drawHeight);
    renderedIndex = index;
    reveal.style.setProperty('--forge-progress', targetProgress.toFixed(4));
    reveal.dataset.frame = String(index + 1);
    reveal.removeAttribute('data-awaiting-frame');
    window.dispatchEvent(new CustomEvent('tbm:v9-frame', {
      detail: { frame: index + 1, progress: targetProgress, decodedCount, renderedIndex },
    }));
  }

  function updatePhase(progress) {
    const phase = progress < .18 ? 'latent'
      : progress < .36 ? 'outer-forge'
        : progress < .58 ? 'orbits'
          : progress < .78 ? 'network' : 'handoff';
    reveal.dataset.phase = phase;
    if (status && !reveal.dataset.awaitingFrame && reveal.dataset.decodeState === 'interactive') {
      status.textContent = {
        latent: 'Preparing the forge',
        'outer-forge': 'Forging the outer system',
        orbits: 'Aligning the orbits',
        network: 'Structuring the network',
        handoff: 'Forged for clear decisions',
      }[phase];
    }
  }

  function resize() {
    const bounds = reveal.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
  }

  function skipToEnd() {
    const destination = revealStage.offsetTop + revealStage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: destination, behavior: 'smooth' });
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') skipToEnd();
    if (event.key === 'PageDown' || event.key === 'ArrowDown') skipToEnd();
  }
}

function setHeroPlate(isMobile) {
  document.querySelector('.hero-v9__plate img, .hero-v6__plate img')?.setAttribute(
    'src',
    isMobile ? FINAL_MOBILE_FRAME : FINAL_DESKTOP_FRAME,
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function disableReveal() {
  revealStage?.setAttribute('hidden', '');
  setHeroPlate(window.matchMedia('(max-width: 700px)').matches);
  document.body.classList.remove('tbm-v6-pending');
}
