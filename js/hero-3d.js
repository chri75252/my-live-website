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
  renderer.toneMappingExposure = 1.22;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.08, 7.25);

  const sculpture = new THREE.Group();
  scene.add(sculpture);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd59a32,
    metalness: 1,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: 0x241003,
    emissiveIntensity: 0.4
  });

  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x111311,
    metalness: 0.94,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    transparent: true,
    opacity: 1
  });

  const edgeGold = new THREE.MeshStandardMaterial({
    color: 0xf0bf58,
    metalness: 1,
    roughness: 0.12,
    emissive: 0x3a1903,
    emissiveIntensity: 0.78
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 64), darkMetal);
  sculpture.add(core);

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xa76816,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  const innerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.17, 2), wireMaterial);
  sculpture.add(innerWire);

  const ringData = [
    [1.55, 0.025, 1.15, 0.00, 0.18, 0.23],
    [1.73, 0.021, 0.08, 1.18, 0.63, -0.18],
    [1.91, 0.018, 0.77, 0.54, 1.22, 0.15],
    [2.10, 0.016, 1.42, 0.83, 0.10, -0.12],
    [2.28, 0.014, 0.48, 1.38, 0.82, 0.10]
  ];

  const revealOffsets = [
    new THREE.Vector3(-0.48, 0.3, -0.22),
    new THREE.Vector3(0.42, -0.24, 0.2),
    new THREE.Vector3(-0.32, -0.4, -0.12),
    new THREE.Vector3(0.36, 0.38, 0.08),
    new THREE.Vector3(0.08, -0.08, -0.48)
  ];

  const rings = ringData.map(([radius, tube, x, y, z, spinSpeed], index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 18, 220),
      index < 2 ? edgeGold : gold
    );
    ring.userData.baseRotation = new THREE.Euler(x, y, z);
    ring.userData.revealRotation = new THREE.Euler(
      x + (index % 2 ? -0.34 : 0.32),
      y + (index % 2 ? 0.28 : -0.3),
      z + (index - 2) * 0.08
    );
    ring.userData.offset = revealOffsets[index];
    ring.userData.spinSpeed = spinSpeed;
    ring.userData.phaseOffset = index * 1.37;
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
    size: 0.019,
    transparent: true,
    opacity: 0.25,
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

  const hemisphere = new THREE.HemisphereLight(0xffe4aa, 0x101411, 1.02);
  scene.add(hemisphere);
  const keyLight = new THREE.DirectionalLight(0xffd27c, 3.8);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xc97916, 38, 14, 1.8);
  rimLight.position.set(-3, 0.5, 3.5);
  scene.add(rimLight);
  const lowerGlow = new THREE.PointLight(0xf1a730, 30, 10, 2);
  lowerGlow.position.set(0, -3, 2);
  scene.add(lowerGlow);

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

  try {
    motionEnabled = localStorage.getItem('tbm-3d-motion-v2') !== 'off';
  } catch {
    motionEnabled = true;
  }

  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (min, max, value) => {
    const x = clamp((value - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
  };

  function setCardProgress(progress, scrollProgress) {
    cards.forEach((card, index) => {
      const local = smooth(0.22 + index * 0.1, 0.48 + index * 0.1, progress);
      card.style.opacity = local.toFixed(3);
      card.style.transform = `translate3d(0, ${(1 - local) * 20}px, 0) scale(${0.96 + local * 0.04})`;
      card.style.pointerEvents = local > 0.9 ? 'auto' : 'none';
    });
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(0.08, 0.3, scrollProgress));
  }

  function applyScene(scrollProgress, phase) {
    // Keep the sculpture at a premium, near-final scale from the first frame.
    // Scrolling adds the last 30% of assembly, camera push and card choreography.
    const progress = 0.7 + clamp(scrollProgress, 0, 1) * 0.3;
    const accessibilityFactor = reducedMotion.matches ? 0.3 : 1;
    const motionFactor = motionEnabled ? accessibilityFactor : 0;
    const assembly = smooth(0.02, 0.78, progress);
    const network = smooth(0.2, 0.82, progress);
    const finish = smooth(0.62, 1, progress);

    const breathe = Math.sin(phase * 0.72) * 0.024 * motionFactor;
    const slowOrbit = phase * 0.105 * motionFactor;

    sculpture.scale.setScalar(lerp(1.02, 1.1, assembly) + breathe);
    sculpture.position.y = lerp(0.04, -0.08, assembly) + Math.sin(phase * 0.48) * 0.028 * motionFactor;
    sculpture.position.z = lerp(0.02, -0.12, assembly);
    sculpture.rotation.x = lerp(-0.18, -0.08, assembly) - pointerCurrent.y * 0.62 * accessibilityFactor + Math.sin(phase * 0.37) * 0.035 * motionFactor;
    sculpture.rotation.y = lerp(-0.42, -0.2, assembly) + pointerCurrent.x * 0.82 * accessibilityFactor + slowOrbit;
    sculpture.rotation.z = lerp(0.08, 0.02, assembly) + Math.sin(phase * 0.29) * 0.018 * motionFactor;

    const corePulse = 1 + Math.sin(phase * 1.15) * 0.022 * motionFactor;
    core.scale.setScalar(lerp(0.94, 1, smooth(0.02, 0.5, progress)) * corePulse);
    core.rotation.y = -phase * 0.12 * motionFactor;
    darkMetal.opacity = lerp(0.78, 1, smooth(0.02, 0.45, progress));

    innerWire.scale.setScalar(lerp(0.94, 1.02, network));
    innerWire.rotation.x = phase * 0.08 * motionFactor;
    innerWire.rotation.y = -phase * 0.13 * motionFactor;
    wireMaterial.opacity = lerp(0.1, 0.2, network);

    rings.forEach((ring, index) => {
      const ringProgress = smooth(0.02 + index * 0.045, 0.62 + index * 0.04, progress);
      const revealAmount = 1 - ringProgress;
      ring.position.copy(ring.userData.offset).multiplyScalar(revealAmount);
      ring.scale.setScalar(lerp(0.96, 1, ringProgress));

      const base = ring.userData.baseRotation;
      const reveal = ring.userData.revealRotation;
      const phaseOffset = ring.userData.phaseOffset;
      const spin = phase * ring.userData.spinSpeed * motionFactor;
      ring.rotation.x = lerp(reveal.x, base.x, ringProgress) + Math.sin(phase * (0.5 + index * 0.04) + phaseOffset) * 0.09 * motionFactor;
      ring.rotation.y = lerp(reveal.y, base.y, ringProgress) + spin;
      ring.rotation.z = lerp(reveal.z, base.z, ringProgress) + Math.cos(phase * (0.42 + index * 0.035) + phaseOffset) * 0.065 * motionFactor;
    });

    nodes.scale.setScalar(lerp(0.72, 1, network));
    nodes.rotation.y = -phase * 0.22 * motionFactor + lerp(-0.3, 0, network);
    nodes.rotation.x = Math.sin(phase * 0.31) * 0.08 * motionFactor;

    particleMaterial.opacity = lerp(0.22, 0.68, network);
    particles.rotation.y = phase * 0.035 * motionFactor + lerp(-0.18, 0.16, finish);
    particles.rotation.x = Math.sin(phase * 0.17) * 0.07 * motionFactor + lerp(0.12, 0, finish);

    pedestal.scale.setScalar(lerp(0.96, 1.02, finish));
    pedestal.position.y = lerp(-2.28, -2.15, finish);

    camera.position.z = lerp(7.25, 6.65, assembly);
    camera.position.y = lerp(0.14, 0.07, assembly);

    const lightPulse = Math.sin(phase * 1.05) * 3.5 * motionFactor;
    keyLight.intensity = lerp(3.6, 4.5, assembly) + lightPulse * 0.12;
    rimLight.intensity = lerp(34, 50, network) + lightPulse;
    lowerGlow.intensity = lerp(26, 42, finish) + lightPulse * 0.7;
    hemisphere.intensity = lerp(0.95, 1.22, assembly);

    setCardProgress(progress, scrollProgress);
  }

  function updatePointer(event) {
    if (!motionEnabled) return;
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
    motionToggle.textContent = motionEnabled ? 'Pause ambient motion' : 'Resume ambient motion';
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    document.documentElement.dataset.heroMotion = motionEnabled ? 'running' : 'paused';
  }

  motionToggle?.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    try {
      localStorage.setItem('tbm-3d-motion-v2', motionEnabled ? 'on' : 'off');
    } catch {
      // Storage may be unavailable in strict privacy modes; animation still works.
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
    const deltaSeconds = Math.min(Math.max((time - lastFrameTime) / 1000, 0), 0.05);
    lastFrameTime = time;
    if (!pageVisible || !stageVisible) return;

    if (motionEnabled) motionPhase += deltaSeconds;
    const easing = reducedMotion.matches ? 0.16 : 0.1;
    currentProgress += (targetProgress - currentProgress) * easing;
    pointerCurrent.lerp(pointerTarget, reducedMotion.matches ? 0.12 : 0.055);
    applyScene(currentProgress, motionPhase);
    renderer.render(scene, camera);
  }

  reducedMotion.addEventListener?.('change', updateMotionButton);

  document.documentElement.classList.add('webgl-ready');
  document.documentElement.classList.remove('webgl-fallback');
  applyScene(0, motionPhase);
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(frame);
}
