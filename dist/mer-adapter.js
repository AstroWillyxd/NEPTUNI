import * as T from './vendor/three/three.module.js';

/** MER adapter for the shared NEPTUNI fleet viewer (no changes to shared modules).
 * - Mechanism demonstrations on the delivered exterior nodes (absolute, rest-relative poses: no drift).
 * - Camera follow: once the visitor interrupts automatic framing during an inspection animation, the selected
 *   part stays the pivot while the visitor's own direction and zoom are preserved.
 * - Underside view.
 * Every demo stops (and the rover returns to its rest pose) on selection, reset, or a new demo. */
export function createMerAdapter(engine,mission,host,{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,onStatus=()=>{}}={}){
 const mech=mission.fleet.mechanisms,ext=engine.root,positions=mission.fleet.positions,positionsRest=JSON.parse(JSON.stringify(positions));
 const rest=new Map();ext.traverse(o=>rest.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
 const node=n=>ext.getObjectByName(n);
 const touched=new Set();let props=[],demo=null,raf=0,destroyed=false,follow=null,selectedKey=null;
 const invalidate=()=>engine.setAutoRotate(engine.autoRotate);
 const AX={x:new T.Vector3(1,0,0),y:new T.Vector3(0,1,0),z:new T.Vector3(0,0,1)},q=new T.Quaternion(),rad=T.MathUtils.degToRad;
 function setRot(name,axis,deg){const o=node(name);if(!o)return;const r=rest.get(o);o.quaternion.copy(r.q).multiply(q.setFromAxisAngle(AX[axis],rad(deg)));touched.add(o);}
 function restoreAll(){for(const o of touched){const r=rest.get(o);o.position.copy(r.p);o.quaternion.copy(r.q);o.scale.copy(r.s);}touched.clear();for(const p of props){p.parent?.remove(p);p.geometry?.dispose();p.material?.dispose();}props=[];for(const k of Object.keys(positionsRest))positions[k]=[...positionsRest[k]];ext.updateMatrixWorld(true);invalidate();}
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 // ------------------------------------------------------------------ rocker-bogie (solved table)
 const tab=mech.suspension.table,susp=mech.suspension;
 function suspensionAt(h){const n=tab.length-1,x=T.MathUtils.clamp(h/susp.block.maxHeight,0,1)*n,i=Math.min(n-1,Math.floor(x)),f=x-i,a=tab[i],b=tab[i+1],L=k=>a[k]+(b[k]-a[k])*f;
  return {h,heave:L('heave'),pitch:L('pitchDeg'),roll:L('rollDeg'),rocker:L('rockerDeg'),bl:L('bogieLDeg'),br:L('bogieRDeg'),bar:L('diffBarDeg')};}
 const c=new T.Vector3(...susp.bodyPivotCentre),m1=new T.Matrix4(),m2=new T.Matrix4();
 function applySuspension(s){
  const body=node('MER_BODY');if(!body)return;
  m1.makeTranslation(0,s.heave,0).multiply(m2.makeTranslation(c.x,c.y,c.z)).multiply(new T.Matrix4().makeRotationX(rad(s.pitch))).multiply(new T.Matrix4().makeRotationZ(rad(s.roll))).multiply(new T.Matrix4().makeTranslation(-c.x,-c.y,-c.z));
  const r=rest.get(body);m1.multiply(new T.Matrix4().compose(r.p,r.q,r.s));m1.decompose(body.position,body.quaternion,body.scale);touched.add(body);
  setRot('ROCKER_L','x',s.rocker);setRot('ROCKER_R','x',-s.rocker);setRot('BOGIE_L','x',s.bl);setRot('BOGIE_R','x',s.br);setRot('DIFF_BAR','y',s.bar);
  ext.updateMatrixWorld(true);
  const d=susp.differential;for(const side of ['L','R']){const link=node('DIFF_LINK_'+side),rocker=node('ROCKER_'+side),bar=node('DIFF_BAR');if(!link||!rocker||!bar)continue;
   const a=rocker.localToWorld(new T.Vector3(...d.leverTipLocal[side])),b=bar.localToWorld(new T.Vector3(side==='L'?d.halfLength:-d.halfLength,0,0)),pa=link.parent.worldToLocal(a.clone()),pb=link.parent.worldToLocal(b.clone()),dir=pb.clone().sub(pa);
   const r=rest.get(link),len0=link.userData.merLink?.length||dir.length();link.position.copy(pa).add(pb).multiplyScalar(.5);link.quaternion.setFromUnitVectors(AX.y,dir.clone().normalize());link.scale.set(r.s.x,r.s.y*dir.length()/len0,r.s.z);touched.add(link);}
  ext.updateMatrixWorld(true);
 }
 function blockProp(){const b=susp.block,g=new T.BoxGeometry(b.x1-b.x0,1,b.z1-b.z0);g.translate(0,.5,0);const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0x9b8068,roughness:.92}));m.position.set((b.x0+b.x1)/2,0,(b.z0+b.z1)/2);m.name='NEPTUNI_DEMO_BLOCK';m.userData.neptuniProp=true;ext.parent.add(m);props.push(m);return m;}
 // ------------------------------------------------------------------ IDD
 const idd=mech.idd,stow=idd.stowDeg,jointNames=idd.joints.map(j=>j.node);
 function applyIdd(th){th.forEach((v,i)=>setRot(jointNames[i],'z',v-stow[i]));ext.updateMatrixWorld(true);const t=node('IDD_TURRET_HEAD');if(t)positions.arm=t.getWorldPosition(new T.Vector3()).toArray();}
 function iddTimeline(tool){const p=idd.placements[tool];if(!p?.waypointsDeg)return null;const w=p.waypointsDeg,seg=[];let t=0;
  for(let i=1;i<w.length;i++){const dmax=Math.max(...w[i].map((v,k)=>Math.abs(v-w[i-1][k])));const dur=reduced?0:Math.max(.5,dmax/45);seg.push({t0:t,t1:t+dur,a:w[i-1],b:w[i]});t+=dur;}
  return {segments:seg,total:t,poseAt(time){if(time>=t)return w.at(-1);const s=seg.find(s=>time<=s.t1)||seg.at(-1);const f=s.t1>s.t0?ease((time-s.t0)/(s.t1-s.t0)):1;return s.a.map((v,k)=>v+(s.b[k]-v)*f);}};}
 function rockProp(tool){const p=idd.placements[tool];if(!p)return;const g=new T.DodecahedronGeometry(.11,1);g.scale(1.25,.77,1.1);const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0x6e5a4b,roughness:.95,flatShading:true}));m.position.set(p.target[0],p.target[1]-.085,p.target[2]);m.name='NEPTUNI_DEMO_ROCK';ext.parent.add(m);props.push(m);}
 // ------------------------------------------------------------------ demo runner
 function run(name,duration,step,{label,after}={}){cancelAnimationFrame(raf);engine.setDetailedExterior(true);demo={name,start:performance.now(),duration,step,after};onStatus(label||'');
  const tick=now=>{if(!demo||destroyed)return;const t=reduced?duration:(now-demo.start)/1000;demo.step(Math.min(t,duration));invalidate();if(t>=duration){const a=demo.after;demo=null;onStatus('');a?.();if(!touched.size)engine.setDetailedExterior(false);sync();return;}raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);sync();}
 function stop(restore=true){cancelAnimationFrame(raf);const was=!!demo;demo=null;if(restore){restoreAll();engine.setDetailedExterior(false);onStatus('');}sync();return was;}
 const demos={
  suspension(){stop(true);const block=blockProp(),D=reduced?0:9;
   run('suspension',D||1,t=>{const ph=D?(t<4?ease(t/4):t<5?1:ease(1-(t-5)/4)):1;const s=suspensionAt(ph*susp.block.maxHeight);block.scale.y=Math.max(1e-4,s.h);applySuspension(s);positions.wheels=node('WHEEL_FL').getWorldPosition(new T.Vector3()).toArray();},{label:'Bloque de hasta 20 cm bajo la rueda delantera izquierda. Ángulos resueltos con contacto en las seis ruedas; tiempo educativo.',after:()=>{if(!reduced)restoreAll();}});},
  turn(){stop(true);const st=mech.steering.turnInPlaceDeg,R=mech.suspension.wheelRadius,root=ext,keys=Object.keys(st),wheels=['FL','FR','ML','MR','RL','RR'];
   const steerOf=w=>w[0]==='M'?0:st['STEER_'+w]||0,centre=w=>{const o=node('WHEEL_'+w);return rest.get(o)?o.parent.localToWorld(rest.get(o).p.clone()):new T.Vector3();};
   ext.updateMatrixWorld(true);const C={};for(const w of wheels)C[w]=centre(w);const yawMax=30,D=reduced?0:9;
   run('turn',D||1,t=>{const steerF=D?(t<1?ease(t):t<8?1:ease(1-(t-8))):1,yaw=D?(t<1?0:t<4.5?ease((t-1)/3.5)*yawMax:t<8?ease(1-(t-4.5)/3.5)*yawMax:0):yawMax;
    for(const k of keys)setRot(k,'y',st[k]*steerF);
    root.quaternion.copy(rest.get(root).q).multiply(q.setFromAxisAngle(AX.y,rad(yaw)));touched.add(root);
    for(const w of wheels){const cc=C[w],d=rad(steerOf(w)*steerF),travel=rad(yaw)*(cc.z*Math.sin(d)-cc.x*Math.cos(d)),side=w[1]==='L'?1:-1;setRot('WHEEL_'+w,'x',T.MathUtils.radToDeg(side*travel/R));}
    ext.updateMatrixWorld(true);},{after:()=>restoreAll(),label:'Giro en el sitio: direcciones de '+keys.map(k=>Math.abs(st[k]).toFixed(1)+'°').join(' / ')+' y tracción proporcional al radio de cada rueda. Demostración cinemática educativa.'});},
  mast(){stop(true);const keys=mech.pma.demoDeg,D=reduced?0:10,n=keys.length-1;
   run('mast',D||1,t=>{const x=D?Math.min(n-1e-6,t/D*n):1,i=Math.floor(x),f=ease(x-i),a=keys[i],b=keys[Math.min(n,i+1)],az=a.az+(b.az-a.az)*f,el=a.el+(b.el-a.el)*f;
    setRot('PMA_AZIMUTH','y',az);setRot('PMA_ELEVATION','x',-el);ext.updateMatrixWorld(true);const bar=node('PMA_ELEVATION');if(bar)positions.pancam=bar.localToWorld(new T.Vector3(-.012,.15,.02)).toArray();},{after:()=>restoreAll(),label:'Azimut y elevación del PMA dentro del rango documentado (370° / −104° a +90°). Mini-TES apunta con la misma elevación.'});},
  idd(tool){stop(true);const tl=iddTimeline(tool);if(!tl){onStatus('No hay una trayectoria verificada para '+tool+'.');return;}rockProp(tool);const hold=reduced?0:2.5,total=tl.total*2+hold;
   const names={MI:'el microscopio (MI)',APXS:'el APXS',MB:'el espectrómetro Mössbauer',RAT:'el RAT'};
   run('idd-'+tool,total||1,t=>{const th=t<=tl.total?tl.poseAt(t):t<=tl.total+hold?tl.poseAt(tl.total):tl.poseAt(Math.max(0,total-t));applyIdd(th);},{label:`Despliegue del IDD por movimientos de una articulación (${idd.placements[tool].sequence.join(' → ')}) y colocación de ${names[tool]} sobre una roca. Holgura mínima calculada: ${(idd.placements[tool].minBodyClearanceM*1000).toFixed(0)} mm. Tiempo educativo.`,after:()=>restoreAll()});},
  hga(){stop(true);const h=mech.hga,D=reduced?0:6;run('hga',D||1,t=>{const f=D?(t<2.5?ease(t/2.5):t<3.5?1:ease(1-(t-3.5)/2.5)):1;setRot(h.azimuth.node,'y',h.demoDeg.az*f);setRot(h.elevation.node,'z',h.demoDeg.el*f);ext.updateMatrixWorld(true);const p=node('HGA_PANEL');if(p)positions.antenna=p.getWorldPosition(new T.Vector3()).toArray();},{after:()=>restoreAll(),label:'Apunte de la HGA con su cardán de dos ejes. Los límites angulares no están publicados en las fuentes consultadas.'});},
  rat(){stop(true);const tl=iddTimeline('RAT');if(!tl)return;rockProp('RAT');const grind=7,total=tl.total*2+grind;
   run('rat',total,t=>{const th=t<=tl.total?tl.poseAt(t):t<=tl.total+grind?tl.poseAt(tl.total):tl.poseAt(Math.max(0,total-t));applyIdd(th);
    const g=t>tl.total&&t<tl.total+grind?t-tl.total:0;setRot('RAT_REVOLVE','z',g*90);setRot('RAT_GRIND_HEAD','z',g*540);ext.updateMatrixWorld(true);},{label:'RAT: la rueda de desbaste gira y revoluciona alrededor del eje (velocidades reducidas: 1,5 rev/s y 0,25 rev/s frente a ≈50 rev/s y 0–2 rpm reales).',after:()=>restoreAll()});}
 };
 // ------------------------------------------------------------------ menu
 const B=(label,fn,title='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.onclick=()=>{fn();};return b;};
 const stopBtn=B('Detener demostración',()=>stop(true));
 const buttons=[
  B('Rocker-bogie sobre un bloque',()=>demos.suspension(),'Articulación pasiva con diferencial'),
  B('Girar en el sitio',()=>demos.turn(),'Dirección delantera/trasera y tracción'),
  B('Barrido del mástil',()=>demos.mast()),
  B('IDD: colocar el MI',()=>demos.idd('MI')),B('IDD: colocar el APXS',()=>demos.idd('APXS')),B('IDD: colocar el Mössbauer',()=>demos.idd('MB')),
  B('RAT: desbaste (educativo)',()=>demos.rat()),
  B('Apuntar la HGA',()=>demos.hga()),
  B('Vista inferior',()=>underside(),'Orbitar bajo el rover'),stopBtn];
 function sync(){stopBtn.hidden=!demo&&!touched.size;}
 function menuFor(part){if(part){engine.setMenuActions([B('Vista inferior',()=>underside())]);}else{engine.setMenuActions(buttons);}sync();}
 // ------------------------------------------------------------------ underside view
 function underside(){const root=engine.active||ext;const b=new T.Box3().setFromObject(root),centre=b.getCenter(new T.Vector3()),cam=engine.camera,tgt=engine.target,dist=Math.max(cam.position.distanceTo(tgt),b.getBoundingSphere(new T.Sphere()).radius*2.2);
  tgt.copy(centre);cam.position.copy(centre).add(new T.Vector3(.38,-.85,.62).normalize().multiplyScalar(dist));follow=null;invalidate();onStatus('Vista inferior: la suspensión, los actuadores de las ruedas y la bahía de estiba del IDD. Arrastra para seguir orbitando.');}
 // ------------------------------------------------------------------ camera follow during inspection animations
 const index = new Map();
 function indexParts(parts) {
  for (const part of parts) {
   index.set(part.key, part);
   indexParts(part.children || []);
  }
 }
 indexParts(mission.components);
 const box=new T.Box3(),tmp=new T.Vector3();
 function partCentre(){const part=engine.state.selected&&index.get(engine.state.selected);const root=engine.active;if(!part||!root)return null;box.makeEmpty();for(const n of part.nodes||[]){const o=root.getObjectByName(n);if(o)box.expandByObject(o);}return box.isEmpty()?null:box.getCenter(new T.Vector3());}
 function interrupted(){const ph=engine.state.phase;if(engine.state.selected&&(ph==='opening'||ph==='assembled')){follow={last:partCentre()};}}
 const evts=['pointerdown','wheel','keydown','touchstart'];const canvas=host.querySelector('canvas');for(const e of evts)canvas?.addEventListener(e,interrupted,{passive:true});
 function followTick(){if(destroyed)return;requestAnimationFrame(followTick);if(!follow)return;const ph=engine.state.phase,cen=partCentre();if(!cen){follow=null;return;}
  if(follow.last){tmp.copy(cen).sub(follow.last);if(tmp.lengthSq()>1e-12){engine.camera.position.add(tmp);engine.target.add(tmp);invalidate();}}follow.last=cen;if(ph==='idle'||ph==='loading')follow=null;}
 requestAnimationFrame(followTick);
 menuFor(null);
 return {
  onSelect(part){selectedKey=part?.key||null;follow=null;if(demo||touched.size)stop(true);menuFor(part);},
  stop:()=>stop(true),run:(n,a)=>demos[n]?.(a),underside,
  get demo(){return demo?.name||null;},get following(){return !!follow;},
  destroy(){destroyed=true;stop(true);for(const e of evts)canvas?.removeEventListener(e,interrupted);engine.setMenuActions([]);}
 };
}
