/**
 * Utility functions for formatting earthquake data, timestamps, coordinates, and metrics.
 */

export const SIGNIFICANT_MAGNITUDE_THRESHOLD = 4.5;

/**
 * Format magnitude value safely. Excludes missing/invalid numbers.
 * Displays "N/A" for null, undefined, or NaN as required.
 */
export function formatMagnitude(mag: number | null | undefined, precision: number = 1): string {
  if (mag === null || mag === undefined || isNaN(mag)) {
    return 'N/A';
  }
  return mag.toFixed(precision);
}

/**
 * Format depth in kilometers.
 */
export function formatDepth(depthKm: number | null | undefined): string {
  if (depthKm === null || depthKm === undefined || isNaN(depthKm)) {
    return 'N/A';
  }
  return `${depthKm.toFixed(1)} km`;
}

/**
 * Format geographic coordinates to standard N/S, E/W notation.
 */
export function formatCoordinates(lat: number | null | undefined, lon: number | null | undefined): string {
  if (lat === null || lat === undefined || lon === null || lon === undefined || isNaN(lat) || isNaN(lon)) {
    return 'N/A';
  }

  const latDirection = lat >= 0 ? 'N' : 'S';
  const lonDirection = lon >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(4)}° ${latDirection}, ${Math.abs(lon).toFixed(4)}° ${lonDirection}`;
}

/**
 * Format epoch millisecond timestamp to readable UTC string.
 * Example: "Oct 19, 2026, 13:26:01 UTC"
 */
export function formatUtcDateTime(timestamp: number | null | undefined): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'N/A';
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date) + ' UTC';
  } catch {
    return 'N/A';
  }
}

/**
 * Format epoch millisecond timestamp to ISO string.
 */
export function formatIsoUtc(timestamp: number | null | undefined): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'N/A';
  }
  try {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? 'N/A' : d.toISOString();
  } catch {
    return 'N/A';
  }
}

/**
 * Return relative time string (e.g., "12 minutes ago", "3 hours ago").
 */
export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'N/A';
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Just now';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

/**
 * Determine severity color token based on magnitude.
 */
export function getMagnitudeColor(mag: number | null | undefined): {
  bg: string;
  text: string;
  border: string;
  hex: string;
  label: string;
} {
  if (mag === null || mag === undefined || isNaN(mag)) {
    return {
      bg: 'bg-slate-800/80',
      text: 'text-slate-400',
      border: 'border-slate-700',
      hex: '#94a3b8',
      label: 'Unknown',
    };
  }

  if (mag < 3.0) {
    return {
      bg: 'bg-sky-950/70',
      text: 'text-sky-400',
      border: 'border-sky-800/60',
      hex: '#38bdf8',
      label: 'Minor (<3.0)',
    };
  }

  if (mag < 4.5) {
    return {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-700/60',
      hex: '#fbbf24',
      label: 'Moderate (3.0–4.4)',
    };
  }

  if (mag < 6.0) {
    return {
      bg: 'bg-orange-950/70',
      text: 'text-orange-400',
      border: 'border-orange-700/60',
      hex: '#fb923c',
      label: 'Strong (4.5–5.9)',
    };
  }

  return {
    bg: 'bg-rose-950/80',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
    hex: '#f43f5e',
    label: 'Major (≥6.0)',
  };
}

/**
 * Depth categorization and colors.
 */
export function getDepthCategory(depthKm: number | null | undefined): {
  label: string;
  colorHex: string;
  badgeClass: string;
} {
  if (depthKm === null || depthKm === undefined || isNaN(depthKm)) {
    return { label: 'Unknown', colorHex: '#64748b', badgeClass: 'text-slate-400 bg-slate-900 border-slate-700' };
  }

  if (depthKm < 70) {
    return { label: 'Shallow (<70 km)', colorHex: '#38bdf8', badgeClass: 'text-sky-300 bg-sky-950/50 border-sky-800/50' };
  }
  if (depthKm < 300) {
    return { label: 'Intermediate (70–300 km)', colorHex: '#a855f7', badgeClass: 'text-purple-300 bg-purple-950/50 border-purple-800/50' };
  }
  return { label: 'Deep (>300 km)', colorHex: '#ec4899', badgeClass: 'text-pink-300 bg-pink-950/50 border-pink-800/50' };
}
