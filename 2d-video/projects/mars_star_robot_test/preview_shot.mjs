// Local-only visual QA helper: serves the studio root and screenshots preview.html.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('F:/AI/2DVideoPlugin/2d-video');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => console.log('[page]', m.text()));
await page.goto(`http://127.0.0.1:${port}/projects/mars_star_robot_test/preview.html`);
for (let i = 0; i < 120; i++) { if (await page.evaluate(() => window.DONE)) break; await new Promise(r => setTimeout(r, 100)); }
await page.screenshot({ path: 'F:/AI/2DVideoPlugin/2d-video/projects/mars_star_robot_test/build/robot_preview.png' });
await browser.close(); server.close();
console.log('wrote robot_preview.png');
