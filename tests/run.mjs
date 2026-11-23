// Darts by Tom — alle tests in één keer: node tests/run.mjs  (of: npm test)
// Draait tests/core/*.mjs en tests/security/*.mjs parallel, telt de testgevallen en geeft exitcode 0 als alles groen is.
// Opties: --only=naam1,naam2   --jobs=N   REF=<map> voegt finish-gate-eq toe (vergelijking met een oudere versie).
import { spawn } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
// Playwright zoeken: PLAYWRIGHT=..., anders node_modules van de repo (npm install), anders globaal.
if (!process.env.PLAYWRIGHT) {
  try { process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(ROOT, 'package.json')).resolve('playwright')).href; }
  catch (e) { console.error('Playwright niet gevonden. Eenmalig: npm install  (en: npx playwright install chromium)\nof zet PLAYWRIGHT=<pad naar playwright/index.js>.'); process.exit(2); }
}
const SKIP = new Set(['lib.mjs', 'h.mjs', 'finish-gate-eq.mjs']);
let suites = [];
for (const dir of ['core', 'security']) for (const f of fs.readdirSync(path.join(HERE, dir)).sort()) if (f.endsWith('.mjs') && !SKIP.has(f)) suites.push(path.join(dir, f));
if (process.env.REF) suites.push('security/finish-gate-eq.mjs');
const only = arg('only'); if (only) { const w = only.split(','); suites = suites.filter(s => w.some(x => s.includes(x))); }
// Langste eerst, dan is de totale tijd het kortst.
const SLOW = ['rematch-start', 'finish-gate', 'taint-local', 'ui', 'eli-save', 'x01', 'games', 'data'];
suites.sort((a, b) => { const ia = SLOW.findIndex(s => a.includes(s)), ib = SLOW.findIndex(s => b.includes(s)); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
const jobs = Number(arg('jobs')) || Math.min(4, Math.max(2, os.cpus().length));
const t0 = Date.now(); const results = [];
function runOne(s) {
  return new Promise(res => {
    const st = Date.now(); let out = '';
    const ch = spawn(process.execPath, [path.join(HERE, s)], { cwd: ROOT, env: Object.assign({ FAST: '10' }, process.env) });
    ch.stdout.on('data', d => out += d); ch.stderr.on('data', d => out += d);
    const kill = setTimeout(() => { out += '\n(time-out na 240 s)'; ch.kill('SIGKILL'); }, 240000);
    ch.on('close', code => {
      clearTimeout(kill);
      const m = out.match(/##CASES ok=(\d+) total=(\d+)/);
      const r = { s, code, out, sec: Math.round((Date.now() - st) / 1000), ok: m ? +m[1] : (code === 0 ? 1 : 0), total: m ? +m[2] : 1 };
      results.push(r);
      console.log(`${code === 0 ? '✓' : '✗'} ${s.padEnd(32)} ${String(r.ok).padStart(3)}/${String(r.total).padEnd(3)} ${r.sec}s`);
      res();
    });
  });
}
const queue = suites.slice();
await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await runOne(queue.shift()); }));
const bad = results.filter(r => r.code !== 0);
for (const r of bad) { console.log(`\n── ${r.s} ──`); console.log(r.out.split('\n').filter(l => /✗|GEZAKT|^\s{2,}\S|Error|time-out|pageerror/.test(l)).slice(0, 25).join('\n')); }
const ok = results.reduce((a, r) => a + r.ok, 0), total = results.reduce((a, r) => a + r.total, 0);
console.log(`\n${bad.length ? 'GEZAKT' : 'GESLAAGD'}: ${ok}/${total} testgevallen in ${results.length} suites, ${Math.round((Date.now() - t0) / 1000)} s (${jobs} tegelijk)`);
process.exit(bad.length ? 1 : 0);
