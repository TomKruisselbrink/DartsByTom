// Fase 4C-0 — contrast volgens WCAG 2.1, gemeten in de app zelf (berekende CSS-waarden, geen kopie van de kleuren).
// Vier themastanden: donker en licht gekozen in de app, en automatisch met systeem donker/licht.
// Paren: contrast.pairs.json. Bekende uitzonderingen: contrast.allow.json (C1–C9).
// FAALT bij elke onvoldoende combinatie die niet in de uitzonderingen staat. Uitzonderingen worden apart gemeld, net als
// uitzonderingen die inmiddels wél voldoen ("mag uit de lijst"). De volledige matrix staat in de uitvoer en in
// tests/visual/out/contrast-rapport.json.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { browser, page, open, suite, ok } from './h.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAIRS = JSON.parse(fs.readFileSync(path.join(HERE, 'contrast.pairs.json'), 'utf8')).pairs;
const ALLOW = JSON.parse(fs.readFileSync(path.join(HERE, 'contrast.allow.json'), 'utf8')).uitzonderingen;
const THEMES = { 'donker': ['dark', 'dark'], 'licht': ['light', 'light'], 'auto-donker': ['dark', null], 'auto-licht': ['light', null] };

// Draait in de pagina: verzamelt alle bronkleuren als [r,g,b,a] (achtergronden als lijst = punten van het verloop).
const SOURCES = () => {
  const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    const h = String(c).trim().replace('#', ''); if (/^[0-9a-f]{3}$/i.test(h)) return [...h].map(x => parseInt(x + x, 16)).concat(1); if (/^[0-9a-f]{6}$/i.test(h)) return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(1); return null; };
  const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const root = getComputedStyle(document.documentElement), body = getComputedStyle(document.body);
  const v = (n, el) => (el ? getComputedStyle(el) : root).getPropertyValue(n).trim();
  // achtergrond: html-achtergrond, daarop body-kleur, daarop elke kleur uit de body-verlopen
  let base = parse(root.backgroundColor); if (!base || base[3] === 0) base = parse(v('--bg')) || [0, 0, 0, 1];
  base = base[3] < 1 ? over(base, [255, 255, 255, 1]) : base;
  const bc = parse(body.backgroundColor); const b2 = bc && bc[3] > 0 ? over(bc, base) : base;
  const stops = [b2].concat([...body.backgroundImage.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{3,6}\b/gi)].map(m => over(parse(m[0]), b2)));
  const onStops = c => { const p = parse(c); return p ? stops.map(s => over(p, s)) : null; };
  const probe = (parentSel, cls, prop) => { const par = document.querySelector(parentSel); if (!par) return null; const d = document.createElement('div'); d.className = cls; d.textContent = '20'; par.appendChild(d); const r = getComputedStyle(d)[prop]; d.remove(); return r; };
  const setup = document.getElementById('screen-setup');
  const tgt = document.querySelector('#screen-atc .g-target') || document.querySelector('.g-target');
  const tgtBg = tgt ? getComputedStyle(tgt).backgroundColor : v('--card');
  const toast = type => { const n0 = document.body.children.length; showToast('__ct_' + type, type); const el = [...document.body.children].slice(n0).find(e => (e.textContent || '').startsWith('__ct_')); const c = el ? el.style.background || getComputedStyle(el).backgroundColor : null; if (el) el.remove(); return c; };
  // dartbordkleuren uit de app-functie zelf
  let red = null, green = null, sRed = null, sGreen = null;
  for (let n = 1; n <= 20; n++) { const c = dartBadgeColor('T' + n), s = dartBadgeColor(String(n)); if (DART_RED_NUMS[n]) { red = red || c; sRed = sRed || s; } else { green = green || c; sGreen = sGreen || s; } }
  const players = []; for (let i = 0; i < 400 && players.length < 7; i++) { const c = _frColor('speler' + i); if (!players.includes(c)) players.push(c); }
  const S = {
    bg: stops, card: onStops(v('--card')), surface: onStops(v('--surface')),
    text: parse(v('--text')), muted: parse(v('--muted')), soft: parse(v('--su-soft', setup)),
    accentText: parse(v('--su-orange-text', setup)), hitText: parse(v('--su-green-text', setup)),
    missText: parse(probe('#screen-atc', 'g-miss', 'color')),
    targetBig: parse(probe('#screen-atc .g-target', 'g-target-big', 'color')), targetBg: onStops(tgtBg),
    white: [255, 255, 255, 1], accent: parse(v('--accent')), hitFill: parse(probe('#screen-atc', 'g-hit', 'backgroundColor')), danger: parse(v('--danger')),
    boardRed: parse(red), boardGreen: parse(green), singleRed: parse(sRed), singleGreen: parse(sGreen),
    stopText: parse(getComputedStyle(document.querySelector('#game-controls .gc-stop')).color), gameBar: onStops(getComputedStyle(document.getElementById('game-controls')).backgroundColor),
    team: (typeof AFG_TEAM_COLORS !== 'undefined' ? AFG_TEAM_COLORS : []).map(parse), player: players.map(parse),
    toastSuccess: toast('success'), toastWarning: toast('warning'), toastError: toast('error'), toastInfo: toast('info'),
  };
  for (const k of ['toastSuccess', 'toastWarning', 'toastError', 'toastInfo']) S[k] = S[k] ? onStops(S[k]) : null;
  const hex = c => c ? '#' + c.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  return { S, labels: { team: S.team.map(hex), player: S.player.map(hex) } };
};
const L = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const flat = c => c[3] < 1 ? null : c; // voorgrond moet dekkend zijn (alle tekstbronnen zijn dekkend)
const asList = x => !x ? null : Array.isArray(x[0]) ? x : [x];

const T = suite('contrast');
const b = await browser(); const report = {}; const exceptions = []; const solved = []; const notMeasured = [];
for (const [theme, [scheme, ls]] of Object.entries(THEMES)) {
  const { p, errs, ctx } = await page(b, { colorScheme: scheme, ls: ls ? { theme: ls } : {} });
  if (!ls) await p.addInitScript(() => localStorage.removeItem('theme'));
  await open(p, 900);
  const { S, labels } = await p.evaluate(SOURCES);
  await ctx.close();
  const rows = [];
  await T.t(`${theme}: alle paren voldoen (of zijn bekende uitzondering)`, () => {
    ok(!errs.length, 'pageerror: ' + errs[0]);
    const fails = [];
    for (const pr of PAIRS) {
      const fgs = asList(S[pr.fg]), bgs = asList(S[pr.bg]);
      if (!fgs || !bgs || fgs.some(x => !x) || bgs.some(x => !x)) { fails.push(`${pr.id}: bron niet gevonden (${!fgs || fgs.some(x => !x) ? pr.fg : pr.bg})`); continue; }
      // "elk": elke kleur in de set apart (team/speler); anders slechtste waarde over alle achtergrondpunten
      const items = pr.elk ? bgs.map((bgc, i) => ({ label: (labels[pr.bg] || [])[i], v: ratio(fgs[0], bgc) })) : [{ label: '', v: Math.min(...bgs.flatMap(bgc => fgs.map(fg => ratio(flat(fg) || fg, bgc)))) }];
      for (const it of items) {
        const id = pr.id + (it.label ? ' ' + it.label : ''); const pass = it.v >= pr.min;
        const al = ALLOW.find(a => a.pair === pr.id && a.themas.includes(theme) && (!a.waarden || a.waarden.includes(it.label)));
        rows.push({ id, v: +it.v.toFixed(2), min: pr.min, pass, c: al ? al.c : '' });
        if (!pass && al) exceptions.push(`${al.c}  ${theme.padEnd(11)} ${id.padEnd(30)} ${it.v.toFixed(2)} < ${pr.min}`);
        else if (!pass) fails.push(`${id} = ${it.v.toFixed(2)} (eis ${pr.min})`);
        else if (al) solved.push(`${al.c} ${theme} ${id} = ${it.v.toFixed(2)}: voldoet nu, mag uit de lijst`);
      }
    }
    report[theme] = rows;
    ok(!fails.length, 'NIEUWE contrastfout: ' + fails.join('; '));
  });
}
await b.close();
for (const a of ALLOW) if (!PAIRS.some(p => p.id === a.pair)) notMeasured.push(`${a.c} ${a.pair}: nog niet meetbaar (${a.reden})`);
// Matrix in de uitvoer
const ids = report['donker'] ? report['donker'].map(r => r.id) : [];
console.log('\nCONTRASTMATRIX (laagste waarde over het verloop; * = onder de eis)');
console.log('paar'.padEnd(32) + Object.keys(THEMES).map(t => t.padStart(12)).join('') + '   eis');
for (const id of ids) {
  const cells = Object.keys(THEMES).map(t => { const r = (report[t] || []).find(x => x.id === id); return r ? ((r.pass ? '' : '*') + r.v.toFixed(2) + (r.c ? ' ' + r.c : '')).padStart(12) : '-'.padStart(12); });
  const r0 = report['donker'].find(x => x.id === id); console.log(id.padEnd(32) + cells.join('') + '   ' + r0.min);
}
console.log(`\nUITZONDERINGEN (${exceptions.length}, bekend, falen niet):\n  ` + (exceptions.join('\n  ') || '-'));
if (solved.length) console.log('\nMAG UIT DE LIJST:\n  ' + solved.join('\n  '));
if (notMeasured.length) console.log('\nNOG NIET MEETBAAR:\n  ' + notMeasured.join('\n  '));
try { const out = path.join(HERE, '../visual/out'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'contrast-rapport.json'), JSON.stringify({ report, exceptions, solved, notMeasured }, null, 1)); } catch (e) { /* rapport is extra */ }
process.exit(T.done());
