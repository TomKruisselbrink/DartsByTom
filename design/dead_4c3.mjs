// Fase 4C-3, stap 0: bewijs dat de als "dood" aangemerkte selectors nergens gebruikt worden.
// 1) statisch: HTML + JS (alles buiten <style>) op klassenaam als los woord in class/className/classList/strings;
// 2) runtime: alle 55 visuele scenario's (390×844, NL, donker + licht) — aantal elementen dat matcht.
// Gebruik: node design/dead_4c3.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const { SCENARIOS } = await import('../tests/visual/scenarios.mjs');
const { shootAll } = await import('../tests/visual/shoot.mjs');
const src = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
const rest = src.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
const DEAD = ['player-card', 'numpad'];
const out = { static: {}, runtime: {} };
for (const c of DEAD) {
  // klassenaam als los woord (niet als deel van id "start-player-card" of functienaam "numpadPress")
  const re = new RegExp('(^|[^\\w-])' + c + '(?![\\w-])', 'g'); const hits = [];
  for (const m of rest.matchAll(re)) { const ln = rest.slice(0, m.index).split('\n').length; hits.push(ln + ': ' + rest.slice(Math.max(0, m.index - 40), m.index + c.length + 20).replace(/\s+/g, ' ')); }
  out.static[c] = hits;
}
const pw = (await import(process.env.PLAYWRIGHT)).default;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const items = [];
for (const s of SCENARIOS) for (const theme of ['dark', 'light']) items.push({ s, w: 390, h: 844, vn: 'mobiel', lang: 'nl', theme, file: `${s.id}/${theme}.png` });
const measure = () => ({ playerCard: document.querySelectorAll('.player-card').length, numpad: document.querySelectorAll('.numpad').length,
  gameBar: (() => { const e = document.getElementById('game-bar'); return e ? getComputedStyle(e).display : 'geen'; })() });
const res = await shootAll(b, REPO, '/tmp/dead4c3', items, { jobs: 2, shot: false, measure });
await b.close();
let pc = 0, np = 0; const gb = new Set(); let errs = 0;
for (const r of res) { pc += r.measure.playerCard; np += r.measure.numpad; gb.add(r.measure.gameBar); if (r.errors.length || r.setupErr) errs++; }
out.runtime = { opnames: res.length, scenarios: SCENARIOS.length, playerCardMatches: pc, numpadMatches: np, gameBarDisplay: [...gb], opnamesMetFout: errs };
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(HERE, '4c3-log', 'dood-bewijs.json'), JSON.stringify(out, null, 1) + '\n');
