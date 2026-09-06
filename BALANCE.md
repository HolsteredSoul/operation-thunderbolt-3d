# Retained combat and deliberate adaptation differences

Reference: the current `template.html` and `modules/*.js` in `C:\DEV\Thunderbolt_WWII`, inspected and briefly played before implementation. Distances retain the original units; the arena remains 2400 × 1800. No damage, health, speed, ammunition, score, drop-rate, upgrade, composition, or pacing retuning was applied.

## Player

100 HP; radius 14; speed 230 units/s; magazine 8; reserve 72 (cap 160); damage 34; firing interval 0.16 s; reload 1.15 s; damage invulnerability 0.55 s. Projectiles travel at 750 units/s for 0.7 s: 525 units beyond the 22-unit muzzle offset. Spread is ±0.06 radians stationary, ±0.18 moving.

## Enemies

| Role | HP | Speed | Damage / projectile speed | Engagement range | Firing |
|---|---:|---|---|---|---|
| Rifleman | 65 | min(130, random 70–95 + 2 × wave) | 8 / 430 | 120–500 | random 1.1–1.6 s; spread .09 |
| Officer | 50 | min(175, 140 + 2 × wave) | 12 / 460 | 80–380 | random .7–.95 s; spread .06 |
| Sniper | 45 | stationary | 22 / 850 | 0–820 | 1.4 s telegraph; cooldown 2.4–3.4 s; spread .015 |
| MG nest | 280 + 20 × wave | stationary | 6 / 470 | 0–520 | six-round burst, .12 s gaps; cooldown 1.5–1.7 s; spread .05 |

Sniper traverse remains .8 rad/s and nest traverse 1.6 rad/s. Sniper sight loss cancels the telegraph with .8 s cooldown. Nest bursts require line of sight. Movers retain their range behavior, separation, strafe wobble, initial cooldowns, and source speed limits.

## Waves and rewards

Riflemen: min(24, 5 + 2w). Officers from wave 2: min(4, floor(w/2)). Snipers from wave 3: min(3, floor((w−1)/2)). Nests from wave 4: min(3, floor((w−2)/2)). The shuffled queue spawns at .45 s intervals. Initial preparation is 2.5 s, subsequent intermissions 4 s. The combined cap is 34 enemies.

Kill scores: rifleman 100, officer 250, sniper 350, nest 400. Wave clear bonus: 50 × wave.

## Drops and upgrades

A death first rolls `< .05` for an upgrade. Only if that fails, a **new independent roll** tests `< .22` for supplies; the next roll chooses health at `< .4`, otherwise ammo. Thus unconditional supply probability is .95 × .22 = 20.9%, not 22%. Upgrade selection is uniform among the four types, including capped types.

Four stacks per upgrade: damage +6 (58 maximum); interval −.025 s (.06 minimum); magazine +2 (16 maximum); maximum HP +20 and healing +20 (180 maximum). An already-capped type awards 200 score. Magazine upgrades do not refill ammunition.

Medical supplies restore 35 HP, or give eight reserve rounds when already at full health. Ammo supplies give 16 reserve rounds, capped at 160. Supplies expire at 14 s, blink in their last three seconds, and magnetize inside 90 units at 140 units/s with clear sight.

## Adaptation differences

- **Fixed orthographic view and input:** camera azimuth 45°, elevation 35°, smooth follow; screen-relative normalized movement. The aim plane is at rifle height, with visible soldier silhouettes mapped to their combat centers. This avoids the height-dependent targeting error of aiming at the ground under a 3D model. Damage and collisions remain on one level.
- **Cover:** low cutaway masonry keeps soldiers' heads visible. Every raised cover footprint blocks both movement and projectiles regardless of decorative height. Swept projectile tests replace source point sampling, preventing fast rounds from skipping thin walls. The player's muzzle segment cannot shoot through a wall. Pickup collection, as well as magnet movement, requires clear sight.
- **Navigation:** an 18-unit-clearance grid supplies connected routes around ruins when sight is blocked, replacing unreliable blind detours in that situation. Enemy speed and firing parameters are unchanged. This can increase effective enemy pressure by reducing time stuck at walls.
- **Procedural bounds:** eight separated building parcels with opposing 96-unit doors, 26 attempted cover placements, protected central roads and a 160-unit start radius. Placement validation requires complete grid connectivity, accessible interiors, 2–10% cover footprint density, open crossroads, and more than 160 accessible perimeter cells. Eight candidates maximum, then a validated known-good layout. A 30-unit perimeter margin keeps actors clear of scenery beyond the arena.
- **Spawns:** legal reachable cells enforce mover distances 500–1500, sniper distances 700–1100, and nest distances 380–650 from the player; nests prefer sight. These maxima and rejection of occupied/blocked locations replace unsafe or arbitrarily distant source fallbacks. Wave count and spawn timing stay unchanged.
- **Input timing:** a reload keydown starts reloading immediately, so a tap between rendered frames cannot be lost. Simulation uses fixed 1/120-second steps, with bounded catch-up. All gameplay randomness is seeded separately from appearance, effects and audio noise.

The checks establish validity and preserve numerical combat balance. They do **not** establish equal difficulty between seeds or parity of difficulty with the 2D original.
