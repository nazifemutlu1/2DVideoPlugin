// render.mjs — deterministic frame renderer (headless Chromium -> ffmpeg), parallel workers.
//   node render.mjs --project projects/my-video                      full video  -> build/video_silent.mp4
//   node render.mjs --project P --from 30 --to 45 --scale 0.5         preview a range
//   node render.mjs --project P --sheet                               one still per shot -> build/sheets/*.png
//   node render.mjs --project P --stills 3.5,12,40                    stills at times -> build/stills
//   node render.mjs --project P --styles dusk,midnight,golden,neon --at 3.5,12,40   style comparison grid
//   node render.mjs --project P --self-check                                      server/security self-test
// Options: --workers N  --scale K  --style ID  --debug  --format png|jpeg  --crf 18  --gl auto|gpu|swiftshader  --out FILE
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; args[k] = v; } } }
if (!args.project) { console.error('usage: node render.mjs --project projects/<name> [options]'); process.exit(1); }
const PROJECT = path.resolve(args.project);
const BUILD = path.join(PROJECT, 'build'); fs.mkdirSync(BUILD, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function listScenes(dir, base) { let out = []; if (!fs.existsSync(dir)) return out; for (const f of fs.readdirSync(dir).sort()) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) out = out.concat(listScenes(p, `${base}/${f}`)); else if (f.endsWith('.js') && !f.startsWith('_')) out.push(`${base}/${f}`); } return out; }
// T1.2C: expose only the renderer page and its declared resources, on loopback only.
const ALLOWED_PATHS = ['/player.html', '/__manifest', '/project/', '/engine/', '/node_modules/@fontsource/', '/node_modules/three/'];
const isAllowedPath = (url) => url === '/player.html' || url === '/__manifest' || ALLOWED_PATHS.some((prefix) => prefix.endsWith('/') && url.startsWith(prefix));
const within = (base, candidate) => candidate === base || candidate.startsWith(base + path.sep);
function resolveStaticPath(url) {
  let base, relative;
  if (url === '/player.html') { base = ROOT; relative = 'player.html'; }
  else if (url.startsWith('/project/')) { base = PROJECT; relative = url.slice('/project/'.length); }
  else if (url.startsWith('/engine/')) { base = path.join(ROOT, 'engine'); relative = url.slice('/engine/'.length); }
  else if (url.startsWith('/node_modules/@fontsource/')) { base = path.join(ROOT, 'node_modules', '@fontsource'); relative = url.slice('/node_modules/@fontsource/'.length); }
  else if (url.startsWith('/node_modules/three/')) { base = path.join(ROOT, 'node_modules', 'three'); relative = url.slice('/node_modules/three/'.length); }
  else return null;
  try {
    const candidate = path.join(base, relative);
    if (!fs.existsSync(candidate)) return null;
    const real = fs.realpathSync(candidate);
    if (!within(fs.realpathSync(base), real) || !fs.statSync(real).isFile()) return null;
    return real;
  } catch {
    return null;
  }
}
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let url;
  try { url = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (!isAllowedPath(url)) { res.writeHead(404); return res.end(); }
  if (url === '/__manifest') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(listScenes(path.join(PROJECT, 'scenes'), '/project/scenes'))); }
  const file = resolveStaticPath(url);
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;
const ORIGIN = `http://127.0.0.1:${PORT}`;

function httpCheck(method, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${ORIGIN}${pathname}`, { method }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function selfCheck() {
  const results = [];
  const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`  [${ok ? 'ok' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`); };
  const get = (p) => httpCheck('GET', p);

  let r = await get('/player.html');
  check('GET /player.html', r.status === 200 && /text\/html/i.test(r.headers['content-type'] || ''), `${r.status}`);
  r = await httpCheck('HEAD', '/player.html');
  check('HEAD /player.html', r.status === 200 && r.body.length === 0, `${r.status}, body=${r.body.length}`);
  r = await get('/__manifest');
  let manifest = null;
  try { manifest = JSON.parse(r.body.toString('utf8')); } catch {}
  check('GET /__manifest', r.status === 200 && Array.isArray(manifest), `${r.status}, items=${Array.isArray(manifest) ? manifest.length : 'n/a'}`);
  r = await get('/project/config.json');
  check('GET /project/config.json', r.status === 200 && /json/i.test(r.headers['content-type'] || ''), `${r.status}`);
  r = await get('/etc/passwd');
  check('GET /etc/passwd blocked', r.status === 404, `${r.status}`);
  r = await get('/project/../package.json');
  check('traversal .. blocked', r.status === 404, `${r.status}`);
  r = await get('/project/%2e%2e/package.json');
  check('encoded traversal blocked', r.status === 404, `${r.status}`);
  r = await get('/engine/../package.json');
  check('engine traversal blocked', r.status === 404, `${r.status}`);
  r = await httpCheck('POST', '/player.html');
  check('POST /player.html blocked', r.status === 405, `${r.status}`);

  // CSP import-map hash must match the actual inline import map.
  try {
    const html = fs.readFileSync(path.join(ROOT, 'player.html'), 'utf8');
    const map = (html.match(/<script type="importmap">([\s\S]*?)<\/script>/) || [])[1] || '';
    const declared = (html.match(/sha256-([^']+)/) || [])[1] || '';
    const actual = crypto.createHash('sha256').update(map).digest('base64');
    check('CSP import-map hash', Boolean(map) && declared === actual, declared ? 'matches' : 'missing');
  } catch (e) {
    check('CSP import-map hash', false, e.message);
  }

  // Optional symlink escape check: skip when the host cannot create symlinks.
  const link = path.join(BUILD, '.selfcheck-link');
  try {
    fs.rmSync(link, { force: true, recursive: true });
    fs.symlinkSync(os.tmpdir(), link, 'dir');
    r = await get('/project/build/.selfcheck-link/');
    check('symlink escape blocked', r.status === 404, `${r.status}`);
  } catch (e) {
    check('symlink escape blocked', true, `skipped: ${e.code || e.message}`);
  } finally {
    try { fs.rmSync(link, { force: true, recursive: true }); } catch {}
  }

  const failed = results.filter((x) => !x.ok);
  console.log(`SELF-CHECK ${failed.length ? 'FAIL' : 'PASS'} (${results.length - failed.length}/${results.length})`);
  if (failed.length) process.exitCode = 1;
}

async function guardPageRequests(page) {
  await page.route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith('data:') || target.startsWith('blob:')) return route.continue();
    let allowed = false;
    try {
      const parsed = new URL(target);
      const pathname = path.posix.normalize(decodeURIComponent(parsed.pathname));
      allowed = parsed.origin === ORIGIN && isAllowedPath(pathname);
    } catch {
      allowed = false;
    }
    return allowed ? route.continue() : route.abort();
  });
}
const gl = args.gl || (process.platform === 'linux' ? 'swiftshader' : 'auto');
const LAUNCH = { chromiumSandbox: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', ...(gl === 'swiftshader' ? ['--use-angle=swiftshader'] : []), ...(gl === 'gpu' ? ['--enable-gpu', '--use-angle=default'] : [])] };
const FORMAT = args.format === 'jpeg' ? 'jpeg' : 'png';
const CFG = JSON.parse(fs.readFileSync(path.join(PROJECT, 'config.json'), 'utf8'));
const FPS = CFG.fps || 24;

async function openPlayer(browser, style) {
  const qs = new URLSearchParams(); if (args.scale) qs.set('scale', args.scale); if (style || args.style) qs.set('style', style || args.style); if (args.debug) qs.set('debug', '1');
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await guardPageRequests(page);
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  page.on('console', m => { const t = m.text(); if (/ERROR|missing/i.test(t)) console.log('[page]', t); });
  await page.goto(`${ORIGIN}/player.html?${qs}`);
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (await page.evaluate(() => window.READY === true || !!window.BOOT_ERROR)) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!(await page.evaluate(() => window.READY === true || !!window.BOOT_ERROR))) throw new Error('Player boot timed out');
  const boot = await page.evaluate(() => window.BOOT_ERROR); if (boot) throw new Error('Player failed to boot: ' + boot);
  const [w, h] = await page.evaluate(() => window.OUT); await page.setViewportSize({ width: w, height: h });
  return page;
}
const shot = (page, f) => page.evaluate(i => window.renderFrame(i), f).then(() => page.screenshot({ type: FORMAT, ...(FORMAT === 'jpeg' ? { quality: 94 } : {}) }));
const fmtT = s => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;

async function renderVideo() {
  const ffmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (ffmpeg.error || ffmpeg.status !== 0) {
    console.error('RENDER FAILED: ffmpeg not found on PATH');
    process.exitCode = 2;
    return;
  }
  const b0 = await chromium.launch(LAUNCH); const p0 = await openPlayer(b0);
  const total = await p0.evaluate('window.TOTAL_FRAMES'), fps = FPS;
  const missing = (await p0.evaluate('window.SHOT_LIST')).filter(s => !s.ok); if (missing.length) console.log(`WARNING: ${missing.length} shots have no scene file yet: ${missing.slice(0, 12).map(s => s.id).join(', ')}${missing.length > 12 ? ' …' : ''}`);
  await b0.close();
  const f0 = Math.max(0, Math.round((+args.from || 0) * fps)), f1 = Math.min(total, args.to ? Math.round(+args.to * fps) : total);
  const W = Math.max(1, Math.min(+(args.workers || Math.max(1, Math.min(8, Math.floor(os.cpus().length / 2)))), Math.ceil((f1 - f0) / 24)));
  const partsDir = path.join(BUILD, 'parts'); fs.rmSync(partsDir, { recursive: true, force: true }); fs.mkdirSync(partsDir, { recursive: true });
  const chunk = Math.ceil((f1 - f0) / W); let done = 0; const t0 = Date.now(); const errs = new Set();
  console.log(`Rendering frames ${f0}-${f1} (${((f1 - f0) / fps).toFixed(1)} s) with ${W} worker(s)…`);
  const work = async (k) => {
    const a = f0 + k * chunk, b = Math.min(f1, a + chunk); if (a >= b) return null;
    const browser = await chromium.launch(LAUNCH); const page = await openPlayer(browser);
    const out = path.join(partsDir, `part_${String(k).padStart(3, '0')}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 18), '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const img = await shot(page, f); if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r)); done++;
      if (done % 48 === 0) { const el = (Date.now() - t0) / 1000, eta = (el / done) * (f1 - f0 - done); process.stdout.write(`  ${done}/${f1 - f0} frames  ${(done / el).toFixed(2)} fps  elapsed ${fmtT(el)}  eta ${fmtT(eta)}\n`); }
    }
    (await page.evaluate('window.ERRORS')).forEach(e => errs.add(e));
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); return out;
  };
  const parts = (await Promise.all([...Array(W)].map((_, k) => work(k)))).filter(Boolean);
  const list = path.join(partsDir, 'list.txt'); fs.writeFileSync(list, parts.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const out = path.resolve(args.out || path.join(BUILD, args.from || args.to ? 'preview.mp4' : 'video_silent.mp4'));
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', c => (c ? rej(new Error('concat failed')) : res())));
  if (errs.size) { console.log(`\n${errs.size} shot error(s):`); [...errs].slice(0, 40).forEach(e => console.log('  ' + e)); }
  console.log(`\nDone: ${out}  (${fmtT((Date.now() - t0) / 1000)})`);
}
// grid of labelled images, laid out by the browser (works on every OS)
async function contactSheet(browser, items, outFile, cols = 4, cellW = 480) {
  const page = await browser.newPage({ viewport: { width: cols * (cellW + 12) + 12, height: 400 } });
  const html = `<html><body style="margin:0;background:#111;font:600 15px sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:12px;padding:12px">${items.map(it => `<div><img src="data:image/${FORMAT};base64,${it.img.toString('base64')}" style="width:${cellW}px;display:block;border-radius:4px"><div style="padding:5px 2px">${it.label.replace(/</g, '&lt;')}</div></div>`).join('')}</div></body></html>`;
  await page.setContent(html); await page.screenshot({ path: outFile, fullPage: true }); await page.close();
}
async function renderStills() {
  const browser = await chromium.launch(LAUNCH); const styles = args.styles ? String(args.styles).split(',') : [args.style || null];
  const dir = path.join(BUILD, args.styles ? 'styles' : args.sheet ? 'sheets' : 'stills'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const all = [];
  for (const st of styles) {
    const page = await openPlayer(browser, st); const fps = FPS;
    let targets;
    if (args.sheet) targets = (await page.evaluate('window.SHOT_LIST')).map(s => ({ t: s.start + (s.end - s.start) * 0.45, label: `${s.id}  ${s.start.toFixed(1)}s${s.ok ? '' : '  (MISSING)'}` }));
    else targets = String(args.stills || args.at || '1').split(',').map(Number).map(t => ({ t, label: `${t}s` }));
    for (const tg of targets) { const img = await shot(page, Math.round(tg.t * fps)); const name = `${st ? st + '_' : ''}${tg.label.split(' ')[0].replace(/[^\w.]/g, '')}_${tg.t.toFixed(2)}.${FORMAT}`; fs.writeFileSync(path.join(dir, name), img); all.push({ img, label: `${st ? `[${st}] ` : ''}${tg.label}`, st }); }
    (await page.evaluate('window.ERRORS')).forEach(e => console.log('  shot error:', e)); await page.close();
  }
  if (args.styles) { const n = all.length / styles.length; await contactSheet(browser, all, path.join(dir, 'style_grid.png'), n, 420); }
  else { const per = 24; for (let i = 0; i < all.length; i += per) await contactSheet(browser, all.slice(i, i + per), path.join(dir, `sheet_${String(i / per + 1).padStart(2, '0')}.png`), 4, 440); }
  await browser.close(); console.log(`Wrote ${all.length} stills + contact sheet(s) to ${dir}`);
}
try { if (args['self-check']) await selfCheck(); else if (args.sheet || args.stills || args.styles) await renderStills(); else await renderVideo(); }
catch (e) { console.error('RENDER FAILED:', e.message); process.exitCode = 1; }
finally { server.close(); if (process.exitCode) { try { fs.rmSync(path.join(BUILD, 'parts'), { recursive: true, force: true }); } catch {} } }
