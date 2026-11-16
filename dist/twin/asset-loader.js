/** Bound an asynchronous loader without pretending its network request was aborted. */
export function loadWithDeadline(load,{signal,timeoutMs=45000,onTimeout=()=>{},onLateResult=()=>{}}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(new DOMException('Carga cancelada','AbortError'));return;}
  let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve(result);};
  const abort=()=>finish(signal.reason instanceof Error?signal.reason:new DOMException('Carga cancelada','AbortError'));
  const timer=setTimeout(()=>{const error=new Error('Se agotó el tiempo de carga del modelo.');error.code='ASSET_TIMEOUT';finish(error);onTimeout();},timeoutMs);
  signal?.addEventListener('abort',abort,{once:true});
  Promise.resolve().then(()=>{if(signal?.aborted)throw new DOMException('Carga cancelada','AbortError');return load();})
   .then(result=>{if(settled)onLateResult(result);else finish(null,result);},error=>finish(error));
 });
}

/** Same glTF parser/decoders, with cancellable HTTP and a bounded parse. */
export function createGLTFAssetLoader(parser,{signal,fetcher=fetch,timeoutMs=45000}={}){
 return {async loadAsync(url){
  const controller=new AbortController(),abort=()=>controller.abort(signal?.reason);
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  try{return await loadWithDeadline(async()=>{
   const {data}=await readGLBResponse(url,{signal:controller.signal,fetcher});
   return parser.parseAsync(data,new URL('.',url).href);
  },{signal:controller.signal,timeoutMs,onTimeout:()=>controller.abort(),onLateResult:disposeGLTF});}
  finally{signal?.removeEventListener('abort',abort);}
 }};
}

async function readGLBResponse(url,{signal,fetcher}){
 const response=await fetcher(url,{signal,credentials:'same-origin'});
 if(!response.ok){const error=new Error('No se pudo descargar el modelo ('+response.status+').');error.code=[401,403].includes(response.status)?'ASSET_ACCESS':'ASSET_HTTP';error.status=response.status;throw error;}
 const data=await response.arrayBuffer(),header=data.byteLength>=20?new DataView(data):null;
 if(!header||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==data.byteLength){const error=new Error('La respuesta no contiene un archivo GLB completo.');error.code='ASSET_INVALID';throw error;}
 return {data,status:response.status};
}

/** Explicit diagnostic works even when no GPU context is available. */
export async function inspectGLBResource(url,{signal,fetcher=fetch,timeoutMs=20000}={}){
 const controller=new AbortController(),abort=()=>controller.abort(signal?.reason);
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 try{const {data,status}=await loadWithDeadline(()=>readGLBResponse(url,{signal:controller.signal,fetcher}),{signal:controller.signal,timeoutMs,onTimeout:()=>controller.abort()});return {status,bytes:data.byteLength,valid:true};}
 finally{signal?.removeEventListener('abort',abort);}
}

/** Dispose unique resources, including a parse which completes after cancellation. */
export function disposeGLTF(gltf){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 gltf?.scene?.traverse(object=>{if(!object.isMesh)return;geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material]){
  materials.add(material);for(const value of Object.values(material))if(value?.isTexture&&!value.userData.inspectionShared)textures.add(value);
 }});
 for(const texture of textures)texture.dispose();for(const material of materials)material.dispose();for(const geometry of geometries)geometry.dispose();
}
