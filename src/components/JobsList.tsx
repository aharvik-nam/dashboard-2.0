import React from "react";
import { Job } from "../types";
import { Calendar, ChevronRight, Tag, User, Clock, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { formatDate, getDeadlineInfo, splitTitle, getLocationIndex, getPaletteColor, shortenLocation } from "../utils/jobUtils";
import { useTheme } from "../context/ThemeContext";

interface JobsListProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (job: Job) => void;
  loading: boolean;
  jobOverrides?: Record<string, { sendToNB?: boolean }>;
}

export const JobsList: React.FC<JobsListProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  loading,
  jobOverrides = {},
}) => {
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p>Ingen aktive oppdrag funnet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-3 pb-20 md:pb-3">
      {jobs.map((job) => {
        const props = job.all_properties || {};
        // Samme logikk som i App.tsx for konsistens
        const deadline = props.frist_for_fotografering || 
                         props.dato_og_klokkeslett || 
                         job.deadline || 
                         job.due_date;
        const deadlineInfo = getDeadlineInfo(deadline, theme);
        const { name } = splitTitle(job.title);
        const loc = shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "");
        const locIndex = getLocationIndex(loc);
        const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);

        return (
          <motion.button
            key={job.id}
            whileHover={{ y: -2 }}
            onClick={() => onSelectJob(job)}
            className={`p-4 text-left rounded-xl border transition-all flex items-center justify-between group relative overflow-hidden shrink-0 min-h-[88px] shadow-sm ${
              selectedJobId === job.id 
                ? "border-stone-900 ring-1 ring-stone-900 shadow-md z-10"
                : "border-stone-200 hover:border-stone-300 hover:shadow-md"
            }`}
            style={{ 
              backgroundColor: locBg,
              borderTop: `3px solid ${deadlineInfo.statusColor || '#2E7D4F'}`
            }}
          >
            {jobOverrides[job.id]?.sendToNB && (
              <div 
                className="absolute top-0 right-0 px-2 py-0.5 text-white text-[9px] font-black rounded-bl z-20 shadow-sm border-l border-b border-white/20"
                style={{ backgroundColor: theme.statusNB }}
              >
                NB
              </div>
            )}
            <div className="flex-1 min-w-0 pl-2 pr-4">
              <h3 className={`font-serif font-bold truncate leading-tight ${
                selectedJobId === job.id 
                  ? "text-text-primary" 
                  : "text-text-secondary"
              }`}>
                {name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-3">
                <div 
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm bg-stone-50/50 text-text-muted"
                  title="Frist for fotografering"
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(deadline)}</span>
                </div>
                
                {loc && (
                  <div 
                    className="flex items-center gap-1 text-[10px] truncate backdrop-blur-sm px-2 py-1 rounded-md"
                    style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: locText }}
                  >
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{loc}</span>
                  </div>
                )}

                {job.owner_names && job.owner_names.length > 0 && (
                  <div 
                    className="flex items-center gap-1 text-[10px] truncate backdrop-blur-sm px-2 py-1 rounded-md bg-stone-50/50 text-[#4d4d4d]"
                  >
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{job.owner_names[0]}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm bg-stone-50/50 text-text-muted group-hover:text-text-secondary">
                <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
