import React from "react";
import { Camera, Map, Building, Library } from "lucide-react";

export const WORKLOAD_COLORS: Record<string, string> = {
  "Studio & Digitalisering": "bg-indigo-500",
  "Ekstern Location": "bg-teal-500",
  "Front of House": "bg-orange-400",
  "Annet": "bg-stone-300",
};

export interface WorkloadEntry {
  total: number;
  overdue: number;
  locations: Record<string, number>;
}

export interface LocationBreakdown {
  studioCount: number;
  locationCount: number;
  frontOfHouseCount: number;
  nbCount: number;
}

interface WorkloadSidebarProps {
  workload: [string, WorkloadEntry][];
  locationBreakdown: LocationBreakdown;
  onLocationClick: (category: 'studio' | 'location' | 'foh' | 'nb') => void;
}

export const WorkloadSidebar: React.FC<WorkloadSidebarProps> = ({
  workload,
  locationBreakdown,
  onLocationClick,
}) => (
  <div className="space-y-8">
    {/* Workload Card */}
    <section className="p-6 rounded-2xl border bg-stone-50 border-stone-200 shadow-sm">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Arbeidsmengde (14 dager)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WORKLOAD_COLORS).map(([label, colorClass]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${colorClass}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {workload.map(([owner, data]) => (
          <div key={owner} className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-stone-600">{owner}</span>
              <div className="flex items-center gap-2">
                {data.overdue > 0 && (
                  <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded" title={`${data.overdue} over frist`}>
                    {data.overdue} over frist
                  </span>
                )}
                <span className="text-stone-900">{data.total} totalt</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-stone-100 flex">
              {Object.entries(data.locations).map(([loc, count]) => {
                const maxTotal = workload[0]?.[1]?.total || 1;
                const width = `${((count as number) / maxTotal) * 100}%`;
                return (
                  <div
                    key={loc}
                    className={`h-full transition-all duration-1000 ${WORKLOAD_COLORS[loc] || "bg-stone-200"}`}
                    style={{ width }}
                    title={`${loc}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Location Breakdown */}
    <section className="space-y-4">
      {[
        { cat: 'studio' as const, label: 'Studio & Digitalisering', sub: 'Seksjon Foto', count: locationBreakdown.studioCount, icon: Camera, bg: 'bg-indigo-50', hoverBg: 'group-hover:bg-indigo-100', iconColor: 'text-indigo-600' },
        { cat: 'location' as const, label: 'Ekstern Location', sub: 'Utenfor huset', count: locationBreakdown.locationCount, icon: Map, bg: 'bg-teal-50', hoverBg: 'group-hover:bg-teal-100', iconColor: 'text-teal-600' },
        { cat: 'foh' as const, label: 'Front of House', sub: 'Nasjonalmuseet', count: locationBreakdown.frontOfHouseCount, icon: Building, bg: 'bg-stone-100', hoverBg: 'group-hover:bg-stone-200', iconColor: 'text-stone-600' },
        { cat: 'nb' as const, label: 'Til Nasjonalbiblioteket', sub: 'Sendes til NB', count: locationBreakdown.nbCount, icon: Library, bg: 'bg-purple-50', hoverBg: 'group-hover:bg-purple-100', iconColor: 'text-purple-600', extra: 'border-l-4 border-l-purple-500' },
      ].map(({ cat, label, sub, count, icon: Icon, bg, hoverBg, iconColor, extra = '' }) => (
        <button
          key={cat}
          onClick={() => onLocationClick(cat)}
          className={`w-full p-4 rounded-2xl border bg-stone-50 border-stone-200 shadow-sm flex items-center justify-between hover:bg-stone-50 transition-all active:scale-[0.98] group text-left ${extra}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center ${hoverBg} transition-colors`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{label}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{sub}</p>
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-stone-900">{count}</div>
        </button>
      ))}
    </section>
  </div>
);
