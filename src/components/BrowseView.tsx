import React, { useState, useMemo } from "react";
import { Job } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, SlidersHorizontal, Plus } from "lucide-react";
import { getDeadlineInfo, getJobDate, getJobDeadlineStr, getJobTypeStr, getJobLocationStr, parseDate, formatDate } from "../utils/jobUtils";
import { SortKey, DateFilter } from "../hooks/useJobFilters";
import { useTheme } from "../context/ThemeContext";
import { DopPill, dopSmallcap } from "./dop/DopPrimitives";
import { BrowseFilters } from "./browse/BrowseFilters";
import { BrowseGrid } from "./browse/BrowseGrid";
import { BrowseList } from "./browse/BrowseList";
import { useNMData } from "../hooks/useNMData";
import { useDiMuData } from "../hooks/useDiMuData";
import { ImagePreviewModal } from "./ui/ImagePreviewModal";

const MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const SIDE = '#2a251c';

type ListMode = 'kanban' | 'table' | 'grid';

interface BrowseViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  layout: 'list' | 'grid';
  setLayout: (layout: 'list' | 'grid') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  handleSort: (key: SortKey) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  counts: { all: number; today: number; critical: number; overdue: number; next7: number };
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;
  uniqueOwners: string[];
  selectedLocation: string[];
  setSelectedLocation: (locations: string[]) => void;
  uniqueLocations: string[];
  locationCounts: Record<string, number>;
  selectedType: string[];
  setSelectedType: (types: string[]) => void;
  uniqueTypes: string[];
  typeCounts: Record<string, number>;
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  loading?: boolean;
  clearFilters?: () => void;
}

// ─── Kanban card ─────────────────────────────────────────────────────────────
function KanbanCard({ job, onSelectJob, pillBg, pillFg, pillText, panelBg, bg, borderColor, textPrimary, textSecondary, textMuted }: {
  job: Job; onSelectJob: (job: Job) => void;
  pillBg: string; pillFg: string; pillText: string;
  panelBg: string; bg: string; borderColor: string;
  textPrimary: string; textSecondary: string; textMuted: string;
}) {
  const [h, setH] = useState(false);
  const props = job.all_properties || {};
  const typeStr = getJobTypeStr(props) || job.type || '';
  const deadline = getJobDeadlineStr(props, job);
  const client = job.title?.split(' - ')[0] || job.title || '—';
  const owner = job.owner_names?.[0] || '';
  const ownerInitials = owner.split(' ').map((w: string) => w[0]).join('').slice(0, 2);

  return (
    <div
      onClick={() => onSelectJob(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: panelBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'transform .12s, box-shadow .12s',
        transform: h ? 'translateY(-1px)' : 'none',
        boxShadow: h ? `0 2px 0 ${textPrimary}22` : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Top row: id + pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: textMuted }}>{job.id}</span>
        <DopPill bg={pillBg} fg={pillFg} bold>{pillText}</DopPill>
      </div>
      {/* Client */}
      <div style={{ fontWeight: 600, fontSize: 14, fontFamily: SANS, color: textPrimary, lineHeight: 1.2 }}>{client}</div>
      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {typeStr && <DopPill bg={bg} fg={textSecondary}>{typeStr.slice(0, 18)}</DopPill>}
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#d97757', color: '#2a251c',
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: MONO, flexShrink: 0,
        }}>
          {ownerInitials || '?'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: textMuted }}>
          {deadline ? formatDate(deadline) : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanCol({ label, sub, count, accentColor, accentBg, jobs, onSelectJob, bg, panelBg, borderColor, textPrimary, textSecondary, textMuted, pillBg, pillFg, today }: {
  label: string; sub: string; count: number;
  accentColor: string; accentBg: string;
  jobs: Job[]; onSelectJob: (job: Job) => void;
  bg: string; panelBg: string; borderColor: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  pillBg: string; pillFg: string; today: Date;
}) {
  const getDaysLabel = (job: Job) => {
    const props = job.all_properties || {};
    const deadline = getJobDeadlineStr(props, job);
    const d = parseDate(deadline);
    if (!d) return '—';
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diff === 0) return 'I DAG';
    if (diff > 0) return `${diff}D`;
    return `+${Math.abs(diff)}D`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {/* Column header */}
      <div style={{
        padding: '8px 12px',
        background: accentBg,
        borderRadius: 6,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: accentColor, letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: textMuted, marginTop: 1 }}>{sub}</div>
        </div>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 700,
          background: accentBg, color: accentColor,
          padding: '1px 7px', borderRadius: 3,
          border: `1px solid ${accentColor}33`,
        }}>{count}</span>
      </div>
      {/* Cards */}
      {jobs.map(job => (
        <KanbanCard
          key={job.id} job={job} onSelectJob={onSelectJob}
          pillBg={pillBg} pillFg={pillFg} pillText={getDaysLabel(job)}
          panelBg={panelBg} bg={bg} borderColor={borderColor}
          textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
        />
      ))}
      {jobs.length === 0 && (
        <div style={{ padding: '16px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 10, color: textMuted, border: `1px dashed ${borderColor}`, borderRadius: 6 }}>
          TOM
        </div>
      )}
    </div>
  );
}

// ─── BrowseView ──────────────────────────────────────────────────────────────
export const BrowseView: React.FC<BrowseViewProps> = ({
  jobs,
  onSelectJob,
  layout,
  setLayout,
  searchTerm,
  setSearchTerm,
  sortConfig,
  handleSort,
  dateFilter,
  setDateFilter,
  counts,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners,
  selectedLocation,
  setSelectedLocation,
  uniqueLocations,
  locationCounts,
  selectedType,
  setSelectedType,
  uniqueTypes,
  typeCounts,
  showNBOnly = false,
  setShowNBOnly,
  loading = false,
  clearFilters
}) => {
  const { theme } = useTheme();
  const [listMode, setListMode] = useState<ListMode>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const allNmIds = useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(jobs)) jobs.forEach(job => job.nmids?.forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [jobs]);

  const { nmDataMap } = useNMData(allNmIds);
  const { dimuDataMap } = useDiMuData(allNmIds);

  // Theme colors
  const bg        = theme.stone50;
  const panelBg   = theme.stone100;
  const border    = theme.stone200;
  const textPrimary   = theme.textColorPrimary;
  const textSecondary = theme.textColorSecondary;
  const textMuted     = theme.textColorMuted;
  const critical  = theme.statusCritical;
  const critBg    = `${critical}18`;
  const warn      = theme.statusOverdue;
  const warnBg    = `${warn}18`;
  const ok        = theme.statusWithin;
  const okBg      = `${ok}18`;
  const blue      = theme.statusProgress;
  const blueBg    = `${blue}18`;

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Bucket jobs for kanban
  const { kritisk, overFrist, denneUken, kommende } = useMemo(() => {
    const kritisk: Job[] = [], overFrist: Job[] = [], denneUken: Job[] = [], kommende: Job[] = [];
    (Array.isArray(jobs) ? jobs : []).forEach(job => {
      const props = job.all_properties || {};
      const deadlineStr = getJobDeadlineStr(props, job);
      const deadline = parseDate(deadlineStr);
      if (!deadline) { kommende.push(job); return; }
      const d = new Date(deadline); d.setHours(0, 0, 0, 0);
      const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff < -60) kritisk.push(job);
      else if (diff < 0) overFrist.push(job);
      else if (diff <= 7) denneUken.push(job);
      else kommende.push(job);
    });
    return { kritisk, overFrist, denneUken, kommende };
  }, [jobs, today]);

  const title = `Bestillinger · ${jobs.length}`;
  const subtitle = `${counts.overdue} OVER FRIST · ${counts.critical} KRITISK · ${counts.all - counts.critical - counts.overdue} OK`;

  const activeFiltersCount = (selectedOwner && selectedOwner !== 'all' ? 1 : 0)
    + selectedLocation.length + selectedType.length
    + (showNBOnly ? 1 : 0)
    + (dateFilter !== 'all' ? 1 : 0);

  if (loading) {
    return (
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: bg }}>
        <div style={{ height: 42, borderRadius: 6, background: panelBg }} />
        <div style={{ height: 42, borderRadius: 6, background: panelBg }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, flex: 1 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 300, borderRadius: 6, background: panelBg }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg, color: textPrimary, fontFamily: SANS }}>

      {/* ── CmdBar ────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${border}`,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: bg,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: SANS }}>{title}</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: textMuted, letterSpacing: '0.05em', marginTop: 1 }}>{subtitle}</div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 140 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Søk…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 28, paddingRight: searchTerm ? 28 : 10, paddingTop: 6, paddingBottom: 6,
              border: `1px solid ${border}`, borderRadius: 5,
              background: panelBg, fontFamily: MONO, fontSize: 11, color: textPrimary,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', border: `1px solid ${border}`, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
          {([['kanban','Kanban'],['table','Tabell'],['grid','Kort']] as [ListMode, string][]).map(([mode, label]) => (
            <button key={mode} onClick={() => setListMode(mode)}
              style={{
                fontFamily: MONO, fontSize: 10.5, padding: '6px 10px',
                border: 'none',
                background: listMode === mode ? textPrimary : panelBg,
                color: listMode === mode ? bg : textSecondary,
                cursor: 'pointer', letterSpacing: '0.05em',
                transition: 'background .1s, color .1s',
              }}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: MONO, fontSize: 10.5, padding: '6px 10px',
            border: `1px solid ${showFilters || activeFiltersCount > 0 ? textSecondary : border}`,
            borderRadius: 4, background: showFilters ? textPrimary : panelBg,
            color: showFilters ? bg : textSecondary,
            cursor: 'pointer', letterSpacing: '0.05em', flexShrink: 0,
            transition: 'background .1s, color .1s',
          }}
        >
          <SlidersHorizontal size={11} />
          FILTRE {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* ── Filter panel ─────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0, borderBottom: `1px solid ${border}` }}
          >
            <div style={{ padding: '12px 18px', background: panelBg }}>
              <BrowseFilters
                counts={counts}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                uniqueLocations={uniqueLocations}
                locationCounts={locationCounts}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                uniqueTypes={uniqueTypes}
                typeCounts={typeCounts}
                theme={theme}
                clearFilters={clearFilters}
              />
              {/* Owner filter */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ ...dopSmallcap, color: textMuted, alignSelf: 'center' }}>FOTOGRAF</span>
                {['all', ...uniqueOwners].map(owner => (
                  <button key={owner}
                    onClick={() => setSelectedOwner(owner)}
                    style={{
                      fontFamily: MONO, fontSize: 10, padding: '3px 9px',
                      borderRadius: 3, border: `1px solid ${selectedOwner === owner ? textSecondary : border}`,
                      background: selectedOwner === owner ? textPrimary : panelBg,
                      color: selectedOwner === owner ? bg : textSecondary,
                      cursor: 'pointer', letterSpacing: '0.05em',
                    }}>
                    {owner === 'all' ? 'ALLE' : owner.split(' ')[0].toUpperCase()}
                  </button>
                ))}
              </div>
              {/* NB filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input type="checkbox" id="nb-filter" checked={showNBOnly} onChange={e => setShowNBOnly?.(e.target.checked)}
                  style={{ accentColor: '#d97757', cursor: 'pointer' }} />
                <label htmlFor="nb-filter" style={{ fontFamily: MONO, fontSize: 10, color: textSecondary, cursor: 'pointer', letterSpacing: '0.06em' }}>
                  NASJONALBIBLIOTEKET
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ──────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {listMode === 'kanban' ? (
          <div style={{
            padding: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            alignItems: 'start',
            minWidth: 700,
          }}>
            <KanbanCol
              label="KRITISK" sub="> 60 dager over frist" count={kritisk.length}
              accentColor={critical} accentBg={critBg}
              jobs={kritisk} onSelectJob={onSelectJob}
              bg={bg} panelBg={panelBg} borderColor={border}
              textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
              pillBg={critBg} pillFg={critical} today={today}
            />
            <KanbanCol
              label="OVER FRIST" sub="1–60 dager" count={overFrist.length}
              accentColor={warn} accentBg={warnBg}
              jobs={overFrist} onSelectJob={onSelectJob}
              bg={bg} panelBg={panelBg} borderColor={border}
              textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
              pillBg={warnBg} pillFg={warn} today={today}
            />
            <KanbanCol
              label="DENNE UKEN" sub="i dag / snart / 7 dager" count={denneUken.length}
              accentColor={ok} accentBg={okBg}
              jobs={denneUken} onSelectJob={onSelectJob}
              bg={bg} panelBg={panelBg} borderColor={border}
              textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
              pillBg={okBg} pillFg={ok} today={today}
            />
            <KanbanCol
              label="KOMMENDE" sub="neste uke og fremover" count={kommende.length}
              accentColor={blue} accentBg={blueBg}
              jobs={kommende} onSelectJob={onSelectJob}
              bg={bg} panelBg={panelBg} borderColor={border}
              textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
              pillBg={blueBg} pillFg={blue} today={today}
            />
          </div>
        ) : listMode === 'table' ? (
          <div>
            {jobs.length === 0 ? (
              <div style={{ padding: '40px 18px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>
                Ingen oppdrag funnet.
              </div>
            ) : (
              <BrowseList jobs={jobs} onSelectJob={onSelectJob} theme={theme} />
            )}
          </div>
        ) : (
          <div style={{ padding: 18 }}>
            {jobs.length === 0 ? (
              <div style={{ padding: '40px 18px', textAlign: 'center', color: textMuted, fontFamily: MONO, fontSize: 11 }}>
                Ingen oppdrag funnet.
              </div>
            ) : (
              <BrowseGrid
                jobs={jobs}
                onSelectJob={onSelectJob}
                theme={theme}
                nmDataMap={nmDataMap}
                dimuDataMap={dimuDataMap}
                setPreviewImage={setPreviewImage}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Status bar ───────────────────────────────── */}
      <div style={{
        padding: '7px 18px',
        background: SIDE,
        color: 'rgba(239,236,228,0.55)',
        fontFamily: MONO, fontSize: 10.5,
        display: 'flex', gap: 20,
        letterSpacing: '0.05em',
        flexShrink: 0,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#5ec98a' }}>● CONNECTED</span>
        <span>{jobs.length} ROWS</span>
        {activeFiltersCount > 0 && <span style={{ color: '#e8a640' }}>{activeFiltersCount} FILTER{activeFiltersCount > 1 ? 'E' : ''} AKTIVE</span>}
        <div style={{ flex: 1 }} />
        <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(239,236,228,0.35)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.05em' }}>
          NULLSTILL
        </button>
      </div>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />
    </div>
  );
};
