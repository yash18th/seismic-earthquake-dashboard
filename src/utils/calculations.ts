import type { EarthquakeEvent, DashboardKpis, RegionPreset, ResolvedLocation } from '../types/earthquake';
import { SIGNIFICANT_MAGNITUDE_THRESHOLD } from './formatters';
import { isEventInRegion, isEventInLocation } from './geoBoundaries';

/**
 * Calculate KPI metrics from the currently filtered earthquake records.
 * 
 * Rules:
 * - Excludes missing, null, undefined, or NaN magnitudes from calculations.
 * - If no valid magnitudes exist, strongestMagnitude and averageMagnitude are null (rendered as "N/A", never 0).
 * - Explicit threshold: Significant events are defined as events with magnitude >= 4.5.
 * - Descriptive statistics only; does not predict future seismic events.
 */
export function calculateKpis(
  events: EarthquakeEvent[],
  significantThreshold: number = SIGNIFICANT_MAGNITUDE_THRESHOLD
): DashboardKpis {
  if (!events || events.length === 0) {
    return {
      totalCount: 0,
      strongestMagnitude: null,
      averageMagnitude: null,
      significantCount: 0,
      shallowCount: 0,
      tsunamiWarningCount: 0,
    };
  }

  let totalValidMagCount = 0;
  let magSum = 0;
  let maxMag: number | null = null;
  let significantCount = 0;
  let shallowCount = 0;
  let tsunamiWarningCount = 0;

  for (const event of events) {
    const mag = event.magnitude;

    if (mag !== null && mag !== undefined && !isNaN(mag)) {
      totalValidMagCount++;
      magSum += mag;

      if (maxMag === null || mag > maxMag) {
        maxMag = mag;
      }

      if (mag >= significantThreshold) {
        significantCount++;
      }
    }

    if (event.coordinates && event.coordinates.depthKm < 70) {
      shallowCount++;
    }

    if (event.tsunami) {
      tsunamiWarningCount++;
    }
  }

  const averageMagnitude =
    totalValidMagCount > 0
      ? Number((magSum / totalValidMagCount).toFixed(2))
      : null;

  return {
    totalCount: events.length,
    strongestMagnitude: maxMag !== null ? Number(maxMag.toFixed(2)) : null,
    averageMagnitude,
    significantCount,
    shallowCount,
    tsunamiWarningCount,
  };
}


/**
 * Filter events by geographic region boundary or selected resolved location.
 */
export function filterEventsByLocationOrRegion(
  events: EarthquakeEvent[],
  region: RegionPreset = 'global',
  selectedLocation?: ResolvedLocation | null
): EarthquakeEvent[] {
  if (selectedLocation) {
    return events.filter((ev) => isEventInLocation(ev, selectedLocation));
  }
  if (region === 'global') return events;
  return events.filter((ev) => isEventInRegion(ev, region));
}

/**
 * Filter events by geographic region boundary (backward compatible).
 */
export function filterEventsByRegion(
  events: EarthquakeEvent[],
  region: RegionPreset = 'global'
): EarthquakeEvent[] {
  return filterEventsByLocationOrRegion(events, region, null);
}

/**
 * Filter and sort earthquake events.
 * Correctly applies geographic boundary validation, query search, magnitude threshold, and origin-time sorting.
 */
export function filterAndSortEvents(
  events: EarthquakeEvent[],
  searchQuery: string,
  minMag: number,
  maxMag: number,
  sortBy: 'newest' | 'oldest' | 'strongest' | 'weakest',
  significantOnly: boolean = false,
  region: RegionPreset = 'global',
  selectedLocation?: ResolvedLocation | null,
  significantThreshold: number = SIGNIFICANT_MAGNITUDE_THRESHOLD
): EarthquakeEvent[] {
  const query = searchQuery.trim().toLowerCase();

  const filtered = events.filter((ev) => {
    // 1. Geographic boundary test (location or region)
    if (selectedLocation) {
      if (!isEventInLocation(ev, selectedLocation)) {
        return false;
      }
    } else if (!isEventInRegion(ev, region)) {
      return false;
    }

    // 2. Client-side text search (when query is not just the location name itself)
    if (query) {
      const isLocationName =
        selectedLocation &&
        (selectedLocation.name.toLowerCase() === query ||
          selectedLocation.id.toLowerCase() === query ||
          selectedLocation.aliases?.some((a) => a.toLowerCase() === query));

      if (!isLocationName) {
        const matchPlace = ev.place.toLowerCase().includes(query);
        const matchTitle = ev.title.toLowerCase().includes(query);
        const matchId = ev.id.toLowerCase().includes(query);
        if (!matchPlace && !matchTitle && !matchId) {
          return false;
        }
      }
    }

    // 3. Magnitude range check (exclude if defined and out of range)
    if (ev.magnitude !== null && ev.magnitude !== undefined) {
      if (ev.magnitude < minMag) return false;
      if (maxMag < 10 && ev.magnitude > maxMag) return false;
    }

    // 4. Significant events filter toggle
    if (significantOnly) {
      if (ev.magnitude === null || ev.magnitude < significantThreshold) {
        return false;
      }
    }

    return true;
  });

  return sortEvents(filtered, sortBy);
}

export interface LocationStats {
  totalCount: number;
  strongestEvent: EarthquakeEvent | null;
  mostRecentEvent: EarthquakeEvent | null;
  averageMagnitude: number | null;
}

/**
 * Calculates focused summary statistics for a selected location and filtered event set.
 */
export function calculateLocationStats(events: EarthquakeEvent[]): LocationStats {
  if (!events || events.length === 0) {
    return {
      totalCount: 0,
      strongestEvent: null,
      mostRecentEvent: null,
      averageMagnitude: null,
    };
  }

  let strongestEvent: EarthquakeEvent | null = null;
  let mostRecentEvent: EarthquakeEvent | null = null;
  let magSum = 0;
  let validMagCount = 0;

  for (const ev of events) {
    // Check most recent by origin time
    if (!mostRecentEvent || ev.time > mostRecentEvent.time) {
      mostRecentEvent = ev;
    }

    // Check strongest by magnitude
    if (ev.magnitude !== null && !isNaN(ev.magnitude)) {
      validMagCount++;
      magSum += ev.magnitude;

      if (!strongestEvent || ev.magnitude > (strongestEvent.magnitude ?? -Infinity)) {
        strongestEvent = ev;
      }
    }
  }

  const averageMagnitude =
    validMagCount > 0 ? Number((magSum / validMagCount).toFixed(2)) : null;

  return {
    totalCount: events.length,
    strongestEvent,
    mostRecentEvent,
    averageMagnitude,
  };
}

/**
 * Sort earthquake events cleanly using event origin time (not retrieval time).
 */
export function sortEvents(
  events: EarthquakeEvent[],
  sortBy: 'newest' | 'oldest' | 'strongest' | 'weakest'
): EarthquakeEvent[] {
  return [...events].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.time - a.time;
      case 'oldest':
        return a.time - b.time;
      case 'strongest': {
        const magA = a.magnitude ?? -999;
        const magB = b.magnitude ?? -999;
        return magB - magA;
      }
      case 'weakest': {
        const magA = a.magnitude ?? 999;
        const magB = b.magnitude ?? 999;
        return magA - magB;
      }
      default:
        return b.time - a.time;
    }
  });
}
