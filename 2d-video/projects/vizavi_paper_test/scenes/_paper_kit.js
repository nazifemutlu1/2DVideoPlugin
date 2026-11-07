// Shared paper-cutout kit for vizavi_paper_test. No external assets: all marks are
// deterministic canvas paths, seeded fibres and offset paper shadows.
import { E, rng, clamp, lerp, alpha, shade, rr } from '/engine/core.js';

export const P = {
  ink: '#12252b',
  ink2: '#1a3036',
  ink3: '#263f43',
  teal: '#1d4c54',
  tealDeep: '#12333b',
  tealSoft: '#2f6b70',
  cream: '#f1e2c8',
  creamHi: '#fff6e3',
  creamDim: '#d8c4a5',
  coral: '#e05a43',
  coralDeep: '#b13a2d',
  coralSoft: '#e78a72',
  rose: '#e59a86',
  mustard: '#e8b44c',
  gold: '#f4cf7a',
  sun: '#f7c56b',
  sky0: '#0f2b38',
  sky1: '#1f5562',
  sky2: '#a96b62',
  sky3: '#f0b275',
  olive: '#4c705f',
  oliveDeep: '#345449',
  glass: '#173b43',
  shadow: 'rgba(7,18,22,0.38)',
};

// ---------- paper stock ----------
let _tile = null;
function paperTile() {
  if (_tile) return _tile;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'); const r = rng(9117);
  x.clearRect(0, 0, 512, 512);
  x.lineCap = 'round';
  for (let i = 0; i < 620; i++) {
    const px = r() * 512, py = r() * 512;
    const ang = r() * Math.PI * 2, len = 5 + r() * 42;
    const light = r() < 0.56;
    x.strokeStyle = light ? `rgba(255,249,233,${0.035 + r() * 0.06})` : `rgba(26,22,18,${0.025 + r() * 0.045})`;
    x.lineWidth = 0.5 + r() * 1.15;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 6, py + Math.sin(ang) * len * 0.5 + (r() - 0.5) * 6, px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    x.stroke();
  }
  for (let i = 0; i < 1100; i++) {
    const v = r() < 0.5 ? 255 : 18;
    x.fillStyle = `rgba(${v},${v},${v},${0.02 + r() * 0.04})`;
    x.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r());
  }
  _tile = c; return c;
}
const _pats = new WeakMap();
function patternFor(g) {
  let p = _pats.get(g);
  if (!p) { p = g.createPattern(paperTile(), 'repeat'); _pats.set(g, p); }
  return p;
}

// ---------- paths ----------
export const ptsPath = (pts) => (g) => {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
};
export const rectPath = (x, y, w, h) => (g) => { g.beginPath(); g.rect(x, y, w, h); };
export function tornRectPts(x, y, w, h, seed = 1, amp = 5, seg = 6) {
  const r = rng(seed); const pts = [];
  const edge = (ax, ay, bx, by) => {
    for (let i = 0; i < seg; i++) {
      const k = i / seg, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1;
      const j = i === 0 ? 0 : (r() - 0.5) * 2 * amp;
      pts.push([lerp(ax, bx, k) + nx / l * j, lerp(ay, by, k) + ny / l * j]);
    }
  };
  edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
  return pts;
}
export function tornBandPts(x0, x1, y, h, seed = 1, amp = 7, seg = 10) {
  const r = rng(seed); const pts = [[x0, y]];
  for (let i = 1; i < seg; i++) pts.push([lerp(x0, x1, i / seg), y + (r() - 0.5) * 2 * amp]);
  pts.push([x1, y], [x1, y + h], [x0, y + h]);
  return pts;
}
export function smoothClosed(g, pts) {
  const n = pts.length; g.beginPath();
  g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  g.closePath();
}
export function blobPts(cx, cy, rx, ry, seed = 1, amp = 0.07, n = 36) {
  const r = rng(seed); const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
export const blobPath = (cx, cy, rx, ry, seed = 1, amp = 0.07, n = 36) => (g) => smoothClosed(g, blobPts(cx, cy, rx, ry, seed, amp, n));
export function cloudPath(x, y, w, h, seed = 1) {
  return (g) => {
    const r = rng(seed);
    g.beginPath();
    g.rect(x + w * 0.09, y + h * 0.46, w * 0.82, h * 0.37);
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / (n + 1);
      const cx = x + w * (0.12 + 0.76 * k) + (r() - 0.5) * w * 0.07;
      const cy = y + h * (0.47 - r() * 0.2);
      const rx = w * (0.1 + r() * 0.1), ry = h * (0.24 + r() * 0.16);
      g.moveTo(cx + rx, cy); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }
    g.closePath();
  };
}

// ---------- paper cut shape ----------
export function paperShape(g, o) {
  const { x, y, w, h, fill } = o;
  const path = o.path || ptsPath(o.pts);
  const A = o.alpha ?? 1;
  const shadow = o.shadow ?? 14, sx = o.sx ?? -7, sy = o.sy ?? 11;
  const tex = o.tex ?? 0.5, grad = o.grad ?? 0.22, edge = o.edge ?? 0.16, lw = o.lw ?? 1.8;
  g.save(); g.globalAlpha *= A;
  if (o.rot) { g.translate(x + w / 2, y + h / 2); g.rotate(o.rot); g.translate(-(x + w / 2), -(y + h / 2)); }
  if (shadow > 0) {
    g.save();
    g.shadowColor = o.shadowColor || P.shadow; g.shadowBlur = shadow;
    g.shadowOffsetX = sx; g.shadowOffsetY = sy;
    g.fillStyle = fill; g.beginPath(); path(g); g.fill();
    g.restore();
  } else { g.fillStyle = fill; g.beginPath(); path(g); g.fill(); }
  g.save();
  g.beginPath(); path(g); g.clip();
  if (grad > 0) {
    const lg = g.createLinearGradient(x + w, y, x, y + h);
    lg.addColorStop(0, alpha(P.creamHi, grad));
    lg.addColorStop(0.42, alpha(P.creamHi, 0));
    lg.addColorStop(1, alpha('#061418', grad * 0.75));
    g.fillStyle = lg; g.fillRect(x - 2, y - 2, w + 4, h + 4);
  }
  if (tex > 0) {
    g.globalCompositeOperation = 'soft-light';
    g.globalAlpha = A * tex;
    g.fillStyle = patternFor(g); g.fillRect(x - 2, y - 2, w + 4, h + 4);
  }
  g.restore();
  if (edge > 0) {
    g.strokeStyle = alpha(P.creamHi, edge); g.lineWidth = lw;
    g.beginPath(); path(g); g.stroke();
  }
  g.restore();
}

export function softShadow(g, x, y, rx, ry, a = 0.25, color = '#07171b') {
  g.save(); g.translate(x, y); g.scale(1, Math.max(0.01, ry / rx));
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, alpha(color, a)); gr.addColorStop(0.55, alpha(color, a * 0.7)); gr.addColorStop(1, alpha(color, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
}

export function drawStitch(g, pts, o = {}) {
  g.save(); g.strokeStyle = o.color || alpha(P.creamHi, o.alpha ?? 0.45);
  g.lineWidth = o.w ?? 1.4; g.lineCap = 'round'; g.setLineDash(o.dash || [5, 5]);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke(); g.restore();
}

// ---------- sky ----------
export function paperSky(g, o = {}) {
  const horizon = o.horizon ?? 1120;
  const top = o.top || P.sky0, mid = o.mid || P.sky1, low = o.low || P.sky2, warm = o.warm || P.sky3;
  const x0 = -E.W * 0.25, x1 = E.W * 1.25;
  const bands = [
    { y: -E.H * 0.55, h: E.H * 0.55 + horizon * 0.36, c: top, s: 11, tex: 0.32 },
    { y: horizon * 0.28, h: horizon * 0.5, c: mid, s: 12, tex: 0.3 },
    { y: horizon * 0.57, h: horizon * 0.42, c: low, s: 13, tex: 0.32 },
    { y: horizon * 0.8, h: E.H * 2.1, c: warm, s: 14, tex: 0.28 },
  ];
  for (const b of bands) {
    const pts = tornBandPts(x0, x1, b.y, b.h, b.s, 8, 14);
    paperShape(g, { x: x0, y: b.y, w: x1 - x0, h: b.h, pts, fill: b.c, shadow: b.s, sx: -4, sy: 8, tex: b.tex, grad: 0.16, edge: 0.09 });
  }
}

// ---------- sun ----------
export function paperSun(g, x, y, r, o = {}) {
  const a = o.alpha ?? 1;
  g.save(); g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r * 2.1);
  gr.addColorStop(0, alpha(P.gold, 0.28)); gr.addColorStop(0.5, alpha(P.sun, 0.12)); gr.addColorStop(1, alpha(P.sun, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.1, 0, Math.PI * 2); g.fill();
  const halo = blobPts(x, y, r * 1.22, r * 1.22, (o.seed || 3) + 2, 0.035, 40);
  paperShape(g, { x: x - r * 1.3, y: y - r * 1.3, w: r * 2.6, h: r * 2.6, pts: halo, fill: P.coralSoft, shadow: 0, tex: 0.25, grad: 0.1, edge: 0, alpha: 0.32 });
  const body = blobPts(x, y, r, r, o.seed || 3, 0.035, 44);
  paperShape(g, { x: x - r, y: y - r, w: 2 * r, h: 2 * r, pts: body, fill: P.sun, shadow: 18, sx: -9, sy: 14, tex: 0.55, grad: 0.28, edge: 0.24, lw: 2.4 });
  const inner = blobPts(x + r * 0.12, y - r * 0.1, r * 0.72, r * 0.72, (o.seed || 3) + 7, 0.04, 32);
  paperShape(g, { x: x - r, y: y - r, w: 2 * r, h: 2 * r, pts: inner, fill: P.gold, shadow: 8, sx: -5, sy: 8, tex: 0.5, grad: 0.2, edge: 0.22, alpha: 0.9 });
  g.restore();
}

// ---------- clouds ----------
export function paperCloud(g, o) {
  const { x, y, w, h, seed = 1 } = o;
  const base = o.color || P.creamDim;
  paperShape(g, { x, y, w, h, path: cloudPath(x, y, w, h, seed), fill: base, shadow: o.shadow ?? 17, sx: -10, sy: 15, tex: 0.5, grad: 0.22, edge: 0.16, alpha: o.alpha ?? 1 });
  if (o.highlight !== false) {
    paperShape(g, { x, y: y - 2, w: w * 0.86, h: h * 0.7, path: cloudPath(x + w * 0.05, y - h * 0.02, w * 0.86, h * 0.7, seed + 11), fill: o.light || P.cream, shadow: 0, tex: 0.45, grad: 0.2, edge: 0, alpha: 0.42 });
  }
}

// ---------- balloon ----------
function rotatePoint(cx, cy, dx, dy, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}
export function balloonAnchor(b) {
  const a = b.rot || 0;
  const neck = rotatePoint(b.cx, b.cy, 0, b.ry * 0.985, a);
  const crown = rotatePoint(b.cx, b.cy, 0, -b.ry * 0.985, a);
  return { neck, crown, center: [b.cx, b.cy] };
}
function balloonPath(b) {
  const pts = blobPts(b.cx, b.cy, b.rx, b.ry, b.seed || 5, 0.022, 54);
  return (g) => smoothClosed(g, pts);
}
export function drawBalloon(g, b) {
  const a = b.rot || 0;
  const cx = b.cx, cy = b.cy, rx = b.rx, ry = b.ry;
  g.save();
  g.translate(cx, cy); g.rotate(a); g.translate(-cx, -cy);
  const path = balloonPath(b);
  paperShape(g, { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2, path, fill: P.coral, shadow: b.shadow ?? 26, sx: -16, sy: 24, tex: 0.55, grad: 0.22, edge: 0.22, lw: 2.6 });
  g.save(); g.beginPath(); path(g); g.clip();
  const us = [-1, -0.64, -0.22, 0.22, 0.64, 1];
  const cols = [P.coralDeep, P.coral, P.rose, P.cream, P.coralSoft, P.coralDeep];
  for (let k = 0; k < us.length - 1; k++) {
    g.beginPath();
    for (let i = 0; i <= 18; i++) {
      const yy = -ry + (2 * ry) * i / 18;
      const q = Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2));
      g.lineTo(cx + rx * us[k] * q, cy + yy);
    }
    for (let i = 18; i >= 0; i--) {
      const yy = -ry + (2 * ry) * i / 18;
      const q = Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2));
      g.lineTo(cx + rx * us[k + 1] * q, cy + yy);
    }
    g.closePath(); g.fillStyle = cols[k]; g.fill();
  }
  const lg = g.createLinearGradient(cx - rx, cy, cx + rx, cy);
  lg.addColorStop(0, 'rgba(70,18,16,0.3)'); lg.addColorStop(0.48, 'rgba(70,18,16,0)'); lg.addColorStop(1, 'rgba(255,243,221,0.26)');
  g.fillStyle = lg; g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.55;
  g.fillStyle = patternFor(g); g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  // gore seams
  g.strokeStyle = alpha(P.creamHi, 0.42); g.lineWidth = Math.max(1.4, rx * 0.006);
  for (const u of us.slice(1, -1)) {
    g.beginPath();
    for (let i = 0; i <= 22; i++) {
      const yy = -ry + (2 * ry) * i / 22;
      const q = Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2));
      const px = cx + rx * u * q, py = cy + yy;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
  }
  // stitched belt
  const beltY = cy + ry * 0.34;
  g.strokeStyle = alpha(P.creamHi, 0.34); g.lineWidth = Math.max(1.6, rx * 0.008);
  g.setLineDash([Math.max(3, rx * 0.022), Math.max(5, rx * 0.032)]);
  g.beginPath();
  for (let i = 0; i <= 26; i++) {
    const xx = cx - rx + (2 * rx) * i / 26;
    const q = Math.sqrt(Math.max(0, 1 - ((xx - cx) / rx) ** 2));
    const yy = beltY;
    if (i === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
  }
  g.stroke(); g.setLineDash([]);
  // paper highlight
  const hl = g.createRadialGradient(cx + rx * 0.34, cy - ry * 0.3, rx * 0.05, cx + rx * 0.28, cy - ry * 0.25, rx * 0.72);
  hl.addColorStop(0, alpha(P.creamHi, 0.24)); hl.addColorStop(1, alpha(P.creamHi, 0));
  g.fillStyle = hl; g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  // patches
  const patchA = tornRectPts(cx - rx * 0.58, cy - ry * 0.24, rx * 0.22, ry * 0.16, 31, rx * 0.012, 4);
  paperShape(g, { x: cx - rx * 0.58, y: cy - ry * 0.24, w: rx * 0.22, h: ry * 0.16, pts: patchA, fill: P.cream, shadow: 9, sx: -4, sy: 7, tex: 0.5, grad: 0.15, edge: 0.1, alpha: 0.94 });
  const patchB = tornRectPts(cx + rx * 0.22, cy + ry * 0.08, rx * 0.18, ry * 0.13, 37, rx * 0.01, 4);
  paperShape(g, { x: cx + rx * 0.22, y: cy + ry * 0.08, w: rx * 0.18, h: ry * 0.13, pts: patchB, fill: P.coralSoft, shadow: 8, sx: -4, sy: 6, tex: 0.5, grad: 0.15, edge: 0.1, alpha: 0.95 });
  g.restore();
  // neck + crown paper details (outside clip, still rotated)
  const neckW = rx * 0.13;
  paperShape(g, {
    x: cx - neckW / 2, y: cy + ry * 0.94, w: neckW, h: ry * 0.13,
    path: (gg) => { gg.beginPath(); gg.moveTo(cx - neckW / 2, cy + ry * 0.94); gg.lineTo(cx + neckW / 2, cy + ry * 0.94); gg.lineTo(cx + neckW * 0.26, cy + ry * 1.075); gg.lineTo(cx - neckW * 0.26, cy + ry * 1.075); gg.closePath(); },
    fill: P.coralDeep, shadow: 10, sx: -4, sy: 7, tex: 0.4, grad: 0.18, edge: 0.16
  });
  paperShape(g, {
    x: cx - rx * 0.16, y: cy - ry * 0.99, w: rx * 0.32, h: ry * 0.09,
    path: (gg) => { gg.beginPath(); gg.ellipse(cx, cy - ry * 0.985, rx * 0.16, ry * 0.055, 0, 0, Math.PI * 2); },
    fill: P.mustard, shadow: 8, sx: -4, sy: 7, tex: 0.45, grad: 0.2, edge: 0.16
  });
  g.strokeStyle = alpha(P.creamHi, 0.55); g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy - ry * 0.985, rx * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.restore();
}

// ---------- twine ----------
function smoothOpen(g, pts) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1]; g.lineTo(l[0], l[1]);
}
export function drawTwine(g, pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const w = o.w ?? 4, a = o.alpha ?? 1;
  g.save(); g.globalAlpha *= a; g.lineCap = 'round'; g.lineJoin = 'round';
  if (o.shadow !== false) {
    g.translate(-3, 5); g.strokeStyle = alpha(P.ink, 0.3); g.lineWidth = w + 2.2;
    smoothOpen(g, pts); g.stroke(); g.translate(3, -5);
  }
  g.strokeStyle = o.color || P.creamDim; g.lineWidth = w;
  smoothOpen(g, pts); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.42); g.lineWidth = Math.max(1, w * 0.3);
  g.translate(-0.8, -0.9); smoothOpen(g, pts); g.stroke(); g.translate(0.8, 0.9);
  if (o.twists !== false && w >= 2.2) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const step = Math.max(7, w * 3.1);
    for (let d = step * 0.5; d < total; d += step) {
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        const l = Math.hypot(dx, dy);
        if (acc + l >= d) {
          const k = (d - acc) / (l || 1);
          const px = lerp(pts[i - 1][0], pts[i][0], k), py = lerp(pts[i - 1][1], pts[i][1], k);
          const nx = -dy / (l || 1), ny = dx / (l || 1);
          g.strokeStyle = alpha(P.ink2, 0.25); g.lineWidth = Math.max(0.8, w * 0.22);
          g.beginPath(); g.moveTo(px - nx * w * 0.5, py - ny * w * 0.5); g.lineTo(px + nx * w * 0.5, py + ny * w * 0.5); g.stroke();
          break;
        }
        acc += l;
      }
    }
  }
  g.restore();
}
export function drawTwineTo(g, a, b, o = {}) {
  const sag = o.sag ?? 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const mid = [(a[0] + b[0]) / 2 + nx * sag, (a[1] + b[1]) / 2 + ny * sag];
  drawTwine(g, [a, mid, b], o);
}
export function drawKnot(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.strokeStyle = P.creamDim; g.lineWidth = 4 * s; g.lineCap = 'round';
  g.beginPath(); g.ellipse(0, 0, 11 * s, 7 * s, 0.35, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.5); g.lineWidth = 1.4 * s;
  g.beginPath(); g.ellipse(-1 * s, -1 * s, 8 * s, 4.8 * s, 0.35, 0, Math.PI * 2); g.stroke();
  g.fillStyle = P.creamDim; g.beginPath(); g.ellipse(0, 0, 5.5 * s, 4 * s, 0.3, 0, Math.PI * 2); g.fill();
  g.restore();
}
export function drawTag(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const w = 26 * s, h = 40 * s;
  paperShape(g, { x: -w / 2, y: -h / 2, w, h, path: (gg) => { gg.beginPath(); gg.moveTo(-w / 2, -h / 2 + 5 * s); gg.lineTo(w / 2, -h / 2); gg.lineTo(w / 2 - 3 * s, h / 2); gg.lineTo(-w / 2 + 2 * s, h / 2 - 4 * s); gg.closePath(); }, fill: P.cream, shadow: 8, sx: -3, sy: 5, tex: 0.5, grad: 0.18, edge: 0.2 });
  g.fillStyle = P.ink2; g.beginPath(); g.arc(0, -h / 2 + 8 * s, 3.2 * s, 0, Math.PI * 2); g.fill();
  g.strokeStyle = P.ink2; g.lineWidth = 2.2 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 4 * s); g.lineTo(0, -8 * s); g.stroke();
  g.beginPath(); g.moveTo(-4 * s, -3 * s); g.lineTo(0, -8 * s); g.lineTo(4 * s, -3 * s); g.stroke();
  g.restore();
}
export function drawGrip(g, x, y, w, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const h = 20 * s;
  paperShape(g, { x: -w / 2, y: -h / 2, w, h, path: (gg) => rr(gg, -w / 2, -h / 2, w, h, h / 2), fill: P.creamDim, shadow: 9, sx: -4, sy: 6, tex: 0.55, grad: 0.2, edge: 0.25, lw: 2 });
  g.strokeStyle = alpha(P.ink2, 0.28); g.lineWidth = 1.1 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-w * 0.34, -h * 0.25); g.lineTo(w * 0.32, -h * 0.12); g.stroke();
  g.beginPath(); g.moveTo(-w * 0.3, h * 0.2); g.lineTo(w * 0.36, h * 0.3); g.stroke();
  for (const bx of [-w * 0.4, w * 0.4]) {
    g.fillStyle = P.mustard; g.beginPath(); g.arc(bx, 0, 3.2 * s, 0, Math.PI * 2); g.fill();
    g.strokeStyle = alpha(P.ink, 0.45); g.lineWidth = 0.8 * s; g.stroke();
  }
  g.restore();
}

// ---------- windows / blocks ----------
export function windows(g, o) {
  const { x, y, w, h, cols, rows, seed = 1 } = o;
  const r = rng(seed);
  const lit = o.lit ?? 0.34, litColor = o.litColor || P.gold, off = o.off || alpha(P.ink, 0.55);
  const cw = w / cols, ch = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const isLit = r() < lit;
    const ww = cw * (o.kx ?? 0.44), wh = ch * (o.ky ?? 0.48);
    const px = x + cw * i + cw / 2 - ww / 2, py = y + ch * j + ch / 2 - wh / 2;
    if (o.dots) {
      g.fillStyle = isLit ? alpha(litColor, 0.85) : alpha(P.creamDim, 0.12);
      g.fillRect(px, py, Math.max(2, ww * 0.55), Math.max(2, wh * 0.55));
      continue;
    }
    g.fillStyle = isLit ? litColor : off;
    if (isLit && o.glow !== false) { g.save(); g.shadowColor = alpha(litColor, 0.55); g.shadowBlur = o.glowSize ?? 8; g.fillRect(px, py, ww, wh); g.restore(); }
    else g.fillRect(px, py, ww, wh);
    if (o.frames !== false) {
      g.strokeStyle = isLit ? alpha(P.ink, 0.55) : alpha(P.creamDim, 0.22);
      g.lineWidth = Math.max(1, cw * 0.022);
      g.strokeRect(px, py, ww, wh);
      g.beginPath(); g.moveTo(px + ww / 2, py); g.lineTo(px + ww / 2, py + wh); g.stroke();
    }
  }
}

export function roofDetails(g, o) {
  const { x, y, w, seed = 1 } = o;
  const r = rng(seed);
  const tone = o.tone || P.creamDim;
  const n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const px = x + w * (0.15 + r() * 0.68), py = y - 6 - r() * 18;
    const kind = r();
    if (kind < 0.36) {
      // water tower
      const tw = 18 + r() * 10;
      paperShape(g, { x: px - tw / 2, y: py - tw, w: tw, h: tw, path: (gg) => rr(gg, px - tw / 2, py - tw, tw, tw, 4), fill: tone, shadow: 7, sx: -3, sy: 5, tex: 0.5, grad: 0.2, edge: 0.16 });
      g.strokeStyle = alpha(P.ink, 0.45); g.lineWidth = 2;
      g.beginPath(); g.moveTo(px - tw * 0.25, py); g.lineTo(px - tw * 0.25, py + 10); g.moveTo(px + tw * 0.25, py); g.lineTo(px + tw * 0.25, py + 10); g.stroke();
    } else if (kind < 0.68) {
      // vent / AC
      paperShape(g, { x: px - 11, y: py - 9, w: 22, h: 13, path: (gg) => rr(gg, px - 11, py - 9, 22, 13, 2), fill: P.tealSoft, shadow: 5, sx: -2, sy: 4, tex: 0.5, grad: 0.2, edge: 0.12 });
    } else {
      // antenna
      g.strokeStyle = alpha(P.ink, 0.55); g.lineWidth = 2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 28); g.stroke();
      g.beginPath(); g.moveTo(px - 8, py - 22); g.lineTo(px + 8, py - 22); g.stroke();
    }
  }
}

// ---------- birds / atmosphere ----------
export function drawBird(g, x, y, s = 1, flap = 0, tone = P.ink2) {
  g.save(); g.translate(x, y); g.rotate(-0.08);
  g.fillStyle = tone;
  const up = Math.sin(flap) * 0.5;
  g.beginPath(); g.moveTo(-16 * s, up * 5 * s); g.quadraticCurveTo(-8 * s, -8 * s, 0, 0); g.quadraticCurveTo(8 * s, -8 * s, 16 * s, up * 5 * s); g.quadraticCurveTo(7 * s, -1 * s, 0, 4 * s); g.quadraticCurveTo(-7 * s, -1 * s, -16 * s, up * 5 * s); g.fill();
  g.restore();
}
export function paperDust(g, t, o = {}) {
  const n = o.n ?? 26, seed = o.seed ?? 5, x0 = o.x ?? E.W / 2, y0 = o.y ?? E.H * 0.55;
  const sx = o.spreadX ?? E.W * 0.9, sy = o.spreadY ?? E.H * 0.75, size = o.size ?? 3;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const bx = x0 + (r() - 0.5) * sx, by = y0 + (r() - 0.5) * sy;
    const sp = 10 + r() * 34, ph = r() * 30;
    const px = bx + Math.sin(t * 0.4 + ph) * (12 + r() * 24) + t * (o.driftX ?? 4);
    const py = by - ((t * sp + ph * 3) % (sy * 1.2)) + sy * 0.15;
    g.save(); g.translate(px, py); g.rotate(t * (0.2 + r() * 0.5) + ph);
    g.globalAlpha = (o.alpha ?? 0.32) * (0.4 + r() * 0.6);
    g.fillStyle = o.color || P.creamHi;
    if (r() < 0.5) g.fillRect(-size * 0.5, -size * 0.2, size * (0.6 + r()), size * 0.3);
    else { g.beginPath(); g.moveTo(-size * 0.4, size * 0.3); g.lineTo(0, -size * 0.4); g.lineTo(size * 0.45, size * 0.25); g.fill(); }
    g.restore();
  }
}
export function paperScraps(g, t, o = {}) {
  const n = o.n ?? 16, r = rng(o.seed ?? 9);
  for (let i = 0; i < n; i++) {
    const px = (o.x ?? E.W / 2) + (r() - 0.5) * (o.spreadX ?? E.W) + t * (o.driftX ?? 16);
    const py = (o.y ?? E.H * 0.5) + (r() - 0.5) * (o.spreadY ?? E.H) + t * (o.driftY ?? 90) * (0.4 + r());
    const sz = (o.size ?? 9) * (0.5 + r());
    g.save(); g.translate(px, py); g.rotate(t * (1 + r() * 2) + i); g.globalAlpha = (o.alpha ?? 0.55) * (0.35 + r() * 0.65);
    g.fillStyle = r() < 0.2 ? P.coral : (r() < 0.2 ? P.mustard : P.cream);
    g.fillRect(-sz / 2, -sz * 0.18, sz, sz * 0.36);
    g.restore();
  }
}
