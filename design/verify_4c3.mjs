// Fase 4C-3: vergelijk de BEREKENDE stijl van elk element (en ::before/::after) tussen een referentie en de huidige code.
// 55 scenario's × 6 themastanden (automatisch licht/donker, gekozen licht/donker × systeem licht/donker = ook de
// kruiscombinaties), 390×844, NL. Eigenschappen: kleur, achtergrond, rand, schaduw, opacity (alles wat themaregels raken).
// Gebruik: REFROOT=/tmp/ref4c3 node design/verify_4c3.mjs [--quick = 4 standen]   → exit 1 bij een verschil
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const { SCENARIOS } = await import('../tests/visual/scenarios.mjs');
const { shootAll } = await import('../tests/visual/shoot.mjs');
const REF = process.env.REFROOT; if (!REF) { console.error('REFROOT ontbreekt'); process.exit(2); }
const MODES = [{ theme: 'auto-light' }, { theme: 'auto-dark' }, { theme: 'light', scheme: 'light' }, { theme: 'light', scheme: 'dark' }, { theme: 'dark', scheme: 'dark' }, { theme: 'dark', scheme: 'light' }];
const measure = () => {
  const P = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'box-shadow', 'opacity', 'outline-color', 'text-shadow', 'fill', 'stroke'];
  // extra toestand die in geen scenario voorkomt: een laatste-score-label met .bust (kopie, alleen voor deze meting)
  const xl = document.querySelector('.x-last:not(.bust)'); if (xl) { const c = xl.cloneNode(true); c.classList.add('bust'); c.setAttribute('data-v4c3', '1'); xl.parentNode.appendChild(c); }
  const out = []; const all = [document.documentElement, ...document.querySelectorAll('*')];
  all.forEach((el, i) => { for (const ps of [null, '::before', '::after']) { const cs = getComputedStyle(el, ps); if (ps && (cs.content === 'none' || cs.content === 'normal')) continue; out.push(i + (ps || '') + ' ' + (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : '')) + ' | ' + P.map(p => cs.getPropertyValue(p)).join(' | ')); } });
  return out;
};
const pw = (await import(process.env.PLAYWRIGHT)).default;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const modes = process.argv.includes('--quick') ? MODES.filter((m, i) => [0, 1, 3, 5].includes(i)) : MODES;
const items = []; for (const s of SCENARIOS) for (const m of modes) items.push(Object.assign({ s, w: 390, h: 844, vn: 'mobiel', lang: 'nl', file: `${s.id}/${m.theme}-${m.scheme || ''}` }, m));
const run = root => shootAll(b, root, '/tmp/verify4c3', items.map(x => Object.assign({}, x)), { jobs: 3, shot: false, measure });
const CUR = path.resolve(process.env.CURROOT || REPO);
const [a, c] = [await run(REF), await run(CUR)];
await b.close();
const key = r => r.file; const A = Object.fromEntries(a.map(r => [key(r), r])); let diffs = 0, lines = [], errs = 0;
for (const r of c) {
  const o = A[key(r)]; if (r.errors.length || r.setupErr || o.errors.length || o.setupErr) errs++;
  if (o.measure.length !== r.measure.length) { diffs++; lines.push(`${r.file}: aantal elementen ${o.measure.length} ≠ ${r.measure.length}`); continue; }
  for (let i = 0; i < r.measure.length; i++) if (o.measure[i] !== r.measure[i]) { diffs++; if (lines.length < 40) lines.push(`${r.file}\n   was: ${o.measure[i].slice(0, 400)}\n   nu : ${r.measure[i].slice(0, 400)}`); }
}
const n = c.reduce((s, r) => s + r.measure.length, 0);
console.log(lines.join('\n'));
console.log(`berekende stijl: ${diffs ? 'VERSCHIL' : 'GELIJK'} — ${c.length} pagina's (${modes.length} standen × ${SCENARIOS.length} scenario's), ${n} elementen/pseudo's vergeleken, ${diffs} verschillen, ${errs} pagina's met fout`);
process.exit(diffs || errs ? 1 : 0);
