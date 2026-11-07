// s002 — friction insert. Macro paper hands clamp a rolled-paper handle, a knot creaks,
// the heel digs into the sidewalk, then the twine jerks upward on the last beat.
import {
  E, alpha, mix, prog, ease, shake, registerShot, rr, blurLayer,
} from '/engine/core.js';
import {
  P, paperShape, drawStitch, drawTwine, drawKnot, paperDust, tornRectPts,
} from '../_paper_kit.js';
import { streetBackdrop } from '../sets/street.js';

const DUR = 1.7;
const T_UP = 1.14;

function brad(g, x, y, r) {
  g.save();
  g.fillStyle = P.mustard; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = alpha(P.ink, 0.5); g.lineWidth = Math.max(1, r * 0.25); g.stroke();
  g.fillStyle = alpha(P.creamHi, 0.6); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2); g.fill();
  g.restore();
}

function macroHand(g, o) {
  const { x, y, rot = 0, s = 1.55, flip = 1, squeeze = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  // sleeve and cuff
  paperShape(g, { x: -64, y: 168, w: 128, h: 470, path: gg => gg.rect(-64, 168, 128, 470), fill: P.creamDim, shadow: 0, tex: 0.42, grad: 0.14, edge: 0.05 });
  paperShape(g, { x: -72, y: 146, w: 144, h: 58, path: gg => rr(gg, -72, 146, 144, 58, 12), fill: P.teal, shadow: 13, sx: -5, sy: 9, tex: 0.45, grad: 0.2, edge: 0.18 });
  drawStitch(g, [[-58, 160], [58, 152]], { w: 1.7, dash: [6, 5], alpha: 0.45 });
  brad(g, 0, 176, 5.5);
  // back of the hand
  const palm = (gg) => {
    gg.beginPath(); gg.moveTo(-58, 24);
    gg.quadraticCurveTo(-76, 92, -44, 154);
    gg.quadraticCurveTo(0, 178, 44, 154);
    gg.quadraticCurveTo(76, 92, 58, 24);
    gg.quadraticCurveTo(0, 8, -58, 24); gg.closePath();
  };
  paperShape(g, { x: -76, y: 8, w: 152, h: 172, path: palm, fill: P.cream, shadow: 20, sx: -7, sy: 12, tex: 0.55, grad: 0.22, edge: 0.18, lw: 2 });
  g.save(); g.strokeStyle = alpha(P.ink2, 0.2); g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-28, 70); g.quadraticCurveTo(0, 84, 32, 66); g.stroke();
  g.beginPath(); g.moveTo(-34, 102); g.quadraticCurveTo(-4, 114, 20, 98); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.5); g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-46, 40); g.quadraticCurveTo(-60, 96, -36, 142); g.stroke();
  g.restore();
  // fingers reach up behind the handle: only their tips clear its top edge
  const lift = squeeze * 4.2;
  for (let i = 0; i < 4; i++) {
    const fx = (i - 1.5) * 27;
    const finger = (gg) => {
      gg.beginPath();
      gg.moveTo(fx - 12, 44);
      gg.quadraticCurveTo(fx - 15, -34 - lift, fx + 1, -50 - lift);
      gg.quadraticCurveTo(fx + 16, -34 - lift, fx + 13, 44);
      gg.closePath();
    };
    paperShape(g, { x: fx - 16, y: -54 - lift, w: 32, h: 100, path: finger, fill: i % 2 ? P.cream : P.creamHi, shadow: 10, sx: -4, sy: 7, tex: 0.5, grad: 0.2, edge: 0.16 });
    g.save(); g.strokeStyle = alpha(P.ink2, 0.28); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(fx - 8, -39 - lift); g.quadraticCurveTo(fx, -34 - lift, fx + 8, -39 - lift); g.stroke();
    g.strokeStyle = alpha(P.creamHi, 0.6); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(fx - 3, -47 - lift); g.lineTo(fx + 4, -47 - lift); g.stroke();
    g.restore();
  }
  g.restore();
}

function macroThumb(g, o) {
  const { x, y, rot = 0, s = 1.55, flip = 1, squeeze = 0 } = o;
  const lift = squeeze * 4.2;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const tx = flip * 38;
  const thumb = (gg) => {
    gg.beginPath();
    gg.moveTo(tx - 28, 88);
    gg.quadraticCurveTo(tx - 36, 24, tx - 12, -16 - lift);
    gg.quadraticCurveTo(tx, -36 - lift, tx + 16, -30 - lift);
    gg.quadraticCurveTo(tx + 30, -24 - lift, tx + 24, -2 - lift);
    gg.quadraticCurveTo(tx + 10, 26, tx + 18, 68);
    gg.quadraticCurveTo(tx + 2, 98, tx - 28, 88);
    gg.closePath();
  };
  paperShape(g, { x: tx - 40, y: -42 - lift, w: 78, h: 146, path: thumb, fill: P.cream, shadow: 15, sx: -5, sy: 9, tex: 0.5, grad: 0.22, edge: 0.2 });
  g.save(); g.strokeStyle = alpha(P.ink2, 0.22); g.lineWidth = 1.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(tx - 8, -12 - lift); g.quadraticCurveTo(tx + 8, 8, tx + 6, 36); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.5); g.lineWidth = 2; g.beginPath();
  g.moveTo(tx - 20, 58); g.quadraticCurveTo(tx - 24, 20, tx - 10, -10 - lift); g.stroke();
  g.restore();
  drawStitch(g, [[tx - 22, 64], [tx - 8, 6 - lift]], { w: 1.1, dash: [3.5, 4], alpha: 0.35 });
  g.restore();
}

function shoe(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.save(); g.strokeStyle = alpha(P.creamHi, 0.35); g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-30, -26); g.quadraticCurveTo(-52, 6, -46, 34); g.stroke();
  g.restore();
  const body = (gg) => {
    gg.beginPath(); gg.moveTo(-72, -8);
    gg.quadraticCurveTo(-60, -34, -16, -30);
    gg.quadraticCurveTo(28, -26, 52, -6);
    gg.quadraticCurveTo(82, 8, 78, 44);
    gg.quadraticCurveTo(74, 72, 42, 70);
    gg.lineTo(-62, 66); gg.quadraticCurveTo(-78, 40, -72, -8); gg.closePath();
  };
  paperShape(g, { x: -80, y: -36, w: 164, h: 110, path: body, fill: P.ink3, shadow: 26, sx: -9, sy: 15, tex: 0.5, grad: 0.2, edge: 0.14 });
  paperShape(g, { x: -76, y: 52, w: 158, h: 36, path: gg => rr(gg, -76, 52, 158, 36, 17), fill: P.creamDim, shadow: 12, sx: -5, sy: 8, tex: 0.5, grad: 0.2, edge: 0.16 });
  paperShape(g, { x: 22, y: 72, w: 62, h: 52, path: gg => gg.rect(22, 72, 62, 52), fill: P.ink2, shadow: 14, sx: -5, sy: 9, tex: 0.4, grad: 0.18, edge: 0.1 });
  paperShape(g, { x: -46, y: -56, w: 84, h: 34, path: gg => rr(gg, -46, -56, 84, 34, 10), fill: P.creamDim, shadow: 9, sx: -3, sy: 6, tex: 0.5, grad: 0.2, edge: 0.18 });
  drawStitch(g, [[-38, -44], [28, -46]], { w: 1.2, dash: [4, 4], alpha: 0.45 });
  g.save(); g.strokeStyle = alpha(P.creamDim, 0.3); g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-36 + i * 26, -18); g.quadraticCurveTo(-28 + i * 26, 4, -34 + i * 26, 20); g.stroke(); }
  g.restore();
  g.fillStyle = alpha(P.creamHi, 0.14);
  g.beginPath(); g.ellipse(-36, 6, 22, 9, -0.2, 0, Math.PI * 2); g.fill();
  g.restore();
}

registerShot('s002', {
  draw(g, t) {
    const jerk = ease.out(prog(t, T_UP, T_UP + 0.12));
    const settle = t > T_UP + 0.12 ? Math.exp(-(t - T_UP - 0.12) * 3.4) : 0;
    const bgCam = { x: 66, y: -250, z: 1.88, r: 0.025 };
    blurLayer(g, 6.5, gg => streetBackdrop(gg, bgCam, 2.85 + t));
    g.save(); g.fillStyle = 'rgba(8,22,28,0.46)'; g.fillRect(0, 0, E.W, E.H);
    const warm = g.createRadialGradient(548, 940, 70, 548, 940, 640);
    warm.addColorStop(0, 'rgba(255,226,174,.24)'); warm.addColorStop(0.55, 'rgba(255,210,150,.08)'); warm.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = warm; g.fillRect(0, 0, E.W, E.H); g.restore();

    const [shx, shy] = shake(t, 1.6 + 4.4 * settle, 11, 5);
    g.save();
    g.translate(540, 960); g.rotate(-0.007 * jerk); g.scale(1 + 0.05 * ease.inOut(prog(t, 0, DUR)), 1 + 0.05 * ease.inOut(prog(t, 0, DUR))); g.translate(-540, -960);
    g.translate(shx, shy - 17 * jerk);

    // sidewalk sheet, foreground paper floor
    paperShape(g, {
      x: -90, y: 1512, w: 1260, h: 640,
      pts: tornRectPts(-90, 1512, 1260, 640, 321, 5, 9),
      fill: mix(P.creamDim, P.tealSoft, 0.42), shadow: 24, sx: -8, sy: 13, tex: 0.6, grad: 0.18, edge: 0.13,
    });
    g.save(); g.strokeStyle = alpha(P.ink2, 0.24); g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-60, 1602); g.lineTo(1150, 1576); g.stroke();
    g.beginPath(); g.moveTo(210, 1512); g.lineTo(196, 1920); g.stroke();
    g.beginPath(); g.moveTo(760, 1534); g.lineTo(742, 1920); g.stroke();
    g.strokeStyle = alpha(P.ink, 0.4); g.lineWidth = 2.6;
    for (const [cx, cy, dx, dy] of [[284, 1730, -46, 38], [284, 1730, 58, 30], [284, 1730, 34, 74], [284, 1730, -80, -12]]) {
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + dx * 0.5, cy + dy * 0.5, cx + dx, cy + dy); g.stroke();
    }
    g.fillStyle = alpha(P.ink, 0.26);
    g.beginPath(); g.ellipse(512, 1778, 84, 19, 0.14, 0, Math.PI * 2); g.fill();
    g.restore();

    shoe(g, 470, 1655, 1.45, 0.26);

    // cracks spreading from under the heel
    g.save(); g.strokeStyle = alpha(P.ink, 0.5); g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pts of [
      [[570, 1760], [610, 1772], [600, 1792], [634, 1802]],
      [[560, 1790], [590, 1818], [582, 1846]],
      [[370, 1752], [330, 1764], [340, 1786], [308, 1798]],
      [[430, 1810], [416, 1840], [438, 1862]],
    ]) {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    }
    g.fillStyle = alpha(P.creamHi, 0.7);
    g.fillRect(566, 1748, 8, 3); g.fillRect(346, 1750, 6, 3);
    g.restore();

    macroHand(g, { x: 384, y: 978, rot: 0.23, s: 1.55, flip: 1, squeeze: jerk });
    macroHand(g, { x: 700, y: 972, rot: -0.23, s: 1.55, flip: -1, squeeze: jerk });

    // twine + knot, the focus point
    const wob = (1 - jerk) * Math.sin(t * 5.2) * 13 + settle * Math.sin(t * 46) * 7;
    drawTwine(g, [[538, 952], [538 + wob, 640], [560 - wob, 320], [574 + wob * 0.4, -140]], { w: 9, color: P.creamDim });

    // rolled-paper handle, wide enough that both ends clear the fists
    g.save(); g.translate(538, 960); g.rotate(0.04);
    paperShape(g, { x: -390, y: -26, w: 780, h: 52, path: gg => rr(gg, -390, -26, 780, 52, 26), fill: P.creamDim, shadow: 24, sx: -8, sy: 13, tex: 0.55, grad: 0.22, edge: 0.22 });
    g.save(); g.strokeStyle = alpha(P.ink2, 0.28); g.lineWidth = 1.6;
    for (let i = 0; i < 11; i++) { g.beginPath(); g.moveTo(-350 + i * 70, -24); g.lineTo(-330 + i * 70, 24); g.stroke(); }
    g.strokeStyle = alpha(P.creamHi, 0.35); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-366, -13); g.lineTo(366, -13); g.stroke();
    g.strokeStyle = alpha(P.creamHi, 0.5); g.lineWidth = 2.2; g.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      for (let x = -356; x <= 356; x += 8) g.lineTo(x, -2 + i * 10 + Math.sin(x * 0.045 + i * 2) * 1.8);
      g.stroke();
    }
    g.restore();
    paperShape(g, { x: -392, y: -26, w: 36, h: 52, path: gg => gg.ellipse(-374, 0, 18, 26, 0, 0, Math.PI * 2), fill: P.cream, shadow: 9, sx: -3, sy: 6, tex: 0.5, grad: 0.2, edge: 0.2 });
    paperShape(g, { x: 356, y: -26, w: 36, h: 52, path: gg => gg.ellipse(374, 0, 18, 26, 0, 0, Math.PI * 2), fill: P.cream, shadow: 9, sx: -3, sy: 6, tex: 0.5, grad: 0.2, edge: 0.2 });
    g.save(); g.strokeStyle = alpha(P.ink2, 0.34); g.lineWidth = 1.4;
    const spiral = (cx, dir) => {
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(cx, 0, 4 + i * 3.6, 5 + i * 4.8, 0, dir > 0 ? -1.2 : 1.9, dir > 0 ? 1.4 : 4.5);
        g.stroke();
      }
    };
    spiral(-374, 1); spiral(374, -1);
    g.strokeStyle = alpha(P.creamHi, 0.55); g.lineWidth = 2;
    g.beginPath(); g.arc(-374, 0, 15, -2.4, -0.2); g.stroke();
    g.beginPath(); g.arc(374, 0, 15, 0.6, 2.8); g.stroke();
    g.restore();
    g.restore();

    drawKnot(g, 538, 944, 2.5, -0.18 + wob * 0.006);
    g.save(); g.strokeStyle = alpha(P.creamHi, 0.4); g.lineWidth = 2;
    g.beginPath(); g.arc(538, 944, 24, -0.4, 2.2); g.stroke(); g.restore();

    macroThumb(g, { x: 384, y: 978, rot: 0.23, s: 1.55, flip: 1, squeeze: jerk });
    macroThumb(g, { x: 700, y: 972, rot: -0.23, s: 1.55, flip: -1, squeeze: jerk });

    // slack fibres snapping from the knot
    const fib = prog(t, T_UP + 0.03, T_UP + 0.42);
    if (fib > 0 && fib < 1) {
      g.save(); g.globalAlpha = (1 - fib) * 0.85; g.strokeStyle = P.creamHi; g.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.27, d = 26 + fib * 100;
        g.lineWidth = 1.4 + (i % 3) * 0.6;
        g.beginPath(); g.moveTo(538 + Math.cos(a) * 18, 944 + Math.sin(a) * 18);
        g.lineTo(538 + Math.cos(a) * d, 944 + Math.sin(a) * d - fib * 44); g.stroke();
      }
      g.restore();
    }
    paperDust(g, t, { n: 30, seed: 3, x: 380, y: 1680, spreadX: 420, spreadY: 230, size: 4.2, alpha: 0.26 + 0.2 * jerk, color: P.creamDim });
    paperDust(g, t, { n: 16, seed: 6, x: 540, y: 900, spreadX: 280, spreadY: 190, size: 3, alpha: 0.24 + 0.2 * jerk });
    g.restore();
  },
});
