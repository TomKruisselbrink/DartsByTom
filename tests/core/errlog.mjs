// Fase 2 — fouten worden niet meer stil weggeslikt: statisch geen lege catch, stille catches alleen met reden in een vaste
// lijst (browserfuncties, geen opslag/sync); de foutlog bewaart, telt dubbel op, toont in Instellingen → Gegevens, NL/EN.
import fs from 'fs'; import path from 'path';
import { browser, page, open, suite, eq, ok, DB, wait } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
const S = suite('errlog');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const QUIET_OK = new Set(['close', 'renderVoicePicker', 'callerSay', '_callerUnlock', '_scrollRestore', 'haptic', '_hsAll', 'getAC', 'playSound', 'showLbTab', 'showAppVersion', 'fit', '_finishDo', '_shShanghaiSave', '_seqPressStart', '_errLog', '_errLoad', '(foutlog)']);
function enclosing(idx) {
  const before = src.slice(Math.max(0, idx - 20000), idx); const ms = [...before.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
  if (/Foutlog \(v251/.test(src.slice(Math.max(0, idx - 3000), idx))) return ms.length ? ms[ms.length - 1][1] : '(foutlog)';
  return ms.length ? ms[ms.length - 1][1] : '?';
}
await S.t('geen enkele lege catch meer in index.html', async () => {
  const m = [...src.matchAll(/catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g)].map(x => src.slice(0, x.index).split('\n').length);
  ok(!m.length, 'lege catch op regel ' + m.join(', '));
});
await S.t('stille catches alleen met reden en alleen buiten opslag/sync (vaste lijst)', async () => {
  const bad = [];
  for (const x of src.matchAll(/catch\s*\(\s*\w+\s*\)\s*\{\s*\/\*stil(:[^*]*)?\*\/\s*\}/g)) {
    const fn = enclosing(x.index); if (!QUIET_OK.has(fn)) bad.push(fn + ' r' + src.slice(0, x.index).split('\n').length);
  }
  ok(!bad.length, 'niet toegestaan: ' + bad.join(', '));
});
await S.t('opslag- en syncfuncties loggen fouten (steekproef)', async () => {
  for (const fn of ['_acctMerge', 'mergePlayers', '_lsSet', '_liveSaveNow', 'clearPlayer', '_hiReplaceEntry', 'startHiddenListener'])
    ok(src.includes(`_errLog(e,'${fn}')`), fn + ' logt niet');
});
const b = await browser();
await S.t('foutlog: bewaart, telt dubbel op, max 50, overleeft herladen', async () => {
  const { p, errs } = await page(b, { db: DB('Tom'), fast: 10, seedOnce: true }); await open(p, 500);
  await p.evaluate(() => { _errLog(new Error('kapot'), 'test'); _errLog(new Error('kapot'), 'test'); for (let i = 0; i < 60; i++) _errLog('fout ' + i, 'veel'); });
  let r = await p.evaluate(() => JSON.parse(localStorage.getItem('darts_errlog')));
  eq(r.length, 50, 'max 50'); ok(!r.some(x => x.w === 'test'), 'oudste valt eraf');
  await p.evaluate(() => { _errBuf = []; localStorage.removeItem('darts_errlog'); _errLog(new Error('kapot'), 'test'); _errLog(new Error('kapot'), 'test'); });
  r = await p.evaluate(() => JSON.parse(localStorage.getItem('darts_errlog'))); eq(r.length, 1, 'één regel'); eq(r[0].n, 2, 'teller 2');
  await p.reload(); await wait(500); eq(await p.evaluate(() => _errLoad().length), 1, 'na herladen');
  ok(errs.length === 0, 'pageerror ' + errs[0]); await p.close();
});
await S.t('foutlog: console.error en onverwachte fouten komen erin; spelgegevens blijven ongemoeid', async () => {
  const { p, errs } = await page(b, { db: DB('Tom'), fast: 10 }); await open(p, 500);
  const db1 = await p.evaluate(() => localStorage.getItem('darts_db'));
  await p.evaluate(() => { console.error('Vriendverzoeken', { code: 'permission-denied', message: 'Missing or insufficient permissions.' }); setTimeout(() => { throw new Error('boem'); }, 0); });
  await wait(200);
  const r = await p.evaluate(() => _errLoad().map(x => x.w + ' | ' + x.m));
  ok(r.some(x => /Vriendverzoeken.*insufficient/.test(x)), 'console.error: ' + r.join(' ; ')); ok(r.some(x => /onverwacht.*boem/.test(x)), 'onverwacht: ' + r.join(' ; '));
  eq(await p.evaluate(() => localStorage.getItem('darts_db')), db1, 'darts_db ongewijzigd'); await p.close();
});
for (const lang of ['nl', 'en']) await S.t(`foutlog zichtbaar in Instellingen → Gegevens (${lang}), kopiëren en wissen`, async () => {
  const { p, errs } = await page(b, { db: DB('Tom'), ls: { lang }, fast: 10 }); await open(p, 500);
  eq(await p.evaluate(() => { showScreen('screen-settings'); stOpen('data'); return document.getElementById('st-errlog').hidden; }), true, 'verborgen zonder fouten');
  await p.evaluate(() => _errLog(new Error('<img src=x onerror=alert(1)>'), 'naam<b>'));
  await wait(400);
  const r = await p.evaluate(() => ({ hid: document.getElementById('st-errlog').hidden, t: document.getElementById('st-errlog').innerText, inj: !!document.querySelector('#st-errlog img, #st-errlog b b') }));
  ok(!r.hid, 'zichtbaar'); ok(lang === 'en' ? /Error log \(1\)/.test(r.t) : /Foutlog \(1\)/.test(r.t), 'kop: ' + r.t.slice(0, 40)); ok(!r.inj, 'HTML uit melding uitgevoerd');
  await p.evaluate(() => errClear()); await wait(100); eq(await p.evaluate(() => document.getElementById('st-errlog').hidden), true, 'gewist');
  ok(errs.length === 0, 'pageerror ' + errs[0]); await p.close();
});
const rc = S.done(); await b.close(); process.exit(rc);
