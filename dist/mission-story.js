import {tr} from './nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
/** Stories reference the existing component keys; no geometry or flight data is generated here. */
const chapter=(component,title,text,related=[])=>({component,title,text,related});
const nasa={
 orbiter:'https://www.nasa.gov/mission/lunar-orbiter-1/',
 viking:'https://science.nasa.gov/mission/viking-1/',
 insight:'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/',
 durations:'https://www.giss.nasa.gov/tools/mars24/help/landers.html'
};
export const missionStories={
 orbiter:{status:'Impacto dirigido en la Luna',planned:30,actual:80,actualLabel:'80 días desde el lanzamiento',unit:'días',contact:'29 de octubre de 1966',date:'1966-10-29',location:'Cara oculta de la Luna',durationNote:'Vida desde el lanzamiento; 76 días en órbita lunar.',sources:[['NASA · Lunar Orbiter 1',nasa.orbiter]],chapters:[
  chapter('camera/film','Un laboratorio en el espacio','Sin cámaras digitales: película de 70 mm para descubrir dónde podrían alunizar las misiones Apollo.',['camera','sensors']),
  chapter('camera/processor','La fotografía por dentro','Bimat revelaba la película a bordo. Un escáner analógico enviaba cada imagen como una señal a la Tierra.',['camera/processor','camera/scanner','camera/electronics','thermal','structure','solar']),
  chapter('antenna/transceiver','Una mirada hacia casa','Transmitió las primeras imágenes de la Tierra desde la Luna y fotografías para preparar los alunizajes.',['antenna','avionics']),
  chapter('propulsion/engine','La última orden','El impacto dirigido del 29 de octubre de 1966 evitó interferencias con los siguientes Lunar Orbiter.',['propulsion'])
 ]},
 viking1:{status:'Silencio en Chryse Planitia',planned:90,actual:2307,unit:'días',actualLabel:'2.307 días · 6 años y 116 días',contact:'11 de noviembre de 1982',date:'1982-11-11',location:'Chryse Planitia · Marte',sources:[['NASA · Viking 1',nasa.viking]],chapters:[
  chapter('camera/scan','La primera mirada desde Marte','Las cámaras de barrido enviaron la primera foto desde la superficie de Marte. Un mundo nuevo, línea a línea.',['camera','sampler','meteorology','legs']),
  chapter('biology/labeled-release','La pregunta por la vida','El laboratorio biológico examinó el suelo en busca de señales de vida. La pregunta sigue abierta.',['biology','chemistry']),
  chapter('avionics/battery','Energía para seis años','RTG, baterías y cables sostuvieron durante seis años una estación pensada para operar solo 90 días.',['rtg','avionics/battery','avionics/power','avionics/harness','propulsion']),
  chapter('avionics/memory','Una orden, el silencio','En 1982, una actualización sobrescribió datos de orientación de la antena. Viking 1 perdió el enlace.',['avionics','antenna'])
 ]},
 viking2:{status:'Silencio en Utopia Planitia',contact:'Abril de 1980',location:'Utopia Planitia · Marte',chapters:[
  chapter('camera/scan','Otro paisaje marciano','Viking 2 observó Utopia Planitia: una segunda ventana para comparar el suelo, el clima y el paisaje de Marte.',['camera','sampler','meteorology','legs']),
  chapter('biology/labeled-release','Ciencia bajo la cubierta','El brazo entregaba muestras al laboratorio. Los RTG alimentaban los experimentos y la electrónica.',['biology','chemistry','rtg','propulsion']),
  chapter('avionics/battery','El final de la estación','Dejó de transmitir en abril de 1980. Su archivo permite seguir estudiando Marte después del silencio.',['avionics','antenna'])
 ]},
 insight:{status:'Silencio en la superficie marciana',planned:709,actual:1440,unit:'soles',contact:'15 de diciembre de 2022',date:'2022-12-15',location:'Elysium Planitia · Marte',coordinates:'4,50° N · 135,62° E',durationNote:'Un sol es un día marciano. La comparación usa soles en ambas barras.',sources:[['NASA/JPL · Fin de la misión',nasa.insight],['NASA · Duraciones en soles',nasa.durations]],chapters:[
  chapter('seis/sensor','El latido del planeta rojo','SEIS escuchó los martemotos. Sus sensores ayudaron a medir la corteza, el manto y el núcleo ocultos de Marte.',['seis','hp3','sensors']),
  chapter('avionics/acquisition','Escuchar a través de un cable','El brazo colocó SEIS sobre el suelo. El cable conectó sus delicados sensores con la electrónica del lander.',['avionics','arm','antenna','legs','propulsion']),
  chapter('solar/cells','Cuando faltó la luz','El polvo redujo la energía. Su última selfie fue en abril de 2022; el último contacto, en diciembre.',['solar'])
 ]},
 spirit:{status:'Silencio en Troy',planned:90,actual:2208,unit:'soles',contact:'22 de marzo de 2010',date:'2010-03-22',location:'Troy · cráter Gusev · Marte',sources:[['NASA · 25 años de exploración marciana','https://www.nasa.gov/history/25-years-of-continuous-robotic-mars-exploration-from-pathfinder-to-perseverance/']],chapters:[
  chapter('pancam','Leer la historia de las rocas','Las cámaras y el brazo buscaron ambientes antiguos. Cada roca era una página de la historia marciana.',['pancam','arm']),
  chapter('wheels/motor','Seis ruedas y un computador','Motores, reductores y cables movían el rover. La electrónica coordinaba su viaje por el cráter Gusev.',['wheels','avionics','antenna']),
  chapter('solar/cells','Un invierno sin respuesta','Atrapado en suelo blando, afrontó el invierno con poca energía. Su último enlace llegó en 2010.',['solar'])
 ]},
 opportunity:{status:'Silencio en Perseverance Valley',planned:90,actual:5111,unit:'soles',contact:'10 de junio de 2018',date:'2018-06-10',location:'Perseverance Valley · cráter Endeavour · Marte',sources:[['NASA · Duraciones en soles',nasa.durations]],chapters:[
  chapter('pancam','Un viaje escrito en las rocas','Sus cámaras buscaron huellas del agua antigua en Marte y guiaron más de catorce años de exploración.',['pancam','arm']),
  chapter('avionics/battery','La ingeniería de la resistencia','Baterías, electrónica y seis ruedas sostuvieron un viaje mucho mayor que los 90 soles de la misión inicial.',['avionics','wheels','antenna']),
  chapter('solar/cells','La tormenta apagó el día','Una tormenta global ocultó el Sol en 2018. Con poca energía, el rover dejó de comunicarse el 10 de junio.',['solar'])
 ]},
 phoenix:{status:'Silencio en el ártico marciano',planned:90,actual:157,unit:'soles',contact:'2 de noviembre de 2008',date:'2008-11-02',location:'Vastitas Borealis · Marte',sources:[['NASA · Historia de Phoenix','https://www.nasa.gov/history/15-years-ago-phoenix-mars-lander-launches-to-the-red-planet/']],chapters:[
  chapter('arm','Excavar en busca de hielo','El brazo recogió suelo del ártico marciano. TEGA y MECA investigaron sus propiedades y el hielo cercano.',['arm','tega','meca','ssi']),
  chapter('avionics/battery','Una estación bajo la cubierta','Baterías y cables repartían energía a hornos, sensores y electrónica. Un laboratorio sobre tres patas.',['avionics','met','legs','propulsion']),
  chapter('solar/cells','El invierno llegó al norte','La luz disminuyó y el frío se intensificó. Phoenix transmitió por última vez en noviembre de 2008.',['solar'])
 ]},
 sojourner:{status:'Sin enlace a través de Pathfinder',planned:7,actual:83,unit:'soles',contact:'27 de septiembre de 1997',date:'1997-09-27',location:'Ares Vallis · Marte',contactNote:'Último contacto con el módulo de aterrizaje Pathfinder, su enlace con la Tierra.',sources:[['NASA · Sojourner y su APXS','https://science.nasa.gov/resource/sojourners-apxs-at-chimp-left-eye/'],['JPL · Diseño y duración de Sojourner','https://www-robotics.jpl.nasa.gov/media/documents/ICESpaper.pdf']],chapters:[
  chapter('apxs','El pequeño explorador','El APXS estudiaba la composición de las rocas. Un rover de solo 10,5 kg abrió un camino enorme.',['apxs','cameras','rear-camera','rocker-bogie','wheels']),
  chapter('cpu','Un cerebro protegido del frío','La caja WEB protegía las placas y baterías. Sus cables llevaban señales y energía a ruedas e instrumentos.',['web','avionics','cpu','power-board','battery','harness','imu','apxs-electronics']),
  chapter('antenna','El silencio del intermediario','Pathfinder era su enlace con la Tierra. El último contacto con el módulo de aterrizaje llegó en septiembre de 1997.',['antenna','solar'])
 ]},
 surveyor:{status:'En la Luna · parcialmente recuperada',contact:'4 de mayo de 1967',date:'1967-05-04',location:'Oceanus Procellarum · Luna',chapters:[
  chapter('camera','Mirar antes de llegar','La cámara de Surveyor 3 examinó el terreno lunar. El muestreador probó cómo respondía el regolito.',['camera','sampler']),
  chapter('avionics/main-battery','La energía de una sonda lunar','Panel solar, baterías y compartimentos electrónicos sostuvieron los instrumentos y el enlace de radio.',['avionics','solar','battery','antenna','propulsion','sensors']),
  chapter('legs','Una visita dos años después','Apollo 12 visitó Surveyor 3 en 1969. Recuperó la cámara y otras piezas para estudiar su exposición a la Luna.',['legs'])
 ]},
 eagle:{status:'Etapa de descenso en la Luna',contact:'21 de julio de 1969 · despegue de ascenso',date:'1969-07-21',contactLabel:'Separación de las etapas',location:'Mare Tranquillitatis · Luna',chapters:[
  chapter('descent/engine','El motor del primer paso','El motor regulable guio a Eagle al alunizaje. Su etapa de descenso quedó en el Mar de la Tranquilidad.',['descent','legs']),
  chapter('avionics/computer','El cálculo y sus conexiones','Computador, cables y radio coordinaron el descenso. La cabina protegía a Armstrong y Aldrin.',['avionics','antenna']),
  chapter('ascent','El regreso a Columbia','La cabina de ascenso despegó con los astronautas y se acopló a Columbia. Después, la tripulación la separó y volvió a la Tierra en Columbia.',['ascent'])
 ]},
 mariner:{status:'Misión finalizada · destino actual sin confirmar',contact:'27 de octubre de 1972',date:'1972-10-27',location:'Órbita marciana histórica · posición actual no confirmada',chapters:[
  chapter('camera','Marte desde su órbita','El primer orbitador de otro planeta reveló volcanes, cañones y las lunas de Marte con sus cámaras.',['camera']),
  chapter('avionics/pcb','Una secuencia entre placas','El secuenciador, el cableado y la energía solar coordinaron las observaciones y la transmisión a la Tierra.',['avionics','solar','propulsion']),
  chapter('antenna/transceiver','El final del enlace','La misión terminó en octubre de 1972. Este archivo no confirma una ubicación actual ni un impacto de la nave.',['antenna'])
 ]},
 ds2:{status:'Sin señal tras la llegada prevista',planned:2,actual:null,actualLabel:'Desconocida · sin señal',unit:'días',contact:'3 de diciembre de 1999 · llegada prevista',date:'1999-12-03',contactLabel:'Llegada prevista · sin contacto en superficie',location:'Planum Australe · Marte · sitio exacto desconocido',durationNote:'No se recibió telemetría que permita medir la vida útil real.',chapters:[
  chapter('forebody/drill','Llegar bajo la superficie','Scott y Amundsen debían penetrar el suelo. Un taladro recogería material del subsuelo marciano.',['forebody','aeroshell']),
  chapter('tether','Un cable entre dos mundos','Un umbilical uniría el penetrador enterrado con el cuerpo posterior, donde estaban las baterías y la radio.',['tether','aftbody/battery','aftbody/harness']),
  chapter('aftbody/radio','La señal que no llegó','No se recibió señal. La causa de la pérdida y el lugar exacto de las dos sondas siguen sin confirmarse.',['aftbody'])
 ]}
};
for(const [id,site]of [['lrv15','Hadley–Apennine'],['lrv16','Descartes'],['lrv17','Taurus–Littrow']])missionStories[id]={
 status:'Vehículo conservado en la superficie lunar',location:site+' · Luna',contactLabel:'Fin de la exploración en superficie',chapters:[
  chapter('wheels/motor','Ampliar el horizonte','Cuatro ruedas de malla ampliaron el alcance de los astronautas y abrieron nuevos lugares para la ciencia.',['wheels','camera']),
  chapter('seats/battery','La energía bajo los asientos','Baterías, motores y cables formaban un vehículo eléctrico para la Luna. Un mando reunía dirección y control.',['seats','chassis']),
  chapter('antenna/transceiver','Estacionado para la historia',id==='lrv17'?'Quedó en Taurus–Littrow, con un guardabarros reparado con mapas. Conserva la memoria de la última ruta Apollo.':'Quedó estacionado en la Luna. Su antena y sus huellas recuerdan las rutas que ampliaron la exploración.',['antenna'])
 ]
};

export function getMissionStory(mission){
 const data=missionStories[mission.id];
 if(!data)throw new Error('Falta la historia de '+mission.id);
 return {...data,contact:data.contact||mission.end,coordinates:data.coordinates||mission.coordinates,
  sources:[...(data.sources||[]),['Archivo NASA de la misión',mission.source]].filter((entry,i,all)=>entry[1]&&all.findIndex(other=>other[1]===entry[1])===i)};
}
tr(missionStories);
