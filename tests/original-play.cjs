async (page) => {
  await page.keyboard.press('Enter');
  await page.mouse.move(780,340); await page.mouse.down();
  await page.keyboard.down('d'); await page.waitForTimeout(1400); await page.keyboard.up('d');
  await page.keyboard.down('w'); await page.waitForTimeout(1000); await page.keyboard.up('w');
  await page.mouse.up(); await page.keyboard.press('r'); await page.waitForTimeout(1600);
  await page.screenshot({path:'output/playwright/original.png'});
  console.log(await page.evaluate(()=>({state:__OT.G.state,wave:__OT.G.wave,hp:__OT.G.player.hp,ammo:__OT.G.player.ammo,reserve:__OT.G.player.reserve,enemies:__OT.G.enemies.length})));
  await page.keyboard.press('p');
}
