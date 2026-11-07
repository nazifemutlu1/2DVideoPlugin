// shots/02_lift.js — s002, 2.6–5.0 s. The robot raises the star to its chest; the light grows.
import {
  E, registerShot, layer, ease, prog, clamp, lerp, alpha, circle, glow, radGrad, rng, noise,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, poseAt, P } from '../robot.js';
import { marsScene, marsForeground, marsDust, project } from '../mars_env.js';

const GY = 900, R_X = 1010, R_S = 1.62;

registerShot('s002', {
  draw(g, t, info) {
    const k = ease.inOut(clamp(t / 2.4));
    const cam = {
      z: 1.0 + 0.06 * k,
      x: 34 - 46 * k,
      y: -8 - 10 * k + Math.sin(t * 0.7) * 0.8,
      r: 0.0022 * Math.sin(t * 0.5 + 0.4) * (1 - k * 0.4),
    };
    marsScene(g, t, cam, { gy: GY });

    const pose = poseAt(t, [
      [0.0, P({ star: [38, -146], eyeOpen: 0.94, smile: 0.26, brow: 0.15, headTilt: 3.0, hipY: 0 })],
      [0.45, P({ star: [39, -158], eyeOpen: 0.98, smile: 0.2, brow: 0.3, headTilt: 4.4, hipY: -0.8, lean: -0.4 })],
      [1.05, P({ star: [41, -184], eyeOpen: 1.06, mouthOpen: 0.12, smile: 0.05, brow: 0.65, headTilt: 6.0, hipY: -2.4, lean: -1.3, shoulderLift: 1.4 })],
      [1.58, P({ star: [42, -197], eyeOpen: 1.18, mouthOpen: 0.4, smile: 0.0, brow: 0.9, headTilt: 5.0, hipY: -2.0, lean: -1.1, shoulderLift: 1.8 })],
      [2.08, P({ star: [42, -196], eyeOpen: 1.06, mouthOpen: 0.16, smile: 0.18, brow: 0.55, headTilt: 3.6, hipY: -1.6, lean: -0.7, shoulderLift: 1.4 })],
      [2.40, P({ star: [42, -194], eyeOpen: 0.99, mouthOpen: 0.03, smile: 0.55, brow: 0.35, headTilt: 2.6, hipY: -1.2, lean: -0.5, shoulderLift: 1.0 })],
    ]);
    const lift = clamp((t - 0.4) / 1.2);
    const starI = 0.68 + 0.40 * ease.inOut(lift) + 0.03 * Math.sin(t * 2.4) + 0.04 * Math.exp(-Math.pow((t - 1.62) / 0.26, 2));
    const starW = [R_X + pose.star[0] * R_S * -1, GY + pose.star[1] * R_S];

    layer(g, cam, 1, (gg) => drawRobot(gg, { x: R_X, y: GY, s: R_S, facing: -1, t, pose, starI }));

    // motes of light shaken loose from the star as it rises
    const r = rng(43);
    g.save();
    layer(g, cam, 1, (gg) => {
      gg.save(); gg.globalCompositeOperation = 'lighter';
      const burst = clamp(1 - Math.abs(t - 1.5) / 0.85);
      for (let i = 0; i < 16; i++) {
        const ang = r() * Math.PI * 2, d = 8 + r() * 62 * (0.4 + burst);
        const rise = (r() * 26 + t * (8 + r() * 14)) % 50;
        const mx = starW[0] + Math.cos(ang) * d;
        const my = starW[1] + Math.sin(ang) * d * 0.55 - rise;
        const a = (0.15 + 0.55 * burst) * (0.5 + 0.5 * Math.sin(t * 3 + i));
        circle(gg, mx, my, 0.8 + r() * 1.8, alpha('#ffe4b2', a));
        if (r() > 0.7) glow(gg, mx, my, 8, '#ffd08a', a * 0.5);
      }
      gg.restore();
    });
    g.restore();

    const starS = project(cam, 1, starW[0], starW[1]);
    marsForeground(g, t, cam, { gy: GY, starScreen: starS, fg: 'wide', blur: 8 });
    marsDust(g, t, { seed: 33, count: 38, a: 0.22, wind: 22 });

    // a soft ana-morphic flare as the light comes up
    const flare = ease.inOut(clamp((t - 0.85) / 0.9));
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, starS[0], starS[1], 120 + 50 * Math.sin(t * 1.7), '#ffc47c', 0.08 * starI);
    FX.lensStreak(g, starS[0], starS[1], std_w(t), '#ffd9a6', 0.07 * flare * starI, 1.6);
    g.restore();
  },
});

function std_w(t) {
  return 760 + Math.sin(t * 0.8) * 60;
}
