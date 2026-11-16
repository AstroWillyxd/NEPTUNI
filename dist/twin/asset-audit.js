/** HTTP headers and HDR signature. This does not prove shader compilation or GLB rendering. */
export function experienceAssets(mission,experience,{mobile=false}={}){
 const paths=[mission.model,mission.fleet?.mobileModel,...mission.components.map(p=>p.scene),
  ...Object.values(experience.media).map(m=>m.src),'assets/inspection/studio.hdr'];
 for(const profile of ['foil','fabric','solar','pcb','copper','cable','coating','anodized','aluminium'])
  for(const kind of ['color','normal','roughness'])paths.push(`assets/materials/${mobile?256:512}/${profile}-${kind}.${kind==='color'?'webp':'png'}`);
 return [...new Set(paths.filter(Boolean))];
}

export async function auditAssets(paths,{fetcher=fetch,signal,onResult=()=>{},timeoutMs=8000}={}){
 const results=[];let index=0;
 async function worker(){
  while(index<paths.length&&!signal?.aborted){
   const path=paths[index++],controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(abort,timeoutMs);let result;
   try{const response=await fetcher(path,{method:'HEAD',signal:controller.signal,cache:'no-cache'}),type=response.headers.get('content-type')||'';
    const expected=path.endsWith('.glb')?/gltf|octet-stream/:path.endsWith('.hdr')?/octet-stream|radiance|hdr/:/image\//;
    result={path,status:response.status,ok:response.ok&&expected.test(type),type,bytes:Number(response.headers.get('content-length'))||null};
    // Some static hosts label HDR as text/plain. Check the file, not that MIME label.
    if(path.endsWith('.hdr')&&response.ok){
     const body=await fetcher(path,{headers:{Range:'bytes=0-63'},signal:controller.signal,cache:'no-cache'}),buffer=await body.arrayBuffer();
     result.ok=body.ok&&/^#\?(RADIANCE|RGBE)/.test(new TextDecoder().decode(new Uint8Array(buffer,0,Math.min(64,buffer.byteLength))));
    }
   }catch(error){result={path,status:null,ok:false,error:controller.signal.aborted?'Petición interrumpida o agotada':'Recurso no accesible'};}
   finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
   results.push(result);if(!signal?.aborted)onResult(result);
  }
 }
 await Promise.all([worker(),worker(),worker()]);return results;
}
