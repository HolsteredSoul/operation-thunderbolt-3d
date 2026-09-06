import {THREE} from './visuals.js';
// Two depth-tested, camera-facing quads per projectile: contrasting edge and bright core.
export class Tracers{
  constructor(scene){this.positions=new Float32Array(240*36);this.colors=new Float32Array(240*36);this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));this.geometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3).setUsage(THREE.DynamicDrawUsage));this.mesh=new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false}));this.mesh.frustumCulled=false;scene.add(this.mesh);this.cameraDirection=new THREE.Vector3();this.side=new THREE.Vector3();this.direction=new THREE.Vector3();this.color=new THREE.Color();}
  update(bullets,camera,height){
    camera.getWorldDirection(this.cameraDirection);const pixel=(camera.top-camera.bottom)/height;let index=0;
    for(const b of bullets.slice(0,240)){
      this.direction.set(b.vx,0,b.vy).normalize();this.side.crossVectors(this.direction,this.cameraDirection).normalize();
      for(let layer=0;layer<2;layer++){
        const half=pixel*(layer?1:2),length=layer?27:31,offset=layer?.06:0;
        this.color.set(layer?(b.friendly?'#fff1a8':'#ff704b'):(b.friendly?'#745523':'#682a20'));
        for(const [along,side]of [[-length,-1],[0,-1],[0,1],[-length,-1],[0,1],[-length,1]]){
          this.positions.set([b.x+this.direction.x*along+this.side.x*half*side-this.cameraDirection.x*offset,29+this.side.y*half*side-this.cameraDirection.y*offset,b.y+this.direction.z*along+this.side.z*half*side-this.cameraDirection.z*offset],index);
          this.colors.set([this.color.r,this.color.g,this.color.b],index);index+=3;
        }
      }
    }
    this.geometry.setDrawRange(0,index/3);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;
  }
}
