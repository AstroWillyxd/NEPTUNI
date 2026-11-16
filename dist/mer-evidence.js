/** Evidence panel for the MER family (Spirit / Opportunity). Isolated module: the shared
 * component-details.js keeps serving every other mission. Integration hook (one line in
 * componentReading): if(mission.family==='mer')return merEvidence(part,mission); */
const text=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={DOCUMENTED:'DOCUMENTADO',VISUALLY_RECONSTRUCTED:'RECONSTRUCCIÓN VISUAL',INFERRED:'INFERIDO · REPRESENTACIÓN EDUCATIVA'};
const scopes={
 DOCUMENTED:'La fuente confirma la existencia, la función o la cota indicada. La geometría fina se reconstruye y no equivale a un CAD de vuelo.',
 VISUALLY_RECONSTRUCTED:'Forma y posición reconstruidas a partir de fotografías, dibujos técnicos o del modelo educativo de NASA, ajustadas a las cotas documentadas.',
 INFERRED:'Detalle coherente con la ingeniería pero no verificado. Se muestra para explicar la función, no como reproducción de la pieza de vuelo.'
};

export function merEvidence(part,mission){
 const fleet=mission.fleet||{},sources=fleet.sources||{};
 if(!part){
  const hist=(fleet.history||[]).map(h=>`<li><strong>${text(h.when)}</strong>: ${text(h.event)} <span class="mer-muted">(${text(h.source)}; no modelado)</span></li>`).join('');
  return `<p class="insight-certainty">CONFIGURACIÓN MOSTRADA</p><p class="insight-scope">${text(fleet.configuration)}</p>`+
   (hist?`<details class="insight-evidence"><summary>Estados posteriores (variantes con fecha)</summary><ul class="mer-history">${hist}</ul><p class="mer-muted">${text(fleet.historyNote)}</p></details>`:'')+
   `<p class="mer-muted">La separación de piezas es una ayuda educativa: no representa un despliegue ni una reparación hecha en Marte.</p>`;
 }
 const ev=part.evidence||'VISUALLY_RECONSTRUCTED';
 const refs=(part.sources||[]).map(id=>sources[id]?`<li><a href="${text(sources[id].url)}" target="_blank" rel="noopener">${text(sources[id].title)} ↗</a><br><span class="mer-muted">${text(sources[id].type)}${sources[id].date?' · '+text(sources[id].date):''}</span></li>`:'').join('');
 return `<p class="insight-certainty">${labels[ev]||labels.INFERRED}</p><p class="insight-scope">${scopes[ev]||scopes.INFERRED}</p>`+
  (part.detailLimit?`<p class="insight-scope">${text(part.detailLimit)}</p>`:'')+
  (part.variant?`<p class="insight-scope">Marca propia de la variante <strong>${text(part.variant)}</strong>; no pertenece al diseño común MER.</p>`:'')+
  (refs?`<details class="insight-evidence"><summary>Fuentes de este componente</summary><ul class="mer-sources">${refs}</ul></details>`:'');
}
