// shots/03_wonder.js — s003, 5.0–7.4 s. Close, quiet wonder; the camera settles.
import {
  E, registerShot, layer, ease, prog, clamp, lerp, alpha, circle, glow, radGrad, rng, noise,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, poseAt, P } from '../robot.js';
import { marsScene, marsForeground, marsDust, project } from '../mars_env.js';

const GY = 900, R_X = 1280, R_S = 2.55;

registerShot('s003', {
  draw(g, t) {
    const k = ease.inOut(clamp(t / 2.4));
    const settle = ease.out(clamp(t / 1.9));
    const cam = {
      z: 1.06 + 0.038 * settle,
      x: 150 - 10 * k + noise(t * 0.5, 4) * 1.3,
      y: -180 - 8 * k + noise(t * 0.44, 9) * 0.9,
      r: 0.0009 * Math.sin(t * 0.55 + 1.2),
    };
    marsScene(g, t, cam, { gy: GY });

    const pose = poseAt(t, [
      [0.0, P({ star: [42, -198], eyeOpen: 1.0, smile: 0.36, brow: 0.35, headTilt: 3.0, hipY: -1.0, shoulderLift: 1.2 })],
      [0.55, P({ star: [43, -201], eyeOpen: 1.12, mouthOpen: 0.14, smile: 0.12, brow: 0.7, headTilt: 4.8, hipY: -1.6, shoulderLift: 1.6 })],
      [1.12, P({ star: [43, -203], eyeOpen: 0.86, happy: 0.08, mouthOpen: 0.02, smile: 0.62, brow: 0.45, headTilt: 3.8, hipY: -1.3, shoulderLift: 1.4 })],
      [1.50, P({ star: [43, -202], eyeOpen: 0.32, happy: 0.9, mouthOpen: 0, smile: 0.88, brow: 0.2, headTilt: 2.1, hipY: -1.0, shoulderLift: 1.2 })],
      [1.88, P({ star: [42, -200], eyeOpen: 0.9, happy: 0, blink: 0.0, mouthOpen: 0, smile: 0.82, brow: 0.3, headTilt: 2.6, hipY: -0.8, shoulderLift: 1.0 })],
      [2.40, P({ star: [42, -199], eyeOpen: 0.95, happy: 0, smile: 0.78, brow: 0.25, headTilt: 2.2, hipY: -0.6, shoulderLift: 1.0 })],
    ]);
    const starI = 1.02 + 0.13 * settle + 0.03 * Math.sin(t * 2.6) + 0.05 * Math.exp(-Math.pow((t - 1.5) / 0.3, 2));
    const starW = [R_X + pose.star[0] * R_S * -1, GY + pose.star[1] * R_S];
    const starScreen = project(cam, 1, starW[0], starW[1]);

    layer(g, cam, 1, (gg) => drawRobot(gg, { x: R_X, y: GY, s: R_S, facing: -1, t, pose, starI }));

    // slow orbiting motes of star dust, in world space around the hands
    const r = rng(71);
    g.save();
    layer(g, cam, 1, (gg) => {
      gg.save(); gg.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 13; i++) {
        const ang = t * (0.22 + r() * 0.12) + i * 2.399;
        const d = 38 + r() * 74;
        const mx = starW[0] + Math.cos(ang) * d;
        const my = starW[1] + Math.sin(ang) * d * 0.52 + Math.sin(t * 0.7 + i) * 8;
        const a = 0.16 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.4));
        circle(gg, mx, my, 0.7 + r() * 1.5, alpha('#ffe6b8', a));
        if (i % 3 === 0) glow(gg, mx, my, 10, '#ffd08a', a * 0.35);
      }
      gg.restore();
    });
    g.restore();

    marsForeground(g, t, cam, { gy: GY, starScreen, fg: 'close', blur: 7 });
    marsDust(g, t, { seed: 61, count: 30, a: 0.18, wind: 16 });

    // the star's screen bloom and a tender lens flare
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, starScreen[0], starScreen[1], 170 + 30 * Math.sin(t * 1.9), '#ffbf72', 0.09 * starI);
    FX.lensStreak(g, starScreen[0], starScreen[1], 920, '#ffd9a6', 0.065 * starI, 1.8);
    FX.lensStreak(g, starScreen[0], starScreen[1] - 46, 520, '#9fe8ff', 0.025 * starI, 1.0);
    g.restore();
  },
});
