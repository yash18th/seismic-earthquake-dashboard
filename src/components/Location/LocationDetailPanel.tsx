import React from 'react';
import type { EarthquakeEvent, ResolvedLocation, TimeRangePreset } from '../../types/earthquake';
import { calculateLocationStats } from '../../utils/calculations';
import {
  formatMagnitude,
  formatDepth,
  formatUtcDateTime,
  formatRelativeTime,
  getMagnitudeColor,
} from '../../utils/formatters';
import {
  MapPin,
  Activity,
  Calendar,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Compass,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface LocationDetailPanelProps {
  location: ResolvedLocation;
  events: EarthquakeEvent[];
  timePreset: TimeRangePreset;
  minMagnitude: number;
  maxMagnitude: number;
  onClearLocation: () => void;
  onSelectEvent: (event: EarthquakeEvent) => void;
  onExpandDateRange?: () => void;
  onLowerMinMagnitude?: () => void;
}

export const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  location,
  events,
  timePreset,
  minMagnitude,
  maxMagnitude,
  onClearLocation,
  onSelectEvent,
  onExpandDateRange,
  onLowerMinMagnitude,
}) => {
  const stats = calculateLocationStats(events);

  const timeLabel =
    timePreset === '1h'
      ? 'Past 1 Hour'
      : timePreset === '24h'
      ? 'Past 24 Hours'
      : timePreset === '7d'
      ? 'Past 7 Days'
      : timePreset === '30d'
      ? 'Past 30 Days'
      : 'Custom Period';

  return (
    <section
      aria-label={`Detailed seismic intelligence for ${location.name}`}
      className="bg-slate-900/90 border border-cyan-900/50 rounded-xl p-4 sm:p-5 shadow-lg space-y-4 backdrop-blur-sm transition-all"
    >
      {/* Top Header: Location Title, Coordinates/Bounds, and Clear/Reset button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {location.displayName || location.name}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {location.type}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5 font-mono">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-slate-400" />
                Center: {location.center[0].toFixed(2)}°, {location.center[1].toFixed(2)}°
              </span>
              <span>&bull;</span>
              <span>
                Bounds: [{location.bounds.minlatitude.toFixed(1)}° to {location.bounds.maxlatitude.toFixed(1)}° Lat,{' '}
                {location.bounds.minlongitude.toFixed(1)}° to {location.bounds.maxlongitude.toFixed(1)}° Lon]
              </span>
            </div>
          </div>
        </div>

        {/* Action button to clear selected location and return to worldwide */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
            title="Clear location selection and return to global dashboard"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset to Global</span>
          </button>
        </div>
      </div>

      {/* Active Filter Criteria Summary */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Telemetry Criteria:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[11px]">
          <Calendar className="w-3 h-3 text-cyan-400" />
          {timeLabel}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[11px]">
          <SlidersHorizontal className="w-3 h-3 text-amber-400" />
          Min M {minMagnitude.toFixed(1)}+
        </span>
        {maxMagnitude < 10 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[11px]">
            Max M ≤ {maxMagnitude.toFixed(1)}
          </span>
        )}
      </div>

      {/* 4 Location KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Matching Events */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Matching Events</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In {location.name}</div>
        </div>

        {/* Strongest Event */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Strongest Event</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">
            {stats.strongestEvent?.magnitude !== null && stats.strongestEvent?.magnitude !== undefined
              ? `M ${formatMagnitude(stats.strongestEvent.magnitude)}`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={stats.strongestEvent?.place || ''}>
            {stats.strongestEvent?.place || 'No records in range'}
          </div>
        </div>

        {/* Most Recent Event */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Most Recent Event</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-1 truncate">
            {stats.mostRecentEvent ? formatRelativeTime(stats.mostRecentEvent.time) : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={stats.mostRecentEvent ? formatUtcDateTime(stats.mostRecentEvent.time) : ''}>
            {stats.mostRecentEvent ? formatUtcDateTime(stats.mostRecentEvent.time) : 'No recent records'}
          </div>
        </div>

        {/* Average Magnitude */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Average Magnitude</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 mt-1">
            {stats.averageMagnitude !== null ? `M ${stats.averageMagnitude.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mean recorded energy</div>
        </div>
      </div>

      {/* Events List or Clear Zero-Result State */}
      {events.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Recorded Earthquakes in {location.name} ({events.length})
            </span>
            <span className="text-[11px] text-slate-400">Click an event to focus on map</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 focus:outline-none">
            {events.map((ev) => {
              const magColor = getMagnitudeColor(ev.magnitude);
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectEvent(ev);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-700/60 cursor-pointer transition-all group text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${magColor.bg} ${magColor.text} ${magColor.border}`}
                    >
                      M {formatMagnitude(ev.magnitude)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {ev.place || ev.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>Depth: {formatDepth(ev.coordinates?.depthKm)}</span>
                        <span>&bull;</span>
                        <span>{formatUtcDateTime(ev.time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="View on official USGS website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ACCURATE ZERO-RESULTS STATE WITH NEXT ACTIONS */
        <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 text-center space-y-3">
          <div className="inline-flex p-2.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              No recorded earthquakes match your current filters in {location.name} during the selected period.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              This reflects official USGS catalog records within the boundary of {location.name} for {timeLabel} at magnitude M {minMagnitude.toFixed(1)}+. This is an observation of recorded events and does not imply an absence of seismic faulting.
            </p>
          </div>

          {/* Actionable Next Steps */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {timePreset !== '30d' && onExpandDateRange && (
              <button
                type="button"
                onClick={onExpandDateRange}
                className="px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-900/70 border border-cyan-700/60 text-cyan-300 text-xs font-medium transition-colors"
              >
                Expand Date Range to Past 30 Days
              </button>
            )}
            {minMagnitude > 1.0 && onLowerMinMagnitude && (
              <button
                type="button"
                onClick={onLowerMinMagnitude}
                className="px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-900/70 border border-amber-700/60 text-amber-300 text-xs font-medium transition-colors"
              >
                Lower Minimum Magnitude to M 1.0+
              </button>
            )}
            <button
              type="button"
              onClick={onClearLocation}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Return to Worldwide View
            </button>
          </div>
        </div>
      )}

      {/* Non-predictive Scientific Notice */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Recorded earthquake monitoring dashboard. Event frequencies and statistics are retrospective scientific observations, not future earthquake predictions.
        </span>
      </div>
    </section>
  );
};
