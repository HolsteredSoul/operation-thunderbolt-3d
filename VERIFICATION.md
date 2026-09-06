# First-version verification — 6 September 2026

## Result

The local survival mode is playable with Blender-authored assets, all four enemy roles, all four capped upgrades, seeded village layouts, restart, sound controls and persistent high score. The original project was read as a reference and left in place. There are no known failures blocking this defined mode.

## Automated simulation checks

`npm test` completed **11 check groups**. Twenty fixed seeds, QA-00 through QA-19, passed full walk-grid connectivity, protected start, accessible building interiors/doorways, density bounds, open crossroads, and legal role-specific spawn checks from the center and representative map-edge positions. Repeatability and the explicit known-good fallback passed.

Combat checks covered player baselines, reload conservation, four-stack upgrade limits and overflow score, health and ammunition supply amounts, conditional drop rolls, exact wave 1–5 and capped wave 20 composition, .45 s spawn pacing, score rewards, four-second breaks, swept cover/target collision, muzzle obstruction, .55 s invulnerability, sniper telegraph cancellation, six-shot stationary MG bursts, death and clean restart. Ten relevant groups passed again after the collision allocation and shadow performance changes.

Records: `output/invariants.json`, `output/invariants-log.txt`, `output/combat-invariants.json`, and `output/combat-final.txt`.

## Real browser verification

Headed Chrome was driven through the Playwright CLI with real mouse and keyboard events. This is **agent-operated browser playtesting**, not an independent human playtest. The original Canvas game was briefly exercised for movement, sustained firing, reload and pause before adaptation.

The new game's browser checks passed primary-button fire, quick-tap R reload, visible soldier head targeting and projectile kills, screen-relative arrows, targeting at 1280×720 / 1920×1080 / 900×650, pause/resume, focus-loss input clearing, M/X controls, pickup collection and all caps, death/results, storage across reload, and clean restart. Additional checks exercised actual village cover against movement, bullets and pickup attraction, aim during camera following, and an offscreen sniper telegraph in a narrow viewport. Ten consecutive restarts retained exactly **65 GPU geometries** each.

Controlled browser setups verified wave populations 7, 10, 13, 17, 20 and 34 for waves 1, 2, 3, 4, 5 and 20 respectively. These are **controlled checks**, not a claim that a normal run was played from wave 1 through wave 20. Sniper-warning and capped-population screenshots also use controlled setups. Audio initialization, firing, reload and mute calls ran without runtime errors; subjective speaker loudness/mix was not independently assessed.

Three unmodified-balance, approximately 23-second browser-input playthroughs:

| Seed | Kills | Shots / hits | HP remaining | Result |
|---|---:|---:|---:|---|
| QA-03 | 7 | 54 / 14 | 92 | First wave cleared |
| QA-11 | 6 | 50 / 13 | 52 | One rifleman remained |
| QA-18 | 5 | 53 / 10 | 84 | Two riflemen remained |

The input driver followed and fired at nearby enemies and used ordinary movement/reloading; these runs did not grant upgrades, extra supplies, invulnerability or modified enemy stats. They show playable routes and combat across representative layouts, not equal difficulty.

Browser scripts are in `tests/`; screenshots and raw outputs are in `output/playwright/` and `output/*browser*.txt`.

## Measured performance

Windows, Intel Core i7-12700H, Intel Iris Xe integrated graphics (driver 31.0.101.4502), headed Chrome 152, ANGLE Direct3D11, **1920×1080, device pixel ratio 1**. The full 34-enemy capped composition was kept alive and placed on legal nearby cells to keep AI and gunfire active. Player invulnerability was used only for this stress test. Each final measurement sampled 12 seconds after warm-up.

| Quality | Mean FPS | Median frame | 95th percentile frame | Median CPU frame work |
|---|---:|---:|---:|---:|
| High | **84.0** | 10.0 ms | 20.1 ms | 8.9 ms |
| Low | **85.4** | 10.0 ms | 20.0 ms | 8.5 ms |

High drew about 276k triangles in 78 calls per frame after baking the static scenery shadow map. Soldiers use moving contact shadows. The initial uncached-shadow stress run was 46 FPS; caching removed the repeated static shadow pass without changing combat. Low disables the scenery shadow map and caps pixel ratio at 1; on this test machine the final workload was mostly CPU-limited, so Low's gain was small.

This clears the average 60 FPS target under the stated conditions. It is **not** a guarantee of locked 60 FPS: occasional ~20 ms frames occurred, and other hardware, high-DPI screens or browser activity can differ. Raw final measurement: `output/performance-browser-final.txt`.

## Remaining limits and review boundary

- Short playthroughs and layout checks do not establish equal seed difficulty or identical difficulty to the original. Navigation and bounded spawn differences are explained in BALANCE.md.
- The view deliberately uses low cutaway ruins and one combat plane. There are no elevation mechanics or roofed interiors.
- Desktop keyboard/mouse and WebGL 2 are required. Mobile controls and additional game modes are outside this version.
- Sound recipes and controls were exercised; a human listening pass remains useful.

This completes the requested first version. Further balance or visual work waits for the user's review.


## Requested unit-readability pass - 6 September 2026

The user found the original models too similar. Blender MCP was used to rebuild all five soldier appearances. The player now has khaki kit and contrasting webbing, riflemen use blue-grey uniforms, officers have long dark coats, peaked caps and pistols, snipers kneel under broad hooded capes with long scoped rifles, and MG gunners have a low, wide emplacement and heavy weapon. The previous asset scene is saved as assets/before-role-readability.blend. An export script preserves scenery while replacing character meshes.

The reticle now names the selected enemy role. Its silhouette selection bounds match the revised models; health, damage, movement speed, actual collision radii, firing, drops and waves are unchanged.

All four enemy types were selected correctly by aiming at their visible upper bodies. The side-by-side screenshot at output/playwright/role-comparison.png uses actual gameplay scale; the role labels in that comparison are QA annotations. The production game displays a role name on aim. All 15 browser control/state/targeting checks passed again, including three viewport sizes and head-target projectile kills.

The same 34-enemy, 1080p headed Chrome / Iris Xe workload measured 88.5 FPS mean on High (20 ms p95 frame, 7.7 ms median CPU work) and 97.4 FPS on Low. These short-run differences from the first measurement are not claims of a further optimization. Raw results: output/role-readability.txt, output/role-browser-checks.txt and output/role-performance.txt. No simulation or generation code changed, so the previously completed seed and combat invariant results still apply.


## Persistent role identification - follow-up review

The user still found soldiers difficult to identify during play. Persistent, high-contrast labels now name every enemy in the visible combat area: RIFLE (cartridge symbol), OFFICER (double chevron), SNIPER (crosshair), MG NEST (gun-emplacement symbol). Words and shapes supplement the existing Blender silhouettes and colors. The player has a mint YOU badge and ground ring. Crowded labels shift vertically with leaders connecting them to their actors. The overlay does not intercept input.

All five labels were verified while the mouse was away from every actor and no aim target existed. The production badges were inspected at 1080p, captured at 720p, and inspected under the 34-enemy stress setup. Fifteen existing browser controls/targeting/state checks were rerun. The same Iris Xe / headed Chrome / 1080p stress setup measured 91.4 FPS mean on High with a 20 ms p95 frame. This is a short-run measurement, not a claim of additional performance optimization.

Evidence: output/persistent-role-badges.txt, output/badges-browser-checks.txt, output/badges-performance.txt and output/playwright/persistent-role-badges.png. This pass changes combat overlays only; model geometry, camera projection, collision, statistics, AI and generation are unchanged.
