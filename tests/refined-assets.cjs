async(page)=>{
 await page.goto('http://127.0.0.1:8083/?v=assets7');await page.waitForFunction(()=>window.__OT3D);await page.setViewportSize({width:1600,height:1000});
 const checks=await page.evaluate(async()=>{
  const a=__OT3D,g=a.G;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});a.startRun('THUNDER-1944');a.setState('paused');
  const v=await import('./src/visuals.js'),T=v.THREE,scene=new T.Scene();scene.background=new T.Color('#242b29');scene.add(new T.HemisphereLight('#e5e4d9','#5b574e',2));const light=new T.DirectionalLight('#ffe4ba',3);light.position.set(-80,250,180);scene.add(light);
  const camera=new T.OrthographicCamera(-265,265,165,-165,1,2000);camera.position.set(140,220,420);camera.lookAt(10,10,0);
  const canvas=document.createElement('canvas');canvas.id='asset-review';canvas.style.cssText='position:fixed;inset:0;z-index:20;width:100%;height:100%';document.body.append(canvas);
  const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const results=[];
  for(const [i,name]of ['player','rifleman','officer','sniper','nest'].entries()){
   const model=v.soldier(name);model.position.set(-180+i*87,0,60);model.rotation.y=-.25;scene.add(model);results.push({name,parts:model.children[0].children.length});
  }
  for(const [i,name]of ['crate','sandbag','rubble','wall'].entries()){
   const model=v.blenderModel(name);model.position.set(-150+i*100,0,-85);model.rotation.y=.15;scene.add(model);
  }
  const floor=new T.Mesh(new T.PlaneGeometry(1000,700),new T.MeshStandardMaterial({color:'#555646',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;scene.add(floor);
  renderer.render(scene,camera);window.assetReview={renderer,scene,floor};return results;
 });
 await page.screenshot({path:'output/playwright/refined-asset-workshop.png'});
 await page.evaluate(()=>{assetReview.renderer.dispose();assetReview.floor.geometry.dispose();assetReview.floor.material.dispose();document.getElementById('asset-review').remove();delete window.assetReview;});
 await page.reload();await page.waitForFunction(()=>window.__OT3D);
 return checks;
}
