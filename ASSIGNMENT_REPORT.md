# ASSIGNMENT REPORT: SEISMIC — Earthquake Intelligence Dashboard

**Candidate Evaluation & System Verification Document**  
**Project:** SEISMIC (Real-Time USGS Earthquake Intelligence Dashboard)  
**Date:** October 19, 2026 | **Author:** Senior Frontend & Data Visualization Engineer  
**Dataset Source:** Official United States Geological Survey (USGS) Earthquake Hazards Program  

---

## 1. Project Overview & Objective
The objective was to engineer an interactive, production-grade seismic intelligence dashboard powered entirely by real-time telemetry from the official USGS Earthquake Hazards API. This application eliminates mock, fabricated, or static data in favor of an end-to-end data pipeline that executes live FDSN HTTP queries, validates and normalizes GeoJSON payloads, visualizes geospatial coordinates on a dark-themed world map with magnitude-proportional circle markers, presents statistical aggregations, and provides filterable event tables with synchronized side-panel inspection.

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
                           ▼ (format=geojson, starttime, endtime, minmag, limit, orderby)
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
      │ Retains Stale Valid Data on Failure    │
      │ Zero Fake / Mock Fallback Injection     │
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
```

1. **API Service (`src/services/usgsApi.ts`):** Uses native `URLSearchParams` for safe query construction and `AbortController` to abort in-flight requests when filters change. Normalizes `[lon, lat, depth]` coordinates, preserving authentic negative depths (volcanic/summit epicenters).
2. **State Management (`src/hooks/useEarthquakeData.ts`):** Centralizes query execution, auto-polling (60s timer), manual refresh, and stale data retention upon network failure without fabricated fallbacks.
3. **Statistical Engine (`src/utils/calculations.ts`):** Computes total counts, peak magnitude, mean magnitude, and significant events using an explicit operational threshold ($M \ge 4.5$). Missing/invalid values are excluded and displayed as `N/A`. Derived from the active filtered view to ensure 100% KPI/Map/Table synchrony.
4. **Interactive UI (`src/components/`):** Leaflet world map with circle markers scaled by magnitude, Recharts frequency timeline and magnitude distribution histogram (supporting dynamic sub-2.5 microseism bins), sorted/paginated event table, and synchronized event details drawer.

---

## 4. Official USGS API Endpoint & Active Parameters

| Parameter | Configuration / Default | Function |
| :--- | :--- | :--- |
| **Base Endpoint** | `https://earthquake.usgs.gov/fdsnws/event/1/query` | Official USGS FDSN Web Service (No API Key Required) |
| `format` | `geojson` | Standardized RFC 7946 GeoJSON `FeatureCollection` |
| `starttime` | ISO 8601 (e.g. `2026-10-18T14:14:55.252Z`) | Dynamic start of query window (1h, 24h, 7d, 30d, or custom) |
| `endtime` | ISO 8601 (e.g. `2026-10-19T14:14:55.252Z`) | Dynamic end of query window (Fresh UTC timestamp) |
| `minmagnitude` | Configurable (Default: `2.5`) | Filters low-energy background microseisms |
| `limit` | `500` (Bounded 100–500) | Ensures responsive rendering and rapid map plotting |
| `orderby` | `time` | Returns chronologically newest records first |

---

## 5. Verification Method: UI vs. Raw USGS API Comparison

Live verification was executed directly against the USGS FDSN Web Service using the application's default 24-hour query parameters (`minmagnitude=2.5&limit=500&orderby=time`):

| Property | Raw USGS API Response (Live Stream) | SEISMIC Application Output | Verification Status |
| :--- | :--- | :--- | :--- |
| **Active Query URL** | `https://earthquake.usgs.gov/fdsnws/event/1/query?...` | Matches URLSearchParams generated by service | **Verified Match** |
| **Total Features Returned**| `47` events in 24h window | `47` records in view | **Verified Match** |
| **Valid Coordinates** | `47 / 47` ($100\%$) | `47` circle markers plotted on Leaflet map | **Verified Match (0 excluded)** |
| **Valid Magnitudes** | `47 / 47` ($100\%$, range $2.5 - 6.0$) | `47 / 47` displayed in badges & histogram | **Verified Match** |
| **Event 1 ID** | `us6000u3ch` | `us6000u3ch` | **Verified Match** |
| **Event 1 Place** | `56 km N of Ruteng, Indonesia` | `56 km N of Ruteng, Indonesia` | **Verified Match** |
| **Event 1 Mag** | `4.8 mb` | `M 4.8 (mb)` | **Verified Match** |
| **Event 1 Coords** | `[120.378, -8.1042, 10.0]` | `8.1042° S, 120.3780° E` (Depth: `10.0 km`) | **Verified Match** |
| **Event 1 Time** | `1792411561884` (`2026-10-19T12:06:01.884Z`) | `Oct 19, 2026, 12:06:01 UTC` | **Verified Match** |
| **Event 2 ID** | `us6000u3ce` | `us6000u3ce` | **Verified Match** |
| **Event 2 Place** | `212 km WNW of Port-Olry, Vanuatu` | `212 km WNW of Port-Olry, Vanuatu` | **Verified Match** |
| **Dataset Peak Mag** | `6.0` (`us6000u3bc`, Port-Olry, Vanuatu) | `M 6.0` (Peak Magnitude KPI Card) | **Verified Match** |
| **Dataset Mean Mag**| $\frac{\sum M}{47} = 4.12$ | `M 4.12` (Average Magnitude KPI Card) | **Verified Match** |
| **Significant Count** | `25` events with $M \ge 4.5$ | `25` events (Significant Events KPI Card) | **Verified Match** |
| **Shallow Events** | `36` events with depth $< 70\text{ km}$ | `36` events (Shallow Focus Sub-counter) | **Verified Match** |
| **Empty Results Handling**| `{"features": []}` (`minmagnitude=9.8`) | Handled cleanly; 0 count, `N/A` peak/avg | **Verified Match** |

---

## 6. Actual Tests Performed & Production Build

Automated tests were written using **Vitest** and **React Testing Library** with a 100% test pass rate across 56 test cases in 5 test suites:

```text
 ✓ src/test/calculations.test.ts (9 tests)
 ✓ src/test/usgsApi.test.ts (18 tests)
 ✓ src/test/aggregation.test.ts (7 tests)
 ✓ src/test/formatters.test.ts (16 tests)
 ✓ src/test/components.test.tsx (6 tests)

 Test Files: 5 passed (5)
      Tests: 56 passed (56)
   Duration: 759ms
```

### Verified Scope:
1. **API URL Construction:** Parameter serialization (`starttime`, `endtime`, `minmagnitude`, `maxmagnitude`, `limit`, `orderby`).
2. **GeoJSON Normalization:** Conversion of `[longitude, latitude, depth]` array to typed coordinate objects; authentic negative depth preservation.
3. **Statistical Integrity:** Math for total, peak, mean, and count of $M \ge 4.5$ events; null/NaN exclusion to prevent zero-skewed averages.
4. **Time & Energy Aggregations:** UTC hourly bucketing with empty-bucket zero filling; dynamic `< M 2.5` microseism binning.
5. **Cross-Component Synchronization:** Map marker clicks, table row selection, and event details drawer all reference identical USGS event IDs.
6. **Network Failure & Anti-Fabrication:** HTTP 503 error handling; retention of existing valid data marked as `isStale: true` without injecting synthetic data.
7. **Production Build & Linting:** `oxlint` found 0 warnings/errors across 26 files; `tsc -b && vite build` bundled cleanly in 177ms.

---

## 7. Status Classification: Verified vs. Pending

| Domain | Status | Evidence / Notes |
| :--- | :--- | :--- |
| **USGS API Integration** | **Verified** | Live HTTP 200 queries validated against official USGS FDSN Web Service. |
| **Coordinate & Marker Accuracy**| **Verified** | 47/47 valid coordinates plotted; zero coordinates excluded. |
| **Statistical Calculations** | **Verified** | Verified against manual mathematical calculations and automated tests. |
| **Component Synchronization** | **Verified** | Selection ID bound identically across Map, Table, and Details Drawer. |
| **Automated Test Suite** | **Verified** | 56/56 passing tests across 5 test suites with jsdom environment. |
| **Static Analysis & Build** | **Verified** | 0 lint errors (`oxlint`), 0 TypeScript errors (`tsc -b`), successful Vite bundle. |
| **Continuous Remote CI/CD** | **Pending** | Remote deployment pipeline dependent on candidate repository hosting (e.g. GitHub Actions / Vercel). |
| **Real-World Telemetry Shift** | **Operational** | Continuous real-time data automatically updates via 60-second polling or manual refresh. |

---

## 8. Known Limitations & Potential Improvements
- **Tectonic Plate Boundaries:** Adding an optional GeoJSON overlay of global tectonic fault lines would enhance contextual analysis of subduction zones.
- **WebSocket Streaming:** USGS does not offer a native WebSocket endpoint; the dashboard utilizes a 60-second polling mechanism to deliver fresh events.
- **Audible Emergency Pagers:** Audible alert tones for high-magnitude events ($M \ge 7.0$) could be added for emergency operations centers.
