// 4D-1a: controle legstand bij verschillende wedstrijdvormen (K9). Zet een stand in state/trn, rendert X01 en leest
// per speler wat de kaart toont (sets/legs/bolletjes). Plus schermafbeeldingen op 375×667 en 1920×1080 (NL donker).
// Gebruik: node design/legstand_4d1a.mjs [uitmap]   → design/4c3-log/.. niet; schrijft design/4d-log/legstand.json
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
if (!process.env.PLAYWRIGHT) process.env.PLAYWRIGHT = pathToFileURL(createRequire(path.join(REPO, 'package.json')).resolve('playwright')).href;
const { shootAll } = await import('../tests/visual/shoot.mjs');
const OUT = process.argv[2] || '/tmp/legstand4d';
const P2 = "['Tom','Henk']", P3 = "['Tom','Henk','Imke']", P4 = "['Tom','Henk','Imke','Jorn']", P6 = "['Tom','Henk','Imke','Jorn','Anna','Bas']";
const C = [
  { id: 'ft3-2sp', exp: [['legs', 2], ['legs', 1]], dots: 3, setup: `launchGame('501',${P2},true,'firstto',3,1,501,0);state.legWins=[2,1];renderGame();` },
  { id: 'bo5-2sp', exp: [['legs', 1], ['legs', 2]], dots: 3, setup: `launchGame('501',${P2},true,'bestof',5,1,501,0);state.legWins=[1,2];renderGame();` },
  { id: 'ft7-2sp', exp: [['legs', 4], ['legs', 6]], dots: 0, setup: `launchGame('501',${P2},true,'firstto',7,1,501,0);state.legWins=[4,6];renderGame();` },
  { id: 'sets-2sp', exp: [['sets', 1, 'legs', 2], ['sets', 0, 'legs', 1]], dots: 3, setup: `launchGame('501',${P2},true,'firstto',3,3,501,0);state.setWins=[1,0];state.legsInSet=[2,1];renderGame();` },
  { id: 'ft3-3sp', exp: [['legs', 0], ['legs', 2], ['legs', 1]], dots: 0, setup: `launchGame('501',${P3},true,'firstto',3,1,501,0);state.legWins=[0,2,1];renderGame();` },
  { id: 'teams-ft3', exp: [['legs', 1], ['legs', 2], ['legs', 1], ['legs', 2]], dots: 0, setup: `_pendingTeams=[0,1,0,1];launchGame('501',${P4},true,'firstto',3,1,501,0);state.legWins=[1,2,1,2];renderGame();` },
  { id: 'ft3-6sp', exp: [['legs', 0], ['legs', 1], ['legs', 0], ['legs', 2], ['legs', 0], ['legs', 0]], dots: 0, setup: `launchGame('501',${P6},true,'firstto',3,1,501,0);state.legWins=[0,1,0,2,0,0];renderGame();` },
  { id: 'single-leg', exp: [[], []], dots: 0, setup: `launchGame('501',${P2},true,'firstto',1,1,501,0);renderGame();` },
  { id: 'toernooi-bo5', exp: [['legs', 1], ['legs', 2]], dots: 3, setup: `trn.bestOf=5;trn.gameScore=501;trn.doubleOut=true;launchTrnMatchWithStart({p1:'Henk',p2:'Tom',w1:2,w2:1},function(){},1);` },
  { id: 'toernooi-bo1', exp: [[], []], dots: 0, setup: `trn.bestOf=1;trn.gameScore=501;trn.doubleOut=true;launchTrnMatchWithStart({p1:'Tom',p2:'Henk',w1:0,w2:0},function(){},0);` },
];
const measure = () => [...document.querySelectorAll('#sb-players .x-card')].map(c => ({
  naam: c.querySelector('.x-nm')?.textContent, beurt: c.classList.contains('on'),
  legs: [...c.querySelectorAll('.x-lg')].flatMap(e => [e.querySelector('small').textContent, Number(e.querySelector('b').textContent)]),
  dots: c.querySelectorAll('.x-dots i').length, dotsZichtbaar: !!(c.querySelector('.x-dots') && c.querySelector('.x-dots').offsetParent),
  gewonnen: c.querySelectorAll('.x-dots i.w').length, leg: document.querySelector('#trn-leg-bar')?.style.display !== 'none' ? document.querySelector('#trn-leg-bar').textContent : '' }));
const pw = (await import(process.env.PLAYWRIGHT)).default;
const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const items = [];
for (const c of C) for (const [w, h, l] of [[375, 667, 'nl'], [1920, 1080, 'nl'], [390, 844, 'en']]) items.push({ s: { id: c.id, setup: c.setup }, w, h, vn: 'l', lang: l, theme: 'dark', file: `${c.id}-${w}-${l}.png`, c });
const res = await shootAll(b, process.env.ROOTDIR || REPO, OUT, items, { jobs: 2, measure });
await b.close();
let fail = 0; const out = [];
for (const r of res) {
  const it = items.find(i => i.file === r.file), c = it.c; const m = r.measure || [];
  const okLegs = c.exp.every((e, i) => JSON.stringify(m[i] && m[i].legs) === JSON.stringify(e));
  const narrow = it.w <= 420, wantDots = narrow ? 0 : c.dots;
  const okDots = m.every(x => (x.dotsZichtbaar ? x.dots : 0) === wantDots);
  const ok = okLegs && okDots && !r.errors.length && !r.setupErr;
  if (!ok) fail++;
  out.push({ geval: c.id, viewport: `${it.w}×${it.h} ${it.lang}`, ok, kaarten: m, fouten: r.errors.concat(r.setupErr || []) });
  console.log(`${ok ? '✓' : '✗'} ${c.id.padEnd(13)} ${String(it.w).padStart(4)} ${it.lang}  ${m.map(x => `${x.naam}${x.beurt ? '*' : ''}:${x.legs.join(' ') || '–'}${x.dotsZichtbaar ? ` (${x.gewonnen}/${x.dots})` : ''}`).join(' | ')}${m[0] && m[0].leg ? '  [balk: ' + m[0].leg + ']' : ''}`);
}
fs.mkdirSync(path.join(HERE, '4d-log'), { recursive: true });
fs.writeFileSync(path.join(HERE, '4d-log', 'legstand-4d1a.json'), JSON.stringify(out, null, 1) + '\n');
console.log(fail ? `legstand: ${fail} FOUT` : `legstand: alle ${res.length} gevallen correct`);
process.exit(fail ? 1 : 0);
