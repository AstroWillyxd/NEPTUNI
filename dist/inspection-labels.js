import {calloutLayout,calloutPath,uncrossCallouts} from './callout-layout.js?v=20261018a';
/** Stable, shared HTML labels for both technical viewers. No moving tap targets. */
export function computeLabelLayout(entries,{width,height,top=128,bottom=height-230,limit=width<520?3:5,previous=new Map(),stable=false,obstacles=[]}={}){
 const used=[],result=new Map(),pad=12,gap=10;
 for(const entry of entries){
  const old=previous.get(entry.id),bw=Math.min(entry.width,width*.44),bh=entry.height;
  if(result.size>=limit||!entry.inFront||entry.x<0||entry.x>width||entry.y<0||entry.y>height||bottom-top<bh)continue;
  const side=old?.side??(entry.x<width/2?'left':'right'),x=side==='left'?pad:width-bw-pad;
  const desired=Math.max(top,Math.min(bottom-bh,entry.y-bh/2));
  const anchor=old&&(stable||Math.abs(old.y-desired)<48)?Math.max(top,Math.min(bottom-bh,old.y)):desired;
  const candidates=[anchor,desired,top,bottom-bh,...used.flatMap(r=>[r.y+r.h+gap,r.y-bh-gap])];
  const valid=candidates.filter(y=>y>=top&&y+bh<=bottom&&![...used,...obstacles].some(r=>x<r.x+r.w+gap&&x+bw+gap>r.x&&y<r.y+r.h+gap&&y+bh+gap>r.y));
  if(!valid.length)continue;
  const y=valid.sort((a,b)=>Math.abs(a-anchor)-Math.abs(b-anchor))[0],rect={x,y,w:bw,h:bh,side};
  used.push(rect);result.set(entry.id,rect);
 }
 return result;
}

/** Project in CSS pixels relative to the overlay, including canvas offsets and CSS scale. */
export function projectLabelPoint(point,canvasRect,hostRect,width=hostRect.width,height=hostRect.height){
 const sx=width/Math.max(1,hostRect.width),sy=height/Math.max(1,hostRect.height);
 return {x:(canvasRect.left-hostRect.left+(point.x*.5+.5)*canvasRect.width)*sx,y:(canvasRect.top-hostRect.top+(-.5*point.y+.5)*canvasRect.height)*sy};
}
export function computeDotLayout(entries,{width,height}={}){
 const placements=new Map(),used=[];
 for(const e of [...entries].sort((a,b)=>Number(b.selected)-Number(a.selected))){
  if(!e.inFront||e.point?.occluded||e.x<20||e.x>width-20||e.y<30||e.y>height-90)continue;
  if(used.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<42))continue;
  used.push(e);placements.set(e.id,{x:e.x-15,y:e.y-15,w:30,h:30,side:e.x<width/2?'left':'right'});
 }
 return placements;
}
export function createInspectionLabels(host,{onChoose,project,viewport=()=>host,stable=false,isMoving=()=>false,routed=false}={}){
 const labels=document.createElement('div');labels.className='sj-labels';host.append(labels);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('sj-leaders');svg.setAttribute('aria-hidden','true');host.append(svg);
 const wrapper=host.closest('.viewer-wrap');let api;const labelObserver=wrapper?new MutationObserver(()=>api?.layout()):null;labelObserver?.observe(wrapper,{attributes:true,attributeFilter:['class']});
 const items=new Map();let order=[],previous=new Map(),held=null,holdUntil=0,destroyed=false,lastWidth=0,lastHeight=0,selection;
 const key=p=>p.key||p.id;
 const release=()=>{held=null;holdUntil=performance.now()+180;};
 function make(part){
  const id=key(part),button=document.createElement('button'),line=document.createElementNS(svg.namespaceURI,routed?'path':'line');
  button.type='button';button.className='sj-label';button.dataset.component=id;button.hidden=true;
  const dot=routed?document.createElementNS(svg.namespaceURI,'circle'):null;
  if(dot){dot.setAttribute('r','2.1');svg.append(dot);}
  const item={part,button,line,dot};items.set(id,item);labels.append(button);svg.append(line);
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')held=id;});
  button.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&held===id)release();});
  button.addEventListener('pointerdown',e=>{e.stopPropagation();held=id;button.setPointerCapture?.(e.pointerId);});
  button.addEventListener('pointerup',e=>{e.stopPropagation();release();});
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',()=>{if(held===id)release();});
  button.addEventListener('focus',()=>{held=id;});button.addEventListener('blur',release);
  button.addEventListener('click',e=>{e.stopPropagation();release();onChoose(key(item.part));});
  return item;
 }
 return api={
  set(parts,selected){
   if(destroyed)return;selection=selected;order=parts.map(key);const wanted=new Set(order);
   for(const [id,item]of items)if(!wanted.has(id)){item.button.remove();item.line.remove();item.dot?.remove();items.delete(id);previous.delete(id);if(held===id)held=null;}
   for(const part of parts){const item=items.get(key(part))||make(part);item.part=part;item.button.textContent=part.name;item.button.title=part.name;item.button.setAttribute('aria-label','Inspeccionar '+part.name);item.button.setAttribute('aria-pressed',String(key(part)===selected));}
  },
  layout(){
   if(destroyed)return;const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
   const hostRect=host.getBoundingClientRect(),canvasRect=viewport()?.getBoundingClientRect(),rect=canvasRect?.width&&canvasRect?.height?canvasRect:hostRect;
   const entries=order.map((id,index)=>{const item=items.get(id),point=project(item.part);item.button.hidden=false;
    if(routed)item.button.style.maxWidth=Math.min(184,width<700?width*.30:width*.23)+'px';
    return{id,order:index,selected:id===selection,point,...projectLabelPoint(point,rect,hostRect,width,height),inFront:point.z<1&&point.z>-1,width:item.button.offsetWidth,height:item.button.offsetHeight};});
   const measured=entries.every(e=>!previous.has(e.id)||Math.abs(previous.get(e.id).w-e.width)<.5&&Math.abs(previous.get(e.id).h-e.height)<.5);
   const locked=width===lastWidth&&height===lastHeight&&(!routed||measured)&&((held&&items.has(held))||performance.now()<holdUntil||stable&&isMoving());lastWidth=width;lastHeight=height;
   const compact=host.querySelector('.sj-tools-compact');
   let top=routed?112:width<760?130:133,bottom=height-(routed?96:compact?100:width<760?235:214);
   for(const selector of ['.sj-selector','.sj-tools','.viewer-bottom','.scene-background-credit']){
    const element=(selector==='.viewer-bottom'||selector==='.scene-background-credit'?host.closest('.viewer-wrap')||host.parentElement:host).querySelector(selector);if(!element||element.hidden)continue;
    const r=element.getBoundingClientRect();if(!r.height||!r.width)continue;
    if(selector==='.sj-selector'||selector==='.sj-tools'&&compact)top=Math.max(top,r.bottom-hostRect.top+12);else bottom=Math.min(bottom,r.top-hostRect.top-12);
   }
   const popup=host.querySelector('.sj-tools-menu[open] .sj-tools-options'),r=popup?.getBoundingClientRect();
   const obstacles=r?.width&&r?.height?[{x:r.left-hostRect.left,y:r.top-hostRect.top,w:r.width,h:r.height}]:[];
   const minimal=wrapper&&!wrapper.classList.contains('show-part-labels');
   const placements=minimal?computeDotLayout(entries,{width,height}):locked&&previous.size&&!obstacles.length?previous:routed?uncrossCallouts(entries,calloutLayout(entries,{width,height,top,bottom,previous,obstacles}),{width,obstacles}):computeLabelLayout(entries,{width,height,top,bottom,previous,stable,obstacles});
   for(const entry of entries){const {button,line,dot}=items.get(entry.id),rect=placements.get(entry.id);button.hidden=!rect;line.style.display=rect?'':'none';if(dot)dot.style.display=rect?'':'none';if(!rect)continue;
    button.style.transform=`translate3d(${Math.round(rect.x)}px,${Math.round(rect.y)}px,0)`;
    if(routed){line.setAttribute('d',calloutPath(entry,rect));line.setAttribute('stroke-dasharray',entry.point.occluded?'3 4':'');dot.setAttribute('cx',entry.x);dot.setAttribute('cy',entry.y);button.dataset.occluded=String(!!entry.point.occluded);button.title=entry.point.occluded?button.textContent+' · componente tras otra pieza':button.textContent;}
    else {line.setAttribute('x1',entry.x);line.setAttribute('y1',entry.y);line.setAttribute('x2',rect.side==='left'?rect.x+rect.w:rect.x);line.setAttribute('y2',rect.y+rect.h/2);}
   }
   if(!locked)previous=placements;
  },
  destroy(){destroyed=true;labelObserver?.disconnect();items.clear();labels.remove();svg.remove();}
 };
}
