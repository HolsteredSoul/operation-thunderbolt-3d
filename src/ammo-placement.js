// Shortest walk-grid routes, independent of combat RNG and enemy navigation state.
function emergencyAmmoSpot(g,rng){
  const p=g.player,nav=g.nav;let start=null,nearest=Infinity;
  for(const c of nav.cells){const d=Math.hypot(c.x-p.x,c.y-p.y);if(d<nearest&&lineOfSight(p.x,p.y,c.x,c.y)){nearest=d;start=c;}}
  if(!start)return null;
  const distance=new Int16Array(nav.grid.length).fill(-1),queue=[start.i];distance[start.i]=0;
  for(let k=0;k<queue.length;k++){const i=queue[k];for(const j of[i-1,i+1,i-COLS,i+COLS])if(j>=0&&j<nav.grid.length&&Math.abs(j%COLS-i%COLS)<=1&&nav.grid[j]&&distance[j]<0){distance[j]=distance[i]+1;queue.push(j);}}
  const occupied=c=>g.enemies.some(e=>!e.dead&&Math.hypot(e.x-c.x,e.y-c.y)<e.r+28);
  let candidates=nav.cells.filter(c=>distance[c.i]>=0&&!occupied(c));
  if(!candidates.length)candidates=[start];
  const route=c=>distance[c.i]*GRID+nearest,preferred=candidates.filter(c=>route(c)>=100&&route(c)<=180);
  if(preferred.length)candidates=preferred;
  else{const nearestRoute=Math.min(...candidates.map(route));candidates=candidates.filter(c=>route(c)<=nearestRoute+30);}
  const danger=c=>g.enemies.reduce((n,e)=>{if(e.dead)return n;const d=Math.hypot(e.x-c.x,e.y-c.y),range=e.type==='sniper'?820:e.type==='nest'?520:500;if(d>range||!lineOfSight(e.x,e.y,c.x,c.y))return n;const a=Math.atan2(c.y-e.y,c.x-e.x)-e.angle;return n+1+(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.4?2:0);},0);
  let best=Infinity,choices=[];for(const c of candidates){const score=danger(c);if(score<best){best=score;choices=[c];}else if(score===best)choices.push(c);}
  const c=choices[Math.floor(rng()*choices.length)];return{x:c.x,y:c.y,routeDistance:route(c)};
}
