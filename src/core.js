'use strict';
const TAU=Math.PI*2;
const randomAPI=()=>({random:seeded('initial'),rand(a,b){return a+this.random()*(b-a);},randi(a,b){return Math.floor(this.rand(a,b+1));},pick(a){return a[Math.floor(this.random()*a.length)];},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),dist:(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay),angTo:(ax,ay,bx,by)=>Math.atan2(by-ay,bx-ax),lerp:(a,b,t)=>a+(b-a)*t});
const U=randomAPI(),V=randomAPI(),OT={};
const G={state:'menu',stateT:0,keys:{},mouse:{x:0,y:0,wx:1300,wy:900,down:false},MAP:{w:2400,h:1800},camera:{x:1200,y:900},shake:0,reduceShake:false,muted:false,lowQuality:false,player:null,enemies:[],bullets:[],pickups:[],obstacles:[],decor:[],spawnPoints:[],playerSpawn:{x:1200,y:900},wave:0,score:0,kills:0,time:0,enemiesLeft:0,nextWaveIn:0,hiscore:0,seed:'THUNDER-1944',fx:null,audio:null,ui:null,stats:{shots:0,hits:0},effects:[],corpses:[]};
try{G.hiscore=Math.max(0,Number(localStorage.getItem('ot3d_hiscore_v1'))||0);}catch{}
function circleRectHit(cx,cy,r,o){const x=U.clamp(cx,o.x,o.x+o.w),y=U.clamp(cy,o.y,o.y+o.h);return(cx-x)**2+(cy-y)**2<r*r;}
function moveCircle(e,dx,dy){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  for(let k=0;k<n;k++){
    if(clearAt(G,e.x+dx/n,e.y,e.r))e.x+=dx/n;
    if(clearAt(G,e.x,e.y+dy/n,e.r))e.y+=dy/n;
  }
}
function segmentRect(ax,ay,bx,by,o,r=0){
  const dx=bx-ax,dy=by-ay;let lo=0,hi=1,t0,t1;
  if(Math.abs(dx)<1e-9){if(ax<o.x-r||ax>o.x+o.w+r)return null;}
  else{t0=(o.x-r-ax)/dx;t1=(o.x+o.w+r-ax)/dx;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(lo>hi)return null;}
  if(Math.abs(dy)<1e-9){if(ay<o.y-r||ay>o.y+o.h+r)return null;}
  else{t0=(o.y-r-ay)/dy;t1=(o.y+o.h+r-ay)/dy;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(lo>hi)return null;}
  return lo;
}
function lineOfSight(ax,ay,bx,by){return !G.obstacles.some(o=>segmentRect(ax,ay,bx,by,o)!==null);}
function segmentCircle(ax,ay,bx,by,e,r){
  const dx=bx-ax,dy=by-ay,fx=ax-e.x,fy=ay-e.y,a=dx*dx+dy*dy,c=fx*fx+fy*fy-r*r;
  if(c<=0)return 0;if(a===0)return null;const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;if(disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
function addShake(n){if(!G.reduceShake)G.shake=Math.min(12,G.shake+n);}
function fireBullet(x,y,angle,speed,dmg,friendly,opts={}){
  if(G.bullets.length>=240)return;
  // Trace from the shooter to the muzzle too: a rifle cannot poke through cover.
  const owner=friendly?G.player:null;
  if(owner&&!lineOfSight(owner.x,owner.y,x,y)){G.fx.impact(x,y);return;}
  G.bullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:opts.r||3,dmg,life:opts.life||1.6,friendly,len:opts.len||10,color:opts.color||(friendly?'#ffe0a0':'#ff7751')});
  if(friendly)G.stats.shots++;
}
function updateBullets(dt){
  for(let i=G.bullets.length-1;i>=0;i--){
    const b=G.bullets[i],step=Math.min(dt,b.life),x=b.x+b.vx*step,y=b.y+b.vy*step;let t=2,target=null;
    for(const o of G.obstacles){const k=segmentRect(b.x,b.y,x,y,o,b.r);if(k!==null&&k<t){t=k;target='cover';}}
    const targets=b.friendly?G.enemies:((G.player.invulnT<=0)?[G.player]:[]);
    for(const e of targets){if(e.dead||e.hp<=0)continue;const k=segmentCircle(b.x,b.y,x,y,e,e.r+b.r);if(k!==null&&k<t){t=k;target=e;}}
    if(target){
      b.x+=(x-b.x)*t;b.y+=(y-b.y)*t;
      if(target==='cover')G.fx.impact(b.x,b.y);
      else if(b.friendly){target.hp-=b.dmg;target.hitT=.08;G.stats.hits++;G.fx.blood(b.x,b.y);G.audio.play('ehit');if(target.hp<=0)target.dead=true;}
      else damagePlayer(b.dmg);
      G.bullets.splice(i,1);
    }else{b.x=x;b.y=y;b.life-=dt;if(b.life<=0||x<0||y<0||x>2400||y>1800)G.bullets.splice(i,1);}
  }
}
function damagePlayer(d){
  const p=G.player;if(!p||p.hp<=0||p.invulnT>0)return;
  if(p.ammo+p.reserve<=16&&G.pickups.some(pk=>pk.emergency))G.stats.resupplyDamage=(G.stats.resupplyDamage||0)+Math.min(p.hp,d);
  p.hp=Math.max(0,p.hp-d);p.invulnT=.55;addShake(6);G.ui.flash('red');G.audio.play('playerHurt');
  if(!p.hp){G.fx.corpse(p);setState('gameover');G.audio.play('die');G.newRecord=G.score>G.hiscore;G.hiscore=Math.max(G.hiscore,G.score);try{localStorage.setItem('ot3d_hiscore_v1',String(G.hiscore));}catch{}}
}
function setState(state){G.state=state;G.stateT=0;G.mouse.down=false;G.keys={};window.dispatchEvent(new Event('game-state'));}
function freshSeed(){const n=new Uint32Array(1);crypto.getRandomValues(n);return 'TB-'+n[0].toString(36).toUpperCase();}
function setupLayout(seed){
  G.seed=String(seed||'THUNDER-1944').trim().slice(0,32)||'THUNDER-1944';
  const layout=generateLayout(G.seed);for(const k of['obstacles','buildings','decor','spawnPoints','nav','validation','fallback','attempts'])G[k]=layout[k];
  U.random=seeded(G.seed+':combat');V.random=seeded(G.seed+':effects');
}
function startRun(seed=G.seed){
  setupLayout(seed);Object.assign(G,{score:0,kills:0,wave:0,time:0,shake:0,newRecord:false,stats:{shots:0,hits:0},enemies:[],bullets:[],pickups:[],effects:[],corpses:[]});
  OT.player.reset(G);OT.enemies.reset(G);OT.ui.reset(G);OT.audiofx.reset(G);G.camera.x=1200;G.camera.y=900;
  if(G.rebuild)G.rebuild();setState('playing');G.audio.unlock();
}
function step(dt){
  if(G.state!=='playing')return;G.time+=dt;
  OT.player.update(G,dt);updateBullets(dt);if(G.state!=='playing')return;
  OT.enemies.update(G,dt);OT.ui.update(G,dt);
  G.shake=Math.max(0,G.shake-26*dt);
  for(const a of[G.effects,G.corpses])for(let i=a.length-1;i>=0;i--){a[i].life-=dt;if(a[i].life<=0)a.splice(i,1);}
}
function initGame(){
  OT.audiofx.init(G);OT.ui.init(G);setupLayout(G.seed);OT.player.reset(G);OT.ui.reset(G);
  // Three-dimensional effects use a bounded pool; sound retains the source recipes.
  const puff=(x,y,color,n=6)=>{for(let i=0;i<n;i++){if(G.effects.length>=100)G.effects.shift();G.effects.push({x,y,h:V.rand(12,32),vx:V.rand(-55,55),vy:V.rand(-55,55),vh:V.rand(5,45),color,life:V.rand(.15,.45),size:V.rand(2,5)});}};
  G.fx={impact:(x,y)=>puff(x,y,'#d1c1a2',4),blood:(x,y)=>puff(x,y,'#b7573b',5),burst:(x,y)=>puff(x,y,'#8c8879',5),explode:(x,y)=>{puff(x,y,'#e5af60',18);addShake(6);},muzzle:(x,y,a,s)=>{if(G.effects.length>=100)G.effects.shift();G.effects.push({x,y,h:27,color:'#fff3b0',life:.055,size:8*s,flash:true});},corpse:e=>{if(G.corpses.length>=18)G.corpses.shift();G.corpses.push({x:e.x,y:e.y,angle:e.angle,type:e.type||'player',life:2.5});}};
}
