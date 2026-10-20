import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  EarthquakeEvent,
  UsgsQueryParams,
  DashboardFilterState,
} from '../types/earthquake';
import { fetchEarthquakesFromUsgs, calculateTimeWindow } from '../services/usgsApi';
import { getRegionBoundingBox } from '../utils/geoBoundaries';
import { cacheService } from '../services/cacheService';

export interface UseEarthquakeDataReturn {
  events: EarthquakeEvent[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
  rawRequestUrl: string | null;
  totalApiFeaturesCount: number;
  pollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
  refresh: () => Promise<void>;
}

const POLLING_INTERVAL_MS = 60 * 1000; // 60 seconds

export function useEarthquakeData(filterState: DashboardFilterState): UseEarthquakeDataReturn {
  // Synchronous cache hydration on mount for instant (0ms) interface display
  const initialCache = cacheService.getLatest();

  const [events, setEvents] = useState<EarthquakeEvent[]>(() =>
    initialCache ? initialCache.events : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialCache);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(() => Boolean(initialCache));
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() =>
    initialCache ? new Date(initialCache.timestamp) : null
  );
  const [isStale, setIsStale] = useState<boolean>(() =>
    initialCache ? cacheService.isCacheStale(initialCache.timestamp) : false
  );
  const [rawRequestUrl, setRawRequestUrl] = useState<string | null>(() =>
    initialCache ? initialCache.rawRequestUrl : null
  );
  const [totalApiFeaturesCount, setTotalApiFeaturesCount] = useState<number>(() =>
    initialCache ? initialCache.totalFeatures : 0
  );
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(false);

  // Keep track of active AbortController to cancel stale/superseded requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Keep track of in-flight requests to prevent duplicate overlapping fetches
  const inFlightRef = useRef<boolean>(false);
  // Monotonically increasing request ID to guard against StrictMode and async race conditions
  const requestIdRef = useRef<number>(0);

  // Build current query params based on filter state
  const buildCurrentQueryParams = useCallback((): UsgsQueryParams => {
    const timeWindow = calculateTimeWindow(
      filterState.timePreset,
      filterState.customStartTime,
      filterState.customEndTime
    );

    // If a specific country/region/city is selected, use its geographic bounding box
    const bbox = filterState.selectedLocation
      ? filterState.selectedLocation.bounds
      : getRegionBoundingBox(filterState.region);

    return {
      format: 'geojson',
      starttime: timeWindow.starttime,
      endtime: timeWindow.endtime,
      minmagnitude: filterState.minMagnitude,
      maxmagnitude: filterState.maxMagnitude < 10 ? filterState.maxMagnitude : undefined,
      minlatitude: bbox?.minlatitude,
      maxlatitude: bbox?.maxlatitude,
      minlongitude: bbox?.minlongitude,
      maxlongitude: bbox?.maxlongitude,
      limit: filterState.limit,
      orderby: 'time',
    };
  }, [
    filterState.selectedLocation,
    filterState.region,
    filterState.timePreset,
    filterState.customStartTime,
    filterState.customEndTime,
    filterState.minMagnitude,
    filterState.maxMagnitude,
    filterState.limit,
  ]);

  const loadData = useCallback(
    async (isManualRefresh: boolean = false) => {
      // Abort any existing active network request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentRequestId = ++requestIdRef.current;
      inFlightRef.current = true;

      const params = buildCurrentQueryParams();
      const paramsKey = cacheService.generateKey(params as unknown as Record<string, unknown>);

      // Check if we have cached data for these exact parameters
      const cached = cacheService.get(paramsKey);
      if (cached) {
        // Hydrate from cache immediately
        setEvents(cached.events);
        setTotalApiFeaturesCount(cached.totalFeatures);
        setRawRequestUrl(cached.rawRequestUrl);
        setLastUpdated(new Date(cached.timestamp));
        setIsStale(cacheService.isCacheStale(cached.timestamp));
        setIsLoading(false);

        // If the cache is fresh (< 2 mins) and not a manual refresh, do not hit network
        if (!isManualRefresh && !cacheService.isCacheStale(cached.timestamp)) {
          setIsRefreshing(false);
          inFlightRef.current = false;
          return;
        }
      }

      // If we already have events on screen (from cache or previous query), do background refresh
      setEvents((currentEvents) => {
        if (currentEvents.length > 0 || cached) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        return currentEvents;
      });

      try {
        const { events: fetchedEvents, rawResponse, requestUrl } =
          await fetchEarthquakesFromUsgs(params, controller.signal);

        // Discard superseded requests
        if (currentRequestId !== requestIdRef.current) return;

        // Persist to local & memory cache
        cacheService.set(paramsKey, {
          events: fetchedEvents,
          totalFeatures: rawResponse.features.length,
          rawRequestUrl: requestUrl,
        });

        // Update state with fresh data
        setEvents(fetchedEvents);
        setTotalApiFeaturesCount(rawResponse.features.length);
        setRawRequestUrl(requestUrl);
        setLastUpdated(new Date());
        setError(null);
        setIsStale(false);
      } catch (err: unknown) {
        // If aborted by user or superseded by newer request, quietly exit
        if (currentRequestId !== requestIdRef.current) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown network failure occurred.';
        setError(errorMessage);

        // PRESERVE previously loaded valid data, but mark it as stale
        setEvents((prev) => {
          if (prev.length > 0) {
            setIsStale(true);
            return prev;
          }
          return [];
        });
      } finally {
        if (currentRequestId === requestIdRef.current) {
          inFlightRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [buildCurrentQueryParams]
  );

  // Trigger data load when server-side filter params change
  useEffect(() => {
    const fetchData = async () => {
      await loadData(false);
    };

    void fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Handle periodic polling when enabled
  useEffect(() => {
    if (!pollingEnabled) return;

    const intervalId = setInterval(() => {
      if (!inFlightRef.current) {
        loadData(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingEnabled, loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isStale,
    rawRequestUrl,
    totalApiFeaturesCount,
    pollingEnabled,
    setPollingEnabled,
    refresh,
  };
}
