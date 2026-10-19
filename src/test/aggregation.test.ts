import { describe, it, expect } from 'vitest';
import { generateTimelineData, generateMagnitudeDistribution } from '../utils/aggregation';
import type { EarthquakeEvent } from '../types/earthquake';

const createMockEvent = (
  id: string,
  mag: number | null,
  time: number,
  place: string = 'Test Location'
): EarthquakeEvent => ({
  id,
  title: `M ${mag ?? 'N/A'} - ${place}`,
  place,
  magnitude: mag,
  magType: 'ml',
  time,
  updatedTime: time + 1000,
  coordinates: {
    longitude: 130,
    latitude: 35,
    depthKm: 10,
  },
  url: `https://earthquake.usgs.gov/${id}`,
  status: 'reviewed',
  tsunami: false,
  significanceScore: 100,
  alert: null,
  feltReports: null,
  mmi: null,
  isSignificant: mag !== null && mag >= 4.5,
});

describe('Aggregation Utility - Timeline Data Generation', () => {
  it('returns an empty array when event list is empty or null', () => {
    expect(generateTimelineData([])).toEqual([]);
    expect(generateTimelineData(null as unknown as EarthquakeEvent[])).toEqual([]);
  });

  it('filters out events with invalid or non-positive timestamps', () => {
    const invalidEvents = [
      createMockEvent('inv1', 3.0, NaN),
      createMockEvent('inv2', 4.0, -100),
      createMockEvent('inv3', 5.0, 0),
    ];
    expect(generateTimelineData(invalidEvents)).toEqual([]);
  });

  it('generates chronologically continuous buckets with correct counts and max magnitudes', () => {
    // 3 hours spread: T, T + 1h, T + 2h
    const baseTime = 1729300000000; // aligned in ms
    const events: EarthquakeEvent[] = [
      createMockEvent('e1', 3.2, baseTime),
      createMockEvent('e2', 5.1, baseTime + 10 * 60 * 1000), // same bucket as e1 if bucket >= 1h
      createMockEvent('e3', 2.8, baseTime + 3600 * 1000 + 5000), // next hour
      createMockEvent('e4', null, baseTime + 3600 * 1000 + 10000), // next hour, null mag
    ];

    const timeline = generateTimelineData(events, 1);
    expect(timeline.length).toBeGreaterThanOrEqual(2);

    // First bucket has 2 events, max mag should be 5.1
    expect(timeline[0].count).toBe(2);
    expect(timeline[0].maxMag).toBe(5.1);

    // Second bucket has 2 events (one with mag 2.8, one with null), max mag should be 2.8
    expect(timeline[1].count).toBe(2);
    expect(timeline[1].maxMag).toBe(2.8);

    // Verify chronological order
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].timestamp).toBeGreaterThan(timeline[i - 1].timestamp);
    }
  });

  it('handles events spanning multiple days with daily date formatting', () => {
    const dayMs = 24 * 3600 * 1000;
    const baseTime = 1729000000000;
    const events = [
      createMockEvent('d1', 4.0, baseTime),
      createMockEvent('d2', 4.5, baseTime + dayMs * 3),
    ];

    const timeline = generateTimelineData(events, 24);
    expect(timeline.length).toBeGreaterThanOrEqual(4);
    // Intermediate buckets should have count 0
    const zeroBuckets = timeline.filter((b) => b.count === 0);
    expect(zeroBuckets.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Aggregation Utility - Magnitude Distribution Histogram', () => {
  it('returns empty array when events array is empty', () => {
    expect(generateMagnitudeDistribution([])).toEqual([]);
  });

  it('populates standard magnitude bins correctly and excludes null/NaN magnitudes', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('1', 2.5, 1000), // M 2.5–3.4
      createMockEvent('2', 3.4, 1000), // M 2.5–3.4
      createMockEvent('3', 3.5, 1000), // M 3.5–4.4
      createMockEvent('4', 4.5, 1000), // M 4.5–5.4
      createMockEvent('5', 5.5, 1000), // M 5.5–6.4
      createMockEvent('6', 6.8, 1000), // M 6.5–7.4
      createMockEvent('7', 7.9, 1000), // M 7.5+
      createMockEvent('8', null, 1000), // excluded
      createMockEvent('9', NaN, 1000),  // excluded
    ];

    const bins = generateMagnitudeDistribution(events);
    // Since no event is < 2.5, only the standard 6 bins are returned
    expect(bins.length).toBe(6);

    const bin25 = bins.find((b) => b.rangeLabel === 'M 2.5–3.4');
    expect(bin25?.count).toBe(2);

    const bin35 = bins.find((b) => b.rangeLabel === 'M 3.5–4.4');
    expect(bin35?.count).toBe(1);

    const bin45 = bins.find((b) => b.rangeLabel === 'M 4.5–5.4');
    expect(bin45?.count).toBe(1);

    const bin55 = bins.find((b) => b.rangeLabel === 'M 5.5–6.4');
    expect(bin55?.count).toBe(1);

    const bin65 = bins.find((b) => b.rangeLabel === 'M 6.5–7.4');
    expect(bin65?.count).toBe(1);

    const bin75 = bins.find((b) => b.rangeLabel === 'M 7.5+');
    expect(bin75?.count).toBe(1);
  });

  it('dynamically prepends an "< M 2.5" bin when microseisms exist in the dataset', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('micro1', 1.2, 1000),
      createMockEvent('micro2', 2.1, 1000),
      createMockEvent('normal1', 4.0, 1000),
    ];

    const bins = generateMagnitudeDistribution(events);
    expect(bins.length).toBe(7);
    expect(bins[0].rangeLabel).toBe('< M 2.5');
    expect(bins[0].count).toBe(2);

    const bin35 = bins.find((b) => b.rangeLabel === 'M 3.5–4.4');
    expect(bin35?.count).toBe(1);
  });
});
