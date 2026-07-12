import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
  renderer.toneMappingExposure = 0.9;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.04, 9.95);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const room = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(room, 0.04);
  scene.environment = environmentTarget.texture;
  room.dispose?.();
  pmrem.dispose();

  const sculpture = new THREE.Group();
  sculpture.rotation.set(-0.075, -0.265, -0.055);
  scene.add(sculpture);

  const bronzeRoughnessTexture = createRoughnessTexture(0x54424d32);

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x080b0c,
    metalness: 0.82,
    roughness: 0.21,
    clearcoat: 1,
    clearcoatRoughness: 0.075,
    envMapIntensity: 1.28
  });

  const agedBronze = new THREE.MeshPhysicalMaterial({
    color: 0x5d463b,
    metalness: 1,
    roughness: 0.39,
    clearcoat: 0.42,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.94,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.12,
    anisotropyRotation: 0.35
  });

  const paleBronze = new THREE.MeshPhysicalMaterial({
    color: 0x80665b,
    metalness: 1,
    roughness: 0.34,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.02,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.16,
    anisotropyRotation: -0.2
  });

  const jointMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x765649,
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0.68,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.05,
    roughnessMap: bronzeRoughnessTexture,
    anisotropy: 0.1
  });

  const shellLineMaterial = new THREE.LineBasicMaterial({
    color: 0x9d8b80,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const shellJointMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b887c,
    metalness: 0.9,
    roughness: 0.38,
    transparent: true,
    opacity: 0.56
  });

  const coreRadius = 0.78;
  const outerRingRadius = 2.28;
  const shellRadius = 1.26;
  const core = new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 96, 96), coreMaterial);
  core.scale.y = 1.015;
  sculpture.add(core);

  const shellGroup = new THREE.Group();
  shellGroup.rotation.set(0.23, -0.36, 0.14);
  sculpture.add(shellGroup);

  const shellSourceGeometry = createIrregularShellGeometry(shellRadius, 2);
  const shellWireGeometry = new THREE.WireframeGeometry(shellSourceGeometry);
  const shellLines = new THREE.LineSegments(shellWireGeometry, shellLineMaterial);
  shellGroup.add(shellLines);

  const uniqueShellVertices = collectUniqueVertices(shellSourceGeometry);
  const shellJointGeometry = new THREE.SphereGeometry(0.015, 7, 7);
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
      tube: 0.009,
      rotation: [0.24, 0.31, -0.13],
      speed: 0.006,
      material: agedBronze,
      nodes: [2.52, 5.63]
    },
    {
      kind: 'torus',
      radius: 1.98,
      tube: 0.011,
      rotation: [0.11, 1.47, -0.18],
      speed: -0.014,
      material: paleBronze,
      nodes: [3.82]
    },
    {
      kind: 'torus',
      radius: 2.04,
      tube: 0.013,
      rotation: [0.92, 0.42, 0.91],
      speed: 0.019,
      material: agedBronze,
      nodes: [0.18, 3.25]
    },
    {
      kind: 'irregular',
      radius: 1.91,
      tube: 0.011,
      rotation: [1.08, -0.72, -0.48],
      speed: -0.022,
      material: paleBronze,
      nodes: [5.84]
    },
    {
      kind: 'torus',
      radius: 1.82,
      tube: 0.010,
      rotation: [1.34, 0.18, 0.51],
      speed: 0.027,
      material: agedBronze,
      nodes: [2.92]
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
    [0, 'rgba(220,231,227,0.92)'],
    [0.22, 'rgba(176,193,188,0.55)'],
    [1, 'rgba(95,117,111,0)']
  ]);
  const dustCount = mobile.matches ? 95 : 180;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const radius = 2.3 + random() * 2.65;
    const theta = random() * Math.PI * 2;
    const y = (random() - 0.5) * 4.9;
    dustPositions[index * 3] = Math.cos(theta) * radius;
    dustPositions[index * 3 + 1] = y;
    dustPositions[index * 3 + 2] = -1.4 + random() * 2.8;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xa6b2af,
    map: dustTexture,
    alphaMap: dustTexture,
    size: mobile.matches ? 0.035 : 0.028,
    transparent: true,
    opacity: 0.25,
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

  const hemisphere = new THREE.HemisphereLight(0xc8d7d2, 0x120c09, 0.27);
  scene.add(hemisphere);

  const key = new THREE.RectAreaLight(0xe8ece9, 3.1, 3.8, 2.2);
  key.position.set(-3.5, 3.25, 5.2);
  key.lookAt(0, 0.2, 0);
  scene.add(key);

  const fill = new THREE.RectAreaLight(0xc8d3d1, 1.05, 2.3, 3.2);
  fill.position.set(3.0, 1.0, 4.6);
  fill.lookAt(0, 0, 0);
  scene.add(fill);

  const warmRim = new THREE.RectAreaLight(0x8e573d, 0.92, 2.1, 1.1);
  warmRim.position.set(2.25, -2.35, 3.15);
  warmRim.lookAt(0, -0.25, 0);
  scene.add(warmRim);

  const shellLight = new THREE.DirectionalLight(0xcab2a3, 0.58);
  shellLight.position.set(-2.8, 3.8, 4.2);
  scene.add(shellLight);

  let composer = null;
  let bloomPass = null;
  let smaaPass = null;
  if (usePostProcessing) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.12, 0.18, 0.92);
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
      const local = smooth(0.18 + index * 0.09, 0.42 + index * 0.09, progress);
      card.style.opacity = local.toFixed(3);
      card.style.transform = `translate3d(0, ${(1 - local) * 16}px, 0) scale(${0.975 + local * 0.025})`;
      card.style.pointerEvents = local > 0.92 ? 'auto' : 'none';
    });
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(0.08, 0.3, scrollProgress));
  }

  function applyScene(scrollProgress, phase) {
    const progress = clamp(scrollProgress, 0, 1);
    const motionFactor = motionEnabled && !reducedMotion.matches ? 1 : 0;
    const settle = smooth(0.04, 0.82, progress);
    const breath = Math.sin(phase * 0.46) * 0.004 * motionFactor;

    sculpture.scale.setScalar(lerp(1.015, 1.045, settle) + breath);
    sculpture.position.set(
      lerp(-0.015, 0.025, settle),
      lerp(0.055, -0.015, settle) + Math.sin(phase * 0.31) * 0.008 * motionFactor,
      lerp(0.015, -0.035, settle)
    );
    sculpture.rotation.x = -0.075 - pointerCurrent.y * 0.9 + Math.sin(phase * 0.23) * 0.008 * motionFactor;
    sculpture.rotation.y = -0.265 + pointerCurrent.x * 1.05 + phase * 0.018 * motionFactor;
    sculpture.rotation.z = -0.055 + Math.sin(phase * 0.17) * 0.005 * motionFactor;

    core.rotation.y = -phase * 0.024 * motionFactor;
    core.rotation.x = phase * 0.008 * motionFactor;

    shellGroup.rotation.x = 0.23 + phase * 0.012 * motionFactor;
    shellGroup.rotation.y = -0.36 - phase * 0.019 * motionFactor;
    shellGroup.rotation.z = 0.14 + Math.sin(phase * 0.21) * 0.009 * motionFactor;
    shellLineMaterial.opacity = lerp(0.29, 0.36, settle);

    rings.forEach((ring, index) => {
      const spin = phase * ring.userData.speed * motionFactor;
      ring.userData.spinQuaternion.setFromAxisAngle(ring.userData.localNormal, spin);
      ring.quaternion.copy(ring.userData.baseQuaternion).multiply(ring.userData.spinQuaternion);

      const wobble = Math.sin(phase * (0.18 + index * 0.018) + ring.userData.phaseOffset);
      ring.rotateX(wobble * 0.006 * motionFactor);
      ring.rotateY(wobble * 0.004 * motionFactor);
    });

    dust.rotation.y = phase * 0.009 * motionFactor;
    dust.rotation.x = Math.sin(phase * 0.08) * 0.012 * motionFactor;
    dustMaterial.opacity = lerp(0.2, 0.27, settle);

    camera.position.z = lerp(9.95, 9.68, settle);
    camera.position.y = lerp(0.055, 0.015, settle);

    const lightBreath = Math.sin(phase * 0.4) * 0.035 * motionFactor;
    key.intensity = 3.1 + lightBreath;
    fill.intensity = 1.05 - lightBreath * 0.35;
    warmRim.intensity = 0.92 + lightBreath * 0.55;

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

      if (ember.position.x > 4.0 || ember.position.y > 2.9) {
        resetEmber(ember, random);
      }
    });
  }

  function updatePointer(event) {
    if (!motionEnabled || reducedMotion.matches) return;
    const rect = stage.getBoundingClientRect();
    pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.075;
    pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.05;
  }

  function resetPointer() {
    pointerTarget.set(0, 0);
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', updatePointer, { passive: true });
    stage.addEventListener('pointerleave', resetPointer);
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
    const { width, height } = stage.getBoundingClientRect();
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
  resizeObserver.observe(stage);
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
    core.geometry.dispose();
    coreMaterial.dispose();
    shellSourceGeometry.dispose();
    shellWireGeometry.dispose();
    shellLineMaterial.dispose();
    shellJointGeometry.dispose();
    shellJointMaterial.dispose();
    rings.forEach(ring => {
      ring.traverse(object => {
        if (object.isMesh) object.geometry?.dispose?.();
      });
    });
    agedBronze.dispose();
    paleBronze.dispose();
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
    definition.radius > 2.1 ? 0.062 : 0.074,
    22,
    22
  );
  definition.nodes.forEach(angle => {
    const node = new THREE.Mesh(nodeGeometry, jointMaterial);
    node.position.set(
      Math.cos(angle) * definition.radius,
      Math.sin(angle) * definition.radius,
      0
    );
    node.scale.setScalar(definition.radius > 2.1 ? 0.92 : 1);
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
      Math.sin(point.x * 11.7 + point.y * 7.1) * 0.012 +
      Math.sin(point.z * 13.3 - point.x * 5.4) * 0.009;
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
    const radialVariation = 1 + Math.sin(angle * 3 + 0.35) * 0.012 + Math.sin(angle * 7) * 0.006;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius * radialVariation,
      Math.sin(angle) * radius * radialVariation,
      Math.sin(angle * 5 + 0.4) * 0.018
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
    const value = Math.round(172 + random() * 64);
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
  if (all.length <= 72) return all;
  const stride = Math.max(1, Math.floor(all.length / 64));
  return all.filter((_, index) => index % stride === 0).slice(0, 72);
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
  gradient.addColorStop(0.22, 'rgba(255,174,87,0.22)');
  gradient.addColorStop(0.58, 'rgba(245,130,49,0.95)');
  gradient.addColorStop(0.86, 'rgba(255,211,150,0.4)');
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
      color: index % 4 === 0 ? 0xe6a065 : 0xb95f2c,
      transparent: true,
      opacity: 0.45,
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
  const mostlyRight = random() < 0.78;
  ember.position.set(
    mostlyRight ? 0.95 + random() * 2.7 : -3.25 + random() * 1.1,
    -2.3 + random() * 3.45,
    -0.9 + random() * 2.0
  );
  const width = 0.08 + random() * 0.19;
  ember.scale.set(width, width * (0.075 + random() * 0.055), 1);
  ember.userData.velocityX = 0.08 + random() * 0.12;
  ember.userData.velocityY = 0.045 + random() * 0.11;
  ember.userData.velocityZ = (random() - 0.5) * 0.025;
  ember.userData.baseOpacity = 0.18 + random() * 0.42;
  ember.userData.phase = random() * Math.PI * 2;
  ember.userData.flickerSpeed = 0.7 + random() * 1.8;
}

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
