// One-time source import. Run only when intentionally resyncing the reference.
import fs from 'node:fs';
const ref='C:/DEV/Thunderbolt_WWII/';
const read=n=>fs.readFileSync(ref+n,'utf8');
let p=read('modules/player.js');
p=p.slice(0,p.indexOf('  function draw(G, ctx)'))+'  return { init, reset, update, startReload };\n})();\n';
p=p.replace('moveCircle(p, dx * step, dy * step);','moveCircle(p, (dx + dy) * Math.SQRT1_2 * step, (dy - dx) * Math.SQRT1_2 * step);');
fs.writeFileSync('src/player.js',p);
let e=read('modules/enemies.js');
const preview=e.slice(e.indexOf('  function previewNextWave'),e.indexOf('  return { init, reset, update, draw, previewNextWave }'));
e=e.slice(0,e.indexOf('  // ---------- drawing ----------'))+preview+'  return { init, reset, update, previewNextWave, makeEnemy, spawnOne, buildQueue };\n})();\n';
e=e.replace(/Math\.random\(\)/g,'U.random()');
e=e.replace('const visJitter = U.rand(-0.35, 0.35);','const visJitter = V.rand(-0.35, 0.35);').replace('const shoulderTilt = U.rand(-0.22, 0.22);','const shoulderTilt = V.rand(-0.22, 0.22);');
const a=e.indexOf('  function clearSpotNearPlayer'), b=e.indexOf('  function makeEnemy');
e=e.slice(0,a)+`  function clearSpotNearPlayer(G) { return legalSpawn(G, 'nest'); }
  function moverSpawnPoint(G, minDist=500) { return legalSpawn(G, minDist===700 ? 'sniper' : 'rifleman'); }
`+e.slice(b);
const c=e.indexOf('    const m = G.MAP;',e.indexOf('  function nudgePickup')),d=e.indexOf('\n  function separation',c);
e=e.slice(0,c)+`    return nearestClear(G, x, y, 12);
  }
`+e.slice(d);
e=e.replace('      // base movement toward heading',`      // Route around cover using the validated walk grid when direct sight is blocked.
      if (!los && !tooClose) heading = routeHeading(G, e, p);
      // base movement toward heading`);
e=e.replace('const wob = Math.sin(G.time * e.phase) * 0.45;', 'const wob = los ? Math.sin(G.time * e.phase) * 0.45 : 0;');
e=e.replace("      G.kills++;", "      G.fx.corpse(e);\n      G.kills++;");
fs.writeFileSync('src/enemies.js',e);
let ui=read('modules/ui.js');
ui=ui.slice(0,ui.indexOf('  // world-space draw:'))+'  return { init, reset, update, banner: bannerFn, float: floatFn, flash: flashFn, applyUpgrade, getVisuals: () => ({banner, floats, flashT, hintT}) };\n})();\n';
ui=ui.replace('G.ui = api;', 'G.ui = OT.ui;');
ui=ui.replace('if (d < p.r + 12) {','if (d < p.r + 12 && lineOfSight(pk.x, pk.y, p.x, p.y)) {');
fs.writeFileSync('src/supplies.js',ui);
let audio=read('modules/audiofx.js');
audio=audio.replace(/U\.rand/g,'V.rand').replace(/U\.pick/g,'V.pick').replace(/Math\.random\(\)/g,'V.random()');
fs.writeFileSync('src/audiofx.js',audio);
fs.writeFileSync('output/source-hashes.json',JSON.stringify(Object.fromEntries(['template.html','modules/player.js','modules/enemies.js','modules/ui.js','modules/audiofx.js','modules/world.js','index.html'].map(n=>[n,read(n).length])),null,2));
