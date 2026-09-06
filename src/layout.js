'use strict';
function seeded(seed) {
  let h=2166136261; for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
  return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}
const GRID=30, COLS=80, ROWS=60;
function clearAt(g,x,y,r=17){return x>=r+30&&y>=r+30&&x<=2370-r&&y<=1770-r&&!g.obstacles.some(o=>circleRectHit(x,y,r,o));}
function buildNav(g){
  const grid=new Uint8Array(COLS*ROWS),seen=new Uint8Array(grid.length),q=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)grid[y*COLS+x]=clearAt(g,x*GRID+15,y*GRID+15,18)?1:0;
  let start=30*COLS+40;q.push(start);seen[start]=1;
  for(let k=0;k<q.length;k++){const i=q[k],x=i%COLS,y=Math.floor(i/COLS);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*COLS+xx;if(xx>=0&&xx<COLS&&yy>=0&&yy<ROWS&&grid[j]&&!seen[j]){seen[j]=1;q.push(j);}}}
  g.nav={grid,seen,cells:q.map(i=>({x:(i%COLS)*GRID+15,y:Math.floor(i/COLS)*GRID+15,i})),flow:null,target:-1};
  return q.length/grid.reduce((a,b)=>a+b,0);
}
function validateLayout(g){
  const connected=buildNav(g),density=g.obstacles.reduce((n,o)=>n+o.w*o.h,0)/(2400*1800);
  const clearStart=!g.obstacles.some(o=>circleRectHit(1200,900,160,o));
  const doors=g.buildings.every(b=>g.nav.cells.some(c=>c.x>b.x+25&&c.x<b.x+b.w-25&&c.y>b.y+25&&c.y<b.y+b.h-25));
  const lanes=!g.obstacles.some(o=>circleRectHit(1200,o.y+o.h/2,52,o)||circleRectHit(o.x+o.w/2,900,52,o));
  const edgeCells=g.nav.cells.filter(p=>p.x<120||p.x>2280||p.y<120||p.y>1680).length;
  return {valid:connected===1&&density>=.02&&density<=.1&&clearStart&&doors&&lanes&&edgeCells>160,connected,density,clearStart,doors,lanes,edgeCells};
}
function generateLayout(seed,forceFallback=false){
  for(let attempt=0;attempt<9;attempt++){
    const fallback=forceFallback||attempt===8,rng=seeded(fallback?'known-good-v1':seed+':layout:'+attempt),rand=(a,b)=>a+rng()*(b-a);
    const g={seed,obstacles:[],buildings:[],decor:[],attempts:attempt+1,fallback};
    const add=(x,y,w,h,kind,mat)=>g.obstacles.push({x,y,w,h,kind,mat});
    // Eight spaced parcels guarantee a central crossroad and perimeter circulation.
    for(const [cx,cy]of[[410,400],[840,370],[1570,380],[2010,420],[390,1330],[830,1380],[1570,1380],[2010,1320]]){
      const w=Math.round(rand(210,290)),h=Math.round(rand(210,290)),x=Math.round(cx-w/2+rand(-48,48)),y=Math.round(cy-h/2+rand(-40,40));
      const mat=rng()<.5?'brick':'stone';g.buildings.push({x,y,w,h,mat});
      // Two 96-unit doors on opposite walls; every room is passable in both axes.
      const gap=96,t=16;
      for(const yy of[y,y+h-t]){add(x,yy,(w-gap)/2,t,'wall',mat);add(x+(w+gap)/2,yy,(w-gap)/2,t,'wall',mat);}
      for(const xx of[x,x+w-t]){add(xx,y,t,(h-gap)/2,'wall',mat);add(xx,y+(h+gap)/2,t,(h-gap)/2,'wall',mat);}
      g.decor.push({t:'floor',x:x+t,y:y+t,w:w-2*t,h:h-2*t,mat});
    }
    for(let k=0;k<26;k++){
      for(let j=0;j<40;j++){
        const kind=['sandbag','crate','rubble'][k%3],horizontal=rng()<.5;
        const w=kind==='sandbag'?(horizontal?84:22):rand(28,44),h=kind==='sandbag'?(horizontal?22:84):w;
        const o={x:rand(180,2220-w),y:rand(170,1630-h),w,h,kind};
        if(Math.abs(o.x+w/2-1200)<120+w/2||Math.abs(o.y+h/2-900)<120+h/2)continue;
        if(g.buildings.some(b=>o.x+w+65>b.x&&o.x-65<b.x+b.w&&o.y+h+65>b.y&&o.y-65<b.y+b.h))continue;
        if(g.obstacles.some(b=>o.x+w+65>b.x&&o.x-65<b.x+b.w&&o.y+h+65>b.y&&o.y-65<b.y+b.h))continue;
        g.obstacles.push(o);break;
      }
    }
    g.validation=validateLayout(g);
    if(g.validation.valid){g.spawnPoints=g.nav.cells.filter(p=>p.x<120||p.x>2280||p.y<120||p.y>1680);return g;}
    if(fallback)throw Error('Known-good layout validation failed');
  }
}
function nearestClear(g,x,y,r=18){
  if(clearAt(g,x,y,r)&&g.nav.seen[Math.floor(y/GRID)*COLS+Math.floor(x/GRID)])return{x,y};
  let best=g.nav.cells[0],d=Infinity;for(const c of g.nav.cells){const ds=(c.x-x)**2+(c.y-y)**2;if(ds<d&&clearAt(g,c.x,c.y,r)){best=c;d=ds;}}return{x:best.x,y:best.y};
}
function legalSpawn(g,type){
  const p=g.player,min=type==='nest'?380:type==='sniper'?700:500,max=type==='nest'?650:type==='sniper'?1100:1500;
  let cells=type==='nest'?g.nav.cells:g.spawnPoints;
  const legal=c=>{const d=Math.hypot(c.x-p.x,c.y-p.y);return d>=min&&d<=max&&clearAt(g,c.x,c.y,26)&&!g.enemies.some(e=>Math.hypot(e.x-c.x,e.y-c.y)<55);};
  let candidates=cells.filter(legal);if(!candidates.length)candidates=g.nav.cells.filter(legal);
  if(!candidates.length)throw Error('No legal spawn at required distance');
  if(type==='nest'){const visible=candidates.filter(c=>lineOfSight(c.x,c.y,p.x,p.y));if(visible.length)candidates=visible;}
  return U.pick(candidates);
}
function routeHeading(g,e,p){
  const nav=g.nav,pc=nearestClear(g,p.x,p.y),target=Math.floor(pc.y/GRID)*COLS+Math.floor(pc.x/GRID);
  if(nav.target!==target){
    nav.target=target;nav.flow=new Int16Array(COLS*ROWS).fill(-1);const q=[target];nav.flow[target]=0;
    for(let k=0;k<q.length;k++){let i=q[k];for(const j of[i-1,i+1,i-COLS,i+COLS])if(j>=0&&j<nav.grid.length&&Math.abs(j%COLS-i%COLS)<=1&&nav.grid[j]&&nav.flow[j]<0){nav.flow[j]=nav.flow[i]+1;q.push(j);}}
  }
  const ec=nearestClear(g,e.x,e.y),i=Math.floor(ec.y/GRID)*COLS+Math.floor(ec.x/GRID);
  let best=i;for(const j of[i-1,i+1,i-COLS,i+COLS])if(j>=0&&j<nav.grid.length&&Math.abs(j%COLS-i%COLS)<=1&&nav.flow[j]>=0&&(nav.flow[best]<0||nav.flow[j]<nav.flow[best]))best=j;
  const tx=best%COLS*GRID+15,ty=Math.floor(best/COLS)*GRID+15;
  return Math.atan2(ty-e.y,tx-e.x);
}
