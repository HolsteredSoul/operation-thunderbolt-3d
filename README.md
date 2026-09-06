# Operation Thunderbolt — The Village

A playable 3D isometric survival shooter set in a ruined French village. Move between cover, manage your ammunition, collect upgrades, and hold out against increasingly demanding waves.

Built with plain JavaScript, Three.js, Blender-authored models, and procedural audio. All runtime assets are included: no package installation, build step, or Blender installation is required to play.

## Start playing

Requires **Node.js 20 or newer** and a desktop browser with **WebGL 2**. Chrome is recommended for the Xbox controller setup verified on this project.

```sh
git clone https://github.com/HolsteredSoul/operation-thunderbolt-3d.git
cd operation-thunderbolt-3d
npm start
```

Open **[http://127.0.0.1:8083](http://127.0.0.1:8083)** and click **DEPLOY**, or press Enter. Keep the terminal open while playing; Ctrl+C stops the server. This private repository requires GitHub access to clone.

On Windows, you can also double-click **`gamestart.cmd`** in the downloaded project folder to start the server and open the browser. It reuses an already running game. Keep the server window open while playing.

Already have the project? Double-click the launcher, or open a terminal in its folder and run `npm start`. See the **[Quickstart guide](QUICKSTART.md)** for the existing Windows checkout, controller setup, alternate ports, and troubleshooting.

## Features

- Seeded villages with weathered masonry, muddy wheel tracks, scorched ground, drifting smoke, and endless survival waves.
- Four visually distinct enemy roles: riflemen, officers, snipers, and machine-gun nests.
- Health supplies, ammunition, and four capped upgrades that reset each run.
- Persistent emergency ammo supplies when ammunition runs low, with a visible direction marker.
- Keyboard/mouse and Xbox controller input, with gentle stick handling and selectable Off / 3° / 5° assistance.
- Recruit difficulty for first-time play, alongside the original Standard challenge and separate high scores.
- Pause, replay the same seed, generate a fresh layout, and a browser-local high score.
- Local mesh assets, vendored rendering dependencies, and procedural sound; play offline after downloading the project and installing Node.js.

## Controls

### Keyboard and mouse

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move relative to the screen |
| Mouse | Aim |
| Hold left mouse button | Fire; reload automatically when the magazine is empty and reserves remain |
| R | Reload |
| P / Escape | Pause / resume |
| Enter / Space | Deploy, resume, or replay |
| M | Mute / unmute |
| X | Toggle reduced shake |
| Quality button | Switch rendering quality |

### Xbox controller

Power on and connect the controller, open the game in Chrome, click inside the page, then press **A** to activate controller input.

| Input | Action |
| --- | --- |
| Left stick | Move and set facing; releasing it keeps your facing |
| RT | Fire |
| X | Reload |
| Right stick (optional) | Manually override aim |
| Menu | Pause / resume |
| D-pad / left stick in menus | Select a button |
| A | Confirm selection |
| B | Resume from pause |

The right stick is optional. Slight assistance nudges shots toward visible enemies already close to your facing direction. The default 5° setting corrects half of the angular error, capped at 5°, within a 12° cone. The 3° setting retains the earlier 25% correction; assistance can also be switched off. It does not accumulate into target lock, and manual right-stick aim overrides it. **Gentle** stick feel softens small movements and smooths turning; **Direct** restores immediate left-stick facing. The menu also saves dead zone, aim response, a small direction marker, and reduced shake.

Controller navigation highlights menu buttons; it does not move the operating-system pointer. Losing focus or disconnecting the active controller pauses the game. Reconnect, release the trigger, and deliberately resume. Physical Xbox Bluetooth input has been confirmed in Chrome; controller support in the Codex in-app preview has not been separately verified.

## Difficulty

New settings default to **Recruit**: 40% less incoming damage, 0.8 seconds of protection after a hit, and tighter shot spread. **Standard** keeps the original combat values. Choose difficulty before deploying; a choice made while paused applies to the next run. Each difficulty has its own browser-local high score. Enemy waves and the ammo recovery system are the same in both modes.

## Surviving the village

Use walls, crates, sandbags, and raised rubble to block incoming fire. Ground litter and floorboards are traversable. Controller aiming uses one small chevron near the soldier; mouse aiming uses a compact crosshair with a dark outline. Amber indicates nearby cover for the chevron or a blocked selected mouse target. There are no dashed aim lines or range labels. Watch sniper warning lines and the bearings for distant enemies.

You begin with 8 rounds loaded and 72 in reserve. At 16 total rounds or fewer, follow **AMMO +24** to an emergency supply. It replenishes reserves, so reload to use it. Emergency supplies persist until collected, and further supplies can appear after later depletion. Ordinary ammo drops grant 16 rounds and remain for 30 seconds. Enemy strength and wave pressure were retained during the ammo changes.

Replay keeps your seed and village layout; **FRESH LAYOUT** starts a new run. High scores are stored in the current browser, not synced across machines.

## Development

| Path | Purpose |
| --- | --- |
| `src/app.js`, `src/input.js` | Browser integration, HUD, camera, and controls |
| `src/core.js`, `src/player.js`, `src/enemies.js`, `src/supplies.js` | Combat and gameplay |
| `src/layout.js`, `src/ammo-placement.js` | Village generation and reachable supplies |
| `src/visuals.js`, `src/tracers.js`, `src/audiofx.js` | Models, shot feedback, and sound |
| `assets/village-pack.json` | Runtime triangle-mesh pack |
| `assets/thunderbolt-workshop.blend` | Editable Blender asset workshop |
| `vendor/` | Local Three.js 0.185.1 modules and MIT license |
| `server.mjs` | Local Node.js web server |
| `tests/` | Simulation checks and browser verification snippets |

The soldiers and scenery were authored through Blender MCP. The current pack includes 19 asset families: refined soldier equipment, fractured masonry, damaged crates, compressed sandbags, and rubble, plus plastered ruins, broken windows, chimney remnants, burned timber frames, collapsed roof debris, barrels, charred trees, oaks, broken fences, and grass clumps. The editable workshop and asset checkpoints are included, including the preserved cottage and the pre-refinement workshop. `assets/refine-assets.py` contains the Blender authoring functions; `assets/export-character-pack.py` exports the tagged workshop with animation pivots, normals, materials, and baked wear colors. Runtime models share geometry and materials; scenery uses instancing and cached static shadows.

This project adapts the existing Thunderbolt_WWII survival game. The original local reference is preserved separately and is not needed to run this repository. Combat values and adaptation differences are recorded in [BALANCE.md](BALANCE.md).

### Checks

```sh
npm test
node tests/gameplay-refinements.mjs
node tests/controller-assist.mjs
node tests/accessibility.mjs
```

`npm test` runs independent simulation checks across 20 fixed seeds and takes several minutes. Results are written under the ignored `output/` directory. The focused checks cover ammo recovery, controller mappings, and slight aim assistance.

The `tests/*.cjs` files are Playwright CLI function snippets for a running game, not Playwright Test specifications. Browser tooling is optional and is not needed to play. `window.__OT3D` exposes controlled browser-verification helpers.

See [VERIFICATION.md](VERIFICATION.md) for recorded test results, controller diagnostics, measured performance, and limitations. [BALANCE.md](BALANCE.md) records the ammo rationale and current combat values; [QUICKSTART.md](QUICKSTART.md) covers player setup and troubleshooting.
