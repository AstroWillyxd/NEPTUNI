// =============================================================================
// LRV-3 · Lunar Roving Vehicle del Apollo 17 (Taurus-Littrow, diciembre 1972)
// Modelo procedural en three.js 0.160, articulado, descomponible e inspeccionable.
// NEPTUNI Arqueología Espacial
//
// MARCO INTERNO: pulgadas; X adelante, Y izquierda (izquierda/derecha según el
// conductor sentado mirando hacia adelante), Z arriba; suelo en z = 0.
// GRUPO RAÍZ: metros, Y arriba, frente +X. La conversión es el grupo `LRV3_pulgadas`
// con rotation.x = -PI/2 y escala 0.0254, es decir (x, y, z)NASA = (x, -z, y)three / 0.0254.
//
// EVIDENCIA: cada malla lleva userData.evidencia ∈ {documentado, inferido, educativo},
// userData.fuente (documento + sección/figura o identificador fotográfico) y
// userData.funcion. «documentado» = dato leído en la fuente; «inferido» = forma o
// posición deducida de fotos/planos sin cota; «educativo» = reconstrucción didáctica.
//
// FUENTES (ver FUENTES): MSC-07464 LRV-3 Systems Handbook (2 oct 1972); Boeing LRV
// Operations Handbook LS006-002-2H; HSI-481184 LCRU; GCTA Manual (RCA); NASA-CR-141724 (SEP);
// ALSJ (a17-TGE, a17-TVreflect, a17.sta2); Smithsonian NASM (reparación del guardabarros).
// Las fotos AS17 se citan sólo si su identificador está verificado en el catálogo ALSJ.
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';
import { RoundedBoxGeometry } from '../../vendor/three/RoundedBoxGeometry.js';
import { mergeGeometries } from '../../vendor/three/BufferGeometryUtils.js';
import * as TX from './lrv3-texturas.js';
import { crearCables, actualizarCables, CONEXIONES } from './lrv3-conexiones.js';

export const PULGADA = 0.0254;

// -----------------------------------------------------------------------------
// PARÁMETROS (pulgadas). Estación NASA STA -> x = 71.5 - STA
// -----------------------------------------------------------------------------
export const P = {
  batalla: 90.0, trocha: 72.0, ruedaD: 32.1, ruedaAncho: 9.0, topeD: 25.5, chevrones: 40,
  chasisZ: 17.0, largueroAncho: 1.95, largueroAlto: 2.95,
  semiAnchoCentro: 27.75, semiAnchoExtremos: 14.5,
  staFrente: 15.5, staBisagraDel: 44.3, staBisagraTras: 97.5, staFondo: 125.0,
  guardabarrosExt: 40.5,
  asientoAncho: 20.5, asientoProf: 17.5, asientoRespaldo: 25.0, asientoY: 13.0, staSRP: 86.0,
  consolaAncho: 10.0, consolaAlto: 12.0, hgaD: 36.0,
};
const X = (sta) => 71.5 - sta;
const WR = P.ruedaD / 2;
const ZC = WR + 0.05;
const XF = P.batalla / 2, XR = -P.batalla / 2;
const YW = P.trocha / 2;
const ZB = P.chasisZ;
const ZT = ZB + P.largueroAlto;
// Suspensión: brazos triangulares paralelos (MSC-07464 §4.3); cotas de posición inferidas.
const YK = 29.0;                       // eje del pivote de dirección (king-pin) |y|
const ZLC = ZB - 1.2, ZUC = ZB + 5.0;  // pivotes en el chasis (inferior / superior)
const DZA = -2.9, LA = 14.5;           // vector del brazo (y, z) -> ambos brazos paralelos
const ZLK = ZLC + DZA, ZUK = ZUC + DZA;

export const FUENTES = {
  hb: { id: 'MSC-07464', titulo: 'LRV Systems Handbook, Apollo 17, LRV-3 (2 oct 1972)', url: 'https://apollojournals.org/alsj/LRVSysHndbkA17.pdf' },
  ops: { id: 'LS006-002-2H', titulo: 'LRV Operations Handbook (Boeing, 19 abr 1971)', url: 'https://apollojournals.org/alsj/lrv_opsnas8-25145.pdf' },
  lcru: { id: 'HSI-481184', titulo: 'LCRU Crew Training Manual (LRTM-SY-1 rev. D)', url: 'https://apollojournals.org/alsj/HSI-481184-LCRU.pdf' },
  gcta: { id: 'GCTA Manual', titulo: 'Ground-Commanded Television Assembly (RCA)', url: 'https://apollojournals.org/alsj/GCTA-Manual.pdf' },
  sep: { id: 'NASA-CR-141724', titulo: 'Surface Electrical Properties Experiment', url: 'https://ntrs.nasa.gov/citations/19750013120' },
  tge: { id: 'ALSJ a17-TGE', titulo: 'Traverse Gravimeter Experiment (ALSJ)', url: 'https://apollojournals.org/alsj/a17/a17-TGE.html' },
  tv: { id: 'ALSJ a17-TVreflect', titulo: 'Reflections from the Top of the LRV TV Camera', url: 'https://apollojournals.org/alsj/a17/a17-TVreflect.html' },
  sta2: { id: 'ALSJ a17.sta2', titulo: 'Apollo 17 EVA-2, Station 2', url: 'https://apollojournals.org/alsj/a17/a17.sta2.html' },
  nasm: { id: 'NASM', titulo: 'Duct Tape Auto Repair on the Moon (Smithsonian)', url: 'https://airandspace.si.edu/stories/editorial/duct-tape-auto-repair-moon' },
  fotoA: { id: 'AS17-146-22367', titulo: 'LRV en la estación 8 (EVA-3), vista lateral (LPI Apollo Image Atlas: «STA 8; SPL 8135; LUNAR ROVING VEHICLE»)', url: 'https://www.flickr.com/photos/nasa2explore/9358661413' },
  fotoB: { id: 'foto 3/4 delantera aportada por el equipo', titulo: 'identificador no verificado', url: null },
};
const F = Object.fromEntries(Object.entries(FUENTES).map(([k, v]) => [k, v.id]));

/** Estado histórico reproducido (una sola configuración coherente). */
export const ESTADO_HISTORICO = {
  mision: 'Apollo 17 · LRV-3',
  etapa: 'EVA-2 (12 dic 1972), vehículo detenido en una estación',
  detalles: [
    'Extensión del guardabarros TRASERO DERECHO sustituida por 4 mapas plastificados unidos con cinta gris y 2 pinzas del telescopio de alineación óptica (NASM).',
    'Cubiertas antipolvo de baterías, DCE y SPU cerradas (se abrían entre EVAs para radiar calor; MSC-07464 §3.2).',
    'Manta de la LCRU abierta (paneles colgando, espejos expuestos) y HGA apuntada a la Tierra para TV (modo FM/TV, HSI-481184).',
    'Mantas del receptor SEP abiertas para enfriarlo (ALSJ a17.sta2, 142:46:57).',
    'TGE montado en la parte trasera del rover (ALSJ a17-TGE).',
  ],
};

// Geometría solar/terrestre por defecto (coherente con escena-lunar.js):
// Tierra a 54° de elevación desde Taurus-Littrow (20.19° N, 30.77° E: 90° − arccos(cos φ·cos λ));
// azimut de escena 15° (la escena se orienta para conservar el sol al este por la mañana).
export const TIERRA_ESCENA = { elevacion: 54, azimut: 15 };
/** Dirección (marco NASA del rover) hacia un punto del cielo dado en grados de la escena. */
export function direccionCielo(elevacion, azimut) {
  const v = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevacion), THREE.MathUtils.degToRad(90 - azimut));
  return new THREE.Vector3(v.x, -v.z, v.y);
}

export const LIMITES = {
  direccionInterior: 50, direccionExterior: 22,            // MSC-07464 §4.5.1 (doble Ackermann)
  suspensionCompresion: 6, suspensionExtension: 4,         // pulgadas, MSC-07464 §4.3
  gctaPan: [-214, 134], gctaTilt: [-45, 85],               // grados (+ = izquierda / arriba), GCTA p. 1-3
  gctaVelPan: 3.03, gctaVelTilt: 3.12,                     // °/s, GCTA tabla 1-2
};

// -----------------------------------------------------------------------------
// SUBSISTEMAS
// -----------------------------------------------------------------------------
export const SUBSISTEMAS = [
  { id: 'estructura', nombre: 'Estructura', en: 'Structure', color: '#9aa4ad',
    resumen: 'Chasis de aluminio en tres secciones con bisagras y pasadores de bloqueo: se plegaba para viajar en la bahía del módulo lunar.' },
  { id: 'movilidad', nombre: 'Movilidad', en: 'Mobility', color: '#e0894a',
    resumen: 'Cuatro ruedas de malla de acero con chevrones; cada una con motor CC, reductor armónico 80:1 y freno. Dirección Ackermann delantera y trasera independientes y suspensión de brazos paralelos con barras de torsión.' },
  { id: 'tripulacion', nombre: 'Puesto de tripulación', en: 'Crew station', color: '#d9cfb6',
    resumen: 'Dos asientos plegables de tubo y cinchas, consola de navegación y control con 14 breakers, y el controlador manual en T.' },
  { id: 'energia', nombre: 'Energía y navegación', en: 'Power & navigation', color: '#cfd6dd',
    resumen: 'Dos baterías de plata-zinc de 36 V (23 celdas), cuatro buses (A–D), unidad de procesamiento de señales (SPU), giróscopo direccional (DGU) y electrónica de control de tracción (DCE).' },
  { id: 'comunicaciones', nombre: 'Comunicaciones', en: 'Communications', color: '#d6a640',
    resumen: 'LCRU con batería interna de 29 V, antena de alta ganancia de 3 ft apuntada a mano, antena de baja ganancia, antena VHF y cámara de TV GCTA con tubo SIT controlada desde Houston.' },
  { id: 'ciencia', nombre: 'Carga y ciencia (Apollo 17)', en: 'Payload & science', color: '#7fb3c8',
    resumen: 'Palé y portaherramientas trasero, bolsa de muestras, gravímetro de travesía (TGE) y receptor del experimento SEP con su antena de tres lazos.' },
];

const EXPLOSION = {
  estructura: [0, 0, 0], movilidad: [0, 0, 0], tripulacion: [0, 0, 34],
  energia: [16, 0, 26], comunicaciones: [44, 0, 30], ciencia: [-46, 0, 24],
};

// -----------------------------------------------------------------------------
// Utilidades de geometría (pulgadas)
// -----------------------------------------------------------------------------
let Q = 1;
const S = (n) => Math.max(6, Math.round(n * Q));
const V3 = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));
const EJE_Y = new THREE.Vector3(0, 1, 0);

function alinear(g, a, b) {
  const dir = b.clone().sub(a);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(EJE_Y, dir.normalize()));
  const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z);
  return g;
}
function cil(p1, p2, d, seg = 12, abierto = false) {
  const a = V3(p1), b = V3(p2);
  return alinear(new THREE.CylinderGeometry(d / 2, d / 2, a.distanceTo(b), S(seg), 1, abierto), a, b);
}
function cono(p1, p2, r1, r2, seg = 16, abierto = false) {
  const a = V3(p1), b = V3(p2);
  return alinear(new THREE.CylinderGeometry(r2, r1, a.distanceTo(b), S(seg), 1, abierto), a, b);
}
function esfera(c, r, seg = 10) {
  const g = new THREE.SphereGeometry(r, S(seg), Math.max(4, Math.round(S(seg) * 0.6)));
  g.translate(c[0], c[1], c[2]); return g;
}
function caja(x0, x1, y0, y1, z0, z1, r = 0.18) {
  const [xa, xb] = [Math.min(x0, x1), Math.max(x0, x1)], [ya, yb] = [Math.min(y0, y1), Math.max(y0, y1)], [za, zb] = [Math.min(z0, z1), Math.max(z0, z1)];
  const lx = xb - xa, ly = yb - ya, lz = zb - za, m = Math.min(lx, ly, lz);
  const rr = Math.min(r, m / 2 - 1e-3);
  const g = rr > 0.01 ? new RoundedBoxGeometry(lx, ly, lz, 2, rr) : new THREE.BoxGeometry(lx, ly, lz);
  g.translate((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2); return g;
}
const cajaC = (cx, cy, cz, lx, ly, lz, r) => caja(cx - lx / 2, cx + lx / 2, cy - ly / 2, cy + ly / 2, cz - lz / 2, cz + lz / 2, r);
/** Caja abierta por arriba (paredes de espesor e) para carcasas inspeccionables. */
function cajaAbierta(x0, x1, y0, y1, z0, z1, e = 0.2) {
  return [caja(x0, x1, y0, y1, z0, z0 + e, 0.05), caja(x0, x0 + e, y0, y1, z0, z1, 0.05), caja(x1 - e, x1, y0, y1, z0, z1, 0.05),
    caja(x0, x1, y0, y0 + e, z0, z1, 0.05), caja(x0, x1, y1 - e, y1, z0, z1, 0.05)];
}

function tubo(pts, d, { rc = 1.4, cerrado = false, radial = 10, tapas = true } = {}) {
  let P0 = pts.map(V3);
  if (cerrado) {
    if (P0[0].distanceTo(P0[P0.length - 1]) < 1e-6) P0.pop();
    const m = P0[0].clone().add(P0[1]).multiplyScalar(0.5);
    P0 = [m, ...P0.slice(1), P0[0], m];
  }
  const path = new THREE.CurvePath();
  let prev = P0[0].clone(), largo = 0;
  for (let i = 1; i < P0.length - 1; i++) {
    const a = P0[i - 1], b = P0[i], c = P0[i + 1];
    const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
    const r = Math.min(rc, d1.length() * 0.45, d2.length() * 0.45);
    const p1 = b.clone().sub(d1.normalize().multiplyScalar(r));
    const p2 = b.clone().add(d2.normalize().multiplyScalar(r));
    if (prev.distanceTo(p1) > 1e-4) { path.add(new THREE.LineCurve3(prev.clone(), p1)); largo += prev.distanceTo(p1); }
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2)); largo += r * 1.6;
    prev = p2;
  }
  const fin = P0[P0.length - 1];
  path.add(new THREE.LineCurve3(prev, fin.clone())); largo += prev.distanceTo(fin);
  const g = new THREE.TubeGeometry(path, Math.max(4, Math.round(largo / 0.6 * Q)), d / 2, S(radial), false);
  if (!tapas || cerrado) return g;
  return fusionar([g, esfera(P0[0].toArray(), d / 2, radial), esfera(fin.toArray(), d / 2, radial)]);
}
function anillo(cx, cy, cz, R, d, eje = 'z', seg = 48) {
  const t = new THREE.TorusGeometry(R, d / 2, S(6), S(seg));
  if (eje === 'x') t.rotateY(Math.PI / 2); else if (eje === 'y') t.rotateX(Math.PI / 2);
  t.translate(cx, cy, cz); return t;
}
/** Tronco de pirámide rectangular abierto a lo largo de +X (parasoles). */
function troncoRect(x0, x1, w0, h0, w1, h1) {
  const v = [[x0, -w0 / 2, -h0 / 2], [x0, w0 / 2, -h0 / 2], [x0, w0 / 2, h0 / 2], [x0, -w0 / 2, h0 / 2],
    [x1, -w1 / 2, -h1 / 2], [x1, w1 / 2, -h1 / 2], [x1, w1 / 2, h1 / 2], [x1, -w1 / 2, h1 / 2]];
  const caras = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  const pos = [];
  for (const [a, b, c, d] of caras) pos.push(...v[a], ...v[b], ...v[c], ...v[a], ...v[c], ...v[d]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals(); return g;
}
function rotarAlrededor(g, eje, ang, centro) {
  const c = V3(centro);
  g.translate(-c.x, -c.y, -c.z);
  g.applyMatrix4(new THREE.Matrix4().makeRotationAxis(V3(eje).normalize(), ang));
  g.translate(c.x, c.y, c.z); return g;
}
function fusionar(lista) {
  const gs = lista.flat(Infinity).filter(Boolean);
  if (gs.length === 1) return gs[0];
  const noIdx = gs.some((g) => !g.index);
  const norm = gs.map((g) => {
    const h = noIdx && g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'uv'].includes(k)) h.deleteAttribute(k);
    if (!h.attributes.uv) h.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2));
    if (!h.attributes.normal) h.computeVertexNormals();
    h.morphAttributes = {};
    return h;
  });
  const m = mergeGeometries(norm, false);
  if (!m) throw new Error('No se pudo fusionar geometría');
  return m;
}
/** Utilidades exportadas para el módulo de interiores (mismo marco en pulgadas). */
export const GEO = { cil, cono, esfera, caja, cajaC, cajaAbierta, tubo, anillo, troncoRect, rotarAlrededor, fusionar, S: (n) => S(n) };

// -----------------------------------------------------------------------------
// MATERIALES (propios de cada rover: se liberan con él; las texturas son compartidas)
// -----------------------------------------------------------------------------
function crearMateriales() {
  const suc = TX.texSuciedad(), rug = TX.texRugosidadMetal();
  const malla = TX.texMallaRueda(), foil = TX.texFoil(5), foil2 = TX.texFoil(8), hga = TX.texMallaHGA();
  // repeticiones fijas (las texturas cacheadas no se vuelven a modificar después)
  malla.mapa.repeat.set(54, 13.5); malla.alfa.repeat.set(54, 13.5);
  for (const f of [foil, foil2]) { f.mapa.repeat.set(1, 1); f.normal.repeat.set(1, 1); }
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    alu: std({ name: 'Aluminio_2219', color: 0xd4d5d4, metalness: 0.72, roughness: 0.44, map: suc, roughnessMap: rug }),
    aluOscuro: std({ name: 'Aluminio_anodizado', color: 0x9c9fa2, metalness: 0.7, roughness: 0.5, map: suc }),
    aluDoble: std({ name: 'Aluminio_repujado', color: 0xe6e5e0, metalness: 0.3, roughness: 0.52, map: suc, side: THREE.DoubleSide }),
    chevron: std({ name: 'Titanio_chevrones', color: 0xa4a39e, metalness: 0.5, roughness: 0.5, map: suc }),
    gris: std({ name: 'Gris_panel', color: 0xa9aaa8, metalness: 0.25, roughness: 0.6, map: suc, side: THREE.DoubleSide }),
    blanco: std({ name: 'Blanco_parasol', color: 0xeeebe2, metalness: 0.0, roughness: 0.7, map: suc, side: THREE.DoubleSide }),
    pintura: std({ name: 'Pintura_termica_blanca', color: 0xe8e6de, metalness: 0.0, roughness: 0.66, map: suc }),
    cubierta: std({ name: 'Fibra_vidrio_cubierta', color: 0xd9d4c6, metalness: 0.0, roughness: 0.78, map: suc, side: THREE.DoubleSide }),
    espejo: std({ name: 'Espejo_radiador_OSR', color: 0xdfe6ee, metalness: 1.0, roughness: 0.07 }),
    espejoLCRU: std({ name: 'Radiador_LCRU', color: 0xe6e4de, metalness: 0.2, roughness: 0.5, map: suc }),
    malla: std({ name: 'Malla_acero_galvanizado', color: 0xb3b0aa, metalness: 0.32, roughness: 0.66, map: malla.mapa, alphaMap: malla.alfa,
      alphaTest: 0.42, alphaToCoverage: true, side: THREE.DoubleSide }),
    alambre: std({ name: 'Alambre_acero_galvanizado', color: 0xbdbab3, metalness: 0.6, roughness: 0.45 }),
    titanio: std({ name: 'Titanio', color: 0x86888b, metalness: 0.8, roughness: 0.42, map: suc }),
    titanioDoble: std({ name: 'Titanio_tope', color: 0x6e7073, metalness: 0.8, roughness: 0.45, map: suc, side: THREE.DoubleSide }),
    foil: std({ name: 'Manta_termica_dorada', color: 0xffffff, metalness: 0.82, roughness: 0.3, map: foil.mapa, normalMap: foil.normal, side: THREE.DoubleSide }),
    foil2: std({ name: 'Foil_dorado_camara', color: 0xffffff, metalness: 0.82, roughness: 0.32, map: foil2.mapa, normalMap: foil2.normal }),
    mylar: std({ name: 'Mylar_aluminizado', color: 0xd3d6d9, metalness: 0.85, roughness: 0.32, normalMap: foil.normal, side: THREE.DoubleSide }),
    gbDelIzq: std({ name: 'Guardabarros_ext_delantero_izq', color: 0xffffff, roughness: 0.62, metalness: 0.0, map: TX.texGuardabarros(3, true, 1), side: THREE.DoubleSide }),
    gbDelDer: std({ name: 'Guardabarros_ext_delantero_der', color: 0xffffff, roughness: 0.62, metalness: 0.0, map: TX.texGuardabarros(3, true, -1), side: THREE.DoubleSide }),
    gbDel: std({ name: 'Guardabarros_delantero', color: 0xffffff, roughness: 0.62, metalness: 0.0, map: TX.texGuardabarros(4, false), side: THREE.DoubleSide }),
    gbTras: std({ name: 'Guardabarros_trasero', color: 0xffffff, roughness: 0.62, metalness: 0.0, map: TX.texGuardabarros(6, false), side: THREE.DoubleSide }),
    mapa: std({ name: 'Mapa_plastificado', color: 0xffffff, roughness: 0.45, metalness: 0.0, map: TX.texMapa(2), side: THREE.DoubleSide }),
    cinta: std({ name: 'Cinta_gris', color: 0x8d8f91, roughness: 0.6, metalness: 0.15 }),
    cincha: std({ name: 'Cincha_nylon', color: 0xffffff, roughness: 0.95, metalness: 0, map: TX.texCincha(), side: THREE.DoubleSide }),
    tela: std({ name: 'Tela_beta', color: 0xffffff, roughness: 0.95, metalness: 0, map: TX.texTela(), side: THREE.DoubleSide }),
    telaAzul: std({ name: 'Manta_azul_TGE', color: 0x8ea2bd, roughness: 0.9, metalness: 0, map: TX.texTela(), side: THREE.DoubleSide }),
    // malla de punto con huecos reales (alphaMap); con alpha-to-coverage se ve translúcida a distancia, como en las fotos
    telaHGA: std({ name: 'Malla_antena_HGA', color: 0xffffff, roughness: 0.82, metalness: 0.15, map: hga.mapa, alphaMap: hga.alfa,
      alphaTest: 0.12, alphaToCoverage: true, side: THREE.DoubleSide }),
    radomo: std({ name: 'Radomo_LGA', color: 0xf2efe6, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }),
    negro: std({ name: 'Negro_mate', color: 0x1c1d1f, roughness: 0.55, metalness: 0.2 }),
    negroDoble: std({ name: 'Negro_interior', color: 0x121314, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide }),
    panel: std({ name: 'Panel_consola', color: 0x2c2e31, roughness: 0.5, metalness: 0.3 }),
    panelConsola: std({ name: 'Cara_consola', color: 0xffffff, roughness: 0.55, metalness: 0.1, map: TX.texPanelConsola() }),
    indicador: std({ name: 'Indicadores', color: 0xeeece4, roughness: 0.35, metalness: 0.1 }),
    lente: new THREE.MeshPhysicalMaterial({ name: 'Vidrio_lente', color: 0x0b0d12, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02 }),
    rojo: std({ name: 'Rojo_alerta', color: 0xa8261d, roughness: 0.5 }),
    azul: std({ name: 'Azul_conector', color: 0x2f5fa8, roughness: 0.5 }),
    amarillo: std({ name: 'Amarillo_pasador', color: 0xd8ae1e, roughness: 0.45, metalness: 0.3 }),
    cable: std({ name: 'Cable_blanco', color: 0xe6e2d6, roughness: 0.7, metalness: 0 }),
  };
}

// -----------------------------------------------------------------------------
// Contexto de construcción (registro de piezas, puertos, alias)
// -----------------------------------------------------------------------------
let CTX = null;
const meta = (evidencia, fuente, funcion, tipo = 'pieza') => ({ evidencia, fuente, funcion, tipo });

function parte(grupo, nombre, geoms, mat, sub, m = {}) {
  const g = fusionar(Array.isArray(geoms) ? geoms : [geoms]);
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = nombre; mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = { parte: nombre, subsistema: sub, evidencia: m.evidencia || 'inferido', fuente: m.fuente || null,
    funcion: m.funcion || null, tipo: m.tipo || 'pieza' };
  grupo.add(mesh);
  if (CTX) CTX.piezas.set(nombre, mesh);
  return mesh;
}
function grupo(nombre, padre, sub, explosion) {
  const g = new THREE.Group(); g.name = nombre;
  g.userData = { subsistema: sub, explosion: explosion ? new THREE.Vector3(...explosion) : new THREE.Vector3() };
  padre.add(g); return g;
}
function nodo(nombre, padre, pos = [0, 0, 0]) {
  const g = new THREE.Group(); g.name = nombre; g.position.set(pos[0], pos[1], pos[2]); padre.add(g);
  if (CTX) CTX.nodos[nombre] = g;
  return g;
}
/** Puerto físico de conexión (Object3D) dentro del conjunto que lo lleva. */
function puerto(id, padre, pos, etiqueta) {
  const o = new THREE.Object3D(); o.name = `Puerto_${id}`; o.position.set(pos[0], pos[1], pos[2]);
  o.userData = { puerto: id, etiqueta }; padre.add(o);
  if (CTX) CTX.puertos.set(id, o);
  return o;
}
function alias(nombre, lista) { if (CTX) CTX.alias[nombre] = lista; }

// =============================================================================
// RUEDA (eje local = +Y, exterior = +Y). Malla tejida + 40 chevrones + tope.
// Diámetro, anchura y tope: MSC-07464 dibujo 4.1 (cotas del modelo previo; el dibujo
// escaneado no es legible por OCR, verificar contra el original).
// =============================================================================
const RC = 12.6, AR = 3.45, AY = 4.5, NEXP = 2.6, PHI_FIN = THREE.MathUtils.degToRad(146.5);
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
function perfil(phi) { const e = 2 / NEXP; return [RC + AR * spow(Math.cos(phi), e), AY * spow(Math.sin(phi), e)]; }
function perfilNormal(phi) {
  const h = 1e-3, a = perfil(phi - h), b = perfil(phi + h);
  const tr = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tr, ty);
  return [ty / l, -tr / l];
}
function phiParaY(y) { return Math.asin(THREE.MathUtils.clamp(spow(y / AY, NEXP / 2), -1, 1)); }
function puntoLlanta(phi, th, off = 0) {
  const [r, y] = perfil(phi), [nr, ny] = perfilNormal(phi);
  const rr = r + nr * off, yy = y + ny * off;
  return new THREE.Vector3(rr * Math.sin(th), yy, rr * Math.cos(th));
}
function geomLlanta() {
  const pts = [], n = S(40);
  for (let i = 0; i <= n; i++) { const phi = -PHI_FIN + (2 * PHI_FIN * i) / n; const [r, y] = perfil(phi); pts.push(new THREE.Vector2(r, y)); }
  return new THREE.LatheGeometry(pts, S(96));
}
/** Alambres reales para inspección cercana (LOD): dos familias de hilos helicoidales. */
function geomAlambres() {
  // 2 familias helicoidales; paso ≈ 0.6–1 in según calidad (la textura lejana ≈ 0.45 in); alambre engrosado para que se vea
  const gs = [], n = Q >= 1.4 ? 168 : Q >= 1 ? 132 : 96, seg = 24;
  for (const dir of [1, -1]) for (let k = 0; k < n; k++) {
    const th0 = (k / n) * Math.PI * 2, pts = [];
    for (let i = 0; i <= seg; i++) { const phi = -PHI_FIN + (2 * PHI_FIN * i) / seg; pts.push(puntoLlanta(phi, th0 + dir * phi * 0.36, 0.025 * dir)); }
    gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, 0.034, 3, false));
  }
  return fusionar(gs);
}
function brazoChevron(th0, dth, y0, y1, ancho = 1.0, grueso = 0.09) {
  const N = 7, pos = [], idx = [], fila = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = y0 + (y1 - y0) * t, th = th0 + dth * t, phi = phiParaY(y);
    const p = puntoLlanta(phi, th, -0.02);
    const [nr, ny] = perfilNormal(phi);
    const nrm = new THREE.Vector3(nr * Math.sin(th), ny, nr * Math.cos(th)).normalize();
    const t2 = puntoLlanta(phiParaY(y + (y1 - y0) * 0.01), th + dth * 0.01, -0.02).sub(p).normalize();
    const lado = new THREE.Vector3().crossVectors(nrm, t2).normalize().multiplyScalar(ancho / 2);
    const top = nrm.clone().multiplyScalar(grueso + 0.02);
    fila.push([p.clone().add(lado), p.clone().sub(lado), p.clone().add(lado).add(top), p.clone().sub(lado).add(top)]);
  }
  for (const [a, b] of [[2, 3], [0, 2], [3, 1]]) {
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) pos.push(...fila[i][a].toArray(), ...fila[i][b].toArray());
    for (let i = 0; i < N; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  for (const i of [0, N]) {
    const base = pos.length / 3, f = fila[i];
    pos.push(...f[0].toArray(), ...f[1].toArray(), ...f[2].toArray(), ...f[3].toArray());
    if (i === 0) idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    else idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}
function geomChevrones() {
  const gs = [], n = P.chevrones, ext = 3.75, dth = THREE.MathUtils.degToRad(7.0);
  for (let k = 0; k < n; k++) { const th = (2 * Math.PI * k) / n; gs.push(brazoChevron(th, -dth, 0.0, ext), brazoChevron(th, -dth, 0.0, -ext)); }
  return fusionar(gs);
}
function geomCubo(lado) {
  // disco de aluminio repujado, hundido hacia el vehículo, con corona de remaches y cubo central
  const s = lado;
  const prof = [[0.01, 0.42], [2.7, 0.42], [3.3, 0.5], [5.4, 0.95], [7.7, 1.65], [9.2, 2.4], [9.78, 2.8],
    [9.78, 2.5], [9.2, 2.1], [7.7, 1.35], [5.4, 0.65], [3.3, 0.2], [0.01, 0.12]].map(([r, y]) => new THREE.Vector2(r, y * s));
  if (s < 0) prof.reverse();
  const gs = [new THREE.LatheGeometry(prof, S(72))];
  if (s > 0) {
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; gs.push(esfera([9.25 * Math.sin(a), 2.42, 9.25 * Math.cos(a)], 0.2, 6)); }
    gs.push(cil([0, 0.3, 0], [0, 3.1, 0], 4.6, 28), cil([0, 3.0, 0], [0, 3.55, 0], 5.2, 28));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; gs.push(cil([1.7 * Math.sin(a), 3.5, 1.7 * Math.cos(a)], [1.7 * Math.sin(a), 3.85, 1.7 * Math.cos(a)], 0.36, 6)); }
    gs.push(cil([0, 3.5, 0], [0, 4.6, 0], 1.6, 6));
  }
  return fusionar(gs);
}
function construirRueda(g, tag, M, sub) {
  const DOC = meta('documentado', `${F.hb} §4.2, dibujo 4.1`, 'Neumático abierto de malla de alambre; chevrones cubren el 50 % del contacto; tolera ~10 % de alambres rotos.');
  // LOD híbrido: textura recortada a distancia, alambres reales en inspección cercana
  const lod = new THREE.LOD(); lod.name = `LOD_Malla_${tag}`; g.add(lod);
  const lejos = parte(lod, `Malla_Acero_${tag}`, geomLlanta(), M.malla, sub, DOC);
  lod.remove(lejos);
  const cerca = parte(lod, `Malla_Acero_${tag}_Alambres`, [geomAlambres()], M.alambre, sub,
    meta('educativo', `${F.hb} §4.2`, 'Alambres de acero cincado tejidos; se dibujan más gruesos y espaciados que los reales para que se lean en pantalla.'));
  cerca.userData.lodCercano = true;
  lod.remove(cerca);
  lod.addLevel(cerca, 0); lod.addLevel(lejos, 1.35);
  parte(g, `Chevrones_Titanio_${tag}`, geomChevrones(), M.chevron, sub, DOC);
  const yRim = perfil(PHI_FIN)[1], rRim = perfil(PHI_FIN)[0];
  const aro = (y) => { const t = new THREE.TorusGeometry(rRim + 0.1, 0.32, S(8), S(64)); t.rotateX(Math.PI / 2); t.translate(0, y, 0); return t; };
  const tope = new THREE.CylinderGeometry(12.75, 12.75, 1.7, S(64), 1, true);
  const topeLabio = [-0.85, 0.85].map((y) => { const t = new THREE.TorusGeometry(12.75, 0.18, 6, S(64)); t.rotateX(Math.PI / 2); t.translate(0, y, 0); return t; });
  const puntales = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    for (const sy of [1, -1]) puntales.push(cil([rRim * Math.sin(a), sy * (yRim - 0.2), rRim * Math.cos(a)], [12.65 * Math.sin(a), sy * 0.7, 12.65 * Math.cos(a)], 0.34, 6));
  }
  parte(g, `Aros_y_Tope_${tag}`, [aro(yRim), aro(-yRim), tope, ...topeLabio, ...puntales], M.titanioDoble, sub,
    meta('documentado', `${F.hb} §4.2`, 'Bastidor interior (tope) de 25.5 in: limita la deformación del bastidor exterior ante impactos.'));
  parte(g, `Cubo_${tag}`, [geomCubo(1), geomCubo(-1)], M.aluDoble, sub,
    meta('inferido', F.fotoA, 'Disco de aluminio que une la malla con la salida del reductor; forma tomada de la foto.'));
}

// =============================================================================
// CHASIS
// =============================================================================
function construirEstructura(G, M) {
  const sub = 'estructura';
  const D = meta('documentado', `${F.hb} §3.1, dibujo 3.1`, 'Chasis en tres secciones (delantera, central, trasera) unidas por bisagras con pasadores de bloqueo por resorte.');
  const rw = P.largueroAncho, rh = P.largueroAlto;
  const seccion = (x0, x1, hw) => {
    const gs = [];
    for (const sy of [1, -1]) { const y = sy * (hw - rw / 2); gs.push(caja(x0, x1, y - rw / 2, y + rw / 2, ZB, ZB + rh, 0.22)); }
    gs.push(caja(x0, x1, -rw / 2, rw / 2, ZB, ZB + rh, 0.22));
    for (const x of [Math.min(x0, x1), Math.max(x0, x1) - rw]) gs.push(caja(x, x + rw, -hw, hw, ZB, ZB + rh, 0.22));
    return gs;
  };
  const xf0 = X(P.staFrente), xf1 = X(P.staBisagraDel), xa0 = X(P.staBisagraTras), xa1 = X(P.staFondo);
  const hc = P.semiAnchoCentro, he = P.semiAnchoExtremos;
  parte(G, 'Chasis_Delantero', seccion(xf1, xf0, he), M.alu, sub, D);
  const diag = [];
  for (const [xe, xc] of [[xf1 + 4.0, xf1 - 0.5], [xa0 - 4.0, xa0 + 0.5]])
    for (const sy of [1, -1]) diag.push(cil([xc, sy * (hc - 1), ZB + 1.4], [xe, sy * (he - 0.6), ZB + 1.4], 1.2, 12));
  parte(G, 'Chasis_Central', [...seccion(xa0, xf1, hc), ...diag], M.alu, sub, D);
  parte(G, 'Chasis_Trasero', seccion(xa1, xa0, he), M.alu, sub, D);
  const piso = [];
  for (const sy of [1, -1]) {
    const y0 = sy * 1.0, y1 = sy * (hc - rw);
    piso.push(caja(xa0 + 0.5, xf1 - 0.5, y0, y1, ZB + 0.2, ZB + 0.32, 0));
    const n = Math.floor(Math.abs(y1 - y0) / 2.3);
    for (let i = 0; i < n; i++) { const yy = y0 + sy * (1.15 + i * 2.3); piso.push(cil([xa0 + 1.5, yy, ZB + 0.32], [xf1 - 1.5, yy, ZB + 0.32], 0.55, 8)); }
  }
  parte(G, 'Paneles_Piso', piso, M.aluOscuro, sub, meta('documentado', `${F.hb} dibujo 3.1 («center sections .020 x 27.65 x 52.00»)`, 'Paneles de piso nervados de la sección central.'));
  // estructura secundaria inferior: travesaños y largueros bajo el piso (visibles desde abajo)
  const inf = [];
  for (const x of [13.5, 0.0, -13.5]) inf.push(caja(x - 0.8, x + 0.8, -hc + 1.4, hc - 1.4, ZB - 0.7, ZB + 0.2, 0.15));
  for (const y of [-14.5, 14.5]) inf.push(caja(xa0 + 1, xf1 - 1, y - 0.45, y + 0.45, ZB - 0.6, ZB + 0.2, 0.12));
  for (const x of [xf1 + 8, xf0 - 6, xa0 - 8, xa1 + 6]) inf.push(caja(x - 0.6, x + 0.6, -he + 1.6, he - 1.6, ZB - 0.5, ZB + 0.1, 0.12));
  parte(G, 'Estructura_Secundaria_Inferior', inf, M.aluOscuro, sub, meta('inferido', `${F.hb} §3.1 («secondary support structure»)`, 'Travesaños y largueros bajo los paneles; posición y número inferidos.'));
  const bis = [], pas = [], herr = [];
  for (const x of [xf1, xa0]) for (const sy of [1, -1]) {
    const y = sy * (he - rw / 2);
    bis.push(cajaC(x, y, ZB + rh / 2, 3.2, 2.4, 3.6, 0.3));
    bis.push(cil([x, y - 1.5, ZB + 0.8], [x, y + 1.5, ZB + 0.8], 0.95, 14));
    pas.push(cil([x, sy * (he - 1), ZB - 0.45], [x, sy * (he - 1), ZB + 0.25], 0.48, 10));
    pas.push(esfera([x, sy * (he - 1), ZB - 0.45], 0.3, 8));
  }
  // herrajes de la interfaz LM/LRV bajo el chasis (puntos de los trípodes reutilizados como estribos)
  for (const x of [32, -32]) for (const sy of [1, -1]) herr.push(cajaC(x, sy * (hc - 2.2), ZB - 0.9, 2.6, 2.0, 1.6, 0.25), cil([x, sy * (hc - 2.2), ZB - 1.7], [x, sy * (hc - 2.2), ZB - 2.4], 1.2, 10));
  parte(G, 'Bisagras', bis, M.aluOscuro, sub, D);
  parte(G, 'Pasadores_Bisagra', pas, M.amarillo, sub, meta('documentado', `${F.hb} §3.1`, 'Pasadores de bloqueo con resorte que fijan la bisagra desplegada.'));
  parte(G, 'Herrajes_Interfaz_LM', herr, M.aluOscuro, sub, meta('inferido', `${F.hb} §5.1`, 'Puntos de fijación al módulo lunar; posición inferida.'));
}

// =============================================================================
// MOVILIDAD: suspensión de brazos paralelos, tracción, dirección Ackermann
// =============================================================================
const DOC_SUSP = meta('documentado', `${F.hb} §4.3, dibujo 4.3`, 'Par de brazos triangulares paralelos entre chasis y tracción; cada brazo tiene su barra de torsión (superior ~15 % de la carga, inferior ~85 %).');
function construirEsquina(G, M, tag, xw, sy, del, U) {
  const sub = 'movilidad';
  const esq = grupo(`Esquina_${tag}`, G, sub, [del ? 8 : -8, sy * 30, 0]);
  const yc = sy * P.semiAnchoExtremos, yk = sy * YK;
  const va = new THREE.Vector3(0, sy * LA, DZA);
  // soportes en el chasis (fijos)
  const sop = [];
  for (const dx of [-7, 7]) sop.push(cajaC(xw + dx, yc - sy * 0.6, ZLC + 0.2, 2.2, 1.6, 2.6, 0.25));
  for (const dx of [-6, 6]) sop.push(cajaC(xw + dx, yc - sy * 0.6, ZUC - 0.2, 2.0, 1.6, 2.4, 0.25), cil([xw + dx, yc - sy * 0.6, ZT], [xw + dx, yc - sy * 0.6, ZUC], 1.0, 10));
  const T = new THREE.Vector3(xw + 2.0, sy * (P.semiAnchoExtremos - 1.3), ZT + 6.2);   // montaje superior del amortiguador
  sop.push(cil([xw + 2.0, T.y, ZT], [xw + 2.0, T.y, T.z + 0.6], 1.2, 10), cajaC(xw + 2.0, T.y, T.z, 1.8, 1.6, 1.4, 0.2));
  parte(esq, `Soporte_Suspension_${tag}`, sop, M.aluOscuro, sub, DOC_SUSP);
  parte(esq, `Barras_Torsion_${tag}`, [cil([xw - 8.5, yc, ZLC], [xw + 8.5, yc, ZLC], 1.0, 12), cil([xw - 7.5, yc, ZUC], [xw + 7.5, yc, ZUC], 0.8, 12),
    ...[[ZLC, 8.5, 1.5], [ZUC, 7.5, 1.3]].flatMap(([z, l, d]) => [cil([xw - l - 0.6, yc, z], [xw - l + 0.4, yc, z], d, 12), cil([xw + l - 0.4, yc, z], [xw + l + 0.6, yc, z], d, 12)])],
  M.titanio, sub, DOC_SUSP);
  // brazos (pivotan alrededor del eje X en el chasis)
  const brazo = (dx, d) => [cil([-dx, 0, 0], [0, va.y, va.z], d, 12), cil([dx, 0, 0], [0, va.y, va.z], d, 12), cil([-dx, 0, 0], [dx, 0, 0], d * 0.8, 10),
    esfera([0, va.y, va.z], d * 0.9, 10)];
  const pivInf = nodo(`Pivote_Brazo_Inf_${tag}`, esq, [xw, yc, ZLC]);
  parte(pivInf, `Brazo_Inferior_${tag}`, brazo(7, 1.15), M.alu, sub, DOC_SUSP);
  const pivSup = nodo(`Pivote_Brazo_Sup_${tag}`, esq, [xw, yc, ZUC]);
  const lug = new THREE.Vector3(2.0, va.y * 0.55, va.z * 0.55);
  parte(pivSup, `Brazo_Superior_${tag}`, [...brazo(6, 1.0), cajaC(lug.x, lug.y, lug.z + 0.5, 1.2, 1.4, 1.0, 0.2)], M.alu, sub, DOC_SUSP);
  alias(`Brazos_y_Torsion_${tag}`, [`Brazo_Inferior_${tag}`, `Brazo_Superior_${tag}`, `Barras_Torsion_${tag}`]);
  // mangueta: accesorios de unión en el motor que forman el king-pin (LS006-002-2H §1.3.2)
  const mang = nodo(`Mangueta_${tag}`, esq, [xw, yk, ZLK]);
  mang.userData.base = mang.position.clone();
  const dirp = nodo(`Pivote_Direccion_${tag}`, mang, [0, 0, ZC - ZLK]);
  const sgx = del ? 1 : -1, zl = ZLK - ZC, zu = ZUK - ZC;
  parte(dirp, `Traccion_Freno_${tag}`, [
    cil([0, 0, zl - 0.7], [0, 0, zl + 0.9], 1.7, 14), cil([0, 0, zu - 0.9], [0, 0, zu + 0.7], 1.7, 14),     // bujes del king-pin
    caja(-1.3, 1.3, sy * -0.2, sy * 1.6, zl, zu, 0.3),                                                         // herraje vertical
    cil([0, sy * 0.6, 0], [0, sy * 3.0, 0], 7.4, 28),                                                         // motor CC serie
    cil([0, sy * 3.0, 0], [0, sy * 3.9, 0], 10.2, 32),                                                        // tambor del freno
    cil([0, sy * 3.9, 0], [0, sy * 4.7, 0], 8.6, 32),                                                         // reductor armónico 80:1
    cil([0, sy * 4.6, 0], [0, sy * 6.85, 0], 6.4, 28),                                                        // brida de salida al disco
    cajaC(0, sy * 1.6, 3.9, 2.0, 1.6, 1.0, 0.2),                                                              // captador del odómetro (9 pulsos/vuelta)
  ], M.aluOscuro, sub, meta('documentado', `${F.hb} §4.4; ${F.ops} §1.3.2`, 'Motor CC serie de escobillas (36 V, control PWM), reductor armónico 80:1 y freno mecánico; sellado a 7.5 psia. Los herrajes del motor forman el king-pin.'));
  const punta = new THREE.Vector3(sgx * 5.0, -sy * 1.4, 0.5);
  parte(dirp, `Brazo_Direccion_${tag}`, [tubo([[0, sy * 0.2, 0.5], [sgx * 2.5, -sy * 0.6, 0.5], punta.toArray()], 0.9, { rc: 0.8 }), esfera(punta.toArray(), 0.7, 10)], M.alu, sub,
    meta('inferido', `${F.hb} §4.5, dibujo 4.6`, 'Brazo de dirección unido a la barra de acoplamiento; geometría inferida (dibujo no legible).'));
  const rotula = new THREE.Object3D(); rotula.name = `Rotula_${tag}`; rotula.position.copy(punta); dirp.add(rotula);
  puerto(`motor.${tag}`, dirp, [0, sy * 1.0, 3.8], `Motor de tracción ${tag}`);
  puerto(`freno.${tag}`, dirp, [0, sy * 3.45, 5.2], `Freno ${tag}`);
  // rueda (gira sobre su eje)
  const rg = nodo(`Rueda_${tag}`, dirp, [0, sy * (YW - YK), 0]);
  rg.userData.explosion = new THREE.Vector3(0, sy * 6, 0);
  if (sy < 0) rg.rotation.x = Math.PI;
  const giro = nodo(`Giro_Rueda_${tag}`, rg);
  construirRueda(giro, tag, M, sub);
  // amortiguador lineal: chasis -> brazo SUPERIOR (MSC-07464 §4.3). Cuerpo y vástago telescópicos.
  const DAMP = meta('documentado', `${F.hb} §4.3`, 'Amortiguador lineal (aceite de silicona) entre chasis y brazo superior: 6 in de compresión y 4 in de extensión.');
  const cuerpoGeo = fusionar([cil([0, 0, 0], [0, 6.0, 0], 1.9, 16), esfera([0, 0, 0], 0.7, 8), cil([0, 0.2, 0], [0, 1.0, 0], 2.2, 16)]);
  const vastGeo = fusionar([cil([0, 0, 0], [0, 7.4, 0], 0.72, 10), esfera([0, 0, 0], 0.6, 8)]);
  const amCuerpo = parte(esq, `Amortiguador_${tag}`, cuerpoGeo, M.aluOscuro, sub, DAMP);
  const amVast = parte(esq, `Amortiguador_Vastago_${tag}`, vastGeo, M.alu, sub, DAMP);
  U.esquinas[tag] = { esq, pivInf, pivSup, mang, dirp, giro, rg, va, T, lug, amCuerpo, amVast, rotula, sy, del, xw };
}
const _A = new THREE.Vector3(), _D = new THREE.Vector3(), _QY = new THREE.Quaternion();
function actualizarAmortiguador(e) {
  // punto del brazo superior en el marco de la esquina
  _A.copy(e.lug).applyAxisAngle(new THREE.Vector3(1, 0, 0), e.pivSup.rotation.x).add(e.pivSup.position);
  _D.subVectors(_A, e.T).normalize();
  e.amCuerpo.position.copy(e.T); e.amCuerpo.quaternion.copy(_QY.setFromUnitVectors(EJE_Y, _D));
  e.amVast.position.copy(_A); e.amVast.quaternion.copy(_QY.setFromUnitVectors(EJE_Y, _D.negate()));
}

function construirDireccion(G, M, del, U) {
  const sub = 'movilidad', sx = del ? 1 : -1, tag = del ? 'Del' : 'Tras';
  const xs = sx * 51.5, zs = ZB - 4.6;
  const dg = grupo(`Direccion_${del ? 'Delantera' : 'Trasera'}`, G, sub, [sx * 10, 0, -10]);
  parte(dg, `Direccion_${tag}_Caja`, [
    caja(xs - 3.0, xs + 3.0, -3.6, 3.6, zs + 0.3, ZB - 0.2, 0.4),                          // carcasa reductor + sector
    cil([xs + sx * 0.6, 3.6, zs + 2.2], [xs + sx * 0.6, 8.6, zs + 2.2], 3.2, 20),          // motor CC de campo dividido
    cil([xs + sx * 0.6, 8.6, zs + 2.2], [xs + sx * 0.6, 9.2, zs + 2.2], 2.4, 16),
    ...[-2.6, 2.6].map((y) => caja(xs - 2.2, xs + 2.2, y - 0.4, y + 0.4, ZB - 0.3, ZB + 0.3, 0.1)),   // orejas al travesaño
  ], M.aluOscuro, sub, meta('documentado', `${F.hb} §4.5; ${F.ops} §1.3.4, fig. 1-9`, 'Motor CC de campo dividido + reductor + sector de engranaje recto que mueve la timonería. Delantera y trasera mecánicamente independientes; la trasera podía reacoplarse con una herramienta.'));
  const sec = nodo(`Sector_${tag}`, dg, [xs, 0, zs]);
  const brazo = new THREE.Vector3(-sx * 5.0, 0, -0.4);
  parte(sec, `Direccion_${tag}_Sector`, [
    new THREE.CylinderGeometry(2.6, 2.6, 0.5, S(24), 1, false, Math.PI / 2 - 0.9 + (del ? Math.PI : 0), 1.8).rotateX(Math.PI / 2),
    tubo([[0, 0, -0.4], brazo.toArray()], 0.9, { rc: 0.5 }), cil([0, 0, -0.9], [0, 0, 0.5], 1.4, 14),
    cil([brazo.x, -1.2, brazo.z], [brazo.x, 1.2, brazo.z], 0.8, 10),
  ], M.alu, sub, meta('inferido', `${F.hb} §4.5`, 'Sector y brazo de salida hacia las barras de acoplamiento; disposición inferida (dibujo 4.6 no legible).'));
  const tips = [1, -1].map((s) => { const o = new THREE.Object3D(); o.name = `Salida_Sector_${tag}_${s > 0 ? 'Izq' : 'Der'}`; o.position.set(brazo.x, s * 1.1, brazo.z); sec.add(o); return o; });
  puerto(`dir${tag}.motor`, dg, [xs + sx * 0.6, 9.3, zs + 2.2], `Motor de dirección ${del ? 'delantero' : 'trasero'}`);
  U.direccion[tag] = { dg, sec, tips };
}
function crearBarrasAcoplamiento(G, M, U) {
  const geo = fusionar([cil([0, 0, 0], [0, 1, 0], 0.8, 10)]);
  const rot = fusionar([esfera([0, 0, 0], 0.65, 10)]);
  for (const tag of ['DI', 'DD', 'TI', 'TD']) {
    const DOCB = meta('inferido', `${F.hb} §4.5`, 'Barra de acoplamiento entre el sector de dirección y el brazo de la rueda.');
    const b = parte(G, `Barra_Acoplamiento_${tag}`, geo.clone(), M.alu, 'movilidad', DOCB);
    const r1 = parte(G, `Rotula_Sector_${tag}`, rot.clone(), M.aluOscuro, 'movilidad', DOCB);
    const r2 = parte(G, `Rotula_Rueda_${tag}`, rot.clone(), M.aluOscuro, 'movilidad', DOCB);
    U.barras[tag] = { b, r1, r2 };
  }
}
const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
function actualizarBarras(raiz) {
  const U = raiz.userData, G = U.grupos.movilidad;
  raiz.updateMatrixWorld(true);
  for (const [tag, k] of Object.entries(U.barras)) {
    const e = U.esquinas[tag], d = U.direccion[e.del ? 'Del' : 'Tras'];
    G.worldToLocal(d.tips[e.sy > 0 ? 0 : 1].getWorldPosition(_p1));
    G.worldToLocal(e.rotula.getWorldPosition(_p2));
    const v = _p2.clone().sub(_p1), L = v.length();
    k.b.position.copy(_p1); k.b.quaternion.setFromUnitVectors(EJE_Y, v.normalize()); k.b.scale.set(1, L, 1);
    k.r1.position.copy(_p1); k.r2.position.copy(_p2);
  }
}

function sectorCilindro(r, y0, y1, a0, a1, segs) {
  const th0 = THREE.MathUtils.degToRad(90 - a1), thL = THREE.MathUtils.degToRad(a1 - a0);
  const g = new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), segs, 4, true, th0, thL);
  g.translate(0, (y0 + y1) / 2, 0); return g;
}
function arcoToro(r, t, a0, a1, y, segs) {
  const g = new THREE.TorusGeometry(r, t, 6, segs, THREE.MathUtils.degToRad(a1 - a0));
  g.rotateX(Math.PI / 2); g.rotateY(-THREE.MathUtils.degToRad(a0)); g.translate(0, y, 0); return g;
}
const puntoArco = (r, a, y) => [r * Math.cos(THREE.MathUtils.degToRad(a)), y, r * Math.sin(THREE.MathUtils.degToRad(a))];
function construirGuardabarros(g, tag, xw, sy, delantero, M, sub) {
  const rIn = WR + 1.3;
  const yIn = sy * (YW - P.ruedaAncho / 2 - 1.6), yOut = sy * P.guardabarrosExt;
  const [ya, yb] = [Math.min(yIn, yOut), Math.max(yIn, yOut)];
  const [fijo, ext] = delantero ? [[60, 150], [16, 60]] : [[30, 120], [120, 164]];
  const lado = (rr, a0, a1, prof) => {
    const yE = sy > 0 ? yb : ya;
    const ring = new THREE.RingGeometry(rr - prof, rr, S(48), 1, THREE.MathUtils.degToRad(a0), THREE.MathUtils.degToRad(a1 - a0));
    ring.rotateX(Math.PI / 2); ring.translate(0, yE, 0); return ring;
  };
  const pos = (arr) => arr.map((q) => q.translate(xw, 0, ZC));
  const GF = meta('documentado', 'NASM (extensión de guardabarros de fibra de vidrio impregnada en epoxi)', 'Guardabarros de fibra de vidrio: evitan que el polvo cubra a la tripulación y los equipos.');
  parte(g, `Guardabarros_Fijo_${tag}`, pos([sectorCilindro(rIn, ya, yb, ...fijo, S(48)), arcoToro(rIn, 0.24, ...fijo, ya, S(48)), arcoToro(rIn, 0.24, ...fijo, yb, S(48)), lado(rIn, ...fijo, 1.4)]),
    delantero ? M.gbDel : M.gbTras, sub, GF);
  const rE = rIn + 0.22;
  if (tag === 'TD') {
    // Reparación de Apollo 17 (antes de la EVA-2): 4 mapas plastificados + cinta gris + 2 pinzas del telescopio de alineación (NASM)
    const R = rE + 0.35, cortes = [112, 125, 138, 151, 166], hojas = [], cinta = [], pinzas = [];
    for (let k = 0; k < 4; k++) {
      const a0 = cortes[k] - (k ? 1.2 : 0), a1 = cortes[k + 1] + 1.2;
      const p0 = puntoArco(R + k * 0.05, a0, 0), p1 = puntoArco(R + k * 0.05, a1, 0);
      const lx = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), ang = Math.atan2(p1[2] - p0[2], p1[0] - p0[0]);
      const h = new THREE.BoxGeometry(lx, (yb - ya) + 1.4, 0.06);
      h.rotateX(Math.PI / 2); h.rotateY(-ang); h.translate((p0[0] + p1[0]) / 2, (ya + yb) / 2, (p0[2] + p1[2]) / 2);
      rotarAlrededor(h, [Math.cos(ang), 0, Math.sin(ang)], (k % 2 ? 1 : -1) * 0.025, [(p0[0] + p1[0]) / 2, (ya + yb) / 2, (p0[2] + p1[2]) / 2]);
      hojas.push(h);
    }
    for (const a of cortes.slice(1, 4)) {
      const p = puntoArco(R + 0.12, a, 0), t = new THREE.BoxGeometry(1.6, (yb - ya) + 1.6, 0.05);
      t.rotateX(Math.PI / 2); t.rotateY(-THREE.MathUtils.degToRad(a + 90)); t.translate(p[0], (ya + yb) / 2, p[2]); cinta.push(t);
    }
    for (const y of [ya + 2.0, yb - 2.0]) {
      const p = puntoArco(rIn + 0.15, 116, y), dir = THREE.MathUtils.degToRad(116);
      const c = fusionar([caja(-0.5, 0.5, -0.7, 0.7, -1.0, 1.6, 0.12), cil([0, 0, 1.6], [0, 0, 2.6], 0.4, 8), cil([0, -0.8, 2.6], [0, 0.8, 2.6], 0.3, 6)]);
      c.rotateY(-(dir - Math.PI / 2)); c.translate(p[0], p[1], p[2]); pinzas.push(c);
    }
    const MAPA = meta('documentado', `${F.nasm}`, 'Extensión improvisada: 4 de los mapas de travesía unidos con cinta gris y sujetos con 2 pinzas del telescopio de alineación óptica del LM (la original se rompió al final de la EVA-1).');
    parte(g, `Reparacion_Guardabarros_${tag}`, pos(hojas), M.mapa, sub, MAPA);
    parte(g, `Cinta_Gris_${tag}`, pos(cinta), M.cinta, sub, MAPA);
    parte(g, `Pinzas_Reparacion_${tag}`, pos(pinzas), M.negro, sub, meta('documentado', F.nasm, '2 pinzas del telescopio de alineación óptica (forma inferida).'));
    alias(`Extension_Guardabarros_${tag}`, [`Reparacion_Guardabarros_${tag}`, `Cinta_Gris_${tag}`, `Pinzas_Reparacion_${tag}`]);
  } else {
    parte(g, `Extension_Guardabarros_${tag}`, pos([sectorCilindro(rE, ya + 0.3, yb - 0.3, ...ext, S(28)), arcoToro(rE, 0.2, ...ext, ya + 0.3, S(28)), arcoToro(rE, 0.2, ...ext, yb - 0.3, S(28)), lado(rE, ...ext, 1.2)]),
      delantero ? (sy > 0 ? M.gbDelIzq : M.gbDelDer) : M.gbTras, sub, GF);
  }
  const xs = xw + (delantero ? -6 : 6);
  const zTop = ZC + Math.sqrt(Math.max(0, rIn * rIn - (xs - xw) ** 2)) - 0.3;
  parte(g, `Soporte_Guardabarros_${tag}`, [
    tubo([[xs, sy * (P.semiAnchoExtremos + 0.4), ZT - 0.6], [xs, sy * (YW - 6), zTop - 2.5], [xs, sy * (YW - 3.5), zTop]], 0.8, { rc: 2 }),
    cajaC(xs, sy * (YW - 3.2), zTop + 0.15, 2.2, 3.2, 0.4, 0.1),
  ], M.alu, sub, meta('documentado', `${F.hb} §3.1 («fender chassis frames»)`, 'Marco que sujeta el guardabarros al chasis.'));
}

// =============================================================================
// PUESTO DE TRIPULACIÓN
// =============================================================================
function construirTripulacion(G, M) {
  const sub = 'tripulacion';
  const xBack = X(P.staSRP) - 4.7, xFront = xBack + 19.1, zp = ZT + 6.5;
  const tilt = THREE.MathUtils.degToRad(13), L = P.asientoRespaldo;
  const AS = meta('documentado', `${F.ops} §1.3.6`, 'Asiento plegable de tubo de aluminio con cinchas de nylon.');
  for (const [tag, sy] of [['Izq', 1], ['Der', -1]]) {
    const yc = sy * P.asientoY, hw = P.asientoAncho / 2, bw = 10.6;
    const xt = xBack - L * Math.sin(tilt), zt = zp + L * Math.cos(tilt);
    const marco = [
      tubo([[xBack, yc - hw, zp], [xFront, yc - hw, zp], [xFront, yc + hw, zp], [xBack, yc + hw, zp]], 1.0, { rc: 1.6, cerrado: true }),
      tubo([[xBack, yc - bw, zp], [xt, yc - bw, zt], [xt, yc + bw, zt], [xBack, yc + bw, zp]], 1.0, { rc: 2.2 }),
      tubo([[xt, yc - 4, zt], [xt - 2.2, yc - 4, zt + 1.3], [xt - 2.2, yc + 4, zt + 1.3], [xt, yc + 4, zt]], 0.8, { rc: 0.8 }),
    ];
    for (const x of [xBack + 1.2, xFront - 2]) for (const s of [1, -1]) marco.push(cil([x, yc + s * (hw - 1), ZB + 0.32], [x, yc + s * (hw - 1), zp], 0.9, 10),
      cajaC(x, yc + s * (hw - 1), ZB + 0.45, 1.6, 1.6, 0.26, 0.08));
    for (const x of [xBack + 1.2, xFront - 2]) marco.push(cil([x, yc - hw + 1, zp - 2.2], [x, yc + hw - 1, zp - 2.2], 0.7, 10));
    parte(G, `Asiento_${tag}_Estructura`, marco, M.alu, sub, AS);
    const web = [];
    for (let i = 0; i < 4; i++) { const yy = yc - hw + 3.0 + i * (P.asientoAncho - 6) / 3; web.push(caja(xBack + 0.3, xFront - 0.3, yy - 1.0, yy + 1.0, zp + 0.25, zp + 0.36, 0)); }
    for (let i = 0; i < 3; i++) { const xx = xBack + 3.5 + i * 6; web.push(caja(xx - 1.0, xx + 1.0, yc - hw + 0.3, yc + hw - 0.3, zp + 0.36, zp + 0.47, 0)); }
    const resp = [];
    for (let i = 0; i < 3; i++) { const yy = yc - bw + 3.3 + i * (2 * bw - 6.6) / 2; resp.push(caja(-0.06, 0.06, yy - 1.0, yy + 1.0, 0.4, L - 0.6, 0)); }
    for (let i = 0; i < 5; i++) { const zz = 2.4 + i * (L - 4.8) / 4; resp.push(caja(0.06, 0.17, yc - bw + 0.3, yc + bw - 0.3, zz - 1.0, zz + 1.0, 0)); }
    for (const g of resp) { g.applyMatrix4(new THREE.Matrix4().makeRotationY(-tilt)); g.translate(xBack - 0.55, 0, zp); }
    parte(G, `Asiento_${tag}_Cinchas`, [...web, ...resp], M.cincha, sub, AS);
    // cinturón de banda plana con hebilla, suelto sobre el asiento (vehículo detenido, tripulación fuera)
    const xb = xFront - 7.0, banda = [];
    const seg = [[xb, yc + sy * hw, zp + 0.6], [xb - 0.6, yc + sy * (hw - 4), zp + 0.9], [xb - 1.4, yc, zp + 0.9], [xb - 1.8, yc - sy * (hw - 5), zp + 0.8]];
    for (let i = 0; i < seg.length - 1; i++) {
      const a = V3(seg[i]), b = V3(seg[i + 1]), d = b.clone().sub(a), Lb = d.length();
      const s = new THREE.BoxGeometry(1.8, Lb, 0.09); s.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(EJE_Y, d.normalize())); s.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      banda.push(s);
    }
    const hb = V3(seg[seg.length - 1]);
    banda.push(caja(hb.x - 1.1, hb.x + 1.1, hb.y - 0.9, hb.y + 0.9, hb.z - 0.1, hb.z + 0.35, 0.12));
    parte(G, `Cinturon_${tag}`, banda, M.cincha, sub, meta('inferido', F.ops, 'Cinturón de banda ajustable con hebilla de enganche; recorrido y hebilla inferidos.'));
    parte(G, `Bolsa_Bajo_Asiento_${tag}`, [caja(xBack + 1.6, xFront - 2.8, yc - hw + 1.6, yc + hw - 1.6, ZB + 0.4, zp - 2.6, 0.9)], M.tela, sub,
      meta('documentado', `${F.hb} §5.1`, 'Bolsa de estiba cubierta bajo el asiento, unida al soporte del asiento.'));
  }
  const pie = [];
  for (const sy of [1, -1]) {
    const p = cajaC(0, 0, 0, 0.6, 24.0, 9.0, 0.15); p.rotateY(-0.84); p.translate(X(P.staBisagraDel) - 4.2, sy * P.asientoY, ZT + 3.3); pie.push(p);
    pie.push(cajaC(X(P.staBisagraDel) - 4.2, sy * (P.asientoY + 12.6), ZT + 3.3, 7.0, 0.5, 6.8, 0.1));
  }
  parte(G, 'Reposapies', pie, M.aluOscuro, sub, meta('inferido', F.fotoA, 'Reposapiés inclinado.'));
  // consola de control y despliegue (instrumentos según MSC-07464 §5.2)
  const xcn = xBack + 30.0, zc = ZT + 28.0, ang = THREE.MathUtils.degToRad(18);
  const CD = 7.0, CW = P.consolaAncho + 1.6, CH = P.consolaAlto + 1.4;
  const cuerpo = cajaC(0, 0, 0, CD, CW, CH, 0.5); cuerpo.rotateY(ang); cuerpo.translate(xcn, 0, zc);
  const nrm = new THREE.Vector3(-Math.cos(ang), 0, Math.sin(ang)).normalize();
  const up = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang)).normalize();
  const cC = new THREE.Vector3(xcn, 0, zc);
  const enConsola = (g) => { g.rotateY(ang); g.translate(cC.x, cC.y, cC.z); return g; };
  const tapa = cajaC(-CD / 2 - 2.0, 0, CH / 2 + 0.2, 6.4, CW + 0.6, 0.3, 0.1);
  rotarAlrededor(tapa, [0, 1, 0], THREE.MathUtils.degToRad(12), [-CD / 2 + 1.2, 0, CH / 2 + 0.2]);
  const mejillas = [1, -1].map((s) => cajaC(-CD / 2 - 2.2, s * (CW / 2 + 0.15), CH / 2 - 1.6, 4.6, 0.25, 3.4, 0.08));
  const CONS = meta('documentado', `${F.hb} §5.2; ${F.ops} §1.5`, 'Consola de control y despliegue: navegación arriba (actitud, rumbo IPI, marcación, alcance, distancia) y monitoreo/control abajo (velocidad, baterías, interruptores, 14 breakers).');
  parte(G, 'Consola_Carcasa', [cil([xcn - 1.0, 0, ZT], [xcn - 1.0, 0, zc - 3.0], 1.9, 16), cajaC(xcn - 1.0, 0, ZT + 0.4, 4.5, 4.5, 0.8, 0.2), cuerpo,
    enConsola(tapa), ...mejillas.map(enConsola),
    cil([xcn - 2.2, -3.8, zc - 6.0], [xcn - 1.0, 0, zc - 11.0], 0.7, 8), cil([xcn - 2.2, 3.8, zc - 6.0], [xcn - 1.0, 0, zc - 11.0], 0.7, 8)], M.pintura, sub, CONS);
  // cara con la textura de instrumentos (u → derecha del conductor = −Y, v → arriba)
  const FW = P.consolaAncho - 0.4, FH = P.consolaAlto - 0.4;
  const base = cC.clone().add(nrm.clone().multiplyScalar(CD / 2 + 0.03));
  const cara = new THREE.PlaneGeometry(FW, FH);
  cara.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0)));
  cara.rotateY(ang); cara.translate(base.x, base.y, base.z);
  parte(G, 'Consola_Panel', [cara], M.panelConsola, sub, { ...CONS, evidencia: 'documentado', funcion: CONS.funcion + ' Disposición del panel: reconstrucción educativa.' });
  // relieves: biseles de los relojes y palancas en las posiciones de la textura (600 x 720 px)
  const enCara = (px, py, h = 0) => base.clone().add(new THREE.Vector3(0, -(px / 600 - 0.5) * FW, 0)).add(up.clone().multiplyScalar((0.5 - py / 720) * FH)).add(nrm.clone().multiplyScalar(h));
  const rel = [];
  for (const [px, py, r] of [[110, 120, 58], [300, 130, 72], [110, 370, 50]]) {
    const c = enCara(px, py, 0.12), t = new THREE.TorusGeometry((r / 600) * FW, 0.09, 6, S(32));
    t.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm)); t.translate(c.x, c.y, c.z); rel.push(t);
  }
  for (let k = 0; k < 10; k++) { const a = enCara(45 + k * 56, 478, 0.05), b = enCara(45 + k * 56, 478, 0.75); rel.push(cil(a, b, 0.22, 6)); }
  for (let k = 0; k < 14; k++) { const a = enCara(40 + (k % 7) * 80, 580 + Math.floor(k / 7) * 64, 0.02), b = enCara(40 + (k % 7) * 80, 580 + Math.floor(k / 7) * 64, 0.3); rel.push(cil(a, b, 0.34, 8)); }
  parte(G, 'Consola_Indicadores', rel, M.indicador, sub, { ...CONS, funcion: 'Biseles de instrumentos, palancas (PWM, habilitación de tracción, dirección, ±15 V, NAV, AUX) y botones de breakers CB1–CB14.' });
  const p0 = cC.clone().add(up.clone().multiplyScalar(6.2)).add(new THREE.Vector3(0, 3.6, 0));
  const p1 = p0.clone().add(new THREE.Vector3(0, 0, 2.2));
  const fl = cajaC(0, 0, 0, 0.12, 3.2, 1.4, 0.05); fl.translate(p1.x, p1.y - 1.6, p1.z - 0.7);
  parte(G, 'Bandera_Alerta', [fl, cil(p0, p1, 0.28, 6)], M.rojo, sub, meta('documentado', `${F.ops} §1.5`, 'Bandera de precaución y advertencia de la consola.'));
  const xh = xBack + 9.5;
  parte(G, 'Apoyabrazos', [cajaC(xBack + 6.5, 0, ZT + 8.0, 13.0, 2.4, 1.4, 0.5), cil([xBack + 2, 0, ZT], [xBack + 2, 0, ZT + 7.4], 1.25, 12),
    cil([xBack + 11, 0, ZT], [xBack + 11, 0, ZT + 7.4], 1.0, 12)], M.aluOscuro, sub, meta('inferido', F.fotoA, 'Apoyabrazos entre los asientos.'));
  parte(G, 'Controlador_Manual_T', [cil([xh, 0, ZT + 8.7], [xh, 0, ZT + 14.0], 0.85, 12), tubo([[xh, -2.3, ZT + 13.6], [xh, -2.3, ZT + 14.2], [xh, 2.3, ZT + 14.2], [xh, 2.3, ZT + 13.6]], 0.75, { rc: 0.5 }),
    cono([xh, 0, ZT + 8.6], [xh, 0, ZT + 10.0], 1.3, 0.9, 16), cajaC(xh, 0, ZT + 8.2, 3.2, 2.8, 1.0, 0.3)], M.negro, sub,
  meta('documentado', `${F.ops} §1.3.5`, 'Mando en T: adelante/atrás = acelerador, rolido = dirección, atrás = freno; interruptor de marcha atrás y anillo de liberación del freno.'));
  puerto('mando.senal', G, [xh, 0, ZT + 7.8], 'Controlador manual · salida de señal');
  puerto('mando.freno', G, [xh - 1.4, 0, ZT + 7.8], 'Controlador manual · cables de freno');
  const as = [];
  for (const sy of [1, -1]) { const y = sy * (P.semiAnchoCentro - 1.2); as.push(tubo([[xBack + 3, y, ZT], [xBack + 3, y, ZT + 8.5], [xBack + 15, y, ZT + 8.5], [xBack + 15, y, ZT]], 1.0, { rc: 1.8, tapas: false })); }
  as.push(tubo([[xcn - 4.5, 4.2, ZT], [xcn - 4.5, 4.2, ZT + 12.0], [xcn - 4.5, 7.2, ZT + 12.0], [xcn - 4.5, 7.2, ZT]], 1.0, { rc: 1.0, tapas: false }));
  parte(G, 'Asideros', as, M.alu, sub, meta('documentado', `${F.hb} §5.1`, 'Asideros exteriores; el interior izquierdo recibe la cámara de 16 mm y la antena de baja ganancia.'));
  // entradas de arneses en la base del poste de la consola
  const pb = (dy, dz) => [xcn - 1.0, dy, ZT + dz];
  puerto('consola.bat1', G, pb(1.1, 1.6), 'Consola · entrada batería 1 (buses A/B)');
  puerto('consola.bat2', G, pb(-1.1, 1.6), 'Consola · entrada batería 2 (buses C/D)');
  puerto('consola.buses', G, pb(-0.9, 3.0), 'Consola · salidas de breakers a DCE');
  puerto('consola.nav', G, pb(0.9, 3.0), 'Consola · entrada de navegación (SPU)');
  puerto('consola.aux', G, pb(1.0, 4.2), 'Consola · CB14 AUX');
  return { xcn, zc, ang, CD, FW, FH };
}

// =============================================================================
// ENERGÍA Y NAVEGACIÓN (chasis delantero). Distribución según MSC-07464 §6.2 y dibujo 3.1:
// batería 1 a la IZQUIERDA (sumidero térmico parcial de la SPU), batería 2 a la DERECHA
// (sumidero de la DGU); DCE también en el chasis delantero. Cotas internas inferidas.
// =============================================================================
export const UNIDADES_ENERGIA = {
  bat1: { nombre: 'Batería 1', caja: [42.6, 54.6, 0.8, 13.2, ZT + 0.6, ZT + 6.6] },
  bat2: { nombre: 'Batería 2', caja: [42.6, 54.6, -13.2, -0.8, ZT + 0.6, ZT + 6.6] },
  spu: { nombre: 'SPU', caja: [29.2, 41.6, 0.8, 13.2, ZT + 0.6, ZT + 5.4] },
  dgu: { nombre: 'DGU', caja: [35.8, 41.6, -13.2, -7.2, ZT + 0.6, ZT + 6.0] },
  dce: { nombre: 'DCE', caja: [29.2, 35.2, -13.2, -0.8, ZT + 0.6, ZT + 5.4] },
};
function construirEnergia(G, M, U) {
  const sub = 'energia';
  const textos = {
    bat1: meta('documentado', `${F.hb} §6.2, tabla 6-I, dibujo 6.1`, 'Batería primaria de plata-zinc, 23 celdas en serie, 36 V nominales, 121 Ah; válvula de alivio 3.1–7 psid. Alimenta los buses A (CB1) y B (CB3).'),
    bat2: meta('documentado', `${F.hb} §6.2, tabla 6-I`, 'Batería primaria de plata-zinc, 23 celdas, 36 V, 121 Ah. Alimenta los buses C (CB2) y D (CB4); sumidero térmico de la DGU.'),
    spu: meta('documentado', `${F.hb} §5.2.1, §6.2, dibujo 3.2`, 'Unidad de procesamiento de señales: integra rumbo y pulsos del odómetro para marcación, alcance y distancia. Cera de eicosano (2.25 lb) y correa térmica a la batería 1.'),
    dgu: meta('documentado', `${F.hb} §7.2`, 'Unidad de giróscopo direccional: entrega el rumbo como sincro de 3 hilos; la batería 2 es su sumidero térmico.'),
    dce: meta('documentado', `${F.hb} §4.6, dibujos 3.1, 3.2, 4.8`, 'Electrónica de control de tracción: PWM 1 y PWM 2, relés de sentido, transistores de potencia con límite de corriente, inhibición por odómetro y electrónica de los servos de dirección. Cera de octadecano (3.5 lb).'),
  };
  U.carcasas = U.carcasas || {};
  for (const [id, u] of Object.entries(UNIDADES_ENERGIA)) {
    const [x0, x1, y0, y1, z0, z1] = u.caja, ev = textos[id];
    const gU = nodo(`Unidad_${id}`, G);
    const nom = { bat1: 'Bateria_1', bat2: 'Bateria_2', spu: 'SPU', dgu: 'DGU', dce: 'DCE' }[id];
    const mat = id.startsWith('bat') ? M.aluOscuro : M.pintura;
    parte(gU, `${nom}_Caja`, cajaAbierta(x0, x1, y0, y1, z0, z1 - 0.3, 0.22), mat, sub, ev);
    // tapa (radiador en baterías, SPU y DCE): se retira virtualmente en inspección
    const tapaN = nodo(`Tapa_${id}`, gU, [x1, (y0 + y1) / 2, z1 - 0.3]);
    const tapaGeo = [caja(x0 - x1, 0, y0 - (y0 + y1) / 2, y1 - (y0 + y1) / 2, 0, 0.3, 0.08)];
    parte(tapaN, `${nom}_Tapa`, tapaGeo, mat, sub, { ...ev, tipo: 'tapa', funcion: 'Tapa de la carcasa (apertura virtual de inspección; en vuelo la carcasa iba cerrada).' });
    if (id !== 'dgu') parte(tapaN, `Espejo_${nom}`, [caja(x0 - x1 + 0.6, -0.6, y0 - (y0 + y1) / 2 + 0.6, y1 - (y0 + y1) / 2 - 0.6, 0.3, 0.42, 0)], M.espejo, sub,
      meta('documentado', `${F.hb} §3.2, §6.2`, 'Espejo radiador de baja absortancia solar: rechaza calor cuando se abre la cubierta antipolvo entre EVAs.'));
    if (id === 'bat1' || id === 'bat2') parte(gU, `${nom}_Valvula`, [cil([x0 + 2.0, (y0 + y1) / 2 + 3, z1 - 0.4], [x0 + 2.0, (y0 + y1) / 2 + 3, z1 + 0.2], 0.9, 12)], M.alu, sub,
      meta('documentado', `${F.hb} tabla 6-I`, 'Válvula de alivio de presión de la carcasa (abre a 3.1–7 psid).'));
    U.carcasas[id] = { grupo: gU, tapa: tapaN, caja: u.caja, nombre: u.nombre };
  }
  alias('Baterias_SPU_DGU', ['Bateria_1_Caja', 'Bateria_1_Tapa', 'Bateria_2_Caja', 'Bateria_2_Tapa', 'SPU_Caja', 'SPU_Tapa', 'DGU_Caja', 'DGU_Tapa', 'DCE_Caja', 'DCE_Tapa']);
  alias('Espejos_Termicos', ['Espejo_Bateria_1', 'Espejo_Bateria_2', 'Espejo_SPU', 'Espejo_DCE']);
  parte(G, 'Bloque_Conectores', [caja(35.8, 41.6, -6.6, -0.8, ZT + 0.6, ZT + 3.4, 0.3)], M.aluOscuro, sub,
    meta('educativo', F.hb, 'Paso de arneses entre DCE, SPU y consola (reconstrucción).'));
  parte(G, 'Soportes_Baterias', [...[0.8, 13.2, -0.8, -13.2].map((y) => caja(29.0, 54.8, y - 0.3, y + 0.3, ZT, ZT + 0.6, 0.1)),
    ...[30, 42.4, 54.4].map((x) => caja(x - 0.4, x + 0.4, -13.4, 13.4, ZT, ZT + 0.6, 0.1))], M.alu, sub,
  meta('documentado', `${F.hb} dibujo 3.1 («battery support brackets»)`, 'Soportes de las baterías y la electrónica.'));
  // manta térmica (15 capas de mylar aluminizado + 14 de red de nylon) en los costados de la bahía
  parte(G, 'Manta_Termica_Delantera', [caja(28.8, 55.0, 13.4, 13.7, ZT, ZT + 6.9, 0.05), caja(28.8, 55.0, -13.7, -13.4, ZT, ZT + 6.9, 0.05), caja(28.6, 28.9, -13.7, 13.7, ZT, ZT + 6.9, 0.05)],
    M.mylar, sub, meta('documentado', `${F.hb} dibujo 3.2`, 'Manta aislante de 15 capas de mylar aluminizado perforado y 14 de red de nylon.'));
  // cubiertas antipolvo de fibra de vidrio, CERRADAS (EVA); bisagra en el borde delantero
  const cub = [];
  for (const id of ['bat1', 'bat2', 'spu', 'dce']) {
    const [x0, x1, y0, y1, , z1] = UNIDADES_ENERGIA[id].caja;
    const n = nodo(`Bisagra_Cubierta_${id}`, G, [x1 + 0.1, (y0 + y1) / 2, z1 + 0.18]);
    const nombre = `Cubierta_Antipolvo_${{ bat1: 'Bateria_1', bat2: 'Bateria_2', spu: 'SPU', dce: 'DCE' }[id]}`;
    parte(n, nombre, [caja(x0 - x1 - 0.3, 0, y0 - (y0 + y1) / 2 - 0.2, y1 - (y0 + y1) / 2 + 0.2, 0, 0.16, 0.06), cil([0, y0 - (y0 + y1) / 2, 0.08], [0, y1 - (y0 + y1) / 2, 0.08], 0.45, 8)],
      M.cubierta, sub, meta('documentado', `${F.hb} §3.2; MSFC-Creel (TFAWS 2006)`, 'Cubierta antipolvo aislada; cerrada durante la EVA (actuadores bimetálicos la cierran), se abre entre EVAs para que el espejo radie calor.'));
    cub.push(nombre);
    U.carcasas[id].cubierta = n;
  }
  alias('Cubiertas_Antipolvo', cub);
  // correas térmicas (se dibujan desde el registro de conexiones C17/C18)
  const B1 = UNIDADES_ENERGIA.bat1.caja, B2 = UNIDADES_ENERGIA.bat2.caja;
  puerto('bat1.salida', U.carcasas.bat1.grupo, [B1[0] - 0.25, 3.0, ZT + 3.6], 'Batería 1 · conector de salida');
  puerto('bat1.correa', U.carcasas.bat1.grupo, [B1[0] - 0.2, 10.0, ZT + 2.2], 'Batería 1 · correa térmica');
  puerto('bat2.salida', U.carcasas.bat2.grupo, [B2[0] - 0.25, -3.0, ZT + 3.6], 'Batería 2 · conector de salida');
  puerto('bat2.correa', U.carcasas.bat2.grupo, [B2[0] - 0.2, -10.0, ZT + 2.6], 'Batería 2 · correa térmica');
  const g = (id) => U.carcasas[id].grupo;
  puerto('spu.correa', g('spu'), [41.8, 10.0, ZT + 2.2], 'SPU · correa térmica');
  puerto('spu.rumbo', g('spu'), [38.0, 0.6, ZT + 3.0], 'SPU · entrada de rumbo');
  puerto('spu.consola', g('spu'), [29.0, 8.0, ZT + 3.0], 'SPU · salida a la consola');
  puerto('spu.sep', g('spu'), [31.0, 11.4, ZT + 0.55], 'SPU · datos de navegación al SEP');
  puerto('dgu.rumbo', g('dgu'), [38.7, -7.0, ZT + 3.0], 'DGU · sincro de rumbo');
  puerto('dgu.correa', g('dgu'), [41.8, -10.0, ZT + 2.6], 'DGU · correa térmica');
  puerto('dce.entrada', g('dce'), [29.0, -6.0, ZT + 3.6], 'DCE · entrada de buses');
  // salidas de potencia por la cara inferior (los arneses bajan entre los soportes y corren bajo el chasis)
  puerto('dce.LF', g('dce'), [33.5, -2.4, ZT + 0.55], 'DCE · salida motor LF');
  puerto('dce.RF', g('dce'), [33.5, -11.4, ZT + 0.55], 'DCE · salida motor RF');
  puerto('dce.LR', g('dce'), [31.5, -3.4, ZT + 0.55], 'DCE · salida motor LR');
  puerto('dce.RR', g('dce'), [31.5, -10.4, ZT + 0.55], 'DCE · salida motor RR');
  puerto('dce.dirDel', g('dce'), [34.2, -5.0, ZT + 0.55], 'DCE · servo de dirección delantera');
  puerto('dce.dirTras', g('dce'), [31.0, -7.0, ZT + 0.55], 'DCE · servo de dirección trasera');
  puerto('dce.mando', g('dce'), [29.0, -9.0, ZT + 4.4], 'DCE · entrada del mando');
  // conector auxiliar en la esquina delantera izquierda (LS006-002-2H §1.4.4)
  parte(G, 'Conector_AUX', [caja(56.0, 57.6, 5.0, 8.0, ZB + 1.2, ZT + 1.25, 0.25), cil([57.6, 6.5, ZB + 2.05], [58.4, 6.5, ZB + 2.05], 1.2, 14)], M.aluOscuro, sub,
    meta('documentado', `${F.ops} §1.4.4; ${F.hb} §5.2.3`, 'Conector auxiliar: 36 V de los buses A y C por CB14 (AUX) para alimentar la LCRU. Posición exacta en el frente izquierdo inferida.', 'conector'));
  puerto('aux.entrada', G, [56.0, 6.5, ZT + 0.75], 'Conector AUX · entrada desde la consola');
  puerto('aux.salida', G, [58.4, 6.5, ZB + 2.05], 'Conector AUX · salida a la LCRU');
}

// =============================================================================
// COMUNICACIONES
// =============================================================================
function geomPlatoHGA(R, prof, costillas) {
  const nr = S(12), nt = costillas * S(8), pos = [], uv = [], idx = [];
  for (let j = 0; j <= nr; j++) {
    const t = 0.06 + 0.94 * (j / nr);
    for (let i = 0; i <= nt; i++) {
      const th = (i / nt) * Math.PI * 2, fase = Math.abs(Math.sin((th * costillas) / 2));
      const rho = R * t * (1 - 0.085 * fase * t), z = prof * (rho / R) ** 2 + 1.15 * fase * t * t;
      pos.push(rho * Math.cos(th), rho * Math.sin(th), z); uv.push(i / nt, j / nr);
    }
  }
  for (let j = 0; j < nr; j++) for (let i = 0; i < nt; i++) { const a = j * (nt + 1) + i, b = a + nt + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function construirComunicaciones(G, M, { xcn }, U) {
  const sub = 'comunicaciones', xf = X(P.staFrente);
  // ---------------- LCRU (22 x 16 x 6 in, 55 lb) ----------------
  const LCRU_DOC = meta('documentado', `${F.lcru} p. 3, fig. 5-1`, 'Relé de comunicaciones lunares: 22 x 16 x 6 in, presurizado a 7.5 psia. Transceptor VHF AM, dos transceptores de banda S, procesadores de subida y bajada, convertidor CC-CC y batería interna.');
  const xL0 = xf - 1.0, xL1 = xL0 + 16.0, zL0 = ZT + 7.0, zL1 = zL0 + 6.0;
  const gL = nodo('LCRU_Conjunto', G);
  parte(gL, 'LCRU', cajaAbierta(xL0, xL1, -11, 11, zL0, zL1 - 0.25, 0.25), M.foil, sub,
    { ...LCRU_DOC, funcion: LCRU_DOC.funcion + ' Posición acostada y sobresaliendo al frente inferida de AS17-146-22367.' });
  const tapaL = nodo('Tapa_lcru', gL, [xL1, 0, zL1 - 0.25]);
  parte(tapaL, 'LCRU_Tapa', [caja(-16.0, 0, -11, 11, 0, 0.25, 0.06)], M.foil, sub, { ...LCRU_DOC, tipo: 'tapa', funcion: 'Cubierta superior (apertura virtual de inspección: la unidad real iba sellada).' });
  parte(tapaL, 'LCRU_Espejos', [caja(-15.0, -1.0, -7.0, 7.0, 0.25, 0.4, 0)], M.espejoLCRU, sub,
    meta('documentado', `${F.lcru} p. 3; ${F.tv}`, 'Espejos radiadores de superficie secundaria, 196 in² (techo espejado de la LCRU).'));
  const paneles = [], ribetes = [];
  const panelManta = (y0, y1, ang, extra, semilla) => {
    const W = Math.abs(y1 - y0), H = 16.0 + extra, T = 0.45;
    const g = new THREE.BoxGeometry(T, W, H, 1, S(14), S(18));
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getY(i) / W + 0.5, v = p.getZ(i) / H + 0.5;
      const bombeo = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.42;
      const arruga = Math.sin(u * 19 + semilla) * Math.sin(v * 13 + semilla * 1.7) * 0.07 + Math.sin(u * 41 + v * 29 + semilla) * 0.03;
      p.setX(i, p.getX(i) + bombeo + arruga * Math.sin(Math.PI * u) * Math.sin(Math.PI * v));
    }
    g.computeVertexNormals();
    const r = 0.34, e = [[[0, -W / 2, H / 2], [0, W / 2, H / 2]], [[0, -W / 2, -H / 2], [0, W / 2, -H / 2]], [[0, -W / 2, -H / 2], [0, -W / 2, H / 2]], [[0, W / 2, -H / 2], [0, W / 2, H / 2]]];
    const rib = e.map(([a, b]) => cil(a, b, 2 * r, 10));
    for (const [yy, zz] of [[-W / 2, -H / 2], [-W / 2, H / 2], [W / 2, -H / 2], [W / 2, H / 2]]) rib.push(esfera([0, yy, zz], r, 8));
    const colocar = (q) => { q.translate(T / 2, 0, -H / 2); q.applyMatrix4(new THREE.Matrix4().makeRotationY(-ang)); q.translate(xL1 + 0.08, (y0 + y1) / 2, zL1 + 0.25); return q; };
    paneles.push(colocar(g)); ribetes.push(...rib.map(colocar));
  };
  panelManta(-11.3, -0.25, THREE.MathUtils.degToRad(3), 0.0, 3);
  panelManta(0.25, 11.3, THREE.MathUtils.degToRad(11), 0.9, 7);
  parte(gL, 'LCRU_Manta_Termica', paneles, M.foil, sub, meta('documentado', `${F.lcru} p. 3, 21–24; ${F.tv}`, 'Manta térmica abierta (exposición 0/35/65/100 %): los paneles cuelgan por delante y dejan los espejos al descubierto.'));
  parte(gL, 'LCRU_Ribete', [...ribetes, cil([xL1 + 0.05, -11.2, zL1 + 0.15], [xL1 + 0.05, 11.2, zL1 + 0.15], 0.5, 8), cil([xL0 + 0.1, -11.2, zL1 + 0.15], [xL0 + 0.1, 11.2, zL1 + 0.15], 0.5, 8)], M.blanco, sub,
    meta('inferido', 'foto 3/4 delantera del equipo', 'Ribete blanco de la manta.'));
  const sop = [caja(xL0 + 0.5, xL1 - 0.5, -10.4, 10.4, zL0 - 0.3, zL0, 0.12)];
  for (const y of [9.6, -9.6]) {
    sop.push(caja(xL0 + 0.2, xL0 + 1.4, y - 0.6, y + 0.6, ZB + 0.5, zL0 - 0.2, 0.15), cil([xL0 + 0.8, y, ZB + 1.6], [xL1 - 1.2, y, zL0 - 0.2], 0.9, 10));
    sop.push(caja(xL0 + 1.4, xL0 + 3.2, y - 0.35, y + 0.35, zL0 - 1.4, zL0 - 0.3, 0.08));        // palanca de bloqueo
  }
  sop.push(caja(xL0 - 0.9, xL0 + 1.6, -11.5, 11.5, ZB + 0.2, ZB + 1.1, 0.2));
  parte(gL, 'LCRU_Soportes', sop, M.aluOscuro, sub, meta('documentado', `${F.lcru} §4.2.1`, 'Dos palancas de bloqueo de la LCRU enganchan los postes de soporte del rover.'));
  // panel de control en la cara izquierda (posición inferida)
  const yP = 11.15, pc = [caja(xL0 + 2.5, xL0 + 12.5, yP - 0.05, yP + 0.25, zL0 + 0.8, zL0 + 5.2, 0.1)];
  pc.push(cil([xL0 + 4.5, yP + 0.2, zL0 + 3.0], [xL0 + 4.5, yP + 0.6, zL0 + 3.0], 2.4, 20));                         // medidor
  for (const [x, z] of [[8.0, 3.8], [10.0, 3.8], [8.0, 1.9]]) pc.push(cil([xL0 + x, yP + 0.2, zL0 + z], [xL0 + x, yP + 1.0, zL0 + z], 0.3, 6));   // selectores
  pc.push(cil([xL0 + 11.0, yP + 0.2, zL0 + 1.9], [xL0 + 11.0, yP + 0.55, zL0 + 1.9], 0.7, 10));                      // breaker 4–7.5 A
  parte(gL, 'LCRU_Panel_Control', pc, M.panel, sub, meta('documentado', `${F.lcru} fig. 4-1`, 'Medidor (POWER / RAD TEMP / S-BD AGC), selector de modo de banda S (PM1/NB, PM1/WB, FM/TV, TV RMT), selector de energía INT/EXT/OFF y breaker. Ubicación en la cara izquierda inferida.'));
  const CON = { hga: [yP, 3.4, M.rojo, 'Conector de la antena de alta ganancia (rojo, RF).'], lga: [yP, 2.2, M.azul, 'Conector de la antena de baja ganancia (azul, RF).'],
    potencia: [yP, 1.0, M.aluOscuro, 'Conector de potencia externa desde el rover.'], gcta: [-yP, 1.6, M.negro, 'Línea de la GCTA: +29 V y comandos de 70 kHz hacia la cámara, video de vuelta.'] };
  for (const [id, [y, dz, mat, txt]] of Object.entries(CON)) {
    const sy = Math.sign(y), z = zL0 + 1.2 + dz;
    parte(gL, `LCRU_Conector_${id.toUpperCase()}`, [cil([xL0 + 13.6, y - sy * 0.05, z], [xL0 + 13.6, y + sy * 0.95, z], 0.9, 12)], mat, sub,
      meta('documentado', `${F.lcru} §1.5`, txt + ' Cara de montaje inferida.', 'conector'));
    puerto(`lcru.${id}`, gL, [xL0 + 13.6, y + sy * 1.05, z], `LCRU · conector ${id.toUpperCase()}`);
  }
  // antena VHF omnidireccional en el techo (HSI-481184 §4.2.1)
  // en la tapa (marco de la tapa: origen en la bisagra xL1, zL1 − 0.25)
  const xv = xL0 + 1.8 - xL1, zv = 0.25;
  parte(tapaL, 'LCRU_Antena_VHF', [cil([xv, 8.6, zv], [xv, 8.6, zv + 0.8], 1.6, 14), cil([xv, 8.6, zv + 0.8], [xv, 8.6, zv + 15.0], 0.18, 6),
    esfera([xv, 8.6, zv + 15.0], 0.3, 6)], M.aluOscuro, sub, meta('documentado', `${F.lcru} §1.3, §4.2.14`, 'Antena VHF omnidireccional montada sobre la LCRU (relevo de voz con la tripulación). Largo inferido.'));
  puerto('lcru.vhf', gL, [xL0 + 1.8, 8.6, zL1 - 0.6], 'LCRU · transceptor VHF');
  puerto('vhf.base', tapaL, [xv, 8.6, zv - 0.1], 'Antena VHF · base');
  parte(tapaL, 'LCRU_Puerta_Bateria', [caja(1.0 + xL0 - xL1, 6.5 + xL0 - xL1, -10.2, -3.6, 0.25, 0.57, 0.1)], M.foil2, sub,
    meta('documentado', `${F.lcru} p. 3`, 'Compartimento de acceso a la batería interna, en la manta térmica (posición inferida).'));
  U.carcasas.lcru = { grupo: gL, tapa: tapaL, caja: [xL0, xL1, -11, 11, zL0, zL1], nombre: 'LCRU', apertura: [12, 0, 10] };

  // ---------------- HGA (mástil en el accesorio del parachoques izquierdo) ----------------
  const ym = 14.25, xmst = xf + 1.6, zMast = 80.0;
  parte(G, 'HGA_Mastil', [
    caja(xf - 2.2, xmst + 1.2, ym - 1.1, ym + 1.1, ZB, ZB + 2.6, 0.3),
    cil([xmst, ym, ZB + 1.0], [xmst, ym, zMast - 7.0], 1.2, 14), cil([xmst, ym, zMast - 7.5], [xmst, ym, zMast], 0.9, 12),
    cajaC(xmst, ym, zMast - 7.0, 1.9, 1.9, 1.1, 0.2), cajaC(xmst, ym, ZB + 30.0, 1.7, 1.7, 1.2, 0.2),
    ...[40, 62].map((z) => cajaC(xmst + 0.6, ym - 0.3, z, 1.5, 1.0, 0.5, 0.1)),        // abrazaderas del coaxial
  ], M.alu, sub, meta('documentado', `${F.lcru} p. 12–14`, 'Mástil que entra en el accesorio del parachoques izquierdo y se bloquea con un collar de bayoneta.'));
  const az = nodo('HGA_Az', G, [xmst, ym, zMast]);
  parte(az, 'HGA_Cardan', [cajaC(0, 0, 0.6, 2.4, 2.0, 1.6, 0.3), cil([0, -1.4, 1.6], [0, 1.4, 1.6], 0.9, 10)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 12`, 'Cardán de apuntado manual en acimut y elevación.'));
  const el = nodo('HGA_El', az, [0, 0, 1.6]);
  const R = P.hgaD / 2, prof = 6.2, nc = 12, off = 2.2;
  const enEl = (g) => { g.rotateY(Math.PI / 2); g.translate(off, 0, 0); return g; };     // eje del plato +Z -> +X
  parte(el, 'HGA_Plato_Malla_3ft', [enEl(geomPlatoHGA(R, prof, nc))], M.telaHGA, sub,
    meta('documentado', `${F.lcru} p. 12–14`, 'Reflector parabólico de malla y costillas de 3 ft; ganancia nominal 24 dB, 20 W.'));
  const hw = [];
  for (let k = 0; k < nc; k++) {
    const a = (2 * Math.PI * k) / nc, pts = [];
    for (let i = 0; i <= 6; i++) { const t = 0.06 + 0.94 * (i / 6), rho = R * t; pts.push([rho * Math.cos(a), rho * Math.sin(a), prof * t * t - 0.22]); }
    hw.push(enEl(tubo(pts, 0.34, { rc: 0.1, radial: 6 })));
  }
  const borde = new THREE.TorusGeometry(R * 0.995, 0.12, 4, S(96)); borde.translate(0, 0, prof + 0.05); hw.push(enEl(borde), enEl(cil([0, 0, -1.0], [0, 0, 0.6], 3.4, 20)));
  parte(el, 'HGA_Costillas', hw, M.alu, sub, meta('documentado', `${F.lcru} p. 12`, '12 costillas y aro del reflector desplegable.'));
  parte(el, 'HGA_Alimentador', [enEl(cil([0, 0, 0.4], [0, 0, prof + 4.2], 0.62, 10)), enEl(cono([0, 0, prof + 3.4], [0, 0, prof + 5.6], 1.0, 2.0, 16, true)),
    enEl(tubo(Array.from({ length: 25 }, (_, i) => [0.75 * Math.cos(i * 0.8), 0.75 * Math.sin(i * 0.8), prof + 3.6 + i * 0.075]), 0.12, { rc: 0.05, radial: 4, tapas: false }))], M.negro, sub,
  meta('documentado', `${F.lcru} p. 12`, 'Alimentador helicoidal en copa (deployable cup-helical feed).'));
  parte(el, 'HGA_Mira_Optica', [enEl(cil([2.4, -2.2, -1.2], [2.4, -2.2, 4.4], 1.3, 14)), enEl(cil([1.2, -1.1, -0.4], [2.4, -2.2, -0.4], 0.5, 6))], M.negro, sub,
    meta('documentado', `${F.lcru} p. 12–14`, 'Mira óptica con retícula y máscara sectorial para apuntar a la Tierra.'));
  parte(el, 'HGA_Palanca', [cil([off - 1.0, 0, 0], [off - 22.0, 0, 0], 0.75, 10), esfera([off - 22.2, 0, 0], 0.8, 8)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 12`, '«El apuntado mecánico se hace inclinando la palanca en acimut y elevación.»'));
  puerto('hga.alimentador', el, [off - 1.4, 0, -0.9], 'HGA · alimentador');
  U.antenas.hga = { az, el };

  // ---------------- LGA en el asidero interior izquierdo ----------------
  const xl = xcn - 4.5, yl = 7.2, zl0 = ZT + 12.0, zl1 = ZT + 46.0;
  parte(G, 'LGA_Asta_Reflector', [cil([xl, yl, zl0], [xl, yl, zl1], 0.55, 10), cajaC(xl, yl, zl0 + 0.6, 1.4, 1.4, 1.2, 0.2), cajaC(xl, yl, zl1 - 0.5, 1.4, 1.4, 1.2, 0.2)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 10–11`, 'El asta de la LGA entra en el asidero interior izquierdo del rover.'));
  const laz = nodo('LGA_Az', G, [xl, yl, zl1]);
  const lel = nodo('LGA_El', laz, [0, 0, 1.0]);
  parte(laz, 'LGA_Articulacion', [cil([0, -0.9, 1.0], [0, 0.9, 1.0], 0.9, 10), cil([0, 0, 0], [0, 0, 1.0], 0.7, 8)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 10`, 'Mecanismo de posicionamiento (2.45 lb con la antena); en EVA la elevación se ajustaba a mano (p. ej. 45°).'));
  parte(lel, 'LGA_Copa', [cono([0.0, 0, 0], [1.2, 0, 0], 0.7, 5.13 / 2, 24, true), cil([0.0, 0, 0], [0.12, 0, 0], 1.6, 16)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 10–11`, 'Reflector de copa de 5.13 in de diámetro.'));
  const hel = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120; hel.push([1.0 + t * 7.2, 1.0 * Math.cos(t * Math.PI * 2 * 6), 1.0 * Math.sin(t * Math.PI * 2 * 6)]); }
  parte(lel, 'LGA_Helice', [tubo(hel, 0.14, { rc: 0.05, radial: 4, tapas: false }), cil([0.9, 0, 0], [8.4, 0, 0], 0.35, 6)], M.alu, sub,
    meta('documentado', `${F.lcru} p. 10`, 'Alimentador helicoidal, polarización circular derecha, ganancia nominal 10 dB.'));
  parte(lel, 'LGA_Radomo', [cil([0.9, 0, 0], [8.7, 0, 0], 2.6, 20), cono([8.7, 0, 0], [9.32, 0, 0], 1.3, 0.7, 20)], M.radomo, sub,
    meta('inferido', `${F.fotoA}; ${F.lcru} p. 10 (largo total 9.32 in)`, 'Cubierta blanca que en las fotos envuelve la hélice; el manual no la describe.'));
  puerto('lga.helice', lel, [-0.3, 0, 0], 'LGA · conector');
  U.antenas.lga = { az: laz, el: lel };

  // ---------------- GCTA: asta en el accesorio del bastidor, TCU y cámara CTV ----------------
  const xT = xf + 1.0, yT = -12.8;
  const zCaja0 = zL1 + 4.3, zCaja1 = zCaja0 + 6.6, zTCU1 = zCaja1 + 8.8, zEje = zTCU1 + 3.2;
  const GDOC = meta('documentado', `${F.gcta} p. 1-1, 1-5`, 'Asta tubular con extremo cónico en un accesorio enchavetado del bastidor; bisagra abatible para retirar la LCRU sin quitar la GCTA.');
  parte(G, 'TV_GCTA_Mastil', [caja(xT - 1.4, xT + 1.4, yT - 1.4, yT + 1.4, ZB, ZB + 2.2, 0.25), cil([xT, yT, ZB + 1.0], [xT, yT, zCaja0 + 0.2], 1.3, 14),
    cil([xT, yT, ZB + 8.0], [xT, yT, ZB + 9.4], 1.9, 14), cil([xT - 1.0, yT, ZB + 8.7], [xT + 1.0, yT, ZB + 8.7], 0.5, 8)], M.alu, sub, GDOC);
  parte(G, 'TV_Caja_Control', [caja(xT - 3.0, xT + 3.0, yT - 4.25, yT + 4.25, zCaja0, zCaja1, 0.45)], M.pintura, sub,
    meta('documentado', `${F.gcta} p. 1-4, 1-51`, 'Caja electrónica inferior de la TCU (unidad de control): recibe la subportadora de 70 kHz y +29 V de la LCRU; alberga el eje de acimut.'));
  parte(G, 'TV_TCU_Columna', [cil([xT, yT, zCaja1], [xT, yT, zTCU1], 5.6, 28)], M.foil2, sub,
    meta('documentado', `${F.gcta} p. 1-51`, 'Tubo de empuje del acimut: motorreductor 487:1 y engranajes rectos 3.64:1 (forro dorado según fotos).'));
  puerto('tcu.entrada', G, [xT + 0.7, yT + 0.9, zCaja0 - 0.05], 'TCU · entrada del cable en Y');
  const pan = nodo('TV_Pan', G, [xT, yT, zTCU1]);
  parte(pan, 'TV_Horquilla', [cil([0, 0, -0.1], [0, 0, 0.5], 6.4, 28), ...[1, -1].map((s) => cajaC(0, s * 3.75, 1.9, 2.8, 0.4, 3.6, 0.12))], M.alu, sub,
    meta('documentado', `${F.gcta} p. 1-39`, 'Plato giratorio y horquilla: pan 134° a la izquierda y 214° a la derecha, 3.03°/s.'));
  parte(pan, 'TV_Motor_Elevacion', [cil([-1.2, -4.1, 2.2], [-1.2, -6.0, 2.2], 1.8, 14), cil([-1.2, -4.0, 2.2], [-1.2, -3.85, 2.2], 0.9, 10)], M.foil2, sub,
    meta('documentado', `${F.gcta} p. 1-39`, 'Motorreductor de elevación con piñón que mueve el segmento spiroid de la placa de montaje.'));
  puerto('tcu.camara', pan, [-1.0, 4.2, 0.9], 'TCU · salida a la cámara');
  const tilt = nodo('TV_Tilt', pan, [0, 0, zEje - zTCU1]);
  const CL0 = -10.5, CL1 = 7.5, CWc = 6.5, CHc = 4.0;
  parte(tilt, 'TV_Placa_Montaje', [caja(-5.5, 5.5, -CWc / 2 - 0.1, CWc / 2 + 0.1, -CHc / 2 - 0.35, -CHc / 2, 0.08), cil([0, -3.65, 0], [0, 3.65, 0], 0.8, 12),
    new THREE.CylinderGeometry(2.4, 2.4, 0.3, S(24), 1, false, Math.PI * 0.6, Math.PI * 0.8).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0, -3.55, -0.3)], M.alu, sub,
  meta('documentado', `${F.gcta} p. 1-39`, 'Placa de montaje de la cámara con el segmento de engranaje spiroid de elevación (+85° / −45°, 3.12°/s).'));
  parte(tilt, 'TV_Camara_Cuerpo', cajaAbierta(CL0, CL1, -CWc / 2, CWc / 2, -CHc / 2, CHc / 2 - 0.2, 0.2), M.foil2, sub,
    meta('documentado', `${F.gcta} p. 1-1, tabla 1-1`, 'Cámara CTV de RCA: ~18 x 6.5 x 4 in, 12.8 lb; tubo SIT de 16 mm y zoom 6:1.'));
  const tapaC = nodo('Tapa_ctv', tilt, [CL1, 0, CHc / 2 - 0.2]);
  parte(tapaC, 'TV_Camara_Tapa', [caja(CL0 - CL1, 0, -CWc / 2, CWc / 2, 0, 0.2, 0.06)], M.foil2, sub,
    meta('documentado', F.gcta, 'Cubierta superior de la cámara (apertura virtual de inspección).', 'tapa'));
  const tejas = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) tejas.push(caja(CL0 - CL1 + 0.5 + i * 2.9, CL0 - CL1 + 3.2 + i * 2.9, -CWc / 2 + 0.4 + j * 2.9, -CWc / 2 + 3.1 + j * 2.9, 0.2, 0.3, 0));
  parte(tapaC, 'TV_Espejos_Superiores', tejas, M.espejo, sub, meta('documentado', F.tv, '«La parte superior de la cámara está cubierta de baldosas de espejo» (radiador).'));
  parte(tilt, 'TV_Parasol', [troncoRect(CL1, CL1 + 4.8, CWc - 0.2, CHc - 0.2, CWc + 1.6, CHc + 1.2)], M.blanco, sub,
    meta('inferido', 'foto 3/4 delantera del equipo', 'Parasol rectangular, blanco por fuera y negro por dentro (no descrito en el manual de la GCTA).'));
  parte(tilt, 'TV_Camara_Lente', [troncoRect(CL1 + 0.05, CL1 + 4.75, CWc - 0.5, CHc - 0.5, CWc + 1.3, CHc + 0.9), cil([CL1 - 0.1, 0, 0], [CL1 + 1.6, 0, 0], 3.1, 24),
    caja(CL1 - 0.05, CL1 + 0.15, -CWc / 2 + 0.2, CWc / 2 - 0.2, -CHc / 2 + 0.2, CHc / 2 - 0.2, 0)], M.negroDoble, sub,
  meta('documentado', `${F.gcta} p. 1-1`, 'Frente del objetivo zoom Angenieux 12.5–75 mm f/2.2.'));
  parte(tilt, 'TV_Vidrio_Lente', [cil([CL1 + 1.6, 0, 0], [CL1 + 1.7, 0, 0], 2.8, 24)], M.lente, sub, meta('documentado', F.gcta, 'Lente frontal del zoom.'));
  parte(tilt, 'TV_Conector_Trasero', [cil([CL0 - 0.9, 0, 0], [CL0 + 0.1, 0, 0], 1.4, 14)], M.pintura, sub, meta('inferido', 'foto 3/4 delantera del equipo', 'Conector del cable de 3.5 ft.', 'conector'));
  puerto('ctv.entrada', tilt, [CL0 - 0.9, 0, 0], 'Cámara CTV · conector trasero');
  U.carcasas.ctv = { grupo: tilt, tapa: tapaC, caja: [CL0, CL1, -CWc / 2, CWc / 2, -CHc / 2, CHc / 2], nombre: 'Cámara CTV' };
  U.carcasas.tcu = { grupo: G, caja: [xT - 3.0, xT + 3.0, yT - 4.25, yT + 4.25, zCaja0, zCaja1], nombre: 'TCU', sinTapa: true, posTCU: [xT, yT, zCaja1, zTCU1] };
  U.gcta = { pan, tilt };
  alias('TV_Conector', ['Cable_C24', 'Cable_C25']);
  alias('Cables_Comunicaciones', ['Cable_C21', 'Cable_C22', 'Cable_C23']);

  // ---------------- cámara de 16 mm (DAC) en el asidero interior ----------------
  parte(G, 'Camara_16mm_DAC', [caja(xl - 1.2, xl + 2.6, yl - 2.9, yl - 0.75, zl0 + 0.5, zl0 + 4.6, 0.35), cil([xl + 2.6, yl - 1.8, zl0 + 2.6], [xl + 4.6, yl - 1.8, zl0 + 2.6], 1.5, 16),
    cil([xl - 0.2, yl - 1.8, zl0 + 4.6], [xl - 0.2, yl - 1.8, zl0 + 5.6], 2.0, 16)], M.panel, sub,
  meta('documentado', `${F.hb} §5.1`, 'Cámara de adquisición de datos de 16 mm en el receptáculo del asidero interior.'));
}

// =============================================================================
// CARGA Y CIENCIA (parte trasera)
// =============================================================================
function bolsaTela(BD, BW, BH, semilla) {
  const g = new THREE.BoxGeometry(BD, BW, BH, 6, 12, 14);
  const arriba = g.groups[4], idx = Array.from(g.index.array);
  idx.splice(arriba.start, arriba.count); g.setIndex(idx); g.clearGroups();
  const p = g.attributes.position, e = 1e-3;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i); const z = p.getZ(i), v = z / BH + 0.5;
    const enX = Math.abs(x) > BD / 2 - e, enY = Math.abs(y) > BW / 2 - e;
    const f = Math.sin(z * 0.9 + y * 0.35 + semilla) * 0.2 + Math.sin(y * 1.7 + z * 0.4 + semilla * 2) * 0.09;
    if (enX) x += Math.sign(x) * (0.7 * Math.cos(Math.PI * y / BW) * Math.sin(Math.PI * Math.min(1, v * 1.1)) + f);
    if (enY) y += Math.sign(y) * (0.5 * Math.cos(Math.PI * x / BD) * Math.sin(Math.PI * Math.min(1, v * 1.1)) + f);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); return g;
}
function construirCiencia(G, M, U) {
  const sub = 'ciencia';
  const xa0 = X(P.staBisagraTras), xa1 = X(P.staFondo);
  const zDeck = ZT + 8.0, xd0 = xa0 - 24.0, xd1 = xa0 - 6.0;
  const postes = [];
  for (const x of [xd0 + 1.0, xd1 - 1.0]) for (const y of [-12.3, 12.3]) postes.push(cil([x, y, ZT + 0.45], [x, y, zDeck], 1.1, 10));
  parte(G, 'Palet_Trasero', [caja(xa1 + 0.5, xa0 - 1.0, -13.5, 13.5, ZT, ZT + 0.45, 0.1), ...postes, caja(xd0, xd1, -13.2, 13.2, zDeck, zDeck + 0.5, 0.15),
    cil([xd0 + 1.0, -12.3, zDeck - 3.5], [xd1 - 1.0, 12.3, zDeck - 0.4], 0.6, 8), cil([xd0 + 1.0, 12.3, zDeck - 3.5], [xd1 - 1.0, -12.3, zDeck - 0.4], 0.6, 8)], M.aluOscuro, sub,
  meta('inferido', `${F.tge} («geopalet»)`, 'Palé trasero de carga con cubierta elevada; altura inferida de las fotos.'));
  alias('Pale_Trasero_DCE', ['Palet_Trasero']);
  const xr = xa1 + 1.5, zTop = ZT + 30.0;
  const rack = [tubo([[xr, -12.5, ZT + 0.45], [xr, -12.5, zTop], [xr, 12.5, zTop], [xr, 12.5, ZT + 0.45]], 0.95, { rc: 1.6, tapas: false }),
    cil([xr, -12.5, ZT + 12.0], [xr, 12.5, ZT + 12.0], 0.75, 10), cil([xr, -12.5, ZT + 22.0], [xr, 12.5, ZT + 22.0], 0.75, 10)];
  const herr = [];
  for (const [y, h] of [[-9.0, 34.0], [-6.0, 38.0], [-3.0, 34.0], [6.0, 38.0], [9.0, 34.0]]) {
    herr.push(cil([xr - 0.95, y, ZT + 1.0], [xr - 0.95, y, ZT + h], 0.75, 10));
    for (const zc of [ZT + 12.0, ZT + 22.0]) herr.push(cajaC(xr - 0.5, y, zc, 1.4, 1.3, 1.1, 0.2));
  }
  herr.push(cajaC(xr - 0.95, -9.0, ZT + 35.1, 1.4, 3.2, 2.4, 0.3), cajaC(xr - 0.95, 9.0, ZT + 34.6, 0.7, 5.4, 1.4, 0.15));
  for (let i = 0; i < 7; i++) herr.push(cil([xr - 0.95, 6.8 + i * 0.73, ZT + 34.2], [xr - 0.95, 6.8 + i * 0.73, ZT + 35.9], 0.18, 5));
  parte(G, 'Portaherramientas', [...rack, ...herr], M.alu, sub, meta('inferido', F.fotoA, 'Portaherramientas trasero con herramientas de mango largo, pala y rastrillo.'));
  // bolsa de muestras abierta detrás del asiento izquierdo
  const tilt = THREE.MathUtils.degToRad(13), xBack = X(P.staSRP) - 4.7, zp = ZT + 6.5, bolsas = [];
  {
    const BW = 16.0, BD = 10.0, BH = 22.0, zc = zp + 10.0;
    const xc = xBack - (zc - zp) * Math.tan(tilt) - 1.4 - BD / 2;
    const piezas = [bolsaTela(BD, BW, BH, 4),
      tubo([[-BD / 2, -BW / 2, BH / 2], [BD / 2, -BW / 2, BH / 2], [BD / 2, BW / 2, BH / 2], [-BD / 2, BW / 2, BH / 2]], 0.7, { rc: 1.4, cerrado: true }),
      ...[1, -1].map((s) => cil([BD / 2 - 0.2, s * (BW / 2 - 2.5), BH / 2], [BD / 2 + 0.6, s * (BW / 2 - 2.5), BH / 2 + 2.2], 0.6, 8))];
    for (const g of piezas) { g.applyMatrix4(new THREE.Matrix4().makeRotationY(-tilt)); g.translate(xc, P.asientoY, zc); bolsas.push(g); }
  }
  parte(G, 'Bolsas_Muestras', bolsas, M.tela, sub, meta('inferido', 'foto 3/4 delantera del equipo', 'Bolsa de muestras de tela beta abierta, con aro, detrás del asiento izquierdo.'));
  // ---------------- TGE (atrás a la derecha, 50.8 x 27.9 x 24.8 cm, 14.6 kg) ----------------
  const xt = xa0 - 14.5, yt = -7.4, zt0 = zDeck + 0.5 + 1.0, zt1 = zt0 + 20.0;
  const TGE = meta('documentado', `${F.tge}; AS17-137-20979 («TGE mounted at the rear of LRV 3»)`, 'Gravímetro de travesía: 50.8 x 27.9 x 24.8 cm, 14.6 kg, mantas térmicas azules, asa, radiador y lectura de 9 dígitos con botones GRAV, READ y BIAS, y paquete de baterías. Montaje en la parte trasera documentado; el lado derecho se infiere de fotos.');
  parte(G, 'Gravimetro_TGE', [caja(xt - 5.5, xt + 5.5, yt - 4.9, yt + 4.9, zt0, zt1, 0.6)], M.telaAzul, sub, TGE);
  parte(G, 'TGE_Asa_Radiador', [tubo([[xt - 3, yt, zt1], [xt - 3, yt, zt1 + 2.6], [xt + 3, yt, zt1 + 2.6], [xt + 3, yt, zt1]], 0.6, { rc: 0.8 }),
    caja(xt - 4.6, xt + 1.6, yt - 4.0, yt + 4.0, zt1, zt1 + 0.3, 0.05)], M.alu, sub, { ...TGE, funcion: 'Asa de transporte y pequeño radiador (se abría a la sombra cuando no se usaba).' });
  const lect = [caja(xt - 3.8, xt + 3.8, yt - 5.1, yt - 4.85, zt1 - 7.0, zt1 - 2.0, 0.08)];
  for (let k = 0; k < 3; k++) lect.push(cil([xt - 2.4 + k * 2.4, yt - 5.0, zt1 - 6.0], [xt - 2.4 + k * 2.4, yt - 5.5, zt1 - 6.0], 0.8, 10));
  lect.push(cil([xt + 3.0, yt - 5.0, zt1 - 3.0], [xt + 3.0, yt - 5.7, zt1 - 3.0], 0.3, 6));
  parte(G, 'TGE_Lectura', lect, M.panel, sub, { ...TGE, funcion: 'Pantalla de 9 dígitos (encendida 20 s), botones GRAV / READ / BIAS e interruptor de encendido.' });
  parte(G, 'TGE_Patas_Soporte', [...[[0, 3.6], [-3.4, -2.2], [3.4, -2.2]].map(([dx, dy]) => cil([xt + dx, yt + dy, zt0], [xt + dx, yt + dy, zt0 - 1.0], 0.8, 8)),
    caja(xt - 6.0, xt + 6.0, yt - 5.4, yt + 5.4, zDeck + 0.5, zDeck + 0.8, 0.1)], M.aluOscuro, sub, { ...TGE, funcion: 'Tres patas para apoyarlo en el suelo y herraje de montaje en el rover.' });
  // ---------------- SEP: receptor (atrás a la izquierda), DSEA y antena de 3 lazos a ~2 m ----------------
  const xs = xa0 - 14.5, ys = 7.4, zs0 = zDeck + 10.5, zs1 = zs0 + 8.0;
  const SEPD = meta('documentado', `${F.sep}; ${F.sta2} 142:46`, 'Receptor del experimento de propiedades eléctricas superficiales: reflectores ópticos para enfriarse bajo mantas que se abrían; se apagaba sobre ~108 °F.');
  parte(G, 'Receptor_SEP', [caja(xs - 5.5, xs + 5.5, ys - 5.0, ys + 5.0, zs0, zs1, 0.4), ...[[-4.5, -4], [4.5, -4], [-4.5, 4], [4.5, 4]].map(([dx, dy]) => cil([xs + dx, ys + dy, zDeck + 0.5], [xs + dx, ys + dy, zs0], 0.9, 8))], M.tela, sub,
    { ...SEPD, funcion: SEPD.funcion + ' Tamaño y pedestal inferidos.' });
  parte(G, 'SEP_Espejos', [caja(xs - 4.8, xs + 4.8, ys - 4.3, ys + 4.3, zs1, zs1 + 0.14, 0)], M.espejo, sub, { ...SEPD, funcion: 'Reflectores de superficie óptica para enfriar el receptor.' });
  const manta = nodo('Manta_SEP', G, [xs - 5.5, ys, zs1 + 0.1]);
  manta.rotation.y = THREE.MathUtils.degToRad(-118);
  parte(manta, 'SEP_Manta_Abierta', [caja(0, 11.4, -5.2, 5.2, 0, 0.35, 0.1), cil([0, -5.2, 0.15], [0, 5.2, 0.15], 0.45, 8)], M.tela, sub,
    meta('inferido', `${F.sta2} 142:46:57 («blankets are open»); AS17-146-22367`, 'Manta del receptor abierta para que los reflectores irradien; corresponde al panel inclinado que se ve sobre la carga trasera en las fotos.'));
  parte(G, 'Grabador_DSEA', [caja(xs - 4.0, xs + 4.0, ys - 7.6, ys - 5.0, zs0 + 0.5, zs0 + 6.0, 0.3), cajaC(xs, ys - 7.7, zs0 + 6.3, 3.0, 0.8, 0.8, 0.2)], M.pintura, sub,
    meta('documentado', `${F.sta2} 142:47:14; ${F.sep}`, 'Data Storage Electronics Assembly: grabador de cinta removible que volvió a la Tierra.'));
  const xm = xs - 5.0, ymS = ys + 4.4, zAnt = 78.7, rL = 6.0;
  const lazos = [anillo(xm, ymS, zAnt, rL, 0.36, 'z'), anillo(xm, ymS, zAnt, rL, 0.36, 'x'), anillo(xm, ymS, zAnt, rL, 0.36, 'y')];
  parte(G, 'Antena_SEP', [cil([xm, ymS, zs1], [xm, ymS, zAnt - rL - 0.4], 0.9, 12), cajaC(xm, ymS, zAnt - rL - 0.6, 1.4, 1.4, 1.2, 0.2), ...lazos], M.pintura, sub,
    meta('documentado', `${F.sep}`, 'Antena receptora de tres lazos ortogonales eléctricamente pequeños, a ~2 m del suelo con el receptor montado en el rover. Diámetro de los lazos y mástil inferidos.'));
  alias('Antena_SEP_3_Lazos', ['Antena_SEP']);
  puerto('sep.antena', G, [xm, ymS, zs1 + 2.0], 'Antena SEP · bajada');
  puerto('sep.entrada', G, [xs - 4.6, ys + 4.2, zs1 + 0.2], 'Receptor SEP · entrada de antena');
  puerto('sep.grabador', G, [xs + 3.5, ys - 5.05, zs0 + 6.5], 'Receptor SEP · salida al grabador');
  puerto('dsea.entrada', G, [xs + 4.05, ys - 6.3, zs0 + 3.0], 'DSEA · entrada');
  puerto('sep.nav', G, [xs + 5.6, ys + 2.0, zs0 + 2.0], 'Receptor SEP · datos del rover');
}

// =============================================================================
// ENSAMBLAJE
// =============================================================================
/**
 * Crea el LRV-3 completo, articulado y con registro de conexiones.
 * @param {{calidad?: 'alta'|'media'|'baja', direccionTierra?: THREE.Vector3}} op
 * @returns {THREE.Group} grupo raíz en metros (Y arriba, frente +X)
 */
export function crearLRV3(op = {}) {
  Q = { alta: 1.5, media: 0.85, baja: 0.6 }[op.calidad || 'alta'] || 1;
  const M = crearMateriales();
  const raiz = new THREE.Group(); raiz.name = 'LRV-3_Apollo17';
  const cuerpo = new THREE.Group(); cuerpo.name = 'LRV3_pulgadas';
  cuerpo.rotation.x = -Math.PI / 2; cuerpo.scale.setScalar(PULGADA);
  raiz.add(cuerpo);
  const U = { esquinas: {}, direccion: {}, barras: {}, antenas: {}, carcasas: {} };
  CTX = { piezas: new Map(), puertos: new Map(), alias: {}, nodos: {} };
  const grupos = {};
  for (const s of SUBSISTEMAS) grupos[s.id] = grupo(String(SUBSISTEMAS.indexOf(s) + 1).padStart(2, '0') + '_' + s.nombre.replace(/\s+/g, '_'), cuerpo, s.id, EXPLOSION[s.id]);
  U.grupos = grupos;

  construirEstructura(grupos.estructura, M);
  for (const [tag, xw, sy, del] of [['DI', XF, 1, true], ['DD', XF, -1, true], ['TI', XR, 1, false], ['TD', XR, -1, false]]) {
    construirEsquina(grupos.movilidad, M, tag, xw, sy, del, U);
    construirGuardabarros(grupo(`Guardabarros_${tag}`, grupos.movilidad, 'movilidad', [del ? 6 : -6, sy * 22, 16]), tag, xw, sy, del, M, 'movilidad');
  }
  construirDireccion(grupos.movilidad, M, true, U);
  construirDireccion(grupos.movilidad, M, false, U);
  crearBarrasAcoplamiento(grupos.movilidad, M, U);
  const ref = construirTripulacion(grupos.tripulacion, M);
  U.consolaLocal = ref;
  construirEnergia(grupos.energia, M, U);
  construirComunicaciones(grupos.comunicaciones, M, ref, U);
  construirCiencia(grupos.ciencia, M, U);

  // base de posiciones para la composición explosión + apertura + articulación
  raiz.traverse((o) => { if (o.isGroup || o.isObject3D) { o.userData.posBase = o.position.clone(); } });
  raiz.userData = {
    nombre: 'Lunar Roving Vehicle LRV-3 · Apollo 17', unidades: 'metros', fuente: 'MSC-07464, LS006-002-2H, HSI-481184, GCTA Manual, NASA-CR-141724',
    subsistemas: SUBSISTEMAS, estado: ESTADO_HISTORICO, fuentes: FUENTES,
    cuerpo, grupos, materiales: M, piezas: CTX.piezas, puertos: CTX.puertos, alias: CTX.alias, nodos: CTX.nodos,
    ...U, calidad: op.calidad || 'alta',
    articulacion: { direccionDel: 0, direccionTras: 0, suspension: { DI: 0, DD: 0, TI: 0, TD: 0 }, giroRuedas: 0,
      gctaPan: 15, gctaTilt: 0, filtro: 0, hgaAz: 0, hgaEl: 45, lgaAz: 0, lgaEl: 45 },
  };
  CTX = null;
  crearCables(raiz, CONEXIONES);
  apuntarAntenas(raiz, op.direccionTierra || direccionCielo(TIERRA_ESCENA.elevacion, TIERRA_ESCENA.azimut));
  articularLRV3(raiz, {});
  return raiz;
}

// -----------------------------------------------------------------------------
// Composición de transformaciones (explosión, apertura, suspensión) sin sobrescribirse
// -----------------------------------------------------------------------------
function asegurarBase(o) { if (!o.userData.posBase) o.userData.posBase = o.position.clone(); if (!o.userData.desp) o.userData.desp = {}; }
/** Fija (o borra con v = null) un desplazamiento con nombre y recompone la posición. */
export function desplazarLRV3(o, clave, v) {
  asegurarBase(o);
  if (v) o.userData.desp[clave] = v.isVector3 ? v.clone() : new THREE.Vector3(v[0], v[1], v[2]); else delete o.userData.desp[clave];
  o.position.copy(o.userData.posBase);
  for (const d of Object.values(o.userData.desp)) o.position.add(d);
}
function raizDe(o) { let r = o; while (r.parent && !r.userData.cuerpo) r = r.parent; return r.userData.cuerpo ? r : null; }

/** Vista explosionada: f = 0 (armado) … 1 (separado). Se compone con aperturas y articulaciones. */
export function explotarLRV3(raiz, f) {
  raiz.traverse((o) => {
    const e = o.userData && o.userData.explosion;
    if (!e || !e.isVector3 || e.lengthSq() === 0) return;
    desplazarLRV3(o, 'explosion', e.clone().multiplyScalar(f));
  });
  if (raiz.userData.barras) { actualizarBarras(raiz); actualizarCables(raiz); }
}

/**
 * Aplica articulaciones. Claves (todas opcionales):
 *  direccionDel / direccionTras: −1…1 (+ = girar a la izquierda; ángulo interior máx. 50°, exterior 22° por Ackermann)
 *  suspension: número (todas) u objeto {DI, DD, TI, TD} en pulgadas (+ = compresión, −4…+6)
 *  giroRuedas (rad), gctaPan / gctaTilt (°), filtro (°), hgaAz / hgaEl / lgaAz / lgaEl (°)
 */
export function articularLRV3(raiz, cambios = {}) {
  const U = raiz.userData, A = U.articulacion, L = LIMITES, d2r = THREE.MathUtils.degToRad;
  if (cambios.suspension !== undefined) {
    const s = cambios.suspension;
    for (const t of ['DI', 'DD', 'TI', 'TD']) A.suspension[t] = THREE.MathUtils.clamp(typeof s === 'number' ? s : (s[t] ?? A.suspension[t]), -L.suspensionExtension, L.suspensionCompresion);
  }
  for (const k of ['direccionDel', 'direccionTras', 'giroRuedas', 'gctaPan', 'gctaTilt', 'filtro', 'hgaAz', 'hgaEl', 'lgaAz', 'lgaEl']) if (cambios[k] !== undefined) A[k] = cambios[k];
  A.direccionDel = THREE.MathUtils.clamp(A.direccionDel, -1, 1); A.direccionTras = THREE.MathUtils.clamp(A.direccionTras, -1, 1);
  A.gctaPan = THREE.MathUtils.clamp(A.gctaPan, L.gctaPan[0], L.gctaPan[1]); A.gctaTilt = THREE.MathUtils.clamp(A.gctaTilt, L.gctaTilt[0], L.gctaTilt[1]);
  // Ackermann (MSC-07464 §4.5.1): con batalla/2 = 45 in y trocha 72 in, 50° interior ⇒ 22° exterior
  // s > 0: ruedas del eje apuntando a la izquierda. En el eje delantero la rueda interior es la izquierda;
  // en el trasero (que gira al revés para cerrar la curva) la interior es la derecha.
  const ack = (s, trasera) => {
    if (Math.abs(s) < 1e-4) return [0, 0];
    const di = d2r(L.direccionInterior) * Math.abs(s), dIn = 45 / Math.tan(di), de = Math.atan(45 / (dIn + 72));
    const izqInterior = (s > 0) !== trasera;
    const [aI, aD] = izqInterior ? [di, de] : [de, di];
    return s > 0 ? [aI, aD] : [-aI, -aD];   // [izquierda, derecha]
  };
  const [dIzq, dDer] = ack(A.direccionDel, false), [tIzq, tDer] = ack(A.direccionTras, true);
  const ang = { DI: dIzq, DD: dDer, TI: tIzq, TD: tDer };
  for (const [tag, e] of Object.entries(U.esquinas)) {
    const j = THREE.MathUtils.clamp(A.suspension[tag], -L.suspensionExtension, L.suspensionCompresion);
    const th = e.sy * (j / LA);
    e.pivInf.rotation.x = th; e.pivSup.rotation.x = th;
    const v = e.va.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), th).sub(e.va);
    desplazarLRV3(e.mang, 'suspension', v);
    e.dirp.rotation.z = ang[tag];
    e.giro.rotation.y = e.sy * A.giroRuedas;
    actualizarAmortiguador(e);
  }
  for (const [tag, d] of Object.entries(U.direccion)) {
    const prom = tag === 'Del' ? (dIzq + dDer) / 2 : (tIzq + tDer) / 2;
    d.sec.rotation.z = -prom;
  }
  if (U.gcta) { U.gcta.pan.rotation.z = d2r(A.gctaPan); U.gcta.tilt.rotation.y = -d2r(A.gctaTilt); }
  if (U.ruedaFiltros) U.ruedaFiltros.rotation.x = d2r(A.filtro);
  for (const id of ['hga', 'lga']) {
    const a = U.antenas[id]; if (!a) continue;
    a.az.rotation.z = d2r(A[id + 'Az']); a.el.rotation.y = -d2r(A[id + 'El']);
  }
  actualizarBarras(raiz);
  actualizarCables(raiz);
  return A;
}
/** Apunta HGA y LGA (apuntado MANUAL en la realidad) hacia una dirección del marco NASA del rover. */
export function apuntarAntenas(raiz, dir) {
  const d = dir.clone().normalize(), az = THREE.MathUtils.radToDeg(Math.atan2(d.y, d.x)), el = THREE.MathUtils.radToDeg(Math.asin(d.z));
  const A = raiz.userData.articulacion;
  A.hgaAz = az; A.hgaEl = el; A.lgaAz = az; A.lgaEl = el;
  raiz.userData.direccionTierra = d.clone();
  if (raiz.userData.barras) articularLRV3(raiz, {});
  return { az, el };
}
/** Dirección actual del eje de la HGA en el marco NASA (para verificar el apuntado). */
export function ejeHGA(raiz) {
  const el = raiz.userData.antenas.hga.el, c = raiz.userData.cuerpo;
  raiz.updateMatrixWorld(true);
  const o = el.localToWorld(new THREE.Vector3(0, 0, 0)), p = el.localToWorld(new THREE.Vector3(1, 0, 0));
  return c.worldToLocal(p).sub(c.worldToLocal(o)).normalize();
}

/** Triángulos del objeto; con {soloLejos: true} ignora el nivel cercano de los LOD y lo oculto. */
export function contarTriangulos(obj, { soloLejos = false, soloVisibles = false } = {}) {
  let t = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    if (soloLejos && o.userData.lodCercano) return;
    if (soloVisibles) { let p = o; while (p) { if (!p.visible) return; p = p.parent; } }
    const g = o.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
  });
  return Math.round(t);
}

/** Resuelve un nombre de pieza o alias (compatibilidad con nombres de versiones previas). */
export function resolverPiezas(raiz, nombre) {
  const U = raiz.userData;
  if (U.piezas.has(nombre)) return [U.piezas.get(nombre)];
  const lista = U.alias[nombre];
  if (lista) return lista.map((n) => U.piezas.get(n) || raiz.getObjectByName(n)).filter(Boolean).flatMap((o) => (o.isMesh ? [o] : (() => { const a = []; o.traverse((x) => x.isMesh && a.push(x)); return a; })()));
  const o = raiz.getObjectByName(nombre);
  if (!o) return [];
  if (o.isMesh) return [o];
  const a = []; o.traverse((x) => x.isMesh && a.push(x)); return a;
}

export { actualizarCables };
