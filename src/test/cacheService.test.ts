import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService, CACHE_FRESH_DURATION_MS } from '../services/cacheService';
import type { EarthquakeEvent } from '../types/earthquake';

const mockEvent: EarthquakeEvent = {
  id: 'cache_test_1',
  title: 'M 4.5 - Test Location',
  place: 'Test Location',
  magnitude: 4.5,
  magType: 'ml',
  time: 1729350000000,
  updatedTime: null,
  coordinates: {
    longitude: 100.0,
    latitude: 10.0,
    depthKm: 15.0,
  },
  url: 'https://earthquake.usgs.gov/mock',
  status: 'reviewed',
  tsunami: false,
  significanceScore: 300,
  alert: null,
  feltReports: 5,
  mmi: 3.2,
  isSignificant: true,
};

describe('cacheService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates consistent deterministic cache keys regardless of param ordering', () => {
    const key1 = cacheService.generateKey({ a: 1, b: 2, c: 'test' });
    const key2 = cacheService.generateKey({ c: 'test', a: 1, b: 2 });
    expect(key1).toBe(key2);
  });

  it('omits undefined and empty query parameters from cache key', () => {
    const key1 = cacheService.generateKey({ a: 1, b: undefined, c: null, d: '' });
    const key2 = cacheService.generateKey({ a: 1 });
    expect(key1).toBe(key2);
  });

  it('stores and retrieves cached data by exact paramsKey', () => {
    const key = 'test_key_1';
    cacheService.set(key, {
      events: [mockEvent],
      totalFeatures: 1,
      rawRequestUrl: 'https://test.usgs.gov',
    });

    const retrieved = cacheService.get(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.events.length).toBe(1);
    expect(retrieved?.events[0].id).toBe('cache_test_1');
    expect(retrieved?.totalFeatures).toBe(1);
  });

  it('provides getLatest() fallback for 0ms cold hydration', () => {
    const key = 'query_abc';
    cacheService.set(key, {
      events: [mockEvent],
      totalFeatures: 1,
      rawRequestUrl: 'https://test.usgs.gov',
    });

    const latest = cacheService.getLatest();
    expect(latest).not.toBeNull();
    expect(latest?.events[0].id).toBe('cache_test_1');
  });

  it('correctly determines whether cached data is stale or fresh', () => {
    const freshTimestamp = Date.now() - 1000; // 1s ago
    const staleTimestamp = Date.now() - (CACHE_FRESH_DURATION_MS + 5000); // 2m 5s ago

    expect(cacheService.isCacheStale(freshTimestamp)).toBe(false);
    expect(cacheService.isCacheStale(staleTimestamp)).toBe(true);
  });

  it('handles localStorage throwing errors gracefully via in-memory cache', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const key = 'memory_fallback_key';
    cacheService.set(key, {
      events: [mockEvent],
      totalFeatures: 1,
      rawRequestUrl: 'https://test.usgs.gov',
    });

    const retrieved = cacheService.get(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.events[0].id).toBe('cache_test_1');

    spy.mockRestore();
  });
});
