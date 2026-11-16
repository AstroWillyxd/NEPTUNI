import {getMissionStory} from './mission-story.js?v=20261123v10';
import {missionPhoto} from './mission-photos.js?v=20261112ficha';

const poses = ['wave', 'think', 'explain', 'think'];

const replies = {
  orbiter: [
    '¡Mira esos objetivos! En 1966, Lunar Orbiter 1 salió a buscar sitios de alunizaje para el programa Apollo. Llevaba película de setenta milímetros.\n\nImagínate viajar hasta la Luna con un rollo fotográfico y tener que sacarle todo el provecho desde la órbita. Me da curiosidad cómo harías llegar las fotos a casa. ¿Seguimos el recorrido de la película?',
    'Aquí viene mi parte favorita. Después de exponer la película, la nave la revelaba con un proceso llamado Bimat. Luego la pasaba por un escáner y enviaba una señal a la Tierra.\n\nEra un laboratorio fotográfico entero en órbita. Abre el sistema fotográfico en Componentes e intenta distinguir el revelador del escáner.',
    'El 23 de agosto de 1966 la nave fotografió la Tierra desde la órbita lunar por primera vez. Desde allí, nuestro planeta aparecía sobre el horizonte lunar.\n\nMe encanta pensar que un instrumento diseñado para buscar dónde aterrizar también nos mostró nuestro hogar desde un lugar nuevo. Puedes abrir la fotografía desde las fuentes de esta fase.',
    'Su trabajo acabó con una orden desde la Tierra. El equipo dirigió la nave hacia la cara oculta para que su señal no interfiriera con la de los siguientes orbitadores.\n\nSi vuelves a la vista completa, fíjate en la cámara y la antena. Juntas hicieron posible que el archivo de fotografías sobreviviera a la nave.'
  ],
  surveyor: [
    '¡Vamos a visitar una sonda que recibió visitas! En 1967, Surveyor 3 aterrizó en Oceanus Procellarum.\n\nSu cámara dejó a los equipos de la Tierra observar el sitio y su pala les permitió probar cómo se comportaba el suelo. Imagina intentar decidir dónde poner el pie mirando esas primeras imágenes.',
    'Los instrumentos necesitaban energía para tomar medidas y transmitirlas. Sigue el camino desde el panel solar hasta la batería y los compartimentos electrónicos.\n\nY ahora mira el tren de aterrizaje. Las patas mantienen la plataforma estable, algo fundamental cuando la cámara y la pala tienen que trabajar juntas.',
    'Dos años después llegaron los astronautas de Apollo 12. Se acercaron a Surveyor 3, retiraron su cámara y trajeron algunas piezas a la Tierra.\n\nMe parece una buena manera de cerrar una investigación: primero estudias el suelo con una máquina y luego estudias qué le hizo ese mismo lugar a la máquina.'
  ],
  eagle: [
    'Te presento a Eagle. Mira la parte de abajo, donde están las patas y el motor de descenso. Ese motor podía regular su empuje para que Armstrong y Aldrin controlaran la llegada a la superficie.\n\nCuando ves toda la nave junta, cuesta imaginar que una parte iba a quedarse allí. Vamos a abrirla por etapas.',
    'En la cabina había que tomar decisiones mientras el computador guiaba la nave. El computador, los mandos y las comunicaciones eran piezas de la misma tarea: entender qué estaba pasando y actuar a tiempo.\n\nPrueba a buscar la aviónica y después la antena. ¿Qué información tendría que viajar entre ellas?',
    'Aquí está el truco para volver. La etapa de ascenso despegó con los astronautas y se reunió con Columbia en órbita lunar.\n\nEl tren de aterrizaje y la etapa de descenso quedaron en el Mar de la Tranquilidad. Ahora que conoces las dos etapas, intenta seguir la separación en el modelo.'
  ],
  lrv15: [
    '¡El primer paseo en auto por la Luna! El rover de Apollo 15 permitió recorrer más terreno en Hadley–Apennine. Mira sus ruedas. Están hechas de malla metálica y pensadas para moverse sobre regolito.\n\nSi abres Movilidad, encontrarás la rueda y sus elementos. ¿Qué cambiarías en el diseño de un carro para conducirlo con un traje espacial?',
    'Este vehículo eléctrico llevaba dos baterías de 36 voltios y un motor por rueda. Los astronautas dirigían el rover con un mando de conducción.\n\nMe gusta seguir la cadena de energía desde la batería hasta la rueda. Así es más fácil entender por qué cada cable, cada mando y cada motor tenía un trabajo propio.',
    'Al final de la misión el rover quedó en Hadley–Apennine. Las huellas de sus recorridos ayudan a imaginar la distancia entre las paradas de ciencia.\n\nVuelve a la foto del archivo y localiza la antena. Fue una de las maneras en que los equipos en la Tierra pudieron acompañar el recorrido.'
  ],
  lrv16: [
    'Esta vez conducimos por las tierras altas de Descartes. El vehículo de Apollo 16 ampliaba la distancia que podían cubrir los astronautas para recoger muestras.\n\nMira el rover junto al módulo Orion en la foto. Es una buena forma de ver cómo se repartía el trabajo entre la máquina que los llevó y la que los movía por el terreno.',
    'Imagina guiar el rover con guantes gruesos y con la atención puesta en las rocas del camino. El mando de conducción concentraba el control del vehículo, mientras las baterías alimentaban los motores.\n\nSi sigues la lista de componentes desde los asientos hasta las ruedas, puedes reconstruir esa cadena de decisiones y movimiento.',
    'Al terminar, el vehículo quedó estacionado en Descartes. Antes de salir, intenta encontrar la antena en la vista completa y pensar dónde debía apuntar para mantener el enlace con la Tierra.\n\nEl rover amplió tanto el recorrido de los astronautas como la posibilidad de seguir la misión desde casa.'
  ],
  lrv17: [
    '¿Ves ese rover? Fue el de la última misión tripulada del programa Apollo. En Taurus–Littrow los astronautas podían llevar herramientas y muestras entre paradas de ciencia.\n\nA mí me gusta mirar primero la malla de las ruedas. Explórala en el modelo y compara su forma con la de una llanta que verías en la Tierra.',
    'Al volante todo empezaba en un mando. Después venían los sistemas eléctricos, los motores y las ruedas. Sigue ese recorrido en Componentes.\n\nSi te fijas en el guardabarros trasero derecho, la reconstrucción también muestra cómo improvisaron una reparación con mapas laminados, cinta y abrazaderas. Una idea simple les permitió seguir trabajando.',
    'El último rover del programa Apollo quedó en Taurus–Littrow. En la fotografía se ve el vehículo estacionado sobre el regolito, con su antena desplegada.\n\nCuando vuelvas a la vista completa, busca dónde iba la antena y vuelve a mirar el guardabarros. Son dos detalles que guardan historias muy distintas de la misma salida.'
  ],
  mariner: [
    '¡Demos una vuelta alrededor de Marte! Mariner 9 fue la primera nave en orbitar otro planeta. Desde esa perspectiva sus cámaras documentaron volcanes, cañones y las lunas marcianas.\n\nMira dónde estaba el sistema de imagen en la nave. Ahora imagina tener que elegir hacia dónde apuntarlo cada vez que pasas sobre el planeta.',
    'Una cámara toma la imagen, pero hace falta toda una nave para que esa imagen llegue a nosotros. Los paneles solares aportaban energía y los sistemas de control coordinaban las observaciones.\n\nSigue la cadena de paneles a aviónica y de ahí a comunicaciones. Me encanta que una fotografía empiece en un objetivo y termine como una señal de radio.',
    'En octubre de 1972 terminó el enlace de Mariner 9. Su archivo sigue disponible para volver a mirar lo que vio desde órbita.\n\nPor aquí podemos seguir la historia de la nave y de sus imágenes. Su posición actual queda sin confirmar en la ficha.'
  ],
  viking1: [
    '¡Bienvenido a Chryse Planitia! Viking 1 mandó imágenes de la superficie de Marte con cámaras de barrido.\n\nFíjate en la cámara y piensa en cómo construía la foto línea a línea. Cada imagen ayudaba a conocer un paisaje que hasta entonces casi nadie podía imaginar a ras del suelo.',
    'El brazo recogía suelo y lo acercaba a los experimentos. Así, una máquina quieta podía investigar su entorno durante mucho tiempo. Uno de los grandes objetivos era buscar señales de vida.\n\nLos resultados abrieron preguntas que siguen formando parte de la historia de Marte. ¿Quieres seguir el viaje de una muestra desde la pala hasta el laboratorio?',
    'Los generadores termoeléctricos y el sistema eléctrico sostuvieron a Viking 1 durante más de seis años. La energía salía del calor producido por radioisótopos y llegaba a instrumentos, computadores y radio.\n\nBusca los RTG en Componentes y luego sigue hacia la aviónica. Es fácil olvidar cuánta ingeniería hace falta para mantener encendida una estación.',
    'La última comunicación llegó en noviembre de 1982. Una actualización afectó los datos que orientaban la antena hacia la Tierra.\n\nEsa parte de la historia siempre me hace volver a mirar la antena. Podías tener todo un laboratorio en Marte y depender de la orientación de una sola pieza para hablar con él.'
  ],
  viking2: [
    'La segunda parada de Viking fue Utopia Planitia. Sus cámaras abrieron otra ventana al paisaje de Marte.\n\nTener dos lugares desde donde observar permitía comparar el terreno, el clima y lo que recogía el brazo. Yo empezaría por la cámara. Después imagina qué medirías para entender en qué se parecían ambos sitios.',
    'Sigamos a un puñado de suelo. La pala del brazo recogía material y lo entregaba a los experimentos. Mientras tanto, los RTG alimentaban los sistemas de la estación.\n\nBusca primero el muestreador y después el laboratorio. Así podrás recorrer el mismo trayecto que hacía una muestra una vez recogida.',
    'Viking 2 dejó de transmitir en abril de 1980. Sus imágenes y medidas siguen disponibles, y nos dejan comparar lo que encontró con lo que han visto otras misiones.\n\nSi quieres seguir jugando a detective, vuelve al catálogo y pon la foto de Viking 1 al lado de esta ficha.'
  ],
  sojourner: [
    '¡Este explorador era pequeño y tenía seis ruedas! Sojourner llevó un instrumento APXS para estudiar la composición de rocas y suelo.\n\nEn la foto está junto a una roca llamada Yogi. Mira la posición del rover y piensa en lo cerca que tenía que llevar el instrumento para poder hacer una medición.',
    'El frío marciano me da ganas de ponerme otro traje. Sojourner protegía su electrónica y sus baterías en una caja que conservaba el calor.\n\nAbre la aviónica y busca las placas y el cableado. Ahí empieza el recorrido de las órdenes que llegaban a las ruedas y los instrumentos.',
    'Para hablar con la Tierra, el rover dependía del módulo Pathfinder. El último contacto con el módulo fue en septiembre de 1997.\n\nLa próxima vez que mires sus seis ruedas, acuérdate también de la antena. La movilidad permitió acercar el instrumento a las rocas y el enlace permitió compartir lo que descubría.'
  ],
  ds2: [
    'Scott y Amundsen eran dos microsondas con un plan atrevido. Debían penetrar el suelo marciano para probar nuevas tecnologías y buscar información bajo la superficie.\n\nMira primero su cápsula de vuelo. Dentro estaba el penetrador, con un pequeño taladro previsto para recoger una muestra. ¿Puedes imaginar cuánto tenían que meter en tan poco espacio?',
    'La idea era que una parte quedara enterrada y otra sobre el terreno. Un cable uniría las dos. La radio iría en la parte que debía quedar sobre el terreno.\n\nAbre el cuerpo posterior y luego el penetrador. A mí me gusta seguir el cable para entender qué dependía de cada mitad.',
    'Las dos sondas debían llegar en diciembre de 1999. El equipo esperó una señal que nunca llegó. La causa de la pérdida y el lugar exacto siguen sin confirmarse.\n\nEl archivo de hardware nos deja reconstruir el plan de la misión y distinguir qué estaba diseñado de lo que llegamos a observar.'
  ],
  spirit: [
    '¡Busca una roca que te dé curiosidad! Eso hacían Spirit y su equipo en el cráter Gusev. La cámara panorámica ayudaba a escoger dónde mirar y el brazo acercaba instrumentos a la superficie.\n\nEn Componentes puedes saltar de Pancam al brazo. Así pasas del paisaje entero a la roca que tienes delante.',
    'Moverse también era una parte del experimento. Cada rueda tenía que transmitir fuerza a un suelo irregular mientras la suspensión ayudaba a mantener el contacto.\n\nAbre el sistema de movilidad y busca el motor. La próxima vez que veas una huella marciana, piensa en toda la cadena de piezas que la dejó allí.',
    'Spirit quedó atrapado en suelo blando y afrontó un invierno con poca energía. Su último mensaje llegó en marzo de 2010.\n\nVuelve a mirar los paneles en la foto de las pruebas en Tierra. De esas superficies dependía el rover para mantenerse activo y seguir comunicándose.'
  ],
  opportunity: [
    'Opportunity buscaba pistas del agua antigua. Sus cámaras ayudaban a elegir qué rocas mirar de cerca, y el brazo permitía estudiarlas con los instrumentos.\n\nYo empezaría por Pancam y después iría al brazo. Así puedes imaginar cómo una observación panorámica acababa en una medición en el suelo de Marte.',
    'El equipo había planificado 90 soles de misión inicial. Opportunity siguió explorando durante más de catorce años.\n\nHabía toda una cadena detrás de cada desplazamiento: paneles, baterías, electrónica y ruedas. En la foto de las pruebas en Tierra, fíjate en cómo la suspensión conecta el cuerpo del rover con las ruedas.',
    'En 2018 una tormenta global redujo la luz que llegaba a los paneles. El 10 de junio fue la última comunicación.\n\nPiensa en lo distinto que se veía cuando el viento limpiaba parte del polvo de los paneles. La energía del rover dependía de las condiciones del planeta que exploraba.'
  ],
  phoenix: [
    '¡Abrígate, que vamos al norte de Marte! Phoenix usó su brazo para excavar el suelo del ártico marciano y estudiar el hielo cercano a la superficie.\n\nLa pala llevaba material a instrumentos como TEGA y MECA. Sigue ese recorrido en el menú de componentes. Parece el trabajo de un laboratorio entero en una plataforma.',
    'Mira la foto de Phoenix con los dos paneles abiertos durante una prueba en Tierra. Cada instrumento tenía que caber en un espacio pequeño y recibir electricidad y datos.\n\nBusca el brazo, el analizador y la electrónica en el modelo. Cuando los veas por separado, vuelve al conjunto para imaginar cómo trabajaban en equipo.',
    'Al terminar el verano marciano, el frío aumentó y los paneles recibían menos luz. El último contacto llegó en noviembre de 2008.\n\nSi vuelves al modelo, fíjate en cuánto espacio ocupan los paneles y cuánto ocupa el laboratorio. Las dos superficies tenían que funcionar juntas para que cada muestra llegara a estudiarse.'
  ],
  insight: [
    '¡Acércate y escucha! InSight buscaba vibraciones que revelaran cómo es Marte por dentro. Su sismómetro SEIS ayudó a estudiar la corteza, el manto y el núcleo.\n\nMe gusta imaginarlo como alguien con el oído pegado al suelo. Abre SEIS en Componentes para ver qué protegía sus sensores.',
    'El brazo colocó el sismómetro en el suelo y un cable lo conectó al módulo. Sigue esa ruta. Primero la vibración, después el sensor, luego el cable y finalmente la electrónica.\n\nParece un recorrido corto. Sin embargo, fue el principio de un viaje de datos que terminó en los equipos científicos en la Tierra.',
    'Con el tiempo el polvo cubrió los paneles y redujo la energía. La última comunicación llegó en diciembre de 2022.\n\nEn la foto de las pruebas en Tierra, compara el tamaño de los paneles con el resto de la plataforma. Una máquina diseñada para oír el interior de Marte dependía de una superficie que miraba al cielo.'
  ]
};

const orbiterReport = ['NASA NTRS · Informe fotográfico de Lunar Orbiter I', 'https://ntrs.nasa.gov/citations/19670012120'];
const surveyorReport = ['JPL · Informe de la misión Surveyor III', 'https://ntrs.nasa.gov/citations/19670028267'];
const apollo11Report = ['NASA · Informe de vuelo de Apollo 11', 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf'];
const apollo15Report = ['NASA · Informe de la misión Apollo 15', 'https://ntrs.nasa.gov/citations/19720021182'];
const apollo16Report = ['NASA · Informe de la misión Apollo 16', 'https://ntrs.nasa.gov/citations/19720026127'];
const rover = ['NASA NSSDCA · Diseño del Lunar Roving Vehicle', 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html'];
const apollo17History = ['NASA · Apollo 17 en Taurus–Littrow', 'https://www.nasa.gov/history/50-years-ago-apollo-17-lands-at-taurus-littrow/'];
const vikingScience = ['NASA · Instrumentos y experimentos Viking', 'https://science.nasa.gov/mission/viking/spacecraft-and-science/'];
const vikingReference = ['NASA RP-1027 · Sistemas del módulo Viking', 'https://ntrs.nasa.gov/citations/19810001592'];
const pathfinder = ['NASA PDS · Descripción técnica de Sojourner', 'https://planetarydata.jpl.nasa.gov/img/data/mpfr-m-rvrcam-2-edr-v1.0/mprv_0001/document/insthost.htm'];
const ds2PressKit = ['JPL · Dossier técnico de Deep Space 2', 'https://www.jpl.nasa.gov/news/press_kits/mplds2hq.pdf'];
const merEngineering = ['JPL Robotics · Diseño de Spirit y Opportunity', 'https://robotics.jpl.nasa.gov/what-we-do/flight-projects/mars-exploration-rovers/'];
const merPower = ['NASA NTRS · Energía y último contacto de los rovers MER', 'https://ntrs.nasa.gov/citations/20230007029'];
const phoenixPressKit = ['NASA/JPL · Instrumentos y operaciones de Phoenix', 'https://www.jpl.nasa.gov/news/press_kits/phoenix-landing.pdf'];
const seisPaper = ['Lognonné et al. · Instrumento SEIS', 'https://doi.org/10.1007/s11214-018-0574-6'];
const opportunitySelfie = ['NASA · Autorretrato de Opportunity, PIA18079', 'https://science.nasa.gov/photojournal/self-portrait-by-freshly-cleaned-opportunity-mars-rover-in-march-2014/'];

const phaseSources = {
  orbiter: [
    [orbiterReport],
    [orbiterReport],
    [['NASA · Primera foto de la Tierra desde la órbita lunar', 'https://www.nasa.gov/image-article/lunar-orbiter-gives-first-view-of-earth-from-moon/']],
    [orbiterReport]
  ],
  surveyor: [
    [surveyorReport],
    [surveyorReport],
    [['NASA · Visita de Apollo 12 a Surveyor III', 'https://www.nasa.gov/mission/apollo-12/']]
  ],
  eagle: [
    [apollo11Report],
    [apollo11Report, ['NASA · Navegación durante el alunizaje', 'https://www.nasa.gov/centers-and-facilities/johnson/one-giant-leap-for-lunar-landing-navigation/']],
    [apollo11Report]
  ],
  lrv15: [[rover, apollo15Report], [rover], [apollo15Report]],
  lrv16: [[apollo16Report], [rover, apollo16Report], [apollo16Report]],
  lrv17: [
    [apollo17History, rover],
    [rover, ['NASA · Informe sobre la reparación del guardabarros', 'https://ntrs.nasa.gov/citations/19730015117']],
    [apollo17History]
  ],
  mariner: [
    [['JPL · Cartografía y observaciones de Mariner 9', 'https://www.jpl.nasa.gov/missions/mariner-9-mariner-i/']],
    [],
    [['JPL · Última transmisión y archivo de Mariner 9', 'https://www.jpl.nasa.gov/images/slice-of-history-50-years-of-mariner-9-in-orbit/']]
  ],
  viking1: [[vikingScience, vikingReference], [vikingScience], [vikingReference], []],
  viking2: [
    [vikingScience],
    [vikingScience, vikingReference],
    [['NASA · Resumen del programa Viking', 'https://science.nasa.gov/mission/viking/']]
  ],
  sojourner: [
    [['NASA/JPL · Sojourner y su espectrómetro APXS en Yogi', 'https://science.nasa.gov/resource/sojourner-yogi/']],
    [pathfinder],
    [pathfinder, ['NASA/JPL · Última transmisión de Pathfinder', 'https://science.nasa.gov/resource/sojourner-yogi/']]
  ],
  ds2: [[ds2PressKit], [ds2PressKit], [['JPL · Cronología de Deep Space 2', 'https://www.jpl.nasa.gov/missions/mars-polar-lander-deep-space-2/']]],
  spirit: [[merEngineering], [merEngineering], [merPower]],
  opportunity: [
    [merEngineering],
    [merPower],
    [merPower, opportunitySelfie]
  ],
  phoenix: [
    [phoenixPressKit, ['NASA/JPL · Resultados de Phoenix', 'https://www.jpl.nasa.gov/missions/phoenix/']],
    [phoenixPressKit],
    [phoenixPressKit]
  ],
  insight: [
    [seisPaper, ['NASA/JPL · Resultados sobre el interior de Marte', 'https://www.jpl.nasa.gov/news/nasas-insight-reveals-the-deep-interior-of-mars/']],
    [seisPaper, ['NASA/JPL · Despliegue de SEIS', 'https://www.jpl.nasa.gov/images/pia22956-seis-deployed-on-mars/']],
    [['NASA/JPL · Último contacto de InSight', 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/']]
  ]
};

export function dialogueFor(mission) {
  const story = getMissionStory(mission);
  const photo = missionPhoto(mission);
  return story.chapters.map((chapter, index) => ({
    id: `${mission.id}-${String(index + 1).padStart(2, '0')}`,
    pose: poses[index],
    title: chapter.title,
    text: replies[mission.id][index],
    sources: [
      ...phaseSources[mission.id][index],
      ...(/\bfoto\b|\bfotograf[ií]a\b/i.test(replies[mission.id][index]) ? [[photo.credit, photo.source]] : []),
      ['NASA · Ficha de la misión', mission.source]
    ]
      .filter((entry, i, list) => list.findIndex(other => other[1] === entry[1]) === i)
  }));
}
