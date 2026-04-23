import React from "react";
import { Job } from "../../types";
import { motion } from "motion/react";
import { Calendar, User, MapPin, FileText, ChevronRight } from "lucide-react";
import { formatDate, getDeadlineInfo, splitTitle, getJobDate, getLocationIndex, getTypeIndex, getPaletteColor, formatType, formatLocation } from "../../utils/jobUtils";
import { ThemeColors } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";

export interface BrowseListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
}

export const BrowseList: React.FC<BrowseListProps> = ({
  jobs,
  onSelectJob,
  theme,
}) => {
  const { jobOverrides, jobProgress } = useJobData();
  return (
    <div className="flex flex-col gap-2">
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
        const typeIndex = getTypeIndex(typeFotografering || "");
        const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);

        return (
          <motion.button
            key={job.id}
            whileHover={{ x: 4, backgroundColor: 'rgba(250, 250, 249, 1)' }}
            onClick={() => onSelectJob(job)}
            className="group flex items-center justify-between p-4 bg-stone-50 border border-stone-200/60 rounded-xl transition-all text-left relative overflow-hidden"
          >
            {override?.sendToNB && (
              <div 
                className="absolute top-0 right-0 px-2 py-0.5 text-white text-[8px] font-black rounded-bl shadow-sm z-10"
                style={{ backgroundColor: theme.statusNB }}
              >
                NB
              </div>
            )}
            {/* Progress Bar (Bottom Edge) */}
            {jobProgress[job.id] && jobProgress[job.id].totalCount > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(jobProgress[job.id].doneCount / jobProgress[job.id].totalCount) * 100}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Title & Owner */}
              <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                <h3 className="font-medium text-stone-900 truncate group-hover:text-stone-600 transition-colors">
                  {name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate">{props.hubspot_owner_id || "Ufordelt"}</span>
                </div>
              </div>

              {/* Location & Type Badges */}
              <div className="hidden md:flex items-center gap-3 w-[300px] shrink-0">
                {loc && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider truncate max-w-[140px]"
                    style={{ backgroundColor: locBg, color: locText }}
                  >
                    <MapPin className="w-3 h-3 opacity-70 shrink-0" />
                    <span className="truncate">{loc}</span>
                  </span>
                )}
                {formattedType && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider truncate max-w-[140px]"
                    style={{ backgroundColor: typeBg, color: typeText }}
                  >
                    <FileText className="w-3 h-3 opacity-70 shrink-0" />
                    <span className="truncate">{formattedType}</span>
                  </span>
                )}
              </div>

              {/* Deadline */}
              <div className="hidden sm:flex items-center justify-end w-[140px] shrink-0">
                {deadlineInfo && (
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
                    style={{ 
                      backgroundColor: deadlineInfo.statusColor, 
                      color: deadlineInfo.statusTextColor,
                      borderColor: deadlineInfo.statusColor
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{deadlineInfo.label}</span>
                  </div>
                )}
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-600 transition-colors ml-4 shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
};
