import {tr} from './nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
// NEPTUNI · Recorrido piloto de Sojourner (Mars Pathfinder).
// Cada escena declara de forma explícita:
//   key      → pieza del visor que se enfoca al llegar a la escena (se valida contra el catálogo del modelo;
//              null = rover completo; undefined = la cámara no se mueve)
//   say      → texto breve del globo de Neptunito en el visor
//   evidence → foto de archivo del mismo episodio, con su crédito
//   src      → fuentes que respaldan el texto (se muestran junto a la escena)
//   actions  → botones de la escena: {focus}, {evidence}, {topic}, {orbit}, {next}
// Datos comprobados en las fuentes incluidas en el proyecto (noviembre de 2026):
// 10,5 kg (JPL Robotics, NSSDC); ruedas de 13 cm y módem UHF (PDS); enlace UHF con el módulo y alcance
// de unos 100 m (JPL Robotics); primeros siete soles a unos 10 m del módulo, retardo de 10–15 min y
// bajada por la rampa el 6 de julio de 1997 a las 05:40 UT (NSSDC); escudo, paracaídas, cohetes y bolsas
// de aire (JPL Robotics, NTRS); APXS sobre Yogi en los soles 8–10, poco cuarzo, parecida a los basaltos
// comunes de la Tierra, última transmisión el 27/09/1997 a las 10:23 UTC y fin de la misión el 10/03/1998
// (NASA, «Sojourner & Yogi»); APXS en la roca Chimp el sol 80, 23 de septiembre (NASA); 2,3 Gbit,
// más de 16 500 imágenes del módulo, 550 del rover y 16 análisis químicos (NTRS).

const JPL_ROB = ['JPL Robotics · Sojourner', 'https://www-robotics.jpl.nasa.gov/what-we-do/flight-projects/pathfinder/'];
const JPL_SE = ['JPL Robotics · Software y electrónica', 'https://www-robotics.jpl.nasa.gov/what-we-do/flight-projects/pathfinder/software-electronics/'];
const NSSDC = ['NASA NSSDCA · Rover de Mars Pathfinder', 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR'];
const PDS = ['PDS · Descripción del rover', 'https://planetarydata.jpl.nasa.gov/img/data/mpfr-m-rvrcam-2-edr-v1.0/mprv_0001/document/insthost.htm'];
const NTRS = ['NASA NTRS · Resumen de Mars Pathfinder', 'https://ntrs.nasa.gov/citations/20000012707'];
const YOGI = ['NASA/JPL · «Sojourner & Yogi», PIA00766', 'https://science.nasa.gov/resource/sojourner-yogi/'];
const CHIMP = ['NASA · El APXS en la roca Chimp', 'https://science.nasa.gov/resource/sojourners-apxs-at-chimp-left-eye/'];
const GLENN = ['NASA Glenn · Experimentos de Pathfinder', 'https://www.nasa.gov/centers/glenn/about/history/marspath.html'];
const PETAL = ['NASA · PIA00621, el rover sobre el pétalo', 'https://pds-rings.seti.org/press_releases/pages/PIA00xxx/PIA00621.html'];

const YOGI_PHOTO = {
  src: 'assets/archive/sojourner.webp',
  alt: 'Sojourner, con sus seis ruedas, junto a la roca Yogi en Ares Vallis',
  kind: 'Foto de archivo',
  caption: 'Sojourner con el APXS apoyado sobre Yogi. Fotografía tomada por el módulo Pathfinder entre los soles 8 y 10.',
  credit: 'NASA/JPL · «Sojourner & Yogi», PIA00766',
  source: 'https://science.nasa.gov/resource/sojourner-yogi/'
};

export const pilot = {
  sojourner: {
    labels: {see: 'Conoce el rover', mission: 'La misión', findings: 'Los hallazgos', systems: 'Los sistemas'},
    see: [
      {title: 'Este es Sojourner', key: null,
        html: 'Lo que ves en el visor es <b>Sojourner</b>, el rover: un robot de seis ruedas de unos 65 cm de largo que pesaba 10,5 kg. <b>Pathfinder</b> no es este robot: fue la misión y el módulo de aterrizaje que lo llevó hasta Marte.',
        note: 'Vista 3D: reconstrucción hecha con fotos y documentos de NASA/JPL.',
        say: '¡Este es Sojourner! Pathfinder fue la nave que lo trajo.', src: [JPL_ROB, NSSDC]},
      {title: 'Gíralo a tu ritmo', key: undefined, tip: true,
        html: 'Arrastra para girarlo y pellizca o usa la rueda para acercarte. Si prefieres que se quede quieto, pausa la órbita. También puedes tocar cualquier pieza para abrirla.',
        actions: [{label: 'Pausar o reanudar la órbita', orbit: true}],
        say: '¡Te toca! Gíralo y acércate.', celebrate: 'spin'},
      {title: 'Seis ruedas que no se vuelcan', key: 'wheels',
        html: 'Tenía seis ruedas de 13 cm y todas tenían motor. Van unidas a una suspensión <b>rocker-bogie</b>: palancas que dejan que cada rueda suba o baje por su cuenta para pasar sobre las piedras.',
        actions: [{label: 'Ver ruedas', focus: 'wheels'}, {label: 'Ver suspensión', focus: 'rocker-bogie'}],
        say: 'Mira sus seis ruedas.', src: [PDS, JPL_ROB]},
      {title: 'Lo que lleva encima', key: null,
        html: 'Arriba va el <b>panel solar</b> y adelante, <b>cámaras y láseres</b> para detectar obstáculos. Atrás va el <b>APXS</b>, el instrumento que estudiaba las rocas. Elige una pieza para verla de cerca.',
        actions: [{label: 'Panel solar', focus: 'solar'}, {label: 'Cámaras y láseres', focus: 'cameras'}, {label: 'APXS', focus: 'apxs'}],
        say: 'Elige una pieza y te la muestro.', src: [JPL_ROB, JPL_SE]}
    ],
    mission: [
      {title: 'Una misión, dos máquinas', key: null,
        html: '<b>Mars Pathfinder</b> viajó con Sojourner plegado sobre uno de los pétalos del módulo de aterrizaje. El módulo era la base y el puente de radio; el rover, el explorador.',
        say: 'Pathfinder fue el transporte y la base de Sojourner.', src: [PETAL, JPL_ROB]},
      {title: '4 de julio de 1997: aterrizaje', key: undefined,
        html: 'Así llegó a Ares Vallis, en Marte:',
        sequence: [['🛡️', 'Escudo térmico', 'lo protegió al entrar en la atmósfera.'], ['🪂', 'Paracaídas', 'frenó la caída.'], ['🚀', 'Cohetes', 'frenaron antes del suelo.'], ['🎈', 'Bolsas de aire', 'llegó rebotando hasta quedarse quieto.']],
        say: '¡Paracaídas, cohetes y bolsas de aire!', src: [JPL_ROB, NTRS]},
      {title: 'Bajada por la rampa', key: null,
        html: 'Con el módulo abierto, Sojourner bajó por una rampa al suelo marciano el <b>6 de julio de 1997</b>, hacia las 05:40 en hora universal.',
        say: '¡Por la rampa hasta el suelo!', src: [NSSDC]},
      {title: '¿Qué iba a medir?', key: 'apxs',
        html: 'Su tarea: averiguar de qué estaban hechas las rocas y el suelo con el <b>APXS</b>, tomar fotos con sus cámaras y probar cómo se mueve un rover en Marte. Los primeros siete soles trabajó a unos 10 m del módulo.',
        actions: [{label: 'Ver el APXS', focus: 'apxs'}, {label: 'Ir a «Los hallazgos»', topic: 'findings'}],
        say: 'Este es el APXS: su laboratorio.', src: [NSSDC]},
      {title: 'Un hito', key: null, celebrate: 'hito',
        html: 'Sojourner fue el primer rover que recorrió Marte. Abrió el camino de los rovers que llegaron después.',
        say: '¡El primer rover en Marte!', src: [JPL_ROB]}
    ],
    findings: [
      {title: 'El APXS, un laboratorio de bolsillo', key: 'apxs',
        html: 'El <b>APXS</b> (espectrómetro de partículas alfa, protones y rayos X) iba en la parte trasera, sobre un brazo que se extendía. Al apoyarlo contra una roca o el suelo, medía qué elementos químicos tenía.',
        actions: [{label: 'Ver instrumento', focus: 'apxs'}],
        say: 'Este es el APXS. ¡Míralo de cerca!', src: [JPL_ROB, NSSDC]},
      {title: 'La roca Yogi', key: 'apxs', evidence: YOGI_PHOTO,
        html: 'Entre los soles 8 y 10, Sojourner apoyó el APXS sobre <b>Yogi</b>. Los primeros resultados mostraron que tenía poco cuarzo y que se parecía a los basaltos comunes de la Tierra.',
        actions: [{label: 'Ver instrumento', focus: 'apxs'}, {label: 'Ver foto de archivo', evidence: true}],
        say: 'Así midió la roca Yogi.', src: [YOGI]},
      {title: 'Lo que llegó a la Tierra', key: undefined, celebrate: 'hito',
        html: 'En total, Pathfinder envió <b>2300 millones de bits</b>: más de 16 500 imágenes del módulo, 550 imágenes del rover y <b>16 análisis químicos</b> de rocas y suelo.',
        say: '¡16 análisis químicos!', src: [NTRS]},
      {title: 'Una pregunta para seguir', key: undefined, bridge: true,
        html: 'Sojourner ya tenía una medición… pero estaba en Marte. <b>¿Cómo la mandó hasta la Tierra?</b>',
        actions: [{label: 'Seguir la señal →', topic: 'systems', primary: true}],
        say: 'Sojourner ya tenía una medición. ¿Cómo la mandó desde Marte hasta la Tierra?'}
    ],
    systems: [
      {title: 'Seguir la señal', key: undefined, chain: 'rover',
        html: 'Cada dato de Sojourner hacía este viaje. Empecemos por la antena del rover.',
        actions: [{label: 'Seguir la señal', focus: 'antenna', next: true, primary: true}],
        say: 'Sigamos la señal: primero, la antena.', src: [NSSDC, JPL_ROB]},
      {title: 'La antena UHF', key: 'antenna',
        html: 'Esta antena delgada enviaba los datos por radio UHF al módulo Pathfinder. Sojourner no hablaba directamente con la Tierra: todo pasaba por el módulo. Su radio alcanzaba unos 100 m.',
        actions: [{label: 'Ver la antena', focus: 'antenna'}, {label: 'Ver la electrónica de la radio', focus: 'avionics'}],
        say: 'Por esta antena salía la señal.', src: [JPL_ROB, NSSDC, PDS]},
      {title: 'Pathfinder, el puente', key: undefined, chain: 'lander',
        html: 'El módulo recibía los datos y los reenviaba a la Tierra. Cada mensaje tardaba entre 10 y 15 minutos, así que nadie podía manejar a Sojourner en directo. El equipo planificaba las órdenes, las enviaba y esperaba el resultado.',
        actions: [{label: 'Envía tus propias órdenes a Marte', href: 'juego/index.html', primary: true}],
        say: '¿Te animas a planificar sus órdenes? Prueba el juego.', src: [NSSDC, JPL_ROB]},
      {title: 'La última señal', key: 'antenna',
        html: 'El 23 de septiembre de 1997 (sol 80), el APXS todavía medía la roca Chimp. La última transmisión de datos de Pathfinder llegó el <b>27 de septiembre de 1997</b>, a las 10:23 en hora universal. Sin el módulo, Sojourner se quedó sin forma de hablar con la Tierra.',
        say: '27 de septiembre de 1997: la última señal.', src: [CHIMP, YOGI, GLENN]},
      {title: 'Qué quedó en Marte y qué llegó al archivo', key: undefined,
        html: 'Tras cinco meses de intentos, NASA dio por terminada la misión el <b>10 de marzo de 1998</b>, el cierre oficial. El último contacto había sido en septiembre de 1997. El módulo y Sojourner siguen en Ares Vallis y sus datos se guardan en el archivo planetario de NASA (PDS).',
        say: 'Los datos siguen en el archivo de NASA.', src: [YOGI, PDS]},
      {title: 'Explorar otros sistemas', key: undefined,
        html: 'La radio es solo una parte. Elige otra pieza para verla en el modelo.',
        groups: [
          ['Energía', 'Panel solar de 0,22 m² (unos 13 W) y baterías de litio que no se recargaban.', [['solar', 'Panel solar'], ['battery', 'Baterías']]],
          ['Movilidad', 'Seis ruedas con motor; las cuatro de las esquinas podían girar.', [['wheels', 'Ruedas'], ['rocker-bogie', 'Suspensión'], ['drive', 'Tracción'], ['steering', 'Dirección']]],
          ['Electrónica', 'Un chasis aislado con aerogel protegía las placas del frío.', [['web', 'Caja WEB'], ['avionics', 'Placas'], ['harness', 'Cableado']]],
          ['Ver y medir', 'Cámaras y láseres adelante; el APXS atrás.', [['cameras', 'Cámaras y láseres'], ['apxs', 'APXS']]]
        ],
        say: 'Elige una pieza y te la muestro.', src: [NSSDC, PDS, JPL_ROB]}
    ]
  }
};
tr(pilot);
