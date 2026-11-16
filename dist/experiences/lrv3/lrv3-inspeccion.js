// =============================================================================
// LRV-3 Apollo 17 · Demostraciones animadas e interfaz compacta de inspección.
// NEPTUNI Arqueología Espacial
//
// Módulo separado del visor para que la página que integra el rover pueda prescindir
// de la interfaz (montarVisorLRV3(div, { interfaz: false })) sin perder la API.
// Las demos no crean bucles ni temporizadores propios: el visor llama a actualizar(dt)
// desde su único requestAnimationFrame y las detiene al destruirse.
// Las velocidades de pan/tilt de la GCTA son las documentadas (GCTA Manual, 3.03°/s y
// 3.12°/s); la rueda de filtros, la dirección y la suspensión se animan a ritmo didáctico.
// =============================================================================
const COLORES = { potencia: 0xffa640, senal: 0x56c8ff, video: 0x8ef07d, rf: 0xff6fe0, mecanico: 0xe6e6e6 };

export function crearDemos(ctx) {
  const { THREE, rover } = ctx;
  const U = rover.userData;
  let actual = null, t = 0, guardado = null, texto = '';
  const oyentes = new Set();
  const decir = (s) => { if (s !== texto) { texto = s; for (const f of oyentes) f(actual, texto); } };
  const malla = (id) => (U.cables || []).find((k) => k.c.id === id)?.mesh || null;
  const fluir = (ids, tipo, sentido = 1) => { for (const id of ids) { const m = malla(id); if (m) ctx.flujo(m, { color: COLORES[tipo], sentido }); } };
  const grados = (r) => Math.round(THREE.MathUtils.radToDeg(r));
  const copiaArt = () => JSON.parse(JSON.stringify(U.articulacion));

  const DEMOS = {
    energia: {
      titulo: 'Flujo de energía',
      tapan: ['Baterias_SPU_DGU', 'Espejos_Termicos', 'Cubiertas_Antipolvo', 'Manta_Termica_Delantera', 'Paneles_Piso', 'Bloque_Conectores',
        'Soportes_Baterias', 'Bolsa_Bajo_Asiento_Izq', 'Bolsa_Bajo_Asiento_Der', 'Reposapies', 'Estructura_Secundaria_Inferior'],
      iniciar() {
        guardado = { art: copiaArt() }; this.fase = -1;
        ctx.transparentar(this.tapan, true);
        ctx.vista({ pos: [2.7, 2.7, -2.5], obj: [0.15, 0.42, 0], fov: 36 });
      },
      actualizar(dt) {
        const fases = [
          [0, () => { fluir(['C01', 'C02'], 'potencia'); fluir(['I08', 'I09'], 'potencia'); decir('1 · Baterías 1 y 2 (36 V cada una, 23 celdas) → breakers CB1–CB4 de la consola → buses A, B (batería 1) y C, D (batería 2). No se conectan en serie.'); }],
          [2.5, () => { fluir(['C03'], 'potencia'); decir('2 · Los buses alimentan la DCE a través de CB5–CB10 (cada carga elige uno de dos buses).'); }],
          [4.5, () => { fluir(['C10'], 'senal'); decir('3 · El mando en T fija el ciclo de trabajo del PWM y el sentido (relés).'); }],
          [6.0, () => { fluir(['C04', 'C05', 'C06', 'C07', 'C08', 'C09'], 'potencia'); decir('4 · La DCE conmuta 36 V hacia los 4 motores de tracción y los 2 de dirección.'); }],
          [8.5, () => { fluir(['C19', 'C20'], 'potencia'); decir('5 · CB14 (AUX) toma los buses A y C y alimenta la LCRU por el conector auxiliar.'); }],
          [14, () => { ctx.quitarFlujos(); this.fase = -1; t = 0; }],
        ];
        while (this.fase + 1 < fases.length && t >= fases[this.fase + 1][0]) { this.fase++; fases[this.fase][1](); }
        if (t > 6) ctx.articular({ giroRuedas: U.articulacion.giroRuedas + dt * 1.1 });
        ctx.avanzarFlujos(dt);
      },
      detener() { ctx.quitarFlujos(); ctx.transparentar(this.tapan, false); ctx.articular({ giroRuedas: guardado.art.giroRuedas }); },
    },
    direccion: {
      titulo: 'Dirección y suspensión',
      iniciar() { guardado = { art: copiaArt() }; },
      actualizar(dt) {
        const s = Math.sin(t * 0.55), w = t * 1.7, A = 3.4;
        ctx.articular({ direccionDel: s, direccionTras: -s, giroRuedas: U.articulacion.giroRuedas + dt * 0.7,
          suspension: { DI: A * Math.sin(w), DD: A * Math.sin(w + Math.PI), TI: A * Math.sin(w + Math.PI / 2), TD: A * Math.sin(w + 1.5 * Math.PI) } });
        const e = U.esquinas;
        decir(`Doble Ackermann (delantera y trasera opuestas): DI ${grados(e.DI.dirp.rotation.z)}° · DD ${grados(e.DD.dirp.rotation.z)}° · TI ${grados(e.TI.dirp.rotation.z)}° · TD ${grados(e.TD.dirp.rotation.z)}° (máx. 50° interior / 22° exterior). Brazos paralelos con barras de torsión: +6 / −4 in. Ritmo didáctico.`);
      },
      detener() { ctx.articular(guardado.art); },
    },
    camara: {
      titulo: 'Cámara de TV: pan, tilt y filtros',
      iniciar() {
        guardado = { art: copiaArt(), interior: ctx.interiorVisible('ctv') };
        ctx.interior('ctv', true, { enfocar: false }); ctx.enfocar('TV_Camara_Cuerpo', { margen: 2.4, direccion: [0.62, 0.42, -0.66] });
        this.objetivos = [[60, 12], [-80, 30], [-20, -15], [U.articulacion.gctaPan, U.articulacion.gctaTilt]]; this.k = 0;
      },
      actualizar(dt) {
        const A = U.articulacion, [p, tl] = this.objetivos[this.k];
        const dp = THREE.MathUtils.clamp(p - A.gctaPan, -ctx.LIMITES.gctaVelPan * dt, ctx.LIMITES.gctaVelPan * dt);
        const dtl = THREE.MathUtils.clamp(tl - A.gctaTilt, -ctx.LIMITES.gctaVelTilt * dt, ctx.LIMITES.gctaVelTilt * dt);
        ctx.articular({ gctaPan: A.gctaPan + dp, gctaTilt: A.gctaTilt + dtl, filtro: A.filtro + dt * 30 });
        if (Math.abs(p - A.gctaPan) < 0.05 && Math.abs(tl - A.gctaTilt) < 0.05) this.k = (this.k + 1) % this.objetivos.length;
        decir(`GCTA comandada desde Houston: pan ${A.gctaPan.toFixed(1)}° (3.03°/s, límites +134° / −214°) · tilt ${A.gctaTilt.toFixed(1)}° (3.12°/s, +85° / −45°). La rueda de filtros gira aquí a 30°/s sólo para que se vea.`);
      },
      detener() { ctx.articular({ gctaPan: guardado.art.gctaPan, gctaTilt: guardado.art.gctaTilt, filtro: guardado.art.filtro }); if (!guardado.interior) ctx.interior('ctv', false); },
    },
    video: {
      titulo: 'Video a la Tierra',
      iniciar() {
        guardado = { art: copiaArt() };
        ctx.apuntarATierra(); ctx.vista('tierra');
        fluir(['C25', 'C24'], 'video', -1); fluir(['I07', 'I04'], 'video'); fluir(['C21', 'I05'], 'rf');
        // haz conceptual desde la HGA hacia la Tierra (no a escala)
        const el = U.antenas.hga.el; rover.updateMatrixWorld(true);
        const o = el.localToWorld(new THREE.Vector3(9, 0, 0)), p = el.localToWorld(new THREE.Vector3(10, 0, 0));
        const d = p.sub(o).normalize(), L = 80;
        const mat = new THREE.MeshBasicMaterial({ color: 0xff6fe0, transparent: true, opacity: 0.55, depthWrite: false });
        const geo = new THREE.CylinderGeometry(0.035, 0.12, L, 10, 1, true); geo.translate(0, L / 2, 0);
        const haz = new THREE.Mesh(geo, mat); haz.name = 'Haz_banda_S_conceptual';
        haz.position.copy(o); haz.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        ctx.escena.add(haz); this.haz = haz;
        this.pulsos = [];
        for (let i = 0; i < 6; i++) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd6f6 }));
          ctx.escena.add(s); this.pulsos.push(s);
        }
        this.o = o; this.d = d; this.L = L;
      },
      actualizar(dt) {
        ctx.avanzarFlujos(dt);
        this.pulsos.forEach((s, i) => { const u = ((t * 0.25 + i / this.pulsos.length) % 1); s.position.copy(this.o).addScaledVector(this.d, u * this.L); });
        const err = ctx.errorApuntadoHGA ? ctx.errorApuntadoHGA() : null;
        decir(`Cámara → TCU → LCRU (transceptor FM de banda S) → HGA → Tierra. Rover detenido; la HGA se apunta a mano con su mira, no sigue a la Tierra sola${err != null ? ` (desvío del eje en esta escena: ${err.toFixed(2)}°)` : ''}. Los comandos de Houston suben por la misma antena (subportadora de 70 kHz).`);
      },
      detener() {
        ctx.quitarFlujos();
        if (this.haz) { ctx.escena.remove(this.haz); this.haz.geometry.dispose(); this.haz.material.dispose(); this.haz = null; }
        for (const s of this.pulsos || []) { ctx.escena.remove(s); s.geometry.dispose(); s.material.dispose(); }
        this.pulsos = [];
      },
    },
    apertura: {
      titulo: 'Apertura y separación',
      iniciar() {
        const ids = ['bat1', 'bat2', 'spu', 'dgu', 'dce', 'lcru'];
        guardado = { ap: { ...(U.aperturas || {}) }, vis: ids.filter((id) => ctx.interiorVisible(id)), sep: ctx.separacion(), exp: ctx.explosion() };
        for (const id of ids) ctx.interior(id, true, { enfocar: false, abrir: false });
        this.ids = ids; this.fase = -1;
      },
      actualizar() {
        const ids = this.ids;
        const fases = [
          [0, () => { ctx.abrir('bat1', 1); ctx.abrir('bat2', 1); decir('Cubiertas antipolvo y tapas: primero gira la cubierta, después se retira la tapa (apertura virtual).'); }],
          [0.8, () => { ctx.abrir('spu', 1); ctx.abrir('dce', 1); ctx.abrir('dgu', 1); }],
          [1.6, () => { ctx.abrir('lcru', 1); }],
          [3.2, () => { ctx.separar(1); decir('Separación de módulos: cada caja se aleja de su sitio; los cables la siguen.'); }],
          [5.0, () => { ctx.explotar(1); decir('Vista explosionada encima de la apertura y la separación: los desplazamientos se suman, no se pisan.'); }],
          [9.0, () => { ctx.explotar(0); }],
          [10.2, () => { ctx.separar(0); }],
          [11.6, () => { for (const id of ids) ctx.abrir(id, 0); decir('Cierre.'); }],
          [14.5, () => { this.fase = -1; t = 0; }],
        ];
        while (this.fase + 1 < fases.length && t >= fases[this.fase + 1][0]) { this.fase++; fases[this.fase][1](); }
      },
      detener() {
        for (const id of this.ids) { ctx.abrir(id, guardado.ap[id] || 0); if (!guardado.vis.includes(id)) ctx.interior(id, false); }
        ctx.separar(guardado.sep); ctx.explotar(guardado.exp);
      },
    },
  };

  const api = {
    lista: Object.entries(DEMOS).map(([id, d]) => ({ id, titulo: d.titulo })),
    get activo() { return actual; },
    get texto() { return texto; },
    escuchar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },
    iniciar(nombre) {
      if (!DEMOS[nombre]) throw new Error(`Demo desconocida: ${nombre}`);
      api.detener();
      actual = nombre; t = 0; DEMOS[nombre].iniciar(); DEMOS[nombre].actualizar(0); ctx.pedir();
      for (const f of oyentes) f(actual, texto);
      return actual;
    },
    actualizar(dt) { if (!actual) return; t += dt; DEMOS[actual].actualizar(dt); },
    detener() {
      if (!actual) return;
      const d = DEMOS[actual]; actual = null; d.detener(); texto = ''; ctx.pedir();
      for (const f of oyentes) f(null, '');
    },
  };
  return api;
}

// =============================================================================
// Interfaz compacta (se crea dentro del contenedor del visor; sin dependencias)
// =============================================================================
const CSS = `
.lrv3-ui{position:absolute;inset:0;pointer-events:none;font:13px/1.35 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e9e6dc;z-index:2}
.lrv3-ui *{box-sizing:border-box}
.lrv3-ui button{font:inherit;color:inherit;cursor:pointer}
.lrv3-ui :focus-visible{outline:2px solid #e8893c;outline-offset:2px}
.lrv3-boton{pointer-events:auto;position:absolute;right:12px;bottom:12px;display:flex;gap:8px;align-items:center;padding:9px 14px;border-radius:999px;
  background:rgba(14,16,20,.86);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.35);
  letter-spacing:.06em;text-transform:uppercase;font-size:11px;font-weight:650;transition:transform .18s ease,background .18s ease}
.lrv3-boton:hover{transform:translateY(-1px);background:rgba(28,30,36,.92)}
.lrv3-boton i{width:8px;height:8px;border-radius:50%;background:#e8893c;box-shadow:0 0 10px #e8893c}
.lrv3-panel{pointer-events:auto;position:absolute;right:12px;bottom:58px;width:min(340px,calc(100% - 24px));max-height:calc(100% - 80px);overflow:auto;
  background:rgba(12,14,18,.9);border:1px solid rgba(255,255,255,.1);border-radius:14px;backdrop-filter:blur(10px);box-shadow:0 18px 50px rgba(0,0,0,.5);
  opacity:0;transform:translateY(8px) scale(.98);transition:opacity .2s ease,transform .2s ease;visibility:hidden}
.lrv3-panel.abierta{opacity:1;transform:none;visibility:visible}
.lrv3-tabs{display:flex;gap:2px;padding:6px;position:sticky;top:0;background:rgba(12,14,18,.96);border-bottom:1px solid rgba(255,255,255,.07)}
.lrv3-tabs button{flex:1;padding:7px 4px;border:0;border-radius:8px;background:transparent;font-size:11.5px;letter-spacing:.03em;opacity:.7;transition:background .15s,opacity .15s}
.lrv3-tabs button[aria-selected=true]{background:rgba(232,137,60,.16);opacity:1;color:#ffc79a}
.lrv3-cuerpo{padding:10px 10px 12px}
.lrv3-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.lrv3-grid.dos{grid-template-columns:repeat(2,1fr)}
.lrv3-c{min-height:36px;padding:7px 8px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);text-align:left;font-size:12px;
  transition:background .15s,border-color .15s,transform .12s}
.lrv3-c:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)}
.lrv3-c:active{transform:scale(.98)}
.lrv3-c[aria-pressed=true]{background:rgba(232,137,60,.18);border-color:rgba(232,137,60,.6);color:#ffd5b0}
.lrv3-c small{display:block;opacity:.55;font-size:10.5px;margin-top:1px}
.lrv3-et{margin:12px 2px 6px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.55}
.lrv3-et:first-child{margin-top:2px}
.lrv3-seg{display:flex;border:1px solid rgba(255,255,255,.1);border-radius:9px;overflow:hidden}
.lrv3-seg button{flex:1;padding:7px 2px;border:0;background:transparent;font-size:11.5px;transition:background .15s}
.lrv3-seg button+button{border-left:1px solid rgba(255,255,255,.08)}
.lrv3-seg button[aria-pressed=true]{background:rgba(232,137,60,.2);color:#ffd5b0}
.lrv3-rango{width:100%;accent-color:#e8893c;margin:8px 0 0}
.lrv3-info{pointer-events:auto;position:absolute;left:12px;bottom:12px;width:min(360px,calc(100% - 24px));padding:12px 14px 12px;border-radius:14px;
  background:rgba(12,14,18,.9);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(10px);box-shadow:0 18px 50px rgba(0,0,0,.45);
  transition:opacity .2s,transform .2s}
.lrv3-info[hidden]{display:block;opacity:0;transform:translateY(8px);pointer-events:none}
.lrv3-info h3{margin:0 26px 6px 0;font-size:15px;font-weight:650;letter-spacing:.01em;color:#fff}
.lrv3-info p{margin:6px 0 0;opacity:.88}
.lrv3-info .fuente{font:11px/1.35 ui-monospace,"SF Mono",Menlo,monospace;opacity:.6;margin-top:8px}
.lrv3-chips{display:flex;flex-wrap:wrap;gap:6px}
.lrv3-chip{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;background:rgba(255,255,255,.07)}
.lrv3-chip i{width:7px;height:7px;border-radius:50%}
.lrv3-ev-documentado{background:rgba(89,194,122,.16);color:#9fe3b5}.lrv3-ev-inferido{background:rgba(224,176,74,.16);color:#f1d08a}.lrv3-ev-educativo{background:rgba(106,168,255,.16);color:#a9cbff}
.lrv3-x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;border-radius:8px;background:transparent;opacity:.6}
.lrv3-x:hover{opacity:1;background:rgba(255,255,255,.08)}
.lrv3-acc{display:flex;gap:6px;margin-top:10px}
.lrv3-acc button{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);font-size:12px}
.lrv3-demo{pointer-events:auto;position:absolute;left:50%;top:12px;transform:translateX(-50%);width:min(560px,calc(100% - 24px));display:flex;gap:10px;align-items:flex-start;
  padding:10px 12px;border-radius:12px;background:rgba(12,14,18,.88);border:1px solid rgba(232,137,60,.35);box-shadow:0 10px 30px rgba(0,0,0,.4);font-size:12.5px}
.lrv3-demo[hidden]{display:none}
.lrv3-demo b{color:#ffc79a;display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px}
.lrv3-demo button{margin-left:auto;flex:none;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06)}
@media (max-width:640px){
  .lrv3-panel{right:8px;left:8px;width:auto;bottom:56px;max-height:46%}
  .lrv3-info{left:8px;right:8px;width:auto;top:8px;bottom:auto}
  .lrv3-demo{top:auto;bottom:56px}
  .lrv3-c,.lrv3-tabs button,.lrv3-seg button,.lrv3-boton,.lrv3-acc button,.lrv3-demo button{min-height:40px}
}
@media (pointer:coarse){.lrv3-c,.lrv3-tabs button,.lrv3-seg button,.lrv3-boton,.lrv3-acc button,.lrv3-demo button,.lrv3-x{min-height:40px;min-width:40px}}
@media (prefers-reduced-motion:reduce){.lrv3-ui *{transition:none!important}}
`;
let instanciasCSS = 0;

const NOMBRE_SUB = { estructura: 'Estructura', movilidad: 'Movilidad', tripulacion: 'Tripulación', energia: 'Energía', comunicaciones: 'Comunicaciones', ciencia: 'Ciencia' };
const VISTAS_UI = [['inicio', 'Inicio'], ['frontal', 'Frontal'], ['lateral', 'Lateral'], ['trasera', 'Trasera'], ['superior', 'Superior'], ['inferior', 'Inferior'],
  ['bajo_chasis', 'Bajo chasis'], ['detalle_rueda', 'Rueda'], ['detalle_suspension', 'Suspensión'], ['tierra', 'HGA → Tierra'], ['foto_A', 'Foto lateral'], ['foto_B', 'Foto 3/4']];
const UNIDAD_DE = [[/Bateria_1/, 'bat1'], [/Bateria_2/, 'bat2'], [/(^|_)SPU/, 'spu'], [/^DGU/, 'dgu'], [/(^|_)DCE/, 'dce'],
  [/^LCRU/, 'lcru'], [/^TV_(Camara|Espejos_Superiores|Parasol|Vidrio)/, 'ctv'], [/^TV_(Caja_Control|TCU_Columna)/, 'tcu'], [/^Consola/, 'consola']];
function unidadDe(info) {
  if (!info) return null;
  if (info.unidad) return info.unidad;
  for (const [re, id] of UNIDAD_DE) if (re.test(info.parte)) return id;
  return null;
}

export function crearInterfaz(visor, contenedor, { abierta = false } = {}) {
  const doc = contenedor.ownerDocument;
  if (!doc.getElementById('lrv3-ui-css')) { const st = doc.createElement('style'); st.id = 'lrv3-ui-css'; st.textContent = CSS; doc.head.appendChild(st); }
  instanciasCSS++;
  const raiz = doc.createElement('div'); raiz.className = 'lrv3-ui';
  raiz.innerHTML = `
    <div class="lrv3-demo" hidden role="status" aria-live="polite"><div><b></b><span></span></div><button type="button">Detener</button></div>
    <article class="lrv3-info" hidden aria-live="polite"><button class="lrv3-x" type="button" aria-label="Cerrar">✕</button><h3></h3><div class="lrv3-chips"></div><p class="fn"></p><p class="ext"></p><div class="fuente"></div><div class="lrv3-acc"></div></article>
    <section class="lrv3-panel" aria-label="Inspección del LRV-3">
      <div class="lrv3-tabs" role="tablist">
        <button role="tab" data-t="vistas" aria-selected="true">Vistas</button><button role="tab" data-t="interiores" aria-selected="false">Interiores</button>
        <button role="tab" data-t="demos" aria-selected="false">Demos</button><button role="tab" data-t="herr" aria-selected="false">Herramientas</button>
      </div>
      <div class="lrv3-cuerpo"></div>
    </section>
    <button class="lrv3-boton" type="button" aria-expanded="false"><i></i>Inspección</button>`;
  contenedor.appendChild(raiz);
  const $ = (s) => raiz.querySelector(s);
  const panel = $('.lrv3-panel'), cuerpo = $('.lrv3-cuerpo'), boton = $('.lrv3-boton'), info = $('.lrv3-info'), demo = $('.lrv3-demo');
  let pest = 'vistas';

  const abrirPanel = (v) => { panel.classList.toggle('abierta', v); boton.setAttribute('aria-expanded', String(v)); if (v) render(); };
  boton.addEventListener('click', () => abrirPanel(!panel.classList.contains('abierta')));
  raiz.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => { pest = b.dataset.t; raiz.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b))); render(); }));
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { abrirPanel(false); boton.focus(); } });

  const btn = (txt, sub, pressed, fn) => { const b = doc.createElement('button'); b.type = 'button'; b.className = 'lrv3-c'; b.innerHTML = `${txt}${sub ? `<small>${sub}</small>` : ''}`; if (pressed != null) b.setAttribute('aria-pressed', String(!!pressed)); b.addEventListener('click', fn); return b; };
  const etiqueta = (t) => { const d = doc.createElement('div'); d.className = 'lrv3-et'; d.textContent = t; return d; };
  const rejilla = (dos) => { const d = doc.createElement('div'); d.className = 'lrv3-grid' + (dos ? ' dos' : ''); return d; };
  const segmento = (opciones, actual, fn) => {
    const d = doc.createElement('div'); d.className = 'lrv3-seg';
    for (const [v, t] of opciones) { const b = doc.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-pressed', String(v === actual)); b.addEventListener('click', () => { fn(v); render(); }); d.appendChild(b); }
    return d;
  };
  const rango = (min, max, paso, valor, fn) => { const r = doc.createElement('input'); r.type = 'range'; r.className = 'lrv3-rango'; Object.assign(r, { min, max, step: paso, value: valor }); r.addEventListener('input', () => fn(+r.value)); return r; };

  function render() {
    cuerpo.textContent = '';
    const e = visor.estado();
    if (pest === 'vistas') {
      const g = rejilla(); for (const [id, t] of VISTAS_UI) g.appendChild(btn(t, null, null, () => visor.vista(id))); cuerpo.append(etiqueta('Cámara'), g);
      cuerpo.append(etiqueta('Teclado (con el visor enfocado)'));
      const p = doc.createElement('div'); p.style.cssText = 'font-size:11.5px;opacity:.7'; p.textContent = 'Flechas: orbitar · +/−: zoom · 1–9: vistas · E: explosión · G: girar · R: restaurar · Esc: soltar selección o demo';
      cuerpo.append(p);
    } else if (pest === 'interiores') {
      const g = rejilla(true);
      for (const it of visor.interiores) g.appendChild(btn(it.nombre.split(' · ')[0], it.nombre.split(' · ')[1] || '', e.interiores.includes(it.id), () => { visor.interior(it.id, !visor.estado().interiores.includes(it.id)); setTimeout(render, 30); }));
      cuerpo.append(etiqueta('Abrir y explorar'), g);
      cuerpo.append(etiqueta('Separación de módulos'), rango(0, 1, 0.01, e.separacion, (v) => visor.separar(v, false)));
      cuerpo.append(etiqueta('Explosión por subsistemas'), rango(0, 1, 0.01, e.explosion, (v) => visor.explotar(v, false)));
    } else if (pest === 'demos') {
      const g = rejilla(true);
      for (const d of visor._demos.lista) g.appendChild(btn(d.titulo, null, e.demo === d.id, () => { visor.demo(e.demo === d.id ? null : d.id); render(); }));
      cuerpo.append(etiqueta('Animaciones (se detienen con Esc)'), g);
    } else {
      cuerpo.append(etiqueta('Terreno'), segmento([['auto', 'Auto'], ['visible', 'Visible'], ['transparente', 'Transp.'], ['oculto', 'Oculto']], e.terreno, (v) => visor.terreno(v)));
      cuerpo.append(etiqueta('Corte de sección'), segmento([[null, 'No'], ['longitudinal', 'Long.'], ['transversal', 'Transv.'], ['horizontal', 'Horiz.']], e.corte ? e.corte.tipo : null, (v) => visor.corte(v)));
      if (e.corte) {
        const lim = { longitudinal: [-0.95, 0.95], transversal: [-1.6, 1.6], horizontal: [0.1, 2.1] }[e.corte.tipo];
        cuerpo.append(rango(lim[0], lim[1], 0.005, e.corte.posicion, (v) => visor.corte(e.corte.tipo, v)));
      }
      cuerpo.append(etiqueta('Luz de trabajo (ayuda, no histórica)'), segmento([['auto', 'Auto'], [true, 'Sí'], [false, 'No']], e.luz, (v) => visor.luzDeTrabajo(v)));
      const g = rejilla(true);
      g.append(btn('Cables', 'arneses y coaxiales', e.cables, () => { visor.cables(!visor.estado().cables); render(); }),
        btn('Girar 360°', null, e.giro, () => { visor.girar(!visor.estado().giro); render(); }),
        btn('Restaurar', 'estado inicial', null, () => { visor.restaurar(visor._estadoInicial, true); setTimeout(render, 30); }),
        btn('HGA → Tierra', 'reapuntar', null, () => visor.apuntarATierra()));
      cuerpo.append(etiqueta('Varios'), g);
    }
  }

  // ---- tarjeta de información de la selección
  info.querySelector('.lrv3-x').addEventListener('click', () => visor.seleccionar(null));
  function mostrarInfo(d) {
    if (!d) { info.hidden = true; return; }
    info.hidden = false;
    info.querySelector('h3').textContent = d.nombre;
    const sub = visor.subsistemas.find((s) => s.id === d.subsistema);
    info.querySelector('.lrv3-chips').innerHTML = `${sub ? `<span class="lrv3-chip"><i style="background:${sub.color}"></i>${NOMBRE_SUB[d.subsistema] || d.subsistema}</span>` : ''}`
      + `${d.evidencia ? `<span class="lrv3-chip lrv3-ev-${d.evidencia}">${d.evidencia}</span>` : ''}${d.tipo === 'cable' ? '<span class="lrv3-chip">cable</span>' : d.tipo === 'interior' ? '<span class="lrv3-chip">interior</span>' : ''}`;
    info.querySelector('.fn').textContent = d.funcion || (sub ? sub.resumen : '');
    info.querySelector('.ext').textContent = d.extremos ? `${d.extremos.origen} → ${d.extremos.destino} · ${d.extremos.tipo}` : '';
    info.querySelector('.fuente').textContent = d.fuente ? `Fuente: ${d.fuente}` : '';
    const acc = info.querySelector('.lrv3-acc'); acc.textContent = '';
    const b1 = doc.createElement('button'); b1.type = 'button'; b1.textContent = 'Enfocar'; b1.addEventListener('click', () => visor.enfocar(d.parte, { margen: 1.6 })); acc.appendChild(b1);
    const u = unidadDe(d);
    if (u && !visor.estado().interiores.includes(u)) { const b2 = doc.createElement('button'); b2.type = 'button'; b2.textContent = 'Ver interior'; b2.addEventListener('click', () => visor.interior(u, true)); acc.appendChild(b2); }
  }

  // ---- leyenda de la demo
  const quitar = visor._demos.escuchar((id, texto) => {
    demo.hidden = !id;
    if (id) { demo.querySelector('b').textContent = visor._demos.lista.find((d) => d.id === id).titulo; demo.querySelector('span').textContent = texto; }
    if (pest === 'demos' && panel.classList.contains('abierta')) render();
  });
  demo.querySelector('button').addEventListener('click', () => visor.demo(null));

  if (abierta) abrirPanel(true);
  return {
    elemento: raiz, mostrarInfo, abrir: () => abrirPanel(true), cerrar: () => abrirPanel(false), refrescar: render,
    destruir() { quitar(); raiz.remove(); instanciasCSS--; if (instanciasCSS <= 0) doc.getElementById('lrv3-ui-css')?.remove(); },
  };
}
