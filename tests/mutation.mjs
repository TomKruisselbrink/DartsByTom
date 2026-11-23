// Controleert dat de tests echte fouten vangen: zet steeds één bewuste fout in een kopie van index.html en verwacht dat de
// genoemde suites dan ZAKKEN. Draaien: node tests/mutation.mjs (duurt ±10 min), met --visual en REF=<map met faf50f0> ook de
// visuele vergelijking. Niet nodig vóór elke push; wel na wijzigingen aan de tests zelf.
import { spawnSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const MUT = [
  { name: 'bust onder 0 werkt niet meer', find: 'if(newScore<0){', repl: 'if(newScore<-1){', only: 'core/x01' },
  { name: 'bust op 1 bij double out uit', find: 'if(newScore===1&&state.doubleOut){', repl: 'if(false&&newScore===1&&state.doubleOut){', only: 'core/x01' },
  { name: '_grpMerge negeert tombstones', find: "rem.gameHistory.forEach(function(e){var k=_mkey(e);remKeys[k]=1;if(tomb[k])removed.push(e);else out.gameHistory.push(e);});", repl: "rem.gameHistory.forEach(function(e){var k=_mkey(e);remKeys[k]=1;out.gameHistory.push(e);});", only: 'core/data' },
  { name: '_grpMerge telt toegevoegde potjes niet', find: 'added.forEach(function(e){out.games=(out.games||0)+1;', repl: 'added.forEach(function(e){out.games=(out.games||0)+0;', only: 'core/data' },
  { name: 'escapen uitgezet', find: "function _esc(t){return String(t==null?'':t).replace", repl: "function _esc(t){return String(t==null?'':t);String('').replace", only: 'security/taint-local' },
  { name: 'Shanghai direct werkt niet', find: 'if(state.shDarts>=3&&_shIsShanghai()){_shShanghaiWin();return;}', repl: '', only: 'core/games' },
  // Fase 4C-0: de nieuwe tests moeten falen op een bewust geïntroduceerde regressie
  { name: 'contrast: muted in licht te licht', find: '</head>', repl: '<style>:root[data-theme="light"]{--muted:#A39C96}@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){--muted:#A39C96}}</style></head>', only: 'core/contrast' },
  { name: 'contrast: doelgetal ook in licht onleesbaar', find: '</head>', repl: '<style>.g-target-big{color:#E8B89E!important}</style></head>', only: 'core/contrast' },
  { name: 'contrast: tekst op donkere kaart te zwak', find: '</head>', repl: '<style>:root[data-theme="dark"]{--text:#5C5C60}</style></head>', only: 'core/contrast' },
  { name: 'contrast: bekende afwijking C1 wordt ernstiger (doelgetal donker nog donkerder)', find: '</head>', repl: '<style>:root[data-theme="dark"] .g-target-big{color:#8A3A1F!important}</style></head>', only: 'core/contrast' },
  { name: 'contrast: bekende afwijking C10 wordt ernstiger (Stop in lichte balk lichter)', find: '</head>', repl: '<style>:root[data-theme="light"] #game-controls .gc-stop{color:#FF8A80!important}</style></head>', only: 'core/contrast' },
  { name: 'tokens: token wijkt af van zijn bron (--accent-soft .17)', find: '--accent-soft:rgba(185,78,42,.16);', repl: '--accent-soft:rgba(185,78,42,.17);', only: 'core/tokens' },
  { name: 'tokens: nieuwe maat die de app nergens gebruikt (--fs-micro 11.5px)', find: '--fs-micro:11px;', repl: '--fs-micro:11.5px;', only: 'core/tokens' },
  { name: 'tik: chips overlappen elkaar', find: '</head>', repl: '<style>.known-name-btn{margin-right:-30px!important}</style></head>', only: 'core/tap-390' },
  { name: 'tik: spelbalk bedekt spelknoppen', find: '</head>', repl: '<style>#game-controls{padding-top:80px!important}</style></head>', only: 'core/tap-390' },
  { name: 'tik: filterchip te klein', find: '</head>', repl: '<style>.lb-chip{height:24px!important}</style></head>', only: 'core/tap-390' },
  { name: 'dekking: Stop-venster verschijnt niet meer', find: 'function confirmEndGame(){', repl: 'function confirmEndGame(){return;', only: 'core/tap-390' },
  { name: 'dekking: nieuw scherm zonder scenario', find: '</body>', repl: '<div class="screen" id="screen-nieuw"></div></body>', only: 'core/coverage' },
  { name: 'kleuren: nieuwe hardgecodeerde kleur', find: '</head>', repl: '<style>.x-nieuw{color:#123456}</style></head>', only: 'core/tokens-ratchet' },
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
// --visual: ook de visuele vergelijking een bewuste afwijking van 1 px laten vinden (REF=<map met faf50f0> nodig, ±2 min)
if (process.argv.includes('--visual')) {
  if (!process.env.REF) { console.log('? visueel: zet REF=<map met index.html van faf50f0>'); bad++; }
  else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbt-mut-'));
    for (const f of fs.readdirSync(ROOT)) if (/\.(js|json|png|svg|ico)$/.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    fs.writeFileSync(path.join(tmp, 'index.html'), src.replace('</head>', '<style>.home-quick-tile{padding-top:1px!important}</style></head>'));
    const r = spawnSync(process.execPath, [path.join(HERE, 'visual', 'compare.mjs'), '--only=home,x01-2sp'], { env: Object.assign({}, process.env, { ROOT: tmp }), encoding: 'utf8' });
    const caught = r.status === 1 && /VERSCHIL/.test(r.stdout) && /home\//.test(r.stdout) && !/x01-2sp\//.test(r.stdout.split('visueel:')[0]);
    if (!caught) bad++;
    console.log(`${caught ? '✓ gevangen' : '✗ NIET gevangen'}  visueel: 1 px extra ruimte op de snelstart-tegels (alleen home anders, x01 gelijk)`);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
console.log(`\nmutatie: ${bad ? 'GEZAKT' : 'GESLAAGD'}`); process.exit(bad ? 1 : 0);
