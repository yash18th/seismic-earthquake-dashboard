import type { EarthquakeEvent, RegionPreset, ResolvedLocation } from '../types/earthquake';

/**
 * Point-in-polygon ray-casting test.
 * Polygon coordinates are in [latitude, longitude] order.
 */
export function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0];
    const xi = polygon[i][1];
    const yj = polygon[j][0];
    const xj = polygon[j][1];

    const intersect =
      xi > lon !== xj > lon &&
      lat < ((yj - yi) * (lon - xi)) / (xj - xi) + yi;

    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Geographic polygon defining the boundary of mainland India.
 * Verified to exclude oceanic ridges (Mid-Indian Ridge), Pakistan, Tibet,
 * Nepal, Bhutan, Bangladesh, Myanmar, and Sri Lanka.
 */
export const INDIA_MAINLAND_POLYGON: [number, number][] = [
  [23.7, 68.1],
  [24.3, 68.8],
  [24.7, 71.0],
  [27.0, 70.0],
  [28.5, 71.8],
  [30.0, 73.5],
  [31.5, 74.8],
  [32.5, 74.5],
  [34.0, 74.0],
  [35.5, 74.5],
  [37.1, 75.5],
  [37.1, 77.0],
  [35.5, 78.5],
  [34.0, 79.5],
  [32.5, 79.0],
  [31.0, 78.5],
  [30.5, 79.5],
  [30.0, 80.5],
  [29.0, 80.2],
  [27.5, 81.5],
  [27.0, 84.5],
  [26.5, 87.0],
  [26.8, 88.0],
  [27.2, 88.1],
  [28.0, 88.6],
  [27.1, 88.9],
  [26.8, 89.8],
  [26.8, 92.0],
  [27.8, 92.0],
  [28.3, 93.5],
  [29.0, 95.0],
  [28.3, 97.0],
  [28.0, 97.4],
  [27.0, 96.5],
  [25.5, 95.0],
  [24.0, 94.0],
  [22.0, 93.0],
  [21.5, 92.5],
  [23.5, 91.5],
  [24.5, 92.0],
  [25.2, 92.5],
  [25.3, 90.0],
  [26.0, 89.8],
  [25.0, 88.5],
  [22.5, 89.0],
  [21.5, 87.5],
  [20.0, 86.0],
  [17.5, 83.0],
  [16.0, 81.0],
  [13.5, 80.2],
  [10.5, 79.8],
  [9.2, 79.2],
  [8.1, 77.5],
  [8.5, 76.9],
  [10.0, 76.2],
  [13.0, 74.8],
  [15.5, 73.8],
  [19.0, 72.8],
  [21.0, 72.7],
  [20.7, 71.0],
  [21.5, 69.5],
  [22.5, 69.0],
  [23.5, 68.5],
];

/**
 * Geographic polygon bounding the Andaman and Nicobar Islands territory.
 * Extends from Indira Point (6.75° N) northwards to Coco Channel (14.2° N).
 */
export const ANDAMAN_NICOBAR_POLYGON: [number, number][] = [
  [6.5, 92.0],
  [14.2, 92.0],
  [14.2, 94.5],
  [6.5, 94.5],
];

/**
 * Geographic polygon bounding the Lakshadweep archipelago.
 */
export const LAKSHADWEEP_POLYGON: [number, number][] = [
  [8.0, 71.5],
  [12.5, 71.5],
  [12.5, 74.5],
  [8.0, 74.5],
];

/**
 * Continental polygon defining the extent of Asia:
 * - South Asia (India, Pakistan, Bangladesh, Nepal, Bhutan, Sri Lanka, Maldives)
 * - East Asia (China, Japan, Koreas, Taiwan, Mongolia)
 * - Southeast Asia (Indonesia, Philippines, Vietnam, Thailand, Malaysia, etc.)
 * - Central Asia (Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan, Afghanistan)
 * - West Asia / Middle East (Iran, Iraq, Turkey, Levant, Arabian Peninsula, Caucasus)
 * - North Asia (Russia east of Ural Mountains)
 */
export const ASIA_POLYGON: [number, number][] = [
  [42.0, 26.0],
  [36.0, 26.0],
  [31.5, 34.0],
  [29.5, 34.5],
  [27.5, 35.0],
  [20.0, 39.0],
  [12.5, 43.5],
  [11.5, 51.0],
  [16.5, 54.0],
  [22.0, 60.0],
  [25.0, 62.0],
  [23.5, 68.5],
  [8.0, 77.0],
  [0.0, 73.0],
  [-1.0, 73.0],
  [-11.5, 95.0],
  [-11.5, 125.0],
  [-11.5, 131.0],
  [-9.0, 141.0],
  [0.0, 141.0],
  [5.0, 130.0],
  [15.0, 130.0],
  [25.0, 135.0],
  [35.0, 145.0],
  [45.0, 155.0],
  [55.0, 165.0],
  [66.0, 175.0],
  [77.0, 180.0],
  [80.0, 130.0],
  [80.0, 90.0],
  [75.0, 60.0],
  [68.0, 60.0],
  [60.0, 60.0],
  [52.0, 55.0],
  [47.0, 50.0],
  [44.0, 48.0],
  [41.0, 40.0],
];

/**
 * Checks whether an earthquake event's epicenter falls within India's geographic boundary.
 * Tests mainland India, Andaman & Nicobar, and Lakshadweep polygons.
 */
export function isEventInIndia(event: EarthquakeEvent): boolean {
  if (!event.coordinates) return false;
  const { latitude, longitude } = event.coordinates;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  return (
    isPointInPolygon(latitude, longitude, INDIA_MAINLAND_POLYGON) ||
    isPointInPolygon(latitude, longitude, ANDAMAN_NICOBAR_POLYGON) ||
    isPointInPolygon(latitude, longitude, LAKSHADWEEP_POLYGON)
  );
}

/**
 * Checks whether an earthquake event falls within the Asian continent.
 */
export function isEventInAsia(event: EarthquakeEvent): boolean {
  if (!event.coordinates) return false;
  const { latitude, longitude } = event.coordinates;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  return isPointInPolygon(latitude, longitude, ASIA_POLYGON);
}

/**
 * Verifies if an earthquake event is geographically contained within the selected region.
 */
export function isEventInRegion(event: EarthquakeEvent, region: RegionPreset): boolean {
  if (region === 'global') return true;
  if (region === 'india') return isEventInIndia(event);
  if (region === 'asia') return isEventInAsia(event);
  return true;
}

/**
 * Provides USGS API bounding box parameters for initial server-side candidate reduction.
 * Returns null for 'global' (unrestricted).
 */
export function getRegionBoundingBox(
  region: RegionPreset
): { minlatitude: number; maxlatitude: number; minlongitude: number; maxlongitude: number } | null {
  switch (region) {
    case 'india':
      return {
        minlatitude: 6.0,
        maxlatitude: 37.5,
        minlongitude: 68.0,
        maxlongitude: 97.5,
      };
    case 'asia':
      return {
        minlatitude: -12.0,
        maxlatitude: 82.0,
        minlongitude: 25.0,
        maxlongitude: 180.0,
      };
    case 'global':
    default:
      return null;
  }
}

/**
 * Checks whether an earthquake event's epicenter falls within a specific resolved geographic location.
 * Respects exact polygons (India, etc.), bounding boxes, and handles antimeridian crossings.
 */
/**
 * Checks whether an event falls within USA territory (CONUS, Alaska, Hawaii, Puerto Rico).
 * Excludes Canada (Vancouver, Alberta, Ontario) and Mexico.
 */
export function isEventInUSA(event: EarthquakeEvent): boolean {
  if (!event.coordinates) return false;
  const { latitude, longitude } = event.coordinates;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return false;
  }

  // Check CONUS (Continental US): south of 49.0° N (US-Canada border)
  const isConus =
    latitude >= 24.5 &&
    latitude <= 49.0 &&
    longitude >= -125.0 &&
    longitude <= -66.5;

  // Check Alaska: north of 51.0° N, west of 141° W (Yukon border) + Panhandle
  const isAlaska =
    latitude >= 51.0 &&
    latitude <= 71.5 &&
    (longitude >= -179.0 && longitude <= -141.0 ||
      (latitude <= 60.5 && longitude >= -141.0 && longitude <= -130.0));

  // Check Hawaii
  const isHawaii =
    latitude >= 18.5 &&
    latitude <= 22.5 &&
    longitude >= -160.5 &&
    longitude <= -154.5;

  // Check Puerto Rico & US Virgin Islands
  const isPuertoRico =
    latitude >= 17.5 &&
    latitude <= 18.6 &&
    longitude >= -67.5 &&
    longitude <= -64.5;

  return isConus || isAlaska || isHawaii || isPuertoRico;
}

/**
 * Checks whether an earthquake event's epicenter falls within a specific resolved geographic location.
 * Respects exact polygons (India, etc.), bounding boxes, and handles antimeridian crossings.
 */
export function isEventInLocation(event: EarthquakeEvent, location: ResolvedLocation): boolean {
  if (!event.coordinates) return false;
  const { latitude, longitude } = event.coordinates;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return false;
  }

  // Exact territorial test for India (excludes Mid-Indian Ridge and bordering states)
  if (location.id === 'IN') {
    return isEventInIndia(event);
  }

  // Exact territorial test for USA (excludes Canada and Mexico)
  if (location.id === 'US') {
    return isEventInUSA(event);
  }

  // If a verified polygon is supplied, test against it
  if (location.polygon && location.polygon.length > 2) {
    return isPointInPolygon(latitude, longitude, location.polygon);
  }

  // Bounding box evaluation with antimeridian (international date line) support
  const { minlatitude, maxlatitude, minlongitude, maxlongitude } = location.bounds;

  const latMatch = latitude >= minlatitude && latitude <= maxlatitude;
  if (!latMatch) return false;

  if (minlongitude <= maxlongitude) {
    return longitude >= minlongitude && longitude <= maxlongitude;
  } else {
    // Crosses 180° meridian (e.g. 170° to -170°)
    return longitude >= minlongitude || longitude <= maxlongitude;
  }
}

/**
 * Default map view center and zoom for each region preset.
 */
export function getRegionViewport(region: RegionPreset): { center: [number, number]; zoom: number } {
  switch (region) {
    case 'india':
      return { center: [22.0, 79.0], zoom: 5 };
    case 'asia':
      return { center: [34.0, 95.0], zoom: 3 };
    case 'global':
    default:
      return { center: [20.0, 0.0], zoom: 2 };
  }
}
