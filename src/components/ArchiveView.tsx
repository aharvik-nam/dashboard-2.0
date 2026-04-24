import React, { useMemo, useState } from "react";
import { Job } from "../types";
import { formatDate, splitTitle, getJobDate, isInternJob, isExternJob } from "../utils/jobUtils";
import { useTheme } from "../context/ThemeContext";
import { useJobData } from "../context/JobDataContext";
import { ArchiveStatisticsTab } from "./archive/ArchiveStatisticsTab";
import { DopPill } from "./dop/DopPrimitives";

// ─── Design constants ────────────────────────────────────────────────────────
const SIDE  = '#2a251c';
const ACCENT = '#d97757';
const MONO  = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS  = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const S_INK  = '#efece4';
const S_DIM  = 'rgba(239,236,228,0.55)';
const S_RULE = 'rgba(239,236,228,0.15)';

const PAGE_SIZE = 40;

interface ArchiveViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  selectedLocations?: string[];
  setSelectedLocations?: (locations: string[]) => void;
  uniqueLocations?: string[];
  selectedYear?: string;
  setSelectedYear?: (year: string) => void;
  uniqueYears?: string[];
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  loading?: boolean;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onRefresh?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  archiveTab: "list" | "stats";
  setArchiveTab: (tab: "list" | "stats") => void;
  clearFilters?: () => void;
}

// ─── Archive row ─────────────────────────────────────────────────────────────
function ArkivRow({ job, cc, onSelect, stripe }: {
  job: Job;
  cc: { bg: string; panel: string; ink: string; ink2: string; ink3: string; hair: string; ok: string; okBg: string };
  onSelect: (j: Job) => void;
  stripe: boolean;
}) {
  const [h, setH] = useState(false);
  const { jobOverrides } = useJobData();
  const { name, type: jobType } = splitTitle(job.title);
  const props = job.all_properties || {};
  const closed = formatDate(props.closedate || props.hs_closed_won_date || '');
  const photographer = props.hubspot_owner_assignee || props.photographer_name || '–';
  const nbSend = jobOverrides[job.id]?.sendToNB;
  const isIntern = isInternJob(job);
  const typeLbl = isIntern ? 'INTERN' : isExternJob(job) ? 'EKSTERN' : '';

  return (
    <div
      onClick={() => onSelect(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 120px 100px 80px 80px',
        gap: 0,
        padding: '9px 14px',
        borderBottom: `1px solid ${cc.hair}`,
        fontSize: 13,
        alignItems: 'center',
        background: h ? cc.bg : stripe ? 'rgba(0,0,0,0.015)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      {/* ID */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink2 }}>{job.id}</div>
      {/* Title */}
      <div>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {jobType && <div style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3, marginTop: 1 }}>{jobType}</div>}
      </div>
      {/* Photographer */}
      <div style={{ fontSize: 12, color: cc.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photographer}</div>
      {/* Closed */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink2 }}>{closed || '–'}</div>
      {/* Type */}
      <div>
        {typeLbl && <DopPill bg={cc.bg} fg={cc.ink2}>{typeLbl}</DopPill>}
        {nbSend && <DopPill bg={`${ACCENT}1a`} fg={ACCENT} bold style={{ marginLeft: 4 }}>NB</DopPill>}
      </div>
      {/* Status */}
      <div style={{ textAlign: 'right' }}>
        <DopPill bg={cc.okBg} fg={cc.ok} bold>FERDIG</DopPill>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const ArchiveView: React.FC<ArchiveViewProps> = ({
  jobs,
  onSelectJob,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners = [],
  selectedLocations = [],
  setSelectedLocations,
  uniqueLocations = [],
  selectedYear = 'all',
  setSelectedYear,
  uniqueYears = [],
  showNBOnly = false,
  setShowNBOnly,
  loading = false,
  searchTerm = '',
  setSearchTerm,
  onRefresh,
  onSync,
  isSyncing = false,
  archiveTab,
  setArchiveTab,
  clearFilters,
}) => {
  const { theme } = useTheme();
  const [page, setPage] = useState(1);

  const cc = {
    bg:    theme.stone50,
    panel: theme.stone100,
    ink:   theme.textColorPrimary,
    ink2:  theme.textColorSecondary,
    ink3:  theme.textColorMuted,
    hair:  theme.stone200,
    ok:    theme.statusWithin,
    okBg:  `${theme.statusWithin}1a`,
    critical: theme.statusCritical,
  };

  // Stats derived from all jobs passed in
  const totalPhotos = useMemo(() => {
    return jobs.reduce((sum, j) => {
      const n = parseInt((j.all_properties || {}).hs_num_of_associated_line_items || '0', 10);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }, [jobs]);

  const onTimeCount = useMemo(() => {
    return jobs.filter(j => {
      const ds = getJobDate(j);
      if (!ds) return false;
      const closed = (j.all_properties || {}).closedate;
      if (!closed) return true;
      return new Date(closed) <= new Date(ds);
    }).length;
  }, [jobs]);

  const onTimePct = jobs.length > 0 ? Math.round((onTimeCount / jobs.length) * 100) : 0;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const pageJobs   = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter changes
  React.useEffect(() => { setPage(1); }, [jobs.length, selectedYear, selectedOwner, searchTerm]);

  const isAnyFilterActive = (selectedOwner && selectedOwner !== 'all') ||
    (selectedYear && selectedYear !== 'all') ||
    (searchTerm && searchTerm !== '');

  const SMALLCAP: React.CSSProperties = {
    fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase', color: cc.ink3,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden', background: cc.bg, color: cc.ink, fontFamily: SANS,
    }}>

      {/* ── Cmdbar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: SIDE, color: S_INK,
        padding: '10px 18px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Arkiv · Seksjon Foto</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: S_DIM, marginTop: 1, letterSpacing: '0.06em' }}>
            {jobs.length} FULLFØRTE OPPDRAG · {totalPhotos.toLocaleString('no')} BILDER
          </div>
        </div>
        <button
          onClick={() => setArchiveTab(archiveTab === 'stats' ? 'list' : 'stats')}
          style={{
            fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
            padding: '6px 11px', border: `1px solid ${archiveTab === 'stats' ? S_INK : S_RULE}`,
            background: archiveTab === 'stats' ? S_INK : 'transparent',
            color: archiveTab === 'stats' ? SIDE : S_INK,
            cursor: 'pointer', fontWeight: 600, borderRadius: 3,
          }}
        >
          STATISTIKK ↗
        </button>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            style={{
              fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
              padding: '6px 11px', border: `1px solid ${S_RULE}`,
              background: 'transparent', color: isSyncing ? S_DIM : S_INK,
              cursor: isSyncing ? 'not-allowed' : 'pointer', borderRadius: 3,
            }}
          >
            {isSyncing ? 'SYNKRONISERER…' : 'SYNKRONISER'}
          </button>
        )}
      </div>

      {archiveTab === 'stats' ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px 18px' }}>
          <ArchiveStatisticsTab />
        </div>
      ) : loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>HENTER ARKIV FRA HUBSPOT…</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: cc.ink3 }}>Dette kan ta noen sekunder</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Stat strip ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { l: 'TOTALT',  v: jobs.length,                             s: 'arkiverte oppdrag' },
              { l: 'BILDER',  v: totalPhotos.toLocaleString('no'),         s: 'levert til samling' },
              { l: 'PÅ FRIST', v: `${onTimePct}%`,                        s: 'historisk snitt' },
              { l: 'VISER',   v: Math.min(page * PAGE_SIZE, jobs.length), s: `av ${jobs.length} treff` },
            ].map(s => (
              <div key={s.l} style={{ background: cc.panel, border: `1px solid ${cc.hair}`, padding: '11px 14px', borderRadius: 6 }}>
                <div style={SMALLCAP}>{s.l}</div>
                <div style={{ fontFamily: MONO, fontSize: 26, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontWeight: 600, marginTop: 2 }}>{s.v}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3, marginTop: 1 }}>{s.s}</div>
              </div>
            ))}
          </div>

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div style={{
            background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6,
            padding: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 180px 200px auto auto',
            gap: 8, alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${cc.hair}`, borderRadius: 4, padding: '7px 10px', background: cc.bg }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3 }}>⌕</span>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm?.(e.target.value)}
                placeholder="Søk i arkivet…"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: cc.ink, fontFamily: SANS }}
              />
            </div>
            {/* Year filter */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear?.(e.target.value)}
              style={{ padding: '7px 10px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', border: `1px solid ${cc.hair}`, borderRadius: 4, background: cc.bg, color: cc.ink, cursor: 'pointer' }}
            >
              <option value="all">ÅR · ALLE</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {/* Photographer filter */}
            <select
              value={selectedOwner || 'all'}
              onChange={e => setSelectedOwner?.(e.target.value)}
              style={{ padding: '7px 10px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', border: `1px solid ${cc.hair}`, borderRadius: 4, background: cc.bg, color: cc.ink, cursor: 'pointer' }}
            >
              <option value="all">ALLE FOTOGRAFER</option>
              {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {/* Count */}
            <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{jobs.length} TREFF</div>
            {/* Clear */}
            {isAnyFilterActive && (
              <button
                onClick={clearFilters}
                style={{ fontFamily: MONO, fontSize: 10, color: cc.critical, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
              >
                × TØM
              </button>
            )}
          </div>

          {/* ── Year chips ──────────────────────────────────────────────── */}
          {uniqueYears.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedYear?.('all')}
                style={{
                  padding: '5px 11px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em',
                  border: `1px solid ${selectedYear === 'all' ? cc.ink : cc.hair}`,
                  background: selectedYear === 'all' ? cc.ink : cc.panel,
                  color: selectedYear === 'all' ? cc.bg : cc.ink2,
                  cursor: 'pointer', borderRadius: 3,
                }}
              >
                ALLE ÅR
              </button>
              {uniqueYears.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear?.(y)}
                  style={{
                    padding: '5px 11px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em',
                    border: `1px solid ${selectedYear === y ? cc.ink : cc.hair}`,
                    background: selectedYear === y ? cc.ink : cc.panel,
                    color: selectedYear === y ? cc.bg : cc.ink2,
                    cursor: 'pointer', borderRadius: 3,
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div style={{ background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              padding: '10px 14px', borderBottom: `1px solid ${cc.hair}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={SMALLCAP}>ARKIVERTE OPPDRAG</div>
              <div style={{ flex: 1 }} />
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3 }}>{jobs.length} totalt</div>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 120px 100px 80px 80px',
              gap: 0, padding: '7px 14px',
              borderBottom: `1px solid ${cc.hair}`,
              fontFamily: MONO, fontSize: 10, color: cc.ink3, letterSpacing: '0.08em',
            }}>
              <div>ORDRE-NR</div>
              <div>TITTEL</div>
              <div>FOTOGRAF</div>
              <div>FERDIG</div>
              <div>TYPE</div>
              <div style={{ textAlign: 'right' }}>STATUS</div>
            </div>

            {/* Rows */}
            {jobs.length === 0 ? (
              <div style={{ padding: '40px 14px', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>
                INGEN ARKIVERTE OPPDRAG FUNNET
              </div>
            ) : (
              pageJobs.map((job, i) => (
                <ArkivRow
                  key={job.id}
                  job={job}
                  cc={cc}
                  onSelect={onSelectJob}
                  stripe={i % 2 === 1}
                />
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '10px 14px', borderTop: `1px solid ${cc.hair}`,
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: MONO, fontSize: 10.5, color: cc.ink3,
              }}>
                <span>VISER {Math.min((page - 1) * PAGE_SIZE + 1, jobs.length)}–{Math.min(page * PAGE_SIZE, jobs.length)} AV {jobs.length}</span>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ fontFamily: MONO, fontSize: 10.5, color: page <= 1 ? cc.ink3 : cc.ink, background: 'none', border: 'none', cursor: page <= 1 ? 'default' : 'pointer' }}
                >
                  ‹ FORRIGE
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ fontFamily: MONO, fontSize: 10.5, color: page >= totalPages ? cc.ink3 : cc.ink, background: 'none', border: 'none', cursor: page >= totalPages ? 'default' : 'pointer' }}
                >
                  NESTE ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
