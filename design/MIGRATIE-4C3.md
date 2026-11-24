# Fase 4C-3: themaregels van componenten → tokens (verslag)

Branch `feat/fase4c-3` (vanaf `feat/fase4c-2` `b62efd9`). Referentie: `faf50f0` (onaangeroerd). Voorstel: `design/VOORSTEL-4C3.md`.
Akkoord Tom (23-11-2026): B1 CSS in `<style>` mag bij bewezen 0 pixels, B2 ratchet naar de gemeten telling, B3 Engelse tikvlakken.

## Commits

| Stap | Commit | Wat |
|---|---|---|
| voorstel | `50385d5` | `design/VOORSTEL-4C3.md` |
| stap 0 + W1 groep 1 | `2fb8835` | dood-bewijs, classificatie, navigatie en spelbalk |
| W1 groep 2 | `07c5197` | kaarten en spelstatus |
| W1 groep 3 | `c082fbb` | achtergrond van de pagina |
| W2 | `ce44abd` | test `theme-rules` + uitzonderingenlijst + mutatie 21 |
| W3 | `ac1143a` | tikvlakken in het Engels + nulmeting `tap.known.en.json` |
| B2 | `49a4960` | ratchet CSS 255 → 183 |
| afsluiting | (deze commit) | verslag, CLAUDE.md, tests/README.md, TOKENS-4C1.md |

## Werkwijze

1. **Bewijs dode selectors** (`design/dead_4c3.mjs` → `4c3-log/dood-bewijs.json`): `.player-card` en klasse `numpad` komen nergens in HTML/JS voor als klasse (alleen commentaar, functienamen en de zoekselector `_KSEL`) en matchen in geen van de 55 scenario's (licht + donker). `#game-bar` staat overal op `display:none`.
2. **Classificatie** (`design/classify_4c3.mjs` → `4c3-log/classificatie.json`): elke themadeclaratie, per selectordeel en per element, in 4 standen die elk precies één soort themaregel actief maken. Sentinel-test (wint hij?) en verwijder-test (doet hij iets?): WERKZAAM / OVERBODIG / OVERSCHREVEN / NIET-WAARGENOMEN.
3. **Regels** (`design/migrate_4c3.py`): R1 werkzaam → token in de gewone regel; R2 overbodig → weg; R3 overschreven → alleen weg als zijn overschrijver wordt omgezet (anders wordt hij werkzaam); R4 niet waargenomen / niet omzetbaar / bestaande fout → blijft (uitzondering).
4. **Controle per groep:** `design/verify_4c3.mjs` vergelijkt de **berekende stijl** van elk element en `::before`/`::after` (kleur, achtergrond, randen, schaduw, opacity, outline, text-shadow, fill, stroke) met de vorige commit `b62efd9`, in **6 themastanden** (automatisch licht/donker, gekozen licht/donker × systeem licht/donker = ook de kruiscombinaties) × 55 scenario's = 330 pagina's, 400.566 elementen. Een toestand die in geen scenario voorkomt (`.x-last.bust`) wordt voor de meting als kopie toegevoegd. Plus de snelle visuele vergelijking (292). Gevoeligheid aangetoond: één lichte tokenwaarde 0,01 alfa anders → 1394 verschillen.
5. Het script reproduceert elke groep byte-gelijk vanaf de vorige commit (`cmp`).

## Gevonden en opgelost tijdens W1 (geen waarden aangepast)

| Poging | Verschil | Oorzaak | Actie |
|---|---|---|---|
| groep 2, 1 | 189 (donker) | `.bob-keys button{box-shadow:var(--tile-shadow)}` (0,1,1) won van `.g-miss` (0,1,0): Mis-knop Bob's 27 verloor zijn schaduw | `.bob-keys button` niet omgezet (E9) |
| groep 2, 2 | 24 (licht) | `.metric` kreeg de latere `.metric`-schaduw | `.metric` via eigen token in zijn bestaande regel (`--metric-shadow`) |
| groep 2, 3 | 0 | | commit |

## Tokens

**19 nieuwe component-tokens** (overzicht met waarden en reden: `design/TOKENS-4C1.md` § Componenten; logboek `4c3-log/w1-*.json`):
`--nav-bg`, `--nav-border`, `--nav-shadow`, `--nav-tab`, `--nav-badge-ring`, `--controls-bg`, `--controls-border`,
`--card-border`, `--card-shadow`, `--tile-shadow`, `--tile-shadow-on`, `--tag-text`, `--last-bg`, `--last-bust-bg`, `--miss-border`, `--chip-text`, `--metric-shadow`,
`--page-bg`, `--page-glow`.
**Hergebruikt:** `--hit-text` (`.standing-pts`); de overbodige lichte regels voor `.co-lbl`, `.g-plus`, `.g-chip`-achtergrond, `.ask-box` en `.trn-match-header` gebruikten al `--hit-text`, `--hit-soft` of `--elev-4`.
Tokenblok: 78 + 19 = 97 tokens, allemaal gebruikt of met reden ongebruikt (`tokens.mjs`), 39 tokens vergeleken met hun bron in `faf50f0`.

## Wat is verdwenen

Lichte/donkere themaregels voor: `#pill-nav`, `.pn-tab`, `.pn-tab.active`, `#pn-settings.has-badge::after`, `#game-controls`, `.card` (incl. de overschreven `rgba(255,255,255,.6)`-rand), tegelschaduw van `.x-card`/`.g-prow`/`.g-target`/`.win-card`/`.live-card`/`.ask-box`, gloed `.x-card.on`/`.g-prow.on`, `.metric` (via token), `.x-last`, `.x-last.bust`, `.sp-tag`, `.g-miss`-rand, `.g-plus`, `.g-chip`, `.co-lbl`, `.standing-pts`, `.trn-match-header`, `body` (4 + 2 overschreven), `body::before` (2 + 1 overschreven).

## Uitzonderingen (blijven staan): `tests/core/theme-rules.allow.json`, 31 regels

| Code | Wat | Regels | Waarom |
|---|---|---|---|
| E1 | `#game-bar` | 2 | altijd verborgen |
| E2 | `.numpad .btn`, `.player-card.active` | 2 | dood (bewezen) |
| E3 | `#screen-setup`, `#screen-trn-setup` (`--su-*`, `--setup-accent-text`) | 8 | zijn al tokens, per scherm; gelijktrekken = 4D (K2) |
| E4 | `.ios-toggle` (automatisch donker) | 1 | fout F1 |
| E5 | `.win-kicker` | 2 | fout F2 |
| E6 | `.g-miss` tekst | 2 | fout F3 |
| E7 | `.trn-champ-kicker`, winnaarsregels toernooioverzicht | 6 | in geen scenario aanwezig: niet aantoonbaar 0 pixels |
| E8 | tegelschaduw `.home-tile`, `.home-quick-tile`, `.g-big3 button` | 6 | wint nooit (overschreven) |
| E9 | tegelschaduw `.bob-keys button` | 2 | niet omzetbaar zonder specificiteitsverandering |

## Bestaande fouten gevonden (niet opgelost; 4D)

- **F1** In *automatisch donker* (standaard voor wie nooit een thema koos) zijn ingeschakelde schakelaars grijs i.p.v. groen: `:root:not([data-theme="light"]) .ios-toggle` (0,3,0) is specifieker dan `.ios-toggle:checked` (0,2,0).
- **F2** De "Verloren"-kop op het winstscherm is in licht groen, in donker rood: `!important` in de lichte `.win-kicker`-regel.
- **F3** Eén Mis-knop in een toetsengroep heeft in donker witte, in licht rode tekst (specificiteit).
Ook: de kruiscombinaties stonden, anders dan in het voorstel geschreven, niet in de visuele matrix (gekozen thema's draaien daar met hetzelfde systeemthema). Ze zijn in 4C-3 gedekt door `verify_4c3.mjs` (berekende stijl), niet door de visuele matrix (die is ongewijzigd: 1253).

## Tikvlakken (W3)

| Breedte | NL (`tap.known.json`, ongewijzigd) | EN (`tap.known.en.json`, nieuw, faf50f0) |
|---|---|---|
| 320 | 71: onder balk 25, te klein 46 | 70: onder balk 24, te klein 46 |
| 360 | 21: onder balk 6, te klein 15 | 20: onder balk 4, te klein 15, overlap 1 |
| 375 | 20: onder balk 3, te klein 16, overlap 1 | 19: onder balk 2, te klein 16, overlap 1 |
| 390 | 7: te klein 5, overlap 2 | 7: te klein 5, overlap 2 |

Alleen in het Engels: overlap "Save" × invulveld bij Rondes corrigeren al op 360. Licht = donker exact (NL, 4 breedtes; `4c3-log/tap-licht-donker.json`). De Engelse nulmeting is **niet goedgekeurd** (bestaande problemen).

## Resterend hardgecodeerd (CSS)

Ratchet CSS 183 (was 255 na 4C-2, 370 bij faf50f0), HTML/JS 132 (ongewijzigd; inline stijlen gaan mee binnen 4D-punten). De resterende CSS-kleuren hebben geen exact passend token (groep C/D, X1–X10, unieke waarden) of horen bij een uitzondering hierboven.

## Niet gedaan (bewust)

- Geen HTML/JS, geen spelgedrag, Firebase, opslag of functionaliteit; `APP_VERSION` 252; `main` onaangeroerd; buiten `<style>` is `index.html` byte-gelijk aan `faf50f0`.
- Geen opruiming van dode CSS buiten wat R3 vereiste; geen omdraaien van alias-richting (`--muted` ↔ `--text-muted`): 4D heeft dat niet nodig.
- Contrastafwijkingen C1–C11 blijven open; pixel-identiek is geen goedkeuring van contrast.

## Eindcontrole (op `49a4960`, code gelijk aan deze commit)

| Controle | Uitkomst |
|---|---|
| Volledige visuele vergelijking t.o.v. `faf50f0` | **1253/1253 gelijk** (2849 s) |
| Berekende stijl t.o.v. `b62efd9`, 6 themastanden × 55 scenario's (na elke groep; laatste op de eindcode `c082fbb`) | 0 verschillen, 400.566 elementen |
| `npm test` | **118/118** in 32 suites (o.a. contrast 5/5, theme-rules 3/3, tokens 9/9, tokens-ratchet 2/2, tap NL 4× en EN 4×, html-sinks) |
| `node tests/mutation.mjs --visual` | **21/21 gevangen** |
| Ratchet | telling CSS 183 = maximum 183; kopie met één extra CSS-kleur: "184 > 183", test faalt |
| Tikvlakken | NL ongewijzigd (71/21/20/7), EN nieuw (70/20/19/7), licht = donker |
| Ongewijzigd | `contrast.allow.json`, `contrast.pairs.json`, `tap.known.json` (t.o.v. 4C-2); `APP_VERSION` 252; `main` `4785a1f`; buiten `<style>` byte-gelijk aan `faf50f0`; `faf50f0` zelf onaangeroerd |
