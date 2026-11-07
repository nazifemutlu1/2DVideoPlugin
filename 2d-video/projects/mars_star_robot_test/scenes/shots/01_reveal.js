// shots/01_reveal.js — s001, 0–2.6 s. A wide, low, dusty Mars reveal.
import {
  E, registerShot, layer, ease, prog, clamp, lerp, alpha, glow, radGrad, rng, noise,
} from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawRobot, poseAt, P } from '../robot.js';
import { marsScene, marsForeground, marsDust, project, MARS } from '../mars_env.js';

const GY = 900, R_X = 1240, R_S = 0.94;

registerShot('s001', {
  draw(g, t) {
    const k = ease.inOut(clamp(t / 2.6));
    const cam = {
      z: 1.0 + 0.055 * k,
      x: -8 - 28 * k,
      y: 3 - 5 * k + Math.sin(t * 0.55) * 0.8,
      r: 0.0018 * Math.sin(t * 0.45 + 0.6),
    };
    marsScene(g, t, cam, { gy: GY });

    const pose = poseAt(t, [
      [0.0, P({ star: [38, -137], eyeOpen: 0.58, smile: 0.12, brow: -0.15, headTilt: 5, hipY: 0.5 })],
      [0.8, P({ star: [38, -139], eyeOpen: 0.68, smile: 0.18, brow: 0.0, headTilt: 5.4, blink: t > 1.12 && t < 1.24 ? 1 : 0 })],
      [1.7, P({ star: [39, -146], eyeOpen: 0.9, smile: 0.3, brow: 0.35, headTilt: 0.5, hipY: -1 })],
      [2.6, P({ star: [41, -156], eyeOpen: 1.02, smile: 0.42, brow: 0.55, headTilt: -4, hipY: -1.5, shoulderLift: 1.2 })],
    ]);
    const starI = 0.42 + 0.25 * k + 0.025 * Math.sin(t * 2.0);

    // a soft dust halo behind the small figure so its silhouette separates from the horizon
    const halo = project(cam, 1, R_X - 12, GY - 300);
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, halo[0], halo[1] + 40, 250, '#e5a174', 0.055);
    g.restore();

    layer(g, cam, 1, (gg) => drawRobot(gg, { x: R_X, y: GY, s: R_S, facing: -1, t, pose, starI }));

    const starW = [R_X + pose.star[0] * R_S * -1, GY + pose.star[1] * R_S];
    const starS = project(cam, 1, starW[0], starW[1]);
    marsForeground(g, t, cam, { gy: GY, starScreen: starS, fg: 'wide', blur: 7.5 });
    marsDust(g, t, { seed: 21, count: 34, a: 0.2, wind: 18 });
    screenGlow(g, starS, starI, t);
  },
});

function screenGlow(g, starS, starI, t) {
  const [sx, sy] = starS;
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, sx, sy, 92 + 26 * Math.sin(t * 1.8), '#ffc47c', 0.1 * starI);
  FX.lensStreak(g, sx, sy, 620, '#ffd7a1', 0.07 * starI, 1.4);
  g.restore();
}
