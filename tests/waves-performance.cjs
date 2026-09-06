async (page) => {
  await page.reload();await page.waitForFunction(()=>window.__OT3D);
  const results=[];
  await page.setViewportSize({width:1920,height:1080});
  for(const w of [1,2,3,4,5,20]){
    const data=await page.evaluate(w=>{
      const a=__OT3D,g=a.G;a.startRun('QA-11');g.wave=w-1;g.nextWaveIn=0;g.player.invulnT=9999;
      const count=Math.min(24,5+2*w)+(w>=2?Math.min(4,Math.floor(w/2)):0)+(w>=3?Math.min(3,Math.floor((w-1)/2)):0)+(w>=4?Math.min(3,Math.floor((w-2)/2)):0);
      for(let i=0;i<2200&&g.enemies.length<count;i++)a.step(1/120);
      const composition={};for(const e of g.enemies)composition[e.type]=(composition[e.type]||0)+1;
      a.setState('paused');a.render();return{wave:g.wave,count:g.enemies.length,expected:count,composition};
    },w);
    results.push(data);
    if(w===5){await page.keyboard.press('p');await page.waitForTimeout(600);await page.screenshot({path:'output/playwright/wave-5.png'});await page.keyboard.press('p');}
  }
  // All 34 actors stay alive. Move them to legal nearby cells to keep combat busy.
  await page.evaluate(()=>{
    const a=__OT3D,g=a.G,p=g.player;
    const cells=g.nav.cells.filter(c=>{const d=Math.hypot(c.x-p.x,c.y-p.y);return d>=320&&d<=780;});
    const used=[];
    for(let i=0;i<g.enemies.length;i++){
      const wanted={x:p.x+Math.cos(i/g.enemies.length*Math.PI*2)*500,y:p.y+Math.sin(i/g.enemies.length*Math.PI*2)*500};
      const c=cells.filter(c=>!used.some(u=>Math.hypot(c.x-u.x,c.y-u.y)<55)).sort((a,b)=>Math.hypot(a.x-wanted.x,a.y-wanted.y)-Math.hypot(b.x-wanted.x,b.y-wanted.y))[0];
      Object.assign(g.enemies[i],{x:c.x,y:c.y});used.push(c);
    }
    a.setState('playing');a.resetPerf();
  });
  await page.waitForTimeout(5000);await page.evaluate(()=>__OT3D.resetPerf());await page.waitForTimeout(12000);
  const high=await page.evaluate(()=>({perf:__OT3D.perf(),enemies:__OT3D.G.enemies.length,bullets:__OT3D.G.bullets.length,gl:(()=>{const gl=__OT3D.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);})(),browser:navigator.userAgent}));
  await page.screenshot({path:'output/playwright/capped-population.png'});
  await page.getByRole('button',{name:'HIGH QUALITY'}).click();await page.waitForTimeout(2000);await page.evaluate(()=>__OT3D.resetPerf());await page.waitForTimeout(12000);
  const low=await page.evaluate(()=>({perf:__OT3D.perf(),enemies:__OT3D.G.enemies.length}));
  await page.getByRole('button',{name:'LOW QUALITY'}).click();await page.keyboard.press('p');
  return{waves:results,high,low};
}
