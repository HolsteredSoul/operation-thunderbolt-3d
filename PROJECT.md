# Operation Thunderbolt 3D

## Mission
Build one complete, locally playable 3D isometric adaptation of the current Thunderbolt_WWII survival shooter, then stop for user review.

## Definition of done
All four enemy roles and capped upgrades, retained combat balance, repeatable validated village seeds, accurate screen-relative controls, readable feedback, sound, pause/death/restart and separate persistent high score. Verify in a real browser, across 20 fixed seeds, waves 1–5 and a capped population; report measured performance and limitations.

## Non-goals
No missions beyond survival, elevation mechanics, extra progression, mobile controls, online services or further polish without user review. Preserve C:/DEV/Thunderbolt_WWII.

## Status
- **Phase:** 3 — verified first version; awaiting review.
- **Last done:** Complete local game with Blender MCP asset pack, source combat modules, deterministic connected villages, browser verification and measured 34-enemy performance. See VERIFICATION.md.
- **Next action:** User review only. Do not start another polish cycle without a request.
- **Synced to:** First-version implementation commit (see git log); 2026-09-06.

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
