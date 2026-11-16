import './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
// NEPTUNI · Ficha de misión (v8).
// Panel de lectura junto al visor: cuatro temas siempre visibles, una tarjeta con el paso activo
// (el texto completo aparece desde el primer momento), historial plegable con los pasos anteriores
// y una barra fija con «Anterior», «Temas» y «Continuar».
// Neptunito sale al visor: entrada elaborada al empezar un tema y gestos breves en los pasos siguientes.
// «Mostrar todo» enseña el tema completo en una sola acción, sin mover la cámara: cada pieza se abre
// solo cuando la persona toca su botón. El último tema y paso se guardan en la sesión para «Retomar».
// Usa los controles del visor (#rotate-model, #reset-camera y [data-part]) y su catálogo de piezas.
// v10 · «Leer la historia»: en La misión, el mismo control alterna entre la lectura continua (título y
// párrafos de nx-relatos.js, con la foto o el botón del visor junto al texto que lo explica) y el paso a
// paso. Se abre con un clic desde la vista inicial y no mueve la cámara. Todo el relato es texto en pantalla.
import {missions} from './missions.js?v=20261112inspeccion';
import {relatos} from './nx-relatos.js?v=20261124v11';
import {missionFacts} from './mission-facts.js?v=20261123v10';
import {getMissionStory} from './mission-story.js?v=20261123v10';
import {missionPhoto} from './mission-photos.js?v=20261112ficha';
import {createNeptunitoAnimator} from './neptunito-anim/src/neptunito-animator.js';
import {fichaData} from './nx-ficha-data.js?v=20261124v11';
import {fichaContext} from './nx-ficha-context.js?v=20261123v10';
import {createGuide} from './nx-guide.js?v=20261124v11';
import {pilot} from './nx-ficha-pilot.js?v=20261126v13';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const byId = Object.fromEntries(missions.map(m => [m.id, m]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fleet = () => globalThis.__nxFleet;

const side = $('#nx-side'), tabs = [...document.querySelectorAll('.nx-tab')];
const menu = $('#nx-menu'), story = $('#nx-story'), nav = $('#nx-nav'), read = $('#nx-read');
const hello = $('#nx-hello'), resumeBox = $('#nx-resume'), cardZone = $('#nx-card');
const historyBox = $('#nx-history'), historyList = $('#nx-chat'), historyN = $('#nx-history-n');
const headTopic = $('#nx-head-topic'), headStep = $('#nx-head-step'), fill = $('#nx-progress-fill');
const btnAll = $('#nx-chat-skip'), btnPrev = $('#nx-step-prev'), btnNext = $('#nx-step-next'), btnTopics = $('#nx-topics');
const statusEl = $('#nx-status'), readBtn = $('#nx-read-story');
cardZone.tabIndex = -1;            // la lectura continua recibe el foco al abrirse
const rotateBtn = $('#rotate-model'), wrap = $('.viewer-wrap');

const ORDER = ['see', 'mission', 'findings', 'systems'];
let mission = null, active = null, items = [], topicSources = [], idx = 0, mode = 'menu';
let run = 0, shownKey, introP = Promise.resolve(), introBusy = false, introRun = 0;

/* ---------------------------------------------------------------- sesión: último tema y paso */
const POS_KEY = 'nx-ficha-pos-v1', DONE_KEY = 'nx-ficha-done-v1';
const readStore = k => { try { return JSON.parse(sessionStorage.getItem(k)) || {}; } catch { return {}; } };
const writeStore = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
function savePos(value) {
  if (!mission) return;
  const all = readStore(POS_KEY);
  if (value) all[mission.id] = value; else delete all[mission.id];
  writeStore(POS_KEY, all);
}
function validPos() {
  if (!mission) return null;
  const p = readStore(POS_KEY)[mission.id];
  if (!p) return null;
  const total = ORDER.includes(p.tab) ? stepsFor(p.tab).steps.length : 0;
  if (!total || !Number.isInteger(p.step) || p.step < 0 || p.step >= total) { savePos(null); return null; }
  return {tab: p.tab, step: p.step, total, reading: !!p.reading};
}
function markDone(tab) {
  const all = readStore(DONE_KEY), list = new Set(all[mission.id] || []);
  list.add(tab); all[mission.id] = [...list]; writeStore(DONE_KEY, all);
  renderTabs();
}

/* ---------------------------------------------------------------- textos de los temas */
function labels(m = mission) {
  return pilot[m?.id]?.labels || {see: /rover/i.test(m?.type || '') ? 'Conoce el rover' : 'Conoce la nave', mission: 'La misión', findings: 'Los hallazgos', systems: 'Los sistemas'};
}
function renderTabs() {
  const L = labels(), done = new Set(readStore(DONE_KEY)[mission?.id] || []);
  for (const t of tabs) {
    t.querySelector('.nx-tab-label').textContent = L[t.dataset.tab];
    const fin = done.has(t.dataset.tab);
    t.classList.toggle('is-done', fin);
    t.querySelector('.nx-tab-state').textContent = fin ? '✓' : '';
    t.setAttribute('aria-label', `${L[t.dataset.tab]}${fin ? ' (visto)' : ''}`);
  }
}

/* ---------------------------------------------------------------- Neptunito (columna, en el menú) */
const npEl = $('#nx-np');
let anim = null, introduced = false;
async function npShow(state = 'waiting') {
  if (!npEl.offsetWidth || !npEl.offsetHeight) return;
  anim ??= createNeptunitoAnimator({container: npEl, config: {
    narratorX: .5, size: {heightRatio: .9, widthRatio: .95, min: 70, max: 170},
    ground: {bottom: .02}, edge: {clip: 'box'}, walk: {speed: 1.1}}});
  try { await anim.ready; } catch { return; }
  if (!introduced || reduced.matches) {
    introduced = true;
    if (reduced.matches) anim.skipIntro(state); else await anim.playIntro({endState: state});
  } else anim.setState(state, {interrupt: true});
}
menu.addEventListener('click', e => { if (!active && !e.target.closest('a,button')) anim?.react(); });

/* ---------------------------------------------------------------- Neptunito (guía en el visor) */
const guide = createGuide($('#explorador .explorer-stage'), wrap, {onContinue: () => next()});

/* ---------------------------------------------------------------- visor */
// La vista inicial ya no bloquea nada: se puede pausar la órbita y abrir piezas.
globalThis.__nxPickLock = false;
wrap.classList.remove('nx-locked');
rotateBtn.removeAttribute('aria-disabled');
function rotating() { return rotateBtn.getAttribute('aria-pressed') === 'true'; }
function setOrbit(on) { if (!rotateBtn.disabled && rotating() !== on) rotateBtn.click(); }

function findPart(list, key) {
  for (const p of list || []) {
    if ((p.key || p.id) === key) return p;
    const hit = findPart(p.children, key);
    if (hit) return hit;
  }
  return null;
}
const shortName = n => String(n || '').split(/\s+·\s+/)[0];
function partName(key) {
  return (fichaData[mission?.id]?.systems || []).find(s => s.key === key)?.name || shortName(findPart(mission?.components, key)?.name);
}
// Enfoca una pieza con el mismo camino que usa el visor. key: undefined = no mover; null = vista completa.
function focusPart(key, {force = false} = {}) {
  if (key === undefined) return;
  if (!force && key === shownKey) return;
  fleet()?.cancelPending?.();
  if (key === null) { shownKey = null; $('#reset-camera').click(); return; }
  if (!findPart(mission?.components, key)) { console.warn('[nx-ficha] La pieza no está en el catálogo:', mission?.id, key); return; }
  shownKey = key;
  const tmp = document.createElement('span');
  tmp.dataset.part = key; tmp.hidden = true;
  document.body.append(tmp); tmp.click(); tmp.remove();
}

/* ---------------------------------------------------------------- contenido de cada tema */
function systemKeys() { return (fichaData[mission.id]?.systems || []).map(s => s.key); }
const HINTS = [
  [/perclorato/i, 'meca'], [/carbonato de calcio/i, 'tega'], [/hielo de agua/i, 'arm'],
  [/\bSEIS\b|sism[oó]metro|martemoto/i, 'seis'], [/HP³|calor del interior/i, 'hp3'], [/RISE|tambalea/i, 'antenna'],
  [/TEGA|horno/i, 'tega'], [/MECA|microscop/i, 'meca'], [/LIDAR|l[aá]ser|nieve|nubes/i, 'met'], [/SSI|est[eé]reo/i, 'ssi'],
  [/APXS|qu[ií]mic|Barnacle|analiz/i, 'apxs'], [/Mini-TES/i, 'minites'], [/hematita|sílice|carbonato|rocas?\b/i, 'arm'],
  [/panel|solar|polvo/i, 'solar'], [/brazo|pala|excav|zanja|suelo/i, 'arm'], [/mástil|Pancam|fotos?\b|im[aá]gen|fotograf|c[aá]mara|película/i, 'camera'],
  [/rueda|recorri|km\b|suspensi/i, 'wheels'], [/antena|radio|señal/i, 'antenna'], [/pata|alunizaje|aterriz/i, 'legs'],
  [/escudo|atm[oó]sfera|aeroescudo/i, 'aeroshell'], [/penetr|clavarse|subsuelo/i, 'forebody'], [/biolog|vida/i, 'biology'],
  [/meteorol|clima|viento/i, 'meteorology'], [/reflector|sismómetro|bandera/i, 'surface'], [/etapa de descenso|motor/i, 'descent'],
  [/manta|t[eé]rmic/i, 'thermal'], [/orbitador/i, 'orbiter'], [/módulo de superficie|lander/i, 'lander'], [/batería/i, 'battery'],
  [/caja caliente|WEB/i, 'web'], [/guardabarros|mapas/i, 'wheels']
];
const ALIAS = {camera: ['camera', 'cameras', 'pancam', 'ssi', 'rear-camera'], wheels: ['wheels', 'rocker-bogie'], arm: ['arm', 'sampler'], legs: ['legs'], solar: ['solar'], antenna: ['antenna'], seis: ['seis'], apxs: ['apxs', 'chemistry'], descent: ['descent', 'propulsion']};
function guessKey(text) {
  const keys = systemKeys();
  for (const [re, k] of HINTS) {
    if (!re.test(text)) continue;
    const found = (ALIAS[k] || [k]).find(x => keys.includes(x));
    if (found) return found;
  }
  return null;
}

// Guion general (fichas sin recorrido piloto), a partir de los datos que ya tenía el sitio.
function script(tab) {
  const m = mission, d = fichaData[m.id], story = getMissionStory(m), ctx = fichaContext[m.id] || {};
  if (tab === 'see') return [
    {title: `Este es ${m.name}`, text: d.see, key: null, note: 'Vista 3D: reconstrucción hecha con fotos y documentos de NASA.'},
    ...d.look.map(t => ({title: 'Busca en el modelo', text: t, key: guessKey(t)})),
    {title: 'Ahora te toca a ti', text: 'Arrastra para girar el modelo y pellizca o usa la rueda para acercarte. «Mostrar etiquetas» nombra las piezas.', key: undefined, tip: true, say: '¡Ahora te toca a ti! Gira el modelo y acércate.', celebrate: 'spin'}
  ];
  const r = relatos[m.id];
  if (tab === 'mission' && r) return [
    // Un paso por párrafo del relato, con su pieza, su globo y su evidencia.
    ...r.paragraphs.map(p => ({title: p.step, text: p.text, key: p.key, say: p.say, evidence: p.evidence, actions: p.actions, links: p.links})),
    {title: 'Datos de la misión', html: datosHTML(m), key: undefined, say: 'Aquí están las fechas exactas, por si quieres consultarlas.'},
    {title: '¿Qué pasó después?', html: legadoHTML(r.legado), key: undefined, say: 'Mira qué quedó en el lugar y qué llegó hasta nosotros.'},
    {sources: r.sources}
  ];
  if (tab === 'findings' && r?.findings) return [
    // Títulos concretos; observación y significado en un mismo párrafo.
    ...r.findings.map(f => ({title: f.title, text: f.text, key: f.key, say: f.say, celebrate: f.star ? 'hito' : null})),
    {sources: d.sources}
  ];
  if (tab === 'mission') {
    const photo = missionPhoto(m);
    return [
      {title: 'Su misión', text: m.summary, key: null},
      ...(ctx.why ? [{title: '¿Por qué la enviaron?', text: ctx.why, key: undefined, cls: 'nx-why'}] : []),
      {title: 'Viaje y destino', html: `<b>Destino:</b> ${esc(m.world)} · <b>Lugar:</b> ${esc(m.region)}<br><b>Llegada:</b> ${esc(m.arrival)} · <b>Final:</b> ${esc(m.end)}`, key: undefined, say: `Viajó a <b>${esc(m.world)}</b>${m.region ? ' · ' + esc(m.region) : ''}`},
      ...(photo.src ? [{title: 'Foto de archivo', text: photo.alt, key: undefined, say: '¡Mira esta foto real de la misión!',
        evidence: {src: photo.src, alt: photo.alt, kind: photo.context || 'Foto de archivo', caption: photo.alt, credit: photo.credit, source: photo.source}, openEvidence: true}] : []),
      ...story.chapters.map(c => ({title: c.title, text: c.text, key: systemKeys().includes(String(c.component).split('/')[0]) ? String(c.component).split('/')[0] : guessKey(c.text)})),
      ...(ctx.hito ? [{title: '¿Por qué fue un hito?', text: ctx.hito, key: undefined, cls: 'nx-hito', celebrate: 'hito'}] : []),
      {title: '¿Cómo terminó?', text: missionFacts[m.id] || m.status, key: undefined},
      {sources: [['NASA · Ficha de la misión', m.source], ...(story.sources || [])]}
    ];
  }
  if (tab === 'findings') return [
    ...(d.noData ? [{title: 'Sin datos', text: 'Esta misión no consiguió enviar datos.', key: undefined, alert: true}] : []),
    ...d.findings.map((f, i) => {
      const c = ctx.findings?.[i];
      const extra = c ? `<span class="nx-ctx"><b>¿Por qué lo investigaban?</b>${esc(c.why)}</span><span class="nx-ctx nx-ctx-hit"><b>¿Por qué fue importante?</b>${esc(c.hito)}</span>` : '';
      return {title: `Hallazgo ${i + 1}`, html: `${esc(f)}${extra}`, plain: f, key: guessKey(f), celebrate: !d.noData && c?.star ? 'hito' : null};
    }),
    {sources: d.sources}
  ];
  if (tab === 'systems') return [
    {title: 'Sus sistemas', text: `Te presento los sistemas principales de ${m.name}. Mira cómo se ilumina cada uno en el modelo.`, key: null},
    ...d.systems.map(s => ({title: s.name, text: s.text, key: s.key})),
    ...(m.id === 'lrv17' ? [{title: 'Mecanismos en movimiento', html: '<button type="button" class="nx-act" id="nx-lrv3-demo">Ver demostraciones de mecanismos del LRV-3</button>', key: undefined, say: 'También puedes ver sus mecanismos en movimiento.'}] : []),
    {sources: [['NASA · Ficha de la misión', m.source], ['Documentación técnica del modelo', m.fleet?.source]]}
  ];
  return [];
}
function stepsFor(tab) {
  const p = pilot[mission?.id]?.[tab];
  // El recorrido piloto conserva sus escenas; La misión cierra con lo que quedó, regresó y se conserva.
  const legado = tab === 'mission' && relatos[mission?.id]?.legado;
  if (p) return {steps: legado ? [...p, {title: '¿Qué pasó después?', html: legadoHTML(legado), key: undefined, say: 'Mira qué quedó en Marte y qué llegó hasta nosotros.'}] : p,
    sources: legado ? relatos[mission.id].sources : []};
  const raw = script(tab);
  return {steps: raw.filter(i => !i.sources), sources: raw.filter(i => i.sources).flatMap(i => i.sources)};
}

/* ---------------------------------------------------------------- tarjeta de cada paso */
const plainOf = it => String(it.plain ?? it.text ?? (it.html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
function firstIdea(text, max = 130) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  let s = m && m[0].length >= 25 ? m[0] : t;
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return s;
}
// El globo de Neptunito dirige la atención o invita a actuar; no repite el párrafo.
function guideLine(it) {
  if (it.say) return it.say;
  const name = it.key ? partName(it.key) : null;
  if (name) return `<b>Fíjate aquí</b>${esc(name)}. Gira el modelo para verla desde otro lado.`;
  return `<b>${esc(it.title || 'Sigue leyendo')}</b>Gira el modelo mientras lees. Toca una pieza si quieres abrirla.`;
}
const datosHTML = m => `<dl class="nx-datos"><div><dt>Destino</dt><dd>${esc(m.world)}</dd></div><div><dt>Lugar</dt><dd>${esc(m.region)}</dd></div>
  <div><dt>Llegada</dt><dd>${esc(m.arrival)}</dd></div><div><dt>Final</dt><dd>${esc(m.end)}</dd></div><div><dt>Estado</dt><dd>${esc(m.status)}</dd></div></dl>`;
const legadoHTML = l => l ? `<dl class="nx-legado"><div><dt>Quedó en el lugar</dt><dd>${esc(l.lugar)}</dd></div>
  <div><dt>Regresó a la Tierra</dt><dd>${esc(l.tierra)}</dd></div><div><dt>Se conserva en el archivo</dt><dd>${esc(l.archivo)}</dd></div></dl>` : '';
const linksHTML = list => list?.length ? `<ul class="nx-links">${list.map(([t, u]) =>
  `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>` : '';
function evidenceHTML(ev, id, open) {
  return `<figure class="nx-evidence" id="${id}"${open ? '' : ' hidden'}>
      <img src="${esc(ev.src)}" alt="${esc(ev.alt)}" loading="lazy" decoding="async">
      <figcaption><span class="nx-ev-kind">${esc(ev.kind || 'Foto de archivo')}</span>${esc(ev.caption || '')}
      <a href="${esc(ev.source)}" target="_blank" rel="noopener noreferrer">${esc(ev.credit)} →</a></figcaption></figure>`;
}
// Acciones de un paso: las declaradas o, si no hay, el botón de su pieza; y la foto, si la tiene.
function stepActions(it) {
  const acts = [...(it.actions || [])];
  if (!it.actions && it.key) { const name = partName(it.key); if (name) acts.push({label: name, focus: it.key}); }
  if (it.evidence && !acts.some(a => a.evidence)) acts.push({label: 'Ver foto de archivo', evidence: true});
  return acts;
}
// Lectura continua de La misión: título y párrafos reales, con la foto y los botones del visor
// a la altura del texto que los explica. No mueve la cámara.
function readingHTML(r) {
  return `<article class="nx-reading" tabindex="-1" aria-labelledby="nx-reading-title">
    <h3 class="nx-reading-title" id="nx-reading-title">${esc(r.title)}</h3>
    <p class="nx-card-note">${esc(r.note || 'El visor muestra una reconstrucción 3D hecha con fotos y documentos de NASA.')}</p>
    ${r.paragraphs.map((p, n) => {
      const acts = stepActions({...p, evidence: null});
      return `<section class="nx-par" data-par="${n}">
        <p>${esc(p.text)}</p>
        ${p.evidence ? evidenceHTML(p.evidence, 'nx-rev-' + n, true) : ''}
        ${acts.length ? `<div class="nx-acts">${acts.map(a => actionBtn(a, 'r' + n)).join('')}</div>` : ''}
        ${linksHTML(p.links)}
      </section>`;
    }).join('')}
    <section class="nx-par nx-end-block"><h4>Datos de la misión</h4>${datosHTML(mission)}</section>
    ${r.legado ? `<section class="nx-par nx-end-block"><h4>¿Qué pasó después?</h4>${legadoHTML(r.legado)}</section>` : ''}
    <p class="nx-card-src">${sourcesInline(r.sources)}</p>
  </article>`;
}
function sourcesInline(list) {
  const seen = new Set();
  const links = (list || []).filter(([, u]) => u && !seen.has(u) && seen.add(u));
  return links.length ? `<b>Fuente:</b> ${links.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join(' · ')}` : '';
}
const CHAIN = [['rover', 'Sojourner', 'radio UHF'], ['lander', 'Pathfinder', 'módulo de aterrizaje'], ['earth', 'Tierra', 'equipo de la misión']];
function chainHTML(on) {
  return `<ol class="nx-chain" aria-label="Camino de la señal">${CHAIN.map(([k, t, s]) =>
    `<li class="${on === k ? 'is-on' : ''}"><b>${t}</b><small>${s}</small></li>`).join('')}</ol>`;
}
function actionBtn(a, i) {
  const cls = 'nx-act' + (a.primary ? ' primary' : '');
  if (a.focus) return `<button type="button" class="${cls}" data-focus="${esc(a.focus)}"${a.next ? ' data-next' : ''}>◎ ${esc(a.label)}</button>`;
  if (a.evidence) return `<button type="button" class="${cls}" data-evidence aria-expanded="false" aria-controls="nx-ev-${i}">📷 ${esc(a.label)}</button>`;
  if (a.topic) return `<button type="button" class="${cls}" data-topic="${esc(a.topic)}">${esc(a.label)}</button>`;
  if (a.orbit) return `<button type="button" class="${cls}" data-orbit>⟳ ${esc(a.label)}</button>`;
  if (a.demo) return `<button type="button" class="${cls}" data-demo aria-haspopup="dialog">▶ ${esc(a.label)}</button>`;
  if (a.href) return `<a class="${cls}" href="${esc(a.href)}">🎮 ${esc(a.label)}</a>`;
  return '';
}
function stepHTML(it, i, {all = false} = {}) {
  const body = it.html ?? esc(it.text);
  const acts = stepActions(it);
  const evHTML = it.evidence ? evidenceHTML(it.evidence, 'nx-ev-' + i, it.openEvidence && !all) : '';
  const seq = it.sequence ? `<ol class="nx-seq">${it.sequence.map(([ico, t, d], n) =>
    `<li style="--n:${n}"><span class="nx-seq-ico" aria-hidden="true">${ico}</span><span><b>${esc(t)}</b> ${esc(d)}</span></li>`).join('')}</ol>` : '';
  const groups = it.groups ? `<div class="nx-groups">${it.groups.map(([g, d, parts]) =>
    `<div class="nx-group"><b>${esc(g)}</b><small>${esc(d)}</small><div class="nx-acts">${parts.map(([k, l]) => actionBtn({label: l, focus: k}, i)).join('')}</div></div>`).join('')}</div>` : '';
  const cls = ['nx-card', it.tip && 'nx-tip', it.alert && 'nx-alert', it.cls, it.bridge && 'nx-bridge'].filter(Boolean).join(' ');
  return `<article class="${cls}" data-step="${i}">
    ${all ? `<span class="nx-card-n">${i + 1}</span>` : ''}
    ${it.title ? `<h3 class="nx-card-title">${esc(it.title)}</h3>` : ''}
    <div class="nx-card-body">${body}</div>${seq}${it.chain ? chainHTML(it.chain) : ''}${groups}
    ${it.note ? `<p class="nx-card-note">${esc(it.note)}</p>` : ''}
    ${evHTML}
    ${acts.length ? `<div class="nx-acts">${acts.map(a => actionBtn(a, i)).join('')}</div>` : ''}
    ${linksHTML(it.links)}
    ${it.src?.length ? `<p class="nx-card-src">${sourcesInline(it.src)}</p>` : ''}
  </article>`;
}

/* ---------------------------------------------------------------- navegación */
function announce(msg) { statusEl.textContent = ''; setTimeout(() => { statusEl.textContent = msg; }, 40); }
function setHead() {
  const L = labels();
  headTopic.textContent = L[active] || '';
  const total = items.length;
  if (mode === 'step') { headStep.textContent = `Paso ${idx + 1} de ${total}`; fill.style.width = ((idx + 1) / total * 100).toFixed(1) + '%'; }
  else if (mode === 'all') { headStep.textContent = 'Lectura continua'; fill.style.width = '100%'; }
  else if (mode === 'end') { headStep.textContent = 'Tema completo ✓'; fill.style.width = '100%'; }
  btnAll.textContent = mode === 'all' ? 'Paso a paso' : 'Lectura continua';
  btnAll.setAttribute('aria-pressed', String(mode === 'all'));
  btnAll.hidden = mode === 'end';
  btnPrev.disabled = mode === 'all' || (mode === 'step' && idx === 0);
  const last = mode === 'step' && idx === total - 1;
  btnNext.innerHTML = mode === 'step' ? (last ? 'Terminar <span aria-hidden="true">✓</span>' : 'Continuar <span aria-hidden="true">→</span>') : 'Siguiente tema <span aria-hidden="true">→</span>';
}
function renderHistory(upto) {
  historyBox.hidden = upto === 0 || mode === 'all';
  historyN.textContent = `(${upto})`;
  historyList.innerHTML = items.slice(0, upto).map((it, n) =>
    `<li><button type="button" class="nx-hist-item" data-goto="${n}"><span class="nx-hist-n">${n + 1}</span><span><b>${esc(it.title || 'Paso ' + (n + 1))}</b> ${esc(firstIdea(plainOf(it), 110))}</span></button></li>`).join('');
}

// Pieza que corresponde a cada paso: la que declara la escena o, si no declara ninguna, la del paso anterior.
// Así «Anterior» y el historial dejan el visor igual que al llegar a ese paso por primera vez.
function effectiveKey(i) {
  for (let n = i; n >= 0; n--) if (items[n].key !== undefined) return items[n].key;
  return null;
}
// Paso a paso. Llegar a un paso es una acción explícita (Continuar, Anterior, Retomar, el historial).
function renderStep(i) {
  if (!items.length) return;
  i = Math.max(0, Math.min(i, items.length - 1));
  const tok = ++run;
  idx = i; mode = 'step';
  const it = items[i];
  story.classList.remove('is-all', 'is-end', 'is-reading');
  cardZone.setAttribute('aria-live', 'polite');
  cardZone.innerHTML = stepHTML(it, i);
  story.scrollTop = 0;
  cardZone.firstElementChild?.classList.add('nx-in');   // aparece y brilla su borde (acento fijo con movimiento reducido)
  renderHistory(i);
  setHead();
  savePos({tab: active, step: i});
  focusPart(effectiveKey(i));
  guideStep(it, i, tok);
}
async function guideStep(it, i, tok) {
  // La entrada elaborada solo ocurre al empezar el tema; mientras tanto ya se puede leer.
  if (i === 0 && introBusy) { await introP.catch(() => {}); if (tok !== run) return; }
  if (it.key) { await sleep(450); if (tok !== run) return; }
  await Promise.race([guide.present(it, {index: i + 1}), sleep(2600)]);
  if (tok !== run) return;
  guide.say(guideLine(it), {step: i + 1, total: items.length});
  guide.waitForNext();
  if (it.celebrate) guide.celebrate(it.celebrate);
}
const hasReading = () => active === 'mission' && !!relatos[mission?.id];
// Entrada: Neptunito invita a elegir y los cuatro temas brillan una vez. Siguen disponibles desde el inicio.
const tabsEl = $('#nx-tabs');
let inviteAt = 0, inviteTimer = 0;
function invite({focus = false} = {}) {
  if (!mission || active) return;
  const now = performance.now();
  if (!focus && now - inviteAt < 400) return;        // entrada y cambio de misión llegan juntos
  inviteAt = now;
  hello.classList.remove('nx-pop'); void hello.offsetWidth; hello.classList.add('nx-pop');
  tabsEl.classList.remove('nx-pulse'); void tabsEl.offsetWidth; tabsEl.classList.add('nx-pulse');
  clearTimeout(inviteTimer); inviteTimer = setTimeout(() => tabsEl.classList.remove('nx-pulse'), 1700);
  if (focus) {
    const r = tabsEl.getBoundingClientRect(), head = document.querySelector('.header')?.offsetHeight || 70;
    if (r.top < head || r.bottom > innerHeight) scrollTo({top: r.top + scrollY - head - 12, behavior: reduced.matches ? 'auto' : 'smooth'});
    tabs.find(t => t.tabIndex === 0)?.focus({preventScroll: true});
  }
  announce('Para empezar, elige uno de los cuatro botones.');
}
// Todo el tema de una vez: cancela la espera de Neptunito y no mueve la cámara.
// En La misión es la lectura continua del relato.
function showAll({focusText = false} = {}) {
  if (!active) return;
  run++; introRun++; introBusy = false;
  mode = 'all';
  guide.stopNext();
  const reading = hasReading();
  guide.present({key: null, text: ''}, {index: 1, instant: true}).then(() => {
    if (mode === 'all') guide.say(reading ? '<b>Lee a tu ritmo</b>Cuando un párrafo nombre una pieza, toca su botón ◎ y te la muestro.'
      : '<b>Todo el tema</b>Lee a tu ritmo. Toca un botón ◎ y te muestro esa pieza.');
  });
  story.classList.add('is-all'); story.classList.remove('is-end');
  story.classList.toggle('is-reading', reading);
  cardZone.setAttribute('aria-live', 'off');
  cardZone.innerHTML = reading ? readingHTML(relatos[mission.id])
    : items.map((it, i) => stepHTML(it, i, {all: true})).join('')
      + (topicSources.length ? `<p class="nx-card-src nx-topic-src">${sourcesInline(topicSources)}</p>` : '');
  story.scrollTop = 0;
  renderHistory(0);
  setHead();
  cardZone.firstElementChild?.classList.add('nx-in');
  savePos({tab: active, step: idx, reading: true});
  if (focusText) cardZone.focus({preventScroll: true});
  announce(`Lectura continua de «${labels()[active]}».`);
}
function finishTopic() {
  const tok = ++run;
  mode = 'end';
  markDone(active);
  savePos(null);
  const L = labels(), others = ORDER.filter(t => t !== active);
  story.classList.add('is-end'); story.classList.remove('is-all', 'is-reading');
  cardZone.setAttribute('aria-live', 'polite');
  cardZone.innerHTML = `<article class="nx-card nx-end nx-in"><h3 class="nx-card-title">¡Listo!</h3>
    <div class="nx-card-body">Terminaste «${esc(L[active])}». ¿Seguimos con otro tema?</div>
    <div class="nx-acts">${others.map(t => `<button type="button" class="nx-act" data-topic="${t}">${ORDER.indexOf(t) + 1} · ${esc(L[t])}</button>`).join('')}</div>
    ${topicSources.length ? `<p class="nx-card-src">${sourcesInline(topicSources)}</p>` : ''}</article>`;
  renderHistory(items.length);
  setHead();
  focusPart(null, {force: true});
  guide.finish().then(() => { if (tok === run) guide.say('<b>¡Terminamos!</b>Elige otro tema cuando quieras.'); });
}
function next() {
  if (!active) return;
  if (mode === 'step') { if (idx < items.length - 1) renderStep(idx + 1); else finishTopic(); }
  else open(ORDER[(ORDER.indexOf(active) + 1) % ORDER.length]);
}
function prev() {
  if (!active) return;
  if (mode === 'step' && idx > 0) renderStep(idx - 1);
  else if (mode === 'end') renderStep(items.length - 1);
}

function open(tab, {step = 0, resume = false, reading = false} = {}) {
  if (!mission || !ORDER.includes(tab)) return;
  run++;
  fleet()?.cancelPending?.();
  const {steps, sources} = stepsFor(tab);
  if (!steps.length) { backToMenu(); return; }
  active = tab; items = steps; topicSources = sources;
  if (!(step >= 0 && step < items.length)) step = 0;
  for (const t of tabs) { const on = t.dataset.tab === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
  read.setAttribute('aria-labelledby', 'nx-tab-' + tab);
  side.classList.add('is-story');
  menu.hidden = true; story.hidden = false; nav.hidden = false;
  setOrbit(false);
  shownKey = undefined;
  const t0 = ++introRun;
  introBusy = true;
  introP = guide.start(tab, {instant: step > 0 || reading || reduced.matches}).finally(() => { if (t0 === introRun) introBusy = false; });
  // «Leer la historia»: lectura continua sin mover la cámara.
  if (reading) { idx = step; showAll({focusText: true}); return; }
  renderStep(step);
  if (resume) announce(`Retomamos «${labels()[tab]}» en el paso ${step + 1}.`);
}
function showMenu() {
  active = null; mode = 'menu';
  for (const [n, t] of tabs.entries()) { t.setAttribute('aria-selected', 'false'); t.tabIndex = n === 0 ? 0 : -1; }
  read.removeAttribute('aria-labelledby');
  side.classList.remove('is-story');
  story.hidden = true; nav.hidden = true; menu.hidden = false;
  renderMenu();
}
function renderMenu() {
  if (!mission) return;
  hello.innerHTML = '<b>Para empezar, elige uno de los cuatro botones.</b>';
  const pos = validPos();
  resumeBox.hidden = !pos;
  readBtn.hidden = !relatos[mission.id];
  resumeBox.innerHTML = pos ? `<span><b>¿Seguimos donde te quedaste?</b>«${esc(labels()[pos.tab])}» · ${pos.reading ? 'lectura continua' : `paso ${pos.step + 1} de ${pos.total}`}</span>
    <button type="button" class="nx-nav-btn primary" data-resume>Retomar <span aria-hidden="true">→</span></button>` : '';
}
// «Temas»: cambia la navegación del relato; la cámara se queda donde está.
function backToMenu() {
  run++; introRun++; introBusy = false;
  fleet()?.cancelPending?.();
  showMenu();
  guide.leave();
  requestAnimationFrame(() => npShow('waiting'));
}
// Al salir de la ficha se cancela todo (Neptunito, esperas y operaciones del visor).
function leaveFicha() {
  run++; introRun++; introBusy = false;
  fleet()?.cancelPending?.();
  guide.reset();
  introduced = false; anim?.reset();
  if (mission) showMenu();
}

/* ---------------------------------------------------------------- eventos */
tabs.forEach((t, i) => {
  t.addEventListener('click', () => open(t.dataset.tab));
  t.addEventListener('keydown', e => {
    const k = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!k) return;
    e.preventDefault();
    const n = tabs[(i + k + tabs.length) % tabs.length];
    tabs.forEach(x => { x.tabIndex = x === n ? 0 : -1; });
    n.focus();
  });
});
btnAll.addEventListener('click', () => { if (mode === 'all') renderStep(idx); else showAll(); });
btnPrev.addEventListener('click', prev);
btnNext.addEventListener('click', next);
btnTopics.addEventListener('click', () => { backToMenu(); tabs.find(t => t.tabIndex === 0)?.focus({preventScroll: true}); });

function focusAction(key, thenNext) {
  if (thenNext && mode === 'step' && idx < items.length - 1 && items[idx + 1].key === key) { renderStep(idx + 1); return; }
  focusPart(key, {force: true});
  const tok = ++run;
  sleep(450).then(() => tok === run && guide.present({key, plain: ''}, {index: idx + 2})).then(() => {
    if (tok !== run) return;
    guide.say(`<b>¡Mira aquí!</b>${esc(partName(key) || '')}`);
    if (mode === 'step') guide.waitForNext();
  });
}
side.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || !side.contains(b)) return;
  if (b.id === 'nx-lrv3-demo' || b.hasAttribute('data-demo')) { $('#lrv3-demo-open').click(); return; }
  // «Leer la historia»: no abre ningún tema; señala los cuatro botones para que el visitante elija.
  if (b.hasAttribute('data-read')) { invite({focus: true}); return; }
  if (b.hasAttribute('data-resume')) { const p = validPos(); if (p) open(p.tab, {step: p.step, resume: true, reading: p.reading}); else renderMenu(); return; }
  if (b.dataset.focus) { focusAction(b.dataset.focus, b.hasAttribute('data-next')); return; }
  if (b.hasAttribute('data-evidence')) {
    const fig = document.getElementById(b.getAttribute('aria-controls'));
    if (!fig) return;
    fig.hidden = !fig.hidden;
    b.setAttribute('aria-expanded', String(!fig.hidden));
    if (!fig.hidden) { fig.scrollIntoView({block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth'}); guide.say('<b>Foto de archivo</b>Es del mismo episodio. El crédito está debajo.'); }
    return;
  }
  if (b.dataset.topic) { open(b.dataset.topic); return; }
  if (b.hasAttribute('data-orbit')) { rotateBtn.click(); return; }
  if (b.dataset.goto) { historyBox.open = false; renderStep(Number(b.dataset.goto)); }
});
// Teclado: ← y → recorren los pasos cuando el foco no está en un campo, en los temas o en el modelo.
document.addEventListener('keydown', e => {
  if (!active || document.body.dataset.view !== 'explorador' || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest?.('input,select,textarea,[contenteditable],[role=tab],canvas,summary')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
});

/* ---------------------------------------------------------------- cambio de misión / vista */
function sync() {
  const id = $('#mission-select').value;
  if (!byId[id]) return;
  const changed = !mission || mission.id !== id;
  mission = byId[id];
  if (changed) {
    run++; introRun++; introBusy = false;
    fleet()?.cancelPending?.();
    shownKey = undefined;
    guide.reset();
    renderTabs();
    showMenu();
    requestAnimationFrame(() => npShow('waiting'));
    if (document.body.dataset.view === 'explorador') invite();
  } else if (!active) renderMenu();
}
new MutationObserver(sync).observe($('#explorer-title'), {childList: true, characterData: true, subtree: true});
new MutationObserver(() => {
  if (document.body.dataset.view === 'explorador') { sync(); requestAnimationFrame(() => npShow('waiting')); invite(); }
  else leaveFicha();
}).observe(document.body, {attributes: true, attributeFilter: ['data-view']});
// Cuando termina de cargar un modelo y no hay tema abierto, la vista inicial empieza girando (se puede pausar).
new MutationObserver(() => { if ($('#model-loading').hidden && !active) setTimeout(() => { if (!active) setOrbit(true); }, 300); })
  .observe($('#model-loading'), {attributes: true, attributeFilter: ['hidden']});
if (document.body.dataset.view === 'explorador') { sync(); requestAnimationFrame(() => npShow('waiting')); }
// De vez en cuando Neptunito da un salto en el menú.
setInterval(() => {
  if (!document.hidden && !reduced.matches && !active && document.body.dataset.view === 'explorador' && anim?.getState?.() === 'waiting') anim.react();
}, 12000);
// Solo para pruebas y depuración (lectura).
globalThis.__nxFicha = {get state() { return {mission: mission?.id, active, mode, idx, total: items.length, shownKey}; }};
