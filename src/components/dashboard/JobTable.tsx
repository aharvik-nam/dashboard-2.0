import React, { useState } from "react";
import { Job } from "../../types";
import { Clock, MapPin, Camera, User } from "lucide-react";
import { getLocationIndex, getTypeIndex, getPaletteColor, formatType, formatLocation, getBadgeStyle } from "../../utils/jobUtils";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useTheme } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";
import { useNMData } from "../../hooks/useNMData";
import { useDiMuData } from "../../hooks/useDiMuData";
import { getNMImage } from "../../utils/nmUtils";
import { ImagePreviewModal } from "../ui/ImagePreviewModal";

interface JobTableProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  title: string;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onSelectJob,
  title,
}) => {
  const { theme } = useTheme();
  const { jobOverrides, jobProgress } = useJobData();
  const badgeStyle = theme.cardSettings?.badgeStyle || 'solid';
  const applyBadgeStyle = (colorVar: string) => getBadgeStyle(badgeStyle, colorVar);

  // Collect all unique NM IDs from the jobs for indicators
  const allNmIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(jobs)) {
      jobs.forEach(job => {
        if (job.nmids) {
          job.nmids.forEach(id => ids.add(id));
        }
      });
    }
    return Array.from(ids);
  }, [jobs]);

  const { nmDataMap } = useNMData(allNmIds);
  const { dimuDataMap } = useDiMuData(allNmIds);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);


  return (
    <Card className="bg-stone-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stone-100">
            <Clock className="w-4 h-4 text-stone-900" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">{title}</h3>
        </div>
        <Badge variant="inverted">
          {jobs.length} oppdrag
        </Badge>
      </div>

      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {jobs.map(job => {
            const props = job.all_properties || {};
            const loc = formatLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent", props, job.title);
            const locIndex = getLocationIndex(loc);
            const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
            
            const typeFotografering = props.type_fotografering || "";
            const override = jobOverrides[job.id];
            const formattedType = override?.customType || formatType(typeFotografering, props, job.title);
            const typeIndex = getTypeIndex(typeFotografering || "");
            const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);

            return (
              <div 
                key={job.id}
                onClick={() => onSelectJob(job)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectJob(job);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Se detaljer for ${job.title}`}
                className="text-left transition-all group flex flex-col h-full overflow-hidden border border-stone-200 hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-inset cursor-pointer"
                style={{ 
                  borderRadius: theme.cardSettings?.cardBorderRadius || '1rem',
                  borderTop: `3px solid ${typeBg}`
                }}
              >
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold transition-colors truncate mb-3 text-stone-900 group-hover:text-stone-950">
                    {job.title}
                  </h4>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-tight">
                      <User className="w-3 h-3 shrink-0 text-stone-400" />
                      <span className="text-stone-600 font-bold truncate">
                        {job.owner_names?.[0] || "Ufordelt"}
                      </span>
                    </div>

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
                        
                        {/* Image Indicators */}
                        <div className="flex items-center gap-1 ml-auto">
                          {jobProgress?.[job.id] && (
                            <span 
                              className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded text-white mr-1"
                              style={{ backgroundColor: theme.statusProgress }}
                            >
                              {jobProgress[job.id].doneCount}/{jobProgress[job.id].totalCount}
                            </span>
                          )}
                          {job.nmids?.map(id => {
                            const nmData = nmDataMap[id];
                            const dimuImageUrl = dimuDataMap[id];
                            const hasNMImage = nmData && getNMImage(nmData);
                            const hasDiMuImage = !!dimuImageUrl;

                            if (!hasNMImage && !hasDiMuImage) return null;

                            return (
                              <React.Fragment key={id}>
                                {hasNMImage && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage({ url: getNMImage(nmData)!, title: `Nasjonalmuseet: ${id}` });
                                    }}
                                    className="px-1 py-0.5 text-[8px] font-bold rounded border bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 transition-colors"
                                    title="Vis bilde fra Nasjonalmuseet"
                                  >
                                    M+
                                  </button>
                                )}
                                {hasDiMuImage && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage({ url: dimuImageUrl, title: `Digitalt Museum: ${id}` });
                                    }}
                                    className="px-1 py-0.5 text-[8px] font-bold rounded border bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors"
                                    title="Vis bilde fra Digitalt Museum"
                                  >
                                    DM
                                  </button>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed rounded-2xl border-stone-100">
          <p className="text-stone-400 text-sm">Ingen planlagte oppdrag for i dag.</p>
        </div>
      )}
      
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />
    </Card>
  );
};
