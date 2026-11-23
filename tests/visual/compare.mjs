// Visuele regressietest: legt dezelfde scenario's vast voor een referentieversie (REF) en voor de huidige code, in dezelfde
// omgeving, en vergelijkt pixel voor pixel. Zo zijn er geen opgeslagen referentiebeelden nodig in de (openbare) repo en
// spelen verschillen tussen computers (lettertype-rendering) geen rol.
//   REF=<map met index.html van de goedgekeurde versie> node tests/visual/compare.mjs [--quick] [--only=…] [--threshold=0]
//   Tip: git show <commit>:index.html > /tmp/ref/index.html   (de goedgekeurde baseline is tag visual-baseline-v252)
// Exitcode 0 = geen verschillen boven de drempel. Rapport: tests/visual/out/compare/index.html (rood omrand = verschil).
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
import { PNG } from 'pngjs'; import pixelmatch from 'pixelmatch';
import { matrix, shootAll } from './shoot.mjs'; import { writeReport } from './report.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../..');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
if (!process.env.REF) { console.error('Zet REF=<map met de index.html van de referentieversie>.'); process.exit(2); }
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const pw = (await import(process.env.PLAYWRIGHT)).default;
const out = path.join(HERE, 'out', 'compare'); fs.rmSync(out, { recursive: true, force: true });
let items = matrix({ quick: process.argv.includes('--quick') });
const only = arg('only'); if (only) items = items.filter(i => only.split(',').includes(i.s.id));
const thr = Number(arg('threshold') || 0), jobs = Number(arg('jobs')) || 2;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const t0 = Date.now();
await shootAll(b, path.resolve(process.env.REF), path.join(out, 'ref'), items, { jobs });
const cur = await shootAll(b, path.resolve(process.env.ROOT || REPO), path.join(out, 'nu'), items, { jobs });
await b.close();
const diffs = {}; let bad = 0;
for (const r of cur) {
  const A = PNG.sync.read(fs.readFileSync(path.join(out, 'ref', r.file))), B = PNG.sync.read(fs.readFileSync(path.join(out, 'nu', r.file)));
  let pixels;
  if (A.width !== B.width || A.height !== B.height) pixels = A.width * A.height;
  else { const D = new PNG({ width: A.width, height: A.height }); pixels = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.1 }); if (pixels) { const f = path.join(out, 'diff', r.file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, PNG.sync.write(D)); } }
  diffs[r.file] = { pixels, diff: '../diff/' + r.file };
  if (pixels > thr) bad++;
}
const nu = path.join(out, 'nu'); writeReport(nu, cur, diffs);
const list = Object.entries(diffs).filter(([, d]) => d.pixels > thr);
list.slice(0, 40).forEach(([f, d]) => console.log(`  ✗ ${f}  ${d.pixels} px`));
console.log(`\nvisueel: ${bad ? 'VERSCHIL' : 'GELIJK'} — ${cur.length - bad}/${cur.length} opnames gelijk aan REF, ${Math.round((Date.now() - t0) / 1000)} s. Rapport: ${path.relative(REPO, nu)}/index.html`);
console.log(`##CASES ok=${cur.length - bad} total=${cur.length}`);
process.exit(bad ? 1 : 0);
