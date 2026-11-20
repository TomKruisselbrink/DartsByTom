import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = []; const ok = (c, m) => { if (!c) fails.push(m); };
const { p, errs } = await page(b, { db: { Tom: { games: 5, wins: 2, totalDarts: 100, totalScore: 900, gameHistory: [] }, Henk: { games: 5, wins: 3, totalDarts: 100, totalScore: 900, gameHistory: [] } }, ls: { darts_device_id: 'dA' } });
await open(p);
// Speel een volledig Halve It-potje: Tom raakt alles behalve de laatste ronde (Bull), Henk raakt elke ronde 20
await p.evaluate(() => {
  hiRandomOrder=false;hiSequence=DEFAULT_SEQ.map(function(s){return Object.assign({},s);});launchGame('halveit', ['Tom', 'Henk'], true, 'firstto', 1, 1, 501, 0);
  for (let r = 0; r < state.hiSeq.length; r++) {
    for (let pl = 0; pl < 2; pl++) {
      if (pl === 0 && r === state.hiSeq.length - 1) { state.hiTurnPts = 0; hiEndTurn(false); }
      else { state.hiTurnPts = pl === 0 ? 30 : 20; hiEndTurn(true); }
    }
  }
});
await p.waitForTimeout(300);
await p.evaluate(() => document.getElementById('fin-ok').click()); await p.waitForTimeout(500);
const before = await p.evaluate(() => JSON.parse(JSON.stringify(dbCache)));
const tE = before.Tom.gameHistory[0], hE = before.Henk.gameHistory[0];
console.log('voor: Tom', tE.score, tE.won ? 'wint' : 'verliest', '| Henk', hE.score, hE.won ? 'wint' : 'verliest', '| tellers Tom wins', before.Tom.wins, 'Henk wins', before.Henk.wins);
// Via de UI: Geschiedenis → Tom → potje open → Rondes corrigeren → laatste ronde 50
await p.evaluate(() => { showScreen('screen-history'); historySelectedPlayer = 'Tom'; renderHistory(); document.querySelectorAll('#screen-history [onclick*="toggleHistoryDetail"]').forEach(b => b.click()); });
await p.waitForTimeout(200);
const hasBtn = await p.evaluate(() => [...document.querySelectorAll('button')].some(b => /Rondes corrigeren/.test(b.textContent)));
ok(hasBtn, 'knop Rondes corrigeren niet zichtbaar');
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Rondes corrigeren/.test(b.textContent)).click());
await p.waitForTimeout(200);
const inputs = await p.evaluate(() => document.querySelectorAll('.hic-in').length);
ok(inputs === 12, 'aantal invoervelden ' + inputs);
await p.evaluate(() => { const ins = document.querySelectorAll('.hic-in'); const last = ins[ins.length - 1]; last.value = '50'; last.dispatchEvent(new Event('input')); });
await p.waitForTimeout(100);
const preview = await p.evaluate(() => document.getElementById('hic-sum').innerText);
console.log('voorbeeld:', preview.replace(/\n/g, ' | '));
await p.evaluate(() => [...document.querySelectorAll('#game-sheet button, button')].find(b => /^Opslaan$/.test(b.textContent.trim()) && b.closest('#game-sheet,.x01-sheet-panel')).click());
await p.waitForTimeout(200);
const askTxt = await p.evaluate(() => (document.querySelector('.ask-box') || {}).innerText || '');
console.log('bevestiging:', askTxt.replace(/\n/g, ' | ').slice(0, 220));
await p.evaluate(() => document.querySelector('.ask-yes').click()); await p.waitForTimeout(400);
const after = await p.evaluate(() => JSON.parse(JSON.stringify(dbCache)));
const t2 = after.Tom.gameHistory[0], h2 = after.Henk.gameHistory[0];
console.log('na:  Tom', t2.score, t2.won ? 'wint' : 'verliest', '| Henk', h2.score, h2.won ? 'wint' : 'verliest', '| tellers Tom wins', after.Tom.wins, 'Henk wins', after.Henk.wins);
const exp = tE.hiRoundHistory[tE.hiRoundHistory.length - 2].newScore + 50;
ok(t2.score === exp, `score ${t2.score} ≠ verwacht ${exp}`);
ok(t2.gid !== tE.gid && t2.corrected && t2.corrected.from === tE.gid, 'geen nieuwe gid/corrected-marker');
ok(t2.ts === tE.ts && t2.date === tE.date, 'ts/date van het potje niet behouden in de kopie');
ok((after.Tom.deleted || []).includes('g:' + tE.gid), 'geen tombstone voor het oude potje');
ok(after.Tom.gameHistory.length === before.Tom.gameHistory.length, 'aantal potjes Tom veranderd');
ok(after.Tom.games === before.Tom.games, 'teller games veranderd');
ok(t2.hiStats.hits === 12 && t2.hiStats.misses === 0, 'hiStats niet herberekend: ' + JSON.stringify(t2.hiStats));
if (exp > hE.score) { ok(t2.won && !h2.won, 'winnaar niet omgedraaid'); ok(after.Tom.wins === before.Tom.wins + 1 && after.Henk.wins === before.Henk.wins - 1, 'wins-tellers niet bijgewerkt'); ok(h2.corrected && (after.Henk.deleted || []).includes('g:' + hE.gid), 'Henk-potje niet vervangen'); }
const bk = await p.evaluate(() => JSON.parse(localStorage.getItem('darts_correct_backup') || '{}'));
ok(Object.keys(bk).length >= 1 && Object.values(bk).some(x => x.old && x.old.gid === tE.gid), 'vangnet darts_correct_backup ontbreekt');
// Sync naar toestel B (account): B heeft nog de oude stand → na merge: oud weg, nieuw erin, geen dubbel
const { p: q } = await page(b, { db: before, ls: { darts_device_id: 'dB' } }); await open(q);
const bRes = await q.evaluate(a => { _acctMerge({ db: a }); return JSON.parse(JSON.stringify(dbCache)); }, after);
ok(bRes.Tom.gameHistory.length === 1 && bRes.Tom.gameHistory[0].gid === t2.gid, 'toestel B: Tom niet vervangen (' + bRes.Tom.gameHistory.map(e => e.gid).join(',') + ')');
ok(bRes.Henk.gameHistory.length === 1 && bRes.Henk.gameHistory[0].won === h2.won, 'toestel B: Henk niet juist');
// Vriendensync: origineel al verstuurd → correctie NIET opnieuw versturen
const fr = await p.evaluate(gid => {
  acctUser = { uid: 'u1' }; acctProfile = { username: 'tom', player: 'Tom' }; frFriends = { u2: { username: 'henk' } }; _frFriendsLoaded = true;
  localStorage.setItem('darts_friend_links', JSON.stringify({ Tom: { uid: 'u2', username: 'henk' } }));
  localStorage.setItem('darts_friend_shadow', JSON.stringify({ Tom: { k: ['g:' + gid], ds: {} } }));
  localStorage.setItem('darts_outbox', '[]'); try { _frSync(); } catch (e) { return 'fout ' + e.message; }
  return JSON.parse(localStorage.getItem('darts_outbox') || '[]').length;
}, tE.gid);
ok(fr === 0, 'vriendensync stuurt de correctie als extra potje (' + fr + ')');
ok(!errs.length, 'pageerrors ' + errs.join(' | '));
console.log(`\nhi-correct: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
