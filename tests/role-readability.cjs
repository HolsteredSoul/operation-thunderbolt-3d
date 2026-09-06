async(page)=>{
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>{
    const a=__OT3D,g=a.G;a.startRun('THUNDER-1944');g.nextWaveIn=999;g.wave=4;
    for(const [i,type]of ['rifleman','officer','sniper','nest'].entries()){
      const e=a.OT.enemies.makeEnemy(g,type,1200+(i+1)*65,900-(i+1)*65);
      Object.assign(e,{speed:0,fireCd:999,cooldown:999,angle:0});g.enemies.push(e);
    }
    a.setState('paused');a.render();document.getElementById('modal').style.display='none';
    const labels=document.createElement('div');labels.id='qa-role-labels';labels.style.cssText='position:fixed;inset:0;pointer-events:none;';
    for(const [i,e]of [g.player,...g.enemies].entries()){
      const p=a.project(e.x,e.y,0),label=document.createElement('div');
      label.style.cssText=`position:absolute;left:${p.x}px;top:${p.y+20}px;transform:translateX(-50%);padding:6px 9px;background:#182522ed;color:#eee4cc;font:11px Consolas;letter-spacing:1px;`;
      label.textContent=['ALLIED PLAYER','RIFLEMAN','OFFICER','SNIPER','MG NEST'][i];labels.append(label);
    }document.body.append(labels);
  });
  await page.screenshot({path:'output/playwright/role-comparison.png',clip:{x:835,y:355,width:860,height:300}});
  await page.evaluate(()=>{document.getElementById('qa-role-labels').remove();__OT3D.setState('playing');});
  const checks=[];
  for(const [type,h]of [['rifleman',46],['officer',46],['sniper',39],['nest',38]]){
    const p=await page.evaluate(({type,h})=>{const a=__OT3D,e=a.G.enemies.find(e=>e.type===type);return a.project(e.x,e.y,h);},{type,h});
    await page.mouse.move(p.x,p.y);await page.waitForTimeout(50);
    checks.push({type,selected:await page.evaluate(()=>__OT3D.G.aimTarget?.type)});
  }
  await page.screenshot({path:'output/playwright/role-label-in-game.png'});
  await page.keyboard.press('p');return checks;
}
