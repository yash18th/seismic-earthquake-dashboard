import React, { useEffect, useState } from 'react';
import type { EarthquakeEvent } from '../../types/earthquake';
import {
  formatMagnitude,
  formatDepth,
  formatCoordinates,
  formatUtcDateTime,
  formatRelativeTime,
  getMagnitudeColor,
  getDepthCategory,
} from '../../utils/formatters';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Clock,
  Compass,
  Activity,
  Layers,
  AlertTriangle,
  Waves,
} from 'lucide-react';

interface EventDetailPanelProps {
  event: EarthquakeEvent | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const magMeta = getMagnitudeColor(event.magnitude);
  const depthMeta = getDepthCategory(event.coordinates?.depthKm);

  const handleCopyId = () => {
    navigator.clipboard.writeText(event.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0b1120] border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
    >
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-bold px-2.5 py-1 rounded-md text-sm border ${magMeta.bg} ${magMeta.text} ${magMeta.border}`}
            >
              M {formatMagnitude(event.magnitude)}
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Seismic Event Telemetry
              </span>
              <div className="text-xs font-semibold text-slate-200">
                {magMeta.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs"
                title="Previous event in catalog"
              >
                &larr;
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs"
                title="Next event in catalog"
              >
                &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Close event telemetry panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Title & Place */}
          <div>
            <h2 id="event-detail-title" className="text-lg font-bold text-white leading-snug">
              {event.place}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Full Descriptor: {event.title}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Magnitude &amp; Type
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                M {formatMagnitude(event.magnitude)}
              </div>
              <span className="text-[10px] text-slate-400">
                Formula: {event.magType ? event.magType.toUpperCase() : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Hypocenter Depth
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatDepth(event.coordinates?.depthKm)}
              </div>
              <span className="text-[10px] text-purple-300">
                {depthMeta.label}
              </span>
            </div>
          </div>

          {/* Temporal Data */}
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Event Timing (UTC)</span>
            </div>
            <div className="space-y-1.5 text-xs pl-5.5">
              <div>
                <span className="text-slate-400">Occurrence:</span>{' '}
                <strong className="font-mono text-slate-100">{formatUtcDateTime(event.time)}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                <span>Elapsed:</span> {formatRelativeTime(event.time)}
              </div>
              {event.updatedTime && (
                <div className="text-[11px] text-slate-400">
                  <span>Last USGS Review:</span> {formatUtcDateTime(event.updatedTime)}
                </div>
              )}
            </div>
          </div>

          {/* Geographic Coordinates */}
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Geospatial Coordinates</span>
            </div>
            {event.coordinates ? (
              <div className="space-y-1.5 text-xs pl-5.5">
                <div>
                  <span className="text-slate-400">Standard Notation:</span>{' '}
                  <strong className="font-mono text-emerald-300">
                    {formatCoordinates(event.coordinates.latitude, event.coordinates.longitude)}
                  </strong>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Latitude: {event.coordinates.latitude.toFixed(4)}° &bull; Longitude: {event.coordinates.longitude.toFixed(4)}°
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-400 pl-5.5">
                Coordinates unavailable or omitted in official record.
              </div>
            )}
          </div>

          {/* Secondary Telemetry: Felt Reports, Alert, Tsunami */}
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Impact &amp; Sensor Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pl-5.5">
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="font-semibold text-slate-200 capitalize">{event.status}</span>
              </div>
              <div>
                <span className="text-slate-400">USGS Significance:</span>{' '}
                <span className="font-mono font-semibold text-slate-200">{event.significanceScore ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Felt Reports:</span>{' '}
                <span className="font-mono text-slate-200">{event.feltReports !== null ? event.feltReports : 'None submitted'}</span>
              </div>
              <div>
                <span className="text-slate-400">Tsunami Warning:</span>{' '}
                <span className={event.tsunami ? 'font-bold text-cyan-400 flex items-center gap-1' : 'text-slate-400'}>
                  {event.tsunami ? <><Waves className="w-3 h-3" /> Flagged</> : 'No Warning'}
                </span>
              </div>
            </div>
            {event.isSignificant && (
              <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Exceeds dashboard significant event threshold (Magnitude ≥ 4.5).</span>
              </div>
            )}
          </div>

          {/* USGS Event ID & Copy */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="font-mono text-slate-300 truncate mr-2">
              <span className="text-slate-400">USGS Event ID:</span>{' '}
              <strong className="text-cyan-300">{event.id}</strong>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors shrink-0"
              title="Copy event ID to clipboard"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer with external USGS link */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80 sticky bottom-0">
        <a
          href={event.url}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-950 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Official USGS Event Page</span>
        </a>
      </div>
    </div>
  );
};
