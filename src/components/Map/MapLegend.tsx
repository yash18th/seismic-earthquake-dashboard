import React from 'react';

export const MapLegend: React.FC = () => {
  const magnitudeTiers = [
    { label: '< 3.0', name: 'Minor', color: '#38bdf8', size: 8 },
    { label: '3.0 – 4.4', name: 'Moderate', color: '#fbbf24', size: 12 },
    { label: '4.5 – 5.9', name: 'Strong', color: '#fb923c', size: 16 },
    { label: '≥ 6.0', name: 'Major', color: '#f43f5e', size: 20 },
  ];

  const depthTiers = [
    { label: '0–70 km', name: 'Shallow Focus', color: '#38bdf8' },
    { label: '70–300 km', name: 'Intermediate', color: '#a855f7' },
    { label: '>300 km', name: 'Deep Focus', color: '#ec4899' },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs text-slate-200 shadow-xl space-y-2.5">
      <div className="font-semibold text-slate-100 flex items-center justify-between pb-1 border-b border-slate-800">
        <span>Map Legend</span>
        <span className="text-[10px] text-slate-400">Marker Scale &amp; Depth</span>
      </div>

      {/* Magnitude scale */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1.5">
          Magnitude (Radius &amp; Color)
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {magnitudeTiers.map((tier) => (
            <div key={tier.label} className="flex items-center gap-2">
              <span
                className="rounded-full inline-block shrink-0 shadow-sm"
                style={{
                  width: `${tier.size}px`,
                  height: `${tier.size}px`,
                  backgroundColor: tier.color,
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }}
              />
              <span className="text-[11px] text-slate-300">
                {tier.label} <span className="text-slate-400">({tier.name})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Depth tiers */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
          Depth Classification
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {depthTiers.map((tier) => (
            <div key={tier.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tier.color }}
              />
              <span className="text-[10px] text-slate-300">{tier.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
