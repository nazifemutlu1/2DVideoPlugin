// scenes/mars_env.js — layered 2.5D Mars set: sky, Phobos, far mesas, ridge, cliffs,
// dunes, cratered ground and parallax foreground. Every layer is deterministic.
import {
  E, V, clamp, lerp, rng, noise, alpha, shade, mix, seg, circle, ring, rr, poly,
  glow, linGrad, radGrad, backdrop, layer, blurLayer, veil,
} from '/engine/core.js';

export const MARS = {
  GY: 900,
  HY: 626,
  skyTop: '#05040d',
  skyMid: '#190f20',
  skyLow: '#4b2230',
  horizon: '#c07952',
  ground: '#6a342a',
  groundLo: '#2c1618',
  dust: '#e0a578',
  cool: '#8fc9d6',
  far: '#582a33',
  mid: '#48212a',
  near: '#381c24',
  rim: '#b56a4c',
};

export const project = (cam, depth, x, y) => {
  const z = 1 + ((cam.z ?? 1) - 1) * depth;
  return [E.W / 2 + z * (x - E.W / 2 - (cam.x || 0)), E.H / 2 + z * (y - E.H / 2 - (cam.y || 0))];
};
const zAt = (cam, depth) => 1 + ((cam.z ?? 1) - 1) * depth;

// ------------------------------------------------------------------ tiny helpers
function spark(g, x, y, s, col, a) {
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha(col, a); g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
  g.restore();
}

function starField(g, t, o) {
  const { seed = 11, count = 160, x = -300, y = -200, w = E.W + 600, h = 760, warm = '#ffe7cf', cool = '#bcd8ff', a = 0.7 } = o;
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const sx = x + r() * w, sy = y + r() * h, s = r();
    const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + s * 1.7) + i * 1.9);
    const col = s > 0.82 ? cool : warm;
    circle(g, sx, sy, 0.5 + s * 1.45, alpha(col, a * (0.22 + 0.78 * s * tw)));
    if (s > 0.955) {
      glow(g, sx, sy, 12 + s * 12, col, 0.22 * tw);
      spark(g, sx, sy, 4 + s * 4, col, 0.4 * tw);
    }
  }
}

function milkyWay(g, t) {
  g.save(); g.globalCompositeOperation = 'lighter';
  g.translate(-120, 260); g.rotate(0.24);
  g.fillStyle = linGrad(g, 0, 0, 1500, 0, [
    alpha('#5d4a86', 0), alpha('#6d5a94', 0.1), alpha('#9a7aa2', 0.14), alpha('#5d4a86', 0.06), alpha('#5d4a86', 0),
  ]);
  g.fillRect(-100, -280, 1700, 560);
  const r = rng(77);
  for (let i = 0; i < 240; i++) {
    const x = -80 + r() * 1750, y = (r() - 0.5) * 360 * (0.4 + 0.6 * Math.sin((x / 1750) * Math.PI));
    const s = r();
    circle(g, x, y, 0.45 + s * 1.05, alpha(s > 0.8 ? '#d9e6ff' : '#ffe9d2', 0.05 + s * 0.22));
  }
  g.restore();
}

function phobos(g, x, y, r) {
  g.save();
  glow(g, x, y, r * 4.2, '#a78f8e', 0.1);
  const pts = [
    [0.02, -1.05], [0.74, -0.82], [1.0, -0.16], [0.82, 0.58], [0.18, 0.95],
    [-0.52, 0.72], [-0.98, 0.08], [-0.68, -0.68],
  ].map(([a, b], i) => [x + a * r * (0.94 + (i % 3) * 0.035), y + b * r * (0.9 + (i % 2) * 0.08)]);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillStyle = radGrad(g, x - r * 0.35, y - r * 0.4, 0, r * 1.5, ['#c9b4a9', '#9a827d', '#554348']);
  g.fill();
  g.strokeStyle = alpha('#e0c8ba', 0.18); g.lineWidth = 1.2; g.stroke();
  // craters
  g.fillStyle = alpha('#2f2329', 0.42);
  for (const [cx, cy, cr] of [[-0.24, -0.12, 0.17], [0.26, 0.18, 0.12], [0.05, 0.42, 0.075], [-0.4, 0.38, 0.065]]) {
    g.beginPath(); g.ellipse(x + cx * r, y + cy * r, cr * r, cr * r * 0.78, 0.2, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = alpha('#f0d9c8', 0.1);
  g.beginPath(); g.ellipse(x - r * 0.32, y - r * 0.36, r * 0.4, r * 0.24, -0.4, 0, Math.PI * 2); g.fill();
  g.restore();
}

// ------------------------------------------------------------------ sky
function drawSky(g, t, HY) {
  g.fillStyle = linGrad(g, 0, -500, 0, HY + 260, [
    [0, MARS.skyTop], [0.38, MARS.skyMid], [0.7, '#311722'], [0.88, '#622c30'], [1, MARS.horizon],
  ]);
  g.fillRect(-E.W * 2, -E.H * 2, E.W * 5, E.H * 4.2);
  milkyWay(g, t);
  starField(g, t, { seed: 13, count: 190, y: -260, h: HY + 190, a: 0.8 });
  starField(g, t, { seed: 29, count: 70, y: -140, h: HY + 60, warm: '#fff2df', a: 0.9 });
  phobos(g, E.W * 0.77, HY - 360, 24);

  // the evening star
  const ex = E.W * 0.23, ey = HY - 430;
  glow(g, ex, ey, 44, '#dff3ff', 0.16);
  circle(g, ex, ey, 2.1, alpha('#eefcff', 0.95));
  spark(g, ex, ey, 11, '#dff3ff', 0.22);

  // dust-warmed horizon bloom and thin atmosphere bands
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, E.W * 0.58, HY + 16, 0, 720, [alpha('#e59a63', 0.24), alpha('#b7614e', 0.09), alpha('#b7614e', 0)]);
  g.fillRect(-E.W, HY - 700, E.W * 3, 1000);
  g.fillStyle = radGrad(g, E.W * 0.16, HY - 40, 0, 420, [alpha('#f0b07c', 0.17), alpha('#d08a62', 0)]);
  g.fillRect(-E.W, HY - 500, E.W * 2, 800);
  g.restore();

  // dust bands
  for (let i = 0; i < 5; i++) {
    const y = HY - 26 - i * 33, w = E.W * (1.05 + i * 0.18);
    g.fillStyle = linGrad(g, -E.W, y, E.W * 2, y + 42, [
      alpha('#e6a477', 0), alpha('#e6a477', 0.05 + i * 0.011), alpha('#a55a4a', 0.03), alpha('#a55a4a', 0),
    ]);
    g.beginPath(); g.ellipse(E.W * 0.46 + Math.sin(i * 2.1) * 380, y, w, 22 + i * 3, -0.012, 0, Math.PI * 2); g.fill();
  }

  // very thin veil over the limb of the sky
  g.fillStyle = linGrad(g, 0, HY - 190, 0, HY + 4, [alpha('#d69468', 0), alpha('#d69468', 0.14)]);
  g.fillRect(-E.W, HY - 190, E.W * 3, 200);
}

// ------------------------------------------------------------------ terrain
function mesa(g, cx, baseY, w, h, seed, fill, rim, opts = {}) {
  const r = rng(seed);
  const n = 9;
  const pts = [];
  pts.push([cx - w / 2, baseY + 8]);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = cx - w / 2 + w * k;
    const profile = k < 0.2 ? 0.55 + k * 2.25 : k > 0.78 ? 0.55 + (1 - k) * 2.05 : 1;
    const jag = (r() - 0.5) * h * 0.07;
    pts.push([x, baseY - h * clamp(profile) + jag]);
  }
  pts.push([cx + w / 2, baseY + 8]);
  pts.push([cx + w / 2 + 24, baseY + 10]);
  splineFill(g, pts, fill);
  // strata inside the silhouette
  g.save(); splinePath(g, pts); g.clip();
  for (let i = 1; i < 6; i++) {
    const y = baseY - h * (i / 6) + Math.sin(i * 3.1) * 4;
    g.strokeStyle = alpha(shade(rim, -0.35), 0.13); g.lineWidth = 1.2 + r() * 1.5;
    g.beginPath();
    for (let x = cx - w / 2; x <= cx + w / 2; x += 18) {
      const yy = y + noise(x * 0.007 + i, seed) * 7 + Math.sin(x * 0.012 + i) * 3;
      x === cx - w / 2 ? g.moveTo(x, yy) : g.lineTo(x, yy);
    }
    g.stroke();
  }
  // vertical erosion channels
  for (let i = 0; i < 7; i++) {
    const x = cx - w * 0.4 + r() * w * 0.8;
    g.strokeStyle = alpha(shade(fill, -0.4), 0.2); g.lineWidth = 1 + r() * 2.2;
    g.beginPath(); g.moveTo(x, baseY - h * 0.82); g.quadraticCurveTo(x + (r() - 0.5) * 14, baseY - h * 0.4, x + (r() - 0.5) * 22, baseY); g.stroke();
  }
  // lit top edge + face
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha(rim, opts.rimA ?? 0.4); g.lineWidth = 2.2;
  g.beginPath();
  for (let i = 2; i < n + 1; i++) i === 2 ? g.moveTo(pts[i][0], pts[i][1]) : g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
  g.strokeStyle = alpha(rim, 0.18); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(pts[2][0], pts[2][1]); g.lineTo(pts[1][0] - 12, baseY - h * 0.18); g.stroke();
  g.restore();
  // scree at the foot
  g.fillStyle = alpha(shade(fill, -0.28), 0.5);
  g.beginPath(); g.ellipse(cx + w * 0.08, baseY + 3, w * 0.54, 9, 0, 0, Math.PI * 2); g.fill();
}

function splinePath(g, pts) {
  const n = pts.length;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
  }
  g.lineTo(pts[n - 1][0], pts[n - 1][1]);
}
function splineFill(g, pts, fill) {
  splinePath(g, pts); g.closePath(); g.fillStyle = fill; g.fill();
}

function drawFarMesas(g, t, HY) {
  // atmospheric far band
  g.fillStyle = alpha('#7d4141', 0.38);
  g.fillRect(-E.W, HY - 10, E.W * 3, 16);
  mesa(g, 270, HY + 4, 760, 104, 31, mix(MARS.far, '#8a5251', 0.38), '#d09572', { rimA: 0.28 });
  mesa(g, 1120, HY + 6, 980, 142, 32, mix(MARS.far, '#7b4647', 0.28), '#cf8f6c', { rimA: 0.26 });
  mesa(g, 1800, HY + 5, 560, 88, 33, mix(MARS.far, '#8d5652', 0.4), '#d59a76', { rimA: 0.22 });
  // low far hills smoothing the joins
  g.fillStyle = alpha('#5b2c33', 0.7);
  g.beginPath(); g.moveTo(-E.W, HY + 8);
  for (let x = -E.W; x < E.W * 2; x += 30) g.lineTo(x, HY - 16 - (noise(x * 0.004, 9) * 0.5 + 0.5) * 38);
  g.lineTo(E.W * 2, HY + 20); g.closePath(); g.fill();
  // haze over their feet
  g.fillStyle = linGrad(g, 0, HY - 30, 0, HY + 30, [alpha('#d18a62', 0), alpha('#d18a62', 0.18), alpha('#d18a62', 0)]);
  g.fillRect(-E.W, HY - 30, E.W * 3, 64);
}

function drawRidge(g, t, HY) {
  g.fillStyle = MARS.mid;
  g.beginPath(); g.moveTo(-E.W, HY + 70);
  for (let x = -E.W; x < E.W * 2; x += 24) {
    const h = (noise(x * 0.0035, 4) * 0.5 + 0.5) * 58 + (noise(x * 0.011, 6) * 0.5 + 0.5) * 18;
    g.lineTo(x, HY + 18 - h);
  }
  g.lineTo(E.W * 2, HY + 90); g.closePath();
  g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha(MARS.rim, 0.24); g.lineWidth = 1.8;
  g.beginPath();
  for (let x = -E.W; x < E.W * 2; x += 24) {
    const y = HY + 18 - ((noise(x * 0.0035, 4) * 0.5 + 0.5) * 58 + (noise(x * 0.011, 6) * 0.5 + 0.5) * 18);
    x === -E.W ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke(); g.restore();
}

function drawCliffs(g, t, HY) {
  // dominant cliff left, with a clear vertical face and strata
  mesa(g, 240, HY + 128, 860, 250, 41, MARS.near, '#a96149', { rimA: 0.42 });
  // a second stepped butte behind it
  mesa(g, 610, HY + 118, 460, 196, 42, mix(MARS.near, '#4b2930', 0.3), '#99563f', { rimA: 0.3 });
  // the butte behind the robot / right side
  mesa(g, 1660, HY + 128, 540, 210, 43, mix(MARS.near, '#452229', 0.16), '#ad654a', { rimA: 0.36 });
  mesa(g, 1940, HY + 120, 420, 150, 44, mix(MARS.near, '#3e1f27', 0.1), '#9a5a44', { rimA: 0.24 });

  // dark canyon shadow at the base of the left cliff
  g.fillStyle = alpha('#1d1017', 0.45);
  g.beginPath(); g.moveTo(-E.W, HY + 120);
  g.quadraticCurveTo(180, HY + 62, 520, HY + 96);
  g.quadraticCurveTo(760, HY + 126, 1040, HY + 112);
  g.lineTo(1040, HY + 190); g.lineTo(-E.W, HY + 190); g.closePath(); g.fill();

  // one thin rock spire on the right for silhouette interest
  g.fillStyle = '#2d1a20';
  g.beginPath(); g.moveTo(1440, HY + 118); g.lineTo(1457, HY + 4); g.lineTo(1472, HY + 12); g.lineTo(1484, HY + 118); g.closePath(); g.fill();
  g.strokeStyle = alpha('#a8644a', 0.4); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(1457, HY + 12); g.lineTo(1466, HY + 118); g.stroke();

  // distant dust plume / devil to the right
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#d99a72', 0.13); g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(1720, HY + 120);
  g.bezierCurveTo(1690, HY + 60, 1755, HY + 10, 1730, HY - 60);
  g.stroke();
  g.strokeStyle = alpha('#e0a77d', 0.07); g.lineWidth = 22;
  g.beginPath(); g.moveTo(1720, HY + 120); g.bezierCurveTo(1680, HY + 40, 1760, HY - 10, 1735, HY - 80); g.stroke();
  g.restore();

  // haze settling over the cliff feet
  g.fillStyle = linGrad(g, 0, HY + 40, 0, HY + 150, [alpha('#cf8a63', 0.02), alpha('#cf8a63', 0.16), alpha('#cf8a63', 0)]);
  g.fillRect(-E.W, HY + 30, E.W * 3, 150);
}

function drawDunes(g, t, HY) {
  g.fillStyle = '#552822';
  g.beginPath(); g.moveTo(-E.W, HY + 220);
  for (let x = -E.W; x < E.W * 2; x += 26) {
    const y = HY + 150 - (noise(x * 0.0028, 12) * 0.5 + 0.5) * 62 - (noise(x * 0.008, 3) * 0.5 + 0.5) * 18;
    g.lineTo(x, y);
  }
  g.lineTo(E.W * 2, HY + 260); g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#c47b56', 0.22); g.lineWidth = 2;
  g.beginPath();
  for (let x = -E.W; x < E.W * 2; x += 26) {
    const y = HY + 150 - (noise(x * 0.0028, 12) * 0.5 + 0.5) * 62 - (noise(x * 0.008, 3) * 0.5 + 0.5) * 18;
    x === -E.W ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke(); g.restore();
  // second, closer dune ridge
  g.fillStyle = '#4b211d';
  g.beginPath(); g.moveTo(-E.W, HY + 300);
  for (let x = -E.W; x < E.W * 2; x += 30) {
    const y = HY + 226 - (noise(x * 0.0032, 21) * 0.5 + 0.5) * 48 + Math.sin(x * 0.004) * 14;
    g.lineTo(x, y);
  }
  g.lineTo(E.W * 2, HY + 360); g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#d08760', 0.16); g.lineWidth = 2.2;
  g.beginPath();
  for (let x = -E.W; x < E.W * 2; x += 30) {
    const y = HY + 226 - (noise(x * 0.0032, 21) * 0.5 + 0.5) * 48 + Math.sin(x * 0.004) * 14;
    x === -E.W ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke(); g.restore();
}

// ------------------------------------------------------------------ ground
function crater(g, x, y, rx, ry, o = {}) {
  const a = o.a ?? 1, seed = o.seed ?? 3, rot = o.rot ?? 0;
  const r = rng(seed);
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
  // broad ejecta
  g.fillStyle = alpha('#c98763', 0.07);
  g.beginPath(); g.ellipse(0, 0, rx * 1.55, ry * 1.7, 0, 0, Math.PI * 2); g.fill();
  // rim
  g.fillStyle = alpha('#8b4e3a', 0.8);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = alpha('#cf8d66', 0.5);
  g.beginPath(); g.ellipse(-rx * 0.07, -ry * 0.16, rx * 0.97, ry * 0.92, 0, 0, Math.PI * 2); g.fill();
  // bowl
  g.fillStyle = radGrad(g, -rx * 0.18, -ry * 0.22, ry * 0.1, rx * 1.1, [alpha('#49231f', 0.95), alpha('#371b19', 0.95), alpha('#6c3629', 0.6)]);
  g.beginPath(); g.ellipse(0, 0, rx * 0.78, ry * 0.7, 0, 0, Math.PI * 2); g.fill();
  // inner shadow / lit inner wall
  g.fillStyle = alpha('#251214', 0.55);
  g.beginPath(); g.ellipse(rx * 0.16, ry * 0.18, rx * 0.62, ry * 0.5, 0, 0, Math.PI * 2); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#dfa077', 0.35); g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, 0, rx * 0.87, ry * 0.82, 0, Math.PI * 1.02, Math.PI * 1.92); g.stroke();
  g.restore();
  // scattered ejecta
  for (let i = 0; i < 10; i++) {
    const ang = r() * Math.PI * 2, d = rx * (1.06 + r() * 0.55);
    const px = Math.cos(ang) * d, py = Math.sin(ang) * d * (ry / rx);
    circle(g, px, py, 0.8 + r() * 2.6, alpha('#3a1d1b', 0.55));
    circle(g, px - 0.5, py - 0.6, 0.5 + r() * 1.1, alpha('#d99a72', 0.25));
  }
  g.restore();
}

function rock(g, x, y, s, seed, tone = '#4f2925') {
  const r = rng(seed);
  const n = 7;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - 0.3;
    const rad = s * (0.62 + r() * 0.5);
    pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.52 - s * 0.22]);
  }
  g.save();
  g.fillStyle = alpha('#000000', 0.26);
  g.beginPath(); g.ellipse(x + s * 0.16, y + s * 0.18, s * 0.92, s * 0.24, 0, 0, Math.PI * 2); g.fill();
  splineFill(g, pts, linGrad(g, x - s, y - s, x + s, y + s * 0.4, [shade(tone, 0.2), tone, shade(tone, -0.4)]));
  g.strokeStyle = alpha('#1a0e10', 0.5); g.lineWidth = 1; g.stroke();
  // lit cap
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = alpha('#e2a176', 0.16);
  g.beginPath(); g.ellipse(x - s * 0.22, y - s * 0.46, s * 0.52, s * 0.15, -0.25, 0, Math.PI * 2); g.fill();
  g.restore();
  g.restore();
}

function drawGround(g, t, HY, GY) {
  g.fillStyle = linGrad(g, 0, HY + 6, 0, E.H + 160, [
    [0, '#8a4734'], [0.16, '#71392c'], [0.42, '#4f2823'], [0.72, '#381b1c'], [1, '#241113'],
  ]);
  g.fillRect(-E.W, HY + 2, E.W * 3, E.H * 2);
  // horizon line glow
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#e3a274', 0.25); g.lineWidth = 2;
  g.beginPath(); g.moveTo(-E.W, HY + 4);
  for (let x = -E.W; x < E.W * 2; x += 40) g.lineTo(x, HY + 4 + Math.sin(x * 0.004) * 2);
  g.stroke(); g.restore();

  // broad wind streaks / dust rivers
  for (let i = 0; i < 14; i++) {
    const y = HY + 40 + i * 49 + (i % 3) * 13;
    g.fillStyle = linGrad(g, -E.W, y, E.W * 2, y + 16, [
      alpha('#d38a60', 0), alpha('#d38a60', 0.022 + (i % 4) * 0.012), alpha('#8a4a3c', 0.03), alpha('#8a4a3c', 0),
    ]);
    g.beginPath(); g.ellipse(E.W * 0.5 + Math.sin(i * 1.7) * 480, y, E.W * 0.95, 10 + i * 1.1, -0.01, 0, Math.PI * 2); g.fill();
  }

  crater(g, 225, HY + 118, 154, 45, { seed: 5, a: 0.9, rot: -0.04 });
  crater(g, 780, HY + 242, 88, 27, { seed: 8, a: 0.85, rot: 0.06 });
  crater(g, 1530, HY + 138, 116, 36, { seed: 11, a: 0.8, rot: 0.03 });
  crater(g, 1040, HY + 380, 58, 18, { seed: 15, a: 0.65, rot: -0.03 });
  crater(g, 1660, HY + 420, 72, 22, { seed: 18, a: 0.55, rot: 0.08 });

  // dust-coloured ground patches
  for (let i = 0; i < 9; i++) {
    const x = -100 + i * 250 + (i % 2) * 90, y = HY + 90 + i * 62;
    g.fillStyle = radGrad(g, x, y, 0, 190, [alpha('#b46a4c', 0.08), alpha('#b46a4c', 0)]);
    g.beginPath(); g.ellipse(x, y, 210, 34, 0, 0, Math.PI * 2); g.fill();
  }

  // rock clusters (mid and near)
  const rocks = [
    [112, HY + 270, 24, 21], [188, HY + 296, 12, 22], [910, HY + 315, 17, 23],
    [1420, HY + 290, 13, 24], [1660, HY + 360, 26, 25], [1800, HY + 380, 16, 26],
    [420, HY + 390, 20, 27], [660, HY + 430, 11, 28], [1230, HY + 455, 15, 29],
    [70, HY + 470, 31, 30], [1540, HY + 520, 19, 31], [980, HY + 500, 10, 32],
  ];
  for (const [x, y, s, seed] of rocks) rock(g, x, y, s, seed, '#4b2723');
  // fine pebbles
  const r = rng(51);
  for (let i = 0; i < 150; i++) {
    const x = -60 + r() * (E.W + 120), y = HY + 50 + r() * (E.H - HY + 40);
    const s = 0.7 + r() * 2.4;
    circle(g, x, y, s, alpha('#3b1e1c', 0.4 + r() * 0.25));
    circle(g, x - s * 0.3, y - s * 0.35, s * 0.45, alpha('#d7946a', 0.22));
  }
  // faint distant thermal shimmer / low haze over the ground
  g.fillStyle = linGrad(g, 0, GY - 240, 0, GY + 10, [alpha('#c6815d', 0.07), alpha('#c6815d', 0.02), alpha('#c6815d', 0)]);
  g.fillRect(-E.W, GY - 240, E.W * 3, 260);
}

// ------------------------------------------------------------------ foreground
function fgRocks(g, t, cam) {
  // big soft boulder bottom-left
  g.save();
  rock(g, 170, 1055, 330, 91, '#2d1718');
  rock(g, 60, 1030, 220, 92, '#34191a');
  rock(g, 1760, 1080, 260, 93, '#311819');
  g.restore();
  // dune lip at the very bottom
  g.fillStyle = linGrad(g, 0, 1000, 0, 1130, [alpha('#1c0d10', 0), alpha('#140a0c', 0.72)]);
  g.fillRect(-E.W, 990, E.W * 3, 220);
}

// ------------------------------------------------------------------ atmosphere
export function marsDust(g, t, o = {}) {
  const { count = 72, seed = 8, color = '#f0b98d', wind = 26, a = 0.5 } = o;
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const baseY = r() * E.H, baseX = r() * E.W;
    const x = ((baseX + t * wind * (0.35 + r() * 0.9) + Math.sin(t * 0.6 + i) * 22) % (E.W + 80)) - 40;
    const y = baseY + Math.sin(t * 0.35 + i * 1.7) * (8 + r() * 14) - t * 3 * (0.2 + r() * 0.5);
    const s = 0.5 + r() * 1.8;
    const al = a * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.2 + i)));
    circle(g, x, y, s, alpha(color, al * 0.5));
    if (s > 1.8) glow(g, x, y, s * 4, color, al * 0.12);
  }
  g.restore();
}

function bokeh(g, t, cam, starS) {
  // defocused foreground dust / warm bokeh, screen space for a filmic feel
  const r = rng(91);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const bx = (r() * E.W + t * (7 + r() * 14)) % (E.W + 200) - 100;
    const by = r() * E.H * 0.92 + 60;
    const br = 12 + r() * 38;
    const d = Math.hypot(bx - starS[0], by - starS[1]);
    const warm = clamp(1 - d / 620);
    const col = warm > 0.35 ? '#ffd59a' : '#c9b6a8';
    g.fillStyle = radGrad(g, bx, by, 0, br, [alpha(col, 0.02), alpha(col, 0.035), alpha(col, 0)]);
    g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// ------------------------------------------------------------------ public scene
export function marsScene(g, t, cam, o = {}) {
  const GY = o.gy ?? MARS.GY, HY = o.hy ?? (GY - 274);
  layer(g, cam, 0.04, (gg) => drawSky(gg, t, HY));
  layer(g, cam, 0.12, (gg) => drawFarMesas(gg, t, HY));
  layer(g, cam, 0.24, (gg) => drawRidge(gg, t, HY));
  layer(g, cam, 0.38, (gg) => drawCliffs(gg, t, HY));
  layer(g, cam, 0.55, (gg) => drawDunes(gg, t, HY));
  layer(g, cam, 1, (gg) => drawGround(gg, t, HY, GY));

  // atmosphere sits between the set and the character
  g.save();
  const hz = linGrad(g, 0, HY - 80, 0, HY + 140, [alpha('#d58d64', 0), alpha('#d58d64', 0.13), alpha('#b66d55', 0.05), alpha('#b66d55', 0)]);
  g.fillStyle = hz; g.fillRect(-E.W, HY - 80, E.W * 3, 230);
  g.restore();
  marsDust(g, t, { seed: 5, count: 60, a: 0.32, wind: 22 });
  return { GY, HY };
}

export function marsForeground(g, t, cam, o = {}) {
  const GY = o.gy ?? MARS.GY, HY = o.hy ?? (GY - 274);
  const starS = o.starScreen || [E.W * 0.6, E.H * 0.6];
  blurLayer(g, clamp(o.blur ?? 7, 0, 14), (gg) => {
    // boulders only at the extreme edges, tuned per framing
    const edge = o.fg ?? 'wide';
    if (edge === 'wide') fgRocks(gg, t, cam);
    else if (edge === 'close') {
      gg.save();
      rock(gg, 95, 1120, 320, 94, '#2b1618');
      rock(gg, 1840, 1140, 300, 95, '#2b1618');
      gg.restore();
    }
    // dark bottom corner falloff
    gg.fillStyle = linGrad(gg, 0, 990, 0, 1130, [alpha('#150a0c', 0), alpha('#0d0608', 0.66)]);
    gg.fillRect(-E.W, 975, E.W * 3, 240);
  }, cam, 1.45);
  bokeh(g, t, cam, starS);
}

export function marsVignetteDust(g, t, o = {}) {
  marsDust(g, t, { seed: 17, count: 34, a: 0.2, wind: 36, color: '#f3c39a' });
}
