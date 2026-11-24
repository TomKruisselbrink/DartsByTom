// Herstel 4D-1a — contrast van de ECHTE tekst in de X01-spelerskaarten, vooral de actieve kaart (beurtvlak).
// Waarom apart: contrast.mjs meet kleurparen (tokens) op een vaste set achtergronden (pagina, kaart, vlak). Het beurtvlak
// (--state-turn) zit daar niet bij en die test kijkt niet naar elementen. Daardoor bleef "legs" op de actieve kaart
// (--text-muted op --state-turn, licht 3,51) onopgemerkt. Deze test meet per zichtbaar tekstelement in #sb-players de
// voorgrondkleur (× opacity van de keten) op de samengestelde achtergrondketen boven elk punt van het pagina-verloop.
// Buiten deze test: tekst in de routebadges (dartbordkleuren, zie contrast.mjs).
// Eis: 4,5 voor gewone tekst; 3 voor grote tekst (≥ 24 px, of ≥ 18,66 px vet). Geen allowlist: alles moet voldoen.
// Situaties: 2, 4 (compact) en 6 spelers met legstand, teams; telefoon (390×844) en kantine (1920×1080); vier themastanden.
import { browser, page, open, suite, ok } from './h.mjs';
const T = suite('contrast-beurt');
const THEMES = { 'donker': ['dark', 'dark'], 'licht': ['light', 'light'], 'auto-donker': ['dark', null], 'auto-licht': ['light', null] };
const P4 = "['Tom','Henk','Imke','Jorn']", P6 = "['Tom','Henk','Imke','Jorn','Anna','Bas']";
const SC = {
  '2 spelers': `launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.legWins=[1,0];state.scores=[121,140];state.history=[{player:0,score:60}];renderGame();`,
  '4 spelers': `launchGame('501',${P4},true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[501,301,96,170];renderGame();`,
  '6 spelers': `launchGame('501',${P6},true,'firstto',3,1,501,0);state.legWins=[0,1,0,2,0,0];state.scores=[121,301,96,170,501,40];renderGame();`,
  'teams': `_pendingTeams=[0,1,0,1];launchGame('501',${P4},false,'firstto',3,1,501,0);`,
};
const VPS = [[390, 844], [1920, 1080]];
const MEASURE = () => {
  const P = s => { const m = String(s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return [a[0], a[1], a[2], a.length > 3 ? a[3] : 1]; };
  const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  // pagina-achtergrond: html, body-kleur, en elke kleur uit de body-verlopen (zelfde aanpak als contrast.mjs)
  const root = getComputedStyle(document.documentElement), body = getComputedStyle(document.body);
  let base = P(root.backgroundColor); if (!base || base[3] === 0) base = P(root.getPropertyValue('--bg')) || [0, 0, 0, 1];
  if (base[3] < 1) base = over(base, [255, 255, 255, 1]);
  const bc = P(body.backgroundColor); const b2 = bc && bc[3] > 0 ? over(bc, base) : base;
  const stops = [b2].concat([...body.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m => over(P(m[0]), b2)));
  const out = [];
  for (const card of document.querySelectorAll('#sb-players .x-card')) {
    // Routebadges (.co-hint) staan op dartbordkleuren: die bewaakt contrast.mjs als paar wit/bord-rood en wit/bord-groen
    // (met classificatie). Hier niet dubbel, anders faalt deze test op een bestaand, elders vastgelegd probleem.
    const els = [...card.querySelectorAll('*')].filter(e => !e.closest('.co-hint') && e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    for (const el of els) {
      // eigen vulkleur (label, routebadges) telt mee als achtergrond
      const chain = []; let op = 1;
      for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); const c = P(cs.backgroundColor); if (c && c[3] > 0) chain.unshift(c); op *= Number(cs.opacity); }
      const cs = getComputedStyle(el); const fg = P(cs.color); fg[3] *= op;
      const v = Math.min(...stops.map(s => { let bg = s; for (const c of chain) bg = over(c, bg); return ratio(over(fg, bg), bg); }));
      const px = parseFloat(cs.fontSize), w = Number(cs.fontWeight) || 400;
      const groot = px >= 24 || (px >= 18.66 && w >= 700);
      out.push({ actief: card.classList.contains('on'), cls: String(el.className || el.tagName).slice(0, 20), tekst: el.textContent.trim().slice(0, 16), px, v: +v.toFixed(2), min: groot ? 3 : 4.5 });
    }
  }
  return out;
};
const b = await browser();
for (const [theme, [scheme, ls]] of Object.entries(THEMES)) {
  const { p, errs, ctx } = await page(b, { colorScheme: scheme, ls: ls ? { theme: ls } : {} });
  if (!ls) await p.addInitScript(() => localStorage.removeItem('theme'));
  await open(p, 900);
  // overgangen en animaties uit: anders meet de test onder belasting soms een tussenkleur (score-animatie, themaovergang)
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  for (const [w, h] of VPS) {
    await p.setViewportSize({ width: w, height: h });
    await T.t(`${theme} ${w}×${h}: alle tekst in de X01-spelerskaarten voldoet (actieve kaart apart gemeld)`, async () => {
      const fails = []; let actief = 0;
      for (const [naam, setup] of Object.entries(SC)) {
        await p.evaluate(setup); await p.waitForTimeout(250);
        const r = await p.evaluate(MEASURE);
        actief += r.filter(x => x.actief).length;
        for (const x of r) if (x.v < x.min) fails.push(`${naam}: ${x.actief ? 'ACTIEF ' : ''}${x.cls} "${x.tekst}" ${x.px}px = ${x.v} (eis ${x.min})`);
      }
      ok(!errs.length, 'pageerror: ' + errs[0]);
      ok(actief >= 12, 'te weinig tekst gemeten op de actieve kaart (' + actief + '): meet de test nog wel?');
      ok(!fails.length, fails.join('; '));
    });
  }
  await ctx.close();
}
await b.close();
process.exit(T.done());
