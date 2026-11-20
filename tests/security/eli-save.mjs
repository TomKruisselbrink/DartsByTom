// v248 — draaien: node tests/security/eli-save.mjs (zie README).
// Eliminatie slaat potjes op: per speler 1 entry (won, darts = beurten, score = eindstand, matchFormat), 1× ook bij double out,
// solo = geen winst, geschiedenis + statistieken tonen het potje (NL/EN), namen met tekens worden ge-escapet.
import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = []; const log = [];
const E = () => ({ games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] });
const X = 'A<b>"\'&';
async function run(name, players, dbl, lang) {
  const db = {}; players.forEach(n => db[n] = E());
  const { p, errs } = await page(b, { db, ls: lang ? { lang } : {} });
  await open(p);
  await p.evaluate(([pl, dbl]) => { eliDoubleOut = dbl; eliTarget = 301; launchGame('eliminatie', pl, true, 'firstto', 1, 1, 501, 0); }, [players, dbl]);
  await p.waitForTimeout(200);
  // beurt 1: speler 0 gooit 60; beurt 2: speler 1 gooit 45 (bij 2 spelers); daarna speler 0 naar 281 en precies uit met 20
  await p.evaluate(() => { eliNumQuick(60); eliSubmit(); });
  if (players.length > 1) await p.evaluate(() => { eliNumQuick(45); eliSubmit(); });
  await p.evaluate(() => { state.eliScores[state.currentPlayer] = 281; renderEliminatie(); eliNumQuick(20); eliSubmit(); });
  await p.waitForTimeout(250);
  if (dbl) { await p.evaluate(() => document.getElementById('eli-dbl-yes').click()); await p.waitForTimeout(300); }
  else { await p.evaluate(() => document.getElementById('fin-ok').click()); await p.waitForTimeout(500); }
  const r = await p.evaluate(pl => ({ scr: _curScreen, e: pl.map(n => (dbCache[n].gameHistory || [])), c: pl.map(n => ({ g: dbCache[n].games, w: dbCache[n].wins, d: dbCache[n].totalDarts, s: dbCache[n].totalScore })) }), players);
  if (r.scr !== 'screen-win') fails.push(name + ': geen winscherm');
  players.forEach((n, i) => {
    const es = r.e[i];
    if (es.length !== 1) { fails.push(`${name}: ${n} heeft ${es.length} potjes`); return; }
    const e = es[0], winner = i === 0, solo = players.length === 1;
    if (e.gameType !== 'eliminatie') fails.push(name + ': gameType ' + e.gameType);
    if (e.won !== (winner && !solo)) fails.push(`${name}: ${n} won=${e.won}`);
    const wantScore = winner ? 301 : 45, wantTurns = winner ? 2 : 1;
    if (e.score !== wantScore || e.highScore !== wantScore) fails.push(`${name}: ${n} score ${e.score}/${e.highScore}, verwacht ${wantScore}`);
    if (e.darts !== wantTurns) fails.push(`${name}: ${n} darts ${e.darts}, verwacht ${wantTurns} beurten`);
    if (e.matchFormat !== 'tot 301' + (dbl ? ' · double out' : '')) fails.push(name + ': matchFormat ' + e.matchFormat);
    if (!e.gid || !e.ts || !e.date) fails.push(name + ': gid/ts/date ontbreekt');
    if (!solo && JSON.stringify(e.opponents) !== JSON.stringify(players.filter(x => x !== n))) fails.push(name + ': opponents ' + JSON.stringify(e.opponents));
    const c = r.c[i];
    if (c.g !== 1 || c.w !== (winner && !solo ? 1 : 0) || c.d !== wantTurns || c.s !== wantScore) fails.push(`${name}: tellers ${n} ${JSON.stringify(c)}`);
  });
  // geen tweede opslag bij nogmaals renderen / winscherm
  const again = await p.evaluate(pl => { try { _eliWinSave(20, 301); } catch (e) {} return pl.map(n => dbCache[n].gameHistory.length); }, players);
  if (again.some(x => x !== 1)) fails.push(name + ': tweede keer opgeslagen ' + again);
  // geschiedenis en statistieken
  const h = await p.evaluate(async pl => {
    historySelectedPlayer = pl[0]; showScreen('screen-history'); await new Promise(r => setTimeout(r, 400));
    const ht = document.getElementById('history-content').innerText;
    document.querySelector('#history-content [onclick^="toggleHistoryDetail"]').click(); await new Promise(r => setTimeout(r, 400));
    const hd = document.getElementById('history-content').innerText;
    statsSelectedPlayer = pl[0]; statsGameFilter[pl[0]] = 'eliminatie'; showScreen('screen-stats'); await new Promise(r => setTimeout(r, 400));
    return { ht, hd, st: document.getElementById('stats-content') ? document.getElementById('stats-content').innerText : document.body.innerText, inj: !!document.querySelector('#history-content b, #stats-content b') };
  }, players);
  const en = lang === 'en';
  if (!h.ht.includes(en ? 'Elimination' : 'Eliminatie') && !h.ht.includes('Eliminatie')) fails.push(name + ': geschiedenis toont het potje niet');
  if (!h.hd.includes(en ? 'final score 301' : 'eindstand 301')) fails.push(name + ': detail mist eindstand: ' + h.hd.slice(0, 300).replace(/\n/g, ' | '));
  if (!h.hd.includes(en ? '2 turns' : '2 beurten')) fails.push(name + ': detail mist beurten');
  if (!h.st.includes(en ? 'Highest final score' : 'Hoogste eindstand')) fails.push(name + ': statistieken missen Hoogste eindstand');
  if (h.inj) fails.push(name + ': <b> uit naam als element');
  if (errs.length) fails.push(name + ': pageerrors ' + errs.slice(0, 2).join(' | '));
  log.push(`${name}: ok-check (${players.length} sp, double out ${dbl}, ${lang || 'nl'})`);
  await p.close();
}
await run('2 spelers', ['Tom', 'Henk'], false);
await run('double out', ['Tom', 'Henk'], true);
await run('EN', ['Tom', 'Henk'], false, 'en');
await run('rare naam', [X, 'Henk'], false);
await run('solo', ['Tom'], false);
log.forEach(l => console.log(l));
console.log(`\neli-save: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
