// Fase 2 — elk spel één keer echt uitspelen via de invoerfuncties (geen stand forceren): winnaar, opslag, winscherm.
// Draaien: node tests/core/games.mjs (zie tests/README.md).
import { browser, page, open, suite, eq, ok, DB, wait } from './h.mjs';
const b = await browser(); const S = suite('games');
// Speelt in de pagina tot de afrond-vraag, het winscherm of maxStappen. step(cur) krijgt de huidige speler.
const PLAY = `window.__play=async function(step,max){for(var i=0;i<(max||3000);i++){
  if(document.getElementById('fin-ov')){document.getElementById('fin-ok').click();await new Promise(function(r){setTimeout(r,300)});return 'gate';}
  if(_curScreen==='screen-win')return 'win';
  step();await new Promise(function(r){setTimeout(r,60)});}return 'max';};`;
async function run(name, launch, step, check, { players = ['Tom', 'Henk'], max } = {}) {
  await S.t(name, async () => {
    const { p, errs } = await page(b, { db: DB('Tom', 'Henk', 'Piet'), fast: 10 }); await open(p, 500);
    await p.evaluate(PLAY); await p.evaluate(launch); await wait(250);
    const how = await p.evaluate(`__play(function(){var cur=state.currentPlayer;(${step})(cur);},${max || 3000})`);
    ok(how !== 'max', 'potje niet afgelopen');
    await wait(400);
    const r = await p.evaluate(pl => ({ scr: _curScreen, e: pl.map(n => (dbCache[n].gameHistory || [])[0] || null), w: pl.map(n => dbCache[n].wins), state: { bobOut: state.bobOut, sh: state.shScores } }), players);
    await check(r, p);
    if (errs.length) throw new Error('pageerror: ' + errs[0]);
    await p.close();
  });
}
const both = (r, gt) => { eq(r.e.map(e => e && e.gameType), [gt, gt], 'gameType'); eq(r.e.map(e => e.won), [true, false], 'Tom wint'); eq(r.scr, 'screen-win', 'winscherm'); };

await run('Around the Clock: Tom raakt alles, Henk mist', `launchGame('atc',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){c===0?atcHitMult(1):atcMiss();}', r => { both(r, 'atc'); eq(r.e[0].highScore, 22, 'Tom alle 22 doelen'); });
await run('Cricket: Tom sluit alles met triples', `launchGame('cricket',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){if(c===0){var i=state.crMarks[0].findIndex(function(m){return m<3;});state.crMult=3;cricketHit(i<0?0:i);}else cricketMiss();}', r => both(r, 'cricket'));
await run('Shanghai 7 rondes: hoogste totaal wint', `launchGame('shanghai7',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){c===0?shScore(1):shMiss();}', r => { both(r, 'shanghai7'); eq(r.e[0].score, 3 * (1 + 2 + 3 + 4 + 5 + 6 + 7), 'Tom score'); });
await run('Shanghai direct: single + dubbel + triple in één beurt', `launchGame('shanghai20',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){if(c===0){shScore(state.shDarts+1);}else shMiss();}', r => { both(r, 'shanghai20'); eq(r.e[0].shanghai, true, 'shanghai-vlag'); });
await run("Bob's 27: Henk gaat onder 0 en is uit, Tom haalt het eind", `bobStopNeg=true;launchGame('bobs27',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){bobThrow(c===0?1:0);}', r => { both(r, 'bobs27'); eq(r.e[0].bobStats.reached, 21, 'Tom 21 rondes'); eq(r.e[1].bobStats.out, true, 'Henk uit'); });
await run("Bob's 27 solo: uit = verloren, geen winst", `bobStopNeg=true;launchGame('bobs27',['Tom'],true,'firstto',1,1,501,0);`,
  'function(c){bobThrow(0);}', r => { eq(r.e[0].won, false, 'won'); eq(r.e[0].bobStats.out, true, 'uit'); eq(r.w[0], 0, 'geen winst'); }, { players: ['Tom'] });
await run('Halve It: Henk mist alles en wordt gehalveerd', `hiRandomOrder=false;hiSequence=DEFAULT_SEQ.map(function(s){return Object.assign({},s);});launchGame('halveit',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){hiAddPts(c===0?20:0);}', r => { both(r, 'halveit'); eq([r.e[0].score, r.e[1].score], [720, 0], 'scores (12 × 60 en steeds gehalveerd vanaf 0)'); eq(r.e[0].hiRoundHistory.length, 12, '12 rondes'); });
await run('Eliminatie: Tom komt precies op 301', `eliDoubleOut=false;eliTarget=301;launchGame('eliminatie',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(c){if(c===0){var left=state.eliTarget-state.eliScores[0];eliNumQuick(Math.min(60,left));}else eliNumQuick(1);eliSubmit();}', r => { both(r, 'eliminatie'); eq(r.e[0].score, 301, 'eindstand'); eq(r.e[0].darts, 6, 'beurten'); });
await S.t('Eliminatie: precies op de score van de ander = die terug naar 0', async () => {
  const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), fast: 10 }); await open(p, 500);
  await p.evaluate(`eliDoubleOut=false;eliTarget=301;launchGame('eliminatie',['Tom','Henk'],true,'firstto',1,1,501,0);`); await wait(200);
  await p.evaluate(() => { eliNumQuick(50); eliSubmit(); }); await wait(150); await p.evaluate(() => { eliNumQuick(50); eliSubmit(); }); await wait(150);
  eq(await p.evaluate(() => state.eliScores.slice()), [0, 50], 'Tom terug naar 0');
  if (errs.length) throw new Error('pageerror: ' + errs[0]); await p.close();
});
await run('Afgooien (willekeurig): Tom wordt Killer en gooit Henk eruit', `afgAssign='random';afgLives=3;afgBySeg=true;afgTeams=0;launchGame('afgooien',['Tom','Henk'],true,'firstto',1,1,501,0);`,
  'function(){var p=_afgCurrentPlayer();if(!p)return;if(p.name==="Tom"){if(p.score<_afg.target)afgScore(3);else afgAttack("Henk",3);}else afgScore(0);}', r => both(r, 'afgooien'));
await run('Random Checkout (3 checkouts): meeste punten wint', `rcoCount=3;rcoMode='default';rcoDarts=9;launchRandomCheckout(['Tom','Henk']);`,
  'function(){rcoResult(rco.cur===0);}', r => { both(r, 'randomco'); eq(r.e[0].rcoStats.hits, 3, 'Tom 3 raak'); eq(r.e[1].rcoStats.hits, 0, 'Henk 0'); });
await S.t('121 Checkout: Stop slaat per speler de pogingen op', async () => {
  const { p, errs } = await page(b, { db: DB('Tom', 'Henk'), fast: 10 }); await open(p, 500);
  await p.evaluate(`launchGame('checkout121',['Tom','Henk'],true,'firstto',1,1,501,0);`); await wait(200);
  await p.evaluate(() => { co121Checkout(); }); await wait(100); await p.evaluate(() => { co121Fail(); }); await wait(100);
  await p.evaluate(() => confirmEndGame()); await wait(150);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.ask-ov button')].pop(); b.click(); }); await wait(300);
  const r = await p.evaluate(() => ({ t: dbCache.Tom.gameHistory[0], h: dbCache.Henk.gameHistory[0], scr: _curScreen }));
  eq(r.t && r.t.gameType, 'checkout121', 'Tom opgeslagen'); eq(r.t.won, true, 'Tom gelukt'); eq(r.h && r.h.won, false, 'Henk mislukt'); eq(r.scr, 'screen-home', 'terug naar home');
  if (errs.length) throw new Error('pageerror: ' + errs[0]); await p.close();
});
const rc = S.done(); await b.close(); process.exit(rc);
