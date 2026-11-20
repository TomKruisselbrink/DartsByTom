// Statische controle: elke waarde die in een HTML-string of inline handler wordt geplakt,
// moet ge-escapet zijn (_esc / _ue) of met reden in html-sinks.allow.json staan.
// Gebruik: node tests/security/html-sinks.mjs [--list]   (--list = toon alle onbeoordeelde expressies)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = (process.env.ROOT || path.resolve(HERE, '../..')).replace(/\/?$/, '/');
const src = fs.readFileSync(ROOT + 'index.html', 'utf8');
const allowFile = path.join(HERE, 'html-sinks.allow.json');
const allow = fs.existsSync(allowFile) ? JSON.parse(fs.readFileSync(allowFile, 'utf8')) : { html: {}, handler: {} };
const lines = src.split('\n');
// Omringende functienaam per regel: de allowlist-sleutel is 'functie|expressie', zodat een goedgekeurde
// 'v' in de ene functie niet automatisch overal goedgekeurd is.
const fnAt = []; { let cur = '(top)'; lines.forEach((l, i) => { const m = l.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/); if (m) cur = m[1]; fnAt[i] = cur; }); }
// Alleen het app-script (na de vertaaltabellen); CSS/HTML-opmaak en I18N overslaan.
const start = lines.findIndex(l => /var I18N_PATTERNS\s*=/.test(l)) + 1;
const norm = e => e.trim().replace(/\s+/g, ' ').replace(/\\'/g, "'");
// Altijd veilig: escapers, en uitdrukkingen die aantoonbaar getal/boolean opleveren.
const ESC = [/^\(?_esc\(/, /^\(?_ue\(/];
const NUMLIKE = [
  /^\(?(Math\.\w+|Number|parseInt|parseFloat|isFinite)\(/, // getal
  /\.toFixed\(\d\)\)?$/,                                       // getal
  /^\(?-?\d+(\.\d+)?\)?$/,                                       // getal-literal
  /^\(?[^'"`]*\?\s*'[^'\\]*'\s*:\s*'[^'\\]*'\s*\)?$/,          // (voorwaarde ? 'tekst' : 'tekst')
];
const SAFE = ESC.concat(NUMLIKE);
const HTML_CTX = /innerHTML|insertAdjacentHTML|outerHTML|'<\/?[a-zA-Z]|<\/?[a-zA-Z][^']*'\s*\+|\+\s*'[^']*<\/?[a-zA-Z]/;
const out = { html: [], handler: [] };
for (let i = start; i < lines.length; i++) {
  const l = lines[i];
  if (/^\s*\/\//.test(l)) continue;
  // 1) inline handlers: on*="…'+x+'…"  (ook met \" in JS-strings)
  const hre = /\bon[a-z]+=\\?"((?:[^"\\]|\\.)*?)\\?"/g; let m;
  const handlerSpans = [];
  while ((m = hre.exec(l))) {
    handlerSpans.push([m.index, m.index + m[0].length]);
    const body = m[1];
    const cre = /'\s*\+\s*(.+?)\s*\+\s*'/g; let c;
    while ((c = cre.exec(body))) { const e = norm(c[1]); if (NUMLIKE.some(r => r.test(e))) continue; const key = fnAt[i] + '|' + e; if (!(key in allow.handler)) out.handler.push({ line: i + 1, expr: e, key }); }
  }
  // 2) HTML-context
  if (!HTML_CTX.test(l)) continue;
  const cre = /'\s*\+\s*(.+?)\s*\+\s*'/g; let c;
  while ((c = cre.exec(l))) {
    if (handlerSpans.some(([a, b]) => c.index >= a && c.index < b)) continue; // al gecontroleerd als handler
    const e = norm(c[1]);
    if (/^'/.test(e)) continue; // string + string
    if (SAFE.some(r => r.test(e))) continue;
    const key = fnAt[i] + '|' + e;
    if (key in allow.html) continue;
    out.html.push({ line: i + 1, expr: e, key });
  }
}
const uniq = a => [...new Map(a.map(x => [x.key, x])).values()];
const H = uniq(out.html), K = uniq(out.handler);
const list = process.argv.includes('--list');
console.log(`html-sinks: ${H.length + K.length ? 'GEZAKT' : 'GESLAAGD'}  (HTML-context: ${H.length} onbeoordeelde expressies, ${out.html.length} plekken; inline handlers: ${K.length} expressies, ${out.handler.length} plekken)`);
const show = (t, a) => a.slice(0, list ? 1e9 : 15).forEach(x => console.log(`  ${t} r${x.line}  ${x.key.slice(0, 120)}`));
show('html', H); show('handler', K);
if (list) fs.writeFileSync('/tmp/html-sinks-open.json', JSON.stringify({ html: H, handler: K }, null, 1));
process.exit(H.length + K.length ? 1 : 0);
