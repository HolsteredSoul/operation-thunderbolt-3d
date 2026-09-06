import * as THREE from '../vendor/three.module.js';

// Reusable, low-cost smoke cards. Their RNG never touches combat or navigation.
export class Atmosphere{
  constructor(scene){
    this.root=new THREE.Group();scene.add(this.root);this.puffs=[];
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,4,64,64,63);
    gradient.addColorStop(0,'rgba(125,118,101,.6)');gradient.addColorStop(.4,'rgba(115,109,96,.32)');gradient.addColorStop(1,'rgba(94,94,87,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
    this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
    this.geometry=new THREE.BufferGeometry();this.positions=new Float32Array(12*3);this.sizes=new Float32Array(12);this.opacities=new Float32Array(12);
    this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));this.geometry.setAttribute('size',new THREE.BufferAttribute(this.sizes,1).setUsage(THREE.DynamicDrawUsage));this.geometry.setAttribute('opacity',new THREE.BufferAttribute(this.opacities,1).setUsage(THREE.DynamicDrawUsage));
    this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:this.texture},pixelScale:{value:1}},
      vertexShader:`attribute float size;attribute float opacity;uniform float pixelScale;varying float alpha;void main(){alpha=opacity;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=size*pixelScale;}`,
      fragmentShader:`uniform sampler2D map;varying float alpha;void main(){vec4 smoke=texture2D(map,gl_PointCoord);gl_FragColor=vec4(smoke.rgb,smoke.a*alpha);}`});
    this.points=new THREE.Points(this.geometry,this.material);this.points.frustumCulled=false;this.root.add(this.points);this.puffs=Array.from({length:12},()=>({userData:{}}));
  }
  rebuild(g){
    const rng=seeded(g.seed+':smoke');
    const rubble=g.obstacles.filter(o=>o.kind==='rubble'||o.kind==='wall').filter(o=>Math.hypot(o.x-1200,o.y-900)>160).sort((a,b)=>Math.hypot(a.x-1200,a.y-900)-Math.hypot(b.x-1200,b.y-900));
    this.sources=rubble.filter((o,i)=>i%7===0).slice(0,4).map(o=>({x:o.x+o.w/2,y:o.y+o.h/2}));
    for(let i=0;i<this.puffs.length;i++){const p=this.puffs[i];p.userData={source:this.sources[i%this.sources.length],phase:rng(),drift:rng()*24,rotation:rng()*Math.PI};}
    this.update(0,false);
  }
  update(time,low,pixelScale=1){
    this.geometry.setDrawRange(0,low?6:12);this.material.uniforms.pixelScale.value=pixelScale;
    this.puffs.forEach((p,i)=>{const d=p.userData;if(!d.source){this.opacities[i]=0;return;}
      const age=(time*.065+d.phase)%1;this.positions[i*3]=d.source.x+age*95;this.positions[i*3+1]=20+age*125;this.positions[i*3+2]=d.source.y+age*28+Math.sin(time*.2+d.phase*8)*8;
      this.sizes[i]=34+age*120;this.opacities[i]=Math.sin(age*Math.PI)*.6;
    });
    for(const attribute of Object.values(this.geometry.attributes))attribute.needsUpdate=true;
  }
}

// A single baked ground overlay adds mud, wheel ruts and ash without extra collision.
export function weatherGround(g){
  const rng=seeded(g.seed+':weather'),rand=(a,b)=>a+rng()*(b-a),canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1152;
  const c=canvas.getContext('2d');c.scale(canvas.width/2400,canvas.height/1800);
  function stain(x,y,r,color,alpha=.6){const d=c.createRadialGradient(x,y,r*.12,x,y,r);d.addColorStop(0,color);d.addColorStop(1,'transparent');c.globalAlpha=alpha;c.fillStyle=d;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1;}
  for(let i=0;i<520;i++)stain(rand(0,2400),rand(0,1800),rand(12,110),['#242822','#51432e','#74775b','#9a8c67'][i%4],rand(.15,.5));
  // Irregular paired wheel ruts break up the pristine road surfaces.
  for(const vertical of[false,true])for(const side of[-25,25]){c.save();if(vertical){c.translate(1200,-300);c.rotate(Math.PI/2);}else c.translate(0,900);c.strokeStyle='#403b2c70';c.lineWidth=7;
    for(let j=0;j<2;j++){c.beginPath();for(let x=0;x<2400;x+=14){const y=side+j*6+Math.sin(x*.013)*4;if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}
    c.strokeStyle='#1d231d44';c.lineWidth=2;for(let x=0;x<2400;x+=17){c.beginPath();c.moveTo(x,side-4);c.lineTo(x+8,side+13);c.stroke();}c.restore();}
  for(const o of g.obstacles){stain(o.x+o.w/2,o.y+o.h/2,Math.max(o.w,o.h)*.6+25,'#272922',.65);
    if(rng()<.45)for(let i=0;i<12;i++){c.fillStyle=['#34383199','#85745aaa','#b09b7766'][i%3];c.fillRect(o.x+rand(-16,o.w+16),o.y+rand(-16,o.h+16),rand(2,7),rand(1,5));}}
  for(let i=0;i<24;i++){const x=rand(70,2330),y=rand(70,1730),r=rand(15,42);stain(x,y,r*1.4,'#3b3026',.65);stain(x,y,r,'#171f1d',.65);c.strokeStyle='#c1ae7e38';c.lineWidth=2;c.beginPath();c.ellipse(x,y,r*.62,r*.4,.3,0,Math.PI);c.stroke();}
  for(let i=0;i<18000;i++){c.fillStyle=i%2?'#151e1918':'#e3c98c14';c.fillRect(rand(0,2400),rand(0,1800),rand(1,4),rand(1,3));}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2400,1800),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(1200,1.35,900);mesh.receiveShadow=true;
  return{mesh,dispose:()=>{mesh.geometry.dispose();material.dispose();texture.dispose();}};
}

export function makeWeatherTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),rng=seeded('surface-grime');
  c.fillStyle='#d4cfbd';c.fillRect(0,0,128,128);
  for(let i=0;i<1100;i++){const x=rng()*128,y=rng()*128;c.fillStyle=i%3?'#211e1730':'#fff4d526';c.fillRect(x,y,1+rng()*8,1+rng()*4);}
  for(let i=0;i<16;i++){const x=rng()*128;c.fillStyle='#39332922';c.fillRect(x,rng()*90,1+rng()*5,20+rng()*80);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
