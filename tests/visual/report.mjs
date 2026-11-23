// HTML-overzicht van een opname-run of vergelijking (alleen voor mensen; niet nodig voor de test zelf).
import fs from 'fs'; import path from 'path';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function writeReport(out, res, diffs = null) {
  const byId = {}; res.forEach(r => (byId[r.id] = byId[r.id] || []).push(r));
  let h = `<!doctype html><meta charset="utf-8"><title>Darts by Tom – visuele baseline</title><style>body{font:13px system-ui;margin:16px;background:#f4f4f5}h2{margin:28px 0 6px}figure{display:inline-block;margin:4px;vertical-align:top;background:#fff;padding:4px;border-radius:6px}figure img{display:block;max-height:280px;border:1px solid #ddd}figcaption{font-size:11px;max-width:240px}.bad{color:#b3261e}.diff{outline:3px solid #b3261e}</style><h1>Darts by Tom – visuele baseline (${res.length} opnames)</h1>`;
  for (const [id, rs] of Object.entries(byId)) {
    h += `<h2>${esc(rs[0].group)} · ${esc(rs[0].label)} <small>(${esc(id)})</small></h2>`;
    for (const r of rs) {
      const d = diffs && diffs[r.file]; const f = [];
      if (r.errors.length || r.setupErr) f.push('fout: ' + esc(r.setupErr || r.errors[0]));
      if (r.overflow) f.push('horizontale overloop'); if (r.untranslated.length) f.push('niet vertaald: ' + esc(r.untranslated.join(', ')));
      if (r.underBar.length) f.push('onder spelbalk: ' + esc(r.underBar.join(', '))); if (r.needsScroll && r.screen.startsWith('screen-') && /game|atc|shanghai|halveit|checkout121|randomco|cricket|eliminatie|afgooien|bobs27/.test(r.screen)) f.push('spelscherm scrolt');
      h += `<figure${d && d.pixels ? ' class="diff"' : ''}><a href="${esc(r.file)}"><img loading="lazy" src="${esc(d && d.pixels ? d.diff : r.file)}"></a><figcaption>${esc(r.vp)} · ${esc(r.lang)} · ${esc(r.theme)}${d ? ` · <b class="${d.pixels ? 'bad' : ''}">${d.pixels} px verschil</b>` : ''}${f.length ? '<br><span class="bad">' + f.join('<br>') + '</span>' : ''}</figcaption></figure>`;
    }
  }
  fs.writeFileSync(path.join(out, 'index.html'), h);
}
