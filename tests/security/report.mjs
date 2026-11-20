// Melden in plaats van stil overslaan: wat niet naar de groep kan, verschijnt in Synchronisatieproblemen,
// een geweigerde groepsschrijfactie ook; niets wordt gewijzigd. NL en EN.
import { browser, page, open } from './lib.mjs';
const b = await browser(); const fails = [];
for (const lang of ['nl', 'en']) {
  const store = { 'groups/G': JSON.stringify({ hidden: [] }) };
  const db = { 'A/B': { games: 1, wins: 0, totalDarts: 1, totalScore: 1, gameHistory: [{ gid: 'ab1', ts: 1, date: '1-1-2026', gameType: '501', won: false, darts: 1, score: 1 }] },
    Tom: { games: 1, wins: 0, totalDarts: 1, totalScore: 1, gameHistory: [{ gid: 't1', ts: 1, date: '1-1-2026', gameType: '501', won: false, darts: 1, score: 1 }] } };
  const fake = { store, writes: [], deny: k => /players\/Tom$/.test(k) };
  const { p, errs } = await page(b, { db, fake, ls: { darts_group_code: 'G', lang } }); await open(p, 2000);
  const r = await p.evaluate(() => { try { saveDB(dbCache); } catch (e) {} return new Promise(res => setTimeout(() => res({
    compat: (typeof _compat !== 'undefined' ? _compat : null), db: JSON.stringify(dbCache) }), 1500)); });
  if (!r.compat) fails.push(lang + ': geen _compat-lijst'); else {
    if (!r.compat.some(x => x.name === 'A/B')) fails.push(lang + ': A/B niet gemeld');
    if (!r.compat.some(x => x.name === 'Tom')) fails.push(lang + ': geweigerde schrijfactie Tom niet gemeld'); }
  if (JSON.stringify(JSON.parse(r.db)) !== JSON.stringify(db)) fails.push(lang + ': lokale data gewijzigd');
  await p.evaluate(() => { showScreen('screen-settings'); stOpen('data'); }); await p.waitForTimeout(400);
  const txt = await p.evaluate(() => document.body.innerText);
  const want = lang === 'nl' ? /Synchronisatieproblemen/ : /Sync problems/;
  if (!want.test(txt)) fails.push(lang + ': regel Synchronisatieproblemen niet zichtbaar in Instellingen → Gegevens');
  // import met een naam die niet naar de groep kan: wel importeren, wel melden
  const msg = [await p.evaluate(() => { document.getElementById('import-code').value = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), data: { 'C/D': { games: 1, wins: 0, gameHistory: [] }, bad: 'geen speler' } })))); importStats(); return Object.keys(dbCache).includes('C/D'); })]; await p.waitForTimeout(400);
  msg.push(await p.evaluate(() => document.getElementById('import-result').innerText)); 
  if (!msg[0]) fails.push(lang + ': C/D niet geïmporteerd');
  if (!(lang === 'nl' ? /Niet geïmporteerd/ : /Not imported/).test(msg[1])) fails.push(lang + ': importmelding noemt overgeslagen item niet (' + msg[1].slice(0, 60) + ')');
  if (errs.length) fails.push(lang + ': pageerrors ' + errs.slice(0, 2).join(' | '));
  await p.close();
}
console.log(`report: ${fails.length ? 'GEZAKT' : 'GESLAAGD'}`); fails.forEach(f => console.log('  ' + f));
await b.close(); process.exit(fails.length ? 1 : 0);
