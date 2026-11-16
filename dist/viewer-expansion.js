/** Native fullscreen for the 3D viewport, with a page-only expansion fallback. */
export function createViewerExpansion(viewport,button,doc=document){
 let fallback=false,busy=false,previousOverflow='',request=0;
 const expanded=()=>doc.fullscreenElement===viewport||fallback;
 function sync(){const value=expanded();button.textContent=value?'Reducir visor':'Ampliar visor';button.setAttribute('aria-pressed',String(value));button.title=value?'Volver al tamaño anterior. También puedes pulsar Escape.':'Ampliar el visor y la lista de componentes. Escape permite salir.';button.setAttribute('aria-label',value?'Reducir visor 3D':'Ampliar visor 3D');}
 function pageExpansion(value){if(value===fallback)return;if(value){previousOverflow=doc.body.style.overflow;doc.body.style.overflow='hidden';}else doc.body.style.overflow=previousOverflow;fallback=value;viewport.classList.toggle('viewer-expanded',value);sync();}
 async function close(){request++;pageExpansion(false);if(doc.fullscreenElement===viewport)try{await doc.exitFullscreen();}catch{}sync();}
 async function toggle(){if(busy)return;busy=true;const ticket=++request;try{
  if(expanded())await close();
  else if(doc.fullscreenEnabled&&viewport.requestFullscreen){try{await viewport.requestFullscreen();if(ticket!==request&&doc.fullscreenElement===viewport)await doc.exitFullscreen();}catch{if(ticket===request)pageExpansion(true);}}
  else pageExpansion(true);
 }finally{busy=false;sync();}}
 const escape=e=>{if(e.key==='Escape'&&expanded()){e.stopPropagation();if(fallback){e.preventDefault();pageExpansion(false);}}};
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',sync);doc.addEventListener('keydown',escape,true);sync();
 return {close,get expanded(){return expanded();},destroy(){void close();button.removeEventListener('click',toggle);doc.removeEventListener('fullscreenchange',sync);doc.removeEventListener('keydown',escape,true);}};
}
