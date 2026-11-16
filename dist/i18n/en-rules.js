// NEPTUNI · English · frases con partes variables.
// Cada regla es [expresión, traducción]. La traducción recibe la coincidencia y tx(), que traduce
// una parte (nombre de pieza, destino, tema…) con el mismo diccionario.
const n = (x, one, many) => Number(x) === 1 ? one : many;
// Para reglas genéricas («Ver …», «Abrir …»): si la parte variable sigue en español, la regla renuncia.
const ES = /[áéíóúñ¿¡]|\b(el|la|los|las|del|de|que|una|con|para|por|más|y|en)\b/i;
const part = (tx, s) => { const r = tx(s); return r === s && ES.test(s) ? null : r; };
const lead = (word) => (m, tx) => { const r = part(tx, m[1]); return r == null ? null : `${word} ${r}`; };
const MES = {ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec'};
const M = '(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)';
export const rules = [
  // Fechas y coordenadas de las fichas
  [new RegExp(`^(\\d{1,2}) ${M} (\\d{4})(.*)$`), (m, tx) => `${MES[m[2]]} ${m[1]}, ${m[3]}${m[4] ? ' ' + tx(m[4].trim()) : ''}`],
  [new RegExp(`^${M} (\\d{4})$`), m => `${MES[m[1]]} ${m[2]}`],
  [/^([\d.,]+)° O\b(.*)$/, (m, tx) => `${m[1]}° W${m[2] ? ' ' + tx(m[2].trim()) : ''}`],
  [/^(.+) \(sitio aprox\.\)$/, m => `${m[1]} (approx. site)`],
  [/^\(sitio aprox\.\)$/, () => '(approx. site)'],
  [/^\(NASA\)$/, () => '(NASA)'],
  [/^sitio (Apollo \d+)$/, m => `${m[1]} site`],
  [/^(\d+) soles?$/, m => `${m[1]} ${n(m[1], 'sol', 'sols')}`],
  // Navegación de la ficha
  [/^Paso (\d+) de (\d+)$/, m => `Step ${m[1]} of ${m[2]}`],
  [/^paso (\d+) de (\d+)$/, m => `step ${m[1]} of ${m[2]}`],
  [/^Paso (\d+)$/, m => `Step ${m[1]}`],
  [/^Hallazgo (\d+)$/, m => `Discovery ${m[1]}`],
  [/^Lectura continua de «(.+)»\.$/, (m, tx) => `Continuous reading of «${tx(m[1])}».`],
  [/^Terminaste «(.+)»\. ¿Seguimos con otro tema\?$/, (m, tx) => `You finished «${tx(m[1])}». Shall we move on to another topic?`],
  [/^Retomamos «(.+)» en el paso (\d+)\.$/, (m, tx) => `Picking «${tx(m[1])}» back up at step ${m[2]}.`],
  [/^«(.+)» · (.+)$/, (m, tx) => `«${tx(m[1])}» · ${tx(m[2])}`],
  [/^Este es (.+)$/, (m, tx) => `This is ${tx(m[1])}`],
  [/^Te presento los sistemas principales de (.+)\. Mira cómo se ilumina cada uno en el modelo\.$/, (m, tx) => `Here are the main systems of ${tx(m[1])}. Watch each one light up on the model.`],
  [/^(.+)\. Gira el modelo para verla desde otro lado\.$/, (m, tx) => `${tx(m[1])}. Spin the model to see it from another side.`],
  [/^\(?(\d+)\)?$/, m => m[0]],
  [/^· (.+)$/, (m, tx) => `· ${tx(m[1])}`],
  [/^(.+?) ·$/, (m, tx) => `${tx(m[1])} ·`],
  [/^(\d+) · (.+)$/, (m, tx) => `${m[1]} · ${tx(m[2])}`],

  [/^(.+) \(visto\)$/, (m, tx) => `${tx(m[1])} (seen)`],
  [/^Te presento los sistemas principales de (.+)\.$/, (m, tx) => `Here are the main systems of ${tx(m[1])}.`],
  [/^(Quedó en el lugar|Regresó a la Tierra|Se conserva en el archivo) (.+)$/, (m, tx) => `${tx(m[1])} ${tx(m[2])}`],
  [/^(.+?) (3D\. Arrastra para orbitar\..+)$/, (m, tx) => `${m[1]} ${tx(m[2])}`],

  // Inicio y catálogo
  [/^(\d+) misi(?:ón|ones)$/, m => `${m[1]} ${n(m[1], 'mission', 'missions')}`],
  [/^(\d{4})–(\d{4}) · (\d+) misi(?:ón|ones)$/, m => `${m[1]}–${m[2]} · ${m[3]} ${n(m[3], 'mission', 'missions')}`],
  [/^(\d{4}) · (\d+) misi(?:ón|ones)$/, m => `${m[1]} · ${m[2]} ${n(m[2], 'mission', 'missions')}`],
  [/^(\d+) de (\d+): (.+)$/, (m, tx) => `${m[1]} of ${m[2]}: ${tx(m[3])}`],
  [/^Explorar misión (.+)$/, (m, tx) => `Explore mission ${tx(m[1])}`],
  [/^Abrir misión (.+)$/, (m, tx) => `Open mission ${tx(m[1])}`],
  [/^Abrir la ficha de (.+), (\d{4}), (.+)$/, (m, tx) => `Open the page for ${tx(m[1])}, ${m[2]}, ${tx(m[3])}`],
  [/^Abrir la ficha de (.+), (\d{4})$/, (m, tx) => `Open the page for ${tx(m[1])}, ${m[2]}`],
  [/^de (\d{4}) a (\d{4})$/, m => `from ${m[1]} to ${m[2]}`],
  [/^Ver (.+)$/, lead('See')],
  [/^(Foto|Ilustración): (.+)$/, (m, tx) => `${m[1] === 'Foto' ? 'Photo' : 'Illustration'}: ${m[2]}`],
  [/^Archivo GLB accesible · ([\d.,]+) MB$/, m => `GLB file reachable · ${m[1]} MB`],

  // Cazador de sistemas y postal
  [/^Escaneando… (\d+)%$/, m => `Scanning… ${m[1]}%`],
  [/^(\d+) sistemas principales$/, m => `${m[1]} main systems`],
  [/^de (.+)\. Suma uno cada vez que abres un sistema nuevo en el modelo\. La lectura continua no suma: ahí eliges tú qué abrir\.$/,
    (m, tx) => `of ${tx(m[1])}. You add one each time you open a new system on the model. Continuous reading doesn't count: there you choose what to open.`],
  [/^Pista: (.+)\.$/, (m, tx) => `Clue: ${tx(m[1])}.`],
  [/^Pista: (.+)$/, (m, tx) => `Clue: ${tx(m[1])}`],
  [/^Descubriste los (\d+) sistemas de (.+)\. ¡Ya eres parte del equipo de arqueología espacial!$/,
    (m, tx) => `You discovered all ${m[1]} systems of ${tx(m[2])}. You're now part of the space archaeology team!`],
  [/^(.+) · (\d+)\/(\d+)$/, (m, tx) => `${tx(m[1])} · ${m[2]}/${m[3]}`],
  [/^(\d+)\/(\d+) sistemas descubiertos$/, m => `${m[1]}/${m[2]} systems discovered`],

  // Fichas técnicas de componentes
  [/^Ampliar referencia de (.+)$/, (m, tx) => `Enlarge the reference for ${tx(m[1])}`],
  [/^Ampliar (.+)$/, lead('Enlarge')],
  [/^(.*?) ?Fuente: NASA\. Recorte y rotación para facilitar la lectura; el dibujo histórico no se modifica\.$/,
    (m, tx) => `${m[1] ? tx(m[1]) + ' ' : ''}Source: NASA. Cropped and rotated for easier reading; the historic drawing is not altered.`],
  [/^(.*?) ?Fuente: NASA\/JPL; figura del documento histórico\. Conversión a WebP sin alterar el contenido\.$/,
    (m, tx) => `${m[1] ? tx(m[1]) + ' ' : ''}Source: NASA/JPL; figure from the historic document. Converted to WebP without altering the content.`],
  [/^Componente y función: documentados por NASA\. (.+)$/, (m, tx) => `Component and function: documented by NASA. ${tx(m[1])}`],
  [/^Componente y función: documentados por NASA\.$/, () => 'Component and function: documented by NASA.'],
  [/^: (.+)$/, (m, tx) => `: ${tx(m[1])}`],
  [/^\((.+); no modelado\)$/, (m, tx) => `(${tx(m[1])}; not modeled)`],
  [/^Despliegue del IDD por movimientos de una articulación \((.+)\) y colocación de (.+) sobre una roca\. Holgura mínima calculada: (.+) mm\. Tiempo educativo\.$/,
    (m, tx) => `IDD deployment moving one joint at a time (${tx(m[1])}) and placing ${tx(m[2])} on a rock. Minimum computed clearance: ${m[3]} mm. Educational timing.`],
  [/^No hay una trayectoria verificada para (.+)\.?$/, (m, tx) => `There is no verified trajectory for ${tx(m[1].replace(/\.$/, ''))}.`],
  [/^Giro en el sitio: direcciones de (.+?) y tracción proporcional al radio de cada rueda\. Demostración cinemática educativa\.$/,
    (m, tx) => `Turn in place: steering at ${tx(m[1])} and drive proportional to each wheel's radius. Educational kinematic demonstration.`],
  [/^(.+)\. El destino real de Scott y Amundsen no se confirmó: (.+)$/, (m, tx) => `${tx(m[1])}. The real fate of Scott and Amundsen was never confirmed: no signal was received after the planned arrival on December 3, 1999, and neither the exact site nor the cause of the loss is known. The part separations are educational: they do not show the deployment, the impact or any maintenance.`],
  [/^No se pudo descargar el modelo \((.+)\)\.?$/, m => `The model could not be downloaded (${m[1]}).`],
  [/^El servidor devolvió (.+) al solicitar este modelo\.$/, m => `The server returned ${m[1]} when this model was requested.`],
  [/^El servidor devolvió (.+) al solicitar el archivo 3D\.$/, m => `The server returned ${m[1]} when the 3D file was requested.`],
  [/^(.+) · componente tras otra pieza$/, (m, tx) => `${tx(m[1])} · component behind another part`],
  [/^Seleccionar componente de (.+)$/, (m, tx) => `Select a component of ${tx(m[1])}`],

  // Demostraciones del LRV-3
  [/^Motor de tracción (.+)$/, (m, tx) => `Drive motor ${tx(m[1])}`],
  [/^Motor de dirección (.+)$/, (m, tx) => `Steering motor ${tx(m[1])}`],
  [/^Celda (\d+) de 19 \(batería interna\)$/, m => `Cell ${m[1]} of 19 (internal battery)`],
  [/^Celda (\d+) de (\d+)$/, m => `Cell ${m[1]} of ${m[2]}`],
  [/^Borne ([+−]) · celda (\d+)$/, m => `Terminal ${m[1]} · cell ${m[2]}`],
  [/^Celda primaria de plata-zinc \(~1\.5–1\.6 V\)\. En serie con las demás forma los 36 V nominales; (.+)$/, (m, tx) => `A primary silver-zinc cell (~1.5–1.6 V). In series with the others it makes up the nominal 36 V; ${tx(m[1])}`],
  [/^su borne \+ va al bloque de salida\.$/, () => 'its + terminal goes to the output block.'],
  [/^(.+) · bloque de bornes$/, (m, tx) => `${tx(m[1])} · terminal block`],
  [/^Circuito integrado · (.+)$/, (m, tx) => `Integrated circuit · ${tx(m[1])}`],
  [/^Transistor de potencia · (.+)$/, (m, tx) => `Power transistor · ${tx(m[1])}`],
  [/^Relé de sentido · motor (.+)$/, m => `Direction relay · motor ${m[1]}`],
  [/^Etapa de potencia del motor (.+): transistores conmutados por el PWM, con límite de corriente\. Forma y ubicación inferidas\.$/, m => `Power stage of motor ${m[1]}: transistors switched by the PWM, with a current limit. Shape and location inferred.`],
  [/^Bus ([A-D]): alimentado por la batería (\d) \(CB(\d+)\)\. Cada carga se conecta a un bus u otro con su selector: las baterías nunca quedan en serie\. Barra colectora representativa\.$/,
    m => `Bus ${m[1]}: powered by battery ${m[2]} (CB${m[3]}). Each load connects to one bus or the other with its selector: the batteries are never in series. Representative bus bar.`],
  [/^(.+) \(control térmico\)$/, m => `${m[1]} (thermal control)`],
  [/^Segmento de filtro (\d+) de la rueda \(número de segmentos inferido\)\.$/, m => `Wheel filter segment ${m[1]} (number of segments inferred).`],
  [/^(.+) dibujo (\S+) (.+)$/, m => `${m[1]} drawing ${m[2]} ${m[3]}`],
  [/^Doble Ackermann \(delantera y trasera opuestas\): (.+) \(máx\. 50° interior \/ 22° exterior\)\. Brazos paralelos con barras de torsión: \+6 \/ −4 in\. Ritmo didáctico\.$/,
    m => `Double Ackermann (front and rear opposite): ${m[1].replace(/\bDI\b/g, 'FL').replace(/\bDD\b/g, 'FR').replace(/\bTI\b/g, 'RL').replace(/\bTD\b/g, 'RR')} (max. 50° inner / 22° outer). Parallel arms with torsion bars: +6 / −4 in. Teaching pace.`],
  [/^GCTA comandada desde Houston: pan (.+?)° \(3\.03°\/s, límites \+134° \/ −214°\) · tilt (.+?)° \(3\.12°\/s, \+85° \/ −45°\)\. La rueda de filtros gira aquí a 30°\/s sólo para que se vea\.$/,
    m => `GCTA commanded from Houston: pan ${m[1]}° (3.03°/s, limits +134° / −214°) · tilt ${m[2]}° (3.12°/s, +85° / −45°). The filter wheel turns at 30°/s here only so you can see it.`],
  [/^Cámara → TCU → LCRU \(transceptor FM de banda S\) → HGA → Tierra\. Rover detenido; la HGA se apunta a mano con su mira, no sigue a la Tierra sola(?: \(desvío del eje en esta escena: (.+?)°\))?\. Los comandos de Houston suben por la misma antena \(subportadora de 70 kHz\)\.$/,
    m => `Camera → TCU → LCRU (S-band FM transceiver) → HGA → Earth. Rover stopped; the HGA is pointed by hand with its sight, it doesn't track Earth on its own${m[1] ? ` (axis offset in this scene: ${m[1]}°)` : ''}. Houston's commands come up through the same antenna (70 kHz subcarrier).`],

  // Juego «Control desde la Tierra»
  [/^Día (\d+) de (\d+)$/, m => `Day ${m[1]} of ${m[2]}`],
  [/^(.+) analizada$/, m => `${m[1]} analyzed`],
  [/^(\d+) de 3 estrellas$/, m => `${m[1]} of 3 stars`],
  [/^Órdenes enviadas en este día: (\d+)$/, m => `Commands sent today: ${m[1]}`],
  [/^(.+) Usaste (\d+) órdenes; lo mínimo posible era (\d+)\.$/, (m, tx) => `${tx(m[1])} You used ${m[2]} commands; the minimum possible was ${m[3]}.`],
  [/^(\d+) de 9 estrellas · (\d{1,2}) de (\p{L}+) de (\d{4})$/u, m => {
    const MESES = {enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', setiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December'};
    return `${m[1]} of 9 stars · ${MESES[m[3]] || m[3]} ${m[2]}, ${m[4]}`;
  }],
  [/^Abrir (.+)$/, lead('Open')],
  [/^Cazador de sistemas: (\d+) de (\d+) descubiertos\. Ver la lista$/, m => `System hunter: ${m[1]} of ${m[2]} discovered. See the list`]
];
