# Suyana - Portfolio Climate Review (lender demo, React + Vite)

Built Nov 10, 2026. Data tested Nov 9, 2026.
Same design, data and wording as the single-file demo, rebuilt as a React + Vite project.

## Needs

- Node.js 18 or newer (check: `node --version`)
- Internet, for npm install and for the map tiles and fonts at runtime

## Run it (VS Code)

1. Unzip suyana-portfolio-react.zip
2. In VS Code: Terminal > New Terminal, then:

   ```
   cd ~/Downloads/suyana-portfolio-react && npm install && npm run dev
   ```

3. Open http://localhost:5173 in Safari

Stop with Ctrl+C. `npm run build` makes a static bundle in `dist/`;
`npm run preview` serves that build.

This repo auto-deploys to Vercel on every push to main.

## Project layout

- `src/App.jsx` - the whole app: scenario logic, ranking, map, list, detail panel
- `src/data.js` - the embedded dataset (24 parcels, weather, satellite readings)
- `src/styles.css` - all styling
- `src/main.jsx` - React entry

## What is real and what is not

- The 24 parcels are real OpenStreetMap farmland boundaries.
- Weather and satellite numbers are real measurements from Nov 9, 2026.
- Loan IDs and amounts are fictional. Flags say where to look first;
  they do not predict default.
- Scenario buttons (Drought / Heavy rain / Heat wave / Missing data) are
  simulated readings for testing the workflow, not forecasts.

## Data sources and method

- Farm boundaries: OpenStreetMap farmland polygons (24 parcels in Brazil,
  Colombia and Argentina). Each parcel's way URL is in `src/data.js`.
  https://www.openstreetmap.org
- Weather: Open-Meteo historical archive API. This is gridded weather
  reanalysis sampled at each parcel's coordinates, not on-farm weather
  stations. 60-day rainfall and soil moisture through Nov 8, 2026, compared
  against the same source's own 2021-2025 history for the same calendar
  window (same source, same period, same units).
  https://open-meteo.com/en/docs/historical-weather-api
- Satellite vegetation: Copernicus Sentinel-2 L2A scenes at 10 m resolution.
  NDVI computed per pixel inside each parcel boundary from the red and
  near-infrared bands, with clouds masked out using the scene classification
  layer. 8 of 24 parcels had a recent clear-enough scene; the rest show
  "no recent reading" rather than a stale number. Scene IDs and dates are in
  the dataset.
  https://dataspace.copernicus.eu
- Map basemap: Esri World Imagery tiles.

## Limitations

- A low vegetation reading can follow harvest, planting or crop stage as
  easily as stress. Flags say where to look first; they do not predict
  default.
- Some readings are weeks old in cloudy stretches. The scene date is printed
  next to every satellite number.
- Weather is gridded reanalysis at the parcel coordinate; a farm a few
  kilometers away can see different rain.
- The portfolio, loan IDs and amounts are invented. These are real farms on
  a map, not Suyana customers.
