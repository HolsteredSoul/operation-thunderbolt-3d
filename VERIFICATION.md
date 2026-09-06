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
