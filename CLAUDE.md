# Operation Thunderbolt 3D — agent entry point

@PROJECT.md
@memory/MEMORY.md

## Rules
1. The user requested a finished first version, then a stop for review. Do not start another pass without their request.
2. Current code is authoritative; the original GAME_MEMORY.md was stale. Preserve C:/DEV/Thunderbolt_WWII.
3. Read BALANCE.md before changing gameplay. Do not change retained balance without observed evidence and an explanation.
4. Use Blender MCP only for Blender work, preserve the cottage and asset checkpoints, favor Solid viewport, and avoid GPU renders given the prior driver crash.
5. Verify changed behavior, not only syntax. Separate automated/controlled checks from normal browser-input playthroughs and human playtesting.
6. Keep all runtime assets and rendering dependencies local. No extra systems beyond survival.
7. Check memory/rejected-approaches.md before reviving an approach. Update project status at session end.

## Build / test / run
- No build/install required.
- `npm start` — http://127.0.0.1:8083, Node 20+.
- `npm test` — simulation and 20 fixed seeds; takes several minutes.
- `tests/*.cjs` — Playwright CLI browser function snippets against the local server.
- Browser artifacts and raw measurements: output/ (gitignored); summarized in VERIFICATION.md.

## Code map
| Concern | Entry |
|---|---|
| State, collision, fixed-step combat | src/core.js |
| Seeded villages and route grid | src/layout.js |
| Source-derived behavior | src/player.js, src/enemies.js, src/supplies.js, src/audiofx.js |
| Browser input, rendering, HUD, camera | src/app.js |
| Blender mesh loading and instancing | src/visuals.js |
| Editable asset workshop and runtime pack | assets/thunderbolt-workshop.blend, assets/village-pack.json |
| Launch and evidence | README.md, BALANCE.md, VERIFICATION.md |
