import React, { useState, useMemo, useCallback } from 'react';
import type { DashboardFilterState, EarthquakeEvent, ResolvedLocation } from './types/earthquake';
import { useEarthquakeData } from './hooks/useEarthquakeData';
import { calculateKpis, filterAndSortEvents, filterEventsByLocationOrRegion } from './utils/calculations';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { LocationDetailPanel } from './components/Location/LocationDetailPanel';
import { EarthquakeMap } from './components/Map/EarthquakeMap';
import { ChartsSection } from './components/Analytics/ChartsSection';
import { EventTable } from './components/EventTable/EventTable';
import { EventDetailPanel } from './components/EventDetails/EventDetailPanel';
import { ErrorBanner } from './components/Common/ErrorBanner';
import { ShieldCheck, Database } from 'lucide-react';

const AssignmentReportModal = React.lazy(() =>
  import('./components/AssignmentReportModal').then((m) => ({ default: m.AssignmentReportModal }))
);

const INITIAL_FILTER_STATE: DashboardFilterState = {
  region: 'global',
  selectedLocation: null,
  timePreset: '24h',
  customStartTime: '',
  customEndTime: '',
  minMagnitude: 2.5,
  maxMagnitude: 10.0,
  searchQuery: '',
  sortBy: 'newest',
  limit: 500,
  significantOnly: false,
};

export const App: React.FC = () => {
  const [filterState, setFilterState] = useState<DashboardFilterState>(INITIAL_FILTER_STATE);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Dedicated data hook managing USGS queries, caching, aborts, and polling
  const {
    events,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isStale,
    rawRequestUrl,
    pollingEnabled,
    setPollingEnabled,
    refresh,
  } = useEarthquakeData(filterState);

  // Geographic boundary pre-matched events within selected location or region
  const geoMatchedEvents = useMemo(() => {
    return filterEventsByLocationOrRegion(events, filterState.region, filterState.selectedLocation);
  }, [events, filterState.region, filterState.selectedLocation]);

  // Apply client-side filters (geographic boundary, text search, magnitude bounds, sorting, significant toggle)
  const filteredEvents = useMemo(() => {
    return filterAndSortEvents(
      events,
      filterState.searchQuery,
      filterState.minMagnitude,
      filterState.maxMagnitude,
      filterState.sortBy,
      filterState.significantOnly,
      filterState.region,
      filterState.selectedLocation
    );
  }, [
    events,
    filterState.searchQuery,
    filterState.minMagnitude,
    filterState.maxMagnitude,
    filterState.sortBy,
    filterState.significantOnly,
    filterState.region,
    filterState.selectedLocation,
  ]);

  // Number of valid-coordinate events plotted on the map
  const plottedCount = useMemo(() => {
    return filteredEvents.filter((e) => e.coordinates !== null).length;
  }, [filteredEvents]);

  // Compute dataset KPIs from currently filtered view for strict consistency across components
  const kpis = useMemo(() => calculateKpis(filteredEvents), [filteredEvents]);

  // Find currently selected event
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: EarthquakeEvent) => {
    setSelectedEventId(event.id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  // Next and Previous event navigation in detail drawer
  const selectedIndex = useMemo(() => {
    if (!selectedEventId) return -1;
    return filteredEvents.findIndex((e) => e.id === selectedEventId);
  }, [filteredEvents, selectedEventId]);

  const handleNextEvent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredEvents.length - 1) {
      setSelectedEventId(filteredEvents[selectedIndex + 1].id);
    }
  }, [selectedIndex, filteredEvents]);

  const handlePrevEvent = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedEventId(filteredEvents[selectedIndex - 1].id);
    }
  }, [selectedIndex, filteredEvents]);

  const handleFilterUpdate = useCallback((updates: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSelectLocation = useCallback((loc: ResolvedLocation | null) => {
    setFilterState((prev) => ({
      ...prev,
      selectedLocation: loc,
      region: loc?.id === 'IN' ? 'india' : loc ? 'global' : prev.region,
      searchQuery: loc ? loc.name : '',
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterState(INITIAL_FILTER_STATE);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isStale={isStale}
        error={error}
        pollingEnabled={pollingEnabled}
        onTogglePolling={() => setPollingEnabled(!pollingEnabled)}
        onRefresh={refresh}
        onOpenReport={() => setIsReportOpen(true)}
        totalLoaded={events.length}
        timePreset={filterState.timePreset}
        customStartTime={filterState.customStartTime}
        customEndTime={filterState.customEndTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error / Stale Notification Banner */}
        {error && (
          <ErrorBanner
            error={error}
            isStale={isStale}
            onRetry={refresh}
            isRetrying={isRefreshing}
          />
        )}

        {/* Key Performance Indicators */}
        <KpiCards kpis={kpis} isLoading={isLoading && events.length === 0} />

        {/* Interactive Filter Bar */}
        <FilterBar
          filterState={filterState}
          onFilterChange={handleFilterUpdate}
          onResetFilters={handleResetFilters}
          onSelectLocation={handleSelectLocation}
          apiCount={events.length}
          geoMatchCount={geoMatchedEvents.length}
          displayedCount={filteredEvents.length}
          plottedCount={plottedCount}
          isLoading={isLoading && events.length === 0}
        />

        {/* Location Detail Panel (Displayed when a country/region/city is selected) */}
        {filterState.selectedLocation && (
          <LocationDetailPanel
            location={filterState.selectedLocation}
            events={filteredEvents}
            timePreset={filterState.timePreset}
            minMagnitude={filterState.minMagnitude}
            maxMagnitude={filterState.maxMagnitude}
            onClearLocation={() => handleSelectLocation(null)}
            onSelectEvent={handleSelectEvent}
            onExpandDateRange={() => handleFilterUpdate({ timePreset: '30d' })}
            onLowerMinMagnitude={() => handleFilterUpdate({ minMagnitude: 1.0 })}
          />
        )}

        {/* Primary Interactive Map */}
        <EarthquakeMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          region={filterState.region}
          selectedLocation={filterState.selectedLocation}
        />

        {/* Analytics Section: Frequency Timeline & Magnitude Distribution */}
        <ChartsSection events={filteredEvents} />

        {/* Event Catalog Table */}
        <EventTable
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          currentSort={filterState.sortBy}
          onSortChange={(sort) => handleFilterUpdate({ sortBy: sort })}
        />
      </main>

      {/* Synchronized Event Telemetry Side Panel */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={handleCloseDetail}
          onNext={handleNextEvent}
          onPrev={handlePrevEvent}
          hasNext={selectedIndex < filteredEvents.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}

      {/* Assignment Report Modal (Code-split for performance) */}
      <React.Suspense fallback={null}>
        {isReportOpen && (
          <AssignmentReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            rawRequestUrl={rawRequestUrl}
            totalRecordsLoaded={events.length}
          />
        )}
      </React.Suspense>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090e1a] text-slate-400 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">SEISMIC Intelligence Dashboard</span>
            <span>&bull;</span>
            <span>Powered by official USGS FDSN Web Service</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a
              href="https://earthquake.usgs.gov/fdsnws/event/1/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>USGS API Documentation</span>
            </a>
            <span>&bull;</span>
            <span>Map tiles &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-cyan-400">OpenStreetMap</a> contributors</span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
            >
              View Verification Report
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
