/** Configurable story, with cancellation on mission changes or rapid next/back. */
export function createStoryController(steps,{execute,onChange}={}){
 let index=-1,epoch=0,destroyed=false;
 async function go(next){
  if(destroyed||!steps.length)return false;
  index=Math.max(0,Math.min(steps.length-1,next));const token=++epoch,step=steps[index];
  onChange?.({step,index,total:steps.length,busy:true,failed:false});
  let ok=false;try{ok=await execute(step.action)!==false;}catch{/* Keep the step retryable; do not report a completed scene action. */}
  if(token!==epoch||destroyed)return false;
  onChange?.({step,index,total:steps.length,busy:false,failed:!ok});return ok;
 }
 return{start:()=>go(0),next:()=>go(index+1),previous:()=>go(index-1),retry:()=>index>=0?go(index):Promise.resolve(false),go,stop(){epoch++;index=-1;onChange?.(null);},get current(){return index>=0?steps[index]:null;},destroy(){destroyed=true;epoch++;}};
}
