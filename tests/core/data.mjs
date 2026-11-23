// Fase 2 — data: samenvoegen (_grpMerge), account-sync tussen twee apparaten (_acctMerge), spelers samenvoegen, verwijderen
// (alleen na bevestiging), potje verwijderen, export/import, hervatten na herladen. Nooit tegen echte data.
// Draaien: node tests/core/data.mjs (zie tests/README.md).
import { browser, page, open, suite, eq, ok, E, wait } from './h.mjs';
const b = await browser(); const S = suite('data');
const T0 = 1763000000000;
const G = (gid, won, extra = {}) => Object.assign({ gid, ts: T0 + Number(gid.replace(/\D/g, '') || 0) * 1000, date: '13-11-2026', gameType: 'cricket', won, darts: 10, score: 50, opponents: ['Henk'] }, extra);
const P = (games, extra = {}) => Object.assign({ games: games.length, wins: games.filter(g => g.won).length, totalDarts: 10 * games.length, totalScore: 50 * games.length, gameHistory: games }, extra);
async function fresh(db, ls) { const { p, errs } = await page(b, { db, ls, fast: 10, seedOnce: true }); await open(p, 600); return { p, errs, done: async () => { if (errs.length) throw new Error('pageerror: ' + errs[0]); await p.close(); } }; }
const yes = p => p.evaluate(() => { const x = [...document.querySelectorAll('.ask-ov button')].pop(); x.click(); });

await S.t('_grpMerge: potjes van beide kanten samen, tellers alleen omhoog', async () => {
  const f = await fresh({ Tom: P([G('a1', true)]) });
  const r = await f.p.evaluate(([l, rm]) => _grpMerge(l, rm).p, [P([G('a1', true), G('a2', false)]), P([G('a1', true), G('a3', true)], { games: 9, wins: 5 })]);
  eq(r.gameHistory.map(e => e.gid).sort(), ['a1', 'a2', 'a3'], 'gids'); eq([r.games, r.wins], [10, 5], 'tellers (9+1, wins 5)'); await f.done();
});
await S.t('_grpMerge: tombstone haalt potje weg, tellers −1 (niet terug naar lengte historie)', async () => {
  const f = await fresh({ Tom: E() });
  const r = await f.p.evaluate(([l, rm]) => _grpMerge(l, rm).p, [P([G('a1', true)], { deleted: ['g:a2'] }), P([G('a1', true), G('a2', true)], { games: 20, wins: 12 })]);
  eq(r.gameHistory.map(e => e.gid), ['a1'], 'a2 weg'); eq([r.games, r.wins], [19, 11], 'tellers'); ok(r.deleted.includes('g:a2'), 'tombstone blijft'); await f.done();
});
await S.t('_grpMerge: twee keer samenvoegen voegt niets dubbel toe', async () => {
  const f = await fresh({ Tom: E() });
  const r = await f.p.evaluate(([l, rm]) => { const a = _grpMerge(l, rm).p; const b2 = _grpMerge(l, a); return { n: b2.p.gameHistory.length, push: b2.push, g: b2.p.games }; }, [P([G('a1', true), G('a2', false)]), P([G('a1', true)])]);
  eq([r.n, r.push, r.g], [2, false, 2], 'idempotent'); await f.done();
});
await S.t('account-sync: potje van ander apparaat komt erbij, eigen potjes blijven', async () => {
  const f = await fresh({ Tom: P([G('a1', true)]) });
  await f.p.evaluate(bk => _acctMerge(bk), { db: { Tom: P([G('a1', true), G('b5', false)]), Piet: P([G('b6', true)]) } }); await wait(100);
  const r = await f.p.evaluate(() => ({ t: dbCache.Tom.gameHistory.map(e => e.gid).sort(), g: dbCache.Tom.games, piet: !!dbCache.Piet, ls: JSON.parse(localStorage.getItem('darts_db')).Tom.gameHistory.length }));
  eq(r.t, ['a1', 'b5'], 'Tom'); eq(r.g, 2, 'tellers'); ok(r.piet, 'nieuwe speler Piet'); eq(r.ls, 2, 'opgeslagen'); await f.done();
});
await S.t('account-sync: oude back-up laat lokale tellers niet dalen', async () => {
  const f = await fresh({ Tom: P([G('a1', true), G('a2', true)], { games: 30, wins: 20 }) });
  await f.p.evaluate(bk => _acctMerge(bk), { db: { Tom: P([G('a1', true)], { games: 3, wins: 1 }) } }); await wait(100);
  eq(await f.p.evaluate(() => [dbCache.Tom.games, dbCache.Tom.wins, dbCache.Tom.gameHistory.length]), [30, 20, 2], 'ongewijzigd'); await f.done();
});
await S.t('account-sync: verwijderd op ander apparaat (tombstone) verdwijnt hier ook', async () => {
  const f = await fresh({ Tom: P([G('a1', true), G('a2', false)]) });
  await f.p.evaluate(bk => _acctMerge(bk), { db: { Tom: P([G('a1', true)], { deleted: ['g:a2'] }) } }); await wait(100);
  eq(await f.p.evaluate(() => dbCache.Tom.gameHistory.map(e => e.gid)), ['a1'], 'a2 weg'); await f.done();
});
await S.t('account-sync: hier gewiste speler komt niet terug met oude potjes', async () => {
  const f = await fresh({ Tom: E() }, { darts_acct_removed: JSON.stringify({ Piet: T0 + 10000 }) });
  await f.p.evaluate(bk => _acctMerge(bk), { db: { Piet: P([G('a1', true), G('a2', true)]) } }); await wait(100);
  eq(await f.p.evaluate(() => dbCache.Piet ? dbCache.Piet.gameHistory.length : 0), 0, 'oude potjes niet terug');
  await f.p.evaluate(bk => _acctMerge(bk), { db: { Piet: P([G('a99', true)]) } }); await wait(100);
  eq(await f.p.evaluate(() => dbCache.Piet ? dbCache.Piet.gameHistory.map(e => e.gid) : []), ['a99'], 'nieuw potje wel'); await f.done();
});
await S.t('spelers samenvoegen: potjes, tellers, namen bij anderen, vangnet', async () => {
  const f = await fresh({ Tom: P([G('a1', true)]), tom2: P([G('a2', false, { opponents: ['Henk'] })], { doubleStats: { D20: 2 } }), Henk: P([G('a3', true, { opponents: ['tom2'] })]) });
  await f.p.evaluate(() => mergePlayers('tom2', 'Tom')); await wait(100);
  const r = await f.p.evaluate(() => ({ db: Object.keys(dbCache).sort(), t: dbCache.Tom.gameHistory.length, g: dbCache.Tom.games, ds: dbCache.Tom.doubleStats, opp: dbCache.Henk.gameHistory[0].opponents, bk: Object.keys(JSON.parse(localStorage.getItem('darts_merge_backup') || '{}')).length }));
  eq(r.db, ['Henk', 'Tom'], 'tom2 weg'); eq([r.t, r.g], [2, 2], 'Tom 2 potjes'); eq(r.ds, { D20: 2 }, 'dubbels mee'); eq(r.opp, ['Tom'], 'naam bij Henk omgezet'); eq(r.bk, 1, 'vangnet'); await f.done();
});
await S.t('speler verwijderen: pas na bevestiging, en blijft weg na herladen', async () => {
  const f = await fresh({ Tom: P([G('a1', true)]), Piet: P([G('a2', true)]) });
  await f.p.evaluate(() => clearPlayer('Piet')); await wait(100);
  ok(await f.p.evaluate(() => !!dbCache.Piet), 'nog niet weg vóór bevestigen');
  await yes(f.p); await wait(150);
  ok(await f.p.evaluate(() => !dbCache.Piet && !!JSON.parse(localStorage.getItem('darts_acct_removed') || '{}').Piet), 'weg + gemarkeerd');
  await f.p.reload(); await wait(700); ok(await f.p.evaluate(() => !dbCache.Piet && !!dbCache.Tom), 'na herladen'); await f.done();
});
await S.t('potje verwijderen: na bevestiging, tombstone, tellers −1', async () => {
  const f = await fresh({ Tom: P([G('a1', true), G('a2', false)], { games: 40, wins: 25 }) });
  await f.p.evaluate(() => deleteMatchEntry('Tom', 0)); await wait(80);
  eq(await f.p.evaluate(() => dbCache.Tom.gameHistory.length), 2, 'nog niets weg');
  await yes(f.p); await wait(150);
  const r = await f.p.evaluate(() => ({ n: dbCache.Tom.gameHistory.map(e => e.gid), g: dbCache.Tom.games, w: dbCache.Tom.wins, d: dbCache.Tom.deleted }));
  eq(r.n, ['a2'], 'a1 weg'); eq([r.g, r.w], [39, 24], 'tellers −1'); ok(r.d.includes('g:a1'), 'tombstone'); await f.done();
});
await S.t('export → import op een lege telefoon: alles exact over', async () => {
  const src = { Tom: P([G('a1', true, { detailedStats: { avg3: 55.5 } })], { doubleStats: { D16: 3 }, nickname: 'The Power' }), Henk: P([G('a2', false)]) };
  const f = await fresh(src);
  const code = await f.p.evaluate(() => btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data: dbCache })))));
  const g = await fresh({});
  await g.p.evaluate(c => { showScreen('screen-settings'); try { stOpen('data'); } catch (e) {} let el = document.getElementById('import-code'); el.value = c; importStats(); }, code); await wait(200);
  const r = await g.p.evaluate(() => JSON.parse(localStorage.getItem('darts_db')));
  eq(Object.keys(r).sort(), ['Henk', 'Tom'], 'spelers'); eq(r.Tom.gameHistory, src.Tom.gameHistory, 'potjes exact'); eq(r.Tom.doubleStats, { D16: 3 }, 'dubbels'); eq(r.Tom.nickname, 'The Power', 'bijnaam');
  await f.done(); await g.done();
});
await S.t('import op bestaande data: geen dubbele potjes, tellers niet lager', async () => {
  const f = await fresh({ Tom: P([G('a1', true), G('a2', true)], { games: 50, wins: 30 }) });
  const code = await f.p.evaluate(d => btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data: d })))), { Tom: P([G('a1', true), G('a3', false)]) });
  await f.p.evaluate(c => { showScreen('screen-settings'); try { stOpen('data'); } catch (e) {} document.getElementById('import-code').value = c; importStats(); }, code); await wait(200);
  const r = await f.p.evaluate(() => ({ n: dbCache.Tom.gameHistory.map(e => e.gid).sort(), g: dbCache.Tom.games, w: dbCache.Tom.wins }));
  eq(r.n, ['a1', 'a2', 'a3'], 'samengevoegd'); ok(r.g >= 51 && r.w >= 30, 'tellers ' + r.g + '/' + r.w); await f.done();
});
await S.t('hervatten na herladen: midden in 501 exact terug', async () => {
  const f = await fresh({ Tom: E(), Henk: E() });
  await f.p.evaluate(() => { launchGame('501', ['Tom', 'Henk'], true, 'firstto', 2, 1, 501, 0); document.getElementById('score-input').value = '100'; submitScore(); }); await wait(200);
  const before = await f.p.evaluate(() => JSON.stringify({ s: state.scores, c: state.currentPlayer, h: state.history.length }));
  await f.p.reload(); await wait(900);
  ok(await f.p.evaluate(() => /hervatten/i.test((document.getElementById('game-sheet') || {}).innerText || '')), 'vraag "Potje hervatten?"');
  await f.p.evaluate(() => { closeGameSheet(); _liveResumeStored(); }); await wait(300);
  const after = await f.p.evaluate(() => JSON.stringify({ s: state.scores, c: state.currentPlayer, h: state.history.length }));
  eq(after, before, 'stand'); eq(await f.p.evaluate(() => _curScreen), 'screen-game', 'spelscherm'); await f.done();
});
await S.t('herladen zonder iets te doen verandert darts_db niet (byte-gelijk)', async () => {
  const db = { Tom: P([G('a1', true, { legBreakdown: [{ legNum: 1, winner: 'Tom', playerStats: {} }] })], { doubleStats: { D20: 1 }, deleted: ['g:x'] }), 'A<b>"\'&': P([G('a2', false)]) };
  const f = await fresh(db); const s1 = await f.p.evaluate(() => localStorage.getItem('darts_db'));
  await f.p.reload(); await wait(800); const s2 = await f.p.evaluate(() => localStorage.getItem('darts_db'));
  eq(s2, s1, 'na herladen'); eq(JSON.parse(s1), db, 'gelijk aan wat erin ging'); await f.done();
});
const rc = S.done(); await b.close(); process.exit(rc);
