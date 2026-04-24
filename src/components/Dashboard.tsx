import React, { useMemo, useState, useCallback } from "react";
import { Job } from "../types";
import { WORKLOAD_COLORS } from "./dashboard/WorkloadSidebar";
import { parseDate, getJobLocationStr, getJobDeadlineStr, getJobTypeStr, isJobNB as isJobNBUtil, formatDate } from "../utils/jobUtils";
import { DateFilter } from "../hooks/useJobFilters";
import { useTheme } from "../context/ThemeContext";
import { useJobData } from "../context/JobDataContext";
import { RefreshCw, Search, X, BookOpen } from "lucide-react";
import { DopPill, DopStatCard, dopSmallcap } from "./dop/DopPrimitives";

// ─── Types ──────────────────────────────────────────────────────────────────
interface DashboardProps {
  jobs: Job[];
  historicalJobs?: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  selectedLocations?: string[];
  setSelectedLocations?: (locations: string[]) => void;
  uniqueLocations?: string[];
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  onNavigateToBrowse?: (filter: DateFilter) => void;
  loading?: boolean;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onRefresh?: () => void;
  clearFilters?: () => void;
}

// ─── Token helpers ───────────────────────────────────────────────────────────
const MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';

function getJobPriority(job: Job, today: Date): 'critical' | 'high' | 'medium' | 'today' | 'soon' | 'later' {
  const props = job.all_properties || {};
  const deadlineStr = getJobDeadlineStr(props, job);
  const deadline = parseDate(deadlineStr);
  if (!deadline) return 'later';
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
  if (diff < -60) return 'critical';
  if (diff < 0) return 'high';
  if (diff === 0) return 'today';
  if (diff <= 3) return 'soon';
  if (diff <= 10) return 'medium';
  return 'later';
}

function getDaysOverdue(job: Job, today: Date): number {
  const props = job.all_properties || {};
  const deadlineStr = getJobDeadlineStr(props, job);
  const deadline = parseDate(deadlineStr);
  if (!deadline) return 0;
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return -Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24)); // positive = overdue
}

// ─── CmdBar ─────────────────────────────────────────────────────────────────
function DopCmdbar({ title, subtitle, bg, borderColor, textPrimary, textMuted, searchTerm, setSearchTerm, onRefresh }: {
  title: string; subtitle: string;
  bg: string; borderColor: string; textPrimary: string; textMuted: string;
  searchTerm?: string; setSearchTerm?: (s: string) => void;
  onRefresh?: () => void;
}) {
  return (
    <div style={{
      borderBottom: `1px solid ${borderColor}`,
      padding: '10px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: bg,
      color: textPrimary,
      flexWrap: 'wrap',
      flexShrink: 0,
    }}>
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: SANS }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: textMuted, letterSpacing: '0.05em', marginTop: 1 }}>{subtitle}</div>
      </div>
      {/* Search */}
      <div style={{ position: 'relative', flex: '0 1 260px', minWidth: 160 }}>
        <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Søk kunde, inv.nr…"
          value={searchTerm || ''}
          onChange={e => setSearchTerm?.(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: 28, paddingRight: searchTerm ? 28 : 10, paddingTop: 6, paddingBottom: 6,
            border: `1px solid ${borderColor}`,
            borderRadius: 5,
            background: bg,
            fontFamily: MONO, fontSize: 11,
            color: textPrimary,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm?.('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </button>
        )}
      </div>
      {onRefresh && (
        <button onClick={onRefresh} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center', padding: '6px 4px' }} title="Oppdater data">
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Table row (Dagens Oppgaver) ─────────────────────────────────────────────
function TodayRow({ job, index, onSelectJob, bg, panelBg, borderColor, textPrimary, textSecondary, textMuted, okColor, okBg }: {
  job: Job; index: number; onSelectJob: (job: Job) => void;
  bg: string; panelBg: string; borderColor: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  okColor: string; okBg: string;
}) {
  const [h, setH] = useState(false);
  const [checked, setChecked] = useState(false);
  const props = job.all_properties || {};
  const deadline = getJobDeadlineStr(props, job);
  const typeStr = getJobTypeStr(props) || (job.type || '—');
  const location = getJobLocationStr(props);
  const client = job.title?.split(' - ')[0] || job.title || '—';
  const owner = job.owner_names?.[0] || '—';

  return (
    <div
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 20px 1.4fr 0.9fr 90px 90px 100px 70px',
        padding: '8px 14px',
        borderBottom: `1px solid ${borderColor}`,
        alignItems: 'center',
        fontSize: 12.5,
        background: h ? bg : panelBg,
        cursor: 'pointer',
        transition: 'background .1s',
        gap: 8,
        fontFamily: SANS,
      }}
    >
      <input type="checkbox" checked={checked} onChange={e => { e.stopPropagation(); setChecked(e.target.checked); }} onClick={e => e.stopPropagation()} style={{ margin: 0, accentColor: '#d97757', flexShrink: 0 }} />
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: textMuted }}>{String(index + 1).padStart(2, '0')}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: textMuted, marginTop: 1 }}>{job.id}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
        {typeStr && <DopPill bg={bg} fg={textSecondary}>{typeStr.slice(0, 14)}</DopPill>}
        {location && <DopPill bg={bg} fg={textMuted}>{location.slice(0, 12)}</DopPill>}
      </div>
      <div style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontSize: 12, textAlign: 'right', color: textSecondary }}>{owner.split(' ').map(w => w[0]).join('')}</div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, textAlign: 'right', color: textSecondary }}>{deadline ? formatDate(deadline) : '—'}</div>
      <div style={{ textAlign: 'right' }}><DopPill bg={okBg} fg={okColor} bold>I DAG</DopPill></div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontFamily: MONO, fontSize: 10, padding: '3px 8px', border: `1px solid ${borderColor}`, borderRadius: 3, background: panelBg, color: textSecondary, whiteSpace: 'nowrap' }}>ÅPNE →</span>
      </div>
    </div>
  );
}

// ─── Compact overdue row (Kritisk / Kommende) ────────────────────────────────
function CompactRow({ job, onSelectJob, rightText, rightColor, bg, panelBg, borderColor, textPrimary, textMuted }: {
  job: Job; onSelectJob: (job: Job) => void;
  rightText: string; rightColor: string;
  bg: string; panelBg: string; borderColor: string;
  textPrimary: string; textMuted: string;
}) {
  const [h, setH] = useState(false);
  const props = job.all_properties || {};
  const typeStr = getJobTypeStr(props) || (job.type || '');
  const client = job.title?.split(' - ')[0] || job.title || '—';
  const owner = job.owner_names?.[0] || '';
  const ownerInitials = owner.split(' ').map(w => w[0]).join('');

  return (
    <div
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 60px',
        padding: '7px 14px',
        borderBottom: `1px solid ${borderColor}`,
        alignItems: 'center',
        fontSize: 12.5,
        gap: 10,
        cursor: 'pointer',
        background: h ? bg : panelBg,
        transition: 'background .1s',
        fontFamily: SANS,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: textMuted, marginTop: 1 }}>{ownerInitials} · {typeStr}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: rightColor, textAlign: 'right' }}>{rightText}</div>
    </div>
  );
}

// ─── Week row ────────────────────────────────────────────────────────────────
function WeekRow({ job, dayLabel, onSelectJob, bg, panelBg, borderColor, textPrimary, textMuted, pillBg, pillFg, pillText }: {
  job: Job; dayLabel: string; onSelectJob: (job: Job) => void;
  bg: string; panelBg: string; borderColor: string;
  textPrimary: string; textMuted: string;
  pillBg: string; pillFg: string; pillText: string;
}) {
  const [h, setH] = useState(false);
  const props = job.all_properties || {};
  const typeStr = getJobTypeStr(props) || (job.type || '');
  const client = job.title?.split(' - ')[0] || job.title || '—';
  const owner = job.owner_names?.[0] || '';
  const ownerInitials = owner.split(' ').map(w => w[0]).join('');

  return (
    <div
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '54px 1fr 80px',
        padding: '7px 14px',
        borderBottom: `1px solid ${borderColor}`,
        alignItems: 'center',
        fontSize: 12.5,
        gap: 10,
        cursor: 'pointer',
        background: h ? bg : panelBg,
        transition: 'background .1s',
        fontFamily: SANS,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, color: textPrimary, fontWeight: 600 }}>{dayLabel}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: textMuted, marginTop: 1 }}>{ownerInitials} · {typeStr}</div>
      </div>
      <div style={{ textAlign: 'right' }}><DopPill bg={pillBg} fg={pillFg} bold>{pillText}</DopPill></div>
    </div>
  );
}

// ─── Workload table row ──────────────────────────────────────────────────────
function WorkloadRow({ owner, data, borderColor, textPrimary, textMuted, criticalColor, warnColor, okColor, bg }: {
  owner: string; data: { total: number; overdue: number; locations: Record<string, number> };
  borderColor: string; textPrimary: string; textMuted: string;
  criticalColor: string; warnColor: string; okColor: string; bg: string;
}) {
  const [h, setH] = useState(false);
  const locKeys = Object.keys(WORKLOAD_COLORS);
  const total = data.total || 1;

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 50px 1fr 60px 50px 50px',
        padding: '8px 14px',
        borderBottom: `1px solid ${borderColor}`,
        alignItems: 'center',
        fontSize: 12.5,
        gap: 12,
        cursor: 'pointer',
        transition: 'background .1s',
        background: h ? bg : 'transparent',
        fontFamily: SANS,
      }}
    >
      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{owner}</div>
      <div style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{data.total}</div>
      <div style={{ display: 'flex', height: 10, borderRadius: 2, overflow: 'hidden', background: bg }}>
        {Object.entries(WORKLOAD_COLORS).map(([loc, color]) => {
          const count = data.locations?.[loc] || 0;
          return count > 0 ? (
            <div key={loc} style={{ flex: count, background: color }} title={`${loc}: ${count}`} />
          ) : null;
        })}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, textAlign: 'right', color: criticalColor, fontWeight: 600 }}>{data.overdue}</div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, textAlign: 'right', color: warnColor }}>{data.locations?.['Front of House'] || 0}</div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, textAlign: 'right', color: okColor }}>{data.total - data.overdue}</div>
    </div>
  );
}

// ─── Section header (panel card header) ──────────────────────────────────────
function SectionHead({ label, children, panelBg, borderColor, textPrimary }: {
  label: string; children?: React.ReactNode;
  panelBg: string; borderColor: string; textPrimary: string;
}) {
  return (
    <div style={{
      padding: '9px 14px',
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: panelBg,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: SANS, color: textPrimary }}>{label}</span>
      {children}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  historicalJobs = [],
  onSelectJob,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners = [],
  selectedLocations = [],
  setSelectedLocations,
  uniqueLocations = [],
  onNavigateToBrowse,
  loading = false,
  searchTerm = "",
  setSearchTerm,
  onRefresh,
  showNBOnly = false,
  setShowNBOnly,
  clearFilters
}) => {
  const { theme } = useTheme();
  const { jobOverrides } = useJobData();

  // Colors from theme
  const bg        = theme.stone50;
  const panelBg   = theme.stone100;
  const border    = theme.stone200;
  const textPrimary = theme.textColorPrimary;
  const textSecondary = theme.textColorSecondary;
  const textMuted = theme.textColorMuted;
  const critical  = theme.statusCritical;
  const critBg    = `${critical}1a`;  // ~10% alpha — adapts to dark mode
  const warn      = theme.statusOverdue;
  const warnBg    = `${warn}1a`;
  const ok        = theme.statusWithin;
  const okBg      = `${ok}1a`;
  const blue      = theme.statusProgress;
  const blueBg    = `${blue}1a`;
  const purpleBg  = `${theme.statusNB}1a`;

  const isJobNB = useCallback((job: Job) => isJobNBUtil(job, jobOverrides), [jobOverrides]);

  const visibleJobs = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    if (showNBOnly) return jobs;
    return jobs.filter(j => !isJobNB(j));
  }, [jobs, isJobNB, showNBOnly]);

  const statsJobs = useMemo(() => Array.isArray(jobs) ? jobs.filter(j => !isJobNB(j)) : [], [jobs, isJobNB]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Priority buckets
  const { criticalJobs, overdueJobs, todayJobs, upcomingJobs } = useMemo(() => {
    const critical: Job[] = [], overdue: Job[] = [], todayList: Job[] = [], upcoming: Job[] = [];
    visibleJobs.forEach(job => {
      const p = getJobPriority(job, today);
      if (p === 'critical') critical.push(job);
      else if (p === 'high') overdue.push(job);
      else if (p === 'today') todayList.push(job);
      else if (p === 'soon' || p === 'medium') upcoming.push(job);
    });
    return { criticalJobs: critical, overdueJobs: overdue, todayJobs: todayList, upcomingJobs: upcoming };
  }, [visibleJobs, today]);

  const onTimeCount = useMemo(() => visibleJobs.filter(j => {
    const p = getJobPriority(j, today);
    return p === 'today' || p === 'soon' || p === 'medium' || p === 'later';
  }).length, [visibleJobs, today]);

  // Workload (14 days, per owner)
  const workload = useMemo(() => {
    const endOf14Days = new Date(today);
    endOf14Days.setDate(today.getDate() + 14);
    const counts: Record<string, { total: number; overdue: number; locations: Record<string, number> }> = {};
    statsJobs.forEach(job => {
      const props = job.all_properties || {};
      const deadlineStr = getJobDeadlineStr(props, job);
      const deadline = parseDate(deadlineStr);
      if (deadline && deadline <= endOf14Days) {
        const isOverdue = deadline < today;
        const owner = job.owner_names?.[0] || "Ufordelt";
        const rawLoc = (getJobLocationStr(props)).toLowerCase();
        let locCategory = "Annet";
        if (rawLoc.includes("front of house")) locCategory = "Front of House";
        else if (rawLoc.includes("location") || rawLoc.includes("ute")) locCategory = "Ekstern Location";
        else if (rawLoc.includes("maleri") || rawLoc.includes("objekt") || rawLoc.includes("gjenstand") || rawLoc.includes("reprorom") || rawLoc.includes("kunst på papir") || rawLoc.includes("digitalisering")) locCategory = "Studio & Digitalisering";
        if (!counts[owner]) counts[owner] = { total: 0, overdue: 0, locations: {} };
        counts[owner].total++;
        if (isOverdue) counts[owner].overdue++;
        counts[owner].locations[locCategory] = (counts[owner].locations[locCategory] || 0) + 1;
      }
    });
    return Object.entries(counts).sort(([, a], [, b]) => b.total - a.total).slice(0, 8);
  }, [statsJobs, today]);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 42, borderRadius: 6, background: panelBg }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 6, background: panelBg }} />)}
        </div>
        <div style={{ height: 200, borderRadius: 6, background: panelBg }} />
        <div style={{ height: 160, borderRadius: 6, background: panelBg }} />
      </div>
    );
  }

  const title = selectedOwner && selectedOwner !== "all"
    ? `Oversikt · ${selectedOwner}`
    : "Oversikt · Seksjon Foto";

  const todayStr = new Date().toLocaleDateString("nb-NO", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const subtitle = `${todayStr} · ${visibleJobs.length} AKTIVE`;

  // Upcoming: format day label
  const formatDayLabel = (job: Job) => {
    const props = job.all_properties || {};
    const deadlineStr = getJobDeadlineStr(props, job);
    const deadline = parseDate(deadlineStr);
    if (!deadline) return '—';
    const weekdays = ['SØN', 'MAN', 'TIR', 'ONS', 'TOR', 'FRE', 'LØR'];
    return `${weekdays[deadline.getDay()]} ${deadline.getDate()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg, color: textPrimary, fontFamily: SANS, overflow: 'hidden' }}>

      {/* CmdBar */}
      <DopCmdbar
        title={title}
        subtitle={subtitle}
        bg={bg}
        borderColor={border}
        textPrimary={textPrimary}
        textMuted={textMuted}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onRefresh={onRefresh}
      />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* ── Stat strip ── */}
        <div style={{ padding: '14px 18px 0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <DopStatCard label="Totalt" value={visibleJobs.length} desc="aktive oppdrag" valueColor={textPrimary} bg={panelBg} borderColor={border} inkColor={textPrimary} />
          <DopStatCard label="Kritisk" value={criticalJobs.length} desc="> 60 dager" valueColor={critical} bg={critBg} borderColor={border} inkColor={textPrimary} />
          <DopStatCard label="Over frist" value={overdueJobs.length} desc="1–60 dager" valueColor={warn} bg={warnBg} borderColor={border} inkColor={textPrimary} />
          <DopStatCard label="Innen frist" value={onTimeCount} desc="på spor" valueColor={ok} bg={okBg} borderColor={border} inkColor={textPrimary} />
        </div>

        {/* ── Main grid ── */}
        <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* DAGENS OPPGAVER — spans 2 cols */}
          <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 6, gridColumn: 'span 2' }}>
            <SectionHead label="DAGENS OPPGAVER" panelBg={panelBg} borderColor={border} textPrimary={textPrimary}>
              <DopPill bg={okBg} fg={ok}>{todayJobs.length} FOR I DAG</DopPill>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: textMuted }}>Klikk for å åpne</span>
            </SectionHead>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '24px 20px 1.4fr 0.9fr 90px 90px 100px 70px',
              ...dopSmallcap,
              color: textMuted,
              padding: '7px 14px',
              borderBottom: `1px solid ${border}`,
              gap: 8,
              background: panelBg,
            }}>
              <div /><div>#</div><div>Kunde</div><div>Type</div>
              <div style={{ textAlign: 'right' }}>Fotograf</div>
              <div style={{ textAlign: 'right' }}>Frist</div>
              <div style={{ textAlign: 'right' }}>Status</div>
              <div />
            </div>
            {todayJobs.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>
                Ingen oppdrag med frist i dag
              </div>
            ) : todayJobs.slice(0, 10).map((job, i) => (
              <TodayRow key={job.id} job={job} index={i} onSelectJob={onSelectJob}
                bg={bg} panelBg={panelBg} borderColor={border}
                textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
                okColor={ok} okBg={okBg}
              />
            ))}
          </div>

          {/* KRITISK OVER FRIST */}
          <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 6 }}>
            <SectionHead label="KRITISK OVER FRIST" panelBg={panelBg} borderColor={border} textPrimary={textPrimary}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: critical, display: 'inline-block' }} />
              <DopPill bg={critBg} fg={critical}>{criticalJobs.length}</DopPill>
              <button onClick={() => onNavigateToBrowse?.('critical')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 10, color: textMuted, textDecoration: 'underline' }}>SE ALLE</button>
            </SectionHead>
            {criticalJobs.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>Ingen kritiske oppdrag</div>
            ) : criticalJobs.slice(0, 8).map(job => (
              <CompactRow key={job.id} job={job} onSelectJob={onSelectJob}
                rightText={`+${getDaysOverdue(job, today)}d`}
                rightColor={critical}
                bg={bg} panelBg={panelBg} borderColor={border}
                textPrimary={textPrimary} textMuted={textMuted}
              />
            ))}
          </div>

          {/* KOMMENDE */}
          <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 6 }}>
            <SectionHead label="KOMMENDE" panelBg={panelBg} borderColor={border} textPrimary={textPrimary}>
              <DopPill bg={warnBg} fg={warn}>{overdueJobs.length} OVER FRIST</DopPill>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: textMuted }}>DENNE UKEN · {upcomingJobs.length}</span>
            </SectionHead>
            {overdueJobs.length === 0 && upcomingJobs.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>Ingen kommende oppdrag</div>
            ) : [...overdueJobs.slice(0, 3), ...upcomingJobs.slice(0, 4)].slice(0, 7).map(job => {
              const p = getJobPriority(job, today);
              const daysOver = getDaysOverdue(job, today);
              const isOv = p === 'high';
              return (
                <WeekRow key={job.id} job={job}
                  dayLabel={isOv ? `+${daysOver}D` : formatDayLabel(job)}
                  onSelectJob={onSelectJob}
                  bg={bg} panelBg={panelBg} borderColor={border}
                  textPrimary={textPrimary} textMuted={textMuted}
                  pillBg={isOv ? warnBg : okBg}
                  pillFg={isOv ? warn : ok}
                  pillText={isOv ? `+${daysOver}D` : formatDayLabel(job)}
                />
              );
            })}
          </div>

          {/* ARBEIDSMENGDE — spans 2 cols */}
          <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 6, gridColumn: 'span 2' }}>
            <SectionHead label="ARBEIDSMENGDE · 14 DAGER" panelBg={panelBg} borderColor={border} textPrimary={textPrimary}>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 12, fontFamily: MONO, fontSize: 10, color: textMuted }}>
                {Object.entries(WORKLOAD_COLORS).map(([label, color]) => (
                  <span key={label}><span style={{ color }}>■</span> {label.split(' ')[0].toUpperCase()}</span>
                ))}
              </div>
            </SectionHead>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '150px 50px 1fr 60px 50px 50px',
              ...dopSmallcap, color: textMuted,
              padding: '7px 14px', borderBottom: `1px solid ${border}`, gap: 12,
              background: panelBg,
            }}>
              <div>Fotograf</div>
              <div style={{ textAlign: 'right' }}>Total</div>
              <div>Fordeling</div>
              <div style={{ textAlign: 'right' }}>Over</div>
              <div style={{ textAlign: 'right' }}>FOH</div>
              <div style={{ textAlign: 'right' }}>OK</div>
            </div>
            {workload.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>Ingen oppdrag de neste 14 dagene</div>
            ) : workload.map(([owner, data]) => (
              <WorkloadRow key={owner} owner={owner} data={data}
                borderColor={border} textPrimary={textPrimary} textMuted={textMuted}
                criticalColor={critical} warnColor={warn} okColor={ok} bg={bg}
              />
            ))}
          </div>

          {/* NB Section */}
          {showNBOnly && (
            <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 6, gridColumn: 'span 2' }}>
              <SectionHead label="NASJONALBIBLIOTEKET" panelBg={panelBg} borderColor={border} textPrimary={textPrimary}>
                <BookOpen size={14} style={{ color: theme.statusNB }} />
                <DopPill bg={purpleBg} fg={theme.statusNB}>{visibleJobs.length} OPPDRAG</DopPill>
              </SectionHead>
              {visibleJobs.slice(0, 10).map(job => (
                <CompactRow key={job.id} job={job} onSelectJob={onSelectJob}
                  rightText={(() => { const d = getDaysOverdue(job, today); return d > 0 ? `+${d}d` : `${Math.abs(d)}d`; })()}
                  rightColor={textSecondary}
                  bg={bg} panelBg={panelBg} borderColor={border}
                  textPrimary={textPrimary} textMuted={textMuted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
