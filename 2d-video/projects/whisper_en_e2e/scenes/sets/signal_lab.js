// scenes/sets/signal_lab.js — one reusable futuristic signal lab.
// Depth stack: exterior city 0.14 → architecture 0.36 → equipment 0.72 → floor 0.86 → hero 1.0 → foreground 1.65.
import {
  E, V, mood, layer, blurLayer, backdrop, rr, seg, circle, ring, poly, linGrad, radGrad, glow, alpha, shade, mix, clamp, text, FONTS, rng,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const labGround = () => E.H * V(0.8, 0.68);

const WARM = '#ffb070';
const COOL = '#7ce7ff';

function windowGeom(GY) {
  return { x: -150, y: GY - 742, w: 1190, h: 652, cx: 445 };
}

function drawExterior(g, t, GY, M) {
  const win = windowGeom(GY);
  backdrop(g, ['#070c18', '#101a34', '#2a2a4c', '#5a3a4a', '#b06a4a', '#3a1e1c'], [-E.W, -E.H, E.W * 3, E.H * 3]);
  // stars above the warm haze
  FX.stars(g, t, { seed: 21, count: 90, area: [win.x, win.y + 30, win.w, 320], color: '#dfeeff' });
  // low amber sun behind the skyline, clear of the left console
  FX.sun(g, win.x + 470, GY - 330, 48, '#fff0d2', WARM, 5.5);
  // warm horizon bloom behind the city
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, 0, GY - 330, 0, GY - 30, [alpha('#ff9a5a', 0), alpha('#ff9a5a', 0.15), alpha('#ffcf8a', 0.06)]);
  g.fillRect(win.x, GY - 340, win.w, 340); g.restore();
  // layered city, far to near
  FX.skyline(g, { seed: 31, x: win.x - 60, y: GY - 150, w: win.w + 120, minH: 100, maxH: 280, color: '#1a2034', windowColor: alpha('#ffcf8a', 0.7), lit: 0.26, minW: 32, maxW: 86 });
  FX.skyline(g, { seed: 32, x: win.x - 30, y: GY - 150, w: win.w + 80, minH: 60, maxH: 190, color: '#0e1320', windowColor: alpha('#ffd9a8', 0.8), lit: 0.34, minW: 22, maxW: 60 });
  // signal array outside: dish on a mast, a lab landmark
  g.save(); g.translate(win.x + 250, GY - 330);
  g.strokeStyle = '#0c1119'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 210); g.lineTo(0, 40); g.stroke();
  g.beginPath(); g.moveTo(-58, 210); g.lineTo(0, 140); g.lineTo(58, 210); g.stroke();
  g.save(); g.rotate(-0.32);
  g.fillStyle = '#0a0f17'; g.beginPath(); g.ellipse(0, 0, 92, 34, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = alpha(COOL, 0.22); g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 92, 34, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#0a0f17'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -34); g.lineTo(0, -90); g.stroke();
  g.restore();
  g.fillStyle = alpha('#ff6a4a', 0.85); circle(g, 0, 34, 4.5, alpha('#ff6a4a', 0.9));
  glow(g, 0, 34, 24, '#ff6a4a', 0.45 + 0.25 * Math.sin(t * 2.4));
  g.restore();
  // atmospheric haze over the view
  FX.fog(g, GY - 300, 210, '#d88a60', 0.14);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, win.x, win.y, win.x + win.w, GY, [alpha(COOL, 0), alpha(COOL, 0.035), alpha(WARM, 0.1)]);
  g.fillRect(win.x, win.y, win.w, win.h); g.restore();
}

function drawWindow(g, t, GY, M) {
  const win = windowGeom(GY);
  // wall with a real hole (append the rounded subpath manually: rr() starts a new path)
  g.save();
  g.beginPath(); g.rect(-E.W, -E.H, E.W * 3, E.H * 3);
  {
    const x = win.x, y = win.y, w = win.w, h = win.h, r = 22;
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  g.fillStyle = linGrad(g, 0, win.y, 0, GY + 200, [shade(M.wall, -0.48), shade(M.wall, -0.66), shade(M.dark, -0.2)]);
  g.fill('evenodd');
  g.restore();
  // deep frame
  g.strokeStyle = shade(M.dark, -0.3); g.lineWidth = 30; g.strokeRect(win.x - 12, win.y - 12, win.w + 24, win.h + 24);
  g.strokeStyle = alpha(M.panel || '#c9bfae', 0.18); g.lineWidth = 2; g.strokeRect(win.x + 2, win.y + 2, win.w - 4, win.h - 4);
  // mullions
  g.fillStyle = shade(M.dark, -0.35);
  for (let i = 1; i < 3; i++) g.fillRect(win.x + (win.w * i) / 3 - 7, win.y, 14, win.h);
  g.fillRect(win.x, win.y + win.h * 0.52 - 6, win.w, 12);
  // transom shadow + glints
  g.fillStyle = alpha(COOL, 0.2); g.fillRect(win.x, win.y + win.h * 0.52 + 7, win.w, 2);
  g.save(); g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip();
  g.fillStyle = alpha('#d8fbff', 0.045);
  poly(g, [[win.x + 160, win.y], [win.x + 470, win.y], [win.x + 60, win.y + win.h], [win.x - 80, win.y + win.h]], alpha('#d8fbff', 0.035));
  poly(g, [[win.x + 780, win.y], [win.x + 860, win.y], [win.x + 420, win.y + win.h], [win.x + 340, win.y + win.h]], alpha('#d8fbff', 0.03));
  g.restore();
  // warm light band at the sill + cyan strip
  g.fillStyle = alpha(WARM, 0.72); g.fillRect(win.x, win.y + win.h - 4, win.w, 4);
  glow(g, win.x + win.w * 0.5, win.y + win.h, 320, WARM, 0.24);
  g.fillStyle = alpha(COOL, 0.55); g.fillRect(win.x, win.y + 16, win.w, 2);
  glow(g, win.x + win.w * 0.5, win.y + 17, 260, COOL, 0.13);
  // warm inner edge on the window jamb (key light side)
  g.fillStyle = alpha(WARM, 0.28); g.fillRect(win.x, win.y + 18, 2, win.h - 22);

  // wall panelling right of the window
  const wallRight = win.x + win.w;
  g.fillStyle = linGrad(g, wallRight, 0, E.W * 2, 0, [shade(M.wall, -0.52), shade(M.wall, -0.7), shade(M.dark, -0.25)]);
  g.fillRect(wallRight, win.y - 80, E.W * 2, GY - win.y + 200);
  for (const x of [wallRight + 120, wallRight + 380, wallRight + 640, wallRight + 900, wallRight + 1180]) {
    g.fillStyle = alpha('#000000', 0.22); g.fillRect(x, win.y - 60, 6, GY - win.y + 120);
    g.fillStyle = alpha('#ffffff', 0.025); g.fillRect(x + 6, win.y - 60, 2, GY - win.y + 120);
  }
  for (const y of [win.y + 140, win.y + 390, win.y + 560]) {
    g.fillStyle = alpha('#000000', 0.2); g.fillRect(wallRight, y, E.W * 2, 5);
    g.fillStyle = alpha('#ffffff', 0.02); g.fillRect(wallRight, y + 5, E.W * 2, 1);
  }
  // vertical cyan guides
  for (const x of [wallRight + 16, wallRight + 760]) {
    g.fillStyle = alpha(COOL, 0.55); g.fillRect(x, win.y + 20, 3, GY - win.y - 40);
    glow(g, x + 1, GY - 250, 70, COOL, 0.12);
  }
  // location sign
  text(g, 'SIGNAL LAB', wallRight + 104, win.y + 94, { size: 24, color: alpha(M.feature || '#f4efe6', 0.55), font: FONTS.ui, weight: 900, align: 'left', spacing: 8 });
  g.fillStyle = alpha(WARM, 0.8); g.fillRect(wallRight + 104, win.y + 114, 44, 3);
  // wall display with a quiet signal trace
  const sx = wallRight + 404, sy = win.y + 150, sw = 330, sh = 184;
  rr(g, sx - 12, sy - 12, sw + 24, sh + 24, 16); g.fillStyle = shade(M.dark, -0.15); g.fill();
  rr(g, sx, sy, sw, sh, 9); g.fillStyle = '#0a151c'; g.fill();
  g.save(); rr(g, sx, sy, sw, sh, 9); g.clip();
  g.fillStyle = alpha(COOL, 0.08); for (let y = sy + 10; y < sy + sh; y += 12) g.fillRect(sx, y, sw, 1);
  g.strokeStyle = alpha(COOL, 0.62); g.lineWidth = 2.2; g.beginPath();
  for (let i = 0; i <= 64; i++) {
    const u = i / 64, x = sx + 12 + u * (sw - 24);
    const y = sy + sh * 0.54 + Math.sin(u * 18 + t * 2.1) * 15 + Math.sin(u * 47 - t * 1.3) * 5;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  g.fillStyle = alpha(WARM, 0.55); g.fillRect(sx + 12, sy + sh - 26, 74, 3);
  g.restore();
  g.strokeStyle = alpha(M.panel || '#c9bfae', 0.25); g.lineWidth = 1.5; rr(g, sx, sy, sw, sh, 9); g.stroke();
  glow(g, sx + sw / 2, sy + sh / 2, 210, COOL, 0.08);
}

function drawArchitecture(g, t, GY, M) {
  // ceiling and beams (kept above the panoramic window; window frame top is at GY-754)
  g.fillStyle = shade(M.dark, -0.28); g.fillRect(-E.W, -E.H, E.W * 3, GY - 754);
  g.fillStyle = alpha('#000000', 0.35); g.fillRect(-E.W, GY - 770, E.W * 3, 16);
  for (const x of [1700, 2360, 3020]) {
    g.fillStyle = shade(M.dark, -0.4); g.fillRect(x, -60, 26, GY - 692);
    g.fillStyle = alpha('#ffffff', 0.03); g.fillRect(x + 26, -60, 2, GY - 692);
  }
  // warm overhead practical
  rr(g, 1120, 126, 630, 18, 9); g.fillStyle = '#0b0b11'; g.fill();
  rr(g, 1140, 132, 590, 7, 3.5); g.fillStyle = alpha('#ffe5be', 0.95); g.fill();
  glow(g, 1435, 136, 360, WARM, 0.28);
  FX.lensStreak(g, 1435, 136, 1100, '#ffd9a0', 0.11, 2);
  // suspended cable trays
  g.strokeStyle = shade(M.dark, -0.5); g.lineWidth = 5;
  for (const x of [1210, 1660]) { g.beginPath(); g.moveTo(x, 144); g.lineTo(x, 250); g.stroke(); }
  g.strokeStyle = alpha(M.metal || '#5d5560', 0.5); g.lineWidth = 2;
  g.beginPath(); g.moveTo(1210, 250); g.bezierCurveTo(1330, 290, 1520, 250, 1660, 230); g.stroke();
  // warm practical wash down the right wall
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, 1435, 130, 1435, 780, [alpha(WARM, 0.16), alpha(WARM, 0.055), alpha(WARM, 0)]);
  g.fillRect(windowGeom(GY).x + windowGeom(GY).w, 108, E.W * 2, GY - 108); g.restore();
  // rear wall base strip
  g.fillStyle = alpha(COOL, 0.14); g.fillRect(-E.W, GY - 60, E.W * 3, 2);
}

function drawEquipment(g, t, GY, M) {
  const r = rng(41);
  // left console under the window
  const cx = -190, cw = 790, cy = GY - 138;
  g.fillStyle = shade(M.wall, -0.72); g.fillRect(cx, cy, cw, GY - cy + 20);
  g.fillStyle = linGrad(g, 0, cy, 0, GY, [shade(M.metal || '#5d5560', -0.58), shade(M.dark, -0.2)]);
  g.fillRect(cx, cy, cw, 20);
  g.fillStyle = alpha('#ffffff', 0.06); g.fillRect(cx, cy, cw, 2);
  for (let i = 1; i < 7; i++) {
    g.fillStyle = alpha('#000000', 0.25); g.fillRect(cx + (cw * i) / 7, cy + 25, 3, GY - cy - 25);
  }
  // console monitors
  for (let i = 0; i < 3; i++) {
    const mx = cx + 76 + i * 238, my = cy - 92;
    rr(g, mx - 8, my - 8, 176, 106, 8); g.fillStyle = '#080d13'; g.fill();
    rr(g, mx, my, 160, 90, 4); g.fillStyle = alpha('#0d2028', 1 - i * 0.12); g.fill();
    g.strokeStyle = alpha(COOL, 0.5 - i * 0.1); g.lineWidth = 1.6; g.beginPath();
    for (let k = 0; k <= 26; k++) { const u = k / 26, x = mx + 10 + u * 140, y = my + 50 + Math.sin(u * (10 + i * 3) + t * (1.4 + i * 0.3)) * (9 + i * 3); k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    glow(g, mx + 80, my + 45, 100, COOL, 0.06);
  }
  // warm console buttons
  for (let i = 0; i < 5; i++) {
    const bx = cx + 600 + (i % 3) * 38, by = cy + 38 + Math.floor(i / 3) * 28;
    circle(g, bx, by, 5, alpha(WARM, 0.55));
    if (Math.sin(t * 1.6 + i * 2) > 0.2) glow(g, bx, by, 18, WARM, 0.4);
  }
  // right server racks
  const rx = 1790;
  for (let i = 0; i < 3; i++) {
    const x = rx + i * 150, w = 130, h = 430 + i * 40, y = GY - h;
    g.fillStyle = linGrad(g, x, y, x + w, GY, [shade(M.dark, 0.12), shade(M.dark, -0.25)]);
    g.fillRect(x, y, w, h);
    g.fillStyle = alpha('#ffffff', 0.05); g.fillRect(x, y, w, 2);
    g.fillStyle = alpha('#000000', 0.35); g.fillRect(x + w - 5, y, 5, h);
    for (let k = 0; k < 12; k++) {
      const yy = y + 22 + k * 30;
      g.fillStyle = alpha('#000000', 0.32); g.fillRect(x + 14, yy, w - 28, 16);
      const on = Math.sin(t * (1.2 + (k % 3) * 0.4) + k * 1.7 + i) > 0.35;
      circle(g, x + 24, yy + 8, 2.4, on ? alpha(COOL, 0.9) : alpha(COOL, 0.16));
      circle(g, x + 34, yy + 8, 2, on ? alpha(WARM, 0.55) : alpha('#ffffff', 0.08));
      if (on && k % 4 === 0) glow(g, x + 24, yy + 8, 12, COOL, 0.3);
    }
    g.fillStyle = alpha(COOL, 0.42); g.fillRect(x + w / 2 - 1, y + 4, 2, h - 8);
    glow(g, x + w / 2, GY - 200, 70, COOL, 0.08);
    g.strokeStyle = alpha(M.metal || '#5d5560', 0.4); g.lineWidth = 1.5; g.strokeRect(x, y, w, h);
  }
  // cable bundle on the floor
  g.strokeStyle = shade(M.dark, -0.24); g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(1710, GY - 40); g.bezierCurveTo(1600, GY - 4, 1500, GY + 8, 1400, GY - 6); g.stroke();
  g.strokeStyle = alpha(WARM, 0.16); g.lineWidth = 2;
  g.beginPath(); g.moveTo(1710, GY - 46); g.bezierCurveTo(1600, GY - 10, 1500, GY + 2, 1400, GY - 12); g.stroke();
  // a couple of glowing floor markers right of the hero
  for (const [mx, a] of [[1000, 0.4], [1510, 0.22]]) {
    rr(g, mx, GY - 2, 84, 8, 4); g.fillStyle = alpha(COOL, a * 0.6); g.fill();
    glow(g, mx + 42, GY + 2, 80, COOL, a * 0.2);
  }
}

function drawFloor(g, t, GY, M, heroX) {
  g.fillStyle = linGrad(g, 0, GY - 20, 0, E.H * 1.4, ['#221a22', '#151016', '#09070b']);
  g.fillRect(-E.W, GY - 30, E.W * 3, E.H * 2);
  // perspective seams
  const vx = E.W / 2, vy = GY - 280;
  g.strokeStyle = alpha('#ffffff', 0.035); g.lineWidth = 1.5;
  for (let i = -10; i <= 10; i++) {
    const bx = E.W / 2 + i * 150;
    g.beginPath(); g.moveTo(bx, E.H * 1.5); g.lineTo(vx + (bx - vx) * 0.18, vy); g.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const y = GY + 10 + i * 26 + i * i * 5;
    if (y > E.H + 100) break;
    g.strokeStyle = alpha('#ffffff', 0.045); g.beginPath(); g.moveTo(-E.W, y); g.lineTo(E.W * 2, y); g.stroke();
  }
  // sheen
  g.fillStyle = linGrad(g, 0, GY, 0, E.H, [alpha('#ffffff', 0.05), alpha('#ffffff', 0)]); g.fillRect(-E.W, GY, E.W * 3, E.H);
  // window light spill
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, 0, GY - 160, 0, GY + 280, [alpha(WARM, 0.14), alpha(WARM, 0.045), alpha(WARM, 0)]);
  poly(g, [[-140, GY - 60], [850, GY - 60], [1290, GY + 310], [-420, GY + 310]], g.fillStyle);
  g.restore();
  FX.pool(g, 300, GY + 12, 520, 70, WARM, 0.17);
  FX.pool(g, 1460, GY + 14, 300, 44, COOL, 0.1);
  // hero inlay ring
  const rr1 = 440, ry1 = 98;
  g.save(); g.translate(heroX, GY + 2); g.scale(1, ry1 / rr1);
  ring(g, 0, 0, rr1, 2.5, alpha(COOL, 0.18));
  ring(g, 0, 0, rr1 * 0.84, 1.2, alpha(COOL, 0.1));
  g.restore();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    if (i % 6 === 0) continue;
    const c = Math.cos(a), sn = Math.sin(a);
    seg(g, [[heroX + c * rr1 * 0.93, GY + 2 + sn * ry1 * 0.93], [heroX + c * rr1 * 0.98, GY + 2 + sn * ry1 * 0.98]], 1.2, alpha(COOL, 0.16));
  }
  glow(g, heroX, GY + 2, 360, COOL, 0.035);
  // reflections under practicals
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, 0, GY, 0, GY + 260, [alpha(WARM, 0.08), alpha(WARM, 0)]);
  g.fillRect(1100, GY, 720, 260);
  g.restore();
}

export function signalLab(g, t, cam, o = {}) {
  const M = mood(o.mood || 'night');
  const GY = labGround(), CX = E.W / 2;
  const heroX = o.heroX ?? E.W * 0.375;
  layer(g, cam, 0.14, (gg) => drawExterior(gg, t, GY, M));
  layer(g, cam, 0.36, (gg) => { drawWindow(gg, t, GY, M); drawArchitecture(gg, t, GY, M); });
  layer(g, cam, 0.72, (gg) => drawEquipment(gg, t, GY, M));
  layer(g, cam, 0.86, (gg) => drawFloor(gg, t, GY, M, heroX));
  // warm atmosphere drifting through the key light
  layer(g, cam, 0.55, (gg) => {
    gg.save(); gg.globalCompositeOperation = 'lighter';
    gg.fillStyle = linGrad(gg, windowGeom(GY).x, GY - 700, windowGeom(GY).x + 900, GY, [alpha(WARM, 0.05), alpha(WARM, 0)]);
    gg.fillRect(-E.W, GY - 760, E.W * 2, 780); gg.restore();
    FX.godRays(gg, windowGeom(GY).x + 420, GY - 560, { count: 8, angle: 1.08, spread: 0.7, len: 1300, color: WARM, a: 0.028, t, width: 0.1 });
  });
  return { GY, CX, M, heroX };
}

// Soft foreground depth. Drawn last and deliberately out of focus (approximate, not a true DOF).
export function labForeground(g, t, cam, kind = 'ring', o = {}) {
  const GY = labGround();
  const amount = o.blur ?? 13;
  blurLayer(g, amount, (gg) => {
    if (kind === 'ring') {
      const x = o.x ?? 1690, y = o.y ?? GY - 190, R = o.r ?? 246;
      gg.save(); gg.translate(x, y); gg.rotate(-0.18);
      ring(gg, 0, 0, R, 24, alpha('#0d2630', 0.4));
      ring(gg, 0, 0, R - 2, 3, alpha(COOL, 0.64));
      ring(gg, 0, 0, R - 28, 1.5, alpha(COOL, 0.26));
      ring(gg, 0, 0, R + 24, 2, alpha(WARM, 0.32));
      ring(gg, 0, 0, R + 36, 7, alpha(WARM, 0.07));
      gg.strokeStyle = alpha('#eaffff', 0.18); gg.lineWidth = 8;
      gg.beginPath(); gg.arc(0, 0, R - 10, -2.1, -1.35); gg.stroke();
      gg.strokeStyle = alpha(COOL, 0.38); gg.lineWidth = 2;
      gg.beginPath(); gg.arc(0, 0, R - 14, -0.6 + t * 0.06, 0.3 + t * 0.06); gg.stroke();
      gg.strokeStyle = alpha(WARM, 0.3); gg.lineWidth = 3;
      gg.beginPath(); gg.arc(0, 0, R + 10, 2.2, 3.15); gg.stroke();
      circle(gg, -R * 0.55, -R * 0.62, 8, alpha('#e8ffff', 0.5));
      glow(gg, -R * 0.45, -R * 0.5, 70, COOL, 0.2);
      gg.restore();
    } else if (kind === 'left') {
      const x = -70, w = 210;
      gg.save();
      gg.fillStyle = linGrad(gg, x, 0, x + w, 0, [alpha('#08141a', 0.9), alpha('#0c2530', 0.55), alpha('#0d2530', 0.08)]);
      rr(gg, x, -200, w, GY + 640, 54); gg.fill();
      gg.fillStyle = alpha(COOL, 0.4); rr(gg, x + w - 12, -100, 5, GY + 450, 2.5); gg.fill();
      gg.fillStyle = alpha(WARM, 0.3); rr(gg, x + w - 30, 260, 3, GY + 100, 1.5); gg.fill();
      circle(gg, x + w * 0.55, 120, 12, alpha(COOL, 0.45));
      glow(gg, x + w * 0.55, 120, 90, COOL, 0.22);
      gg.restore();
      // hanging cable, right edge
      gg.strokeStyle = alpha('#09070c', 0.85); gg.lineWidth = 22;
      gg.beginPath(); gg.moveTo(E.W + 80, -80); gg.bezierCurveTo(E.W - 140, 180, E.W - 60, 480, E.W - 210, E.H + 90); gg.stroke();
      gg.strokeStyle = alpha(WARM, 0.14); gg.lineWidth = 2;
      gg.beginPath(); gg.moveTo(E.W + 80, -90); gg.bezierCurveTo(E.W - 140, 170, E.W - 60, 470, E.W - 210, E.H + 80); gg.stroke();
    } else if (kind === 'frame') {
      // bottom-left console shoulder and a glass corner, both outside the text zones
      gg.save();
      gg.fillStyle = linGrad(gg, 0, E.H - 320, 0, E.H, [alpha('#0a1116', 0.9), alpha('#040507', 0.98)]);
      poly(gg, [[-120, E.H + 40], [170, E.H - 290], [620, E.H + 40]], gg.fillStyle);
      gg.fillStyle = alpha(COOL, 0.35); rr(gg, 154, E.H - 292, 190, 5, 2.5); gg.fill();
      glow(gg, 240, E.H - 288, 130, COOL, 0.14);
      gg.restore();
      if (o.glass !== false) {
        gg.save(); gg.translate(E.W - 80, E.H * 0.46);
        ring(gg, 0, 0, 300, 16, alpha('#0b1a20', 0.65));
        ring(gg, 0, 0, 296, 2, alpha(COOL, 0.26));
        gg.restore();
      }
      gg.strokeStyle = alpha('#070509', 0.9); gg.lineWidth = 30;
      gg.beginPath(); gg.moveTo(0, E.H + 40); gg.bezierCurveTo(100, E.H - 160, 260, E.H - 200, 480, E.H + 30); gg.stroke();
      gg.strokeStyle = alpha(WARM, 0.16); gg.lineWidth = 2;
      gg.beginPath(); gg.moveTo(0, E.H + 34); gg.bezierCurveTo(100, E.H - 166, 260, E.H - 206, 480, E.H + 24); gg.stroke();
    }
  }, cam, 1.65);
}
