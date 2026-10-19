import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RotateCcw,
  ArrowUpDown,
  Calendar,
  SlidersHorizontal,
  Globe,
  ShieldAlert,
  MapPin,
  X,
} from 'lucide-react';
import type {
  DashboardFilterState,
  TimeRangePreset,
  SortOption,
  RegionPreset,
  ResolvedLocation,
} from '../types/earthquake';
import {
  searchLocationSuggestions,
  resolveLocationLocally,
  geocodeLocation,
} from '../services/locationService';

interface FilterBarProps {
  filterState: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  onSelectLocation?: (location: ResolvedLocation | null) => void;
  apiCount: number;
  geoMatchCount: number;
  displayedCount: number;
  plottedCount?: number;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  onSelectLocation = () => {},
  apiCount,
  geoMatchCount,
  displayedCount,
  plottedCount = displayedCount,
  isLoading,
}) => {
  const targetInputValue = filterState.selectedLocation
    ? filterState.selectedLocation.name
    : filterState.searchQuery;

  const [inputValue, setInputValue] = useState<string>(targetInputValue);
  const [prevTargetValue, setPrevTargetValue] = useState<string>(targetInputValue);

  // Synchronize input value during render if props change from outside (e.g. Reset)
  if (prevTargetValue !== targetInputValue) {
    setPrevTargetValue(targetInputValue);
    setInputValue(targetInputValue);
  }

  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounced autocomplete suggestions lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!inputValue.trim() || filterState.selectedLocation?.name === inputValue) {
        setSuggestions([]);
      } else {
        const results = searchLocationSuggestions(inputValue, 5);
        setSuggestions(results);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, filterState.selectedLocation]);

  // Dismiss suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(true);

    if (filterState.selectedLocation && val !== filterState.selectedLocation.name) {
      onSelectLocation(null);
    }
    onFilterChange({ searchQuery: val });
  };

  const handleSelectSuggestion = (loc: ResolvedLocation) => {
    setInputValue(loc.name);
    setShowSuggestions(false);
    onSelectLocation(loc);
    onFilterChange({ searchQuery: '' });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);

      if (!inputValue.trim()) {
        onSelectLocation(null);
        onFilterChange({ searchQuery: '' });
        return;
      }

      // Check local verified database first (e.g. "UK", "USA", "Indonesia", "California")
      const localMatch = resolveLocationLocally(inputValue);
      if (localMatch) {
        handleSelectSuggestion(localMatch);
        return;
      }

      // If not in local database, try fallback geocoder
      setIsGeocoding(true);
      try {
        const remoteMatch = await geocodeLocation(inputValue);
        if (remoteMatch) {
          handleSelectSuggestion(remoteMatch);
        } else {
          // If not a recognized place, treat as standard event description search
          onSelectLocation(null);
          onFilterChange({ searchQuery: inputValue.trim() });
        }
      } finally {
        setIsGeocoding(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    setShowSuggestions(false);
    onSelectLocation(null);
    onFilterChange({ searchQuery: '' });
  };

  const regions: { id: RegionPreset; label: string; description: string }[] = [
    { id: 'global', label: 'Global', description: 'Worldwide seismic telemetry' },
    { id: 'asia', label: 'Asia', description: 'East, South, Southeast, Central & West Asia' },
    { id: 'india', label: 'India', description: 'Mainland & island territories boundary' },
  ];

  const handleRegionClick = (regionId: RegionPreset) => {
    if (regionId === 'india') {
      const indiaLoc = resolveLocationLocally('India');
      if (indiaLoc) {
        onSelectLocation(indiaLoc);
      }
      onFilterChange({ region: 'india' });
    } else if (regionId === 'global') {
      onSelectLocation(null);
      onFilterChange({ region: 'global' });
    } else {
      onSelectLocation(null);
      onFilterChange({ region: 'asia' });
    }
  };

  const timePresets: { id: TimeRangePreset; label: string }[] = [
    { id: '1h', label: 'Past 1 Hr' },
    { id: '24h', label: 'Past 24 Hrs' },
    { id: '7d', label: 'Past 7 Days' },
    { id: '30d', label: 'Past 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
      {/* ROW 1: Region Selector, Location/Search Field with Autocomplete, Sort Dropdown, Reset Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Region Selector */}
        <div className="lg:col-span-4 flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <div className="px-2 text-slate-400 flex items-center gap-1.5 text-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Region:</span>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1">
            {regions.map((reg) => {
              const active =
                filterState.region === reg.id &&
                (reg.id !== 'india' || filterState.selectedLocation?.id === 'IN');
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => handleRegionClick(reg.id)}
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

        {/* Location & Earthquake Search Field with Autocomplete */}
        <div className="lg:col-span-4 relative" ref={searchContainerRef}>
          <label htmlFor="search-input" className="sr-only">
            Search earthquakes by location or title
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isGeocoding ? (
              <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : filterState.selectedLocation ? (
              <MapPin className="w-4 h-4 text-cyan-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            id="search-input"
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search country, city, or event (e.g. UK, USA, Indonesia, Tokyo)..."
            className="w-full h-9 pl-9 pr-8 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-200"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0b1120] border border-cyan-900/60 rounded-lg shadow-xl overflow-hidden py-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Matching Geographic Locations
              </div>
              {suggestions.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(loc)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{loc.displayName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {loc.type}
                  </span>
                </button>
              ))}
            </div>
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

      {/* Selected Location Pill Indicator */}
      {filterState.selectedLocation && (
        <div className="flex items-center gap-2 text-xs bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded-lg text-cyan-200">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Filtering telemetry within <strong>{filterState.selectedLocation.name}</strong> ({filterState.selectedLocation.type})
          </span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Clear Location</span>
          </button>
        </div>
      )}

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

      {/* ROW 4: Results Summary (API Count, Geographic Matches, Displayed Count, Plotted on Map) */}
      <div className="pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-400">Results Breakdown:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
            API Returned: <strong className="text-white">{apiCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
            {filterState.selectedLocation ? 'Location Matches:' : 'Region Matches:'}{' '}
            <strong className="text-white">{geoMatchCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            Displayed: <strong className="text-white">{displayedCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60">
            Plotted on Map: <strong className="text-white">{plottedCount}</strong>
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
