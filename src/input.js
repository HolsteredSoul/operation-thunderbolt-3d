export function radial(x=0,y=0,dead=.15){
  const length=Math.hypot(x,y);if(length<=dead)return{x:0,y:0};
  const scale=Math.min(1,(length-dead)/(1-dead))/length;return{x:x*scale,y:y*scale};
}
// Keep a valid target until it dies, leaves range or loses a clear shot.
export function chooseAutoAimTarget(player,enemies,current,canAim,heading){
  const valid=e=>e&&!e.dead&&e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<=547&&canAim(e)&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-player.y,e.x-player.x)-heading),Math.cos(Math.atan2(e.y-player.y,e.x-player.x)-heading)))<=Math.PI/15;
  if(enemies.includes(current)&&valid(current))return current;
  let target=null,best=Infinity;for(const e of enemies){if(!valid(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best){target=e;best=d;}}return target;
}
// Both devices produce the same movement/fire actions consumed by the player.
export class Controls{
  constructor(g,handlers){this.g=g;this.handlers=handlers;this.source='mouse';this.pad=null;this.buttons=[];this.axes=[];this.move={x:0,y:0};this.direction={x:1,y:0};this.fire=false;this.fireBlocked=true;this.suspended=false;this.dead=.15;this.response=14;this.status='Power on controller, click this game, then press A';this.menuAxis=0;this.menuRepeat=0;this.manualAim=false;this.autoTarget=null;this.heading=0;}
  useMouse(){this.source='mouse';this.fire=false;this.autoTarget=null;}
  reset(){this.move={x:0,y:0};this.fire=false;this.fireBlocked=true;this.autoTarget=null;this.manualAim=false;this.heading=this.g.player?.angle??0;}
  poll(dt,pads){
    if(pads===undefined){
      if(typeof navigator.getGamepads!=='function'){this.status='Gamepad API unavailable here - open in Chrome or Edge';this.reset();return;}
      try{pads=navigator.getGamepads();}catch{this.status='Browser blocked controller access - open in Chrome or Edge';this.reset();return;}
    }
    const list=Array.from(pads).filter(p=>p?.connected),pad=list.find(p=>p.index===this.pad&&p.mapping==='standard')||list.find(p=>p.mapping==='standard');
    if(!pad){if(this.pad!==null){if(this.source==='pad')this.handlers.disconnect();this.reset();}this.pad=null;this.buttons=[];this.axes=[];this.status=list.length?'Controller mapping unsupported':'Power on controller, click this game, then press A';return;}
    const switched=this.pad!==pad.index;this.pad=pad.index;this.status='Xbox / standard controller connected';
    const b=pad.buttons.map(b=>b.pressed||b.value>.5),a=pad.axes,move=radial(a[0],a[1],this.dead),aim=radial(a[2],a[3],this.dead);
    const edge=i=>b[i]&&!this.buttons[i];
    const changed=a.some((v,i)=>Math.abs(v-(this.axes[i]||0))>.025),activity=b.some((v,i)=>v&&!this.buttons[i])||(changed&&(Math.hypot(move.x,move.y)>.08||Math.hypot(aim.x,aim.y)>.08));
    if(activity&&!this.suspended){if(this.source!=='pad'){this.g.mouse.down=false;this.g.keys={};}this.source='pad';this.handlers.unlock();}
    if(switched)this.fireBlocked=true;
    if(!b[7])this.fireBlocked=false;
    if(this.source==='pad'&&!this.suspended){
      this.move=move;this.manualAim=Math.hypot(aim.x,aim.y)>0;
      if(Math.hypot(aim.x,aim.y)>0){const angle=Math.atan2(aim.y,aim.x),old=Math.atan2(this.direction.y,this.direction.x),delta=Math.atan2(Math.sin(angle-old),Math.cos(angle-old)),next=old+delta*(1-Math.exp(-this.response*dt));this.direction={x:Math.cos(next),y:Math.sin(next)};}
      if(this.manualAim)this.heading=Math.atan2(this.direction.y/Math.sin(35*Math.PI/180)-this.direction.x,this.direction.x+this.direction.y/Math.sin(35*Math.PI/180));
      else if(Math.hypot(move.x,move.y)>0)this.heading=Math.atan2(move.y-move.x,move.x+move.y);
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
    if(this.source==='pad'){
      let aimAngle=this.heading;
      if(!this.manualAim&&this.autoTarget&&!this.autoTarget.dead&&this.autoTarget.hp>0){
        const desired=Math.atan2(this.autoTarget.y-this.g.player.y,this.autoTarget.x-this.g.player.x),delta=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
        // Fixed nominal heading prevents this gentle nudge accumulating into a lock-on.
        aimAngle+=Math.max(-Math.PI/60,Math.min(Math.PI/60,delta*.25));
      }
      return{moveX:this.move.x,moveY:this.move.y,fire:this.fire,aimAngle};
    }

    const k=this.g.keys,x=Number(!!(k.KeyD||k.ArrowRight))-Number(!!(k.KeyA||k.ArrowLeft)),y=Number(!!(k.KeyS||k.ArrowDown))-Number(!!(k.KeyW||k.ArrowUp)),n=Math.max(1,Math.hypot(x,y));return{moveX:x/n,moveY:y/n,fire:this.g.mouse.down};
  }
}
