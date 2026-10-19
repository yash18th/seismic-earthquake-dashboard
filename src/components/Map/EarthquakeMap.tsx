import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { EarthquakeEvent } from '../../types/earthquake';
import { formatMagnitude, formatDepth, formatUtcDateTime, getMagnitudeColor } from '../../utils/formatters';
import { MapLegend } from './MapLegend';
import { Globe, Maximize2, Layers, MapPin } from 'lucide-react';

interface EarthquakeMapProps {
  events: EarthquakeEvent[];
  selectedEvent: EarthquakeEvent | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
  isLoading: boolean;
}

export const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  isLoading,
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

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 18,
        worldCopyJump: true,
        attributionControl: true,
      });

      // Default dark Carto tile layer
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      );

      darkLayer.addTo(map);
      tileLayerRef.current = darkLayer;

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

  // Handle tile switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newLayer =
      tileMode === 'dark'
        ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
          })
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
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

    if (marker && !marker.isPopupOpen()) {
      marker.openPopup();
    }
  }, [selectedEvent]);

  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([20, 0], 2);
  }, []);

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

  return (
    <section aria-label="Interactive Global Seismic Map" className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#080d1a] shadow-lg flex flex-col h-[520px]">
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">Geospatial Distribution</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
            {events.filter((e) => e.coordinates !== null).length} plotted
          </span>
        </div>

        {missingCoordsCount > 0 && (
          <div className="bg-amber-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-amber-800/80 text-[11px] text-amber-300 flex items-center gap-1.5 shadow-lg">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{missingCoordsCount} unplottable (missing coordinates)</span>
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

        {/* Tile Layer Toggle */}
        <button
          type="button"
          onClick={() => setTileMode((prev) => (prev === 'dark' ? 'osm' : 'dark'))}
          title={`Switch map layer (currently ${tileMode === 'dark' ? 'Dark Carto' : 'OpenStreetMap'})`}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
          aria-label="Toggle map tile layer"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">{tileMode === 'dark' ? 'Dark' : 'OSM'}</span>
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

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 shadow-2xl">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            <span>Plotting seismic event telemetry...</span>
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
