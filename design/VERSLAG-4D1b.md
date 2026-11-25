# 4D-1b: invoer en gamebalk (X01)

- **Basis:** `feat/fase4d` @ `5b69b0e`. Uitgevoerd volgens het goedgekeurde definitieve ontwerp (B1–B6, V1, V3; akkoord Tom 24-11).
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

### Bijvangst: ronde bij Ongedaan
Het bestaande `undoThrow` zet de ronde niet terug als de beurt al bij de eerste speler was teruggekomen (de controle staat ná het terugzetten van de speler). Met Ongedaan "binnen de beurtwissel" en daarna zou de rondeteller in de kop dan één te hoog staan. Opgelost in `x01Undo` zelf; `undoThrow` is niet aangeraakt. Valt binnen onderdeel 2 (anders klopt Ongedaan niet exact).

### Eliminatie (gevonden en hersteld tijdens deze stap)
Eliminatie bouwt in JS dezelfde klassen (`.np-disp`, `.x01-input`, `.x01-pad`). De eerste versie veranderde daardoor ook de Eliminatie-invoer. De oude regels staan weer ongewijzigd; alle nieuwe regels gelden alleen binnen `#screen-game`. Visueel bewezen: Eliminatie 29/29 opnames gelijk aan `5b69b0e`, X01 pixel-gelijk aan de versie vóór dit herstel.

## Ongedaan tijdens een botbeurt: onderzoek

**Technisch: betrouwbaar.** Elke uitgestelde stap in X01 (beurtwissel na 400/900 ms, start van de botbeurt, de botworp na 900 ms, de beurtwissel daarna) loopt via `_x01Later`. Ongedaan, Stop en hervatten verhogen de generatieteller; een stap van een oudere generatie doet niets meer. Er blijft dus geen botworp "hangen" die na Ongedaan alsnog op de verkeerde speler landt. Getest met tijden en met een mutatie (generatiebewaking weg → test zakt).

**Gedrag zoals gebouwd (letterlijk volgens de afspraak "één stap terug, de laatst ingediende score"):**
- (a) Ongedaan terwijl de bot nog moet gooien (± 0,4–1,7 s na jouw worp): jouw score gaat terug, de botworp vervalt, jij bent weer aan de beurt.
- (b) Ongedaan nadat de bot gegooid heeft: de **botscore** gaat terug en de bot gooit **opnieuw** (nieuwe willekeurige score). Jouw eigen score is dan al definitief.

**Dit moet jij bevestigen.** Gevolgen die je misschien niet wilt:
1. In een botpotje is jouw eigen score ± 1,7 s na indienen al definitief (zodra de bot gooit). Daarna kun je een tikfout niet meer herstellen.
2. Ongedaan na de botworp is in feite "bot opnieuw laten gooien": een slechte botbeurt kun je wegklikken.

Mogelijkheden (ik heb niets daarvan gebouwd, het is jouw keuze):
- **A. Zo laten** (huidige stand).
- **B. Botscores niet ongedaan maken:** na de botworp is Ongedaan uit. Eenvoudig, maar punt 1 blijft.
- **C. Ongedaan na de botworp zet jouw laatste beurt terug** (botscore en jouw score in één keer, jij bent weer aan de beurt). Herstelt punt 1 en 2, maar is strikt genomen twee scores terug; wijkt af van V3.
- **D. Bot wacht** tot jouw terugmelding "vast" is (bijv. 2–3 s pauze vóór de botworp). Geen nieuwe regel, wel trager spel.

## Tests

| Controle | Resultaat |
|---|---|
| syntaxcheck (`node --check` alle inline scripts) | 0 fouten |
| `npm test` | **153/153** in 35 suites (was 141/34; nieuw: `x01-invoer` 12 gevallen) |
| `tests/core/x01-invoer.mjs` (nieuw) | Snelle dubbele invoer op **80/250/380/450 ms** (snelscore en toetsenbord): nooit bij de verkeerde speler. Ongedaan herstelt de stand **exact** (scores, speler, beurten, geschiedenis, legs, ronde) bij snelscore, getypt (3 spelers), bust te hoog, bust op 1, double-Nee, teams, binnen 400 ms. Eén stap terug; nieuwe score maakt de vorige definitief. Terugmelding blijft staan terwijl de volgende intikt; bust; nieuwe leg. Bot (a) en (b) + geen invoer tijdens de botbeurt. Uit en double-Terug: niets opgeslagen tot Ja/Nee; Uit niet bij 181, tijdens intikken of botbeurt. Blokkade weg na Stop en hervatten. Geen gamebalk in X01 (wel in ATC), Stats/Stop in de kop, Stop onderscheidbaar, kantine-plaats en -maten. **Indeling NL en EN** op 360×640, 375×667, 375×812, 390×844, 430×932 en 768×1024 met 2/3/4/6 spelers: geen toets buiten beeld of onder iets, niet scrollen, kop en terugmelding niet afgekapt, toetsen ≥ 44 px. Draait altijd op echte tijden (`fast: 1`), ook onder `npm test` (FAST=10). |
| `tests/mutation.mjs` | 5 nieuwe mutaties, alle 5 **gevangen**: blokkade uit, generatiebewaking weg, Ongedaan meer dan één stap, double-Terug doet niets, Uit zonder checkout. **Volledige run `--visual`: 33/33 + visuele mutatie gevangen (34/34), GESLAAGD.** |
| Visueel t.o.v. `5b69b0e` (1253 opnames) | zie "Visuele verschillen" |
| Visueel t.o.v. nulmeting `faf50f0` | zie "Visuele verschillen" |

### Aangepaste bestaande tests (geen allowlist of ratchet)
- `tests/core/ui.mjs`: eiste dat de zwevende spelbalk in elk spel zichtbaar is. Voor X01 (`screen-game`) eist hij nu het omgekeerde (balk weg) **plus** Stats en Stop in de kop (B1). Andere spellen ongewijzigd.
- `tests/core/x01.mjs` en `tests/visual/scenarios.mjs` (`x01-dubbel-kiezen`): klikten "de laatste knop" van de double-vraag als Ja. Dat is nu Terug. Ze klikken nu `#dbl-yn-overlay .btn-primary` (= Ja, in de oude én nieuwe code hetzelfde element), dus de referentie-opnames blijven vergelijkbaar.

## Visuele verschillen

**T.o.v. `5b69b0e`:** 1086/1253 gelijk, **167 anders**, uitsluitend in de X01-scenario's die al in `tests/visual/expect/4D-1a.json` staan: `x01-2sp` 29, `x01-4sp` 29, `x01-teams` 20, `x01-double-vraag` 20, `x01-dubbel-kiezen` 20, `x01-stats-blad` 20, `bevestig-stop` 29 (achtergrond). **Geen enkel ander scenario anders** (Eliminatie, alle andere spellen, schermen en toestanden gelijk). Verslag: `design/4d-log/scope-4d1b-vs-5b69b0e.json`.

**T.o.v. de nulmeting `faf50f0`:** hetzelfde beeld: 1086/1253 gelijk, 167 anders, dezelfde 7 scenario's (4D-1a + 4D-1b samen). Verslag: `design/4d-log/scope-4d1b-vs-faf50f0.json`.

**`bevestig-stop`, pixels binnen het venster:** de controle van 4D-1a (`design/scope_4d1a.mjs`) meldt (t.o.v. beide referenties) in 15 van de 29 opnames 5–58 px "binnen het venster". Nagekeken in de verschilbeelden: **alle** gemarkeerde pixels liggen in de vier hoekvakken van 20×20 px, dus buiten de afgeronde hoek (`--r-3xl` = 20 px) van het venster. Dat is achtergrond: daar zit nu de terugmeldingsregel/invoer in plaats van de spelbalk. Het venster zelf: 0 px verschil. De controle meet de rechthoek, niet de afgeronde vorm; in 4D-1a viel dat niet op omdat de achtergrond achter die hoeken toen niet veranderde. Ik heb de controle en `tests/visual/expect/4D-1a.json` **niet** aangepast.

Vellen (huidig ↔ 4D-1b) zitten in de zip, niet in de repo (geen PNG's in de repo): map `vellen/` (telefoon per toestand op 375 SE, 360 Android, 390, 430 in NL/EN, licht/donker/automatisch; tablet; kantine 1920 en 1280).

## Openstaand / voor jou

1. **Bot-Ongedaan bevestigen** (A/B/C/D hierboven).
2. **Echte iPhone (Safari-PWA), handmatig:**
   - Snel twee keer tikken op een snelscore of op ✓ ("dubbel indienen"): de tweede tik moet niets doen.
   - Kop op de iPhone SE: "Beurt" + Stats + Stop naast een lange spelinfo, niets afgekapt?
   - Ongedaan en Uit goed raakbaar met de duim; Stop niet per ongeluk (het venster vangt het op).
   - Kantinescherm (Evolve): leesbaarheid van terugmelding en invoerregel vanaf de oche.
   - WebKit kon hier niet gedownload worden; alles hierboven is Chromium.
3. **Bestaand, niet opgelost (buiten scope):** het rondeprobleem in `undoThrow` zelf (alleen omzeild in `x01Undo`); de ronde in andere spellen heb ik niet bekeken. "… wint de leg!" blijft een melding.
4. **Engelse aria-labels:** Stats/Stop/Ongedaan hebben een Nederlands `aria-label` (zoals de rest van de app); de zichtbare tekst wordt wel vertaald.
