async (page) => {
  const results=[];
  await page.setViewportSize({width:1920,height:1080});
  for(const seed of ['QA-03','QA-11','QA-18']){
    await page.evaluate(seed=>__OT3D.startRun(seed),seed);
    let held=null,firing=false;
    for(let i=0;i<72;i++){
      const situation=await page.evaluate(()=>{
        const a=__OT3D,g=a.G,p=g.player;
        const e=g.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
        if(!e)return {state:g.state};
        const s=a.project(e.x,e.y,29),ps=a.project(p.x,p.y,29),d=Math.hypot(e.x-p.x,e.y-p.y);
        return{state:g.state,x:s.x,y:s.y,dx:s.x-ps.x,dy:s.y-ps.y,d,los:a.lineOfSight(p.x,p.y,e.x,e.y)};
      });
      if(situation.state!=='playing')break;
      let key=null;
      if(situation.d>460||situation.los===false){key=Math.abs(situation.dx)>Math.abs(situation.dy)?(situation.dx>0?'d':'a'):(situation.dy>0?'s':'w');}
      else if(situation.d<170)key=situation.dx>0?'a':'d';
      if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}
      const canFire=situation.d<520&&situation.x>50&&situation.x<1870&&situation.y>110&&situation.y<900;
      if(canFire){await page.mouse.move(situation.x,situation.y);if(!firing){await page.mouse.down();firing=true;}}
      else if(firing){await page.mouse.up();firing=false;}
      await page.waitForTimeout(300);
    }
    if(held)await page.keyboard.up(held);await page.mouse.up();
    results.push(await page.evaluate(()=>{const g=__OT3D.G;return {seed:g.seed,state:g.state,wave:g.wave,kills:g.kills,shots:g.stats.shots,hits:g.stats.hits,hp:g.player.hp,ammo:g.player.ammo,reserve:g.player.reserve,time:g.time,position:{x:g.player.x,y:g.player.y},roles:g.enemies.map(e=>e.type)};}));
    await page.screenshot({path:`output/playwright/layout-${seed}.png`});
    await page.keyboard.press('p');
  }
  return results;
}
