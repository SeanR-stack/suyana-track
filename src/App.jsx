import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { DATA } from './data';

/* ---------- scenario transforms ---------- */
function readings(loan, scenario){
  let a = loan.rain_anomaly_pct, soil = loan.soil_moisture, sat = loan.s2, missing = false;
  if (scenario === 'drought'){ a = a - 38; soil = soil * 0.65; }
  if (scenario === 'rain'){ a = a + 65; soil = Math.min(soil * 1.35, 0.6); }
  if (scenario === 'heat'){ soil = soil * 0.75; }
  if (scenario === 'missing'){
    const n = parseInt(loan.loan_id.slice(3), 10);
    if (n % 3 === 0){ missing = true; }
  }
  a = Math.round(a);
  /* Simulated rain amount derived from the same baseline the anomaly % uses,
     so displayed mm, % and ranking always agree. Live shows the real measurement. */
  const rain = scenario === 'live'
    ? loan.rain_60d_mm
    : Math.round(loan.rain_hist_mm * (1 + a / 100) * 10) / 10;
  return { a, soil, sat, missing, rain };
}

function flagFor(r){
  if (r.missing) return { level:'grey', label:'No current data', sort: 95 };
  let level = 'green', label = 'Rain near seasonal norm';
  if (r.a <= -25){ level='red'; label='Rain well below normal'; }
  else if (r.a >= 30){ level='red'; label='Rain far above normal'; }
  else if (r.a <= -15 || r.a >= 20){ level='amber'; label = r.a < 0 ? 'Rain below normal' : 'Rain above normal'; }
  const sort = Math.abs(r.a);
  return { level, label, sort };
}

function fmtRain(l, r){ return `${r.rain} mm in 60 days vs ${l.rain_hist_mm} mm typical`; }
function ageOf(dateStr){
  return Math.round((new Date('2026-11-10') - new Date(dateStr)) / 86400000);
}

const COLORS = { red:'#e8836f', amber:'#e4b272', green:'#a3d98b', grey:'#8a938a' };
const SCENARIOS = [
  ['live', 'Nov 8 snapshot', 'measured data'],
  ['drought', 'Drought', 'simulated dry spell'],
  ['rain', 'Heavy rain', 'simulated wet spell'],
  ['heat', 'Heat wave', 'simulated hot spell'],
  ['missing', 'Missing data', 'simulated feed outage'],
];

function SuyanaMark({ size = 54 }){
  return (
    <svg width={size} height={size} viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Suyana logo">
      <mask id="suyanaMarkMaskTop" style={{maskType:'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="117" height="117"><circle cx="58.3597" cy="58.3597" r="58.3597" fill="black"></circle></mask>
      <g mask="url(#suyanaMarkMaskTop)">
        <path d="M22.7265 138.043C74.6328 125.978 25.2516 95.6762 -11.2233 109.144" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
        <path d="M47.137 144.216C104.374 104.935 30.583 77.4388 -14.8702 82.4892" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
        <path d="M10.6616 -36.7554C-1.12258 -18.7986 -15.2402 46.0029 53.5996 70.2548C92.3091 83.892 102.41 107.741 87.2588 142.813" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
        <path d="M25.8133 -22.446C20.7434 17.197 27.7772 37.036 74.4942 52.7404C116.497 66.8602 124.08 107.945 119.806 134.676" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
        <path d="M68.7412 -33.1078C9.82036 21.6043 97.5761 42.0863 143.029 37.036" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
        <path d="M84.4536 -28.3381C51.3457 -2.80578 87.5316 21.0431 124.006 7.57551" stroke="#4DB92D" strokeWidth="12" strokeLinecap="round"></path>
      </g>
    </svg>
  );
}

function MapView({ scenario, selected, onSelect }){
  const el = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const onSelectRef = useRef(onSelect);
  const prevSelectedRef = useRef(undefined);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const map = L.map(el.current, { scrollWheelZoom: true, zoomControl: true, attributionControl: true })
      .setView([-14, -62], 4);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 12, attribution: 'Esri, Maxar, Earthstar Geographics'
    }).addTo(map);
    DATA.loans.forEach(l => {
      const m = L.circleMarker([l.lat, l.lon], {
        radius: 7 + Math.min(Math.sqrt(l.area_ha) / 6, 9),
        color: '#a3d98b', weight: 2, fillColor: '#a3d98b', fillOpacity: .55
      }).addTo(map);
      m.on('click', () => onSelectRef.current(l.loan_id));
      markersRef.current[l.loan_id] = m;
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current = {}; };
  }, []);

  useEffect(() => {
    DATA.loans.forEach(l => {
      const r = readings(l, scenario), f = flagFor(r), m = markersRef.current[l.loan_id];
      if (m) m.setStyle({ color: COLORS[f.level], fillColor: COLORS[f.level] });
    });
  }, [scenario]);

  /* Animated fly-to: selecting a farm (card or marker) flies the map to its parcel;
     closing flies back to the overview. Offset keeps the parcel clear of the
     detail panel on wide screens. Reduced motion jumps instead of flying. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const prev = prevSelectedRef.current;
    prevSelectedRef.current = selected;
    if (prev === selected) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    DATA.loans.forEach(l => {
      const m = markersRef.current[l.loan_id];
      if (m){ m.setStyle({ weight: 2 }); m.setRadius(7 + Math.min(Math.sqrt(l.area_ha) / 6, 9)); }
    });

    if (!selected){
      if (prev === undefined) return; /* initial mount: stay on overview */
      if (reduced) map.setView([-14, -62], 4, { animate: false });
      else map.flyTo([-14, -62], 4, { duration: .9 });
      return;
    }
    const l = DATA.loans.find(x => x.loan_id === selected);
    const m = markersRef.current[selected];
    if (m){
      m.setStyle({ weight: 3.5 });
      m.setRadius((7 + Math.min(Math.sqrt(l.area_ha) / 6, 9)) + 3);
      m.bringToFront();
    }
    const zoom = 11;
    let target = L.latLng(l.lat, l.lon);
    if (window.innerWidth > 900){
      /* detail panel covers the right 480px: shift center east so the parcel
         lands in the middle of the still-visible map area */
      const pt = map.project(target, zoom);
      target = map.unproject(pt.add(L.point(240, 0)), zoom);
    }
    if (window.innerWidth <= 900){
      el.current.closest('.stage').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    map.stop();
    if (reduced) map.setView(target, zoom, { animate: false });
    else map.flyTo(target, zoom, { duration: .95 });
  }, [selected]);

  return <div id="map" ref={el}></div>;
}

function Detail({ id, scenario, instant, onClose }){
  const l = DATA.loans.find(x => x.loan_id === id);
  const r = readings(l, scenario), f = flagFor(r);
  const fill = Math.min(r.rain / Math.max(l.rain_hist_mm * 1.6, 1) * 100, 100);
  const histMark = Math.min(l.rain_hist_mm / Math.max(l.rain_hist_mm * 1.6, 1) * 100, 100);

  let satHtml;
  if (r.missing){
    satHtml = <p className="note"><strong>No recent reading.</strong> The feed for this parcel is down in this scenario. For a lender, that itself is a reason to visit first.</p>;
  } else if (r.sat){
    satHtml = <>
      {r.sat.readings.map(s => {
        const age = ageOf(s.date);
        return <div className="satrow" key={s.date}><span className="d">Scene {s.date}{age > 14 ? <span className="stale"> - {age} days old</span> : ` - ${age} days old`}<br/>{s.px.toLocaleString()} px measured inside boundary</span><span className="ndvi">{s.ndvi.toFixed(2)}</span></div>;
      })}
      <p className="note">NDVI is vegetation density from Sentinel-2 at 10 m, measured Nov 9. <strong>A low number does not say why</strong> - harvest, planting, crop stage and stress all read low. It tells you where to ask questions.</p>
    </>;
  } else {
    satHtml = <p className="note">No 10 m satellite reading for this parcel in this demo - the first test covered 8 of the 24 parcels. Coarser 245 m imagery exists but disagreed with 10 m measurements by too much to quote as a farm number.</p>;
  }

  const weatherHtml = r.missing
    ? <p className="note"><strong>Weather feed down</strong> for this parcel in this scenario. No current rain or soil reading.</p>
    : <>
        <div className="barwrap">
          <div className="bar"><div className="fill" style={{width: fill + '%'}}></div><div className="hist" style={{left: histMark + '%'}}></div></div>
          <div className="barlab"><span>{fmtRain(l, r)}</span><span>{r.a > 0 ? '+' : ''}{r.a}%</span></div>
        </div>
        <p className="note">Rain compares Sep 10 - Nov 8, 2026 against the same dates in 2021-2025 from one source (Open-Meteo archive). Mixing sources flipped one country's anomaly sign in testing, so the baseline never mixes them.</p>
      </>;

  return (
    <>
      <button className="close" onClick={onClose}>×</button>
      <div className="secttl" style={{marginTop:0}}>{l.loan_id} · fictional loan ${l.amount_usd.toLocaleString()}</div>
      <h2 className="serif">{l.region}</h2>
      <div className="where">{l.area_ha} ha parcel · OpenStreetMap way {l.osm_way}</div>
      <div className={'flag ' + f.level} style={{fontSize:16, fontWeight:700, marginBottom:16}}>{f.label}{r.missing ? '' : ` · ${r.a > 0 ? '+' : ''}${r.a}% rain vs 5-yr`}</div>
      {scenario !== 'live' && <p className="note" style={{marginTop:-6, marginBottom:16, color:'var(--amber)'}}><strong>Simulated scenario</strong> - the rain and soil readings on this panel are not real. The Nov 8 snapshot has the measured data.</p>}
      <div className="statgrid">
        <div className="stat"><div className="k">Rain, 60 days</div><div className="v">{r.missing ? '—' : r.rain + ' mm'}</div><div className="n">{r.missing ? 'no current reading' : 'typical ' + l.rain_hist_mm + ' mm'}</div></div>
        <div className="stat"><div className="k">Soil moisture (0-7 cm)</div><div className="v">{r.missing ? '—' : r.soil.toFixed(2)}</div><div className="n">{r.missing ? 'no current reading' : 'volumetric m³/m³, through Nov 8'}</div></div>
      </div>
      <div className="secttl">Rainfall vs its own history</div>
      {weatherHtml}
      <div className="secttl">Satellite vegetation</div>
      {satHtml}
      <p className="note">This flag is a reason to call or visit the farmer. <strong>It is not a default prediction.</strong></p>
      <a className="osmlink" href={l.osm_url} target="_blank" rel="noopener">See this parcel's real boundary on OpenStreetMap</a>
    </>
  );
}

export function App(){
  const [scenario, setScenario] = useState('live');
  const [selected, setSelected] = useState(null);
  const [instant, setInstant] = useState(false);

  /* deep links / screenshot states */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const sc = q.get('sc');
    if (sc && SCENARIOS.some(([k]) => k === sc)) setScenario(sc);
    if (q.get('farm') && DATA.loans.some(l => l.loan_id === q.get('farm'))){
      setInstant(true);
      setSelected(q.get('farm'));
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const rows = useMemo(() => {
    const out = DATA.loans.map(l => {
      const r = readings(l, scenario);
      return { l, r, f: flagFor(r) };
    });
    out.sort((x, y) => y.f.sort - x.f.sort);
    return out;
  }, [scenario]);

  return (
    <div className="app">
      <div className="brandrow">
        <div className="brandblock">
          <SuyanaMark size={54} />
          <div>
            <h1>Suyana</h1>
            <div className="sub">Portfolio climate review</div>
          </div>
        </div>
        <div className="brandmeta">
          <span className="demochip">Independent lender demo</span>
          <span className="dateline">Weather through Nov 8 · Satellite scenes Sep 12 - Nov 8, 2026 · Data tested Nov 9, 2026</span>
        </div>
      </div>

      <main className="stage">
        <MapView scenario={scenario} selected={selected} onSelect={setSelected} />

        <div className={'simchip' + (scenario !== 'live' ? ' show' : '')}>Simulated scenario - these readings are not real. The Nov 8 snapshot has the measured data.</div>

        <div className="scendock">
          <div className="docklab">View</div>
          {SCENARIOS.map(([k, label, desc]) => (
            <button key={k} className={'scen' + (scenario === k ? ' on' : '')} onClick={() => setScenario(k)}>
              <span className="scenname">{label}</span>
              <span className="scendesc">{desc}</span>
            </button>
          ))}
        </div>

        <div className="legendchip">
          <span><span className="dot" style={{background:'var(--red)'}}></span>Needs a look</span>
          <span><span className="dot" style={{background:'var(--amber)'}}></span>Watch</span>
          <span><span className="dot" style={{background:'var(--green)'}}></span>Within norms</span>
          <span><span className="dot" style={{background:'#8a938a'}}></span>No data</span>
          <span className="count">24 parcels</span>
        </div>
      </main>

      <div className="listcol">
        <div className="listhead">
          <h2>Where to look first</h2>
          <span>{scenario === 'live' ? 'ranked by rainfall anomaly' : 'simulated ranking'}</span>
        </div>
        <div>
          {rows.map((x, i) => {
            const satline = x.r.missing ? 'No recent reading - data feed down'
              : x.r.sat ? `Satellite ${x.r.sat.readings[x.r.sat.readings.length-1].ndvi.toFixed(2)} on ${x.r.sat.readings[x.r.sat.readings.length-1].date}`
              : 'No 10 m satellite reading yet';
            return (
              <button className={'farm edge-' + x.f.level} key={scenario + '-' + x.l.loan_id} style={{animationDelay: (i * 26) + 'ms'}} onClick={() => setSelected(x.l.loan_id)}>
                <div className="top"><span className="name">{x.l.region}</span><span className="rank">#{i+1}</span></div>
                <div className={'flag ' + x.f.level}>{x.f.label} · {x.r.a > 0 ? '+' : ''}{x.r.a}% rain vs 5-yr</div>
                <div className="meta">{x.l.area_ha} ha · {x.l.loan_id} · soil moisture {x.r.missing ? '—' : x.r.soil.toFixed(2)} · {satline}</div>
              </button>
            );
          })}
        </div>

        <div className="about">
          <h2>What this is, and what it is not</h2>
          <p><strong>Real ground, real readings.</strong> Every parcel is a public OpenStreetMap farmland boundary in Brazil, Colombia or Argentina. Weather is measured: 60-day rainfall and soil moisture from the Open-Meteo archive through Nov 8, compared against the same source's own 2021-2025 history for the same dates. Satellite readings are per-pixel vegetation (NDVI) measured inside the parcel boundary from Sentinel-2 scenes at 10 m resolution.</p>
          <p><strong>Fictional loans.</strong> The portfolio, loan IDs and amounts are invented for this demo. These are real farms on a map, not Suyana customers.</p>
          <p><strong>Flags say where to look, not who will default.</strong> A low vegetation reading can follow harvest, planting or crop stage as easily as stress. A rain deficit is a reason to call the farmer, not proof of loss. Nothing here predicts default.</p>
          <p><strong>Ranking.</strong> Sorted by the size of each parcel's rainfall anomaly against its own 5-year baseline. Soil moisture is shown as context only (raw volumetric value, 0-7 cm depth), not judged against a seasonal target. The point is investigation order, not a score.</p>
          <p><strong>Stale data is shown, not hidden.</strong> Every satellite reading carries its scene date. Cloudy stretches mean some readings are weeks old, and that age is printed next to the number.</p>
          <div className="attr">
            <SuyanaMark size={34} />
            <div><strong>About the logo.</strong> This is the official Suyana mark, taken from suyana.io. The demo is built on Suyana's challenge track at the MIT Energy &amp; Climate Hack (Nov 2026) as an independent project - it is not affiliated with, or endorsed by, Suyana.</div>
          </div>
        </div>
      </div>

      <div className={'overlay' + (selected ? ' show' : '') + (instant ? ' notrans' : '')} onClick={() => setSelected(null)}></div>
      <aside className={'detail' + (selected ? ' show' : '') + (instant ? ' notrans' : '')}>
        {selected && <Detail id={selected} scenario={scenario} instant={instant} onClose={() => setSelected(null)} />}
      </aside>
    </div>
  );
            }
