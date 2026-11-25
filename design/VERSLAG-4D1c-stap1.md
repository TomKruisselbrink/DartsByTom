# 4D-1c stap 1 — X01 op grote liggende schermen

- **Basis:** `feat/fase4d` @ `f1340ee`. Ontwerp: `VOORSTEL-4D-1c.md`, besluiten Tom 25-11 (B1–B6 + voorwaarden 1–6).
- **Deze stap:** alles liggend vanaf 1000 px (tablet liggend 1024×768, 1280×800, kantine 1920×1080, extra breed 2560×1440). **Tablet staand volgt in stap 2** (nog ongewijzigd).
- **Niet gewijzigd:** telefoon (pixel-gelijk), tablet staand, spelregels, scores, checkoutlogica, opslag, Firebase, sync, `main`, `APP_VERSION` (252), nulmeting `faf50f0`, allowlists, ratchets, `tests/visual/expect/4D-1a.json`, `design/scope_4d1a.mjs`.

## 0. Browsercontrole Evolve (voorwaarde 2)

De Chromium-versie van de Evolve-browser kon ik hier **niet vaststellen**: niet op het web te vinden, en ik heb geen toegang tot het apparaat. Daarom eerst een terugvaloptie gebouwd:
- **Detectie:** `CSS.supports('width','1cqh')` (bij het laden). Zonder containermaten krijgt `<html>` de klasse `x01-nocq`.
- **Terugval:** dezelfde opbouw (banen, tegels, matchbalk, route, dock), maar met maten uit `vh`/`vw` in plaats van de kaartmaat. Containermaten werken vanaf Chromium 105 en Safari 16.
- **Getest:** door de klasse in Chromium te forceren, met alle aantallen spelers, alle bijzondere situaties en alle formaten. Geen overlap, niets afgekapt, niet scrollen; de score is minstens 85 % van de containermaatversie.
- **Graag controleren op de Evolve:** in Chrome `chrome://version` (of Instellingen → Apps → Chrome / Android System WebView → versie). Vanaf 105 gebruikt de app de containermaten.
- De app gebruikt `cqh` al sinds v228 in het uitgooivak. Dat werkte op de Evolve zonder melding, maar dat is geen bewijs.

## 1. Wat er veranderd is (`index.html`)

| Onderdeel | Uitvoering |
|---|---|
| Opstelling | Liggend vanaf 1000 px: raster met een matchbalk over de volle breedte, het scorebord links en het invoerdock rechts (`clamp(380px, 32vw, 600px)`, onderaan uitgelijnd). De oude X01-regels uit het v252-kantineblok en het 4D-1a/4D-1b-blok voor ≥ 1600 px zijn opgegaan in één nieuw blok (`/* ═══ 4D-1c: X01 op grote liggende schermen … */`, na het invoerdock). Andere spellen (`.g-wrap`) zijn niet aangeraakt. |
| Matchbalk (B2) | Links LEG 3 (Flow, 5 vh) met de regels (2,1 vh, hoofdletters); rechts BEURT n (Flow) en **Stats/Stop** (48–76 px). De Stats/Stop-knoppen boven het dock zijn liggend weg. Toernooibalk over de volle breedte erboven. |
| Banen/tegels (B1) | 1–3 spelers: banen. Links naam, legs, route en gemiddelde, rechts de score (`min(80cqh, 38cqw, 460px)`). 4–6 spelers: tegels in twee kolommen; boven naam en legs, daaronder de score links groot, onderaan route en gemiddelde. `#sb-players` krijgt `data-n` (aantal spelers). |
| Beurt (B3) | Rand, gloed en GOOIT blijven. Erbij komt een terracotta streep links over de volle kaarthoogte; het stipje vervalt. Niet-actieve score dekking 0,72. |
| Route (B4) | `_x01RouteEl(co)` zet de route in de kaart van de speler die gooit (label UITGOOI + dartbordvakken), opgebouwd met DOM-functies (geen HTML-string). Het losse uitgooivak is liggend verborgen. Op telefoon en tablet staand is `.x-route` verborgen. |
| UITGOOI (B6) | Minimaal 19 px vet (licht: 4,41:1 = grote tekst); geen nieuw token. Pijltjes tussen de vakken in `--text-soft` (met `--text-muted` haalden ze op het lichte beurtvlak maar 3,5:1). |
| Dock (B5) | Terugmelding en invoerregel 58–124 px hoog, cijfers 34–78 px, toetsen 56–**160** px hoog, snelscores 46–84 px. |
| Scoregrootte | `renderGame` zet de telefoongrootte nu als variabele (`--x-sf`) in plaats van inline `font-size`, met precies dezelfde berekende waarde. Daardoor kan de grote opstelling de grootte zetten zonder `!important`. |
| Lange namen | Op grote schermen maximaal twee regels (daarna …). `x-long` (naam > 14 tekens) geeft in tegels een iets kleinere score, zodat naam, GOOIT, score, route en gemiddelde niet overlappen. |
| Smalle baan | Is een baan smaller dan 760 px (tablet liggend), dan is de score iets smaller (33cqw) en valt het label weg, zodat de route naast de score past. |

## 2. Metingen (CSS-px, donker, NL)

| Formaat | Spelers | Score f1340ee → stap 1 | Route (actief) | Naam | Legs | Kaarten % scherm | Toets b×h |
|---|---|---|---|---|---|---|---|
| 1024×768 | 1 / 2 / 3 / 4 / 6 | 110 / 110 / 56 / 56 / 40 → **172 / 172 / 156 / 144 / 96** | 22 / 22 / 22 / 18 / 18 | 26 / 26 / 26 / 19 / 19 | 37 / 37 / 37 / 24 / 24 | 15 → 47–48 | 126×57 → 122×100 |
| 1280×800 | 1 / 2 / 3 / 4 / 6 | 115 / 115 / 64 / 64 / 44 → **237 / 223 / 164 / 151 / 101** | 30 / 30 / 30 / 26 / 21 | 36 / 36 / 31 / 27 / 22 | 50 / 50 / 45 / 34 / 26 | 15 → 51–53 | 158×59 → 132×104 |
| 1920×1080 | 1 / 2 / 3 / 4 / 6 | 162 / 162 / 96 / 96 / 65 → **419 / 306 / 228 / 206 / 138** | 46 / 46 / 46 / 40 / 29 | 55 / 55 / 43 / 42 / 31 | 77 / 77 / 63 / 52 / 36 | 19 → 53–54 | 169×74 → 194×140 |
| 2560×1440 | 1 / 2 / 3 / 4 / 6 | 216 / 216 / 128 / 128 / 86 → **460 / 426 / 312 / 277 / 187** | 66 / 66 / 62 / 56 / 40 | 72 / 72 / 59 / 64 / 42 | 110 / 110 / 86 / 78 / 49 | 21 → 61–62 | 169×74 → 191×160 |

- **Ontwerpdoel 40′ op 6 m (65″, voorwaarde 3):** 1920×1080 met 2/3/4/6 spelers = 92′/69′/62′/42′. Gehaald. Bij 6 spelers is de tegelscore daarvoor van 50 naar 54 % van de tegelhoogte gegaan.
- **Route op tablet ≥ 18 px (voorwaarde 1):** tablet liggend 22 px (1–3 spelers) en 18 px (4–6). Gehaald.
  - Bij 1–2 spelers kost dat **26 px score**: 198 px in het voorstel → 172 px nu, door de smalle-baanregel, want anders overlapte de route de score.
  - Bij 4–6 spelers kost de 18 px niets extra.
- **Afwijking van de mock-ups:**
  - 3 spelers zijn groter dan in het voorstel: 1920 228 i.p.v. 186 px, door een kleinere binnenmarge.
  - 2 spelers op 1920 zijn iets kleiner: 306 i.p.v. 316 px.
  - Rest binnen ±5 %.

## 3. Tests

| Controle | Resultaat |
|---|---|
| Syntaxcheck alle inline scripts | 0 fouten |
| `npm test` | **162/162** in 36 suites (was 155/35; nieuw `x01-groot` 7 gevallen) |
| `tests/core/x01-groot.mjs` (nieuw) | **Opbouw en maten, 1024–2560 × 1/2/3/4/6 spelers:** banen of tegels, kaarten ≥ 45 % van het scherm, minimale scores, route ≥ 18 px, geen los uitgooivak, Stats/Stop rechtsboven in de matchbalk, streep zonder stipje, dekking 0,72, toets ≤ 160 px, dock ≤ 600 px, niets afgekapt, overlappend of buiten de kaart, niet scrollen. **Dit alles ook met de terugval.** **Ontwerpdoel 40′.** **Bijzondere situaties** op 4 formaten (toernooi, sets, teams, lange namen 2/3/4/6, niet uitgooibaar 2/4/6, bot), ook met de terugval. **Engels.** **Telefoon/tablet staand:** geen route in de kaart, uitgooivak zoals voorheen. |
| Bijzondere situaties, volledige matrix (`design/special_4d1c.mjs`, met echte invoer gespeeld) | **352/352 zonder bevindingen**: 11 situaties × 4 formaten × 4 themastanden × NL/EN. Vellen `bijzonder-*.png`. |
| `tests/mutation.mjs` (nieuwe 4D-1c-mutaties) | 9/9 gevangen: route onzichtbaar, route ook op de telefoon, tegels in één kolom, matchbalk niet rechtsboven, dekking 0,8, geen streep, lange naam + GOOIT zonder kleinere score, vaste score, toetsen > 160 px. |
| Telefoon pixel-gelijk (voorwaarde 5) | 50/50 eigen opnames (360, 375, 390, 430, telefoon liggend 844×390 × licht/donker × 1/2/3/4/6 spelers) **pixel-identiek** aan f1340ee. In de visuele test is geen enkele telefoonopname anders. |
| Contrast (`contrast`, `contrast-beurt`) | Groen, ook kantine 1920 in vier themastanden. |

**Aangepaste bestaande tests** (bedoeld door B2 en de dockbreedte uit het voorstel; geen allowlist of ratchet):
- `tests/core/x01-invoer.mjs`: op de kantine staan Stats/Stop nu in de matchbalk (`#x01-head`), niet in `#x01-side`. De maten (K12) blijven getoetst.
- `tests/core/fase3.mjs`: dockbreedte op 1920 ≤ 600 px (was ≤ 520).

## 4. Visuele vergelijking

**T.o.v. f1340ee** (1253 opnames): **1212 gelijk, 41 anders**, uitsluitend in de bedoelde scenario's en viewports (`tests/visual/expect/4D-1c.json`, stap 1):

| Scenario | tablet-liggend | kantine-1280 | kantine-1920 |
|---|---|---|---|
| x01-2sp, x01-4sp | 2 | 4 | 5 (incl. automatisch donker) |
| x01-teams, double-vraag, dubbel-kiezen, stats-blad | 2 elk | — (niet in de matrix) | — |
| bevestig-stop | 2 | 4 | 5 |

- **Telefoon, tablet staand en alle andere scenario's:** 0 verschillen.
- **Scopecontrole** (`STAP=1 node design/scope_4d1c.mjs`): rood op 7 Stop-opnames, met 2–5 px "binnen het venster". Nagekeken:
  - Al die pixels liggen ≤ 0,3 px van de afgeronde rand, dus op de anti-aliasing.
  - `design/verify_4d1b_stop.mjs` t.o.v. f1340ee: venster 64/64 identiek (opbouw en alle stijlen, en pixel-identiek met de achtergrond verborgen).
  - Ik heb de controle niet versoepeld. De rand van 0,3 px is wel de grens van wat ze kan meten.

**T.o.v. de nulmeting faf50f0:** 1086 gelijk, 167 anders, in dezelfde 7 X01-scenario's als na 4D-1b (4D-1a + 4D-1b + 4D-1c). Stop-venster: verschillen ≤ 0,34 px van de rand.

Vellen (in de zip, niet in de repo):
- `vergelijk-kantine-1920/1280/tablet-liggend.png` (f1340ee ↔ stap 1);
- `spelers-<formaat>.png` (1–6 spelers);
- `bijzonder-*.png` (situaties in vier themastanden en NL/EN).

## 5. Openstaand en aandachtspunten

1. **Evolve-browserversie** nog onbekend; de terugval werkt. Graag `chrome://version` op de Evolve.
2. **Toernooi:** de matchbalk zegt links "BEURT HENK" en rechts "BEURT 4" (het woord twee keer). Zo was het al (toernooikop = "Beurt <naam>"), maar groot valt het meer op. Niet aangepast (buiten scope); keuze voor jou.
3. **Lange namen** (24 tekens) staan op twee regels. In tegels krijgt de score dan minder ruimte (bijv. 1024×768 met 6 spelers en een lange naam aan de beurt: kleinere score). Bij 4 spelers op 1024 met de terugval wordt een naam ingekort (…).
4. **Tablet liggend, 1–2 spelers:** de 18-px-voorwaarde voor de route kost 26 px score (zie §2).
5. **Echt apparaat:** alleen Chromium getest. Op de Evolve en iPad (Safari) handmatig: leesbaarheid vanaf 4–6 m, Stop rechtsboven bereikbaar, toetsen van 140–160 px prettig.
6. **Stap 2 (tablet staand)** is nog niet gedaan.
