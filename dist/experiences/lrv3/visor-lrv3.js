// =============================================================================
// Visor 3D del LRV-3 en la Luna (three.js 0.160). Un solo llamado lo monta en un <div>.
// NEPTUNI · NASA Space Apps Challenge 2026
//
//   import { montarVisorLRV3 } from './visor-lrv3.js';
//   const visor = await montarVisorLRV3(document.getElementById('visor'), {
//     alSeleccionar: (info) => console.log(info.parte, info.funcion, info.evidencia),
//   });
//   visor.explotar(1);              // vista explosionada (animada)
//   visor.aislar('movilidad');      // resalta un subsistema (null = todos)
//   visor.vista('inferior');        // también: inicio, frontal, lateral, trasera, superior, detalle_rueda,
//                                   //   detalle_suspension, bajo_chasis, tierra, foto_A, foto_B
//   visor.interior('lcru');         // abre la LCRU y enfoca su interior (bat1, bat2, spu, dgu, dce,
//                                   //   consola, lcru, ctv, tcu)
//   visor.corte('longitudinal', 0); // modo sección; visor.corte(null) lo quita
//   visor.demo('energia');          // energia | direccion | camara | video | apertura; visor.demo(null)
//   Otros: enfocar(nombre|'interior:id'), terreno('auto'|'visible'|'transparente'|'oculto'), abrir(id, f),
//   separar(f), articular({direccionDel, direccionTras, suspension, gctaPan, gctaTilt, …}), cables(bool),
//   transparentar(nombres, bool), luzDeTrabajo('auto'|true|false), apuntarATierra(), errorApuntadoHGA(),
//   estado() / restaurar(estado), metricas(). Opciones nuevas: calidad 'auto', interfaz (false = sin panel).
//
// Diferencias de comportamiento respecto de la versión anterior (compatibles con la API):
//  · órbita completa (también por debajo); el terreno se oculta solo cuando la cámara baja de él;
//  · la selección ignora piezas ocultas, en «fantasma» o recortadas por el plano de corte;
//  · los planos near/far y la distancia mínima se ajustan al volumen enfocado.
// =============================================================================
import * as THREE from '../../vendor/three/three.module.js';
import {createContextPass,setInspectionGhost} from '../../inspection-context.js?v=20261112inspeccion';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';
import {
  crearLRV3, explotarLRV3, SUBSISTEMAS, contarTriangulos, articularLRV3, apuntarAntenas, ejeHGA,
  desplazarLRV3, resolverPiezas, ESTADO_HISTORICO, LIMITES,
} from './lrv3-modelo.js';
import { crearEscenaLunar } from './escena-lunar.js';
import { esCompartida, texFlujo } from './lrv3-texturas.js';
import { listarConexiones, actualizarCables, TIPOS_ENLACE } from './lrv3-conexiones.js';
import { INTERIORES, mostrarInterior, abrirUnidad } from './lrv3-interiores.js';
import { crearDemos, crearInterfaz } from './lrv3-inspeccion.js';

const VISTAS = {
  inicio:             { pos: [5.3, 1.85, -5.0], obj: [0.2, 0.98, 0.45] },
  frontal:            { pos: [6.4, 1.3, 0.0], obj: [0, 0.85, 0] },
  lateral:            { pos: [0.1, 1.15, -7.6], obj: [0.05, 0.85, 0] },
  trasera:            { pos: [-5.2, 1.9, 3.4], obj: [0, 0.8, 0] },
  superior:           { pos: [0.2, 7.6, -0.6], obj: [0, 0.4, 0] },
  inferior:           { pos: [0.45, -3.1, 1.25], obj: [0.0, 0.38, 0.0], fov: 40, minDist: 0.4 },
  bajo_chasis:        { pos: [1.0, 0.14, 0.26], obj: [-0.45, 0.40, -0.02], fov: 62, minDist: 0.05 },
  detalle_rueda:      { pos: [2.3, 0.55, -2.6], obj: [1.14, 0.42, -0.92] },
  detalle_suspension: { pos: [1.7, 0.36, -1.7], obj: [1.14, 0.42, -0.62], fov: 40, minDist: 0.1 },
  foto_A:             { pos: [2.45, 1.25, -9.2], obj: [0.05, 0.8, 0], fov: 19 },
  foto_B:             { pos: [4.4, 2.2, -3.6], obj: [-0.1, 0.75, 0.2], fov: 27 },
};
export const LISTA_VISTAS = [...Object.keys(VISTAS), 'tierra'];

const POSICION = { DI: 'delantera izquierda', DD: 'delantera derecha', TI: 'trasera izquierda', TD: 'trasera derecha', Izq: 'izquierdo', Der: 'derecho' };
const NOMBRES = {
  Chasis_Delantero: 'Chasis delantero', Chasis_Central: 'Chasis central', Chasis_Trasero: 'Chasis trasero',
  Paneles_Piso: 'Paneles de piso', Bisagras: 'Bisagras de plegado', Pasadores_Bisagra: 'Pasadores de bisagra',
  Estructura_Secundaria_Inferior: 'Estructura secundaria bajo el piso', Herrajes_Interfaz_LM: 'Herrajes de fijación al módulo lunar',
  Malla_Acero: 'Malla de acero de la rueda', Malla_Acero_Alambres: 'Alambres de la malla (detalle cercano)', Chevrones_Titanio: 'Chevrones de titanio', Aros_y_Tope: 'Aros y tope interior',
  Cubo: 'Disco y cubo de la rueda', Traccion_Freno: 'Motor de tracción, reductor armónico y freno', Brazos_y_Torsion: 'Brazos y barras de torsión',
  Brazo_Inferior: 'Brazo inferior de suspensión', Brazo_Superior: 'Brazo superior de suspensión', Barras_Torsion: 'Barras de torsión',
  Amortiguador: 'Amortiguador (cuerpo)', Amortiguador_Vastago: 'Amortiguador (vástago)', Soporte_Suspension: 'Soporte de suspensión', Brazo_Direccion: 'Brazo de dirección',
  Barra_Acoplamiento: 'Barra de acoplamiento', Rotula_Sector: 'Rótula del sector', Rotula_Rueda: 'Rótula de la rueda',
  Direccion_Del_Caja: 'Motor y reductor de dirección delantera', Direccion_Tras_Caja: 'Motor y reductor de dirección trasera',
  Direccion_Del_Sector: 'Sector de dirección delantero', Direccion_Tras_Sector: 'Sector de dirección trasero',
  Guardabarros_Fijo: 'Guardabarros', Extension_Guardabarros: 'Extensión del guardabarros', Soporte_Guardabarros: 'Soporte del guardabarros',
  Reparacion_Guardabarros: 'Reparación con mapas (Apollo 17)', Cinta_Gris: 'Cinta gris de la reparación', Pinzas_Reparacion: 'Pinzas de la reparación',
  Asiento_Izq_Estructura: 'Asiento izquierdo', Asiento_Der_Estructura: 'Asiento derecho', Asiento_Izq_Cinchas: 'Cinchas del asiento izquierdo', Asiento_Der_Cinchas: 'Cinchas del asiento derecho',
  Cinturon: 'Cinturón de banda', Bolsa_Bajo_Asiento: 'Bolsa bajo el asiento',
  Reposapies: 'Reposapiés', Consola_Carcasa: 'Consola de control', Consola_Panel: 'Panel de la consola', Consola_Indicadores: 'Relojes, palancas y breakers',
  Bandera_Alerta: 'Bandera de alerta', Apoyabrazos: 'Apoyabrazos', Controlador_Manual_T: 'Controlador manual en T', Asideros: 'Asideros',
  Baterias_SPU_DGU: 'Baterías, SPU, DGU y DCE', Espejos_Termicos: 'Espejos térmicos', Cubiertas_Antipolvo: 'Cubiertas antipolvo',
  Bateria_1_Caja: 'Batería 1', Bateria_2_Caja: 'Batería 2', SPU_Caja: 'SPU (procesador de navegación)', DGU_Caja: 'DGU (giróscopo direccional)', DCE_Caja: 'DCE (electrónica de tracción)',
  Bloque_Conectores: 'Bloque de conectores', Soportes_Baterias: 'Soportes de baterías', Manta_Termica_Delantera: 'Manta térmica de la bahía', Conector_AUX: 'Conector auxiliar (AUX)',
  LCRU: 'LCRU (relé de comunicaciones)', LCRU_Tapa: 'Cubierta de la LCRU', LCRU_Manta_Termica: 'Paneles de manta térmica de la LCRU', LCRU_Ribete: 'Ribete blanco de la manta',
  LCRU_Espejos: 'Espejos radiadores de la LCRU', LCRU_Soportes: 'Soportes de la LCRU', LCRU_Panel_Control: 'Panel de control de la LCRU', LCRU_Antena_VHF: 'Antena VHF', LCRU_Puerta_Bateria: 'Acceso a la batería de la LCRU',
  HGA_Mastil: 'Mástil de la antena de alta ganancia', HGA_Plato_Malla_3ft: 'Antena de alta ganancia (3 ft)', HGA_Cardan: 'Cardán de apuntado de la HGA',
  HGA_Costillas: 'Costillas de la HGA', HGA_Alimentador: 'Alimentador helicoidal de la HGA', HGA_Mira_Optica: 'Mira óptica de la HGA', HGA_Palanca: 'Palanca de apuntado de la HGA',
  LGA_Asta_Reflector: 'Asta de la antena de baja ganancia', LGA_Helice: 'Hélice de la antena de baja ganancia', LGA_Copa: 'Reflector de copa de la LGA', LGA_Radomo: 'Cubierta de la LGA', LGA_Articulacion: 'Articulación de la LGA',
  TV_GCTA_Mastil: 'Asta de la cámara de TV', TV_Caja_Control: 'Caja de control (TCU)', TV_TCU_Columna: 'Columna de acimut (TCU)', TV_Conector: 'Cables de la cámara de TV',
  TV_Horquilla: 'Horquilla pan-tilt', TV_Motor_Elevacion: 'Motor de elevación', TV_Placa_Montaje: 'Placa de montaje y segmento de elevación',
  TV_Camara_Cuerpo: 'Cámara de TV (CTV)', TV_Camara_Tapa: 'Cubierta de la cámara', TV_Espejos_Superiores: 'Espejos de la cámara', TV_Parasol: 'Parasol de la cámara de TV',
  TV_Camara_Lente: 'Lente zoom de la cámara', TV_Vidrio_Lente: 'Vidrio del lente', TV_Conector_Trasero: 'Conector de la cámara',
  Camara_16mm_DAC: 'Cámara de 16 mm (DAC)', Cables_Comunicaciones: 'Cables de comunicaciones',
  Palet_Trasero: 'Palé trasero de carga', Pale_Trasero_DCE: 'Palé trasero de carga', Portaherramientas: 'Portaherramientas', Bolsas_Muestras: 'Bolsa de muestras',
  Gravimetro_TGE: 'Gravímetro de travesía (TGE)', TGE_Asa_Radiador: 'Asa y radiador del TGE', TGE_Lectura: 'Lectura del TGE', TGE_Patas_Soporte: 'Patas y soporte del TGE',
  Receptor_SEP: 'Receptor SEP', SEP_Espejos: 'Reflectores del receptor SEP', SEP_Manta_Abierta: 'Manta del receptor SEP (abierta)', Grabador_DSEA: 'Grabador de datos DSEA',
  Antena_SEP: 'Antena de 3 lazos del SEP', Antena_SEP_3_Lazos: 'Antena de 3 lazos del SEP',
};
export function nombreLegible(id) {
  if (NOMBRES[id]) return NOMBRES[id];
  const t = id.split('_'), suf = t[t.length - 1];
  if (POSICION[suf]) { const base = t.slice(0, -1).join('_'); return `${NOMBRES[base] || base.replace(/_/g, ' ')} · ${POSICION[suf]}`; }
  const m = id.match(/^(.*)_(DI|DD|TI|TD)_(.*)$/);
  if (m) return `${(NOMBRES[m[1] + '_' + m[3]] || (m[1] + ' ' + m[3]).replace(/_/g, ' '))} · ${POSICION[m[2]]}`;
  return acentos(id.replace(/_/g, ' '));
}
const ACENTOS = { Bateria: 'Batería', Rele: 'Relé', Reles: 'Relés', Pinon: 'Piñón', Modulo: 'Módulo', Electronica: 'Electrónica', Camara: 'Cámara', Direccion: 'Dirección',
  Traccion: 'Tracción', Alimentacion: 'Alimentación', Tension: 'Tensión', Navegacion: 'Navegación', Marcacion: 'Marcación', Odometro: 'Odómetro', Logica: 'Lógica',
  Proteccion: 'Protección', Limite: 'Límite', Mastil: 'Mástil', Helice: 'Hélice', Cardan: 'Cardán', Optica: 'Óptica', Termica: 'Térmica', Deflexion: 'Deflexión',
  Giroscopo: 'Giróscopo', Acimut: 'Acimut', Interruptores: 'Interruptores', Haz: 'Haz', Bajada: 'bajada', Subida: 'subida' };
function acentos(t) { return t.split(' ').map((w) => ACENTOS[w] || w).join(' '); }

function calidadAuto() {
  const tactil = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 8;
  return tactil ? (mem <= 3 ? 'baja' : 'media') : 'alta';
}
const PERFILES = { alta: { pr: 2, sombra: 4096 }, media: { pr: 1.5, sombra: 2048 }, baja: { pr: 1, sombra: 1024 } };

export async function montarVisorLRV3(contenedor, op = {}) {
  const {
    explosionInicial = 0, giroAutomatico = false, escenario = true,
    alSeleccionar = null, alPasar = null, colorSeleccion = 0xe8893c, exposicion = 1.0,
  } = op;
  const calidad = op.calidad === 'auto' || !op.calidad ? (op.calidad === 'auto' ? calidadAuto() : 'alta') : op.calidad;
  const perfil = PERFILES[calidad] || PERFILES.alta;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!op.capturas });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, op.pixelRatioMax || perfil.pr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposicion;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none', outline: 'none' });
  if (getComputedStyle(contenedor).position === 'static') contenedor.style.position = 'relative';
  if (!contenedor.hasAttribute('tabindex')) contenedor.tabIndex = 0;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(34, 1, 0.05, 40000);
  escena.add(camara);
  const lunar = escenario ? crearEscenaLunar(renderer, escena, { calidad, ...(op.escenaOpciones || {}) }) : null;
  let luzFondo = null;
  if (!escenario) { escena.background = new THREE.Color(op.fondo ?? 0x0a0b0d); luzFondo = new THREE.HemisphereLight(0xffffff, 0x666666, 2.4); escena.add(luzFondo); }
  if (lunar) lunar.sol.shadow.mapSize.set(perfil.sombra, perfil.sombra);

  // luz de trabajo (ayuda educativa, no histórica): ilumina bajos e interiores desde la cámara
  const luzTrabajo = new THREE.DirectionalLight(0xfff4e6, 0); luzTrabajo.name = 'Luz_de_trabajo';
  camara.add(luzTrabajo); luzTrabajo.position.set(0.2, 0.3, 0); camara.add(luzTrabajo.target); luzTrabajo.target.position.set(0, 0, -1);
  let modoLuz = op.luzTrabajo ?? 'auto';

  let ui = null;
  const contextPass = createContextPass(renderer, escena, camara);
  escena.traverse(object => { if (object.isLight) contextPass.light(object); });
  const rover = crearLRV3({ calidad });
  escena.add(rover);
  const U = rover.userData;
  const triangulos = contarTriangulos(rover, { soloLejos: true });

  function apuntarATierra() {
    if (!lunar) return null;
    rover.updateMatrixWorld(true);
    const d = lunar.direccionTierra.clone().applyQuaternion(rover.getWorldQuaternion(new THREE.Quaternion()).invert());
    const r = apuntarAntenas(rover, new THREE.Vector3(d.x, -d.z, d.y));
    pedir(); return r;
  }
  /** Ángulo (°) entre el eje de la HGA y la dirección a la Tierra de la escena. */
  function errorApuntadoHGA() {
    if (!lunar) return null;
    const e = ejeHGA(rover), c = U.cuerpo; rover.updateMatrixWorld(true);
    const w = c.localToWorld(e.clone()).sub(c.localToWorld(new THREE.Vector3())).normalize();
    return THREE.MathUtils.radToDeg(w.angleTo(lunar.direccionTierra));
  }

  // ---------------------------------------------------------------- índice de piezas
  const piezas = [];
  const enIndice = new Set();
  function indexar() {
    rover.traverse((o) => {
      if (!o.isMesh || enIndice.has(o) || o.userData.noSeleccionable) return;
      o.userData.matOriginal = o.userData.matOriginal || o.material;
      enIndice.add(o); piezas.push(o);
    });
  }
  indexar();

  // ---------------------------------------------------------------- controles
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true; controles.dampingFactor = 0.08;
  controles.minDistance = 0.6; controles.maxDistance = 40;
  controles.minPolarAngle = 0; controles.maxPolarAngle = Math.PI;   // órbita completa: también por debajo
  controles.autoRotate = giroAutomatico; controles.autoRotateSpeed = 0.6;

  // ---------------------------------------------------------------- render bajo demanda y bucle único
  let sucio = true, vivo = true, visible = true, raf = 0;
  const pedir = () => { sucio = true; };
  controles.addEventListener('change', pedir);
  const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; if (visible) pedir(); }, { threshold: 0 });
  io.observe(contenedor);
  const alCambiarVisibilidad = () => { if (!document.hidden) pedir(); };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  const ajustar = () => {
    const w = contenedor.clientWidth || 800, h = contenedor.clientHeight || 600;
    renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
    if (!tocado && ultimaVista) vista(ultimaVista, false);
    pedir();
  };
  const ro = new ResizeObserver(ajustar); ro.observe(contenedor);

  // interpoladores con clave (una nueva animación con la misma clave sustituye a la anterior)
  const tweens = new Map();
  function animar(clave, dur, paso, fin) {
    tweens.set(clave, { t: 0, dur, paso, fin });
  }
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let fExp = explosionInicial, fObj = explosionInicial, fSep = 0;
  explotarLRV3(rover, fExp);

  let modoTerreno = 'auto';
  let ultimoNear = -1;
  const reloj = new THREE.Clock();
  let fpsMarcos = 0, fpsT = 0, fps = null;
  const bucle = () => {
    if (!vivo) return;
    raf = requestAnimationFrame(bucle);
    const bruto = reloj.getDelta(), dt = Math.min(bruto, 0.05);
    if (!visible || document.hidden) return;
    // animaciones en tiempo real (también con pocos FPS), sin saltos tras volver de otra pestaña
    const dtA = Math.min(bruto, 0.25);
    for (const [k, tw] of tweens) {
      tw.t = Math.min(1, tw.t + dtA / tw.dur); tw.paso(suave(tw.t));
      if (tw.t >= 1) { tweens.delete(k); tw.fin && tw.fin(); }
      sucio = true;
    }
    if (Math.abs(fObj - fExp) > 1e-4) { fExp += (fObj - fExp) * Math.min(1, dt * 5); if (Math.abs(fObj - fExp) < 1e-3) fExp = fObj; explotarLRV3(rover, fExp); sucio = true; }
    if (demos.activo) { demos.actualizar(dtA); sucio = true; }
    if (controles.autoRotate) sucio = true;
    controles.update();
    // near dinámico según la distancia al objetivo (precisión de profundidad en primeros planos)
    const dist = camara.position.distanceTo(controles.target);
    const near = THREE.MathUtils.clamp(dist * 0.01, 0.003, 0.08);
    if (Math.abs(near - ultimoNear) > ultimoNear * 0.15) { camara.near = near; camara.updateProjectionMatrix(); ultimoNear = near; }
    if (lunar && modoTerreno === 'auto') {
      const bajo = camara.position.y < lunar.alturaTerreno(camara.position.x, camara.position.z) + 0.03;
      if (lunar.modoTerreno() !== (bajo ? 'oculto' : 'visible')) { lunar.setTerreno(bajo ? 'oculto' : 'visible'); sucio = true; }
    }
    const luz = modoLuz === true || (modoLuz === 'auto' && (camara.position.y < 0.42 || interioresVisibles() > 0 || !!corteActivo || !lunar));
    const iLuz = luz ? (lunar ? 1.6 : 0.8) : 0;
    if (luzTrabajo.intensity !== iLuz) { luzTrabajo.intensity = iLuz; sucio = true; }
    if (sucio) {
      dibujar(); sucio = false;
      fpsMarcos++; fpsT += dt; if (fpsT > 1) { fps = fpsMarcos / fpsT; fpsMarcos = 0; fpsT = 0; }
    }
  };

  // ---------------------------------------------------------------- cámara
  let ultimaVista = null, tocado = false;
  controles.addEventListener('start', () => { tocado = true; });
  function irA(p1, o1, fov1, animar_ = true, minDist = 0.6) {
    controles.minDistance = Math.min(minDist, p1.distanceTo(o1) * 0.9);
    if (!animar_) { tweens.delete('camara'); camara.position.copy(p1); controles.target.copy(o1); camara.fov = fov1; camara.updateProjectionMatrix(); pedir(); return; }
    const p0 = camara.position.clone(), o0 = controles.target.clone(), fov0 = camara.fov;
    animar('camara', 1.1, (k) => {
      camara.position.lerpVectors(p0, p1, k); controles.target.lerpVectors(o0, o1, k);
      camara.fov = fov0 + (fov1 - fov0) * k; camara.updateProjectionMatrix();
    });
  }
  function vistaTierra() {
    const hga = U.antenas.hga.el; rover.updateMatrixWorld(true);
    const c = hga.getWorldPosition(new THREE.Vector3());
    const d = lunar ? lunar.direccionTierra.clone() : new THREE.Vector3(0.57, 0.8, 0.15).normalize();
    // cámara detrás de la antena (en la horizontal opuesta a la Tierra) mirando hacia arriba: HGA abajo, Tierra arriba
    const dh = new THREE.Vector3(d.x, 0, d.z).normalize(), lado = new THREE.Vector3(-dh.z, 0, dh.x);
    const pos = c.clone().addScaledVector(dh, -3.8).addScaledVector(lado, 1.0).setY(1.25);
    return { pos: pos.toArray(), obj: c.clone().addScaledVector(d, 5).toArray(), fov: 55 };
  }
  function vista(nombre, animar_ = true) {
    let v = (nombre && typeof nombre === 'object') ? nombre : (nombre === 'tierra' ? vistaTierra() : (VISTAS[nombre] || VISTAS.inicio));
    ultimaVista = nombre;
    const o1 = new THREE.Vector3(...v.obj);
    // pantallas verticales (celular): alejar la cámara para que entre el rover completo
    const k = nombre === 'bajo_chasis' ? 1 : THREE.MathUtils.clamp(1.2 / Math.max(camara.aspect, 0.1), 1, 2.1);
    const p1 = new THREE.Vector3(...v.pos).sub(o1).multiplyScalar(k).add(o1);
    irA(p1, o1, v.fov || 34, animar_, v.minDist ?? 0.6);
  }

  /** Encadra un volumen: nombre de pieza o alias, 'interior:<id>', Object3D o Box3. */
  function enfocar(objetivo, { margen = 1.25, animar: an = true, direccion = null } = {}) {
    const box = new THREE.Box3();
    rover.updateMatrixWorld(true);
    if (objetivo && objetivo.isBox3) box.copy(objetivo);
    else {
      let objs = [];
      if (typeof objetivo === 'string' && objetivo.startsWith('interior:')) objs = [U.interiores?.[objetivo.slice(9)]].filter(Boolean);
      else if (typeof objetivo === 'string') objs = resolverPiezas(rover, objetivo);
      else if (objetivo && objetivo.isObject3D) objs = [objetivo];
      for (const o of objs) {
        const vis = o.visible; o.visible = true; box.expandByObject(o); o.visible = vis;
      }
    }
    if (box.isEmpty()) return null;
    const esf = box.getBoundingSphere(new THREE.Sphere());
    const r = Math.max(esf.radius, 0.04);
    const fovV = THREE.MathUtils.degToRad(camara.fov), fovH = 2 * Math.atan(Math.tan(fovV / 2) * camara.aspect);
    const d = (r * margen) / Math.sin(Math.min(fovV, fovH) / 2);
    let dir = direccion ? new THREE.Vector3(...(direccion.isVector3 ? direccion.toArray() : direccion)).normalize()
      : camara.position.clone().sub(controles.target).normalize();
    if (!direccion && box.containsPoint(camara.position)) dir = new THREE.Vector3(0.55, 0.65, -0.52).normalize();
    tocado = true;
    irA(esf.center.clone().addScaledVector(dir, d), esf.center.clone(), camara.fov, an, Math.max(0.02, r * 0.3));
    return { centro: esf.center.toArray(), radio: r };
  }

  // ---------------------------------------------------------------- materiales (selección, fantasma, flujo)
  const fantasma = new THREE.MeshStandardMaterial({ name: 'Fantasma', color: 0x9aa3ad, transparent: true, opacity: 0.1, depthWrite: false, roughness: 1 });
  const vidrio = new THREE.MeshStandardMaterial({ name: 'Carcasa_transparente', color: 0xcfd8e2, transparent: true, opacity: 0.14, depthWrite: false, roughness: 0.3, side: THREE.DoubleSide });
  const flujos = new Map();
  const carcasasFantasma = new Set();
  let aislado = null, seleccion = null, seleccionInst = null;
  const colorSel = new THREE.Color(colorSeleccion), blanco = new THREE.Color(1, 1, 1);
  function materialResaltado(m) {
    const base = flujos.get(m) || m.userData.matOriginal;
    if (!m.userData.matSel || m.userData.matSelBase !== base) {
      if (m.userData.matSel) m.userData.matSel.dispose();
      const c = base.clone(); c.emissive = colorSel.clone(); c.emissiveIntensity = 0.35; c.emissiveMap = null;
      c.clippingPlanes = base.clippingPlanes;
      m.userData.matSel = c; m.userData.matSelBase = base;
    }
    return m.userData.matSel;
  }
  function materialDe(m) {
    if (m === seleccion && !m.isInstancedMesh) return materialResaltado(m);
    if (aislado && m.userData.subsistema !== aislado) return fantasma;
    if (carcasasFantasma.has(m)) return vidrio;
    return flujos.get(m) || m.userData.matOriginal;
  }
  function dibujar() {
    contextPass.clip(corteActivo ? planos : null);
    contextPass.draw(Boolean(seleccion || aislado || carcasasFantasma.size));
  }
  function refrescarMateriales() {
    for (const m of piezas) {
      const mat = materialDe(m);
      if (m.material !== mat) m.material = mat;
      const context = mat === fantasma || mat === vidrio || Boolean(seleccion && m !== seleccion);
      setInspectionGhost(m, context);
      m.castShadow = !context && !mat.transparent;
    }
    pedir();
  }
  function separarSeleccion(anterior) {
    tweens.delete('pieza-inspeccion');
    if (anterior && !anterior.isInstancedMesh) desplazarLRV3(anterior, 'inspeccion', null);
    if (!seleccion || seleccion.isInstancedMesh) return;
    const pieza = seleccion;
    const size = new THREE.Box3().setFromObject(pieza).getSize(new THREE.Vector3());
    const lift = THREE.MathUtils.clamp(size.length() * .22, .016, .15);
    const world = new THREE.Vector3(0, lift, 0);
    const local = world.applyMatrix3(new THREE.Matrix3().setFromMatrix4(pieza.parent.matrixWorld).invert());
    const apply = progress => desplazarLRV3(pieza, 'inspeccion', local.clone().multiplyScalar(progress));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) apply(1);
    else animar('pieza-inspeccion', .5, apply);
  }
  function aislar(id) { aislado = id || null; refrescarMateriales(); }
  function marcarInstancia(m, i) {
    if (!m || !m.isInstancedMesh) return;
    if (!m.instanceColor) { for (let k = 0; k < m.count; k++) m.setColorAt(k, blanco); }
    for (let k = 0; k < m.count; k++) m.setColorAt(k, k === i ? colorSel : blanco);
    m.instanceColor.needsUpdate = true;
  }
  function seleccionar(nombreOMesh, instancia = null) {
    const anterior = seleccion;
    if (seleccion && seleccion.isInstancedMesh) marcarInstancia(seleccion, -1);
    if (typeof nombreOMesh === 'string') {
      seleccion = piezas.find((p) => p.name === nombreOMesh) || null;
      if (!seleccion) { const r = resolverPiezas(rover, nombreOMesh); seleccion = r.find((x) => enIndice.has(x)) || null; }
    } else seleccion = nombreOMesh || null;
    seleccionInst = seleccion && seleccion.isInstancedMesh ? instancia : null;
    if (seleccion && seleccion.isInstancedMesh) marcarInstancia(seleccion, seleccionInst ?? -1);
    separarSeleccion(anterior);
    refrescarMateriales();
    const info = seleccion ? infoDe(seleccion, seleccionInst) : null;
    ui && ui.mostrarInfo(info);
    return info;
  }
  function infoDe(m, inst = null) {
    const u = m.userData, it = inst != null && u.instancias ? u.instancias[inst] : null;
    const info = {
      parte: m.name, nombre: it?.nombre || u.nombre || nombreLegible(m.name), subsistema: u.subsistema,
      datos: SUBSISTEMAS.find((s) => s.id === u.subsistema),
      funcion: it?.funcion || u.funcion || null, evidencia: u.evidencia || null, fuente: u.fuente || null,
      tipo: u.tipo || 'pieza', unidad: u.unidad || null,
    };
    if (inst != null) info.instancia = inst;
    if (u.extremos) info.extremos = { ...u.extremos };
    if (u.cable) info.cable = { id: u.cable.id, tipo: TIPOS_ENLACE[u.cable.tipo]?.nombre, nota: u.cable.nota || null };
    return info;
  }

  // ---------------------------------------------------------------- corte (sección)
  const planoCorte = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planos = [planoCorte];
  let corteActivo = null, cortePos = 0;
  const CORTES = { longitudinal: [0, 0, 1, -1, 0], transversal: [-1, 0, 0, 1, 1.05], horizontal: [0, -1, 0, 1, 0.62] };
  function materialesRover() {
    const s = new Set([fantasma, vidrio]);
    for (const m of piezas) { s.add(m.userData.matOriginal); if (m.userData.matSel) s.add(m.userData.matSel); }
    for (const m of flujos.values()) s.add(m);
    return s;
  }
  function corte(tipo, pos) {
    const def = tipo ? CORTES[tipo] : null;
    if (tipo && !def) throw new Error(`Corte desconocido: ${tipo}`);
    const cambiaPrograma = !!def !== !!corteActivo, previo = corteActivo;
    corteActivo = def ? tipo : null;
    if (def) {
      cortePos = pos ?? (tipo === previo ? cortePos : def[4]);
      planoCorte.normal.set(def[0], def[1], def[2]); planoCorte.constant = def[3] * cortePos;
    }
    U.planosCorte = def ? planos : null;
    if (cambiaPrograma) for (const m of materialesRover()) { m.clippingPlanes = def ? planos : null; m.clipShadows = !!def; m.needsUpdate = true; }
    pedir();
    return corteActivo ? { tipo: corteActivo, posicion: cortePos } : null;
  }

  // ---------------------------------------------------------------- aperturas, interiores, separación
  const aperturaObj = {};
  function abrir(id, f = 1, animar_ = true) {
    if (!INTERIORES[id]) throw new Error(`Unidad desconocida: ${id}`);
    const f0 = (U.aperturas && U.aperturas[id]) || 0;
    aperturaObj[id] = f;
    const aplicar = (v) => {
      const carc = abrirUnidad(rover, id, v);
      for (const m of carc) { if (v > 0.02) carcasasFantasma.add(m); else carcasasFantasma.delete(m); }
      refrescarMateriales();
    };
    if (!animar_) { tweens.delete('ab_' + id); aplicar(f); } else animar('ab_' + id, 1.2, (k) => aplicar(f0 + (f - f0) * k));
    pedir();
  }
  function interiorVisible(id) { return !!(U.interiores && U.interiores[id] && U.interiores[id].visible); }
  function interioresVisibles() { return U.interiores ? Object.values(U.interiores).filter((g) => g.visible).length : 0; }
  /** Muestra (o esconde) el interior de una unidad: lo construye, abre la carcasa y lo encuadra. */
  const DIR_INTERIOR = { bat1: [0.2, 0.9, -0.38], spu: [0.2, 0.9, -0.38], bat2: [0.2, 0.9, 0.38], dgu: [0.2, 0.9, 0.38], dce: [0.2, 0.9, 0.38],
    lcru: [0.35, 0.8, -0.5], ctv: [0.45, 0.55, -0.7], tcu: [0.55, 0.35, -0.75], consola: [-0.55, 0.5, -0.65] };
  function interior(id, mostrar = true, { enfocar: enf = true, abrir: ab = true, animar: an = true } = {}) {
    if (!INTERIORES[id]) throw new Error(`Interior desconocido: ${id}`);
    if (mostrar) {
      mostrarInterior(rover, id, true); indexar();
      if (corteActivo) for (const m of materialesRover()) if (m && m.clippingPlanes !== planos) { m.clippingPlanes = planos; m.clipShadows = true; m.needsUpdate = true; }
      if (ab) abrir(id, 1, an);
      if (enf) {
        const g = U.interiores[id]; const box = new THREE.Box3().setFromObject(g);
        enfocar(box, { margen: 1.15, direccion: DIR_INTERIOR[id], animar: an });
      }
    } else {
      abrir(id, 0, an);
      if (!an) { tweens.delete('oc_' + id); mostrarInterior(rover, id, false); }
      else animar('oc_' + id, 1.25, () => {}, () => { if ((aperturaObj[id] || 0) === 0) mostrarInterior(rover, id, false); pedir(); });
    }
    pedir();
    return interiorVisible(id) || mostrar;
  }
  const SEPARACION = { bat1: [8, 7, 12], bat2: [8, -7, 12], spu: [-5, 8, 16], dgu: [3, -8, 20], dce: [-5, -8, 16], lcru: [16, 0, 6] };
  function separar(f, animar_ = true) {
    const f0 = fSep; fSep = THREE.MathUtils.clamp(f, 0, 1);
    const aplicar = (v) => {
      for (const [id, vec] of Object.entries(SEPARACION)) {
        const g = U.carcasas[id]?.grupo; if (!g) continue;
        desplazarLRV3(g, 'separacion', v > 1e-4 ? new THREE.Vector3(...vec).multiplyScalar(v) : null);
      }
      actualizarCables(rover);
    };
    if (!animar_) { tweens.delete('separar'); aplicar(fSep); } else animar('separar', 1.2, (k) => aplicar(f0 + (fSep - f0) * k));
    pedir();
  }
  /** Vuelve translúcidas (y no seleccionables) piezas por nombre o alias, para ver lo que tapan. */
  function transparentar(nombres, activo = true) {
    for (const n of nombres) for (const m of resolverPiezas(rover, n)) { if (activo) carcasasFantasma.add(m); else carcasasFantasma.delete(m); }
    refrescarMateriales();
  }
  function articular(cambios) { const a = articularLRV3(rover, cambios); pedir(); return { ...a, suspension: { ...a.suspension } }; }
  function cables(v = true) { for (const k of U.cables || []) k.mesh.visible = v; pedir(); }

  // ---------------------------------------------------------------- flujos (demos)
  function flujo(mesh, opciones) {
    const prev = flujos.get(mesh);
    if (prev) { prev.userData.tex.dispose(); prev.dispose(); flujos.delete(mesh); }
    const reg = mesh.userData.registro;
    if (reg) { reg.radio = reg.radioBase ?? reg.radio; delete reg.radioBase; }
    if (opciones) {
      const tex = texFlujo().clone(); tex.wrapS = THREE.RepeatWrapping; tex.needsUpdate = true;
      const largo = reg ? reg.pts.reduce((s, p, i, a) => s + (i ? p.distanceTo(a[i - 1]) : 0), 0) : 40;
      tex.repeat.set(Math.max(2, largo / 5), 1);
      const col = new THREE.Color(opciones.color ?? 0xffa640);
      const mat = new THREE.MeshStandardMaterial({ name: 'Flujo', color: col.clone().multiplyScalar(0.45), emissive: col,
        emissiveMap: tex, emissiveIntensity: 3.2, roughness: 0.5, metalness: 0 });
      mat.userData = { tex, sentido: opciones.sentido ?? 1, vel: opciones.vel ?? 1.4 };
      mat.clippingPlanes = corteActivo ? planos : null;
      flujos.set(mesh, mat);
      if (reg && opciones.engrosar !== false) { reg.radioBase = reg.radio; reg.radio *= 2.2; }
    }
    actualizarCables(rover); refrescarMateriales();
  }
  function avanzarFlujos(dt) { for (const m of flujos.values()) m.userData.tex.offset.x -= dt * m.userData.vel * m.userData.sentido; }
  function quitarFlujos() { for (const mesh of [...flujos.keys()]) flujo(mesh, null); }

  // ---------------------------------------------------------------- terreno y luz
  function terreno(modo = 'auto') {
    modoTerreno = modo;
    if (lunar && modo !== 'auto') lunar.setTerreno(modo);
    pedir(); return modoTerreno;
  }
  function luzDeTrabajo(modo = 'auto') { modoLuz = modo; pedir(); return modoLuz; }

  // ---------------------------------------------------------------- estado
  function estado() {
    return {
      camara: { pos: camara.position.toArray(), obj: controles.target.toArray(), fov: camara.fov },
      explosion: fObj, separacion: fSep, aislado, seleccion: seleccion ? seleccion.name : null, instancia: seleccionInst,
      terreno: modoTerreno, corte: corteActivo ? { tipo: corteActivo, posicion: cortePos } : null, luz: modoLuz,
      aperturas: { ...(U.aperturas || {}) }, interiores: Object.keys(U.interiores || {}).filter(interiorVisible),
      articulacion: JSON.parse(JSON.stringify(U.articulacion)), cables: (U.cables || []).every((k) => k.mesh.visible),
      giro: controles.autoRotate, demo: demos.activo || null,
    };
  }
  function restaurar(e, animar_ = false) {
    if (!e) return;
    demos.detener(); tweens.clear();
    for (const id of Object.keys(INTERIORES)) {
      const ver = e.interiores.includes(id);
      if (ver) mostrarInterior(rover, id, true); else if (interiorVisible(id)) mostrarInterior(rover, id, false);
      abrir(id, e.aperturas[id] || 0, false);
    }
    indexar();
    fObj = fExp = e.explosion; explotarLRV3(rover, fExp);
    separar(e.separacion, false);
    articularLRV3(rover, e.articulacion);
    corte(e.corte ? e.corte.tipo : null, e.corte?.posicion);
    terreno(e.terreno); luzDeTrabajo(e.luz); cables(e.cables);
    aislado = e.aislado; seleccionar(e.seleccion, e.instancia);
    controles.autoRotate = e.giro;
    irA(new THREE.Vector3(...e.camara.pos), new THREE.Vector3(...e.camara.obj), e.camara.fov, animar_);
    if (e.demo) demos.iniciar(e.demo);
    pedir();
  }

  // ---------------------------------------------------------------- selección con puntero (toque ≠ arrastre ≠ dos dedos)
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const visibleCadena = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  function pick(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camara);
    const hits = ray.intersectObjects(piezas, false).filter((h) => visibleCadena(h.object)
      && !(corteActivo && planoCorte.distanceToPoint(h.point) < 0)
      && h.object.material !== fantasma && !carcasasFantasma.has(h.object));
    return hits[0] || null;
  }
  const activos = new Map(); let gesto = null;
  const lst = [];
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); lst.push([el, ev, fn, o]); };
  on(renderer.domElement, 'pointerdown', (e) => {
    activos.set(e.pointerId, true);
    if (activos.size === 1) gesto = { x: e.clientX, y: e.clientY, t: performance.now(), multi: false, tipo: e.pointerType };
    else if (gesto) gesto.multi = true;
  });
  const soltar = (e) => {
    const g = gesto;
    if (g && activos.size === 1 && !g.multi && e.type === 'pointerup') {
      const mov = Math.hypot(e.clientX - g.x, e.clientY - g.y), umbral = g.tipo === 'mouse' ? 5 : 10;
      if (mov <= umbral && performance.now() - g.t < 600) {
        const h = pick(e.clientX, e.clientY);
        const info = seleccionar(h ? h.object : null, h ? h.instanceId ?? null : null);
        alSeleccionar && alSeleccionar(info);
      }
    }
    activos.delete(e.pointerId); if (activos.size === 0) gesto = null;
  };
  on(renderer.domElement, 'pointerup', soltar); on(renderer.domElement, 'pointercancel', soltar);
  if (alPasar) {
    let ultimo = null;
    on(renderer.domElement, 'pointermove', (e) => {
      if (e.buttons || e.pointerType !== 'mouse') return;
      const h = pick(e.clientX, e.clientY), m = h ? h.object : null; if (m === ultimo) return; ultimo = m;
      renderer.domElement.style.cursor = m ? 'pointer' : 'grab';
      alPasar(m ? infoDe(m, h.instanceId ?? null) : null);
    });
  }

  // ---------------------------------------------------------------- teclado (sólo con el visor enfocado)
  const orbitar = (dTheta, dPhi) => {
    const off = camara.position.clone().sub(controles.target), s = new THREE.Spherical().setFromVector3(off);
    s.theta += dTheta; s.phi = THREE.MathUtils.clamp(s.phi + dPhi, 0.01, Math.PI - 0.01);
    camara.position.copy(controles.target).add(new THREE.Vector3().setFromSpherical(s)); tocado = true; pedir();
  };
  on(contenedor, 'keydown', (e) => {
    if (e.target !== contenedor && e.target !== renderer.domElement) return;
    const paso = THREE.MathUtils.degToRad(e.shiftKey ? 15 : 5);
    const k = e.key;
    if (k === 'ArrowLeft') orbitar(paso, 0); else if (k === 'ArrowRight') orbitar(-paso, 0);
    else if (k === 'ArrowUp') orbitar(0, -paso); else if (k === 'ArrowDown') orbitar(0, paso);
    else if (k === '+' || k === '=') { camara.position.lerp(controles.target, 0.15); pedir(); }
    else if (k === '-') { camara.position.sub(controles.target).multiplyScalar(1.18).add(controles.target); pedir(); }
    else if (/^[1-9]$/.test(k)) vista(LISTA_VISTAS[+k - 1]);
    else if (k === 'Escape') { demos.detener(); seleccionar(null); }
    else if (k === 'e' || k === 'E') api.explotar(fObj > 0.5 ? 0 : 1);
    else if (k === 'g' || k === 'G') api.girar(!controles.autoRotate);
    else if (k === 'r' || k === 'R') restaurar(estadoInicial, true);
    else return;
    e.preventDefault();
  });

  // ---------------------------------------------------------------- métricas
  function metricas() {
    dibujar();
    const i = renderer.info;
    return {
      calidad, drawCalls: i.render.calls, triangulosDibujados: i.render.triangles,
      triangulosRover: { visibles: contarTriangulos(rover, { soloVisibles: true }), base: triangulos, total: contarTriangulos(rover) },
      geometrias: i.memory.geometries, texturas: i.memory.textures, programas: i.programs ? i.programs.length : null,
      fps: fps ? Math.round(fps * 10) / 10 : null, piezas: piezas.length, cables: (U.cables || []).length,
      pixelRatio: renderer.getPixelRatio(),
    };
  }

  // ---------------------------------------------------------------- destruir (sin fugas ni bucles residuales)
  function destruir() {
    if (!vivo) return;
    vivo = false; cancelAnimationFrame(raf); tweens.clear();
    demos.detener(); ui && ui.destruir();
    ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    for (const [el, ev, fn, o] of lst) el.removeEventListener(ev, fn, o);
    controles.dispose();
    const mats = materialesRover();
    for (const m of piezas) if (m.userData.matSel) mats.add(m.userData.matSel);
    for (const v of Object.values(U.materiales)) mats.add(v);
    rover.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); });
    for (const m of mats) { if (!m) continue; for (const k in m) if (m[k] && m[k].isTexture && !esCompartida(m[k])) m[k].dispose(); m.dispose(); }
    escena.remove(rover);
    contextPass.dispose();
    if (lunar) lunar.dispose();
    if (luzFondo) escena.remove(luzFondo);
    renderer.renderLists.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  // ---------------------------------------------------------------- arranque
  const demos = crearDemos({
    THREE, rover, escena, lunar, camara, pedir, flujo, avanzarFlujos, quitarFlujos, articular, abrir, interior, separar,
    explotar: (f) => { fObj = f; pedir(); }, apuntarATierra, LIMITES, vista: (n) => vista(n), interiorVisible,
    enfocar: (o, opc) => enfocar(o, opc), errorApuntadoHGA, separacion: () => fSep, explosion: () => fObj, transparentar,
  });
  apuntarATierra();
  vista(op.vistaInicial || 'inicio', false);
  ajustar();
  const estadoInicial = estado();
  raf = requestAnimationFrame(bucle);

  const api = {
    escena, camara, renderer, rover, controles, lunar, triangulos, subsistemas: SUBSISTEMAS, calidad,
    get piezas() { return piezas.map((m) => infoDe(m)); },
    estadoHistorico: ESTADO_HISTORICO, interiores: Object.entries(INTERIORES).map(([id, v]) => ({ id, nombre: v.nombre, subsistema: v.subsistema })),
    conexiones: () => listarConexiones(rover), vistas: LISTA_VISTAS,
    vista, aislar, seleccionar, enfocar, corte, terreno, transparentar, luzDeTrabajo, abrir, interior, separar, articular, cables,
    apuntarATierra, errorApuntadoHGA, demo: (n) => (n ? demos.iniciar(n) : demos.detener()), get demoActiva() { return demos.activo; },
    estado, restaurar, metricas,
    explotar: (f, an = true) => { fObj = THREE.MathUtils.clamp(f, 0, 1); if (!an) { fExp = fObj; explotarLRV3(rover, fExp); } pedir(); },
    mostrar: (id, v) => { rover.traverse((o) => { if (o.isMesh && o.userData.subsistema === id && o.userData.tipo !== 'interior') { if (o.parent.isLOD) o.parent.visible = v; else o.visible = v; } }); pedir(); },
    girar: (activo = true, vel = 3.2) => { controles.autoRotate = activo; controles.autoRotateSpeed = vel; pedir(); },
    capturar: () => { dibujar(); return renderer.domElement.toDataURL('image/png'); },
    renderizar: () => { dibujar(); },
    destruir, _demos: demos, _estadoInicial: estadoInicial,
  };
  ui = op.interfaz === false ? null : crearInterfaz(api, contenedor, { abierta: op.interfazAbierta ?? false });
  api.ui = ui;
  return api;
}
