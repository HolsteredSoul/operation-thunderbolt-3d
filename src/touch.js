import {radial} from './input.js';

// Touch alone uses full target tracking: no second stick on a small screen.
export function chooseTouchTarget(player,enemies,current,visible){
  const valid=e=>e&&!e.dead&&e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<=500&&visible(e);
  if(enemies.includes(current)&&valid(current))return current;
  return enemies.filter(valid).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
}
export class TouchControls{
  constructor(g,{unlock,reload,pause,visible}){
    this.g=g;this.pause=pause;this.visible=visible;this.move={x:0,y:0};this.held=false;this.target=null;this.angle=0;
    this.enabled=navigator.maxTouchPoints>0&&matchMedia('(any-pointer: coarse)').matches;
    this.pointers=new Map();this.root=document.getElementById('touch-controls');this.stick=document.getElementById('touch-move');this.knob=document.getElementById('touch-knob');this.fireButton=document.getElementById('touch-fire');
    document.documentElement.dataset.touch=String(this.enabled);
    if(!this.enabled)return;
    g.input.source='touch';
    const activate=()=>{if(g.input.source!=='touch'){g.input.reset();g.input.source='touch';}g.keys={};g.mouse.down=false;unlock();};
    const bind=(element,kind)=>{
      element.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse'||g.state!=='playing'||g.input.suspended||this.portrait||[...this.pointers.values()].includes(kind))return;
        e.preventDefault();activate();this.pointers.set(e.pointerId,kind);element.setPointerCapture(e.pointerId);
        if(kind==='move')this.updateStick(e);else{this.held=true;this.fireButton.classList.add('pressed');}
      });
      element.addEventListener('pointermove',e=>{if(this.pointers.get(e.pointerId)==='move'){e.preventDefault();this.updateStick(e);}});
      const release=e=>{const action=this.pointers.get(e.pointerId);this.pointers.delete(e.pointerId);if(action==='move')this.clearStick();if(action==='fire'){this.held=false;this.fireButton.classList.remove('pressed');}};
      for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,release);
    };
    bind(this.stick,'move');bind(this.fireButton,'fire');
    document.getElementById('touch-reload').onclick=()=>{if(g.state==='playing'&&!this.portrait){activate();reload();}};
    window.addEventListener('game-state',()=>this.reset());window.addEventListener('blur',()=>this.reset());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
    this.checkOrientation=()=>{this.portrait=innerHeight>innerWidth;document.getElementById('rotate-prompt').hidden=!this.portrait;this.reset();if(this.portrait&&g.state==='playing')pause();};
    window.addEventListener('resize',this.checkOrientation);this.checkOrientation();
  }
  updateStick(e){
    const r=this.stick.getBoundingClientRect(),radius=r.width*.34,x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius,n=Math.max(1,Math.hypot(x,y));
    const v=radial(x/n,y/n,.12),curve=Math.pow(Math.hypot(v.x,v.y),.3);this.move={x:v.x*curve,y:v.y*curve};
    this.knob.style.transform=`translate(${x/n*radius}px,${y/n*radius}px)`;
  }
  clearStick(){this.move={x:0,y:0};this.knob.style.transform='translate(0px,0px)';}
  reset(){this.pointers.clear();this.clearStick();this.held=false;this.target=null;this.angle=this.g.player?.angle??0;this.fireButton.classList.remove('pressed');}
  update(dt){
    if(!this.enabled||this.g.input.source!=='touch')return;
    if(this.portrait&&this.g.state==='playing'){this.pause();return;}
    const p=this.g.player;
    this.target=chooseTouchTarget(p,this.g.enemies,this.target,this.visible);
    let desired=this.angle;
    if(this.target)desired=Math.atan2(this.target.y-p.y,this.target.x-p.x);
    else if(Math.hypot(this.move.x,this.move.y)>.1)desired=Math.atan2(this.move.y-this.move.x,this.move.x+this.move.y);
    const delta=Math.atan2(Math.sin(desired-this.angle),Math.cos(desired-this.angle));this.angle+=Math.max(-6*dt,Math.min(6*dt,delta));
    const label=this.held?(this.target?'FIRING':'NO TARGET'):'FIRE';
    if(this.fireButton.firstChild.textContent!==label)this.fireButton.firstChild.textContent=label;
  }
  sample(){
    const p=this.g.player,target=this.target;
    const aligned=target&&Math.abs(Math.atan2(Math.sin(Math.atan2(target.y-p.y,target.x-p.x)-this.angle),Math.cos(Math.atan2(target.y-p.y,target.x-p.x)-this.angle)))<.12;
    return{moveX:this.move.x,moveY:this.move.y,aimAngle:this.angle,fire:!!(this.held&&aligned&&!target.dead&&target.hp>0&&this.visible(target)&&Math.hypot(target.x-p.x,target.y-p.y)<=500&&!this.portrait)};
  }
}
