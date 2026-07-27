const clamp = value => Math.min(1, Math.max(0, value));

const DEFAULTS = Object.freeze({
  frameCount: 32,
  initialBatchSize: 10,
  desktopBase: 'assets/forge-reveal/desktop',
  mobileBase: 'assets/forge-reveal/mobile',
  firstFrameTimeoutMs: 5500,
  backgroundConcurrency: 4,
  mobileBreakpoint: 700
});

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function mixChannel(a, b, amount) {
  return Math.round(a + (b - a) * amount);
}

export function createForgeFrameSequence(canvas, suppliedOptions = {}) {
  if (!canvas) return null;

  const options = { ...DEFAULTS, ...suppliedOptions };
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) {
    options.onFatal?.(new Error('A 2D canvas context is unavailable.'));
    return null;
  }

  const samplingCanvas = document.createElement('canvas');
  samplingCanvas.width = 4;
  samplingCanvas.height = 4;
  const samplingContext = samplingCanvas.getContext('2d', { willReadFrequently: true });

  const frames = new Array(options.frameCount).fill(null);
  const frameFailures = new Uint8Array(options.frameCount);
  const backgroundColours = new Array(options.frameCount).fill(null);
  const loadedFlags = new Uint8Array(options.frameCount);
  const mobileQuery = window.matchMedia(`(max-width: ${options.mobileBreakpoint}px)`);

  let variant = chooseVariant();
  let loadGeneration = 0;
  let disposed = false;
  let visible = !document.hidden;
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let requestedProgress = 0;
  let renderRequest = 0;
  let firstFrameReady = false;
  let readyCount = 0;
  let loadErrors = 0;

  function chooseVariant() {
    const shortSide = Math.min(window.innerWidth || 1, window.innerHeight || 1);
    return mobileQuery.matches || shortSide <= options.mobileBreakpoint ? 'mobile' : 'desktop';
  }

  function frameUrl(index, selectedVariant = variant) {
    const base = selectedVariant === 'mobile' ? options.mobileBase : options.desktopBase;
    return `${base}/frame_${String(index + 1).padStart(4, '0')}.webp`;
  }

  function clearFrameState() {
    for (let index = 0; index < options.frameCount; index += 1) {
      frames[index] = null;
      frameFailures[index] = 0;
      loadedFlags[index] = 0;
      backgroundColours[index] = null;
    }
    readyCount = 0;
    loadErrors = 0;
    firstFrameReady = false;
  }

  function sampleBackground(index, image) {
    if (!samplingContext || backgroundColours[index]) return backgroundColours[index];
    try {
      samplingContext.clearRect(0, 0, 4, 4);
      samplingContext.drawImage(image, 0, 0, 4, 4);
      const data = samplingContext.getImageData(0, 0, 4, 4).data;
      const cornerOffsets = [0, 12, 48, 60];
      let red = 0;
      let green = 0;
      let blue = 0;
      for (const offset of cornerOffsets) {
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
      }
      const colour = [
        Math.round((red / cornerOffsets.length) * 0.78),
        Math.round((green / cornerOffsets.length) * 0.78),
        Math.round((blue / cornerOffsets.length) * 0.78)
      ];
      backgroundColours[index] = colour;
      return colour;
    } catch {
      const fallback = [4, 9, 8];
      backgroundColours[index] = fallback;
      return fallback;
    }
  }

  function loadFrame(index, generation) {
    if (disposed || generation !== loadGeneration || loadedFlags[index] || frameFailures[index]) {
      return Promise.resolve(Boolean(loadedFlags[index]));
    }

    return new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        if (disposed || generation !== loadGeneration) {
          resolve(false);
          return;
        }
        try {
          await image.decode?.();
        } catch {
          // The load event is sufficient when decode() is unavailable or rejects after a successful load.
        }
        frames[index] = image;
        loadedFlags[index] = 1;
        readyCount += 1;
        sampleBackground(index, image);
        if (index === 0 && !firstFrameReady) {
          firstFrameReady = true;
          options.onFirstFrame?.();
        }
        options.onProgress?.({ loaded: readyCount, failed: loadErrors, total: options.frameCount, variant });
        requestDraw();
        resolve(true);
      };
      image.onerror = () => {
        if (disposed || generation !== loadGeneration) {
          resolve(false);
          return;
        }
        frameFailures[index] = 1;
        loadErrors += 1;
        options.onProgress?.({ loaded: readyCount, failed: loadErrors, total: options.frameCount, variant });
        resolve(false);
      };
      image.src = frameUrl(index);
    });
  }

  async function loadRemaining(generation, startIndex) {
    let cursor = startIndex;
    async function worker() {
      while (!disposed && generation === loadGeneration) {
        const index = cursor;
        cursor += 1;
        if (index >= options.frameCount) return;
        await loadFrame(index, generation);
      }
    }
    const workers = [];
    const count = Math.max(1, Math.min(options.backgroundConcurrency, options.frameCount - startIndex));
    for (let index = 0; index < count; index += 1) workers.push(worker());
    await Promise.allSettled(workers);
    if (!disposed && generation === loadGeneration) {
      options.onComplete?.({ loaded: readyCount, failed: loadErrors, total: options.frameCount, variant });
    }
  }

  async function startLoading() {
    const generation = ++loadGeneration;
    clearFrameState();
    options.onVariant?.(variant);

    const timeout = window.setTimeout(() => {
      if (!disposed && generation === loadGeneration && !firstFrameReady) {
        options.onFatal?.(new Error(`The first ${variant} reveal frame did not load within ${options.firstFrameTimeoutMs}ms.`));
      }
    }, options.firstFrameTimeoutMs);

    const initialPromises = [];
    const immediateCount = Math.min(options.initialBatchSize, options.frameCount);
    for (let index = 0; index < immediateCount; index += 1) {
      initialPromises.push(loadFrame(index, generation));
    }

    const initialResults = await Promise.allSettled(initialPromises);
    window.clearTimeout(timeout);

    if (disposed || generation !== loadGeneration) return;
    if (!firstFrameReady) {
      options.onFatal?.(new Error(`The first ${variant} reveal frame failed to load.`));
      return;
    }

    options.onInitialBatch?.({
      loaded: initialResults.filter(result => result.status === 'fulfilled' && result.value).length,
      requested: immediateCount,
      variant
    });
    void loadRemaining(generation, immediateCount);
  }

  function nearestLoaded(index) {
    if (loadedFlags[index]) return index;
    for (let distance = 1; distance < options.frameCount; distance += 1) {
      const previous = index - distance;
      const next = index + distance;
      if (previous >= 0 && loadedFlags[previous]) return previous;
      if (next < options.frameCount && loadedFlags[next]) return next;
    }
    return -1;
  }

  function ensureCanvasSize() {
    const nextWidth = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth || 1));
    const nextHeight = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight || 1));
    const maxPixelWidth = variant === 'mobile' ? 1170 : 1920;
    const maxPixelHeight = variant === 'mobile' ? 1800 : 1080;
    const nextRatio = Math.max(0.75, Math.min(
      window.devicePixelRatio || 1,
      1.5,
      maxPixelWidth / nextWidth,
      maxPixelHeight / nextHeight
    ));

    if (nextWidth === cssWidth && nextHeight === cssHeight && Math.abs(nextRatio - pixelRatio) < 0.01) {
      return false;
    }

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

  function drawCoverBackground(image) {
    const scale = Math.max(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight) * 1.08;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (cssWidth - width) / 2;
    const y = (cssHeight - height) / 2;
    context.save();
    context.globalAlpha = variant === 'mobile' ? 0.5 : 0.22;
    context.filter = variant === 'mobile'
      ? 'blur(22px) brightness(0.48) saturate(0.76)'
      : 'blur(18px) brightness(0.55) saturate(0.82)';
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  function drawForeground(image, alpha) {
    const containScale = Math.min(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight);
    const scale = variant === 'mobile' ? containScale * 1.25 : containScale;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (cssWidth - width) / 2;
    const centreY = variant === 'mobile' ? cssHeight * 0.48 : cssHeight * 0.5;
    const y = centreY - height / 2;
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  function draw() {
    renderRequest = 0;
    if (disposed || !visible || !firstFrameReady) return;
    ensureCanvasSize();

    const frameFloat = requestedProgress * (options.frameCount - 1);
    const frameA = Math.floor(frameFloat);
    const frameB = Math.min(frameA + 1, options.frameCount - 1);
    const mix = smoothstep(frameFloat - frameA);
    const resolvedA = nearestLoaded(frameA);
    const resolvedB = nearestLoaded(frameB);
    const primaryIndex = resolvedA >= 0 ? resolvedA : resolvedB;
    if (primaryIndex < 0) return;

    const primary = frames[primaryIndex];
    const secondary = resolvedB >= 0 ? frames[resolvedB] : null;
    const primaryColour = sampleBackground(primaryIndex, primary) || [4, 9, 8];
    const secondaryColour = secondary ? (sampleBackground(resolvedB, secondary) || primaryColour) : primaryColour;
    const red = mixChannel(primaryColour[0], secondaryColour[0], mix);
    const green = mixChannel(primaryColour[1], secondaryColour[1], mix);
    const blue = mixChannel(primaryColour[2], secondaryColour[2], mix);

    context.globalAlpha = 1;
    context.filter = 'none';
    context.fillStyle = `rgb(${red} ${green} ${blue})`;
    context.fillRect(0, 0, cssWidth, cssHeight);

    const aspectMismatch = Math.abs((cssWidth / cssHeight) - (primary.naturalWidth / primary.naturalHeight));
    if (variant === 'mobile' || aspectMismatch > 0.035) drawCoverBackground(primary);

    if (secondary && resolvedB !== primaryIndex && mix > 0.002) {
      drawForeground(primary, 1);
      drawForeground(secondary, mix);
    } else {
      drawForeground(primary, 1);
    }
  }

  function requestDraw() {
    if (!renderRequest && visible && !disposed) renderRequest = requestAnimationFrame(draw);
  }

  function setProgress(value) {
    requestedProgress = clamp(value);
    requestDraw();
  }

  function resize() {
    const nextVariant = chooseVariant();
    const changedVariant = nextVariant !== variant;
    variant = nextVariant;
    const changedSize = ensureCanvasSize();
    if (changedVariant) void startLoading();
    else if (changedSize) requestDraw();
  }

  function handleVisibility() {
    visible = !document.hidden;
    if (visible) requestDraw();
    else if (renderRequest) {
      cancelAnimationFrame(renderRequest);
      renderRequest = 0;
    }
  }

  document.addEventListener('visibilitychange', handleVisibility);
  mobileQuery.addEventListener?.('change', resize);
  ensureCanvasSize();
  void startLoading();

  return {
    setProgress,
    resize,
    getState() {
      return {
        frameCount: options.frameCount,
        loaded: readyCount,
        failed: loadErrors,
        firstFrameReady,
        variant,
        progress: requestedProgress,
        pixelRatio,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      };
    },
    dispose() {
      disposed = true;
      loadGeneration += 1;
      if (renderRequest) cancelAnimationFrame(renderRequest);
      document.removeEventListener('visibilitychange', handleVisibility);
      mobileQuery.removeEventListener?.('change', resize);
      context.clearRect(0, 0, cssWidth, cssHeight);
      clearFrameState();
    }
  };
}
