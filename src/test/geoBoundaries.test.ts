import { describe, it, expect } from 'vitest';
import {
  isEventInIndia,
  isEventInAsia,
  isEventInRegion,
  getRegionBoundingBox,
  getRegionViewport,
} from '../utils/geoBoundaries';
import { filterAndSortEvents, calculateKpis } from '../utils/calculations';
import type { EarthquakeEvent } from '../types/earthquake';

const createMockGeoEvent = (
  id: string,
  place: string,
  lat: number | null,
  lon: number | null,
  mag: number | null = 4.0,
  time: number = 1729300000000
): EarthquakeEvent => ({
  id,
  title: `M ${mag ?? 'N/A'} - ${place}`,
  place,
  magnitude: mag,
  magType: 'ml',
  time,
  updatedTime: time + 1000,
  coordinates:
    lat !== null && lon !== null
      ? {
          latitude: lat,
          longitude: lon,
          depthKm: 15,
        }
      : null,
  url: `https://earthquake.usgs.gov/${id}`,
  status: 'reviewed',
  tsunami: false,
  significanceScore: 250,
  alert: null,
  feltReports: null,
  mmi: null,
  isSignificant: mag !== null && mag >= 4.5,
});

describe('Geographic Boundary Accuracy — India Boundary Tests', () => {
  it('correctly includes events within mainland India', () => {
    const delhiEvent = createMockGeoEvent('delhi', 'New Delhi, India', 28.6139, 77.209, 3.8);
    const mumbaiEvent = createMockGeoEvent('mumbai', 'Mumbai region, Maharashtra', 19.076, 72.8777, 4.1);
    const kutchEvent = createMockGeoEvent('kutch', 'Rann of Kutch, Gujarat', 23.5, 70.3, 5.2);
    const assamEvent = createMockGeoEvent('assam', 'Guwahati, Assam', 26.2, 92.9, 4.7);

    expect(isEventInIndia(delhiEvent)).toBe(true);
    expect(isEventInIndia(mumbaiEvent)).toBe(true);
    expect(isEventInIndia(kutchEvent)).toBe(true);
    expect(isEventInIndia(assamEvent)).toBe(true);
  });

  it('correctly includes island territories (Andaman & Nicobar, Lakshadweep)', () => {
    const portBlair = createMockGeoEvent('andaman', 'Port Blair, Andaman Islands', 11.6234, 92.7265, 4.9);
    const carNicobar = createMockGeoEvent('nicobar', 'Car Nicobar, India', 9.15, 92.8, 5.1);
    const lakshadweep = createMockGeoEvent('lakshadweep', 'Kavaratti, Lakshadweep', 10.5669, 72.642, 3.5);

    expect(isEventInIndia(portBlair)).toBe(true);
    expect(isEventInIndia(carNicobar)).toBe(true);
    expect(isEventInIndia(lakshadweep)).toBe(true);
  });

  it('strictly excludes events whose place description contains "India" but coordinates are outside India', () => {
    // Classic false positive: Mid-Indian Ridge is in the southern Indian Ocean
    const midIndianRidge1 = createMockGeoEvent(
      'mir1',
      'Mid-Indian Ridge',
      -38.2,
      78.4,
      5.8
    );
    const midIndianRidge2 = createMockGeoEvent(
      'mir2',
      'Central Indian Ridge',
      -10.5,
      68.2,
      5.0
    );
    const southIndianOcean = createMockGeoEvent(
      'sio',
      'South Indian Ocean, near Prince Edward Islands',
      -45.0,
      60.0,
      6.2
    );

    expect(isEventInIndia(midIndianRidge1)).toBe(false);
    expect(isEventInIndia(midIndianRidge2)).toBe(false);
    expect(isEventInIndia(southIndianOcean)).toBe(false);
  });

  it('excludes neighboring countries outside India boundary', () => {
    const nepal = createMockGeoEvent('nepal', 'Kathmandu, Nepal', 27.7172, 85.324, 4.8);
    const pakistan = createMockGeoEvent('pakistan', 'Islamabad, Pakistan', 33.6844, 73.0479, 4.2);
    const tibet = createMockGeoEvent('tibet', 'Lhasa, Tibet', 29.6525, 91.1721, 5.0);
    const srilanka = createMockGeoEvent('srilanka', 'Colombo, Sri Lanka', 6.9271, 79.8612, 3.9);
    const myanmar = createMockGeoEvent('myanmar', 'Mandalay, Myanmar', 21.9588, 96.0891, 5.3);

    expect(isEventInIndia(nepal)).toBe(false);
    expect(isEventInIndia(pakistan)).toBe(false);
    expect(isEventInIndia(tibet)).toBe(false);
    expect(isEventInIndia(srilanka)).toBe(false);
    expect(isEventInIndia(myanmar)).toBe(false);
  });
});

describe('Geographic Boundary Accuracy — Asia Continental Tests', () => {
  it('correctly includes major subregions of Asia (East, South, Southeast, Central, West)', () => {
    const tokyo = createMockGeoEvent('tokyo', 'Near east coast of Honshu, Japan', 35.6762, 139.6503);
    const jakarta = createMockGeoEvent('jakarta', 'Java, Indonesia', -6.2088, 106.8456);
    const tehran = createMockGeoEvent('tehran', 'Tehran, Iran', 35.6892, 51.389);
    const ankara = createMockGeoEvent('ankara', 'Central Turkey', 39.9334, 32.8597);
    const tashkent = createMockGeoEvent('tashkent', 'Uzbekistan', 41.2995, 69.2401);
    const delhi = createMockGeoEvent('delhi', 'New Delhi, India', 28.6139, 77.209);
    const manila = createMockGeoEvent('manila', 'Luzon, Philippines', 14.5995, 120.9842);

    expect(isEventInAsia(tokyo)).toBe(true);
    expect(isEventInAsia(jakarta)).toBe(true);
    expect(isEventInAsia(tehran)).toBe(true);
    expect(isEventInAsia(ankara)).toBe(true);
    expect(isEventInAsia(tashkent)).toBe(true);
    expect(isEventInAsia(delhi)).toBe(true);
    expect(isEventInAsia(manila)).toBe(true);
  });

  it('correctly excludes non-Asian regions', () => {
    const california = createMockGeoEvent('cali', 'Central California, USA', 36.5, -120.0);
    const iceland = createMockGeoEvent('ice', 'Reykjanes Ridge, Iceland', 64.1, -21.9);
    const chile = createMockGeoEvent('chile', 'Near coast of Central Chile', -33.4, -70.6);
    const australia = createMockGeoEvent('aus', 'New South Wales, Australia', -33.8, 151.2);
    const london = createMockGeoEvent('uk', 'Southern England, UK', 51.5, -0.1);
    const midIndianRidge = createMockGeoEvent('mir', 'Mid-Indian Ridge', -38.2, 78.4);

    expect(isEventInAsia(california)).toBe(false);
    expect(isEventInAsia(iceland)).toBe(false);
    expect(isEventInAsia(chile)).toBe(false);
    expect(isEventInAsia(australia)).toBe(false);
    expect(isEventInAsia(london)).toBe(false);
    expect(isEventInAsia(midIndianRidge)).toBe(false);
  });
});

describe('Coordinate Handling and Edge Cases', () => {
  it('returns false for events with null or missing coordinates in regional queries', () => {
    const missingCoords = createMockGeoEvent('missing', 'Unknown fault', null, null);
    expect(isEventInIndia(missingCoords)).toBe(false);
    expect(isEventInAsia(missingCoords)).toBe(false);
    expect(isEventInRegion(missingCoords, 'india')).toBe(false);
    expect(isEventInRegion(missingCoords, 'asia')).toBe(false);
    // Global includes events with or without coordinates in list view
    expect(isEventInRegion(missingCoords, 'global')).toBe(true);
  });

  it('returns false for events with NaN coordinate values', () => {
    const nanCoords: EarthquakeEvent = {
      ...createMockGeoEvent('nan', 'Fault', 0, 0),
      coordinates: { latitude: NaN, longitude: 77.2, depthKm: 10 },
    };
    expect(isEventInIndia(nanCoords)).toBe(false);
    expect(isEventInAsia(nanCoords)).toBe(false);
  });

  it('provides appropriate USGS API bounding boxes for candidate reduction', () => {
    const indiaBbox = getRegionBoundingBox('india');
    expect(indiaBbox).not.toBeNull();
    expect(indiaBbox!.minlatitude).toBe(6.0);
    expect(indiaBbox!.maxlatitude).toBe(37.5);
    expect(indiaBbox!.minlongitude).toBe(68.0);
    expect(indiaBbox!.maxlongitude).toBe(97.5);

    const asiaBbox = getRegionBoundingBox('asia');
    expect(asiaBbox).not.toBeNull();
    expect(asiaBbox!.minlatitude).toBe(-12.0);
    expect(asiaBbox!.maxlatitude).toBe(82.0);

    const globalBbox = getRegionBoundingBox('global');
    expect(globalBbox).toBeNull();
  });

  it('provides predefined region viewports', () => {
    expect(getRegionViewport('india').zoom).toBe(5);
    expect(getRegionViewport('asia').zoom).toBe(3);
    expect(getRegionViewport('global').zoom).toBe(2);
  });
});

describe('Regional KPI and Filter Consistency', () => {
  const mixedDataset: EarthquakeEvent[] = [
    createMockGeoEvent('e_delhi', 'New Delhi, India', 28.6, 77.2, 4.2),
    createMockGeoEvent('e_kutch', 'Gujarat, India', 23.5, 70.3, 5.6),
    createMockGeoEvent('e_tokyo', 'Tokyo, Japan', 35.7, 139.7, 6.1),
    createMockGeoEvent('e_mir', 'Mid-Indian Ridge', -38.0, 78.0, 5.0),
    createMockGeoEvent('e_cali', 'Southern California', 34.0, -118.0, 3.2),
  ];

  it('filters dataset strictly when region is set to India', () => {
    const indiaEvents = filterAndSortEvents(
      mixedDataset,
      '',
      1.0,
      10.0,
      'newest',
      false,
      'india'
    );
    // Only Delhi and Kutch should match
    expect(indiaEvents.length).toBe(2);
    expect(indiaEvents.map((e) => e.id)).toEqual(['e_delhi', 'e_kutch']);

    // KPI consistency on India events
    const kpis = calculateKpis(indiaEvents);
    expect(kpis.totalCount).toBe(2);
    expect(kpis.strongestMagnitude).toBe(5.6);
    expect(kpis.averageMagnitude).toBe(4.9); // (4.2 + 5.6) / 2 = 4.90
    expect(kpis.significantCount).toBe(1); // 5.6 >= 4.5
  });

  it('filters dataset strictly when region is set to Asia', () => {
    const asiaEvents = filterAndSortEvents(
      mixedDataset,
      '',
      1.0,
      10.0,
      'newest',
      false,
      'asia'
    );
    // Delhi, Kutch, and Tokyo are in Asia. Mid-Indian Ridge (-38° S) and California are not.
    expect(asiaEvents.length).toBe(3);
    expect(asiaEvents.map((e) => e.id).sort()).toEqual(['e_delhi', 'e_kutch', 'e_tokyo']);

    const kpis = calculateKpis(asiaEvents);
    expect(kpis.totalCount).toBe(3);
    expect(kpis.strongestMagnitude).toBe(6.1);
    expect(kpis.significantCount).toBe(2); // 5.6 and 6.1 >= 4.5
  });

  it('handles empty results cleanly without displaying fake events', () => {
    const emptyIndia = filterAndSortEvents(
      [createMockGeoEvent('e_cali', 'California', 34.0, -118.0, 4.0)],
      '',
      1.0,
      10.0,
      'newest',
      false,
      'india'
    );
    expect(emptyIndia.length).toBe(0);

    const kpis = calculateKpis(emptyIndia);
    expect(kpis.totalCount).toBe(0);
    expect(kpis.strongestMagnitude).toBeNull();
    expect(kpis.averageMagnitude).toBeNull();
    expect(kpis.significantCount).toBe(0);
  });
});
