import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KpiCards } from '../components/KpiCards';
import { Header } from '../components/Header';
import { EventTable } from '../components/EventTable/EventTable';
import { EventDetailPanel } from '../components/EventDetails/EventDetailPanel';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import type { EarthquakeEvent, DashboardKpis } from '../types/earthquake';

const mockEvent: EarthquakeEvent = {
  id: 'us6000test_component',
  title: 'M 5.8 - 45 km E of Sendai, Japan',
  place: '45 km E of Sendai, Japan',
  magnitude: 5.8,
  magType: 'mww',
  time: 1729350000000,
  updatedTime: 1729355000000,
  coordinates: {
    longitude: 141.25,
    latitude: 38.35,
    depthKm: 42.0,
  },
  url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000test_component',
  status: 'reviewed',
  tsunami: true,
  significanceScore: 512,
  alert: 'green',
  feltReports: 140,
  mmi: 4.8,
  isSignificant: true,
};

describe('Dashboard Component Unit Tests', () => {
  describe('KpiCards', () => {
    it('renders KPI numbers accurately with significant event indicator', () => {
      const kpis: DashboardKpis = {
        totalCount: 142,
        strongestMagnitude: 6.4,
        averageMagnitude: 3.82,
        significantCount: 18,
        shallowCount: 110,
        tsunamiWarningCount: 2,
      };

      render(<KpiCards kpis={kpis} isLoading={false} />);

      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('M 6.4')).toBeInTheDocument();
      expect(screen.getByText('M 3.82')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('M ≥ 4.5')).toBeInTheDocument();
    });

    it('displays N/A for peak and average magnitude when data is unavailable', () => {
      const emptyKpis: DashboardKpis = {
        totalCount: 0,
        strongestMagnitude: null,
        averageMagnitude: null,
        significantCount: 0,
        shallowCount: 0,
        tsunamiWarningCount: 0,
      };

      render(<KpiCards kpis={emptyKpis} isLoading={false} />);
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Header', () => {
    it('renders SEISMIC branding and handles manual refresh clicks', () => {
      const handleRefresh = vi.fn();
      const handleTogglePoll = vi.fn();
      const handleOpenReport = vi.fn();

      render(
        <Header
          lastUpdated={new Date(1729350000000)}
          isLoading={false}
          isRefreshing={false}
          isStale={false}
          error={null}
          pollingEnabled={false}
          onTogglePolling={handleTogglePoll}
          onRefresh={handleRefresh}
          onOpenReport={handleOpenReport}
          totalLoaded={50}
        />
      );

      expect(screen.getByText('SEISMIC')).toBeInTheDocument();
      expect(screen.getByText(/USGS FDSN Online/)).toBeInTheDocument();

      const refreshBtn = screen.getByRole('button', { name: /Manually refresh earthquake data/i });
      fireEvent.click(refreshBtn);
      expect(handleRefresh).toHaveBeenCalledTimes(1);

      const reportBtn = screen.getByTitle(/Open 1-Page Assignment/i);
      fireEvent.click(reportBtn);
      expect(handleOpenReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('EventTable', () => {
    it('renders event list and triggers onSelectEvent on row click', () => {
      const handleSelect = vi.fn();
      const handleSort = vi.fn();

      render(
        <EventTable
          events={[mockEvent]}
          selectedEvent={null}
          onSelectEvent={handleSelect}
          currentSort="newest"
          onSortChange={handleSort}
        />
      );

      expect(screen.getByText('45 km E of Sendai, Japan')).toBeInTheDocument();
      expect(screen.getByText('M 5.8')).toBeInTheDocument();

      const detailsBtn = screen.getByRole('button', { name: 'Details' });
      fireEvent.click(detailsBtn);
      expect(handleSelect).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('EventDetailPanel', () => {
    it('renders comprehensive telemetry details and handles close and clipboard', () => {
      const handleClose = vi.fn();

      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(<EventDetailPanel event={mockEvent} onClose={handleClose} />);

      expect(screen.getByText('45 km E of Sendai, Japan')).toBeInTheDocument();
      expect(screen.getAllByText(/5.8/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('us6000test_component')).toBeInTheDocument();

      const copyBtn = screen.getByRole('button', { name: /Copy ID/i });
      fireEvent.click(copyBtn);
      expect(writeTextMock).toHaveBeenCalledWith('us6000test_component');

      const closeBtn = screen.getByRole('button', { name: /Close event telemetry panel/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorBanner', () => {
    it('renders error message and retry button when error occurs', () => {
      const handleRetry = vi.fn();

      render(
        <ErrorBanner
          error="Network failure connecting to USGS API"
          isStale={true}
          onRetry={handleRetry}
          isRetrying={false}
        />
      );

      expect(screen.getByText(/USGS Sync Warning/i)).toBeInTheDocument();
      expect(screen.getByText('Network failure connecting to USGS API')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
