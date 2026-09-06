# Operation Thunderbolt — The Village

A complete local 3D isometric survival shooter. Move, aim, shoot, use cover, reload, collect supplies and four capped upgrades, survive waves, and replay the same seed or a fresh village.

## Launch

Requires Node.js 20 or newer and a desktop browser with WebGL 2. No package installation, build step, network connection, or Blender installation is needed to play.

```powershell
cd C:\DEV\Thunderbolt_3d
npm start
```

Open [the game](http://127.0.0.1:8083). Keep the server terminal open. Stop it with Ctrl+C. If the port is busy, set `$env:PORT='8084'` before `npm start` and open that port instead. Opening `index.html` directly is unsupported because browsers restrict local module and mesh loading.

## Controls

| Input | Action |
|---|---|
| WASD / arrow keys | Move relative to the screen; diagonals normalized |
| Mouse | Aim at the visible soldier |
| Hold primary mouse button | Fire; automatically reload an empty magazine if reserves remain |
| R | Reload |
| P / Escape | Pause / resume |
| Enter / Space | Deploy, resume, or replay |
| M | Mute |
| X | Reduce shake |
| Quality button | Toggle cached scenery shadows / reduced rendering quality |

Losing focus pauses the simulation and clears held inputs. No pointer lock is required. Low cutaway walls, crates, sandbags, and raised rubble block movement and gunfire across their footprints. Ground litter, floorboards, and roads are traversable. The reticle indicates covered or out-of-range targets. Red sniper lines and a screen warning remain visible even when the sniper is outside the viewport. Small edge bearings show distant enemies; S and MG distinguish stationary threats. Persistent combat badges identify RIFLE, OFFICER, SNIPER and MG NEST with distinct symbols and colors. The player has a mint YOU marker and ground ring. Aiming at an enemy also displays its full role name. Allied infantry wear khaki; riflemen wear blue-grey; officers carry pistols under peaked caps and long dark coats; snipers kneel under broad green hoods; MG gunners sit in wide sandbag emplacements.

The seed field accepts up to 32 characters. Replay retains the layout and initial random streams; different inputs can produce different combat outcomes. Fresh Layout immediately starts a new run. High score uses `ot3d_hiscore_v1`, separate from the original game's key.

## Assets and implementation

The soldiers, officer, sniper, MG emplacement, crates, sandbags, rubble and broken masonry were authored **through Blender MCP**, then exported as local triangle meshes. The editable file is `assets/thunderbolt-workshop.blend` (scene: Thunderbolt Asset Workshop); `assets/village-pack.json` is the runtime mesh pack. The pre-existing cottage was preserved in `assets/cottage-preserved.blend`. No Blender GUI automation or GPU rendering was used.

The renderer loads the pack into shared Three.js geometries, instances scenery and characters by material, animates leg and rifle pivots, caches static directional shadows, and uses lightweight contact shadows for moving soldiers. Three.js 0.185.1 is vendored locally with its MIT license. See [official Three.js documentation](https://threejs.org/docs/). Audio uses the original game's procedural Web Audio recipes. No remote fonts, textures, scripts, or asset requests are made.

`C:\DEV\Thunderbolt_WWII` remains the preserved reference. Its current source, rather than the older GAME_MEMORY.md, supplied the combat values. [BALANCE.md](BALANCE.md) records retained values and adaptation differences. [VERIFICATION.md](VERIFICATION.md) records the tests, actual browser-input playthroughs, performance, and limitations.

## Verify

```powershell
npm test
```

This runs the independent Node simulation checks, including 20 fixed seeds; it takes several minutes. Results go into `output/invariants.json`. The Playwright CLI function snippets under `tests/` document and reproduce browser verification against the running server; they are not Playwright Test specifications. Browser artifacts are saved under `output/playwright/`.

The `window.__OT3D` handle supports controlled verification from browser developer tools. It is not required for normal play.
