import {tr} from './nx-i18n.js?v=20261125v12';   // traduce estos datos al inglés cuando corresponde
// NEPTUNI · Contexto breve para cada ficha.
// Responde, en pocas palabras: ¿por qué enviaron la misión?, ¿por qué fue un hito? y, en cada
// descubrimiento, ¿por qué lo investigaban? y ¿por qué fue importante?
// `findings` va en el mismo orden que `findings` de nx-ficha-data.js. `star` marca el gran hito (confeti).
const f = (why, hito, star = false) => ({why, hito, star});

export const fichaContext = {
  insight: {
    why: 'Nadie había mirado dentro de Marte. Conocer sus capas ayuda a entender cómo nacen los planetas rocosos, como la Tierra.',
    hito: 'Fue la primera misión dedicada a estudiar el interior profundo de otro planeta, con un sismómetro puesto directamente sobre el suelo marciano.',
    findings: [
      f('Las ondas de un sismo atraviesan el planeta y cambian según el material que cruzan: funcionan como una radiografía.', 'Demostró que Marte sigue activo por dentro. El mayor martemoto, en mayo de 2022, fue de magnitud 4,7.', true),
      f('El tamaño de cada capa cuenta cómo se formó y se enfrió el planeta.', 'Los datos indicaron que el núcleo de Marte es líquido. Una estimación inicial dio unos 1830 km de radio; el tamaño inferido depende del modelo usado y estudios posteriores lo revisaron.'),
      f('Contar los cráteres nuevos dice con qué frecuencia caen rocas del espacio.', 'Un impacto de 2021 dejó ver hielo muy cerca del ecuador, un recurso útil para futuras misiones con personas.')
    ]
  },
  phoenix: {
    why: 'Desde la órbita, la nave Mars Odyssey había detectado mucho hidrógeno bajo el suelo del norte: probablemente hielo. Phoenix fue a tocarlo y a estudiar si ese lugar pudo ser habitable.',
    hito: 'Fue la primera nave que aterrizó en una región polar de Marte y la primera que tocó y analizó hielo de agua en otro planeta.',
    findings: [
      f('Odyssey vio la señal desde arriba, pero faltaba confirmarla en el suelo.', 'Unos trozos brillantes de una zanja desaparecieron en pocos días: el hielo se había evaporado al sol. Luego el horno TEGA detectó el vapor de agua.', true),
      f('El laboratorio MECA mezcló suelo con agua para conocer su química, como un análisis de tierra de jardín.', 'El perclorato es tóxico para nosotros, pero algunos microbios de la Tierra lo usan como energía. También cambió cómo se leen los resultados de las Viking.'),
      f('Al calentar el suelo en el horno, el carbonato suelta dióxido de carbono a una temperatura conocida.', 'En la Tierra, el carbonato de calcio se forma con agua líquida: el suelo marciano pudo mojarse de vez en cuando.'),
      f('El LIDAR, un láser que apuntaba al cielo, medía nubes y polvo.', 'Fue la primera vez que se vio nieve cayendo en Marte. Se evaporaba antes de tocar el suelo.')
    ]
  },
  opportunity: {
    why: 'Desde la órbita se había visto hematita gris en Meridiani Planum. Ese mineral suele formarse con agua, así que Opportunity fue a comprobar si Marte tuvo agua líquida.',
    hito: 'Junto con Spirit, demostró que el Marte antiguo tuvo agua. Además, estaba pensado para 90 soles y funcionó más de 5000.',
    findings: [
      f('La hematita era la pista vista desde la órbita: por eso aterrizó justo ahí.', 'Encontró «arándanos»: esferitas de hematita que crecieron dentro de rocas empapadas de agua.'),
      f('Las rocas del cráter Eagle tenían capas finas y minerales como la jarosita.', 'La jarosita solo se forma en agua. En 2004, NASA anunció que ese lugar estuvo empapado hace mucho tiempo.', true),
      f('Andar más lejos le permitía llegar a rocas más antiguas, como las del borde del cráter Endeavour.', 'En 2014 superó a Lunojod 2 y se convirtió en el vehículo que más había recorrido fuera de la Tierra.'),
      f('Se esperaba que el polvo tapara sus paneles en pocos meses.', 'Los vientos marcianos limpiaban sus paneles de vez en cuando. Esa resistencia enseñó a planear misiones mucho más largas.')
    ]
  },
  spirit: {
    why: 'El cráter Gusev parecía el fondo de un antiguo lago, porque un cauce seco desemboca en él. Spirit fue a leer sus rocas para buscar huellas de agua.',
    hito: 'Fue el primer rover que subió a la cima de una colina en otro planeta: la colina Husband, a más de 100 m sobre la llanura.',
    findings: [
      f('Una de sus ruedas se trabó y, al arrastrarla, removió el suelo y dejó ver lo que había debajo.', 'La sílice tan pura se forma en aguas termales o vapor volcánico. En la Tierra, esos lugares están llenos de vida microscópica.', true),
      f('Los científicos buscaban carbonatos desde hacía años: se esperaban si Marte tuvo agua poco ácida.', 'Las rocas «Comanche» tenían mucho carbonato: el agua del Marte antiguo no siempre fue ácida.'),
      f('Juntando la sílice y los carbonatos se puede reconstruir cómo era el ambiente.', 'Mostró que en Marte hubo lugares con agua tibia. Eso no prueba que hubiera vida.'),
      f('El plan era recorrer unos 600 metros en 90 soles.', 'En 2009 quedó atrapado en arena blanda y siguió trabajando como estación fija hasta 2010.')
    ]
  },
  ds2: {
    why: 'Querían probar sondas pequeñas y baratas que se clavan en el suelo. Si funcionaban, muchas podrían formar una red de estaciones por todo Marte.',
    hito: 'Su pérdida, junto con la de Mars Polar Lander, llevó a NASA a revisar cómo probaba sus naves antes del lanzamiento.',
    findings: [
      f('Las sondas no podían comunicarse durante la caída: solo después de clavarse en el suelo.', 'Sin señal, no hubo datos. Por eso hoy las misiones intentan enviar información durante el descenso.'),
      f('Nadie las vio caer y no había cámaras en la zona.', 'Es un recordatorio de que explorar implica riesgos: no todas las misiones llegan.'),
      f('Eran parte del programa New Millennium, que probaba tecnologías nuevas antes de usarlas en misiones científicas.', 'Las ideas de miniaturizar instrumentos y resistir golpes fuertes siguieron usándose en otros proyectos.')
    ]
  },
  sojourner: {
    why: 'Querían demostrar que se podía aterrizar en Marte con poco presupuesto, usando bolsas de aire, y manejar un rover a millones de kilómetros.',
    hito: 'Sojourner fue el primer rover que recorrió con éxito otro planeta. Abrió el camino de Spirit, Opportunity, Curiosity y Perseverance.',
    findings: [
      f('El APXS lanzaba partículas a la roca y medía los rayos X que devolvía: cada elemento químico tiene su propia «firma». Querían saber de qué estaban hechas las rocas de Ares Vallis.', 'Barnacle Bill tenía mucha sílice, como algunas rocas volcánicas de la Tierra. Fue una sorpresa: Marte tuvo volcanes más variados de lo que se creía.', true),
      f('Ares Vallis fue una zona de inundaciones gigantes: el agua arrastró rocas desde muchos lugares.', 'Las fotos mostraron rocas redondeadas e inclinadas en la misma dirección, como las que deja una gran inundación.'),
      f('Los satélites miden desde muy lejos; hace falta comparar con lo que hay en el suelo.', 'Sirvió para calibrar los mapas tomados desde la órbita y entenderlos mejor.'),
      f('Era sobre todo una prueba de ingeniería, con un rover de solo 10,5 kg.', 'Su suspensión de seis ruedas, rocker-bogie, se sigue usando en los rovers actuales.')
    ]
  },
  viking2: {
    why: 'Las misiones Viking buscaban responder una gran pregunta: ¿hay vida en Marte? Viking 2 aterrizó lejos de Viking 1, más al norte, para comparar dos lugares.',
    hito: 'Con Viking 1, fue la primera misión de Estados Unidos que aterrizó y trabajó con éxito en Marte durante años.',
    findings: [
      f('Medir el clima en dos lugares lejanos ayuda a entender el clima de todo el planeta.', 'En invierno fotografió escarcha sobre el suelo: una capa finísima de hielo en Utopia Planitia.', true),
      f('Si había microbios, se comerían los nutrientes de prueba o soltarían gases.', 'Los resultados confusos mostraron que el suelo marciano es químicamente muy reactivo. Hoy se busca primero dónde hubo agua y moléculas orgánicas.'),
      f('Usaba generadores nucleares (RTG), que no dependen de la luz del Sol.', 'Funcionó unos tres años y medio en lugar de tres meses.')
    ]
  },
  viking1: {
    why: 'Viking 1 debía buscar señales de vida y estudiar el suelo y el clima de Marte desde la superficie.',
    hito: 'Fue la primera nave de Estados Unidos en aterrizar con éxito en Marte. Su récord de tiempo en la superficie duró hasta 2010.',
    findings: [
      f('Por primera vez se podía ver de cerca el suelo y el cielo de Marte.', 'Mostró un paisaje rojizo lleno de rocas y un cielo de color ocre por el polvo, no azul como el nuestro.', true),
      f('En un experimento le dieron al suelo nutrientes con carbono «marcado» para ver si algo los comía.', 'Hubo una señal positiva, pero otro instrumento no halló moléculas orgánicas. El debate sigue abierto.'),
      f('Sus generadores nucleares (RTG) daban energía día y noche.', 'Trabajó más de seis años. Opportunity superó ese récord recién en 2010.')
    ]
  },
  lrv17: {
    why: 'Apollo 17 fue al valle Taurus–Littrow a buscar rocas volcánicas jóvenes y rocas muy antiguas de las montañas. El rover permitía ir más lejos y cargar más muestras.',
    hito: 'Fue la última misión Apollo a la Luna. Harrison Schmitt fue el primer geólogo que caminó en la Luna y trajeron unos 110 kg de muestras, el récord del programa.',
    findings: [
      f('Las rocas más interesantes estaban lejos del módulo lunar.', 'Fue la mayor distancia recorrida en todas las misiones Apollo.'),
      f('Schmitt, que era geólogo, notó el color naranja junto al cráter Shorty.', 'Eran gotitas de vidrio de antiguas «fuentes de lava». Mostraron que la Luna tuvo volcanes explosivos y que guarda un poco de agua dentro.', true)
    ]
  },
  lrv16: {
    why: 'Apollo 16 fue la primera misión a las tierras altas, las zonas claras que cubren la mayor parte de la Luna.',
    hito: 'Fue el primer alunizaje en las tierras altas lunares. Trajeron unos 96 kg de muestras.',
    findings: [
      f('Querían llegar a cráteres como North Ray y a las laderas de la montaña Stone.', 'Visitaron más lugares en menos tiempo y trajeron rocas de zonas muy distintas.'),
      f('Vistas desde la Tierra, las tierras altas parecían formadas por volcanes.', 'Casi todo eran rocas rotas y pegadas por impactos. Enseñó a no confiar solo en lo que se ve de lejos.', true)
    ]
  },
  mariner: {
    why: 'Las naves anteriores solo pasaron de largo y vieron un Marte lleno de cráteres, como la Luna. Mariner 9 iba a quedarse en órbita para mapear todo el planeta.',
    hito: 'Fue la primera nave que orbitó otro planeta. Llegó en noviembre de 1971, semanas antes que las naves soviéticas Mars 2 y Mars 3.',
    findings: [
      f('Al llegar, una tormenta de polvo cubría todo Marte y tuvo que esperar semanas a que se despejara.', 'Fue el primer mapa global de Marte y ayudó a elegir dónde aterrizarían las Viking.'),
      f('Nadie esperaba encontrar un cañón así.', 'Mide más de 4000 km de largo: en la Tierra cruzaría todo un continente.', true),
      f('Durante la tormenta solo se veían cuatro manchas oscuras que sobresalían del polvo.', 'Eran volcanes gigantes. Olympus Mons es el más grande conocido del sistema solar: casi tres veces más alto que el Everest.'),
      f('Las lunas de Marte nunca se habían visto de cerca.', 'Los cauces secos mostraron que Marte no siempre fue un desierto seco.')
    ]
  },
  lrv15: {
    why: 'Apollo 15 fue la primera de las misiones Apollo más largas y científicas: tres días en la Luna para explorar la grieta Hadley y las montañas Apeninos.',
    hito: 'Fue la primera vez que personas manejaron un vehículo en la Luna.',
    findings: [
      f('A pie, los astronautas no podían alejarse mucho del módulo lunar por seguridad.', 'Visitaron más lugares y trajeron unos 77 kg de muestras.', true),
      f('Buscaban un trozo de la corteza original de la Luna.', 'La roca tiene más de 4000 millones de años y apoyó la idea de que la Luna joven estuvo cubierta por un océano de roca fundida.')
    ]
  },
  eagle: {
    why: 'El objetivo era llevar personas a la Luna, traerlas de vuelta a salvo y recoger las primeras muestras lunares.',
    hito: 'Fueron las primeras personas en caminar sobre otro mundo. Cientos de millones de personas lo vieron en vivo por televisión.',
    findings: [
      f('Era la primera vez que se podía estudiar la Luna en un laboratorio de la Tierra.', 'Las muestras se repartieron entre científicos de muchos países y todavía se estudian.', true),
      f('Saber la edad y la composición de la Luna dice cómo se formó.', 'Su parecido químico con la Tierra apoya la idea de que la Luna nació de un gran choque contra la Tierra joven.'),
      f('Desde la Tierra se dispara un láser al reflector y se mide cuánto tarda la luz en volver.', 'Es el único experimento de Apollo 11 que todavía funciona.')
    ]
  },
  surveyor: {
    why: 'Antes de enviar astronautas, NASA necesitaba saber si el suelo lunar aguantaría una nave o si esta se hundiría en polvo profundo.',
    hito: 'Fue la primera nave que excavó el suelo de otro mundo. Además, es la única sonda robótica que luego visitaron astronautas.',
    findings: [
      f('Los ingenieros de Apollo necesitaban ver cómo era el terreno.', 'Incluso fotografió un eclipse: la Tierra tapando al Sol, visto desde la Luna.'),
      f('Algunos científicos temían que la Luna estuviera cubierta de polvo muy profundo.', 'Confirmó que una nave con astronautas podía alunizar sin hundirse.', true),
      f('Querían saber cómo envejecen los materiales después de años en el espacio.', 'Se creyó que unas bacterias de la Tierra habían sobrevivido en la cámara. Hoy se piensa que se contaminó al volver.')
    ]
  },
  orbiter: {
    why: 'Para las misiones Apollo había que encontrar lugares lisos y seguros. Desde la Tierra, los telescopios no podían ver rocas pequeñas.',
    hito: 'Fue la primera nave de Estados Unidos en orbitar la Luna.',
    findings: [
      f('Cada sitio candidato debía ser plano y sin rocas grandes.', 'Junto con las otras Lunar Orbiter, ayudó a elegir dónde alunizarían las misiones Apollo.'),
      f('No estaba en el plan principal: los ingenieros giraron la nave para tomarla.', 'Fue la primera vista de la Tierra desde la Luna, dos años antes de la famosa foto de Apollo 8.', true),
      f('Usaba película fotográfica que se revelaba dentro de la nave.', 'En 2008, un proyecto recuperó las cintas originales y restauró las fotos con mucha más calidad.')
    ]
  }
};
tr(fichaContext);
