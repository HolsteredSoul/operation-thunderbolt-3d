# Operation Thunderbolt 3D



## Mission

Build one complete, locally playable 3D isometric adaptation of the current Thunderbolt_WWII survival shooter, then stop for user review.



## Definition of done

All four enemy roles and capped upgrades, retained combat balance, repeatable validated village seeds, accurate screen-relative controls, readable feedback, sound, pause/death/restart and separate persistent high score. Verify in a real browser, across 20 fixed seeds, waves 1–5 and a capped population; report measured performance and limitations.



## Non-goals

No missions beyond survival, elevation mechanics, extra progression, mobile controls, online services or further polish without user review. Preserve C:/DEV/Thunderbolt_WWII.



## Status

- **Phase:** Approved gameplay pass complete; awaiting user review.

- **Last done:** Physical Xbox Bluetooth input resolved and confirmed working by the user in Chrome. Native and browser probes distinguish a remembered pairing from a live controller. Added clearer activation/sleep messages, then simplified to left-stick movement/facing with very slight assistance and an optional right-stick override at the user's request. Gameplay and sniper verification are in VERIFICATION.md.

- **Next action:** User review only. Physical Chrome operation is verified; in-app preview controller support is not separately verified. No unrelated polish.

- **Synced to:** Controller connection diagnosis and activation guidance — 2026-09-06 (see git log).

## Slips

- Quick-tap reload initially depended on a held key reaching a frame; fixed to start on keydown and verified through browser input.

- Static shadow re-rendering cost 46 FPS at the enemy cap; cached scenery shadows and contact shadows raised the measured mean to 84 FPS.



## Stack

Plain browser JavaScript, locally vendored Three.js 0.185.1, Blender MCP-authored mesh pack, procedural Web Audio. Node.js local static server; no install/build step. Node VM checks and Playwright CLI browser verification.



## Roadmap

- [x] Phase 0 — source, rendering, audio and browser dependencies available.

- [x] Phase 1 — playable 3D movement and combat.

- [x] Phase 2 — all defined systems and Blender asset set.

- [x] Phase 3 — fixed seeds, browser checks, capped performance, documentation.

