// Fase 4C-3 (W2) — geen themaregels in componenten. Statisch, < 1 s.
// Een "themaregel" staat binnen @media (prefers-color-scheme…) of heeft [data-theme…] in de selector. Sinds 4C-3 mogen
// zulke regels alleen nog de root raken (:root, :root:not([data-theme=…]), [data-theme=…], :root[data-theme=…], html):
// daar staan de tokenwaarden per thema. Een component krijgt zijn themawaarde via var(--token).
// Wat (nog) niet kan, staat met reden in theme-rules.allow.json (sleutel: "selectordeel { eigenschappen }").
// De test faalt op (1) elke themaregel voor een component die niet op de lijst staat, (2) een lijstregel die niet meer
// bestaat (lijst bijwerken, met reden), (3) een lijstregel zonder reden of code.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { suite, ok } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ALLOW = JSON.parse(fs.readFileSync(path.join(HERE, 'theme-rules.allow.json'), 'utf8'));
const T = suite('theme-rules');

const ROOTSEL = /^(html|:root|:root:not\(\[data-theme="(dark|light)"\]\)|\[data-theme="(dark|light)"\]|:root\[data-theme="(dark|light)"\])$/;
export function themedComponentRules(src) {
  const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const found = [];
  // recursief door blokken: @media/@supports met inhoud, @keyframes/@font-face overslaan
  function walk(text, conds) {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i); if (open < 0) break;
      const head = text.slice(i, open).trim();
      let d = 1, j = open + 1; while (j < text.length && d) { if (text[j] === '{') d++; else if (text[j] === '}') d--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (/^@(media|supports)/.test(head)) walk(body, conds.concat(head));
      else if (!head.startsWith('@')) {
        const themedMedia = conds.some(c => /prefers-color-scheme/.test(c));
        const parts = head.split(',').map(s => s.trim().replace(/\s+/g, ' ').replace(/'/g, '"')).filter(Boolean);
        if (themedMedia || parts.some(p => /data-theme/.test(p))) {
          const props = [...new Set(body.split(';').map(x => x.split(':')[0].trim().toLowerCase()).filter(Boolean))].sort();
          const mq = conds.filter(c => /prefers-color-scheme/.test(c)).map(c => c.replace(/\s+/g, '')).join(' ');
          for (const p of parts) if (!ROOTSEL.test(p)) found.push(`${mq ? mq + ' ' : ''}${p} { ${props.join(', ')} }`);
        }
      }
      i = j;
    }
  }
  walk(css, []);
  return found;
}
const found = themedComponentRules(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
const allowKeys = Object.keys(ALLOW).filter(k => !k.startsWith('_'));
await T.t('geen themaregel voor een component buiten de uitzonderingenlijst', () => {
  const bad = found.filter(f => !ALLOW[f]);
  if (bad.length) console.log('  NIET OP DE LIJST:\n    ' + bad.join('\n    '));
  ok(!bad.length, `${bad.length} niet toegestaan (gebruik een token in de gewone regel, of zet hem met reden op de lijst):\n      ` + bad.join('\n      '));
});
await T.t('elke uitzondering bestaat nog (lijst is exact)', () => {
  const stale = allowKeys.filter(k => !found.includes(k));
  if (stale.length) console.log('  VERVALLEN:\n    ' + stale.join('\n    '));
  ok(!stale.length, 'staat op de lijst maar bestaat niet meer (haal weg, met reden in de commit):\n      ' + stale.join('\n      '));
});
await T.t('elke uitzondering heeft een code en een reden', () => {
  const bad = allowKeys.filter(k => !ALLOW[k] || !/^E\d+/.test(ALLOW[k].code || '') || (ALLOW[k].reden || '').length < 15);
  ok(!bad.length, 'zonder code (E…) of reden: ' + bad.join('; '));
});
const byCode = {}; for (const k of allowKeys) byCode[ALLOW[k].code] = (byCode[ALLOW[k].code] || 0) + 1;
console.log(`  themaregels voor componenten: ${found.length}, allemaal op de lijst: ${found.every(f => ALLOW[f])}; per code: ${Object.entries(byCode).map(([c, n]) => c + '=' + n).join(' ')}`);
process.exit(T.done());
