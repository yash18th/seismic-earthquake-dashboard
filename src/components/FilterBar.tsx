import React from 'react';
import { Search, RotateCcw, ArrowUpDown, Calendar, SlidersHorizontal, Globe, ShieldAlert } from 'lucide-react';
import type { DashboardFilterState, TimeRangePreset, SortOption, RegionPreset } from '../types/earthquake';

interface FilterBarProps {
  filterState: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  apiCount: number;
  geoMatchCount: number;
  displayedCount: number;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  apiCount,
  geoMatchCount,
  displayedCount,
  isLoading,
}) => {
  const regions: { id: RegionPreset; label: string; description: string }[] = [
    { id: 'global', label: 'Global', description: 'Worldwide seismic telemetry' },
    { id: 'asia', label: 'Asia', description: 'East, South, Southeast, Central & West Asia' },
    { id: 'india', label: 'India', description: 'Mainland & island territories boundary' },
  ];

  const timePresets: { id: TimeRangePreset; label: string }[] = [
    { id: '1h', label: 'Past 1 Hr' },
    { id: '24h', label: 'Past 24 Hrs' },
    { id: '7d', label: 'Past 7 Days' },
    { id: '30d', label: 'Past 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
      {/* ROW 1: Region Selector, Search Field, Sort Dropdown, Reset Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Region Selector */}
        <div className="lg:col-span-4 flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <div className="px-2 text-slate-400 flex items-center gap-1.5 text-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Region:</span>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1">
            {regions.map((reg) => {
              const active = filterState.region === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => onFilterChange({ region: reg.id })}
                  title={reg.description}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all text-center ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Field */}
        <div className="lg:col-span-4 relative">
          <label htmlFor="search-input" className="sr-only">
            Search earthquakes by location or title
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="search-input"
            type="search"
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search place, region, or ID (e.g. California, Tokyo, Assam)..."
            className="w-full h-9 pl-9 pr-8 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
          {filterState.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-200"
              aria-label="Clear search query"
            >
              &times;
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-2 flex items-center gap-1.5">
          <label htmlFor="sort-select" className="sr-only">
            Sort records
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              id="sort-select"
              value={filterState.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="w-full h-9 pl-8 pr-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer appearance-none"
            >
              <option value="newest">Newest Origin First</option>
              <option value="oldest">Oldest Origin First</option>
              <option value="strongest">Highest Magnitude</option>
              <option value="weakest">Lowest Magnitude</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full h-9 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
            title="Reset to default filters (Global, Past 24h, M 2.5+)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* ROW 2: Date-Range Presets and Custom Date Range */}
      <div className="pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-300">Time Range:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {timePresets.map((preset) => {
            const isSelected = filterState.timePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onFilterChange({ timePreset: preset.id })}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range pickers when selected */}
        {filterState.timePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs mt-1 sm:mt-0">
            <span className="text-slate-400 text-[11px] font-mono">UTC:</span>
            <input
              type="datetime-local"
              aria-label="Start time UTC"
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
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            />
            <span className="text-slate-500">to</span>
            <input
              type="datetime-local"
              aria-label="End time UTC"
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
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            />
          </div>
        )}
      </div>

      {/* ROW 3: Minimum Magnitude, Maximum Magnitude, and Significant-Event Toggle */}
      <div className="pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Minimum Magnitude */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="min-mag-select" className="text-xs text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-slate-300">Min Mag:</span>
            </label>
            <select
              id="min-mag-select"
              value={filterState.minMagnitude}
              onChange={(e) => onFilterChange({ minMagnitude: parseFloat(e.target.value) })}
              className="h-8 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="1.0">M 1.0+ (Micro+)</option>
              <option value="2.5">M 2.5+ (Standard USGS)</option>
              <option value="3.5">M 3.5+ (Perceptible)</option>
              <option value="4.5">M 4.5+ (Significant Threshold)</option>
              <option value="5.5">M 5.5+ (Strong Quakes)</option>
              <option value="6.5">M 6.5+ (Major Quakes)</option>
            </select>
          </div>

          {/* Maximum Magnitude */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="max-mag-select" className="text-xs text-slate-400 flex items-center gap-1">
              <span className="font-medium text-slate-300">Max Mag:</span>
            </label>
            <select
              id="max-mag-select"
              value={filterState.maxMagnitude}
              onChange={(e) => onFilterChange({ maxMagnitude: parseFloat(e.target.value) })}
              className="h-8 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="10.0">No Maximum (All)</option>
              <option value="4.5">M ≤ 4.5 (Light Only)</option>
              <option value="5.5">M ≤ 5.5 (Moderate Only)</option>
              <option value="6.5">M ≤ 6.5 (Strong Only)</option>
            </select>
          </div>

          {/* Significant Only Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={filterState.significantOnly}
              onChange={(e) => onFilterChange({ significantOnly: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500/40 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Significant Only (M ≥ 4.5)</span>
          </label>
        </div>

        {isLoading && (
          <span className="text-cyan-400 text-xs animate-pulse flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Querying USGS FDSN Web Service...
          </span>
        )}
      </div>

      {/* ROW 4: Results Summary (API Count, Geographic Matches, Displayed Count) */}
      <div className="pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-400">Results Breakdown:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
            API Returned: <strong className="text-white">{apiCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
            Region Matches: <strong className="text-white">{geoMatchCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            Displayed in View: <strong className="text-white">{displayedCount}</strong>
          </span>
        </div>

        {/* Clear non-predictive scientific disclaimer */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Historical recorded observations only. Does not predict future seismic activity.</span>
        </div>
      </div>
    </div>
  );
};
