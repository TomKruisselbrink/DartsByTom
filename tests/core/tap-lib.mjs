// Fase 4C-0 — tikvlakken, gedeelde code voor tests/core/tap-320/360/375/390.mjs.
// Per scenario uit tests/visual/scenarios.mjs (zelfde vaste testdata, klok en toevalsgetallen als de visuele test):
//   overlap     twee bedienbare elementen (inclusief een ::after-tikzone) overlappen elkaar
//   onder-balk  een bedienbaar element ligt (deels) onder de zwevende spelbalk
//   onder-nav   een bedienbaar element ligt onder de navigatie en is ook niet bereikbaar door te scrollen
//   bedekt      een bedienbaar element wordt door iets anders bedekt (geen venster/onderblad)
//   te-klein    kleiner dan 44 px en geen ruimte om te groeien zonder over de helft van de afstand tot een buur te gaan
//   zone-te-groot  een ::after-tikzone claimt meer dan de helft van de afstand tot een buur
// FAALT bij elke bevinding die niet in tap.known.json staat (of vaker voorkomt). tap.known.json is de stand van de
// goedgekeurde versie faf50f0 (v252) en mag alleen met akkoord van Tom worden bijgewerkt:
//   node tests/core/tap-lib.mjs --update
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { suite, ok } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
import { shootAll } from '../visual/shoot.mjs';
import { SCENARIOS, EXPECT } from '../visual/scenarios.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KNOWN_FILE = path.join(HERE, 'tap.known.json');
export const VPS = { 320: [320, 568], 360: [360, 640], 375: [375, 667], 390: [390, 844] };

export const MEASURE = () => {
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const all = [...document.querySelectorAll('button, [onclick], input, select, textarea, a[href], [role=button], label[for]')].filter(vis)
    .filter(e => !e.disabled && getComputedStyle(e).pointerEvents !== 'none');
  const leaves = all.filter(e => !all.some(o => o !== e && e.contains(o)));
  const rect = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
  const zone = e => { // element + eventuele ::after-tikzone (absoluut, met inset)
    const z = rect(e), ps = getComputedStyle(e, '::after');
    if (ps.content && ps.content !== 'none' && ps.position === 'absolute' && ps.pointerEvents !== 'none') {
      const px = x => (x && x !== 'auto') ? parseFloat(x) : null; const r = e.getBoundingClientRect();
      const L = px(ps.left), T = px(ps.top), R = px(ps.right), B = px(ps.bottom);
      const box = { l: L != null ? r.left + L : r.left, t: T != null ? r.top + T : r.top, r: R != null ? r.right - R : r.right, b: B != null ? r.bottom - B : r.bottom };
      return { l: Math.min(z.l, box.l), t: Math.min(z.t, box.t), r: Math.max(z.r, box.r), b: Math.max(z.b, box.b), ext: true };
    }
    return z;
  };
  const lab = e => { const c = (typeof e.className === 'string' && e.className.trim()) ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase(); return c + ' "' + (e.textContent || e.value || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 14) + '"'; };
  const OV = '#game-sheet,.ask-ov,#dbl-yn-overlay,#double-modal,#trn-start-modal,#ios-install-modal,#x01-stats-sheet,#group-modal,#fb-loading,#upd-banner,#install-banner';
  const ac = document.getElementById('app-content'); const canScroll = !!(ac && ac.scrollHeight - ac.clientHeight - ac.scrollTop > 2);
  const out = []; const top = [];
  const scrollable = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll)/.test(cs.overflowY) && a.scrollHeight > a.clientHeight + 2) return a; } return null; };
  const layer = e => e.closest(OV) || e.closest('#game-controls') || e.closest('#pill-nav') || null;
  for (const e of leaves) {
    const r = e.getBoundingClientRect();
    // punten binnen het element (midden en op een kwart), niet op de afgeronde hoeken
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + r.width / 4, r.top + r.height / 4], [r.right - r.width / 4, r.bottom - r.height / 4]].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
    let cover = null;
    for (const [x, y] of pts) { const h = document.elementFromPoint(x, y); if (h && h !== e && !e.contains(h)) { cover = h; break; } }
    if (!cover || e.contains(cover) || cover.contains(e) || (layer(e) && layer(e) === layer(cover))) { top.push(e); continue; }
    if (cover.closest('#game-controls')) out.push(['onder-balk', lab(e)]);
    else if (cover.closest('#pill-nav')) { if (!canScroll) out.push(['onder-nav', lab(e)]); }
    else if (cover.closest(OV) && !e.closest(OV)) { /* achter een venster/onderblad: hoort zo */ }
    else {
      // alleen een vastgezet element (sticky/fixed, bv. "Opslaan" onderin een onderblad) over scrollbare inhoud is bereikbaar
      // door te scrollen; twee gewone elementen die over elkaar liggen blijven dat ook na scrollen
      const pinned = (() => { for (let a = cover; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'sticky' || p === 'fixed') return true; } return false; })();
      const sc = scrollable(e);
      if (pinned && sc && sc.contains(cover) && (sc.scrollTop > 0 || sc.scrollHeight - sc.clientHeight - sc.scrollTop > 2)) { /* bereikbaar door te scrollen */ }
      else out.push(['bedekt', lab(e) + ' door ' + lab(cover)]);
    }
  }
  const Z = top.map(e => ({ e, z: zone(e), r: rect(e) }));
  const hit = (a, b) => a.l < b.r - 0.5 && a.r > b.l + 0.5 && a.t < b.b - 0.5 && a.b > b.t + 0.5;
  // overlap telt alleen binnen dezelfde laag (een onderblad of venster ligt bewust boven de rest)
  for (let i = 0; i < Z.length; i++) for (let j = i + 1; j < Z.length; j++) if (layer(Z[i].e) === layer(Z[j].e) && hit(Z[i].z, Z[j].z)) out.push(['overlap', [lab(Z[i].e), lab(Z[j].e)].sort().join(' × ')]);
  for (const a of Z) {
    const w = a.z.r - a.z.l, h = a.z.b - a.z.t; const needX = Math.max(0, (44 - w) / 2), needY = Math.max(0, (44 - h) / 2);
    let up = 1e9, down = 1e9, left = 1e9, right = 1e9;
    for (const b of Z) { if (b === a || layer(b.e) !== layer(a.e)) continue; const xo = b.r.l < a.r.r && b.r.r > a.r.l, yo = b.r.t < a.r.b && b.r.b > a.r.t;
      if (xo && b.r.b <= a.r.t + 0.5) up = Math.min(up, a.r.t - b.r.b); if (xo && b.r.t >= a.r.b - 0.5) down = Math.min(down, b.r.t - a.r.b);
      if (yo && b.r.r <= a.r.l + 0.5) left = Math.min(left, a.r.l - b.r.r); if (yo && b.r.l >= a.r.r - 0.5) right = Math.min(right, b.r.l - a.r.r); }
    if (a.z.ext) { // zone mag niet verder dan de helft van de afstand tot een buur
      const over = (a.r.t - a.z.t) > up / 2 + 0.5 || (a.z.b - a.r.b) > down / 2 + 0.5 || (a.r.l - a.z.l) > left / 2 + 0.5 || (a.z.r - a.r.r) > right / 2 + 0.5;
      if (over) out.push(['zone-te-groot', lab(a.e)]);
    }
    if ((needX || needY) && !(needY <= Math.min(up, down) / 2 + 0.01 && needX <= Math.min(left, right) / 2 + 0.01)) out.push(['te-klein', lab(a.e) + ' ' + Math.round(a.r.r - a.r.l) + 'x' + Math.round(a.r.b - a.r.t)]);
  }
  return { n: top.length, f: out };
};

export async function measureAll(vpKey, { jobs = 2 } = {}) {
  const [w, h] = VPS[vpKey];
  const items = SCENARIOS.map(s => ({ s, w, h, vn: 'tap-' + vpKey, lang: 'nl', theme: 'dark', file: s.id }));
  const pw = (await import(process.env.PLAYWRIGHT || 'playwright')).default;
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  try { return await shootAll(b, ROOT, '/tmp/dbt-tap', items, { jobs, shot: false, measure: MEASURE }); } finally { await b.close(); }
}
export const keysOf = res => { const k = {}; for (const r of res) for (const [type, l] of r.measure.f) { const key = `${r.id}|${type}|${l}`; k[key] = (k[key] || 0) + 1; } return k; };

export async function runTap(vpKey) {
  const S = suite('tap-' + vpKey);
  const known = JSON.parse(fs.readFileSync(KNOWN_FILE, 'utf8'))[vpKey] || {};
  const res = await measureAll(vpKey);
  await S.t(`${vpKey} px: alle ${SCENARIOS.length} scenario's laden zonder fout`, () => {
    const bad = res.filter(r => r.errors.length || r.setupErr).map(r => r.id + ': ' + (r.setupErr || r.errors[0]));
    ok(res.length === SCENARIOS.length, `${res.length} van ${SCENARIOS.length} gemeten`); ok(!bad.length, bad.join('; '));
  });
  if (vpKey === '390') await S.t('elk scenario landt op het verwachte scherm, instellingenpagina en overlay (EXPECT)', () => {
    const bad = [];
    for (const r of res) { const [scr, sub = '', ov = []] = EXPECT[r.id] || [];
      if (r.screen !== scr) bad.push(`${r.id}: scherm ${r.screen} ≠ ${scr}`);
      if ((r.sub || '') !== sub) bad.push(`${r.id}: pagina ${r.sub || '-'} ≠ ${sub || '-'}`);
      if (JSON.stringify([...r.overlays].sort()) !== JSON.stringify([...ov].sort())) bad.push(`${r.id}: overlays ${JSON.stringify(r.overlays)} ≠ ${JSON.stringify(ov)}`); }
    ok(!bad.length, bad.join('; '));
  });
  const cur = keysOf(res);
  const fresh = Object.entries(cur).filter(([k, n]) => n > (known[k] || 0)).map(([k, n]) => `${k}${n > 1 ? ' ×' + n : ''}${known[k] ? ' (was ' + known[k] + ')' : ''}`);
  const gone = Object.entries(known).filter(([k, n]) => (cur[k] || 0) < n).map(([k]) => k);
  const byType = {}; for (const [k, n] of Object.entries(cur)) { const t = k.split('|')[1]; byType[t] = (byType[t] || 0) + n; }
  await S.t(`${vpKey} px: geen nieuwe tikvlakproblemen t.o.v. faf50f0 (overlap, bedekt, onder balk/nav, te klein, zone)`, () => {
    ok(!fresh.length, fresh.length + ' NIEUW: ' + fresh.slice(0, 12).join(' | '));
  });
  console.log(`\nTIKVLAKKEN ${vpKey} px: ${res.reduce((a, r) => a + r.measure.n, 0)} bedienbare elementen in ${res.length} scenario's`);
  console.log('  BESTAANDE PROBLEMEN (nulmeting faf50f0, niet opgelost, falen niet; meer of nieuwe wel): ' + (Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(', ') || '-'));
  if (gone.length) console.log(`  MINDER DAN DE NULMETING (${gone.length}), na controle en akkoord uit tap.known.json: ` + gone.slice(0, 10).join(' | '));
  return S.done();
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--update')) {
  const out = { _uitleg: 'Nulmeting van de tikvlakken van faf50f0 (v252), per breedte, NL donker, Chromium. Dit zijn BESTAANDE PROBLEMEN, geen goedgekeurde kwaliteit (Tom, 23-11-2026). De tikvlaktests falen op elke bevinding die hier niet in staat of vaker voorkomt (een kleiner element krijgt een nieuwe sleutel en faalt dus ook). Alleen bijwerken met akkoord van Tom: node tests/core/tap-lib.mjs --update' };
  for (const k of Object.keys(VPS)) { const res = await measureAll(k, { jobs: 3 }); const bad = res.filter(r => r.errors.length || r.setupErr); if (bad.length) { console.error('fout in scenario, niets geschreven:', bad.map(r => r.id)); process.exit(1); } out[k] = Object.fromEntries(Object.entries(keysOf(res)).sort()); console.log(k, Object.values(out[k]).reduce((a, b) => a + b, 0), 'bevindingen'); }
  fs.writeFileSync(KNOWN_FILE, JSON.stringify(out, null, 1) + '\n'); console.log('geschreven:', KNOWN_FILE);
}
