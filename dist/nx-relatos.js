import {tr} from './nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
// NEPTUNI · Relatos de las 15 misiones (v10). Una sola colección por ID real de misión.
// La usa nx-ficha.js para:
//   · «Leer la historia» (lectura continua de La misión): título y párrafos, con la foto o el botón
//     del visor a la altura del texto que lo explica;
//   · los pasos guiados de La misión (un paso por párrafo) en las fichas sin recorrido piloto;
//   · Los hallazgos (títulos concretos y un párrafo que une observación y significado);
//   · el cierre: qué quedó en el lugar, qué regresó a la Tierra y qué se conserva en el archivo.
// Cada escena declara su pieza (`key`, validada contra el catálogo del modelo; undefined = la cámara
// no se mueve) y el globo de Neptunito (`say`), que dirige la atención o invita a actuar.
// `evidence.kind` distingue una foto en la Luna o en Marte, una foto de pruebas en Tierra, hardware
// en el laboratorio o una ilustración. El visor 3D siempre es una reconstrucción.

const ev = (src, alt, kind, caption, credit, source) => ({src, alt, kind, caption, credit, source});
const KIND = {luna: 'Foto en la Luna', marte: 'Foto en Marte', orbita: 'Foto desde la órbita lunar', tierra: 'Foto de pruebas en Tierra', lab: 'Hardware de vuelo en el laboratorio'};

export const relatos = {
  orbiter: {
    title: 'La Tierra sobre el horizonte lunar',
    note: 'El visor muestra una reconstrucción 3D de la nave durante su misión.',
    paragraphs: [
      {step: 'Una cámara con película', key: 'camera', say: 'Fíjate en la cámara. Usaba película de verdad, que se revelaba a bordo.',
        text: 'En 1966, Lunar Orbiter 1 fotografió zonas de la Luna donde podrían alunizar las misiones Apollo. Su cámara usaba película, que la nave revelaba y enviaba a la Tierra por radio. Con esas fotos, los equipos buscaron terrenos lisos y seguros antes de que llegaran los astronautas.'},
      {step: 'La Tierra en el horizonte', key: 'camera', say: 'Abre la foto restaurada. Así se veía la Tierra desde la Luna en 1966.',
        text: 'La cámara también captó la Tierra sobre el horizonte lunar. Después de cumplir su trabajo, la nave fue dirigida hacia la superficie y se estrelló el 29 de octubre de 1966. Décadas más tarde, un equipo recuperó la imagen a partir de las grabaciones originales y eliminó gran parte de las líneas que se veían en la primera versión.',
        evidence: ev('assets/archive/orbiter-restored.webp', 'La Tierra sobre el horizonte de la Luna en una fotografía tomada por Lunar Orbiter 1', KIND.orbita,
          'La Tierra sobre el horizonte lunar, en la versión restaurada en 2008.', 'NASA Ames / LOIRP · Tierra desde órbita lunar', 'https://science.nasa.gov/resource/first-lunar-earthrise-old-and-new/')}
    ],
    legado: {lugar: 'La nave se estrelló contra la Luna el 29 de octubre de 1966. Este archivo no identifica sus restos.', tierra: 'Ninguna pieza. Las fotos llegaron por radio.', archivo: 'Las imágenes originales y su restauración de 2008.'},
    sources: [['Misión · NASA', 'https://science.nasa.gov/mission/lunar-orbiter-1/'], ['Imagen original y restaurada · NASA', 'https://science.nasa.gov/resource/first-lunar-earthrise-old-and-new/']],
    findings: [
      {title: 'Lugares seguros para alunizar', key: 'camera', text: 'Fotografió los nueve sitios previstos para los alunizajes Apollo y otros 11 lugares de la cara oculta. Junto con las otras Lunar Orbiter, ayudó a elegir dónde alunizarían las misiones Apollo.'},
      {title: 'La Tierra vista desde la Luna', key: 'camera', star: true, text: 'El 23 de agosto de 1966 tomó la primera foto de la Tierra desde las cercanías de la Luna. No estaba en el plan principal. Los ingenieros giraron la nave para tomarla.'},
      {title: 'Fotos recuperadas décadas después', key: 'camera', text: 'Expuso 205 fotogramas que cubrieron unos 5 millones de km². En 2008, un proyecto recuperó las cintas originales y restauró las fotos con mucha más calidad.'}
    ]
  },

  surveyor: {
    title: 'La sonda que los astronautas volvieron a visitar',
    paragraphs: [
      {step: 'Una pala para probar el suelo', key: 'sampler', say: 'Fíjate en la pala. Cavaba zanjas y apretaba el suelo.',
        text: 'En 1969, dos astronautas de Apollo 12 caminaron hasta Surveyor 3, que llevaba más de dos años en un cráter lunar. Su pala había cavado zanjas y presionado el suelo para medir su resistencia. Así los ingenieros supieron si el terreno aguantaría el peso de una nave.'},
      {step: 'Piezas de regreso a la Tierra', key: 'camera', say: 'Busca la cámara en el modelo. Los astronautas la desmontaron y se la llevaron.',
        text: 'Los astronautas desmontaron la cámara y la pala y las trajeron a la Tierra. Los investigadores pudieron estudiar cómo había cambiado el equipo durante su estancia en la Luna. El resto de la sonda quedó en el cráter.',
        evidence: ev('assets/surveyor.jpg', 'Astronauta de Apollo 12 junto a Surveyor 3, con el módulo lunar al fondo', KIND.luna,
          'Un astronauta de Apollo 12 junto a Surveyor 3. Al fondo se ve su módulo lunar.', 'NASA · Apollo 12, AS12-48-7134', 'https://www.nasa.gov/image-article/astronauts-pay-visit-surveyor-3/')}
    ],
    legado: {lugar: 'La mayor parte de la sonda, en su cráter de Oceanus Procellarum.', tierra: 'La cámara, la pala y otras piezas que recuperó Apollo 12 en 1969.', archivo: 'Sus imágenes de televisión y los estudios de las piezas recuperadas.'},
    sources: [['Foto y piezas recuperadas · NASA', 'https://apod.nasa.gov/apod/ap990408.html'], ['Pruebas del suelo · NASA', 'https://www.nasa.gov/image-article/astronauts-pay-visit-surveyor-3/']],
    findings: [
      {title: 'Miles de imágenes del terreno', key: 'camera', text: 'Envió 6326 imágenes de televisión de la superficie lunar, que ayudaron a los ingenieros de Apollo a conocer el terreno. Incluso fotografió un eclipse, con la Tierra tapando al Sol.'},
      {title: 'Un suelo firme como arena húmeda', key: 'sampler', star: true, text: 'Su pala cavó cuatro zanjas y mostró que el suelo lunar se comportaba como arena húmeda. Así se confirmó que una nave con astronautas podía alunizar sin hundirse.'},
      {title: 'Piezas que volvieron a casa', key: 'camera', text: 'En 1969, los astronautas de Apollo 12 recuperaron su cámara y su pala para estudiar cómo las afectó estar en la Luna. Se creyó que unas bacterias de la Tierra habían sobrevivido en la cámara. Hoy se piensa que se contaminó al volver.'}
    ]
  },

  eagle: {
    title: 'La parte de Eagle que quedó en la Luna',
    paragraphs: [
      {step: 'El motor del descenso', key: 'descent', say: 'Fíjate en la parte dorada de abajo. Su motor frenó el descenso.',
        text: 'El 20 de julio de 1969, el motor situado entre las cuatro patas de Eagle frenó el descenso de Neil Armstrong y Buzz Aldrin hacia el Mar de la Tranquilidad. Esa parte del módulo sirvió después como plataforma de despegue y quedó en la superficie.',
        evidence: ev('assets/eagle.jpg', 'El módulo lunar Eagle completo sobre el terreno del Mar de la Tranquilidad', KIND.luna,
          'Eagle completo en la Luna, antes del despegue. Después, solo la etapa de descenso quedó en el lugar.', 'NASA · Apollo 11, AS11-40-5927', 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf')},
      {step: 'El regreso a Columbia', key: 'ascent', say: 'Esta cabina despegó con su propio motor. Toca «Equipo de superficie» para ver lo que se quedó.',
        actions: [{label: 'Cabina de ascenso', focus: 'ascent'}, {label: 'Equipo de superficie', focus: 'surface'}],
        text: 'La cabina superior despegó con su propio motor y se acopló en órbita lunar a Columbia, donde esperaba Michael Collins. Los tres astronautas volvieron a la Tierra en Columbia con las muestras lunares. En el lugar del alunizaje quedó un reflector que sirve para medir la distancia entre la Tierra y la Luna.'}
    ],
    legado: {lugar: 'La etapa de descenso y el equipo de superficie, entre ellos el reflector láser. La cabina de Eagle se separó en órbita lunar y este archivo no confirma su destino final.', tierra: 'Los tres astronautas, en Columbia, con unos 22 kg de muestras lunares.', archivo: 'Las muestras, que todavía se estudian, y las fotos y películas de la misión.'},
    sources: [['Informe de misión · NASA', 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf'], ['Reflectores lunares · NASA', 'https://ilrs.gsfc.nasa.gov/missions/satellite_missions/current_missions/ap11_general.html']],
    findings: [
      {title: 'Muestras para el laboratorio', key: 'ascent', star: true, text: 'Trajeron a la Tierra unos 22 kg de rocas y polvo lunar. Las muestras se repartieron entre científicos de muchos países y todavía se estudian.'},
      {title: 'La edad de la Luna', key: undefined, text: 'Las muestras ayudaron a saber que la Luna tiene unos 4500 millones de años y que se parece químicamente a la Tierra. Ese parecido apoya la idea de que se formó tras un gran choque contra la Tierra joven.'},
      {title: 'Un reflector que sigue funcionando', key: 'surface', text: 'Desde la Tierra se dispara un láser al reflector que dejaron y se mide cuánto tarda la luz en volver. Gracias a él sabemos que la Luna se aleja unos 3,8 cm por año.'}
    ]
  },

  lrv15: {
    title: 'El primer viaje en auto por la Luna',
    paragraphs: [
      {step: 'Ruedas de malla', key: 'wheels', say: 'Fíjate en las ruedas de malla. No se inflaban ni se pinchaban.',
        text: 'En 1971, David Scott y James Irwin desplegaron el primer vehículo que unos astronautas condujeron por la Luna. Sus ruedas de malla y sus motores eléctricos les permitieron atravesar el terreno de Hadley, alejarse del módulo lunar y llevar herramientas para recoger muestras en varios lugares.',
        evidence: ev('assets/lrv15.jpg', 'El vehículo lunar de Apollo 15 estacionado sobre el regolito', KIND.luna,
          'El LRV-1 estacionado en Hadley durante Apollo 15.', 'NASA · Apollo 15, AS15-88-11901', 'https://science.nasa.gov/solar-system/moon/genesis-rock/')},
      {step: 'La Roca Génesis', key: 'payload', say: 'Mira la parte de atrás. Ahí iban las herramientas y las bolsas para las muestras.',
        text: 'En una parada encontraron la Roca Génesis, un fragmento claro de la antigua corteza lunar que dio pistas sobre los primeros tiempos de la Luna. La roca viajó a la Tierra para estudiarla en el laboratorio. El rover quedó en Hadley.'}
    ],
    legado: {lugar: 'El rover, en Hadley.', tierra: 'Las muestras, entre ellas la Roca Génesis.', archivo: 'Fotos, filmaciones y el catálogo de muestras de la misión.'},
    sources: [['Roca Génesis y recorrido · NASA', 'https://science.nasa.gov/solar-system/moon/genesis-rock/']],
    findings: [
      {title: 'El primer auto en la Luna', key: 'wheels', star: true, text: 'Fue el primer vehículo que unos astronautas condujeron en la Luna. Recorrieron 27,8 km, visitaron más lugares que a pie y trajeron unos 77 kg de muestras.'},
      {title: 'Un trozo de la primera corteza', key: 'payload', text: 'Encontraron la Roca Génesis, un trozo de anortosita de más de 4000 millones de años. Apoyó la idea de que la Luna joven estuvo cubierta por un océano de roca fundida.'}
    ]
  },

  mariner: {
    title: 'Lo que apareció cuando bajó el polvo',
    paragraphs: [
      {step: 'Marte bajo el polvo', key: 'camera', say: 'Fíjate en la plataforma de cámaras. Con ellas vieron asomar Olympus Mons.',
        text: 'Cuando Mariner 9 llegó a Marte en 1971, una tormenta de polvo cubría casi toda la superficie. Mientras esperaba, sus cámaras fotografiaron las lunas Fobos y Deimos. Entre el polvo solo asomaban unas pocas cumbres, como la del volcán Olympus Mons.',
        evidence: ev('assets/archive/mariner.webp', 'Mariner 9 durante los preparativos para su prueba de vacío térmico', KIND.tierra,
          'Mariner 9 en la Tierra, antes de una prueba de vacío térmico. No es una foto de Marte.', 'NASA/JPL-Caltech · Preparación de la prueba de vacío térmico', 'https://www.jpl.nasa.gov/images/slice-of-history-50-years-of-mariner-9-in-orbit/')},
      {step: 'Volcanes, cañones y cauces', key: 'camera', say: 'Gira el modelo hasta ver las cámaras desde abajo. Sus fotos guiaron a las Viking.',
        links: [['Fotos de Marte tomadas por Mariner 9 · NASA', 'https://www.nasa.gov/history/50-years-ago-mariner-9-enters-mars-orbit/']],
        text: 'Cuando bajó el polvo, las fotos mostraron enormes volcanes, cañones y cauces que sugerían que alguna vez corrió agua. Mariner 9 cartografió cerca del 85 % de la superficie y ayudó a elegir dónde aterrizarían las Viking. Dejó de operar en 1972 y su destino final en órbita sigue abierto.'}
    ],
    legado: {lugar: 'La nave quedó en órbita de Marte. Las predicciones sobre su salida de órbita dejan abierto su destino final.', tierra: 'Ninguna pieza. Sus imágenes llegaron por radio.', archivo: 'Las fotos con las que cartografió cerca del 85 % de la superficie.'},
    sources: [['Historia y fotografías · NASA', 'https://www.nasa.gov/history/50-years-ago-mariner-9-enters-mars-orbit/'], ['Destino previsto · JPL', 'https://www.jpl.nasa.gov/images/slice-of-history-50-years-of-mariner-9-in-orbit/']],
    findings: [
      {title: 'El primer mapa de Marte', key: 'camera', text: 'Tomó 7329 fotos y cubrió cerca del 85 % de la superficie. Fue el primer mapa global de Marte y ayudó a elegir dónde aterrizarían las Viking.'},
      {title: 'Un cañón del tamaño de un continente', key: 'camera', star: true, text: 'Descubrió un enorme sistema de cañones que recibió el nombre de Valles Marineris en su honor. Mide más de 4000 km de largo.'},
      {title: 'Volcanes sobre la tormenta', key: 'camera', text: 'Durante la tormenta de polvo solo se veían cuatro manchas oscuras. Eran volcanes gigantes, y Olympus Mons es el más grande conocido del sistema solar.'},
      {title: 'Lunas de cerca y cauces secos', key: 'camera', text: 'Fotografió de cerca las lunas Fobos y Deimos. También vio cauces que sugieren que alguna vez corrió agua, así que Marte no siempre fue un desierto seco.'}
    ]
  },

  lrv16: {
    title: 'Las rocas de Descartes cambiaron la explicación',
    paragraphs: [
      {step: 'Rumbo a las tierras altas', key: 'wheels', say: 'Fíjate en las ruedas. Con ellas llegaron a puntos muy distintos de Descartes.',
        text: 'Antes de Apollo 16, las imágenes de las tierras altas de Descartes hacían pensar que parte del paisaje había sido moldeado por volcanes. En 1972, John Young y Charles Duke usaron su rover para recorrer la zona y recoger muestras en distintos puntos.',
        evidence: ev('assets/archive/lrv16.webp', 'El rover de Apollo 16 en la superficie lunar junto al módulo Orion', KIND.luna,
          'El LRV-2 en Descartes, junto al módulo lunar Orion.', 'NASA · Apollo 16', 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/img/apollo16-missions.jpg')},
      {step: 'Rocas hechas de impactos', key: undefined, say: 'Gira el modelo mientras lees. Las rocas que trajo este rover cambiaron la explicación.',
        links: [['Catálogo de muestras de Apollo 16 · NASA', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a16/A16SampleCat_1.pdf']],
        text: 'Muchas de las rocas que encontraron estaban hechas de fragmentos de otras rocas que se unieron tras grandes impactos. Las muestras permitieron revisar lo que se había interpretado a partir de las fotos. El vehículo quedó en Descartes y las muestras llegaron a la Tierra para que otros equipos pudieran estudiar ese terreno.'}
    ],
    legado: {lugar: 'El rover, en Descartes.', tierra: 'Las muestras de las tierras altas.', archivo: 'Fotos y el catálogo de muestras de la misión.'},
    sources: [['Catálogo de muestras · NASA', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a16/A16SampleCat_1.pdf']],
    findings: [
      {title: 'Más lugares en menos tiempo', key: 'wheels', text: 'Con el rover, los astronautas recorrieron 26,7 km por las tierras altas. Visitaron cráteres como North Ray y las laderas de la montaña Stone, y trajeron rocas de zonas muy distintas.'},
      {title: 'Impactos, no volcanes', key: undefined, star: true, text: 'Desde lejos, las tierras altas parecían formadas por volcanes. Casi todo resultaron ser rocas rotas y unidas por impactos. Fue una lección para no confiar solo en lo que se ve de lejos.'}
    ]
  },

  lrv17: {
    title: 'Un guardabarros hecho con mapas',
    paragraphs: [
      {step: 'Mapas como guardabarros', key: 'wheels', say: 'Fíjate en la rueda trasera derecha. Encima iban los mapas.',
        actions: [{label: 'Ruedas', focus: 'wheels'}, {label: 'Ver demostraciones del LRV-3', demo: true}],
        text: 'Durante Apollo 17, el rover perdió parte del guardabarros trasero derecho y la rueda lanzaba polvo sobre el equipo. Los astronautas sujetaron varios mapas sobre la rueda con abrazaderas. Esos mapas hicieron de guardabarros durante el resto del recorrido.',
        evidence: ev('assets/archive/lrv17.webp', 'El rover de Apollo 17 con su antena desplegada sobre el suelo de Taurus–Littrow', KIND.luna,
          'El LRV-3 en el valle de Taurus–Littrow.', 'NASA · Apollo 17, AS17-146-22367', 'https://images.nasa.gov/details/as17-146-22367')},
      {step: 'Vidrio naranja en Shorty', key: undefined, say: 'Gira el rover. Con él llegaron hasta el cráter Shorty.',
        links: [['Reparación del guardabarros · Informe de Apollo 17', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_MissionReport.pdf'], ['Muestra de suelo naranja · NASA', 'https://ares.jsc.nasa.gov/interaction/lmdp/diskdetails.cfm?class=Orange+Soil&disk=80']],
        text: 'Con el rover, la tripulación visitó lugares de interés en el valle de Taurus–Littrow. Cerca del cráter Shorty recogió unos granos anaranjados que resultaron ser vidrio de antiguas erupciones lunares. Al terminar el trabajo, el vehículo quedó estacionado en el valle.'}
    ],
    legado: {lugar: 'El rover, estacionado en el valle de Taurus–Littrow.', tierra: 'Las muestras, entre ellas el suelo naranja de Shorty.', archivo: 'El informe de la misión, fotos, filmaciones y el catálogo de muestras.'},
    sources: [['Reparación e imagen · Informe Apollo 17', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_MissionReport.pdf'], ['Muestra naranja · NASA', 'https://ares.jsc.nasa.gov/interaction/lmdp/diskdetails.cfm?class=Orange+Soil&disk=80']],
    findings: [
      {title: 'El recorrido más largo de Apollo', key: 'wheels', text: 'Gracias al rover, los astronautas recorrieron 35,9 km en tres salidas y llegaron a 7,6 km del módulo lunar. Fue la mayor distancia recorrida en las misiones Apollo.'},
      {title: 'Vidrio naranja junto al cráter Shorty', key: undefined, star: true, text: 'Harrison Schmitt, que era geólogo, notó el color naranja del suelo junto al cráter Shorty. Eran gotitas de vidrio de antiguas fuentes de lava, de hace más de 3500 millones de años. Mostraron que la Luna tuvo erupciones explosivas.'}
    ]
  },

  viking1: {
    title: 'Una pata en Marte y una pregunta por la vida',
    paragraphs: [
      {step: 'Una pata en la foto', key: 'camera', say: 'Fíjate en las cámaras cilíndricas. Una de ellas fotografió la pata.',
        links: [['La primera fotografía desde Marte · NASA', 'https://science.nasa.gov/mission/viking/viking-50-years-on-mars/']],
        text: 'Poco después de llegar a Chryse Planitia en 1976, Viking 1 tomó una fotografía en la que se veía una de sus propias patas. Los científicos pudieron observar las piedras, el polvo y el terreno alrededor de la estación. Durante los años siguientes, el módulo envió imágenes y mediciones del clima.',
        evidence: ev('assets/viking1.jpg', 'Equipo de Viking 1 sostenido por una plataforma durante la integración en Tierra', KIND.tierra,
          'Equipo de Viking 1 durante su integración en la Tierra, antes del lanzamiento. No es una foto de Marte.', 'NASA/KSC · 75P-160', 'https://science.nasa.gov/mission/viking/')},
      {step: 'La pregunta por la vida', key: 'biology', say: 'El brazo llevaba suelo a este laboratorio. Toca «Brazo de muestreo» para verlo.',
        actions: [{label: 'Brazo de muestreo', focus: 'sampler'}, {label: 'Laboratorio biológico', focus: 'biology'}],
        links: [['Resultados biológicos · NASA', 'https://www.nasa.gov/history/45-years-ago-viking-1-touches-down-on-mars/']],
        text: 'Su brazo recogía suelo y lo llevaba a instrumentos que buscaban señales de actividad biológica. Los resultados dieron lugar a interpretaciones distintas y la presencia de vida quedó sin confirmar. El módulo de superficie quedó en Chryse Planitia y sus imágenes y mediciones se conservaron en la Tierra.'}
    ],
    legado: {lugar: 'El módulo de superficie, en Chryse Planitia.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Sus imágenes y sus mediciones del clima y del suelo.'},
    sources: [['Primera fotografía y contexto · NASA', 'https://science.nasa.gov/mission/viking/viking-50-years-on-mars/'], ['Resultados biológicos · NASA', 'https://www.nasa.gov/history/45-years-ago-viking-1-touches-down-on-mars/']],
    findings: [
      {title: 'Las primeras fotos en color desde el suelo', key: 'camera', star: true, text: 'Envió la primera foto en color de la superficie de Marte. Mostró un paisaje rojizo lleno de rocas y un cielo ocre por el polvo.'},
      {title: 'Una respuesta sin confirmar', key: 'biology', text: 'Un experimento dio al suelo nutrientes con carbono marcado para ver si algo los consumía. Hubo una señal positiva, pero otro instrumento no halló moléculas orgánicas y la presencia de vida quedó sin confirmar. Estudios posteriores sugieren que el suelo pudo contener materia orgánica que no se detectó.'},
      {title: 'Seis años en lugar de tres meses', key: 'rtg', text: 'Sus generadores nucleares daban energía de día y de noche. Funcionó hasta noviembre de 1982, más de seis años, y su récord en la superficie duró hasta 2010.'}
    ]
  },

  viking2: {
    title: 'Escarcha entre las rocas de Utopia Planitia',
    paragraphs: [
      {step: 'Escarcha entre las rocas', key: 'lander', say: 'Fíjate en el módulo de superficie. Sus cámaras fotografiaron la escarcha.',
        text: 'Viking 2 aterrizó más al norte que Viking 1 para comparar el suelo y el clima de dos regiones de Marte. En invierno, su cámara mostró manchas de escarcha entre las rocas de Utopia Planitia. Las fotos y las temperaturas ayudaron a entender cómo se formaban.',
        evidence: ev('assets/evidence/viking2/pia00573-vl2-frost.webp', 'Escarcha blanca entre las rocas del sitio de Viking 2 en Utopia Planitia', KIND.marte,
          'Escarcha en el sitio de Viking 2, fotografiada por el módulo de superficie.', 'NASA/JPL · PIA00573', 'https://www.jpl.nasa.gov/images/pia00573-frost-at-the-viking-lander-2-site/')},
      {step: 'Dos vehículos, un equipo', key: 'orbiter', say: 'Este es el orbitador. Toca «Módulo de superficie» para volver al que tomó las fotos.',
        actions: [{label: 'Orbitador', focus: 'orbiter'}, {label: 'Módulo de superficie', focus: 'lander'}],
        text: 'La misión tenía dos vehículos. El módulo de superficie fotografió la escarcha y estudió el suelo, mientras el orbitador observaba Marte desde arriba y retransmitía datos. El módulo quedó en Utopia Planitia al terminar sus operaciones.'}
    ],
    legado: {lugar: 'El módulo de superficie, en Utopia Planitia. Este archivo no incluye la posición actual del orbitador.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Las fotos de la escarcha y las mediciones del clima.'},
    sources: [['Foto de la escarcha · JPL', 'https://www.jpl.nasa.gov/images/pia00573-frost-at-the-viking-lander-2-site/'], ['Proyecto Viking · NASA', 'https://science.nasa.gov/mission/viking/']],
    findings: [
      {title: 'Escarcha en Utopia Planitia', key: 'lander', star: true, text: 'En invierno, la cámara fotografió una capa finísima de escarcha sobre el suelo. Medir el clima en dos lugares tan lejanos ayudó a entender el clima de todo el planeta.'},
      {title: 'Un suelo que confundió a los experimentos', key: 'lander', text: 'Los experimentos de biología buscaban microbios que consumieran nutrientes o soltaran gases. Los resultados confusos mostraron que el suelo marciano es químicamente muy reactivo, y la presencia de vida quedó sin confirmar.'},
      {title: 'Energía para años', key: 'lander', text: 'Sus generadores nucleares no dependían de la luz del Sol. Gracias a ellos, el módulo funcionó unos tres años y medio en lugar de tres meses.'}
    ]
  },

  sojourner: {
    title: 'De la roca Yogi a la Tierra',
    paragraphs: [
      {step: 'Un rover en Ares Vallis', key: undefined, say: 'Gira a Sojourner. Llegó plegado dentro del módulo Pathfinder.',
        text: 'En 1997, el módulo Pathfinder llevó a Marte un pequeño robot de seis ruedas llamado Sojourner. Una vez en Ares Vallis, el módulo abrió sus pétalos y el rover bajó por una rampa. Así pudo demostrar que un vehículo enviado desde la Tierra podía moverse por Marte y estudiar su terreno.'},
      {step: 'La roca Yogi', key: 'apxs', say: 'Fíjate en la parte trasera. Ahí va el APXS que apoyó sobre Yogi.',
        actions: [{label: 'APXS', focus: 'apxs'}, {label: 'Antena', focus: 'antenna'}],
        text: 'Sojourner llevaba atrás un instrumento llamado APXS y lo apoyó sobre la roca Yogi para saber de qué estaba hecha. Las primeras mediciones indicaron que Yogi se parecía a ciertas rocas volcánicas de la Tierra. El módulo Pathfinder fotografió al rover y hacía de puente para enviar sus datos a la Tierra.',
        evidence: ev('assets/archive/sojourner.webp', 'Sojourner, con sus seis ruedas, junto a la roca Yogi en Ares Vallis', KIND.marte,
          'Sojourner con el APXS apoyado sobre Yogi, fotografiado por el módulo Pathfinder entre los soles 8 y 10.', 'NASA/JPL · «Sojourner & Yogi», PIA00766', 'https://www.jpl.nasa.gov/images/pia00766-sojourner-yogi/')},
      {step: 'Último contacto y cierre oficial', key: 'antenna', say: 'Por esta antena salían los datos hacia el módulo. Desde allí viajaban a la Tierra.',
        actions: [{label: 'Antena', focus: 'antenna'}, {label: 'Envía tus propias órdenes a Marte', href: 'juego/index.html', primary: true}],
        links: [['Datos del APXS en el archivo de NASA (PDS)', 'https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MPFR-M-APXS-2-EDR-V1.0']],
        text: 'Pathfinder envió su última transmisión de datos en septiembre de 1997 y la misión se dio por terminada en marzo de 1998. El módulo y el rover quedaron en Ares Vallis. Sus datos se conservan en el archivo de la NASA.'}
    ],
    legado: {lugar: 'El módulo Pathfinder y Sojourner, en Ares Vallis.', tierra: 'Ninguna pieza. Los datos llegaron por radio a través del módulo.', archivo: 'Las imágenes y las mediciones del APXS, en el archivo planetario de NASA (PDS).'},
    sources: [['Foto de Yogi y fin de la misión · JPL', 'https://www.jpl.nasa.gov/images/pia00766-sojourner-yogi/'], ['Archivo APXS · NASA PDS', 'https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MPFR-M-APXS-2-EDR-V1.0']]
  },

  ds2: {
    title: 'La señal que nunca llegó',
    note: 'El visor muestra una reconstrucción 3D. Nadie vio las sondas después de su llegada prevista.',
    paragraphs: [
      {step: 'Sondas para mirar bajo el suelo', key: 'forebody', say: 'Fíjate en el penetrador. Debía clavarse en el suelo marciano.',
        actions: [{label: 'Penetrador', focus: 'forebody'}, {label: 'Cable', focus: 'tether'}, {label: 'Cuerpo posterior', focus: 'aftbody'}],
        text: 'Scott y Amundsen eran dos sondas pequeñas diseñadas para alcanzar un lugar al que una cámara de superficie no puede mirar. Debían clavarse en el suelo cerca del polo sur de Marte y buscar agua en el material enterrado. Tras el impacto, un cable habría conectado la pieza enterrada con la parte que llevaba la batería y la antena sobre el suelo.',
        evidence: ev('assets/evidence/ds2/flight-microprobe.webp', 'Microsonda de vuelo de Deep Space 2 fotografiada en el laboratorio', KIND.lab,
          'Una microsonda de vuelo en el laboratorio, antes del lanzamiento.', 'NASA/JPL · Microsonda de vuelo', 'https://www.jpl.nasa.gov/nmp/ds2/pictures/flight/microprobe.html')},
      {step: 'La señal que nunca llegó', key: 'aftbody', say: 'Desde esta parte debía salir la señal. Nunca llegó.',
        text: 'Las dos sondas viajaron con Mars Polar Lander, pero cuando llegó el momento de recibir su señal, nada llegó. Sin datos, no se pudo confirmar si el diseño funcionó en Marte. Su ubicación exacta y la causa de la pérdida siguen sin confirmarse.'}
    ],
    legado: {lugar: 'Las dos sondas, en algún punto cerca del polo sur de Marte. Su ubicación exacta no se conoce.', tierra: 'Ninguna pieza y ningún dato desde Marte.', archivo: 'Los documentos del diseño, las fotos del hardware de vuelo y el informe sobre la pérdida.'},
    sources: [['Deep Space 2 e informe de pérdida · NASA', 'https://science.nasa.gov/mission/mars-polar-lander-deep-space-2/']],
    findings: [
      {title: 'La señal que nunca llegó', key: 'aftbody', text: 'Después de la llegada prevista, el 3 de diciembre de 1999, no se recibió ninguna señal de Scott ni de Amundsen. Las sondas solo podían transmitir después de clavarse en el suelo, así que no quedaron datos de la caída. Por eso hoy las misiones intentan enviar información durante el descenso.'},
      {title: 'Una pérdida sin testigos', key: 'aeroshell', text: 'Nadie las vio caer y no había cámaras en la zona. Todavía no se conocen la causa de la pérdida ni el lugar exacto donde cayeron.'},
      {title: 'Tecnología para el futuro', key: 'forebody', text: 'Eran parte del programa New Millennium, que probaba tecnologías nuevas, como sondas pequeñas que se clavan en el suelo para buscar agua. Las ideas de miniaturizar instrumentos y resistir golpes fuertes siguieron usándose en otros proyectos.'}
    ]
  },

  spirit: {
    title: 'La rueda que destapó una pista de agua',
    paragraphs: [
      {step: 'Una rueda que dejó de girar', key: 'wheels', say: 'Fíjate en la rueda delantera derecha. Al arrastrarse, abrió una zanja.',
        links: [['La huella de la rueda de Spirit, PIA11758 · NASA', 'https://science.nasa.gov/photojournal/rovers-wheel-churns-up-bright-martian-soil/']],
        text: 'Una rueda delantera de Spirit dejó de girar y, al arrastrarse, abrió una pequeña zanja. La huella dejó al descubierto un suelo claro muy rico en sílice. El rover estudió ese material y fotografió la marca de su rueda.'},
      {step: 'Pistas de agua', key: 'arm', say: 'Con los instrumentos de este brazo estudió el suelo claro.',
        text: 'La sílice pudo concentrarse en aguas termales o con vapor volcánico, y ambos casos apuntan a que hubo agua en esa zona de Marte. Años después, Spirit quedó atrapado en terreno blando. El rover sigue allí y sus mediciones se conservan en la Tierra.'}
    ],
    legado: {lugar: 'El rover, atrapado en terreno blando en el cráter Gusev.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Sus fotos y mediciones, entre ellas las del suelo rico en sílice.'},
    sources: [['La huella de Spirit · NASA', 'https://science.nasa.gov/photojournal/rovers-wheel-churns-up-bright-martian-soil/'], ['Misión · NASA', 'https://science.nasa.gov/mission/mer-spirit/']],
    findings: [
      {title: 'La huella de una rueda atascada', key: 'wheels', star: true, say: 'Fíjate en la rueda delantera derecha. Ella abrió la zanja.', text: 'Una rueda delantera se trabó y, al arrastrarla, removió el suelo. Debajo apareció un material claro casi de sílice pura, que en la Tierra se forma en aguas termales o con vapor volcánico.'},
      {title: 'Rocas con carbonato', key: 'minites', text: 'En las rocas llamadas Comanche encontró mucho carbonato. Eso indica que el agua del Marte antiguo no siempre fue ácida.'},
      {title: 'Lugares con agua tibia', key: 'arm', text: 'Juntando la sílice y los carbonatos, los científicos reconstruyeron lugares con agua tibia en el pasado de Marte. Son ambientes que en la Tierra albergan microbios. Eso no prueba que hubiera vida en Marte.'},
      {title: 'Mucho más lejos de lo previsto', key: 'wheels', text: 'El plan era recorrer unos 600 metros en 90 soles y recorrió 7,73 km. En 2009 quedó atrapado en arena blanda y siguió trabajando como estación fija hasta 2010.'}
    ]
  },

  opportunity: {
    title: 'La tormenta que interrumpió el viaje',
    paragraphs: [
      {step: 'Capas y esferas de hematita', key: 'arm', say: 'Fíjate en el brazo. Con sus instrumentos estudió las rocas de cerca.',
        actions: [{label: 'Brazo', focus: 'arm'}, {label: 'Cámaras', focus: 'pancam'}],
        text: 'Opportunity aterrizó en Meridiani Planum para estudiar minerales relacionados con el agua. En las rocas encontró capas y pequeñas esferas ricas en hematita. Junto con otros minerales medidos por el rover, esas observaciones ayudaron a reconstruir una época en la que el agua líquida pasó por aquel terreno.'},
      {step: 'La tormenta', key: 'solar', say: 'Fíjate en los paneles. La tormenta les quitó la luz.',
        links: [['La última imagen de Opportunity, incompleta · NASA', 'https://science.nasa.gov/resource/opportunitys-last-message/']],
        text: 'Recorrió más de 45 km y trabajó más de 14 años. En junio de 2018, una tormenta oscureció el cielo, sus paneles quedaron con poca luz y una de sus últimas imágenes llegó incompleta. Opportunity quedó en el valle Perseverance y la NASA cerró la misión en 2019, tras intentar recuperar el contacto.'}
    ],
    legado: {lugar: 'El rover, en el valle Perseverance.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Sus fotos y mediciones, incluida la imagen incompleta de junio de 2018.'},
    sources: [['Misión · NASA', 'https://science.nasa.gov/mission/mer-opportunity/'], ['Imagen incompleta · NASA', 'https://science.nasa.gov/resource/opportunitys-last-message/']],
    findings: [
      {title: 'Esferas de hematita', key: 'arm', text: 'En su sitio de aterrizaje encontró pequeñas esferas de hematita, apodadas «arándanos». Ese mineral suele formarse con agua, y por eso el rover aterrizó justo allí.'},
      {title: 'Capas que estuvieron empapadas', key: 'pancam', star: true, text: 'Las rocas del cráter Eagle tenían capas finas y jarosita, un mineral que se forma en agua. En 2004, NASA anunció que ese lugar estuvo empapado hace mucho tiempo.'},
      {title: 'Un récord de distancia', key: 'wheels', text: 'Recorrió más de 45 km para llegar a rocas más antiguas, como las del borde del cráter Endeavour. En 2014 superó a Lunojod 2 y se convirtió en el vehículo que más había recorrido fuera de la Tierra.'},
      {title: 'Paneles que el viento limpiaba', key: 'solar', text: 'Se esperaba que el polvo cubriera sus paneles en pocos meses, pero el viento los limpiaba de vez en cuando. Diseñado para 90 días marcianos, trabajó más de 14 años.'}
    ]
  },

  phoenix: {
    title: 'El hielo que Phoenix encontró bajo el polvo',
    paragraphs: [
      {step: 'Una zanja en el norte de Marte', key: 'arm', say: 'Fíjate en el brazo. Abrió la zanja donde aparecieron los fragmentos claros.',
        links: [['La zanja antes y después, PIA10911 · JPL', 'https://www.jpl.nasa.gov/images/pia10911-ice-on-mars-now-its-gone/']],
        text: 'Desde la órbita, Mars Odyssey había visto indicios de hielo en el norte de Marte, y Phoenix aterrizó allí en 2008 para comprobarlo. Su brazo abrió una zanja y dejó al descubierto unos fragmentos claros. Cuatro días después, la cámara volvió a mirar y los fragmentos habían desaparecido.',
        evidence: ev('assets/evidence/phoenix/PIA10964.webp', 'La pala del brazo de Phoenix, invertida, fotografiada en Marte', KIND.marte,
          'La pala del brazo de Phoenix, vista en Marte. Con ella abrió las zanjas.', 'NASA/JPL-Caltech/University of Arizona/Texas A&M · PIA10964', 'https://www.jpl.nasa.gov/images/pia10964-phoenix-scoop-inverted-showing-rasp/')},
      {step: 'El hielo se sublimó', key: 'tega', say: 'Aquí, en los hornos de TEGA, calentaron el suelo.',
        text: 'El hielo había pasado directamente de sólido a vapor. Phoenix también calentó una muestra de suelo en uno de sus pequeños hornos y detectó vapor de agua. Así, la misión confirmó desde la superficie una pista que se había identificado desde la órbita.'},
      {step: 'El invierno', key: 'solar', say: 'Fíjate en los paneles. En invierno recibían muy poca luz.',
        text: 'Al acercarse el invierno marciano, los paneles recibieron menos luz y Phoenix dejó de transmitir. El módulo quedó en el norte de Marte. Las fotografías permiten comparar lo que vio su cámara antes y después de que desapareciera el hielo.'}
    ],
    legado: {lugar: 'El módulo de aterrizaje, en las llanuras del norte de Marte.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Las fotos de la zanja antes y después, y los datos de sus hornos y de su laboratorio.'},
    sources: [['Comparación de la zanja · JPL', 'https://www.jpl.nasa.gov/images/pia10911-ice-on-mars-now-its-gone/'], ['Misión y resultados · NASA', 'https://science.nasa.gov/mission/mars-phoenix/']],
    findings: [
      {title: 'Hielo que desapareció de la zanja', key: 'arm', star: true, text: 'Unos trozos claros que el brazo dejó al descubierto en una zanja desaparecieron en pocos días. El hielo se había sublimado, es decir, pasó de sólido a vapor. Luego el horno TEGA detectó vapor de agua y confirmó la pista que Mars Odyssey había visto desde la órbita.'},
      {title: 'Una sal inesperada', key: 'meca', text: 'El laboratorio MECA mezcló suelo con agua y encontró perclorato, un compuesto químico que fue la gran sorpresa de la misión. Su presencia cambió la forma de interpretar los resultados de las Viking.'},
      {title: 'Un suelo que pudo mojarse', key: 'tega', text: 'Al calentar el suelo en el horno apareció carbonato de calcio. En la Tierra se forma con agua líquida, así que el suelo marciano pudo humedecerse de vez en cuando.'},
      {title: 'Nieve desde las nubes', key: 'met', text: 'El LIDAR, un láser que apuntaba al cielo, detectó nieve cayendo desde las nubes marcianas. Se evaporaba antes de tocar el suelo.'}
    ]
  },

  insight: {
    title: 'Un instrumento para escuchar el interior de Marte',
    paragraphs: [
      {step: 'Un sismómetro sobre el suelo', key: 'seis', say: 'Fíjate en la cúpula de SEIS. Toca «Brazo» para ver cómo la colocaron.',
        actions: [{label: 'SEIS', focus: 'seis'}, {label: 'Brazo', focus: 'arm'}],
        text: 'El brazo de InSight colocó un sismómetro sobre el suelo de Marte. El instrumento, llamado SEIS, registraba vibraciones producidas por sismos e impactos. Al estudiar cómo cambiaban las ondas mientras atravesaban el planeta, los científicos pudieron estimar cómo eran sus capas internas.'},
      {step: 'Cuando faltó la luz', key: 'solar', say: 'Fíjate en los paneles redondos. El polvo los fue cubriendo.',
        text: 'El polvo se acumuló sobre los paneles solares y la energía disponible disminuyó. InSight envió su última comunicación en diciembre de 2022 y quedó en Elysium Planitia. Los registros de SEIS quedaron disponibles para que otros equipos siguieran estudiando el interior marciano.',
        evidence: ev('assets/archive/insight.webp', 'InSight con ambos paneles solares abiertos durante las pruebas previas al lanzamiento en Tierra', KIND.tierra,
          'InSight con los paneles abiertos durante una prueba en la Tierra, antes del lanzamiento.', 'NASA/JPL-Caltech/Lockheed Martin Space · PIA22739', 'https://science.nasa.gov/photojournal/pre-launch-testing-of-insights-solar-arrays/')}
    ],
    legado: {lugar: 'El módulo de aterrizaje y su sismómetro SEIS, en Elysium Planitia.', tierra: 'Ninguna pieza. Sus datos llegaron por radio.', archivo: 'Los registros de SEIS, disponibles para que otros equipos sigan estudiando el interior de Marte.'},
    sources: [['Cierre y resultados de InSight · JPL', 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/'], ['Revisión del modelo interior · Nature', 'https://pubmed.ncbi.nlm.nih.gov/37880437/']],
    findings: [
      {title: 'Marte todavía tiembla', key: 'seis', star: true, text: 'SEIS registró 1319 martemotos, incluidos algunos causados por choques de meteoroides. El mayor, en mayo de 2022, fue de magnitud 4,7. Así se comprobó que Marte sigue activo por dentro.'},
      {title: 'Una radiografía del interior', key: 'seis', text: 'Las ondas de los sismos cambian según el material que atraviesan, y con ellas se estimó cómo son la corteza, el manto y el núcleo de Marte. Una estimación inicial dio al núcleo unos 1830 km de radio. Ese tamaño depende del modelo usado y estudios posteriores lo revisaron.'},
      {title: 'Impactos que dejaron ver hielo', key: 'seis', text: 'SEIS también registró impactos de meteoroides, y contar cráteres nuevos ayuda a calcular la edad de la superficie. Uno de los más grandes, en 2021, dejó al descubierto bloques de hielo más cerca del ecuador de lo que se había visto antes.'}
    ]
  }
};
tr(relatos);
