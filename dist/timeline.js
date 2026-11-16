import {missions} from './missions.js?v=20261112inspeccion';
const moon='https://science.nasa.gov/moon/missions/';
const mariner='https://science.nasa.gov/mission/mariner-program/mars-mariner-missions/';
const rows=[
['ranger7',1964,'Ranger 7','Luna','31 jul 1964 · impacto','Transmitió imágenes de cerca de la superficie antes de impactar en la Luna.','https://science.nasa.gov/mission/ranger-7/'],
['ranger8',1965,'Ranger 8','Luna','20 feb 1965 · impacto','Obtuvo imágenes para preparar futuras misiones lunares.','https://science.nasa.gov/mission/ranger-8/'],
['ranger9',1965,'Ranger 9','Luna','24 mar 1965 · impacto','Transmitió imágenes de la región del cráter Alphonsus antes del impacto.','https://science.nasa.gov/mission/ranger-9/'],
['mariner4',1965,'Mariner 4','Marte','14 jul 1965 · sobrevuelo','Realizó el primer sobrevuelo exitoso de Marte y transmitió imágenes cercanas del planeta.',mariner],
['surveyor1',1966,'Surveyor 1','Luna','2 jun 1966 · alunizaje','Primer alunizaje suave de Estados Unidos. Investigó las condiciones del terreno.','https://science.nasa.gov/mission/surveyor-1/'],
['orbiter2',1966,'Lunar Orbiter 2','Luna','6 nov 1966 · lanzamiento','Fotografió posibles sitios de alunizaje y otras regiones lunares.','https://science.nasa.gov/mission/lunar-orbiter-2/'],
['orbiter3',1967,'Lunar Orbiter 3','Luna','5 feb 1967 · lanzamiento','Contribuyó a confirmar sitios candidatos para las misiones Apollo.','https://science.nasa.gov/mission/lunar-orbiter-3/'],
['orbiter4',1967,'Lunar Orbiter 4','Luna','4 may 1967 · lanzamiento','Amplió la cobertura fotográfica de la superficie lunar.','https://science.nasa.gov/mission/lunar-orbiter-4/'],
['orbiter5',1967,'Lunar Orbiter 5','Luna','1 ago 1967 · lanzamiento','Completó la serie de cartografía Lunar Orbiter con observaciones de la cara oculta.','https://science.nasa.gov/mission/lunar-orbiter-5/'],
['surveyor5',1967,'Surveyor 5','Luna','11 sep 1967 · alunizaje','Analizó propiedades del suelo de Mare Tranquillitatis.','https://science.nasa.gov/mission/surveyor-5/'],
['surveyor6',1967,'Surveyor 6','Luna','10 nov 1967 · alunizaje','Realizó experimentos en Sinus Medii y un pequeño salto propulsado.','https://science.nasa.gov/mission/surveyor-6/'],
['surveyor7',1968,'Surveyor 7','Luna','10 ene 1968 · alunizaje','Investigó las tierras altas próximas al cráter Tycho.','https://science.nasa.gov/mission/surveyor-7/'],
['apollo8',1968,'Apollo 8','Luna','24 dic 1968 · órbita lunar','Primera misión tripulada que orbitó la Luna. No llevó módulo de alunizaje.','https://www.nasa.gov/mission/apollo-8/'],
['apollo10',1969,'Apollo 10','Luna','Mayo 1969 · ensayo lunar','Probó el módulo lunar en las proximidades de la superficie sin alunizar.','https://www.nasa.gov/mission/apollo-10/'],
['apollo12',1969,'Apollo 12','Luna','19 nov 1969 · alunizaje','Alunizó cerca de Surveyor 3 y recuperó componentes de esa sonda.','https://www.nasa.gov/mission/apollo-12/'],
['mariner6',1969,'Mariner 6','Marte','31 jul 1969 · sobrevuelo','Estudió la superficie y la atmósfera marcianas durante un sobrevuelo.',mariner],
['mariner7',1969,'Mariner 7','Marte','5 ago 1969 · sobrevuelo','Complementó las observaciones de Mariner 6 con otro paso cercano por Marte.',mariner],
['apollo14',1971,'Apollo 14','Luna','5 feb 1971 · alunizaje','Exploró Fra Mauro y desplegó instrumentos científicos.','https://www.nasa.gov/mission/apollo-14/'],
['mgs',1997,'Mars Global Surveyor','Marte','11 sep 1997 · entrada en órbita','Cartografió Marte y estudió su topografía, atmósfera y minerales.','https://science.nasa.gov/mission/mars-global-surveyor/'],
['prospector',1998,'Lunar Prospector','Luna','6 ene 1998 · lanzamiento','Estudió la composición de la superficie y buscó indicios de hielo polar.','https://science.nasa.gov/mission/lunar-prospector/'],
['odyssey',2001,'2001 Mars Odyssey','Marte','24 oct 2001 · entrada en órbita','Investigó los elementos y minerales de Marte y aportó enlaces de comunicaciones.','https://science.nasa.gov/mission/odyssey/'],
['mro',2006,'Mars Reconnaissance Orbiter','Marte','10 mar 2006 · entrada en órbita','Observó Marte en alta resolución y apoyó la selección de sitios de aterrizaje.','https://science.nasa.gov/mission/mars-reconnaissance-orbiter/'],
['lro',2009,'Lunar Reconnaissance Orbiter','Luna','23 jun 2009 · entrada en órbita','Cartografió la Luna y fotografió sitios históricos de exploración.','https://science.nasa.gov/mission/lro/'],
['lcross',2009,'LCROSS','Luna','9 oct 2009 · impactos','Estudió el material expulsado por impactos en la región polar sur para investigar el agua.','https://science.nasa.gov/mission/lcross/'],
['grail',2012,'GRAIL · Ebb y Flow','Luna','2012 · misión científica','Dos sondas midieron variaciones del campo gravitatorio lunar.','https://science.nasa.gov/mission/grail/'],
['curiosity',2012,'Curiosity','Marte','6 ago 2012 · aterrizaje','Investigó la habitabilidad pasada del cráter Gale. Este hito no clasifica al rover como abandonado.','https://science.nasa.gov/mission/msl-curiosity/'],
['ladee',2013,'LADEE','Luna','6 sep 2013 · lanzamiento','Investigó la tenue atmósfera lunar y el ambiente del polvo.','https://science.nasa.gov/mission/ladee/'],
['maven',2014,'MAVEN','Marte','21 sep 2014 · entrada en órbita','Estudió la atmósfera superior y la pérdida de gases al espacio.','https://science.nasa.gov/mission/maven/'],
['perseverance',2021,'Perseverance','Marte','18 feb 2021 · aterrizaje','Llegó al cráter Jezero para investigar ambientes antiguos y recolectar muestras.','https://science.nasa.gov/mission/mars-2020-perseverance/'],
['ingenuity',2021,'Ingenuity','Marte','19 abr 2021 · primer vuelo','Realizó el primer vuelo controlado y propulsado en otro planeta.','https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/'],
['artemis1',2022,'Artemis I','Luna','16 nov 2022 · lanzamiento','La nave Orion realizó una prueba sin tripulación alrededor de la Luna y regresó a la Tierra.','https://www.nasa.gov/mission/artemis-i/']
];
export const timelineEvents=[...missions.map(m=>({...m,date:m.arrival,description:m.summary,inspectId:m.id})),...rows.map(([id,year,name,world,date,description,source])=>({id,year,name,world,date,description,source}))].sort((a,b)=>b.year-a.year);
export const timelineYears=[...new Set(timelineEvents.map(e=>e.year))];
