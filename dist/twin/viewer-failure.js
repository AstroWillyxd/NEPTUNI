/** Error wording follows the actual failure; no access or GPU cause is guessed. */
export function viewerFailureMessage(error={}){
 const code=error.code||'VIEWER_START_FAILED';
 if(code==='WEBGL_UNAVAILABLE')return {code,heading:'No se pudieron iniciar los gráficos 3D',
  text:error.diagnostics?.webgl1===true?'El navegador permitió WebGL 1, pero no WebGL 2, que necesita este visor. El fallo ocurre antes de descargar el modelo.':'El navegador no pudo crear el contexto WebGL 2 que necesita el visor. El fallo ocurre antes de descargar el modelo.',
  help:'Prueba NEPTUNI en una pestaña independiente. Si ocurre también allí, comprueba la aceleración gráfica de tu navegador. La ficha y las fuentes siguen disponibles.'};
 if(code==='ASSET_ACCESS'||code==='ASSET_HTTP'&&[401,403].includes(error.status))return {code,heading:'No se pudo acceder al archivo 3D',text:'El servidor devolvió '+error.status+' al solicitar este modelo.',help:'Comprueba que has abierto NEPTUNI con la cuenta que tiene acceso. No cambies los permisos del sitio para solucionar un error de gráficos.'};
 if(code==='ASSET_HTTP')return {code,heading:'No se pudo descargar el modelo',text:'El servidor devolvió '+error.status+' al solicitar el archivo 3D.',help:'Puedes comprobar el archivo o volver a intentar cargarlo.'};
 if(code==='ASSET_INVALID')return {code,heading:'La descarga no contiene un modelo completo',text:'La respuesta no es un archivo GLB válido y completo. Podría ser una página de error o una descarga incompleta.',help:'Comprueba el archivo y vuelve a intentar cargarlo.'};
 if(code==='ASSET_TIMEOUT')return {code,heading:'La carga tardó demasiado',text:'La descarga o preparación del modelo no terminó dentro del tiempo disponible.',help:'Comprueba tu conexión y vuelve a intentar cargarlo.'};
 if(code==='SHADER_COMPILATION_FAILED')return {code,heading:'No se pudieron dibujar los materiales',text:'El navegador inició los gráficos, pero falló al compilar un material del modelo.',help:'Esto es un error de renderizado, no una denegación de acceso. Puedes comprobar el archivo y reintentar el visor.'};
 if(code==='WEBGL_CONTEXT_LOST')return {code,heading:'Se interrumpió la conexión gráfica',text:'El navegador perdió el contexto gráfico durante la visualización.',help:'El visor se reanudará si el navegador recupera los gráficos. También puedes reintentarlo.'};
 return {code,heading:'No se pudo mostrar esta reconstrucción',text:'La ficha y las fuentes siguen disponibles mientras se comprueba el visor.',help:'Puedes comprobar el archivo del modelo o reintentar el visor.'};
}
