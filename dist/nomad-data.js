import {getMissionStory} from './mission-story.js?v=20261025nomad';

/** The three NOMAD dimensions, in order: technical curiosity, hidden engineering, the spacecraft's own voice. */
const tags=['Curiosidad técnica','Ingeniería oculta','Pregunta profunda · 1ª persona'];
const card=(question,component,componentHint,reply,targetKeywords)=>({question,component,componentHint,reply,targetKeywords});
const mainStories={
 orbiter:{
  greeting:'¡Ey! Soy Neptunito. Estás frente al Lunar Orbiter. Antes de que Apolo 11 pudiera alunizar, esta máquina hizo algo de locos en la oscuridad. ¿Qué pieza abrimos?',
  cards:[
   card('¿Cómo mandaba fotos desde la Luna si no existían las cámaras digitales?','camera/processor','Sistema fotográfico · Kodak Bimat','¡Tenía un cuarto oscuro de revelado químico adentro! Tomaba fotos en película de 70 mm, las revelaba con el proceso Bimat y un escáner analógico las leía línea por línea para transmitirlas por radio a la Tierra.',['photo','camera','camara','kodak','lente','optic','film']),
   card('¿Cómo sobrevivía su electrónica al frío extremo y la radiación?','avionics/harness','Núcleo electrónico, cables y control','Mira los mazos de cables y conectores: enlazaban el guiado, las comunicaciones y la energía. Las mantas y el control térmico protegían los equipos frente a los cambios de temperatura. Los dosímetros midieron la radiación del entorno lunar.',['control','electr','cable','wire','power','bater','panel','antenna','antena']),
   card('Si cumpliste tu misión, ¿por qué decidiste estrellarte contra la Luna?','propulsion/engine','Motor de propulsión y estructura','«Recibí la orden de impactar el 29 de octubre de 1966 para evitar interferencias con los siguientes Lunar Orbiter. Mi misión fotográfica ya había preparado el camino de los alunizajes. Mi vuelo terminó, pero mis imágenes siguieron ayudando a explorar.»',['engine','motor','thruster','propul','struct','hull'])
  ]
 },
 viking1:{
  greeting:'¡Saludos, humano! Viking 1 fue el primer explorador que sobrevivió años en suelo marciano. Sus entrañas guardan una historia increíble. ¿Qué componente inspeccionamos?',
  cards:[
   card('¿Cómo buscaba vida extraterrestre con tecnología de los años 70?','biology/labeled-release','Laboratorio biológico y cámaras',"Recogía suelo con su brazo y lo entregaba a un pequeño laboratorio. Uno de sus experimentos añadía nutrientes marcados para buscar gases que pudieran indicar actividad biológica. Los resultados no confirmaron la presencia de vida.",['bio','lab','cam','photo','sensor','arm','brazo','soil']),
   card('¿De dónde sacaba energía durante las tormentas de arena en Marte?','avionics/battery','Generadores RTG, baterías y cableado','¡No dependía del Sol! Los generadores RTG convertían el calor de un radioisótopo en electricidad y las baterías apoyaban el suministro. Viking 1 operó durante 2.307 días terrestres: seis años y 116 días, mucho más que los 90 días previstos.',['rtg','power','bater','battery','energy','cable','thermal']),
   card('¿Qué sentiste en 1982 cuando la Tierra dejó de responderte?','antenna/transceiver','Antena de alta ganancia y transmisor','«Intentaron actualizar mi programa para cuidar unas baterías envejecidas. Una orden sobrescribió datos necesarios para orientar mi antena, y el enlace se perdió. El 11 de noviembre de 1982 fue mi último contacto; mis observaciones quedaron para las siguientes generaciones.»',['antenna','antena','comm','radio','dish','high'])
  ]
 },
 insight:{
  greeting:'¡Silencio en la sala! InSight no fue a Marte a correr, fue a escuchar el latido interno del planeta. Toca una pregunta para ver cómo funcionaba por dentro.',
  cards:[
   card('¿Cómo puedes escuchar el corazón de un planeta entero?','seis/sensor','Sismógrafo SEIS y sensores internos','SEIS registraba movimientos diminutos del suelo. Sus sensores detectaron más de 1.300 martemotos y señales de impactos. Esas ondas permitieron investigar la corteza, el manto y el núcleo de Marte.',['seis','sismo','seismic','sensor','dome','tether','internal']),
   card('¿Cómo se conectaban sus instrumentos al cerebro central de la nave?','avionics/acquisition','Electrónica interna, brazo y conectores','El brazo colocó SEIS sobre el suelo y un cable lo conectó a la electrónica del lander. La caja EBox suministraba energía, controlaba el instrumento y recogía las señales para enviarlas a los sistemas de la nave. Sigue sus conectores en el modelo.',['elec','box','cable','arm','hp3','probe','conn','core']),
   card('¿Cuál fue tu último pensamiento mientras el polvo cubría tus paneles?','solar/cells','Paneles solares y sistema de potencia','«El polvo rojo fue cubriendo mis paneles y cada vez pude generar menos electricidad. Seguí escuchando Marte mientras hubo energía. Mi última selfie se tomó el 24 de abril de 2022; mi último contacto con la Tierra llegó el 15 de diciembre. Mi archivo sigue hablando.»',['solar','panel','wing','power','battery','bater','array'])
  ]
 }
};
const otherQuestions={
 viking2:['¿Qué encontró Viking 2 al mirar otra región de Marte?','¿Qué llevaba dentro su laboratorio marciano?','¿Qué quedó de tu misión después del silencio?'],
 sojourner:['¿Qué podía descubrir un rover tan pequeño?','¿Cómo protegía su cerebro del frío de Marte?','¿Por qué necesitabas a Pathfinder para hablar con nosotros?'],
 spirit:['¿Cómo leía Spirit el pasado en las rocas?','¿Cómo se coordinaban sus ruedas y sus instrumentos?','¿Cómo llegó el silencio durante aquel invierno?'],
 opportunity:['¿Qué revelaron sus cámaras sobre el agua de Marte?','¿Cómo resistió mucho más de los 90 soles previstos?','¿Qué ocurrió cuando la tormenta ocultó el Sol?'],
 phoenix:['¿Cómo buscaba hielo bajo el suelo marciano?','¿Qué funcionaba bajo la cubierta de Phoenix?','¿Qué cambió cuando llegó el invierno del norte?'],
 surveyor:['¿Qué nos enseñó la cámara antes de los alunizajes humanos?','¿Cómo alimentaba sus instrumentos sobre la Luna?','¿Qué pasó cuando los astronautas regresaron a visitarte?'],
 eagle:['¿Cómo guio este motor el primer alunizaje humano?','¿Qué unía el computador con el resto de Eagle?','¿Qué parte de ti se quedó en la Luna?'],
 mariner:['¿Qué descubrió el primer orbitador de otro planeta?','¿Cómo coordinaba sus observaciones desde Marte?','¿Sabemos dónde terminó tu viaje?'],
 ds2:['¿Cómo iba a investigar el suelo desde dentro?','¿Para qué servía un cable entre sus dos cuerpos?','¿Qué sabemos de la señal que nunca llegó?'],
 lrv15:['¿Cómo ampliaron cuatro ruedas la exploración lunar?','¿Dónde guardaba la energía el primer rover Apollo?','¿Qué recuerdan tus huellas en Hadley–Apennine?'],
 lrv16:['¿Qué permitían explorar sus ruedas en Descartes?','¿Cómo se conectaban las baterías y los motores?','¿Qué quedó de tu recorrido en las tierras altas?'],
 lrv17:['¿Cómo llegaron más lejos los últimos astronautas Apollo?','¿Cómo funcionaba este vehículo eléctrico lunar?','¿Qué historia guardas en Taurus–Littrow?']
};
const mainRelated={orbiter:[['camera'],['avionics','antenna','solar','thermal','sensors','structure'],['propulsion']],viking1:[['biology','camera','sampler','chemistry'],['avionics','rtg','legs','meteorology','propulsion'],['antenna','avionics/memory']],insight:[['seis','sensors','hp3'],['avionics','arm','antenna','legs','propulsion'],['solar']]};

/** Every mission has its own story and canonical component targets. */
export function getNomadMissionData(mission){
 const archive=getMissionStory(mission),main=mainStories[mission.id];
 const cards=main?.cards||archive.chapters.map((chapter,index)=>({
  question:otherQuestions[mission.id]?.[index]||'¿Qué nos cuenta '+chapter.title.toLowerCase()+'?',
  component:chapter.component,componentHint:chapter.title,reply:chapter.text,targetKeywords:[chapter.component]
 }));
 return {...archive,greeting:main?.greeting||'¡Hola! Soy Neptunito. '+mission.summary+' Elige una pregunta y descubramos su ingeniería.',
  cards:cards.map((entry,index)=>({...entry,tag:tags[Math.min(index,2)],related:mainRelated[mission.id]?.[index]||archive.chapters[index]?.related||[]}))};
}
