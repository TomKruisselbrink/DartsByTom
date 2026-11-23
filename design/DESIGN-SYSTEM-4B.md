# Darts by Tom: ontwerpsysteem (fase 4B, voorstel, herziening 2)

Stand: v252 (`main` = `4785a1f`, visuele referentie `faf50f0`). **Dit is een voorstel. Er is niets aan de app veranderd.**
Skills: Product-Grade App Builder **v2** is in deze sessie **niet** als skill geïnstalleerd. Ik heb het eerder gedeelde SKILL.md-bestand als primaire leidraad voor de uitvoering gebruikt. **v1** is als skill geladen en gebruikt voor de audit en de kwaliteitscontrole.

### Wat er in herziening 2 veranderd is (op Toms punten van 23-11)

| Punt | Wijziging | Waar |
|---|---|---|
| 1. Tablet vs. kantine | Breakpoint-logica onderzocht en gemeten op 768×1024 en 1024×768. Correctie: `#app-content` heeft al `max-width:760px`, dus er "rekt niets uit". 1024×768 krijgt nu de kantine-indeling; dat is **niet** als gewenst vastgesteld en wordt een open vraag (K6). In 4C verandert er niets aan de indeling. | §1.5, §6, §9 |
| 2. Contrastcontrole | Uitgewerkt als geautomatiseerde test (`tests/core/contrast.mjs`) met een vaste parenlijst en een aparte uitzonderingenlijst. De volledige matrix is gemeten. Nieuwe, ernstige uitzondering gevonden: het grote doelgetal in accentkleur haalt maar 2,78 op donker. | §1.4, §4.4, §7.2 |
| 3. Tikvlakken | Gemeten op 320, 360, 375 en 390 breed: hoeveel ruimte elk klein element heeft tot zijn buren. **Chips kunnen veilig naar 44.** Spelbalk, navigatie, snelscores en numpads niet: die krijgen geen onzichtbare zone maar een indelingsoplossing in 4D. | §5.3, §7.3 |
| 4. Kleuren en uitzonderingen | Vier kleurgroepen (interface, spelstatus, team, dartbord) en een uitzonderingslijst van kleuren die bewust buiten de semantische tokens blijven. Regel: geen automatische vervanging als de betekenis of herkenbaarheid van een spel verandert. | §3.1, §3.2a |
| 5. 4C-4 | Inline JS-stijlen verplaatsen is uit de verplichte migratie gehaald en wordt een losse, optionele stap na 4C-3. | §7 |
| K1–K5 | Vastgelegd als Toms voorkeursrichting. Uitvoering blijft 4D met aparte goedkeuring. | §9 |
| Planning | 4C-0 wordt groter (tests), 4C wordt kleiner (geen 4C-4). | §10 |

Inhoud:
1. Wat er nu is (audit)
2. Ontwerprichting
3. Tokens (kleur, typografie, ruimte, hoeken, schaduw, lagen) met herkomst
4. Licht en donker
5. Componenten
6. Responsief: telefoon, tablet, kantinescherm
7. Migratie
8. Risico's en visuele impact
9. Keuzes voor Tom
10. Planning

---

## 1. Audit: wat er nu is

Alle CSS uit `index.html` (112 kB, zonder fonts) en de inline stijlen (817 `style=`-attributen in HTML, ±820 in JS-strings) zijn geteld met een script. Contrast is berekend volgens WCAG 2.1 op de echte achtergronden.

### 1.1 De cijfers

| Onderdeel | Verschillende waarden | Opmerking |
|---|---|---|
| Hex-kleuren | 53 in CSS + 15 inline | `#B94E2A` staat 47× hard in de code, naast 125× `var(--accent)` |
| rgba-kleuren | 157 in CSS + 37 inline | vooral transparante varianten van accent, groen, zwart en wit, met steeds net andere alfa (.12/.14/.15/.16/.18 voor hetzelfde doel) |
| Lettergroottes | 46 in CSS + 39 inline | 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 28, 30, 32, 34, 36, 40, 48, 54, 64, 84 px plus 18 `clamp()`'s |
| Gewichten | 300, 500, 600, 700, 800, 900 (±330 plekken) | Flow Text heeft maar **twee** bestanden: 100–599 = Regular, 600–900 = Bold. 600, 700, 800 en 900 zien er dus **precies hetzelfde** uit; 300 en 500 ook als 400. Het onderscheid in de code is schijn. |
| Hoeken | 23 in CSS + 17 inline | 14 (26×), 12 (19×), 16 (16×), 10, 20, 18, 13, 11, 9, 8, 7, 6, 5, 3, 22, 30, 32, 40 px |
| Padding | 93 combinaties in CSS + 64 inline | |
| Gap | 16 waarden | 8 (39×), 6 (20×), 10 (17×), 4, 12 |
| Schaduwen | 52 verschillend | waarvan 10× `var(--shadow)` |
| z-index | 16 plekken, 11 waarden | 0, 1, 2, 5, 10, 100, 9000, 9970, 9980, 9990, 9997, 9998, 9999, 10050 |
| `!important` | 214 | vooral in de latere "override"-blokken |
| Media queries | 36 | 19× `prefers-color-scheme:light`, breedtes 420/600, hoogtes 700/740/780, liggend ≥1000 |

### 1.2 Er zijn al drie tokensystemen

1. **Algemeen** in `:root`: `--accent`, `--accent2`, `--success`, `--danger`, `--warning`, `--info`, `--radius` (13), `--radius-sm` (10), `--bg`, `--surface`, `--card`, `--text`, `--muted`, `--border`, `--separator`, `--shadow`, `--shadow-lg`, `--header-bg`, `--ff-display`, `--ff-text`.
2. **Setup** (`--su-*`, alleen in `#screen-setup` en `#screen-trn-setup`): eigen tekst- en kaartkleuren in **warm grijs** (`#F3EDE8`, `#A8A09A`), plus 9 wit/zwart-transparanten (`--su-w05` t/m `--su-w4`).
3. **Knopgevoel** (`--k-*`, v208): de 3D-toetsen (`--k-hi`, `--k-top`, `--k-bot`, `--k-edge`, `--k-drop`). Dit is goed en eigen: houden.

Daarnaast nog losse sets: `--seq-*` (Halve It-volgorde), `--setup-accent`.

### 1.3 Gevonden inconsistenties (feitelijk, gemeten)

| # | Wat | Gevolg |
|---|---|---|
| I1 | **Donker "automatisch" ≠ donker "gekozen".** Automatisch: `--card rgba(44,44,46,.75)`, `--surface rgba(28,28,30,.72)` (doorschijnend, verloop schijnt erdoor). Gekozen in de app: `--card #2C2C2E`, `--surface #1C1C1E` (dicht). Ook `--shadow` verschilt. | Wie nooit een thema koos (de meeste gebruikers) ziet iets anders dan wie "Donker" koos. **De 4A-baseline legt alleen "gekozen" vast.** |
| I2 | **CLAUDE.md §10 klopt niet meer voor licht.** Daar staat tekst zwart, muted `#6E6E73`, verloop `#e8b89e → #fff`. In werkelijkheid geldt sinds v217/v241: achtergrond `#F4F1ED`, tekst `#1A1714`, muted `#6B6560`, rand `rgba(60,40,30,.10)`, rode en groene gloed. De oudere lichte blokken zijn dode code (overschreven). | Verwarring bij elke volgende wijziging. |
| I3 | **Elke themaregel staat twee keer** (`@media (prefers-color-scheme:light) :root:not([data-theme=dark]) …` én `[data-theme=light] …`), 19 paren. | Lekken (zie v226) en dubbel onderhoud. |
| I4 | **Twee grijsfamilies**: koel iOS-grijs (`#98989F`, `#8E8E93`, `#636366`, `#3A3A3C`) in spelschermen en instellingen, warm grijs (`#A8A09A`, `#C9BFB8`, `#6B6560`, `#1A1714`) in setup en het lichte thema. | Setup voelt net anders dan de rest. |
| I5 | **Drie soorten groen voor "goed"**: huisgroen `#3E7B4F` (+ `#2F6B40`, `#1E5631`, `#5E9E6E`, `#8FCB9C`), iOS-groen `--success #34C759`, en Tailwind-groen in meldingen (`rgba(34,197,94)`) en dartbadges (`#16a34a`). | |
| I6 | **Drie soorten rood**: `--danger #FF3B30`, miss-tekst licht `#B3261E` / donker `#FF7A6B`/`#FF8A7A`, Tailwind-rood in meldingen en inline (`rgba(239,68,68)`), dartbadge `#cc2222`, Halve It-bord `#D9232D`. | |
| I7 | **`--warning` = accent** (`#B94E2A`), terwijl meldingen oranje `#FF9500` en inline amber `#F59E0B` gebruiken. | Een waarschuwing ziet eruit als "jouw beurt"/"actie". |
| I8 | **Drie gesegmenteerde knoppen**: `.seg-ctrl/.seg-btn` (r 10/8, h ±38), `.g-seg` (r 14/10, h 42), `.segment` (r 14, alles `!important`). | Zelfde bediening, drie looks. |
| I9 | **Vijf soorten chips**: `.chip` (r 20, 13 px), `.lb-chip` (h 40, 14 px), `.known-name-btn` (h 36), `.gc-btn` (h 36), `.g-chip` (h 28, groen). | Tikvlakken onder 40 px (4A-bevinding M5). |
| I10 | **Twee dartbord-paletten**: badges `#cc2222`/`#16a34a`/`#374151`/`#4b5563`, Halve It-bord `#D9232D`/`#1E7E34`. | |
| I11 | **z-index zonder orde**: install-banner en pill-nav allebei 9980; toast 9999 valt **onder** het bevestigvenster (10050); update-banner 9000 onder de nav. | Toast kan achter een venster verdwijnen. |
| I12 | **Geen `:focus-visible`** in de hele app. | Toetsenbordbediening (kantinescherm met toetsenbord, tablet) laat niet zien waar je bent. |
| I13 | **Halve It vult lege hoogte met een dicht zwart vlak.** Gezien op 1280×800, 1920×1080 én 768×1024 staand. De oorzaak is dus niet "liggend" maar "scherm hoger dan de inhoud". | 4A-bevinding H1 is breder dan gedacht. |

### 1.4 Contrast (WCAG 2.1 AA: 4,5 voor gewone tekst, 3,0 voor tekst ≥ 24 px of ≥ 18,7 px vet)

Gemeten per themastand. "Slechtste waarde" = de doorschijnende kaart en de tekst samengesteld over elk punt van het achtergrondverloop (zwart, `#381000`, `#0f2e10`; licht: crème plus de rode en groene gloed), en daarvan de laagste uitkomst.

**Tekst op achtergrond (slechtste waarde): `bg` / `card` / `surface`**

| Tekstkleur | Donker gekozen | Donker automatisch | Licht |
|---|---|---|---|
| tekst | 14,8 / 13,9 / 17,0 | 14,8 / 14,3 / 16,5 | 13,2 / 15,3 / 17,4 |
| muted | 5,16 / 4,86 / 5,94 | 5,16 / 4,99 / 5,76 | **4,25** / 4,93 / 5,61 |
| soft | 8,2 / 7,7 / 9,4 | 8,2 / 7,9 / 9,2 | 6,8 / 7,8 / 8,9 |
| accent-tekst (`#E07A55` / `#A8431F`) | 4,99 / 4,70 / 5,74 | 4,99 / 4,83 / 5,57 | **4,45** / 5,17 / 5,88 |
| hit-tekst (`#8FCB9C` / `#2F6B40`) | 7,9 / 7,4 / 9,1 | 7,9 / 7,6 / 8,8 | 4,71 / 5,46 / 6,21 |
| danger-tekst (`#FF7A6B` / `#B3261E`) | 5,8 / 5,5 / 6,7 | 5,8 / 5,6 / 6,5 | 4,83 / 5,61 / 6,38 |
| warning (K3: `#D08A2E` / `#8A5A12`) | 5,2 / 4,9 / 6,0 | 5,2 / 5,0 / 5,8 | **4,37** / 5,07 / 5,77 |

**Witte tekst op vulkleur**

| Vulkleur | Ratio | Oordeel |
|---|---|---|
| accent `#B94E2A` | 5,02 | AA |
| hit `#3E7B4F` | 5,06 | AA |
| danger `#FF3B30` | 3,55 | alleen groot |
| warning `#D08A2E` (K3) | **2,85** | onvoldoende: warning wordt **geen** vulkleur met witte tekst |
| board-red `#D9232D` / board-green `#1E7E34` (K5) | 4,97 / 5,14 | AA |
| huidige badges `#cc2222` / `#16a34a` | 5,50 / **3,30** | groen alleen groot (badges zijn ≥ 15 px Flow, vet: grens) |
| singles `#374151` / `#4b5563` | 10,3 / 7,6 | AA |
| teamkleuren `#5B6CCF` `#7A5BB5` `#6E7781` / `#2E8B9A` | 4,68 / 5,26 / 4,55 / **3,98** | `#2E8B9A` alleen groot |
| meldingen nu: groen `#22C55E` / oranje `#FF9500` / rood `#EF4444` | **2,28 / 2,20** / 3,76 | onvoldoende (K4 lost dit op) |

**Merkkleur als groot getal (eis 3:1)**

| Combinatie | Ratio | Oordeel |
|---|---|---|
| accent `#B94E2A` als doelgetal ("20", "D16", "1") op donkere kaart | **2,78** (gekozen) / **2,85** (auto) | **onvoldoende, ook voor groot.** Dit is het belangrijkste getal in de oefenspellen. |
| idem op lichte kaart | 4,30 | goed (groot) |
| huisgroen `#3E7B4F` als tekst op donkere kaart | 2,75 | onvoldoende |

**Uitzonderingen (apart gerapporteerd, worden niet automatisch aangepast):**

| # | Combinatie | Ratio | Waar | Voorstel (4D, met akkoord) |
|---|---|---|---|---|
| C1 | accent-vulkleur als groot doelgetal op donker | 2,78 | `.g-target-big`, `#rco-target`, Halve It-doel | in donker `--accent-text` (`#E07A55`, 4,70) voor het getal; vulkleur blijft voor knoppen. Zichtbaar: het getal wordt iets lichter oranje. **Keuze K7.** |
| C2 | muted direct op de lichte achtergrond (gloedhoek) | 4,25 | sectielabels buiten kaarten in licht | muted in licht 1 stap donkerder (`#625C57` ≈ 4,6) **of** labels alleen in kaarten. |
| C3 | accent-tekst direct op lichte achtergrond | 4,45 | links/labels buiten kaarten | idem, `#9F3E1C` ≈ 4,8. |
| C4 | warning-tekst op lichte achtergrond | 4,37 | (nieuw token, nog niet in gebruik) | waarde bij invoering `#80530F`. |
| C5 | wit op danger `#FF3B30` | 3,55 | alleen grote knoppen; kleine teksten gebruiken al `--danger-soft` + `--danger-text` | regel: geen kleine witte tekst op danger. |
| C6 | wit op groene badge `#16a34a` | 3,30 | uitgooi-badges | opgelost door K5 (`#1E7E34`, 5,14). |
| C7 | wit op teamkleur `#2E8B9A` | 3,98 | team-/avatarbadge (alleen letters/cijfers ≥ 13 px vet) | teamkleur niet aanpassen (herkenning); badge-tekst ≥ 18,7 px vet **of** accepteren als uitzondering. Toms keuze. |
| C8 | witte tekst op meldingen groen/oranje | 2,2–2,3 | `showToast` | opgelost door K4. |

### 1.5 Wat goed is en blijft

- **Terracotta als enige accent** met de betekenis "actie / aan de beurt". Herkenbaar en niet generiek.
- **Huisgroen voor raak, winst en toernooi**: samen met terracotta de kleuren van een dartbord.
- **Het donkere verloop** zwart → `#381000` → `#0f2e10` en de **lichte gloed** (rood linksboven, groen rechtsonder): de sfeer van een café-oche, geen dashboard.
- **De twee eigen fonts**: Flow voor titels en grote getallen, Flow Text voor tekst. Hét herkenningspunt.
- **De 3D-toetsen** (`--k-*`): voelen als echte knoppen. Houden als apart onderdeel.
- **Schalen met de ruimte** (`clamp()` met `vh`, `cqh`, `cqw` en container queries) in X01, oefenspellen en Random Checkout. Dat is de juiste techniek; het systeem maakt er vaste stappen van.
- **De zwevende spelbalk en invoer onderaan bij de duim.**

### 1.6 Huidige breakpoint-logica (gemeten)

| Regel | Query | Wat het doet | Wie krijgt het |
|---|---|---|---|
| Kolombreedte | geen query: `#app-content{max-width:760px}` | alle schermen max. 760 px breed, gecentreerd | iedereen ≥ 760 breed |
| Kantine | `(orientation:landscape) and (min-width:1000px)` (2 blokken) | spelschermen als grid (scores/doel links, invoer rechts), `max-width:none` voor X01 | **ook een iPad liggend (1024×768)** en elke laptop |
| Smal | `(max-width:420px)` | setup compacter | telefoons |
| Mobiele actiebalk | `(max-width:600px)` (3×) | setup-actiebalk, Halve It-tegels 3 kolommen | telefoons |
| Lage schermen | `(max-height:700/740/780px)` | X01, oefenspellen compacter | SE, liggende telefoons |
| JavaScript | geen breedtecontroles (alleen `innerWidth` voor confetti) | | |

**Gemeten op 768×1024 (staand):** telefoonindeling tot 760 px. Werkt. Veel lege ruimte in Cricket, en het zwarte vlak in Halve It (I13).
**Gemeten op 1024×768 (liggend):** kantine-indeling. 501 en Cricket bruikbaar, Halve It met zwart vlak, home/statistieken in de 760-kolom. Of dit de gewenste ervaring is voor een tablet in de hand, is **niet vastgesteld** (K6).

---

## 2. Ontwerprichting

**"Oche, geen dashboard."** Drie regels die elke keuze sturen:

1. **Leesbaar op 2,37 m.** Score, doel en wie aan de beurt is moeten in één blik vanaf de werplijn te lezen zijn: groot, hoog contrast, Flow. Al het andere (meta, uitleg) wijkt.
2. **Duim eerst.** Invoer onderaan, grote tikvlakken (minimaal 44 px, chips minimaal 40 px), geen precisiewerk tijdens een potje.
3. **Dartbordkleuren betekenen iets.** Terracotta = actie en beurt, groen = raak en gewonnen, rood = mis en gevaar, zwart/crème = bord. Geen kleur ter decoratie, geen extra accentkleuren, geen glas-effect om het effect.

Wat we bewust **niet** doen: geen nieuwe fonts, geen nieuwe accentkleur, geen verlopen op knoppen, geen pillen overal, geen nieuwe animaties.

---

## 3. Tokens

**Naamgeving:** `--{groep}-{rol}`. Bestaande namen (`--accent`, `--card`, `--text`, `--muted`, `--border`, `--surface`, `--radius`, `--radius-sm`, `--shadow`, `--shadow-lg`, `--ff-*`, `--k-*`) **blijven bestaan** als alias, zodat de ±1000 bestaande verwijzingen gewoon blijven werken.

**Regel in fase 4C:** elk token krijgt eerst **exact de huidige waarde**. Afronden naar de schaal (bijv. 13 → 14 px) is een aparte, zichtbare stap (4D) met Toms akkoord.

### 3.1 Kleur: vier groepen

Elke kleur in de app hoort bij precies één groep. **Alleen groep A en B worden semantische tokens.** C en D zijn betekenisdragende kleuren van het spel en blijven aparte, vaste sets.

| Groep | Wat | Regel |
|---|---|---|
| **A. Interface** | achtergronden, tekst, randen, knoppen, accent | semantische tokens per thema (§3.2) |
| **B. Spelstatus** | aan de beurt, raak, mis, bust, uit, winnaar, uitgooi gelukt | semantische tokens per thema (§3.2, rij "spelstatus") |
| **C. Team- en spelerskleuren** | wie is wie | vaste set `--team-*` / `--player-*`, **niet per thema, niet vervangen** |
| **D. Dartbordkleuren** | rood/groen sector, single, bull | vaste set `--board-*`, **niet per thema, niet vervangen** |

**Basispalet groep A/B** (vaste waarden waar de semantische tokens naar verwijzen):

| Token | Waarde | Herkomst / vervangt |
|---|---|---|
| `--terra-300` | `#E07A55` | `--su-orange-text` (donker) |
| `--terra-500` | `#B94E2A` | `--accent`, 47× hard `#B94E2A` |
| `--terra-600` | `#A8431F` | `--setup-accent-text` licht |
| `--terra-700` | `#9A3F22` | ingedrukte accentknop |
| `--green-300` | `#8FCB9C` | `--su-green-text` donker |
| `--green-400` | `#5E9E6E` | groene rand/hover |
| `--green-500` | `#3E7B4F` | huisgroen, 22× hard |
| `--green-600` | `#2F6B40` | groene tekst licht |
| `--green-700` | `#1E5631` | `.x-last`, `.sp-tag` licht |
| `--sage-300` | `#9DBF9E` | `--accent2`, `--info` |
| `--red-300` | `#FF7A6B` | miss-tekst donker (+ `#FF8A7A`) |
| `--red-500` | `#FF3B30` | `--danger` |
| `--red-700` | `#B3261E` | miss-tekst licht |
| `--amber-500` | `#D08A2E` | waarschuwing (K3), alleen als tekst/rand |
| Neutraal warm | `#1A1714` `#141314` `#6B6560` `#A8A09A` `#C9BFB8` `#D9D1CB` `#F3EDE8` `#F4F1ED` | setup + licht thema |
| Neutraal koel | `#000` `#1C1C1E` `#2C2C2E` `#3A3A3C` `#48484A` `#636366` `#8E8E93` `#98989F` `#E5E5EA` `#F2F2F7` `#FFF` | spelschermen donker, iOS-schakelaars |

**Groep C: team- en spelerskleuren** (blijven zoals ze zijn)

| Set | Waarden | Waar |
|---|---|---|
| `--team-1…4` | `#B94E2A` `#3E7B4F` `#5B6CCF` `#D08A2E` | `AFG_TEAM_COLORS` (Afgooien-teams), X01-teams |
| `--player-1…7` | `#B94E2A` `#3E7B4F` `#5B6CCF` `#D08A2E` `#7A5BB5` `#2E8C9A` `#B5476E` | `_frColor` (avatar per naam: een vriend houdt altijd dezelfde kleur) |

Dat teamkleur 1 en 2 gelijk zijn aan accent en huisgroen is toeval in waarde, niet in betekenis: ze worden **geen** alias van `--accent`/`--hit`. Anders zou een latere accentwijziging de teamkleur ongemerkt veranderen.

**Groep D: dartbordkleuren**

| Token | Nu | Waar |
|---|---|---|
| `--board-red` | `#cc2222` (badges) en `#D9232D` (Halve It-bord) | uitgooi-badges, Halve It "willekeurige double"-bord |
| `--board-green` | `#16a34a` (badges) en `#1E7E34` (Halve It-bord) | idem |
| `--board-single-red` / `--board-single-green` | `#374151` / `#4b5563` | single-badges |
| bull / bullseye | groen / rood | badges |

In 4C krijgen badges en bord **elk hun eigen huidige waarde** (`--board-red-badge` en `--board-red-hi` enz.). Het samenvoegen (K5) is 4D.

### 3.2a Uitzonderingslijst: kleuren die bewust buiten de semantische tokens blijven

Deze kleuren worden in 4C **niet** vervangen door een interfacetoken. Ze krijgen hoogstens een eigen naam met exact dezelfde waarde, of blijven staan.

| # | Kleur(en) | Waar | Waarom uitzondering |
|---|---|---|---|
| X1 | teamkleuren (groep C) | Afgooien-teams, X01-teams, nummerbadges | herkenning wie bij welk team hoort |
| X2 | spelerskleuren `_frColor` | avatars vrienden | zelfde persoon = zelfde kleur, op elk apparaat |
| X3 | dartbordkleuren (groep D) | uitgooi-badges, Halve It-bord | het bord zelf; rood/groen = sector |
| X4 | Halve It-opdrachttypen: oranje tegel `rgba(224,122,85,.10/.28)`, groene tegel `rgba(94,158,110,.12)` / `rgba(143,203,156,.28)`, paars `rgba(156,39,176,…)` + `#9c27b0` ("1 van 3 getallen"), teal `rgba(15,155,142,…)` | Halve It-setup en -spel | elk opdrachttype is herkenbaar aan zijn kleur |
| X5 | `#f59e0b` (amber) | Halve It-stats "treble %" | stat-categoriekleur; valt mogelijk samen met K3, beslissen in 4D |
| X6 | instellingen-pictogramkleuren (`.st-ic`: `#B94E2A` `#3E7B4F` `#5B6CCF` `#D08A2E` `#7A5BB5` `#6E7781` `#2E8B9A`) | Instellingen-menu | herkenning per menu-onderdeel (zoals iOS-instellingen) |
| X7 | confetti `#ff6c00 #ef4444 #f59e0b #22c55e #3b82f6 #a855f7 #ec4899 #fff #ffd700` | winstscherm | feest, geen UI; contrast niet van toepassing |
| X8 | grafiekkleuren in Statistieken (lijn/punten in accent en huisgroen) | gemiddelde over tijd | datavisualisatie; krijgen `--chart-*`, losgekoppeld van UI-accent |
| X9 | iOS-schakelaar `#E5E5EA` / `#3A3A3C` | instellingen | platformgewoonte |
| X10 | `--k-*` (3D-toets) | numpad, spelknoppen | eigen materiaal, niet een kleur met betekenis |

**Regel:** een kleur uit X1–X10 wordt nooit automatisch vervangen, ook niet als hij toevallig dezelfde waarde heeft als een semantisch token. Een vervanging die de betekenis of herkenbaarheid van een spel raakt, gaat alleen via 4D, met een verschilrapport en Toms akkoord.

### 3.2 Kleur: semantische tokens (wat componenten gebruiken)

Componenten gebruiken **alleen** deze laag, nooit het basispalet of een hexwaarde.

| Token | Doel | Donker | Licht | Vervangt | Waar |
|---|---|---|---|---|---|
| `--bg` | basis achter alles | `#000000` | `#F4F1ED` | `--bg` | `html` |
| `--bg-art` | sfeerverloop | `linear-gradient(160deg,#000 0%,#381000 30%,#0f2e10 100%)` | `radial-gradient(… rgba(185,78,42,.14) …), radial-gradient(… rgba(62,123,79,.14) …), #F4F1ED` | `body`-achtergronden (4×) | `body` |
| `--surface` | onderblad, venster, invoerveld | `#1C1C1E` (auto: `rgba(28,28,30,.72)`) | `rgba(255,255,255,.92)` | `--surface`, `--su-card` | sheets, `.ask-box`, `input` |
| `--card` | kaart, rij, toets | `#2C2C2E` (auto: `rgba(44,44,46,.75)`) | `rgba(242,238,233,.96)` | `--card` | `.x-card`, `.g-prow`, `.btn` |
| `--sunken` | verzonken vlak (put) | `#141314` | `rgba(0,0,0,.06)` | `--su-well` | segmenten-bak, selects in setup |
| `--scrim` | verduistering achter venster | `rgba(0,0,0,.55)` | `rgba(0,0,0,.55)` | `.55`, `.7`, `.82`, `.85`, `.88` inline | modals, sheets |
| `--border` | rand | `rgba(255,255,255,.10)` | `rgba(60,40,30,.10)` | `--border`, `--su-w1` | kaarten, velden |
| `--separator` | scheidingslijn in lijst | `rgba(255,255,255,.06)` | `rgba(60,40,30,.07)` | `--separator`, `--su-w06` | rijen |
| `--hover` / `--press` | interactiestaat | `rgba(255,255,255,.06)` / `.10` | `rgba(0,0,0,.04)` / `rgba(226,219,212,.95)` | `--su-w05…w08`, `--su-press` | knoppen, rijen |
| `--text` | hoofdtekst | `#FFFFFF` | `#1A1714` | `--text`, `--su-text` | overal |
| `--text-muted` | meta, uitleg | `#98989F` | `#6B6560` | `--muted`, `--su-muted` | onderschriften |
| `--text-soft` | tussen tekst en muted | `#C9BFB8` | `#48484A` | `--su-soft`, `--su-btn` | knoptekst setup |
| `--text-on-fill` | tekst op accent/groen/rood | `#FFFFFF` | `#FFFFFF` | 37× `#fff` | primaire knoppen, badges |
| `--accent` | **vulling** actie/beurt | `#B94E2A` | `#B94E2A` | `--accent`, hard `#B94E2A` | primaire knop, actieve chip |
| `--accent-press` | ingedrukt | `#9A3F22` | `#9A3F22` | | |
| `--accent-text` | **accent als kleine tekst** | `#E07A55` | `#A8431F` | `--setup-accent-text`, `--su-orange-text` | labels, "Tom gooit op", links |
| `--accent-soft` | achtergrond actief/geselecteerd | `rgba(185,78,42,.16)` | `rgba(185,78,42,.12)` | `.12/.14/.15/.16/.18` | `.x-card.on`, `.g-prow.on`, geselecteerd |
| `--accent-ring` | rand/gloed actief | `rgba(185,78,42,.35)` | `rgba(185,78,42,.35)` | `.30/.35/.45` | actieve speler, focus |
| `--hit` | vulling raak/winst/toernooi | `#3E7B4F` | `#3E7B4F` | hard `#3E7B4F`, `--success #34C759` | Raak-knop, winst-tag, toernooitegel |
| `--hit-text` | groen als tekst | `#8FCB9C` | `#2F6B40` | `--su-green-text` | "Win", uitgooi-label |
| `--hit-soft` | groene achtergrond | `rgba(62,123,79,.16)` | `rgba(62,123,79,.14)` | `.14/.16/.18/.2/.22/.28` | `.g-chip`, winst-badge |
| `--danger` | vulling mis/verwijderen | `#FF3B30` | `#FF3B30` | `--danger`, `rgba(239,68,68)` | |
| `--danger-text` | rood als tekst | `#FF7A6B` | `#B3261E` | miss-tekst | "Mis", "Verwijderen" |
| `--danger-soft` | rode achtergrond | `rgba(255,59,48,.10)` | `rgba(179,38,30,.10)` | `.08/.1/.12/.15/.2` | `.btn-danger`, verlies-tag |
| `--warning` | waarschuwing | (K3) `#D08A2E` | (K3) `#8A5A12` | `--warning` (= accent), `#F59E0B`, toast `#FF9500` | sync-problemen, scroll-hint |
| `--info` | neutraal-positief | `#9DBF9E` | `#2F6B40` ⚠ | `--accent2`, `--info` | **nooit als tekst op licht** (1,75) |
| `--focus` | focusring | `#E07A55` | `#A8431F` | (nieuw, I12) | `:focus-visible` |
| **Spelstatus (groep B)** | | | | | |
| `--state-turn` | aan de beurt (vlak + gloed) | = `--accent-soft` + `--glow-turn` | idem | `.x-card.on`, `.g-prow.on` | spelerskaarten |
| `--state-hit` | raak / gelukt / uitgegooid | = `--hit` / `--hit-text` | idem | `.g-hit`, Uitgegooid | spelknoppen, pijlstippen |
| `--state-miss` | mis / mislukt | = `--danger-text`, vlak `--danger-soft` | idem | `.g-miss`, Mislukt | spelknoppen |
| `--state-bust` | doodgegooid | = `--danger-text` | idem | X01 bust-melding, Random Checkout | |
| `--state-out` | uit / klaar | `opacity:.45` (geen kleur) | idem | `.g-prow.out` | Bob's 27, Afgooien |
| `--state-win` | winnaar | = `--hit` | idem | winstag, toernooi-winnaar | |

De spelstatustokens verwijzen naar de interfacetokens, maar hebben **eigen namen**. Zo kan Tom later bijvoorbeeld "mis" anders kleuren dan "verwijderen" zonder de rest te raken.

`--header-bg`, `--game-bar-bg` en `--nav-bg` blijven aparte tokens (doorschijnend + blur), met de huidige waarden.

### 3.3 Typografie

Twee families blijven: `--ff-display` (Flow, alleen hoofdletters, cursief, alleen 700) en `--ff-text` (Flow Text, 400–599 en 600–900).

**Vaste schaal voor UI-tekst** (Flow Text). De huidige 30+ vaste groottes vallen in 8 stappen:

| Token | Grootte / regel | Gewicht (R = Regular, B = Bold) | Doel | Vervangt (huidig, aantal) |
|---|---|---|---|---|
| `--fs-micro` | 11 / 14 | B, hoofdletters, `letter-spacing .06em` | labels boven blokken ("TOM GOOIT OP", "PIJLEN") | 9 (5×), 10 (19×), 11 (71×) |
| `--fs-caption` | 12 / 16 | R of B | meta, tijden, `g-prow-meta` | 12 (133×) |
| `--fs-small` | 13 / 18 | R of B | ondertitels, knoppen sm, chips | 13 (83×) |
| `--fs-body` | 15 / 20 | B (knoppen, namen) of R (lopende tekst) | standaard: rijen, knoppen, invoer | 14 (48×), 15 (41×) |
| `--fs-body-lg` | 17 / 22 | B | lijsttitels, invoer `type=text`, sheettitels | 16 (27×), 17 (14×), 18 (13×) |
| `--fs-title` | 20 / 24 | Flow 700 | kaarttitels, venstertitels | 19–21 (22×) |
| `--fs-stat` | 28 / 30 | Flow 700 | statgetallen in tegels | 22–32 (±50×) |
| `--fs-headline` | 34 / 36 | Flow 700 | schermtitels ("INSTELLINGEN") | 30–40 (6×) |

**Gewichten:** precies twee tokens, omdat het font er maar twee heeft: `--fw-regular 400` en `--fw-bold 700`. Flow (titels, getallen) heeft alleen 700. De huidige 600/800/900 worden in 4C `--fw-bold` en 300/500 worden `--fw-regular`: dat geeft **0 pixels verschil**, omdat ze nu al zo getekend worden. Wil Tom later echt een tussengewicht (Semibold, Black), dan moet Flow Text een extra bestand krijgen; dat is een fontklus en geen CSS-klus.

**Grote getallen (vloeiend, Flow):** dit zijn de bestaande `clamp()`'s, alleen met een naam.

| Token | Waarde (huidig) | Waar |
|---|---|---|
| `--fs-score-x01` | `clamp(56px,15vw,96px)`; kantine `clamp(110px,min(15vh,9vw),280px)` | `.x-score` |
| `--fs-score-x01-compact` | 3+ spelers: `clamp(40px,min(6vh,3.4vw),96px)` | `.x-compact` |
| `--fs-target` | `clamp(76px,min(calc(100cqh - 150px),calc(150cqw / var(--gt-n,3))),260px)` | `.g-target-big` |
| `--fs-checkout` | `clamp(15px,min(26cqh,7.5cqw),54px)` | `.co-big` |
| `--fs-prow-score` | 22 px (telefoon) | `.g-prow-score` |

**Minimum:** niets onder 11 px (nu 9 en 10 px op 24 plekken, 4A-bevinding M6). Op het kantinescherm is het minimum 14 px (zie §6).

### 3.4 Ruimte

De app gebruikt veel 6, 10 en 14 px. Een strikt 8-px-raster zou alles verschuiven. Daarom: **2-px-stappen tot 16, daarna grotere stappen.**

| Token | px | Doel | Huidig gebruik |
|---|---|---|---|
| `--sp-1` | 2 | haarlijn-ruimte | margin 2 (15×), gap 2 |
| `--sp-2` | 4 | binnen een element | gap 4 (12×), padding 4 |
| `--sp-3` | 6 | tussen label en waarde | gap 6 (20×), margin 6 |
| `--sp-4` | 8 | **standaard gap** | gap 8 (39×), margin 8 |
| `--sp-5` | 10 | rijen in een kaart | gap 10 (17×), margin 10 |
| `--sp-6` | 12 | kaartpadding compact | 12 (veel), gap 12 |
| `--sp-7` | 14 | **kaartpadding standaard** | `12px 14px`, `14px 16px` |
| `--sp-8` | 16 | schermrand | `0 16px`, margin 16 |
| `--sp-10` | 20 | tussen secties | |
| `--sp-12` | 24 | grote ruimte, venster | |
| `--sp-16` | 32 | kantine-schermrand | |

Vloeiende ruimte voor spelschermen blijft met `clamp()`, met een token per plek (`--sp-game-gap: clamp(3px,3cqh,10px)` enz.).
Afwijkers (1, 3, 5, 7, 9, 11 px) worden in 4D naar de dichtstbijzijnde stap gezet, en alleen waar de visuele vergelijking dat goedkeurt.

### 3.5 Hoeken

| Token | px | Doel | Vervangt |
|---|---|---|---|
| `--r-xs` | 6 | badges, kleine tags | 2, 3, 4, 5, 6, 7 |
| `--r-sm` | 8 | segment-knop in bak, `.g-chip` | 8 |
| `--r-md` | 10 | kleine knoppen, `--radius-sm` | 9, 10, 11 |
| `--r-lg` | 12 | invoervelden, selects, spelersrij | 12 |
| `--r-xl` | 14 | **knoppen, toetsen, kaarten, segment-bak** | 13 (`--radius`), 14 |
| `--r-2xl` | 16 | grote kaarten (`.x-card`, `.card`, win-card) | 16, 18 |
| `--r-3xl` | 20 | venster, sheet (bovenhoeken), install-kaart | 20, 22 |
| `--r-pill` | 999 px | chips, schakelaar, zwevende spelbalk | 20 (bij chips), 30, 32, 40, 999 |
| `--r-round` | 50% | rondjes (avatar, pijlstip, bordknop) | 50% |
| `--r-score-xl` | 22 | `.x-card` op het kantinescherm | 22 |

`--radius` (13) wordt een alias van `--r-xl` (14): **1 px zichtbaar verschil op ±11 plekken**, pas in 4D.

### 3.6 Schaduw en hoogte

Vijf niveaus plus twee speciale. Donker leunt op lichter oppervlak, licht op schaduw.

| Token | Doel | Donker | Licht | Vervangt |
|---|---|---|---|---|
| `--elev-0` | plat (rij in kaart) | `none` | `none` | `none` (4×) |
| `--elev-1` | kaart, knop | `0 2px 8px rgba(0,0,0,.45)` (auto: `0 2px 12px rgba(0,0,0,.35),0 1px 3px rgba(0,0,0,.2)`) | `0 1px 2px rgba(60,40,30,.05),0 6px 18px -6px rgba(60,40,30,.10)` | `--shadow`, `.card` licht |
| `--elev-2` | zwevend (spelbalk, nav, banner) | `0 8px 28px rgba(0,0,0,.28),0 2px 8px rgba(0,0,0,.18)` | `0 4px 24px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06)` | spelbalk, pill-nav |
| `--elev-3` | sheet | `0 -10px 40px rgba(0,0,0,.45)` | `0 -4px 24px rgba(0,0,0,.12)` | `--shadow-lg` |
| `--elev-4` | venster | `0 20px 60px rgba(0,0,0,.45)` | idem | `.ask-box` |
| `--glow-turn` | actieve speler | `0 0 0 1px rgba(185,78,42,.35),0 10px 26px -8px rgba(185,78,42,.45),0 0 32px -6px rgba(185,78,42,.30)` | idem (v241) | `.x-card.on`, `.g-prow.on` |
| `--glow-primary` | primaire knop | `0 2px 12px rgba(185,78,42,.35)` | idem | `.btn-primary`, `.win-btn.primary` (.4) |
| `--key-*` | 3D-toets | bestaande `--k-hi/top/bot/edge/drop` | bestaand | **ongewijzigd** |

### 3.7 Lagen (z-index)

| Token | Waarde | Wat | Huidig |
|---|---|---|---|
| `--z-base` | 0 | achtergrond, confetti | 0 |
| `--z-content` | 1 | app-inhoud, header | 1, 2, 5 |
| `--z-sticky` | 10 | setup-actiebalk | 10 |
| `--z-drag` | 100 | sleepitem | 100 |
| `--z-banner-top` | 9000 | update-banner | 9000 |
| `--z-game-controls` | 9970 | zwevende spelbalk | 9970 |
| `--z-nav` | 9980 | pill-nav | 9980 |
| `--z-install` | 9985 | install-banner | **9980 → 9985** (botst nu met nav) |
| `--z-sheet` | 9990 | onderbladen | 9990 |
| `--z-modal` | 9997 | dubbel-, toernooi-, groepvenster, laden, iOS-uitleg | 9997–9999 |
| `--z-confirm` | 10050 | `_askConfirm` | 10050 |
| `--z-toast` | 10100 | meldingen | **9999 → 10100** (valt nu onder bevestigvenster) |

De getallen blijven gelijk, behalve twee correcties (I11). Die zijn zichtbaar alleen als twee lagen tegelijk open staan.

### 3.8 Beweging

Bestaand en goed: korte overgangen (30–150 ms) voor indrukken, `prefers-reduced-motion` wordt al gerespecteerd.

`--dur-press 70ms`, `--dur-fast 150ms`, `--dur-base 220ms`, `--ease-out ease-out`, `--ease-spring cubic-bezier(.34,1.56,.64,1)`. Geen nieuwe animaties.

---

## 4. Licht en donker

### 4.1 Eén mechanisme

Tokens staan op **één plek per thema**:

```css
:root{ /* donker = standaard */ --bg:#000; --card:…; … }
:root[data-theme="light"]{ /* licht */ … }
@media (prefers-color-scheme:light){ :root:not([data-theme="dark"]){ /* zelfde als hierboven */ } }
```

Componenten krijgen **geen** themaregels meer. Ze gebruiken alleen tokens. Daarmee verdwijnen de 19 dubbele paren (I3) en kan een lek als in v226 niet meer ontstaan: er is geen component-CSS meer die per thema iets anders doet.

### 4.2 Definitie donker

Waarden uit §3.2. Open punt **K1**: automatisch donker (doorschijnend `.75`/`.72`) of gekozen donker (dicht `#2C2C2E`/`#1C1C1E`). Tot de keuze krijgen ze in 4C allebei hun huidige waarde (geen zichtbare verandering).

### 4.3 Definitie licht

De werkelijke v241-waarden (niet die uit CLAUDE.md §10): `--bg #F4F1ED`, `--surface rgba(255,255,255,.92)`, `--card rgba(242,238,233,.96)`, `--text #1A1714`, `--text-muted #6B6560`, `--border rgba(60,40,30,.10)`, `--separator rgba(60,40,30,.07)`, gloed rood linksboven en groen rechtsonder, `--elev-1` warm. Automatisch licht en gekozen licht zijn nu al gelijk (gemeten), op één `--shadow`-verschil na.

### 4.4 Regels

- Een merkkleur als **tekst** gebruikt altijd de `-text`-variant (`--accent-text`, `--hit-text`, `--danger-text`). De vulkleur alleen als achtergrond met `--text-on-fill`.
- `--info`/sage nooit als tekst in licht.
- Elke combinatie ≥ 4,5 (tekst) of ≥ 3 (tekst ≥ 24 px of ≥ 18,7 px vet, iconen). `tests/core/contrast.mjs` controleert dit automatisch voor alle themastanden (§7.2). Wat er nu niet aan voldoet, staat als uitzondering C1–C8 in §1.4 en wordt apart gerapporteerd, niet stil aangepast.

---

## 5. Componenten

Per component: wat het is, varianten, maten, staten en welke bestaande klassen erin opgaan. In 4C blijven de bestaande klassenamen bestaan, zodat er geen HTML of JS hoeft te veranderen. De nieuwe specificatie komt via tokens in de bestaande regels.

### 5.1 Knop (`.btn`)

| Variant | Achtergrond | Tekst | Gebruik | Was |
|---|---|---|---|---|
| primair | `--accent` + `--glow-primary` | `--text-on-fill` | één hoofdactie per scherm | `.btn-primary`, `.win-btn.primary`, `.empty-state-btn`, `#install-banner-btn` |
| secundair | `--card` + `--elev-1` | `--text` | overige acties | `.btn`, `.win-btn` |
| raak | `--hit` | `--text-on-fill` | Raak, Uitgegooid, Speel leg | groene knoppen inline |
| gevaar | `--danger-soft` | `--danger-text` | Verwijderen, Stop | `.btn-danger` |
| stil | transparant | `--accent-text` | Ranglijst/Statistieken op winstscherm, "Toon meer" | tekstlinks (4A M7) |
| toets | `--card` + `--key-*` 3D | `--text` | numpad, snelscores, Raak/Mis-toetsen | `.x01-pad .btn`, `.g-keys button`, `.numpad .btn`, `.hi-k` |

| Maat | Hoogte | Padding | Tekst | Hoek |
|---|---|---|---|---|
| sm | 36 (tikvlak 44 met marge) | `--sp-4 --sp-7` | `--fs-small` | `--r-md` |
| md (standaard) | 44 | `--sp-6 18px` | `--fs-body` B | `--r-xl` |
| lg | 52 | `--sp-7 --sp-10` | `--fs-body-lg` B | `--r-xl` |
| toets | vloeiend `clamp(44px,calc(9vh - 13px),74px)` | 0 | 19–21 px Flow | `--r-xl` |

Staten: rust, ingedrukt (`translateY(1px)`, randschaduw weg, `--dur-press`), uit (`opacity .4`, geen schaduw), focus (`outline 2px solid var(--focus); outline-offset 2px`), bezig (tekst blijft, spinner ernaast; niet nieuw bouwen in 4C).

### 5.2 Gesegmenteerde keuze (`.seg`)

Eén component voor `.seg-ctrl/.seg-btn`, `.g-seg` en `.segment` (I8): bak `--sunken` of `--card`, hoek `--r-xl`, padding `--sp-1`/`--sp-2`; knop hoogte 40, hoek `--r-md`, tekst `--fs-body` 700; actief = `--accent` + `--text-on-fill` (spelopties) of `--card` + `--elev-1` (weergave-instellingen). Twee varianten: **sterk** (accent) en **zacht** (kaart). Toernooi-variant: actief = `--hit`.

### 5.3 Chip (`.chip`) en tikvlakken

Eén component voor `.chip`, `.lb-chip`, `.lb-sub`, `.known-name-btn`, `.gc-btn` (I9): hoogte 36 zichtbaar, hoek `--r-pill`, tekst `--fs-small`/`--fs-body` 700. Staten: rust `--card`, actief `--accent` + `--text-on-fill`, gekozen-zacht `--accent-soft` + `--accent-text`. `.g-chip` (groene doel-chip in spel) is een **tag**, geen chip: zie 5.9.

**Gemeten: kan een groter tikvlak zonder overlap?** Methode: alle bedienbare elementen die bovenop liggen (`elementFromPoint`, dus niet verstopt achter de navigatie), per element onder 44 px de vrije ruimte tot de dichtstbijzijnde buur boven/onder/links/rechts. Een element mag maximaal **de helft** van een tussenruimte claimen, de andere helft is van de buur. 46 scenario's, NL donker.

| Breedte | Kleine elementen | Kunnen veilig naar 44 | Niet zonder overlap |
|---|---|---|---|
| 320 × 568 | 290 | 235 | 55 |
| 360 × 640 | 274 | 241 | 33 |
| 375 × 667 (SE) | 270 | 246 | 24 |
| 390 × 844 | 260 | 254 | 6 |

| Element | Maat | Kleinste tussenruimte | Veilig naar 44? |
|---|---|---|---|
| `.lb-chip` (ranglijst) | 61–67 × 40 | 15 boven/onder | **ja** (overal) |
| `.lb-sub` (subfilters) | 72–94 × 36 | 17 | **ja** |
| `.known-name-btn` (bekende spelers) | 77–84 × 39 | 6 | **ja** (2,5 px per kant nodig, 3 beschikbaar) |
| `.gc-btn` (spelbalk Ongedaan/Stats/Stop) | 74–109 × 36 | 3 (spelknoppen eronder) | **nee**: zou tikken op 16/15/Bull (Cricket), Uitgegooid (Random Checkout) en 0 (X01) wegnemen |
| `.pn-tab` (navigatie) | 47 × 38 | 0 (inhoud loopt eronder door) | **nee** |
| X01-snelscores (`.btn` 0/26/45…) | 37–38 × 44 | 4 naast elkaar | **nee** (te smal op ≤ 375) |
| Random Checkout-numpad | 43–54 × 40 | 4–5 | **nee** op 320/360 |
| Random Checkout "pijlen per poging" (`.seg-btn`) | 36 × 54 | 3 | **nee** |
| `.hi-tile-del` (Halve It verwijderen) | 40 × 40 | 0 (rand tegel) | **nee** naar boven, ligt in de tegel zelf |

**Regels die hieruit volgen:**
1. Chips (`.chip`, `.lb-chip`, `.lb-sub`, `.known-name-btn`) krijgen het tikvlak via een `::after` van `min(nodig, halve tussenruimte)`: **nooit verder dan het midden tussen twee elementen**.
2. **Geen onzichtbare zones** op `.gc-btn`, `.pn-tab`, snelscores, numpads en `.seg-btn` in Random Checkout. Die worden in 4D met de indeling opgelost (spelbalk iets hoger en meer afstand tot de spelknoppen, numpad-kolommen op smalle schermen), met verschilrapport.
3. Een geautomatiseerde test bewaakt dit (§7.3).

### 5.4 Kaart (`.card`)

`--card`, rand `1px solid var(--border)` (licht: `--separator`), hoek `--r-2xl`, padding `--sp-7`, `--elev-1`. Variant **lijstkaart**: padding 0, rijen met `--separator` ertussen. Variant **verzonken**: `--sunken`, geen schaduw.

### 5.5 Spelerskaart (`.x-card` en `.g-prow`)

| Staat | Stijl |
|---|---|
| rust | `--card`, `--elev-1` |
| aan de beurt | `--accent-soft` + `--glow-turn` + bolletje `--accent` voor de naam |
| uit / klaar | `opacity .45`, score doorgestreept of "klaar" (bestaat al bij Bob's 27) |
| winnaar | rand `--hit`, tag "Win" |

Score rechts in Flow (`--fs-prow-score` of `--fs-score-x01`), naam `--fs-body` 700, meta `--fs-caption` `--text-muted`. Teamkleur als 3 px balk links (niet als vlak).

### 5.6 Doel- en scoreweergave (`.g-target`)

Label `--fs-micro` in `--accent-text`. Getal in Flow `--fs-target` in `--accent`, groot genoeg dat contrast 3:1 volstaat. Pijlstippen 10 px, rand `--text-muted`, raak `--hit`, mis `--danger`.

### 5.7 Uitgooi-route (`.co-big`)

Badges in **dartbordkleuren**: `--board-red` / `--board-green` voor D/T, `--board-single` voor singles, bull groen, bullseye rood; tekst `--text-on-fill`, hoek `--r-pill`, grootte `--fs-checkout`. Eén palet voor badges en het Halve It-bord (I10).

### 5.8 Onderblad, venster, melding, banner

| Component | Achtergrond | Hoek | Schaduw | Laag |
|---|---|---|---|---|
| onderblad (`openGameSheet`) | `--surface` | `--r-3xl` boven | `--elev-3` | `--z-sheet` |
| venster (`_askConfirm`) | `--surface` | `--r-3xl` | `--elev-4` | `--z-confirm` |
| melding (`showToast`) | info `rgba(36,36,40,.93)`, succes `--hit`, fout `--danger`, waarschuwing `--warning` | `--r-pill` | `--elev-2` | `--z-toast` |
| banner (update, install) | `--accent` / `--surface` | `--r-2xl` | `--elev-2` | `--z-banner-top` / `--z-install` |

Verduistering altijd `--scrim`.

### 5.9 Tag / badge

Klein label zonder actie ("Win", "Verlies", "gedeeld", "vriend", groene doel-chip): hoogte 20–28, hoek `--r-xs`/`--r-sm`, tekst `--fs-caption` 700; varianten hit (`--hit-soft` + `--hit-text`), danger, accent, neutraal (`--card` + `--text-muted`).

### 5.10 Formulier

| Element | Hoogte | Achtergrond | Hoek | Tekst |
|---|---|---|---|---|
| tekstveld | 48 | `--card` | `--r-lg` | 16 px (iOS zoomt niet in vanaf 16) |
| select | 44 | `--card` | `--r-lg` | `--fs-body` 700 |
| schakelaar (`.ios-toggle`) | 31 × 51 | uit `#3A3A3C`/`#E5E5EA`, aan `--hit` | `--r-pill` | |
| zoekveld | 44 | `--sunken` | `--r-lg` | `--fs-body` |

Foutmelding onder het veld in `--danger-text` `--fs-caption`. Altijd een zichtbaar label of `aria-label`.

### 5.11 Navigatie

- **Pill-nav:** blijft. `--nav-bg`, `--elev-2`, `--r-pill`, actieve tab `--accent`.
- **Spelbalk** (`#game-controls`): blijft. `--game-bar-bg`, `--elev-2`, `--r-pill`, Stop in `--danger-text`.
- **Schermkop** (`.g-head`, schermtitels): titel Flow `--fs-headline`/`--fs-title`, ondertitel `--fs-caption` `--text-muted`.

### 5.12 Lijstrij en stat-tegel

Lijstrij: min. 48 hoog, padding `--sp-5 --sp-7`, scheiding `--separator`, chevron `--text-muted`. Stat-tegel: `--card`, `--r-xl`, getal Flow `--fs-stat`, label `--fs-micro` `--text-muted`, positief getal `--hit-text`, record `--accent-text`.

---

## 6. Responsief

### 6.1 Drie contexten

| Context | Herkennen | Principe |
|---|---|---|
| **Telefoon staand** (360–430 breed) | standaard | Eén kolom. Invoer onderaan in de duimzone. Spelschermen schalen met de **hoogte** (`vh`/`cqh`); alles past zonder scrollen boven de spelbalk, ook op 375×667. |
| **Tablet** (staand 768×1024, liggend 1024×768) | nu: staand = telefoonregels, liggend = kantineregels | **In 4C ongewijzigd.** Staand werkt de huidige telefoonindeling (max. 760 px). Liggend valt een iPad nu in de kantine-indeling. Of dat gewenst is, wordt eerst met Tom vastgesteld (K6). Daarna pas een eventuele eigen tabletregel, in 4D. Beide maten komen in de visuele test (4C-0). |
| **Kantinescherm** (liggend, ≥ 1000 breed) | `(orientation:landscape) and (min-width:1000px)` | Twee kolommen: links wat je **op afstand leest** (score, doel, spelers), rechts de **invoer** (max. 520 px). Doel (4D): alle UI-tekst ×1,25 via `--ui-scale`, minimum 14 px; niet-spelschermen in een geschaalde kolom. In 4C ongewijzigd. |

### 6.2 Breekpunten

CSS-variabelen werken niet in media queries, dus dit zijn vaste afspraken in de documentatie:

| Naam | Query | Nu |
|---|---|---|
| `compact-h` | `(max-height:700px)` | 700 (+ 740, 780 voor X01: samenvoegen in 4D) |
| `narrow` | `(max-width:420px)` | 420 |
| `phone-wide` | `(max-width:600px)` | 600 (setup) |
| `kantine` | `(orientation:landscape) and (min-width:1000px)` | idem. **Valt nu ook op iPad liggend; zie K6.** Mogelijke scheiding later (alleen na K6): `(orientation:landscape) and (min-width:1000px) and (pointer:fine), (min-width:1200px)` of een eigen instelling "Kantinescherm" in Weergave. |

### 6.3 Regels

1. **Spelschermen meten, niet raden:** vrije ruimte via container queries (`cqh`/`cqw`), zoals al gedaan bij X01 en oefenspellen. Geen vaste pixelhoogtes voor doel of score.
2. **Nooit iets belangrijks onder de spelbalk:** `padding-bottom` van de inhoud = hoogte spelbalk + `--sp-4` + `env(safe-area-inset-bottom)`.
3. **Kantine = andere indeling, geen uitgerekte telefoon.** Elk spel krijgt in liggend een grid. Halve It, Eliminatie, Cricket en Afgooien missen dat nu (4A H1/M1).
4. **Tikvlak ≥ 44** (chips ≥ 40 zichtbaar, 44 tikbaar), ook op het kantinescherm met touch (de Evolve).
5. **Veilige marges** (`env(safe-area-inset-*)`) blijven overal waar ze nu staan.

---

## 7. Migratie

Het principe: **eerst onzichtbaar, dan zichtbaar, en elke stap bewezen met de visuele vergelijking tegen `faf50f0`.** De scope van 4C is zo klein mogelijk.

### 7.1 Stappen

| Stap | Wat | Verwacht verschil | Bewijs |
|---|---|---|---|
| **4C-0** | **Alleen tests, alleen toevoegen.** (a) visuele test: thema *automatisch* (systeem donker en systeem licht) en tablet 768×1024 / 1024×768; (b) contrasttest (§7.2); (c) tikvlaktest (§7.3); (d) teller van hardgecodeerde kleuren buiten het tokenblok (mag alleen dalen). `faf50f0` blijft de referentie; de nieuwe opnames worden bij elke vergelijking vers van `faf50f0` gemaakt, er wordt niets opgeslagen of overschreven. | geen (de app verandert niet) | `npm test` groen; compare `faf50f0` ↔ `faf50f0` = 0 |
| **4C-1** | Tokenblok toevoegen met **exact de huidige waarden**, nog door niets gebruikt. Oude namen worden aliassen. | **0 pixels** | volledige compare = 0 |
| **4C-2** | Hardgecodeerde waarden in **CSS** vervangen door tokens met **dezelfde waarde**: kleuren (alleen groep A/B; C/D krijgen eigen namen, X1–X10 blijven), hoeken, schaduw, z-index, ruimte, lettergrootte, gewicht (600/800/900 → bold, 300/500 → regular: zelfde font-bestand). Per schermgroep een commit. | **0 pixels** | compare per commit = 0 |
| **4C-3** | Dubbele themaregels samenvoegen (I3): componentregels alleen nog tokens. | **0 pixels**, ook in *automatisch* | compare incl. automatisch en tablet |
| ~~4C-4~~ | **Vervallen als verplichte stap.** Inline stijlen in JS-strings (±820) naar klassen: wordt **4X, optioneel**, na 4C-3 en met apart akkoord. | | |
| **4D** (apart akkoord, per punt) | De zichtbare verbeteringen: K1–K7, contrast-uitzonderingen C1–C8, afronden op de schaal, chips via `::after`, minimaal 11 px, `:focus-visible`, z-index-correcties, indeling spelbalk/numpad (tikvlakken), 4A-bugs H1–H3 en M1/M2, tabletkeuze. | bedoeld | verschilrapport per punt; nieuwe referentie = nieuwe commit (`faf50f0` blijft bestaan) |
| **4X** (optioneel) | Inline JS-stijlen naar klassen, alleen in functies die toch al worden aangeraakt. | 0 pixels | compare + `npm test` + html-sinks |

**Bewijs van "0 pixels":** `REF=<map met faf50f0> npm run visual:compare` met de **volledige** matrix (ook automatisch en tablet), drempel 0 verschillende pixels per opname. Een stap is pas klaar als het rapport "0 van N opnames veranderd" zegt. De uitkomst gaat mee in het commitbericht.

**Afspraken voor heel 4C:** geen wijziging aan `APP_VERSION`, niet naar GitHub Pages (`main`) zonder Toms akkoord per release, geen spelregels, gegevensstructuren, Firebase of synchronisatie aanraken, `npm test` en html-sinks groen bij elke commit. Werk op een branch (`feat/fase4c`).

### 7.2 Contrasttest (`tests/core/contrast.mjs`, nieuw in 4C-0)

- **Wat:** laadt de app in vier themastanden: donker gekozen, licht gekozen, automatisch met systeem donker, automatisch met systeem licht. Leest de **berekende** tokenwaarden (`getComputedStyle(document.documentElement)`; vóór 4C-1 de huidige namen `--text`, `--muted`, `--card` …).
- **Hoe:** doorschijnende kleuren worden samengesteld over elk punt van het achtergrondverloop. De laagste uitkomst telt.
- **Paren:** vaste lijst in `tests/core/contrast.pairs.json`: tekst/muted/soft/accent-tekst/hit-tekst/danger-tekst/warning op bg/card/surface; wit op accent/hit/danger/board/team; groot doelgetal (accent) op card. Per paar de eis: 4,5 of 3,0 (groot).
- **Uitzonderingen:** staan in `tests/core/contrast.allow.json`, elk met reden en de 4D-stap die het oplost (C1–C8 uit §1.4). De test **faalt** op elke nieuwe onvoldoende combinatie. Bekende uitzonderingen faalt hij niet, maar meldt hij **apart** in een blok `UITZONDERINGEN (n)` in de uitvoer. Een uitzondering die inmiddels wél voldoet, wordt ook gemeld ("mag uit de lijst").
- **Aanvullend, alleen melden:** de visuele capture krijgt een DOM-steekproef. Per zichtbare tekst wordt de werkelijke voorgrond- en achtergrondkleur bepaald (via de voorouders, inclusief transparantie). Zo'n meting is bij verlopen en afbeeldingen een benadering, dus faalt ze niet maar verschijnt ze als lijst in het rapport.

### 7.3 Tikvlaktest (`tests/core/tap.mjs`, nieuw in 4C-0)

- Draait op **320×568, 360×640, 375×667 en 390×844**, in alle scenario's van de visuele test.
- **Controleert:**
  1. geen twee bedienbare elementen overlappen elkaar, inclusief hun eventuele `::after`-tikvlak;
  2. een element onder 44 px claimt nooit meer dan de helft van de ruimte naar zijn buur;
  3. elk interactief element dat zichtbaar is, is ook echt aanklikbaar (`elementFromPoint` op het midden).
- **Uitvoer:** in 4C alleen melden (nu zijn er 6 tot 55 kleine elementen per breedte die niet veilig kunnen groeien). Vanaf 4D: falen bij nieuwe overlap, met een uitzonderingenlijst voor wat bewust zo blijft.

## 8. Risico's en visuele impact

| Risico | Kans | Gevolg | Maatregel |
|---|---|---|---|
| **Specificiteit door 214× `!important`**: een token in een basisregel wordt overstemd door een latere override | hoog | token lijkt niet te werken | tokens juist **in** de override-regels zetten. Visuele vergelijking vangt elk verschil. |
| **Thema-lek** bij het samenvoegen van themaregels | middel | verkeerde kleuren in één themacombinatie | 4C-0 voegt "automatisch" toe aan de test, plus de twee kruiscombinaties (bestond al in de checklist). |
| **"Automatisch donker" valt buiten de 4A-baseline** | zeker | verschil niet zichtbaar in de huidige test | 4C-0. |
| **Inline stijlen in JS** (±820) worden niet door tokens geraakt | zeker | delen van de app houden hun eigen waarden | bewust: 4X is optioneel. De teltest laat zien hoeveel er nog over is. |
| `color-mix()` / nieuwe CSS niet op oudere iPhones | laag | kleuren weg | **niet gebruiken**: alle transparanten als vaste `rgba()`-tokens. |
| Flow Text bij 11 px slecht leesbaar | middel | kleine tekst blijft lastig | minimum 11 px; op de echte iPhone controleren (kan de test niet). |
| iPad liggend krijgt de kantine-indeling | zeker (nu al zo) | tablet in de hand voelt als kantinescherm | **niet** aanpassen in 4C; K6 eerst; 4C-0 legt beide tabletmaten vast. |
| Contrasttest geeft valse meldingen bij verlopen en transparantie | middel | ruis | parentest = deterministisch en faalt alleen daar; DOM-steekproef alleen melden. |
| Groter tikvlak steelt tikken van een buur | middel (bij spelbalk/numpad zeker) | verkeerde invoer tijdens een potje | alleen chips via `::after` met halve-ruimte-grens; tikvlaktest; spelbalk/numpad via indeling in 4D. |
| Spelkleur per ongeluk vervangen door UI-token | middel | team- of bordkleur verandert | groepen C/D en lijst X1–X10 zijn uitgesloten van 4C-2; compare = 0 vangt het. |
| Grote diff, lastig te reviewen | middel | fouten glippen erdoor | kleine commits per schermgroep, elk met compare = 0. |

**Visuele impact per fase:**
- **4C:** geen zichtbare verandering. Dat is de eis, en de compare moet 0 verschillen geven.
- **4D:** zichtbaar, maar klein en gericht. Grootste zichtbare punten: K1 (donkere kaarten), kantine-indeling voor Halve It, Eliminatie, Cricket en Afgooien, accentlabels iets lichter in donker (`#E07A55`), chips iets groter, de kleinste teksten 1–2 px groter.

---

## 9. Keuzes voor Tom

**K1–K5 zijn vastgelegd als Toms voorkeursrichting (23-11-2026).** Uitvoeren gebeurt pas in 4D, per punt met een verschilrapport en een apart akkoord.

| # | Onderwerp | Voorkeursrichting (vastgelegd) |
|---|---|---|
| K1 | Donkere kaarten | doorschijnend (zoals "automatisch" nu) |
| K2 | Grijsfamilie | warm overal |
| K3 | Waarschuwingskleur | eigen amber `#D08A2E`, alleen als tekst/rand (wit erop haalt maar 2,85) |
| K4 | Status-groen/-rood | huisgroen en `#FF3B30`/`--danger-text` overal, ook in meldingen; iOS- en Tailwind-kleuren eruit |
| K5 | Dartbordkleuren | Halve It-tinten `#D9232D` / `#1E7E34` voor badges en bord |

**Nieuwe open vragen (nodig vóór 4D, niet voor 4C):**

| # | Vraag | Opties | Mijn advies |
|---|---|---|---|
| **K6** | Wat moet een **iPad liggend (1024×768)** krijgen? | (a) kantine-indeling zoals nu; (b) telefoonindeling in de 760-kolom; (c) eigen tabletindeling; (d) een instelling "Kantinescherm" in Weergave, standaard aan vanaf 1200 breed | **(d)**: de app kan niet betrouwbaar zien of een scherm aan de muur hangt. Een schakelaar plus een veilige standaard is eerlijker dan gokken op pixels. Eerst wil ik van je weten of iemand de app op een iPad gebruikt. |
| **K7** | Groot doelgetal op donker (C1, 2,78) | (a) in donker `#E07A55` voor het getal; (b) zo laten | **(a)**: het getal moet vanaf de oche te lezen zijn. Het blijft herkenbaar terracotta, alleen lichter. |
| **C7** | Teamkleur `#2E8B9A` met witte letter (3,98) | badge-tekst groter, of accepteren | accepteren als uitzondering: het is één letter of cijfer, en de kleur is herkenning |

---

## 10. Planning (gevolgen van deze herziening)

| Fase | Was | Nu | Effect |
|---|---|---|---|
| 4C-0 | visuele test uitbreiden + kleurenteller | + contrasttest met paren en uitzonderingen, + tikvlaktest op 4 breedtes, + tablet- en automatisch-opnames | **groter**: ±1 sessie extra |
| 4C-1 t/m 4C-3 | onveranderd | onveranderd, maar groepen C/D en X1–X10 expliciet buiten de vervanging | gelijk |
| 4C-4 | verplicht | vervallen → 4X optioneel | **kleiner**: 4C is daarmee per saldo kleiner dan in herziening 1 |
| Visuele test | 672 opnames, ±15 min per kant | ±1040 opnames (+ automatisch: 46 × 2 talen × 2 systeemstanden op 390×844; + tablet: 46 × 2 maten × 2 thema's NL). Volledige compare ±50 min, `--quick` ±10 min | per 4C-2-commit `--quick`; vóór afronding van elke 4C-stap de volledige run |
| 4D | één blok | per punt; volgorde voorstel: C1/K7 (contrast doelgetal), H1/I13 (Halve It zwart vlak), H2/H3 (onder de spelbalk), tikvlakken spelbalk/numpad, K1–K5, kantine M1/M2, K6 tablet | |

**Wat ik na akkoord als eerste doe:** 4C-0 (alleen tests). Daarna stop ik en laat ik de eerste rapporten zien (contrast, tikvlakken, tablet- en automatisch-opnames), vóór 4C-1.
