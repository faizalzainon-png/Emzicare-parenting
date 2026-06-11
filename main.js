/* ============================================================
   MUGLOVA — CINEMATIC SCROLL ENGINE
============================================================ */

gsap.registerPlugin(ScrollTrigger);

// ─── UTILS ────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const rand = (min, max) => Math.random() * (max - min) + min;
const lerp = (a, b, t) => a + (b - a) * t;

// ─── PRELOADER ────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    $('#preloader').classList.add('hidden');
    initAll();
  }, 800);
});

// ─── NAV scroll state ─────────────────────────────────────
window.addEventListener('scroll', () => {
  $('#nav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ─── MAIN INIT ────────────────────────────────────────────
function initAll() {
  initScene01();
  initScene02();
  initScene03();
  initScene04();
  initScene05();
  initScene06();
  initScene07();
  initFlavourCanvases();
  initCallouts();
  initParallaxLayers();
  initScrollTextReveal();
}

// ═══════════════════════════════════════════════════════════
// SCENE 01 — EMPTY MUG — extreme close-up, camera pulls back
// ═══════════════════════════════════════════════════════════
function initScene01() {
  const canvas = $('#canvas-01');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  // Particles for dust motes
  const motes = Array.from({ length: 35 }, () => ({
    x: rand(0, canvas.width),
    y: rand(0, canvas.height),
    r: rand(0.5, 2),
    speed: rand(0.1, 0.3),
    drift: rand(-0.2, 0.2),
    alpha: rand(0.1, 0.4),
  }));

  let scrollProgress = 0;
  ScrollTrigger.create({
    trigger: '#scene-01',
    start: 'top top',
    end: 'bottom top',
    onUpdate: self => { scrollProgress = self.progress; },
  });

  // Show opening text
  gsap.to('#opening-text', {
    opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 0.3
  });

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Camera pull-back: scale increases slightly then holds
    const camScale = 1 + (1 - scrollProgress) * 0.25;
    const cx = W / 2, cy = H / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(camScale, camScale);
    ctx.translate(-cx, -cy);

    // MUG — cinematic shot from above-slightly
    drawMug(ctx, W, H, {
      phase: 'empty',
      tiltX: scrollProgress * 8,  // slight tilt as scroll
      zOffset: 0,
    });

    // Sachet leaning against mug
    drawSachet(ctx, W, H, scrollProgress);

    ctx.restore();

    // Dust motes — atmospheric layer (no parallax, wraps scene)
    drawMotes(ctx, motes, W, H);

    // Light shaft from top-left
    drawLightShaft(ctx, W, H, { alpha: 0.06 + scrollProgress * 0.02 });

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 02 — POWDER POUR — camera low, looking up
// ═══════════════════════════════════════════════════════════
function initScene02() {
  const canvas = $('#canvas-02');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  ScrollTrigger.create({
    trigger: '#scene-02',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-02 .scene-content'),
  });

  // Powder particles
  const powderParticles = Array.from({ length: 80 }, (_, i) => ({
    x: rand(0.38, 0.62),   // normalised to canvas width
    startY: rand(-0.3, 0),
    speed: rand(0.003, 0.007),
    r: rand(1, 4),
    alpha: rand(0.4, 0.9),
    glow: Math.random() > 0.6,
    offset: rand(0, 1),
  }));

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // LOW camera angle — mug appears wider, bottom portion cut
    ctx.save();
    ctx.transform(1, 0, 0, 1, 0, H * 0.08 * (1 - progress));
    drawMug(ctx, W, H, { phase: 'powder', cameraLow: true });
    ctx.restore();

    // Powder stream
    drawPowderStream(ctx, W, H, powderParticles, progress);

    // Caustic light scatter
    if (progress > 0.1) drawCaustics(ctx, W, H, progress);

    // Light shaft brighter
    drawLightShaft(ctx, W, H, { alpha: 0.08 + progress * 0.04, x: 0.35 });

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 03 — WATER POUR — side angle 15°
// ═══════════════════════════════════════════════════════════
function initScene03() {
  const canvas = $('#canvas-03');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  ScrollTrigger.create({
    trigger: '#scene-03',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-03 .scene-content'),
  });

  // Steam particles
  const steamPts = Array.from({ length: 25 }, (_, i) => ({
    x: rand(0.44, 0.56),
    y: rand(0.35, 0.45),
    vx: rand(-0.0003, 0.0003),
    vy: -rand(0.0006, 0.0012),
    life: rand(0, 1),
    speed: rand(0.006, 0.012),
    r: rand(8, 20),
    alpha: rand(0.2, 0.5),
  }));

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Camera creeps forward: slight zoom
    const zoom = 1 + progress * 0.06;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    // Side angle — apply skew transform
    ctx.save();
    ctx.transform(1, -0.04, 0.02, 1, 0, 0);
    drawMug(ctx, W, H, { phase: 'water', fillLevel: progress });
    ctx.restore();

    ctx.restore();

    // Water ribbon
    if (progress > 0) drawWaterRibbon(ctx, W, H, progress);

    // Steam rises from mug
    if (progress > 0.2) drawSteam(ctx, W, H, steamPts, progress);

    // Spotlight from above
    drawLightShaft(ctx, W, H, { alpha: 0.1, x: 0.5, angle: 90 });

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 04 — STIR — top-down bird's eye, camera rotates
// ═══════════════════════════════════════════════════════════
function initScene04() {
  const canvas = $('#canvas-04');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  let rotation = 0;
  ScrollTrigger.create({
    trigger: '#scene-04',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-04 .scene-content'),
  });

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    rotation += 0.004;

    // Top-down: mug as circle, camera rotates CW
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rotation * progress);  // rotates with scroll progress
    ctx.translate(-W / 2, -H / 2);

    drawMugTopDown(ctx, W, H, progress, rotation);

    ctx.restore();

    // Spoon
    drawSpoon(ctx, W, H, rotation, progress);

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 05 — MICROWAVE — outside looking in
// ═══════════════════════════════════════════════════════════
function initScene05() {
  const canvas = $('#canvas-05');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  let glowPhase = 0;
  ScrollTrigger.create({
    trigger: '#scene-05',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-05 .scene-content'),
  });

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    glowPhase += 0.02;

    // Slow zoom toward glass door
    const zoom = 1 + progress * 0.12;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    drawMicrowaveInterior(ctx, W, H, progress, glowPhase);

    ctx.restore();

    // Lens distortion rings on glass
    drawGlassDistortion(ctx, W, H, glowPhase);

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 06 — THE RISE — hero moment, front-on low
// ═══════════════════════════════════════════════════════════
function initScene06() {
  const canvas = $('#canvas-06');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  let t = 0;
  ScrollTrigger.create({
    trigger: '#scene-06',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-06 .rise-content'),
  });

  // Rise particles (sparkle / steam)
  const riseParticles = Array.from({ length: 40 }, () => ({
    x: rand(0.3, 0.7),
    y: rand(0.3, 0.6),
    r: rand(1, 5),
    alpha: rand(0.3, 0.8),
    speed: rand(0.003, 0.008),
    glow: Math.random() > 0.5,
    offset: rand(0, Math.PI * 2),
  }));

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.01;

    // Camera push in as cupcake rises
    const pushZoom = 1 + progress * 0.18;
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pushZoom, pushZoom);
    ctx.translate(-cx, -cy);

    drawCupcakeRise(ctx, W, H, progress, t);

    ctx.restore();

    // Golden hour light flood
    const lightAlpha = progress * 0.18;
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.8, 0, W * 0.5, H * 0.8, W * 0.7);
    grad.addColorStop(0, `rgba(200,146,42,${lightAlpha})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Sparkle particles
    drawRiseSparkles(ctx, W, H, riseParticles, t, progress);

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SCENE 07 — SPOON BREAKS SURFACE — extreme close-up
// ═══════════════════════════════════════════════════════════
function initScene07() {
  const canvas = $('#canvas-07');
  const ctx = canvas.getContext('2d');
  resize(canvas);

  let progress = 0;
  let orbitAngle = 0;
  ScrollTrigger.create({
    trigger: '#scene-07',
    start: 'top 80%',
    end: 'bottom 20%',
    onUpdate: self => { progress = self.progress; },
    onEnter: () => showContent('#scene-07 .scene-content'),
  });

  const steamPts = Array.from({ length: 20 }, () => ({
    x: rand(0.44, 0.56),
    y: 0.38,
    life: rand(0, 1),
    r: rand(6, 16),
    alpha: rand(0.3, 0.7),
  }));

  function draw() {
    resize(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    orbitAngle += 0.005;

    // 15° orbit around the cupcake
    const orbitX = Math.sin(orbitAngle) * W * 0.03;
    ctx.save();
    ctx.translate(orbitX, 0);

    drawCupcakeCloseup(ctx, W, H, progress);
    drawGoldSpoon(ctx, W, H, progress, orbitAngle);
    drawMoltenCenter(ctx, W, H, progress);

    ctx.restore();

    // Backlit steam toward lens
    drawBacklitSteam(ctx, W, H, steamPts, progress);

    drawLightShaft(ctx, W, H, { alpha: 0.07, x: 0.35 });

    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// FLAVOUR CANVAS — ambient animated backgrounds
// ═══════════════════════════════════════════════════════════
function initFlavourCanvases() {
  const configs = [
    { id: 'canvas-choc',  palette: ['#C8922A','#E8B84B','#6B3210'], botanicals: 'choc' },
    { id: 'canvas-pista', palette: ['#4A7A2A','#7AB840','#1A3A1A'], botanicals: 'pista' },
    { id: 'canvas-coffee',palette: ['#B06A20','#E8903A','#2A1200'], botanicals: 'coffee' },
  ];

  configs.forEach(cfg => {
    const canvas = $(`#${cfg.id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    resizeFlavour(canvas);

    const orbs = Array.from({ length: 5 }, () => ({
      x: rand(0.2, 0.8), y: rand(0.2, 0.8),
      r: rand(0.1, 0.25),
      speed: rand(0.001, 0.003),
      phase: rand(0, Math.PI * 2),
    }));

    const particles = Array.from({ length: 30 }, () => ({
      x: rand(0, 1), y: rand(0, 1),
      r: rand(1, 4), alpha: rand(0.2, 0.6),
      speed: rand(0.0005, 0.0015),
      color: cfg.palette[Math.floor(Math.random() * cfg.palette.length)],
    }));

    let t = 0;
    function drawFlavour() {
      resizeFlavour(canvas);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Dark bg
      ctx.fillStyle = '#050302';
      ctx.fillRect(0, 0, W, H);

      // Orbs
      orbs.forEach(orb => {
        const ox = (orb.x + Math.sin(t * orb.speed * 100 + orb.phase) * 0.05) * W;
        const oy = (orb.y + Math.cos(t * orb.speed * 80 + orb.phase) * 0.04) * H;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * Math.min(W, H));
        grad.addColorStop(0, cfg.palette[0] + '20');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // Particles
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -0.05) p.y = 1.05;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      requestAnimationFrame(drawFlavour);
    }
    drawFlavour();
  });
}

// ═══════════════════════════════════════════════════════════
// DRAW HELPERS
// ═══════════════════════════════════════════════════════════

function drawMug(ctx, W, H, opts = {}) {
  const {
    phase = 'empty',
    cameraLow = false,
    fillLevel = 0,
    tiltX = 0,
  } = opts;

  const cx = W * 0.5;
  const cy = H * 0.52;
  const mw = Math.min(W, H) * 0.22;
  const mh = mw * 1.35;

  ctx.save();
  ctx.translate(cx, cy + tiltX * 2);

  // --- Mug body ---
  ctx.beginPath();
  ctx.moveTo(-mw * 0.45, -mh * 0.5);
  ctx.lineTo(-mw * 0.5, mh * 0.5);
  ctx.quadraticCurveTo(0, mh * 0.6, mw * 0.5, mh * 0.5);
  ctx.lineTo(mw * 0.45, -mh * 0.5);
  ctx.closePath();

  // ceramic gradient
  const bodyGrad = ctx.createLinearGradient(-mw * 0.5, 0, mw * 0.5, 0);
  bodyGrad.addColorStop(0, '#1A0A04');
  bodyGrad.addColorStop(0.35, '#2A1206');
  bodyGrad.addColorStop(0.65, '#1A0A04');
  bodyGrad.addColorStop(1, '#0D0602');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // rim light on right edge
  ctx.strokeStyle = 'rgba(232,232,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // key light on left edge
  ctx.save();
  ctx.clip();
  const edgeLight = ctx.createLinearGradient(-mw * 0.5, 0, -mw * 0.2, 0);
  edgeLight.addColorStop(0, 'rgba(200,146,42,0.12)');
  edgeLight.addColorStop(1, 'transparent');
  ctx.fillStyle = edgeLight;
  ctx.fillRect(-mw * 0.55, -mh * 0.6, mw * 0.4, mh * 1.3);
  ctx.restore();

  // --- Rim ellipse (top opening) ---
  ctx.beginPath();
  ctx.ellipse(0, -mh * 0.5, mw * 0.45, mw * 0.12, 0, 0, Math.PI * 2);
  const rimGrad = ctx.createRadialGradient(0, -mh * 0.5, 0, 0, -mh * 0.5, mw * 0.45);
  rimGrad.addColorStop(0, '#1A0800');
  rimGrad.addColorStop(0.6, '#0D0500');
  rimGrad.addColorStop(1, '#050302');
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,146,42,0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // --- Interior (visible from above / side) ---
  if (phase !== 'empty') {
    // Fill based on phase
    const fillY = lerp(-mh * 0.4, mh * 0.3, fillLevel);
    ctx.save();
    // clip to mug shape
    ctx.beginPath();
    ctx.ellipse(0, -mh * 0.5, mw * 0.42, mw * 0.11, 0, 0, Math.PI * 2);
    ctx.clip();
    // fill colour based on phase
    const fills = {
      powder: 'rgba(90,40,10,0.6)',
      water:  'rgba(60,28,8,0.8)',
      batter: 'rgba(40,18,4,0.95)',
      cupcake:'rgba(120,60,20,1)',
    };
    ctx.fillStyle = fills[phase] || fills.powder;
    ctx.fillRect(-mw, -mh, mw * 2, mh * 2);
    ctx.restore();
  }

  // --- Handle ---
  ctx.beginPath();
  ctx.arc(mw * 0.52, 0, mw * 0.22, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.lineWidth = mw * 0.08;
  ctx.strokeStyle = '#1A0A04';
  ctx.stroke();
  ctx.lineWidth = mw * 0.04;
  ctx.strokeStyle = 'rgba(200,146,42,0.2)';
  ctx.stroke();

  // MUGLOVA branding on mug
  ctx.save();
  ctx.font = `${mw * 0.09}px 'Playfair Display', serif`;
  ctx.fillStyle = 'rgba(200,146,42,0.3)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('MUGLOVA', 0, mh * 0.1);
  ctx.restore();

  // Shadow on surface
  const shadowGrad = ctx.createEllipse
    ? null
    : ctx.createRadialGradient(0, mh * 0.55, 0, 0, mh * 0.6, mw * 0.7);
  if (shadowGrad) {
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(-mw, mh * 0.45, mw * 2, mw);
  }

  ctx.restore();
}

function drawMugTopDown(ctx, W, H, progress, rotation) {
  const cx = W * 0.5, cy = H * 0.5;
  const r = Math.min(W, H) * 0.2;

  // Outer rim circle
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.28, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,146,42,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Batter swirl
  ctx.save();
  ctx.translate(cx, cy);
  const batGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.88);
  batGrad.addColorStop(0, '#3A1800');
  batGrad.addColorStop(0.6, '#2A1000');
  batGrad.addColorStop(1, '#1A0800');
  ctx.fillStyle = batGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Swirl lines
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i / 3) * Math.PI * 2 + rotation * 2);
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const rr = (a / (Math.PI * 2)) * r * 0.85;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.28;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(120,60,20,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawSpoon(ctx, W, H, rotation, progress) {
  if (progress < 0.3) return;
  const cx = W * 0.5 + Math.sin(rotation) * W * 0.08;
  const cy = H * 0.5 - H * 0.05;
  const len = Math.min(W, H) * 0.35;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI * 0.25 + rotation * 0.5);

  // Handle
  const hGrad = ctx.createLinearGradient(0, -len * 0.5, 0, len * 0.3);
  hGrad.addColorStop(0, '#C8922A');
  hGrad.addColorStop(0.5, '#E8B84B');
  hGrad.addColorStop(1, '#C8922A');
  ctx.strokeStyle = hGrad;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.5);
  ctx.lineTo(0, len * 0.2);
  ctx.stroke();

  // Bowl of spoon
  ctx.beginPath();
  ctx.ellipse(0, len * 0.25, 10, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E8B84B';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawSachet(ctx, W, H, progress) {
  const cx = W * 0.5 + Math.min(W, H) * 0.14;
  const cy = H * 0.53 - progress * H * 0.05;
  const sw = Math.min(W, H) * 0.06;
  const sh = Math.min(W, H) * 0.14;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.18 - progress * 0.06);

  // Sachet body
  ctx.beginPath();
  ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 3);
  ctx.fillStyle = '#8B1A1A';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,100,100,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label text area
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(-sw * 0.4, -sh * 0.15, sw * 0.8, sh * 0.35);

  // M logo
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `bold ${sw * 0.5}px 'Playfair Display', serif`;
  ctx.textAlign = 'center';
  ctx.fillText('M', 0, sh * 0.1);

  ctx.restore();
}

function drawPowderStream(ctx, W, H, particles, progress) {
  if (progress < 0.05) return;
  const cx = W * 0.5;
  const startY = H * 0.0;
  const endY = H * 0.45;

  // Main stream
  ctx.save();
  const streamGrad = ctx.createLinearGradient(0, startY, 0, endY);
  streamGrad.addColorStop(0, 'rgba(160,80,20,0)');
  streamGrad.addColorStop(0.3, 'rgba(180,100,30,0.6)');
  streamGrad.addColorStop(0.8, 'rgba(120,60,15,0.4)');
  streamGrad.addColorStop(1, 'rgba(80,30,10,0)');
  ctx.strokeStyle = streamGrad;
  ctx.lineWidth = 4 + Math.sin(Date.now() * 0.003) * 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + Math.sin(Date.now() * 0.001) * 3, startY);
  ctx.quadraticCurveTo(
    cx + Math.sin(Date.now() * 0.002) * 8,
    (startY + endY) / 2,
    cx + Math.sin(Date.now() * 0.0015) * 4,
    endY
  );
  ctx.stroke();
  ctx.restore();

  // Particles falling
  particles.forEach(p => {
    const elapsed = ((Date.now() * p.speed * 0.001) + p.offset) % 1;
    const py = lerp(startY - H * 0.1, endY + H * 0.05, elapsed);
    const px = (p.x + Math.sin(elapsed * 8) * 0.02) * W;
    const alpha = p.alpha * Math.sin(elapsed * Math.PI);

    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);

    if (p.glow) {
      const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
      g.addColorStop(0, `rgba(220,140,40,${alpha})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.arc(px, py, p.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
    }

    ctx.fillStyle = `rgba(180,90,25,${alpha})`;
    ctx.fill();
  });
}

function drawCaustics(ctx, W, H, progress) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const t = Date.now() * 0.001 + i;
    const x = W * 0.5 + Math.sin(t * 1.3 + i) * W * 0.08;
    const y = H * 0.42 + Math.sin(t * 0.9 + i * 2) * H * 0.05;
    const r = 3 + Math.sin(t + i) * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,160,60,${0.08 * progress})`;
    ctx.fill();
  }
}

function drawWaterRibbon(ctx, W, H, progress) {
  const x = W * 0.5 + W * 0.08;
  const startY = H * 0.05;
  const endY = H * 0.44;
  const t = Date.now() * 0.002;

  ctx.save();
  // Water ribbon
  ctx.beginPath();
  const ribbonW = 6 + Math.sin(t) * 2;
  ctx.moveTo(x - ribbonW / 2 + Math.sin(t) * 3, startY);
  for (let i = 0; i <= 20; i++) {
    const y = startY + (endY - startY) * (i / 20);
    const wave = Math.sin(t + i * 0.5) * 3;
    ctx.lineTo(x - ribbonW / 2 + wave, y);
  }
  for (let i = 20; i >= 0; i--) {
    const y = startY + (endY - startY) * (i / 20);
    const wave = Math.sin(t + i * 0.5) * 3;
    ctx.lineTo(x + ribbonW / 2 + wave, y);
  }
  ctx.closePath();

  const wGrad = ctx.createLinearGradient(0, startY, 0, endY);
  wGrad.addColorStop(0, 'rgba(180,220,255,0.8)');
  wGrad.addColorStop(0.4, 'rgba(160,200,240,0.6)');
  wGrad.addColorStop(1, 'rgba(200,160,100,0.4)');
  ctx.fillStyle = wGrad;
  ctx.fill();

  // Specular highlight on ribbon
  ctx.beginPath();
  ctx.moveTo(x + Math.sin(t) * 2, startY);
  ctx.lineTo(x + Math.sin(t + 1) * 2, endY * 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawSteam(ctx, W, H, pts, progress) {
  pts.forEach(p => {
    p.life += p.speed;
    if (p.life > 1) {
      p.life = 0;
      p.x = rand(0.44, 0.56);
    }
    const px = (p.x + Math.sin(p.life * 4) * 0.02) * W;
    const py = (p.y - p.life * 0.15) * H;
    const alpha = p.alpha * Math.sin(p.life * Math.PI) * progress;

    const g = ctx.createRadialGradient(px, py, 0, px, py, p.r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMicrowaveInterior(ctx, W, H, progress, glowPhase) {
  const mw = Math.min(W * 0.55, 700);
  const mh = mw * 0.65;
  const mx = (W - mw) / 2;
  const my = (H - mh) / 2;

  // Interior walls — warm orange glow
  const pulseAlpha = 0.2 + Math.sin(glowPhase) * 0.08;
  const intGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, mw * 0.5);
  intGrad.addColorStop(0, `rgba(220,110,20,${pulseAlpha})`);
  intGrad.addColorStop(0.5, `rgba(150,60,10,${pulseAlpha * 0.5})`);
  intGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = intGrad;
  ctx.fillRect(mx, my, mw, mh);

  // Mug inside microwave
  ctx.save();
  ctx.translate(W * 0.5, H * 0.52);
  const mugScale = 0.55;
  ctx.scale(mugScale, mugScale);
  ctx.translate(-W * 0.5, -H * 0.52);
  drawMug(ctx, W, H, { phase: 'batter' });
  ctx.restore();

  // Orange glow leaking edges
  ['left','right','top','bottom'].forEach(edge => {
    let gx1, gy1, gx2, gy2;
    if (edge === 'left')   { gx1=mx; gy1=H/2; gx2=mx+30; gy2=H/2; }
    if (edge === 'right')  { gx1=mx+mw; gy1=H/2; gx2=mx+mw-30; gy2=H/2; }
    if (edge === 'top')    { gx1=W/2; gy1=my; gx2=W/2; gy2=my+30; }
    if (edge === 'bottom') { gx1=W/2; gy1=my+mh; gx2=W/2; gy2=my+mh-30; }
    const eg = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    eg.addColorStop(0, `rgba(220,110,20,${0.15 + Math.sin(glowPhase) * 0.05})`);
    eg.addColorStop(1, 'transparent');
    ctx.fillStyle = eg;
    ctx.fillRect(mx, my, mw, mh);
  });

  // Timer green glow (top right of microwave frame)
  ctx.save();
  ctx.fillStyle = `rgba(40,200,80,${0.15 + Math.sin(glowPhase * 1.5) * 0.05})`;
  ctx.fillRect(mx + mw - 80, my + 10, 60, 30);
  ctx.fillStyle = 'rgba(40,200,80,0.7)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('0:90', mx + mw - 50, my + 30);
  ctx.restore();
}

function drawGlassDistortion(ctx, W, H, phase) {
  // Subtle rings on the glass surface
  const rings = 3;
  for (let i = 0; i < rings; i++) {
    const r = (Math.min(W, H) * 0.25) * (i + 1) / rings;
    const alpha = 0.03 - i * 0.008;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, r + Math.sin(phase + i) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCupcakeRise(ctx, W, H, progress, t) {
  const cx = W * 0.5;
  const baseY = H * 0.75;
  const riseAmount = progress * H * 0.18;
  const cy = baseY - riseAmount;
  const mw = Math.min(W, H) * 0.22;

  // Mug base
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 1);
  ctx.translate(-cx, -cy);
  drawMug(ctx, W, H, { phase: 'cupcake' });
  ctx.restore();

  // Cupcake dome rising above rim
  const domeH = Math.min(mw * 1.2, progress * mw * 2.5);
  const domeY = cy - mw * 0.5 * 0.5 - domeH * 0.5;

  // Dome shadow/depth
  const shadowGrad = ctx.createEllipse
    ? null
    : ctx.createRadialGradient(cx, domeY + domeH * 0.6, mw * 0.1, cx, domeY, mw * 0.7);
  if (shadowGrad) {
    shadowGrad.addColorStop(0, 'rgba(200,120,40,0.3)');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, domeY + domeH * 0.3, mw * 0.6, domeH * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dome body
  ctx.beginPath();
  ctx.ellipse(cx, domeY, mw * 0.5, domeH * 0.5, 0, 0, Math.PI * 2);
  const domeGrad = ctx.createRadialGradient(
    cx - mw * 0.1, domeY - domeH * 0.2, 0,
    cx, domeY, mw * 0.55
  );
  domeGrad.addColorStop(0, '#C87840');
  domeGrad.addColorStop(0.4, '#8B4520');
  domeGrad.addColorStop(0.8, '#5A2A10');
  domeGrad.addColorStop(1, '#2A1200');
  ctx.fillStyle = domeGrad;
  ctx.fill();

  // Specular highlight on dome top
  ctx.save();
  ctx.clip();
  const specGrad = ctx.createRadialGradient(
    cx - mw * 0.12, domeY - domeH * 0.25, 0,
    cx - mw * 0.12, domeY - domeH * 0.25, mw * 0.2
  );
  specGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  specGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.ellipse(cx, domeY, mw * 0.5, domeH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Surface texture cracks (baked lines)
  if (progress > 0.5) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, domeY, mw * 0.5, domeH * 0.5, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + t;
      ctx.beginPath();
      ctx.moveTo(cx, domeY);
      ctx.quadraticCurveTo(
        cx + Math.cos(angle) * mw * 0.2,
        domeY + Math.sin(angle) * domeH * 0.2,
        cx + Math.cos(angle) * mw * 0.45,
        domeY + Math.sin(angle) * domeH * 0.45
      );
      ctx.strokeStyle = 'rgba(40,15,5,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCupcakeCloseup(ctx, W, H, progress) {
  const cx = W * 0.5;
  const cy = H * 0.55;
  const mw = Math.min(W, H) * 0.3;

  // Large close-up mug
  ctx.save();
  ctx.translate(cx, cy);
  const scale = 1.3 + progress * 0.1;
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  drawMug(ctx, W, H, { phase: 'cupcake' });
  ctx.restore();
}

function drawGoldSpoon(ctx, W, H, progress, orbit) {
  const cx = W * 0.5 + Math.sin(orbit) * W * 0.04;
  const cy = H * 0.4 - progress * H * 0.08;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI * 0.3 + Math.sin(orbit) * 0.1);

  // Spoon depth push
  const depth = progress;
  const spoonLen = Math.min(W, H) * 0.3;

  // Handle glow
  const hg = ctx.createLinearGradient(0, -spoonLen * 0.4, 0, spoonLen * 0.1);
  hg.addColorStop(0, 'rgba(200,146,42,0.4)');
  hg.addColorStop(0.5, '#E8B84B');
  hg.addColorStop(1, '#C8922A');
  ctx.strokeStyle = hg;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(200,146,42,0.4)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -spoonLen * 0.4);
  ctx.lineTo(0, spoonLen * 0.05);
  ctx.stroke();

  // Spoon bowl entering cupcake
  ctx.beginPath();
  ctx.ellipse(0, spoonLen * 0.1, 12, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#F0C050';
  ctx.shadowColor = 'rgba(200,146,42,0.6)';
  ctx.shadowBlur = 20;
  ctx.fill();

  // Specular on spoon bowl
  ctx.beginPath();
  ctx.ellipse(-3, spoonLen * 0.08, 4, 2.5, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 0;
  ctx.fill();

  ctx.restore();
}

function drawMoltenCenter(ctx, W, H, progress) {
  if (progress < 0.3) return;
  const cx = W * 0.5;
  const cy = H * 0.5 + H * 0.01;
  const r = Math.min(W, H) * 0.04 * progress;

  // Molten glow
  const mg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
  mg.addColorStop(0, `rgba(255,200,80,${0.8 * progress})`);
  mg.addColorStop(0.3, `rgba(220,120,30,${0.5 * progress})`);
  mg.addColorStop(1, 'transparent');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,210,80,${progress})`;
  ctx.fill();
}

function drawBacklitSteam(ctx, W, H, pts, progress) {
  pts.forEach(p => {
    p.life = (p.life + 0.008) % 1;
    const px = (p.x + Math.sin(p.life * 6) * 0.025) * W;
    const py = (0.45 - p.life * 0.2) * H;
    const alpha = p.alpha * Math.sin(p.life * Math.PI) * progress;
    const radius = p.r * (1 + p.life * 0.8);

    // Backlit: rim of steam glows white-gold against dark
    const sg = ctx.createRadialGradient(px, py, 0, px, py, radius);
    sg.addColorStop(0, `rgba(255,255,255,${alpha * 0.3})`);
    sg.addColorStop(0.5, `rgba(240,220,180,${alpha * 0.15})`);
    sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLightShaft(ctx, W, H, { alpha = 0.05, x = 0.3, angle = 135 } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const sx = W * x;
  const grad = ctx.createLinearGradient(sx, 0, sx + W * 0.3, H);
  grad.addColorStop(0, `rgba(200,146,42,${alpha})`);
  grad.addColorStop(0.5, `rgba(200,146,42,${alpha * 0.4})`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(sx - 20, 0);
  ctx.lineTo(sx + 20, 0);
  ctx.lineTo(sx + W * 0.35, H);
  ctx.lineTo(sx + W * 0.28, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMotes(ctx, motes, W, H) {
  motes.forEach(m => {
    m.y -= m.speed;
    m.x += m.drift;
    if (m.y < -5) { m.y = H + 5; m.x = rand(0, W); }
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,146,42,${m.alpha})`;
    ctx.fill();
  });
}

function drawRiseSparkles(ctx, W, H, particles, t, progress) {
  particles.forEach((p, i) => {
    const px = (p.x + Math.sin(t + p.offset) * 0.04) * W;
    const py = (p.y + Math.cos(t * 0.7 + p.offset) * 0.03) * H;
    const flicker = 0.5 + Math.sin(t * 3 + i) * 0.5;
    const alpha = p.alpha * flicker * progress;

    if (p.glow) {
      const sg = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4);
      sg.addColorStop(0, `rgba(232,184,75,${alpha})`);
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, p.r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,100,${alpha})`;
    ctx.fill();
  });
}

// ─── SCROLL TEXT REVEAL ───────────────────────────────────
function showContent(selector) {
  const el = $(selector);
  if (el) el.classList.add('visible');
}

function initScrollTextReveal() {
  $$('.flavour-card').forEach(card => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 70%',
      onEnter: () => {
        const content = card.querySelector('.flavour-content');
        if (content) {
          gsap.fromTo(content,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
          );
        }
      },
    });
  });

  // Nutrition numbers count up
  ScrollTrigger.create({
    trigger: '#nutrition',
    start: 'top 70%',
    onEnter: () => {
      $$('.nut-item').forEach((item, i) => {
        gsap.fromTo(item,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: i * 0.15, ease: 'power2.out' }
        );
      });
    },
  });

  // CTA reveal
  ScrollTrigger.create({
    trigger: '#cta',
    start: 'top 70%',
    onEnter: () => {
      gsap.fromTo('.cta-inner',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }
      );
    },
  });
}

// ─── CALLOUTS ─────────────────────────────────────────────
function initCallouts() {
  $$('.callout-item').forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 85%',
      onEnter: () => {
        setTimeout(() => item.classList.add('visible'), i * 120);
      },
    });
  });
}

// ─── PARALLAX LAYERS ──────────────────────────────────────
function initParallaxLayers() {
  // Botanical floating elements per scene
  const scenes = [
    { id: 'botanicals-01', elements: getBotanicalEls('choc', 6) },
    { id: 'botanicals-02', elements: getBotanicalEls('choc', 5) },
    { id: 'botanicals-03', elements: getBotanicalEls('pista', 5) },
    { id: 'botanicals-06', elements: getBotanicalEls('coffee', 6) },
  ];

  scenes.forEach(scene => {
    const container = $(`#${scene.id}`);
    if (!container) return;
    scene.elements.forEach(el => container.appendChild(el));
  });

  // Mouse parallax
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function animateParallax() {
    $$('[data-depth]').forEach(layer => {
      const depth = parseFloat(layer.dataset.depth);
      const tx = mx * depth * 60;
      const ty = my * depth * 40;
      layer.style.transform = `translate(${tx}px, ${ty}px)`;
    });
    requestAnimationFrame(animateParallax);
  }
  animateParallax();
}

function getBotanicalEls(type, count) {
  const colours = {
    choc: ['rgba(200,146,42,0.12)', 'rgba(107,50,16,0.15)', 'rgba(232,184,75,0.08)'],
    pista: ['rgba(74,122,42,0.12)', 'rgba(26,58,26,0.15)', 'rgba(122,184,64,0.08)'],
    coffee: ['rgba(176,106,32,0.12)', 'rgba(42,18,0,0.15)', 'rgba(200,100,30,0.08)'],
  };
  const cols = colours[type] || colours.choc;
  const els = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${rand(40, 120)}px;
      height: ${rand(40, 120)}px;
      left: ${rand(5, 90)}%;
      top: ${rand(10, 85)}%;
      border-radius: ${Math.random() > 0.5 ? '50%' : '30% 70% 60% 40% / 40% 60% 50% 50%'};
      background: ${cols[i % cols.length]};
      filter: blur(${rand(4, 16)}px);
      pointer-events: none;
      animation: floatBotanical ${rand(6, 14)}s ease-in-out ${rand(0, 6)}s infinite alternate;
    `;
    els.push(el);
  }
  return els;
}

// ─── CSS KEYFRAME for botanicals ──────────────────────────
const style = document.createElement('style');
style.textContent = `
@keyframes floatBotanical {
  0%   { transform: translateY(0px) rotate(0deg) scale(1); }
  100% { transform: translateY(-25px) rotate(8deg) scale(1.05); }
}
`;
document.head.appendChild(style);

// ─── RESIZE HELPERS ───────────────────────────────────────
function resize(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
  }
}
function resizeFlavour(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width || 600;
    canvas.height = rect.height || 600;
  }
}
