// Fase 4C-3, stap 0: classificeer elke themaregel van een component (selector ≠ :root) per eigenschap.
// Per declaratie, per element waarop hij van toepassing is, in de themastand waarin hij geldt:
//   sentinel-test: waarde tijdelijk vervangen door een herkenbare waarde. Verandert de berekende stijl niet → OVERSCHREVEN
//                  (een andere declaratie wint altijd; geen effect).
//   verwijder-test (alleen als hij wint): declaratie tijdelijk weg. Berekende stijl gelijk → OVERBODIG (de gewone regel
//                  geeft al dezelfde waarde, bijv. via een token); anders → WERKZAAM (moet een token worden).
// Alle 55 visuele scenario's, 390×844, NL, in 4 standen die elk precies één soort themaregel actief maken:
//   auto-light (systeem licht, geen keuze) · light+systeem donker · auto-dark · dark+systeem licht.
// Gebruik: [ROOT=map] node design/classify_4c3.mjs   → design/4c3-log/classificatie.json
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const { SCENARIOS } = await import('../tests/visual/scenarios.mjs');
const { shootAll } = await import('../tests/visual/shoot.mjs');
const ROOT = path.resolve(process.env.ROOT || REPO);
const MODES = [{ theme: 'auto-light' }, { theme: 'light', scheme: 'dark' }, { theme: 'auto-dark' }, { theme: 'dark', scheme: 'light' }];
const measure = () => {
  const ROOTSEL = /^(:root(:not\(\[data-theme="?(dark|light)"?\]\))?|\[data-theme="?(dark|light)"?\]|:root\[data-theme="?(dark|light)"?\]|html)$/;
  const SENT = p => /color$/.test(p) ? 'rgb(1, 2, 3)' : p === 'background-image' ? 'linear-gradient(rgb(1, 2, 3), rgb(1, 2, 3))' : p === 'box-shadow' ? 'rgb(1, 2, 3) 1px 2px 3px 0px'
    : /position-(x|y)$/.test(p) ? '7px' : p === 'background-size' ? '7px 7px' : p === 'background-repeat' ? 'repeat-y' : p === 'background-attachment' ? 'fixed' : /origin|clip/.test(p) ? 'content-box' : p.startsWith('--') ? 'sentinel' : 'inherit';
  const rules = [];
  const walk = (list, cond) => { for (const r of list) { if (r.cssRules && r.conditionText !== undefined) walk(r.cssRules, r.conditionText); else if (r.selectorText) rules.push({ r, cond: cond || '' }); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, ''); } catch (e) { /* stil: vreemd blad */ } }
  const out = [];
  for (const { r, cond } of rules) {
    const themed = /data-theme/.test(r.selectorText) || /prefers-color-scheme/.test(cond);
    if (!themed) continue;
    const parts = r.selectorText.split(',').map(x => x.trim());
    if (parts.every(x => ROOTSEL.test(x))) continue;
    if (cond && !matchMedia(cond).matches) continue;
    const props = [...r.style]; // vooraf vastleggen: set/removeProperty verandert de volgorde
    for (const prop of props) {
      const val = r.style.getPropertyValue(prop), pri = r.style.getPropertyPriority(prop);
      for (const part of parts) { // per selectordeel apart: één regel kan voor het ene deel werken en voor het andere niet
        let applies = 0, win = 0, live = 0; const liveEx = [];
        const m = part.match(/^(.*?)(::?(before|after))?$/), base = m[1], pseudo = m[2] ? '::' + m[3] : null;
        let els = []; try { els = [...document.querySelectorAll(base)]; } catch (e) { /* stil: ongeldige selector */ }
        for (const el of els) {
          applies++;
          const get = () => getComputedStyle(el, pseudo).getPropertyValue(prop);
          const orig = get();
          r.style.setProperty(prop, SENT(prop), pri); const s1 = get(); r.style.setProperty(prop, val, pri);
          if (s1 === orig) continue;
          win++;
          r.style.removeProperty(prop); const rm = get(); r.style.setProperty(prop, val, pri);
          if (rm !== orig) { live++; if (liveEx.length < 3) liveEx.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + '.' + [...el.classList].join('.') + ' ' + orig + ' → ' + rm); }
        }
        out.push({ sel: r.selectorText, part, cond, prop, val: val.trim(), pri, applies, win, live, liveEx });
      }
    }
  }
  return out;
};
const pw = (await import(process.env.PLAYWRIGHT)).default;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const items = [];
for (const s of SCENARIOS) for (const m of MODES) items.push(Object.assign({ s, w: 390, h: 844, vn: 'mobiel', lang: 'nl', file: `${s.id}/${m.theme}-${m.scheme || ''}.png` }, m));
const res = await shootAll(b, ROOT, '/tmp/classify4c3', items, { jobs: 2, shot: false, measure });
await b.close();
const agg = {};
for (const r of res) for (const d of r.measure) {
  const k = `${d.cond} | ${d.sel} | ${d.part} | ${d.prop} | ${d.val}`;
  const a = agg[k] = agg[k] || { cond: d.cond, sel: d.sel, part: d.part, prop: d.prop, liveEx: [], val: d.val, pri: d.pri, applies: 0, win: 0, live: 0, modes: new Set() };
  a.applies += d.applies; a.win += d.win; a.live += d.live; for (const x of d.liveEx) if (a.liveEx.length < 3 && !a.liveEx.includes(x)) a.liveEx.push(x); if (d.applies) a.modes.add(r.theme + (r.scheme ? '/' + r.scheme : ''));
}
const list = Object.values(agg).map(a => Object.assign(a, { modes: [...a.modes], klasse: !a.applies ? 'NIET-WAARGENOMEN' : !a.win ? 'OVERSCHREVEN' : !a.live ? 'OVERBODIG' : 'WERKZAAM' }));
list.sort((x, y) => (x.part + x.prop + x.cond).localeCompare(y.part + y.prop + y.cond));
const errs = res.filter(r => r.errors.length || r.setupErr).length;
fs.mkdirSync(path.join(HERE, '4c3-log'), { recursive: true });
fs.writeFileSync(path.join(HERE, '4c3-log', 'classificatie.json'), JSON.stringify({ opnames: res.length, opnamesMetFout: errs, declaraties: list }, null, 1) + '\n');
const cnt = {}; for (const a of list) cnt[a.klasse] = (cnt[a.klasse] || 0) + 1;
console.log(`opnames ${res.length} (fout ${errs}); declaraties ${list.length}:`, cnt);
for (const a of list) console.log(`${a.klasse.padEnd(16)} ${(a.cond ? '@' + a.cond.slice(0, 26) + ' ' : '')}${a.part.slice(0, 90)} { ${a.prop}: ${a.val.slice(0, 50)}${a.pri ? ' !' : ''} }  [${a.applies}/${a.win}/${a.live}]`);
