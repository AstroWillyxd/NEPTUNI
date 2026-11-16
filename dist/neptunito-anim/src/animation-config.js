/**
 * NEPTUNI · Neptunito — configuración de animaciones.
 *
 * Todo lo que normalmente querrás ajustar vive aquí: tiempos, distancias,
 * tamaño, orden de fotogramas y definición de los estados. La lógica
 * (neptunito-animator.js / neptunito-timeline.js) no necesita tocarse.
 *
 * Unidades:
 *   · tiempos  → milisegundos
 *   · "H"      → fracción de la altura visible del personaje (1 = su altura)
 *   · fotograma→ clave del manifiesto, p. ej. 'gestos_13' (ver frame-manifest.js)
 *   · órdenes  → índices 1-based sobre la hoja original (1 = primer cuadro)
 */

/** Presets del orden de la hoja de ENTRADA (8 cuadros, 1-based). */
export const ENTRY_ORDER_PRESETS = {
  /** Orden tal como viene dibujada la hoja. Recomendado (ver README). */
  original: {
    label: 'Original [1,2,3,4,5,6,7,8]',
    order: [1, 2, 3, 4, 5, 6, 7, 8],
    // Ajustes finos por PAPEL dentro de la entrada (se suman a la alineación automática).
    // x/y en H; x positivo = derecha, y positivo = arriba.
    adjust: {
      anticipation: { x: 0, y: 0 },
      landing: { x: 0, y: 0 },
    },
  },
  /** Intercambia los cuadros 3 y 6 (anticipación <-> aterrizaje). */
  swap3y6: {
    label: 'Intercambio 3↔6 [1,2,6,4,5,3,7,8]',
    order: [1, 2, 6, 4, 5, 3, 7, 8],
    adjust: {
      // El cuadro 6 está más agachado y más abierto: se retrasa un poco para que
      // siga leyendo como "todavía detrás del borde".
      anticipation: { x: -0.05, y: 0 },
      // El cuadro 3 trae la cola cortada en el dibujo: al aterrizar a campo abierto
      // ese corte queda a la vista (limitación del arte, no del código).
      landing: { x: 0, y: 0 },
    },
  },
};

/** Papel de cada posición del orden de entrada (posición 1..8 → papel). */
export const ENTRY_ROLES = ['peek', 'greet', 'anticipation', 'takeoff', 'flight', 'landing', 'recover', 'walkStart'];

export const DEFAULT_CONFIG = {
  /* ───────────── Tamaño y colocación (responsive) ───────────── */
  size: {
    heightRatio: 0.62, // altura del personaje como fracción de la altura del contenedor
    widthRatio: 0.42,  // …y tope como fracción del ancho (móvil estrecho)
    min: 110,          // px
    max: 300,          // px (los fotogramas miden ~305 px de alto: no conviene ampliar más)
  },
  ground: { bottom: 0.06 }, // línea de suelo: fracción de la altura del contenedor (o px si > 1)
  edge: {
    x: 0,       // px desde la izquierda del contenedor donde está el borde que oculta
    tuck: 6,    // px que el borde recto del dibujo queda escondido detrás del borde
    clip: 'left', // 'left' = solo recorta a la izquierda del borde | 'box' = recorta todo el contenedor | 'none'
  },
  narratorX: 0.5,  // posición final (ancla) como fracción del ancho del contenedor
  margin: 8,       // px mínimos entre el personaje y los lados del contenedor
  zIndex: 5,

  /* ───────────── Entrada ───────────── */
  entryOrder: 'original', // clave de ENTRY_ORDER_PRESETS o un array 1-based de 8 elementos
  intro: {
    peek: {
      firstMs: 560,      // asoma la cabecita…
      firstAmount: 0.5,  // …hasta esta fracción del cuadro
      pauseMs: 280,
      secondMs: 440,     // …y termina de asomarse
    },
    greet: {
      slideMs: 320,      // sale un poco más al cambiar al cuadro de saludo
      bobs: 2,           // cabeceos de saludo
      bobMs: 360,
      bobHeight: 0.022,  // H
      holdMs: 450,       // pausa tras saludar (o indefinida con playIntro({ holdGreeting: true }))
    },
    anticipation: {
      recoilMs: 190,     // se recoge hacia atrás del borde…
      recoil: 0.09,      // H
      crouchMs: 170,     // …y se comprime
      squash: 0.07,      // 0..0.2 (fracción de altura)
    },
    jump: {
      ms: 470,           // tiempo en el aire
      distance: 0.62,    // H, de la posición asomada al punto de aterrizaje
      height: 0.19,      // H, altura del arco
      switchAt: 0.46,    // fracción del vuelo en que pasa de 'takeoff' a 'flight'
      lean: 5,           // grados de inclinación al despegar
    },
    land: {
      ms: 230,
      squash: 0.085,
      slide: 0.035,      // H, pequeño deslizamiento por inercia
    },
    recover: { ms: 250 },
    walkStart: { ms: 130 },
    settleMs: 300,       // asentarse al llegar
    endState: 'idle',    // estado al terminar la entrada
  },

  /* ───────────── Caminata ───────────── */
  walk: {
    order: [1, 2, 3, 4, 5, 6, 7, 8], // 1-based sobre la hoja de caminata
    speed: 0.8,          // H por segundo en velocidad de crucero
    cycleDistance: 0.76, // H recorridos por ciclo completo (controla el ritmo de pasos)
    easeIn: 0.14,        // fracción inicial acelerando
    easeOut: 0.3,        // fracción final frenando
    minMs: 500,
  },

  /* ───────────── Transiciones y estilo ───────────── */
  crossfadeMs: 110,      // fundido entre poses (0 = corte seco). La caminata siempre corta en seco.
  breathing: { amount: 0.012, periodMs: 3400 },
  shadow: { enabled: true, width: 0.5, height: 0.07, opacity: 0.22 },

  /* ───────────── Estados (bucles) ─────────────
   * Cada estado es una lista de "pasos". El animador elige el siguiente paso al azar
   * (ponderado por weight, sin repetir el anterior) y lo mantiene entre minMs y maxMs.
   *   frame   → fotograma
   *   pause   → fotograma breve de boca cerrada que puede intercalarse tras el paso (solo talking)
   *   tilt    → inclinación en grados
   */
  states: {
    idle: {
      motion: 'breathe',
      steps: [
        { frame: 'gestos_13', minMs: 2600, maxMs: 4600, weight: 5 },
        { frame: 'gestos_16', minMs: 1800, maxMs: 2800, weight: 1 },
      ],
    },
    talking: {
      motion: 'talk',
      bob: 0.013,          // amplitud del "pulso" de habla (fracción de altura)
      bobPeriodMs: 300,
      pauseFrame: 'gestos_13',
      pauseChance: 0.3,
      pauseMs: [170, 260],
      steps: [
        { frame: 'gestos_14', minMs: 800, maxMs: 1400, weight: 3 },
        { frame: 'gestos_15', minMs: 800, maxMs: 1300, weight: 3 },
        { frame: 'gestos_08', minMs: 700, maxMs: 1200, weight: 2 },
        { frame: 'gestos_03', minMs: 700, maxMs: 1100, weight: 1 },
        { frame: 'gestos_07', minMs: 700, maxMs: 1100, weight: 1 },
      ],
    },
    waiting: {
      motion: 'breathe',
      steps: [
        { frame: 'gestos_16', minMs: 3000, maxMs: 5200, weight: 4 },
        { frame: 'gestos_13', minMs: 1600, maxMs: 2600, weight: 1 },
      ],
    },
    pointing: {
      motion: 'breathe',
      steps: [
        { frame: 'gestos_14', minMs: 1500, maxMs: 2400, weight: 2 },
        { frame: 'gestos_04', minMs: 1200, maxMs: 2000, weight: 2 },
        { frame: 'gestos_03', minMs: 1000, maxMs: 1600, weight: 1 },
      ],
    },
    listening: {
      motion: 'listen',
      tilt: -2.2,
      steps: [
        { frame: 'gestos_05', minMs: 2400, maxMs: 4000, weight: 4 },
        { frame: 'gestos_13', minMs: 1200, maxMs: 2000, weight: 1 },
      ],
    },
  },

  /** Reacción puntual (brinco de alegría). Al acabar vuelve al estado anterior. */
  reacting: {
    crouchMs: 110,
    squash: 0.06,
    frame: 'gestos_06',
    hopMs: 520,
    hopHeight: 0.13, // H
    landFrame: 'gestos_15',
    landMs: 320,
    landSquash: 0.06,
  },

  /* ───────────── Ajuste fino por fotograma ─────────────
   * Desplazamiento (px del lienzo normalizado) y escala extra por fotograma, por si
   * algún cuadro "baila" en tu maquetación. Ej.: { gestos_05: { x: 0, y: 0, scale: 1 } }
   */
  frameOffsets: {},

  /* ───────────── Accesibilidad ───────────── */
  reducedMotion: 'auto', // 'auto' (respeta prefers-reduced-motion) | true | false
  ariaHidden: true,      // el personaje es decorativo: oculto a lectores de pantalla
  seed: 7,               // semilla del azar de los estados (reproducible)
};

/** Mezcla profunda de objetos planos (los arrays se sustituyen enteros). */
export function mergeConfig(base, extra) {
  if (!extra) return structuredCloneSafe(base);
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = mergeConfig(base[key], value);
    } else if (value !== undefined) {
      out[key] = Array.isArray(value) ? value.slice() : value;
    }
  }
  return out;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Devuelve { order, adjust } a partir de una clave de preset o un array 1-based. */
export function resolveEntryOrder(entryOrder) {
  if (Array.isArray(entryOrder)) {
    const valid = entryOrder.length === 8 && entryOrder.every(n => Number.isInteger(n) && n >= 1 && n <= 8);
    if (!valid) throw new Error('entryOrder debe ser un array de 8 enteros entre 1 y 8');
    return { name: 'custom', order: entryOrder.slice(), adjust: { anticipation: { x: 0, y: 0 }, landing: { x: 0, y: 0 } } };
  }
  const preset = ENTRY_ORDER_PRESETS[entryOrder];
  if (!preset) throw new Error(`Preset de orden desconocido: ${entryOrder}`);
  return { name: entryOrder, order: preset.order.slice(), adjust: preset.adjust };
}
