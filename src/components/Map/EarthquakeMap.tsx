import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { EarthquakeEvent, RegionPreset, ResolvedLocation } from '../../types/earthquake';
import { formatMagnitude, formatDepth, formatUtcDateTime, getMagnitudeColor } from '../../utils/formatters';
import { getRegionViewport } from '../../utils/geoBoundaries';
import { MapLegend } from './MapLegend';
import { Globe, Maximize2, Layers, MapPin, AlertCircle } from 'lucide-react';

interface EarthquakeMapProps {
  events: EarthquakeEvent[];
  selectedEvent: EarthquakeEvent | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
  isLoading: boolean;
  isRefreshing?: boolean;
  region: RegionPreset;
  selectedLocation?: ResolvedLocation | null;
}

export const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  isLoading,
  isRefreshing = false,
  region,
  selectedLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [tileMode, setTileMode] = useState<'dark' | 'osm'>('dark');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current && mapContainerRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 18,
        worldCopyJump: true,
        attributionControl: true,
      });

      // Official OpenStreetMap raster tile service (No API key required)
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1.5,
        className: 'dark-tiles',
        crossOrigin: true,
      });

      osmLayer.on('tileerror', (err) => {
        console.warn('OpenStreetMap tile error notification:', err);
      });

      osmLayer.addTo(map);
      tileLayerRef.current = osmLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle tile theme switch between Dark OSM and Natural OSM
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 1.5,
      className: tileMode === 'dark' ? 'dark-tiles' : '',
      crossOrigin: true,
    });

    newLayer.on('tileerror', (err) => {
      console.warn('OpenStreetMap tile error notification:', err);
    });

    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [tileMode]);

  // Update markers when events change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const group = markersGroupRef.current;
    group.clearLayers();
    markersMapRef.current.clear();

    const validEventsWithCoords = events.filter((e) => e.coordinates !== null);

    validEventsWithCoords.forEach((event) => {
      const coords = event.coordinates!;
      const mag = event.magnitude;
      const magMeta = getMagnitudeColor(mag);

      // Scaling circle radius by magnitude
      // Safe base radius for unknown or small mags
      const radius =
        mag !== null && mag > 0
          ? Math.max(5, Math.min(24, Math.pow(mag, 1.6) * 0.8))
          : 5;

      const isSelected = selectedEvent?.id === event.id;

      const circle = L.circleMarker([coords.latitude, coords.longitude], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: magMeta.hex,
        fillOpacity: isSelected ? 0.95 : 0.75,
        color: isSelected ? '#ffffff' : magMeta.hex,
        weight: isSelected ? 3 : 1.5,
      });

      // Accessible interactive popup
      const popupContent = document.createElement('div');
      popupContent.className = 'text-slate-100 text-xs font-sans space-y-1.5 min-w-[210px]';

      const titleEl = document.createElement('div');
      titleEl.className = 'font-semibold text-slate-100 line-clamp-2 leading-tight';
      titleEl.textContent = event.place || event.title;
      popupContent.appendChild(titleEl);

      const statsEl = document.createElement('div');
      statsEl.className = 'grid grid-cols-2 gap-1 py-1 text-[11px] border-y border-slate-700/80 my-1';
      statsEl.innerHTML = `
        <div><span class="text-slate-400">Magnitude:</span> <strong style="color: ${magMeta.hex}">${formatMagnitude(mag)} ${event.magType || ''}</strong></div>
        <div><span class="text-slate-400">Depth:</span> <strong class="text-slate-200">${formatDepth(coords.depthKm)}</strong></div>
      `;
      popupContent.appendChild(statsEl);

      const timeEl = document.createElement('div');
      timeEl.className = 'text-[10px] text-slate-400 font-mono';
      timeEl.textContent = formatUtcDateTime(event.time);
      popupContent.appendChild(timeEl);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'w-full mt-2 py-1 px-2 text-[11px] font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-center cursor-pointer';
      btn.textContent = 'View Telemetry Details';
      btn.onclick = () => {
        onSelectEvent(event);
      };
      popupContent.appendChild(btn);

      circle.bindPopup(popupContent, {
        closeButton: true,
        className: 'seismic-map-popup',
      });

      circle.on('click', () => {
        onSelectEvent(event);
      });

      circle.on('mouseover', () => {
        circle.bringToFront();
      });

      circle.addTo(group);
      markersMapRef.current.set(event.id, circle);
    });
  }, [events, selectedEvent, onSelectEvent]);

  // Center/focus on selected event when selection changes
  useEffect(() => {
    if (!selectedEvent || !selectedEvent.coordinates || !mapInstanceRef.current) return;

    const coords = selectedEvent.coordinates;
    const marker = markersMapRef.current.get(selectedEvent.id);

    mapInstanceRef.current.flyTo([coords.latitude, coords.longitude], Math.max(5, mapInstanceRef.current.getZoom()), {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    if (marker) {
      marker.bringToFront();
      if (!marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedEvent]);

  // Shift map view when location selector, region selector, or events change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. If a specific country, region, or city is selected
    if (selectedLocation) {
      const validCoords = events
        .filter((e) => e.coordinates !== null)
        .map((e) => [e.coordinates!.latitude, e.coordinates!.longitude] as [number, number]);

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: Math.max(selectedLocation.zoom + 2, 7),
            animate: true,
          });
          return;
        }
      }

      // If no events match in this location (zero-result state), the map STILL navigates to that location!
      const locBounds = L.latLngBounds(
        [selectedLocation.bounds.minlatitude, selectedLocation.bounds.minlongitude],
        [selectedLocation.bounds.maxlatitude, selectedLocation.bounds.maxlongitude]
      );
      if (locBounds.isValid() && selectedLocation.bounds.minlongitude <= selectedLocation.bounds.maxlongitude) {
        mapInstanceRef.current.fitBounds(locBounds, {
          padding: [30, 30],
          maxZoom: selectedLocation.zoom,
          animate: true,
        });
      } else {
        mapInstanceRef.current.flyTo(selectedLocation.center, selectedLocation.zoom, { duration: 1.0 });
      }
      return;
    }

    // 2. Default regional presets (Global / Asia / India)
    const vp = getRegionViewport(region);

    const validCoords = events
      .filter((e) => e.coordinates !== null)
      .map((e) => [e.coordinates!.latitude, e.coordinates!.longitude] as [number, number]);

    if (validCoords.length > 0 && region !== 'global') {
      const bounds = L.latLngBounds(validCoords);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 6, animate: true });
        return;
      }
    }

    mapInstanceRef.current.flyTo(vp.center, vp.zoom, { duration: 1.0 });
  }, [selectedLocation, region, events]);

  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (selectedLocation) {
      mapInstanceRef.current.flyTo(selectedLocation.center, selectedLocation.zoom, { duration: 0.8 });
      return;
    }
    const vp = getRegionViewport(region);
    mapInstanceRef.current.flyTo(vp.center, vp.zoom, { duration: 0.8 });
  }, [selectedLocation, region]);

  const handleFitBounds = useCallback(() => {
    if (!mapInstanceRef.current || events.length === 0) return;

    const coordsList = events
      .filter((e) => e.coordinates !== null)
      .map((e) => [e.coordinates!.latitude, e.coordinates!.longitude] as [number, number]);

    if (coordsList.length > 0) {
      const bounds = L.latLngBounds(coordsList);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [events]);

  const missingCoordsCount = events.filter((e) => e.coordinates === null).length;
  const plottedCount = events.filter((e) => e.coordinates !== null).length;

  return (
    <section aria-label="Interactive Global Seismic Map" className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#080d1a] shadow-lg flex flex-col h-[520px]">
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
          {selectedLocation ? (
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="font-semibold capitalize">
            {selectedLocation ? `${selectedLocation.name} Seismicity Map` : `${region} Seismic Map`}
          </span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
            {plottedCount} plotted
          </span>
        </div>

        {missingCoordsCount > 0 && (
          <div className="bg-amber-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-amber-800/80 text-[11px] text-amber-300 flex items-center gap-1.5 shadow-lg">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{missingCoordsCount} unplottable (missing coordinates)</span>
          </div>
        )}

        {plottedCount === 0 && (
          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 shadow-lg">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {selectedLocation
                ? `No recorded events in ${selectedLocation.name} for current filters`
                : `No recorded events in ${region} for current filters`}
            </span>
          </div>
        )}
      </div>

      {/* Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
        {/* Fit Bounds */}
        <button
          type="button"
          onClick={handleFitBounds}
          title="Fit map view to all loaded earthquakes"
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Fit bounds to all earthquakes"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Reset World View */}
        <button
          type="button"
          onClick={handleResetView}
          title="Reset map view to global center"
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Reset world view"
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* Tile Theme Toggle */}
        <button
          type="button"
          onClick={() => setTileMode((prev) => (prev === 'dark' ? 'osm' : 'dark'))}
          title={`Switch map styling (currently ${tileMode === 'dark' ? 'Dark Mode OSM' : 'Standard Daylight OSM'})`}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
          aria-label="Toggle map tile styling"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">{tileMode === 'dark' ? 'Dark OSM' : 'Natural OSM'}</span>
        </button>

        {/* Toggle Legend */}
        <button
          type="button"
          onClick={() => setShowLegend((prev) => !prev)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            showLegend ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          Legend
        </button>
      </div>

      {/* Initial cold loading overlay (only when no data is loaded yet) */}
      {isLoading && events.length === 0 && (
        <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 shadow-2xl">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            <span>Plotting seismic event telemetry...</span>
          </div>
        </div>
      )}

      {/* Subtle non-blocking background refresh badge when map already has events */}
      {(isRefreshing || (isLoading && events.length > 0)) && (
        <div className="absolute top-14 left-3 z-20 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-800/60 text-[11px] text-cyan-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            <span>Syncing fresh telemetry...</span>
          </div>
        </div>
      )}

      {/* Floating Legend */}
      {showLegend && (
        <div className="absolute bottom-6 left-3 z-20 max-w-xs transition-opacity duration-200">
          <MapLegend />
        </div>
      )}

      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </section>
  );
};
