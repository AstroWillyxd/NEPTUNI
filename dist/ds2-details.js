/** DS2 evidence reading for the inspection panel (isolated DS2 adapter; other missions untouched). */
const text=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={DOCUMENTED:'DOCUMENTADO · existencia, función y cotas indicadas',VISUALLY_RECONSTRUCTED:'RECONSTRUCCIÓN BASADA EN DOCUMENTACIÓN',INFERRED:'INFERIDO · coherente con la ingeniería, no verificado'};
const scope={
 DOCUMENTED:'Las fuentes confirman el elemento, su función y los valores citados. La forma fina y la colocación son una reconstrucción, no un CAD de vuelo.',
 VISUALLY_RECONSTRUCTED:'La geometría sigue descripciones, figuras y cotas publicadas. Los detalles sin cota se aproximan de forma contenida.',
 INFERRED:'Forma o posición deducida de la función, el espacio disponible y la necesidad de sobrevivir al impacto. No se presenta como hardware de vuelo exacto.'
};
const sourceNames={
 'mplds2hq.pdf':'NASA/JPL · Kit de prensa MPL/DS2 (dic. 1999)','entry.html':'JPL · DS2 Entry System','system.html':'JPL · DS2 System Level Assembly',
 '20040100756':'NTRS 20040100756 · Aerodinámica de la microsonda (geometría del aeroescudo)','20000056603':'NTRS 20000056603 · The Mars Microprobe Mission: Advanced Micro-Avionics',
 'lithium.html':'JPL · Batería Li–SOCl₂','microcontroller.html':'JPL · Microcontrolador avanzado','flexible.html':'JPL · Cableado flexible',
 'sample.html':'JPL · Muestreo y detección de agua','forebody.html':'JPL · Forebody','aftbody.html':'JPL · Aftbody','3039.pdf':'Smrekar y Gavit · LPI 1998',
 '1999JE001073':'Smrekar et al. 1999 · JGR 104(E11)','mars-polar-lander-deep-space-2':'NASA Science · Mars Polar Lander / Deep Space 2'
 ,'microprobe.html':'NASA/JPL · Fotografía de la sonda de vuelo','AeroshellProbe.html':'NASA/JPL · Fotografía del montaje','FullAeroshell.html':'NASA/JPL · Aeroescudo de vuelo ensamblado'
};
const nameOf=url=>{for(const [k,v] of Object.entries(sourceNames))if(url.includes(k))return v;return url;};
function photographs(part,mission){
 const refs=mission.fleet.references||{},key=part?.key||'',names=!part?['shell','flight','assembly']:key==='aeroshell'?['shell','assembly']:key==='aftbody'||key==='aftbody/antenna'||key.startsWith('aftbody/cover')?['flight','assembly']:[];
 return names.map(name=>refs[name]).filter(Boolean).map(r=>`<figure class="ds2-evidence-photo"><a href="${text(r.image)}" target="_blank" rel="noopener" aria-label="Ampliar ${text(r.title)}"><img src="${text(r.image)}" alt="${text(r.title)}" loading="lazy"></a><figcaption>${text(r.caption)} <a href="${text(r.url)}" target="_blank" rel="noopener">Ver original NASA/JPL ↗</a></figcaption></figure>`).join('');
}
export function componentReading(part,mission){
 if(!part){
  return `<p class="insight-certainty">CONFIGURACIÓN DE ENTRADA · UNA SONDA REPRESENTATIVA</p><p class="insight-scope">${text(mission.fleet.configuration)}. El destino real de Scott y Amundsen no se confirmó: no se recibió señal tras la llegada prevista del 3 de diciembre de 1999, y no se conocen ni el sitio exacto ni la causa de la pérdida. Las separaciones de piezas son educativas: no representan el despliegue, el impacto ni un mantenimiento.</p><details class="insight-evidence"><summary>Comparar con fotografías reales de NASA/JPL</summary>${photographs(null,mission)}</details>`;
 }
 const src=[part.source].filter(Boolean);
 return `<p class="insight-certainty">${labels[part.evidence]||labels.INFERRED}</p><p class="insight-scope">${scope[part.evidence]||scope.INFERRED}</p><details class="insight-evidence"><summary>Fuentes de este componente</summary>${photographs(part,mission)}<ul class="ds2-sources">${src.map(u=>`<li><a href="${text(u)}" target="_blank" rel="noopener">${text(nameOf(u))}</a></li>`).join('')}</ul></details>`;
}
