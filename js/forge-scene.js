const MODULES = {
  three: 'https://esm.sh/three@0.180.0',
  roomEnvironment: 'https://esm.sh/three@0.180.0/examples/jsm/environments/RoomEnvironment.js'
};

const MAX_RENDER_PIXELS = 3_800_000;
const MOBILE_RENDER_PIXELS = 2_200_000;
const OBJECT_DIAMETER = 4.34;

/**
 * Create the procedural Forge Gate scene.
 *
 * The scene deliberately contains:
 * - one glossy black globe;
 * - one bronze wireframe;
 * - five dark-bronze armillary rings;
 * - six non-glowing bronze nodes;
 * - exactly three surface-bound light reflections;
 * - a lightweight particle field;
 * - temporary forged arc fragments used only by the intro.
 *
 * It deliberately does not contain comet heads, comet trails, a pedestal ring,
 * a Fresnel shell, velocity-driven acceleration or broad bloom.
 */
export async function createForgeScene({
  canvas,
  viewport,
  target,
  reducedMotion = false
}) {
  if (!canvas || !viewport || !target) {
    throw new Error('Forge scene requires canvas, viewport and target elements.');
  }

  const [THREE, roomModule] = await Promise.all([
    import(MODULES.three),
    import(MODULES.roomEnvironment)
  ]);
  const { RoomEnvironment } = roomModule;

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
  renderer.toneMappingExposure = 1.03;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 0, 8.5);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(room, 0.035);
  scene.environment = environmentTarget.texture;
  room.dispose?.();
  pmrem.dispose();

  const root = new THREE.Group();
  scene.add(root);

  const bronzeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x71350e,
    emissive: 0x130600,
    emissiveIntensity: 0.04,
    metalness: 1,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.25,
    transparent: true,
    opacity: 0
  });

  const bronzeHighlightMaterial = bronzeMaterial.clone();
  bronzeHighlightMaterial.color.setHex(0x9e5217);
  bronzeHighlightMaterial.roughness = 0.18;
  bronzeHighlightMaterial.envMapIntensity = 1.45;

  const darkMetalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x030504,
    metalness: 0.94,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: 0
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x8d5e1d,
    wireframe: true,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, reducedMotion ? 44 : 64, reducedMotion ? 44 : 64),
    darkMetalMaterial
  );
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.43, reducedMotion ? 2 : 3),
    wireMaterial
  );
  root.add(core, wire);

  const ringSpecs = [
    { radius: 1.47, tube: 0.024, rotation: [1.08, 0.05, 0.22], speed: 0.17 },
    { radius: 1.64, tube: 0.021, rotation: [0.08, 1.12, 0.57], speed: -0.145 },
    { radius: 1.82, tube: 0.019, rotation: [0.72, 0.50, 1.15], speed: 0.125 },
    { radius: 2.00, tube: 0.017, rotation: [1.33, 0.79, 0.10], speed: -0.105 },
    { radius: 2.14, tube: 0.015, rotation: [0.42, 1.29, 0.77], speed: 0.088 }
  ];

  const ringOffsets = [
    [-0.72, 0.36, -0.25],
    [0.65, -0.31, 0.20],
    [-0.48, -0.52, -0.18],
    [0.51, 0.47, 0.12],
    [0.10, -0.12, -0.64]
  ];

  const rings = ringSpecs.map((spec, index) => {
    const material = (index < 2 ? bronzeHighlightMaterial : bronzeMaterial).clone();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 16, reducedMotion ? 150 : 220),
      material
    );
    ring.userData = {
      baseX: spec.rotation[0],
      baseY: spec.rotation[1],
      baseZ: spec.rotation[2],
      startX: spec.rotation[0] + (index % 2 ? -0.62 : 0.54),
      startY: spec.rotation[1] + (index % 2 ? 0.48 : -0.52),
      startZ: spec.rotation[2] + (index - 2) * 0.16,
      offsetX: ringOffsets[index][0],
      offsetY: ringOffsets[index][1],
      offsetZ: ringOffsets[index][2],
      speed: spec.speed,
      phase: index * 1.27
    };
    root.add(ring);
    return ring;
  });

  /* Six restrained, non-glowing bronze nodes. */
  const nodeGroup = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.043, 16, 16);
  const nodeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x734013,
    metalness: 1,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.15,
    transparent: true,
    opacity: 0
  });
  const nodeCoordinates = [
    [1.30, 0.42, 0.49],
    [-1.18, 0.66, 0.55],
    [0.73, -1.01, 0.77],
    [-0.54, -1.18, 0.66],
    [0.18, 1.23, -0.72],
    [-1.05, -0.18, -0.98]
  ];
  const nodes = nodeCoordinates.map((coordinate, index) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(...coordinate);
    node.scale.setScalar(index < 2 ? 1.18 : 1);
    nodeGroup.add(node);
    return node;
  });
  root.add(nodeGroup);

  /* Exactly three elongated highlights constrained to the globe surface. */
  const glintTexture = createGlintTexture(THREE);
  const glintConfigs = [
    { speed: 0.72, phase: 0.15, polar: 1.02, polarSwing: 0.24, rotation: -0.28 },
    { speed: 0.88, phase: 2.25, polar: 1.54, polarSwing: 0.18, rotation: 0.18 },
    { speed: 1.04, phase: 4.32, polar: 2.02, polarSwing: 0.22, rotation: 0.36 }
  ];
  const glints = glintConfigs.map(config => {
    const material = new THREE.SpriteMaterial({
      map: glintTexture,
      color: 0xffe4a8,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.20, 0.68, 1);
    sprite.material.rotation = config.rotation;
    root.add(sprite);
    return { sprite, material, ...config };
  });

  /* Temporary segmented arcs used only during the opening Forge Gate state. */
  const gateGroup = new THREE.Group();
  const gateFragments = [];
  const fragmentCount = reducedMotion ? 6 : 10;
  for (let index = 0; index < fragmentCount; index += 1) {
    const radius = 2.28 + (index % 3) * 0.10;
    const arc = 0.34 + (index % 4) * 0.09;
    const material = bronzeHighlightMaterial.clone();
    material.emissive.setHex(0x3b1300);
    material.emissiveIntensity = 0.16;
    material.opacity = 0;
    const fragment = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.026 + (index % 2) * 0.007, 12, 72, arc),
      material
    );
    const azimuth = (index / fragmentCount) * Math.PI * 2;
    fragment.rotation.set(
      0.18 + (index % 3) * 0.33,
      0.22 + (index % 4) * 0.27,
      azimuth
    );
    fragment.userData = {
      baseX: fragment.rotation.x,
      baseY: fragment.rotation.y,
      baseZ: fragment.rotation.z,
      startZ: fragment.rotation.z - 0.62 - index * 0.035,
      delay: index / fragmentCount
    };
    gateGroup.add(fragment);
    gateFragments.push(fragment);
  }
  scene.add(gateGroup);

  const particles = createParticleField(THREE, reducedMotion ? 70 : window.innerWidth < 900 ? 110 : 190);
  scene.add(particles.points);

  const hemisphere = new THREE.HemisphereLight(0xf3d6a0, 0x160b03, 0.72);
  const keyLight = new THREE.DirectionalLight(0xffd49a, 2.15);
  keyLight.position.set(4.5, 5.5, 5.8);
  const rimLight = new THREE.PointLight(0xd77a1c, 18, 18, 2);
  rimLight.position.set(-3.1, 1.3, 3.2);
  const fillLight = new THREE.PointLight(0x8f4b12, 8, 15, 2);
  fillLight.position.set(2.4, -2.1, 3.0);
  scene.add(hemisphere, keyLight, rimLight, fillLight);

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const targetWorld = new THREE.Vector3();
  const centreWorld = new THREE.Vector3(0, -0.03, 0);

  let revealProgress = reducedMotion ? 1 : 0;
  let ambientEnabled = true;
  let ambientPhase = 0;
  let finalScale = 0.94;
  let lastTime = performance.now();
  let frameId = 0;
  let pageVisible = !document.hidden;
  let viewportVisible = true;
  let destroyed = false;

  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (start, end, value) => {
    const normal = clamp((value - start) / (end - start), 0, 1);
    return normal * normal * (3 - 2 * normal);
  };

  function createGlintTexture(Three) {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 128;
    textureCanvas.height = 512;
    const context = textureCanvas.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(64, 256, 0, 64, 256, 220);
    gradient.addColorStop(0, 'rgba(255,255,246,1)');
    gradient.addColorStop(0.12, 'rgba(255,229,169,.9)');
    gradient.addColorStop(0.38, 'rgba(233,160,57,.34)');
    gradient.addColorStop(1, 'rgba(188,92,13,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 512);
    const texture = new Three.CanvasTexture(textureCanvas);
    texture.colorSpace = Three.SRGBColorSpace;
    return texture;
  }

  function createParticleField(Three, count) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.4 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 4.6;
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = height;
      positions[index * 3 + 2] = Math.sin(theta) * radius * 0.78;
    }
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));
    const material = new Three.PointsMaterial({
      color: 0xc88024,
      size: 0.018,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true
    });
    return { points: new Three.Points(geometry, material), geometry, material };
  }

  function screenPointToWorld(x, y, canvasBounds) {
    const ndcX = ((x - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    const ndcY = -(((y - canvasBounds.top) / canvasBounds.height) * 2 - 1);
    const projected = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const direction = projected.sub(camera.position).normalize();
    const distance = -camera.position.z / direction.z;
    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function calculateTarget() {
    const canvasBounds = canvas.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    if (!canvasBounds.width || !canvasBounds.height || !targetBounds.width || !targetBounds.height) return;

    const centreX = targetBounds.left + targetBounds.width / 2;
    const centreY = targetBounds.top + targetBounds.height / 2;
    targetWorld.copy(screenPointToWorld(centreX, centreY, canvasBounds));

    const visibleWorldHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const worldPerPixel = visibleWorldHeight / canvasBounds.height;
    const desiredPixels = Math.min(targetBounds.width, targetBounds.height) * 0.88;
    finalScale = clamp((desiredPixels * worldPerPixel) / OBJECT_DIAMETER, 0.72, 1.02);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const pixelCap = window.innerWidth < 900 ? MOBILE_RENDER_PIXELS : MAX_RENDER_PIXELS;
    const pixelRatioByBudget = Math.sqrt(pixelCap / (width * height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, pixelRatioByBudget);

    renderer.setPixelRatio(Math.max(0.65, pixelRatio));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    calculateTarget();
  }

  function updateSurfaceGlints(phase, visibility) {
    const radius = 1.238;
    glints.forEach(glint => {
      const longitude = phase * glint.speed + glint.phase;
      const polar = glint.polar + Math.sin(longitude * 0.72) * glint.polarSwing;
      const sinPolar = Math.sin(polar);
      const x = radius * sinPolar * Math.cos(longitude);
      const y = radius * Math.cos(polar);
      const z = radius * sinPolar * Math.sin(longitude);
      const front = smooth(0.06, 0.62, z / radius);
      glint.sprite.position.set(x, y, z);
      glint.material.opacity = visibility * front * 0.82;
      const edgeScale = 0.72 + front * 0.28;
      glint.sprite.scale.set(0.19 * edgeScale, 0.66 * edgeScale, 1);
    });
  }

  function applyScene(timeDelta = 0) {
    const progress = revealProgress;
    const fragmentIn = smooth(0.02, 0.23, progress);
    const fragmentOut = 1 - smooth(0.34, 0.57, progress);
    const globeIn = smooth(0.15, 0.43, progress);
    const ringIn = smooth(0.28, 0.62, progress);
    const networkIn = smooth(0.40, 0.68, progress);
    const handoff = smooth(0.61, 0.88, progress);
    const finalHold = smooth(0.88, 0.98, progress);
    const ambientFactor = ambientEnabled ? (reducedMotion ? 0.18 : lerp(0.12, 1, finalHold)) : 0;

    if (ambientEnabled) ambientPhase += timeDelta * (reducedMotion ? 0.28 : 1);

    gateFragments.forEach((fragment, index) => {
      const local = smooth(fragment.userData.delay * 0.12, 0.28 + fragment.userData.delay * 0.08, progress);
      fragment.material.opacity = fragmentIn * fragmentOut * local * 0.92;
      fragment.rotation.z = lerp(fragment.userData.startZ, fragment.userData.baseZ, local) + ambientPhase * 0.018 * ambientFactor;
      fragment.rotation.x = fragment.userData.baseX + Math.sin(ambientPhase * 0.22 + index) * 0.025 * ambientFactor;
      fragment.rotation.y = fragment.userData.baseY;
      fragment.scale.setScalar(0.86 + local * 0.14);
    });
    gateGroup.rotation.y = -0.20 + progress * 0.28;
    gateGroup.scale.setScalar(0.92 + fragmentIn * 0.08);

    darkMetalMaterial.opacity = globeIn;
    core.scale.setScalar(0.82 + globeIn * 0.18 + Math.sin(ambientPhase * 0.72) * 0.008 * ambientFactor);
    wireMaterial.opacity = networkIn * 0.21;
    wire.scale.setScalar(0.93 + networkIn * 0.07);
    wire.rotation.set(
      ambientPhase * 0.055 * ambientFactor,
      -ambientPhase * 0.082 * ambientFactor,
      0
    );

    rings.forEach((ring, index) => {
      const data = ring.userData;
      const local = smooth(0.28 + index * 0.025, 0.60 + index * 0.025, progress);
      ring.material.opacity = local;
      ring.position.set(
        data.offsetX * (1 - local),
        data.offsetY * (1 - local),
        data.offsetZ * (1 - local)
      );
      ring.rotation.set(
        lerp(data.startX, data.baseX, local) + Math.sin(ambientPhase * 0.31 + data.phase) * 0.022 * ambientFactor,
        lerp(data.startY, data.baseY, local) + ambientPhase * data.speed * ambientFactor,
        lerp(data.startZ, data.baseZ, local) + Math.cos(ambientPhase * 0.26 + data.phase) * 0.018 * ambientFactor
      );
    });

    nodes.forEach((node, index) => {
      node.material.opacity = networkIn;
      const entrance = smooth(0.43 + index * 0.018, 0.65 + index * 0.018, progress);
      node.scale.setScalar((index < 2 ? 1.18 : 1) * entrance);
    });
    nodeGroup.rotation.y = -ambientPhase * 0.07 * ambientFactor;

    particles.material.opacity = fragmentIn * 0.23 + finalHold * 0.07;
    particles.points.rotation.y = ambientPhase * 0.018 * ambientFactor;
    particles.points.rotation.x = Math.sin(ambientPhase * 0.12) * 0.035 * ambientFactor;

    updateSurfaceGlints(ambientPhase, networkIn);

    root.position.set(
      lerp(centreWorld.x, targetWorld.x, handoff),
      lerp(centreWorld.y, targetWorld.y, handoff),
      lerp(centreWorld.z, targetWorld.z, handoff)
    );
    root.scale.setScalar(lerp(1.14, finalScale, handoff));
    root.rotation.x = lerp(-0.08, -0.13, handoff) - pointerCurrent.y * 0.16 * finalHold;
    root.rotation.y = lerp(-0.20, -0.27, handoff) + ambientPhase * 0.045 * ambientFactor + pointerCurrent.x * 0.22 * finalHold;
    root.rotation.z = Math.sin(ambientPhase * 0.18) * 0.008 * ambientFactor;

    keyLight.intensity = 1.4 + globeIn * 0.75;
    rimLight.intensity = 8 + ringIn * 10;
    fillLight.intensity = 3 + networkIn * 5;
  }

  function render(now) {
    if (destroyed) return;
    frameId = requestAnimationFrame(render);
    const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
    lastTime = now;
    if (!pageVisible || !viewportVisible) return;

    pointerCurrent.lerp(pointerTarget, reducedMotion ? 0.10 : 0.055);
    applyScene(delta);
    renderer.render(scene, camera);
  }

  function setProgress(value) {
    revealProgress = clamp(Number(value) || 0, 0, 1);
    applyScene(0);
  }

  function setPointer(normalisedX, normalisedY) {
    pointerTarget.set(
      clamp(normalisedX, -1, 1),
      clamp(normalisedY, -1, 1)
    );
  }

  function resetPointer() {
    pointerTarget.set(0, 0);
  }

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
    cancelAnimationFrame(frameId);
    document.documentElement.classList.add('forge-fallback-active');
  };
  const onContextRestored = () => window.location.reload();
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);

    scene.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
      else object.material?.dispose?.();
    });
    glintTexture?.dispose?.();
    environmentTarget.dispose?.();
    renderer.dispose();
  }

  resize();
  setProgress(revealProgress);
  renderer.render(scene, camera);
  frameId = requestAnimationFrame(render);

  return {
    setProgress,
    setPointer,
    resetPointer,
    setAmbientEnabled,
    resize,
    destroy
  };
}
