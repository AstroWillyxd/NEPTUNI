// =============================================================================
// LRV-3 Apollo 17 · Registro de conexiones (arneses, coaxiales, cables mecánicos
// y correas térmicas) y su geometría dinámica.
// NEPTUNI Arqueología Espacial
//
// Cada entrada tiene origen y destino (PUERTOS creados por el modelo), tipo de enlace,
// ruta (puntos de paso en pulgadas, marco del chasis), función y nivel de evidencia.
// La FUNCIÓN de cada enlace está documentada en la fuente indicada; el RECORRIDO físico
// de los arneses es casi siempre una inferencia (los dibujos de arneses no están en las
// fuentes consultadas). No se inventan designaciones de conectores (J/P) históricas.
//
// La geometría reutiliza sus búferes: al mover articulaciones o separar conjuntos sólo se
// reescriben posiciones/normales (no se crean geometrías nuevas por fotograma).
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';

export const TIPOS_ENLACE = {
  potencia: { nombre: 'Potencia 36 V CC', color: 0xffa640, radio: 0.32 },
  senal:    { nombre: 'Señal / control', color: 0x56c8ff, radio: 0.2 },
  video:    { nombre: 'Video + comandos + 29 V', color: 0x8ef07d, radio: 0.3 },
  rf:       { nombre: 'Radiofrecuencia (coaxial)', color: 0xff6fe0, radio: 0.22 },
  mecanico: { nombre: 'Cable mecánico de freno', color: 0xe6e6e6, radio: 0.12 },
  termico:  { nombre: 'Correa térmica (foil)', color: 0xffcf5a, radio: 0.28 },
};

const HB = 'MSC-07464 (LRV-3 Systems Handbook)';
const OPS = 'LS006-002-2H (LRV Operations Handbook)';
const LC = 'HSI-481184 (LCRU Crew Training Manual)';
const GC = 'GCTA Manual (RCA)';
const SEP = 'NASA-CR-141724 (SEP)';

/**
 * Registro histórico de enlaces exteriores. `ruta` = puntos de paso [x, y, z] en pulgadas
 * (X adelante, Y izquierda, Z arriba), anclados a la estructura del chasis.
 * `colgar` (pulgadas) añade comba cerca de extremos móviles (dirección, suspensión, pan-tilt).
 */
export const CONEXIONES = [
  // ---------------- energía y distribución ----------------
  // Haz central: sale entre las baterías, corre por el canal libre entre SPU y DCE y sobre el larguero central
  // hasta la base del poste de la consola (donde están los breakers).
  { id: 'C01', nombre: 'Arnés batería 1 → consola (buses A y B)', tipo: 'potencia', subsistema: 'energia',
    origen: 'bat1.salida', destino: 'consola.bat1', ruta: [[42.1, 1.0, 22.2], [41.4, 0.35, 20.9], [30.6, 0.35, 20.9], [28.6, 0.35, 20.35], [13.2, 0.35, 20.35], [12.3, 0.9, 21.2]], colgar: 0,
    funcion: 'La batería 1 alimenta el bus A por CB1 y el bus B por CB3 (los breakers están en la consola).',
    evidencia: 'documentado', fuente: `${HB} §5.2.3, §6.3, dibujo 6.2`, nota: 'recorrido del arnés inferido' },
  { id: 'C02', nombre: 'Arnés batería 2 → consola (buses C y D)', tipo: 'potencia', subsistema: 'energia',
    origen: 'bat2.salida', destino: 'consola.bat2', ruta: [[42.1, -1.0, 22.2], [41.4, -0.35, 20.9], [30.6, -0.35, 20.9], [28.6, -0.35, 20.35], [13.2, -0.35, 20.35], [12.3, -0.9, 21.2]], colgar: 0,
    funcion: 'La batería 2 alimenta el bus C por CB2 y el bus D por CB4. Las baterías NO están en serie (no forman 72 V) ni en paralelo permanente: cada carga elige bus.',
    evidencia: 'documentado', fuente: `${HB} §5.2.3, dibujo 6.2`, nota: 'recorrido inferido' },
  { id: 'C03', nombre: 'Arnés consola → DCE (buses A–D a tracción y dirección)', tipo: 'potencia', subsistema: 'energia',
    origen: 'consola.buses', destino: 'dce.entrada', ruta: [[12.4, -0.6, 21.8], [13.4, -0.1, 20.95], [27.8, -0.1, 20.95], [28.7, -2.5, 21.5], [28.7, -5.0, 22.9]], colgar: 0,
    funcion: 'LF/RF desde bus A o C (CB5, CB6), LR/RR desde bus B o D (CB7, CB8); dirección delantera A o C (CB9), trasera B o D (CB10).',
    evidencia: 'documentado', fuente: `${HB} §5.2.3`, nota: 'un solo haz representa los circuitos; recorrido inferido' },
  // Arneses de tracción: bajan por la cara inferior de la DCE, corren bajo el chasis, pasan entre el larguero
  // y la barra de torsión inferior y suben junto al brazo superior hasta el motor.
  { id: 'C04', nombre: 'DCE → motor de tracción delantero izquierdo (LF)', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.LF', destino: 'motor.DI', ruta: [[33.6, -2.4, 18.0], [34.0, -1.6, 16.2], [34.6, 1.5, 15.8], [39.4, 10.5, 15.9], [41.8, 13.0, 16.4], [42.6, 14.5, 16.62], [43.0, 15.8, 16.7], [43.0, 15.8, 21.4], [43.6, 22.5, 21.0]], colgar: [0.3, 0.9],
    funcion: 'PWM 1 o 2 modula los 36 V hacia el motor (CC serie, escobillas); vuelven los 9 pulsos/vuelta del odómetro.',
    evidencia: 'documentado', fuente: `${HB} §4.4, §4.6, dibujo 4.8`, nota: 'recorrido inferido' },
  { id: 'C05', nombre: 'DCE → motor de tracción delantero derecho (RF)', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.RF', destino: 'motor.DD', ruta: [[33.6, -11.4, 18.0], [34.0, -11.6, 15.9], [39.4, -11.8, 15.9], [41.8, -13.0, 16.4], [42.6, -14.5, 16.62], [43.0, -15.8, 16.7], [43.0, -15.8, 21.4], [43.6, -22.5, 21.0]], colgar: [0.3, 0.9],
    funcion: 'Potencia PWM al motor RF y pulsos del odómetro de vuelta.', evidencia: 'documentado', fuente: `${HB} §4.4, §4.6`, nota: 'recorrido inferido' },
  { id: 'C06', nombre: 'DCE → motor de tracción trasero izquierdo (LR)', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.LR', destino: 'motor.TI', ruta: [[31.5, -3.4, 18.0], [31.0, -2.6, 16.2], [29.0, 2.0, 15.7], [22.0, 11.5, 15.7], [-30.0, 11.5, 15.7], [-38.5, 11.8, 15.8], [-41.8, 13.0, 16.4], [-42.6, 14.5, 16.62], [-46.0, 15.8, 16.7], [-46.0, 15.8, 21.4], [-46.0, 22.5, 21.0]], colgar: [0.3, 0.9],
    funcion: 'Potencia PWM al motor LR y pulsos del odómetro.', evidencia: 'documentado', fuente: `${HB} §4.4, §4.6`, nota: 'recorrido inferido bajo el piso izquierdo' },
  { id: 'C07', nombre: 'DCE → motor de tracción trasero derecho (RR)', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.RR', destino: 'motor.TD', ruta: [[31.5, -10.4, 18.0], [31.0, -10.8, 16.2], [29.0, -11.5, 15.7], [-30.0, -11.5, 15.7], [-38.5, -11.8, 15.8], [-41.8, -13.0, 16.4], [-42.6, -14.5, 16.62], [-46.0, -15.8, 16.7], [-46.0, -15.8, 21.4], [-46.0, -22.5, 21.0]], colgar: [0.3, 0.9],
    funcion: 'Potencia PWM al motor RR y pulsos del odómetro.', evidencia: 'documentado', fuente: `${HB} §4.4, §4.6`, nota: 'recorrido inferido bajo el piso derecho' },
  { id: 'C08', nombre: 'DCE → motor de dirección delantero', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.dirDel', destino: 'dirDel.motor', ruta: [[34.0, -5.0, 18.2], [33.8, -4.5, 15.8], [44.0, 2.0, 15.5], [48.0, 6.2, 15.3], [50.6, 9.3, 14.9]], colgar: 0,
    funcion: 'Servo de dirección con potenciómetro de realimentación; corriente limitada a 1.8 A (bus A o C, CB9).',
    evidencia: 'documentado', fuente: `${HB} §4.5.2, dibujo 4.7`, nota: 'recorrido inferido' },
  { id: 'C09', nombre: 'DCE → motor de dirección trasero', tipo: 'potencia', subsistema: 'movilidad',
    origen: 'dce.dirTras', destino: 'dirTras.motor', ruta: [[31.0, -7.0, 18.2], [30.6, -6.0, 15.6], [-30.0, -4.5, 15.5], [-44.0, -4.5, 15.5], [-48.0, 6.2, 15.3], [-50.6, 9.3, 14.9]], colgar: 0,
    funcion: 'Mismo diseño que la delantera; bus B o D (CB10). Mecánicamente independiente de la delantera.',
    evidencia: 'documentado', fuente: `${HB} §4.5`, nota: 'recorrido inferido' },
  { id: 'C10', nombre: 'Controlador manual en T → DCE (acelerador, dirección, marcha atrás)', tipo: 'senal', subsistema: 'tripulacion',
    origen: 'mando.senal', destino: 'dce.mando', ruta: [[-8.25, -0.72, 26.4], [-8.25, -0.72, 20.4], [7.0, -0.75, 20.4], [8.4, -1.35, 21.15], [11.4, -1.35, 21.15], [13.4, -0.75, 20.9], [27.8, -0.75, 20.9], [28.6, -4.0, 22.0], [28.7, -8.0, 24.0]], colgar: 0,
    funcion: 'La deflexión del mango fija el ciclo de trabajo del PWM; los relés de la DCE fijan el sentido.',
    evidencia: 'documentado', fuente: `${HB} §4.6; ${OPS} §1.3.5`, nota: 'recorrido inferido' },
  { id: 'C11', nombre: 'DGU → SPU (rumbo, sincro de 3 hilos)', tipo: 'senal', subsistema: 'energia',
    origen: 'dgu.rumbo', destino: 'spu.rumbo', ruta: [[38.7, -6.4, 23.9], [38.4, -1.0, 23.9]], colgar: 0,
    funcion: 'El giróscopo direccional entrega el rumbo como transmisor sincro de tres hilos.',
    evidencia: 'documentado', fuente: `${HB} §7.2`, nota: 'recorrido inferido' },
  { id: 'C12', nombre: 'SPU → consola (rumbo, marcación, distancia, velocidad)', tipo: 'senal', subsistema: 'energia',
    origen: 'spu.consola', destino: 'consola.nav', ruta: [[28.6, 6.0, 21.0], [27.6, 0.75, 20.85], [13.4, 0.75, 20.85], [12.4, 1.2, 21.6]], colgar: 0,
    funcion: 'La SPU integra pulsos de odómetro (0.245 m/pulso) y rumbo; la consola muestra IPI, marcación, alcance y distancia.',
    evidencia: 'documentado', fuente: `${HB} §5.2.1, tabla 5-II`, nota: 'recorrido inferido' },
  // Cables de freno: bajan por el poste del apoyabrazos, atraviesan el piso y siguen el arnés de cada rueda.
  { id: 'C13', nombre: 'Cable de freno → rueda delantera izquierda', tipo: 'mecanico', subsistema: 'movilidad',
    origen: 'mando.freno', destino: 'freno.DI', ruta: [[-8.6, 0.62, 26.4], [-8.5, 0.66, 20.4], [-7.6, 1.6, 18.6], [-7.0, 1.8, 15.9], [24.0, 6.5, 15.9], [39.0, 8.0, 15.9], [43.6, 12.6, 16.35], [44.3, 14.5, 16.62], [44.6, 15.7, 16.7], [44.6, 15.7, 22.1], [45.4, 22.5, 21.8]], colgar: [0, 0.8],
    funcion: 'Freno mecánico accionado por cable desde el mando (tirar hacia atrás frena; bloqueo a 12°).',
    evidencia: 'documentado', fuente: `${HB} §4.4.3`, nota: 'recorrido inferido' },
  { id: 'C14', nombre: 'Cable de freno → rueda delantera derecha', tipo: 'mecanico', subsistema: 'movilidad',
    origen: 'mando.freno', destino: 'freno.DD', ruta: [[-8.8, -0.4, 26.4], [-8.75, -0.42, 20.4], [-7.6, -1.6, 18.6], [-7.0, -1.8, 15.9], [24.0, -6.5, 15.9], [39.0, -8.0, 15.9], [43.6, -12.6, 16.35], [44.3, -14.5, 16.62], [44.6, -15.7, 16.7], [44.6, -15.7, 22.1], [45.4, -22.5, 21.8]], colgar: [0, 0.8],
    funcion: 'Freno mecánico accionado por cable desde el mando.', evidencia: 'documentado', fuente: `${HB} §4.4.3`, nota: 'recorrido inferido' },
  { id: 'C15', nombre: 'Cable de freno → rueda trasera izquierda', tipo: 'mecanico', subsistema: 'movilidad',
    origen: 'mando.freno', destino: 'freno.TI', ruta: [[-8.45, 0.7, 26.4], [-8.35, 0.72, 20.4], [-7.4, 1.5, 18.6], [-7.2, 1.7, 15.9], [-30.0, 8.5, 15.9], [-39.0, 9.0, 15.9], [-43.4, 12.6, 16.35], [-44.0, 14.5, 16.62], [-44.4, 15.7, 16.7], [-44.4, 15.7, 22.1], [-45.4, 22.5, 21.8]], colgar: [0, 0.8],
    funcion: 'Freno mecánico accionado por cable desde el mando.', evidencia: 'documentado', fuente: `${HB} §4.4.3`, nota: 'recorrido inferido' },
  { id: 'C16', nombre: 'Cable de freno → rueda trasera derecha', tipo: 'mecanico', subsistema: 'movilidad',
    origen: 'mando.freno', destino: 'freno.TD', ruta: [[-8.65, -0.55, 26.4], [-8.6, -0.55, 20.4], [-7.4, -1.5, 18.6], [-7.2, -1.7, 15.9], [-30.0, -8.5, 15.9], [-39.0, -9.0, 15.9], [-43.4, -12.6, 16.35], [-44.0, -14.5, 16.62], [-44.4, -15.7, 16.7], [-44.4, -15.7, 22.1], [-45.4, -22.5, 21.8]], colgar: [0, 0.8],
    funcion: 'Freno mecánico accionado por cable desde el mando.', evidencia: 'documentado', fuente: `${HB} §4.4.3`, nota: 'recorrido inferido' },
  { id: 'C17', nombre: 'Correa térmica SPU – batería 1 (140 capas de foil)', tipo: 'termico', subsistema: 'energia',
    origen: 'spu.correa', destino: 'bat1.correa', ruta: [], colgar: 0.15,
    funcion: 'La batería 1 actúa como sumidero de calor parcial de la SPU.', evidencia: 'documentado', fuente: `${HB} §6.2, dibujo 3.2` },
  { id: 'C18', nombre: 'Correa térmica DGU – batería 2 (2 capas de foil)', tipo: 'termico', subsistema: 'energia',
    origen: 'dgu.correa', destino: 'bat2.correa', ruta: [], colgar: 0.15,
    funcion: 'La batería 2 es el sumidero de calor de la DGU.', evidencia: 'documentado', fuente: `${HB} §6.2, dibujo 3.2` },
  // ---------------- comunicaciones ----------------
  { id: 'C19', nombre: 'Consola (CB14 AUX) → conector auxiliar delantero', tipo: 'potencia', subsistema: 'comunicaciones',
    origen: 'consola.aux', destino: 'aux.entrada', ruta: [[12.4, 1.3, 22.4], [13.4, 0.3, 21.45], [28.0, 0.3, 21.45], [30.6, 0.0, 21.45], [54.0, 0.0, 21.45], [55.3, 1.0, 20.4], [55.3, 5.5, 20.4]], colgar: 0,
    funcion: 'AUX toma energía de ambas baterías por los buses A y C (CB14) hacia el conector delantero.',
    evidencia: 'documentado', fuente: `${HB} §5.2.3; ${OPS} §1.4.4`, nota: 'recorrido inferido' },
  { id: 'C20', nombre: 'Conector AUX → LCRU (alimentación externa)', tipo: 'potencia', subsistema: 'comunicaciones',
    origen: 'aux.salida', destino: 'lcru.potencia', ruta: [[61.0, 11.6, 19.6], [66.0, 12.7, 25.0]], colgar: 0.6,
    funcion: 'Con el selector en EXT la LCRU usa 32–44 V del rover y su convertidor CC-CC entrega 28.5 V y 16.5 V.',
    evidencia: 'documentado', fuente: `${LC} p. 8; ${OPS} §1.4.4`, nota: 'recorrido inferido' },
  { id: 'C21', nombre: 'LCRU (conector HGA, rojo) → antena de alta ganancia', tipo: 'rf', subsistema: 'comunicaciones',
    origen: 'lcru.hga', destino: 'hga.alimentador', ruta: [[66.5, 12.9, 33.2], [59.6, 13.5, 35.0], [58.75, 13.7, 40.0], [58.75, 13.7, 71.5]], colgar: [0.3, 1.2],
    funcion: 'Banda S: TV a color y voz/datos hacia la Tierra con el vehículo detenido (modo FM/TV).',
    evidencia: 'documentado', fuente: `${LC} §1.5, fig. 4-1`, nota: 'recorrido por el mástil inferido de fotos' },
  { id: 'C22', nombre: 'LCRU (conector LGA, azul) → antena de baja ganancia', tipo: 'rf', subsistema: 'comunicaciones',
    origen: 'lcru.lga', destino: 'lga.helice', ruta: [[66.0, 12.8, 30.5], [57.0, 12.6, 28.0], [42.0, 12.4, 27.6], [30.0, 12.0, 27.6], [20.0, 9.5, 26.0], [8.5, 8.4, 25.0], [6.8, 7.6, 27.0], [6.8, 7.6, 31.0], [6.8, 7.6, 64.0]], colgar: [0.3, 1.0],
    funcion: 'Banda S en movimiento: voz y datos por la LGA (modo PM1), apuntada a mano a la Tierra.',
    evidencia: 'documentado', fuente: `${LC} §1.5, §4.2`, nota: 'recorrido inferido' },
  { id: 'C23', nombre: 'LCRU → antena VHF omnidireccional', tipo: 'rf', subsistema: 'comunicaciones',
    origen: 'lcru.vhf', destino: 'vhf.base', ruta: [], colgar: 0,
    funcion: 'Transceptor VHF AM: relevo de voz con los astronautas.', evidencia: 'documentado', fuente: `${LC} §1.3` },
  { id: 'C24', nombre: 'LCRU (línea GCTA) → TCU, cable en «Y»', tipo: 'video', subsistema: 'comunicaciones',
    origen: 'lcru.gcta', destino: 'tcu.entrada', ruta: [[64.0, -12.4, 26.0], [56.2, -11.3, 20.4], [57.85, -11.85, 23.0], [57.85, -11.85, 35.5]], colgar: [0.5, 0],
    funcion: 'La LCRU entrega +29 V y la subportadora de comandos de 70 kHz; la cámara devuelve video compuesto.',
    evidencia: 'documentado', fuente: `${GC} p. 1-4, 1-8`, nota: 'recorrido inferido' },
  { id: 'C25', nombre: 'TCU → cámara CTV (cable de 3.5 ft)', tipo: 'video', subsistema: 'comunicaciones',
    origen: 'tcu.camara', destino: 'ctv.entrada', ruta: [], colgar: 2.6,
    funcion: 'Video, alimentación y control entre la unidad de control (TCU) y la cámara.', evidencia: 'documentado', fuente: `${GC} p. 1-5` },
  // ---------------- ciencia ----------------
  { id: 'C30', nombre: 'Antena de 3 lazos → receptor SEP', tipo: 'senal', subsistema: 'ciencia',
    origen: 'sep.antena', destino: 'sep.entrada', ruta: [], colgar: 0.2,
    funcion: 'Tres lazos ortogonales miden las tres componentes del campo magnético.', evidencia: 'documentado', fuente: `${SEP}`, nota: 'recorrido inferido' },
  { id: 'C31', nombre: 'Receptor SEP → grabador DSEA', tipo: 'senal', subsistema: 'ciencia',
    origen: 'sep.grabador', destino: 'dsea.entrada', ruta: [], colgar: 0.4,
    funcion: 'Los datos se graban en cinta magnética; el DSEA es removible y volvió a la Tierra.', evidencia: 'documentado', fuente: `${SEP}; ALSJ a17.sta2 142:47:14` },
  { id: 'C32', nombre: 'SPU → receptor SEP (datos de navegación)', tipo: 'senal', subsistema: 'ciencia',
    origen: 'spu.sep', destino: 'sep.nav', ruta: [[31.0, 11.4, 18.0], [30.0, 11.0, 15.7], [24.0, 10.0, 15.7], [-30.0, 10.0, 15.7], [-31.4, 15.4, 16.0], [-31.4, 15.4, 20.9], [-31.4, 13.0, 21.3], [-31.4, 12.8, 27.0], [-31.6, 12.4, 30.0], [-33.6, 10.4, 33.0], [-34.6, 9.6, 38.6]], colgar: 0,
    funcion: 'El SEP registraba incrementos de marcación (10°), distancia (100 m) y pulsos del odómetro del rover.',
    evidencia: 'documentado', fuente: `${SEP}`, nota: 'que el enlace salga de la SPU y su recorrido son inferidos' },
];

// Conexiones internas (se crean al construir los interiores)
export const CONEXIONES_INTERIORES = [
  { id: 'I01', nombre: 'LCRU: batería interna 29 V → selector INT/EXT', tipo: 'potencia', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'lcru.i.bateria', destino: 'lcru.i.selector', ruta: [], colgar: 0.3,
    funcion: 'Batería primaria de plata-zinc de 19 celdas: 29 V (toma de 16.8 V), 400 Wh.', evidencia: 'documentado', fuente: `${LC} p. 9` },
  { id: 'I02', nombre: 'LCRU: entrada externa → convertidor CC-CC', tipo: 'potencia', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'lcru.i.entradaExt', destino: 'lcru.i.dcdc', ruta: [], colgar: 0.3,
    funcion: 'Acepta 32–44 V del rover; entrega 28.5 V y 16.5 V.', evidencia: 'documentado', fuente: `${LC} p. 8` },
  { id: 'I03', nombre: 'LCRU: regulador → transceptores y procesadores', tipo: 'potencia', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'lcru.i.regulador', destino: 'lcru.i.sband1', ruta: [], colgar: 0.3,
    funcion: 'Regulador de baja tensión redundante alimenta los módulos de radio y de señal.', evidencia: 'documentado', fuente: `${LC} §1.3.1.2.5`, nota: 'trazado educativo' },
  { id: 'I04', nombre: 'LCRU: procesador de bajada (DLSP) → transceptor banda S n.º 2 (FM)', tipo: 'video', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'lcru.i.dlsp', destino: 'lcru.i.sband2', ruta: [], colgar: 0.2,
    funcion: 'Combina video de la GCTA con la subportadora de voz de 1.25 MHz para el transmisor FM.', evidencia: 'documentado', fuente: `${LC} §1.3`, nota: 'trazado educativo' },
  { id: 'I05', nombre: 'LCRU: diplexor → conector HGA', tipo: 'rf', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'lcru.i.diplexor2', destino: 'lcru.i.puertoHga', ruta: [], colgar: 0.2,
    funcion: 'Separa transmisión y recepción en la misma antena.', evidencia: 'documentado', fuente: `${LC} §1.3`, nota: 'trazado educativo' },
  { id: 'I06', nombre: 'GCTA: fuente de baja tensión → módulo de alta tensión del SIT', tipo: 'potencia', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'ctv.i.fuente', destino: 'ctv.i.alta', ruta: [], colgar: 0.2,
    funcion: 'El módulo de alta tensión entrega 3 a 9 kV al tubo SIT.', evidencia: 'documentado', fuente: `${GC} p. 1-33` },
  { id: 'I07', nombre: 'GCTA: tubo SIT → preamplificador de video', tipo: 'video', subsistema: 'comunicaciones', nivel: 'interior',
    origen: 'ctv.i.sit', destino: 'ctv.i.preamp', ruta: [], colgar: 0.2,
    funcion: 'Preamplificador FET de bajo ruido, ALC/AGC, gamma ≈0.7 y corrección de apertura.', evidencia: 'documentado', fuente: `${GC} p. 1-22 a 1-27` },
  { id: 'I08', nombre: 'Batería 1: borne de salida → conector del arnés', tipo: 'potencia', subsistema: 'energia', nivel: 'interior',
    origen: 'bat1.i.borne', destino: 'bat1.salida', ruta: [], colgar: 0.2,
    funcion: '23 celdas en serie → 36 V nominales.', evidencia: 'documentado', fuente: `${HB} dibujo 6.1` },
  { id: 'I09', nombre: 'Batería 2: borne de salida → conector del arnés', tipo: 'potencia', subsistema: 'energia', nivel: 'interior',
    origen: 'bat2.i.borne', destino: 'bat2.salida', ruta: [], colgar: 0.2,
    funcion: '23 celdas en serie → 36 V nominales.', evidencia: 'documentado', fuente: `${HB} dibujo 6.1` },
];

// -----------------------------------------------------------------------------
// Geometría de tubo con búferes reutilizables
// -----------------------------------------------------------------------------
function geomTubo(n, radial) {
  const g = new THREE.BufferGeometry();
  const nv = n * (radial + 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  const uv = new Float32Array(nv * 2);
  for (let i = 0; i < n; i++) for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; uv[k * 2] = i / (n - 1); uv[k * 2 + 1] = j / radial; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  g.setIndex(idx);
  g.userData.tubo = { n, radial };
  return g;
}

const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion();
function escribirTubo(g, pts, r) {
  const { n, radial } = g.userData.tubo;
  const P = g.attributes.position.array, N = g.attributes.normal.array;
  // marco por transporte paralelo
  let tPrev = null;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
    _t.subVectors(c, a); if (_t.lengthSq() < 1e-12) _t.set(1, 0, 0); _t.normalize();
    if (i === 0) {
      _n.set(0, 0, 1); if (Math.abs(_t.z) > 0.9) _n.set(1, 0, 0);
      _n.sub(_v.copy(_t).multiplyScalar(_n.dot(_t))).normalize();
    } else {
      _q.setFromUnitVectors(tPrev, _t); _n.applyQuaternion(_q);
      _n.sub(_v.copy(_t).multiplyScalar(_n.dot(_t))).normalize();
    }
    tPrev = (tPrev || new THREE.Vector3()).copy(_t);
    _b.crossVectors(_t, _n);
    for (let j = 0; j <= radial; j++) {
      const a2 = (j / radial) * Math.PI * 2, cs = Math.cos(a2), sn = Math.sin(a2);
      const nx = _n.x * cs + _b.x * sn, ny = _n.y * cs + _b.y * sn, nz = _n.z * cs + _b.z * sn;
      const k = (i * (radial + 1) + j) * 3;
      P[k] = pts[i].x + nx * r; P[k + 1] = pts[i].y + ny * r; P[k + 2] = pts[i].z + nz * r;
      N[k] = nx; N[k + 1] = ny; N[k + 2] = nz;
    }
  }
  g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  g.computeBoundingSphere(); g.computeBoundingBox();
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------
const SEGMENTOS = 56, RADIAL = 6;

/**
 * Crea las mallas de cable del registro indicado. Cada cable es una malla seleccionable con
 * userData.cable (registro) y userData.extremos (nombres legibles de origen y destino).
 * @param {THREE.Object3D} raiz  grupo raíz devuelto por crearLRV3()
 * @param {object[]} registro    CONEXIONES o CONEXIONES_INTERIORES
 */
export function crearCables(raiz, registro = CONEXIONES) {
  const U = raiz.userData, puertos = U.puertos;
  U.cables = U.cables || [];
  const mats = U.materiales;
  for (const c of registro) {
    const a = puertos.get(c.origen), b = puertos.get(c.destino);
    if (!a || !b) { console.warn('[LRV3] conexión sin puerto', c.id, !a ? c.origen : c.destino); continue; }
    const padre = (c.padre && c.padre(U)) || U.grupos[c.subsistema] || U.cuerpo;
    const t = TIPOS_ENLACE[c.tipo];
    const mat = c.tipo === 'termico' ? mats.mylar : c.tipo === 'video' ? mats.negro : c.tipo === 'mecanico' ? mats.aluOscuro : mats.cable;
    const m = new THREE.Mesh(geomTubo(SEGMENTOS, RADIAL), mat);
    m.name = `Cable_${c.id}`;
    m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false;
    m.userData = {
      parte: m.name, subsistema: c.subsistema, nombre: c.nombre, tipo: 'cable', cable: c,
      funcion: c.funcion, evidencia: c.evidencia, fuente: c.fuente + (c.nota ? ` — ${c.nota}` : ''),
      extremos: { origen: a.userData.etiqueta || c.origen, destino: b.userData.etiqueta || c.destino, tipo: t.nombre },
      matOriginal: mat,
    };
    padre.add(m);
    if (U.piezas) U.piezas.set(m.name, m);
    // anclas de la ruta: cuelgan de la estructura (o de `c.anclarEn`, p. ej. el interior de una unidad)
    const est = (c.anclarEn && c.anclarEn(U)) || U.grupos.estructura;
    const anclas = (c.ruta || []).map((p) => { const o = new THREE.Object3D(); o.position.set(p[0], p[1], p[2]); o.name = `Ruta_${c.id}`; est.add(o); return o; });
    const k = { mesh: m, a, b, anclas, c, radio: t.radio * (c.escalaRadio || 1), pts: Array.from({ length: SEGMENTOS }, () => new THREE.Vector3()) };
    m.userData.registro = k;
    U.cables.push(k);
  }
  actualizarCables(raiz);
}

const _o = new THREE.Vector3(), _abajo = new THREE.Vector3();
/** Vector −Z del marco del rover expresado en el marco local de `padre` (los cables cuelgan en el padre de su malla). */
function abajo(padre) {
  let c = padre; while (c && !(c.name === 'LRV3_pulgadas')) c = c.parent;
  if (!c) return _abajo.set(0, 0, -1);
  const p0 = padre.worldToLocal(c.localToWorld(_o.set(0, 0, 0)));
  const p1 = padre.worldToLocal(c.localToWorld(_abajo.set(0, 0, -1)));
  return p1.sub(p0);
}
/** Recalcula la geometría de los cables a partir de la posición actual de sus puertos. */
export function actualizarCables(raiz) {
  const U = raiz.userData;
  if (!U.cables) return;
  raiz.updateMatrixWorld(true);
  for (const k of U.cables) {
    if (!k.mesh.parent) continue;
    const ctrl = [];
    const loc = (o) => k.mesh.parent.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
    const pa = loc(k.a), pb = loc(k.b);
    ctrl.push(pa);
    // comba cerca de los extremos (holgura para mecanismos)
    const anc = k.anclas.map(loc);
    const [ca, cb] = Array.isArray(k.c.colgar) ? k.c.colgar : [k.c.colgar || 0, k.c.colgar || 0];
    const primero = anc[0] || pb, ultimo = anc[anc.length - 1] || pa;
    // la comba se aplica en −Z del marco del rover (gravedad), convertida al marco local del cable
    const c1 = pa.clone().lerp(primero, 0.5).addScaledVector(abajo(k.mesh.parent), anc.length ? ca : Math.max(ca, cb));
    ctrl.push(c1, ...anc);
    if (anc.length) ctrl.push(ultimo.clone().lerp(pb, 0.5).addScaledVector(abajo(k.mesh.parent), cb));
    ctrl.push(pb);
    const curva = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    // muestreo por longitud de arco: anillos equiespaciados también en tramos largos y rectos
    curva.arcLengthDivisions = 120;
    for (let i = 0; i < SEGMENTOS; i++) curva.getPointAt(i / (SEGMENTOS - 1), k.pts[i]);
    escribirTubo(k.mesh.geometry, k.pts, k.radio);
  }
  U.cablesSucios = false;
}

/** Información legible del registro (para paneles o para NEPTUNITO). */
export function listarConexiones(raiz) {
  return (raiz.userData.cables || []).map((k) => ({
    id: k.c.id, nombre: k.c.nombre, tipo: TIPOS_ENLACE[k.c.tipo].nombre, origen: k.mesh.userData.extremos.origen,
    destino: k.mesh.userData.extremos.destino, funcion: k.c.funcion, evidencia: k.c.evidencia, fuente: k.c.fuente, nota: k.c.nota || null,
  }));
}
