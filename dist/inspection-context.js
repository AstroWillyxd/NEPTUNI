import * as T from './vendor/three/three.module.js';

/** Preserve the product finish; contextual ghosts must not retain opaque
 * shadows, metal highlights, emissive parts or two overlapping surface passes. */
export function rememberInspectionMaterial(mesh){
 const m=mesh.material;
 mesh.userData.twinMaterial={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,
  color:m.color?.clone(),metalness:m.metalness,roughness:m.roughness,envMapIntensity:m.envMapIntensity,
  forceSinglePass:m.forceSinglePass,side:m.side,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow};
}
export function applyInspectionContext(mesh,opacity=null){
 const m=mesh.material,b=mesh.userData.twinMaterial;if(!b)return;
 const ghost=opacity!==null;mesh.userData.inspectionGhost=ghost;
 m.opacity=ghost?b.opacity*opacity:b.opacity;m.transparent=ghost||b.transparent;m.depthWrite=ghost?false:b.depthWrite;
 if(m.color&&b.color){m.color.copy(b.color);if(ghost)m.color.lerp(new T.Color(0xaebec8),.55);}
 if(b.metalness!==undefined)m.metalness=ghost?0:b.metalness;
 if(b.roughness!==undefined)m.roughness=ghost?1:b.roughness;
 if(b.envMapIntensity!==undefined)m.envMapIntensity=ghost?0:b.envMapIntensity;
 m.forceSinglePass=ghost?true:b.forceSinglePass;
 mesh.castShadow=ghost?false:b.castShadow;mesh.receiveShadow=ghost?false:b.receiveShadow;
 if(ghost&&m.emissive){m.emissive.set(0);m.emissiveIntensity=0;}
 // transparent and forceSinglePass alter the renderer's material program.
 m.needsUpdate=true;
}

const contextLayer = 9;

/** Keep the original materials for the working parts and for the assembled view. */
export function setInspectionGhost(mesh, ghost) {
  if (mesh.userData.inspectionGhost === ghost) return;
  if (!mesh.userData.inspectionGhost) mesh.userData.inspectionShadow = mesh.castShadow;
  mesh.userData.inspectionGhost = ghost;
  mesh.castShadow = ghost ? false : mesh.userData.inspectionShadow;
  if (ghost) {
    mesh.layers.disable(0);
    mesh.layers.enable(contextLayer);
  } else {
    mesh.layers.disable(contextLayer);
    mesh.layers.enable(0);
  }
}

/** Draw only the nearest contextual surface at each pixel. Hidden plates and
 * wires behind it cannot accumulate into an opaque mass over the selected part. */
export function createContextPass(renderer, scene, camera) {
  const sides = {side: T.DoubleSide, forceSinglePass: true};
  const depth = new T.MeshDepthMaterial({...sides, colorWrite: false});
  const tint = new T.MeshLambertMaterial({
    ...sides, color: 0xa9b2d0, transparent: true, opacity: .25, depthWrite: false, depthFunc: T.EqualDepth
  });

  function draw(showContext) {
    if (!showContext) {
      renderer.render(scene, camera);
      return;
    }

    const {autoClear, info, shadowMap} = renderer;
    const autoReset = info.autoReset, shadows = shadowMap.enabled;
    const mask = camera.layers.mask, material = scene.overrideMaterial, background = scene.background;
    try {
      info.autoReset = false;
      info.reset();
      renderer.render(scene, camera);
      renderer.autoClear = false;
      shadowMap.enabled = false;
      scene.background = null;
      camera.layers.set(contextLayer);
      scene.overrideMaterial = depth;
      renderer.render(scene, camera);
      scene.overrideMaterial = tint;
      renderer.render(scene, camera);
    } finally {
      scene.overrideMaterial = material;
      scene.background = background;
      camera.layers.mask = mask;
      renderer.autoClear = autoClear;
      shadowMap.enabled = shadows;
      info.autoReset = autoReset;
    }
  }

  return {
    draw,
    light(light) { light.layers.enable(contextLayer); },
    clip(planes) { depth.clippingPlanes = planes; tint.clippingPlanes = planes; },
    dispose() { depth.dispose(); tint.dispose(); }
  };
}
