// Fullscreen needs a user gesture; iPhone home-screen launch supplies the fallback.
export function setupFullscreen({pause,isPlaying}){
  const button=document.getElementById('fullscreen'),help=document.getElementById('fullscreen-help');
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const active=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const update=()=>{button.textContent=active()?'EXIT FULL SCREEN':standalone()?'APP VIEW':'FULL SCREEN';};
  const showHelp=()=>{if(isPlaying())pause();help.showModal();};
  button.onclick=async()=>{
    if(active()){try{await (document.exitFullscreen?.()??document.webkitExitFullscreen?.());}catch{}return;}
    if(standalone()){return;}
    const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
    if(!request){showHelp();return;}
    try{await request.call(document.documentElement);try{await screen.orientation?.lock('landscape');}catch{}}catch{showHelp();}
    update();
  };
  document.getElementById('fullscreen-help-close').onclick=()=>help.close();
  document.getElementById('home-screen-help').onclick=showHelp;
  for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{update();if(!active()&&isPlaying())pause();});
  update();
}
