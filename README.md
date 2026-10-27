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
    evEnergy: sensor.lader_energi         # valgfri: laderens samlede kWh-tæller — bruges af kpiEv (ellers evToday)
    kpiEv: true                           # valgfri: viser elbilens kWh og andel af forbruget i felterne I dag … I år
    chartEv: true                         # valgfri: tegner laderens effekt (ev) som lilla kurve i Udvikling
    evCost: sensor.elbil_omkostning_total # valgfri: kr-tæller for ladning (ladeeffekt × timepris, integreret) — giver elbilens kr. i felterne og pr. dag. Timer før tælleren fandtes regnes som timens kWh × timens pris (kræver at price er en sensor)
    dayEv: true                           # valgfri: elbilens kWh (og kr.) som egen lilla søjle i "Forbrug pr. dag"; kan også vælges med daySeries: [..., elbil]
    energyTotal: sensor.energi_total
    price: input_number.elpris              # fast pris (kan rettes i kortet) — eller en sensor med live timepris, fx sensor.elpris fra Energi Data Service
    costTotal: sensor.elomkostning_total    # valgfri: samlet kr-tæller (kr); giver rigtige kr. pr. dag/måned/år ud fra timepriser
    salePrice: sensor.salgspris             # valgfri: salgspris nu (kr/kWh) — viser "Tjener nu" ved salg og salgsprisen i prisbjælken
    revenueTotal: sensor.salgsindtaegt_total  # valgfri: samlet kr-tæller for salg; giver "+X kr. solgt" og kr. på salgssøjlerne
    daySeries: [køb, salg]                  # valgfri: hvilke søjler "pr. dag" viser — forbrug, sol, køb, salg (uden nøglen vises alle)
    dayStack: true                          # valgfri: søjlerne pr. dag lægges oven på hinanden i én søjle, hvor farverne glider over i hinanden
    dayLabel: dato                          # valgfri: skriv 25/10 under søjlerne i stedet for ugedag + dato
    dayNet: true                            # valgfri: resultatet (salg − køb) under hver søjle; i kr. = solgt for − købt for
    kpiSolar: true                          # valgfri: deler felterne I dag … I år i to, nederste del viser solcelleproduktionen (og "+X kr. solgt")
    kpiNet: true                            # valgfri: nederst i felterne "Resultat ±X kr." = solgt for − købt for
    sellPositive: true                      # valgfri: salg vises med + og køb med − (Køb/Salg-måleren, Udvikling og tooltip)
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
