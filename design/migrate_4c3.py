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
IDX = os.environ.get('IDX') or os.path.join(REPO, 'index.html')

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
  'kaarten': {
   "titel": "kaarten en spelstatus",
   "tokens": [
    [
     "--card-border",
     "var(--border)",
     "rgba(60,40,30,.07)",
     ".card rand; donker volgt --border, licht eigen waarde (v217)"
    ],
    [
     "--card-shadow",
     "var(--elev-1)",
     "0 1px 2px rgba(60,40,30,.05),0 6px 18px -6px rgba(60,40,30,.10)",
     ".card schaduw; donker volgt --elev-1, licht eigen waarde (v217)"
    ],
    [
     "--tile-shadow",
     "none",
     "0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)",
     "diepte van tegels/kaarten in licht (v241); donker geen schaduw. --elev-4 heeft in licht dezelfde waarde, maar in donker niet none"
    ],
    [
     "--tile-shadow-on",
     "none",
     "0 0 0 1px var(--accent-ring),0 10px 26px -8px rgba(185,78,42,.45),0 0 32px -6px rgba(185,78,42,.30)",
     "gloed actieve speler in licht (v241); donker geen"
    ],
    [
     "--tag-text",
     "var(--green-300)",
     "var(--green-700)",
     ".x-last en .sp-tag tekst; --hit-text heeft in licht green-600, niet 700"
    ],
    [
     "--last-bg",
     "rgba(62,123,79,.22)",
     "rgba(62,123,79,.16)",
     ".x-last achtergrond; uniek"
    ],
    [
     "--last-bust-bg",
     "rgba(255,90,70,.14)",
     "rgba(179,38,30,.1)",
     ".x-last.bust achtergrond; uniek"
    ],
    [
     "--miss-border",
     "rgba(255,122,107,.5)",
     "rgba(179,38,30,.45)",
     ".g-miss stippelrand; uniek"
    ],
    [
     "--chip-text",
     "#CFEAD5",
     "var(--green-700)",
     ".g-chip tekst; uniek"
    ],
    [
     "--metric-shadow",
     "var(--elev-1)",
     "var(--tile-shadow)",
     ".metric (statistiektegels): donker --elev-1; licht de tegelschaduw (v241). In-place omzetten kon niet: de latere .metric-regel won dan in licht"
    ]
   ],
   "edits": [
    [
     ".co-lbl{color:var(--hit-text)}[data-theme=\"light\"] .co-lbl{color:var(--green-600)}\n@media(prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .co-lbl{color:var(--green-600)}}\n",
     ".co-lbl{color:var(--hit-text)}\n",
     "R2 .co-lbl: lichte waarde = --hit-text licht (2 regels weg)"
    ],
    [
     "background:rgba(62,123,79,.22);color:var(--green-300);vertical-align:1px}",
     "background:var(--last-bg);color:var(--tag-text);vertical-align:1px}",
     "R1 .x-last achtergrond + tekst"
    ],
    [
     ".x-last.bust{background:rgba(255,90,70,.14);color:var(--danger-text)}",
     ".x-last.bust{background:var(--last-bust-bg);color:var(--danger-text)}",
     "R1 .x-last.bust achtergrond (tekst: --danger-text is licht al red-700)"
    ],
    [
     "[data-theme=\"light\"] .x-last{color:var(--green-700);background:rgba(62,123,79,.16)}[data-theme=\"light\"] .x-last.bust{color:var(--red-700);background:rgba(179,38,30,.1)}\n@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .x-last{color:var(--green-700);background:rgba(62,123,79,.16)}:root:not([data-theme=\"dark\"]) .x-last.bust{color:var(--red-700);background:rgba(179,38,30,.1)}}\n",
     "",
     "R1/R2 lichte .x-last- en .x-last.bust-regels weg (4)"
    ],
    [
     "border-radius:7px;background:rgba(62,123,79,.2);color:var(--green-300)}",
     "border-radius:7px;background:rgba(62,123,79,.2);color:var(--tag-text)}",
     "R1 .sp-tag tekst"
    ],
    [
     "[data-theme=\"light\"] .sp-tag{color:var(--green-700)}\n@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .sp-tag{color:var(--green-700)}}\n",
     "",
     "R1 lichte .sp-tag-regels weg (2)"
    ],
    [
     ".standing-pts{color:var(--green-300) !important;",
     ".standing-pts{color:var(--hit-text) !important;",
     "R1 .standing-pts: bestaand token --hit-text (donker green-300, licht green-600)"
    ],
    [
     ",[data-theme=\"light\"] .standing-pts{color:var(--green-600) !important}",
     "{color:var(--green-600) !important}",
     "R1 .standing-pts uit de lichte regel (.win-kicker = F2, .trn-champ-kicker = niet waargenomen: blijven)"
    ],
    [
     ",:root:not([data-theme=\"dark\"]) .standing-pts{color:var(--green-600) !important}}",
     "{color:var(--green-600) !important}}",
     "R1 idem, automatisch licht"
    ],
    [
     ",[data-theme=\"light\"] #screen-trn-overview .trn-match.current .trn-match-header{color:var(--green-600) !important}",
     "{color:var(--green-600) !important}",
     "R2 .trn-match-header uit de lichte regel (winnaarsregels: niet waargenomen, blijven)"
    ],
    [
     ",:root:not([data-theme=\"dark\"]) #screen-trn-overview .trn-match.current .trn-match-header{color:var(--green-600) !important}}",
     "{color:var(--green-600) !important}}",
     "R2 idem, automatisch licht"
    ],
    [
     "/* Licht thema: diepte en gloed (v241) */\n[data-theme=\"light\"] .x-card,[data-theme=\"light\"] .g-prow,[data-theme=\"light\"] .g-target,[data-theme=\"light\"] .home-tile,[data-theme=\"light\"] .home-quick-tile,[data-theme=\"light\"] .metric,[data-theme=\"light\"] .win-card,[data-theme=\"light\"] .live-card,[data-theme=\"light\"] .ask-box,[data-theme=\"light\"] .g-big3 button,[data-theme=\"light\"] .bob-keys button{box-shadow:0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)}\n[data-theme=\"light\"] .x-card.on,[data-theme=\"light\"] .g-prow.on{box-shadow:0 0 0 1px var(--accent-ring),0 10px 26px -8px rgba(185,78,42,.45),0 0 32px -6px rgba(185,78,42,.30)}\n@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .x-card,:root:not([data-theme=\"dark\"]) .g-prow,:root:not([data-theme=\"dark\"]) .g-target,:root:not([data-theme=\"dark\"]) .home-tile,:root:not([data-theme=\"dark\"]) .home-quick-tile,:root:not([data-theme=\"dark\"]) .metric,:root:not([data-theme=\"dark\"]) .win-card,:root:not([data-theme=\"dark\"]) .live-card,:root:not([data-theme=\"dark\"]) .ask-box,:root:not([data-theme=\"dark\"]) .g-big3 button,:root:not([data-theme=\"dark\"]) .bob-keys button{box-shadow:0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)}:root:not([data-theme=\"dark\"]) .x-card.on,:root:not([data-theme=\"dark\"]) .g-prow.on{box-shadow:0 0 0 1px var(--accent-ring),0 10px 26px -8px rgba(185,78,42,.45),0 0 32px -6px rgba(185,78,42,.30)}}\n",
     "/* Licht thema: diepte en gloed (v241); sinds 4C-3 via --tile-shadow / --tile-shadow-on (donker: none) */\n.x-card,.g-prow,.g-target,.win-card,.live-card{box-shadow:var(--tile-shadow)}\n.x-card.on,.g-prow.on{box-shadow:var(--tile-shadow-on)}\n/* 4C-3 uitzondering E-tegel: .home-tile/.home-quick-tile/.g-big3 button: wint nooit (OVERSCHREVEN); .bob-keys button: niet omzetbaar zonder specificiteitsverandering (de Mis-knop verloor in donker zijn schaduw). Blijft staan tot 4D */\n[data-theme=\"light\"] .home-tile,[data-theme=\"light\"] .home-quick-tile,[data-theme=\"light\"] .g-big3 button,[data-theme=\"light\"] .bob-keys button{box-shadow:0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)}\n@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .home-tile,:root:not([data-theme=\"dark\"]) .home-quick-tile,:root:not([data-theme=\"dark\"]) .g-big3 button,:root:not([data-theme=\"dark\"]) .bob-keys button{box-shadow:0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)}}\n",
     "R1 tegelschaduw → --tile-shadow(-on) op dezelfde plek; R2 .ask-box (gebruikt al --elev-4); R3/uitzondering .home-tile/.home-quick-tile/.g-big3 button (OVERSCHREVEN)"
    ],
    [
     "border:1.5px dashed rgba(255,122,107,.5);",
     "border:1.5px dashed var(--miss-border);",
     "R1 .g-miss rand"
    ],
    [
     "border:0.5px solid var(--border);box-shadow:var(--elev-1)}\n.metric .val",
     "border:0.5px solid var(--border);box-shadow:var(--metric-shadow)}\n.metric .val",
     "R1 .metric schaduw (niet in de tegelregel: daar won de latere .metric-regel in licht)"
    ],
    [
     "background:var(--hit-soft);color:#CFEAD5;",
     "background:var(--hit-soft);color:var(--chip-text);",
     "R1 .g-chip tekst"
    ],
    [
     "[data-theme=\"light\"] .g-miss{color:var(--red-700);border-color:rgba(179,38,30,.45)}\n[data-theme=\"light\"] .g-plus{color:var(--green-600)}\n[data-theme=\"light\"] .g-chip{color:var(--green-700);background:rgba(62,123,79,.18)}\n",
     "[data-theme=\"light\"] .g-miss{color:var(--red-700)} /* 4C-3 uitzondering F3 */\n",
     "R1 .g-miss rand, R2 .g-plus, .g-chip achtergrond; R1 .g-chip tekst; .g-miss tekst blijft (F3)"
    ],
    [
     "@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .g-miss{color:var(--red-700);border-color:rgba(179,38,30,.45)}:root:not([data-theme=\"dark\"]) .g-plus{color:var(--green-600)}:root:not([data-theme=\"dark\"]) .g-chip{color:var(--green-700);background:rgba(62,123,79,.18)}}",
     "@media (prefers-color-scheme:light){:root:not([data-theme=\"dark\"]) .g-miss{color:var(--red-700)}}",
     "idem, automatisch licht"
    ],
    [
     "  border:0.5px solid var(--border);\n  margin-bottom:var(--sp-6);\n  box-shadow:var(--elev-1);\n}",
     "  border:0.5px solid var(--card-border);\n  margin-bottom:var(--sp-6);\n  box-shadow:var(--card-shadow);\n}",
     "R1 .card rand + schaduw"
    ],
    [
     "/* ─── GLASS CARDS: light mode border shimmer ─── */\n@media (prefers-color-scheme:light){\n  :root:not([data-theme=\"dark\"]) .card{\n    border-color:rgba(255,255,255,0.6);\n  }\n}\n[data-theme=\"light\"] .card{border-color:rgba(255,255,255,0.6)}\n",
     "/* ─── GLASS CARDS: lichte rand rgba(255,255,255,.6) verwijderd in 4C-3 (R3: werd altijd overschreven door de v217-regel, die nu --card-border is) ─── */\n",
     "R3 overschreven .card-randregels weg (2), anders worden ze werkzaam"
    ],
    [
     "  :root:not([data-theme=\"dark\"]) .card{border-color:rgba(60,40,30,.07);box-shadow:0 1px 2px rgba(60,40,30,.05),0 6px 18px -6px rgba(60,40,30,.10)}\n",
     "",
     "R1 lichte .card (automatisch)"
    ],
    [
     ":root[data-theme=\"light\"] .card{border-color:rgba(60,40,30,.07);box-shadow:0 1px 2px rgba(60,40,30,.05),0 6px 18px -6px rgba(60,40,30,.10)}\n",
     "",
     "R1 lichte .card (gekozen)"
    ]
   ]
  },
  'achtergrond': {
   "titel": "achtergrond van de pagina",
   "tokens": [
    [
     "--page-bg",
     "linear-gradient(160deg,#000000 0%,#381000 30%,#0f2e10 100%)",
     "radial-gradient(ellipse 95% 50% at 0% 0%,rgba(185,78,42,.14),rgba(185,78,42,0) 62%),radial-gradient(ellipse 95% 50% at 100% 100%,rgba(62,123,79,.14),rgba(62,123,79,0) 62%),#F4F1ED",
     "achtergrond body: donker verloop (automatisch en gekozen gelijk), licht gloed v217"
    ],
    [
     "--page-glow",
     "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(185,78,42,.07) 0%, transparent 70%),radial-gradient(ellipse 60% 40% at 80% 100%, rgba(157,191,158,.05) 0%, transparent 60%)",
     "none",
     "body::before diepte-gloed; licht geen (v217)"
    ]
   ],
   "edits": [
    [
     "@media (prefers-color-scheme:dark){\n  :root:not([data-theme=\"light\"]) body{background:linear-gradient(160deg,#000000 0%,#381000 30%,#0f2e10 100%)}\n}\n",
     "",
     "R1 donkere body-regel (automatisch) weg; waarde is nu de standaard van --page-bg"
    ],
    [
     "  :root:not([data-theme=\"dark\"]) body{background:linear-gradient(160deg,#e8b89e 0%,#f4ebe4 55%,#ffffff 100%)}\n",
     "",
     "R3 overschreven lichte body-verloop (automatisch) weg; overschrijver (v217) wordt --page-bg"
    ],
    [
     "  background:var(--bg);\n  color:var(--text);\n  display:flex;",
     "  background:var(--page-bg);\n  color:var(--text);\n  display:flex;",
     "R1 body achtergrond (var(--bg) won nooit: in elke themastand overschreven)"
    ],
    [
     "  background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(185,78,42,.07) 0%, transparent 70%),\n             radial-gradient(ellipse 60% 40% at 80% 100%, rgba(157,191,158,.05) 0%, transparent 60%);\n}",
     "  background:var(--page-glow);\n}",
     "R1 body::before gloed"
    ],
    [
     "@media (prefers-color-scheme:light){\n  :root:not([data-theme=\"dark\"]) body::before{\n    background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(185,78,42,.06) 0%, transparent 70%);\n  }\n}\n",
     "",
     "R3 overschreven lichte body::before (automatisch) weg; overschrijver (v217 none) wordt --page-glow"
    ],
    [
     "[data-theme=\"dark\"] body{background:linear-gradient(160deg,#000000 0%,#381000 30%,#0f2e10 100%)}\n",
     "",
     "R1 donkere body-regel (gekozen) weg"
    ],
    [
     "[data-theme=\"light\"]{background:#e8b89e}[data-theme=\"light\"] body{background:linear-gradient(160deg,#e8b89e 0%,#f4ebe4 55%,#ffffff 100%)}",
     "[data-theme=\"light\"]{background:#e8b89e}",
     "R3 overschreven lichte body-verloop (gekozen) weg; html-achtergrond (root) blijft"
    ],
    [
     "  :root:not([data-theme=\"dark\"]) body{background:radial-gradient(ellipse 95% 50% at 0% 0%,rgba(185,78,42,.14),rgba(185,78,42,0) 62%),radial-gradient(ellipse 95% 50% at 100% 100%,rgba(62,123,79,.14),rgba(62,123,79,0) 62%),#F4F1ED}\n",
     "",
     "R1 lichte body (automatisch)"
    ],
    [
     "  :root:not([data-theme=\"dark\"]) body::before{background:none}\n",
     "",
     "R1 lichte body::before (automatisch)"
    ],
    [
     ":root[data-theme=\"light\"] body{background:radial-gradient(ellipse 95% 50% at 0% 0%,rgba(185,78,42,.14),rgba(185,78,42,0) 62%),radial-gradient(ellipse 95% 50% at 100% 100%,rgba(62,123,79,.14),rgba(62,123,79,0) 62%),#F4F1ED}\n",
     "",
     "R1 lichte body (gekozen)"
    ],
    [
     ":root[data-theme=\"light\"] body::before{background:none}\n",
     "",
     "R1 lichte body::before (gekozen)"
    ]
   ]
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
