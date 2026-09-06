import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const noop=()=>{}, sandbox={console,Event:class{},window:{dispatchEvent:noop},localStorage:{getItem:()=>null,setItem:noop},crypto:globalThis.crypto};
vm.createContext(sandbox);
for(const file of ['layout','core','player','enemies','supplies'])vm.runInContext(fs.readFileSync(`src/${file}.js`,'utf8'),sandbox);
const run=code=>vm.runInContext("{"+code+"}",sandbox),results=[];
function test(name,fn){if(process.env.COMBAT_ONLY&&name.startsWith('20 fixed')){console.log('SKIP fixed-seed suite (combat-only run)');return;}fn();results.push({name,pass:true});console.log('PASS',name);}
run(`G.audio={play(){},unlock(){}};G.fx={impact(){},blood(){},corpse(){},burst(){},explode(){},muzzle(){}};OT.ui.init(G);OT.audiofx={reset(){}};`);
const seeds=Array.from({length:process.env.COMBAT_ONLY?0:20},(_,i)=>'QA-'+String(i).padStart(2,'0'));
test('20 fixed seeds: fully connected, protected spawn, doorways, density, lanes, legal spawns',()=>{
 for(const seed of seeds){const v=run(`setupLayout('${seed}');OT.player.reset(G);G.enemies=[];JSON.stringify(G.validation)`);assert.equal(JSON.parse(v).valid,true,seed);
  for(const type of ['rifleman','sniper','nest'])for(const pos of [[1200,900],[90,90],[2300,1700],[1200,1650]]){
   const valid=run(`Object.assign(G.player,nearestClear(G,${pos[0]},${pos[1]}));(()=>{for(let i=0;i<20;i++){const p=legalSpawn(G,'${type}'),d=U.dist(p.x,p.y,G.player.x,G.player.y);if(!clearAt(G,p.x,p.y,26)||d<${type==='nest'?380:type==='sniper'?700:500})return false;}return true;})()`);assert.ok(valid,seed+type+pos);
  }
 }
});
test('seed replay repeatability and independent visual RNG',()=>{assert.equal(run(`JSON.stringify(generateLayout('repeat').obstacles)`),run(`for(let i=0;i<1000;i++)V.random();JSON.stringify(generateLayout('repeat').obstacles)`));});
test('bounded known-good fallback validates',()=>assert.ok(run(`generateLayout('force',true).validation.valid`)));
test('source player baseline and reload conservation',()=>{
 run(`startRun('QA-00');G.player.ammo=2;OT.player.startReload(G,G.player);OT.player.update(G,1.16);`);
 assert.equal(run('G.player.ammo'),8);assert.equal(run('G.player.reserve'),66);assert.equal(run('G.player.dmg'),34);assert.equal(run('G.player.fireCdBase'),.16);assert.equal(run('G.player.hp'),100);
});
test('four upgrades cap at four stacks; capped pickups give +200 each',()=>{
 run(`startRun('QA-00');for(const t of ['dmg','fireRate','mag','maxHp'])for(let i=0;i<5;i++)OT.ui.applyUpgrade(G,G.player,t);`);
 assert.equal(run('G.player.dmg'),58);assert.ok(Math.abs(run('G.player.fireCdBase')-.06)<1e-9);assert.equal(run('G.player.magSize'),16);assert.equal(run('G.player.maxHp'),180);assert.equal(run('G.score'),800);
});
test('health +35, full-health conversion +8, ammo +16, reserve cap160',()=>{
 run(`startRun('QA-00');G.player.hp=50;G.pickups=[{x:1200,y:900,type:'health',t:0}];OT.ui.update(G,.01);`);assert.equal(run('G.player.hp'),85);
 run(`G.player.hp=100;G.pickups=[{x:1200,y:900,type:'health',t:0}];OT.ui.update(G,.01);`);assert.equal(run('G.player.reserve'),80);
 run(`G.player.reserve=155;G.pickups=[{x:1200,y:900,type:'ammo',t:0}];OT.ui.update(G,.01);`);assert.equal(run('G.player.reserve'),160);
});
test('drop decision uses conditional independent rolls',()=>{
 for(const [rolls,kind] of [[ [.04,.4],'upgrade'],[[.06,.21,.39],'health'],[[.06,.21,.41],'ammo'],[[.06,.23],'none']]){
  run(`startRun('QA-00');G.enemies=[OT.enemies.makeEnemy(G,'rifleman',1200,900)];G.enemies[0].dead=true;let seq=${JSON.stringify(rolls)};U.random=()=>seq.shift()??.5;OT.enemies.update(G,.01);`);
  assert.equal(run(`G.pickups.length ? (G.pickups[0].isUpgrade?'upgrade':G.pickups[0].type):'none'`),kind);
 }
});
test('waves1–5 and capped wave20: exact counts, pacing, rewards, four-second break',()=>{
 for(const [w,counts]of [[1,[7,0,0,0]],[2,[9,1,0,0]],[3,[11,1,1,0]],[4,[13,2,1,1]],[5,[15,2,2,1]],[20,[24,4,3,3]]]){
  const result=JSON.parse(run(`startRun('QA-00');G.wave=${w-1};G.nextWaveIn=0;OT.enemies.update(G,.001);let counts={rifleman:0,officer:0,sniper:0,nest:0},spawnTimes=[],elapsed=0;for(let i=0;i<2200;i++){elapsed+=1/120;OT.enemies.update(G,1/120);for(const e of G.enemies){if(!e.testSeen){e.testSeen=true;counts[e.type]++;spawnTimes.push(elapsed);e.dead=true;}}if(G.nextWaveIn===4)break;}JSON.stringify({counts:Object.values(counts),break:G.nextWaveIn,score:G.score,gaps:spawnTimes.slice(1).map((t,i)=>t-spawnTimes[i])});`));
  assert.deepEqual(result.counts,counts);assert.equal(result.break,4);assert.equal(result.score,counts[0]*100+counts[1]*250+counts[2]*350+counts[3]*400+w*50);assert.ok(result.gaps.every(t=>t>=.449&&t<.47));
 }
});
test('swept bullets hit targets and stop at cover; muzzle cannot shoot through wall',()=>{
 run(`startRun('QA-00');G.obstacles=[];G.enemies=[OT.enemies.makeEnemy(G,'rifleman',1300,900)];fireBullet(1200,900,0,750,34,true,{life:.7});updateBullets(.2);`);assert.equal(run('G.enemies[0].hp'),31);
 run(`G.enemies[0].hp=65;G.obstacles=[{x:1250,y:850,w:16,h:100}];fireBullet(1200,900,0,750,34,true,{life:.7});updateBullets(.2);`);assert.equal(run('G.enemies[0].hp'),65);assert.equal(run('G.bullets.length'),0);
 run(`G.player.x=1240;fireBullet(1262,900,0,750,34,true,{life:.7});`);assert.equal(run('G.bullets.length'),0);
});
test('damage invulnerability .55s and clean restart',()=>{
 run(`startRun('QA-00');damagePlayer(8);damagePlayer(8);`);assert.equal(run('G.player.hp'),92);assert.equal(run('G.player.invulnT'),.55);
 run(`G.player.invulnT=0;damagePlayer(100);`);assert.equal(run('G.state'),'gameover');run(`startRun('QA-00');`);assert.equal(run('G.player.hp'),100);assert.equal(run('G.score'),0);assert.equal(run('G.enemies.length+G.bullets.length+G.pickups.length+G.corpses.length'),0);
});
test('sniper 1.4s telegraph cancels on cover; nest stays stationary and fires six rounds',()=>{
 run(`startRun('QA-00');G.obstacles=[];const s=OT.enemies.makeEnemy(G,'sniper',1700,900);s.cooldown=0;G.enemies=[s];OT.enemies.update(G,.01);`);assert.equal(run('G.enemies[0].telegraphT'),1.4);
 run(`G.obstacles=[{x:1450,y:850,w:16,h:100}];OT.enemies.update(G,.1);`);assert.equal(run('G.enemies[0].telegraphT'),0);
 run(`startRun('QA-00');G.obstacles=[];const n=OT.enemies.makeEnemy(G,'nest',1600,900);n.cooldown=0;n.angle=Math.PI;G.enemies=[n];for(let i=0;i<95;i++)OT.enemies.update(G,1/120);`);assert.equal(run('G.bullets.length'),6);assert.equal(run('G.enemies[0].x'),1600);
});
fs.mkdirSync('output',{recursive:true});fs.writeFileSync(process.env.COMBAT_ONLY?'output/combat-invariants.json':'output/invariants.json',JSON.stringify({seeds,results},null,2));
console.log(`${results.length} checks passed`);
