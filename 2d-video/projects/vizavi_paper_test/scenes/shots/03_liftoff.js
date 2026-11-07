// s003 — lift-off. The camera lags the hero, so the street canyon drops in layered parallax.
// Ghost copies imitate a smear; they are not true motion blur. A foreground paper cloud wipes.
import { lerp, prog, ease, shake, registerShot, glow } from '/engine/core.js';
import {
  P, drawBalloon, balloonAnchor, drawTwineTo, drawKnot, paperCloud, paperShape, tornBandPts,
  paperDust, paperScraps,
} from '../_paper_kit.js';
import { streetBackdrop, streetForeground } from '../sets/street.js';
import { poseAt, kidRig, drawKid } from '../_paper_kid.js';

const DUR = 3.2;

registerShot('s003', {
  draw(g, t) {
    const [shx, shy] = shake(t, 5.5 * Math.exp(-t * 1.5) + 1.6, 2.7, 8);
    const rise = ease.inOut(prog(t, 0.02, 2.9));
    const cam = {
      x: 6 + 34 * rise + shx * 0.7,
      y: -2180 * rise + shy,
      z: 1.045 - 0.125 * ease.inOut(prog(t, 0, 3.2)),
      r: -0.014 + 0.007 * Math.sin(t * 2.4),
    };
    streetBackdrop(g, cam, t);

    const e = 0.28 * ease.out(prog(t, 0.02, 0.5)) + 0.72 * ease.inOut(prog(t, 0.5, 2.87));
    const neckY = lerp(672, 196, e);
    const b = {
      cx: 540 + 12 * Math.sin(t * 1.2),
      cy: neckY - 376,
      rx: 322, ry: 382,
      rot: -0.02 + 0.04 * Math.sin(t * 1.5),
      seed: 12, shadow: 30,
    };
    const anchor = balloonAnchor(b);
    const flail = prog(t, 0.16, 0.42) * (1 - prog(t, 1.45, 2.25));
    const pose = poseAt(t, [[0, 'strain'], [0.52, 'dangle']], ease.out);
    const hipX = anchor.neck[0] + 12 * Math.sin(t * 1.7) - 8 * e;
    const hipY = anchor.neck[1] + 724;

    const opts = {
      expr: t < 1.0 ? 'scared' : 'awe',
      look: [0.05, -0.8],
      headAdd: -4 + 7 * flail,
      sway: 3.2,
      phase: 0.3,
      legOffN: Math.sin(t * 9.5) * 30 * flail,
      legOffF: Math.sin(t * 9.5 + 1.7) * 26 * flail,
      armOffN: 3 * Math.sin(t * 11) * flail,
      armOffF: -3 * Math.sin(t * 11 + 0.8) * flail,
      scarfBoost: 0.65 + 0.55 * flail,
      strandFlutter: 0.9,
      wind: [lerp(0.28, -0.7, prog(t, 0.15, 1.6)), lerp(1, 0.32, prog(t, 0.15, 1.6))],
      hatLift: 1.5 + 2 * flail,
    };
    const rig = kidRig({ x: hipX, y: hipY, s: 0.97, facing: 1, pose, t, ...opts });

    glow(g, b.cx + 40, b.cy + 60, 460, P.gold, 0.1);
    drawTwineTo(g, [rig.handle.x, rig.handle.y], anchor.neck, { w: 3.4, sag: 2, color: P.creamDim });
    drawBalloon(g, b);

    // imitation of a trailing smear: two translucent copies of the puppet, below the hero
    g.save();
    g.globalAlpha = 0.13; g.translate(0, 30); drawKid(g, { ...opts, showHandle: true }, kidRig({ ...opts, x: hipX, y: hipY, s: 0.97, facing: 1, pose, t: t - 0.06, sway: 2.6 }));
    g.globalAlpha = 0.06; g.translate(0, 38); drawKid(g, { ...opts, showHandle: true }, kidRig({ ...opts, x: hipX, y: hipY, s: 0.97, facing: 1, pose, t: t - 0.12, sway: 2.2 }));
    g.restore();

    drawKid(g, opts, rig);
    drawKnot(g, rig.handle.x, rig.handle.y - 2, 0.9, rig.handle.angle);

    paperScraps(g, t, { n: 26, seed: 17, x: 560, y: 1150, spreadX: 900, spreadY: 1100, driftY: 210, driftX: -24, size: 10, alpha: 0.48 });
    paperDust(g, t, { n: 18, seed: 23, x: 540, y: 980, spreadX: 620, spreadY: 700, size: 3, alpha: 0.2 });

    streetForeground(g, cam, t);

    // vertical speed streaks, drawn as paper fibres rather than blur
    g.save(); g.globalAlpha = 0.13 + 0.08 * flail; g.strokeStyle = P.creamHi; g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = 380 + i * 44 + Math.sin(i * 2.1) * 13;
      const y = ((i * 277 + t * 760) % 1900) - 80;
      g.lineWidth = 1.5 + (i % 3) * 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 84 + (i % 4) * 28); g.stroke();
    }
    g.restore();

    const wipe = ease.inOut(prog(t, 2.52, 3.12));
    if (wipe > 0) {
      const edgeY = lerp(2100, -240, wipe);
      paperShape(g, {
        x: -200, y: edgeY, w: 1480, h: 2600,
        pts: tornBandPts(-200, 1280, edgeY, 2600, 87, 20, 14),
        fill: P.cream, shadow: 28, sx: -8, sy: 16, tex: 0.5, grad: 0.12, edge: 0.22, lw: 3,
      });
      paperCloud(g, { x: -260, y: edgeY - 190, w: 560, h: 250, seed: 87, color: P.cream, alpha: 0.99, shadow: 24 });
      paperCloud(g, { x: 190, y: edgeY - 150, w: 600, h: 220, seed: 91, color: P.cream, alpha: 0.99, shadow: 22 });
      paperCloud(g, { x: 690, y: edgeY - 200, w: 600, h: 260, seed: 95, color: P.cream, alpha: 0.99, shadow: 24 });
    }
  },
});
