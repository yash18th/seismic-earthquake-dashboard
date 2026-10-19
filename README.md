# SEISMIC — Real-Time Earthquake Intelligence Dashboard

An interactive, production-quality earthquake monitoring dashboard powered by live seismic telemetry from the **official United States Geological Survey (USGS) Earthquake Hazards API**.

Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Leaflet**, and **Recharts**.

> **Scientific Disclosure:** SEISMIC monitors and analyzes historically recorded earthquakes using authoritative USGS data. It does not predict future earthquakes.

---

## ⚡ Highlights & Features

- **Official USGS FDSN Web Service Integration:** Real-time GeoJSON queries with zero mock, synthetic, or fabricated data.
- **Geographic Boundary Intelligence (Global, Asia, India):**
  - **Global:** Unrestricted worldwide seismic activity.
  - **Asia:** Continental boundary encompassing East, South, Southeast, Central, and West Asia.
  - **India:** Exact geodetic multi-polygon covering mainland India, Jammu & Kashmir, Ladakh, Gujarat, the Northeast, and island territories (Andaman & Nicobar Islands, Lakshadweep).
  - **Anti-False-Positive Engine:** Solves text-match ambiguities by strictly excluding oceanic features like the **Mid-Indian Ridge** ($-10^\circ\text{ S}$ to $-45^\circ\text{ S}$) from India.
- **Organized 4-Row Filter Architecture:**
  - **Row 1:** Region selector (`Global`, `Asia`, `India`), search field with clear trigger, sort dropdown (by origin time or magnitude), and reset button.
  - **Row 2:** Time-range presets (`Past 1 Hr`, `Past 24 Hrs`, `Past 7 Days`, `Past 30 Days`, `Custom Range`) with UTC pickers.
  - **Row 3:** Minimum magnitude, maximum magnitude bounds, and significant-event toggle ($M \ge 4.5$).
  - **Row 4:** Three-tier results breakdown: API Returned Count, Region Matches, and Displayed Count.
- **Interactive Geospatial World Map:** Leaflet map with official OpenStreetMap tiles, dark cartographic styling, circle markers scaled dynamically by magnitude, depth color coding, and interactive popups.
- **Dynamic KPI Telemetry:**
  - Total Earthquakes in active window
  - Strongest Recorded Magnitude (Peak)
  - Average Magnitude (excluding nulls, formatted to 2 decimals)
  - Significant Events count (explicitly defined dashboard threshold: $M \ge 4.5$)
  - Shallow Focus (<70 km) and Tsunami Flag sub-counters
- **Data Analytics & Visualizations:**
  - Event Frequency Timeline (hourly UTC buckets with zero-fill continuity)
  - Magnitude Distribution Histogram (energy bin analysis, dynamically prepending `< M 2.5` microseisms when queried)
- **Comprehensive Event Table & Telemetry Drawer:**
  - Sortable columns (Magnitude, Origin Time) with pagination
  - Visual status distinction: `Reviewed` by human seismologist vs `Automatic` preliminary sensor solution
  - Deep telemetry slide-over drawer synchronized across map markers and table rows
- **Network Resilience & Stale Data Retention:**
  - In-flight request cancellation via native `AbortController`
  - Graceful degradation: Preserves previously loaded valid records as stale during network issues
  - Configurable 60-second automatic polling with manual refresh capability
- **1-Page Assignment & Verification Report:** Integrated in-app modal and standalone [`ASSIGNMENT_REPORT.md`](./ASSIGNMENT_REPORT.md).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vite.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| **Mapping** | [Leaflet](https://leafletjs.com/) with Official OpenStreetMap Tiles |
| **Data Visualization**| [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + `jsdom` |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 1. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 2. Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open your browser at [http://127.0.0.1:5173](http://127.0.0.1:5173).

### 3. Running Automated Tests
Execute the 89-test suite covering country/region resolution, geographic boundaries, zero-results workflows, API query construction, GeoJSON normalization, authentic negative depth preservation, timeline & magnitude aggregations, KPI math, and UI components:
```bash
npm run test
```
To run tests in interactive watch mode:
```bash
npm run test:watch
```

### 4. Code Quality & Production Build
Run static linting and compile the optimized production bundle:
```bash
npm run lint
npm run build
npm run preview
```

---

## 📂 Project Structure

```text
seismic-earthquake-dashboard/
├── ASSIGNMENT_REPORT.md        # Comprehensive 1-page verification report
├── README.md                   # Project documentation & instructions
├── index.html                  # HTML entry point with SEO metadata and Google Fonts
├── vite.config.ts              # Vite & Vitest configuration
├── package.json                # Project dependencies and test scripts
└── src/
    ├── types/
    │   └── earthquake.ts       # USGS GeoJSON schema & normalized TypeScript models
    ├── services/
    │   ├── usgsApi.ts          # URL builder, fetch, AbortController, validation
    │   └── locationService.ts  # 50+ country/region registry, aliases, autocomplete
    ├── hooks/
    │   └── useEarthquakeData.ts# Reactive data hook, polling, stale state retention
    ├── utils/
    │   ├── calculations.ts     # KPI arithmetic, filtering, and origin-time sorting
    │   ├── geoBoundaries.ts    # Ray-casting point-in-polygon tests, India/Asia boundaries
    │   ├── formatters.ts       # Date, depth, coordinate, and severity formatters
    │   └── aggregation.ts      # Timeline & histogram binning for Recharts
    ├── components/
    │   ├── Header.tsx          # Branding, query window badge, connection, refresh
    │   ├── KpiCards.tsx        # 4 KPI cards & telemetry sub-counters
    │   ├── FilterBar.tsx       # 4-row layout: region, location search, sort, presets
    │   ├── AssignmentReportModal.tsx # In-app report viewer modal
    │   ├── Location/
    │   │   └── LocationDetailPanel.tsx # Focused location KPIs, event list, & zero-results
    │   ├── Map/
    │   │   ├── EarthquakeMap.tsx # Leaflet world map with circle markers & location viewports
    │   │   └── MapLegend.tsx   # Magnitude and depth color legend
    │   ├── Analytics/
    │   │   └── ChartsSection.tsx # Frequency timeline & magnitude distribution
    │   ├── EventTable/
    │   │   ├── EventTable.tsx  # Sortable table with reviewed/automatic badges
    │   │   └── TablePagination.tsx # Rows per page & pagination controls
    │   ├── EventDetails/
    │   │   └── EventDetailPanel.tsx # Slide-out telemetry drawer
    │   └── Common/
    │       └── ErrorBanner.tsx # Network error banner with retry trigger
    └── test/
        ├── setup.ts            # Test setup with @testing-library/jest-dom
        ├── usgsApi.test.ts     # API service, URL params, and GeoJSON tests
        ├── geoBoundaries.test.ts # India/Asia polygon, Mid-Indian Ridge exclusion tests
        ├── locationService.test.ts # Country alias resolution & autocomplete suggestions
        ├── locationWorkflow.test.tsx # Zero-result state, map navigation, and stats tests
        ├── calculations.test.ts# KPI calculations, null handling, filter tests
        ├── aggregation.test.ts # Timeline hourly bucketing & histogram tests
        ├── formatters.test.ts  # String, depth, coordinate, and color tests
        └── components.test.tsx # Unit tests for Header, KPIs, FilterBar, and Table
```

---

## 🔬 Official USGS API Verification

The dashboard queries the official USGS FDSN Web Service directly:
`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`

Verification was conducted by executing identical queries via `curl` and comparing with the dashboard's parsed state:
- Event IDs, origin timestamps, coordinates, and depth values match official records with zero deviation.
- Maximum and average magnitude formulas exclude nulls and missing values, displaying `N/A` instead of zero.
- Empty query responses (`{"features": []}`) are caught gracefully without application crash.
- Region filtering correctly separates geographic inclusion from simple place text matches.

For detailed test logs, query parameters, and comparison tables, refer to [`ASSIGNMENT_REPORT.md`](./ASSIGNMENT_REPORT.md).
