// v247 — draaien: node tests/security/finish-gate.mjs (zie README).
// v247: "Potje afronden?" per spel: vraag verschijnt, niets opgeslagen; Ongedaan = stand vóór laatste invoer; Afronden = 1× opslaan; herstart midden in de vraag.
import { browser, page, open } from './lib.mjs';
const K = Number(process.env.FAST) > 1 ? 0.25 : 1; // FAST=10 (npm test): app-timers 10× sneller, dus korter wachten
const P2 = ['Tom', 'Henk'];
const cases = {
  atc: { launch: `launchGame('atc',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.atcTarget[state.currentPlayer]=atcMaxTarget();renderATC();`, last: `atcHitMult(1);`, screen: 'screen-atc' },
  cricket: { launch: `launchGame('cricket',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.crMarks[0]=[3,3,3,3,3,3,2];state.crScores=[10,0];state.currentPlayer=0;state.crMult=1;renderCricket();`, last: `cricketHit(6);`, screen: 'screen-cricket' },
  shanghai: { launch: `launchGame('shanghai7',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.shTarget=state.shMaxTarget;state.shRound=state.shMaxTarget;state.currentPlayer=1;state.shScores=[30,20];renderShanghai();`, last: `shEndTurn();`, screen: 'screen-shanghai' },
  bob: { launch: `launchGame('bobs27',${JSON.stringify(['Tom'])},true,'firstto',1,1,501,0);`, toEnd: `state.bobRound[0]=20;state.bobScores[0]=200;renderBob();`, last: `bobThrow(1);`, screen: 'screen-bobs27' },
  halveit: { launch: `hiRandomOrder=false;hiSequence=DEFAULT_SEQ.map(function(s){return Object.assign({},s);});launchGame('halveit',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.hiRound=state.hiSeq.length-1;state.currentPlayer=1;state.hiScores=[100,80];renderHalveIt();`, last: `hiAddPts(0);hiAddPts(0);hiAddPts(0);`, screen: 'screen-halveit' },
  shanghaiDirect: { launch: `launchGame('shanghai7',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.shTarget=3;state.shRound=3;state.currentPlayer=0;renderShanghai();shScore(1);shScore(2);`, last: `shScore(3);`, screen: 'screen-shanghai', want: 2 },
  randomco: { launch: `rcoCount=1;rcoMode='default';launchRandomCheckout(${JSON.stringify(P2)});`, toEnd: `rcoResult(true);`, last: `rcoResult(false);`, screen: 'screen-randomco', want: 2 },
  afgooien: { launch: `afgAssign='random';afgLives=3;afgTeams=0;launchGame('afgooien',${JSON.stringify(['Tom','Henk','Piet'])},true,'firstto',1,1,501,0);`, toEnd: `_afg.players[2].eliminated=true;_afg.players.forEach(function(q){q.score=_afg.target;q.killer=true;});_afg.players[1].score=1;_afg.currentIdx=0;_afg.dartsLeft=3;renderAfgooien();`, last: `afgAttack('Henk',1);`, screen: 'screen-afgooien', want: 3 },
  eliminatie: { launch: `eliDoubleOut=false;eliTarget=301;launchGame('eliminatie',${JSON.stringify(P2)},true,'firstto',1,1,501,0);`, toEnd: `state.eliScores[state.currentPlayer]=state.eliTarget-20;renderEliminatie();`, last: `eliNumQuick(20);eliSubmit();`, screen: 'screen-eliminatie' },
  x01: { launch: `launchGame('501',${JSON.stringify(P2)},false,'firstto',1,1,501,0);`, toEnd: `state.scores[state.currentPlayer]=40;renderGame();`, last: `document.getElementById('score-input').value='40';submitScore();`, screen: 'screen-game' },
  x01Legs: { launch: `launchGame('501',${JSON.stringify(P2)},false,'bestof',3,1,501,0);`, toEnd: `state.legWins=[1,1];state.scores[state.currentPlayer]=40;renderGame();`, last: `document.getElementById('score-input').value='40';submitScore();`, screen: 'screen-game' },
  x01Sets: { launch: `launchGame('501',${JSON.stringify(P2)},false,'firstto',2,2,501,0);`, toEnd: `state.setWins=[1,1];state.legsInSet=[1,1];state.scores[state.currentPlayer]=40;renderGame();`, last: `document.getElementById('score-input').value='40';submitScore();`, screen: 'screen-game' },
  x01Teams: { launch: `_pendingTeams=[0,1,0,1];launchGame('501',['Tom','Piet','Henk','Kees'],false,'firstto',1,1,501,0);`, toEnd: `state.scores=state.scores.map(function(){return 40;});renderGame();`, last: `document.getElementById('score-input').value='40';submitScore();`, screen: 'screen-game', want: 4 },
  trn: { launch: `trnPlayers=${JSON.stringify(P2)};trnFormat='roundrobin';trnBO=3;trnDoubleOut=false;trnGame=501;startTournament();var m=null;(function w(o){if(m||!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(w);return;}if(o.p1&&o.p2&&!o.done&&o.w1!=null){m=o;return;}Object.keys(o).forEach(function(k){if(k!=='currentMatch')w(o[k]);});})(trn);m.w1=1;m.w2=1;launchTrnMatchWithStart(m,function(wn){trnRecordLegWin(m,wn);renderTrnOverview();showScreen('screen-trn-overview');},0);`, toEnd: `state.scores[state.currentPlayer]=40;renderGame();`, last: `document.getElementById('score-input').value='40';submitScore();`, screen: 'screen-game', endScreen: 'screen-trn-overview' },
};
const b = await browser(); const fails = []; const log = [];
for (const [g, c] of Object.entries(cases)) {
  const { p, errs } = await page(b, { db: { Tom: { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] }, Henk: { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] } } });
  await open(p, Math.round(1200 * K));
  const cnt = () => p.evaluate(() => ['Tom','Henk','Piet','Kees'].reduce(function(s,n){return s+((dbCache[n]&&dbCache[n].gameHistory)||[]).length;},0));
  await p.evaluate(c.launch); await p.waitForTimeout(Math.round((200)*K));
  await p.evaluate(c.toEnd); await p.waitForTimeout(Math.round((150)*K));
  const before = await p.evaluate(() => JSON.stringify(state));
  await p.evaluate(c.last); await p.waitForTimeout(Math.round((250)*K));
  const r1 = await p.evaluate(() => ({ ov: !!document.getElementById('fin-ov'), pend: state._finishPending, scr: _curScreen, rows: (document.querySelector('#fin-ov .fin-rows') || {}).innerText || '' }));
  if (!r1.ov) { fails.push(g + ': geen vraag na laatste invoer (scherm ' + r1.scr + ', ' + JSON.stringify(r1) + ')'); await p.close(); continue; }
  if (await cnt() !== 0) fails.push(g + ': al opgeslagen vóór Afronden');
  // Ongedaan
  await p.evaluate(() => document.getElementById('fin-undo').click()); await p.waitForTimeout(Math.round((400)*K));
  const after = await p.evaluate(() => JSON.stringify(state));
  const r2 = await p.evaluate(() => ({ ov: !!document.getElementById('fin-ov'), scr: _curScreen }));
  if (r2.ov) fails.push(g + ': vraag blijft na Ongedaan');
  if (r2.scr !== c.screen) fails.push(g + ': na Ongedaan scherm ' + r2.scr);
  if (after !== before) fails.push(g + ': stand na Ongedaan ≠ stand vóór laatste invoer');
  if (await cnt() !== 0) fails.push(g + ': opgeslagen na Ongedaan');
  // opnieuw naar het einde, herstart midden in de vraag
  await p.evaluate(c.last); await p.waitForTimeout(Math.round((300)*K));
  await p.reload(); await p.waitForTimeout(Math.round((1300)*K));
  const offer = await p.evaluate(() => document.body.innerText.includes('Potje hervatten?'));
  if (!offer) fails.push(g + ': na herstart geen "Potje hervatten?"');
  await p.evaluate(() => { closeGameSheet(); _liveResumeStored(); }); await p.waitForTimeout(Math.round((500)*K));
  const r3 = await p.evaluate(() => ({ ov: !!document.getElementById('fin-ov'), pend: state._finishPending }));
  if (!r3.ov) fails.push(g + ': na hervatten geen vraag');
  // Ongedaan na herstart moet ook terug naar de stand vóór de laatste invoer
  if (r3.ov) { await p.evaluate(() => document.getElementById('fin-undo').click()); await p.waitForTimeout(Math.round((400)*K)); const a2 = await p.evaluate(() => JSON.stringify(state)); if (a2 !== before) fails.push(g + ': Ongedaan na herstart ≠ stand vóór laatste invoer'); await p.evaluate(c.last); await p.waitForTimeout(Math.round((300)*K)); }
  // Afronden
  await p.evaluate(() => document.getElementById('fin-ok').click()); await p.waitForTimeout(Math.round((600)*K));
  const r4 = await p.evaluate(() => ({ scr: _curScreen, live: localStorage.getItem('darts_live') }));
  const n = await cnt(), want = c.want != null ? c.want : (g === 'bob' ? 1 : 2);
  if (r4.scr !== (c.endScreen || 'screen-win')) fails.push(g + ': geen winscherm na Afronden (' + r4.scr + ')');
  if (n !== want) fails.push(g + `: ${n} potjes opgeslagen, verwacht ${want}`);
  if (r4.live) fails.push(g + ': darts_live niet gewist');
  log.push(`${g}: vraag=${r1.ov} rijen="${r1.rows.replace(/\n/g, ' ').slice(0, 50)}" opgeslagen=${n}`);
  if (errs.length) fails.push(g + ': pageerrors ' + errs.slice(0, 2).join(' | '));
  await p.close();
}
log.forEach(l => console.log(l));
console.log(`\ngate: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
