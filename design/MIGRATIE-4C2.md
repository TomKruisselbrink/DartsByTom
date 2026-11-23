# Fase 4C-2: migratie naar tokens

Branch `feat/fase4c-2` (vanaf `feat/fase4c-1`). Alleen CSS in `<style>`-blokken. HTML, JavaScript, spelregels, Firebase,
synchronisatie, gegevens en `APP_VERSION` (252) zijn niet aangeraakt: buiten `<style>` is `index.html` byte-gelijk aan 4C-1
(`design/verify_4c2.py` controleert dat).

## Werkwijze

- `design/migrate_4c2.py <groep>` vervangt mechanisch, met vaste regels, en logt elke vervanging in `design/4c2-log/<groep>.json`.
- `design/verify_4c2.py` controleert na elke groep:
  - dezelfde regels, selectors en eigenschappen in dezelfde volgorde;
  - elke gewijzigde waarde, met de tokens teruggezet, is exact de oude waarde;
  - buiten `<style>` is niets veranderd.
- Na elke groep een visuele vergelijking met `faf50f0` (quick, 292 opnames) en een eigen commit. Bij een verschil zou de lus stoppen. Dat is niet gebeurd.

**Regels die voorkomen dat een gelijke waarde toch anders uitpakt:**
- Een kleur die per thema verschilt (bijv. `#8FCB9C` donker / `#2F6B40` licht) wordt alleen een semantisch token als dezelfde selector een lichte override heeft in **beide** vormen (`[data-theme="light"] X` én `:root:not([data-theme="dark"]) X`) met precies de lichte waarde. Anders wordt het het vaste paletkleur-token (`--green-300`), dat in elk thema dezelfde waarde heeft.
- Alias-wissels (`var(--muted)` → `var(--text-muted)`, `var(--shadow)` → `var(--elev-1)`, `var(--shadow-lg)` → `var(--elev-3)`) alleen omdat `--muted`/`--shadow`/`--shadow-lg` uitsluitend op `:root` worden gedefinieerd (gecontroleerd). Een lokale herdefinitie zou anders niet doorwerken.
- Maten alleen bij een volledige, exacte waarde (geen delen van `clamp()`/`calc()`).
- z-index per bekende selector, niet per getal (9980 is zowel navigatie als installatiebanner).
- Niet aangeraakt: het tokenblok zelf, `@font-face`, `@keyframes`-stappen, declaraties met `url(...)`.

## Gemigreerde schermgroepen

| Groep | Commit | Vervangingen | kleur | thema | alias | maat | ruimte | laag | status | Visueel |
|---|---|---|---|---|---|---|---|---|---|---|
| navigatie (pill-nav, spelbalk, onderbladen, vensters, banners) | `55e4a37` | 67 | 11 | 1 | 4 | 19 | 25 | 7 | 0 | 292/292 |
| home en setup | `c4ccf29` | 163 | 22 | 4 | 13 | 60 | 62 | 2 | 0 | 292/292 |
| spellen | `7c3fd7d` | 210 | 42 | 5 | 19 | 69 | 74 | 0 | 1 | 292/292 |
| overzichten (stats, geschiedenis, ranglijst, winst) | `9e99feb` | 78 | 11 | 1 | 6 | 23 | 37 | 0 | 0 | 292/292 |
| instellingen | `7818087` | 142 | 5 | 0 | 24 | 52 | 61 | 0 | 0 | 292/292 |
| toernooi | `5bd2f63` | 38 | 8 | 2 | 3 | 12 | 13 | 0 | 0 | 292/292 |
| basis (overige, algemene componenten) | `dd291c5` | 196 | 17 | 0 | 30 | 79 | 69 | 1 | 0 | 292/292 |
| spelstatus en indrukken (gericht) | zie laatste commit | 5 | | | | | | | 5 | 292/292 |
| **totaal** | | **899** | | | | | | | | |

De laatste stap zet vijf regels op het token met de preciezere betekenis, met dezelfde waarde:

| Regel | Was | Wordt |
|---|---|---|
| `.x-card.on`, `.g-prow.on` (achtergrond) | `--accent-soft` | `--state-turn` |
| `.g-hit` (achtergrond) | `--hit` | `--state-hit` |
| `.g-miss` (tekst) | `--danger-text` | `--state-miss` |
| `.numpad .btn-primary:active` | `--terra-700` | `--accent-press` |

Het verloop van de hoofdtegel op het beginscherm houdt `--terra-700`: dat is decoratie, geen indrukstaat.

## Gebruik van de tokens

**71 van de 78 tokens worden gebruikt** (direct, of via een ander token: `--green-500` via `--hit`, `--red-300` via
`--danger-text`). `tests/core/tokens.mjs` faalt als een token ongebruikt raakt zonder reden. Nog ongebruikt, met reden:

| Token | Reden |
|---|---|
| `--terra-500`, `--red-500` | paletanker; regels gebruiken `--accent`/`--danger` (zelfde vaste waarde). In 4C-3 wordt dit de bron van `--accent`/`--danger` |
| `--state-win` | geen CSS-regel met een eenduidige winnaarskleur; winst-tags gebruiken andere bestaande waarden (4D) |
| `--fw-regular` | de CSS gebruikt nergens `font-weight:400` |
| `--z-banner-top`, `--z-modal`, `--z-toast` | die z-indexen staan in inline HTML of JS, buiten 4C-2 (stap 4X) |

Meest gebruikt: `--sp-4` 88×, `--text-muted` 86×, `--fw-bold` 60×, `--sp-5` 59×, `--fs-caption` 57×, `--sp-6` 54×.

## Wat nog hardcoded is (CSS in `<style>`, buiten het tokenblok)

| Soort | faf50f0 | na 4C-2 | Waarom resterend |
|---|---|---|---|
| kleuren (declaraties met hex/rgba) | 298 | 190 | geen exact passend token: andere alfa's (.12/.14/.18/.2/.3…), koele/warme grijzen, Halve It-opdrachtkleuren (X4), dartbord-/teamkleuren (X1/X3), verlopen; samenvoegen = zichtbaar (4D) |
| font-size in px | 236 | 82 | groottes buiten de schaal (9, 10, 14, 16, 18, 19, 21, 22, 24, 26, 30…); afronden = zichtbaar (4D) |
| border-radius | 123 | 23 | meervoudige waarden (`14px 14px 0 0`) en maten buiten de schaal (3, 5, 7, 9, 11, 13, 18…) |
| padding/margin/gap in px | 387 | 78 | maten buiten de schaal (1, 3, 5, 7, 9, 11, 18…) en negatieve marges |
| z-index | 16 | 6 | lokale stapeling binnen een component (1, 2, 5) en `#ios-install-modal` 9999 (geen eigen token) |
| box-shadow | 48 | 41 | alleen `.ask-box` had een exact token; de rest zijn unieke schaduwen (samenvoegen = 4D) |
| font-weight 600/800/900 | | ongewijzigd | renderen gelijk aan 700, maar zijn niet exact dezelfde waarde; aanpassen hoort bij 4D |

Buiten scope gebleven: inline `style=""` in de HTML en stijlen in JS-strings (±820), en de 3 z-index-tokens die daar thuishoren (stap 4X, optioneel).
Kleurenteller (`tokens-ratchet`): CSS 255 (was 370), HTML/JS 132 (ongewijzigd). Het maximum in `tokens-ratchet.json` is met akkoord van Tom (23-11-2026) van 370 naar 255 gezet; HTML/JS blijft 132.

## Tests aangepast

- `tests/core/tokens.mjs`:
  - **"geen nieuwe waarden"** vergelijkt nu met `faf50f0`. Na de migratie staan veel waarden alleen nog in het tokenblok, dus "komt elders voor" in het huidige bestand zei niets meer.
  - **"token = bron"** leest de bron nu uit `faf50f0`, gerenderd in dezelfde browser en themastand. Sinds 4C-2 gebruiken de bronregels zelf het token, dus de oude vergelijking was circulair. Een token dat een *andere bestaande* waarde krijgt, faalt nu ook.
  - **nieuw: gebruik.** Elk token gebruikt, of met reden op de lijst.
- `tests/mutation.mjs`: de token-mutatie is sterker gemaakt (`.16` → `.18`, een waarde die elders in de app bestaat).

## Testresultaten (eindcontrole, commit `1690e8c` + documentatie)

| Controle | Uitkomst |
|---|---|
| `design/verify_4c2.py` (structuur t.o.v. `40042ac`) | 954 regels, 893 gewijzigde declaraties, 0 fouten |
| Quick compare na elke groep + statuswissel | 8× 292/292 gelijk |
| Volledige compare t.o.v. `faf50f0` | **1253/1253 gelijk** (2177 s) |
| `npm test` | 107/107 (27 suites, incl. contrast, tap-320/360/375/390, coverage, tokens, tokens-ratchet) |
| `node tests/mutation.mjs --visual` | **19/20 gevangen — GEZAKT** |

**Niet gevangen: "kleuren: nieuwe hardgecodeerde kleur" (`core/tokens-ratchet`).** Oorzaak: de migratie bracht de CSS-teller van 370 naar 255, maar het maximum in `tokens-ratchet.json` staat nog op 370. Eén extra kleur (256) blijft ruim onder het maximum, dus de test slaagt en de mutatie wordt niet gevangen. De ratchet is daarmee tijdelijk zonder werking. Herstel = maximum naar 255 (`node tests/core/tokens-ratchet.mjs --update`); dat is een nulmeting bijwerken en wacht op akkoord van Tom. Niet zelf aangepast.

### Herstel ratchet (akkoord Tom, 23-11-2026)

Alleen `tests/core/tokens-ratchet.json` gewijzigd: `cssHard` 370 → 255 (en de uitleg). Geen andere grenzen, geen app-code.

| Controle | Uitkomst |
|---|---|
| Huidige telling (zelfde meetmethode, `tokens-ratchet.mjs`) | CSS hard 255, HTML/JS 132 → exact gelijk aan het nieuwe maximum |
| Kopie met één extra CSS-kleur (`.x-nieuw{color:#123456}`) | ratchet faalt: "256 > 255" |
| `node tests/mutation.mjs --visual` | **20/20 gevangen — GESLAAGD** |
| `npm test` | 107/107 (27 suites) |
| Volledige compare t.o.v. `faf50f0` | **1253/1253 gelijk** (2142 s) |
