import {missions} from './missions.js?v=20261024lo1';
import {lunarOrbiterExperience} from './experiences/lunar-orbiter.js?v=20261024a';
import {ComponentRegistry,certaintyLabels} from './twin/component-registry.js?v=20261024lo1';
import {sojournerParts} from './sojourner-parts.js?v=20261023v2';
import {timelineEvents} from './timeline.js?v=20261004d';
import {missionFacts} from './mission-facts.js';

/** Source-backed records for the offline provenance export. */
export const records=[];
const flatten=p=>[p,...(p.children||[]).flatMap(flatten)];
for(const m of missions){records.push({mission:m.id,title:m.name,text:`${missionFacts[m.id]} ${m.summary} Llegada: ${m.arrival}. ${m.coordinates}.`,source:m.source,kind:'overview'});for(const p of(m.id==='sojourner'?sojournerParts.filter(p=>p.parent==='sojourner'):m.components))for(const c of flatten(p))records.push({mission:m.id,component:c.id,path:c.key||c.id,title:`${m.name} · ${c.name}`,text:c.description+(c.specs?'\n'+Object.entries(c.specs).filter(([k])=>!['Representación','Evidencia','Escala'].includes(k)).map(([k,v])=>k+': '+v).join('. '):''),source:c.source||m.source,kind:'component'})}
// Verified Orbiter facts and reconstruction limits share the component registry with the 3D.
const orbiterMission=missions.find(m=>m.id==='orbiter'),orbiterRegistry=new ComponentRegistry({...orbiterMission,components:[...orbiterMission.components,...lunarOrbiterExperience.supplementaryParts]},lunarOrbiterExperience);
for(let i=records.length-1;i>=0;i--)if(records[i].mission==='orbiter'&&records[i].kind==='component')records.splice(i,1);
for(const p of orbiterRegistry.entries.values())records.push({mission:'orbiter',component:p.id,path:p.key,title:'Lunar Orbiter 1 · '+p.name,text:p.function+'\n'+(p.description||'')+'\n'+p.limit+'\nCerteza: '+certaintyLabels[p.certainty],source:p.sources[0].url,kind:'component',document_type:p.sources[0].type,year:orbiterMission.year});
for(const e of timelineEvents.filter(e=>!e.inspectId))records.push({mission:e.id,title:e.name,text:`${e.date}. ${e.description}`,source:e.source,kind:'timeline'});
