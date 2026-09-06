# Retained combat and deliberate adaptation differences

Reference: the current `template.html` and `modules/*.js` in `C:\DEV\Thunderbolt_WWII`, inspected and briefly played before implementation. Distances retain the original units; the arena remains 2400 × 1800. The Standard difficulty retains original combat values. Recruit is an optional, deliberately more forgiving profile described below; enemy composition and pacing, starting ammunition, drops, and upgrades are shared. The user approved the ammunition recovery changes below on 6 September 2026.

## Player — Standard

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

Medical supplies restore 35 HP, or give eight reserve rounds when already at full health. Ammo supplies give 16 reserve rounds, capped at 160. Ordinary ammo expires after 30 s; medical supplies and upgrades expire after 14 s. Timed pickups blink in their last three seconds and magnetize inside 90 units at 140 units/s with clear sight.

At 16 or fewer total rounds (loaded plus reserve), one guaranteed emergency ammo pickup appears. It grants 24 reserve rounds, remains until collected and can recur after later depletion. Placement prefers a 100–180-unit walk-grid route and avoids occupied or exposed locations where possible, with a nearby reachable fallback. It has no kill requirement, cost or recovery cooldown. The player still collects and reloads normally; reserve remains capped at 160. Placement has its own seeded RNG and does not consume combat random numbers. This deliberately reduces ammo starvation without increasing enemy pressure.

### Why guaranteed recovery is needed

Dedicated ammo drops occur with probability 0.95 × 0.22 × 0.60 = 12.54% per kill, yielding 2.0064 rounds per kill on average before expiry, missed collection, and reserve-cap waste. Wave 1 has a 39.1% chance of generating no dedicated ammo drop. Medical pickups can provide ammo at full health, but cannot guarantee recovery from zero ammunition.

At an illustrative 50% hit rate, a 24-round recovery buys about 12 hits, compared with 8 from a 16-round reward. A wave-4 MG nest needs 11 hits at starting damage. These are analytical budgets, not measured player accuracy or guaranteed kills. The user already finds combat challenging: recovery reduces empty running without raising enemy pressure. Judge further tuning by reachable supplies, repeat recovery, empty time, and damage taken while collecting, rather than a forced win-rate target.

## Adaptation differences

- **Fixed orthographic view and input:** camera azimuth 45°, elevation 35°, smooth follow; screen-relative keyboard movement and analog controller movement capped at the same speed. The aim plane is at rifle height, with visible soldier silhouettes mapped to their combat centers. This avoids the height-dependent targeting error of aiming at the ground under a 3D model. Damage and collisions remain on one level.
- **Cover:** low cutaway masonry keeps soldiers' heads visible. Every raised cover footprint blocks both movement and projectiles regardless of decorative height. Swept projectile tests replace source point sampling, preventing fast rounds from skipping thin walls. The player's muzzle segment cannot shoot through a wall. Pickup collection, as well as magnet movement, requires clear sight.
- **Navigation:** an 18-unit-clearance grid supplies connected routes around ruins when sight is blocked, replacing unreliable blind detours in that situation. Enemy speed and firing parameters are unchanged. This can increase effective enemy pressure by reducing time stuck at walls.
- **Procedural bounds:** eight separated building parcels with opposing 96-unit doors, 26 attempted cover placements, protected central roads and a 160-unit start radius. Placement validation requires complete grid connectivity, accessible interiors, 2–10% cover footprint density, open crossroads, and more than 160 accessible perimeter cells. Eight candidates maximum, then a validated known-good layout. A 30-unit perimeter margin keeps actors clear of scenery beyond the arena.
- **Spawns:** legal reachable cells enforce mover distances 500–1500, sniper distances 700–1100, and nest distances 380–650 from the player; nests prefer sight. These maxima and rejection of occupied/blocked locations replace unsafe or arbitrarily distant source fallbacks. Wave count and spawn timing stay unchanged.
- **Input timing:** a reload keydown starts reloading immediately, so a tap between rendered frames cannot be lost. Simulation uses fixed 1/120-second steps, with bounded catch-up. All gameplay randomness is seeded separately from appearance, effects and audio noise.

The checks establish validity and preserve numerical combat balance. They do **not** establish equal difficulty between seeds or parity of difficulty with the 2D original.


## Difficulty profiles

| Rule | Standard | Recruit |
| --- | --- | --- |
| Incoming damage multiplier | 1 | 0.6 (40% less) |
| Protection after a hit | 0.55 s | 0.8 s |
| Stationary shot spread | ±0.06 radians | ±0.045 radians |
| Moving shot spread | ±0.18 radians | ±0.072 radians |

Recruit defaults on when no difficulty preference is saved. The choice is captured at deployment; changing it while paused affects only the next run. Both modes keep the same HP, enemy waves, enemy stats, movement speed, weapon damage, ammunition, and recovery supply rules. Damage reduction applies when the player is hit, including resupply-damage telemetry.

Records are isolated: Standard uses `ot3d_hiscore_v1`, Recruit uses `ot3d_hiscore_recruit_v1`. This pass responds to the user's request for an easier first experience; it does not establish a measured human win rate.

## Controller assistance and feel

Left stick sets movement and nominal facing; releasing it retains facing. Right stick is an optional manual override. Only visible, living enemies within 547 units, clear sight, and 12° of nominal facing qualify. A valid current target is retained.

The user requested a 5° cap. The default 5° option corrects 50% of angular error, capped at 5°. The 3° option retains 25% correction and a 3° cap; Off applies no correction. Each uses a separate nominal heading so updates cannot accumulate into full lock-on. Manual right-stick and keyboard/mouse aiming receive no assistance.

Gentle stick feel raises normalized movement magnitude to the power 1.6, keeping full-stick top speed unchanged. Turning uses frame-time-aware smoothing and a 3.5-radian/s maximum. Direct restores linear stick travel and immediate movement-facing changes. Dead zone and optional right-stick response remain adjustable. Reduced shake defaults on.

After user review, aiming feedback was reduced to one small nearby controller chevron or a compact mouse crosshair. The chevron follows actual assisted firing direction and turns amber for cover within 90 units. The mouse crosshair turns amber for a blocked selected target. No dashed guide, fixed-distance controller cursor, target ring, or aim text remains.

## Atmosphere

Lighting, seeded surface weathering, mud/ruts, ground scorching, varied perimeter scenery, and drifting smoke change presentation only. They use separate visual RNG, add no collision or elevation, and do not consume combat random numbers. Existing Blender character geometry is preserved. Smoke is pooled and batched into one draw, with reduced density on Low quality.
