# Gameplay refinement plan

Status: approved and implemented; automated verification complete; physical Xbox detection unresolved, awaiting USB comparison. The user approved the current artwork and models on 6 September 2026. The next pass covers bullet visibility, ammunition recovery, small aiming refinements, and Xbox controller support.

## 1. Make bullets readable

- Replace the current thin line segments with pooled camera-facing tracer geometry. Start with a 3–4 CSS-pixel visible width and a slightly longer trail, then inspect during normal play at 720p and 1080p.
- Use a bright core and contrasting edge; keep player shots warm yellow and hostile shots orange-red. Preserve world depth so scenery can occlude tracers.
- Keep projectile damage, speed, collision radius and range independent of their larger appearance.
- Check visibility over roads, grass and ruins, including simultaneous MG fire. Measure the full enemy cap after the change.

The current renderer uses LineBasicMaterial; its linewidth property is ignored by WebGL, so changing that number alone will not solve the issue. Reference: https://threejs.org/docs/pages/LineBasicMaterial.html

## 2. Guarantee an ammunition recovery route

Current behavior: ammunition is available from random enemy drops, gives 16 reserve rounds, and disappears after 14 seconds. There is no guaranteed kill-independent source when the magazine and reserve reach zero.

Revised after the ammo balance review (see AMMO-BALANCE-REVIEW.md):

- When magazine plus reserve falls to 16 rounds or fewer, ensure one emergency ammunition pickup exists.
- Place it on a validated reachable cell roughly 100–180 route units away, using seeded placement and existing navigation. Avoid occupied cells and known enemy firing lines where feasible; use the nearest suitable reachable fallback if the preferred area has no valid cell.
- Mark it clearly as AMMO, with an off-screen direction indicator. It supplies 24 reserve rounds, obeys the reserve cap, and remains until collected.
- Allow only one emergency pickup at a time. Repeat the low-ammo recovery rule after collection and subsequent depletion. Reaching supplies remains part of survival; collecting does not instantly fill the magazine.
- Keep ordinary ammo drop probability and its 16-round reward, but extend ammo lifetime from 14 to 30 seconds. Medical and upgrade lifetimes stay unchanged. Use existing crate geometry for the recovery pickup.
- Emergency recovery has no kill requirement, score/health cost or cooldown, and ordinary drops do not suppress its guarantee. Keep enemy strength and wave pressure unchanged; this pass should reduce ammunition frustration.
- Treat 16/24 rounds and the shorter collection route as starting values for playtesting after the aiming fixes. Track empty time, ammo collected/expired and damage taken while resupplying.

Acceptance: starting with zero ammunition and no enemies killed, the player can reach supplies, reload, and resume firing. Repeat this across fixed seeds, during active waves, behind cover and on restart. Verify no inaccessible placement, wall-through collection, duplicate pickup accumulation or capacity overflow.

## 3. Refine aiming conservatively

- First reproduce near misses while stationary, moving, changing direction and tracking crossing enemies.
- Align input sampling, model transforms, camera projection and shot direction. The current frame calculates aim before advancing simulation and refreshing model transforms; investigate this source of tracking discrepancy.
- Give visible-body selection a small, consistent screen-space tolerance and stable overlap selection. Avoid sudden switches between adjacent actors.
- Make reticle feedback show intended aim, movement spread, blocked shots and range clearly.
- Preserve direct mouse response. Keep current weapon spread initially; only propose a small spread adjustment if playtesting shows dispersion is the remaining problem.

Acceptance: all roles can be tracked at several viewport sizes, including the low sniper; camera movement does not shift the intended target; cover and range checks remain valid.

## 4. Add Xbox controller support

Use the browser Gamepad API with the standard mapping, polled every frame. Reference: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

| Control | Action |
|---|---|
| Left stick | Screen-relative analog movement |
| Right stick | Directional aim with a visible reticle; retain direction on release |
| RT | Fire |
| X | Reload |
| Menu / Start | Pause or resume |
| D-pad | Navigate menus |
| A | Confirm, deploy or replay |
| B | Back or resume from pause |

- Introduce shared movement, aim, fire and reload actions so keyboard/mouse and controller use the same combat logic.
- Use radial dead zones, rescaled analog movement, normalized maximum diagonal speed, and adjustable aiming response. Begin around a 0.15 stick dead zone and tune against hardware.
- Switch input prompts on meaningful activity; stick noise must not steal mouse control. Controller X means reload, while the keyboard X shortcut remains reduced shake.
- Pause and clear held actions on active-controller disconnection or focus loss. Reconnection must require deliberate resume and fresh fire input.
- Support deploy, pause and replay without needing the mouse. Do not assume unsupported mappings match the Xbox layout.

Acceptance: automated axis/button tests cover movement, dead zones, held fire, one-press reload/pause, menu navigation, input switching and disconnect/reconnect. Complete a physical Xbox controller playthrough for drift and aiming feel; simulated input cannot establish hardware feel.

## Execution and review

Implement bullet visibility and ammunition recovery first, then the shared input/aiming changes and controller support. Run focused regressions, ordinary browser-input playthroughs, physical-controller checks when available, and the capped-enemy performance scenario. Document ammunition recovery as a deliberate balance change. Stop for user review after this pass.
