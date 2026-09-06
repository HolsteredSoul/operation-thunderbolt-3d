import * as THREE from '../vendor/three.module.js';
const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,6),cylinder=new THREE.CylinderGeometry(1,1,1,10),rock=new THREE.DodecahedronGeometry(1,0);
const mats=new Map();
function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.9}));return mats.get(color);}
// Local Blender-authored meshes, shared and instanced at runtime.
const pack=await fetch('./assets/village-pack.json').then(r=>{if(!r.ok)throw Error('Blender asset pack failed to load');return r.json();});
const blenderAssets={};
for(const [name,parts]of Object.entries(pack.assets))blenderAssets[name]=parts.map(p=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(p.normals,3));return{...p,positions:undefined,normals:undefined,geometry};});
function blenderModel(name){
 const root=new THREE.Group(),joints=new Map(),palette={uniform:'#a18e60',helmet:'#58623e',skin:'#c4a17a',boots:'#343833',webbing:'#98916a',wood:'#8b6d48',metal:'#303b39',band:'#ae4434',cloak:'#465e35',accent:'#dfd5a6',ammo:'#69704a',sand:'#b5a580',stone:'#a3a18d',brick:'#ad8268'};
 if(name==='rifleman'){palette.uniform='#557486';palette.helmet='#354b58';palette.webbing='#6b7779';}if(name==='officer'){palette.uniform='#303337';palette.helmet='#25272b';palette.webbing='#70533d';palette.accent='#c9a45e';}if(name==='sniper'){palette.uniform='#71804c';palette.helmet='#465635';palette.accent='#dc9e65';}
 if(name==='nest'){palette.uniform='#555e59';palette.helmet='#36463c';palette.metal='#303d3b';}
 const body=new THREE.Group();root.add(body);joints.set('body',body);
 for(const p of blenderAssets[name]){let joint=joints.get(p.joint);if(!joint){joint=new THREE.Group();joint.position.fromArray(p.pivot);body.add(joint);joints.set(p.joint,joint);}const mesh=new THREE.Mesh(p.geometry,material(pack.materials?.[p.material]??palette[p.material]));joint.add(mesh);}
 root.userData={body,legs:[joints.get('legL'),joints.get('legR')].filter(Boolean),gun:joints.get('gun')||new THREE.Group(),blender:true};root.updateMatrixWorld(true);root.userData.aimBounds=new THREE.Box3().setFromObject(root).expandByScalar(6);return root;
}
function part(parent,geo,color,x,y,z,sx,sy,sz,rz=0){const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.z=rz;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const cube=(p,c,x,y,z,w,h,d)=>part(p,box,c,x,y,z,w,h,d);
export class Batcher{
  constructor(scene,dynamic=false){this.scene=scene;this.dynamic=dynamic;this.map=new Map();}
  begin(){for(const b of this.map.values())b.n=0;}
  add(group){group.updateMatrixWorld(true);group.traverse(m=>{if(!m.isMesh||!m.visible)return;const key=m.geometry.uuid+m.material.uuid;let b=this.map.get(key);if(!b){const mesh=new THREE.InstancedMesh(m.geometry,m.material,this.dynamic?1800:7000);mesh.castShadow=!this.dynamic;mesh.receiveShadow=true;mesh.frustumCulled=false;if(this.dynamic)mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(mesh);b={mesh,n:0};this.map.set(key,b);}if(b.n<b.mesh.instanceMatrix.count)b.mesh.setMatrixAt(b.n++,m.matrixWorld);});}
  finish(){for(const b of this.map.values()){b.mesh.count=b.n;b.mesh.instanceMatrix.needsUpdate=true;}}
  clear(){for(const b of this.map.values()){this.scene.remove(b.mesh);b.mesh.dispose();}this.map.clear();}
}
export function soldier(type='player'){
  if(blenderAssets[type])return blenderModel(type);
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const uniform=type==='player'?'#717953':type==='officer'?'#414945':type==='sniper'?'#667052':'#687a78';
  const helmet=type==='player'?'#596340':type==='officer'?'#303b37':type==='sniper'?'#525c39':'#445652';
  const legs=[];
  for(const side of[-1,1]){const leg=new THREE.Group();leg.position.set(side*4,22,0);body.add(leg);cube(leg,uniform,0,-8,0,6,16,6);cube(leg,'#343833',0,-18,2,6.5,6,10);legs.push(leg);}
  cube(body,uniform,0,29,0,16,19,9);
  cube(body,'#514e38',0,22,0,17,3,10);
  cube(body,'#98916a',-5,25,6,4,5,3);cube(body,'#98916a',5,25,6,4,5,3);
  cube(body,'#777451',0,30,-7,12,13,6);
  cube(body,'#b0a782',-5,31,-2,2,17,11);
  part(body,cylinder,'#c4a17a',0,43,0,5,9,5);
  part(body,sphere,helmet,0,48,-.6,7,5.5,7.5);part(body,cylinder,helmet,0,46,0,8,.9,8);
  if(type==='officer'){part(body,cylinder,'#b58159',0,47,0,7.1,1.4,7.1);cube(body,'#c4ac72',-7,37,0,4,2,9);}
  // Arms cradle the stock. Weapon points along local +Z.
  for(const side of[-1,1]){const arm=cube(body,uniform,side*9,32,5,5,12,5);arm.rotation.x=-.65;part(body,sphere,'#c4a17a',side*6,29,10,2.8,2.8,2.8);}
  const gun=new THREE.Group();gun.position.set(3,29,10);body.add(gun);
  cube(gun,'#77573b',0,0,1,3.2,4,16);cube(gun,'#303b39',0,.7,12,2,2,15);
  if(type==='sniper')cube(gun,'#222f2d',0,4,7,2.8,3,10);
  if(type==='officer')gun.scale.z=.55;
  if(type==='nest'){
    body.position.y=-8;gun.scale.set(1.6,1.3,1.45);cube(body,'#44504a',2,26,15,25,16,4);
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const bag=part(root,sphere,'#b5a580',Math.sin(a)*28,7,Math.cos(a)*28,10,6,7);bag.rotation.y=-a;}
    cube(body,'#272e2d',3,27,15,7,6,17);
  }
  if(type==='sniper'){cube(body,'#626c46',0,31,-5,20,15,8);for(let i=0;i<5;i++)part(body,rock,'#7b7f4f',(i-2)*4,47,-3,3,3,4);}
  root.userData={legs,body,gun};return root;
}
export function poseSoldier(model,e,time,dead=false){
  model.position.set(e.x,0,e.y);model.rotation.set(0,Math.PI/2-e.angle,0);model.scale.setScalar(1);
  const {legs,body,gun}=model.userData;
  const walking=e.moving??(e.speed>0&&Math.hypot(e.x-(e.renderX??e.x),e.y-(e.renderY??e.y))>.08);
  const phase=time*(e.type==='officer'?15:11);
  legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(phase+i*Math.PI)*.52:0);
  body.position.y=(e.type==='nest'&&!model.userData.blender?-8:0)+(walking?Math.abs(Math.sin(phase))*.9:0);body.rotation.x=0;
  gun.rotation.x=e.reloadT>0?-.5:0;
  if(e.hitT>0||e.invulnT>0)body.rotation.z=Math.sin(time*65)*.045;else body.rotation.z=0;
  if(dead){model.rotation.z=-Math.min(Math.PI/2,(2.5-e.life)*7);model.position.y=4;model.scale.setScalar(Math.min(1,e.life*2));}
  e.renderX=e.x;e.renderY=e.y;
}
export function buildVillage(G,scene){
  const root=new THREE.Group(),rng=seeded(G.seed+':visual-layout'),rand=(a,b)=>a+rng()*(b-a);
  cube(root,'#6e7960',1200,-14,900,2400,28,1800);
  // Roads and curbs are flush, traversable surfaces.
  cube(root,'#a2977a',1200,.25,900,2400,.5,112);cube(root,'#a2977a',1200,.3,900,112,.6,1800);
  cube(root,'#c0af89',1200,.8,900,215,1,215);
  for(let i=0;i<120;i++){
    cube(root,'#9e9c83',i*20+10,1,838,18,2,9);cube(root,'#9e9c83',i*20+10,1,962,18,2,9);
  }
  for(let i=0;i<90;i++){cube(root,'#9e9c83',1138,1,i*20+10,9,2,18);cube(root,'#9e9c83',1262,1,i*20+10,9,2,18);}
  for(const d of G.decor){cube(root,d.mat==='brick'?'#978777':'#93988a',d.x+d.w/2,.5,d.y+d.h/2,d.w,1,d.h);for(let j=0;j<d.h;j+=30)cube(root,'#7e8376',d.x+d.w/2,1.2,d.y+j,d.w,1,1.2);}
  for(const o of G.obstacles){
    const x=o.x+o.w/2,z=o.y+o.h/2;
    if(blenderAssets[o.kind]){
      const mesh=blenderModel(o.kind);mesh.position.set(x,0,z);
      if(o.kind==='wall'){const horizontal=o.w>o.h;mesh.rotation.y=horizontal?0:Math.PI/2;mesh.scale.set((horizontal?o.w:o.h)/98,1,1);if(o.mat==='stone')mesh.traverse(m=>{if(m.isMesh)m.material=material('#a7a593');});}
      else if(o.kind==='sandbag'){const horizontal=o.w>o.h;mesh.rotation.y=horizontal?0:Math.PI/2;mesh.scale.set((horizontal?o.w:o.h)/82,1,1);}
      else mesh.scale.set(o.w/(o.kind==='crate'?37:38),1,o.h/(o.kind==='crate'?37:38));
      root.add(mesh);continue;
    }

    if(o.kind==='wall'){
      const brick=o.mat==='brick',h=32;
      cube(root,brick?'#ae8065':'#a7a593',x,h/2,z,o.w,h,o.h);
      // Low cutaway walls are intentional: soldiers' upper bodies stay visible.
      cube(root,brick?'#c69f7e':'#c4bca4',x,h+2,z,o.w+1,4,o.h+1);
      const horizontal=o.w>o.h,len=horizontal?o.w:o.h;
      for(let level=0;level<3;level++)for(let j=0;j<len-6;j+=22){
        const pos=Math.min(len-3,j+(level%2)*10);
        cube(root,brick?'#8f6855':'#828978',horizontal?o.x+pos:x,6+level*10,horizontal?z:o.y+pos,horizontal?1:o.w+.3,8,horizontal?o.h+.3:1);
      }
      // Broken masonry and timbers occupy the same solid footprint.
      for(let j=0;j<len;j+=27)if(rng()<.55)part(root,rock,brick?'#b3896a':'#9d9e8c',horizontal?o.x+j+8:x,38,horizontal?z:o.y+j+8,horizontal?10:7,rand(3,8),horizontal?7:10);
    }else if(o.kind==='sandbag'){
      const horiz=o.w>o.h,len=horiz?o.w:o.h;
      for(let row=0;row<3;row++)for(let j=0;j<len;j+=20){const v=Math.min(len-10,j+10+(row%2)*5);part(root,sphere,row===2?'#c3b28a':'#aa9c78',horiz?o.x+v:x,5+row*7,horiz?z:o.y+v,horiz?11:10,5,horiz?10:11);}
    }else if(o.kind==='crate'){
      cube(root,'#8b7851',x,15,z,o.w,30,o.h);cube(root,'#a9966b',x,31,z,o.w+1,3,o.h+1);
      for(const a of[-1,1]){cube(root,'#b4a174',x+a*o.w*.35,15,z,4,30,o.h+1);cube(root,'#b4a174',x,15,z+a*o.h*.35,o.w+1,30,4);}
    }else{
      cube(root,'#858773',x,7,z,o.w,14,o.h);
      for(let i=0;i<7;i++)part(root,rock,'#a3a18d',x+rand(-o.w*.25,o.w*.25),rand(9,17),z+rand(-o.h*.25,o.h*.25),rand(6,10),rand(6,10),rand(6,10));
    }
  }
  // Ground litter has no height or collision; tall scenery stays outside the arena.
  for(let i=0;i<1100;i++){
    const x=rand(45,2355),z=rand(45,1755);if(Math.abs(x-1200)<68||Math.abs(z-900)<68)continue;
    const col=['#8f9678','#85916b','#b0a68b','#69765c'][i%4];
    part(root,rock,col,x,.9,z,rand(2,6),.8,rand(2,6));
  }
  for(let i=0;i<170;i++){
    const side=i%4;const x=side<2?rand(-40,2440):(side===2?-55:2455),z=side<2?(side===0?-55:1855):rand(-40,1840);
    cube(root,'#4a5541',x,18,z,rand(28,46),36,rand(25,50));part(root,rock,'#596a46',x,43,z,rand(25,45),rand(24,44),rand(25,45));
  }
  // Village sign on the protected square, painted flat like a field marker.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#c6b994';c.fillRect(0,0,256,128);c.fillStyle='#656d51';c.textAlign='center';c.font='bold 21px Georgia';c.fillText('SAINTE-MARIE',128,55);c.font='12px Arial';c.fillText('SECTEUR 07',128,82);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(78,39),new THREE.MeshStandardMaterial({map:tex,roughness:1}));sign.rotation.x=-Math.PI/2;sign.position.set(1200,1.5,944);root.add(sign);
  const batch=new Batcher(scene);batch.add(root);batch.finish();return()=>{batch.clear();tex.dispose();sign.geometry.dispose();sign.material.dispose();};
}
export {THREE,box,sphere,material};
