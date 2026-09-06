# Operation Thunderbolt 3D — development guidance

## Current state

The survival game now includes the user-requested atmosphere and accessibility pass: weathered scenery and smoke, gentler controller handling, Recruit/Standard difficulty, and selectable Off/3°/5° assistance. The user rejected excessive aiming overlays: retain just one small controller direction chevron or compact mouse crosshair, with no dashed line or aim text. The following Blender asset pass refined soldier clothing/helmets and scenery, then added ten architecture/landscape asset families. The pack now has 19 families; the pre-pass scene is saved in `assets/before-asset-refinement.blend`.

Physical Xbox Bluetooth operation was user-confirmed in Chrome before this pass; current subjective stick feel and in-app preview support require separate human assessment. Windows users can double-click `gamestart.cmd`. The personal repository is https://github.com/HolsteredSoul/operation-thunderbolt-3d; publishing configuration should be checked on GitHub when relevant.

Mobile now has a separate touch layout (`src/touch.js`): left movement pad, held FIRE with full visible-target tracking within 500 units, reload, and automatic pause in portrait. This touch-specific tracking is intentional; preserve the existing Xbox 5° and mouse behavior. Mobile starts on Low quality. `src/fullscreen.js` handles Fullscreen API entry/exit and iOS home-screen instructions; the relative manifest and app icons support GitHub Pages and local paths. Home-screen launch is online-only, with no service worker. Phone touch and Chrome fullscreen are browser-emulated checks; physical iOS/Android feel and performance still need user validation.

## Working rules

1. Work within the user's requested scope. Do not start unsolicited visual, balance, progression, or game-mode passes. Keep this a survival game unless the user requests otherwise.
2. Current code is authoritative. Preserve the separate original project at `C:/DEV/Thunderbolt_WWII`; it is not a runtime dependency.
3. Read [BALANCE.md](BALANCE.md) before gameplay changes. The user finds the game challenging: keep Standard combat values and ammo recovery intact, offer Recruit as the easier profile, and explain balance changes with evidence.
4. Use Blender MCP for Blender work. Preserve the cottage and asset checkpoints, save small steps, use Solid viewport, and avoid GPU rendering because of the earlier driver crash.
5. Preserve distinct soldier silhouettes, persistent role names/symbols, and the player's YOU marker unless the user requests changes.
6. Controller preference: left-stick movement/facing, optional right-stick override, and selectable assistance (12-degree cone; default 50% correction capped at 5°, optional 25%/3° or Off; no accumulating lock). Gentle stick feel is the default. Keep mouse aiming unassisted. Do not restore mandatory twin-stick aiming or full automatic targeting without a user request.
7. Verify changed behavior and separate controlled tests, ordinary browser playthroughs, and human hardware testing. Simulated gamepads do not prove physical input. Preserve power-on/click/press-A guidance; pairing alone is not live connectivity.
8. Keep runtime assets and rendering dependencies local. No additional runtime services are required.
9. Asset priority: the user considers 60 FPS aspirational and roughly 40 FPS acceptable. Favor richer, better-shaped assets over removing detail merely to meet 60 FPS; still measure performance and preserve gameplay readability.
10. Keep documentation current and concise. Use Git history for completed work rather than session journals; update this current-state summary when needed. Do not add workflow-enforcement hooks unless the user asks after repeated convention failures.

## Run and verify

- Double-click `gamestart.cmd`, or run `npm start`: http://127.0.0.1:8083. Node.js 20+; no install or build step.
- `npm test`: simulation and 20 fixed seeds; takes several minutes.
- `node tests/gameplay-refinements.mjs`: ammo recovery and controller input checks.
- `node tests/controller-assist.mjs`: facing and assistance checks.
- `node tests/mobile-controls.mjs`: touch target eligibility, firing gates, and input isolation. `tests/mobile-browser.cjs` checks multi-touch, phone rotation, and fullscreen in a fresh mobile browser context.
- `node tests/accessibility.mjs`: difficulty, score isolation, direction-marker cover tracing, and Gentle/Direct controls.
- `tests/*.cjs`: Playwright CLI browser function snippets, not Playwright Test specifications.
- Raw browser artifacts and measurements are gitignored under `output/`; recorded evidence and limitations are in [VERIFICATION.md](VERIFICATION.md).

## Documentation and code

[README.md](README.md) describes features, controls, and the code map. [QUICKSTART.md](QUICKSTART.md) covers launch and troubleshooting. [BALANCE.md](BALANCE.md) records combat values and design rationale. [VERIFICATION.md](VERIFICATION.md) records test evidence and controller diagnostics.

Core combat is in `src/core.js`, `src/player.js`, `src/enemies.js`, and `src/supplies.js`; generation is in `src/layout.js` and `src/ammo-placement.js`; browser input/rendering is in `src/app.js`, `src/input.js`, and `src/visuals.js`. Editable models are in `assets/thunderbolt-workshop.blend`; the runtime pack is `assets/village-pack.json`.
