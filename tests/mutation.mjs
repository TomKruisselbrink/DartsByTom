// Controleert dat de tests echte fouten vangen: zet steeds één bewuste fout in een kopie van index.html en verwacht dat de
// genoemde suites dan ZAKKEN. Draaien: node tests/mutation.mjs (duurt ±1–2 min). Niet nodig vóór elke push.
import { spawnSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const MUT = [
  { name: 'bust onder 0 werkt niet meer', find: 'if(newScore<0){', repl: 'if(newScore<-1){', only: 'core/x01' },
  { name: 'bust op 1 bij double out uit', find: 'if(newScore===1&&state.doubleOut){', repl: 'if(false&&newScore===1&&state.doubleOut){', only: 'core/x01' },
  { name: '_grpMerge negeert tombstones', find: "rem.gameHistory.forEach(function(e){var k=_mkey(e);remKeys[k]=1;if(tomb[k])removed.push(e);else out.gameHistory.push(e);});", repl: "rem.gameHistory.forEach(function(e){var k=_mkey(e);remKeys[k]=1;out.gameHistory.push(e);});", only: 'core/data' },
  { name: '_grpMerge telt toegevoegde potjes niet', find: 'added.forEach(function(e){out.games=(out.games||0)+1;', repl: 'added.forEach(function(e){out.games=(out.games||0)+0;', only: 'core/data' },
  { name: 'escapen uitgezet', find: "function _esc(t){return String(t==null?'':t).replace", repl: "function _esc(t){return String(t==null?'':t);String('').replace", only: 'security/taint-local' },
  { name: 'Shanghai direct werkt niet', find: 'if(state.shDarts>=3&&_shIsShanghai()){_shShanghaiWin();return;}', repl: '', only: 'core/games' },
];
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); let bad = 0;
for (const m of MUT) {
  if (!src.includes(m.find)) { console.log(`? ${m.name}: zoektekst niet gevonden (code veranderd?)`); bad++; continue; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbt-mut-'));
  for (const f of fs.readdirSync(ROOT)) if (/\.(js|json|png|svg|ico)$/.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
  fs.writeFileSync(path.join(tmp, 'index.html'), src.replace(m.find, m.repl));
  const r = spawnSync(process.execPath, [path.join(HERE, 'run.mjs'), '--only=' + m.only], { env: Object.assign({}, process.env, { ROOT: tmp }), encoding: 'utf8' });
  const caught = r.status !== 0; if (!caught) bad++;
  console.log(`${caught ? '✓ gevangen' : '✗ NIET gevangen'}  ${m.name}  (${m.only})`);
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\nmutatie: ${bad ? 'GEZAKT' : 'GESLAAGD'}`); process.exit(bad ? 1 : 0);
