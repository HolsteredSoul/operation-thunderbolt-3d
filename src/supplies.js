// === ui ===
OT.ui = (() => {
  'use strict';

  // ---- palette (per contract) ----
  const C_OLIVE = '#5b6432';
  const C_DUST = '#c9b88a';
  const C_OFFWHITE = '#e8e2d0';
  const C_RED = '#c94f3d';
  const C_PANEL = 'rgba(15,15,12,0.72)';

  // ---- font stacks ----
  const TITLE_FONT = '900 64px "Arial Black", Impact, "Franklin Gothic Bold", sans-serif';
  const STENCIL = (px) => `900 ${px}px "Arial Black", Impact, sans-serif`;
  const MONO = (px) => `bold ${px}px "Consolas", "Courier New", monospace`;
  const LABEL = (px) => `bold ${px}px "Arial", sans-serif`;

  // ---- private state ----
  let banner = { text: '', t: 0, dur: 0 };
  let floats = [];                 // {x,y,text,color,t,life}
  let flashColor = '#ffffff';
  let flashT = 0;
  const FLASH_DUR = 0.25;
  let hintT = 0;

  // ---- pickup tuning ----
  const PICKUP_LIFE = 14;
  const MAGNET_RANGE = 90;
  const MAGNET_SPEED = 140;
  const BLINK_WINDOW = 3;          // last N seconds before expiry

  // ---- vignette gradient (lazily built once; depends on screen size) ----
  let vignette = null, vignW = 0, vignH = 0;

  function buildVignette(ctx, w, h) {
    if (vignette && vignW === w && vignH === h) return vignette;
    const cx = w / 2, cy = h / 2;
    const inner = Math.min(w, h) * 0.35;
    const outer = Math.max(w, h) * 0.72;
    const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    g.addColorStop(0, 'rgba(160,20,16,0)');
    g.addColorStop(0.6, 'rgba(160,20,16,0.10)');
    g.addColorStop(1, 'rgba(160,20,16,0.78)');
    vignette = g; vignW = w; vignH = h;
    return vignette;
  }

  // ---------------------------------------------------------------
  function init(G) {
    banner = { text: '', t: 0, dur: 0 };
    floats = [];
    flashColor = '#ffffff';
    flashT = 0;
    hintT = 0;
    G.ui = OT.ui;
  }

  function reset(G) {
    banner = { text: '', t: 0, dur: 0 };
    floats = [];
    flashT = 0;
    hintT = 8;
  }

  // ---- public API ----
  function bannerFn(text, secs = 2.2) {
    banner = { text: String(text), t: 0, dur: secs };
  }

  function floatFn(x, y, text, color = C_OFFWHITE) {
    floats.push({ x, y, text: String(text), color, t: 0, life: 0.9 });
  }

  function flashFn(cssColor) {
    flashColor = cssColor || '#ffffff';
    flashT = FLASH_DUR;
  }

  // ---- D1: upgrade application (cap-enforced, called from pickup collection) ----
  // 4 stacks per type. Each type uses a fixed per-stack amount; the cap is
  // enforced by the stack counter so caps live in one place (here, not player.js).
  const MAX_STACKS = 4;
  const PER_STACK = { dmg: 6, fireRate: 0.025, mag: 2, maxHp: 20 };
  const MIN_FIRE_CD = 0.06;
  const UP_COLORS = { dmg: '#ff6b3a', fireRate: '#ffd23a', mag: '#5ab8ff', maxHp: '#5aff8a' };
  const UP_LABELS = { dmg: 'DMG', fireRate: 'RoF', mag: 'MAG', maxHp: 'HP' };

  function applyUpgrade(G, p, type) {
    const u = p.upgrades;
    if (u[type] >= MAX_STACKS) {
      // already maxed — convert to a score bonus so the pickup isn't wasted
      G.score += 200;
      floatFn(p.x, p.y - 24, '+200 BONUS', '#ffd76a');
      return;
    }
    if (type === 'dmg') {
      p.dmg += PER_STACK.dmg;
    } else if (type === 'fireRate') {
      p.fireCdBase = Math.max(MIN_FIRE_CD, p.fireCdBase - PER_STACK.fireRate);
    } else if (type === 'mag') {
      p.magSize += PER_STACK.mag;
    } else if (type === 'maxHp') {
      p.maxHp += PER_STACK.maxHp;
      p.hp = Math.min(p.maxHp, p.hp + PER_STACK.maxHp);
    }
    u[type]++;
  }

  // ---------------------------------------------------------------
  function update(G, dt) {
    // ---- timers ----
    if (banner.dur > 0) {
      banner.t += dt;
      if (banner.t >= banner.dur) banner = { text: '', t: 0, dur: 0 };
    }
    if (flashT > 0) flashT -= dt;
    if (hintT > 0) hintT -= dt;

    // ---- floats ----
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 26 * dt; // rise
      if (f.t >= f.life) floats.splice(i, 1);
    }

    // ---- pickups ----
    const p = G.player;
    const list = G.pickups;
    for (let i = list.length - 1; i >= 0; i--) {
      const pk = list[i];
      pk.t += dt;
      if (pk.t >= PICKUP_LIFE) { list.splice(i, 1); continue; }
      if (!p) continue;

      const d = U.dist(pk.x, pk.y, p.x, p.y);

      // collection
      if (d < p.r + 12 && lineOfSight(pk.x, pk.y, p.x, p.y)) {
        if (pk.isUpgrade) {
          // D1: permanent stat upgrade — the only in-run progression axis
          applyUpgrade(G, p, pk.type);
          floatFn(pk.x, pk.y, '+1 ' + UP_LABELS[pk.type], UP_COLORS[pk.type]);
          G.audio.play('upgrade');
        } else if (pk.type === 'health') {
          if (p.hp >= p.maxHp) {
            p.reserve = Math.min(p.maxReserve, p.reserve + 8);
            floatFn(pk.x, pk.y, '+8 AMMO', '#ffd76a');
          } else {
            p.hp = Math.min(p.maxHp, p.hp + 35);
            floatFn(pk.x, pk.y, '+35 HP', '#7ee07e');
          }
          G.audio.play('pickup');
        } else { // ammo
          p.reserve = Math.min(p.maxReserve, p.reserve + 16);
          floatFn(pk.x, pk.y, '+16 AMMO', '#ffd76a');
          G.audio.play('pickup');
        }
        list.splice(i, 1);
        continue;
      }

      // gentle magnet (blocked by walls)
      if (d < MAGNET_RANGE && d > 0.001 && lineOfSight(pk.x, pk.y, p.x, p.y)) {
        const ang = U.angTo(pk.x, pk.y, p.x, p.y);
        pk.x += Math.cos(ang) * MAGNET_SPEED * dt;
        pk.y += Math.sin(ang) * MAGNET_SPEED * dt;
      }
    }
  }

  // ---------------------------------------------------------------
  return { init, reset, update, banner: bannerFn, float: floatFn, flash: flashFn, applyUpgrade, getVisuals: () => ({banner, floats, flashT, hintT}) };
})();

