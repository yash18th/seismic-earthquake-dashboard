import type { EarthquakeEvent } from '../types/earthquake';

export interface CachedEarthquakeData {
  timestamp: number;
  paramsKey: string;
  events: EarthquakeEvent[];
  totalFeatures: number;
  rawRequestUrl: string;
}

const CACHE_PREFIX = 'seismic_cache_v1_';
const LATEST_CACHE_KEY = 'seismic_cache_latest';

// Fresh for 2 minutes; preserved as stale-while-revalidate for up to 24 hours
export const CACHE_FRESH_DURATION_MS = 2 * 60 * 1000; // 2 minutes
export const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

class CacheService {
  private inMemoryFallback = new Map<string, CachedEarthquakeData>();

  /**
   * Generates a deterministic cache key from query parameters.
   */
  public generateKey(params: Record<string, unknown>): string {
    const sortedKeys = Object.keys(params).sort();
    const normalized: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        normalized[k] = params[k];
      }
    }
    return JSON.stringify(normalized);
  }

  /**
   * Checks whether a cache entry is considered stale (> 2 minutes old).
   */
  public isCacheStale(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_FRESH_DURATION_MS;
  }

  /**
   * Retrieves cached earthquake data for a specific query key.
   */
  public get(paramsKey: string): CachedEarthquakeData | null {
    try {
      const storageKey = CACHE_PREFIX + paramsKey;
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(storageKey);
      }

      if (!raw) {
        const mem = this.inMemoryFallback.get(storageKey);
        if (mem && Date.now() - mem.timestamp < CACHE_MAX_AGE_MS) {
          return mem;
        }
        return null;
      }

      const parsed: CachedEarthquakeData = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
        this.remove(paramsKey);
        return null;
      }

      return parsed;
    } catch {
      return this.inMemoryFallback.get(CACHE_PREFIX + paramsKey) || null;
    }
  }

  /**
   * Retrieves the latest cached earthquake dataset regardless of exact query key.
   * Enables instant UI hydration (0ms) on initial website visit.
   */
  public getLatest(): CachedEarthquakeData | null {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(LATEST_CACHE_KEY);
      }

      if (!raw) {
        return this.inMemoryFallback.get(LATEST_CACHE_KEY) || null;
      }

      const parsed: CachedEarthquakeData = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
        return null;
      }

      return parsed;
    } catch {
      return this.inMemoryFallback.get(LATEST_CACHE_KEY) || null;
    }
  }

  /**
   * Saves successfully fetched earthquake data to persistent and in-memory cache.
   */
  public set(
    paramsKey: string,
    data: {
      events: EarthquakeEvent[];
      totalFeatures: number;
      rawRequestUrl: string;
    }
  ): void {
    const entry: CachedEarthquakeData = {
      timestamp: Date.now(),
      paramsKey,
      events: data.events,
      totalFeatures: data.totalFeatures,
      rawRequestUrl: data.rawRequestUrl,
    };

    const storageKey = CACHE_PREFIX + paramsKey;

    try {
      this.inMemoryFallback.set(storageKey, entry);
      this.inMemoryFallback.set(LATEST_CACHE_KEY, entry);

      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = JSON.stringify(entry);
        window.localStorage.setItem(storageKey, serialized);
        window.localStorage.setItem(LATEST_CACHE_KEY, serialized);
      }
    } catch (err) {
      // Handle quota exceeded or private browsing restrictions gracefully
      console.warn('Cache write to localStorage failed, using in-memory cache:', err);
    }
  }

  /**
   * Removes a specific cache entry.
   */
  public remove(paramsKey: string): void {
    const storageKey = CACHE_PREFIX + paramsKey;
    this.inMemoryFallback.delete(storageKey);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export const cacheService = new CacheService();
