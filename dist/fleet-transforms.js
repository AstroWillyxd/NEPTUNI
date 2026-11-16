import * as T from './vendor/three/three.module.js';
export function rememberFleetPose(root){const rest=new Map();root.traverse(o=>rest.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone(),visible:o.visible}));return rest;}
/** Absolute rest-relative pose. Repeated open/reset cycles never accumulate transforms. */
export function applyFleetPose(root,rest,amount=0,spin=0,inspection={},demonstration=0,time=0){
 root.traverse(o=>{const saved=rest.get(o);if(!saved)return;o.position.copy(saved.position);o.quaternion.copy(saved.quaternion);o.scale.copy(saved.scale);
  const offset=o.userData.explode;if(offset)o.position.addScaledVector(new T.Vector3(...offset),amount);
  for(const [key,delta]of Object.entries(o.userData.inspectOffsets||{})){
   const weight=inspection[key]||0;if(weight)o.position.addScaledVector(new T.Vector3(...delta),weight*amount);
  }
  if(o.userData.actionOffset)o.position.addScaledVector(new T.Vector3(...o.userData.actionOffset),demonstration);
  if(o.userData.actionRotation){const {axis,angle}=o.userData.actionRotation;o.rotateOnAxis(new T.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0),angle*demonstration);}
  if(o.userData.actionScale){const scale=new T.Vector3(...o.userData.actionScale);o.scale.multiply(new T.Vector3(1,1,1).lerp(scale,demonstration));}
  const segment=o.userData.actionSegment;
  if(segment){const a=new T.Vector3(...segment.start),b=new T.Vector3(...segment.end),originalLength=a.distanceTo(b);b.addScaledVector(new T.Vector3(...segment.endDelta),demonstration);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());o.scale.y=saved.scale.y*a.distanceTo(b)/originalLength;}
  const ripple=o.userData.educationalRipple;
  if(ripple&&amount>0&&inspection[ripple.scope]){o.position.y+=Math.sin(time*.0013)*ripple.amplitude;o.rotateZ(Math.sin(time*.0009)*.008);}
  if(o.userData.spinAxis)o.rotateOnAxis(new T.Vector3(o.userData.spinAxis==='x'?1:0,o.userData.spinAxis==='y'?1:0,o.userData.spinAxis==='z'?1:0),spin);
  if(o.morphTargetInfluences)for(let i=0;i<o.morphTargetInfluences.length;i++)o.morphTargetInfluences[i]=amount;
 });root.updateMatrixWorld(true);
}
export function fleetFitDistance(width,height,radius,fov=30){
 const aspect=Math.max(.1,width/Math.max(1,height)),vertical=T.MathUtils.degToRad(fov),horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);
 // Reserve the upper selector and lower toolbars; adapt rather than crop on phones.
 return radius/Math.sin(Math.min(vertical,horizontal)*.5)*1.12/Math.max(.52,1-190/Math.max(360,height));
}
/** Fits a long spacecraft using its projected bounds instead of an oversized
 * enclosing sphere. The horizontal boom span stays visible on phones. */
export function fleetFitBoundsDistance(width,height,bounds,direction,fov=30,insets=null){
 const center=bounds.getCenter(new T.Vector3()),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize();
 const tangent=Math.tan(T.MathUtils.degToRad(fov)*.5),horizontal=tangent*Math.max(.1,width/Math.max(1,height)),usableHeight=insets?Math.max(.25,1-(insets.top+insets.bottom)/height):Math.max(.52,1-190/Math.max(360,height)),usableWidth=insets?Math.max(.25,1-(insets.left+insets.right)/width):1;let distance=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new T.Vector3(x,y,z).sub(center),depth=p.dot(direction);
  distance=Math.max(distance,depth+Math.abs(p.dot(right))/(horizontal*.87*usableWidth),depth+Math.abs(p.dot(up))/(tangent*.88*usableHeight));
 }
 return Math.max(.01,distance);
}

/** Cache the real vertices of a static exterior once. A cross-shaped solar
 * array has large empty corners in its enclosing box; those are not hardware. */
export function collectFleetFitPoints(root){
 root.updateMatrixWorld(true);const meshes=[];let count=0;
 root.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;for(let p=o;p;p=p.parent)if(!p.visible)return;meshes.push(o);count+=o.geometry.attributes.position.count;});
 const points=new Float32Array(count*3),p=new T.Vector3();let index=0;
 for(const mesh of meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){
  mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);points[index++]=p.x;points[index++]=p.y;points[index++]=p.z;
 }
 return points;
}
/** Same safe-area fit as above, using occupied geometry instead of empty box corners.
 * No allocations or geometry traversal in this inner loop; never run per frame. */
export function fleetFitPointsDistance(width,height,points,center,direction,fov=30,insets=null){
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize(),tangent=Math.tan(T.MathUtils.degToRad(fov)*.5);
 const usableH=insets?Math.max(.25,1-(insets.top+insets.bottom)/height):1,usableW=insets?Math.max(.25,1-(insets.left+insets.right)/width):1,horizontal=tangent*Math.max(.1,width/Math.max(1,height))*.87*usableW,vertical=tangent*.88*usableH;let distance=0;
 for(let i=0;i<points.length;i+=3){const x=points[i]-center.x,y=points[i+1]-center.y,z=points[i+2]-center.z,depth=x*direction.x+y*direction.y+z*direction.z;
  distance=Math.max(distance,depth+Math.abs(x*right.x+y*right.y+z*right.z)/horizontal,depth+Math.abs(x*up.x+y*up.y+z*up.z)/vertical);
 }
 return Math.max(.01,distance);
}
