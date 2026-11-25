// 4D-1c: bijzondere situaties op grote liggende schermen (opnames + controle afkap/overlap/buiten de kaart).
// PLAYWRIGHT=… CHROMIUM=… [TH=dark,light,auto-dark,auto-light] [LANGS=nl,en] [NOCQ=1] node design/special_4d1c.mjs <map met index.html> <uitvoermap>
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { fileURLToPath } from 'url';
const req = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')); const { chromium } = req(process.env.PLAYWRIGHT);
const [ROOT, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const W = ms => `await new Promise(r=>setTimeout(r,${ms}));`;
const PLAY = (rounds) => `for(const rd of ${JSON.stringify(rounds)})for(const sc of rd){for(const ch of String(sc))numpadPress(ch);numpadPress('enter');${W(700)}}`;
const LN = ['Maximiliaan van Bergenhe', 'Alexandra Vermeulen-Dijk', 'Christiaan de Groot-Haan', 'Wilhelmina Oosterhuisman', 'Bartholomeus Janssen-Kip', 'Femke van der Steenhoven'];
const SC = {
  'toernooi': `trnPlayers=['Tom','Jorn','Imke','Henk'];trnFormat='roundrobin';trnBO=3;trnDoubleOut=true;trnGame=501;startTournament();[...document.querySelectorAll('#screen-trn-overview button')].find(b=>/Speel leg/.test(b.textContent)).click();${W(300)}trnChooseStart(0);trnConfirmStart();${W(300)}${PLAY([[100, 60], [140, 85], [60, 45]])}`,
  'sets': `launchGame('501',['Tom','Jorn'],true,'firstto',3,3,501,0);state.setWins=[1,0];state.legsInSet=[1,2];renderGame();${PLAY([[100, 60], [140, 85], [60, 45], [60, 84]])}`,
  'teams': `_pendingTeams=[0,1,0,1];launchGame('501',['Tom','Jorn','Imke','Henk'],true,'firstto',3,1,501,0);${PLAY([[100, 60, 81, 45], [140, 85, 100, 26]])}`,
  'lange-namen-2': `launchGame('501',${JSON.stringify(LN.slice(0, 2))},true,'firstto',3,1,501,0);state.legWins=[1,1];renderGame();${PLAY([[100, 60], [140, 85], [60, 45], [60, 84]])}`,
  'lange-namen-3': `launchGame('501',${JSON.stringify(LN.slice(0, 3))},true,'firstto',3,1,501,0);renderGame();${PLAY([[100, 60, 81], [140, 85, 100], [60, 45, 140], [60, 84, 84]])}`,
  'lange-namen-4': `launchGame('501',${JSON.stringify(LN.slice(0, 4))},true,'firstto',3,1,501,0);renderGame();${PLAY([[100, 60, 81, 45], [140, 85, 100, 26], [60, 45, 140, 60], [60, 84, 84, 60]])}`,
  'lange-namen-6': `launchGame('501',${JSON.stringify(LN)},true,'firstto',3,1,501,0);renderGame();${PLAY([[100, 60, 81, 45, 45, 26], [140, 85, 100, 26, 100, 60]])}`,
  'niet-uitgooibaar-2': `launchGame('501',['Tom','Jorn'],true,'firstto',3,1,501,0);state.legWins=[1,1];renderGame();${PLAY([[100, 60], [140, 85], [92, 45]])}`,
  'niet-uitgooibaar-4': `launchGame('501',['Tom','Jorn','Imke','Henk'],true,'firstto',3,1,501,0);renderGame();${PLAY([[100, 60, 81, 45], [140, 85, 100, 26], [92, 45, 140, 60]])}`,
  'niet-uitgooibaar-6': `launchGame('501',['Tom','Jorn','Imke','Henk','Sanne','Bas'],true,'firstto',3,1,501,0);renderGame();${PLAY([[100, 60, 81, 45, 45, 26], [140, 85, 100, 26, 100, 60], [92, 45, 140, 60, 60, 85]])}`,
  'bot-wacht': `botEnabled=true;botLevelMode='manual';botManualLevel='medium';launchGame('501',['Tom','Bot'],true,'firstto',3,1,501,0);state.botPlayerIndex=1;state.legWins=[1,1];renderGame();for(const sc of [100,140,60]){for(const ch of String(sc))numpadPress(ch);numpadPress('enter');${W(5200)}}numpadPress('6');numpadPress('0');numpadPress('enter');${W(1200)}`,
};
const VP = (process.env.VP || '1024x768,1280x800,1920x1080,2560x1440').split(',').map(v => v.split('x').map(Number));
const TH = (process.env.TH || 'dark').split(','); const LANGS = (process.env.LANGS || 'nl').split(',');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM }); const res = [];
for (const [w, h] of VP) for (const th of TH) for (const lang of LANGS) for (const [id, js] of Object.entries(SC)) {
  const [theme, cs] = th === 'auto-dark' ? ['auto', 'dark'] : th === 'auto-light' ? ['auto', 'light'] : [th, th];
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: cs, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/gstatic\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; const fp = path.join(ROOT, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(fp), contentType: f.endsWith('.html') ? 'text/html' : 'text/plain' }); });
  await p.addInitScript(([t, l]) => { localStorage.setItem('darts_sound', '0'); localStorage.setItem('darts_caller', '0'); localStorage.setItem('theme', t); localStorage.setItem('lang', l); const st = window.setTimeout; window.setTimeout = function (fn, d) { return st.apply(window, [fn, Math.round((+d || 0) / 4)].concat([].slice.call(arguments, 2))); }; }, [theme, lang]);
  await p.goto('http://app.test/index.html'); await p.waitForTimeout(700);
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  if (process.env.NOCQ) await p.evaluate(() => document.documentElement.classList.add('x01-nocq'));
  await p.evaluate(`(async()=>{${js}})()`); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const vis = e => e && e.offsetParent && getComputedStyle(e).visibility !== 'hidden';
    const out = { trunc: [], overlap: [], outside: [], clamp: [] };
    const tr = e => vis(e) && e.scrollWidth > e.clientWidth + 1;
    document.querySelectorAll('#sb-players .x-card').forEach((c, i) => {
      const cr = c.getBoundingClientRect();
      for (const s of ['.x-nm', '.x-meta', '.x-imp', '.x-turn', '.x-route', '.x-legs', '.co-hint']) { const e = c.querySelector(s); if (tr(e)) out.trunc.push(i + s); }
      const nm = c.querySelector('.x-nm'); if (vis(nm) && nm.scrollHeight > nm.clientHeight + 1) out.clamp = (out.clamp || []).concat(i);
      const els = [...c.querySelectorAll('.x-top,.x-legs,.x-score,.x-route,.x-meta,.x-imp,.co-hint')].filter(e => vis(e) && e.getBoundingClientRect().width > 0 && e.textContent.trim());
      for (const e of els) { const r = e.getBoundingClientRect(); if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) out.outside.push(i + '.' + e.className.split(' ')[0]); }
      for (let a = 0; a < els.length; a++) for (let k = a + 1; k < els.length; k++) { const A = els[a].getBoundingClientRect(), B = els[k].getBoundingClientRect();
        const ix = Math.min(A.right, B.right) - Math.max(A.left, B.left), iy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top); if (ix > 2 && iy > 2) out.overlap.push(i + ':' + els[a].className.split(' ')[0] + '×' + els[k].className.split(' ')[0]); }
    });
    const hd = document.querySelector('#x01-head'); if (hd && hd.scrollWidth > hd.clientWidth + 1) out.trunc.push('kop');
    const bar = document.querySelector('#trn-leg-bar'); out.trn = bar && vis(bar) ? bar.textContent : '';
    out.scroll = document.scrollingElement.scrollHeight > innerHeight + 2;
    out.imp = !!document.querySelector('#sb-players .x-imp'); out.route = !!document.querySelector('#sb-players .x-route');
    out.n = document.querySelectorAll('#sb-players .x-card').length; out.active = (document.querySelector('#sb-players .x-card.on .x-nm') || {}).textContent;
    out.win = !!document.querySelector('#x01-undo.is-win'); out.scr = (document.querySelector('.screen.active') || {}).id;
    return out;
  });
  const idn = `${id}-${w}x${h}-${th}-${lang}`; r.id = idn; r.errs = errs; res.push(r);
  await p.screenshot({ path: path.join(OUT, idn + '.png') }); await ctx.close();
}
await b.close(); fs.writeFileSync(path.join(OUT, 'special.json'), JSON.stringify(res, null, 1));
const bad = res.filter(r => r.errs.length || r.scroll || r.trunc.length || r.overlap.length || r.outside.length || r.scr !== 'screen-game');
for (const r of bad) console.log('✗', r.id, JSON.stringify({ e: r.errs, s: r.scroll, t: r.trunc, o: r.overlap, u: r.outside, scr: r.scr }));
for (const r of res) if (r.clamp.length) console.log('… naam ingekort (2 regels + …):', r.id, r.clamp.join(','));
console.log(`bijzonder: ${res.length - bad.length}/${res.length} zonder bevindingen`);
