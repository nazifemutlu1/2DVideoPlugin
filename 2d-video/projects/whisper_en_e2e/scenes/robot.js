// scenes/robot.js — one reusable 2.5D robot rig for every shot.
// Volumetric shells, warm key from camera-left, cyan rim from the lab, a single soft eye in a wide visor.
import {
  clamp, lerp, ease, alpha, shade, mix, seg, circle, ring, rr, poly, glow, linGrad, radGrad, text, FONTS,
} from '/engine/core.js';

export const ROBOT = {
  body: '#e7e0d2',
  panel: '#c9bfae',
  accent: '#e86a33',
  visor: '#65e8ff',
  warm: '#ffb27a',
  cool: '#7ce7ff',
  dark: '#241f27',
  dark2: '#141118',
  metal: '#5d5560',
  ink: '#2a1814',
};

const TAU = Math.PI * 2;

function bodyPath(g) {
  g.beginPath();
  g.moveTo(-92, -76);
  g.bezierCurveTo(-128, -100, -136, -214, -110, -264);
  g.bezierCurveTo(-88, -304, 88, -304, 110, -264);
  g.bezierCurveTo(136, -214, 128, -100, 92, -76);
  g.bezierCurveTo(62, -56, -62, -56, -92, -76);
  g.closePath();
}

function headPath(g) {
  g.beginPath();
  g.moveTo(-86, -316);
  g.bezierCurveTo(-102, -328, -104, -402, -84, -424);
  g.bezierCurveTo(-62, -446, 62, -446, 84, -424);
  g.bezierCurveTo(104, -402, 102, -328, 86, -316);
  g.bezierCurveTo(58, -304, -58, -304, -86, -316);
  g.closePath();
}

function shellClipFill(g, path, build) {
  g.save(); path(g); g.clip(); build(g); g.restore();
}

function rimStroke(g, path, color, width = 2.4, a = 0.5) {
  g.save(); path(g); g.strokeStyle = alpha(color, a); g.lineWidth = width; g.stroke(); g.restore();
}

function drawFoot(g, x, y, dir, o) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  const sole = linGrad(g, 0, -30, 0, 4, [shade(o.dark, 0.18), o.dark2]);
  rr(g, -38, -28, 78, 30, 14); g.fillStyle = sole; g.fill();
  g.fillStyle = alpha('#000000', 0.35); g.fillRect(-30, 1, 66, 4);
  g.strokeStyle = alpha(o.warm, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(-26, -5); g.lineTo(30, -5); g.stroke();
  circle(g, 30, -13, 3.2, alpha(o.cool, 0.9));
  glow(g, 30, -13, 14, o.cool, 0.35);
  rr(g, -36, -29, 72, 9, 4.5); g.fillStyle = alpha('#ffffff', 0.09); g.fill();
  g.restore();
}

function drawArm(g, sx, sy, upper, fore, handRot, o) {
  const L1 = 56, L2 = 50;
  const a1 = upper, a2 = fore;
  const ex = sx + Math.sin(a1) * L1;
  const ey = sy + Math.cos(a1) * L1;
  const hx = ex + Math.sin(a1 + a2) * L2;
  const hy = ey + Math.cos(a1 + a2) * L2;
  const base = o.far ? shade(o.panel, -0.2) : o.panel;
  const hi = o.far ? alpha(o.warm, 0.18) : alpha('#fff8e8', 0.38);
  const rim = alpha(o.cool, o.far ? 0.22 : 0.42);
  g.save(); g.globalAlpha *= o.far ? 0.9 : 1;
  // under-shadow
  seg(g, [[sx + 4, sy + 5], [ex + 4, ey + 5], [hx + 4, hy + 5]], 30, alpha('#000000', 0.28));
  // upper arm
  seg(g, [[sx, sy], [ex, ey]], 28, base);
  seg(g, [[sx + 7, sy + 2], [ex + 7, ey + 2]], 12, alpha(shade(o.panel, -0.25), 0.5));
  seg(g, [[sx - 7, sy - 1], [ex - 7, ey - 1]], 5, hi);
  seg(g, [[sx - 2, sy - 12], [ex - 2, ey - 12]], 2, rim);
  // elbow
  circle(g, ex, ey, 17, o.dark); circle(g, ex - 2, ey - 3, 10, o.metal);
  ring(g, ex, ey, 17, 2, alpha(o.cool, 0.35));
  // forearm
  seg(g, [[ex, ey], [hx, hy]], 24, base);
  seg(g, [[ex + 6, ey + 1], [hx + 6, hy + 1]], 9, alpha(shade(o.panel, -0.25), 0.45));
  seg(g, [[ex - 6, ey - 1], [hx - 6, hy - 1]], 4, hi);
  // wrist band
  g.save(); g.translate(hx, hy); g.rotate(a1 + a2);
  rr(g, -15, -7, 30, 14, 7); g.fillStyle = o.dark; g.fill();
  rr(g, -15, -7, 30, 3, 1.5); g.fillStyle = alpha(o.accent, 0.75); g.fill();
  g.restore();
  // mitten hand
  g.save(); g.translate(hx, hy); g.rotate(a1 + a2 + handRot);
  rr(g, -14, -20, 36, 42, 17); g.fillStyle = o.dark; g.fill();
  rr(g, -10, -17, 27, 17, 8); g.fillStyle = alpha('#ffffff', 0.08); g.fill();
  rr(g, -15, -3, 8, 22, 4); g.fillStyle = o.dark2; g.fill();
  circle(g, 6, -2, 4, alpha(o.cool, 0.85)); glow(g, 6, -2, 16, o.cool, 0.35);
  g.restore();
  // shoulder cap
  circle(g, sx, sy, 22, o.dark);
  circle(g, sx - 2, sy - 4, 13, mix(o.metal, o.panel, 0.3));
  ring(g, sx, sy, 22, 2.2, alpha(o.cool, 0.3));
  if (!o.far) { g.beginPath(); g.arc(sx, sy, 22, -1.1, 0.7); g.strokeStyle = alpha(o.cool, 0.6); g.lineWidth = 3; g.stroke(); }
  g.restore();
  return { ex, ey, hx, hy };
}

function drawEye(g, o, cx, cy) {
  const happy = clamp(o.happy || 0), open = clamp(o.eyeOpen ?? 1), blink = clamp(o.blink || 0);
  const col = o.visor;
  if (blink > 0.55) {
    seg(g, [[cx - 28, cy + 2], [cx + 28, cy + 2]], 4, alpha(col, 0.9));
    return;
  }
  if (happy > 0.04) {
    g.save(); g.globalAlpha *= happy;
    g.strokeStyle = alpha(col, 0.95); g.lineWidth = 9; g.lineCap = 'round';
    g.shadowColor = alpha(col, 0.9); g.shadowBlur = 22;
    g.beginPath(); g.moveTo(cx - 26, cy + 8); g.quadraticCurveTo(cx, cy - 22, cx + 26, cy + 8); g.stroke();
    g.restore();
  }
  if (happy > 0.9) return;
  const eh = Math.max(2.5, 31 * open);
  const ew = 62 * (0.86 + 0.14 * open);
  g.save(); g.globalAlpha *= (1 - happy) * clamp(o.lit ?? 1);
  if (eh < 6) {
    seg(g, [[cx - ew * 0.42, cy], [cx + ew * 0.42, cy]], 3.5, alpha(col, 0.95));
    glow(g, cx, cy, 44, col, 0.55);
  } else {
    glow(g, cx, cy, 64, col, 0.55);
    rr(g, cx - ew / 2, cy - eh / 2, ew, eh, eh / 2);
    g.fillStyle = radGrad(g, cx, cy, 0, ew * 0.62, [
      [0, '#f4ffff'], [0.42, shade(col, 0.4)], [0.8, col], [1, shade(col, -0.35)],
    ]);
    g.fill();
    g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = 1.2; g.stroke();
    circle(g, cx - ew * 0.17, cy - eh * 0.22, ew * 0.14, alpha('#ffffff', 0.88));
    circle(g, cx + ew * 0.23, cy + eh * 0.13, ew * 0.06, alpha('#ffffff', 0.45));
  }
  g.restore();
}

function drawVisor(g, o) {
  const v = o.visor;
  const lit = clamp(o.lit ?? 1);
  const vx = -80, vy = -418, vw = 160, vh = 98;
  rr(g, vx - 4, vy - 4, vw + 8, vh + 8, 36); g.fillStyle = o.dark2; g.fill();
  rr(g, vx - 1, vy - 1, vw + 2, vh + 2, 33); g.strokeStyle = alpha(o.panel, 0.8); g.lineWidth = 2; g.stroke();
  rr(g, vx, vy, vw, vh, 32);
  g.fillStyle = linGrad(g, 0, vy, 0, vy + vh, ['#02080c', '#051319', '#08222b']);
  g.fill();
  g.save(); rr(g, vx, vy, vw, vh, 32); g.clip();
  // glass reflection and scanlines
  poly(g, [[-96, -424], [26, -424], [-96, -310]], alpha('#d8fbff', 0.055));
  g.fillStyle = alpha('#9fefff', 0.05);
  for (let y = vy + 8; y < vy + vh; y += 8) g.fillRect(vx + 6, y, vw - 12, 1);
  glow(g, 0, -366, 110, v, 0.16 * lit + 0.08 * (o.chestPulse || 0));
  const lookX = clamp(o.lookX ?? 0.3, -1, 1) * 15;
  const lookY = clamp(o.lookY ?? 0, -1, 1) * 7;
  drawEye(g, o, lookX, -366 + lookY);
  circle(g, 63, -338, 3, alpha(v, 0.8 * lit));
  glow(g, 63, -338, 14, v, 0.4 * lit);
  g.restore();
  rr(g, vx + 2, vy + 2, vw - 4, 10, 8); g.fillStyle = alpha('#ffffff', 0.05); g.fill();
  g.strokeStyle = alpha(v, 0.22 + 0.35 * lit); g.lineWidth = 2; rr(g, vx, vy, vw, vh, 32); g.stroke();
}

function drawChest(g, o) {
  const cy = -186;
  const pulse = clamp(o.chestPulse || 0);
  const lit = clamp(o.lit ?? 1);
  circle(g, 0, cy, 55, o.dark2);
  ring(g, 0, cy, 50, 4, alpha(o.metal, 0.9));
  ring(g, 0, cy, 43, 2, alpha(o.panel, 0.5));
  // rotating calibration arcs
  g.save(); g.translate(0, cy); g.rotate((o.t || 0) * 0.5);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 47, i * TAU / 3, i * TAU / 3 + 0.55); g.strokeStyle = alpha(o.cool, 0.25 + 0.4 * lit); g.lineWidth = 2; g.stroke(); }
  g.restore();
  glow(g, 0, cy, 92, o.accent, 0.18 + 0.35 * pulse);
  circle(g, 0, cy, 31, radGrad(g, 0, cy, 0, 31, [[0, '#fff2d8'], [0.4, shade(o.accent, 0.35)], [0.82, o.accent], [1, shade(o.accent, -0.35)]]));
  circle(g, -8, cy - 8, 8, alpha('#ffffff', 0.28));
  ring(g, 0, cy, 34, 2.4, alpha(o.cool, 0.55 + 0.3 * pulse)); glow(g, 0, cy, 52, o.cool, 0.22 + 0.3 * pulse);
  // vents
  for (let i = -1; i <= 1; i++) { rr(g, i * 15 - 5, -128, 10, 22, 5); g.fillStyle = alpha(o.dark2, 0.9); g.fill(); }
}

export function drawRobot(g, o = {}) {
  const x = o.x || 0, y = o.y || 0, s = o.s ?? 1.2, t = o.t || 0;
  const bob = Math.sin(t * 1.65 + 0.7) * 2.1 + Math.sin(t * 2.7 + 1.9) * 0.8;
  const sag = (1 - clamp(o.boot ?? 1)) * 9;
  const lit = clamp(o.lit ?? 1);
  const near = o.nearArm || [0.34, 0.1, 0];
  const far = o.farArm || [-0.3, -0.06, 0];
  const col = {
    body: o.body || ROBOT.body, panel: o.panel || ROBOT.panel, accent: o.accent || ROBOT.accent,
    visor: o.visor || ROBOT.visor, warm: o.warm || ROBOT.warm, cool: o.cool || ROBOT.cool,
    dark: ROBOT.dark, dark2: ROBOT.dark2, metal: ROBOT.metal, far: false,
  };
  const farCol = { ...col, far: true };
  // contact shadow on the plinth surface
  g.save();
  g.fillStyle = radGrad(g, x + 8, y + 4, 0, 160 * s, [alpha('#000000', 0.44 * (o.shadowA ?? 1)), alpha('#000000', 0)]);
  g.beginPath(); g.ellipse(x + 8, y + 5, 165 * s, 28 * s, 0, 0, TAU); g.fill();
  g.restore();

  g.save();
  g.translate(x, y + (bob + sag) * s);
  g.scale(s, s);
  g.globalAlpha *= o.alpha ?? 1;

  // far arm behind the shell
  drawArm(g, -104, -244, far[0], far[1], far[2], farCol);

  // short legs and boots
  seg(g, [[-48, -90], [-52, -30]], 30, shade(col.panel, -0.22));
  seg(g, [[48, -90], [52, -30]], 30, col.panel);
  seg(g, [[-48, -90], [-52, -30]], 9, alpha('#ffffff', 0.12));
  g.fillStyle = col.dark2; g.beginPath(); g.ellipse(-52, -28, 22, 14, 0, 0, TAU); g.fill();
  g.fillStyle = col.dark2; g.beginPath(); g.ellipse(52, -28, 22, 14, 0, 0, TAU); g.fill();
  drawFoot(g, -52, -2, 1, col);
  drawFoot(g, 52, -2, 1, col);

  // body shell
  shellClipFill(g, bodyPath, (gg) => {
    gg.fillStyle = linGrad(gg, -140, -300, 140, -50, [
      [0, shade(col.body, 0.12)], [0.36, col.body], [0.7, col.panel], [0.9, shade(col.panel, -0.15)], [1, mix(col.panel, col.cool, 0.22)],
    ]);
    gg.fillRect(-180, -340, 360, 310);
    gg.fillStyle = linGrad(gg, 0, -300, 0, -60, [[0, alpha('#ffffff', 0.1)], [0.6, alpha('#ffffff', 0)], [1, alpha('#2a1814', 0.4)]]);
    gg.fillRect(-180, -340, 360, 310);
    glow(gg, -88, -224, 150, col.warm, 0.24);
    gg.save(); gg.globalCompositeOperation = 'lighter';
    gg.fillStyle = radGrad(gg, 132, -210, 10, 150, [alpha(col.cool, 0.42), alpha(col.cool, 0.08), alpha(col.cool, 0)]);
    gg.fillRect(-180, -340, 360, 310); gg.restore();
    // subtle brushed shoulder shading
    gg.fillStyle = alpha(col.dark, 0.1);
    gg.beginPath(); gg.ellipse(92, -234, 38, 76, -0.2, 0, TAU); gg.fill();
  });
  rimStroke(g, bodyPath, col.cool, 2.2, 0.36);
  g.save(); bodyPath(g); g.clip();
  g.strokeStyle = alpha(col.warm, 0.3); g.lineWidth = 3; g.beginPath(); g.moveTo(-108, -102); g.bezierCurveTo(-128, -152, -134, -226, -110, -268); g.stroke();
  g.restore();

  // belly plate
  g.save();
  g.beginPath(); g.moveTo(-58, -142); g.bezierCurveTo(-32, -152, 32, -152, 58, -142);
  g.bezierCurveTo(64, -122, 58, -96, 44, -86); g.bezierCurveTo(16, -78, -16, -78, -44, -86);
  g.bezierCurveTo(-58, -96, -64, -122, -58, -142); g.closePath();
  g.fillStyle = linGrad(g, -60, -150, 60, -80, [shade(col.panel, 0.16), col.panel, shade(col.panel, -0.12)]); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.2); g.lineWidth = 1.5; g.stroke();
  g.restore();
  for (const [sx, sy] of [[-50, -137], [50, -137], [-48, -94], [48, -94]]) {
    circle(g, sx, sy, 3.4, alpha(col.metal, 0.9)); circle(g, sx - 1, sy - 1, 1.2, alpha('#ffffff', 0.5));
  }
  // signature accent shoulder plate
  g.save();
  g.beginPath(); g.moveTo(58, -268); g.bezierCurveTo(92, -268, 118, -246, 122, -212);
  g.bezierCurveTo(108, -202, 86, -208, 72, -224); g.bezierCurveTo(62, -238, 56, -254, 58, -268); g.closePath();
  g.fillStyle = linGrad(g, 58, -268, 122, -204, [shade(col.accent, 0.28), col.accent, shade(col.accent, -0.28)]); g.fill();
  g.strokeStyle = alpha('#ffe2ca', 0.4); g.lineWidth = 1.2; g.stroke();
  g.restore();

  drawChest(g, { ...col, t, chestPulse: o.chestPulse, lit });

  // near arm in front of the shell
  drawArm(g, 104, -244, near[0], near[1], near[2], col);

  // neck
  rr(g, -26, -312, 52, 28, 12); g.fillStyle = col.dark2; g.fill();
  rr(g, -22, -312, 44, 7, 3.5); g.fillStyle = alpha(col.metal, 0.8); g.fill();
  ring(g, 0, -302, 30, 2, alpha(col.cool, 0.3));

  // movable head
  const tilt = o.tilt || 0;
  g.save();
  g.translate((o.headShiftX || 0), -300 + (o.headShiftY || 0));
  g.rotate(tilt);
  g.translate(0, 300);

  // antenna
  const beacon = clamp(o.beacon ?? 1) * lit;
  seg(g, [[60, -432], [70, -472]], 5, col.metal);
  circle(g, 70, -475, 7, mix(col.accent, '#ffffff', 0.2));
  if (beacon > 0.02) { glow(g, 70, -475, 26, col.accent, 0.6 * beacon); circle(g, 70, -475, 3.2, alpha('#fff6e8', beacon)); }

  // ear pods
  for (const [ex, farEar] of [[-96, true], [96, false]]) {
    g.save(); g.translate(ex, -366);
    g.fillStyle = farEar ? shade(col.dark, -0.1) : col.dark;
    g.beginPath(); g.ellipse(0, 0, 17, 27, 0, 0, TAU); g.fill();
    g.strokeStyle = alpha(col.metal, 0.6); g.lineWidth = 2; g.stroke();
    circle(g, farEar ? -2 : 3, 0, 5, farEar ? alpha(col.cool, 0.25) : alpha(col.cool, 0.75));
    if (!farEar) glow(g, 3, 0, 18, col.cool, 0.3);
    g.restore();
  }

  shellClipFill(g, headPath, (gg) => {
    gg.fillStyle = linGrad(gg, -110, -440, 112, -304, [
      [0, shade(col.body, 0.16)], [0.4, col.body], [0.72, col.panel], [0.92, shade(col.panel, -0.18)], [1, mix(col.panel, col.cool, 0.28)],
    ]);
    gg.fillRect(-150, -470, 300, 190);
    gg.fillStyle = linGrad(gg, 0, -445, 0, -300, [[0, alpha('#ffffff', 0.22)], [0.55, alpha('#ffffff', 0)], [1, alpha('#2a1814', 0.3)]]);
    gg.fillRect(-150, -470, 300, 190);
    glow(gg, -80, -402, 90, col.warm, 0.26);
    gg.save(); gg.globalCompositeOperation = 'lighter';
    gg.fillStyle = radGrad(gg, 110, -370, 8, 100, [alpha(col.cool, 0.52), alpha(col.cool, 0.1), alpha(col.cool, 0)]);
    gg.fillRect(-150, -470, 300, 190); gg.restore();
    // chin seam
    gg.fillStyle = alpha(col.dark, 0.16); gg.fillRect(-86, -322, 172, 2);
  });
  rimStroke(g, headPath, col.cool, 2.1, 0.4);

  // top crest
  g.save();
  g.beginPath(); g.moveTo(-28, -442); g.bezierCurveTo(-10, -454, 34, -454, 52, -438);
  g.bezierCurveTo(40, -432, -12, -432, -28, -442); g.closePath();
  g.fillStyle = alpha(col.dark, 0.42); g.fill(); g.restore();

  drawVisor(g, { ...col, t, lit, eyeOpen: o.eyeOpen, happy: o.happy, blink: o.blink, lookX: o.lookX, lookY: o.lookY, chestPulse: o.chestPulse });
  // forehead status bar
  rr(g, -44, -437, 88, 7, 3.5); g.fillStyle = alpha(col.dark, 0.5); g.fill();
  rr(g, -44, -437, 88 * clamp(lit), 7, 3.5); g.fillStyle = alpha(col.cool, 0.55); g.fill();
  g.restore();

  g.restore();

  return {
    chest: [x, y + (bob + sag - 186) * s],
    head: [x + (o.headShiftX || 0) * s, y + (bob + sag - 366) * s],
    beacon: [x + 70 * s, y + (bob + sag - 475) * s],
    top: y + (bob + sag - 452) * s,
  };
}

// A shallow circular plinth in perspective. `gy` is the floor line; returns the surface the robot stands on.
export function drawPlinth(g, x, gy, s, t, o = {}) {
  const rx = 234 * s, ry = 52 * s, top = gy - 34 * s;
  const cool = o.cool || ROBOT.cool, warm = o.warm || ROBOT.warm;
  g.save();
  // floor shadow + underglow
  g.fillStyle = radGrad(g, x, gy + 6, 0, rx * 1.45, [alpha('#000000', 0.55), alpha('#000000', 0)]);
  g.beginPath(); g.ellipse(x, gy + 4, rx * 1.5, ry * 0.8, 0, 0, TAU); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, x, gy, 0, rx * 1.4, [alpha(warm, 0.2), alpha(warm, 0.05), alpha(warm, 0)]);
  g.beginPath(); g.ellipse(x, gy, rx * 1.4, ry * 0.7, 0, 0, TAU); g.fill(); g.restore();

  // cylinder side
  const sideH = 26 * s;
  g.fillStyle = linGrad(g, x - rx, 0, x + rx, 0, [shade(ROBOT.metal, -0.55), shade(ROBOT.dark, 0.1), shade(ROBOT.metal, -0.4)]);
  g.fillRect(x - rx, top, rx * 2, sideH);
  g.fillStyle = shade(ROBOT.dark, -0.2);
  g.beginPath(); g.ellipse(x, top + sideH, rx, ry, 0, 0, Math.PI); g.fill();
  // side seams + underlight
  g.strokeStyle = alpha(cool, 0.22); g.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    const px = x + i * rx * 0.36;
    g.beginPath(); g.moveTo(px, top + 4); g.lineTo(px, top + sideH + ry * 0.35); g.stroke();
  }
  g.fillStyle = alpha(warm, 0.3); g.fillRect(x - rx * 0.8, top + sideH - 3, rx * 1.6, 3);

  // top surface
  g.beginPath(); g.ellipse(x, top, rx, ry, 0, 0, TAU);
  g.fillStyle = radGrad(g, x, top, 8, rx, [[0, shade(ROBOT.metal, 0.05)], [0.55, shade(ROBOT.dark, 0.16)], [1, shade(ROBOT.dark, -0.2)]]);
  g.fill();
  g.strokeStyle = alpha(cool, 0.4); g.lineWidth = 2; g.stroke();
  g.beginPath(); g.ellipse(x, top, rx * 0.82, ry * 0.82, 0, 0, TAU); g.strokeStyle = alpha(ROBOT.panel, 0.35); g.stroke();
  g.beginPath(); g.ellipse(x, top, rx * 0.7, ry * 0.7, 0, 0, TAU); g.strokeStyle = alpha(cool, 0.16); g.stroke();
  // ticks
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU, c = Math.cos(a), sn = Math.sin(a);
    const r0 = 0.86, r1 = 0.9;
    g.strokeStyle = alpha(cool, i % 5 === 0 ? 0.45 : 0.16); g.lineWidth = i % 5 === 0 ? 2 : 1;
    g.beginPath(); g.moveTo(x + c * rx * r0, top + sn * ry * r0); g.lineTo(x + c * rx * r1, top + sn * ry * r1); g.stroke();
  }
  // rotating scan arc
  const ang = t * 0.55;
  g.save(); g.translate(x, top); g.scale(1, ry / rx);
  g.beginPath(); g.arc(0, 0, rx * 0.94, ang, ang + 1.1);
  g.strokeStyle = alpha(cool, 0.6); g.lineWidth = 3.5 * (rx / rx); g.stroke();
  g.restore();
  glow(g, x + Math.cos(ang + 0.55) * rx * 0.94, top + Math.sin(ang + 0.55) * ry * 0.94, 40 * s, cool, 0.5);
  // amber inlay glow ring
  g.beginPath(); g.ellipse(x, top, rx * 0.52, ry * 0.52, 0, 0, TAU);
  g.strokeStyle = alpha(warm, 0.34); g.lineWidth = 3; g.stroke();
  glow(g, x, top, rx * 0.6, warm, 0.18);
  g.restore();
  return { top, cx: x, rx, ry };
}
