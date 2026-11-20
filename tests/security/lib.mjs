// Gedeelde hulpcode voor de beveiligingstests (DartsByTom).
// Draaien: PLAYWRIGHT=<pad naar playwright/index.js> CHROMIUM=<pad naar chromium> ROOT=<map met index.html> node tests/security/<test>.mjs
// Geen afhankelijkheden in de app zelf; alleen Playwright als losse testtool.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = (process.env.ROOT || path.resolve(HERE, '../..')).replace(/\/?$/, '/');
const pw = (await import(process.env.PLAYWRIGHT || 'playwright')).default;
export const FAKE_FB = fs.readFileSync(path.join(HERE, 'fakefb.js'), 'utf8');

// ── Payloads ──────────────────────────────────────────────────────────────────
// Elke payload draagt een sleutel k zodat een treffer naar het veld te herleiden is.
export const P = {
  html: k => `<dbtx-el data-k="${k}"></dbtx-el><img data-dbtx-img="${k}" src=x onerror="__x('${k}')">`,
  attrDq: k => `${k}" data-dbtx-attr="${k}" onfocus="__x('${k}')" autofocus x="`,
  attrSq: k => `${k}' data-dbtx-attr='${k}' onmouseover='__x("${k}")' x='`,
  jsQ: k => `${k}');__x('${k}');//`,
  jsBs: k => `${k}\\');__x('${k}');//`,
  jsEnt: k => `${k}&#39;);__x('${k}');//`,
  svg: k => `<svg><dbtx-el data-k="${k}"/><image href=x onerror="__x('${k}')"/></svg>`,
};
export const ALL = k => P.html(k) + P.attrDq(k + 'a') + P.jsQ(k + 'j') + P.jsEnt(k + 'e');
export const isMarker = s => typeof s === 'string' && /dbtx|__x\(/.test(s);

// ── Browser ───────────────────────────────────────────────────────────────────
export async function browser() {
  return pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
}
// Detectoren voor klasse 2–5 (zie herstelplan WP5). Klasse 1 (zichtbare tekst) is geen fout.
const DETECT = () => {
  window.__hits = [];
  const step = () => window.__step || '?';
  window.__x = k => window.__hits.push({ cls: 'script', step: step(), k: String(k) });
  document.addEventListener('securitypolicyviolation', e => window.__hits.push({ cls: 'csp', step: step(), k: e.violatedDirective }));
  const seenEl = new WeakSet();
  const checkEl = el => {
    if (!el || el.nodeType !== 1 || seenEl.has(el)) return; seenEl.add(el);
    const tag = el.tagName.toLowerCase();
    if (tag === 'dbtx-el' || el.hasAttribute('data-dbtx-img')) window.__hits.push({ cls: 'element', step: step(), k: el.getAttribute('data-k') || el.getAttribute('data-dbtx-img') || tag });
    if (el.hasAttribute('data-dbtx-attr')) window.__hits.push({ cls: 'attribuut', step: step(), k: el.getAttribute('data-dbtx-attr') });
    for (const a of el.attributes) { if (/^(href|src|action|formaction|xlink:href)$/i.test(a.name) && /^\s*javascript:/i.test(a.value) && /dbtx|__x/.test(a.value)) window.__hits.push({ cls: 'javascript-url', step: step(), k: a.value.slice(0, 40) }); }
  };
  const mo = new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(n => { if (n.nodeType === 1) { checkEl(n); n.querySelectorAll && n.querySelectorAll('*').forEach(checkEl); } }); if (m.type === 'attributes') checkEl(m.target); }));
  const start = () => { mo.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-dbtx-attr', 'data-dbtx-img', 'href', 'src'] }); document.querySelectorAll('*').forEach(checkEl); };
  start();
};
export async function page(b, { db, ls = {}, viewport = { width: 390, height: 844 }, fake = null, colorScheme } = {}) {
  const ctx = await b.newContext({ viewport, colorScheme });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.dismiss());
  if (fake) {
    await p.exposeFunction('__fsSet', (k, v, m) => { fake.store[k] = m && fake.store[k] ? JSON.stringify(Object.assign(JSON.parse(fake.store[k]), JSON.parse(v))) : v; fake.writes.push(k); if (fake.deny && fake.deny(k)) throw new Error('permission-denied'); });
    await p.exposeFunction('__fsDel', k => { delete fake.store[k]; });
    await p.exposeFunction('__fsGet', k => fake.store[k] ?? null);
    await p.exposeFunction('__fsList', k => Object.entries(fake.store).filter(([x]) => x.substring(0, x.lastIndexOf('/')) === k).map(([x, v]) => [x.split('/').pop(), v]));
    await p.route(/gstatic\.com/, r => r.request().url().includes('app-compat') ? r.fulfill({ contentType: 'text/javascript', body: FAKE_FB }) : r.fulfill({ contentType: 'text/javascript', body: '' }));
  } else {
    await p.route(/gstatic\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  }
  await p.route('http://app.test/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html'; if (!fs.existsSync(ROOT + f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ body: fs.readFileSync(ROOT + f), contentType: f.endsWith('.js') ? 'text/javascript' : 'text/html' }); });
  await p.addInitScript(DETECT);
  await p.addInitScript(([db, ls]) => {
    localStorage.setItem('darts_sound', '0'); localStorage.setItem('darts_caller', '0');
    if (db) localStorage.setItem('darts_db', db);
    for (const k in ls) localStorage.setItem(k, ls[k]);
  }, [db ? JSON.stringify(db) : null, ls]);
  return { p, errs, ctx };
}
export async function open(p, wait = 1200) { await p.goto('http://app.test/index.html'); await p.waitForTimeout(wait); }

// Klik alles met een handler of data-attribuut waarin een marker zit; controleer met een spion
// dat de doelfunctie de ORIGINELE waarde krijgt (geen afgebroken of dubbel-ge-escapete string).
// Afgeleide id's (naam zonder leestekens, bijv. 'gd-Tom') tellen niet: die bevatten geen speciale tekens.
export async function clickMarked(p, originals) {
  return p.evaluate(orig => {
    const bad = [];
    const els = [...document.querySelectorAll('*')].filter(el => [...el.attributes].some(a => (/^on/i.test(a.name) || /^data-/i.test(a.name)) && /dbtx|__x/.test(a.value)));
    for (const el of els) {
      const h = el.getAttribute('onclick') || '';
      const fn = (h.match(/^\s*(?:event\.stopPropagation\(\);)?\s*([A-Za-z_$][\w$]*)\s*\(/) || [])[1];
      const args = [];
      let saved = null;
      if (fn && typeof window[fn] === 'function') { saved = window[fn]; window[fn] = function () { args.push(...arguments); }; }
      try { el.click(); el.dispatchEvent(new MouseEvent('mouseover')); el.dispatchEvent(new FocusEvent('focus')); } catch (e) { bad.push({ cls: 'handler-fout', k: String(e.message).slice(0, 60) }); }
      if (saved) window[fn] = saved;
      args.filter(a => typeof a === 'string' && /dbtx|__x/.test(a) && /[<>"'&`\\%]/.test(a)).forEach(a => { let dec = a; try { dec = decodeURIComponent(a); } catch (e) {} if (!orig.includes(a) && !orig.includes(dec)) bad.push({ cls: 'verkeerde-waarde', k: fn + ': ' + a.slice(0, 50) }); });
    }
    return { clicked: els.length, bad };
  }, originals);
}
export async function hits(p) { return p.evaluate(() => window.__hits.splice(0)); }
export function summarize(name, all, errs) {
  const by = {};
  all.forEach(h => { const key = h.cls; (by[key] = by[key] || new Set()).add(h.step + ':' + h.k); });
  const broken = errs.filter(e => /Invalid or unexpected token|Unexpected (identifier|string|token)|missing \) after/.test(e));
  if (broken.length) by['kapotte-handler'] = new Set(broken.map(e => e.slice(0, 60)));
  const other = errs.filter(e => !broken.includes(e));
  const fails = Object.keys(by).length;
  console.log(`\n${name}: ${fails ? 'GEZAKT' : 'GESLAAGD'}`);
  for (const [k, s] of Object.entries(by)) console.log(`  ${k.padEnd(18)} ${s.size}× ${[...s].slice(0, 8).join(' | ')}${s.size > 8 ? ' …' : ''}`);
  if (other.length) console.log('  overige pageerrors:', other.slice(0, 5));
  return fails === 0;
}
