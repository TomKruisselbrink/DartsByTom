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

**De catch-all.** Je huidige regels laten alles open behalve accounts ("groepen, andere tools"). Ik kan niet zien of
andere tools van jou dit Firebase-project gebruiken. Daarom blijft de catch-all staan voor alles behalve groepen.
Kijk in de console bij **Firestore Database → Data** welke collecties er links staan:
- alleen `groups`, `users`, `usernames`, `friendRequests` → haal het laatste blok (`match /{coll}/{document=**}`) weg;
- ook andere (van je andere tools) → laten staan. Die collecties zijn dan nog steeds voor iedereen open; dat is een
  apart probleem van die tools.

**Groepscode in de app.** Wie nog een groepscode heeft ingesteld, krijgt na deze regels een melding dat schrijven
naar de groep geweigerd wordt (Instellingen → Gegevens → Synchronisatieproblemen). Er gaat lokaal niets verloren.
Volgens jou gebruikt niemand de groep meer.

## Toepassen (± 5 minuten)

1. Firebase-console → project `ons-app-65e13` → Firestore Database → **Regels**.
2. Kopieer de huidige regels naar een tekstbestand (terugzetten = terug plakken en publiceren).
3. Plak de inhoud van `firestore.rules` eroverheen (eventueel zonder het laatste blok, zie boven).
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

5. Publiceren.
6. Controle in de app (op twee telefoons met een account): speel een potje met een gekoppelde vriend, kijk of het bij
   de ander binnenkomt, en open Vrienden-weergave in Statistieken. Account-back-up: Instellingen → Account →
   Back-up maken. Alles moet werken zoals voorheen.

## Wat ik niet kon testen

De Firebase-emulator kan in mijn omgeving niet gedownload worden. De regels zijn dus niet in een emulator gedraaid;
de speeltuin-tabel hierboven is de controle. De console weigert te publiceren als er een syntaxfout in staat.
