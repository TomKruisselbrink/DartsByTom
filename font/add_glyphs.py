"""Voegt accenten en leestekens toe aan DartsByTom-Flow (v1.1).

Bron: font/DartsByTom-Flow-v1.ttf (het origineel uit de lettertype-chat).
Uitvoer: font/DartsByTom-Flow.ttf + .woff2

Stijl volgt Flow: schuine stand 0.177 (x += 0.177*y), streepdikte ~116,
'stippen' zijn schuine vierkantjes zoals de punt.
Gebruik: python3 font/add_glyphs.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib.tables._g_l_y_f import GlyphComponent, Glyph

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "DartsByTom-Flow-v1.ttf")
OUT = os.path.join(HERE, "DartsByTom-Flow")
SL = 0.177          # schuine stand
ST = 116            # streepdikte (zoals I)
Y0, Y1 = 772, 880   # accentzone boven de kapitalen (700), 72 eenheden lucht


def sk(pts):
    """Schuin zetten: x += SL*y."""
    return [(round(x + SL * y), round(y)) for x, y in pts]


def draw(polys, adv=0):
    pen = TTGlyphPen(None)
    for poly in polys:
        pen.moveTo(poly[0])
        for p in poly[1:]:
            pen.lineTo(p)
        pen.closePath()
    return pen.glyph()


def dot(cx, y0=Y0, w=100, h=100):
    # ongeschuinde coördinaten rond cx, daarna schuin (tegen de klok in getekend zoals het origineel)
    return sk([(cx + w / 2 - SL * y0, y0), (cx - w / 2 - SL * y0, y0),
               (cx - w / 2 - SL * y0, y0 + h), (cx + w / 2 - SL * y0, y0 + h)])


def bar(x0, y0, x1, y1, t):
    """Schuine streep van (x0,y0) naar (x1,y1) met dikte t (horizontaal gemeten), al in eindcoördinaten."""
    return [(x1 + t / 2, y1), (x0 + t / 2, y0), (x0 - t / 2, y0), (x1 - t / 2, y1)]


font = TTFont(SRC)
glyf, hmtx, cmap_t = font["glyf"], font["hmtx"], font["cmap"]
order = font.getGlyphOrder()
gs = font.getGlyphSet()
best = font.getBestCmap()


def add(name, glyph, adv, lsb=None):
    if name not in order:
        order.append(name)
    glyf[name] = glyph
    glyph.recalcBounds(glyf)
    hmtx[name] = (adv, getattr(glyph, "xMin", 0) if lsb is None else lsb)


# ── Accenten (gecentreerd op x=0 op halve kaphoogte; component schuift ze naar de letter) ──
mid = 350
c = -SL * mid  # zodat het accent op hoogte y uitkomt bij centrum + SL*(y-mid)
add("dieresis.cap", draw([dot(c - 80, w=104, h=104), dot(c + 80, w=104, h=104)]), 0, 0)
add("dieresis.narrow", draw([dot(c - 62, w=92, h=104), dot(c + 62, w=92, h=104)]), 0, 0)  # voor de smalle I
ax = c + SL * Y0          # centrum van het accent onderaan de accentzone
up = SL * (Y1 - Y0)       # natuurlijke schuinte over de hoogte van het accent
add("acute.cap", draw([bar(ax - 38, Y0, ax + 52 + up, Y1, 80)]), 0, 0)
add("grave.cap", draw([bar(ax + 38, Y0, ax - 52 + up, Y1, 80)]), 0, 0)
add("circumflex.cap", draw([
    bar(ax - 92, Y0, ax + up, Y1, 104),
    bar(ax + 92, Y0, ax + up, Y1, 104)]), 0, 0)


def centre(base):
    bp = BoundsPen(gs); gs[base].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    return (x0 + x1) / 2


def composite(name, base, accent):
    g = Glyph(); g.numberOfContours = -1; g.components = []
    for gn, dx in ((base, 0), (accent, round(centre(base)))):
        comp = GlyphComponent(); comp.glyphName = gn; comp.x = dx; comp.y = 0; comp.flags = 0x4 if gn == base else 0
        g.components.append(comp)
    add(name, g, hmtx[base][0], hmtx[base][1])


ACC = {"dieresis": "̈", "acute": "́", "grave": "̀", "circumflex": "̂"}
LETTERS = {
    "E": ["dieresis", "acute", "grave", "circumflex"],
    "I": ["dieresis", "acute", "grave", "circumflex"],
    "O": ["dieresis", "acute", "grave", "circumflex"],
    "U": ["dieresis", "acute", "grave", "circumflex"],
    "A": ["dieresis", "acute", "grave", "circumflex"],
}
import unicodedata
new_map = {}
for L, accs in LETTERS.items():
    for a in accs:
        name = L + a
        composite(name, L, ("dieresis.narrow" if (L == "I" and a == "dieresis") else a + ".cap"))
        for ch in (L, L.lower()):
            u = unicodedata.normalize("NFC", ch + ACC[a])
            new_map[ord(u)] = name

# ── Leestekens ──
# komma: de punt met een staartje naar linksonder
add("comma", draw([sk([(116, 110), (0, 110), (0, 0), (-46, -120), (36, -120), (116, 0)])]), 228)
new_map[ord(",")] = "comma"
add("quotesingle", draw([sk([(118, 700), (2, 700), (2, 500), (118, 500)])]), 228)
new_map[ord("'")] = "quotesingle"; new_map[0x2019] = "quotesingle"; new_map[0x2018] = "quotesingle"
add("quotedbl", draw([sk([(118, 700), (2, 700), (2, 500), (118, 500)]),
                     sk([(276, 700), (160, 700), (160, 500), (276, 500)])]), 386)
new_map[ord('"')] = "quotedbl"; new_map[0x201C] = "quotedbl"; new_map[0x201D] = "quotedbl"
add("endash", draw([[(353, 300), (13, 300), (31, 400), (371, 400)]]), 384)
new_map[0x2013] = "endash"
add("emdash", draw([[(513, 300), (13, 300), (31, 400), (531, 400)]]), 544)
new_map[0x2014] = "emdash"
add("minus", draw([[(353, 300), (13, 300), (31, 400), (371, 400)]]), 384)
new_map[0x2212] = "minus"

import math
def arc(cx, cy, r, a0, a1, n=8):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
# vraagteken: haak met afgeronde buitenhoek, steel en punt (streep 110 breed)
q_body = [(0, 700)] + arc(220, 610, 90, 90, 0) + [(310, 360), (200, 360), (200, 190), (90, 190), (90, 460), (200, 460), (200, 590), (0, 590)]
q_dot = [(90, 110), (200, 110), (200, 0), (90, 0)]
add("question", draw([sk(q_body), sk(q_dot)]), 400)
new_map[ord("?")] = "question"

font.setGlyphOrder(order)
for t in cmap_t.tables:
    if t.isUnicode():
        t.cmap.update(new_map)
font["maxp"].recalc(font)
font["name"].setName("1.1", 5, 3, 1, 0x409)
font.save(OUT + ".ttf")
font.flavor = "woff2"
font.save(OUT + ".woff2")
print("glyphs", len(order), "nieuw in cmap", len(new_map))
