# Tests (Darts by Tom)

Eén commando test de hele app: spelregels, opslag/sync, weergave en beveiliging. De app zelf (`index.html`) heeft geen
afhankelijkheden; Playwright is alleen voor de tests.

```
npm install                    # eenmalig (Playwright)
npx playwright install chromium   # eenmalig
npm test                       # alles, ±6 min op 2 kernen; exitcode 0 = groen
node tests/run.mjs --only=x01,data   # alleen bepaalde suites
node tests/mutation.mjs        # controle dat de tests echte fouten vangen (bewuste fouten in een kopie), ±12 min
REF=<map met faf50f0> node tests/mutation.mjs --visual   # idem, plus de visuele vergelijking
REF=<map met oude index.html> npm test   # ook: 'Potje afronden' slaat exact hetzelfde op als die versie
```

In een sessie zonder `npm install`: `PLAYWRIGHT=<pad>/playwright/index.js CHROMIUM=<pad> node tests/run.mjs`.
`npm test` zet `FAST=10`: timers in de app lopen 10× sneller (beurtwissels, animaties). Voor de app verandert er niets.

| Map | Wat |
|---|---|
| `core/x01.mjs` | start, bust (onder 0, grensgeval, op 1), single out, ongeldige invoer, double out ja/nee + dubbel, legs, sets, best of, ongedaan, teams, statistiek, solo |
| `core/games.mjs` | elk spel één keer echt uitgespeeld via de invoerfuncties: ATC, Cricket, Shanghai (+ direct), Bob's 27 (+ uit), Halve It, Eliminatie (+ terugzetten), Afgooien, Random Checkout, 121 |
| `core/data.mjs` | `_grpMerge` (tombstones, tellers alleen omhoog, idempotent), account-sync tussen twee apparaten, samenvoegen, verwijderen (alleen na bevestiging), potje verwijderen, export/import, hervatten na herladen, `darts_db` byte-gelijk na herladen |
| `core/ui.mjs` | spelbalk overlapt geen knoppen (4 schermmaten × 10 spellen × 2/4 spelers), geen overloop, NL/EN × licht/donker (+ kruiscombinaties) |
| `core/fase3.mjs` | kantinescherm liggend (scoregrootte, numpadbreedte, spelbalk), oefenspellen liggend, "Verder waar je was"; met `REF=` ook telefoonmaten pixel-gelijk |
| `core/errlog.mjs` | geen lege `catch` meer, stille catches alleen met reden buiten opslag/sync, foutlog werkt en toont veilig |
| `core/coverage.mjs` | (fase 4C-0) dekking, statisch: elk scherm, elke instellingenpagina, elke overlay en elk onderblad heeft een scenario of een reden; elke scenario in elke afgesproken resolutie/taal/thema |
| `core/contrast.mjs` | (fase 4C-0) WCAG-contrast gemeten in de app in 4 themastanden (donker/licht gekozen, automatisch donker/licht); paren in `contrast.pairs.json`, bekende uitzonderingen C1–C11 in `contrast.allow.json`. Faalt op elke nieuwe onvoldoende combinatie; matrix in de uitvoer |
| `core/tap-320/360/375/390.mjs` | (fase 4C-0) tikvlakken per breedte in alle scenario's: overlap, onder spelbalk/navigatie, bedekt, < 44 px zonder ruimte, ::after-zone te groot. Faalt op elke bevinding die niet in `tap.known.json` (stand faf50f0) staat. 390 controleert ook dat elk scenario op het verwachte scherm/overlay landt |
| `core/tokens-ratchet.mjs` | (fase 4C-0) aantal hardgecodeerde kleuren in CSS en HTML/JS mag niet stijgen (`tokens-ratchet.json`) |
| `security/*` | fase 1: escapen, binnenkomende data, namen, melden, 'Potje afronden', correcties, Eliminatie, rematch (zie `security/README.md`) |

Nieuwe test: een `t('naam', async () => …)` in een `core/*.mjs` (zie `core/h.mjs`). Nooit tegen echte data testen.

**Bekende lijsten** (`contrast.allow.json`, `tap.known.json`, `tokens-ratchet.json`) leggen de stand van de goedgekeurde versie
`faf50f0` vast. Ze worden alleen bijgewerkt met akkoord van Tom (`node tests/core/tap-lib.mjs --update`,
`node tests/core/tokens-ratchet.mjs --update`). Een test meldt het zelf als iets uit een lijst opgelost is.
