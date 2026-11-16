/**
 * NEPTUNI · Neptunito — líneas de tiempo (matemática pura, sin DOM).
 *
 * Aquí se separa el DESPLAZAMIENTO del personaje (x, y, escala, giro) de la POSE
 * (qué fotograma se ve). Cada "segmento" devuelve una pose en función de u ∈ [0,1].
 * Al no tocar el DOM, este archivo se puede probar con Node (ver tools/test-timeline.mjs).
 *
 * Pose = { frame, x, y, sx, sy, rot, alpha, shadow, xfade }
 *   x      px desde la izquierda del contenedor hasta el ancla (punto de apoyo en el suelo)
 *   y      px de elevación sobre el suelo (positivo = arriba)
 *   sx, sy escala con origen en el ancla (estirar/encoger)
 *   rot    grados (positivo = horario)
 *   xfade  ms de fundido al entrar a este fotograma (0 = corte)
 */
import { ENTRY_ROLES, resolveEntryOrder } from './animation-config.js';

/* ───────────── utilidades ───────────── */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutSine = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const smooth = t => t * t * (3 - 2 * t);
const pad2 = n => String(n).padStart(2, '0');

/** Generador pseudoaleatorio con semilla (mulberry32): estados reproducibles. */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────── métricas (responsive) ───────────── */
export function computeMetrics(config, manifest, width, height) {
  const { size, ground, edge, margin } = config;
  let S = Math.min(height * size.heightRatio, width * size.widthRatio, size.max);
  S = Math.max(S, Math.min(size.min, height * 0.95));
  const k = S / manifest.referenceHeight;
  const groundBottom = ground.bottom > 1 ? ground.bottom : height * ground.bottom;
  // Extensión máxima del cuerpo completo a cada lado del ancla (para no desbordar).
  let left = 0, right = 0;
  for (const f of Object.values(manifest.frames)) {
    if (f.cutX === 0) continue; // cuadros de asomo: no cuentan
    left = Math.max(left, -f.bbox[0]);
    right = Math.max(right, f.bbox[2]);
  }
  const minX = edge.x + left * k + margin;
  const maxX = Math.max(minX, width - right * k - margin);
  const narratorX = clamp(width * config.narratorX, minX, maxX);
  return { width, height, S, k, groundBottom, edgeX: edge.x, tuck: edge.tuck, minX, maxX, narratorX };
}

/* ───────────── papeles de la entrada ───────────── */
export function entryFrames(config) {
  const { name, order, adjust } = resolveEntryOrder(config.entryOrder);
  const frames = {};
  ENTRY_ROLES.forEach((role, i) => { frames[role] = `entrada_${pad2(order[i])}`; });
  return { name, order, adjust, frames };
}

export function walkFrames(config) {
  return config.walk.order.map(n => `caminata_${pad2(n)}`);
}

const BASE = { y: 0, sx: 1, sy: 1, rot: 0, alpha: 1, shadow: 1, xfade: 0 };

/** Perfil de velocidad de la caminata (acelera, crucero, frena) → tabla de distancia normalizada. */
function walkProfile(easeIn, easeOut, n = 96) {
  const speedAt = u => {
    let v = 1;
    if (easeIn > 0 && u < easeIn) v = lerp(0.35, 1, smooth(u / easeIn));
    if (easeOut > 0 && u > 1 - easeOut) v *= lerp(1, 0.28, smooth((u - (1 - easeOut)) / easeOut));
    return v;
  };
  const table = [0];
  for (let i = 1; i <= n; i++) table.push(table[i - 1] + speedAt((i - 0.5) / n) / n);
  const avg = table[n];
  return {
    avg,
    at(u) {
      const p = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(p));
      return lerp(table[i], table[i + 1], p - i) / avg;
    },
  };
}

/**
 * Segmento de caminata de fromX a toX (+ fotograma inicial opcional de enlace).
 * Los pasos van ligados a la DISTANCIA recorrida, no al reloj: al frenar, los pasos
 * también se espacian y los pies no patinan.
 */
export function walkSegment(config, metrics, fromX, toX, { startFrame = null, startMs = 0 } = {}) {
  const frames = walkFrames(config);
  const { walk } = config;
  const D = toX - fromX;
  const profile = walkProfile(walk.easeIn, walk.easeOut);
  const cruise = Math.max(1, walk.speed * metrics.S); // px/s
  const dur = Math.abs(D) < metrics.S * 0.06 ? 0 : Math.max(walk.minMs, (Math.abs(D) / (cruise * profile.avg)) * 1000);
  const stepPx = Math.max(1, (walk.cycleDistance * metrics.S) / frames.length);
  const leadU = dur > 0 && startFrame ? clamp(startMs / dur, 0, 0.5) : 0;
  const leadDist = Math.abs(D) * profile.at(leadU);
  return {
    name: 'walk', phase: 'walk', dur, event: 'walkStart',
    sample(u) {
      const g = profile.at(u);
      const dist = Math.abs(D) * g;
      let frame;
      if (u < leadU) frame = startFrame;
      else frame = frames[Math.floor((dist - leadDist) / stepPx) % frames.length];
      return { ...BASE, frame, x: fromX + D * g };
    },
  };
}

function settleSegment(config, x, frame, ms) {
  return {
    name: 'settle', phase: 'settle', dur: ms, event: 'walkEnd',
    sample(u) {
      const e = easeOutCubic(u);
      return { ...BASE, frame, x, sy: lerp(0.982, 1, e), sx: lerp(1.01, 1, e), xfade: config.crossfadeMs };
    },
  };
}

/**
 * Construye la entrada completa como lista de segmentos.
 * Devuelve { segments, index: {nombre → posición}, landingX, endX, endFrame }.
 */
export function buildIntro(config, manifest, metrics, { reduced = false, endFrame = 'gestos_13' } = {}) {
  const { S, k, edgeX, tuck } = metrics;
  const I = config.intro;
  const entry = entryFrames(config);
  const F = name => manifest.frames[name];
  const edgeOf = f => (f.cutX !== undefined ? f.cutX : f.bbox[0]);
  const nose = f => f.nose || [0, -0.66 * manifest.referenceHeight];
  const segments = [];
  const add = seg => { segments.push(seg); return seg; };

  if (reduced) {
    // Movimiento reducido: aparece con un fundido en su sitio. Se emiten los mismos eventos.
    const x = metrics.narratorX;
    const still = { ...BASE, frame: endFrame, x };
    add({ name: 'appear', phase: 'appear', dur: 450, event: 'introStart', sample: u => ({ ...still, alpha: smooth(u) }) });
    add({ name: 'greetHold', phase: 'greet', dur: I.greet.holdMs, event: 'greetingReady', hold: true, sample: () => still });
    add({ name: 'jump', phase: 'jump', dur: 0, event: 'jumpStart', sample: () => still });
    add({ name: 'land', phase: 'land', dur: 0, event: 'landed', sample: () => still });
    add({ name: 'settle', phase: 'settle', dur: 0, event: 'walkEnd', sample: () => still });
    return finish(segments, { landingX: x, endX: x, endFrame, entry });
  }

  /* 1 · Asomarse: el cuadro entra deslizándose desde detrás del borde (la máscara real la pone el contenedor). */
  const fPeek = F(entry.frames.peek), fGreet = F(entry.frames.greet);
  const peekFull = edgeX - tuck - edgeOf(fPeek) * k;
  const peekHidden = edgeX - fPeek.bbox[2] * k - 6;
  const peekMid = lerp(peekHidden, peekFull, I.peek.firstAmount);
  const peekPose = x => ({ ...BASE, frame: entry.frames.peek, x, shadow: 0 });
  add({ name: 'peekA', phase: 'peek', dur: I.peek.firstMs, event: 'introStart', sample: u => peekPose(lerp(peekHidden, peekMid, easeOutCubic(u))) });
  add({ name: 'peekPause', phase: 'peek', dur: I.peek.pauseMs, sample: u => ({ ...peekPose(peekMid), y: -0.006 * S * Math.sin(Math.PI * u) }) });
  add({ name: 'peekB', phase: 'peek', dur: I.peek.secondMs, sample: u => peekPose(lerp(peekMid, peekFull, easeInOutSine(u))) });

  /* 2 · Saludo: cambia al cuadro de saludo con la nariz alineada y termina de salir, sin dejar el borde. */
  const greetFull = edgeX - tuck - edgeOf(fGreet) * k;
  const greetStart = Math.min(greetFull, peekFull + (nose(fPeek)[0] - nose(fGreet)[0]) * k);
  const greetPose = (x, y = 0) => ({ ...BASE, frame: entry.frames.greet, x, y, shadow: 0, xfade: 80 });
  add({ name: 'greetIn', phase: 'greet', dur: I.greet.slideMs, sample: u => greetPose(lerp(greetStart, greetFull, easeOutCubic(u))) });
  add({
    name: 'greetBob', phase: 'greet', dur: I.greet.bobs * I.greet.bobMs,
    sample: u => greetPose(greetFull, I.greet.bobHeight * S * (0.5 - 0.5 * Math.cos(2 * Math.PI * I.greet.bobs * u))),
  });
  // Pausa del saludo: aquí puede sonar la frase de enganche (hold = se puede retener indefinidamente).
  add({
    name: 'greetHold', phase: 'greet', dur: I.greet.holdMs, event: 'greetingReady', hold: true,
    sample: (u, holdMs = 0) => greetPose(greetFull, 0.007 * S * (0.5 - 0.5 * Math.cos((2 * Math.PI * holdMs) / 1900))),
  });

  /* 3 · Anticipación DESDE el asomo: se recoge tras el borde y se comprime. No sale a ponerse de pie. */
  const A = I.anticipation;
  const fAnt = F(entry.frames.anticipation);
  const recoilX = greetFull - A.recoil * S;
  const duck = -0.012 * S;
  add({
    name: 'recoil', phase: 'anticipation', dur: A.recoilMs,
    sample: u => greetPose(lerp(greetFull, recoilX, easeInOutSine(u)), lerp(0, duck, easeInOutSine(u))),
  });
  let antX = recoilX + (nose(fGreet)[0] - nose(fAnt)[0]) * k + entry.adjust.anticipation.x * S;
  antX = Math.min(antX, edgeX - tuck - edgeOf(fAnt) * k); // el borde recto del dibujo nunca asoma
  const antY = entry.adjust.anticipation.y * S;
  // Compresión inicial que deja la nariz donde estaba en el saludo (continuidad vertical).
  const noseGreetY = nose(fGreet)[1] * k - duck;
  const sy0 = clamp(noseGreetY / (nose(fAnt)[1] * k), 1 - A.squash, 1);
  const sy1 = Math.min(sy0 - 0.02, 1 - A.squash);
  add({
    name: 'crouch', phase: 'anticipation', dur: A.crouchMs,
    sample: u => {
      const sy = lerp(sy0, sy1, easeOutCubic(u));
      return { ...BASE, frame: entry.frames.anticipation, x: antX, y: antY, sy, sx: 1 + (1 - sy) * 0.5, xfade: 70 };
    },
  });

  /* 4 · Brinco corto lateral: trayectoria parabólica, despegue estirado, sin vuelo prolongado. */
  const J = I.jump;
  const fTake = F(entry.frames.takeoff), fFly = F(entry.frames.flight), fLand = F(entry.frames.landing);
  let landX = antX + J.distance * S + entry.adjust.landing.x * S;
  landX = clamp(landX, Math.min(metrics.minX, metrics.maxX), Math.max(metrics.maxX, metrics.minX));
  const flyLift = (nose(fFly)[1] - nose(fTake)[1]) * k; // mantiene la cabeza continua al cambiar de pose en el aire
  // El cuadro de despegue arranca comprimido lo justo para que la cabeza salga de donde estaba agachada.
  const syTake = clamp((nose(fAnt)[1] * sy1) / nose(fTake)[1], 0.82, 1);
  add({
    name: 'jump', phase: 'jump', dur: J.ms, event: 'jumpStart',
    sample: u => {
      const x = lerp(antX, landX, u);
      let y = 4 * J.height * S * u * (1 - u) + antY * (1 - u);
      const push = clamp(u / 0.16, 0, 1);
      const sy = lerp(syTake, 1.045, easeOutQuad(push)) - 0.045 * smooth(clamp((u - 0.16) / 0.5, 0, 1));
      const first = u < J.switchAt;
      if (!first) y += flyLift * (1 - smooth((u - J.switchAt) / (1 - J.switchAt)));
      return {
        ...BASE, frame: first ? entry.frames.takeoff : entry.frames.flight, x, y, sy, sx: 1 - (sy - 1) * 0.6,
        rot: J.lean * (1 - 1.7 * u), shadow: 1 - 0.45 * Math.sin(Math.PI * u), xfade: first ? 50 : 60,
      };
    },
  });

  /* 5 · Aterrizaje con flexión + recuperación. Nada vuelve a subir: no debe leerse como un segundo salto. */
  const L = I.land;
  const restX = Math.min(landX + L.slide * S, Math.max(metrics.maxX, landX));
  add({
    name: 'land', phase: 'land', dur: L.ms, event: 'landed',
    sample: u => {
      const bump = Math.sin(Math.PI * Math.pow(u, 0.55));
      return {
        ...BASE, frame: entry.frames.landing, x: lerp(landX, restX, easeOutCubic(u)), y: entry.adjust.landing.y * S,
        sy: 1 - L.squash * bump, sx: 1 + L.squash * 0.5 * bump, xfade: 40,
      };
    },
  });
  add({
    name: 'recover', phase: 'recover', dur: I.recover.ms,
    sample: u => ({ ...BASE, frame: entry.frames.recover, x: restX, sy: lerp(0.975, 1, easeOutCubic(u)), sx: lerp(1.012, 1, easeOutCubic(u)), xfade: 70 }),
  });

  /* 6 · Caminata hasta la posición de narrador (si queda a la derecha; nunca camina hacia atrás). */
  const targetX = Math.max(metrics.narratorX, restX);
  const walk = walkSegment(config, metrics, restX, targetX, { startFrame: entry.frames.walkStart, startMs: I.walkStart.ms });
  if (walk.dur > 0) add(walk);
  else add({ name: 'walk', phase: 'walk', dur: I.walkStart.ms, event: 'walkStart', sample: () => ({ ...BASE, frame: entry.frames.walkStart, x: restX, xfade: 60 }) });
  const endX = walk.dur > 0 ? targetX : restX;

  /* 7 · Se asienta en reposo, mirando al visitante. */
  add(settleSegment(config, endX, endFrame, I.settleMs));
  return finish(segments, { landingX: restX, endX, endFrame, entry });
}

/** Caminata suelta (playWalk): camina de fromX a toX y se asienta. */
export function buildWalk(config, manifest, metrics, fromX, toX, { endFrame = 'gestos_13', reduced = false } = {}) {
  const segments = [];
  if (reduced) {
    segments.push({ name: 'walk', phase: 'walk', dur: 0, event: 'walkStart', sample: () => ({ ...BASE, frame: endFrame, x: toX }) });
  } else {
    const walk = walkSegment(config, metrics, fromX, toX);
    segments.push(walk.dur > 0 ? walk : { ...walk, sample: () => ({ ...BASE, frame: endFrame, x: toX }) });
  }
  segments.push(settleSegment(config, toX, endFrame, reduced ? 0 : config.intro.settleMs));
  return finish(segments, { landingX: fromX, endX: toX, endFrame });
}

/** Reacción puntual: se encoge, brinca de alegría y aterriza. */
export function buildReaction(config, metrics, x, fromFrame, { reduced = false } = {}) {
  const R = config.reacting, S = metrics.S;
  const segments = [];
  if (reduced) {
    segments.push({ name: 'react', phase: 'react', dur: 900, sample: () => ({ ...BASE, frame: R.landFrame, x, xfade: config.crossfadeMs }) });
    return finish(segments, { endX: x });
  }
  segments.push({
    name: 'reactCrouch', phase: 'react', dur: R.crouchMs,
    sample: u => ({ ...BASE, frame: fromFrame, x, sy: 1 - R.squash * easeOutQuad(u), sx: 1 + R.squash * 0.5 * easeOutQuad(u) }),
  });
  segments.push({
    name: 'reactHop', phase: 'react', dur: R.hopMs,
    sample: u => ({
      ...BASE, frame: R.frame, x, y: 4 * R.hopHeight * S * u * (1 - u),
      sy: 1 + 0.035 * Math.sin(Math.PI * clamp(u / 0.5, 0, 1)), shadow: 1 - 0.4 * Math.sin(Math.PI * u), xfade: 50,
    }),
  });
  segments.push({
    name: 'reactLand', phase: 'react', dur: R.landMs,
    sample: u => {
      const bump = Math.sin(Math.PI * Math.pow(u, 0.5));
      return { ...BASE, frame: R.landFrame, x, sy: 1 - R.landSquash * bump, sx: 1 + R.landSquash * 0.5 * bump, xfade: 60 };
    },
  });
  return finish(segments, { endX: x });
}

function finish(segments, extra) {
  const index = {};
  let t = 0;
  segments.forEach((s, i) => { index[s.name] = i; s.start = t; t += s.dur; });
  return { segments, index, total: t, ...extra };
}

/** Muestra una línea de tiempo en el instante t (ms). Útil para pruebas y para depurar. */
export function sampleTimeline(tl, t) {
  const segs = tl.segments;
  let i = segs.length - 1;
  for (let j = 0; j < segs.length; j++) {
    if (t < segs[j].start + segs[j].dur) { i = j; break; }
  }
  const s = segs[i];
  const u = s.dur > 0 ? clamp((t - s.start) / s.dur, 0, 1) : 1;
  return { index: i, name: s.name, phase: s.phase, u, pose: s.sample(u, 0) };
}
