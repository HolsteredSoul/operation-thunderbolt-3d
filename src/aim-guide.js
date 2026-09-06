// Trace the firing centreline with the same cover expansion used by projectiles.
export function traceAim(player,angle,obstacles,intersect,range=547){
  const x=player.x+Math.cos(angle)*range,y=player.y+Math.sin(angle)*range;
  let fraction=1;
  for(const obstacle of obstacles){const t=intersect(player.x,player.y,x,y,obstacle,3);if(t!==null)fraction=Math.min(fraction,t);}
  return{x:player.x+(x-player.x)*fraction,y:player.y+(y-player.y)*fraction,blocked:fraction<1,distance:range*fraction};
}
