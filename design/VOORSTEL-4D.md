# Voorstel fase 4D: zichtbare verbetering van Darts by Tom

Stand: 24-11-2026. Basis: `feat/fase4c-3` (`6e10c53`). Nieuwe branch: **`feat/fase4d`**, gemaakt vanaf `6e10c53` (gecontroleerd: 4C-2 en 4C-3 zitten erin; `main` = `4785a1f` blijft onaangeroerd). Vaste nulmeting: `faf50f0`.
**Dit is alleen een voorstel. Er is niets aan de app veranderd.**

Richtlijn: Product-Grade App Builder v2 is in deze omgeving geen geïnstalleerde skill; ik volg het eerder gedeelde SKILL.md als leidraad, v1 (geïnstalleerd) voor de audit. De metingen hieronder komen uit de huidige code op 375×667, 390×844, 1024×768 en 1920×1080, plus de nulmetingen van 4C-0 t/m 4C-3.

---

## 1. Ontwerpvisie: "Het scorebord aan de oche"

### 1.1 Wie, waar, op welke afstand

| Afstand | Wie | Wat moet daar werken |
|---|---|---|
| **30 cm** (telefoon in de hand) | de speler die invoert | invoer: snel, foutbestendig, met de duim, zonder te mikken |
| **2,4 m** (de oche) | de speler die gooit en zijn tegenstander | resterende score van wie gooit, wie aan de beurt is, de uitgooi-route |
| **4–6 m** (kantinescherm aan de muur) | publiek, volgende spelers | stand van de wedstrijd: wie, score, legs/sets, wie gooit |

Elke keuze in 4D wordt getoetst aan die drie afstanden. Wat op geen van de drie iets toevoegt, krijgt minder nadruk of verdwijnt naar een onderblad.

### 1.2 Vijf principes (vervolg op 4B "Oche, geen dashboard")

1. **Drie lagen, altijd in dezelfde volgorde.** Laag 1 (op afstand leesbaar): score van wie gooit, beurtmarkering, uitgooi-route of doel. Laag 2: stand van de wedstrijd (legs/sets, scores van de anderen). Laag 3: meta (gemiddelde, format, beurtnummer). Laag 3 is nooit groter of feller dan laag 2.
2. **Terracotta betekent één ding: "aan de beurt / doe dit".** Vulkleur alleen voor de primaire actie (↵, Opslaan) en de beurtmarkering. Tekst in accent altijd via `--accent-text` (lost C1/C11 op). Nu wordt terracotta ook gebruikt voor de naam, de 180-snelscore, Cricket-marks en gekozen segmenten; daardoor concurreert alles met de beurt.
3. **Dartbordkleuren dragen status.** Rood = dubbel/mis/gevaar, groen = raak/gewonnen/treble, zwart/crème = bord. Eén rood en één groen (K4/K5), niet drie tinten per kleur.
4. **Flow voor getallen, Flow Text voor woorden.** Drie getalniveaus (score, sub-score, stat) die per context meeschalen; tekst nooit onder het minimum (K12).
5. **Zelfde componenten, andere opstelling.** Telefoon, tablet en kantinescherm gebruiken dezelfde spelerskaart, toetsen, route en spelbalk. Alleen de opstelling en de schaal verschillen. Een kantinescherm is een **scorebord**, geen uitgerekte telefoon.

### 1.3 Hoe de onderdelen één ontwerp vormen

| Onderdeel | Afspraak | Hoe het de herkenning draagt |
|---|---|---|
| Visuele hiërarchie | 3 lagen (§1.2.1), per scherm uitgeschreven | elke spelscherm leest hetzelfde: boven wie/stand, midden het getal, onder de invoer |
| Componenten | spelerskaart, doel/route, toets, snelscore, spelbalk, onderblad, chip, segment, tag: één versie per component (I8/I9) | dezelfde vorm betekent overal hetzelfde |
| Typografie | Flow (titels, getallen), Flow Text (tekst), schaal uit het tokenblok, contextfactor voor kantine | het eigen font is hét herkenningspunt; het mag nergens onleesbaar klein zijn |
| Kleur en contrast | terracotta = beurt/actie, bordkleuren = status, warm grijs (K2), alles ≥ WCAG AA (C1–C11 dicht) | rustig donker café-gevoel, maar elke kleur betekent iets |
| Ruimte en uitlijning | 4-px-raster (`--sp-*`), kaarten op één lijn, inhoud eindigt altijd boven de spelbalk | geen "zwevende" losse blokken, geen leeg zwart vlak |
| Touch | ≥ 44 px tikvlak, ≥ 8 px tussen spelknoppen en de spelbalk, geen onzichtbare zones op spelknoppen | foutloze invoer tijdens een potje |
| Responsief | 3 contexten (§6), opstelling per context, schaal per afstand | telefoon, tablet en kantine voelen als dezelfde app |

Wat we bewust **niet** doen: geen nieuwe fonts of accentkleur, geen glas- of verloopeffecten op knoppen, geen nieuwe animaties, geen frameworkwijziging, geen spelregel- of opslagwijziging.

---

## 2. Overzicht van schermen en componenten

### 2.1 Schermen

| Groep | Schermen | Scenario's in de visuele test |
|---|---|---|
| **A. Actieve spelschermen** | X01 (2–6 spelers), X01 teams, Cricket, Shanghai, ATC, Bob's 27, 121, Random Checkout, Halve It, Eliminatie, Afgooien (+ bullronde, nummers) | x01-2sp, x01-4sp, x01-teams, cricket, shanghai, atc, bobs27, checkout121, randomco(-uitgegooid), halveit, eliminatie, afgooien(-bull/-nummers) |
| **B. Rond het spel** | spelbalk, onderbladen (stats, rondes), double-vraag, dubbel kiezen, potje afronden, bevestig stop, hervatten, winst/verlies, rematch, toernooi wie begint | x01-double-vraag, x01-dubbel-kiezen, x01-stats-blad, potje-afronden, bevestig-stop, hervatten, winst, verlies-solo, rematch, toernooi-wie-begint |
| **C. Setup** | stap 1 spelkeuze, stap 2 regels (per spel), stap 3 spelers | setup-1, setup-2-x01/-afgooien/-halveit/-randomco, setup-3-spelers |
| **D. Overzichten** | home, statistieken, geschiedenis (+ detail, rondes/eindstand corrigeren), ranglijst, toernooi (setup, overzicht, stand) | home(-leeg), statistieken(-x01), geschiedenis(-detail), rondes-corrigeren, eindstand-corrigeren, ranglijst, toernooi-* |
| **E. Instellingen** | menu, account, vrienden, spelers, spel & geluid, weergave, gegevens, updates | inst-*, instellingen, update-banner, ios-uitleg |

### 2.2 Componenten (gedeeld; één wijziging werkt door in meerdere schermen)

| Component | Klassen nu | Gebruikt in | Samenhang |
|---|---|---|---|
| Spelerskaart | `.x-card(.on)`, `.g-prow(.on/.out)` | alle spelschermen | **kern**: beurtmarkering, naam, score, legs |
| Doel / route | `.g-target(-big)`, `#checkout-strip`, `.co-big`, badges | X01, oefenspellen, RCO, Halve It | C1, K5, K7 |
| Toets (3D) | `.x01-pad .btn`, `.g-keys button`, `.g-big3`, `.bob-keys`, `.hi-k` | alle invoer | F3, C11 (180), tikvlakken |
| Snelscore | X01-snelscores | X01 | tikvlakken 320 |
| Spelbalk | `#game-controls`, `.gc-btn` | alle spelschermen | C10, H2/H3/M3, tikvlakken |
| Onderblad / venster | `openGameSheet`, `_askConfirm`, overlays | groep B | I11, H2 |
| Segment | `.seg-ctrl`, `.g-seg`, `.segment` | setup, Cricket, RCO | I8 |
| Chip | `.chip`, `.lb-chip`, `.lb-sub`, `.known-name-btn`, `.gc-btn` | setup, ranglijst, stats | I9, M5 |
| Tag | `.g-chip`, `.sp-tag`, `.x-last`, Win/Verlies | overal | F2 |
| Melding | `showToast` | overal | K4/C8, I11 |
| Schakelaar | `.ios-toggle` | instellingen | F1 |
| Navigatie | `#pill-nav` | groep C–E | tikvlakken |

---

## 3. Inventaris: fouten en keuzes

### 3.1 Fouten (moeten opgelost; geen ontwerpkeuze nodig, wel een verschilrapport)

| # | Wat | Waar | Stap |
|---|---|---|---|
| F1 | ingeschakelde schakelaar grijs in automatisch donker | instellingen | 8 |
| F2 | "Verloren" groen in licht, rood in donker → rood in beide | winst/verlies | 5 |
| F3 | Mis-knop in toetsengroep wit in donker, rood in licht → `--danger-text` in beide | Bob's 27 e.a. | 2 |
| C2 | muted direct op lichte achtergrond 4,25 | sectielabels licht | 4 |
| C3 | accent-tekst direct op lichte achtergrond 4,45 | links/labels licht | 4 |
| C5 | wit op danger 3,55 (regel: geen kleine witte tekst op danger) | knoppen | 4 (controle) |
| C10 | rode Stop in lichte spelbalk 3,37 → `--danger-text` | spelbalk | 1b |
| C11 | accent als kleine tekst 2,78 (actieve naam, 180-toets, winstscherm-cijfers) → `--accent-text` | X01, winst | 1a/1b/5 |
| H1/I13 | Halve It: zwart vlak als het scherm hoger is dan de inhoud | Halve It, alle grote schermen | 3 |
| H2 | X01-stats-onderblad valt onder de spelbalk | X01 | 1d |
| H3/M3 | onderste knoppen onder de spelbalk zonder scrollen: Cricket (SE), Shanghai/Bob's 27/121/RCO met 4 spelers | spelschermen | 2 |
| Tik | NL 71/21/20/7 en EN 70/20/19/7 bevindingen (320/360/375/390); EN-overlap "Save" bij Rondes corrigeren al op 360 (NL op 375/390) | zie §3.3 | per stap |
| M4 | Killer heet in setup stap 1 nog "Bouw 5 punten" | setup | 6 |
| M5 | chips/filters < 40 px | ranglijst, stats, setup | 6/7 |
| M6 | tekst < 11 px (X01 heeft er nu 3–6 van 10 px) | diverse | per stap |
| I11 | melding valt onder het bevestigvenster (z-index) | overal | 5 |
| I12 | geen `:focus-visible` | overal | 8 |
| L2 | "Installeer op deze computer" ook op de telefoon | instellingen | 8 |
| L3 | lange Halve It-doelen ("3 different colours") afgesneden in de doelenrij | Halve It | 2 |
| L1 | groepscode-kaart in Gegevens | instellingen | **niet in 4D** (fase 6, staat in §11) |

### 3.2 Ontwerpkeuzes (Tom beslist; mijn advies erbij)

**Al vastgelegd als voorkeursrichting (23-11):** K1 doorschijnende donkere kaarten, K2 warm grijs overal, K3 amber `#D08A2E` alleen als tekst/rand (C4: `#80530F` in licht), K4 huisgroen en `#FF3B30`/`--danger-text` overal ook in meldingen (lost C8 op), K5 bordkleuren `#D9232D`/`#1E7E34` (lost C6 op). Uitvoering in stap 4, met verschilrapport.

**Open, nodig vóór de stap waar ze genoemd staan:**

| # | Vraag | Opties | Advies | Nodig vóór |
|---|---|---|---|---|
| **K7** | Groot doelgetal en accenttekst op donker (C1/C11) | (a) `--accent-text` `#E07A55` voor getal en tekst; vulkleur blijft voor knoppen; (b) zo laten | **(a)**: leesbaar vanaf de oche, blijft herkenbaar terracotta | 1a |
| **K8** | Beurtmarkering op de spelerskaart | (a) zoals nu: terracotta vlak + accentnaam; (b) terracotta rand + gloed + gevuld bolletje + label "gooit", naam in gewone tekstkleur | **(b)**: niet alleen kleur (ook vorm en woord), lost C11 op, beter leesbaar op afstand | 1a |
| **K9** | Legstand in X01 | (a) bolletjes zoals nu (8 px, lichtgrijs); (b) cijfer in Flow ("Legs 2", bij sets "S1 · L2"), bolletjes alleen als extra bij first-to ≤ 5 | **(b)**: nu op 2,4 m onleesbaar en op het kantinescherm ontbreekt de stand feitelijk | 1a |
| **K10** | Minimale schermbreedte | (a) 320 (iPhone SE 1e gen./5s) volwaardig; (b) 360 volwaardig, 320 "bruikbaar" (geen overlap, scrollen mag) | **(b)**: 320 levert 71 van de tikvlakbevindingen; volwaardig maken kost ruimte op alle telefoons. Weet jij of iemand nog zo'n toestel gebruikt? | 1b |
| **K6** | Tablet liggend (1024×768) en kantine | (a) zoals nu: alles ≥ 1000 liggend = kantine; (b) **opstelling en schaal scheiden**: grid-opstelling vanaf liggend ≥ 1000 (tablet én kantine), kantineschaal (×1,25, grotere koppen) pas vanaf 1600 breed **of** via schakelaar "Kantinescherm" in Weergave (automatisch/aan/uit); (c) eigen tabletindeling | **(b)**: de huidige grid werkt op 1024 al redelijk (gemeten), alleen de schaal hoort bij de afstand. Een schakelaar is eerlijker dan raden. | 1c |
| **K12** | Kleinste tekst (§11 "kleine tekst") | (a) minimum 11 px overal; (b) **12 px in spelschermen en onderbladen, 11 px elders; kantine minimum 15 px** | **(b)**: tijdens een potje kijk je kort en op afstand | 1a |
| **C7/C9** | Witte letter op speler-/teamkleur `#2E8C9A` (3,94) en `#D08A2E` (2,85) | (a) donkere letter op de lichte teamkleuren (`#D08A2E` + `#1A1714` ≈ 6,3); (b) letter ≥ 18,7 px vet; (c) accepteren | **(a) voor `#D08A2E`**, **(b) of (c) voor `#2E8C9A`**; de teamkleur zelf blijft (herkenning) | 2 |
| **K13** | Hoe test jij op je iPhone? | (a) **release per bundel** naar `main` (met jouw akkoord per bundel, `APP_VERSION` +1); (b) aparte previewmap op GitHub Pages; (c) alleen schermafbeeldingen tot het eind | **(a)**. (b) raad ik af: zelfde domein = zelfde `darts_db`, dus een preview draait op je echte gegevens. | einde stap 2 |

### 3.3 Tikvlakken per oorzaak

| Oorzaak | Bevindingen (NL / EN) | Oplossing | Stap |
|---|---|---|---|
| X01-snelscores te smal en onderste rij onder de balk, alleen 320 | 7+3 per X01-scenario | afhankelijk van K10 | 1b |
| Cricket/Shanghai onder de balk (320–375) | 4/4/3 · 3/1 (EN 3/2/2 · 3/1) | inhoud boven de balk (stap 2) | 2 |
| Random Checkout-numpad 38 hoog, onder de balk (320/360) | 11/11/8 + 3/1 | numpad-rij ≥ 44 met de indeling, niet met onzichtbare zones | 2 |
| Eliminatie-toetsen (320) | 7 | idem | 2 |
| Rondes/eindstand corrigeren: overlap "Opslaan/Save" × invulveld; keuzerondjes 18×18 | 1–2 per breedte, EN al op 360 | knop onder de lijst, rondjes in een label van 44 | 7 |
| Instellingen: `.ios-toggle` 51×31, label 23 hoog | 1–2 | hele rij tikbaar | 8 |
| Setup RCO (320) | 6 | segmenten (I8) | 6 |

---

## 4. Volgorde van implementatie

### 4.1 Overzicht

| Stap | Inhoud | Hangt af van | Los uit te voeren? | Bundel |
|---|---|---|---|---|
| **1** X01 (het actieve spelscherm) | 1a spelerskaart en beurt · 1b invoer en spelbalk · 1c tablet- en kantine-opstelling · 1d X01-onderbladen | K7, K8, K9, K12 (1a), K10 (1b), K6 (1c) | 1a–1d elk apart te keuren; 1b–1d bouwen op de componenten uit 1a | R1 |
| **2** Overige spelschermen (telefoon) | spelerskaart/doel/toetsen uit stap 1 naar Cricket, oefenspellen, RCO, Halve It, Eliminatie, Afgooien; H3/M3 (alles boven de balk op 375×667), F3, C1 overal, C7/C9 | stap 1a/1b | per spel apart | R1 |
| **3** Kantine-opstelling overige spellen | H1/I13 Halve It, M1 Eliminatie/Cricket/Afgooien, schaal volgens K6 | stap 1c, K6 | per spel apart | R2 |
| **4** Kleurbasis | K1–K5, C2, C3, C4 (bij invoering), C5-regel | — | **ja**, tokenwerk; los van stap 1–3 te doen | R2 |
| **5** Rond het spel | onderbladen, vensters, winst/verlies (F2, C11 cijfers, M7 knoppen), potje afronden, hervatten, rematch, meldingen (I11) | stap 1, 4 (K4) | grotendeels | R3 |
| **6** Setup | segment (I8) en chip (I9) als één component, M4, M5, M6, RCO-setup 320 | — | ja | R3 |
| **7** Overzichten | home, stats, geschiedenis, ranglijst, toernooi; kantinekolom geschaald (M2); EN-overlap Rondes corrigeren | stap 6 (chips) | per scherm | R3 |
| **8** Instellingen en toegankelijkheid | F1, `.ios-toggle`-rij, L2, `:focus-visible` (I12) overal | — | ja | R3 |

**Samenhang in één zin:** stap 1 legt de spelcomponenten vast die stap 2, 3 en 5 hergebruiken; stap 4, 6 en 8 zijn onafhankelijk en kunnen eerder of tussendoor; stap 7 gebruikt de chips uit stap 6.

**Kleine losse fouten** (C10, F1, F2, M4, L2, I11) kunnen op elk moment als losse commit, als je ze eerder wilt.

### 4.2 Werkwijze per stap

1. Werkvoorstel per stap (welke scenario's mogen veranderen, welke keuzes gelden) → jouw "ga".
2. Bouwen op `feat/fase4d`, kleine commits.
3. Controles (§5) en een verschilrapport met vóór/na per context (telefoon, tablet, kantine), NL/EN, licht/donker.
4. Jouw goedkeuring → de commit wordt de nieuwe referentie voor de volgende stap. `faf50f0` blijft de vaste nulmeting; per bundel komt er een cumulatief rapport t.o.v. `faf50f0`.
5. Pas na een bundel (R1/R2/R3) en jouw akkoord: `APP_VERSION` +1 en naar `main` (K13). Safari op je iPhone is per bundel verplicht.

---

## 5. Concrete eerste stap: 4D-1a "Spelerskaart en beurt" (X01)

### 5.1 Wat er nu is (gemeten, donker, NL)

| | 375×667 | 390×844 | 1024×768 | 1920×1080 |
|---|---|---|---|---|
| Score, 2 spelers | 42 px | 64 px | 110 px | 162 px |
| Score, 4 spelers | **26 px** | 42 px | 56 px | 96 px |
| Naam | 13 px | 13 px | 16 px | 21 px |
| Actieve naam | terracotta `#B94E2A`, **2,78** op de kaart (C11) | idem | idem | idem |
| Legstand | 3 bolletjes van **8 px**, `rgba(127,127,127,.3)` | idem | idem | idem |
| Kleinste tekst | **10 px** (6 elementen < 12) | 10 px | 10 px | **10 px** op een kantinescherm |
| Kop | 16 px ("Leg 1"), format in 12 px | idem | idem | **16 px op 1920** |

Wat de speler op de oche nu ziet: de score is groot, maar wie aan de beurt is leunt op kleur (terracotta vlak + terracotta naam), de legstand is onleesbaar en op het kantinescherm staat de stand van de wedstrijd nergens groot.

### 5.2 Wat 4D-1a verandert (bij advies K7–K9, K12)

```
 telefoon (390)                                   kantine (1920), opstelling blijft tot 1c
┌─────────────────────────────────────┐          ┌───────────────────────────────┬──────────────┐
│ 501 · double out · first to 3  Leg 1│          │ 501 · double out · ft3   Leg 1│  (route)     │
├──────────────────┬──────────────────┤          │ ┌──────────────┐┌────────────┐│  (invoer)    │
│ Tom        L 1   │▌● Henk gooit L 0 │          │ │Tom      L 1  ││▌● Henk  L 0││              │
│ 121              │▌ 140             │          │ │ 121          ││▌ 140       ││              │
│ T20→T11→D14  60  │▌ gem. —          │          │ └──────────────┘└────────────┘│              │
└──────────────────┴──────────────────┘          └───────────────────────────────┴──────────────┘
 ▌ = terracotta rand + gloed, ● = gevuld bolletje, "gooit" = woord; naam in gewone tekstkleur
```

| Onderdeel | Nu | Na 4D-1a |
|---|---|---|
| Beurt | terracotta vlak, naam in accent | terracotta rand + gloed (`--tile-shadow-on`), gevuld bolletje ≥ 10 px, label "gooit"/"throws" in `--accent-text`, naam in `--text` (K8) |
| Legstand | 8-px-bolletjes | "L 2" in Flow, laag-2-grootte; bij sets "S1 L2"; bolletjes blijven als extra bij first-to ≤ 5 (K9) |
| Score 4 spelers op SE | 26 px | ≥ 34 px: de kaartinhoud wordt compacter (route en gemiddelde op één regel), niet de score kleiner |
| Meta (gem., route bij de niet-actieve speler) | 10 px | ≥ 12 px in `--text-muted` (K12); route bij de niet-actieve speler blijft, maar in laag 3 |
| Contrast | C11 actieve naam 2,78 | alle tekst op de kaart ≥ 4,5 (getallen ≥ 3,0) in alle 4 themastanden |
| Kantine | kop 16 px, legstand onzichtbaar | kop en legstand meeschalen met de kaart (`clamp` op de bestaande schaalbasis); verdere opstelling in 1c |

**Raakt:** CSS van `.x-card`, `.x-name`, `.x-legs`, de meta-regel en de kop; in `renderGame` alleen het HTML-fragment voor de legstand en het label "gooit" (één nieuwe vertaling, `I18N`). **Raakt niet:** spellogica, `state`, opslag, invoer, bot, toernooi-logica (het toernooi gebruikt hetzelfde scherm en verandert dus mee).

**Mogen veranderen** (alles daarbuiten = fout): x01-2sp, x01-4sp, x01-teams, x01-double-vraag, x01-dubbel-kiezen, x01-stats-blad (achtergrond) en hervatten/rematch als die het X01-scherm tonen; alle viewports en themastanden van die scenario's.

---

## 6. Telefoon, tablet en kantine: geen verbetering ten koste van een ander

1. **Elke stap omvat alle drie de contexten van de schermen die hij raakt.** Een telefoonwijziging komt niet door zonder vóór/na-opnames op tablet (768×1024, 1024×768) en kantine (1280×800, 1920×1080) in het verschilrapport.
2. **De visuele vergelijking dekt alle contexten** (1253 opnames: 360, 375, 390, 430, tablet staand/liggend, 1280, 1920, NL/EN, licht/donker/automatisch). Een verschil in een context of scherm buiten de opgegeven lijst = stop.
3. **Eén regel per context, op een vaste plek.** Maten in de basisregel schalen met de ruimte (`clamp`/`cqh`/tokens); afwijkingen per context alleen in de vastgelegde breekpunten (`compact-h`, `narrow`, kantine/K6). Geen nieuwe losse media queries.
4. **Opstelling en schaal gescheiden (K6b).** Een tablet krijgt de grid-opstelling zonder kantineschaal; het kantinescherm krijgt de schaal. Zo verandert een schaalaanpassing voor de muur niets op een iPad.
5. **Metingen per context, niet alleen kijken:** score- en tekstgrootte, ruimte boven de spelbalk en "past zonder scrollen" worden per stap gemeten op 375×667, 390×844, 1024×768 en 1920×1080 en in het verslag gezet.
6. **Tikvlaktests NL én EN** op 320/360/375/390 moeten na elke stap minstens even goed zijn; opgeloste bevindingen gaan alleen met jouw akkoord uit de nulmeting.

---

## 7. Teststrategie per stap

| Controle | Wanneer | Eis |
|---|---|---|
| Visuele vergelijking t.o.v. de vorige goedgekeurde stap | elke commit `--quick`, elke stap volledig (1253) | alleen opgegeven scenario's veranderen; elk ander verschil = stop en melden |
| Cumulatief t.o.v. `faf50f0` | per bundel | rapport voor jou, geen eis |
| Berekende stijl (`design/verify_4c3.mjs`, 6 themastanden) | elke stap | verschillen alleen in de bedoelde elementen; geen thema-lekken in de kruiscombinaties |
| Contrast (`contrast.mjs`) | elke commit | geen nieuwe afwijking; opgeloste C-punten melden en **met jouw akkoord** uit `contrast.allow.json` |
| Tikvlakken NL + EN | elke stap | geen nieuwe bevinding; opgeloste met akkoord uit de nulmeting |
| `theme-rules` | elke commit | geen nieuwe uitzondering; E4–E6 verdwijnen zodra F1–F3 zijn opgelost |
| `tokens-ratchet` | elke commit | telling ≤ maximum; nieuwe kleuren alleen via tokens; maximum met akkoord omlaag |
| `npm test` + mutaties (21) | elke stap | groen / 21 gevangen |
| `html-sinks` | elke commit die `renderGame` e.d. raakt | groen (nieuwe HTML-fragmenten via `_esc`) |
| Spelgedrag | stap 1 en 2 | bestaande speltests groen; daarnaast een speeltest per spel (invoer, ongedaan, uitgooien, rematch) |
| Safari op een echte iPhone | per bundel, verplicht | checklist: beurtmarkering, legstand, alles boven de spelbalk, dubbeltik op toetsen, licht/donker/automatisch |

---

## 8. Wat ik van je nodig heb

1. Akkoord op de visie (§1) en de volgorde (§4).
2. Keuzes vóór stap 1: **K7, K8, K9, K12** (voor 1a), **K10** (voor 1b) en **K6** (voor 1c). K13 en C7/C9 mogen later.
3. Akkoord om met **4D-1a** te beginnen. Daarna stop ik met een verschilrapport en wacht ik op je goedkeuring vóór 1b.
