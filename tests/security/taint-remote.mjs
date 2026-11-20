// Data van buiten (groep, account-back-up, import, vrienden, inbox):
//  (a) klasse 2–5 bij het tonen = 0, en (b) de data komt BYTE-GELIJK binnen (niets weggehaald, niets overgeslagen).
import { P, ALL, browser, page, open, clickMarked, hits, summarize } from './lib.mjs';
const T0 = Date.parse('2026-11-02T19:00:00Z'); let gi = 0;
const E = (gt, opp, x) => Object.assign({ gid: 'rT-' + (++gi), ts: T0 + gi * 60000, date: ALL('date' + gi), gameType: gt, won: true, darts: 20, score: 300, opponents: opp,
  legResult: ALL('legres'), matchFormat: ALL('fmt'), detailedStats: { avg3: 55, turns: 20, checkoutAttempts: 4, checkoutHits: 2, highTurn: 100, highFinish: 40 },
  legBreakdown: [{ legNum: 1, winner: opp[0] || 'Tom', start: 501, co: 40, dbl: ALL('dbl'), playerStats: { [opp[0] || 'Tom']: { avg: 60, darts: 11, high: 140 } } }] }, x || {});
const player = (tag, opp) => ({ games: 3, wins: 3, totalDarts: 60, totalScore: 900, nickname: ALL('nick' + tag), doubleStats: { [ALL('dsk' + tag)]: 2, D16: 1 },
  gameHistory: [E('501', [opp]), E('halveit', [opp], { hiRoundHistory: [{ round: 0, label: ALL('hil' + tag), pts: 20, halved: false, newScore: 20 }] }), E(ALL('gt' + tag), [opp])] });
const R = { G: [P.html('Gh'), P.attrDq('Gd'), P.jsQ('Gj'), "O'Neil"], B: [P.attrSq('Bs'), P.jsEnt('Be'), 'Tom '], I: [P.jsBs('Ib'), P.svg('Iv'), 'Jan "JJ"'] };
const src = {}; for (const k in R) R[k].forEach((n, i) => { src[n] = player(k + i, i ? R[k][0] : 'Tom'); });
const store = { 'groups/G': JSON.stringify({ hidden: [] }) }; R.G.forEach(n => { store['groups/G/players/' + n] = JSON.stringify(src[n]); });
const friendPlayer = player('F', 'Tom'), friendName = P.jsQ('Fp');
store['users/u2/public/meta'] = JSON.stringify({ chunks: 1, username: ALL('un'), player: friendName, ts: 1 });
store['users/u2/public/c0'] = JSON.stringify({ d: JSON.stringify(friendPlayer) });
const inboxGame = E('501', ['Tom'], { via: 'x' });
const fake = { store, writes: [] };
const b = await browser();
const { p, errs } = await page(b, { fake, db: { Tom: { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] } }, ls: { darts_group_code: 'G', darts_device_id: 'dR' } });
await open(p, 2500);
const J = JSON.stringify;
const res = await p.evaluate(async ([src, R, fp, fn, ig]) => {
  const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  const out = { changed: [], skipped: [] };
  const cmp = (route, n, got, want) => { if (!got) out.skipped.push(route + ': ' + n.slice(0, 30)); else if (canon(got.gameHistory) !== canon(want.gameHistory) || canon(got.doubleStats) !== canon(want.doubleStats) || got.nickname !== want.nickname) out.changed.push(route + ': ' + n.slice(0, 30)); };
  R.G.forEach(n => cmp('groep', n, dbCache[n], src[n]));
  const bk = {}; R.B.forEach(n => { bk[n] = JSON.parse(JSON.stringify(src[n])); });
  try { _acctMerge({ db: bk }); } catch (e) { out.skipped.push('back-up: fout ' + e.message); }
  R.B.forEach(n => cmp('back-up', n, dbCache[n], src[n]));
  const data = {}; R.I.forEach(n => { data[n] = src[n]; });
  const code = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data }))));
  try { document.getElementById('import-code').value = code; importStats(); } catch (e) { out.skipped.push('import: fout ' + e.message); }
  R.I.forEach(n => cmp('import', n, dbCache[n], src[n]));
  acctUser = { uid: 'u1' }; acctProfile = { username: 'tom', player: 'Tom' };
  try { _inboxApply([{ id: 'i1', data: { from: 'u2', fromName: 'Vriend', as: 'Tom', games: [ig], ds: {} } }]); } catch (e) { out.skipped.push('inbox: fout ' + e.message); }
  const got = (dbCache.Tom.gameHistory || []).find(e => e.gid === ig.gid);
  if (!got) out.skipped.push('inbox: potje'); else if (got.legResult !== ig.legResult || got.matchFormat !== ig.matchFormat || got.date !== ig.date || got.gameType !== ig.gameType || canon(got.legBreakdown) !== canon(ig.legBreakdown)) out.changed.push('inbox: potje');
  frFriends = { u2: { username: 'x' } };
  try { await _frLoadAll(true); } catch (e) { out.skipped.push('vrienden: fout ' + e.message); }
  const fd = _frData.u2;
  if (!fd || !fd.data) out.skipped.push('vrienden: data'); else { if (canon(fd.data.gameHistory) !== canon(fp.gameHistory)) out.changed.push('vrienden: potjes'); if (fd.player !== fn) out.changed.push('vrienden: spelernaam ' + (fd.player === '' ? 'weggelaten' : 'anders')); }
  return out;
}, [src, R, friendPlayer, friendName, inboxGame]);
console.log('Data-integriteit (moet leeg zijn):');
console.log('  overgeslagen:', res.skipped.length ? res.skipped : 'geen');
console.log('  gewijzigd:   ', res.changed.length ? res.changed : 'geen');
// Tonen
const names = Object.keys(src).concat('Tom');
const steps = [
  ...names.map((n, i) => ['stats-' + i, `showScreen('screen-stats');statsSelectedPlayer=${J(n)};renderStats();try{document.getElementById('stats-content').insertAdjacentHTML('beforeend',buildDoubleStats(${J(n)}))}catch(e){}`]),
  ...names.map((n, i) => ['hist-' + i, `showScreen('screen-history');historySelectedPlayer=${J(n)};renderHistory();document.querySelectorAll('#screen-history [onclick]').forEach(function(b){if(/toggle/i.test(b.getAttribute('onclick')||''))try{b.click()}catch(e){}});`]),
  ...['wins', 'avg', 'hi', 'h2h'].map(t => ['lb-' + t, `showScreen('screen-leaderboard');renderLeaderboard('${t}')`]),
  ['players', `showScreen('screen-settings');stOpen('players');` + names.map(n => `_spOpen=${J(n)};renderSettingsPlayers();`).join('')],
  ['friends', `stOpen('friends');try{renderFriendsCard();openFriendSheet('u2')}catch(e){}`],
  ['friends-scope', `closeGameSheet();_statsScope='friends';showScreen('screen-leaderboard');renderLeaderboard('wins');showScreen('screen-stats');renderStats();showScreen('screen-history');renderHistory();_statsScope='local';`],
];
const all = [];
const ORIG = new Set(); (function w(v) { if (typeof v === 'string') ORIG.add(v); else if (v && typeof v === 'object') for (const k in v) { ORIG.add(k); w(v[k]); } })([src, friendPlayer, friendName, inboxGame]);
for (const [n, code] of steps) {
  await p.evaluate(n => { window.__step = n; }, n);
  try { await p.evaluate(code); } catch (e) { errs.push(n + ': ' + e.message.split('\n')[0]); }
  await p.waitForTimeout(200);
  const r = await clickMarked(p, [...ORIG]); r.bad.forEach(x => all.push(Object.assign({ step: n }, x)));
  all.push(...await hits(p));
}
const okShow = summarize('taint-remote (tonen)', all, errs.filter(e => !/writeText|clipboard/i.test(e)));
const okData = !res.skipped.length && !res.changed.length;
console.log(`taint-remote (data): ${okData ? 'GESLAAGD' : 'GEZAKT'}`);
await b.close();
process.exit(okShow && okData ? 0 : 1);
