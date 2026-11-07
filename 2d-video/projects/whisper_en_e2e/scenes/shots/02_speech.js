// shots/02_speech.js — s002 "This is a short English test." The chest emitter turns speech into light and type.
import {
  E, V, registerShot, layer, ease, prog, clamp, lerp, alpha, seg, circle, ring, glow, talkAmount, text, measure, FONTS,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, drawPlinth, ROBOT } from '../robot.js';
import { signalLab, labForeground } from '../sets/signal_lab.js';
import { findWord } from '../timings.js';

const HERO_X = E.W * 0.375;
const RS = 1.2;
const COOL = '#7ce7ff';
const WARM = '#ffb070';
const CREAM = '#fff1dc';

const LINES = [[0, 1, 2, 3], [4, 5]];
const X0 = 1084, INDENT = 64, Y1 = 502, Y2 = 592, MAXW = 520, GAP = 19;

function layoutWords(g, words) {
  let size = 62;
  const width = (ids) => ids.reduce((a, i) => a + measure(g, words[i].word, size, FONTS.title, 700), 0) + GAP * (ids.length - 1);
  const total = Math.max(width(LINES[0]), width(LINES[1]) + INDENT);
  if (total > MAXW) size *= MAXW / total;
  const out = [];
  LINES.forEach((ids, line) => {
    let x = X0 + (line ? INDENT : 0);
    const y = line ? Y2 : Y1;
    for (const i of ids) {
      const w = measure(g, words[i].word, size, FONTS.title, 700);
      out[i] = { x: x + w / 2, y, w, size, line };
      x += w + GAP;
    }
  });
  return { out, size, w1: width(LINES[0]), w2: width(LINES[1]) };
}

registerShot('s002', {
  draw(g, t, info) {
    const dur = info.dur;
    const k = ease.inOut(t / dur);
    const cam = { x: lerp(-24, 18, k), y: lerp(0, -4, k), z: lerp(1.08, 1.12, k), r: lerp(0, 0.01, k) };
    const { GY } = signalLab(g, t, cam, { heroX: HERO_X, mood: 'night' });

    const words = (info.glyphs || info.line.split(' ')).map((w) => ({ word: w, ...findWord(w, info.shot.start) }));
    const starts = words.map((w) => w.start - info.shot.start);
    const first = starts[0], last = words[words.length - 1].end - info.shot.start;
    const talk = talkAmount(info.globalT, words[0].start, words[words.length - 1].end);
    const emph = Math.max(0, ...starts.map((s) => (t >= s ? Math.max(0, 1 - (t - s) / 0.55) : 0)));
    const settle = ease.inOut(prog(t, last + 0.18, last + 0.62));
    const happy = 0.5 * ease.inOut(prog(t, last + 0.22, last + 0.62));

    let robot;
    layer(g, cam, 1, (gg) => {
      const plinth = drawPlinth(gg, HERO_X, GY, RS, t, { warm: WARM, cool: COOL });
      robot = drawRobot(gg, {
        x: HERO_X, y: plinth.top, s: RS, t,
        lit: 1,
        eyeOpen: 1,
        happy,
        blink: t > 2.28 && t < 2.36,
        tilt: -0.018 - 0.012 * emph + 0.008 * Math.sin(t * 1.1),
        headShiftX: 4 + 2 * emph,
        headShiftY: Math.sin(t * 1.3) * 0.8,
        lookX: 0.78,
        lookY: 0.1,
        nearArm: [
          lerp(0.34, 0.72, ease.out(prog(t, first - 0.06, first + 0.3))) + 0.16 * emph - 0.1 * settle,
          lerp(0.1, 0.22, ease.out(prog(t, first - 0.06, first + 0.3))) - 0.06 * emph,
          -0.05 + 0.18 * emph + 0.02 * Math.sin(t * 3.1),
        ],
        farArm: [-0.3 - 0.03 * Math.sin(t * 1.25), -0.06, 0],
        chestPulse: 0.2 + 0.75 * talk,
        beacon: 1,
        accent: ROBOT.accent, body: ROBOT.body, panel: ROBOT.panel, visor: ROBOT.visor,
        warm: ROBOT.warm, cool: ROBOT.cool,
      });
    });

    // chest emitter: continuous soft rings while speaking + a brighter burst on every word onset
    layer(g, cam, 1, (gg) => {
      const [cx, cy] = robot.chest;
      gg.save(); gg.globalCompositeOperation = 'lighter';
      if (talk > 0.02) {
        for (let i = 0; i < 3; i++) {
          const p = ((t - first) * 0.62 + i / 3) % 1;
          ring(gg, cx, cy, 40 + p * 158, 1.8, alpha(COOL, 0.17 * (1 - p) * talk));
        }
      }
      starts.forEach((s, i) => {
        const age = t - s;
        if (age < 0 || age > 0.62) return;
        const u = age / 0.62, e = ease.out(u);
        ring(gg, cx, cy, 46 + e * (118 + i * 8), 2.6 * (1 - u * 0.6), alpha(COOL, 0.34 * (1 - u)));
        ring(gg, cx, cy, 30 + e * (74 + i * 5), 1.2, alpha('#eaffff', 0.22 * (1 - u)));
      });
      gg.restore();
    });

    // typographic block, one word per real word onset
    layer(g, cam, 1, (gg) => {
      const { out: pos, w2 } = layoutWords(gg, words);
      // baseline anchor grows after the final word
      const ul = ease.out(prog(t, starts[5] + 0.06, starts[5] + 0.46));
      if (ul > 0) {
        const ux = X0 + INDENT, uy = Y2 + 47;
        seg(gg, [[ux, uy], [ux + (w2 + 14) * ul, uy]], 2, alpha(COOL, 0.42 * ul));
        circle(gg, ux + (w2 + 14) * ul, uy, 2.6, alpha(WARM, 0.85 * ul));
        glow(gg, ux + (w2 + 14) * ul, uy, 18, WARM, 0.35 * ul);
      }
      words.forEach((w, i) => {
        const s = starts[i], age = t - s;
        if (age < 0) return;
        const app = clamp(age / 0.34);
        const pop = ease.outBack(app);
        const flash = Math.max(0, 1 - age / 0.5) ** 2;
        const p = pos[i];
        const rise = (1 - ease.out(app)) * 16;
        gg.save();
        gg.translate(p.x, p.y + rise);
        gg.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop);
        gg.globalAlpha *= clamp(age / 0.12);
        const isLast = i === words.length - 1;
        text(gg, w.word, 0, 0, {
          size: p.size, font: FONTS.title, weight: 700, align: 'center',
          color: isLast ? WARM : CREAM,
          glow: 16 + 26 * flash, glowColor: alpha(isLast ? WARM : COOL, 0.45 + 0.4 * flash),
          alpha: 0.9 + 0.1 * app,
        });
        if (flash > 0.02) {
          gg.save(); gg.globalCompositeOperation = 'lighter';
          glow(gg, 0, 0, p.w * 0.46, isLast ? WARM : COOL, 0.16 * flash);
          gg.restore();
        }
        gg.restore();
        // small register tick at each word's left edge on arrival
        if (age < 0.4) {
          const q = age / 0.4;
          circle(gg, p.x - p.w / 2 - 11, p.y + 4, 2.2, alpha(COOL, 0.5 * (1 - q)));
        }
      });
    });

    labForeground(g, t, cam, 'left', { blur: 13 });
    FX.dust(g, t, { seed: 8, count: 38, color: '#ffd7ae', a: 0.26, size: 2.1 });
    FX.dust(g, t, { seed: 14, count: 18, color: '#a9f4ff', a: 0.12, size: 1.4 });
    FX.lensStreak(g, 780, 252, 1500, '#ffd9a0', 0.09, 2);
    FX.fog(g, GY + 40, 170, '#a8746a', 0.09);
  },
});
