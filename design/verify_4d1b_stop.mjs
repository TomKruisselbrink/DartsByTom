// 4D-1b: bewijs dat het Stop-venster (.ask-box) zelf ongewijzigd is t.o.v. een referentie.
//   REF=<map met referentie-index.html> node design/verify_4d1b_stop.mjs
// Per viewport × thema × taal, oude en nieuwe code:
//  A. DOM en berekende stijl; '@vars' = alle CSS-variabelen samen (t.o.v. faf50f0 verschillen die door de tokens van 4C-1, niet door het venster)
//     A (eigenschappen gesorteerd: de volgorde van custom properties wisselt per laadbeurt) van het venster en al zijn kinderen (alle CSS-eigenschappen) gelijk;
//  B. pixels van het venster gelijk als de achtergrond (spelscherm) verborgen is;
//  C. in de normale weergave: welke verschillende pixels liggen binnen de afgeronde vorm van het venster.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const { chromium } = req(process.env.PLAYWRIGHT); const { PNG } = req(path.resolve('node_modules/pngjs'));
const REF = path.resolve(process.env.REF), NU = path.resolve('.');
const VP = [[360,640],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1920,1080]];
const TH = [['dark','dark',null],['light','light',null],['auto','dark','auto-donker'],['auto','light','auto-licht']];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM });
// Achtergrondkleur van het venster per themastand (doorzichtig = de achtergrond schijnt erdoor)
const _alpha = {}; async function surfaceAlpha([theme, cs]) { const k = theme + cs; if (_alpha[k]) return _alpha[k];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: cs }); const p = await ctx.newPage(); await p.route(/gstatic\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; const fp = path.join(NU, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(fp), contentType: f.endsWith('.html') ? 'text/html' : 'text/plain' }); });
  await p.addInitScript(t => localStorage.setItem('theme', t), theme); await p.goto('http://app.test/index.html'); await p.waitForTimeout(600);
  await p.evaluate(`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);confirmEndGame();`); await p.waitForTimeout(400);
  _alpha[k] = await p.evaluate(() => getComputedStyle(document.querySelector('.ask-box')).backgroundColor); await ctx.close(); return _alpha[k]; }
async function shoot(root, [w, h], [theme, cs], lang) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: cs, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  await p.route(/gstatic\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; const fp = path.join(root, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(fp), contentType: f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'image/png' }); });
  await p.addInitScript(([t, l]) => { localStorage.setItem('darts_sound', '0'); localStorage.setItem('darts_caller', '0'); localStorage.setItem('theme', t); localStorage.setItem('lang', l); localStorage.setItem('darts_db', JSON.stringify({ Tom: { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] }, Henk: { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] } })); }, [theme, lang]);
  await p.goto('http://app.test/index.html'); await p.waitForTimeout(900);
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  await p.evaluate(`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);confirmEndGame();`); await p.waitForTimeout(500);
  const sig = await p.evaluate(() => { const box = document.querySelector('.ask-box'); if (!box) return null; const els = [box, ...box.querySelectorAll('*')];
    return JSON.stringify(els.map(e => { const cs = getComputedStyle(e); const o = {}; for (const k of [...cs].sort()) if (!k.startsWith('--')) o[k] = cs.getPropertyValue(k); o['@vars'] = [...cs].filter(k => k.startsWith('--')).sort().map(k => k + ':' + cs.getPropertyValue(k)).join(';'); const r = e.getBoundingClientRect(); return { tag: e.tagName, cls: e.className, txt: e.childElementCount ? '' : e.textContent, r: [r.x, r.y, r.width, r.height], st: o }; })) + '|' + box.outerHTML; });
  const rect = await p.evaluate(() => { const r = document.querySelector('.ask-box').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), rad: parseFloat(getComputedStyle(document.querySelector('.ask-box')).borderTopLeftRadius) }; });
  const full = PNG.sync.read(await p.screenshot());
  await p.addStyleTag({ content: '#screen-game,#pill-nav,#game-controls,#x01-head{visibility:hidden!important}' }); await p.waitForTimeout(150);
  const alone = PNG.sync.read(await p.screenshot({ clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h } }));
  await ctx.close(); return { sig, rect, full, alone };
}
const inRound = (x, y, r) => { const { x: x0, y: y0, w, h, rad } = r; if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false;
  const cx = x < x0 + rad ? x0 + rad : x >= x0 + w - rad ? x0 + w - rad : x, cy = y < y0 + rad ? y0 + rad : y >= y0 + h - rad ? y0 + h - rad : y; return (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= rad * rad; };
// kern = binnen de afgeronde vorm, minstens 2 px van de rand (dus niet de 1px-rand of de afgeronde anti-aliasing)
const inCore = (x, y, r) => inRound(x - 2, y, r) && inRound(x + 2, y, r) && inRound(x, y - 2, r) && inRound(x, y + 2, r);
const rows = []; let fout = 0;
for (const vp of VP) for (const th of TH) for (const lang of ['nl', 'en']) {
  const a = await shoot(REF, vp, th, lang), n = await shoot(NU, vp, th, lang);
  let A = a.sig === n.sig && JSON.stringify(a.rect) === JSON.stringify(n.rect), waarom = '';
  if (!A) { const [sa, ha] = a.sig.split('|'), [sn, hn] = n.sig.split('|'); const ja = JSON.parse(sa), jn = JSON.parse(sn); const keys = new Set();
    if (ha !== hn) keys.add('html'); if (JSON.stringify(a.rect) !== JSON.stringify(n.rect)) keys.add('rect'); if (ja.length !== jn.length) keys.add('aantal');
    else ja.forEach((e, i) => { for (const k of ['tag', 'cls', 'txt', 'r']) if (JSON.stringify(e[k]) !== JSON.stringify(jn[i][k])) keys.add(k); for (const k in e.st) if (e.st[k] !== jn[i].st[k]) keys.add(k); });
    if ([...keys].every(k => k === '@vars')) { A = true; waarom = 'alleen CSS-variabelen (tokens) anders; DOM, maten en alle echte eigenschappen gelijk'; }
    else waarom = 'anders: ' + [...keys].join(', '); }
  const B = a.alone.data.equals(n.alone.data);
  let diffIn = 0, diffOut = 0, maxIn = 0, diffCore = 0; const W = a.full.width;
  for (let y = 0; y < a.full.height; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const d = Math.abs(a.full.data[i] - n.full.data[i]) + Math.abs(a.full.data[i + 1] - n.full.data[i + 1]) + Math.abs(a.full.data[i + 2] - n.full.data[i + 2]);
    if (!d) continue; if (inRound(x, y, a.rect)) { diffIn++; maxIn = Math.max(maxIn, d); if (inCore(x, y, a.rect)) diffCore++; } else diffOut++; }
  const naam = `${vp[0]}×${vp[1]} ${th[2] || th[0]} ${lang}`; if (!A || !B) fout++;
  const doorzichtig = await surfaceAlpha(th); rows.push({ naam, A, waarom, B, diffBuiten: diffOut, diffBinnen: diffIn, diffKern: diffCore, maxBinnen: maxIn, vensterachtergrond: doorzichtig });
  console.log(`${A && B ? '✓' : '✗'} ${naam.padEnd(26)} DOM+stijl ${A ? 'gelijk' : 'ANDERS'} · venster zonder achtergrond ${B ? 'pixel-gelijk' : 'ANDERS'} · normaal: ${diffOut} px anders buiten, ${diffIn} binnen de afgeronde vorm (max Δ ${maxIn}), waarvan ${diffCore} in de kern; venster-achtergrond ${doorzichtig}${waarom ? ' — ' + waarom : ''}`);
}
await b.close();
fs.writeFileSync('design/4d-log/stop-venster-4d1b.json', JSON.stringify({ ref: REF, rows }, null, 1));
console.log(`\nstop-venster: ${fout ? 'FOUT' : 'GELIJK'} — ${rows.length - fout}/${rows.length} combinaties venster identiek`);
process.exit(fout ? 1 : 0);
