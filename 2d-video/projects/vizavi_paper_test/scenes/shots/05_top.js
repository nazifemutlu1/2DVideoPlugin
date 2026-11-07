// s005 — the summit. Pip sits on the balloon crown, one hand on the strap, then throws both
// arms up while the camera cranes out to reveal the whole balloon, the long twine and the city.
import { lerp, prog, ease, registerShot, glow, layer, rr } from '/engine/core.js';
import {
  P, drawBalloon, balloonAnchor, drawTwine, drawTag, drawKnot, paperShape, drawStitch,
} from '../_paper_kit.js';
import { aerialBackdrop, aerialForeground } from '../sets/aerial.js';
import { mixPose, kidRig, drawKid } from '../_paper_kid.js';

const DUR = 1.95;
const SIT = { lean: 6, headTilt: -6, armN: [12, 34], armF: [-6, -26], legN: [88, -80], legF: [76, -70], scarf: 0.75, squash: 0, hipDrop: 0 };
const CHEER = { lean: -4, headTilt: -12, armN: [150, 30], armF: [210, -30], legN: [84, -74], legF: [72, -66], scarf: 1.05, squash: 0, hipDrop: 0 };

registerShot('s005', {
  draw(g, t) {
    const u = prog(t, 0, DUR);
    const cam = {
      x: 0,
      y: lerp(0, -34, ease.inOut(u)),
      z: lerp(1.09, 0.9, ease.inOut(u)),
      r: 0.004 * Math.sin(t * 0.9),
    };
    aerialBackdrop(g, cam, t);

    const b = {
      cx: 540 + 6 * Math.sin(t * 0.7),
      cy: 770 + 6 * Math.sin(t * 0.9 + 0.7),
      rx: 300, ry: 320,
      rot: -0.03 + 0.012 * Math.sin(t * 0.6),
      seed: 16, shadow: 30,
    };
    const anchor = balloonAnchor(b);
    const crown = anchor.crown;
    const rise = ease.inOut(prog(t, 0.5, 0.98));
    const pose = mixPose(SIT, CHEER, rise);
    const hipX = crown[0] - 4;
    const hipY = crown[1] + 22 + Math.sin(t * 1.3) * 2;
    const rig = kidRig({
      x: hipX, y: hipY, s: 0.82, facing: 1, pose, t,
      sway: 1.4, phase: 0.4, headAdd: lerp(4, -9, rise),
    });
    const opts = {
      expr: rise > 0.7 ? 'joy' : 'awe',
      showHandle: false,
      look: [0.3, lerp(0.1, -0.55, rise)],
      scarfBoost: 0.65 + 0.35 * rise,
      strandFlutter: 1,
      wind: [-0.9, 0.25],
      hatLift: 1.6,
    };

    layer(g, cam, 1, gg => {
      glow(gg, b.cx + 70, b.cy - 40, 520, P.gold, 0.1);
      drawBalloon(gg, b);
      // mustard saddle over the crown, and the strap loop the near hand rests on
      paperShape(gg, {
        x: crown[0] - 52, y: crown[1] - 10, w: 104, h: 30,
        path: g2 => rr(g2, crown[0] - 52, crown[1] - 10, 104, 30, 14),
        fill: P.mustard, shadow: 9, sx: -4, sy: 7, tex: 0.5, grad: 0.22, edge: 0.2,
      });
      drawStitch(gg, [[crown[0] - 40, crown[1] - 1], [crown[0] + 40, crown[1] - 4]], { w: 1.4, dash: [5, 5], alpha: 0.4 });
      gg.save(); gg.strokeStyle = P.creamDim; gg.lineWidth = 4.5; gg.lineCap = 'round';
      gg.beginPath(); gg.ellipse(crown[0] + 36, crown[1] + 13, 14, 8, -0.25, 0, Math.PI * 2); gg.stroke();
      gg.strokeStyle = 'rgba(255,246,227,.35)'; gg.lineWidth = 1.6; gg.stroke(); gg.restore();

      // long loose twine and a paper tag: height cue
      const neck = anchor.neck;
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const k = i / 9;
        pts.push([neck[0] + 26 * k + Math.sin(k * 6.6 + t * 0.9) * (18 + 34 * k), neck[1] + k * 640]);
      }
      drawTwine(gg, pts, { w: 5.4, color: P.creamDim, alpha: 0.96 });
      drawKnot(gg, neck[0], neck[1], 1.2);
      drawTag(gg, pts[9][0], pts[9][1] + 30, 1.15, Math.sin(t * 0.8) * 0.32);

      drawKid(gg, opts, rig);
    });

    aerialForeground(g, cam, t);
  },
});
