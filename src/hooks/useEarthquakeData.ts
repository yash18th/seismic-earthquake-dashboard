import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  EarthquakeEvent,
  UsgsQueryParams,
  DashboardFilterState,
} from '../types/earthquake';
import { fetchEarthquakesFromUsgs, calculateTimeWindow } from '../services/usgsApi';

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
  const [events, setEvents] = useState<EarthquakeEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [rawRequestUrl, setRawRequestUrl] = useState<string | null>(null);
  const [totalApiFeaturesCount, setTotalApiFeaturesCount] = useState<number>(0);
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(false);

  // Keep track of active AbortController to cancel stale/superseded requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Keep track of in-flight requests to prevent duplicate overlapping fetches
  const inFlightRef = useRef<boolean>(false);

  // Build current query params based on filter state
  const buildCurrentQueryParams = useCallback((): UsgsQueryParams => {
    const timeWindow = calculateTimeWindow(
      filterState.timePreset,
      filterState.customStartTime,
      filterState.customEndTime
    );

    return {
      format: 'geojson',
      starttime: timeWindow.starttime,
      endtime: timeWindow.endtime,
      minmagnitude: filterState.minMagnitude,
      maxmagnitude: filterState.maxMagnitude < 10 ? filterState.maxMagnitude : undefined,
      limit: filterState.limit,
      orderby: 'time',
    };
  }, [
    filterState.timePreset,
    filterState.customStartTime,
    filterState.customEndTime,
    filterState.minMagnitude,
    filterState.maxMagnitude,
    filterState.limit,
  ]);

  const loadData = useCallback(
    async (isManualRefresh: boolean = false) => {
      // If an existing request is active, cancel it before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      inFlightRef.current = true;
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const params = buildCurrentQueryParams();

      try {
        const { events: fetchedEvents, rawResponse, requestUrl } =
          await fetchEarthquakesFromUsgs(params, controller.signal);

        // Success: update data and mark not stale
        setEvents(fetchedEvents);
        setTotalApiFeaturesCount(rawResponse.features.length);
        setRawRequestUrl(requestUrl);
        setLastUpdated(new Date());
        setError(null);
        setIsStale(false);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Request was aborted by newer request; do not update error state
          return;
        }

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
        inFlightRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [buildCurrentQueryParams]
  );

  // Trigger data load when server-side filter params change
  useEffect(() => {
    loadData(false);

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
