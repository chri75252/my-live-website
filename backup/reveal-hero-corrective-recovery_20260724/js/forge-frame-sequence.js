const clamp = value => Math.min(1, Math.max(0, value));

const DEFAULTS = Object.freeze({
  manifestUrl: 'assets/forge-reveal/frame-manifest.json',
  firstFrameTimeoutMs: 5500,
  initialBatchSize: 8,
  backgroundConcurrency: 4,
  mobileBreakpoint: 700
});

export function createForgeFrameSequence(canvas, suppliedOptions = {}) {
  if (!canvas) return null;

  const options = { ...DEFAULTS, ...suppliedOptions };
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) {
    options.onFatal?.(new Error('A 2D canvas context is unavailable.'));
    return null;
  }

  const mobileQuery = window.matchMedia(`(max-width: ${options.mobileBreakpoint}px)`);
  let manifest = null;
  let frames = [];
  let frameFailures = new Uint8Array();
  let loadedFlags = new Uint8Array();
  let frameCount = 0;
  let variant = chooseVariant();
  let loadGeneration = 0;
  let disposed = false;
  let visible = !document.hidden;
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let firstFrameReady = false;
  let readyCount = 0;
  let loadErrors = 0;
  let contiguousDecodedThrough = -1;
  let scrubReady = false;
  let requestedProgress = 0;
  let requestedIndex = 0;
  let renderedIndex = -1;
  let fallbackUsed = false;

  function chooseVariant() {
    const shortSide = Math.min(window.innerWidth || 1, window.innerHeight || 1);
    return mobileQuery.matches || shortSide <= options.mobileBreakpoint ? 'mobile' : 'desktop';
  }

  function clearFrameState() {
    frames = new Array(frameCount).fill(null);
    frameFailures = new Uint8Array(frameCount);
    loadedFlags = new Uint8Array(frameCount);
    readyCount = 0;
    loadErrors = 0;
    firstFrameReady = false;
    contiguousDecodedThrough = -1;
    scrubReady = false;
    renderedIndex = -1;
    fallbackUsed = false;
  }

  async function loadManifest() {
    const response = await fetch(options.manifestUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Reveal manifest failed: ${response.status}.`);
    const parsed = await response.json();
    const count = parsed?.selection?.sampleCount;
    if (!Number.isInteger(count) || count < 2 || parsed.frames?.length !== count) {
      throw new Error('Reveal manifest frame inventory is invalid.');
    }
    if (!['desktop', 'mobile'].every(name => parsed.frames.every(frame => typeof frame[name] === 'string'))) {
      throw new Error('Reveal manifest does not define both responsive variants.');
    }
    manifest = parsed;
    frameCount = count;
    clearFrameState();
  }

  function frameUrl(index) {
    return manifest.frames[index][variant];
  }

  function notifyProgress() {
    options.onProgress?.({
      loaded: readyCount,
      failed: loadErrors,
      total: frameCount,
      variant,
      contiguousDecodedThrough,
      scrubReady
    });
  }

  function updateContiguousReadiness() {
    while (contiguousDecodedThrough + 1 < frameCount && loadedFlags[contiguousDecodedThrough + 1]) {
      contiguousDecodedThrough += 1;
    }
    scrubReady = contiguousDecodedThrough === frameCount - 1;
  }

  function loadFrame(index, generation) {
    if (disposed || generation !== loadGeneration || loadedFlags[index] || frameFailures[index]) {
      return Promise.resolve(Boolean(loadedFlags[index]));
    }
    return new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        if (disposed || generation !== loadGeneration) return resolve(false);
        try { await image.decode?.(); } catch { /* Successful load remains usable. */ }
        frames[index] = image;
        loadedFlags[index] = 1;
        readyCount += 1;
        updateContiguousReadiness();
        if (index === 0 && !firstFrameReady) {
          firstFrameReady = true;
          options.onFirstFrame?.();
        }
        notifyProgress();
        resolve(true);
      };
      image.onerror = () => {
        if (!disposed && generation === loadGeneration) {
          frameFailures[index] = 1;
          loadErrors += 1;
          notifyProgress();
        }
        resolve(false);
      };
      image.src = frameUrl(index);
    });
  }

  async function loadRemaining(generation, startIndex) {
    let cursor = startIndex;
    async function worker() {
      while (!disposed && generation === loadGeneration) {
        const index = cursor++;
        if (index >= frameCount) return;
        await loadFrame(index, generation);
      }
    }
    await Promise.allSettled(Array.from(
      { length: Math.max(1, Math.min(options.backgroundConcurrency, frameCount - startIndex)) },
      worker
    ));
    if (!disposed && generation === loadGeneration) {
      options.onComplete?.({ loaded: readyCount, failed: loadErrors, total: frameCount, variant, scrubReady });
    }
  }

  async function startLoading() {
    const generation = ++loadGeneration;
    clearFrameState();
    options.onVariant?.(variant);
    const timeout = window.setTimeout(() => {
      if (!disposed && generation === loadGeneration && !firstFrameReady) {
        options.onFatal?.(new Error(`The first ${variant} reveal frame did not load in time.`));
      }
    }, options.firstFrameTimeoutMs);
    const immediateCount = Math.min(options.initialBatchSize, frameCount);
    const firstBatch = await Promise.allSettled(Array.from({ length: immediateCount }, (_, index) => loadFrame(index, generation)));
    window.clearTimeout(timeout);
    if (disposed || generation !== loadGeneration) return;
    if (!firstFrameReady) {
      options.onFatal?.(new Error(`The first ${variant} reveal frame failed to load.`));
      return;
    }
    options.onInitialBatch?.({
      loaded: firstBatch.filter(result => result.status === 'fulfilled' && result.value).length,
      requested: immediateCount,
      variant
    });
    void loadRemaining(generation, immediateCount);
  }

  function ensureCanvasSize() {
    const nextWidth = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth || 1));
    const nextHeight = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight || 1));
    const maxPixelWidth = variant === 'mobile' ? 1170 : 1920;
    const maxPixelHeight = variant === 'mobile' ? 1800 : 1080;
    const nextRatio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 1.5, maxPixelWidth / nextWidth, maxPixelHeight / nextHeight));
    if (nextWidth === cssWidth && nextHeight === cssHeight && Math.abs(nextRatio - pixelRatio) < 0.01) return false;
    cssWidth = nextWidth;
    cssHeight = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    return true;
  }

  function drawContainedFrame(image) {
    const containScale = Math.min(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight);
    const scale = variant === 'mobile' ? containScale * 1.25 : containScale;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (cssWidth - width) / 2;
    const y = (variant === 'mobile' ? cssHeight * 0.48 : cssHeight * 0.5) - height / 2;
    context.drawImage(image, x, y, width, height);
  }

  function nearestLoadedBeforeReady(index) {
    if (loadedFlags[index]) return index;
    for (let distance = 1; distance < frameCount; distance += 1) {
      const previous = index - distance;
      const next = index + distance;
      if (previous >= 0 && loadedFlags[previous]) return previous;
      if (next < frameCount && loadedFlags[next]) return next;
    }
    return -1;
  }

  function drawProgress(value, { allowFallback = false } = {}) {
    requestedProgress = clamp(value);
    if (disposed || !visible || !firstFrameReady || !frameCount) return { drawn: false, scrubReady };
    ensureCanvasSize();
    requestedIndex = Math.min(frameCount - 1, Math.round(requestedProgress * (frameCount - 1)));
    let resolvedIndex = loadedFlags[requestedIndex] ? requestedIndex : -1;
    fallbackUsed = false;
    if (resolvedIndex < 0 && allowFallback && !scrubReady) {
      resolvedIndex = nearestLoadedBeforeReady(requestedIndex);
      fallbackUsed = resolvedIndex !== requestedIndex;
    }
    if (resolvedIndex < 0 || resolvedIndex === renderedIndex) {
      return { drawn: false, requestedIndex, renderedIndex, fallbackUsed, scrubReady };
    }
    const started = performance.now();
    context.fillStyle = '#071011';
    context.fillRect(0, 0, cssWidth, cssHeight);
    drawContainedFrame(frames[resolvedIndex]);
    renderedIndex = resolvedIndex;
    return { drawn: true, requestedIndex, renderedIndex, fallbackUsed, scrubReady, drawMs: performance.now() - started };
  }

  function resize() {
    const nextVariant = chooseVariant();
    const variantChanged = nextVariant !== variant;
    variant = nextVariant;
    ensureCanvasSize();
    if (variantChanged && manifest) void startLoading();
  }

  async function initialise() {
    try {
      await loadManifest();
      ensureCanvasSize();
      await startLoading();
    } catch (error) {
      options.onFatal?.(error);
    }
  }

  function handleVisibility() { visible = !document.hidden; }
  document.addEventListener('visibilitychange', handleVisibility);
  mobileQuery.addEventListener?.('change', resize);
  void initialise();

  return {
    drawProgress,
    resize,
    isScrubReady: () => scrubReady,
    getState() {
      return { frameCount, loaded: readyCount, failed: loadErrors, firstFrameReady, variant, requestedProgress, requestedIndex, renderedIndex, fallbackUsed, contiguousDecodedThrough, scrubReady, pixelRatio, canvasWidth: canvas.width, canvasHeight: canvas.height };
    },
    dispose() {
      disposed = true;
      loadGeneration += 1;
      document.removeEventListener('visibilitychange', handleVisibility);
      mobileQuery.removeEventListener?.('change', resize);
      context.clearRect(0, 0, cssWidth, cssHeight);
      clearFrameState();
    }
  };
}
