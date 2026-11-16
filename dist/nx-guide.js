// NEPTUNI · Neptunito guía.
// Vive sobre todo el escenario de la ficha (columna del chat + visor 3D), así que puede entrar desde el chat,
// salir por encima del visor y pararse sobre su marco. Cada uno de los cuatro temas tiene su propia escena:
//   1 ¿Qué es lo que ves?        → baja del techo colgado de una cuerda y examina las piezas con su lupa.
//   2 ¿Cuál fue su misión?       → se pone el casco, despega agarrado a un cohete y baja en paracaídas.
//   3 Descubrimientos o hallazgos → cae un bloque de regolito, se sube con su salacot de arqueólogo y celebra cada hallazgo.
//   4 Sistemas de la nave        → se cuelga del marco del visor, se pone el casco de obra y vuela con su mochila cohete.
// Al terminar un tema se sube sobre el marco del visor y saluda (v11: sin chullo ni poncho).
import {FRAME_MANIFEST} from './neptunito-anim/src/frame-manifest.js';

const BASE = new URL('./neptunito-anim/assets/', import.meta.url).href;
const C = FRAME_MANIFEST.canvas, FR = FRAME_MANIFEST.frames;
const WALK = [1, 2, 3, 4, 5, 6, 7, 8].map(n => 'caminata_0' + n);
const POSE = {
  idle: ['gestos_13', 'gestos_16'], talk: ['gestos_14', 'gestos_15', 'gestos_08', 'gestos_07', 'gestos_13'],
  point: ['gestos_04', 'gestos_14'], joy: ['gestos_06'], wave: ['gestos_15'], think: ['gestos_05'],
  crouch: ['entrada_06'], air: ['entrada_05'], fly: ['entrada_04'], hang: ['gestos_06'], chute: ['gestos_06'], ride: ['gestos_06']
};
const FRAMES = [...new Set([...WALK, ...Object.values(POSE).flat()])];
const FINGER = {x: 96, y: -210};     // punta del dedo levantado (gestos_04 / gestos_14), px del lienzo
const FIST = {x: 86, y: -184};       // puño de la mano que señala
const HAND_R = {x: 100, y: -203};    // mano derecha alzada (gestos_06)
const LENS = {x: 124, y: -250};      // centro de la lupa
// (Sin uso desde v11: antes activaba el chullo y el poncho.)
const CULTURE = /cultur|tradici|bandera|humanidad|homenaje|en su honor|en honor|millones de personas|muchos pa[ií]ses|todo el mundo/i;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const easeOut = t => 1 - (1 - t) ** 3;
const easeIn = t => t * t * t;
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const CANCEL = Symbol('cancel');

/* ------------------------------------------------------------------ dibujos (SVG originales) */
const ACC = {
  chullo: {anchor: 'crown', w: 190, h: 162, dx: -95, dy: -62, svg: `
    <path d="M20 90 L15 128 Q26 142 42 130 L52 98Z" fill="#d7263d" stroke="#3b1d24" stroke-width="4"/>
    <path d="M170 90 L175 128 Q164 142 148 130 L138 98Z" fill="#d7263d" stroke="#3b1d24" stroke-width="4"/>
    <path d="M28 136 L26 152M162 136 L164 152" stroke="#f6c026" stroke-width="4"/><circle cx="26" cy="155" r="5" fill="#f6c026"/><circle cx="164" cy="155" r="5" fill="#f6c026"/>
    <path d="M14 100 Q14 26 95 20 Q176 26 176 100Z" fill="#d7263d" stroke="#3b1d24" stroke-width="4"/>
    <path d="M17 78 Q95 62 173 78 L175 96 Q95 80 15 96Z" fill="#26325a"/>
    <polyline points="20,90 32,80 44,90 56,80 68,89 80,79 92,88 104,79 116,88 128,79 140,89 152,80 164,90 174,82" fill="none" stroke="#f6c026" stroke-width="4"/>
    <path d="M32 56 Q95 40 158 56 L161 66 Q95 50 29 66Z" fill="#f6c026"/>
    <path d="M60 52 l6 -6 l6 6 l-6 6Z M89 46 l6 -6 l6 6 l-6 6Z M118 52 l6 -6 l6 6 l-6 6Z" fill="#fff7e8"/>
    <circle cx="95" cy="16" r="13" fill="#f6c026" stroke="#3b1d24" stroke-width="4"/>`},
  poncho: {anchor: 'torso', w: 200, h: 140, dx: -100, dy: -34, svg: `
    <path d="M66 6 L134 6 L196 116 Q100 136 4 116Z" fill="#c8213a" stroke="#3b1d24" stroke-width="4" stroke-linejoin="round"/>
    <path d="M44 46 L156 46 L166 62 L34 62Z" fill="#f6c026"/>
    <polyline points="38,54 50,48 62,58 74,48 86,58 98,48 110,58 122,48 134,58 146,48 160,56" fill="none" stroke="#26325a" stroke-width="4"/>
    <path d="M22 88 L178 88 L186 102 L14 102Z" fill="#26325a"/>
    <path d="M40 95 l7 -6 l7 6 l-7 6Z M90 95 l7 -6 l7 6 l-7 6Z M140 95 l7 -6 l7 6 l-7 6Z" fill="#fff7e8"/>
    <ellipse cx="100" cy="8" rx="36" ry="9" fill="#7d1424"/>
    <path d="M10 120 l-2 14 M30 124 l-1 13 M52 127 l-1 12 M76 129 l0 11 M100 130 l0 11 M124 129 l0 11 M148 127 l1 12 M170 124 l1 13 M190 120 l2 14" stroke="#f6c026" stroke-width="4" stroke-linecap="round"/>`},
  helmet: {anchor: 'head', w: 250, h: 262, dx: -125, dy: -124, svg: `
    <rect x="62" y="222" width="126" height="30" rx="14" fill="#d9dde8" stroke="#3b3f55" stroke-width="4"/>
    <rect x="70" y="232" width="110" height="8" rx="4" fill="#e2011c"/>
    <circle cx="125" cy="124" r="116" fill="rgba(170,235,255,.16)" stroke="rgba(255,255,255,.9)" stroke-width="6"/>
    <path d="M52 78 Q78 34 132 24" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="10" stroke-linecap="round"/>
    <path d="M196 170 Q206 150 208 128" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="6" stroke-linecap="round"/>`},
  hardhat: {anchor: 'crown', w: 196, h: 92, dx: -98, dy: -60, svg: `
    <path d="M30 70 Q30 8 98 6 Q166 8 166 70Z" fill="#f6c026" stroke="#3b2a05" stroke-width="4"/>
    <path d="M98 8 L98 66 M64 16 Q58 40 58 68 M132 16 Q138 40 138 68" stroke="#d99a06" stroke-width="5" fill="none"/>
    <rect x="8" y="64" width="180" height="16" rx="8" fill="#f6c026" stroke="#3b2a05" stroke-width="4"/>
    <rect x="80" y="30" width="36" height="14" rx="4" fill="#e2011c"/>`},
  salacot: {anchor: 'crown', w: 220, h: 100, dx: -110, dy: -64, svg: `
    <ellipse cx="110" cy="74" rx="104" ry="18" fill="#c9a36a" stroke="#4a3418" stroke-width="4"/>
    <path d="M42 72 Q42 10 110 8 Q178 10 178 72Z" fill="#e2c08a" stroke="#4a3418" stroke-width="4"/>
    <path d="M44 60 Q110 50 176 60 L176 70 Q110 60 44 70Z" fill="#e2011c"/>
    <circle cx="110" cy="10" r="7" fill="#c9a36a" stroke="#4a3418" stroke-width="3"/>`},
  lupa: {anchor: 'fist', w: 96, h: 124, dx: -16, dy: -106, svg: `
    <path d="M16 110 L44 70" stroke="#6b3d1e" stroke-width="13" stroke-linecap="round"/>
    <circle cx="56" cy="40" r="30" fill="rgba(200,240,255,.45)" stroke="#3b3f55" stroke-width="9"/>
    <path d="M40 30 Q46 20 58 18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`},
  jetpack: {anchor: 'back', w: 96, h: 126, dx: -64, dy: -92, back: true, svg: `
    <rect x="60" y="22" width="36" height="12" rx="5" fill="#e2011c" stroke="#5a0010" stroke-width="3"/>
    <rect x="60" y="62" width="36" height="12" rx="5" fill="#e2011c" stroke="#5a0010" stroke-width="3"/>
    <rect x="6" y="4" width="28" height="84" rx="12" fill="#c9ced9" stroke="#3b3f55" stroke-width="4"/>
    <rect x="42" y="4" width="28" height="84" rx="12" fill="#c9ced9" stroke="#3b3f55" stroke-width="4"/>
    <rect x="6" y="30" width="64" height="12" fill="#ffc300"/>
    <path d="M12 88 L28 88 L25 98 L15 98Z M48 88 L64 88 L61 98 L51 98Z" fill="#5a5f73"/>
    <g class="nx-jetflame"><path d="M14 98 Q20 128 26 98Z M50 98 Q56 128 62 98Z" fill="#ffb02e"/><path d="M17 98 Q20 116 23 98Z M53 98 Q56 116 59 98Z" fill="#fff3b0"/></g>`}
};
const CHUTE_SVG = `
  <path d="M75 370 L32 92 M75 370 L110 98 M268 342 L230 98 M268 342 L308 92" stroke="#e8f3ff" stroke-width="3"/>
  <path d="M20 92 Q170 -40 320 92 Q295 80 270 96 Q245 82 220 98 Q195 84 170 100 Q145 84 120 98 Q95 82 70 96 Q45 80 20 92Z" fill="#e2011c" stroke="#5a0010" stroke-width="5" stroke-linejoin="round"/>
  <path d="M70 96 Q90 20 120 98 M170 100 Q170 -10 170 100 M220 98 Q250 20 270 96" fill="#fff7e8" stroke="#5a0010" stroke-width="4"/>
  <path d="M120 98 Q140 6 170 100Z M220 98 Q200 6 170 100Z" fill="#ffc300" stroke="#5a0010" stroke-width="4"/>`;
const ROCKET_SVG = `
  <g class="nx-rocket-flame"><path d="M26 160 Q40 214 54 160Z" fill="#ff7a45"/><path d="M31 160 Q40 196 49 160Z" fill="#ffd166"/></g>
  <path d="M16 112 L0 162 L18 150Z M64 112 L80 162 L62 150Z" fill="#e2384f" stroke="#3b1d24" stroke-width="3" stroke-linejoin="round"/>
  <rect x="25" y="148" width="30" height="13" rx="3" fill="#5a5f73" stroke="#2b2e3d" stroke-width="3"/>
  <path d="M16 60 L64 60 L64 150 L16 150Z" fill="#f4f6fb" stroke="#3b3f55" stroke-width="3"/>
  <path d="M40 2 Q68 32 64 62 L16 62 Q12 32 40 2Z" fill="#e2384f" stroke="#3b1d24" stroke-width="3"/>
  <circle cx="40" cy="90" r="12" fill="#7fe9ff" stroke="#3b3f55" stroke-width="4"/>
  <path d="M34 85 Q38 81 43 82" stroke="#fff" stroke-width="3" fill="none"/>
  <rect x="16" y="118" width="48" height="9" fill="#ffc300"/>
  <path d="M40 150 L40 62" stroke="rgba(0,0,0,.06)" stroke-width="12"/>`;
function blockSVG() {
  // Bloque original de regolito marciano en pixel art, 8×8 celdas, con una franja NEPTUNI.
  const top = ['#e8a46c', '#dd965c', '#f0b47c', '#e19d63'], dirt = ['#a4522e', '#8c4426', '#b8653a', '#97492a', '#7a3a21', '#b05c33'];
  let cells = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const n = (r * 13 + c * 7 + (r * c) % 5) % 6;
    const fill = r < 2 ? top[(r * 3 + c * 5) % 4] : r === 5 && c > 1 && c < 6 ? (c % 2 ? '#ffc300' : '#e8a400') : dirt[n];
    cells += `<rect x="${c * 10}" y="${r * 10}" width="10.4" height="10.4" fill="${fill}"/>`;
  }
  return `<svg viewBox="0 0 80 80" preserveAspectRatio="none">${cells}<rect x="1.5" y="1.5" width="77" height="77" fill="none" stroke="#3a1a0e" stroke-width="3"/><rect x="0" y="0" width="80" height="4" fill="rgba(255,255,255,.25)"/><rect x="72" y="0" width="8" height="80" fill="rgba(0,0,0,.18)"/></svg>`;
}

/* ------------------------------------------------------------------ guía */
export function createGuide(stage, wrap, {onContinue} = {}) {
  const make = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; parent?.append(n); return n; };
  const NS = 'http://www.w3.org/2000/svg';
  if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
  const root = make('div', 'nx-tour');   // «nx-guide» ya lo usa la portada (nx-home.css)
  root.setAttribute('aria-hidden', 'true');
  const world = document.createElementNS(NS, 'svg'); world.classList.add('nx-tour-world'); root.append(world);
  const rope = document.createElementNS(NS, 'path'); rope.classList.add('nx-rope'); world.append(rope);
  const beam = document.createElementNS(NS, 'path'); beam.classList.add('nx-beam-line'); world.append(beam);
  const ring = document.createElementNS(NS, 'circle'); ring.classList.add('nx-beam-ring'); ring.setAttribute('r', '16'); world.append(ring);
  const dot = document.createElementNS(NS, 'circle'); dot.classList.add('nx-beam-dot'); dot.setAttribute('r', '5'); world.append(dot);
  const props = make('div', 'nx-props', root);
  const rocket = make('div', 'nx-rocket', props); rocket.innerHTML = `<svg viewBox="0 0 80 214">${ROCKET_SVG}</svg>`;
  const block = make('div', 'nx-block', props); block.innerHTML = blockSVG();
  const fx = make('div', 'nx-fx', root);

  const body = make('div', 'nx-guide-body', root);
  const shadow = make('div', 'nx-guide-shadow', body);
  const flip = make('div', 'nx-guide-flip', body);
  const spin = make('div', 'nx-guide-spin', flip);
  const lift = make('div', 'nx-guide-lift', spin);
  const backLayer = make('div', 'nx-acc-layer back', lift);
  const imgs = new Map();
  for (const key of FRAMES) {
    const img = make('img', 'nx-guide-frame', lift);
    img.alt = ''; img.draggable = false; img.decoding = 'async';
    img.src = BASE + FR[key].file;
    imgs.set(key, img);
  }
  const frontLayer = make('div', 'nx-acc-layer', lift);
  const acc = {};
  for (const [name, a] of Object.entries(ACC)) {
    const el = make('div', 'nx-acc nx-acc-' + name, a.back ? backLayer : frontLayer);
    el.innerHTML = `<svg viewBox="0 0 ${a.w} ${a.h}">${a.svg}</svg>`;
    acc[name] = {el, ...a};
  }
  const chute = make('div', 'nx-chute', lift); chute.innerHTML = `<svg viewBox="0 0 340 380">${CHUTE_SVG}</svg>`;

  const bubble = make('div', 'nx-guide-bubble', root);
  const bubbleHead = make('div', 'nx-guide-head', bubble);
  const bubbleText = make('div', 'nx-guide-text', bubble);
  const next = make('button', 'nx-guide-next', bubble);
  next.type = 'button'; next.tabIndex = -1; next.title = 'Continuar';
  next.innerHTML = '<span>Continuar</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l8 7-8 7"/></svg>';
  next.addEventListener('click', e => { e.stopPropagation(); onContinue?.(); });
  bubble.addEventListener('click', () => { if (bubble.classList.contains('can-next')) onContinue?.(); });
  stage.append(root);

  /* ---------------------------------------------------------------- estado */
  let S = 150, k = S / 305;
  const a = {x: -400, y: 0, face: 1, rot: 0, spinX: 1, hop: 0, sq: 1, scale: 1, alpha: 1, pivot: null};
  let pose = 'idle', frame = null, grounded = true, travel = false, hover = false, visible = false;
  let topic = null, targetKey = undefined, run = 0, fast = false;
  let clock = 0, last = 0, raf = 0, frameClock = 0, poseIdx = 0, walkFrame = null;
  let ropeTop = null, onBlock = false, perched = false;
  let rocketPos = null, blockPos = null, landing = null;
  let bubbleOn = false, pendingSay = false, placement = null, idleTimer = 0, waiting = false;
  const worn = new Set();
  const tweens = new Set();

  /* ---------------------------------------------------------------- geometría */
  function rects() {
    const s = stage.getBoundingClientRect(), v = wrap.getBoundingClientRect();
    const side = stage.querySelector('.nx-side');
    const p = side && side.offsetParent ? side.getBoundingClientRect() : null;
    return {
      W: s.width, H: s.height,
      V: {x: v.left - s.left, y: v.top - s.top, w: v.width, h: v.height},
      P: p && p.width ? {x: p.left - s.left, y: p.top - s.top, w: p.width, h: p.height} : null,
      expanded: stage.matches('.viewer-expanded, :fullscreen'), s, v
    };
  }
  let R = rects();
  function measure() {
    R = rects();
    if (!R.V.w || !R.V.h) return false;
    S = clamp(R.V.h * .25, 104, 178); k = S / 305;
    for (const img of imgs.values()) {
      img.style.width = C.width * k + 'px'; img.style.height = C.height * k + 'px';
      img.style.left = -C.anchorX * k + 'px'; img.style.top = -C.anchorY * k + 'px';
    }
    for (const it of Object.values(acc)) { it.el.style.width = it.w * k + 'px'; it.el.style.height = it.h * k + 'px'; }
    chute.style.width = 340 * k + 'px'; chute.style.height = 380 * k + 'px';
    chute.style.left = -170 * k + 'px'; chute.style.top = -540 * k + 'px';
    shadow.style.width = S * .5 + 'px'; shadow.style.height = S * .07 + 'px';
    const rw = S * .5, rh = rw * 214 / 80;
    rocket.style.width = rw + 'px'; rocket.style.height = rh + 'px';
    const b = S * .62; block.style.width = block.style.height = b + 'px';
    world.setAttribute('viewBox', `0 0 ${R.W} ${R.H}`);
    world.style.width = R.W + 'px'; world.style.height = R.H + 'px';
    placeAccessories();
    return true;
  }
  new ResizeObserver(() => { if (visible && measure()) { a.x = clamp(a.x, R.V.x - S, R.V.x + R.V.w + S * .2); render(); } }).observe(stage);

  function floorY(px) {
    const {V} = R;
    let g = V.y + V.h - 16;
    const vb = wrap.querySelector('.viewer-bottom');
    if (vb && !vb.hidden) {
      const b = vb.getBoundingClientRect();
      if (b.width) {
        const left = b.left - R.s.left, right = b.right - R.s.left, half = S * .36;
        if (px + half > left && px - half < right) g = Math.min(g, b.top - R.s.top - 4);
      }
    }
    return g;
  }
  const minX = () => R.V.x + S * .42, maxX = () => R.V.x + R.V.w - S * .42;
  const blockSize = () => S * .62;
  const blockTop = () => blockPos ? blockPos.y - blockSize() : floorY(a.x);

  // Pieza enfocada en coordenadas del escenario.
  function targetPoint() {
    if (targetKey === undefined || targetKey === null) return null;
    const {V, s} = R;
    const fv = globalThis.__nxFleet;
    if (fv?.camera && fv.target?.clone && fv.renderer?.domElement) {
      try {
        const p = fv.target.clone().project(fv.camera);
        const c = fv.renderer.domElement.getBoundingClientRect();
        if (c.width && c.height && p.z < 1 && p.z > -1) {
          const px = c.left - s.left + (p.x * .5 + .5) * c.width, py = c.top - s.top + (-p.y * .5 + .5) * c.height;
          if (px > V.x && px < V.x + V.w && py > V.y && py < V.y + V.h) return {x: px, y: py};
        }
      } catch { /* sigue */ }
    }
    const esc = CSS.escape(targetKey);
    const el = wrap.querySelector(`.sj-label[data-component="${esc}"]:not([hidden])`) || wrap.querySelector(`.hotspot[slot="hotspot-${esc}"]`);
    if (el) {
      const b = el.getBoundingClientRect();
      if (b.width && b.height) {
        const px = b.left - s.left + b.width / 2, py = b.top - s.top + b.height / 2;
        if (px > V.x && px < V.x + V.w && py > V.y && py < V.y + V.h) return {x: px, y: py};
      }
    }
    return {x: V.x + V.w * .5, y: V.y + V.h * .44};
  }

  // Puntos del cuerpo (px del lienzo, relativos a los pies) según el fotograma actual.
  function anchorOf(kind) {
    const n = FR[frame]?.nose || [23, -203];
    switch (kind) {
      case 'crown': return {x: n[0] - 22, y: n[1] - 62};
      case 'head': return {x: n[0] - 17, y: n[1] - 10};
      case 'torso': return {x: n[0] - 10, y: n[1] + 75};
      case 'back': return {x: n[0] - 80, y: n[1] + 92};
      case 'fist': return FIST;
      default: return {x: 0, y: 0};
    }
  }
  // Punto del cuerpo en coordenadas del escenario (aproximado: ignora el giro).
  function worldOf(p) { return {x: a.x + a.face * a.spinX * p.x * k * a.scale, y: a.y - a.hop + p.y * k * a.sq * a.scale}; }

  /* ---------------------------------------------------------------- dibujo */
  function setFrame(key) {
    if (key === frame) return;
    if (frame) imgs.get(frame).classList.remove('on');
    imgs.get(key).classList.add('on');
    frame = key;
    placeAccessories();
  }
  function placeAccessories() {
    const pointing = POSE.point.includes(frame);
    for (const [name, it] of Object.entries(acc)) {
      let on = worn.has(name);
      if (name === 'lupa') on = on && pointing;
      it.el.classList.toggle('on', on);
      if (!on) continue;
      const p = anchorOf(it.anchor);
      it.el.style.left = (p.x + it.dx) * k + 'px';
      it.el.style.top = (p.y + it.dy) * k + 'px';
    }
  }
  function poseFrame() {
    if (walkFrame) return walkFrame;
    const list = POSE[pose] || POSE.idle;
    return list[poseIdx % list.length];
  }
  function render() {
    if (!visible) return;
    let bob = 0, sy = 1;
    if (!reducedQuery.matches) {
      sy += Math.sin(clock / 540) * .012;
      if (pose === 'talk') bob = Math.abs(Math.sin(clock / 150)) * S * .012;
      if (walkFrame) bob = Math.abs(Math.sin(clock / 95)) * S * .02;
      if (hover) bob += Math.sin(clock / 260) * S * .03;
    }
    setFrame(poseFrame());
    body.style.transform = `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0) scale(${a.scale.toFixed(3)})`;
    body.style.opacity = a.alpha >= 1 ? '' : a.alpha.toFixed(3);
    flip.style.transform = `scaleX(${a.face})`;
    spin.style.transformOrigin = a.pivot ? `${(a.pivot.x * k).toFixed(1)}px ${(a.pivot.y * k).toFixed(1)}px` : `0px ${(-150 * k).toFixed(1)}px`;
    spin.style.transform = `rotate(${a.rot.toFixed(2)}deg) scaleX(${a.spinX.toFixed(3)})`;
    lift.style.transform = `translate3d(0,${(-bob - a.hop).toFixed(1)}px,0) scale(${(2 - sy * a.sq).toFixed(4)},${(sy * a.sq).toFixed(4)})`;
    shadow.style.opacity = grounded || onBlock ? String(.32 * (1 - clamp(a.hop / (S * .25), 0, .6))) : '0';
    root.classList.toggle('jet-on', worn.has('jetpack') && hover);

    // Objetos del escenario
    if (rocketPos) rocket.style.transform = `translate3d(${(rocketPos.x - rocket.offsetWidth / 2).toFixed(1)}px,${(rocketPos.y - rocket.offsetHeight).toFixed(1)}px,0) rotate(${(rocketPos.rot || 0).toFixed(2)}deg) scale(${(rocketPos.s ?? 1).toFixed(3)})`;
    if (blockPos) block.style.transform = `translate3d(${(blockPos.x - blockSize() / 2).toFixed(1)}px,${(blockPos.y - blockSize()).toFixed(1)}px,0) scale(${(blockPos.sx ?? 1).toFixed(3)},${(blockPos.sy ?? 1).toFixed(3)})`;

    // Cuerda del rapel
    if (ropeTop) {
      const h = worldOf(HAND_R);
      rope.setAttribute('d', `M${ropeTop.x.toFixed(1)} ${ropeTop.y.toFixed(1)} L${h.x.toFixed(1)} ${h.y.toFixed(1)}`);
      rope.classList.add('on');
    } else rope.classList.remove('on');

    // Haz desde el dedo (o la lupa) hasta la pieza
    const T = pose === 'point' && !travel ? targetPoint() : null;
    if (T) {
      const f = worldOf(worn.has('lupa') ? LENS : FINGER);
      const mx = (f.x + T.x) / 2, my = Math.min(f.y, T.y) - 40;
      beam.setAttribute('d', `M${f.x.toFixed(1)} ${f.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)}`);
      ring.setAttribute('cx', T.x.toFixed(1)); ring.setAttribute('cy', T.y.toFixed(1));
      dot.setAttribute('cx', T.x.toFixed(1)); dot.setAttribute('cy', T.y.toFixed(1));
      world.classList.add('beam');
    } else world.classList.remove('beam');

    if (bubbleOn) placeBubble(T);
  }

  // El globo va junto a la cabeza sin tapar la pieza: encima, a la izquierda o a la derecha.
  function placeBubble(T) {
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const headTop = a.y - a.hop - S * 1.04 * a.scale, headMid = a.y - a.hop - S * .78 * a.scale;
    // Dentro del visor, salvo cuando Neptunito está fuera de él (sobre el marco, en paracaídas o en la cuerda).
    const outside = perched || pose === 'chute' || !!ropeTop || a.y < R.V.y + S * .9;
    // En horizontal no sale del visor, para no tapar el panel de lectura.
    const top0 = outside ? -S * 1.3 : R.V.y + 6, left0 = R.V.x + 6, right0 = R.V.x + R.V.w - 6, bottom0 = R.H - 6;
    const sideTop = clamp(headMid - bh / 2, top0, bottom0 - bh);
    const spots = {
      up: {left: clamp(a.x - bw / 2, left0, right0 - bw), top: headTop - bh - (perched ? 6 : 12)},
      left: {left: a.x - S * .4 - bw - 10, top: sideTop},
      right: {left: a.x + S * .4 + 10, top: sideTop}
    };
    if (pose === 'chute') spots.up.top = a.y - 560 * k - bh - 8;
    const fits = s => s.left >= left0 && s.left + bw <= right0 && s.top >= top0 &&
      !(T && T.x > s.left - 26 && T.x < s.left + bw + 26 && T.y > s.top - 26 && T.y < s.top + bh + 26);
    if (!placement || !fits(spots[placement])) {
      const order = T ? (T.x >= a.x ? ['left', 'up', 'right'] : ['right', 'up', 'left']) : pose === 'chute' || hover ? ['right', 'left', 'up'] : ['up', 'left', 'right'];
      placement = order.find(n => fits(spots[n])) || 'up';
    }
    const s = spots[placement];
    const top = Math.max(top0, s.top);
    bubble.style.transform = `translate3d(${s.left.toFixed(0)}px,${top.toFixed(0)}px,0)`;
    bubble.dataset.tail = placement === 'up' ? (s.top < top0 ? 'none' : 'down') : placement === 'left' ? 'right' : 'left';
    bubble.style.setProperty('--tail', clamp(a.x - s.left, 22, bw - 22).toFixed(0) + 'px');
    bubble.style.setProperty('--tail-y', clamp(headMid - top, 20, bh - 20).toFixed(0) + 'px');
  }

  /* ---------------------------------------------------------------- bucle y animaciones */
  function tick(ts) {
    raf = 0;
    const dt = last ? Math.min(1000, ts - last) : 0;   // tiempo real: llega a tiempo aunque el equipo vaya lento
    last = ts; clock += dt; frameClock += dt;
    R = rects();
    for (const t of [...tweens]) {
      const p = t.dur > 0 ? clamp((clock - t.t0) / t.dur, 0, 1) : 1;
      t.fn(t.ease(p), p);
      if (p >= 1) { tweens.delete(t); t.res(); }
    }
    if (!walkFrame && frameClock > (pose === 'talk' ? 420 : pose === 'point' ? 1900 : 2600)) { frameClock = 0; poseIdx++; }
    if (grounded && !onBlock && !perched && (walkFrame || !travel)) { const g = floorY(a.x); a.y += (g - a.y) * Math.min(1, dt / 120); }
    if (onBlock && blockPos && !travel) a.y = blockTop();
    render();
    if (visible) raf = requestAnimationFrame(tick);
  }
  function loop() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(tick); } }

  function tween(dur, fn, e = ease, tag = '') {
    if (fast || reducedQuery.matches || dur <= 0) { fn(1, 1); render(); return Promise.resolve(); }
    return new Promise(res => { tweens.add({t0: clock, dur, fn, ease: e, res, tag}); loop(); });
  }
  // Detiene los movimientos en curso (menos la caída en paracaídas).
  function stopMotion() {
    for (const t of [...tweens]) if (t.tag !== 'landing') { tweens.delete(t); t.res(); }
    walkFrame = null; travel = false; a.spinX = 1; a.hop = 0; a.sq = 1;
    if (!landing) { a.rot = 0; a.pivot = null; }
  }
  const wait = ms => tween(ms, () => {}, t => t);
  function guard(tok) { if (tok !== run) throw CANCEL; }
  // Espera una animación y corta la secuencia si mientras tanto empezó otra.
  async function step(tok, p) { await p; if (tok !== run) throw CANCEL; }
  async function scene(fn) {
    const tok = run;
    try { await fn(p => p.then(() => guard(tok))); } catch (e) { if (e !== CANCEL) console.error('[nx-guide]', e); }
  }

  function show() {
    if (visible) return;
    visible = true; root.classList.add('on'); measure(); loop();
  }
  function setPose(p) { if (pose !== p) { pose = p; poseIdx = 0; frameClock = 0; } }
  function wear(names = [], on = true) {
    for (const n of [].concat(names)) on ? worn.add(n) : worn.delete(n);
    placeAccessories();
  }

  // Caminar por el suelo del visor.
  async function walkTo(tx, endFace) {
    const tok = run;
    tx = clamp(tx, minX(), maxX());
    const from = a.x, dist = Math.abs(tx - from);
    if (dist < 4) { a.face = endFace; return; }
    a.face = tx > from ? 1 : -1; travel = true; grounded = true;
    await step(tok, tween(clamp(dist / Math.max(220, R.V.w * .32) * 1000, 380, 1900), t => {
      a.x = lerp(from, tx, t);
      walkFrame = WALK[Math.floor(Math.abs(a.x - from) / (S * .095)) % WALK.length];
    }));
    walkFrame = null; travel = false; a.face = endFace;
  }
  // Salto en arco hasta (tx, ty).
  async function jumpTo(tx, ty, {height = S * .45, dur = 620, endFace} = {}) {
    const tok = run, x0 = a.x, y0 = a.y;
    travel = true; grounded = false; onBlock = false; perched = false; hover = false;
    a.face = tx >= x0 ? 1 : -1;
    setPose('crouch'); await step(tok, tween(130, t => { a.sq = 1 - .1 * Math.sin(t * Math.PI); }));
    setPose('air');
    const top = Math.min(y0, ty) - height, ctrl = 2 * top - (y0 + ty) / 2;  // la parábola pasa por y0, top y ty
    await step(tok, tween(dur, t => {
      const u = 1 - t;
      a.x = lerp(x0, tx, t);
      a.y = u * u * y0 + 2 * u * t * ctrl + t * t * ty;
      a.rot = Math.sin(t * Math.PI) * 6 * a.face;
    }, t => t));
    a.rot = 0; setPose('crouch');
    await step(tok, tween(140, t => { a.sq = 1 - .09 * Math.sin(t * Math.PI); }));
    a.sq = 1; travel = false;
    if (endFace) a.face = endFace;
    setPose('idle');
  }
  // Volar con la mochila cohete.
  async function flyTo(tx, ty, endFace) {
    const tok = run, x0 = a.x, y0 = a.y, dist = Math.hypot(tx - x0, ty - y0);
    travel = true; grounded = false; onBlock = false; perched = false; hover = true;
    a.face = tx >= x0 ? 1 : -1; setPose('fly');
    await step(tok, tween(clamp(dist / Math.max(260, R.V.w * .4) * 1000, 420, 1500), t => {
      a.x = lerp(x0, tx, t); a.y = lerp(y0, ty, t);
      a.rot = Math.sin(t * Math.PI) * 12 * a.face;
    }));
    a.rot = 0; travel = false; if (endFace) a.face = endFace;
  }
  async function pirouette() {
    const tok = run, fromPose = pose; setPose('joy');
    await step(tok, tween(760, t => { a.spinX = Math.cos(t * Math.PI * 4); a.hop = Math.sin(t * Math.PI) * S * .26; }, t => t));
    a.spinX = 1; a.hop = 0; setPose(fromPose === 'joy' ? 'idle' : fromPose);
  }
  async function hop(h = .14, dur = 420) {
    const tok = run;
    await step(tok, tween(dur, t => { a.hop = Math.sin(t * Math.PI) * S * h; }));
    a.hop = 0;
  }
  async function loopDeLoop() {
    const tok = run;
    a.pivot = {x: 0, y: -150};
    await step(tok, tween(900, t => { a.rot = t * 360 * a.face; }));
    a.rot = 0; a.pivot = null;
  }

  /* ---------------------------------------------------------------- efectos */
  function burst(x, y, {kind = 'confetti', n = 26} = {}) {
    if (reducedQuery.matches || fast) return;
    const colors = ['#e2011c', '#ffc300', '#f26a0f', '#ffd54a', '#ffffff', '#a30016', '#ff8f3c'];
    for (let i = 0; i < n; i++) {
      const p = make('i', 'nx-p nx-p-' + kind, fx);
      const ang = (i / n) * Math.PI * 2 + Math.random() * .4;
      const sp = (kind === 'confetti' ? 90 : 46) + Math.random() * (kind === 'confetti' ? 90 : 30);
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', (Math.cos(ang) * sp).toFixed(0) + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * sp - (kind === 'confetti' ? 60 : 10)).toFixed(0) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      p.style.setProperty('--c', colors[i % colors.length]);
      p.style.animationDelay = (Math.random() * 90).toFixed(0) + 'ms';
      if (kind === 'spark') p.textContent = '✦';
      p.addEventListener('animationend', () => p.remove());
    }
  }
  function puff(x, y, n = 6, size = 1) {
    if (reducedQuery.matches || fast) return;
    for (let i = 0; i < n; i++) {
      const p = make('i', 'nx-puff', fx);
      p.style.left = x + (Math.random() - .5) * 40 * size + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', ((Math.random() - .5) * 90 * size).toFixed(0) + 'px');
      p.style.setProperty('--s', (.6 + Math.random() * .8) * size);
      p.style.animationDelay = (i * 40) + 'ms';
      p.addEventListener('animationend', () => p.remove());
    }
  }
  function floatText(x, y, text) {
    if (reducedQuery.matches || fast) return;
    const p = make('b', 'nx-float', fx);
    p.textContent = text; p.style.left = x + 'px'; p.style.top = y + 'px';
    p.addEventListener('animationend', () => p.remove());
  }
  function popAccessory(names) {
    wear(names, true);
    const h = worldOf(anchorOf('crown'));
    burst(h.x, h.y, {kind: 'spark', n: 10});
    for (const n of [].concat(names)) { const el = acc[n]?.el; if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }
  }

  /* ---------------------------------------------------------------- limpieza */
  let epoch = 0;
  function clearScene({keepActor = false} = {}) {
    epoch++;
    const pending = [...tweens];
    tweens.clear();
    for (const t of pending) t.res();
    clearTimeout(idleTimer); waiting = false;
    walkFrame = null; travel = false; hover = false; ropeTop = null; onBlock = false; perched = false;
    a.rot = 0; a.spinX = 1; a.hop = 0; a.sq = 1; a.pivot = null; a.scale = 1; a.alpha = 1;
    rocketPos = null; rocket.classList.remove('on', 'fire'); blockPos = null; block.classList.remove('on');
    chute.classList.remove('on'); landing = null;
    hideBubble(); targetKey = undefined;
    if (!keepActor) { worn.clear(); placeAccessories(); }
  }
  function hideBubble() { bubbleOn = pendingSay = false; bubble.classList.remove('on', 'can-next'); }
  function showBubble() {
    pendingSay = false; bubbleOn = true; placement = null;
    bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on');
    render();
  }
  const topicHat = t => ({see: [], mission: ['helmet'], findings: ['salacot'], systems: ['hardhat', 'jetpack']}[t] || []);

  // Si el primer mensaje llega antes de que termine la escena de entrada (equipo lento o «Mostrar todo»),
  // la deja en su estado final para que no queden objetos a medias.
  let introDone = true;
  function settleIntro() {
    if (introDone) return;
    introDone = true;
    const {V} = R;
    ropeTop = null; rope.style.opacity = '';
    walkFrame = null; travel = false; a.sq = 1; a.hop = 0; a.spinX = 1;
    if (!landing) { a.rot = 0; a.pivot = null; }
    a.x = clamp(a.x, minX(), maxX());
    if (topic === 'mission') {
      if (rocketPos) { rocketPos = null; rocket.classList.remove('on', 'fire'); rocket.style.opacity = ''; }
      wear('helmet');
      if (!landing) { chute.classList.remove('on'); grounded = true; perched = false; hover = false; }
    } else if (topic === 'findings') {
      const bx = clamp(V.x + V.w * .8, V.x + S, V.x + V.w - S * .6);
      blockPos = {x: bx, y: floorY(bx), sx: 1, sy: 1}; block.classList.add('on');
      a.x = bx; a.y = blockTop(); onBlock = true; grounded = false; wear('salacot');
    } else if (topic === 'systems') {
      wear(['hardhat', 'jetpack']); hover = true; grounded = false;
      if (a.y < V.y + S * 1.1) a.y = V.y + S * 1.45;
    } else { wear('lupa'); grounded = true; hover = false; }
    render();
  }

  /* ---------------------------------------------------------------- escenas de entrada */
  const INTRO = {
    // 1 · Baja colgado de una cuerda desde arriba del visor y saca la lupa.
    see: go => scene(async go => {
      const {V} = R;
      const x = clamp(V.x + V.w * .7, minX(), maxX());
      a.face = -1; a.x = x; grounded = false; setPose('hang');
      a.pivot = HAND_R;
      ropeTop = {x: x - 100 * k, y: V.y - S * 1.6};
      const y0 = V.y - S * .15, y1 = floorY(x);
      a.y = y0; render();
      await go(tween(1700, (t, p) => {
        a.y = lerp(y0, y1, easeOut(p));
        a.rot = Math.sin(p * Math.PI * 3) * 10 * (1 - p);
      }, t => t));
      a.rot = 0; a.pivot = null; grounded = true; setPose('crouch');
      await go(tween(140, t => { a.sq = 1 - .1 * Math.sin(t * Math.PI); }));
      a.sq = 1;
      const rt = {...ropeTop};
      await go(tween(380, t => { ropeTop = {x: rt.x, y: rt.y}; rope.style.opacity = String(1 - t); }));
      ropeTop = null; rope.style.opacity = '';
      popAccessory('lupa'); setPose('wave');
      await go(wait(500));
      setPose('idle');
    }),

    // 2 · Casco espacial, cohete, cuenta regresiva, despegue y paracaídas.
    mission: go => scene(async go => {
      const {V} = R;
      const rx = clamp(V.x + V.w * .64, V.x + S, V.x + V.w - S);
      rocketPos = {x: rx, y: floorY(rx), s: 0, rot: 0}; rocket.classList.add('on');
      await go(tween(380, t => { rocketPos.s = t; }, easeOut));
      // Entra saltando desde la columna del chat.
      a.x = V.x - S * .2; a.y = floorY(V.x + S); a.face = 1; grounded = true; setPose('idle');
      await go(jumpTo(V.x + S * .7, floorY(V.x + S * .7), {height: S * .5}));
      grounded = true;
      await go(walkTo(rx - rocket.offsetWidth * .5 - S * .42, 1));
      popAccessory('helmet'); setPose('wave');
      await go(wait(450));
      // Se agarra del cohete.
      const rh = rocket.offsetHeight;
      const gx = rx - rocket.offsetWidth * .3 - HAND_R.x * k, gy = rocketPos.y - rh * .55 - HAND_R.y * k;
      await go(jumpTo(gx, gy, {height: S * .25, dur: 420, endFace: 1}));
      grounded = false; setPose('ride');
      // Cuenta regresiva en el globo.
      for (const n of ['3…', '2…', '1…']) {
        say(`<b>Cuenta regresiva</b><span class="nx-count">${n}</span>`); rocket.classList.add('fire');
        puff(rx, rocketPos.y, 3, .8);
        await go(tween(560, t => { rocketPos.rot = Math.sin(t * 40) * 1.2; }, t => t));
      }
      say('<b>¡Despegue!</b>'); rocketPos.rot = 0;
      puff(rx, rocketPos.y, 10, 1.4);
      const ry0 = rocketPos.y, ay0 = a.y, peak = V.y - S * .25;
      const rise = ry0 - (peak + rh * .3);
      await go(tween(1500, t => { rocketPos.y = ry0 - rise * t; a.y = ay0 - rise * t; }, easeIn));
      hideBubble();
      // Se suelta: el cohete sigue y Neptunito abre el paracaídas.
      const ry1 = rocketPos.y;
      tween(900, t => { rocketPos.y = ry1 - (R.H + 600) * t; rocket.style.opacity = String(1 - t * .9); }, easeIn)
        .then(() => { rocketPos = null; rocket.classList.remove('on', 'fire'); rocket.style.opacity = ''; });
      setPose('air');
      await go(hop(.18, 380));
      setPose('chute'); chute.classList.add('on');
      await go(wait(350));
      // La caída sigue mientras habla: present() espera el aterrizaje solo si hace falta.
      const x0 = a.x, y0 = a.y, tx = clamp(V.x + V.w * .3, minX(), maxX()), ep = epoch;
      landing = tween(7000, (t, p) => {
        a.x = lerp(x0, tx, p); a.y = lerp(y0, floorY(tx), p);
        a.rot = Math.sin(p * Math.PI * 4) * 7; a.pivot = {x: 0, y: -420};
      }, t => t, 'landing').then(() => {
        if (ep !== epoch) return;
        a.rot = 0; a.pivot = null; chute.classList.remove('on'); grounded = true; landing = null;
        if (pose === 'chute') setPose('talk');
        puff(a.x, a.y, 5, .8); render();
      });
    }),

    // 3 · Cae un bloque de regolito; Neptunito llega saltando desde el chat y se sube.
    findings: go => scene(async go => {
      const {V} = R;
      const bx = clamp(V.x + V.w * .8, V.x + S, V.x + V.w - S * .6);
      const by = floorY(bx);
      blockPos = {x: bx, y: V.y - S * .8, sx: 1, sy: 1}; block.classList.add('on');
      await go(tween(620, t => { blockPos.y = lerp(V.y - S * .8, by, t); }, easeIn));
      puff(bx, by, 7, 1);
      await go(tween(240, t => { const s = Math.sin(t * Math.PI); blockPos.sx = 1 + .12 * s; blockPos.sy = 1 - .12 * s; }));
      blockPos.sx = blockPos.sy = 1;
      a.x = V.x - S * .2; a.y = floorY(V.x + S); a.face = 1; grounded = true; setPose('idle');
      popAccessory('salacot');
      await go(jumpTo(V.x + V.w * .5, floorY(V.x + V.w * .5), {height: S * .6, dur: 760}));
      grounded = true;
      await go(jumpTo(bx, by - blockSize(), {height: S * .45, endFace: -1}));
      onBlock = true; grounded = false; setPose('wave');
      await go(wait(450)); setPose('idle');
    }),

    // 4 · Se cuelga del marco del visor, se balancea, enciende la mochila cohete y vuela.
    systems: go => scene(async go => {
      const {V} = R;
      const hx = V.x + V.w * .5, hy = V.y + 6;
      a.face = 1; setPose('hang'); grounded = false; a.pivot = HAND_R;
      a.x = hx - HAND_R.x * k; const yHang = hy - HAND_R.y * k;
      a.y = yHang - S * 1.2; render();
      await go(tween(380, t => { a.y = lerp(yHang - S * 1.2, yHang, t); }, easeIn));
      await go(tween(1500, (t, p) => { a.rot = Math.sin(p * Math.PI * 4) * 16 * (1 - p); }, t => t));
      a.rot = 0;
      popAccessory(['hardhat', 'jetpack']);
      await go(wait(300));
      a.pivot = null; hover = true;
      await go(flyTo(hx, V.y + S * 1.45, 1));
      setPose('idle');
    })
  };

  /* ---------------------------------------------------------------- presentar cada mensaje */
  async function presentFloor(go, T, index) {
    if (!grounded || onBlock || perched) {
      const tx = clamp(T ? T.x - S * .8 : R.V.x + R.V.w * .75, minX(), maxX());
      await go(jumpTo(tx, floorY(tx), {height: S * .5}));
      grounded = true;
    }
    if (T) {
      const reach = S * .55 + 40;
      let left = T.x > R.V.x + R.V.w * .6 ? true : T.x < R.V.x + R.V.w * .4 ? false : index % 2 === 0;
      let tx = left ? T.x - reach : T.x + reach;
      if (tx < minX() || tx > maxX()) { left = !left; tx = left ? T.x - reach : T.x + reach; }
      await go(walkTo(tx, left ? 1 : -1));
      setPose('point');
    } else {
      await go(walkTo(R.V.x + R.V.w * (index % 2 === 0 ? .8 : .7), -1));
      setPose('talk');
    }
  }
  async function presentBlock(go, T) {
    if (!onBlock || !blockPos) {
      if (!blockPos) { const bx = clamp(R.V.x + R.V.w * .8, R.V.x + S, R.V.x + R.V.w - S * .6); blockPos = {x: bx, y: floorY(bx), sx: 1, sy: 1}; block.classList.add('on'); }
      await go(jumpTo(blockPos.x, blockTop(), {height: S * .45}));
      onBlock = true; grounded = false;
    }
    a.face = T ? (T.x >= a.x ? 1 : -1) : -1;
    setPose(T ? 'point' : 'talk');
  }
  async function presentFly(go, T, index) {
    const {V} = R;
    hover = true; grounded = false;
    if (T) {
      const reach = S * .55 + 34;
      let left = T.x > V.x + V.w * .6 ? true : T.x < V.x + V.w * .4 ? false : index % 2 === 0;
      let tx = left ? T.x - reach : T.x + reach;
      if (tx < V.x + S * .4 || tx > V.x + V.w - S * .4) { left = !left; tx = left ? T.x - reach : T.x + reach; }
      const ty = clamp(T.y + S * .66, V.y + S * 1.12, floorY(tx) - S * .1);
      await go(flyTo(clamp(tx, V.x + S * .4, V.x + V.w - S * .4), ty, left ? 1 : -1));
      setPose('point');
    } else {
      await go(flyTo(V.x + V.w * (index % 2 === 0 ? .8 : .72), V.y + V.h * .55, -1));
      setPose('talk');
    }
  }

  /* ---------------------------------------------------------------- comportamientos mientras espera */
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (!waiting || reducedQuery.matches) return;
    idleTimer = setTimeout(async () => {
      if (!waiting || travel || tweens.size) { scheduleIdle(); return; }
      const keep = pose, face = a.face, tok = run;
      const r = Math.random();
      try {
        if (hover) { if (r < .4) await loopDeLoop(); else { setPose('wave'); await step(tok, wait(900)); } }
        else if (landing) { setPose('wave'); await step(tok, wait(900)); }
        else if (r < .3) { a.face = -face; await step(tok, wait(700)); a.face = face; }
        else if (r < .55) { setPose('joy'); await hop(.12, 420); }
        else if (r < .75) { setPose('wave'); await step(tok, wait(900)); }
        else if (r < .9) { setPose('think'); await step(tok, wait(1100)); }
        else await pirouette();
      } catch (e) { if (e !== CANCEL) console.error('[nx-guide]', e); }
      finally { if (tok === run && waiting) { setPose(keep); a.face = face; } }
      if (tok === run) scheduleIdle();
    }, 3800 + Math.random() * 2600);
  }

  /* ---------------------------------------------------------------- API */
  function say(html, {step, total} = {}) {
    if (!visible) return;
    bubbleHead.innerHTML = step ? `<span class="nx-step-pill">${step} / ${total}</span>` : '';
    bubbleHead.hidden = !step;
    bubbleText.innerHTML = html;
    bubble.classList.remove('can-next');
    if (travel) { pendingSay = true; bubbleOn = false; bubble.classList.remove('on'); }
    else showBubble();
    loop();
  }
  // Muestra el globo pendiente cuando termina el desplazamiento.
  const sayWatch = setInterval(() => { if (pendingSay && !travel && visible) showBubble(); }, 120);

  return {
    /** Escena de entrada de un tema. */
    async start(t, {instant = false} = {}) {
      run++; fast = instant;
      const fromVisible = visible;
      if (fromVisible) { const h = worldOf(anchorOf('torso')); puff(h.x, h.y, 8, 1.2); }
      clearScene();
      topic = t; show(); measure();
      a.alpha = 1; a.scale = 1;
      introDone = false;
      const tok = run;
      await (INTRO[t] || INTRO.see)();
      if (tok === run) introDone = true;
      fast = false;
    },
    /** Se acerca o vuela a la pieza de la que habla y la señala. */
    async present(item, {index = 0, instant = false} = {}) {
      if (!visible) return;
      const tok = ++run; fast = instant;
      waiting = false; clearTimeout(idleTimer);
      stopMotion();
      settleIntro();
      hideBubble();
      targetKey = item.key ?? null;
      // v11: Neptunito ya no se pone chullo ni poncho.
      await scene(async go => {
        const T = targetPoint();
        if (topic === 'mission' && landing) {
          if (!T) { setPose('chute'); return; }   // sigue bajando en paracaídas mientras explica
          await go(landing);
        }
        if (topic === 'findings') await presentBlock(go, T);
        else if (topic === 'systems') await presentFly(go, T, index);
        else await presentFloor(go, T, index);
      });
      if (tok === run) fast = false;
    },
    say,
    /** Deja de hablar y espera «Continuar»; mientras tanto hace pequeñas animaciones. */
    waitForNext() {
      if (!visible) return;
      if (pose === 'talk') setPose('idle');
      bubble.classList.add('can-next');
      waiting = true; scheduleIdle(); render();
    },
    stopNext() { bubble.classList.remove('can-next'); waiting = false; clearTimeout(idleTimer); },
    /** «eureka»: chispas en la pieza; «hito»: confeti y pirueta (o voltereta si está volando). */
    async celebrate(kind = 'eureka') {
      if (!visible || reducedQuery.matches) return;
      const tok = run;
      const T = targetPoint();
      const h = worldOf(anchorOf('crown'));
      const keep = pose;
      try {
        if (kind === 'spin') {
          if (hover) await loopDeLoop(); else await pirouette();
        } else if (kind === 'hito') {
          burst(h.x, h.y - S * .2, {kind: 'confetti', n: 34});
          floatText(h.x, h.y - S * .35, '¡Hito!');
          if (hover) await loopDeLoop(); else if (onBlock || perched || landing) { setPose('joy'); await hop(.2, 520); } else await pirouette();
        } else {
          const p = T || h;
          burst(p.x, p.y, {kind: 'spark', n: 12});
          floatText(p.x, p.y - 26, '¡Eureka!');
          if (!hover && !landing) await hop(.1, 360);
        }
      } catch (e) { if (e !== CANCEL) console.error('[nx-guide]', e); }
      if (tok === run) setPose(keep);
    },
    /** Fin del tema: sale del visor, se para sobre su marco y saluda. */
    async finish() {
      if (!visible) return;
      run++; waiting = false; clearTimeout(idleTimer);
      stopMotion();
      hideBubble(); targetKey = undefined;
      await scene(async go => {
        if (landing) await go(landing);
        const {V, expanded} = R;
        const px = clamp(V.x + V.w * .42, V.x + S, V.x + V.w - S);
        if (expanded) {
          if (hover) { await go(flyTo(px, floorY(px), -1)); hover = false; }
          else if (!grounded || onBlock) await go(jumpTo(px, floorY(px)));
          grounded = true;
        } else if (hover) {
          await go(flyTo(px, V.y - 2, 1));
          hover = false; perched = true;
        } else {
          await go(jumpTo(px, V.y - 2, {height: S * .7, dur: 820, endFace: 1}));
          perched = true;
        }
        grounded = !perched && !onBlock;
        wear(['chullo', 'poncho'], false);
        setPose('wave');
      });
    },
    /** Vuelve a la columna del chat y desaparece. */
    async leave() {
      if (!visible) return;
      run++; hideBubble(); targetKey = undefined; waiting = false; clearTimeout(idleTimer);
      stopMotion(); landing = null; chute.classList.remove('on'); a.rot = 0; a.pivot = null;
      await scene(async go => {
        const {P} = R;
        if (P && !R.expanded && !reducedQuery.matches) {
          const tx = P.x + P.w * .5, ty = P.y + P.h * .42;
          await go(jumpTo(tx, ty, {height: S * .6, dur: 680}));
          await go(tween(260, t => { a.scale = 1 - t * .7; a.alpha = 1 - t; }));
        } else await go(tween(300, t => { a.alpha = 1 - t; }));
      });
      clearScene(); visible = false; root.classList.remove('on'); a.alpha = 1; a.scale = 1;
    },
    hideBubble,
    reset() {
      run++; clearScene(); visible = false; root.classList.remove('on'); topic = null;
      cancelAnimationFrame(raf); raf = 0;
    },
    destroy() { clearInterval(sayWatch); this.reset(); root.remove(); },
    get visible() { return visible; },
    get topic() { return topic; }
  };
}
