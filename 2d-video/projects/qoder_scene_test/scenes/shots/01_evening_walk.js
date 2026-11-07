// shots/01_evening_walk.js — one continuous 7 s shot: a walk, a falling cup, a hard stop.
import { E, V, registerShot, mood, layer, ease, prog, clamp, lerp, shake, seg, circle, rr, poly, glow, alpha } from '/engine/core.js';
import { drawFigure, blendPose, breathe, walkPose, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { eveningStreet, streetGround, windowSillY, cupX } from '../sets/evening_street.js';

const MIRA = { top: 'trench', color: '#3f7a74', legs: '#1b2230', head: 'beanie', headColor: '#c58a4a' };
const DUR = 7.0, STOP = 3.2, FALL = 2.49, LAND = 3.22;
const WALK_FROM = 320, WALK_TO = 900, S = 1.55;
const WALK = { stride: 34, lift: 15, arm: 22, lean: 3 };
const STEP = 2 * WALK.stride * S;
const G = 2100, CUP_S = 1.4, CUP_HALF = 25;

const BRAKE = {
  head: [-6, -207], sh: [-8, -173], hip: [4, -100],
  eF: [18, -156], hF: [30, -196], eB: [-24, -154], hB: [-38, -188],
  kF: [16, -50], fF: [34, 0], kB: [-10, -50], fB: [-30, 0],
};
const STARE = { ...BRAKE, head: [2, -204], sh: [-2, -172], eF: [14, -148], hF: [24, -174], eB: [-18, -148], hB: [-30, -172] };

function cupState(t) {
  const y0 = windowSillY() - CUP_HALF, rest = streetGround() - CUP_HALF;
  if (t < FALL) return { x: cupX(), y: y0, rot: 0.08, falling: false };
  const ft = clamp(t - FALL, 0, LAND - FALL);
  let y = Math.min(y0 + 0.5 * G * ft * ft, rest);
  let rot = 0.08 + 9.4 * ft;
  if (t >= LAND) {
    const settle = ease.out(prog(t, LAND, LAND + 0.32));
    const bounce = Math.sin(Math.PI * prog(t, LAND, LAND + 0.32)) * 15 * (1 - settle);
    y = rest - bounce;
    rot = lerp(rot % (Math.PI * 2), 1.55, settle);
  }
  return { x: cupX(), y, rot, falling: t < LAND };
}

function drawCup(g, x, y, rot, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(CUP_S, CUP_S);
  poly(g, [[-13, -18], [13, -18], [9, 18], [-9, 18]], '#efe4d2');
  g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(9, 18); g.lineTo(13, -18); g.lineTo(6, -18); g.lineTo(2, 18); g.closePath(); g.fill();
  g.fillStyle = '#b5683f'; g.fillRect(-12, -6, 24, 12);
  g.fillStyle = 'rgba(255,225,180,.3)'; g.fillRect(-12, -6, 24, 2);
  rr(g, -15, -25, 30, 8, 2.5); g.fillStyle = '#2a1d1f'; g.fill();
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-13, -24, 26, 2);
  seg(g, [[-13, -16], [-9, 16]], 2.2, 'rgba(255,240,205,.85)');
  seg(g, [[-5, -12], [-3, 8]], 1.6, 'rgba(255,255,255,.25)');
  g.restore();
}

registerShot('s001', {
  draw(g, t, info) {
    const GY = streetGround(), M = mood('dusk');
    const walkK = clamp(t / STOP, 0, 1);
    const camBase = lerp(WALK_FROM - E.W * 0.42, WALK_TO - E.W * 0.42, walkK);
    const imp = Math.max(0, t - LAND);
    const sh = imp > 0 && imp < 0.32 ? shake(imp, 6 * (1 - imp / 0.32), 26, 7) : [0, 0];
    const cam = { z: 1 + 0.03 * ease.inOut(walkK) + 0.055 * ease.inOut(prog(t, STOP, DUR)), x: camBase + sh[0], y: sh[1] * 0.6 };

    eveningStreet(g, t, cam);

    const x = WALK_FROM + (WALK_TO - WALK_FROM) * walkK;
    const phase = (x - WALK_FROM) / STEP * Math.PI * 2;
    const stopPhase = (WALK_TO - WALK_FROM) / STEP * Math.PI * 2;

    let pose;
    if (t <= STOP) pose = walkPose(phase, WALK);
    else {
      const k = ease.out(prog(t, STOP, STOP + 0.18));
      const settle = ease.inOut(prog(t, STOP + 0.75, STOP + 1.55));
      pose = breathe(blendPose(blendPose(walkPose(stopPhase, WALK), BRAKE, k), STARE, settle), t, 0.55, 2);
    }

    const lookUp = ease.inOut(prog(t, 2.45, 2.7));
    const lookDown = ease.inOut(prog(t, LAND, LAND + 0.22));
    const look = [lerp(0.9, 0.68, lookUp), lerp(lerp(-0.05, -0.6, lookUp), 0.55, lookDown)];
    const expr = t < 2.45 ? 'smile' : t < 2.7 ? 'neutral' : t < LAND ? 'surprised' : t < 5.1 ? 'shocked' : 'surprised';
    const blink = (t > 1.05 && t < 1.14) || (t > 5.45 && t < 5.54) || (t > 6.35 && t < 6.44);

    const cs = cupState(t);

    layer(g, cam, 1, (g) => {
      if (t < FALL) {
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cs.x, windowSillY() + 2, 24, 4, 0, 0, 7); g.fill();
      } else {
        const drop = prog(cs.y, windowSillY() - CUP_HALF, GY - CUP_HALF);
        g.fillStyle = alpha('#000000', 0.06 + 0.22 * drop);
        g.beginPath(); g.ellipse(cs.x - 16 * drop, GY + 2, 14 + 20 * drop, 3.5 + 4 * drop, 0, 0, 7); g.fill();
      }

      if (t > FALL + 0.1 && t < LAND) {
        for (const [dt, a] of [[0.08, 0.06], [0.04, 0.13]]) {
          const gh = cupState(t - dt);
          drawCup(g, gh.x, gh.y, gh.rot, a);
        }
      }
      drawCup(g, cs.x, cs.y, cs.rot, 1);

      g.fillStyle = 'rgba(0,0,0,.24)'; g.beginPath(); g.ellipse(x - 52, GY + 3, 128, 12, -0.02, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x - 8, GY + 2, 42, 7, 0, 0, 7); g.fill();

      if (t >= STOP) {
        const p = prog(t, STOP, STOP + 0.55);
        for (const [dx, dir] of [[-22, -1], [26, 1]]) {
          for (let i = 0; i < 3; i++) {
            const q = clamp(p - i * 0.12);
            circle(g, x + dx + dir * (12 + 30 * q), GY - 4 - 8 * q, 3 + 5 * q, alpha('#d9c6ad', 0.16 * (1 - q)));
          }
        }
      }

      drawFigure(g, {
        x, y: GY, s: S, facing: 1, outfit: MIRA, pose, expr, look, blink,
        rim: { color: M.rim, dir: [0.58, -0.6], w: 4.5 }, shadow: false,
      });

      if (t > STOP && t < STOP + 0.5) {
        const [hx, hy, hr] = headPos({ x, y: GY, s: S, facing: 1, pose, outfit: MIRA });
        const p = prog(t, STOP, STOP + 0.5);
        for (let i = -1; i <= 1; i++) {
          const a = -Math.PI / 2 + i * 0.55;
          const r0 = hr + 24 + 8 * p, r1 = r0 + 20 * (1 - p) + 8;
          seg(g, [[hx + Math.cos(a) * r0, hy + Math.sin(a) * r0], [hx + Math.cos(a) * r1, hy + Math.sin(a) * r1]], 3.5, alpha('#ffe7c8', 0.75 * (1 - p)));
        }
      }

      if (t >= LAND) {
        const p = prog(t, LAND, LAND + 0.75);
        glow(g, cs.x, GY - 12, 70 * (1 - p), '#ffe9c8', 0.3 * (1 - p));
        FX.rings(g, cs.x, GY - 5, t - LAND, { count: 2, r0: 22, r1: 130, speed: 1.3, color: '#f0dcc0', a: 0.42 * (1 - p) });
        for (let i = 0; i < 6; i++) {
          const a = Math.PI + (i / 5) * Math.PI, d = 16 + 54 * p;
          circle(g, cs.x + Math.cos(a) * d, GY - 8 - Math.sin(a) * d * 0.35 - 10 * p, 3 + 4 * (1 - p), alpha('#d9c6ad', 0.22 * (1 - p)));
        }
      }
    });

    FX.dust(g, t, { seed: 9, count: 45, color: '#ffd9b0', a: 0.2 });
    FX.fog(g, GY + V(60, 70), V(180, 240), M.fog, 0.12);
  },
});
