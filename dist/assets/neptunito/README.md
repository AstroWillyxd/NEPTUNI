# Neptunito

`poses.png` contiene tres poses estáticas y se usa en la portada y como
respaldo en las fichas. Los fotogramas de entrada, caminata y gestos están
en `dist/neptunito-anim/assets/`. El panel de cada misión usa el módulo
`dist/mission-guide.js` y los textos originales de `dist/mission-dialogues.js`.

## Grabaciones de voz

Para usar un MP3 de ElevenLabs, coloca el archivo en `assets/neptunito/voz/`
dentro de `dist/` y registra su ruta en `media.json`. La clave identifica
el fragmento original de la narración.

```json
{
  "insight-01": {
    "voice": "assets/neptunito/voz/insight-01.mp3"
  }
}
```

El botón **Escuchar** utiliza una voz en español del navegador para la
historia y para los fragmentos sin grabación. Si se estaba reproduciendo
la voz al cambiar de apartado, se detiene y continúa con el nuevo contenido.
Al cambiar de misión, la voz se detiene hasta que se vuelva a pulsar
**Escuchar**.
