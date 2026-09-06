async (page) => {
  const saved=await page.evaluate(()=>Object.fromEntries(['ot3d_controller','ot3d_difficulty','ot3d_hiscore_v1','ot3d_hiscore_recruit_v1'].map(k=>[k,localStorage.getItem(k)])));
  await page.evaluate(()=>localStorage.setItem('ot3d_difficulty','standard'));
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1920,height:1080});
  const checks=[];
  const setup=async()=>page.evaluate(()=>{const a=__OT3D;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});a.G.difficulty='standard';a.G.input.useMouse();a.G.input.suspended=false;a.startRun('QA-03');a.G.nextWaveIn=999;return true;});
  await setup();
  await page.mouse.move(1080,490);await page.mouse.down();await page.waitForTimeout(380);
  const fired=await page.evaluate(()=>({ammo:__OT3D.G.player.ammo,shots:__OT3D.G.stats.shots,down:__OT3D.G.mouse.down,element:document.elementFromPoint(1080,490).id}));
  await page.mouse.up();checks.push({name:'real primary-button firing',pass:fired.shots>=2,data:fired});
  await page.keyboard.press('r');await page.waitForTimeout(1250);checks.push({name:'real R reload',pass:await page.evaluate(()=>__OT3D.G.player.ammo===8&&__OT3D.G.player.reserve<72),data:await page.evaluate(()=>({ammo:__OT3D.G.player.ammo,reserve:__OT3D.G.player.reserve,reload:__OT3D.G.player.reloadT}))});
  await setup();
  const target=await page.evaluate(()=>{const a=__OT3D,e=a.OT.enemies.makeEnemy(a.G,'rifleman',1350,900);e.speed=0;e.fireCd=999;a.G.enemies=[e];a.render();return a.project(e.x,e.y,46);});
  await page.mouse.move(target.x,target.y);await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();
  checks.push({name:'visible soldier head targeting and projectile kill',pass:await page.evaluate(()=>__OT3D.G.kills===1),data:await page.evaluate(()=>({shots:__OT3D.G.stats.shots,hits:__OT3D.G.stats.hits,kills:__OT3D.G.kills}))});
  await setup();
  const start=await page.evaluate(()=>({x:__OT3D.G.player.x,y:__OT3D.G.player.y}));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  const moved=await page.evaluate(()=>({x:__OT3D.G.player.x,y:__OT3D.G.player.y}));checks.push({name:'screen-right arrows',pass:moved.x>start.x&&moved.y<start.y,data:{start,moved}});
  // Projection/unprojection agreement across a following camera and three viewport sizes.
  for(const [w,h]of[[1280,720],[1920,1080],[900,650]]){
    await page.setViewportSize({width:w,height:h});await page.waitForFunction(()=>document.getElementById('overlay').width===innerWidth&&document.getElementById('overlay').height===innerHeight);await page.waitForTimeout(100);
    const s=await page.evaluate(()=>{const a=__OT3D,e=a.OT.enemies.makeEnemy(a.G,'rifleman',a.G.player.x+140,a.G.player.y);e.speed=0;e.fireCd=999;a.G.enemies=[e];a.render();return a.project(e.x,e.y,46);});
    await page.mouse.move(s.x,s.y);
    checks.push({name:`targeting at ${w}x${h}`,pass:await page.evaluate(()=>{const a=__OT3D,e=a.G.enemies[0];return a.G.aimTarget===e&&Math.hypot(a.G.mouse.wx-e.x,a.G.mouse.wy-e.y)<.01;})});
  }
  await page.setViewportSize({width:1920,height:1080});
  await page.keyboard.press('p');const paused=await page.evaluate(()=>__OT3D.G.time);await page.waitForTimeout(300);checks.push({name:'pause freezes simulation',pass:await page.evaluate(t=>__OT3D.G.state==='paused'&&__OT3D.G.time===t,paused)});
  await page.keyboard.press('Escape');checks.push({name:'Escape resumes',pass:await page.evaluate(()=>__OT3D.G.state==='playing')});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));checks.push({name:'focus-loss clears fire and movement',pass:await page.evaluate(()=>__OT3D.G.state==='paused'&&!__OT3D.G.mouse.down&&Object.keys(__OT3D.G.keys).length===0)});
  await page.keyboard.press('Enter');await page.evaluate(()=>{__OT3D.G.muted=false;__OT3D.G.reduceShake=false;});await page.keyboard.press('m');await page.keyboard.press('x');checks.push({name:'mute and reduced shake',pass:await page.evaluate(()=>__OT3D.G.muted&&__OT3D.G.reduceShake)});
  const upgrades=await page.evaluate(()=>{const a=__OT3D;for(const t of ['dmg','fireRate','mag','maxHp'])for(let i=0;i<5;i++){a.G.pickups.push({x:a.G.player.x,y:a.G.player.y,type:t,isUpgrade:true,t:0});a.OT.ui.update(a.G,.001);}return {dmg:a.G.player.dmg,rate:a.G.player.fireCdBase,mag:a.G.player.magSize,hp:a.G.player.maxHp,score:a.G.score};});
  checks.push({name:'pickup collection and upgrade caps in browser',pass:upgrades.dmg===58&&upgrades.mag===16&&upgrades.hp===180&&Math.abs(upgrades.rate-.06)<1e-8&&upgrades.score>=800,data:upgrades});
  await page.evaluate(()=>{const a=__OT3D;a.G.score=12345;a.G.player.invulnT=0;a.damagePlayer(999);});
  await page.screenshot({path:'output/playwright/results.png'});
  checks.push({name:'death screen and separate high-score key',pass:await page.evaluate(()=>__OT3D.G.state==='gameover'&&localStorage.getItem('ot3d_hiscore_v1')==='12345')});
  await page.reload();await page.waitForFunction(()=>window.__OT3D);checks.push({name:'high score survives reload',pass:await page.evaluate(()=>__OT3D.G.hiscore===12345)});
  await page.getByRole('button',{name:'DEPLOY'}).click();checks.push({name:'clean restart',pass:await page.evaluate(()=>{const g=__OT3D.G;return g.player.hp===100&&g.player.ammo===8&&g.player.reserve===72&&g.score===0&&g.kills===0&&g.bullets.length===0&&g.pickups.length===0;})});
  await page.keyboard.press('p');
  await page.evaluate(saved=>{for(const [key,value]of Object.entries(saved)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}},saved);
  await page.reload();await page.waitForFunction(()=>window.__OT3D);
  if(checks.some(c=>!c.pass))throw Error(JSON.stringify(checks));return checks;
}
