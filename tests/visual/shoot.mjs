// Motor van de visuele baseline: legt scenario's deterministisch vast (vaste klok, vaste toevalsgetallen, geen animaties,
// vaste data, toasts verborgen) en doet per opname een paar automatische controles.
import fs from 'fs'; import path from 'path';
import { buildDB, LAST_CONFIG, ERRLOG, NOW } from './fixture.mjs';
import { SCENARIOS, PHONES, LANDS } from './scenarios.mjs';
const FAKE_FB = fs.readFileSync(new URL('../security/fakefb.js', import.meta.url), 'utf8');
const FAKE_SEED = 1234567;
const STABLE_CSS = `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}
#confetti-canvas{display:none!important}`;

const CHECKS = lang => {
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const texts = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const t = n.nodeValue.trim(); if (t && n.parentElement && !n.parentElement.closest('script,style') && vis(n.parentElement)) texts.push({ t, fs: parseFloat(getComputedStyle(n.parentElement).fontSize) }); }
  const smallText = texts.filter(x => x.fs < 11).map(x => x.t.slice(0, 30));
  let untranslated = [];
  if (lang === 'en' && typeof I18N === 'object') { untranslated = texts.filter(x => Object.prototype.hasOwnProperty.call(I18N, x.t) && I18N[x.t] !== x.t).map(x => x.t); }
  const gc = document.getElementById('game-controls'), gr = gc && getComputedStyle(gc).display !== 'none' ? gc.getBoundingClientRect() : null;
  const act = [...document.querySelectorAll('.screen.active button, .screen.active [onclick], .screen.active input, .screen.active select')].filter(vis);
  const smallTap = act.filter(e => { const r = e.getBoundingClientRect(); return r.height < 40 || r.width < 40; }).length;
  const underBar = gr ? act.filter(e => !gc.contains(e) && (r => r.bottom > gr.top + 1 && r.top < gr.bottom - 1 && r.right > gr.left + 1 && r.left < gr.right - 1)(e.getBoundingClientRect())).map(e => (e.textContent || '').trim().slice(0, 14)) : [];
  const ac = document.getElementById('app-content');
  return { screen: (document.querySelector('.screen.active') || {}).id || '', overflow: document.documentElement.scrollWidth > innerWidth + 1, needsScroll: !!(ac && ac.scrollHeight > ac.clientHeight + 2), smallText: [...new Set(smallText)].length, smallTextSample: [...new Set(smallText)].slice(0, 5), untranslated: [...new Set(untranslated)].slice(0, 10), smallTap, underBar };
};
export function matrix({ quick = false } = {}) {
  const out = [];
  const langs = ['nl', 'en'], themes = ['light', 'dark'];
  for (const s of SCENARIOS) {
    const vps = PHONES.concat(s.land ? LANDS : []);
    for (const [w, h, vn] of vps) for (const lang of langs) for (const theme of themes) {
      if (quick && !(vn === 'mobiel' && lang === 'nl') && !(vn === 'se' && theme === 'dark' && lang === 'nl') && !(vn.startsWith('kantine-1920') && lang === 'nl' && theme === 'dark')) continue;
      out.push({ s, w, h, vn, lang, theme, file: `${s.id}/${vn}-${lang}-${theme}.png` });
    }
  }
  return out;
}
export async function shootAll(browser, root, outDir, items, { jobs = 2, log = () => {} } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const groups = {};
  for (const it of items) { const k = `${it.w}x${it.h}|${it.lang}|${it.theme}`; (groups[k] = groups[k] || []).push(it); }
  const results = []; const queue = Object.values(groups);
  async function worker() {
    while (queue.length) {
      const list = queue.shift(), { w, h, lang, theme } = list[0];
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce', timezoneId: 'Europe/Amsterdam', locale: lang === 'nl' ? 'nl-NL' : 'en-GB', deviceScaleFactor: 1 });
      await ctx.clock.install({ time: NOW }); await ctx.clock.resume(); await ctx.clock.setFixedTime(NOW);
      const mime = f => f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : f.endsWith('.png') ? 'image/png' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
      // Nep-Firebase (geen netwerk): leeg = niet ingelogd; scenario's met fb/user krijgen een eigen opslag.
      const cur = { store: {} };
      await ctx.exposeFunction('__fsSet', (k, v, m) => { cur.store[k] = m && cur.store[k] ? JSON.stringify(Object.assign(JSON.parse(cur.store[k]), JSON.parse(v))) : v; });
      await ctx.exposeFunction('__fsDel', k => { delete cur.store[k]; });
      await ctx.exposeFunction('__fsGet', k => cur.store[k] ?? null);
      await ctx.exposeFunction('__fsList', k => Object.entries(cur.store).filter(([x]) => x.substring(0, x.lastIndexOf('/')) === k).map(([x, v]) => [x.split('/').pop(), v]));
      await ctx.route(/gstatic\.com/, r => r.request().url().includes('app-compat') ? r.fulfill({ contentType: 'text/javascript', body: FAKE_FB }) : r.fulfill({ contentType: 'text/javascript', body: '' }));
      await ctx.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; const fp = path.join(root, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(fp), contentType: mime(f) }); });
      for (const it of list) {
        const p = await ctx.newPage(); const errs = [];
        p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
        const db = it.s.empty ? null : buildDB();
        cur.store = Object.fromEntries(Object.entries(it.s.fb || {}).map(([k, v]) => [k, JSON.stringify(v)]));
        await p.addInitScript(([u, ls]) => { window.__fakeUser = u; if (!sessionStorage.getItem('__dbtSeeded')) { for (const k in ls) localStorage.setItem('__pending_' + k, ls[k]); } }, [it.s.user || null, it.s.ls || {}]);
        await p.addInitScript(([db, cfg, err, seed, lang, theme]) => {
          let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
          if (sessionStorage.getItem('__dbtSeeded')) return; sessionStorage.setItem('__dbtSeeded', '1');
          localStorage.clear();
          localStorage.setItem('darts_sound', '0'); localStorage.setItem('darts_caller', '0'); localStorage.setItem('darts_haptics', '0');
          localStorage.setItem('lang', lang); localStorage.setItem('theme', theme); localStorage.setItem('darts_device_id', 'VISUAL'); localStorage.setItem('darts_install_dismissed', '1');
          if (db) { localStorage.setItem('darts_db', db); localStorage.setItem('darts_last_config', cfg); }
          if (err) localStorage.setItem('darts_errlog', err);
          Object.keys(localStorage).filter(k => k.startsWith('__pending_')).forEach(k => { localStorage.setItem(k.slice(10), localStorage.getItem(k)); localStorage.removeItem(k); });
        }, [db ? JSON.stringify(db) : null, JSON.stringify(LAST_CONFIG), it.s.errlog ? JSON.stringify(ERRLOG) : null, FAKE_SEED, lang, theme]);
        await p.goto('http://app.test/index.html'); await p.addStyleTag({ content: STABLE_CSS });
        await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
        await p.evaluate(() => { window.showToast = function () {}; try { closeGameSheet(); } catch (e) {} });
        let setupErr = null;
        try { await p.evaluate(it.s.setup); } catch (e) { setupErr = e.message.split('\n')[0]; }
        await p.waitForTimeout(700);
        await p.evaluate(() => { const a = document.getElementById('app-content'); if (a) a.scrollTop = 0; window.scrollTo(0, 0); });
        const checks = await p.evaluate(CHECKS, lang);
        const fp = path.join(outDir, it.file); fs.mkdirSync(path.dirname(fp), { recursive: true });
        await p.screenshot({ path: fp, animations: 'disabled', caret: 'hide' });
        results.push(Object.assign({ file: it.file, id: it.s.id, group: it.s.group, label: it.s.label, vp: it.vn, w: it.w, h: it.h, lang, theme: it.theme, errors: errs.slice(), setupErr }, checks));
        log(`${it.file}${errs.length || setupErr ? '  ⚠ ' + (setupErr || errs[0]) : ''}`);
        await p.close();
      }
      await ctx.close();
    }
  }
  await Promise.all(Array.from({ length: jobs }, worker));
  results.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(results, null, 1));
  return results;
}
