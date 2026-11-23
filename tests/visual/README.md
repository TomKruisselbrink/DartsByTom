# Visuele regressietest (fase 4A)

Doel: vóór en tijdens fase 4 (ontwerpsysteem) bewijzen dat schermen niet onbedoeld veranderen.

## Werkwijze: vergelijken met een goedgekeurde versie, niet met opgeslagen plaatjes

`compare.mjs` legt elk scenario twee keer vast, in **dezelfde** omgeving: één keer met de goedgekeurde versie (REF) en één keer
met de huidige code. Daarna pixel voor pixel vergelijken (pixelmatch, drempel 0.1 per pixel). Voordelen:
- geen honderden PNG's (tientallen MB) in de openbare repo of in de GitHub Pages-site;
- geen valse verschillen doordat een andere computer letters net anders tekent;
- de referentie is altijd een echte, vastgelegde versie: de tag **`visual-baseline-v252`** (na goedkeuring door Tom).

```
git show visual-baseline-v252:index.html > /tmp/ref/index.html
REF=/tmp/ref npm run visual:compare              # alles (± 25 min op 2 kernen), of:
REF=/tmp/ref npm run visual:compare -- --quick   # ± 150 opnames, ± 7 min
REF=/tmp/ref npm run visual:compare -- --only=x01-2sp,home
npm run visual:capture                           # alleen vastleggen + rapport (index.html) om te bekijken
```

Een verschil is niet automatisch fout: in fase 4 *moeten* schermen veranderen. Het rapport (`tests/visual/out/compare/nu/index.html`)
toont welke opnames veranderd zijn (rood omrand, met het verschilbeeld). Bedoelde veranderingen keurt Tom goed; daarna wordt die
versie de nieuwe baseline (nieuwe tag). Onbedoelde veranderingen zijn een fout.

## Wat vastligt (zodat er geen zinloze verschillen ontstaan)

| Dynamisch | Zo vastgezet |
|---|---|
| Datum/tijd ("Vandaag", tijdstempels) | Playwright-klok vast op 20-11-2026 20:15 (Europe/Amsterdam), vaste `locale` |
| Toeval (checkouts, schudden, loting, nummers) | `Math.random` vervangen door een vaste reeks (seed) |
| Spelers, scores, geschiedenis | vaste testdata (`fixture.mjs`), elke opname vers geladen |
| Animaties, overgangen, confetti, cursor | uitgezet (CSS + `reducedMotion`), confetti verborgen |
| Meldingen (toasts) | uitgezet tijdens het vastleggen |
| Firebase | nep-Firestore zonder netwerk (`security/fakefb.js`); per scenario eigen inhoud (bijv. ingelogd met vrienden) |
| Lettertypes | wachten op `document.fonts.ready` (de fonts zitten in `index.html`) |
| Apparaat-ID, geluid, omroeper, installatiebanner | vast / uit |

Gecontroleerd: twee onafhankelijke runs van dezelfde versie leveren 153/153 pixel-gelijke opnames op, en een verschil van
1 px padding op één kaart wordt wél gevonden.

## Inventaris

`scenarios.mjs`: 47 scenario's (start, nieuw spel, alle spelschermen + dialogen, uitslag, overzichten, instellingen incl.
account/vrienden ingelogd en niet ingelogd, foutlog/synchronisatieproblemen, toernooi). Elk scenario op 3 telefoonmaten
(375×667, 390×844, 430×932); spel-, uitslag-, begin-, ranglijst- en toernooischermen ook liggend (1280×800, 1920×1080);
alles in NL/EN × licht/donker. Per opname ook automatische controles: horizontale overloop, niet-vertaalde tekst in het
Engels, knoppen onder de spelbalk, of een spelscherm moet scrollen, aantal teksten < 11 px en tikvlakken < 40 px.
