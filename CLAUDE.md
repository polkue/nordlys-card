# Regler for arbejde på Nordlys

Nordlys er ét fælles Lovelace-kort, der bruges på flere Home Assistant-installationer: Stefans egen og Lars'. Brugerfladen er den samme alle steder. Forskellene ligger kun i hver installations dashboard-konfiguration.

Flere Claude-samtaler kan arbejde på dette repo samtidig. Følg reglerne her, så I ikke overskriver hinandens arbejde.

## 1. Én kildefil

- **`dist/nordlys.js` er kilden.** Ret direkte i den.
- **Byg ikke filen forfra.** Kør ikke `tools/build.py`. Det byggede kortet ud fra den originale italienske fil og overskriver alt, der er lavet siden, inklusive solceller og køb/salg. Mappen `tools/` er kun historik.
- **`dist/btn/`** indeholder knapbillederne. `*.still.png` er stillbilleder til `animations: false`.

## 2. Konfiguration eller kode?

- **Konfiguration:** Lys, sensorer, labels, skjulte sektioner og apparater ændres i det enkelte dashboard via Home Assistant. Det rører ikke repo'et og kan gøres parallelt for flere installationer.
- **Kode:** Ret kun i koden, når en funktion mangler.

## 3. Alle nye funktioner skal være valgfrie

- **Slås til i konfigurationen:** En ny funktion slås til med en ny nøgle i konfigurationen, fx `energy.ev`. Uden nøglen opfører kortet sig nøjagtigt som før.
- **Ingen hårdkodede værdier:** Skriv aldrig entitetsnavne, rumnavne eller personlige navne ind i koden. De hører hjemme i dashboard-konfigurationen. Repo'et er offentligt.
- **Dokumentér den nye nøgle i `README.md`.**

## 4. Git-arbejdsgang

1. **Før du begynder:** `git pull --rebase origin main`.
2. **Hold ændringerne små.** Skub op med det samme, så snart en ændring virker.
3. **Lige før du skubber op:** Kør `git pull --rebase origin main` igen. Løs eventuelle konflikter, og tjek så syntaksen med `node --check dist/nordlys.js`.
4. **Hvis GitHub afviser dit push:** Kør trin 3 igen. Brug aldrig `--force`.

## 5. Versionsnummer

- **Ét sted:** Versionen står kun i `window.NORDLYS_VERSION` øverst i `dist/nordlys.js`. Den vises nederst på siden og i browserkonsollen.
- **Hæv den til sidst:** Hæv den som det sidste, efter rebase og lige før du skubber op. Så støder to samtaler ikke sammen om den samme linje.
- **Brug commit-beskeden "Nordlys X.Y: kort beskrivelse".**

## 6. Udrulning via HACS

- **Vent 5 minutter:** HACS henter filerne fra GitHubs raw-server, som cacher i op til 5 minutter. Vent mindst 5 minutter efter et push, før du kører HACS `update_information` og `download`. Ellers får installationen den forrige version.
- **Tjek versionen:** Bekræft bagefter, at `installed_version` i HACS er den commit, du skubbede op.
- **Ryd cachen:** Brugeren skal rydde frontend-cachen i appen. Indstillinger → Companion app → Fejlfinding → Nulstil frontend-cache, og luk derefter appen helt.

## 7. Test, før du skubber op

- **Test i en headless browser:** Brug Playwright med falske `hass`-data. Test både bred skærm og mobilbredde (fx Pixel 7).
- **Test den nye funktion begge veje:** både når nøglen er sat, og når den ikke er sat.
- **Test med `animations: false` og `buttons: kompakt`.** Begge installationer bruger det.

## 8. Én fælles kode for to huse

- **Begge huse opdateres:** Begge installationer kører koden fra `main`. En fejl her rammer begge huse ved næste opdatering.
- **Opdatér Stefans installation først.** Opdatér først Lars', når Stefan har bekræftet, at versionen virker.
