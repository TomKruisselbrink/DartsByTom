# 4D-1a: spelerskaart en beurt (X01) — verschilrapport

Branch `feat/fase4d`, vanaf `8fdec72`. Nulmeting `faf50f0` onaangeroerd; `main` = `4785a1f`; `APP_VERSION` 252 (geen release).
Beslissingen Tom (24-11-2026): K7 A, K8 B, K9 B, K12 B, K10 B, K6 B, plus de zes aanvullende voorwaarden.

## 1. Wat er veranderd is

| Onderdeel | Was | Nu | Beslissing |
|---|---|---|---|
| Beurt | terracotta vlak, naam in terracotta (2,64–3,07 contrast), "● " als tekst | terracotta rand + gloed (ook in donker), gevuld bolletje 10 px, label **GOOIT/THROWS** als terracotta plaatje met witte tekst (5,02), naam in gewone tekstkleur (10,9–13,3) | K8 B |
| Label bij 3+ spelers | — | in de meta-regel ("GOOIT · gem. 60"), zodat de naam de breedte houdt | K8 B |
| Legstand | 3 grijze bolletjes van 8 px, set als "S1" in 10 px terracotta | **"legs 2"** in Flow (20 px telefoon, 17 px bij 3+ spelers, 28–46 px kantine), bij sets **"sets 1 legs 2"**; bolletjes aanvullend bij ≤ 5 te winnen legs en 1–2 spelers, verborgen op ≤ 420 px breed; gewonnen bolletje `--accent-text`, leeg = ring | K9 B |
| Legstand toernooi | niet op de kaart (alleen de balk "LEG 4 VAN 5 · Henk 2 – 1 Tom") | ook op de kaart, uit `trn.currentMatch` (elke toernooileg is een eigen potje, dus `state.legWins` is daar altijd 0) | K9 B |
| Plaats legstand | rechtsboven naast de naam | telefoon/tablet staand: **onderaan rechts** (naam houdt de breedte); kantine-opstelling (liggend ≥ 1000): rechtsboven; 5–6 spelers: naast de naam (de kaart wordt niet hoger) | — |
| Score 3–4 spelers | `clamp(26px, 9vh − 34px, 52px)` | `clamp(34px, 9vh − 26px, 72px)` | voorwaarde 2 |
| Meta actieve kaart | `--text-muted` (licht 3,51) | `--text-soft` (licht 5,58, donker 7,34) | contrast |
| Uitgooi-route niet-actieve speler | 10 px, kon naar 2 regels | 12 px, op één regel (op < 360 px mag hij naar 2 regels: niets afgesneden) | K12, K10 |
| Uitgooi-route actieve speler (`#checkout-strip`) | ongewijzigd, laag 1 | **ongewijzigd** | voorwaarde 1 |
| Laatste beurt (−60) | bij elke speler | bij de niet-actieve speler; bij de actieve speler staat daar nu het label | laag 3 |
| Kantinescherm (≥ 1600 liggend) | kop 16 px, meta 12 px, legstand 8-px-bolletjes | kop-ondertitel 15–22 px, kop 28–44 px, meta/label 15–24 px, legstand 28–46 px, toernooibalk 15–22 px | K6 B, K12 |
| Toernooibalk | 11 px, terracotta op terracotta-tint | 12 px, `--accent-text` | K12, K7 |

**Code:** alleen CSS in `<style>` (scope `#sb-players`, `#x01-head`, `#trn-leg-bar`; de Afgooien-kaart die ook `.x-card` heet, blijft ongewijzigd) en in `renderGame` het HTML-fragment van de kaart (bolletje, label, legstand). Eén token: `--turn-glow` (de bestaande lichte beurtgloed, nu ook voor donker). Twee vertalingen: `gooit` → `throws`, `sets` → `sets` (anders maakte de bestaande hoofdletterregel er "SETS" van). `buildCheckoutBadges`: 10 → 12 px, padding 7 → 5 px. **Niet geraakt:** spellogica, `state`, opslag, Firebase, invoer, bot, toernooilogica.

## 2. Visuele vergelijking t.o.v. `faf50f0` (volledige run, 1253 opnames, 2969 s)

**1086 gelijk, 167 verschillend.** Alle verschillen vallen in X01-scenario's plus `bevestig-stop`:

| Scenario | Verschillend | Op de opgegeven lijst? |
|---|---|---|
| x01-2sp | 29/29 | ja |
| x01-4sp | 29/29 | ja |
| x01-teams | 20/20 | ja |
| x01-double-vraag | 20/20 | ja (X01-scherm achter de vraag) |
| x01-dubbel-kiezen | 20/20 | ja (idem) |
| x01-stats-blad | 20/20 | ja (idem) |
| bevestig-stop | 29/29 | **ja, toegevoegd na akkoord Tom (24-11)**: alleen de geblurde X01-achtergrond; **0 pixels verschil binnen het bevestigvenster** in alle 29 opnames |
| alle 48 andere scenario's (o.a. hervatten, rematch, winst, Afgooien met `.x-card`) | 0 | — |

**Formeel vastgelegd:** `tests/visual/expect/4D-1a.json` (toegestane scenario's + vensterregel). Controle `design/scope_4d1a.mjs` rekent alle 1253 opnames opnieuw pixel voor pixel na, meet per bevestig-stop-opname de rechthoek van `.ask-box` en telt de verschillende pixels daarbinnen: uitkomst **GOED — 167 anders, allemaal toegestaan, max 0 pixels in het venster** (`design/4d-log/scope-4d1a.json`).

Vóór/na-beelden per context: zie de zip (`1-…` t/m `10-…`). Volledig rapport lokaal: `tests/visual/out/compare/nu/index.html`.

## 3. Metingen per viewport (NL, donker; licht/automatisch/EN identieke maten)

| Viewport | Score 2 sp. | Score 4 sp. | Naam | Label | Legstand | Meta | Kleinste tekst op het scherm | Ruimte boven spelbalk 2 sp. / 4 sp. |
|---|---|---|---|---|---|---|---|---|
| 360×640 | 42 → 42 | **26 → 34** | 13 | 12 | 20 | 12 | 10 → 11 ¹ | −6 → −6 / −2 → −3 ² |
| 375×667 | 42 → 42 | **26 → 34** | 13 | 12 | 20 | 12 | 10 → 11 ¹ | 11 → 12 / 16 → 15 |
| 390×844 | 64 → 64 | 42 → 50 | 13 | 12 | 20 | 12 | 10 → 11 ¹ | 18 → 18 / 18 → 18 |
| 430×932 | 75 → 75 | 50 → 58 | 13 | 12 | 20 | 12 | 10 → 11,6 ¹ | 18 → 18 |
| 768×1024 | 84 → 84 | 52 → 66 | 13 | 12 | 20 | 12 | 10 → 12 | 18 → 18 |
| 1024×768 | 110 → 110 | 56 → 56 | 16 | 12 | 20 | 12 | 10 → 12 | 18 → 18 |
| 1280×800 | 115 → 115 | 64 → 64 | 16 | 12 | 20 | 12 | 10 → 12 | 18 → 18 |
| 1920×1080 | 162 → 162 | 96 → 96 | 20,5 | 18,4 | 36,7 | **12 → 18,4** | 10 → 12 ³ | 18 → 18 |

¹ De overgebleven 11 px is het woord "UITGOOI" in de uitgooi-strook (`#checkout-strip`, `clamp(11px,…)`). Die strook is laag 1 en viel buiten 4D-1a; voorstel: meenemen in 4D-1b.
² 360×640: ook vóór 4D-1a viel de onderste toetsrij al deels onder de spelbalk (scrollen nodig); niet verslechterd. Dit is een 4D-1b-onderwerp (invoer en spelbalk).
³ 1920: kleinste tekst 12 px zit in de invoer rechts (snelscores, "Henk gooit"): 4D-1b/1c.

**Contrast (laagste waarde over het achtergrondverloop):**

| Tekst | Donker / auto-donker | Licht / auto-licht | Was |
|---|---|---|---|
| naam actieve speler | 13,25 | 10,92 | 2,64 / 3,07 (C11) |
| label GOOIT | 5,02 | 5,02 | — |
| legstand (cijfer) | 13,25 | 10,92 | — (bolletjes, geen tekst) |
| meta actieve kaart | 7,34 | 5,58 | 4,62 / 3,51 |
| naam niet-actieve speler | 4,86–4,97 | 4,94 | gelijk |

Volledige tabel (2 scenario's × 8 viewports × 4 themastanden NL + EN donker, vóór en na): `design/4d-log/metingen-4d1a.json`.

## 4. Legstand bij verschillende wedstrijdvormen (`design/legstand_4d1a.mjs`)

30 gevallen (10 vormen × 375 NL, 1920 NL, 390 EN), alle correct:

| Vorm | Kaart toont |
|---|---|
| first to 3, 2 spelers (2–1) | legs 2 / legs 1, bolletjes 2/3 en 1/3 (alleen ≥ 421 px breed) |
| best of 5, 2 spelers (1–2) | legs 1 / legs 2, bolletjes uit 3 |
| first to 7 (4–6) | legs 4 / legs 6, geen bolletjes (> 5) |
| 3 sets, first to 3 legs (sets 1–0, legs 2–1) | sets 1 legs 2 / sets 0 legs 1, bolletjes = legs in de set |
| 3 spelers, first to 3 | legs per speler in de meta-regel, geen bolletjes |
| teams 2 tegen 2, first to 3 | teamgenoten tonen dezelfde teamstand |
| 6 spelers | legstand naast de naam, kaart niet hoger dan vroeger |
| één leg | geen legstand (zoals vroeger) |
| toernooi best of 5 (Henk 2 – Tom 1, Tom begint) | Tom legs 1, Henk legs 2: juiste koppeling ook als de spelersvolgorde is omgedraaid |
| toernooi best of 1 | geen legstand |

Uitkomst per geval: `design/4d-log/legstand-4d1a.json`.

## 5. Tests

| Controle | Uitkomst |
|---|---|
| `npm test` | **118/118** in 32 suites (contrast, theme-rules, tokens, tokens-ratchet, html-sinks, tikvlakken NL + EN op 320/360/375/390) |
| Mutaties | **21/21 gevangen** (na het verlagen van het ratchet-maximum) |
| Tikvlakken | geen nieuwe bevinding, NL en EN, 4 breedtes |
| Ratchet | telling 182 = maximum **182** (183 → 182 met akkoord Tom, 24-11); kopie met één extra CSS-kleur: "CSS hard 183 (max 182)" → test faalt |
| html-sinks | groen; 4 allowlist-sleutels aangepast aan het nieuwe fragment (zelfde redenen), getallen via `_esc` |

**Verloop:** de eerste run gaf 20/21 (maximum 183, telling 182). Na jouw akkoord is alleen `cssHard` 183 → 182 gezet (`jsHard` 132 ongewijzigd); daarna mutatie volledig opnieuw: 21/21, en `npm test` opnieuw: 118/118.

**Over de mutatie-run:** de visuele mutatie vergelijkt een gemuteerde kopie met een referentie en eist dat alleen home verschilt. Met `faf50f0` als referentie verschilt X01 nu bedoeld, dus heb ik als referentie de huidige code zonder mutatie gebruikt (`REF=/tmp/cur4d`). Dat is de juiste opzet vanaf 4D; de test zelf is niet aangepast.

## 6. Gevonden en opgelost tijdens het bouwen (geen scope-uitbreiding)

1. Op 375 px verdrong de legstand de naam ("T…"): legstand naar onderaan verplaatst.
2. Bij teams (EN) viel de naam weg achter "THROWS": label bij 3+ spelers naar de meta-regel.
3. Het label haalde 4,47 (donker) en 3,68 (licht) als terracotta tekst: nu een terracotta plaatje met witte tekst (5,02), wat aansluit op "vulkleur voor de beurtmarkering" (K7).
4. Op 360 px werd de kaart 22 px hoger doordat de route op 12 px naar 2 regels ging: route op één regel en compactere badges; de kaart is nu 1 px lager dan vroeger.
5. Op 320 px gaf dat een afgesneden route en nieuwe "onder de balk"-meldingen: onder 360 px mag de route weer naar 2 regels (zoals vroeger), tikvlaktest 320 weer gelijk aan de nulmeting.
6. Bij 6 spelers maakte de legstand de kaarten hoger (onderste toetsrij onder de balk): legstand naast de naam.
7. In het Engels werd "sets" "SETS": eigen vertaling toegevoegd.

## 7. Open punten en grenzen (voor jouw beoordeling)

- **`bevestig-stop`:** geaccepteerd als indirect verschil (Tom, 24-11) en formeel in de lijst; het venster zelf is pixel-gelijk (zie §2).
- **5–6 spelers op lage schermen (≤ 740 px hoog):** label GOOIT ontbreekt daar; voorlopig geaccepteerd (Tom, 24-11). Onderzoek in 4D-1b; lukt het niet zonder de onderste toetsrij te verdringen of de bediening te verkleinen, dan blijft het zo.
- **Kleinste tekst 11 px** op telefoons: het woord "UITGOOI" in de uitgooi-strook (laag 1, buiten 1a). Voorstel: 4D-1b.
- **Toernooibalk** bovenaan blijft bestaan naast de legstand op de kaart ("LEG 4 VAN 5"). Opruimen of samenvoegen met de kop: 4D-1c.
- **Contrastnulmeting:** C11 (accent als kleine tekst) staat nog in `contrast.allow.json`: de actieve naam is opgelost, maar de 180-snelscore (1b) en de winstscherm-cijfers (stap 5) gebruiken nog accent als tekst. Niets uit een nulmeting gehaald.
- **Kruiscombinaties** (gekozen thema ≠ systeemthema): geen nieuwe themaregels (theme-rules groen); alles via bestaande tokens.
- **Safari op een echte iPhone:** niet getest (kan hier niet). Bij de release van bundel R1 verplicht.

## 8. Meegenomen naar 4D-1b (Tom, 24-11-2026)

1. "UITGOOI" in de uitgooi-strook (nu 11 px) verbeteren.
2. Onderste toetsrij op 360×640 (valt deels onder de spelbalk).
3. Dubbele informatie: toernooibalk bovenaan en de legstand op de kaart.
4. Label GOOIT bij 5–6 spelers op lage schermen.
Plus wat al gepland stond: C10 (Stop in lichte spelbalk), 180-snelscore in accenttekst (C11), tikvlakken snelscores op 320.
