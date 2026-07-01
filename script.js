const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Scroll-linked wave background (Three.js) - camera drifts through a rolling
// grid of gold particles as you scroll, like passing over/under a sea surface.
const wavesContainer = document.getElementById('dotWaves');
if (wavesContainer && window.THREE && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;
    const halfPageY = document.body.clientHeight / 2;
    let camera, scene, renderer, particles;
    let count = 0;
    let yDisPos = 0;

    const waveVertexShader = `
        attribute float scale;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = scale * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
    const waveFragmentShader = `
        uniform vec3 color;
        void main() {
            if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function initWaves() {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;
        camera.position.y = 1000;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x09090f);

        const numParticles = AMOUNTX * AMOUNTY;
        const positions = new Float32Array(numParticles * 3);
        const scales = new Float32Array(numParticles);

        let i = 0, j = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
                positions[i + 1] = 0;
                positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
                scales[j] = 0.1;
                i += 3;
                j++;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color(0xd4af37) } }, // gold
            vertexShader: waveVertexShader,
            fragmentShader: waveFragmentShader
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        wavesContainer.appendChild(renderer.domElement);
        wavesContainer.style.touchAction = 'none';

        window.addEventListener('resize', onWavesResize);
    }

    function onWavesResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onWavesScroll() {
        yDisPos = (window.scrollY - halfPageY) / 2;
    }

    function animateWaves() {
        requestAnimationFrame(animateWaves);
        onWavesScroll();
        renderWaves();
    }

    function renderWaves() {
        camera.position.x += (yDisPos - camera.position.x) * 0.02;
        camera.position.y += (-yDisPos - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        const positions = particles.geometry.attributes.position.array;
        const scales = particles.geometry.attributes.scale.array;
        let i = 0, j = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                positions[i + 1] = Math.sin((ix + count) * 0.3) * 30 + Math.sin((iy + count) * 0.5) * 30;
                scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 10 + (Math.sin((iy + count) * 0.5) + 1) * 10;
                i += 3;
                j++;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.scale.needsUpdate = true;

        renderer.render(scene, camera);
        count += 0.1;
    }

    initWaves();
    animateWaves();
}

// Snaking SVG Line and Scroll Animations (only runs on pages that have node-dots + #snakeSvg)
const snakeSvg = document.getElementById('snakeSvg');
const snakePath = document.getElementById('snakePath');

function drawSnakeLine() {
    if (!snakeSvg || !snakePath) return;
    if (window.innerWidth <= 900) return; // Hidden on mobile

    const dots = document.querySelectorAll('.node-dot');
    if (dots.length === 0) return;
    let pathString = '';

    dots.forEach((dot, index) => {
        const rect = dot.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + window.scrollX;
        const y = rect.top + rect.height / 2 + window.scrollY;

        if (index === 0) {
            pathString += `M ${x} ${y} `;
        } else {
            const prevDot = dots[index - 1];
            const pRect = prevDot.getBoundingClientRect();
            const px = pRect.left + pRect.width / 2 + window.scrollX;
            const py = pRect.top + pRect.height / 2 + window.scrollY;

            const midY = py + (y - py) / 2;
            pathString += `V ${midY} H ${x} V ${y} `;
        }
    });

    snakeSvg.style.height = document.documentElement.scrollHeight + 'px';
    snakePath.setAttribute('d', pathString);

    const length = snakePath.getTotalLength();
    snakePath.style.strokeDasharray = length;
    snakePath.style.strokeDashoffset = length;
}

window.addEventListener('load', drawSnakeLine);
window.addEventListener('resize', drawSnakeLine);

window.addEventListener('scroll', () => {
    // Fade in text boxes and service cards
    const boxes = document.querySelectorAll('.text-box, .service-card');
    const triggerBottom = window.innerHeight * 0.85;

    boxes.forEach(box => {
        const boxTop = box.getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
            box.classList.add('visible');
        }
    });

    if (!snakeSvg || !snakePath) return;
    if (window.innerWidth <= 900) return;

    const dots = document.querySelectorAll('.node-dot');
    if (dots.length === 0) return;

    // Draw line on scroll
    const length = snakePath.getTotalLength();
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Calculate progress with a slight multiplier so it reaches the end smoothly
    let scrollPercentage = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    const drawLength = length * scrollPercentage * 1.2;

    snakePath.style.strokeDashoffset = Math.max(0, length - drawLength);

    // Light up dots
    const currentLineY = scrollTop + (window.innerHeight * 0.6); // Approximate front of the line
    dots.forEach((dot, idx) => {
        const dotTop = dot.getBoundingClientRect().top + scrollTop;
        if (currentLineY > dotTop || (scrollPercentage > 0.95 && idx === dots.length - 1)) {
            dot.classList.add('visible');
        } else {
            dot.classList.remove('visible');
        }
    });
});

// Initial trigger to show elements already in view
window.dispatchEvent(new Event('scroll'));
