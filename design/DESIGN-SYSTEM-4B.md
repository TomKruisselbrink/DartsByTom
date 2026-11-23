# Darts by Tom: ontwerpsysteem (fase 4B, voorstel)

Stand: v252 (`main` = `4785a1f`, visuele referentie `faf50f0`). **Dit is een voorstel. Er is niets aan de app veranderd.**
Skills: Product-Grade App Builder **v1** is als skill geladen. **v2** is in deze sessie niet geïnstalleerd; ik heb alleen het eerder gedeelde SKILL.md-bestand als leidraad gebruikt.

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

### 1.4 Contrast (WCAG AA = 4,5 voor gewone tekst, 3,0 voor grote tekst/iconen)

| Combinatie | Ratio | Oordeel |
|---|---|---|
| Accent `#B94E2A` als tekst op donkere kaart `#2C2C2E` | **2,78** | onvoldoende (gebeurt bij kleine accentlabels) |
| Huisgroen `#3E7B4F` als tekst op donkere kaart | **2,75** | onvoldoende |
| `--danger #FF3B30` op donkere kaart | 3,93 | alleen voor groot |
| Accent op lichte kaart `#F2EEE9` | 4,34 | net onvoldoende voor kleine tekst |
| Huisgroen op lichte kaart | 4,38 | net onvoldoende |
| `#9DBF9E` (accent2) op licht | **1,75** | nooit als tekst op licht |
| Muted op donkere kaart (`#98989F`) | 4,86 | goed |
| Muted op lichte kaart (`#6B6560`) | 4,97 | goed |
| Wit op accent / wit op huisgroen | 5,02 / 5,06 | goed |
| `#E07A55` op donker / `#A8431F` op licht | 4,70 / 5,21 | goed: dit zijn de bestaande setup-tekstkleuren |
| `#8FCB9C` op donker / `#2F6B40` op licht | 7,43 / 5,52 | goed |
| `#FF7A6B` op donker / `#B3261E` op licht | 5,47 / 5,66 | goed |

**Conclusie:** de oplossing bestaat al in de code (setup gebruikt aparte tekstvarianten van accent en groen). Het systeem moet die alleen overal gebruiken: een **vulkleur** en een **tekstkleur** per merkkleur.

### 1.5 Wat goed is en blijft

- **Terracotta als enige accent** met de betekenis "actie / aan de beurt". Herkenbaar en niet generiek.
- **Huisgroen voor raak, winst en toernooi**: samen met terracotta de kleuren van een dartbord.
- **Het donkere verloop** zwart → `#381000` → `#0f2e10` en de **lichte gloed** (rood linksboven, groen rechtsonder): de sfeer van een café-oche, geen dashboard.
- **De twee eigen fonts**: Flow voor titels en grote getallen, Flow Text voor tekst. Hét herkenningspunt.
- **De 3D-toetsen** (`--k-*`): voelen als echte knoppen. Houden als apart onderdeel.
- **Schalen met de ruimte** (`clamp()` met `vh`, `cqh`, `cqw` en container queries) in X01, oefenspellen en Random Checkout. Dat is de juiste techniek; het systeem maakt er vaste stappen van.
- **De zwevende spelbalk en invoer onderaan bij de duim.**

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

### 3.1 Kleur: basispalet (vaste waarden, niet per thema)

| Token | Waarde | Herkomst / vervangt |
|---|---|---|
| `--terra-300` | `#E07A55` | `--su-orange-text` (donker), toast-varianten |
| `--terra-500` | `#B94E2A` | `--accent`, 47× hard `#B94E2A` |
| `--terra-600` | `#A8431F` | `--setup-accent-text` licht, `--su-orange-text` licht |
| `--terra-700` | `#9A3F22` | ingedrukte accentknop |
| `--green-300` | `#8FCB9C` | `--su-green-text` donker, `.co-lbl` donker |
| `--green-400` | `#5E9E6E` | groene hover/rand (+ `#6FBF85`, `#6BA372`, `#559160` samengevoegd in 4D) |
| `--green-500` | `#3E7B4F` | huisgroen, 22× hard |
| `--green-600` | `#2F6B40` | groene tekst licht |
| `--green-700` | `#1E5631` | `.x-last`, `.sp-tag` licht |
| `--sage-300` | `#9DBF9E` | `--accent2`, `--info` |
| `--red-300` | `#FF7A6B` | miss-tekst donker (+ `#FF8A7A`) |
| `--red-500` | `#FF3B30` | `--danger` |
| `--red-700` | `#B3261E` | miss-tekst licht |
| `--amber-500` | `#D08A2E` | **nieuw als betekenis** (bestaat al als teamkleur). Voor waarschuwingen (keuze K3) |
| `--board-red` | `#D9232D` | dartbadges `#cc2222` + Halve It-bord `#D9232D` (keuze in 4D) |
| `--board-green` | `#1E7E34` | badges `#16a34a` + bord `#1E7E34` |
| `--board-single` | `#374151` / `#4B5563` | single-badges (twee tinten voor rood- en groen-sector) |
| Neutraal warm | `#1A1714` `#141314` `#6B6560` `#A8A09A` `#C9BFB8` `#D9D1CB` `#F3EDE8` `#F4F1ED` | setup + licht thema |
| Neutraal koel | `#000` `#1C1C1E` `#2C2C2E` `#3A3A3C` `#48484A` `#636366` `#8E8E93` `#98989F` `#E5E5EA` `#F2F2F7` `#FFF` | spelschermen donker, iOS-schakelaars |

Teamkleuren (`#B94E2A #3E7B4F #5B6CCF #D08A2E #7A5BB5 #6E7781 #2E8B9A`) blijven een **aparte set** `--team-1 … --team-7`: dat is data-kleur (wie is wie), geen UI-kleur.

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
- Elke nieuwe combinatie ≥ 4,5 (tekst) of ≥ 3 (grote cijfers ≥ 24 px, iconen). Een test controleert dit (zie §7).

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

### 5.3 Chip (`.chip`)

Eén component voor `.chip`, `.lb-chip`, `.known-name-btn`, `.gc-btn` (I9): hoogte 36 zichtbaar, **tikvlak 44** (padding of `::after`-uitbreiding), hoek `--r-pill`, tekst `--fs-small`/`--fs-body` 700. Staten: rust `--card`, actief `--accent` + `--text-on-fill`, gekozen-zacht `--accent-soft` + `--accent-text`. `.g-chip` (groene doel-chip in spel) is een **tag**, geen chip: zie 5.9.

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
| **Tablet** (600–999 breed, of staand ≥ 768) | `min-width:600px` | Inhoud max. **560 px** breed en gecentreerd (nu rekt alles uit), spelschermen als telefoon maar met grotere toetsen. **Nog niet getest**: 768×1024 en 1024×768 komen in de visuele test. Let op: een iPad liggend (1024×768) valt nu al in de kantine-layout (≥ 1000). Dat is goed, maar moet gemeten worden. |
| **Kantinescherm** (liggend, ≥ 1000 breed) | `(orientation:landscape) and (min-width:1000px)` | Twee kolommen: links wat je **op afstand leest** (score, doel, spelers), rechts de **invoer** (max. 520 px). Alle UI-tekst ×1,25 via `--ui-scale`, minimum 14 px. Niet-spelschermen: kolom max. 720 px, ook geschaald. |

### 6.2 Breekpunten

CSS-variabelen werken niet in media queries, dus dit zijn vaste afspraken in de documentatie:

| Naam | Query | Nu |
|---|---|---|
| `compact-h` | `(max-height:700px)` | 700 (+ 740, 780 voor X01: samenvoegen in 4D) |
| `narrow` | `(max-width:420px)` | 420 |
| `tablet` | `(min-width:600px)` | `max-width:600` (omgekeerd gebruikt) |
| `kantine` | `(orientation:landscape) and (min-width:1000px)` | idem |

### 6.3 Regels

1. **Spelschermen meten, niet raden:** vrije ruimte via container queries (`cqh`/`cqw`), zoals al gedaan bij X01 en oefenspellen. Geen vaste pixelhoogtes voor doel of score.
2. **Nooit iets belangrijks onder de spelbalk:** `padding-bottom` van de inhoud = hoogte spelbalk + `--sp-4` + `env(safe-area-inset-bottom)`.
3. **Kantine = andere indeling, geen uitgerekte telefoon.** Elk spel krijgt in liggend een grid. Halve It, Eliminatie, Cricket en Afgooien missen dat nu (4A H1/M1).
4. **Tikvlak ≥ 44** (chips ≥ 40 zichtbaar, 44 tikbaar), ook op het kantinescherm met touch (de Evolve).
5. **Veilige marges** (`env(safe-area-inset-*)`) blijven overal waar ze nu staan.

---

## 7. Migratie

Het principe: **eerst onzichtbaar, dan zichtbaar, en elke stap bewezen met de visuele vergelijking tegen `faf50f0`.**

| Stap | Wat | Verwacht verschil | Bewijs |
|---|---|---|---|
| **4C-0** | Visuele test uitbreiden (additief, de referentie `faf50f0` blijft): thema **automatisch** (donker en licht systeem) en **tablet** 768×1024 / 1024×768. Plus een test die hardgecodeerde kleuren buiten het tokenblok telt (mag alleen dalen). | geen (alleen meer opnames) | n.v.t. |
| **4C-1** | Tokenblok toevoegen in `:root` met **exact de huidige waarden**, nog door niets gebruikt. Oude namen worden aliassen. | **0 pixels** | volledige compare = 0 verschillen |
| **4C-2** | Hardgecodeerde waarden vervangen door tokens met **dezelfde waarde**: eerst kleuren, dan hoeken, schaduw, z-index, ruimte, lettergrootte. Per schermgroep een commit. | **0 pixels** | compare per stap = 0 |
| **4C-3** | Dubbele themaregels samenvoegen (I3): componenten alleen nog tokens. | 0 pixels bij gekozen thema; automatisch volgens K1 | compare incl. "automatisch" |
| **4C-4** | Inline stijlen in JS-strings stap voor stap naar klassen, alleen in functies die toch al aangeraakt worden. `html-sinks` blijft groen, geen data aanraken. | 0 pixels | compare + `npm test` |
| **4D** (apart akkoord) | De zichtbare verbeteringen, elk als losse wijziging met verschilrapport: K1–K5, contrastfix (accent-tekst), afronden op de schaal, chips 44 tikbaar, minimaal 11 px, `:focus-visible`, z-index-correcties, de 4A-bugs H1–H3 en M1/M2 (kantine), toastkleuren. | bedoeld, per stap door Tom goedgekeurd | verschilrapport + nieuwe referentiecommit |

Afspraken voor elke stap:
- `APP_VERSION` +1 alleen bij een release naar `main`. 4C-stappen kunnen samen in één release.
- Geen gegevens, geen spellogica, geen veldnamen aanraken.
- De goedgekeurde referentie blijft `faf50f0`. Een nieuwe referentie komt pas na Toms akkoord op een 4D-verschil, en altijd als een **nieuwe** commit, nooit als overschrijving.

---

## 8. Risico's en visuele impact

| Risico | Kans | Gevolg | Maatregel |
|---|---|---|---|
| **Specificiteit door 214× `!important`**: een token in een basisregel wordt overstemd door een latere override | hoog | token lijkt niet te werken | tokens juist **in** de override-regels zetten. Visuele vergelijking vangt elk verschil. |
| **Thema-lek** bij het samenvoegen van themaregels | middel | verkeerde kleuren in één themacombinatie | 4C-0 voegt "automatisch" toe aan de test, plus de twee kruiscombinaties (bestond al in de checklist). |
| **"Automatisch donker" valt buiten de 4A-baseline** | zeker | verschil niet zichtbaar in de huidige test | 4C-0. |
| **Inline stijlen in JS** (±820) worden niet door tokens geraakt | zeker | delen van de app blijven oude waarden houden | 4C-4 en de teltest. Geen grote verbouwing in één keer. |
| `color-mix()` / nieuwe CSS niet op oudere iPhones | laag | kleuren weg | **niet gebruiken**: alle transparanten als vaste `rgba()`-tokens. |
| Flow Text bij 11 px slecht leesbaar | middel | kleine tekst blijft lastig | minimum 11 px; op de echte iPhone controleren (kan de test niet). |
| Tablet-layout onbekend | middel | uitgerekte schermen op iPad | 4C-0 meet het eerst; ontwerp pas daarna. |
| Grote diff, lastig te reviewen | middel | fouten glippen erdoor | kleine commits per schermgroep, elk met compare = 0. |

**Visuele impact per fase:**
- **4C:** geen zichtbare verandering. Dat is de eis, en de compare moet 0 verschillen geven.
- **4D:** zichtbaar, maar klein en gericht. Grootste zichtbare punten: K1 (donkere kaarten), kantine-indeling voor Halve It, Eliminatie, Cricket en Afgooien, accentlabels iets lichter in donker (`#E07A55`), chips iets groter, de kleinste teksten 1–2 px groter.

---

## 9. Keuzes voor Tom (vóór 4D, niet nodig voor 4C)

| # | Vraag | Opties | Mijn advies |
|---|---|---|---|
| **K1** | Donkere kaarten: doorschijnend (wat "automatisch" nu laat zien) of dicht grijs (wat "Donker" kiezen nu laat zien)? | doorschijnend / dicht | **Doorschijnend.** Dat is wat de meeste gebruikers nu zien, en het verloop (rood/groen) schijnt erdoor. Dat is de dartbord-sfeer. |
| **K2** | Eén grijsfamilie? | warm overal / koel overal / zo laten | **Warm overal.** Het lichte thema en setup zijn al warm en passen bij terracotta. In donker is het verschil klein (muted `#98989F` → `#A8A09A`). |
| **K3** | Waarschuwingskleur | eigen amber `#D08A2E` / accent blijven | **Amber.** Terracotta betekent "jouw beurt"; een waarschuwing mag daar niet op lijken. |
| **K4** | Status-groen en -rood | huisgroen en `#FF3B30` overal, iOS- en Tailwind-kleuren eruit | **Ja**, ook in de meldingen. |
| **K5** | Dartbordkleuren | Halve It-tinten (`#D9232D`/`#1E7E34`, dieper) / badgetinten (`#cc2222`/`#16a34a`, feller) | **Halve It-tinten**: echter bordrood en -groen, en wit erop haalt beter contrast. |
