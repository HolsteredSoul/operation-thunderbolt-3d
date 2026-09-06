async (page) => {
  await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>{const a=__OT3D;a.startRun('THUNDER-1944');a.G.wave=3;a.G.nextWaveIn=0;a.G.player.invulnT=1000;for(let i=0;i<950;i++)a.step(1/120);a.render();});
  await page.waitForTimeout(200);
  await page.screenshot({path:'output/playwright/review-gameplay.png'});
  await page.evaluate(()=>localStorage.removeItem('ot3d_hiscore_v1'));
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.waitForTimeout(300);
  await page.screenshot({path:'output/playwright/review-menu.png'});
  return await page.evaluate(()=>({state:__OT3D.G.state,highScore:__OT3D.G.hiscore,seed:__OT3D.G.seed,localDependencies:[...performance.getEntriesByType('resource')].filter(r=>r.name.startsWith('http')).every(r=>new URL(r.name).origin===location.origin)}));
}
