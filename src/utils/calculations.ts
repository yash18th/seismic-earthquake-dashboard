import type { EarthquakeEvent, DashboardKpis } from '../types/earthquake';
import { SIGNIFICANT_MAGNITUDE_THRESHOLD } from './formatters';

/**
 * Calculate KPI metrics from the currently loaded earthquake records.
 * 
 * Rules:
 * - Excludes missing, null, undefined, or NaN magnitudes from calculations.
 * - If no valid magnitudes exist, strongestMagnitude and averageMagnitude are null (rendered as "N/A", never 0).
 * - Explicit threshold: Significant events are defined as events with magnitude >= 4.5 (SEISMIC operational threshold).
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
 * Filter and sort earthquake events.
 */
export function filterAndSortEvents(
  events: EarthquakeEvent[],
  searchQuery: string,
  minMag: number,
  maxMag: number,
  sortBy: 'newest' | 'oldest' | 'strongest' | 'weakest',
  significantOnly: boolean = false,
  significantThreshold: number = SIGNIFICANT_MAGNITUDE_THRESHOLD
): EarthquakeEvent[] {
  const query = searchQuery.trim().toLowerCase();

  const filtered = events.filter((ev) => {
    // Client-side text search by place or title
    if (query) {
      const matchPlace = ev.place.toLowerCase().includes(query);
      const matchTitle = ev.title.toLowerCase().includes(query);
      const matchId = ev.id.toLowerCase().includes(query);
      if (!matchPlace && !matchTitle && !matchId) {
        return false;
      }
    }

    // Magnitude range check (exclude if defined and out of range)
    if (ev.magnitude !== null && ev.magnitude !== undefined) {
      if (ev.magnitude < minMag) return false;
      if (maxMag < 10 && ev.magnitude > maxMag) return false;
    }

    // Significant events filter toggle
    if (significantOnly) {
      if (ev.magnitude === null || ev.magnitude < significantThreshold) {
        return false;
      }
    }

    return true;
  });

  return sortEvents(filtered, sortBy);
}

/**
 * Sort earthquake events cleanly.
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
