/** Mount the supplied Apollo 17 simulator only while its dialog is open. */
export function createLrv3Demonstrations() {
 const trigger = document.getElementById('lrv3-demo-open');
 const dialog = document.getElementById('lrv3-demo');
 const mount = document.getElementById('lrv3-demo-stage');
 const status = document.getElementById('lrv3-demo-status');
 let viewer, revision = 0;

 function release() {
  revision++;
  viewer?.destruir();
  viewer = null;
  mount.replaceChildren();
 }

 async function open() {
  if (dialog.open) return;
  const request = ++revision;
  status.textContent = 'Preparando las demostraciones…';
  dialog.showModal();
  try {
   const {montarVisorLRV3} = await import('./experiences/lrv3/visor-lrv3.js?v=20261112inspeccion');
   if (request !== revision || !dialog.open) return;
   const instance = await montarVisorLRV3(mount, {calidad: 'media', interfazAbierta: true});
   if (request !== revision || !dialog.open) {
    instance.destruir();
    return;
   }
   viewer = instance;
   status.textContent = 'Elige una demostración o toca una pieza del rover.';
  } catch (error) {
   if (request !== revision || !dialog.open) return;
   mount.replaceChildren();
   status.textContent = /WebGL/i.test(error.message)
    ? 'Las demostraciones requieren un navegador con WebGL 2.'
    : 'El visor de demostraciones no pudo iniciarse. Puedes volver a intentarlo.';
   console.warn('LRV-3:', error.message);
  }
 }

 function close() {
  if (!dialog.open) return;
  release();
  dialog.close();
 }

 trigger.addEventListener('click', open);
 document.getElementById('lrv3-demo-close').addEventListener('click', close);
 dialog.addEventListener('cancel', event => {
  event.preventDefault();
  close();
 });
 return {
  close,
  selectMission(id) {
   close();
   trigger.hidden = id !== 'lrv17';
  }
 };
}
