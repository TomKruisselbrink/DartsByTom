# Herstelronde 4D-1a: verschilrapport

**Basis**
- Branch `feat/fase4d`, vanaf `177e881`.
- Referenties: `faf50f0` (oorspronkelijke nulmeting) en `177e881` (4D-1a).

**Wat wel en niet is gewijzigd**
- Alleen de drie herstelpunten.
- Niet gewijzigd: spelregels, opslag, Firebase, sync, andere spellen.
- Niet gewijzigd: tokens, ratchets en bestaande allowlists (`contrast.allow.json`, `tap.known*.json`, `tokens-ratchet.json`, `html-sinks.allow.json`, `theme-rules.allow.json`).
- Toegevoegd:
  - twee gerichte testsuites;
  - vier mutaties.

Keuzes van Tom (24-11-2026, tijdens deze ronde gevraagd, omdat de eisen op de telefoon niet tegelijk haalbaar bleken):

| Vraag | Keuze |
|---|---|
| GOOIT-label bij 3–4 spelers op de telefoon | weglaten (zoals bij 5–6); tablet/kantine houden het |
| "niet uitgooibaar" | eigen regel, alleen als het geldt |
| legstand bij 3–4 spelers op de telefoon | eerst "bovenaan"; na de meting (actieve naam op 390 "T…", teamnamen weg) herzien naar **onderaan, alleen het cijfer** |

## Waarom de eisen botsten (gemeten)

Op 360 breed is een compacte kaart (3–4 spelers) 162 px. Daarvan is 138 px binnenruimte. Naast een driecijferige score (47 px) blijft 83 px tekstbreedte over (390: 76 px, door de grotere score).

Breedte per onderdeel (12/13 px, echte letter):

| Onderdeel | Breedte |
|---|---|
| naam | 25–31 |
| "legs 0" | 34,5 |
| GOOIT / THROWS | 50,3 / 65,6 |
| "niet uitgooibaar" / "no checkout" | 85,4 / 67,5 |
| "gem. 60.0" | 51,5 |
| " · " | 8,3 |

"Niet uitgooibaar" alleen al past op 360 niet naast de score. 4D-1a zette label, status en gemiddelde samen in de meta-regel naast de legstand: 40–48 px voor ~190 px tekst. `faf50f0` kapte "niet uitgooibaar · gem." in die compacte kaart ook al af.

## Herstelpunt 1: metaregel bij 3 of meer spelers

### Wijziging (`index.html`)

**Telefoon (< 600 px breed), 3+ spelers**
- Geen GOOIT-label.
- De actieve speler is herkenbaar aan:
  - terracotta rand, gloed en gevulde stip;
  - witte naam;
  - kop "BEURT TOM";
  - beurtregel "Tom gooit".

**Tablet en kantine, 3+ spelers**
- Het label staat in de **naamregel**, net als bij 1–2 spelers (was: in de meta-regel).
- Daardoor houdt de meta-regel zijn breedte voor gemiddelde en legstand.

**"niet uitgooibaar" / "no checkout", 3+ spelers**
- Eigen regel over de volle kaartbreedte (`.x-imp`, impliciete 4e rasterrij), alleen als de actieve speler niet kan uitgooien.
- Kleur `--text-soft`, 12 px, niets verkleind.
- Bij 3–4 spelers is het uitgooivak in die toestand altijd leeg. Daarom krimpt de minimale hoogte van dat lege vak met precies de regelhoogte (48 → 33,6 px, `.x-imp-on` op `#screen-game`), zodat de toetsen niet zakken. Niet in de liggende rasteropstelling.
- Bij 5–6 spelers op schermen ≤ 740 px hoog valt de regel weg, net als de hele meta-regel (bestaand gedrag sinds `faf50f0`).
- Op de kantine (≥ 1600 px) schaalt de regel mee met de meta-regel (15–24 px, K12).
  - In mijn eerste versie bleef hij daar 12 px, door dezelfde specificiteitsvalkuil als bij herstel 2.
  - Gevonden op het vergelijkingsblad, hersteld (`#sb-players .x-card .x-imp` in het kantineblok) en nu bewaakt in `x01-kaart.mjs`, met een eigen mutatie.

**Legstand, 3–4 spelers op de telefoon**
- Onderaan als cijfer (Flow, 17 px).
- Het woord "legs" is alleen voor schermlezers (visueel verborgen, niet verwijderd).
- 5–6 spelers: ongewijzigd (woord + cijfer naast de naam).

### Meting: afkapping

Gemeten op 360/375/390/768/1024/1920, NL/EN, met:
- 3, 4 en 6 spelers;
- teams;
- echte gemiddelden (71.5 en 150.5);
- sets;
- lange namen (Christiaan, Marieke, Annabel).

| Situatie | 177e881 | Herstel |
|---|---|---|
| actieve meta (gemiddelde / niet uitgooibaar) 3–4 sp, 360–390 | afgekapt ("GOOIT · g…", "nie…", EN: "no checkout" weg) | **volledig** ("gem. 71.5" + regel "niet uitgooibaar") |
| gemiddelde niet-actieve spelers met legstand, 390 | afgekapt (alle kaarten) | **volledig** |
| GOOIT/THROWS-pil afgesneden (EN, 3+ sp) | ja, 360–390 | **nee** (telefoon: geen label; tablet/kantine: binnen de naamregel) |
| 768/1024, toestand niet uitgooibaar | meta afgekapt | **volledig** |
| 6 sp 390 actieve meta | "THROWS · a…" | **volledig** ("gem. —" + regel) |
| sets, 3 sp, 360/375/768/1024 | meta afgekapt | **volledig** |
| **sets, 3 sp, 390, NL** | afgekapt | **nog afgekapt** bij de andere spelers, ±5 px ("gem. 7…"). Bekende rest, zie onder |
| namen (ook teams, lange namen) | volledig | **volledig** |

`tests/core/x01-kaart.mjs` (nieuw) bewaakt dit: 10 gevallen (NL/EN × 360/375/390/768/1024 × 7 standen).
- 177e881: zakt 9/10 (echte afkapping; alleen EN 768 was daar al goed).
- Herstel: slaagt.

### Meting: toetsen ↔ spelbalk (px; negatief = onder de balk)

Donker NL; EN is gelijk.

| Stand | 360 (177e881 → herstel) | 375 | 390 | 768 |
|---|---|---|---|---|
| begin leg, 3/4 sp, teams (niet uitgooibaar, geen routes) | 17 → 17 | 18 → 18 | 18 → 18 | 18 → 18 |
| 4 sp audit-stand (Tom 121, route in beeld) | −3 → −3 | 15 → 15 | 18 → 18 | 18 → 18 |
| midden in het potje, overal routes | −23 → −23 | −5 → −5 | 18 → 18 | 18 → 18 |
| **niet uitgooibaar + routes in beeld (4 sp)** | **−23 → −8** | **−5 → +9** | 18 → 18 | 18 → 18 |
| 6 sp begin / route | 5 → 5 | 18 → 18 | 18 → 18 | 18 → 18 |

- De toetsen zakken nergens.
- Nevenwerking (laatste rij), hoort bij dit herstelpunt: als de rij van de actieve kaart niet hoger wordt omdat er al een kaart met route naast staat, komt de vrijgemaakte ruimte van het lege uitgooivak ten goede aan de toetsen. Die staan dan 14–15 px hoger dan in 177e881.
- Bestaand en ongewijzigd: midden in een potje staan de toetsen op 360 (−23) en 375 (−5) onder de balk. In `faf50f0` was dat −21 / −3; 4D-1a maakte de kaart 75 → 76 px. Dat hoort bij 4D-1b (onderste rij 360×640).

### Kaarthoogtes (actieve kaart)

| Viewport | Begin leg, niet uitgooibaar | Met route ernaast |
|---|---|---|
| 360/375 | 56 → 70 | 76 → 76 (rij gelijk) |
| 390 | 68 → 82 | 76 → 82 |
| 768 | 84 → 99 | – |
| 1920 | 114 → 136 (regel op kantinemaat 18,4 px) | – |

### Score
De score is ongewijzigd: 34 px (360/375), 50 (390), 66,2 (768), 96 (1920) bij 4 spelers.

### Nevenwerkingen en restpunten
- **Sets + 3–4 spelers op 390, NL, gemiddelde ≥ 10.** Het gemiddelde van de andere spelers valt ±5 px te kort (twee cijfers + "gem. 71.5" = 81,5 px in 76 px). In 177e881 was dat op alle telefoonmaten zo. Bewust niet in de testmatrix, wel hier gemeld.
- **Losse legstandcijfers.** Het cijfer zonder woord staat bij 3–4 spelers op de telefoon vlak links van de score ("2 501"). Dit nadeel is bij de keuze genoemd; zie de beelden.
- **html-sinks.** De goedgekeurde uitdrukking voor de naamregel staat er letterlijk. Het label voor 3+ spelers is een losse constante erachter (`+''+(isActive&&n>2?'<span class="x-turn">gooit</span>':'')`). De scanner accepteert zuivere constanten zonder allowlist; er zit geen data in.
  - De oude allowlist-sleutel voor de meta-uitdrukking (`lastStr|(isActive&&n>2?…)+(imp?'niet uitgooibaar · ':'')`) komt in de code niet meer voor. Ik heb hem niet verwijderd, omdat dat een allowlist-wijziging is. Weghalen kan met jouw akkoord.

## Herstelpunt 2: legsgetal op het kantinescherm

**Oorzaak.** In het ≥1600-blok stond `#sb-players .x-lg b` (28–46 px). De compacte regel `#sb-players.x-compact .x-lg b{font-size:17px}` is specifieker en staat later in het bestand, dus die won.

Mijn eerste correctie (`#sb-players.x-compact .x-lg b` in het blok) had dezelfde specificiteit en stond eerder in het bestand, dus die werkte ook niet. De meting liet dat zien, waarna ik het heb aangepast.

**Wijziging.** `#sb-players.x-compact .x-card .x-lg b{font-size:clamp(24px,2.9vh,39px)}`, alleen binnen liggend ≥ 1600 px. Dezelfde verhouding als op de telefoon (compact 17 / 2 spelers 20 = 0,85 × de 2-spelersmaat).

| Viewport | Getal 3+ sp (177e881 → herstel) | Woord "legs" | 2 spelers getal |
|---|---|---|---|
| 1920×1080 | 17 → **31,3** | 18,4 | 36,7 (ongewijzigd) |
| 1600×900 | 17 → **26,1** | 15,3 | 30,6 (ongewijzigd) |
| 2560×1440 | 17 → **39** | 24 | 46 (ongewijzigd) |
| telefoon/tablet/1024 | 17 (ongewijzigd, regel geldt daar niet) | 12 | 20 |

- Het getal is nu overal groter dan het woord.
- Kaarthoogte 1920 bij 4 spelers: 114 → 114 (zonder "niet uitgooibaar"-regel).
- Bewaakt in `x01-kaart.mjs` (kantine 1920/1600/2560 × 2/4/6 spelers, plus 'niet uitgooibaar' ≥ 15 px). 177e881 zakt op alle drie: legsgetal op 1920 en 2560, en daar bestaat de eigen regel nog niet.

## Herstelpunt 3: contrast "legs" op de actieve kaart

### Waarom de bestaande contrasttest dit miste
`tests/core/contrast.mjs` meet **kleurparen uit de tokens** (bijv. `muted/kaart`, `soft/kaart`) op een **vaste set achtergronden**: pagina-verloop, `--card` en `--surface`.

- Het beurtvlak van de actieve kaart (`--state-turn` = `--accent-soft`, terracotta 16 % over de kaart) zit daar niet bij. `muted` op `state-turn` is dus nooit gemeten.
- De test kijkt niet naar elementen. Een nieuwe combinatie van een bestaande tekstkleur op een bestaande, maar niet opgenomen achtergrond valt buiten zijn blikveld.
- In 177e881 slaagde `contrast.mjs` daarom gewoon (118/118 groen).
- 4D-1a gaf de meta op de actieve kaart wel `--text-soft`, maar het kleine woord "legs" bleef `--text-muted`.

### Wijziging
`#sb-players .x-card.on .x-lg small` krijgt `--text-soft`, dezelfde regel als de meta. Geen nieuw token, geen nieuwe kleur.

| "legs" op de actieve kaart | 177e881 | Herstel |
|---|---|---|
| licht / auto-licht | **3,51** | **5,58** |
| donker / auto-donker | 4,62 | 7,34 |

Gemeten op 390×844 en 1920×1080, in alle vier themastanden. Ongewijzigd: naam 13,25 / 10,92, label 5,02, legsgetal 13,25 / 10,92, meta 7,34 / 5,58. "niet uitgooibaar" (nieuw element): 7,34 / 5,58.

### Gerichte test: `tests/core/contrast-beurt.mjs` (nieuw)
- Meet élk zichtbaar tekstelement in de X01-spelerskaarten, op de samengestelde achtergrondketen (inclusief beurtvlak en opacity) boven elk punt van het pagina-verloop.
- Situaties:
  - 2, 4 (compact) en 6 spelers met legstand, en teams;
  - 390×844 en 1920×1080;
  - vier themastanden.
- Eis 4,5, of 3 voor grote tekst.
- Geen allowlist. Overgangen en animaties staan uit tijdens het meten: zonder die maatregel mat de test onder belasting één keer een tussenkleur van de score-animatie.
- Buiten deze test: tekst in de routebadges (dartbordkleuren). Die bewaakt `contrast.mjs` al als paar `wit/bord-groen` / `wit/bord-rood`, met classificatie. Anders zou deze test falen op een bestaand, elders vastgelegd probleem (wit op groen 3,3).
- Resultaat:
  - 177e881: zakt 4/8 (precies licht en auto-licht, "legs" 3,51);
  - herstel: 8/8.
- `contrast.allow.json` is niet aangeraakt.

## Tests en validatie

| Controle | Resultaat |
|---|---|
| syntaxcheck (`node --check`, 2 inline scripts) | 0 fouten |
| `npm test` volledig | **139/139** in 34 suites, 707 s (was 118/32; nieuw `contrast-beurt` 8, `x01-kaart` 13) |
| mutatietest `node tests/mutation.mjs --visual` (REF = ongemuteerde huidige code) | **26/26 gevangen** + visuele mutatie gevangen. Nieuw: "legs" weer muted, kantine-getal weer 17 px, "niet uitgooibaar" weer weg, "niet uitgooibaar" op de kantine weer 12 px, label op de telefoon weer zichtbaar |
| visuele vergelijking met `faf50f0` (1253 opnames) | 167 anders, **allemaal** in de toegestane 4D-1a-scenario's; 0 px binnen het bevestigvenster |
| visuele vergelijking met `177e881` (1253 opnames) | **78 anders**, alleen `x01-2sp` (29), `x01-4sp` (29), `x01-teams` (20) |
| tikvlakken 320/360/375/390 NL+EN | groen. Tussendoor zakte 320: de regel "niet uitgooibaar" duwde bij teams de rij 7-8-9 onder de balk. Opgelost met de hoogtecompensatie van het lege uitgooivak, niet met een nulmeting. |

Logs: `design/4d-log/herstel-*.log` en `herstel-scope-*.json`.

### Herkomst van elk visueel verschil t.o.v. `177e881`
Rechthoek met verschillende pixels per opname, uit de diff-beelden:

| Scenario | Waar | Hoort bij |
|---|---|---|
| `x01-2sp` (29) | alleen een vlakje van ~20×10 px (1920: 32×17) rond het woord "legs" op de actieve kaart | herstel 3 |
| `x01-4sp` (29) | alleen de naam/label-zone van de actieve kaart (telefoon: label weg; tablet/kantine: label van de meta- naar de naamregel) | herstel 1 |
| `x01-teams` (20) | de kaartenrij: de actieve kaart krijgt de regel "niet uitgooibaar", de tweede rij zakt mee; daaronder (uitgooivak, toetsen) niets | herstel 1 |

- Geen verschil in andere scenario's of schermen.
- De kantinecorrectie van herstel 2 en de kantinemaat van "niet uitgooibaar" komen in de visuele matrix niet voor: daar heeft geen kantine-opname 3+ spelers met legstand of "niet uitgooibaar". Ze zijn gemeten en bewaakt in `x01-kaart.mjs` en te zien op blad 6.
- De vergelijking met `faf50f0` is gedraaid vóór de laatste kantinecorrectie van "niet uitgooibaar". De opnames van de huidige code zijn bit-gelijk aan die uit de tweede `177e881`-run, op één opname na: 7 pixels met 1 kleurwaarde verschil, renderruis. Die uitslag geldt dus ook voor de eindstand.

## Wat Tom zelf moet controleren
- **Op een echte iPhone (Safari):**
  - de kaart bij 3–4 spelers zonder label: is de beurt in één oogopslag duidelijk?;
  - het losse legscijfer naast de score;
  - de regel "niet uitgooibaar" aan het begin van een leg.
- **Kantinescherm:** legstand bij 4–6 spelers.
- **Geen release:** `APP_VERSION` is niet opgehoogd, want dit is een featurebranch. Dat gebeurt pas bij een release met jouw akkoord.
