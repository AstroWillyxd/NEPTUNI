// =============================================================================
// LRV-3 Apollo 17 · Interiores inspeccionables (se construyen bajo demanda).
// NEPTUNI Arqueología Espacial
//
// Módulo separado porque los interiores sólo se generan cuando alguien los inspecciona:
// así el rover base conserva su presupuesto de triángulos en celulares.
//
// Marco: pulgadas, X adelante, Y izquierda, Z arriba (el mismo de lrv3-modelo.js).
// Cada pieza lleva userData.evidencia ∈ {documentado, inferido, educativo}:
//  · documentado: el componente y su función aparecen en la fuente citada;
//  · inferido: existe, pero su forma o ubicación interna se dedujo;
//  · educativo: subdivisión o disposición reconstruida para enseñar el funcionamiento.
// No se dispone de planos internos de las cajas: TODA la disposición interna es, como
// mínimo, inferida; las cantidades (23 celdas, 19 celdas, 14 breakers, relaciones de
// engranaje, tensiones) sí están documentadas en las fuentes citadas.
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';
import { GEO, desplazarLRV3, UNIDADES_ENERGIA, P as PARAM } from './lrv3-modelo.js';
import { crearCables, actualizarCables, CONEXIONES_INTERIORES } from './lrv3-conexiones.js';

const { cil, esfera, caja, cajaC, tubo, fusionar } = GEO;
const ZT = PARAM.chasisZ + PARAM.largueroAlto;
const HB = 'MSC-07464', LC = 'HSI-481184', GC = 'GCTA Manual (RCA)';

/** Catálogo de interiores explorables. */
export const INTERIORES = {
  // apertura: desplazamiento de la tapa en pulgadas (primero sube Z, después se desliza en X/Y)
  bat1: { nombre: 'Batería 1 · 23 celdas Ag-Zn', subsistema: 'energia', apertura: [0, 14, 7] },
  bat2: { nombre: 'Batería 2 · 23 celdas Ag-Zn', subsistema: 'energia', apertura: [0, -14, 7] },
  spu: { nombre: 'SPU · procesador de navegación', subsistema: 'energia', apertura: [0, 14, 7] },
  dgu: { nombre: 'DGU · giróscopo direccional', subsistema: 'energia', apertura: [0, -12, 9] },
  dce: { nombre: 'DCE · control de tracción y dirección', subsistema: 'energia', apertura: [0, -14, 7] },
  consola: { nombre: 'Consola · breakers y buses A–D', subsistema: 'tripulacion', carcasa: ['Consola_Carcasa', 'Consola_Panel', 'Consola_Indicadores', 'Bandera_Alerta'] },
  lcru: { nombre: 'LCRU · relé de comunicaciones', subsistema: 'comunicaciones', apertura: [12, 0, 10] },
  ctv: { nombre: 'Cámara de TV (CTV) · óptica y tubo SIT', subsistema: 'comunicaciones', apertura: [0, 0, 4.5] },
  tcu: { nombre: 'TCU · control y accionamiento pan-tilt', subsistema: 'comunicaciones', carcasa: ['TV_Caja_Control', 'TV_TCU_Columna'] },
};

// -----------------------------------------------------------------------------
function materiales(U) {
  if (U.materialesInt) return U.materialesInt;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    placa: std({ name: 'Placa_circuito', color: 0x2e5b3c, roughness: 0.6, metalness: 0.1 }),
    chip: std({ name: 'Encapsulado', color: 0x26272a, roughness: 0.45, metalness: 0.2 }),
    cobre: std({ name: 'Cobre', color: 0xc07a45, roughness: 0.35, metalness: 0.9 }),
    celda: std({ name: 'Caja_celda', color: 0xd9d4c4, roughness: 0.55, metalness: 0.0 }),
    borne: std({ name: 'Borne', color: 0xbfc2c4, roughness: 0.3, metalness: 0.9 }),
    cera: std({ name: 'Paquete_cera', color: 0xa7a9a6, roughness: 0.5, metalness: 0.6 }),
    disipador: std({ name: 'Disipador', color: 0x6d7074, roughness: 0.45, metalness: 0.8 }),
    rele: std({ name: 'Rele', color: 0x8b8f93, roughness: 0.4, metalness: 0.7 }),
    modulo: std({ name: 'Modulo_RF', color: 0xb9b6ad, roughness: 0.45, metalness: 0.55 }),
    rotor: std({ name: 'Rotor_giroscopo', color: 0xc9a75a, roughness: 0.3, metalness: 0.85 }),
    vidrio: new THREE.MeshPhysicalMaterial({ name: 'Elemento_optico', color: 0x9fc3d6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
    tubo: new THREE.MeshPhysicalMaterial({ name: 'Tubo_SIT', color: 0x8c96a0, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }),
    filtroR: std({ name: 'Filtro_rojo', color: 0xd03a2c, roughness: 0.2, transparent: true, opacity: 0.8 }),
    filtroV: std({ name: 'Filtro_verde', color: 0x3bb04c, roughness: 0.2, transparent: true, opacity: 0.8 }),
    filtroA: std({ name: 'Filtro_azul', color: 0x2f62d8, roughness: 0.2, transparent: true, opacity: 0.8 }),
    altaTension: std({ name: 'Modulo_alta_tension', color: 0x9a3b2a, roughness: 0.5 }),
    engranaje: std({ name: 'Engranaje', color: 0xa8aaad, roughness: 0.35, metalness: 0.85 }),
    bus: { A: std({ name: 'Bus_A', color: 0xd94b3a, roughness: 0.4, metalness: 0.5 }), B: std({ name: 'Bus_B', color: 0xe0a33a, roughness: 0.4, metalness: 0.5 }),
      C: std({ name: 'Bus_C', color: 0x3a79d9, roughness: 0.4, metalness: 0.5 }), D: std({ name: 'Bus_D', color: 0x40b56a, roughness: 0.4, metalness: 0.5 }) },
  };
  U.materialesInt = M;
  // los materiales del interior se liberan con el rover (y reciben los planos de corte del visor)
  for (const [k, v] of Object.entries(M)) { if (v.isMaterial) U.materiales['int_' + k] = v; else for (const [b, m] of Object.entries(v)) U.materiales['int_bus' + b] = m; }
  return M;
}

const m = (evidencia, fuente, funcion) => ({ evidencia, fuente, funcion });
function pieza(U, g, nombre, geoms, mat, sub, unidad, meta) {
  const geo = fusionar(Array.isArray(geoms) ? geoms : [geoms]); geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, mat); mesh.name = nombre; mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = { parte: nombre, subsistema: sub, tipo: 'interior', unidad, ...meta };
  g.add(mesh); U.piezas.set(nombre, mesh); return mesh;
}
/** InstancedMesh con información por instancia (selección de una celda, un breaker…). */
function instancias(U, g, nombre, geo, mat, sub, unidad, meta, lista) {
  const im = new THREE.InstancedMesh(geo, mat, lista.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  lista.forEach((it, i) => { q.setFromEuler(new THREE.Euler(...(it.rot || [0, 0, 0]))); im.setMatrixAt(i, m4.compose(new THREE.Vector3(...it.pos), q, it.esc ? new THREE.Vector3(...it.esc) : s)); });
  im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
  im.name = nombre; im.castShadow = true; im.receiveShadow = true;
  im.userData = { parte: nombre, subsistema: sub, tipo: 'interior', unidad, ...meta, instancias: lista.map((it) => it.info || null) };
  g.add(im); U.piezas.set(nombre, im); return im;
}
function puertoInt(U, id, padre, pos, etiqueta) {
  const o = new THREE.Object3D(); o.name = `Puerto_${id}`; o.position.set(...pos); o.userData = { puerto: id, etiqueta };
  padre.add(o); U.puertos.set(id, o); return o;
}
function placaConChips(x0, x1, y, z0, z1, n, rnd, normalY = true) {
  // placa vertical (plano XZ si normalY) + n chips en una cara; devuelve [geoPlaca, posiciones de chips]
  const pl = normalY ? caja(x0, x1, y - 0.04, y + 0.04, z0, z1, 0) : caja(y - 0.04, y + 0.04, x0, x1, z0, z1, 0);
  const chips = [];
  for (let k = 0; k < n; k++) {
    const u = x0 + 0.5 + ((x1 - x0 - 1.0) * ((k % 4) + 0.5)) / 4, w = z0 + 0.45 + ((z1 - z0 - 0.9) * (Math.floor(k / 4) + 0.5)) / Math.ceil(n / 4);
    chips.push(normalY ? [u, y + 0.16, w] : [y + 0.16, u, w]);
  }
  return [pl, chips];
}
let _semilla = 1;
const rnd = () => { _semilla = (_semilla * 16807) % 2147483647; return _semilla / 2147483647; };

// =============================================================================
// Constructores por unidad
// =============================================================================
function interiorBateria(U, M, id, g) {
  const [x0, x1, y0, y1, z0] = UNIDADES_ENERGIA[id].caja, sy = id === 'bat1' ? 1 : -1, n = id === 'bat1' ? 1 : 2;
  const sub = 'energia', nom = `Bateria_${n}`;
  const zc0 = z0 + 0.25, h = 4.3, cx = 2.8, cyp = (Math.abs(y1 - y0) - 0.6) / 6;
  const slots = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) slots.push([x0 + 0.5 + cx * (i + 0.5), sy * (Math.min(Math.abs(y0), Math.abs(y1)) + 0.3 + cyp * (j + 0.5))]);
  // serpentina: columnas alternas → orden en serie; la ranura 0 queda para el bloque de bornes
  const orden = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) orden.push(i * 6 + (i % 2 ? 5 - j : j));
  const celdas = orden.slice(1).map((s, k) => ({ pos: [slots[s][0], slots[s][1], zc0 + h / 2], info: { nombre: `Celda ${k + 1} de 23`, funcion: `Celda primaria de plata-zinc (~1.5–1.6 V). En serie con las demás forma los 36 V nominales; ${k === 0 ? 'su borne + va al bloque de salida.' : k === 22 ? 'su borne − va al bloque de salida.' : 'se une a sus vecinas con conectores entre celdas.'}` } }));
  instancias(U, g, `${nom}_Celdas`, new THREE.BoxGeometry(cx - 0.18, cyp - 0.12, h), M.celda, sub, id,
    m('documentado', `${HB} §6.2, tabla 6-I`, '23 celdas de plata-zinc en serie: 36 V nominales, 121 Ah. Disposición 4 × 6 dentro de la caja: inferida.'), celdas);
  const bornes = [];
  celdas.forEach((c, k) => { for (const s of [-1, 1]) bornes.push({ pos: [c.pos[0] + s * 0.75, c.pos[1], zc0 + h + 0.2], info: { nombre: `Borne ${s > 0 ? '+' : '−'} · celda ${k + 1}` } }); });
  instancias(U, g, `${nom}_Bornes_Celdas`, new THREE.CylinderGeometry(0.17, 0.17, 0.4, 8).rotateX(Math.PI / 2), M.borne, sub, id,
    m('inferido', `${HB} §6.2`, 'Bornes de cada celda.'), bornes);
  const conect = [];
  for (let k = 0; k < 22; k++) {
    const a = celdas[k].pos, b = celdas[k + 1].pos;
    conect.push(tubo([[a[0] + 0.75, a[1], zc0 + h + 0.42], [(a[0] + b[0]) / 2 + 0.75 * Math.sign(b[0] - a[0] || 1) * 0, (a[1] + b[1]) / 2, zc0 + h + 0.62], [b[0] - 0.75, b[1], zc0 + h + 0.42]], 0.22, { rc: 0.3, radial: 6 }));
  }
  pieza(U, g, `${nom}_Conectores_Entre_Celdas`, conect, M.cobre, sub, id, m('inferido', `${HB} tabla 6-I`, 'Conectores de cobre que unen las 23 celdas en serie (trazado inferido).'));
  const s0 = slots[0];
  const bl = pieza(U, g, `${nom}_Bloque_Bornes`, [caja(s0[0] - 1.2, s0[0] + 1.2, s0[1] - 0.8, s0[1] + 0.8, zc0, zc0 + 3.2, 0.15), cil([s0[0] - 0.5, s0[1], zc0 + 3.2], [s0[0] - 0.5, s0[1], zc0 + 3.8], 0.5, 10), cil([s0[0] + 0.5, s0[1], zc0 + 3.2], [s0[0] + 0.5, s0[1], zc0 + 3.8], 0.5, 10)],
    M.rele, sub, id, m('inferido', `${HB} dibujo 6.1`, 'Bloque de bornes principales (+ de la celda 1, − de la celda 23) hacia el conector del arnés.'));
  bl.userData.tipo = 'interior';
  const c1 = celdas[0].pos, c23 = celdas[22].pos;
  pieza(U, g, `${nom}_Barras_Salida`, [tubo([[c1[0] - 0.75, c1[1], zc0 + h + 0.42], [c1[0] - 0.75, c1[1], zc0 + h + 0.9], [s0[0] - 0.5, s0[1], zc0 + h + 0.9], [s0[0] - 0.5, s0[1], zc0 + 3.8]], 0.3, { rc: 0.4 }),
    tubo([[c23[0] + 0.75, c23[1], zc0 + h + 0.42], [c23[0] + 0.75, c23[1], zc0 + h + 1.05], [s0[0] + 0.5, s0[1], zc0 + h + 1.05], [s0[0] + 0.5, s0[1], zc0 + 3.8]], 0.3, { rc: 0.4 })], M.cobre, sub, id,
  m('inferido', `${HB} dibujo 6.1`, 'Barras de salida: positivo de la celda 1 y negativo de la celda 23.'));
  pieza(U, g, `${nom}_Sensor_Temperatura`, [cajaC(c23[0] - 0.2, c23[1] + sy * 0.2, zc0 + h + 0.15, 0.6, 0.4, 0.3, 0.05)], M.chip, sub, id,
    m('inferido', `${HB} §5.2.3 (indicador BATT °F)`, 'Sensor de temperatura que alimenta el indicador BATT °F de la consola; ubicación inferida.'));
  puertoInt(U, `${id}.i.borne`, g, [s0[0], s0[1], zc0 + 3.6], `${UNIDADES_ENERGIA[id].nombre} · bloque de bornes`);
}

function interiorSPU(U, M, g) {
  const [x0, x1, y0, y1, z0] = UNIDADES_ENERGIA.spu.caja, sub = 'energia', id = 'spu';
  const zc = z0 + 0.25;
  const nombres = [
    ['Tarjeta_Odometro', 'Entrada de los pulsos de odómetro de las 4 ruedas (9 por vuelta).'],
    ['Tarjeta_Rumbo', 'Convierte la señal sincro de 3 hilos de la DGU en rumbo.'],
    ['Tarjeta_Distancia', 'Integra pulsos para la distancia recorrida.'],
    ['Tarjeta_Marcacion_Alcance', 'Calcula marcación y alcance de vuelta al módulo lunar.'],
    ['Tarjeta_Indicadores', 'Excita los indicadores de navegación de la consola.'],
    ['Tarjeta_Alimentacion', 'Acondiciona la alimentación de la electrónica de navegación.'],
  ];
  const chips = [];
  nombres.forEach(([n, f], k) => {
    const x = x0 + 1.9 + k * 1.3;
    const [pl, ch] = placaConChips(y0 + 0.9, y1 - 0.9, x, zc + 0.35, zc + 3.7, 8, rnd, false);
    pieza(U, g, `SPU_${n}`, [pl], M.placa, sub, id, m('educativo', `${HB} §5.2.1`, f + ' Partición en tarjetas: reconstrucción educativa.'));
    ch.forEach((p) => chips.push({ pos: p, info: { nombre: `Circuito integrado · ${n.replace(/_/g, ' ')}` } }));
  });
  instancias(U, g, 'SPU_Circuitos', new THREE.BoxGeometry(0.22, 0.75, 0.42), M.chip, sub, id, m('educativo', `${HB} §5.2.1`, 'Componentes electrónicos (representativos).'), chips);
  pieza(U, g, 'SPU_Placa_Base', [caja(x0 + 1.0, x0 + 9.2, y0 + 0.6, y1 - 0.6, zc, zc + 0.3, 0.05), ...nombres.map((_, k) => caja(x0 + 1.75 + k * 1.3, x0 + 2.05 + k * 1.3, y0 + 0.9, y1 - 0.9, zc + 0.3, zc + 0.5, 0))], M.placa, sub, id,
    m('educativo', `${HB} §5.2.1`, 'Placa base con los zócalos de las tarjetas.'));
  // 2.25 lb de eicosano ≈ 80 in³ (densidad ≈ 0.78 g/cm³)
  const xw0 = x1 - 3.2, xw1 = x1 - 0.4;
  const aletas = []; for (let k = 0; k < 9; k++) aletas.push(caja(xw0 - 0.25, xw0, y0 + 0.8 + k * 1.3, y0 + 1.0 + k * 1.3, zc + 0.2, zc + 2.4, 0));
  pieza(U, g, 'SPU_Paquete_Cera', [caja(xw0, xw1, y0 + 0.6, y1 - 0.6, zc, zc + 2.55, 0.15), ...aletas], M.cera, sub, id,
    m('documentado', `${HB} §6.2`, 'Paquete de cera de eicosano (2.25 lb): absorbe calor fundiéndose durante la EVA. Volumen estimado con la masa documentada (~80 in³).'));
  pieza(U, g, 'SPU_Conector', [caja(x0 + 0.25, x0 + 0.9, 6.0, 12.4, zc + 1.6, zc + 3.4, 0.1)], M.rele, sub, id, m('inferido', HB, 'Conectores de la SPU (consola, DGU, odómetros, SEP).'));
}

function interiorDGU(U, M, g) {
  const [x0, x1, y0, y1, z0] = UNIDADES_ENERGIA.dgu.caja, sub = 'energia', id = 'dgu';
  const c = [(x0 + x1) / 2, (y0 + y1) / 2, z0 + 2.8];
  const marco = new THREE.Group(); marco.name = 'DGU_Cardan_Exterior'; marco.position.set(...c); g.add(marco); U.nodos.DGU_Cardan = marco;
  const anillo = (R, eje) => { const t = new THREE.TorusGeometry(R, 0.13, 8, 40); if (eje === 'x') t.rotateY(Math.PI / 2); if (eje === 'y') t.rotateX(Math.PI / 2); return t; };
  pieza(U, marco, 'DGU_Cardan', [anillo(1.95, 'z'), anillo(1.55, 'y'), cil([0, -1.95, 0], [0, -1.55, 0], 0.18, 8), cil([0, 1.55, 0], [0, 1.95, 0], 0.18, 8)], M.engranaje, sub, id,
    m('inferido', `${HB} §7.2`, 'Cardanes del giróscopo direccional (dos ejes); disposición inferida.'));
  pieza(U, marco, 'DGU_Rotor', [cil([-0.45, 0, 0], [0.45, 0, 0], 2.3, 32), cil([-1.5, 0, 0], [1.5, 0, 0], 0.22, 8)], M.rotor, sub, id,
    m('inferido', `${HB} §7.2`, 'Rotor del giróscopo (eje de giro horizontal): mantiene su orientación y da la referencia de rumbo.'));
  pieza(U, g, 'DGU_Sincro', [cil([c[0], c[1], z0 + 0.25], [c[0], c[1], z0 + 1.5], 1.1, 20), cil([c[0], c[1], z0 + 1.5], [c[0], c[1], c[2] - 1.9], 0.3, 8)], M.rele, sub, id,
    m('documentado', `${HB} §7.2`, 'Transmisor sincro: entrega el rumbo a la SPU por 3 hilos.'));
  pieza(U, g, 'DGU_Torquer', [cil([c[0], c[1], c[2] + 1.9], [c[0], c[1], z0 + 4.4], 0.3, 8), cil([c[0], c[1], z0 + 4.3], [c[0], c[1], z0 + 4.95], 1.0, 16)], M.rele, sub, id,
    m('inferido', `${HB} §7.2`, 'Motor de ajuste: alinea el giróscopo con el rumbo inicial fijado desde la consola.'));
  const [pl, ch] = placaConChips(x0 + 0.5, x1 - 0.5, y0 + 0.45, z0 + 0.6, z0 + 4.6, 8, rnd, true);
  pieza(U, g, 'DGU_Electronica', [pl], M.placa, sub, id, m('educativo', `${HB} §7.2`, 'Electrónica de excitación del rotor y del sincro (representativa).'));
  instancias(U, g, 'DGU_Circuitos', new THREE.BoxGeometry(0.75, 0.22, 0.42), M.chip, sub, id, m('educativo', HB, 'Componentes (representativos).'), ch.map((p) => ({ pos: p })));
}

function interiorDCE(U, M, g) {
  const [x0, x1, y0, y1, z0] = UNIDADES_ENERGIA.dce.caja, sub = 'energia', id = 'dce';
  const zc = z0 + 0.25, zw = zc + 1.87;
  // 3.5 lb de octadecano ≈ 124 in³
  pieza(U, g, 'DCE_Paquete_Cera', [caja(x0 + 0.25, x1 - 0.25, y0 + 0.25, y1 - 0.25, zc, zw, 0.15)], M.cera, sub, id,
    m('documentado', `${HB} §6.2`, 'Paquete de cera de octadecano (3.5 lb) bajo el disipador: almacena el calor de la electrónica de potencia. Volumen estimado con la masa documentada.'));
  pieza(U, g, 'DCE_Disipador', [caja(x0 + 0.25, x1 - 0.25, y0 + 0.25, y1 - 0.25, zw, zw + 0.18, 0.05)], M.disipador, sub, id,
    m('inferido', HB, 'Placa disipadora sobre la cera.'));
  const etapas = { LF: [33.6, -2.6], LR: [31.0, -3.6], RF: [33.6, -11.2], RR: [31.0, -10.2] };
  const latas = [];
  for (const [t, [x, y]] of Object.entries(etapas)) {
    pieza(U, g, `DCE_Etapa_Potencia_${t}`, [caja(x - 1.0, x + 1.0, y - 0.8, y + 0.8, zw + 0.18, zw + 0.85, 0.1)], M.rele, sub, id,
      m('documentado', `${HB} §4.6`, `Etapa de potencia del motor ${t}: transistores conmutados por el PWM, con límite de corriente. Forma y ubicación inferidas.`));
    for (const dx of [-0.5, 0.5]) latas.push({ pos: [x + dx, y, zw + 1.05], info: { nombre: `Transistor de potencia · ${t}` } });
  }
  instancias(U, g, 'DCE_Transistores', new THREE.CylinderGeometry(0.36, 0.36, 0.4, 14).rotateX(Math.PI / 2), M.borne, sub, id, m('inferido', `${HB} §4.6`, 'Transistores de potencia (encapsulado metálico representativo).'), latas);
  const reles = ['LF', 'RF', 'LR', 'RR'].map((t, k) => ({ pos: [30.3 + (k % 2) * 3.6, -6.4 - Math.floor(k / 2) * 1.2, zw + 0.75], info: { nombre: `Relé de sentido · motor ${t}`, funcion: 'Invierte la conexión del campo para marcha atrás (mando con el interruptor de reversa).' } }));
  instancias(U, g, 'DCE_Reles_Sentido', new THREE.BoxGeometry(1.0, 0.9, 1.2), M.rele, sub, id,
    m('documentado', `${HB} §4.6`, 'Relés de sentido de giro (adelante/atrás) de los motores de tracción.'), reles);
  const tarjetas = [['PWM_1', -4.75, 'Modulador de ancho de pulso n.º 1: convierte la deflexión del mando en ciclo de trabajo.'],
    ['PWM_2', -5.45, 'Modulador de ancho de pulso n.º 2 (redundante; selección PWM SEL en la consola).'],
    ['Servo_Direccion_Delantera', -8.55, 'Servo de dirección delantera: compara el mando con el potenciómetro de realimentación.'],
    ['Servo_Direccion_Trasera', -9.25, 'Servo de dirección trasera.'],
    ['Logica_Proteccion', -9.95, 'Límite de corriente e inhibición por odómetro; control de los relés.']];
  const chips = [];
  for (const [n, y, f] of tarjetas) {
    const [pl, ch] = placaConChips(x0 + 0.5, x1 - 0.5, y, zw + 1.3, zw + 2.33, 4, rnd, true);
    pieza(U, g, `DCE_Tarjeta_${n}`, [pl], M.placa, sub, id, m(n.startsWith('PWM') || n.startsWith('Servo') ? 'documentado' : 'educativo', `${HB} §4.5.2, §4.6, dibujo 4.8`, f + ' Forma y posición de la tarjeta: inferidas.'));
    ch.forEach((p) => chips.push({ pos: p, info: { nombre: `Componente · ${n.replace(/_/g, ' ')}` } }));
  }
  instancias(U, g, 'DCE_Circuitos', new THREE.BoxGeometry(0.75, 0.22, 0.42), M.chip, sub, id, m('educativo', HB, 'Componentes (representativos).'), chips);
}

function interiorConsola(U, M, g) {
  const sub = 'tripulacion', id = 'consola';
  const L = U.consolaLocal; // {xcn, zc, ang, CD, FW, FH}
  const n = new THREE.Group(); n.name = 'Consola_Marco_Local'; n.position.set(L.xcn, 0, L.zc); n.rotation.y = L.ang; g.add(n);
  const enCara = (px, py) => [-(px / 600 - 0.5) * L.FW, (0.5 - py / 720) * L.FH];
  const BUS = { 1: 'A', 2: 'C', 3: 'B', 4: 'D' };
  const fn = {
    1: 'Batería 1 → bus A.', 2: 'Batería 2 → bus C.', 3: 'Batería 1 → bus B.', 4: 'Batería 2 → bus D.',
    5: 'Tracción LF (bus A o C).', 6: 'Tracción RF (bus A o C).', 7: 'Tracción LR (bus B o D).', 8: 'Tracción RR (bus B o D).',
    9: 'Dirección delantera (bus A o C).', 10: 'Dirección trasera (bus B o D).', 14: 'AUX: conector auxiliar (buses A y C) para la LCRU.',
  };
  const br = [];
  for (let k = 0; k < 14; k++) {
    const [y, z] = enCara(40 + (k % 7) * 80, 580 + Math.floor(k / 7) * 64);
    br.push({ pos: [-L.CD / 2 + 1.2, y, z], rot: [0, 0, Math.PI / 2], info: { nombre: `Breaker CB${k + 1}`, funcion: fn[k + 1] || 'Protección de un circuito de navegación o instrumentos (asignación no detallada aquí).' } });
  }
  instancias(U, n, 'Consola_Breakers', new THREE.CylinderGeometry(0.42, 0.42, 1.8, 14), M.rele, sub, id,
    m('documentado', `${HB} §5.2.3`, '14 interruptores automáticos (CB1–CB14) que protegen y seleccionan la alimentación de cada carga.'), br);
  ['A', 'B', 'C', 'D'].forEach((b, k) => {
    const z = -L.FH / 2 + 0.6 + k * 0.55;
    pieza(U, n, `Consola_Bus_${b}`, [caja(-L.CD / 2 + 2.3, -L.CD / 2 + 2.6, -L.FW / 2 + 0.6, L.FW / 2 - 0.6, z, z + 0.32, 0.04)], M.bus[b], sub, id,
      m('documentado', `${HB} §5.2.3`, `Bus ${b}: ${b === 'A' || b === 'B' ? 'alimentado por la batería 1' : 'alimentado por la batería 2'} (CB${{ A: 1, B: 3, C: 2, D: 4 }[b]}). Cada carga se conecta a un bus u otro con su selector: las baterías nunca quedan en serie. Barra colectora representativa.`));
  });
  pieza(U, n, 'Consola_Tarjeta_Navegacion', [caja(-L.CD / 2 + 1.0, -L.CD / 2 + 1.1, -L.FW / 2 + 0.6, L.FW / 2 - 0.6, 0.6, L.FH / 2 - 0.6, 0.02)], M.placa, sub, id,
    m('educativo', `${HB} §5.2.1`, 'Detrás del panel de navegación: indicadores de actitud, rumbo (IPI), marcación, alcance y distancia, excitados por la SPU.'));
  pieza(U, n, 'Consola_Haz_Entrada', [tubo([[-L.CD / 2 + 2.0, 0, -L.FH / 2 + 0.6], [0, 0, -L.FH / 2 + 0.3], [0, 0, -L.FH / 2 - 2.0]], 1.0, { rc: 0.8 })], M.chip, sub, id,
    m('inferido', HB, 'Haz de cables que baja por el poste hacia baterías, DCE, SPU y AUX.'));
}

function interiorLCRU(U, M, g) {
  const sub = 'comunicaciones', id = 'lcru';
  const [xL0, xL1, , , zL0] = U.carcasas.lcru.caja, z0 = zL0 + 0.25;
  const mod = (n, x0, x1, y0, y1, h, f, ev = 'documentado', mat = M.modulo) => pieza(U, g, `LCRU_${n}`, [caja(x0, x1, y0, y1, z0, z0 + h, 0.15)], mat, sub, id, m(ev, `${LC} §1.3`, f));
  // batería interna: 19 celdas Ag-Zn, 29 V (toma de 16.8 V), 400 Wh (HSI-481184 p. 9), bajo la puerta de acceso
  const celdas = [];
  for (let k = 0; k < 19; k++) celdas.push({ pos: [xL0 + 1.6 + (k % 4) * 1.3, -10.0 + Math.floor(k / 4) * 1.35, z0 + 2.1], info: { nombre: `Celda ${k + 1} de 19 (batería interna)` } });
  instancias(U, g, 'LCRU_Bateria_Celdas', new THREE.BoxGeometry(1.15, 1.2, 4.2), M.celda, sub, id,
    m('documentado', `${LC} p. 9`, 'Batería interna de plata-zinc, 19 celdas: 29 V con toma de 16.8 V, 400 Wh. Permite operar la LCRU sin el rover (selector INT). Disposición inferida.'), celdas);
  mod('Selector_INT_EXT', xL0 + 7.6, xL0 + 10.6, 8.3, 10.7, 3.6, 'Selector de alimentación INT / EXT / OFF (batería interna o 32–44 V del rover).', 'documentado', M.rele);
  mod('Convertidor_CC_CC', xL0 + 6.6, xL0 + 10.4, -10.5, -6.3, 3.4, 'Convertidor CC-CC: de 32–44 V del rover a 28.5 V y 16.5 V.');
  mod('Regulador', xL0 + 10.8, xL1 - 0.4, -10.5, -6.3, 3.0, 'Regulador de baja tensión redundante: toma el bus de 16 V y entrega 14 y 10 V regulados.');
  mod('Transceptor_VHF', xL0 + 0.4, xL0 + 5.0, 3.4, 8.6, 4.2, 'Transmisor VHF AM y receptor VHF: voz con los astronautas, que la LCRU retransmite a la Tierra.');
  mod('Triplexor_VHF', xL0 + 0.4, xL0 + 3.0, 8.8, 10.7, 2.4, 'Triplexor del grupo VHF: comparte la antena omnidireccional entre transmisión y recepción.');
  mod('Transceptor_Banda_S_1', xL0 + 6.6, xL0 + 10.6, -5.8, -0.3, 4.4, 'Transceptor de banda S n.º 1: transmisor PM/PM y receptor PM, acoplado a la LGA por su diplexor (voz y datos en marcha).');
  mod('Transceptor_Banda_S_2', xL0 + 6.6, xL0 + 10.6, 0.3, 5.8, 4.4, 'Transceptor de banda S n.º 2: transmisor FM/PM y receptor PM, acoplado a la HGA por su diplexor (televisión y comandos de 70 kHz).');
  mod('Procesador_Bajada_DLSP', xL0 + 10.9, xL1 - 0.4, -5.8, -2.4, 4.3, 'Procesador de bajada: interfaz entre el receptor VHF y el transmisor de banda S elegido; acondiciona la banda base (en FM/TV la voz viaja en una subportadora de 1.25 MHz junto al video).');
  mod('Procesador_Subida_ULSP', xL0 + 10.9, xL1 - 0.4, -2.1, 1.6, 4.3, 'Procesador de subida: interfaz entre el receptor de banda S y el transmisor VHF (voz de Houston a los astronautas).');
  mod('Diplexor_LGA', xL0 + 11.4, xL1 - 0.4, 2.2, 5.6, 2.6, 'Diplexor del transceptor n.º 1: transmite y recibe por la misma antena (LGA).');
  mod('Diplexor_HGA', xL0 + 11.4, xL1 - 0.4, 6.0, 9.6, 2.6, 'Diplexor del transceptor n.º 2 (HGA).');
  // paquetes de cera documentados: bajo el radiador y entre el compartimento electrónico y la batería (el tercero, exterior, no se modela)
  // va pegado bajo el radiador del techo: viaja con la tapa cuando se abre (marco de la tapa: origen en la bisagra xL1, zL1 − 0.25)
  const tp = U.carcasas.lcru.tapa, zt = tp.userData.posBase ? tp.userData.posBase.z : tp.position.z;
  pieza(U, tp, 'LCRU_Cera_Radiador', [caja(xL0 + 2.0 - xL1, -2.0, -7.0, 7.0, zL0 + 4.8 - zt, zL0 + 5.55 - zt, 0.1)], M.cera, sub, id,
    m('documentado', `${LC} (control térmico)`, 'Paquete de cera bajo el radiador del techo: absorbe el calor de los equipos al fundirse. Espesor y extensión inferidos.'));
  pieza(U, g, 'LCRU_Cera_Bateria', [caja(xL0 + 6.15, xL0 + 6.5, -10.5, -4.0, z0, z0 + 4.2, 0.05)], M.cera, sub, id,
    m('documentado', `${LC} (control térmico)`, 'Paquete de cera entre el compartimento electrónico presurizado y la batería. Forma inferida.'));
  pieza(U, g, 'LCRU_Coaxiales_Internos', [tubo([[xL1 - 2.0, 7.8, z0 + 2.6], [xL1 - 2.4, 9.8, z0 + 3.4], [xL0 + 13.6, 10.6, zL0 + 4.6]], 0.3, { rc: 0.5 }),
    tubo([[xL1 - 2.0, 3.9, z0 + 2.6], [xL1 - 2.6, 9.6, z0 + 2.9], [xL0 + 13.6, 10.6, zL0 + 3.4]], 0.3, { rc: 0.5 })], M.cobre, sub, id,
  m('inferido', LC, 'Coaxiales internos de los diplexores a los conectores HGA (rojo) y LGA (azul).'));
  puertoInt(U, 'lcru.i.bateria', g, [xL0 + 4.0, -6.0, z0 + 4.4], 'LCRU · batería interna');
  puertoInt(U, 'lcru.i.selector', g, [xL0 + 9.1, 8.3, z0 + 2.0], 'LCRU · selector INT/EXT');
  puertoInt(U, 'lcru.i.entradaExt', g, [xL0 + 13.4, 10.4, zL0 + 2.2], 'LCRU · entrada de potencia externa');
  puertoInt(U, 'lcru.i.dcdc', g, [xL0 + 8.5, -6.3, z0 + 2.0], 'LCRU · convertidor CC-CC');
  puertoInt(U, 'lcru.i.regulador', g, [xL0 + 13.0, -6.3, z0 + 2.0], 'LCRU · regulador');
  puertoInt(U, 'lcru.i.sband1', g, [xL0 + 8.6, -3.0, z0 + 4.5], 'LCRU · transceptor banda S n.º 1');
  puertoInt(U, 'lcru.i.dlsp', g, [xL0 + 10.9, -4.0, z0 + 3.0], 'LCRU · DLSP');
  puertoInt(U, 'lcru.i.sband2', g, [xL0 + 10.6, 3.0, z0 + 3.0], 'LCRU · transceptor banda S n.º 2');
  puertoInt(U, 'lcru.i.diplexor2', g, [xL0 + 12.6, 7.8, z0 + 2.6], 'LCRU · diplexor HGA');
  puertoInt(U, 'lcru.i.puertoHga', g, [xL0 + 13.6, 10.7, zL0 + 4.6], 'LCRU · conector HGA (interior)');
}

function interiorCTV(U, M, g) {
  const sub = 'comunicaciones', id = 'ctv', GD = (f, ev = 'documentado', ref = '') => m(ev, `${GC}${ref}`, f);
  // eje óptico = +X (marco de inclinación), y = 0, z = 0
  pieza(U, g, 'CTV_Zoom_Barril', [cil([3.2, 0, 0], [7.3, 0, 0], 2.7, 28)], M.chip, sub, id, GD('Barril del zoom Angenieux 6:1 (12.5–75 mm, f/2.2).', 'documentado', ' p. 1-1'));
  pieza(U, g, 'CTV_Grupos_Zoom', [4.0, 5.3, 6.5].map((x, k) => cil([x - 0.06 - k * 0.02, 0, 0], [x + 0.06 + k * 0.02, 0, 0], 2.3 - k * 0.15, 28)), M.vidrio, sub, id,
    GD('Grupos ópticos móviles del zoom (cambian la distancia focal por comando desde Houston).', 'inferido', ' p. 1-1'));
  pieza(U, g, 'CTV_Motor_Zoom', [cil([4.0, 2.25, -1.2], [5.6, 2.25, -1.2], 0.9, 14)], M.rele, sub, id, GD('Motor del zoom (comandado por la subportadora de 70 kHz).', 'inferido'));
  pieza(U, g, 'CTV_Iris', [new THREE.RingGeometry(0.45, 1.25, 24).rotateY(Math.PI / 2).translate(2.9, 0, 0), cil([2.85, 0, 0], [2.95, 0, 0], 2.7, 24, true)], M.chip, sub, id,
    GD('Diafragma (iris) con control automático y manual remoto.', 'inferido'));
  // rueda de filtros: el eje de giro es paralelo al óptico y está desplazado; una ventana queda en el eje
  const rueda = new THREE.Group(); rueda.name = 'CTV_Rueda_Filtros_Eje'; rueda.position.set(1.8, -1.0, -0.45); g.add(rueda); U.ruedaFiltros = rueda;
  const rf = Math.hypot(1.0, 0.45), a0 = Math.atan2(0.45, 1.0);
  pieza(U, rueda, 'CTV_Rueda_Filtros', [new THREE.CylinderGeometry(1.35, 1.35, 0.08, 36).rotateZ(Math.PI / 2)], M.engranaje, sub, id,
    GD('Rueda de filtros de color en el camino óptico: la cámara es de color secuencial por campos (rojo, verde, azul). Giro mostrado lento con fines didácticos.', 'documentado', ' p. 1-1'));
  const vent = (k, mat, nom) => pieza(U, rueda, `CTV_Filtro_${nom}_${k}`, [new THREE.CylinderGeometry(0.25, 0.25, 0.1, 18).rotateZ(Math.PI / 2).translate(0.01, rf * Math.cos(a0 + k * Math.PI / 3), rf * Math.sin(a0 + k * Math.PI / 3))], mat, sub, id,
    GD(`Segmento de filtro ${nom.toLowerCase()} de la rueda (número de segmentos inferido).`, 'inferido'));
  [[M.filtroR, 'Rojo'], [M.filtroV, 'Verde'], [M.filtroA, 'Azul']].forEach(([mat, nom], j) => { vent(j, mat, nom); vent(j + 3, mat, nom); });
  pieza(U, g, 'CTV_Motor_Rueda', [cil([1.88, -1.0, -0.45], [2.7, -1.0, -0.45], 0.8, 14)], M.rele, sub, id, GD('Motor sincronizado que gira la rueda de filtros con la exploración de video.', 'inferido'));
  pieza(U, g, 'CTV_Tubo_SIT', [cil([-7.8, 0, 0], [0.9, 0, 0], 1.7, 28), cil([-9.4, 0, 0], [-7.8, 0, 0], 1.0, 18), cil([0.9, 0, 0], [1.0, 0, 0], 1.55, 28)], M.tubo, sub, id,
    GD('Tubo SIT (silicon intensifier target) de 16 mm: fotocátodo, sección intensificadora y blanco de silicio; muy sensible a poca luz.', 'documentado', ' p. 1-1'));
  pieza(U, g, 'CTV_Yugo_Deflexion', [cil([-6.4, 0, 0], [-1.6, 0, 0], 2.55, 28, true), cil([-6.4, 0, 0], [-1.6, 0, 0], 2.4, 28, true)], M.cobre, sub, id,
    GD('Bobinas de enfoque y deflexión que exploran el blanco del tubo.', 'inferido'));
  pieza(U, g, 'CTV_Fuente_Baja_Tension', [caja(-10.1, -7.8, -2.9, -1.2, -1.7, 0.6, 0.12)], M.rele, sub, id, GD('Fuente de baja tensión: alimentada con 29 V de la LCRU a través de la TCU.', 'documentado', ' p. 1-4'));
  pieza(U, g, 'CTV_Modulo_Alta_Tension', [caja(-10.1, -7.8, 1.2, 2.9, -1.7, 0.6, 0.12)], M.altaTension, sub, id, GD('Módulo de alta tensión: 3 a 9 kV para el tubo SIT (encapsulado).', 'documentado', ' p. 1-33'));
  pieza(U, g, 'CTV_Preamplificador', [caja(-8.9, -6.9, -0.9, 0.9, 1.1, 1.75, 0.08)], M.placa, sub, id, GD('Preamplificador FET de bajo ruido, ALC/AGC, gamma ≈0.7 y corrección de apertura.', 'documentado', ' p. 1-22 a 1-27'));
  const chips = [];
  for (const s of [1, -1]) {
    const [pl, ch] = placaConChips(-6.8, 2.4, s * 2.9, -1.6, 1.6, 8, rnd, true);
    pieza(U, g, `CTV_Tarjeta_${s > 0 ? 'Sincronismo' : 'Video'}`, [pl], M.placa, sub, id,
      GD(s > 0 ? 'Generador de sincronismo y control de la rueda de filtros.' : 'Procesamiento de video compuesto hacia la LCRU.', 'educativo'));
    ch.forEach((p) => chips.push({ pos: [p[0], s > 0 ? s * 2.75 : s * 2.75, p[2]] }));
  }
  instancias(U, g, 'CTV_Circuitos', new THREE.BoxGeometry(0.75, 0.22, 0.42), M.chip, sub, id, m('educativo', GC, 'Componentes (representativos).'), chips);
  puertoInt(U, 'ctv.i.fuente', g, [-7.8, -2.0, 0.2], 'CTV · fuente de baja tensión');
  puertoInt(U, 'ctv.i.alta', g, [-7.8, 2.0, 0.2], 'CTV · módulo de alta tensión');
  puertoInt(U, 'ctv.i.sit', g, [-9.4, 0, 0], 'CTV · salida del blanco del tubo SIT');
  puertoInt(U, 'ctv.i.preamp', g, [-8.9, 0, 1.4], 'CTV · preamplificador');
}

function interiorTCU(U, M, g) {
  const sub = 'comunicaciones', id = 'tcu', [xT, yT, zCaja1, zTCU1] = U.carcasas.tcu.posTCU, [, , , , zCaja0] = U.carcasas.tcu.caja;
  const GD = (f, ev = 'documentado', ref = ' p. 1-51') => m(ev, `${GC}${ref}`, f);
  const xm = xT + 1.95;
  pieza(U, g, 'TCU_Motor_Acimut', [cil([xm, yT, zCaja1 + 0.4], [xm, yT, zCaja1 + 4.6], 1.4, 18)], M.rele, sub, id, GD('Motor de acimut (pan).'));
  pieza(U, g, 'TCU_Reductor_487', [cil([xm, yT, zCaja1 + 4.6], [xm, yT, zCaja1 + 7.0], 1.3, 18)], M.engranaje, sub, id, GD('Reductor 487:1 acoplado al motor de acimut.'));
  pieza(U, g, 'TCU_Pinon', [cil([xm, yT, zCaja1 + 7.0], [xm, yT, zCaja1 + 7.6], 0.9, 12)], M.engranaje, sub, id, GD('Piñón de la etapa de engranajes rectos 3.64:1.'));
  const pan = U.gcta.pan, zr = zCaja1 + 7.3 - zTCU1;
  const corona = new THREE.CylinderGeometry(1.45, 1.45, 0.6, 48).rotateX(Math.PI / 2).translate(0, 0, zr);
  const dientes = []; for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; dientes.push(cajaC(1.5 * Math.cos(a), 1.5 * Math.sin(a), zr, 0.14, 0.14, 0.6, 0)); }
  pieza(U, pan, 'TCU_Corona_Acimut', [corona, ...dientes, cil([0, 0, zCaja1 + 0.4 - zTCU1], [0, 0, 0], 0.7, 14)], M.engranaje, sub, id,
    GD('Corona y eje de acimut: giran con la cámara (3.64 × 487 ≈ 1773:1 entre motor y cámara; 3.03°/s).'));
  pieza(U, g, 'TCU_Decodificador_Comandos', [caja(xT - 2.6, xT + 2.6, yT + 2.9, yT + 3.0, zCaja0 + 0.6, zCaja0 + 6.0, 0)], M.placa, sub, id,
    GD('Decodificador de comandos: demodula la subportadora de 70 kHz (pan, tilt, zoom, iris, potencia).', 'documentado', ' p. 1-4'));
  pieza(U, g, 'TCU_Fuente', [caja(xT - 2.5, xT + 0.5, yT - 3.8, yT - 1.2, zCaja0 + 0.5, zCaja0 + 3.2, 0.12)], M.rele, sub, id, GD('Acondicionamiento de los +29 V de la LCRU.', 'inferido', ' p. 1-4'));
  pieza(U, g, 'TCU_Interruptores_Limite', [cajaC(xT - 2.0, yT + 1.6, zCaja1 + 0.8, 0.6, 0.5, 0.5, 0.05), cajaC(xT - 2.0, yT - 1.6, zCaja1 + 0.8, 0.6, 0.5, 0.5, 0.05)], M.chip, sub, id,
    GD('Topes de recorrido del acimut (134° a la izquierda, 214° a la derecha).', 'inferido', ' p. 1-39'));
}

// =============================================================================
const CONSTRUCTORES = { bat1: (U, M, g) => interiorBateria(U, M, 'bat1', g), bat2: (U, M, g) => interiorBateria(U, M, 'bat2', g), spu: interiorSPU, dgu: interiorDGU, dce: interiorDCE,
  consola: interiorConsola, lcru: interiorLCRU, ctv: interiorCTV, tcu: interiorTCU };

/** Construye (una sola vez) y devuelve el grupo interior de una unidad. Queda oculto. */
export function construirInterior(raiz, id) {
  const U = raiz.userData;
  U.interiores = U.interiores || {};
  if (U.interiores[id]) return U.interiores[id];
  if (!CONSTRUCTORES[id]) throw new Error(`Interior desconocido: ${id}`);
  const M = materiales(U);
  const c = U.carcasas[id];
  const padre = id === 'consola' ? U.grupos.tripulacion : c.grupo;
  const g = new THREE.Group(); g.name = `Interior_${id}`; g.visible = false; g.userData = { interior: id, subsistema: INTERIORES[id].subsistema };
  padre.add(g);
  _semilla = 1 + Object.keys(CONSTRUCTORES).indexOf(id) * 977;
  CONSTRUCTORES[id](U, M, g);
  // clipping del visor (si hay corte activo, los materiales nuevos también cortan)
  if (U.planosCorte) g.traverse((o) => { if (o.material && !o.material.clippingPlanes) o.material.clippingPlanes = U.planosCorte; });
  const regs = CONEXIONES_INTERIORES.filter((k) => U.puertos.has(k.origen) && U.puertos.has(k.destino) && !(U.cables || []).some((x) => x.c.id === k.id))
    .map((k) => ({ ...k, padre: () => g, anclarEn: () => g, escalaRadio: 0.6 }));
  if (regs.length) crearCables(raiz, regs);
  U.interiores[id] = g;
  return g;
}

/** Muestra u oculta el interior (lo construye si hace falta). */
export function mostrarInterior(raiz, id, visible = true) {
  const g = visible ? construirInterior(raiz, id) : (raiz.userData.interiores || {})[id];
  if (g) g.visible = visible;
  return g;
}

/**
 * Apertura virtual 0…1: primero se abre la cubierta antipolvo (si existe), después se separa la tapa.
 * Se compone con la explosión (claves distintas en desplazarLRV3). Devuelve las mallas de carcasa
 * que el visor debe mostrar en «fantasma» cuando la unidad no tiene tapa (consola, TCU).
 */
export function abrirUnidad(raiz, id, f) {
  const U = raiz.userData, c = U.carcasas[id], cat = INTERIORES[id];
  U.aperturas = U.aperturas || {};
  U.aperturas[id] = f;
  const f1 = THREE.MathUtils.clamp(c && c.cubierta ? f * 2 : 0, 0, 1), f2 = THREE.MathUtils.clamp(c && c.cubierta ? f * 2 - 1 : f, 0, 1);
  const suave = (t) => t * t * (3 - 2 * t);
  if (c && c.cubierta) c.cubierta.rotation.y = THREE.MathUtils.degToRad(105) * suave(f1);
  if (c && c.tapa) {
    const v = cat.apertura || c.apertura || [0, 0, 7];
    const s1 = suave(THREE.MathUtils.clamp(f2 * 2, 0, 1)), s2 = suave(THREE.MathUtils.clamp(f2 * 2 - 1, 0, 1));
    desplazarLRV3(c.tapa, 'apertura', f2 > 0 ? new THREE.Vector3(v[0] * s2, v[1] * s2, v[2] * s1) : null);
  }
  actualizarCables(raiz);
  return (cat.carcasa || []).map((n) => U.piezas.get(n)).filter(Boolean);
}

export function listarInteriores() { return Object.entries(INTERIORES).map(([id, v]) => ({ id, nombre: v.nombre, subsistema: v.subsistema })); }
