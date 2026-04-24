import React, { useState, useMemo } from "react";
import { Job } from "../types";
import { getJobDate, splitTitle } from "../utils/jobUtils";
import { getWeekNumber } from "../utils/dateUtils";
import { useTheme } from "../context/ThemeContext";
import { useJobData } from "../context/JobDataContext";
import { DopPill } from "./dop/DopPrimitives";

// ─── Design constants (kept in sync with DopSidebar) ────────────────────────
const SIDE  = '#2a251c';
const ACCENT = '#d97757';
const MONO  = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS  = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const S_INK  = '#efece4';
const S_DIM  = 'rgba(239,236,228,0.55)';
const S_RULE = 'rgba(239,236,228,0.15)';

const MONTHS_NB = [
  'Januar','Februar','Mars','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Desember'
];
const DAYS_NB = ['MAN','TIR','ONS','TOR','FRE','LØR','SØN'];

type CalView = 'uke' | 'måned' | 'dag' | 'agenda';

interface CalColors {
  bg: string; panel: string; ink: string; ink2: string; ink3: string; hair: string;
  accent: string; accentBg: string;
  blue: string; blueBg: string;
  purple: string; purpleBg: string;
  ok: string; okBg: string;
  critical: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function getKind(job: Job, overrides: Record<string, any>, cc: CalColors) {
  const ovr = overrides[job.id];
  if (ovr?.sendToNB) return { color: cc.purple, bg: cc.purpleBg, label: 'NB' };
  const props = job.all_properties || {};
  const t = (
    props.oppdragstype || props.type_of_order || props.deal_type || ''
  ).toLowerCase();
  if (t.includes('studio'))                           return { color: cc.accent,  bg: cc.accentBg,  label: 'STUDIO'  };
  if (t.includes('front') || t.includes('house'))    return { color: cc.ok,      bg: cc.okBg,      label: 'FRONT'   };
  if (t.includes('ekstern') || t.includes('extern')) return { color: cc.purple,  bg: cc.purpleBg,  label: 'EKSTERN' };
  return                                                     { color: cc.blue,    bg: cc.blueBg,    label: 'OBJEKT'  };
}

function navBtnStyle(active = false): React.CSSProperties {
  return {
    padding: '5px 9px',
    fontFamily: MONO,
    fontSize: 12,
    border: `1px solid ${active ? S_INK : S_RULE}`,
    background: active ? S_INK : 'rgba(255,255,255,0.07)',
    color: active ? SIDE : S_INK,
    cursor: 'pointer',
    borderRadius: 3,
    minWidth: 28,
    lineHeight: 1,
  };
}

// ─── Event card ──────────────────────────────────────────────────────────────
function EventCard({
  job, cc, overrides, onSelect,
}: {
  job: Job; cc: CalColors; overrides: Record<string, any>; onSelect: (j: Job) => void;
}) {
  const [h, setH] = React.useState(false);
  const { name } = splitTitle(job.title);
  const kind = getKind(job, overrides, cc);
  return (
    <div
      onClick={() => onSelect(job)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: kind.bg,
        borderLeft: `3px solid ${kind.color}`,
        borderRadius: 3, padding: '4px 6px',
        cursor: 'pointer', overflow: 'hidden',
        boxShadow: h ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
        transform: h ? 'translateY(-1px)' : 'none',
        transition: 'all .1s',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: kind.color, letterSpacing: '0.06em', fontWeight: 600 }}>{kind.label}</div>
      <div style={{ fontWeight: 600, fontSize: 11.5, color: cc.ink, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: cc.ink3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.id}</div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────
function WeekView({ cc, weekDays, jobsByDay, onSelect, overrides }: {
  cc: CalColors; weekDays: Date[]; jobsByDay: Job[][];
  onSelect: (j: Job) => void; overrides: Record<string, any>;
}) {
  const today = new Date();
  return (
    <div style={{ background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6, overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${cc.hair}` }}>
        {weekDays.map((d, i) => {
          const tod = isSameDay(d, today);
          return (
            <div key={i} style={{ padding: '10px 12px', borderLeft: i > 0 ? `1px solid ${cc.hair}` : 'none', background: tod ? cc.bg : 'transparent' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: cc.ink3, letterSpacing: '0.09em' }}>{DAYS_NB[i]}</div>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: tod ? ACCENT : cc.ink, marginTop: 1, letterSpacing: '-0.02em' }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Job cards per day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', minHeight: 280 }}>
        {weekDays.map((d, di) => {
          const dayJobs = jobsByDay[di];
          const tod = isSameDay(d, today);
          return (
            <div key={di} style={{
              borderLeft: di > 0 ? `1px solid ${cc.hair}` : 'none',
              background: tod ? `${ACCENT}06` : 'transparent',
              padding: 6, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {dayJobs.length === 0
                ? <div style={{ padding: '12px 4px', fontFamily: MONO, fontSize: 10, color: cc.ink3, textAlign: 'center', opacity: 0.35 }}>–</div>
                : dayJobs.map(job => (
                  <EventCard key={job.id} job={job} cc={cc} overrides={overrides} onSelect={onSelect} />
                ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────
function MonthView({ cc, currentDate, jobs, onSelect, overrides }: {
  cc: CalColors; currentDate: Date; jobs: Job[];
  onSelect: (j: Job) => void; overrides: Record<string, any>;
}) {
  const today = new Date();
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let startDow = new Date(year, month, 1).getDay();
  if (startDow === 0) startDow = 7; // Mon-based week
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 1; i < startDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${cc.hair}` }}>
        {DAYS_NB.map(d => (
          <div key={d} style={{ padding: '8px 10px', fontFamily: MONO, fontSize: 10, color: cc.ink3, letterSpacing: '0.09em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '100px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ borderLeft: `1px solid ${cc.hair}`, borderTop: `1px solid ${cc.hair}` }} />;
          const cellDate = new Date(year, month, day);
          const tod = isSameDay(cellDate, today);
          const dayJobs = jobs.filter(j => {
            const ds = getJobDate(j);
            return ds && isSameDay(new Date(ds), cellDate);
          });
          return (
            <div key={i} style={{ borderLeft: `1px solid ${cc.hair}`, borderTop: `1px solid ${cc.hair}`, padding: 6 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: tod ? ACCENT : cc.ink2, fontWeight: tod ? 600 : 400, marginBottom: 4 }}>{day}</div>
              {dayJobs.slice(0, 3).map(job => {
                const { name } = splitTitle(job.title);
                const kind = getKind(job, overrides, cc);
                return (
                  <div key={job.id} onClick={() => onSelect(job)}
                    style={{ fontSize: 10, fontFamily: MONO, padding: '2px 4px', marginBottom: 2, borderLeft: `2px solid ${kind.color}`, background: kind.bg, color: cc.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    {name}
                  </div>
                );
              })}
              {dayJobs.length > 3 && (
                <div style={{ fontFamily: MONO, fontSize: 9, color: cc.ink3 }}>+{dayJobs.length - 3}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────
function DayView({ cc, day, dayJobs, onSelect, overrides }: {
  cc: CalColors; day: Date; dayJobs: Job[];
  onSelect: (j: Job) => void; overrides: Record<string, any>;
}) {
  const dayLabel = `${DAYS_NB[(day.getDay() + 6) % 7]} ${day.getDate()}. ${MONTHS_NB[day.getMonth()].toUpperCase()}`;
  return (
    <div style={{ background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>{dayLabel}</div>
      {dayJobs.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>INGEN HENDELSER</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayJobs.map(job => {
            const { name } = splitTitle(job.title);
            const kind = getKind(job, overrides, cc);
            return (
              <div key={job.id} onClick={() => onSelect(job)}
                style={{ background: kind.bg, borderLeft: `3px solid ${kind.color}`, padding: '10px 14px', borderRadius: 3, cursor: 'pointer' }}>
                <DopPill bg={kind.bg} fg={kind.color} bold>{kind.label}</DopPill>
                <div style={{ fontWeight: 600, fontSize: 14, color: cc.ink, marginTop: 6 }}>{name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3, marginTop: 2 }}>{job.id}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Agenda View ─────────────────────────────────────────────────────────────
function AgendaView({ cc, weekDays, jobsByDay, onSelect, overrides }: {
  cc: CalColors; weekDays: Date[]; jobsByDay: Job[][];
  onSelect: (j: Job) => void; overrides: Record<string, any>;
}) {
  const hasAny = jobsByDay.some(d => d.length > 0);
  return (
    <div style={{ background: cc.panel, border: `1px solid ${cc.hair}`, borderRadius: 6, overflow: 'hidden' }}>
      {!hasAny && (
        <div style={{ padding: 30, textAlign: 'center', fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>
          INGEN HENDELSER DENNE UKEN
        </div>
      )}
      {weekDays.map((day, di) => {
        const dayJobs = jobsByDay[di];
        if (dayJobs.length === 0) return null;
        return (
          <div key={di}>
            <div style={{ padding: '10px 14px', background: cc.bg, borderBottom: `1px solid ${cc.hair}`, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>{DAYS_NB[di]}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{day.getDate()}. {MONTHS_NB[day.getMonth()].toUpperCase()}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3 }}>{dayJobs.length} HENDELSER</span>
            </div>
            {dayJobs.map(job => {
              const { name } = splitTitle(job.title);
              const kind = getKind(job, overrides, cc);
              return (
                <div key={job.id}
                  style={{ padding: '9px 14px', borderBottom: `1px solid ${cc.hair}`, display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}
                  onClick={() => onSelect(job)}
                  onMouseEnter={e => (e.currentTarget.style.background = cc.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <DopPill bg={kind.bg} fg={kind.color} bold>{kind.label}</DopPill>
                  <div>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: cc.ink3, marginLeft: 8 }}>· {job.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
interface CalendarViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  loading?: boolean;
  clearFilters?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs, onSelectJob, selectedOwner, setSelectedOwner, uniqueOwners = [], loading = false, clearFilters,
}) => {
  const { theme } = useTheme();
  const { jobOverrides } = useJobData();

  const [view, setView]             = useState<CalView>('uke');
  const [currentDate, setCurrentDate] = useState(new Date());

  const cc: CalColors = {
    bg:       theme.stone50,
    panel:    theme.stone100,
    ink:      theme.textColorPrimary,
    ink2:     theme.textColorSecondary,
    ink3:     theme.textColorMuted,
    hair:     theme.stone200,
    accent:   ACCENT,
    accentBg: `${ACCENT}1a`,
    blue:     theme.statusProgress,
    blueBg:   `${theme.statusProgress}1a`,
    purple:   theme.statusNB,
    purpleBg: `${theme.statusNB}1a`,
    ok:       theme.statusWithin,
    okBg:     `${theme.statusWithin}1a`,
    critical: theme.statusCritical,
  };

  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const weekDays    = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  }), [startOfWeek]);

  const weekNum  = getWeekNumber(startOfWeek);
  const endDay   = weekDays[6];
  const sMonth   = MONTHS_NB[startOfWeek.getMonth()];
  const eMonth   = MONTHS_NB[endDay.getMonth()];
  const subtitle = sMonth === eMonth
    ? `${startOfWeek.getDate()}.–${endDay.getDate()}. ${sMonth.toUpperCase()} ${startOfWeek.getFullYear()}`
    : `${startOfWeek.getDate()}. ${sMonth.slice(0, 3).toUpperCase()}–${endDay.getDate()}. ${eMonth.slice(0, 3).toUpperCase()} ${endDay.getFullYear()}`;

  const jobsByDay = useMemo(() =>
    weekDays.map(day =>
      jobs.filter(job => {
        const ds = getJobDate(job);
        return ds && isSameDay(new Date(ds), day);
      })
    ),
    [jobs, weekDays]
  );

  const totalEvents = jobsByDay.reduce((a, b) => a + b.length, 0);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'måned' ? -28 : -7));
    setCurrentDate(d);
  };
  const nextPeriod = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'måned' ? 28 : 7));
    setCurrentDate(d);
  };

  const todayIdx = weekDays.findIndex(d => isSameDay(d, new Date()));
  const dayIdx   = todayIdx >= 0 ? todayIdx : 0;

  const LEGEND: [string, string][] = [
    ['STUDIO', cc.accent], ['OBJEKT', cc.blue], ['EKSTERN', cc.purple], ['FRONT', cc.ok],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: cc.bg, color: cc.ink, fontFamily: SANS }}>

      {/* ── Cmdbar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: SIDE, color: S_INK,
        padding: '10px 18px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>
            Kalender · Uke {weekNum}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: S_DIM, marginTop: 1, letterSpacing: '0.06em' }}>
            {subtitle} · {totalEvents} HENDELSER
          </div>
        </div>

        {/* Navigation */}
        <button onClick={prevPeriod} style={navBtnStyle()}>‹</button>
        <button onClick={() => setCurrentDate(new Date())} style={{ ...navBtnStyle(), padding: '5px 10px', fontSize: 10, letterSpacing: '0.08em' }}>I DAG</button>
        <button onClick={nextPeriod} style={navBtnStyle()}>›</button>

        <div style={{ width: 6 }} />

        {/* Photographer select */}
        {uniqueOwners.length > 0 && (
          <select
            value={selectedOwner || 'all'}
            onChange={e => setSelectedOwner?.(e.target.value)}
            style={{
              padding: '5px 9px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em',
              border: `1px solid ${S_RULE}`, borderRadius: 3,
              background: 'rgba(255,255,255,0.08)', color: S_INK, cursor: 'pointer',
            }}
          >
            <option value="all">ALLE FOTOGRAFER</option>
            {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        <div style={{ width: 4 }} />

        {/* View switcher */}
        {(['uke', 'måned', 'dag', 'agenda'] as CalView[]).map(v => (
          <button key={v} onClick={() => setView(v)} style={navBtnStyle(view === v)}>
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Legend strip ────────────────────────────────────────────────── */}
      <div style={{
        padding: '7px 18px', background: cc.panel, borderBottom: `1px solid ${cc.hair}`,
        display: 'flex', gap: 14, alignItems: 'center',
        fontFamily: MONO, fontSize: 10.5, color: cc.ink3, letterSpacing: '0.06em',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span>TYPE:</span>
        {LEGEND.map(([lbl, col]) => (
          <span key={lbl} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: col, borderRadius: 2, display: 'inline-block' }} />
            {lbl}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        {selectedOwner && selectedOwner !== 'all' && clearFilters && (
          <button
            onClick={clearFilters}
            style={{ fontFamily: MONO, fontSize: 10, color: cc.critical, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}
          >
            × TØM FILTER
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px 18px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontFamily: MONO, fontSize: 11, color: cc.ink3, letterSpacing: '0.08em' }}>
            LASTER…
          </div>
        ) : view === 'uke' ? (
          <WeekView   cc={cc} weekDays={weekDays} jobsByDay={jobsByDay} onSelect={onSelectJob} overrides={jobOverrides} />
        ) : view === 'måned' ? (
          <MonthView  cc={cc} currentDate={currentDate} jobs={jobs} onSelect={onSelectJob} overrides={jobOverrides} />
        ) : view === 'dag' ? (
          <DayView    cc={cc} day={weekDays[dayIdx]} dayJobs={jobsByDay[dayIdx]} onSelect={onSelectJob} overrides={jobOverrides} />
        ) : (
          <AgendaView cc={cc} weekDays={weekDays} jobsByDay={jobsByDay} onSelect={onSelectJob} overrides={jobOverrides} />
        )}
      </div>
    </div>
  );
};
