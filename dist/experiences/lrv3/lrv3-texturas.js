// =============================================================================
// LRV-3 Apollo 17 · Texturas procedurales (se generan en el navegador, sin archivos)
// NEPTUNI · NASA Space Apps Challenge 2026
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';

// PRNG determinista: mismas texturas en cada carga
export function prng(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(w, h = w) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  return new OffscreenCanvas(w, h);
}

// Ruido de valor tileable (fBm) en una grilla w x h. Devuelve Float32Array 0..1
export function ruidoTileable(w, h, octavas = 5, base = 4, semilla = 7) {
  const out = new Float32Array(w * h);
  const rnd = prng(semilla);
  let amp = 1, tot = 0;
  for (let o = 0; o < octavas; o++) {
    const gx = base << o, gy = Math.max(1, Math.round(gx * h / w));
    const g = new Float32Array(gx * gy);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * gy, y0 = Math.floor(fy), ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      const ya = y0 % gy, yb = (y0 + 1) % gy;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * gx, x0 = Math.floor(fx), tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const xa = x0 % gx, xb = (x0 + 1) % gx;
        const v = (g[ya * gx + xa] * (1 - sx) + g[ya * gx + xb] * sx) * (1 - sy) +
                  (g[yb * gx + xa] * (1 - sx) + g[yb * gx + xb] * sx) * sy;
        out[y * w + x] += v * amp;
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

function aTextura(c, { srgb = true, repetir = [1, 1], aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetir[0], repetir[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// Mapa normal a partir de un campo de alturas (Float32Array)
export function normalDesdeAltura(alt, w, h, fuerza = 2.0) {
  const c = lienzo(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h), d = img.data;
  const A = (x, y) => alt[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (A(x + 1, y) - A(x - 1, y)) * fuerza;
    const dy = (A(x, y + 1) - A(x, y - 1)) * fuerza;
    let nx = -dx, ny = dy, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const cache = new Map();
// Las texturas de esta caché son COMPARTIDAS entre todos los rovers/visores de la página:
// quien destruya un visor no debe liberarlas (ver esCompartida()).
const compartidas = new WeakSet();
function registrar(v) {
  if (!v) return;
  if (v.isTexture) { compartidas.add(v); return; }
  if (typeof v === 'object') for (const k of Object.keys(v)) if (v[k] && v[k].isTexture) compartidas.add(v[k]);
}
function memo(clave, fn) { if (!cache.has(clave)) { const v = fn(); registrar(v); cache.set(clave, v); } return cache.get(clave); }
/** true si la textura pertenece a la caché global (no debe hacerse dispose() al destruir un visor). */
export function esCompartida(tex) { return !!tex && compartidas.has(tex); }

// --- Suciedad general (multiplica el color base de metales y pinturas) ---------
export function texSuciedad() {
  return memo('suciedad', () => {
    const w = 512, n = ruidoTileable(w, w, 6, 4, 11), m = ruidoTileable(w, w, 3, 32, 12);
    const c = lienzo(w), ctx = c.getContext('2d'), img = ctx.createImageData(w, w), d = img.data;
    for (let i = 0; i < w * w; i++) {
      let v = 0.80 + 0.22 * n[i] - (m[i] > 0.78 ? (m[i] - 0.78) * 1.6 : 0);
      v = Math.min(1, Math.max(0.55, v));
      d[i * 4] = v * 255; d[i * 4 + 1] = v * 0.985 * 255; d[i * 4 + 2] = v * 0.965 * 255; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return aTextura(c);
  });
}

export function texRugosidadMetal() {
  return memo('rug', () => {
    const w = 256, n = ruidoTileable(w, w, 5, 8, 21);
    const c = lienzo(w), ctx = c.getContext('2d'), img = ctx.createImageData(w, w), d = img.data;
    for (let i = 0; i < w * w; i++) {
      const v = 0.55 + 0.45 * n[i];
      d[i * 4] = d[i * 4 + 2] = 255; d[i * 4 + 1] = v * 255; d[i * 4 + 3] = 255; // canal G = rugosidad
    }
    ctx.putImageData(img, 0, 0);
    return aTextura(c, { srgb: false });
  });
}

// --- Malla de alambre de acero de las ruedas (color + alfa) ---------------------
export function texMallaRueda() {
  return memo('malla', () => {
    const s = 128, paso = 32, grosor = 6.8;       // alambre más fino: la malla real deja ver a través (antes se veía maciza)
    const c = lienzo(s), ctx = c.getContext('2d');
    const a = lienzo(s), actx = a.getContext('2d');
    ctx.fillStyle = '#2a2927'; ctx.fillRect(0, 0, s, s);
    actx.fillStyle = '#000'; actx.fillRect(0, 0, s, s);
    const dib = (g, color, ancho) => {
      g.strokeStyle = color; g.lineWidth = ancho; g.lineCap = 'round';
      for (let k = -s; k <= 2 * s; k += paso) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke();
        g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
      }
    };
    dib(actx, '#fff', grosor);
    dib(ctx, '#8d8a84', grosor);
    dib(ctx, '#c9c6bf', grosor * 0.35);       // brillo del alambre
    // nudos del tejido
    ctx.fillStyle = '#b3afa6';
    for (let y = 0; y <= s; y += paso / 2) for (let x = (y / (paso / 2)) % 2 ? paso / 2 : 0; x <= s; x += paso) {
      ctx.beginPath(); ctx.arc(x, y, grosor * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    return { mapa: aTextura(c), alfa: aTextura(a, { srgb: false }) };
  });
}

// --- Foil dorado arrugado (Kapton/mylar) ----------------------------------------
// --- Foil dorado de manta multicapa: facetas arrugadas que brillan distinto -----
export function texFoil(semilla = 5) {
  return memo('foilv3' + semilla, () => {
    // relieve: ondulación grande + líneas de doblez (cresta clara junto a valle oscuro) + arrugado fino
    const s = 512, rnd = prng(semilla);
    const n1 = ruidoTileable(s, s, 4, 3, 60 + semilla), n2 = ruidoTileable(s, s, 3, 24, 70 + semilla);
    const hc0 = lienzo(s), hx = hc0.getContext('2d');
    hx.fillStyle = '#808080'; hx.fillRect(0, 0, s, s);
    const envolver = (dibujar) => { for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) dibujar(dx, dy); };
    for (let i = 0; i < 95; i++) {                       // dobleces: tramos casi rectos que se quiebran
      let x = rnd() * s, y = rnd() * s, a = rnd() * Math.PI * 2;
      const tramos = 2 + Math.floor(rnd() * 3), pts = [[x, y]];
      for (let k = 0; k < tramos; k++) { a += (rnd() - 0.5) * 0.9; const L = 25 + rnd() * 90; x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); }
      const fuerte = 0.25 + rnd() * 0.45, ox = -Math.sin(a) * 1.6, oy = Math.cos(a) * 1.6;
      envolver((dx, dy) => {
        for (const [col, o] of [[`rgba(0,0,0,${fuerte})`, 0], [`rgba(255,255,255,${fuerte * 0.85})`, 1]]) {
          hx.strokeStyle = col; hx.lineWidth = 1.3 + rnd() * 1.4;
          hx.beginPath(); pts.forEach(([px, py], k) => { const X = px + dx + o * ox, Y = py + dy + o * oy; k ? hx.lineTo(X, Y) : hx.moveTo(X, Y); }); hx.stroke();
        }
      });
    }
    const hc1 = lienzo(s), hy = hc1.getContext('2d');
    hy.filter = 'blur(1.5px)'; hy.drawImage(hc0, 0, 0); hy.filter = 'none';
    const hd = hy.getImageData(0, 0, s, s).data;
    const alt = new Float32Array(s * s);
    const c = lienzo(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    for (let i = 0; i < s * s; i++) {
      const f = hd[i * 4] / 255 - 0.5;                   // -0.5 valle … +0.5 cresta
      alt[i] = n1[i] * 1.8 + f * 0.6 + n2[i] * 0.06;
      const k = (0.82 + 0.32 * n1[i]) * (1 + f * 0.75) * (0.95 + 0.1 * n2[i]);
      d[i * 4] = Math.min(255, 214 * k); d[i * 4 + 1] = Math.min(255, 160 * k); d[i * 4 + 2] = Math.min(255, 70 * k); d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // algunos reflejos pálidos alargados, como en el kapton arrugado
    for (let i = 0; i < 70; i++) {
      const x = rnd() * s, y = rnd() * s, l = 18 + rnd() * 60, a = rnd() * 6.28;
      ctx.strokeStyle = `rgba(255,236,176,${0.10 + rnd() * 0.18})`; ctx.lineWidth = 2 + rnd() * 5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
    return { mapa: aTextura(c), normal: aTextura(normalDesdeAltura(alt, s, s, 7.0), { srgb: false }) };
  });
}

// --- Guardabarros de fibra de vidrio (naranja/óxido, polvo y placas blancas) ----
export function texGuardabarros(semilla = 3, placa = true, lado = 1) {
  return memo('gb' + semilla + placa + lado, () => {
    const w = 512, h = 256, rnd = prng(semilla);
    const n = ruidoTileable(w, h, 6, 4, 30 + semilla), m = ruidoTileable(w, h, 4, 16, 40 + semilla);
    const c = lienzo(w, h), ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const borde = Math.min(y, h - 1 - y) / h;           // polvo en los bordes
      const polvo = Math.min(1, Math.max(0, 0.55 - borde * 5) + (m[i] - 0.5) * 0.9 + (n[i] - 0.5) * 0.6);
      let r = 188, g = 112, b = 66;                         // naranja óxido
      r = r * (0.82 + 0.3 * n[i]); g = g * (0.82 + 0.3 * n[i]); b = b * (0.85 + 0.25 * n[i]);
      const pr = 150, pg = 140, pb = 128;                   // regolito
      const k = Math.min(0.85, Math.max(0, polvo) * 0.75 + 0.12);
      d[i * 4] = r * (1 - k) + pr * k; d[i * 4 + 1] = g * (1 - k) + pg * k; d[i * 4 + 2] = b * (1 - k) + pb * k; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (placa) {   // bandera de EE. UU. en los guardabarros delanteros (fotos AS17)
      // u = a lo largo del arco (más u = más adelante), v = a lo ancho (lado 1: arriba = exterior)
      const fw = w * 0.27, fh = h * 0.40, x0 = w * 0.48, y0 = (h - fh) / 2;
      const franja = fh / 13;
      for (let k = 0; k < 13; k++) {
        ctx.fillStyle = k % 2 === 0 ? 'rgba(170,52,48,0.92)' : 'rgba(236,232,222,0.92)';
        ctx.fillRect(x0, y0 + k * franja, fw, franja + 0.5);
      }
      const cw = fw * 0.40, ch = franja * 7;
      const cx = x0 + fw - cw, cy = lado > 0 ? y0 : y0 + fh - ch;     // cantón adelante y hacia afuera
      ctx.fillStyle = 'rgba(48,52,96,0.95)'; ctx.fillRect(cx, cy, cw, ch);
      ctx.fillStyle = 'rgba(236,232,222,0.9)';
      for (let fy = 0; fy < 5; fy++) for (let fx = 0; fx < 6; fx++) ctx.fillRect(cx + 3 + fx * (cw - 6) / 6, cy + 3 + fy * (ch - 6) / 5, 1.6, 1.6);
      // polvo y desgaste encima de la bandera
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = `rgba(150,140,128,${0.12 + rnd() * 0.25})`;
        ctx.fillRect(x0 + rnd() * fw, y0 + rnd() * fh, 1 + rnd() * 5, 1 + rnd() * 3);
      }
    }
    // rayones
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '230,200,170' : '70,40,25'},${0.15 + rnd() * 0.25})`;
      ctx.lineWidth = 0.5 + rnd(); const x = rnd() * w, y = rnd() * h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 20); ctx.stroke();
    }
    return aTextura(c, { repetir: [1, 1] });
  });
}

// --- Cinchas de nylon de los asientos --------------------------------------------
export function texCincha() {
  return memo('cincha', () => {
    const w = 64, h = 256, rnd = prng(9);
    const c = lienzo(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = '#958e81'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { ctx.fillStyle = `rgba(120,110,95,${0.10 + rnd() * 0.12})`; ctx.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 4) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, 0, 1, h); }
    ctx.fillStyle = 'rgba(105,95,80,0.35)'; ctx.fillRect(0, 0, 3, h); ctx.fillRect(w - 3, 0, 3, h);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(140,130,115,${rnd() * 0.3})`; ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 10); }
    return aTextura(c);
  });
}

// --- Tela de la antena HGA (malla en gajos) ----------------------------------------
export function texTelaHGA() {
  return memo('hga', () => {
    const s = 512, n = ruidoTileable(s, s, 4, 8, 51);
    const c = lienzo(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    for (let i = 0; i < s * s; i++) {
      const x = i % s, y = (i / s) | 0;
      const tejido = ((x % 4) < 1 || (y % 4) < 1) ? 0.9 : 1.0;
      const v = (0.86 + 0.14 * n[i]) * tejido;
      d[i * 4] = 214 * v; d[i * 4 + 1] = 202 * v; d[i * 4 + 2] = 178 * v; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return aTextura(c, { repetir: [6, 2] });
  });
}

// --- Bolsas y cubiertas de tela beta ---------------------------------------------
export function texTela() {
  return memo('tela', () => {
    const s = 256, n = ruidoTileable(s, s, 5, 6, 61);
    const c = lienzo(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    for (let i = 0; i < s * s; i++) {
      const x = i % s, y = (i / s) | 0;
      const t = ((x + y) % 3 === 0) ? 0.95 : 1;
      const v = (0.84 + 0.16 * n[i]) * t;
      d[i * 4] = 236 * v; d[i * 4 + 1] = 231 * v; d[i * 4 + 2] = 218 * v; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return aTextura(c, { repetir: [2, 2] });
  });
}

// --- Regolito lunar (color + normal) para el terreno --------------------------------
export function texRegolito() {
  return memo('regolito', () => {
    const s = 1024, n = ruidoTileable(s, s, 7, 8, 71), p = ruidoTileable(s, s, 3, 64, 72);
    const rnd = prng(73);
    const alt = new Float32Array(s * s);
    for (let i = 0; i < s * s; i++) alt[i] = n[i] * 0.6 + p[i] * 0.4;
    // guijarros
    for (let k = 0; k < 2600; k++) {
      const cx = rnd() * s, cy = rnd() * s, r = 1 + Math.pow(rnd(), 3) * 9;
      const r2 = r * r;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dd = (x - cx) ** 2 + (y - cy) ** 2; if (dd > r2) continue;
        const i = ((y + s) % s) * s + ((x + s) % s);
        alt[i] += Math.sqrt(1 - dd / r2) * 0.35;
      }
    }
    const c = lienzo(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    for (let i = 0; i < s * s; i++) {
      const v = 0.70 + 0.20 * n[i] + 0.16 * (alt[i] - 0.5);
      const vv = Math.min(1, Math.max(0.3, v));
      d[i * 4] = 126 * vv; d[i * 4 + 1] = 124 * vv; d[i * 4 + 2] = 121 * vv; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return { mapa: aTextura(c), normal: aTextura(normalDesdeAltura(alt, s, s, 6.0), { srgb: false }) };
  });
}

// --- Tierra (para el cielo) ----------------------------------------------------
export function texTierra() {
  return memo('tierra', () => {
    const w = 512, h = 256, n = ruidoTileable(w, h, 6, 4, 81), nub = ruidoTileable(w, h, 6, 8, 82);
    const c = lienzo(w, h), ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, lat = Math.abs(y / h - 0.5) * 2;
      let r = 18, g = 52, b = 120;                                   // océano
      if (n[i] > 0.56 && lat < 0.85) { const k = (n[i] - 0.56) * 4; r = 95 + 60 * k; g = 105 + 30 * k; b = 60 + 10 * k; }
      if (lat > 0.82) { r = g = b = 235; }                         // casquetes
      const nb = Math.max(0, nub[i] - 0.48) * 3.2;                  // nubes
      r = r + (250 - r) * Math.min(1, nb); g = g + (252 - g) * Math.min(1, nb); b = b + (255 - b) * Math.min(1, nb);
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = aTextura(c); t.wrapT = THREE.ClampToEdgeWrapping; return t;
  });
}


// --- Malla de punto del reflector HGA (con huecos reales vía alphaMap) -------------
export function texMallaHGA() {
  return memo('mallaHGA', () => {
    const s = 256, paso = 8, n = ruidoTileable(s, s, 4, 8, 51);
    const c = lienzo(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    const a = lienzo(s), actx = a.getContext('2d'), ima = actx.createImageData(s, s), da = ima.data;
    for (let i = 0; i < s * s; i++) {
      const x = i % s, y = (i / s) | 0;
      const u = (x % paso) / paso, v = (y % paso) / paso;
      // punto tejido: hilos diagonales que dejan rombos abiertos
      const hilo = Math.min(Math.abs(((u + v) % 1) - 0.5), Math.abs(((u - v + 1) % 1) - 0.5));
      const lleno = hilo > 0.31 ? 1 : 0;
      const k = 0.82 + 0.18 * n[i];
      d[i * 4] = 214 * k; d[i * 4 + 1] = 200 * k; d[i * 4 + 2] = 170 * k; d[i * 4 + 3] = 255;
      const al = lleno ? 255 : 40; da[i * 4] = da[i * 4 + 1] = da[i * 4 + 2] = al; da[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); actx.putImageData(ima, 0, 0);
    return { mapa: aTextura(c, { repetir: [10, 10] }), alfa: aTextura(a, { srgb: false, repetir: [10, 10] }) };
  });
}

// --- Cara de la consola (Control and Display Console) -----------------------------
// Contenido según LRV-3 Systems Handbook MSC-07464 §5.2 (instrumentos y breakers);
// la DISPOSICIÓN exacta es una reconstrucción educativa.
export function texPanelConsola() {
  return memo('consola', () => {
    const W = 600, H = 720, c = lienzo(W, H), x = c.getContext('2d');
    x.fillStyle = '#2b2d30'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#9a9c9e'; x.lineWidth = 3; x.strokeRect(6, 6, W - 12, H - 12);
    const t = (txt, px, py, tam = 15, col = '#e9e6dc', al = 'center') => { x.fillStyle = col; x.font = `600 ${tam}px monospace`; x.textAlign = al; x.fillText(txt, px, py); };
    const dial = (cx, cy, r, rot, et) => {
      x.fillStyle = '#e9e6dc'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
      x.strokeStyle = '#2b2d30'; x.lineWidth = 2;
      for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); x.lineTo(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95); x.stroke(); }
      x.strokeStyle = '#c0392b'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(rot) * r * 0.8, cy + Math.sin(rot) * r * 0.8); x.stroke();
      t(et, cx, cy + r + 18, 13);
    };
    const contador = (px, py, txt, et) => { x.fillStyle = '#111'; x.fillRect(px, py, 96, 30); t(txt, px + 48, py + 22, 20, '#f0c040'); t(et, px + 48, py + 46, 12); };
    // panel superior: navegación
    t('NAVIGATION', W / 2, 32, 16, '#d9a441');
    dial(110, 120, 58, -1.2, 'PITCH / ROLL');           // indicador de actitud ±25°
    dial(300, 130, 72, -0.4, 'HEADING (IPI)');          // rosa de rumbo del IPI
    contador(420, 70, '247', 'BEARING');
    contador(420, 130, '03.1', 'RANGE km');
    contador(420, 190, '11.4', 'DISTANCE km');
    t('SUN SHADOW', 110, 230, 12); x.fillStyle = '#e9e6dc'; x.fillRect(80, 238, 60, 12);
    x.fillStyle = '#9a9c9e'; x.fillRect(10, 268, W - 20, 3);
    // panel inferior: monitoreo y control
    t('MONITOR & CONTROL', W / 2, 296, 16, '#d9a441');
    dial(110, 370, 50, -2.4, 'SPEED 0-20 km/h');
    const barra = (px, et) => { x.fillStyle = '#111'; x.fillRect(px, 330, 34, 90); x.fillStyle = '#e9e6dc'; x.fillRect(px + 8, 330 + 30, 18, 60); t(et, px + 17, 436, 11); };
    ['AMP-HR', 'VOLTS', 'AMPS', 'BATT °F', 'MOTOR °F'].forEach((e, k) => barra(200 + k * 76, e));
    // interruptores
    const sw = (px, py, et) => { x.fillStyle = '#c9c7c0'; x.fillRect(px - 6, py - 14, 12, 28); x.fillStyle = '#e9e6dc'; x.beginPath(); x.arc(px, py - 14, 6, 0, 7); x.fill(); t(et, px, py + 30, 10); };
    ['PWM SEL', 'LF', 'RF', 'LR', 'RR', 'STEER F', 'STEER R', '±15 DC', 'NAV PWR', 'AUX'].forEach((e, k) => sw(45 + k * 56, 486, e));
    // breakers (CB1–CB14, §5.2.3)
    t('CIRCUIT BREAKERS', W / 2, 548, 13, '#d9a441');
    for (let k = 0; k < 14; k++) {
      const px = 40 + (k % 7) * 80, py = 580 + Math.floor(k / 7) * 64;
      x.fillStyle = '#d8d6cf'; x.beginPath(); x.arc(px, py, 11, 0, 7); x.fill();
      t('CB' + (k + 1), px, py + 30, 11);
    }
    t('reconstrucción educativa del panel · MSC-07464 §5.2', W / 2, H - 14, 11, '#9a9c9e');
    return aTextura(c);
  });
}

// --- Hoja de mapa plastificado (reparación del guardabarros, Apollo 17) -----------
export function texMapa(semilla = 1) {
  return memo('mapa' + semilla, () => {
    const s = 512, rnd = prng(semilla), c = lienzo(s), x = c.getContext('2d');
    x.fillStyle = '#d9d6cc'; x.fillRect(0, 0, s, s);
    x.strokeStyle = 'rgba(120,110,95,0.55)'; x.lineWidth = 1;
    for (let k = 0; k < 26; k++) {                    // curvas de nivel
      const cx = rnd() * s, cy = rnd() * s, r = 20 + rnd() * 160;
      x.beginPath(); for (let a = 0; a <= 6.3; a += 0.15) { const rr = r * (1 + 0.18 * Math.sin(a * 3 + k)); a ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + rr, cy); } x.stroke();
    }
    x.strokeStyle = 'rgba(40,40,40,0.35)';           // cuadrícula del mapa
    for (let k = 0; k <= s; k += 64) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, s); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(s, k); x.stroke(); }
    x.fillStyle = 'rgba(30,30,30,0.6)';
    for (let k = 0; k < 40; k++) x.fillRect(rnd() * s, rnd() * s, 10 + rnd() * 40, 3);
    x.fillStyle = 'rgba(140,130,118,0.35)';           // polvo
    for (let k = 0; k < 900; k++) x.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 3, 1 + rnd() * 3);
    return aTextura(c);
  });
}

// --- Rayas para visualizar flujos (ayuda educativa, no existían en 1972) ----------
export function texFlujo() {
  return memo('flujo', () => {
    const c = lienzo(128, 16), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 128, 16);
    const g = x.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,1)'); g.addColorStop(0.8, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 16);
    return aTextura(c, { srgb: false });
  });
}
