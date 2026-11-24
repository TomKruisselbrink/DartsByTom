// 4D-1a: controleer de laatste volledige visuele vergelijking (tests/visual/out/compare/{ref,nu}) tegen de lijst toegestane
// scenario's (tests/visual/expect/4D-1a.json). Per opname opnieuw pixel voor pixel (zelfde pixelmatch-instelling als
// compare.mjs). Voor scenario's met een "venster" (bevestig-stop): de rechthoek van het venster wordt in de huidige code
// gemeten (zelfde scenario en viewport) en daarbinnen moeten 0 pixels verschillen.
// Gebruik: node design/scope_4d1a.mjs   → design/4d-log/scope-4d1a.json, exit 1 bij een niet-toegestaan verschil
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const req = createRequire(path.join(REPO, 'package.json'));
const { PNG } = req('pngjs'); const pixelmatch = (await import(pathToFileURL(req.resolve('pixelmatch')).href)).default;
const { matrix, shootAll } = await import('../tests/visual/shoot.mjs');
const EXP = JSON.parse(fs.readFileSync(path.join(REPO, 'tests/visual/expect/4D-1a.json'), 'utf8'));
const OUT = path.join(REPO, 'tests/visual/out/compare');
const items = matrix({});
const res = []; const masks = {};
for (const it of items) {
  const fa = path.join(OUT, 'ref', it.file), fb = path.join(OUT, 'nu', it.file);
  if (!fs.existsSync(fa) || !fs.existsSync(fb)) { res.push({ file: it.file, ontbreekt: true }); continue; }
  const A = PNG.sync.read(fs.readFileSync(fa)), B = PNG.sync.read(fs.readFileSync(fb));
  const D = new PNG({ width: A.width, height: A.height });
  const px = A.width !== B.width || A.height !== B.height ? A.width * A.height : pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.1 });
  res.push({ file: it.file, id: it.s.id, px, it, D: px ? D : null });
}
// vensterrechthoeken meten (alleen waar nodig)
const need = res.filter(r => r.px && EXP.venster[r.id]);
if (need.length) {
  const pw = (await import(process.env.PLAYWRIGHT)).default;
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const sel = r => EXP.venster[r.id];
  const m = await shootAll(b, REPO, '/tmp/scope4d1a', need.map(r => Object.assign({}, r.it)), { jobs: 2, shot: false, measure: () => {
    const e = document.querySelector('.ask-box'); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); } });
  await b.close();
  for (const x of m) masks[x.file] = x.measure;
}
let bad = 0; const verslag = [];
for (const r of res) {
  if (r.ontbreekt) { bad++; verslag.push({ file: r.file, fout: 'opname ontbreekt' }); continue; }
  if (!r.px) continue;
  const allowed = !!EXP.scenarios[r.id]; let inVenster = null;
  if (allowed && EXP.venster[r.id]) {
    const box = masks[r.file]; inVenster = 0;
    if (!box) { inVenster = 'venster niet gevonden'; }
    else { const W = r.D.width; for (let y = Math.max(0, box[1]); y < Math.min(r.D.height, box[3]); y++) for (let x = Math.max(0, box[0]); x < Math.min(W, box[2]); x++) { const i = (y * W + x) * 4; const d = r.D.data; if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 0) inVenster++; } }
  }
  const ok = allowed && (inVenster === null || inVenster === 0);
  if (!ok) bad++;
  verslag.push({ file: r.file, pixels: r.px, toegestaan: allowed, pixelsInVenster: inVenster, venster: masks[r.file] || undefined, ok });
}
const per = {}; for (const v of verslag) { const id = v.file.split('/')[0]; per[id] = per[id] || { verschillend: 0, maxPixelsInVenster: 0, ok: true }; if (v.pixels) per[id].verschillend++; if (typeof v.pixelsInVenster === 'number') per[id].maxPixelsInVenster = Math.max(per[id].maxPixelsInVenster, v.pixelsInVenster); if (!v.ok) per[id].ok = false; }
fs.mkdirSync(path.join(HERE, '4d-log'), { recursive: true });
fs.writeFileSync(path.join(HERE, '4d-log', 'scope-4d1a.json'), JSON.stringify({ opnames: res.length, verschillend: verslag.filter(v => v.pixels).length, perScenario: per, details: verslag }, null, 1) + '\n');
for (const [id, p] of Object.entries(per)) console.log(`${p.ok ? '✓' : '✗'} ${id.padEnd(20)} ${p.verschillend} opnames anders${EXP.venster[id] ? `, pixels binnen het venster: max ${p.maxPixelsInVenster}` : ''}${EXP.scenarios[id] ? '' : '  NIET TOEGESTAAN'}`);
console.log(`scope 4D-1a: ${bad ? 'FOUT (' + bad + ')' : 'GOED'} — ${res.length} opnames, ${verslag.filter(v => v.pixels).length} anders, allemaal in toegestane scenario's: ${!bad}`);
process.exit(bad ? 1 : 0);
