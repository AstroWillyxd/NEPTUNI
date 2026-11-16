# NEPTUNI · Arqueología espacial

Museo interactivo de arqueología espacial para chicas y chicos de 10 a 14 años. Recorre 15 misiones históricas de la Luna y Marte a través de las máquinas que quedaron allí: sus fotos de archivo, sus piezas en 3D y las historias de los equipos que las construyeron.

Proyecto para el **NASA Space Apps Challenge 2026** · reto *Abandoned but not Forgotten*.

> **English summary.** NEPTUNI is an interactive space-archaeology museum for kids aged 10–14. It presents 15 historic Moon and Mars missions through the hardware left behind: archive photos, explorable 3D reconstructions and short stories told by our guide, Neptunito. The site works in Spanish and English (ES / EN button in the header) and includes a game where you drive Sojourner by sending commands from Earth. See [How to run it](#cómo-abrirlo) below.

## Qué incluye

- **15 misiones** con ficha propia: Apollo 11 · Eagle, Viking 1, Viking 2, Sojourner / Pathfinder, Spirit, Opportunity, Phoenix, InSight, Surveyor 3, Apollo 15 · LRV-1, Apollo 16 · LRV-2, Apollo 17 · LRV-3, Lunar Orbiter 1, Mariner 9 y Deep Space 2.
- **Visor 3D** de cada nave: se puede girar, acercar y abrir por sistemas y piezas. Cada componente indica qué está documentado y qué es una reconstrucción educativa, con enlace a su fuente.
- **Fichas en cuatro temas** (Conoce la nave, La misión, Los hallazgos, Los sistemas), paso a paso o en lectura continua, guiadas por **Neptunito**, que señala en el modelo la pieza de la que habla.
- **Evidencia real**: fotografías de archivo con su tipo (en la Luna, en Marte, pruebas en Tierra…) y su crédito.
- **Juego «Control desde la Tierra»**: planifica las órdenes de Sojourner y envíalas a Marte, como el equipo de Mars Pathfinder. Incluye tutorial y certificado.
- **Español e inglés**, botón «Foto» para crear una postal con la nave y diseño adaptado a celular.
- Accesible con teclado y respetuoso con la opción «reducir movimiento» del sistema.

## Cómo abrirlo

El sitio es estático, pero los módulos y los modelos 3D necesitan servirse desde un servidor local (no funcionan abriendo `index.html` con doble clic).

**Windows:** ejecuta `ABRIR_EN_CHROME.cmd` y deja abierta la ventana del servidor mientras exploras.

**macOS o Linux:** en esta carpeta, ejecuta

```bash
node servidor-local.mjs --no-open
```

y abre en el navegador la dirección que indique la terminal (normalmente `http://127.0.0.1:8197/`).

Requisitos: Node.js 18 o posterior (no hay dependencias de npm) y un navegador con WebGL 2. También puede publicarse la carpeta `dist/` en cualquier hosting estático, por ejemplo GitHub Pages.

Para abrir la página directamente en inglés: `http://127.0.0.1:8197/?lang=en`.

## Estructura

```
dist/
  index.html            página principal (inicio, modelos 3D, fichas y quiénes somos)
  app.js                navegación y carga de cada misión
  fleet-viewer.js       visor 3D (three.js)
  nx-ficha*.js          fichas: temas, pasos y lectura continua
  nx-relatos.js         relatos de las 15 misiones
  nx-guide.js           Neptunito, el guía
  nx-i18n.js            cambio de idioma; textos en inglés en dist/i18n/
  juego/                juego «Control desde la Tierra»
  assets/               modelos 3D (GLB), fotos de archivo y fondos
  vendor/three/         three.js y complementos
servidor-local.mjs      servidor local sin dependencias
ABRIR_EN_CHROME.cmd     acceso directo para Windows
```

## Fuentes y créditos

- Datos, fotografías y documentación técnica: NASA y NASA/JPL-Caltech (NASA Science, NSSDCA, NTRS, Planetary Data System, NASA 3D Resources), además de Smithsonian National Air and Space Museum (CC0) y artículos científicos citados en cada ficha. Cada foto y cada componente enlaza su fuente.
- Los modelos 3D son reconstrucciones educativas basadas en esas fuentes; no son planos de fabricación.
- Bibliotecas: [three.js](https://threejs.org/) (MIT), meshoptimizer (MIT) y `<model-viewer>` (Apache 2.0).
- Tipografías: Chakra Petch y Manrope (SIL Open Font License).

NEPTUNI es un proyecto independiente y no está afiliado a la NASA.

## Equipo

Guillermo Pilares · Anthony Heredia · Thays Cruzado · Gianfranco Tolentino · Mixu Alarcon · Andrés Zelada

Instagram [@neptuni.pe](https://www.instagram.com/neptuni.pe/) · [LinkedIn](https://www.linkedin.com/company/neptuni/) · neptuni.pe@gmail.com
