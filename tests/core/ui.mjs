// Fase 2 — weergave: geen knop van een spelscherm onder de zwevende spelbalk (4 schermmaten, 2 en 4 spelers), geen horizontale
// overloop, hoofdschermen in NL/EN × licht/donker zonder fouten. Draaien: node tests/core/ui.mjs (zie tests/README.md).
import { browser, page, open, suite, eq, ok, DB, wait } from './h.mjs';
const b = await browser(); const S = suite('ui');
const P4 = ['Tom', 'Henk', 'Piet', 'Kees'];
const WARN = new Set();
const GAMES = {
  '501': n => `launchGame('501',${JSON.stringify(P4.slice(0, n))},true,'firstto',3,1,501,0);`,
  cricket: n => `launchGame('cricket',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  atc: n => `launchGame('atc',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  shanghai7: n => `launchGame('shanghai7',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  halveit: n => `hiRandomOrder=false;hiSequence=DEFAULT_SEQ.map(function(s){return Object.assign({},s);});launchGame('halveit',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  bobs27: n => `launchGame('bobs27',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  eliminatie: n => `eliDoubleOut=false;eliTarget=301;launchGame('eliminatie',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  checkout121: n => `launchGame('checkout121',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
  randomco: n => `rcoCount=10;rcoMode='default';launchRandomCheckout(${JSON.stringify(P4.slice(0, n))});`,
  afgooien: n => `afgAssign='random';afgLives=3;afgTeams=0;launchGame('afgooien',${JSON.stringify(P4.slice(0, n))},true,'firstto',1,1,501,0);`,
};
// Eerst helemaal naar beneden scrollen (#app-content scrolt): wat dan nog onder de balk zit, is onbereikbaar = fout.
// Moet er gescrold worden om bij een knop te komen, dan is dat een waarschuwing (geen fout): zie 'scroll'.
const CHECK = () => {
  const ac = document.getElementById('app-content'), scroll = ac.scrollHeight > ac.clientHeight + 2; ac.scrollTop = 1e6;
  const gc = document.getElementById('game-controls'), r = gc.getBoundingClientRect(), sc = document.querySelector('.screen.active');
  const hits = [...sc.querySelectorAll('button,[onclick],input,select')].filter(el => {
    if (gc.contains(el)) return false; const q = el.getBoundingClientRect(); if (q.width < 2 || q.height < 2) return false;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return q.bottom > r.top + 1 && q.top < r.bottom - 1 && q.right > r.left + 1 && q.left < r.right - 1;
  }).map(el => (el.textContent || el.id || el.tagName).trim().slice(0, 20));
  const out = { scr: sc.id, scroll, gcVisible: getComputedStyle(gc).display !== 'none' && r.height > 0, hits, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  ac.scrollTop = 0; return out;
};
for (const [w, h] of [[375, 667], [375, 812], [390, 844], [430, 932]]) {
  await S.t(`spelbalk overlapt geen knoppen op ${w}×${h} (10 spellen, 2 en 4 spelers)`, async () => {
    const { p, errs } = await page(b, { db: DB(...P4), viewport: { width: w, height: h }, fast: 10 }); await open(p, 500);
    const bad = [];
    for (const [g, L] of Object.entries(GAMES)) for (const n of [2, 4]) {
      await p.evaluate(() => { showScreen('screen-home'); }); await p.evaluate(L(n)); await wait(250);
      const r = await p.evaluate(CHECK);
      if (!r.gcVisible) bad.push(`${g}/${n}: spelbalk niet zichtbaar (${r.scr})`);
      if (r.hits.length) bad.push(`${g}/${n}: ${r.hits.join(', ')}`);
      if (r.overflow) bad.push(`${g}/${n}: horizontale overloop`);
      if (r.scroll) WARN.add(`${w}×${h} ${g}/${n}`);
    }
    if (errs.length) bad.push('pageerror: ' + errs[0]);
    ok(!bad.length, bad.join(' | ')); await p.close();
  });
}
await S.t('hoofdschermen in NL/EN × licht/donker (ook kruiscombinaties) zonder fouten of overloop', async () => {
  const bad = [];
  for (const theme of ['light', 'dark']) for (const sys of ['light', 'dark']) for (const lang of ['nl', 'en']) {
    const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), ls: { theme, lang }, colorScheme: sys, fast: 10 }); await open(p, 600);
    for (const sc of ['screen-home', 'screen-leaderboard', 'screen-stats', 'screen-history', 'screen-settings', 'screen-setup']) {
      await p.evaluate(sc => { showScreen(sc); }, sc); await wait(120);
      if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) bad.push(`${theme}/${sys}/${lang} ${sc}: overloop`);
    }
    const dt = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (dt !== theme) bad.push(`${theme}/${sys}: data-theme ${dt}`);
    if (errs.length) bad.push(`${theme}/${sys}/${lang}: ${errs[0]}`);
    await p.close();
  }
  ok(!bad.length, bad.join(' | '));
});
await S.t('Engels: geen Nederlandse kernwoorden op de hoofdschermen', async () => {
  const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), ls: { lang: 'en' }, fast: 10 }); await open(p, 700);
  const found = [];
  for (const sc of ['screen-home', 'screen-leaderboard', 'screen-settings', 'screen-setup']) {
    await p.evaluate(sc => showScreen(sc), sc); await wait(400);
    const t = await p.evaluate(sc => document.getElementById(sc).innerText, sc);
    for (const wd of ['Instellingen', 'Ranglijst', 'Statistieken', 'Geschiedenis', 'Spelers', 'Nieuw spel', 'Volgende']) if (t.includes(wd)) found.push(sc + ': ' + wd);
  }
  if (errs.length) found.push('pageerror ' + errs[0]);
  ok(!found.length, found.join(' | ')); await p.close();
});
if (WARN.size) console.log('  ! waarschuwing: spelscherm moet scrollen om alle knoppen te bereiken: ' + [...WARN].join(', '));
const rc = S.done(); await b.close(); process.exit(rc);
