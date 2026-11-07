// Paper street canyon: layered skyline, near facades, shop, clothesline, foreground awning.
import { E, rng, lerp, alpha, mix, shade, layer, glow } from '/engine/core.js';
import {
  P, paperShape, paperSky, paperCloud, windows, roofDetails, drawBird,
  tornRectPts, ptsPath,
} from '../_paper_kit.js';

export const GY = E.H * 0.78;
const GAP_L = 292, GAP_R = 788;

const FAR = (() => {
  const r = rng(41); const out = []; let x = -320;
  while (x < 1500) {
    const w = 80 + r() * 155, h = 260 + r() * 520;
    out.push({ x, w, h, seed: Math.floor(r() * 9000) });
    x += w + 6 + r() * 22;
  }
  return out;
})();
const MID = (() => {
  const r = rng(77); const out = []; let x = 180;
  while (x < 930) {
    const w = 110 + r() * 130, h = 360 + r() * 430;
    out.push({ x, w, h, seed: Math.floor(r() * 9000) });
    x += w + 10 + r() * 26;
  }
  return out;
})();

function farCity(g, t) {
  for (const b of FAR) {
    const top = 1445 - b.h;
    paperShape(g, {
      x: b.x, y: top, w: b.w, h: b.h,
      path: ptsPath(tornRectPts(b.x, top, b.w, b.h, b.seed, 4, 5)),
      fill: mix(P.ink2, P.sky1, 0.32), shadow: 5, sx: -2, sy: 4, tex: 0.28, grad: 0.12, edge: 0.06, lw: 1,
    });
    windows(g, { x: b.x + b.w * 0.12, y: top + b.h * 0.18, w: b.w * 0.76, h: b.h * 0.6, cols: 3, rows: 6, seed: b.seed, lit: 0.22, dots: true, litColor: P.gold });
  }
  // atmospheric paper band at the horizon
  g.save(); g.globalAlpha = 0.22; g.fillStyle = P.sky3; g.fillRect(-E.W * 0.5, 1390, E.W * 2, 90); g.restore();
}

function midCity(g, t) {
  for (const b of MID) {
    const top = 1448 - b.h;
    paperShape(g, {
      x: b.x, y: top, w: b.w, h: b.h,
      path: ptsPath(tornRectPts(b.x, top, b.w, b.h, b.seed, 6, 6)),
      fill: mix(P.tealDeep, P.teal, 0.55), shadow: 10, sx: -5, sy: 8, tex: 0.36, grad: 0.16, edge: 0.1,
    });
    windows(g, { x: b.x + b.w * 0.13, y: top + b.h * 0.16, w: b.w * 0.74, h: b.h * 0.58, cols: 3, rows: 5, seed: b.seed + 3, lit: 0.34, kx: 0.42, ky: 0.42, glowSize: 6, litColor: P.gold });
    if (b.seed % 3 === 0) {
      const bx = b.x + b.w * 0.2, by = top - 4;
      paperShape(g, { x: bx, y: by - 48, w: 18, h: 48, path: (gg) => gg.rect(bx, by - 48, 18, 48), fill: P.ink2, shadow: 4, sx: -2, sy: 4, tex: 0.3, grad: 0.12, edge: 0.05 });
    } else if (b.seed % 3 === 1) {
      const bx = b.x + b.w * 0.62, by = top - 2;
      paperShape(g, { x: bx, y: by - 32, w: 8, h: 32, path: (gg) => gg.rect(bx, by - 32, 8, 32), fill: P.ink2, shadow: 2, sx: -1, sy: 2, tex: 0.2, grad: 0.05, edge: 0 });
    }
  }
}

function facade(g, left) {
  const x = left ? -420 : GAP_R;
  const w = left ? 712 : 780;
  const top = -240;
  paperShape(g, {
    x, y: top, w, h: 1500 - top,
    path: ptsPath(tornRectPts(x, top, w, 1500 - top, left ? 5 : 9, 4, 7)),
    fill: left ? P.teal : P.ink2, shadow: 22, sx: left ? -8 : 8, sy: 14, tex: 0.42, grad: 0.18, edge: 0.12,
  });
  // vertical paper seams and mouldings
  g.save(); g.strokeStyle = alpha(P.creamHi, 0.08); g.lineWidth = 2;
  for (let i = 1; i < 4; i++) { const sx = x + w * i / 4; g.beginPath(); g.moveTo(sx, top); g.lineTo(sx, 1500); g.stroke(); }
  for (const yy of [80, 260, 620, 980, 1330]) {
    g.strokeStyle = alpha(P.creamDim, 0.16); g.lineWidth = 4;
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke();
  }
  g.restore();
  if (left) {
    windows(g, { x: -240, y: 160, w: 260, h: 760, cols: 2, rows: 5, seed: 13, lit: 0.45, kx: 0.56, ky: 0.52, litColor: P.gold, glowSize: 12 });
    windows(g, { x: 76, y: 640, w: 170, h: 260, cols: 1, rows: 2, seed: 17, lit: 0.6, kx: 0.6, ky: 0.52, litColor: P.gold, glowSize: 12 });
    windows(g, { x: -300, y: 6, w: 400, h: 92, cols: 3, rows: 1, seed: 19, lit: 0.28, kx: 0.52, ky: 0.5, litColor: P.gold, glowSize: 10 });
  } else {
    windows(g, { x: 850, y: 220, w: 300, h: 900, cols: 2, rows: 6, seed: 23, lit: 0.38, kx: 0.54, ky: 0.5, litColor: P.gold, glowSize: 10 });
    windows(g, { x: 1190, y: 700, w: 130, h: 300, cols: 1, rows: 2, seed: 29, lit: 0.5, kx: 0.6, ky: 0.5, litColor: P.gold, glowSize: 10 });
    windows(g, { x: 900, y: -60, w: 430, h: 150, cols: 3, rows: 1, seed: 31, lit: 0.24, kx: 0.54, ky: 0.5, litColor: P.gold, glowSize: 8 });
  }
  // roof caps, only visible when the lift-off camera climbs past the canyon
  paperShape(g, { x: x - 18, y: top - 22, w: w + 36, h: 30, path: (gg) => gg.rect(x - 18, top - 22, w + 36, 30), fill: left ? P.creamDim : P.tealSoft, shadow: 14, sx: -6, sy: 10, tex: 0.5, grad: 0.2, edge: 0.18 });
  roofDetails(g, { x: x + 70, y: top - 22, w: w - 150, seed: left ? 81 : 83, tone: left ? P.cream : P.creamDim });
}

function awning(g, t) {
  const x0 = -70, x1 = 300, y0 = 1000, y1 = 1115;
  const path = (gg) => {
    gg.beginPath();
    gg.moveTo(x0, y0); gg.lineTo(x1, y0 + 22); gg.lineTo(x1, y1);
    const n = 6, step = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const xa = x1 - step * i, xb = x1 - step * (i + 1);
      gg.quadraticCurveTo((xa + xb) / 2, y1 + 34, xb, y1 + (i % 2 ? 6 : 0));
    }
    gg.lineTo(x0, y0 + 10); gg.closePath();
  };
  paperShape(g, { x: x0, y: y0, w: x1 - x0, h: 150, path, fill: P.coralDeep, shadow: 18, sx: -7, sy: 12, tex: 0.45, grad: 0.2, edge: 0.2 });
  g.save(); g.beginPath(); path(g); g.clip();
  for (let i = 0; i < 6; i++) {
    const xa = x0 + (x1 - x0) * i / 6, w = (x1 - x0) / 6;
    if (i % 2 === 0) { g.fillStyle = alpha(P.cream, 0.82); g.fillRect(xa, y0 - 4, w, 180); }
  }
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.4; g.fillStyle = P.creamHi; g.fillRect(x0, y0 - 4, x1 - x0, 180);
  g.restore();
  g.save(); g.strokeStyle = alpha(P.creamHi, 0.28); g.lineWidth = 2;
  g.beginPath(); g.moveTo(x0, y0 + 5); g.lineTo(x1, y0 + 27); g.stroke(); g.restore();
  // shop window under the awning
  paperShape(g, { x: -20, y: 1122, w: 292, h: 312, path: (gg) => gg.rect(-20, 1122, 292, 312), fill: P.gold, shadow: 10, sx: -4, sy: 7, tex: 0.4, grad: 0.18, edge: 0.16, alpha: 0.92 });
  g.save(); g.strokeStyle = alpha(P.ink, 0.65); g.lineWidth = 8; g.strokeRect(-20, 1122, 292, 312);
  g.lineWidth = 4; g.beginPath(); g.moveTo(126, 1122); g.lineTo(126, 1434); g.moveTo(-20, 1278); g.lineTo(272, 1278); g.stroke();
  // tiny paper balloons in the shop window
  for (let i = 0; i < 5; i++) {
    const bx = 8 + i * 53, by = 1370 - (i % 3) * 34;
    g.fillStyle = i % 2 ? P.coral : P.rose; g.beginPath(); g.ellipse(bx, by, 15, 19, -0.15, 0, Math.PI * 2); g.fill();
    g.strokeStyle = alpha(P.ink2, 0.4); g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx, by + 19); g.quadraticCurveTo(bx + 4, by + 30, bx, by + 42); g.stroke();
  }
  g.restore();
  // hanging shop sign (balloon pictogram, no lettering)
  const sx = 198, sy = 910;
  g.save(); g.strokeStyle = alpha(P.ink2, 0.6); g.lineWidth = 3;
  g.beginPath(); g.moveTo(292, 880); g.lineTo(292, 900); g.lineTo(sx, 918); g.stroke();
  g.beginPath(); g.moveTo(sx, 918); g.lineTo(sx, sy); g.stroke();
  paperShape(g, { x: sx - 42, y: sy, w: 84, h: 100, path: (gg) => { gg.beginPath(); gg.moveTo(sx - 42, sy + 6); gg.lineTo(sx + 42, sy); gg.lineTo(sx + 38, sy + 94); gg.lineTo(sx - 38, sy + 100); gg.closePath(); }, fill: P.cream, shadow: 10, sx: -4, sy: 7, tex: 0.55, grad: 0.2, edge: 0.2 });
  g.fillStyle = P.coral; g.beginPath(); g.ellipse(sx, sy + 40, 20, 25, -0.18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = alpha(P.creamHi, 0.45); g.lineWidth = 2; g.beginPath(); g.ellipse(sx - 5, sy + 34, 10, 14, -0.2, Math.PI, Math.PI * 1.7); g.stroke();
  g.strokeStyle = P.ink2; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy + 65); g.quadraticCurveTo(sx + 7, sy + 78, sx, sy + 92); g.stroke();
  g.restore();
  // a couple of paper bolts on the wall
  for (const [bx, by, r] of [[-120, 960, 10], [-86, 1400, 14], [286, 600, 9]]) {
    g.save(); g.fillStyle = alpha(P.ink, 0.28); g.beginPath(); g.arc(bx + 4, by + 5, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.tealSoft; g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = alpha(P.creamHi, 0.25); g.lineWidth = 1.5; g.stroke(); g.restore();
  }
}

function rightAnnex(g, t) {
  const x0 = 760, x1 = 1160, top = 470, base = 1500;
  paperShape(g, {
    x: x0, y: top, w: x1 - x0, h: base - top,
    path: ptsPath(tornRectPts(x0, top, x1 - x0, base - top, 51, 5, 6)),
    fill: mix(P.ink2, P.tealDeep, 0.45), shadow: 20, sx: -10, sy: 15, tex: 0.4, grad: 0.16, edge: 0.1,
  });
  windows(g, { x: 810, y: 640, w: 300, h: 540, cols: 2, rows: 4, seed: 63, lit: 0.38, kx: 0.54, ky: 0.5, litColor: P.gold, glowSize: 10 });
  // roof cap + water tower, a scale marker during the lift
  paperShape(g, { x: x0 - 18, y: top - 16, w: x1 - x0 + 36, h: 30, path: (gg) => gg.rect(x0 - 18, top - 16, x1 - x0 + 36, 30), fill: P.creamDim, shadow: 12, sx: -5, sy: 9, tex: 0.5, grad: 0.2, edge: 0.16 });
  roofDetails(g, { x: x0 + 40, y: top - 16, w: x1 - x0 - 80, seed: 71, tone: P.creamDim });
  const wx = x0 + 96, wy = top - 22;
  paperShape(g, { x: wx - 30, y: wy - 66, w: 60, h: 62, path: (gg) => gg.rect(wx - 30, wy - 66, 60, 62), fill: P.creamDim, shadow: 9, sx: -4, sy: 7, tex: 0.5, grad: 0.2, edge: 0.18 });
  g.strokeStyle = alpha(P.ink, 0.5); g.lineWidth = 3;
  for (const dx of [-20, 20]) { g.beginPath(); g.moveTo(wx + dx, wy - 4); g.lineTo(wx + dx, wy + 18); g.stroke(); }
  g.beginPath(); g.moveTo(wx - 30, wy - 66); g.lineTo(wx, wy - 82); g.lineTo(wx + 30, wy - 66); g.closePath(); g.fillStyle = P.tealSoft; g.fill();
}

function clothesline(g, t) {
  const y0 = 820;
  g.save(); g.strokeStyle = P.creamDim; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(GAP_L - 20, y0); g.quadraticCurveTo((GAP_L + GAP_R) / 2, y0 + 32, GAP_R + 20, y0 - 8); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.32); g.lineWidth = 1; g.beginPath(); g.moveTo(GAP_L - 20, y0 - 1); g.quadraticCurveTo((GAP_L + GAP_R) / 2, y0 + 31, GAP_R + 20, y0 - 9); g.stroke();
  const items = [
    { k: 0.2, c: P.cream, h: 58, w: 44 }, { k: 0.42, c: P.coralSoft, h: 44, w: 34 },
    { k: 0.63, c: P.mustard, h: 64, w: 40 }, { k: 0.82, c: P.creamDim, h: 36, w: 50 },
  ];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], x = lerp(GAP_L, GAP_R, it.k);
    const yy = y0 + Math.sin(it.k * Math.PI) * 26;
    const sway = Math.sin(t * 1.3 + i * 1.7) * 4;
    g.save(); g.translate(x + sway, yy); g.rotate(sway * 0.005);
    paperShape(g, {
      x: -it.w / 2, y: 0, w: it.w, h: it.h,
      path: (gg) => { gg.beginPath(); gg.moveTo(-it.w / 2 + 4, 0); gg.lineTo(it.w / 2, 0); gg.lineTo(it.w / 2 - 3, it.h - 8); gg.quadraticCurveTo(0, it.h, -it.w / 2 + 3, it.h - 10); gg.closePath(); },
      fill: it.c, shadow: 7, sx: -3, sy: 5, tex: 0.45, grad: 0.18, edge: 0.15, alpha: 0.92
    });
    g.fillStyle = P.mustard; g.fillRect(-it.w / 2 + 3, -7, 5, 11); g.fillRect(it.w / 2 - 8, -7, 5, 11);
    g.restore();
  }
  g.restore();
  drawBird(g, lerp(GAP_L, GAP_R, 0.52), y0 + 8, 0.62, t * 7, P.ink2);
}

function pavement(g, t) {
  const y = 1440;
  // sidewalk, curb, road
  paperShape(g, { x: -E.W, y, w: E.W * 3, h: 310, path: (gg) => gg.rect(-E.W, y, E.W * 3, 310), fill: mix(P.creamDim, P.tealSoft, 0.35), shadow: 18, sx: -6, sy: 10, tex: 0.5, grad: 0.2, edge: 0.12 });
  paperShape(g, { x: -E.W, y: 1742, w: E.W * 3, h: 22, path: (gg) => gg.rect(-E.W, 1742, E.W * 3, 22), fill: P.creamDim, shadow: 10, sx: -4, sy: 7, tex: 0.4, grad: 0.2, edge: 0.16 });
  paperShape(g, { x: -E.W, y: 1764, w: E.W * 3, h: 700, path: (gg) => gg.rect(-E.W, 1764, E.W * 3, 700), fill: mix(P.ink2, P.tealDeep, 0.3), shadow: 0, tex: 0.3, grad: 0.14, edge: 0 });
  // pavement seams and cracks
  g.save(); g.strokeStyle = alpha(P.ink2, 0.2); g.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const yy = 1490 + i * 56; g.beginPath(); g.moveTo(-E.W, yy); g.lineTo(E.W * 2, yy + (i % 2 ? 8 : -6)); g.stroke(); }
  for (let i = 0; i < 7; i++) { const xx = -180 + i * 220; g.beginPath(); g.moveTo(xx, 1450); g.lineTo(xx + 8, 1740); g.stroke(); }
  g.strokeStyle = alpha(P.ink, 0.32); g.lineWidth = 2.2;
  for (const [x, y0] of [[380, 1520], [690, 1620], [210, 1680]]) {
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 16, y0 + 22); g.lineTo(x + 5, y0 + 42); g.lineTo(x + 24, y0 + 60); g.stroke();
  }
  g.restore();
  // road markings, receding
  g.save(); g.fillStyle = alpha(P.mustard, 0.55);
  for (let i = 0; i < 4; i++) g.fillRect(420 + i * 48, 1830 + i * 60, 32, 9);
  g.restore();
  // long shadow from the right building
  g.save(); g.globalAlpha = 0.16; g.fillStyle = P.ink;
  g.beginPath(); g.moveTo(1080, 1440); g.lineTo(720, 1440); g.lineTo(60, 1780); g.lineTo(520, 1780); g.closePath(); g.fill(); g.restore();
}

export function streetBackdrop(g, cam, t) {
  layer(g, cam, 0.06, gg => paperSky(gg, { horizon: 1110 }));
  layer(g, cam, 0.16, gg => {
    paperCloud(gg, { x: 80, y: 230, w: 190, h: 72, seed: 3, color: P.creamDim, alpha: 0.55, shadow: 8 });
    paperCloud(gg, { x: 650, y: 380, w: 240, h: 84, seed: 7, color: P.creamDim, alpha: 0.46, shadow: 7 });
    farCity(gg, t);
  });
  layer(g, cam, 0.32, gg => midCity(gg, t));
  layer(g, cam, 0.62, gg => {
    facade(gg, true); facade(gg, false); awning(gg, t); rightAnnex(gg, t); clothesline(gg, t);
  });
  layer(g, cam, 0.9, gg => pavement(gg, t));
  // a warm paper lamp on the right facade
  layer(g, cam, 0.68, gg => {
    const x = 1150, y = 980;
    glow(gg, x, y, 90, P.gold, 0.22);
    paperShape(gg, { x: x - 20, y: y - 26, w: 40, h: 52, path: (g2) => { g2.beginPath(); g2.moveTo(x - 20, y - 20); g2.lineTo(x + 20, y - 20); g2.lineTo(x + 12, y + 26); g2.lineTo(x - 12, y + 26); g2.closePath(); }, fill: P.gold, shadow: 10, sx: -4, sy: 7, tex: 0.45, grad: 0.2, edge: 0.2 });
  });
}

export function streetForeground(g, cam, t, o = {}) {
  if (o.bunting) {
    const y = 140;
    g.save();
    g.strokeStyle = P.creamDim; g.lineWidth = 3; g.beginPath(); g.moveTo(-100, y); g.quadraticCurveTo(520, y + 46, 1180, y - 6); g.stroke();
    const cols = [P.coral, P.cream, P.mustard, P.coralSoft];
    for (let i = 0; i < 9; i++) {
      const x = -40 + i * 140, yy = y + Math.sin((x / 1080) * Math.PI) * 36;
      g.save(); g.translate(x, yy); g.rotate(Math.sin(t * 0.8 + i) * 0.03);
      g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(-28, 0); g.lineTo(28, 0); g.lineTo(0, 58); g.closePath(); g.fill();
      g.strokeStyle = alpha(P.creamHi, 0.22); g.lineWidth = 1.5; g.stroke(); g.restore();
    }
    g.restore();
  }
  // big soft awning corner, bottom left
  const x0 = -260, x1 = 450, y0 = 1740;
  paperShape(g, {
    x: x0, y: y0, w: x1 - x0, h: 420,
    path: (gg) => {
      gg.beginPath(); gg.moveTo(x0, y0); gg.lineTo(x1, y0 - 50); gg.lineTo(x1, y0 + 60);
      const n = 7, step = (x1 - x0) / n;
      for (let i = 0; i < n; i++) { const xa = x1 - step * i, xb = x1 - step * (i + 1); gg.quadraticCurveTo((xa + xb) / 2, y0 + 140, xb, y0 + 65); }
      gg.lineTo(x0, y0 + 90); gg.closePath();
    },
    fill: P.coralDeep, shadow: 24, sx: -10, sy: 16, tex: 0.4, grad: 0.2, edge: 0.15
  });
}
