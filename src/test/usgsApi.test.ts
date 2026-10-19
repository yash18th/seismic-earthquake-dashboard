import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildUsgsApiUrl,
  calculateTimeWindow,
  validateGeoJsonResponse,
  normalizeUsgsFeature,
  fetchEarthquakesFromUsgs,
  USGS_API_BASE_URL,
} from '../services/usgsApi';
import type { UsgsGeoJsonFeature } from '../types/earthquake';

describe('USGS API Service & Normalization', () => {
  describe('buildUsgsApiUrl', () => {
    it('constructs correct base URL with default format=geojson', () => {
      const urlString = buildUsgsApiUrl({ format: 'geojson' });
      const url = new URL(urlString);
      expect(url.origin + url.pathname).toBe(USGS_API_BASE_URL);
      expect(url.searchParams.get('format')).toBe('geojson');
    });

    it('sets starttime, endtime, minmagnitude, maxmagnitude, limit, and orderby properly', () => {
      const urlString = buildUsgsApiUrl({
        format: 'geojson',
        starttime: '2026-10-18T00:00:00.000Z',
        endtime: '2026-10-19T00:00:00.000Z',
        minmagnitude: 3.5,
        maxmagnitude: 7.0,
        limit: 250,
        orderby: 'magnitude',
      });

      const url = new URL(urlString);
      expect(url.searchParams.get('format')).toBe('geojson');
      expect(url.searchParams.get('starttime')).toBe('2026-10-18T00:00:00.000Z');
      expect(url.searchParams.get('endtime')).toBe('2026-10-19T00:00:00.000Z');
      expect(url.searchParams.get('minmagnitude')).toBe('3.5');
      expect(url.searchParams.get('maxmagnitude')).toBe('7');
      expect(url.searchParams.get('limit')).toBe('250');
      expect(url.searchParams.get('orderby')).toBe('magnitude');
    });

    it('omits maxmagnitude when set to 10 (upper bound)', () => {
      const urlString = buildUsgsApiUrl({
        format: 'geojson',
        minmagnitude: 2.5,
        maxmagnitude: 10,
      });

      const url = new URL(urlString);
      expect(url.searchParams.has('maxmagnitude')).toBe(false);
    });

    it('serializes geographic bounding box parameters (minlatitude, maxlatitude, minlongitude, maxlongitude)', () => {
      const urlString = buildUsgsApiUrl({
        format: 'geojson',
        minlatitude: 6.0,
        maxlatitude: 37.5,
        minlongitude: 68.0,
        maxlongitude: 97.5,
      });

      const url = new URL(urlString);
      expect(url.searchParams.get('minlatitude')).toBe('6');
      expect(url.searchParams.get('maxlatitude')).toBe('37.5');
      expect(url.searchParams.get('minlongitude')).toBe('68');
      expect(url.searchParams.get('maxlongitude')).toBe('97.5');
    });
  });

  describe('calculateTimeWindow', () => {
    it('calculates 1h window correctly', () => {
      const { starttime, endtime } = calculateTimeWindow('1h');
      const startMs = new Date(starttime).getTime();
      const endMs = new Date(endtime).getTime();
      const diffHours = (endMs - startMs) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(1);
    });

    it('calculates 24h window correctly', () => {
      const { starttime, endtime } = calculateTimeWindow('24h');
      const startMs = new Date(starttime).getTime();
      const endMs = new Date(endtime).getTime();
      const diffHours = (endMs - startMs) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(24);
    });

    it('calculates 7d window correctly', () => {
      const { starttime, endtime } = calculateTimeWindow('7d');
      const startMs = new Date(starttime).getTime();
      const endMs = new Date(endtime).getTime();
      const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });

    it('handles valid custom time window', () => {
      const customStart = '2026-10-01T00:00:00.000Z';
      const customEnd = '2026-10-05T00:00:00.000Z';
      const { starttime, endtime } = calculateTimeWindow('custom', customStart, customEnd);
      expect(starttime).toBe(customStart);
      expect(endtime).toBe(customEnd);
    });

    it('falls back to default 24h when custom dates are invalid', () => {
      const { starttime, endtime } = calculateTimeWindow('custom', 'invalid-date', '');
      const startMs = new Date(starttime).getTime();
      const endMs = new Date(endtime).getTime();
      const diffHours = (endMs - startMs) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(24);
    });
  });

  describe('validateGeoJsonResponse', () => {
    it('throws when payload is not an object', () => {
      expect(() => validateGeoJsonResponse(null)).toThrow('Malformed API response');
      expect(() => validateGeoJsonResponse('string')).toThrow('Malformed API response');
    });

    it('throws when type is not FeatureCollection', () => {
      expect(() => validateGeoJsonResponse({ type: 'Feature' })).toThrow('Invalid GeoJSON type');
    });

    it('throws when features array is missing', () => {
      expect(() => validateGeoJsonResponse({ type: 'FeatureCollection' })).toThrow('"features" field is missing');
    });

    it('returns validated object when structure is compliant', () => {
      const valid = {
        type: 'FeatureCollection',
        metadata: { generated: 123456, url: '', title: 'Test', status: 200, api: '1.0' },
        features: [],
      };
      expect(validateGeoJsonResponse(valid)).toBe(valid);
    });
  });

  describe('normalizeUsgsFeature', () => {
    it('correctly maps GeoJSON [longitude, latitude, depth] to coordinates object', () => {
      const rawFeature: UsgsGeoJsonFeature = {
        type: 'Feature',
        id: 'us6000test1',
        properties: {
          mag: 5.4,
          place: '12 km SSW of Hualien City, Taiwan',
          time: 1729300000000,
          updated: 1729305000000,
          tz: null,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000test1',
          felt: 42,
          cdi: 4.5,
          mmi: 5.1,
          alert: 'green',
          status: 'reviewed',
          tsunami: 0,
          sig: 450,
          net: 'us',
          code: '6000test1',
          ids: ',us6000test1,',
          sources: ',us,',
          types: ',origin,',
          nst: 50,
          dmin: 1.2,
          rms: 0.8,
          gap: 45,
          magType: 'mww',
          type: 'earthquake',
          title: 'M 5.4 - 12 km SSW of Hualien City, Taiwan',
        },
        geometry: {
          type: 'Point',
          coordinates: [121.5678, 23.8912, 18.5], // lon, lat, depth
        },
      };

      const normalized = normalizeUsgsFeature(rawFeature);
      expect(normalized).not.toBeNull();
      expect(normalized!.id).toBe('us6000test1');
      expect(normalized!.magnitude).toBe(5.4);
      expect(normalized!.place).toBe('12 km SSW of Hualien City, Taiwan');
      expect(normalized!.coordinates).toEqual({
        longitude: 121.5678,
        latitude: 23.8912,
        depthKm: 18.5,
      });
      expect(normalized!.tsunami).toBe(false);
      expect(normalized!.isSignificant).toBe(true); // >= 4.5
      expect(normalized!.alert).toBe('green');
    });

    it('correctly preserves authentic negative depths (above sea level seismic origins)', () => {
      const rawFeature = {
        type: 'Feature',
        id: 'us_mountain_quake',
        properties: {
          mag: 2.7,
          place: 'Mauna Kea Summit, HI',
          time: 1729300000000,
          updated: 1729305000000,
          url: '',
          title: 'M 2.7 - Mauna Kea Summit, HI',
        },
        geometry: {
          type: 'Point',
          coordinates: [-155.468, 19.820, -1.346],
        },
      } as unknown as UsgsGeoJsonFeature;

      const normalized = normalizeUsgsFeature(rawFeature);
      expect(normalized).not.toBeNull();
      expect(normalized!.coordinates?.depthKm).toBe(-1.35); // rounded to 2 decimal places, preserving negative
    });

    it('handles missing/null coordinates and magnitude gracefully without throwing', () => {
      const rawFeature = {
        type: 'Feature',
        id: 'us_missing_props',
        properties: {
          mag: null,
          place: null,
          time: null,
          title: null,
        },
        geometry: null,
      };

      const normalized = normalizeUsgsFeature(rawFeature);
      expect(normalized).not.toBeNull();
      expect(normalized!.magnitude).toBeNull();
      expect(normalized!.place).toBe('Unknown Location');
      expect(normalized!.coordinates).toBeNull();
      expect(normalized!.isSignificant).toBe(false);
    });
  });

  describe('fetchEarthquakesFromUsgs network mocking', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fetches and returns normalized events upon HTTP 200', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        metadata: { generated: 1729000000000, url: '', title: 'USGS', status: 200, api: '1.0' },
        features: [
          {
            type: 'Feature',
            id: 'mock1',
            properties: {
              mag: 4.2,
              place: 'Central California',
              time: 1729000000000,
              updated: 1729000100000,
              url: 'https://earthquake.usgs.gov/mock1',
              status: 'reviewed',
              tsunami: 0,
              sig: 270,
              magType: 'ml',
              title: 'M 4.2 - Central California',
            },
            geometry: {
              type: 'Point',
              coordinates: [-120.5, 36.2, 8.4],
            },
          },
        ],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      });

      const result = await fetchEarthquakesFromUsgs({ format: 'geojson', minmagnitude: 2.5 });
      expect(result.events.length).toBe(1);
      expect(result.events[0].id).toBe('mock1');
      expect(result.events[0].magnitude).toBe(4.2);
      expect(result.events[0].coordinates?.latitude).toBe(36.2);
      expect(result.events[0].coordinates?.longitude).toBe(-120.5);
    });

    it('throws descriptive error on HTTP 503', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'USGS Server Busy',
      });

      await expect(
        fetchEarthquakesFromUsgs({ format: 'geojson', minmagnitude: 2.5 })
      ).rejects.toThrow('USGS API returned HTTP 503');
    });

    it('handles network disconnection/fetch failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(
        fetchEarthquakesFromUsgs({ format: 'geojson' })
      ).rejects.toThrow('Network failure connecting to USGS API');
    });
  });
});
