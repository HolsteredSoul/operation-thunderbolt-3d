async(page)=>{
  await page.goto('http://127.0.0.1:8083/?v=controller5');await page.waitForFunction(()=>window.__OT3D);
  const result=await page.evaluate(()=>{
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});
    const a=__OT3D,g=a.G;a.startRun('QA-03');g.nextWaveIn=999;
    const e=a.OT.enemies.makeEnemy(g,'rifleman',1400,900+200*Math.tan(Math.PI/30));Object.assign(e,{speed:0,fireCd:999});g.enemies=[e];
    g.input.source='pad';g.input.heading=0;g.input.assistDegrees=5;g.input.manualAim=false;g.input.move={x:0,y:0};g.input.suspended=false;a.render();
    const assisted=g.input.sample().aimAngle;
    a.OT.player.update(g,1/120);a.render();
    const matchesShot=Math.abs(g.player.angle-assisted)<1e-8,retainsTarget=g.input.autoTarget===e;
    const reticleAngle=Math.atan2(g.mouse.wy-g.player.y,g.mouse.wx-g.player.x);
    e.y=1100;a.render();const outsideExcluded=g.input.autoTarget===null;
    e.y=900;g.obstacles.push({x:1290,y:875,w:20,h:50});a.render();const coverExcluded=g.input.autoTarget===null;
    a.setState('paused');return{assistedDegrees:assisted*180/Math.PI,matchesShot,retainsTarget,reticleMatchesShot:Math.abs(reticleAngle-assisted)<1e-8,outsideExcluded,coverExcluded};
  });
  await page.reload();await page.waitForFunction(()=>window.__OT3D);
  if(!Object.entries(result).every(([key,value])=>key==='assistedDegrees'?Math.abs(value-3)<.01:value))throw Error(JSON.stringify(result));
  return result;
}
