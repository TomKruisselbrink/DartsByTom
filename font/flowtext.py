#!/usr/bin/env python3
"""Darts by Tom — Flow Text. Bouwt het tekstfont uit skeletlijnen (gefilette polylijnen) die met
shapely een vaste lijndikte krijgen. Zelfde DNA als Flow: hoekige rondingen, rechte afsnijdingen.
Gebruik: python3 flowtext.py [uitmap]  -> FlowText-Regular/Bold .ttf en .woff2"""
import sys, math
from shapely.geometry import LineString, Polygon, box, Point
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
from shapely import affinity
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
C = 700      # hoofdletterhoogte (gelijk aan Flow)
X = 520      # x-hoogte: groot, dat leest goed op 11-13px
A = 750      # stokken b d h k l
D = -200     # staarten g j p q y
OV = 8       # ronde vormen steken iets uit (optische correctie)

def fil(pts, r, closed=False, n=10):
    """Polylijn met afgeronde hoeken (kwadratische Bezier, oogt hoekiger dan een cirkel = Flow)."""
    m = len(pts)
    if m < 3 or not r: return list(pts) + ([pts[0]] if closed else [])
    rs = r if isinstance(r, (list, tuple)) else [r] * m
    out = []
    idx = range(m) if closed else range(1, m - 1)
    if not closed: out.append(pts[0])
    for i in idx:
        P = pts[i]; Aa = pts[i - 1]; B = pts[(i + 1) % m]
        ri = rs[i]
        if not ri: out.append(P); continue
        da = math.dist(P, Aa); db = math.dist(P, B)
        t = min(ri, da / 2, db / 2)
        ua = ((Aa[0] - P[0]) / da, (Aa[1] - P[1]) / da); ub = ((B[0] - P[0]) / db, (B[1] - P[1]) / db)
        T1 = (P[0] + ua[0] * t, P[1] + ua[1] * t); T2 = (P[0] + ub[0] * t, P[1] + ub[1] * t)
        for k in range(n + 1):
            s = k / n
            x = (1 - s) ** 2 * T1[0] + 2 * (1 - s) * s * P[0] + s * s * T2[0]
            y = (1 - s) ** 2 * T1[1] + 2 * (1 - s) * s * P[1] + s * s * T2[1]
            out.append((x, y))
    if closed: out.append(out[0])
    else: out.append(pts[-1])
    return out

class G:
    def __init__(s, w): s.w = w; s.parts = []; s.cuts = []
    def line(s, pts, r=0, join='mitre'):
        s.parts.append(LineString(fil(pts, r)).buffer(s.w / 2, cap_style='flat', join_style=join, mitre_limit=4, quad_segs=6)); return s
    def loop(s, x0, y0, x1, y1, r):
        """Gesloten afgeronde rechthoek; x0..x1 / y0..y1 = BUITENkant."""
        h = s.w / 2; p = [(x0 + h, y0 + h), (x1 - h, y0 + h), (x1 - h, y1 - h), (x0 + h, y1 - h)]
        s.parts.append(LineString(fil(p, r, closed=True)).buffer(h, join_style='round', quad_segs=6)); return s
    def dot(s, cx, cy, d=None):
        d = d or s.w * 1.12; s.parts.append(box(cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2).buffer(-d * .18).buffer(d * .18, quad_segs=4)); return s
    def poly(s, pts): s.parts.append(Polygon(pts)); return s
    def cut(s, pts): s.cuts.append(Polygon(pts)); return s
    def cutbox(s, x0, y0, x1, y1): s.cuts.append(box(x0, y0, x1, y1)); return s
    def shape(s):
        g = unary_union(s.parts)
        for c in s.cuts: g = g.difference(c)
        return g

# ── glyph-definities ─────────────────────────────────────────────────────────────
def glyphs(w):
    h = w / 2
    R = 0.36    # hoekronding als fractie van de kleinste maat
    Gd = {}
    def g(name, fn, sb=55, adv=None):
        Gd[name] = (fn, sb, adv)
    def rr(W, H): return min(W, H) * R

    # lowercase ---------------------------------------------------------------
    Wo = 470
    def o(G_): G_.loop(0, -OV, Wo, X + OV, rr(Wo, X))
    g('o', o, 48)
    def bowl(G_, W=Wo, y0=-OV, y1=X + OV): G_.loop(0, y0, W, y1, rr(W, y1 - y0))
    g('a', lambda G_: (bowl(G_), G_.line([(Wo - h, -0), (Wo - h, X + OV)])), 48)
    g('d', lambda G_: (bowl(G_), G_.line([(Wo - h, 0), (Wo - h, A)])), 48)
    g('b', lambda G_: (bowl(G_), G_.line([(h, 0), (h, A)])), 48)
    g('p', lambda G_: (bowl(G_), G_.line([(h, D), (h, X + OV)])), 48)
    g('q', lambda G_: (bowl(G_), G_.line([(Wo - h, D), (Wo - h, X + OV)])), 48)
    def gg(G_):
        bowl(G_); G_.line([(Wo - h, X + OV), (Wo - h, D + h), (40, D + h)], r=150)
    g('g', gg, 48)
    def c(G_):
        bowl(G_); G_.cut([(Wo * .5, X * .30), (Wo + 50, X * .26), (Wo + 50, X * .74), (Wo * .5, X * .70)])
    g('c', c, 48)
    def e(G_):
        bowl(G_); G_.line([(h, X * .52), (Wo - h, X * .52)])
        G_.cut([(Wo * .45, X * .52 - h - 1), (Wo + 50, X * .52 - h - 1), (Wo + 50, X * .22), (Wo * .45, X * .26)])
    g('e', e, 48)
    Wn = 440
    def arch(G_, x0, x1, top=X, bot=0):
        G_.line([(x0 + h, bot), (x0 + h, top - h), (x1 - h, top - h), (x1 - h, bot)], r=rr(x1 - x0, top) * 1.15)
    g('n', lambda G_: (arch(G_, 0, Wn), G_.line([(h, 0), (h, X)])))
    g('h', lambda G_: (arch(G_, 0, Wn), G_.line([(h, 0), (h, A)])))
    def u(G_):
        G_.line([(h, X), (h, h), (Wn - h, h), (Wn - h, X)], r=rr(Wn, X) * 1.15); G_.line([(Wn - h, 0), (Wn - h, X)])
    g('u', u)
    Wm = 700
    def m(G_):
        G_.line([(h, 0), (h, X)]); arch(G_, 0, Wm / 2 + h); arch(G_, Wm / 2 - h, Wm)
    g('m', m)
    g('i', lambda G_: (G_.line([(h, 0), (h, X)]), G_.dot(h, X + 150)), 62)
    g('j', lambda G_: (G_.line([(170 - h, X), (170 - h, D + h), (-30, D + h)], r=120), G_.dot(170 - h, X + 150)), 40)
    g('l', lambda G_: G_.line([(h, A), (h, h), (150, h)], r=90), 62)
    def f(G_):
        G_.line([(105, 0), (105, A - h), (300, A - h)], r=130); G_.line([(0, X - h), (270, X - h)])
    g('f', f, 35)
    def t(G_):
        G_.line([(105, 660), (105, h), (300, h)], r=130); G_.line([(0, X - h), (280, X - h)])
    g('t', t, 35)
    g('r', lambda G_: G_.line([(h, 0), (h, X - h), (310, X - h)], r=150), 55)
    def k(G_):
        G_.line([(h, 0), (h, A)]); G_.line([(w * .9, X * .38), (400, X)]); G_.line([(165, X * .52), (410, 0)])
        G_.cutbox(-50, X, 600, X + 300).cutbox(-50, -300, 600, 0) if False else None
        G_.cutbox(w, X, 600, X + 200); G_.cutbox(w, -200, 600, 0)
    g('k', k, 55)
    def v(G_, W=440, H=X, d=0):
        G_.line([(0, H + 40), (W / 2, 0), (W, H + 40)]); G_.cutbox(-100, H, W + 100, H + 200); G_.cutbox(-100, -200, W + 100, 0)
    g('v', v, 25)
    def wv(G_):
        W = 680; G_.line([(0, X + 40), (W * .25, 0), (W * .5, X * .82), (W * .75, 0), (W, X + 40)])
        G_.cutbox(-100, X, W + 100, X + 200); G_.cutbox(-100, -200, W + 100, 0)
    g('w', wv, 25)
    def x(G_, W=430, H=X):
        G_.line([(0, -10), (W, H + 10)]); G_.line([(0, H + 10), (W, -10)]); G_.cutbox(-100, H, W + 100, H + 200); G_.cutbox(-100, -200, W + 100, 0)
    g('x', x, 25)
    def y(G_):
        W = 450; G_.line([(0, X + 40), (W * .48, 0)]); G_.line([(W, X + 40), (W * .3, D - 40)])
        G_.cutbox(-100, X, W + 100, X + 200); G_.cutbox(-100, D - 200, W + 100, D)
    g('y', y, 25)
    def z(G_, W=420, H=X):
        G_.line([(15, H - h), (W, H - h), (0, h), (W - 5, h)])
    g('z', z, 40)
    def s(G_, W=420, H=X):
        r = H * .27
        G_.line([(W - 5, H - h), (h, H - h), (h, H * .5), (W - h, H * .5), (W - h, h), (5, h)], r=[0, r, r * 1.05, r * 1.05, r, 0])
    g('s', s, 40)

    # hoofdletters -------------------------------------------------------------
    g('H', lambda G_: (G_.line([(h, 0), (h, C)]), G_.line([(530 - h, 0), (530 - h, C)]), G_.line([(h, C * .5), (530 - h, C * .5)])), 70)
    g('I', lambda G_: (G_.line([(h + 90, 0), (h + 90, C)]), G_.line([(0, C - h), (180 + w, C - h)]), G_.line([(0, h), (180 + w, h)])), 45)
    g('L', lambda G_: G_.line([(h, C), (h, h), (420, h)]), 70)
    g('E', lambda G_: (G_.line([(440, C - h), (h, C - h), (h, h), (450, h)]), G_.line([(h, C * .51), (400, C * .51)])), 70)
    g('F', lambda G_: (G_.line([(440, C - h), (h, C - h), (h, 0)]), G_.line([(h, C * .5), (400, C * .5)])), 70)
    g('T', lambda G_: (G_.line([(0, C - h), (480, C - h)]), G_.line([(240, 0), (240, C)])), 30)
    Wc = 560
    g('O', lambda G_: G_.loop(0, -OV, Wc, C + OV, rr(Wc, C) * 1.05), 50)
    def Cc(G_):
        G_.loop(0, -OV, 520, C + OV, rr(520, C) * 1.05); G_.cut([(300, C * .31), (600, C * .28), (600, C * .72), (300, C * .69)])
    g('C', Cc, 50)
    def Gg(G_):
        G_.loop(0, -OV, 540, C + OV, rr(540, C) * 1.05); G_.cut([(300, C * .52), (600, C * .52), (600, C * .74), (300, C * .70)])
        G_.line([(290, C * .44), (540 - h, C * .44), (540 - h, C * .2)])
    g('G', Gg, 50)
    def Q(G_):
        G_.loop(0, -OV, Wc, C + OV, rr(Wc, C) * 1.05); G_.line([(330, 150), (520, -110)])
    g('Q', Q, 50)
    g('D', lambda G_: G_.line([(h, h), (h, C - h), (540 - h, C - h), (540 - h, h), (h - 1, h)], r=[0, 0, 210, 210, 0], join='mitre'), 70)
    def Bb(G_):
        G_.line([(h, C - h), (420, C - h), (420 + 60, C * .5)], r=[0, 150, 0]) if False else None
        G_.line([(h, h), (h, C - h), (470 - h, C - h), (470 - h, C * .53 + h), (h, C * .53 + h)], r=[0, 0, 120, 120, 0])
        G_.line([(h, C * .53 + h), (520 - h, C * .53 + h), (520 - h, h), (h - 1, h)], r=[0, 140, 140, 0])
    g('B', Bb, 70)
    def P(G_):
        G_.line([(h, 0), (h, C - h), (500 - h, C - h), (500 - h, C * .42 + h), (h, C * .42 + h)], r=[0, 0, 150, 150, 0])
    g('P', P, 70)
    def Rr(G_):
        P(G_); G_.line([(250, C * .42 + h), (510, 0)]); G_.cutbox(300, -200, 700, 0)
    g('R', Rr, 70)
    g('U', lambda G_: G_.line([(h, C), (h, h), (520 - h, h), (520 - h, C)], r=200), 68)
    g('J', lambda G_: G_.line([(400 - h, C), (400 - h, h), (0, h)], r=170), 40)
    g('S', lambda G_: s(G_, 480, C), 45)
    g('Z', lambda G_: z(G_, 480, C), 45)
    g('X', lambda G_: x(G_, 520, C), 30)
    g('V', lambda G_: v(G_, 560, C), 25)
    def W_(G_):
        W = 820; G_.line([(0, C + 40), (W * .24, 0), (W * .5, C * .8), (W * .76, 0), (W, C + 40)])
        G_.cutbox(-100, C, W + 100, C + 200); G_.cutbox(-100, -200, W + 100, 0)
    g('W', W_, 25)
    def Yy(G_):
        W = 540; G_.line([(0, C + 40), (W / 2, C * .44), (W, C + 40)]); G_.line([(W / 2, 0), (W / 2, C * .46)])
        G_.cutbox(-100, C, W + 100, C + 200)
    g('Y', Yy, 25)
    def Aa(G_):
        W = 580; G_.line([(0, -40), (W / 2, C + 60), (W, -40)]); G_.line([(120, C * .3), (W - 120, C * .3)])
        G_.cutbox(-100, -200, W + 100, 0); G_.cutbox(-100, C, W + 100, C + 300)
    g('A', Aa, 25)
    def M(G_):
        W = 660; G_.line([(h, 0), (h, C - h), (W / 2, C * .36), (W - h, C - h), (W - h, 0)])
        G_.cutbox(-100, C, W + 100, C + 300)
    g('M', M, 70)
    def N(G_):
        W = 540; G_.line([(h, 0), (h, C - h), (W - h, h), (W - h, C)]); G_.cutbox(-100, C, W + 100, C + 300); G_.cutbox(-100, -200, W + 100, 0)
    g('N', N, 70)
    def K(G_):
        G_.line([(h, 0), (h, C)]); G_.line([(w * .9, C * .36), (500, C)]); G_.line([(190, C * .52), (520, 0)])
        G_.cutbox(w, C, 700, C + 200); G_.cutbox(w, -200, 700, 0)
    g('K', K, 70)

    # cijfers (tabulair: allemaal even breed) -----------------------------------
    TW = 560; dw = 440
    def num(fn): return lambda G_: fn(G_)
    def n0(G_):
        G_.loop(0, -OV, dw, C + OV, rr(dw, C) * .95); G_.line([(dw * .3, C * .3), (dw * .7, C * .7)])   # streep: 0 ≠ O
    g('zero', n0, 0, TW)
    g('one', lambda G_: (G_.line([(90, C - 140), (260, C - h), (260, 0)], r=[0, 30, 0]) if False else (G_.line([(260, 0), (260, C)]), G_.line([(80, C - 120), (260 - h + 10, C - 10)])), G_.line([(110, h), (410, h)])), 0, TW)
    def n2(G_):
        G_.line([(10, C - h), (dw - h, C - h), (dw - h, C * .5), (h, C * .5 - 60), (h, h), (dw, h)], r=[0, 150, 160, 120, 0, 0])
    g('two', n2, 0, TW)
    def n3(G_):
        G_.line([(10, C - h), (dw - h - 20, C - h), (dw - h - 20, C * .52), (130, C * .52)], r=[0, 140, 140, 0])
        G_.line([(130, C * .52), (dw - h, C * .52), (dw - h, h), (5, h)], r=[0, 150, 150, 0])
    g('three', n3, 0, TW)
    def n4(G_):
        G_.line([(300, C), (h, C * .34), (dw + 20, C * .34)]); G_.line([(dw - 110, C * .62), (dw - 110, 0)])
        G_.cutbox(-100, C, 700, C + 300)
    g('four', n4, 0, TW)
    def n5(G_):
        G_.line([(dw - 10, C - h), (h, C - h), (h, C * .56), (dw - h, C * .56), (dw - h, h), (5, h)], r=[0, 0, 0, 150, 150, 0])
    g('five', n5, 0, TW)
    def n6(G_):
        G_.loop(0, -OV, dw, C * .6, rr(dw, C * .6)); G_.line([(dw - 20, C - h), (h, C - h), (h, C * .3)], r=[0, 160, 0])
    g('six', n6, 0, TW)
    g('seven', lambda G_: (G_.line([(0, C - h), (dw - h, C - h), (150, 0)]), G_.cutbox(-100, -200, 700, 0)), 0, TW)
    def n8(G_):
        G_.loop(25, C * .5 - h, dw - 25, C + OV, rr(dw - 50, C * .5) * 1.05); G_.loop(0, -OV, dw, C * .5 + h, rr(dw, C * .5) * 1.05)
    g('eight', n8, 0, TW)
    def n9(G_):
        G_.loop(0, C * .4, dw, C + OV, rr(dw, C * .6)); G_.line([(dw - h, C * .7), (dw - h, h), (20, h)], r=[0, 160, 0])
    g('nine', n9, 0, TW)

    # leestekens -----------------------------------------------------------------
    g('space', lambda G_: None, 0, 240)
    g('period', lambda G_: G_.dot(w * .6, w * .56), 60)
    g('comma', lambda G_: G_.poly([(0, w * 1.1), (w * 1.1, w * 1.1), (w * .7, -130), (-10, -130)]) if False else G_.poly([(w * .1, w * 1.1), (w * 1.2, w * 1.1), (w * .8, -150), (w * .05, -150)]), 55)
    g('colon', lambda G_: (G_.dot(w * .6, w * .56), G_.dot(w * .6, X - w * .56)), 60)
    g('semicolon', lambda G_: (G_.poly([(w * .1, w * 1.1), (w * 1.2, w * 1.1), (w * .8, -150), (w * .05, -150)]), G_.dot(w * .6, X - w * .56)), 55)
    g('exclam', lambda G_: (G_.line([(w * .6, C), (w * .6, 210)]), G_.dot(w * .6, w * .56)), 65)
    g('question', lambda G_: (G_.line([(10, C - h), (360 - h, C - h), (360 - h, C * .55), (175, C * .55), (175, 210)], r=[0, 120, 120, 0, 0]), G_.dot(175, w * .56)), 40)
    g('hyphen', lambda G_: G_.line([(0, 290), (260, 290)]), 45)
    g('endash', lambda G_: G_.line([(0, 290), (500, 290)]), 40)
    g('emdash', lambda G_: G_.line([(0, 290), (900, 290)]), 40)
    g('minus', lambda G_: G_.line([(0, 330), (440, 330)]), 60, TW)
    g('plus', lambda G_: (G_.line([(0, 330), (440, 330)]), G_.line([(220, 110), (220, 550)])), 60, TW)
    g('equal', lambda G_: (G_.line([(0, 420), (440, 420)]), G_.line([(0, 240), (440, 240)])), 60, TW)
    g('multiply', lambda G_: (G_.line([(30, 160), (410, 500)]), G_.line([(30, 500), (410, 160)])), 60, TW)
    g('periodcentered', lambda G_: G_.dot(w * .6, 330), 60)
    g('slash', lambda G_: (G_.line([(0, -60), (360, C + 60)]), G_.cutbox(-100, -300, 500, -60), G_.cutbox(-100, C + 60, 500, C + 300)), 20)
    g('quotesingle', lambda G_: G_.line([(h, C), (h, C - 230)]), 60)
    g('quotedbl', lambda G_: (G_.line([(h, C), (h, C - 230)]), G_.line([(h + 160, C), (h + 160, C - 230)])), 60)
    g('quoteright', lambda G_: G_.poly([(10, C), (w * 1.12, C), (w * .75, C - 260), (w * .05, C - 260)]), 55)
    g('parenleft', lambda G_: G_.line([(230, C + 60), (h, C + 20), (h, -70), (230, -110)], r=260), 55)
    g('parenright', lambda G_: G_.line([(0, C + 60), (230 - h, C + 20), (230 - h, -70), (0, -110)], r=260), 55)
    def pct(G_):
        G_.loop(0, 370, 270, C + OV, 95); G_.loop(370, -OV, 640, 330 + OV, 95)
        G_.line([(90, -10), (550, C + 10)]); G_.cutbox(-100, -200, 800, -10); G_.cutbox(-100, C + 10, 800, C + 200)
    g('percent', pct, 35)
    def amp(G_):
        G_.loop(70, C * .52, 370, C + OV, 110)
        G_.line([(160, C * .52 + h), (h, C * .30), (h, h), (360, h), (560, C * .40)], r=[0, 70, 150, 160, 0])
        G_.line([(180, C * .58), (590, -40)]); G_.cutbox(-100, -200, 800, 0)
        G_.cut([(185, C * .52 + h - 2), (360, C * .52 + h - 2), (360, C * .52 - h), (185, C * .52 - h)]) if False else None
    g('ampersand', amp, 35)
    g('numbersign', lambda G_: (G_.line([(170, 0), (210, C)]), G_.line([(370, 0), (410, C)]), G_.line([(30, C * .66), (560, C * .66)]), G_.line([(10, C * .34), (540, C * .34)])), 30)
    def at(G_):
        G_.loop(220, 120, 560, 500, 120); G_.line([(560 - h, 500), (560 - h, 120 + h), (720 - h, 120 + h), (720 - h, 560), (h, 560), (h, -60), (640, -60)], r=[0, 90, 90, 220, 220, 220, 0])
    g('at', at, 40)

    # accenten (op dezelfde vorm als de basisletter) --------------------------------
    def acc(base, kind, top):
        fn, sb, adv = Gd[base]
        def f2(G_):
            fn(G_); bx = unary_union(G_.parts).bounds; cx = (bx[0] + bx[2]) / 2
            y = top + 70
            if kind == 'acute': G_.line([(cx - 60, y), (cx + 70, y + 130)])
            elif kind == 'grave': G_.line([(cx + 60, y), (cx - 70, y + 130)])
            elif kind == 'circ': G_.line([(cx - 120, y), (cx, y + 120), (cx + 120, y)])
            elif kind == 'diaer': G_.dot(cx - 110, y + 55); G_.dot(cx + 110, y + 55)
            elif kind == 'tilde': G_.line([(cx - 130, y + 20), (cx - 50, y + 100), (cx + 50, y + 30), (cx + 130, y + 110)])
            elif kind == 'cedilla': G_.line([(cx, 0), (cx, -90), (cx - 90, -170)])
        return f2, sb, adv
    g('dotlessi', lambda G_: G_.line([(h, 0), (h, X)]), 62)
    out = dict(Gd)
    marks = {'acute': 'acute', 'grave': 'grave', 'circumflex': 'circ', 'dieresis': 'diaer'}
    for b in 'aeiouAEIOU':
        for suf, k in marks.items():
            top = (C if b.isupper() else X)
            if b == 'i':   # i zonder punt + accent
                out[b + suf] = acc('dotlessi', k, X)
            else:
                out[b + suf] = acc(b, k, top)
    for b in 'nN': out[b + 'tilde'] = acc(b, 'tilde', C if b == 'N' else X)
    for b in 'cC': out[b + 'cedilla'] = acc(b, 'cedilla', 0)
    return out

NAMES = {}
for ch in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ': NAMES[ch] = ch
for i, n in enumerate(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']): NAMES[str(i)] = n
NAMES.update({' ': 'space', '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', '!': 'exclam', '?': 'question', '-': 'hyphen',
              '–': 'endash', '—': 'emdash', '−': 'minus', '+': 'plus', '=': 'equal', '×': 'multiply', '·': 'periodcentered', '/': 'slash',
              "'": 'quotesingle', '"': 'quotedbl', '’': 'quoteright', '(': 'parenleft', ')': 'parenright', '%': 'percent', '&': 'ampersand',
              '#': 'numbersign', '@': 'at', 'ı': 'dotlessi'})
import unicodedata
for b in 'aeiouAEIOU':
    for suf, comb in (('acute', '́'), ('grave', '̀'), ('circumflex', '̂'), ('dieresis', '̈')):
        NAMES[unicodedata.normalize('NFC', b + comb)] = b + suf
NAMES['ñ'] = 'ntilde'; NAMES['Ñ'] = 'Ntilde'; NAMES['ç'] = 'ccedilla'; NAMES['Ç'] = 'Ccedilla'

def to_glyph(geom, dx):
    pen = TTGlyphPen(None)
    polys = [] if geom is None or geom.is_empty else (list(geom.geoms) if hasattr(geom, 'geoms') else [geom])
    for p in polys:
        if p.geom_type != 'Polygon' or p.area < 20: continue
        p = orient(p.simplify(0.8), sign=-1.0)   # buitenkant met de klok mee (TrueType)
        for ring in [p.exterior] + list(p.interiors):
            pts = [(round(x + dx), round(y)) for x, y in ring.coords[:-1]]
            ded = [pts[0]] + [q for i, q in enumerate(pts[1:]) if q != pts[i]]
            if len(ded) < 3: continue
            pen.moveTo(ded[0])
            for q in ded[1:]: pen.lineTo(q)
            pen.closePath()
    return pen.glyph()

def build(weight, w, out):
    defs = glyphs(w)
    order = ['.notdef'] + sorted(set(NAMES.values()) | {'dotlessi'})
    gl, mt = {}, {}
    nd = TTGlyphPen(None); nd.moveTo((50, 0)); nd.lineTo((50, C)); nd.lineTo((450, C)); nd.lineTo((450, 0)); nd.closePath()
    gl['.notdef'] = nd.glyph(); mt['.notdef'] = (500, 50)
    for name in order[1:]:
        fn, sb, adv = defs[name]
        G_ = G(w); fn(G_)
        geom = G_.shape() if G_.parts else None
        if geom is None or geom.is_empty:
            gl[name] = TTGlyphPen(None).glyph(); mt[name] = (adv or 240, 0); continue
        x0, y0, x1, y1 = geom.bounds
        if adv:   # tabulair: centreren
            dx = (adv - (x1 - x0)) / 2 - x0; a = adv
        else:
            dx = sb - x0; a = round(x1 - x0 + 2 * sb)
        gl[name] = to_glyph(geom, dx); mt[name] = (a, round(x0 + dx))
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(ch): n for ch, n in NAMES.items()})
    fb.setupGlyf(gl); fb.setupHorizontalMetrics(mt)
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    fam = 'Darts by Tom Flow Text'
    fb.setupNameTable({'familyName': fam, 'styleName': weight, 'uniqueFontIdentifier': fam + ' ' + weight, 'fullName': fam + ' ' + weight,
                       'psName': 'DartsByTomFlowText-' + weight, 'version': 'Version 0.2'})
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, sTypoLineGap=0, usWinAscent=850, usWinDescent=250, sxHeight=X, sCapHeight=C,
                usWeightClass=700 if weight == 'Bold' else 400, fsSelection=0x20 if weight == 'Bold' else 0x40)
    fb.setupPost(); fb.setupDummyDSIG() if hasattr(fb, 'setupDummyDSIG') else None
    p = f'{out}/DartsByTom-FlowText-{weight}.ttf'; fb.save(p)
    from fontTools.ttLib import TTFont
    f = TTFont(p); f.flavor = 'woff2'; f.save(p.replace('.ttf', '.woff2'))
    print(weight, len(order), 'glyphs ->', p)

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    build('Regular', 84, out)
    build('Bold', 118, out)
