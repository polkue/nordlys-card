# Nordlys

Animeret dashboard-kort til Home Assistant på dansk: himmel der følger tiden på døgnet, 10 verdener, vejreffekter, lys, scener, alarm og energi med priser i kroner.

Nordlys er en dansk udgave af **[Aurora Glass v3](https://github.com/lucalux00/aurora-glass-v3)** af lucalux00. Al design og funktionalitet kommer derfra. Denne udgave har kun:

- **Dansk brugerflade:** alle tekster, ugedage, måneder og dansk talformat (`da-DK`).
- **Kroner:** priser vises i kr. og kr/kWh i stedet for €.
- **Nyt navn:** kortet hedder `custom:nordlys-card`, så det ikke kolliderer med originalen. GPL-licensen kræver nyt navn på ændrede versioner.
- **`labels`:** ny konfiguration, så du kan give lys, rum og scener dine egne navne.

## Installation via HACS

1. Gå til HACS → ⋮ → *Brugerdefinerede repositories*.
2. Tilføj denne repo-URL med typen **Dashboard**.
3. Søg efter **Nordlys** og vælg *Download*.
4. Genindlæs browseren.

## Eksempel

```yaml
type: custom:nordlys-card
assets: /hacsfiles/nordlys-card/btn/
entities:
  lights:
    salotto: light.stue
    cucina: light.koekken
    # ... se Aurora Glass v3's scheda-esempio.yaml for alle pladser
  weather: weather.forecast_hjem
  temperature: sensor.udendors_temperatur   # valgfri: udetemperatur fra en sensor (fx Netatmo) i stedet for vejrudsigten
  power: sensor.effekt_hus
  energy:
    power: sensor.effekt_hus
    solar: sensor.solceller_effekt        # valgfri: solcelleproduktion (W eller kW) — giver en ekstra måler ved siden af forbruget
    solarEnergy: sensor.solceller_energi  # valgfri: kWh-tæller til "pr. dag" (ellers bruges solarToday)
    grid: sensor.hovedmaaler_effekt       # valgfri: nettoeffekt mod elnettet (+ køb, − salg) — giver en Køb/Salg-måler
    gridImport: sensor.hovedmaaler_energi       # valgfri: kWh købt — køb pr. dag (blå)
    gridExport: sensor.hovedmaaler_returneret   # valgfri: kWh solgt — salg pr. dag (grøn)
    solarPeak: 7000                       # valgfri: fuldt udslag på solcellemåleren i W (standard 7000)
    solarToday: sensor.solceller_i_dag    # valgfri: produceret i dag (kWh)
    ev: sensor.lader_effekt               # valgfri: elbillader (W eller kW) — giver en Elbil-måler. Findes sensoren ikke endnu, vises "—" og "Ingen lader"
    evToday: sensor.elbil_i_dag           # valgfri: ladet i dag (kWh)
    evStatus: sensor.lader_tilstand       # valgfri: Zaptec-tilstand (disconnected/connected_charging …) som chip
    evPeak: 11000                         # valgfri: fuldt udslag på elbilmåleren i W (standard 11000)
    evMin: 5                              # valgfri: hvilestrøm i W; under den vises laderen som 0 W (måler og kurve i Udvikling)
    evEnergy: sensor.lader_energi         # valgfri: laderens samlede kWh-tæller — bruges af kpiEv (ellers evToday)
    kpiEv: true                           # valgfri: viser elbilens kWh og andel af forbruget i felterne I dag … I år
    kpiLayout: liste                      # valgfri: felterne I dag … I år som aflange rækker under hinanden (samme form som lightLayout: liste)
    chartEv: true                         # valgfri: tegner laderens effekt (ev) som lilla kurve i Udvikling
    chartAxis: true                       # valgfri: effekten (W/kW) står ud for de vandrette linjer i venstre side af Udvikling
    chartFit: true                        # valgfri: Udvikling zoomer ind, så kurverne fylder hele højden
    evCost: sensor.elbil_omkostning_total # valgfri: kr-tæller for ladning (ladeeffekt × timepris, integreret) — giver elbilens kr. i felterne og pr. dag. Timer før tælleren fandtes regnes som timens kWh × timens pris (kræver at price er en sensor)
    dayEv: true                           # valgfri: elbilens kWh (og kr.) som egen lilla søjle i "Forbrug pr. dag"; kan også vælges med daySeries: [..., elbil]
    energyTotal: sensor.energi_total
    price: input_number.elpris              # fast pris (kan rettes i kortet) — eller en sensor med live timepris, fx sensor.elpris fra Energi Data Service
    costTotal: sensor.elomkostning_total    # valgfri: samlet kr-tæller (kr); giver rigtige kr. pr. dag/måned/år ud fra timepriser
    heroPrice: true                         # valgfri: elprisen nu øverst til højre i den øverste boks på Energi; prisbjælken skjules
    priceChart: true                        # valgfri: søjlegraf med elprisen time for time de næste 24 timer under toppen af Energi. Læser raw_today/raw_tomorrow (Energi Data Service, Nord Pool) eller today/tomorrow fra price-sensoren; kan også være et andet entity_id
    priceChartSale: true                    # valgfri: salgsprisen som lilla del nederst i hver prissøjle, der glider over i prisfarven (købsprisen står øverst) (fra salePrice med raw_today/raw_tomorrow); kan også være et andet entity_id
    salePrice: sensor.salgspris             # valgfri: salgspris nu (kr/kWh) — viser "Tjener nu" ved salg og salgsprisen i prisbjælken
    revenueTotal: sensor.salgsindtaegt_total  # valgfri: samlet kr-tæller for salg; giver "+X kr. solgt" og kr. på salgssøjlerne
    daySeries: [køb, salg]                  # valgfri: hvilke søjler "pr. dag" viser — forbrug, sol, køb, salg (uden nøglen vises alle)
    dayStack: true                          # valgfri: søjlerne pr. dag lægges oven på hinanden i én søjle, hvor farverne glider over i hinanden
    dayLabel: dato                          # valgfri: skriv 25/10 under søjlerne i stedet for ugedag + dato
    dayNet: true                            # valgfri: resultatet (salg − køb) under hver søjle; i kr. = solgt for − købt for
    dayVertical: true                       # valgfri: tallet står lodret over hver søjle i "pr. dag" (ikke med dayStack)
    dayAxis: true                           # valgfri: skala med kWh (eller kr.) og vandrette hjælpelinjer i venstre side af "pr. dag"
    kpiSolar: true                          # valgfri: deler felterne I dag … I år i to, nederste del viser solcelleproduktionen (og "+X kr. solgt")
    kpiNet: true                            # valgfri: nederst i felterne "Resultat ±X kr." = solgt for − købt for
    sellPositive: true                      # valgfri: salg vises med + og køb med − (Køb/Salg-måleren, Udvikling, tooltip og kr. brugt i felterne, der vises med rødt minus)
    signalColors: true                      # valgfri: tallet på solcellemåleren bliver grønt, når der produceres; tallet ved Køb er rødt og ved Salg grønt
    solarYellow: true                       # valgfri: tallet på solcellemåleren bliver gult (i stedet for grønt), når der produceres
    heroFlow: true                          # valgfri: erstatter teksten og chipsene ved målerne med en energifordeling for i dag (sol, elnet, hjem)
    flowImportToday: sensor.net_kob_i_dag     # valgfri: kWh købt i dag til energifordelingen (ellers fra gridImport-statistikken)
    flowExportToday: sensor.net_salg_i_dag    # valgfri: kWh solgt i dag til energifordelingen (ellers fra gridExport-statistikken)
    flowAnimate: true                       # valgfri: prikkerne løber i strømmens retning, også når animations: false
    flowSelf: true                          # valgfri: egetforbrug af solstrømmen i % øverst til venstre i energifordelingen
    flowSufficiency: true                   # valgfri: selvforsyningsgrad i % (solstrøm brugt i huset / husets forbrug) under egetforbrug
    flowBalance: true                       # valgfri: energibalance (køb og salg i dag) under målerne; målerne rykkes op
    flowEv: true                            # valgfri: lille cirkel for elbilladeren ved Hjem; kWh ladet i dag (evToday), effekt mens bilen lader (ev, over evMin)
    flowPrices: true                        # valgfri: elpris nu og salgspris øverst til højre i energifordelingen; prisbjælken skjules
    kpiWeek: true                           # valgfri: felterne på Energi viser i dag, i går, denne uge, sidste uge og denne måned med kWh, kr., solceller, solgt, resultat, egetforbrug og selvforsyning i % (kræver gridExport til %; med kpiTab står de i stedet for de tomme felter)
    kpiGrid: true                           # valgfri: i stedet for I dag … I år vises de sidste 7 dage, 7 uger og 12 måneder (2 rækker à 6) med kWh, kr., elbil, solceller, solgt og resultat; elbilens kr. kommer fra evCost (og timens kWh × timens pris før tælleren fandtes), ellers et skøn; på mobil kan rækkerne swipes
    heroScene: true                         # valgfri: landskab bag målerne med himmel, sol/måne efter tiden, elmast og hus med solcellepanel; panelet glimter, når der produceres
    sceneLat: 56                            # valgfri: breddegrad til solop- og nedgang i heroScene (standard 56)
    sceneLon: 10                            # valgfri: længdegrad til heroScene (standard 10)
labels:
  lights:            # visningsnavn pr. lys-plads
    salotto: Stue
    cucina: Køkken
  rooms:             # navne på de 5 rum-grupper, i rækkefølge
    - Stue & gang
    - Køkken
    - Soverum
    - Badeværelse
    - Bryggers
  scenes:            # godmorgen, biograf, middag, godnat, ud af huset
    - { sub: "Køkken, gang, bad" }
```

Lys under `extraLights` placeres i et rum ud fra rummets navn, og det er navnet efter `labels.rooms`.

**Fjern lys-pladser:** Sæt en plads til `null` under `entities.lights`, for eksempel `corridoio: null`. Så forsvinder den, og rum uden lys skjules helt.

### Uden animationer

Sæt `animations: false` for at beholde designet uden bevægelse. Det er godt til vægskærme og ældre tablets.

- **CSS:** Animationer, overgange, glas-sløring (`backdrop-filter`) og støj-laget slås fra. Glasfladerne får en tættere baggrund.
- **Landskaber:** De animerede landskaber (SVG) fryses som ét billede.
- **Knapper:** Animerede GIF'er erstattes af færdige stillbilleder (`*.still.png`). Det virker også i Android-appen og fylder mindre.
- **Vejreffekter:** Regn, sne og lignende kører ikke.

I test faldt CPU-tiden på hovedtråden fra cirka 67 ms til cirka 4 ms pr. sekund.

### Bundmenu

`dock` vælger, hvilke knapper der vises i bundmenuen. Mulige værdier er `hus`, `sikring`, `energi`, `scener`, `sluk` og `stil`, og de engelske nøgler `home`, `sic`, `en`, `scenes`, `off` og `style` virker også. Uden `dock` vises alle.

```yaml
dock: [hus, energi]
```

### Skjul sektioner

`hide` skjuler dele af forsiden: `scener` er "Hurtige scener", `tips` er hjælpeknapperne under topbjælken, `bevægelse` er chippen "Roligt i huset", og `navn` fjerner navnet efter "Godmorgen", og `vinduer` slukker lyset i husets vinduer i landskabet.

```yaml
hide: [scener, tips, bevægelse, navn]
```

### Affald

`waste` viser en sektion "Affald" under Lys og rum med næste tømning pr. affaldstype. Den er lavet til integrationen [Affaldshåndtering DK](https://github.com/briis/affalddk), hvis sensorer giver ikon, navn og "Om X dage". Andre sensorer, hvor tilstanden er antal dage, virker også. Afhentning i dag eller i morgen markeres med en gul kant.

```yaml
waste:
  - sensor.affalddk_min_adresse_rest_madaffald
  - sensor.affalddk_min_adresse_plast
  - { e: sensor.affalddk_min_adresse_haveaffald, n: Haveaffald }   # n: eget navn
```

### Mindre kort

`scale` gør hele kortet mindre (eller større) med samme design og menuer, fx til en lille vægskærm på højkant. Kortet fylder stadig hele skærmens højde.

```yaml
scale: 0.55   # Shelly Wall Display X2i på højkant (720×1440) — alt på én skærm
```

### Tilpas til skærmens højde

`fit: true` skalerer hele kortet automatisk, så forsiden (Hus) passer i skærmens højde uden at scrolle. Skalaen regnes ud igen, når skærmen eller indholdet ændrer sig. Energifanen kan stadig scrolles. `fit` erstatter `scale`.

`hide: [landskab]` fjerner huset og landskabet i toppen, så der kun er dato, hilsen, ur og chips tilbage. Det sparer højde og CPU, fordi landskabsbillederne slet ikke tegnes.

```yaml
fit: true
hide: [landskab]
```

### Vægskærm

`custom:nordlys-ur-card` er et let, selvstændigt kort til svage vægskærme som Shelly Wall Display på højkant. Det viser dato, hilsen, ur, udetemperatur, forbrug, lys pr. rum og affald. Der er ingen animationer, ingen sløring og ingen baggrundsbilleder. Teksten skalerer efter kortets bredde.

Rum med 3 lys fylder en hel række, og rum med færre lys deler rækken.

```yaml
type: custom:nordlys-ur-card
temperature: sensor.udendors_temperatur   # valgfri: ellers bruges temperaturen fra weather
weather: weather.forecast_hjem            # valgfri: vejrikon i Ude-chippen
power: sensor.effekt_hus                  # valgfri: Forbrug-chippen
limit: 11000                              # valgfri: W; prikken bliver gul over 35 % og rød over 70 %
scale: 1                                  # valgfri: 0.9 gør alt 10 % mindre
hide: [dato, hilsen]                      # valgfri: skjul dato, hilsen, ude eller forbrug
rooms:                                    # valgfri: tryk på et lys tænder/slukker det
  - name: Stue
    icon: mdi:sofa
    color: "#8B5CF6"                      # valgfri
    lights:
      - { e: light.stue, n: Stue, ic: mdi:sofa }
waste:                                    # valgfri: som waste i hovedkortet
  - sensor.affalddk_min_adresse_rest_madaffald
```

### Affald i egen fane

`wasteTab: true` flytter Affald fra forsiden til sin egen fane i bundmenuen med større felter. Tilføj `affald` til `dock`, hvis du bruger `dock`.

```yaml
wasteTab: true
dock: [hus, energi, affald]
```

### Statistik i egen fane

`statsTab: true` flytter Udvikling og "pr. dag" fra Energi til sin egen fane, Statistik, i bundmenuen. Tilføj `statistik` til `dock`, hvis du bruger `dock`.

```yaml
statsTab: true
dock: [hus, energi, statistik]
```

### Økonomi i egen fane

`kpiTab: true` flytter felterne I dag, I går, Denne måned, Sidste måned og I år fra Energi til sin egen fane, Økonomi, i bundmenuen. Med `energy.kpiWeek` står ugefelterne på deres plads i Energi; ellers er pladsen tom. Tilføj `økonomi` til `dock`, hvis du bruger `dock`.

```yaml
kpiTab: true
dock: [hus, energi, statistik, økonomi]
```

### Månedsrapport i egen fane

`reportTab: true` giver en ny fane, Rapport, i bundmenuen med en solcellerapport for en hel måned. Den åbner på forrige måned, og med pilene kan du bladre til andre måneder. Rapporten viser:

- energi: produktion, købt, solgt og husets forbrug
- økonomi: kr. brugt, kr. tjent, resultat og gennemsnitlig købs- og salgspris
- egetforbrugsandel, selvforsyningsgrad og et skøn over, hvad egetforbruget har sparet
- sammenligning med måneden før, et søjlediagram dag for dag, højdepunkter, en tabel over alle dage og noter om tallene

Tallene hentes fra Home Assistants statistik (ændring pr. døgn) for `energy.solarEnergy` (eller `solarToday`), `gridImport`, `gridExport`, `energyTotal`, `costTotal` og `revenueTotal`. Felter for sensorer, der ikke er sat, udelades. Hver dag kontrolleres: afviger købt + produktion − solgt mere end 0,1 kWh fra husets forbrug, står det i tabellen.

Med `energy.reportEv: true` kommer elbilen med i rapporten: kWh ladet, andel af husets forbrug, hvad opladningen kostede (fra `evCost`, ellers et skøn ud fra den gennemsnitlige købspris), en lilla søjle pr. dag, "Mest ladet" og en kolonne i tabellen. Den bruger `evEnergy` (eller `evToday`).

`reportValues: true` skriver kWh-tallet lodret over hver søjle i "Dag for dag".

Med `start` udelades målinger før en bestemt dato, fx en opsætningsdag. Tilføj `rapport` til `dock`, hvis du bruger `dock`.

```yaml
reportTab:
  start: "2026-10-26"   # valgfri
  open: denne           # valgfri: åbner altid på den aktuelle måned, hver gang man går ind i fanen
dock: [hus, energi, statistik, økonomi, rapport]
```

### Husholdning

`household` giver en ny fane, Husholdning, i bundmenuen. Hvert apparat vises med en tegnet vaskemaskine, der drejer, når den kører, status og resttid, effekt nu samt strøm og vand i dag, denne måned, i år og i alt (ud fra statistikken). Tilføj `husholdning` til `dock`, hvis du bruger `dock`.

```yaml
household:
  - name: Vaskemaskine
    power: sensor.vaskemaskine_effekt          # W
    energy: sensor.vaskemaskine_energi         # kWh-tæller
    water: sensor.vaskemaskine_vandforbrug     # valgfri: liter-tæller
    waterUnit: m3                              # valgfri: vis vandet i m³ i stedet for liter
    state: sensor.vaskemaskine_machine_state   # valgfri: run/pause/stop
    job: sensor.vaskemaskine_job_state         # valgfri: wash/rinse/spin …
    completion: sensor.vaskemaskine_completion_time  # valgfri: færdigtidspunkt
    animate: true                              # valgfri: tromlen drejer, også når animations: false
dock: [hus, energi, husholdning]
```

`householdWaste: true` flytter Affald fra forsiden ind i Husholdning under apparaterne.

### Ladetip til elbilen

`evAdvice: true` viser en chip på forsiden med det bedste tidspunkt at lade elbilen de næste 24 timer, fx "Lad elbil kl. 12–15 · ≈ 1,64 kr/kWh ☀". Hver time vurderes ud fra elprisen (`energy.price`), salgsprisen (`energy.salePrice`) og vejrudsigten (`weather`): strøm fra egne solceller regnes til salgsprisen, fordi det er den, man går glip af. Holder man musen over, står andelen fra solcellerne og prisen, hvis man lader nu.

```yaml
evAdvice:
  hours: 3        # valgfri: hvor mange timer der skal lades (standard 3)
  power: 11000    # valgfri: laderens effekt i W (standard energy.evPeak eller 11000)
  weather: weather.forecast_hjem   # valgfri: ellers bruges entities.weather
```

`washAdvice: true` viser samme slags chip for vaskemaskinen til højre, fx "Vask kl. 11–13 · ≈ 1,52 kr/kWh". Standard er 2 timer ved 800 W; ret med `washAdvice: { hours: 2, power: 800 }`.

### Kamera-pop-up

Viser et kamera live over dashboardet, når en sensor går fra `off` til `on`, fx Frigates personsensor:

```yaml
cameraPopup:
  seconds: 30   # lukker, når sensoren har været off så længe (standard 30)
  max: 300      # lukker senest efter så mange sekunder (standard 300)
  triggers:
    - entity: binary_sensor.indkorsel_person_occupancy
      camera: camera.indkorsel
      name: Indkørsel
    - entity: binary_sensor.carport_person_occupancy
      camera: camera.carport
```

Tryk på krydset eller ved siden af for at lukke. Tryk på billedet for at åbne kameraet. Uden nøglen sker der intet.

Kan skærmen ikke afspille live-strømmen, så brug `mode: mjpeg` eller `mode: billede` (med `interval` ned til 0.15 sek. og `width`) ligesom i Kameraer-fanen. Det kan sættes for hele pop-up'en eller pr. trigger.

### Kameraer i egen fane

`cameraTab` giver fanen Kameraer i bundmenuen (`dock: kameraer`) med alle kameraer live i et gitter, to i bredden og ét på mobil:

```yaml
cameraTab:
  cameras:
    - camera.indkorsel
    - entity: camera.baghave
      name: Baghaven
```

Strømmene startes, når fanen åbnes, og stoppes igen, når man går til en anden fane.

Kan skærmen ikke afspille live-strømmen (fx Shelly Wall Display med Android 8), så brug `mode`. `mjpeg` viser kameraet som en MJPEG-strøm i et almindeligt billede. `billede` henter et nyt stillbillede hvert `interval` sekund (standard 1). Begge kan sættes for hele fanen eller pr. kamera.

```yaml
cameraTab:
  mode: mjpeg          # live (standard), mjpeg eller billede
  interval: 1          # kun til billede: sekunder mellem billeder (ned til 0.15). Et nyt billede hentes først, når det forrige er kommet, så skærmen aldrig får flere i kø
  width: 720           # valgfri, kun til billede: Home Assistant skalerer billedet ned (mindre data til en svag skærm)
  height: 720          # valgfri: mindste højde ved nedskalering (standard = width). HA skalerer i trin på 1/2, 1/4 og 1/8 og holder begge mål over det ønskede
  fill: true           # valgfri: med ét kamera fylder billedet skærmen helt ned til bundmenuen (godt til et lodret kamera)
  trigger: binary_sensor.indkorsel_person_detected   # valgfri: skift til Kameraer, når sensoren går fra off til on (også en liste)
  wake: http://192.168.1.161   # valgfri: tænd skærmen på en Shelly Wall Display (Ui.Screen.Set) ved trigger
  seconds: 60          # valgfri: gå tilbage til den forrige fane, når sensoren har været off så længe (0 = bliv)
  cameras:
    - camera.indkorsel
```

### Indetemperatur ved uret

`heroTemp` viser en temperatur i samme store stil ved siden af uret, med rummets navn under. Det kan være én sensor eller en liste.

```yaml
heroTemp:
  entity: sensor.stue_temperatur
  name: Stue
```

### Kiosk og topbjælke

`kiosk: true` skjuler Home Assistants egen topbjælke og sidemenu, så kortet fylder hele skærmen. Nederst til højre på forsiden er der en knap, der slår kiosk fra og til igen. Valget huskes pr. enhed. `hide: [apparater]` fjerner sektionen Apparater på Energi. `hide: [topbjælke]` fjerner kortets egen topbjælke med Nordlys, status, Stil og tema på alle faner.

```yaml
kiosk: true
hide: [topbjælke]
```

### Lys som liste

`lightLayout: liste` viser lysknapperne som aflange rækker under hinanden, med ikon, navn og tilstand til venstre og kontakten til højre. Det fylder mindre i højden og passer godt til en smal skærm på højkant.

```yaml
lightLayout: liste
```

I listevisningen står rummets ikon og navn på linje med lampernes ikoner og navne.

### Tænd og sluk et helt rum

`roomToggle: true` gør rummets ikon og navn trykbare. Er bare én lampe i rummet tændt, slukker et tryk alle rummets lamper. Er alle slukket, tænder et tryk dem alle. Lamper, der ikke er tilgængelige, springes over.

```yaml
roomToggle: true
```

### Dæmp med en slider

`lightSlider: true` virker både med `lightLayout: liste` og med de almindelige lysknapper. For dæmpbare lamper viser rækken eller knappen lysstyrken som en farvet bjælke, og tilstanden viser procent, fx "Tændt · 60%". Træk vandret hen over rækken for at sætte lysstyrken; den sendes, når du slipper. Et almindeligt tryk tænder og slukker stadig, og lodret træk ruller siden som før. Lamper, der kun kan tænde og slukke, får ingen slider.

```yaml
lightSlider: true
```

### Knapstil

`buttons: kompakt` låser lysknapperne til den kompakte stil med ikoner, og `buttons: billeder` låser dem til billeder. Uden indstillingen gælder det valg, der er gemt i den enkelte browser under "Stil".

### Lys-pladser

Kortet har 11 faste lys-pladser. Nøglerne er de originale italienske:

| Nøgle | Standardnavn | Rum-gruppe |
|---|---|---|
| salotto, ingresso, corridoio | Stue, Entré, Gang | 1 |
| cucina, balcone | Køkken, Terrasse | 2 |
| camera, cameretta | Soveværelse, Børneværelse | 3 |
| bagno_piccolo, bagno_doccia | Lille bad, Badeværelse | 4 |
| lavanderia, sgabuzzino | Bryggers, Depot | 5 |

## Udvikling

`dist/nordlys.js` er kilden, og der rettes direkte i den. Reglerne for ændringer, versionsnummer og udrulning står i [CLAUDE.md](CLAUDE.md). Scripts i `tools/` er kun historik.

## Licens

GPL-3.0, som originalen. Se [LICENSE](LICENSE). Navnet og varemærket "Aurora Glass" tilhører den oprindelige forfatter og bruges kun til kreditering.
