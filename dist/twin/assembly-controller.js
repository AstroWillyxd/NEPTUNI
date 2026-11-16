import * as T from '../vendor/three/three.module.js';
const smooth=t=>t*t*(3-2*t);
/** Absolute transforms prevent drift on repeated open/back/reset. */
export function createAssemblyController(root,configuration){
 const entries=configuration.map(c=>{const node=root.getObjectByName(c.node);if(!node)throw new Error('Missing assembly: '+c.node);return{...c,node,rest:node.position.clone(),offset:new T.Vector3(...c.offset)};});
 let amount=0;
 return{apply(value){amount=T.MathUtils.clamp(value,0,1);for(const e of entries){const t=T.MathUtils.clamp((amount-e.start)/(e.end-e.start),0,1);e.node.position.copy(e.rest).addScaledVector(e.offset,smooth(t));}root.updateMatrixWorld(true);},reset(){this.apply(0);},get amount(){return amount;},get entries(){return entries;}};
}
