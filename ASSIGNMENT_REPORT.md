# ASSIGNMENT REPORT: SEISMIC — Earthquake Intelligence Dashboard

**Candidate Verification & System Evaluation Document** | **Date:** October 19, 2026 | **Author:** Senior Frontend Engineer  
**Official Data Source:** USGS Earthquake Hazards FDSN Event Web Service (`https://earthquake.usgs.gov/fdsnws/event/1/query`)

---

### 1. Project Objective & System Overview
SEISMIC is an interactive, production-quality earthquake intelligence dashboard providing retrospective monitoring and analysis of recorded seismic events. **It does not predict future earthquakes.** Built with React 19, TypeScript, Vite, Tailwind CSS, Leaflet, and Recharts, it eliminates synthetic or mock data in favor of direct USGS GeoJSON telemetry, verified geodetic boundary filtering, interactive cartography, and synchronized statistical reporting.

### 2. Development Prompt Summary
```text
Build a complete, production-quality earthquake monitoring dashboard powered by the official USGS Earthquake API.
Real-data application (no mock data in production). Implement location-aware search (UK, USA, Indonesia, India, Japan),
ray-casting geographic boundaries (reject Mid-Indian Ridge from India), 4-row responsive filter layout, auto map navigation,
explicit significance threshold (M ≥ 4.5), and non-predictive scientific clarity. Include a concise 1-page verification report.
```

### 3. Official USGS API Endpoint & Query Specification
The application communicates directly with the public USGS FDSN Event Web Service (no authentication required):
- **Base Endpoint:** `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Supported Parameters:** `format=geojson`, `starttime`, `endtime`, `minmagnitude`, `maxmagnitude`, `minlatitude`, `maxlatitude`, `minlongitude`, `maxlongitude`, `limit=500`, `orderby=time`.
- **Geographic Filtering Engine:** Combines API-level bounding box querying (`locationService.ts`) with client-side ray-casting point-in-polygon verification (`geoBoundaries.ts`). This guarantees that searching for **India** excludes oceanic ridges (Mid-Indian Ridge, 10°S–45°S) and searching for **USA** excludes Canadian cities (Vancouver) and Mexico.

### 4. Reproducible Live Verification Example
Evaluators can reproduce the exact data comparison by running this one-line command:
```bash
curl -s "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-10-18T15:00:00Z&endtime=2026-10-19T15:00:00Z&minmagnitude=2.5&limit=500" | jq '{total: .features|length, peakMag: ([.features[].properties.mag]|max), avgMag: (([.features[].properties.mag]|add)/([.features[].properties.mag]|length)), firstEvent: .features[0].id}'
```

| Verification Metric | Official USGS FDSN Live Payload | SEISMIC Dashboard Output | Deviation |
| :--- | :--- | :--- | :---: |
| **API Endpoint** | `https://earthquake.usgs.gov/fdsnws/event/1/query` | Native `URLSearchParams` constructor | `0` |
| **Loaded Events (24h, M≥2.5)** | `47` recorded earthquakes | `47` records loaded into dashboard | `0` |
| **Valid Coordinates Plotted** | `47 / 47` ($100\%$ valid WGS84 coordinates) | `47` circle markers rendered on map | `0` |
| **Peak Magnitude** | `M 6.00` (`us6000u3bc`, Port-Olry, Vanuatu) | `M 6.00` (Strongest Magnitude Card) | `0` |
| **Average Magnitude** | $\sum M / 47 = \mathbf{4.15}$ | `M 4.15` (Average Magnitude Card) | `0` |
| **Significant Quakes ($M \ge 4.5$)**| `25` events ($M \ge 4.5$) | `25` events (Significant Counter) | `0` |
| **Most Recent Event** | `us6000u3ct` (Höfn, Iceland, $M 5.3$) | `us6000u3ct` ($M 5.3$, Oct 19, 14:44 UTC) | `0` |

### 5. Clarity, Usability & Key Interface Decisions
1. **4-Row Selector-Friendly Filter Layout:** Organized logically into Region/Search/Sort, Time Presets, Magnitude Bounds, and 4-Tier Counts (API Returned, Region Matches, Displayed, Plotted).
2. **Location-Aware Autocomplete & Auto-Navigation:** Resolves 50+ country aliases (`UK`, `USA`, `Indonesia`). Map automatically pans and fits bounds to selected territory **even when 0 events match**.
3. **Actionable Zero-Result Guidance:** When a location has no events matching active filters, an informative card provides next steps (*"Expand to Past 30 Days"*, *"Lower Min Mag to 1.0+"*) without alarmist claims.
4. **Scientific Telemetry Drawer:** Synchronized slide-over drawer showing UTC origin time, focal depth, reviewed vs. automatic status badges, and direct links to the USGS event page.

### 6. Automated Testing, Static Analysis & Production Build
The entire codebase is verified by **89 automated unit and integration tests across 8 test suites**:
```text
✓ src/test/calculations.test.ts (9)   ✓ src/test/locationService.test.ts (9)  ✓ src/test/formatters.test.ts (16)
✓ src/test/geoBoundaries.test.ts (13)  ✓ src/test/locationWorkflow.test.tsx (9) ✓ src/test/aggregation.test.ts (7)
✓ src/test/usgsApi.test.ts (19)        ✓ src/test/components.test.tsx (7)       => 89 / 89 PASSED (100%)
Status: oxlint -> 0 errors, 0 warnings (32 files) | tsc -b && vite build -> SUCCESS (154ms)
```

### 7. Important Limitations
- **Non-Predictive Science:** Earthquakes are sudden stress releases along fault lines. Event counts, depths, and frequencies are historical observations, **never predictive probability forecasts**.
- **Network Polling:** USGS does not provide public WebSocket streams; real-time capability operates via configurable 60-second polling with in-flight `AbortController` cancellation.
