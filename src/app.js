import {setupFullscreen} from './fullscreen.js';
import {TouchControls} from './touch.js';
import {Controls,chooseAutoAimTarget} from './input.js';
import {Tracers} from './tracers.js';
import {traceAim} from './aim-guide.js';
import {Atmosphere} from './atmosphere.js';
import {THREE,Batcher,buildVillage,soldier,poseSoldier,box,material} from './visuals.js';
const $=id=>document.getElementById(id),canvas=$('scene'),overlay=$('overlay'),ctx=overlay.getContext('2d');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(err){$('fatal').hidden=false;$('fatal').textContent='WebGL 2 could not start. Open this game in Chrome or Edge with graphics acceleration enabled. '+err.message;throw err;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
const scene=new THREE.Scene();scene.background=new THREE.Color('#555b56');scene.fog=new THREE.Fog('#747368',1900,3600);
const camera=new THREE.OrthographicCamera(-500,500,340,-340,1,6000);
const ambient=new THREE.HemisphereLight('#c7d1d5','#39372d',1.45);scene.add(ambient);
const sun=new THREE.DirectionalLight('#f2c28a',2.7);sun.position.set(250,950,500);sun.target.position.set(1200,0,900);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1500,right:1500,top:1500,bottom:-1500,near:10,far:3500});sun.shadow.bias=-.0003;sun.shadow.normalBias=1;sun.shadow.radius=3;scene.add(sun,sun.target);
const dynamic=new Batcher(scene,true),models=new Map(),effectRoot=new THREE.Group();
const contactGeo=new THREE.CircleGeometry(1,20),contactMat=new THREE.MeshBasicMaterial({color:'#25352a',transparent:true,opacity:.25,depthWrite:false});
const ROLE_STYLE={rifleman:{label:'RIFLEMAN',height:53,width:13,color:'#a5cde9',badge:'RIFLE'},officer:{label:'OFFICER',height:60,width:14,color:'#ffd084',badge:'OFFICER'},sniper:{label:'SNIPER',height:43,width:18,color:'#ffa18d',badge:'SNIPER'},nest:{label:'MG NEST',height:46,width:37,color:'#d6bbf5',badge:'MG NEST'}};
const modelAimBox=new THREE.Box3(),raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-29),aimPoint=new THREE.Vector3(),pointer=new THREE.Vector2();
let destroyVillage=()=>{},width=0,height=0,last=0,accum=0,uiT=0,toastT=0,frames=[],cpuFrames=[],frameCount=0;
const tracers=new Tracers(scene),atmosphere=new Atmosphere(scene);
function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);overlay.width=width;overlay.height=height;const view=height<600?600:680;camera.left=-view*width/height/2;camera.right=-camera.left;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();updateCamera(1);updateAim();}
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
  if(G.input?.source==='touch'){
    const t=G.input.touch,p=G.player;G.aimTarget=t.target;G.mouse.wx=p.x+Math.cos(t.angle)*500;G.mouse.wy=p.y+Math.sin(t.angle)*500;return;
  }
  if(G.input?.source==='pad'){
    const input=G.input,p=G.player;
    input.autoTarget=input.manualAim||input.assistDegrees===0?null:chooseAutoAimTarget(p,G.enemies,input.autoTarget,e=>{
      const s=project(e.x,e.y,29);return s.x>=15&&s.x<=width-15&&s.y>=80&&s.y<=height-115&&lineOfSight(p.x,p.y,e.x,e.y);
    },input.heading);
    const angle=input.sample().aimAngle??p.angle,dx=Math.cos(angle),dy=Math.sin(angle);
    const reach=input.autoTarget?U.dist(p.x,p.y,input.autoTarget.x,input.autoTarget.y):547;
    G.mouse.wx=p.x+dx*reach;G.mouse.wy=p.y+dy*reach;
    const reticle=project(G.mouse.wx,G.mouse.wy,29);G.mouse.x=reticle.x;G.mouse.y=reticle.y;
    G.aimTarget=input.autoTarget||(input.manualAim?G.enemies.filter(e=>!e.dead&&segmentCircle(p.x,p.y,p.x+dx*547,p.y+dy*547,e,e.r)!==null).sort((a,b)=>U.dist(p.x,p.y,a.x,a.y)-U.dist(p.x,p.y,b.x,b.y))[0]:null)||null;return;
  }
  const cast=(x,y)=>{pointer.set(x/width*2-1,1-y/height*2);raycaster.setFromCamera(pointer,camera);};
  cast(G.mouse.x,G.mouse.y);raycaster.ray.intersectPlane(plane,aimPoint);
  const candidates=[];
  for(const e of G.enemies){if(e.dead)continue;const model=models.get(e);if(!model?.userData.aimBounds)continue;
    model.position.set(e.x,0,e.y);model.rotation.y=Math.PI/2-e.angle;model.updateMatrixWorld(true);
    modelAimBox.copy(model.userData.aimBounds).applyMatrix4(model.matrixWorld);
    if(raycaster.ray.intersectsBox(modelAimBox))candidates.push({e,model});
  }
  const hit=()=>{let result=null,best=Infinity;for(const {e,model}of candidates){const h=raycaster.intersectObject(model,true)[0];if(h&&h.distance<best){best=h.distance;result=e;}}return result;};
  let target=hit();
  // A three-pixel margin catches small near misses without enlarging combat hitboxes.
  if(!target&&candidates.length){const nearby=[];for(const [x,y]of[[3,0],[-3,0],[0,3],[0,-3]]){cast(G.mouse.x+x,G.mouse.y+y);const e=hit();if(e)nearby.push(e);}target=nearby.includes(G.aimTarget)?G.aimTarget:nearby[0]||null;}
  G.aimTarget=target;G.mouse.wx=target?target.x:aimPoint.x;G.mouse.wy=target?target.y:aimPoint.z;
}
function rebuild(){destroyVillage();destroyVillage=buildVillage(G,scene);atmosphere.rebuild(G);models.clear();dynamic.begin();dynamic.finish();G.mouse.x=width*.6;G.mouse.y=height*.48;updateCamera(1);updateAim();renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);}
G.rebuild=rebuild;
function renderModels(){
  dynamic.begin();const active=new Set();
  const entities=[...G.enemies,...G.corpses];if(G.player.hp>0)entities.push(G.player);
  for(const e of entities){active.add(e);let model=models.get(e);if(!model){model=soldier(e.type||'player');models.set(e,model);}poseSoldier(model,e,G.time,e.life!==undefined);dynamic.add(model);}
  for(const e of models.keys())if(!active.has(e))models.delete(e);
  effectRoot.clear();
  for(const e of entities){const m=new THREE.Mesh(contactGeo,contactMat);m.position.set(e.x,2,e.y);m.rotation.x=-Math.PI/2;m.scale.set(e.type==='nest'?31:13,e.type==='nest'?25:11,1);effectRoot.add(m);}
  for(const pk of G.pickups){if(pk.t>G.ui.pickupLife(pk)-3&&Math.floor(pk.t*8)%2===0)continue;const col=pk.isUpgrade?({dmg:'#eb8556',fireRate:'#edce6c',mag:'#7ac0d5',maxHp:'#94c997'})[pk.type]:pk.type==='health'?'#e3d6b7':'#a4ac72';const m=new THREE.Mesh(box,material(col));m.position.set(pk.x,12+Math.sin(pk.t*3)*3,pk.y);m.scale.set(pk.emergency?23:15,pk.isUpgrade?15:10,pk.emergency?23:15);if(pk.isUpgrade)m.rotation.y=pk.t;m.rotation.z=pk.isUpgrade?Math.PI/4:0;effectRoot.add(m);}
  for(const p of G.effects){const m=new THREE.Mesh(box,material(p.color));const age=.4-p.life;m.position.set(p.x+(p.vx||0)*age,p.h+(p.vh||0)*age,p.y+(p.vy||0)*age);m.scale.setScalar(p.size*Math.min(1,p.life*15));effectRoot.add(m);}
  dynamic.add(effectRoot);dynamic.finish();
  tracers.update(G.bullets,camera,height);
}
// Persistent recognition badges use words AND distinct shapes, independent of uniform color.
// They are canvas-only, so they never intercept aiming or mouse input.
function drawRoleBadges(items){
  const placed=[];ctx.font='bold 11px Consolas';
  for(const item of items){
    const {x,y,type,color,label}=item,w=Math.ceil(ctx.measureText(label).width)+30,h=22;
    let bx=U.clamp(x-w/2,8,width-w-8),by=y-28;
    // Move crowded badges above one another; a leader keeps the actor association clear.
    for(let n=0;n<8&&placed.some(r=>bx<r.x+r.w+3&&bx+w+3>r.x&&by<r.y+r.h+3&&by+h+3>r.y);n++)by-=25;
    by=Math.max(92,by);placed.push({x:bx,y:by,w,h});
    ctx.strokeStyle=color;ctx.lineWidth=1;ctx.globalAlpha=.7;
    ctx.beginPath();ctx.moveTo(bx+w/2,by+h);ctx.lineTo(x,y-2);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle='#101c1af0';ctx.fillRect(bx,by,w,h);ctx.fillStyle=color;ctx.fillRect(bx,by,3,h);
    ctx.save();ctx.translate(bx+14,by+11);ctx.strokeStyle=color;ctx.lineWidth=1.5;
    ctx.beginPath();
    if(type==='rifleman'){ctx.rect(-2,-6,4,11);ctx.moveTo(-2,-6);ctx.lineTo(0,-9);ctx.lineTo(2,-6);}
    else if(type==='officer'){for(const dy of[-4,2]){ctx.moveTo(-5,dy+3);ctx.lineTo(0,dy-1);ctx.lineTo(5,dy+3);}}
    else if(type==='sniper'){ctx.arc(0,0,5,0,TAU);ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(0,-8);ctx.lineTo(0,8);}
    else if(type==='nest'){ctx.rect(-6,-5,12,10);for(const dx of[-3,0,3]){ctx.moveTo(dx,-3);ctx.lineTo(dx,3);}}
    else{ctx.moveTo(0,-6);ctx.lineTo(6,0);ctx.lineTo(0,6);ctx.lineTo(-6,0);ctx.closePath();}
    ctx.stroke();ctx.restore();
    ctx.fillStyle='#f7f2df';ctx.textAlign='left';ctx.fillText(label,bx+25,by+15);
  }
}
function drawAimFeedback(p,pp){
  const pad=G.input.source==='pad'||G.input.source==='touch',angle=pad?(G.input.sample().aimAngle??p.angle):U.angTo(p.x,p.y,G.mouse.wx,G.mouse.wy);
  const guide=traceAim(p,angle,G.obstacles,segmentRect);G.aimGuide=guide;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(pad&&G.showAimGuide){
    // One quiet marker close to the soldier, with no floating cursor or range labels.
    const origin=project(p.x,p.y,29),near=project(p.x+Math.cos(angle)*62,p.y+Math.sin(angle)*62,29);
    ctx.translate(near.x,near.y);ctx.rotate(Math.atan2(near.y-origin.y,near.x-origin.x));
    ctx.beginPath();ctx.moveTo(-4,-5);ctx.lineTo(3,0);ctx.lineTo(-4,5);
    ctx.strokeStyle='#101510b0';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=guide.blocked&&guide.distance<90?'#edb27b':'#f5df9c';ctx.lineWidth=1.8;ctx.stroke();
  }else if(!pad){
    const x=G.mouse.x,y=G.mouse.y,target=G.aimTarget,blocked=target&&!lineOfSight(p.x,p.y,target.x,target.y);
    ctx.beginPath();for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(x+dx*5,y+dy*5);ctx.lineTo(x+dx*12,y+dy*12);}
    ctx.strokeStyle='#101510d0';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=blocked?'#edb27b':target?'#f5df9c':'#f0f6e9';ctx.lineWidth=1.8;ctx.stroke();
  }
  ctx.restore();
  if(p.reloadT>0){ctx.strokeStyle='#e5c88f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(pp.x,pp.y-60,12,-Math.PI/2,-Math.PI/2+TAU*(1-p.reloadT/1.15));ctx.stroke();}
}
function drawOverlay(){
  ctx.clearRect(0,0,width,height);if(G.state==='menu')return;
  const p=G.player,pp=project(p.x,p.y,1),badges=[];
  if(p.hp>0){const a=project(p.x,p.y,60);badges.push({...a,type:'player',color:'#a5eed6',label:'YOU'});}
  ctx.strokeStyle=p.invulnT>0?'#e39c74':'#a5eed6';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(pp.x,pp.y,19*height/680,10*height/680,0,0,TAU);ctx.stroke();
  // Threat bearings make distant stationary enemies findable.
  for(const e of G.enemies){
    const s=project(e.x,e.y,ROLE_STYLE[e.type].height+9),off=s.x<24||s.x>width-24||s.y<90||s.y>height-140;
    if(off){const dx=s.x-width/2,dy=s.y-height/2,k=Math.min((width/2-30)/Math.max(1,Math.abs(dx)),(height/2-150)/Math.max(1,Math.abs(dy)));const x=width/2+dx*k,y=height/2+dy*k;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=e.telegraphT>0?'#ff715c':'#e4af81';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.fill();ctx.restore();
      if(e.type==='sniper'||e.type==='nest'){ctx.fillStyle='#f0d4b0';ctx.font='9px Consolas';ctx.textAlign='center';ctx.fillText(e.type==='sniper'?'S':'MG',x,y+17);}
    }
    if(!e.dead&&!off){const role=ROLE_STYLE[e.type];badges.push({...s,type:e.type,color:role.color,label:role.badge});}
    if(e.hp<e.maxHp&&!off){ctx.fillStyle='#15221fc9';ctx.fillRect(s.x-16,s.y-3,32,4);ctx.fillStyle='#d69979';ctx.fillRect(s.x-16,s.y-3,32*e.hp/e.maxHp,4);}
    if(e.telegraphT>0){const a=project(e.x,e.y,29),b=project(e.laserX,e.laserY,29);ctx.strokeStyle='#ff6655';ctx.lineWidth=1.5+(1-e.telegraphT/1.4);ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(b.x,b.y,10,0,TAU);ctx.stroke();ctx.fillStyle='#ffb49c';ctx.font='bold 11px Consolas';ctx.textAlign='center';ctx.fillText('SNIPER · BREAK SIGHT',width/2,103);}
  }
  drawRoleBadges(badges);
  for(const pk of G.pickups){
    if(pk.t>G.ui.pickupLife(pk)-3&&Math.floor(pk.t*8)%2===0)continue;
    const s=project(pk.x,pk.y,25);ctx.font='bold 11px Consolas';ctx.textAlign='center';ctx.fillStyle='#fff5dc';
    if(pk.type==='ammo'){
      const off=s.x<55||s.x>width-55||s.y<110||s.y>height-145;
      if(off&&!pk.emergency)continue;
      const x=U.clamp(s.x,55,width-55),y=U.clamp(s.y,110,height-145),text=pk.emergency?'AMMO +24':'AMMO +16';
      ctx.fillStyle='#182522ee';ctx.fillRect(x-42,y-22,84,21);ctx.fillStyle='#ffe39c';ctx.fillText(text,x,y-7);
      if(pk.emergency){ctx.strokeStyle='#ffe39c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+8,10,0,TAU);ctx.stroke();if(off){ctx.save();ctx.translate(x,y+8);ctx.rotate(Math.atan2(s.y-y,s.x-x));ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();}else{ctx.beginPath();ctx.moveTo(x,y-1);ctx.lineTo(x,y+17);ctx.moveTo(x-8,y+8);ctx.lineTo(x+8,y+8);ctx.stroke();}}
    }else ctx.fillText(({health:'+',dmg:'D',fireRate:'F',mag:'M',maxHp:'H'})[pk.type],s.x,s.y);
  }
  const vis=G.ui.getVisuals();for(const f of vis.floats){const s=project(f.x,f.y,58);ctx.globalAlpha=Math.max(0,1-f.t/f.life);ctx.fillStyle=f.color;ctx.font='bold 12px Consolas';ctx.textAlign='center';ctx.fillText(f.text,s.x,s.y);}ctx.globalAlpha=1;
  if(vis.flashT>0){ctx.fillStyle=`rgba(156,44,26,${vis.flashT*.5})`;ctx.fillRect(0,0,width,height);}
  if(G.state==='playing')drawAimFeedback(p,pp);
}
function setText(id,text){if($(id).textContent!==text)$(id).textContent=text;}
function updateHUD(){
  updateInputPrompts();
  const p=G.player,inter=G.nextWaveIn>0,comp=OT.enemies.previewNextWave(G);
  setText('seed-label','SEED / '+G.seed);setText('health-value',`${Math.ceil(p.hp)} / ${p.maxHp}`);$('health-fill').style.width=100*p.hp/p.maxHp+'%';$('health-fill').style.background=p.hp<30?'#d58b6a':'#adbf91';
  setText('health-state',p.hp<30?'CRITICAL · FIND MEDICAL SUPPLIES':p.hp<70?'WOUNDED':'FIT FOR DUTY');
  setText('ammo',String(p.ammo).padStart(2,'0'));setText('reserve','/ '+p.reserve);setText('reload-label',p.reloadT>0?'RELOADING':p.ammo===0&&p.reserve===0?'FOLLOW AMMO MARKER':(G.input?.source==='touch'?'TAP RELOAD':G.input?.source==='pad'?'X - RELOAD':'R - RELOAD'));
  const rounds=Array.from({length:p.magSize},(_,i)=>`<i class="${i<p.ammo?'':'empty'}"></i>`).join('');if($('rounds').innerHTML!==rounds)$('rounds').innerHTML=rounds;
  setText('wave-status',inter?'REINFORCEMENTS IN '+Math.ceil(G.nextWaveIn)+'s':G.runDifficulty.toUpperCase()+' / HOLD YOUR GROUND');setText('wave-number',String(G.wave||1).padStart(2,'0'));
  $('wave-info').innerHTML=(inter?'NEXT WAVE':'WAVE')+'<br><b>'+ (inter?Object.values(comp).reduce((a,b)=>a+b,0):G.enemiesLeft)+' HOSTILES</b>';
  setText('preview',inter?Object.entries(comp).filter(([,n])=>n).map(([k,n])=>n+' '+({rifleman:'riflemen',officer:'officers',sniper:'snipers',nest:'MG nests'})[k]).join(' · '):'');
  setText('score',String(G.score).padStart(6,'0'));setText('best',(G.runDifficulty||G.difficulty).toUpperCase()+' BEST '+G.hiscore.toLocaleString());
  $('upgrades').innerHTML=Object.entries(p.upgrades).map(([k,v])=>`<div>${({dmg:'DAMAGE',fireRate:'FIRE RATE',mag:'MAGAZINE',maxHp:'HEALTH'})[k]}<b>${'▰'.repeat(v)}${'▱'.repeat(4-v)}</b></div>`).join('');
  setText('banner',G.state==='playing'?G.ui.getVisuals().banner.text:'');
}
function showState(){
  document.body.className=G.state;$('modal').style.display=G.state==='playing'?'none':'flex';$('seed-control').style.display=G.state==='paused'?'none':'flex';$('results').textContent='';
  if(G.state==='menu'){$('modal-title').innerHTML='A village.<br>A rifle.<br><em>Hold the line.</em>';$('modal-kicker').textContent='FIELD ORDERS / 1944';$('start').innerHTML='DEPLOY <span>→</span>';}
  if(G.state==='paused'){$('modal-title').innerHTML='Catch your<br><em>breath.</em>';$('modal-kicker').textContent='BATTLE PAUSED';$('modal-copy').textContent='The battlefield is on hold. Resume when you’re ready. Fresh layout starts a new run.';$('start').innerHTML='RESUME <span>→</span>';}
  if(G.state==='gameover'){$('modal-title').innerHTML='Your watch<br><em>has ended.</em>';$('modal-kicker').textContent=G.newRecord?'NEW FIELD RECORD':'AFTER-ACTION REPORT';$('modal-copy').textContent='The village remembers. Replay this battlefield, or deploy to a fresh layout.';$('results').textContent=`SCORE ${G.score.toLocaleString()} · WAVE ${G.wave} · ${G.kills} KILLS\n${Math.floor(G.time/60)}m ${Math.floor(G.time%60)}s survived · ${G.stats.shots?Math.round(G.stats.hits/G.stats.shots*100):0}% hits`;$('results').style.whiteSpace='pre-line';$('start').innerHTML='REPLAY SEED <span>→</span>';}
  if(G.input.touch?.enabled){$('modal-title').innerHTML=$('modal-title').innerHTML.replaceAll('<br>',' ');if(G.state==='menu')$('modal-copy').textContent='Left thumb moves. Hold FIRE to aim and shoot at a nearby visible enemy. Tap RELOAD to top up. Start on Recruit and turn sideways.';}
  $('seed').value=G.seed;updateHUD();if(G.input?.source==='pad'&&G.state!=='playing')$('start').focus();
}
function toast(s){$('toast').style.display='block';$('toast').textContent=s;toastT=2;}
function toggleSound(){G.muted=G.audio.toggleMute();setText('sound',G.muted?'SOUND OFF':'SOUND ON');}
function toggleQuality(){G.lowQuality=!G.lowQuality;renderer.setPixelRatio(G.lowQuality?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!G.lowQuality;renderer.shadowMap.needsUpdate=true;for(const m of scene.children)if(m.isInstancedMesh)m.material.needsUpdate=true;setText('quality',G.lowQuality?'LOW QUALITY':'HIGH QUALITY');resize();}
function pause(){if(G.state==='playing')setState('paused');else if(G.state==='paused'){G.audio.unlock();setState('playing');}}
$('start').onclick=()=>G.state==='paused'?pause():startRun($('seed').value);
$('fresh').onclick=()=>startRun(freshSeed());$('pause').onclick=pause;$('sound').onclick=()=>{G.audio.unlock();toggleSound();};$('quality').onclick=toggleQuality;
window.addEventListener('keydown',e=>{
  G.input.useMouse();
  if(e.target.tagName==='INPUT'){if(e.code==='Enter')startRun($('seed').value);return;}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;G.keys[e.code]=true;G.audio.unlock();
  if(e.code==='KeyR'&&G.state==='playing')OT.player.startReload(G,G.player);
  if(e.code==='KeyP'||e.code==='Escape')pause();if(e.code==='KeyM')toggleSound();
  if(e.code==='KeyX'){G.reduceShake=!G.reduceShake;saveController();G.shake=0;toast(G.reduceShake?'SHAKE REDUCED':'SHAKE ON');}
  if(e.code==='Enter'||e.code==='Space'){if(G.state==='menu'||G.state==='gameover')startRun($('seed').value);else if(G.state==='paused')pause();}
});
window.addEventListener('keyup',e=>{G.keys[e.code]=false;});
function loseFocus(){if(G.state==='playing')setState('paused');G.keys={};G.mouse.down=false;G.input.suspended=true;G.input.reset();}
window.addEventListener('focus',()=>G.input.suspended=false);
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});window.addEventListener('game-state',()=>{G.input.reset();showState();});
let lastMouseX=NaN,lastMouseY=NaN;
window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;if(e.clientX!==lastMouseX||e.clientY!==lastMouseY){lastMouseX=e.clientX;lastMouseY=e.clientY;G.input.useMouse();G.mouse.x=e.clientX;G.mouse.y=e.clientY;updateAim();}});canvas.addEventListener('mousedown',e=>{if(e.sourceCapabilities?.firesTouchEvents||G.input.touch?.enabled&&G.input.source==='touch')return;if(e.button===0&&G.state==='playing'){G.input.useMouse();G.audio.unlock();G.mouse.down=true;}});window.addEventListener('mouseup',()=>G.mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('resize',resize);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loseFocus();$('fatal').hidden=false;$('fatal').textContent='The graphics context was lost. Reload the page to restore the battlefield.';});
function menuButtons(){return [...document.querySelectorAll('#modal button,header button')].filter(b=>b.offsetParent!==null&&!b.disabled);}
G.input=new Controls(G,{
  unlock:()=>G.audio?.unlock(),pause,back:()=>{if(G.state==='paused')pause();},reload:()=>OT.player.startReload(G,G.player),
  disconnect:()=>{if(G.state==='playing')setState('paused');G.keys={};G.mouse.down=false;toast('CONTROLLER DISCONNECTED OR ASLEEP - TURN IT ON, THEN RESUME');},
  menu:direction=>{const buttons=menuButtons(),i=buttons.indexOf(document.activeElement);buttons[(i+direction+buttons.length)%buttons.length]?.focus();},
  confirm:()=>{const buttons=menuButtons();(buttons.includes(document.activeElement)?document.activeElement:$('start')).click();}
});
G.input.touch=new TouchControls(G,{unlock:()=>G.audio?.unlock(),reload:()=>OT.player.startReload(G,G.player),pause,visible:e=>{const s=project(e.x,e.y,29);return s.x>20&&s.x<width-20&&s.y>55&&s.y<height-45&&!(s.y>height-160&&(s.x<180||s.x>width-200))&&lineOfSight(G.player.x,G.player.y,e.x,e.y);}});
setupFullscreen({pause,isPlaying:()=>G.state==='playing'});
G.showAimGuide=true;G.reduceShake=true;G.difficulty='recruit';
try{const saved=JSON.parse(localStorage.getItem('ot3d_controller')||'{}');if([.1,.15,.2,.25].includes(saved.dead))G.input.dead=saved.dead;if([8,14,24].includes(saved.response))G.input.response=saved.response;if(typeof saved.gentle==='boolean')G.input.gentle=saved.gentle;if([0,3,5].includes(saved.assist))G.input.assistDegrees=saved.assist;if(typeof saved.guide==='boolean')G.showAimGuide=saved.guide;if(typeof saved.shake==='boolean')G.reduceShake=saved.shake;const mode=localStorage.getItem('ot3d_difficulty');if(['recruit','standard'].includes(mode))G.difficulty=mode;}catch{}
G.runDifficulty=G.difficulty;try{G.hiscore=Math.max(0,Number(localStorage.getItem(highScoreKey()))||0);}catch{}
function saveController(){try{localStorage.setItem('ot3d_controller',JSON.stringify({dead:G.input.dead,response:G.input.response,gentle:G.input.gentle,assist:G.input.assistDegrees,guide:G.showAimGuide,shake:G.reduceShake}));}catch{}updateInputPrompts();}
$('pad-deadzone').onclick=()=>{const a=[.1,.15,.2,.25];G.input.dead=a[(a.indexOf(G.input.dead)+1)%a.length];saveController();};
$('pad-response').onclick=()=>{const a=[8,14,24];G.input.response=a[(a.indexOf(G.input.response)+1)%a.length];saveController();};
$('pad-feel').onclick=()=>{G.input.gentle=!G.input.gentle;saveController();};
$('pad-assist').onclick=()=>{const a=[0,3,5];G.input.assistDegrees=a[(a.indexOf(G.input.assistDegrees)+1)%a.length];G.input.autoTarget=null;saveController();};
$('aim-guide').onclick=()=>{G.showAimGuide=!G.showAimGuide;saveController();};
$('shake-setting').onclick=()=>{G.reduceShake=!G.reduceShake;G.shake=0;saveController();};
$('difficulty').onclick=()=>{G.difficulty=G.difficulty==='recruit'?'standard':'recruit';try{localStorage.setItem('ot3d_difficulty',G.difficulty);}catch{}if(G.state==='menu'||G.state==='gameover'){G.runDifficulty=G.difficulty;try{G.hiscore=Math.max(0,Number(localStorage.getItem(highScoreKey()))||0);}catch{}}updateHUD();};
function updateInputPrompts(){
  if(!G.input)return;const pad=G.input.source==='pad',touch=G.input.touch?.enabled;
  setText('difficulty',(G.state==='paused'?'NEXT RUN: ':'DIFFICULTY: ')+G.difficulty.toUpperCase());
  setText('difficulty-help',(G.difficulty==='recruit'?'First time? Take 40% less damage, steadier moving shots, longer hit protection.':'Original combat challenge. Full damage and moving-shot spread.')+(G.state==='paused'?' Applies when you start a new run.':''));
  setText('pad-feel','STICK FEEL: '+(G.input.gentle?'GENTLE':'DIRECT'));
  setText('pad-assist','AIM ASSIST: '+(G.input.assistDegrees?G.input.assistDegrees+'°':'OFF'));
  setText('aim-guide','DIRECTION MARKER: '+(G.showAimGuide?'ON':'OFF'));setText('shake-setting','SHAKE: '+(G.reduceShake?'REDUCED':'ON'));
  setText('input-hint',touch?'LEFT THUMB MOVE / HOLD FIRE / AUTO AIM':pad?'LS MOVE & FACE / RT FIRE / X RELOAD':'WASD / ARROWS MOVE / MOUSE AIM & FIRE');
  setText('move-hint',touch?'Left thumb pad — move and dodge':pad?'Left stick - screen relative':'WASD or arrows - screen relative');
  setText('engage-hint',touch?'Hold FIRE — tracks a visible enemy':pad?'Light aim assist - RT fire - RS optional':'Aim at soldiers - hold mouse to fire');
  setText('survive-hint',touch?'Tap RELOAD — follow AMMO markers':pad?'X reload - follow AMMO markers':'R reload - follow AMMO markers');
  setText('pad-status',G.input.status);setText('pad-deadzone','STICK DEAD ZONE '+Math.round(G.input.dead*100)+'%');
  setText('pad-response','AIM RESPONSE '+({8:'SMOOTH',14:'NORMAL',24:'QUICK'})[G.input.response]);
}
initGame();resize();rebuild();showState();if(G.input.touch.enabled&&!G.lowQuality)toggleQuality();
function frame(t){
  requestAnimationFrame(frame);const begin=performance.now(),raw=last?(t-last)/1000:1/60;last=t;const dt=Math.min(.05,raw);G.stateT+=dt;
  G.input.poll(dt);updateCamera(dt);G.input.touch.update(dt);updateAim();
  if(G.state==='playing'){accum+=dt;let n=0;while(accum>=1/120&&n++<6){step(1/120);accum-=1/120;}}else accum=0;
  if(G.state==='playing'||frameCount%3===0){renderModels();updateAim();atmosphere.update(G.time,G.lowQuality,height/(height<600?600:680));renderer.render(scene,camera);drawOverlay();}
  uiT+=dt;if(uiT>.1){updateHUD();uiT=0;}if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.display='none';}
  if(raw<.2&&G.state==='playing'){frames.push(raw*1000);cpuFrames.push(performance.now()-begin);if(frames.length>1200){frames.shift();cpuFrames.shift();}}frameCount++;
}
window.__OT3D={G,OT,U,atmosphere,step,startRun,setState,damagePlayer,updateBullets,fireBullet,lineOfSight,moveCircle,project,updateAim,resize,generateLayout,validateLayout,legalSpawn,nearestClear,routeHeading,renderer,camera,scene,
  perf:()=>{const a=[...frames].sort((a,b)=>a-b),c=[...cpuFrames].sort((a,b)=>a-b);return{samples:a.length,fps:1000/(a.reduce((x,y)=>x+y,0)/a.length),medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],cpuMedianMs:c[Math.floor(c.length*.5)],cpuP95Ms:c[Math.floor(c.length*.95)],calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,viewport:[width,height],pixelRatio:renderer.getPixelRatio(),quality:G.lowQuality?'low':'high'};},resetPerf:()=>{frames=[];cpuFrames=[];},render:()=>{updateCamera(1);updateAim();renderModels();renderer.render(scene,camera);drawOverlay();updateHUD();}};
requestAnimationFrame(frame);
