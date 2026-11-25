# 4D-1b: invoer en gamebalk (X01)

- **Basis:** `feat/fase4d` @ `5b69b0e`; eerste oplevering `131a4cf`, aanpassing bot-Ongedaan (B + D) 25-11. Uitgevoerd volgens het goedgekeurde definitieve ontwerp (B1–B6, V1, V3; akkoord Tom 24-11).
- **Niet gewijzigd:** spelregels, scoreberekening, checkoutlogica (`getCheckout`, `isImpossible`, bust-regels), opslag (`updatePlayerStat`, `darts_db`), Firebase, sync, `main`, `APP_VERSION`, `faf50f0`, allowlists en ratchets.
- **Alleen X01** (B2). Andere spellen houden de zwevende spelbalk en hun eigen invoer.

## Wat er veranderd is (`index.html`)

| # | Onderdeel | Uitvoering |
|---|---|---|
| 1 | Terugmeldingsregel | Nieuwe regel `#x01-fb` boven de invoerregel: "TOM 60 → 441", bij bust "BUST · blijft op 141", na Ongedaan "Teruggezet: Tom 60", aan het begin van een leg "Nog geen worp deze leg" (gestippeld). Blijft staan tot de volgende score wordt ingediend (B6), ook terwijl de volgende speler intikt. Ingevoerde score en nieuwe rest staan groot (Flow, 26–36 px; kantine 40–60 px). |
| 2 | Ongedaan, één stap | Knop links in de terugmeldingsregel (`x01Undo`). Gebruikt de bestaande `undoThrow`. Daarna is de knop uit tot er een nieuwe score is (V3). Na een nieuwe score is de vorige definitief. Een gewonnen leg gaat niet terug: aan het begin van de nieuwe leg is er niets terug te zetten (`undoThrow` had daar ook niets meer). |
| 3 | Invoerblokkade | `_x01Locked()`: vanaf indienen tot de beurtwissel klaar is, tijdens de botbeurt en zolang de double-vraag open staat. Geldt voor snelscores, numpad, toetsenbord/Enter en Uit (V1). Opgeheven bij voltooide beurtwissel, Ongedaan, Stop en hervatten (`_x01Reset`). Uitgestelde stappen (beurtwissel, bot) lopen via `_x01Later` met een generatieteller: na Ongedaan/Stop/hervatten vervallen ze. |
| 4 | Snelscores | Eén tik = indienen (B3, was al zo). Groter en vetter (15 px, gewicht 800, hoogte 40–48 px), geen inline stijlen meer; 0 en 180 niet meer afwijkend gekleurd. |
| 5 | Knop Uit | In de invoerregel als de invoer leeg is en de rest een checkout heeft (`getCheckout`): "Uit 121". Vult de rest in en gaat door de bestaande uitgooiflow (double-vraag bij double out). Niet tijdens intikken, de beurtwissel of de botbeurt. |
| 6 | Double-vraag: Terug | Onder Nee/Ja: "Terug, score aanpassen" (`x01DoubleBack`). Sluit de vraag, zet de score terug in de invoer; er is niets opgeslagen of geteld. |
| 7 | Stats en Stop in de kop | Twee knoppen (40×40, tikvlak 44) rechts naast "Beurt". Stop is rood (`--danger-soft`/`--miss-border`/`--danger-text`) en houdt het bevestigvenster. De zwevende spelbalk is in X01 weg (`showScreen`); de ruimte gaat naar de toetsen. |
| 8 | Kantine | ≥ 1000 px liggend: Stats/Stop boven de invoerkolom (`#x01-side`). ≥ 1600 px: terugmelding en invoerregel 64–96 px hoog, score/rest 40–60 px, kleine teksten 15–22 px, knoppen 52 px. |

Teksten in het Engels: "No throw this leg yet", "left", "stays on", "Invalid", "Back, change score", "Out 121", "Undone: Tom 60", "Tom throwing…".

### Weggehaald
Meldingen (toasts) die nu in de terugmeldingsregel staan: "Ongeldige score (0–180)", "Bust! Score te hoog", "Bust! Kan niet op 1 eindigen met double out", "Bust! Geen double", "🤖 Bot gooit…", "🤖 Bot: Bust!", "🤖 Bot gooit X → restant". **Blijven:** "Bot gooit X — uitgegooid!" en "… wint de leg!".

### Bijvangst: ronde bij Ongedaan (aanvullend gecontroleerd 25-11)
Het bestaande `undoThrow` zet de ronde niet terug als de beurt al bij de eerste speler was teruggekomen (de controle staat ná het terugzetten van de speler). Opgelost in `x01Undo`, niet in `undoThrow`:
- **`undoThrow` is byte-voor-byte gelijk aan `5b69b0e`** (`diff` van de functie: leeg). Score, beurten (`dartCount`/`allDartCount`), `history`/`allHistory`, legs en de speler zet hij terug zoals altijd; `x01Undo` zet daarna alleen `state.round` op de juiste waarde.
- **Geen neveneffect op andere spellen:** `undoThrow` en `x01Undo` worden alleen in X01 gebruikt (`gameBarUndo` roept `undoThrow` alleen aan op `screen-game`; ATC, Cricket, Shanghai, Halve It, Bob's 27, 121, Eliminatie, Random Checkout en Afgooien hebben elk hun eigen Ongedaan-functie, die niet gewijzigd zijn). Hun bestaande tests in `npm test` zijn groen; visueel zijn alle andere spellen gelijk.
- **Getest (exacte stand: scores, speler, beurten, geschiedenis, legs, ronde én het rondegetal in de kop):** snelscore met rondewissel, getypt (3 spelers), bust te hoog, bust op 1, double-Nee, teams, binnen 400 ms, **solo** (elke beurt een ronde), **ronde 3 laatste speler** (wissel naar ronde 4 en terug) en **ronde 3 eerste speler** (geen rondewissel). Mutatie "ronde niet terugzetten" wordt gevangen.

### Eliminatie (gevonden en hersteld tijdens deze stap)
Eliminatie bouwt in JS dezelfde klassen (`.np-disp`, `.x01-input`, `.x01-pad`). De eerste versie veranderde daardoor ook de Eliminatie-invoer. De oude regels staan weer ongewijzigd; alle nieuwe regels gelden alleen binnen `#screen-game`. Visueel bewezen: Eliminatie 29/29 opnames gelijk aan `5b69b0e`, X01 pixel-gelijk aan de versie vóór dit herstel.

## Ongedaan in een botpotje (besluit Tom 25-11: B + D)

**Werking:**
1. Na het indienen van een score door een mens wacht de bot **2,5 s** (gerekend vanaf het indienen, ook na een bust of double-Nee) voordat hij begint te gooien (`X01_BOT_WAIT`). Daarna de bestaande botworp (0,9 s) en beurtwissel (1,2 s).
2. In die 2,5 s mag de speler zijn eigen score terugzetten. De knop Ongedaan heeft dan een **terracotta rand en een balk die in 2,5 s leegloopt** (`.x01-undo.is-win`); in de invoerregel staat "Bot wacht…" ("Bot waiting…"). Bij *minder beweging* (systeeminstelling) staat de balk stil.
3. Zodra de bot begint ("Bot gooit…") is het venster dicht: Ongedaan is uit, ook in de 0,9 s dat de bot "gooit".
4. Een ingediende botscore (ook een botbust) is **nooit** ongedaan te maken: Ongedaan is uit en de terugmelding toont "definitief" ("final"). Ongedaan kan de bot dus nooit opnieuw laten gooien.
5. Buiten botpotjes (en mens → mens in een potje met bot) niets veranderd: de score blijft terug te zetten tot de volgende score (B6), zonder balk.

**Code:** `_x01Sub()` (tijdstip van indienen, in de vier indienpaden), `_x01CanUndo()` (de regels hierboven, ook gebruikt door de knop), `_x01InWindow()` (balk), `_x01BotOn` (bot is begonnen), wachttijd in `nextPlayer501`. `x01Undo` laat de bot niet meer opnieuw gooien (de oude regel staat er alleen nog als vangnet en kan niet meer bereikt worden).

**Randgevallen (getest):**
- **Stop** tijdens de wachttijd: de geplande botbeurt vervalt (generatieteller), venster dicht, het spel komt niet terug.
- **Hervatten** tijdens de wachttijd: de bot gooit direct verder (zoals voorheen); de oude score kan na hervatten niet meer terug (het venster is vervallen; anders zou een herstart het venster oneindig verlengen).
- **Ongedaan binnen het venster en opnieuw indienen:** nieuw venster van 2,5 s vanaf de nieuwe score; precies één score van jou en één van de bot.
- **Nieuwe leg** die met de bot begint: geen extra wachttijd (bot begint na ±1,8 s zoals voorheen, er is niets terug te zetten).
- **Snelle dubbele invoer** in een botpotje (80/250/380/450 ms): alleen de eerste score telt.

**Let op (toegankelijkheid):** 2,5 s is kort voor wie trager reageert of een schermlezer gebruikt (WCAG 2.2.1 vraagt bij tijdslimieten om verlengen of uitzetten). Jouw keuze; ik heb het niet instelbaar gemaakt.

## Tests

| Controle | Resultaat |
|---|---|
| syntaxcheck (`node --check` alle inline scripts) | 0 fouten |
| `npm test` | **155/155** in 35 suites, 758 s (was 141/34 vóór 4D-1b; nieuw: `x01-invoer` 14 gevallen) |
| `tests/core/x01-invoer.mjs` (nieuw) | Snelle dubbele invoer op **80/250/380/450 ms** (snelscore en toetsenbord): nooit bij de verkeerde speler. Ongedaan herstelt de stand **exact** (scores, speler, beurten, geschiedenis, legs, ronde) bij snelscore, getypt (3 spelers), bust te hoog, bust op 1, double-Nee, teams, binnen 400 ms. Eén stap terug; nieuwe score maakt de vorige definitief. Terugmelding blijft staan terwijl de volgende intikt; bust; nieuwe leg. Bot (25-11): wachttijd 2,5 s na indienen en na een bust (gemeten 2450–2900 ms), Ongedaan met balk tijdens het wachten (ook op 2,2 s), geen invoer tijdens het wachten, venster dicht zodra de bot gooit, botscore en botbust nooit ongedaan (geen nieuwe worp), Stop/hervatten/Ongedaan + opnieuw/nieuwe leg/snelle dubbele invoer in een botpotje, mens na mens zonder wachttijd. Uit en double-Terug: niets opgeslagen tot Ja/Nee; Uit niet bij 181, tijdens intikken of botbeurt. Blokkade weg na Stop en hervatten. Geen gamebalk in X01 (wel in ATC), Stats/Stop in de kop, Stop onderscheidbaar, kantine-plaats en -maten. **Indeling NL en EN** op 360×640, 375×667, 375×812, 390×844, 430×932 en 768×1024 met 2/3/4/6 spelers: geen toets buiten beeld of onder iets, niet scrollen, kop en terugmelding niet afgekapt, toetsen ≥ 44 px. Draait altijd op echte tijden (`fast: 1`), ook onder `npm test` (FAST=10). |
| `tests/mutation.mjs --visual` | **40/40 gevangen, GESLAAGD.** 11 voor 4D-1b: blokkade uit, generatiebewaking weg, Ongedaan meer dan één stap, ronde niet terugzetten, botscore toch ongedaan, geen wachttijd, venster open terwijl de bot gooit, oude score na hervatten nog terug, geen balk, double-Terug doet niets, Uit zonder checkout. |
| `design/verify_4d1b_stop.mjs` (nieuw) | Stop-venster 64/64 identiek t.o.v. `5b69b0e` en `faf50f0` (zie Visuele verschillen) |
| Visueel t.o.v. `5b69b0e` (1253 opnames) | zie "Visuele verschillen" |
| Visueel t.o.v. nulmeting `faf50f0` | zie "Visuele verschillen" |

### Aangepaste bestaande tests (geen allowlist of ratchet)
- `tests/core/ui.mjs`: eiste dat de zwevende spelbalk in elk spel zichtbaar is. Voor X01 (`screen-game`) eist hij nu het omgekeerde (balk weg) **plus** Stats en Stop in de kop (B1). Andere spellen ongewijzigd.
- `tests/core/x01.mjs` en `tests/visual/scenarios.mjs` (`x01-dubbel-kiezen`): klikten "de laatste knop" van de double-vraag als Ja. Dat is nu Terug. Ze klikken nu `#dbl-yn-overlay .btn-primary` (= Ja, in de oude én nieuwe code hetzelfde element), dus de referentie-opnames blijven vergelijkbaar.

## Visuele verschillen

**T.o.v. `5b69b0e`** (opnieuw gedraaid na de botwijziging): 1086/1253 gelijk, **167 anders**, uitsluitend in de X01-scenario's die al in `tests/visual/expect/4D-1a.json` staan: `x01-2sp` 29, `x01-4sp` 29, `x01-teams` 20, `x01-double-vraag` 20, `x01-dubbel-kiezen` 20, `x01-stats-blad` 20, `bevestig-stop` 29 (achtergrond). **Geen enkel ander scenario anders** (Eliminatie, alle andere spellen, schermen en toestanden gelijk). Verslag: `design/4d-log/scope-4d1b-vs-5b69b0e.json`. De botwijziging verandert geen enkele vaste opname: alle 1253 opnames zijn pixel-gelijk aan die van `131a4cf` (de wachtstand met balk en "definitief" zit niet in de vaste scenario's; zie vel `bot-venster.png` in de zip en de tests).

**T.o.v. de nulmeting `faf50f0`:** hetzelfde beeld: 1086/1253 gelijk, 167 anders, dezelfde 7 scenario's (4D-1a + 4D-1b samen). Verslag: `design/4d-log/scope-4d1b-vs-faf50f0.json`.

**`bevestig-stop`, pixels binnen het venster (aanvullende controle, `design/verify_4d1b_stop.mjs`):** de scopecontrole van 4D-1a meldt in 15 van de 29 opnames 5–58 px "binnen het venster" (rood). Het nieuwe script vergelijkt oud en nieuw in **64 combinaties** (360×640, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1920×1080 × donker, licht, automatisch-donker, automatisch-licht × NL/EN), t.o.v. `5b69b0e` én `faf50f0`:

| Controle | Uitslag |
|---|---|
| A. DOM van het venster en alle kinderen + **elke** berekende CSS-eigenschap + maten | 64/64 gelijk. (T.o.v. `faf50f0` verschillen alleen de overgeërfde CSS-variabelen: de tokens van 4C-1. Alle echte eigenschappen gelijk.) |
| B. Venster gefotografeerd met het spelscherm erachter verborgen | **64/64 pixel-identiek** (exact, geen drempel) |
| C. Normale opname: verschillende pixels binnen de afgeronde vorm | App-donker (venster ondoorzichtig `rgb(28,28,30)`): 16–46 px, **allemaal op de rand** (1px-rand en anti-aliasing van de hoek), 0 in de kern. Licht en automatisch: het venster is **half doorzichtig** (`rgba(255,255,255,.92)` resp. `rgba(28,28,30,.72)`, zo was het al), dus de veranderde invoer erachter schijnt er zwak doorheen: tot 14.7k (licht) en 42.7k (auto-donker) pixels met kleine kleurverschillen, max. Δ 103–118 op 765. Pixelmatch (drempel 0,1, gebruikt door de visuele test) ziet die doorschijning niet; daarom meldde de scopecontrole alleen de hoeken. |

**Conclusie:** het venster zelf is ongewijzigd (A + B). Mijn eerdere zin "het venster zelf: 0 px verschil" klopte alleen op pixelmatch-niveau: in de doorzichtige themastanden verschilt de doorschijnende achtergrond binnen het venster wél een beetje. Dat komt door het bestaande doorzichtige venster, niet door een wijziging aan het venster. De controle en `tests/visual/expect/4D-1a.json` heb ik niet aangepast. Logs: `design/4d-log/stop-venster-4d1b-vs-5b69b0e.json`, `…-vs-faf50f0.json`.

Vellen (huidig ↔ 4D-1b) zitten in de zip, niet in de repo (geen PNG's in de repo): map `vellen/` (telefoon per toestand op 375 SE, 360 Android, 390, 430 in NL/EN, licht/donker/automatisch; tablet; kantine 1920 en 1280).

## Openstaand / voor jou

1. **Wachttijd bot:** 2,5 s voelt op een echte telefoon misschien te kort of te lang; graag zelf proberen. Toegankelijkheid: zie hierboven.
2. **Echte iPhone (Safari-PWA), handmatig:**
   - Snel twee keer tikken op een snelscore of op ✓ ("dubbel indienen"): de tweede tik moet niets doen.
   - Botpotje: is de leeglopende balk op Ongedaan duidelijk genoeg als "je kunt nog terug"?
   - Kop op de iPhone SE: "Beurt" + Stats + Stop naast een lange spelinfo, niets afgekapt?
   - Ongedaan en Uit goed raakbaar met de duim; Stop niet per ongeluk (het venster vangt het op).
   - Kantinescherm (Evolve): leesbaarheid van terugmelding en invoerregel vanaf de oche.
   - WebKit kon hier niet gedownload worden; alles hierboven is Chromium.
3. **Bestaand, niet opgelost (buiten scope):** het rondeprobleem in `undoThrow` zelf (alleen omzeild in `x01Undo`). `undoThrow` wordt verder alleen nog aangeroepen via `gameBarUndo` (verborgen `#game-bar`, en de zwevende balk die in X01 niet meer zichtbaar is) en als vangnet in `_finishUndo` (Potje afronden? → Ongedaan, als er geen snapshot is). Die paden omzeilen de nieuwe regels, maar zijn in X01 niet te bereiken met een botscore. "… wint de leg!" blijft een melding.
4. **Engelse aria-labels:** Stats/Stop/Ongedaan hebben een Nederlands `aria-label` (zoals de rest van de app); de zichtbare tekst wordt wel vertaald.
