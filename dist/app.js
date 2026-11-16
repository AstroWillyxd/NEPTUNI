import './nx-i18n.js?v=20261125v12';   // idioma: va primero para que el diccionario esté listo
import {setupHeroNeptunito} from './neptunito.js?v=20261113';
import {createMissionGuide} from './mission-guide.js?v=20261123v10';
import {missionPhoto} from './mission-photos.js?v=20261112ficha';
import {setupMissionFilters} from './mission-filters.js';
import {missions,years} from './missions.js?v=20261112inspeccion';
import {internalParts} from './interiors.js';
import {getMissionStory} from './mission-story.js?v=20261123v10';
import {componentReading} from './component-details.js?v=20261112inspeccion';
import {lunarOrbiterExperience} from './experiences/lunar-orbiter.js?v=20261024a';
import {ComponentRegistry} from './twin/component-registry.js?v=20261024lo1';
import {backgroundFor, createSceneBackground} from './scene-backgrounds.js?v=20261111modelos';
import {createViewerExpansion} from './viewer-expansion.js?v=20261112inspeccion';
import {viewerFailureMessage} from './twin/viewer-failure.js?v=20261023d';
import {inspectGLBResource} from './twin/asset-loader.js?v=20261009b';
import {createComponentDock} from './component-dock.js?v=20261112ficha';
import {createMerAdapter} from './mer-adapter.js?v=20261112inspeccion';
import {createLrv3Demonstrations} from './lrv3-demonstrations.js?v=20261112inspeccion';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={view:'inicio',mission:missions.find(m=>m.id===new URLSearchParams(location.search).get('mission'))||missions[0],path:[],mode:'exterior',loaded:false};
const viewerExpansion=createViewerExpansion($('.explorer-stage'),$('#fullscreen-model'));
const yearRail = $('#vertical-years');
const scrollMode = reduced ? 'instant' : 'smooth';
const nav = $('#primary-nav');
setupHeroNeptunito();
const guide = createMissionGuide();
let highlightedYear, archivePosition, archiveButton, missionRequested = false;

new ResizeObserver(() => {
 const height = Math.ceil($('.header').getBoundingClientRect().height);
 document.documentElement.style.setProperty('--header-height', height + 'px');
}).observe($('.header'));

function card(mission) {
 const photo = missionPhoto(mission);
 return `<article class="mission-card" data-world-name="${mission.world}">
   <div class="mission-art"><img class="mission-photo" src="${escape(photo.src)}" alt="${escape(photo.alt)}" loading="lazy" decoding="async"></div>
   <div class="card-content">
     <p class="card-category">${escape(mission.world)} · ${escape(mission.type)}</p>
     <h3>${escape(mission.name)}</h3>
     <p class="card-description">${escape(mission.summary)}</p>
     <p class="card-region">${escape(mission.region)}</p>
   <a class="card-photo-credit" href="${escape(photo.source)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(photo.credit)}">${escape(photo.context || 'Foto de archivo')} · ${escape(photo.agency || 'NASA')} →</a>
   </div>
   <button type="button" class="card-cta" data-mission="${mission.id}" aria-label="Abrir misión ${escape(mission.name)}">Abrir misión <span aria-hidden="true">→</span></button>
 </article>`;
}

yearRail.innerHTML = years.map(year => `<button type="button" class="year-link" data-year="${year}" aria-current="false">${year}</button>`).join('');
$('#mission-groups').innerHTML = years.map(year => {
 const group = missions.filter(mission => mission.year === year);
 return `<section class="mission-group" id="year-${year}" data-group-year="${year}">
  <h2 class="group-heading">${year} <span>·</span> ${group.length} ${group.length === 1 ? 'misión' : 'misiones'}</h2>
  <div class="mission-grid">${group.map(card).join('')}</div>
 </section>`;
}).join('');
$('#mission-select').innerHTML = missions
 .map(mission => `<option value="${mission.id}">${escape(mission.name)}</option>`).join('');

function activeYear(year) {
 if (highlightedYear === year) return;
 highlightedYear = year;
 const buttons = $$('.year-link');
 for (const button of buttons) {
  const active = Number(button.dataset.year) === year;
  button.classList.toggle('active', active);
  button.setAttribute('aria-current', String(active));
  if (active) {
   const bounds = button.getBoundingClientRect(), rail = yearRail.getBoundingClientRect();
   if (bounds.top < rail.top || bounds.bottom > rail.bottom) {
    yearRail.scrollBy({top: bounds.top - rail.top - (rail.height - bounds.height) / 2, behavior: scrollMode});
   }
  }
 }
}
function syncYear() {
 if (state.view !== 'inicio') return;
 const groups = $$('.mission-group').filter(group => !group.hidden);
 const focus = Math.min(innerHeight * .4, 340);
 let year = Number(groups[0]?.dataset.groupYear);
 for (const group of groups) {
  if (group.getBoundingClientRect().top <= focus) year = Number(group.dataset.groupYear);
 }
 activeYear(year);
}
let scrollTick = false;
window.addEventListener('scroll', () => {
 if (scrollTick) return;
 scrollTick = true;
 requestAnimationFrame(() => { syncYear(); scrollTick = false; });
}, {passive: true});
window.addEventListener('resize', syncYear);
const viewer = $('#viewer'), sceneBackground = createSceneBackground($('.viewer-wrap'));
let legacyViewerModule;
function ensureLegacyViewer(){if(customElements.get('model-viewer'))return Promise.resolve();return legacyViewerModule??=import('./assets/model-viewer.min.js?v=20261008a').catch(error=>{legacyViewerModule=null;throw error;});}
const isGraphicsFailure=error=>['WEBGL_UNAVAILABLE','WEBGL_CONTEXT_LOST','SHADER_COMPILATION_FAILED','RENDER_FAILED'].includes(error?.code)||/WebGL context/i.test(error?.message||'');
const isModelFailure=error=>['ASSET_ACCESS','ASSET_HTTP','ASSET_INVALID','ASSET_TIMEOUT'].includes(error?.code);
function setViewerControls(ready, {loading = !ready} = {}) {
 componentDock.ready(ready, loading);
 $('#toggle-labels').hidden = !ready;
 for (const id of ['rotate-model', 'reset-camera', 'fullscreen-model', 'toggle-labels']) {
  $('#' + id).disabled = !ready;
 }
}
const viewerError = document.createElement('section');
viewerError.id = 'viewer-error';
viewerError.className = 'archive-view';
viewerError.hidden = true;
$('.viewer-wrap').append(viewerError);
let failureCheckController;

function showViewerFailure(error) {
 failureCheckController?.abort();
 failureCheckController = null;
 state.loaded = false;
 $('#model-loading').hidden = true;
 viewerError.hidden = false;
 const copy = viewerFailureMessage(error);
 const photo = missionPhoto(state.mission);
 viewerError.innerHTML = `<img src="${escape(photo.src)}" alt="${escape(photo.alt)}">
  <div class="archive-view-caption">
   <p class="eyebrow">Fotografía de archivo</p>
   <a href="${escape(photo.source)}" target="_blank" rel="noopener noreferrer">${escape(photo.credit)}</a>
   <div class="archive-view-actions"><button class="button-primary" type="button">Reintentar 3D</button>
    <details><summary>Estado del visor</summary><p>${escape(copy.heading)}. ${escape(copy.text)}</p>
     <button class="outline-button" type="button">Comprobar archivo</button><p role="status"></p>
    </details>
   </div>
  </div>`;
 viewerError.querySelector('.button-primary').onclick = () => loadMission(state.mission, {retryViewer: true});
 const check = viewerError.querySelector('.outline-button');
 const status = viewerError.querySelector('[role="status"]');
 const mission = state.mission;
 const url = new URL(state.path[0]?.scene || mission.model, import.meta.url);
 url.searchParams.set('v', mission.fleet?.assetRevision || '20261009b');
 check.onclick = async () => {
  failureCheckController?.abort();
  const request = failureCheckController = new AbortController();
  check.disabled = true;
  status.textContent = 'Comprobando la descarga…';
  try {
   const result = await inspectGLBResource(url.href, {signal: request.signal});
   if (!request.signal.aborted) status.textContent = `Archivo GLB accesible · ${(result.bytes / 1e6).toFixed(2)} MB`;
  } catch (failure) {
   if (!request.signal.aborted) status.textContent = viewerFailureMessage(failure).text;
  } finally {
   if (!request.signal.aborted) {
    check.disabled = false;
    if (failureCheckController === request) failureCheckController = null;
   }
  }
 };
 setViewerControls(false, {loading: false});
 $('#back-component').disabled = true;
 digitalTwinUI?.ready(false);
}
let fleetRequest = null;
let merAdapter = null, fleetViewer = null, fleetEpoch = 0, digitalTwinUI = null, twinRegistry = null, contextToken = 0, twinContext = {};
// Solo lectura: Neptunito guía (nx-guide.js) consulta la cámara para señalar la pieza enfocada.
Object.defineProperty(globalThis, '__nxFleet', {get: () => fleetViewer, configurable: true});

const componentDock = createComponentDock({
 getParts: mission => mission.components,
 onSelect: inspectComponent,
 onReset: () => goDepth(0),
 onRead: part => { if (!state.loaded) showComponentDetails(part); },
 onOpen: () => guide.quiet(),
 onView: () => {
  const viewport = $('.viewer-wrap');
  viewport.focus({preventScroll: true});
  viewport.scrollIntoView({behavior: scrollMode, block: 'start'});
 }
});

async function inspectComponent(key) {
 if (!state.loaded || !viewerError.hidden) return false;
 manualInspection();
 if (fleetViewer) return fleetViewer.choose(key);

 function find(parts, parents = []) {
  for (const part of parts) {
   const path = [...parents, part];
   if ((part.key || part.id) === key) return path;
   const branch = find(part.children || [], path);
   if (branch) return branch;
  }
  return null;
 }
 const path = find(state.mission.components);
 if (!path || !path[0].scene) return false;
 state.path = path;
 state.mode = 'interior';
 await loadScene();
 return true;
}

function invalidateTwinContext(){contextToken++;}
function manualInspection(){if(!digitalTwinUI)return;digitalTwinUI.interrupt();invalidateTwinContext();}
function inspectionContext(){
 const inExplorer=state.view==='explorador';
 return {mission:state.mission,part:current(),inExplorer,path:[...state.path],mode:state.mode,contextToken,...twinContext,
  current_mission:inExplorer?state.mission.id:null,
  current_component:inExplorer?(twinContext.current_component||current()?.id||null):null,
  current_subcomponent:inExplorer?(twinContext.current_subcomponent||null):null,
  current_view:inExplorer?(twinContext.current_view||state.mode):state.view,
  current_zoom_level:inExplorer?(twinContext.current_zoom_level??state.path.length):0,
  current_story_step:inExplorer?(twinContext.current_story_step||null):null};
}
const lrv3Demonstrations = createLrv3Demonstrations();
const fleetHost=document.createElement('div');fleetHost.id='sojourner-viewport';fleetHost.hidden=true;viewer.after(fleetHost);
function fleetPanel(part,path=[]){
 state.path=path;state.mode=digitalTwinUI?(fleetViewer?.state.view||twinContext.scene_view||'exterior'):(part?'interior':'exterior');
 componentDock.sync(part, path);
 if (state.mission.id === 'viking2') {
  sceneBackground.set(state.mission, path[0]?.context === 'surface' ? 'surface' : 'orbital');
 }
 if(digitalTwinUI){updateParts();digitalTwinUI.sync(part,path,state.mode);$('#back-component').disabled=!part;return;}
 $('#rotate-model').setAttribute('aria-pressed','false');$('#rotate-model').textContent='Órbita automática';
 updateParts();updateModelNote();
 $('#zoom-label').textContent=part?`CAPA ${path.length} / ${state.mission.id==='phoenix'?'INSPECCIÓN':'INTERIOR'}`:'VISTA GENERAL / 3D';
 if(part)$('#model-badge').textContent=state.mission.id==='phoenix'?'INSPECCIÓN EN CONTEXTO':'CORTE TÉCNICO';
 $('#mission-source').href=part?.source||state.mission.source;
}
async function startFleet() {
 fleetRequest?.abort();
 const requestController = fleetRequest = new AbortController();
 const token = ++fleetEpoch, mission = state.mission;
 const currentLoad = () => token === fleetEpoch;
 state.loaded = false;
 const status = $('#model-loading');
 status.hidden = false;
 status.textContent = 'Preparando ' + mission.name + '…';
 viewer.hidden = true;
 fleetHost.hidden = false;
 $('.viewer-wrap').classList.add('sojourner-active');
 viewer.querySelectorAll('.hotspot').forEach(element => element.remove());
 viewer.autoRotate = false;
 viewer.removeAttribute('src');
 fleetPanel(null);

 const mount = document.createElement('div');
 mount.className = 'sj-mount';
 fleetHost.replaceChildren(mount);
 if (mission.id === 'orbiter') {
  const additions = lunarOrbiterExperience.supplementaryParts.filter(part => !mission.components.some(p => p.key === part.key));
  mission.components = [...mission.components, ...additions];
  twinRegistry = new ComponentRegistry(mission, lunarOrbiterExperience);
 }

 try {
  const {createFleetViewer} = await import('./fleet-viewer.js?v=20261122v9b');
  if (!currentLoad()) return;
  const instance = await createFleetViewer(mount, mission, {
   registry: twinRegistry,
   signal: requestController.signal,
   onInteraction: manualInspection,
   onViewChange: (view, relation) => {
    if (!currentLoad()) return;
    state.mode = view;
    twinContext.scene_view = view;
    digitalTwinUI?.sceneChange(view, relation);
   },
   onPerformance: data => {
    if (currentLoad()) digitalTwinUI?.performance(data);
   },
   onAvailability: (available, error) => {
    if (!currentLoad()) return;
    digitalTwinUI?.ready(available);
    if (available) {
     state.loaded = true;
     viewerError.hidden = true;
     if (fleetViewer) setViewerControls(true);
    } else {
     digitalTwinUI?.interrupt();
     invalidateTwinContext();
     showViewerFailure(error || {code: 'WEBGL_UNAVAILABLE'});
    }
   },
   onSelect: (part, path) => {
    if (!currentLoad()) return;
    fleetPanel(part, path);
    merAdapter?.onSelect(part);
   },
   onStatus: message => {
    if (!currentLoad()) return;
    status.textContent = message;
    status.hidden = !message || !viewerError.hidden;
   }
  });
  if (!currentLoad()) {
   instance.destroy();
   return;
  }
  fleetViewer = instance;
  if (mission.family === 'mer' && mission.fleet.mechanisms) {
   merAdapter = createMerAdapter(instance, mission, mount, {
    onStatus: message => {
     status.textContent = message;
     status.hidden = !message || !viewerError.hidden;
    }
   });
  }
  state.loaded = instance.state.available !== false;
  setViewerControls(state.loaded, {loading: false});
  digitalTwinUI?.ready(state.loaded);
  digitalTwinUI?.sync(null, [], instance.state.view);
  status.hidden = true;
 } catch (error) {
  if (!currentLoad() || error.name === 'AbortError') return;
  merAdapter?.destroy();
  merAdapter = null;
  fleetViewer?.destroy();
  fleetViewer = null;
  console.warn('Fleet renderer unavailable:', error.message);
  fleetHost.hidden = true;
  if (['orbiter', 'insight', 'sojourner', 'spirit', 'viking2'].includes(mission.id) || isGraphicsFailure(error) || isModelFailure(error)) {
   showViewerFailure(error);
   return;
  }
  digitalTwinUI?.destroy();
  digitalTwinUI = null;
  twinRegistry = null;
  twinContext = {};
  viewer.hidden = false;
  $('.viewer-wrap').classList.remove('sojourner-active');
  loadScene();
 }
}
function current(){return state.path.at(-1)}
function rootParts(){return state.mode==='exterior'?state.mission.components:internalParts(state.mission)}
function navigate(requested, updateHash = true, restoreArchive = false) {
 const toCollection = requested === 'coleccion';
 const aliases = {contacto: 'nosotros', catalogo: 'modelos', documentales: 'inicio', coleccion: 'modelos', proximamente: 'inicio', timeline: 'inicio'};
 const validViews = ['inicio', 'modelos', 'nosotros', 'explorador'];
 let view = aliases[requested] || requested;
 if (!validViews.includes(view)) view = 'inicio';
 if (state.view !== view) contextToken++;
 state.view = view;
 if (view !== 'explorador') {
  lrv3Demonstrations.close();
  void viewerExpansion.close();
  guide.stop();
  componentDock.close();
  digitalTwinUI?.story.stop();
  digitalTwinUI?.actions.cancel();
 }
 document.body.dataset.view = view;
 for (const section of $$('.view')) section.hidden = section.id !== view;
 for (const link of $$('nav a')) {
  const active = link.dataset.tab === (view === 'explorador' ? 'modelos' : view);
  link.classList.toggle('active', active);
  if (active) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
 }
 nav.classList.remove('open');
 $('#menu-toggle').setAttribute('aria-expanded', 'false');
 if (view === 'explorador') {
  if (!missionRequested) loadMission(state.mission);
  else componentDock.open();
  guide.start();
 }
 if (updateHash) {
  const url = new URL(location.href);
  url.hash = toCollection ? 'coleccion' : view;
  if (view === 'explorador') url.searchParams.set('mission', state.mission.id);
  else url.searchParams.delete('mission');
  history.replaceState(null, '', url);
 }
 if (restoreArchive && archivePosition !== undefined) {
  window.scrollTo({top: archivePosition, behavior: 'instant'});
  archiveButton?.focus({preventScroll: true});
 } else if (toCollection) {
  $('#coleccion').scrollIntoView({behavior: scrollMode, block: 'start'});
 } else {
  window.scrollTo({top: 0, behavior: 'instant'});
  if (updateHash) $('#main').focus({preventScroll: true});
 }
 syncYear();
}
let sceneEpoch=0,sceneLoadTimer;
function updateModelNote(){
 const m=state.mission,inside=state.mode!=='exterior';
 $('#model-badge').textContent=inside?'CORTE TÉCNICO / '+state.path[0].name.toUpperCase():(m.schematic?'RECONSTRUCCIÓN PBR':'EXTERIOR NASA · PBR');
 $('#model-note').textContent=(inside?'Interiores educativos específicos de cada conjunto. La geometría, las dimensiones y el cableado no son CAD de vuelo validado. ':m.id==='orbiter'?'Lunar Orbiter I · configuración de vuelo con manta térmica instalada y puerta de la cámara abierta. Paneles y antenas desplegados. La geometría fina y los interiores sin planos públicos son reconstrucciones educativas. ':m.id==='phoenix'?'Phoenix reconstruido con documentación de sus instrumentos y fotografías NASA/JPL. Los detalles finos sin planos públicos son aproximados. ':m.schematic?'Exterior reconstruido a partir de fotografías y documentación NASA. Los detalles no documentados son aproximaciones visuales. ':'Exterior histórico de NASA 3D Resources. ')+(m.family==='apollo'?'La cabina pertenecía a la etapa de ascenso; solo la etapa de descenso quedó en la Luna. ':'')+(m.id==='mariner'?'Ubicación orbital actual no confirmada.':'');
 $('#viewer-caption').textContent=inside?'Interior abierto · Pulsa una etiqueta para seguir hasta el componente.':'Pulsa el nombre de cualquier sistema para entrar directamente a su interior.';
 if(m.id==='ds2'){$('#model-note').textContent='Deep Space 2 · cápsula cerrada en la vista general. Tapa, antena y acabados reconstruidos de fotografías NASA/JPL; consulta las imágenes de referencia en la ficha. El interior y sus separaciones son educativos.';$('#viewer-caption').textContent=inside?'Selecciona una pieza para elevarla. Volver la recoloca; la sonda permanece transparente como referencia.':'Cápsula cerrada · selecciona un sistema para ver su interior.';}
 if(m.id==='insight'){$('#model-note').textContent=inside?'InSight · conjuntos respaldados por NASA/JPL y el equipo SEIS. Las vistas conservan la nave como contexto; el despiece es educativo. La tarjeta SEIS-AC utiliza su fotografía publicada. No se inventan pistas de placas sin documentación.':'InSight · exterior y colores del recurso 3D NASA. Configuración de inspección anterior al despliegue: SEIS, WTS y HP³ sobre la plataforma; brazo levantado. La forma de los detalles pequeños no equivale a un CAD de vuelo certificado.';$('#viewer-caption').textContent=inside?'Selecciona una pieza para elevarla y estudiarla. Volver la recoloca en el conjunto.':'Selecciona un sistema. La nave permanece como referencia durante la inspección.';}
 if(m.id==='phoenix'){$('#model-note').textContent=inside?'Phoenix · cada instrumento conserva su posición en la nave. Las piezas se elevan al seleccionarlas y los arneses siguen sus conectores. Consulta las fuentes: el trazado de las placas y otros detalles sin planos son educativos.':'Phoenix · brazo extendido con eslabones de aluminio y herrajes de titanio; TEGA con entradas en dos caras. Plataforma e instrumentos propios basados en NASA/JPL y PDS. Pose representativa; detalles internos sin planos públicos identificados como educativos.';$('#viewer-caption').textContent=inside?'Toca una pieza para elevarla. La nave permanece transparente como referencia; «Volver» reúne el conjunto.':'Selecciona un instrumento para inspeccionarlo en la propia nave.';}
 if(m.family==='viking'){$('#model-note').textContent=inside?'Viking · cortes basados en NASA RP-1027. Las placas, pistas, bobinados y conductos internos sin planos completos son educativos; consulta la evidencia de cada componente.':'Viking · configuración de superficie reconstruida de las figuras NASA 21, 23, 72 y 93. Depósitos y motores fuera del cuerpo; antenas en sus herrajes. Orientación de la antena y del muestreador representativa, no un estado de un sol concreto.';$('#viewer-caption').textContent=inside?'El sistema se separa y la nave queda como referencia. «Reensamblar» vuelve a reunir sus piezas.':'Selecciona un sistema para abrir su despiece.';}
 if (['eagle', 'lrv15', 'viking2', 'spirit', 'opportunity', 'sojourner'].includes(m.id) && m.fleet?.configuration) {
  $('#model-note').textContent = m.fleet.configuration + '. Las fichas de componentes enlazan sus fuentes e identifican los detalles reconstruidos.';
 }
 if(m.id==='surveyor'){$('#model-note').textContent=inside?'Surveyor III · despiece progresivo basado en JPL TR 32-1177 y NASA SP-184. Cada pieza muestra su referencia. Pistas, prescripciones ópticas y detalles internos sin plano público se identifican como educativos.':'Surveyor III · configuración de superficie antes de Apollo 12. Incluye batería auxiliar, sensor Canopus, tres vernier y sus seis depósitos. El retrocohete central ya separado se estudia en la vista de propulsión de vuelo.';}
 $('.viewer-wrap').classList.toggle('inside',inside);
 $('#back-component').disabled=!state.path.length;
}
function focusCurrent(){
 const p=current();
 if(!p||state.path.length===1){viewer.cameraTarget='auto auto auto';viewer.cameraOrbit='30deg 62deg 105%';}
 else{viewer.cameraTarget=p.position.map(v=>v+'m').join(' ');viewer.cameraOrbit=`${35-state.path.length*6}deg 62deg ${p.radius||.65}m`;}
 if(reduced)viewer.jumpCameraToGoal();
}
async function loadScene(){
 const token=++sceneEpoch;clearTimeout(sceneLoadTimer);state.loaded=false;
 try{await ensureLegacyViewer();}catch(error){if(token===sceneEpoch)showViewerFailure(error);return;}if(token!==sceneEpoch)return;$('#model-loading').hidden=false;$('#model-loading').textContent=state.mode==='exterior'?'Preparando el exterior…':'Abriendo '+state.path[0].name+'…';
 viewer.querySelectorAll('.hotspot').forEach(e=>e.remove());viewer.autoRotate=false;
 $('#rotate-model').setAttribute('aria-pressed','false');$('#rotate-model').textContent='Órbita automática';
 viewer.alt=state.mission.name+': '+(state.mode==='exterior'?'exterior':state.path[0].name+' · interior educativo');
 viewer.poster=state.mode==='exterior'?missionPhoto(state.mission).src:'';
 const path=state.mode==='exterior'?state.mission.model:state.path[0].scene,next=new URL(path,import.meta.url);next.searchParams.set('v','20261008a');next.searchParams.set('attempt',String(contextToken));
 const same=viewer.src===next.href&&viewer.loaded===true;viewer.src=next.href;if(same){state.loaded=true;setViewerControls(true);$('#model-loading').hidden=true;}
 else sceneLoadTimer=setTimeout(()=>{if(token!==sceneEpoch||state.loaded)return;viewer.removeAttribute('src');showViewerFailure(Object.assign(new Error('Se agotó el tiempo de carga del modelo.'),{code:'ASSET_TIMEOUT'}));},45000);
 viewer.cameraTarget='auto auto auto';viewer.cameraOrbit='30deg 62deg 105%';
 updateModelNote();updateParts();
}
function renderMissionReferences(mission, photo, narration) {
 const backdrop = backgroundFor(mission, mission.id === 'viking2' ? 'orbital' : undefined);
 const references = [
  ['NASA · Ficha de la misión', mission.source],
  ['Fotografía de archivo · ' + photo.credit, photo.source],
  ['Fondo del visor · ' + backdrop.title + ' · ' + backdrop.credit, backdrop.source]
 ];
 if (mission.id === 'viking2') {
  const surface = backgroundFor(mission, 'surface');
  references.push(['Fondo del lander · ' + surface.title + ' · ' + surface.credit, surface.source]);
 }
 const technical = mission.fleet?.source ||
  (mission.id === 'sojourner' ? 'https://planetarydata.jpl.nasa.gov/img/data/mpfr-m-rvrcam-2-edr-v1.0/mprv_0001/document/insthost.htm' : null);
 if (technical) references.push(['Documentación técnica de referencia', technical]);
 references.push(...getMissionStory(mission).sources);
 for (const reference of Object.values(mission.fleet?.references || {})) {
  references.push([reference.title || reference.label || reference.url, reference.url]);
 }
 if (mission.id === 'lrv17') {
  references.push(['Manual del LRV-3 · NASA', 'https://apollojournals.org/alsj/LRVSysHndbkA17.pdf']);
 }

 const componentSources = [];
 function collectSources(parts) {
  for (const part of parts) {
   if (part.source) componentSources.push(['Fuente · ' + part.name, part.source]);
   collectSources(part.children || []);
  }
 }
 collectSources(mission.components);
 if (mission.id === 'orbiter') collectSources(lunarOrbiterExperience.supplementaryParts);

 function renderLinks(id, entries) {
  const seen = new Set();
  $(id).innerHTML = entries.filter(([, href]) => {
   if (!href || seen.has(href)) return false;
   seen.add(href);
   return true;
  }).map(([label, href]) =>
   `<li><a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)} →</a></li>`
  ).join('');
 }

 renderLinks('#phase-sources', narration);
 renderLinks('#mission-reference-links', [...references, ...componentSources]);
}

function renderMissionPhoto(photo) {
 const image = $('#mission-photo img');
 image.alt = photo.alt;
 image.src = photo.src;
 const credit = $('#mission-photo a');
 credit.href = photo.source;
 credit.textContent = photo.credit + ' →';
}

function loadMission(m, {retryViewer = false} = {}) {
 if (!m) return;
 missionRequested = true;
 if (!retryViewer) guide.stop();
 lrv3Demonstrations.selectMission(m.id);
 failureCheckController?.abort();
 failureCheckController = null;
 clearTimeout(sceneLoadTimer);
 merAdapter?.destroy();
 merAdapter = null;
 fleetRequest?.abort();
 fleetRequest = null;
 viewerError.hidden = true;
 state.loaded = false;
 contextToken++;
 digitalTwinUI?.destroy();
 digitalTwinUI = null;
 twinRegistry = null;
 twinContext = {};
 sceneBackground.set(m, m.id === 'viking2' ? 'orbital' : undefined);
 fleetEpoch++;
 fleetViewer?.destroy();
 fleetViewer = null;
 fleetHost.hidden = true;
 viewer.hidden = false;
 const stage = $('.viewer-wrap');
 stage.classList.remove('sojourner-active', 'inside', 'show-part-labels');
 stage.classList.toggle('mars', m.world === 'Marte');
 stage.classList.toggle('insight-viewport', !!m.fleet);
 stage.classList.toggle('viking2-viewport', m.id === 'viking2');
 stage.classList.toggle('mariner-viewport', m.id === 'mariner');
 sceneEpoch++;
 state.mission = m;
 state.path = [];
 state.mode = 'exterior';
 componentDock.load(m);
 setViewerControls(false);

 $('#explorer-title').textContent = m.name;
 $('#mission-destination').textContent = `${m.world} · ${m.year} · ${m.type}`;
 $('#mission-select').value = m.id;
 $('#toggle-labels').setAttribute('aria-pressed', 'false');
 $('#toggle-labels').textContent = 'Mostrar etiquetas';
 const photo = missionPhoto(m);
 renderMissionPhoto(photo);
 if (!retryViewer) renderMissionReferences(m, photo, guide.load(m));
 if (state.view === 'explorador') {
  const url = new URL(location.href);
  url.searchParams.set('mission', m.id);
  history.replaceState(null, '', url);
  guide.start();
 }

 if (m.fleet) startFleet();
 else loadScene();
}
function worldPosition(p){
 if(state.mode!=='exterior')return p.position;
 if(p.exteriorPosition)return p.exteriorPosition;
 const d=viewer.getDimensions?.(),c=viewer.getBoundingBoxCenter?.();
 if(!d||!c)return p.position;
 return [c.x+p.position[0]*d.x*.55,c.y+p.position[1]*d.y*.55,c.z+p.position[2]*d.z*.55];
}
function refreshHotspots(){
 viewer.querySelectorAll('.hotspot').forEach(e=>e.remove());
 const list=current()?.children||rootParts();
 list.forEach(p=>{const b=document.createElement('button');b.className='hotspot';b.slot='hotspot-'+p.id;b.dataset.position=worldPosition(p).map(v=>v+'m').join(' ');b.dataset.normal='0m 1m 0m';const label=document.createElement('span');label.className='hotspot-label';label.textContent=p.name;const line=document.createElement('span');line.className='hotspot-leader';line.setAttribute('aria-hidden','true');b.append(line,label);b.setAttribute('aria-label',(state.mode==='exterior'?'Entrar a ':'Inspeccionar ')+p.name);b.onclick=()=>selectPart(p);viewer.append(b)});requestAnimationFrame(layoutHotspotLabels);
}
// Keep component names away from one another while their dots remain on the mesh.
function layoutHotspotLabels(){
 const bounds=viewer.getBoundingClientRect();if(bounds.width<100||bounds.height<100)return;
 const labels=[...viewer.querySelectorAll('.hotspot')].map(button=>{
  const dot=button.getBoundingClientRect(),label=button.querySelector('.hotspot-label');
  return {button,label,x:dot.left-bounds.left+dot.width/2,y:dot.top-bounds.top+dot.height/2,w:label.offsetWidth,h:label.offsetHeight};
 });
 const occupied=[];
 for(const item of labels.sort((a,b)=>a.y-b.y)){
  const {button,label,x,y,w,h}=item;
  const right=x<bounds.width/2;
  let left=Math.min(bounds.width-w-12,Math.max(12,x+(right?20:-w-20)));
  let top=Math.min(bounds.height-h-105,Math.max(96,y-h/2));
  for(let attempt=0;attempt<14;attempt++){
   const hit=occupied.find(r=>left<r.x+r.w+8&&left+w+8>r.x&&top<r.y+r.h+7&&top+h+7>r.y);
   if(!hit)break;
   const next=hit.y+hit.h+9;top=next+h<bounds.height-105?next:Math.max(96,hit.y-h-9);
   if(attempt===7)left=Math.max(12,Math.min(bounds.width-w-12,right?bounds.width-w-15:15));
  }
  occupied.push({x:left,y:top,w,h});
  label.style.left=(left-x+6)+'px';label.style.top=(top-y+6)+'px';
  const endX=right?left:left+w,endY=top+h/2,dx=endX-x,dy=endY-y;
  const line=button.querySelector('.hotspot-leader');line.style.width=Math.hypot(dx,dy)+'px';line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
 }
}
viewer.addEventListener('camera-change',()=>requestAnimationFrame(layoutHotspotLabels));
window.addEventListener('resize',()=>requestAnimationFrame(layoutHotspotLabels));
function showComponentDetails(part) {
 $('#component-title').textContent = part?.name || '';
 $('#component-title').hidden = !part;
 $('#component-description').textContent = part?.description || 'Abre Componentes junto al visor para recorrer los sistemas y leer cómo funcionan.';
 $('#component-reading').innerHTML = componentReading(part, state.mission);
 $('#component-specs').innerHTML = part?.specs && Object.keys(part.specs).length ?
  `<table class="spec-table"><tbody>${Object.entries(part.specs).map(([key, value]) => `<tr><th scope="row">${escape(key)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table>` : '';
 $('#mission-source').href = part?.source || state.mission.source;
 $('#mission-source').textContent = part?.source ? 'Consultar fuente del componente →' : 'Consultar fuente NASA →';
}
function updateParts() {
 const part = current();
 componentDock.sync(part, state.path);
 $('#zoom-label').textContent = part ? `Capa ${state.path.length}` : 'Vista completa';
 $('#breadcrumbs').innerHTML = part ? `<button data-depth="0">Vista completa</button>${state.path.map((item, i) => `<span aria-hidden="true">/</span><button data-depth="${i + 1}" ${i === state.path.length - 1 ? 'aria-current="location"' : ''}>${escape(item.name)}</button>`).join('')}` : '';
 showComponentDetails(part);
 if (state.loaded && fleetHost.hidden) refreshHotspots();
 $('#back-component').disabled = !part;
}
function selectPart(p){
 if(!p||!state.loaded||!viewerError.hidden)return;
 if(fleetViewer){fleetViewer.choose(p.key||p.id);return;}
 if(!p||state.path.length>=4)return;
 if(state.mode==='exterior'){
  const target=worldPosition(p),token=++sceneEpoch;
  viewer.cameraTarget=target.map(v=>v+'m').join(' ');viewer.cameraOrbit='30deg 65deg 48%';
  viewer.querySelectorAll('.hotspot').forEach(e=>e.remove());
  const enter=()=>{if(token!==sceneEpoch)return;state.path=[p];state.mode='interior';loadScene();};
  if(reduced)enter();else setTimeout(enter,320);
 }else{state.path.push(p);focusCurrent();updateParts();}
}
function goDepth(depth){
 if(fleetViewer){manualInspection();fleetViewer.goDepth(depth);return;}
 if(!fleetHost.hidden)return;
 sceneEpoch++;
 if(depth===0){const wasInside=state.mode!=='exterior';state.path=[];state.mode='exterior';if(wasInside)loadScene();else{focusCurrent();updateParts();}updateModelNote();return;}
 state.path=state.path.slice(0,depth);focusCurrent();updateParts();updateModelNote();
}
function resetCamera(){goDepth(0)}
viewer.addEventListener('load',event=>{if(viewer.hidden||!fleetHost.hidden||!viewerError.hidden||event.detail?.url&&event.detail.url!==viewer.src&&event.detail.url!==new URL(viewer.src,location.href).href)return;clearTimeout(sceneLoadTimer);state.loaded=true;setViewerControls(true);$('#model-loading').hidden=true;focusCurrent();refreshHotspots();updateModelNote();});
viewer.addEventListener('error',event=>{if(viewer.hidden||!fleetHost.hidden)return;clearTimeout(sceneLoadTimer);showViewerFailure(event.detail?.sourceError||new Error('No se pudo cargar el modelo.'));});
$('#reset-camera').onclick=resetCamera;
$('#back-component').onclick=()=>{if(fleetViewer){manualInspection();fleetViewer.back();return;}goDepth(Math.max(0,state.path.length-1));};
$('#mission-select').onchange=e=>loadMission(missions.find(m=>m.id===e.target.value));
$('#rotate-model').onclick=()=>{manualInspection();const engine=fleetViewer,active=engine?!engine.autoRotate:!viewer.autoRotate;if(engine)engine.setAutoRotate(active);else viewer.autoRotate=active;$('#rotate-model').setAttribute('aria-pressed',String(active));$('#rotate-model').textContent=active?'Pausar órbita':'Órbita automática'};
$('#menu-toggle').onclick = () => {
 const open = nav.classList.toggle('open');
 $('#menu-toggle').setAttribute('aria-expanded', String(open));
};
document.addEventListener('click', event => {
 const route = event.target.closest('a[href^="#"]');
 if (route && ['inicio', 'coleccion', 'modelos', 'nosotros', 'explorador'].includes(route.hash.slice(1))) {
  event.preventDefault();
  navigate(route.hash.slice(1), true, route.id === 'return-to-archive');
  return;
 }
 const missionButton = event.target.closest('button[data-mission]');
 if (missionButton) {
  archivePosition = state.view === 'modelos' ? window.scrollY : undefined;
  archiveButton = state.view === 'modelos' ? missionButton : null;
  loadMission(missions.find(mission => mission.id === missionButton.dataset.mission));
  navigate('explorador');
  return;
 }
 const year = event.target.closest('.year-link');
 if (year) {
  activeYear(Number(year.dataset.year));
  $('#year-' + year.dataset.year).scrollIntoView({behavior: scrollMode, block: 'start'});
  return;
 }
 const part = event.target.closest('[data-part]');
 if (part) {
  componentDock.select(part.dataset.part);
  return;
 }
 const crumb = event.target.closest('[data-depth]');
 if (crumb) goDepth(Number(crumb.dataset.depth));
});
window.addEventListener('hashchange', () => navigate(location.hash.slice(1), false));
$('.skip-link').onclick = event => {
 event.preventDefault();
 $('#main').focus({preventScroll: true});
 window.scrollTo({top: 0, behavior: 'instant'});
};
$('#back-to-top').onclick = () => window.scrollTo({top: 0, behavior: scrollMode});
$('#toggle-labels').onclick = event => {
 const shown = $('.viewer-wrap').classList.toggle('show-part-labels');
 event.currentTarget.setAttribute('aria-pressed', String(shown));
 event.currentTarget.textContent = shown ? 'Ocultar etiquetas' : 'Mostrar etiquetas';
};
setupMissionFilters(syncYear);
navigate(location.hash.slice(1) || 'inicio', false);
