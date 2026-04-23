import React from "react";
import { Camera, Map, Building, Library } from "lucide-react";

// Cool tones matching the location palette — spatial/geographical
export const WORKLOAD_COLORS: Record<string, string> = {
  "Studio & Digitalisering": "#5E88A8",
  "Ekstern Location":        "#5E9E8E",
  "Front of House":          "#C09878",
  "Annet":                   "#9BA0B8",
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

const LOCATION_CARDS = [
  { cat: 'studio'   as const, label: 'Studio & Digitalisering', sub: 'Seksjon Foto',    key: 'studioCount'       as const, color: "#5E88A8", icon: Camera  },
  { cat: 'location' as const, label: 'Ekstern Location',        sub: 'Utenfor huset',   key: 'locationCount'     as const, color: "#5E9E8E", icon: Map     },
  { cat: 'foh'      as const, label: 'Front of House',          sub: 'Nasjonalmuseet',  key: 'frontOfHouseCount' as const, color: "#C09878", icon: Building },
  { cat: 'nb'       as const, label: 'Til Nasjonalbiblioteket', sub: 'Sendes til NB',   key: 'nbCount'           as const, color: "#7B5EA0", icon: Library  },
];

export const WorkloadSidebar: React.FC<WorkloadSidebarProps> = ({
  workload,
  locationBreakdown,
  onLocationClick,
}) => (
  <div className="space-y-8">
    <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Arbeidsmengde (14 dager)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WORKLOAD_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
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
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ color: "#B85448", backgroundColor: "#B8544818" }}
                  >
                    {data.overdue} over frist
                  </span>
                )}
                <span className="text-stone-900">{data.total} totalt</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-stone-200 flex">
              {Object.entries(data.locations).map(([loc, count]) => {
                const maxTotal = workload[0]?.[1]?.total || 1;
                const width = `${((count as number) / maxTotal) * 100}%`;
                return (
                  <div
                    key={loc}
                    className="h-full transition-all duration-1000"
                    style={{ width, backgroundColor: WORKLOAD_COLORS[loc] ?? "#9BA0B8" }}
                    title={`${loc}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="space-y-4">
      {LOCATION_CARDS.map(({ cat, label, sub, key, color, icon: Icon }) => (
        <button
          key={cat}
          onClick={() => onLocationClick(cat)}
          className="w-full p-4 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm flex items-center justify-between transition-all active:scale-[0.98] group text-left hover:bg-stone-200"
          style={cat === 'nb' ? { borderLeftWidth: 4, borderLeftColor: color } : {}}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity group-hover:opacity-80"
              style={{ backgroundColor: color + "20" }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{label}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{sub}</p>
            </div>
          </div>
          <div className="text-2xl font-serif font-black text-stone-900">{locationBreakdown[key]}</div>
        </button>
      ))}
    </section>
  </div>
);
