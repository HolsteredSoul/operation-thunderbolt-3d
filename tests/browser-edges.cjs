async (page) => {
  const checks=[];
  await page.evaluate(()=>{__OT3D.startRun('QA-03');__OT3D.G.nextWaveIn=999;});
  const cover=await page.evaluate(()=>{
    const a=__OT3D,g=a.G,o=g.obstacles.find(o=>o.kind==='wall'&&o.w>o.h),x=o.x+o.w/2;
    Object.assign(g.player,{x,y:o.y-16});a.moveCircle(g.player,0,70);
    const movementBlocked=g.player.y<o.y;
    const e=a.OT.enemies.makeEnemy(g,'rifleman',x,o.y+o.h+55);g.enemies=[e];
    a.fireBullet(x,o.y-60,Math.PI/2,750,34,true,{life:.7});a.updateBullets(.25);
    const bulletBlocked=e.hp===65;
    g.pickups=[{x,y:o.y+o.h+16,type:'ammo',t:0}];const py=g.pickups[0].y;a.OT.ui.update(g,.2);
    return {movementBlocked,bulletBlocked,pickupBlocked:g.pickups.length===1&&g.pickups[0].y===py};
  });checks.push({name:'actual village wall blocks movement, bullets and pickup magnet',pass:Object.values(cover).every(Boolean),data:cover});
  await page.setViewportSize({width:900,height:650});await page.waitForFunction(()=>document.getElementById('overlay').width===900);
  await page.evaluate(()=>{const a=__OT3D;a.startRun('QA-03');a.G.nextWaveIn=999;const e=a.OT.enemies.makeEnemy(a.G,'sniper',2000,900);e.cooldown=0;a.G.enemies=[e];a.G.player.invulnT=100;});
  await page.waitForTimeout(200);
  const sniper=await page.evaluate(()=>{const a=__OT3D,e=a.G.enemies[0],s=a.project(e.x,e.y,51);return {telegraph:e.telegraphT,offscreen:s.y<0||s.y>innerHeight||s.x>innerWidth||s.x<0,source:s};});
  await page.screenshot({path:'output/playwright/offscreen-sniper.png'});checks.push({name:'offscreen sniper warning',pass:sniper.telegraph>0&&sniper.offscreen,data:sniper});
  await page.keyboard.press('p');
  const memory=await page.evaluate(()=>{const a=__OT3D,counts=[];for(let i=0;i<10;i++){a.startRun('QA-'+i);a.render();counts.push(a.renderer.info.memory.geometries);}a.setState('paused');return counts;});
  checks.push({name:'ten clean restarts with stable GPU geometry count',pass:Math.max(...memory)-Math.min(...memory)<=1,data:memory});
  await page.evaluate(()=>{const a=__OT3D;a.startRun('QA-03');a.G.nextWaveIn=999;const e=a.OT.enemies.makeEnemy(a.G,'rifleman',1480,900);e.speed=0;e.fireCd=999;a.G.enemies=[e];});
  await page.keyboard.down('w');
  let tracking=true;
  for(let i=0;i<5;i++){
    const target=await page.evaluate(()=>{const a=__OT3D,e=a.G.enemies[0];return a.project(e.x,e.y,29);});
    await page.mouse.move(target.x,target.y);await page.waitForTimeout(50);
    tracking=tracking&&await page.evaluate(()=>__OT3D.G.aimTarget===__OT3D.G.enemies[0]);
  }
  await page.keyboard.up('w');checks.push({name:'aim tracks visible soldier during camera following',pass:tracking});
  await page.keyboard.press('p');
  return checks;
}
