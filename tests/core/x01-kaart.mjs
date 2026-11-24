// Herstel 4D-1a — X01-spelerskaart: niets afgekapt, essentiële informatie zichtbaar, kantine-legstand niet kleiner dan zijn woord.
// (1) Telefoon en tablet, 3/4/6 spelers en teams, NL en EN: naam, gemiddelde, "niet uitgooibaar" en het GOOIT-label worden
//     nergens afgekapt (scrollWidth ≤ clientWidth, label binnen de kaart); "niet uitgooibaar" staat er als de actieve speler
//     niet kan uitgooien (behalve bij 5–6 spelers op schermen ≤ 740 px hoog: daar vervalt de hele meta, zoals in faf50f0).
// (2) Kantine (liggend ≥ 1600 px): het legsgetal is minstens zo groot als het woord "legs", bij 2, 4 en 6 spelers; de regel
//     'niet uitgooibaar' is even groot als de meta-regel (K12: ≥ 15 px).
// Bekende rest (Tom geïnformeerd): sets + 3–4 spelers op 390 in het Nederlands met een gemiddelde ≥ 10 past niet (± 5 px);
// dat geval zit bewust niet in de matrix hieronder.
import { browser, page, open, suite, ok } from './h.mjs';
const T = suite('x01-kaart');
const P3 = "['Tom','Henk','Imke']", P4 = "['Tom','Henk','Imke','Jorn']", P6 = "['Tom','Henk','Imke','Jorn','Anna','Bas']";
const AVG = "state.history=[];for(var i=0;i<4;i++)for(var k=0;k<state.players.length;k++)state.history.push({player:k,score:[100,60,81,45][i]});";
const L = (p, sc, lw, extra) => `launchGame('501',${p},true,'firstto',3,1,501,0);state.legWins=${lw};state.scores=${sc};${extra || ''}renderGame();`;
const SC = {
  // F12 (24-11): 2 spelers, met en zonder legstand
  '2 sp begin (niet uitgooibaar, legstand)': [`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);renderGame();`, true],
  '2 sp begin (niet uitgooibaar, 1 leg)': [`launchGame('501',['Tom','Henk'],true,'firstto',1,1,501,0);renderGame();`, true],
  '2 sp 181 met route ernaast, gemiddelden': [L("['Tom','Henk']", '[181,140]', '[1,2]', AVG), true],
  '2 sp 121 (wel uitgooibaar)': [L("['Tom','Henk']", '[121,140]', '[1,2]', AVG), false],
  '3 sp begin (niet uitgooibaar)': [L(P3, '[501,501,501]', '[0,0,0]'), true],
  '4 sp route, gemiddelden': [L(P4, '[121,140,96,170]', '[2,1,0,2]', AVG), false],
  '4 sp niet uitgooibaar, gemiddelden': [L(P4, '[181,140,96,170]', '[2,1,0,2]', AVG), true],
  '4 sp gemiddelde ≥ 100': [L(P4, '[121,140,96,170]', '[2,1,0,2]', "state.history=[];for(var k=0;k<4;k++)state.history.push({player:k,score:180},{player:k,score:121});"), false],
  'teams begin': [`_pendingTeams=[0,1,0,1];launchGame('501',${P4},false,'firstto',3,1,501,0);`, true],
  '6 sp begin': [L(P6, '[501,501,501,501,501,501]', '[0,1,0,2,0,0]'), true],
  '6 sp route': [L(P6, '[121,301,96,170,501,40]', '[0,1,0,2,0,0]', AVG), false],
};
const CHECK = () => {
  const tr = e => !!e && !!e.offsetParent && e.scrollWidth > e.clientWidth + 1;
  const out = [];
  for (const c of document.querySelectorAll('#sb-players .x-card')) {
    const nm = (c.querySelector('.x-nm') || {}).textContent;
    for (const s of ['.x-nm', '.x-meta', '.x-imp']) if (tr(c.querySelector(s))) out.push(nm + ' ' + s + ' afgekapt');
    // label: binnen elke voorouder (tot en met de kaart) die zijn inhoud afsnijdt, waar het label ook staat
    const t = c.querySelector('.x-turn');
    if (t && t.offsetParent) { const a = t.getBoundingClientRect();
      for (let e = t.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e);
        if (cs.overflow !== 'visible' || e === c) { const r = e.getBoundingClientRect(); if (a.right > r.right + 0.5 || a.left < r.left - 0.5) { out.push(nm + ' GOOIT-label afgesneden'); break; } }
        if (e === c) break; } }
  }
  // 'niet uitgooibaar' telt als zichtbaar als het in een zichtbaar element staat dat niet afkapt (eigen regel of meta-regel)
  const on = document.querySelector('#sb-players .x-card.on'), meta = on && on.querySelector('.x-meta');
  const IMP = /niet uitgooibaar|no checkout/i;
  const imp = [...on.querySelectorAll('.x-imp,.x-meta')].some(e => e.offsetParent && IMP.test(e.textContent) && !tr(e));
  const impTekst = IMP.test(on.textContent);
  return { fouten: out, imp, impTekst, metaVis: !!(meta && meta.offsetParent) };
};
const b = await browser();
for (const lang of ['nl', 'en']) {
  const { p, errs, ctx } = await page(b, { ls: { lang } });
  await open(p, 900);
  for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024], [1024, 768]]) {
    await p.setViewportSize({ width: w, height: h });
    await T.t(`${lang.toUpperCase()} ${w}×${h}: niets afgekapt in de spelerskaarten; 'niet uitgooibaar' zichtbaar als het geldt`, async () => {
      const fails = [];
      for (const [naam, [setup, imp]] of Object.entries(SC)) {
        await p.evaluate(setup); await p.waitForTimeout(120);
        const r = await p.evaluate(CHECK);
        fails.push(...r.fouten.map(f => naam + ': ' + f));
        if (imp && r.metaVis && !r.imp) fails.push(naam + ": 'niet uitgooibaar' ontbreekt of is afgekapt");
        if (!imp && r.impTekst) fails.push(naam + ": 'niet uitgooibaar' staat er onterecht");
      }
      ok(!errs.length, 'pageerror: ' + errs[0]);
      ok(!fails.length, fails.join('; '));
    });
  }
  await ctx.close();
}
// (1b) Reparatie iPhone (24-11): de regel 'niet uitgooibaar' / 'no checkout' staat volledig op één regel over de volle
//      kaartbreedte, op alle gangbare iPhone-maten, bij 2 (F12), 3 en 4 spelers. Ook de opbouw wordt gecontroleerd: een eigen benoemde
//      rasterrij ('imp') en geen afkapstijl (nowrap/ellipsis). In Safari gaf de oude opbouw (impliciete rij, grid-column:1/-1)
//      alleen de breedte naast de score ("niet uitgooibaa…"); Chromium toont dat verschil niet, dus de opbouw zelf wordt bewaakt.
{
  const IMPSC = { '2 spelers (legstand)': `launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);renderGame();`, '2 spelers (1 leg)': `launchGame('501',['Tom','Henk'],true,'firstto',1,1,501,0);renderGame();`, '3 spelers': `launchGame('501',${P3},true,'firstto',3,1,501,0);renderGame();`, '4 spelers': L(P4, '[501,501,501,501]', '[2,1,0,2]', AVG) };
  for (const lang of ['nl', 'en']) {
    const { p, errs, ctx } = await page(b, { ls: { lang } });
    await open(p, 900);
    await T.t(`${lang.toUpperCase()} iPhone-maten, 2/3/4 spelers: '${lang === 'nl' ? 'niet uitgooibaar' : 'no checkout'}' volledig, één regel, volle kaartbreedte, eigen rasterrij`, async () => {
      const fails = [];
      for (const [w, h] of [[360, 640], [375, 667], [375, 812], [390, 844], [393, 852], [402, 874], [414, 896], [430, 932], [440, 956]]) {
        await p.setViewportSize({ width: w, height: h });
        for (const [naam, setup] of Object.entries(IMPSC)) {
          await p.evaluate(setup); await p.waitForTimeout(100);
          const r = await p.evaluate(() => { const c = document.querySelector('#sb-players .x-card.on'), e = c && c.querySelector('.x-imp'); if (!e || !e.offsetParent) return null;
            const cs = getComputedStyle(e), kc = getComputedStyle(c), er = e.getBoundingClientRect(), cr = c.getBoundingClientRect();
            const inner = c.clientWidth - parseFloat(kc.paddingLeft) - parseFloat(kc.paddingRight);
            return { tekst: e.textContent.trim(), w: er.width, inner, h: er.height, fs: parseFloat(cs.fontSize), lh: parseFloat(cs.lineHeight), trunc: e.scrollWidth > e.clientWidth + 1,
              binnen: er.left >= cr.left - 0.5 && er.right <= cr.right + 0.5, rij: cs.gridRowStart, ws: cs.whiteSpace, to: cs.textOverflow }; });
          const id = `${w}×${h} ${naam}`;
          if (!r) { fails.push(id + ': regel ontbreekt'); continue; }
          const doel = lang === 'nl' ? 'niet uitgooibaar' : 'no checkout';
          if (r.tekst !== doel) fails.push(`${id}: tekst "${r.tekst}" ≠ "${doel}"`);
          if (r.trunc) fails.push(id + ': afgekapt');
          if (r.h > r.lh * 1.5) fails.push(`${id}: niet op één regel (${Math.round(r.h)} px hoog)`);
          if (r.w < r.inner - 1) fails.push(`${id}: regel ${Math.round(r.w)} px, kaart ${Math.round(r.inner)} px (niet de volle breedte)`);
          if (!r.binnen) fails.push(id + ': buiten de kaart');
          if (r.rij !== 'imp') fails.push(`${id}: niet in de benoemde rij 'imp' (grid-row-start ${r.rij})`);
          if (r.ws === 'nowrap' || r.to === 'ellipsis') fails.push(`${id}: afkapstijl (${r.ws}/${r.to})`);
        }
      }
      ok(!errs.length, 'pageerror: ' + errs[0]);
      ok(!fails.length, fails.join('; '));
    });
    await ctx.close();
  }
}
// (2) kantine
{
  const { p, errs, ctx } = await page(b, { viewport: { width: 1920, height: 1080 } });
  await open(p, 900);
  for (const [w, h] of [[1920, 1080], [1600, 900], [2560, 1440]]) {
    await p.setViewportSize({ width: w, height: h });
    await T.t(`kantine ${w}×${h}: legsgetal ≥ woord 'legs' bij 2, 4 en 6 spelers; 'niet uitgooibaar' ≥ 15 px`, async () => {
      const fails = [];
      for (const [naam, setup] of [['2 sp', L("['Tom','Henk']", '[121,140]', '[1,0]')], ['4 sp', L(P4, '[121,140,96,170]', '[2,1,0,2]')], ['6 sp', L(P6, '[121,301,96,170,501,40]', '[0,1,0,2,0,0]')]]) {
        await p.evaluate(setup); await p.waitForTimeout(120);
        const r = await p.evaluate(() => [...document.querySelectorAll('#sb-players .x-lg')].map(g => [parseFloat(getComputedStyle(g.querySelector('b')).fontSize), parseFloat(getComputedStyle(g.querySelector('small')).fontSize)]));
        ok(r.length, naam + ': geen legstand gevonden');
        for (const [nb, ns] of r) if (nb < ns) fails.push(`${naam}: getal ${nb}px < woord ${ns}px`);
      }
      // 'niet uitgooibaar' (eigen regel bij 3+ spelers) volgt op de kantine dezelfde maat als de meta-regel (K12: ≥ 15 px)
      await p.evaluate(L(P4, '[181,140,96,170]', '[2,1,0,2]')); await p.waitForTimeout(120);
      const im = await p.evaluate(() => { const e = document.querySelector('#sb-players .x-card.on .x-imp'), m = document.querySelector('#sb-players .x-card.on .x-meta'); return e && [parseFloat(getComputedStyle(e).fontSize), parseFloat(getComputedStyle(m).fontSize)]; });
      ok(im, "4 sp: regel 'niet uitgooibaar' niet gevonden");
      if (im[0] < 15 || im[0] < im[1]) fails.push(`4 sp: 'niet uitgooibaar' ${im[0]}px (meta ${im[1]}px, eis ≥ 15 en ≥ meta)`);
      ok(!errs.length, 'pageerror: ' + errs[0]);
      ok(!fails.length, fails.join('; '));
    });
  }
  await ctx.close();
}
await b.close();
process.exit(T.done());
