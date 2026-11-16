import {meta,sourceBook} from './sojourner-data.js?v=20261023v2';

const evidence={DOCUMENTED:'Arquitectura documentada',VISUALLY_RECONSTRUCTED:'Reconstrucción fotográfica',INFERRED:'Geometría o ubicación inferida'};
const primarySource=c=>c.sources.map(id=>sourceBook[id]).find(s=>s&&!/wikipedia/i.test(s.title)&&!s.title.startsWith('NEPTUNI'))?.url||sourceBook[c.sources[0]]?.url||sourceBook['JPL-ROB'].url;
export const sojournerParts=meta.components.filter(c=>c.id!=='sojourner').map(c=>({
 ...c,name:c.name.es,description:c.description.es,position:c.cameraFocus.target,radius:c.cameraFocus.radius,
 evidence:c.geometryFidelity,source:primarySource(c),children:[],
 specs:{...c.specs,Función:c.scientificName,Arquitectura:evidence[c.fidelity],Geometría:evidence[c.geometryFidelity],Escala:'1 unidad = 1 metro'}
}));
// Preserve the useful V1 inspection depth using the actual V2 board and brushed-motor nodes.
const extra=(id,parent,name,nodes,description,file='interior')=>{
 const base=sojournerParts.find(p=>p.id===parent);
 sojournerParts.push({...base,id,parent,name,nodes,description,children:[],level:4,file,inside:file==='interior',
  evidence:'INFERRED',specs:{...base.specs,Geometría:evidence.INFERRED}});
};
extra('cpu-packages','cpu','Encapsulados de la CPU',['CPU_BOARD_PACKAGES'],'Encapsulados, terminales y soldaduras representativos. La silueta sigue las fotografías de las placas JPL; las pistas y la identificación de componentes menores no son un circuito de vuelo verificado.');
extra('pcb-connectors','cpu','Conectores de la CPU',['CPU_BOARD_CONNECTORS'],'Conectores y contactos metálicos de la placa CPU. Los detalles y la ubicación instalada son una reconstrucción educativa.');
extra('power-passives','power-board','Componentes de potencia',['POWER_BOARD_PACKAGES'],'Condensadores, magnéticos y encapsulados de la placa de potencia. Sus valores y conexiones no se han comprobado con un esquema de vuelo.');
extra('power-connectors','power-board','Conectores de potencia',['POWER_BOARD_CONNECTORS'],'Contactos de alimentación y control de la placa de potencia, representados con geometría educativa.');
extra('motor-rotor','drive','Rotor y escobillas',['DRIVE_RM_ROTOR','DRIVE_RM_BRUSHES'],'Motor de corriente continua con escobillas y rotor sin núcleo. La arquitectura de motores con escobillas está documentada por JPL; este corte y su bobinado son representativos.','drive_cutaway');
extra('motor-gears','drive','Reductor planetario 2000:1',['DRIVE_RM_GEARHEAD'],'Cuatro etapas planetarias ilustran la reducción total de 2000:1 documentada por PDS. El dentado y la distribución interna son una reconstrucción educativa.','drive_cutaway');
const solar=sojournerParts.find(p=>p.id==='solar');solar.specs={...solar.specs,Celdas:'234 GaAs · 13 cadenas de 18',Área:'Área bruta V2: 0,257 m²; PDS: 0,22 m². Diferencia pendiente de reconciliar.'};
for(const p of sojournerParts)p.children=sojournerParts.filter(c=>c.parent===p.id);
const aliases={chassis:'web',rocker:'rocker-bogie',deployment:'apxs',flex:'harness','motor-copper':'motor-rotor'};
export const partById=id=>sojournerParts.find(p=>p.id===(aliases[id]||id));
export function partPath(id){const path=[];for(let p=partById(id);p;p=partById(p.parent))path.unshift(p);return path;}
export const overviewIds=['solar','cameras','rocker-bogie','avionics','apxs','antenna'];
export const clipLabels={DRIVE_FORWARD:'Tracción de las seis ruedas',TURN_IN_PLACE:'Giro sobre el terreno',ROCKER_BOGIE_CLIMB:'Suspensión sobre un obstáculo',APXS_DEPLOY_SOIL:'APXS · contacto con el suelo',APXS_DEPLOY_ROCK:'APXS · aproximación a una roca',MAE_COVER_CYCLE:'MAE · apertura del vidrio',GEARTRAIN_DEMO:'Reductor · funcionamiento didáctico'};
export {meta};
