import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');
const hero = document.querySelector('.hero-scroll-sequence');
const heroGrid = hero?.querySelector('.hero-grid');
const motionToggle = document.getElementById('motion-toggle');
const scrollCue = document.querySelector('.scroll-cue');
const cards = [...document.querySelectorAll('.hero-stage .float-card')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas && stage && hero && heroGrid) {
  initialiseHeroScene().catch(error => {
    console.error('3D hero failed to initialise.', error);
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('webgl-fallback');
  });
}

async function initialiseHeroScene() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio <= 1.5,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.05, 8.8);

  const sculpture = new THREE.Group();
  scene.add(sculpture);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd59a32,
    metalness: 1,
    roughness: 0.19,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: 0x241003,
    emissiveIntensity: 0.38
  });

  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x111311,
    metalness: 0.94,
    roughness: 0.23,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    transparent: true,
    opacity: 1
  });

  const edgeGold = new THREE.MeshStandardMaterial({
    color: 0xf0bf58,
    metalness: 1,
    roughness: 0.13,
    emissive: 0x3a1903,
    emissiveIntensity: 0.75
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 64), darkMetal);
  sculpture.add(core);

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xa76816,
    wireframe: true,
    transparent: true,
    opacity: 0
  });
  const innerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.17, 2), wireMaterial);
  sculpture.add(innerWire);

  const ringData = [
    [1.55, 0.025, 1.15, 0.00, 0.18],
    [1.73, 0.021, 0.08, 1.18, 0.63],
    [1.91, 0.018, 0.77, 0.54, 1.22],
    [2.10, 0.016, 1.42, 0.83, 0.10],
    [2.28, 0.014, 0.48, 1.38, 0.82]
  ];

  const explodedOffsets = [
    new THREE.Vector3(-1.35, 0.78, -0.55),
    new THREE.Vector3(1.1, -0.65, 0.45),
    new THREE.Vector3(-0.75, -1.2, -0.25),
    new THREE.Vector3(0.9, 1.1, 0.15),
    new THREE.Vector3(0.15, -0.15, -1.45)
  ];

  const rings = ringData.map(([radius, tube, x, y, z], index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 18, 220),
      index < 2 ? edgeGold : gold
    );
    ring.userData.baseRotation = new THREE.Euler(x, y, z);
    ring.userData.explodedRotation = new THREE.Euler(
      x + (index % 2 ? -1.15 : 1.05),
      y + (index % 2 ? 0.78 : -0.92),
      z + (index - 2) * 0.22
    );
    ring.userData.offset = explodedOffsets[index];
    sculpture.add(ring);
    return ring;
  });

  const nodes = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.055, 18, 18);
  for (let index = 0; index < 18; index += 1) {
    const node = new THREE.Mesh(nodeGeometry, index % 3 === 0 ? edgeGold : gold);
    const angle = (index / 18) * Math.PI * 2;
    const radius = 1.58 + (index % 4) * 0.17;
    node.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7) * 0.72,
      Math.sin(angle) * radius
    );
    node.scale.setScalar(index % 5 === 0 ? 1.55 : 1);
    nodes.add(node);
  }
  sculpture.add(nodes);

  const particleCount = window.innerWidth < 700 ? 220 : 420;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const radius = 2.2 + Math.random() * 1.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[index * 3 + 1] = radius * Math.cos(phi) * 0.72;
    particlePositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xeab553,
    size: 0.018,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  sculpture.add(particles);

  const pedestal = new THREE.Group();
  pedestal.position.y = -2.15;
  const pedestalParts = [
    [1.52, 1.72, 0.18, -0.04],
    [1.25, 1.52, 0.2, 0.13],
    [0.98, 1.25, 0.18, 0.31]
  ];
  for (const [top, bottom, height, y] of pedestalParts) {
    const part = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 96), darkMetal);
    part.position.y = y;
    pedestal.add(part);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(top, 0.016, 12, 128), edgeGold);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = y + height / 2;
    pedestal.add(trim);
  }
  sculpture.add(pedestal);

  const hemisphere = new THREE.HemisphereLight(0xffe4aa, 0x101411, 0.55);
  scene.add(hemisphere);
  const keyLight = new THREE.DirectionalLight(0xffd27c, 1.4);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xc97916, 12, 14, 1.8);
  rimLight.position.set(-3, 0.5, 3.5);
  scene.add(rimLight);
  const lowerGlow = new THREE.PointLight(0xf1a730, 8, 10, 2);
  lowerGlow.position.set(0, -3, 2);
  scene.add(lowerGlow);

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let targetProgress = 0;
  let currentProgress = 0;
  let lastScrollAt = performance.now();
  let motionEnabled = localStorage.getItem('tbm-3d-motion') !== 'off';
  let pageVisible = !document.hidden;
  let stageVisible = true;
  let rafId = 0;

  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (min, max, value) => {
    const x = clamp((value - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
  };

  function setCardProgress(progress) {
    cards.forEach((card, index) => {
      const local = smooth(0.48 + index * 0.085, 0.68 + index * 0.085, progress);
      card.style.opacity = local.toFixed(3);
      card.style.transform = `translate3d(0, ${(1 - local) * 22}px, 0) scale(${0.96 + local * 0.04})`;
      card.style.pointerEvents = local > 0.9 ? 'auto' : 'none';
    });
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(0.06, 0.24, progress));
  }

  function applyScene(progress, time) {
    const intensity = reducedMotion.matches ? 0.38 : 1;
    const assembly = smooth(0.03, 0.68, progress);
    const network = smooth(0.36, 0.86, progress);
    const finish = smooth(0.72, 1, progress);
    const idleAllowed = motionEnabled && !reducedMotion.matches && progress > 0.975 && performance.now() - lastScrollAt > 180;
    const idle = idleAllowed ? time * 0.000055 : 0;

    sculpture.scale.setScalar(lerp(0.72, 1, assembly));
    sculpture.position.y = lerp(0.5, -0.04, assembly) + (idleAllowed ? Math.sin(time * 0.00045) * 0.025 : 0);
    sculpture.position.z = lerp(-0.7, 0, assembly);
    sculpture.rotation.x = lerp(-0.52, -0.08, assembly) - pointerCurrent.y * 0.55 * intensity;
    sculpture.rotation.y = lerp(-1.15, -0.22, assembly) + pointerCurrent.x * 0.72 * intensity + idle;
    sculpture.rotation.z = lerp(0.22, 0.02, assembly);

    core.scale.setScalar(lerp(0.46, 1, smooth(0.12, 0.52, progress)));
    darkMetal.opacity = lerp(0.35, 1, smooth(0.08, 0.46, progress));
    innerWire.scale.setScalar(lerp(0.72, 1, network));
    wireMaterial.opacity = lerp(0, 0.18, network);

    rings.forEach((ring, index) => {
      const ringProgress = smooth(0.06 + index * 0.055, 0.58 + index * 0.045, progress);
      ring.position.copy(ring.userData.offset).multiplyScalar((1 - ringProgress) * intensity);
      ring.scale.setScalar(lerp(0.72, 1, ringProgress));
      ring.rotation.x = lerp(ring.userData.explodedRotation.x, ring.userData.baseRotation.x, ringProgress);
      ring.rotation.y = lerp(ring.userData.explodedRotation.y, ring.userData.baseRotation.y, ringProgress);
      ring.rotation.z = lerp(ring.userData.explodedRotation.z, ring.userData.baseRotation.z, ringProgress);
      if (idleAllowed) ring.rotation[index % 2 ? 'x' : 'y'] += idle * (index % 2 ? 1.4 : -1.15);
    });

    nodes.scale.setScalar(network);
    nodes.rotation.y = lerp(-0.9, 0, network) - idle * 0.8;
    particleMaterial.opacity = lerp(0, 0.64, network);
    particles.rotation.y = lerp(-0.45, 0.2, finish) + idle * 0.2;
    particles.rotation.x = lerp(0.3, 0, finish);
    pedestal.scale.setScalar(lerp(0.86, 1, finish));
    pedestal.position.y = lerp(-2.55, -2.15, finish);

    camera.position.z = lerp(9.05, 7.4, assembly);
    camera.position.y = lerp(0.34, 0.1, assembly);
    keyLight.intensity = lerp(1.4, 4.2, assembly);
    rimLight.intensity = lerp(10, 48, network);
    lowerGlow.intensity = lerp(6, 40, finish);
    hemisphere.intensity = lerp(0.55, 1.2, assembly);

    setCardProgress(progress);
  }

  function updatePointer(event) {
    if (!motionEnabled || reducedMotion.matches) return;
    const rect = stage.getBoundingClientRect();
    pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
    pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.22;
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
    motionToggle.textContent = motionEnabled ? 'Pause 3D motion' : 'Enable 3D motion';
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
  }

  motionToggle?.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    localStorage.setItem('tbm-3d-motion', motionEnabled ? 'on' : 'off');
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
        end: () => `+=${Math.max(window.innerHeight * 1.18, 880)}`,
        pin: heroGrid,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          targetProgress = self.progress;
          lastScrollAt = performance.now();
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
        start: 'top 82%',
        end: 'bottom 22%',
        scrub: 0.45,
        invalidateOnRefresh: true,
        onUpdate(self) {
          targetProgress = self.progress;
          lastScrollAt = performance.now();
        }
      });
      return () => trigger.kill();
    });
    return true;
  }

  function installNativeFallback() {
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight * 0.35, 1);
      targetProgress = clamp((-rect.top + window.innerHeight * 0.08) / travel, 0, 1);
      lastScrollAt = performance.now();
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
    renderer.setSize(width, height, false);
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
  });

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(rafId);
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('webgl-fallback');
  });

  function frame(time) {
    rafId = requestAnimationFrame(frame);
    if (!pageVisible || !stageVisible) return;
    const easing = reducedMotion.matches ? 0.18 : 0.1;
    currentProgress += (targetProgress - currentProgress) * easing;
    pointerCurrent.lerp(pointerTarget, reducedMotion.matches ? 0.2 : 0.055);
    const effectiveProgress = motionEnabled ? currentProgress : 1;
    applyScene(effectiveProgress, time);
    renderer.render(scene, camera);
  }

  reducedMotion.addEventListener?.('change', () => {
    lastScrollAt = performance.now();
  });

  document.documentElement.classList.add('webgl-ready');
  document.documentElement.classList.remove('webgl-fallback');
  applyScene(0, performance.now());
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(frame);
}
