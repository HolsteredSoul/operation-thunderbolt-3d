import {THREE,Batcher,buildVillage,soldier,poseSoldier,box,material} from './visuals.js';
const $=id=>document.getElementById(id),canvas=$('scene'),overlay=$('overlay'),ctx=overlay.getContext('2d');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(err){$('fatal').hidden=false;$('fatal').textContent='WebGL 2 could not start. Open this game in Chrome or Edge with graphics acceleration enabled. '+err.message;throw err;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color('#77816c');scene.fog=new THREE.Fog('#77816c',2200,4300);
const camera=new THREE.OrthographicCamera(-500,500,340,-340,1,6000);
const ambient=new THREE.HemisphereLight('#f2eddb','#4c624e',2.25);scene.add(ambient);
const sun=new THREE.DirectionalLight('#ffe2af',3.2);sun.position.set(550,1200,300);sun.target.position.set(1200,0,900);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1500,right:1500,top:1500,bottom:-1500,near:10,far:3500});sun.shadow.bias=-.0003;sun.shadow.normalBias=1;sun.shadow.radius=3;scene.add(sun,sun.target);
const dynamic=new Batcher(scene,true),models=new Map(),effectRoot=new THREE.Group();
const contactGeo=new THREE.CircleGeometry(1,20),contactMat=new THREE.MeshBasicMaterial({color:'#25352a',transparent:true,opacity:.25,depthWrite:false});
const ROLE_STYLE={rifleman:{label:'RIFLEMAN',height:53,width:13,color:'#adc7d8'},officer:{label:'OFFICER',height:51,width:14,color:'#e4bd78'},sniper:{label:'SNIPER',height:47,width:18,color:'#b9ca8a'},nest:{label:'MG NEST',height:46,width:37,color:'#e0b092'}};
const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-29),aimPoint=new THREE.Vector3(),pointer=new THREE.Vector2();
let destroyVillage=()=>{},width=0,height=0,last=0,accum=0,uiT=0,toastT=0,frames=[],cpuFrames=[],frameCount=0;
const bulletGeo=new THREE.BufferGeometry(),bulletPositions=new Float32Array(240*6),bulletColors=new Float32Array(240*6);
bulletGeo.setAttribute('position',new THREE.BufferAttribute(bulletPositions,3));bulletGeo.setAttribute('color',new THREE.BufferAttribute(bulletColors,3));
const bulletLines=new THREE.LineSegments(bulletGeo,new THREE.LineBasicMaterial({vertexColors:true}));bulletLines.frustumCulled=false;scene.add(bulletLines);
function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height);overlay.width=width;overlay.height=height;const view=height<600?600:680;camera.left=-view*width/height/2;camera.right=-camera.left;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();updateCamera(1);updateAim();}
function updateCamera(dt){
  const menu=G.state==='menu',tx=G.player.x+(menu?-190:0),ty=G.player.y+(menu?190:0),k=1-Math.exp(-9.21*dt);
  G.camera.x+=(tx-G.camera.x)*k;G.camera.y+=(ty-G.camera.y)*k;
  const shake=G.state==='playing'&&!G.reduceShake?G.shake:0,sx=Math.sin(G.time*107)*shake*.35,sz=Math.cos(G.time*93)*shake*.35;
  const x=G.camera.x+sx,z=G.camera.y+sz;
  camera.position.set(x+1000,Math.tan(35*Math.PI/180)*Math.sqrt(2)*1000,z+1000);camera.lookAt(x,0,z);camera.updateMatrixWorld();
}
function project(x,y,h=29){const p=new THREE.Vector3(x,h,y).project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};}
function updateAim(){
  if(!width)return;
  pointer.set(G.mouse.x/width*2-1,1-G.mouse.y/height*2);raycaster.setFromCamera(pointer,camera);raycaster.ray.intersectPlane(plane,aimPoint);
  let target=null,best=Infinity;
  // Screen silhouette targeting compensates for model height without changing collision/range.
  for(const e of G.enemies){if(e.dead)continue;const role=ROLE_STYLE[e.type],feet=project(e.x,e.y,5),head=project(e.x,e.y,role.height),cx=(feet.x+head.x)/2,cy=(feet.y+head.y)/2;
    const rx=role.width*height/680+4,ry=Math.abs(feet.y-head.y)/2+5;
    const d=((G.mouse.x-cx)/rx)**2+((G.mouse.y-cy)/ry)**2;if(d<=1&&d<best){best=d;target=e;}
  }
  G.aimTarget=target;G.mouse.wx=target?target.x:aimPoint.x;G.mouse.wy=target?target.y:aimPoint.z;
}
function rebuild(){destroyVillage();destroyVillage=buildVillage(G,scene);models.clear();dynamic.begin();dynamic.finish();G.mouse.x=width*.6;G.mouse.y=height*.48;updateCamera(1);updateAim();renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);}
G.rebuild=rebuild;
function renderModels(){
  dynamic.begin();const active=new Set();
  const entities=[...G.enemies,...G.corpses];if(G.player.hp>0)entities.push(G.player);
  for(const e of entities){active.add(e);let model=models.get(e);if(!model){model=soldier(e.type||'player');models.set(e,model);}poseSoldier(model,e,G.time,e.life!==undefined);dynamic.add(model);}
  for(const e of models.keys())if(!active.has(e))models.delete(e);
  effectRoot.clear();
  for(const e of entities){const m=new THREE.Mesh(contactGeo,contactMat);m.position.set(e.x,2,e.y);m.rotation.x=-Math.PI/2;m.scale.set(e.type==='nest'?31:13,e.type==='nest'?25:11,1);effectRoot.add(m);}
  for(const pk of G.pickups){if(pk.t>11&&Math.floor(pk.t*8)%2===0)continue;const col=pk.isUpgrade?({dmg:'#eb8556',fireRate:'#edce6c',mag:'#7ac0d5',maxHp:'#94c997'})[pk.type]:pk.type==='health'?'#e3d6b7':'#a4ac72';const m=new THREE.Mesh(box,material(col));m.position.set(pk.x,12+Math.sin(pk.t*3)*3,pk.y);m.scale.set(15,pk.isUpgrade?15:10,15);if(pk.isUpgrade)m.rotation.y=pk.t;m.rotation.z=pk.isUpgrade?Math.PI/4:0;effectRoot.add(m);}
  for(const p of G.effects){const m=new THREE.Mesh(box,material(p.color));const age=.4-p.life;m.position.set(p.x+(p.vx||0)*age,p.h+(p.vh||0)*age,p.y+(p.vy||0)*age);m.scale.setScalar(p.size*Math.min(1,p.life*15));effectRoot.add(m);}
  dynamic.add(effectRoot);dynamic.finish();
  let n=0;for(const b of G.bullets){const a=Math.atan2(b.vy,b.vx),c=new THREE.Color(b.color);bulletPositions.set([b.x-Math.cos(a)*20,29,b.y-Math.sin(a)*20,b.x,29,b.y],n*6);bulletColors.set([c.r,c.g,c.b,c.r,c.g,c.b],n*6);n++;}
  bulletGeo.setDrawRange(0,n*2);bulletGeo.attributes.position.needsUpdate=true;bulletGeo.attributes.color.needsUpdate=true;
}
function drawOverlay(){
  ctx.clearRect(0,0,width,height);if(G.state==='menu')return;
  const p=G.player,pp=project(p.x,p.y,1);
  ctx.strokeStyle=p.invulnT>0?'#e39c74':'#e5dab3';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(pp.x,pp.y,19*height/680,10*height/680,0,0,TAU);ctx.stroke();
  // Threat bearings make distant stationary enemies findable.
  for(const e of G.enemies){
    const s=project(e.x,e.y,ROLE_STYLE[e.type].height+9),off=s.x<24||s.x>width-24||s.y<90||s.y>height-140;
    if(off){const dx=s.x-width/2,dy=s.y-height/2,k=Math.min((width/2-30)/Math.max(1,Math.abs(dx)),(height/2-150)/Math.max(1,Math.abs(dy)));const x=width/2+dx*k,y=height/2+dy*k;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=e.telegraphT>0?'#ff715c':'#e4af81';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.fill();ctx.restore();
      if(e.type==='sniper'||e.type==='nest'){ctx.fillStyle='#f0d4b0';ctx.font='9px Consolas';ctx.textAlign='center';ctx.fillText(e.type==='sniper'?'S':'MG',x,y+17);}
    }
    if(e.hp<e.maxHp&&!off){ctx.fillStyle='#15221fc9';ctx.fillRect(s.x-16,s.y-3,32,4);ctx.fillStyle='#d69979';ctx.fillRect(s.x-16,s.y-3,32*e.hp/e.maxHp,4);}
    if(e.telegraphT>0){const a=project(e.x,e.y,29),b=project(e.laserX,e.laserY,29);ctx.strokeStyle='#ff6655';ctx.lineWidth=1.5+(1-e.telegraphT/1.4);ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(b.x,b.y,10,0,TAU);ctx.stroke();ctx.fillStyle='#ffb49c';ctx.font='bold 11px Consolas';ctx.textAlign='center';ctx.fillText('SNIPER · BREAK SIGHT',width/2,103);}
  }
  for(const pk of G.pickups){const s=project(pk.x,pk.y,23);ctx.font='bold 11px Consolas';ctx.textAlign='center';ctx.fillStyle='#fff5dc';ctx.fillText(({health:'+',ammo:'≡',dmg:'D',fireRate:'F',mag:'M',maxHp:'H'})[pk.type],s.x,s.y);}
  const vis=G.ui.getVisuals();for(const f of vis.floats){const s=project(f.x,f.y,58);ctx.globalAlpha=Math.max(0,1-f.t/f.life);ctx.fillStyle=f.color;ctx.font='bold 12px Consolas';ctx.textAlign='center';ctx.fillText(f.text,s.x,s.y);}ctx.globalAlpha=1;
  if(vis.flashT>0){ctx.fillStyle=`rgba(156,44,26,${vis.flashT*.5})`;ctx.fillRect(0,0,width,height);}
  if(G.state==='playing'){
    const x=G.mouse.x,y=G.mouse.y,target=G.aimTarget,blocked=target&&!lineOfSight(p.x,p.y,target.x,target.y),far=target&&U.dist(p.x,p.y,target.x,target.y)>547;
    ctx.strokeStyle=blocked?'#e9ba7a':target&&!far?'#ed9874':'#f7ecd2';ctx.lineWidth=1.4;const gap=p.moving?9:5;
    ctx.beginPath();for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(x+dx*gap,y+dy*gap);ctx.lineTo(x+dx*(gap+7),y+dy*(gap+7));}ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(x-1,y-1,2,2);
    if(target){
      const role=ROLE_STYLE[target.type];ctx.font='bold 11px Consolas';ctx.textAlign='center';
      const labelWidth=ctx.measureText(role.label).width+16;
      ctx.fillStyle='#182522e8';ctx.fillRect(x-labelWidth/2,y+17,labelWidth,19);
      ctx.fillStyle=role.color;ctx.fillText(role.label,x,y+30);
    }
    if(blocked||far){ctx.font='9px Consolas';ctx.textAlign='center';ctx.fillText(blocked?'COVER':'OUT OF RANGE',x,y+48);}
    if(p.reloadT>0){ctx.strokeStyle='#ddc082';ctx.lineWidth=3;ctx.beginPath();ctx.arc(pp.x,pp.y-60,12,-Math.PI/2,-Math.PI/2+TAU*(1-p.reloadT/1.15));ctx.stroke();}
  }
}
function setText(id,text){if($(id).textContent!==text)$(id).textContent=text;}
function updateHUD(){
  const p=G.player,inter=G.nextWaveIn>0,comp=OT.enemies.previewNextWave(G);
  setText('seed-label','SEED / '+G.seed);setText('health-value',`${Math.ceil(p.hp)} / ${p.maxHp}`);$('health-fill').style.width=100*p.hp/p.maxHp+'%';$('health-fill').style.background=p.hp<30?'#d58b6a':'#adbf91';
  setText('health-state',p.hp<30?'CRITICAL · FIND MEDICAL SUPPLIES':p.hp<70?'WOUNDED':'FIT FOR DUTY');
  setText('ammo',String(p.ammo).padStart(2,'0'));setText('reserve','/ '+p.reserve);setText('reload-label',p.reloadT>0?'RELOADING':p.ammo===0&&p.reserve===0?'NO AMMUNITION':'R · RELOAD');
  const rounds=Array.from({length:p.magSize},(_,i)=>`<i class="${i<p.ammo?'':'empty'}"></i>`).join('');if($('rounds').innerHTML!==rounds)$('rounds').innerHTML=rounds;
  setText('wave-status',inter?'REINFORCEMENTS IN '+Math.ceil(G.nextWaveIn)+'s':'HOLD YOUR GROUND');setText('wave-number',String(G.wave||1).padStart(2,'0'));
  $('wave-info').innerHTML=(inter?'NEXT WAVE':'WAVE')+'<br><b>'+ (inter?Object.values(comp).reduce((a,b)=>a+b,0):G.enemiesLeft)+' HOSTILES</b>';
  setText('preview',inter?Object.entries(comp).filter(([,n])=>n).map(([k,n])=>n+' '+({rifleman:'riflemen',officer:'officers',sniper:'snipers',nest:'MG nests'})[k]).join(' · '):'');
  setText('score',String(G.score).padStart(6,'0'));setText('best','BEST '+G.hiscore.toLocaleString());
  $('upgrades').innerHTML=Object.entries(p.upgrades).map(([k,v])=>`<div>${({dmg:'DAMAGE',fireRate:'FIRE RATE',mag:'MAGAZINE',maxHp:'HEALTH'})[k]}<b>${'▰'.repeat(v)}${'▱'.repeat(4-v)}</b></div>`).join('');
  setText('banner',G.state==='playing'?G.ui.getVisuals().banner.text:'');
}
function showState(){
  document.body.className=G.state;$('modal').style.display=G.state==='playing'?'none':'flex';$('seed-control').style.display=G.state==='paused'?'none':'flex';$('results').textContent='';
  if(G.state==='menu'){$('modal-title').innerHTML='A village.<br>A rifle.<br><em>Hold the line.</em>';$('modal-kicker').textContent='FIELD ORDERS / 1944';$('start').innerHTML='DEPLOY <span>→</span>';}
  if(G.state==='paused'){$('modal-title').innerHTML='Catch your<br><em>breath.</em>';$('modal-kicker').textContent='BATTLE PAUSED';$('modal-copy').textContent='The battlefield is on hold. Resume when you’re ready. Fresh layout starts a new run.';$('start').innerHTML='RESUME <span>→</span>';}
  if(G.state==='gameover'){$('modal-title').innerHTML='Your watch<br><em>has ended.</em>';$('modal-kicker').textContent=G.newRecord?'NEW FIELD RECORD':'AFTER-ACTION REPORT';$('modal-copy').textContent='The village remembers. Replay this battlefield, or deploy to a fresh layout.';$('results').textContent=`SCORE ${G.score.toLocaleString()} · WAVE ${G.wave} · ${G.kills} KILLS\n${Math.floor(G.time/60)}m ${Math.floor(G.time%60)}s survived · ${G.stats.shots?Math.round(G.stats.hits/G.stats.shots*100):0}% hits`;$('results').style.whiteSpace='pre-line';$('start').innerHTML='REPLAY SEED <span>→</span>';}
  $('seed').value=G.seed;updateHUD();
}
function toast(s){$('toast').style.display='block';$('toast').textContent=s;toastT=2;}
function toggleSound(){G.muted=G.audio.toggleMute();setText('sound',G.muted?'SOUND OFF':'SOUND ON');}
function toggleQuality(){G.lowQuality=!G.lowQuality;renderer.setPixelRatio(G.lowQuality?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!G.lowQuality;renderer.shadowMap.needsUpdate=true;for(const m of scene.children)if(m.isInstancedMesh)m.material.needsUpdate=true;setText('quality',G.lowQuality?'LOW QUALITY':'HIGH QUALITY');resize();}
function pause(){if(G.state==='playing')setState('paused');else if(G.state==='paused'){G.audio.unlock();setState('playing');}}
$('start').onclick=()=>G.state==='paused'?pause():startRun($('seed').value);
$('fresh').onclick=()=>startRun(freshSeed());$('pause').onclick=pause;$('sound').onclick=()=>{G.audio.unlock();toggleSound();};$('quality').onclick=toggleQuality;
window.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'){if(e.code==='Enter')startRun($('seed').value);return;}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;G.keys[e.code]=true;G.audio.unlock();
  if(e.code==='KeyR'&&G.state==='playing')OT.player.startReload(G,G.player);
  if(e.code==='KeyP'||e.code==='Escape')pause();if(e.code==='KeyM')toggleSound();
  if(e.code==='KeyX'){G.reduceShake=!G.reduceShake;G.shake=0;toast(G.reduceShake?'SHAKE REDUCED':'SHAKE ON');}
  if(e.code==='Enter'||e.code==='Space'){if(G.state==='menu'||G.state==='gameover')startRun($('seed').value);else if(G.state==='paused')pause();}
});
window.addEventListener('keyup',e=>{G.keys[e.code]=false;});
function loseFocus(){if(G.state==='playing')setState('paused');G.keys={};G.mouse.down=false;}
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});window.addEventListener('game-state',showState);
window.addEventListener('mousemove',e=>{G.mouse.x=e.clientX;G.mouse.y=e.clientY;updateAim();});canvas.addEventListener('mousedown',e=>{if(e.button===0&&G.state==='playing'){G.audio.unlock();G.mouse.down=true;}});window.addEventListener('mouseup',()=>G.mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('resize',resize);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loseFocus();$('fatal').hidden=false;$('fatal').textContent='The graphics context was lost. Reload the page to restore the battlefield.';});
initGame();resize();rebuild();showState();
function frame(t){
  requestAnimationFrame(frame);const begin=performance.now(),raw=last?(t-last)/1000:1/60;last=t;const dt=Math.min(.05,raw);G.stateT+=dt;
  updateCamera(dt);updateAim();
  if(G.state==='playing'){accum+=dt;let n=0;while(accum>=1/120&&n++<6){step(1/120);accum-=1/120;}}else accum=0;
  renderModels();renderer.render(scene,camera);drawOverlay();
  uiT+=dt;if(uiT>.1){updateHUD();uiT=0;}if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.display='none';}
  if(raw<.2&&G.state==='playing'){frames.push(raw*1000);cpuFrames.push(performance.now()-begin);if(frames.length>1200){frames.shift();cpuFrames.shift();}}frameCount++;
}
window.__OT3D={G,OT,U,step,startRun,setState,damagePlayer,updateBullets,fireBullet,lineOfSight,moveCircle,project,updateAim,resize,generateLayout,validateLayout,legalSpawn,nearestClear,routeHeading,renderer,camera,scene,
  perf:()=>{const a=[...frames].sort((a,b)=>a-b),c=[...cpuFrames].sort((a,b)=>a-b);return{samples:a.length,fps:1000/(a.reduce((x,y)=>x+y,0)/a.length),medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],cpuMedianMs:c[Math.floor(c.length*.5)],cpuP95Ms:c[Math.floor(c.length*.95)],calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,viewport:[width,height],pixelRatio:renderer.getPixelRatio(),quality:G.lowQuality?'low':'high'};},resetPerf:()=>{frames=[];cpuFrames=[];},render:()=>{updateCamera(1);updateAim();renderModels();renderer.render(scene,camera);drawOverlay();updateHUD();}};
requestAnimationFrame(frame);
