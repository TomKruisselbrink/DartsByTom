// Fase 2 — X01-spelregels: start, normale beurt, bust (onder 0, op 1), single out, ongeldige invoer, double out (ja/nee, dubbel),
// legs, sets, best of, ongedaan, teams, 180/checkout-statistiek, solo. Draaien: node tests/core/x01.mjs (zie tests/README.md).
import { browser, page, open, suite, eq, ok, DB, wait } from './h.mjs';
const b = await browser(); const S = suite('x01');
const P2 = ['Tom', 'Henk'];
async function fresh(db = DB('Tom', 'Henk', 'Piet', 'Kees')) {
  const { p, errs } = await page(b, { db, fast: 10 }); await open(p, 500);
  await p.evaluate(() => { window.sub = v => { document.getElementById('score-input').value = String(v); submitScore(); }; });
  return { p, errs, close: async () => { if (errs.length) throw new Error('pageerror: ' + errs[0]); await p.close(); } };
}
const L = (fmt, n, sets, dbl = true, start = 0, pl = P2) => `launchGame('501',${JSON.stringify(pl)},${dbl},'${fmt}',${n},${sets},501,${start});`;
const st = p => p.evaluate(() => ({ sc: state.scores.slice(), cur: state.currentPlayer, leg: state.currentLeg, lw: state.legWins.slice(), sw: (state.setWins || []).slice(), lis: (state.legsInSet || []).slice(), dc: state.dartCount.slice(), h: state.history.length, scr: _curScreen }));
const hist = (p, n) => p.evaluate(n => (dbCache[n].gameHistory || []), n);

await S.t('start: 501 voor iedereen, gekozen beginner, ronde 1', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, true, 1)); await wait(150);
  const s = await st(f.p); eq(s.sc, [501, 501], 'scores'); eq(s.cur, 1, 'beginner'); eq(await f.p.evaluate(() => state.round), 1, 'ronde'); await f.close();
});
await S.t('normale beurt: score eraf, volgende speler', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1)); await f.p.evaluate(() => sub(60)); await wait(150);
  const s = await st(f.p); eq(s.sc, [441, 501], 'scores'); eq(s.cur, 1, 'beurt naar Henk'); eq(s.dc, [1, 0], 'beurten'); await f.close();
});
await S.t('bust onder 0: score blijft, beurt telt, volgende speler', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(60)); await wait(250);
  const s = await st(f.p); eq(s.sc[0], 40, 'score'); eq(s.cur, 1, 'volgende'); eq(s.dc[0], 1, 'beurt geteld');
  ok(await f.p.evaluate(() => state.history[state.history.length - 1].bust === true), 'bust in historie'); await f.close();
});
await S.t('bust grensgeval: 1 te veel (40 over, 41 gegooid)', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, false) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(41)); await wait(250);
  const s = await st(f.p); eq(s.sc[0], 40, 'score blijft'); eq(s.cur, 1, 'volgende'); await f.close();
});
await S.t('bust op 1 bij double out', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, true) + 'state.scores[0]=41;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(250);
  const s = await st(f.p); eq(s.sc[0], 41, 'score blijft'); eq(s.cur, 1, 'volgende'); await f.close();
});
await S.t('single out: op 1 eindigen mag', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, false) + 'state.scores[0]=41;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(250);
  eq((await st(f.p)).sc[0], 1, 'score 1'); await f.close();
});
await S.t('ongeldige invoer (181, -5, 999) verandert niets', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1));
  for (const v of ['181', '-5', '999']) await f.p.evaluate(v => sub(v), v); await wait(150);
  const s = await st(f.p); eq(s.sc, [501, 501], 'scores'); eq(s.cur, 0, 'beurt'); eq(s.h, 0, 'historie'); await f.close();
});
await S.t('double out uitgooien: Ja → dubbel kiezen → doubleStats + winst + leg-dubbel', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, true) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(150);
  ok(await f.p.evaluate(() => !!document.getElementById('dbl-yn-overlay')), 'double-vraag');
  await f.p.evaluate(() => [...document.querySelectorAll('#dbl-yn-overlay button')].pop().click()); await wait(150);
  ok(await f.p.evaluate(() => document.getElementById('double-modal').style.display === 'flex'), 'dubbelkeuze');
  await f.p.evaluate(() => onDoubleSelected('D20')); await wait(300);
  const r = await f.p.evaluate(() => ({ ds: dbCache.Tom.doubleStats, e: dbCache.Tom.gameHistory[0], h: dbCache.Henk.gameHistory[0], scr: _curScreen }));
  eq(r.ds, { D20: 1 }, 'doubleStats'); eq(r.e.won, true, 'Tom wint'); eq(r.h.won, false, 'Henk verliest'); eq(r.e.legBreakdown[0].dbl, 'D20', 'leg-dubbel');
  eq(r.scr, 'screen-win', 'winscherm'); await f.close();
});
await S.t('double out: Nee = bust, score blijft staan', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, true) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(150);
  await f.p.evaluate(() => document.querySelector('#dbl-yn-overlay button').click()); await wait(250);
  const s = await st(f.p); eq(s.sc[0], 40, 'score'); eq(s.cur, 1, 'volgende'); eq((await hist(f.p, 'Tom')).length, 0, 'niets opgeslagen');
  ok(await f.p.evaluate(() => state.history.slice(-1)[0].checkoutAttempt && !state.history.slice(-1)[0].checkoutHit), 'gemiste checkout geteld'); await f.close();
});
await S.t('legs: leg gewonnen → nieuwe leg, scores terug, andere speler begint', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 2, 1, false) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(400);
  const s = await st(f.p); eq(s.lw, [1, 0], 'legWins'); eq(s.sc, [501, 501], 'scores terug'); eq(s.leg, 2, 'leg 2'); eq(s.cur, 1, 'Henk begint leg 2');
  eq((await hist(f.p, 'Tom')).length, 0, 'nog niets opgeslagen'); await f.close();
});
await S.t('best of 3: na 2 gewonnen legs klaar, uitslag 2–0', async () => {
  const f = await fresh(); await f.p.evaluate(L('bestof', 3, 1, false) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(400);
  await f.p.evaluate(() => { state.currentPlayer = 0; state.scores[0] = 40; renderGame(); sub(40); }); await wait(300);
  await f.p.evaluate(() => document.getElementById('fin-ok').click()); await wait(300);
  const e = (await hist(f.p, 'Tom'))[0]; eq(e.legResult, '2–0', 'legResult'); eq(e.matchFormat, 'BO3', 'matchFormat'); eq(e.legBreakdown.length, 2, 'twee legs'); await f.close();
});
await S.t('sets: set gewonnen → legs per set terug naar 0; 2 sets = wedstrijd', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 2, false) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(400);
  const s = await st(f.p); eq(s.sw, [1, 0], 'setWins'); eq(s.lis, [0, 0], 'legsInSet terug');
  await f.p.evaluate(() => { state.currentPlayer = 0; state.scores[0] = 40; renderGame(); sub(40); }); await wait(300);
  await f.p.evaluate(() => document.getElementById('fin-ok').click()); await wait(300);
  const e = (await hist(f.p, 'Tom'))[0]; eq(e.setResult, '2–0', 'setResult'); eq(e.won, true, 'gewonnen'); await f.close();
});
await S.t('ongedaan: laatste beurt terug, zelfde speler aan de beurt', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1)); await f.p.evaluate(() => { sub(60); }); await wait(100);
  await f.p.evaluate(() => sub(45)); await wait(100); await f.p.evaluate(() => undoThrow()); await wait(100);
  const s = await st(f.p); eq(s.sc, [441, 501], 'scores'); eq(s.cur, 1, 'Henk weer aan de beurt'); eq(s.dc, [1, 0], 'beurten'); await f.close();
});
await S.t('ongedaan na bust zet beurt terug', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(60)); await wait(250);
  await f.p.evaluate(() => undoThrow()); await wait(100); const s = await st(f.p); eq(s.cur, 0, 'Tom weer'); eq(s.dc[0], 0, 'beurt weg'); eq(s.h, 0, 'historie leeg'); await f.close();
});
await S.t('teams 2 tegen 2: score gedeeld, om en om, partners/opponents/won', async () => {
  const f = await fresh(); await f.p.evaluate(`_pendingTeams=[0,1,0,1];launchGame('501',['Tom','Henk','Piet','Kees'],false,'firstto',1,1,501,0);`); await wait(150);
  const tm = await f.p.evaluate(() => state.teamOf.slice()); eq(tm, [0, 1, 0, 1], 'teams om en om');
  await f.p.evaluate(() => sub(100)); await wait(100);
  const s = await st(f.p); eq(s.sc, [401, 501, 401, 501], 'teamscore gekopieerd');
  await f.p.evaluate(() => { state.scores = [40, 501, 40, 501]; state.currentPlayer = 2; renderGame(); sub(40); }); await wait(250);
  await f.p.evaluate(() => document.getElementById('fin-ok').click()); await wait(300);
  const r = await f.p.evaluate(() => ({ t: dbCache.Tom.gameHistory[0], p: dbCache.Piet.gameHistory[0], h: dbCache.Henk.gameHistory[0] }));
  eq([r.t.won, r.p.won, r.h.won], [true, true, false], 'winst per team'); eq(r.p.partners, ['Tom'], 'partners'); eq(r.p.opponents, ['Henk', 'Kees'], 'opponents'); await f.close();
});
await S.t('statistiek: 180 en gemiddelde in detailedStats, darts = beurten', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, false));
  await f.p.evaluate(() => { sub(180); }); await wait(60); await f.p.evaluate(() => sub(0)); await wait(60);
  await f.p.evaluate(() => { state.currentPlayer = 0; state.scores[0] = 21; renderGame(); sub(21); }); await wait(250);
  await f.p.evaluate(() => document.getElementById('fin-ok').click()); await wait(300);
  const e = (await hist(f.p, 'Tom'))[0]; eq(e.detailedStats.count180, 1, '180'); eq(e.detailedStats.turns, 2, 'beurten'); eq(e.detailedStats.avg3, 100.5, 'gemiddelde'); eq(e.darts, 2, 'darts = beurten'); await f.close();
});
await S.t('solo: uitgegooid, maar geen winst opgeslagen', async () => {
  const f = await fresh(); await f.p.evaluate(L('firstto', 1, 1, false, 0, ['Tom']) + 'state.scores[0]=40;renderGame();'); await f.p.evaluate(() => sub(40)); await wait(250);
  await f.p.evaluate(() => { const o = document.getElementById('fin-ok'); if (o) o.click(); }); await wait(300);
  const r = await f.p.evaluate(() => ({ e: dbCache.Tom.gameHistory[0], w: dbCache.Tom.wins })); eq(r.e.won, false, 'won'); eq(r.w, 0, 'wins'); await f.close();
});
const rc = S.done(); await b.close(); process.exit(rc);
