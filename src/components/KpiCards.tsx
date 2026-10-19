import React from 'react';
import { Activity, Flame, TrendingUp, AlertOctagon, Waves, Compass, Info } from 'lucide-react';
import type { DashboardKpis } from '../types/earthquake';
import { formatMagnitude, getMagnitudeColor, SIGNIFICANT_MAGNITUDE_THRESHOLD } from '../utils/formatters';

interface KpiCardsProps {
  kpis: DashboardKpis;
  isLoading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, isLoading }) => {
  const strongestColor = getMagnitudeColor(kpis.strongestMagnitude);

  return (
    <section aria-label="Seismic Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Earthquakes */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            Total Earthquakes
          </span>
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
            {isLoading ? '...' : kpis.totalCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">events loaded</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          From currently active query window
        </p>
      </div>

      {/* 2. Strongest Magnitude */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            Peak Magnitude
          </span>
          <div className={`p-2 rounded-lg ${strongestColor.bg} border ${strongestColor.border} ${strongestColor.text}`}>
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              kpis.strongestMagnitude !== null ? strongestColor.text : 'text-slate-400'
            }`}
          >
            {isLoading
              ? '...'
              : kpis.strongestMagnitude !== null
              ? `M ${formatMagnitude(kpis.strongestMagnitude)}`
              : 'N/A'}
          </span>
          <span className="text-xs text-slate-400">
            {kpis.strongestMagnitude !== null ? strongestColor.label : 'No data'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Highest verified magnitude in dataset
        </p>
      </div>

      {/* 3. Average Magnitude */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            Average Magnitude
          </span>
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
            {isLoading
              ? '...'
              : kpis.averageMagnitude !== null
              ? `M ${formatMagnitude(kpis.averageMagnitude, 2)}`
              : 'N/A'}
          </span>
          <span className="text-xs text-slate-400">mean energy</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Computed across valid numerical magnitudes
        </p>
      </div>

      {/* 4. Significant Events */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
              Significant Events
            </span>
            <div className="group relative cursor-pointer" tabIndex={0} aria-label="Threshold info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block group-focus:block w-56 p-2 bg-slate-950 border border-slate-700 rounded-md shadow-xl text-[11px] text-slate-300 z-50">
                <span className="font-semibold text-amber-400">Dashboard Threshold:</span> Defined as events with Magnitude ≥ {SIGNIFICANT_MAGNITUDE_THRESHOLD}. Note: This is an application-defined operational threshold, distinct from the USGS composite 'sig' calculation formula.
              </div>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-400">
            {isLoading ? '...' : kpis.significantCount.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300">
            M ≥ {SIGNIFICANT_MAGNITUDE_THRESHOLD}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Events with heightened impact potential
        </p>
      </div>

      {/* Telemetry sub-pills row */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Shallow Focus (&lt;70 km):</span>
            <span className="font-mono font-semibold text-sky-300">{kpis.shallowCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tsunami Flags:</span>
            <span className="font-mono font-semibold text-cyan-300">{kpis.tsunamiWarningCount}</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          Real-time metrics strictly derived from active GeoJSON records
        </span>
      </div>
    </section>
  );
};
