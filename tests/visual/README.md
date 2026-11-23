# Visuele regressietest (fase 4A)

Doel: vóór en tijdens fase 4 (ontwerpsysteem) bewijzen dat schermen niet onbedoeld veranderen.

## Werkwijze: vergelijken met een goedgekeurde versie, niet met opgeslagen plaatjes

`compare.mjs` legt elk scenario twee keer vast, in **dezelfde** omgeving: één keer met de goedgekeurde versie (REF) en één keer
met de huidige code. Daarna pixel voor pixel vergelijken (pixelmatch, drempel 0.1 per pixel). Voordelen:
- geen honderden PNG's (tientallen MB) in de openbare repo of in de GitHub Pages-site;
- geen valse verschillen doordat een andere computer letters net anders tekent;
- de referentie is altijd een echte, vastgelegde versie: commit **`faf50f0`** (v252, goedgekeurd 23-11-2026). Die blijft
  onaangeroerd. De tag `visual-baseline-v252` bestaat alleen lokaal (pushen van tags mag in de sessie niet); de commit is de
  vaste referentie.

```
git show faf50f0:index.html > /tmp/ref/index.html
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

## Inventaris en dekking (bijgewerkt in fase 4C-0)

`scenarios.mjs`: **55 scenario's**. De eerste 46 zijn precies die van de goedgekeurde baseline v252 (test `coverage.mjs`
bewaakt dat). Fase 4C-0 voegde 9 toestanden toe: Stop-bevestigvenster, "Potje hervatten?", toernooi "wie begint",
update-melding, iPhone-uitleg, Random Checkout "Uitgegooid?", Halve It-rondes, "Eindstand corrigeren", "Rondes corrigeren".

| Dimensie | Wat | Waarom |
|---|---|---|
| Telefoon | 375×667, 390×844, 430×932 × NL/EN × licht/donker, elk scenario | basis; EN op smal want tekstlengte |
| Liggend | 1280×800, 1920×1080 × NL/EN × licht/donker, scenario's met `land:true` | kantinescherm |
| Tablet | 768×1024, 1024×768 × NL × licht/donker, elk scenario | iPad staand/liggend (1024×768 valt nu in de kantine-indeling) |
| Smal | 360×640 × NL × licht/donker, elk scenario | gangbare Android-maat |
| Automatisch thema | systeem donker en licht, geen keuze in de app: 390×844 NL elk scenario, plus 1920×1080 donker voor `land:true` | wat gebruikers zien die nooit een thema kozen (donker wijkt af van "Donker" gekozen) |

Totaal 1253 opnames: de oorspronkelijke 672 (zelfde bestandsnamen als de baseline) + 581 aanvullend.
`node tests/visual/capture.mjs --extra` legt alleen de aanvullende vast. `--quick` (292) voor tussendoor.

Dekking wordt **aangetoond**, niet geteld: `EXPECT` in `scenarios.mjs` zegt per scenario op welk scherm, welke
instellingenpagina en welke overlay het landt (gecontroleerd door `tests/core/tap-390.mjs`), en `tests/core/coverage.mjs`
faalt als de app een scherm, instellingenpagina, overlay of onderblad heeft zonder scenario en zonder reden in
`OVERLAY_EXEMPT`/`SHEETS_EXEMPT`.

Per opname ook automatische controles: horizontale overloop, niet-vertaalde tekst in het Engels, knoppen onder de spelbalk,
of een spelscherm moet scrollen, aantal teksten < 11 px en tikvlakken < 40 px.
