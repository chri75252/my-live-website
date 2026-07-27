import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');
const button = document.getElementById('motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lifecycle = () => document.documentElement.dataset.tbmHeroLifecycle || 'suspended';

if (canvas && stage && !reducedMotion.matches) initialise().catch(fallback);
else if (canvas) fallback();

async function initialise() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  // Blender's Z-up model is converted to Three.js Y-up on export: view along Z, not Y.
  camera.position.set(.5, .55, 9.1);
  const target = new THREE.Vector3(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.HemisphereLight(0x6f9389, 0x040606, 2.1));
  const key = new THREE.DirectionalLight(0xffc18e, 4.1); key.position.set(-4, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xca6338, 50, 17, 2); rim.position.set(3, 2, 5); scene.add(rim);
  const fill = new THREE.PointLight(0x2c8a7a, 12, 15, 2); fill.position.set(-4, 2, -3); scene.add(fill);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('assets/armillary/tbm-armillary-v5.glb');
  root.add(gltf.scene);
  gltf.scene.traverse(node => {
    if (!node.isMesh) return;
    // Blender's glTF exporter preserves the scene-unit conversion on each mesh.
    // Correct that conversion locally without scaling orbital positions.
    node.scale.multiplyScalar(1000);
    node.castShadow = false;
    node.receiveShadow = false;
    const source = Array.isArray(node.material) ? node.material[0] : node.material;
    node.material = new THREE.MeshStandardMaterial({
      color: source?.name.includes('Black_Iron') ? 0x172022 : 0xc77847,
      metalness: source?.name.includes('Black_Iron') ? .75 : .68,
      roughness: source?.name.includes('Black_Iron') ? .24 : .31,
      emissive: source?.name.includes('Black_Iron') ? 0x020809 : 0x180804,
      emissiveIntensity: .55,
      side: THREE.DoubleSide
    });
  });

  let running = true;
  let visible = !document.hidden;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let last = performance.now();
  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
  }
  function render(now) {
    frame = requestAnimationFrame(render);
    const delta = Math.min(.05, (now - last) / 1000); last = now;
    if (!visible || lifecycle() === 'suspended') return;
    if (running) root.rotation.y += delta * .12;
    root.rotation.x += (pointerY * .12 - root.rotation.x) * .04;
    root.rotation.z += (pointerX * .08 - root.rotation.z) * .04;
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function setRunning(next) {
    running = next;
    button?.setAttribute('aria-pressed', String(running));
    if (button) button.textContent = running ? 'Pause ambient motion' : 'Resume ambient motion';
    document.documentElement.dataset.heroMotion = running ? 'running' : 'paused';
  }
  stage.addEventListener('pointermove', event => {
    if (!window.matchMedia('(pointer:fine)').matches) return;
    const rect = stage.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  button?.addEventListener('click', () => setRunning(!running));
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('tbm:hero-lifecycle', resize);
  resize();
  setRunning(true);
  document.documentElement.classList.add('webgl-ready');
  window.__tbmBlenderHero = { getState: () => {
    const bounds = new THREE.Box3().setFromObject(root);
    return {
      running,
      lifecycle: lifecycle(),
      renderer: renderer.info.render,
      bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
      rootScale: root.scale.toArray()
    };
  } };
  frame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); renderer.dispose(); }, { once: true });
}

function fallback(error) {
  if (error) console.warn('Blender GLB hero unavailable; CSS fallback remains active.', error);
  document.documentElement.classList.add('webgl-fallback');
}
