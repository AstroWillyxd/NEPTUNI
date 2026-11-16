import {certaintyLabels} from './component-registry.js?v=20261024lo1';
import {createActionController} from './action-controller.js?v=20261024lo1';
import {auditAssets,experienceAssets} from './asset-audit.js?v=20261004j';
import {createStoryController} from './story-controller.js?v=20261004k';
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
export function createExperienceUI({mission,registry,getEngine,getContext,onContext,onInteract=()=>{}}={}){
 const layout=document.querySelector('.explorer-layout'),aside=layout.querySelector('.inspection'),experience=registry.experience;
 let selected=null,view='exterior',evidenceOpen=false,lastMetrics=null,destroyed=false,isReady=false,beforeFullscreen=null,evidenceReturnFocus=null,assetRequest=null,storyState=null;
 layout.classList.add('digital-twin-active');document.body.classList.add('twin-exploring');
 const navigation=element('section','twin-navigation');navigation.setAttribute('aria-label','Modos de exploración de '+mission.name);layout.before(navigation);
 const modes=element('div','twin-modes'),controls=element('div','twin-controls');navigation.append(modes);
 const button=(parent,label,fn)=>{const b=element('button','',label);b.type='button';b.dataset.requiresEngine='true';b.disabled=!isReady;b.onclick=fn;parent.append(b);return b;};
 const manual=fn=>(...args)=>{interrupt();onInteract();return fn(...args);};
 const changeStep=fn=>(...args)=>{controller.cancel();onInteract();return fn(...args);};
 const modeButtons={
  exterior:button(modes,'Exterior',manual(()=>{closeEvidence();getEngine()?.assembleModel();})),
  interior:button(modes,'Interior',manual(()=>openInterior())),
  evidence:button(modes,'Evidencia',manual(()=>openEvidence()))
 };modeButtons.evidence.dataset.requiresEngine='false';for(const b of Object.values(modeButtons))b.setAttribute('aria-pressed','false');
 const explode=button(controls,'Desmontar nave',manual(()=>{closeEvidence();getEngine()?.explodeModel();})),assemble=button(controls,'Ensamblar',manual(()=>{closeEvidence();getEngine()?.assembleModel();}));
 const guided=button(controls,'Recorrido guiado',manual(()=>{showInfo();story.start();}));
 const info=button(controls,'Ocultar ficha',()=>{if(layout.classList.contains('twin-clean')&&document.fullscreenElement&&matchMedia('(max-width:760px)').matches){showInfo();return;}const clean=layout.classList.toggle('twin-clean');info.textContent=clean?'Mostrar ficha':'Ocultar ficha';info.setAttribute('aria-pressed',String(clean));});info.setAttribute('aria-pressed','false');info.dataset.requiresEngine='false';
 const viewportActions=[explode,assemble,guided,info];
 let coverToggle;
 if(experience.exteriorCover){coverToggle=button(controls,experience.exteriorCover.hideLabel,manual(()=>{const engine=getEngine();engine?.setExteriorCoverVisible(!engine.state.exteriorCoverVisible);sync(selected,selected?.path||[],view);}));coverToggle.setAttribute('aria-pressed','false');viewportActions.push(coverToggle);}
 const certainty=element('p','twin-certainty'),actions=element('div','twin-part-actions'),children=element('div','twin-children'),evidence=element('section','twin-evidence');evidence.hidden=true;evidence.setAttribute('aria-label','Evidencia histórica');
 const title=document.querySelector('#component-title');title.before(certainty);document.querySelector('#component-description').after(actions,children);document.querySelector('#component-reading').after(evidence);
 button(actions,'Abrir interior',manual(openInterior));button(actions,'Aislar pieza',manual(()=>getEngine()?.isolateComponent()));button(actions,'Ver evidencia',manual(()=>openEvidence()));
 const storyCard=element('section','twin-story');storyCard.setAttribute('aria-label','Recorrido guiado');const storyKicker=element('p','eyebrow'),storyTitle=element('h2'),storyText=element('p'),storyPrompt=element('p','twin-story-prompt'),storyMedia=element('div'),storyActions=element('div','twin-story-actions');storyCard.append(storyKicker,storyTitle,storyText,storyPrompt,storyMedia,storyActions);aside.prepend(storyCard);
 const previous=button(storyActions,'Anterior',changeStep(()=>story.previous())),next=button(storyActions,'Siguiente',changeStep(()=>story.next())),retryStory=button(storyActions,'Reintentar paso',changeStep(()=>story.retry()));retryStory.hidden=true;button(storyActions,'Explorar libremente',manual(()=>getEngine()?.overview()));storyPrompt.setAttribute('role','status');
 const status=element('p','twin-status');status.setAttribute('role','status');navigation.after(status);
 const diagnostics=element('details','twin-diagnostics'),summary=element('summary','','Diagnóstico 3D'),diagnosticText=element('p','','Sin mediciones de renderizado disponibles. Mueve el modelo cuando WebGL esté activo para medir; no se estima el rendimiento de Android.');diagnostics.append(summary,diagnosticText);document.querySelector('#model-note').after(diagnostics);
 const controller=createActionController({registry,getEngine,getContext,onEvidence:key=>openEvidence(key),onStory:id=>{const i=experience.story.findIndex(s=>s.id===id);return story.go(i);}});
 const story=createStoryController(experience.story,{execute:command=>controller.execute(command),onChange:data=>{
  storyState=data;storyCard.hidden=!data;if(!data){retryStory.hidden=true;getEngine()?.cancelPending?.();onContext({current_story_step:null});return;}
  showInfo();previous.hidden=next.hidden=false;startStory.hidden=true;const {step,index,total,busy,failed}=data;storyKicker.textContent=`RECORRIDO · ${index+1} / ${total}`;storyTitle.textContent=step.title;storyText.textContent=step.text;storyPrompt.textContent=failed?'No se pudo preparar este paso. Reintenta o continúa explorando la nave.':busy?'Preparando la vista del recorrido…':step.prompt;storyMedia.replaceChildren();if(step.media)storyMedia.append(mediaFigure(experience.media[step.media]));syncStoryButtons();next.textContent=index===total-2?'Descubrir el legado':'Siguiente';onContext({current_story_step:step.id});
 }});
 function syncStoryButtons(){if(!storyState)return;const {busy,index,total,failed}=storyState;previous.disabled=!isReady||busy||index===0;next.disabled=!isReady||busy||failed||index===total-1;retryStory.hidden=!failed;retryStory.disabled=!isReady||busy;storyCard.setAttribute('aria-busy',String(busy));}
 function interrupt(){story.stop();controller.cancel();}
 function showInfo(){if(document.fullscreenElement&&matchMedia('(max-width:760px)').matches){beforeFullscreen=false;document.exitFullscreen?.();}layout.classList.remove('twin-clean');info.textContent='Ocultar ficha';info.setAttribute('aria-pressed','false');}
 function mediaFigure(media){const figure=element('figure','twin-media'),img=element('img');img.src=media.src;img.alt=media.alt;img.loading='lazy';const caption=element('figcaption','',media.caption),a=element('a','','Ver fuente original');a.href=media.url;a.target='_blank';a.rel='noopener noreferrer';figure.append(img,caption,a);return figure;}
 function closeEvidence(){if(evidenceOpen)(evidenceReturnFocus?.isConnected&&evidenceReturnFocus.getClientRects().length?evidenceReturnFocus:modeButtons.evidence).focus({preventScroll:true});storyCard.hidden=!story.current;evidenceOpen=false;evidence.hidden=true;aside.classList.remove('twin-evidence-active');syncMode();}
 function openEvidence(key=selected?.key){story.stop();if(!evidenceOpen)evidenceReturnFocus=document.activeElement;const part=registry.evidence(key);evidenceOpen=true;showInfo();evidence.hidden=false;aside.classList.add('twin-evidence-active');evidence.replaceChildren();storyCard.hidden=true;
  evidence.append(element('h3','',part?.name||'Lunar Orbiter 1 · Archivo verificable'),element('p','twin-certainty',part?.label||certaintyLabels.VISUALLY_RECONSTRUCTED),element('p','',part?.limit||experience.configuration));
  const refs=part?.sources||Object.values(experience.sources);for(const s of refs){const a=element('a','twin-reference',s.title);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';evidence.append(a);}
  const media=part?.media||[experience.media.museum||experience.media.hardware,experience.media.diagram];for(const item of media)evidence.append(mediaFigure(item));
  evidence.append(element('p','twin-evidence-limit','Una fuente puede confirmar la función de un componente sin documentar cada dimensión interior. Las pistas PCB, las curvaturas de lentes y otros detalles finos no se presentan como planos de fabricación.'));
  button(evidence,'Regresar a la ficha',closeEvidence).dataset.requiresEngine='false';evidence.querySelector('button').disabled=false;syncMode();evidence.querySelector('h3').tabIndex=-1;evidence.querySelector('h3').focus({preventScroll:true});
 }
 function openInterior(){story.stop();closeEvidence();const key=selected?.key||registry.roots[0].key;if(!registry.get(key)?.path[0].scene){status.textContent='Sin plano interior público: consulta la evidencia del sensor.';openEvidence(key);return;}return getEngine()?.choose(key);}
 function syncMode(){const mode=evidenceOpen?'evidence':view==='interior'?'interior':'exterior';for(const [key,b]of Object.entries(modeButtons))b.setAttribute('aria-pressed',String(key===mode));onContext({current_view:mode,current_zoom_level:selected?registry.path(selected.key).length:0});}
 function sync(part,path=[],sceneView='exterior'){
  if(destroyed)return;layout.querySelector('.viewer-wrap').classList.toggle('inside',sceneView==='interior');selected=part?registry.get(part.key):null;view=sceneView;
  if(evidenceOpen)openEvidence(selected?.key);
  syncMode();actions.hidden=!selected;certainty.textContent=selected?certaintyLabels[selected.certainty]:'RECONSTRUCCIÓN INTERACTIVA · ESCALA MÉTRICA';
  document.querySelector('#component-reading').replaceChildren();
  document.querySelector('#component-description').textContent=selected?.function||'Selecciona un sistema sobre la nave. Acércate, abre sus piezas y comprueba su historia con las fuentes originales.';
  children.replaceChildren();const list=selected?registry.children(selected.key):registry.roots;
  for(const p of list)button(children,p.name,manual(()=>{closeEvidence();const engine=getEngine();return view==='interior'?engine?.choose(p.key):engine?.focusComponent(p.key);}));
  document.querySelector('#mission-source').href=selected?.sources[0].url||experience.sources.report.url;
  const uncovered=getEngine()?.state.exteriorCoverVisible===false;
  if(coverToggle){coverToggle.textContent=uncovered?experience.exteriorCover.showLabel:experience.exteriorCover.hideLabel;coverToggle.setAttribute('aria-pressed',String(uncovered));}
  document.querySelector('#model-badge').textContent=view==='interior'?'CORTE EDUCATIVO':view==='exploded'?'DESPIECE EDUCATIVO':uncovered?'INGENIERÍA · MANTA RETIRADA':experience.badge||'INGENIERÍA · BARRERA DE MYLAR RETIRADA';
  document.querySelector('#zoom-label').textContent=selected?`${selected.system.toUpperCase()} · CAPA ${path.length}`:view==='exploded'?'SUBSISTEMAS SEPARADOS':'NAVE COMPLETA';
  document.querySelector('#viewer-caption').textContent=view==='interior'?'Primero ensamblado, después separado · selecciona sus piezas.':view==='exploded'?'Las separaciones explican el montaje; no son mecanismos de despliegue en vuelo.':'Selecciona una pieza para acercarte; abre después su interior.';
  document.querySelector('#model-note').textContent=(uncovered?experience.exteriorCover.note:experience.configuration)+' El fondo lunar es contexto de archivo, no una simulación de la órbita. Los interiores y detalles finos sin planos públicos se identifican como representaciones educativas.';
  onContext({current_component:selected?.path[0]?.id||null,current_subcomponent:selected?.path.length>1?selected.key:null});
 }
 function sceneChange(mode,relation){layout.querySelector('.viewer-wrap').classList.toggle('inside',mode==='interior');view=mode;sync(selected,selected?.path||[],mode);status.textContent=relation?.text|| (mode==='exploded'?'Despiece progresivo de los subsistemas. Puedes seleccionar una pieza mientras se separan.':'');}
 function performance(data){lastMetrics=data;if(!diagnostics.open)return;diagnosticText.textContent=`${data.fps?data.fps+' FPS · '+data.frameMs+' ms por fotograma':'FPS: mueve la cámara para medir'} · ${data.drawCalls} llamadas de dibujo · ${Number(data.triangles).toLocaleString('es')} triángulos · ${data.textures??'no disponible'} texturas · ${data.geometries??'no disponible'} geometrías · ${(data.compressedModelBytes/1e6).toFixed(2)} MB de exterior comprimido · carga ${data.loadMs} ms · calidad ${data.quality||'no disponible'} · DPR ${data.pixelRatio??'no disponible'} · memoria JS ${data.jsHeapBytes?(data.jsHeapBytes/1e6).toFixed(1)+' MB':'no disponible'}. Medición local durante movimiento; no representa una prueba en Android ni memoria GPU.`;}
 const assetStatus=element('p','twin-asset-status','Los recursos todavía no se han comprobado por HTTP.'),assetList=element('ul','twin-asset-list');assetStatus.setAttribute('aria-live','polite');
 const checkAssets=button(diagnostics,'Comprobar recursos',async()=>{
  assetRequest?.abort();const request=assetRequest=new AbortController();checkAssets.disabled=true;assetList.replaceChildren();assetStatus.textContent='Comprobando modelos, texturas y evidencia…';
  const results=await auditAssets(experienceAssets(mission,experience,{mobile:matchMedia('(max-width:760px)').matches||matchMedia('(pointer:coarse)').matches}),{signal:request.signal});
  if(destroyed||request.signal.aborted)return;
  const failed=results.filter(r=>!r.ok);assetStatus.textContent=`${results.length-failed.length} / ${results.length} recursos disponibles por HTTP. ${failed.length?'Hay fallos que requieren revisión.':'Sin fallos en esta comprobación.'} Esto no valida el renderizado WebGL.`;
  for(const result of results)assetList.append(element('li','',`${result.ok?'OK':'ERROR'} · ${result.path} · HTTP ${result.status??'sin respuesta'}${result.type?' · '+result.type:''}${result.bytes?' · '+(result.bytes/1e6).toFixed(2)+' MB':''}`));checkAssets.disabled=false;
 });checkAssets.dataset.requiresEngine='false';checkAssets.disabled=false;diagnostics.append(assetStatus,assetList);
 diagnostics.ontoggle=()=>{if(lastMetrics)performance(lastMetrics);};
 function escape(e){if(!e.defaultPrevented&&e.key==='Escape'&&evidenceOpen)closeEvidence();}document.addEventListener('keydown',escape);
 function fullscreen(){if(document.fullscreenElement===layout){layout.prepend(navigation);if(matchMedia('(max-width:760px)').matches){beforeFullscreen=layout.classList.contains('twin-clean');layout.classList.add('twin-clean');info.textContent='Mostrar ficha';info.setAttribute('aria-pressed','true');}}else{layout.before(navigation);if(beforeFullscreen!==null){layout.classList.toggle('twin-clean',beforeFullscreen);info.textContent=beforeFullscreen?'Mostrar ficha':'Ocultar ficha';info.setAttribute('aria-pressed',String(beforeFullscreen));beforeFullscreen=null;}}}document.addEventListener('fullscreenchange',fullscreen);
 // A short intro appears immediately; orbit remains available throughout.
 storyCard.hidden=false;storyKicker.textContent='1966 · LUNAR ORBITER 1';storyTitle.textContent='Antes de dar el primer paso';storyText.textContent='Antes de que un humano pudiera aterrizar en la Luna, había que descubrir dónde hacerlo. Descubre la nave que fotografió el camino.';storyPrompt.textContent='Explora libremente o sigue el recorrido de una fotografía, desde la cámara hasta la Tierra.';previous.hidden=true;next.hidden=true;const startStory=button(storyActions,'Comenzar recorrido',manual(()=>{previous.hidden=next.hidden=false;story.start();}));
 sync(null);onContext({current_story_step:'intro'});
 return{ready(value){isReady=value;getEngine()?.setMenuActions?.(viewportActions);for(const b of viewportActions)b.disabled=!value&&b.dataset.requiresEngine!=='false';for(const region of[navigation,storyCard,actions,children,evidence])for(const b of region.querySelectorAll('button'))b.disabled=!value&&b.dataset.requiresEngine!=='false';syncStoryButtons();},sync,sceneChange,performance,openEvidence,interrupt,story,actions:controller,async execute(actions,contextToken){if(!Array.isArray(actions)||!actions.length)return false;if(!actions.some(a=>a?.type==='start_story_step'))story.stop();for(const action of (Array.isArray(actions)?actions:[]).slice(0,5)){if(!await controller.execute(action,{contextToken}))return false;}return true;},destroy(){destroyed=true;getEngine()?.setMenuActions?.([]);for(const b of viewportActions)b.remove();assetRequest?.abort();story.destroy();controller.cancel();document.removeEventListener('keydown',escape);document.removeEventListener('fullscreenchange',fullscreen);for(const e of[navigation,status,certainty,actions,children,evidence,storyCard,diagnostics])e.remove();aside.classList.remove('twin-evidence-active');layout.classList.remove('digital-twin-active','twin-clean');document.body.classList.remove('twin-exploring');}};
}
