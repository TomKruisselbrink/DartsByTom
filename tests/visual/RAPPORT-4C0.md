# Fase 4C-0: rapport (alleen tests, geen wijziging aan de app)

Stand: branch `feat/fase4c`, op basis van `feat/fase4b-voorstel`. Referentie: commit **`faf50f0`** (v252).
`main` = `4785a1f` (ongewijzigd). `index.html`, `sw.js` en `manifest.json` zijn byte-gelijk aan `faf50f0`. `APP_VERSION` = 252.
Skills: Product-Grade App Builder v2 is in deze sessie **niet** als skill geïnstalleerd; het gedeelde SKILL.md-bestand is als leidraad gebruikt. v1 (geïnstalleerd) is gebruikt voor de controle.

## 1. Wat er gebouwd is

| Onderdeel | Bestand(en) | Faalt bij |
|---|---|---|
| Visuele matrix uitgebreid | `tests/visual/shoot.mjs`, `scenarios.mjs` | elk pixelverschil t.o.v. `faf50f0` (`compare.mjs`) |
| 9 nieuwe toestanden | `scenarios.mjs` (46 → 55 scenario's) | idem |
| Dekkingstest | `tests/core/coverage.mjs` | scherm, instellingenpagina, overlay of onderblad zonder scenario en zonder reden; scenario mist een dimensie; de 46 originele scenario's veranderen |
| Landingscontrole | `tests/core/tap-390.mjs` + `EXPECT` | een scenario landt op een ander scherm, andere pagina of zonder/met andere overlay |
| Contrasttest | `tests/core/contrast.mjs`, `contrast.pairs.json`, `contrast.allow.json` | elke onvoldoende combinatie die geen bekende uitzondering is |
| Tikvlaktests | `tests/core/tap-lib.mjs`, `tap-320/360/375/390.mjs`, `tap.known.json` | elke nieuwe overlap, bedekking, knop onder balk/nav, te klein element of te grote tikzone |
| Kleurenteller | `tests/core/tokens-ratchet.mjs`, `tokens-ratchet.json` | meer hardgecodeerde kleuren dan bij `faf50f0` (CSS 370, HTML/JS 132) |
| Contraststeekproef (alleen melden) | `shoot.mjs` CHECKS | faalt niet: benadering, voor kandidaten |
| Mutaties | `tests/mutation.mjs` (+9 en `--visual`) | een bewuste fout wordt níet gevangen |

`npm test`: **97/97** in 26 suites, ±7 min (was 75/75, ±3 min). `tests/mutation.mjs --visual`: **16/16 gevangen**.

## 2. Is de oorspronkelijke referentie intact?

| Controle | Uitkomst |
|---|---|
| `faf50f0` | onveranderd (commits zijn onveranderlijk; niets geforceerd, niets herschreven) |
| `main` op GitHub | `4785a1f`, onveranderd |
| App-bestanden in de werkboom | `git diff faf50f0 -- index.html sw.js manifest.json` = leeg |
| De 46 scenario's van de baseline | ongewijzigd, zelfde volgorde (bewaakt door `coverage.mjs`) |
| De 672 opnames van de baseline | zelfde bestandsnamen in de nieuwe matrix (gecontroleerd: 672/672) |
| Opgeslagen 4A-opnames (`out/baseline-v252/`) | sha256 over alle bestanden vóór en na 4C-0 gelijk: `187e12cd…6706` |
| Aanvullende opnames | apart opgeslagen in `out/baseline-v252-aanvulling/` (581 PNG + manifest, gerenderd van `faf50f0`) |
| **Volledige vergelijking** `faf50f0` ↔ werkboom | **1253/1253 opnames pixel-gelijk** (drempel 0, 37 min) |

## 3. Dekking

55 scenario's, 1253 opnames (672 origineel + 581 aanvullend).

| Dimensie | Resoluties | Taal | Thema | Scenario's |
|---|---|---|---|---|
| Telefoon | 375×667, 390×844, 430×932 | NL, EN | licht, donker | alle |
| Liggend (kantine) | 1280×800, 1920×1080 | NL, EN | licht, donker | 17 met `land:true` |
| Tablet | 768×1024, 1024×768 | NL | licht, donker | alle |
| Smal | 360×640 | NL | licht, donker | alle |
| Automatisch thema | 390×844 (+ 1920×1080 donker) | NL | systeem donker, systeem licht | alle (+ 17) |
| Tikvlakken (geen opnames) | 320, 360, 375, 390 | NL | donker | alle |
| Contrast (geen opnames) | | | donker, licht, auto-donker, auto-licht | parenlijst |

**Toestanden:** alle 21 schermen; alle 6 instellingenpagina's; overlays: bevestigvenster (Stop, Potje afronden), "Was het op een double?", welke dubbel, X01-statistiekenblad, toernooi "wie begint", update-melding, iPhone-uitleg; onderbladen: Jullie nummers, Potje hervatten?, Uitgegooid?, Rondes, Eindstand corrigeren, Rondes corrigeren.

**Bewust niet gedekt (met reden in `scenarios.mjs`):** groepscode-venster (groups dicht, fase 6), laadscherm Firebase (kortstondig), Android-installatiebanner (alleen na Chrome-event), en 17 onderbladen die dezelfde opmaak hebben als gedekte bladen (tekst plus knoppen of een keuzelijst). Meldingen (toasts) worden niet vastgelegd: ze verdwijnen vanzelf. Hun kleuren zitten wel in de contrasttest.

## 4. Contrastmatrix (gemeten in de app, laagste waarde over het verloop)

`*` = onder de eis; Cn = bekende uitzondering (faalt niet, wordt apart gemeld).

| Paar | donker | licht | auto-donker | auto-licht | eis |
|---|---|---|---|---|---|
| tekst/bg | 14,80 | 13,20 | 14,80 | 13,20 | 4,5 |
| tekst/kaart | 13,94 | 15,36 | 14,25 | 15,36 | 4,5 |
| tekst/vlak | 17,01 | 17,44 | 16,50 | 17,44 | 4,5 |
| muted/bg | 5,16 | *4,25 C2 | 5,16 | *4,25 C2 | 4,5 |
| muted/kaart | 4,86 | 4,94 | 4,97 | 4,94 | 4,5 |
| muted/vlak | 5,94 | 5,61 | 5,76 | 5,61 | 4,5 |
| soft/kaart | 7,72 | 7,85 | 7,89 | 7,85 | 4,5 |
| soft/vlak | 9,42 | 8,92 | 9,14 | 8,92 | 4,5 |
| accent-tekst/bg | 4,99 | *4,45 C3 | 4,99 | *4,45 C3 | 4,5 |
| accent-tekst/kaart | 4,70 | 5,18 | 4,81 | 5,18 | 4,5 |
| accent-tekst/vlak | 5,74 | 5,88 | 5,57 | 5,88 | 4,5 |
| hit-tekst/bg | 7,89 | 4,71 | 7,89 | 4,71 | 4,5 |
| hit-tekst/kaart | 7,43 | 5,48 | 7,59 | 5,48 | 4,5 |
| hit-tekst/vlak | 9,07 | 6,22 | 8,79 | 6,22 | 4,5 |
| mis-tekst/kaart | 6,08 | 5,62 | 6,22 | 5,62 | 4,5 |
| mis-tekst/vlak | 7,43 | 6,39 | 7,20 | 6,39 | 4,5 |
| doelgetal/doelvlak (groot) | *2,78 C1 | 4,32 | *2,84 C1 | 4,32 | 3 |
| accent-als-tekst/kaart | *2,78 C11 | *4,32 C11 | *2,84 C11 | *4,32 C11 | 4,5 |
| stop/spelbalk | 4,58 | *3,37 C10 | 4,58 | *3,37 C10 | 4,5 |
| wit/accent | 5,02 | 5,02 | 5,02 | 5,02 | 4,5 |
| wit/raak | 5,06 | 5,06 | 5,06 | 5,06 | 4,5 |
| wit/danger | *3,55 C5 | *3,55 C5 | *3,55 C5 | *3,55 C5 | 4,5 |
| wit/bord-rood | 5,50 | 5,50 | 5,50 | 5,50 | 4,5 |
| wit/bord-groen | *3,30 C6 | *3,30 C6 | *3,30 C6 | *3,30 C6 | 4,5 |
| wit/single-rood / -groen | 10,31 / 7,56 | idem | idem | idem | 4,5 |
| wit/team `#B94E2A` `#3E7B4F` `#5B6CCF` | 5,02 / 5,06 / 4,68 | idem | idem | idem | 4,5 |
| wit/team `#D08A2E` | *2,85 C9 | *2,85 C9 | *2,85 C9 | *2,85 C9 | 4,5 |
| wit/speler `#B94E2A` `#B5476E` `#7A5BB5` `#5B6CCF` `#3E7B4F` | 5,02 / 5,13 / 5,26 / 4,68 / 5,06 | idem | idem | idem | 4,5 |
| wit/speler `#2E8C9A` | *3,94 C7 | *3,94 C7 | *3,94 C7 | *3,94 C7 | 4,5 |
| wit/speler `#D08A2E` | *2,85 C7 | *2,85 C7 | *2,85 C7 | *2,85 C7 | 4,5 |
| wit/melding-succes | *2,42 C8 | *2,23 C8 | *2,42 C8 | *2,23 C8 | 4,5 |
| wit/melding-waarschuwing | *2,35 C8 | *2,15 C8 | *2,35 C8 | *2,15 C8 | 4,5 |
| wit/melding-fout | *3,98 C8 | *3,63 C8 | *3,98 C8 | *3,63 C8 | 4,5 |
| wit/melding-info | 15,45 | 12,70 | 15,45 | 12,70 | 4,5 |

**Uitzonderingen, apart:**

| # | Wat | Status |
|---|---|---|
| C1 | groot doelgetal (accent) op donkere kaart, 2,78 / 2,84 | bevestigd |
| C2 | muted direct op lichte achtergrond, 4,25 | bevestigd |
| C3 | accent-tekst direct op lichte achtergrond, 4,45 | bevestigd |
| C4 | warning op licht | **nog niet meetbaar**: het token bestaat pas na K3 (4D) |
| C5 | wit op danger, 3,55 | bevestigd |
| C6 | wit op groene uitgooi-badge `#16a34a`, 3,30 | bevestigd |
| C7 | witte letter op avatarkleur `#2E8C9A` (3,94) en `#D08A2E` (2,85) | bevestigd; in 4B noemde ik `#2E8B9A`, de app gebruikt `#2E8C9A` |
| C8 | witte tekst op meldingen groen/oranje/rood, 2,15–3,98 | bevestigd |
| **C9** | **nieuw:** wit nummer op teamkleur 4 `#D08A2E` (Afgooien/X01-teams), 2,85 | teamkleur (X1): niet automatisch aanpassen |
| **C10** | **nieuw:** rode Stop in de lichte spelbalk, 3,37 | gevonden door de steekproef |
| **C11** | **nieuw:** accent-vulkleur als kleine tekst op een kaart (actieve spelersnaam, cijfers winstscherm), donker 2,78 / licht 4,32 | zelfde oorzaak als C1 |

**Contraststeekproef (alleen melden, 55 scenario's × donker/licht/auto-donker op 390×844):** 157 / 228 / 65 teksten onder de eis, en ±300 per thema "onzeker" (achtergrond met verloop). Het is een benadering. "Home" in licht (1,01) is bijvoorbeeld een meetfout, omdat de oranje indicator achter de navigatie geen voorouder is. Wat er echt uit kwam, staat nu als C10 en C11 in de parentest. Overige kandidaten om in 4D per geval te bekijken: de tag "Verlies" in de geschiedenis (4,41–4,43), "niet uitgooibaar" en "gem. —" in licht (4,14), en cijfers in de geschiedenis op donker.

## 5. Tikvlakken

Alle 55 scenario's per breedte, NL donker. **Bekend** (= stand `faf50f0`, staat in `tap.known.json`, faalt niet):

| Breedte | onder spelbalk | onder navigatie | bedekt | overlap | te klein zonder ruimte | totaal |
|---|---|---|---|---|---|---|
| 320 | 25 | 0 | 0 | 0 | 46 | 71 |
| 360 | 6 | 0 | 0 | 0 | 15 | 21 |
| 375 | 3 | 0 | 0 | 1 | 16 | 20 |
| 390 | 0 | 0 | 0 | 2 | 5 | 7 |

- **Onder de spelbalk:**
  - 320: Cricket (17/18/19/20), Random Checkout-numpad (7/8/9), Shanghai (Single/Double/Mis), X01-numpad (7/8/9, 0, wissen);
  - 360: Cricket (15/16/Bull/Mis), Random Checkout "Uitgegooid", Shanghai "Mis";
  - 375: Cricket 15/16/Bull. Dat is 4A-bevinding H3, nu gemeten per breedte.
- **Overlap:** in "Rondes corrigeren" ligt de vaste knop Opslaan over een invoerveld van een ronde. Het veld is daarna wel bereikbaar door te scrollen, maar in de beginstand overlapt het echt.
- **Te klein zonder ruimte:**
  - de winnaar-keuzerondjes in "Eindstand corrigeren" (18×18);
  - de schakelaar Geluid (31 hoog) en zijn label (23 hoog);
  - de numpad van Random Checkout (38 hoog, 4 px tussenruimte);
  - op 320: de X01-snelscores (37 breed) en "pijlen per poging" in de Random Checkout-setup.
- **Chips (`lb-chip`, `lb-sub`, `known-name-btn`):** op geen enkele breedte een probleem. De meting uit 4B blijft staan: ze kunnen veilig naar 44 px.

**Twee fouten in mijn eigen meting gevonden en hersteld vóór de bekende lijst werd vastgelegd:**
1. Knoppen in de spelbalk en de navigatie telden als "onder hun eigen balk", doordat meetpunten op de afgeronde hoeken lagen.
2. "Bereikbaar door te scrollen" gold ook voor twee gewone elementen die over elkaar liggen. Daardoor ving de test overlappende chips niet; de mutatietest liet dat zien. Nu geldt die uitzondering alleen voor vastgezette elementen (sticky/fixed).

De bekende lijst is na de herstelling opnieuw gegenereerd. Ze was identiek, dus de fout had geen echte bevindingen verborgen.

## 6. Tablet

Automatische controles op de aanvullende opnames (`faf50f0`):

| Dimensie | opnames | fouten | horizontale overloop | onder spelbalk |
|---|---|---|---|---|
| tablet staand 768×1024 | 110 | 0 | 0 | X01-statistiekenblad (kop, = H2) |
| tablet liggend 1024×768 | 110 | 0 | 0 | X01-statistiekenblad (kop, = H2) |
| 360×640 | 110 | 0 | 0 | Cricket, Random Checkout (+ Uitgegooid?), Shanghai, X01 (2/4 spelers, statistiekenblad) |
| automatisch donker/licht 390×844 | 110 | 0 | 0 | X01-statistiekenblad |
| automatisch donker 1920×1080 | 17 | 0 | 0 | - |

- **Staand (768×1024):** telefoonindeling in de 760-kolom. Werkt. Veel lege ruimte in Cricket en de oefenspellen; het zwarte vlak in Halve It (I13).
- **Liggend (1024×768):** de kantine-indeling (een iPad valt onder de kantineregel). 501, Cricket en Random Checkout zijn bruikbaar; Halve It heeft het zwarte vlak; home en statistieken staan in de 760-kolom. **Of dit gewenst is, blijft open (K6).** Er is niets aan veranderd.
- **Thema automatisch:** donker automatisch wijkt zichtbaar maar subtiel af van "Donker" gekozen (doorschijnende kaarten en toetsen). Dat staat nu in de baseline, zodat K1 later aantoonbaar wordt.

## 7. Welke tests falen op een bewust geïntroduceerde fout

`node tests/mutation.mjs --visual`, elke fout in een kopie van `index.html`. Hieronder de echte foutmelding van de test:

| Bewuste fout | Suite | Faalt met |
|---|---|---|
| muted in licht te licht (`#A39C96`) | contrast | "NIEUWE contrastfout: muted/kaart = 2.33; muted/vlak = 2.65" (licht en auto-licht) |
| doelgetal in licht onleesbaar | contrast | "doelgetal/doelvlak = 1.53 (eis 3)" |
| tekst op donker te zwak | contrast | "tekst/bg = 2.22; tekst/kaart = 2.09; tekst/vlak = 2.56" |
| chips overlappen elkaar | tap-390 | "3 NIEUW: setup-3-spelers\|bedekt\|.known-name-btn "✓ Tom" door …" |
| spelbalk bedekt spelknoppen | tap-390 | "23 NIEUW: afgooien\|onder-balk\|.btn "Mis" \| atc\|onder-balk\|.g-hit "Raak 1" …" |
| filterchip te klein (24 px) | tap-390 | "4 NIEUW: ranglijst\|te-klein\|.lb-chip "501 / 301" 95x24 …" |
| Stop-venster verschijnt niet meer | tap-390 | "bevestig-stop: overlays [] ≠ ["bevestig"]" |
| nieuw scherm zonder scenario | coverage | "scherm zonder scenario: screen-nieuw" |
| nieuwe hardgecodeerde kleur | tokens-ratchet | "371 > 370: gebruik een token" |
| 1 px extra ruimte op de snelstart-tegels | visueel (compare) | home anders, x01 gelijk |
| (bestaand) bust onder 0, bust op 1, tombstones, tellers, escapen, Shanghai direct | x01, data, taint-local, games | gevangen |

## 8. Grenzen (eerlijk)

- Alles draait in Chromium. Safari op de iPhone (lettertype-rendering, `env(safe-area-inset-*)`, `100vh`) kan de test niet nabootsen. Controleren op de echte iPhone blijft nodig bij zichtbare wijzigingen in 4D.
- De tikvlaktest kent ::after-tikzones alleen als ze `position:absolute` zijn met insets. Zo worden ze in 4D ook gebouwd (§5.3 van het voorstel).
- De contraststeekproef is een benadering (verlopen, zuster-elementen als achtergrond). Daarom faalt ze niet. De parentest is exact.
- Tikvlakken worden alleen in donker en NL gemeten. Thema verandert de maten niet; EN kan langere labels geven. Dat is een bewuste keuze, omdat het anders 4 extra suites zou kosten.
- `npm test` duurt nu ±7 in plaats van ±3 minuten, vooral door de vier tikvlaksuites (elk ±2 min).
- De Firestore-regels, sync, spelregels en gegevens zijn niet aangeraakt. De tests gebruiken alleen nep-Firebase en testdata.
