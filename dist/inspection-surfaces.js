import * as T from './vendor/three/three.module.js';
const profiles=[
 [/foil|blanket|thermal seams|polyimide|ribbon/i,'foil',.20,2],
 [/seat|webbing|fabric/i,'fabric',.17,4],
 [/solar semiconductor|photovoltaic|cell interconnect/i,'solar',.025,2],
 [/substrate|glass epoxy|period circuit|pcb/i,'pcb',.06,2],
 [/copper|winding/i,'copper',.075,3],
 [/cable|nylon|insulation|sleeve/i,'cable',.08,4],
 [/white|ceramic|coating/i,'coating',.07,2],
 [/anodized|optical baffle|package/i,'anodized',.055,3],
 [/alumin|edge|steel|titanium|gear|solder|contact|connector/i,'aluminium',.065,3]
];
/** Shared micro-normal/roughness maps preserve the NASA source albedo/UVs. */
export function createInspectionSurfaces({mobile=false,enabled=true,onChange=()=>{},anisotropy=2}={}){
 const loader=new T.TextureLoader(),cache=new Map(),owned=new Set();let disposed=false;
 function texture(profile,kind,repeat){
  const key=profile+'-'+kind;if(cache.has(key))return cache.get(key);
  const phoenix=profile.startsWith('phoenix/'),path=phoenix?profile+'-'+kind:`${mobile?256:512}/${key}`;
  const url=new URL(`./assets/materials/${path}.${kind==='color'?'webp':'png'}?v=${phoenix?'20261017b':'20261004a'}`,import.meta.url).href;
  const t=loader.load(url,()=>{if(!disposed)onChange();},undefined,()=>{});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.flipY=false;t.anisotropy=anisotropy;t.colorSpace=kind==='color'?T.SRGBColorSpace:T.NoColorSpace;t.userData.inspectionShared=true;cache.set(key,t);owned.add(t);return t;
 }
 return {
  apply(root){root.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.uv)return;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(!m.isMeshStandardMaterial||m.transparent||/optic|glass|lens|window/i.test(m.name))continue;
    const profile=profiles.find(([test])=>test.test(m.name));if(!profile)continue;let[,name,strength,repeat]=profile;
    const phoenix=m.name.startsWith('Phoenix ');if(phoenix&&['foil','aluminium','coating'].includes(name)){name='phoenix/'+name;repeat=1;strength=name.endsWith('foil')?.34:.12;}
    if(m.name==='Phoenix photographic photovoltaic surface'){name='phoenix/solar-photo';repeat=1;strength=.015;}
    if(m.name==='Phoenix UltraFlex photovoltaic cells'){name='phoenix/solar-cell';repeat=1;strength=.045;}
    m.userData.surfaceProfile=name;
    if(enabled){if(!m.normalMap){m.normalMap=texture(name,'normal',repeat);m.normalScale=new T.Vector2(strength,strength);}if(!m.roughnessMap)m.roughnessMap=texture(name,'roughness',repeat);if(!m.map&&(!m.userData.preserveBaseColor||name==='phoenix/foil'||name==='phoenix/solar-photo'||name==='phoenix/solar-cell'))m.map=texture(name,'color',repeat);}
    m.needsUpdate=true;
   }
  });},
  dispose(){disposed=true;for(const t of owned)t.dispose();owned.clear();cache.clear();}
 };
}
