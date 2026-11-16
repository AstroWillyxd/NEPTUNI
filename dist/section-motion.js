/** Shared choreography for Inicio, Línea de tiempo and Quiénes somos. Each section's staggered
 *  entrance lives in CSS (it replays whenever the section is shown again); this adds the metric
 *  count-up on arrival and reveals the listed elements as they scroll into view. */
const ease=t=>1-Math.pow(1-t,3);
const pad=value=>String(value).padStart(2,'0');

export function createSectionMotion(section,{reveal=''}={}){
 if(!section)return {enter(){}};
 const media=matchMedia('(prefers-reduced-motion: reduce)'),counters=[...section.querySelectorAll('[data-count]')];
 let countFrame=0;
 // The real value stays in the markup until the first animation frame, so nothing reads "00"
 // if frames never run (hidden tab, tests, reduced motion).
 function count(){
  if(!counters.length)return;
  if(countFrame)cancelAnimationFrame(countFrame);countFrame=0;
  for(const counter of counters)counter.textContent=pad(counter.dataset.count);
 }
 if(reveal&&!media.matches&&typeof IntersectionObserver==='function'){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{rootMargin:'0px 0px -8% 0px',threshold:.06});
  for(const element of section.querySelectorAll(reveal)){element.dataset.reveal='';observer.observe(element);}
 }
 return {enter:count};
}
