import {t as tt, isEN} from './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
// NEPTUNI · Efectos del visor 3D (v6), pensados para chicas y chicos de 12 a 15 años.
//  1 · Ambiente vivo detrás del modelo: polvo que flota en Marte, estrellas y fugaces en la Luna.
//  2 · Llegada en «hiperespacio» mientras carga la nave y destello al aparecer.
//  3 · Toque mágico: un anillo y chispas donde tocas el modelo.
//  4 · Escáner: al abrir una pieza, una mira la sigue y muestra su nombre.
//  5 · (v13) Se quitó el cazador de sistemas: complicaba la ficha y mezclaba los componentes al buscar.
//  6 · Foto postal: un botón crea una postal con la nave para guardarla.
// No toca el motor 3D: lee la cámara de solo lectura (globalThis.__nxFleet) y añade capas encima.
import {missions} from './missions.js?v=20261112inspeccion';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const reducedQ = matchMedia('(prefers-reduced-motion: reduce)');
const motion = () => !reducedQ.matches;
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeOut = t => 1 - (1 - t) ** 3;
// Paleta «Despegue»: rojo, amarillo y sus mezclas (más blanco para las chispas).
const COLORS = ['#e2011c', '#ffc300', '#f26a0f', '#ffffff', '#ffd54a', '#ff4a5e'];

const wrap = $('#explorador .viewer-wrap');
if (wrap) init();

function init() {
  const loading = $('#model-loading');
  const title = $('#explorer-title');
  const host = $('#sojourner-viewport');
  const inExplorer = () => document.body.dataset.view === 'explorador';
  const fleet = () => globalThis.__nxFleet || null;
  const div = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; };
  let mission = null;

  /* ---------------------------------------------------------------- capas */
  const amb = div('nx-amb', Array.from({length: 18}, (_, i) =>
    `<i style="--x:${(i * 41 + 7) % 100}%;--y:${(i * 67 + 3) % 100}%;--s:${(.5 + (i % 4) * .32).toFixed(2)};--d:${(-(i % 9) * 1.4).toFixed(1)}s;--t:${(9 + (i % 5) * 2.6).toFixed(1)}s"></i>`).join('') +
    '<b class="nx-amb-shoot"></b><b class="nx-amb-shoot s2"></b>');
  amb.setAttribute('aria-hidden', 'true');
  const backdrop = $('.scene-backdrop', wrap);
  if (backdrop) backdrop.after(amb); else wrap.prepend(amb);

  const warp = div('nx-warp', Array.from({length: 18}, (_, i) =>
    `<i style="--a:${(i * 137.5) % 360}deg;--d:${(-(i % 10) * .09).toFixed(2)}s;--c:${COLORS[i % COLORS.length]}"></i>`).join(''));
  warp.setAttribute('aria-hidden', 'true');
  (host || wrap.lastElementChild).after(warp);

  const fx = div('nx-vfx');            // chispas, anillos y confeti
  fx.setAttribute('aria-hidden', 'true');
  const scan = div('nx-scan', '<span class="nx-scan-beam"></span><span class="nx-reticle"><i></i><i></i><i></i><i></i></span><span class="nx-scan-tag"></span>');
  scan.setAttribute('aria-hidden', 'true');
  const toast = div('nx-toast');
  toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  wrap.append(scan, fx, toast);
  try { localStorage.removeItem('nx-hunt-v1'); } catch { /* el progreso del cazador ya no se usa */ }

  /* ---------------------------------------------------------------- 1 · mundo (Marte / Luna) */
  function setWorld() { wrap.dataset.nxWorld = mission?.world === 'Marte' ? 'mars' : 'moon'; }

  /* ---------------------------------------------------------------- 2 · llegada en hiperespacio */
  let arriveTimer = 0;
  function startArrive() {
    clearTimeout(arriveTimer);
    wrap.classList.remove('nx-arrived');
    if (!motion()) return;
    wrap.classList.add('nx-arriving');
    arriveTimer = setTimeout(endArrive, 14000);       // por si algo no avisa
  }
  function endArrive() {
    if (!wrap.classList.contains('nx-arriving')) return;
    clearTimeout(arriveTimer);
    wrap.classList.remove('nx-arriving');
    wrap.classList.add('nx-arrived');
    arriveTimer = setTimeout(() => wrap.classList.remove('nx-arrived'), 1400);
  }
  new MutationObserver(() => { if (loading.hidden) endArrive(); }).observe(loading, {attributes: true, attributeFilter: ['hidden']});

  /* ---------------------------------------------------------------- 3 · toque mágico */
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = e.target.tagName === 'CANVAS' ? {x: e.clientX, y: e.clientY, t: performance.now()} : null; });
  wrap.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved < 7 && dt < 450) sparkle(e.clientX, e.clientY);
  });
  function local(x, y) { const r = wrap.getBoundingClientRect(); return {x: x - r.left, y: y - r.top}; }
  function sparkle(cx, cy, n = 9) {
    if (!motion()) return;
    const {x, y} = local(cx, cy);
    const ring = div('nx-tap-ring'); ring.style.left = x + 'px'; ring.style.top = y + 'px';
    fx.append(ring); setTimeout(() => ring.remove(), 800);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .5, d = 34 + Math.random() * 30;
      const s = document.createElement('i');
      s.className = 'nx-tap-star'; s.textContent = i % 3 ? '✦' : '★';
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;--c:${COLORS[i % COLORS.length]}`;
      fx.append(s); setTimeout(() => s.remove(), 900);
    }
  }
  function confetti(x, y, n = 26, spread = 1) {
    if (!motion()) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'nx-conf';
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.4 * spread, v = 90 + Math.random() * 140 * spread;
      p.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * v).toFixed(0)}px;--dy:${(Math.sin(a) * v).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--c:${COLORS[i % COLORS.length]};animation-delay:${(Math.random() * .12).toFixed(2)}s`;
      fx.append(p); setTimeout(() => p.remove(), 1700);
    }
  }

  /* ---------------------------------------------------------------- 4 · escáner que sigue la pieza */
  function targetPoint() {
    const fv = fleet();
    const r = wrap.getBoundingClientRect();
    if (fv?.camera && fv.target?.clone && fv.renderer?.domElement) {
      try {
        const p = fv.target.clone().project(fv.camera);
        const c = fv.renderer.domElement.getBoundingClientRect();
        if (c.width && p.z < 1 && p.z > -1) {
          const x = c.left - r.left + (p.x * .5 + .5) * c.width, y = c.top - r.top + (-p.y * .5 + .5) * c.height;
          if (x > 0 && x < r.width && y > 0 && y < r.height) return {x, y};
        }
      } catch { /* sigue con el centro */ }
    }
    return {x: r.width / 2, y: r.height / 2};
  }
  let scanRaf = 0, scanT0 = 0, scanName = '';
  const reticle = $('.nx-reticle', scan), tag = $('.nx-scan-tag', scan);
  function startScan(name) {
    scanName = name;
    scanT0 = performance.now();
    scan.classList.remove('on', 'done'); void scan.offsetWidth; scan.classList.add('on');
    tag.textContent = 'Escaneando… 0%';
    if (!scanRaf) scanRaf = requestAnimationFrame(stepScan);
  }
  function stepScan(now) {
    scanRaf = 0;
    const t = (now - scanT0) / 1000, r = wrap.getBoundingClientRect();
    const p = targetPoint();
    const k = motion() ? easeOut(clamp01(t / .7)) : 1;
    const big = Math.min(r.width, r.height) * .8, small = Math.max(96, Math.min(150, r.width * .14));
    const size = big + (small - big) * k;
    const x = r.width / 2 + (p.x - r.width / 2) * k, y = r.height / 2 + (p.y - r.height / 2) * k;
    reticle.style.cssText = `width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;transform:translate(${(x - size / 2).toFixed(0)}px,${(y - size / 2).toFixed(0)}px)`;
    const pct = Math.round(clamp01(t / 1) * 100);
    if (pct < 100) tag.textContent = `Escaneando… ${pct}%`;
    else if (!scan.classList.contains('done')) { scan.classList.add('done'); tag.textContent = '◎ ' + scanName; }
    const tx = Math.min(r.width - 12, Math.max(12, x)), ty = y + size / 2 + 12 > r.height - 120 ? y - size / 2 - 40 : y + size / 2 + 10;
    tag.style.transform = `translate(${tx.toFixed(0)}px,${ty.toFixed(0)}px) translateX(-50%)`;
    if (t < 3.2 && inExplorer()) scanRaf = requestAnimationFrame(stepScan);
    else scan.classList.remove('on', 'done');
  }
  function stopScan() { if (scanRaf) cancelAnimationFrame(scanRaf); scanRaf = 0; scan.classList.remove('on', 'done'); }

  /* ---------------------------------------------------------------- 5 · nombres de las piezas */
  function shortName(name) { return String(name || '').split(/\s+·\s+/)[0]; }
  function findPart(list, key) {
    for (const p of list || []) {
      if ((p.key || p.id) === key) return p;
      const hit = findPart(p.children, key);
      if (hit) return hit;
    }
    return null;
  }
  let toastTimer = 0;
  function showToast(html, cls = '') {
    toast.className = 'nx-toast on ' + cls;
    toast.innerHTML = html;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'nx-toast'; }, cls === 'big' ? 5200 : 3000);
  }

  /* ---------------------------------------------------------------- vigilar la pieza elegida */
  let lastSel = null;
  setInterval(() => {
    if (!inExplorer() || document.hidden || !mission) return;
    const sel = fleet()?.state?.selected ?? null;
    if (sel === lastSel) return;
    lastSel = sel;
    if (!sel) { stopScan(); return; }
    const part = findPart(mission.components, sel);
    const label = $(`.sj-label[data-component="${CSS.escape(sel)}"]`, wrap)?.textContent.trim();
    startScan(shortName(part?.name || label || 'Pieza'));
  }, 160);

  /* ---------------------------------------------------------------- 6 · foto postal */
  const actions = $('.viewer-actions', wrap);
  const photoBtn = document.createElement('button');
  photoBtn.type = 'button'; photoBtn.className = 'outline-button nx-photo-btn'; photoBtn.id = 'nx-photo';
  photoBtn.innerHTML = '<span aria-hidden="true">📸</span> Foto';
  photoBtn.setAttribute('aria-label', 'Tomar una foto postal del modelo');
  actions?.append(photoBtn);
  const modal = div('nx-photo-modal');
  modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-label', 'Tu foto postal');
  modal.innerHTML = '<div class="nx-photo-card"><img alt="Postal con el modelo 3D"><div class="nx-photo-ui"><a class="nx-photo-save button-primary" download>Guardar foto ⬇</a><button type="button" class="outline-button nx-photo-close">Cerrar</button></div></div>';
  wrap.append(modal);
  $('.nx-photo-close', modal).addEventListener('click', () => { modal.hidden = true; photoBtn.focus(); });
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') { modal.hidden = true; photoBtn.focus(); } });

  const imgCache = new Map();
  function img(src) {
    if (!src) return Promise.resolve(null);
    if (!imgCache.has(src)) imgCache.set(src, new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return imgCache.get(src);
  }
  function cover(g, im, W, H) {
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // El lienzo 3D no guarda su imagen: se copia justo después de que el visor dibuja un cuadro
  // (con todas sus pasadas), sin cambiar cómo dibuja.
  function grabFrame(fv) {
    const r = fv.renderer, canvas = r.domElement;
    const copy = () => {
      const c = document.createElement('canvas');
      c.width = canvas.width; c.height = canvas.height;
      c.getContext('2d').drawImage(canvas, 0, 0);
      return c;
    };
    return new Promise(resolve => {
      const orig = r.render;
      let armed = true;
      const finish = shot => { if (!armed) return; armed = false; r.render = orig; resolve(shot); };
      r.render = function (...args) {
        const out = orig.apply(this, args);
        if (armed) queueMicrotask(() => { try { finish(copy()); } catch { finish(null); } });
        return out;
      };
      try { fv.camera.position.x += 1e-4; } catch { /* sin cámara: se espera al próximo cuadro */ }
      setTimeout(() => {
        if (!armed) return;
        r.render = orig;
        try {   // último recurso: dibujar la escena una vez
          let scene = fv.root; while (scene?.parent) scene = scene.parent;
          if (scene) { orig.call(r, scene, fv.camera); armed = false; resolve(copy()); return; }
        } catch { /* sin foto */ }
        finish(null);
      }, 900);
    });
  }
  photoBtn.addEventListener('click', async () => {
    const fv = fleet();
    if (!fv?.renderer || !mission || photoBtn.disabled) return;
    photoBtn.disabled = true;
    const shotCanvas = await grabFrame(fv);
    photoBtn.disabled = false;
    if (!shotCanvas) { showToast('<span class="nx-toast-ico" aria-hidden="true">📷</span><span><b>Sin foto</b>Espera a que cargue el modelo y vuelve a intentarlo.</span>'); return; }
    wrap.classList.remove('nx-flash'); void wrap.offsetWidth; wrap.classList.add('nx-flash');
    setTimeout(() => wrap.classList.remove('nx-flash'), 700);

    const r = wrap.getBoundingClientRect();
    const W = 1600, H = Math.round(W * Math.min(.75, Math.max(.5, r.height / r.width)));
    const pad = 28, band = 150;
    const c = document.createElement('canvas'); c.width = W; c.height = H + band;
    const g = c.getContext('2d');
    // marco de correo aéreo: franjas rojas y amarillas alrededor de una postal blanca
    g.fillStyle = '#fefefe'; g.fillRect(0, 0, W, H + band);
    g.save(); g.beginPath(); g.rect(0, 0, W, H + band); g.rect(14, 14, W - 28, H + band - 28); g.clip('evenodd');
    const stripes = ['#e2011c', '#fefefe', '#ffc300', '#fefefe'];
    for (let i = -(H + band), k = 0; i < W + H + band; i += 30, k++) {
      g.fillStyle = stripes[k % 4]; g.beginPath();
      g.moveTo(i, 0); g.lineTo(i + 30, 0); g.lineTo(i + 30 - (H + band), H + band); g.lineTo(i - (H + band), H + band); g.fill();
    }
    g.restore();
    // escena: fondo del visor + modelo
    g.save(); roundRect(g, pad, pad, W - pad * 2, H - pad, 26); g.clip();
    g.fillStyle = '#28161a'; g.fillRect(pad, pad, W - pad * 2, H - pad);
    const bgSrc = $('.scene-backdrop img', wrap)?.currentSrc;
    const [bg, np] = await Promise.all([img(bgSrc), img('neptunito-anim/assets/gestos/gestos_13.png')]);
    g.translate(pad, pad);
    const iw = W - pad * 2, ih = H - pad;
    if (bg) cover(g, bg, iw, ih);
    g.drawImage(shotCanvas, 0, 0, shotCanvas.width, shotCanvas.height, ...fitCover(shotCanvas.width, shotCanvas.height, iw, ih));
    g.restore();
    // texto
    try { await document.fonts.load('700 60px "Chakra Petch"'); } catch { /* usa la fuente del sistema */ }
    g.textBaseline = 'alphabetic';
    const title = isEN ? `I explored ${mission.name}!` : `¡Exploré ${mission.name}!`;
    g.font = '700 64px "Chakra Petch", "Segoe UI", sans-serif';
    const tw = g.measureText(title).width;
    g.fillStyle = 'rgba(255,195,0,.85)'; g.fillRect(pad + 2, H + 58, tw + 14, 26);   // subrayado de marcador
    g.fillStyle = '#e2011c'; g.fillText(title, pad + 8, H + 82);
    g.font = '600 30px Manrope, "Segoe UI", sans-serif';
    g.fillStyle = '#5f4a4e';
    g.fillText(isEN ? `${tt(mission.world)} · ${mission.year} · NEPTUNI, museum of space archaeology` : `${mission.world} · ${mission.year} · NEPTUNI, museo de arqueología espacial`, pad + 10, H + 126);
    // sello con la fecha
    const d = new Date(), dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), date = isEN ? `${mm}/${dd}/${d.getFullYear()}` : `${dd}/${mm}/${d.getFullYear()}`;
    g.save(); g.translate(W - 150, 120); g.rotate(-.18);
    g.fillStyle = 'rgba(254,254,254,.92)'; g.beginPath(); g.arc(0, 0, 88, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e2011c'; g.lineWidth = 6; g.setLineDash([10, 8]);
    g.beginPath(); g.arc(0, 0, 80, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffc300'; g.beginPath(); g.arc(0, 0, 68, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#28161a'; g.textAlign = 'center';
    g.font = '700 26px "Chakra Petch", sans-serif'; g.fillText(isEN ? 'VISIT' : 'VISITA', 0, -10);
    g.font = '700 24px "Chakra Petch", sans-serif'; g.fillText(date, 0, 22);
    g.restore(); g.textAlign = 'start';
    // Neptunito
    if (np) { const h = 300, w = np.naturalWidth * h / np.naturalHeight; g.drawImage(np, W - w - 30, H + band - h - 6, w, h); }
    const url = c.toDataURL('image/png');
    $('img', modal).src = url;
    const a = $('.nx-photo-save', modal);
    a.href = url; a.download = `NEPTUNI-${mission.id}.png`;
    modal.hidden = false;
    a.focus({preventScroll: true});
  });
  function fitCover(sw, sh, W, H) {
    const s = Math.max(W / sw, H / sh), w = sw * s, h = sh * s;
    return [(W - w) / 2, (H - h) / 2, w, h];
  }

  /* ---------------------------------------------------------------- cambio de misión */
  function onMission() {
    const id = $('#mission-select')?.value;
    const m = missions.find(x => x.id === id) || missions.find(x => x.name === title.textContent.trim());
    if (!m) return;
    if (m !== mission) {
      mission = m;
      setWorld();
    }
    lastSel = null;
    stopScan();
    modal.hidden = true;
    if (!loading.hidden) startArrive();
  }
  new MutationObserver(onMission).observe(title, {childList: true, characterData: true, subtree: true});
  onMission();
}
