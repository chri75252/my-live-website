const THREE_URL = 'https://esm.sh/three@0.180.0';

const DESKTOP_PIXEL_BUDGET = 3_400_000;
const MOBILE_PIXEL_BUDGET = 1_900_000;
const OBJECT_DIAMETER = 4.55;

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
  renderer.toneMappingExposure = 1.06;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0, 8.25);

  const root = new THREE.Group();
  scene.add(root);

  const globeUniforms = {
    uOpacity: { value: reducedMotion ? 1 : 0 },
    uTime: { value: 0 },
    uGlintLongitudes: { value: new THREE.Vector3(0.25, 2.4, 4.55) },
    uGlintLatitudes: { value: new THREE.Vector3(0.52, -0.1, -0.62) }
  };

  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: globeUniforms,
    transparent: true,
    depthWrite: true,
    vertexShader: `
      varying vec3 vObjectNormal;
      varying vec3 vViewNormal;
      varying vec3 vViewPosition;
      void main() {
        vObjectNormal = normalize(normal);
        vViewNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uGlintLongitudes;
      uniform vec3 uGlintLatitudes;
      varying vec3 vObjectNormal;
      varying vec3 vViewNormal;
      varying vec3 vViewPosition;

      float wrappedAngle(float value) {
        return atan(sin(value), cos(value));
      }

      float elongatedGlint(vec3 normal, float longitude, float latitude, float widthLon, float widthLat) {
        float lon = atan(normal.z, normal.x);
        float lat = asin(clamp(normal.y, -1.0, 1.0));
        float dLon = wrappedAngle(lon - longitude);
        float dLat = lat - latitude;
        return exp(-((dLon * dLon) / widthLon + (dLat * dLat) / widthLat));
      }

      void main() {
        vec3 objectNormal = normalize(vObjectNormal);
        vec3 viewNormal = normalize(vViewNormal);
        vec3 viewDirection = normalize(-vViewPosition);

        float key = max(dot(viewNormal, normalize(vec3(-0.46, 0.56, 0.69))), 0.0);
        float lowerFill = max(dot(viewNormal, normalize(vec3(0.58, -0.42, 0.54))), 0.0);
        float fresnel = pow(1.0 - max(dot(viewNormal, viewDirection), 0.0), 3.2);

        vec3 colour = vec3(0.0045, 0.0060, 0.0052);
        colour += vec3(0.022, 0.019, 0.014) * key;
        colour += vec3(0.018, 0.009, 0.002) * lowerFill;
        colour += vec3(0.18, 0.075, 0.010) * fresnel * 0.62;

        float g1 = elongatedGlint(objectNormal, uGlintLongitudes.x, uGlintLatitudes.x, 0.010, 0.120);
        float g2 = elongatedGlint(objectNormal, uGlintLongitudes.y, uGlintLatitudes.y, 0.013, 0.095);
        float g3 = elongatedGlint(objectNormal, uGlintLongitudes.z, uGlintLatitudes.z, 0.011, 0.135);
        float glint = clamp(g1 + g2 + g3, 0.0, 1.0);

        colour += vec3(0.86, 0.48, 0.13) * glint * 0.86;
        colour += vec3(1.0, 0.94, 0.74) * pow(glint, 2.1) * 0.95;

        gl_FragColor = vec4(colour, uOpacity);
      }
    `
  });

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.24, reducedMotion ? 44 : 72, reducedMotion ? 44 : 72),
    globeMaterial
  );
  root.add(core);

  const wireGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.43, reducedMotion ? 2 : 3), 8);
  const wireMaterial = new THREE.LineBasicMaterial({
    color: 0x8e5a19,
    transparent: true,
    opacity: reducedMotion ? 0.20 : 0,
    depthWrite: false
  });
  const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
  root.add(wire);

  const ringBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f2608,
    emissive: 0x160500,
    emissiveIntensity: 0.12,
    metalness: 0.92,
    roughness: 0.31,
    transparent: true,
    opacity: reducedMotion ? 1 : 0
  });
  const ringAccentMaterial = ringBaseMaterial.clone();
  ringAccentMaterial.color.setHex(0x7c350b);
  ringAccentMaterial.emissive.setHex(0x220800);
  ringAccentMaterial.emissiveIntensity = 0.17;
  ringAccentMaterial.roughness = 0.27;

  const ringSpecs = [
    { radius: 1.48, tube: 0.026, rotation: [1.08, 0.05, 0.22], speed: 0.18 },
    { radius: 1.66, tube: 0.023, rotation: [0.08, 1.12, 0.57], speed: -0.15 },
    { radius: 1.84, tube: 0.020, rotation: [0.72, 0.50, 1.15], speed: 0.13 },
    { radius: 2.02, tube: 0.018, rotation: [1.33, 0.79, 0.10], speed: -0.11 },
    { radius: 2.18, tube: 0.016, rotation: [0.42, 1.29, 0.77], speed: 0.095 }
  ];
  const ringOffsets = [
    [-0.82, 0.45, -0.32],
    [0.76, -0.38, 0.25],
    [-0.58, -0.62, -0.23],
    [0.62, 0.56, 0.18],
    [0.14, -0.16, -0.76]
  ];

  const rings = ringSpecs.map((spec, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 18, reducedMotion ? 160 : 260),
      (index < 2 ? ringAccentMaterial : ringBaseMaterial).clone()
    );
    ring.userData = {
      base: new THREE.Euler(...spec.rotation),
      start: new THREE.Euler(
        spec.rotation[0] + (index % 2 ? -0.72 : 0.65),
        spec.rotation[1] + (index % 2 ? 0.60 : -0.64),
        spec.rotation[2] + (index - 2) * 0.19
      ),
      offset: new THREE.Vector3(...ringOffsets[index]),
      speed: spec.speed,
      phase: index * 1.21
    };
    root.add(ring);
    return ring;
  });

  const nodeGroup = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.052, 18, 18);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x6c3510,
    emissive: 0x120500,
    emissiveIntensity: 0.08,
    metalness: 0.88,
    roughness: 0.34,
    transparent: true,
    opacity: reducedMotion ? 1 : 0
  });
  const nodeCoordinates = [
    [1.28, 0.48, 0.54],
    [-1.18, 0.68, 0.57],
    [0.78, -1.00, 0.80],
    [-0.58, -1.14, 0.69],
    [0.16, 1.23, -0.73],
    [-1.04, -0.20, -0.99]
  ];
  const nodes = nodeCoordinates.map((coordinate, index) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(...coordinate);
    node.scale.setScalar(index < 2 ? 1.16 : 1);
    nodeGroup.add(node);
    return node;
  });
  root.add(nodeGroup);

  const gateGroup = new THREE.Group();
  const gateFragments = [];
  const fragmentCount = reducedMotion ? 7 : 12;
  for (let index = 0; index < fragmentCount; index += 1) {
    const radius = 2.32 + (index % 4) * 0.09;
    const arcLength = 0.42 + (index % 3) * 0.12;
    const material = new THREE.MeshStandardMaterial({
      color: index % 3 === 0 ? 0xb76717 : 0x7b320a,
      emissive: 0x3a1000,
      emissiveIntensity: 0.34,
      metalness: 0.9,
      roughness: 0.25,
      transparent: true,
      opacity: 0
    });
    const fragment = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.022 + (index % 2) * 0.007, 14, 96, arcLength),
      material
    );
    const azimuth = (index / fragmentCount) * Math.PI * 2;
    fragment.rotation.set(
      0.18 + (index % 4) * 0.28,
      0.16 + (index % 5) * 0.21,
      azimuth
    );
    fragment.userData = {
      base: fragment.rotation.clone(),
      startZ: fragment.rotation.z - 1.05 - index * 0.035,
      delay: index / fragmentCount
    };
    gateGroup.add(fragment);
    gateFragments.push(fragment);
  }
  scene.add(gateGroup);

  const particles = createParticleField(THREE, reducedMotion ? 65 : window.innerWidth < 900 ? 95 : 155);
  scene.add(particles.points);

  const ambientLight = new THREE.AmbientLight(0x291308, 0.48);
  const keyLight = new THREE.DirectionalLight(0xffcf88, 3.0);
  keyLight.position.set(4.2, 5.0, 5.8);
  const rimLight = new THREE.PointLight(0xd76b14, 26, 20, 2);
  rimLight.position.set(-3.4, 1.6, 3.0);
  const lowerLight = new THREE.PointLight(0x8b3b0b, 12, 16, 2);
  lowerLight.position.set(2.5, -2.8, 2.7);
  scene.add(ambientLight, keyLight, rimLight, lowerLight);

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const targetWorld = new THREE.Vector3();
  const centreWorld = new THREE.Vector3(0, -0.02, 0);

  let revealProgress = reducedMotion ? 1 : 0;
  let ambientEnabled = true;
  let ambientPhase = 0;
  let finalScale = 0.98;
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

  function createParticleField(Three, count) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.55 + Math.random() * 2.25;
      const theta = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 3.5;
      positions[index * 3 + 2] = Math.sin(theta) * radius * 0.76;
    }
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));
    const material = new Three.PointsMaterial({
      color: 0xc67a20,
      size: 0.016,
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

    targetWorld.copy(screenPointToWorld(
      targetBounds.left + targetBounds.width / 2,
      targetBounds.top + targetBounds.height / 2,
      canvasBounds
    ));

    const visibleWorldHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const worldPerPixel = visibleWorldHeight / canvasBounds.height;
    const desiredPixels = Math.min(targetBounds.width, targetBounds.height) * 0.92;
    finalScale = clamp((desiredPixels * worldPerPixel) / OBJECT_DIAMETER, 0.78, 1.07);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const budget = window.innerWidth < 900 ? MOBILE_PIXEL_BUDGET : DESKTOP_PIXEL_BUDGET;
    const ratioByBudget = Math.sqrt(budget / (width * height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, ratioByBudget);
    renderer.setPixelRatio(Math.max(0.7, pixelRatio));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    calculateTarget();
  }

  function updateGlobeReflections(phase, visibility) {
    const speeds = [1.45, 1.72, 1.93];
    const phases = [0.2, 2.35, 4.5];
    const latitudes = [0.52, -0.10, -0.62];
    globeUniforms.uGlintLongitudes.value.set(
      phase * speeds[0] + phases[0],
      phase * speeds[1] + phases[1],
      phase * speeds[2] + phases[2]
    );
    globeUniforms.uGlintLatitudes.value.set(
      latitudes[0] + Math.sin(phase * 0.48) * 0.08,
      latitudes[1] + Math.sin(phase * 0.63 + 1.2) * 0.07,
      latitudes[2] + Math.sin(phase * 0.54 + 2.4) * 0.08
    );
    globeUniforms.uTime.value = phase;
    globeUniforms.uOpacity.value = visibility;
  }

  function applyScene(delta = 0) {
    const progress = revealProgress;
    const gateIn = smooth(0.00, 0.22, progress);
    const gateOut = 1 - smooth(0.42, 0.60, progress);
    const globeIn = smooth(0.14, 0.46, progress);
    const ringIn = smooth(0.28, 0.64, progress);
    const networkIn = smooth(0.38, 0.70, progress);
    const handoff = smooth(0.62, 0.90, progress);
    const finalHold = smooth(0.86, 0.98, progress);
    const ambientFactor = ambientEnabled ? (reducedMotion ? 0.16 : lerp(0.10, 1, finalHold)) : 0;

    if (ambientEnabled) ambientPhase += delta * (reducedMotion ? 0.24 : 1);

    gateFragments.forEach((fragment, index) => {
      const local = smooth(fragment.userData.delay * 0.09, 0.26 + fragment.userData.delay * 0.06, progress);
      fragment.material.opacity = gateIn * gateOut * local * 0.95;
      fragment.rotation.x = fragment.userData.base.x + Math.sin(ambientPhase * 0.18 + index) * 0.024 * ambientFactor;
      fragment.rotation.y = fragment.userData.base.y + progress * 0.18;
      fragment.rotation.z = lerp(fragment.userData.startZ, fragment.userData.base.z, local);
      fragment.scale.setScalar(0.74 + local * 0.26);
    });
    gateGroup.rotation.y = -0.36 + progress * 0.48;
    gateGroup.rotation.x = 0.08 - progress * 0.10;

    updateGlobeReflections(ambientPhase, globeIn);
    core.scale.setScalar(0.70 + globeIn * 0.30 + Math.sin(ambientPhase * 0.65) * 0.006 * ambientFactor);

    wireMaterial.opacity = networkIn * 0.23;
    wire.scale.setScalar(0.90 + networkIn * 0.10);
    wire.rotation.set(
      ambientPhase * 0.04 * ambientFactor,
      -ambientPhase * 0.065 * ambientFactor,
      0
    );

    rings.forEach((ring, index) => {
      const data = ring.userData;
      const local = smooth(0.28 + index * 0.024, 0.61 + index * 0.024, progress);
      ring.material.opacity = local;
      ring.position.copy(data.offset).multiplyScalar(1 - local);
      ring.rotation.set(
        lerp(data.start.x, data.base.x, local) + Math.sin(ambientPhase * 0.28 + data.phase) * 0.020 * ambientFactor,
        lerp(data.start.y, data.base.y, local) + ambientPhase * data.speed * ambientFactor,
        lerp(data.start.z, data.base.z, local) + Math.cos(ambientPhase * 0.23 + data.phase) * 0.016 * ambientFactor
      );
    });

    nodes.forEach((node, index) => {
      const entrance = smooth(0.43 + index * 0.016, 0.67 + index * 0.016, progress);
      node.material.opacity = entrance;
      node.scale.setScalar((index < 2 ? 1.16 : 1) * entrance);
    });
    nodeGroup.rotation.y = -ambientPhase * 0.055 * ambientFactor;

    particles.material.opacity = gateIn * 0.20 + finalHold * 0.055;
    particles.points.rotation.y = ambientPhase * 0.014 * ambientFactor;

    root.position.set(
      lerp(centreWorld.x, targetWorld.x, handoff),
      lerp(centreWorld.y, targetWorld.y, handoff),
      lerp(centreWorld.z, targetWorld.z, handoff)
    );
    root.scale.setScalar(lerp(1.20, finalScale, handoff));
    root.rotation.x = lerp(-0.04, -0.11, handoff) - pointerCurrent.y * 0.11 * finalHold;
    root.rotation.y = lerp(-0.34, -0.24, handoff) + ambientPhase * 0.038 * ambientFactor + pointerCurrent.x * 0.16 * finalHold;
    root.rotation.z = Math.sin(ambientPhase * 0.17) * 0.006 * ambientFactor;

    keyLight.intensity = 1.7 + globeIn * 1.3;
    rimLight.intensity = 8 + ringIn * 18;
    lowerLight.intensity = 3 + networkIn * 9;
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

  function setPointer(x, y) {
    pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1));
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
    renderer.dispose();
  }

  resize();
  setProgress(revealProgress);
  renderer.render(scene, camera);
  frameId = requestAnimationFrame(render);

  return { setProgress, setPointer, resetPointer, setAmbientEnabled, resize, destroy };
}
