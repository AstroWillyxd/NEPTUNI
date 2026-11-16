/**
 * NEPTUNI · Arqueología Espacial - Telemetría y Scrollytelling
 * NASA Space Apps Challenge 2026 - Reto "Abandoned, Not Forgotten"
 * 
 * Datos narrativos de telemetría y capítulos interactivos vinculados
 * bidireccionalmente a los componentes y subsistemas 3D de Three.js.
 */

export const telemetryData = {
  orbiter: {
    status: 'Impactada intencionalmente en la cara oculta',
    statusTone: 'impact',
    world: 'Luna',
    lifespan: {
      planned: '30 días',
      real: '76 días',
      percent: 253,
      label: '2.5x vida planeada'
    },
    lastContact: '29 de octubre de 1966',
    restingPlace: 'Cara oculta de la Luna · 6.35° N, 160.71° E',
    heroTag: 'LABORATORIO FOTOGRÁFICO ORBITAL',
    chapters: [
      {
        id: 'orbiter-cap-1',
        number: '01',
        title: 'El Corazón: Laboratorio Químico Bimat',
        component: 'camera',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'En 1966 no existían cámaras digitales espaciales. La nave transportó un laboratorio químico completo con película Eastman Kodak de 70 mm que se revelaba en gravedad cero con el proceso Bimat y se escaneaba fotograma a fotograma con un fino haz de luz para mapear el alunizaje del Apolo 11.',
        tag: 'Película 70 mm · Bimat Kodak'
      },
      {
        id: 'orbiter-cap-2',
        number: '02',
        title: 'La Ingeniería Oculta: Mylar y Canopus',
        component: 'avionics',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Para evitar que los líquidos de revelado se congelaran en la sombra lunar, los componentes internos se aislaron con una manta aluminizada de Mylar y Dacrón. Su programador de memoria de núcleos guiaba la nave fijando el Sol y la estrella Canopus para coordinar propulsores de nitrógeno frío.',
        tag: 'Mylar aluminizado · Sensor Canopus'
      },
      {
        id: 'orbiter-cap-3',
        number: '03',
        title: 'El Último Suspiro: Impacto Protector',
        component: 'antenna',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Tras transmitir a la Tierra la icónica primera imagen de nuestro planeta saliendo sobre el horizonte lunar, la NASA encendió su motor de control de velocidad para estrellarla deliberadamente en la cara oculta el 29 de octubre de 1966, evitando que interfiriera con las futuras naves Apolo.',
        tag: 'Antena parabólica · De-órbita intencional'
      }
    ]
  },

  viking1: {
    status: 'Silencio eterno en la llanura marciana',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 días',
      real: '2.307 días (6 años, 116 días)',
      percent: 2563,
      label: '25.6x vida planeada'
    },
    lastContact: '11 de noviembre de 1982',
    restingPlace: 'Chryse Planitia, Marte · 22.483° N, 47.94° O',
    heroTag: 'PRIMERA ESTACIÓN CIENTÍFICA EN MARTE',
    chapters: [
      {
        id: 'viking1-cap-1',
        number: '01',
        title: 'El Corazón: Cámaras y Laboratorio Biológico',
        component: 'camera',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Tomó la primera fotografía histórica desde el suelo marciano con dos cámaras facsímil de barrido rotatorio. Su laboratorio biológico miniaturizado procesó muestras de regolito en tres cámaras de incubación buscando metabolismo activo bajo condiciones marcianas simuladas.',
        tag: 'Cámaras facsímil · Biología automatizada'
      },
      {
        id: 'viking1-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Brazo y Computador Dual',
        component: 'avionics',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Dos computadores gemelos GCSC con memoria magnética chapada de 18 kilopalabras coordinaban el despliegue del brazo colector telescópico de 3 metros, conduciendo muestras de suelo a los hornos de pirólisis del espectrómetro GCMS protegidos por arneses de teflón y conectores blindados.',
        tag: 'Computador GCSC · Brazo de muestreo'
      },
      {
        id: 'viking1-cap-3',
        number: '03',
        title: 'El Último Suspiro: La Antena Sorda',
        component: 'rtg',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Alimentada por dos generadores nucleares SNAP-19, operó durante más de seis años. El 11 de noviembre de 1982, un comando desde la Tierra destinado a mejorar la carga de baterías sobrescribió por accidente los datos de orientación de su antena parabólica: Viking 1 quedó muda para siempre.',
        tag: 'RTG SNAP-19 · Antena de alta ganancia'
      }
    ]
  },

  viking2: {
    status: 'Inactiva tras agotar baterías de níquel-cadmio',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 días',
      real: '1.316 días (3.6 años)',
      percent: 1462,
      label: '14.6x vida planeada'
    },
    lastContact: '11 de abril de 1980',
    restingPlace: 'Utopia Planitia, Marte · 48.27° N, 225.99° O',
    heroTag: 'EXPLORADOR POLAR DE ESCARCHA',
    chapters: [
      {
        id: 'viking2-cap-1',
        number: '01',
        title: 'El Corazón: Paisaje Pedregoso y Escarcha',
        component: 'camera',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Aterrizó en la rocosa Utopia Planitia y fotografió la primera escarcha de agua sobre el suelo marciano durante el invierno boreal. Su sismógrafo de a bordo fue el único de la serie Viking que logró operar en la superficie, detectando vibraciones causadas por fuertes vientos.',
        tag: 'Cámaras facsímil · Detección de escarcha'
      },
      {
        id: 'viking2-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Generadores Térmicos SNAP-19',
        component: 'rtg',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Dos generadores termoeléctricos de radioisótopos con cápsulas de plutonio-238 calentaban el interior del módulo hexagonal en las noches gélidas de -120 °C, mientras cables trenzados distribuían calor y electricidad a los instrumentos y sistemas de muestreo.',
        tag: 'SNAP-19 RTG · Control térmico pasivo'
      },
      {
        id: 'viking2-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Silencio de Utopia',
        component: 'antenna',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Tras casi cuatro años de transmisiones continuas de meteorología y análisis de suelo, sus baterías internas de níquel-cadmio sufrieron una degradación irreversible. El 11 de abril de 1980, la estación cesó sus emisiones, dejando al lander en silencio eterno sobre las rocas marcianas.',
        tag: 'Baterías NiCd agotadas · Pérdida de enlace'
      }
    ]
  },

  insight: {
    status: 'Sepultada en polvo marciano, en silencio',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '709 soles (~2 años)',
      real: '1.440 soles (~4 años)',
      percent: 203,
      label: '2.0x vida planeada'
    },
    lastContact: '15 de diciembre de 2022',
    restingPlace: 'Elysium Planitia, Marte · 4.5° N, 135.9° E',
    heroTag: 'OBSERVATORIO GEOFÍSICO DE MARTE',
    chapters: [
      {
        id: 'insight-cap-1',
        number: '01',
        title: 'El Corazón: El Latido Interno de Marte',
        component: 'seis',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'El sismógrafo SEIS, protegido por su cúpula térmica y aerodinámica WTS, registró más de 1.300 martemotos. Su sensibilidad atómica permitió a los geofísicos medir por primera vez el espesor de la corteza, la densidad del manto y el radio del núcleo líquido de Marte.',
        tag: 'Sismómetro SEIS · Cúpula WTS'
      },
      {
        id: 'insight-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: EBox y Brazo Robótico',
        component: 'avionics',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Su cerebro electrónico central (EBox) procesó fluctuaciones sísmicas con un blindaje especial contra radiación espacial. El brazo robótico IDA desplegó el sismógrafo sobre el regolito mediante una pinza motorizada y cables de señal planos de poliamida diseñados para no inducir ruidos mecánicos.',
        tag: 'Caja EBox · Cables de poliamida'
      },
      {
        id: 'insight-cap-3',
        number: '03',
        title: 'El Último Suspiro: Sepultada Bajo el Polvo',
        component: 'solar',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Sin remolinos de viento ("dust devils") que limpiaran sus paneles circulares UltraFlex de 2.15 metros, una densa capa de polvo oxidado redujo su energía al 10%. En su última transmisión envió una foto de su cubierta polvorienta antes de que sus baterías se congelaran en la noche marciana.',
        tag: 'Paneles UltraFlex · Desconexión térmica'
      }
    ]
  },

  sojourner: {
    status: 'En reposo junto al lander Sagan Memorial',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '7 soles',
      real: '83 soles',
      percent: 1185,
      label: '11.8x vida planeada'
    },
    lastContact: '27 de septiembre de 1997',
    restingPlace: 'Ares Vallis, Marte · 19.33° N, 33.55° O',
    heroTag: 'PRIMER ROVER CON RUEDAS EN OTRO MUNDO',
    chapters: [
      {
        id: 'sojourner-cap-1',
        number: '01',
        title: 'El Corazón: El Espectrómetro APXS',
        component: 'apxs',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Con solo 10.5 kg de peso, demostró la viabilidad de la exploración rodada en Marte. Desplegó su sensor APXS directamente contra las rocas "Barnacle Bill" y "Yogi", bombardeándolas con partículas alfa y rayos X para revelar su composición volcánica similar a los andesitas terrestres.',
        tag: 'Espectrómetro APXS · Análisis in situ'
      },
      {
        id: 'sojourner-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: WEB Térmico y Rocker-Bogie',
        component: 'web',
        badge: 'INGENIERÍA INTERNA',
        summary: 'El cuerpo electrónico protegido (WEB) albergaba un procesador 80C85 dentro de un aislante de aerogel de sílice y tres calefactores de radioisótopos (RHU) de 1 W. Su suspensión mecánica Rocker-Bogie de titanio permitía trepar rocas mayores que el diámetro de sus seis ruedas.',
        tag: 'Aislante de Aerogel · Suspensión Rocker-Bogie'
      },
      {
        id: 'sojourner-cap-3',
        number: '03',
        title: 'El Último Suspiro: La Noche que se Apagó la Base',
        component: 'solar',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'El pequeño rover dependía de la estación base Pathfinder para retransmitir a la Tierra. Cuando la batería de la estación base murió por congelación el 27 de septiembre de 1997, Sojourner quedó en modo autónomo dando vueltas programadas alrededor de la base en silencio eterno.',
        tag: 'Panel solar GaAs · Pérdida de estación nodriza'
      }
    ]
  },

  opportunity: {
    status: 'Misión concluida en el Valle de la Perseverancia',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 soles',
      real: '5.111 soles (más de 14 años)',
      percent: 5678,
      label: '56.7x vida planeada'
    },
    lastContact: '10 de junio de 2018',
    restingPlace: 'Cráter Endeavour, Marte · Perseverance Valley',
    heroTag: 'LA MARATÓN DE 14 AÑOS EN MARTE',
    chapters: [
      {
        id: 'opportunity-cap-1',
        number: '01',
        title: 'El Corazón: Rastreando Agua Líquida Pasada',
        component: 'pancam',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Recorrió 45.16 km a través de Marte. Sus cámaras estéreo Pancam y su herramienta de abrasión de rocas RAT confirmaron la presencia histórica de agua líquida al descubrir esferas microscópicas de hematita ("blueberries") y vetas brillantes de yeso en el cráter Endeavour.',
        tag: 'Pancam estéreo · Esférulas de hematita'
      },
      {
        id: 'opportunity-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Brazo Robótico y Tracción',
        component: 'arm',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Equipado con un brazo articulado de 5 grados de libertad con calentadores internos operados por termostatos bimetálicos, Opportunity resistió temperaturas de -105 °C, mientras sus actuadores de rueda continuaron traccionando con articulaciones selladas en baño de lubricante espacial Braycote.',
        tag: 'Herramienta RAT · Espectrómetro Mössbauer'
      },
      {
        id: 'opportunity-cap-3',
        number: '03',
        title: 'El Último Suspiro: La Gran Tormenta de 2018',
        component: 'solar',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'En junio de 2018, una descomunal tormenta planetaria de polvo cubrió todo el cielo marciano bloqueando la luz solar. Su último reporte de telemetría indicó niveles de energía críticos: "Mi batería está baja y está oscureciendo". Tras más de 1.000 comandos de rescate, NASA cerró la misión.',
        tag: 'Tormenta global · Agotamiento de celdas solares'
      }
    ]
  },

  spirit: {
    status: 'Atrapado en suelo blando como estación inmóvil',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 soles',
      real: '2.210 soles (más de 6 años)',
      percent: 2455,
      label: '24.5x vida planeada'
    },
    lastContact: '22 de marzo de 2010',
    restingPlace: 'Cráter Gusev, Marte · Sitio Troy',
    heroTag: 'GEOLOGÍA DE TRINCHERAS Y SÍLICE PURA',
    chapters: [
      {
        id: 'spirit-cap-1',
        number: '01',
        title: 'El Corazón: Vulcanismo en el Cráter Gusev',
        component: 'pancam',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Exploró las colinas Columbia Hills escalando pendientes de hasta 30 grados. Tras averiarse su rueda delantera derecha, la arrastró por el terreno excavando accidentalmente una trinchera que destapó depósitos de sílice pura al 90%, evidencia directa de antiguos manantiales hidrotermales.',
        tag: 'Pancam · Depósitos hidrotermales'
      },
      {
        id: 'spirit-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: La Rueda Acompañante',
        component: 'wheels',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Su sistema de seis ruedas con motores independientes brushless resistió millones de revoluciones. Cuando el motor delantero derecho sufrió un fallo de circuito abierto, los ingenieros de JPL reconfiguraron el software de vuelo para conducir el rover en marcha atrás arrastrando la rueda inactiva.',
        tag: 'Suspensión Rocker-Bogie · Motores brushless'
      },
      {
        id: 'spirit-cap-3',
        number: '03',
        title: 'El Último Suspiro: La Trampa de Arena de Troy',
        component: 'solar',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'En abril de 2009 quedó atrapado en arenas sulfatadas ocultas en el sitio Troy. Incapaz de orientar sus paneles hacia el sol durante el crudo invierno marciano, la energía cayó por debajo del límite de supervivencia. El 22 de marzo de 2010 envió su último pulso de datos antes de congelarse.',
        tag: 'Trampa de suelo · Orientación solar crítica'
      }
    ]
  },

  phoenix: {
    status: 'Sepultada bajo el hielo de Vastitas Borealis',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 soles',
      real: '157 soles',
      percent: 174,
      label: '1.7x vida planeada'
    },
    lastContact: '2 de noviembre de 2008',
    restingPlace: 'Vastitas Borealis, Marte · 68.22° N, 234.25° E',
    heroTag: 'PIONERO DEL ÁRTICO MARCIANO',
    chapters: [
      {
        id: 'phoenix-cap-1',
        number: '01',
        title: 'El Corazón: Tocando Hielo Marciano',
        component: 'tega',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Aterrizó cerca del casquete polar norte. Con su brazo robótico raspó el suelo hasta encontrar placas de hielo puro a solo 5 cm de profundidad que se sublimaron al aire, y horneó muestras en sus hornos TEGA a 1.000 °C para confirmar vapor de agua y sales de perclorato.',
        tag: 'Hornos TEGA · Hielo subsuperficial'
      },
      {
        id: 'phoenix-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Cuchara y Lidar Atmosférico',
        component: 'arm',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Su brazo robótico de titanio llevaba una fresa rotatoria para triturar hielo duro como piedra, mientras una estación meteorológica equipada con un láser Lidar disparaba pulsos verticales al cielo marciano, detectando por primera vez nieve de agua cayendo desde nubes cirro.',
        tag: 'Brazo de titanio · Lidar atmosférico'
      },
      {
        id: 'phoenix-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Solsticio de Invierno',
        component: 'solar',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Diseñada solo para el verano marciano polar donde el sol nunca se pone, el avance del otoño redujo la luz disponible día a día. El 2 de noviembre de 2008, las baterías se agotaron cuando la noche ártica se cerró sobre Vastitas Borealis, cubriendo la nave con metros de nieve de dióxido de carbono.',
        tag: 'Noche polar · Encasquetamiento por CO2'
      }
    ]
  },

  eagle: {
    status: 'Etapa de descenso intacta en la Luna',
    statusTone: 'completed',
    world: 'Luna',
    lifespan: {
      planned: '21.6 h en superficie',
      real: '21.6 h completadas',
      percent: 100,
      label: 'Misión 100% cumplida'
    },
    lastContact: '21 de julio de 1969',
    restingPlace: 'Mare Tranquillitatis, Luna · 0.67° N, 23.47° E',
    heroTag: 'EL PRIMER ALUNIZAJE TRIPULADO',
    chapters: [
      {
        id: 'eagle-cap-1',
        number: '01',
        title: 'El Corazón: Motor Regulable de Descenso',
        component: 'descent',
        badge: 'PROPÓSITO HISTÓRICO',
        summary: 'El Módulo Lunar Eagle logró el hito de posar humanos en otro cuerpo celeste. Su motor cohete de descenso DPS de empuje estrangulable (TRW) permitió a Neil Armstrong pilotar manualmente sobre cráteres y rocas durante los últimos 60 segundos antes de quedarse sin combustible.',
        tag: 'Motor TRW DPS · Empuje variable'
      },
      {
        id: 'eagle-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Patas con Sensor de Contacto',
        component: 'legs',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Cuatro patas con amortiguadores de nido de abeja de aluminio deformable absorbieron el impacto. Tres de ellas llevaban varillas de contacto de 1.7 metros que encendieron la luz azul "LUNAR CONTACT" en el panel de control momentos antes de que las zapatas tocaran el polvo.',
        tag: 'Sondas de contacto · Panal de aluminio'
      },
      {
        id: 'eagle-cap-3',
        number: '03',
        title: 'El Último Suspiro: Plataforma Eterna de Despegue',
        component: 'antenna',
        badge: 'LEGADO PERMANENTE',
        summary: 'La etapa superior de ascenso despegó usando la etapa de descenso como rampa de lanzamiento para devolver a los astronautas al Columbia. La etapa inferior quedó para siempre en la Base Tranquilidad junto a la placa: "Vinimos en son de paz por toda la humanidad".',
        tag: 'Base Tranquilidad · Placa conmemorativa'
      }
    ]
  },

  surveyor: {
    status: 'Inactiva y revisitada por la misión Apolo 12',
    statusTone: 'completed',
    world: 'Luna',
    lifespan: {
      planned: '14 días',
      real: '14 días (y revisitada)',
      percent: 100,
      label: 'Misión cumplida y revisitada'
    },
    lastContact: '4 de mayo de 1967',
    restingPlace: 'Oceanus Procellarum, Luna · 3.01° S, 23.42° O',
    heroTag: 'ARQUEOLOGÍA ESPACIAL EN VIVO',
    chapters: [
      {
        id: 'surveyor-cap-1',
        number: '01',
        title: 'El Corazón: Cámara de Televisión y Espejo',
        component: 'camera',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Surveyor 3 demostró que el suelo lunar resistía el peso de una nave tripulada. Su cámara de televisión con óptica zoom y espejo orientable transmitió más de 6.300 fotografías detalladas de las pendientes del Océano de las Tormentas antes de caer la gélida noche lunar.',
        tag: 'Cámara TV Vidicon · Espejo motorizado'
      },
      {
        id: 'surveyor-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: La Pala Mecánica Pantográfica',
        component: 'sampler',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Su pala muestreadora montada sobre un mecanismo pantográfico motorizado excavó cuatro trincheras de hasta 18 cm de profundidad, midiendo la fuerza de compresión y cohesión del regolito para validar los requisitos de las botas del traje espacial Apolo.',
        tag: 'Pantógrafo articulado · Medición de resistencia'
      },
      {
        id: 'surveyor-cap-3',
        number: '03',
        title: 'El Último Suspiro: Arqueología Espacial con Apolo 12',
        component: 'camera',
        badge: 'ARQUEOLOGÍA ESPACIAL',
        summary: 'En noviembre de 1969, Apolo 12 alunizó a solo 160 metros de Surveyor 3. Los astronautas Conrad y Bean caminaron hasta ella y retiraron su cámara de televisión y pala para traerlas a la Tierra, convirtiéndola en la única reliquia espacial extraterrestre examinada tras años en la Luna.',
        tag: 'Revisitada por Apolo 12 · Recuperación de piezas'
      }
    ]
  },

  lrv15: {
    status: 'Estacionado en la llanura de Hadley–Apennine',
    statusTone: 'completed',
    world: 'Luna',
    lifespan: {
      planned: '3 días de EVA',
      real: '3 días completados',
      percent: 100,
      label: '100% completado (27.8 km)'
    },
    lastContact: '2 de agosto de 1971',
    restingPlace: 'Hadley–Apennine, Luna · Sitio Apolo 15',
    heroTag: 'EL PRIMER COCHE ELÉCTRICO LUNAR',
    chapters: [
      {
        id: 'lrv15-cap-1',
        number: '01',
        title: 'El Corazón: Ruedas de Malla de Acero y Titanio',
        component: 'wheels',
        badge: 'PROPÓSITO TÉCNICO',
        summary: 'El Lunar Roving Vehicle transformó la exploración lunar de caminatas cortas a expediciones geológicas de largo alcance. No usaba neumáticos de aire: sus cuatro ruedas consistían en una malla abierta de alambre de acero cincado con bandas de rodadura en espiga de titanio.',
        tag: 'Malla de acero · Tracción eléctrica 4x4'
      },
      {
        id: 'lrv15-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Cabina Abierta y Mando en T',
        component: 'seats',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Diseñado por Boeing y General Motors para ser conducido por astronautas con guantes rígidos presurizados, se controlaba mediante un joystick central en forma de T. Cuatro motores eléctricos de 0.25 HP en cada rueda garantizaban tracción independiente sin caja de cambios pesada.',
        tag: 'Mando T-Handle · Baterías de plata-zinc'
      },
      {
        id: 'lrv15-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Puesto de Observación Final',
        component: 'camera',
        badge: 'LEGADO PERMANENTE',
        summary: 'Al terminar la misión, el comandante David Scott estacionó el rover a 90 metros del Módulo Lunar Falcon para que su cámara de televisión en color controlada desde Houston filmara en vivo el despegue de la etapa de ascenso. Allí continúa mirando las montañas Apennine.',
        tag: 'Cámara controlada desde Tierra · Filmación de despegue'
      }
    ]
  },

  lrv16: {
    status: 'Estacionado en las tierras altas de Descartes',
    statusTone: 'completed',
    world: 'Luna',
    lifespan: {
      planned: '3 días de EVA',
      real: '3 días completados',
      percent: 100,
      label: '100% completado (26.7 km)'
    },
    lastContact: '24 de abril de 1972',
    restingPlace: 'Descartes Highlands, Luna · Sitio Apolo 16',
    heroTag: 'VELOCISTA DE LAS TIERRAS ALTAS',
    chapters: [
      {
        id: 'lrv16-cap-1',
        number: '01',
        title: 'El Corazón: Conquista de las Tierras Altas',
        component: 'wheels',
        badge: 'PROPÓSITO TÉCNICO',
        summary: 'Llevó a John Young y Charlie Duke a través de las tierras altas de Descartes alcanzando una velocidad récord de 18 km/h en pendientes pronunciadas. El vehículo demostró que las tierras altas no eran de origen volcánico sino formadas por inmensos impactos de asteroides.',
        tag: 'Récord de velocidad · Geología de impacto'
      },
      {
        id: 'lrv16-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Computador de Navegación Inercial',
        component: 'seats',
        badge: 'INGENIERÍA INTERNA',
        summary: 'En la Luna no hay brújula magnética ni GPS. El LRV integraba una unidad de procesamiento de navegación con giroscopio direccional y odómetros en las ruedas para calcular constantemente el rumbo y la distancia de regreso directo al Módulo Lunar Orión.',
        tag: 'Odómetros de rueda · Navegación inercial'
      },
      {
        id: 'lrv16-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Test del Gran Premio Lunar',
        component: 'camera',
        badge: 'LEGADO PERMANENTE',
        summary: 'Tras filmar el famoso "Grand Prix" sobre el regolito ondulado, el rover fue estacionado en su punto final con la antena apuntando a la Tierra. Sigue en las tierras altas como monumento mudo al ingenio automotriz espacial.',
        tag: 'Grand Prix lunar · Estacionamiento en Descartes'
      }
    ]
  },

  lrv17: {
    status: 'Estacionado con guardabarros de mapas y cinta',
    statusTone: 'completed',
    world: 'Luna',
    lifespan: {
      planned: '3 días de EVA',
      real: '3 días completados',
      percent: 100,
      label: '100% completado (35.9 km)'
    },
    lastContact: '14 de diciembre de 1972',
    restingPlace: 'Taurus–Littrow, Luna · Sitio Apolo 17',
    heroTag: 'LA REPARACIÓN MÁS FAMOSA DEL ESPACIO',
    chapters: [
      {
        id: 'lrv17-cap-1',
        number: '01',
        title: 'El Corazón: El Guardabarros Improvisado',
        component: 'wheels',
        badge: 'INGENIO EN EL ESPACIO',
        summary: 'El martillo de Gene Cernan enganchó y rompió el guardabarros trasero derecho, arrojando una lluvia cegadora de regolito sobre los astronautas. Los astronautas improvisaron una reparación histórica uniendo 4 mapas de navegación plastificados con cinta gris americana y dos abrazaderas.',
        tag: 'Guardabarros de mapas · Reparación de campo'
      },
      {
        id: 'lrv17-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: El Gravímetro Transversal',
        component: 'seats',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Además de transportar al geólogo Harrison Schmitt hasta el regolito naranja volcánico de Shorty Crater, el LRV transportó el Gravímetro de Superficie (TGE) para mapear variaciones gravitatorias locales del lecho del valle Taurus-Littrow con precisión de microgales.',
        tag: 'Gravímetro TGE · Descubrimiento de suelo naranja'
      },
      {
        id: 'lrv17-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Cierre de la Era Apolo',
        component: 'camera',
        badge: 'LEGADO PERMANENTE',
        summary: 'El 14 de diciembre de 1972, Gene Cernan dejó el rover estacionado a 150 metros del Challenger. La cámara controlada desde la Tierra transmitió el despegue final de humanos de la superficie lunar. Permanece como el último vehículo conducido por manos humanas en la Luna.',
        tag: 'Última huella humana · Retransmisión de despegue'
      }
    ]
  },

  mariner: {
    status: 'Inactiva en órbita marciana histórica',
    statusTone: 'silent',
    world: 'Marte',
    lifespan: {
      planned: '90 días',
      real: '349 días',
      percent: 387,
      label: '3.8x vida planeada'
    },
    lastContact: '27 de octubre de 1972',
    restingPlace: 'Órbita de Marte (desactivada)',
    heroTag: 'EL PRIMER SATÉLITE EN OTRO PLANETA',
    chapters: [
      {
        id: 'mariner-cap-1',
        number: '01',
        title: 'El Corazón: Mapeando un Mundo Oculto en Polvo',
        component: 'camera',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Se convirtió en la primera nave de la humanidad en orbitar otro planeta en noviembre de 1971. Al llegar, una tormenta global cubría todo Marte; esperó pacientemente en órbita hasta que el polvo se disipó para fotografiar el Monte Olimpo y el inmenso cañón Valles Marineris.',
        tag: 'Cámara Vidicon · Valles Marineris'
      },
      {
        id: 'mariner-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: Motor de Inserción Bipropelente',
        component: 'propulsion',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Su motor de frenado de 1.3 kN usó tetróxido de dinitrógeno y monometilhidracina para desacelerar la nave y capturarla en órbita elíptica marciana, alimentado por cuatro paneles solares que desplegaban una envergadura de casi 7 metros.',
        tag: 'Motor de inserción orbital · 4 paneles solares'
      },
      {
        id: 'mariner-cap-3',
        number: '03',
        title: 'El Último Suspiro: Desactivación para Evitar Impacto',
        component: 'antenna',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'Tras agotar su suministro de gas de control de actitud de nitrógeno el 27 de octubre de 1972, la NASA envió el comando final para apagar su transmisor de radio, garantizando que orbitara en silencio durante décadas sin colisionar prematuramente con Marte.',
        tag: 'Agotamiento de gas nitrógeno · Órbita de decaimiento'
      }
    ]
  },

  ds2: {
    status: 'Sin señal confirmada tras penetración balística',
    statusTone: 'lost',
    world: 'Marte',
    lifespan: {
      planned: '2 horas de penetración',
      real: 'Sin contacto tras llegada',
      percent: 0,
      label: 'Pérdida en impacto'
    },
    lastContact: '3 de diciembre de 1999',
    restingPlace: 'Región Polar Sur de Marte (sitio exacto no localizado)',
    heroTag: 'MICROSPORES DE IMPACTO PROFUNDO',
    chapters: [
      {
        id: 'ds2-cap-1',
        number: '01',
        title: 'El Corazón: El Penetrador de 30.000 G',
        component: 'forebody',
        badge: 'PROPÓSITO CIENTÍFICO',
        summary: 'Las microsondas Amundsen y Scott debían penetrar el permafrost polar marciano a 640 km/h sin paracaídas. El cuerpo delantero albergaba un micro-taladro y un espectrómetro láser de diodo sintonizable para buscar hielo de agua subterráneo a 1 metro de profundidad.',
        tag: 'Cuerpo penetrador · Resistencia a 30.000 G'
      },
      {
        id: 'ds2-cap-2',
        number: '02',
        title: 'Ingeniería Oculta: El Cordón Umbilical Flexible',
        component: 'tether',
        badge: 'INGENIERÍA INTERNA',
        summary: 'Durante el impacto balístico, el cuerpo posterior debía desprenderse y quedar en la superficie mientras el proyectil delantero se hundía. Un cable umbilical flexible de 1 metro debía desenrollarse para mantener la conexión eléctrica y de datos entre ambos módulos.',
        tag: 'Cable flexible de datos · Aislante contra choque'
      },
      {
        id: 'ds2-cap-3',
        number: '03',
        title: 'El Último Suspiro: El Enigma Polar',
        component: 'aftbody',
        badge: 'ÚLTIMO SUSPIRO',
        summary: 'El Mars Global Surveyor intentó escuchar las señales de radio UHF de ambas sondas durante semanas, pero nunca se detectó transmisión. Pudo ser un fallo de antena, rotura del cordón o una colisión contra roca sólida: sus restos reposan bajo las arenas del sur marciano.',
        tag: 'Transmisor UHF superficial · Pérdida balística'
      }
    ]
  }
};
