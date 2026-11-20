// v250 — draaien: node tests/security/rematch-start.mjs (zie README).
// Rematch + Loting (en Zelf kiezen) moet bij elk spel de gekozen speler laten beginnen. Voorheen begonnen
// Random Checkout, 121 Checkout en Afgooien altijd met de eerste speler op papier.
import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = []; const out = [];
const E = () => ({ games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] });
const P3 = ['Tom', 'Henk', 'Piet'];
const games = ['501', 'cricket', 'atc', 'shanghai7', 'halveit', 'bobs27', 'eliminatie', 'randomco', 'checkout121', 'afgooien:random', 'afgooien:bull'];
const who = `(function(){var g=state.gameType;if(g==='afgooien'){var p=_afgCurrentPlayer?_afgCurrentPlayer():null;if(!p&&_afg.players)p=_afg.players[_afg.bullIdx||0];return p?_afgThrower(p):null;}return state.players[state.currentPlayer];})()`;
for (const g of games) {
  const [gt, mode] = g.split(':');
  const { p, errs } = await page(b, { db: { Tom: E(), Henk: E(), Piet: E() } });
  await open(p);
  await p.evaluate(([gt, mode, P]) => {
    if (gt === 'afgooien') { afgAssign = mode === 'random' ? 'random' : 'manual'; afgTeams = 0; }
    if (gt === 'halveit') { hiRandomOrder = false; hiSequence = DEFAULT_SEQ.map(function (s) { return Object.assign({}, s); }); }
    state.botPlayerIndex = -1; launchGame(gt, P, false, 'firstto', 1, 1, 501, 0);
  }, [gt, mode, P3]);
  await p.waitForTimeout(700);
  // via de rematch-knop: Zelf kiezen (index 2) en Loting (Math.random → index 1)
  for (const [how, idx] of [['kies', 2], ['loting', 1]]) {
    await p.evaluate(() => { document.querySelectorAll('.ask-ov,#fin-ov').forEach(e => e.remove()); saveRematchConfig(); rematch(); });
    await p.waitForTimeout(200);
    if (how === 'kies') await p.evaluate(i => document.querySelector('#game-sheet .rm-pl[data-i="' + i + '"]').click(), idx);
    else await p.evaluate(i => { const r = Math.random; Math.random = () => (i + 0.5) / 3; _rematchDraw(); Math.random = r; }, idx);
    await p.waitForTimeout(how === 'kies' ? 900 : 4200);
    const r = await p.evaluate(`({who:${who},scr:_curScreen})`);
    if (r.who !== P3[idx]) fails.push(`${g} ${how}: begint ${r.who}, verwacht ${P3[idx]} (${r.scr})`);
    out.push(`${g.padEnd(16)} ${how.padEnd(7)} → ${r.who}`);
  }
  if (errs.length) fails.push(`${g}: pageerror ${errs[0]}`);
  await p.close();
}
// Setup-pad: Random Checkout en 121 met gekozen beginner
for (const gt of ['randomco', 'checkout121']) {
  const { p, errs } = await page(b, { db: { Tom: E(), Henk: E(), Piet: E() } }); await open(p);
  const r = await p.evaluate(([gt, P]) => { state.botPlayerIndex = -1; launchGame(gt, P, false, 'firstto', 1, 1, 501, 1); return state.players[state.currentPlayer]; }, [gt, P3]);
  if (r !== 'Henk') fails.push(`setup ${gt}: begint ${r}`);
  if (errs.length) fails.push(`setup ${gt}: ${errs[0]}`); await p.close();
}
// Random Checkout 'Zelfde checkout' met beginner 2: één checkout per ronde voor iedereen, nieuwe ronde bij de beginner
{ const { p, errs } = await page(b, { db: { Tom: E(), Henk: E(), Piet: E() } }); await open(p);
  const r = await p.evaluate(P => { rcoMode = 'random'; rcoSame = true; rcoDarts = 9; rcoCount = 3; state.botPlayerIndex = -1; launchGame('randomco', P, false, 'firstto', 1, 1, 501, 1);
    const seen = []; for (let k = 0; k < 6; k++) { seen.push([rco.cur, rco.target]); rcoResult(false); } return seen; }, P3);
  const ok = r[0][0] === 1 && r[1][1] === r[0][1] && r[2][1] === r[0][1] && r[3][0] === 1 && r[4][1] === r[3][1] && r[5][1] === r[3][1];
  if (!ok) fails.push('randomco zelfde checkout: ' + JSON.stringify(r));
  if (errs.length) fails.push('randomco same: ' + errs[0]); await p.close(); }
out.forEach(l => console.log(l));
console.log(`\nrematch-start: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
