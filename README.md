# SEISMIC — Real-Time Earthquake Intelligence Dashboard

An interactive, production-quality earthquake monitoring dashboard powered by live seismic telemetry from the **official United States Geological Survey (USGS) Earthquake Hazards API**.

Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Leaflet**, and **Recharts**.

---

## ⚡ Highlights & Features

- **Official USGS FDSN Web Service Integration:** Real-time GeoJSON queries with no mock, synthetic, or fabricated data.
- **Scientific Dark Navy Design:** Designed with a refined dark telemetry interface (`#070b14`), high-contrast data cards, and restrained amber/red severity indicators.
- **Interactive Geospatial World Map:** Leaflet map with official OpenStreetMap tiles, dark cartographic styling, circle markers scaled dynamically by magnitude, depth color coding, and interactive popups.
- **Dynamic KPI Telemetry:**
  - Total Earthquakes in active window
  - Strongest Recorded Magnitude (Peak)
  - Average Magnitude (excluding nulls, formatted to 2 decimals)
  - Significant Events count (explicitly defined dashboard threshold: $M \ge 4.5$)
  - Shallow Focus (<70 km) and Tsunami Flag sub-counters
- **Parametric Filtering & Text Search:**
  - Server-side time presets (Past 1 Hour, Past 24 Hours, Past 7 Days, Past 30 Days, Custom Range)
  - Minimum magnitude filtering (M 1.0+, 2.5+, 3.5+, 4.5+, 5.5+, 6.5+)
  - In-memory text search by region, country, or location
  - Multi-criteria sorting (Newest, Oldest, Strongest, Weakest)
  - Result limit controls and quick filter reset
- **Data Analytics & Visualizations:**
  - Event Frequency Timeline (hourly UTC buckets)
  - Magnitude Distribution Histogram (energy bin analysis)
- **Comprehensive Event Table & Telemetry Drawer:**
  - Sortable columns (Magnitude, Time) with pagination
  - Deep telemetry slide-over drawer synchronized across map markers and table rows
  - One-click copy for USGS Event IDs and direct links to official USGS event pages
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
Execute the 45-test suite covering API construction, GeoJSON normalization, KPI math, and UI components:
```bash
npm run test
```
To run tests in interactive watch mode:
```bash
npm run test:watch
```

### 4. Production Build & Preview
Compile the optimized production bundle:
```bash
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
    │   └── usgsApi.ts          # URL builder, fetch, AbortController, validation
    ├── hooks/
    │   └── useEarthquakeData.ts# Reactive data hook, polling, stale state retention
    ├── utils/
    │   ├── calculations.ts     # KPI arithmetic, filtering, and sorting
    │   ├── formatters.ts       # Date, depth, coordinate, and severity formatters
    │   └── aggregation.ts      # Timeline & histogram binning for Recharts
    ├── components/
    │   ├── Header.tsx          # Branding, connection badge, last sync, refresh
    │   ├── KpiCards.tsx        # 4 KPI cards & telemetry sub-counters
    │   ├── FilterBar.tsx       # Search, time window, min mag, and sorting
    │   ├── AssignmentReportModal.tsx # In-app report viewer modal
    │   ├── Map/
    │   │   ├── EarthquakeMap.tsx # Leaflet world map with circle markers
    │   │   └── MapLegend.tsx   # Magnitude and depth color legend
    │   ├── Analytics/
    │   │   └── ChartsSection.tsx # Frequency timeline & magnitude distribution
    │   ├── EventTable/
    │   │   ├── EventTable.tsx  # Sortable table with detail buttons
    │   │   └── TablePagination.tsx # Rows per page & pagination controls
    │   ├── EventDetails/
    │   │   └── EventDetailPanel.tsx # Slide-out telemetry drawer
    │   └── Common/
    │       └── ErrorBanner.tsx # Network error banner with retry trigger
    └── test/
        ├── setup.ts            # Test setup with @testing-library/jest-dom
        ├── usgsApi.test.ts     # API service, URL params, and GeoJSON tests
        ├── calculations.test.ts# KPI calculations, null handling, filter tests
        ├── formatters.test.ts  # String, depth, coordinate, and color tests
        └── components.test.tsx # Unit tests for Header, KPIs, Table, and Drawer
```

---

## 🔬 Official USGS API Verification

The dashboard queries the official USGS FDSN Web Service directly:
`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`

Verification was conducted by executing identical queries via `curl` and comparing with the dashboard's parsed state:
- Event IDs, timestamps, coordinates, and depth values match official records with zero deviation.
- Maximum and average magnitude formulas exclude nulls and missing values, displaying `N/A` instead of zero.
- Empty query responses (`{"features": []}`) are caught gracefully without application crash.

For detailed test logs, query parameters, and comparison tables, refer to [`ASSIGNMENT_REPORT.md`](./ASSIGNMENT_REPORT.md).
