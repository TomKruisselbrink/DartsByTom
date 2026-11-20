// v249 — draaien: node tests/security/ec-correct.mjs (zie README).
// "Eindstand corrigeren": vervangt potjes (tombstone + kopie met nieuwe gid + corrected), tellers kloppen, vangnet,
// winnaar alleen als alle potjes er zijn, niet bij X01/toernooi/Halve It met rondes/Afgooien-teams, rare namen veilig.
import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = []; const log = [];
const T = 1763600000000, X = 'Z<b>"\'&';
const ent = (gid, gt, won, opp, extra = {}) => Object.assign({ gid, ts: T, date: '20-11-2026', gameType: gt, won, darts: 10, score: 0, opponents: opp }, extra);
const P = (games) => ({ games: games.length, wins: games.filter(g => g.won).length, totalDarts: 10 * games.length, totalScore: games.reduce((s, g) => s + (g.score || 0), 0), gameHistory: games });
const db = {
  Tom: P([ent('d1-c', 'cricket', true, ['Henk'], { score: 120 }), ent('d1-a', 'atc', true, ['Henk'], { highScore: 22 }), ent('d1-x', '501', true, ['Henk'], { detailedStats: { avg3: 50 } }),
          ent('d1-k', 'afgooien', true, ['Henk'], { afgScore: 3 }), ent('d1-h', 'halveit', true, ['Henk'], { score: 90, highScore: 90, hiRoundHistory: [{ round: 0, label: '20', pts: 90, halved: false, newScore: 90 }] }),
          ent('d1-s', 'shanghai7', true, ['Piet'], { score: 50, highScore: 50 })]),
  Henk: P([ent('d2-c', 'cricket', false, ['Tom'], { score: 100 }), ent('d2-a', 'atc', false, ['Tom'], { highScore: 15 }), ent('d2-k', 'afgooien', false, ['Tom'], { afgScore: 0 })]),
  [X]: P([ent('d3-b', 'bobs27', false, undefined, { score: 40, highScore: 40, bobStats: { hits: 5, att: 30, reached: 10, out: false, stop: false } })]),
};
delete db[X].gameHistory[0].opponents;
const { p, errs } = await page(b, { db });
await open(p);
const openEc = async (name, gid) => p.evaluate(([n, gid]) => { const e = dbCache[n].gameHistory.find(x => x.gid === gid); ecOpen(n, _mkey(e)); }, [name, gid]);
const confirmYes = async () => { await p.waitForTimeout(200); await p.evaluate(() => { const b = [...document.querySelectorAll('button')].reverse().find(x => x.offsetParent && /^Opslaan$/.test(x.textContent.trim()) && x.closest('.ask-box')); b.click(); }); await p.waitForTimeout(300); };
// 1. Cricket: Henk 100 → 130 en winnaar
await openEc('Tom', 'd1-c'); await p.waitForTimeout(150);
const s1 = await p.evaluate(() => ({ inputs: document.querySelectorAll('.ec-in').length, radios: document.querySelectorAll('[name="ec-win"]').length }));
if (s1.inputs !== 2 || s1.radios !== 2) fails.push('cricket: sheet ' + JSON.stringify(s1));
await p.evaluate(() => { const i = document.querySelector('.ec-in[data-i="1"]'); i.value = '130'; i.dispatchEvent(new Event('input')); document.querySelector('[name="ec-win"][value="1"]').click(); });
const prev = await p.evaluate(() => document.getElementById('ec-sum').innerText);
if (!/Henk: 100 → 130/.test(prev) || !/Henk wint nu/.test(prev) || !/Tom wint niet meer/.test(prev)) fails.push('cricket: preview ' + prev.replace(/\n/g, ' | '));
await p.evaluate(() => ecSave()); await confirmYes();
const r1 = await p.evaluate(() => { const t = dbCache.Tom, h = dbCache.Henk; const tc = t.gameHistory.find(e => e.gameType === 'cricket'), hc = h.gameHistory.find(e => e.gameType === 'cricket');
  return { tc, hc, tw: t.wins, hw: h.wins, hs: h.totalScore, ts: t.totalScore, tdel: t.deleted || [], hdel: h.deleted || [], bk: Object.keys(JSON.parse(localStorage.getItem('darts_correct_backup') || '{}')).length, nT: t.gameHistory.filter(e => e.gameType === 'cricket').length }; });
if (r1.tc.won !== false || r1.tc.gid === 'd1-c' || !r1.tc.corrected || r1.tc.corrected.from !== 'd1-c' || r1.tc.score !== 120) fails.push('cricket Tom: ' + JSON.stringify(r1.tc));
if (r1.hc.won !== true || r1.hc.score !== 130 || r1.hc.gid === 'd2-c' || r1.hc.ts !== T || r1.hc.date !== '20-11-2026') fails.push('cricket Henk: ' + JSON.stringify(r1.hc));
if (r1.hc.highScore !== undefined) fails.push('cricket: highScore gezet');
if (r1.tw !== 5 || r1.hw !== 1 || r1.hs !== 130 || r1.ts !== 260) fails.push('cricket tellers ' + JSON.stringify([r1.tw, r1.hw, r1.hs, r1.ts]));
if (!r1.tdel.includes('g:d1-c') || !r1.hdel.includes('g:d2-c')) fails.push('cricket: tombstones ' + JSON.stringify([r1.tdel, r1.hdel]));
if (r1.bk !== 2) fails.push('cricket: vangnet ' + r1.bk); if (r1.nT !== 1) fails.push('cricket: dubbel potje');
// 2. ATC: highScore, max 22, ongeldig
await openEc('Henk', 'd2-a'); await p.waitForTimeout(150);
await p.evaluate(() => { const i = document.querySelector('.ec-in[data-i="0"]'); i.value = '23'; i.dispatchEvent(new Event('input')); });
const bad = await p.evaluate(() => document.getElementById('ec-sum').innerText); if (!/Ongeldige waarde/.test(bad)) fails.push('atc: 23 niet geweigerd');
await p.evaluate(() => { const i = document.querySelector('.ec-in[data-i="0"]'); i.value = '18'; i.dispatchEvent(new Event('input')); ecSave(); }); await confirmYes();
const r2 = await p.evaluate(() => dbCache.Henk.gameHistory.find(e => e.gameType === 'atc'));
if (r2.highScore !== 18 || r2.score !== 0 || !r2.corrected) fails.push('atc: ' + JSON.stringify(r2));
// 3. Afgooien: alleen winnaar
await openEc('Tom', 'd1-k'); await p.waitForTimeout(150);
const s3 = await p.evaluate(() => ({ inputs: document.querySelectorAll('.ec-in').length, radios: document.querySelectorAll('[name="ec-win"]').length }));
if (s3.inputs !== 0 || s3.radios !== 2) fails.push('afgooien: sheet ' + JSON.stringify(s3));
await p.evaluate(() => ecSave()); await p.waitForTimeout(300);
const same = await p.evaluate(() => dbCache.Tom.gameHistory.find(e => e.gameType === 'afgooien').gid); if (same !== 'd1-k') fails.push('afgooien: zonder wijziging toch vervangen');
await p.evaluate(() => closeGameSheet());
// 4. Shanghai, tegenstander Piet ontbreekt: score wel, winnaar niet
await openEc('Tom', 'd1-s'); await p.waitForTimeout(150);
const s4 = await p.evaluate(() => ({ inputs: document.querySelectorAll('.ec-in').length, radios: document.querySelectorAll('[name="ec-win"]').length, txt: document.getElementById('game-sheet').innerText }));
if (s4.inputs !== 1 || s4.radios !== 0 || !/Piet/.test(s4.txt)) fails.push('shanghai missend: ' + JSON.stringify(s4).slice(0, 200));
await p.evaluate(() => { const i = document.querySelector('.ec-in'); i.value = '60'; i.dispatchEvent(new Event('input')); ecSave(); }); await confirmYes();
const r4 = await p.evaluate(() => dbCache.Tom.gameHistory.find(e => e.gameType === 'shanghai7'));
if (r4.score !== 60 || r4.highScore !== 60 || r4.won !== true) fails.push('shanghai: ' + JSON.stringify(r4));
// 5. Solo Bob's 27 met rare naam, negatieve score mag
await openEc(X, 'd3-b'); await p.waitForTimeout(150);
const s5 = await p.evaluate(() => ({ radios: document.querySelectorAll('[name="ec-win"]').length, inj: !!document.querySelector('#game-sheet b b, .ec-n b') }));
if (s5.radios !== 0 || s5.inj) fails.push('bob solo: ' + JSON.stringify(s5));
await p.evaluate(() => { const i = document.querySelector('.ec-in'); i.value = '-12'; i.dispatchEvent(new Event('input')); ecSave(); }); await confirmYes();
const r5 = await p.evaluate(n => dbCache[n].gameHistory[0], X);
if (r5.score !== -12 || r5.highScore !== -12 || r5.won !== false || !r5.bobStats) fails.push('bob: ' + JSON.stringify(r5));
// 6. Knoppen in Geschiedenis: niet bij X01, niet bij Halve It met rondes, wel bij cricket; 'gecorrigeerd' zichtbaar
const r6 = await p.evaluate(async () => { historySelectedPlayer = 'Tom'; showScreen('screen-history'); await new Promise(r => setTimeout(r, 400));
  const btns = [...document.querySelectorAll('#history-content button')].filter(b => /ecOpen/.test(b.getAttribute('onclick') || ''));
  const keys = btns.map(b => b.dataset.k); const g = k => dbCache.Tom.gameHistory.find(e => _mkey(e) === k).gameType;
  return { types: keys.map(g), txt: document.getElementById('history-content').innerText }; });
['501', 'halveit'].forEach(t => { if (r6.types.includes(t)) fails.push('knop bij ' + t); });
['cricket', 'atc', 'afgooien', 'shanghai7'].forEach(t => { if (!r6.types.includes(t)) fails.push('geen knop bij ' + t); });
if (errs.length) fails.push('pageerrors ' + errs.slice(0, 2).join(' | '));
// 7. EN
await p.evaluate(() => { localStorage.setItem('lang', 'en'); }); await p.reload(); await p.waitForTimeout(1200);
await openEc('Henk', [...[]].length ? '' : (await p.evaluate(() => dbCache.Henk.gameHistory.find(e => e.gameType === 'cricket').gid))); await p.waitForTimeout(500);
const en = await p.evaluate(() => document.getElementById('game-sheet').innerText);
if (!/Correct final score/.test(en) || !/Points per player and the winner\./.test(en) || !/Winner/.test(en)) fails.push('EN: ' + en.slice(0, 200).replace(/\n/g, ' | '));
console.log(`ec-correct: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
