import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { EarthquakeEvent } from '../../types/earthquake';
import { generateTimelineData, generateMagnitudeDistribution } from '../../utils/aggregation';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartsSectionProps {
  events: EarthquakeEvent[];
}

const BIN_COLORS = [
  '#38bdf8', // 2.5–3.4 (Minor)
  '#fbbf24', // 3.5–4.4 (Light/Moderate)
  '#fb923c', // 4.5–5.4 (Moderate/Strong)
  '#f97316', // 5.5–6.4 (Strong)
  '#ef4444', // 6.5–7.4 (Major)
  '#dc2626', // 7.5+ (Great)
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ events }) => {
  const timelineData = React.useMemo(() => generateTimelineData(events), [events]);
  const magnitudeBins = React.useMemo(() => generateMagnitudeDistribution(events), [events]);

  const hasData = events.length > 0;

  return (
    <section aria-label="Seismic Telemetry Analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Seismic Activity Timeline */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 m-0">Event Frequency Timeline</h2>
              <p className="text-[11px] text-slate-400 m-0">
                Earthquake counts aggregated by UTC time intervals
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            UTC Time
          </span>
        </div>

        <div className="h-60 w-full">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
              <span>No timeline records available for selected criteria</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-mono text-slate-300 font-semibold">{data.hourLabel} UTC</p>
                          <p className="text-cyan-400 font-medium">
                            Events: <span className="font-mono text-white font-bold">{data.count}</span>
                          </p>
                          {data.maxMag !== null && (
                            <p className="text-amber-400 text-[11px]">
                              Max Magnitude: <span className="font-mono text-white font-bold">M {data.maxMag}</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Magnitude Distribution Histogram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-950/80 border border-amber-800/50 text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 m-0">Magnitude Distribution</h2>
              <p className="text-[11px] text-slate-400 m-0">
                Number of events by Richter/Moment magnitude intervals
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            Energy Bins
          </span>
        </div>

        <div className="h-60 w-full">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
              <span>No magnitude data available for selected criteria</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magnitudeBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="rangeLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = events.length > 0 ? ((data.count / events.length) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{data.rangeLabel}</p>
                          <p className="text-slate-300">
                            Count: <span className="font-mono text-white font-bold">{data.count}</span>
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            Share: <span className="font-mono text-cyan-400">{percentage}%</span> of dataset
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {magnitudeBins.map((_, index) => (
                    <Cell
                      key={`bin-cell-${index}`}
                      fill={BIN_COLORS[index % BIN_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
};
