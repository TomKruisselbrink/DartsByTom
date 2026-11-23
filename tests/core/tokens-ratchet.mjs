// Fase 4C-0 — teller van hardgecodeerde kleuren (ratchet). Statisch, < 1 s.
// Telt hex- en rgb(a)-kleuren in index.html: in de CSS buiten tokenblokken (regels die alleen --variabelen zetten) en in
// HTML/JS (inline stijlen, kleuren in scripts). Het aantal mag gelijk blijven of dalen, nooit stijgen.
// Daalt het, dan meldt de test dat tokens-ratchet.json omlaag mag (dat vastzetten doe je met --update).
// Kleuren uit de uitzonderingslijst X1–X10 (team, speler, dartbord, Halve It-opdrachten, confetti …) tellen gewoon mee:
// het doel is niet nul, maar dat er geen nieuwe losse kleuren bij komen.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { suite, ok } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const FILE = path.join(HERE, 'tokens-ratchet.json');
export function count(src) {
  const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/url\(data:[^)]*\)/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const rest = src.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/data:[a-z/+-]+;base64,[A-Za-z0-9+/=]+/g, '');
  const COL = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|rgba?\([^)]*\)/g;
  let cssTok = 0, cssHard = 0;
  for (const [, , body] of styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)) for (const d of body.split(';')) { const n = (d.match(COL) || []).length; if (!n) continue; if (/^\s*--[\w-]+\s*:/.test(d)) cssTok += n; else cssHard += n; }
  const nonColorHash = /&#\d+;|#[0-9a-fA-F]{3,6}(?=[\w-])/g; // geen HTML-entiteiten of id-ankers
  const jsHard = (rest.replace(nonColorHash, '').match(COL) || []).length;
  return { cssHard, jsHard, cssTok };
}
const T = suite('tokens-ratchet');
const cur = count(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
if (process.argv.includes('--update')) { fs.writeFileSync(FILE, JSON.stringify(Object.assign({ _uitleg: 'Maximaal aantal hardgecodeerde kleuren in index.html (tests/core/tokens-ratchet.mjs). Mag alleen omlaag. Stand faf50f0 (v252) bij fase 4C-0.' }, { cssHard: cur.cssHard, jsHard: cur.jsHard }), null, 1) + '\n'); console.log('geschreven', cur); process.exit(0); }
const max = JSON.parse(fs.readFileSync(FILE, 'utf8'));
console.log(`kleuren: CSS hard ${cur.cssHard} (max ${max.cssHard}), HTML/JS hard ${cur.jsHard} (max ${max.jsHard}), in tokens ${cur.cssTok}`);
await T.t('CSS: geen nieuwe hardgecodeerde kleuren buiten tokens', () => ok(cur.cssHard <= max.cssHard, `${cur.cssHard} > ${max.cssHard}: gebruik een token (var(--…)) of zet de kleur in een tokenblok`));
await T.t('HTML/JS: geen nieuwe hardgecodeerde kleuren', () => ok(cur.jsHard <= max.jsHard, `${cur.jsHard} > ${max.jsHard}: gebruik var(--…) in de inline stijl`));
if (cur.cssHard < max.cssHard || cur.jsHard < max.jsHard) console.log('  minder dan het maximum: tokens-ratchet.json mag omlaag (node tests/core/tokens-ratchet.mjs --update)');
process.exit(T.done());
