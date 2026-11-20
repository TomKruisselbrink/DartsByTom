// Namen met speciale tekens: komen via groep, import en back-up EXACT binnen (B1/B2, F3/F4),
// en nieuw typen volgt het invoerbeleid. Namen die Firestore als documentnaam niet kan, worden gemeld, niet aangepast.
import { browser, page, open } from './lib.mjs';
const NAMES = ["O'Neil", "D'Angelo", 'José', 'Ölaf-Ä 💥', 'Jorn & co', 'Tom ', ' Tom', 'Jan "JJ"', 'L' + 'x'.repeat(60), 'Mo<3>', 'A/B', '.', '__x__'];
const FS_OK = n => !/\//.test(n) && n !== '.' && n !== '..' && !/^__.*__$/.test(n);
const pl = (n, i) => ({ games: 1, wins: 0, totalDarts: 20, totalScore: 300, gameHistory: [{ gid: 'nc-' + i, ts: 1763000000000 + i, date: '1-11-2026', gameType: '501', won: false, darts: 20, score: 300, opponents: ['Tom'] }] });
const store = { 'groups/G': JSON.stringify({ hidden: [] }) };
NAMES.forEach((n, i) => { if (FS_OK(n)) store['groups/G/players/' + n] = JSON.stringify(pl(n, i)); });
const b = await browser(); let fails = [];
// 1) groep
{ const { p } = await page(b, { fake: { store, writes: [] }, ls: { darts_group_code: 'G' } }); await open(p, 2500);
  const got = await p.evaluate(() => Object.keys(dbCache));
  NAMES.filter(FS_OK).forEach(n => { if (!got.includes(n)) fails.push('groep mist ' + JSON.stringify(n)); }); await p.close(); }
// 2) import en 3) back-up (op een lege telefoon)
{ const { p } = await page(b, {}); await open(p);
  const r = await p.evaluate(([NAMES, pls]) => {
    const out = {};
    const data = {}; NAMES.forEach((n, i) => { data[n] = pls[i]; });
    document.getElementById('import-code').value = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data }))));
    importStats(); out.imp = Object.keys(dbCache); out.impMsg = (document.getElementById('import-result') || {}).textContent || '';
    for (const k in dbCache) delete dbCache[k];
    const bk = {}; NAMES.forEach((n, i) => { bk[n] = JSON.parse(JSON.stringify(pls[i])); }); _acctMerge({ db: bk }); out.acc = Object.keys(dbCache);
    return out;
  }, [NAMES, NAMES.map(pl)]);
  NAMES.forEach(n => { if (!r.imp.includes(n)) fails.push('import mist ' + JSON.stringify(n)); if (!r.acc.includes(n)) fails.push('back-up mist ' + JSON.stringify(n)); });
  await p.close(); }
// 4) nieuw typen (B1/B2)
{ const { p } = await page(b, { db: { ['L' + 'x'.repeat(60)]: pl('L', 99) } }); await open(p);
  const cases = { "O'Neil": true, 'Mo<3>': true, 'Jan "JJ"': true, 'Jorn & co': true, ['x'.repeat(24)]: true, ['x'.repeat(25)]: false, 'A/B': false, '__x__': false, ['L' + 'x'.repeat(60)]: true };
  for (const [n, want] of Object.entries(cases)) {
    const r = await p.evaluate(n => { showScreen('screen-setup'); selectGame('x01'); goToSetupStep(3); setupPlayers = []; document.getElementById('player-name-input').value = n; addPlayer(); return { added: setupPlayers.includes(n), err: document.getElementById('player-error').textContent }; }, n);
    if (r.added !== want) fails.push(`typen ${JSON.stringify(n.length > 30 ? n.slice(0, 8) + '…(' + n.length + ')' : n)}: ${want ? 'geweigerd' : 'toegestaan'}${r.err ? ' (' + r.err + ')' : ''}`);
    if (!want && !r.err) fails.push(`typen ${JSON.stringify(n.slice(0, 10))}: geen melding`);
  }
  await p.close(); }
console.log(`names-compat: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
