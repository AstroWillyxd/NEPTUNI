import {tr} from '../nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
// Mission facts and evidence are independent of the renderer. Metres throughout.
// Revision 20261024a: Lunar Orbiter I reconstruction in flight configuration (thermal barrier installed);
// 20261024a refines finishes and details against the NASM A19700318000 colour photograph.
// Node names are the top-level assemblies of assets/fleet/orbiter-exterior.glb (desktop and mobile).
// Keys of revision 20261011c are mapped in assets/fleet/orbiter-migration.json.
const report='https://ntrs.nasa.gov/citations/19670012120';
const pdf='https://ntrs.nasa.gov/api/citations/19670012120/downloads/19670012120.pdf';
const history='https://www.nasa.gov/history/55-years-ago-lunar-orbiter-1-launches-to-survey-the-moon/';
const presskit='https://ntrs.nasa.gov/api/citations/19660022068/downloads/19660022068.pdf';
const meteoroid='https://ntrs.nasa.gov/api/citations/19710018633/downloads/19710018633.pdf';
const copies='https://drewexmachina.com/2016/11/23/lunar-orbiter-2-and-the-picture-of-the-century/';
export const lunarOrbiterExperience={
 missionId:'orbiter',revision:'20261024a',assetSizes:{desktop:3326308,mobile:2446340},
 // Former supplementary parts (sensors, guidance) are now real systems or sub-components with their own scenes.
 supplementaryParts:[],
 keyAliases:{'avionics/battery':'solar/battery','avionics/power':'solar/regulator','avionics/power/passives':'solar/regulator','guidance':'avionics','guidance/iru':'avionics/iru','guidance/canopus':'avionics/canopus','sensors/impacts':'sensors/meteoroid','sensors/radiation':'sensors/dosimeters'},
 badge:'VUELO · MANTA TÉRMICA INSTALADA',
 exteriorCover:{nodes:['THERMAL_BARRIER','CAMERA_THERMAL_DOOR'],hideLabel:'Ver sin barrera térmica',showLabel:'Mostrar barrera térmica',note:'Vista de ingeniería con la manta y la puerta térmica retiradas para inspección, como en NASA-CR-782, figura 1.1-2. Esta separación es educativa.'},
 configuration:'Configuración de vuelo en órbita lunar: barrera térmica de Mylar aluminizado instalada y puerta de la cámara abierta. «Ver sin barrera térmica» muestra la configuración de NASA-CR-782, figura 1.1-2.',
 sources:{
  museum:{title:'Smithsonian NASM · Maqueta de ingeniería de Lunar Orbiter',url:'https://airandspace.si.edu/collection-objects/lunar-orbiter-engineering-mock/nasm_A19700318000',type:'referencia de museo: no es la nave de vuelo',year:1966},
  mission:{title:'NASA Science · Lunar Orbiter 1',url:'https://science.nasa.gov/mission/lunar-orbiter-1/',type:'ficha de misión',year:1966},
  report:{title:'NASA-CR-782 · Informe de la misión fotográfica',url:report,download:pdf,type:'informe técnico',year:1967},
  history:{title:'NASA · Lanzamiento, fotografía y legado',url:history,type:'historia de la misión',year:1966},
  presskit:{title:'NASA Release 66-195 · Dossier de prensa de Lunar Orbiter A',url:presskit,type:'dossier de prensa',year:1966},
  meteoroid:{title:'NASA TN D-6266 · Experimentos de micrometeoroides',url:meteoroid,type:'nota técnica',year:1971},
  telecom:{title:'NASA TM X-56768 · Telecomunicaciones de Lunar Orbiter',url:'https://ntrs.nasa.gov/citations/19660020103',type:'memorando técnico',year:1966},
  nssdca:{title:'NASA NSSDCA · Lunar Orbiter 1 (1966-073A)',url:'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-073A',type:'catálogo de misión',year:1966}
 },
 media:{
  museum:{src:'assets/evidence/orbiter/nasm-a19700318000.webp',alt:'Maqueta de ingeniería Boeing de Lunar Orbiter expuesta en el Smithsonian sin manta térmica',caption:'Smithsonian NASM A19700318000 · Maqueta de ingeniería, no nave de vuelo. Referencia de acabados contrastada con fotografías NASA. Fotografía Smithsonian, CC0.',url:'https://airandspace.si.edu/collection-objects/lunar-orbiter-engineering-mock/nasm_A19700318000'},
  hardware:{src:'assets/evidence/orbiter/hardware.jpg',alt:'Fotografía histórica de una nave Lunar Orbiter, con equipos y paneles desplegados',caption:'Hardware de la familia Lunar Orbiter (maqueta con barrera transparente). Fotografía NASA; referencia de geometría, no identificación de cada tornillo de LO-A.',url:'https://www.nasa.gov/history/60-years-ago-nasa-approves-the-lunar-orbiter-program/'},
  diagram:{src:'assets/evidence/orbiter/spacecraft-diagram.png',alt:'Esquema original NASA y Boeing de los subsistemas de Lunar Orbiter, con la barrera térmica retirada',caption:'NASA-CR-782, figura 1.1-2 · Configuración de la nave con la barrera térmica retirada. Reproducción del documento original.',url:report},
  photography:{src:'assets/evidence/orbiter/photographic-system.jpg',alt:'Fotografía NASA del sistema de cámaras y procesamiento de película de Lunar Orbiter',caption:'Sistema fotográfico Eastman Kodak · Archivo NASA, 1967-L-05646. Referencia de la familia Lunar Orbiter.',url:history},
  earthrise:{src:'assets/evidence/orbiter/earthrise.jpg',alt:'Fotografía en blanco y negro de la Tierra sobre el horizonte lunar tomada por Lunar Orbiter 1',caption:'Lunar Orbiter 1 · 23 de agosto de 1966, fotograma 1102 H, órbita 16. Primera fotografía de la Tierra desde la Luna. NASA; versión histórica, no la fotografía de Apollo 8.',url:'https://www.nasa.gov/image-detail/first-view-of-earth-from-moon/'},
  groundTest:{src:'assets/evidence/orbiter/lrc-p38987.webp',alt:'Nave Lunar Orbiter durante pruebas en tierra, con el escudo térmico de lámina arrugada',caption:'NASA/LRC P-38987 · Pruebas en tierra. Escudo de lámina aluminizada arrugada, depósitos oscuros y brillantes y paneles negros.',url:copies},
  detectorRing:{src:'assets/evidence/orbiter/tnd6266-fig8-ring.webp',alt:'Figura técnica con la posición de los veinte detectores de micrometeoroides',caption:'NASA TN D-6266, figura 8 · Vista desde el extremo menor: 15 posiciones y 5 detectores dobles.',url:meteoroid},
  detector:{src:'assets/evidence/orbiter/tnd6266-fig2-detector.webp',alt:'Corte técnico de un detector de micrometeoroides presurizado',caption:'NASA TN D-6266, figura 2 · Semicilindro presurizado, cápsula y microinterruptor.',url:meteoroid},
  attitude:{src:'assets/evidence/orbiter/tnd6266-fig1-acs.webp',alt:'Figura técnica de los componentes de control de actitud y los ejes de la nave',caption:'NASA TN D-6266, figura 1 · Componentes del control de actitud y ejes de la nave.',url:meteoroid},
  thermalDiagram:{src:'assets/evidence/orbiter/thermal-control-diagram.webp',alt:'Diagrama NASA de las medidas de control térmico de Lunar Orbiter',caption:'Control térmico (NASA): barrera de Mylar aluminizado y Dacron, pared interior reflectante, plataforma pintada.',url:copies}
 },
 systems:{
  camera:{function:'Exponer película, revelarla a bordo y convertir la imagen en una señal analógica para la Tierra.',system:'Fotografía y lectura',nodes:['PHOTOGRAPHIC_SYSTEM','CAMERA_MOUNTS'],certainty:'DOCUMENTED',media:['photography','diagram'],sources:['report','presskit','history'],cameraDirection:[.55,.35,1],limit:'La arquitectura, las focales y la secuencia de la película están documentadas (CR-782 pp. 5-6). La planta del contenedor sigue TN D-6266 fig. 8; la cubeta, la brida y los objetivos, la fotografía L-67-05646. La disposición interna y la prescripción óptica son educativas.'},
  solar:{function:'Transformar luz solar en electricidad para los equipos y cargar la batería.',system:'Energía',nodes:['SOLAR_ARRAYS','BATTERY_PACK','POWER_CONTROL'],certainty:'DOCUMENTED',media:['hardware','groundTest'],sources:['report','presskit'],cameraDirection:[.75,-.7,1],limit:'Cuatro paneles con 2714 células cada uno, la batería NiCd de 12 Ah en dos módulos de diez celdas y el regulador de 31 V están documentados. El empaquetado de las células y las pistas son explicativos.'},
  antenna:{function:'Recibir órdenes y transmitir telemetría y la señal de las fotografías.',system:'Comunicaciones',nodes:['HIGH_GAIN_ANTENNA','LOW_GAIN_ANTENNA','RF_ELECTRONICS'],certainty:'DOCUMENTED',media:['diagram','groundTest'],sources:['report','telecom'],cameraDirection:[.15,.5,1],limit:'Antena parabólica de 36 in sobre una pértiga de 52 in que gira en pasos de 1°, y antena bicónica sobre una pértiga de 82 in (CR-782 p. 10; TM X-56768). Las placas y la hélice del TWTA son educativas.'},
  thermal:{function:'Mantener el interior entre unos 35 y 85 °F con una manta reflectante y un radiador pintado.',system:'Control térmico',nodes:['THERMAL_BARRIER','CAMERA_THERMAL_DOOR','DECK_THERMAL_PAINT','PHOTO_RADIATION_FINS','ENGINE_DECK_HEAT_SHIELD'],certainty:'DOCUMENTED',media:['thermalDiagram','groundTest'],sources:['report','presskit'],cameraDirection:[.85,.4,1.1],limit:'La manta de Mylar aluminizado y Dacron, la pintura de óxido de zinc de la plataforma y la puerta térmica de la cámara están documentadas. La forma de la manta se reconstruye a partir de la plataforma, el anillo de detectores y los depósitos.'},
  propulsion:{function:'Modificar la velocidad para entrar en órbita lunar y mantener la orientación con nitrógeno.',system:'Propulsión y orientación',nodes:['PROPELLANT_TANKS','NITROGEN_TANK','NITROGEN_REGULATORS','VELOCITY_CONTROL_ENGINE','ENGINE_GIMBAL','FEED_LINES','ATTITUDE_THRUSTERS'],certainty:'DOCUMENTED',media:['diagram','groundTest'],sources:['report','presskit'],cameraDirection:[.8,.6,1],limit:'Motor de 100 lbf, cuatro depósitos con vejigas de Teflón (oxidante en el eje de las antenas, combustible en el de la cámara), esfera de nitrógeno bajo el motor y ocho propulsores (CR-782 pp. 10-12). Válvulas, inyector y rutas de tubería son reconstrucciones.'},
  sensors:{function:'Medir impactos de micrometeoroides y la dosis de radiación que recibía la película.',system:'Medición del entorno',nodes:['METEOROID_DETECTORS','RADIATION_DOSIMETERS'],certainty:'DOCUMENTED',media:['detectorRing','detector'],sources:['meteoroid','presskit'],cameraDirection:[.7,.45,1],limit:'Veinte semicilindros de cobre-berilio de 18,8 cm en 15 posiciones (TN D-6266 figs. 2 y 8) y dos dosímetros de centelleo junto a la película. Las envolventes de los dosímetros son reconstruidas.'},
  avionics:{function:'Orientar la nave con el Sol y Canopus y ejecutar las secuencias almacenadas.',system:'Guiado y control',nodes:['FLIGHT_PROGRAMMER','INERTIAL_REFERENCE_UNIT','CANOPUS_STAR_TRACKER','SUN_SENSORS','FLIGHT_CONTROL_ELECTRONICS','EXTERNAL_HARNESSES'],certainty:'DOCUMENTED',media:['attitude','diagram'],sources:['report','presskit'],cameraDirection:[.45,1,.9],limit:'Programador con 2688 bits de memoria de núcleos, IRU de 7 × 10 × 7 in, buscador de Canopus y cinco sensores solares (dossier de prensa pp. 15-17). Las placas, patillas y rutas de cable son educativas.'},
  structure:{function:'Unir las plataformas de equipos, depósitos y motor mediante una red tubular y un arco junto a la cámara.',system:'Estructura',nodes:['EQUIPMENT_MOUNTING_DECK','OPEN_TUBULAR_TRUSS','TANK_DECK','UPPER_STRUCTURAL_MODULE','ENGINE_DECK','CAMERA_MOUNTS'],certainty:'DOCUMENTED',media:['diagram','hardware'],sources:['report'],cameraDirection:[.87,.55,1.16],limit:'NASA-CR-782 §1.1.2.6 y figura 1.1-2 describen las tres plataformas y la red de tubos. Diámetros finos, holguras y tornillería son reconstrucciones visuales.'}
 },
 focus:{solar:{node:'SOLAR_ARRAYS'},antenna:{node:'HIGH_GAIN_ANTENNA'},structure:{node:'OPEN_TUBULAR_TRUSS'},thermal:{node:'THERMAL_BARRIER'},sensors:{node:'METEOROID_DETECTORS'}},
 // Assembly separation is a teaching view, not a deployment sequence in flight. The blanket is lifted first.
 explosion:[
  {node:'THERMAL_BARRIER',offset:[0,2.3,0],start:0,end:.32},
  {node:'CAMERA_THERMAL_DOOR',offset:[0,2.3,0],start:0,end:.32},
  {node:'SOLAR_ARRAYS',offset:[0,-.45,0],start:.05,end:.42},
  {node:'HIGH_GAIN_ANTENNA',offset:[-1.0,.2,0],start:.08,end:.48},
  {node:'LOW_GAIN_ANTENNA',offset:[1.0,.2,0],start:.08,end:.48},
  ...['ENGINE_DECK','ENGINE_DECK_HEAT_SHIELD','VELOCITY_CONTROL_ENGINE','ENGINE_GIMBAL','ATTITUDE_THRUSTERS','UPPER_STRUCTURAL_MODULE','PROPELLANT_TANKS','NITROGEN_TANK','NITROGEN_REGULATORS','FEED_LINES'].map(node=>({node,offset:[0,1.25,0],start:.22,end:.75})),
  {node:'TANK_DECK',offset:[0,.65,0],start:.22,end:.65},
  {node:'METEOROID_DETECTORS',offset:[0,.65,0],start:.22,end:.65},
  {node:'OPEN_TUBULAR_TRUSS',offset:[0,.36,0],start:.3,end:.7},
  ...['PHOTOGRAPHIC_SYSTEM','CAMERA_MOUNTS','RADIATION_DOSIMETERS','PHOTO_RADIATION_FINS'].map(node=>({node,offset:[0,.2,1.38],start:.4,end:1})),
  ...['FLIGHT_PROGRAMMER','INERTIAL_REFERENCE_UNIT','FLIGHT_CONTROL_ELECTRONICS','CANOPUS_STAR_TRACKER','RF_ELECTRONICS','BATTERY_PACK','POWER_CONTROL'].map(node=>({node,offset:[0,.32,-1.2],start:.5,end:1})),
  {node:'EXTERNAL_HARNESSES',offset:[.85,.05,-.6],start:.5,end:1}
 ],
 relationships:{
  energy:{name:'De la luz a los equipos',keys:['solar','avionics'],text:'Paneles solares → regulador y control de carga → batería NiCd y equipos. La línea representa una relación funcional, no la ruta física exacta de un cable.'},
  imaging:{name:'De la Luna a la Tierra',keys:['camera','antenna'],text:'Luz → película → revelado Bimat → escáner → radio → Tierra. La línea representa el flujo de información.'}
 },
 story:[
  {id:'arrival',title:'Antes de dar el primer paso',text:'1966. Antes de que un humano pudiera aterrizar en la Luna, había que descubrir dónde hacerlo. Lunar Orbiter 1 fotografió posibles lugares para Surveyor y Apollo.',action:{type:'assemble_model'},prompt:'Arrastra para descubrir su forma: la manta reflectante cubre casi toda la nave. Después sigue la luz hasta la ventana de la cámara.'},
  {id:'eyes',title:'Dos miradas, una película',text:'Un objetivo de 80 mm y un teleobjetivo de 610 mm registraban la superficie sobre película de 70 mm. La nave llevaba su propio laboratorio fotográfico.',action:{type:'focus_component',component:'camera'},prompt:'Toca «Abrir interior» para observar la cámara ensamblada antes de su despiece.'},
  {id:'laboratory',title:'Revelar sin regresar a casa',text:'La película se procesaba a bordo mediante Bimat y se secaba. La imagen tenía que sobrevivir hasta el siguiente paso: convertirla en una señal.',action:{type:'focus_subcomponent',component:'camera/processor'},prompt:'Selecciona la película o el escáner para seguir su recorrido.'},
  {id:'signal',title:'La fotografía se vuelve señal',text:'Un punto luminoso recorría la película y un fotomultiplicador medía su densidad óptica. El resultado era una señal analógica, no un archivo de cámara digital.',action:{type:'focus_subcomponent',component:'camera/scanner/readout'},prompt:'Inspecciona el tubo de barrido y consulta la documentación del sistema de lectura.'},
  {id:'earth',title:'Cruzar el vacío',text:'La radio enviaba esa señal a la Tierra, donde se reconstruían las fotografías. Energía, cámaras y comunicaciones trabajaban como una sola máquina.',action:{type:'show_relationship',relationship:'imaging'},prompt:'La conexión luminosa indica el flujo de información; abre la evidencia para contrastarlo.'},
  {id:'earthrise',title:'También nos descubrió a nosotros',text:'El 23 de agosto de 1966, Lunar Orbiter 1 fotografió la Tierra sobre el horizonte lunar (fotograma 1102). Algunas imágenes de alta resolución sufrieron desenfoque: la misión también reveló los límites de su ingeniería.',action:{type:'reset_camera'},media:'earthrise',prompt:'El fondo del visor es esa fotografía, girada para nivelar el horizonte. Abre su fuente NASA.'},
  {id:'legacy',title:'La misión terminó. El legado sigue.',text:'El 29 de octubre de 1966 fue dirigida a un impacto en la cara oculta. Las fotografías del programa Lunar Orbiter ayudaron a elegir lugares de alunizaje. Aquí conservamos su historia, no afirmamos conocer el estado actual de sus restos.',action:{type:'assemble_model'},prompt:'Explora libremente, desmonta la nave o consulta las fuentes de cada componente.'}
 ]
};
tr(lunarOrbiterExperience);
