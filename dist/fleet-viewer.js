import {createInspectionSurfaces} from './inspection-surfaces.js?v=20261017b';
import {createInspectionLabels} from './inspection-labels.js?v=20261111neptunito';
import {createComponentPresentation} from './component-presentation.js?v=20261112inspeccion';
import {createComponentHarness} from './component-harness.js?v=20261017b';
import {createContextPass,setInspectionGhost} from './inspection-context.js?v=20261112inspeccion';
import * as T from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {GLTFLoader} from './vendor/three/GLTFLoader.js';
import {HDRLoader} from './vendor/three/HDRLoader.js';
import {MeshoptDecoder} from './vendor/three/meshopt_decoder.mjs';
import {rememberFleetPose,applyFleetPose,fleetFitBoundsDistance,collectFleetFitPoints,fleetFitPointsDistance} from './fleet-transforms.js?v=20261018b';
import {createAssemblyController} from './twin/assembly-controller.js?v=20261004j';
import {createPerformanceMonitor} from './twin/performance-monitor.js?v=20261004j';
import {loadWithDeadline,createGLTFAssetLoader} from './twin/asset-loader.js?v=20261009b';
import {renderingBudget} from './twin/device-capabilities.js?v=20261009b';
import {acquireViewerRuntime} from './viewer-runtime.js?v=20261025story';

/** Mission-specific GLBs, on-demand cutaways and shared, cancellable inspection controls. */
export async function createFleetViewer(host,mission,{onSelect=()=>{},onStatus=()=>{},renderer:providedRenderer,camera:providedCamera,assetLoader:providedLoader,loadEnvironment=true,registry=null,onViewChange=()=>{},onPerformance=()=>{},onAvailability=()=>{},onInteraction=()=>{},signal}={}){
 if(signal?.aborted)throw new DOMException('Carga cancelada','AbortError');
 const viking2=mission.id==='viking2',mariner=mission.id==='mariner',fitted=viking2||mariner,authoredContext=!!mission.fleet.contextualInspections,adaptive=true;
 // Names in the existing GLB, not approximate label positions. No geometry is replaced.
 const marinerNodes={camera:['SCAN_PLATFORM'],solar:['SOLAR_ARRAYS'],antenna:['ANTENNA'],avionics:['STRUCTURE'],propulsion:['ORBIT_INSERTION_ENGINE','PROPULSION_BLANKET']};
 const mappedExterior=mariner||mission.components.some(p=>p.exteriorNodes?.length);
 // One compact viewport menu for every mission; inspection mechanics remain mission-specific.
 host.classList.add('insight-experience');
 host.classList.toggle('viking2-experience',viking2);
 host.classList.toggle('mariner-experience',mariner);
 host.classList.toggle('fitted-experience',fitted);
 const mobile=matchMedia('(max-width: 760px)').matches||adaptive&&matchMedia('(pointer:coarse)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const initialBudget=renderingBudget({mobile,dpr:devicePixelRatio,memory:globalThis.navigator?.deviceMemory,cores:globalThis.navigator?.hardwareConcurrency});
 const runtime=acquireViewerRuntime({renderer:providedRenderer,camera:providedCamera,antialias:initialBudget.antialias}),renderer=runtime.renderer,gl=renderer.getContext?.();
 const budget=renderingBudget({mobile,dpr:devicePixelRatio,memory:globalThis.navigator?.deviceMemory,cores:globalThis.navigator?.hardwareConcurrency,
  maxTextureSize:gl?gl.getParameter(gl.MAX_TEXTURE_SIZE):undefined,maxRenderbufferSize:gl?gl.getParameter(gl.MAX_RENDERBUFFER_SIZE):undefined});

 renderer.setPixelRatio(adaptive?budget.pixelRatio:Math.min(devicePixelRatio,mobile?1.5:2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const exposure=viking2?.86:mariner?.94:mission.id==='phoenix'?.90:authoredContext?.92:1.03;
 renderer.toneMappingExposure=exposure;
 renderer.shadowMap.enabled=adaptive?budget.shadows:true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;let shadowStamp=-1e9;/* NEPTUNI v8: la sombra no se recalcula en cada fotograma si solo gira la cámara */renderer.domElement.tabIndex=0;
 renderer.domElement.setAttribute('aria-label',mission.name+' 3D. Arrastra para orbitar. Con el visor enfocado: Mayús y flechas para orbitar, flechas para desplazar, + y − para acercar o alejar, Inicio o Escape para volver. Selecciona un componente para abrirlo.');host.append(renderer.domElement);
 const scene=new T.Scene(),stage=new T.Group(),camera=runtime.camera;scene.add(stage);
 const contextPass=createContextPass(renderer,scene,camera);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.maxPolarAngle=Math.PI*.92;controls.autoRotateSpeed=.6;
 const ambient=new T.HemisphereLight(0xecf3ff,0x786c60,viking2?.65:mariner?.82:mission.id==='phoenix'?.94:1.20);scene.add(ambient);
 const keyIntensity=viking2?2.05:mariner?2.25:authoredContext?2.35:2.7;
 const key=new T.DirectionalLight(0xfff6e8,keyIntensity);key.castShadow=renderer.shadowMap.enabled;key.shadow.mapSize.set(adaptive?budget.shadowSize:mobile?1024:2048,adaptive?budget.shadowSize:mobile?1024:2048);key.shadow.radius=4;scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xdce9ff,viking2?.68:mariner?1.05:mission.id==='phoenix'?1.05:1.65),rim=new T.DirectionalLight(0xffffff,viking2?.85:mariner?1.12:mission.id==='phoenix'?1.25:1.75);scene.add(fill,rim);
 for(const light of [ambient,key,fill,rim])contextPass.light(light);
 const floor=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShadowMaterial({opacity:.16,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d'),gradient=ctx.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(32,42,48,.24)');gradient.addColorStop(1,'rgba(32,42,48,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadowTexture=new T.CanvasTexture(cv),contact=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;scene.add(contact);
 const lifetime=new AbortController(),abortLoad=()=>{lifetime.abort(signal?.reason);destroy();};signal?.addEventListener('abort',abortLoad,{once:true});
 const loader=providedLoader||createGLTFAssetLoader(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),{signal:lifetime.signal}),asset=p=>new URL('./'+p+'?v='+(registry?experience.revision:mission.fleet.assetRevision||'20261004c'),import.meta.url).href;
 let storySelection=false,disposed=false,available=true,graphicsError=null,frame=0,dirty=true,request=0,exterior,exteriorBounds,exteriorFitPoints,appearance,detail,detailedExterior=false,active,activeRoot=null,selected=null,move=null,poseFollow=null,poseMove=null,open=0,openGoal=0,spin=0,spinGoal=0,isolated=false,loading=false,environment,deferred,detailWeights={},detailGoal={},demonstration=0,actionMove=null,ripples=[],presentation;
 const previousShaderError=renderer.debug?.onShaderError;
 if(adaptive&&renderer.debug)renderer.debug.onShaderError=()=>graphicsFailure(Object.assign(new Error('No se pudieron compilar los materiales del visor.'),{code:'SHADER_COMPILATION_FAILED'}));
 const inspectionDuration=T.MathUtils.clamp((mission.fleet.inspectionIntro?.openMs||1900)*.42,680,1120);
 const experience=registry?.experience;let exteriorCoverVisible=true;let assembly=null,assemblyMove=null,relationship=null,twinView='exterior',assemblyResetTimer;
 const relations=new T.Group();scene.add(relations);
 const exteriorModel = (budget.tier === 'LOW' && mission.fleet.lowModel) ||
  (mobile && mission.fleet.mobileModel) || mission.model;
 const overviewAsset=(mobile&&mission.fleet.overviewMobileModel)||mission.fleet.overviewModel;
 const exteriorAssetName = exteriorModel.split('/').at(-1).replace(/\.glb(?:\?.*)?$/,'');
 let exteriorMixer, exteriorAction, lastFrame = 0;
 const metrics=createPerformanceMonitor(renderer,{onChange:data=>onPerformance({...data,quality:budget.tier,maxTextureSize:budget.maxTextureSize}),adaptive,maxPixelRatio:budget.pixelRatio,bytes:registry?(mobile?experience.assetSizes.mobile:experience.assetSizes.desktop):mission.fleet.performance?.find(p=>p.name===exteriorAssetName)?.bytes||0});
 const surfaces=createInspectionSurfaces({mobile,enabled:!providedRenderer,onChange:()=>{dirty=true},anisotropy:Math.min(4,renderer.capabilities?.getMaxAnisotropy?.()||2)});
 const caches=new Map(),restMaps=new WeakMap(),harnessControllers=new WeakMap(),hidden=new Set(),parts=new Map();let harnessController;
 const index=(list,path=[])=>{for(const p of list){const full=[...path,p];parts.set(p.key||p.id,{part:p,path:full});index(p.children||[],full);}};index(mission.components);
 const labelLayer=createInspectionLabels(host,{onChoose:selectComponent,project:p=>fitted?projectAnchor(p):anchor(p).project(camera),viewport:()=>renderer.domElement,routed:fitted,stable:true,isMoving:()=>!!move||!!poseMove});
 const selector=document.createElement('label');selector.className='sj-selector';selector.textContent='Inspeccionar ';const select=document.createElement('select');select.disabled=true;select.setAttribute('aria-label','Seleccionar componente de '+mission.name);
 const all=document.createElement('option');all.value='';all.textContent='Vista general';select.append(all);
 for(const [id,{part,path}]of parts){const o=document.createElement('option');o.value=id;o.textContent=(path.length>1?'↳ '.repeat(Math.min(2,path.length-1)):'')+part.name;select.append(o);}selector.append(select);host.append(selector);
 select.onchange=()=>{if(select.value)return selectComponent(select.value);onInteraction();reset();};
 const toolbar=document.createElement('div');toolbar.className='sj-tools';toolbar.hidden=true;host.append(toolbar);
 let toolsMenu,menuActions=[];
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{onInteraction();if(toolsMenu?.open){toolsMenu.open=false;toolsMenu.querySelector('summary').focus({preventScroll:true});}return fn();};toolbar.append(b);return b;};
 const cut=button('Cerrar corte',()=>{if(loading||!activeRoot)return;clearTimeout(assemblyResetTimer);onStatus('');openGoal=openGoal?0:1;startPose();syncToolbar();focus(selected);});
 const isolate=button('Aislar componente',()=>{if(loading||!selected)return;isolated=!isolated;visibility();refreshLabels();syncToolbar();focus(selected);});
 const hide=button('Ocultar',()=>{if(loading||!selected?.nodes?.length||hide.hidden)return;request++;selected.nodes.forEach(n=>hidden.add(n));isolated=false;const parent=parts.get(selected.key).path.at(-2);selected=parent||activeRoot;select.value=selected.key;setDetailGoal(selected);startPose();visibility();highlight();syncToolbar();refreshLabels();onSelect(selected,parts.get(selected.key).path);focus(selected);});
 const rotate=button('Girar filtros',()=>{if(loading||!activeRoot)return;spinGoal+=Math.PI/4;startPose();});
 const impact=button('Simular absorción del impacto',()=>{if(loading||!activeRoot||impact.hidden)return;actionMove={start:performance.now(),from:demonstration,to:demonstration>.5?0:1,duration:reduced?0:1800};dirty=true;});
 const backButton=button('Volver',()=>back());
 {
  toolbar.classList.add('sj-tools-compact');toolsMenu=document.createElement('details');toolsMenu.className='sj-tools-menu';
  const summary=document.createElement('summary');summary.tabIndex=0;summary.setAttribute('aria-label','Opciones del modelo 3D');summary.title='Opciones del modelo 3D';
  const options=document.createElement('div');options.className='sj-tools-options';
  for(const b of[cut,isolate,hide,rotate,impact])options.append(b);toolsMenu.append(summary,options);toolbar.replaceChildren(backButton,toolsMenu);
  toolsMenu.addEventListener('toggle',()=>{dirty=true;});
  options.addEventListener('click',event=>{if(menuActions.includes(event.target.closest('button'))){toolsMenu.open=false;summary.focus({preventScroll:true});dirty=true;}});
  toolsMenu.addEventListener('keydown',event=>{if(event.key==='Escape'&&toolsMenu.open){event.preventDefault();event.stopPropagation();toolsMenu.open=false;summary.focus({preventScroll:true});dirty=true;}});
  backButton.title='Volver al conjunto anterior y recolocar las piezas';
 }
 function setMenuActions(actions=[]){for(const b of menuActions)b.remove();menuActions=[...actions];for(const b of menuActions){b.classList.add('sj-model-action');toolsMenu.querySelector('.sj-tools-options').append(b);}syncToolbar();}
 function syncToolbar(){toolbar.hidden=!activeRoot&&!menuActions.length;backButton.hidden=!selected;cut.hidden=!activeRoot;isolate.hidden=!selected;cut.textContent=openGoal?'Reensamblar':'Desplegar piezas';cut.setAttribute('aria-pressed',String(!!openGoal));isolate.textContent=isolated?'Mostrar conjunto':'Aislar componente';isolate.setAttribute('aria-pressed',String(isolated));let hasOther=false;if(selected)active?.traverse(o=>{if(o.isMesh&&!belongs(o,selected.nodes))hasOther=true;});hide.hidden=!activeRoot||!selected?.nodes?.length||!hasOther;let filters=false,demo;active?.traverse(o=>{if(o.userData.spinAxis)filters=true;if(o.userData.demonstration)demo=o.userData.demonstration;});rotate.hidden=!activeRoot||!filters;rotate.textContent=mission.family==='viking'?'Mover espejo de barrido':'Girar filtros';impact.hidden=!activeRoot||!demo;impact.textContent=demonstration>.5?'Restaurar demostración':demo?.label||'Simular absorción del impacto';impact.title=demo?.description||'';for(const b of[cut,isolate,hide,rotate,impact])b.disabled=loading;toolsMenu.querySelector('summary').setAttribute('aria-disabled',String(loading&&!menuActions.length));}
 function stopExteriorAnimation() {
  if (!exteriorAction) return;
  exteriorMixer.stopAllAction();
  exteriorAction = null;
  dirty = true;
 }
 function addExteriorAnimations(clips) {
  const labels = mission.fleet.animations;
  if (!labels || !clips.length) return;
  exteriorMixer = new T.AnimationMixer(exterior);
  exteriorMixer.addEventListener('finished', stopExteriorAnimation);
  const actions = [];
  for (const clip of clips) {
   if (!labels[clip.name]) continue;
   const trigger = button(labels[clip.name], () => {
    if (!available || loading) return;
    if (activeRoot) reset();
    stopExteriorAnimation();
    controls.autoRotate = false;
    exteriorAction = exteriorMixer.clipAction(clip);
    exteriorAction.setLoop(T.LoopOnce, 1);
    exteriorAction.reset().play();
    dirty = true;
   });
   actions.push(trigger);
  }
  if (actions.length) setMenuActions([...actions, button('Detener demostración', stopExteriorAnimation)]);
 }
 function retain(root){root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;o.material=o.material.clone();if(viking2){o.material.envMapIntensity=.55;if(/white.*(enamel|coating)|thermal enamel/i.test(o.material.name)){o.material.roughness=Math.max(.74,o.material.roughness);o.material.metalness=Math.min(.08,o.material.metalness);}}o.userData.baseEmissive=o.material.emissive?.clone();o.userData.baseEmissiveIntensity=o.material.emissiveIntensity;});surfaces.apply(root);restMaps.set(root,rememberFleetPose(root));}
 function disposeTree(root){root?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(material))if(value?.isTexture&&!value.userData.inspectionShared)value.dispose();material.dispose();}}});}
 function belongs(object,names=[]){for(let o=object;o&&o!==stage;o=o.parent)if(names.includes(o.name))return true;return false;}
 function storyConnection(object){for(let o=object;o&&o!==stage;o=o.parent)if(/HARNESS|CABLE|COAX|TETHER|RIBBON|LOOM|INTERCONNECT|FEED_LINES/i.test(o.name))return true;return false;}
 function shownExterior(){return appearance?.visible?appearance:exterior;}
 function syncExteriorModel(){
  if(!exterior)return;
  if(appearance)appearance.visible=!activeRoot&&!detailedExterior;
  exterior.visible=!appearance?.visible&&(!activeRoot||!isolated);
  if(detail)detail.visible=!activeRoot&&(!appearance||appearance.visible);
  renderer.toneMappingExposure=appearance?.visible?1.03:exposure;
  key.intensity=appearance?.visible?2.7:keyIntensity;
 }
 function setDetailedExterior(value){
  if(detailedExterior===value)return;
  detailedExterior=value;syncExteriorModel();dirty=true;
 }
 function exteriorContext(){
  if(!exterior)return;
  const names=activeRoot?.exteriorReplaceNodes||activeRoot?.exteriorNodes||[];
  const ownNodes=(activeRoot?.exteriorOwnNodes||[]).map(n=>exterior.getObjectByName(n)).filter(Boolean);
  exterior.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const replace=activeRoot&&(belongs(mesh,names)||ownNodes.some(n=>n===mesh||mesh.parent===n&&mesh.name.startsWith(n.name+'_')));
   mesh.visible=restMaps.get(exterior).get(mesh).visible&&!replace;
   setInspectionGhost(mesh,!!activeRoot);
  });
  if(!stage.children.includes(exterior))stage.add(exterior);
  syncExteriorModel();
 }
 function namesOf(part){return registry&&!activeRoot?registry.get(part?.key)?.exteriorNodes||[]:part?.nodes||[];}
 function setExteriorCoverVisible(value){exteriorCoverVisible=!!value;visibility();}
 function applyExteriorCover(){for(const name of experience?.exteriorCover?.nodes||[]){const node=exterior?.getObjectByName(name);if(node)node.visible=exteriorCoverVisible;}}
 function visibility(){
  if(!active)return;
  exteriorContext();
  const names=namesOf(selected),visualNames=selected===activeRoot?activeRoot?.presentationNodes||names:names;
  const hiddenNames=[...hidden],rest=restMaps.get(active);
  active.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const primary=!names.length||belongs(mesh,names);
   mesh.visible=rest?.get(mesh)?.visible!==false&&!belongs(mesh,hiddenNames)&&(!isolated||primary);
   const secondary=!!selected&&visualNames.length>0&&!belongs(mesh,visualNames);
   setInspectionGhost(mesh,!!(secondary&&!(storySelection&&storyConnection(mesh))));
  });
  applyExteriorCover();
  floor.visible=contact.visible=!activeRoot&&!mission.fleet.floating;
  dirty=true;
 }
 function highlight(){const names=namesOf(selected);active?.traverse(o=>{if(!o.isMesh||!o.material.emissive)return;if(o.userData.inspectionGhost){o.material.emissive.set(0);o.material.emissiveIntensity=0;return;}o.material.emissive.copy(o.userData.baseEmissive||new T.Color(0));o.material.emissiveIntensity=o.userData.baseEmissiveIntensity??1;if(names.length&&belongs(o,names)){o.material.emissive.set(0x183748);o.material.emissiveIntensity=storySelection?.34:.14;}});dirty=true;}
 function pose(amount=open,angle=spin,weights=detailWeights){if(active&&activeRoot){applyFleetPose(active,restMaps.get(active),amount,angle,weights,demonstration,performance.now());presentation?.apply(weights,amount);harnessController?.update();}dirty=true;}
 function setDetailGoal(part){detailGoal={};active?.traverse(o=>{for(const scope of Object.keys(o.userData.inspectOffsets||{}))detailGoal[scope]=part?.key===scope||part?.key?.startsWith(scope+'/')?1:0;});
  if(presentation&&part){applyFleetPose(active,restMaps.get(active),1,spinGoal,detailGoal,demonstration,performance.now());Object.assign(detailGoal,presentation.goals(parts.get(part.key)?.path||[]));pose();}
 }
 function startPose(){
  if(reduced){
   poseMove=null;open=openGoal;spin=spinGoal;detailWeights={...detailGoal};pose();return;
  }
  poseMove={start:performance.now(),duration:inspectionDuration,from:[open,spin],to:[openGoal,spinGoal],
   fromDetail:{...detailWeights},toDetail:{...detailGoal}};
  dirty=true;
 }
 function boundsOf(part,precise=true){const bounds=new T.Box3();if(!active)return bounds;active.updateMatrixWorld(true);if(registry&&!activeRoot&&part){const config=experience.focus?.[part.key]||(parts.get(part.key)?.path.length===1?experience.focus?.[part.id]:null),obj=config&&active.getObjectByName(config.node);if(obj){if(config.inventory){for(const item of obj.userData.inventory||[])if(config.inventory.includes(item.name))bounds.union(new T.Box3(new T.Vector3(...item.bounds.min),new T.Vector3(...item.bounds.max)).applyMatrix4(obj.matrixWorld));}else bounds.setFromObject(obj,precise);if(!bounds.isEmpty())return bounds;}}
  const names=namesOf(part);if(!part||!names.length)return bounds.setFromObject(!activeRoot?shownExterior()||active:active,precise);for(const name of names){const obj=active.getObjectByName(name);if(obj)bounds.union(new T.Box3().setFromObject(obj,precise));}return bounds;}
 function finalBounds(part){pose(openGoal,spinGoal,detailGoal);const b=boundsOf(part);pose();return b;}
 function assemblyBounds(part){if(!assemblyMove||activeRoot)return boundsOf(part);const amount=assembly.amount;assembly.apply(assemblyMove.to);const b=boundsOf(part);assembly.apply(amount);return b;}
 function configureStage(bounds){const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),r=Math.max(.005,size.length()/2);
  const groundBounds=activeRoot&&exteriorBounds?exteriorBounds:bounds,groundCenter=groundBounds.getCenter(new T.Vector3()),groundSize=groundBounds.getSize(new T.Vector3()),groundY=groundBounds.min.y-r*.002;
  floor.position.set(groundCenter.x,groundY,groundCenter.z);floor.scale.setScalar(r*12);contact.position.set(groundCenter.x,groundY+r*.0005,groundCenter.z);contact.scale.set(Math.max(r*.4,groundSize.x*1.2),Math.max(r*.4,groundSize.z*1.2),1);
  key.position.copy(center).add(new T.Vector3(r*1.5,r*3,r*2.4));key.target.position.copy(center);fill.position.copy(center).add(new T.Vector3(-r*2,r,r));rim.position.copy(center).add(new T.Vector3(0,r*2,-r*3));
  Object.assign(key.shadow.camera,{left:-r*1.6,right:r*1.6,top:r*1.6,bottom:-r*1.6,near:r*.05,far:r*12});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00005;key.shadow.normalBias=r*.0008;
  camera.near=Math.max(.00003,r/700);camera.far=Math.max(10,r*200,(exteriorBounds?.getSize(new T.Vector3()).length()||0)*8);camera.updateProjectionMatrix();controls.minDistance=r*.06;controls.maxDistance=r*40;
 }
 function cameraTo(bounds,dir,duration=850,start=performance.now()){
  const w=host.clientWidth,h=host.clientHeight;
  if(bounds.isEmpty()||!w||!h)return;
  const center=bounds.getCenter(new T.Vector3()),safe=viewportInsets();
  camera.setViewOffset(w,h,(safe.right-safe.left)/2,(safe.bottom-safe.top)/2,w,h);
  const direction=(dir?.clone()||new T.Vector3(.87,.65,1.16)).normalize();
  if(Math.abs(direction.y)>.998){direction.x+=.075;direction.normalize();}
  if(mariner&&!activeRoot)exteriorFitPoints??=collectFleetFitPoints(exterior);
  const fitDistance=mariner&&!activeRoot
   ?fleetFitPointsDistance(w,h,exteriorFitPoints,center,direction,camera.fov,safe)
   :fleetFitBoundsDistance(w,h,bounds,direction,camera.fov,safe);
  const distance=fitDistance*(!activeRoot?T.MathUtils.clamp(mission.fleet.exteriorFitScale??1,.94,1.2):1);
  move={from:camera.position.clone(),fromTarget:controls.target.clone(),position:center.clone().addScaledVector(direction,distance),
   target:center,start,duration:reduced?0:duration,part:activeRoot?selected:null,
   partCenter:activeRoot&&selected?boundsOf(selected,false).getCenter(new T.Vector3()):null};
  if(!move.duration){camera.position.copy(move.position);controls.target.copy(move.target);move=null;controls.update();camera.updateMatrixWorld();}
  dirty=true;
 }
 function viewportInsets(){
  const h=host.clientHeight,w=host.clientWidth,rect=host.getBoundingClientRect();
  const toolbarButton=toolsMenu.querySelector('summary').getBoundingClientRect();
  const footer=host.closest('.viewer-wrap')?.querySelector('.viewer-bottom')?.getBoundingClientRect();
  const top=toolbarButton.height?Math.max(24,toolbarButton.bottom-rect.top+12):24;
  const bottom=footer?.height?Math.max(25,rect.bottom-footer.top+14):25;
  const scale=Math.min(1,h*.38/Math.max(1,top+bottom)),side=Math.min(35,w*.065);
  return {left:side,right:side,top:top*scale,bottom:bottom*scale};
 }
 function focus(part,{duration=850,start=performance.now(),direction}={}){
  poseFollow=null;
  const overview=registry&&!activeRoot;
  const whole=overview?assemblyBounds(null):finalBounds(activeRoot);
  const bounds=overview?assemblyBounds(part):finalBounds(part);
  configureStage(whole);
  if(activeRoot&&!isolated&&!bounds.isEmpty()){
   const partSpan=bounds.getSize(new T.Vector3()).length();
   const rootSpan=whole.getSize(new T.Vector3()).length();
   bounds.expandByScalar(Math.max(partSpan*.06,Math.min(partSpan*.24,rootSpan*.05)));
  }
  const orientation=overview&&part?registry.get(part.key)?.cameraDirection:part?.cameraDirection||activeRoot?.cameraDirection;
  const dir=direction?.lengthSq()>.1?direction:orientation?new T.Vector3(...orientation).normalize():undefined;
  if(assemblyMove)duration=Math.max(duration,assemblyMove.start+assemblyMove.duration-start);
  cameraTo(bounds,dir,duration,start);
 }
 function interruptCamera(){
  const wasMoving=!!move;move=null;
  if(!activeRoot||!selected||poseFollow||!wasMoving&&!poseMove)return;
  const bounds=boundsOf(selected,false);if(bounds.isEmpty())return;
  const center=bounds.getCenter(new T.Vector3()),delta=center.clone().sub(controls.target);
  // A gesture cancels automatic framing, not the selected piece's moving pivot.
  camera.position.add(delta);controls.target.copy(center);
  if(poseMove)poseFollow={part:selected,center};dirty=true;
 }
 function prepareInspectionModel(model){
  for(const name of mission.fleet.excludeInspectionNodes||[]){
   const node=model.getObjectByName(name);
   if(node){node.removeFromParent();disposeTree(node);}
  }
  retain(model);
 }
 async function getCutaway(root){
  if(!caches.has(root.key)){
   const pending=loadWithDeadline(()=>loader.loadAsync(asset(root.scene)),{signal:lifetime.signal,onLateResult:g=>disposeTree(g.scene)})
    .then(g=>{if(disposed){disposeTree(g.scene);return null;}prepareInspectionModel(g.scene);return g.scene;})
    .catch(error=>{caches.delete(root.key);throw error;});
   caches.set(root.key,pending);
  }
  return caches.get(root.key);
 }
 function installCutaway(root){
  const rest=restMaps.get(active);
  applyFleetPose(active,rest);
  const base=rest.get(active);
  const mount=root.installation;
  if(mount){
   active.position.fromArray(mount.position);
   active.rotation.fromArray([...(mount.rotation||[0,0,0]),'XYZ']);
  }else{
   const anchor=root.exteriorPosition||mission.fleet.positions[root.id]||[0,0,0];
   active.position.fromArray(anchor).sub(new T.Vector3(...(root.position||[0,0,0])));
  }
  base.position.copy(active.position);base.quaternion.copy(active.quaternion);
  const authored=mount?.openOffset||active.userData.explode;
  if(authored?.some(value=>Math.abs(value)>1e-5)){
   active.userData.explode=authored;
   return;
  }
  // Legacy cutaways only have a label anchor. Pull the assembly slightly
  // out of that mount and keep the authored dimensions and rotations.
  const box=new T.Box3().setFromObject(active);
  const size=box.getSize(new T.Vector3()).length();
  const fullSize=exteriorBounds.getSize(new T.Vector3()).length();
  const span=T.MathUtils.clamp(size,fullSize*.15,fullSize);
  const outward=box.getCenter(new T.Vector3()).sub(exteriorBounds.getCenter(new T.Vector3()));
  outward.y=0;
  if(outward.lengthSq()<1e-6)outward.set(.35,0,1);
  outward.normalize().multiplyScalar(span*.055);
  outward.y=span*.115;
  active.userData.explode=outward.toArray();
 }
 async function choose(keyName,{story=false}={}){
  keyName=registry?.get(keyName)?.key||keyName;
  const entry=parts.get(keyName);
  if(!entry||disposed||!available)return false;
  const {part,path}=entry,root=path[0];
  stopExteriorAnimation();
  storySelection=story;
  if(story)hidden.clear();
  if(toolsMenu)toolsMenu.open=false;
  if(!root.scene)return registry?focusComponent(keyName):false;
  assemblyMove=null;clearTimeout(assemblyResetTimer);clearRelationship();controls.autoRotate=false;
  if(!story&&selected?.key===keyName&&!loading&&activeRoot&&openGoal===1){focus(selected);return true;}
  const token=++request;
  move=null;select.value=part.key;
  if(activeRoot?.key!==root.key){
   poseMove=null;loading=true;syncToolbar();onStatus('Abriendo '+root.name+'…');
   let loaded;
   try{loaded=await getCutaway(root);}
   catch(error){
    if(disposed||token!==request)return false;
    loading=false;select.value=selected?.key||'';syncToolbar();onStatus('No se pudo abrir este conjunto. Selecciónalo para reintentar.');return false;
   }
   if(disposed||token!==request||!loaded)return false;
   if(active!==exterior)stage.remove(active);
   active=loaded;stage.add(active);
   installCutaway(root);
   activeRoot=root;
   presentation=createComponentPresentation(active);
   if(!harnessControllers.has(active))harnessControllers.set(active,createComponentHarness(active));
   harnessController=harnessControllers.get(active);
   open=0;spin=spinGoal=0;detailWeights=detailGoal={};demonstration=0;actionMove=null;ripples=[];
   active.traverse(node=>{if(node.userData.educationalRipple)ripples.push(node.userData.educationalRipple);});
   hidden.clear();
  }
  if(token!==request||disposed)return false;
  loading=false;selected=part;isolated=false;openGoal=1;
  for(const name of part.nodes||[]){hidden.delete(name);for(let node=active.getObjectByName(name);node;node=node.parent)hidden.delete(node.name);}
  onStatus('');setDetailGoal(part);startPose();pose();visibility();highlight();syncToolbar();refreshLabels();
  twinView='interior';onViewChange(twinView);onSelect(part,path);focus(part,{duration:inspectionDuration});return true;
 }
 async function focusStoryComponent(key){return choose(key,{story:true});}
 function cancelPending(){request++;loading=false;onStatus('');syncToolbar();}
 function graphicsFailure(error){if(disposed||!available)return;graphicsError=error;available=false;controls.autoRotate=false;cancelPending();onAvailability(false,error);onStatus('');}
 function contextLost(e){e.preventDefault();graphicsFailure(Object.assign(new Error('La conexión gráfica se interrumpió.'),{code:'WEBGL_CONTEXT_LOST'}));}
 function contextRestored(){if(disposed||graphicsError?.code!=='WEBGL_CONTEXT_LOST')return;graphicsError=null;available=true;dirty=true;onAvailability(true);onStatus('');}
 renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
 function resetExplodedView(){stopExteriorAnimation();storySelection=false;exteriorCoverVisible=true;if(toolsMenu)toolsMenu.open=false;clearTimeout(assemblyResetTimer);assemblyMove=null;assembly?.reset();clearRelationship();twinView="exterior";onViewChange(twinView);request++;loading=false;move=null;poseFollow=null;poseMove=null;actionMove=null;demonstration=0;ripples=[];open=openGoal=spin=spinGoal=0;detailWeights=detailGoal={};if(activeRoot)pose(0,0);if(active&&active!==exterior)stage.remove(active);activeRoot=null;selected=null;hidden.clear();isolated=false;detailedExterior=false;active=exterior;if(!exterior)return;if(!stage.children.includes(exterior))stage.add(exterior);exterior.visible=true;if(detail)detail.visible=true;select.value='';onStatus('');syncToolbar();onSelect(null,[]);visibility();highlight();refreshLabels();const b=boundsOf(null);configureStage(b);cameraTo(b);}
 function reset(){assemblyMove=null;assembly?.reset();clearRelationship();resetExplodedView();twinView='exterior';onViewChange(twinView);}
 function back(){if(!selected)return reset();const path=parts.get(selected.key).path;if(path.length>1)choose(path.at(-2).key);else reset();}
 function goDepth(depth){if(!depth)return reset();const path=selected?parts.get(selected.key).path:[];const part=path[Math.min(depth,path.length)-1];if(part)choose(part.key);}
 function refreshLabels(){const entries=activeRoot?(isolated?[selected]:selected?.children?.length?selected.children:parts.get(selected?.key)?.path.at(-2)?.children||activeRoot.children):mission.components;labelLayer.set((entries||[]).filter(p=>!p.nodes?.every(n=>hidden.has(n))),selected?.key);dirty=true;}
 const anchorNodes=mariner?{camera:'SCAN_PLATFORM_Optical_objective',solar:'ARRAY_0_CELLS',antenna:'HIGH_GAIN',avionics:'EQUIPMENT_BAY_0',propulsion:'ORBIT_INSERTION_ENGINE'}:{camera:'LANDER_CAMERA_-1',rtg:'SNAP19_-1',biology:'BIOLOGY_PROCESSOR',avionics:'HEXAGONAL_BODY',legs:'LANDING_LEGS',antenna:'S_BAND_HIGH_GAIN',sampler:'SURFACE_SAMPLER',propulsion:'TERMINAL_DESCENT_PROPULSION',meteorology:'METEOROLOGY_BOOM',chemistry:'GCMS_PROCESSOR'};
 const anchorCache=new Map(),occlusionCache=new Map(),anchorRay=new T.Raycaster(),occlusionRay=new T.Raycaster();let occluders=[],occlusionStamp=-Infinity;
 function partAnchor(part){
  const root=activeRoot?active:shownExterior(),node=activeRoot?(part.nodes||[]).map(n=>root.getObjectByName(n)).find(Boolean):root.getObjectByName(anchorNodes[part.id])||(part.exteriorNodes||[]).map(n=>root.getObjectByName(n)).find(Boolean);
  if(!node)return {point:anchor(part),node:null};
  const cached=anchorCache.get(part.key),now=performance.now();
  if(cached?.node===node&&now-cached.stamp<300)return {point:node.localToWorld(cached.local.clone()),node};
  const b=new T.Box3().setFromObject(node),center=b.getCenter(new T.Vector3());
  if(!activeRoot&&part.id==='legs'){const fixtures=(node.userData.fixtures||[]).filter(f=>f.upperMount&&f.footJoint).map(f=>node.localToWorld(new T.Vector3(...f.upperMount).lerp(new T.Vector3(...f.footJoint),.62))).sort((a,b)=>a.distanceToSquared(camera.position)-b.distanceToSquared(camera.position));if(fixtures.length)center.copy(fixtures[0]);}
  anchorRay.set(camera.position,center.clone().sub(camera.position).normalize());let hit=anchorRay.intersectObject(node,true).find(h=>h.object.visible);
  // An assembly centroid can fall in an empty gap (tripod, paired optics).
  // Retry actual mesh centres, never draw a marker in that empty space.
  if(!hit){const candidates=[];node.traverse(o=>{if(o.isMesh&&o.visible){const c=new T.Box3().setFromObject(o).getCenter(new T.Vector3());candidates.push({mesh:o,center:c,distance:c.distanceToSquared(center)});}});for(const candidate of candidates.sort((a,b)=>a.distance-b.distance).slice(0,6)){anchorRay.set(camera.position,candidate.center.clone().sub(camera.position).normalize());hit=anchorRay.intersectObject(candidate.mesh,false)[0];if(hit)break;}}
  let point=hit?.point;
  if(!point){let best=Infinity;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();node.traverse(o=>{if(!o.isMesh||!o.visible)return;const geometry=o.geometry,p=geometry.attributes.position,index=geometry.index,count=index?.count||p.count,step=Math.max(1,Math.floor(count/3/96))*3;for(let i=0;i<count-2;i+=step){a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(o.matrixWorld);const sample=a.clone().add(b).add(c).multiplyScalar(1/3);normal.crossVectors(b.clone().sub(a),c.clone().sub(a));if(normal.dot(camera.position.clone().sub(sample))<=0)continue;const score=sample.distanceToSquared(center);if(score<best){best=score;point=sample;}}});}
  point||=b.clampPoint(center,new T.Vector3());
  anchorCache.set(part.key,{node,local:node.worldToLocal(point.clone()),stamp:now});return {point,node};
 }
 function projectAnchor(part){const {point,node}=partAnchor(part),projected=point.clone().project(camera),now=performance.now();
  if(now-occlusionStamp>300){occlusionStamp=now;occluders=[];stage.updateMatrixWorld(true);stage.traverse(o=>{if(!o.isMesh||!o.visible||o.userData.inspectionGhost||o.material.opacity<.45)return;for(let p=o.parent;p;p=p.parent)if(!p.visible)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();occluders.push({mesh:o,box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});});}
  const cached=occlusionCache.get(part.key);if(cached?.node===node&&cached.stamp===occlusionStamp){projected.occluded=cached.occluded;return projected;}
  occlusionRay.set(camera.position,point.clone().sub(camera.position).normalize());occlusionRay.far=Math.max(0,camera.position.distanceTo(point)-.008);
  const candidates=occluders.filter(o=>{for(let p=o.mesh;p;p=p.parent)if(p===node)return false;return !!occlusionRay.ray.intersectBox(o.box,new T.Vector3());}).sort((a,b)=>a.box.distanceToPoint(camera.position)-b.box.distanceToPoint(camera.position)).slice(0,6);
  projected.occluded=candidates.some(o=>occlusionRay.intersectObject(o.mesh,false).some(h=>h.distance<occlusionRay.far));occlusionCache.set(part.key,{node,stamp:occlusionStamp,occluded:projected.occluded});return projected;
 }
 function anchor(part){if(!activeRoot&&!registry)return new T.Vector3(...((appearance?.visible?mission.fleet.overviewPositions:mission.fleet.positions)[part.id]||[0,0,0]));const b=boundsOf(part,false);return b.isEmpty()?new T.Vector3(...part.position):b.getCenter(new T.Vector3());}
 function selectComponent(key){onInteraction();return choose(key);}
 async function focusComponent(key){key=registry?.get(key)?.key||key;if(!registry)return choose(key);const entry=parts.get(key);if(!entry||disposed||!available)return false;clearTimeout(assemblyResetTimer);onStatus('');if(entry.path.length>1&&entry.path[0].scene)return choose(key);if(activeRoot)reset();request++;loading=false;selected=entry.part;select.value=key;controls.autoRotate=false;isolated=false;visibility();highlight();refreshLabels();onViewChange(twinView);onSelect(selected,entry.path);syncToolbar();focus(selected);return true;}
 function clearRelationship(){relationship=null;for(const o of [...relations.children]){relations.remove(o);o.geometry?.dispose();o.material?.dispose();}}
 function updateRelationship(){if(!relationship)return;const r=experience.relationships[relationship],points=r.keys.map(k=>anchor(parts.get(k).part));const line=relations.children[0];line.geometry.setFromPoints(points);dirty=true;}
 function showRelationship(id){if(!experience||!Object.hasOwn(experience.relationships,id))return false;reset();relationship=id;const r=experience.relationships[id],line=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:id==='energy'?0xffb64d:0x64dded,transparent:true,opacity:.8,depthTest:false}));line.renderOrder=3;relations.add(line);updateRelationship();onViewChange('exterior',r);overview();return true;}
 function overview(){if(activeRoot){reset();return;}clearTimeout(assemblyResetTimer);request++;loading=false;onStatus('');controls.autoRotate=false;move=null;selected=null;select.value='';isolated=false;visibility();highlight();syncToolbar();refreshLabels();onSelect(null,[]);const b=registry?assemblyBounds(null):boundsOf(null);configureStage(b);cameraTo(b,undefined,assemblyMove?Math.max(900,assemblyMove.start+assemblyMove.duration-performance.now()):900);}
 function explodeModel(){if(!assembly)return;reset();assembly.apply(1);const b=boundsOf(null);assembly.apply(0);assemblyMove={start:performance.now(),from:0,to:1,duration:reduced?0:3300};twinView='exploded';onViewChange(twinView);configureStage(b);cameraTo(b,undefined,reduced?0:3300);dirty=true;}
 function assembleModel(){request++;loading=false;onStatus('');syncToolbar();if(!assembly&&!activeRoot){reset();return;}if(activeRoot){clearTimeout(assemblyResetTimer);const token=++request;openGoal=0;detailGoal={};startPose();onStatus('Reuniendo el conjunto…');if(reduced){reset();return;}assemblyResetTimer=setTimeout(()=>{if(!disposed&&token===request)reset();},1700);return;}const from=assembly.amount;clearRelationship();selected=null;isolated=false;visibility();highlight();refreshLabels();onSelect(null,[]);assembly.apply(0);const b=boundsOf(null);assembly.apply(from);assemblyMove={start:performance.now(),from,to:0,duration:reduced?0:2400};twinView='exterior';onViewChange(twinView);configureStage(b);cameraTo(b,undefined,reduced?0:2400);dirty=true;}
 function isolateComponent(){if(!selected)return;storySelection=false;isolated=!isolated;visibility();syncToolbar();refreshLabels();focus(selected);}
 function layoutLabels(){if(fitted)camera.updateMatrixWorld();labelLayer.layout();}
 const raycaster=new T.Raycaster();let down;
 const pointerDown=e=>{down=[e.clientX,e.clientY];interruptCamera();},pointerCancel=()=>{down=null;};
 const pointerUp=e=>{const start=down;down=null;if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5||loading||globalThis.__nxPickLock)return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects(stage.children,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return !h.object.userData.inspectionGhost&&h.object.material.opacity>.25;});
  for(const hit of hits){if(activeRoot){const depth=p=>{let i=0;for(let o=hit.object;o;o=o.parent,i++)if(p.nodes?.includes(o.name))return i;return Infinity;};const p=[...parts.values()].filter(x=>x.path[0]===activeRoot&&belongs(hit.object,x.part.nodes)).sort((a,b)=>depth(a.part)-depth(b.part))[0]?.part;if(p){selectComponent(p.key);break;}}
   else{const p=registry?mission.components.find(p=>belongs(hit.object,registry.get(p.key)?.exteriorNodes)):mappedExterior&&!appearance?.visible?mission.components.find(p=>belongs(hit.object,mariner?marinerNodes[p.id]:p.exteriorNodes))||mission.components.find(p=>belongs(hit.object,p.exteriorOwnNodes)):mission.components.reduce((best,p)=>{const d=anchor(p).distanceTo(hit.point);return !best||d<best.d?{part:p,d}:best;},null)?.part;if(p)selectComponent(p.key);break;}}
 };
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointercancel',pointerCancel);renderer.domElement.addEventListener('pointerup',pointerUp);
 function keyboard(e){if(!available||e.altKey||e.metaKey||e.ctrlKey)return;const arrows=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];if(!arrows.includes(e.key)&&!['Escape','Home','+','=','-','−'].includes(e.key))return;onInteraction();interruptCamera();controls.autoRotate=false;dirty=true;if(e.key==='Escape'||e.key==='Home'){e.preventDefault();reset();}else if(!arrows.includes(e.key)){e.preventDefault();const offset=camera.position.clone().sub(controls.target),distance=offset.length(),factor=['+','='].includes(e.key)?.88:1/.88;offset.multiplyScalar(T.MathUtils.clamp(distance*factor,controls.minDistance,controls.maxDistance)/Math.max(distance,.0001));camera.position.copy(controls.target).add(offset);controls.update();}}
 renderer.domElement.addEventListener('keydown',keyboard);controls.listenToKeyEvents(renderer.domElement);controls.addEventListener('change',()=>{dirty=true;});controls.addEventListener('start',()=>{onInteraction();interruptCamera();});
 let resizeWidth=0,resizeHeight=0;
 const resize=new ResizeObserver(()=>{
  const w=host.clientWidth,h=host.clientHeight;
  if(!w||!h||w===resizeWidth&&h===resizeHeight)return;
  resizeWidth=w;resizeHeight=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(active&&!loading)focus(selected,{duration:240,direction:camera.position.clone().sub(controls.target).normalize()});
  dirty=true;
 });resize.observe(host);let offscreen=false;const offscreenIO=new IntersectionObserver(([e])=>{offscreen=!e.isIntersecting;if(!offscreen)dirty=true;});offscreenIO.observe(host);/* NEPTUNI v9: no dibuja mientras el visor está fuera de la pantalla */
 function destroy(){if(disposed)return;stopExteriorAnimation();exteriorMixer?.uncacheRoot(exterior);disposed=true;lifetime.abort();signal?.removeEventListener('abort',abortLoad);request++;assemblyMove=null;clearTimeout(assemblyResetTimer);clearRelationship();clearTimeout(deferred);cancelAnimationFrame(frame);resize.disconnect();offscreenIO.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);renderer.domElement.removeEventListener('keydown',keyboard);for(const [event,fn]of[['pointerdown',pointerDown],['pointercancel',pointerCancel],['pointerup',pointerUp]])renderer.domElement.removeEventListener(event,fn);if(adaptive&&renderer.debug)renderer.debug.onShaderError=previousShaderError;controls.dispose();labelLayer.destroy();disposeTree(exterior);disposeTree(appearance);disposeTree(detail);contextPass.dispose();for(const promise of caches.values())promise.then(g=>disposeTree(g),()=>{});floor.geometry.dispose();floor.material.dispose();contact.geometry.dispose();contact.material.dispose();shadowTexture.dispose();environment?.dispose();surfaces.dispose();key.shadow.dispose();scene.clear();runtime.release();host.replaceChildren();}
 runtime.setCleanup(destroy);
 function tick(now){if(disposed)return;frame=requestAnimationFrame(tick);if(!available||offscreen||!host.getClientRects().length||document.hidden){lastFrame=now;return;}
  if (exteriorAction) {
   exteriorMixer.update(lastFrame ? Math.min(.10, (now - lastFrame) / 1000) : 0);
   dirty = true;
  }
  lastFrame = now;
  if(assemblyMove){const t=assemblyMove.duration?Math.min(1,(now-assemblyMove.start)/assemblyMove.duration):1;assembly.apply(T.MathUtils.lerp(assemblyMove.from,assemblyMove.to,t));if(t===1)assemblyMove=null;updateRelationship();dirty=true;}
  if(poseMove){const elapsed=Math.max(0,now-poseMove.start);
   const t=poseMove.duration?Math.min(1,elapsed/poseMove.duration):1,e=t*t*(3-2*t);[open,spin]=poseMove.from.map((v,i)=>T.MathUtils.lerp(v,poseMove.to[i],e));
   for(const key of new Set([...Object.keys(poseMove.fromDetail),...Object.keys(poseMove.toDetail)]))detailWeights[key]=T.MathUtils.lerp(poseMove.fromDetail[key]||0,poseMove.toDetail[key]||0,e);
   pose();if(poseFollow){
    // Cached mesh boxes suffice during motion; resolve the exact endpoint once.
    const center=boundsOf(poseFollow.part,t===1).getCenter(new T.Vector3()),delta=center.clone().sub(poseFollow.center);
    camera.position.add(delta);controls.target.add(delta);poseFollow.center.copy(center);
    if(t===1)poseFollow=null;
   }if(t===1)poseMove=null;
  }
  if(move){const t=move.duration?Math.min(1,Math.max(0,(now-move.start)/move.duration)):1,e=t*t*(3-2*t);camera.position.lerpVectors(move.from,move.position,e);controls.target.lerpVectors(move.fromTarget,move.target,e);
   if(move.part){
    // Frame relative to the moving hardware, not its old installation position.
    const center=boundsOf(move.part,t===1).getCenter(new T.Vector3()),expected=move.partCenter.clone().lerp(move.target,e),delta=center.sub(expected);
    camera.position.add(delta);controls.target.add(delta);
   }if(t===1)move=null;dirty=true;}
  if(actionMove){const t=actionMove.duration?Math.min(1,(now-actionMove.start)/actionMove.duration):1,e=t*t*(3-2*t);demonstration=T.MathUtils.lerp(actionMove.from,actionMove.to,e);pose();if(t===1){actionMove=null;syncToolbar();}}
  const rippling=!reduced&&open>.99&&ripples.some(r=>detailWeights[r.scope]>.99);if(rippling)pose();
  controls.update();if(dirty||controls.autoRotate){if(renderer.shadowMap.enabled&&(exteriorAction||assemblyMove||poseMove||actionMove||rippling||now-shadowStamp>400)){renderer.shadowMap.needsUpdate=true;shadowStamp=now;}try{contextPass.draw(!isolated&&(!!activeRoot||!!registry&&!!selected));if(!available)return;metrics.frame(now);layoutLabels();dirty=false;}catch(error){graphicsFailure(Object.assign(new Error('El navegador interrumpió el renderizado del visor.',{cause:error}),{code:'RENDER_FAILED'}));}}
 }
 const loadExterior=path=>loadWithDeadline(()=>loader.loadAsync(asset(path)),{signal:lifetime.signal,onLateResult:g=>disposeTree(g.scene)});
 try{
  const started=performance.now();
  const [primary,shell]=await Promise.allSettled([loadExterior(exteriorModel),overviewAsset&&loadExterior(overviewAsset)]);
  appearance=shell.status==='fulfilled'?shell.value?.scene:null;
  if(primary.status==='rejected')throw primary.reason;
  exterior=primary.value.scene;
  if(disposed||lifetime.signal.aborted){disposeTree(exterior);disposeTree(appearance);throw new DOMException('Carga cancelada','AbortError');}
  metrics.loaded(performance.now()-started);
  prepareInspectionModel(exterior);
  exteriorBounds=new T.Box3().setFromObject(exterior,true);
  if(appearance){retain(appearance);stage.add(appearance);}
  addExteriorAnimations(primary.value.animations||[]);
  if(registry)assembly=createAssemblyController(exterior,experience.explosion);
  stage.add(exterior);active=exterior;syncExteriorModel();
  const bounds=boundsOf(null);configureStage(bounds);
  const center=bounds.getCenter(new T.Vector3());
  camera.position.copy(center).add(new T.Vector3(.8,.6,1).multiplyScalar(bounds.getBoundingSphere(new T.Sphere()).radius*8));
  controls.target.copy(center);select.disabled=false;visibility();refreshLabels();cameraTo(bounds);
  frame=requestAnimationFrame(tick);onStatus('');
 }catch(error){destroy();throw error;}
 if(mission.fleet.detailModel)deferred=setTimeout(()=>loader.loadAsync(asset(mission.fleet.detailModel)).then(g=>{
  if(disposed){disposeTree(g.scene);return;}
  detail=g.scene;retain(detail);stage.add(detail);syncExteriorModel();dirty=true;
 }).catch(()=>{}),mobile?1400:450);
 if(loadEnvironment)new HDRLoader().load('assets/inspection/studio.hdr',texture=>{if(disposed){texture.dispose();return;}const pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(texture);scene.environment=environment.texture;scene.environmentIntensity=viking2?.38:mariner?.46:.58;texture.dispose();pmrem.dispose();dirty=true;},undefined,()=>{});
 return {choose,setDetailedExterior,focusStoryComponent,back,goDepth,reset,setMenuActions,setExteriorCoverVisible,resetExplodedView,cancelPending,focusComponent,explodeModel,assembleModel,overview,isolateComponent,showRelationship,get root(){return exterior;},get active(){return active;},get renderer(){return renderer;},get camera(){return camera;},get target(){return controls.target;},get state(){return {available,errorCode:graphicsError?.code||null,exteriorCoverVisible,quality:budget.tier,selected:selected?.key,storySelection,root:activeRoot?.key,loading,view:twinView,assemblyAmount:assembly?.amount||0,open,openGoal,demonstration,inspection:{...detailWeights},phase:!available?'unavailable':loading?'loading':assemblyMove?(assemblyMove.to>assemblyMove.from?'opening':'assembling'):poseMove?'opening':'idle',isolated,hidden:[...hidden],triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};},setAutoRotate(v){controls.autoRotate=v;dirty=true;},get autoRotate(){return controls.autoRotate;},destroy};
}
