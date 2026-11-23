// Fase 4C-0 — dekking van de visuele en tikvlaktests, statisch (geen browser, < 1 s).
// Faalt als de app een scherm, instellingenpagina, overlay of onderblad krijgt dat geen scenario heeft (en niet met reden is
// uitgezonderd), of als de matrix een scenario niet in elke afgesproken dimensie vastlegt.
// Dat een scenario ook echt op de verwachte plek landt, controleert tests/core/tap-390.mjs (met browser).
import fs from 'fs'; import path from 'path';
import { suite, ok } from './h.mjs';
import { ROOT } from '../security/lib.mjs';
import { SCENARIOS, EXPECT, OVERLAYS, OVERLAY_EXEMPT, SHEETS_EXEMPT, PHONES, LANDS, TABLETS, NARROW } from '../visual/scenarios.mjs';
import { matrix } from '../visual/shoot.mjs';
const S = suite('coverage');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const exp = Object.values(EXPECT);

await S.t('elk scenario heeft een verwachting (EXPECT) en omgekeerd', () => {
  const ids = SCENARIOS.map(s => s.id);
  const miss = ids.filter(i => !EXPECT[i]), extra = Object.keys(EXPECT).filter(i => !ids.includes(i));
  ok(!miss.length && !extra.length, `zonder verwachting: ${miss.join(', ')}; verwachting zonder scenario: ${extra.join(', ')}`);
  ok(new Set(ids).size === ids.length, 'dubbele scenario-id');
});
await S.t('elk scherm van de app (.screen) is gedekt', () => {
  const screens = [...new Set([...src.matchAll(/id="(screen-[a-z0-9-]+)"/g)].map(m => m[1]))];
  ok(screens.length >= 20, 'schermen niet gevonden (' + screens.length + ')');
  const miss = screens.filter(sc => !exp.some(e => e[0] === sc));
  ok(!miss.length, 'scherm zonder scenario: ' + miss.join(', '));
});
await S.t('elke instellingenpagina (st-page) is gedekt', () => {
  const pages = [...src.matchAll(/class="st-page"[^>]*data-page="(\w+)"/g)].map(m => m[1]);
  ok(pages.length >= 6, 'pagina\'s niet gevonden');
  const miss = pages.filter(pg => !exp.some(e => e[1] === pg));
  ok(!miss.length, 'instellingenpagina zonder scenario: ' + miss.join(', '));
});
await S.t('elke overlay (vast, z-index ≥ 9000) staat in OVERLAYS en is gedekt of met reden uitgezonderd', () => {
  const CHROME = new Set(['#game-controls', '#pill-nav']); // vaste balken, geen overlay; gedekt in elk spel-/hoofdscherm
  const ALIAS = { '.game-sheet': '#game-sheet' };
  const found = new Set();
  for (const m of src.matchAll(/id=["\\']*([\w-]+)["\\']*[^>]{0,400}?z-index:\s*(\d+)/g)) if (+m[2] >= 9000) found.add('#' + m[1]);
  for (const m of src.matchAll(/\.id='([\w-]+)'[^;]*;[^\n]{0,300}z-index:(\d+)/g)) if (+m[2] >= 9000) found.add('#' + m[1]);
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const z = body.match(/z-index\s*:\s*(\d+)/); if (!z || +z[1] < 9000) continue;
    const s1 = sel.replace(/\/\*[\s\S]*?\*\//g, '').trim(); if (/^[#.][\w-]+$/.test(s1)) found.add(ALIAS[s1] || s1);
  }
  const known = new Set(Object.values(OVERLAYS));
  const unknown = [...found].filter(x => !CHROME.has(x) && !known.has(x));
  ok(!unknown.length, 'nieuwe overlay zonder plek in OVERLAYS: ' + unknown.join(', '));
  const covered = new Set(exp.flatMap(e => (e[2] || []).map(o => o.startsWith('sheet:') ? 'sheet' : o)));
  const miss = Object.keys(OVERLAYS).filter(k => !covered.has(k) && !OVERLAY_EXEMPT[k]);
  ok(!miss.length, 'overlay niet gedekt en niet uitgezonderd: ' + miss.join(', '));
  const stale = Object.keys(OVERLAY_EXEMPT).filter(k => covered.has(k));
  ok(!stale.length, 'uitgezonderd maar inmiddels gedekt (haal uit de lijst): ' + stale.join(', '));
});
await S.t('elk onderblad (openGameSheet) is gedekt of met reden uitgezonderd', () => {
  const titles = [...new Set([...src.matchAll(/openGameSheet\('([^']*)'/g)].map(m => m[1]))];
  ok(titles.length >= 15, 'onderbladen niet gevonden');
  const covered = new Set(exp.flatMap(e => (e[2] || []).filter(o => o.startsWith('sheet:')).map(o => o.slice(6))));
  const miss = titles.filter(t => !covered.has(t) && !SHEETS_EXEMPT[t]);
  ok(!miss.length, 'onderblad zonder scenario en zonder reden: ' + miss.join(' | '));
  const gone = Object.keys(SHEETS_EXEMPT).filter(t => !titles.includes(t));
  ok(!gone.length, 'uitzondering voor een onderblad dat niet meer bestaat: ' + gone.join(' | '));
});
await S.t('matrix: elk scenario in elke afgesproken dimensie', () => {
  const m = matrix(); const has = (id, vn, lang, theme) => m.some(i => i.s.id === id && i.vn === vn && i.lang === lang && i.theme === theme);
  const bad = [];
  for (const s of SCENARIOS) {
    for (const [, , vn] of PHONES) for (const lang of ['nl', 'en']) for (const th of ['light', 'dark']) if (!has(s.id, vn, lang, th)) bad.push(`${s.id} ${vn} ${lang} ${th}`);
    if (s.land) for (const [, , vn] of LANDS) for (const lang of ['nl', 'en']) for (const th of ['light', 'dark']) if (!has(s.id, vn, lang, th)) bad.push(`${s.id} ${vn} ${lang} ${th}`);
    for (const [, , vn] of TABLETS.concat(NARROW)) for (const th of ['light', 'dark']) if (!has(s.id, vn, 'nl', th)) bad.push(`${s.id} ${vn} nl ${th}`);
    for (const th of ['auto-dark', 'auto-light']) if (!has(s.id, 'mobiel', 'nl', th)) bad.push(`${s.id} mobiel nl ${th}`);
    if (s.land && !has(s.id, 'kantine-1920', 'nl', 'auto-dark')) bad.push(`${s.id} kantine-1920 nl auto-dark`);
  }
  ok(!bad.length, bad.length + ' ontbreken, bv. ' + bad.slice(0, 5).join('; '));
});
await S.t('de 46 scenario\'s van de goedgekeurde baseline v252 staan er nog, in dezelfde volgorde', () => {
  const V252 = 'home,home-leeg,setup-1-spelkeuze,setup-2-x01,setup-2-halveit,setup-2-randomco,setup-2-afgooien,setup-3-spelers,x01-2sp,x01-4sp,x01-teams,x01-double-vraag,x01-dubbel-kiezen,x01-stats-blad,cricket,atc,shanghai,halveit,bobs27,checkout121,randomco,eliminatie,afgooien-bull,afgooien,afgooien-nummers,potje-afronden,winst,verlies-solo,rematch,geschiedenis,geschiedenis-detail,statistieken,statistieken-x01,ranglijst,instellingen,inst-account,inst-vrienden,inst-account-ingelogd,inst-vrienden-ingelogd,inst-spelers,inst-spel,inst-weergave,inst-gegevens,toernooi-setup,toernooi-overzicht,toernooi-stand';
  ok(SCENARIOS.slice(0, 46).map(s => s.id).join(',') === V252, 'de oorspronkelijke scenariolijst is veranderd');
});
process.exit(S.done());
