# Tests (Darts by Tom)

Eén commando test de hele app: spelregels, opslag/sync, weergave en beveiliging. De app zelf (`index.html`) heeft geen
afhankelijkheden; Playwright is alleen voor de tests.

```
npm install                    # eenmalig (Playwright)
npx playwright install chromium   # eenmalig
npm test                       # alles, ±3 min op 2 kernen; exitcode 0 = groen
node tests/run.mjs --only=x01,data   # alleen bepaalde suites
node tests/mutation.mjs        # controle dat de tests echte fouten vangen (bewuste fouten in een kopie)
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
| `core/errlog.mjs` | geen lege `catch` meer, stille catches alleen met reden buiten opslag/sync, foutlog werkt en toont veilig |
| `security/*` | fase 1: escapen, binnenkomende data, namen, melden, 'Potje afronden', correcties, Eliminatie, rematch (zie `security/README.md`) |

Nieuwe test: een `t('naam', async () => …)` in een `core/*.mjs` (zie `core/h.mjs`). Nooit tegen echte data testen.
