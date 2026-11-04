# CLAUDE.md — Darts by Tom

Overdracht voor een nieuwe chat. Stand: **v224** (november 2026). Alles hieronder klopt met de code op dat moment.
Zoek in `index.html` op functienamen en sectiekoppen (`// ═══ …`), niet op regelnummers: die verschuiven.

---

## 1. Wat het is

- PWA voor dartsscores, live op **www.dartsbytom.com** (GitHub Pages). Repo: `github.com/TomKruisselbrink/DartsByTom`.
- **Eén bestand met alle code:** `index.html` (~685 KB, vanilla JS, geen build, geen framework, geen CDN behalve Firebase).
- Overige bestanden: `sw.js` (service worker), `manifest.json` en iconen (`icon-*.png`, `icon-maskable-*.png`, `apple-touch-icon.png`, `favicon.*`, `icon.svg`).
- Taal: Nederlands, met een volledige Engelse vertaling (zie §4).
- Backend: Firebase compat **10.12.0** (Auth + Firestore), project `ons-app-65e13`. De Firebase-scripts worden door de SW gecachet, zodat de app ook offline start.

---

## 2. Werkafspraken met Tom

- **Communiceer in het Nederlands.** Wees direct en eerlijk, zonder te verzachten of te vleien. Spreek aannames tegen en zeg het als iets een slecht idee is. Bij een smaakkeuze heeft Tom het laatste woord.
- **Geschiedenis en statistieken blijven altijd intact.** Tom is al eens data kwijtgeraakt. Elke wijziging moet bestaande `darts_db`-data ongemoeid laten of veilig migreren (alleen aanvullen).
- **Levering via git:** in een chat met push-toegang (repo gekoppeld met push) commit en push je zelf naar `main`. Push naar `main` = direct live op www.dartsbytom.com, dus alleen na de tests hieronder en met Toms akkoord voor die release.
  - Vóór elke push: `git fetch origin main` en rebase. Tom uploadt soms nog zelf via "Add files via upload"; overschrijf zijn wijzigingen nooit.
  - Grotere of riskante wijzigingen: eerst op een aparte branch, Tom test, daarna mergen.
- **Zonder push-toegang** (push geeft 403): lever **één zip** met de bestanden **in de root** en hun eigen namen, bijv. `DartsByTom-v225.zip`. Tom uploadt die zelf. Na zijn upload zet je de repo gelijk:
  `git fetch && git diff --stat HEAD origin/main && git reset --soft origin/main`
- **Elke release:** `APP_VERSION` +1 (§9). Noem de versie in je antwoord.
- **Onduidelijke regels of wensen:** eerst vragen, met keuzes. Ga niet zelf een spelvariant verzinnen.
- **Testen vóór levering** (Playwright + Chromium zijn in de sessie aanwezig):
  - syntaxcheck: `node --check` op elk inline `<script>`-blok;
  - licht + donker;
  - NL + EN;
  - klein scherm (375×667, iPhone SE) en 390×844;
  - geen `pageerror`.
  - Firebase stub je via `page.route(/gstatic/…)`. Voor groep/vrienden-tests gebruik je een nep-Firestore die tussen twee browsercontexten gedeeld wordt.
- **Antwoordvorm:** kort per punt wat er veranderd is en wat Tom zelf moet controleren. Wat alleen op een echte iPhone te testen is, noem je expliciet.
- **Huisstijl:** bouw verder op wat er is (één bestand, bestaande componenten). Geen rebuild of andere stack. Doel: het moet voelen als een echte app.

---

## 3. Architectuur van `index.html`

Volgorde in het bestand (globaal):

1. **CSS.** Tokens in `:root` (§10), thema's, componentklassen:
   - spelschermen: `.g-wrap`, `.g-head`, `.g-target`, `.g-target-big`, `.g-prow`, `.g-hit`, `.g-miss`, `.g-sec`, `.g-keys`;
   - X01: `.x-card`, `.x-score`;
   - knoppen: `.btn`, `.btn-primary`.
   Daarna nog de Tailwind-preflight (statisch, geen CDN). Achteraan staan de overrides (o.a. `@font-face` "DBT Flow").
2. **Vertaling.** `var I18N={…}` (NL→EN-woordenboek) en `var I18N_PATTERNS=[…]` (regexen voor teksten met namen/getallen). Een MutationObserver vertaalt alle tekst als `_lang==='en'`.
3. **HTML-schermen** (`.screen`, één tegelijk zichtbaar):
   - `screen-home`, `screen-setup` (stappen 1 spel → 2 regels → 3 spelers), `screen-settings`, `screen-stats`, `screen-history`, `screen-leaderboard`;
   - toernooi: `screen-trn-setup`, `screen-trn-overview`, `screen-trn-standings`;
   - spellen: `screen-game` (X01), `screen-atc`, `screen-shanghai`, `screen-halveit`, `screen-checkout121`, `screen-randomco`, `screen-cricket`, `screen-afgooien-bull`, `screen-afgooien`, `screen-eliminatie`;
   - `screen-win`.
   Vaste elementen:
   - `#pill-nav`: onderste navigatie;
   - `#game-controls`: zwevende spelbalk (Ongedaan · Stats/Rondes · Stop);
   - `#game-sheet`: onderblad via `openGameSheet(title,html)` / `closeGameSheet()`;
   - `#upd-banner`: updatemelding.
4. **DATA & STATE.**
   - `state`: het huidige potje (spelers, scores, history, legs/sets, per-spel velden, `botPlayerIndex`);
   - `trn`: het toernooi;
   - `dbCache`: de spelersdatabase in het geheugen;
   - `getDB()` geeft `_viewDB||dbCache` (`_viewDB` = alleen-lezen weergave van vrienden-data);
   - `DEFAULT_SEQ`: standaardrondes van Halve It.
5. **Omroeper (caller).**
   - `callerSay(text,interrupt)`, Engels, Britse stem; `callerRequire()` zegt "Tom, you require 121".
   - Daarnaast "One hundred and eighty!", "Game shot…" en "… wins the match!".
   - `_callerUnlock()` spreekt bij de eerste tik een stille uiting uit, omdat iOS anders timer-spraak blokkeert.
   - Bijnaam per speler (`db[name].nickname`) via `callerName()`.
6. **FIREBASE CONFIG & SYNC.**
   - Groep: `groupCode`, `startFirebaseListener()`, `saveDB()`, `_grpMerge`, `_grpWrite`.
   - Privé/verborgen spelers.
   - Account + cloud-back-up: `_acct*`, `ACCT_DOMAIN='@dartsbytom.app'`.
   - Vrienden + potjes doorsturen: `fr*`, `_frSync`, `_outboxFlush`, `_inboxApply`.
   - Scope "Deze telefoon / Vrienden" voor stats, ranglijst en geschiedenis.
7. **UI-infrastructuur.**
   - geschiedenis zonder limiet (`_trimHistory`, `_sortHistory`);
   - knopgevoel/haptics (`haptic()`);
   - pill-nav-indicator;
   - instellingenmenu (`stOpen(page)` / `stClose()`; pagina's `account`, `friends`, `players`, `game`, `appearance`, `data`).
8. **NAVIGATION.** `showScreen(id)` toont het scherm en regelt pill-nav en spelbalk. Spelschermen staan in `_gameScreens`, met de titel in `_gTitles`.
9. **SETUP.** `selectGame()`, `goToSetupStep(n)`, `renderSetupRules()` (opties per spel), `renderSetupPlayers()` en `startGame()` → `launchGame(gameType, players, dblOut, fmt, n, sets, startScore, startIdx)`. Wie begint kies je via een lijst, zelf, of loting (munt bij 2 spelers, rad bij 3+).
10. **Spelopties:** Afgooien-opties, Random Checkout (`RCO_BRACKETS`, `rco*`), 121-instellingen (`co121Setup*`), Eliminatie (`eliTarget`, `eliDoubleOut`).
11. **BOT.** §7.
12. **TOERNOOI.** §6.
13. **Spellogica.**
   - X01: `renderGame`, `submitScore`, `nextPlayer501`, numpad `numpadPress`/`quickScore`, `getCheckout(n)`, `isImpossible(n)`, de double-bevestiging en `showDoubleSelectModal` (welke dubbel → `doubleStats`).
   - Ook: rematch (`saveRematchConfig` / `rematch` / `_doRematch`), ATC, Cricket, Shanghai, Halve It.
14. **WIN & STATS.**
   - `showWin()`, `updatePlayerStat(name,gameType,data)` (de enige plek waar potjes worden opgeslagen), `calcPlayerAvgStats()`, `renderStats()`;
   - export/import (`exportStats` / `importStats`);
   - geluid (Web Audio, geen bestanden), confetti;
   - `renderLeaderboard(tab)`, `renderHistory()` (`_renderHistoryImpl`), head-to-head, records + grafiek, uitdaginglink;
   - dubbels bijhouden; `deleteMatchEntry()`.
15. **Init + versie.**
   - `initApp()` laadt `darts_db` uit localStorage en verbindt stil met de groep;
   - `APP_VERSION`, registratie van de SW, `checkForUpdate()` / `applyUpdate()`;
   - wake lock, fullscreen, thema/taal (`applyTheme`);
   - Autodarts-bridge (alleen actief op localhost/LAN, websocket poort 8079);
   - installatiebanner (iOS).
16. **Afgooien** (Killer: bullronde, tie-break-sleepscherm, hoofdspel `renderAfgooien`, `afgScore`, `afgAttack`, `_afgNextTurn`, `_afgWin`) en **Eliminatie** (`eli*`) staan helemaal achteraan.

**Opslaan van een potje:**
- `updatePlayerStat()` maakt een entry met `gid` aan en roept daarna `saveDB(db)` aan.
- `saveDB(db)` doet het volgende:
  - schrijft `darts_db` naar localStorage;
  - plant de account-back-up en de vrienden-sync;
  - schrijft bij een groep alleen gewijzigde, niet-privé spelers naar Firestore.
- Bot-spelers worden overgeslagen: dat is de naam `state.players[state.botPlayerIndex]`.

---

## 4. Vertaling (NL/EN)

- Elke nieuwe Nederlandse UI-tekst krijgt een entry direct na `var I18N={`. Teksten met variabelen krijgen een regex direct na `var I18N_PATTERNS=[` (vorm: `[/^… (\d+)$/,'… $1']` of een functie).
- Taal staat in localStorage `lang` (`nl`/`en`). Test na elke UI-wijziging ook in het Engels.

---

## 5. Spelregels per modus (zoals geïmplementeerd)

| Modus (`gameType`) | Regels |
|---|---|
| **X01** (`x01`, `501`, `301`) | Start 501, 301 of eigen getal. Double out of single out. Legs **first to** of **best of** N, optioneel sets (1 = geen sets). Invoer per beurt (0–180) via numpad of snelknoppen. Bust onder 0 of op 1 (bij double out). Bij uitgooien vraagt de app "Was het op een double?" en daarna welke dubbel (→ `doubleStats`). Checkout-hints uit de checkouttabel. De bot kan meedoen. |
| **Cricket** (`cricket`) | 15–20 en Bull. Drie marks sluit een vak. Extra marks scoren punten zolang een tegenstander het vak nog niet dicht heeft. Winst: alles dicht en score ≥ ieders score. |
| **Eliminatie** (`eliminatie`) | Optellen naar een doel (standaard 301, of eigen). Boven het doel = bust. Kom je precies op de score van een tegenstander (>0), dan gaat die terug naar 0. Optioneel double out (bevestiging). |
| **Afgooien** = Killer (`afgooien`) | Nummer verdelen: **bullronde** (één pijl op de bull; dichtstbij begint, het geraakte vak wordt je nummer, bij gelijkspel een sleepscherm) of **willekeurig** 1–20 (`afgAssign`). **Levens** 1–10 (`afgLives`) = punten nodig om Killer te worden. Opbouwen op je eigen nummer: **per vak 1·2·3** (`afgBySeg`) of **elke raak 1**. Als Killer raak je andermans nummer: −1/−2/−3 levens. Wie op 0 staat ligt eruit; de laatste die overblijft wint. **Teams** (2–4): delen nummer en levens, gooien om de beurt. De bot kan meedoen (niet bij teams). |
| **Around the Clock** (`atc`) | 1–20, dan Bull, dan D-Bull (22 doelen). Modus *basis*: raak = +1. Modus *punten*: dubbel = +2, triple = +3 stappen. Wie het eerst klaar is wint. |
| **Shanghai** (`shanghai7`, `shanghai20`) | 7 of 20 rondes. Ronde n = doel n; enkel/dubbel/triple = n×1/2/3. Optie "halveren": een beurt zonder punten halveert je totaal (anders 0 voor die ronde). Hoogste totaal wint. ⚠️ Zie bekende bugs: directe winst bij een Shanghai zit er niet in. |
| **Halve It** (`halveit`) | Reeks doelen: standaard (`DEFAULT_SEQ`: 20, Double, 19, Triple, 18, 3 verschillende kleuren, 17, 3 dezelfde kleuren, 16, 1 van 3 getallen, 15, Bull), willekeurig, of een eigen volgorde (slepen en vegen om te verwijderen; doeltypen ook D/T/B/eigen opdracht). Raak = punten; een ronde zonder raak halveert je totaal. De bot kan meedoen. |
| **121 Checkout** (`checkout121`) | Start 121 (instelbaar), 9 pijlen per poging (instelbaar). Gelukt: doel + stap (standaard +5). Safehouse-regel `none` / `3dart` / `6dart` / `3row` / `5row` / `always`. Mislukt: terug naar het safehouse, of naar de start. Geen einde: stats worden opgeslagen bij Stop (`saveCo121Stats`). |
| **Random Checkout** (`randomco`) | Willekeurige checkout uit gekozen bereiken (`RCO_BRACKETS`: 2–40 = 1 pnt, 41–60 = 2, 61–80 = 3, 81–90 = 4, 91–100 = 5, 101–130 = 8, 131–170 = 10; bogey-getallen worden overgeslagen). Pijlen per poging (standaard 9, 0 = onbeperkt) en aantal checkouts (standaard 10, 0 = onbeperkt + knop "Spel afronden"). Modi: **Standaard** (gelukt = bereik omhoog, mislukt = omlaag), **Willekeurig**, **Race** (eerste die het hoogste bereik uitgooit wint). Beurtscore invullen: de rest loopt af. Doodgegooid (onder 0, op 1, of 0 zonder double) = terug naar het startgetal; de beurt telt wel. Snelknoppen Uitgegooid/Mislukt blijven beschikbaar. |

Solo-potjes tellen nooit als winst (`updatePlayerStat` zet `won:false` bij één speler).

---

## 6. Toernooi

- Alleen **X01** (501, 301 of vrij getal, `trnGame` / `trnGameCustom`). Double out aan/uit, **best of** N legs per wedstrijd (`trnBO`).
- Formats (`trn.format`):
  - **knockout:** spelers geschud en opgevuld tot een macht van 2 met byes. `advanceKnockout()` bouwt automatisch de volgende rondes. Rondenamen via `koRoundName` (Finale, Halve finale, Kwartfinale, Ronde n).
  - **roundrobin:** iedereen tegen iedereen, met een planner die voorkomt dat iemand twee keer achter elkaar speelt. Punten = gewonnen legs, dan winstpartijen. Daarna optioneel play-offs (`startRRPlayoff`): 1–2 finale, 3–4 strijd om plek 3, enz.
  - **group:** N groepen (`trnGroups`) round robin; de top 2 per groep gaat naar een geschudde knockout.
- Elke wedstrijd begint met een keuze wie begint: zelf kiezen of munt (`trnFlipCoin`), daarna `launchTrnMatchWithStart`.
- `trnRecordLegWin(match,winner)` telt legs. Bij een gewonnen wedstrijd schrijft `updatePlayerStat(…,'trn-501',…)` één entry voor de winnaar en één voor de verliezer.
- **Toernooistatus staat alleen in het geheugen** (`trn`). App dicht = toernooi weg (zie openstaand).

---

## 7. Bot

- Alleen in vrij spel: **X01, Halve It, Afgooien** (niet bij Afgooien-teams). Naam instelbaar (`#bot-name`, standaard "Bot").
- Van de bot worden geen stats opgeslagen.
- **Niveau:**
  - **auto** (`botLevelMode='auto'`): speelt op het 3-pijlsgemiddelde van een gekozen speler (`botSelectedPlayer`), begrensd op 25–110. Zonder stats ~58.
  - **handmatig** (`beginner` 38 / `medium` 58 / `advanced` 80 / `expert` 102).
- **Checkout-kans:** handmatig 15/28/42/60%. Bij auto: het dubbel-% van de eerste menselijke speler in het potje (`getBotCheckoutRate`).
- **X01** (`botGenerateScore`): de beurtscore komt uit een normale verdeling rond het gemiddelde (sd 22%). Onder ≤40 of 50 gooit hij met de checkout-kans uit; hogere finishes alleen als de getrokken score precies past.
- **Halve It / Afgooien:** raakkans afgeleid van het gemiddelde (`(avg−20)/100`, begrensd).
- **Start:** `launchGame` start de bot als `botPlayerIndex===firstPlayer`. Een rematch neemt de bot mee (`rematchConfig.botName`).

---

## 8. localStorage-keys en datastructuur

**Kritiek, bevat de echte data:**

- **`darts_db`**: `{ [spelernaam]: Player }`
  ```js
  Player = {
    games, wins, totalDarts, totalScore,   // tellers (kunnen > gameHistory.length zijn bij oude data)
    gameHistory: [Entry],                  // nieuwste eerst, ONBEPERKT
    nickname?,                             // naam voor de omroeper
    doubleStats?: { 'D20': 3, 'BULL': 1 }, // favoriete uitgooi-dubbels
    deleted?: [mkey]                       // tombstones van verwijderde potjes (max 300), voor groepssync
  }
  Entry = {
    gid,              // DEVICE_ID+'-'+tijd+teller+random; uniek per potje
    ts, date,         // ms-timestamp en 'd-m-jjjj' (nl-NL)
    gameType,         // 'x01','501','301','cricket','eliminatie','afgooien','atc','shanghai7','shanghai20','halveit','checkout121','randomco','trn-501'
    won, darts, score, opponents?: [naam],
    detailedStats?: { avg3, avg1, count180, count160, count140, count120, count100, count80, count60, count0,
                      highTurn, highFinish, turns, checkoutAttempts, checkoutHits, checkoutPct },   // X01
    legBreakdown?: [{ legNum, winner, playerStats: { [naam]: { avg, darts, high, count180 } } }],  // X01
    legResult?, setResult?, matchFormat?, highScore?,
    hiStats?, hiRoundHistory?,   // Halve It
    via?                         // naam van de vriend die dit potje stuurde
  }
  ```
  - Bij potjes ouder dan de nieuwste **200** (`HISTORY_DETAIL_KEEP`) vervallen alleen `legBreakdown` en `hiRoundHistory`. Het potje zelf blijft.
  - Merge-sleutel `_mkey(e)`: `'g:'+gid`, of zonder gid een sleutel uit vaste velden. `_ekey(e)`: `'g:'+gid` of een hash van de entry.
- **`darts_hidden_archive`**: `{ [naam]: Player }`. Spelers die een andere telefoon in de groep verborg, worden hier gearchiveerd in plaats van gewist. Je eigen accountspeler komt automatisch terug (`_restoreOwnFromArchive`).
- **`darts_db_before_restore`**: string-kopie van `darts_db`, gemaakt vlak vóór een herstel uit de cloud-back-up. Dit is een vangnet: laat het staan.

**Groep / account / vrienden:**

| Key | Inhoud |
|---|---|
| `darts_group_code` | string; groepscode (Firestore `groups/{code}`) |
| `darts_private` | `[naam]`; privé-spelers, nooit naar de groep, bij vrienden als "Gast" |
| `darts_device_id` | string; prefix voor gids, bepaalt welke potjes "van dit apparaat" zijn |
| `darts_friend_links` | `{ [lokale naam]: { uid, username } }`; nieuwe potjes van die speler gaan naar die vriend |
| `darts_friend_shadow` | `{ [lokale naam]: { k:[ekey], ds:{doubleStats-snapshot} } }`; wat al verstuurd is |
| `darts_outbox` | `[{ id, to:uid, payload:{ from, fromName, as, games:[Entry], ds, ts } }]`; nog te versturen |
| `darts_inbox_applied` | `[inbox-doc-id]` (laatste 300); al verwerkte binnengekomen potjes |
| `darts_hist_sent` | `{ 'uid|naam': 1 }`; hele geschiedenis al eens meegestuurd |
| `darts_pending_invite` | gebruikersnaam uit een uitnodigingslink `?vriend=…` |

**Instellingen:**

| Key | Inhoud |
|---|---|
| `theme` | `auto` / `light` / `dark` (→ `data-theme` op `<html>`) |
| `lang` | `nl` / `en` |
| `darts_sound`, `darts_caller`, `darts_haptics` | `'1'` / `'0'` (standaard aan) |
| `darts_caller_voice` | voiceURI, of leeg voor automatisch |
| `darts_last_game` | laatst gekozen `gameType` |
| `darts_last_players` | `[naam]` (zonder "Bot") |
| `darts_afg_lives` / `darts_afg_byseg` / `darts_afg_assign` | Afgooien: getal / `'0'`·`'1'` / `manual`·`random` |
| `darts_rco_brk` / `darts_rco_mode` / `darts_rco_darts` / `darts_rco_count` | Random Checkout: `[bereik-index]` / `default`·`random`·`race` / getal / getal |
| `darts_install_dismissed` | `'1'` als de iOS-installatiebanner weggeklikt is |

Firebase Auth bewaart de login zelf (IndexedDB). Daar hoef je niets aan te doen.

**Firestore** (regels staan in de Firebase-console, niet in de repo):

- `groups/{code}` met veld `hidden:[naam]`, en `groups/{code}/players/{naam}` = Player.
- `users/{uid}` (profiel met `username` en gekoppelde `player`), met daaronder:
  - `backup/meta` + `backup/c0…cN`: de complete lokale DB als JSON-string in chunks (`ACCT_CHUNK`);
  - `public`: wat vrienden zien;
  - `friends/{uid}`;
  - `inbox/{id}`: potjes van vrienden.
- `friendRequests/{van}_{naar}`, `usernames/{naam}`.
- De regels beschermen users, usernames, friendRequests, public, friends en inbox. Een catch-all houdt de rest (o.a. `groups`) open.

**Herstel-regel:** account-herstel (`_acctMerge`) voegt alleen toe of vult aan, met de speler met de méeste potjes leidend. Er wordt nooit lokaal iets weggegooid. De groepssync (`_grpMerge`) voegt lokale en server-potjes samen en respecteert tombstones.

---

## 9. Deploy en service worker

- **Hosting:** GitHub Pages vanaf `main` (root). Na een upload draait "pages build and deployment". Wacht op het groene vinkje, pas daarna is de versie live.
- **Custom domein:** www.dartsbytom.com, ingesteld in repo Settings → Pages. Er staat **geen `CNAME`-bestand** in de repo; de historie laat twee keer aanmaken en verwijderen zien.
  - Valt het domein weg, controleer dan eerst Settings → Pages en de DNS.
  - `manifest.json` heeft `start_url: "/DartsByTom/"`. Dat pad bestaat alleen op `tomkruisselbrink.github.io/DartsByTom/`, dus controleer welke URL echt live is (zie openstaand).
- **Versie bumpen:**
  - In `index.html` **alleen `var APP_VERSION=N;` ophogen.** `sw.js` hoeft niet aangepast te worden.
  - De SW wordt geregistreerd als `./sw.js?v=N`. Cache-naam `darts-vN`; oude caches worden bij `activate` verwijderd. `skipWaiting()` + `clients.claim()`.
- **SW-strategie:**
  - Navigatie en `.html`: network-first met `cache:'no-cache'` (omzeilt de 10 minuten HTTP-cache van GitHub Pages), opgeslagen zonder querystring. Offline: de cache.
  - `www.gstatic.com` (Firebase): cache-first.
  - Eigen iconen en manifest: cache-first.
  - Firestore en Auth: altijd netwerk.
- **Update in de app:** `checkForUpdate()` haalt `index.html?nc=…` op en leest `APP_VERSION`. Dat gebeurt bij het starten en als de app weer zichtbaar wordt (max 1× per 10 min), en via de knop "Controleren op updates" onderaan Instellingen. Bij een nieuwere versie verschijnen `#upd-banner` en een rood stipje op het tandwiel. `applyUpdate()` herlaadt via `?u=N` (de URL wordt daarna opgeschoond). Spelgegevens blijven staan.

---

## 10. Huisstijl

- **Accent:** `--accent: #B94E2A` (terracotta/oranje): de enige accentkleur.
  - Groen voor positief/raak: `#3E7B4F` (`.g-hit`, Toernooi-tegel), lichtgroen `--accent2: #9DBF9E`.
  - Fout: `--danger: #FF3B30`. In licht thema is de miss-tekst `#B3261E`.
- **Donker** (standaard): `--bg #000`, kaarten `rgba(44,44,46,.75)`, tekst wit, `--muted #98989F`. Achtergrondverloop van zwart via `#381000` naar `#0f2e10`.
- **Licht:** verloop `#e8b89e → #f4ebe4 → #fff`, tekst zwart, `--muted #6E6E73`.
- Thema volgt het systeem, of `theme` uit de instellingen.
- **Font "Darts by Tom Flow"**, in CSS `'DBT Flow'`:
  - ingebouwd als base64-woff2 in een `@font-face` (alleen weight 700, `font-display:swap`), dus het werkt ook offline;
  - staat **overal**: `body` en `html` gebruiken `var(--ff-display)`, en ook de SVG-teksten (munt, grafiek) gebruiken het;
  - smal, cursief, **alleen hoofdletters** (kleine letters worden als hoofdletters getekend), 70 tekens: `A–Z a–z 0–9 ! + - . / : ·` en spatie;
  - ontbrekende tekens (`? % & ( ) é ' " × , –` enz.) vallen terug op het systeemfont;
  - titels en grote getallen staan expliciet op weight 700 met `font-synthesis:none` (geen nep-vet).
- **Componenten:**
  - tastbare knoppen `.btn` met een 3D-onderrand en indrukeffect (`haptic()`);
  - spelschermen in de stijl van 501: kop `.g-head`, spelerskaarten `.x-card(.on)`, invoer onderaan bij de duim, Ongedaan/Stop in de zwevende `#game-controls`;
  - onderbladen via `openGameSheet`;
  - meldingen via `showToast(msg,type)`.
- **Iconen/logo:** het 20-segment van een dartbord (rode dubbel en triple 20, zwart, bull) op wit, met een subtiele dunne T. Geen tekst.

---

## 11. Openstaand

- **Font aanvullen:** `% & ? ( ) é ' "` en `×` ontbreken nog in Flow (Tom maakt/levert het font). Daarna de nieuwe woff2 base64 vervangen in de `@font-face`.
- **Kleine tekst:** met Flow overal zijn ondertitels en uitleg klein. Tom bepaalt of alles een stap groter moet.
- **Caller op iPhone in leg 1:** de fix (`_callerUnlock`) is alleen in de testbrowser getest. Tom moet bevestigen dat het op zijn iPhone werkt.
- **Gebruikersnaam wijzigen**: een knop in Account. Nog niet gebouwd; Tom vond het eerder "later".
- **Waarschuwing bij iPhone-herinstallatie:** iOS wist localStorage als je de PWA verwijdert, dus advies om eerst in te loggen voor de cloud-back-up. Nog niet gebouwd.
- **Glow licht thema:** kleine stijltweak, nog niet gedaan.
- **Groepscode uitfaseren:** als alle vrienden een account hebben, de groepscode weghalen en de open catch-all-regel in Firestore dichtzetten.
- **Toernooi bewaren:** `trn` naar localStorage, zodat een toernooi app-herstart overleeft.
- **Eigen Halve It-volgorde** (`hiOwnSeq`) staat alleen in het geheugen en is na een herstart weg.
- **`manifest.json`:** `name` is nog "Darts Scorer" en `start_url` is `/DartsByTom/`. Controleer de live-URL (eigen domein of github.io-pad) en pas aan, met Toms akkoord.

## 12. Bekende bugs

- **Shanghai:** de uitleg zegt "Shanghai (single + dubbel + triple) wint direct", maar `shScore` / `shEndTurn` hebben die regel niet. Alleen het hoogste totaal na de laatste ronde wint.
- **Bot X01:** de lijst `impossible` in `botGenerateScore` bevat ook 159, 162, 165 en 168. Die zijn als beurtscore wél mogelijk (alleen niet als checkout), dus de bot gooit ze nooit.
- **Bot checkout-kans (auto):** `getBotCheckoutRate()` gebruikt het dubbel-% van de eerste mens in het potje, niet van `botSelectedPlayer`. Het gemiddelde komt wel van de gekozen speler.
- **Botnaam gelijk aan een speler:** heet een echte speler net als de bot, dan slaat `updatePlayerStat` die speler over. Er is geen controle op unieke namen.
- **Groep, speler gewist op een ander toestel:** wist iemand een speler in de groep (`clearPlayer` verwijdert het Firestore-doc), dan verwijdert de listener (`change.type==='removed'`) die speler ook lokaal op alle verbonden telefoons. Er is geen archief.
- **Import-dedupe is grof:** `importStats` ziet potjes met dezelfde datum, het type, winst/verlies en het aantal pijlen als dubbel en slaat ze over. Ook zet het `games` en `wins` gelijk aan de lengte van de historie, wat oude tellers verlaagt.
- `deleteMatchEntry` zet `games` en `wins` ook gelijk aan de lengte van de historie. Bij oude spelers met `games > gameHistory.length` dalen de tellers daardoor.

---

## 13. Nooit doen

- **Nooit `darts_db` overschrijven met iets dat minder bevat dan er lokaal staat.** Geen `localStorage.clear()`, geen `removeItem('darts_db')`, geen reset of "schone start" en geen migratie die spelers of potjes weggooit. Migraties vullen alleen aan.
- **Nooit server- of groepsdata blind boven lokale data zetten.** Altijd samenvoegen (`_grpMerge`, `_acctMerge`). Haal de merge-, tombstone- en `_grpSent`-logica niet weg en "vereenvoudig" die niet.
- **Nooit `saveDB` alle spelers ongefilterd laten schrijven.** De hash-check (`_grpWrite`) voorkomt dat een oude kopie op een andere telefoon andermans data overschrijft.
- **Nooit `gameHistory` inkorten of potjes weggooien om opslag te sparen.** Alleen detailvelden (`legBreakdown`, `hiRoundHistory`) van potjes na de nieuwste 200 mogen weg.
- **Nooit `gid`, `ts` of `date` van bestaande entries wijzigen,** en de opbouw van `gid` / `DEVICE_ID` niet veranderen. Dedupe, vrienden-sync en tombstones hangen ervan af.
- **Nooit de veldnamen van Player of Entry hernoemen.** Ook geen `gameType`-waarden veranderen: stats, filters, de ranglijst en vrienden lezen ze.
- **Nooit `darts_hidden_archive` of `darts_db_before_restore` opruimen.** Het zijn vangnetten.
- **Nooit bij Stop, rematch of verbinding verbreken de lokale data leegmaken.** `disconnectGroup` moet de lokale DB laten staan.
- **Nooit `deleteMatchEntry` of `clearPlayer` aanroepen zonder bevestiging door de gebruiker,** en ook nooit in tests tegen echte data.
- **Nooit de cache-naam of `sw.js` zo aanpassen dat oude data weggaat.** Een SW raakt localStorage niet aan, en dat moet zo blijven: niets in `activate` behalve oude caches verwijderen.
- **Nooit de Firestore-regels strenger maken voordat alle groepsleden een account hebben.** Anders verliezen de telefoons hun sync.
- Nooit `APP_VERSION` vergeten op te hogen, en nooit `sw.js` met een vaste versie hardcoderen.
- Nooit externe CDN's toevoegen (de app moet offline starten). Uitzondering: de Firebase-scripts die de SW cachet.
- Nooit pushen zonder Toms akkoord voor die release, nooit force-pushen, en nooit de repo overschrijven met een oudere versie.
