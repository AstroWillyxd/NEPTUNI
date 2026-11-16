/**
 * NEPTUNI · Neptunito — animador (módulo ES, sin dependencias ni build).
 *
 *   import { createNeptunitoAnimator } from './src/neptunito-animator.js';
 *   const neptunito = createNeptunitoAnimator({ container, assetsBaseUrl: './assets/' });
 *   await neptunito.playIntro();
 *   neptunito.setState('talking');
 *
 * El módulo NO reproduce audio ni conoce misiones: solo anima. La integración decide
 * cuándo llamar a cada método (ver INTEGRACION.md).
 */
import { DEFAULT_CONFIG, ENTRY_ORDER_PRESETS, mergeConfig, resolveEntryOrder } from './animation-config.js';
import { FRAME_MANIFEST } from './frame-manifest.js';
import {
  buildIntro, buildReaction, buildWalk, clamp, computeMetrics, createRng, entryFrames, lerp,
} from './neptunito-timeline.js';

export { DEFAULT_CONFIG, ENTRY_ORDER_PRESETS, FRAME_MANIFEST };

export const LOOP_STATES = ['idle', 'talking', 'waiting', 'pointing', 'listening'];
export const EVENTS = ['ready', 'introStart', 'greetingReady', 'jumpStart', 'landed', 'walkStart', 'walkEnd', 'introEnd', 'stateChange', 'frameChange', 'tick'];

const MAX_STEP_MS = 50; // tras volver de una pestaña en segundo plano no se "salta" la animación

export function createNeptunitoAnimator(options = {}) {
  const { container, onStateChange, onEvent } = options;
  if (!(container instanceof Element)) throw new Error('createNeptunitoAnimator: falta "container" (un elemento del DOM)');
  const manifest = options.manifest || FRAME_MANIFEST;
  const assetsBaseUrl = String(options.assetsBaseUrl ?? new URL('../assets/', import.meta.url).href).replace(/\/?$/, '/');
  let config = mergeConfig(DEFAULT_CONFIG, options.config);
  resolveEntryOrder(config.entryOrder); // valida pronto

  /* ───────────── DOM ───────────── */
  const el = (cls, parent) => { const n = document.createElement('div'); n.className = cls; parent?.append(n); return n; };
  const stage = el('neptunito-stage');
  const mover = el('neptunito-mover', stage);
  const shadow = el('neptunito-shadow', mover);
  const lift = el('neptunito-lift', mover);
  const images = new Map();
  for (const [key, frame] of Object.entries(manifest.frames)) {
    const img = new Image();
    img.className = 'neptunito-frame';
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.frame = key;
    img.src = assetsBaseUrl + frame.file;
    lift.append(img);
    images.set(key, img);
  }
  const restorePosition = getComputedStyle(container).position === 'static';
  if (restorePosition) container.classList.add('neptunito-host');
  container.append(stage);

  /* ───────────── estado interno ───────────── */
  const listeners = new Map();
  let destroyed = false;
  let metrics = null;
  let state = 'hidden';      // hidden | intro | peeking | walking | reacting | stopped | <LOOP_STATES>
  let phase = '';            // subfase de la entrada: peek, greet, anticipation, jump, land, recover, walk, settle
  let activity = null;       // { kind, update(dt) → bool(done), cancel() }
  let queuedState = null;    // estado pedido durante la entrada: se aplica al terminar
  let lastLoopState = 'idle';
  let pose = null;           // última pose aplicada
  let clock = 0;             // reloj virtual (ms), avanza con la velocidad y se detiene en pausa
  let paused = false;
  let speed = 1;
  let talkLevel = 1;
  let raf = 0, lastTs = 0;
  let rng = createRng(config.seed);
  let run = 0;               // token: invalida actividades viejas
  let isReady = false;
  const view = { frame: null, prev: null, fadeStart: 0, fadeMs: 0 };
  const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => (config.reducedMotion === 'auto' ? !!motionQuery?.matches : !!config.reducedMotion);

  const ready = Promise.all([...images.values()].map(img => (img.decode ? img.decode().catch(() => waitLoad(img)) : waitLoad(img))))
    .then(() => { isReady = true; if (!destroyed) emit('ready', {}); });
  ready.catch(error => console.error('[neptunito] no se pudieron cargar los fotogramas:', error));

  function waitLoad(img) {
    return new Promise((resolve, reject) => {
      if (img.complete) {
        if (img.naturalWidth) return resolve();
        return reject(new Error(`No se pudo cargar ${img.src}`));
      }
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => reject(new Error(`No se pudo cargar ${img.src}`)), { once: true });
    });
  }

  /* ───────────── eventos ───────────── */
  function on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => off(name, fn);
  }
  function off(name, fn) { listeners.get(name)?.delete(fn); }
  function emit(name, detail) {
    const payload = { type: name, state, phase, ...detail };
    for (const fn of [...(listeners.get(name) || [])]) {
      try { fn(payload); } catch (error) { console.error('[neptunito] error en listener de', name, error); }
    }
    if (name !== 'tick' && name !== 'frameChange') {
      try { onEvent?.(name, payload); } catch (error) { console.error('[neptunito] error en onEvent', error); }
    }
  }
  function changeState(next, extra = {}) {
    if (next === state) return;
    const previous = state;
    state = next;
    if (LOOP_STATES.includes(next)) lastLoopState = next;
    stage.dataset.state = next;
    const payload = { previous, ...extra };
    emit('stateChange', payload);
    try { onStateChange?.(next, previous); } catch (error) { console.error('[neptunito] error en onStateChange', error); }
  }

  /* ───────────── medidas y maquetación ───────────── */
  function layout() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return false;
    metrics = computeMetrics(config, manifest, width, height);
    const { k, groundBottom, S } = metrics;
    const c = manifest.canvas;
    stage.style.zIndex = String(config.zIndex);
    stage.dataset.clip = config.edge.clip;
    stage.style.setProperty('--neptunito-edge', `${config.edge.x}px`);
    mover.style.bottom = `${groundBottom}px`;
    for (const [key, img] of images) {
      const off = config.frameOffsets?.[key] || {};
      const s = k * (off.scale || 1);
      img.style.width = `${c.width * s}px`;
      img.style.height = `${c.height * s}px`;
      img.style.left = `${-c.anchorX * s + (off.x || 0) * k}px`;
      img.style.top = `${-c.anchorY * s - (off.y || 0) * k}px`;
    }
    const sh = config.shadow;
    shadow.style.display = sh.enabled ? '' : 'none';
    shadow.style.width = `${sh.width * S}px`;
    shadow.style.height = `${sh.height * S}px`;
    shadow.style.left = `${(-sh.width * S) / 2 + 0.03 * S}px`;
    shadow.style.top = `${(-sh.height * S) / 2}px`;
    return true;
  }

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => onResize()) : null;
  resizeObserver?.observe(container);
  function onResize() {
    if (destroyed) return;
    const before = metrics;
    if (!layout()) return;
    if (before && (before.width !== metrics.width || before.height !== metrics.height)) {
      activity?.rebuild?.(before);
      if (pose && !activity) { pose = { ...pose, x: clamp(pose.x * (metrics.width / before.width), metrics.minX, metrics.maxX) }; render(); }
    }
  }
  const onMotionChange = () => { if (reduced() && (state === 'intro' || state === 'walking')) skipIntro(); };
  motionQuery?.addEventListener?.('change', onMotionChange);

  /* ───────────── render ───────────── */
  function render() {
    if (!pose || !metrics) return;
    const p = pose;
    if (p.frame !== view.frame) {
      view.prev = view.frame;
      view.frame = p.frame;
      view.fadeMs = view.prev && p.xfade > 0 ? (reduced() ? Math.max(p.xfade, 160) : p.xfade) : 0;
      view.fadeStart = clock;
      emit('frameChange', { frame: p.frame, previousFrame: view.prev });
    }
    const e = view.fadeMs > 0 ? clamp((clock - view.fadeStart) / view.fadeMs, 0, 1) : 1;
    if (e >= 1) view.prev = null;
    for (const [key, img] of images) {
      let opacity = 0, z = 0;
      if (key === view.frame) { opacity = e; z = 2; }
      else if (key === view.prev) { opacity = 1 - e * e; z = 1; }
      const value = opacity <= 0 ? '0' : opacity >= 1 ? '1' : opacity.toFixed(3);
      if (img.style.opacity !== value) img.style.opacity = value;
      if (img.dataset.z !== String(z)) { img.dataset.z = String(z); img.style.zIndex = String(z); }
    }
    mover.style.transform = `translate3d(${p.x.toFixed(2)}px,0,0)`;
    mover.style.opacity = p.alpha >= 1 ? '' : p.alpha.toFixed(3);
    lift.style.transform = `translate3d(0,${(-p.y).toFixed(2)}px,0) rotate(${p.rot.toFixed(2)}deg) scale(${p.sx.toFixed(4)},${p.sy.toFixed(4)})`;
    const lifted = clamp(p.y / (metrics.S * 0.25), 0, 1);
    shadow.style.opacity = (config.shadow.opacity * p.shadow * (1 - 0.35 * lifted)).toFixed(3);
    shadow.style.transform = `scale(${(1 - 0.3 * lifted).toFixed(3)})`;
    stage.dataset.visible = 'true';
  }
  function hide() {
    pose = null;
    view.frame = view.prev = null;
    stage.dataset.visible = 'false';
    for (const img of images.values()) {
      img.style.opacity = '0';
      delete img.dataset.z;
    }
  }

  /* ───────────── bucle ───────────── */
  let inTick = false;
  function ensureLoop() {
    if (raf || destroyed || paused || !activity) return;
    if (!inTick) lastTs = 0; // arranque en frío: el primer cuadro no avanza el reloj
    raf = requestAnimationFrame(tick);
  }
  function tick(ts) {
    raf = 0;
    if (destroyed || paused || !activity) return;
    const dt = lastTs ? Math.min(MAX_STEP_MS, ts - lastTs) * speed : 0;
    lastTs = ts;
    inTick = true;
    try { step(dt); } finally { inTick = false; }
    if (!raf && activity && !paused && !destroyed) raf = requestAnimationFrame(tick);
  }
  /** Avanza la animación dt ms de reloj virtual (también sirve para pruebas deterministas). */
  function step(dt) {
    if (!metrics && !layout()) return;
    clock += dt;
    const current = activity;
    if (current) {
      const done = current.update(dt);
      if (done && activity === current) { activity = null; current.finish?.(); }
    }
    render();
    if (listeners.get('tick')?.size) emit('tick', getDebugInfo());
  }
  function cancelActivity(reason = 'cancelled') {
    const current = activity;
    activity = null;
    run++;
    current?.cancel?.(reason);
  }

  /* ───────────── actividad: línea de tiempo ───────────── */
  /**
   * Reproduce segmentos [from..to] de una línea de tiempo.
   * holdAt: nombre de segmento con hold → se queda ahí hasta release().
   */
  function timelineActivity({ kind, build, from = 0, to = null, holdAt = null, onDone }) {
    let tl = build();
    let i = typeof from === 'string' ? tl.index[from] : from;
    const last = () => (to === null ? tl.segments.length - 1 : typeof to === 'string' ? tl.index[to] : to);
    let local = 0, holdMs = 0, holding = false, entered = i - 1, released = false;
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    const enter = () => {
      while (entered < i) {
        entered++;
        const seg = tl.segments[entered];
        phase = seg.phase;
        if (seg.event) emit(seg.event, { segment: seg.name });
      }
    };
    const act = {
      kind, promise,
      get timeline() { return tl; },
      get holding() { return holding; },
      release() { released = true; holding = false; },
      rebuild() {
        const u = tl.segments[i].dur > 0 ? local / tl.segments[i].dur : 1;
        tl = build();
        i = Math.min(i, tl.segments.length - 1);
        local = u * tl.segments[i].dur;
      },
      update(dt) {
        let remaining = dt;
        enter();
        for (let guard = 0; guard < 64; guard++) {
          const seg = tl.segments[i];
          const wantsHold = seg.hold && seg.name === holdAt && !released;
          if (holding) { holdMs += remaining; remaining = 0; break; }
          if (local + remaining < seg.dur) { local += remaining; remaining = 0; break; }
          remaining -= seg.dur - local;
          local = seg.dur;
          if (wantsHold) { holding = true; holdMs += remaining; remaining = 0; break; }
          if (i >= last()) {
            pose = seg.sample(1, holdMs);
            return true;
          }
          i++; local = 0; holdMs = 0;
          enter();
        }
        const seg = tl.segments[i];
        pose = seg.sample(seg.dur > 0 ? clamp(local / seg.dur, 0, 1) : 1, holdMs);
        return false;
      },
      finish() { onDone?.(tl); resolve({ completed: true }); },
      cancel(reason) { resolve({ completed: false, reason }); },
    };
    return act;
  }

  /* ───────────── actividad: bucle de estado ───────────── */
  function loopActivity(name, x) {
    const def = config.states[name];
    const steps = def.steps;
    let current = null, elapsed = 0, duration = 0, t = 0, inPause = false, afterPause = null;
    const pick = () => {
      const pool = steps.length > 1 && current ? steps.filter(s => s !== current) : steps;
      const total = pool.reduce((sum, s) => sum + (s.weight || 1), 0);
      let r = rng() * total;
      for (const s of pool) { r -= s.weight || 1; if (r <= 0) return s; }
      return pool[pool.length - 1];
    };
    const begin = stepDef => {
      current = stepDef; elapsed = 0; inPause = false;
      duration = lerp(stepDef.minMs, stepDef.maxMs, rng()) * (reduced() ? 1.6 : 1);
    };
    begin(steps[0]);
    return {
      kind: 'loop', name,
      rebuild(before) { x = clamp(x * (metrics.width / before.width), metrics.minX, metrics.maxX); },
      update(dt) {
        t += dt; elapsed += dt;
        if (elapsed >= duration) {
          if (inPause) { begin(afterPause); }
          else if (name === 'talking' && def.pauseFrame && rng() < def.pauseChance && !reduced()) {
            afterPause = pick(); inPause = true; elapsed = 0;
            duration = lerp(def.pauseMs[0], def.pauseMs[1], rng());
          } else begin(pick());
        }
        const frame = inPause ? def.pauseFrame : current.frame;
        const p = { frame, x, y: 0, sx: 1, sy: 1, rot: 0, alpha: 1, shadow: 1, xfade: config.crossfadeMs };
        if (!reduced()) {
          const b = config.breathing;
          const breath = Math.sin((2 * Math.PI * t) / b.periodMs) * b.amount;
          p.sy += breath; p.sx -= breath * 0.4;
          if (def.motion === 'talk' && !inPause) {
            const env = 0.65 + 0.35 * Math.sin((2 * Math.PI * t) / 1700);
            const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / def.bobPeriodMs);
            p.sy += def.bob * talkLevel * env * pulse;
            p.sx -= def.bob * talkLevel * env * pulse * 0.35;
          }
          if (def.motion === 'listen') p.rot = (current.tilt ?? def.tilt ?? 0) * (0.8 + 0.2 * Math.sin((2 * Math.PI * t) / 2600));
        }
        pose = p;
        return false;
      },
    };
  }

  /* ───────────── API ───────────── */
  const endFrameFor = name => config.states[LOOP_STATES.includes(name) ? name : 'idle'].steps[0].frame;
  const currentX = () => (pose ? pose.x : metrics?.narratorX ?? 0);

  function startLoop(name, x = currentX()) {
    cancelActivity('state');
    phase = '';
    activity = loopActivity(name, x);
    changeState(name);
    ensureLoop();
    if (paused) step(0);
  }

  function setState(name, { interrupt = false } = {}) {
    if (destroyed) return false;
    if (name === 'reacting') { react(); return true; }
    if (!LOOP_STATES.includes(name)) throw new Error(`Estado desconocido: ${name}. Válidos: ${LOOP_STATES.join(', ')}, reacting`);
    if (!metrics && !layout()) { queuedState = name; return true; }
    const busy = state === 'intro' || state === 'walking' || state === 'peeking';
    if (busy && !interrupt) { queuedState = name; return true; } // se aplicará al terminar la entrada
    if (busy && interrupt) { skipIntro(name); return true; }
    if (state === 'reacting') { lastLoopState = name; queuedState = name; return true; }
    if (state === name && activity?.kind === 'loop') return true;
    const x = state === 'hidden' ? metrics.narratorX : currentX();
    startLoop(name, x);
    return true;
  }

  function beginTimeline(kind, nextState, opts) {
    cancelActivity('replaced');
    const token = ++run;
    const act = timelineActivity({ kind, ...opts });
    activity = act;
    changeState(nextState);
    ensureLoop();
    if (paused) step(0);
    return { act, token };
  }

  /**
   * Entrada completa. Devuelve una promesa → { completed: boolean, reason? }.
   * Si se llama mientras ya hay una entrada en curso, devuelve la misma promesa (no se solapan);
   * usa { restart: true } para reiniciarla.
   */
  function playIntro({ holdGreeting = false, restart = false, endState } = {}) {
    if (destroyed) return Promise.resolve({ completed: false, reason: 'destroyed' });
    if (activity?.kind === 'intro' && !restart) return activity.promise;
    if (!isReady) return ready.then(() => playIntro({ holdGreeting, restart, endState }), () => ({ completed: false, reason: 'assets' }));
    if (!metrics && !layout()) return Promise.resolve({ completed: false, reason: 'container-sin-tamaño' });
    queuedState = null;
    hide();
    const finalState = () => queuedState || endState || config.intro.endState;
    const { act } = beginTimeline('intro', 'intro', {
      build: () => buildIntro(config, manifest, metrics, { reduced: reduced(), endFrame: endFrameFor(finalState()) }),
      holdAt: holdGreeting ? 'greetHold' : null,
      onDone: tl => {
        const next = finalState();
        queuedState = null;
        emit('introEnd', { x: tl.endX });
        startLoop(LOOP_STATES.includes(next) ? next : 'idle', tl.endX);
      },
    });
    return act.promise;
  }

  /** Suelta la pausa del saludo cuando se usó playIntro({ holdGreeting: true }) o playPeek(). */
  function continueIntro() {
    if (activity?.kind === 'intro') { activity.release(); return true; }
    if (activity?.kind === 'peek') { return playJump(); }
    return false;
  }

  /** Termina la entrada al instante: coloca a Neptunito en su sitio de narrador. */
  function skipIntro(nextState) {
    if (!metrics && !layout()) return;
    const wasIntro = activity?.kind === 'intro';
    const next = nextState || queuedState || config.intro.endState;
    queuedState = null;
    cancelActivity('skipped');
    if (wasIntro) emit('introEnd', { x: metrics.narratorX, skipped: true });
    startLoop(LOOP_STATES.includes(next) ? next : 'idle', metrics.narratorX);
  }

  /** Solo asomarse + saludar; se queda asomado hasta playJump()/continueIntro()/setState(..., {interrupt:true}). */
  function playPeek() {
    if (destroyed || (!metrics && !layout())) return Promise.resolve({ completed: false });
    hide();
    const { act } = beginTimeline('peek', 'peeking', {
      build: () => buildIntro(config, manifest, metrics, { reduced: reduced() }),
      to: 'greetHold', holdAt: 'greetHold',
    });
    return act.promise;
  }

  /** Solo el brinco (anticipación → vuelo → aterrizaje → recuperación) desde la posición asomada. */
  function playJump({ endState } = {}) {
    if (destroyed || (!metrics && !layout())) return Promise.resolve({ completed: false });
    if (reduced()) { skipIntro(endState); return Promise.resolve({ completed: true }); }
    const { act } = beginTimeline('jump', 'intro', {
      build: () => buildIntro(config, manifest, metrics, { reduced: false }),
      from: 'recoil', to: 'recover',
      onDone: tl => startLoop(endState || queuedState || lastLoopState, tl.landingX),
    });
    return act.promise;
  }

  /**
   * Solo caminar. { toX } px, { distance } px o { distanceH } en alturas del personaje.
   * Sin argumentos camina hasta la posición de narrador.
   */
  function playWalk({ toX, distance, distanceH, fromX, endState } = {}) {
    if (destroyed || (!metrics && !layout())) return Promise.resolve({ completed: false });
    let start = fromX ?? (pose && state !== 'peeking' ? pose.x : metrics.minX);
    start = clamp(start, metrics.minX, metrics.maxX);
    let target = toX ?? (distance !== undefined ? start + distance : distanceH !== undefined ? start + distanceH * metrics.S : metrics.narratorX);
    target = clamp(target, start, metrics.maxX); // nunca hacia atrás: los cuadros miran a la derecha y no se espejan
    const next = () => endState || queuedState || lastLoopState;
    const { act } = beginTimeline('walk', 'walking', {
      build: () => buildWalk(config, manifest, metrics, start, target, { reduced: reduced(), endFrame: endFrameFor(next()) }),
      onDone: tl => { const n = next(); queuedState = null; startLoop(n, tl.endX); },
    });
    return act.promise;
  }

  /** Reacción puntual (brinco de alegría). Al terminar vuelve al estado anterior. */
  function react() {
    if (destroyed || (!metrics && !layout())) return Promise.resolve({ completed: false });
    if (state === 'intro' || state === 'walking' || state === 'peeking') return Promise.resolve({ completed: false, reason: 'busy' });
    if (state === 'reacting') return activity.promise;
    const back = LOOP_STATES.includes(state) ? state : lastLoopState;
    const x = state === 'hidden' ? metrics.narratorX : currentX();
    const fromFrame = pose?.frame || endFrameFor(back);
    const { act } = beginTimeline('react', 'reacting', {
      build: () => buildReaction(config, metrics, x, fromFrame, { reduced: reduced() }),
      onDone: () => { const n = queuedState || back; queuedState = null; startLoop(n, x); },
    });
    return act.promise;
  }

  function pause() { if (paused || destroyed) return; paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; stage.dataset.paused = 'true'; }
  function resume() { if (!paused || destroyed) return; paused = false; stage.dataset.paused = 'false'; ensureLoop(); }

  /** Detiene cualquier animación y deja a Neptunito congelado donde está. */
  function stop() {
    if (destroyed) return;
    cancelActivity('stopped');
    queuedState = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (pose) {
      // Si quedó en el aire o encogido, se normaliza para no dejar una pose a medias.
      if (state === 'intro' || state === 'reacting' || state === 'walking') pose = { ...pose, y: 0, sx: 1, sy: 1, rot: 0, shadow: pose.shadow ? 1 : 0 };
      render();
    }
    changeState(pose ? 'stopped' : 'hidden');
  }

  /** Vuelve al estado inicial: oculto y listo para otra playIntro(). */
  function reset() {
    if (destroyed) return;
    cancelActivity('reset');
    queuedState = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    paused = false;
    stage.dataset.paused = 'false';
    phase = '';
    rng = createRng(config.seed);
    hide();
    changeState('hidden');
  }

  function destroy() {
    if (destroyed) return;
    cancelActivity('destroyed');
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver?.disconnect();
    motionQuery?.removeEventListener?.('change', onMotionChange);
    listeners.clear();
    for (const img of images.values()) img.removeAttribute('src');
    stage.remove();
    if (restorePosition) container.classList.remove('neptunito-host');
    state = 'destroyed';
  }

  /** Cambia la configuración en caliente (mezcla profunda) y recalcula. */
  function updateConfig(partial) {
    config = mergeConfig(config, partial);
    resolveEntryOrder(config.entryOrder);
    if (partial && 'seed' in partial) rng = createRng(config.seed);
    if (layout()) {
      activity?.rebuild?.(metrics);
      if (state !== 'hidden' && pose) { if (paused || !activity) render(); }
    }
    return config;
  }
  /** 'original' | 'swap3y6' | array 1-based de 8 elementos. */
  function setFrameOrder(order) { return updateConfig({ entryOrder: order }); }
  function setSpeed(value) { speed = clamp(Number(value) || 1, 0.05, 8); }
  /** Gancho de audio: nivel 0..1 que modula la energía del gesto de habla (opcional). */
  function setTalkingLevel(level) { talkLevel = clamp(Number(level) || 0, 0, 1.5); }

  /** Muestra un fotograma fijo (inspector de la demo / ajuste de anclas). */
  function showFrame(key, { x } = {}) {
    if (!manifest.frames[key]) throw new Error(`Fotograma desconocido: ${key}`);
    if (!metrics && !layout()) return;
    cancelActivity('inspect');
    const isPeek = manifest.frames[key].cutX === 0;
    pose = { frame: key, x: x ?? (isPeek ? metrics.edgeX - metrics.tuck : metrics.narratorX), y: 0, sx: 1, sy: 1, rot: 0, alpha: 1, shadow: isPeek ? 0 : 1, xfade: 0 };
    render();
    changeState('stopped');
  }

  function getDebugInfo() {
    return {
      state, phase, frame: view.frame, previousFrame: view.prev,
      x: pose ? pose.x : null, y: pose ? pose.y : null, scaleY: pose ? pose.sy : null,
      size: metrics ? metrics.S : null, clock, paused, speed,
      entryOrder: entryFrames(config).order, entryOrderName: entryFrames(config).name,
      holding: !!activity?.holding, reducedMotion: reduced(), queuedState,
    };
  }

  stage.setAttribute('aria-hidden', config.ariaHidden ? 'true' : 'false');
  if (!config.ariaHidden) { stage.setAttribute('role', 'img'); stage.setAttribute('aria-label', 'Neptunito, la mascota de NEPTUNI'); }
  stage.dataset.visible = 'false';
  stage.dataset.state = state;
  layout();

  return {
    ready,
    playIntro, continueIntro, skipIntro, playPeek, playJump, playWalk, react,
    setState, getState: () => state, getPhase: () => phase,
    pause, resume, stop, reset, destroy,
    isPaused: () => paused,
    on, off,
    updateConfig, getConfig: () => config, setFrameOrder, setSpeed, setTalkingLevel,
    showFrame, getDebugInfo, getMetrics: () => metrics,
    /** Avance manual del reloj (pruebas / captura cuadro a cuadro). */
    step,
    element: stage,
  };
}
