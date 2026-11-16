import * as T from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {GLTFLoader} from './vendor/three/GLTFLoader.js';
import {HDRLoader} from './vendor/three/HDRLoader.js';
import {MeshoptDecoder} from './vendor/three/meshopt_decoder.mjs';
import {createInspectionLabels} from './inspection-labels.js?v=20261004c';
import {sojournerParts,partById,partPath,overviewIds,clipLabels,meta} from './sojourner-parts.js?v=20261023v2';
import {captureRest,restoreRest,applyOpening,fitDistance} from './sojourner-transforms.js?v=20261023v2';
import {prepareSojournerMaterials,setSojournerLook} from './sojourner-materials.js?v=20261023v2';
import {loadWithDeadline,createGLTFAssetLoader,disposeGLTF} from './twin/asset-loader.js?v=20261009b';
import {renderingBudget} from './twin/device-capabilities.js?v=20261009b';
import {acquireViewerRuntime} from './viewer-runtime.js?v=20261025story';

export async function createSojourner(host,{onSelect=()=>{},onStatus=()=>{},onAvailability=()=>{},renderer:providedRenderer,camera:providedCamera,assetLoader:providedLoader,loadEnvironment=true,signal}={}){
 if(signal?.aborted)throw new DOMException('Carga cancelada','AbortError');
 host.classList.add('insight-experience','sojourner-v2-experience');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mobile=matchMedia('(max-width: 760px)').matches;
 const memory=globalThis.navigator?.deviceMemory;
 const budget=renderingBudget({mobile,dpr:devicePixelRatio,memory,cores:globalThis.navigator?.hardwareConcurrency});
 const lod=budget.tier==='LOW'?'low':mobile||memory!==undefined&&memory<=4?'medium':'high';
 const runtime=acquireViewerRuntime({renderer:providedRenderer,camera:providedCamera,antialias:budget.antialias}),renderer=runtime.renderer;
 renderer.setPixelRatio(budget.pixelRatio);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.enabled=budget.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=true;
 renderer.domElement.setAttribute('aria-label','Sojourner 3D. Arrastra para orbitar; usa el selector para inspeccionar cada componente.');
 renderer.domElement.tabIndex=0;host.append(renderer.domElement);
 const scene=new T.Scene(),camera=runtime.camera;camera.near=.003;camera.far=30;camera.updateProjectionMatrix();
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=.045;controls.maxDistance=5;
 controls.maxPolarAngle=Math.PI*.91;controls.enablePan=true;controls.autoRotateSpeed=.6;
 const stage=new T.Group();scene.add(stage);
 scene.add(new T.HemisphereLight(0xeaf2ff,0x60594e,.65));
 const key=new T.DirectionalLight(0xfff4e6,2.5);key.position.set(.8,1.8,1.4);key.castShadow=true;
 key.shadow.mapSize.set(budget.shadowSize,budget.shadowSize);
 Object.assign(key.shadow.camera,{left:-.85,right:.85,top:1,bottom:-.8,near:.1,far:5});
 key.shadow.bias=-.00006;key.shadow.normalBias=.0005;key.shadow.radius=4;scene.add(key);
 const fill=new T.DirectionalLight(0xddeaff,.85);fill.position.set(-1,.6,.4);scene.add(fill);
 const rim=new T.DirectionalLight(0xffffff,1.15);rim.position.set(.1,1,-1.3);scene.add(rim);
 const floor=new T.Mesh(new T.PlaneGeometry(10,10),new T.ShadowMaterial({opacity:.16}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.001;floor.receiveShadow=true;scene.add(floor);
 const cv=document.createElement('canvas');cv.width=cv.height=128;
 const ctx=cv.getContext('2d'),gradient=ctx.createRadialGradient(64,64,4,64,64,64);
 gradient.addColorStop(0,'rgba(31,37,43,.26)');gradient.addColorStop(1,'rgba(31,37,43,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadowTexture=new T.CanvasTexture(cv);
 const contact=new T.Group();scene.add(contact);
 for(const x of[-.2005,.2005])for(const z of[-.26,.03,.26]){
  const p=new T.Mesh(new T.PlaneGeometry(.135,.115),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  p.rotation.x=-Math.PI/2;p.position.set(x,0,z);contact.add(p);
 }

 const lifetime=new AbortController();
 const loader=providedLoader||createGLTFAssetLoader(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),{signal:lifetime.signal});
 const asset=name=>new URL('./assets/sojourner/'+name+'.glb?v=20261023v2',import.meta.url).href;
 let disposed=false,available=true,graphicsError=null,dirty=true,root,environment,frame=0,api;
 let storySelection=false,selected=null,isolated=false,open=0,openGoal=0,poseMove=null,move=null,lastAnchor=null;
 let loadingInterior=false,selectionRequest=0,playing=null,usingFallback=false,lastTime=performance.now();
 const objects=new Map(),rest=new Map(),hidden=new Set(),inspection={},pending={},clips=new Map(),meshes=[];
 const mixer=new T.AnimationMixer(stage);
 function belongs(object,names){for(let o=object;o&&o!==stage;o=o.parent)if(names.includes(o.name))return true;return false;}
 function retain(model){
  prepareSojournerMaterials(model,{anisotropy:Math.min(4,renderer.capabilities?.getMaxAnisotropy?.()||2)});
  captureRest(model,rest);
  model.traverse(o=>{if(o.name&&!objects.has(o.name))objects.set(o.name,o);if(o.isMesh)meshes.push(o);});
 }
 async function loadModel(name){
  const fallback=['high','medium','low'].includes(name)?'medium':name;
  if(!usingFallback){try{await MeshoptDecoder.ready;}catch{usingFallback=true;}}
  const load=path=>loadWithDeadline(()=>loader.loadAsync(asset(path)),{signal:lifetime.signal,onLateResult:disposeGLTF});
  if(usingFallback)return load('nomeshopt/'+fallback);
  try{return await load(name);}catch(error){
   if(lifetime.signal.aborted||error.name==='AbortError'||error.code?.startsWith('ASSET_'))throw error;
   // The backup is the same model hierarchy, with ordinary glTF accessors.
   const result=await load('nomeshopt/'+fallback);usingFallback=true;return result;
  }
 }

 const selector=document.createElement('label');selector.className='sj-selector';selector.textContent='Inspeccionar ';
 const select=document.createElement('select');select.disabled=true;select.setAttribute('aria-label','Seleccionar componente de Sojourner');
 const option=document.createElement('option');option.value='';option.textContent='Vista general';select.append(option);
 function addOptions(parent,depth=0){for(const p of sojournerParts.filter(p=>p.parent===parent)){
  const o=document.createElement('option');o.value=p.id;o.textContent='　'.repeat(depth)+p.name;select.append(o);addOptions(p.id,depth+1);
 }}
 addOptions('sojourner');selector.append(select);host.append(selector);
 select.onchange=()=>select.value?choose(select.value):reset();
 const toolbar=document.createElement('div');toolbar.className='sj-tools sj-tools-compact';toolbar.hidden=true;host.append(toolbar);
 const toolsMenu=document.createElement('details');toolsMenu.className='sj-tools-menu';
 const toolsSummary=document.createElement('summary');toolsSummary.setAttribute('aria-label','Opciones del modelo 3D');toolsSummary.title='Opciones del modelo 3D';
 const toolsOptions=document.createElement('div');toolsOptions.className='sj-tools-options';toolsMenu.append(toolsSummary,toolsOptions);
 function closeTools(){if(toolsMenu.open){toolsMenu.open=false;toolsSummary.focus({preventScroll:true});}}
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>{closeTools();return action();};toolsOptions.append(b);return b;}
 const interiorButton=button('Ver interior',()=>choose('avionics'));
 const isolateButton=button('Aislar componente',()=>isolate());
 const hideButton=button('Ocultar',()=>hide());
 const animationLabel=document.createElement('label');animationLabel.className='sj-animation-label';animationLabel.textContent='Mecanismo';
 const animationSelect=document.createElement('select');animationSelect.setAttribute('aria-label','Animación de Sojourner');
 for(const [id,label]of Object.entries(clipLabels)){const o=document.createElement('option');o.value=id;o.textContent=label;animationSelect.append(o);}
 animationLabel.append(animationSelect);toolsOptions.append(animationLabel);
 const playButton=button('Reproducir mecanismo',()=>play(animationSelect.value));
 const stopButton=button('Detener y restaurar',()=>stop());stopButton.hidden=true;
 const backButton=button('Volver',()=>back());backButton.title='Volver al conjunto anterior';toolbar.append(backButton,toolsMenu);
 const animationStatus=document.createElement('p');animationStatus.className='sj-animation-status';animationStatus.setAttribute('role','status');animationStatus.hidden=true;host.append(animationStatus);
 toolsMenu.addEventListener('keydown',e=>{if(e.key==='Escape'&&toolsMenu.open){e.preventDefault();e.stopPropagation();closeTools();}});
 toolsMenu.addEventListener('toggle',()=>{dirty=true;});
 function syncToolbar(){
  toolbar.hidden=!selected;isolateButton.textContent=isolated?'Mostrar conjunto':'Aislar componente';
  interiorButton.hidden=openGoal>0;stopButton.hidden=!playing;
  animationStatus.hidden=!playing;animationStatus.textContent=playing?clipLabels[playing.name]+(reduced?' · animación iniciada manualmente':''):'';
  for(const b of[isolateButton,hideButton,playButton,interiorButton,animationSelect])b.disabled=loadingInterior;
 }
 const labelLayer=createInspectionLabels(host,{onChoose:choose,project:p=>centerOf(p).project(camera),viewport:()=>renderer.domElement,stable:true,isMoving:()=>!!move||!!poseMove||!!playing});
 function isHidden(p){return partPath(p.id).some(c=>hidden.has(c.id));}
 function refreshLabels(){
  let ids=isolated&&selected?[selected.id]:selected?[selected.id,...selected.children.map(p=>p.id)]:overviewIds;
  if(selected&&!selected.children.length)ids=[selected.id,...(partById(selected.parent)?.children||[]).map(p=>p.id)];
  labelLayer.set([...new Set(ids)].map(partById).filter(p=>p&&!isHidden(p)),selected?.id);dirty=true;
 }
 function storyConnection(object){for(let o=object;o&&o!==stage;o=o.parent)if(/HARNESS|CABLE|COAX|TETHER|RIBBON|LOOM|INTERCONNECT/i.test(o.name))return true;return false;}
 function applyLooks(){
  const cutaway=selected?.file==='drive_cutaway';
  for(const o of meshes){
   const chosen=!!selected&&belongs(o,selected.nodes);
   const blocked=[...hidden].some(id=>belongs(o,partById(id)?.nodes||[]));
   const cutHide=cutaway&&meta.cutawayHide.some(prefix=>{for(let n=o;n;n=n.parent)if(n.name.startsWith(prefix))return true;return false;});
   o.visible=!blocked&&!cutHide&&(!isolated||chosen);
   let opacity=1;
   if(open>0){
    const cover=belongs(o,meta.components.find(c=>c.id==='web').coverNodes);
    const solar=belongs(o,['SOJOURNER_SOLAR_ARRAY_EXTERIOR']);
    const layers=belongs(o,['WEB_WALL_LAYERS']);
    const secondary=selected?.inside&&!chosen;
    const goal=secondary?(cover?.08:solar?.035:layers?.07:.19):cover?.28:layers&&selected?.id!=='web-layers'?.18:1;
    opacity=T.MathUtils.lerp(1,goal,open);
   }
   if(cutaway&&!chosen)opacity=Math.min(opacity,.12);
   if(storySelection)opacity=chosen||storyConnection(o)?1:.2;
   setSojournerLook(o,{opacity,selected:chosen,inspection:open>0||cutaway});
  }
  if(inspection.interior)inspection.interior.visible=open>.001||openGoal>0;
  if(inspection.drive)inspection.drive.visible=cutaway;
  floor.visible=contact.visible=!isolated;dirty=true;
 }
 function applyPose(){applyOpening(objects,rest,open);stage.updateMatrixWorld(true);applyLooks();}
 function startOpening(goal){openGoal=goal;poseMove={from:open,to:goal,start:performance.now(),duration:reduced?0:900};dirty=true;}
 function boundsOf(p){const box=new T.Box3();for(const n of p.nodes){const o=objects.get(n);if(o)box.union(new T.Box3().setFromObject(o,true));}return box;}
 function centerOf(p){const b=boundsOf(p);return b.isEmpty()?new T.Vector3(...p.position):b.getCenter(new T.Vector3());}
 function frameInfo(p){
  const bounds=p?boundsOf(p):new T.Box3().setFromObject(root,true);
  const target=bounds.isEmpty()?new T.Vector3(0,.3,0):bounds.getCenter(new T.Vector3());
  const radius=Math.max(.012,bounds.getBoundingSphere(new T.Sphere()).radius);
  const direction=new T.Vector3(...(p?.cameraFocus.direction||[.85,.64,1.12])).normalize();
  if(p?.inside)direction.set(.35,1.1,.8).normalize();
  if(p?.file==='drive_cutaway')direction.set(1,.22,.13).normalize();
  const distance=fitDistance(host.clientWidth||1,host.clientHeight||1,radius,camera.fov);
  return {target,position:target.clone().addScaledVector(direction,Math.max(.06,distance))};
 }
 function focusSelection(){
  move={from:camera.position.clone(),fromTarget:controls.target.clone(),start:performance.now(),duration:reduced?0:900};
  lastAnchor=selected?centerOf(selected):null;dirty=true;
 }
 async function ensureInspection(kind){
  if(inspection[kind])return inspection[kind];
  if(!pending[kind])pending[kind]=loadModel(kind).then(g=>{
   if(disposed){disposeGLTF(g);return null;}
   const asm=g.scene.getObjectByName(kind==='interior'?'SOJOURNER_INTERIOR_ASSEMBLY':'SOJOURNER_DRIVE_CUTAWAY_ASSEMBLY');
   if(!asm){disposeGLTF(g);throw new Error('Falta el conjunto de inspección.');}
   // The attachment is calculated at rest; animated parents must not alter its installation transform.
   stop();applyOpening(objects,rest,0);stage.updateMatrixWorld(true);g.scene.updateMatrixWorld(true);
   objects.get(kind==='interior'?'SOJOURNER_CHASSIS_FRAME':'BOGIE_RIGHT_MIDDLE_MOUNT').attach(asm);
   retain(asm);for(const c of g.animations)clips.set(c.name,c);
   inspection[kind]=asm;applyPose();return asm;
  }).catch(error=>{delete pending[kind];throw error;});
  return pending[kind];
 }
 async function choose(id,{story=false}={}){
  const p=partById(id);if(!p||disposed||!available)return false;
  const request=++selectionRequest,previous=selected;storySelection=story;if(story)hidden.clear();stop();selected=p;isolated=false;
  controls.autoRotate=false;move=null;select.value=p.id;
  const kind=p.file==='drive_cutaway'?'drive':p.inside||p.id==='web'?'interior':null;
  loadingInterior=!!kind&&!inspection[kind];syncToolbar();
  if(loadingInterior)onStatus(kind==='drive'?'Preparando el corte del motor…':'Abriendo la caja de electrónica…');
  try{if(kind)await ensureInspection(kind);}catch(error){
   if(disposed||request!==selectionRequest||error.name==='AbortError')return false;
   selected=previous;loadingInterior=false;select.value=selected?.id||'';applyLooks();refreshLabels();syncToolbar();
   onStatus('No se pudo cargar este conjunto. Selecciónalo de nuevo para reintentar.');return false;
  }
  if(disposed||request!==selectionRequest)return false;
  loadingInterior=false;onStatus('');
  for(const ancestor of partPath(p.id))hidden.delete(ancestor.id);
  for(const hiddenId of [...hidden])if(p.nodes.some(name=>belongs(objects.get(name),partById(hiddenId)?.nodes||[])))hidden.delete(hiddenId);
  startOpening(p.inside||p.id==='web'?1:0);applyPose();syncToolbar();refreshLabels();
  const inherited=partPath(p.id).reverse().find(c=>c.animations.length)?.animations[0];
  if(inherited)animationSelect.value=inherited;
  onSelect(p,openGoal>0,partPath(p.id));focusSelection();return true;
 }
 async function focusStoryComponent(id){return choose(id,{story:true});}
 function reset(){
  storySelection=false;selectionRequest++;loadingInterior=false;stop();selected=null;isolated=false;hidden.clear();select.value='';onStatus('');
  startOpening(0);applyPose();syncToolbar();refreshLabels();onSelect(null,false,[]);controls.autoRotate=false;focusSelection();
 }
 function back(){const parent=selected&&partById(selected.parent);return parent?choose(parent.id):reset();}
 function goDepth(depth){const path=selected?partPath(selected.id):[];return depth>0&&path[depth-1]?choose(path[depth-1].id):reset();}
 function isolate(id){
  storySelection=false;
  if(id&&partById(id)?.id!==selected?.id)return choose(id).then(ok=>{if(ok){isolated=true;applyLooks();syncToolbar();refreshLabels();}});
  if(!selected||loadingInterior)return;isolated=!isolated;applyLooks();syncToolbar();refreshLabels();focusSelection();
 }
 function hide(id=selected?.id){
  const p=partById(id);if(!p||loadingInterior)return;selectionRequest++;stop();hidden.add(p.id);selected=null;isolated=false;select.value='';
  applyLooks();syncToolbar();refreshLabels();onSelect(null,openGoal>0,[]);
 }
 function stop(){
  if(playing){playing.action.stop();mixer.uncacheAction(playing.clip);playing=null;restoreRest(rest);applyOpening(objects,rest,open);stage.updateMatrixWorld(true);dirty=true;}
  syncToolbar();
 }
 async function play(name){
  if(!clipLabels[name]||disposed||!available)return false;
  const owner=sojournerParts.find(p=>p.animations.includes(name));
  let request=selectionRequest;
  if(!selected||!partPath(selected.id).some(p=>p.animations.includes(name))){
   const choosing=choose(owner.id);request=selectionRequest;
   if(!await choosing||request!==selectionRequest)return false;
  }
  if(name==='GEARTRAIN_DEMO')try{await ensureInspection('drive');}catch{onStatus('No se pudo cargar el corte del motor.');return false;}
  if(disposed||request!==selectionRequest)return false;
  stop();poseMove=null;open=openGoal=0;restoreRest(rest);applyPose();
  const clip=clips.get(name);if(!clip)return false;
  const action=mixer.clipAction(clip),loop=['DRIVE_FORWARD','GEARTRAIN_DEMO'].includes(name);
  action.setLoop(loop?T.LoopRepeat:T.LoopOnce,loop?Infinity:1);action.clampWhenFinished=false;action.reset().play();
  playing={name,clip,action};controls.autoRotate=false;syncToolbar();onStatus('');focusSelection();return true;
 }
 mixer.addEventListener('finished',()=>stop());

 const raycaster=new T.Raycaster();let down=null;
 const pointerDown=e=>{down=[e.clientX,e.clientY];move=null;};
 const pointerCancel=()=>{down=null;};
 const pointerUp=e=>{
  const start=down;down=null;if(!start||loadingInterior||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
  const r=renderer.domElement.getBoundingClientRect();if(!r.width||!r.height)return;
  raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
  const hits=raycaster.intersectObjects(stage.children,true).filter(hit=>{
   for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;
   const m=Array.isArray(hit.object.material)?hit.object.material[0]:hit.object.material;return m.opacity>.3;
  });
  const level=Math.min(4,Math.max(2,(selected?.level||1)+1));
  for(const hit of hits){
   const candidates=sojournerParts.filter(p=>p.level<=level&&belongs(hit.object,p.nodes)).sort((a,b)=>b.level-a.level);
   if(candidates[0]){choose(candidates[0].id);break;}
  }
 };
 const keyDown=e=>{if(e.key==='Escape')reset();};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointercancel',pointerCancel);
 renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('keydown',keyDown);
 controls.addEventListener('change',()=>{dirty=true;});controls.addEventListener('start',()=>{move=null;});
 const resize=new ResizeObserver(()=>{
  const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(root)focusSelection();dirty=true;
 });resize.observe(host);
 function graphicsFailure(error){if(disposed||!available)return;available=false;graphicsError=error;selectionRequest++;loadingInterior=false;controls.autoRotate=false;onStatus('');onAvailability(false,error);}
 function contextLost(e){e.preventDefault();graphicsFailure(Object.assign(new Error('La conexión gráfica se interrumpió.'),{code:'WEBGL_CONTEXT_LOST'}));}
 function contextRestored(){if(disposed||graphicsError?.code!=='WEBGL_CONTEXT_LOST')return;available=true;graphicsError=null;dirty=true;onAvailability(true);}
 renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
 const abortLoad=()=>destroy();signal?.addEventListener('abort',abortLoad,{once:true});
 function destroy(){
  if(disposed)return;disposed=true;signal?.removeEventListener('abort',abortLoad);lifetime.abort();selectionRequest++;cancelAnimationFrame(frame);resize.disconnect();
  controls.dispose();mixer.stopAllAction();mixer.uncacheRoot(stage);labelLayer.destroy();
  for(const [event,fn]of[['pointerdown',pointerDown],['pointercancel',pointerCancel],['pointerup',pointerUp],['keydown',keyDown],['webglcontextlost',contextLost],['webglcontextrestored',contextRestored]])renderer.domElement.removeEventListener(event,fn);
  disposeGLTF({scene:stage});disposeGLTF({scene:contact});floor.geometry.dispose();floor.material.dispose();shadowTexture.dispose();environment?.dispose();key.shadow.dispose();
  scene.clear();runtime.release();host.replaceChildren();
  if(window.NEPTUNI_SOJOURNER?.owner===api)delete window.NEPTUNI_SOJOURNER;
 }
 runtime.setCleanup(destroy);
 function tick(now){
  if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min(.1,Math.max(0,(now-lastTime)/1000));lastTime=now;
  if(!available||!host.getClientRects().length||document.hidden)return;
  let moved=false;
  if(playing){mixer.update(dt);stage.updateMatrixWorld(true);dirty=true;moved=true;}
  if(poseMove){const t=poseMove.duration?Math.min(1,(now-poseMove.start)/poseMove.duration):1,e=t*t*(3-2*t);
   open=T.MathUtils.lerp(poseMove.from,poseMove.to,e);applyPose();moved=true;if(t===1)poseMove=null;
  }
  // Resolve live bounds after the pose update. User orbit interruption retains
  // its relative direction while translating with the selected component.
  const anchor=selected?centerOf(selected):null;
  if(move){const t=move.duration?Math.min(1,(now-move.start)/move.duration):1,e=t*t*(3-2*t),info=frameInfo(selected);
   camera.position.lerpVectors(move.from,info.position,e);controls.target.lerpVectors(move.fromTarget,info.target,e);dirty=true;if(t===1)move=null;
  }else if(moved&&anchor&&lastAnchor){const delta=anchor.clone().sub(lastAnchor);camera.position.add(delta);controls.target.add(delta);dirty=true;}
  lastAnchor=anchor;controls.update();
  if(dirty||controls.autoRotate){try{renderer.render(scene,camera);labelLayer.layout();dirty=false;}catch(cause){graphicsFailure(Object.assign(new Error('El navegador interrumpió el renderizado del visor.',{cause}),{code:'RENDER_FAILED'}));}}
 }
 try{
  const g=await loadModel(lod);root=g.scene;retain(root);stage.add(root);stage.updateMatrixWorld(true);for(const c of g.animations)clips.set(c.name,c);
  select.disabled=false;refreshLabels();const info=frameInfo(null);camera.position.copy(info.position);controls.target.copy(info.target);controls.update();
  frame=requestAnimationFrame(tick);onStatus('');
 }catch(error){destroy();throw error;}
 if(loadEnvironment)new HDRLoader().load('assets/inspection/studio.hdr',texture=>{
  if(disposed){texture.dispose();return;}const pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(texture);
  scene.environment=environment.texture;scene.environmentIntensity=.85;texture.dispose();pmrem.dispose();dirty=true;
 },undefined,()=>{});
 api={choose,focusStoryComponent,select:choose,back,goDepth,reset,resetExplodedView:reset,isolate,hide,play,stop,
  setAutoRotate(value){controls.autoRotate=value;dirty=true;},get autoRotate(){return controls.autoRotate;},
  get root(){return root;},get renderer(){return renderer;},get camera(){return camera;},get controls(){return controls;},
  get state(){return {available,errorCode:graphicsError?.code||null,selected:selected?.id,storySelection,open,openGoal,isolated,loadingInterior,
   playing:playing?.name||null,lod,usingFallback,motorCutaway:selected?.file==='drive_cutaway'?1:0,path:selected?partPath(selected.id).map(p=>p.id):[],
   target:controls.target.toArray(),triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};},destroy};
 window.NEPTUNI_SOJOURNER={owner:api,select:choose,play,stop,reset,isolate,hide,components:()=>sojournerParts,clips:()=>Object.keys(clipLabels),state:()=>api.state};
 return api;
}
