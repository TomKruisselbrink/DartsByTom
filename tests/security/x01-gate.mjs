// v249 — draaien: node tests/security/x01-gate.mjs (zie README).
// X01 "Potje afronden?" alleen bij de wedstrijdbeslissende worp met single out: niet na een tussenleg, niet bij double out
// (daar blijft de double-vraag), niet als de bot de wedstrijd uitgooit.
import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = [];
const E = () => ({ games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] });
async function fresh() { const { p, errs } = await page(b, { db: { Tom: E(), Henk: E() } }); await open(p); return { p, errs }; }
const sub = v => `document.getElementById('score-input').value='${v}';submitScore();`;
// 1. tussenleg in best of 3: geen vraag, volgende leg begint, niets opgeslagen
{ const { p, errs } = await fresh();
  await p.evaluate(`launchGame('501',['Tom','Henk'],false,'bestof',3,1,501,0);state.scores[0]=40;renderGame();${sub(40)}`); await p.waitForTimeout(1600);
  const r = await p.evaluate(() => ({ ov: !!document.getElementById('fin-ov'), lw: state.legWins.slice(), leg: state.currentLeg, sc: state.scores.slice(), n: dbCache.Tom.gameHistory.length }));
  if (r.ov) fails.push('tussenleg: vraag verschenen'); if (r.lw[0] !== 1 || r.leg !== 2 || r.sc[0] !== 501) fails.push('tussenleg: volgende leg niet gestart ' + JSON.stringify(r)); if (r.n) fails.push('tussenleg: opgeslagen');
  if (errs.length) fails.push('tussenleg: ' + errs[0]); await p.close(); }
// 2. double out: double-vraag, geen afrond-vraag
{ const { p, errs } = await fresh();
  await p.evaluate(`launchGame('501',['Tom','Henk'],true,'firstto',1,1,501,0);state.scores[0]=40;renderGame();${sub(40)}`); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({ dbl: !!document.getElementById('dbl-yn-overlay'), ov: !!document.getElementById('fin-ov') }));
  if (!r.dbl || r.ov) fails.push('double out: ' + JSON.stringify(r)); if (errs.length) fails.push('double out: ' + errs[0]); await p.close(); }
// 3. bot gooit de wedstrijd uit: geen vraag
{ const { p, errs } = await fresh();
  await p.evaluate(`botEnabled=true;botLevelMode='manual';botManualLevel='expert';launchGame('501',['Tom','Bot'],false,'firstto',1,1,501,0);state.botPlayerIndex=1;state.scores[1]=2;state.currentPlayer=1;renderGame();`);
  await p.evaluate(() => { Math.random = () => 0.01; triggerBotTurn(); }); await p.waitForTimeout(3500);
  const r = await p.evaluate(() => ({ ov: !!document.getElementById('fin-ov'), scr: _curScreen, sc: state.scores.slice() }));
  if (r.ov) fails.push('bot: vraag verschenen ' + JSON.stringify(r)); if (errs.length) fails.push('bot: ' + errs[0]); await p.close();
  console.log('bot-check', JSON.stringify(r)); }
console.log(`\nx01-gate: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
