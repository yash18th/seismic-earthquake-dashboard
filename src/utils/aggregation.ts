import type { EarthquakeEvent, HourlyCountBucket, MagnitudeBinBucket } from '../types/earthquake';

/**
 * Generate time-bucketed counts for the seismic activity timeline.
 * Correctly handles UTC buckets, chronologically sorted, with invalid timestamp protection.
 */
export function generateTimelineData(
  events: EarthquakeEvent[],
  bucketHours: number = 1
): HourlyCountBucket[] {
  if (!events || events.length === 0) {
    return [];
  }

  // Filter valid positive timestamps
  const validEvents = events.filter((e) => typeof e.time === 'number' && !isNaN(e.time) && e.time > 0);
  if (validEvents.length === 0) return [];

  const timestamps = validEvents.map((e) => e.time);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  const bucketMs = bucketHours * 60 * 60 * 1000;
  // Align start to the nearest hour boundary
  const startBucket = Math.floor(minTime / bucketMs) * bucketMs;
  const endBucket = Math.ceil(maxTime / bucketMs) * bucketMs;

  const bucketsMap = new Map<number, { count: number; maxMag: number | null }>();

  // Initialize all buckets in range to prevent gaps (cap to at most 72 intervals)
  const step = Math.max(1, Math.ceil((endBucket - startBucket) / (bucketMs * 48)));
  const effectiveBucketMs = bucketMs * step;

  for (let t = startBucket; t <= endBucket; t += effectiveBucketMs) {
    bucketsMap.set(t, { count: 0, maxMag: null });
  }

  // Populate counts
  for (const event of validEvents) {
    const bucketTime = Math.floor(event.time / effectiveBucketMs) * effectiveBucketMs;
    const bucket = bucketsMap.get(bucketTime);
    if (bucket) {
      bucket.count += 1;
      if (event.magnitude !== null && !isNaN(event.magnitude)) {
        if (bucket.maxMag === null || event.magnitude > bucket.maxMag) {
          bucket.maxMag = event.magnitude;
        }
      }
    } else {
      bucketsMap.set(bucketTime, {
        count: 1,
        maxMag: event.magnitude !== null && !isNaN(event.magnitude) ? event.magnitude : null,
      });
    }
  }

  const result: HourlyCountBucket[] = [];
  const sortedTimes = Array.from(bucketsMap.keys()).sort((a, b) => a - b);

  for (const time of sortedTimes) {
    const bucket = bucketsMap.get(time)!;
    const date = new Date(time);

    // Format UTC label (e.g., "14:00" or "Oct 19")
    const hourLabel =
      effectiveBucketMs >= 24 * 3600 * 1000
        ? new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          }).format(date)
        : new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC',
          }).format(date);

    result.push({
      hourLabel,
      timestamp: time,
      count: bucket.count,
      maxMag: bucket.maxMag !== null ? Number(bucket.maxMag.toFixed(1)) : null,
    });
  }

  return result;
}

/**
 * Generate magnitude distribution histogram buckets.
 * Dynamically supports sub-2.5 microseisms when present in query results.
 * Excludes missing/null magnitudes from energy classification.
 */
export function generateMagnitudeDistribution(events: EarthquakeEvent[]): MagnitudeBinBucket[] {
  if (!events || events.length === 0) {
    return [];
  }

  const hasSub25 = events.some((e) => e.magnitude !== null && !isNaN(e.magnitude) && e.magnitude < 2.5);

  const bins: MagnitudeBinBucket[] = [];

  if (hasSub25) {
    bins.push({ rangeLabel: '< M 2.5', minMag: -Infinity, maxMag: 2.499, count: 0 });
  }

  bins.push(
    { rangeLabel: 'M 2.5–3.4', minMag: 2.5, maxMag: 3.499, count: 0 },
    { rangeLabel: 'M 3.5–4.4', minMag: 3.5, maxMag: 4.499, count: 0 },
    { rangeLabel: 'M 4.5–5.4', minMag: 4.5, maxMag: 5.499, count: 0 },
    { rangeLabel: 'M 5.5–6.4', minMag: 5.5, maxMag: 6.499, count: 0 },
    { rangeLabel: 'M 6.5–7.4', minMag: 6.5, maxMag: 7.499, count: 0 },
    { rangeLabel: 'M 7.5+', minMag: 7.5, maxMag: 100.0, count: 0 }
  );

  for (const ev of events) {
    if (ev.magnitude === null || isNaN(ev.magnitude)) continue;
    const mag = ev.magnitude;

    for (const bin of bins) {
      if (mag >= bin.minMag && mag <= bin.maxMag) {
        bin.count++;
        break;
      }
    }
  }

  return bins;
}
