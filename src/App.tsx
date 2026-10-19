import React, { useState, useMemo, useCallback } from 'react';
import type { DashboardFilterState, EarthquakeEvent } from './types/earthquake';
import { useEarthquakeData } from './hooks/useEarthquakeData';
import { calculateKpis, filterAndSortEvents } from './utils/calculations';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { EarthquakeMap } from './components/Map/EarthquakeMap';
import { ChartsSection } from './components/Analytics/ChartsSection';
import { EventTable } from './components/EventTable/EventTable';
import { EventDetailPanel } from './components/EventDetails/EventDetailPanel';
import { ErrorBanner } from './components/Common/ErrorBanner';
import { AssignmentReportModal } from './components/AssignmentReportModal';
import { ShieldCheck, Database } from 'lucide-react';

const INITIAL_FILTER_STATE: DashboardFilterState = {
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

  // Compute overall dataset KPIs from currently loaded valid events
  const kpis = useMemo(() => calculateKpis(events), [events]);

  // Apply client-side filters (text search by place/title, sorting, significant only toggle)
  const filteredEvents = useMemo(() => {
    return filterAndSortEvents(
      events,
      filterState.searchQuery,
      filterState.minMagnitude,
      filterState.maxMagnitude,
      filterState.sortBy,
      filterState.significantOnly
    );
  }, [
    events,
    filterState.searchQuery,
    filterState.minMagnitude,
    filterState.maxMagnitude,
    filterState.sortBy,
    filterState.significantOnly,
  ]);

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
          totalLoaded={events.length}
          filteredCount={filteredEvents.length}
          isLoading={isLoading}
        />

        {/* Primary Interactive Map */}
        <EarthquakeMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          isLoading={isLoading}
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

      {/* Assignment Report Modal */}
      <AssignmentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        rawRequestUrl={rawRequestUrl}
        totalRecordsLoaded={events.length}
      />

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
            <span>Map tiles &copy; OpenStreetMap contributors &copy; CARTO</span>
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
