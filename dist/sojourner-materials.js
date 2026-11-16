import * as T from './vendor/three/three.module.js';

export function prepareSojournerMaterials(root,{anisotropy=2}={}){
 root.traverse(o=>{
  if(!o.isMesh)return;
  // A mesh owns its inspection state; textures remain shared within each GLB.
  o.material=(Array.isArray(o.material)?o.material:[o.material]).map(original=>{
   const m=original.clone(),name=m.name;
   m.envMapIntensity=.62;
   if(m.normalMap)m.normalScale.setScalar(/WEB_LOW_E_SKIN/.test(name)?.23:/AL_|STAINLESS|STEEL/.test(name)?.18:.42);
   if(/WEB_LOW_E_SKIN/.test(name)){m.envMapIntensity=.48;m.color.multiplyScalar(.94);}
   if(/GAAS_SOLAR_CELL/.test(name)){m.envMapIntensity=.34;m.clearcoat=.30;m.clearcoatRoughness=.12;}
   if(/SILICA_AEROGEL/.test(name)){m.transparent=true;m.opacity=.32;m.depthWrite=false;}
   // Flight photographs show darker wheel barrels, brighter dishes and cleats.
   // Keep this local to the barrel, preserving the aluminium structure.
   if(/^WHEEL_(LEFT|RIGHT)_(FRONT|MIDDLE|REAR)__AL_6061_MACHINED$/.test(o.name)){
    m.color.multiplyScalar(.59);m.envMapIntensity=.46;m.normalScale?.setScalar(.12);
   }
   for(const t of Object.values(m))if(t?.isTexture)t.anisotropy=anisotropy;
   m.userData.sojournerBase={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive?.clone(),emissiveIntensity:m.emissiveIntensity};
   return m;
  });
  if(o.material.length===1)o.material=o.material[0];
  o.castShadow=true;o.receiveShadow=true;
 });
}

export function setSojournerLook(mesh,{opacity=1,selected=false,inspection=false}={}){
 for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
  const b=m.userData.sojournerBase;if(!b)continue;
  const alpha=b.opacity*opacity,transparent=b.transparent||alpha<.999||inspection&&selected;
  if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}
  m.opacity=alpha;m.depthWrite=alpha>.98&&b.depthWrite;
  if(m.emissive){m.emissive.copy(b.emissive);m.emissiveIntensity=b.emissiveIntensity;if(selected){m.emissive.add(new T.Color(0x071923));m.emissiveIntensity=.12;}}
 }
 // Render the solid inspected piece after translucent surroundings so the
 // cover stack does not wash out a board. All surrounding context stays visible.
 mesh.renderOrder=inspection&&selected?10:opacity<.999?1:0;
 mesh.castShadow=opacity>.98;
}
