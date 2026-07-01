const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 3D Grid Canvas Animation (Qminded-inspired)
const canvas = document.getElementById('dotCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let time = 0;
    function animateCanvas() {
        ctx.clearRect(0, 0, width, height);
        time += 0.015; // Speed of wave

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

        for (let x = -30; x < 30; x++) {
            for (let z = 5; z < 50; z++) { // z depth
                let x3d = x * 80;
                let z3d = z * 80 - (time * 80) % 80;
                let y3d = Math.sin(x3d * 0.01 + time) * Math.cos(z3d * 0.01 + time) * 120;

                let scale = 900 / (900 + z3d);
                let x2d = width / 2 + x3d * scale;
                let y2d = height / 2 + y3d * scale + 150;

                if (x2d > 0 && x2d < width && y2d > 0 && y2d < height) {
                    let size = scale * 2.5;
                    ctx.globalAlpha = Math.max(0, 1 - z3d / 3500);
                    ctx.beginPath();
                    ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        requestAnimationFrame(animateCanvas);
    }
    // Start animation only if not reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animateCanvas();
    }
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
