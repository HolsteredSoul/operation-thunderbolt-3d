async(page)=>{
 await page.goto('http://127.0.0.1:8083/?v=village8');await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1600,height:1000});
 await page.evaluate(async()=>{
  const a=__OT3D;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});a.setState('paused');
  const v=await import('./src/visuals.js'),T=v.THREE,scene=new T.Scene();scene.background=new T.Color('#27312e');scene.add(new T.HemisphereLight('#e4e6dc','#615743',2));const light=new T.DirectionalLight('#ffe0aa',2.7);light.position.set(-120,260,230);scene.add(light);
  const camera=new T.OrthographicCamera(-365,365,228,-228,1,2000);camera.position.set(120,310,530);camera.lookAt(0,35,0);
  const canvas=document.createElement('canvas');canvas.id='asset-review';canvas.style.cssText='position:fixed;inset:0;z-index:20;width:100%;height:100%';document.body.append(canvas);const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  for(const [i,name]of ['wall_plaster','wall_window','wall_chimney','wall_timbers','collapsed_roof','supply_barrel'].entries()){const m=v.blenderModel(name);m.position.set(-260+i*101,0,100);m.rotation.y=.15;scene.add(m);}
  for(const [i,name]of ['dead_tree','tree_oak','broken_fence','grass_clump'].entries()){const m=v.blenderModel(name);m.position.set(-220+i*145,0,-100);scene.add(m);}
  const floor=new T.Mesh(new T.PlaneGeometry(1500,900),new T.MeshStandardMaterial({color:'#625e49',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;scene.add(floor);renderer.render(scene,camera);window.assetReview={renderer,floor};
 });
 await page.screenshot({path:'output/playwright/architecture-assets.png'});
 await page.evaluate(()=>{assetReview.renderer.dispose();assetReview.floor.geometry.dispose();assetReview.floor.material.dispose();document.getElementById('asset-review').remove();delete window.assetReview;});
 await page.reload();await page.waitForFunction(()=>window.__OT3D);
 const counts=await page.evaluate(()=>{const a=__OT3D,g=a.G;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});a.startRun('THUNDER-1944');g.wave=4;g.nextWaveIn=999;g.player.invulnT=999;g.time=8;g.input.source='mouse';g.input.suspended=false;g.mouse.x=920;g.mouse.y=540;
  for(const [i,type]of ['rifleman','officer','sniper','nest'].entries()){const spot=a.nearestClear(g,1400+i*55,880-i*60),e=a.OT.enemies.makeEnemy(g,type,spot.x,spot.y);e.speed=0;e.cooldown=999;g.enemies.push(e);}a.render();return g.visualAssetCounts;});
 await page.waitForTimeout(250);await page.screenshot({path:'output/playwright/refined-village.png'});
 await page.keyboard.press('p');return counts;
}
