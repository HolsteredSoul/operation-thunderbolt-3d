import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Controls,radial} from '../src/input.js';
const noop=()=>{},sandbox={console,Event:class{},window:{dispatchEvent:noop},localStorage:{getItem:()=>null,setItem:noop},crypto:globalThis.crypto};
vm.createContext(sandbox);for(const f of ['layout','ammo-placement','core','player','enemies','supplies'])vm.runInContext(fs.readFileSync(`src/${f}.js`,'utf8'),sandbox);
const run=s=>vm.runInContext('{'+s+'}',sandbox);
run(`G.audio={play(){},unlock(){}};G.fx={impact(){},blood(){},corpse(){},burst(){},explode(){},muzzle(){}};OT.ui.init(G);OT.audiofx={reset(){}};`);
for(let i=0;i<20;i++){
  run(`startRun('QA-${String(i).padStart(2,'0')}');G.nextWaveIn=999;`);
  for(const [x,y]of [[1200,900],[90,90],[2300,1700],[410,400]]){
    const result=run(`Object.assign(G.player,nearestClear(G,${x},${y}));G.pickups=[];G.player.ammo=0;G.player.reserve=0;OT.ui.update(G,.01);
      (()=>{const pk=G.pickups.find(p=>p.emergency);if(!pk)return false;
        for(let i=0;i<500&&G.pickups.includes(pk);i++){const a=routeHeading(G,G.player,pk);moveCircle(G.player,Math.cos(a)*2,Math.sin(a)*2);OT.ui.update(G,.01);}
        return !G.pickups.includes(pk)&&G.player.reserve===24&&G.player.ammo===0&&G.kills===0;})()`);
    assert.ok(result,`reachable collection QA-${i} at ${x},${y}`);
  }
}
console.log('PASS emergency ammo can be reached and collected without kills: 20 seeds, 4 positions each');
run(`startRun('QA-03');G.player.ammo=8;G.player.reserve=8;OT.ui.update(G,.01);`);
assert.equal(run('G.pickups.filter(p=>p.emergency).length'),1);
const first=run('JSON.stringify(G.pickups[0])');
run(`for(let i=0;i<40;i++)OT.ui.update(G,1);`);assert.equal(run('G.pickups.filter(p=>p.emergency).length'),1);
run(`startRun('QA-03');G.player.ammo=8;G.player.reserve=8;OT.ui.update(G,.01);`);assert.equal(run('JSON.stringify(G.pickups[0])'),first);
run(`G.player.ammo=0;G.player.reserve=0;Object.assign(G.player,G.pickups[0]);OT.ui.update(G,.01);OT.player.startReload(G,G.player);OT.player.update(G,1.16);`);
assert.equal(run('G.player.ammo'),8);assert.equal(run('G.player.reserve'),16);
run(`G.player.ammo=0;G.player.reserve=0;OT.ui.update(G,.01);`);assert.equal(run('G.pickups.filter(p=>p.emergency).length'),1);
run(`G.player.reserve=159;Object.assign(G.player,G.pickups[0]);OT.ui.update(G,.01);`);assert.equal(run('G.player.reserve'),160);
run(`startRun('QA-03');G.pickups=[{x:1400,y:900,type:'ammo',t:0},{x:1400,y:900,type:'health',t:0},{x:1400,y:900,type:'dmg',isUpgrade:true,t:0}];OT.ui.update(G,15);`);
assert.equal(run('G.pickups.length'),1);assert.equal(run('G.pickups[0].type'),'ammo');run('OT.ui.update(G,15);');assert.equal(run('G.pickups.length'),0);
run(`startRun('QA-03');G.player.ammo=0;G.player.reserve=0;OT.ui.update(G,.01);G.obstacles.push({x:1210,y:870,w:10,h:60});G.pickups[0].x=1220;G.pickups[0].y=900;OT.ui.update(G,.01);`);assert.equal(run('G.player.reserve'),0);
console.log('PASS threshold, deterministic replay, non-expiry, repeat recovery, reload, reserve cap, independent lifetimes and blocked collection');
const g={state:'playing',keys:{},mouse:{down:false}},events=[];let input;
input=new Controls(g,{unlock:noop,reload:()=>events.push('reload'),pause:()=>{g.state=g.state==='playing'?'paused':'playing';input.reset();events.push('pause');},disconnect:()=>{g.state='paused';events.push('disconnect');},menu:n=>events.push(n),confirm:()=>events.push('confirm'),back:()=>events.push('back')});
const pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
const tick=()=>input.poll(1/60,[pad]),button=(i,value)=>pad.buttons[i]={value:Number(value),pressed:value};
tick();pad.axes=[.05,-.04,.08,.03];tick();assert.equal(input.source,'mouse');
pad.axes=[1,1,0,0];tick();assert.equal(input.source,'pad');assert.ok(Math.abs(Math.hypot(input.sample().moveX,input.sample().moveY)-1)<1e-8);
pad.axes=[.575,0,0,0];tick();assert.ok(Math.abs(input.sample().moveX-.5)<1e-8);
button(7,true);tick();assert.equal(input.sample().fire,true);button(2,true);tick();tick();assert.equal(events.filter(e=>e==='reload').length,1);
button(9,true);tick();assert.equal(g.state,'paused');assert.equal(input.sample().fire,false);tick();assert.equal(events.filter(e=>e==='pause').length,1);
button(9,false);tick();button(9,true);tick();assert.equal(g.state,'playing');assert.equal(input.sample().fire,false);
button(7,false);tick();button(7,true);tick();assert.equal(input.sample().fire,true);
input.poll(1/60,[]);assert.equal(g.state,'paused');assert.equal(input.fire,false);tick();assert.equal(input.sample().fire,false);
input.useMouse();tick();assert.equal(input.source,'mouse');
assert.deepEqual(radial(.1,.1),{x:0,y:0});
console.log('PASS controller analog speed, drift, source switching, button edges, pause/release gate and disconnect');

const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
input.poll(1/60);assert.ok(input.status.includes('unavailable'));assert.equal(input.fire,false);
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads(){throw Error('blocked');}}});
input.poll(1/60);assert.ok(input.status.includes('blocked'));assert.equal(input.fire,false);
if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
console.log('PASS unavailable or blocked controller API degrades without breaking gameplay');
