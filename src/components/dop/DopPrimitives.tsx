import React from "react";

// ─── DopPill ────────────────────────────────────────────────────────────────
interface DopPillProps {
  bg: string;
  fg: string;
  bold?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
export function DopPill({ bg, fg, bold, children, style }: DopPillProps) {
  return (
    <span style={{
      display: 'inline-block',
      background: bg,
      color: fg,
      fontFamily: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
      fontSize: 10,
      padding: '2px 7px',
      borderRadius: 3,
      letterSpacing: '0.04em',
      fontWeight: bold ? 600 : 500,
      whiteSpace: 'nowrap',
      ...style
    }}>
      {children}
    </span>
  );
}

// ─── DopKbd ─────────────────────────────────────────────────────────────────
interface DopKbdProps {
  children: React.ReactNode;
  hairColor?: string;
}
export function DopKbd({ children, hairColor = 'rgba(255,255,255,0.15)' }: DopKbdProps) {
  return (
    <span style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 10,
      padding: '1px 5px',
      border: `1px solid ${hairColor}`,
      borderRadius: 3,
      color: 'rgba(255,255,255,0.5)',
      background: 'rgba(255,255,255,0.06)',
    }}>
      {children}
    </span>
  );
}

// ─── DopSmallcap ─────────────────────────────────────────────────────────────
export const dopSmallcap: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 10,
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
};

// ─── DopStatCard ─────────────────────────────────────────────────────────────
interface DopStatCardProps {
  label: string;
  value: number;
  desc: string;
  valueColor: string;
  bg: string;
  borderColor: string;
  inkColor: string;
}
export function DopStatCard({ label, value, desc, valueColor, bg, borderColor, inkColor }: DopStatCardProps) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        padding: '11px 14px',
        cursor: 'default',
        transition: 'transform .12s, box-shadow .12s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 2px 0 ${inkColor}` : 'none',
      }}
    >
      <div style={{ ...dopSmallcap, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 32,
          color: valueColor,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {String(value).padStart(2, '0')}
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: 'rgba(0,0,0,0.4)',
        }}>
          {desc}
        </div>
      </div>
    </div>
  );
}
