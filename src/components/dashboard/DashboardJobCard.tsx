import React from "react";
import { Calendar as CalendarIcon, User, Sparkles } from "lucide-react";
import { Job } from "../../types";
import {
  splitTitle, formatDate, formatLocation, formatType,
  getDeadlineInfo, getLocationIndex, getTypeIndex,
  getPaletteColor, getBadgeStyle, getJobLocationStr, getJobTypeStr, parseDate, isJobNB as isJobNBUtil,
  getNMImage,
} from "../../utils/jobUtils";
import { useTheme } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";
import { NMObject } from "../../types/nmTypes";

interface AIRecommendation {
  name: string;
  reasons: string[];
}

interface DashboardJobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
  /** "weekly" — shows image indicators + progress. "distribution" — shows NB badge + AI section. */
  variant: 'weekly' | 'distribution';
  nmDataMap?: Record<string, NMObject>;
  dimuDataMap?: Record<string, string | null>;
  setPreviewImage?: (preview: { url: string; title: string } | null) => void;
  aiRecommendation?: AIRecommendation | null;
  isFetchingAI?: boolean;
  onFetchAI?: (e: React.MouseEvent, job: Job) => void;
}

export const DashboardJobCard: React.FC<DashboardJobCardProps> = ({
  job,
  onSelectJob,
  variant,
  nmDataMap = {},
  dimuDataMap = {},
  setPreviewImage,
  aiRecommendation,
  isFetchingAI,
  onFetchAI,
}) => {
  const { theme } = useTheme();
  const { jobOverrides, jobProgress } = useJobData();

  const props = job.all_properties || {};
  const { name } = splitTitle(job.title);
  const deadline = props.frist_for_fotografering || job.due_date;
  const deadlineInfo = getDeadlineInfo(deadline, theme);
  const loc = formatLocation(getJobLocationStr(props), props, job.title);
  const locIndex = getLocationIndex(loc);
  const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);

  const typeFotografering = getJobTypeStr(props);
  const override = jobOverrides[job.id];
  const formattedType = override?.customType || formatType(typeFotografering, props, job.title);
  const typeIndex = getTypeIndex(typeFotografering || "");
  const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);

  const cardBorderRadius = theme.cardSettings?.cardBorderRadius || '1rem';
  const badgeStyle = theme.cardSettings?.badgeStyle || 'solid';
  const applyBadgeStyle = (colorVar: string) => getBadgeStyle(badgeStyle, colorVar);

  const isNB = isJobNBUtil(job, jobOverrides);
  const progress = jobProgress[job.id];

  const isOverdue = deadlineInfo.diffInDays !== null && deadlineInfo.diffInDays < 0;
  const isCritical = deadlineInfo.diffInDays !== null && deadlineInfo.diffInDays >= 0 && deadlineInfo.diffInDays <= 1;
  const urgencyGlow = isOverdue
    ? `0 0 0 1px ${deadlineInfo.statusColor}40, 0 2px 8px ${deadlineInfo.statusColor}20`
    : isCritical
    ? `0 0 0 1px ${deadlineInfo.statusColor}30`
    : undefined;

  return (
    <div
      onClick={() => onSelectJob(job)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectJob(job); }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Se detaljer for ${name}`}
      className="card-job group"
      style={{ borderRadius: cardBorderRadius, borderTop: `3px solid ${deadlineInfo.statusColor || '#2E7D4F'}`, boxShadow: urgencyGlow }}
    >
      <div className="p-3 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-serif font-bold leading-tight transition-colors line-clamp-2 text-stone-900 group-hover:text-black">
          {name}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="badge-xs" style={{ ...applyBadgeStyle(locBg), color: locText }}>{loc}</span>
          {formattedType && (
            <span className="badge-xs" style={{ ...applyBadgeStyle(typeBg), color: typeText }}>{formattedType}</span>
          )}
          {variant === 'distribution' && isNB && (
            <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded bg-purple-100 text-purple-700 border border-purple-200">
              NB
            </span>
          )}
        </div>

        {/* Progress bar — weekly variant */}
        {variant === 'weekly' && progress && progress.totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-bold uppercase tracking-widest text-stone-400">Bilder tatt</span>
              <span className="text-[9px] font-bold tabular-nums" style={{ color: theme.statusProgress }}>
                {progress.doneCount}/{progress.totalCount}
              </span>
            </div>
            <div className="h-1 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (progress.doneCount / progress.totalCount) * 100)}%`,
                  backgroundColor: theme.statusProgress
                }}
              />
            </div>
          </div>
        )}

        {/* Image indicators — weekly variant */}
        {variant === 'weekly' && (
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
                      onClick={(e) => { e.stopPropagation(); setPreviewImage?.({ url: getNMImage(nmData)!, title: `Nasjonalmuseet: ${id}` }); }}
                      className="px-1 py-0.5 text-[7px] font-bold rounded border bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 transition-colors"
                    >M+</button>
                  )}
                  {hasDiMuImage && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewImage?.({ url: dimuImageUrl!, title: `Digitalt Museum: ${id}` }); }}
                      className="px-1 py-0.5 text-[7px] font-bold rounded border bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors"
                    >DM</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-tight text-stone-500">
              <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{formatDate(deadline)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-tight text-stone-500">
              <User className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{job.owner_names?.[0] || "Ufordelt"}</span>
            </div>
          </div>

          <div className="flex items-end gap-3 shrink-0">
            {variant === 'weekly' && (
              <>
                {deadline && (
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-base font-serif font-bold leading-none capitalize" style={{ color: deadlineInfo.statusColor }}>
                      {parseDate(deadline)?.toLocaleDateString('nb-NO', { weekday: 'long' }) || "-"}
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-widest mt-1" style={{ color: deadlineInfo.statusColor }}>
                      {isOverdue ? "over frist" : "frist"}
                    </span>
                  </div>
                )}
              </>
            )}

            {variant === 'distribution' && deadline && (
              <div className="flex flex-col items-end shrink-0">
                <span className="text-base font-serif font-bold leading-none capitalize" style={{ color: deadlineInfo.statusColor }}>
                  {formatDate(deadline)}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-widest mt-1" style={{ color: deadlineInfo.statusColor }}>
                  Frist
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI section — distribution variant */}
        {variant === 'distribution' && (
          <div className="pt-2 border-t border-stone-200/60 mt-1">
            {!aiRecommendation && !isFetchingAI && (
              <button
                onClick={(e) => onFetchAI?.(e, job)}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                AI Fordeling
              </button>
            )}
            {isFetchingAI && !aiRecommendation && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" /> AI Analyserer...
                </p>
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-5 h-5 rounded-full bg-stone-200"></div>
                  <div className="h-3 bg-stone-200 rounded w-24"></div>
                </div>
              </>
            )}
            {aiRecommendation && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" /> AI-forslag: Anbefalt fotograf
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center">
                      <User className="w-3 h-3 text-stone-500" />
                    </div>
                    <span className="text-xs font-medium text-stone-900">{aiRecommendation.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {aiRecommendation.reasons.map((reason, idx) => (
                      <span key={idx} className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
