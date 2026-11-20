// Afronden (v247) slaat exact hetzelfde op als een referentieversie (bijv. v246) voor dezelfde eindinvoer (behalve gid/ts/date).
// Draaien: REF=<map met index.html van de referentie> node tests/security/finish-gate-eq.mjs
import fs from 'fs';
import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const ROOT = (process.env.ROOT || path.resolve(HERE, '../..')).replace(/\/?$/, '/'); const REF = (process.env.REF || '').replace(/\/?$/, '/');
if (!process.env.REF) { console.log('finish-gate-eq: overgeslagen (zet REF=<map van de referentieversie>)'); process.exit(0); }
const src = fs.readFileSync(path.join(HERE, 'finish-gate.mjs'), 'utf8');
const casesSrc = src.slice(src.indexOf('const cases = {'), src.indexOf('};', src.indexOf('const cases = {')) + 2);
const P2 = ['Tom', 'Henk']; const cases = eval('(' + casesSrc.replace('const cases = ', '') .replace(/;$/, '') + ')');
const pw = (await import(process.env.PLAYWRIGHT || 'playwright')).default; const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
async function run(root, c) {
  const p = await (await b.newContext()).newPage();
  await p.route(/gstatic/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; if (!fs.existsSync(root + f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(root + f), contentType: 'text/html' }); });
  await p.addInitScript(() => { localStorage.setItem('darts_sound', '0'); localStorage.setItem('darts_caller', '0'); Math.random = (() => { let x = 1; return () => (x = (x * 9301 + 49297) % 233280) / 233280; })(); });
  await p.goto('http://app.test/index.html'); await p.waitForTimeout(900);
  await p.evaluate(c.launch); await p.waitForTimeout(150); await p.evaluate(c.toEnd); await p.waitForTimeout(100); await p.evaluate(c.last); await p.waitForTimeout(250);
  await p.evaluate(() => { const b = document.getElementById('fin-ok'); if (b) b.click(); }); await p.waitForTimeout(500);
  const db = await p.evaluate(() => JSON.parse(JSON.stringify(dbCache)));
  await p.close();
  for (const n in db) { (db[n].gameHistory || []).forEach(e => { delete e.gid; delete e.ts; delete e.date; }); }
  return JSON.stringify(db);
}
// Bewuste verschillen t.o.v. een oudere referentie (SKIP=eliminatie om over te slaan, of REF = v248+ gebruiken).
const SKIP = (process.env.SKIP || '').split(',').filter(Boolean);
let bad = 0;
for (const [g, c] of Object.entries(cases)) {
  if (SKIP.includes(g)) { console.log(g.padEnd(15), 'overgeslagen (SKIP)'); continue; }
  const a = await run(REF, c), v = await run(ROOT, c);
  const same = a === v; if (!same) bad++;
  console.log(g.padEnd(15), same ? 'identiek' : 'VERSCHIL', same ? '' : '\n  ref:  ' + a.slice(0, 300) + '\n  nu:   ' + v.slice(0, 300));
}
console.log(bad ? 'gate-eq: GEZAKT' : 'gate-eq: GESLAAGD'); await b.close(); process.exit(bad ? 1 : 0);
