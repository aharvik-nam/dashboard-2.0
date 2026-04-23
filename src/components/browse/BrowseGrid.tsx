import React from "react";
import { Job } from "../../types";
import { motion } from "motion/react";
import { Calendar, User, MapPin, FileText } from "lucide-react";
import { formatDate, getDeadlineInfo, splitTitle, getJobDate, getLocationIndex, getTypeIndex, getPaletteColor, formatType, formatLocation, getBadgeStyle, getCardSizeClasses } from "../../utils/jobUtils";
import { getNMImage } from "../../utils/nmUtils";
import { ThemeColors } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";
import { NMObject } from "../../types/nmTypes";

export interface BrowseGridProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
  nmDataMap: Record<string, NMObject>;
  dimuDataMap: Record<string, string | null>;
  setPreviewImage: (preview: { url: string; title: string } | null) => void;
}

export const BrowseGrid: React.FC<BrowseGridProps> = ({
  jobs,
  onSelectJob,
  theme,
  nmDataMap,
  dimuDataMap,
  setPreviewImage
}) => {
  const { jobOverrides, jobProgress } = useJobData();
  const { cardSettings } = theme;

  return (
    <div 
      className={`grid gap-6 ${!cardSettings?.cardWidth ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}
      style={cardSettings?.cardWidth ? {
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${cardSettings.cardWidth}px), 1fr))`
      } : undefined}
    >
      {jobs.map((job) => {
        const props = job.all_properties || {};
        const { name } = splitTitle(job.title);
        const deadline = getJobDate(job);
        const deadlineInfo = getDeadlineInfo(deadline, theme);
        const loc = formatLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent", props, job.title);
        const locIndex = getLocationIndex(loc);
        const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
        
        const typeFotografering = props.type_fotografering || "";
        const override = jobOverrides[job.id];
        const formattedType = override?.customType || formatType(typeFotografering, props, job.title);
        const technique = props.teknikk || "";
        const typeIndex = getTypeIndex(typeFotografering || "");
        const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);

        // Card Settings Logic
        const showLocation = cardSettings?.showLocation ?? true;
        const showType = cardSettings?.showType ?? true;
        const showTechnique = cardSettings?.showTechnique ?? true;
        const showDeadline = cardSettings?.showDeadline ?? true;
        const showOwner = cardSettings?.showOwner ?? true;
        const cardSize = cardSettings?.cardSize || 'normal';
        const cardShadow = cardSettings?.cardShadow || 'sm';
        const badgeStyle = cardSettings?.badgeStyle || 'solid';
        const cardBorderRadius = cardSettings?.cardBorderRadius || '1rem';

        const { padding: paddingClass, title: titleClass, gap: gapClass } = getCardSizeClasses(cardSize);

        const applyBadgeStyle = (colorVar: string) => getBadgeStyle(badgeStyle, colorVar);

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
            aria-label={`Se detaljer for ${name}`}
            className="card-job group"
            style={{ 
              borderRadius: cardBorderRadius,
              borderTop: `3px solid ${deadlineInfo.statusColor || '#2E7D4F'}`
            }}
          >
            {override?.sendToNB && (
              <div 
                className="absolute top-2 right-2 px-2 py-0.5 text-white text-[10px] font-black rounded shadow-lg z-20 border border-white/20"
                style={{ backgroundColor: theme.statusNB }}
              >
                NB
              </div>
            )}
            <div className="p-3 flex flex-col flex-1 gap-2">
              <h3 className="text-sm font-serif font-bold leading-tight transition-colors line-clamp-2 text-stone-900 group-hover:text-black">
                {name}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                {showLocation && loc && (
                  <span 
                    className="badge-xs"
                    style={{ ...applyBadgeStyle(locBg), color: locText }}
                  >
                    {loc}
                  </span>
                )}
                {showType && formattedType && (
                  <span 
                    className="badge-xs"
                    style={{ ...applyBadgeStyle(typeBg), color: typeText }}
                  >
                    {formattedType}
                  </span>
                )}
                {override?.sendToNB && (
                  <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded bg-purple-100 text-purple-700 border border-purple-200">
                    NB
                  </span>
                )}
              </div>

              {/* Image Indicators */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {job.nmids?.map(id => {
                  const nmData = nmDataMap[id];
                  const dimuImageUrl = dimuDataMap[id];
                  const hasNMImage = nmData && getNMImage(nmData);
                  const hasDiMuImage = !!dimuImageUrl;

                  if (!hasNMImage && !hasDiMuImage) return null;

                  return (
                    <div key={id} className="flex items-center gap-1">
                      {hasNMImage && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({ url: getNMImage(nmData)!, title: `Nasjonalmuseet: ${id}` });
                          }}
                          className="px-1 py-0.5 text-[7px] font-bold rounded border bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 transition-colors"
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
                          className="px-1 py-0.5 text-[7px] font-bold rounded border bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors"
                          title="Vis bilde fra Digitalt Museum"
                        >
                          DM
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-tight text-stone-500">
                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{formatDate(deadline)}</span>
                  </div>
                  {showOwner && (
                    <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-tight text-stone-500">
                      <User className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{job.owner_names?.[0] || "Ufordelt"}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-3 shrink-0">
                  {/* Progress Indicator */}
                  {jobProgress?.[job.id] && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-base font-serif font-bold leading-none" style={{ color: theme.statusProgress }}>
                        {jobProgress[job.id].doneCount}/{jobProgress[job.id].totalCount}
                      </span>
                      <span className="text-[7px] font-bold uppercase tracking-widest text-stone-400 mt-1">Bilder tatt</span>
                    </div>
                  )}
                  
                  {/* Human Readable Days Display */}
                  {showDeadline && deadline && (
                    <div className="flex flex-col items-end shrink-0">
                      <span 
                        className="text-base font-serif font-bold leading-none capitalize"
                        style={{ color: deadlineInfo.statusColor }}
                      >
                        {deadlineInfo.diffInDays !== null 
                          ? (deadlineInfo.diffInDays === 0 ? "I dag" : Math.abs(deadlineInfo.diffInDays))
                          : "-"}
                      </span>
                      <span 
                        className="text-[7px] font-bold uppercase tracking-widest mt-1"
                        style={{ color: deadlineInfo.statusColor }}
                      >
                        {deadlineInfo.diffInDays !== null 
                          ? (deadlineInfo.diffInDays < 0 ? "dager over" : deadlineInfo.diffInDays === 0 ? "frist" : "dager til frist") 
                          : "frist"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
