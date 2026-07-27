const reveal = document.getElementById('tbm-reveal-v6');
const canvas = document.getElementById('tbm-reveal-v6-canvas');
const status = document.getElementById('tbm-reveal-v6-status');
const skip = document.getElementById('tbm-reveal-v6-skip');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (reveal && canvas) initialiseReveal().catch(release);

async function initialiseReveal() {
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const response = await fetch('assets/tbm-cinematic-v6/frame-manifest.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Reveal manifest unavailable (${response.status})`);
  const manifest = await response.json();
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  const sources = manifest.frames.map(frame => mobile ? frame.mobile : frame.desktop);
  const frames = new Array(sources.length);
  let progress = reducedMotion.matches ? 1 : 0;
  let previousProgress = progress;
  let loadedCount = 0;
  let released = false;
  let raf = 0;

  function load(index) {
    if (frames[index]) return frames[index];
    const image = new Image();
    image.decoding = 'async';
    image.src = sources[index];
    image.addEventListener('load', () => {
      loadedCount += 1;
      if (index === 0) reveal.dataset.ready = 'true';
      if (loadedCount === sources.length && status) status.textContent = 'Scroll to forge';
      draw();
    }, { once: true });
    frames[index] = image;
    return image;
  }

  function indexFor(value) {
    return Math.round(value * (sources.length - 1));
  }

  function resize() {
    const rect = reveal.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    draw();
  }

  function draw() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const current = indexFor(progress);
      const frame = frames[current] || frames.find(Boolean) || load(0);
      if (!frame.complete || !frame.naturalWidth) return;
      const width = canvas.width;
      const height = canvas.height;
      const sourceRatio = frame.naturalWidth / frame.naturalHeight;
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
      reveal.style.setProperty('--forge-progress', progress.toFixed(4));
      reveal.dataset.phase = progress < .3 ? 'ignition' : progress < .64 ? 'network' : progress < .9 ? 'charge' : 'handoff';
      const neighbourhood = [current - 2, current - 1, current + 1, current + 2, current + 3];
      neighbourhood.forEach(next => { if (next >= 0 && next < sources.length) load(next); });
    });
  }

  function release() {
    if (released) return;
    released = true;
    reveal.classList.add('is-released');
    document.documentElement.classList.add('tbm-v6-released');
    document.body.classList.remove('tbm-v6-pending');
    window.setTimeout(() => reveal.setAttribute('aria-hidden', 'true'), 650);
  }

  function advance(delta) {
    if (released || reducedMotion.matches) return;
    progress = Math.max(0, Math.min(1, progress + delta));
    if (status && Math.abs(progress - previousProgress) > .04) {
      status.textContent = progress < .3 ? 'Igniting the forge' : progress < .64 ? 'Structuring the network' : progress < .9 ? 'Charging the system' : 'Forged for clear decisions';
      previousProgress = progress;
    }
    draw();
    if (progress >= .995) release();
  }

  function wheel(event) {
    if (released || reducedMotion.matches) return;
    if (event.deltaY > 0 || progress > 0) {
      event.preventDefault();
      advance(event.deltaY * .00042);
    }
  }

  let touchY = 0;
  function touchStart(event) { touchY = event.touches[0]?.clientY || 0; }
  function touchMove(event) {
    if (released || !touchY) return;
    const nextY = event.touches[0]?.clientY || touchY;
    const delta = (touchY - nextY) * .005;
    if (Math.abs(delta) > .001) {
      event.preventDefault();
      advance(delta);
    }
    touchY = nextY;
  }

  load(0);
  load(1);
  load(2);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('touchstart', touchStart, { passive: true });
  window.addEventListener('touchmove', touchMove, { passive: false });
  window.addEventListener('keydown', event => {
    if (released) return;
    if (event.key === 'Escape') release();
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'Enter') {
      event.preventDefault();
      advance(.12);
    }
  });
  skip?.addEventListener('click', release);
  if (reducedMotion.matches) {
    load(sources.length - 1);
    reveal.dataset.ready = 'true';
    window.setTimeout(release, 120);
  }
  resize();
}

function release() {
  document.getElementById('tbm-reveal-v6')?.classList.add('is-released');
  document.documentElement.classList.add('tbm-v6-released');
  document.body.classList.remove('tbm-v6-pending');
}
