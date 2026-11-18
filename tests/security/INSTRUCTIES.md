# Back-up en diagnose vóór v246 (stap 0)

Niets hiervan wijzigt je data. Doe het **voordat** er nog op andere telefoons gespeeld wordt.

## Wat ik al gedaan heb (stap 0.1)

- Gecontroleerd dat `fa714d0` de v245-productieversie is: `main` op GitHub = `fa714d0`, `APP_VERSION=245`, laatste geslaagde Pages-deploy 18-11 om 19:52 voor precies die commit.
- Branch `checkpoint/v245` op GitHub gezet (= `fa714d0`). De tag `pre-v246` staat alleen lokaal: het pushen van tags mislukt in deze omgeving, de branch dekt hetzelfde af.
- Lokale werkbranch `fix/fase1-herstel` aangemaakt. Daar is nog niets op gebouwd.

## Stap 0.2 – Export per telefoon (op elke telefoon met de app)

1. Open de app. (De export neemt altijd de data van dit toestel, ook als de weergave op Vrienden staat.)
2. Instellingen → Gegevens → **Exporteren** → kies **Alle spelers** → **Kopieer code**.
3. Plak de code in een notitie of tekstbestand en bewaar dat met de naam van het toestel en de datum, bijv. `export-telefoon-tom-18-11.txt`. Dit is je back-up.
4. Speel geen potje tot v246 er is.

Doe dit voor jouw telefoon, het kantinescherm en elke andere telefoon die in de groep zit of met je account werkt (bijv. die van Imke).

## Stap 0.3 en 0.5 – Diagnose op je laptop (alleen lezen)

1. Open `diag-legacy.html` in Chrome, Edge of Safari op je laptop, met dubbelklik. Er wordt niets geïnstalleerd.
2. Vul bij **1. Firestore** de groepscode in en klik **Ophalen uit Firestore**.
   - Lukt dat, klik dan **Kopie opslaan (.json)** en bewaar dat bestand. Dat is de back-up van de productiedata in de groep.
   - Lukt het niet, open dan de twee links die verschijnen, sla elke pagina op als `.json` en kies die bestanden bij "Of: opgeslagen Firestore-JSON".
3. Plak bij **2. Exports** per telefoon de exportcode, of kies het `.txt`-bestand. Geef elk toestel een naam (blijft op je laptop).
4. Klik **Diagnose uitvoeren**.
5. Klik **Rapport kopiëren** en plak het rapport hier in de chat.
   - Het rapport is geanonimiseerd: spelers heten P01, P02 …, potjes E-xxxxxx, telefoons T1, T2 …. Er staan geen namen, geen groepscode en geen teksten in, alleen welke tekens en welke velden verschillen, met datums.
   - Bovenaan staat een waarschuwing als er toch iets herkenbaars in lijkt te staan. Kijk dan even mee voordat je deelt.
   - De **sleutel** (P-nummers ↔ namen) staat apart onderaan. **Die deel je niet**; houd hem bij de hand voor als we het rapport bespreken.
6. Sluit het tabblad. Daarmee is alles uit het geheugen weg.

Het enige netwerkverkeer is het leesverzoek (GET) naar Firestore als je op Ophalen klikt. Exports en rapport blijven op je laptop.

## Wat het rapport beantwoordt (B4)

1. Welke lokale potjes v245 mogelijk heeft aangepast (per telefoon tegenover Firestore).
2. Van welke daarvan het origineel nog in Firestore staat, of juist alleen nog op een telefoon.
3. Welke potjes andere verschillen hebben dan de v245-tekens, met de velden die verschillen. Potjes hebben alleen een aanmaaktijd, geen wijzigingstijd. "Nieuwer" is per potje dus niet vast te stellen; het rapport laat zien welke kant afwijkt en hoe.
4. Wat `_scrub` nog meer zou veranderen dan tekens weghalen: hernoemde sleutels, sleutels die samenvallen (dan gaat een waarde verloren), tekst langer dan 4000 tekens, NaN/oneindig → 0, Firestore-typen die geen JSON zijn, diepte > 12.

Daarnaast: spelers die v245 overslaat, namen die technisch niet naar Firestore kunnen, te lange of afwijkende bijnamen, de velden van het groepsdocument (nodig voor WP3) en de grootste speler.

## Wat de diagnose niet kan zien

- De account-back-up (`users/…/backup`): daarvoor is inloggen nodig. Die back-up wordt bij elke back-up overschreven en bevat waarschijnlijk dezelfde stand als je telefoon.
- Telefoons waarvan je geen export maakt.
- Een tekst die op álle plekken al ingekort is: dan is er geen origineel meer om mee te vergelijken. Het rapport laat dan geen verschil zien.
