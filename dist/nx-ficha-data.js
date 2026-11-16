import {tr} from './nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
// NEPTUNI · Contenido de los cuatro apartados de cada ficha.
// «¿Cuál fue su misión?» usa los textos que ya tenía el sitio (missions.js, mission-facts.js, mission-story.js).
// Aquí van: qué se ve en el modelo, descubrimientos verificados con su fuente y sistemas explicados.
// `key` enlaza cada sistema con su pieza del visor (botón «Ver en el modelo 3D»).

const S = {
  insight: ['NASA/JPL · Fin de la misión InSight', 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science'],
  phoenix: ['NASA/JPL · Resultados de Phoenix', 'https://www.jpl.nasa.gov/news/nasa-phoenix-results-point-to-martian-climate-cycles/'],
  opportunity: ['NASA/JPL · Fin de la misión Opportunity', 'https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/'],
  spirit: ['NASA/JPL · Spirit completa su misión', 'https://jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars'],
  pathfinder: ['NASA NTRS · Resumen de Mars Pathfinder', 'https://ntrs.nasa.gov/citations/20000012707'],
  apod: ['NASA · Barnacle Bill y Sojourner', 'https://science.nasa.gov/image-article/apod-1997-july-08-barnacle-bill-and-sojourner/'],
  viking: ['Space.com · El legado de Viking', 'https://www.space.com/33482-viking-mars-landing-science-legacy.html'],
  mariner: ['Space.com · Mariner 9', 'https://www.space.com/18439-mariner-9.html'],
  lrv: ['NASA NSSDC · El vehículo lunar Apollo', 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html'],
  sp350: ['NASA SP-350 · Apollo Expeditions to the Moon', 'https://www.nasa.gov/wp-content/uploads/static/history/SP-350/ch-14-4.html'],
  apollo11: ['Space.com · Lo que aprendimos con Apollo 11', 'https://www.space.com/apollo-11-moon-landing-science-legacy.html'],
  surveyor: ['NASA · Surveyor 3', 'https://science.nasa.gov/mission/surveyor-3/'],
  orbiter: ['NASA · Lunar Orbiter 1', 'https://www.nasa.gov/mission/lunar-orbiter-1'],
  ds2: ['NASA · Mars Polar Lander / Deep Space 2', 'https://science.nasa.gov/mission/mars-polar-lander-deep-space-2/'],
  ds2kit: ['NASA/JPL · Kit de prensa de Deep Space 2', 'https://www.jpl.nasa.gov/news/press_kits/mplds2hq.pdf']
};

const sys = (key, name, text) => ({key, name, text});

const LRV_SYSTEMS = [
  sys('wheels', 'Ruedas de malla y motores', 'Cada una de las cuatro ruedas era de malla de acero y tenía su propio motor eléctrico. La malla no se inflaba ni se pinchaba, y agarraba bien el polvo lunar.'),
  sys('seats', 'Asientos, mando y baterías', 'Los astronautas manejaban con un mando en forma de T, sin volante. Dos baterías de 36 V, que no se recargaban, daban energía a los motores.'),
  sys('antenna', 'Antena y radio', 'La antena de malla en forma de paraguas enviaba voz y televisión a la Tierra, aunque los astronautas estuvieran lejos del módulo lunar.'),
  sys('camera', 'Cámara de televisión', 'Desde Houston podían girarla y acercarla a distancia, así que el público en la Tierra veía en vivo lo que hacían los astronautas.'),
  sys('chassis', 'Chasis plegable', 'El rover viajó a la Luna doblado en tres partes, como un mueble plegable, guardado en un lado del módulo lunar. Allí se desplegaba.')
];

const MER_SYSTEMS = [
  sys('chassis', 'Cuerpo y caja caliente (WEB)', 'Es la «caja» central del rover. Por dentro tiene aislamiento térmico para que la electrónica no se congele en las noches marcianas, muchísimo más frías que cualquier invierno de la Tierra.'),
  sys('wheels', 'Seis ruedas rocker-bogie', 'Una suspensión de palancas, sin muelles, que deja subir piedras y mantiene las seis ruedas tocando el suelo.'),
  sys('solar', 'Paneles solares', 'Las «alas» llenas de células solares recargaban las baterías cada día. Cuando el polvo las cubría, el rover tenía menos energía.'),
  sys('pancam', 'Mástil con cámaras', 'Las cámaras van a 1,54 m de altura, más o menos a la altura de los ojos de una persona: Pancam toma fotos científicas y Navcam ayuda a planear la ruta.'),
  sys('arm', 'Brazo con instrumentos', 'En la punta lleva un microscopio, dos espectrómetros que miden de qué están hechas las rocas y una herramienta que raspa su superficie (RAT).'),
  sys('minites', 'Mini-TES', 'Un espectrómetro que mide el calor que emiten las rocas para saber de qué minerales están hechas, incluso a distancia.'),
  sys('antenna', 'Antenas', 'Una antena orientable hablaba directo con la Tierra; otra enviaba datos a los orbitadores de Marte, que los reenviaban.'),
  sys('hazcams', 'Cámaras de peligro', 'Cámaras con lente «ojo de pez» delante y atrás para ver rocas o pozos cerca de las ruedas antes de moverse.')
];

const VIKING_LANDER = [
  sys('camera', 'Cámaras de barrido', 'No tomaban una foto de golpe: giraban y armaban la imagen línea por línea. Así llegaron las primeras fotos en color desde la superficie de Marte.'),
  sys('sampler', 'Brazo de muestreo', 'Un brazo extensible que recogía suelo marciano y lo llevaba a los laboratorios de la nave.'),
  sys('biology', 'Laboratorio biológico', 'Tres experimentos buscaban señales de vida microscópica en el suelo. NASA consideró los resultados no concluyentes.'),
  sys('chemistry', 'GCMS y rayos X', 'Calentaban muestras de suelo para buscar moléculas orgánicas y medir de qué elementos estaba hecho.'),
  sys('meteorology', 'Estación meteorológica', 'Sensores en una pértiga medían viento, temperatura y presión: fue el primer servicio del clima en Marte.'),
  sys('rtg', 'Generadores SNAP-19', 'En lugar de paneles solares, usaba el calor de material radiactivo para producir electricidad día y noche. Por eso duró años.'),
  sys('antenna', 'Antenas y radio', 'Enviaban los datos a la Tierra o al orbitador Viking, que los reenviaba.'),
  sys('legs', 'Tren de aterrizaje', 'Tres patas con amortiguadores absorbieron el golpe del aterrizaje y dejaron la estación estable.')
];

export const fichaData = {
  insight: {
    see: 'Ves el módulo InSight sobre la superficie de Marte, con sus dos paneles solares redondos abiertos. Los instrumentos todavía están sobre la plataforma, como antes de que el brazo los bajara al suelo.',
    look: ['Los dos paneles solares redondos, que se abren como abanicos', 'La cúpula de SEIS, el sismómetro', 'El brazo robótico con su pinza', 'HP³, la sonda que debía enterrarse para medir el calor'],
    findings: ['El sismómetro SEIS detectó 1319 martemotos, incluidos algunos causados por choques de meteoroides.', 'Con esas vibraciones, los científicos pudieron estudiar por primera vez la corteza, el manto y el núcleo de Marte.', 'Los impactos de meteoroides ayudan a calcular la edad de la superficie. Uno de los más grandes dejó al descubierto bloques de hielo.'],
    sources: [S.insight],
    systems: [
      sys('seis', 'SEIS · sismómetro', 'Siente vibraciones diminutas del suelo. Lo bajaron al suelo y lo cubrieron con un escudo para protegerlo del viento y del frío.'),
      sys('hp3', 'HP³ · sonda de calor', 'Una «taladradora a martillazos» que debía enterrarse varios metros para medir el calor del interior. El suelo resultó muy difícil y no logró hundirse lo suficiente.'),
      sys('arm', 'Brazo robótico', 'Movió los instrumentos de la plataforma al suelo. En la punta tiene una cámara y una pinza.'),
      sys('solar', 'Paneles solares', 'Los dos paneles circulares daban energía. El polvo los fue tapando poco a poco hasta que la misión se quedó sin energía en 2022.'),
      sys('sensors', 'Cámaras y estación del clima', 'Medían viento, temperatura y presión para no confundir el ruido del viento con un sismo.'),
      sys('antenna', 'Antenas RISE y radio', 'Las señales de RISE permitían medir cómo se tambalea Marte al girar, una pista sobre su núcleo.')
    ]
  },
  phoenix: {
    see: 'Ves el módulo Phoenix en las llanuras del norte de Marte, con su brazo robótico estirado y sus dos paneles solares abiertos. Es una reconstrucción hecha con documentación y fotografías de NASA.',
    look: ['El brazo robótico y la pala con la que excavaba', 'El horno TEGA, donde calentaba muestras', 'El mástil meteorológico con su láser hacia el cielo', 'Las tres patas de aterrizaje'],
    findings: ['Confirmó que hay hielo de agua bajo el suelo del ártico marciano.', 'Encontró perclorato en el suelo, un compuesto químico que fue la gran sorpresa de la misión.', 'Halló carbonato de calcio, una pista de que el hielo a veces se derrite lo suficiente para humedecer el suelo.', 'Su láser vio nieve cayendo desde las nubes marcianas.'],
    sources: [S.phoenix],
    systems: [
      sys('arm', 'Brazo, pala y raspador', 'Excavaba zanjas, raspaba el hielo duro y llevaba las muestras a los instrumentos.'),
      sys('tega', 'Horno TEGA', 'Ocho hornos pequeños calentaban las muestras. Al ver qué gases salían, sabían si había agua u otros compuestos.'),
      sys('meca', 'Laboratorio MECA', 'Mezclaba suelo con agua para estudiar su química y tenía microscopios para ver granos diminutos.'),
      sys('ssi', 'Cámara estéreo SSI', 'Dos «ojos» que tomaban fotos en 3D del terreno y del trabajo del brazo.'),
      sys('met', 'Meteorología y LIDAR', 'Medía temperatura y presión, y disparaba un láser hacia arriba para estudiar nubes y polvo.'),
      sys('solar', 'Paneles solares', 'Daban energía, pero el invierno del norte dejó poca luz y la nave dejó de funcionar.'),
      sys('propulsion', 'Motores de descenso', 'Doce motores frenaron la nave para aterrizar con suavidad, guiados por un radar.')
    ]
  },
  opportunity: {
    see: 'Ves a Opportunity, un rover de seis ruedas, con su mástil de cámaras levantado y los paneles solares abiertos. Es del diseño MER, el mismo que su gemelo Spirit.',
    look: ['El mástil con las cámaras en la parte de arriba', 'El brazo plegado bajo la parte delantera', 'Las seis ruedas y la suspensión de palancas', 'Las alas de paneles solares'],
    findings: ['Encontró hematita en su sitio de aterrizaje, un mineral que se forma en agua.', 'Aportó una prueba definitiva de que hubo agua líquida en el Marte antiguo.', 'Recorrió más de 45 km, un récord de distancia fuera de la Tierra.', 'Estaba diseñado para 90 días marcianos y trabajó más de 14 años.'],
    sources: [S.opportunity],
    systems: MER_SYSTEMS
  },
  spirit: {
    see: 'Ves a Spirit como al inicio de su misión en 2004: sobre sus seis ruedas, con paneles y mástil desplegados y el brazo guardado.',
    look: ['El mástil con dos cámaras científicas arriba', 'El brazo con instrumentos en la punta', 'Las seis ruedas', 'Los paneles solares'],
    findings: ['Removió con sus ruedas un suelo brillante que era casi sílice pura, una pista de antiguas aguas termales o vapor.', 'Encontró rocas con mucho carbonato, señal de un pasado húmedo y no ácido.', 'Ese ambiente antiguo pudo haber sido favorable para la vida microscópica.', 'Recorrió 7,73 km, más de 12 veces la distancia que se esperaba.'],
    sources: [S.spirit],
    systems: MER_SYSTEMS
  },
  ds2: {
    see: 'Ves una de las dos microsondas de Deep Space 2 (Scott y Amundsen tenían el mismo diseño) dentro de su cápsula cerrada, tal como viajaba hacia Marte.',
    look: ['La forma de volante de bádminton de la cápsula', 'La nariz redonda del escudo térmico', 'Al inspeccionarla: el penetrador, el cuerpo posterior y el cable que los unía'],
    noData: true,
    findings: ['No hubo descubrimientos: después de la llegada prevista, el 3 de diciembre de 1999, nunca se recibió señal de las dos microsondas.', 'Todavía no se sabe la causa de la pérdida ni el lugar exacto donde cayeron.', 'Su objetivo era probar tecnologías nuevas: sondas pequeñas que se clavan en el suelo y buscan agua en el subsuelo.'],
    sources: [S.ds2, S.ds2kit],
    systems: [
      sys('aeroshell', 'Aeroescudo de entrada', 'Debía proteger la sonda al entrar en la atmósfera de Marte, con un escudo diseñado para soportar unos 2000 °C. No tenía paracaídas ni cohetes, porque su forma de volante de bádminton la mantendría con la nariz hacia adelante. En el impacto se rompería para liberarla.'),
      sys('forebody', 'Penetrador', 'Debía clavarse entre 0,3 y 1 m en el suelo, solo con la fuerza del choque. Un pequeño taladro lateral tomaría suelo para buscar agua.'),
      sys('aftbody', 'Cuerpo posterior', 'Debía quedar en la superficie con las baterías y la radio para enviar los datos al orbitador Mars Global Surveyor.'),
      sys('tether', 'Cable umbilical', 'Un cable plano y flexible debía unir el penetrador enterrado con el cuerpo posterior. Viajaba doblado como una manguera de bomberos.')
    ]
  },
  sojourner: {
    see: 'Ves a Sojourner, un rover del tamaño de un horno de microondas, desplegado sobre el suelo de Marte con su antena levantada.',
    look: ['El panel solar plano en la parte de arriba', 'Las seis ruedas con su suspensión', 'El APXS en la parte trasera', 'La antena delgada de radio'],
    findings: ['El APXS hizo 16 análisis químicos de rocas y suelos. Barnacle Bill fue la primera roca analizada.', 'La misión envió 2300 millones de bits de datos: más de 16 500 imágenes del módulo y 550 del rover.', 'Esos datos sirvieron como «verdad de terreno» para comprobar lo que miden los satélites desde la órbita.', 'Demostró que un rover pequeño podía explorar Marte.'],
    sources: [S.pathfinder, S.apod],
    systems: [
      sys('web', 'Caja caliente (WEB)', 'Una caja aislada que mantenía la electrónica entre −40 y +40 °C mientras afuera hacía mucho más frío.'),
      sys('solar', 'Panel solar', '234 células solares daban unos 16 W, lo que gasta una lámpara pequeña. Con eso se movía de día.'),
      sys('battery', 'Batería', 'Baterías de litio que no se recargaban. Servían de respaldo para operar cuando faltaba la luz.'),
      sys('rocker-bogie', 'Suspensión rocker-bogie', 'Seis ruedas con palancas que suben piedras sin volcar. La usan también rovers más modernos.'),
      sys('apxs', 'APXS', 'El instrumento que analizaba de qué estaban hechas las rocas. Iba atrás: Sojourner retrocedía para apoyarlo en la roca.'),
      sys('cameras', 'Cámaras delanteras', 'Dos cámaras en blanco y negro que, junto con láseres, detectaban obstáculos.'),
      sys('antenna', 'Antena de radio', 'Hablaba con el módulo Pathfinder, que hacía de puente con la Tierra. Por eso Sojourner no se alejaba más de unos 12 m.')
    ]
  },
  viking2: {
    see: 'Ves la nave Viking 2 completa en órbita de Marte: el orbitador lleva acoplada la cápsula que protegía al módulo de superficie. Puedes inspeccionar el orbitador, la cápsula y el módulo ya posado en Utopia Planitia.',
    look: ['Los cuatro paneles solares del orbitador', 'La cápsula de entrada con su escudo', 'El módulo de superficie con sus tres patas'],
    findings: ['El módulo de superficie observó el clima de Marte durante años, desde un lugar distinto al de Viking 1.', 'Sus experimentos de biología buscaron vida en el suelo; NASA consideró los resultados no concluyentes.', 'El módulo funcionó hasta abril de 1980, aunque el plan inicial era de 3 meses.'],
    sources: [S.viking],
    systems: [
      sys('orbiter', 'Orbitador', 'Llevó al módulo hasta Marte, fotografió el planeta desde arriba y reenviaba a la Tierra los datos de la superficie.'),
      sys('bioshield', 'Bioescudo y cápsula de entrada', 'El bioescudo mantenía la nave limpia de microbios de la Tierra. La cápsula, con su escudo térmico, protegió al módulo durante la entrada en la atmósfera.'),
      sys('lander', 'Módulo de superficie', 'Una estación con cámaras, brazo, laboratorios y sensores del clima. Funcionaba con energía nuclear (RTG), no solar.')
    ]
  },
  viking1: {
    see: 'Ves el módulo de superficie Viking 1 tal como estaba en Chryse Planitia, con sus cámaras, su brazo y sus antenas.',
    look: ['Las dos cámaras cilíndricas', 'El brazo de muestreo', 'La pértiga del clima', 'La antena parabólica'],
    findings: ['Envió la primera foto en color de la superficie de Marte.', 'Sus experimentos de biología buscaron vida; NASA consideró los resultados no concluyentes. Estudios posteriores sugieren que pudo haber detectado materia orgánica.', 'Funcionó hasta noviembre de 1982, más de seis años, aunque el plan era de 3 meses.'],
    sources: [S.viking],
    systems: VIKING_LANDER
  },
  lrv17: {
    see: 'Ves el rover lunar LRV-3 de Apollo 17. Fíjate en el guardabarros trasero derecho: los astronautas lo repararon con mapas plastificados, cinta y abrazaderas.',
    look: ['Las cuatro ruedas de malla metálica', 'El guardabarros reparado', 'La antena en forma de paraguas', 'La cámara de televisión adelante'],
    findings: ['Gracias al rover, los astronautas recorrieron 35,9 km en tres salidas y llegaron a 7,6 km del módulo lunar.', 'Encontraron «suelo naranja»: bolitas de vidrio volcánico de erupciones de hace más de 3500 millones de años.'],
    sources: [S.lrv, S.sp350],
    systems: LRV_SYSTEMS
  },
  lrv16: {
    see: 'Ves el rover lunar LRV-2 de Apollo 16, el vehículo eléctrico que llevó a los astronautas por las tierras altas de Descartes.',
    look: ['Las ruedas de malla metálica', 'Los dos asientos y el mando en T', 'La antena de paraguas', 'La cámara de televisión'],
    findings: ['Con el rover, los astronautas recorrieron 26,7 km por las tierras altas.', 'Los científicos esperaban rocas volcánicas, pero encontraron muchas rocas formadas por impactos. La historia de la Luna era más complicada de lo que creían.'],
    sources: [S.lrv, S.sp350],
    systems: LRV_SYSTEMS
  },
  mariner: {
    see: 'Ves la nave Mariner 9 con sus cuatro paneles solares abiertos y su plataforma de cámaras. Su ubicación actual en órbita no está confirmada.',
    look: ['Los cuatro paneles solares en forma de cruz', 'La plataforma de cámaras abajo', 'La antena parabólica'],
    findings: ['Tomó 7329 fotos y cubrió cerca del 85 % de la superficie de Marte.', 'Descubrió un enorme sistema de cañones, que se llamó Valles Marineris en su honor.', 'Vio la cima del volcán Olympus Mons asomando sobre una tormenta de polvo global.', 'Fotografió de cerca las lunas Fobos y Deimos, y cauces que sugieren que alguna vez corrió agua.'],
    sources: [S.mariner],
    systems: [
      sys('camera', 'Plataforma de cámaras', 'Dos cámaras de televisión, una de gran angular y otra con teleobjetivo, que podían apuntar a distintas zonas del planeta.'),
      sys('solar', 'Paneles solares', 'Cuatro paneles transformaban la luz del Sol en electricidad para toda la nave.'),
      sys('propulsion', 'Motor principal', 'Frenó la nave para que Marte la «atrapara» en órbita: fue la primera vez que una nave orbitó otro planeta.'),
      sys('antenna', 'Antena y radio', 'Enviaban a la Tierra las fotos y los datos convertidos en señales de radio.'),
      sys('avionics', 'Secuenciador y cableado', 'El «cerebro» que ordenaba cuándo tomar cada foto y cuándo transmitirla.')
    ]
  },
  lrv15: {
    see: 'Ves el rover lunar LRV-1 de Apollo 15 desplegado y cargado con las herramientas de los astronautas, según los documentos de NASA.',
    look: ['Las ruedas de malla con refuerzos de titanio', 'Las herramientas en la parte trasera', 'La antena de paraguas', 'Los asientos plegables'],
    findings: ['Fue el primer auto en la Luna: los astronautas recorrieron 27,8 km con él.', 'En esta misión encontraron la «Roca Génesis», un trozo de anortosita que ayudó a entender la corteza más antigua de la Luna.'],
    sources: [S.lrv, S.sp350],
    systems: [
      sys('wheels', 'Ruedas de malla y motores', 'Cuatro ruedas de malla de acero con refuerzos de titanio, cada una con su motor eléctrico.'),
      sys('seats', 'Asientos y mando', 'Asientos plegables de aluminio con cinturones. Se manejaba con un mando en T.'),
      sys('payload', 'Herramientas y carga', 'Pinzas, rastrillos, bolsas para muestras y otras herramientas para recoger rocas.'),
      sys('antenna', 'Antena y radio', 'Una antena de paraguas enviaba voz y televisión directo a la Tierra.'),
      sys('camera', 'Cámara de televisión', 'Desde Houston podían moverla para seguir el trabajo de los astronautas.'),
      sys('power', 'Baterías y navegación', 'Dos baterías de 36 V y un giróscopo que indicaba la dirección para volver al módulo lunar.'),
      sys('chassis', 'Chasis plegable', 'Un chasis de aluminio en tres partes que se plegaba para viajar.')
    ]
  },
  eagle: {
    see: 'Ves el módulo lunar Eagle de Apollo 11 completo, justo después del alunizaje. En la realidad, solo la parte de abajo, la etapa de descenso, quedó en la Luna.',
    look: ['La etapa de descenso dorada con sus cuatro patas', 'La cabina de ascenso arriba', 'Las antenas', 'El equipo de superficie cerca de la nave'],
    findings: ['Trajo a la Tierra unos 22 kg de rocas y polvo lunar.', 'Esas muestras ayudaron a saber que la Luna tiene unos 4500 millones de años y se parece químicamente a la Tierra.', 'El reflector láser que dejaron todavía funciona: gracias a él sabemos que la Luna se aleja unos 3,8 cm por año.'],
    sources: [S.apollo11],
    systems: [
      sys('descent', 'Etapa de descenso', 'Tenía el motor que frenó el alunizaje. Sirvió de plataforma de despegue y se quedó en la Luna.'),
      sys('ascent', 'Cabina de ascenso', 'Donde iban Armstrong y Aldrin. Despegó con su propio motor para volver a la nave Columbia.'),
      sys('legs', 'Patas de aterrizaje', 'Cuatro patas con amortiguadores de panal que se aplastaban para absorber el golpe.'),
      sys('surface', 'Equipo de superficie', 'Bandera, sismómetro y reflector láser que los astronautas dejaron en la Base Tranquilidad.'),
      sys('rcs', 'Motores de control', 'Dieciséis motores pequeños en las esquinas para girar y orientar la nave.'),
      sys('avionics', 'Computador de guiado', 'Calculaba la ruta del descenso y del despegue. Tenía muchísima menos memoria que un celular de hoy.'),
      sys('antenna', 'Comunicaciones', 'Antenas para hablar con la Tierra y transmitir la televisión del primer paso.')
    ]
  },
  surveyor: {
    see: 'Ves la sonda Surveyor 3 en Oceanus Procellarum, como estaba antes de que los astronautas de Apollo 12 la visitaran y se llevaran algunas piezas.',
    look: ['La cámara de televisión', 'El brazo con la pala de muestreo', 'Las tres patas', 'El panel solar y la antena plana'],
    findings: ['Envió 6326 imágenes de televisión de la superficie lunar.', 'Su pala cavó cuatro zanjas e hizo pruebas que mostraron que el suelo lunar se parecía a arena húmeda: resistente para que alunizara una nave Apollo.', 'En 1969, los astronautas de Apollo 12 recuperaron su cámara y su pala para estudiar cómo las afectó estar en la Luna.'],
    sources: [S.surveyor],
    systems: [
      sys('camera', 'Cámara de televisión', 'Tomaba imágenes del terreno y las enviaba a la Tierra. Apollo 12 la trajo de vuelta.'),
      sys('sampler', 'Pala de muestreo', 'Excavaba y apretaba el suelo para medir qué tan firme era.'),
      sys('legs', 'Patas de aterrizaje', 'Tres patas con amortiguadores para posarse con suavidad.'),
      sys('solar', 'Panel solar', 'Daba energía a los instrumentos durante el día lunar.'),
      sys('antenna', 'Antenas', 'Una antena plana enviaba las imágenes; otras dos servían de respaldo.'),
      sys('propulsion', 'Motores de descenso', 'Un cohete grande frenaba primero; luego tres motores pequeños controlaban el final del descenso.'),
      sys('battery', 'Batería auxiliar', 'Energía de respaldo para los momentos sin luz.'),
      sys('sensors', 'Sensor de estrellas', 'Buscaba la estrella Canopus para saber hacia dónde apuntaba la nave.')
    ]
  },
  orbiter: {
    see: 'Ves Lunar Orbiter 1 en órbita de la Luna, con su manta térmica puesta, la puerta de la cámara abierta y sus paneles y antenas desplegados.',
    look: ['El cuerpo cubierto por la manta térmica', 'Los cuatro paneles solares', 'La antena parabólica', 'La ventana de la cámara'],
    findings: ['Fotografió los nueve sitios previstos para los alunizajes Apollo y otros 11 lugares de la cara oculta.', 'Tomó la primera foto de la Tierra desde las cercanías de la Luna, el 23 de agosto de 1966.', 'Expuso 205 fotogramas que cubrieron unos 5 millones de km² (2 millones de millas²).'],
    sources: [S.orbiter],
    systems: [
      sys('camera', 'Laboratorio fotográfico', 'Usaba película de verdad: la revelaba dentro de la nave, la escaneaba y enviaba cada imagen por radio.'),
      sys('solar', 'Paneles solares', 'Cuatro paneles daban energía a la nave.'),
      sys('antenna', 'Antenas y radio', 'Enviaban las fotos escaneadas a las antenas de la Tierra.'),
      sys('thermal', 'Manta térmica', 'Una manta de varias capas protegía la nave del calor del Sol y del frío de la sombra.'),
      sys('propulsion', 'Motor y propulsores', 'Un motor para entrar en órbita y cambiarla, y propulsores pequeños para girar.'),
      sys('sensors', 'Detectores de micrometeoritos', 'Medían los choques de granos diminutos para saber si eran un peligro para los astronautas.')
    ]
  }
};
tr(fichaData);
