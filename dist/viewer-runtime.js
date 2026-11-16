import * as T from './vendor/three/three.module.js';
import {createWebGLContext} from './twin/device-capabilities.js?v=20261009b';

// Mission engines own their scene resources; this page-level runtime owns the
// one WebGL context and camera. Acquire also stops a still-loading old engine.
let shared=null,active=null;
function resetCamera(camera){
 camera.clearViewOffset();camera.fov=30;camera.aspect=1;camera.near=.0001;camera.far=250;
 camera.zoom=1;camera.up.set(0,1,0);camera.position.set(0,0,0);
 camera.quaternion.identity();camera.scale.set(1,1,1);camera.layers.set(0);camera.updateProjectionMatrix();
}
export function acquireViewerRuntime({renderer:providedRenderer,camera:providedCamera,antialias=true}={}){
 const isShared=!providedRenderer;
 if(isShared){
  active?.stop?.();
  if(!shared){
   const canvas=document.createElement('canvas'),context=createWebGLContext(canvas,{antialias});
   shared={renderer:new T.WebGLRenderer({canvas,context,alpha:true,antialias}),camera:new T.PerspectiveCamera(30,1,.0001,250)};
  }
 }
 const renderer=providedRenderer||shared.renderer,camera=providedCamera||(isShared?shared.camera:new T.PerspectiveCamera(30,1,.0001,250));
 resetCamera(camera);renderer.resetState?.();renderer.setRenderTarget?.(null);renderer.setClearColor?.(0,0);
 let released=false;const lease={renderer,camera,shared:isShared,stop:null,
  setCleanup(fn){if(!released)this.stop=fn;},
  release(){
   if(released)return;released=true;this.stop=null;
   if(isShared&&active===lease){active=null;renderer.setRenderTarget?.(null);renderer.renderLists?.dispose();renderer.resetState?.();}
  }
 };
 if(isShared)active=lease;
 return lease;
}
// The page may release the context itself when the whole experience is removed.
export function disposeViewerRuntime(){
 active?.stop?.();active=null;
 if(shared){shared.renderer.dispose();shared.renderer.forceContextLoss?.();shared=null;}
}
