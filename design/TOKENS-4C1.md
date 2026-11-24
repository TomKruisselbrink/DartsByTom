# Fase 4C-1: tokenoverzicht

Branch `feat/fase4c-1`. Een tokenblok bovenaan de eerste `<style>` in `index.html`, met kop
`/* ═══ Ontwerpsysteem-tokens (fase 4C-1) ═══ */`. Er is **niets anders** aan `index.html` veranderd: zonder dit blok is het bestand
byte-gelijk aan `faf50f0`. De tokens worden nog door geen enkele regel gebruikt; dat gebeurt in 4C-2.

**Regel:** elk token heeft de waarde van een bestaande, aanwijsbare bron. Waar al een CSS-variabele bestond, verwijst het token
ernaar (`var(--…)`) en volgt het dus automatisch elk thema, ook het verschil tussen "donker automatisch" en "donker gekozen".
`tests/core/tokens.mjs` bewijst in vier themastanden dat elk token gelijk is aan zijn bron, en dat er geen nieuwe waarde in staat.

## Basispalet (vaste waarden)

| Token | Waarde | Bron in de app |
|---|---|---|
| `--terra-300` | `#E07A55` | `--su-orange-text` (donker), 6× in de app |
| `--terra-500` | `#B94E2A` | `--accent` |
| `--terra-600` | `#A8431F` | `--su-orange-text` / `--setup-accent-text` (licht) |
| `--terra-700` | `#9A3F22` | ingedrukte accentknop (2×) |
| `--green-300` | `#8FCB9C` | `--su-green-text` (donker), 12× |
| `--green-400` | `#5E9E6E` | groene rand/hover (4×) |
| `--green-500` | `#3E7B4F` | `.g-hit` en huisgroen |
| `--green-600` | `#2F6B40` | `--su-green-text` (licht), 12× |
| `--green-700` | `#1E5631` | `.x-last`, `.sp-tag` licht (6×) |
| `--sage-300` | `#9DBF9E` | `--accent2` |
| `--red-300` | `#FF8A7A` | `.g-miss` donker |
| `--red-500` | `#FF3B30` | `--danger` |
| `--red-700` | `#B3261E` | `.g-miss` licht |

## Interface (donker / licht)

| Token | Donker | Licht | Bron | Gebruik vanaf 4C-2 |
|---|---|---|---|---|
| `--text-muted` | `var(--muted)` | `var(--muted)` | `--muted` (volgt elk thema) | meta, uitleg |
| `--text-soft` | `#C9BFB8` | `#48484A` | `--su-soft` | knoptekst setup |
| `--text-on-fill` | `#FFFFFF` | `#FFFFFF` | witte tekst op accent/groen | primaire knoppen, badges |
| `--sunken` | `#141314` | `rgba(0,0,0,.06)` | `--su-well` | segmenten-bak |
| `--scrim` | `rgba(0,0,0,.55)` | idem | `.ask-ov` | achter vensters |
| `--accent-text` | `var(--terra-300)` | `var(--terra-600)` | `--su-orange-text` | accent als kleine tekst |
| `--accent-soft` | `rgba(185,78,42,.16)` | idem | `.x-card.on` (in beide thema's .16) | actief/geselecteerd |
| `--accent-ring` | `rgba(185,78,42,.35)` | idem | binnenste ring van de gloed (licht) | rand actieve speler |
| `--accent-press` | `var(--terra-700)` | idem | ingedrukte accentknop | |
| `--hit` | `var(--green-500)` | idem | `.g-hit` | Raak-knop, winst |
| `--hit-text` | `var(--green-300)` | `var(--green-600)` | `--su-green-text` | groen als tekst |
| `--hit-soft` | `rgba(62,123,79,.28)` | `rgba(62,123,79,.18)` | `.g-chip` | groene vlakken |
| `--danger-text` | `var(--red-300)` | `var(--red-700)` | `.g-miss` | mis-tekst |
| `--danger-soft` | `rgba(255,59,48,.1)` | idem | `.btn-danger` | Verwijderen-knop |

## Spelstatus (groep B)

| Token | Waarde | Bron |
|---|---|---|
| `--state-turn` | `var(--accent-soft)` | `.x-card.on` |
| `--state-hit` | `var(--hit)` | `.g-hit` |
| `--state-miss` | `var(--danger-text)` | `.g-miss` |
| `--state-win` | `var(--hit)` | winst |
| `--state-out-opacity` | `.38` | `.g-prow.out` |

## Hoogte, typografie, ruimte, hoeken, lagen

| Groep | Tokens | Bron |
|---|---|---|
| Hoogte | `--elev-1: var(--shadow)`; `--elev-3: var(--shadow-lg)`; `--elev-4`: donker `0 20px 60px rgba(0,0,0,.45)`, licht `0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)` | `--shadow`, `--shadow-lg`, `.ask-box` (licht: v241-regel) |
| Lettergrootte | `--fs-micro 11px`, `--fs-caption 12px`, `--fs-small 13px`, `--fs-body 15px`, `--fs-body-lg 17px`, `--fs-title 20px`, `--fs-stat 28px`, `--fs-headline 34px` | bestaande groottes (76×, 150×, 95×, 41×, 16×, 22×, 14×, 1×) |
| Gewicht | `--fw-regular 400`, `--fw-bold 700` | de twee bestanden van Flow Text |
| Ruimte | `--sp-1 2px` … `--sp-8 16px`, `--sp-10 20px`, `--sp-12 24px`, `--sp-16 32px` | bestaande marges/gaps |
| Hoeken | `--r-xs 6` `--r-sm 8` `--r-md 10` `--r-lg 12` `--r-xl 14` `--r-2xl 16` `--r-3xl 20` `--r-pill 999px` `--r-round 50%` `--r-score-xl 22` | bestaande `border-radius` |
| Lagen | `--z-base 0` `--z-content 1` `--z-sticky 10` `--z-drag 100` `--z-banner-top 9000` `--z-game-controls 9970` `--z-nav 9980` `--z-install 9980` `--z-sheet 9990` `--z-modal 9997` `--z-toast 9999` `--z-confirm 10050` | huidige `z-index`-waarden |

## Bewust afwijkend van het voorstel (4B) of weggelaten

| Punt | Waarom |
|---|---|
| `--danger-text` donker = `#FF8A7A` (voorstel: `#FF7A6B`) | `.g-miss` gebruikt `#FF8A7A`; het voorstel had dat verkeerd |
| `--accent-soft` licht = `.16` (voorstel: `.12`) | `.x-card.on` gebruikt in beide thema's `.16` |
| `--hit-soft` = `.28` / `.18` (voorstel: `.16` / `.14`) | `.g-chip` gebruikt `.28` / `.18` |
| `--state-out-opacity` = `.38` (voorstel: `.45`) | `.g-prow.out` gebruikt `.38` |
| `--elev-4` heeft een lichte variant | `.ask-box` krijgt in licht de warme v241-schaduw; gevonden door `tokens.mjs` |
| geen `--elev-2` | spelbalk (`0 4px 24px rgba(0,0,0,0.3)`) en navigatie (`0 4px 28px rgba(0,0,0,.5)`) hebben verschillende schaduwen; samenvoegen is een zichtbare wijziging (4D) |
| geen `--glow-turn`, `--glow-primary` | de gloed bestaat alleen in licht; in donker is er geen bron |
| geen `--warning`/`--amber-*` (K3), geen `--focus` | nieuw of nog niet bestaand; 4D |
| geen `--team-*`, `--player-*`, `--board-*` | groep C/D blijft in de JS-constanten (uitzonderingen X1–X10); een CSS-kopie zou ongebruikt en dubbel zijn |
| `--z-install` 9980, `--z-toast` 9999 (voorstel: 9985, 10100) | huidige waarden; de correcties zijn 4D |
| geen regelhoogtes, geen bewegingstokens | geen eenduidige bestaande bron |
| richting van aliassen | nieuwe tokens verwijzen naar de bestaande variabelen (`--text-muted: var(--muted)`), niet andersom. Bestaande declaraties aanpassen was niet nodig en geeft risico; omdraaien hoort bij 4C-3 (themaregels samenvoegen) |

## Componenten (fase 4C-3)

Themawaarden van componenten. Donker = standaard in het `:root`-tokenblok, licht in **beide** lichte overrides (gekozen en automatisch, identiek). Alleen toegevoegd als geen bestaand token in alle vier themastanden dezelfde waarde had; hergebruikt: `--hit-text` (`.standing-pts`). Elke waarde kwam al voor in `faf50f0` (`tests/core/tokens.mjs`), en `tokens.mjs` vergelijkt elk token met het echte element in `faf50f0`.

| Groep | Token | Donker | Licht | Reden |
|---|---|---|---|---|
| navigatie en spelbalk | `--nav-bg` | `rgba(28,28,30,0.92)` | `rgba(255,255,255,.9)` | #pill-nav achtergrond; geen bestaand token met dit paar (--header-bg verschilt per stand) |
| navigatie en spelbalk | `--nav-border` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,.08)` | #pill-nav rand; --border heeft in licht rgba(60,40,30,.10) |
| navigatie en spelbalk | `--nav-shadow` | `0 4px 28px rgba(0,0,0,.5)` | `0 4px 24px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06)` | #pill-nav schaduw; uniek |
| navigatie en spelbalk | `--nav-tab` | `rgba(255,255,255,0.42)` | `rgba(0,0,0,.42)` | .pn-tab tekst; uniek |
| navigatie en spelbalk | `--nav-badge-ring` | `rgba(28,28,30,.92)` | `#fff` | ring om het meldingsstipje (#pn-settings.has-badge::after); donker = --nav-bg, licht niet |
| navigatie en spelbalk | `--controls-bg` | `rgba(30,30,30,0.72)` | `rgba(255,255,255,0.82)` | #game-controls achtergrond; uniek |
| navigatie en spelbalk | `--controls-border` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.1)` | #game-controls rand; uniek |
| kaarten en spelstatus | `--card-border` | `var(--border)` | `rgba(60,40,30,.07)` | .card rand; donker volgt --border, licht eigen waarde (v217) |
| kaarten en spelstatus | `--card-shadow` | `var(--elev-1)` | `0 1px 2px rgba(60,40,30,.05),0 6px 18px -6px rgba(60,40,30,.10)` | .card schaduw; donker volgt --elev-1, licht eigen waarde (v217) |
| kaarten en spelstatus | `--tile-shadow` | `none` | `0 1px 2px rgba(60,40,30,.06),0 8px 22px -10px rgba(120,60,30,.22)` | diepte van tegels/kaarten in licht (v241); donker geen schaduw. --elev-4 heeft in licht dezelfde waarde, maar in donker niet none |
| kaarten en spelstatus | `--tile-shadow-on` | `none` | `0 0 0 1px var(--accent-ring),0 10px 26px -8px rgba(185,78,42,.45),0 0 …` | gloed actieve speler in licht (v241); donker geen |
| kaarten en spelstatus | `--tag-text` | `var(--green-300)` | `var(--green-700)` | .x-last en .sp-tag tekst; --hit-text heeft in licht green-600, niet 700 |
| kaarten en spelstatus | `--last-bg` | `rgba(62,123,79,.22)` | `rgba(62,123,79,.16)` | .x-last achtergrond; uniek |
| kaarten en spelstatus | `--last-bust-bg` | `rgba(255,90,70,.14)` | `rgba(179,38,30,.1)` | .x-last.bust achtergrond; uniek |
| kaarten en spelstatus | `--miss-border` | `rgba(255,122,107,.5)` | `rgba(179,38,30,.45)` | .g-miss stippelrand; uniek |
| kaarten en spelstatus | `--chip-text` | `#CFEAD5` | `var(--green-700)` | .g-chip tekst; uniek |
| kaarten en spelstatus | `--metric-shadow` | `var(--elev-1)` | `var(--tile-shadow)` | .metric (statistiektegels): donker --elev-1; licht de tegelschaduw (v241). In-place omzetten kon niet: de latere .metric-regel won dan in licht |
| achtergrond van de pagina | `--page-bg` | `linear-gradient(160deg,#000000 0%,#381000 30%,#0f2e10 100%)` | `radial-gradient(ellipse 95% 50% at 0% 0%,rgba(185,78,42,.14),rgba(185,…` | achtergrond body: donker verloop (automatisch en gekozen gelijk), licht gloed v217 |
| achtergrond van de pagina | `--page-glow` | `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(185,78,42,.07) 0%, tra…` | `none` | body::before diepte-gloed; licht geen (v217) |
