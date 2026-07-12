const THREE_URL = 'https://esm.sh/three@0.180.0';
const MAX_RENDER_PIXELS = 3_200_000;
const MOBILE_RENDER_PIXELS = 1_800_000;
const SCULPTURE_DIAMETER = 4.42;

export async function createForgeScene({ canvas, viewport, target, reducedMotion = false }) {
  if (!canvas || !viewport || !target) {
    throw new Error('Forge scene requires canvas, viewport and target elements.');
  }

  const THREE = await import(THREE_URL);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio <= 1.5,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0, 8.15);

  const root = new THREE.Group();
  scene.add(root);

  const bronze = new THREE.MeshPhysicalMaterial({
    color: 0xb96716,
    emissive: 0x361300,
    emissiveIntensity: 0.18,
    metalness: 1,
    roughness: 0.20,
    clearcoat: 1,
    clearcoatRoughness: 0.14
  });

  const brightBronze = bronze.clone();
  brightBronze.color.setHex(0xe0a13a);
  brightBronze.emissive.setHex(0x5a2200);
  brightBronze.emissiveIntensity = 0.30;
  brightBronze.roughness = 0.16;

  const blackMetal = new THREE.MeshPhysicalMaterial({
    color: 0x020302,
    metalness: 0.72,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.10,
    reflectivity: 0.72
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x8d5f1c,
    wireframe: true,
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(1.24, reducedMotion ? 48 : 72, reducedMotion ? 48 : 72), blackMetal);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, reducedMotion ? 2 : 3), wireMaterial);
  root.add(core, wire);

  const ringSpecs = [
    { radius: 1.48, tube: 0.028, rotation: [1.08, 0.05, 0.22], speed: 0.24, bright: true },
    { radius: 1.66, tube: 0.024, rotation: [0.08, 1.12, 0.57], speed: -0.19, bright: true },
    { radius: 1.84, tube: 0.021, rotation: [0.72, 0.50, 1.15], speed: 0.16, bright: false },
    { radius: 2.02, tube: 0.018, rotation: [1.33, 0.79, 0.10], speed: -0.13, bright: false },
    { radius: 2.18, tube: 0.016, rotation: [0.42, 1.29, 0.77], speed: 0.105, bright: false }
  ];

  const rings = ringSpecs.map((spec, index) => {
    const material = (spec.bright ? brightBronze : bronze).clone();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 18, reducedMotion ? 180 : 260),
      material
    );
    ring.rotation.set(...spec.rotation);
    ring.userData = {
      baseX: spec.rotation[0],
      baseY: spec.rotation[1],
      baseZ: spec.rotation[2],
      speed: spec.speed,
      phase: index * 1.31
    };
    root.add(ring);
    return ring;
  });

  const nodeGeometry = new THREE.SphereGeometry(0.055, 18, 18);
  const nodeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9a5318,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    emissive: 0x250b00,
    emissiveIntensity: 0.08
  });
  const nodeCoordinates = [
    [1.28, 0.50, 0.62],
    [-1.18, 0.72, 0.54],
    [0.78, -1.02, 0.74],
    [-0.60, -1.16, 0.70],
    [0.22, 1.23, -0.72],
    [-1.02, -0.20, -0.96]
  ];
  const nodes = nodeCoordinates.map((position, index) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(...position);
    node.scale.setScalar(index < 2 ? 1.18 : 1);
    root.add(node);
    return node;
  });

  const glintTexture = createGlintTexture(THREE);
  const glintConfigs = [
    { speed: 0.86, phase: 0.2, xRadius: 0.74, yRadius: 0.56, yPhase: 0.5, scale: [0.17, 0.62] },
    { speed: 1.03, phase: 2.25, xRadius: 0.62, yRadius: 0.70, yPhase: 1.8, scale: [0.14, 0.53] },
    { speed: 1.17, phase: 4.15, xRadius: 0.68, yRadius: 0.60, yPhase: 3.2, scale: [0.15, 0.57] }
  ];
  const glints = glintConfigs.map(config => {
    const material = new THREE.SpriteMaterial({
      map: glintTexture,
      color: 0xffdf96,
      transparent: true,
      opacity: 0.78,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(config.scale[0], config.scale[1], 1);
    root.add(sprite);
    return { sprite, material, ...config };
  });

  const particles = createParticles(THREE, reducedMotion ? 90 : window.innerWidth < 900 ? 140 : 240);
  root.add(particles.points);

  const hemisphere = new THREE.HemisphereLight(0xf5d8a0, 0x120804, 0.92);
  const key = new THREE.PointLight(0xffd28a, 16, 18, 2);
  key.position.set(2.1, 1.7, 3.2);
  const rim = new THREE.PointLight(0xff7b16, 22, 22, 2);
  rim.position.set(-2.8, 1.5, 1.6);
  const lower = new THREE.PointLight(0xb84b08, 13, 16, 2);
  lower.position.set(0.4, -2.7, 2.3);
  const back = new THREE.PointLight(0x6d2604, 8, 18, 2);
  back.position.set(2.6, 1.1, -2.2);
  scene.add(hemisphere, key, rim, lower, back);

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const targetWorld = new THREE.Vector3();
  let scaleForTarget = 1;
  let ambientEnabled = true;
  let phase = 0;
  let lastTime = performance.now();
  let frameId = 0;
  let pageVisible = !document.hidden;
  let viewportVisible = true;
  let destroyed = false;

  function createGlintTexture(Three) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(64, 256, 2, 64, 256, 230);
    gradient.addColorStop(0, 'rgba(255,255,248,1)');
    gradient.addColorStop(0.10, 'rgba(255,226,158,.92)');
    gradient.addColorStop(0.33, 'rgba(236,157,45,.30)');
    gradient.addColorStop(1, 'rgba(175,75,5,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 512);
    const texture = new Three.CanvasTexture(c);
    texture.colorSpace = Three.SRGBColorSpace;
    return texture;
  }

  function createParticles(Three, count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.2 + Math.random() * 1.7;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.0;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius * 0.78;
    }
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));
    const material = new Three.PointsMaterial({
      color: 0xd89a37,
      size: 0.015,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      sizeAttenuation: true
    });
    return { points: new Three.Points(geometry, material), geometry, material };
  }

  function screenPointToWorld(x, y, bounds) {
    const ndcX = ((x - bounds.left) / bounds.width) * 2 - 1;
    const ndcY = -(((y - bounds.top) / bounds.height) * 2 - 1);
    const projected = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const direction = projected.sub(camera.position).normalize();
    const distance = -camera.position.z / direction.z;
    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function calculateTarget() {
    const canvasBounds = canvas.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    if (!canvasBounds.width || !canvasBounds.height || !targetBounds.width || !targetBounds.height) return;
    targetWorld.copy(screenPointToWorld(
      targetBounds.left + targetBounds.width / 2,
      targetBounds.top + targetBounds.height / 2,
      canvasBounds
    ));
    const worldHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const worldPerPixel = worldHeight / canvasBounds.height;
    const desiredPixels = Math.min(targetBounds.width, targetBounds.height) * 0.96;
    scaleForTarget = THREE.MathUtils.clamp((desiredPixels * worldPerPixel) / SCULPTURE_DIAMETER, 0.88, 1.12);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const cap = window.innerWidth < 900 ? MOBILE_RENDER_PIXELS : MAX_RENDER_PIXELS;
    const ratioByBudget = Math.sqrt(cap / (width * height));
    renderer.setPixelRatio(Math.max(0.7, Math.min(window.devicePixelRatio || 1, 1.5, ratioByBudget)));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    calculateTarget();
  }

  function updateGlints(localPhase) {
    const sphereRadius = 1.255;
    glints.forEach((glint, index) => {
      const a = localPhase * glint.speed + glint.phase;
      const x = Math.cos(a) * glint.xRadius;
      const y = Math.sin(a * 1.18 + glint.yPhase) * glint.yRadius;
      const z = Math.sqrt(Math.max(0.18, sphereRadius * sphereRadius - x * x - y * y));
      glint.sprite.position.set(x, y, z + 0.02);
      glint.material.opacity = 0.62 + Math.sin(a * 0.7 + index) * 0.12;
      glint.sprite.scale.set(glint.scale[0], glint.scale[1], 1);
    });
  }

  function applyScene(delta) {
    if (ambientEnabled) phase += delta * (reducedMotion ? 0.32 : 1);
    pointerCurrent.lerp(pointerTarget, reducedMotion ? 0.10 : 0.055);

    root.position.copy(targetWorld);
    root.scale.setScalar(scaleForTarget);
    root.rotation.x = -0.10 - pointerCurrent.y * 0.15 + Math.sin(phase * 0.18) * 0.006;
    root.rotation.y = -0.22 + pointerCurrent.x * 0.22 + phase * 0.040;
    root.rotation.z = Math.sin(phase * 0.16) * 0.006;

    core.rotation.y = -phase * 0.055;
    wire.rotation.x = phase * 0.045;
    wire.rotation.y = -phase * 0.075;

    rings.forEach((ring, index) => {
      const data = ring.userData;
      ring.rotation.x = data.baseX + Math.sin(phase * (0.26 + index * 0.025) + data.phase) * 0.024;
      ring.rotation.y = data.baseY + phase * data.speed;
      ring.rotation.z = data.baseZ + Math.cos(phase * (0.22 + index * 0.02) + data.phase) * 0.020;
    });

    nodes.forEach((node, index) => {
      const base = index < 2 ? 1.18 : 1;
      node.scale.setScalar(base * (1 + Math.sin(phase * 0.72 + index) * 0.025));
    });

    particles.points.rotation.y = phase * 0.018;
    particles.points.rotation.x = Math.sin(phase * 0.11) * 0.025;
    updateGlints(phase);
  }

  function render(now) {
    if (destroyed) return;
    frameId = requestAnimationFrame(render);
    const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
    lastTime = now;
    if (!pageVisible || !viewportVisible) return;
    applyScene(delta);
    renderer.render(scene, camera);
  }

  function setProgress() {
    applyScene(0);
  }

  function setPointer(x, y) {
    pointerTarget.set(
      THREE.MathUtils.clamp(x, -1, 1),
      THREE.MathUtils.clamp(y, -1, 1)
    );
  }

  function resetPointer() { pointerTarget.set(0, 0); }
  function setAmbientEnabled(enabled) {
    ambientEnabled = Boolean(enabled);
    if (!ambientEnabled) resetPointer();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resizeObserver.observe(target);
  const intersectionObserver = new IntersectionObserver(entries => {
    viewportVisible = entries[0]?.isIntersecting ?? true;
    lastTime = performance.now();
  }, { threshold: 0.01 });
  intersectionObserver.observe(viewport);
  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    lastTime = performance.now();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const onContextLost = event => {
    event.preventDefault();
    document.documentElement.classList.add('forge-fallback-active');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    scene.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
      else object.material?.dispose?.();
    });
    glintTexture?.dispose?.();
    renderer.dispose();
  }

  resize();
  applyScene(0);
  renderer.render(scene, camera);
  frameId = requestAnimationFrame(render);

  return { setProgress, setPointer, resetPointer, setAmbientEnabled, resize, destroy };
}
