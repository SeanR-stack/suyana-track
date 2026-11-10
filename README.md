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
