import React from 'react';
import { Search, Filter, RotateCcw, ArrowUpDown, Calendar, SlidersHorizontal, AlertCircle } from 'lucide-react';
import type { DashboardFilterState, TimeRangePreset, SortOption } from '../types/earthquake';

interface FilterBarProps {
  filterState: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  totalLoaded: number;
  filteredCount: number;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  totalLoaded,
  filteredCount,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      {/* Top row: Search input, Sort control, and Reset button */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input (Client-side) */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">Search earthquakes by location or title</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="search-input"
            type="search"
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search region or country (e.g., Japan, California, Indonesia)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </label>
          <select
            id="sort-select"
            value={filterState.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="strongest">Strongest First (High to Low)</option>
            <option value="weakest">Weakest First (Low to High)</option>
          </select>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 text-xs font-medium transition-colors"
          title="Reset to default filters (Past 24h, Min M 2.5, all quakes)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Middle row: Time range presets and Min magnitude (Server-side controls) */}
      <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Time range selector */}
        <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-300">Time Window:</span>
          </span>
          {(['1h', '24h', '7d', '30d'] as TimeRangePreset[]).map((preset) => {
            const labels: Record<TimeRangePreset, string> = {
              '1h': 'Past 1 Hr',
              '24h': 'Past 24 Hrs',
              '7d': 'Past 7 Days',
              '30d': 'Past 30 Days',
              custom: 'Custom',
            };
            const isSelected = filterState.timePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onFilterChange({ timePreset: preset })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onFilterChange({ timePreset: 'custom' })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              filterState.timePreset === 'custom'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Magnitude filters */}
        <div className="lg:col-span-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="min-mag-select" className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-slate-300">Min Mag:</span>
            </label>
            <select
              id="min-mag-select"
              value={filterState.minMagnitude}
              onChange={(e) => onFilterChange({ minMagnitude: parseFloat(e.target.value) })}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="1.0">M 1.0+ (Micro+)</option>
              <option value="2.5">M 2.5+ (Standard)</option>
              <option value="3.5">M 3.5+ (Felt quakes)</option>
              <option value="4.5">M 4.5+ (Significant)</option>
              <option value="5.5">M 5.5+ (Strong quakes)</option>
              <option value="6.5">M 6.5+ (Major quakes)</option>
            </select>
          </div>

          {/* Significant events only toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={filterState.significantOnly}
              onChange={(e) => onFilterChange({ significantOnly: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500/40 focus:ring-offset-slate-950 w-3.5 h-3.5"
            />
            <span>Significant Only (M ≥ 4.5)</span>
          </label>
        </div>
      </div>

      {/* Custom date range fields if selected */}
      {filterState.timePreset === 'custom' && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Custom UTC Dates:</span>
          <div className="flex items-center gap-1.5">
            <label htmlFor="start-date" className="text-slate-400">Start:</label>
            <input
              id="start-date"
              type="datetime-local"
              value={filterState.customStartTime ? filterState.customStartTime.substring(0, 16) : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onFilterChange({ customStartTime: '' });
                  return;
                }
                const parsed = new Date(val);
                if (!isNaN(parsed.getTime())) {
                  onFilterChange({ customStartTime: parsed.toISOString() });
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="end-date" className="text-slate-400">End:</label>
            <input
              id="end-date"
              type="datetime-local"
              value={filterState.customEndTime ? filterState.customEndTime.substring(0, 16) : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onFilterChange({ customEndTime: '' });
                  return;
                }
                const parsed = new Date(val);
                if (!isNaN(parsed.getTime())) {
                  onFilterChange({ customEndTime: parsed.toISOString() });
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
        </div>
      )}

      {/* Filter status summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing <strong className="text-white font-mono">{filteredCount}</strong> of{' '}
            <strong className="text-slate-300 font-mono">{totalLoaded}</strong> loaded events
          </span>
          {filterState.searchQuery && (
            <span className="text-cyan-400 text-[11px]">
              (filtered by &ldquo;{filterState.searchQuery}&rdquo;)
            </span>
          )}
          {isLoading && (
            <span className="text-cyan-400 text-[11px] animate-pulse flex items-center gap-1">
              &bull; Fetching fresh records...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Time &amp; Min Mag query the USGS API; Search &amp; Sort apply in-memory</span>
        </div>
      </div>
    </div>
  );
};
