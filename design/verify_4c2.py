#!/usr/bin/env python3
"""Fase 4C-2: structurele controle. Vergelijkt de CSS van index.html met die van een referentie (standaard faf50f0 +
het tokenblok van 4C-1, d.w.z. git-commit 40042ac). Eisen:
- buiten <style> is alles byte-gelijk (HTML en JavaScript onveranderd);
- zelfde regels, selectors en eigenschappen in dezelfde volgorde;
- elke gewijzigde waarde wordt, na het terugzetten van de tokens naar hun waarde, gelijk aan de oude waarde.
  Thema-tokens (verschillend per thema) worden vergeleken met hun donkere waarde, alleen in basisregels; dat er een
  lichte override met de lichte waarde naast staat, controleert migrate_4c2.py.
Gebruik: python3 design/verify_4c2.py [referentie-commit]
"""
import re, subprocess, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref_commit = sys.argv[1] if len(sys.argv) > 1 else '40042ac'
old = subprocess.check_output(['git', '-C', ROOT, 'show', f'{ref_commit}:index.html']).decode('utf-8')
new = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
STY = r'(<style[^>]*>)(.*?)(</style>)'
def outside(s): return re.sub(STY, r'\1\3', s, flags=re.S)
assert outside(old) == outside(new), 'buiten <style> is iets veranderd'
# tokenwaarden uit het tokenblok (donker/standaard)
blk = new[new.index('/* ═══ Ontwerpsysteem-tokens'):new.index('/* ─── DESIGN TOKENS ─── */')]
root = re.search(r':root\{([\s\S]*?)\n\}', blk).group(1)
TOK = {m.group(1): m.group(2).strip() for m in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+);', re.sub(r'/\*[\s\S]*?\*/', '', root))}
EXIST = {'--accent': '#B94E2A', '--danger': '#FF3B30', '--accent2': '#9DBF9E', '--muted': None, '--shadow': None, '--shadow-lg': None}
def resolve(v, depth=0):
    def r(m):
        n = m.group(1)
        if n in ('--text-muted', '--elev-1', '--elev-3'):  # alias: terug naar de oorspronkelijke variabele
            return {'--text-muted': 'var(--muted)', '--elev-1': 'var(--shadow)', '--elev-3': 'var(--shadow-lg)'}[n]
        if n in TOK: return resolve(TOK[n], depth + 1)
        if EXIST.get(n): return EXIST[n]
        return m.group(0)
    return re.sub(r'var\((--[\w-]+)\)', r, v) if depth < 6 else v
def norm(v):
    v = re.sub(r'\s+', '', v).lower().replace('0.', '.')
    return re.sub(r'#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])', r'#\1\1\2\2\3\3', v)
def rules(s):
    out = []
    for m in re.finditer(STY, s, re.S):
        css = m.group(2)
        for r in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            out.append((r.group(1), [d for d in re.split(r';', r.group(2))]))
    return out
ro, rn = rules(old), rules(new)
assert len(ro) == len(rn), f'aantal regels verschilt: {len(ro)} vs {len(rn)}'
changed = 0; bad = []
for (so, do), (sn, dn) in zip(ro, rn):
    if so != sn: bad.append(('selector', so[-60:], sn[-60:])); continue
    if len(do) != len(dn): bad.append(('declaraties', so[-60:])); continue
    for a, b in zip(do, dn):
        if a == b: continue
        changed += 1
        if ':' not in a or ':' not in b: bad.append(('vorm', a, b)); continue
        pa, va = a.split(':', 1); pb, vb = b.split(':', 1)
        if pa != pb: bad.append(('eigenschap', pa, pb)); continue
        if norm(resolve(vb)) != norm(va): bad.append(('waarde', so.strip()[-50:], pa.strip(), va.strip(), vb.strip(), resolve(vb)))
print(f'regels: {len(rn)}, gewijzigde declaraties: {changed}, fouten: {len(bad)}')
for x in bad[:20]: print('  ', x)
sys.exit(1 if bad else 0)
