# W1 groep kaarten en spelstatus: verloop

1. Eerste poging: berekende stijl 189 verschillen (donker): `button.g-miss` in `.bob-keys` verloor zijn onderschaduw.
   Oorzaak: de neutrale tegelregel `.bob-keys button{box-shadow:var(--tile-shadow)}` (0,1,1) won van `.g-miss` (0,1,0).
   Actie: `.bob-keys button` uit de omzetting; blijft in de lichte themaregel (uitzondering E9). Geen waarden aangepast.
2. Tweede poging: 24 verschillen (licht): `.metric` kreeg de latere `.metric{box-shadow:var(--elev-1)}` in plaats van de
   tegelschaduw. Actie: `.metric` uit de tegelregel; de bestaande `.metric`-regel krijgt `var(--metric-shadow)`
   (donker `var(--elev-1)`, licht `var(--tile-shadow)`), dus dezelfde specificiteit als voorheen in donker.
3. Derde poging: berekende stijl 0 verschillen (6 standen × 55 scenario's), quick compare 292/292 gelijk.
`design/migrate_4c3.py kaarten` op 2fb8835 geeft byte-gelijk het resultaat (gecontroleerd met cmp).
