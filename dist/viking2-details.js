/** Viking 2 evidence panel (adapter). Kept separate from component-details.js so the
 * shared module and the other missions stay untouched. Integration: in
 * componentReading(), add `if(mission.family==='viking2')return viking2Reading(part,mission);` */
const text = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const LABELS = {
  DOCUMENTED: 'DOCUMENTADO · dimensiones y disposición con fuente directa',
  VISUALLY_RECONSTRUCTED: 'RECONSTRUCCIÓN VISUAL · a partir de planos y fotografías',
  INFERRED: 'INFERIDO · detalle coherente con la ingeniería, sin verificación directa'
};
const MEDIA = {  // reference media per system; captions carry their credit
  orbiter: [['assets/evidence/viking2/vo-fig001-plan.webp', 'NASA RP-1027 vol. II, fig. 1 · planta del VO con bahías y paneles'],
            ['assets/evidence/viking2/ksc-75p-160-stack.webp', 'NASA/KSC 75P-160 · orbitador con paneles plegados (hardware de vuelo)']],
  'orbiter/bus': [['assets/evidence/viking2/vo-fig037-bus.webp', 'NASA RP-1027 vol. II, fig. 37 · bus de 16 bahías']],
  'orbiter/propulsion': [['assets/evidence/viking2/vo-fig134-propulsion.webp', 'NASA RP-1027 vol. II, fig. 134 · módulo de propulsión']],
  'orbiter/telecom': [['assets/evidence/viking2/vo-fig031-hga.webp', 'NASA RP-1027 vol. II, figs. 31–32 · HGA y panel solar'],
                      ['assets/evidence/viking2/vo-fig033-lga-relay.webp', 'NASA RP-1027 vol. II, figs. 33–34 · LGA y antena de retransmisión']],
  'orbiter/solar': [['assets/evidence/viking2/vo-fig031-hga.webp', 'NASA RP-1027 vol. II, fig. 32 · subpaneles y estabilizador']],
  'orbiter/science': [['assets/evidence/viking2/vo-fig001-plan.webp', 'NASA RP-1027 vol. II, fig. 1 · plataforma de exploración (bahía 7)']],
  'orbiter/adapter': [['assets/evidence/viking2/vo-fig001-side.webp', 'NASA RP-1027 vol. II, fig. 1 · alzado con adaptador VLC'],
                      ['assets/evidence/viking2/ksc-75p-158-stack.webp', 'NASA/KSC 75P-158 · cápsula y armadura del adaptador']],
  bioshield: [['assets/evidence/viking2/vl-fig017-bioshield.webp', 'NASA RP-1027 vol. I, fig. 17 · bioescudo'],
              ['assets/evidence/viking2/vl-fig008-capsule.webp', 'NASA RP-1027 vol. I, fig. 8 · cápsula despiezada']],
  'bioshield/aeroshell': [['assets/evidence/viking2/vl-fig019-aerodecelerator.webp', 'NASA RP-1027 vol. I, fig. 19 · aeroshell y cubierta'],
                          ['assets/evidence/viking2/vl-fig068-rcs.webp', 'NASA RP-1027 vol. I, fig. 68 · RCS en el aeroshell']],
  'bioshield/stowed': [['assets/evidence/viking2/ksc-75p-110-lander2.webp', 'NASA/KSC 75P-110 · Viking Lander 2 dentro de su aeroshell (hardware de vuelo)']],
  lander: [['assets/evidence/viking2/pia09703-lander-model.webp', 'NASA/JPL PIA09703 · modelo del lander (no es hardware de vuelo)'],
           ['assets/evidence/viking2/vl-fig093-instruments.webp', 'NASA RP-1027 vol. I, fig. 93 · ubicación de instrumentos']],
  'lander/body': [['assets/evidence/viking2/vl-fig021-layout.webp', 'NASA RP-1027 vol. I, fig. 21 · equipos del cuerpo']],
  'lander/legs': [['assets/evidence/viking2/vl-fig022-leg.webp', 'NASA RP-1027 vol. I, fig. 22 · pata plegada y extendida'],
                  ['assets/evidence/viking2/pia00396-vl2-footpad.webp', 'NASA/JPL PIA00396 · plato de apoyo visto por VL-2']],
  'lander/propulsion': [['assets/evidence/viking2/vl-fig074-tde.webp', 'NASA RP-1027 vol. I, fig. 74 · posición de los motores'],
                        ['assets/evidence/viking2/viking-propulsion.webp', 'NASA RP-1027 vol. I, fig. 73 · motor de 18 toberas']],
  'lander/rtg': [['assets/evidence/viking2/viking-flag.webp', 'NASA/JPL PIA00565 · cubierta del RTG de Viking 1 con bandera']],
  'lander/sampler_arm': [['assets/evidence/viking2/viking-collector-flight.webp', 'NASA RP-1027 vol. I, fig. 107 · cabezal colector']],
  'lander/cameras': [['assets/evidence/viking2/viking-camera.webp', 'NASA RP-1027 vol. I, fig. 101 · cámara facsímil']],
  'lander/telecom': [['assets/evidence/viking2/vl-fig023-hga.webp', 'NASA RP-1027 vol. I, fig. 23 · mástil de la HGA'],
                     ['assets/evidence/viking2/vl-fig028-uhf.webp', 'NASA RP-1027 vol. I, fig. 28 · antena UHF'],
                     ['assets/evidence/viking2/arc-p17690-vl2-lga.webp', 'NASA/JPL P-17690 · LGA de Viking 2 en Utopia Planitia']],
  'lander/biology': [['assets/evidence/viking2/viking-samples.webp', 'NASA RP-1027 vol. I, fig. 108 · distribución de muestras']],
  'lander/gcms': [['assets/evidence/viking2/viking-samples.webp', 'NASA RP-1027 vol. I, fig. 108 · distribución de muestras']]
};
function mediaFor(key) {
  for (let k = key; k; k = k.includes('/') ? k.slice(0, k.lastIndexOf('/')) : '') if (MEDIA[k]) return MEDIA[k];
  return [];
}
export function viking2Reading(part, mission) {
  const refs = Object.values(mission.fleet?.references || {});
  const titleFor = url => refs.find(r => r.url === url)?.title || url;
  if (!part) {
    return `<p class="insight-certainty">${LABELS.DOCUMENTED}</p><p class="insight-scope">Configuración de crucero acoplada en órbita de Marte (7 ago – 3 sep 1976): la tapa del bioescudo ya se había expulsado. Abre el orbitador, la cápsula o el lander; el lander se inspecciona en su configuración de superficie en Utopia Planitia.</p>`;
  }
  const media = mediaFor(part.key).map(([src, cap]) => `<figure><a href="${text(src)}" target="_blank" rel="noopener" aria-label="Ampliar ${text(cap)}"><img src="${text(src)}" alt="${text(cap)}" loading="lazy"></a><figcaption>${text(cap)}</figcaption></figure>`).join('');
  const sources = (part.sources || [part.source]).filter(Boolean).map(u => `<li><a href="${text(u)}" target="_blank" rel="noopener">${text(titleFor(u))} ↗</a></li>`).join('');
  return `<p class="insight-certainty">${LABELS[part.evidence] || LABELS.INFERRED}</p>` +
    `<p class="insight-scope">Componente y función: documentados por NASA. ${part.evidence === 'DOCUMENTED' ? 'Las cotas principales proceden de la fuente citada.' : part.evidence === 'INFERRED' ? 'La geometría explica un principio conocido; no es un plano de fabricación.' : 'La forma se reconstruye a partir de planos y fotografías; no es CAD de vuelo.'}</p>` +
    (part.detailLimit ? `<p class="insight-scope viking2-limit">${text(part.detailLimit)}</p>` : '') +
    `<details class="insight-evidence surveyor-evidence"><summary>Fuentes y referencias de este componente</summary>${media}<ul class="viking2-sources">${sources}</ul></details>`;
}
