# Suyana - Portfolio Climate Review

Independent, noncommercial lender-workflow prototype built with React + Vite. Not affiliated with or endorsed by Suyana. Updated Nov 10, 2026; data extraction tested Nov 9. This is a fixed historical snapshot, not a live monitoring service, validated risk model or loan decision system.

## Run locally

Requires Node.js 18+ and internet for npm, background tiles and fonts.

1. Unzip the project and open its folder in VS Code.
2. In a terminal inside that folder, run:

   ```sh
   npm install && npm run dev
   ```

3. Open the local address Vite prints, usually http://localhost:5173.

Stop with Control+C. `npm run build` writes a static bundle to `dist/`; `npm run preview` serves it. The public repository auto-deploys to Vercel on pushes to main. No paid map fallback is configured.

## Which data, and why

### OpenStreetMap: real locations and boundaries

- **Role:** geographic context. The dataset contains 24 public farmland parcels in Brazil, Colombia and Argentina, with coordinates, area and a source way URL for each.
- **Why chosen:** open, inspectable farmland geometries let the prototype use real places instead of invented coordinates, and let viewers inspect the original parcel source.
- **Scope:** these are illustrative public parcels, not a representative sample, verified customers or confirmed financed areas. Boundaries are community-mapped and can be incomplete or outdated; tags do not establish current crop or ownership. The app currently shows point markers, not rendered polygon outlines.
- **License/source:** OpenStreetMap data is under ODbL; retain OpenStreetMap attribution when using its geometry. Each parcel's exact source link is in `src/data.js`. https://www.openstreetmap.org/copyright

### Open-Meteo historical archive: weather context

- **Role:** 60-day rainfall and shallow soil-moisture context at each parcel coordinate. Rainfall covers Sep 10-Nov 8, 2026. The reference is the same calendar window in 2021-2025, from the same archive and in the same units.
- **Why chosen:** a documented historical gridded source supports repeatable comparisons across all three countries without pretending there is a station on every farm. Using the same source for observation and reference avoids cross-source inconsistencies found in testing.
- **Limits:** gridded reanalysis/model estimates, not on-farm sensors. A point sample is not a parcel-average measurement. Local rain can differ. The raw soil-moisture value represents the 0-7 cm layer and is not judged against a crop-specific or seasonal target. A five-year reference is a short comparison period, not a long-term climatological normal. The rainfall flags are unvalidated investigation rules, not climate-damage or repayment predictions.
- **Source:** https://open-meteo.com/en/docs/historical-weather-api

### Copernicus Sentinel-2 L2A: dated vegetation evidence

- **Role:** NDVI from red and near-infrared bands at 10 m, measured inside public parcel boundaries. Scene dates span Sep 12-Nov 8, 2026; extraction was tested Nov 9. Each displayed reading retains its scene date and measured-pixel count.
- **Why chosen:** parcel-intersected 10 m pixels are more relevant to farm vegetation than a broad regional color or coarse map pixel. Scene classification supports cloud masking, and the original scene dates keep age visible.
- **Limits:** only 8 of the 24 parcels were covered by this first extraction test. Missing extraction is not proof that no usable scene exists. Some retained scenes are weeks old. Cloud masks and boundary alignment can be imperfect. Low NDVI can mean harvest, planting, crop stage, bare soil or stress; it does not identify a cause or predict crop loss by itself. A coarse imagery test disagreed enough that its values were not used as parcel measurements. `src/data.js` contains the extracted readings and dates, not a complete source-scene archive or automated refresh pipeline.
- **Source:** https://dataspace.copernicus.eu

### EOxCloudless 2025: free visual background, not analytical evidence

- **Role:** satellite-like spatial context behind the markers. This is a 2025 cloudless mosaic, not a live image and not the dated Sentinel scenes used for the NDVI readings.
- **Why chosen:** its provider explicitly permits direct public WMTS use for noncommercial personal/educational projects and pre-release testing, without an account, key or card. Tiles were fetched and visually checked at all 24 demo farm coordinates. It replaces an anonymous Esri endpoint whose loading behavior did not establish a public-use licensing entitlement for this project.
- **Tradeoff:** coarser imagery than the prior Esri background. Closer zoom can help locate fields, but does not add source detail or make the measurements more current. Free public service has no guaranteed uptime or commercial-production entitlement. No bulk/offline tile cache ships with this project.
- **License:** imagery is CC BY-NC-SA 4.0. Keep the visible linked attribution and respect the license for imagery adaptations; this is not a relicensing of all application code. A lender's commercial production deployment needs a separate map license or another permitted source. Do not remove attribution or resell raw imagery.
- **Required credit:** EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2025).
- **Provider/license:** https://cloudless.eox.at/license-non-commercial ; https://cloudless.eox.at/documentation/faq ; https://creativecommons.org/licenses/by-nc-sa/4.0/

### Fictional loans and scenarios: interface tests only

- **Role:** invented loan identifiers/amounts make the lender workflow tangible without exposing private customer records. The drought, heavy-rain, heat and missing-data modes test how the interface responds.
- **Why chosen:** the prototype has no authorized borrower records or linked repayment labels. Synthetic examples make this absence explicit rather than implying these farms are Suyana customers.
- **Limits:** scenario shifts are hand-set perturbations, not forecasts, learned models or calibrated climate events. Simulated rain amounts are derived from the same reference as their displayed anomaly percentage so the numbers agree. Flags/rankings order follow-up questions, never approve/reject credit or predict default.

## Historical regional soybean-yield experiment

The app includes a separate evaluation panel, not scores on the 24 parcels. SustainBench Crop Yield v1.0 supplies real 2005-2016 regional labels and full-season MODIS inputs. We chose it for real yield labels, Brazil/Argentina coverage plus a US comparison, and a reproducible public benchmark. It does not use the demo's Sentinel/Open-Meteo inputs. Colombia is not covered.

Train: 2005-2013; held-out later years: 2014-2016. With the whole season observed, ridge RMSE (t/ha) is Brazil 0.4274 versus local-history 0.5233, Argentina 0.9696 versus 0.6747, US 0.5731 versus 0.6285. Lower is better. Argentina's model is worse than simply using regional history; this is not a generally reliable future-season forecast. Same-period spatial holdouts cannot prove new-year performance. No current farm or loan prediction is made.

Data and derivative evaluation are CC BY-SA 4.0, attributed to SustainBench / Stanford Sustainability and AI Lab, NASA MODIS inputs, government yield statistics, and Wang et al. (2018). This is separate from the EOX backdrop's noncommercial imagery license. SustainBench code is MIT. Full methodology, source URLs, retrieval checksums, script, evaluation CSV/metrics and fitted models are in `research/yield/` locally and `yield-research.zip` in the repository. The raw ~304 MB dataset is not bundled; the included README gives accountless retrieval steps. Python dependencies are needed only to retrain, not to run the React demo. Only load trusted joblib/pickle model files.

Source: https://sustainlab-group.github.io/sustainbench/docs/datasets/sdg2/crop_yield.html and https://github.com/sustainlab-group/SustainBench .

## Project layout

- `src/App.jsx`: map, fly-to interaction, ranking, scenarios and details.
- `src/data.js`: fixed 24-parcel weather/vegetation snapshot and fictional loan metadata.
- `src/styles.css`: responsive visual design and reduced-motion handling.
- `src/main.jsx`: React entry point.

## Interpretation

Use this to decide where to ask questions, not who will default. The map's visual polish does not validate the data or rules. Exact observations, missingness and dates matter more than a green/red badge. No accuracy claim, causal climate-stress claim or production underwriting recommendation is made.
