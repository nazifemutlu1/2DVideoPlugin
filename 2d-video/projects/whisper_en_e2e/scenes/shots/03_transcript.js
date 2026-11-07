// shots/03_transcript.js — s003 "Whisper should transcribe these words accurately."
// Each spoken word flies out of the chest emitter and snaps into a timestamped transcript card; the camera pulls back.
import {
  E, V, registerShot, layer, ease, prog, clamp, lerp, alpha, shade, seg, circle, ring, rr, glow, linGrad, talkAmount, text, measure, FONTS,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, drawPlinth, ROBOT } from '../robot.js';
import { signalLab, labForeground } from '../sets/signal_lab.js';
import { findWord, stamp } from '../timings.js';

const HERO_X = E.W * 0.375;
const RS = 1.2;
const COOL = '#7ce7ff';
const WARM = '#ffb070';
const CREAM = '#fff1dc';

const CARD_W = 208, CARD_H = 148, GAP_X = 20, GAP_Y = 22, X0 = 1064, Y0 = 342, COLS = 3;
const PULL_A = 2.03, PULL_B = 2.62;

function cardRect(i) {
  const col = i % COLS, row = Math.floor(i / COLS);
  return { x: X0 + col * (CARD_W + GAP_X), y: Y0 + row * (CARD_H + GAP_Y) };
}

function fitSize(g, word, maxSize, maxW) {
  const w = measure(g, word, maxSize, FONTS.title, 700);
  return w > maxW ? maxSize * (maxW / w) : maxSize;
}

function drawGhost(g, x, y, a) {
  g.save();
  g.setLineDash([7, 7]);
  rr(g, x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1, 16);
  g.strokeStyle = alpha(COOL, 0.34 * a); g.lineWidth = 1.4; g.stroke();
  g.setLineDash([]);
  for (const [cx, cy] of [[x + 10, y + 10], [x + CARD_W - 10, y + 10], [x + 10, y + CARD_H - 10], [x + CARD_W - 10, y + CARD_H - 10]]) {
    g.fillStyle = alpha(COOL, 0.4 * a); g.fillRect(cx - 3, cy - 0.8, 6, 1.6);
  }
  g.restore();
}

function drawCard(g, x, y, word, ts, age, index, pop) {
  const cx = x + CARD_W / 2, cy = y + CARD_H / 2;
  const sc = 0.9 + 0.1 * pop;
  g.save();
  g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
  // warm drop shadow
  g.fillStyle = alpha('#000000', 0.4);
  rr(g, x + 5, y + 9, CARD_W, CARD_H, 17); g.fill();
  // ceramic body
  rr(g, x, y, CARD_W, CARD_H, 16);
  g.fillStyle = linGrad(g, x, y, x + CARD_W, y + CARD_H, ['#fdf6e8', '#f3e5cd', '#e6d1b1']);
  g.fill();
  g.strokeStyle = alpha('#fffaf0', 0.65); g.lineWidth = 1.4; rr(g, x + 1.5, y + 1.5, CARD_W - 3, CARD_H - 3, 14.5); g.stroke();
  // bottom bevel + cyan seam
  g.fillStyle = alpha('#8a6448', 0.16); g.fillRect(x + 16, y + CARD_H - 3, CARD_W - 32, 1.6);
  g.fillStyle = alpha(COOL, 0.35); g.fillRect(x + 16, y + CARD_H - 0.8, CARD_W - 32, 1.2);
  // landing flash
  if (age < 0.3) {
    const q = age / 0.3;
    rr(g, x, y, CARD_W, CARD_H, 16);
    g.fillStyle = alpha('#ffffff', 0.35 * (1 - q)); g.fill();
  }
  // index + status LED
  text(g, String(index + 1).padStart(2, '0'), x + 17, y + 22, { size: 13, font: FONTS.ui, weight: 900, color: alpha('#4a3528', 0.48), align: 'left', spacing: 1 });
  circle(g, x + CARD_W - 19, y + 20, 3.2, alpha(COOL, 0.9));
  glow(g, x + CARD_W - 19, y + 20, 15, COOL, 0.4);
  // word, auto-fitted
  const size = fitSize(g, word, 36, CARD_W - 34);
  text(g, word, cx, y + 72, { size, font: FONTS.title, weight: 700, color: '#2a1c16' });
  // meta hairline
  g.fillStyle = alpha('#5a3f30', 0.2); g.fillRect(x + 17, y + 99, CARD_W - 34, 1.2);
  text(g, 'START', x + 17, y + 120, { size: 10, font: FONTS.ui, weight: 900, color: alpha('#7a5236', 0.72), align: 'left', spacing: 2 });
  const tsSize = 20;
  text(g, ts, x + CARD_W - 17, y + 120, { size: tsSize, font: FONTS.ui, weight: 900, color: '#8a4a24', align: 'right' });
  g.restore();
  return { cx, cy };
}

registerShot('s003', {
  draw(g, t, info) {
    const pull = ease.inOut(prog(t, PULL_A, PULL_B));
    const cam = { x: lerp(12, 0, pull), y: lerp(-4, 0, pull), z: lerp(1.18, 1.0, pull), r: lerp(0.01, 0, pull) };
    const { GY } = signalLab(g, t, cam, { heroX: HERO_X, mood: 'night' });

    const words = (info.cards || []).map((c) => ({ word: c.word, ...findWord(c.word, info.shot.start) }));
    const starts = words.map((w) => w.start - info.shot.start);
    const lastEnd = words[words.length - 1].end - info.shot.start;
    const talk = talkAmount(info.globalT, words[0].start, words[words.length - 1].end);
    const gesture = ease.out(prog(t, 1.7, 2.15));
    const happy = 0.62 * ease.inOut(prog(t, 2.52, 2.94));
    const slots = ease.out(prog(t, 0.02, 0.26));

    let robot;
    layer(g, cam, 1, (gg) => {
      const plinth = drawPlinth(gg, HERO_X, GY, RS, t, { warm: WARM, cool: COOL });
      robot = drawRobot(gg, {
        x: HERO_X, y: plinth.top, s: RS, t,
        lit: 1,
        eyeOpen: 1,
        happy,
        blink: t > 2.98 && t < 3.06,
        tilt: -0.022 - 0.01 * gesture,
        headShiftX: 3 + 4 * gesture,
        headShiftY: Math.sin(t * 1.2) * 0.8,
        lookX: lerp(0.55, 0.84, gesture),
        lookY: 0.08,
        nearArm: [
          lerp(0.34, 1.98, gesture),
          lerp(0.1, -0.32, gesture),
          lerp(0, -0.3, gesture) + 0.03 * Math.sin(t * 2.6) * gesture,
        ],
        farArm: [-0.3 - 0.03 * Math.sin(t * 1.2), -0.06, 0],
        chestPulse: 0.18 + 0.72 * talk,
        beacon: 1,
        accent: ROBOT.accent, body: ROBOT.body, panel: ROBOT.panel, visor: ROBOT.visor,
        warm: ROBOT.warm, cool: ROBOT.cool,
      });
    });

    // chest emitter rings + a ring per delivered card
    layer(g, cam, 1, (gg) => {
      const [cx, cy] = robot.chest;
      gg.save(); gg.globalCompositeOperation = 'lighter';
      if (talk > 0.02) {
        for (let i = 0; i < 3; i++) {
          const p = ((t - starts[0]) * 0.62 + i / 3) % 1;
          ring(gg, cx, cy, 40 + p * 150, 1.7, alpha(COOL, 0.15 * (1 - p) * talk));
        }
      }
      starts.forEach((s, i) => {
        const age = t - (s + 0.22);
        if (age < 0 || age > 0.45) return;
        const u = age / 0.45;
        const r = cardRect(i);
        ring(gg, r.x + CARD_W / 2, r.y + CARD_H / 2, 24 + u * 120, 2.4 * (1 - u), alpha(COOL, 0.3 * (1 - u)));
      });
      gg.restore();
    });

    // dark glass backing so the transcript stays legible over the wall display
    layer(g, cam, 1, (gg) => {
      const px = 1028, py = 260, pw = 730, ph = 442;
      gg.save();
      gg.globalAlpha = 0.94 * ease.out(prog(t, 0.02, 0.32));
      rr(gg, px, py, pw, ph, 22);
      gg.fillStyle = linGrad(gg, px, py, px, py + ph, [alpha('#070a11', 0.86), alpha('#0b0f17', 0.6), alpha('#07090e', 0.52)]);
      gg.fill();
      rr(gg, px + 0.5, py + 0.5, pw - 1, ph - 1, 22);
      gg.strokeStyle = alpha(COOL, 0.16); gg.lineWidth = 1.2; gg.stroke();
      gg.fillStyle = alpha(WARM, 0.55); gg.fillRect(px + 18, py, 84, 2);
      gg.fillStyle = alpha(COOL, 0.3); gg.fillRect(px + pw - 150, py + ph - 1.6, 110, 1.6);
      gg.restore();
    });

    // transcript header
    layer(g, cam, 1, (gg) => {
      gg.globalAlpha = slots;
      const lx = X0, ly = 300;
      gg.fillStyle = alpha(WARM, 0.9); gg.fillRect(lx - 26, ly - 2, 9, 9);
      text(gg, String(info.label || 'TRANSCRIPT'), lx, ly, { size: 21, font: FONTS.ui, weight: 900, color: alpha(CREAM, 0.88), align: 'left', spacing: 6 });
      const lw = 178 * ease.out(prog(t, 0.14, 0.6));
      seg(gg, [[lx, ly + 17], [lx + lw, ly + 17]], 1.4, alpha(WARM, 0.5));
      text(gg, '06 WORDS / EN', X0 + CARD_W * 3 + GAP_X * 2, ly, { size: 13, font: FONTS.ui, weight: 900, color: alpha(COOL, 0.5), align: 'right', spacing: 2 });
      gg.globalAlpha = 1;
    });

    // ghost slots for the coming cards
    layer(g, cam, 1, (gg) => {
      for (let i = 0; i < words.length; i++) {
        const s = starts[i];
        if (t >= s + 0.22) continue;
        const r = cardRect(i);
        drawGhost(gg, r.x, r.y, slots);
      }
    });

    // flying glyphs from chest -> card
    layer(g, cam, 1, (gg) => {
      if (!robot) return;
      const [c0x, c0y] = robot.chest;
      words.forEach((w, i) => {
        const s = starts[i], age = t - s;
        if (age < 0 || age >= 0.22) return;
        const u = ease.inOut(age / 0.22);
        const r = cardRect(i);
        const tx = r.x + CARD_W / 2, ty = r.y + CARD_H / 2;
        const mx = (c0x + tx) / 2, my = Math.min(c0y, ty) - 96 - i * 7;
        const q = (a, b, c) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
        const x = q(c0x, mx, tx), y = q(c0y, my, ty);
        gg.save();
        // trail
        gg.globalCompositeOperation = 'lighter';
        const u2 = Math.max(0, u - 0.22);
        const x2 = (1 - u2) * (1 - u2) * c0x + 2 * (1 - u2) * u2 * mx + u2 * u2 * tx;
        const y2 = (1 - u2) * (1 - u2) * c0y + 2 * (1 - u2) * u2 * my + u2 * u2 * ty;
        seg(gg, [[x2, y2], [x, y]], 2.2, alpha(COOL, 0.4 * (1 - u)));
        gg.restore();
        gg.save();
        gg.translate(x, y);
        gg.globalAlpha *= 1 - u * 0.55;
        const flyingSize = lerp(40, 24, u);
        text(gg, w.word, 0, 0, {
          size: flyingSize, font: FONTS.title, weight: 700, align: 'center',
          color: u < 0.86 ? '#eaffff' : alpha(CREAM, 0.8),
          glow: 20, glowColor: alpha(COOL, 0.65),
        });
        gg.restore();
        glow(gg, x, y, 42, COOL, 0.22 * (1 - u));
      });
    });

    // landed cards
    layer(g, cam, 1, (gg) => {
      words.forEach((w, i) => {
        const s = starts[i], land = s + 0.22, age = t - land;
        if (age < 0) return;
        const r = cardRect(i);
        const pop = ease.outBack(clamp(age / 0.3));
        drawCard(gg, r.x, r.y, w.word, stamp(w.start), age, i, pop);
      });
    });

    labForeground(g, t, cam, 'frame', { blur: 13, glass: false });
    FX.dust(g, t, { seed: 17, count: 36, color: '#ffd7ae', a: 0.25, size: 2 });
    FX.dust(g, t, { seed: 23, count: 16, color: '#a9f4ff', a: 0.11, size: 1.4 });
    FX.lensStreak(g, 760, 250, 1500, '#ffd9a0', 0.09, 2);
    FX.fog(g, GY + 40, 170, '#a8746a', 0.09);
  },
});
