import React, { useState, useMemo } from 'react';
import type { EarthquakeEvent, SortOption } from '../../types/earthquake';
import {
  formatMagnitude,
  formatDepth,
  formatUtcDateTime,
  formatRelativeTime,
  getMagnitudeColor,
  getDepthCategory,
} from '../../utils/formatters';
import { TablePagination } from './TablePagination';
import {
  ArrowUpDown,
  ExternalLink,
  Info,
  Waves,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface EventTableProps {
  events: EarthquakeEvent[];
  selectedEvent: EarthquakeEvent | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  currentSort,
  onSortChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const totalPages = Math.ceil(events.length / pageSize) || 1;

  // Safe page clamping when events change
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  if (validPage !== currentPage && totalPages > 0) {
    setCurrentPage(validPage);
  }

  const paginatedEvents = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return events.slice(startIndex, startIndex + pageSize);
  }, [events, validPage, pageSize]);

  const handleHeaderSort = (type: 'time' | 'mag') => {
    if (type === 'mag') {
      onSortChange(currentSort === 'strongest' ? 'weakest' : 'strongest');
    } else {
      onSortChange(currentSort === 'newest' ? 'oldest' : 'newest');
    }
  };

  return (
    <section aria-label="Earthquake Telemetry Table" className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Table Header toolbar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100 m-0">Earthquake Event Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5 m-0">
            Validated seismic telemetry from USGS FDSN Web Service
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          {events.length} records in view
        </span>
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              {/* Magnitude Header */}
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('mag')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                  title="Click to sort by magnitude"
                >
                  <span>Magnitude</span>
                  {currentSort === 'strongest' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  ) : currentSort === 'weakest' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </th>

              {/* Location Header */}
              <th scope="col" className="py-3 px-4">
                Location &amp; Region
              </th>

              {/* Depth Header */}
              <th scope="col" className="py-3 px-4">
                Depth
              </th>

              {/* Time Header */}
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('time')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                  title="Click to sort by event time"
                >
                  <span>Time (UTC)</span>
                  {currentSort === 'newest' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  ) : currentSort === 'oldest' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </th>

              {/* Indicators / Alert */}
              <th scope="col" className="py-3 px-4 text-center">
                Status / Alert
              </th>

              {/* Actions */}
              <th scope="col" className="py-3 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-6 h-6 text-slate-400" />
                    <span>No earthquake records match the specified filters.</span>
                    <span className="text-xs text-slate-400">
                      Try adjusting the minimum magnitude, time preset, or search keyword.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event) => {
                const mag = event.magnitude;
                const magStyle = getMagnitudeColor(mag);
                const depthMeta = getDepthCategory(event.coordinates?.depthKm);
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Magnitude Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${magStyle.bg} ${magStyle.text} ${magStyle.border}`}
                        >
                          M {formatMagnitude(mag)}
                        </span>
                        {event.magType && (
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {event.magType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-slate-200 line-clamp-1 hover:text-white">
                        {event.place}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>ID: {event.id}</span>
                        {event.coordinates && (
                          <span>
                            ({event.coordinates.latitude.toFixed(2)}°, {event.coordinates.longitude.toFixed(2)}°)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Depth */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-200">
                        {formatDepth(event.coordinates?.depthKm)}
                      </div>
                      <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border mt-0.5 ${depthMeta.badgeClass}`}>
                        {depthMeta.label.split(' ')[0]}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-300">
                        {formatUtcDateTime(event.time)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatRelativeTime(event.time)}
                      </div>
                    </td>

                    {/* Status & Indicators */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {event.alert && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                event.alert === 'green'
                                  ? '#22c55e'
                                  : event.alert === 'yellow'
                                  ? '#eab308'
                                  : event.alert === 'orange'
                                  ? '#f97316'
                                  : '#ef4444',
                            }}
                            title={`USGS PAGER alert level: ${event.alert}`}
                          />
                        )}
                        {event.tsunami && (
                          <span
                            className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800"
                            title="Tsunami Oceanic Warning Flagged"
                          >
                            <Waves className="w-3 h-3" />
                          </span>
                        )}
                        {event.isSignificant && (
                          <span
                            className="p-1 rounded bg-amber-950 text-amber-400 border border-amber-800"
                            title="Dashboard Significant Threshold Event (M ≥ 4.5)"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 capitalize">
                          {event.status}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700/60"
                        >
                          Details
                        </button>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Open official USGS event page in new tab"
                          aria-label={`View USGS event ${event.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {events.length > 0 && (
        <TablePagination
          currentPage={validPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={events.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </section>
  );
};
