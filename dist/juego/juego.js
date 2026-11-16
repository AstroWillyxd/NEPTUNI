// NEPTUNI · Juego «Control desde la Tierra» (misión Sojourner / Mars Pathfinder) · v15
// Script clásico: funciona con el servidor local y también con doble clic.
// v15: plano 2D dibujado (terreno, cráteres, huellas), mando grande, tutorial guiado por Neptunito
//      y final con celebración. Las reglas, los niveles, los textos y las estrellas no cambian.
(function () {
  'use strict';

  var COLS = 11, ROWS = 8, RANGE = 4;          // 1 casilla ≈ 3 m → 4 casillas ≈ 12 m: zona de trabajo del juego.
  var LANDER = {x: 5, y: 3};
  var MAX_SLOTS = 12;
  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N, E, S, O
  var STEP_MS = 430;

  // Datos de las rocas: Space.com («Sojourner: The first successful Mars rover») y NASA/JPL.
  var LEVELS = [
    {
      name: 'Barnacle Bill', start: {x: 5, y: 4, d: 2}, target: {x: 5, y: 6},
      rocks: [[3, 5], [7, 4], [2, 3], [8, 2]],
      goal: 'Analiza la roca <b>Barnacle Bill</b> con el APXS.',
      hint: 'El APXS está atrás. Gira hasta darle la espalda a Barnacle Bill y acércate de reversa.',
      result: 'El APXS encontró más sílice en Barnacle Bill que en el suelo de alrededor.',
      fact: 'Barnacle Bill fue la primera roca que Sojourner analizó: estaba a pocos pasos del módulo.'
    },
    {
      name: 'Yogi', start: {x: 5, y: 4, d: 2}, target: {x: 8, y: 4},
      rocks: [[6, 4], [7, 3], [4, 6], [3, 4], [6, 1]],
      goal: 'Llega hasta la roca <b>Yogi</b> y analízala.',
      hint: 'Hay una roca justo al lado. Planifica un rodeo y termina de espaldas a Yogi.',
      result: 'Según los datos, Yogi parecía un basalto, aunque una capa de polvo pudo afectar la medición.',
      fact: 'El equipo bautizó muchas rocas con nombres de dibujos animados, como Yogi y Scooby-Doo.'
    },
    {
      name: 'Scooby-Doo', start: {x: 5, y: 4, d: 2}, target: {x: 2, y: 2},
      rocks: [[4, 4], [3, 3], [3, 5], [2, 4], [4, 2], [7, 5], [6, 6]],
      goal: 'Analiza <b>Scooby-Doo</b>, la roca más lejana del día.',
      hint: 'Scooby-Doo está lejos y rodeada de rocas. Si no te alcanzan las órdenes, envíalas en dos partes.',
      result: 'Scooby-Doo parecía estar formada por suelo compactado.',
      fact: 'En sus primeros siete días, Sojourner trabajó a unos 10 m del módulo. Su radio alcanzaba unos 100 m, pero todo lo que enviaba pasaba por Pathfinder.'
    }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var board = $('board'), things = $('things'), ghost = $('ghost'), pathEl = $('path'), tracksEl = $('tracks'), roverEl = $('rover'), tagEl = $('rover-tag');
  var level = 0, rover, queue = [], used = 0, busy = false, solved = false, starsByLevel = [];
  var running = null, runIdx = -1;   // órdenes en ejecución, para iluminar la casilla activa
  var rotation = 0;           // grados acumulados para que el giro sea suave
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function key(x, y) { return x + ',' + y; }
  function inRange(x, y) { var dx = x - LANDER.x, dy = y - LANDER.y; return Math.sqrt(dx * dx + dy * dy) <= RANGE + 1e-9; }
  function rockSet(L) { var s = {}; L.rocks.forEach(function (r) { s[key(r[0], r[1])] = 1; }); s[key(L.target.x, L.target.y)] = 1; return s; }

  // Qué pasa si el rover intenta moverse a (x, y)
  function blockReason(L, x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS || !inRange(x, y)) return 'range';
    if (x === LANDER.x && y === LANDER.y) return 'lander';
    if (rockSet(L)[key(x, y)]) return 'rock';
    return null;
  }
  function behindIsTarget(L, s) { var v = DIRS[s.d]; return s.x - v[0] === L.target.x && s.y - v[1] === L.target.y; }

  // Simula una lista de órdenes desde un estado
  function simulate(L, s0, cmds) {
    var s = {x: s0.x, y: s0.y, d: s0.d}, steps = [];
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i], ev = {cmd: c};
      if (c === 'L') s.d = (s.d + 3) % 4;
      else if (c === 'R') s.d = (s.d + 1) % 4;
      else if (c === 'F' || c === 'B') {
        var v = DIRS[s.d], k = c === 'F' ? 1 : -1, nx = s.x + v[0] * k, ny = s.y + v[1] * k;
        var why = blockReason(L, nx, ny);
        if (why) { ev.blocked = why; ev.at = {x: nx, y: ny}; ev.state = {x: s.x, y: s.y, d: s.d}; steps.push(ev); return {state: s, steps: steps, stopped: true}; }
        s.x = nx; s.y = ny;
      } else if (c === 'A') {
        ev.success = behindIsTarget(L, s);
        if (ev.success) { ev.state = {x: s.x, y: s.y, d: s.d}; steps.push(ev); return {state: s, steps: steps, solved: true}; }
      }
      ev.state = {x: s.x, y: s.y, d: s.d};
      steps.push(ev);
    }
    return {state: s, steps: steps};
  }

  // Menor número de órdenes posible (búsqueda en anchura), para las estrellas
  function optimal(L) {
    var start = L.start, seen = {}, q = [[start.x, start.y, start.d, 0]];
    seen[start.x + ',' + start.y + ',' + start.d] = 1;
    while (q.length) {
      var c = q.shift(), s = {x: c[0], y: c[1], d: c[2]};
      if (behindIsTarget(L, s)) return c[3] + 1;
      var nexts = [[s.x, s.y, (s.d + 3) % 4], [s.x, s.y, (s.d + 1) % 4]];
      [1, -1].forEach(function (k) { var v = DIRS[s.d], nx = s.x + v[0] * k, ny = s.y + v[1] * k; if (!blockReason(L, nx, ny)) nexts.push([nx, ny, s.d]); });
      nexts.forEach(function (n) { var id = n.join(','); if (!seen[id]) { seen[id] = 1; q.push([n[0], n[1], n[2], c[3] + 1]); } });
    }
    return Infinity;
  }
  window.NEPTUNI_GAME = {levels: LEVELS, optimal: optimal, simulate: simulate}; // usado por las pruebas

  function pct(n, total) { return (n / total * 100) + '%'; }
  function place(el, x, y) { el.style.left = pct(x, COLS); el.style.top = pct(y, ROWS); el.style.width = pct(1, COLS); el.style.height = pct(1, ROWS); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f1(n) { return Math.round(n * 10) / 10; }

  // ----- Terreno marciano dibujado una sola vez por día (decorativo: no cambia las reglas)
  function terrainSVG(seed) {
    var r = rng(seed), W = COLS * 100, H = ROWS * 100, o = [];
    o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs>' +
      '<radialGradient id="tg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#f6ad66"/><stop offset=".55" stop-color="#ea8b42"/><stop offset="1" stop-color="#c9622b"/></radialGradient>' +
      '<filter id="tb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>' +
      '<filter id="tn"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="' + seed + '"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .15  0 0 0 0 .05  0 0 0 .28 0"/></filter>' +
      '</defs><rect width="' + W + '" height="' + H + '" fill="url(#tg)"/>');
    // manchas de color (suelo más oscuro y polvo claro)
    for (var i = 0; i < 9; i++) o.push('<ellipse cx="' + f1(r() * W) + '" cy="' + f1(r() * H) + '" rx="' + f1(90 + r() * 170) + '" ry="' + f1(60 + r() * 110) + '" fill="' + (i % 3 ? '#c45a26' : '#ffd29b') + '" opacity="' + (i % 3 ? .38 : .32) + '" filter="url(#tb)"/>');
    o.push('<rect width="' + W + '" height="' + H + '" filter="url(#tn)"/>');
    // dunas: líneas onduladas del viento
    for (i = 0; i < 16; i++) {
      var x = r() * W, y = r() * H, len = 70 + r() * 140;
      o.push('<path d="M' + f1(x) + ' ' + f1(y) + 'q' + f1(len / 2) + ' ' + f1(-14 - r() * 10) + ' ' + f1(len) + ' 0" fill="none" stroke="#ffe3bd" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>');
      o.push('<path d="M' + f1(x + 4) + ' ' + f1(y + 6) + 'q' + f1(len / 2) + ' ' + f1(-12 - r() * 8) + ' ' + f1(len - 8) + ' 0" fill="none" stroke="#a9481f" stroke-opacity=".22" stroke-width="2.5" stroke-linecap="round"/>');
    }
    // risco en una esquina, como el borde de una meseta
    o.push('<path d="M0 ' + (H - 190) + 'C120 ' + (H - 205) + ' 180 ' + (H - 120) + ' 290 ' + (H - 80) + 'S420 ' + (H - 10) + ' 470 ' + H + 'H0Z" fill="#a8471f" opacity=".85"/>' +
      '<path d="M0 ' + (H - 190) + 'C120 ' + (H - 205) + ' 180 ' + (H - 120) + ' 290 ' + (H - 80) + 'S420 ' + (H - 10) + ' 470 ' + H + '" fill="none" stroke="#ffcf98" stroke-opacity=".7" stroke-width="5"/>' +
      '<path d="M' + (W - 330) + ' 0C' + (W - 300) + ' 70 ' + (W - 180) + ' 60 ' + (W - 120) + ' 120S' + (W - 30) + ' 150 ' + W + ' 140V0Z" fill="#b8532a" opacity=".7"/>' +
      '<path d="M' + (W - 330) + ' 0C' + (W - 300) + ' 70 ' + (W - 180) + ' 60 ' + (W - 120) + ' 120S' + (W - 30) + ' 150 ' + W + ' 140" fill="none" stroke="#ffd6a6" stroke-opacity=".55" stroke-width="4"/>');
    // cráteres: borde claro arriba a la izquierda, sombra abajo a la derecha
    for (i = 0; i < 6; i++) {
      var cx = 40 + r() * (W - 80), cy = 40 + r() * (H - 80), rr = 14 + r() * 26;
      o.push('<g opacity=".5"><ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rr * 1.15) + '" ry="' + f1(rr) + '" fill="#ffd2a0" opacity=".55"/>' +
        '<ellipse cx="' + f1(cx + 3) + '" cy="' + f1(cy + 3) + '" rx="' + f1(rr * .98) + '" ry="' + f1(rr * .84) + '" fill="#b6532a"/>' +
        '<ellipse cx="' + f1(cx + 7) + '" cy="' + f1(cy + 7) + '" rx="' + f1(rr * .7) + '" ry="' + f1(rr * .58) + '" fill="#d77a3a"/></g>');
    }
    // piedritas
    for (i = 0; i < 170; i++) {
      var px = r() * W, py = r() * H, pr = 1.5 + r() * 4.5;
      o.push('<ellipse cx="' + f1(px) + '" cy="' + f1(py) + '" rx="' + f1(pr * 1.3) + '" ry="' + f1(pr) + '" fill="' + (r() > .5 ? '#8f3a17' : '#b4552a') + '" opacity="' + f1(.45 + r() * .4) + '"/>');
      if (pr > 4) o.push('<ellipse cx="' + f1(px - 1) + '" cy="' + f1(py - 1.5) + '" rx="' + f1(pr * .6) + '" ry="' + f1(pr * .4) + '" fill="#ffd8ad" opacity=".6"/>');
    }
    // rejilla del plano: líneas suaves y cruces en cada esquina de casilla
    var g = '';
    for (i = 1; i < COLS; i++) g += 'M' + i * 100 + ' 0V' + H;
    for (i = 1; i < ROWS; i++) g += 'M0 ' + i * 100 + 'H' + W;
    o.push('<path d="' + g + '" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>');
    var c = '';
    for (i = 1; i < COLS; i++) for (var j = 1; j < ROWS; j++) c += 'M' + (i * 100 - 7) + ' ' + j * 100 + 'h14M' + i * 100 + ' ' + (j * 100 - 7) + 'v14';
    o.push('<path d="' + c + '" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>');
    o.push('</svg>');
    return o.join('');
  }

  // Rocas con caras iluminadas (luz arriba a la izquierda)
  function rockSVG(seed, big) {
    var r = rng(seed * 97 + 13), n = 7, pts = [], top = [], sc = big ? 1.08 : .78 + r() * .22;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 + r() * .4, rad = (30 + r() * 10) * sc;
      pts.push([50 + Math.cos(a) * rad, 52 + Math.sin(a) * rad * .82]);
      top.push([46 + Math.cos(a) * rad * .62, 46 + Math.sin(a) * rad * .5]);
    }
    var P = function (a) { return a.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' '); };
    var base = big ? '#b0602a' : '#7c3416', mid = big ? '#d98b3a' : '#a9502a', hi = big ? '#ffd27a' : '#d4824e';
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="58" cy="80" rx="' + f1(36 * sc) + '" ry="' + f1(10 * sc) + '" fill="rgba(70,20,8,.38)"/>' +
      '<polygon points="' + P(pts) + '" fill="' + base + '" stroke="' + (big ? '#ffc300' : '#4e1e0c') + '" stroke-width="' + (big ? 4 : 2.5) + '" stroke-linejoin="round"/>' +
      '<polygon points="' + P(top) + '" fill="' + mid + '"/>' +
      '<polygon points="' + P(top.slice(3, 6).concat([[46, 46]])) + '" fill="' + hi + '" opacity=".8"/></svg>';
  }

  // Módulo Pathfinder visto desde arriba: base, tres pétalos con paneles solares y bolsas de aire
  var LANDER_SVG = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<ellipse cx="54" cy="58" rx="46" ry="38" fill="rgba(70,20,8,.3)"/>' +
    '<g fill="#f4ede2" stroke="#28161a" stroke-width="1.6"><circle cx="50" cy="10" r="7"/><circle cx="90" cy="78" r="7"/><circle cx="10" cy="78" r="7"/></g>' +
    '<g stroke="#28161a" stroke-width="2.5" stroke-linejoin="round"><polygon points="50,12 70,46 30,46" fill="#3a2a2e"/><polygon points="70,46 88,76 50,76" fill="#3a2a2e"/><polygon points="30,46 50,76 12,76" fill="#3a2a2e"/>' +
    '<polygon points="30,46 70,46 50,76" fill="#fefefe"/></g>' +
    '<path d="M50 20V40M43 32h14M70 55l-6 12M76 62h-14M30 55l6 12M24 62h14" stroke="#ffc300" stroke-opacity=".75" stroke-width="1.5"/>' +
    '<circle cx="50" cy="56" r="8" fill="#e2011c" stroke="#fff" stroke-width="2.5"/><circle cx="50" cy="56" r="2.6" fill="#fff"/></svg>';

  // ----- Neptunito: el mismo personaje de la portada. Cambia de pose y se mueve por la interfaz (nunca por el plano)
  var IMG = {
    think: '../assets/neptunito/neptunito-think.png', explain: '../assets/neptunito/neptunito-explain.png', wave: '../assets/neptunito/neptunito-wave.png',
    point: '../neptunito-anim/assets/gestos/gestos_04.png', cheer: '../neptunito-anim/assets/gestos/gestos_06.png', open: '../neptunito-anim/assets/gestos/gestos_15.png'
  };
  var WALK = [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '../neptunito-anim/assets/caminata/caminata_0' + n + '.png'; });
  var ENTER = [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '../neptunito-anim/assets/entrada/entrada_0' + n + '.png'; });
  WALK.concat(ENTER, [IMG.point, IMG.cheer, IMG.open]).forEach(function (src) { var i = new Image(); i.src = src; });

  function nep(pose, anim) {
    var box = $('nep'), img = $('nep-img');
    if (pose && img.getAttribute('src') !== IMG[pose]) img.setAttribute('src', IMG[pose]);
    box.className = 'g-nep';
    if (anim && !reduced) { void box.offsetWidth; box.classList.add('g-nep-' + anim); }
  }
  function say(text, pose, anim) {
    var p = $('guide');
    p.textContent = text;
    p.classList.remove('g-say-flash'); void p.offsetWidth; p.classList.add('g-say-flash');
    if (pose) nep(pose, anim);
  }

  function drawLevel() {
    var L = LEVELS[level];
    $('terrain').innerHTML = terrainSVG(11 + level * 7);
    things.innerHTML = '';
    var lander = document.createElement('div');
    lander.className = 'g-lander'; place(lander, LANDER.x, LANDER.y);
    lander.innerHTML = LANDER_SVG + '<span>Pathfinder</span>';
    things.appendChild(lander);
    L.rocks.forEach(function (r, i) {
      var el = document.createElement('div'); el.className = 'g-rock'; place(el, r[0], r[1]); el.innerHTML = rockSVG(i + level * 5 + 1, false); things.appendChild(el);
    });
    var t = document.createElement('div');
    t.className = 'g-target'; place(t, L.target.x, L.target.y);
    t.innerHTML = rockSVG(40 + level, true) + '<span>' + L.name + '</span>';
    things.appendChild(t);
    var r = $('range');
    r.style.left = pct(LANDER.x + .5 - RANGE, COLS); r.style.top = pct(LANDER.y + .5 - RANGE, ROWS);
    r.style.width = pct(RANGE * 2, COLS); r.style.height = pct(RANGE * 2, ROWS);
    $('day-label').textContent = 'Día ' + (level + 1) + ' de ' + LEVELS.length;
    $('day-title').textContent = L.name;
    $('day-goal').innerHTML = L.goal;
    say(L.hint, 'think', 'walk');
  }

  // La etiqueta sube si debajo del rover hay un punto de la vista previa, una roca o el módulo (y su etiqueta)
  function tagShouldGoUp(seen) {
    if (!rover || rover.y === 0) return false;
    var L = LEVELS[level], x = rover.x, y = rover.y + 1;
    return !!(seen[key(x, y)] || rockSet(L)[key(x, y)] || (x === LANDER.x && (y === LANDER.y || y + 1 === LANDER.y)));
  }
  // Etiqueta «Sojourner»: debajo del rover; encima si una casilla de la vista previa queda justo debajo
  function placeTag(s) {
    var up = tagEl.classList.contains('g-tag-up');
    tagEl.style.left = pct(s.x + .5, COLS); tagEl.style.top = pct(up ? s.y : s.y + 1, ROWS);
  }

  function setRover(s, animate) {
    var target = s.d * 90, diff = ((target - rotation) % 360 + 540) % 360 - 180;
    rotation += diff;
    roverEl.style.transition = tagEl.style.transition = animate && !reduced ? '' : 'none';
    place(roverEl, s.x, s.y);
    if (busy) tagEl.classList.toggle('g-tag-up', tagShouldGoUp({}));
    placeTag(s);
    roverEl.style.transform = 'rotate(' + rotation + 'deg)';
    // el rover del centro del mando gira igual que el del plano
    var core = document.querySelector('.g-pad-core svg'); if (core) core.style.transform = 'rotate(' + rotation + 'deg)';
    if (!animate) { void roverEl.offsetWidth; roverEl.style.transition = tagEl.style.transition = ''; }
  }

  // Huellas de las ruedas por donde pasó Sojourner
  function addTrack(a, b) {
    var x1 = (a.x + .5) * 100, y1 = (a.y + .5) * 100, x2 = (b.x + .5) * 100, y2 = (b.y + .5) * 100;
    var horiz = y1 === y2;
    [-22, 22].forEach(function (o) {
      var l = document.createElementNS(SVGNS, 'line');
      l.setAttribute('x1', horiz ? x1 : x1 + o); l.setAttribute('y1', horiz ? y1 + o : y1);
      l.setAttribute('x2', horiz ? x2 : x2 + o); l.setAttribute('y2', horiz ? y2 + o : y2);
      tracksEl.appendChild(l);
    });
  }

  var LABEL = {F: 'Avanzar', B: 'Retroceder', L: 'Girar izq.', R: 'Girar der.', A: 'APXS'};
  var ICON = {
    F: '<path d="M12 20V5M5 12l7-7 7 7"/>',
    B: '<path d="M12 4v15M5 12l7 7 7-7"/>',
    L: '<path d="M9 4L4 9l5 5"/><path d="M4 9h9a7 7 0 0 1 0 14h-2"/>',
    R: '<path d="M15 4l5 5-5 5"/><path d="M20 9h-9a7 7 0 0 0 0 14h2"/>',
    A: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/>'
  };
  function icon(c) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[c] + '</svg>'; }

  // Las 12 casillas siempre están a la vista; tocar una casilla llena quita esa orden.
  function renderQueue() {
    var q = $('queue'), list = busy && running ? running : queue, html = '';
    for (var i = 0; i < MAX_SLOTS; i++) {
      var c = list[i];
      if (c) {
        var cls = 'q-' + c + ' q-filled' + (busy ? (i < runIdx ? ' q-done' : i === runIdx ? ' q-run' : '') : '');
        html += '<li class="' + cls + '" data-n="' + (i + 1) + '" data-i="' + i + '"' + (busy ? '' : ' role="button" tabindex="0" title="' + LABEL[c] + ' · Quitar"') + '>' + icon(c) + '</li>';
      } else html += '<li data-n="' + (i + 1) + '"></li>';
    }
    q.innerHTML = html;
    $('queue-hint').hidden = !!list.length;
    $('slots').textContent = queue.length + ' / ' + MAX_SLOTS;
    $('send').disabled = busy || solved || !queue.length;
    $('undo').disabled = $('clear').disabled = busy || !queue.length;
    Array.prototype.forEach.call(document.querySelectorAll('.g-cmd'), function (b) { b.disabled = busy || solved || queue.length >= MAX_SLOTS; });
    $('stats').textContent = 'Órdenes enviadas en este día: ' + used;
    drawGhost();
  }

  // Vista previa: línea punteada y puntos numerados por donde pasaría el rover
  function drawGhost() {
    ghost.innerHTML = ''; pathEl.innerHTML = ''; tagEl.classList.toggle('g-tag-up', !!rover && tagShouldGoUp({}));
    if (busy || !queue.length) { if (rover) placeTag(rover); return; }
    var sim = simulate(LEVELS[level], rover, queue);
    var seen = {}, pts = [[(rover.x + .5) * 100, (rover.y + .5) * 100]], last = null;
    sim.steps.forEach(function (ev, i) {
      if (ev.blocked) {
        var x = document.createElement('div'); x.className = 'g-ghost-x'; place(x, ev.at.x, ev.at.y);
        if (ev.at.x >= 0 && ev.at.y >= 0 && ev.at.x < COLS && ev.at.y < ROWS) ghost.appendChild(x);
        return;
      }
      var k = key(ev.state.x, ev.state.y);
      if (ev.state.x !== rover.x || ev.state.y !== rover.y) {
        var p = pts[pts.length - 1];
        if (p[0] !== (ev.state.x + .5) * 100 || p[1] !== (ev.state.y + .5) * 100) pts.push([(ev.state.x + .5) * 100, (ev.state.y + .5) * 100]);
      }
      if (seen[k] || (ev.state.x === rover.x && ev.state.y === rover.y)) return;
      seen[k] = 1;
      var d = document.createElement('div'); d.className = 'g-ghost-dot'; place(d, ev.state.x, ev.state.y); d.textContent = i + 1; ghost.appendChild(d); last = d;
    });
    if (last) last.classList.add('g-ghost-end');
    tagEl.classList.toggle('g-tag-up', tagShouldGoUp(seen)); placeTag(rover);
    if (pts.length > 1) {
      var pl = document.createElementNS(SVGNS, 'polyline');
      pl.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
      pathEl.appendChild(pl);
    }
  }

  function add(c) {
    if (busy || solved || queue.length >= MAX_SLOTS) return;
    if (tut.on && !tutAccepts(c)) return;
    queue.push(c); renderQueue();
    var b = document.querySelector('.g-cmd[data-cmd="' + c + '"]');
    if (b && !reduced) { b.classList.remove('g-pop-ok'); void b.offsetWidth; b.classList.add('g-pop-ok'); clearTimeout(b._pop); b._pop = setTimeout(function () { b.classList.remove('g-pop-ok'); }, 650); }
    if (tut.on) tutEvent('add', c);
  }
  function removeAt(i) {
    if (busy || i < 0 || i >= queue.length) return;
    queue.splice(i, 1); renderQueue();
    if (tut.on) tutEvent('remove');
  }

  function startLevel(i) {
    level = i; queue = []; used = 0; solved = false; busy = false; running = null; runIdx = -1;
    rover = {x: LEVELS[i].start.x, y: LEVELS[i].start.y, d: LEVELS[i].start.d};
    tracksEl.innerHTML = ''; clearTimeout(toastTimer); $('toast').hidden = true;
    drawLevel(); setRover(rover, false); renderQueue();
    board.classList.remove('g-laser', 'g-lost');
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }

  function send() {
    if (busy || solved || !queue.length || tut.on) return;
    var L = LEVELS[level], cmds = queue.slice();
    busy = true; used += cmds.length; queue = []; running = cmds; runIdx = -1; renderQueue();
    var sig = $('signal');
    $('signal-text').textContent = 'Las órdenes viajan a Marte por radio. Durante la misión tardaban entre 10 y 15 minutos en llegar; aquí lo aceleramos.';
    sig.hidden = false;
    nep('explain', 'nod');
    toast('send', 'point');
    wait(2600).then(function () {
      sig.hidden = true;
      var sim = simulate(L, rover, cmds), chain = Promise.resolve();
      sim.steps.forEach(function (ev, idx) {
        chain = chain.then(function () {
          runIdx = idx; renderQueue();
          if (ev.blocked) {
            board.classList.add(ev.blocked === 'range' ? 'g-lost' : 'g-laser');
            say(ev.blocked === 'range' ? 'Sojourner se detuvo: ahí habría salido de la zona de trabajo cerca del módulo (12 m en el juego).'
              : ev.blocked === 'lander' ? 'Sojourner se detuvo: el módulo Pathfinder estaba en el camino.'
              : 'Los láseres de Sojourner detectaron una roca y lo detuvieron. Se cancelaron las órdenes que faltaban.', 'think', 'nod');
            toast('fail', 'open');
            return wait(1400).then(function () { board.classList.remove('g-laser', 'g-lost'); });
          }
          if (ev.state.x !== rover.x || ev.state.y !== rover.y) addTrack(rover, ev.state);
          rover = ev.state; setRover(rover, true);
          if (ev.cmd === 'A') {
            roverEl.classList.remove('g-scan'); void roverEl.offsetWidth; roverEl.classList.add('g-scan');
            if (!ev.success) { say('El APXS no tocó ninguna roca. Recuerda: está en la parte trasera y debe quedar pegado a la roca objetivo.', 'think', 'nod'); toast('fail', 'open'); }
            return wait(900);
          }
          return wait(STEP_MS);
        });
      });
      chain.then(function () {
        busy = false; running = null; runIdx = -1;
        if (sim.solved) { solved = true; nep('cheer', 'hop'); renderQueue(); return finishLevel(); }
        if (!sim.stopped && !sim.steps.some(function (e) { return e.cmd === 'A'; })) say('Sojourner terminó tus órdenes y espera las siguientes. Puedes seguir desde aquí.', 'explain');
        renderQueue();
      });
    });
  }

  function starsHTML(n, total) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<span class="' + (i < n ? 'on' : '') + '" style="--i:' + i + '">★</span>';
    return h;
  }

  function finishLevel() {
    var L = LEVELS[level], best = optimal(L);
    var stars = used <= best ? 3 : used <= best + 3 ? 2 : 1;
    starsByLevel[level] = stars;
    var praise = pick('win' + stars);
    $('toast-text').textContent = ''; $('result-cheer').textContent = praise;
    $('toast').hidden = false; $('toast-text').textContent = praise; $('toast-img').setAttribute('src', IMG.cheer); $('toast').className = 'g-toast g-toast-win on';
    say(praise, 'cheer', 'hop');
    $('result-title').textContent = L.name + ' analizada';
    $('result-stars').innerHTML = starsHTML(stars, 3);
    $('result-stars').setAttribute('aria-label', stars + ' de 3 estrellas');
    $('result-text').textContent = L.result + ' Usaste ' + used + ' órdenes; lo mínimo posible era ' + best + '.';
    $('result-fact').innerHTML = '<b>¿Sabías que…?</b> ' + L.fact;
    $('next').textContent = level < LEVELS.length - 1 ? 'Siguiente día →' : 'Ver mi certificado →';
    var dlg = $('result');
    setTimeout(function () { $('toast').hidden = true; $('toast').classList.remove('on'); if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }, reduced ? 0 : 1600);
  }

  function closeResult() { var d = $('result'); if (d.close) d.close(); else d.removeAttribute('open'); }

  function confetti() {
    if (reduced) return;
    var box = $('confetti'), colors = ['#e2011c', '#ffc300', '#f26a0f', '#fefefe', '#a30016', '#ffd54a'], h = '';
    for (var i = 0; i < 90; i++) {
      h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % colors.length] + ';--dx:' + ((Math.random() - .5) * 240).toFixed(0) + 'px;--r:' + (360 + Math.random() * 720).toFixed(0) + 'deg;animation-duration:' + (2.4 + Math.random() * 2.2).toFixed(2) + 's;animation-delay:' + (Math.random() * .9).toFixed(2) + 's;' + (i % 4 ? '' : 'border-radius:50%;width:12px;height:12px;') + '"></i>';
    }
    box.innerHTML = h;
    setTimeout(function () { box.innerHTML = ''; }, 6000);
  }

  function showEnd() {
    $('play').hidden = true; $('end').hidden = false;
    var total = starsByLevel.reduce(function (a, b) { return a + (b || 0); }, 0);
    $('cert-stars').innerHTML = starsHTML(total, 9);
    $('cert-total').textContent = total + ' de 9 estrellas · ' + new Date().toLocaleDateString('es-PE', {day: 'numeric', month: 'long', year: 'numeric'});
    $('end-days').innerHTML = LEVELS.map(function (L, i) {
      var s = starsByLevel[i] || 0, st = '';
      for (var k = 0; k < 3; k++) st += '<span class="' + (k < s ? 'on' : '') + '">★</span>';
      return '<li style="--i:' + i + '"><span class="d">Día ' + (i + 1) + '</span><b>' + L.name + '</b><span class="s" aria-label="' + s + ' de 3 estrellas">' + st + '</span></li>';
    }).join('');
    window.scrollTo(0, 0);
    confetti();
  }

  // Respuesta visual del botón cuando la orden llega por teclado
  function press(c) {
    var b = document.querySelector('.g-cmd[data-cmd="' + c + '"]');
    if (!b) return;
    b.classList.add('g-press'); setTimeout(function () { b.classList.remove('g-press'); }, 160);
  }

  // ===== Ánimo de Neptunito: frases que celebran el logro y animan después de un error ==========
  var CHEER = {
    win3: ['¡Yay, lo lograste con el mínimo de órdenes! ¡Eres un genio de la planificación!', '¡Increíble! Plan perfecto. ¡Estoy muy orgulloso de ti!', '¡Wow! Ni una orden de más. ¡Piensas como el equipo de control de una misión!'],
    win2: ['¡Yay, lo lograste! Estoy muy orgulloso de ti.', '¡Bien hecho! Tu plan funcionó. ¿Te animas a hacerlo con menos órdenes?', '¡Lo lograste! Cada día planificas mejor.'],
    win1: ['¡Lo lograste! Lo importante es que no te rendiste. ¡Estoy orgulloso de ti!', '¡Misión cumplida! Cada intento te hizo mejor. ¡Sigue así!', '¡Yay, lo lograste! Practicar es el secreto de los grandes exploradores.'],
    fail: ['¡No pasa nada! Equivocarse también es aprender. ¡Tú puedes!', 'Respira, revisa la línea punteada y vuelve a intentarlo. ¡Confío en ti!', '¡Casi! Cada intento te acerca a la meta.', 'Los errores son pistas: ahora ya sabes qué cambiar. ¡Vamos otra vez!'],
    send: ['¡Allá van tus órdenes! Buen trabajo planificando.', '¡Enviado! Veamos qué tan bien lo planeaste.', '¡Buen plan! Crucemos los dedos.']
  };
  var lastCheer = {};
  function pick(kind) {
    var list = CHEER[kind], i;
    do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === lastCheer[kind]);
    lastCheer[kind] = i; return list[i];
  }
  var toastTimer = 0;
  function toast(kind, pose) {
    var t = $('toast');
    $('toast-text').textContent = pick(kind);
    $('toast-img').setAttribute('src', IMG[pose || 'cheer']);
    t.className = 'g-toast g-toast-' + (kind === 'fail' ? 'fail' : kind === 'send' ? 'send' : 'win');
    t.hidden = false; void t.offsetWidth; t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.hidden = true; }, 300); }, kind === 'send' ? 2300 : 3600);
  }

  // ===== Tutorial con Neptunito =====================================================
  // Neptunito camina por la interfaz, señala cada parte y pide dos acciones de prueba.
  var TUT_KEY = 'nx-game-tut-v1';
  var STEPS = [
    {pose: 'wave', enter: true, text: '¡Hola! Soy Neptunito. Hoy tú y yo somos el equipo que maneja a Sojourner desde la Tierra. ¿Te enseño a jugar?', btn: '¡Sí, vamos!'},
    {el: '#rover', pad: 18, round: true, pose: 'explain', text: 'Este es Sojourner visto desde arriba. El triángulo rojo es su frente y el círculo amarillo de atrás es el APXS, el instrumento que analiza las rocas.'},
    {el: '.g-target', pad: 22, round: true, pose: 'point', text: 'Esta es la roca que hay que analizar hoy. Truco: como el APXS va atrás, Sojourner tiene que llegar de espaldas a la roca, pegado a ella.'},
    {el: '#range', pad: 6, round: true, pose: 'open', text: 'En el centro está el módulo Pathfinder. Sojourner solo puede moverse dentro del círculo punteado: su zona de trabajo de 12 m.'},
    {el: '.g-palette', alt: '.g-pad', pad: 10, pose: 'point', wait: 'add', cmd: 'R', text: 'Estos son tus mandos. Cada botón agrega una orden a tu plan.', task: 'Prueba: toca el botón «Girar derecha».', ok: '¡Muy bien! La orden se guardó en tu programa. Sojourner todavía no se mueve: primero se planifica.'},
    {el: '.g-program', pad: 8, pose: 'explain', wait: 'empty', text: 'Aquí se arma tu programa: caben hasta 12 órdenes. Si te equivocas, toca una orden para quitarla.', task: 'Ahora toca la orden que pusiste para quitarla.', ok: '¡Perfecto! También puedes usar «Borrar última» o «Borrar todo».'},
    {el: '#send', pad: 8, pose: 'think', text: 'Cuando tu plan esté listo, toca «Enviar a Marte». Antes de enviar, mira la línea punteada del mapa: muestra por dónde pasará Sojourner.'},
    {el: '.g-keys', pad: 8, pose: 'wave', desktop: true, text: '¿Juegas en computadora? También puedes usar el teclado: las flechas para moverte, A para analizar y Enter para enviar.'},
    {pose: 'cheer', text: '¡Listo, ya sabes lo necesario! Tu primera misión: analizar la roca Barnacle Bill. Si necesitas ayuda, toca «Ver tutorial» cuando quieras.', btn: '¡A jugar!'}
  ];
  var tut = {on: false, i: 0, done: false, steps: [], timer: 0, walkTimer: 0, pos: null};
  var tutEl = $('tut'), spot = $('tut-spot'), card = $('tut-card'), tImg = $('tut-img'), tNep = $('tut-nep');

  function visible(el) { return el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'; }
  function tutAccepts(c) { var s = tut.steps[tut.i]; return !!(s && s.wait === 'add' && !tut.done && c === s.cmd); }

  function tutStart() {
    if (busy) return;
    tut.steps = STEPS.filter(function (s) { return !s.desktop || visible(document.querySelector(s.el)); });
    tut.on = true; tut.pos = null;
    if (queue.length) { queue = []; renderQueue(); }
    document.body.classList.add('g-tutoring');
    tutEl.hidden = false;
    tutGo(0);
  }

  function tutEnd() {
    tut.on = false;
    clearInterval(tut.walkTimer); clearTimeout(tut.timer);
    document.body.classList.remove('g-tutoring');
    Array.prototype.forEach.call(document.querySelectorAll('.g-tut-allow'), function (e) { e.classList.remove('g-tut-allow'); });
    tutEl.hidden = true; tutEl.classList.remove('has-spot');
    try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {}
    if (queue.length) { queue = []; renderQueue(); }
    say(LEVELS[level].hint, 'think', 'walk');
    if (isSmall()) focusBoard(); else window.scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'});
    $('tut-open').focus({preventScroll: true});
  }

  function setPose(src) { if (tImg.getAttribute('src') !== src) tImg.setAttribute('src', src); }
  function playFrames(frames, ms, then) {
    clearInterval(tut.walkTimer);
    if (reduced) { then(); return; }
    var k = 0;
    setPose(frames[0]);
    tut.walkTimer = setInterval(function () {
      k++;
      if (k >= frames.length) { clearInterval(tut.walkTimer); then(); return; }
      setPose(frames[k]);
    }, ms);
  }

  function tutGo(i) {
    var s = tut.steps[i];
    tut.i = i; tut.done = false;
    Array.prototype.forEach.call(document.querySelectorAll('.g-tut-allow'), function (e) { e.classList.remove('g-tut-allow'); });
    var dots = '';
    for (var k = 0; k < tut.steps.length; k++) dots += '<i class="' + (k <= i ? 'on' : '') + '"></i>';
    $('tut-step').innerHTML = dots + ' <span>Paso ' + (i + 1) + ' de ' + tut.steps.length + '</span>';
    var t = $('tut-text'); t.innerHTML = s.text; t.classList.remove('g-say-flash'); void t.offsetWidth; t.classList.add('g-say-flash');
    var task = $('tut-task'); task.hidden = !s.task; task.className = 'g-tut-task'; task.textContent = s.task || '';
    var next = $('tut-next'); next.hidden = !!s.wait; next.textContent = s.btn || (i === tut.steps.length - 1 ? '¡A jugar!' : 'Siguiente');
    $('tut-skip').hidden = i === tut.steps.length - 1;
    var el = s.el ? document.querySelector(s.el) : null;
    if (el && !el.getClientRects().length && s.alt) el = document.querySelector(s.alt);
    if (el && s.wait) {
      el.classList.add('g-tut-allow');
      if (s.wait === 'empty') document.querySelectorAll('#queue, #undo, #clear').forEach(function (e) { e.classList.add('g-tut-allow'); });
    }
    if (el) {
      if (!(isSmall() && programEl.contains(el))) el.scrollIntoView({block: isSmall() ? 'center' : 'nearest', behavior: reduced ? 'auto' : 'smooth'});
      clearTimeout(tut.timer);
      tut.timer = setTimeout(function () { tutPlace(s, el); }, reduced ? 0 : 420);
    } else tutPlace(s, null);
    if (!s.wait) setTimeout(function () { next.focus({preventScroll: true}); }, 50);
  }

  function tutPlace(s, el) {
    var vw = window.innerWidth, vh = window.innerHeight, cw = card.offsetWidth, ch = card.offsetHeight, m = 12, x, y;
    if (el) {
      var r = el.getBoundingClientRect(), p = s.pad || 8;
      tutEl.classList.add('has-spot');
      spot.style.left = (r.left - p) + 'px'; spot.style.top = (r.top - p) + 'px';
      spot.style.width = (r.width + p * 2) + 'px'; spot.style.height = (r.height + p * 2) + 'px';
      spot.style.borderRadius = s.round ? '50%' : '22px';
      if (vw <= 900) {
        x = (vw - cw) / 2;
        var cy = r.top + r.height / 2;
        y = cy > vh / 2 ? Math.max(m, r.top - p - ch - 14) : Math.min(vh - ch - m, r.bottom + p + 14);
        if (y < m) y = m;
        if (y + ch > vh - m) y = vh - ch - m;
      } else {
        var opts = [
          [r.right + p + 18, r.top + r.height / 2 - ch / 2],
          [r.left - p - 18 - cw, r.top + r.height / 2 - ch / 2],
          [r.left + r.width / 2 - cw / 2, r.bottom + p + 16],
          [r.left + r.width / 2 - cw / 2, r.top - p - 16 - ch]
        ];
        var best = null;
        opts.forEach(function (o) {
          var fits = o[0] >= m && o[0] + cw <= vw - m && o[1] >= m && o[1] + ch <= vh - m;
          if (fits && !best) best = o;
        });
        if (!best) best = [Math.min(vw - cw - m, Math.max(m, r.right - cw)), vh - ch - m];
        x = best[0]; y = Math.min(vh - ch - m, Math.max(m, best[1]));
      }
    } else {
      tutEl.classList.remove('has-spot');
      x = (vw - cw) / 2; y = (vh - ch) / 2;
    }
    var moved = tut.pos && (Math.abs(tut.pos[0] - x) > 30 || Math.abs(tut.pos[1] - y) > 30);
    tNep.classList.toggle('flip', !!(moved && x < tut.pos[0]));
    card.style.left = x + 'px'; card.style.top = y + 'px';
    var finish = function () { tNep.classList.remove('flip'); setPose(IMG[s.pose]); tNep.classList.remove('hop'); void tNep.offsetWidth; if (!reduced) tNep.classList.add('hop'); };
    if (s.enter && !tut.pos) playFrames(ENTER, 90, finish);
    else if (moved) playFrames(WALK.concat(WALK.slice(0, 1)), 80, finish);
    else finish();
    tut.pos = [x, y];
  }

  function tutEvent(type, c) {
    var s = tut.steps[tut.i];
    if (!s || tut.done) return;
    if ((s.wait === 'add' && type === 'add' && c === s.cmd) || (s.wait === 'empty' && type === 'remove' && !queue.length)) {
      tut.done = true;
      var task = $('tut-task'); task.textContent = '✓ ' + s.ok; task.className = 'g-tut-task ok';
      setPose(IMG.cheer); tNep.classList.remove('hop'); void tNep.offsetWidth; if (!reduced) tNep.classList.add('hop');
      var next = $('tut-next'); next.hidden = false; next.focus({preventScroll: true});
      // el foco ya no es solo del mando: se puede avanzar
      Array.prototype.forEach.call(document.querySelectorAll('.g-tut-allow'), function (e) { e.classList.remove('g-tut-allow'); });
    }
  }

  $('tut-next').addEventListener('click', function () { if (tut.i >= tut.steps.length - 1) tutEnd(); else tutGo(tut.i + 1); });
  $('tut-skip').addEventListener('click', tutEnd);
  $('tut-open').addEventListener('click', tutStart);
  function tutTarget(s) { var el = s.el ? document.querySelector(s.el) : null; if (el && !el.getClientRects().length && s.alt) el = document.querySelector(s.alt); return el; }
  window.addEventListener('resize', function () { if (tut.on) { var s = tut.steps[tut.i]; tutPlace(s, tutTarget(s)); } });
  window.addEventListener('scroll', function () {
    if (!tut.on) return;
    var s = tut.steps[tut.i], el = tutTarget(s);
    if (el) { var r = el.getBoundingClientRect(), p = s.pad || 8; spot.style.left = (r.left - p) + 'px'; spot.style.top = (r.top - p) + 'px'; }
  }, {passive: true});

  // Celular: el mando pasa a la barra fija del pie y «Órdenes enviadas / Reiniciar» suben al panel
  var paletteEl = document.querySelector('.g-palette'), programEl = document.querySelector('.g-program'), sideEl = document.querySelector('.g-panel-side'), footEl = document.querySelector('.g-program-foot');
  function isSmall() { return window.innerWidth <= 900; }
  function placeDock() {
    if (isSmall()) {
      if (paletteEl.parentNode !== programEl) programEl.insertBefore(paletteEl, programEl.querySelector('.g-program-tools'));
      if (footEl.parentNode !== sideEl) sideEl.appendChild(footEl);
    } else {
      if (paletteEl.parentNode !== sideEl) sideEl.insertBefore(paletteEl, footEl.parentNode === sideEl ? footEl : null);
      if (footEl.parentNode !== programEl) programEl.appendChild(footEl);
    }
  }
  placeDock(); window.addEventListener('resize', placeDock);
  // al empezar un día en el celular, el plano queda arriba de la pantalla
  function focusBoard() { if (isSmall()) document.querySelector('.g-board-wrap').scrollIntoView({block: 'start', behavior: reduced ? 'auto' : 'smooth'}); }

  // Eventos
  $('start').addEventListener('click', function () {
    $('intro').hidden = true; $('play').hidden = false; startLevel(0); window.scrollTo(0, 0);
    var seen = false; try { seen = localStorage.getItem(TUT_KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(tutStart, reduced ? 0 : 500);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.g-cmd'), function (b) { b.addEventListener('click', function () { add(b.dataset.cmd); }); });
  $('queue').addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) removeAt(+li.dataset.i); });
  $('queue').addEventListener('keydown', function (e) { var li = e.target.closest('li[data-i]'); if (li && (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete')) { e.preventDefault(); removeAt(+li.dataset.i); } });
  $('undo').addEventListener('click', function () { if (!busy) { queue.pop(); renderQueue(); if (tut.on) tutEvent('remove'); } });
  $('clear').addEventListener('click', function () { if (!busy) { queue = []; renderQueue(); if (tut.on) tutEvent('remove'); } });
  $('send').addEventListener('click', send);
  $('restart').addEventListener('click', function () { if (!busy && !tut.on) startLevel(level); });
  $('retry').addEventListener('click', function () { closeResult(); startLevel(level); });
  $('next').addEventListener('click', function () { closeResult(); if (level < LEVELS.length - 1) { startLevel(level + 1); focusBoard(); } else showEnd(); });
  $('result').addEventListener('cancel', function (e) { e.preventDefault(); });
  $('name-input').addEventListener('input', function (e) { $('cert-name').textContent = e.target.value.trim() || 'Tu nombre'; });
  $('print').addEventListener('click', function () { window.print(); });
  $('again').addEventListener('click', function () { starsByLevel = []; $('end').hidden = true; $('play').hidden = false; startLevel(0); window.scrollTo(0, 0); });

  document.addEventListener('keydown', function (e) {
    if ($('play').hidden || (document.activeElement && document.activeElement.tagName === 'INPUT') || $('result').open) return;
    if (tut.on) {
      if (e.key === 'Escape') { e.preventDefault(); tutEnd(); return; }
      var s = tut.steps[tut.i], tm = {ArrowUp: 'F', ArrowDown: 'B', ArrowLeft: 'L', ArrowRight: 'R', a: 'A', A: 'A'};
      if (tm[e.key] && tutAccepts(tm[e.key])) { e.preventDefault(); press(tm[e.key]); add(tm[e.key]); }
      else if (e.key === 'Backspace' && s.wait === 'empty' && !tut.done) { e.preventDefault(); queue.pop(); renderQueue(); tutEvent('remove'); }
      return;
    }
    var map = {ArrowUp: 'F', ArrowDown: 'B', ArrowLeft: 'L', ArrowRight: 'R', a: 'A', A: 'A'};
    if (map[e.key]) { e.preventDefault(); press(map[e.key]); add(map[e.key]); }
    else if (e.key === 'Enter' && document.activeElement === document.body) { e.preventDefault(); send(); }
    else if (e.key === 'Backspace') { e.preventDefault(); if (!busy) { queue.pop(); renderQueue(); } }
  });
})();
