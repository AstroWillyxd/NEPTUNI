// Inspection offsets only. The operational mechanisms are the supplied glTF clips.
export const inspectionOffsets={
 SOJOURNER_SOLAR_ARRAY_EXTERIOR:[0,.40,0],WEB_DECK:[0,.32,0],WEB_INNER_LID:[0,.33,0],
 WEB_SKIN_LEFT:[-.16,0,0],WEB_SKIN_RIGHT:[.16,0,0],WEB_SKIN_FRONT:[0,0,.14],WEB_SKIN_REAR:[0,0,-.14],WEB_BELLY:[0,-.04,0],
 SIDE_CONNECTOR_LEFT:[-.16,0,0],SIDE_CONNECTOR_RIGHT:[.16,0,0],
 CPU_BOARD:[-.045,.22,-.03],POWER_BOARD:[.045,.15,0],BATTERY_ASSEMBLY:[-.04,.16,.15],
 UHF_MODEM:[.09,.08,.08],IMU:[0,.09,.10],APXS_ELECTRONICS:[0,-.03,-.05],
 RHU_1:[.04,.02,.05],RHU_2:[-.05,.02,-.03],RHU_3:[.05,.02,-.01]
};
export function captureRest(root,rest){root.traverse(o=>{if(!rest.has(o))rest.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});});}
export function restoreRest(rest){for(const [o,r]of rest){o.position.copy(r.position);o.quaternion.copy(r.quaternion);o.scale.copy(r.scale);}}
export function applyOpening(objects,rest,amount){for(const [name,v]of Object.entries(inspectionOffsets)){const o=objects.get(name),r=o&&rest.get(o);if(o&&r)o.position.copy(r.position).addScaledVector({x:v[0],y:v[1],z:v[2]},amount);}}
export function fitDistance(width,height,radius=.49,fov=30){const vertical=fov*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*width/height);return radius/Math.sin(Math.min(vertical,horizontal))*1.14;}
