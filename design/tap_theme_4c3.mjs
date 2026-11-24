// Fase 4C-3, W3: zijn de tikvlakken in licht exact gelijk aan donker? (kleuren veranderen geen maten; hier gemeten)
// NL, 4 breedtes, huidige code. Schrijft design/4c3-log/tap-licht-donker.json. Gebruik: node design/tap_theme_4c3.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { measureAll, keysOf, VPS } = await import('../tests/core/tap-lib.mjs');
const out = {}; let allSame = true;
for (const k of Object.keys(VPS)) {
  const d = keysOf(await measureAll(k, { theme: 'dark' })), l = keysOf(await measureAll(k, { theme: 'light' }));
  const keys = [...new Set([...Object.keys(d), ...Object.keys(l)])].sort();
  const diff = keys.filter(x => (d[x] || 0) !== (l[x] || 0)).map(x => `${x}: donker ${d[x] || 0}, licht ${l[x] || 0}`);
  out[k] = { donker: Object.values(d).reduce((a, b) => a + b, 0), licht: Object.values(l).reduce((a, b) => a + b, 0), verschillen: diff };
  if (diff.length) allSame = false;
  console.log(`${k}px: donker ${out[k].donker}, licht ${out[k].licht}, verschillen ${diff.length}`); diff.slice(0, 10).forEach(x => console.log('   ' + x));
}
fs.writeFileSync(path.join(HERE, '4c3-log', 'tap-licht-donker.json'), JSON.stringify(out, null, 1) + '\n');
console.log(allSame ? 'tikvlakken licht = donker (exact)' : 'tikvlakken licht ≠ donker');
