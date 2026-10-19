import type { EarthquakeEvent, HourlyCountBucket, MagnitudeBinBucket } from '../types/earthquake';

/**
 * Generate time-bucketed counts for the seismic activity timeline.
 * Correctly handles UTC buckets and chronological ordering.
 */
export function generateTimelineData(
  events: EarthquakeEvent[],
  bucketHours: number = 1
): HourlyCountBucket[] {
  if (!events || events.length === 0) {
    return [];
  }

  // Find min and max timestamps
  const timestamps = events.map((e) => e.time).filter((t) => !isNaN(t) && t > 0);
  if (timestamps.length === 0) return [];

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  const bucketMs = bucketHours * 60 * 60 * 1000;
  // Align start to the nearest hour boundary
  const startBucket = Math.floor(minTime / bucketMs) * bucketMs;
  const endBucket = Math.ceil(maxTime / bucketMs) * bucketMs;

  const bucketsMap = new Map<number, { count: number; maxMag: number | null }>();

  // Initialize all buckets in range to prevent gaps
  // Limit to at most 72 buckets to prevent chart overcrowding
  const step = Math.max(1, Math.ceil((endBucket - startBucket) / (bucketMs * 48)));
  const effectiveBucketMs = bucketMs * step;

  for (let t = startBucket; t <= endBucket; t += effectiveBucketMs) {
    bucketsMap.set(t, { count: 0, maxMag: null });
  }

  // Populate counts
  for (const event of events) {
    const bucketTime = Math.floor(event.time / effectiveBucketMs) * effectiveBucketMs;
    const bucket = bucketsMap.get(bucketTime);
    if (bucket) {
      bucket.count += 1;
      if (event.magnitude !== null) {
        if (bucket.maxMag === null || event.magnitude > bucket.maxMag) {
          bucket.maxMag = event.magnitude;
        }
      }
    } else {
      // In case edge boundary falls outside
      bucketsMap.set(bucketTime, {
        count: 1,
        maxMag: event.magnitude,
      });
    }
  }

  const result: HourlyCountBucket[] = [];
  const sortedTimes = Array.from(bucketsMap.keys()).sort((a, b) => a - b);

  for (const time of sortedTimes) {
    const bucket = bucketsMap.get(time)!;
    const date = new Date(time);

    // Format UTC label (e.g., "14:00" or "Oct 19 14:00")
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
 */
export function generateMagnitudeDistribution(events: EarthquakeEvent[]): MagnitudeBinBucket[] {
  const bins: MagnitudeBinBucket[] = [
    { rangeLabel: 'M 2.5–3.4', minMag: 2.5, maxMag: 3.499, count: 0 },
    { rangeLabel: 'M 3.5–4.4', minMag: 3.5, maxMag: 4.499, count: 0 },
    { rangeLabel: 'M 4.5–5.4', minMag: 4.5, maxMag: 5.499, count: 0 },
    { rangeLabel: 'M 5.5–6.4', minMag: 5.5, maxMag: 6.499, count: 0 },
    { rangeLabel: 'M 6.5–7.4', minMag: 6.5, maxMag: 7.499, count: 0 },
    { rangeLabel: 'M 7.5+', minMag: 7.5, maxMag: 10.0, count: 0 },
  ];

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
