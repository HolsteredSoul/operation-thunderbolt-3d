export function radial(x=0,y=0,dead=.15){
  const length=Math.hypot(x,y);if(length<=dead)return{x:0,y:0};
  const scale=Math.min(1,(length-dead)/(1-dead))/length;return{x:x*scale,y:y*scale};
}
// Both devices produce the same movement/fire actions consumed by the player.
export class Controls{
  constructor(g,handlers){this.g=g;this.handlers=handlers;this.source='mouse';this.pad=null;this.buttons=[];this.axes=[];this.move={x:0,y:0};this.direction={x:1,y:0};this.fire=false;this.fireBlocked=true;this.suspended=false;this.dead=.15;this.response=14;this.status='Connect Xbox controller and press a button';this.menuAxis=0;this.menuRepeat=0;}
  useMouse(){this.source='mouse';this.fire=false;}
  reset(){this.move={x:0,y:0};this.fire=false;this.fireBlocked=true;}
  poll(dt,pads){
    if(pads===undefined){
      if(typeof navigator.getGamepads!=='function'){this.status='Gamepad API unavailable here - open in Chrome or Edge';this.reset();return;}
      try{pads=navigator.getGamepads();}catch{this.status='Browser blocked controller access - open in Chrome or Edge';this.reset();return;}
    }
    const list=Array.from(pads).filter(p=>p?.connected),pad=list.find(p=>p.index===this.pad&&p.mapping==='standard')||list.find(p=>p.mapping==='standard');
    if(!pad){if(this.pad!==null){if(this.source==='pad')this.handlers.disconnect();this.reset();}this.pad=null;this.buttons=[];this.axes=[];this.status=list.length?'Controller mapping unsupported':'Connect Xbox controller and press a button';return;}
    const switched=this.pad!==pad.index;this.pad=pad.index;this.status='Xbox / standard controller connected';
    const b=pad.buttons.map(b=>b.pressed||b.value>.5),a=pad.axes,move=radial(a[0],a[1],this.dead),aim=radial(a[2],a[3],this.dead);
    const edge=i=>b[i]&&!this.buttons[i];
    const changed=a.some((v,i)=>Math.abs(v-(this.axes[i]||0))>.025),activity=b.some((v,i)=>v&&!this.buttons[i])||(changed&&(Math.hypot(move.x,move.y)>.08||Math.hypot(aim.x,aim.y)>.08));
    if(activity&&!this.suspended){if(this.source!=='pad'){this.g.mouse.down=false;this.g.keys={};}this.source='pad';this.handlers.unlock();}
    if(switched)this.fireBlocked=true;
    if(!b[7])this.fireBlocked=false;
    if(this.source==='pad'&&!this.suspended){
      this.move=move;
      if(Math.hypot(aim.x,aim.y)>0){const angle=Math.atan2(aim.y,aim.x),old=Math.atan2(this.direction.y,this.direction.x),delta=Math.atan2(Math.sin(angle-old),Math.cos(angle-old)),next=old+delta*(1-Math.exp(-this.response*dt));this.direction={x:Math.cos(next),y:Math.sin(next)};}
      if(edge(9))this.handlers.pause();
      else if(this.g.state!=='playing'){
        this.menuRepeat-=dt;const axis=Math.abs(move.y)>=Math.abs(move.x)?move.y:move.x,nav=Math.abs(axis)>.45?Math.sign(axis):0;
        if(nav&&(nav!==this.menuAxis||this.menuRepeat<=0)){this.handlers.menu(nav);this.menuRepeat=nav!==this.menuAxis?.4:.22;}this.menuAxis=nav;
        if(edge(12)||edge(14))this.handlers.menu(-1);
        if(edge(13)||edge(15))this.handlers.menu(1);
        if(edge(0))this.handlers.confirm();
        if(edge(1))this.handlers.back();
      }else{this.menuAxis=0;this.menuRepeat=0;if(edge(2))this.handlers.reload();}
      this.fire=this.g.state==='playing'&&!!b[7]&&!this.fireBlocked;
    }else this.fire=false;
    this.buttons=b;this.axes=[...a];
  }
  sample(){
    if(this.suspended||this.g.state!=='playing')return{moveX:0,moveY:0,fire:false};
    if(this.source==='pad')return{moveX:this.move.x,moveY:this.move.y,fire:this.fire,aimAngle:Math.atan2(this.direction.y/Math.sin(35*Math.PI/180)-this.direction.x,this.direction.x+this.direction.y/Math.sin(35*Math.PI/180))};
    const k=this.g.keys,x=Number(!!(k.KeyD||k.ArrowRight))-Number(!!(k.KeyA||k.ArrowLeft)),y=Number(!!(k.KeyS||k.ArrowDown))-Number(!!(k.KeyW||k.ArrowUp)),n=Math.max(1,Math.hypot(x,y));return{moveX:x/n,moveY:y/n,fire:this.g.mouse.down};
  }
}
