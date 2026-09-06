# Ammo balance review — 6 September 2026

Planning analysis only; no gameplay constants changed. Based on src/enemies.js, src/player.js and src/supplies.js. The user reports the existing game is already challenging.

## Current economy

The player starts with 80 rounds: 8 loaded and 72 reserve. A kill produces an ammo pickup with probability 0.95 × 0.22 × 0.60 = 12.54%. At 16 rounds each, this generates 2.0064 rounds per kill on average before expiry, missed collection and reserve-cap waste.

| Wave | Enemies | Minimum hits at starting damage | Expected shots at 50% hit rate | Expected ammo generated |
|---|---:|---:|---:|---:|
| 1 | 7 | 14 | 28 | 14.0 |
| 4 | 17 | 43 | 86 | 34.1 |
| 5 | 20 | 50 | 100 | 40.1 |
| 10 | 34 | 107 | 214 | 68.2 |
| 20 | 34 | 122 | 244 | 68.2 |

Method: sum ceil(enemy HP / 34) over the exact wave composition; divide by an illustrative 0.50 hit probability for expected shots. This is an analytical budget, not a simulated or measured player success rate. It excludes upgrades and ammo from full-health medical pickups. Damage upgrades can reduce costs, particularly for officers, snipers and nests; health pickups can add up to 0.6688 expected rounds per kill if every medical pickup is collected at full health. Neither is a guaranteed baseline supply. The initial 80-round stock temporarily absorbs deficits. Generated rounds are not necessarily collected rounds.

There is a 39.1% probability that wave 1 generates no dedicated ammo pickup at all. Medical pickups can still yield ammo at full health. Current supply expiry is 14 seconds, and collection requires reaching the item with clear sight. Later-wave nest HP continues increasing after enemy counts reach their cap, so ammunition pressure also grows.

Earlier short agent-operated browser runs recorded 10–14 hits from 50–54 shots. These are not representative human accuracy measurements and predate the latest targeting changes, but they reinforce the need to test missed-shot costs rather than assume perfect accuracy.

## Revised proposal

- Keep ordinary ammo drop probability and its 16-round value initially.
- Extend ordinary ammo pickup lifetime from 14 to 30 seconds; leave medical and upgrade lifetime unchanged.
- Trigger one guaranteed emergency pickup when loaded plus reserve ammo reaches 16 or fewer; grant 24 reserve rounds on collection. This replaces the earlier 8-round trigger / 16-round reward.
- Prefer a short reachable route of 100–180 units, with visible marking and an off-screen bearing. Avoid occupied cells and known enemy firing lines when a suitable nearby option exists; never advertise the location as safe. Use the nearest suitable reachable fallback instead of a long forced detour.
- Emergency ammo remains until collected, is limited to one active pickup and can recur after later depletion. It requires no kills, has no score/health cost or recovery cooldown, and does not instantly reload the weapon. Ordinary drops do not suppress the guarantee.
- Do not increase enemy HP, damage, numbers, speed or wave pressure to compensate. Keep weapon damage and spread initially. The intended balance change is less ammunition frustration within the existing combat difficulty.

At a hypothetical 50% hit rate, the previous 16-round reward buys about eight hits: fewer than the eleven needed for a wave-4 MG nest. A 24-round reward buys about twelve expected hits and gives more useful recovery headroom; it does not guarantee a kill. Earlier triggering gives the player time to collect before completely empty.

## Validation before final tuning

Test zero-ammo recovery without kills, repeated depletion, cover/path placement, collection during mixed waves, maximum reserve, pause/restart and seeded reproducibility. Give ammo pickups an explicit per-item amount/lifetime so emergency rewards and ordinary expiration cannot accidentally affect health or upgrades.

Compare ordinary play on the same representative seeds before/after, including waves with MG nests. Record hit rate, ammo generated/collected/expired, time completely empty, damage taken while collecting, emergency collections and wave clears. Complete targeting refinements before deciding final ammo quantities; improved accuracy can change consumption. Judge success by dependable recovery and less empty running, not a forced win-rate target. No new human playtest or implementation is claimed by this review.
