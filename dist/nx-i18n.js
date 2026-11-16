// NEPTUNI · Idioma (v12). Español por defecto; inglés con el botón ES / EN de la cabecera.
//
// Cómo funciona
//   · El idioma se guarda en localStorage («nx-lang») y también se puede forzar con ?lang=en / ?lang=es.
//   · En inglés se cargan los diccionarios i18n/en-*.txt. Cada línea es «clave texto»: la clave es un
//     resumen (hash) de 7 caracteres del texto original en español, con los espacios normalizados.
//   · tr(objeto) traduce en su sitio los datos de las fichas (relatos, catálogo de piezas…) antes de
//     que otros módulos los usen. Los módulos de datos lo llaman al final de su propio código.
//   · El resto (textos fijos de la página y de la interfaz) se traduce en el DOM: al cargar y cada
//     vez que aparece texto nuevo (MutationObserver), incluidos aria-label, title y alt.
//   · Las frases con partes variables («Paso 2 de 4») se resuelven con reglas (i18n/en-rules.js).
//   · Cambiar de idioma recarga la página en la misma vista.
// Los módulos de entrada importan este archivo primero: así el diccionario ya está listo (await de
// nivel superior) antes de que pinten nada.

const KEY = 'nx-lang';
const VERSION = '20261125v12';
const FILES = ['ui', 'content', 'relatos', 'ficha', 'parts', 'catalog-a', 'catalog-b', 'catalog-c', 'catalog-d', 'catalog-e', 'lrv3', 'game'];

function readLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'es') { localStorage.setItem(KEY, q); return q; }
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'es';
  } catch { return 'es'; }
}
export const lang = readLang();
export const isEN = lang === 'en';

// Resumen cyrb53 → 7 caracteres en base 36 (el mismo que usa la herramienta que genera las listas)
export function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(7, '0').slice(-7);
}
const norm = s => s.replace(/\s+/g, ' ').trim();

const base = new URL('./i18n/', import.meta.url);
let dict = null, rules = [];
if (isEN) {
  try {
    const [texts, mod] = await Promise.all([
      Promise.all(FILES.map(f => fetch(new URL(`en-${f}.txt?v=${VERSION}`, base)).then(r => r.ok ? r.text() : '').catch(() => ''))),
      import(`./i18n/en-rules.js?v=${VERSION}`).catch(() => ({rules: []}))
    ]);
    dict = new Map();
    for (const text of texts) for (const line of text.split(/\r?\n/)) {
      if (!line || line[0] === '#') continue;
      if (line[0] === '=') {   // «=texto en español => English» (entradas escritas a mano)
        const at = line.indexOf(' => ');
        if (at > 1) dict.set(hash(norm(line.slice(1, at))), line.slice(at + 4));
        continue;
      }
      const sp = line.indexOf(' ');
      if (sp > 0) dict.set(line.slice(0, sp), line.slice(sp + 1).replace(/\\n/g, '\n'));
    }
    rules = mod.rules || [];
  } catch (e) { console.warn('[NEPTUNI] No se pudo cargar el inglés:', e); dict = null; }
}

function lookup(n) {
  const hit = dict.get(hash(n));
  if (hit != null) return hit;
  for (const [re, out] of rules) {
    const m = n.match(re);
    if (!m) continue;
    const r = typeof out === 'function' ? out(m, tx) : n.replace(re, out);
    if (r != null) return r;   // una regla puede renunciar (null) si su parte variable sigue en español
  }
  return null;
}
// Traducción de una frase normalizada. Si no está entera, prueba, en este orden:
//   1. sin los símbolos de delante o detrás («📷 Ver foto», «Abrir ficha →», «Fuente:»);
//   2. por tramos separados con « · », « — » o « / », uniendo los tramos más largos que sí estén;
//   3. oración por oración (textos que el código arma pegando dos frases).
const AFFIX = /^([^\p{L}¿¡«"(]*)(.*?)\s*([.:]?\s*[→↗↑↓⬇✓›‹…]+|:)?$/u;
function affix(n) {
  const hit = lookup(n);
  if (hit != null) return hit;
  const a = n.match(AFFIX);
  const pre = a ? a[1].trim() : '';
  if (a && (pre || a[3]) && a[2]) {
    const h = lookup(a[2]);
    if (h != null) return (pre ? pre + ' ' : '') + h + (a[3] ? (a[3] === ':' ? ':' : ' ' + a[3].trim()) : '');
  }
  return null;
}
// Une los tramos consecutivos más largos que estén en el diccionario; el resto se traduce por separado.
function pieces(parts, sep, depth) {
  const out = [];
  let changed = false;
  for (let i = 0; i < parts.length;) {
    let j = parts.length, h = null;
    for (; j > i; j--) { if (j - i === parts.length) continue; h = affix(parts.slice(i, j).join(sep).trim()); if (h != null) break; }
    if (h != null) { out.push(h); changed = true; i = j; }
    else { const p = parts[i].trim(), one = tx(p, depth + 1); if (one !== p) changed = true; out.push(one); i++; }
  }
  return changed ? out.join(sep) : null;
}
function tx(n, depth = 0) {
  if (!dict || !n) return n;
  const hit = affix(n);
  if (hit != null) return hit;
  if (depth > 2) return n;
  for (const sep of [' · ', ' — ', ' / ']) {
    if (!n.includes(sep)) continue;
    const r = pieces(n.split(sep), sep, depth);
    if (r != null) return r;
  }
  const sentences = n.split(/(?<=[.!?…»])\s+(?=[¿¡«A-ZÁÉÍÓÚÑ0-9])/);
  if (sentences.length > 1) {
    const r = pieces(sentences, ' ', depth);
    if (r != null) return r;
  }
  return n;
}
const memo = new Map();   // los mismos textos se repiten mucho (contadores, globos, listas)
export function t(s) {
  if (!dict || typeof s !== 'string' || !/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(s)) return s;
  const n = norm(s);
  let out = memo.get(n);
  if (out === undefined) { out = tx(n); if (memo.size > 6000) memo.clear(); memo.set(n, out); }
  if (out === n) return s;
  return s.match(/^\s*/)[0] + out + s.match(/\s*$/)[0];
}

// Claves que son identificadores (no se traducen nunca)
const SKIP = new Set(['id', 'key', 'keys', 'world', 'family', 'model', 'scene', 'src', 'href', 'url', 'image', 'imageSource', 'source',
  'nodes', 'exteriorNodes', 'evidence', 'evidenceRefs', 'variant', 'tab', 'component', 'focus', 'topic', 'cls', 'celebrate', 'pose', 'icon']);
export function tr(obj, seen = new WeakSet()) {
  if (!dict || !obj || typeof obj !== 'object' || seen.has(obj)) return obj;
  seen.add(obj);
  try {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) { const v = obj[i]; if (typeof v === 'string') obj[i] = t(v); else tr(v, seen); }
      return obj;
    }
    for (const k of Object.keys(obj)) {
      if (SKIP.has(k)) continue;
      const v = obj[k];
      if (typeof v === 'string') obj[k] = t(v);
      else if (k === 'specs' && v && typeof v === 'object' && !Array.isArray(v)) {
        const o = {}; for (const [a, b] of Object.entries(v)) o[t(a)] = typeof b === 'string' ? t(b) : b; obj[k] = o;
      } else tr(v, seen);
    }
  } catch { /* objetos congelados: se dejan como están */ }
  return obj;
}

/* ---------------------------------------------------------------- traducción de la página */
const ATTRS = ['aria-label', 'title', 'alt', 'placeholder', 'aria-roledescription', 'aria-valuetext', 'label', 'data-tip'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE']);
function skipEl(el) { return !el || SKIP_TAGS.has(el.nodeName) || el.closest?.('[data-no-i18n]'); }
function fixText(node) {
  const v = node.data;
  if (!v || v.length > 4000 || skipEl(node.parentElement)) return;
  const out = t(v);
  if (out !== v) node.data = out;
}
function fixAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute?.(a);
    if (v) { const out = t(v); if (out !== v) el.setAttribute(a, out); }
  }
}
function walk(root) {
  if (root.nodeType === 3) { fixText(root); return; }
  if (root.nodeType !== 1 || skipEl(root)) return;
  fixAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.nodeType === 1 && SKIP_TAGS.has(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  let n; while ((n = it.nextNode())) { if (n.nodeType === 3) fixText(n); else fixAttrs(n); }
}
function translatePage() {
  document.documentElement.lang = 'en';
  document.title = t(document.title);
  const meta = document.querySelector('meta[name=description]');
  if (meta) meta.content = t(meta.content);
  walk(document.body);
  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target);
      else if (m.type === 'attributes') { const v = m.target.getAttribute(m.attributeName); if (v) { const out = t(v); if (out !== v) m.target.setAttribute(m.attributeName, out); } }
      else for (const n of m.addedNodes) walk(n);
    }
  });
  mo.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  const title = document.querySelector('title');
  if (title) new MutationObserver(() => { const v = document.title, out = t(v); if (out !== v) document.title = out; }).observe(title, {childList: true, characterData: true, subtree: true});
}

/* ---------------------------------------------------------------- botón ES / EN */
const CSS = `.nx-lang{display:inline-flex;align-items:center;gap:2px;flex:none;align-self:center;padding:3px 3px 3px 8px;border-radius:999px;background:#fff;border:2px solid rgba(40,22,26,.12);box-shadow:0 3px 0 rgba(40,22,26,.06),0 8px 18px rgba(140,40,20,.08);font:800 12.5px/1 var(--nx-body,var(--body,system-ui,sans-serif));color:#5f4a4e}
.nx-lang svg{width:16px;height:16px;margin-right:3px;fill:none;stroke:#e2011c;stroke-width:1.8}
.nx-lang button{min-width:40px;min-height:34px;padding:0 10px;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;letter-spacing:.06em;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s}
.nx-lang button[aria-pressed=true]{background:#e2011c;color:#fff;box-shadow:0 2px 0 #a30016}
.nx-lang button:not([aria-pressed=true]):hover{background:#fff3cc;color:#28161a}
.nx-lang button:focus-visible{outline:3px solid #a30016;outline-offset:2px}
.brandline .nx-lang{margin:14px auto 0 14px}
.g-top .nx-lang{margin:16px auto 0 4px}
html.nx-lang-out body{opacity:.35;transition:opacity .16s}
@media (max-width:980px){.brandline .nx-lang{margin:10px auto 0 10px}.nx-lang{padding-left:6px}.nx-lang svg{display:none}.nx-lang button{min-width:38px;min-height:36px;padding:0 8px}}
@media (max-width:360px){.brandline .nx-lang{margin-left:6px}.nx-lang button{min-width:34px;padding:0 6px}}`;
function mountSwitch() {
  const host = document.querySelector('.header .brandline') || document.querySelector('.g-top');
  if (!host || host.querySelector('.nx-lang')) return;
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  const box = document.createElement('div');
  box.className = 'nx-lang'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Idioma / Language'); box.dataset.noI18n = '';
  box.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z"/></svg>
    <button type="button" lang="es" aria-pressed="${!isEN}" title="Ver la página en español">ES</button><button type="button" lang="en" aria-pressed="${isEN}" title="View the page in English">EN</button>`;
  const logo = host.querySelector('.nx-logo-tab, .g-logo');
  logo ? logo.after(box) : host.prepend(box);
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const next = b.lang; if (next === lang) return;
    try { localStorage.setItem(KEY, next); } catch {}
    const url = new URL(location.href); url.searchParams.delete('lang');
    document.documentElement.classList.add('nx-lang-out');
    setTimeout(() => { url.href === location.href ? location.reload() : location.replace(url.href); }, 140);
  });
}

if (isEN && dict) translatePage();
else document.documentElement.lang = 'es';
mountSwitch();
document.documentElement.classList.remove('nx-i18n-wait');
globalThis.nxI18n = {lang, t, tr, hash};
