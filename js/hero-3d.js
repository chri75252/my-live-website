const HERO_BUILD = '2026-07-11-v6';
document.documentElement.dataset.heroBuild = HERO_BUILD;

const hero = document.querySelector('.hero-scroll-sequence');
const grid = hero?.querySelector('.hero-grid');
const stage = document.getElementById('hero-stage');
const canvas = document.getElementById('hero-canvas');
const toggle = document.getElementById('motion-toggle');
const cue = document.querySelector('.scroll-cue');
const cards = [...document.querySelectorAll('.hero-stage .float-card')];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const MODULES = {
  three: 'https://esm.sh/three@0.180.0',
  composer: 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js',
  renderPass: 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/RenderPass.js',
  bloomPass: 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js',
  outputPass: 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/OutputPass.js'
};

if (!hero || !grid || !stage || !canvas) {
  showFallback();
} else {
  bootstrapHero();
}

/**
 * Load the rendering modules dynamically so a network failure can still
 * reveal the CSS armillary fallback instead of leaving a blank canvas.
 */
async function bootstrapHero() {
  try {
    const [THREE, composerModule, renderPassModule, bloomModule, outputModule] = await Promise.all([
      import(MODULES.three),
      import(MODULES.composer),
      import(MODULES.renderPass),
      import(MODULES.bloomPass),
      import(MODULES.outputPass)
    ]);

    initialiseHero({
      THREE,
      EffectComposer: composerModule.EffectComposer,
      RenderPass: renderPassModule.RenderPass,
      UnrealBloomPass: bloomModule.UnrealBloomPass,
      OutputPass: outputModule.OutputPass
    });
  } catch (error) {
    console.error('3D hero modules failed to load.', error);
    showFallback();
  }
}

/** Display the animated CSS fallback and hide WebGL-only controls. */
function showFallback() {
  document.documentElement.classList.remove('webgl-ready');
  document.documentElement.classList.add('webgl-fallback');
}

/** Build and run the custom procedural Three.js hero scene. */
function initialiseHero({ THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    });
  } catch (error) {
    console.error('WebGL renderer failed to initialise.', error);
    showFallback();
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xe4a944,
    emissive: 0x552500,
    emissiveIntensity: 0.48,
    metalness: 1,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.14
  });

  const brightGold = gold.clone();
  brightGold.color.setHex(0xffcf71);
  brightGold.emissive.setHex(0x8b3900);
  brightGold.emissiveIntensity = 0.78;

  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x070807,
    metalness: 0.92,
    roughness: 0.36,
    clearcoat: 1,
    clearcoatRoughness: 0.2
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x9a6b22,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(1.22, 64, 64), darkMetal);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.43, 3), wireMaterial);
  root.add(core, wire);

  const halo = createEnergyHalo(THREE);
  root.add(halo.mesh);

  const ringSpecs = [
    [1.46, 0.026, 1.10, 0.06, 0.22, 0.36],
    [1.64, 0.023, 0.06, 1.14, 0.58, -0.29],
    [1.82, 0.020, 0.72, 0.50, 1.16, 0.25],
    [2.00, 0.018, 1.34, 0.80, 0.10, -0.20],
    [2.14, 0.016, 0.42, 1.30, 0.78, 0.18]
  ];

  const rings = ringSpecs.map(([radius, tube, x, y, z, speed], index) => {
    const material = (index < 2 ? brightGold : gold).clone();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 18, 240),
      material
    );
    ring.rotation.set(x, y, z);
    ring.userData = {
      base: new THREE.Euler(x, y, z),
      speed,
      phase: index * 1.31,
      emissiveBase: material.emissiveIntensity
    };
    root.add(ring);
    return ring;
  });

  const nodes = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.06, 18, 18);
  const glowTexture = createGlowTexture(THREE);

  for (let index = 0; index < 18; index += 1) {
    const material = (index % 3 === 0 ? brightGold : gold).clone();
    const node = new THREE.Mesh(nodeGeometry, material);
    const angle = (index / 18) * Math.PI * 2;
    const radius = 1.44 + (index % 4) * 0.16;
    node.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7) * 0.63,
      Math.sin(angle) * radius
    );
    node.userData.baseScale = index % 5 === 0 ? 1.5 : 1;
    node.userData.index = index;
    node.userData.emissiveBase = material.emissiveIntensity;

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color: index % 3 === 0 ? 0xffca62 : 0xe89b2a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    }));
    glow.scale.setScalar(index % 5 === 0 ? 0.32 : 0.22);
    glow.userData.baseScale = glow.scale.x;
    node.add(glow);
    node.userData.glow = glow;
    nodes.add(node);
  }
  root.add(nodes);

  const particles = new THREE.Points(
    createParticleGeometry(THREE, window.innerWidth < 700 ? 170 : 300),
    new THREE.PointsMaterial({
      color: 0xeab553,
      size: 0.019,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  root.add(particles);

  const pedestal = new THREE.Group();
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.10, 18, 180),
    new THREE.MeshBasicMaterial({
      color: 0x66380a,
      transparent: true,
      opacity: 0.8
    })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -2.06;
  pedestal.add(baseRing);
  root.add(pedestal);

  const cometConfigs = [
    { rx: 1.96, ry: 0.90, rz: 1.58, speed: 1.05, tiltX: 1.05, tiltY: 0.30, phase: 0.0, color: 0xffe0a0 },
    { rx: 1.76, ry: 1.04, rz: 1.78, speed: 1.32, tiltX: 0.34, tiltY: 1.04, phase: 2.1, color: 0xffbd55 },
    { rx: 2.08, ry: 0.70, rz: 1.40, speed: 0.96, tiltX: 1.25, tiltY: 0.86, phase: 4.2, color: 0xffcf71 }
  ];

  const comets = cometConfigs.map((config, index) => {
    const comet = createForgeComet(THREE, glowTexture, config, index);
    root.add(comet.group);
    return comet;
  });

  const hemisphere = new THREE.HemisphereLight(0xf9ddb0, 0x2d1607, 1.08);
  const keyLight = new THREE.PointLight(0xffd99a, 5.0, 20, 2);
  keyLight.position.set(1.8, 1.4, 2.4);
  const rimLight = new THREE.PointLight(0xffad38, 50, 26, 2);
  rimLight.position.set(-2.4, 1.7, -1.3);
  const lowerLight = new THREE.PointLight(0xea7d16, 40, 16, 2);
  lowerLight.position.set(0, -3, 2);
  scene.add(hemisphere, keyLight, rimLight, lowerLight);

  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const frameCentre = new THREE.Vector3(0, -0.04, 0);
  const framingRadius = 2.78;

  let targetProgress = 0;
  let currentProgress = 0;
  let motionPhase = 0;
  let lastFrameTime = performance.now();
  let pageVisible = !document.hidden;
  let stageVisible = true;
  let motionEnabled = true;
  let scrollBoost = 0;
  let baseCameraZ = 8.8;
  let composer = null;
  let bloomPass = null;
  let bloomEnabled = false;
  let animationFrameId = 0;
  let contextLost = false;

  try {
    motionEnabled = localStorage.getItem('tbm-3d-motion-v3') !== 'off';
  } catch {
    motionEnabled = true;
  }

  /** Create a procedural radial texture used by glows and comet trails. */
  function createGlowTexture(Three) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const context = glowCanvas.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(255,218,139,.95)');
    gradient.addColorStop(0.48, 'rgba(255,157,37,.42)');
    gradient.addColorStop(1, 'rgba(255,116,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new Three.CanvasTexture(glowCanvas);
    texture.colorSpace = Three.SRGBColorSpace;
    return texture;
  }

  /** Build the faint animated Fresnel shell around the black core. */
  function createEnergyHalo(Three) {
    const uniforms = {
      time: { value: 0 },
      intensity: { value: 0.42 }
    };
    const material = new Three.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
          float ripple = 0.84 + 0.16 * sin(time * 1.8 + fresnel * 9.0);
          vec3 colour = mix(vec3(0.54, 0.20, 0.01), vec3(1.0, 0.70, 0.20), fresnel);
          gl_FragColor = vec4(colour, fresnel * ripple * intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: Three.AdditiveBlending,
      side: Three.BackSide
    });
    return {
      mesh: new Three.Mesh(new Three.SphereGeometry(1.51, 48, 48), material),
      uniforms
    };
  }

  /** Create ambient spark particles distributed around the armillary. */
  function createParticleGeometry(Three, count) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 1.9 + Math.random() * 1.25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi) * 0.62;
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));
    return geometry;
  }

  /** Build one conspicuous moving forge comet with a luminous head and bead trail. */
  function createForgeComet(Three, texture, config, index) {
    const group = new Three.Group();
    const head = new Three.Mesh(
      new Three.SphereGeometry(index === 1 ? 0.105 : 0.115, 20, 20),
      new Three.MeshBasicMaterial({ color: config.color, toneMapped: false })
    );

    const glow = new Three.Sprite(new Three.SpriteMaterial({
      map: texture,
      color: config.color,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: Three.AdditiveBlending,
      toneMapped: false
    }));
    glow.scale.setScalar(index === 1 ? 0.52 : 0.58);
    head.add(glow);

    const movingLight = new Three.PointLight(config.color, 12, 3.5, 2);
    head.add(movingLight);
    group.add(head);

    const trail = [];
    const history = [];
    const trailCount = 14;
    for (let trailIndex = 0; trailIndex < trailCount; trailIndex += 1) {
      const fraction = 1 - trailIndex / trailCount;
      const sprite = new Three.Sprite(new Three.SpriteMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: 0.52 * fraction * fraction,
        depthWrite: false,
        blending: Three.AdditiveBlending,
        toneMapped: false
      }));
      const size = 0.25 * fraction + 0.025;
      sprite.scale.setScalar(size);
      group.add(sprite);
      trail.push(sprite);
      history.push(new Three.Vector3());
    }

    return {
      ...config,
      group,
      head,
      glow,
      movingLight,
      trail,
      history,
      initialised: false
    };
  }

  /** Calculate a comet point on its tilted three-dimensional orbit. */
  function getCometPosition(comet, angle) {
    return new THREE.Vector3(
      Math.cos(angle) * comet.rx,
      Math.sin(angle * 1.26 + comet.phase * 0.5) * comet.ry,
      Math.sin(angle) * comet.rz
    ).applyEuler(new THREE.Euler(comet.tiltX, comet.tiltY, 0));
  }

  /** Keep every ring, comet and pedestal inside the square stage at all widths. */
  function fitCamera() {
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    baseCameraZ = (framingRadius * 1.075) / Math.sin(limitingFov / 2);
    camera.position.set(0, 0.08, baseCameraZ);
    camera.lookAt(frameCentre);
    camera.updateProjectionMatrix();
  }

  /** Enable restrained bloom only on sufficiently large, motion-capable screens. */
  function configureBloom(width, height) {
    const shouldEnable = width >= 900 && !reduce.matches;
    if (!shouldEnable) {
      composer?.dispose?.();
      composer = null;
      bloomPass = null;
      bloomEnabled = false;
      return;
    }

    if (!composer) {
      try {
        composer = new EffectComposer(renderer);
        composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        composer.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          0.72,
          0.32,
          0.62
        );
        bloomPass.threshold = 0.62;
        bloomPass.strength = 0.72;
        bloomPass.radius = 0.32;
        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());
        bloomEnabled = true;
      } catch (error) {
        console.warn('Bloom disabled; direct rendering remains active.', error);
        composer = null;
        bloomPass = null;
        bloomEnabled = false;
      }
    }
    composer?.setSize(width, height);
  }

  /** Reveal the four commercial cards as scroll progress advances. */
  function updateCards(progress, scrollProgress) {
    cards.forEach((card, index) => {
      const local = smoothStep(0.16 + index * 0.075, 0.38 + index * 0.075, progress);
      card.style.opacity = local.toFixed(3);
      card.style.transform = `translate3d(0, ${(1 - local) * 16}px, 0) scale(${0.97 + local * 0.03})`;
      card.style.pointerEvents = local > 0.9 ? 'auto' : 'none';
    });
    if (cue) cue.style.opacity = String(1 - smoothStep(0.08, 0.28, scrollProgress));
  }

  function smoothStep(min, max, value) {
    const normalised = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
    return normalised * normalised * (3 - 2 * normalised);
  }

  /** Update comet heads, moving lights and clearly visible fading trails. */
  function updateComets(phase, motionFactor) {
    comets.forEach(comet => {
      const velocityMultiplier = 1 + scrollBoost * 0.38;
      const angle = phase * comet.speed * velocityMultiplier + comet.phase;
      const position = getCometPosition(comet, angle);
      comet.head.position.copy(position);

      if (!comet.initialised) {
        comet.history.forEach((historyPoint, index) => {
          historyPoint.copy(getCometPosition(comet, angle - index * 0.045));
        });
        comet.initialised = true;
      } else if (motionEnabled) {
        comet.history.pop();
        comet.history.unshift(position.clone());
      }

      comet.trail.forEach((sprite, index) => {
        sprite.position.copy(comet.history[index]);
        const fraction = 1 - index / comet.trail.length;
        sprite.material.opacity = (0.14 + 0.55 * fraction * fraction) * Math.max(motionFactor, 0.35);
      });

      const flare = 1 + Math.sin(phase * 4.2 + comet.phase) * 0.13 * motionFactor;
      comet.head.scale.setScalar(flare);
      comet.glow.material.opacity = 0.78 + scrollBoost * 0.2;
      comet.movingLight.intensity = 10 + scrollBoost * 9;
    });
  }

  /** Apply autonomous, pointer and scroll-directed movement to the complete scene. */
  function applyScene() {
    const progress = 0.76 + currentProgress * 0.24;
    const accessibilityFactor = reduce.matches ? 0.45 : 1;
    const motionFactor = motionEnabled ? accessibilityFactor : 0;
    const assembly = smoothStep(0.04, 0.8, progress);
    const network = smoothStep(0.20, 0.82, progress);

    root.scale.setScalar(0.985 + assembly * 0.028 + Math.sin(motionPhase * 0.95) * 0.012 * motionFactor);
    root.rotation.x = -0.14 + assembly * 0.07 - pointerCurrent.y * 0.48 * motionFactor;
    root.rotation.y = -0.31 + assembly * 0.16 + pointerCurrent.x * 0.68 * motionFactor + motionPhase * 0.16 * motionFactor;
    root.rotation.z = 0.035 + Math.sin(motionPhase * 0.34) * 0.012 * motionFactor;
    root.position.y = -0.01 + Math.sin(motionPhase * 0.55) * 0.016 * motionFactor;

    core.scale.setScalar(1 + Math.sin(motionPhase * 1.45) * 0.021 * motionFactor);
    core.rotation.y = -motionPhase * 0.16 * motionFactor;
    wire.rotation.set(motionPhase * 0.12 * motionFactor, -motionPhase * 0.19 * motionFactor, 0);
    wireMaterial.opacity = 0.14 + network * 0.14;

    halo.uniforms.time.value = motionPhase;
    halo.uniforms.intensity.value = 0.38 + scrollBoost * 0.22 + Math.sin(motionPhase * 1.1) * 0.035 * motionFactor;
    halo.mesh.rotation.y = motionPhase * 0.08 * motionFactor;

    rings.forEach((ring, index) => {
      const base = ring.userData.base;
      const localPhase = ring.userData.phase;
      ring.rotation.x = base.x + Math.sin(motionPhase * (0.68 + index * 0.055) + localPhase) * 0.075 * motionFactor;
      ring.rotation.y = base.y + motionPhase * ring.userData.speed * (1 + scrollBoost * 0.22) * motionFactor;
      ring.rotation.z = base.z + Math.cos(motionPhase * (0.54 + index * 0.04) + localPhase) * 0.055 * motionFactor;
      ring.material.emissiveIntensity = ring.userData.emissiveBase + 0.12 * Math.max(0, Math.sin(motionPhase * 1.4 + localPhase)) + scrollBoost * 0.18;
    });

    nodes.rotation.x = Math.sin(motionPhase * 0.38) * 0.065 * motionFactor;
    nodes.rotation.y = -motionPhase * 0.30 * motionFactor;
    nodes.children.forEach(node => {
      const pulseWave = Math.pow((Math.sin(motionPhase * 2.3 + node.userData.index * 0.52) + 1) / 2, 3);
      const scale = node.userData.baseScale * (1 + pulseWave * 0.42 * motionFactor);
      node.scale.setScalar(scale);
      node.material.emissiveIntensity = node.userData.emissiveBase + pulseWave * 0.55 * motionFactor;
      node.userData.glow.scale.setScalar(node.userData.glow.userData.baseScale * (1 + pulseWave * 0.8 * motionFactor));
      node.userData.glow.material.opacity = 0.16 + pulseWave * 0.64 * motionFactor;
    });

    particles.rotation.x = Math.sin(motionPhase * 0.22) * 0.055 * motionFactor;
    particles.rotation.y = motionPhase * 0.065 * motionFactor;
    particles.material.opacity = 0.30 + Math.sin(motionPhase * 0.75) * 0.06 * motionFactor;

    updateComets(motionPhase, motionFactor);

    camera.position.z = baseCameraZ - assembly * 0.10;
    camera.lookAt(frameCentre);

    const lightPulse = Math.sin(motionPhase * 1.3) * 3.2 * motionFactor;
    keyLight.intensity = 4.8 + lightPulse * 0.14;
    rimLight.intensity = 48 + lightPulse + scrollBoost * 8;
    lowerLight.intensity = 38 + lightPulse * 0.7;
    if (bloomPass) bloomPass.strength = 0.72 + scrollBoost * 0.32;

    updateCards(progress, currentProgress);
  }

  /** Keep the motion-control copy and persistent preference in sync. */
  function updateMotionButton() {
    if (!toggle) return;
    toggle.textContent = motionEnabled ? 'Pause ambient motion' : 'Resume ambient motion';
    toggle.setAttribute('aria-pressed', String(motionEnabled));
    document.documentElement.dataset.heroMotion = motionEnabled ? 'running' : 'paused';
  }

  toggle?.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    try {
      localStorage.setItem('tbm-3d-motion-v3', motionEnabled ? 'on' : 'off');
    } catch {
      // Animation continues even if storage is blocked by privacy settings.
    }
    if (!motionEnabled) pointerTarget.set(0, 0);
    updateMotionButton();
  });
  updateMotionButton();

  if (window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', event => {
      if (!motionEnabled) return;
      const bounds = stage.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.26,
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.17
      );
    }, { passive: true });
    stage.addEventListener('pointerleave', () => pointerTarget.set(0, 0));
  }

  /** Bind the final assembly and energy boost to scroll progress and velocity. */
  function installScrollDriver() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      const media = window.gsap.matchMedia();

      media.add('(min-width: 900px)', () => {
        hero.classList.add('is-pinned');
        const trigger = window.ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight, 760)}`,
          pin: grid,
          pinSpacing: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            targetProgress = self.progress;
            scrollBoost = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 2400, 0, 1);
          }
        });
        return () => {
          trigger.kill();
          hero.classList.remove('is-pinned');
        };
      });

      media.add('(max-width: 899px)', () => {
        const trigger = window.ScrollTrigger.create({
          trigger: hero,
          start: 'top 88%',
          end: 'bottom 18%',
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate(self) {
            targetProgress = self.progress;
            scrollBoost = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 3400, 0, 0.65);
          }
        });
        return () => trigger.kill();
      });
      return;
    }

    const updateNativeScroll = () => {
      const bounds = hero.getBoundingClientRect();
      targetProgress = THREE.MathUtils.clamp(
        (-bounds.top + window.innerHeight * 0.06) / Math.max(window.innerHeight * 0.86, 620),
        0,
        1
      );
    };
    updateNativeScroll();
    window.addEventListener('scroll', updateNativeScroll, { passive: true });
    window.addEventListener('resize', updateNativeScroll, { passive: true });
  }

  if (document.readyState === 'complete') installScrollDriver();
  else window.addEventListener('load', installScrollDriver, { once: true });

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera();
    configureBloom(width, height);
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
    contextLost = true;
    cancelAnimationFrame(animationFrameId);
    composer?.dispose?.();
    showFallback();
  });

  canvas.addEventListener('webglcontextrestored', () => {
    window.location.reload();
  });

  /** Main deterministic render loop with visibility and reduced-motion guards. */
  function frame(now) {
    animationFrameId = requestAnimationFrame(frame);
    if (contextLost) return;

    const deltaSeconds = Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.05);
    lastFrameTime = now;
    if (!pageVisible || !stageVisible) return;

    if (motionEnabled) motionPhase += deltaSeconds * (reduce.matches ? 0.45 : 1);
    scrollBoost = Math.max(0, scrollBoost - deltaSeconds * 1.2);
    currentProgress += (targetProgress - currentProgress) * (reduce.matches ? 0.12 : 0.09);
    pointerCurrent.lerp(pointerTarget, reduce.matches ? 0.10 : 0.05);

    applyScene();
    if (bloomEnabled && composer) composer.render(deltaSeconds);
    else renderer.render(scene, camera);
  }

  reduce.addEventListener?.('change', () => {
    resize();
    updateMotionButton();
  });

  document.documentElement.classList.add('webgl-ready');
  document.documentElement.classList.remove('webgl-fallback');
  applyScene();
  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(frame);
}