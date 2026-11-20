# Firestore-regels (WP3, v250)

De regels staan in de Firebase-console, niet in de app. `firestore.rules` is het voorstel; jij zet het er zelf in.
Er verandert niets aan de app.

## Wat er verandert

| | Nu | Voorstel |
|---|---|---|
| `groups/**` (oude groepscode) | open voor iedereen, ook zonder login: lezen, schrijven, wissen | dicht |
| andere collecties (andere tools in dit project) | open voor iedereen | ongewijzigd open (zie hieronder) |
| `usernames` | iedere ingelogde gebruiker kan de hele lijst namen + uid's ophalen | alleen één naam opzoeken |
| `friendRequests` | verzoek aan jezelf mogelijk | niet meer |
| accounts, back-up, vrienden, inbox | beschermd | letterlijk gelijk |

**De catch-all.** Je huidige regels zetten elke collectie open behalve accounts. In de Data-tab (20-11-2026) staan
naast de darts-collecties alleen `events`, `meal` en `tasks` van een andere tool. Die drie blijven open zoals nu; de
catch-all is vervangen door die drie namen. Gevolg: niemand kan nog zomaar nieuwe collecties aanmaken. Gaat die andere
tool een nieuwe collectie gebruiken, dan moet die naam erbij in de regels, anders werkt dat deel van die tool niet.

**Let op, buiten de darts-app:** `events`, `meal` en `tasks` zijn voor iedereen open, ook zonder login. De projectsleutel
staat (zoals bij elke Firebase-webapp) gewoon in de broncode van de darts-app, dus iedereen kan die data lezen,
aanpassen of wissen. Dichtzetten kan pas als die tool zelf een login krijgt.

**Groepscode in de app.** Wie nog een groepscode heeft ingesteld, krijgt na deze regels een melding dat schrijven
naar de groep geweigerd wordt (Instellingen → Gegevens → Synchronisatieproblemen). Er gaat lokaal niets verloren.
Volgens jou gebruikt niemand de groep meer.

## Toepassen (± 5 minuten)

1. Firebase-console → project `ons-app-65e13` → Firestore Database → **Regels**.
2. Kopieer de huidige regels naar een tekstbestand (terugzetten = terug plakken en publiceren).
3. Plak de inhoud van `firestore.rules` eroverheen.
4. Test in de **Regels-speeltuin** (Rules Playground, knop rechtsboven in de editor). Zet "Authenticated" aan
   met een verzonnen uid, bijvoorbeeld `uidA`, tenzij er "uit" staat:

| Type | Pad | Auth | Gegevens | Verwacht |
|---|---|---|---|---|
| get | `groups/TEST/players/Tom` | uit | — | geweigerd |
| create | `groups/TEST/players/Tom` | uidA | `{"games":1}` | geweigerd |
| get | `usernames/tom` | uidA | — | toegestaan |
| list (query) | `usernames` | uidA | — | geweigerd |
| get | `users/uidA/backup/meta` | uidA | — | toegestaan |
| get | `users/uidB/backup/meta` | uidA | — | geweigerd |
| create | `friendRequests/uidA_uidA` | uidA | `{"from":"uidA","to":"uidA"}` | geweigerd |
| create | `friendRequests/uidA_uidB` | uidA | `{"from":"uidA","to":"uidB"}` | toegestaan |
| get | `events/mnk4liixz3a` | uit | — | toegestaan |
| create | `meal/test` | uit | `{"x":1}` | toegestaan |
| create | `iets/test` | uit | `{"x":1}` | geweigerd |

5. Publiceren.
6. Controle van de andere tool: open hem en kijk of afspraken, maaltijden en taken nog laden en opslaan.
7. Controle in de app (op twee telefoons met een account): speel een potje met een gekoppelde vriend, kijk of het bij
   de ander binnenkomt, en open Vrienden-weergave in Statistieken. Account-back-up: Instellingen → Account →
   Back-up maken. Alles moet werken zoals voorheen.

## Wat ik niet kon testen

De Firebase-emulator kan in mijn omgeving niet gedownload worden. De regels zijn dus niet in een emulator gedraaid;
de speeltuin-tabel hierboven is de controle. De console weigert te publiceren als er een syntaxfout in staat.
