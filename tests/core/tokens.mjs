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
await T.t('geen nieuwe waarden: elke letterlijke tokenwaarde komt al elders in de app voor', () => {
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
];
const RESOLVE = map => {
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;top:0'; document.body.appendChild(host);
  const viaProp = (prop, val, parent) => { const d = document.createElement('div'); (parent || host).appendChild(d); d.style[prop] = val; const r = getComputedStyle(d)[prop]; d.remove(); return r; };
  const out = [];
  for (const [tok, prop, s] of map) {
    const got = viaProp(prop, `var(${tok})`);
    let want;
    if (s[0] === 'var') { const el = s[2] ? document.querySelector(s[2]) : null; want = viaProp(prop, `var(${s[1]})`, el || host); }
    else if (s[0] === 'lit') want = viaProp(prop, s[1]);
    else { const par = document.querySelector(s[1]) || document.body; const d = document.createElement('div'); d.className = s[2]; par.appendChild(d); want = getComputedStyle(d)[s[3]]; d.remove(); }
    out.push([tok, got, want]);
  }
  host.remove(); return out;
};
const MODES = { 'donker': ['dark', 'dark'], 'licht': ['light', 'light'], 'auto-donker': ['dark', null], 'auto-licht': ['light', null] };
const b = await browser();
for (const [mode, [scheme, ls]] of Object.entries(MODES)) {
  const { p, errs, ctx } = await page(b, { colorScheme: scheme, ls: ls ? { theme: ls } : {} });
  if (!ls) await p.addInitScript(() => localStorage.removeItem('theme'));
  await open(p, 900);
  const res = await p.evaluate(RESOLVE, MAP);
  await ctx.close();
  await T.t(`${mode}: elk token = de waarde van zijn bron (${MAP.length} tokens)`, () => {
    ok(!errs.length, 'pageerror: ' + errs[0]);
    const bad = res.filter(([, g, w]) => g !== w || !g).map(([t, g, w]) => `${t}: ${g} ≠ ${w}`);
    ok(!bad.length, bad.join('; '));
  });
}
await b.close();
process.exit(T.done());
