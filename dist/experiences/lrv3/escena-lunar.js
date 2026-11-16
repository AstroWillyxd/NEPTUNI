// =============================================================================
// Escena lunar procedural: regolito, cráteres, rocas, macizos al fondo, cielo
// negro con la Tierra, sol con sombras duras y huellas de rover y botas.
// NEPTUNI · NASA Space Apps Challenge 2026
//
// Geometría del cielo (Taurus-Littrow, 20.19° N, 30.77° E; EVA-2, 12 dic 1972):
//  · Tierra a ~54° de elevación (90° − arccos(cos φ · cos λ), libraciones ignoradas).
//  · Sol a ~26° de elevación (≈13° al alunizar + ~12°/día terrestre). Inferido, no medido.
//  · Los azimuts son de ESCENA (la orientación del rover es libre); se conserva la
//    separación Sol–Tierra (~140°) que resulta de esa geometría.
// El terreno, las rocas y las huellas pueden ocultarse o volverse transparentes sin tocar
// las luces (setTerreno), para inspeccionar el rover por debajo.
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';
import * as TX from './lrv3-texturas.js';

// --- ruido 2D (valor, suave) -------------------------------------------------
function hash2(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function ruido(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
}
function fbm(x, z, oct = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * ruido(x * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
}

// --- cráteres deterministas -----------------------------------------------------
function generarCrateres(n, rMin, rMax, semilla, zonaLibre = 7) {
  const rnd = TX.prng(semilla), out = [];
  while (out.length < n) {
    const d = Math.sqrt(rnd()) * rMax, a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = rMin * Math.pow(30, Math.pow(rnd(), 2.2));
    if (Math.hypot(x, z) < zonaLibre + r) continue;
    out.push({ x, z, r, prof: r * (0.12 + rnd() * 0.08) });
  }
  return out;
}
const CRATERES = [
  ...generarCrateres(70, 0.25, 60, 101),
  ...generarCrateres(40, 1.5, 220, 202, 14),
  ...generarCrateres(14, 8, 600, 303, 40),
];

function perfilCrater(d, c) {
  const t = d / c.r;
  if (t > 2.2) return 0;
  if (t < 1) return -c.prof * (1 - t * t) + c.prof * 0.25 * Math.pow(t, 6);      // cuenco + subida del borde
  return c.prof * 0.25 * Math.exp(-((t - 1) * (t - 1)) / 0.12);                   // borde elevado
}

// Altura del terreno (metros)
export function alturaTerreno(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.05, z * 0.05, 5) - 0.5) * 2.2 + (fbm(x * 0.6, z * 0.6, 3) - 0.5) * 0.12;
  for (const c of CRATERES) {
    const dd = Math.hypot(x - c.x, z - c.z);
    if (dd < c.r * 2.2) h += perfilCrater(dd, c);
  }
  // zona plana bajo el rover
  const k = THREE.MathUtils.smoothstep(d, 3.5, 12);
  h = h * k;
  // macizos (North / South Massif, East Massif) a varios km
  if (d > 1500) {
    const ang = Math.atan2(z, x);
    const mascara = 0.5 + 0.5 * Math.cos(ang * 2 + 0.8) + 0.3 * Math.cos(ang * 5 - 1.1);
    const sube = THREE.MathUtils.smoothstep(d, 2600, 6500);
    const cresta = 1 - Math.abs(fbm(x * 0.0004 + 3, z * 0.0004 - 7, 6) * 2 - 1);
    const lomo = fbm(x * 0.0011 - 5, z * 0.0011 + 2, 5);
    h += sube * Math.max(0, mascara) * (500 + 1500 * cresta * cresta * lomo) ;
  }
  return h;
}

// --- geometría polar: más detalle cerca del rover ---------------------------------
function geomTerreno(rIni, rFin, nRad, nAng, potencia, uvEscala) {
  const pos = [], uv = [], col = [], idx = [];
  for (let j = 0; j <= nRad; j++) {
    const t = j / nRad, r = rIni + (rFin - rIni) * Math.pow(t, potencia);
    for (let i = 0; i <= nAng; i++) {
      const a = (i / nAng) * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = alturaTerreno(x, z);
      pos.push(x, y, z); uv.push(x / uvEscala, z / uvEscala);
      const lad = r > 1500 ? THREE.MathUtils.smoothstep(r, 2600, 6000) * 0.1 : 0;
      // variación de albedo de gran escala (rompe la repetición) + eyecta clara en bordes
      let v = 0.86 + 0.22 * (fbm(x * 0.02 + 9, z * 0.02 - 4, 4) - 0.5) + 0.10 * (fbm(x * 0.15, z * 0.15, 3) - 0.5);
      for (const c of CRATERES) { const dd = Math.hypot(x - c.x, z - c.z); if (dd < c.r * 2.4 && dd > c.r * 0.85) v += 0.07 * Math.exp(-((dd / c.r - 1.15) ** 2) / 0.2); }
      v += lad;
      col.push(v, v * 0.99, v * 0.975);
    }
  }
  for (let j = 0; j < nRad; j++) for (let i = 0; i < nAng; i++) {
    const a = j * (nAng + 1) + i, b = a + nAng + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// --- rocas -------------------------------------------------------------------
function geomRoca(semilla) {
  const g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, rnd = TX.prng(semilla);
  const off = [rnd() * 10, rnd() * 10, rnd() * 10];
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.6 + off[0], v.z * 1.6 + v.y * 0.7 + off[1], 3);
    const fino = fbm(v.x * 6 + off[2], v.z * 6 - v.y * 3, 3);
    const facetas = Math.max(0.0, Math.sin(v.x * 3 + v.z * 2 + off[2]) * 0.12);
    v.multiplyScalar(0.72 + n * 0.55 + fino * 0.12 - facetas);
    v.y *= 0.62;                                           // las rocas lunares son achatadas
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// --- texturas de huellas ---------------------------------------------------------
function texHuellaRueda() {
  const w = 128, h = 256;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(70,68,64,0)'); grad.addColorStop(0.12, 'rgba(70,68,64,0.55)');
  grad.addColorStop(0.88, 'rgba(70,68,64,0.55)'); grad.addColorStop(1, 'rgba(70,68,64,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(175,170,160,0.55)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let y = -40; y < h + 40; y += 32) {        // chevrones impresos
    ctx.beginPath(); ctx.moveTo(18, y + 18); ctx.lineTo(w / 2, y); ctx.lineTo(w - 18, y + 18); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function texBota() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(62,60,56,0.62)';
  ctx.beginPath(); ctx.ellipse(32, 38, 20, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(32, 98, 16, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(160,156,148,0.55)'; ctx.lineWidth = 3;
  for (let y = 14; y < 124; y += 8) { ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(50, y); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// =============================================================================
/**
 * Crea el entorno lunar dentro de `escena`.
 * @returns {{sol: THREE.DirectionalLight, actualizarSombra: Function, objetos: THREE.Group}}
 */
export function crearEscenaLunar(renderer, escena, op = {}) {
  const {
    elevacionSol = 26, azimutSol = -128,   // grados (azimut desde +X hacia +Z)
    elevacionTierra = 54, azimutTierra = 15,
    estrellas = true, tierra = true, huellas = true, rocas = true, calidad = 'alta',
  } = op;
  const g = new THREE.Group(); g.name = 'Escena_Lunar';
  escena.add(g);
  escena.background = new THREE.Color(0x000000);

  // ---- terreno
  const reg = TX.texRegolito();
  const matSuelo = new THREE.MeshStandardMaterial({
    name: 'Regolito', map: reg.mapa, normalMap: reg.normal, normalScale: new THREE.Vector2(0.7, 0.7),
    vertexColors: true, roughness: 0.97, metalness: 0,
  });
  const alta = calidad === 'alta';
  const cerca = new THREE.Mesh(geomTerreno(0.0, 700, alta ? 230 : 150, alta ? 360 : 240, 2.6, 3.4), matSuelo);
  cerca.receiveShadow = true; cerca.name = 'Terreno_cercano';
  g.add(cerca);
  const matLejos = matSuelo.clone(); matLejos.normalScale = new THREE.Vector2(0.4, 0.4);
  const lejos = new THREE.Mesh(geomTerreno(690, 16000, 110, 420, 1.5, 40), matLejos);
  lejos.name = 'Macizos'; g.add(lejos);

  // ---- rocas
  if (rocas) {
    const rnd = TX.prng(909);
    const matRoca = new THREE.MeshStandardMaterial({ name: 'Roca_basalto', color: 0x76736f, roughness: 0.95, map: TX.texSuciedad(), normalMap: reg.normal, normalScale: new THREE.Vector2(1.4, 1.4) });
    const variantes = [0, 1, 2, 3, 4].map((k) => geomRoca(500 + k));
    const porVar = alta ? 120 : 70;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    variantes.forEach((geo, k) => {
      const im = new THREE.InstancedMesh(geo, matRoca, porVar);
      let n = 0;
      while (n < porVar) {
        const d = 3.2 + Math.pow(rnd(), 1.7) * 90, a = rnd() * Math.PI * 2;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (Math.abs(z) < 1.4 && x < 1.5) continue;           // no tapar las huellas
        const big = d > 14 && rnd() < 0.06 ? 1 : 0;
        const r = big ? 0.25 + rnd() * 0.55 : 0.02 + Math.pow(rnd(), 2.8) * 0.2;
        s.set(r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.5), r * (0.8 + rnd() * 0.5));
        p.set(x, alturaTerreno(x, z) - r * 0.18, z);
        q.setFromEuler(e.set(rnd() * 0.4, rnd() * 6.28, rnd() * 0.4));
        im.setMatrixAt(n++, m4.compose(p, q, s));
      }
      im.castShadow = true; im.receiveShadow = true; im.name = 'Rocas_' + k;
      g.add(im);
    });
  }

  // ---- huellas del rover (venía desde atrás en una curva suave) y de botas
  if (huellas) {
    const matHuella = new THREE.MeshStandardMaterial({ map: texHuellaRueda(), transparent: true, depthWrite: false, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const centro = (sv) => new THREE.Vector3(-sv, 0, 1.6 * Math.sin(sv / 9) * THREE.MathUtils.smoothstep(sv, 0, 14));
    for (const lado of [1, -1]) {
      const pos = [], uv = [], idx = [];
      const N = 260, ancho = 0.25;
      let v = 0;
      for (let i = 0; i <= N; i++) {
        const sv = -1.05 + i * 0.32;
        const c = centro(sv), c2 = centro(sv + 0.05);
        const dir = c2.clone().sub(c).normalize(), nor = new THREE.Vector3(-dir.z, 0, dir.x);
        const cc = c.clone().addScaledVector(nor, lado * 0.914);
        for (const k of [-1, 1]) {
          const pp = cc.clone().addScaledVector(nor, k * ancho / 2);
          pos.push(pp.x, alturaTerreno(pp.x, pp.z) + 0.006, pp.z);
          uv.push(k < 0 ? 0 : 1, v);
        }
        v += 0.32 / 0.21;
        if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, matHuella); m.receiveShadow = true; m.name = 'Huella_rueda_' + (lado > 0 ? 'der' : 'izq');
      g.add(m);
    }
    // botas: dos caminatas desde los asientos
    const matBota = new THREE.MeshStandardMaterial({ map: texBota(), transparent: true, depthWrite: false, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const geoB = new THREE.PlaneGeometry(0.16, 0.33); geoB.rotateX(-Math.PI / 2);
    const rnd = TX.prng(77);
    const pasos = [];
    for (const [x0, z0, ang0] of [[-0.3, -1.5, -0.4], [-0.3, 1.5, 2.6], [1.0, -1.3, -1.2]]) {
      let x = x0, z = z0, ang = ang0;
      for (let i = 0; i < 34; i++) {
        ang += (rnd() - 0.5) * 0.35;
        x += Math.cos(ang) * 0.42; z += Math.sin(ang) * 0.42;
        const lat = (i % 2 ? 1 : -1) * 0.12;
        pasos.push([x - Math.sin(ang) * lat, z + Math.cos(ang) * lat, ang]);
      }
    }
    const im = new THREE.InstancedMesh(geoB, matBota, pasos.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    pasos.forEach(([x, z, a], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
      m4.compose(new THREE.Vector3(x, alturaTerreno(x, z) + 0.008, z), q, new THREE.Vector3(1, 1, 1));
      im.setMatrixAt(i, m4);
    });
    im.receiveShadow = true; im.name = 'Huellas_botas'; g.add(im);
  }

  // ---- cielo: estrellas tenues y la Tierra
  if (estrellas) {
    const rnd = TX.prng(4242), n = 2600, pos = [], col = [];
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const y = Math.abs(u) * 0.98 + 0.02;
      pos.push(Math.cos(a) * r * 15000, y * 15000, Math.sin(a) * r * 15000);
      const b = 0.25 + Math.pow(rnd(), 6) * 0.9;
      col.push(b, b, b * (0.9 + rnd() * 0.2));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.3, sizeAttenuation: false, vertexColors: true, depthWrite: false, fog: false }));
    pts.name = 'Estrellas'; pts.renderOrder = -2; g.add(pts);
  }

  const dirSol = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevacionSol), THREE.MathUtils.degToRad(90 - azimutSol));
  if (tierra) {
    const R = 14000, rad = R * Math.tan(THREE.MathUtils.degToRad(1.0));     // ~2° de diámetro aparente
    const geo = new THREE.SphereGeometry(rad, 64, 32);
    const mat = new THREE.MeshStandardMaterial({ map: TX.texTierra(), roughness: 0.75, metalness: 0, emissive: 0x0a1630, emissiveIntensity: 0.6 });
    const t = new THREE.Mesh(geo, mat); t.name = 'Tierra';
    t.position.setFromSphericalCoords(R, THREE.MathUtils.degToRad(90 - elevacionTierra), THREE.MathUtils.degToRad(90 - azimutTierra));
    t.rotation.set(0.4, 2.2, 0.1);
    g.add(t);
    // atmósfera
    const halo = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.06, 48, 24), new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false }));
    halo.position.copy(t.position); g.add(halo);
  }

  // ---- luces: sol duro + rebote del regolito (no hay atmósfera, no hay niebla)
  const sol = new THREE.DirectionalLight(0xfffaf2, 3.6);
  sol.name = 'Sol';
  sol.position.copy(dirSol).multiplyScalar(12);
  sol.castShadow = true;
  sol.shadow.mapSize.set(alta ? 4096 : 2048, alta ? 4096 : 2048);
  const sc = sol.shadow.camera; sc.left = -4.2; sc.right = 4.2; sc.top = 4.2; sc.bottom = -4.2; sc.near = 0.5; sc.far = 40;
  sol.shadow.bias = -0.00025; sol.shadow.normalBias = 0.012;
  g.add(sol); g.add(sol.target);
  // sombras lejanas (rocas grandes, cráteres) con una segunda luz sin color
  const rebote = new THREE.HemisphereLight(0x0c0d10, 0x7a766f, 0.85); rebote.name = 'Rebote_regolito';
  g.add(rebote);
  const relleno = new THREE.DirectionalLight(0xbfc6d6, 0.18); relleno.position.set(-dirSol.x, 0.5, -dirSol.z).multiplyScalar(10); g.add(relleno);

  // ---- entorno para reflejos de metales: cielo negro, suelo gris, sol
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const domo = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { sol: { value: dirSol } },
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 sol; varying vec3 p; void main(){ vec3 d = normalize(p);
      float suelo = smoothstep(0.02, -0.06, d.y);
      vec3 c = mix(vec3(0.004), vec3(0.36,0.35,0.33) * (0.75 + 0.25*smoothstep(-1.0,0.0,d.y)), suelo);
      c += vec3(6.0,5.8,5.4) * pow(max(dot(d, normalize(sol)),0.0), 900.0);
      gl_FragColor = vec4(c,1.0); }`,
  }));
  env.add(domo);
  const rt = pm.fromScene(env, 0.0);
  escena.environment = rt.texture;
  pm.dispose();
  domo.geometry.dispose(); domo.material.dispose();

  const actualizarSombra = (centro) => { sol.target.position.copy(centro); sol.position.copy(centro).addScaledVector(dirSol, 12); };
  actualizarSombra(new THREE.Vector3(0, 0.6, 0));

  // ---- modos del terreno (las luces quedan intactas)
  const terreno = g.children.filter((o) => (o.isMesh || o.isInstancedMesh) && /^(Terreno|Macizos|Rocas|Huella)/.test(o.name));
  const matsTerreno = [...new Set(terreno.map((o) => o.material))];
  const orig = new Map(matsTerreno.map((m) => [m, { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite }]));
  let modo = 'visible';
  function setTerreno(nuevo) {
    if (nuevo === modo) return modo;
    modo = nuevo;
    for (const o of terreno) o.visible = modo !== 'oculto';
    for (const m of matsTerreno) {
      const o = orig.get(m);
      if (modo === 'transparente') { m.transparent = true; m.opacity = Math.min(o.opacity, 0.22); m.depthWrite = false; }
      else { m.transparent = o.transparent; m.opacity = o.opacity; m.depthWrite = o.depthWrite; }
      m.needsUpdate = true;
    }
    return modo;
  }
  const direccionTierra = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevacionTierra), THREE.MathUtils.degToRad(90 - azimutTierra));
  function dispose() {
    if (escena.environment === rt.texture) escena.environment = null;
    rt.dispose();
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { for (const k in m) if (m[k] && m[k].isTexture && !TX.esCompartida(m[k])) m[k].dispose(); m.dispose(); }
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    });
    escena.remove(g);
  }
  return { sol, actualizarSombra, objetos: g, alturaTerreno, terreno, setTerreno, modoTerreno: () => modo,
    direccionTierra, direccionSol: dirSol.clone(), tierra: g.getObjectByName('Tierra') || null, dispose };
}
