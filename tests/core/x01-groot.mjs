// 4D-1c — X01 op grote liggende schermen (≥ 1000 px liggend): scorebord met banen (1–3 spelers) en tegels (4–6),
// matchbalk met Stats/Stop rechtsboven, uitgooiroute in de kaart van de speler die gooit, invoerdock rechts.
// Besluiten Tom 25-11 (B1–B6). Controleert opbouw, minimale maten, de bijzondere situaties (toernooi, sets, teams,
// lange namen, niet uitgooibaar, bot) en de terugvaloptie zonder containermaten (html.x01-nocq).
// Telefoon: de route in de kaart bestaat daar niet (de telefoon blijft pixel-gelijk; dat bewaakt de visuele test).
import { browser, page, open, suite, ok, eq, wait } from './h.mjs';
const T = suite('x01-groot');
const b = await browser();
const AVG = n => `state.history=[];for(var i=0;i<4;i++)for(var k=0;k<${n};k++)state.history.push({player:k,score:[100,60,81,45][i],remaining:501,newRemaining:401});`;
const NAMES = ['Tom', 'Jorn', 'Imke', 'Henk', 'Sanne', 'Bas'];
const LN = ['Maximiliaan van Bergenhe', 'Alexandra Vermeulen-Dijk', 'Christiaan de Groot-Haan', 'Wilhelmina Oosterhuisman', 'Bartholomeus Janssen-Kip', 'Femke van der Steenhoven'];
const SCORES = [141, 227, 96, 310, 255, 230];
const L = (n, names = NAMES, sc = SCORES, extra = '') => `launchGame('501',${JSON.stringify(names.slice(0, n))},true,'firstto',3,1,501,0);state.legWins=${JSON.stringify([1, 0, 1, 0, 0, 0].slice(0, n))};state.scores=${JSON.stringify(sc.slice(0, n))};${AVG(n)}${extra}renderGame();`;
// Meting in de pagina: opbouw + afkap/overlap/buiten de kaart
const MEET = () => {
  const vis = e => e && e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0;
  const sb = document.getElementById('sb-players'), cards = [...sb.querySelectorAll('.x-card')], on = sb.querySelector('.x-card.on');
  const cols = new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size;
  const area = cards.reduce((a, c) => { const r = c.getBoundingClientRect(); return a + r.width * r.height; }, 0) / (innerWidth * innerHeight);
  const bad = [];
  cards.forEach((c, i) => { const cr = c.getBoundingClientRect();
    for (const s of ['.x-meta', '.x-imp', '.x-turn', '.x-route', '.x-legs', '.co-hint', '.x-top']) { const e = c.querySelector(s); if (vis(e) && e.scrollWidth > e.clientWidth + 1) bad.push(i + s + ' afgekapt'); }
    const els = [...c.querySelectorAll('.x-top,.x-legs,.x-score,.x-route,.x-meta,.x-imp,.co-hint')].filter(e => vis(e) && e.textContent.trim());
    for (const e of els) { const r = e.getBoundingClientRect(); if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) bad.push(i + '.' + e.className.split(' ')[0] + ' buiten de kaart'); }
    for (let a = 0; a < els.length; a++) for (let k = a + 1; k < els.length; k++) { const A = els[a].getBoundingClientRect(), B = els[k].getBoundingClientRect();
      if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 2 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 2) bad.push(i + ':' + els[a].className.split(' ')[0] + '×' + els[k].className.split(' ')[0]); } });
  const hd = document.getElementById('x01-head'); if (hd.scrollWidth > hd.clientWidth + 1) bad.push('matchbalk afgekapt');
  if (document.scrollingElement.scrollHeight > innerHeight + 2) bad.push('scrollt');
  const fs = e => e ? parseFloat(getComputedStyle(e).fontSize) : 0;
  const route = on && on.querySelector('.x-route .co-big');
  const acts = [...document.querySelectorAll('.x01-act')].filter(vis);
  const key = document.querySelector('#screen-game .x01-pad .btn').getBoundingClientRect(), side = document.getElementById('x01-side').getBoundingClientRect();
  return { n: cards.length, cols, area, bad, score: fs(on && on.querySelector('.x-score')), route: route && vis(route) ? fs(route) : 0, routeTxt: on && on.querySelector('.x-route') && vis(on.querySelector('.x-route')) ? on.querySelector('.x-route').textContent : '',
    hint: on ? on.querySelector('.co-hint').getBoundingClientRect().height : 0, mid: vis(document.getElementById('checkout-strip')),
    actsInHead: acts.length === 2 && acts.every(a => a.closest('#x01-head') && a.getBoundingClientRect().right > innerWidth * .9), dot: vis(on && on.querySelector('.x-dot')), stripe: on ? getComputedStyle(on, '::before').content !== 'none' && getComputedStyle(on, '::before').width !== 'auto' : false,
    offOpacity: (() => { const o = sb.querySelector('.x-card:not(.on) .x-score'); return o ? parseFloat(getComputedStyle(o).opacity) : 1; })(), keyH: key.height, sideW: side.width, nocq: document.documentElement.classList.contains('x01-nocq') };
};
const NOANIM = '*,*::before,*::after{transition:none!important;animation:none!important}'; // scorerol en dekking niet halverwege meten
const pg = await page(b, { viewport: { width: 1920, height: 1080 } }); const p = pg.p; await open(p, 700); await p.addStyleTag({ content: NOANIM });

await T.t('telefoon en tablet staand: geen route in de kaart, uitgooivak zoals voorheen, Stats/Stop in de kop', async () => {
  for (const [w, h] of [[390, 844], [768, 1024]]) {
    await p.setViewportSize({ width: w, height: h }); await p.evaluate(L(2)); await wait(150);
    const r = await p.evaluate(() => ({ route: !!document.querySelector('#sb-players .x-route') && getComputedStyle(document.querySelector('#sb-players .x-route')).display, strip: getComputedStyle(document.getElementById('checkout-strip')).display, nocq: document.documentElement.classList.contains('x01-nocq') }));
    eq([r.route, r.strip, r.nocq], ['none', 'flex', false], `${w}×${h}`);
  }
});

const MIN = { // minimale scoregrootte (px) per formaat en aantal spelers (regressiegrens, iets onder de gemeten waarde)
  '1024x768': { 1: 160, 2: 160, 3: 140, 4: 130, 6: 85 }, '1280x800': { 1: 220, 2: 210, 3: 150, 4: 140, 6: 90 },
  '1920x1080': { 1: 400, 2: 290, 3: 210, 4: 190, 6: 133 }, '2560x1440': { 1: 440, 2: 400, 3: 290, 4: 260, 6: 175 } };
for (const nocq of [false, true]) {
  await T.t(`${nocq ? 'zonder containermaten (terugval): ' : ''}banen/tegels, matchbalk, route in de kaart, maten (1024–2560, 1–6 spelers)`, async () => {
    const fails = [];
    for (const vp of Object.keys(MIN)) { const [w, h] = vp.split('x').map(Number); await p.setViewportSize({ width: w, height: h });
      for (const n of [1, 2, 3, 4, 6]) {
        await p.evaluate(nc => document.documentElement.classList.toggle('x01-nocq', nc), nocq); await p.evaluate(L(n)); await wait(120);
        const r = await p.evaluate(MEET); const id = `${vp} ${n}sp`;
        if (r.cols !== (n <= 3 ? 1 : 2)) fails.push(`${id}: ${r.cols} kolommen`);
        if (r.area < .45) fails.push(`${id}: kaarten ${Math.round(r.area * 100)} % van het scherm`);
        if (r.score < MIN[vp][n] * (nocq ? .85 : 1)) fails.push(`${id}: score ${r.score}px < ${MIN[vp][n]}`);
        if (r.route < 18) fails.push(`${id}: route ${r.route}px (< 18)`);
        if (r.mid) fails.push(`${id}: los uitgooivak zichtbaar`);
        if (!r.actsInHead) fails.push(`${id}: Stats/Stop niet in de matchbalk`);
        if (r.dot || !r.stripe) fails.push(`${id}: beurtmarkering (stip ${r.dot}, streep ${r.stripe})`);
        if (n > 1 && Math.abs(r.offOpacity - .72) > .001) fails.push(`${id}: dekking niet-actief ${r.offOpacity}`);
        if (r.keyH > 160.5 || r.keyH < 56) fails.push(`${id}: toets ${r.keyH}px hoog`);
        if (r.sideW > 600.5) fails.push(`${id}: dock ${r.sideW}px breed`);
        if (r.bad.length) fails.push(`${id}: ${r.bad.join(', ')}`);
      } }
    await p.evaluate(() => document.documentElement.classList.remove('x01-nocq'));
    ok(!fails.length, fails.join('; '));
  });
}

await T.t('ontwerpdoel 40′ op 6 m (65″, 0,75 mm/px): score bij 1920×1080 voor 2–6 spelers ≥ 133 px', async () => {
  await p.setViewportSize({ width: 1920, height: 1080 }); const out = [];
  for (const n of [2, 3, 4, 6]) { await p.evaluate(L(n)); await wait(100); const s = await p.evaluate(MEET); out.push(Math.round(s.score)); }
  ok(out.every(s => s >= 133), 'scores ' + out.join('/'));
});

const SPECIAAL = {
  'toernooi': `trnPlayers=['Tom','Jorn','Imke','Henk'];trnFormat='roundrobin';trnBO=3;trnDoubleOut=true;trnGame=501;startTournament();[...document.querySelectorAll('#screen-trn-overview button')].find(b=>/Speel leg/.test(b.textContent)).click();trnChooseStart(0);trnConfirmStart();state.scores=[141,227];${AVG(2)}renderGame();`,
  'sets': `launchGame('501',['Tom','Jorn'],true,'firstto',3,3,501,0);state.setWins=[1,0];state.legsInSet=[1,2];state.scores=[141,227];${AVG(2)}renderGame();`,
  'teams': `_pendingTeams=[0,1,0,1];launchGame('501',['Tom','Jorn','Imke','Henk'],true,'firstto',3,1,501,0);state.scores=[141,227,141,227];${AVG(4)}renderGame();`,
  'lange namen 2': L(2, LN), 'lange namen 3': L(3, LN), 'lange namen 4': L(4, LN), 'lange namen 6': L(6, LN),
  'niet uitgooibaar 2': L(2, NAMES, [169, 227]), 'niet uitgooibaar 4': L(4, NAMES, [169, 227, 96, 310]), 'niet uitgooibaar 6': L(6, LN, [169, 227, 96, 310, 255, 230]),
  'bot': `botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Bot'],true,'firstto',3,1,501,0);state.botPlayerIndex=1;state.scores=[141,227];${AVG(2)}renderGame();`,
};
for (const nocq of [false, true]) {
  await T.t(`${nocq ? 'zonder containermaten: ' : ''}bijzondere situaties (toernooi, sets, teams, lange namen, niet uitgooibaar, bot): niets afgekapt, overlappend of buiten de kaart`, async () => {
    const fails = [];
    for (const [w, h] of [[1024, 768], [1280, 800], [1920, 1080], [2560, 1440]]) { await p.setViewportSize({ width: w, height: h });
      for (const [id, js] of Object.entries(SPECIAAL)) {
        await p.evaluate(nc => document.documentElement.classList.toggle('x01-nocq', nc), nocq); await p.evaluate(() => { showScreen('screen-home'); });
        await p.evaluate(js); await wait(150);
        const r = await p.evaluate(MEET); const extra = await p.evaluate(() => ({ trn: (document.getElementById('trn-leg-bar').offsetParent ? document.getElementById('trn-leg-bar').getBoundingClientRect().height : 0), imp: !!document.querySelector('#sb-players .x-imp'), scr: document.querySelector('.screen.active').id }));
        if (extra.scr !== 'screen-game') { fails.push(`${w} ${id}: scherm ${extra.scr}`); continue; }
        if (r.bad.length) fails.push(`${w} ${id}: ${r.bad.join(', ')}`);
        if (id === 'toernooi' && !extra.trn) fails.push(`${w} toernooi: balk ontbreekt`);
        if (id.startsWith('niet uitgooibaar') && !extra.imp) fails.push(`${w} ${id}: melding ontbreekt`);
      } }
    await p.evaluate(() => document.documentElement.classList.remove('x01-nocq'));
    ok(!pg.errs.length, 'pageerror: ' + pg.errs[0]); ok(!fails.length, fails.join('; '));
  });
}

await T.t('Engels: label en route in de kaart vertaald ("Checkout"), matchbalk past', async () => {
  const q = await page(b, { ls: { lang: 'en' }, viewport: { width: 1920, height: 1080 } }); await open(q.p, 700); await q.p.addStyleTag({ content: NOANIM });
  await q.p.evaluate(L(2)); await wait(250); const r = await q.p.evaluate(MEET);
  ok(/Checkout/i.test(r.routeTxt) && !r.bad.length, JSON.stringify({ t: r.routeTxt, bad: r.bad })); await q.ctx.close();
});
process.exit(T.done());
