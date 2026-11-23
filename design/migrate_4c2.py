#!/usr/bin/env python3
"""Fase 4C-2: vervang hardgecodeerde CSS-waarden in index.html door tokens met exact dezelfde waarde.

Gebruik:  python3 design/migrate_4c2.py <groep> [--dry]
Groepen (in deze volgorde): navigatie, home-setup, spellen, overzichten, instellingen, toernooi, basis

Regels (bewust mechanisch, zodat de uitkomst controleerbaar is):
- alleen in <style>-blokken; niet in het tokenblok zelf, niet in @font-face, niet in @keyframes-stappen,
  niet in declaraties met url(...). Inline style="" in HTML en stijlen in JS-strings vallen erbuiten (stap 4X).
- vaste kleuren -> token met dezelfde vaste waarde (basispalet, of --accent/--danger/--hit die op :root vast zijn);
- kleuren die per thema verschillen -> semantisch token ALLEEN als dezelfde selector een lichte override heeft in
  beide vormen ([data-theme="light"] X én :root:not([data-theme="dark"]) X) met precies de lichte tokenwaarde;
- alias-wissel var(--muted)->var(--text-muted), var(--shadow)->var(--elev-1), var(--shadow-lg)->var(--elev-3)
  (veilig: --muted/--shadow/--shadow-lg worden alleen op :root gedefinieerd, gecontroleerd in 4C-2);
- maten alleen bij een volledige, exacte waarde (font-size, font-weight 400/700, border-radius met één waarde,
  padding/margin/gap per deel), z-index alleen per bekende selector.
Elke vervanging wordt gelogd (design/4c2-log/<groep>.json).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, 'index.html')
TOK_START, TOK_END = '/* ═══ Ontwerpsysteem-tokens (fase 4C-1) ═══', '/* ─── DESIGN TOKENS ─── */'

GROUPS = [
    ('navigatie', r'#pill-nav|\.pn-|#pn-|#game-controls|\.gc-|#game-sheet|\.game-sheet|\.x01-sheet|#x01-stats-sheet|\.ask-|#upd-banner|\.upd-|#install-banner|#ios-install|\.ios-install|\.toast|#app-header|#app-content|\.dbl-|#dbl-|#double-modal|#trn-start-modal'),
    ('home-setup', r'#screen-home|\.home-|#home-|#screen-setup|\.setup-|\.game-select|\.seg-|\.known-name|\.kn-|\.hi-legend|\.hi-tile|\.hi-add|\.seq-|\.coin|\.wheel|\.info-block|\.trn-fmt'),
    ('spellen', r'#screen-(game|atc|shanghai|halveit|checkout121|randomco|cricket|afgooien|afgooien-bull|eliminatie|bobs27)\b|\.g-|\.x-|\.x01|#x01|#sb-|\.numpad|\.co-|#checkout|\.cr-|\.rco|#rco|\.afg|#afg|\.eli|#eli|\.bob|\.hi-|#hi-|\.atc|\.sh-|\.co121|#co121|\.dc-|\.dart'),
    ('overzichten', r'#screen-(stats|history|leaderboard|win)\b|\.lb-|#lb-|\.hist|#hist|\.win-|\.stat|#stat|\.rec-|\.h2h|\.chart|\.leg-|\.bl-|\.empty-state'),
    ('instellingen', r'#screen-settings|\.st-|#st-|\.ios-toggle|\.acct|#acct|\.fr-|#fr-|\.sp-'),
    ('toernooi', r'#screen-trn|\.trn-|#trn-|\.ko-|\.rr-'),
    ('basis', r'.'),
]
THEME_PREFIX = r'(:root)?(\[data-theme="(light|dark)"\]|:not\(\[data-theme="(light|dark)"\]\))|html\[data-theme="(light|dark)"\]'

def strip_theme(sel):
    return re.sub(r'^\s*(' + THEME_PREFIX + r')\s*', '', sel.strip()).strip()

def group_of(selector):
    sels = [strip_theme(s) for s in re.sub(r'/\*.*?\*/', '', selector, flags=re.S).split(',')]
    joined = ','.join(sels)
    for name, pat in GROUPS:
        if re.search(pat, joined):
            return name
    return 'basis'

FIXED_HEX = {  # waarde -> token (overal dezelfde waarde)
    '#B94E2A': 'var(--accent)', '#FF3B30': 'var(--danger)', '#3E7B4F': 'var(--hit)',
    '#E07A55': 'var(--terra-300)', '#A8431F': 'var(--terra-600)', '#9A3F22': 'var(--terra-700)',
    '#8FCB9C': 'var(--green-300)', '#5E9E6E': 'var(--green-400)', '#2F6B40': 'var(--green-600)', '#1E5631': 'var(--green-700)',
    '#9DBF9E': 'var(--sage-300)', '#FF8A7A': 'var(--red-300)', '#B3261E': 'var(--red-700)',
}
DEFINES = {'var(--accent)': '--accent', 'var(--danger)': '--danger', 'var(--hit)': '--hit', 'var(--sage-300)': '--accent2'}
THEMED = [  # token, donker, licht, eigenschap-patroon
    ('var(--text-soft)', '#C9BFB8', '#48484A', r'^(color|--su-soft|--su-btn)$'),
    ('var(--sunken)', '#141314', 'rgba(0,0,0,.06)', r'^(background|background-color|--su-well)$'),
    ('var(--accent-text)', '#E07A55', '#A8431F', r'^(color|--su-orange-text|--setup-accent-text)$'),
    ('var(--hit-text)', '#8FCB9C', '#2F6B40', r'^(color|--su-green-text)$'),
    ('var(--hit-soft)', 'rgba(62,123,79,.28)', 'rgba(62,123,79,.18)', r'^(background|background-color)$'),
    ('var(--danger-text)', '#FF8A7A', '#B3261E', r'^color$'),
    ('var(--elev-4)', '0 20px 60px rgba(0,0,0,.45)', '0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)', r'^box-shadow$'),
]
RGBA = [  # (r,g,b,a), token, eigenschap-patroon
    ((185, 78, 42, .16), 'var(--accent-soft)', r'^(background|background-color|border-color)$'),
    ((185, 78, 42, .35), 'var(--accent-ring)', r'^(box-shadow|border|border-color|outline|outline-color)$'),
    ((0, 0, 0, .55), 'var(--scrim)', r'^(background|background-color)$'),
    ((255, 59, 48, .1), 'var(--danger-soft)', r'^(background|background-color)$'),
]
FS = {'11px': 'var(--fs-micro)', '12px': 'var(--fs-caption)', '13px': 'var(--fs-small)', '15px': 'var(--fs-body)',
      '17px': 'var(--fs-body-lg)', '20px': 'var(--fs-title)', '28px': 'var(--fs-stat)', '34px': 'var(--fs-headline)'}
FW = {'400': 'var(--fw-regular)', '700': 'var(--fw-bold)'}
RADIUS = {'6px': 'var(--r-xs)', '8px': 'var(--r-sm)', '10px': 'var(--r-md)', '12px': 'var(--r-lg)', '14px': 'var(--r-xl)',
          '16px': 'var(--r-2xl)', '20px': 'var(--r-3xl)', '999px': 'var(--r-pill)', '50%': 'var(--r-round)', '22px': 'var(--r-score-xl)'}
SP = {'2px': 'var(--sp-1)', '4px': 'var(--sp-2)', '6px': 'var(--sp-3)', '8px': 'var(--sp-4)', '10px': 'var(--sp-5)', '12px': 'var(--sp-6)',
      '14px': 'var(--sp-7)', '16px': 'var(--sp-8)', '20px': 'var(--sp-10)', '24px': 'var(--sp-12)', '32px': 'var(--sp-16)'}
ZSEL = {'body::before': ('0', 'var(--z-base)'), '#app-header,#app-content': ('1', 'var(--z-content)'),
        '#install-banner': ('9980', 'var(--z-install)'), '#game-controls': ('9970', 'var(--z-game-controls)'),
        '.ask-ov': ('10050', 'var(--z-confirm)'), '#x01-stats-sheet': ('9990', 'var(--z-sheet)'), '.game-sheet': ('9990', 'var(--z-sheet)'),
        '.seq-item-cont.seq-row-dragging': ('100', 'var(--z-drag)'), '.setup-action-bar': ('10', 'var(--z-sticky)'), '#pill-nav': ('9980', 'var(--z-nav)')}
ALIAS = [(r'var\(--muted\)', 'var(--text-muted)'), (r'var\(--shadow\)', 'var(--elev-1)'), (r'var\(--shadow-lg\)', 'var(--elev-3)')]
SP_PROPS = r'^(gap|row-gap|column-gap|padding|padding-(top|right|bottom|left)|margin|margin-(top|right|bottom|left))$'

def norm(v):
    return re.sub(r'\s+', '', v).lower().replace('0.', '.')

def rgba_tuple(s):
    m = re.fullmatch(r'rgba\(([^)]*)\)', s.replace(' ', ''))
    if not m: return None
    p = m.group(1).split(',')
    if len(p) != 4: return None
    try: return tuple(float(x) for x in p)
    except ValueError: return None

def light_overrides(css_all):
    """(gestripte selector, eigenschap) -> {'a': waarde [data-theme=light], 'b': waarde :root:not(dark)}"""
    out = {}
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css_all):
        sels = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S).split(',')
        for s in sels:
            s = s.strip()
            kind = 'a' if re.match(r'^(:root|html)?\[data-theme="light"\]', s) else 'b' if re.match(r'^:root:not\(\[data-theme="dark"\]\)', s) else None
            if not kind: continue
            base = strip_theme(s)
            for d in m.group(2).split(';'):
                if ':' not in d: continue
                p, v = d.split(':', 1)
                out.setdefault((base, p.strip()), {})[kind] = norm(v.replace('!important', ''))
    return out

def replace_decl(prop, val, selector, lo, log):
    """geeft nieuwe waarde terug (of dezelfde)."""
    imp = ''
    m = re.search(r'\s*!important\s*$', val)
    if m: imp, val = val[m.start():], val[:m.start()]
    orig = val
    v = val.strip()
    sels = [strip_theme(s) for s in re.sub(r'/\*.*?\*/', '', selector, flags=re.S).split(',')]
    themed_rule = bool(re.search(r'data-theme', selector))
    # 1. per thema verschillende kleuren/schaduw: alleen in basisregels met beide lichte overrides
    if not themed_rule:
        for tok, dark, light, pp in THEMED:
            if re.match(pp, prop) and norm(v) == norm(dark):
                if all(lo.get((s, prop), {}).get('a') == norm(light) and lo.get((s, prop), {}).get('b') == norm(light) for s in sels):
                    log.append(('thema', prop, orig.strip(), tok)); return val.replace(v, tok) + imp
    # 2. alias-wissel
    for pat, tok in ALIAS:
        if re.search(pat + r'(?![\w-])', v):
            nv = re.sub(pat + r'(?![\w-])', tok, v)
            log.append(('alias', prop, v, nv)); v = nv
    # 3. vaste hex-kleuren (ook in verlopen/schaduwen); nooit in de eigen definitie
    def hexrep(mm):
        h = mm.group(0).upper()
        tok = FIXED_HEX.get(h)
        if not tok or DEFINES.get(tok) == prop: return mm.group(0)
        log.append(('kleur', prop, mm.group(0), tok)); return tok
    v = re.sub(r'#[0-9a-fA-F]{6}(?![0-9a-fA-F])', hexrep, v)
    if prop == 'color' and v.lower() in ('#fff', '#ffffff'):
        log.append(('kleur', prop, v, 'var(--text-on-fill)')); v = 'var(--text-on-fill)'
    # 4. vaste rgba-kleuren (alleen bij passende eigenschap)
    def rgbarep(mm):
        t = rgba_tuple(mm.group(0))
        if t:
            for want, tok, pp in RGBA:
                if re.match(pp, prop) and all(abs(a - b) < 1e-9 for a, b in zip(t, want)):
                    log.append(('kleur', prop, mm.group(0), tok)); return tok
        return mm.group(0)
    v = re.sub(r'rgba\([^)]*\)', rgbarep, v)
    # 5. maten
    if prop == 'font-size' and v in FS: log.append(('maat', prop, v, FS[v])); v = FS[v]
    elif prop == 'font-weight' and v in FW: log.append(('maat', prop, v, FW[v])); v = FW[v]
    elif prop == 'border-radius' and v in RADIUS: log.append(('maat', prop, v, RADIUS[v])); v = RADIUS[v]
    elif re.match(SP_PROPS, prop):
        parts = v.split()
        if 1 <= len(parts) <= 4 and all(p in SP or p in ('0', 'auto') or re.fullmatch(r'\d+(\.\d+)?px', p) for p in parts) and any(p in SP for p in parts):
            nv = ' '.join(SP.get(p, p) for p in parts); log.append(('ruimte', prop, v, nv)); v = nv
    elif prop == 'z-index':
        key = ','.join(sels)
        if key in ZSEL and ZSEL[key][0] == v: log.append(('laag', prop, v, ZSEL[key][1])); v = ZSEL[key][1]
    elif prop == 'opacity' and v == '.38' and any(s.endswith('.g-prow.out') for s in sels):
        log.append(('status', prop, v, 'var(--state-out-opacity)')); v = 'var(--state-out-opacity)'
    if v == orig.strip(): return orig + imp
    lead = orig[:len(orig) - len(orig.lstrip())]; trail = orig[len(orig.rstrip()):]
    return lead + v + trail + imp

def process_css(css, group, lo, log):
    out = []; pos = 0
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel, body = m.group(1), m.group(2)
        sel_clean = re.sub(r'/\*.*?\*/', '', sel, flags=re.S).strip()
        out.append(css[pos:m.start(2)]); pos = m.end(2)
        if ('@font-face' in sel_clean or re.fullmatch(r'(\d+(\.\d+)?%|from|to)(\s*,\s*(\d+(\.\d+)?%|from|to))*', sel_clean)
                or group_of(sel) != group):
            out.append(body); continue
        decls = []
        for d in re.split(r'(;)', body):
            if d == ';' or ':' not in d or 'url(' in d or d.strip().startswith('/*'):
                decls.append(d); continue
            p, v = d.split(':', 1)
            n = len(log)
            nv = replace_decl(p.strip(), v, sel, lo, log)
            for k in range(n, len(log)): log[k] = (group, sel_clean[-80:]) + log[k]
            decls.append(p + ':' + nv)
        out.append(''.join(decls))
    out.append(css[pos:])
    return ''.join(out)

def main():
    group = sys.argv[1]; dry = '--dry' in sys.argv
    assert group in [g for g, _ in GROUPS], group
    src = open(F, encoding='utf-8').read()
    i0, i1 = src.index(TOK_START), src.index(TOK_END)
    styles = list(re.finditer(r'(<style[^>]*>)(.*?)(</style>)', src, re.S))
    lo = light_overrides(''.join(m.group(2) for m in styles))
    log = []; res = []; pos = 0
    for m in styles:
        res.append(src[pos:m.start(2)]); a, b = m.start(2), m.end(2)
        if a <= i0 < b:  # tokenblok overslaan
            res.append(process_css(src[a:i0], group, lo, log)); res.append(src[i0:i1]); res.append(process_css(src[i1:b], group, lo, log))
        else:
            res.append(process_css(src[a:b], group, lo, log))
        pos = b
    res.append(src[pos:])
    new = ''.join(res)
    os.makedirs(os.path.join(ROOT, 'design', '4c2-log'), exist_ok=True)
    if not dry:
        open(F, 'w', encoding='utf-8').write(new)
        json.dump([dict(zip(['groep', 'selector', 'soort', 'eigenschap', 'oud', 'nieuw'], r)) for r in log],
                  open(os.path.join(ROOT, 'design', '4c2-log', group + '.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    from collections import Counter
    print(f'{group}: {len(log)} vervangingen', dict(Counter(r[2] for r in log)))

if __name__ == '__main__':
    main()
