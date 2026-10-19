import type {
  UsgsQueryParams,
  UsgsGeoJsonResponse,
  UsgsGeoJsonFeature,
  EarthquakeEvent,
  TimeRangePreset,
} from '../types/earthquake';
import { SIGNIFICANT_MAGNITUDE_THRESHOLD } from '../utils/formatters';

export const USGS_API_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/**
 * Builds the URL and URLSearchParams for the USGS FDSN Web Service.
 */
export function buildUsgsApiUrl(params: UsgsQueryParams): string {
  const url = new URL(USGS_API_BASE_URL);

  url.searchParams.set('format', 'geojson');

  if (params.starttime) {
    url.searchParams.set('starttime', params.starttime);
  }
  if (params.endtime) {
    url.searchParams.set('endtime', params.endtime);
  }
  if (params.minmagnitude !== undefined && params.minmagnitude !== null) {
    url.searchParams.set('minmagnitude', String(params.minmagnitude));
  }
  if (params.maxmagnitude !== undefined && params.maxmagnitude !== null && params.maxmagnitude < 10) {
    url.searchParams.set('maxmagnitude', String(params.maxmagnitude));
  }
  if (params.minlatitude !== undefined && params.minlatitude !== null) {
    url.searchParams.set('minlatitude', String(params.minlatitude));
  }
  if (params.maxlatitude !== undefined && params.maxlatitude !== null) {
    url.searchParams.set('maxlatitude', String(params.maxlatitude));
  }
  if (params.minlongitude !== undefined && params.minlongitude !== null) {
    url.searchParams.set('minlongitude', String(params.minlongitude));
  }
  if (params.maxlongitude !== undefined && params.maxlongitude !== null) {
    url.searchParams.set('maxlongitude', String(params.maxlongitude));
  }
  if (params.limit !== undefined && params.limit !== null && params.limit > 0) {
    url.searchParams.set('limit', String(params.limit));
  }
  if (params.orderby) {
    url.searchParams.set('orderby', params.orderby);
  }

  return url.toString();
}

/**
 * Converts a time preset (1h, 24h, 7d, 30d) into starttime and endtime ISO strings.
 * Ensures the end time is current when a fresh request is constructed.
 */
export function calculateTimeWindow(
  preset: TimeRangePreset,
  customStart?: string,
  customEnd?: string
): { starttime: string; endtime: string } {
  const now = new Date();
  const endtime = now.toISOString();

  if (preset === 'custom' && customStart && customEnd) {
    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return {
        starttime: startDate.toISOString(),
        endtime: endDate.toISOString(),
      };
    }
  }

  const startDate = new Date(now.getTime());
  switch (preset) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setHours(startDate.getHours() - 24);
      break;
  }

  return {
    starttime: startDate.toISOString(),
    endtime,
  };
}

/**
 * Validates and normalizes raw USGS GeoJSON features into typed EarthquakeEvents.
 * Defensive against missing properties, null coordinates, NaN values.
 */
export function normalizeUsgsFeature(
  feature: unknown,
  significantThreshold: number = SIGNIFICANT_MAGNITUDE_THRESHOLD
): EarthquakeEvent | null {
  if (!feature || typeof feature !== 'object') {
    return null;
  }

  const raw = feature as UsgsGeoJsonFeature;
  const id = raw.id || `unknown-${Math.random().toString(36).substring(2, 9)}`;
  const props = raw.properties || ({} as Partial<typeof raw.properties>);

  // Parse magnitude safely
  let magnitude: number | null = null;
  if (typeof props.mag === 'number' && !isNaN(props.mag)) {
    magnitude = props.mag;
  }

  // Parse time safely
  const time = typeof props.time === 'number' && !isNaN(props.time) ? props.time : Date.now();
  const updatedTime = typeof props.updated === 'number' && !isNaN(props.updated) ? props.updated : null;

  // Parse coordinates safely
  // GeoJSON format specifies: [longitude, latitude, depth_km]
  let coordinates: EarthquakeEvent['coordinates'] = null;
  if (
    raw.geometry &&
    raw.geometry.type === 'Point' &&
    Array.isArray(raw.geometry.coordinates) &&
    raw.geometry.coordinates.length >= 2
  ) {
    const lon = Number(raw.geometry.coordinates[0]);
    const lat = Number(raw.geometry.coordinates[1]);
    const depth = raw.geometry.coordinates.length >= 3 ? Number(raw.geometry.coordinates[2]) : 0;

    if (!isNaN(lon) && !isNaN(lat) && !isNaN(depth)) {
      coordinates = {
        longitude: lon,
        latitude: lat,
        depthKm: Number(depth.toFixed(2)),
      };
    }
  }

  const place = (props.place && typeof props.place === 'string') ? props.place.trim() : 'Unknown Location';
  const title = (props.title && typeof props.title === 'string') ? props.title.trim() : `Event at ${place}`;
  const url = props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`;

  const alert =
    props.alert === 'green' || props.alert === 'yellow' || props.alert === 'orange' || props.alert === 'red'
      ? props.alert
      : null;

  return {
    id,
    title,
    place,
    magnitude,
    magType: props.magType || null,
    time,
    updatedTime,
    coordinates,
    url,
    detailUrl: props.detail,
    status: props.status || 'unknown',
    tsunami: Boolean(props.tsunami),
    significanceScore: typeof props.sig === 'number' ? props.sig : null,
    alert,
    feltReports: typeof props.felt === 'number' ? props.felt : null,
    mmi: typeof props.mmi === 'number' ? props.mmi : null,
    isSignificant: magnitude !== null && magnitude >= significantThreshold,
  };
}

/**
 * Validates the raw JSON response object from the USGS API.
 */
export function validateGeoJsonResponse(data: unknown): UsgsGeoJsonResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Malformed API response: Received empty or non-object response from USGS.');
  }

  const geoJson = data as UsgsGeoJsonResponse;

  if (geoJson.type !== 'FeatureCollection') {
    throw new Error(`Invalid GeoJSON type: Expected "FeatureCollection", received "${geoJson.type}".`);
  }

  if (!Array.isArray(geoJson.features)) {
    throw new Error('Malformed GeoJSON: "features" field is missing or not an array.');
  }

  return geoJson;
}

/**
 * Fetches real earthquake records from the official USGS FDSN Web Service.
 * Implements AbortSignal for stale request cancellation and comprehensive error handling.
 */
export async function fetchEarthquakesFromUsgs(
  params: UsgsQueryParams,
  signal?: AbortSignal
): Promise<{
  events: EarthquakeEvent[];
  rawResponse: UsgsGeoJsonResponse;
  requestUrl: string;
}> {
  const requestUrl = buildUsgsApiUrl(params);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/geo+json',
      },
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error(`Network failure connecting to USGS API: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `USGS API returned HTTP ${response.status} (${response.statusText}): ${errorBody || 'Service unavailable'}`
    );
  }

  let jsonData: unknown;
  try {
    jsonData = await response.json();
  } catch (err) {
    throw new Error(`Failed to parse USGS GeoJSON response as JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  const validated = validateGeoJsonResponse(jsonData);

  // Normalize each feature, safely dropping unparseable entries
  const events: EarthquakeEvent[] = [];
  for (const rawFeature of validated.features) {
    const normalized = normalizeUsgsFeature(rawFeature);
    if (normalized) {
      events.push(normalized);
    }
  }

  return {
    events,
    rawResponse: validated,
    requestUrl,
  };
}
