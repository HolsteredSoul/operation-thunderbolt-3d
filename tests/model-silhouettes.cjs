async(page)=>{
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>{
    const a=__OT3D,g=a.G;a.startRun('THUNDER-1944');g.nextWaveIn=999;g.wave=4;
    for(const [i,type]of ['rifleman','officer','sniper','nest'].entries()){
      const e=a.OT.enemies.makeEnemy(g,type,1200+(i+1)*75,900-(i+1)*75);
      Object.assign(e,{speed:0,fireCd:999,cooldown:999,angle:0});g.enemies.push(e);
    }
    a.setState('paused');a.render();document.getElementById('modal').style.display='none';document.getElementById('overlay').style.display='none';
  });
  await page.screenshot({path:'output/playwright/model-silhouettes-color.png',clip:{x:850,y:400,width:1050,height:260}});
  await page.evaluate(()=>document.getElementById('scene').style.filter='grayscale(1)');
  await page.screenshot({path:'output/playwright/model-silhouettes-gray.png',clip:{x:850,y:400,width:1050,height:260}});
  await page.evaluate(()=>document.getElementById('scene').style.filter='');
  const results=[];
  for(const [type,h,forward]of [['rifleman',48,4],['officer',52,0],['sniper',35,7],['nest',35,-5]]){
    const p=await page.evaluate(({type,h,forward})=>{const a=__OT3D,e=a.G.enemies.find(e=>e.type===type);return a.project(e.x+forward,e.y,h);},{type,h,forward});
    await page.mouse.move(p.x,p.y);
    results.push({type,selected:await page.evaluate(()=>__OT3D.G.aimTarget?.type)});
  }
  if(results.some(r=>r.type!==r.selected))throw Error(JSON.stringify(results));
  return results;
}
