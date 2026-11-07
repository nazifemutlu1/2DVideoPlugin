// s004 — above the city. A paper cloud clears to reveal the diorama; the kid dangles,
// looks down, then tucks his knees and grips while the camera eases back.
import { lerp, prog, ease, registerShot, glow, layer } from '/engine/core.js';
import {
  P, drawBalloon, balloonAnchor, drawTwineTo, drawKnot, paperCloud, paperDust, paperShape,
} from '../_paper_kit.js';
import { aerialBackdrop, aerialForeground } from '../sets/aerial.js';
import { poseAt, kidRig, drawKid } from '../_paper_kid.js';

const DUR = 2.3;

registerShot('s004', {
  draw(g, t) {
    const u = prog(t, 0, DUR);
    const cam = {
      x: lerp(18, -26, ease.inOut(u)),
      y: lerp(-90, 16, ease.inOut(u)),
      z: lerp(1.07, 0.94, ease.inOut(u)),
      r: -0.005 + 0.004 * Math.sin(t * 1.2),
    };
    aerialBackdrop(g, cam, t);

    const b = {
      cx: 540 + 14 * Math.sin(t * 0.8),
      cy: 330 + 8 * Math.sin(t * 1.05 + 1.2),
      rx: 274, ry: 290,
      rot: -0.03 + 0.022 * Math.sin(t * 0.7),
      seed: 14, shadow: 26,
    };
    const anchor = balloonAnchor(b);
    const pull = ease.inOut(prog(t, 0.78, 1.62));
    const pose = poseAt(t, [[0, 'dangle'], [0.62, 'dangle'], [1.5, 'pull']], ease.inOut);
    const hipX = anchor.neck[0] + 11 * Math.sin(t * 1.15);
    const hipY = anchor.neck[1] + 558 - 9 * pull;
    const opts = {
      expr: t < 1.15 ? 'awe' : 'determined',
      look: [lerp(0.15, 0.35, pull), lerp(0.75, -0.25, pull)],
      headAdd: lerp(9, -5, pull),
      sway: 2.4, phase: 0.6,
      legOffN: 9 * Math.sin(t * 2.4), legOffF: -7 * Math.sin(t * 2.4 + 0.9),
      scarfBoost: 0.5 + 0.3 * pull,
      strandFlutter: 0.9,
      wind: [-0.85, 0.3],
      hatLift: 2.2,
    };
    const rig = kidRig({ x: hipX, y: hipY, s: 0.86, facing: 1, pose, t, ...opts });

    layer(g, cam, 1, gg => {
      glow(gg, b.cx + 42, b.cy + 50, 470, P.gold, 0.09);
      drawTwineTo(gg, [rig.handle.x, rig.handle.y], anchor.neck, { w: 3.4, sag: 2, color: P.creamDim });
      drawBalloon(gg, b);
      drawKid(gg, opts, rig);
      drawKnot(gg, rig.handle.x, rig.handle.y - 2, 0.9, rig.handle.angle);
    });

    const reveal = ease.inOut(prog(t, 0, 0.6));
    if (reveal < 1) {
      const edgeY = lerp(2150, -420, reveal);
      const pts = [[-220, edgeY - 2400], [1300, edgeY - 2400]];
      for (let i = 8; i >= 1; i--) pts.push([lerp(-220, 1300, i / 8), edgeY + Math.sin(i * 2.7) * 18 + (i % 2 ? 10 : -8)]);
      pts.push([-220, edgeY]);
      paperShape(g, {
        x: -220, y: edgeY - 2400, w: 1520, h: 2400, pts,
        fill: P.cream, shadow: 30, sx: -8, sy: 16, tex: 0.5, grad: 0.12, edge: 0.2, lw: 3,
      });
      paperCloud(g, { x: -240, y: edgeY - 170, w: 620, h: 260, seed: 87, color: P.cream, alpha: 0.99, shadow: 26 });
      paperCloud(g, { x: 260, y: edgeY - 130, w: 620, h: 230, seed: 91, color: P.cream, alpha: 0.99, shadow: 24 });
      paperCloud(g, { x: 760, y: edgeY - 185, w: 540, h: 270, seed: 95, color: P.cream, alpha: 0.99, shadow: 26 });
      paperCloud(g, { x: 40, y: edgeY + 40, w: 520, h: 230, seed: 99, color: P.creamDim, alpha: 0.85, shadow: 20 });
    }
    paperDust(g, t, { n: 12, seed: 31, x: 540, y: 1000, spreadX: 460, spreadY: 520, size: 2.6, alpha: 0.18 });
    aerialForeground(g, cam, t);
  },
});
