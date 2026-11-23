// Legt de visuele baseline vast: node tests/visual/capture.mjs [--quick] [--extra = alleen de aanvullende opnames van 4C-0] [--only=id1,id2] [--out=map] [--root=map]
// Schrijft per opname een PNG, een manifest.json met automatische controles en een index.html om te bekijken.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
import { matrix, shootAll } from './shoot.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../..');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const pw = (await import(process.env.PLAYWRIGHT)).default;
const root = path.resolve(arg('root') || process.env.ROOT || REPO), out = path.resolve(arg('out') || path.join(HERE, 'out', 'capture'));
let items = matrix({ quick: process.argv.includes('--quick'), extra: process.argv.includes('--extra') });
const only = arg('only'); if (only) items = items.filter(i => only.split(',').includes(i.s.id));
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const t0 = Date.now(); let n = 0;
const res = await shootAll(b, root, out, items, { jobs: Number(arg('jobs')) || 2, log: () => { if (++n % 25 === 0) process.stdout.write(`  ${n}/${items.length}\n`); } });
await b.close();
const { writeReport } = await import('./report.mjs'); writeReport(out, res);
const issues = res.filter(r => r.errors.length || r.setupErr || r.overflow || r.untranslated.length || r.underBar.length);
console.log(`${res.length} opnames in ${Math.round((Date.now() - t0) / 1000)} s → ${path.relative(REPO, out)}/index.html  (${issues.length} met bevindingen)`);
