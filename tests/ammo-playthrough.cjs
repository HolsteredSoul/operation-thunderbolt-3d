async(page)=>{
  await page.reload();await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1920,height:1080});
  await page.evaluate(()=>Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]}));
  const results=[];
  for(const seed of ['QA-03','QA-11']){
    await page.evaluate(seed=>{__OT3D.startRun(seed);window.dispatchEvent(new Event('focus'));},seed);
    let held=null,firing=false;
    for(let i=0;i<150;i++){
      const s=await page.evaluate(()=>{
        const a=__OT3D,g=a.G,p=g.player,pk=g.pickups.find(pk=>pk.emergency),e=g.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
        if(g.state!=='playing')return{state:g.state};
        if(pk&&p.ammo+p.reserve<=16){const angle=a.routeHeading(g,p,pk),dx=Math.cos(angle),dy=Math.sin(angle);return{state:g.state,resupply:true,dx:dx-dy,dy:dx+dy};}
        if(!e)return{state:g.state};const s=a.project(e.x,e.y,e.type==='sniper'?35:40),ps=a.project(p.x,p.y,29);
        return{state:g.state,x:s.x,y:s.y,dx:s.x-ps.x,dy:s.y-ps.y,d:Math.hypot(e.x-p.x,e.y-p.y),los:a.lineOfSight(p.x,p.y,e.x,e.y)};
      });
      if(s.state!=='playing')break;
      let key=null;if(s.resupply||s.d>460||s.los===false)key=Math.abs(s.dx)>Math.abs(s.dy)?(s.dx>0?'d':'a'):(s.dy>0?'s':'w');else if(s.d<170)key=s.dx>0?'a':'d';
      if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}
      const fire=!s.resupply&&s.d<520&&s.x>50&&s.x<1870&&s.y>110&&s.y<900;
      if(fire){await page.mouse.move(s.x,s.y);if(!firing){await page.mouse.down();firing=true;}}else if(firing){await page.mouse.up();firing=false;}
      await page.waitForTimeout(300);
    }
    if(held)await page.keyboard.up(held);await page.mouse.up();
    results.push(await page.evaluate(()=>{const g=__OT3D.G;return{seed:g.seed,state:g.state,wave:g.wave,kills:g.kills,hp:g.player.hp,ammo:g.player.ammo,reserve:g.player.reserve,time:g.time,...g.stats};}));
    await page.screenshot({path:`output/playwright/ammo-play-${seed}.png`});await page.keyboard.press('p');
  }
  return results;
}
