# Beveiligingstests (DartsByTom)

Losse testscripts; de app zelf heeft geen afhankelijkheden. Nodig: Node 18+ en Playwright met Chromium.

```
export PLAYWRIGHT=/pad/naar/node_modules/playwright/index.js   # of: npm i -g playwright
export CHROMIUM=/pad/naar/chromium                              # optioneel
node tests/security/html-sinks.mjs        # statisch: geen onge-escapete data in HTML/handlers
node tests/security/taint-local.mjs       # oude lokale data met payloads in elk veld (ook getalvelden)
node tests/security/taint-remote.mjs      # groep, back-up, import, vrienden, inbox: veilig tonen + byte-gelijk binnen
node tests/security/names-compat.mjs      # namen met speciale tekens komen exact binnen; invoerbeleid B1/B2
node tests/security/no-disappear.mjs      # geen spelers/potjes weg, tellers niet lager (groep: bekend gedrag als waarschuwing)
node tests/security/report.mjs            # melden in plaats van overslaan, NL en EN
node tests/security/diag-legacy.test.mjs  # de diagnosepagina (alleen lezen, geanonimiseerd)
```

Exitcode 0 = geslaagd. `ROOT=<map>` test een andere versie (bijv. een uitgepakte oude release).

**XSS-criteria** (klasse 1 is geen fout): 1 veilige zichtbare tekst · 2 onverwacht HTML-element · 3 attribuutinjectie ·
4 uitgevoerd script/event-handler · 5 uitvoering in handler-context (incl. kapotte handler of een verkeerde waarde naar de doelfunctie).

`html-sinks.allow.json`: beoordeelde concatenaties, sleutel `functie|expressie`, alleen getallen, codeconstanten of door
de code opgebouwde HTML. Gebruikers- of serverdata hoort daar nooit in.

`diag-legacy.html` + `INSTRUCTIES.md`: alleen-lezen diagnose van exports/Firestore-data (stap 0 van het herstel v246).
