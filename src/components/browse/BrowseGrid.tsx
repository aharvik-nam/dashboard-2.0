import React, { useState } from "react";
import { Job } from "../../types";
import { getDeadlineInfo, splitTitle, getJobDate, formatType, formatLocation } from "../../utils/jobUtils";
import { getNMImage } from "../../utils/nmUtils";
import { ThemeColors } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";
import { NMObject } from "../../types/nmTypes";

const MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const ACCENT = '#d97757';

export interface BrowseGridProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
  nmDataMap: Record<string, NMObject>;
  dimuDataMap: Record<string, string | null>;
  setPreviewImage: (preview: { url: string; title: string } | null) => void;
}

function GridCard({ job, onSelectJob, theme, nmDataMap, dimuDataMap, setPreviewImage }: {
  job: Job;
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
  nmDataMap: Record<string, NMObject>;
  dimuDataMap: Record<string, string | null>;
  setPreviewImage: (preview: { url: string; title: string } | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { jobOverrides, jobProgress } = useJobData();

  const props = job.all_properties || {};
  const { name } = splitTitle(job.title);
  const deadline = getJobDate(job);
  const deadlineInfo = getDeadlineInfo(deadline, theme);
  const loc = formatLocation(
    props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "",
    props,
    job.title
  );
  const override = jobOverrides[job.id];
  const formattedType = override?.customType || formatType(props.type_fotografering || "", props, job.title);
  const owner = job.owner_names?.[0] || "—";
  const ownerInitials = owner !== "—"
    ? owner.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const progress = jobProgress?.[job.id];

  const bg = theme.stone50;
  const panelBg = theme.stone100;
  const border = theme.stone200;
  const ink = theme.textColorPrimary;
  const ink2 = theme.textColorSecondary;
  const ink3 = theme.textColorMuted;

  // Image indicators
  const imageIndicators = (job.nmids || []).flatMap(id => {
    const nmData = nmDataMap[id];
    const dimuImageUrl = dimuDataMap[id];
    const hasNMImage = nmData && getNMImage(nmData);
    const hasDiMuImage = !!dimuImageUrl;
    const indicators = [];
    if (hasNMImage) indicators.push({ type: 'NM', id, url: getNMImage(nmData)!, label: 'Nasjonalmuseet' });
    if (hasDiMuImage) indicators.push({ type: 'DM', id, url: dimuImageUrl!, label: 'Digitalt Museum' });
    return indicators;
  });

  return (
    <div
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? panelBg : bg,
        border: `1px solid ${hovered ? ink3 : border}`,
        borderTop: `2px solid ${deadlineInfo.statusColor || border}`,
        borderRadius: 6,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "background .12s, border-color .12s, transform .12s, box-shadow .12s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 4px 12px ${ink}14` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
    >
      {/* NB badge */}
      {override?.sendToNB && (
        <span style={{
          position: "absolute", top: 8, right: 8,
          fontFamily: MONO, fontSize: 8, fontWeight: 700,
          padding: "2px 5px", borderRadius: 3,
          background: theme.statusNB,
          color: "#fff",
          letterSpacing: "0.08em",
        }}>NB</span>
      )}

      {/* ID */}
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: ink3, letterSpacing: "0.06em" }}>
        {job.id}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        color: ink, lineHeight: 1.3,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {name}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {formattedType && (
          <span style={{
            fontFamily: MONO, fontSize: 9.5, color: ink2,
            background: `${border}88`,
            border: `1px solid ${border}`,
            borderRadius: 3, padding: "2px 6px",
            letterSpacing: "0.04em",
          }}>
            {formattedType.slice(0, 18)}
          </span>
        )}
        {loc && (
          <span style={{
            fontFamily: MONO, fontSize: 9.5, color: ink3,
            background: "transparent",
            border: `1px solid ${border}`,
            borderRadius: 3, padding: "2px 6px",
            letterSpacing: "0.04em",
          }}>
            {loc.slice(0, 16)}
          </span>
        )}
      </div>

      {/* Image indicators */}
      {imageIndicators.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {imageIndicators.map((ind, idx) => (
            <button
              key={idx}
              onClick={e => {
                e.stopPropagation();
                setPreviewImage({ url: ind.url, title: `${ind.label}: ${ind.id}` });
              }}
              style={{
                fontFamily: MONO, fontSize: 8, fontWeight: 700,
                padding: "2px 5px", borderRadius: 3,
                background: ind.type === 'NM' ? `${theme.statusWithin}22` : `${theme.statusProgress}22`,
                color: ind.type === 'NM' ? theme.statusWithin : theme.statusProgress,
                border: `1px solid ${ind.type === 'NM' ? theme.statusWithin : theme.statusProgress}44`,
                cursor: "pointer", letterSpacing: "0.06em",
              }}
            >
              {ind.type}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {progress && progress.totalCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 2, background: border, borderRadius: 1 }}>
            <div style={{
              height: "100%", borderRadius: 1,
              background: theme.statusWithin,
              width: `${(progress.doneCount / progress.totalCount) * 100}%`,
              transition: "width .3s",
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 9, color: ink3, whiteSpace: "nowrap" }}>
            {progress.doneCount}/{progress.totalCount}
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: "auto", paddingTop: 6,
        borderTop: `1px solid ${border}`,
      }}>
        {/* Owner */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%",
            background: ACCENT, color: "#2a251c",
            fontSize: 9, fontWeight: 700, fontFamily: MONO,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {ownerInitials}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: ink3 }}>
            {owner.split(" ")[0]}
          </span>
        </div>

        {/* Deadline */}
        {deadline ? (
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            color: deadlineInfo.statusColor,
            letterSpacing: "0.04em",
          }}>
            {deadlineInfo.diffInDays !== null
              ? deadlineInfo.diffInDays === 0
                ? "I DAG"
                : deadlineInfo.diffInDays > 0
                  ? `${deadlineInfo.diffInDays}D`
                  : `+${Math.abs(deadlineInfo.diffInDays)}D`
              : "—"}
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: ink3 }}>—</span>
        )}
      </div>
    </div>
  );
}

export const BrowseGrid: React.FC<BrowseGridProps> = ({
  jobs,
  onSelectJob,
  theme,
  nmDataMap,
  dimuDataMap,
  setPreviewImage,
}) => {
  const cardWidth = theme.cardSettings?.cardWidth;

  return (
    <div style={{
      display: "grid",
      gap: 12,
      gridTemplateColumns: cardWidth
        ? `repeat(auto-fill, minmax(min(100%, ${cardWidth}px), 1fr))`
        : "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
    }}>
      {jobs.map(job => (
        <GridCard
          key={job.id}
          job={job}
          onSelectJob={onSelectJob}
          theme={theme}
          nmDataMap={nmDataMap}
          dimuDataMap={dimuDataMap}
          setPreviewImage={setPreviewImage}
        />
      ))}
    </div>
  );
};
