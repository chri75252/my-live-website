import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.getElementById('hero-canvas');
const stage = document.getElementById('hero-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas && stage) {
    initialiseHeroScene().catch(error => {
        console.warn('3D hero unavailable; CSS fallback retained.', error);
        document.documentElement.classList.add('webgl-fallback');
    });
}

async function initialiseHeroScene() {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio <= 1.75,
        powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7.4);

    const sculpture = new THREE.Group();
    sculpture.rotation.set(-0.08, -0.18, 0.02);
    scene.add(sculpture);

    const gold = new THREE.MeshPhysicalMaterial({
        color: 0xd59a32,
        metalness: 1,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: 0x241003,
        emissiveIntensity: 0.35
    });

    const darkMetal = new THREE.MeshPhysicalMaterial({
        color: 0x111311,
        metalness: 0.92,
        roughness: 0.24,
        clearcoat: 1,
        clearcoatRoughness: 0.16
    });

    const edgeGold = new THREE.MeshStandardMaterial({
        color: 0xf0bf58,
        metalness: 1,
        roughness: 0.14,
        emissive: 0x3a1903,
        emissiveIntensity: 0.7
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 64), darkMetal);
    sculpture.add(core);

    const innerWire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.17, 2),
        new THREE.MeshBasicMaterial({ color: 0xa76816, wireframe: true, transparent: true, opacity: 0.16 })
    );
    sculpture.add(innerWire);

    const ringData = [
        [1.55, 0.025, 1.15, 0.00, 0.18],
        [1.73, 0.021, 0.08, 1.18, 0.63],
        [1.91, 0.018, 0.77, 0.54, 1.22],
        [2.10, 0.016, 1.42, 0.83, 0.10],
        [2.28, 0.014, 0.48, 1.38, 0.82]
    ];

    const rings = ringData.map(([radius, tube, x, y, z], index) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, tube, 18, 220),
            index < 2 ? edgeGold : gold
        );
        ring.rotation.set(x, y, z);
        ring.userData.speed = 0.0007 + index * 0.00016;
        ring.userData.axis = index % 2 ? 'x' : 'y';
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

    const particleCount = 420;
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
    const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
            color: 0xeab553,
            size: 0.018,
            transparent: true,
            opacity: 0.62,
            sizeAttenuation: true
        })
    );
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

    scene.add(new THREE.HemisphereLight(0xffe4aa, 0x101411, 1.2));

    const keyLight = new THREE.DirectionalLight(0xffd27c, 4.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xc97916, 48, 14, 1.8);
    rimLight.position.set(-3, 0.5, 3.5);
    scene.add(rimLight);

    const lowerGlow = new THREE.PointLight(0xf1a730, 40, 10, 2);
    lowerGlow.position.set(0, -3, 2);
    scene.add(lowerGlow);

    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const clock = new THREE.Clock();
    let isVisible = true;
    let isPageVisible = !document.hidden;

    function updatePointer(event) {
        const rect = stage.getBoundingClientRect();
        pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.42;
        pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.28;
    }

    function resetPointer() {
        pointerTarget.set(0, 0);
    }

    if (!reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
        stage.addEventListener('pointermove', updatePointer, { passive: true });
        stage.addEventListener('pointerleave', resetPointer);
    }

    const resize = () => {
        const { width, height } = stage.getBoundingClientRect();
        if (width === 0 || height === 0) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const visibilityObserver = new IntersectionObserver(entries => {
        isVisible = entries[0]?.isIntersecting ?? true;
        updateLoopState();
    }, { threshold: 0.04 });
    visibilityObserver.observe(stage);

    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        updateLoopState();
    });

    function renderStaticFrame() {
        sculpture.rotation.y = -0.28;
        sculpture.rotation.x = -0.06;
        renderer.render(scene, camera);
    }

    function animate() {
        const elapsed = clock.getElapsedTime();
        pointerCurrent.lerp(pointerTarget, 0.045);

        sculpture.rotation.y = elapsed * 0.105 + pointerCurrent.x;
        sculpture.rotation.x = -0.08 + Math.sin(elapsed * 0.38) * 0.025 - pointerCurrent.y;
        nodes.rotation.y = -elapsed * 0.16;
        particles.rotation.y = elapsed * 0.018;
        particles.rotation.x = Math.sin(elapsed * 0.17) * 0.05;

        rings.forEach((ring, index) => {
            const delta = ring.userData.speed * 16.6;
            ring.rotation[ring.userData.axis] += delta * (index % 2 ? 1 : -1);
        });

        renderer.render(scene, camera);
    }

    function updateLoopState() {
        if (reducedMotion.matches) {
            renderer.setAnimationLoop(null);
            renderStaticFrame();
            return;
        }
        renderer.setAnimationLoop(isVisible && isPageVisible ? animate : null);
    }

    reducedMotion.addEventListener?.('change', updateLoopState);
    canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        renderer.setAnimationLoop(null);
        document.documentElement.classList.remove('webgl-ready');
        document.documentElement.classList.add('webgl-fallback');
    });

    document.documentElement.classList.add('webgl-ready');
    updateLoopState();
}
