OT.enemies = (() => {
  // ---- private wave director state ----
  let queue = [];          // pending enemy specs to spawn: {type}
  let spawnCd = 0;         // pacing timer between spawns
  let waveActive = false;  // true while spawning or enemies alive
  let inited = false;

  const SPAWN_GAP = 0.45;

  // ---------- helpers ----------
  function clearSpotNearPlayer(G) { return legalSpawn(G, 'nest'); }
  function moverSpawnPoint(G, minDist=500) { return legalSpawn(G, minDist===700 ? 'sniper' : 'rifleman'); }
  function makeEnemy(G, type, x, y) {
    const w = G.wave;
    const phase = U.rand(1.4, 2.6) * (U.random() < 0.5 ? -1 : 1); // strafe wobble
    const visJitter = V.rand(-0.35, 0.35); // precomputed visual variation (no rand in draw)
    const shoulderTilt = V.rand(-0.22, 0.22); // per-spawn shoulder-line lean (no rand in draw)
    const e = {
      x, y, type,
      angle: U.angTo(x, y, G.player ? G.player.x : x + 1, G.player ? G.player.y : y),
      fireCd: U.rand(0.4, 1.2),
      hitT: 0,
      dead: false,
      phase,
      visJitter,
      shoulderTilt,
      detourT: 0,
      detourSign: 1,
      moveTrackT: 0,
      lastX: x,
      lastY: y,
      movedAcc: 0
    };
    if (type === 'rifleman') {
      e.r = 13;
      e.hp = e.maxHp = 65;
      e.speed = Math.min(130, U.rand(70, 95) + 2 * w);
      e.score = 100;
      // G2: rangeMax 330→500 so riflemen can hit back at the player's new
      // ~525px engagement range; rangeMin 200→120 so they don't back off too far.
      e.dmg = 8; e.bSpeed = 430; e.rangeMin = 120; e.rangeMax = 500;
      e.spread = 0.09; e.fireLo = 1.1; e.fireHi = 1.6;
    } else if (type === 'officer') {
      e.r = 12;
      e.hp = e.maxHp = 50;
      e.speed = Math.min(175, 140 + 2 * w);
      e.score = 250;
      // G2: rangeMax 220→380 — officers now harass from mid-range, not point-blank
      e.dmg = 12; e.bSpeed = 460; e.rangeMin = 80; e.rangeMax = 380;
      e.spread = 0.06; e.fireLo = 0.7; e.fireHi = 0.95;
    } else if (type === 'sniper') {
      // D3: stationary long-range marksman — hard-counter to kiting (G2).
      // 820px range outranges the player's ~525px, forcing cover use or
      // aggressive closing. Telegraphed with a 1.4s laser sight.
      e.r = 11;
      e.hp = e.maxHp = 45;
      e.speed = 0;
      e.score = 350;
      e.dmg = 22; e.bSpeed = 850; e.rangeMin = 0; e.rangeMax = 820;
      e.spread = 0.015; e.fireLo = 2.4; e.fireHi = 3.4;
      e.cooldown = U.rand(1.0, 2.5);
      e.telegraphT = 0;
      e.laserX = 0; e.laserY = 0;
    } else { // nest
      e.r = 22;
      e.hp = e.maxHp = 280 + 20 * w;
      e.speed = 0;
      e.score = 400;
      e.dmg = 6; e.bSpeed = 470; e.rangeMax = 520; e.rangeMin = 0;
      e.spread = 0.05;
      e.burstLeft = 0;     // rounds remaining in current burst
      e.burstGap = 0;      // timer between burst rounds
      // G1: burstGap 0.09→0.12 — burst span now 0.6s, outlasts the 0.55s i-frame
      // window so the first AND last round of a burst can deal damage (was: only
      // the first round, making the nest the *least* dangerous enemy at 1.9 DPS).
      const BURST_GAP = 0.12;
      e.burstGapSetting = BURST_GAP;
      e.cooldown = U.rand(0.5, 1.6);
      // precompute sandbag ring positions
      e.bags = [];
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + visJitter;
        e.bags.push({ a, rad: e.r + 4 + (i % 2) * 3 });
      }
    }
    return e;
  }

  // ---------- public API ----------
  function init(G) {
    inited = true;
  }

  function reset(G) {
    queue = [];
    spawnCd = 0;
    waveActive = false;
    G.wave = 0;
    G.enemiesLeft = 0;
    G.nextWaveIn = 2.5; // first intermission
  }

  function buildQueue(G) {
    const w = G.wave;
    const q = [];
    const riflemen = Math.min(24, 5 + 2 * w);
    for (let i = 0; i < riflemen; i++) q.push('rifleman');
    if (w >= 2) {
      const officers = Math.min(4, Math.floor(w / 2));
      for (let i = 0; i < officers; i++) q.push('officer');
    }
    // D3: snipers from wave 3 — anti-kite pressure
    if (w >= 3) {
      const snipers = Math.min(3, Math.floor((w - 1) / 2));
      for (let i = 0; i < snipers; i++) q.push('sniper');
    }
    if (w >= 4) {
      const nests = Math.min(3, Math.floor((w - 2) / 2));
      for (let i = 0; i < nests; i++) q.push('nest');
    }
    // shuffle so types interleave
    for (let i = q.length - 1; i > 0; i--) {
      const j = U.randi(0, i);
      const t = q[i]; q[i] = q[j]; q[j] = t;
    }
    return q;
  }

  function countAlive(G) {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++;
    return n;
  }

  function spawnOne(G, type) {
    let x, y;
    if (type === 'nest') {
      const s = clearSpotNearPlayer(G);
      x = s.x; y = s.y;
    } else if (type === 'sniper') {
      // D3: snipers spawn far from player (>=700px) to leverage their 820px range
      const s = moverSpawnPoint(G, 700);
      x = s.x; y = s.y;
    } else {
      const s = moverSpawnPoint(G);
      x = s.x; y = s.y;
    }
    G.enemies.push(makeEnemy(G, type, x, y));
  }

  function update(G, dt) {
    const p = G.player;

    // ---- wave director ----
    const alive = countAlive(G);

    if (!waveActive) {
      // intermission
      G.nextWaveIn = Math.max(0, G.nextWaveIn - dt);
      if (G.nextWaveIn <= 0) {
        G.wave++;
        queue = buildQueue(G);
        spawnCd = 0;
        waveActive = true;
        G.nextWaveIn = 0;
        G.ui.banner('WAVE ' + G.wave, 2.2);
        G.audio.play('wave');
      }
    } else {
      // active wave: pace spawns
      if (queue.length > 0) {
        spawnCd -= dt;
        if (spawnCd <= 0) {
          spawnOne(G, queue.shift());
          spawnCd = SPAWN_GAP;
        }
      }
      G.nextWaveIn = 0;
      // wave cleared?
      if (queue.length === 0 && countAlive(G) === 0) {
        const bonus = 50 * G.wave;
        G.score += bonus;
        G.ui.banner('WAVE CLEARED', 1.6);
        if (p) G.ui.float(p.x, p.y, '+' + bonus, '#9fe6a0');
        waveActive = false;
        G.nextWaveIn = 4;
      }
    }

    // ---- enemy AI ----
    if (p) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (e.dead) continue;
        if (e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt);
        if (e.type === 'nest') updateNest(G, e, dt, p);
        else if (e.type === 'sniper') updateSniper(G, e, dt, p);
        else updateMover(G, e, dt, p);
      }
    } else {
      // no player: just decay hit flash
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.dead && e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt);
      }
    }

    // ---- death processing (iterate backwards) ----
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.dead) continue;
      G.fx.corpse(e);
      G.kills++;
      G.score += e.score;
      G.ui.float(e.x, e.y, '+' + e.score, '#ffd76a');
      if (e.type === 'nest') {
        G.fx.explode(e.x, e.y);
        G.audio.play('explode');
      } else {
        G.fx.blood(e.x, e.y);
        G.fx.burst(e.x, e.y, { n: 6, color: '#62686d', spd: 90, life: 0.5, size: 2.4, grav: 40 });
        // Q3: distinct low-thud kill confirmation (was: only the 'ehit' hit sound,
        // identical for lethal and non-lethal hits — kills felt unresponsive)
        G.audio.play('ekill');
      }
      if (U.random() < 0.05) {
        // D1: rare upgrade drop (5%, separate from health/ammo) — drives all
        // in-run progression. Without this the player's stats are frozen for
        // the entire run (the largest depth gap in the original design).
        const spot = nudgePickup(G, e.x, e.y);
        const upTypes = ['dmg', 'fireRate', 'mag', 'maxHp'];
        G.pickups.push({ x: spot.x, y: spot.y, type: U.pick(upTypes), t: 0, isUpgrade: true });
      } else if (U.random() < 0.22) {
        const spot = nudgePickup(G, e.x, e.y);
        const type=U.random() < 0.4 ? 'health' : 'ammo';
        G.pickups.push({ x: spot.x, y: spot.y, type, t: 0, ...(type==='ammo'?{amount:16,lifetime:30}:{}) });
        if(type==='ammo')G.stats.ammoGenerated=(G.stats.ammoGenerated||0)+16;
      }
      G.enemies.splice(i, 1);
    }

    // ---- enemiesLeft = living + queued ----
    G.enemiesLeft = countAlive(G) + queue.length;
  }

  function nudgePickup(G, x, y) {
    return nearestClear(G, x, y, 12);
  }

  function separation(G, e) {
    let sx = 0, sy = 0;
    for (let k = 0; k < G.enemies.length; k++) {
      const o = G.enemies[k];
      if (o === e || o.dead) continue;
      const dx = e.x - o.x, dy = e.y - o.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < 28 * 28) {
        const d = Math.sqrt(d2);
        sx += (dx / d) * (28 - d);
        sy += (dy / d) * (28 - d);
      }
    }
    return { sx, sy };
  }

  function updateMover(G, e, dt, p) {
    const range = U.dist(e.x, e.y, p.x, p.y);
    const los = lineOfSight(e.x, e.y, p.x, p.y);
    const tooClose = range < e.rangeMin;
    const inRange = range <= e.rangeMax && range >= e.rangeMin;
    const bearing = U.angTo(e.x, e.y, p.x, p.y);

    // detour timer
    if (e.detourT > 0) e.detourT -= dt;

    const shouldAdvance = (range > e.rangeMax) || tooClose || !los;

    if (shouldAdvance) {
      // unstick tracking
      e.moveTrackT += dt;
      const movedThisFrame = U.dist(e.x, e.y, e.lastX, e.lastY);
      e.movedAcc += movedThisFrame;
      e.lastX = e.x; e.lastY = e.y;
      if (e.moveTrackT >= 0.8) {
        const expected = e.speed * e.moveTrackT * 0.4; // 40% of ideal => "far below"
        if (e.movedAcc < expected && e.detourT <= 0) {
          e.detourT = 0.6;
          e.detourSign = U.random() < 0.5 ? -1 : 1;
        }
        e.moveTrackT = 0;
        e.movedAcc = 0;
      }

      let heading = tooClose ? bearing + Math.PI : bearing;
      if (e.detourT > 0 && !tooClose) {
        heading = bearing + e.detourSign * (Math.PI / 2);
      }
      // Route around cover using the validated walk grid when direct sight is blocked.
      if (!los && !tooClose) heading = routeHeading(G, e, p);
      // base movement toward heading
      let dx = Math.cos(heading) * e.speed * dt;
      let dy = Math.sin(heading) * e.speed * dt;
      // strafe wobble (perpendicular)
      const wob = los ? Math.sin(G.time * e.phase) * 0.45 : 0;
      dx += Math.cos(heading + Math.PI / 2) * e.speed * dt * wob;
      dy += Math.sin(heading + Math.PI / 2) * e.speed * dt * wob;
      // separation
      const sep = separation(G, e);
      dx += sep.sx * dt * 4;
      dy += sep.sy * dt * 4;

      moveCircle(e, dx, dy);
      // ease angle toward where we're moving / bearing
      e.angle = angLerp(e.angle, bearing, 0.15);
    } else {
      // in range + LOS: hold, aim, fire
      // still apply gentle separation so they don't stack
      const sep = separation(G, e);
      if (sep.sx !== 0 || sep.sy !== 0) moveCircle(e, sep.sx * dt * 4, sep.sy * dt * 4);
      e.lastX = e.x; e.lastY = e.y;

      e.angle = angLerp(e.angle, bearing, 0.22);
      e.fireCd -= dt;
      if (inRange && los && e.fireCd <= 0) {
        const mx = e.x + Math.cos(e.angle) * 16;
        const my = e.y + Math.sin(e.angle) * 16;
        const a = e.angle + U.rand(-e.spread, e.spread);
        fireBullet(mx, my, a, e.bSpeed, e.dmg, false);
        G.audio.play('eshot');
        G.fx.muzzle(mx, my, e.angle, 0.7);
        e.fireCd = U.rand(e.fireLo, e.fireHi);
      }
    }
  }

  function updateNest(G, e, dt, p) {
    const range = U.dist(e.x, e.y, p.x, p.y);
    const los = lineOfSight(e.x, e.y, p.x, p.y);
    const bearing = U.angTo(e.x, e.y, p.x, p.y);

    // traverse barrel toward player, max 1.6 rad/s
    const maxStep = 1.6 * dt;
    let diff = angDiff(e.angle, bearing);
    if (Math.abs(diff) <= maxStep) e.angle = bearing;
    else e.angle += Math.sign(diff) * maxStep;

    const aligned = Math.abs(angDiff(e.angle, bearing)) <= 0.25;

    if (e.burstLeft > 0) {
      // mid-burst
      e.burstGap -= dt;
      if (e.burstGap <= 0) {
        // fire one round (only if still valid line — keep blasting once burst started but require LOS)
        if (los) {
          const mx = e.x + Math.cos(e.angle) * 24;
          const my = e.y + Math.sin(e.angle) * 24;
          const a = e.angle + U.rand(-e.spread, e.spread);
          fireBullet(mx, my, a, e.bSpeed, e.dmg, false);
          G.audio.play('eshot');
          G.fx.muzzle(mx, my, e.angle, 0.7);
        }
        e.burstLeft--;
        e.burstGap = e.burstGapSetting || 0.12;
        if (e.burstLeft <= 0) e.cooldown = U.rand(1.5, 1.7);
      }
    } else {
      e.cooldown -= dt;
      if (e.cooldown <= 0 && range <= e.rangeMax && aligned && los) {
        e.burstLeft = 6;
        e.burstGap = 0;
      } else if (e.cooldown <= 0) {
        e.cooldown = 0; // hold ready, re-check next frame
      }
    }
  }

  // D3: sniper AI — stationary long-range marksman with a telegraphed laser sight.
  // The 1.4s telegraph is the counterplay: break LOS or close the distance before
  // it fires. Directly addresses G2 (kiting) — a kiting player is the perfect
  // stationary target for a sniper.
  function updateSniper(G, e, dt, p) {
    const range = U.dist(e.x, e.y, p.x, p.y);
    const los = lineOfSight(e.x, e.y, p.x, p.y);
    const bearing = U.angTo(e.x, e.y, p.x, p.y);

    // traverse slowly — 0.8 rad/s (slower than nest's 1.6) so flanking pays off
    const maxStep = 0.8 * dt;
    let diff = angDiff(e.angle, bearing);
    if (Math.abs(diff) <= maxStep) e.angle = bearing;
    else e.angle += Math.sign(diff) * maxStep;

    if (e.telegraphT > 0) {
      // currently painting the target
      if (!los || range > e.rangeMax) {
        // target broke LOS or fled — cancel, brief cooldown before re-acquire
        e.telegraphT = 0;
        e.cooldown = 0.8;
      } else {
        e.telegraphT -= dt;
        // laser tracks the player's current position (last known at fire time)
        e.laserX = p.x;
        e.laserY = p.y;
        if (e.telegraphT <= 0) {
          // fire
          e.telegraphT = 0;
          const mx = e.x + Math.cos(e.angle) * 18;
          const my = e.y + Math.sin(e.angle) * 18;
          const a = e.angle + U.rand(-e.spread, e.spread);
          fireBullet(mx, my, a, e.bSpeed, e.dmg, false);
          G.audio.play('esnipe');
          G.fx.muzzle(mx, my, e.angle, 1.4);
          e.cooldown = U.rand(e.fireLo, e.fireHi);
        }
      }
    } else {
      // waiting for a clean shot
      e.cooldown -= dt;
      if (e.cooldown <= 0 && los && range <= e.rangeMax) {
        e.telegraphT = 1.4; // 1.4s telegraph — gives player time to react
        e.laserX = p.x;
        e.laserY = p.y;
      }
    }
  }

  // ---------- angle utils (local) ----------
  function angDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }
  function angLerp(a, b, t) {
    return a + angDiff(a, b) * t;
  }

  function previewNextWave(G) {
    const w = G.wave + 1; // next wave
    const comp = { rifleman: 0, officer: 0, sniper: 0, nest: 0 };
    comp.rifleman = Math.min(24, 5 + 2 * w);
    if (w >= 2) comp.officer = Math.min(4, Math.floor(w / 2));
    if (w >= 3) comp.sniper = Math.min(3, Math.floor((w - 1) / 2));
    if (w >= 4) comp.nest = Math.min(3, Math.floor((w - 2) / 2));
    return comp;
  }

  return { init, reset, update, previewNextWave, makeEnemy, spawnOne, buildQueue };
})();
