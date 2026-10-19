import type { ResolvedLocation } from '../types/earthquake';

/**
  * Curated authoritative geographic database of countries, territories,
  * seismically active regions, and major cities.
  *
  * All bounding boxes and coordinates use WGS84 standards compatible with
  * USGS FDSN Web Service (minlatitude, maxlatitude, minlongitude, maxlongitude).
  */
export const VERIFIED_LOCATIONS: ResolvedLocation[] = [
  // --- United Kingdom ---
  {
    id: 'GB',
    name: 'United Kingdom',
    displayName: 'United Kingdom',
    type: 'country',
    center: [55.3781, -3.436],
    bounds: {
      minlatitude: 49.8,
      maxlatitude: 60.9,
      minlongitude: -8.6,
      maxlongitude: 1.8,
    },
    zoom: 6,
    aliases: ['uk', 'gb', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', 'britain', 'united kingdom of great britain'],
  },

  // --- United States of America ---
  {
    id: 'US',
    name: 'United States',
    displayName: 'United States',
    type: 'country',
    center: [39.8283, -98.5795],
    bounds: {
      minlatitude: 18.0,
      maxlatitude: 71.5,
      minlongitude: -170.0,
      maxlongitude: -65.0,
    },
    zoom: 4,
    aliases: ['usa', 'us', 'america', 'united states', 'united states of america', 'u.s.', 'u.s.a.'],
  },

  // --- California (Seismically Critical US State) ---
  {
    id: 'US-CA',
    name: 'California, USA',
    displayName: 'California, USA',
    type: 'region',
    center: [36.7783, -119.4179],
    bounds: {
      minlatitude: 32.5,
      maxlatitude: 42.0,
      minlongitude: -124.5,
      maxlongitude: -114.1,
    },
    zoom: 6,
    aliases: ['california', 'ca', 'socal', 'norcal', 'san andreas', 'bay area', 'los angeles', 'san francisco'],
  },

  // --- Alaska (Most seismically active US state) ---
  {
    id: 'US-AK',
    name: 'Alaska, USA',
    displayName: 'Alaska, USA',
    type: 'region',
    center: [64.2008, -149.4937],
    bounds: {
      minlatitude: 51.0,
      maxlatitude: 71.5,
      minlongitude: -179.0,
      maxlongitude: -130.0,
    },
    zoom: 4,
    aliases: ['alaska', 'ak', 'aleutian islands', 'anchorage'],
  },

  // --- Hawaii ---
  {
    id: 'US-HI',
    name: 'Hawaii, USA',
    displayName: 'Hawaii, USA',
    type: 'region',
    center: [19.8968, -155.5828],
    bounds: {
      minlatitude: 18.8,
      maxlatitude: 22.3,
      minlongitude: -160.5,
      maxlongitude: -154.5,
    },
    zoom: 7,
    aliases: ['hawaii', 'hi', 'honolulu', 'kilauea', 'big island'],
  },

  // --- Indonesia ---
  {
    id: 'ID',
    name: 'Indonesia',
    displayName: 'Indonesia',
    type: 'country',
    center: [-0.7893, 113.9213],
    bounds: {
      minlatitude: -11.0,
      maxlatitude: 6.0,
      minlongitude: 95.0,
      maxlongitude: 141.0,
    },
    zoom: 5,
    aliases: ['indonesia', 'id', 'idn', 'indo', 'sumatra', 'java', 'bali', 'sulawesi', 'papua', 'banda sea', 'molucca sea', 'sunda strait'],
  },

  // --- Jakarta (Indonesia Capital) ---
  {
    id: 'ID-JKT',
    name: 'Jakarta, Indonesia',
    displayName: 'Jakarta, Indonesia',
    type: 'city',
    center: [-6.2088, 106.8456],
    bounds: {
      minlatitude: -6.4,
      maxlatitude: -6.05,
      minlongitude: 106.65,
      maxlongitude: 107.0,
    },
    zoom: 10,
    aliases: ['jakarta', 'dki jakarta'],
  },

  // --- India ---
  {
    id: 'IN',
    name: 'India',
    displayName: 'India',
    type: 'country',
    center: [22.0, 79.0],
    bounds: {
      minlatitude: 6.0,
      maxlatitude: 37.5,
      minlongitude: 68.0,
      maxlongitude: 97.5,
    },
    zoom: 5,
    aliases: ['india', 'in', 'ind', 'bharat', 'hindustan'],
  },

  // --- Japan ---
  {
    id: 'JP',
    name: 'Japan',
    displayName: 'Japan',
    type: 'country',
    center: [36.2048, 138.2529],
    bounds: {
      minlatitude: 24.0,
      maxlatitude: 46.0,
      minlongitude: 122.5,
      maxlongitude: 150.0,
    },
    zoom: 5,
    aliases: ['japan', 'jp', 'jpn', 'nippon', 'nihon', 'honshu', 'hokkaido', 'kyushu', 'shikoku'],
  },

  // --- Tokyo (Japan Capital) ---
  {
    id: 'JP-TKY',
    name: 'Tokyo, Japan',
    displayName: 'Tokyo, Japan',
    type: 'city',
    center: [35.6762, 139.6503],
    bounds: {
      minlatitude: 35.5,
      maxlatitude: 35.85,
      minlongitude: 139.4,
      maxlongitude: 139.9,
    },
    zoom: 10,
    aliases: ['tokyo', 'greater tokyo'],
  },

  // --- Nepal ---
  {
    id: 'NP',
    name: 'Nepal',
    displayName: 'Nepal',
    type: 'country',
    center: [28.3949, 84.124],
    bounds: {
      minlatitude: 26.3,
      maxlatitude: 30.5,
      minlongitude: 80.0,
      maxlongitude: 88.2,
    },
    zoom: 7,
    aliases: ['nepal', 'np', 'npl', 'kathmandu', 'himalayas'],
  },

  // --- Turkey (Türkiye) ---
  {
    id: 'TR',
    name: 'Turkey',
    displayName: 'Turkey (Türkiye)',
    type: 'country',
    center: [38.9637, 35.2433],
    bounds: {
      minlatitude: 35.8,
      maxlatitude: 42.2,
      minlongitude: 25.6,
      maxlongitude: 44.8,
    },
    zoom: 6,
    aliases: ['turkey', 'turkiye', 'türkiye', 'tr', 'tur', 'anatolia', 'east anatolian fault', 'north anatolian fault', 'istanbul', 'ankara'],
  },

  // --- Philippines ---
  {
    id: 'PH',
    name: 'Philippines',
    displayName: 'Philippines',
    type: 'country',
    center: [12.8797, 121.774],
    bounds: {
      minlatitude: 4.5,
      maxlatitude: 21.5,
      minlongitude: 116.5,
      maxlongitude: 127.0,
    },
    zoom: 5,
    aliases: ['philippines', 'ph', 'phl', 'filipino', 'luzon', 'mindanao', 'visayas', 'manila'],
  },

  // --- New Zealand ---
  {
    id: 'NZ',
    name: 'New Zealand',
    displayName: 'New Zealand',
    type: 'country',
    center: [-40.9006, 174.886],
    bounds: {
      minlatitude: -47.5,
      maxlatitude: -34.0,
      minlongitude: 166.0,
      maxlongitude: 179.0,
    },
    zoom: 5,
    aliases: ['new zealand', 'nz', 'nzl', 'aotearoa', 'christchurch', 'wellington', 'auckland', 'kermadec'],
  },

  // --- Chile ---
  {
    id: 'CL',
    name: 'Chile',
    displayName: 'Chile',
    type: 'country',
    center: [-35.6751, -71.543],
    bounds: {
      minlatitude: -56.0,
      maxlatitude: -17.5,
      minlongitude: -76.0,
      maxlongitude: -66.0,
    },
    zoom: 4,
    aliases: ['chile', 'cl', 'chl', 'santiago', 'valparaiso', 'atacama'],
  },

  // --- Mexico ---
  {
    id: 'MX',
    name: 'Mexico',
    displayName: 'Mexico',
    type: 'country',
    center: [23.6345, -102.5528],
    bounds: {
      minlatitude: 14.5,
      maxlatitude: 33.0,
      minlongitude: -118.5,
      maxlongitude: -86.5,
    },
    zoom: 5,
    aliases: ['mexico', 'mx', 'mex', 'mexico city', 'oaxaca', 'guerrero', 'chiapas', 'michoacan'],
  },

  // --- Italy ---
  {
    id: 'IT',
    name: 'Italy',
    displayName: 'Italy',
    type: 'country',
    center: [41.8719, 12.5674],
    bounds: {
      minlatitude: 36.5,
      maxlatitude: 47.1,
      minlongitude: 6.6,
      maxlongitude: 18.6,
    },
    zoom: 6,
    aliases: ['italy', 'it', 'ita', 'italia', 'sicily', 'apennines', 'rome'],
  },

  // --- Greece ---
  {
    id: 'GR',
    name: 'Greece',
    displayName: 'Greece',
    type: 'country',
    center: [39.0742, 21.8243],
    bounds: {
      minlatitude: 34.7,
      maxlatitude: 41.8,
      minlongitude: 19.3,
      maxlongitude: 29.7,
    },
    zoom: 6,
    aliases: ['greece', 'gr', 'grc', 'hellas', 'crete', 'aegean', 'athens'],
  },

  // --- Taiwan ---
  {
    id: 'TW',
    name: 'Taiwan',
    displayName: 'Taiwan',
    type: 'region',
    center: [23.6978, 120.9605],
    bounds: {
      minlatitude: 21.8,
      maxlatitude: 25.5,
      minlongitude: 119.8,
      maxlongitude: 122.1,
    },
    zoom: 7,
    aliases: ['taiwan', 'tw', 'twn', 'taipei', 'hualien'],
  },

  // --- Iceland ---
  {
    id: 'IS',
    name: 'Iceland',
    displayName: 'Iceland',
    type: 'country',
    center: [64.9631, -19.0208],
    bounds: {
      minlatitude: 63.2,
      maxlatitude: 66.6,
      minlongitude: -24.6,
      maxlongitude: -13.4,
    },
    zoom: 6,
    aliases: ['iceland', 'is', 'isl', 'reykjavik', 'reykjanes', 'mid-atlantic ridge iceland'],
  },

  // --- Canada ---
  {
    id: 'CA',
    name: 'Canada',
    displayName: 'Canada',
    type: 'country',
    center: [56.1304, -106.3468],
    bounds: {
      minlatitude: 41.6,
      maxlatitude: 83.1,
      minlongitude: -141.0,
      maxlongitude: -52.6,
    },
    zoom: 3,
    aliases: ['canada', 'can', 'british columbia', 'vancouver', 'quebec'],
  },

  // --- Australia ---
  {
    id: 'AU',
    name: 'Australia',
    displayName: 'Australia',
    type: 'country',
    center: [-25.2744, 133.7751],
    bounds: {
      minlatitude: -44.0,
      maxlatitude: -10.0,
      minlongitude: 112.0,
      maxlongitude: 154.0,
    },
    zoom: 4,
    aliases: ['australia', 'au', 'aus', 'sydney', 'melbourne'],
  },

  // --- Papua New Guinea ---
  {
    id: 'PG',
    name: 'Papua New Guinea',
    displayName: 'Papua New Guinea',
    type: 'country',
    center: [-6.314993, 143.95555],
    bounds: {
      minlatitude: -12.0,
      maxlatitude: -0.5,
      minlongitude: 140.5,
      maxlongitude: 156.0,
    },
    zoom: 6,
    aliases: ['papua new guinea', 'png', 'new britain', 'port moresby'],
  },

  // --- Fiji ---
  {
    id: 'FJ',
    name: 'Fiji',
    displayName: 'Fiji',
    type: 'country',
    center: [-17.7134, 178.065],
    bounds: {
      minlatitude: -22.0,
      maxlatitude: -12.0,
      minlongitude: 174.0,
      maxlongitude: 180.0,
    },
    zoom: 6,
    aliases: ['fiji', 'fj', 'fji', 'suva', 'tonga trench'],
  },
];

/**
 * In-memory LRU-like cache for geocoded queries.
 */
const geocodeCache = new Map<string, ResolvedLocation | null>();

/**
 * Normalizes a raw user query string for clean matching.
 */
export function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Synchronous resolution of country, region, city, or alias against verified local registry.
 * Returns null if the query is not recognized as a known location.
 */
export function resolveLocationLocally(query: string): ResolvedLocation | null {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  // 1. Exact match on country/region ID (e.g. "US", "GB", "ID", "IN", "JP")
  const idMatch = VERIFIED_LOCATIONS.find((loc) => loc.id.toLowerCase() === normalized);
  if (idMatch) return idMatch;

  // 2. Exact match on name
  const nameMatch = VERIFIED_LOCATIONS.find((loc) => normalizeQuery(loc.name) === normalized);
  if (nameMatch) return nameMatch;

  // 3. Exact match in aliases
  const aliasMatch = VERIFIED_LOCATIONS.find((loc) =>
    loc.aliases?.some((alias) => normalizeQuery(alias) === normalized)
  );
  if (aliasMatch) return aliasMatch;

  // 4. Starts-with or token match (e.g. "united states of america" or "england")
  const prefixMatch = VERIFIED_LOCATIONS.find(
    (loc) =>
      normalizeQuery(loc.name).startsWith(normalized) ||
      loc.aliases?.some((alias) => normalizeQuery(alias).startsWith(normalized))
  );
  if (prefixMatch) return prefixMatch;

  return null;
}

/**
 * Finds location autocomplete suggestions matching the user's input.
 * Fast, non-blocking, and handles aliases gracefully.
 */
export function searchLocationSuggestions(query: string, limit: number = 6): ResolvedLocation[] {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 1) return [];

  const results: ResolvedLocation[] = [];
  const seenIds = new Set<string>();

  // Priority 1: Exact or starts-with name match
  for (const loc of VERIFIED_LOCATIONS) {
    if (seenIds.has(loc.id)) continue;
    const locNorm = normalizeQuery(loc.name);
    if (locNorm.startsWith(normalized) || loc.id.toLowerCase() === normalized) {
      results.push(loc);
      seenIds.add(loc.id);
      if (results.length >= limit) return results;
    }
  }

  // Priority 2: Alias starts-with match
  for (const loc of VERIFIED_LOCATIONS) {
    if (seenIds.has(loc.id)) continue;
    const matchesAlias = loc.aliases?.some((alias) => normalizeQuery(alias).startsWith(normalized));
    if (matchesAlias) {
      results.push(loc);
      seenIds.add(loc.id);
      if (results.length >= limit) return results;
    }
  }

  // Priority 3: Substring match in name or aliases
  if (normalized.length >= 2) {
    for (const loc of VERIFIED_LOCATIONS) {
      if (seenIds.has(loc.id)) continue;
      const inName = normalizeQuery(loc.name).includes(normalized);
      const inAlias = loc.aliases?.some((alias) => normalizeQuery(alias).includes(normalized));
      if (inName || inAlias) {
        results.push(loc);
        seenIds.add(loc.id);
        if (results.length >= limit) return results;
      }
    }
  }

  return results;
}

/**
 * Remote fallback geocoder via OpenStreetMap Nominatim.
 * Wrapped with timeout, rate-limit defense, and caching.
 */
export async function geocodeLocation(
  query: string,
  signal?: AbortSignal
): Promise<ResolvedLocation | null> {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  // Check local registry first
  const local = resolveLocationLocally(query);
  if (local) return local;

  // Check cache
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized)!;
  }

  // Do not spam remote geocoder for very short queries
  if (normalized.length < 3) {
    return null;
  }

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SEISMIC-Earthquake-Dashboard/2.0',
      },
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      geocodeCache.set(normalized, null);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      geocodeCache.set(normalized, null);
      return null;
    }

    const item = data[0];
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    if (isNaN(lat) || isNaN(lon)) {
      geocodeCache.set(normalized, null);
      return null;
    }

    let boundingBox = {
      minlatitude: lat - 1.5,
      maxlatitude: lat + 1.5,
      minlongitude: lon - 1.5,
      maxlongitude: lon + 1.5,
    };

    if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
      boundingBox = {
        minlatitude: parseFloat(item.boundingbox[0]),
        maxlatitude: parseFloat(item.boundingbox[1]),
        minlongitude: parseFloat(item.boundingbox[2]),
        maxlongitude: parseFloat(item.boundingbox[3]),
      };
    }

    const resolved: ResolvedLocation = {
      id: `geo-${item.place_id || Math.random().toString(36).substring(2, 7)}`,
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      type: item.type === 'city' ? 'city' : item.type === 'administrative' ? 'region' : 'country',
      center: [lat, lon],
      bounds: boundingBox,
      zoom: item.type === 'city' ? 10 : 6,
    };

    geocodeCache.set(normalized, resolved);
    return resolved;
  } catch {
    // Network failure, rate limit or abort; gracefully return null
    geocodeCache.set(normalized, null);
    return null;
  }
}
