# Operation Thunderbolt 3D — development guidance

## Current state

The playable survival game, Blender asset passes, ammo recovery, and single-stick Xbox controls are implemented. Physical Xbox Bluetooth operation is user-confirmed in Chrome; in-app preview support and extended controller feel remain separately unverified. The current artwork is approved, including the compact kneeling sniper correction.

The personal repository is https://github.com/HolsteredSoul/operation-thunderbolt-3d. It remains private; GitHub Pages publication has not been enabled. Windows users can double-click `gamestart.cmd`. Obsolete plans and duplicate status/memory notes have been removed, with lasting decisions consolidated here and technical evidence retained in the documents below.

## Working rules

1. Work within the user's requested scope. Do not start unsolicited visual, balance, progression, or game-mode passes. Keep this a survival game unless the user requests otherwise.
2. Current code is authoritative. Preserve the separate original project at `C:/DEV/Thunderbolt_WWII`; it is not a runtime dependency.
3. Read [BALANCE.md](BALANCE.md) before gameplay changes. The user finds the game challenging: preserve enemy pressure when refining ammo recovery, and explain balance changes with observed evidence.
4. Use Blender MCP for Blender work. Preserve the cottage and asset checkpoints, save small steps, use Solid viewport, and avoid GPU rendering because of the earlier driver crash.
5. Preserve distinct soldier silhouettes, persistent role names/symbols, and the player's YOU marker unless the user requests changes.
6. Controller preference: left-stick movement/facing, optional right-stick override, and only slight assistance (12-degree cone, 25% correction, 3-degree cap, no accumulating lock). Keep mouse aiming unassisted. Do not restore mandatory twin-stick aiming or full automatic targeting without a user request.
7. Verify changed behavior and separate controlled tests, ordinary browser playthroughs, and human hardware testing. Simulated gamepads do not prove physical input. Preserve power-on/click/press-A guidance; pairing alone is not live connectivity.
8. Keep runtime assets and rendering dependencies local. No additional runtime services are required.
9. Keep documentation current and concise. Use Git history for completed work rather than session journals; update this current-state summary when needed. Do not add workflow-enforcement hooks unless the user asks after repeated convention failures.

## Run and verify

- Double-click `gamestart.cmd`, or run `npm start`: http://127.0.0.1:8083. Node.js 20+; no install or build step.
- `npm test`: simulation and 20 fixed seeds; takes several minutes.
- `node tests/gameplay-refinements.mjs`: ammo recovery and controller input checks.
- `node tests/controller-assist.mjs`: facing and slight assistance checks.
- `tests/*.cjs`: Playwright CLI browser function snippets, not Playwright Test specifications.
- Raw browser artifacts and measurements are gitignored under `output/`; recorded evidence and limitations are in [VERIFICATION.md](VERIFICATION.md).

## Documentation and code

[README.md](README.md) describes features, controls, and the code map. [QUICKSTART.md](QUICKSTART.md) covers launch and troubleshooting. [BALANCE.md](BALANCE.md) records combat values and design rationale. [VERIFICATION.md](VERIFICATION.md) records test evidence and controller diagnostics.

Core combat is in `src/core.js`, `src/player.js`, `src/enemies.js`, and `src/supplies.js`; generation is in `src/layout.js` and `src/ammo-placement.js`; browser input/rendering is in `src/app.js`, `src/input.js`, and `src/visuals.js`. Editable models are in `assets/thunderbolt-workshop.blend`; the runtime pack is `assets/village-pack.json`.
