// Klasse 2–5 met OUDE LOKALE DATA: elk stringveld en elke sleutel krijgt een payload.
import { P, ALL, browser, page, open, clickMarked, hits, summarize } from './lib.mjs';
const N = { h: P.html('Nh'), d: P.attrDq('Nd'), s: P.attrSq('Ns'), j: P.jsQ('Nj'), b: P.jsBs('Nb'), e: P.jsEnt('Ne'), v: P.svg('Nv') };
const NAMES = Object.values(N);
const T0 = Date.parse('2026-11-01T19:00:00Z');
let gi = 0;
const E = (gt, opp, x) => Object.assign({
  gid: 'dT-' + (++gi), ts: T0 + gi * 60000, date: gi % 3 ? '1-11-2026' : ALL('date' + gi), gameType: gt, won: gi % 2 === 0, darts: 20, score: 300,
  opponents: opp, legResult: ALL('legres'), setResult: ALL('setres'), matchFormat: ALL('fmt'), via: ALL('via'), highScore: 100,
  detailedStats: { avg3: 55, avg1: 18, turns: 20, checkoutAttempts: 4, checkoutHits: 2, checkoutPct: 50, highTurn: 100, highFinish: 40, count180: 1, count100: 3 },
  legBreakdown: [{ legNum: 1, winner: opp[0], start: 501, co: 40, dbl: ALL('dbl'), playerStats: Object.fromEntries([['Tom', { avg: 50, darts: 12, high: 100, f9: 55 }], [opp[0], { avg: 60, darts: 11, high: 140 }]]) }],
}, x || {});
const hist = o => [
  E('501', [o]), E('x01', [o], { partners: [N.j] }), E('cricket', [o]), E('halveit', [o], { hiStats: { rounds: 12, hits: 8, misses: 4, pct: 67 }, hiRoundHistory: [{ round: 0, label: ALL('hilabel'), pts: 20, halved: false, newScore: 20 }] }),
  E('randomco', [], { rcoStats: { hits: 3, att: 10, best: 121, brk: { [ALL('brk')]: [2, 3], '41–60': [1, 2] }, mode: ALL('mode'), darts: 9 } }),
  E('bobs27', [o], { bobStats: { hits: 5, att: 12, reached: 4, out: true, stop: true } }), E('shanghai7', [o]), E('atc', [o]), E('afgooien', [o, 'Tom']), E('eliminatie', [o]),
  E(ALL('gt'), [o]), E('trn-501', [o]),
];
const pl = (o, i) => ({ games: 12, wins: 6, totalDarts: 240, totalScore: 3600, nickname: ALL('nick' + i), doubleStats: { [ALL('dsk' + i)]: 3, D20: 2 }, gameHistory: hist(o) });
const db = { Tom: pl(N.h, 0) };
// Getalvelden met tekst: data van buiten kan in elk veld tekst zetten (score, tellers, gemiddelden, dubbels, RCO, Bob, Halve It).
const NUMX = k => P.html(k);
const numEntry = (gt, x) => Object.assign(E(gt, ['Tom']), { darts: NUMX('ndarts'), score: NUMX('nscore'), highScore: NUMX('nhigh'),
  detailedStats: { avg3: NUMX('navg3'), avg1: NUMX('navg1'), turns: NUMX('nturns'), checkoutAttempts: NUMX('ncoa'), checkoutHits: NUMX('ncoh'), checkoutPct: NUMX('ncop'), highTurn: NUMX('nht'), highFinish: NUMX('nhf'), count180: NUMX('n180'), count100: NUMX('n100'), count140: NUMX('n140') },
  legBreakdown: [{ legNum: NUMX('nleg'), winner: 'Tom', start: NUMX('nstart'), co: NUMX('nco'), dbl: 'D20', playerStats: { Tom: { avg: NUMX('nlavg'), darts: NUMX('nldarts'), high: NUMX('nlhigh'), f9: NUMX('nf9'), count180: NUMX('nl180') } } }] }, x || {});
db['NumTest'] = { games: NUMX('ngames'), wins: NUMX('nwins'), totalDarts: NUMX('ntd'), totalScore: NUMX('nts'), doubleStats: { D20: NUMX('ndsv') },
  gameHistory: [numEntry('501'), numEntry('x01'), numEntry('halveit', { hiStats: { rounds: NUMX('nhr'), hits: NUMX('nhh'), misses: NUMX('nhm'), pct: NUMX('nhp'), doubleHits: NUMX('nhdh'), doubleMisses: 1, doublePct: NUMX('nhdp'), trebleHits: NUMX('nhth'), trebleMisses: 1, treblePct: NUMX('nhtp') }, hiRoundHistory: [{ round: 0, label: '20', pts: NUMX('nhrp'), halved: false, newScore: NUMX('nhrn') }] }),
    numEntry('randomco', { rcoStats: { hits: NUMX('nrh'), att: NUMX('nra'), best: NUMX('nrb'), brk: { '41–60': [NUMX('nrb0'), NUMX('nrb1')] }, mode: 'random', darts: NUMX('nrd') } }),
    numEntry('bobs27', { bobStats: { hits: NUMX('nbh'), att: NUMX('nba'), reached: NUMX('nbr'), out: true, stop: true } }), numEntry('checkout121', { co121Stats: { hits: NUMX('nch'), attempts: NUMX('nca'), pct: NUMX('ncp'), avgDarts: NUMX('ncd') } }),
    numEntry('shanghai7'), numEntry('cricket'), numEntry('afgooien'), numEntry('trn-501')] };
NAMES.forEach((n, i) => { db[n] = pl(i % 2 ? 'Tom' : NAMES[(i + 1) % NAMES.length], i + 1); });
const live = { v: 1, ts: Date.now(), screen: 'screen-game', state: { gameType: '501', players: NAMES.slice(0, 4), scores: [1, 2, 3, 4] } };
const ls = { darts_hidden_archive: JSON.stringify({ [P.html('arch')]: { games: 1, wins: 0, gameHistory: [] } }), darts_last_players: JSON.stringify(['Tom']) };
const J = JSON.stringify;
const clickText = (sel, re) => `document.querySelectorAll(${J(sel)}).forEach(function(b){if(${re}.test(b.textContent)&&!b.closest('.ask-ov'))try{b.click()}catch(e){}})`;
const closeAsk = `document.querySelectorAll('.ask-ov').forEach(function(o){o.remove()});`;
const steps = [
  ['home', `showScreen('screen-home')`],
  ...NAMES.concat('Tom', 'NumTest').map((n, i) => ['stats-' + i, `showScreen('screen-stats');statsSelectedPlayer=${J(n)};renderStats();`]),
  ['stats-filters', clickText('#screen-stats button', '/501|Cricket|Bob|Halve|Random|Shanghai|Alles/')],
  ['records', `try{document.getElementById('stats-content').insertAdjacentHTML('beforeend',buildPersonalRecords(${J(NAMES[0])})+buildPersonalRecords('NumTest')+buildDoubleStats('NumTest'))}catch(e){}`],
  ['stats-num-filters', `showScreen('screen-stats');statsSelectedPlayer='NumTest';renderStats();` + "document.querySelectorAll('#screen-stats [data-t]').forEach(function(b){try{b.click()}catch(e){}});"],
  ['doubles', `try{document.getElementById('stats-content').insertAdjacentHTML('beforeend',buildDoubleStats(${J(NAMES[1])}))}catch(e){}`],
  ...NAMES.concat('Tom', 'NumTest').map((n, i) => ['history-' + i, `showScreen('screen-history');historySelectedPlayer=${J(n)};renderHistory();document.querySelectorAll('#screen-history [onclick]').forEach(function(b){if(/toggle|Detail|open/i.test(b.getAttribute('onclick')||''))try{b.click()}catch(e){}});`]),
  ...['avg', 'wins', 'x01', 'co', 'hi', 'bob', 'sh7', 'atc', 'rco', 'afg', 'co121', 'h2h'].map(t => ['lb-' + t, `showScreen('screen-leaderboard');try{showLbTab('${t}')}catch(e){renderLeaderboard('${t}')}`]),
  ['lb-month', `try{setLbPeriod('month');setLbPeriod('all')}catch(e){}`],
  ['players', `showScreen('screen-settings');stOpen('players');`],
  ...NAMES.map((n, i) => ['player-open-' + i, `_spOpen=${J(n)};renderSettingsPlayers();`]),
  ['player-merge', `_spOpen=${J(NAMES[0])};renderSettingsPlayers();${clickText('#st-page-players button, .st-page button, button', '/Samenvoegen/')};`],
  ['player-delete', `closeGameSheet();_spOpen=${J(NAMES[2])};renderSettingsPlayers();${clickText('button', '/^\\s*Verwijderen/')};`],
  ['player-delete-close', closeAsk],
  ['friends', `acctUser={uid:'u1'};acctProfile={username:'tom',player:'Tom'};frFriends={u2:{username:${J(N.j)}},u3:{username:'x'}};_frData={u2:{username:${J(N.j)},player:${J(N.h)},data:${J(pl('Tom', 9))}},u3:{username:'x',player:${J(N.d)},data:null}};_frFriendsLoaded=true;_frLoadedAt=Date.now();stOpen('friends');renderFriendsCard();`],
  ['friend-sheet', `openFriendSheet('u2');`], ['friend-sheet3', `closeGameSheet();openFriendSheet('u3');`],
  ['friends-scope', `closeGameSheet();_statsScope='friends';showScreen('screen-leaderboard');renderLeaderboard('wins');showScreen('screen-stats');renderStats();showScreen('screen-history');renderHistory();_statsScope='local';`],
  ['acct-choose', `showScreen('screen-settings');try{_acctChoosePlayer()}catch(e){}`],
  ['setup', `closeGameSheet();showScreen('screen-setup');selectGame('x01');goToSetupStep(3);setupPlayers=['Tom',${J(N.h)},${J(N.d)},${J(N.j)}];renderSetupPlayers();`],
  ['setup-teams', `try{setX01Teams(true);goToSetupStep(3);renderSetupPlayers();setX01Teams(false);}catch(e){}`],
  ['wheel', `Math.random=function(){return 0};setupPlayers=[${J(N.h)},${J(N.s)},${J(N.v)}];renderSetupPlayers();setStartMode('coin');try{_wheelSpinning=false}catch(e){};flipCoin();`, 6000],
  ['coin', `setupPlayers=[${J(N.h)},${J(N.d)}];renderSetupPlayers();setStartMode('coin');try{_coinFlipping=false}catch(e){};flipCoin();`, 5000],
  ...['501', 'cricket', 'atc', 'shanghai7', 'halveit', 'eliminatie', 'bobs27'].map(g => ['game-' + g, `closeGameSheet();launchGame('${g}',['Tom',${J(N.h)},${J(N.d)},${J(N.j)}],true,'firstto',2,1,501,0);`]),
  ['hi-rounds', `closeGameSheet();launchGame('halveit',[${J(N.h)},${J(N.s)}],true,'firstto',1,1,501,0);hiAddPts(0);hiAddPts(0);hiAddPts(0);${clickText('#game-controls button', '/Rondes|Stats/')};`],
  ['game-501-sheet', `closeGameSheet();launchGame('501',['Tom',${J(N.h)}],true,'firstto',2,1,501,0);try{quickScore(60)}catch(e){};${clickText('#game-controls button', '/Stats/')};`],
  ['game-teams', `closeGameSheet();_pendingTeams=[0,1,0,1];launchGame('501',['Tom',${J(N.h)},${J(N.d)},${J(N.j)}],true,'firstto',1,1,501,0);`],
  ['game-co121', `launchGame('checkout121',[${J(N.h)}],true,'firstto',1,1,501,0);`],
  ['game-rco', `try{launchRandomCheckout(['Tom',${J(N.h)},${J(N.d)}])}catch(e){}`],
  ['game-afg', `afgAssign='random';launchGame('afgooien',['Tom',${J(N.h)},${J(N.d)},${J(N.j)}],true,'firstto',1,1,501,0);`],
  ['game-afg-bull', `closeGameSheet();afgAssign='manual';launchGame('afgooien',['Tom',${J(N.h)},${J(N.s)}],true,'firstto',1,1,501,0);`],
  ['win', `closeGameSheet();state.players=['Tom',${J(N.h)}];showWin(${J(N.h)},'Legs: '+${J(N.d)},'<div></div>');`],
  ['trn', `trnFormat='roundrobin';trnPlayers=['Tom',${J(N.h)},${J(N.d)},${J(N.j)}];showScreen('screen-trn-setup');renderTrnSetup();startTournament();`],
  ['trn-standings', `renderStandings();showScreen('screen-trn-standings');`],
  ['trn-match', `showScreen('screen-trn-overview');renderTrnOverview();var bt=[...document.querySelectorAll('#trn-overview-content button.g-hit')][0];bt&&bt.click();`],
  ['live-offer', `closeGameSheet();localStorage.setItem('darts_live',${J(J(live))});_liveOffer();`],
];
const b = await browser();
const { p, errs } = await page(b, { db, ls });
await open(p);
const all = [];
let clicked = 0;
// Alle originele strings (waarden én sleutels) uit de testdata: een handler moet exact één daarvan doorgeven.
const ORIG = new Set(); (function w(v) { if (typeof v === 'string') ORIG.add(v); else if (v && typeof v === 'object') for (const k in v) { ORIG.add(k); w(v[k]); } })([db, live, NAMES, P.html('arch')]);
for (const [n, code, wait] of steps) {
  await p.evaluate(n => { window.__step = n; }, n);
  try { await p.evaluate(code); } catch (e) { errs.push(n + ': ' + e.message.split('\n')[0]); }
  await p.waitForTimeout(wait || 250);
  const r = await clickMarked(p, [...ORIG]);
  clicked += r.clicked; r.bad.forEach(x => all.push(Object.assign({ step: n }, x)));
  all.push(...await hits(p));
}
const ok = summarize('taint-local (oude lokale data, ' + steps.length + ' stappen, ' + clicked + ' handlers met marker geklikt)', all, errs.filter(e => !/writeText|clipboard/i.test(e)));
await b.close();
process.exit(ok ? 0 : 1);
