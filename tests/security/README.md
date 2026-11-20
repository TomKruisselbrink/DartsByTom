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
node tests/security/finish-gate.mjs       # v247: 'Potje afronden?' per spel (Ongedaan, Afronden, herstart midden in de vraag)
REF=<oude versie> node tests/security/finish-gate-eq.mjs  # Afronden slaat exact hetzelfde op als de referentie
node tests/security/hi-correct.mjs        # v247: Halve It-rondes corrigeren (winnaar, tellers, tombstone, sync, vrienden)
```

Exitcode 0 = geslaagd. `ROOT=<map>` test een andere versie (bijv. een uitgepakte oude release).

**XSS-criteria** (klasse 1 is geen fout): 1 veilige zichtbare tekst · 2 onverwacht HTML-element · 3 attribuutinjectie ·
4 uitgevoerd script/event-handler · 5 uitvoering in handler-context (incl. kapotte handler of een verkeerde waarde naar de doelfunctie).

`html-sinks.allow.json`: beoordeelde concatenaties, sleutel `functie|expressie`, alleen getallen, codeconstanten of door
de code opgebouwde HTML. Gebruikers- of serverdata hoort daar nooit in.

`diag-legacy.html` + `INSTRUCTIES.md`: alleen-lezen diagnose van exports/Firestore-data (stap 0 van het herstel v246).

- `eli-save.mjs` (v248): Eliminatie slaat per speler 1 potje op (won, beurten, eindstand, matchFormat), ook bij double out, solo zonder winst; geschiedenis/statistieken NL/EN; rare namen ge-escapet.
- `finish-gate-eq.mjs`: met een referentie van vóór v248 `SKIP=eliminatie` meegeven (bewust verschil).
- `x01-gate.mjs` (v249): X01 afrond-vraag niet na een tussenleg, niet bij double out, niet bij een uitgooi door de bot. De positieve gevallen (single out, legs, sets, teams, toernooi) staan in `finish-gate.mjs`.
- `ec-correct.mjs` (v249): Eindstand corrigeren (Cricket, ATC, Afgooien, Shanghai met ontbrekende tegenstander, solo Bob's 27 met rare naam), tellers, tombstones, vangnet, knoppen, EN.
- `rematch-start.mjs` (v250): Rematch → Zelf kiezen en Loting laten bij elk spel de gekozen speler beginnen (ook setup-pad Random Checkout/121, Afgooien willekeurig + bullronde, Random Checkout zelfde checkout per ronde).
