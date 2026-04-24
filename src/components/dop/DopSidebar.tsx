import React, { useState } from "react";
import { LayoutDashboard, FolderOpen, Calendar, Archive, Settings, Moon, Sun } from "lucide-react";

type MainView = "dashboard" | "browse" | "calendar" | "settings" | "archive";

interface DopSidebarProps {
  activeView: MainView;
  onNav: (view: MainView) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  userName?: string;
}

const SIDE   = '#2a251c';
const INK    = '#efece4';
const DIM    = 'rgba(239,236,228,0.55)';
const RULE   = 'rgba(239,236,228,0.15)';
const ACCENT = '#d97757';
const MONO   = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS   = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';

interface NavItem {
  key: MainView;
  label: string;
  kbd: string;
  Icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Oversikt',      kbd: '⌘1', Icon: LayoutDashboard },
  { key: 'browse',      label: 'Bestillinger',  kbd: '⌘2', Icon: FolderOpen      },
  { key: 'calendar',    label: 'Kalender',      kbd: '⌘3', Icon: Calendar        },
  { key: 'archive',     label: 'Arkiv',         kbd: '⌘4', Icon: Archive         },
  { key: 'settings',    label: 'Innstillinger', kbd: '⌘,', Icon: Settings        },
];

function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  const { Icon } = item;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 4,
        background: active ? 'rgba(255,255,255,0.10)' : h ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? '#fff' : 'rgba(239,236,228,0.85)',
        cursor: 'pointer',
        transition: 'background .1s',
      }}
    >
      <span style={{
        width: 16, height: 16,
        background: active ? ACCENT : 'rgba(239,236,228,0.14)',
        color: active ? SIDE : INK,
        fontFamily: MONO, fontSize: 9.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 3, fontWeight: 600,
      }}>
        <Icon size={10} />
      </span>
      <span style={{ flex: 1, fontFamily: SANS, fontSize: 13 }}>{item.label}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: DIM }}>{item.kbd}</span>
    </div>
  );
}

export function DopSidebar({ activeView, onNav, darkMode, onToggleDark, userName }: DopSidebarProps) {
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AB';
  const shortName = userName || 'Annar Bjørgli';

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      background: SIDE,
      color: INK,
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      fontSize: 13,
      borderRight: `1px solid ${RULE}`,
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '6px 8px 14px' }}>
        <div style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: 15, fontFamily: SANS }}>
          NaMFOTO<span style={{ color: ACCENT }}>.</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: DIM, marginTop: 2, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Fotooppdrag · v2
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: DIM, padding: '4px 8px', letterSpacing: '0.1em' }}>ARBEID</div>

      {/* Nav items */}
      {NAV_ITEMS.map(item => (
        <NavRow
          key={item.key}
          item={item}
          active={activeView === item.key}
          onClick={() => onNav(item.key)}
        />
      ))}

      {/* Dark mode toggle */}
      <div style={{ height: 1, background: RULE, margin: '12px 8px 8px' }} />
      <div
        onClick={onToggleDark}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 8px',
          borderRadius: 4,
          color: DIM,
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: SANS,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {darkMode ? <Sun size={13} /> : <Moon size={13} />}
        <span>{darkMode ? 'Lys modus' : 'Mørk modus'}</span>
      </div>

      {/* User card */}
      <div style={{ marginTop: 'auto', padding: '10px 8px', borderTop: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: ACCENT, color: SIDE,
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: INK, fontFamily: SANS, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: DIM }}>fotograf · seksjon</div>
        </div>
      </div>
    </div>
  );
}

// Mobile bottom tab bar
export function DopMobileTabBar({ activeView, onNav }: { activeView: MainView; onNav: (view: MainView) => void }) {
  const tabs = [
    { key: 'dashboard' as MainView, label: 'I DAG',    Icon: LayoutDashboard },
    { key: 'browse'    as MainView, label: 'ORDRE',    Icon: FolderOpen      },
    { key: 'calendar'  as MainView, label: 'KALENDER', Icon: Calendar        },
    { key: 'archive'   as MainView, label: 'MER',      Icon: Archive         },
  ];
  return (
    <div style={{
      display: 'flex',
      background: SIDE,
      borderTop: `1px solid ${RULE}`,
      padding: '6px 0 env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onNav(key)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 0',
            color: activeView === key ? ACCENT : DIM,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.08em',
          }}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}
