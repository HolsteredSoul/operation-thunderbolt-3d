// Native fullscreen requires a user gesture. Safari setup must never block play.
export function setupFullscreen({pause,isPlaying,isPaused,play,isTouch}){
  const button=document.getElementById('fullscreen'),help=document.getElementById('fullscreen-help'),playButton=document.getElementById('browser-play');
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const active=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const portrait=()=>isTouch()&&innerHeight>innerWidth;
  document.getElementById('fullscreen-help-title').textContent=ios?'Play on your iPhone / iPad':'Play in your browser';
  document.getElementById('chrome-setup').hidden=ios;
  document.getElementById('browser-play-copy').innerHTML=ios?'Turn your phone sideways and tap <b>PLAY IN SAFARI</b> below. Adding a Home Screen icon is optional.':'Turn your phone sideways and tap <b>PLAY IN THIS BROWSER</b> below. Full-screen mode is optional.';
  const update=()=>{
    button.textContent=active()?'EXIT FULL SCREEN':standalone()?'APP VIEW':ios?'iPHONE SETUP':'FULL SCREEN';
    playButton.textContent=portrait()?'BACK — TURN PHONE SIDEWAYS':isPaused()?'RESUME GAME':ios?'PLAY IN SAFARI':'PLAY IN THIS BROWSER';
    document.getElementById('browser-play-status').textContent=portrait()?'Turn sideways, then tap PLAY. If it won’t rotate, turn off Orientation Lock.':'No installation required. Browser bars may remain.';
  };
  const showHelp=()=>{if(isPlaying())pause();update();if(!help.open)help.showModal();};
  button.onclick=async()=>{
    if(active()){try{await (document.exitFullscreen?.()??document.webkitExitFullscreen?.());}catch{}return;}
    if(standalone())return;
    const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
    if(ios||!request){showHelp();return;}
    try{await request.call(document.documentElement);try{await screen.orientation?.lock('landscape');}catch{}}catch{showHelp();}
    update();
  };
  document.getElementById('fullscreen-help-close').onclick=()=>help.close();
  document.getElementById('home-screen-help').onclick=showHelp;
  document.getElementById('portrait-setup').onclick=showHelp;
  playButton.onclick=()=>{help.close();if(!portrait())play();};
  window.addEventListener('resize',update);
  for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{update();if(!active()&&isPlaying())pause();});
  update();
}
