// Paper aerial diorama: torn-paper sky, sun, layered rooftop city, canal and near roof framing.
import { E, rng, lerp, alpha, mix, shade, layer, rr } from '/engine/core.js';
import {
  P, paperShape, paperSky, paperSun, paperCloud, paperDust, drawBird, roofDetails,
  tornRectPts, tornBandPts,
} from '../_paper_kit.js';

const TAU = Math.PI * 2;
const FAR_T = mix(P.tealDeep, P.sky1, 0.52);
const FAR_T2 = mix(P.tealDeep, P.sky1, 0.34);
const MID_TONES = [mix(P.teal, P.oliveDeep, 0.32), mix(P.tealDeep, P.sky1, 0.2), mix(P.oliveDeep, P.teal, 0.46)];
const NEAR_TONES = [P.teal, mix(P.oliveDeep, P.teal, 0.42), P.oliveDeep, mix(P.tealSoft, P.oliveDeep, 0.35), mix(P.mustard, P.oliveDeep, 0.62)];
const WALL_T = mix(P.creamDim, P.tealSoft, 0.62);

const STREETS = [
  { y: 1138, h: 20, seed: 501 },
  { y: 1210, h: 24, seed: 502 },
  { y: 1300, h: 28, seed: 503 },
  { y: 1408, h: 32, seed: 504 },
  { y: 1536, h: 36, seed: 505 },
  { y: 1745, h: 20, seed: 506 },
];
const ROW_CFG = [
  { y: 1152, d: [38, 60], w: [34, 72], gap: [7, 18], jit: 7, wall: 6, tones: [FAR_T, FAR_T2], seed: 401, detail: 0.12 },
  { y: 1224, d: [50, 74], w: [46, 92], gap: [9, 22], jit: 8, wall: 10, tones: [FAR_T2, MID_TONES[1], MID_TONES[0]], seed: 411, detail: 0.28 },
  { y: 1316, d: [62, 92], w: [58, 114], gap: [12, 28], jit: 9, wall: 15, tones: MID_TONES, seed: 421, detail: 0.5 },
  { y: 1424, d: [76, 108], w: [76, 146], gap: [16, 34], jit: 10, wall: 22, tones: [MID_TONES[0], MID_TONES[2], NEAR_TONES[1]], seed: 431, detail: 0.7 },
  { y: 1552, d: [84, 100], w: [96, 180], gap: [20, 40], jit: 11, wall: 28, tones: [NEAR_TONES[0], NEAR_TONES[1], NEAR_TONES[3]], seed: 441, detail: 0.85 },
  { y: 1770, d: [140, 180], w: [150, 260], gap: [24, 52], jit: 12, wall: 60, tones: [NEAR_TONES[0], NEAR_TONES[1], NEAR_TONES[2], NEAR_TONES[4]], seed: 451, detail: 1 },
];

function makeRow(cfg) {
  const r = rng(cfg.seed); const blocks = []; let x = -90 - r() * 50;
  while (x < 1190) {
    const w = lerp(cfg.w[0], cfg.w[1], r());
    const d = lerp(cfg.d[0], cfg.d[1], r());
    const gap = lerp(cfg.gap[0], cfg.gap[1], r());
    const tall = r() < 0.15;
    blocks.push({
      x, y: cfg.y + (r() - 0.5) * cfg.jit - (tall ? 12 + r() * 22 : 0),
      w, d: d * (tall ? 1.06 : 1), gap,
      wall: cfg.wall * (0.55 + r() * 1.05),
      tone: cfg.tones[Math.floor(r() * cfg.tones.length)],
      seed: Math.floor(r() * 9999), deco: r(),
    });
    x += w + gap;
  }
  return blocks;
}
const ROWS = ROW_CFG.map(cfg => ({ ...cfg, blocks: makeRow(cfg) }));

function tree(g, x, y, s, seed, tone = P.olive) {
  const r = rng(seed);
  g.save();
  g.strokeStyle = alpha(P.ink, 0.55); g.lineWidth = 2.4 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1 * s, y - 13 * s); g.stroke();
  for (let i = 0; i < 3; i++) {
    const cx = x + (r() - 0.5) * 16 * s, cy = y - (15 + r() * 15) * s, rad = (8 + r() * 7) * s;
    g.fillStyle = alpha(P.ink, 0.28); g.beginPath(); g.arc(cx + 2.4 * s, cy + 3.4 * s, rad, 0, TAU); g.fill();
    g.fillStyle = i === 1 ? mix(tone, P.mustard, 0.16) : tone;
    g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.fill();
    g.strokeStyle = alpha(P.creamHi, 0.14); g.lineWidth = 1; g.stroke();
  }
  g.restore();
}

function car(g, x, y, s, tone) {
  const w = 20 * s, h = 9 * s;
  g.save(); g.translate(x, y);
  paperShape(g, { x: -w / 2, y: -h, w, h, path: gg => rr(gg, -w / 2, -h, w, h, 3 * s), fill: tone, shadow: 4, sx: -2, sy: 3, tex: 0.35, grad: 0.2, edge: 0.12 });
  paperShape(g, { x: -w * 0.28, y: -h - 4 * s, w: w * 0.56, h: 5 * s, path: gg => rr(gg, -w * 0.28, -h - 4 * s, w * 0.56, 5 * s, 2 * s), fill: mix(tone, P.ink, 0.32), shadow: 2, sx: -1, sy: 2, tex: 0.3, grad: 0.2, edge: 0.05 });
  g.fillStyle = alpha(P.creamHi, 0.5); g.fillRect(-w * 0.2, -h * 0.62, w * 0.16, h * 0.35);
  g.restore();
}

function street(g, cfg, t) {
  paperShape(g, {
    x: -150, y: cfg.y, w: 1380, h: cfg.h,
    pts: tornBandPts(-150, 1230, cfg.y, cfg.h, cfg.seed, 2.2, 16),
    fill: mix(P.creamDim, P.tealSoft, 0.58), shadow: 6, sx: -4, sy: 7, tex: 0.5, grad: 0.16, edge: 0.08,
  });
  g.save(); g.fillStyle = alpha(P.creamHi, 0.2);
  for (let x = -110; x < 1210; x += 54) g.fillRect(x, cfg.y + cfg.h * 0.52 - 1.3, 19, 2.6);
  g.restore();
  const r = rng(cfg.seed + 5);
  for (let i = 0; i < 3; i++) {
    const speed = 13 + r() * 17;
    const dir = r() < 0.5 ? -1 : 1;
    const x = -80 + (((r() * 1240 + t * speed * dir) % 1290) + 1290) % 1290;
    car(g, x, cfg.y + cfg.h * 0.62, 0.72 + r() * 0.32, [P.mustard, P.coralSoft, P.cream][i % 3]);
  }
}

function drawBlock(g, b, cfg) {
  const { x, y, w, d } = b;
  const wall = b.wall ?? cfg.wall;
  if (wall > 2) {
    paperShape(g, {
      x: x + 3, y: y + d - 2, w: w - 6, h: wall + 10,
      path: gg => gg.rect(x + 3, y + d - 2, w - 6, wall + 10),
      fill: shade(b.tone, -0.3), shadow: 0, tex: 0.4, grad: 0.16, edge: 0.07,
    });
    if (wall > 13) {
      const dr = rng(b.seed + 5);
      const cols = Math.max(1, Math.floor((w - 16) / 17));
      const rows = Math.max(1, Math.floor(wall / 19));
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const lit = dr() < 0.36;
        g.fillStyle = lit ? alpha(P.gold, 0.85) : alpha(P.ink, 0.5);
        g.fillRect(x + 12 + i * 17 + (w - 16 - cols * 17) / 2, y + d + 5 + j * 19, 7, 9);
      }
    }
  }
  paperShape(g, {
    x, y, w, h: d,
    pts: tornRectPts(x, y, w, d, b.seed, 2.4, 5),
    fill: b.tone, shadow: 10, sx: -6, sy: 10, tex: 0.5, grad: 0.2, edge: 0.11,
  });
  g.save(); g.fillStyle = alpha(P.creamHi, 0.1); g.fillRect(x + 3, y + 2, w - 6, 2.6);
  g.strokeStyle = alpha(P.ink, 0.18); g.lineWidth = 1.2; g.strokeRect(x + 2, y + 2, w - 4, d - 4); g.restore();
  if (d < 40) return;
  const dr = rng(b.seed + 11);
  if (cfg.detail > 0.8) {
    if (b.deco < 0.24) roofDetails(g, { x: x + w * 0.18, y: y + d * 0.62, w: w * 0.64, seed: b.seed, tone: P.creamDim });
    else if (b.deco < 0.44) {
      const n = 2 + Math.floor(dr() * 3);
      for (let i = 0; i < n; i++) tree(g, x + w * (0.18 + dr() * 0.64), y + d * (0.4 + dr() * 0.42), 0.7 + dr() * 0.5, b.seed + i * 7);
    } else if (b.deco < 0.64) {
      for (let i = 0; i < 2; i++) {
        const sx = x + w * (0.16 + dr() * 0.6), sy = y + d * (0.25 + dr() * 0.4);
        g.save(); g.translate(sx, sy); g.rotate((dr() - 0.5) * 0.45);
        paperShape(g, { x: -15, y: -9, w: 30, h: 18, path: gg => rr(gg, -15, -9, 30, 18, 2.5), fill: P.creamDim, shadow: 5, sx: -2, sy: 4, tex: 0.4, grad: 0.22, edge: 0.12 });
        g.restore();
      }
    } else if (b.deco < 0.82) {
      const tx = x + w * (0.2 + dr() * 0.55), ty = y + d * 0.58;
      paperShape(g, { x: tx - 8, y: ty - 24, w: 16, h: 26, path: gg => gg.rect(tx - 8, ty - 24, 16, 26), fill: P.tealSoft, shadow: 5, sx: -2, sy: 4, tex: 0.4, grad: 0.2, edge: 0.1 });
      g.fillStyle = alpha(P.creamHi, 0.25); g.fillRect(tx - 6, ty - 22, 12, 3);
    } else roofDetails(g, { x: x + w * 0.2, y: y + d * 0.7, w: w * 0.6, seed: b.seed + 3, tone: P.cream });
  } else if (cfg.detail > 0.5) {
    if (b.deco < 0.4) {
      const sx = x + w * (0.25 + dr() * 0.45), sy = y + d * (0.3 + dr() * 0.35);
      paperShape(g, { x: sx - 9, y: sy - 6, w: 18, h: 12, path: gg => rr(gg, sx - 9, sy - 6, 18, 12, 2), fill: P.creamDim, shadow: 3, sx: -2, sy: 3, tex: 0.3, grad: 0.18, edge: 0.08 });
    } else if (b.deco < 0.55) tree(g, x + w * 0.5, y + d * 0.6, 0.75, b.seed);
  }
}

function drawRow(g, cfg, t) {
  for (const b of cfg.blocks) drawBlock(g, b, cfg);
  if (cfg.detail > 0.8) {
    const r = rng(cfg.seed + 91);
    for (let i = 0; i < 3; i++) {
      const b = cfg.blocks[Math.floor(r() * cfg.blocks.length)];
      tree(g, b.x + b.w * (0.15 + r() * 0.7), b.y + b.d * (0.25 + r() * 0.3), 0.9 + r() * 0.5, cfg.seed + i * 13, i % 2 ? P.oliveDeep : P.olive);
    }
  }
}

function river(g, t) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    pts.push([-120 + 1320 * k, 1702 + Math.sin(k * Math.PI * 1.35) * 20 - 16 * k]);
  }
  const ribbon = (w, col, dx = 0, dy = 0) => {
    g.save(); g.translate(dx, dy); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); g.stroke(); g.restore();
  };
  ribbon(132, alpha(P.ink, 0.24), -7, 12);
  ribbon(128, P.creamDim);
  ribbon(112, mix(P.sky1, P.tealSoft, 0.3));
  ribbon(92, mix(P.sky1, P.tealDeep, 0.42));
  ribbon(64, mix(P.sky1, P.tealSoft, 0.12));
  g.save(); g.strokeStyle = alpha(P.creamHi, 0.18); g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-120, 1654); g.quadraticCurveTo(540, 1674, 1200, 1650); g.stroke(); g.restore();
  // paper glints
  g.save(); g.strokeStyle = alpha(P.creamHi, 0.22); g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const k = (i + 0.5) / 16, x = -100 + 1280 * k;
    const y = 1700 + Math.sin(k * Math.PI * 1.35) * 20 - 16 * k;
    g.beginPath(); g.moveTo(x, y + Math.sin(i * 2.1) * 10); g.lineTo(x + 18, y + Math.sin(i * 2.1) * 10 - 2); g.stroke();
  }
  g.restore();
  // two paper boats
  for (let i = 0; i < 2; i++) {
    const k = i ? 0.66 : 0.29;
    const bx = -100 + 1280 * k + Math.sin(t * 0.5 + i * 2.4) * 18;
    const by = 1702 + Math.sin(k * Math.PI * 1.35) * 20 - 16 * k + 6;
    g.save(); g.translate(bx, by); g.rotate(-0.04 + Math.sin(t * 0.7 + i) * 0.04);
    paperShape(g, { x: -16, y: -7, w: 32, h: 14, path: gg => { gg.beginPath(); gg.moveTo(-16, -5); gg.lineTo(16, -6); gg.lineTo(10, 8); gg.lineTo(-10, 8); gg.closePath(); }, fill: P.cream, shadow: 4, sx: -2, sy: 4, tex: 0.4, grad: 0.2, edge: 0.16 });
    g.strokeStyle = alpha(P.ink2, 0.4); g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -6); g.lineTo(0, 8); g.stroke();
    g.fillStyle = P.mustard; g.beginPath(); g.moveTo(1, -8); g.lineTo(11, 2); g.lineTo(1, 2); g.closePath(); g.fill();
    g.restore();
  }
  // bridges
  for (const bx of [312, 812]) {
    const by = 1688;
    paperShape(g, { x: bx - 19, y: by - 18, w: 38, h: 118, path: gg => rr(gg, bx - 19, by - 18, 38, 118, 3), fill: P.creamDim, shadow: 10, sx: -4, sy: 8, tex: 0.45, grad: 0.2, edge: 0.16 });
    g.strokeStyle = alpha(P.ink, 0.45); g.lineWidth = 2;
    g.beginPath(); g.moveTo(bx - 13, by - 14); g.lineTo(bx - 13, by + 94); g.moveTo(bx + 13, by - 14); g.lineTo(bx + 13, by + 94); g.stroke();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(bx - 13, by - 8 + i * 18); g.lineTo(bx + 13, by - 8 + i * 18); g.stroke(); }
  }
}

function farStrip(g) {
  paperShape(g, {
    x: -150, y: 1026, w: 1380, h: 168,
    pts: tornBandPts(-150, 1230, 1026, 168, 211, 7, 16),
    fill: mix(P.tealDeep, P.sky2, 0.4), shadow: 12, sx: -4, sy: 9, tex: 0.3, grad: 0.12, edge: 0.05, alpha: 0.92,
  });
  const r = rng(913); let x = -110;
  while (x < 1210) {
    const w = 18 + r() * 52, h = 22 + r() * 70, top = 1152 - h;
    paperShape(g, { x, y: top, w, h: h + 22, path: gg => gg.rect(x, top, w, h + 22), fill: mix(P.tealDeep, P.sky1, 0.54), shadow: 4, sx: -2, sy: 4, tex: 0.28, grad: 0.12, edge: 0.04 });
    if (r() < 0.45) { g.fillStyle = alpha(P.gold, 0.5); for (let i = 0; i < 2; i++) g.fillRect(x + 4 + r() * (w - 8), top + 6 + r() * (h - 10), 2.2, 3.2); }
    x += w + 3 + r() * 12;
  }
}

function birds(g, t) {
  for (let i = 0; i < 6; i++) {
    const bx = 230 + i * 52 + Math.sin(t * 0.3 + i) * 18;
    const by = 930 + Math.sin(t * 0.6 + i * 1.3) * 12 + (i % 3) * 18;
    drawBird(g, bx, by, 0.5 + (i % 3) * 0.12, t * 7 + i * 1.7, alpha(P.ink2, 0.72));
  }
}

function clockTower(g, x, top) {
  const w = 42;
  paperShape(g, { x: x - w / 2, y: top, w, h: 270, path: gg => gg.rect(x - w / 2, top, w, 270), fill: mix(P.creamDim, P.cream, 0.38), shadow: 13, sx: -5, sy: 10, tex: 0.5, grad: 0.2, edge: 0.2 });
  paperShape(g, { x: x - w * 0.72, y: top - 22, w: w * 1.44, h: 26, path: gg => gg.rect(x - w * 0.72, top - 22, w * 1.44, 26), fill: P.creamDim, shadow: 9, sx: -4, sy: 7, tex: 0.5, grad: 0.18, edge: 0.18 });
  paperShape(g, { x: x - 15, y: top - 54, w: 30, h: 34, path: gg => gg.rect(x - 15, top - 54, 30, 34), fill: P.tealSoft, shadow: 8, sx: -3, sy: 6, tex: 0.45, grad: 0.2, edge: 0.16 });
  g.save();
  g.strokeStyle = P.mustard; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(x, top - 54); g.lineTo(x, top - 78); g.stroke();
  g.fillStyle = P.mustard; g.beginPath(); g.arc(x, top - 80, 3.4, 0, TAU); g.fill();
  g.fillStyle = P.mustard; g.beginPath(); g.arc(x, top + 66, 16, 0, TAU); g.fill();
  g.strokeStyle = alpha(P.ink, 0.62); g.lineWidth = 1.8; g.stroke();
  g.strokeStyle = alpha(P.ink, 0.78); g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, top + 66); g.lineTo(x, top + 56); g.moveTo(x, top + 66); g.lineTo(x + 7, top + 69); g.stroke();
  g.fillStyle = alpha(P.gold, 0.72);
  for (let i = 0; i < 3; i++) g.fillRect(x - 6, top + 104 + i * 42, 12, 20);
  g.restore();
}

function domeHall(g, x, baseY) {
  paperShape(g, { x: x - 58, y: baseY - 70, w: 116, h: 100, path: gg => gg.rect(x - 58, baseY - 70, 116, 100), fill: mix(P.creamDim, P.cream, 0.3), shadow: 12, sx: -4, sy: 9, tex: 0.5, grad: 0.18, edge: 0.16 });
  paperShape(g, { x: x - 54, y: baseY - 130, w: 108, h: 60, path: gg => { gg.beginPath(); gg.ellipse(x, baseY - 70, 54, 56, 0, Math.PI, TAU); gg.closePath(); }, fill: P.coralDeep, shadow: 11, sx: -4, sy: 9, tex: 0.5, grad: 0.2, edge: 0.2 });
  g.save();
  g.strokeStyle = alpha(P.creamHi, 0.38); g.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x, baseY - 72); g.lineTo(x + i * 23, baseY - 124); g.stroke(); }
  g.fillStyle = P.mustard; g.beginPath(); g.arc(x, baseY - 130, 4, 0, TAU); g.fill();
  g.fillStyle = alpha(P.gold, 0.7);
  for (let i = 0; i < 4; i++) g.fillRect(x - 44 + i * 25, baseY - 46, 10, 22);
  g.strokeStyle = alpha(P.ink, 0.24); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x - 54, baseY - 20); g.lineTo(x + 54, baseY - 20); g.stroke();
  g.restore();
}

function ferris(g, x, cy, r, t) {
  g.save();
  g.strokeStyle = alpha(P.ink, 0.3); g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - r * 0.72 + 3, cy + r + 42); g.lineTo(x + 3, cy + 3); g.lineTo(x + r * 0.72 + 3, cy + r + 42); g.stroke();
  g.strokeStyle = P.creamDim; g.lineWidth = 4;
  g.beginPath(); g.moveTo(x - r * 0.72, cy + r + 40); g.lineTo(x, cy); g.lineTo(x + r * 0.72, cy + r + 40); g.stroke();
  g.strokeStyle = P.cream; g.lineWidth = 2.6;
  g.beginPath(); g.arc(x, cy, r, 0, TAU); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.5); g.lineWidth = 1;
  g.beginPath(); g.arc(x, cy, r * 0.62, 0, TAU); g.stroke();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + t * 0.22;
    g.strokeStyle = alpha(P.creamDim, 0.8); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, cy); g.lineTo(x + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke();
    const cx = x + Math.cos(a) * r, cyy = cy + Math.sin(a) * r;
    g.fillStyle = [P.coral, P.mustard, P.cream][i % 3];
    g.beginPath(); g.ellipse(cx, cyy + 3, 4.4, 5.4, a, 0, TAU); g.fill();
    g.strokeStyle = alpha(P.ink, 0.35); g.lineWidth = 0.8; g.stroke();
  }
  g.fillStyle = P.mustard; g.beginPath(); g.arc(x, cy, 3.4, 0, TAU); g.fill();
  g.restore();
}

function crossStreets(g, t) {
  for (const [x, w, seed] of [[312, 30, 601], [812, 38, 607]]) {
    const y0 = 1078, y1 = 1788;
    const r = rng(seed);
    const pts = [[x - w / 2, y0]];
    for (let i = 1; i < 8; i++) pts.push([x - w / 2 + (r() - 0.5) * 6, lerp(y0, y1, i / 8)]);
    pts.push([x - w / 2, y1], [x + w / 2, y1]);
    for (let i = 7; i >= 1; i--) pts.push([x + w / 2 + (r() - 0.5) * 6, lerp(y0, y1, i / 8)]);
    pts.push([x + w / 2, y0]);
    paperShape(g, { x: x - w / 2 - 6, y: y0, w: w + 12, h: y1 - y0, pts, fill: mix(P.creamDim, P.tealSoft, 0.62), shadow: 7, sx: -3, sy: 6, tex: 0.5, grad: 0.14, edge: 0.18, lw: 1.4 });
    g.save(); g.strokeStyle = alpha(P.creamHi, 0.32); g.lineWidth = 2; g.setLineDash([11, 17]);
    g.beginPath(); g.moveTo(x + 0.5, y0 + 10); g.lineTo(x + 0.5, y1 - 12); g.stroke(); g.setLineDash([]); g.restore();
    for (let i = 0; i < 4; i++) {
      const yy = 1106 + i * 168;
      g.fillStyle = alpha(P.creamHi, 0.2);
      g.fillRect(x - w * 0.3, yy, w * 0.6, 3);
    }
  }
}

function cityBase(g) {
  paperShape(g, { x: -150, y: 1070, w: 1380, h: 1120, path: gg => gg.rect(-150, 1070, 1380, 1120), fill: mix(P.oliveDeep, P.tealDeep, 0.42), shadow: 16, sx: -5, sy: 10, tex: 0.5, grad: 0.16, edge: 0.06 });
}

function city(g, t) {
  cityBase(g);
  drawRowStreetPair(g, t, 0);
  drawRowStreetPair(g, t, 1);
  clockTower(g, 664, 1096);
  domeHall(g, 214, 1326);
  drawRowStreetPair(g, t, 2);
  drawRowStreetPair(g, t, 3);
  ferris(g, 916, 1402, 42, t);
  drawRowStreetPair(g, t, 4);
  river(g, t);
  crossStreets(g, t);
  street(g, STREETS[5], t);
  for (let i = 0; i < 5; i++) {
    const tx = 40 + i * 205 + (i % 2) * 26;
    tree(g, tx, 1758, 1.15 + (i % 3) * 0.22, 1200 + i * 17, i % 2 ? P.olive : P.oliveDeep);
  }
  drawRow(g, ROWS[5], t);
}

function drawRowStreetPair(g, t, i) {
  street(g, STREETS[i], t);
  drawRow(g, ROWS[i], t);
}

export function aerialBackdrop(g, cam, t) {
  layer(g, cam, 0.04, gg => paperSky(gg, { horizon: 1360 }));
  layer(g, cam, 0.09, gg => paperSun(gg, 878, 288, 96, { seed: 8 }));
  layer(g, cam, 0.14, gg => {
    paperCloud(gg, { x: 606, y: 128, w: 330, h: 118, seed: 21, color: P.creamDim, alpha: 0.46, shadow: 12 });
    paperCloud(gg, { x: 40, y: 508, w: 280, h: 102, seed: 27, color: P.creamDim, alpha: 0.38, shadow: 10 });
    paperCloud(gg, { x: 776, y: 612, w: 250, h: 92, seed: 33, color: P.cream, alpha: 0.34, shadow: 9 });
  });
  layer(g, cam, 0.28, gg => {
    paperCloud(gg, { x: -80, y: 916, w: 360, h: 128, seed: 37, color: P.cream, alpha: 0.24, shadow: 10 });
    farStrip(gg);
  });
  layer(g, cam, 0.55, gg => city(gg, t));
  layer(g, cam, 0.62, gg => {
    paperCloud(gg, { x: -160, y: 1078, w: 400, h: 138, seed: 51, color: P.cream, alpha: 0.5, shadow: 15 });
    paperCloud(gg, { x: 748, y: 1148, w: 430, h: 146, seed: 53, color: P.creamDim, alpha: 0.46, shadow: 14 });
  });
  layer(g, cam, 0.44, gg => birds(gg, t));
  layer(g, cam, 0.5, gg => paperDust(gg, t, { n: 18, seed: 12, x: 540, y: 820, spreadX: 1200, spreadY: 1300, size: 2.5, alpha: 0.2 }));
}

export function aerialForeground(g, cam, t) {
  layer(g, cam, 0.88, gg => {
    // near paper roof corner, bottom-left: depth framing
    paperShape(gg, {
      x: -180, y: 1818, w: 520, h: 330,
      pts: tornRectPts(-180, 1818, 520, 330, 971, 5, 6),
      fill: P.ink2, shadow: 24, sx: -8, sy: 14, tex: 0.42, grad: 0.14, edge: 0.1,
    });
    paperShape(gg, { x: -190, y: 1800, w: 540, h: 30, path: g2 => g2.rect(-190, 1800, 540, 30), fill: P.tealSoft, shadow: 12, sx: -5, sy: 9, tex: 0.4, grad: 0.18, edge: 0.14 });
    roofDetails(gg, { x: -110, y: 1826, w: 380, seed: 981, tone: P.creamDim });
    gg.save(); gg.strokeStyle = alpha(P.creamHi, 0.14); gg.lineWidth = 2;
    for (let i = 0; i < 3; i++) { gg.beginPath(); gg.moveTo(-160, 1890 + i * 52); gg.lineTo(320, 1876 + i * 52); gg.stroke(); }
    gg.restore();
    tree(gg, 336, 1834, 1.5, 990, P.oliveDeep);
  });
  layer(g, cam, 1.18, gg => {
    paperCloud(gg, { x: -180, y: 1370, w: 500, h: 220, seed: 61, color: P.cream, alpha: 0.72, shadow: 24 });
    paperCloud(gg, { x: 770, y: 1540, w: 540, h: 250, seed: 67, color: P.creamDim, alpha: 0.66, shadow: 22 });
    paperCloud(gg, { x: 430, y: 1860, w: 460, h: 190, seed: 71, color: P.cream, alpha: 0.5, shadow: 18 });
  });
}
