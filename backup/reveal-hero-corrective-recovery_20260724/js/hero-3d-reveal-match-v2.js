import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');
const hero = document.querySelector('.hero-scroll-sequence');
const heroGrid = hero?.querySelector('.hero-grid');
const motionToggle = document.getElementById('motion-toggle');
const scrollCue = document.querySelector('.scroll-cue');
const cards = [...document.querySelectorAll('.hero-stage .float-card')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas && stage && hero && heroGrid) {
  initialiseRevealMatchHero().catch(error => {
    console.error('Reveal-match 3D hero failed to initialise.', error);
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('webgl-fallback');
  });
}

async function initialiseRevealMatchHero() {
  RectAreaLightUniformsLib.init();

  const mobile = window.matchMedia('(max-width: 700px)');
  const lowPowerDevice = (navigator.hardwareConcurrency ?? 4) < 4 || (navigator.deviceMemory ?? 4) < 4;
  const forceDirectRenderer = Boolean(window.__TBM_HERO_TEST_FORCE_DIRECT__);
  const forceComposer = Boolean(window.__TBM_HERO_TEST_FORCE_COMPOSER__);
  const usePostProcessing = forceComposer || (!forceDirectRenderer && !mobile.matches && !reducedMotion.matches && !lowPowerDevice);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !usePostProcessing && window.devicePixelRatio <= 1.5,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.025, 11.55);

  const environmentTarget = createStudioEnvironment(renderer);
  scene.environment = environmentTarget.texture;

  const sculpture = new THREE.Group();
  sculpture.rotation.set(-0.025, -0.075, -0.01);
  scene.add(sculpture);

  const bronzeRoughnessTexture = createRoughnessTexture(0x54424d32);

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x06090a,
    metalness: 0.12,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    ior: 1.48,
    specularIntensity: 0.92,
    specularColor: new THREE.Color(0xdde5e2),
    envMapIntensity: 0.94
  });

  const agedBronze = new THREE.MeshPhysicalMaterial({
    color: 0x765140,
    metalness: 0.9,
    roughness: 0.34,
    clearcoat: 0.32,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.22,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.08,
    anisotropyRotation: 0.3
  });

  const secondaryBronze = new THREE.MeshPhysicalMaterial({
    color: 0x805846,
    metalness: 0.9,
    roughness: 0.34,
    clearcoat: 0.34,
    clearcoatRoughness: 0.19,
    envMapIntensity: 1.24,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.1,
    anisotropyRotation: -0.18
  });

  const jointMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x976248,
    metalness: 0.92,
    roughness: 0.29,
    clearcoat: 0.44,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.28,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.06
  });

  const shellLineMaterial = new THREE.LineBasicMaterial({
    color: 0xa17d6c,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const shellJointMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d6959,
    metalness: 0.72,
    roughness: 0.48,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const coreRadius = 0.88;
  const outerRingRadius = 2.2;
  const shellRadius = 1.22;
  const coreGeometry = new THREE.SphereGeometry(coreRadius, 96, 96);
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.scale.y = 1.012;
  sculpture.add(core);

  const shellGroup = new THREE.Group();
  shellGroup.rotation.set(0.14, -0.22, 0.07);
  sculpture.add(shellGroup);

  const shellSourceGeometry = createIrregularShellGeometry(shellRadius, 1);
  const shellWireGeometry = new THREE.WireframeGeometry(shellSourceGeometry);
  const shellLines = new THREE.LineSegments(shellWireGeometry, shellLineMaterial);
  shellGroup.add(shellLines);

  const uniqueShellVertices = collectUniqueVertices(shellSourceGeometry);
  const shellJointGeometry = new THREE.SphereGeometry(0.01, 6, 6);
  const shellJoints = new THREE.InstancedMesh(
    shellJointGeometry,
    shellJointMaterial,
    uniqueShellVertices.length
  );
  const shellJointMatrix = new THREE.Matrix4();
  uniqueShellVertices.forEach((position, index) => {
    shellJointMatrix.makeTranslation(position.x, position.y, position.z);
    shellJoints.setMatrixAt(index, shellJointMatrix);
  });
  shellJoints.instanceMatrix.needsUpdate = true;
  shellGroup.add(shellJoints);

  const ringDefinitions = [
    {
      kind: 'torus',
      radius: outerRingRadius,
      tube: 0.014,
      rotation: [0.035, 0.075, -0.025],
      speed: 0.004,
      material: agedBronze,
      nodes: [2.31, 5.57]
    },
    {
      kind: 'torus',
      radius: 1.86,
      tube: 0.025,
      rotation: [0.015, 1.5, 0.045],
      speed: -0.008,
      material: secondaryBronze,
      nodes: [3.78]
    },
    {
      kind: 'torus',
      radius: 1.92,
      tube: 0.028,
      rotation: [1.24, 0.34, -0.62],
      speed: 0.011,
      material: agedBronze,
      nodes: [0.16, 3.25]
    },
    {
      kind: 'irregular',
      radius: 1.62,
      tube: 0.017,
      rotation: [1.02, -0.42, 0.76],
      speed: -0.009,
      material: secondaryBronze,
      nodes: [5.68]
    },
    {
      kind: 'torus',
      radius: 1.48,
      tube: 0.013,
      rotation: [0.78, 0.64, 0.18],
      speed: 0.013,
      material: agedBronze,
      nodes: [2.82]
    }
  ];

  const rings = ringDefinitions.map((definition, index) => {
    const ring = createOrbitalRing(definition, jointMaterial);
    ring.userData.phaseOffset = index * 1.21;
    sculpture.add(ring);
    return ring;
  });

  const random = mulberry32(0x54424d31);
  const dustTexture = createRadialTexture([
    [0, 'rgba(220,231,227,0.9)'],
    [0.22, 'rgba(176,193,188,0.5)'],
    [1, 'rgba(95,117,111,0)']
  ]);
  const dustCount = mobile.matches ? 95 : 180;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const radius = 2.35 + random() * 2.65;
    const theta = random() * Math.PI * 2;
    const y = (random() - 0.5) * 4.8;
    dustPositions[index * 3] = Math.cos(theta) * radius;
    dustPositions[index * 3 + 1] = y;
    dustPositions[index * 3 + 2] = -1.5 + random() * 3;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0x9baaa6,
    map: dustTexture,
    alphaMap: dustTexture,
    size: mobile.matches ? 0.033 : 0.026,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.NormalBlending,
    sizeAttenuation: true
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  const emberTexture = createEmberTexture();
  const embers = createEmberSprites({
    scene,
    texture: emberTexture,
    random,
    count: mobile.matches ? 9 : 18
  });

  const hemisphere = new THREE.HemisphereLight(0xb9cbc8, 0x0c0908, 0.2);
  scene.add(hemisphere);

  const key = new THREE.RectAreaLight(0xe4e9e7, 0.9, 5.8, 3.1);
  key.position.set(-3.25, 3.0, 4.6);
  key.lookAt(-0.18, 0.28, 0);
  scene.add(key);

  const fill = new THREE.RectAreaLight(0xb8ccca, 0.28, 3.0, 3.2);
  fill.position.set(3.35, 1.75, 4.7);
  fill.lookAt(0.2, 0.08, 0);
  scene.add(fill);

  const warmRim = new THREE.RectAreaLight(0xa45d38, 0.32, 3.0, 1.45);
  warmRim.position.set(3.05, -2.7, 3.55);
  warmRim.lookAt(0.25, -0.38, 0);
  scene.add(warmRim);

  const shellLight = new THREE.DirectionalLight(0xbca79b, 0.34);
  shellLight.position.set(-3.1, 3.7, 4.3);
  scene.add(shellLight);

  let composer = null;
  let bloomPass = null;
  let smaaPass = null;
  if (usePostProcessing) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.07, 0.1, 1.04);
    composer.addPass(bloomPass);

    smaaPass = new SMAAPass(1, 1);
    composer.addPass(smaaPass);
    composer.addPass(new OutputPass());
  }

  const lastRenderInfo = { calls: 0, triangles: 0, points: 0, lines: 0 };
  const renderFrame = () => {
    renderer.info.reset();
    if (composer) composer.render();
    else renderer.render(scene, camera);
    lastRenderInfo.calls = renderer.info.render.calls;
    lastRenderInfo.triangles = renderer.info.render.triangles;
    lastRenderInfo.points = renderer.info.render.points;
    lastRenderInfo.lines = renderer.info.render.lines;
  };

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let targetProgress = 0;
  let currentProgress = 0;
  let motionEnabled = true;
  let pageVisible = !document.hidden;
  let stageVisible = true;
  let rafId = 0;
  let motionPhase = 0;
  let lastFrameTime = performance.now();
  const frameTiming = { samples: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };

  try {
    motionEnabled = localStorage.getItem('tbm-3d-motion-v3') !== 'off';
  } catch {
    motionEnabled = true;
  }

  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (min, max, value) => {
    if (max <= min) return value >= max ? 1 : 0;
    const x = clamp((value - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
  };

  function setCardProgress(progress, scrollProgress) {
    cards.forEach((card, index) => {
      const start = mobile.matches ? 0.26 + index * 0.075 : 0.2 + index * 0.085;
      const local = smooth(start, start + 0.24, progress);
      card.style.opacity = local.toFixed(3);
      card.style.transform = `translate3d(0, ${(1 - local) * 14}px, 0) scale(${0.98 + local * 0.02})`;
      card.style.pointerEvents = local > 0.92 ? 'auto' : 'none';
    });
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(0.08, 0.3, scrollProgress));
  }

  function applyScene(scrollProgress, phase) {
    const progress = clamp(scrollProgress, 0, 1);
    const motionFactor = motionEnabled && !reducedMotion.matches ? 1 : 0;
    const settle = smooth(0.04, 0.82, progress);
    const breath = Math.sin(phase * 0.42) * 0.003 * motionFactor;

    sculpture.scale.setScalar(lerp(1.0, 1.022, settle) + breath);
    sculpture.position.set(
      lerp(-0.012, 0.012, settle),
      lerp(0.025, -0.012, settle) + Math.sin(phase * 0.28) * 0.006 * motionFactor,
      lerp(0.01, -0.022, settle)
    );
    sculpture.rotation.x = -0.025 - pointerCurrent.y * 0.55 + Math.sin(phase * 0.2) * 0.005 * motionFactor;
    sculpture.rotation.y = -0.075 + pointerCurrent.x * 0.62 + phase * 0.012 * motionFactor;
    sculpture.rotation.z = -0.01 + Math.sin(phase * 0.15) * 0.0035 * motionFactor;

    core.rotation.y = -phase * 0.015 * motionFactor;
    core.rotation.x = phase * 0.005 * motionFactor;

    shellGroup.rotation.x = 0.14 + phase * 0.007 * motionFactor;
    shellGroup.rotation.y = -0.22 - phase * 0.011 * motionFactor;
    shellGroup.rotation.z = 0.07 + Math.sin(phase * 0.18) * 0.006 * motionFactor;
    shellLineMaterial.opacity = lerp(0.16, 0.19, settle);
    shellJointMaterial.opacity = lerp(0.24, 0.3, settle);

    rings.forEach((ring, index) => {
      const spin = phase * ring.userData.speed * motionFactor;
      ring.userData.spinQuaternion.setFromAxisAngle(ring.userData.localNormal, spin);
      ring.quaternion.copy(ring.userData.baseQuaternion).multiply(ring.userData.spinQuaternion);

      const wobble = Math.sin(phase * (0.14 + index * 0.014) + ring.userData.phaseOffset);
      ring.rotateX(wobble * 0.0035 * motionFactor);
      ring.rotateY(wobble * 0.0025 * motionFactor);
    });

    dust.rotation.y = phase * 0.006 * motionFactor;
    dust.rotation.x = Math.sin(phase * 0.07) * 0.009 * motionFactor;
    dustMaterial.opacity = lerp(0.17, 0.22, settle);

    camera.position.z = lerp(11.55, 11.35, settle);
    camera.position.y = lerp(0.025, 0.005, settle);

    const lightBreath = Math.sin(phase * 0.34) * 0.022 * motionFactor;
    key.intensity = 0.9 + lightBreath;
    fill.intensity = 0.28 - lightBreath * 0.2;
    warmRim.intensity = 0.32 + lightBreath * 0.3;

    setCardProgress(progress, scrollProgress);
  }

  function updateEmbers(deltaSeconds) {
    const motionFactor = motionEnabled && !reducedMotion.matches ? 1 : 0;
    embers.forEach(ember => {
      const data = ember.userData;
      if (motionFactor) {
        ember.position.x += data.velocityX * deltaSeconds;
        ember.position.y += data.velocityY * deltaSeconds;
        ember.position.z += data.velocityZ * deltaSeconds;
      }
      data.phase += deltaSeconds * data.flickerSpeed;
      ember.material.opacity = data.baseOpacity * (0.68 + Math.sin(data.phase) * 0.24);

      if (ember.position.x > 4 || ember.position.y > 2.9) resetEmber(ember, random);
    });
  }

  function updatePointer(event) {
    if (!motionEnabled || reducedMotion.matches) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.055;
    pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.038;
  }

  function resetPointer() {
    pointerTarget.set(0, 0);
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    canvas.addEventListener('pointermove', updatePointer, { passive: true });
    canvas.addEventListener('pointerleave', resetPointer);
  }

  function updateMotionButton() {
    if (!motionToggle) return;
    const active = motionEnabled && !reducedMotion.matches;
    motionToggle.textContent = active ? 'Pause ambient motion' : 'Resume ambient motion';
    motionToggle.setAttribute('aria-pressed', String(active));
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.title = reducedMotion.matches
      ? 'Ambient movement is reduced by your system accessibility preference.'
      : '';
    document.documentElement.dataset.heroMotion = active ? 'running' : 'paused';
  }

  motionToggle?.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    motionEnabled = !motionEnabled;
    try {
      localStorage.setItem('tbm-3d-motion-v3', motionEnabled ? 'on' : 'off');
    } catch {
      // Storage may be unavailable in privacy modes; the current state still applies.
    }
    if (!motionEnabled) resetPointer();
    updateMotionButton();
  });
  updateMotionButton();

  function installGsapScroll() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return false;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add('(min-width: 900px)', () => {
      hero.classList.add('is-pinned');
      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: () => `+=${Math.max(window.innerHeight * 1.08, 820)}`,
        pin: heroGrid,
        pinSpacing: true,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          targetProgress = self.progress;
        }
      });
      return () => {
        trigger.kill();
        hero.classList.remove('is-pinned');
      };
    });

    media.add('(max-width: 899px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: 'top 88%',
        end: 'bottom 18%',
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate(self) {
          targetProgress = self.progress;
        }
      });
      return () => trigger.kill();
    });

    return true;
  }

  function installNativeFallback() {
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(window.innerHeight * 0.9, 640);
      targetProgress = clamp((-rect.top + window.innerHeight * 0.04) / travel, 0, 1);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  const installScrollDriver = () => {
    if (!installGsapScroll()) installNativeFallback();
  };
  if (document.readyState === 'complete') installScrollDriver();
  else window.addEventListener('load', installScrollDriver, { once: true });

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
    if (smaaPass) {
      const pixelRatio = renderer.getPixelRatio();
      smaaPass.setSize(width * pixelRatio, height * pixelRatio);
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const visibilityObserver = new IntersectionObserver(entries => {
    stageVisible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.01 });
  visibilityObserver.observe(stage);

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    lastFrameTime = performance.now();
  });

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(rafId);
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('webgl-fallback');
  });

  function frame(time) {
    rafId = requestAnimationFrame(frame);
    const rawFrameMs = Math.max(time - lastFrameTime, 0);
    const deltaSeconds = Math.min(rawFrameMs / 1000, 0.05);
    lastFrameTime = time;
    if (rawFrameMs > 0 && rawFrameMs < 250) {
      frameTiming.samples += 1;
      frameTiming.totalMs += rawFrameMs;
      frameTiming.minMs = Math.min(frameTiming.minMs, rawFrameMs);
      frameTiming.maxMs = Math.max(frameTiming.maxMs, rawFrameMs);
    }
    if (!pageVisible || !stageVisible) return;

    if (motionEnabled && !reducedMotion.matches) motionPhase += deltaSeconds;
    const progressEase = reducedMotion.matches ? 0.18 : 0.09;
    currentProgress += (targetProgress - currentProgress) * progressEase;
    pointerCurrent.lerp(pointerTarget, reducedMotion.matches ? 0.18 : 0.045);

    updateEmbers(deltaSeconds);
    applyScene(currentProgress, motionPhase);
    renderFrame();
  }

  function handleReducedMotionChange() {
    resetPointer();
    updateMotionButton();
    applyScene(currentProgress, motionPhase);
    renderFrame();
  }

  reducedMotion.addEventListener?.('change', handleReducedMotionChange);
  mobile.addEventListener?.('change', resize);

  document.documentElement.classList.add('webgl-ready');
  document.documentElement.classList.remove('webgl-fallback');
  applyScene(0, motionPhase);
  renderFrame();
  rafId = requestAnimationFrame(frame);

  window.__tbmRevealMatchHero = {
    getState() {
      return {
        targetProgress,
        currentProgress,
        motionEnabled,
        reducedMotion: reducedMotion.matches,
        ringCount: rings.length,
        shellJointCount: uniqueShellVertices.length,
        emberCount: embers.length,
        postProcessing: Boolean(composer),
        renderPath: composer ? 'composer' : 'direct',
        lowPowerDevice,
        forceDirectRenderer,
        forceComposer,
        pixelRatio: renderer.getPixelRatio(),
        renderer: {
          ...lastRenderInfo,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length ?? 0
        },
        geometry: {
          coreRadius,
          shellRadius,
          outerRingRadius,
          coreOuterDiameterRatio: coreRadius / outerRingRadius
        },
        materials: {
          core: {
            metalness: coreMaterial.metalness,
            roughness: coreMaterial.roughness,
            clearcoat: coreMaterial.clearcoat,
            clearcoatRoughness: coreMaterial.clearcoatRoughness,
            envMapIntensity: coreMaterial.envMapIntensity
          },
          agedBronze: {
            metalness: agedBronze.metalness,
            roughness: agedBronze.roughness,
            envMapIntensity: agedBronze.envMapIntensity
          }
        },
        frameTiming: {
          samples: frameTiming.samples,
          averageMs: frameTiming.samples ? frameTiming.totalMs / frameTiming.samples : 0,
          minMs: Number.isFinite(frameTiming.minMs) ? frameTiming.minMs : 0,
          maxMs: frameTiming.maxMs
        }
      };
    }
  };

  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    reducedMotion.removeEventListener?.('change', handleReducedMotionChange);
    mobile.removeEventListener?.('change', resize);
    composer?.dispose?.();
    environmentTarget.dispose();
    coreGeometry.dispose();
    coreMaterial.dispose();
    shellSourceGeometry.dispose();
    shellWireGeometry.dispose();
    shellLineMaterial.dispose();
    shellJointGeometry.dispose();
    shellJointMaterial.dispose();
    rings.forEach(ring => {
      const disposed = new Set();
      ring.traverse(object => {
        if (object.isMesh && object.geometry && !disposed.has(object.geometry)) {
          disposed.add(object.geometry);
          object.geometry.dispose();
        }
      });
    });
    agedBronze.dispose();
    secondaryBronze.dispose();
    jointMaterial.dispose();
    bronzeRoughnessTexture.dispose();
    dustGeometry.dispose();
    dustMaterial.dispose();
    dustTexture.dispose();
    embers.forEach(ember => ember.material.dispose());
    emberTexture.dispose();
    renderer.dispose();
    delete window.__tbmRevealMatchHero;
  }, { once: true });
}

function createStudioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x050809);
  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  const panelMaterials = [];
  const target = new THREE.Vector3();
  const panels = [
    { position: [-2.7, 2.4, 3.4], scale: [5.6, 3.2], rgb: [4.6, 5.0, 4.9], lookAt: [-0.28, 0.34, 0] },
    { position: [2.2, 3.4, 3.5], scale: [2.8, 1.6], rgb: [2.6, 3.0, 2.9], lookAt: [0.3, 0.42, 0] },
    { position: [2.8, -2.2, 3.1], scale: [2.8, 1.3], rgb: [1.8, 0.75, 0.38], lookAt: [0.3, -0.4, 0] }
  ];

  panels.forEach(definition => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(...definition.rgb),
      side: THREE.DoubleSide,
      toneMapped: false
    });
    panelMaterials.push(material);
    const panel = new THREE.Mesh(panelGeometry, material);
    panel.position.set(...definition.position);
    panel.scale.set(definition.scale[0], definition.scale[1], 1);
    target.set(...definition.lookAt);
    panel.lookAt(target);
    studio.add(panel);
  });

  const environmentTarget = pmrem.fromScene(studio, 0.13, 0.1, 50);
  panelGeometry.dispose();
  panelMaterials.forEach(material => material.dispose());
  pmrem.dispose();
  return environmentTarget;
}

function createOrbitalRing(definition, jointMaterial) {
  const ring = new THREE.Group();
  const geometry = definition.kind === 'irregular'
    ? createIrregularOrbitGeometry(definition.radius, definition.tube)
    : new THREE.TorusGeometry(
        definition.radius,
        definition.tube,
        12,
        window.innerWidth < 700 ? 128 : 192
      );
  const mesh = new THREE.Mesh(geometry, definition.material);
  ring.add(mesh);

  const nodeGeometry = new THREE.SphereGeometry(
    definition.radius > 2.1 ? 0.075 : 0.086,
    20,
    20
  );
  definition.nodes.forEach(angle => {
    const node = new THREE.Mesh(nodeGeometry, jointMaterial);
    node.position.set(
      Math.cos(angle) * definition.radius,
      Math.sin(angle) * definition.radius,
      0
    );
    node.scale.setScalar(definition.radius > 2.1 ? 0.94 : 1);
    ring.add(node);
  });

  ring.rotation.set(...definition.rotation);
  ring.userData.baseQuaternion = ring.quaternion.clone();
  ring.userData.spinQuaternion = new THREE.Quaternion();
  ring.userData.localNormal = new THREE.Vector3(0, 0, 1);
  ring.userData.speed = definition.speed;
  return ring;
}

function createIrregularShellGeometry(radius, detail) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const positions = geometry.getAttribute('position');
  const point = new THREE.Vector3();

  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index).normalize();
    const variation =
      Math.sin(point.x * 11.7 + point.y * 7.1) * 0.014 +
      Math.sin(point.z * 13.3 - point.x * 5.4) * 0.01;
    point.multiplyScalar(radius * (1 + variation));
    positions.setXYZ(index, point.x, point.y, point.z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createIrregularOrbitGeometry(radius, tube) {
  const points = [];
  const segments = window.innerWidth < 700 ? 72 : 112;
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const radialVariation = 1 + Math.sin(angle * 3 + 0.35) * 0.015 + Math.sin(angle * 7) * 0.007;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius * radialVariation,
      Math.sin(angle) * radius * radialVariation,
      Math.sin(angle * 5 + 0.4) * 0.021
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(
    curve,
    window.innerWidth < 700 ? 128 : 192,
    tube,
    8,
    true
  );
}

function createRoughnessTexture(seed) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const random = mulberry32(seed);

  for (let index = 0; index < size * size; index += 1) {
    const value = Math.round(220 + random() * 32);
    const offset = index * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 2);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function collectUniqueVertices(geometry) {
  const positions = geometry.getAttribute('position');
  const unique = new Map();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const key = `${x.toFixed(3)}:${y.toFixed(3)}:${z.toFixed(3)}`;
    if (!unique.has(key)) unique.set(key, new THREE.Vector3(x, y, z));
  }

  const all = [...unique.values()];
  if (all.length <= 56) return all;
  const stride = Math.max(1, Math.floor(all.length / 52));
  return all.filter((_, index) => index % stride === 0).slice(0, 56);
}

function createRadialTexture(stops) {
  const size = 64;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  stops.forEach(([offset, colour]) => gradient.addColorStop(offset, colour));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEmberTexture() {
  const width = 128;
  const height = 24;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = width;
  textureCanvas.height = height;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(255,198,122,0)');
  gradient.addColorStop(0.22, 'rgba(255,174,87,0.18)');
  gradient.addColorStop(0.58, 'rgba(235,120,47,0.82)');
  gradient.addColorStop(0.86, 'rgba(255,202,142,0.32)');
  gradient.addColorStop(1, 'rgba(255,218,164,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEmberSprites({ scene, texture, random, count }) {
  const embers = [];
  for (let index = 0; index < count; index += 1) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: index % 4 === 0 ? 0xd58b57 : 0x9f4f29,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      rotation: -0.45 + random() * 0.35
    });
    const ember = new THREE.Sprite(material);
    ember.userData.seed = index;
    resetEmber(ember, random);
    scene.add(ember);
    embers.push(ember);
  }
  return embers;
}

function resetEmber(ember, random) {
  const mostlyRight = random() < 0.8;
  ember.position.set(
    mostlyRight ? 1.05 + random() * 2.55 : -3.15 + random() * 0.9,
    -2.35 + random() * 3.3,
    -0.9 + random() * 2
  );
  const width = 0.07 + random() * 0.16;
  ember.scale.set(width, width * (0.07 + random() * 0.05), 1);
  ember.userData.velocityX = 0.07 + random() * 0.1;
  ember.userData.velocityY = 0.04 + random() * 0.09;
  ember.userData.velocityZ = (random() - 0.5) * 0.02;
  ember.userData.baseOpacity = 0.14 + random() * 0.34;
  ember.userData.phase = random() * Math.PI * 2;
  ember.userData.flickerSpeed = 0.7 + random() * 1.6;
}

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
