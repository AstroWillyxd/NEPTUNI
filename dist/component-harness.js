import * as T from './vendor/three/three.module.js';
/** Bounded physical connections, not arbitrary scripts from model metadata.
 * Reuses one buffer per cable, following both named anchors during inspection.
 */
export function createComponentHarness(root){
 const entries=[],inverse=new T.Matrix4(),linear=new T.Matrix3(),a=new T.Vector3(),b=new T.Vector3(),point=new T.Vector3(),radial=new T.Vector3(),bend=new T.Vector3(),scale=new T.Vector3();
 root.traverse(node=>{
  const data=node.userData.followHarness;if(!data)return;
  const start=root.getObjectByName(data.start),end=root.getObjectByName(data.end),mesh=node.children.find(n=>n.isMesh);
  if(!start||!end||!mesh||![data.startPoint,data.endPoint].every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)))return;
  const segments=T.MathUtils.clamp(Math.round(data.segments||24),12,36),sides=T.MathUtils.clamp(Math.round(data.radialSegments||6),4,8),radius=T.MathUtils.clamp(data.radius||.0015,.00025,.01);
  const curve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(0,.02,.03),new T.Vector3(0,.02,.06),new T.Vector3(0,0,.09)]);
  const geometry=new T.TubeGeometry(curve,segments,radius,sides,false);mesh.geometry.dispose();mesh.geometry=geometry;
  root.updateMatrixWorld(true);const restInRoot=root.worldToLocal(node.getWorldPosition(new T.Vector3()));
  entries.push({node,mesh,start,end,data,segments,sides,radius,curve,last:null,restInRoot});
 });
 function update(){
  if(!entries.length)return;root.updateMatrixWorld(true);
  for(const e of entries){
   a.fromArray(e.data.startPoint).applyMatrix4(e.start.matrixWorld);b.fromArray(e.data.endPoint).applyMatrix4(e.end.matrixWorld);
   // Meshopt quantization introduces a translation/scale on the mesh below
   // its logical harness group. Build in that mesh's frame, not the group,
   // so the decoded transform cannot detach the two endpoints.
   inverse.copy(e.mesh.matrixWorld).invert();a.applyMatrix4(inverse);b.applyMatrix4(inverse);
   const signature=[...a.toArray(),...b.toArray(),e.node.position.y];
   if(e.last&&signature.every((v,i)=>Math.abs(v-e.last[i])<1e-8))continue;e.last=signature;
   const location=root.worldToLocal(e.node.getWorldPosition(new T.Vector3()));
   const bow=T.MathUtils.clamp(e.data.bow||.018,0,.15)+(e.data.addLiftSlack===false?0:Math.max(0,location.y-e.restInRoot.y));
   bend.set(0,bow,0).applyMatrix3(linear.setFromMatrix4(inverse));
   e.mesh.getWorldScale(scale);const radius=e.radius/Math.max(.00001,Math.max(scale.x,scale.y,scale.z));
   const controls=e.curve.points;controls[0].copy(a);controls[1].copy(a).lerp(b,.33).add(bend);controls[2].copy(a).lerp(b,.67).add(bend);controls[3].copy(b);
   e.curve.updateArcLengths();const frames=e.curve.computeFrenetFrames(e.segments,false),position=e.mesh.geometry.attributes.position,normal=e.mesh.geometry.attributes.normal;
   for(let i=0;i<=e.segments;i++){
    e.curve.getPointAt(i/e.segments,point);
    for(let j=0;j<=e.sides;j++){const angle=j/e.sides*Math.PI*2;
     radial.copy(frames.normals[i]).multiplyScalar(-Math.cos(angle)).addScaledVector(frames.binormals[i],Math.sin(angle));
     const index=i*(e.sides+1)+j;position.setXYZ(index,point.x+radial.x*radius,point.y+radial.y*radius,point.z+radial.z*radius);normal.setXYZ(index,radial.x,radial.y,radial.z);
    }
   }
   position.needsUpdate=normal.needsUpdate=true;e.mesh.geometry.computeBoundingBox();e.mesh.geometry.computeBoundingSphere();
  }
 }
 return {update,get count(){return entries.length;},get connections(){return entries.map(e=>({name:e.node.name,start:e.start.name,end:e.end.name}));}};
}
