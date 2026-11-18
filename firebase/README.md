# Firestore-regels (fase 1, v245)

De Firestore-regels staan in de Firebase-console, niet in deze repo. Dit mapje bevat het blok voor de
groepssync (`groups.rules`) en hoe je het veilig toepast.

## Waarom

Tot v244 kon een spelersnaam met HTML-code (bijvoorbeeld `<img onerror=…>`) via de groepssync op elke
telefoon in de groep code uitvoeren. In v245 is dat in de app zelf dichtgezet (alles wordt veilig
weergegeven en data van buiten wordt schoongemaakt). Deze regels zijn de tweede laag: Firestore weigert
zulke namen dan al bij het opslaan.

## Belangrijk: de catch-all

Firestore staat een schrijfactie toe zodra **één** regel hem toestaat. Zolang er een regel als deze staat:

```
match /{document=**} {
  allow read, write: if true;
}
```

doet het groepsblok niets. De catch-all moet dus weg of smaller. Kijk eerst in de console bij **Data**
welke collecties er bestaan. De app gebruikt: `groups`, `users` (met `backup`, `public`, `friends`,
`inbox`), `usernames` en `friendRequests`. Die laatste vier hebben al eigen regels. Staat er in de Data-tab
niets anders, dan kan de catch-all weg zodra het groepsblok erin staat.

## Toepassen (± 5 minuten)

1. Firebase-console → project `ons-app-65e13` → Firestore Database → **Regels**.
2. Kopieer de huidige regels eerst naar een tekstbestand (terugzetten = terug plakken).
3. Plak de functies en het `match /groups/{code}`-blok uit `groups.rules` binnen
   `match /databases/{database}/documents { … }`.
4. Haal de catch-all weg (of beperk hem tot collecties die echt nog nodig zijn).
5. Test in de **Regels-speeltuin** (Rules Playground) van de console:

| Simulatie | Pad | Gegevens | Verwacht |
|---|---|---|---|
| create | `groups/TEST/players/Tom` | `{"games":1,"wins":0,"gameHistory":[]}` | toegestaan |
| create | `groups/TEST/players/A<img>` | `{"games":1}` | geweigerd |
| update | `groups/TEST/players/Tom` | `{"games":"veel"}` | geweigerd |
| update | `groups/TEST/players/Tom` | `{"nickname":"<b>x</b>"}` | geweigerd |
| get | `groups/TEST/players/Tom` | — | toegestaan |
| update | `groups/TEST` | `{"hidden":["Piet"]}` | toegestaan |
| delete | `groups/TEST` | — | geweigerd |

6. Publiceren. Open daarna de app op twee telefoons in de groep en speel een potje: het moet bij de ander
   verschijnen zoals altijd.

## Wat deze regels níet doen

- Ze maken de groep niet privé: wie de groepscode heeft, kan nog steeds lezen en geldige data schrijven.
  Dat lost pas het uitfaseren van de groepscode op (fase 6 van de roadmap), als iedereen een account heeft.
- Firestore-regels kunnen geen lijsten doorlopen. Tekst binnen `gameHistory` (bijvoorbeeld `opponents`)
  wordt dus niet gecontroleerd. Daarvoor zorgt de app zelf: alle binnenkomende data gaat door `_scrub()`.

## Content-Security-Policy

`index.html` heeft sinds v245 een CSP met alleen `object-src 'none'; base-uri 'self'; form-action 'self'`.
Een CSP die ingevoegde inline event-handlers blokkeert (`script-src` zonder `'unsafe-inline'`) zou nu de
hele app breken: de interface gebruikt 356 `onclick`-attributen. Dat kan pas nadat die zijn omgezet naar
`addEventListener` (fase 4/5).
