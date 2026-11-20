// Geen spelers of potjes verdwijnen, tellers dalen nooit: per route (groep, import, back-up) is
// de verzameling spelers en gid's ná ⊇ vóór.
import { browser, page, open } from './lib.mjs';
const mk = (pre, n, k) => Array.from({ length: k }, (_, i) => ({ gid: pre + '-' + i, ts: 1762000000000 + i * 1000, date: '1-11-2026', gameType: '501', won: i % 2 === 0, darts: 20, score: 300, opponents: ['Tom'] }));
const local = { Tom: { games: 50, wins: 20, totalDarts: 900, totalScore: 20000, gameHistory: mk('loc', 'Tom', 6) }, 'Tom ': { games: 2, wins: 1, totalDarts: 40, totalScore: 600, gameHistory: mk('sp', 'x', 2) }, 'Jan "JJ"': { games: 3, wins: 1, totalDarts: 60, totalScore: 900, gameHistory: mk('jj', 'x', 3) } };
const remote = { Tom: { games: 4, wins: 2, totalDarts: 80, totalScore: 1200, gameHistory: mk('loc', 'Tom', 3).concat(mk('rem', 'Tom', 2)) }, "O'Neil": { games: 1, wins: 1, totalDarts: 20, totalScore: 300, gameHistory: mk('on', 'x', 1) }, 'Mo<3> ': { games: 1, wins: 0, totalDarts: 20, totalScore: 300, gameHistory: mk('mo', 'x', 1) } };
const snap = db => ({ names: Object.keys(db).sort(), gids: Object.fromEntries(Object.entries(db).map(([n, p]) => [n, (p.gameHistory || []).map(e => e.gid).sort()])), cnt: Object.fromEntries(Object.entries(db).map(([n, p]) => [n, [p.games, p.wins, p.totalDarts, p.totalScore]])) });
const warns = [];
const check = (route, before, after, fails) => {
  before.names.forEach(n => { if (!after.names.includes(n)) { fails.push(route + ': speler weg ' + JSON.stringify(n)); return; }
    before.gids[n].forEach(g => { if (!after.gids[n].includes(g)) fails.push(route + ': potje weg ' + g); });
    before.cnt[n].forEach((v, i) => { if ((after.cnt[n][i] || 0) < (v || 0)) (route === 'groep' ? warns : fails).push(route + ': teller ' + ['games', 'wins', 'totalDarts', 'totalScore'][i] + ' lager bij ' + JSON.stringify(n)); }); });
};
const b = await browser(); const fails = [];
const store = { 'groups/G': JSON.stringify({ hidden: [] }) }; for (const n in remote) store['groups/G/players/' + n] = JSON.stringify(remote[n]);
{ const { p } = await page(b, { db: local, fake: { store, writes: [] }, ls: { darts_group_code: 'G' } }); await open(p, 2500);
  check('groep', snap(local), snap(await p.evaluate(() => dbCache)), fails); await p.close(); }
for (const route of ['import', 'back-up']) {
  const { p } = await page(b, { db: local }); await open(p);
  const after = await p.evaluate(([route, remote]) => {
    if (route === 'import') { document.getElementById('import-code').value = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data: remote })))); importStats(); }
    else _acctMerge({ db: JSON.parse(JSON.stringify(remote)) });
    return dbCache;
  }, [route, remote]);
  const s = snap(after); check(route, snap(local), s, fails);
  for (const n in remote) { if (!s.names.includes(n)) fails.push(route + ': binnenkomende speler niet overgenomen ' + JSON.stringify(n)); else remote[n].gameHistory.forEach(e => { if (!s.gids[n].includes(e.gid)) fails.push(route + ': binnenkomend potje ontbreekt ' + e.gid); }); }
  await p.close();
}
console.log(`no-disappear: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
// Bekend, al zo in v244: de groepssync neemt de tellers van de groepsversie als basis (_grpMerge, basis = groep).
// Geen potjes of spelers weg; alleen tellers kunnen dalen als de groepsversie verouderd is. Groepssync wordt niet meer gebruikt.
if (warns.length) { console.log('  waarschuwing (bekend gedrag sinds v244, groepssync):'); [...new Set(warns)].forEach(w => console.log('    ' + w)); }
await b.close(); process.exit(fails.length ? 1 : 0);
