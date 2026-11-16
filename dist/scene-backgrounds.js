/** Archive photographs provide context; they are not simulated landing sites. */
const records={
 apollo11:['Superficie lunar · Apollo 11','Neil Armstrong / NASA','https://science.nasa.gov/image-article/apod-2018-july-21-apollo-11-landing-site-panorama/'],
 hadley:['Hadley · referencia de Apollo 15','Apollo 15 / USGS / NASA','https://science.nasa.gov/image-article/apod-2016-august-5-apollo-15-panorama/'],
 pathfinder:['Ares Vallis · Mars Pathfinder','NASA/JPL','https://science.nasa.gov/photojournal/improved-mpf-360-degree-color-panorama/'],
 spirit:['Gusev · vista desde Husband Hill','NASA/JPL-Caltech/Cornell','https://www.jpl.nasa.gov/images/pia17760-nasas-mars-rover-spirits-view-southward-from-husband-hill/'],
 opportunity:['Matijevic Hill · Opportunity','NASA/JPL-Caltech/Cornell/ASU','https://science.nasa.gov/resource/matijevic-hill-panorama-for-rovers-ninth-anniversary/'],
 viking1:['Chryse Planitia · Viking 1 en color','NASA/JPL','https://science.nasa.gov/photojournal/first-color-image-from-viking-lander-1/'],
 viking2:['Utopia Planitia · Viking 2','NASA/JPL','https://science.nasa.gov/photojournal/rocky-martian-plain/'],
 phoenix:['Ártico marciano · Phoenix','NASA/JPL-Caltech/University Arizona/Texas A&M','https://www.jpl.nasa.gov/images/pia11734-full-circle-color-panorama-of-phoenix-landing-site-on-northern-mars/'],
 insight:['Elysium Planitia · InSight','NASA/JPL-Caltech','https://www.jpl.nasa.gov/images/pia23140-insight-sol-14-panorama/'],
 'moon-orbit':['Copérnico · PIA00094 · archivo del programa Lunar Orbiter','NASA/JPL/USGS','https://science.nasa.gov/photojournal/limb-of-copernicus-impact-crater/'],
 'lo1-1102':['Tierra y limbo lunar · fotograma 1102 H de Lunar Orbiter I (23 ago 1966) · fondo ilustrativo, girado','NASA / LPI','https://www.nasa.gov/image-detail/first-view-of-earth-from-moon/'],
 'mars-south-polar-orbit':['Marte · región polar sur, objetivo previsto de DS2 (vista orbital ilustrativa, no es el sitio de llegada)','Generada a partir del mapa global de Marte de NASA 3D Resources (NASA)','https://github.com/nasa/NASA-3D-Resources/tree/master/Images%20and%20Textures/Mars'],
 'viking2-orbit':['Marte desde órbita · mosaico de los orbitadores Viking (PIA00407)','NASA/JPL/USGS','https://www.jpl.nasa.gov/images/pia00407-global-color-views-of-mars/'],
 'mars-orbit':['Marte · mosaico de Viking','NASA/JPL/USGS','https://www.jpl.nasa.gov/images/pia00407-global-color-views-of-mars/']
};
const mapping={eagle:'apollo11',surveyor:'apollo11',lrv15:'hadley',lrv16:'hadley',lrv17:'hadley',orbiter:'lo1-1102',mariner:'mars-orbit',ds2:'mars-south-polar-orbit',sojourner:'pathfinder',viking1:'viking1',viking2:'viking2',spirit:'spirit',opportunity:'opportunity',phoenix:'phoenix',insight:'insight'};
export function backgroundFor(mission, context){const id=(mission.id==='viking2'&&context==='orbital'?'viking2-orbit':mapping[mission.id])||(mission.world==='Luna'?'apollo11':'mars-orbit'),[title,credit,source]=records[id];return {id,title,credit,source,orbital:id.endsWith('-orbit')||id==='lo1-1102',asset:`assets/backgrounds/${id}.webp`,mobileAsset:`assets/backgrounds/${id}-mobile.webp`};}
export function createSceneBackground(wrapper) {
  const backdrop = document.createElement('div');
  backdrop.className = 'scene-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  const picture = document.createElement('picture');
  const mobile = document.createElement('source');
  const photo = document.createElement('img');
  mobile.media = '(max-width: 760px)';
  photo.alt = '';
  photo.decoding = 'async';
  picture.append(mobile, photo);
  backdrop.append(picture);
  wrapper.prepend(backdrop);
  let current;

  return {
    set(mission, context) {
      const record = backgroundFor(mission, context);
      if (record.id === current) return;
      current = record.id;
      wrapper.dataset.environment = record.orbital ? 'orbital' : 'surface';
      backdrop.classList.toggle('orbital', record.orbital);
      backdrop.classList.toggle('lo1-earthrise', record.id === 'lo1-1102');
      const revision = record.id === 'lo1-1102' ? '20261024a' : '20261004a';
      mobile.srcset = record.mobileAsset + '?v=' + revision;
      photo.src = record.asset + '?v=' + revision;
    }
  };
}
