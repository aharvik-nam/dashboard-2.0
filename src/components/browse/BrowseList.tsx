import React, { useState } from "react";
import { Job } from "../../types";
import { getDeadlineInfo, splitTitle, getJobDate, formatType, formatLocation } from "../../utils/jobUtils";
import { ThemeColors } from "../../context/ThemeContext";
import { useJobData } from "../../context/JobDataContext";

const MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const ACCENT = '#d97757';

export interface BrowseListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
}

function TableRow({ job, onSelectJob, theme, stripe }: {
  job: Job;
  onSelectJob: (job: Job) => void;
  theme: ThemeColors;
  stripe: boolean;
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

  const rowBg = hovered
    ? panelBg
    : stripe
    ? `${border}55`
    : bg;

  return (
    <tr
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: rowBg,
        cursor: "pointer",
        transition: "background .1s",
        borderBottom: `1px solid ${border}`,
      }}
    >
      {/* ID */}
      <td style={{ padding: "9px 12px", fontFamily: MONO, fontSize: 10, color: ink3, whiteSpace: "nowrap" }}>
        {job.id}
      </td>

      {/* NB badge */}
      <td style={{ padding: "9px 6px", width: 24 }}>
        {override?.sendToNB && (
          <span style={{
            display: "inline-block",
            fontFamily: MONO, fontSize: 9, fontWeight: 700,
            padding: "1px 5px", borderRadius: 3,
            background: `${theme.statusNB}22`,
            color: theme.statusNB,
            letterSpacing: "0.06em",
          }}>NB</span>
        )}
      </td>

      {/* Title */}
      <td style={{ padding: "9px 12px", maxWidth: 300 }}>
        <div style={{
          fontFamily: SANS, fontSize: 13, fontWeight: 600,
          color: ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name}
        </div>
        {progress && progress.totalCount > 0 && (
          <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 2, background: border, borderRadius: 1, maxWidth: 80 }}>
              <div style={{
                height: "100%", borderRadius: 1,
                background: theme.statusWithin,
                width: `${(progress.doneCount / progress.totalCount) * 100}%`,
                transition: "width .3s",
              }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 9, color: ink3 }}>
              {progress.doneCount}/{progress.totalCount}
            </span>
          </div>
        )}
      </td>

      {/* Photographer */}
      <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%",
            background: ACCENT, color: "#2a251c",
            fontSize: 9, fontWeight: 700, fontFamily: MONO,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {ownerInitials}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: ink2, whiteSpace: "nowrap" }}>
            {owner.split(" ")[0]}
          </span>
        </div>
      </td>

      {/* Type */}
      <td style={{ padding: "9px 12px" }}>
        {formattedType ? (
          <span style={{
            fontFamily: MONO, fontSize: 10, color: ink2,
            background: panelBg, border: `1px solid ${border}`,
            borderRadius: 3, padding: "2px 7px",
            whiteSpace: "nowrap", letterSpacing: "0.04em",
          }}>
            {formattedType.slice(0, 20)}
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: ink3 }}>—</span>
        )}
      </td>

      {/* Location */}
      <td style={{ padding: "9px 12px" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: ink2 }}>
          {loc || "—"}
        </span>
      </td>

      {/* Deadline */}
      <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
        {deadline ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            color: deadlineInfo.statusColor,
            background: `${deadlineInfo.statusColor}18`,
            border: `1px solid ${deadlineInfo.statusColor}44`,
            borderRadius: 3, padding: "2px 8px",
            letterSpacing: "0.04em",
          }}>
            {deadlineInfo.label}
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: ink3 }}>—</span>
        )}
      </td>

      {/* Arrow */}
      <td style={{ padding: "9px 12px", width: 24, textAlign: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: hovered ? ink : ink3, transition: "color .1s" }}>›</span>
      </td>
    </tr>
  );
}

export const BrowseList: React.FC<BrowseListProps> = ({ jobs, onSelectJob, theme }) => {
  const border = theme.stone200;
  const panelBg = theme.stone100;
  const ink3 = theme.textColorMuted;
  const bg = theme.stone50;

  const COL_HEAD: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: 600,
    color: ink3,
    letterSpacing: "0.08em",
    padding: "8px 12px",
    textAlign: "left" as const,
    borderBottom: `1px solid ${border}`,
    background: panelBg,
    whiteSpace: "nowrap" as const,
    userSelect: "none" as const,
  };

  return (
    <div style={{ background: bg, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        <thead>
          <tr>
            <th style={COL_HEAD}>ID</th>
            <th style={{ ...COL_HEAD, width: 24 }}></th>
            <th style={COL_HEAD}>NAVN</th>
            <th style={COL_HEAD}>FOTOGRAF</th>
            <th style={COL_HEAD}>TYPE</th>
            <th style={COL_HEAD}>LOKASJON</th>
            <th style={COL_HEAD}>FRIST</th>
            <th style={{ ...COL_HEAD, width: 24 }}></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <TableRow
              key={job.id}
              job={job}
              onSelectJob={onSelectJob}
              theme={theme}
              stripe={i % 2 === 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
