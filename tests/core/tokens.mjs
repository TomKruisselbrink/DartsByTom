// Fase 4C-1 — ontwerpsysteem-tokens: bestaan ze, en hebben ze exact de waarde van hun bron?
// Statisch: elke letterlijke tokenwaarde komt elders in index.html al voor (geen nieuwe kleuren/maten), geen dubbele namen.
// In de browser, in 4 themastanden (donker/licht gekozen, automatisch donker/licht): elk kleur-/schaduw-/opacity-token
// geeft na berekening precies dezelfde waarde als de bestaande regel waar het voor staat.
import fs from 'fs'; import path from 'path';
import { browser, page, open, suite, ok } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
const T = suite('tokens');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const START = '/* ═══ Ontwerpsysteem-tokens (fase 4C-1) ═══', END = '/* ─── DESIGN TOKENS ─── */';
const i0 = src.indexOf(START), i1 = src.indexOf(END, i0);
const block = i0 >= 0 && i1 > i0 ? src.slice(i0, i1) : '';
const rest = src.slice(0, i0) + src.slice(i1);

await T.t('tokenblok staat in index.html', () => ok(block.length > 500, 'tokenblok niet gevonden'));
const rootBody = (block.match(/:root\{([\s\S]*?)\n\}/) || [])[1] || '';
const decl = [...rootBody.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]);
await T.t('geen dubbele tokennamen, en geen naam die elders al bestond', () => {
  const names = decl.map(d => d[0]); const dup = names.filter((n, i) => names.indexOf(n) !== i);
  ok(names.length >= 60, 'te weinig tokens gevonden (' + names.length + ')');
  ok(!dup.length, 'dubbel: ' + dup.join(', '));
  const clash = names.filter(n => new RegExp(n.replace(/[-]/g, '\\-') + '\\s*:').test(rest));
  ok(!clash.length, 'naam bestond al buiten het tokenblok: ' + clash.join(', '));
});
// Gebruik (sinds 4C-2): elk token wordt gebruikt buiten het tokenblok, of via een ander gebruikt token, of staat hieronder met reden.
const UNUSED_OK = {
  '--terra-500': 'paletanker; regels gebruiken --accent (zelfde vaste waarde). In 4C-3 wordt dit de bron van --accent',
  '--red-500': 'paletanker; regels gebruiken --danger (zelfde vaste waarde). In 4C-3 wordt dit de bron van --danger',
  '--state-win': 'geen CSS-regel met een eenduidige winnaarskleur; winst-tags gebruiken andere bestaande waarden (4D)',
  '--fw-regular': 'de CSS gebruikt nergens font-weight:400 (Regular komt van de standaard); paar van --fw-bold',
  '--z-banner-top': 'z-index 9000 staat inline in de HTML (#upd-banner), buiten 4C-2 (stap 4X)',
  '--z-modal': 'z-index 9997 staat inline in de HTML (#double-modal), buiten 4C-2 (stap 4X)',
  '--z-toast': 'z-index 9999 van meldingen staat in JS (showToast), buiten 4C-2 (stap 4X)',
};
await T.t('elk token wordt gebruikt, of staat met reden op de lijst van nog ongebruikte tokens', () => {
  const names = decl.map(d => d[0]);
  const useOut = n => new RegExp('var\\(' + n.replace(/-/g, '\\-') + '\\)').test(rest);
  const used = new Set(names.filter(useOut));
  // ook de lichte overrides in het blok tellen mee (sinds 4C-3 verwijst bijv. --tag-text in licht naar --green-700)
  const lightDecl = [...block.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]);
  let grew = true; while (grew) { grew = false; for (const [n, v] of decl.concat(lightDecl)) if (used.has(n)) for (const m of v.matchAll(/var\((--[\w-]+)\)/g)) if (!used.has(m[1])) { used.add(m[1]); grew = true; } }
  const unused = names.filter(n => !used.has(n));
  const bad = unused.filter(n => !UNUSED_OK[n]);
  ok(!bad.length, 'ongebruikt zonder reden: ' + bad.join(', '));
  const stale = Object.keys(UNUSED_OK).filter(n => used.has(n) || !names.includes(n));
  ok(!stale.length, 'staat op de lijst maar wordt nu gebruikt of bestaat niet meer (haal weg): ' + stale.join(', '));
  console.log(`  tokens: ${names.length}, gebruikt ${names.filter(n => used.has(n)).length}, nog ongebruikt met reden ${unused.length}: ${unused.join(', ')}`);
});

// Referentie voor "geen nieuwe waarden" is de goedgekeurde versie faf50f0 (sinds 4C-2 staan veel waarden alleen nog in het tokenblok).
let REF = '';
const REPO = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname)));
try { REF = (await import('child_process')).execSync('git show faf50f0:index.html', { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { REF = ''; }
await T.t('geen nieuwe waarden: elke letterlijke tokenwaarde kwam al voor in faf50f0', () => {
  ok(REF.length > 100000, 'faf50f0:index.html niet leesbaar via git (draai de test in de repository)');
  const rest = REF;
  const lit = decl.filter(([, v]) => !/^var\(/.test(v));
  const esc = v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,/g, ',\\s*');
  const missing = lit.filter(([, v]) => !new RegExp('(^|[^\\w.#-])' + esc(v) + '(?![\\w])', 'i').test(rest)).map(([n, v]) => `${n}: ${v}`);
  ok(!missing.length, 'waarde komt nergens anders voor (nieuw?): ' + missing.join('; '));
});
await T.t('lichte overrides gelden alleen voor tokens uit het blok, en zijn gelijk in "gekozen" en "automatisch"', () => {
  const a = (block.match(/:root\[data-theme="light"\]\{([\s\S]*?)\}/) || [])[1] || '';
  const b = (block.match(/:root:not\(\[data-theme="dark"\]\)\{([\s\S]*?)\}/) || [])[1] || '';
  const norm = x => x.replace(/\s+/g, ''); ok(a && norm(a) === norm(b), 'licht gekozen en licht automatisch verschillen');
  const names = new Set(decl.map(d => d[0])); const extra = [...a.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]).filter(n => !names.has(n));
  ok(!extra.length, 'override voor onbekend token: ' + extra.join(', '));
});

// token → bron. Bron: ['var', naam, elementselector?] | ['probe', ouder, klasse, eigenschap] | ['lit', waarde]
const MAP = [
  ['--text-muted', 'color', ['var', '--muted']],
  ['--text-soft', 'color', ['var', '--su-soft', '#screen-setup']],
  ['--sunken', 'backgroundColor', ['var', '--su-well', '#screen-setup']],
  ['--accent-text', 'color', ['var', '--su-orange-text', '#screen-setup']],
  ['--hit-text', 'color', ['var', '--su-green-text', '#screen-setup']],
  ['--danger-text', 'color', ['probe', '#screen-atc', 'g-miss', 'color']],
  ['--accent-soft', 'backgroundColor', ['probe', '#sb-players', 'x-card on', 'backgroundColor']],
  ['--hit', 'backgroundColor', ['probe', '#screen-atc', 'g-hit', 'backgroundColor']],
  ['--hit-soft', 'backgroundColor', ['probe', '#screen-atc', 'g-chip', 'backgroundColor']],
  ['--danger-soft', 'backgroundColor', ['probe', '#app-content', 'btn-danger', 'backgroundColor']],
  ['--scrim', 'backgroundColor', ['probe', 'body', 'ask-ov', 'backgroundColor']],
  ['--elev-4', 'boxShadow', ['probe', 'body', 'ask-box', 'boxShadow']],
  ['--elev-1', 'boxShadow', ['var', '--shadow']],
  ['--elev-3', 'boxShadow', ['var', '--shadow-lg']],
  ['--state-out-opacity', 'opacity', ['probe', '#screen-bobs27', 'g-prow out', 'opacity']],
  ['--terra-500', 'color', ['var', '--accent']],
  ['--red-500', 'color', ['var', '--danger']],
  ['--sage-300', 'color', ['var', '--accent2']],
  ['--accent-ring', 'color', ['lit', 'rgba(185,78,42,.35)']],
  ['--text-on-fill', 'color', ['lit', '#ffffff']],
  // componenten (4C-3): bron = het bestaande element in faf50f0 (['el', selector, eigenschap, pseudo?])
  ['--nav-bg', 'backgroundColor', ['el', '#pill-nav', 'backgroundColor']],
  ['--nav-border', 'borderTopColor', ['el', '#pill-nav', 'borderTopColor']],
  ['--nav-shadow', 'boxShadow', ['el', '#pill-nav', 'boxShadow']],
  ['--nav-tab', 'color', ['el', '.pn-tab:not(.active)', 'color']],
  ['--nav-badge-ring', 'color', ['lit-theme', 'rgba(28,28,30,.92)', '#fff']],
  ['--controls-bg', 'backgroundColor', ['el', '#game-controls', 'backgroundColor']],
  ['--controls-border', 'borderTopColor', ['el', '#game-controls', 'borderTopColor']],
  ['--card-border', 'borderTopColor', ['probe', '#app-content', 'card', 'borderTopColor']],
  ['--card-shadow', 'boxShadow', ['probe', '#app-content', 'card', 'boxShadow']],
  ['--tile-shadow', 'boxShadow', ['probe', '#sb-players', 'x-card', 'boxShadow']],
  ['--tile-shadow-on', 'boxShadow', ['probe', '#sb-players', 'x-card on', 'boxShadow']],
  ['--tag-text', 'color', ['probe', '#sb-players', 'x-last', 'color']],
  ['--last-bg', 'backgroundColor', ['probe', '#sb-players', 'x-last', 'backgroundColor']],
  ['--last-bust-bg', 'backgroundColor', ['probe', '#sb-players', 'x-last bust', 'backgroundColor']],
  ['--miss-border', 'borderTopColor', ['probe', '#screen-atc', 'g-miss', 'borderTopColor']],
  ['--chip-text', 'color', ['probe', '#screen-atc', 'g-chip', 'color']],
  ['--metric-shadow', 'boxShadow', ['probe', '#app-content', 'metric', 'boxShadow']],
  ['--page-bg', 'background', ['el', 'body', 'background']],   // shorthand: de lichte waarde eindigt op een kleur
  ['--page-glow', 'background', ['el', 'body', 'background', '::before']],
];
// Bron = dezelfde regel in de goedgekeurde versie faf50f0 (daar staat nog de letterlijke waarde). Sinds 4C-2 gebruiken die
// regels in de huidige code zelf de tokens, dus vergelijken met de huidige bron zou rondjes draaien.
const SOURCE = map => {
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;top:0'; document.body.appendChild(host);
  const viaProp = (prop, val, parent) => { const d = document.createElement('div'); (parent || host).appendChild(d); d.style[prop] = val; const r = getComputedStyle(d)[prop]; d.remove(); return r; };
  const out = map.map(([tok, prop, s]) => {
    if (s[0] === 'var') { const el = s[2] ? document.querySelector(s[2]) : null; return viaProp(prop, `var(${s[1]})`, el || host); }
    if (s[0] === 'lit') return viaProp(prop, s[1]);
    if (s[0] === 'lit-theme') { const t = document.documentElement.getAttribute('data-theme'); const light = t === 'light' || (t !== 'dark' && matchMedia('(prefers-color-scheme: light)').matches); return viaProp(prop, light ? s[2] : s[1]); } // [donker, licht] uit de bronregel
    if (s[0] === 'el') { const el = document.querySelector(s[1]); return el ? getComputedStyle(el, s[3] || null)[s[2]] : 'ontbreekt: ' + s[1]; }
    const par = document.querySelector(s[1]) || document.body; const d = document.createElement('div'); d.className = s[2]; par.appendChild(d); const r = getComputedStyle(d)[s[3]]; d.remove(); return r;
  });
  host.remove(); return out;
};
const TOKENS = map => {
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;top:0'; document.body.appendChild(host);
  const out = map.map(([tok, prop]) => { const d = document.createElement('div'); host.appendChild(d); d.style[prop] = `var(${tok})`; const r = getComputedStyle(d)[prop]; d.remove(); return r; });
  host.remove(); return out;
};
const MODES = { 'donker': ['dark', 'dark'], 'licht': ['light', 'light'], 'auto-donker': ['dark', null], 'auto-licht': ['light', null] };
const b = await browser();
for (const [mode, [scheme, ls]] of Object.entries(MODES)) {
  const { p, errs, ctx } = await page(b, { colorScheme: scheme, ls: ls ? { theme: ls } : {} });
  if (!ls) await p.addInitScript(() => localStorage.removeItem('theme'));
  await p.route('http://ref.test/**', r => r.fulfill({ body: REF, contentType: 'text/html' }));
  await p.goto('http://ref.test/index.html'); await p.waitForTimeout(700);
  const want = REF ? await p.evaluate(SOURCE, MAP) : [];
  await open(p, 900);
  const got = await p.evaluate(TOKENS, MAP);
  await ctx.close();
  await T.t(`${mode}: elk token = de waarde van zijn bron in faf50f0 (${MAP.length} tokens)`, () => {
    ok(!errs.length, 'pageerror: ' + errs[0]);
    ok(want.length === MAP.length, 'faf50f0 niet geladen');
    const bad = MAP.map((m, i) => [m[0], got[i], want[i]]).filter(([, g, w]) => g !== w || !g).map(([t, g, w]) => `${t}: ${g} ≠ ${w}`);
    ok(!bad.length, bad.join('; '));
  });
}
await b.close();
process.exit(T.done());
