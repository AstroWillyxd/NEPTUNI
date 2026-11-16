/** Archive photographs of flight hardware, crews, or observations made by the mission. */
const photos = {
  orbiter: {
    src: 'assets/archive/orbiter-restored.webp',
    alt: 'La Tierra sobre el horizonte de la Luna en una fotografía tomada por Lunar Orbiter 1',
    credit: 'NASA Ames / LOIRP · Tierra desde órbita lunar, restauración de 2008',
    source: 'https://science.nasa.gov/resource/first-lunar-earthrise-old-and-new/'
  },
  surveyor: {
    alt: 'Astronauta de Apollo 12 junto al tren de aterrizaje de Surveyor 3',
    credit: 'NASA · Apollo 12, AS12-48-7134'
  },
  eagle: {
    alt: 'El módulo lunar Eagle sobre el terreno del Mar de la Tranquilidad',
    credit: 'NASA · Apollo 11, AS11-40-5927'
  },
  lrv15: {
    alt: 'El vehículo lunar de Apollo 15 estacionado sobre el regolito',
    credit: 'NASA · Apollo 15, AS15-88-11901'
  },
  mariner: {
    src: 'assets/archive/mariner.webp',
    alt: 'Mariner 9 durante los preparativos para su prueba de vacío térmico',
    credit: 'NASA/JPL-Caltech · Preparación de la prueba de vacío térmico',
    agency: 'NASA/JPL',
    source: 'https://www.jpl.nasa.gov/images/slice-of-history-50-years-of-mariner-9-in-orbit/'
  },
  lrv16: {
    src: 'assets/archive/lrv16.webp',
    alt: 'El rover de Apollo 16 en la superficie lunar junto al módulo Orion',
    credit: 'NASA · Apollo 16',
    source: 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/img/apollo16-missions.jpg'
  },
  lrv17: {
    src: 'assets/archive/lrv17.webp',
    alt: 'El rover de Apollo 17 con su antena desplegada sobre el suelo de Taurus–Littrow',
    credit: 'NASA · Apollo 17, AS17-146-22367',
    source: 'https://images.nasa.gov/details/as17-146-22367'
  },
  viking1: {
    alt: 'Equipo de Viking 1 sostenido por una plataforma durante la integración en Tierra',
    credit: 'NASA/KSC · 75P-160'
  },
  viking2: {
    alt: 'Hardware de Viking 2 en las instalaciones de integración',
    credit: 'NASA/KSC · 75P-110'
  },
  sojourner: {
    src: 'assets/archive/sojourner.webp',
    alt: 'Sojourner y sus seis ruedas al lado de la roca Yogi en Marte',
    credit: 'NASA/JPL · PIA00766',
    agency: 'NASA/JPL',
    source: 'https://science.nasa.gov/resource/sojourner-yogi/'
  },
  ds2: {
    src: 'assets/evidence/ds2/flight-microprobe.webp',
    alt: 'Microsonda de vuelo de Deep Space 2 fotografiada en el laboratorio',
    credit: 'NASA/JPL · Microsonda de vuelo',
    agency: 'NASA/JPL',
    source: 'https://www.jpl.nasa.gov/nmp/ds2/pictures/flight/microprobe.html'
  },
  spirit: {
    src: 'assets/archive/spirit.webp',
    alt: 'Spirit y Opportunity durante las pruebas de los rovers en High Bay 1 antes de su lanzamiento',
    credit: 'NASA/JPL-Caltech · Pruebas de Spirit y Opportunity, PIA23244',
    agency: 'NASA/JPL',
    context: 'Pruebas en Tierra',
    source: 'https://science.nasa.gov/photojournal/spirit-and-opportunity-in-high-bay-1/'
  },
  opportunity: {
    src: 'assets/archive/opportunity.webp',
    alt: 'Opportunity con sus ruedas y su mástil desplegados durante las pruebas de movilidad en el Centro Espacial Kennedy',
    credit: 'NASA · Pruebas de movilidad de Opportunity, 21 de marzo de 2003',
    context: 'Pruebas en Tierra',
    source: 'https://www.nasa.gov/missions/mer/nasa-celebrates-decade-of-mars-exploration-by-spirit-opportunity/'
  },
  phoenix: {
    src: 'assets/archive/phoenix.webp',
    alt: 'Módulo Phoenix con los dos paneles solares circulares desplegados durante una prueba en Tierra',
    credit: 'NASA/JPL/University of Arizona/Lockheed Martin · Pruebas de Phoenix, PIA09701',
    agency: 'NASA/JPL',
    context: 'Pruebas en Tierra',
    source: 'https://www.jpl.nasa.gov/images/pia09701-both-solar-arrays-open-on-phoenix-mars-lander/'
  },
  insight: {
    src: 'assets/archive/insight.webp',
    alt: 'InSight con ambos paneles solares abiertos durante las pruebas previas al lanzamiento en Tierra',
    credit: 'NASA/JPL-Caltech/Lockheed Martin Space · Pruebas de InSight, PIA22739',
    agency: 'NASA/JPL',
    context: 'Pruebas en Tierra',
    source: 'https://science.nasa.gov/photojournal/pre-launch-testing-of-insights-solar-arrays/'
  }
};

export function missionPhoto(mission) {
  return {src: mission.image, source: mission.imageSource, ...photos[mission.id]};
}
