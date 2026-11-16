/** Measures rendered frames only. GPU time and memory are never fabricated. */
export function createPerformanceMonitor(renderer,{bytes=0,onChange=()=>{},adaptive=false,maxPixelRatio=1.5}={}){
 let previous=0,lastReport=0,lastAdapt=0,loadMs=0;const frames=[];
 return{loaded(ms){loadMs=ms;},frame(now){
  const delta=now-previous;previous=now;if(delta>0&&delta<180){frames.push(delta);if(frames.length>90)frames.shift();}else frames.length=0;
  if(now-lastReport<1000)return;lastReport=now;
  const sorted=[...frames].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)]||null;
  if(adaptive&&frames.length>=35&&median>38&&now-lastAdapt>6000){const ratio=renderer.getPixelRatio?.()||maxPixelRatio;if(ratio>1){renderer.setPixelRatio(Math.max(1,ratio-.25));lastAdapt=now;}}
  onChange({fps:median?Math.round(1000/median):null,frameMs:median?+median.toFixed(1):null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory?.geometries??null,textures:renderer.info.memory?.textures??null,
   jsHeapBytes:globalThis.performance?.memory?.usedJSHeapSize??null,compressedModelBytes:bytes,loadMs:Math.round(loadMs),pixelRatio:renderer.getPixelRatio?.()??null});
 }};
}
