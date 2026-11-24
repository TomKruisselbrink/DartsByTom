// 4D-1a: metingen X01-scherm per viewport, thema en taal: lettergroottes (score, naam, label, legstand, meta, kleinste
// tekst), contrast (tekst samengesteld over de kaart en elk punt van het achtergrondverloop: laagste waarde telt) en ruimte
// (afstand onderste invoerknop → spelbalk, scrollen nodig). Meet de referentie (REFROOT, standaard /tmp/vref = faf50f0)
// én de huidige code. Gebruik: node design/meet_4d1a.mjs  → design/4d-log/metingen-4d1a.json + tabel op stdout
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const { SCENARIOS } = await import('../tests/visual/scenarios.mjs');
const { shootAll } = await import('../tests/visual/shoot.mjs');
const REF = process.env.REFROOT || '/tmp/vref';
const VPS = [[360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1920, 1080]];
const THEMES = ['dark', 'light', 'auto-dark', 'auto-light'];
const IDS = ['x01-2sp', 'x01-4sp'];
const measure = () => {
  const P = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [a[0], a[1], a[2], a[3] === undefined ? 1 : a[3]]; };
  const blend = (top, bot) => [0, 1, 2].map(i => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const light = getComputedStyle(document.body).color.startsWith('rgb(26') || L(P(getComputedStyle(document.body).color)) < .2;
  const page = light ? [[244, 241, 237, 1], blend([185, 78, 42, .14], [244, 241, 237, 1]), blend([62, 123, 79, .14], [244, 241, 237, 1])] : [[0, 0, 0, 1], [56, 16, 0, 1], [15, 46, 16, 1]];
  const contrast = el => {
    if (!el) return null;
    const chain = []; for (let e = el; e && e !== document.body; e = e.parentElement) { const c = P(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) chain.unshift(c); }
    const fg = P(getComputedStyle(el).color);
    return Math.min(...page.map(p => { let bg = p; for (const c of chain) bg = blend(c, bg); return ratio(blend(fg, bg), bg); }));
  };
  const fs = el => el ? parseFloat(getComputedStyle(el).fontSize) : null;
  const on = document.querySelector('#sb-players .x-card.on'), off = document.querySelector('#sb-players .x-card:not(.on)');
  const scr = document.getElementById('screen-game'), gc = document.getElementById('game-controls').getBoundingClientRect();
  const keys = [...scr.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect());
  const lowest = Math.max(...keys.map(r => r.bottom));
  const texts = [...scr.querySelectorAll('*')].filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  const turn = on && (on.querySelector('.x-turn') || null);
  const nameOn = on && (on.querySelector('.x-nm') || on.querySelector('.x-name'));
  return {
    score: fs(on && on.querySelector('.x-score')), naam: fs(nameOn), label: fs(turn), legs: fs(on && on.querySelector('.x-lg b')), meta: fs(on && on.querySelector('.x-meta')),
    kleinsteTekst: Math.min(...texts.map(fs)),
    contrast: { naamActief: contrast(nameOn), label: contrast(turn), legs: contrast(on && on.querySelector('.x-lg b')), meta: contrast(on && on.querySelector('.x-meta')), naamAnder: contrast(off && (off.querySelector('.x-nm') || off.querySelector('.x-name'))) },
    ruimteBovenBalk: Math.round(gc.top - lowest), scrollNodig: scr.scrollHeight > scr.clientHeight + 1,
  };
};
const pw = (await import(process.env.PLAYWRIGHT)).default;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const items = [];
for (const s of SCENARIOS.filter(s => IDS.includes(s.id))) for (const [w, h] of VPS) for (const theme of THEMES) for (const lang of ['nl', 'en'])
  if (lang === 'nl' || theme === 'dark') items.push({ s, w, h, vn: 'm', lang, theme, file: `${s.id}|${w}x${h}|${theme}|${lang}` });
const run = root => shootAll(b, root, '/tmp/meet4d1a', items.map(x => Object.assign({}, x)), { jobs: 3, shot: false, measure });
const [ref, cur] = [await run(REF), await run(REPO)];
await b.close();
const R = Object.fromEntries(ref.map(r => [r.file, r.measure]));
const rows = cur.map(r => ({ k: r.file, ref: R[r.file], nu: r.measure, fout: r.errors.length || r.setupErr }));
fs.mkdirSync(path.join(HERE, '4d-log'), { recursive: true });
fs.writeFileSync(path.join(HERE, '4d-log', 'metingen-4d1a.json'), JSON.stringify(rows, null, 1) + '\n');
const f = v => v == null ? '–' : typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v;
console.log('scenario | viewport | thema | taal || score was→nu | naam | label | legs | meta | kleinste | contrast naam/label/legs/meta | ruimte | scroll');
for (const r of rows) { const a = r.ref || {}, n = r.nu || {}; const ca = a.contrast || {}, cn = n.contrast || {};
  console.log(`${r.k.replace(/\|/g, ' | ')} || ${f(a.score)}→${f(n.score)} | ${f(a.naam)}→${f(n.naam)} | ${f(n.label)} | ${f(n.legs)} | ${f(a.meta)}→${f(n.meta)} | ${f(a.kleinsteTekst)}→${f(n.kleinsteTekst)} | ${f(ca.naamActief)}→${f(cn.naamActief)} / ${f(cn.label)} / ${f(cn.legs)} / ${f(cn.meta)} | ${f(a.ruimteBovenBalk)}→${f(n.ruimteBovenBalk)} | ${a.scrollNodig ? 'ja' : 'nee'}→${n.scrollNodig ? 'ja' : 'nee'}${r.fout ? ' FOUT' : ''}`); }
