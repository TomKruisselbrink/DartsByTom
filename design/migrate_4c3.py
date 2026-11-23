#!/usr/bin/env python3
"""Fase 4C-3, W1: themaregels van componenten -> tokens (0 pixels).

Per groep:
  - nieuwe tokens (donkere standaard in het :root-tokenblok, lichte waarde in BEIDE lichte overrides van het blok);
  - exacte tekstvervangingen in <style> (elke 'oud' moet precies 1x voorkomen, anders stopt het script).
Classificatie en bewijs per declaratie: design/4c3-log/classificatie.json (design/classify_4c3.mjs).
Regels:
  R1 WERKZAAM en omzetbaar  -> de basisregel krijgt var(--token); de lichte declaraties verdwijnen.
  R2 OVERBODIG              -> lichte declaratie verdwijnt (de basisregel / een bestaand token geeft al dezelfde waarde).
  R3 OVERSCHREVEN           -> verdwijnt alleen als de declaratie die hem overschrijft hier zelf wordt omgezet
                               (anders zou hij werkzaam worden); anders blijft hij staan (uitzondering, W2).
  R4 niet waargenomen / niet omzetbaar / bestaande fout -> blijft staan (uitzondering, W2).
Gebruik: python3 design/migrate_4c3.py <groep>     (groepen: nav, kaarten, achtergrond)
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
IDX = os.path.join(REPO, 'index.html')

# naam, donker (standaard), licht, bron/reden
GROUPS = {
  'nav': {
    'titel': 'navigatie en spelbalk',
    'tokens': [
      ('--nav-bg', 'rgba(28,28,30,0.92)', 'rgba(255,255,255,.9)', '#pill-nav achtergrond; geen bestaand token met dit paar (--header-bg verschilt per stand)'),
      ('--nav-border', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,.08)', '#pill-nav rand; --border heeft in licht rgba(60,40,30,.10)'),
      ('--nav-shadow', '0 4px 28px rgba(0,0,0,.5)', '0 4px 24px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06)', '#pill-nav schaduw; uniek'),
      ('--nav-tab', 'rgba(255,255,255,0.42)', 'rgba(0,0,0,.42)', '.pn-tab tekst; uniek'),
      ('--nav-badge-ring', 'rgba(28,28,30,.92)', '#fff', 'ring om het meldingsstipje (#pn-settings.has-badge::after); donker = --nav-bg, licht niet'),
      ('--controls-bg', 'rgba(30,30,30,0.72)', 'rgba(255,255,255,0.82)', '#game-controls achtergrond; uniek'),
      ('--controls-border', 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.1)', '#game-controls rand; uniek'),
    ],
    'edits': [
      # spelbalk: basisregel -> tokens; lichte regels weg (R1)
      ('  background:rgba(30,30,30,0.72);\n  backdrop-filter:blur(24px)', '  background:var(--controls-bg);\n  backdrop-filter:blur(24px)', 'R1 #game-controls background'),
      ('  border:0.5px solid rgba(255,255,255,0.12);\n  border-radius:30px;', '  border:0.5px solid var(--controls-border);\n  border-radius:30px;', 'R1 #game-controls border-color'),
      ('[data-theme="light"] #game-controls{background:rgba(255,255,255,0.82);border-color:rgba(0,0,0,0.1);}\n@media(prefers-color-scheme:light){:root:not([data-theme="dark"]) #game-controls{background:rgba(255,255,255,0.82);border-color:rgba(0,0,0,0.1);}}\n', '', 'R1 lichte #game-controls-regels weg (2)'),
      # onderste navigatie
      ('  background:rgba(28,28,30,0.92);\n  border:0.5px solid rgba(255,255,255,0.1);\n  border-radius:40px;', '  background:var(--nav-bg);\n  border:0.5px solid var(--nav-border);\n  border-radius:40px;', 'R1 #pill-nav background + border-color'),
      ('  box-shadow:0 4px 28px rgba(0,0,0,.5);\n  transition:opacity .22s ease', '  box-shadow:var(--nav-shadow);\n  transition:opacity .22s ease', 'R1 #pill-nav box-shadow'),
      ('  color:rgba(255,255,255,0.42);\n  transition:color .3s ease', '  color:var(--nav-tab);\n  transition:color .3s ease', 'R1 .pn-tab color'),
      ('background:#E5484D;box-shadow:0 0 0 2px rgba(28,28,30,.92)}', 'background:#E5484D;box-shadow:0 0 0 2px var(--nav-badge-ring)}', 'R1 #pn-settings.has-badge::after box-shadow'),
      ('/* ═══ Onderbalk in licht thema (v212) ═══ */\n@media (prefers-color-scheme:light){\n'
       '  :root:not([data-theme="dark"]) #pill-nav{background:rgba(255,255,255,.9);border-color:rgba(0,0,0,.08);box-shadow:0 4px 24px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06)}\n'
       '  :root:not([data-theme="dark"]) .pn-tab{color:rgba(0,0,0,.42)}\n'
       '  :root:not([data-theme="dark"]) .pn-tab.active{color:var(--text-on-fill)}\n'
       '  :root:not([data-theme="dark"]) #pn-settings.has-badge::after{box-shadow:0 0 0 2px #fff}\n'
       '}\n'
       ':root[data-theme="light"] #pill-nav{background:rgba(255,255,255,.9);border-color:rgba(0,0,0,.08);box-shadow:0 4px 24px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06)}\n'
       ':root[data-theme="light"] .pn-tab{color:rgba(0,0,0,.42)}\n'
       ':root[data-theme="light"] .pn-tab.active{color:var(--text-on-fill)}\n'
       ':root[data-theme="light"] #pn-settings.has-badge::after{box-shadow:0 0 0 2px #fff}\n',
       '/* ═══ Onderbalk in licht thema (v212): sinds 4C-3 via --nav-* (tokenblok) ═══ */\n',
       'R1 lichte navigatieregels weg (8); .pn-tab.active werd alleen nodig doordat de lichte .pn-tab specifieker was (na R1 wint de basisregel .pn-tab.active weer)'),
    ],
  },
}


def tokens_into_block(src, toks):
    """Voegt tokens toe aan het 4C-1-tokenblok: donker in :root, licht in beide lichte overrides."""
    start = src.index('/* ═══ Ontwerpsysteem-tokens (fase 4C-1) ═══')
    end = src.index('/* ─── DESIGN TOKENS ─── */', start)
    block = src[start:end]
    root_close = block.index('\n}\n:root[data-theme="light"]{')
    dark = ''.join(f'\n  {n}:{d};  /* {r} */' for n, d, l, r in toks)
    if '/* componenten (4C-3) */' not in block:
        dark = '\n  /* componenten (4C-3): themawaarden van componenten; donker = standaard, licht in de overrides hieronder */' + dark
    block = block[:root_close] + dark + block[root_close:]
    light = ''.join(f'\n  {n}:{l};' for n, d, l, r in toks)
    a = block.index(':root[data-theme="light"]{'); a_end = block.index('\n}', a)
    block = block[:a_end] + light + block[a_end:]
    b = block.index('@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){'); b_end = block.index('\n}}', b)
    block = block[:b_end] + light + block[b_end:]
    return src[:start] + block + src[end:]


def main():
    g = sys.argv[1]
    G = GROUPS[g]
    src = open(IDX, encoding='utf-8').read()
    log = {'groep': g, 'titel': G['titel'], 'tokens': [], 'edits': []}
    for old, new, note in G['edits']:
        n = src.count(old)
        if n != 1:
            sys.exit(f'STOP: "{old[:70]}" komt {n}x voor ({note})')
        pos = src.index(old)
        styles = [(m.start(1), m.end(1)) for m in re.finditer(r'<style[^>]*>(.*?)</style>', src, re.S)]
        if not any(a <= pos and pos + len(old) <= b for a, b in styles):
            sys.exit(f'STOP: vervanging buiten <style> ({note})')
        src = src.replace(old, new)
        log['edits'].append({'reden': note, 'oud': old, 'nieuw': new})
    names = [t[0] for t in G['tokens']]
    for n in names:
        if re.search(re.escape(n) + r'\s*:', src):
            sys.exit(f'STOP: token {n} bestaat al')
    src = tokens_into_block(src, G['tokens'])
    log['tokens'] = [{'naam': n, 'donker': d, 'licht': l, 'reden': r} for n, d, l, r in G['tokens']]
    open(IDX, 'w', encoding='utf-8').write(src)
    os.makedirs(os.path.join(HERE, '4c3-log'), exist_ok=True)
    json.dump(log, open(os.path.join(HERE, '4c3-log', f'w1-{g}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{g}: {len(G["edits"])} vervangingen, {len(names)} tokens: {", ".join(names)}')


if __name__ == '__main__':
    main()
