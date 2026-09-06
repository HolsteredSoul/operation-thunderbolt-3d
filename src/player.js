// === player ===
OT.player = (() => {
  'use strict';

  // ---- private tuning constants ----
  const SPEED = 230;
  const FIRE_CD = 0.16;       // ~6.25 shots/s base
  const RELOAD_TIME = 1.15;
  const MUZZLE_OFFSET = 22;   // px along aim from body center
  const BULLET_SPEED = 750;
  const BULLET_DMG = 34;
  const BULLET_LIFE = 0.7;    // ~525px effective range (was 1.6/1200px — G2)
  const SPREAD_BASE = 0.06;   // was 0.02 (G3: vestigial)
  const EMPTY_THROTTLE = 0.35;
  // D1 upgrade caps (applied by ui on pickup collection)
  const MAX_DMG_BONUS = 24;      // p.dmg 34 → 58
  const MIN_FIRE_CD = 0.06;     // p.fireCdBase 0.16 → 0.06
  const MAX_MAG_BONUS = 8;     // p.magSize 8 → 16
  const MAX_HP_BONUS = 80;    // p.maxHp 100 → 180

  // private timers (don't pollute G.player with throttles the contract doesn't list)
  let emptyT = 0;     // cooldown for the 'empty' click sound
  let wasReloading = false;

  function init(G) {
    // nothing to precompute; soldier is drawn fully procedurally
  }

  function reset(G) {
    G.player = {
      x: G.playerSpawn.x,
      y: G.playerSpawn.y,
      r: 14,
      hp: 100,
      maxHp: 100,
      angle: 0,
      speed: SPEED,
      ammo: 8,
      magSize: 8,
      reserve: 72,
      maxReserve: 160,
      fireCd: 0,
      fireCdBase: FIRE_CD,    // D1: base fire cd, upgradable
      reloadT: 0,
      reloadTime: RELOAD_TIME,
      invulnT: 0,
      dmg: BULLET_DMG,         // D1: base bullet dmg, upgradable
      // D1: upgrade stack counters — drive HUD badges + cap enforcement in ui
      upgrades: { dmg: 0, fireRate: 0, mag: 0, maxHp: 0 },
      walkT: 0,
      moving: false,
      stepPhase: 0 // for boot alternation, advances with walkT
    };
    emptyT = 0;
    wasReloading = false;
  }

  function startReload(G, p) {
    if (p.reloadT > 0) return;
    if (p.ammo >= p.magSize) return;
    if (p.reserve <= 0) return;
    p.reloadT = RELOAD_TIME;
    wasReloading = true;
    G.audio.play('reload');
  }

  function update(G, dt) {
    const p = G.player;
    if (!p) return;

    // ---- timers ----
    if (p.fireCd > 0) p.fireCd -= dt;
    if (p.invulnT > 0) p.invulnT -= dt;
    if (emptyT > 0) emptyT -= dt;

    // ---- reload completion ----
    if (p.reloadT > 0) {
      p.reloadT -= dt;
      if (p.reloadT <= 0) {
        p.reloadT = 0;
        const need = p.magSize - p.ammo;
        const take = Math.min(need, p.reserve);
        if (take > 0) {
          p.ammo += take;
          p.reserve -= take;
        }
        wasReloading = false;
      }
    }

    // ---- movement ----
    let dx = 0, dy = 0;
    const k = G.keys;
    if (k['KeyW'] || k['ArrowUp']) dy -= 1;
    if (k['KeyS'] || k['ArrowDown']) dy += 1;
    if (k['KeyA'] || k['ArrowLeft']) dx -= 1;
    if (k['KeyD'] || k['ArrowRight']) dx += 1;

    const actions=G.input?.sample();
    if(actions){dx=actions.moveX;dy=actions.moveY;}
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      if(!actions){dx /= len; dy /= len;}
      const step = SPEED * dt;
      moveCircle(p, (dx + dy) * Math.SQRT1_2 * step, (dy - dx) * Math.SQRT1_2 * step);
      p.moving = true;
      p.walkT += dt;
      p.stepPhase += dt * 9; // cadence of footfalls
    } else {
      p.moving = false;
    }

    // ---- aim ----
    if(G.aimTarget&&!G.aimTarget.dead){G.mouse.wx=G.aimTarget.x;G.mouse.wy=G.aimTarget.y;}
    p.angle = actions?.aimAngle ?? U.angTo(p.x, p.y, G.mouse.wx, G.mouse.wy);

    // ---- reload input ----
    if (G.keys['KeyR']) {
      startReload(G, p);
    }

    // ---- firing ----
    if (p.reloadT <= 0) {
      if (actions?actions.fire:G.mouse.down) {
        if (p.ammo > 0) {
          if (p.fireCd <= 0) {
            p.fireCd = p.fireCdBase;
            p.ammo--;
            // G3: spread widens while moving — forces the move-vs-aim tradeoff
            const rules=difficultyRules(),moveMult=p.moving?rules.movingSpread:1;
            const spread = U.rand(-SPREAD_BASE, SPREAD_BASE) * moveMult * rules.spread;
            const ang = p.angle + spread;
            const mx = p.x + Math.cos(p.angle) * MUZZLE_OFFSET;
            const my = p.y + Math.sin(p.angle) * MUZZLE_OFFSET;
            // G2: bullet life cut from 1.6s (1200px range) to 0.7s (~525px)
            fireBullet(mx, my, ang, BULLET_SPEED, p.dmg, true, { life: BULLET_LIFE });
            G.fx.muzzle(mx, my, p.angle, 1);
            G.audio.play('shot');
            addShake(1.2);
          }
        } else {
          // empty: auto-reload if we have reserves, else click 'empty' (throttled)
          if (p.reserve > 0) {
            startReload(G, p);
          } else if (emptyT <= 0) {
            G.audio.play('empty');
            emptyT = EMPTY_THROTTLE;
          }
        }
      }
    }
  }

  return { init, reset, update, startReload };
})();
