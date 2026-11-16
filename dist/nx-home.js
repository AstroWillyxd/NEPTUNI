import './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
// NEPTUNI · Portada: carrusel de misiones destacadas + archivo de misiones.
// Usa los mismos datos que el resto del sitio. Las misiones del archivo aparecen una sola vez
// y en el mismo orden que el archivo original. Los botones [data-mission] los maneja app.js:
// abren la ficha real de cada misión.
import {missions} from './missions.js?v=20261112inspeccion';
import {missionPhoto} from './mission-photos.js?v=20261112ficha';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const byId = Object.fromEntries(missions.map(m => [m.id, m]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const PAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/></svg>';

/* ------------------------------------------------------------------ CARRUSEL */
// Datos verificados: NASA/JPL (InSight, Phoenix, Opportunity), NASA NSSDC (LRV) y NTRS (Pathfinder).
const SLIDES = [
  {id: 'sojourner', fg: 'assets/archive/sojourner.webp', fgCap: 'Sojourner y la roca Yogi', fgCredit: 'NASA/JPL · PIA00766', pos: '50% 62%', fact: 'Sojourner ponía su instrumento sobre las rocas para averiguar de qué estaban hechas.', game: true},
  {id: 'phoenix', shift: 22, pos: '30% 50%', fact: 'Su brazo abrió una zanja y dejó al descubierto trozos de hielo que en cuatro días pasaron de sólido a vapor.'},
  {id: 'opportunity', shift: 24, pos: '50% 30%', fact: 'Encontró pequeñas esferas de hematita, apodadas «arándanos», en las rocas de Meridiani Planum.'},
  {id: 'lrv17', shift: 12, pos: '50% 46%', fact: 'Con este rover, los astronautas recorrieron 35,9 km por la Luna.'},
  {id: 'insight', blur: true, fg: 'assets/insight.jpg', fgCap: 'Ilustración de InSight en Elysium Planitia', fgLabel: 'Ilustración', fgCredit: 'NASA/JPL-Caltech', portrait: true, pos: '50% 50%', fact: 'Su brazo bajó el sismómetro SEIS al suelo y lo cubrió con un escudo contra el viento y el frío.'}
];

const slidesEl = $('#nx-slides'), dotsEl = $('#nx-dots'), playBtn = $('#nx-play');
const carousel = $('#destacadas');
let index = 0, timer = null, playing = !reduced, hover = false;

function title(name) {
  const parts = name.split(/\s+(?:·|\/)\s+/);
  return parts.map((p, i) => `<span${i ? ' class="nx-outline"' : ''}>${esc(p)}</span>`).join('');
}

function slideHTML(s, i, total) {
  const m = byId[s.id];
  return `<article class="nx-slide${s.shift ? ' shifted' : ''}${s.blur ? ' blurred' : ''}" data-i="${i}" style="--pos:${s.pos};--shift:${s.shift || 0}%" ${total ? `aria-roledescription="diapositiva" aria-label="${i + 1} de ${total}: ${esc(m.name)}"` : ''} ${i ? 'hidden' : ''}>
    <img class="nx-slide-bg" src="${esc(m.image)}" alt="" loading="${i ? 'lazy' : 'eager'}" decoding="async">
    <div class="nx-slide-veil" aria-hidden="true"></div>
    <div class="nx-slide-copy">
      <p class="nx-eyebrow"><i aria-hidden="true"></i>Misión destacada · ${m.year}</p>
      <h2 class="nx-slide-title">${title(m.name)}</h2>
      <div class="nx-chips"><span class="nx-chip ${m.world === 'Marte' ? 'mars' : 'moon'}">${m.world}</span><span class="nx-chip">${esc(m.type)}</span><span class="nx-chip">${esc(m.region)}</span></div>
      <p class="nx-lead">${esc(m.summary.split('. El modelo')[0])}</p>
      <p class="nx-fact"><b>¿Sabías que…?</b> ${esc(s.fact)}</p>
      <div class="nx-actions">
        <button type="button" class="nx-btn nx-btn-primary" data-mission="${m.id}">Explorar misión ${ARROW}</button>
        ${s.game ? `<a class="nx-btn nx-btn-game" href="juego/index.html">${PAD}Ir al juego <span class="nx-new">Nuevo</span></a>` : ''}
      </div>
    </div>
    ${s.fg ? `<figure class="nx-polaroid${s.portrait ? ' portrait' : ''}"><img src="${esc(s.fg)}" alt="${esc(s.fgCap)}" loading="lazy"><figcaption>${esc(s.fgCap)}</figcaption></figure>` : ''}
    <p class="nx-credit">Imagen: <a href="${esc(m.imageSource || m.source)}" target="_blank" rel="noopener noreferrer">NASA · fuente</a>${s.fgCredit ? ' · ' + (s.fgLabel || 'Foto') + ': ' + esc(s.fgCredit) : ''}</p>
  </article>`;
}
slidesEl.innerHTML = SLIDES.map((s, i) => slideHTML(s, i, SLIDES.length)).join('');
// Inicio: Sojourner / Pathfinder es la misión destacada de NEPTUNI
$('#nx-feature').innerHTML = slideHTML(SLIDES[0], 0, 0).replace('class="nx-slide', 'class="nx-slide on nx-feature-slide');
dotsEl.innerHTML = SLIDES.map((s, i) => `<button type="button" class="nx-dot" data-i="${i}" aria-label="Ver ${esc(byId[s.id].name)}" aria-current="${i === 0}"><span></span></button>`).join('');

function show(next, user = false) {
  const slides = slidesEl.children;
  next = (next + SLIDES.length) % SLIDES.length;
  if (next === index && !user) return;
  slides[index].classList.remove('on');
  slides[index].hidden = true;
  index = next;
  slides[index].hidden = false;
  requestAnimationFrame(() => slides[index].classList.add('on'));
  for (const d of dotsEl.children) d.setAttribute('aria-current', String(Number(d.dataset.i) === index));
  restart();
}
function restart() {
  clearTimeout(timer);
  dotsEl.style.setProperty('--dur', '8s');
  dotsEl.classList.remove('run'); void dotsEl.offsetWidth;
  if (playing && !hover && !document.hidden && document.body.dataset.view === 'modelos') { dotsEl.classList.add('run'); timer = setTimeout(() => show(index + 1), 8000); }
}
function setPlaying(v) {
  playing = v;
  playBtn.setAttribute('aria-pressed', String(v));
  playBtn.setAttribute('aria-label', v ? 'Pausar el carrusel' : 'Reproducir el carrusel');
  playBtn.textContent = v ? '❚❚' : '▶';
  restart();
}
$('#nx-prev').addEventListener('click', () => show(index - 1, true));
$('#nx-next').addEventListener('click', () => show(index + 1, true));
dotsEl.addEventListener('click', e => { const d = e.target.closest('.nx-dot'); if (d) show(Number(d.dataset.i), true); });
playBtn.addEventListener('click', () => setPlaying(!playing));
carousel.addEventListener('mouseenter', () => { hover = true; restart(); });
carousel.addEventListener('mouseleave', () => { hover = false; restart(); });
carousel.addEventListener('focusin', () => { hover = true; restart(); });
carousel.addEventListener('focusout', e => { if (!carousel.contains(e.relatedTarget)) { hover = false; restart(); } });
carousel.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, true); }
  if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, true); }
});
let touchX = null;
carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive: true});
carousel.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), true);
});
document.addEventListener('visibilitychange', restart);
new MutationObserver(restart).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
// ?still&slide=N detiene el carrusel en una diapositiva (capturas y pruebas)
const params = new URLSearchParams(location.search);
if (params.has('still')) playing = false;
slidesEl.children[0].classList.add('on');
show(Number(params.get('slide')) || 0, true);
setPlaying(playing);

/* ------------------------------------------------------------------ ARCHIVO */
const ROWS = [
  {title: 'La era de los robots', range: [1997, 2100]},
  {title: 'Viking y los rovers del Apollo', range: [1971, 1996]},
  {title: 'Los primeros pasos', range: [0, 1970]}
];
const FOCUS = {sojourner: '24% 80%', lrv16: '60% 70%', ds2: '40% 50%', lrv17: '50% 40%'};
const nameHTML = name => name.split(' ').map(w => w.includes('-') ? `<span class="nx-nw">${esc(w)}</span>` : esc(w)).join(' ');

function poster(m) {
  const photo = missionPhoto(m);
  return `<button type="button" class="nx-poster" data-mission="${m.id}" data-world="${m.world}" style="--pos:${FOCUS[m.id] || '50% 50%'}" aria-label="Abrir la ficha de ${esc(m.name)}, ${m.year}, ${m.world}">
    <img src="${esc(photo.src)}" alt="" loading="lazy" decoding="async">
    <span class="nx-year">${m.year}</span>
    <span class="nx-meta"><span class="nx-name">${nameHTML(m.name)}</span><span class="nx-type">${m.world} · ${esc(m.type)}</span><span class="nx-open">Abrir ficha →</span></span>
    <span class="nx-bar" aria-hidden="true"></span>
  </button>`;
}

const rowsEl = $('#nx-rows');
let world = 'Todas';
function render() {
  const visible = missions.filter(m => world === 'Todas' || m.world === world);
  rowsEl.innerHTML = ROWS.map(row => {
    const list = visible.filter(m => m.year >= row.range[0] && m.year <= row.range[1]);
    if (!list.length) return '';
    const years = list.map(m => m.year), lo = Math.min(...years), hi = Math.max(...years);
    return `<section class="nx-row" aria-label="${esc(row.title)}">
      <h3>${esc(row.title)} <small>${lo === hi ? lo : lo + '–' + hi} · ${list.length} ${list.length === 1 ? 'misión' : 'misiones'}</small></h3>
      <button class="nx-arrow l" type="button" aria-label="Ver misiones anteriores">‹</button>
      <div class="nx-track">${list.map(poster).join('')}</div>
      <button class="nx-arrow r" type="button" aria-label="Ver más misiones">›</button>
    </section>`;
  }).join('');
  $('#nx-count').textContent = `${visible.length} ${visible.length === 1 ? 'misión' : 'misiones'}${world === 'Todas' ? '' : ' · ' + world}`;
  for (const row of rowsEl.querySelectorAll('.nx-row')) {
    const track = $('.nx-track', row);
    const sync = () => {
      $('.nx-arrow.l', row).hidden = track.scrollLeft < 8;
      $('.nx-arrow.r', row).hidden = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    };
    $('.nx-arrow.l', row).addEventListener('click', () => track.scrollBy({left: -track.clientWidth * .8, behavior: 'smooth'}));
    $('.nx-arrow.r', row).addEventListener('click', () => track.scrollBy({left: track.clientWidth * .8, behavior: 'smooth'}));
    track.addEventListener('scroll', sync, {passive: true});
    addEventListener('resize', sync);
    requestAnimationFrame(sync);
  }
}
for (const b of document.querySelectorAll('.nx-filters button')) {
  b.addEventListener('click', () => {
    world = b.dataset.world;
    for (const x of document.querySelectorAll('.nx-filters button')) x.setAttribute('aria-pressed', String(x === b));
    render();
  });
}
render();

/* ------------------------------------------------------------------ CABECERA */
const header = $('.header');
const onScroll = () => header.classList.toggle('nx-solid', scrollY > 40 || document.body.dataset.view !== 'inicio');
addEventListener('scroll', onScroll, {passive: true});
new MutationObserver(onScroll).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
onScroll();

// En celular el menú abierto agranda la cabecera mientras se calcula el destino:
// cuando ya se cerró, se vuelve a apuntar al archivo para que quede justo debajo de la barra.
document.addEventListener('click', e => {
  if (!e.target.closest('a[href="#coleccion"]')) return;
  setTimeout(() => $('#coleccion').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'}), 140);
});
