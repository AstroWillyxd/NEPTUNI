import './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
// NEPTUNI · Inicio en movimiento.
// Portada con entrada letra por letra y parallax; cinta de misiones que se desliza con el scroll;
// Sojourner aparece sola en menos de un segundo al llegar a ella (primero se abre la foto de fondo,
// que sigue con un zoom lento, y enseguida el título, las etiquetas, el texto, la polaroid, el dato,
// los botones y Neptunito); cifras con contador; galería de misiones en movimiento; apariciones al
// hacer scroll y botones magnéticos. Sin librerías y con un solo bucle.
import {missions} from './missions.js?v=20261112inspeccion';
import {missionPhoto} from './mission-photos.js?v=20261112ficha';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const reducedQ = matchMedia('(prefers-reduced-motion: reduce)');
const narrowQ = matchMedia('(max-width: 900px)');
const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (q, a, b) => clamp01((q - a) / (b - a));
const easeOut = t => 1 - (1 - t) ** 3;
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeBack = t => { const c = 1.6; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const isHome = () => document.body.dataset.view === 'inicio';
const motion = () => !reducedQ.matches;

const root = document.documentElement;
const landing = $('#nx-landing'), pin = $('#nx-pin'), feature = $('#nx-feature'), header = $('.header');

/* ------------------------------------------------------------------ texto letra por letra */
// Envuelve cada letra en <span class="nx-ch" style="--i:n">, agrupadas por palabra para que no se corten.
function splitLetters(el, start = 0) {
  let i = start;
  const walk = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) { walk(child); continue; }
      if (child.nodeType !== 3 || !child.data.trim()) continue;
      const frag = document.createDocumentFragment();
      for (const part of child.data.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(' '); continue; }
        const word = document.createElement('span');
        word.className = 'nx-word';
        for (const ch of part) {
          const s = document.createElement('span');
          s.className = 'nx-ch'; s.textContent = ch; s.style.setProperty('--i', i++);
          word.append(s);
        }
        frag.append(word);
      }
      child.replaceWith(frag);
    }
  };
  walk(el);
  return i - start;
}
function splitWords(el) {
  let i = 0;
  for (const child of [...el.childNodes]) {
    if (child.nodeType !== 3) { if (child.nodeType === 1) { child.classList.add('nx-w'); child.style.setProperty('--i', i++); } continue; }
    const frag = document.createDocumentFragment();
    for (const part of child.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(' '); continue; }
      const w = document.createElement('span'); w.className = 'nx-w'; w.textContent = part; w.style.setProperty('--i', i++);
      frag.append(w);
    }
    child.replaceWith(frag);
  }
  el.style.setProperty('--n', i);
  return i;
}

/* ------------------------------------------------------------------ 1 · Portada */
const heroTitle = $('#archive-title');
if (heroTitle) {
  heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());
  for (const el of heroTitle.childNodes) if (el.nodeType === 1) el.setAttribute('aria-hidden', 'true');
  splitLetters(heroTitle);
  for (const w of $$('.nx-word', heroTitle)) if (!w.closest('[aria-hidden]')) w.setAttribute('aria-hidden', 'true');
}
root.classList.remove('nx-pre');

function replayHero() {
  landing.classList.remove('nx-play');
  void landing.offsetWidth;
  landing.classList.add('nx-play');
}
// Parallax con el cursor (suavizado en el bucle).
const par = {x: 0, y: 0, tx: 0, ty: 0};
landing.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = landing.getBoundingClientRect();
  par.tx = ((e.clientX - r.left) / r.width - .5) * 2;
  par.ty = ((e.clientY - r.top) / r.height - .5) * 2;
});
landing.addEventListener('pointerleave', () => { par.tx = par.ty = 0; });
$('#nx-scroll-cue')?.addEventListener('click', () => {
  const top = pin.getBoundingClientRect().top + scrollY - headH();
  scrollTo({top, behavior: motion() ? 'smooth' : 'auto'});
});

/* ------------------------------------------------------------------ 2 · Cinta de misiones */
const marquee = $('#nx-marquee');
const names = missions.map(m => m.name.replace(/\s*·\s*/g, ' · ').toUpperCase());
const rows = $$('.nx-marquee-row', marquee).map((row, r) => {
  const list = r ? [...names].reverse() : names;
  const chunk = list.map(n => `<span>${esc(n)}</span><i>✦</i>`).join('');
  row.innerHTML = `<div class="nx-mq-part">${chunk}</div><div class="nx-mq-part">${chunk}</div>`;
  return {el: row, dir: Number(row.dataset.dir) || 1, x: r * 400, speed: r ? 26 : 38};
});

/* ------------------------------------------------------------------ 3 · Sojourner aparece sola */
const slide = $('.nx-slide', feature);
const sTitle = $('.nx-slide-title', feature);
$$(':scope > span', sTitle).forEach((line, n) => {
  line.classList.add(n ? 'nx-l2' : 'nx-l1');
  line.style.setProperty('--n', splitLetters(line));
});
sTitle.setAttribute('aria-label', sTitle.textContent.replace(/\s+/g, ' ').trim());
$$(':scope > span', sTitle).forEach(l => l.setAttribute('aria-hidden', 'true'));
$$('.nx-chip', feature).forEach((c, i) => c.style.setProperty('--i', i));
splitWords($('.nx-lead', feature));
$$('.nx-actions > *', feature).forEach((b, i) => b.style.setProperty('--i', i));
// Si el dato incluye «10,5» (kg), cuenta desde cero; si el texto cambia, no hay contador.
const fact = $('.nx-fact', feature);
fact.innerHTML = fact.innerHTML.replace('10,5', '<span class="nx-count-kg" data-to="10.5">10,5</span>');
const kg = $('.nx-count-kg', fact);
// Capas nuevas: polvo marciano y Neptunito que señala la foto.
slide.insertAdjacentHTML('afterbegin', `<div class="nx-dust" aria-hidden="true">${Array.from({length: 22}, (_, i) =>
  `<i style="--x:${(i * 37) % 100}%;--y:${(i * 53) % 100}%;--s:${.6 + (i % 5) * .25};--d:${(i % 7) * -1.7}s;--t:${9 + (i % 6) * 2}s"></i>`).join('')}</div>`);
(slide.querySelector('.nx-polaroid') || slide).insertAdjacentHTML('beforeend', `<div class="nx-peek" aria-hidden="true"><p>¡Mira! Ese es Sojourner, junto a la roca Yogi.</p><img src="neptunito-anim/assets/gestos/gestos_04.png" alt=""></div>`);

// Al llegar a la sección (cuando se ve un tercio), todo aparece en REVEAL_MS sin depender de la rueda.
// Si vuelves a subir hasta perderla de vista, se rearma para la próxima vez.
const REVEAL_MS = 900;
const scene = {played: false, t0: 0};
function playScene() {
  scene.played = true; scene.t0 = performance.now();
  feature.classList.remove('is-played'); void feature.offsetWidth; feature.classList.add('is-played');
}
function resetScene() {
  scene.played = false;
  feature.classList.remove('is-played');
  lastSig = '';
}
const sceneIO = new IntersectionObserver(([en]) => {
  if (!motion() || !isHome()) return;
  if (en.isIntersecting && en.intersectionRatio >= .3) { if (!scene.played) playScene(); }
  else if (!en.isIntersecting && en.boundingClientRect.top > 0 && scene.played) { resetScene(); applyScene(); }
}, {threshold: [0, .3]});
sceneIO.observe(feature);

const headH = () => header?.offsetHeight || 76;
function sceneVars() {
  if (!motion() || !isHome()) return null;
  const q = scene.played ? clamp01((performance.now() - scene.t0) / REVEAL_MS) : 0;
  return {
    q,
    win: easeInOut(seg(q, 0, .42)),
    veil: seg(q, .25, .5),
    eb: easeOut(seg(q, .3, .48)),
    t1: seg(q, .34, .6),
    t2: seg(q, .42, .66),
    tc: easeOut(seg(q, .5, .7)),
    t3: seg(q, .52, .78),
    pol: easeBack(seg(q, .46, .8)), pola: seg(q, .46, .54),
    fact: easeOut(seg(q, .62, .84)), kg: easeOut(seg(q, .62, .94)),
    act: easeOut(seg(q, .7, .92)),
    peek: easeBack(seg(q, .78, 1))
  };
}
const FULL = {q: 1, win: 1, veil: 1, eb: 1, t1: 1, t2: 1, tc: 1, t3: 1, pol: 1, pola: 1, fact: 1, kg: 1, act: 1, peek: 1};
let lastKg = '', lastSig = '';
function applyScene() {
  const v = sceneVars() || FULL;
  const sig = v.q.toFixed(4) + '|' + (v === FULL);
  if (sig === lastSig) return;          // el scroll no cambió: no se tocan los estilos
  lastSig = sig;
  for (const [k, val] of Object.entries(v)) feature.style.setProperty('--' + k, val.toFixed(4));
  const txt = (10.5 * v.kg).toFixed(1).replace('.', ',');
  if (kg && txt !== lastKg) { kg.textContent = txt; lastKg = txt; }
}

/* ------------------------------------------------------------------ 4 · Cifras */
const years = missions.map(m => m.year);
const yMin = Math.min(...years), yMax = Math.max(...years);
const STATS = [
  {n: missions.length, label: 'misiones históricas', sub: 'con modelo 3D para girar'},
  {n: missions.filter(m => m.world === 'Marte').length, label: 'en Marte', sub: 'robots, rovers y sondas', cls: 'mars'},
  {n: missions.filter(m => m.world === 'Luna').length, label: 'en la Luna', sub: 'de Lunar Orbiter a Apollo', cls: 'moon'},
  {n: yMax - yMin, label: 'años de exploración', sub: `de ${yMin} a ${yMax}`}
];
const statsList = $('#nx-stats-list');
statsList.innerHTML = STATS.map((s, i) => `<li class="nx-stat ${s.cls || ''}" style="--i:${i}"><b data-to="${s.n}">${s.n}</b><span>${esc(s.label)}</span><small>${esc(s.sub)}</small></li>`).join('');
function countUp(el) {
  const to = Number(el.dataset.to);
  if (!motion()) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1500;
  const tick = now => {
    const t = clamp01((now - t0) / dur);
    el.textContent = Math.round(to * easeOut(t));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
}

/* ------------------------------------------------------------------ 5 · Galería en movimiento */
const gRows = $('#nx-gallery-rows');
const card = (m, copy) => {
  const p = missionPhoto(m);
  return `<button type="button" class="nx-gcard ${m.world === 'Marte' ? 'mars' : 'moon'}" data-mission="${m.id}"${copy ? ' tabindex="-1" aria-hidden="true"' : ` aria-label="Abrir la ficha de ${esc(m.name)}, ${m.year}"`}>
    <img src="${esc(p.src)}" alt="" loading="lazy" decoding="async">
    <span class="nx-gcard-year">${m.year}</span>
    <span class="nx-gcard-meta"><b>${esc(m.name)}</b><small>${m.world} · ${esc(m.type)}</small></span>
    <span class="nx-gcard-open" aria-hidden="true">Abrir ficha →</span>
  </button>`;
};
const half = Math.ceil(missions.length / 2);
const galleryRows = [missions.slice(0, half), missions.slice(half).reverse()].map((list, r) => {
  const row = document.createElement('div');
  row.className = 'nx-grow';
  row.innerHTML = `<div class="nx-gtrack"><div class="nx-gpart">${list.map(m => card(m, false)).join('')}</div><div class="nx-gpart" aria-hidden="true">${list.map(m => card(m, true)).join('')}</div></div>`;
  gRows.append(row);
  const state = {row, track: $('.nx-gtrack', row), dir: r ? 1 : -1, x: r ? -300 : 0, speed: 34, hold: 0, holdT: 0};
  row.addEventListener('pointerenter', () => { state.holdT = 1; });
  row.addEventListener('pointerleave', () => { state.holdT = 0; });
  row.addEventListener('focusin', () => { state.holdT = 1; });
  row.addEventListener('focusout', e => { if (!row.contains(e.relatedTarget)) state.holdT = 0; });
  return state;
});
// Las fotos se descargan cuando la galería se acerca a la pantalla (la carga diferida
// del navegador no detecta bien tarjetas que se mueven con transform).
const preload = new IntersectionObserver(([en]) => {
  if (!en.isIntersecting) return;
  $$('img', gRows).forEach(img => { img.loading = 'eager'; });
  preload.disconnect();
}, {rootMargin: '900px 0px'});
preload.observe(gRows);
// Inclinación 3D de las tarjetas según el cursor.
gRows.addEventListener('pointermove', e => {
  const c = e.target.closest('.nx-gcard');
  if (!c || e.pointerType !== 'mouse') return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(1) + 'deg');
  c.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 12).toFixed(1) + 'deg');
});
gRows.addEventListener('pointerout', e => { const c = e.target.closest?.('.nx-gcard'); if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); } });
// Con «movimiento reducido» la galería no se mueve sola: se desliza a mano.
// Botón visible para pausar la galería (además de la pausa al pasar el cursor o el foco).
// En pausa, las tarjetas quedan quietas y se pueden deslizar a mano.
let galleryPaused = false;
const pauseBtn = document.createElement('button');
pauseBtn.type = 'button'; pauseBtn.className = 'nx-gallery-pause';
pauseBtn.setAttribute('aria-controls', 'nx-gallery-rows');
function setGalleryPaused(v) {
  galleryPaused = v;
  pauseBtn.setAttribute('aria-pressed', String(v));
  pauseBtn.innerHTML = v ? '<span aria-hidden="true">▶</span> Reanudar galería' : '<span aria-hidden="true">❚❚</span> Pausar galería';
  syncStatic();
}
pauseBtn.addEventListener('click', () => setGalleryPaused(!galleryPaused));
$('.nx-gallery-head').append(pauseBtn);
function syncStatic() {
  const still = !motion() || galleryPaused;
  pauseBtn.hidden = !motion();
  for (const g of galleryRows) { g.row.classList.toggle('is-static', still); if (still) g.track.style.transform = ''; }
}
setGalleryPaused(false);

/* ------------------------------------------------------------------ 6 · Apariciones al hacer scroll */
function reveal(selector, {step = .08, base = 0} = {}) {
  $$(selector).forEach((el, i) => { el.dataset.reveal = ''; el.style.setProperty('--d', (base + i * step).toFixed(2) + 's'); io.observe(el); });
}
const io = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    en.target.classList.add('is-in');
    io.unobserve(en.target);
  }
}, {rootMargin: '0px 0px -10% 0px', threshold: .12});
const statIO = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    $$('.nx-stat', statsList).forEach(li => li.classList.add('is-in'));
    $$('[data-to]', statsList).forEach(countUp);
    statIO.disconnect();
  }
}, {threshold: .3});
statIO.observe(statsList);
if (motion()) {
  root.classList.add('nx-motion');
  reveal('#nx-stats .nx-stats-kicker');
  reveal('#nx-gallery .nx-gallery-head > *', {step: .1});
  reveal('#nx-gallery .nx-grow', {step: .15, base: .1});
  reveal('#inicio .nx-more-btn');
  reveal('.site-footer .footer-identity, .site-footer .footer-column', {step: .1});
  reveal('.site-footer .footer-bottom', {base: .3});
} else {
  $$('.nx-stat', statsList).forEach(li => li.classList.add('is-in'));
}

/* ------------------------------------------------------------------ 7 · Botones magnéticos */
const MAGNET = '.landing-actions a, #nx-feature .nx-btn, .nx-more-btn, .nx-scroll-cue';
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !motion()) return;
  const el = e.target.closest?.(MAGNET);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
  el.style.translate = `${(dx * 14).toFixed(1)}px ${(dy * 10).toFixed(1)}px`;
  if (el.classList.contains('nx-more-btn')) { el.style.setProperty('--ry', (dx * 10).toFixed(1) + 'deg'); el.style.setProperty('--rx', (-dy * 10).toFixed(1) + 'deg'); }
}, {passive: true});
document.addEventListener('pointerout', e => {
  const el = e.target.closest?.(MAGNET);
  if (el && !el.contains(e.relatedTarget)) { el.style.translate = ''; el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
});

/* ------------------------------------------------------------------ 8 · Barra de progreso del scroll */
const bar = document.createElement('span');
bar.className = 'nx-progress'; bar.setAttribute('aria-hidden', 'true');
header?.append(bar);

/* ------------------------------------------------------------------ bucle único */
let raf = 0, last = 0, lastScroll = scrollY, vel = 0, running = false;
function frame(now) {
  raf = 0;
  if (!running) return;
  const dt = last ? Math.min(64, now - last) / 1000 : 0;
  last = now;
  root.style.setProperty('--nx-head', headH() + 'px');
  // Velocidad del scroll: acelera la cinta y la galería.
  const sy = scrollY, dv = sy - lastScroll; lastScroll = sy;
  vel += (dv - vel) * .2;
  const boost = Math.max(-1600, Math.min(1600, vel / Math.max(dt, .001) * .35));
  // Parallax de la portada
  if (Math.abs(par.tx - par.x) > .001 || Math.abs(par.ty - par.y) > .001) {
    par.x += (par.tx - par.x) * .08; par.y += (par.ty - par.y) * .08;
    landing.style.setProperty('--mx', par.x.toFixed(3)); landing.style.setProperty('--my', par.y.toFixed(3));
    feature.style.setProperty('--fx', par.x.toFixed(3)); feature.style.setProperty('--fy', par.y.toFixed(3));
  }
  applyScene();
  if (motion()) {
    for (const r of rows) {
      r.x += (r.speed + Math.abs(boost)) * r.dir * dt;
      const w = r.el.firstElementChild.offsetWidth || 1;
      const x = ((r.x % w) + w) % w;
      r.el.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    }
    if (!galleryPaused) for (const g of galleryRows) {
      g.hold += (g.holdT - g.hold) * .08;
      g.x += (g.speed + Math.abs(boost) * .5) * g.dir * dt * (1 - g.hold);
      const w = g.track.firstElementChild.offsetWidth || 1;
      const x = ((g.x % w) + w) % w;
      g.track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    }
  }
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? (sy / max).toFixed(4) : 0})`;
  raf = requestAnimationFrame(frame);
}
function sync() {
  const should = isHome() && !document.hidden;
  if (should && !running) { running = true; last = 0; lastScroll = scrollY; raf = requestAnimationFrame(frame); }
  if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  if (!should) applyScene();
}
let wasHome = isHome();
new MutationObserver(() => {
  const home = isHome();
  if (home && !wasHome) {
    replayHero();
    // Sojourner vuelve a aparecer cuando llegues a ella.
    resetScene();
    sceneIO.unobserve(feature); sceneIO.observe(feature);
  }
  wasHome = home;
  sync();
}).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
document.addEventListener('visibilitychange', sync);
reducedQ.addEventListener?.('change', () => { syncStatic(); applyScene(); });
addEventListener('scroll', () => { if (!running) applyScene(); }, {passive: true});
applyScene();
sync();
