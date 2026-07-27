import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');
const hero = document.querySelector('.hero-scroll-sequence');
const motionToggle = document.getElementById('motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const HERO_STATE = Object.freeze({
  SUSPENDED: 'suspended',
  PREWARMING: 'prewarming',
  HANDOFF_READY: 'handoff-ready',
  ACTIVE: 'active',
  OFFSCREEN: 'offscreen'
});

if (canvas && stage && hero) initialise();

function initialise() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    console.warn('The V3 armillary could not initialise.', error);
    document.documentElement.classList.add('webgl-fallback');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
  camera.position.set(0, 0.1, 6.25);
  const sculpture = new THREE.Group();
  sculpture.rotation.set(0.18, -0.46, 0.05);
  scene.add(sculpture);

  const coreRadius = 0.89;
  const bronze = new THREE.MeshPhysicalMaterial({
    color: 0x7a4930, metalness: 0.94, roughness: 0.23, clearcoat: 0.28, clearcoatRoughness: 0.18
  });
  const darkBronze = new THREE.MeshStandardMaterial({ color: 0x3f241a, metalness: 0.88, roughness: 0.31 });
  const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x9e6746, metalness: 0.92, roughness: 0.2, emissive: 0x130804, emissiveIntensity: 0.16 });
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0x9b674c, transparent: true, opacity: 0.52, depthWrite: false });
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x060909, metalness: 0.9, roughness: 0.15, clearcoat: 0.78, clearcoatRoughness: 0.11,
    sheen: 0.12, sheenColor: new THREE.Color(0x52625e)
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 96, 96), coreMaterial);
  core.scale.y = 1.02;
  sculpture.add(core);

  const rings = new THREE.Group();
  sculpture.add(rings);
  const ringDefinitions = [
    { radius: 1.52, tube: 0.045, rotation: [0.18, 0.35, 0.63], material: bronze },
    { radius: 1.78, tube: 0.037, rotation: [1.1, -0.22, -0.38], material: bronze },
    { radius: 2.04, tube: 0.027, rotation: [0.52, 1.07, 0.08], material: darkBronze },
    { radius: 2.26, tube: 0.017, rotation: [-0.28, 0.18, 0.92], material: darkBronze }
  ];
  ringDefinitions.forEach(definition => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(definition.radius, definition.tube, 12, 192), definition.material);
    ring.rotation.set(...definition.rotation);
    rings.add(ring);
  });

  const network = createIrregularNetwork(1.3, wireMaterial);
  network.rotation.set(0.23, -0.41, 0.16);
  sculpture.add(network);
  const nodes = createNodes(network.userData.points, nodeMaterial);
  network.add(nodes);
  const particles = createParticles();
  scene.add(particles);

  scene.add(new THREE.HemisphereLight(0x819696, 0x120b08, 1.15));
  const key = new THREE.DirectionalLight(0xf0c39b, 2.7);
  key.position.set(-3.8, 4.2, 5.4);
  scene.add(key);
  const rim = new THREE.PointLight(0xb56c43, 5.3, 9, 2);
  rim.position.set(3.3, -1.8, 3.1);
  scene.add(rim);
  const fill = new THREE.PointLight(0x446d70, 2.3, 8, 2);
  fill.position.set(-2.6, -0.5, -2.2);
  scene.add(fill);

  let lifecycle = document.documentElement.dataset.tbmHeroLifecycle || HERO_STATE.SUSPENDED;
  let stageVisible = false;
  let pageVisible = !document.hidden;
  let motionEnabled = !reducedMotion.matches;
  let rafId = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const handoffPose = new THREE.Euler(0.18, -0.46, 0.05);

  function shouldRender() {
    return pageVisible && stageVisible && lifecycle !== HERO_STATE.SUSPENDED && lifecycle !== HERO_STATE.OFFSCREEN;
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.35 : 1.65));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 480 ? 6.8 : 6.25;
    camera.updateProjectionMatrix();
    render();
  }

  function render() { renderer.render(scene, camera); }

  function applyPose(delta) {
    const handoff = Number.parseFloat(document.documentElement.style.getPropertyValue('--tbm-handoff-progress')) || 0;
    const activeMotion = motionEnabled && lifecycle === HERO_STATE.ACTIVE;
    const prewarmMotion = lifecycle === HERO_STATE.PREWARMING || lifecycle === HERO_STATE.HANDOFF_READY;
    if (activeMotion || prewarmMotion) elapsed += delta;
    const ambient = activeMotion ? 1 : handoff * 0.18;
    pointer.lerp(pointerTarget, activeMotion ? 0.055 : 0.025);
    sculpture.rotation.x = handoffPose.x + pointer.y * 0.16 + Math.sin(elapsed * 0.43) * 0.035 * ambient;
    sculpture.rotation.y = handoffPose.y + pointer.x * 0.22 + Math.sin(elapsed * 0.31) * 0.09 * ambient;
    sculpture.rotation.z = handoffPose.z + Math.cos(elapsed * 0.29) * 0.022 * ambient;
    rings.rotation.y = Math.sin(elapsed * 0.22) * 0.12 * ambient;
    network.rotation.y = -elapsed * 0.065 * ambient;
    particles.rotation.y = elapsed * 0.018 * ambient;
  }

  function frame(time) {
    rafId = 0;
    if (!shouldRender()) return;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    applyPose(delta);
    render();
    if (motionEnabled || lifecycle === HERO_STATE.PREWARMING || lifecycle === HERO_STATE.HANDOFF_READY) rafId = requestAnimationFrame(frame);
  }

  function requestFrame() {
    if (!rafId && shouldRender()) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  function setLifecycle(nextState) {
    lifecycle = Object.values(HERO_STATE).includes(nextState) ? nextState : HERO_STATE.SUSPENDED;
    stage.dataset.lifecycle = lifecycle;
    if (lifecycle === HERO_STATE.SUSPENDED || lifecycle === HERO_STATE.OFFSCREEN) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
    requestFrame();
  }

  window.addEventListener('tbm:hero-lifecycle', event => setLifecycle(event.detail?.state));
  const visibilityObserver = new IntersectionObserver(entries => {
    stageVisible = entries[0]?.isIntersecting ?? false;
    if (stageVisible) requestFrame();
    else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }, { threshold: 0.01 });
  visibilityObserver.observe(stage);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; if (pageVisible) requestFrame(); });
  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointerTarget.set(((event.clientX - rect.left) / rect.width - 0.5), -((event.clientY - rect.top) / rect.height - 0.5));
    requestFrame();
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { pointerTarget.set(0, 0); });
  motionToggle?.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    motionToggle.textContent = motionEnabled ? 'Pause 3D motion' : 'Resume 3D motion';
    if (motionEnabled) requestFrame(); else render();
  });
  reducedMotion.addEventListener?.('change', event => {
    motionEnabled = !event.matches;
    if (motionToggle) { motionToggle.disabled = event.matches; motionToggle.setAttribute('aria-pressed', String(motionEnabled)); }
    if (motionEnabled) requestFrame(); else render();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    if (rafId) cancelAnimationFrame(rafId);
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('webgl-fallback');
  });

  resize();
  setLifecycle(lifecycle);
  document.documentElement.classList.add('webgl-ready');
  document.documentElement.classList.remove('webgl-fallback');
  window.__tbmHeroV3 = { getState: () => ({ lifecycle, stageVisible, pageVisible, motionEnabled, rendering: Boolean(rafId) }) };
  window.addEventListener('pagehide', () => {
    if (rafId) cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    renderer.dispose();
    delete window.__tbmHeroV3;
  }, { once: true });
}

function createIrregularNetwork(radius, material) {
  const group = new THREE.Group();
  const points = [];
  const rings = 7;
  const segments = 12;
  for (let ring = 0; ring < rings; ring += 1) {
    const theta = Math.PI * (ring + 1) / (rings + 1);
    for (let segment = 0; segment < segments; segment += 1) {
      const phi = Math.PI * 2 * segment / segments + Math.sin(ring * 5 + segment) * 0.11;
      const variation = 1 + Math.sin(segment * 2.3 + ring) * 0.055;
      points.push(new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi) * radius * variation,
        Math.cos(theta) * radius * variation,
        Math.sin(theta) * Math.sin(phi) * radius * variation
      ));
    }
  }
  const positions = [];
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const index = ring * segments + segment;
      const right = ring * segments + (segment + 1) % segments;
      positions.push(...points[index].toArray(), ...points[right].toArray());
      if (ring < rings - 1) positions.push(...points[index].toArray(), ...points[index + segments].toArray());
      if (ring < rings - 1 && segment % 2 === ring % 2) positions.push(...points[index].toArray(), ...points[index + segments + (segment + 1) % segments - segment].toArray());
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  group.add(new THREE.LineSegments(geometry, material));
  group.userData.points = points.filter((_, index) => index % 3 === 0);
  return group;
}

function createNodes(points, material) {
  const geometry = new THREE.SphereGeometry(0.034, 12, 12);
  const mesh = new THREE.InstancedMesh(geometry, material, points.length);
  const matrix = new THREE.Matrix4();
  points.forEach((point, index) => { matrix.makeTranslation(point.x, point.y, point.z); mesh.setMatrixAt(index, matrix); });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createParticles() {
  const count = 72;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 2.0 + ((index * 37) % 100) / 100 * 2.7;
    const angle = index * 2.39996;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = ((index * 29) % 100) / 100 * 3.8 - 1.9;
    positions[index * 3 + 2] = Math.sin(angle) * radius - 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xd08046, size: 0.018, transparent: true, opacity: 0.48, depthWrite: false }));
}
