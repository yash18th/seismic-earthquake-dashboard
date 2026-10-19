/**
 * Official USGS FDSN Web Service GeoJSON Data Model
 * Reference: https://earthquake.usgs.gov/fdsnws/event/1/
 */

export interface UsgsGeoJsonFeatureProperties {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail?: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: 'green' | 'yellow' | 'orange' | 'red' | string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string | null;
  type: string;
  title: string;
}

export interface UsgsGeoJsonGeometry {
  type: 'Point';
  /** [longitude, latitude, depth_km] */
  coordinates: [number, number, number] | number[];
}

export interface UsgsGeoJsonFeature {
  type: 'Feature';
  properties: UsgsGeoJsonFeatureProperties;
  geometry: UsgsGeoJsonGeometry | null;
  id: string;
}

export interface UsgsGeoJsonMetadata {
  generated: number;
  url: string;
  title: string;
  status: number;
  api: string;
  count?: number;
  limit?: number;
  offset?: number;
}

export interface UsgsGeoJsonResponse {
  type: 'FeatureCollection';
  metadata: UsgsGeoJsonMetadata;
  features: UsgsGeoJsonFeature[];
  bbox?: number[];
}

/**
 * Normalized internal Earthquake Event model for SEISMIC dashboard
 */
export interface EarthquakeEvent {
  id: string;
  title: string;
  place: string;
  magnitude: number | null;
  magType: string | null;
  time: number; // Unix timestamp in ms
  updatedTime: number | null;
  coordinates: {
    longitude: number;
    latitude: number;
    depthKm: number;
  } | null;
  url: string;
  detailUrl?: string;
  status: string;
  tsunami: boolean;
  significanceScore: number | null; // USGS 'sig' 0-1000
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  feltReports: number | null;
  mmi: number | null;
  isSignificant: boolean; // based on magnitude >= threshold
}

export type TimeRangePreset = '1h' | '24h' | '7d' | '30d' | 'custom';

export type RegionPreset = 'global' | 'asia' | 'india';

export interface ResolvedLocation {
  id: string;
  name: string;
  displayName: string;
  type: 'country' | 'region' | 'city';
  center: [number, number]; // [latitude, longitude]
  bounds: {
    minlatitude: number;
    maxlatitude: number;
    minlongitude: number;
    maxlongitude: number;
  };
  zoom: number;
  polygon?: [number, number][]; // optional polygon for point-in-polygon verification
  aliases?: string[];
}

export type SortOption = 'newest' | 'oldest' | 'strongest' | 'weakest';

export interface UsgsQueryParams {
  format: 'geojson';
  starttime?: string;
  endtime?: string;
  minmagnitude?: number;
  maxmagnitude?: number;
  minlatitude?: number;
  maxlatitude?: number;
  minlongitude?: number;
  maxlongitude?: number;
  limit?: number;
  orderby?: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';
}

export interface DashboardFilterState {
  region: RegionPreset;
  selectedLocation: ResolvedLocation | null;
  timePreset: TimeRangePreset;
  customStartTime: string;
  customEndTime: string;
  minMagnitude: number;
  maxMagnitude: number;
  searchQuery: string;
  sortBy: SortOption;
  limit: number;
  significantOnly: boolean;
}

export interface DashboardKpis {
  totalCount: number;
  strongestMagnitude: number | null;
  averageMagnitude: number | null;
  significantCount: number;
  shallowCount: number;
  tsunamiWarningCount: number;
}

export interface HourlyCountBucket {
  hourLabel: string;
  timestamp: number;
  count: number;
  maxMag: number | null;
}

export interface MagnitudeBinBucket {
  rangeLabel: string;
  minMag: number;
  maxMag: number;
  count: number;
}

export interface ApiResponseState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
  rawUrl: string | null;
}
