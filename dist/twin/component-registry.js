export const certaintyLabels={DOCUMENTED:'DOCUMENTADO',VISUALLY_RECONSTRUCTED:'RECONSTRUCCIÓN BASADA EN DOCUMENTACIÓN',INFERRED:'REPRESENTACIÓN EDUCATIVA'};
/** Wraps the existing hierarchy; never manufactures components or source links. */
export class ComponentRegistry{
 constructor(mission,experience){
  this.mission=mission;this.experience=experience;this.entries=new Map();
  const walk=(list,path=[])=>{for(const part of list){const chain=[...path,part],key=part.key||chain.map(p=>p.id).join('/'),system=experience.systems[chain[0].id];
   if(!system)continue;
   const certainty=chain.length===1?system.certainty:part.evidence||'INFERRED';
   const refs=(part.evidenceRefs||[]).map(id=>mission.fleet?.references?.[id]).filter(Boolean);
   const sources=[...system.sources.map(id=>experience.sources[id]),...refs.map(r=>({title:r.title,url:r.url,type:'referencia de reconstrucción'}))].filter((s,i,list)=>s&&list.findIndex(v=>v?.url===s.url)===i);
   const media=refs.some(r=>r.image)?refs.filter(r=>r.image).map(r=>({src:r.image,alt:r.caption||r.title,caption:[r.caption,r.mediaNote].filter(Boolean).join(' '),url:r.url})):system.media.map(id=>experience.media[id]);
   this.entries.set(key,{...part,key,path:chain,parent:chain.at(-2)?.key||null,system:system.system,function:chain.length===1?system.function:part.description,certainty,
    sources,media,limit:[system.limit,part.detailLimit].filter(Boolean).join(' '),
    exteriorNodes:part.exteriorNodes||system.nodes,cameraDirection:chain.length===1?system.cameraDirection:part.cameraDirection||system.cameraDirection});walk(part.children||[],chain);
  }};walk(mission.components);
 }
 get(key){return this.entries.get(this.experience.keyAliases?.[key]||key)||null;}
 has(key){return !!this.get(key);}
 get roots(){return [...this.entries.values()].filter(p=>p.path.length===1);}
 children(key){return (this.get(key)?.children||[]).map(p=>this.get(p.key)).filter(Boolean);}
 path(key){return this.get(key)?.path||[];}
 evidence(key){const part=this.get(key);return part?{...part,label:certaintyLabels[part.certainty]||certaintyLabels.INFERRED}:null;}
}
