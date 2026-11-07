// s001 — the hold. Low-angle canyon, an oversized balloon cropped by the top edge,
// the kid braced against short upward tugs. Camera pushes in and tilts with the strain.
import { prog, ease, registerShot, glow, layer } from '/engine/core.js';
import {
  P, drawBalloon, balloonAnchor, drawTwineTo, drawTwine, drawKnot, drawTag, paperDust, paperScraps,
} from '../_paper_kit.js';
import { streetBackdrop, streetForeground, GY } from '../sets/street.js';
import { poseAt, kidRig, drawKid, drawKidShadow } from '../_paper_kid.js';

const DUR = 2.85;
const pulse = (t, at) => {
  const d = t - at;
  return d > 0 ? Math.min(1, d * 16) * Math.exp(-d * 4.2) : 0;
};

registerShot('s001', {
  draw(g, t) {
    const tug = Math.max(pulse(t, 0.95), pulse(t, 2.15));
    const u = prog(t, 0, DUR);
    const cam = {
      x: 5 + 12 * u,
      y: -66 * ease.inOut(u),
      z: 1 + 0.075 * ease.inOut(u),
      r: -0.012 + 0.006 * Math.sin(t * 1.15),
    };
    streetBackdrop(g, cam, t);

    const b = {
      cx: 512 + Math.sin(t * 0.72) * 5,
      cy: 300 + Math.sin(t * 1.1 + 0.5) * 8,
      rx: 322, ry: 382,
      rot: -0.028 + Math.sin(t * 0.85) * 0.028 + 0.05 * tug,
      seed: 12, shadow: 32,
    };
    const pose = poseAt(t, [[0, 'brace'], [0.55, 'strain'], [1.35, 'brace'], [1.9, 'strain'], [2.55, 'brace']], ease.inOut);
    const hipX = 522 + 4 * Math.sin(t * 1.05) + 7 * tug;
    const hipY = GY - 98 + 2 * Math.sin(t * 1.4);
    const rig = kidRig({
      x: hipX, y: hipY, s: 0.97, facing: 1, pose, t,
      sway: 1.7, phase: 0.5, headAdd: -3 + tug * 3,
    });
    const anchor = balloonAnchor(b);

    layer(g, cam, 0.92, gg => {
      drawKidShadow(gg, rig, 0.27, 64, 13);
      glow(gg, b.cx + 96, b.cy - 40, 430, P.gold, 0.09);
      drawTwineTo(gg, [rig.handle.x, rig.handle.y], anchor.neck, { w: 3.4, sag: 3, color: P.creamDim });
      drawTwine(gg, [[545, 770], [580, 786], [612, 768]], { w: 1.8, alpha: 0.8, twists: false });
      drawTag(gg, 615, 800, 0.92, 0.22 + Math.sin(t * 1.4) * 0.08);
      drawBalloon(gg, b);

      drawKid(gg, {
        expr: tug > 0.32 ? 'strain' : 'determined',
        blink: t > 2.26 && t < 2.35,
        look: [-0.1, -0.72],
        scarfBoost: 0.3 + 0.55 * tug,
        strandFlutter: 0.4 + 0.7 * tug,
        wind: [-0.7, 0.25],
        hatLift: tug * 2.6,
      }, rig);
      drawKnot(gg, rig.handle.x, rig.handle.y - 2, 0.9, rig.handle.angle);

      paperDust(gg, t, { n: 22, seed: 7, x: hipX + 18, y: GY - 16, spreadX: 460, spreadY: 170, size: 3.4, alpha: 0.32 });
      paperScraps(gg, t, { n: 11, seed: 9, x: 640, y: 1430, spreadX: 620, spreadY: 300, driftY: -70, driftX: -26, size: 7, alpha: 0.34 });
    });

    streetForeground(g, cam, t);
  },
});
