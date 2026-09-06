async (page) => {
  await page.setViewportSize({width:1920,height:1080});
  await page.getByRole('button',{name:'DEPLOY'}).click();
  await page.mouse.move(1150,480);
  const before=await page.evaluate(()=>({x:__OT3D.G.player.x,y:__OT3D.G.player.y}));
  await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');
  const after=await page.evaluate(()=>({x:__OT3D.G.player.x,y:__OT3D.G.player.y}));
  await page.keyboard.down('a');await page.waitForTimeout(650);await page.keyboard.up('a');
  for(let i=0;i<24;i++){
    const aim=await page.evaluate(()=>{const a=__OT3D,g=a.G,p=g.player;const e=g.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];return e?a.project(e.x,e.y,29):null;});
    if(aim){await page.mouse.move(aim.x,aim.y);await page.mouse.down();}
    if(i===6)await page.keyboard.down('s');if(i===9)await page.keyboard.up('s');
    if(i===12)await page.keyboard.press('r');
    await page.waitForTimeout(450);
  }
  await page.mouse.up();await page.keyboard.press('r');await page.waitForTimeout(1300);
  await page.screenshot({path:'output/playwright/blender-gameplay.png'});
  const result=await page.evaluate(()=>({state:__OT3D.G.state,wave:__OT3D.G.wave,hp:__OT3D.G.player.hp,ammo:__OT3D.G.player.ammo,reserve:__OT3D.G.player.reserve,kills:__OT3D.G.kills,shots:__OT3D.G.stats.shots,hits:__OT3D.G.stats.hits,perf:__OT3D.perf()}));
  await page.keyboard.press('p');
  return {before,after,result};
}
