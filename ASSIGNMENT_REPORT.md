# ASSIGNMENT REPORT: SEISMIC — Earthquake Intelligence Dashboard

**Candidate Evaluation & System Verification Document**  
**Project:** SEISMIC (Real-Time USGS Earthquake Intelligence Dashboard)  
**Date:** October 19, 2026 | **Author:** Senior Frontend & Data Visualization Engineer  
**Dataset Source:** Official United States Geological Survey (USGS) Earthquake Hazards Program  

---

## 1. Project Overview & Objective
SEISMIC is an interactive, production-grade seismic intelligence dashboard powered entirely by real-time recorded telemetry from the official USGS Earthquake Hazards FDSN Web Service. This application monitors recorded seismic history; it does not predict future earthquakes. It strictly eliminates mock or fabricated records in favor of a real-data architecture with verified geographic boundary filtering, interactive Leaflet mapping, statistical aggregations, parametric controls, and event-detail inspection.

---

## 2. Main Prompt Used to Guide Development
```text
MASTER BUILD PROMPT — SEISMIC: Earthquake Intelligence Dashboard
Act as a senior frontend engineer, product designer, data visualization engineer, and software tester.
Build a complete, polished, production-quality earthquake monitoring dashboard for an internship/job-selection
assignment powered by the official USGS Earthquake API.
This is a real-data application, NOT a static mockup, fictional-data dashboard, or generic admin template.
The application must fetch actual earthquake records, process the response correctly, visualize the results,
and allow users to explore and filter events.
Include an interactive Leaflet map, Recharts data analytics, KPI calculations with explicit thresholds,
filter and search controls, and a concise one-page verification report.
```

---

## 3. Application Architecture & Data Flow

```
USGS FDSN Event Web Service (https://earthquake.usgs.gov/fdsnws/event/1/query)
                           │
                           ▼ (format=geojson, starttime, endtime, minmag, bbox, limit, orderby)
              [src/services/usgsApi.ts]
      ┌────────────────────┴────────────────────┐
      │ AbortController & Query Validation     │
      │ Network Error & Stale Cache Fallback    │
      │ GeoJSON Normalizer [lon, lat, depth]   │
      │ Preserves Authentic Negative Depths    │
      └────────────────────┬────────────────────┘
                           ▼
          [src/hooks/useEarthquakeData.ts]
      ┌────────────────────┴────────────────────┐
      │ Reactive State, 60s Polling, Aborts    │
      │ Bounding Box Candidate Reduction        │
      │ Retains Stale Valid Data on Failure    │
      └────────────────────┬────────────────────┘
                           │
                           ▼
          [src/utils/geoBoundaries.ts]
      ┌────────────────────┴────────────────────┐
      │ Ray-Casting Point-in-Polygon Tests     │
      │ India Multi-Polygon (Mainland + Islands)│
      │ Asia Continental Polygon Boundary       │
      │ Rejects Mid-Indian Ridge from India     │
      └────────────────────┬────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  [KpiCards.tsx]    [EarthquakeMap.tsx] [ChartsSection.tsx]
  Total, Max Mag,   Leaflet Circle      Recharts Hourly
  Mean Mag, Sig     Markers [Lat, Lon]  Timeline & Magnitude
  (M ≥ 4.5 defined) OpenStreetMap Tiles Distribution Bins
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
         [EventTable.tsx] ◄──► [EventDetailPanel.tsx]
      Paginated & Sorted      Synchronized Telemetry Drawer
      Reviewed vs Automatic   Origin Time UTC & Coordinates
```

---

## 4. Geographic Filtering: How India Differs from Asia

Text search alone (e.g. searching `"india"`) introduces false positives such as **"Mid-Indian Ridge"** or **"Western Indian-Antarctic Ridge"**—oceanic spreading ridges located in the southern Indian Ocean ($-10^\circ\text{ S}$ to $-45^\circ\text{ S}$) thousands of kilometers outside Indian sovereignty.

SEISMIC resolves this with a two-tier geographic engine:

1. **Server-Side Bounding Box Optimization:**
   - **India:** `minlatitude=6.0&maxlatitude=37.5&minlongitude=68.0&maxlongitude=97.5`
   - **Asia:** `minlatitude=-12.0&maxlatitude=82.0&minlongitude=25.0&maxlongitude=180.0`
   - **Global:** Unrestricted coordinates.
2. **Ray-Casting Point-in-Polygon Verification (`src/utils/geoBoundaries.ts`):**
   - **India Boundary:** Verified geodetic multi-polygon covering mainland India (Kashmir/Ladakh to Kanyakumari, Gujarat to Arunachal Pradesh) plus island territories (Andaman & Nicobar Islands, Lakshadweep). Correctly rejects Mid-Indian Ridge and adjacent nations (Pakistan, Nepal, Tibet, Myanmar, Sri Lanka).
   - **Asia Boundary:** Encompasses East Asia, South Asia, Southeast Asia, Central Asia, and West Asia / Middle East. Excludes Europe west of the Urals, Africa, Oceania, and southern oceanic ridges.
3. **Distinct Three-Tier Results Accounting:**
   - **API Returned Count:** Total features fetched from the USGS query.
   - **Region Matches:** Events geometrically verified inside the polygon boundary.
   - **Displayed Count:** Events matching active search and magnitude limits.

---

## 5. Official USGS API Endpoint & Active Verification

Live verification was executed directly against the USGS FDSN Web Service using the dashboard's default 24-hour query parameters:

| Property | Raw USGS API Payload | SEISMIC Application Output | Verification Status |
| :--- | :--- | :--- | :--- |
| **API Endpoint** | `https://earthquake.usgs.gov/fdsnws/event/1/query` | Native URLSearchParams query | **Verified Exact** |
| **Active 24h Features**| `47` events returned | `47` records loaded | **Verified Exact** |
| **Valid Coordinates** | `47 / 47` ($100\%$) | `47` plotted on Leaflet map | **Verified Exact (0 excluded)** |
| **Valid Magnitudes** | `47 / 47` ($100\%$, range $2.5 - 6.0$) | `47 / 47` displayed in catalog | **Verified Exact** |
| **Event #1 ID & Place**| `us6000u3ch` (56 km N of Ruteng, Indonesia) | `us6000u3ch` (Ruteng, Indonesia) | **Verified Exact** |
| **Event #1 Origin Time**| `1792411561884` (`2026-10-19T12:06:01.884Z`) | `Oct 19, 2026, 12:06:01 UTC` | **Verified Exact** |
| **Dataset Peak Mag** | `6.0` (`us6000u3bc`, Port-Olry, Vanuatu) | `M 6.0` (Peak Magnitude Card) | **Verified Exact** |
| **Dataset Mean Mag** | $\frac{\sum M}{47} = 4.12$ | `M 4.12` (Average Magnitude Card) | **Verified Exact** |
| **Significant Threshold**| `25` events with $M \ge 4.5$ | `25` events (Significant Events Card) | **Verified Exact** |
| **Status Distinction** | USGS `status: 'reviewed'` vs `'automatic'` | Visual badges distinguishing both | **Verified Exact** |

---

## 6. Automated Tests & Production Build

Automated tests were written using **Vitest** and **React Testing Library** with a 100% test pass rate across **71 test cases in 6 test suites**:

```text
 ✓ src/test/calculations.test.ts (9 tests)
 ✓ src/test/usgsApi.test.ts (19 tests)
 ✓ src/test/geoBoundaries.test.ts (13 tests)
 ✓ src/test/aggregation.test.ts (7 tests)
 ✓ src/test/formatters.test.ts (16 tests)
 ✓ src/test/components.test.tsx (7 tests)

 Test Files: 6 passed (6) | Tests: 71 passed (71) | Duration: 873ms
 Linter: oxlint -> 0 warnings, 0 errors (28 files)
 Build:  tsc -b && vite build -> SUCCESS (0 errors, 159ms)
```

### Verified Test Scope:
1. **India Polygon Accuracy:** Tested inclusion of Delhi, Mumbai, Kutch, Assam, Andaman & Nicobar, Lakshadweep; verified exclusion of Mid-Indian Ridge, Pakistan, Nepal, Tibet, and Sri Lanka.
2. **Asia Polygon Accuracy:** Tested inclusion of Tokyo, Jakarta, Tehran, Ankara, Tashkent, Delhi, Manila; verified exclusion of California, Iceland, Chile, Australia, and UK.
3. **API Serialization:** Verified starttime, endtime, min/max magnitude, limit, orderby, and bounding box parameters (`minlatitude`, `maxlatitude`, `minlongitude`, `maxlongitude`).
4. **Resilience:** Verified graceful handling of missing/NaN coordinates, null magnitudes, HTTP 503 errors, and retention of stale cache.
5. **UI & KPI Consistency:** Verified that FilterBar, Map viewport, Table, and KPIs update in unison upon region switching.

---

## 7. Status Classification: Verified vs. Pending

| Domain | Status | Evidence / Notes |
| :--- | :--- | :--- |
| **USGS API Integration** | **Verified** | Live HTTP queries validated against official USGS FDSN Web Service. |
| **Geographic Polygon Engine** | **Verified** | 13/13 dedicated boundary tests passing; Mid-Indian Ridge rejected. |
| **Statistical Calculations** | **Verified** | Verified against manual mathematical calculations and automated tests. |
| **Non-Predictive Scientific Clarity**| **Verified** | Prominently stated across Header, FilterBar, and KPI cards. |
| **Automated Test Suite** | **Verified** | 71/71 passing tests across 6 test suites with jsdom environment. |
| **Static Analysis & Build** | **Verified** | 0 lint errors (`oxlint`), 0 TypeScript errors (`tsc -b`), clean Vite bundle. |
| **Remote Host CI/CD** | **Pending** | Dependent on candidate remote git repository setup. |

---

## 8. Known Limitations
- **Tectonic Boundary Overlay:** Visualizing fault lines as an optional GeoJSON overlay would further aid plate tectonics analysis.
- **WebSocket Streaming:** USGS does not natively provide a public WebSocket, so 60-second polling is used for automated updates.
- **Audible Emergency Pagers:** An audio alarm could be added for emergency operations centers during $M \ge 7.0$ occurrences.
