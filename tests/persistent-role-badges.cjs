async(page)=>{
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>{
    const a=__OT3D,g=a.G;a.startRun('THUNDER-1944');g.nextWaveIn=999;g.wave=4;
    for(const [i,type]of ['rifleman','officer','sniper','nest'].entries()){
      const e=a.OT.enemies.makeEnemy(g,type,1200+(i+1)*65,900-(i+1)*65);
      Object.assign(e,{speed:0,fireCd:999,cooldown:999,angle:0});g.enemies.push(e);
    }
    a.setState('paused');document.getElementById('modal').style.display='none';a.render();
  });
  await page.mouse.move(700,800);
  const result=await page.evaluate(()=>{
    const a=__OT3D,c=document.getElementById('overlay').getContext('2d'),original=c.fillText,text=[];
    c.fillText=function(t,...args){text.push(t);return original.call(this,t,...args);};
    try{a.render();}finally{c.fillText=original;}
    return {withoutAimTarget:a.G.aimTarget===null,roles:['YOU','RIFLE','OFFICER','SNIPER','MG NEST'].map(role=>({role,drawn:text.includes(role)})),overlayDoesNotBlockMouse:getComputedStyle(document.getElementById('overlay')).pointerEvents==='none'};
  });
  await page.screenshot({path:'output/playwright/persistent-role-badges.png',clip:{x:835,y:340,width:860,height:300}});
  await page.setViewportSize({width:1280,height:720});await page.waitForFunction(()=>document.getElementById('overlay').width===1280);
  await page.screenshot({path:'output/playwright/role-badges-720p.png'});
  await page.evaluate(()=>__OT3D.setState('paused'));
  return result;
}
