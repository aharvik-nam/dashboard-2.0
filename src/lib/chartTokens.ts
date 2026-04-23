/*
 * chartTokens.ts — single source of truth for all Chart.js / D3 colors.
 *
 * These values mirror the CSS custom properties in index.css (section 5).
 * To change a report accent color:
 *   - Update the matching DEFAULT_THEME value in ThemeContext.tsx
 *   - Update the fallback hex here to match
 * Both files must stay in sync; the CSS drives the rendered page,
 * this file drives Chart.js (which cannot read CSS variables at render time).
 */

/* ── Report accent palette ───────────────────────────────────────────────── */

export const REPORT_COLORS = {
  purple: '#534AB7',
  purpleLight: 'rgba(83,74,183,0.22)',
  teal: '#0F6E56',
  tealLight: 'rgba(15,110,86,0.22)',
  coral: '#993C1D',
  coralLight: 'rgba(153,60,29,0.22)',
  amber: '#854F0B',
  amberLight: 'rgba(133,79,11,0.14)',
  green: '#1D9E75',
  greenLight: 'rgba(29,158,117,0.14)',
  blue: '#185FA5',
  blueLight: 'rgba(24,95,165,0.14)',
} as const;

/* ── Chart grid / axis colors ────────────────────────────────────────────── */

export const CHART_GRID = {
  line: 'rgba(0,0,0,0.04)',
  tickMuted: '#8c8278',
  tickPrimary: '#46413b',
  tickAlpha: 'rgba(0,0,0,0.4)',
  gridAlpha: 'rgba(0,0,0,0.05)',
} as const;

/* ── Stacked-bar tint ramps ──────────────────────────────────────────────── */
/* Used in FotograferingstidRapport for "bilder per objekt" charts.
   Index 0 = darkest (1 bilde), index 4 = lightest (5+ bilder). */

export const PURPLE_TINTS = [
  '#534AB7', // 1 bilde
  '#7a68a8', // 2 bilder
  '#9e90c0', // 3 bilder
  '#c0b8d8', // 4 bilder
  '#dddaee', // 5+ bilder
] as const;

export const CORAL_TINTS = [
  '#993C1D', // 1 bilde
  '#c25c4a', // 2 bilder
  '#de9888', // 3 bilder
  '#ecbcb0', // 4 bilder
  '#f6dcd8', // 5+ bilder
] as const;

/* ── Photographer colors (StatistikkRapport) ─────────────────────────────── */

export const PHOTOGRAPHER_COLORS: Record<string, string> = {
  'Børre Høstland': REPORT_COLORS.purple,
  'Andreas Harvik':  REPORT_COLORS.coral,
  'Ina Wesenberg':   REPORT_COLORS.green,
  'Annar Bjørgli':   REPORT_COLORS.blue,
  'Frode Larsen':    REPORT_COLORS.amber,
};

/* ── Heatmap base RGB components (FotograferingstidRapport) ──────────────── */
/* Derived from REPORT_COLORS.purple (#534AB7 → rgb 83,74,183).
   Used to compute dynamic rgba tints in buildHeatTable. */

export const HEATMAP_BASE_RGB = { r: 83, g: 74, b: 183 } as const;
export const HEATMAP_EMPTY = { background: '#f0ece4', color: '#aaa' } as const;
export const HEATMAP_DARK_TEXT = '#1a1714';
export const HEATMAP_LIGHT_TEXT = '#fff';

/* ── Year-series colors (StatistikkRapport sesong chart) ─────────────────── */

export const YEAR_SERIES_COLORS: Record<string, string> = {
  '2022': '#AFA9EC', // purple tint (early/baseline year)
  '2023': REPORT_COLORS.purple,
  '2024': REPORT_COLORS.green,
  '2025': REPORT_COLORS.coral,
};

/* ── Neutral / low-priority series ──────────────────────────────────────── */

export const NEUTRAL_SERIES = {
  mid: '#B4B2A9',
  light: '#D3D1C7',
  fallback: '#888',
  gray: '#5F5E5A',
} as const;

/* ── Table cell text colors ──────────────────────────────────────────────── */

export const TABLE_TEXT = {
  active: '#1A1916',
  muted: '#aaa',
  darkOnLight: '#26215C',
} as const;
