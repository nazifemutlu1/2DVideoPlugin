// .sharrowkin/scripts/check_syntax.mjs — syntax check for every ESM file of the studio.
// Compiles each .js/.mjs with vm.SourceTextModule (no execution, no browser needed).
//   node --experimental-vm-modules .sharrowkin/scripts/check_syntax.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TARGETS = ['2d-video', 'tools', '.sharrowkin/scripts'];
const SKIP = new Set(['node_modules', '.git', 'build', 'out', 'projects']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(mjs|js)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = TARGETS.flatMap(t => walk(path.join(ROOT, t)));
let ok = 0;
const failures = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  try {
    new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { identifier: rel });
    ok++;
  } catch (e) {
    failures.push(`${rel}: ${e.message}`);
  }
}
for (const f of failures) console.log(`FAIL ${f}`);
console.log(`ESM syntax: ${ok}/${files.length} OK, ${failures.length} FAIL`);
process.exit(failures.length ? 1 : 0);
