# F12: 'niet uitgooibaar' afgekapt bij 2 spelers (afzonderlijke reparatie)

- **Basis:** `feat/fase4d` @ `6c345b8`. Akkoord Tom 24-11 (V2: aparte reparatie vóór 4D-1b).
- **Niet gewijzigd:** spelregels, scoreberekening, checkoutlogica, opslag, Firebase, sync, `main`, `APP_VERSION`, `faf50f0`, allowlists en ratchets.

## Oorzaak
- De iPhone-reparatie (`6c345b8`) gaf "niet uitgooibaar" alleen bij **3+ spelers** een eigen benoemde rasterrij.
- Bij **1–2 spelers** stond de melding nog in de meta-regel, naast de legstand ("niet uitgooibaar · gem. —" + "legs 0").
- Op telefoons is daar te weinig ruimte. Ook in Chromium afgekapt:

| Viewport | Beschikbaar | Nodig NL / EN | Afgekapt in |
|---|---|---|---|
| 360 | 92 px | 134 / 111 px | NL en EN |
| 375 | 100 px | 134 / 111 px | NL en EN |
| 390 | 107 px | 134 / 111 px | NL en EN |
| 430 | 87 px | 134 / 111 px | NL en EN |

- Zonder legstand (1 leg) alleen op 360 in het Nederlands.
- De test van de reparatie dekte 2 spelers niet. Daardoor bleef dit liggen, en waarschijnlijk is dit (ook) wat Tom op de iPhone zag ("bij alle spelers").

## Reparatie (`index.html`, +8/−6)
Dezelfde aanpak als bij 3+ spelers:
- De melding staat op een eigen benoemde rij `"imp imp"` in de kaartindeling (`.x-imp-card`) en niet meer in de meta-regel.
  - Telefoon en tablet staand: `"top top" "score score" "hint hint" "meta legs" "imp imp"`.
  - Liggend ≥ 1000 px: `"top legs" "score score" "hint hint" "meta meta" "imp imp"`.
- De hoogtecompensatie van het lege uitgooivak (`.x-imp-on`) geldt nu voor 1–4 spelers (was 3–4). Als de melding er staat, is het uitgooivak altijd leeg; de minimale hoogte krimpt met precies de regelhoogte (14,4 px).
- Kantinemaat (≥ 1600 px) en kleur (`--text-soft`) waren al voor `.x-imp` geregeld.

## Metingen vóór (6c345b8) → na

5 toestanden × 10 viewports × NL/EN = 100 opnames (`meting-voor/na.json`).

| Controle | Resultaat |
|---|---|
| "niet uitgooibaar" afgekapt | 320–430 px, NL+EN → **nergens** (overal een eigen regel, volledig) |
| toetshoogte | **overal gelijk** (320: 44, 360: 45, 375: 47, 390: 63, 430: 71, tablet/kantine 56–74) |
| ruimte toetsen ↔ gamebalk | **nergens kleiner**. Beter waar de rij niet groeit ("niet uitgooibaar" + route ernaast): 360 −6 → **+9**, 375 12 → **18**, 320 −97 → −83 |
| nieuwe scrollbehoefte | **geen**. Op 375×667 verdwijnt het scrollen in twee toestanden |
| kaarthoogte begin leg (2 spelers) | +14 px (360: 122 → 136), opgevangen door het lege uitgooivak: toetsen gelijk |

## Tests
| Controle | Resultaat |
|---|---|
| syntaxcheck | 0 fouten |
| `npm test` | **141/141** in 34 suites |
| `x01-kaart.mjs` uitgebreid | 2 spelers (met en zonder legstand, met route ernaast, wel uitgooibaar) in de viewport-test, en 2 spelers in de iPhone-test (9 telefoonmaten, NL en EN: volledige tekst, één regel, volle kaartbreedte, benoemde rij). **6c345b8: 7/15 geslaagd (8 gezakt), reparatie 15/15** |
| mutatietest `--visual` | **28/28 + visuele mutatie gevangen**. Nieuw: "2 spelers weer in de meta-regel". De zoektekst van de bestaande mutatie "niet uitgooibaar weer weg" verwees naar de oude code (`imp&&n>2`) en is bijgewerkt. De eerste run faalde alleen daarop ("zoektekst niet gevonden"); de herhaling slaagde. |
| visueel t.o.v. 6c345b8 (1253 opnames) | **49 anders**, alleen `x01-stats-blad` (20) en `bevestig-stop` (29): beide hebben op de achtergrond een 2-spelerspotje aan het begin van een leg. Verschillen alleen in de kaartzone; 0 px binnen het bevestigvenster. Scope: GOED |

## Gezien, niet opgelost (buiten F12, bestond al)
- **2 spelers met sets:** het **gemiddelde** wordt naast "sets 1 legs 2" afgekapt (360: beide spelers, 430: beide, 375/390: alleen de andere speler). De melding zelf staat nu wel volledig.
- **2 spelers met sets, Engels, lange naam ("Christiaan")** op 320–375 en 1024: de naam wordt afgekapt naast THROWS en de legstand.
- **320×568:** de toetsen zitten in alle 2-spelerstoestanden onder de gamebalk (−55 tot −97 px). Dat bestond al en valt onder K10 ("320 bruikbaar, scrollen mag"). 4D-1b haalt de zwevende balk weg.

## Handmatig door Tom
Safari-PWA op de iPhone: een 2-spelerspotje (first to 3), begin van een leg: staat "niet uitgooibaar" volledig onder "gem. —"? Ook in het Engels ("no checkout").
