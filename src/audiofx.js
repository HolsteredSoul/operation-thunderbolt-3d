// ===== audiofx module: G.fx (particles) + G.audio (procedural SFX) =====
OT.audiofx = (() => {
  'use strict';

  // ---------- particle store ----------
  const MAX = 450;
  let parts = [];

  function spawn(p) {
    if (parts.length >= MAX) parts.shift(); // drop oldest
    parts.push(p);
  }

  // generic particle factory with sane defaults
  function mk(x, y, vx, vy, life, size, color, opts) {
    opts = opts || {};
    return {
      x, y, vx, vy,
      life, maxLife: life,
      size, color,
      grav: opts.grav || 0,
      drag: opts.drag == null ? 0 : opts.drag,
      mode: opts.mode || 'normal',
      shape: opts.shape || 'dot',
      rot: opts.rot || 0,
      vrot: opts.vrot || 0,
      grow: opts.grow || 0,        // size growth/sec (smoke rings)
      grounded: false
    };
  }

  // ---------- fx API ----------
  function burst(x, y, o) {
    o = o || {};
    const n = o.n == null ? 8 : o.n;
    const color = o.color || '#c9b88a';
    const spd = o.spd == null ? 120 : o.spd;
    const life = o.life == null ? 0.5 : o.life;
    const size = o.size == null ? 3 : o.size;
    const grav = o.grav || 0;
    for (let i = 0; i < n; i++) {
      const a = V.rand(0, TAU);
      const s = spd * V.rand(0.4, 1.0);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        life * V.rand(0.7, 1.1), size * V.rand(0.7, 1.2), color,
        { grav, drag: 1.6 }));
    }
  }

  function impact(x, y) {
    // grey/tan dust puff
    const dustN = V.randi(5, 6);
    for (let i = 0; i < dustN; i++) {
      const a = V.rand(0, TAU);
      const s = V.rand(20, 70);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        V.rand(0.25, 0.45), V.rand(2, 4),
        V.pick(['#9a917f', '#b3a98f', '#7d756a']),
        { grav: 30, drag: 2.5, shape: 'smoke', grow: 6 }));
    }
    // brief additive sparks
    const sparkN = V.randi(1, 2);
    for (let i = 0; i < sparkN; i++) {
      const a = V.rand(0, TAU);
      const s = V.rand(80, 160);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        V.rand(0.06, 0.12), V.rand(1.5, 2.5), '#ffd98a',
        { drag: 3, mode: 'add' }));
    }
  }

  function blood(x, y) {
    const n = V.randi(5, 7);
    for (let i = 0; i < n; i++) {
      const a = V.rand(0, TAU);
      const s = V.rand(30, 90);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        V.rand(0.2, 0.4), V.rand(1.5, 3), '#7a2a22',
        { grav: 140, drag: 2 }));
    }
  }

  function muzzle(x, y, ang, scale) {
    scale = scale == null ? 1 : scale;
    // additive flash along ang
    const flN = V.randi(1, 2);
    for (let i = 0; i < flN; i++) {
      const d = V.rand(6, 16) * scale;
      const fx = x + Math.cos(ang) * d;
      const fy = y + Math.sin(ang) * d;
      const s = V.rand(80, 120) * scale * 0.5;
      spawn(mk(fx, fy, Math.cos(ang) * s, Math.sin(ang) * s,
        V.rand(0.04, 0.08), V.rand(5, 8) * scale, '#fff0b8',
        { mode: 'add', drag: 6 }));
    }
    // small drifting smoke puff
    spawn(mk(x + Math.cos(ang) * 10 * scale, y + Math.sin(ang) * 10 * scale,
      Math.cos(ang) * 20, Math.sin(ang) * 20 - 8,
      V.rand(0.4, 0.7), V.rand(3, 5) * scale, '#8a857c',
      { drag: 2, shape: 'smoke', grow: 14, grav: -6 }));
    // brass shell casing ejected perpendicular
    const perp = ang + (V.rand(0, 1) < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const cs = V.rand(60, 110);
    spawn(mk(x, y, Math.cos(perp) * cs, Math.sin(perp) * cs - 30,
      0.8, V.rand(2, 3), '#b9892f',
      { grav: 320, drag: 1.2, shape: 'casing', rot: V.rand(0, TAU), vrot: V.rand(-12, 12) }));
  }

  function explode(x, y) {
    addShake(8);
    // big orange/yellow additive burst
    for (let i = 0; i < 22; i++) {
      const a = V.rand(0, TAU);
      const s = V.rand(120, 320);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        V.rand(0.18, 0.4), V.rand(3, 7),
        V.pick(['#ffd24a', '#ff8a2a', '#ffae3a']),
        { mode: 'add', drag: 2.5 }));
    }
    // expanding grey smoke ring
    spawn(mk(x, y, 0, 0, 0.7, 8, '#6e6a63',
      { shape: 'smoke', grow: 90, drag: 0 }));
    // lingering smoke puffs
    for (let i = 0; i < 8; i++) {
      const a = V.rand(0, TAU);
      const s = V.rand(20, 70);
      spawn(mk(x, y, Math.cos(a) * s, Math.sin(a) * s,
        V.rand(0.6, 1.1), V.rand(5, 9),
        V.pick(['#7a766e', '#5c5852', '#8c887f']),
        { shape: 'smoke', grow: 24, drag: 1.5, grav: -8 }));
    }
  }

  function fxUpdate(G, dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      // drag
      if (p.drag) {
        const f = 1 - Math.min(1, p.drag * dt);
        p.vx *= f; p.vy *= f;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vrot) p.rot += p.vrot * dt;
      if (p.grow) p.size += p.grow * dt;
      // casings settle on "ground" (no real floor — just kill vel quickly)
      if (p.shape === 'casing' && !p.grounded && p.life < 0.25) {
        p.grounded = true; p.vx *= 0.2; p.vy = 0; p.grav = 0; p.vrot *= 0.3;
      }
    }
  }

  function fxDraw(G, ctx) {
    if (!parts.length) return;
    const cam = G.camera;
    const vw = G.W / (G.zoom || 1), vh = G.H / (G.zoom || 1);
    const cullL = cam.x - 40, cullT = cam.y - 40;
    const cullR = cam.x + vw + 40, cullB = cam.y + vh + 40;
    ctx.save();
    // pass 1: normal mode
    let i, p;
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      if (p.mode === 'add') continue;
      if (p.x < cullL || p.x > cullR || p.y < cullT || p.y > cullB) continue;
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a < 0 ? 0 : (a > 1 ? 1 : a);
      ctx.fillStyle = p.color;
      if (p.shape === 'casing') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        ctx.restore();
      } else if (p.shape === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }
    // pass 2: additive mode (sparks/flashes)
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      if (p.mode !== 'add') continue;
      if (p.x < cullL || p.x > cullR || p.y < cullT || p.y > cullB) continue;
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a < 0 ? 0 : (a > 1 ? 1 : a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore(); // restores alpha + composite op
  }

  function fxReset() { parts.length = 0; }

  // ---------- audio ----------
  let actx = null, master = null, noiseBuf = null;
  let muted = false, masterVol = 0.5;
  const lastPlay = {}; // per-name throttle timestamps

  function unlock() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        master = actx.createGain();
        master.gain.value = muted ? 0 : masterVol;
        master.connect(actx.destination);
        // shared 1s noise buffer
        const len = Math.floor(actx.sampleRate);
        noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = V.random() * 2 - 1;
      }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }

  // helpers (all guard on actx)
  function noiseSrc() {
    const s = actx.createBufferSource();
    s.buffer = noiseBuf;
    return s;
  }
  function env(gain, t0, peak, dur, attack) {
    attack = attack || 0.005;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  const RECIPES = {
    shot(t) {
      // noise burst HP ~700
      const n = noiseSrc();
      const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
      const g = actx.createGain();
      n.connect(hp); hp.connect(g); g.connect(master);
      env(g, t, 0.28, 0.1); n.start(t); n.stop(t + 0.12);
      // low sine thump
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150 + V.rand(-8, 8), t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.09);
      const og = actx.createGain();
      o.connect(og); og.connect(master);
      env(og, t, 0.25, 0.09); o.start(t); o.stop(t + 0.1);
    },
    eshot(t) {
      const n = noiseSrc();
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 600 * V.rand(0.85, 1.15); bp.Q.value = 1.2;
      const g = actx.createGain();
      n.connect(bp); bp.connect(g); g.connect(master);
      env(g, t, 0.16, 0.09); n.start(t); n.stop(t + 0.1);
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(130 * V.rand(0.9, 1.1), t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.08);
      const og = actx.createGain();
      o.connect(og); og.connect(master);
      env(og, t, 0.12, 0.08); o.start(t); o.stop(t + 0.09);
    },
    ehit(t) {
      const n = noiseSrc();
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const g = actx.createGain();
      n.connect(lp); lp.connect(g); g.connect(master);
      env(g, t, 0.2, 0.06); n.start(t); n.stop(t + 0.07);
    },
    ekill(t) {
      // low body-thud + dull pop for a confirmed kill
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      const og = actx.createGain();
      o.connect(og); og.connect(master);
      env(og, t, 0.22, 0.22); o.start(t); o.stop(t + 0.24);
      const n = noiseSrc();
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      const ng = actx.createGain();
      n.connect(lp); lp.connect(ng); ng.connect(master);
      env(ng, t, 0.14, 0.09); n.start(t); n.stop(t + 0.1);
    },
    esnipe(t) {
      // sharp high crack for the sniper shot — distinct from eshot
      const n = noiseSrc();
      const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
      const g = actx.createGain();
      n.connect(hp); hp.connect(g); g.connect(master);
      env(g, t, 0.22, 0.08); n.start(t); n.stop(t + 0.09);
      const o = actx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      const og = actx.createGain();
      o.connect(og); og.connect(master);
      env(og, t, 0.18, 0.13); o.start(t); o.stop(t + 0.14);
    },
    playerHurt(t) {
      const o = actx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.15);
      const g = actx.createGain();
      o.connect(g); g.connect(master);
      env(g, t, 0.22, 0.15); o.start(t); o.stop(t + 0.16);
      const n = noiseSrc();
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const ng = actx.createGain();
      n.connect(lp); lp.connect(ng); ng.connect(master);
      env(ng, t, 0.08, 0.1); n.start(t); n.stop(t + 0.11);
    },
    reload(t) {
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.28;
        const n = noiseSrc();
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass';
        bp.frequency.value = 2200 + i * 300; bp.Q.value = 3;
        const g = actx.createGain();
        n.connect(bp); bp.connect(g); g.connect(master);
        env(g, tt, 0.18, 0.03, 0.002); n.start(tt); n.stop(tt + 0.04);
      }
    },
    empty(t) {
      const n = noiseSrc();
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 1800; bp.Q.value = 4;
      const g = actx.createGain();
      n.connect(bp); bp.connect(g); g.connect(master);
      env(g, t, 0.12, 0.02, 0.002); n.start(t); n.stop(t + 0.03);
    },
    pickup(t) {
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(660, t);
      o.frequency.setValueAtTime(880, t + 0.09);
      const g = actx.createGain();
      o.connect(g); g.connect(master);
      env(g, t, 0.22, 0.18); o.start(t); o.stop(t + 0.19);
    },
    upgrade(t) {
      // D1: rising triadic chime — makes upgrade collection feel rewarding,
      // distinct from the flat pickup blip
      const o = actx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(440, t);
      o.frequency.setValueAtTime(660, t + 0.08);
      o.frequency.setValueAtTime(880, t + 0.16);
      const g = actx.createGain();
      o.connect(g); g.connect(master);
      env(g, t, 0.26, 0.35, 0.01); o.start(t); o.stop(t + 0.36);
    },
    wave(t) {
      // low drum hit
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      const dg = actx.createGain();
      o.connect(dg); dg.connect(master);
      env(dg, t, 0.28, 0.2); o.start(t); o.stop(t + 0.21);
      // brassy rising fourth (saw through lowpass)
      const s = actx.createOscillator(); s.type = 'sawtooth';
      s.frequency.setValueAtTime(196, t + 0.05);
      s.frequency.exponentialRampToValueAtTime(262, t + 0.45);
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      const sg = actx.createGain();
      s.connect(lp); lp.connect(sg); sg.connect(master);
      env(sg, t + 0.05, 0.2, 0.45); s.start(t + 0.05); s.stop(t + 0.5);
    },
    explode(t) {
      const n = noiseSrc();
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
      const g = actx.createGain();
      n.connect(lp); lp.connect(g); g.connect(master);
      env(g, t, 0.3, 0.5); n.start(t); n.stop(t + 0.52);
      const o = actx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(80, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      const og = actx.createGain();
      o.connect(og); og.connect(master);
      env(og, t, 0.28, 0.5); o.start(t); o.stop(t + 0.52);
    },
    die(t) {
      const o = actx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.9);
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      const g = actx.createGain();
      o.connect(lp); lp.connect(g); g.connect(master);
      env(g, t, 0.26, 0.9, 0.02); o.start(t); o.stop(t + 0.92);
      const n = noiseSrc();
      const np = actx.createBiquadFilter(); np.type = 'lowpass'; np.frequency.value = 600;
      const ng = actx.createGain();
      n.connect(np); np.connect(ng); ng.connect(master);
      env(ng, t, 0.1, 0.7); n.start(t); n.stop(t + 0.72);
    },
    click(t) {
      const n = noiseSrc();
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 2600; bp.Q.value = 5;
      const g = actx.createGain();
      n.connect(bp); bp.connect(g); g.connect(master);
      env(g, t, 0.1, 0.02, 0.002); n.start(t); n.stop(t + 0.03);
    }
  };

  const THROTTLE = { _default: 0.03, ehit: 0.05 };

  function play(name) {
    try {
      if (!actx || !master) return;
      const recipe = RECIPES[name];
      if (!recipe) return; // unknown name → ignore
      if (actx.state === 'suspended') actx.resume();
      const now = actx.currentTime;
      const min = THROTTLE[name] || THROTTLE._default;
      const last = lastPlay[name] || -1;
      if (now - last < min) return;
      lastPlay[name] = now;
      recipe(now);
    } catch (e) { /* never throw */ }
  }

  function toggleMute() {
    muted = !muted;
    try {
      if (master) {
        const now = actx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(muted ? 0 : masterVol, now);
      }
    } catch (e) { /* ignore */ }
    if (G_ref && G_ref.ui && typeof G_ref.ui.banner === 'function') {
      G_ref.ui.banner(muted ? 'SOUND OFF' : 'SOUND ON', 0.8);
    }
    return muted;
  }

  // ---------- module wiring ----------
  let G_ref = null;

  function init(G) {
    G_ref = G;
    G.fx = {
      burst, impact, blood, muzzle, explode,
      update: fxUpdate, draw: fxDraw, reset: fxReset
    };
    G.audio = { unlock, play, toggleMute };
  }

  function reset(G) {
    fxReset();
    for (const k in lastPlay) delete lastPlay[k];
  }

  function update(G, dt) { fxUpdate(G, dt); }
  function draw(G, ctx) { fxDraw(G, ctx); }

  return { init, reset, update, draw };
})();
