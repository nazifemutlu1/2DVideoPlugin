// Pip — an original articulated paper-cutout kid.
// Geometry is built from paper strips, brass brads, a cut head and a mustard paper cap.
// No drawFigure() and no reaction-time poses are used.
import { clamp, lerp, rng, ease, shade, alpha } from '/engine/core.js';
import { P, paperShape, softShadow, drawStitch, drawGrip } from './_paper_kit.js';

const D = Math.PI / 180;
const HEAD_R = 43;
const TORSO = 88, UPPER = 54, FORE = 52, THIGH = 53, SHIN = 50;
const HANDLE_W = 44;

export const KID_POSES = {
  brace:   { lean: -7, headTilt: -15, armN: [162, 36], armF: [198, -36], legN: [16, 20], legF: [-14, 12], scarf: 0.35, squash: 0.15, hipDrop: 3 },
  strain:  { lean: -11, headTilt: -19, armN: [155, 42], armF: [205, -42], legN: [27, 32], legF: [-25, 20], scarf: 0.58, squash: 0.4, hipDrop: 9 },
  yank:    { lean: 6, headTilt: 11, armN: [172, 14], armF: [188, -14], legN: [36, 48], legF: [-8, 28], scarf: 0.95, squash: 0, hipDrop: 0 },
  dangle:  { lean: 4, headTilt: 10, armN: [170, 16], armF: [190, -16], legN: [30, 24], legF: [-4, 14], scarf: 0.9, squash: 0, hipDrop: 0 },
  flail:   { lean: -7, headTilt: -3, armN: [150, 48], armF: [210, -48], legN: [55, 24], legF: [-38, 18], scarf: 1, squash: 0, hipDrop: 0 },
  awe:     { lean: 2, headTilt: 7, armN: [168, 18], armF: [192, -18], legN: [22, 20], legF: [-8, 14], scarf: 0.72, squash: 0, hipDrop: 0 },
  pull:    { lean: -5, headTilt: 0, armN: [158, 52], armF: [198, -52], legN: [58, 78], legF: [38, 64], scarf: 0.85, squash: 0, hipDrop: 0 },
  perch:   { lean: 8, headTilt: -5, armN: [150, 38], armF: [106, -20], legN: [74, 92], legF: [58, 74], scarf: 0.55, squash: 0, hipDrop: 0 },
  cheer:   { lean: 2, headTilt: -11, armN: [148, 28], armF: [118, -12], legN: [74, 92], legF: [58, 74], scarf: 0.9, squash: 0, hipDrop: 0 },
};

function mixVal(a, b, k) {
  if (typeof a === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], k));
  return k < 0.5 ? a : b;
}
export function mixPose(a, b, k) {
  const o = {};
  for (const key in a) o[key] = mixVal(a[key], b[key] ?? a[key], k);
  return o;
}
export function poseAt(t, frames, fn = ease.inOut) {
  if (t <= frames[0][0]) return { ...KID_POSES[frames[0][1]] };
  for (let i = 1; i < frames.length; i++) {
    const [t1, name1] = frames[i];
    if (t <= t1) {
      const [t0, name0] = frames[i - 1];
      const k = fn((t - t0) / (t1 - t0));
      return mixPose(KID_POSES[name0], KID_POSES[name1], k);
    }
  }
  return { ...KID_POSES[frames[frames.length - 1][1]] };
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}
function shapePts(g, pts, fill, o = {}) {
  const b = bbox(pts);
  paperShape(g, { ...b, pts, fill, shadow: o.shadow ?? 8, sx: o.sx ?? -4, sy: o.sy ?? 6, tex: o.tex ?? 0.5, grad: o.grad ?? 0.2, edge: o.edge ?? 0.18, lw: o.lw ?? 1.5, alpha: o.alpha ?? 1 });
}
function dir(a) { const r = a * D; return [Math.sin(r), Math.cos(r)]; }
function limbL(start, upper, bend, l1, l2) {
  const d1 = dir(upper), elbow = [start[0] + d1[0] * l1, start[1] + d1[1] * l1];
  const d2 = dir(upper + bend), end = [elbow[0] + d2[0] * l2, elbow[1] + d2[1] * l2];
  return { elbow, end };
}
function strip(g, a, b, w1, w2, fill, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const pts = [
    [a[0] + nx * w1 / 2, a[1] + ny * w1 / 2],
    [b[0] + nx * w2 / 2, b[1] + ny * w2 / 2],
    [b[0] - nx * w2 / 2, b[1] - ny * w2 / 2],
    [a[0] - nx * w1 / 2, a[1] - ny * w1 / 2],
  ];
  shapePts(g, pts, fill, { shadow: o.shadow ?? 7, sx: o.sx ?? -3, sy: o.sy ?? 5, tex: o.tex ?? 0.45, grad: o.grad ?? 0.2, edge: o.edge ?? 0.13, lw: o.lw ?? 1.2, alpha: o.alpha ?? 1 });
}
function brad(g, x, y, r, tone = P.mustard) {
  g.save(); g.fillStyle = tone; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = alpha(P.ink, 0.5); g.lineWidth = Math.max(0.8, r * 0.22); g.stroke();
  g.fillStyle = alpha(P.creamHi, 0.55); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2); g.fill();
  g.restore();
}

export function kidRig(o) {
  const s = o.s ?? 1, face = o.facing ?? 1, t = o.t ?? 0;
  const pose = o.pose || KID_POSES.brace;
  const leanDeg = pose.lean + (o.leanAdd ?? 0) + (o.sway ?? 0) * Math.sin(t * 1.7 + (o.phase ?? 0));
  const r = leanDeg * D;
  const up = [Math.sin(r), -Math.cos(r)], perp = [Math.cos(r), Math.sin(r)];
  const hipL = [0, (pose.hipDrop || 0) + (o.bob || 0)];
  const neckL = [hipL[0] + up[0] * TORSO, hipL[1] + up[1] * TORSO];
  const shoulderL = [neckL[0] - up[0] * 8, neckL[1] - up[1] * 8];
  const shN = [shoulderL[0] + perp[0] * 22, shoulderL[1] + perp[1] * 22];
  const shF = [shoulderL[0] - perp[0] * 22, shoulderL[1] - perp[1] * 22];
  const armOffN = o.armOffN ?? 0, armOffF = o.armOffF ?? 0;
  const armN = limbL(shN, pose.armN[0] + armOffN, pose.armN[1], UPPER, FORE);
  const armF = limbL(shF, pose.armF[0] + armOffF, pose.armF[1], UPPER, FORE);
  const hipN = [hipL[0] + perp[0] * 13, hipL[1] + perp[1] * 13];
  const hipF = [hipL[0] - perp[0] * 13, hipL[1] - perp[1] * 13];
  const legOffN = o.legOffN ?? 0, legOffF = o.legOffF ?? 0;
  const legN = limbL(hipN, pose.legN[0] + legOffN, pose.legN[1], THIGH, SHIN);
  const legF = limbL(hipF, pose.legF[0] + legOffF, pose.legF[1], THIGH, SHIN);
  const headL = [neckL[0] + up[0] * 38, neckL[1] + up[1] * 38];
  const headTurn = o.headAdd ?? 0;
  const headAngle = face * (leanDeg + pose.headTilt + headTurn) * D;
  const W = (p) => [o.x + p[0] * s * face, o.y + p[1] * s];
  const R = (a, b) => {
    const p = W(a), e = W(b.elbow), f = W(b.end);
    return { x: p[0], y: p[1], elbow: { x: e[0], y: e[1] }, end: { x: f[0], y: f[1] } };
  };
  const wArmN = R(shN, armN), wArmF = R(shF, armF), wLegN = R(hipN, legN), wLegF = R(hipF, legF);
  const wHip = W(hipL), wNeck = W(neckL), wHead = W(headL);
  const handMid = { x: (wArmN.end.x + wArmF.end.x) / 2, y: (wArmN.end.y + wArmF.end.y) / 2 };
  const handSpan = Math.hypot(wArmN.end.x - wArmF.end.x, wArmN.end.y - wArmF.end.y);
  const handleAngle = Math.atan2(wArmF.end.y - wArmN.end.y, wArmF.end.x - wArmN.end.x);
  const footLow = Math.max(wLegN.end.y, wLegF.end.y);
  // torso points, world
  const torsoLocal = [
    [neckL[0] + perp[0] * 16, neckL[1] + perp[1] * 16],
    [neckL[0] - up[0] * 10 + perp[0] * 26, neckL[1] - up[1] * 10 + perp[1] * 26],
    [hipL[0] + perp[0] * 18, hipL[1] + perp[1] * 18],
    [hipL[0] - perp[0] * 18, hipL[1] - perp[1] * 18],
    [neckL[0] - up[0] * 10 - perp[0] * 26, neckL[1] - up[1] * 10 - perp[1] * 26],
    [neckL[0] - perp[0] * 16, neckL[1] - perp[1] * 16],
  ];
  const torso = torsoLocal.map(W);
  const bibTop = [neckL[0] - up[0] * 30, neckL[1] - up[1] * 30];
  const bib = [
    W([bibTop[0] + perp[0] * 19, bibTop[1] + perp[1] * 19]),
    W([bibTop[0] - perp[0] * 19, bibTop[1] - perp[1] * 19]),
    W([hipL[0] - perp[0] * 20, hipL[1] - perp[1] * 20]),
    W([hipL[0] + perp[0] * 20, hipL[1] + perp[1] * 20]),
  ];
  return {
    s, facing: face, pose, t,
    hip: { x: wHip[0], y: wHip[1] }, neck: { x: wNeck[0], y: wNeck[1] }, head: { x: wHead[0], y: wHead[1] },
    headR: HEAD_R * s, headAngle,
    armN: wArmN, armF: wArmF, legN: wLegN, legF: wLegF,
    handMid, handSpan, handleAngle, handle: { x: handMid.x, y: handMid.y, w: Math.max(24, Math.min(HANDLE_W, handSpan * 0.92)) * s, angle: handleAngle },
    footLow, torso, bib, hipDrop: pose.hipDrop || 0, scarfAmt: pose.scarf,
    leanDeg, neckLocal: neckL, headLocal: headL,
  };
}

// -- head-local expression art ------------------------------------------------
function eye(g, x, y, rx, ry, face, kind, blink, look) {
  g.save();
  if (blink || kind === 'happy') {
    g.strokeStyle = P.ink; g.lineWidth = 3.2; g.lineCap = 'round';
    g.beginPath();
    if (kind === 'happy') { g.arc(x, y + 3, rx * 1.25, Math.PI * 1.08, Math.PI * 1.92); }
    else { g.moveTo(x - rx, y); g.quadraticCurveTo(x, y + ry * 0.55, x + rx, y); }
    g.stroke();
  } else if (kind === 'squeeze') {
    g.strokeStyle = P.ink; g.lineWidth = 3.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - rx, y - ry * 0.15); g.lineTo(x + rx, y - ry * 0.55); g.stroke();
  } else {
    const wide = kind === 'wide';
    g.fillStyle = P.ink; g.beginPath(); g.ellipse(x, y, rx * (wide ? 1.2 : 1), ry * (wide ? 1.25 : 1), 0, 0, Math.PI * 2); g.fill();
    const lx = face * (look?.[0] ?? 0) * rx * 0.25, ly = (look?.[1] ?? 0) * ry * 0.22;
    g.fillStyle = P.creamHi; g.beginPath(); g.arc(x - rx * 0.3 + lx, y - ry * 0.35 + ly, rx * (wide ? 0.28 : 0.34), 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
function brow(g, x, y, w, ang, col = P.ink) {
  g.save(); g.strokeStyle = col; g.lineWidth = 3.1; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - w / 2, y + ang); g.quadraticCurveTo(x, y - ang * 0.15, x + w / 2, y - ang); g.stroke(); g.restore();
}
function mouth(g, x, y, expr, face) {
  g.save(); g.fillStyle = P.ink; g.strokeStyle = P.ink; g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
  const w = 13;
  if (expr === 'determined') {
    g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y + 4, x + w, y - 1); g.stroke();
  } else if (expr === 'strain') {
    g.fillStyle = P.ink2; g.beginPath(); g.ellipse(x, y, w * 0.8, 6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.cream; g.lineWidth = 1.8;
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * 4.5, y - 4); g.lineTo(x + i * 4.5, y + 4); g.stroke(); }
  } else if (expr === 'scared' || expr === 'awe') {
    const rr = expr === 'scared' ? 7.5 : 5.5;
    g.beginPath(); g.ellipse(x, y, rr * 0.8, rr, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.coralSoft; g.beginPath(); g.ellipse(x, y + rr * 0.45, rr * 0.32, rr * 0.28, 0, 0, Math.PI * 2); g.fill();
  } else if (expr === 'joy') {
    g.fillStyle = P.ink2; g.beginPath(); g.moveTo(x - w, y - 2); g.quadraticCurveTo(x, y + 15, x + w, y - 2); g.quadraticCurveTo(x, y + 5, x - w, y - 2); g.fill();
    g.fillStyle = P.creamHi; g.beginPath(); g.rect(x - w * 0.62, y - 1, w * 1.24, 3.2); g.fill();
  } else {
    g.beginPath(); g.moveTo(x - w * 0.55, y); g.quadraticCurveTo(x, y + 3.5, x + w * 0.55, y - 1); g.stroke();
  }
  g.restore();
}

function drawHead(g, rig, o, expr) {
  const s = rig.s, face = rig.facing, r = HEAD_R * s;
  g.save(); g.translate(rig.head.x, rig.head.y); g.rotate(rig.headAngle);
  const headPts = [
    [-0.78, -0.34], [-0.87, 0.08], [-0.66, 0.5], [-0.3, 0.8], [0.12, 0.86],
    [0.55, 0.64], [0.82, 0.24], [0.82, -0.22], [0.48, -0.7], [0.02, -0.9], [-0.48, -0.82],
  ].map(([x, y]) => [x * r, y * r]);
  // ear on the far side
  const earX = -face * r * 0.88, earY = r * 0.02;
  paperShape(g, { x: earX - r * 0.18, y: earY - r * 0.22, w: r * 0.36, h: r * 0.44, path: (gg) => gg.ellipse(earX, earY, r * 0.16, r * 0.21, face * 0.18, 0, Math.PI * 2), fill: P.creamDim, shadow: 7, sx: -3, sy: 5, tex: 0.45, grad: 0.2, edge: 0.15 });
  shapePts(g, headPts, P.cream, { shadow: 12, sx: -5, sy: 9, tex: 0.55, grad: 0.22, edge: 0.22, lw: 1.8 });
  // hair cap: teal paper fringe over the top
  const hair = [
    [-0.86, -0.18], [-0.9, -0.5], [-0.58, -0.86], [-0.02, -1.0], [0.52, -0.86], [0.86, -0.44], [0.8, -0.06],
    [face * 0.58, -0.38], [face * 0.31, -0.12], [face * 0.04, -0.43], [face * -0.24, -0.08], [face * -0.54, -0.4], [-0.72, -0.1],
  ].map(([x, y]) => [x * r, y * r]);
  shapePts(g, hair, P.ink2, { shadow: 9, sx: -4, sy: 7, tex: 0.4, grad: 0.18, edge: 0.12 });
  // loose paper strands
  g.strokeStyle = P.ink2; g.lineWidth = Math.max(2, r * 0.07); g.lineCap = 'round';
  const flut = o.strandFlutter ?? 0;
  g.beginPath(); g.moveTo(face * r * 0.56, -r * 0.7); g.quadraticCurveTo(face * r * 0.9, -r * (0.86 + flut * 0.12), face * r * 1.03, -r * (0.6 + flut * 0.2)); g.stroke();
  g.beginPath(); g.moveTo(-face * r * 0.5, -r * 0.84); g.quadraticCurveTo(-face * r * 0.8, -r * (0.95 + flut * 0.1), -face * r * 0.92, -r * (0.72 + flut * 0.15)); g.stroke();
  // hat
  const hatLift = o.hatLift ?? 0;
  g.save(); g.rotate(face * hatLift * 0.14);
  const brimTip = face * r * 1.12;
  paperShape(g, {
    x: -r * 0.95, y: -r * 1.35, w: r * 2.2, h: r * 0.75,
    path: (gg) => {
      gg.beginPath();
      gg.moveTo(-r * 0.72, -r * 0.63);
      gg.quadraticCurveTo(-r * 0.62, -r * 1.22, -r * 0.03, -r * 1.28);
      gg.quadraticCurveTo(r * 0.55, -r * 1.3, r * 0.7, -r * 0.58);
      gg.lineTo(brimTip, -r * 0.55);
      gg.quadraticCurveTo(brimTip - face * r * 0.4, -r * 0.35, face * r * 0.48, -r * 0.42);
      gg.lineTo(-r * 0.6, -r * 0.45);
      gg.closePath();
    },
    fill: P.mustard, shadow: 11, sx: -4, sy: 8, tex: 0.55, grad: 0.24, edge: 0.22, lw: 1.7
  });
  g.strokeStyle = alpha(P.ink2, 0.35); g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(-r * 0.5, -r * 0.57); g.quadraticCurveTo(r * 0.02, -r * 0.48, r * 0.52, -r * 0.52); g.stroke();
  drawStitch(g, [[-r * 0.44, -r * 1.04], [r * 0.35, -r * 1.08]], { w: 1.2 * s, dash: [4 * s, 4 * s], alpha: 0.5 });
  g.restore();
  // face
  const look = o.look || [0.25, -0.25];
  const blink = o.blink ?? false;
  const nearX = face * r * 0.29, farX = -face * r * 0.03, eyeY = -r * 0.05;
  const kind = expr === 'scared' ? 'wide' : expr === 'awe' ? 'wide' : expr === 'strain' ? 'squeeze' : expr === 'joy' ? 'happy' : 'normal';
  eye(g, nearX, eyeY, r * 0.115, r * 0.15, face, kind, blink, look);
  eye(g, farX, eyeY - r * 0.02, r * 0.095, r * 0.135, face, kind, blink, look);
  const browY = -r * 0.26;
  if (expr === 'determined') { brow(g, nearX, browY, r * 0.28, r * 0.08); brow(g, farX, browY - r * 0.01, r * 0.24, r * 0.07); }
  else if (expr === 'strain') { brow(g, nearX, browY + r * 0.02, r * 0.26, r * 0.07); brow(g, farX, browY + r * 0.02, r * 0.22, r * 0.06); }
  else if (expr === 'scared' || expr === 'awe') { brow(g, nearX, browY - r * 0.02, r * 0.25, -r * 0.06); brow(g, farX, browY - r * 0.03, r * 0.22, -r * 0.05); }
  else if (expr === 'joy') { brow(g, nearX, browY, r * 0.24, -r * 0.03); brow(g, farX, browY - r * 0.01, r * 0.2, -r * 0.02); }
  else { brow(g, nearX, browY, r * 0.22, r * 0.02); brow(g, farX, browY - r * 0.01, r * 0.18, r * 0.02); }
  // nose and cheek paper tabs
  g.fillStyle = P.coralSoft;
  g.beginPath(); g.moveTo(face * r * 0.61, -r * 0.02); g.lineTo(face * r * 0.7, r * 0.1); g.lineTo(face * r * 0.58, r * 0.12); g.closePath(); g.fill();
  g.fillStyle = alpha(P.coral, 0.18);
  g.beginPath(); g.ellipse(face * r * 0.44, r * 0.18, r * 0.18, r * 0.1, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = alpha(P.ink2, 0.5);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(face * r * (0.34 + i * 0.07), r * 0.24, r * 0.015 + 0.5, 0, Math.PI * 2); g.fill(); }
  mouth(g, face * r * 0.3, r * 0.36, expr, face);
  g.restore();
}

function drawScarfTail(g, rig, o, back) {
  const s = rig.s, t = rig.t, amt = clamp(rig.scarfAmt + (o.scarfBoost ?? 0), 0, 1.3);
  const wind = o.wind || [-0.7, 0.2];
  const wl = Math.hypot(wind[0], wind[1]) || 1;
  const wx = wind[0] / wl, wy = wind[1] / wl;
  const base = [rig.neck.x + (back ? -2 : 2) * s, rig.neck.y + 5 * s];
  const len = (58 + 82 * amt) * s;
  const pts = [];
  const phase = back ? 1.7 : 0;
  for (let i = 0; i <= 6; i++) {
    const k = i / 6;
    const wave = Math.sin(t * 5.2 - k * 3.6 + phase) * (4 + 10 * k) * s * (0.4 + amt);
    pts.push([base[0] + wx * len * k + wave * -wy, base[1] + wy * len * k + wave * wx + (18 * k * k) * s]);
  }
  const nx = -wy, ny = wx;
  const w0 = 13 * s, w1 = 4 * s;
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const k = i / (pts.length - 1), w = lerp(w0, w1, k);
    left.push([pts[i][0] + nx * w / 2, pts[i][1] + ny * w / 2]);
    right.push([pts[i][0] - nx * w / 2, pts[i][1] - ny * w / 2]);
  }
  // V-cut at the tip
  const tip = pts[pts.length - 1];
  const notch = [tip[0] + nx * 2 * s, tip[1] + ny * 2 * s];
  const ribbon = [...left, notch, ...right.reverse()];
  shapePts(g, ribbon, back ? shade(P.mustard, -0.15) : P.mustard, { shadow: back ? 5 : 8, sx: -3, sy: 5, tex: 0.55, grad: 0.2, edge: 0.16, alpha: back ? 0.92 : 1 });
  g.strokeStyle = alpha(P.ink2, 0.22); g.lineWidth = 1.1 * s;
  g.beginPath(); g.moveTo(base[0], base[1]); g.quadraticCurveTo(pts[3][0], pts[3][1], pts[5][0], pts[5][1]); g.stroke();
}

function drawArm(g, rig, far) {
  const s = rig.s, a = far ? rig.armF : rig.armN;
  const sh = { x: a.x, y: a.y }, el = a.elbow, hand = a.end;
  const col = far ? shade(P.cream, -0.12) : P.cream;
  strip(g, [sh.x, sh.y], [el.x, el.y], 19 * s, 16 * s, col, { shadow: 6, sx: -3, sy: 5 });
  strip(g, [el.x, el.y], [hand.x, hand.y], 15 * s, 12 * s, col, { shadow: 5, sx: -3, sy: 4 });
  // teal cuff
  const dx = hand.x - el.x, dy = hand.y - el.y, l = Math.hypot(dx, dy) || 1;
  const cx = hand.x - dx / l * 8 * s, cy = hand.y - dy / l * 8 * s;
  strip(g, [cx, cy], [cx + dx / l * 8 * s, cy + dy / l * 8 * s], 16 * s, 15 * s, far ? P.tealDeep : P.teal, { shadow: 4, sx: -2, sy: 3, tex: 0.35 });
  brad(g, sh.x, sh.y, 3.8 * s, far ? P.creamDim : P.mustard);
  brad(g, el.x, el.y, 3.4 * s, far ? P.creamDim : P.mustard);
  brad(g, cx, cy, 2.8 * s, far ? P.creamDim : P.mustard);
}

function drawLeg(g, rig, far) {
  const s = rig.s, a = far ? rig.legF : rig.legN;
  const hp = { x: a.x, y: a.y }, kn = a.elbow, ft = a.end;
  const pant = far ? shade(P.teal, -0.14) : P.teal;
  strip(g, [hp.x, hp.y], [kn.x, kn.y], 22 * s, 18 * s, pant, { shadow: 7, sx: -3, sy: 6 });
  strip(g, [kn.x, kn.y], [ft.x, ft.y], 17 * s, 14 * s, pant, { shadow: 6, sx: -3, sy: 5 });
  // cuff
  const dx = ft.x - kn.x, dy = ft.y - kn.y, l = Math.hypot(dx, dy) || 1;
  const cx = ft.x - dx / l * 7 * s, cy = ft.y - dy / l * 7 * s;
  strip(g, [cx, cy], [cx + dx / l * 7 * s, cy + dy / l * 7 * s], 16 * s, 15 * s, P.creamDim, { shadow: 4, sx: -2, sy: 3, tex: 0.4 });
  // oversized shoe
  g.save(); g.translate(ft.x, ft.y); g.rotate(Math.atan2(dy, dx) - Math.PI / 2);
  paperShape(g, {
    x: -13 * s, y: -6 * s, w: 30 * s, h: 21 * s,
    path: (gg) => { gg.beginPath(); gg.moveTo(-9 * s, -5 * s); gg.quadraticCurveTo(12 * s, -7 * s, 16 * s, 2 * s); gg.quadraticCurveTo(18 * s, 9 * s, 8 * s, 10 * s); gg.lineTo(-10 * s, 9 * s); gg.quadraticCurveTo(-15 * s, 5 * s, -9 * s, -5 * s); gg.closePath(); },
    fill: far ? P.ink2 : P.ink3, shadow: 8, sx: -3, sy: 5, tex: 0.4, grad: 0.2, edge: 0.14
  });
  g.fillStyle = P.creamDim; g.fillRect(-10 * s, 7 * s, 24 * s, 3.2 * s);
  g.strokeStyle = alpha(P.creamHi, 0.35); g.lineWidth = 1 * s;
  g.beginPath(); g.moveTo(-5 * s, 0); g.lineTo(9 * s, -1 * s); g.stroke();
  g.restore();
  brad(g, kn.x, kn.y, 3.9 * s, far ? P.creamDim : P.mustard);
}

function drawHand(g, rig, far, grip, o) {
  const s = rig.s, a = far ? rig.armF : rig.armN;
  const hand = a.end, el = a.elbow;
  const ang = Math.atan2(hand.y - el.y, hand.x - el.x);
  const col = far ? P.creamDim : P.cream;
  g.save(); g.translate(hand.x, hand.y); g.rotate(ang);
  paperShape(g, {
    x: -9 * s, y: -8 * s, w: 24 * s, h: 22 * s,
    path: (gg) => { gg.beginPath(); gg.moveTo(-6 * s, -7 * s); gg.quadraticCurveTo(10 * s, -10 * s, 13 * s, -2 * s); gg.quadraticCurveTo(15 * s, 6 * s, 7 * s, 8 * s); gg.quadraticCurveTo(-2 * s, 10 * s, -8 * s, 4 * s); gg.quadraticCurveTo(-12 * s, -2 * s, -6 * s, -7 * s); gg.closePath(); },
    fill: col, shadow: 6, sx: -3, sy: 5, tex: 0.5, grad: 0.2, edge: 0.2
  });
  if (grip) {
    g.strokeStyle = alpha(P.ink2, 0.4); g.lineWidth = 1.4 * s; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x = (-2 + i * 4.3) * s;
      g.beginPath(); g.moveTo(x, -5 * s); g.quadraticCurveTo(x + 2 * s, 0, x, 5 * s); g.stroke();
    }
    g.fillStyle = col; g.beginPath(); g.ellipse(7 * s, 5 * s, 4 * s, 3 * s, 0.4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = alpha(P.ink, 0.3); g.lineWidth = 0.8 * s; g.stroke();
  }
  brad(g, -5 * s, 0, 2.2 * s, far ? P.creamDim : P.mustard);
  g.restore();
}

export function drawKid(g, o, rig) {
  rig = rig || kidRig(o);
  const s = rig.s;
  const expr = o.expr || 'determined';
  const showHandle = o.showHandle !== false;
  // back scarf tail
  drawScarfTail(g, rig, o, true);
  // far arm and leg
  drawArm(g, rig, true);
  drawLeg(g, rig, true);
  // shirt
  shapePts(g, rig.torso, P.cream, { shadow: 9, sx: -4, sy: 7, tex: 0.5, grad: 0.22, edge: 0.16 });
  // overalls bib and lower body
  shapePts(g, rig.bib, P.teal, { shadow: 8, sx: -3, sy: 6, tex: 0.45, grad: 0.2, edge: 0.14 });
  // straps over shoulders
  const face = rig.facing;
  const strapL = [rig.torso[0], rig.torso[1], rig.bib[0]];
  const strapR = [rig.torso[4], rig.torso[3], rig.bib[1]];
  g.save(); g.strokeStyle = P.teal; g.lineWidth = 6.2 * s; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(strapL[0][0], strapL[0][1]); g.quadraticCurveTo(strapL[1][0], strapL[1][1], strapL[2][0], strapL[2][1]); g.stroke();
  g.beginPath(); g.moveTo(strapR[0][0], strapR[0][1]); g.quadraticCurveTo(strapR[1][0], strapR[1][1], strapR[2][0], strapR[2][1]); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.3); g.lineWidth = 1.1 * s; g.setLineDash([4 * s, 4 * s]);
  g.beginPath(); g.moveTo(strapL[0][0], strapL[0][1]); g.quadraticCurveTo(strapL[1][0], strapL[1][1], strapL[2][0], strapL[2][1]); g.stroke();
  g.beginPath(); g.moveTo(strapR[0][0], strapR[0][1]); g.quadraticCurveTo(strapR[1][0], strapR[1][1], strapR[2][0], strapR[2][1]); g.stroke();
  g.setLineDash([]); g.restore();
  brad(g, rig.bib[0][0] * 0.5 + rig.bib[1][0] * 0.5, rig.bib[0][1] * 0.5 + rig.bib[1][1] * 0.5, 3.2 * s);
  // pocket
  const bx = (rig.bib[0][0] + rig.bib[1][0]) / 2, by = (rig.bib[0][1] + rig.bib[1][1]) / 2 + 10 * s;
  g.save(); g.fillStyle = alpha(P.cream, 0.7); g.fillRect(bx - 8 * s, by - 1 * s, 16 * s, 10 * s);
  g.strokeStyle = alpha(P.ink2, 0.3); g.lineWidth = 0.9 * s; g.strokeRect(bx - 8 * s, by - 1 * s, 16 * s, 10 * s);
  g.setLineDash([3 * s, 3 * s]); g.beginPath(); g.moveTo(bx - 7 * s, by + 1 * s); g.lineTo(bx + 7 * s, by + 1 * s); g.stroke(); g.setLineDash([]); g.restore();
  // near leg
  drawLeg(g, rig, false);
  // near arm sleeve sits over the torso but under the head
  drawArm(g, rig, false);
  // neck scarf band
  g.save(); g.strokeStyle = P.mustard; g.lineWidth = 9 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(rig.neck.x - 13 * s, rig.neck.y + 2 * s); g.lineTo(rig.neck.x + 13 * s, rig.neck.y + 2 * s); g.stroke();
  g.strokeStyle = alpha(P.creamHi, 0.3); g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(rig.neck.x - 11 * s, rig.neck.y); g.lineTo(rig.neck.x + 11 * s, rig.neck.y); g.stroke();
  g.restore();
  // head
  drawHead(g, rig, o, expr);
  // front scarf tail
  drawScarfTail(g, rig, o, false);
  // far hand (behind grip), handle, near hand
  if (showHandle) {
    drawHand(g, rig, true, true, o);
    drawGrip(g, rig.handle.x, rig.handle.y, rig.handle.w, s, rig.handle.angle);
    drawHand(g, rig, false, true, o);
    // knot where the twine meets the grip
    g.save(); g.fillStyle = P.creamDim; g.beginPath(); g.arc(rig.handle.x, rig.handle.y - 5 * s, 3.2 * s, 0, Math.PI * 2); g.fill(); g.restore();
  } else {
    drawHand(g, rig, true, false, o);
    drawHand(g, rig, false, false, o);
  }
  // tiny paper patch on the far knee
  const kn = rig.legF.elbow;
  g.save(); g.fillStyle = alpha(P.cream, 0.55); g.translate(kn.x, kn.y); g.rotate(-0.3); g.fillRect(-4 * s, -4 * s, 8 * s, 8 * s);
  g.strokeStyle = alpha(P.ink2, 0.28); g.lineWidth = 0.8 * s; g.strokeRect(-4 * s, -4 * s, 8 * s, 8 * s); g.restore();
}

export function drawKidShadow(g, rig, a = 0.28, rx = 62, ry = 15) {
  const x = (rig.legN.end.x + rig.legF.end.x) / 2;
  softShadow(g, x, rig.footLow + 2, rx * rig.s, ry * rig.s, a);
}
