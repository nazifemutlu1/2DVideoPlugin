// sets/evening_street.js — dusk street: distant block, near facade with a lit window, sidewalk and road.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, glow, alpha, shade, mix, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const streetGround = () => E.H * V(0.8, 0.68);
export const windowSillY = () => streetGround() - V(560, 540);
export const cupX = () => E.W / 2 + V(220, 120);

const plant = (g, x, y) => {
  rr(g, x - 14, y - 24, 28, 24, 4); g.fillStyle = '#5a3227'; g.fill();
  g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(x - 11, y - 22, 22, 4);
  for (let i = 0; i < 5; i++) {
    const a = -2.45 + i * 0.3;
    const lx = x + Math.cos(a) * 26, ly = y - 52 + Math.sin(a) * 10;
    seg(g, [[x, y - 22], [lx, ly]], 3.2, '#2e4a3a');
    circle(g, lx, ly, 5.5, '#3d6048');
  }
};

export function eveningStreet(g, t, cam) {
  const M = mood('dusk'), GY = streetGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.22), deep = shade(M.wall, -0.62);
  const sill = windowSillY(), wx = cupX(), ww = V(250, 210), wh = V(160, 150);
  const wallTop = sill - wh - V(24, 22), nearLeft = wx - V(280, 150);
  const lampX = CX + V(600, 200);

  layer(g, cam, 0.06, (g) => {
    backdrop(g, M.sky);
    FX.stars(g, t, { seed: 21, count: 80, area: [-200, 0, E.W + 400, GY - V(420, 500)], color: '#ffe6cc' });
    FX.moon(g, E.W * 0.17, GY - V(700, 900), V(32, 24), '#ffe6c8');
    FX.clouds(g, { seed: 12, count: 5, y: GY - V(620, 720), h: 120, color: '#f2b48e', a: 0.13 });
    FX.skyline(g, { x: -E.W, y: GY - V(430, 560), w: E.W * 3, minH: 60, maxH: V(250, 360), color: mix(M.sky[1], deep, 0.66), windowColor: alpha(M.practical, 0.5), lit: 0.13, seed: 33 });
    FX.fog(g, GY - V(330, 470), V(260, 420), M.fog, 0.18);
  });

  layer(g, cam, 0.38, (g) => {
    const x = -V(820, 700), w = V(1200, 1000), base = GY - V(30, 50), h = V(620, 560);
    FX.facade(g, { x, y: base, w, h, color: shade(M.wall, -0.42), win: M.practical, dark: shade(deep, -0.02), cols: 5, rows: 3, lit: 0.35, seed: 19 });
    g.fillStyle = shade(deep, -0.2); g.fillRect(x - 12, base - h - 16, w + 24, 18);
    const tx = x + V(210, 170), ty = base - h - 16;
    seg(g, [[tx, ty], [tx, ty - 54]], 4, deep); seg(g, [[tx + 76, ty], [tx + 76, ty - 54]], 4, deep);
    rr(g, tx - 14, ty - 112, 104, 60, 8); g.fillStyle = shade(deep, -0.12); g.fill();
    poly(g, [[tx - 18, ty - 112], [tx + 38, ty - 146], [tx + 94, ty - 112]], shade(deep, -0.28));
    seg(g, [[tx + 24, ty - 146], [tx + 24, ty - 166]], 3, deep);
  });

  layer(g, cam, 0.58, (g) => {
    const left = -V(900, 800), w = V(1750, 1600), base = GY - V(14, 24), top = GY - V(560, 620);
    g.fillStyle = linGrad(g, 0, top, 0, base, [shade(wall, 0.04), wall, shade(wall, -0.2)]);
    g.fillRect(left, top, w, base - top + 4);
    g.fillStyle = deep; g.fillRect(left, top - 14, w, 18);
    g.fillStyle = alpha('#ffffff', 0.05); g.fillRect(left, top - 14, w, 3);
    const r = rng(41);
    for (let x = left + V(140, 110), col = 0; x < left + w - V(160, 130); x += V(300, 260), col++) {
      for (let j = 0; j < 2; j++) {
        const ww2 = V(126, 104), hh = V(142, 150), y = top + V(92, 84) + j * V(230, 240);
        const lit = r() < 0.55;
        g.fillStyle = lit ? M.practical : shade(deep, 0.06);
        g.fillRect(x, y, ww2, hh);
        g.strokeStyle = shade(deep, -0.2); g.lineWidth = 6; g.strokeRect(x, y, ww2, hh);
        g.fillStyle = shade(deep, -0.2); g.fillRect(x + ww2 / 2 - 3, y, 6, hh); g.fillRect(x, y + hh * 0.5 - 3, ww2, 6);
        if (lit) glow(g, x + ww2 / 2, y + hh / 2, ww2 * 0.8, M.practical, 0.12);
      }
    }
    const fx0 = V(250, 170), fx1 = V(600, 460);
    for (let k = 0; k < 2; k++) {
      const y = top + V(330, 320) + k * V(220, 220);
      seg(g, [[fx0, y], [fx1, y]], 6, alpha(deep, 0.85));
      seg(g, [[fx0, y], [fx0, y + V(110, 100)], [fx0 + 60, y + V(110, 100)]], 4, alpha(deep, 0.8));
      seg(g, [[fx0 + V(50, 40), y], [fx0 + V(100, 80), y - V(46, 40)]], 3, alpha(deep, 0.7));
    }
  });

  layer(g, cam, 0.86, (g) => {
    const curb = GY + V(126, 150), roadTop = curb + 12;
    g.fillStyle = linGrad(g, 0, GY, 0, curb, [shade(M.floor, -0.02), shade(M.floor, -0.32)]);
    g.fillRect(-E.W, GY, E.W * 3, curb - GY + 2);
    FX.floorLines(g, GY + 8, curb - 8, alpha('#000000', 0.16), 0.1);
    for (let x = -E.W; x < E.W * 2; x += V(190, 160)) seg(g, [[x, GY + 4], [x - 26, curb - 2]], 1.4, alpha('#000000', 0.14));
    FX.pool(g, wx, GY + 34, V(150, 120), 22, M.practical, 0.17);
    FX.pool(g, lampX, GY + 46, V(190, 140), 26, M.practical, 0.2);
    FX.pool(g, E.W * 0.12, GY + 88, V(130, 100), 18, '#c08a8a', 0.1);
    g.fillStyle = shade(deep, 0.1); g.fillRect(-E.W, curb, E.W * 3, 13);
    g.fillStyle = alpha('#ffffff', 0.08); g.fillRect(-E.W, curb, E.W * 3, 2);
    g.fillStyle = linGrad(g, 0, roadTop, 0, E.H + 40, [shade(M.road, -0.18), shade(M.dark, -0.25)]);
    g.fillRect(-E.W, roadTop, E.W * 3, E.H);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x, w, a] of [[wx, 90, 0.06], [lampX, 54, 0.09]]) {
      g.fillStyle = linGrad(g, 0, roadTop, 0, E.H, [alpha(M.practical, a), alpha(M.practical, 0)]);
      g.fillRect(x - w / 2, roadTop, w, E.H - roadTop);
    }
    g.restore();
    g.strokeStyle = alpha('#d8c4a8', 0.18); g.lineWidth = 3; g.setLineDash([42, 46]);
    g.beginPath(); g.moveTo(-E.W, E.H - 26); g.lineTo(E.W * 2, E.H - 26); g.stroke(); g.setLineDash([]);
  });

  layer(g, cam, 1, (g) => {
    const wallH = GY - 6 - wallTop;
    g.fillStyle = linGrad(g, nearLeft, 0, nearLeft + V(900, 700), 0, [shade(wall, 0.04), shade(wall, -0.24)]);
    g.fillRect(nearLeft, wallTop, E.W * 2, wallH);
    g.fillStyle = deep; g.fillRect(nearLeft - 10, wallTop - 16, E.W * 2, 22);
    g.fillStyle = alpha('#ffffff', 0.06); g.fillRect(nearLeft - 10, wallTop - 16, E.W * 2, 3);
    g.strokeStyle = alpha('#000000', 0.1); g.lineWidth = 1;
    for (let y = wallTop + 28; y < GY - 10; y += 44) { g.beginPath(); g.moveTo(nearLeft, y); g.lineTo(E.W * 2, y); g.stroke(); }
    for (let x = nearLeft + V(180, 160); x < E.W * 2; x += V(280, 240)) { g.beginPath(); g.moveTo(x, wallTop); g.lineTo(x, GY - 8); g.stroke(); }

    const wx0 = wx - ww * 0.28, wx1 = wx0 + ww, wy1 = sill, wy0 = sill - wh;
    rr(g, wx0 - 20, wy0 - 20, ww + 40, wh + 46, 5); g.fillStyle = shade(wall, -0.42); g.fill();
    g.fillStyle = linGrad(g, 0, wy0, 0, wy1, ['#ffe8b8', '#e8a66a', '#7e4438']);
    g.fillRect(wx0, wy0, ww, wh);
    glow(g, wx0 + ww * 0.5, wy0 + wh * 0.55, ww * 0.95, M.practical, 0.2);
    poly(g, [[wx0, wy0], [wx0 + ww * 0.2, wy0], [wx0 + ww * 0.14, wy1], [wx0, wy1]], alpha('#5a3038', 0.85));
    poly(g, [[wx1 - ww * 0.18, wy0], [wx1, wy0], [wx1, wy1], [wx1 - ww * 0.12, wy1]], alpha('#5a3038', 0.85));
    circle(g, wx0 + ww * 0.52, wy0 + 18, 5, '#fff6d8'); glow(g, wx0 + ww * 0.52, wy0 + 18, 54, '#fff0c0', 0.5);
    g.fillStyle = alpha('#3a2018', 0.45); g.fillRect(wx0 + ww * 0.3, wy0 + wh * 0.62, ww * 0.4, 5);
    g.fillStyle = shade(wall, -0.55); g.fillRect(wx0 + ww * 0.5 - 4, wy0, 8, wh); g.fillRect(wx0, wy0 + wh * 0.45, ww, 6);
    g.strokeStyle = shade(wall, -0.62); g.lineWidth = 8; g.strokeRect(wx0, wy0, ww, wh);
    g.fillStyle = shade(wall, 0.1); g.fillRect(wx0 - 26, sill, ww + 52, 13);
    g.fillStyle = alpha('#000000', 0.28); g.fillRect(wx0 - 26, sill + 13, ww + 52, 7);
    plant(g, wx1 - V(48, 40), sill);
    seg(g, [[wx1 + 58, wallTop + 10], [wx1 + 58, GY - 4]], 7, shade(deep, 0.06));
    for (let y = wallTop + 70; y < GY; y += 150) { g.fillStyle = deep; g.fillRect(wx1 + 50, y, 22, 7); }
    FX.lampPost(g, lampX, GY, V(360, 380), { color: deep, light: M.practical, a: 0.2 });
  });

  return { GY, M, sill };
}
