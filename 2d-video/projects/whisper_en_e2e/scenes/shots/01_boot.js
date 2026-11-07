// shots/01_boot.js — s001 "Hello there." The robot wakes on the plinth; the visor ignites and greets.
import {
  E, V, registerShot, layer, ease, prog, clamp, lerp, alpha, shade, seg, circle, ring, rr, glow, linGrad, talkAmount, text, FONTS,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, drawPlinth, ROBOT } from '../robot.js';
import { signalLab, labForeground } from '../sets/signal_lab.js';
import { findWord } from '../timings.js';

const HERO_X = E.W * 0.375;
const RS = 1.2;
const COOL = '#7ce7ff';
const WARM = '#ffb070';

registerShot('s001', {
  draw(g, t, info) {
    const dur = info.dur;
    const k = ease.inOut(t / dur);
    const cam = { x: lerp(18, 0, k), y: lerp(8, 0, k), z: lerp(1.0, 1.08, k), r: 0 };
    const { GY } = signalLab(g, t, cam, { heroX: HERO_X, mood: 'night' });

    const hello = findWord('Hello', info.shot.start);
    const there = findWord('there.', info.shot.start);
    const h = hello.start - info.shot.start;
    const tr = there.start - info.shot.start;

    const boot = ease.out(prog(t, 0.08, 1.0));
    const ignite = ease.out(prog(t, 0.16, 0.72));
    const greet = ease.out(prog(t, h - 0.02, h + 0.34));
    const happy = ease.out(prog(t, 0.58, 0.74)) * (1 - ease.inOut(prog(t, 0.98, 1.38)));
    const talk = talkAmount(info.globalT, hello.start, there.end);
    const raise = clamp(
      ease.out(prog(t, h + 0.06, h + 0.44)) - ease.inOut(prog(t, h + 1.12, h + 1.58)),
      0, 1,
    );
    const wave = Math.sin((t - h) * 9.5) * 0.18 * raise;
    const headSettle = 1 - ease.inOut(prog(t, 0.1, 0.9));

    let robot;
    layer(g, cam, 1, (gg) => {
      const plinth = drawPlinth(gg, HERO_X, GY, RS, t, { warm: WARM, cool: COOL });
      robot = drawRobot(gg, {
        x: HERO_X, y: plinth.top, s: RS, t,
        boot, lit: 0.05 + 0.95 * ignite,
        eyeOpen: ease.out(prog(t, 0.24, 0.9)),
        happy,
        blink: t > 2.32 && t < 2.4,
        tilt: 0.105 * headSettle - 0.045 * greet - 0.012 * Math.sin(t * 1.15),
        headShiftX: 2 + greet * 4,
        headShiftY: 2.4 * headSettle + Math.sin(t * 1.25) * 0.7,
        lookX: 0.16 + greet * 0.45,
        lookY: 0.06,
        nearArm: [lerp(0.34, 2.42, raise), lerp(0.1, -0.32, raise), wave],
        farArm: [-0.3 - 0.025 * Math.sin(t * 1.2), -0.06, 0],
        chestPulse: 0.18 + 0.62 * talk,
        beacon: 0.15 + 0.85 * ignite,
        accent: ROBOT.accent, body: ROBOT.body, panel: ROBOT.panel, visor: ROBOT.visor,
        warm: ROBOT.warm, cool: ROBOT.cool, shadowA: 1,
      });
    });

    layer(g, cam, 1, (gg) => {
      // boot flash from the visor, then a soft breath-sync ring
      if (t > 0.42) {
        const age = t - 0.42;
        const a = 0.3 * Math.max(0, 1 - age / 0.9);
        gg.save(); gg.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 2; i++) {
          const p = clamp(age / 0.9 - i * 0.16);
          if (p > 0 && p < 1) ring(gg, robot.head[0], robot.head[1], 45 + p * 180, 2, alpha(COOL, a * (1 - p)));
        }
        gg.restore();
        FX.sparkle(gg, robot.head[0] + 46, robot.head[1] - 8, 24, '#eaffff', 0.5 * Math.max(0, 1 - age / 0.55));
      }
      if (talk > 0.02) {
        gg.save(); gg.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 2; i++) {
          const p = ((t - h) * 0.65 + i / 2) % 1;
          ring(gg, robot.chest[0], robot.chest[1], 48 + p * 130, 1.6, alpha(COOL, 0.13 * (1 - p) * talk));
        }
        gg.restore();
      }
      // tiny greeting nod accent at "there."
      if (t > tr && t < tr + 0.5) {
        const p = prog(t, tr, tr + 0.5);
        circle(gg, robot.head[0] - 110, robot.head[1] - 48, 3.2, alpha(WARM, 0.5 * (1 - p)));
      }
    });

    labForeground(g, t, cam, 'ring', { x: V(1710, 900), y: GY - 175, r: 246, blur: 13 });

    FX.dust(g, t, { seed: 5, count: 38, color: '#ffd7ae', a: 0.28, size: 2.1 });
    FX.dust(g, t, { seed: 11, count: 16, color: '#a9f4ff', a: 0.12, size: 1.5 });
    FX.lensStreak(g, 760, 250, 1500, '#ffd9a0', 0.1, 2);
    FX.fog(g, GY + 40, 170, '#a8746a', 0.09);
  },
});
