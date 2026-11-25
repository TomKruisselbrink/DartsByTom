// 4D-1b — X01-invoer: invoerblokkade, terugmelding, Ongedaan (één stap), wachttijd bot (2,5 s, botscore definitief), Uit-knop, double-vraag Terug,
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
    'solo, na de beurtwissel (ronde telt elke beurt)': [`launchGame('501',['Tom'],true,'firstto',3,1,501,0);`, 'quickScore(60)', 1100],
    'ronde 3, laatste speler (beurt terug naar de eerste)': [L2('[301,301]') + 'state.round=3;state.currentPlayer=1;renderGame();', 'quickScore(45)', 1100],
    'ronde 3, eerste speler (geen rondewissel)': [L2('[301,301]') + 'state.round=3;renderGame();', 'quickScore(45)', 1100],
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

// Bot (besluit Tom 25-11, B+D): de bot wacht 2,5 s na het indienen; zolang mag de mens zijn score terugzetten.
// Een ingediende botscore is nooit ongedaan te maken; Ongedaan laat de bot nooit opnieuw gooien.
const LB = (sc = '[301,301]', extra = '') => `botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Bot'],true,'firstto',3,1,501,0);state.botPlayerIndex=1;state.scores=${sc};renderGame();${extra}`;
const isWin = `document.getElementById('x01-undo').classList.contains('is-win')`;
// Wacht tot de bot begint (_x01BotOn) en geef de tijd sinds indienen terug.
const startBot = `new Promise(function(res){var t0=performance.now();quickScore(60);var iv=setInterval(function(){if(_x01BotOn){clearInterval(iv);res(Math.round(performance.now()-t0));}},10);setTimeout(function(){clearInterval(iv);res(-1)},6000);})`;

await T.t('bot: de bot wacht 2,5 s na indienen (ook na een bust); in die tijd Ongedaan met aftelbalk; daarna niet meer', async () => {
  await p.evaluate(LB()); await wait(100);
  const ms = await p.evaluate(startBot);
  ok(ms >= 2450 && ms <= 2900, `bot begon ${ms} ms na indienen (verwacht 2500)`);
  await p.evaluate(LB('[301,40]')); await wait(100);
  const ms2 = await p.evaluate(`new Promise(function(res){var t0=performance.now();numpadPress('6');numpadPress('0');numpadPress('enter');var iv=setInterval(function(){if(_x01BotOn){clearInterval(iv);res(Math.round(performance.now()-t0));}},10);setTimeout(function(){clearInterval(iv);res(-1)},6000);})`);
  ok(ms2 >= 2450 && ms2 <= 2900, `na een bust begon de bot ${ms2} ms na indienen (verwacht 2500)`);
  // binnen het venster
  await p.evaluate(LB()); await wait(100); const voor = await p.evaluate(SNAP);
  await p.evaluate('quickScore(60)'); await wait(150);
  let f = await p.evaluate(fb); ok(f.undo && await p.evaluate(isWin), 'direct na indienen: Ongedaan met aftelbalk ' + JSON.stringify(f));
  await wait(750);
  f = await p.evaluate(fb);
  ok(await p.evaluate('state.currentPlayer===1&&state.history.length===1&&!_x01BotOn'), 'bot aan de beurt, wacht nog');
  ok(f.undo && await p.evaluate(isWin) && /Bot wacht/.test(f.who), 'tijdens het wachten: ' + JSON.stringify(f));
  ok(await p.evaluate("(quickScore(26),numpadPress('4'),numpadPress('enter'),x01Uit(),state.history.length===1)"), 'geen invoer tijdens de wachttijd');
  await wait(1200); // ±2,2 s na indienen: nog net binnen het venster
  ok(await p.evaluate('state.history.length===1&&!_x01BotOn'), 'op 2,2 s nog geen botworp');
  await p.evaluate('x01Undo()'); await wait(3500);
  eq(await p.evaluate(SNAP), voor, 'Ongedaan op 2,2 s: stand exact terug, geen botworp daarna');
  f = await p.evaluate(fb); ok(!(await p.evaluate(isWin)) && /Tom gooit/.test(f.who), 'Tom weer aan de beurt, geen balk: ' + JSON.stringify(f));
  ok(!errs.length, 'pageerror: ' + errs[0]);
});

await T.t('bot: zodra de bot gooit is de vorige score definitief; een botscore kan nooit ongedaan (geen nieuwe worp)', async () => {
  await p.evaluate(LB()); await wait(100); await p.evaluate(startBot); // bot is begonnen (venster dicht)
  let f = await p.evaluate(fb);
  ok(!f.undo && !(await p.evaluate(isWin)) && /Bot gooit…/.test(f.who), 'bot gooit: Ongedaan uit ' + JSON.stringify(f));
  let h = await p.evaluate('JSON.stringify(state.history)'); await p.evaluate('x01Undo()');
  eq(await p.evaluate('JSON.stringify(state.history)'), h, 'Ongedaan tijdens het gooien doet niets');
  await wait(1100); // botscore geboekt
  ok(await p.evaluate('state.history.length===2&&state.history[1].player===1'), 'botworp geboekt');
  f = await p.evaluate(fb); ok(!f.undo && f.n === 'Bot' && f.m === 'definitief', 'botscore: definitief, Ongedaan uit ' + JSON.stringify(f));
  await wait(1500); // beurt terug naar Tom
  const s1 = await p.evaluate(SNAP); f = await p.evaluate(fb);
  ok(await p.evaluate('state.currentPlayer===0') && !f.undo && f.m === 'definitief', 'Tom aan de beurt, botscore blijft definitief ' + JSON.stringify(f));
  await p.evaluate('x01Undo()'); await wait(3000);
  eq(await p.evaluate(SNAP), s1, 'Ongedaan na de botworp: niets veranderd, de bot gooit niet opnieuw');
  // ook een bust van de bot is definitief: bot staat op 2, dwing een bust af via de generator
  await p.evaluate(LB('[301,2]', 'var _bg=botGenerateScore;botGenerateScore=function(){return 60};window._bgr=function(){botGenerateScore=_bg};'));
  await wait(100); await p.evaluate(startBot); await wait(1100);
  ok(await p.evaluate('state.history.length===2&&state.history[1].bust===true'), 'botbust geboekt');
  f = await p.evaluate(fb); h = await p.evaluate('JSON.stringify(state.history)'); await p.evaluate('x01Undo()'); await wait(2500);
  ok(!f.undo && f.m === 'definitief', 'botbust definitief ' + JSON.stringify(f));
  eq(await p.evaluate('JSON.stringify(state.history)'), h, 'botbust niet ongedaan');
  await p.evaluate('_bgr()');
  ok(!errs.length, 'pageerror: ' + errs[0]);
});

await T.t('bot: wachttijd en Stop, hervatten, Ongedaan + opnieuw indienen, nieuwe leg, snelle dubbele invoer, mens na mens', async () => {
  // Stop tijdens de wachttijd: geen botworp meer, spel blijft weg
  await p.evaluate(LB('[301,301]', 'quickScore(60);')); await wait(800);
  await p.evaluate("confirmEndGame()"); await wait(150); await p.evaluate("[...document.querySelectorAll('.ask-ov button')].find(function(b){return /^Stop$/.test(b.textContent.trim())}).click()");
  await wait(3500);
  ok(await p.evaluate("document.querySelector('.screen.active').id!=='screen-game'&&!_x01BotOn&&_x01SubAt===0"), 'na Stop: geen botbeurt, venster dicht');
  // Hervatten tijdens de wachttijd: de bot gooit verder, maar Tom's score kan niet meer terug (venster vervallen)
  await p.evaluate(LB('[301,301]', 'quickScore(60);')); await wait(800);
  const snap = await p.evaluate("JSON.parse(localStorage.getItem(LIVE_KEY)||'null')");
  ok(snap && snap.state && snap.state.currentPlayer === 1, 'snapshot met de bot aan de beurt');
  await p.evaluate(s => _liveResume(s, true), snap); await wait(80);
  let f = await p.evaluate(fb); ok(!f.undo && !(await p.evaluate(isWin)), 'na hervatten geen Ongedaan van de oude score ' + JSON.stringify(f));
  await wait(2600);
  ok(await p.evaluate('state.history.length===2&&state.history[1].player===1&&state.currentPlayer===0'), 'bot heeft na hervatten één keer gegooid, Tom aan de beurt');
  // Ongedaan en opnieuw indienen: nieuw venster van 2,5 s vanaf de nieuwe score
  await p.evaluate(LB('[301,301]', 'quickScore(60);')); await wait(1500); await p.evaluate('x01Undo()'); await wait(300);
  const ms = await p.evaluate(startBot);
  ok(ms >= 2450 && ms <= 2900, `na Ongedaan + opnieuw: bot begon ${ms} ms na de nieuwe score`);
  await wait(2500);
  ok(await p.evaluate('state.history.length===2'), 'precies één Tom-score en één botscore: ' + await p.evaluate('JSON.stringify(state.history)'));
  // Nieuwe leg: Tom gooit uit (single out), leg 2 begint met de bot zonder wachttijd en zonder Ongedaan
  await p.evaluate(`botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Bot'],false,'firstto',3,1,501,0);state.botPlayerIndex=1;state.scores=[40,301];renderGame();quickScore(40);`);
  // legwissel 1200 ms + bot 600 ms (ongewijzigd) → bot begint op ±1,8 s, niet later: geen extra wachttijd
  const tb = await p.evaluate(`new Promise(function(res){var t0=performance.now();var iv=setInterval(function(){if(_x01BotOn){clearInterval(iv);res(Math.round(performance.now()-t0));}},10);setTimeout(function(){clearInterval(iv);res(-1)},6000);})`);
  ok(tb > 0 && tb <= 2100, `leg 2: bot begon ${tb} ms na de uitgooi (verwacht ±1800, zonder extra wachttijd)`);
  await wait(2400);
  const r = await p.evaluate(`({leg:state.currentLeg,h:state.history.length,p:state.history.map(function(h){return h.player}),c:state.currentPlayer,sub:_x01SubAt})`);
  ok(r.leg === 2 && r.h === 1 && r.p[0] === 1 && r.c === 0 && r.sub === 0, 'leg 2: bot begon en gooide, Tom aan de beurt ' + JSON.stringify(r));
  f = await p.evaluate(fb); ok(!f.undo && f.m === 'definitief', 'leg 2: botscore definitief ' + JSON.stringify(f));
  // Snelle dubbele invoer in een botpotje
  for (const gap of [80, 250, 380, 450]) {
    await p.evaluate(LB('[301,301]', `quickScore(60);setTimeout(function(){quickScore(45);numpadPress('4');numpadPress('5');numpadPress('enter')},${gap});`)); await wait(700);
    eq(await p.evaluate(`state.history.map(function(h){return state.players[h.player]+' '+h.score})`), ['Tom 60'], `botpotje, tweede invoer na ${gap} ms`);
  }
  // Mens na mens (Tom, Henk, Bot): geen wachttijd voor Henk, Tom's score blijft terug te zetten tot Henk indient (B6)
  await p.evaluate(`botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Henk','Bot'],true,'firstto',3,1,501,0);state.botPlayerIndex=2;renderGame();quickScore(60);`);
  await wait(4000);
  f = await p.evaluate(fb); ok(f.undo && !(await p.evaluate(isWin)) && /Henk gooit/.test(f.who), 'mens na mens: Ongedaan blijft, geen balk ' + JSON.stringify(f));
  await p.evaluate('quickScore(45)'); await wait(150); ok(await p.evaluate(isWin), 'Henk → bot: aftelbalk');
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
