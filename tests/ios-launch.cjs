async(page)=>{
 const context=await page.context().browser().newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 await context.addInitScript(()=>{Object.defineProperty(navigator,'getGamepads',{value:()=>[]});});
 const p=await context.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 const check=(name,pass)=>{checks.push({name,pass});if(!pass)throw Error(name);};
 const inView=async selector=>p.locator(selector).evaluate(e=>{const b=e.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.bottom<=innerHeight&&b.right<=innerWidth&&b.height>=44;});
 try{
 await p.goto('http://127.0.0.1:8083/?v=ios-help2');await p.waitForFunction(()=>window.__OT3D);
 check('portrait help is accessible',await inView('#portrait-setup'));
 await p.locator('#rotate-prompt summary').tap();check('rotation-lock troubleshooting expands',await p.locator('#rotate-prompt details').evaluate(e=>e.open));
 await p.locator('#portrait-setup').tap();
 check('iOS-specific numbered Safari steps',await p.locator('#ios-setup li').count()===4&&await p.locator('#chrome-setup').isHidden());
 check('play and close visible in portrait',await inView('#browser-play')&&await inView('#fullscreen-help-close'));
 await p.screenshot({path:'output/playwright/ios-help-portrait.png'});
 await p.locator('#browser-play').tap();check('portrait returns to rotation screen without starting',await p.evaluate(()=>!document.getElementById('fullscreen-help').open&&__OT3D.G.state==='menu'));
 await p.setViewportSize({width:667,height:251});await p.waitForTimeout(150);
 check('PLAY visible with Safari bars',await inView('#start'));check('mobile menu says PLAY',await p.locator('#start').innerText().then(s=>s.startsWith('PLAY')));
 await p.screenshot({path:'output/playwright/ios-small-menu.png'});
 await p.locator('#fullscreen').tap();
 check('help primary says PLAY IN SAFARI',await p.locator('#browser-play').innerText()==='PLAY IN SAFARI');
 check('play and close visible in short landscape',await inView('#browser-play')&&await inView('#fullscreen-help-close'));
 await p.locator('.help-body').evaluate(e=>e.scrollTop=e.scrollHeight);check('scrolling instructions keeps play visible',await inView('#browser-play'));
 await p.screenshot({path:'output/playwright/ios-help-landscape.png'});
 await p.locator('#browser-play').tap();check('help starts game without install or fullscreen',await p.evaluate(()=>__OT3D.G.state==='playing'&&!document.fullscreenElement&&!document.getElementById('fullscreen-help').open));
 await p.locator('#fullscreen').tap();check('help pauses active game',await p.evaluate(()=>__OT3D.G.state==='paused'));await p.locator('#browser-play').tap();check('help resumes existing run',await p.evaluate(()=>__OT3D.G.state==='playing'));
 await p.locator('#pause').tap();await p.locator('.briefing').evaluate(e=>e.scrollTop=e.scrollHeight);check('menu resume fixed while scrolling',await inView('#start'));
 check('no script errors',errors.length===0);return checks;
 }finally{await context.close();}
}
