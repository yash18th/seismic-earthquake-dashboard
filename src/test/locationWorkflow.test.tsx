import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationDetailPanel } from '../components/Location/LocationDetailPanel';
import { resolveLocationLocally } from '../services/locationService';
import { filterAndSortEvents, calculateLocationStats } from '../utils/calculations';
import { isEventInLocation } from '../utils/geoBoundaries';
import type { EarthquakeEvent } from '../types/earthquake';

const createMockEvent = (
  id: string,
  mag: number | null,
  place: string,
  time: number,
  lat: number,
  lon: number,
  depthKm: number = 10
): EarthquakeEvent => ({
  id,
  title: `M ${mag ?? 'N/A'} - ${place}`,
  place,
  magnitude: mag,
  magType: 'mw',
  time,
  updatedTime: time + 1000,
  coordinates: {
    latitude: lat,
    longitude: lon,
    depthKm,
  },
  url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
  status: 'reviewed',
  tsunami: false,
  significanceScore: 250,
  alert: null,
  feltReports: 10,
  mmi: null,
  isSignificant: mag !== null && mag >= 4.5,
});

describe('Location Workflow & Location-Aware Filtering', () => {
  const ukLocation = resolveLocationLocally('UK')!;
  const usaLocation = resolveLocationLocally('USA')!;
  const indonesiaLocation = resolveLocationLocally('Indonesia')!;
  const indiaLocation = resolveLocationLocally('India')!;

  describe('Boundary Inclusion & Exclusion for Resolved Locations', () => {
    it('accurately includes UK events and excludes events in France or Atlantic', () => {
      const scottishEvent = createMockEvent('uk-1', 2.1, '3 km SSE of Fort William, UK', 1000, 56.8, -5.1);
      const frenchEvent = createMockEvent('fr-1', 3.0, 'Paris, France', 2000, 48.8, 2.3);
      const atlanticEvent = createMockEvent('atl-1', 4.5, 'Northern Mid-Atlantic Ridge', 3000, 30.0, -40.0);

      expect(isEventInLocation(scottishEvent, ukLocation)).toBe(true);
      expect(isEventInLocation(frenchEvent, ukLocation)).toBe(false);
      expect(isEventInLocation(atlanticEvent, ukLocation)).toBe(false);
    });

    it('accurately includes USA events and excludes events in Mexico or Canada', () => {
      const calEvent = createMockEvent('us-1', 3.5, '10 km NW of Los Angeles, California', 1000, 34.05, -118.25);
      const alaskaEvent = createMockEvent('us-2', 5.1, 'Fox Islands, Aleutian Islands, Alaska', 2000, 52.0, -169.0);
      const mexicoEvent = createMockEvent('mx-1', 6.0, 'Oaxaca, Mexico', 3000, 16.5, -96.5);
      const canadaEvent = createMockEvent('ca-1', 2.5, 'Vancouver, Canada', 4000, 49.28, -123.12);

      expect(isEventInLocation(calEvent, usaLocation)).toBe(true);
      expect(isEventInLocation(alaskaEvent, usaLocation)).toBe(true);
      expect(isEventInLocation(mexicoEvent, usaLocation)).toBe(false);
      expect(isEventInLocation(canadaEvent, usaLocation)).toBe(false);
    });

    it('accurately includes Indonesia events across the archipelago and excludes Australia', () => {
      const sumatraEvent = createMockEvent('id-1', 5.4, 'Southern Sumatra, Indonesia', 1000, -4.5, 102.5);
      const bandaSeaEvent = createMockEvent('id-2', 6.1, 'Banda Sea, Indonesia', 2000, -6.5, 129.5);
      const australiaEvent = createMockEvent('au-1', 3.8, 'Northern Territory, Australia', 3000, -20.0, 133.0);

      expect(isEventInLocation(sumatraEvent, indonesiaLocation)).toBe(true);
      expect(isEventInLocation(bandaSeaEvent, indonesiaLocation)).toBe(true);
      expect(isEventInLocation(australiaEvent, indonesiaLocation)).toBe(false);
    });

    it('accurately excludes Mid-Indian Ridge from India', () => {
      const delhiEvent = createMockEvent('in-1', 3.2, 'Delhi region, India', 1000, 28.6, 77.2);
      const midIndianRidge = createMockEvent('ridge-1', 5.8, 'Central Mid-Indian Ridge', 2000, -34.5, 78.2);

      expect(isEventInLocation(delhiEvent, indiaLocation)).toBe(true);
      expect(isEventInLocation(midIndianRidge, indiaLocation)).toBe(false);
    });
  });

  describe('Location Detail Panel — Zero-Result State & Next Actions', () => {
    it('renders clear zero-result message when a country has 0 matching events', () => {
      const handleClear = vi.fn();
      const handleExpand = vi.fn();
      const handleLower = vi.fn();

      render(
        <LocationDetailPanel
          location={ukLocation}
          events={[]}
          timePreset="24h"
          minMagnitude={2.5}
          maxMagnitude={10.0}
          onClearLocation={handleClear}
          onSelectEvent={vi.fn()}
          onExpandDateRange={handleExpand}
          onLowerMinMagnitude={handleLower}
        />
      );

      // Verifies exact message required by prompt
      expect(
        screen.getByText(/No recorded earthquakes match your current filters in United Kingdom during the selected period/i)
      ).toBeInTheDocument();

      // Verifies actionable recommendations
      const expandBtn = screen.getByRole('button', { name: /Expand Date Range to Past 30 Days/i });
      expect(expandBtn).toBeInTheDocument();
      fireEvent.click(expandBtn);
      expect(handleExpand).toHaveBeenCalledTimes(1);

      const lowerBtn = screen.getByRole('button', { name: /Lower Minimum Magnitude to M 1.0\+/i });
      expect(lowerBtn).toBeInTheDocument();
      fireEvent.click(lowerBtn);
      expect(handleLower).toHaveBeenCalledTimes(1);
    });

    it('renders event list and computed KPIs when location events are present', () => {
      const events: EarthquakeEvent[] = [
        createMockEvent('id-1', 4.8, 'Java, Indonesia', 1000, -7.0, 110.0),
        createMockEvent('id-2', 6.2, 'Banda Sea, Indonesia', 5000, -6.5, 129.5),
      ];

      const handleSelectEvent = vi.fn();

      render(
        <LocationDetailPanel
          location={indonesiaLocation}
          events={events}
          timePreset="24h"
          minMagnitude={2.5}
          maxMagnitude={10.0}
          onClearLocation={vi.fn()}
          onSelectEvent={handleSelectEvent}
        />
      );

      // Verified location name and count
      expect(screen.getByText('Indonesia')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // total matching count
      expect(screen.getAllByText(/6.2/).length).toBeGreaterThanOrEqual(1); // strongest event
      expect(screen.getByText('M 5.50')).toBeInTheDocument(); // (4.8 + 6.2) / 2 = 5.50 average

      // Clicking an event triggers selection
      const eventItem = screen.getByText('Java, Indonesia');
      fireEvent.click(eventItem);
      expect(handleSelectEvent).toHaveBeenCalledWith(events[0]);
    });
  });

  describe('Statistical Accuracy & Location Stats Calculation', () => {
    it('calculates strongest, most recent, and average magnitude accurately for a location', () => {
      const events: EarthquakeEvent[] = [
        createMockEvent('1', 3.0, 'Location A', 1000, 0, 0),
        createMockEvent('2', 5.0, 'Location B', 3000, 0, 0),
        createMockEvent('3', 4.0, 'Location C', 2000, 0, 0),
      ];

      const stats = calculateLocationStats(events);
      expect(stats.totalCount).toBe(3);
      expect(stats.strongestEvent?.id).toBe('2');
      expect(stats.strongestEvent?.magnitude).toBe(5.0);
      expect(stats.mostRecentEvent?.id).toBe('2'); // time 3000
      expect(stats.averageMagnitude).toBe(4.0);
    });

    it('handles missing magnitudes safely in location statistics', () => {
      const events: EarthquakeEvent[] = [
        createMockEvent('1', null, 'Location A', 1000, 0, 0),
        createMockEvent('2', 4.2, 'Location B', 2000, 0, 0),
      ];

      const stats = calculateLocationStats(events);
      expect(stats.totalCount).toBe(2);
      expect(stats.strongestEvent?.magnitude).toBe(4.2);
      expect(stats.averageMagnitude).toBe(4.2);
    });
  });

  describe('Event Description Search Remains Functional', () => {
    it('retains keyword searching by event description, place, or ID when not a location query', () => {
      const events: EarthquakeEvent[] = [
        createMockEvent('ev-1', 4.0, 'Kermadec Islands Region', 1000, -30, -178),
        createMockEvent('ev-2', 4.5, 'Near East Coast of Honshu, Japan', 2000, 36, 140),
        createMockEvent('ev-3', 3.8, 'San Andreas Fault, California', 3000, 35, -119),
      ];

      // Query for "fault"
      const faultResults = filterAndSortEvents(events, 'fault', 1.0, 10.0, 'newest', false, 'global', null);
      expect(faultResults.length).toBe(1);
      expect(faultResults[0].id).toBe('ev-3');

      // Query for "Honshu"
      const honshuResults = filterAndSortEvents(events, 'Honshu', 1.0, 10.0, 'newest', false, 'global', null);
      expect(honshuResults.length).toBe(1);
      expect(honshuResults[0].id).toBe('ev-2');

      // Query for event ID "ev-1"
      const idResults = filterAndSortEvents(events, 'ev-1', 1.0, 10.0, 'newest', false, 'global', null);
      expect(idResults.length).toBe(1);
      expect(idResults[0].id).toBe('ev-1');
    });
  });
});
