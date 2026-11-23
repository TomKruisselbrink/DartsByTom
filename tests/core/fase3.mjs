// Fase 3 — kantinescherm (liggend ≥ 1000 px) en "Verder waar je was". Draaien: node tests/core/fase3.mjs.
// Met REF=<map met oude index.html>: telefoonmaten van het 501-scherm pixel-gelijk aan die versie.
import fs from 'fs'; import path from 'path';
import { browser, page, open, suite, eq, ok, DB, wait } from './h.mjs';
const b = await browser(); const S = suite('fase3');
const L501 = `launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.scores[0]=121;renderGame();`;
const metric = () => { const sc = document.querySelector('#sb-players .x-score'), pad = document.querySelector('.x01-pad').getBoundingClientRect(), gc = document.getElementById('game-controls').getBoundingClientRect();
  const hits = [...document.querySelectorAll('#screen-game button')].filter(e => { const q = e.getBoundingClientRect(); return q.height > 2 && q.bottom > gc.top + 1 && q.top < gc.bottom - 1 && q.right > gc.left + 1 && q.left < gc.right - 1; }).length;
  return { font: parseFloat(getComputedStyle(sc).fontSize), padW: pad.width, hits, ov: document.documentElement.scrollWidth > innerWidth + 1 }; };
for (const [w, h, min] of [[1920, 1080, 160], [1280, 800, 110], [1600, 900, 120]]) await S.t(`501 liggend ${w}×${h}: score ≥ ${min}px, numpad ≤ 520px, niets onder de spelbalk`, async () => {
  const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), viewport: { width: w, height: h }, fast: 10 }); await open(p, 500);
  await p.evaluate(L501); await wait(250); const r = await p.evaluate(metric);
  ok(r.font >= min, 'score ' + r.font); ok(r.padW <= 520.5, 'numpad ' + r.padW); eq(r.hits, 0, 'knoppen onder spelbalk'); ok(!r.ov, 'overloop');
  if (errs.length) throw new Error('pageerror ' + errs[0]); await p.close();
});
await S.t('oefenspellen liggend 1280×800 en 1366×768: invoer rechts, doel links, niets onder de spelbalk', async () => {
  const G = { bobs27: `launchGame('bobs27',['Tom','Henk'],true,'firstto',1,1,501,0);`, atc: `launchGame('atc',['Tom','Henk'],true,'firstto',1,1,501,0);`, shanghai7: `launchGame('shanghai7',['Tom','Henk','Piet','Kees'],true,'firstto',1,1,501,0);`, checkout121: `launchGame('checkout121',['Tom','Henk','Piet','Kees'],true,'firstto',1,1,501,0);`, cricket: `launchGame('cricket',['Tom','Henk'],true,'firstto',1,1,501,0);`, randomco: `rcoCount=10;launchRandomCheckout(['Tom','Henk','Piet','Kees']);` };
  const bad = [];
  for (const [w, h] of [[1280, 800], [1366, 768]]) {
    const { p, errs } = await page(b, { db: DB('Tom', 'Henk', 'Piet', 'Kees'), viewport: { width: w, height: h }, fast: 10 }); await open(p, 500);
    for (const [g, L] of Object.entries(G)) {
      await p.evaluate(() => showScreen('screen-home')); await p.evaluate(L); await wait(250);
      const r = await p.evaluate(() => { const sc = document.querySelector('.screen.active'), inp = sc.querySelector('.g-input').getBoundingClientRect(), gc = document.getElementById('game-controls').getBoundingClientRect();
        const left = (sc.querySelector('.g-target') || sc.querySelector('#cricket-board')).getBoundingClientRect();
        const hits = [...sc.querySelectorAll('button')].filter(e => { const q = e.getBoundingClientRect(); return q.height > 2 && q.bottom > gc.top + 1 && q.top < gc.bottom - 1 && q.right > gc.left + 1 && q.left < gc.right - 1; }).map(e => e.textContent.trim().slice(0, 12));
        return { right: inp.left > left.right, inpW: inp.width, hits, ov: document.documentElement.scrollWidth > innerWidth + 1 }; });
      if (!r.right) bad.push(`${w} ${g}: invoer niet rechts`); if (r.inpW > 520.5) bad.push(`${w} ${g}: invoer ${r.inpW}px`);
      if (r.hits.length) bad.push(`${w} ${g}: onder balk ${r.hits.join(',')}`); if (r.ov) bad.push(`${w} ${g}: overloop`);
    }
    if (errs.length) bad.push('pageerror ' + errs[0]); await p.close();
  }
  ok(!bad.length, bad.join(' | '));
});
await S.t('verder waar je was: na een potje op het beginscherm, één tik start hetzelfde spel met gekozen beginner', async () => {
  const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), fast: 10, seedOnce: true }); await open(p, 500);
  eq(await p.evaluate(() => document.getElementById('home-last').hidden), true, 'verborgen zonder vorig spel');
  await p.evaluate(() => { launchGame('501', ['Tom', 'Henk'], false, 'bestof', 3, 1, 301, 0); }); await wait(200);
  await p.reload(); await wait(700); await p.evaluate(() => { try { closeGameSheet(); _liveDiscard && _liveDiscard(); } catch (e) {} showScreen('screen-home'); }); await wait(200);
  const r = await p.evaluate(() => { const el = document.getElementById('home-last'); return { hid: el.hidden, t: el.innerText, btn: [...el.querySelectorAll('.hl-btns button')].map(x => x.textContent.trim()) }; });
  ok(!r.hid, 'kaart zichtbaar'); ok(/301/.test(r.t) && /Single out/.test(r.t) && /Best of 3/.test(r.t), 'titel: ' + r.t.replace(/\n/g, ' | ')); eq(r.btn, ['Tom', 'Henk', 'Loting'], 'knoppen');
  await p.evaluate(() => [...document.querySelectorAll('#home-last .hl-btns button')][1].click()); await wait(250);
  const g = await p.evaluate(() => ({ scr: _curScreen, gt: state.gameType, st: state.x01Start, cur: state.players[state.currentPlayer], fmt: state.matchFormat, n: state.matchN, dbl: state.doubleOut }));
  eq(g, { scr: 'screen-game', gt: '501', st: 301, cur: 'Henk', fmt: 'bestof', n: 3, dbl: false }, 'gestart');
  if (errs.length) throw new Error('pageerror ' + errs[0]); await p.close();
});
await S.t('verder waar je was: verwijderde speler = geen kaart; rare naam veilig; Engels', async () => {
  const X = 'A<b>"\'&';
  const cfg = { c: { players: [X, 'Henk'], gameType: 'cricket', botName: null, doubleOut: true, matchN: 1, matchSets: 1, matchFormat: 'firstto', x01Start: 501 }, ts: Date.now() };
  const { p, errs } = await page(b, { db: DB(X, 'Henk'), ls: { darts_last_config: JSON.stringify(cfg), lang: 'en' }, fast: 10 }); await open(p, 700);
  const r = await p.evaluate(() => { const el = document.getElementById('home-last'); return { hid: el.hidden, t: el.innerText, inj: !!el.querySelector('b b, .hl-btns b') }; });
  ok(!r.hid, 'zichtbaar'); ok(/Pick up where you left off/i.test(r.t) && /Who starts/i.test(r.t), 'Engels: ' + r.t.replace(/\n/g, ' | ')); ok(r.t.includes(X), 'naam als tekst'); ok(!r.inj, 'geen HTML uit naam');
  await p.evaluate(n => { delete dbCache[n]; _renderHomeLast(); }, X); eq(await p.evaluate(() => document.getElementById('home-last').hidden), true, 'verborgen na verwijderen');
  if (errs.length) throw new Error('pageerror ' + errs[0]); await p.close();
});
if (process.env.REF) await S.t('telefoonmaten: 501-scherm pixel-gelijk aan de referentie', async () => {
  const bad = [];
  for (const [w, h, n] of [[375, 667, 2], [390, 844, 2], [430, 932, 4], [375, 812, 6]]) {
    const shots = [];
    for (const root of [process.env.REF, null]) {
      const prev = process.env.ROOT; if (root) process.env.ROOT = root;
      const { p } = await page(b, { db: DB('Tom', 'Henk'), viewport: { width: w, height: h } });
      if (root) { await p.unroute('http://app.test/**'); await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; const fp = path.join(root, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(fp), contentType: 'text/html' }); }); }
      await open(p, 1500); await p.evaluate(n => { launchGame('501', ['Tom', 'Henk', 'Piet', 'Kees', 'Jan', 'Kim'].slice(0, n), true, 'firstto', 3, 1, 501, 0); }, n); await p.waitForTimeout(700);
      shots.push(await p.screenshot()); await p.close(); if (root) process.env.ROOT = prev;
    }
    if (!shots[0].equals(shots[1])) bad.push(`${w}×${h}/${n}`);
  }
  ok(!bad.length, 'verschil op ' + bad.join(', '));
});
const rc = S.done(); await b.close(); process.exit(rc);
