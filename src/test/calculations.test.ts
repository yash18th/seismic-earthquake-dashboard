import { describe, it, expect } from 'vitest';
import { calculateKpis, filterAndSortEvents, sortEvents } from '../utils/calculations';
import type { EarthquakeEvent } from '../types/earthquake';

const createMockEvent = (
  id: string,
  mag: number | null,
  place: string,
  time: number,
  depthKm: number = 10,
  tsunami: boolean = false
): EarthquakeEvent => ({
  id,
  title: `M ${mag ?? 'N/A'} - ${place}`,
  place,
  magnitude: mag,
  magType: 'ml',
  time,
  updatedTime: time + 5000,
  coordinates: {
    longitude: 100,
    latitude: 0,
    depthKm,
  },
  url: `https://earthquake.usgs.gov/${id}`,
  status: 'reviewed',
  tsunami,
  significanceScore: 200,
  alert: null,
  feltReports: 5,
  mmi: null,
  isSignificant: mag !== null && mag >= 4.5,
});

describe('Seismic KPI Calculations & Statistical Engineering', () => {
  it('returns safe null and zero KPIs when event list is empty', () => {
    const kpis = calculateKpis([]);
    expect(kpis.totalCount).toBe(0);
    expect(kpis.strongestMagnitude).toBeNull();
    expect(kpis.averageMagnitude).toBeNull();
    expect(kpis.significantCount).toBe(0);
    expect(kpis.shallowCount).toBe(0);
    expect(kpis.tsunamiWarningCount).toBe(0);
  });

  it('accurately computes total, max, average, and significant count for valid events', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('1', 3.0, 'Japan', 1000, 15),
      createMockEvent('2', 5.0, 'Fiji', 2000, 120),
      createMockEvent('3', 4.0, 'Chile', 3000, 25),
    ];

    const kpis = calculateKpis(events);
    expect(kpis.totalCount).toBe(3);
    expect(kpis.strongestMagnitude).toBe(5.0);
    expect(kpis.averageMagnitude).toBe(4.0); // (3.0 + 5.0 + 4.0) / 3 = 4.0
    expect(kpis.significantCount).toBe(1); // M 5.0 >= 4.5
    expect(kpis.shallowCount).toBe(2); // depth 15 and 25 < 70
    expect(kpis.tsunamiWarningCount).toBe(0);
  });

  it('excludes null and NaN magnitudes from average and max calculations', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('1', null, 'Uncalculated Fault', 1000),
      createMockEvent('2', 6.2, 'Indonesia', 2000, 30, true),
      createMockEvent('3', 3.8, 'Alaska', 3000, 50),
    ];

    const kpis = calculateKpis(events);
    expect(kpis.totalCount).toBe(3);
    expect(kpis.strongestMagnitude).toBe(6.2);
    // Average should only divide by 2 valid items: (6.2 + 3.8) / 2 = 5.0
    expect(kpis.averageMagnitude).toBe(5.0);
    expect(kpis.significantCount).toBe(1);
    expect(kpis.tsunamiWarningCount).toBe(1);
  });

  it('returns null for peak and average when all events have null magnitude', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('1', null, 'Zone A', 1000),
      createMockEvent('2', null, 'Zone B', 2000),
    ];

    const kpis = calculateKpis(events);
    expect(kpis.totalCount).toBe(2);
    expect(kpis.strongestMagnitude).toBeNull();
    expect(kpis.averageMagnitude).toBeNull();
    expect(kpis.significantCount).toBe(0);
  });

  it('correctly classifies negative depths (volcano/mountain summits) as shallow earthquakes (< 70km)', () => {
    const events: EarthquakeEvent[] = [
      createMockEvent('1', 3.1, 'Mauna Loa Summit', 1000, -1.8),
      createMockEvent('2', 4.5, 'Mount St Helens Crater', 2000, -0.4),
      createMockEvent('3', 5.0, 'Deep Trench', 3000, 350),
    ];

    const kpis = calculateKpis(events);
    expect(kpis.totalCount).toBe(3);
    // Both -1.8 and -0.4 are < 70 km, so shallowCount should be 2
    expect(kpis.shallowCount).toBe(2);
  });
});

describe('Filtering and Sorting Logic', () => {
  const dataset: EarthquakeEvent[] = [
    createMockEvent('e1', 2.8, 'Southern California, USA', 1000),
    createMockEvent('e2', 5.6, 'Near coast of Central Chile', 4000),
    createMockEvent('e3', 4.7, 'Honshu, Japan', 3000),
    createMockEvent('e4', 3.5, 'Northern California, USA', 2000),
  ];

  it('filters events by text search on place/region case-insensitively', () => {
    const caliResults = filterAndSortEvents(dataset, 'california', 1.0, 10.0, 'newest');
    expect(caliResults.length).toBe(2);
    expect(caliResults.map((e) => e.id)).toEqual(['e4', 'e1']); // e4 is newer (2000 > 1000)

    const japanResults = filterAndSortEvents(dataset, 'JAPAN', 1.0, 10.0, 'newest');
    expect(japanResults.length).toBe(1);
    expect(japanResults[0].id).toBe('e3');
  });

  it('filters by magnitude thresholds', () => {
    const min45Results = filterAndSortEvents(dataset, '', 4.5, 10.0, 'newest');
    expect(min45Results.length).toBe(2);
    expect(min45Results.map((e) => e.id)).toEqual(['e2', 'e3']);
  });

  it('filters by significant only toggle (M >= 4.5)', () => {
    const sigResults = filterAndSortEvents(dataset, '', 1.0, 10.0, 'newest', true);
    expect(sigResults.length).toBe(2);
    expect(sigResults.every((e) => (e.magnitude ?? 0) >= 4.5)).toBe(true);
  });

  it('sorts correctly: newest, oldest, strongest, weakest', () => {
    const strongest = sortEvents(dataset, 'strongest');
    expect(strongest.map((e) => e.id)).toEqual(['e2', 'e3', 'e4', 'e1']);

    const weakest = sortEvents(dataset, 'weakest');
    expect(weakest.map((e) => e.id)).toEqual(['e1', 'e4', 'e3', 'e2']);

    const newest = sortEvents(dataset, 'newest');
    expect(newest.map((e) => e.id)).toEqual(['e2', 'e3', 'e4', 'e1']);

    const oldest = sortEvents(dataset, 'oldest');
    expect(oldest.map((e) => e.id)).toEqual(['e1', 'e4', 'e3', 'e2']);
  });
});
