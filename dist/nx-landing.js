import './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
// NEPTUNI · Portada viva: estrellas que se agrupan alrededor del cursor (o del dedo)
// y transición con desenfoque entre la portada y la misión destacada.
const canvas = document.getElementById('nx-stars');
const landing = document.getElementById('nx-landing');
const feature = document.getElementById('nx-feature');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------ Estrellas */
const ctx = canvas.getContext('2d');
// Colores desde la paleta (nx-theme.css: --nx-stars, --nx-stars-line, --nx-stars-glow, --nx-stars-size).
let COLORS = ['255,255,255', '108,242,203', '147,180,255', '255,201,74'], LINE = '108,242,203', GLOW = '54,226,176', SIZE = 1;
function readPalette() {
  const css = getComputedStyle(document.documentElement), v = name => css.getPropertyValue(name).trim();
  if (v('--nx-stars')) COLORS = v('--nx-stars').split('|').map(s => s.trim());
  LINE = v('--nx-stars-line') || LINE; GLOW = v('--nx-stars-glow') || GLOW;
  SIZE = parseFloat(v('--nx-stars-size')) || 1;
}
let W = 0, H = 0, dpr = 1, stars = [], running = false, raf = 0, visible = true;
const pointer = {x: -9999, y: -9999, active: false, pull: 0};

function resize() {
  const r = landing.getBoundingClientRect();
  readPalette();
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(260, Math.max(90, W * H / 5200)));
  stars = Array.from({length: n}, () => {
    const x = Math.random() * W, y = Math.random() * H;
    return {x, y, hx: x, hy: y, vx: 0, vy: 0, r: (Math.random() * 1.5 + .4) * SIZE,
      c: COLORS[Math.random() < .72 ? 0 : 1 + Math.floor(Math.random() * 3)],
      tw: Math.random() * Math.PI * 2, sp: .6 + Math.random() * 1.4,
      dx: (Math.random() - .5) * .12, dy: (Math.random() - .5) * .08};
  });
  if (reduced.matches) draw(0);
}

function step(t) {
  pointer.pull += ((pointer.active ? 1 : 0) - pointer.pull) * .06;
  const R = Math.min(260, Math.max(150, W * .17));
  for (const s of stars) {
    // deriva lenta de fondo
    s.hx += s.dx; s.hy += s.dy;
    if (s.hx < -10) s.hx = W + 10; if (s.hx > W + 10) s.hx = -10;
    if (s.hy < -10) s.hy = H + 10; if (s.hy > H + 10) s.hy = -10;
    let tx = s.hx, ty = s.hy;
    const dx = pointer.x - s.hx, dy = pointer.y - s.hy, d = Math.hypot(dx, dy);
    if (pointer.pull > .01 && d < R * 1.6) {
      // se agrupan en un anillo alrededor del cursor, girando suavemente
      const k = (1 - d / (R * 1.6)) * pointer.pull;
      const ang = Math.atan2(s.hy - pointer.y, s.hx - pointer.x) + t * .00035 * s.sp;
      const ring = 26 + (d / (R * 1.6)) * R * .55;
      tx = s.hx + (pointer.x + Math.cos(ang) * ring - s.hx) * k;
      ty = s.hy + (pointer.y + Math.sin(ang) * ring - s.hy) * k;
    }
    s.vx = (s.vx + (tx - s.x) * .045) * .84;
    s.vy = (s.vy + (ty - s.y) * .045) * .84;
    s.x += s.vx; s.y += s.vy;
  }
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  // líneas de constelación cerca del cursor
  if (pointer.pull > .05) {
    const near = stars.filter(s => Math.hypot(s.x - pointer.x, s.y - pointer.y) < 170);
    ctx.lineWidth = .7;
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      const a = near[i], b = near[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 58) { ctx.strokeStyle = `rgba(${LINE},${(1 - d / 58) * .45 * pointer.pull})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 120);
    g.addColorStop(0, `rgba(${GLOW},${.16 * pointer.pull})`); g.addColorStop(1, `rgba(${GLOW},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 120, 0, Math.PI * 2); ctx.fill();
  }
  for (const s of stars) {
    const a = .45 + .55 * Math.abs(Math.sin(s.tw + t * .0012 * s.sp));
    ctx.fillStyle = `rgba(${s.c},${a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    if (s.r > 1.5 * SIZE) { ctx.fillStyle = `rgba(${s.c},${a * .18})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2); ctx.fill(); }
  }
}

function loop(t) {
  raf = 0;
  if (!running) return;
  step(t); draw(t);
  raf = requestAnimationFrame(loop);
}
function sync() {
  const should = visible && !document.hidden && !reduced.matches && document.body.dataset.view === 'inicio';
  if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
  if (!should) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
}

function setPointer(e, active) {
  const r = canvas.getBoundingClientRect();
  pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = active;
}
landing.addEventListener('pointermove', e => setPointer(e, true));
landing.addEventListener('pointerdown', e => setPointer(e, true));
landing.addEventListener('pointerleave', () => { pointer.active = false; });
landing.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer.active = false; });

new ResizeObserver(resize).observe(landing);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(landing);
document.addEventListener('visibilitychange', sync);
reduced.addEventListener?.('change', sync);
new MutationObserver(sync).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
resize(); sync();

/* ------------------------------------------------------------ Transición portada → Sojourner */
// Al bajar, la portada se desenfoca y se aleja; Sojourner pasa de borroso a nítido.
const clamp = v => Math.max(0, Math.min(1, v));
let ticking = false;
function transition() {
  ticking = false;
  if (document.body.dataset.view !== 'inicio' || reduced.matches) {
    landing.style.removeProperty('--leave'); feature.style.removeProperty('--enter'); return;
  }
  const vh = innerHeight, lr = landing.getBoundingClientRect(), fr = feature.getBoundingClientRect();
  const leave = clamp(-lr.top / (lr.height * .85));
  const enter = clamp((vh - fr.top) / (vh * .8));
  landing.style.setProperty('--leave', leave.toFixed(3));
  feature.style.setProperty('--enter', enter.toFixed(3));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(transition); } }, {passive: true});
addEventListener('resize', transition);
new MutationObserver(transition).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
transition();
