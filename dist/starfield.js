/** A fixed starfield behind Inicio and Línea de tiempo. It renders only while it is visible,
 *  draws a single still frame for reduced motion, and never receives pointer events. */
const amber=[245,158,11],palette=[[236,242,255],[214,228,255],[178,206,255]];

export function createStarfield(canvas,{count=160}={}){
 const context=canvas?.getContext?.('2d');
 if(!context)return {setActive(){},destroy(){}};
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,ratio=1,frame=0,active=false,destroyed=false,pointerX=0,pointerY=0,easedX=0,easedY=0;
 // Far stars dominate; depth drives size, brightness and parallax distance together.
 const stars=Array.from({length:count},(_,index)=>{const depth=.15+Math.random()**1.8*.85;return {x:Math.random(),y:Math.random(),depth,size:.35+depth*1.25,base:.22+depth*.6,phase:Math.random()*Math.PI*2,speed:.35+Math.random()*1.3,color:index<Math.round(count*.15)?amber:palette[index%palette.length]};});
 function resize(){ratio=Math.min(2,window.devicePixelRatio||1);width=window.innerWidth;height=window.innerHeight;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);if(active)draw(performance.now());}
 function draw(time){
  context.clearRect(0,0,width,height);const still=media.matches,scroll=window.scrollY||0;
  easedX+=(pointerX-easedX)*.045;easedY+=(pointerY-easedY)*.045;
  for(const star of stars){
   const twinkle=still?1:.55+.45*Math.sin(time*.001*star.speed+star.phase),alpha=star.base*twinkle;
   const x=(star.x*width+easedX*star.depth*22+width)%width,y=((star.y*height-scroll*star.depth*.08+easedY*star.depth*16)%height+height)%height;
   const [r,g,b]=star.color;
   if(star.color===amber||star.size>1.2){context.fillStyle=`rgba(${r},${g},${b},${alpha*.16})`;context.beginPath();context.arc(x,y,star.size*3.2,0,Math.PI*2);context.fill();}
   context.fillStyle=`rgba(${r},${g},${b},${alpha})`;context.beginPath();context.arc(x,y,star.size,0,Math.PI*2);context.fill();
  }
 }
 function loop(time){frame=0;if(!active||destroyed||document.hidden)return;draw(time);if(!media.matches)frame=requestAnimationFrame(loop);}
 function start(){if(!frame&&active&&!destroyed&&!document.hidden)frame=requestAnimationFrame(loop);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;}
 const pointer=event=>{pointerX=event.clientX/Math.max(1,width)-.5;pointerY=event.clientY/Math.max(1,height)-.5;};
 const scrolled=()=>{if(media.matches&&active)draw(performance.now());};
 const visibility=()=>{if(document.hidden)stop();else start();};
 const motion=()=>{stop();if(active){draw(performance.now());start();}};
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('scroll',scrolled,{passive:true});document.addEventListener('visibilitychange',visibility);media.addEventListener?.('change',motion);
 resize();
 return {
  setActive(value){if(destroyed)return;active=!!value;canvas.hidden=!active;if(active){resize();start();}else stop();},
  destroy(){destroyed=true;stop();window.removeEventListener('resize',resize);window.removeEventListener('pointermove',pointer);window.removeEventListener('scroll',scrolled);document.removeEventListener('visibilitychange',visibility);media.removeEventListener?.('change',motion);}
 };
}
