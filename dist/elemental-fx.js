/* Elemental spell bursts and hit feedback layered on top of #fx-layer.
   Self-contained: one shared canvas, pooled particles, no dependencies.
   The app calls window.ArtifactElementalFX(events, layer, game) from the
   same seam as ArtifactExpansionFX, so every battle page gets this for free. */
(function (root) {
'use strict';
const ELEMENTS = ['fire', 'lightning', 'wind', 'ice', 'shadow', 'arcane'];

/* Card -> element resolution. Priority: element keywords found in the
   card's Chinese name / English name / key, then the explicit `fx` tag
   (campaign cards), then the card color, then neutral arcane.
   Element groups are scanned in the listed order, so a name like
   雷霆风暴 resolves to lightning rather than wind. */
const CJK = [
  ['lightning', ['雷', '霆', '闪电', '电']],
  ['ice', ['霜', '冰', '寒', '冻', '雪']],
  ['fire', ['火焰', '焰', '燃', '火', '灼', '焚', '炎', '爆']],
  ['shadow', ['影', '月', '暗', '夜', '梦', '冥', '血']],
  ['wind', ['风', '森', '藤', '叶', '春', '毒', '花', '自然']],
];
const LATIN = [
  ['lightning', /\b(thunder|lightning|bolt|storm|shock|static)/],
  ['ice', /\b(frost|ice|chill|winter|snow|freez\w*|crystal)/],
  ['fire', /\b(fire|flame|burn\w*|ignit\w*|ember|scorch|pyre|blast)/],
  ['shadow', /\b(shadow|moon|luna|dark|night|dream|eclipse|shade|veil|blood)/],
  ['wind', /\b(wind|gust|venom|poison|vine|leaf|bloom|thorn|rose|wild|nature|spring|swarm)/],
];
const FX_FALLBACK = { strike: 'arcane', healing: 'wind', blessing: 'shadow', summon: 'arcane', movement: 'wind', binding: 'ice', equip: 'arcane' };
const COLOR_FALLBACK = { Red: 'fire', Green: 'wind', Blue: 'arcane', Black: 'shadow' };

function resolveFx(card) {
  if (!card) return 'arcane';
  const name = String(card.name || ''), latin = (String(card.en || '') + ' ' + String(card.key || '')).toLowerCase();
  for (let i = 0; i < CJK.length; i++)
    if (CJK[i][1].some(w => name.includes(w)) || LATIN[i][1].test(latin)) return CJK[i][0];
  return FX_FALLBACK[card.fx] || COLOR_FALLBACK[card.color] || 'arcane';
}

/* Everything below is DOM/canvas presentation and never runs under Node. */
let canvas = null, ctx = null, parts = [], raf = 0, last = 0;
const CAP = 240;
const reduced = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);

const PALETTES = {
  fire: { colors: ['#ffd27a', '#ff9a3c', '#ff5d2e', '#e83c1a'], glow: '#ff8b3d' },
  lightning: { colors: ['#ffffff', '#dff2ff', '#a9e4ff', '#62c4ff'], glow: '#8fd8ff' },
  wind: { colors: ['#eaffdc', '#c9f2a4', '#9fe08a', '#63c56b'], glow: '#93e08a' },
  ice: { colors: ['#ffffff', '#e8fbff', '#bdefff', '#8fd4ff'], glow: '#a8e8ff' },
  shadow: { colors: ['#f2ecff', '#e0ccff', '#c9a3f7', '#9a6ce0'], glow: '#b48cf0' },
  arcane: { colors: ['#fff6d8', '#ffe9a8', '#f0c96a', '#7ad8c9'], glow: '#f3d078' },
};

/* The fx-layer survives re-renders (it is re-parented to <body>), so a single
   canvas inside it also survives. If the layer is ever recreated, re-attach. */
function surface(layer) {
  if (!layer) return null;
  if (!canvas || canvas.parentElement !== layer || !canvas.isConnected) {
    canvas = layer.querySelector('canvas.el-fx-canvas');
    if (!canvas) {
      canvas = root.document.createElement('canvas');
      canvas.className = 'el-fx-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      layer.appendChild(canvas);
    }
  }
  const dpr = Math.min(root.devicePixelRatio || 1, 1.5);
  const w = root.innerWidth, h = root.innerHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  }
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

function spawn(p) {
  if (parts.length >= CAP) parts.splice(0, parts.length - CAP + 1);
  parts.push(p);
  if (!raf) { last = performance.now(); raf = root.requestAnimationFrame(tick); }
}

function flash(x, y, element, scale = 1) {
  spawn({ kind: 'ring', x, y, age: 0, life: 420, size: 14 * scale, color: PALETTES[element].glow });
}

/* One compact burst at a point; `count` scales the spawn volume. */
function burst(x, y, element, count = 14, scale = 1) {
  if (!ELEMENTS.includes(element)) element = 'arcane';
  flash(x, y, element, scale);
  if (reduced()) return;
  const pal = PALETTES[element];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, d = rand(0, 10 * scale);
    const base = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, age: 0, rot: rand(0, Math.PI * 2), spin: rand(-4, 4), color: pick(pal.colors) };
    if (element === 'fire') spawn({ ...base, kind: 'ember', vx: Math.cos(a) * rand(20, 70), vy: rand(-95, -25), life: rand(420, 780), size: rand(1.4, 3.1) * scale });
    else if (element === 'wind') spawn({ ...base, kind: 'streak', vx: Math.cos(a) * rand(60, 150) + rand(-30, 30), vy: Math.sin(a) * rand(30, 70) - rand(10, 60), life: rand(360, 620), size: rand(7, 15) * scale });
    else if (element === 'ice') spawn({ ...base, kind: 'shard', vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(30, 70) - 30, g: 160, life: rand(450, 850), size: rand(3, 6.5) * scale });
    else if (element === 'shadow') spawn({ ...base, kind: 'wisp', vx: Math.cos(a) * rand(12, 45), vy: rand(-55, -12), life: rand(550, 900), size: rand(4, 9) * scale });
    else if (element === 'lightning') spawn({ ...base, kind: 'spark', vx: Math.cos(a) * rand(80, 220), vy: Math.sin(a) * rand(80, 220), life: rand(180, 380), size: rand(1, 2.2) * scale });
    else spawn({ ...base, kind: 'mote', vx: Math.cos(a) * rand(45, 110), vy: Math.sin(a) * rand(45, 110), life: rand(400, 700), size: rand(1.5, 3) * scale });
  }
  if (element === 'lightning') {
    for (let i = 0; i < 3; i++) {
      const dir0 = rand(0, Math.PI * 2), len = rand(28, 58) * scale, pts = [{ x: 0, y: 0 }];
      let px = 0, py = 0, dir = dir0;
      for (let s = 0; s < 4; s++) { dir += rand(-0.9, 0.9); px += Math.cos(dir) * len / 4; py += Math.sin(dir) * len / 4; pts.push({ x: px, y: py }); }
      spawn({ kind: 'bolt', x, y, pts, age: 0, life: rand(160, 260), color: '#eaf8ff', width: rand(1.4, 2.4) });
    }
  }
}

function draw(p) {
  const t = p.age / p.life, fade = 1 - t, c = ctx;
  if (p.kind === 'ring') {
    const r = p.size * (0.5 + t * 3.2);
    c.globalAlpha = fade * 0.85; c.strokeStyle = p.color; c.lineWidth = 3 * (1 - t) + 0.6;
    c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke();
  } else if (p.kind === 'bolt') {
    c.globalAlpha = fade; c.strokeStyle = p.color; c.lineWidth = p.width * fade + 0.4;
    c.shadowColor = '#9fdcff'; c.shadowBlur = 9;
    c.beginPath(); c.moveTo(p.x, p.y); for (const q of p.pts) c.lineTo(p.x + q.x, p.y + q.y); c.stroke(); c.shadowBlur = 0;
  } else if (p.kind === 'streak') {
    c.globalAlpha = fade * 0.9; c.strokeStyle = p.color; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.07, p.y - p.vy * 0.07); c.stroke();
  } else if (p.kind === 'shard') {
    c.globalAlpha = fade; c.fillStyle = p.color; c.save();
    c.translate(p.x, p.y); c.rotate(p.rot);
    c.beginPath(); c.moveTo(0, -p.size); c.lineTo(p.size * 0.55, p.size * 0.7); c.lineTo(-p.size * 0.55, p.size * 0.7); c.closePath(); c.fill(); c.restore();
  } else {
    const r = p.kind === 'wisp' ? p.size * (0.7 + t * 0.6) : p.size;
    c.globalAlpha = p.kind === 'wisp' ? fade * 0.55 : fade;
    c.fillStyle = p.color;
    c.beginPath(); c.arc(p.x, p.y, Math.max(0.4, r), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

function tick(now) {
  raf = 0;
  if (!canvas || !canvas.isConnected) { parts = []; return; }
  const dt = Math.min(50, now - last); last = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.age += dt;
    if (p.age >= p.life) { parts.splice(i, 1); continue; }
    if (p.vx !== undefined) {
      const s = dt / 1000;
      p.x += p.vx * s; p.y += p.vy * s;
      if (p.g) p.vy += p.g * s;
      if (p.kind === 'ember' || p.kind === 'wisp') p.x += Math.sin(p.age * 0.02 + p.rot) * 0.7;
      if (p.spin) p.rot += p.spin * s;
      if (p.kind === 'streak' || p.kind === 'spark') { p.vx *= 0.94; p.vy *= 0.94; }
    }
    draw(p);
  }
  if (parts.length) raf = root.requestAnimationFrame(tick);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* Mirror playEvents: the transient combat ghost (data-attacker) is the
   visible stand-in while the real unit is hidden mid-lunge. */
const byUnit = uid => root.document.querySelector(`[data-attacker="${uid}"]`) || root.document.querySelector(`[data-unit="${uid}"]`);
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
const usable = (el, ghost) => !!el && (ghost || !el.closest('[inert]'));

function hitFeedback(e, events, element) {
  const lethal = events.some(d => d.type === 'death' && d.unit === e.unit);
  /* Defer one frame: spell casts re-render the board right after events
     play, so the element must be re-queried on the settled DOM. */
  root.requestAnimationFrame(() => {
    const el = byUnit(e.unit);
    if (!usable(el, el && el.hasAttribute('data-attacker'))) return;
    const p = center(el);
    burst(p.x, p.y, element, lethal ? 20 : 9, lethal ? 1.5 : 0.8);
    if (reduced()) return;
    const cls = lethal ? 'el-hit-lethal' : 'el-hit';
    el.classList.remove('el-hit', 'el-hit-lethal');
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 750);
  });
}

function towerHit(e) {
  root.requestAnimationFrame(() => {
    const bar = root.document.querySelector(`.lane[data-lane="${e.lane}"] .tower-bar.${e.owner ? 'dire' : 'radiant'}`);
    if (!bar || bar.closest('[inert]')) return;
    if (!reduced()) { bar.classList.remove('el-thud'); void bar.offsetWidth; bar.classList.add('el-thud'); setTimeout(() => bar.classList.remove('el-thud'), 500); }
    const p = center(bar);
    burst(p.x, p.y, 'arcane', 6, 0.7);
  });
}

function castPoints(cast) {
  const seen = new Set(), pts = [];
  for (const t of [...(cast.targets || []), ...(cast.outcomes || [])]) {
    const key = t.uid || (t.kind === 'tower' ? `tower:${t.lane}:${t.owner}` : `lane:${t.lane}`);
    if (seen.has(key)) continue; seen.add(key);
    let el = null;
    if (t.uid) el = root.document.querySelector(`[data-unit="${t.uid}"]`) || root.document.querySelector(`.improvement[data-id="${t.uid}"]`);
    else if (t.kind === 'tower' && Number.isInteger(t.lane)) el = root.document.querySelector(`.lane[data-lane="${t.lane}"] .tower-bar.${t.owner ? 'dire' : 'radiant'}`);
    if (!el && Number.isInteger(t.lane)) el = root.document.querySelector(`.lane[data-lane="${t.lane}"] .lane-units`);
    if (!usable(el, false)) continue;
    pts.push(center(el));
  }
  if (!pts.length && Number.isInteger(cast.lane)) {
    const lane = root.document.querySelector(`.lane[data-lane="${cast.lane}"] .lane-units`);
    if (usable(lane, false)) pts.push(center(lane));
  }
  return pts;
}

function api(events, layer, game) {
  if (!events?.length || !layer || !root.document) return;
  if (!surface(layer)) return;
  try {
    const cast = events.find(e => (e.type === 'card' || e.type === 'ability') && game.card(e.card));
    const element = cast ? resolveFx(game.card(cast.card)) : null;
    if (cast && element) {
      const pts = castPoints(cast), per = Math.max(8, Math.min(16, Math.floor(150 / Math.max(1, pts.length))));
      for (const p of pts) burst(p.x, p.y, element, per, 1);
    }
    for (const e of events) {
      if (e.type === 'damage') {
        let el = element;
        if (!el && e.source) { const src = game.get(e.source); if (src) el = resolveFx(game.card(src.k)); }
        hitFeedback(e, events, el || 'arcane');
      } else if (e.type === 'tower') towerHit(e);
    }
  } catch (err) { root.console?.warn('elemental-fx', err); }
}

api.resolveFx = resolveFx;
api.burst = burst;
api.hit = hitFeedback;
api.ELEMENTS = ELEMENTS;
root.ArtifactElementalFX = api;
if (typeof module !== 'undefined') module.exports = { resolveFx };
})(typeof window === 'undefined' ? globalThis : window);
