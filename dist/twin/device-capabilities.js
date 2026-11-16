/** Conservative rendering budgets; no GPU identity, fingerprint or invented FPS. */
export function renderingBudget({mobile=false,dpr=1,memory,cores,maxTextureSize=8192,maxRenderbufferSize=8192}={}){
 const limited=maxTextureSize<4096||maxRenderbufferSize<4096||memory!==undefined&&memory<=2||cores!==undefined&&cores<=2;
 const tier=limited?'LOW':mobile?'MEDIUM':'HIGH';
 return {tier,pixelRatio:Math.min(Math.max(1,dpr),tier==='HIGH'?2:tier==='MEDIUM'?1.5:1),
  shadowSize:tier==='HIGH'?2048:tier==='MEDIUM'?1024:512,shadows:tier!=='LOW',antialias:tier!=='LOW',maxTextureSize};
}

export function createWebGLContext(canvas,{antialias=true}={}){
 // A GPU may reject a high-performance/antialiased surface while allowing
 // a normal WebGL 2 surface. Retry context options before declaring failure.
 let gl=null;const messages=[],attempts=[];
 const record=message=>{if(!message)return;const text=String(message).replace(/[\u0000-\u001f]/g,' ').slice(0,700);if(!messages.includes(text))messages.push(text);};
 const creationError=event=>record(event.statusMessage);
 canvas.addEventListener?.('webglcontextcreationerror',creationError);
 try{for(const options of [{antialias,powerPreference:'high-performance'},{antialias,powerPreference:'default'},{antialias:false,powerPreference:'default'}]){
  attempts.push({...options});try{gl=canvas.getContext('webgl2',{alpha:true,...options});}catch(error){record(error.message);}
  if(gl)break;
 }}finally{canvas.removeEventListener?.('webglcontextcreationerror',creationError);}
 if(!gl){
  // A separate, released probe distinguishes WebGL 1-only from all graphics
  // being unavailable. It is never passed to the WebGL 2-only renderer.
  let webgl1=null;const probe=canvas.ownerDocument?.createElement('canvas');
  if(probe)try{const context=probe.getContext('webgl',{alpha:true,antialias:false,powerPreference:'default'});webgl1=!!context;context?.getExtension('WEBGL_lose_context')?.loseContext();}catch{webgl1=false;}
  const error=new Error('WebGL context unavailable: este navegador no permite iniciar WebGL 2.');error.code='WEBGL_UNAVAILABLE';error.diagnostics={stage:'context',attempts,messages,webgl1};throw error;
 }
 return gl;
}
