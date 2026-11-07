// scenes/robot.js — TIB: an original articulated 2.5D field-survey robot built for this project.
// Local space: feet on y = 0, up is -y, the robot faces +x. Height ≈ 344 units.
// The rig is procedural: 2-bone IK for arms/legs, a leaning torso, a separately hinged head,
// visible ball/hinge joints, and a two-hand star cradle. No drawFigure() is used.
import {
  E, clamp, lerp, rng, ease, alpha, shade, mix, seg, circle, ring, rr, poly,
  glow, linGrad, radGrad, noise,
} from '/engine/core.js';

const D = Math.PI / 180;
const TAU = Math.PI * 2;
const ARM1 = 52, ARM2 = 50;
const THIGH = 58, SHIN = 56;
const BOOT_H = 22;

export const PAL = {
  shell: '#2f6a68',
  shellHi: '#76b7a5',
  shellLo: '#1a464c',
  shellDeep: '#102e36',
  copper: '#c07a49',
  copperHi: '#e9aa72',
  copperLo: '#7c462b',
  joint: '#3a3330',
  jointLo: '#1b1819',
  glass: '#060f15',
  glass2: '#0b2029',
  eye: '#86f5e2',
  eyeDeep: '#25b7b2',
  eyeCore: '#effffb',
  warm: '#ffc879',
  warmHi: '#fff3d4',
  boot: '#263235',
  bootHi: '#4b5d5e',
  cream: '#e6dac2',
};

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const len = (x, y) => Math.hypot(x, y) || 1;
const norm = (x, y) => { const l = len(x, y); return [x / l, y / l]; };

// ---------------------------------------------------------------- poses
export const BASE = {
  hipY: 0, hipX: 0, lean: 0, headTilt: 0, headX: 0,
  star: [38, -140], eyeOpen: 0.82, happy: 0, blink: 0, mouthOpen: 0, smile: 0.25,
  brow: 0, footN: 0, footF: 0, squash: 0, shoulderLift: 0,
};
export const P = (o = {}) => ({ ...BASE, ...o });
const POSE_FIELDS_NUM = ['hipY', 'hipX', 'lean', 'headTilt', 'headX', 'eyeOpen', 'happy', 'blink', 'mouthOpen', 'smile', 'brow', 'footN', 'footF', 'squash', 'shoulderLift'];
function mixPose(a, b, k) {
  const o = {};
  for (const f of POSE_FIELDS_NUM) o[f] = lerp(a[f], b[f], k);
  o.star = [lerp(a.star[0], b.star[0], k), lerp(a.star[1], b.star[1], k)];
  return o;
}
// poseAt(t, [[0, P({...})], [1.3, P({...})], ...]) with eased holds
export function poseAt(t, frames, fn = ease.inOut) {
  if (t <= frames[0][0]) return { ...frames[0][1] };
  for (let i = 1; i < frames.length; i++) {
    const [t1, p1] = frames[i];
    if (t <= t1) {
      const [t0, p0] = frames[i - 1];
      const k = fn((t - t0) / Math.max(0.0001, t1 - t0));
      return mixPose(p0, p1, k);
    }
  }
  return { ...frames[frames.length - 1][1] };
}

// ---------------------------------------------------------------- geometry helpers
function ik2(a, b, l1, l2, bend = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy);
  d = clamp(d, 0.001, l1 + l2 - 0.01);
  const ang = Math.atan2(dy, dx) - bend * Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
}
// Catmull-Rom -> cubic bezier closed/open path. Points are world/local arrays.
function spline(g, pts, closed = true) {
  const n = pts.length;
  if (n < 3) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); if (closed) g.closePath(); return; }
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i % n], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    g.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1],
    );
  }
  if (closed) g.closePath();
}
function limb(g, a, b, w1, w2, fill, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = len(dx, dy);
  const nx = -dy / l, ny = dx / l;
  const mid1 = [a[0] + nx * w1 * 0.18, a[1] + ny * w1 * 0.18];
  const mid2 = [b[0] + nx * w2 * 0.18, b[1] + ny * w2 * 0.18];
  seg(g, [[a[0] + 3, a[1] + 4], [b[0] + 3, b[1] + 4]], w1 + 2, alpha('#000000', o.shadow ?? 0.33));
  seg(g, [a, b], w1, fill, 'round');
  seg(g, [mid1, mid2], w1 * 0.22, alpha('#ffffff', o.hi ?? 0.13));
  const r1 = [a[0] - nx * w1 * 0.32, a[1] - ny * w1 * 0.32];
  const r2 = [b[0] - nx * w2 * 0.32, b[1] - ny * w2 * 0.32];
  seg(g, [r1, r2], Math.max(1.2, w1 * 0.09), alpha(o.rim ?? PAL.eye, o.rimA ?? 0.34));
}
function bolt(g, x, y, r, tone = PAL.copper) {
  circle(g, x, y, r, tone);
  circle(g, x - r * 0.25, y - r * 0.3, r * 0.3, alpha('#ffffff', 0.45));
  g.strokeStyle = alpha('#000000', 0.35); g.lineWidth = Math.max(0.6, r * 0.18); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
}

// ---------------------------------------------------------------- rig
export function buildRig(pose, t) {
  const bob = Math.sin(t * 1.9 + 0.5) * 1.15 + Math.sin(t * 3.3 + 1.2) * 0.3;
  const sway = Math.sin(t * 0.83 + 0.4) * 1.0;
  const hip = [pose.hipX + sway * 0.55, -118 + pose.hipY + bob + pose.squash * 6];
  const lean = (pose.lean + Math.sin(t * 0.66 + 0.2) * 0.35) * D;
  const up = [Math.sin(lean), -Math.cos(lean)];
  const perp = [Math.cos(lean), Math.sin(lean)];
  const neck = add(hip, up, 88);
  const head = add(add(neck, up, 86), perp, pose.headX);
  const headAngle = (pose.headTilt + Math.sin(t * 0.92 + 1.1) * 0.65) * D;

  const shN = add(add(neck, perp, 36), up, pose.shoulderLift);
  const shF = add(add(neck, perp, -36), up, pose.shoulderLift);
  const hipN = add(hip, perp, 23);
  const hipF = add(hip, perp, -23);
  const footN = [28 + pose.footN, 0];
  const footF = [-28 + pose.footF, 0];
  const ankleN = [footN[0], -BOOT_H], ankleF = [footF[0], -BOOT_H];
  const kneeN = ik2(hipN, ankleN, THIGH, SHIN, 1);
  const kneeF = ik2(hipF, ankleF, THIGH, SHIN, 1);

  const star = pose.star;
  const wristN = [star[0] + 28, star[1] + 21];
  const wristF = [star[0] - 28, star[1] + 21];
  const elbN = ik2(shN, wristN, ARM1, ARM2, 1);
  const elbF = ik2(shF, wristF, ARM1, ARM2, -1);

  return {
    hip, neck, head, headAngle, up, perp,
    shN, shF, hipN, hipF, footN, footF, ankleN, ankleF, kneeN, kneeF,
    wristN, wristF, elbN, elbF, star,
    starR: 20,
  };
}

// ---------------------------------------------------------------- star
export function drawStar(g, x, y, t, I = 1, r = 20) {
  I = clamp(I, 0, 1.8);
  const pulse = 1 + 0.055 * Math.sin(t * 2.3) + 0.03 * Math.sin(t * 5.1 + 1.3);
  const rr0 = r * pulse;
  const flick = 0.86 + 0.14 * Math.sin(t * 7.3 + 0.6);
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = 'lighter';
  // broad atmospheric bloom
  glow(g, 0, 0, rr0 * 10.5, '#ff9c4b', 0.085 * I);
  glow(g, 0, 0, rr0 * 5.2, '#ffbf68', 0.2 * I);
  glow(g, 0, 0, rr0 * 2.6, '#ffe0a0', 0.36 * I * flick);
  g.restore();

  g.save(); g.translate(x, y);
  // long soft light spikes
  g.globalCompositeOperation = 'lighter';
  g.rotate(0.18 + Math.sin(t * 0.35) * 0.04);
  for (const [ang, l, w, a] of [
    [0, rr0 * 9.5, rr0 * 0.11, 0.34], [Math.PI / 2, rr0 * 7.2, rr0 * 0.08, 0.26],
    [Math.PI / 4, rr0 * 4.4, rr0 * 0.05, 0.18], [-Math.PI / 4, rr0 * 4.4, rr0 * 0.05, 0.18],
  ]) {
    g.save(); g.rotate(ang);
    g.fillStyle = linGrad(g, 0, 0, l, 0, [alpha('#fff3ce', a * I), alpha('#ffc16a', a * 0.4 * I), alpha('#ff9a44', 0)]);
    g.beginPath(); g.moveTo(0, -w); g.lineTo(l, 0); g.lineTo(0, w); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();

  // star body
  g.save(); g.translate(x, y); g.rotate(t * 0.22);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? rr0 : rr0 * 0.43;
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  spline(g, pts, true);
  g.fillStyle = radGrad(g, 0, 0, 0, rr0 * 1.05, [
    [0, '#ffffff'], [0.22, '#fffbe8'], [0.5, '#ffdf9c'], [0.8, '#ffb45f'], [1, '#f28a3e'],
  ]);
  g.fill();
  g.lineJoin = 'round'; g.lineWidth = rr0 * 0.16; g.strokeStyle = '#ffca76'; g.stroke();
  // inner white-hot core
  circle(g, -rr0 * 0.06, -rr0 * 0.08, rr0 * 0.36, alpha('#ffffff', 0.95));
  glow(g, 0, 0, rr0 * 1.7, '#fff7df', 0.8 * I);
  g.rotate(-t * 0.22);
  // tiny 4-point flare
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + t * 0.15;
    const L = rr0 * (i % 2 ? 2.6 : 4.2);
    g.save(); g.rotate(a);
    g.fillStyle = linGrad(g, 0, 0, L, 0, [alpha('#ffffff', 0.9), alpha('#ffe4a8', 0.25), alpha('#ffd080', 0)]);
    g.beginPath(); g.moveTo(0, -rr0 * 0.08); g.lineTo(L, 0); g.lineTo(0, rr0 * 0.08); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();

  // orbiting motes
  g.save(); g.translate(x, y); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const a = t * (0.7 + i * 0.1) + i * 1.73;
    const d = rr0 * (2.1 + 0.35 * Math.sin(t * 1.7 + i));
    const mx = Math.cos(a) * d, my = Math.sin(a) * d * 0.62;
    circle(g, mx, my, 1.1 + 0.65 * Math.sin(t * 3 + i), alpha('#ffe9b0', (0.35 + 0.4 * Math.sin(t * 2.4 + i)) * I));
    glow(g, mx, my, rr0 * 0.5, '#ffd27a', 0.25 * I);
  }
  g.restore();

  // edge sparkles
  for (let i = 0; i < 3; i++) {
    const a = t * 0.9 + i * 2.1;
    const d = rr0 * (1.15 + 0.1 * Math.sin(t * 2 + i));
    const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * 0.9;
    const s = rr0 * (0.18 + 0.1 * Math.max(0, Math.sin(t * 3.1 + i * 2)));
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = alpha('#fff6d8', 0.65 * I); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx + s, sy); g.moveTo(sx, sy - s); g.lineTo(sx, sy + s); g.stroke();
    g.restore();
  }
  return { r: rr0 };
}

// ---------------------------------------------------------------- head
function drawEar(g, x, y, near) {
  const s = near ? 1 : 0.9;
  g.save(); g.translate(x, y); g.scale(s, s);
  circle(g, 0, 0, 17, PAL.jointLo);
  ring(g, 0, 0, 17, 2, alpha(near ? PAL.copperHi : PAL.copperLo, 0.75));
  circle(g, 0, 0, 12.5, linGrad(g, -10, -10, 10, 10, [PAL.copperHi, PAL.copper, PAL.copperLo]));
  circle(g, 0, 0, 8.4, PAL.joint);
  ring(g, 0, 0, 8.4, 1.4, alpha(PAL.copperHi, 0.6));
  circle(g, 0, 0, 4.1, alpha(PAL.eye, near ? 0.95 : 0.55));
  if (near) glow(g, 0, 0, 18, PAL.eye, 0.5);
  bolt(g, -5.5, -6.5, 1.4, PAL.copperHi);
  bolt(g, 5.5, 6.5, 1.4, PAL.copperLo);
  g.restore();
}

function drawEye(g, cx, cy, open, happy, look, warm) {
  const rx = 8.6, ry = 11.2;
  open = clamp(open, 0.04, 1.25);
  if (happy > 0.55) {
    const k = clamp((happy - 0.55) / 0.45);
    g.save(); g.globalAlpha *= k;
    g.strokeStyle = PAL.eye; g.lineWidth = 4.2; g.lineCap = 'round';
    g.shadowColor = alpha(PAL.eye, 0.9); g.shadowBlur = 14;
    g.beginPath(); g.arc(cx, cy + 4, rx * 1.15, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.restore();
    return;
  }
  const openAmt = open * (1 - happy * 0.5);
  const eh = ry * openAmt;
  g.save();
  // recessed socket
  g.fillStyle = alpha('#000000', 0.45);
  g.beginPath(); g.ellipse(cx, cy, rx * 1.45, ry * 1.2, 0, 0, TAU); g.fill();
  if (eh < 2.2) {
    g.strokeStyle = alpha(PAL.eye, 0.9); g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - rx * 0.8, cy); g.lineTo(cx + rx * 0.8, cy); g.stroke();
    g.restore(); return;
  }
  // glow halo
  glow(g, cx, cy, 21, PAL.eye, 0.38);
  // luminous capsule/lens
  const gx = clamp(look[0], -1, 1) * 2.6, gy = clamp(look[1], -1, 1) * 2.2;
  g.save(); g.translate(gx, gy);
  rr(g, cx - rx, cy - eh / 2, rx * 2, eh, Math.min(rx, eh / 2));
  g.fillStyle = radGrad(g, cx, cy - eh * 0.1, 0, rx * 1.25, [
    [0, PAL.eyeCore], [0.34, '#d9fffa'], [0.64, PAL.eye], [0.86, PAL.eyeDeep], [1, '#106e72'],
  ]);
  g.fill();
  g.strokeStyle = alpha('#ffffff', 0.45); g.lineWidth = 0.9; g.stroke();
  // pupil lens + specular
  const pr = Math.min(rx * 0.58, eh * 0.34);
  circle(g, cx, cy, pr, alpha('#06343c', 0.42));
  circle(g, cx - rx * 0.28, cy - eh * 0.2, pr * 0.34, alpha('#ffffff', 0.85));
  circle(g, cx + rx * 0.36, cy + eh * 0.16, pr * 0.16, alpha('#ffffff', 0.4));
  // warm star reflection at the lower rim
  if (warm > 0.1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radGrad(g, cx, cy + eh * 0.45, 0, rx * 1.1, [alpha(PAL.warmHi, 0.55 * warm), alpha(PAL.warm, 0)]);
    g.beginPath(); g.ellipse(cx, cy + eh * 0.34, rx * 1.05, eh * 0.36, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.restore();
  g.restore();
}

function drawMouth(g, cx, cy, open, smile, warm) {
  g.save();
  if (open > 0.06) {
    const w = 5.2 + 5.4 * open, h = 3.4 + 9.5 * open;
    g.fillStyle = '#04161b';
    g.beginPath(); g.ellipse(cx, cy, w, h, 0, 0, TAU); g.fill();
    g.strokeStyle = alpha(PAL.eye, 0.9); g.lineWidth = 1.7; g.stroke();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radGrad(g, cx, cy + h * 0.2, 0, w * 1.6, [alpha(PAL.warm, 0.55 * warm), alpha(PAL.warm, 0)]);
    g.beginPath(); g.ellipse(cx, cy + h * 0.25, w * 0.9, h * 0.7, 0, 0, TAU); g.fill();
    g.restore();
  } else {
    const up = smile * 4.2;
    g.strokeStyle = alpha(PAL.eye, 0.95); g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - 8, cy - up * 0.35);
    g.quadraticCurveTo(cx, cy + up + 1.4, cx + 8, cy - up * 0.35);
    g.stroke();
    if (warm > 0.2) { g.strokeStyle = alpha(PAL.warmHi, 0.25 * warm); g.lineWidth = 1; g.stroke(); }
  }
  g.restore();
}

function drawHead(g, rig, pose, starI, t) {
  const hx = rig.head[0], hy = rig.head[1], ang = rig.headAngle;
  const localStar = (() => {
    const dx = rig.star[0] - hx, dy = rig.star[1] - hy;
    const c = Math.cos(-ang), s = Math.sin(-ang);
    return norm(dx * c - dy * s, dx * s + dy * c);
  })();
  const look = pose.lookStar === false ? [0.2, -0.1] : localStar;
  g.save(); g.translate(hx, hy); g.rotate(ang);

  // far ear pod behind the skull
  drawEar(g, -58, 0, false);

  // soft shadow separation
  g.save(); g.globalAlpha *= 0.55; rr(g, -50, -50, 104, 104, 30); g.fillStyle = PAL.jointLo; g.translate(4, 5); g.fill(); g.restore();

  // skull shell
  rr(g, -52, -52, 104, 104, 30);
  g.fillStyle = linGrad(g, -42, -54, 52, 50, [
    [0, shade(PAL.shellHi, 0.08)], [0.3, PAL.shellHi], [0.58, PAL.shell], [0.82, PAL.shellLo], [1, PAL.shellDeep],
  ]);
  g.fill();
  g.strokeStyle = alpha('#06161b', 0.65); g.lineWidth = 2.2; g.stroke();
  g.save(); rr(g, -52, -52, 104, 104, 30); g.clip();
  // top cool reflection
  g.fillStyle = linGrad(g, 0, -52, 0, 6, [alpha('#d6fff4', 0.2), alpha('#ffffff', 0)]);
  g.fillRect(-54, -54, 108, 62);
  // star warmth on chin / front cheek
  g.globalCompositeOperation = 'lighter';
  const wg = radGrad(g, 16, 70, 0, 92, [alpha(PAL.warm, 0.15 * starI), alpha(PAL.warm, 0.055 * starI), alpha(PAL.warm, 0)]);
  g.fillStyle = wg; g.fillRect(-54, -54, 108, 108);
  g.restore();

  // panel bezel (front / near side)
  rr(g, -19, -38, 74, 77, 24);
  g.fillStyle = linGrad(g, -18, -38, 52, 38, [PAL.copperHi, PAL.copper, PAL.copperLo]);
  g.fill();
  g.strokeStyle = alpha('#2b1710', 0.6); g.lineWidth = 1.6; g.stroke();
  // inner dark glass
  rr(g, -14, -33, 64, 67, 21);
  g.fillStyle = linGrad(g, -10, -33, 48, 34, [PAL.glass2, PAL.glass, '#030a0e']);
  g.fill();
  g.save(); rr(g, -14, -33, 64, 67, 21); g.clip();
  // glass reflections + scanlines
  g.fillStyle = alpha('#bff9ff', 0.075);
  poly(g, [[-16, -33], [22, -33], [-16, 4]], alpha('#cdfbff', 0.15));
  poly(g, [[-16, -18], [8, -33], [-16, -33]], alpha('#ffffff', 0.06));
  g.fillStyle = alpha('#9fefff', 0.045);
  for (let y = -30; y < 34; y += 7) g.fillRect(-12, y, 58, 0.9);
  // interior ambient from star
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, 16, 46, 0, 66, [alpha(PAL.warm, 0.2 * starI), alpha(PAL.warm, 0)]);
  g.fillRect(-16, -35, 68, 72);
  g.restore();

  // eyes
  const eyeOpen = pose.eyeOpen * (1 - clamp(pose.blink));
  drawEye(g, 5, -5, eyeOpen, pose.happy, look, starI);
  drawEye(g, 30, -6, eyeOpen * 0.96, pose.happy, look, starI);
  // brows (thin floating LEDs)
  const browY = -22, tilt = -pose.brow * 4;
  g.save(); g.strokeStyle = alpha(PAL.eye, 0.7); g.lineWidth = 1.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-3, browY + tilt); g.quadraticCurveTo(5, browY - 2.4, 13, browY - tilt); g.stroke();
  g.beginPath(); g.moveTo(23, browY - tilt); g.quadraticCurveTo(30, browY - 2.4, 38, browY + tilt); g.stroke();
  g.restore();
  // mouth
  drawMouth(g, 17.5, 22, pose.mouthOpen, pose.smile, starI);
  // small status led
  circle(g, 41, -26, 1.8, alpha(PAL.eye, 0.7));
  glow(g, 41, -26, 8, PAL.eye, 0.3);

  // face panel glass sheen over eyes
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= 0.3;
  g.fillStyle = linGrad(g, -14, 30, 50, -20, [alpha('#ffffff', 0), alpha('#d8fff9', 0.09), alpha('#ffffff', 0)]);
  g.fillRect(-16, -34, 68, 70); g.restore();

  // chin plate + vents
  rr(g, 2, 43, 40, 11, 5); g.fillStyle = linGrad(g, 0, 42, 44, 54, [PAL.copper, PAL.copperLo]); g.fill();
  g.strokeStyle = alpha('#23110b', 0.55); g.lineWidth = 1; g.stroke();
  for (let i = 0; i < 3; i++) { g.fillStyle = alpha('#140b08', 0.7); g.fillRect(8 + i * 11, 47, 6, 2.4); }

  // top crest
  g.save();
  g.beginPath(); g.moveTo(-36, -50);
  g.quadraticCurveTo(-30, -68, -8, -68);
  g.quadraticCurveTo(8, -68, 20, -57);
  g.quadraticCurveTo(30, -51, 36, -50);
  g.lineTo(34, -44); g.lineTo(-34, -44); g.closePath();
  g.fillStyle = linGrad(g, -34, -68, 36, -44, [PAL.copperHi, PAL.copper, PAL.copperLo]);
  g.fill(); g.strokeStyle = alpha('#25130c', 0.55); g.lineWidth = 1.2; g.stroke();
  // crest vents
  g.fillStyle = alpha('#1e100b', 0.55);
  for (let i = 0; i < 3; i++) g.fillRect(-16 + i * 9, -55, 5, 2);
  circle(g, 26, -54, 2.4, alpha(PAL.warm, 0.8)); glow(g, 26, -54, 11, PAL.warm, 0.45 * starI);
  g.restore();

  // side seam / rivets
  g.strokeStyle = alpha('#0a2228', 0.35); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-44, -38); g.quadraticCurveTo(-49, 0, -42, 40); g.stroke();
  for (const [bx, by] of [[-40, -38], [-43, 34], [44, 40], [-30, 44]]) bolt(g, bx, by, 1.8, PAL.copper);
  // jaw shadow
  g.fillStyle = alpha('#000000', 0.18); g.fillRect(-40, 43, 82, 6);
  // near ear pod
  drawEar(g, 58, 0, true);

  // warm front rim from the star
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha(PAL.warmHi, 0.45 * starI); g.lineWidth = 2.1;
  g.beginPath(); g.arc(0, 4, 54, 0.18, 1.15); g.stroke();
  g.strokeStyle = alpha('#a9f6ee', 0.55); g.lineWidth = 1.9;
  g.beginPath(); g.arc(0, 0, 53, Math.PI * 1.03, Math.PI * 1.6); g.stroke();
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- limbs
function drawLeg(g, rig, near) {
  const hip = near ? rig.hipN : rig.hipF, knee = near ? rig.kneeN : rig.kneeF;
  const ankle = near ? rig.ankleN : rig.ankleF, foot = near ? rig.footN : rig.footF;
  const col = near ? PAL.shell : mix(PAL.shell, PAL.shellDeep, 0.32);
  const w = near ? 1 : 0.86;
  // thigh + shin
  limb(g, hip, knee, 27 * w, 23 * w, col, { rimA: near ? 0.4 : 0.18, hi: near ? 0.14 : 0.06 });
  limb(g, knee, ankle, 20 * w, 17 * w, near ? shade(PAL.shell, -0.06) : mix(PAL.shell, PAL.shellDeep, 0.42), { rimA: near ? 0.34 : 0.15, hi: near ? 0.12 : 0.05 });
  // hydraulic rod
  const dx = ankle[0] - knee[0], dy = ankle[1] - knee[1], l = len(dx, dy);
  const nx = -dy / l, ny = dx / l;
  seg(g, [[knee[0] - nx * 8, knee[1] - ny * 8], [ankle[0] - nx * 7, ankle[1] - ny * 7]], 4.5, alpha(PAL.joint, near ? 0.9 : 0.65));
  seg(g, [[knee[0] - nx * 8, knee[1] - ny * 8], [ankle[0] - nx * 7, ankle[1] - ny * 7]], 1.6, alpha(PAL.copperHi, near ? 0.6 : 0.25));
  // knee hinge
  circle(g, knee[0], knee[1], 10.5 * w, PAL.jointLo);
  circle(g, knee[0], knee[1], 8.2 * w, linGrad(g, knee[0] - 6, knee[1] - 6, knee[0] + 6, knee[1] + 6, [PAL.copperHi, PAL.copper, PAL.copperLo]));
  circle(g, knee[0], knee[1], 3.4 * w, PAL.joint);
  circle(g, knee[0] - 2.4, knee[1] - 2.6, 1.2, alpha('#ffffff', 0.55));
  // ankle hinge
  circle(g, ankle[0], ankle[1], 7.6 * w, PAL.jointLo);
  ring(g, ankle[0], ankle[1], 7.6 * w, 1.4, alpha(PAL.copper, 0.6));

  // boot
  g.save(); g.translate(foot[0], 0); if (!near) g.scale(1, 0.97);
  // sole shadow
  g.fillStyle = alpha('#000000', 0.34); g.beginPath(); g.ellipse(3, 1, 34, 5.5, 0, 0, TAU); g.fill();
  const bootPts = [
    [-24, -22], [18, -24], [29, -18], [32, -10], [31, -3], [24, 1],
    [-21, 1], [-27, -5], [-28, -14],
  ];
  spline(g, bootPts, true);
  g.fillStyle = linGrad(g, -26, -22, 30, 0, near ? [PAL.bootHi, PAL.boot, '#141c1e'] : ['#394648', '#1d2729', '#101617']);
  g.fill();
  g.strokeStyle = alpha('#050d10', 0.7); g.lineWidth = 1.6; g.stroke();
  // sole
  g.fillStyle = '#0b1012'; g.beginPath(); g.ellipse(2, -1, 28, 4.2, 0, 0, TAU); g.fill();
  // copper toe cap
  g.beginPath(); g.moveTo(12, -22); g.quadraticCurveTo(28, -23, 32, -12); g.quadraticCurveTo(33, -4, 24, 0); g.lineTo(15, 0); g.closePath();
  g.fillStyle = linGrad(g, 12, -23, 33, 0, [PAL.copperHi, PAL.copper, PAL.copperLo]); g.fill();
  g.strokeStyle = alpha('#2b150d', 0.45); g.lineWidth = 1; g.stroke();
  // tread + ankle cuff
  for (let i = 0; i < 3; i++) { g.fillStyle = alpha('#000000', 0.35); g.fillRect(-12 + i * 9, -2.4, 5, 2); }
  rr(g, -16, -28, 26, 8, 3.4); g.fillStyle = PAL.joint; g.fill();
  ring(g, 0, -24, 6.4, 1.3, alpha(PAL.copperHi, 0.5));
  circle(g, -18, -14, 1.7, alpha(PAL.eye, near ? 0.7 : 0.3));
  if (near) glow(g, -18, -14, 7, PAL.eye, 0.25);
  // warm star sheen on the near boot
  g.fillStyle = linGrad(g, 30, -22, 32, 0, [alpha(PAL.warm, near ? 0.3 : 0.12), alpha(PAL.warm, 0)]);
  g.fillRect(12, -24, 22, 25);
  g.restore();
}

function drawShoulder(g, sh, near) {
  g.save();
  circle(g, sh[0] + 2, sh[1] + 3, 18, alpha('#000000', 0.32));
  circle(g, sh[0], sh[1], 17, PAL.jointLo);
  circle(g, sh[0], sh[1], 14, linGrad(g, sh[0] - 9, sh[1] - 9, sh[0] + 10, sh[1] + 10, [PAL.copperHi, PAL.copper, PAL.copperLo]));
  ring(g, sh[0], sh[1], 14, 1.5, alpha(PAL.copperHi, 0.65));
  circle(g, sh[0], sh[1], 5.5, PAL.joint);
  // pauldron cap
  g.beginPath();
  g.moveTo(sh[0] - 17, sh[1] - 1);
  g.quadraticCurveTo(sh[0] - 15, sh[1] - 17, sh[0] + 3, sh[1] - 17);
  g.quadraticCurveTo(sh[0] + 17, sh[1] - 15, sh[0] + 17, sh[1] + 2);
  g.quadraticCurveTo(sh[0] + 4, sh[1] - 5, sh[0] - 17, sh[1] - 1);
  g.fillStyle = near ? linGrad(g, sh[0] - 16, sh[1] - 16, sh[0] + 16, sh[1] + 2, [PAL.shellHi, PAL.shell, PAL.shellLo]) : mix(PAL.shell, PAL.shellDeep, 0.4);
  g.fill();
  g.strokeStyle = alpha('#06161b', 0.55); g.lineWidth = 1.2; g.stroke();
  if (near) { g.strokeStyle = alpha('#c9fff2', 0.3); g.lineWidth = 1.2; g.beginPath(); g.moveTo(sh[0] - 12, sh[1] - 9); g.quadraticCurveTo(sh[0], sh[1] - 17, sh[0] + 12, sh[1] - 12); g.stroke(); }
  circle(g, sh[0] + 9, sh[1] - 8, 1.7, alpha(PAL.copperHi, 0.8));
  g.restore();
}

function drawArmSegments(g, rig, near) {
  const sh = near ? rig.shN : rig.shF, el = near ? rig.elbN : rig.elbF, wr = near ? rig.wristN : rig.wristF;
  const col = near ? PAL.shell : mix(PAL.shell, PAL.shellDeep, 0.34);
  const w = near ? 1 : 0.88;
  limb(g, sh, el, 23 * w, 19 * w, col, { rimA: near ? 0.38 : 0.16, hi: near ? 0.14 : 0.05 });
  limb(g, el, wr, 18 * w, 15 * w, near ? shade(PAL.shell, -0.04) : mix(PAL.shell, PAL.shellDeep, 0.45), { rimA: near ? 0.32 : 0.14, hi: near ? 0.12 : 0.04 });
  // elbow hinge
  circle(g, el[0], el[1], 8.6 * w, PAL.jointLo);
  circle(g, el[0], el[1], 6.4 * w, linGrad(g, el[0] - 5, el[1] - 5, el[0] + 5, el[1] + 5, [PAL.copperHi, PAL.copper, PAL.copperLo]));
  circle(g, el[0], el[1], 2.2 * w, alpha(PAL.eye, near ? 0.7 : 0.3));
  drawShoulder(g, sh, near);
  // wrist cuff
  const dx = wr[0] - el[0], dy = wr[1] - el[1], l = len(dx, dy);
  const nx = -dy / l, ny = dx / l;
  seg(g, [[wr[0] - nx * 7, wr[1] - ny * 7], [wr[0] + nx * 7, wr[1] + ny * 7]], 10 * w, PAL.copperLo);
  seg(g, [[wr[0] - nx * 7, wr[1] - ny * 7], [wr[0] + nx * 7, wr[1] + ny * 7]], 6 * w, PAL.copper);
}

function drawHand(g, rig, near, starI) {
  const wr = near ? rig.wristN : rig.wristF;
  const el = near ? rig.elbN : rig.elbF;
  const star = rig.star;
  const dx = star[0] - wr[0], dy = star[1] - wr[1];
  const ang = Math.atan2(dx, -dy);
  const col = near ? PAL.shell : mix(PAL.shell, PAL.shellDeep, 0.3);
  g.save(); g.translate(wr[0], wr[1]); g.rotate(ang);
  // wrist joint
  circle(g, 0, 0, 6.2, PAL.jointLo);
  ring(g, 0, 0, 6.2, 1.2, alpha(PAL.copperHi, 0.55));
  // palm
  g.save(); g.translate(0, -12);
  g.beginPath(); g.ellipse(0, 0, 14, 12.5, 0, 0, TAU);
  g.fillStyle = linGrad(g, -12, -12, 12, 12, [shade(col, 0.12), col, shade(col, -0.28)]); g.fill();
  g.strokeStyle = alpha('#06161b', 0.5); g.lineWidth = 1.2; g.stroke();
  g.fillStyle = alpha(PAL.copper, 0.85); g.beginPath(); g.ellipse(0, 1, 6.4, 5.2, 0, 0, TAU); g.fill();
  ring(g, 0, 1, 5.2, 0.8, alpha(PAL.copperHi, 0.6));
  // fingers curl around the star
  const finger = (bx, tipX, tipY, wd) => {
    seg(g, [[bx, -7], [bx * 0.9, -17], [tipX, tipY]], wd, PAL.shellLo);
    seg(g, [[bx, -7], [bx * 0.9, -17], [tipX, tipY]], wd * 0.34, alpha(PAL.shellHi, 0.22));
    circle(g, tipX, tipY, wd * 0.52, PAL.copper);
    circle(g, tipX - 1.2, tipY - 1.4, wd * 0.2, alpha(PAL.copperHi, 0.8));
  };
  finger(-9.5, -12, -26, 7.2);
  finger(-2, -3.5, -30, 7.4);
  finger(6.5, 6, -28, 7.2);
  // thumb on the near side
  seg(g, [[11, -4], [18, -11], [15, -20]], 7, PAL.shellLo);
  circle(g, 15, -20, 3.6, PAL.copper);
  // warm light from the star
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, 0, -24, 0, 34, [alpha(PAL.warmHi, 0.32 * starI), alpha(PAL.warm, 0.08 * starI), alpha(PAL.warm, 0)]);
  g.beginPath(); g.ellipse(0, -22, 22, 20, 0, 0, TAU); g.fill();
  g.restore();
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- torso
function torsoPath(g, hip, neck, perp) {
  const at = (k, w) => [lerp(hip[0], neck[0], k) + perp[0] * w, lerp(hip[1], neck[1], k) + perp[1] * w];
  const pts = [
    at(0.02, -50), at(0.1, -57), at(0.3, -61), at(0.55, -57), at(0.78, -48), at(0.94, -37),
    at(1.0, 0), at(0.94, 39), at(0.78, 49), at(0.55, 61), at(0.3, 64), at(0.1, 58), at(0.02, 50),
  ];
  spline(g, pts, true);
  return { at };
}

function drawTorso(g, rig, starI, t) {
  const { hip, neck, perp } = rig;
  g.save();
  // drop shadow
  g.save(); g.translate(4, 5); torsoPath(g, hip, neck, perp); g.fillStyle = alpha('#000000', 0.34); g.fill(); g.restore();

  torsoPath(g, hip, neck, perp);
  g.fillStyle = linGrad(g, hip[0] + 70, neck[1] - 26, hip[0] - 64, hip[1] + 48, [
    [0, PAL.shellHi], [0.26, PAL.shell], [0.62, shade(PAL.shell, -0.18)], [0.86, PAL.shellLo], [1, PAL.shellDeep],
  ]);
  g.fill();
  g.strokeStyle = alpha('#06161b', 0.7); g.lineWidth = 2; g.stroke();
  g.save(); torsoPath(g, hip, neck, perp); g.clip();

  // top cool light
  g.fillStyle = linGrad(g, 0, neck[1] - 12, 0, hip[1] - 12, [alpha('#d4fff2', 0.17), alpha('#ffffff', 0)]);
  g.fillRect(-E.W, -E.H, E.W * 2, E.H * 2);
  // star warmth on belly/front
  g.globalCompositeOperation = 'lighter';
  const sx = rig.star[0], sy = rig.star[1];
  g.fillStyle = radGrad(g, sx, sy, 0, 96, [alpha(PAL.warm, 0.16 * starI), alpha(PAL.warm, 0.06 * starI), alpha(PAL.warm, 0)]);
  g.fillRect(-E.W, -E.H, E.W * 2, E.H * 2);
  g.globalCompositeOperation = 'source-over';
  // centre seam + panel line
  g.strokeStyle = alpha('#082126', 0.38); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(hip[0] + 2, hip[1] - 2); g.quadraticCurveTo(hip[0] + 10, hip[1] - 45, neck[0] + 5, neck[1] + 10); g.stroke();
  // belly plate
  g.save(); g.translate(hip[0] + 18, hip[1] - 58);
  rr(g, -18, -30, 44, 62, 16);
  g.fillStyle = linGrad(g, -18, -30, 26, 30, ['#2b3130', '#1b2223', '#111819']); g.fill();
  g.strokeStyle = alpha(PAL.copperHi, 0.38); g.lineWidth = 1.2; g.stroke();
  // three warm slots
  for (let i = 0; i < 3; i++) {
    const yy = -18 + i * 15;
    rr(g, -8, yy, 24, 5, 2.5);
    g.fillStyle = alpha(PAL.warm, 0.22 + 0.14 * starI); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radGrad(g, 4, yy + 2.5, 0, 20, [alpha(PAL.warmHi, 0.4 * starI), alpha(PAL.warm, 0)]);
    g.fillRect(-12, yy - 8, 34, 22); g.restore();
  }
  circle(g, 4, 25, 3.1, alpha(PAL.eye, 0.8)); glow(g, 4, 25, 10, PAL.eye, 0.35);
  bolt(g, -12, -22, 1.6, PAL.copper);
  bolt(g, 18, -22, 1.6, PAL.copper);
  g.restore();
  // side vents
  g.save(); g.translate(hip[0] + 48, hip[1] - 36); g.rotate(0.1);
  for (let i = 0; i < 3; i++) { rr(g, -12, i * 8, 24, 3, 1.5); g.fillStyle = alpha('#06171b', 0.5); g.fill(); }
  g.restore();
  // edge highlights
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = alpha('#b9fff2', 0.45); g.lineWidth = 1.9;
  g.beginPath(); g.moveTo(hip[0] - 45, hip[1] - 14); g.quadraticCurveTo(hip[0] - 62, hip[1] - 56, hip[0] - 44, hip[1] - 76); g.stroke();
  g.strokeStyle = alpha(PAL.warmHi, 0.38 * starI); g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(hip[0] + 46, hip[1] - 66); g.quadraticCurveTo(hip[0] + 62, hip[1] - 38, hip[0] + 52, hip[1] - 6); g.stroke();
  g.restore();

  // pelvis band + hip joints
  g.save();
  const pg = linGrad(g, hip[0] - 50, 0, hip[0] + 50, 0, [PAL.shellLo, PAL.joint, PAL.shellLo]);
  g.fillStyle = pg; g.beginPath(); g.ellipse(hip[0], hip[1] + 1, 50, 19, 0, 0, TAU); g.fill();
  g.strokeStyle = alpha('#06161b', 0.6); g.lineWidth = 1.4; g.stroke();
  g.fillStyle = alpha(PAL.copperLo, 0.85); g.fillRect(hip[0] - 42, hip[1] - 2, 84, 4);
  for (const hj of [rig.hipN, rig.hipF]) {
    circle(g, hj[0], hj[1], 9.5, PAL.jointLo);
    ring(g, hj[0], hj[1], 9.5, 1.6, alpha(PAL.copper, 0.6));
    circle(g, hj[0], hj[1], 3.2, alpha(PAL.eye, 0.6));
  }
  g.restore();
  g.restore();

  // collar
  g.save(); g.translate(neck[0], neck[1]);
  g.rotate(Math.atan2(perp[1], perp[0]));
  rr(g, -33, -9, 66, 18, 8);
  g.fillStyle = linGrad(g, -33, -9, 33, 9, [PAL.copperHi, PAL.copper, PAL.copperLo]); g.fill();
  g.strokeStyle = alpha('#2a140d', 0.6); g.lineWidth = 1.2; g.stroke();
  rr(g, -22, -4, 44, 3, 1.5); g.fillStyle = alpha('#1a0d08', 0.55); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- backpack
function drawBackpack(g, rig, starI) {
  const { hip, neck } = rig;
  const bx = lerp(hip[0], neck[0], 0.76) - 54;
  const by = lerp(hip[1], neck[1], 0.76) + 10;
  g.save();
  g.translate(bx, by); g.rotate(-0.06);
  rr(g, -22, -36, 44, 76, 16);
  g.fillStyle = linGrad(g, -22, -36, 22, 38, ['#3d514f', '#243333', '#141e1f']); g.fill();
  g.strokeStyle = alpha('#06161b', 0.7); g.lineWidth = 1.6; g.stroke();
  rr(g, -14, -28, 28, 26, 8); g.fillStyle = alpha('#0a181a', 0.9); g.fill();
  for (let i = 0; i < 3; i++) { rr(g, -10, -23 + i * 7, 20, 2.5, 1.2); g.fillStyle = alpha(PAL.copperHi, 0.35); g.fill(); }
  circle(g, 0, 16, 6, PAL.joint); ring(g, 0, 16, 6, 1.4, alpha(PAL.copper, 0.65));
  circle(g, 0, 16, 2, alpha(PAL.warm, 0.8)); glow(g, 0, 16, 10, PAL.warm, 0.3 * starI);
  // little vent
  for (let i = 0; i < 3; i++) { g.fillStyle = alpha('#000000', 0.35); g.fillRect(-12 + i * 9, 28, 4, 3); }
  g.restore();
  // hose from pack to collar
  g.save();
  g.strokeStyle = PAL.jointLo; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(bx + 10, by - 32); g.bezierCurveTo(bx + 28, by - 58, neck[0] - 24, neck[1] + 4, neck[0] - 16, neck[1] + 8); g.stroke();
  g.strokeStyle = alpha(PAL.copper, 0.55); g.lineWidth = 2;
  g.beginPath(); g.moveTo(bx + 10, by - 32); g.bezierCurveTo(bx + 28, by - 58, neck[0] - 24, neck[1] + 4, neck[0] - 16, neck[1] + 8); g.stroke();
  g.restore();
}

// ---------------------------------------------------------------- main
export function drawRobot(g, o = {}) {
  const x = o.x ?? E.W / 2, y = o.y ?? E.H * 0.8;
  const s = o.s ?? 1, facing = o.facing ?? 1, pose = o.pose || P();
  const t = o.t ?? 0, starI = clamp(o.starI ?? 1, 0, 1.8);
  const rig = buildRig(pose, t);
  const starWorld = [x + rig.star[0] * s * facing, y + rig.star[1] * s];
  const headWorld = [x + rig.head[0] * s * facing, y + rig.head[1] * s];

  // contact shadow + star pool on the ground
  g.save();
  const shR = 102 * s;
  g.fillStyle = radGrad(g, x, y + 3, 0, shR, [alpha('#000000', 0.5), alpha('#000000', 0.26), alpha('#000000', 0)]);
  g.beginPath(); g.ellipse(x, y + 4, shR, 19 * s, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, x, y - 1, 0, 150 * s, [alpha(PAL.warm, 0.12 * starI), alpha(PAL.warm, 0.04 * starI), alpha(PAL.warm, 0)]);
  g.beginPath(); g.ellipse(x, y + 2, 150 * s, 27 * s, 0, 0, TAU); g.fill();
  g.restore();

  g.save();
  g.translate(x, y);
  g.scale(facing * s, s);
  g.globalAlpha *= o.alpha ?? 1;

  // back to front
  drawLeg(g, rig, false);
  drawLeg(g, rig, true);
  drawBackpack(g, rig, starI);
  drawArmSegments(g, rig, false);
  drawTorso(g, rig, starI, t);
  drawHand(g, rig, false, starI);
  drawArmSegments(g, rig, true);
  drawStar(g, rig.star[0], rig.star[1], t, starI, rig.starR);
  drawHand(g, rig, true, starI);
  drawHead(g, rig, pose, starI, t);

  // warm bloom wash over the whole figure from the star
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, rig.star[0], rig.star[1] + 6, 0, 180, [alpha(PAL.warm, 0.05 * starI), alpha(PAL.warm, 0.018 * starI), alpha(PAL.warm, 0)]);
  g.fillRect(-220, -400, 440, 430);
  g.restore();

  g.restore();

  return {
    star: starWorld, head: headWorld, rig,
    headRadius: 52 * s * 1.25,
    starScreenRadius: rig.starR * s,
  };
}

// world-space helper for a screen-space glow (used by shots after the layer pass)
export function robotStarWorld(o = {}) {
  const s = o.s ?? 1, facing = o.facing ?? 1, pose = o.pose || P();
  const rig = buildRig(pose, o.t ?? 0);
  return [o.x + rig.star[0] * s * facing, o.y + rig.star[1] * s];
}
