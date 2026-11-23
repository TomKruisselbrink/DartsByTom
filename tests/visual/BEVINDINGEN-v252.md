# Bestaande visuele problemen in v252 (fase 4A)

Bron: 672 shots van v252 (`tests/visual/out/baseline-v252`, niet in git), automatische controles uit `shoot.mjs` en een handmatige controle van de contactsheets (NL/EN, licht/donker, telefoon en liggend).
Deze problemen zitten **in de baseline**. De baseline legt de huidige stand vast; ze is geen goedkeuring van het ontwerp.

## Hoog: zichtbaar kapot of onbruikbaar

| # | Scherm | Viewport | Probleem |
|---|---|---|---|
| H1 | Halve It (`screen-halveit`) | 1280×800, 1920×1080 | Niet aangepast aan liggend: alles staat over de volle breedte en in het midden zit een **effen zwart vlak** van ~450 px tussen spelers en invoer. Het scherm dekt de achtergrond af. Fase 3 heeft Halve It gemist. |
| H2 | X01 "Statistieken deze wedstrijd" (`x01-stats-blad`) | 375×667, 390×844, 430×932 | De kop van het onderblad valt deels onder de zwevende spelbalk ("Statistieken d…"). |
| H3 | Cricket | 375×667 | De onderste rij (16, 15, Bull, Mis) valt onder de spelbalk zonder te scrollen. |

## Middel: werkt, maar niet goed

| # | Scherm | Viewport | Probleem |
|---|---|---|---|
| M1 | Eliminatie, Cricket, Afgooien | liggend | Weinig aangepast: spelers bovenaan, invoer onderaan, groot leeg middenvlak. Op 1920 is de tekst in de spelersrijen klein voor een kantinescherm. |
| M2 | Niet-spelschermen (home, ranglijst, statistieken, geschiedenis, winstscherm, toernooi) | liggend | Smalle telefoonkolom in het midden, tekst ~12 px op 1920×1080. Bewust buiten fase 3 gelaten, maar op afstand onleesbaar. |
| M3 | Spelschermen | 375×667 | Scrollen nodig: Cricket, Random Checkout (3 spelers), Shanghai (4 spelers). Bekend (§11). |
| M4 | Setup stap 1 | alle | Killer/Afgooien heet nog "Bouw 5 punten, gooi af" / "Build 5 points, then kill", terwijl het aantal levens instelbaar is. Op home staat al "Killer met levens". |
| M5 | Tikvlakken < 40 px | 390×844 | Ranglijst (7), Statistieken (9), Statistieken X01 (9), Setup spelers (7), Weergave (5), Spel & geluid (4), Geschiedenis-detail (2). Vooral chips en filterknoppen. |
| M6 | Tekst < 11 px | alle telefoons | Setup Halve It (12 elementen), Statistieken (11), Halve It (5), X01 (3), Afgooien (3). |
| M7 | Winstscherm | alle | Ranglijst / Statistieken / Home zijn kleine tekstlinks zonder knopvorm. |

## Laag

| # | Scherm | Probleem |
|---|---|---|
| L1 | Instellingen → Gegevens | Groepscode-kaart staat er nog terwijl `groups` sinds 21-11 dicht is (§11, fase 6). |
| L2 | Instellingen → App downloaden | Ondertitel "Installeer op deze computer" ook op de telefoon. |
| L3 | Halve It doelenrij | Lange labels ("3 different colours") worden afgesneden; scrollrij met vervaagde rand, dus wel bereikbaar. |

## Niet gevonden

- Geen `pageerror` of setupfout in 672 shots.
- Geen horizontale overflow.
- EN: geen Nederlandse restjes gezien in de UI. De sleutelcontrole vond 0 treffers, en de contactsheets zijn handmatig nagelopen. Nederlandse tekst in EN komt alleen uit testdata (foutlog-plaats "Vriendverzoeken", gast "Gast"), niet uit de app.
- Licht/donker: geen thema-lekken gezien (geen witte tekst op wit, geen zwarte balken op telefoon).

## Twijfel (controleren, mogelijk testdata)

- Vriendenpagina ingelogd: Henk staat als "niet gekoppeld". Waarschijnlijk komt dat door de testdata (de koppeling in `darts_friend_links` past niet bij de nep-uid), niet door de app.
