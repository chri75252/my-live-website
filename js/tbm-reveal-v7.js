/* V7-R05: reversible scroll-scrub reveal with decoded, deterministic frames. */
const revealStage = document.querySelector('[data-reveal-stage]');
const reveal = document.getElementById('tbm-reveal-v6');
const canvas = document.getElementById('tbm-reveal-v6-canvas');
const status = document.getElementById('tbm-reveal-v6-status');
const skip = document.getElementById('tbm-reveal-v6-skip');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (revealStage && reveal && canvas && !reducedMotion.matches) {
  initialiseReveal().catch(disableReveal);
} else {
  disableReveal();
}

async function initialiseReveal() {
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const response = await fetch('assets/tbm-cinematic-v7/frame-manifest.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Reveal manifest unavailable (${response.status})`);

  const manifest = await response.json();
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  const sources = manifest.frames.map(frame => mobile ? frame.mobile : frame.desktop);
  const frames = new Array(sources.length);
  let targetProgress = 0;
  let displayProgress = 0;
  let previousTime = performance.now();
  let frameRequest = 0;
  let destroyed = false;

  document.querySelector('.hero-v6__plate img')?.setAttribute(
    'src',
    'assets/tbm-cinematic-v7/keyframes/phase-handoff.png',
  );

  await decodeWithConcurrency(sources, frames, 6, count => {
    if (status) status.textContent = `Preparing the forge ${count}/${sources.length}`;
    reveal.style.setProperty('--load-progress', String(count / sources.length));
  });

  reveal.dataset.ready = 'true';
  if (status) status.textContent = 'Scroll to forge';
  resize();
  updateTarget();
  frameRequest = requestAnimationFrame(renderLoop);

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  skip?.addEventListener('click', skipToEnd);
  window.addEventListener('pagehide', () => {
    destroyed = true;
    cancelAnimationFrame(frameRequest);
    frames.forEach(frame => frame?.close?.());
  }, { once: true });

  function onResize() {
    resize();
    updateTarget();
  }

  function updateTarget() {
    const stageTop = revealStage.offsetTop;
    const available = Math.max(1, revealStage.offsetHeight - window.innerHeight);
    targetProgress = clamp((window.scrollY - stageTop) / available, 0, 1);
    reveal.dataset.progress = targetProgress.toFixed(4);
  }

  function renderLoop(time) {
    if (destroyed) return;
    const elapsed = Math.min(64, time - previousTime);
    previousTime = time;
    const alpha = 1 - Math.exp(-elapsed / 70);
    displayProgress += (targetProgress - displayProgress) * alpha;
    if (Math.abs(targetProgress - displayProgress) < .0002) displayProgress = targetProgress;
    draw(indexFor(displayProgress));
    updatePhase(displayProgress);
    frameRequest = requestAnimationFrame(renderLoop);
  }

  function indexFor(progress) {
    return Math.round(progress * (frames.length - 1));
  }

  function draw(index) {
    const frame = frames[index] || frames[closestDecodedIndex(frames, index)];
    if (!frame) return;
    const width = canvas.width;
    const height = canvas.height;
    const sourceRatio = frame.width / frame.height;
    const targetRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let x = 0;
    let y = 0;
    if (sourceRatio > targetRatio) {
      drawWidth = height * sourceRatio;
      x = (width - drawWidth) / 2;
    } else {
      drawHeight = width / sourceRatio;
      y = (height - drawHeight) / 2;
    }
    context.fillStyle = '#020302';
    context.fillRect(0, 0, width, height);
    context.drawImage(frame, x, y, drawWidth, drawHeight);
    reveal.style.setProperty('--forge-progress', displayProgress.toFixed(4));
    reveal.dataset.frame = String(index + 1);
  }

  function updatePhase(progress) {
    const phase = progress < .16 ? 'latent'
      : progress < .40 ? 'outer-forge'
        : progress < .64 ? 'orbits'
          : progress < .84 ? 'network' : 'handoff';
    reveal.dataset.phase = phase;
    if (!status) return;
    status.textContent = {
      latent: 'Preparing the forge',
      'outer-forge': 'Forging the outer system',
      orbits: 'Aligning the orbits',
      network: 'Structuring the network',
      handoff: 'Forged for clear decisions',
    }[phase];
  }

  function resize() {
    const bounds = reveal.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
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

async function decodeWithConcurrency(sources, target, concurrency, onProgress) {
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < sources.length) {
      const index = cursor;
      cursor += 1;
      const response = await fetch(sources[index], { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Frame ${index + 1} unavailable (${response.status})`);
      const blob = await response.blob();
      target[index] = await createImageBitmap(blob);
      completed += 1;
      onProgress(completed);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker));
}

function closestDecodedIndex(frames, requested) {
  for (let distance = 0; distance < frames.length; distance += 1) {
    const before = requested - distance;
    const after = requested + distance;
    if (before >= 0 && frames[before]) return before;
    if (after < frames.length && frames[after]) return after;
  }
  return 0;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function disableReveal() {
  revealStage?.setAttribute('hidden', '');
  document.querySelector('.hero-v6__plate img')?.setAttribute(
    'src',
    'assets/tbm-cinematic-v7/keyframes/phase-handoff.png',
  );
  document.body.classList.remove('tbm-v6-pending');
}
