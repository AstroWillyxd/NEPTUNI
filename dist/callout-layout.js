/** Screen-space lanes. The returned rectangles use the measured HTML size.
 * Order follows projected anchors, so leaders in a lane do not swap ends.
 * Short viewports show a subset; the complete component selector stays usable.
 */
export function calloutLayout(entries,{width,height,top=112,bottom=height-96,obstacles=[],previous=new Map()}={}){
 const pad=12,gap=9,result=new Map(),lanes={left:[],right:[]};
 const visible=entries.filter(e=>e.inFront&&e.x>=0&&e.x<=width&&e.y>=0&&e.y<=height);
 const tallest=Math.max(44,...visible.map(e=>e.height));
 const slots=side=>{const w=Math.max(0,...visible.map(e=>e.width)),x=side==='left'?pad:width-pad-w,out=[];
  for(let y=top;y+tallest<=bottom;y+=tallest+gap){const r={x,y,w,h:tallest};if(!obstacles.some(o=>r.x<o.x+o.w+gap&&r.x+r.w+gap>o.x&&r.y<o.y+o.h+gap&&r.y+r.h+gap>o.y))out.push(y);}
  return out;
 };
 const available={left:slots('left'),right:slots('right')};
 for(const e of visible){const old=previous.get(e.id),side=old&&Math.abs(e.x-width/2)<width*.08?old.side:e.x<width/2?'left':'right';lanes[side].push(e);}
 for(const side of ['left','right']){const other=side==='left'?'right':'left';
  while(lanes[side].length>available[side].length&&lanes[other].length<available[other].length){lanes[side].sort((a,b)=>Math.abs(a.x-width/2)-Math.abs(b.x-width/2));lanes[other].push(lanes[side].shift());}
 }
 for(const side of ['left','right']){
  const capacity=available[side].length;
  let lane=lanes[side];if(lane.length>capacity)lane=[...lane].sort((a,b)=>(b.selected?1:0)-(a.selected?1:0)||(previous.has(b.id)?1:0)-(previous.has(a.id)?1:0)||a.order-b.order).slice(0,capacity);
  lane.sort((a,b)=>a.y-b.y||a.order-b.order);
  // Dynamic programming chooses ordered slots nearest the actual components.
  const ys=available[side],memo=new Map();
  function solve(i,start){if(i===lane.length)return {cost:0,indices:[]};const key=i+':'+start;if(memo.has(key))return memo.get(key);let best={cost:Infinity,indices:[]};
   for(let s=start;s<=ys.length-(lane.length-i);s++){const next=solve(i+1,s+1),cost=next.cost+Math.abs(ys[s]+lane[i].height/2-lane[i].y);if(cost<best.cost)best={cost,indices:[s,...next.indices]};}memo.set(key,best);return best;
  }
  const plan=solve(0,0);lane.forEach((e,i)=>{const x=side==='left'?pad:width-pad-e.width;result.set(e.id,{x,y:ys[plan.indices[i]],w:e.width,h:e.height,slotHeight:tallest,side});});
 }
 return result;
}

/** One short elbow near the label; the marker remains on the physical part. */
export function calloutPath(entry,rect){
 const edge=rect.side==='left'?rect.x+rect.w:rect.x,y=rect.y+rect.h/2;
 const elbow=edge+(rect.side==='left'?10:-10);
 return `M ${entry.x.toFixed(2)} ${entry.y.toFixed(2)} L ${elbow.toFixed(2)} ${y.toFixed(2)} L ${edge.toFixed(2)} ${y.toFixed(2)}`;
}

const points=(entry,r)=>[[entry.x,entry.y],[r.side==='left'?r.x+r.w+10:r.x-10,r.y+r.h/2],[r.side==='left'?r.x+r.w:r.x,r.y+r.h/2]];
const orientation=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function crosses(a,b,c,d){return orientation(a,b,c)*orientation(a,b,d)<-1e-6&&orientation(c,d,a)*orientation(c,d,b)<-1e-6;}
export function calloutCrossings(entries,placements){const paths=entries.filter(e=>placements.has(e.id)).map(e=>points(e,placements.get(e.id)));let n=0;
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++)for(let a=0;a<2;a++)for(let b=0;b<2;b++)if(crosses(paths[i][a],paths[i][a+1],paths[j][b],paths[j][b+1]))n++;
 return n;
}
/** Exchange measured slots to remove leader crossings. Physical anchors never
 * move. A bounded search preserves menu clearance and 44px touch targets. */
export function uncrossCallouts(entries,placements,{width,obstacles=[]}){
 const visible=entries.filter(e=>placements.has(e.id)),byId=new Map(visible.map(e=>[e.id,e]));let best=new Map(placements);
 const score=map=>calloutCrossings(visible,map)*1e6+visible.reduce((sum,e)=>{const r=map.get(e.id);return sum+Math.hypot(e.x-(r.side==='left'?r.x+r.w:r.x),e.y-r.y-r.h/2);},0);
 const valid=map=>{const rects=[...map.values()];return rects.every((r,i)=>![...rects.slice(i+1),...obstacles].some(o=>r.x<o.x+o.w+3&&r.x+r.w+3>o.x&&r.y<o.y+o.h+3&&r.y+r.h+3>o.y));};
 let cost=score(best);
 for(let pass=0;pass<8&&calloutCrossings(visible,best);pass++){let winner=null,nextCost=cost;
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
   const a=visible[i].id,b=visible[j].id,ra=best.get(a),rb=best.get(b);if(byId.get(a).height>rb.slotHeight||byId.get(b).height>ra.slotHeight)continue;
   const place=(slot,e)=>({...slot,x:slot.side==='left'?12:width-12-e.width,w:e.width,h:e.height});
   const candidate=new Map(best);candidate.set(a,place(rb,byId.get(a)));candidate.set(b,place(ra,byId.get(b)));if(!valid(candidate))continue;const value=score(candidate);if(value<nextCost){winner=candidate;nextCost=value;}
  }
  if(!winner)break;best=winner;cost=nextCost;
 }
 return best;
}
