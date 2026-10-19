import React from 'react';
import { Activity, RefreshCw, Wifi, AlertTriangle, Clock, ShieldCheck, FileText, Calendar } from 'lucide-react';
import { formatUtcDateTime, formatRelativeTime } from '../utils/formatters';
import type { TimeRangePreset } from '../types/earthquake';

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  error: string | null;
  pollingEnabled: boolean;
  onTogglePolling: () => void;
  onRefresh: () => void;
  onOpenReport: () => void;
  totalLoaded: number;
  timePreset: TimeRangePreset;
  customStartTime?: string;
  customEndTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isLoading,
  isRefreshing,
  isStale,
  error,
  pollingEnabled,
  onTogglePolling,
  onRefresh,
  onOpenReport,
  totalLoaded,
  timePreset,
  customStartTime,
  customEndTime,
}) => {
  // Connection status distinction:
  // - "Connected" (API is reachable and data is fresh)
  // - "Stale Data" (refresh failed, previous data retained)
  // - "Offline / Error" (network or USGS API failure)
  // - "Syncing..." (active request in flight)
  const isSyncing = isLoading || isRefreshing;

  const timeRangeLabel =
    timePreset === '1h'
      ? 'Past 1 Hour'
      : timePreset === '24h'
      ? 'Past 24 Hours'
      : timePreset === '7d'
      ? 'Past 7 Days'
      : timePreset === '30d'
      ? 'Past 30 Days'
      : customStartTime && customEndTime
      ? `${customStartTime.substring(0, 10)} to ${customEndTime.substring(0, 10)} UTC`
      : 'Custom UTC Range';

  return (
    <header className="border-b border-slate-800/80 bg-[#090e1a]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-inner shadow-cyan-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${error ? 'bg-rose-400 opacity-75' : 'bg-cyan-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${error ? 'bg-rose-500' : 'bg-cyan-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">SEISMIC</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-800/60">
                USGS LIVE FEED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recorded Earthquake Monitoring &amp; Telemetry (Non-Predictive Scientific Catalog)
            </p>
          </div>
        </div>

        {/* Telemetry Status and Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs">
          {/* Connection status badge (Distinct from last refresh) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              error && isStale
                ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                : error
                ? 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                : isSyncing
                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
            }`}
            title="Official USGS FDSN Web Service connection status"
          >
            {error && isStale ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>API Warning (Stale Cache)</span>
              </>
            ) : error ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Connection Error</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Querying USGS...</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>USGS FDSN Online ({totalLoaded} loaded)</span>
              </>
            )}
          </div>

          {/* Selected Date Range Indicator */}
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Query Window:</span>
              <span className="font-mono font-medium text-cyan-300">{timeRangeLabel}</span>
            </div>
          </div>

          {/* Last Successful Refresh Indicator */}
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 text-[11px]">
              <span className="text-slate-400">Last Synced:</span>
              <span className="font-mono text-slate-200">
                {lastUpdated ? (
                  <>
                    {formatUtcDateTime(lastUpdated.getTime())}{' '}
                    <span className="text-slate-400">({formatRelativeTime(lastUpdated.getTime())})</span>
                  </>
                ) : (
                  'Pending first sync...'
                )}
              </span>
            </div>
          </div>

          {/* Auto-Poll Toggle */}
          <button
            type="button"
            onClick={onTogglePolling}
            aria-pressed={pollingEnabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all ${
              pollingEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 hover:bg-cyan-900/80'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Automatically poll USGS API every 60 seconds"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${pollingEnabled ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Auto-Poll {pollingEnabled ? '(60s)' : 'Off'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium shadow-sm shadow-cyan-950 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Manually refresh earthquake data from USGS API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Assignment Report Link */}
          <button
            type="button"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-[11px] font-medium transition-all"
            title="Open 1-Page Assignment & Verification Report"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Verification Report</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
