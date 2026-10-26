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
    solarPeak: 7000                       # valgfri: fuldt udslag på solcellemåleren i W (standard 7000)
    solarToday: sensor.solceller_i_dag    # valgfri: produceret i dag (kWh)
    energyTotal: sensor.energi_total
    price: input_number.elpris
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

`hide` skjuler dele af forsiden: `scener` er "Hurtige scener", og `tips` er hjælpeknapperne under topbjælken.

```yaml
hide: [scener, tips]
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

## Genopbygning fra originalen

Oversættelsen laves af `tools/build.py` ud fra den originale `aurora-v3.js`:

1. Læg originalen som `src/orig.js`.
2. Sørg for, at `acorn` og `acorn-walk` er installeret.
3. Kør `python3 tools/build.py tools .`

Alle oversættelser ligger i `tools/da.py`.

## Licens

GPL-3.0, som originalen. Se [LICENSE](LICENSE). Navnet og varemærket "Aurora Glass" tilhører den oprindelige forfatter og bruges kun til kreditering.
