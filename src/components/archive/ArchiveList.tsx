import React from "react";
import { Job } from "../../types";
import { formatDate, getLocationIndex, getTypeIndex, getPaletteColor, formatType, formatLocation, getBadgeStyle, isInternJob, isExternJob } from "../../utils/jobUtils";
import { useTheme } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";
import { MapPin, Camera, User, Database } from "lucide-react";

interface ArchiveListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export const ArchiveList: React.FC<ArchiveListProps> = ({ jobs, onSelectJob }) => {
  const { theme } = useTheme();
  const { jobOverrides } = useJobData();

  const badgeStyle = theme.cardSettings?.badgeStyle || 'solid';
  const applyBadgeStyle = (colorVar: string) => getBadgeStyle(badgeStyle, colorVar);

  if (jobs.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed rounded-2xl border-stone-100">
        <p className="text-stone-400 text-sm">Ingen arkiverte oppdrag funnet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map(job => {
        const props = job.all_properties || {};
        const loc = formatLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent", props, job.title);
        const locIndex = getLocationIndex(loc);
        const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
        
        const typeFotografering = props.type_fotografering || "";
        const formattedType = formatType(typeFotografering, props, job.title);
        const typeIndex = getTypeIndex(typeFotografering || "");
        const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);

        return (
          <button 
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="text-left transition-all group flex flex-col h-full overflow-hidden border border-stone-100 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-inset relative"
            style={{ 
              borderRadius: theme.cardSettings?.cardBorderRadius || '1rem',
              borderTop: `3px solid ${typeBg}`
            }}
          >
            {jobOverrides[job.id]?.sendToNB && (
              <div 
                className="absolute top-2 right-2 px-2 py-0.5 text-white text-[10px] font-black rounded shadow-sm z-10 border border-white/20"
                style={{ backgroundColor: theme.statusNB }}
              >
                NB
              </div>
            )}
            <div className="p-4 flex flex-col flex-1">
              <h4 className="font-bold transition-colors truncate mb-3 text-stone-900 group-hover:text-black">
                {job.title}
              </h4>
              
              <div className="mt-auto space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tight">
                  <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                  <span 
                    className="px-1.5 py-0.5 rounded font-bold truncate"
                    style={{ ...applyBadgeStyle(locBg), color: locText }}
                  >
                    {loc}
                  </span>
                </div>

                {formattedType && (
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tight">
                    <Camera className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                    <span 
                      className="px-1.5 py-0.5 rounded font-bold truncate"
                      style={{ ...applyBadgeStyle(typeBg), color: typeText }}
                    >
                      {formattedType}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tight">
                  <Database className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  {isInternJob(job) ? (
                    <span className="px-1.5 py-0.5 rounded font-bold bg-brand-internal/10 text-brand-internal border border-brand-internal/20">
                      Intern
                    </span>
                  ) : isExternJob(job) ? (
                    <span className="px-1.5 py-0.5 rounded font-bold bg-brand-external/10 text-brand-external border border-brand-external/20">
                      Ekstern
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded font-bold bg-stone-100 text-stone-400 border border-stone-200">
                      Ukjent
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tight">
                  <User className="w-3 h-3 shrink-0 text-stone-400" />
                  <span className="text-stone-600">{job.owner_names?.[0] || "Ufordelt"}</span>
                </div>

                <div className="pt-2 border-t border-stone-50 flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-stone-400">Fullført</span>
                  <span className="text-[10px] font-medium text-stone-600">{formatDate(props.closedate)}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
