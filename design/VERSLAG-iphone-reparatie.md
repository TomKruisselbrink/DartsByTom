# Reparatie 'niet uitgooibaar' op de iPhone (na herstel 4D-1a)

Basis: `feat/fase4d` vanaf `32a21ba`. Gemeld door Tom (geïnstalleerde Safari-PWA op een echte iPhone): de regel "niet uitgooibaar" wordt bij elke speler afgekapt tot "niet uitgooibaa…".

## Oorzaak

**Grens van dit onderzoek:** WebKit (de motor van iOS Safari) is in deze omgeving niet beschikbaar; het downloaden werd geblokkeerd. Ik heb het iPhone-beeld dus niet zelf kunnen draaien, en een bekende WebKit-melding voor precies dit gedrag heb ik niet gevonden. De oorzaak hieronder is daarom afgeleid uit metingen en een nabootsing, niet rechtstreeks in Safari bevestigd.

**Opbouw in `32a21ba`**
- De regel stond in een impliciete 4e rasterrij (`grid-row:4`, buiten het gedefinieerde raster van 3 rijen), met `grid-column:1/-1`.
- Daarbij `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`.
- In Chromium krijgt de regel daarmee de volle kaartbreedte: 138–178 px. "Niet uitgooibaar" is 85,4 px (Flow Text 12 px), dus Chromium kapt nergens af.

**Wat het iPhone-beeld verklaart.** De breedte náást de score (tekstkolom + legstandkolom) op gangbare iPhone-maten, 3–4 spelers, actieve speler aan het begin van een leg:

| Viewport | Kaart (binnen) | Naast de score | "niet uitgooibaar" past daar? |
|---|---|---|---|
| 375×667 (SE) | 146 | 91 | ja |
| 375×812 (mini) | 146 | 73 | nee |
| 390×844 | 153 | 76 | nee |
| 393×852 | 155 | 77 | nee |
| 402×874 | 159 | 78 | nee |
| 414×896 | 165 | 82 | nee |
| 430×932 | 173 | 85 | nee (85 < 85,4) |

- Krijgt de regel in Safari alleen die breedte, dan geeft dat precies het gemelde beeld, op vrijwel elke iPhone en bij elke speler: zodra die aan de beurt is en niet kan uitgooien. Een andere breedte van 73–85 px is er in deze kaart niet.
- **Nabootsing in Chromium** (`design/herstel-4d1a/sim.mjs`): de regel kunstmatig beperken tot de kolommen naast de score.
  - Oude code: afgekapt ("niet uitgooib…" op 390, rond "niet uitgooibaa…" op 414–430).
  - Reparatie: breekt op de spatie ("niet / uitgooibaar"), nooit afgekapt. Zie `4d-log/iphone/nabootsing-390.png`.
- De opbouw met een impliciete rij en een negatief eindlijnnummer is het enige deel dat afhangt van hoe de browser het raster buiten de gedefinieerde rijen oplost. Al het andere in de kaart gebruikt benoemde gebieden en werkt op de iPhone wel goed (score, naam, gemiddelde).

## Oplossing (`index.html`)
1. **Eigen benoemde rij in de rasterindeling.** De kaart met de regel krijgt de klasse `.x-imp-card` en een indeling met een vierde benoemde rij `"imp imp imp"` over alle kolommen (compact en 5–6 spelers). `.x-imp` staat in `grid-area:imp`. Geen impliciete rij en geen `1/-1` meer.
2. **Nooit afkappen.** `white-space:normal; overflow:visible`, geen ellipsis. Bij de volle breedte past de regel op één regel. Mocht een browser hem toch smaller maken, dan breekt hij op de spatie en blijft hij volledig leesbaar.

**Ongewijzigd:** scoregrootte, kaartindeling, actieve-spelerherkenning, de hoogtecompensatie van het lege uitgooivak, en alle tokens, ratchets en allowlists.

In Chromium is de weergave pixel-gelijk aan `32a21ba`: 32/32 eigen opnames op 9 iPhone-maten, en de volledige visuele vergelijking 1253/1253 gelijk. De toetsen staan dus exact waar ze stonden.

## Tests
| Controle | Resultaat |
|---|---|
| `npm test` volledig | **141/141** in 34 suites (was 139; +2 in `x01-kaart`) |
| nieuw in `x01-kaart.mjs` | NL en EN, 9 telefoonmaten (360×640 t/m 440×956, inclusief 375×812, 393×852, 402×874, 414×896, 430×932), 3 en 4 spelers. Controleert: volledige tekst ("niet uitgooibaar" / "no checkout"), niet afgekapt, één regel, volle kaartbreedte, binnen de kaart, in de benoemde rij `imp`, geen nowrap/ellipsis. Op `32a21ba` zakken beide; nu groen |
| mutatietest `--visual` | **28/28** + visuele mutatie (nieuw: "weer impliciete rij met 1/-1" en "weer nowrap + ellipsis", beide gevangen) |
| visueel t.o.v. `32a21ba` (1253 opnames) | **1253/1253 gelijk** |

De nieuwe test bewaakt in Chromium ook de opbouw (benoemde rij, geen afkapstijl), omdat Chromium het Safari-verschil zelf niet toont.

## Wat Tom op de iPhone moet controleren
- Bij 3 en 4 spelers, aan het begin van een leg: staat "niet uitgooibaar" volledig op één regel onder het gemiddelde, bij elke speler die aan de beurt is? Graag ook in het Engels ("no checkout").
- **Als hij toch op twee regels staat ("niet / uitgooibaar"),** krijgt de regel in Safari nog steeds niet de volle breedte. Dan klopt mijn verklaring maar half. De tekst is dan wel volledig, maar de kaart is 14 px hoger en de toetsen kunnen in die stand 14 px zakken. Graag dan een schermafbeelding.
