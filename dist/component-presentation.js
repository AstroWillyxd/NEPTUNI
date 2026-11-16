import * as T from './vendor/three/three.module.js';

/** Inspection offsets are educational, never changes to the historical model.
 * applyFleetPose restores the source pose before these offsets are applied. */
export function createComponentPresentation(root) {
 const plans=new Map(),matrix=new T.Matrix3();
 const excludedNames=new Set();root.traverse(node=>{for(const name of node.userData.presentationClearanceExcludedNames||[])excludedNames.add(name);});
 const excluded=[...excludedNames].map(name=>root.getObjectByName(name)).filter(Boolean);
 function members(part){
  const candidates=(part.nodes||[]).map(name=>root.getObjectByName(name)).filter(Boolean);
  return candidates.filter(node=>!candidates.some(parent=>parent!==node&&isWithin(node,parent)));
 }
 function isWithin(node,parent){for(let n=node;n;n=n.parent)if(n===parent)return true;return false;}
 function apply(weights={},amount=1){
  for(const [key,plan]of plans){const weight=(weights[key]||0)*amount;if(!weight)continue;
   for(const {node,delta}of plan)node.position.addScaledVector(delta,weight);
  }
  root.updateMatrixWorld(true);
 }
 /** Call after restoring the neutral, open pose. Ancestors remain raised when
  * a child is inspected; siblings return to their own installation positions. */
 function goals(path){
  const goals={};
  for(const part of path.slice(1)){
   const key='presentation:'+part.key;
   if(!plans.has(key)){
    root.updateMatrixWorld(true);const selected=members(part),box=new T.Box3(),others=new T.Box3();
    for(const node of selected)box.union(new T.Box3().setFromObject(node,true));
    if(box.isEmpty())continue;
    root.traverse(node=>{if(!node.isMesh||selected.some(parent=>isWithin(node,parent))||excluded.some(parent=>isWithin(node,parent)))return;
     node.geometry.computeBoundingBox();others.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));
    });
    const size=box.getSize(new T.Vector3()),span=Math.max(size.x,size.y,size.z);
    const surrounding=others.getSize(new T.Vector3()),scale=Math.max(span,surrounding.x,surrounding.y,surrounding.z);
    const minimum=Math.max(.002,span*.22,scale*.045);
    const limit=Math.max(minimum,Math.min(scale*.24,span*.75+scale*.055));
    const distance=others.isEmpty()?minimum:T.MathUtils.clamp(others.max.y-box.min.y+span*.035,minimum,limit);
    const worldDelta=new T.Vector3(0,distance,0);
    plans.set(key,selected.map(node=>({node,delta:worldDelta.clone().applyMatrix3(matrix.setFromMatrix4(node.parent.matrixWorld).invert())})));
   }
   goals[key]=1;
   // Apply only this level while planning the next one. Do not apply ancestors twice.
   for(const {node,delta}of plans.get(key)||[])node.position.add(delta);
   root.updateMatrixWorld(true);
  }
  return goals;
 }
 return {goals,apply,get offsets(){return plans;}};
}
