# Voorstel fase 4C-3: laatste technische voorbereiding

Stand: 23-11-2026, na goedkeuring van 4C-2 (`feat/fase4c-2`, `b62efd9`). Referentie blijft `faf50f0`.
Dit is alleen een voorstel. Er is niets geïmplementeerd.

---

## 0. Kern

Het goedgekeurde plan (4B, §7.1) noemt voor 4C-3 één taak: **dubbele themaregels samenvoegen (I3)**. Gemeten op de huidige code blijft dat ook de enige noodzakelijke technische stap vóór 4D. Daarnaast komen er twee kleine aanvullingen, allebei alleen tests:

| | Werk | Raakt `index.html`? | Zichtbaar? |
|---|---|---|---|
| W1 | Themaregels van componenten omzetten naar tokens (I3) | ja, alleen CSS in `<style>` | nee, 0 pixels |
| W2 | Een test die nieuwe themaregels in componenten tegenhoudt | nee | nee |
| W3 | Tikvlakken ook meten in het Engels | nee | nee |

De optionele stap 4X (inline stijlen naar klassen) **vervalt als aparte fase** en wordt een werkregel binnen 4D (zie §3). Daarmee is 4C-3 echt de laatste technische fase.

---

## 1. Eerst te beslissen

**B1. "Geen wijzigingen aan de app-code" botst met I3.** I3 kan alleen door CSS in `index.html` aan te passen. Twee lezingen:

- **(a) Aanbevolen.** Dezelfde lezing als 4C-1/4C-2: CSS in `<style>` mag veranderen, mits bewezen 0 pixels. HTML, JS, spelregels, data, Firebase en `APP_VERSION` blijven onaangeroerd.
- **(b) Letterlijk.** `index.html` blijft helemaal ongewijzigd. Dan bestaat 4C-3 alleen uit W2 en W3, en schuift I3 naar 4D. Dat raad ik af: in 4D zou dezelfde kleurwijziging dan op drie plekken moeten (donker, licht-automatisch, licht-gekozen). Precies dat patroon gaf in v226 zes lekken. Ook valt een verschilrapport niet meer toe te wijzen als het omzetten en de zichtbare wijziging in één stap zitten.

**B2. Ratchet-maximum vooraf.** W1 verplaatst hardgecodeerde kleuren naar het tokenblok. De ratchet-telling daalt dan opnieuw, onder 255. Zonder bijstelling gebeurt hetzelfde als in 4C-2: de mutatie "nieuwe hardgecodeerde kleur" wordt niet meer gevangen. Voorstel: je geeft nu akkoord dat `cssHard` aan het eind van 4C-3 op de dan gemeten telling komt (alleen omlaag, met dezelfde meetmethode). Zonder dat akkoord stop ik op dat punt en vraag ik het opnieuw.

**B3. W3 (tikvlakken in het Engels): wel of niet?** Toelichting in §3. Het kan eruit zonder dat W1 en W2 lijden.

---

## 2. Welke componenten nog voorbereiding nodig hebben

Gemeten in de huidige `index.html`, in alle `<style>`-blokken.

- 23 media-queries op `prefers-color-scheme`, samen 37 regels: 35 licht, 2 donker.
- 32 regels met `[data-theme="light"]` en 2 met `[data-theme="dark"]`, buiten media-queries.
- 7 daarvan zijn `:root`-tokenblokken. Die zijn al goed en blijven zoals ze zijn.
- In 4B stond "19 paren". Dat zijn regelblokken; per selector geteld zijn het er ±37.

Wat overblijft, zijn **componentregels die per thema een eigen waarde zetten**:

| Component | Selector | Wat per thema verschilt | Status |
|---|---|---|---|
| Achtergrond pagina | `body`, `body::before` | verloop / gloed (licht, donker-gekozen, donker-automatisch) | **omzetten** (let op I1: automatisch ≠ gekozen, blijft zo) |
| Onderste navigatie | `#pill-nav`, `.pn-tab`, `.pn-tab.active`, `#pn-settings.has-badge` | achtergrond, rand, schaduw, tabkleur, ring | **omzetten** |
| Spelbalk | `#game-controls` | achtergrond, rand | **omzetten** |
| Kaarten | `.card` | rand, schaduw (2× overschreven in licht) | **omzetten** |
| Spelerskaarten X01 / oefenspellen | `.x-card`, `.x-card.on`, `.g-prow(.on)` | schaduw, gloed | **omzetten** |
| Spelstatus | `.x-last`, `.x-last.bust`, `.g-miss`, `.g-plus`, `.g-chip`, `.co-lbl`, `.sp-tag` | tekstkleur, achtergrond, rand | **omzetten** (deels bestaande tokens: `--hit-text`, `--danger-text`, `--hit-soft`) |
| Winst-/toernooilabels | `.win-kicker…`, `#screen-trn-overview …` | groen label (`!important`) | **omzetten** |
| Instellingen-schakelaar | `.ios-toggle` (donker) | kleur | **omzetten** |
| Setup / toernooi-setup | `#screen-setup`, `#screen-trn-setup` (`--su-*`, `--setup-accent-text`) | 18 variabelen per thema | **laten staan**: dit zijn al tokens (per scherm), geen componentwaarden. Uitzondering met reden in W2. |
| Verborgen spelbalk | `#game-bar` | achtergrond, rand | **laten staan**: staat altijd op `display:none!important`. |
| Dode regels | `.player-card(.active)`, `.numpad .btn` | schaduw | **laten staan**: komen nergens in HTML of JS voor. Bewijs per selector in stap 1. Opruimen = schoonmaak, geen voorbereiding. |

In totaal gaat het om ±52 declaraties aan de lichte kant. Daarvan zijn 18 setup-variabelen (blijven), 4 horen bij verborgen of dode selectors (blijven) en een paar zijn al overschreven. **Er worden ±25–30 declaraties omgezet.**

Twee bekende lekken zitten in de dode of verborgen regels:
- `.player-card.active` staat in een media-query zonder `:root:not([data-theme="dark"])`;
- `#game-bar` heeft licht-automatisch ≠ licht-gekozen (`:not([data-force])`).

Geen van beide is zichtbaar. Ze komen op de uitzonderingenlijst, zodat ze niet stil verdwijnen.

---

## 3. Werkzaamheden en waarom

### W1. Themaregels van componenten → tokens (I3)

**Wat.**
- Voor elke declaratie uit §2 met status "omzetten":
  - de basisregel van de component krijgt `var(--token)`;
  - de donkere waarde wordt de standaardwaarde van dat token;
  - de lichte waarde komt in **beide** lichte overrides in het tokenblok (`:root[data-theme="light"]` en de media-query met `:root:not([data-theme="dark"])`);
  - de afwijkende waarde voor donker-gekozen (I1) komt in `[data-theme="dark"]`.
- Daarna verdwijnt de componentregel uit de media-query en uit `[data-theme]`.
- Een bestaand token met precies dezelfde waarden in alle vier de themastanden wordt hergebruikt.
- Is dat er niet, dan komt er een nieuw component-token, bijvoorbeeld `--nav-bg` of `--controls-bg`. Schatting: 10–15. De reden per token gaat vóór invoering in `design/TOKENS-4C1.md` (zelfde regel als in 4C-2). De waarden bestaan al in `faf50f0`, dus `tokens.mjs` ("geen nieuwe waarden") blijft geldig.
- Werkwijze zoals in 4C-2:
  - een script met logboek;
  - een structuurcontrole die per themastand de berekende waarde vergelijkt;
  - per componentgroep één commit met een snelle vergelijking;
  - drie groepen: navigatie en spelbalk, kaarten en spelstatus, pagina-achtergrond en labels.

**Waarom nodig vóór 4D.**
- **K1, K2, K4, K7 en C1–C3** veranderen allemaal kleuren die per thema verschillen. Na W1 is zo'n wijziging één regel in het tokenblok per themastand. Zonder W1 zijn het drie regels verspreid door 143 KB CSS, met de kans dat één van de drie vergeten wordt.
- **Het verschilrapport per 4D-punt** wordt alleen leesbaar als het omzetten en de zichtbare wijziging niet in dezelfde commit zitten.

**Risico.** Specificiteit.
- De oude lichte regel (`:root:not(…) .x`) is specifieker dan de basisregel `.x`. Zet een andere regel met tussenliggende specificiteit dezelfde eigenschap, dan won eerst de lichte regel en straks die andere regel.
- De structuurcontrole en de volledige vergelijking (ook *automatisch* en de kruiscombinaties) vangen dit.
- Waar het speelt, blijft de specificiteit gelijk: de basisregel houdt dan dezelfde selector. Er komt geen extra `!important` bij.

### W2. Test: geen nieuwe themaregels in componenten

**Wat.**
- Een statische test in `tests/core/`, bijvoorbeeld `theme-rules.mjs`.
- Hij faalt op elke regel binnen `@media (prefers-color-scheme…)` of met `[data-theme…]` waarvan de selector meer is dan `:root`, behalve wat met reden op een lijst staat: setup-variabelen, `#game-bar` en de dode selectors.
- Daarnaast een mutatie in `tests/mutation.mjs`: een nieuwe themaregel voor een component moet gevangen worden. Totaal 21 mutaties.

**Waarom.** W1 lost het patroon van v226 eenmalig op; zonder bewaking kan 4D het opnieuw invoeren. De test kost geen app-code.

### W3. Tikvlakken in het Engels (alleen meten, nieuwe nulmeting)

**Wat.**
- De tikvlaktests (320/360/375/390) ook in het Engels draaien.
- De uitkomst wordt een aparte nulmeting (`tap.known.json`, sleutel per taal). Die leg ik je ter goedkeuring voor; nulmeting ≠ goedkeuring.
- Licht thema niet als aparte nulmeting: één controle dat de tikvlakken in licht en donker exact gelijk zijn. Kleuren veranderen geen maten.
- Zijn ze toch ongelijk, dan meld ik dat. Ik maak daar dan niet zelf een nulmeting van.

**Waarom.**
- 4D past chips en de indeling van spelbalk en numpad aan (M5, tikvlakken).
- Engelse labels zijn vaak langer ("Leaderboard", "Statistics").
- Zonder Engelse nulmeting kan 4D niet aantonen dat een chipwijziging in het Engels geen nieuwe overlap geeft.
- Dit is de enige meetgrens van 4C-0 die 4D direct raakt.
- Kan eruit (B3). Dan wordt het in 4D per punt handmatig nagelopen.

### Werkregel voor 4D in plaats van fase 4X

Inline stijlen in HTML en JS-strings (814 `style="…"`, 132 hardgecodeerde kleuren) gaan alleen naar klassen of tokens **binnen het 4D-punt dat die functie toch al aanpast**, met hetzelfde bewijs als in 4D. Een aparte technische fase is niet nodig: de tokens bestaan al, en een inline stijl kan direct `var(--…)` gebruiken. Zo blijven er na 4C-3 geen technische fases over.

---

## 4. Wat nadrukkelijk niet in 4C-3 thuishoort

| Niet in 4C-3 | Waarom | Waar dan |
|---|---|---|
| Het verschil donker-automatisch ↔ donker-gekozen weghalen (I1) | zichtbaar | 4D, K1 |
| Grijsfamilies gelijktrekken, ook `--su-*` (I4) | zichtbaar | 4D, K2 |
| Gesegmenteerde knoppen (I8) en chips (I9) samenvoegen | zichtbaar en componentmigratie | 4D |
| Afronden op de schaal (13 → 14 px enz.), gewicht 600/800/900 → bold | niet exact dezelfde waarde | 4D |
| `:focus-visible` (I12), z-index-volgorde (I11) | zichtbaar of gedragsverandering | 4D |
| Contrast C1–C8, K3–K7, H1–H3, M1–M5, tablet K6 | zichtbaar | 4D, per punt |
| Dode CSS opruimen (`.player-card`, `.numpad`, overschreven lichte blokken I2) | schoonmaak, niet nodig voor 4D | eventueel in 4D bij het punt dat die selector raakt, anders laten |
| Inline HTML- en JS-stijlen | zie de werkregel in §3 | 4D, alleen waar al aangeraakt |
| Nieuwe componentlaag, CSS-bestanden splitsen, andere naamgeving | onnodige abstractie, strijdig met "één bestand" | nergens |
| Visuele opnames van ingedrukt/uitgeschakeld/focus | `:focus-visible` is nieuw en heeft geen nulmeting nodig; de indrukkleuren lopen al via tokens (`--accent-press`, `--k-*`) | niet nodig |
| Safari-tests | kan in deze omgeving niet | 4D, verplicht handmatig op een iPhone |

---

## 5. Tests en controles die de fase afsluiten

Per commit:
- de structuurcontrole (W1) zonder fouten;
- een snelle vergelijking 292/292 gelijk.

Aan het eind:
1. **Volledige visuele vergelijking met `faf50f0`: 1253/1253 identiek.** Dit geldt voor alle themastanden, inclusief *automatisch*, tablet en 360.
2. **De kruiscombinaties** (app donker + systeem licht, app licht + systeem donker) zitten al in de matrix als thema *automatisch* tegenover gekozen. Ze moeten gelijk blijven.
3. **`npm test` volledig groen.** Dat omvat contrast, tikvlakken (en de Engelse tikvlakken als W3 doorgaat), dekking, tokens, tokens-ratchet en html-sinks.
4. **`node tests/mutation.mjs --visual`: alle mutaties gevangen** (21/21 met W2).
5. **`tokens-ratchet.json` staat op de nieuwe telling** (B2). De mutatie "nieuwe hardgecodeerde kleur" wordt aantoonbaar gevangen.
6. **Gebruik van tokens:** elk nieuw token wordt gebruikt en geeft in alle 4 themastanden dezelfde berekende waarde als de bron in `faf50f0` (`tokens.mjs`).
7. **Ongewijzigd gebleven:**
   - `APP_VERSION` = 252;
   - `main` = `4785a1f`;
   - buiten `<style>` is `index.html` byte-gelijk;
   - `faf50f0` en de bestaande nulmetingen zijn ongewijzigd.

---

## 6. Wanneer de technische voorbereiding objectief compleet is

4C-3 is af als alle punten hieronder met een test of telling zijn aangetoond:

1. **0 componentregels per thema.** Elke regel binnen `prefers-color-scheme` of `[data-theme]` heeft `:root` als selector of staat met reden op de W2-lijst. De W2-test bewijst dit.
2. **Elke themawaarde van een component komt uit het tokenblok**, met identieke waarden in beide lichte overrides. Dit volgt uit `tokens.mjs` en de W2-lijst.
3. **Geen enkele zichtbare verandering**: de criteria van §5.1–5.7 zijn gehaald.
4. **Elk 4D-punt heeft één aanwijsbare plek om te wijzigen en een test om het te meten:**

| 4D-punt | Plek na 4C-3 | Meten met |
|---|---|---|
| K1 donkere kaarten | `[data-theme="dark"]`-tokens (`--card`, `--surface`) | compare (gekozen vs automatisch), contrast |
| K2 warm grijs | tokens + `--su-*` (twee themablokken) | compare, contrast |
| K3 amber | nieuw `--warning`-token (C4) | contrast |
| K4 status groen/rood | statustokens (`--hit*`, `--danger*`) + `showToast` (JS, volgens de werkregel) | compare, contrast, ratchet |
| K5 bordkleuren | JS-constanten (X1–X10, bewust buiten tokens) | compare, contrast C6 |
| K7 / C1 doelgetal | `--accent-text` in donker | contrast C1 |
| C2/C3 muted/accent op licht | lichte tokenoverrides | contrast |
| Afronden op de schaal, min. 11 px | maattokens + inline stijlen (werkregel) | compare, tikvlakken |
| Chips ≥ 40/44 (M5) | chipregels | tikvlakken NL (+ EN met W3) |
| Spelbalk/numpad (H2, H3, M3) | indeling `#game-controls` / numpad | tikvlakken, `ui.mjs` |
| `:focus-visible`, z-index | `--z-*`-tokens, nieuwe regel | coverage, handmatig toetsenbord |
| H1, M1, M2 kantine | `@media (orientation:landscape)`-regels | compare 1280/1920 |
| K6 tablet | breakpoint-regels | compare 768/1024 |

Staat er in deze tabel een punt waarvoor eerst nog iets technisch voorbereid moet worden, dan is 4C-3 niet af. Volgens deze meting is dat na W1–W3 voor geen enkel punt het geval.

---

## 7. Omvang

- ±25–30 declaraties in 3 commits (W1), 1 testbestand (W2) en 1 testuitbreiding (W3).
- Daarna de afsluitende ronde van ongeveer een uur: `npm test` 7 min, mutaties ±15 min, volledige compare ±37 min.
- Aanpak:
  - W1 op `feat/fase4c-3`, vanaf `feat/fase4c-2`;
  - geen push naar `main`;
  - stoppen bij een onverwacht pixelverschil (niet "repareren" door waarden aan te passen);
  - stoppen bij een nulmeting die gewijzigd moet worden.
