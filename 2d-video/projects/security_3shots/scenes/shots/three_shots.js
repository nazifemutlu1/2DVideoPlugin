// security_3shots — all imagery is code-generated: 2D canvas, 2.5D layers, real 3D.
import { E, V, registerShot, mood, layer, blurLayer, backdrop, glow, circle, ring, rr, seg, poly, linGrad, text, alpha, clamp, lerp, ease, prog } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

const LABEL = (g, s, color = '#8fffe0') => {
  rr(g, V(70, 50), V(56, 70), V(210, 190), V(56, 70), 12); g.fillStyle = 'rgba(5,12,18,.55)'; g.fill();
  text(g, s, V(175, 145), V(84, 106), { size: V(28, 34), font: 'Nunito', weight: 800, color, align: 'center' });
};

function sky(g, t, dawn = false) {
  backdrop(g, dawn ? ['#172039', '#513d55', '#d08c6c'] : ['#050a14', '#0c1930', '#242b46']);
  FX.stars(g, t, { count: 140, area: [0, 0, E.W, E.H * 0.7], color: '#dfeaff' });
  FX.moon(g, V(1500, 760), V(200, 260), V(60, 52), '#e8ecff');
}

// ---------- 2D: flat graphic city with a moving neon sun ----------
function shot2d(g, t, info) {
  const k = t / info.dur, cam = { z: 1 + 0.08 * ease.inOut(k), x: -80 * ease.inOut(k), y: 18 * Math.sin(t * 0.25) };
  sky(g, t);
  layer(g, cam, 0.2, (g) => {
    FX.sun(g, E.W * 0.72, E.H * 0.43, V(95, 80), '#ffca7a', '#ff8a5a', 5);
    FX.godRays(g, E.W * 0.72, E.H * 0.43, { count: 9, angle: -Math.PI / 2, spread: 2.2, len: 1200, a: 0.05, t });
  });
  layer(g, cam, 0.45, (g) => FX.skyline(g, { x: -240, y: E.H * 0.7, w: E.W + 480, minH: 110, maxH: 330, color: '#1b2338', windowColor: '#ffb96a', lit: 0.45, seed: 11 }));
  layer(g, cam, 0.7, (g) => FX.skyline(g, { x: -300, y: E.H * 0.82, w: E.W + 600, minH: 80, maxH: 240, color: '#0b101d', windowColor: '#ffd59a', lit: 0.3, seed: 7 }));
  layer(g, cam, 1.0, (g) => {
    g.fillStyle = '#05070c'; g.fillRect(-E.W, E.H * 0.84, E.W * 3, E.H);
    for (let i = 0; i < 18; i++) {
      const x = ((i * 137 + t * 32) % (E.W + 200)) - 100;
      seg(g, [[x, E.H * 0.86], [x + 80, E.H * 0.86]], 2, alpha('#73d8ff', 0.18));
    }
    circle(g, E.W * 0.18, E.H * 0.72, 5, '#ffcf7a'); glow(g, E.W * 0.18, E.H * 0.72, 70, '#ffcf7a', 0.2);
  });
  FX.dust(g, t, { count: 35, color: '#ffd7a0', a: 0.3 });
  FX.rain(g, t, { count: 70, a: 0.1, angle: 0.15 });
  LABEL(g, '2D / CANVAS');
}

// ---------- 2.5D: the same city split into real depth planes ----------
function panel(g, x, y, w, h, title, value, color, a = 1) {
  g.save(); g.globalAlpha = a;
  rr(g, x, y, w, h, 18); g.fillStyle = 'rgba(7,15,24,.72)'; g.fill(); g.strokeStyle = alpha(color, 0.45); g.lineWidth = 2; g.stroke();
  text(g, title, x + 24, y + 34, { size: V(18, 20), font: 'Nunito', weight: 800, color: alpha('#d9f4ff', 0.7), align: 'left' });
  text(g, value, x + 24, y + h * 0.62, { size: V(46, 58), font: 'Nunito', weight: 900, color, align: 'left' });
  g.restore();
}

function shot25d(g, t, info) {
  const k = t / info.dur, cam = { z: 1.02 + 0.12 * ease.inOut(k), x: lerp(80, -80, ease.inOut(k)), y: 0 };
  sky(g, t, true);
  layer(g, cam, 0.18, (g) => { FX.sun(g, E.W * 0.65, E.H * 0.38, V(120, 100), '#ffe2b0', '#ffab6a', 4); FX.hills(g, { y: E.H * 0.7, amp: 90, color: '#3a3550', seed: 3 }); });
  layer(g, cam, 0.42, (g) => FX.skyline(g, { x: -200, y: E.H * 0.74, w: E.W + 400, minH: 120, maxH: 300, color: '#242a45', windowColor: '#ffc078', lit: 0.55, seed: 13 }));
  layer(g, cam, 0.68, (g) => {
    g.fillStyle = 'rgba(10,16,28,.88)'; g.fillRect(-E.W, E.H * 0.84, E.W * 3, E.H);
    FX.floorLines(g, E.H * 0.85, E.H, 'rgba(120,200,255,.18)', 0.09);
    for (let i = 0; i < 5; i++) { const x = E.W * (0.1 + i * 0.2), y = E.H * (0.56 + Math.sin(t * 0.4 + i) * 0.02); panel(g, x, y, V(190, 170), V(105, 100), `LAYER ${i + 1}`, `${(i + 1) * 0.2}`, ['#8fffe0', '#ffbf7a', '#b8a5ff', '#7bdcff', '#ff8c9a'][i], 0.8); }
  });
  layer(g, cam, 0.92, (g) => {
    for (let i = 0; i < 3; i++) { const x = E.W * (0.16 + i * 0.34) + Math.sin(t * 0.7 + i) * 18; const y = E.H * (0.25 + i * 0.08); glow(g, x, y, 120, ['#8fffe0', '#ffbf7a', '#b8a5ff'][i], 0.3); ring(g, x, y, 14, 3, alpha('#fff', 0.8)); }
  });
  blurLayer(g, 7, (g) => { g.fillStyle = 'rgba(120,220,255,.55)'; rr(g, E.W * 0.86, E.H * 0.36, 120, 220, 22); g.fill(); }, cam, 1.55);
  FX.dust(g, t, { count: 28, color: '#ffe1b0', a: 0.3 });
  LABEL(g, '2.5D / LAYERS', '#ffbf7a');
}

// ---------- 3D: procedural Three.js city, orbit + fog + lights ----------
registerShot('s003', {
  kind: '3d',
  init(T) {
    const M = mood('midnight');
    const st = T.stage({ mood: 'midnight', fov: V(38, 54), fog: [16, 55], keyPos: [-12, 16, 10], keyIntensity: 2.8, ambient: 1.0 });
    st.add(T.ground(90, 90, '#111827', T.tiles('#111827', 18, [18, 18])));
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, r = 16 + (i % 5) * 3.2, w = 2.2 + (i % 4) * 0.7, h = 4 + (i % 7) * 2.4;
      const b = T.building(w, h, w, { color: ['#20293c', '#2b263d', '#172536'][i % 3], win: i % 2 ? '#ffc17a' : '#8fffe0', lit: 0.5, seed: 30 + i });
      b.position.x = Math.cos(a) * r; b.position.z = Math.sin(a) * r; st.add(b);
    }
    const tower = T.cyl(0.45, 0.6, 8, '#d4c9b8', 0, 4, 0, 16); st.add(tower);
    st.add(T.sphere(0.9, T.basic ? T.basic('#ffcf7a') : '#ffcf7a', 0, 8.4, 0));
    const beam = T.shaft(1.8, 16, '#ffd9a0', 0.08); beam.position.set(0, 6, 0); beam.rotation.z = 0.2; st.add(beam);
    for (let i = 0; i < 8; i++) { const t = T.tree3D(Math.cos(i * 0.9) * 12, Math.sin(i * 0.9) * 12, 0.8 + (i % 3) * 0.2, '#172018'); st.add(t); }
    for (let i = 0; i < 18; i++) { const p = T.sphere(0.06, '#b9f6ff', (i % 2 ? 1 : -1) * (4 + (i % 5)), 2 + (i % 7), -3 + (i % 4) * 3); st.add(p); }
    return { stage: st };
  },
  draw(s, t, info, T) {
    const k = t / info.dur;
    T.orbit(s.stage.camera, t, { target: [0, 3.5, 0], radius: [13, 10], height: [6.5, 3.8], from: -1.15, to: 0.95, dur: info.dur });
    s.stage.camera.fov = V(38, 54) - 4 * k; s.stage.camera.updateProjectionMatrix();
  },
  overlay(g, t) {
    LABEL(g, '3D / THREE.JS', '#b8a5ff');
    text(g, 'PROCEDURAL CITY / REAL PERSPECTIVE', E.W / 2, E.H - V(58, 70), { size: V(18, 22), font: 'Nunito', weight: 800, color: alpha('#dceaff', 0.7), spacing: 2 });
  },
});

registerShot('s001', { draw: shot2d });
registerShot('s002', { draw: shot25d });
