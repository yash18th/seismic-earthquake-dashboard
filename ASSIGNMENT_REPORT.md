# ASSIGNMENT REPORT: SEISMIC — Earthquake Intelligence Dashboard

**Candidate Evaluation & System Verification Document**  
**Project:** SEISMIC (Real-Time USGS Earthquake Intelligence Dashboard)  
**Date:** October 19, 2026 | **Author:** Senior Frontend & Data Visualization Engineer  
**Dataset Source:** Official United States Geological Survey (USGS) Earthquake Hazards Program  

---

## 1. Project Overview & Objective
The objective was to engineer an interactive, production-grade seismic intelligence dashboard powered entirely by real-time telemetry from the official USGS Earthquake API. This application eliminates mock, fabricated, or static data in favor of an end-to-end data pipeline that executes live FDSN HTTP queries, validates and normalizes GeoJSON payloads, visualizes geospatial coordinates on a dark-themed world map with magnitude-proportional circle markers, presents statistical aggregations, and provides filterable event tables with synchronized side-panel inspection.

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
      └────────────────────┬────────────────────┘
                           ▼
          [src/hooks/useEarthquakeData.ts]
      ┌────────────────────┴────────────────────┐
      │ Reactive State, 60s Polling, Aborts    │
      │ Caches Last Valid Data upon Failure     │
      └────────────────────┬────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  [KpiCards.tsx]    [EarthquakeMap.tsx] [ChartsSection.tsx]
  Total, Max Mag,   Leaflet Circle      Recharts Hourly
  Mean Mag, Sig     Markers [Lat, Lon]  Timeline & Magnitude
  (M ≥ 4.5 defined) OpenStreetMap/Carto Distribution Bins
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
         [EventTable.tsx] ◄──► [EventDetailPanel.tsx]
      Paginated & Sorted      Synchronized Telemetry Drawer
```

1. **API Service (`src/services/usgsApi.ts`):** Uses native `URLSearchParams` for safe query construction and `AbortController` to abort in-flight requests when filters change.
2. **State Management (`src/hooks/useEarthquakeData.ts`):** Centralizes query execution, auto-polling (60s timer), manual refresh, and stale data retention upon network failure.
3. **Statistical Engine (`src/utils/calculations.ts`):** Computes total counts, peak magnitude, mean magnitude, and significant events using an explicit operational threshold ($M \ge 4.5$). Missing/invalid values are excluded and displayed as `N/A`.
4. **Interactive UI (`src/components/`):** Leaflet world map with circle markers scaled by magnitude, Recharts frequency timeline and magnitude distribution charts, sorted/paginated event table, and synchronized event details drawer.

---

## 4. Official USGS API Endpoint & Active Parameters

| Parameter | Configuration / Default | Function |
| :--- | :--- | :--- |
| **Base Endpoint** | `https://earthquake.usgs.gov/fdsnws/event/1/query` | Official USGS FDSN Web Service (No API Key Required) |
| `format` | `geojson` | Standardized RFC 7946 GeoJSON `FeatureCollection` |
| `starttime` | ISO 8601 (e.g. `2026-10-18T19:04:45.000Z`) | Dynamic start of query window (1h, 24h, 7d, 30d, or custom) |
| `endtime` | ISO 8601 (Current UTC timestamp) | Fresh UTC timestamp on each query |
| `minmagnitude` | Configurable (Default: `2.5`) | Filters low-energy background microseisms |
| `limit` | `500` (Bounded 100–500) | Ensures responsive rendering and rapid map plotting |
| `orderby` | `time` | Returns chronologically newest records first |

---

## 5. Verification Method: UI vs. Raw USGS API Comparison

Live verification was executed directly against the USGS FDSN Web Service. Raw curl responses were compared with the application's normalization and calculation output using identical query parameters (`minmagnitude=4.5&limit=5&orderby=time`):

| Property | Raw USGS API Response | SEISMIC Application Output | Verification Status |
| :--- | :--- | :--- | :--- |
| **Event 1 ID** | `us6000u3ch` | `us6000u3ch` | **Verified Match** |
| **Event 1 Place** | `56 km N of Ruteng, Indonesia` | `56 km N of Ruteng, Indonesia` | **Verified Match** |
| **Event 1 Mag** | `4.8 mb` | `M 4.8 (MB)` | **Verified Match** |
| **Event 1 Coords** | `[120.378, -8.1042, 10]` | `8.1042° S, 120.3780° E` (Depth: `10.0 km`) | **Verified Match** |
| **Event 1 Time** | `1792411561884` (`2026-10-19T12:06:01Z`) | `Oct 19, 2026, 12:06:01 UTC` | **Verified Match** |
| **Event 2 ID** | `us6000u3ce` | `us6000u3ce` | **Verified Match** |
| **Event 2 Place** | `212 km WNW of Port-Olry, Vanuatu` | `212 km WNW of Port-Olry, Vanuatu` | **Verified Match** |
| **Event 2 Mag** | `4.8 mb` | `M 4.8 (MB)` | **Verified Match** |
| **Dataset Peak Mag** | `5.4` (`us6000u3c6`, Port-Olry, Vanuatu) | `M 5.4` (Peak Magnitude Card) | **Verified Match** |
| **Dataset Mean Mag**| `(4.8 + 4.8 + 5.0 + 5.4 + 4.7) / 5 = 4.94` | `M 4.94` (Average Magnitude Card) | **Verified Match** |
| **Empty Results** | `{"features": []}` (`minmagnitude=9.8`) | Handled cleanly; Displays 0 count, `N/A` max/avg | **Verified Match** |

---

## 6. Actual Tests Performed & Outcomes

Automated tests were written using **Vitest** and **React Testing Library** with 100% test pass rate across 45 test cases:

```
✓ src/test/calculations.test.ts (8 tests)
✓ src/test/usgsApi.test.ts (15 tests)
✓ src/test/formatters.test.ts (16 tests)
✓ src/test/components.test.tsx (6 tests)
Test Files: 4 passed | Tests: 45 passed (45) | Duration: 546ms
Production Build: tsc -b && vite build -> SUCCESS (0 errors, 201ms)
```

1. **API URL Construction:** Verified parameters (`starttime`, `endtime`, `minmagnitude`, `maxmagnitude`, `limit`, `orderby`).
2. **GeoJSON Normalization:** Verified conversion of `[longitude, latitude, depth]` array to typed coordinates object; checked resilience to malformed or missing properties.
3. **Statistical Integrity:** Verified KPI math (total, max, mean, and count of $M \ge 4.5$ events); ensured missing values return `null` (`N/A`) rather than misleading zeros.
4. **Cross-Component Synchronization:** Verified that clicking an event in the table or map popup opens the corresponding telemetry drawer and highlights the selected marker.
5. **Network Resilience & Stale Cache:** Verified HTTP 503 error handling and retention of existing valid records marked as `isStale: true`.

---

## 7. Known Limitations & Potential Improvements
- **Tectonic Plate Boundaries:** Adding an optional GeoJSON overlay of global tectonic fault lines would enhance contextual analysis of subduction zones.
- **WebSocket Streaming:** USGS does not offer a native WebSocket endpoint; the dashboard utilizes a 60-second polling mechanism to deliver fresh events.
- **Audio Threshold Alerts:** Audible alert tones for high-magnitude events ($M \ge 7.0$) could be added for emergency operations use.
