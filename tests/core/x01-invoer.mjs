// 4D-1b — X01-invoer: invoerblokkade, terugmelding, Ongedaan (één stap), bot annuleren, Uit-knop, double-vraag Terug,
// Stats/Stop in de kop, geen zwevende balk in X01, NL/EN. Spelregels en scoreberekening worden niet getest op nieuwe
// uitkomsten: alleen dat de invoer de bestaande functies (submitScore, undoThrow, confirmDouble) juist aanroept en
// dat de stand na Ongedaan exact gelijk is aan de stand vóór de invoer.
import { browser, page, open, suite, ok, eq, wait } from './h.mjs';
const T = suite('x01-invoer');
const b = await browser();
const SNAP = `JSON.stringify({s:state.scores,c:state.currentPlayer,d:state.dartCount,ad:state.allDartCount,h:state.history,ah:state.allHistory,lw:state.legWins,r:state.round,leg:state.currentLeg,beurt:(document.querySelector('#x01-head .g-head-r b')||{}).textContent})`;
const L2 = (sc) => `launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.scores=${sc};renderGame();`;
const fb = () => ({ cls: document.getElementById('x01-fb').className, n: document.getElementById('x01-fbn').textContent, s: document.getElementById('x01-fbs').textContent, r: document.getElementById('x01-fbr').textContent, m: document.getElementById('x01-fbm').textContent, undo: !document.getElementById('x01-undo').disabled, uit: !document.getElementById('x01-uit').hidden, uitT: document.getElementById('x01-uit').textContent, who: document.getElementById('np-who').textContent });

// Echte tijden: deze suite meet de beurtwissel (80–450 ms), dus nooit FAST (npm test zet FAST=10).
const { p, errs } = await page(b, { fast: 1 }); await open(p, 900);

await T.t('snelle dubbele invoer (80/250/380/450 ms, snelscore en toetsenbord): nooit bij de verkeerde speler', async () => {
  const fails = [];
  for (const via of ['snel', 'toets']) for (const gap of [80, 250, 380, 450]) {
    const tweede = via === 'snel' ? 'quickScore(45)' : "numpadPress('4');numpadPress('5');numpadPress('enter')";
    await p.evaluate(L2('[301,301]') + `quickScore(60);setTimeout(function(){${tweede}},${gap});`); await wait(1300);
    const r = await p.evaluate(`({h:state.history.map(function(h){return state.players[h.player]+' '+h.score}),c:state.players[state.currentPlayer]})`);
    const verwacht = gap < 400 ? { h: ['Tom 60'], c: 'Henk' } : { h: ['Tom 60', 'Henk 45'], c: 'Tom' };
    if (JSON.stringify(r) !== JSON.stringify(verwacht)) fails.push(`${via} ${gap} ms: ${JSON.stringify(r)} ≠ ${JSON.stringify(verwacht)}`);
  }
  ok(!fails.length, fails.join('; '));
});

await T.t('Ongedaan herstelt de stand exact (snelscore, getypt, bust te hoog, bust op 1, double-Nee, teams, 3 spelers, binnen 400 ms)', async () => {
  const cases = {
    'snelscore 60': [L2('[121,140]') + 'state.currentPlayer=1;renderGame();', 'quickScore(60)', 1100],
    'getypt 45 + Enter (3 spelers)': [`launchGame('501',['Tom','Henk','Imke'],true,'firstto',3,1,501,0);state.currentPlayer=2;renderGame();`, "numpadPress('4');numpadPress('5');numpadPress('enter')", 1100],
    'bust te hoog': [L2('[121,40]') + 'state.currentPlayer=1;renderGame();', "numpadPress('6');numpadPress('0');numpadPress('enter')", 1300],
    'bust op 1 (double out)': [L2('[121,41]') + 'state.currentPlayer=1;renderGame();', "numpadPress('4');numpadPress('0');numpadPress('enter')", 1300],
    'double-vraag Nee': [L2('[121,40]') + 'state.currentPlayer=1;renderGame();', "x01Uit();confirmDouble(false,40,40,1)", 1300],
    'teams 2 tegen 2': [`_pendingTeams=[0,1,0,1];launchGame('501',['Tom','Henk','Imke','Jorn'],false,'firstto',3,1,501,0);`, 'quickScore(100)', 1100],
    'Ongedaan binnen 400 ms (vóór de beurtwissel)': [L2('[121,140]'), 'quickScore(60)', 150],
  };
  const fails = [];
  for (const [naam, [setup, act, w]] of Object.entries(cases)) {
    await p.evaluate(setup); await wait(120); const voor = await p.evaluate(SNAP);
    await p.evaluate(act); await wait(w);
    const f = await p.evaluate(fb); if (!f.undo) fails.push(naam + ': Ongedaan niet beschikbaar');
    await p.evaluate('x01Undo()'); await wait(1300); // ook: geen geplande beurtwissel meer na Ongedaan
    const na = await p.evaluate(SNAP);
    if (voor !== na) fails.push(`${naam}: stand na Ongedaan ≠ vóór\n voor ${voor}\n na   ${na}`);
    const g = await p.evaluate(fb); if (g.undo || !/Teruggezet/.test(g.m)) fails.push(naam + ': na Ongedaan geen "Teruggezet" of knop nog actief');
    if (!(await p.evaluate('!_x01Locked()'))) fails.push(naam + ': invoer na Ongedaan nog geblokkeerd');
  }
  ok(!errs.length, 'pageerror: ' + errs[0]);
  ok(!fails.length, fails.join('; '));
});

await T.t('één stap terug: tweede Ongedaan doet niets; een nieuwe score maakt de vorige definitief', async () => {
  await p.evaluate(L2('[301,301]') + 'quickScore(60);'); await wait(600); await p.evaluate('quickScore(45)'); await wait(600);
  await p.evaluate('x01Undo()'); await wait(200);
  let r = await p.evaluate(`({h:state.history.map(function(h){return h.score}),c:state.currentPlayer})`);
  eq(r, { h: [60], c: 1 }, 'alleen 45 ongedaan');
  await p.evaluate('x01Undo()'); await wait(200);
  r = await p.evaluate(`({h:state.history.map(function(h){return h.score}),c:state.currentPlayer})`);
  eq(r, { h: [60], c: 1 }, 'tweede Ongedaan mag niets doen');
  await p.evaluate('quickScore(26)'); await wait(600);
  const f = await p.evaluate(fb); ok(f.undo && f.s === '26' && f.r === '275', 'nieuwe terugmelding Henk 26 → 275: ' + JSON.stringify(f));
});

await T.t('terugmelding blijft staan terwijl de volgende speler intikt; bust; nieuwe leg', async () => {
  await p.evaluate(L2('[121,140]') + 'state.currentPlayer=1;renderGame();quickScore(60);'); await wait(600);
  await p.evaluate("numpadPress('4');numpadPress('5')");
  let f = await p.evaluate(fb); ok(f.n === 'Henk' && f.s === '60' && f.r === '80' && f.undo && /Tom gooit/.test(f.who), 'tijdens intikken: ' + JSON.stringify(f));
  await p.evaluate(L2('[121,40]') + "state.currentPlayer=1;renderGame();numpadPress('6');numpadPress('0');numpadPress('enter')"); await wait(1200);
  f = await p.evaluate(fb); ok(/is-bust/.test(f.cls) && f.s === 'Bust' && f.r === '40', 'bust: ' + JSON.stringify(f));
  await p.evaluate(L2('[501,501]')); await wait(200);
  f = await p.evaluate(fb); ok(/is-leeg/.test(f.cls) && !f.undo, 'begin leg: ' + JSON.stringify(f));
});

await T.t('bot: Ongedaan tijdens de botbeurt annuleert de botworp; na de botworp gooit de bot opnieuw; geen invoer tijdens de botbeurt', async () => {
  const LB = `botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Bot'],true,'firstto',3,1,501,0);state.botPlayerIndex=1;state.scores=[301,301];renderGame();`;
  // (a) vóór de botworp (bot is aan de beurt, nog niet gegooid)
  await p.evaluate(LB); await wait(100); const voor = await p.evaluate(SNAP);
  await p.evaluate('quickScore(60)'); await wait(700); // beurt is naar de bot, botworp nog niet geboekt (na ±1700 ms)
  ok(await p.evaluate('state.currentPlayer===1&&state.history.length===1'), 'bot zou nu aan de beurt moeten zijn zonder worp');
  ok(await p.evaluate("(quickScore(26),state.history.length===1)"), 'invoer tijdens de botbeurt geblokkeerd');
  await p.evaluate('x01Undo()'); await wait(3500);
  eq(await p.evaluate(SNAP), voor, 'stand na Ongedaan tijdens botbeurt (en geen botworp daarna)');
  // (b) ná de botworp: Ongedaan haalt de botscore weg, de bot gooit opnieuw, daarna is Tom aan de beurt
  await p.evaluate(LB + 'quickScore(60);'); await wait(1900);
  ok(await p.evaluate('state.history.length===2&&state.history[1].player===1'), 'botworp verwacht');
  await p.evaluate('x01Undo()'); await wait(150);
  ok(await p.evaluate('state.history.length===1&&state.currentPlayer===1'), 'na Ongedaan van de botscore: bot weer aan de beurt');
  await wait(3500);
  const r = await p.evaluate(`({n:state.history.length,p:state.history.map(function(h){return h.player}),c:state.currentPlayer,s0:state.scores[0]})`);
  eq([r.n, r.p, r.c, r.s0], [2, [0, 1], 0, 241], 'bot heeft opnieuw gegooid, Tom aan de beurt');
  ok(!errs.length, 'pageerror: ' + errs[0]);
});

await T.t('Uit-knop en double-vraag Terug: niets opgeslagen tot Ja/Nee; Uit niet bij 181, tijdens intikken of botbeurt', async () => {
  await p.evaluate(L2('[121,140]')); await wait(100);
  let f = await p.evaluate(fb); ok(f.uit && f.uitT === 'Uit 121', 'Uit 121 zichtbaar: ' + JSON.stringify(f));
  await p.evaluate("numpadPress('2')"); f = await p.evaluate(fb); ok(!f.uit, 'tijdens intikken geen Uit');
  await p.evaluate(L2('[181,140]')); f = await p.evaluate(fb); ok(!f.uit, 'bij 181 geen Uit');
  await p.evaluate(L2('[121,140]')); const voor = await p.evaluate(SNAP);
  await p.evaluate('x01Uit()'); ok(await p.evaluate("!!document.querySelector('#dbl-yn-overlay .x01-dbl-back')"), 'double-vraag met Terug');
  ok(await p.evaluate("(quickScore(60),state.history.length===0)"), 'geen invoer tijdens de double-vraag');
  await p.evaluate("document.querySelector('#dbl-yn-overlay .x01-dbl-back').click()");
  eq(await p.evaluate(SNAP), voor, 'na Terug niets opgeslagen');
  eq(await p.evaluate("[!!document.getElementById('dbl-yn-overlay'),document.getElementById('numpad-display').textContent]"), [false, '121'], 'venster weg, 121 terug in de invoer');
  await p.evaluate("numpadPress('del')"); eq(await p.evaluate('_numpadVal'), '12', 'score aanpassen kan');
});

await T.t('blokkade wordt opgeheven bij Stop en bij hervatten', async () => {
  await p.evaluate(L2('[301,301]') + 'quickScore(60);'); ok(await p.evaluate('_x01Locked()'), 'direct na indienen geblokkeerd');
  await p.evaluate("confirmEndGame()"); await wait(150); await p.evaluate("[...document.querySelectorAll('.ask-ov button')].find(function(b){return /^Stop$/.test(b.textContent.trim())}).click()"); await wait(300);
  ok(await p.evaluate('!_x01Locked()&&_x01Busy===false'), 'na Stop niet meer geblokkeerd');
  await wait(600); ok(await p.evaluate("document.querySelector('.screen.active').id!=='screen-game'"), 'geen beurtwissel na Stop die het spel terughaalt');
  await p.evaluate(L2('[301,301]') + 'quickScore(60);'); const snap = await p.evaluate("JSON.parse(localStorage.getItem(LIVE_KEY)||'null')");
  ok(snap && snap.screen === 'screen-game', 'snapshot aanwezig');
  await p.evaluate(s => _liveResume(s, true), snap); await wait(100);
  ok(await p.evaluate('_x01Busy===false&&_x01UndoUsed===null'), 'na hervatten blokkade en Ongedaan-status opgeheven');
});

await T.t('gamebalk niet in X01 (wel in andere spellen); Stats en Stop in de kop; Stop onderscheidbaar', async () => {
  await p.setViewportSize({ width: 360, height: 640 });
  await p.evaluate(L2('[121,140]')); await wait(200);
  const r = await p.evaluate(() => { const gc = document.getElementById('game-controls'), a = [...document.querySelectorAll('#x01-head .x01-act')], cs = a.map(x => getComputedStyle(x));
    return { balk: getComputedStyle(gc).display !== 'none' && gc.classList.contains('show'), n: a.filter(x => x.offsetParent).length, stopKleur: cs[1] && cs[1].color, statsKleur: cs[0] && cs[0].color, stopBg: cs[1] && cs[1].backgroundColor, statsBg: cs[0] && cs[0].backgroundColor }; });
  ok(!r.balk, 'zwevende balk zichtbaar in X01'); eq(r.n, 2, 'Stats en Stop in de kop');
  ok(r.stopKleur !== r.statsKleur && r.stopBg !== r.statsBg, 'Stop niet onderscheidbaar: ' + JSON.stringify(r));
  await p.evaluate(`launchGame('atc',['Tom','Henk'],true,'firstto',1,1,501,0);`); await wait(200);
  ok(await p.evaluate("document.getElementById('game-controls').classList.contains('show')"), 'balk hoort er bij ATC nog wel te zijn');
  await p.setViewportSize({ width: 1920, height: 1080 }); await p.evaluate(L2('[121,140]')); await wait(200);
  eq(await p.evaluate("[document.querySelectorAll('#x01-side .x01-acts-side .x01-act').length,[...document.querySelectorAll('.x01-act')].filter(function(x){return x.offsetParent}).map(function(x){return !!x.closest('#x01-side')})]"), [2, [true, true]], 'kantine: acties boven de invoerkolom');
  await p.evaluate('quickScore(60)'); await wait(600);
  const k = await p.evaluate(() => { const f = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize), hgt = s => Math.round(document.querySelector(s).getBoundingClientRect().height);
    return { fbs: f('#x01-fbs'), fbr: f('#x01-fbr'), disp: f('#numpad-display'), res: f('#np-res'), who: f('#np-who'), fbn: f('#x01-fbn'), q: f('.x01-q'), undo: hgt('#x01-undo'), act: hgt('#x01-side .x01-act'), fb: hgt('#x01-fb') }; });
  ok(k.fbs >= 40 && k.fbr >= 40 && k.disp >= 40 && k.res >= 28 && k.who >= 15 && k.fbn >= 15 && k.q >= 15 && k.undo >= 52 && k.act >= 52 && k.fb >= 64, 'kantinematen (K12): ' + JSON.stringify(k));
  await p.setViewportSize({ width: 390, height: 844 });
});

// Indeling: geen toets onder een balk of buiten beeld, niet scrollen, kop niet afgekapt (2/3/4/6 spelers, telefoonmaten, NL/EN)
for (const lang of ['nl', 'en']) {
  const q = await page(b, { ls: { lang }, fast: 1 }); await open(q.p, 900);
  await T.t(`${lang.toUpperCase()} indeling telefoon/tablet: niets bedekt, niet scrollen, kop en terugmelding niet afgekapt`, async () => {
    const fails = [];
    const P = { 2: "['Tom','Henk']", 3: "['Tom','Henk','Imke']", 4: "['Tom','Henk','Imke','Jorn']", 6: "['Tom','Henk','Imke','Jorn','Anna','Bas']" };
    for (const [w, h] of [[360, 640], [375, 667], [375, 812], [390, 844], [430, 932], [768, 1024]]) {
      await q.p.setViewportSize({ width: w, height: h });
      for (const n of [2, 3, 4, 6]) {
        await q.p.evaluate(`launchGame('501',${P[n]},true,'firstto',3,1,501,0);state.scores=state.players.map(function(_,i){return [121,140,96,170,501,40][i]});state.currentPlayer=1;renderGame();quickScore(60);`); await wait(650);
        const r = await q.p.evaluate(() => { const sc = document.getElementById('screen-game'), ac = document.getElementById('app-content'), k = [...sc.querySelectorAll('.x01-pad .btn,.x01-q')].filter(x => x.offsetParent);
          const mb = Math.max(...k.map(x => x.getBoundingClientRect().bottom)); const tr = e => !!e && !!e.offsetParent && e.scrollWidth > e.clientWidth + 1;
          return { buiten: mb > innerHeight + 0.5, scroll: ac.scrollHeight > ac.clientHeight + 2, kop: [...document.querySelectorAll('#x01-head .g-head-l span')].some(tr), fb: ['x01-fbn', 'x01-fbm'].some(id => tr(document.getElementById(id))), fbt: document.querySelector('.x01-fbt').scrollWidth > document.querySelector('.x01-fbt').clientWidth + 1, toets: Math.round(k[k.length - 1].getBoundingClientRect().height) }; });
        const id = `${w}×${h} ${n} sp`;
        if (r.buiten) fails.push(id + ': toets buiten beeld'); if (r.scroll) fails.push(id + ': scrollen nodig'); if (r.kop) fails.push(id + ': kop afgekapt');
        if (r.fb || r.fbt) fails.push(id + ': terugmelding afgekapt'); if (r.toets < 44) fails.push(`${id}: toets ${r.toets} px < 44`);
      }
    }
    ok(!q.errs.length, 'pageerror: ' + q.errs[0]);
    ok(!fails.length, fails.join('; '));
  });
  await T.t(`${lang.toUpperCase()} teksten: terugmelding, Uit, Teruggezet, double-vraag Terug`, async () => {
    await q.p.setViewportSize({ width: 390, height: 844 });
    await q.p.evaluate(L2('[121,140]')); await wait(150);
    const leeg = await q.p.evaluate(() => [document.getElementById('x01-fbm').textContent, document.getElementById('x01-uit').textContent, document.querySelector('#x01-undo span').textContent]);
    await q.p.evaluate('quickScore(60)'); await wait(600); await q.p.evaluate('x01Undo()'); await wait(150);
    const terug = await q.p.evaluate(() => document.getElementById('x01-fbm').textContent);
    await q.p.evaluate('x01Uit()'); const dbl = await q.p.evaluate(() => document.querySelector('#dbl-yn-overlay .x01-dbl-back').textContent); await q.p.evaluate('x01DoubleBack()');
    const exp = lang === 'nl' ? [['Nog geen worp deze leg', 'Uit 121', 'Ongedaan'], 'Teruggezet: Tom 60', 'Terug, score aanpassen'] : [['No visit yet this leg', 'Out 121', 'Undo'], 'Undone: Tom 60', 'Back, change score'];
    eq([leeg, terug, dbl], exp, 'teksten');
  });
  await q.ctx.close();
}
await b.close();
process.exit(T.done());
