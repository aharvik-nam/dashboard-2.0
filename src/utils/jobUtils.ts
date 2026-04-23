import type { CSSProperties } from "react";
import { parseInventoryNumbers, getNMImage } from "./nmUtils.js";
import { FIELDS } from "../constants/fieldNames";
import type { ThemeColors } from "../context/ThemeContext";

export { getNMImage };

export interface HubSpotTrack {
  id: string;
  isHubSpot: boolean;
  skalFoto: boolean;
  invNr: string;
  kunstner: string;
  teknikk: string;
  mal: string;
}

export const parseHubSpotTracks = (props: any): HubSpotTrack[] => {
  const spor: HubSpotTrack[] = [];
  
  // Find all keys that match the pattern "bilde_X_skal_fotograferes"
  // to determine which indices exist dynamically
  const indices = new Set<number>();
  Object.keys(props).forEach(key => {
    const match = key.match(/^bilde_(\d+)_skal_fotograferes$/);
    if (match) {
      indices.add(parseInt(match[1], 10));
    }
    // Also check for other fields in case "skal_fotograferes" is missing but others exist
    const invMatch = key.match(/^inventarnummer_(\d+)$/);
    if (invMatch) indices.add(parseInt(invMatch[1], 10));
  });

  // Sort indices to maintain order
  const sortedIndices = Array.from(indices).sort((a, b) => a - b);
  
  for (const i of sortedIndices) {
    const skalFotoRaw = props[`bilde_${i}_skal_fotograferes`];
    const invNrRaw = props[`inventarnummer_${i}`];
    const kunstnerRaw = props[`kunstner_${i}`];
    const teknikkRaw = props[`teknikk_og_mal_${i}`] || props[`teknikk_${i}`] || "-";
    const malRaw = props[`mal_${i}`];
    
    const isSkalFoto = skalFotoRaw === "true" || skalFotoRaw === "Ja" || skalFotoRaw === true;
    const hasInvNr = invNrRaw && String(invNrRaw).trim() !== "" && String(invNrRaw).trim() !== "-";
    const hasKunstner = kunstnerRaw && String(kunstnerRaw).trim() !== "" && String(kunstnerRaw).trim() !== "-";
    const hasTeknikk = teknikkRaw && String(teknikkRaw).trim() !== "" && String(teknikkRaw).trim() !== "-";
    const hasMal = malRaw && String(malRaw).trim() !== "" && String(malRaw).trim() !== "-";
    
    if (isSkalFoto || hasInvNr || hasKunstner || hasTeknikk || hasMal) {
      const parsedIds = invNrRaw ? parseInventoryNumbers(String(invNrRaw)) : [];
      
      if (parsedIds.length > 1) {
        // Multiple IDs found, create multiple rows
        parsedIds.forEach((id, idx) => {
          spor.push({
            id: `hubspot-${i}-${idx}`,
            isHubSpot: true,
            skalFoto: isSkalFoto,
            invNr: id,
            kunstner: kunstnerRaw || "-",
            teknikk: teknikkRaw,
            mal: malRaw || "-"
          });
        });
      } else {
        // Single ID or none
        spor.push({
          id: `hubspot-${i}`,
          isHubSpot: true,
          skalFoto: isSkalFoto,
          invNr: parsedIds[0] || invNrRaw || "-",
          kunstner: kunstnerRaw || "-",
          teknikk: teknikkRaw,
          mal: malRaw || "-"
        });
      }
    }
  }
  return spor;
};

export const parseDate = (dateStr: any): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  if (typeof dateStr === 'string') {
    // Handle DD.MM.YYYY
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }

    // Handle YYYY-MM-DD
    const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
};

export const formatDate = (dateStr: any) => {
  if (!dateStr) return "-";
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  
  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });
};

export const getDeadlineInfo = (dateStr: any, theme?: any) => {
  const criticalColor = theme?.statusCritical || "#C0392B";
  const overdueColor = theme?.statusOverdue || "#B7762E";
  const withinColor = theme?.statusWithin || "#2E7D4F";

  const defaultInfo = { 
    diffInDays: null, 
    statusColor: withinColor, 
    statusTextColor: getContrastColor(withinColor),
    label: "" 
  };
  const deadline = parseDate(dateStr);
  
  if (!deadline) return defaultInfo;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadline);
    target.setHours(0, 0, 0, 0);
    
    const diffInTime = target.getTime() - today.getTime();
    const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));

    let statusColor = withinColor;
    let label = "";
    
    if (diffInDays < -100) {
      statusColor = criticalColor;
      label = `${Math.abs(diffInDays)} dager over frist`;
    } else if (diffInDays < 0) {
      statusColor = overdueColor;
      label = `${Math.abs(diffInDays)} dager over frist`;
    } else if (diffInDays === 0) {
      label = "Frist i dag";
    } else {
      label = `${diffInDays} dager til frist`;
    }

    return { diffInDays, statusColor, statusTextColor: getContrastColor(statusColor), label };
  } catch (e) {
    return { ...defaultInfo, statusTextColor: getContrastColor(defaultInfo.statusColor) };
  }
};

export const splitTitle = (title: string) => {
  const parts = title.split(" - ");
  if (parts.length < 2) return { name: title, type: null };
  
  const name = parts[0]
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
    
  const type = parts[1];
  return { name, type };
};

export const isInternJob = (job: any): boolean => {
  const props = job.all_properties || {};
  const amountStr = props.amount;
  const amount = (amountStr !== undefined && amountStr !== null && amountStr !== "") ? parseFloat(amountStr) : 0;
  
  const isAutomation = props.hs_object_source === "AUTOMATION_PLATFORM";
  const isPhotoOrder = (props.hs_object_source_detail_1 || "").includes("Fotobestilling - Opprettelse av deal");
  const isZeroAmount = !amountStr || amount === 0;

  return isAutomation && (isPhotoOrder || isZeroAmount);
};

export const isExternJob = (job: any): boolean => {
  const props = job.all_properties || {};
  const amountStr = props.amount;
  const amount = (amountStr !== undefined && amountStr !== null && amountStr !== "") ? parseFloat(amountStr) : 0;
  const numItems = parseInt(props.hs_num_of_associated_line_items || "0", 10);

  return amount > 0 || numItems > 0;
};

export const formatType = (type: string, props?: any, title?: string) => {
  let result = type || "";
  
  // Handle "Ukjent" or empty type
  if (!result || result === "Ukjent") {
    // Check title first as requested by user
    if (title) {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("intern")) return "Intern bildebestilling";
      if (lowerTitle.includes("ekstern")) return "Ekstern bildebestilling";
    }

    // Fallback to oppdragstype
    const oppdragstype = props?.oppdragstype || "";
    if (oppdragstype.toLowerCase().includes("intern")) return "Intern bildebestilling";
    if (oppdragstype.toLowerCase().includes("ekstern")) return "Ekstern bildebestilling";
    return "Bildebestilling";
  }

  // If type is "Annet" and we have a description in props, use it
  if (result.toLowerCase().includes("annet") && props?.tilleggsinformasjon_foto) {
    const desc = props.tilleggsinformasjon_foto.trim();
    if (desc && desc !== "Ingen spesielle ønsker oppgitt.") {
      return desc;
    }
  }
  
  return result.replace(/\s*\(.*?\)\s*/g, "").trim();
};

export const getJobDate = (job: any) => {
  const props = job.all_properties || {};
  return props[FIELDS.DEADLINE] || props[FIELDS.DATETIME] || job.deadline || job.due_date;
};

export const getJobLocationStr = (props: any): string =>
  props[FIELDS.LOCATION] || props[FIELDS.LOCATION_ALT] || "Ukjent";

export const getJobTypeStr = (props: any): string =>
  props[FIELDS.TYPE] || "";

export const getJobDeadlineStr = (props: any, job?: any): string | undefined =>
  props[FIELDS.DEADLINE] || props[FIELDS.DATETIME] || job?.due_date;

export type LocationCategory = 'studio' | 'location' | 'foh' | 'other';

export const categorizeLocation = (rawLoc: string): LocationCategory => {
  const l = rawLoc.toLowerCase();
  if (l.includes("front of house")) return 'foh';
  if (l.includes("location") || l.includes("ute")) return 'location';
  if (
    l.includes("maleri") || l.includes("objekt") || l.includes("gjenstand") ||
    l.includes("reprorom") || l.includes("kunst på papir") || l.includes("digitalisering")
  ) return 'studio';
  return 'other';
};

export const shortenLocation = (location: string): string => {
  if (!location) return "";
  return location
    .replace(/fotoatelier\s+/i, "")
    .replace(/foto\s+digitalisering/i, "Digitalisering")
    .trim();
};

export const formatLocation = (location: string, props?: any, title?: string) => {
  const loc = location || "Ukjent";
  if (loc === "Ukjent") {
    const type = formatType(props?.type_fotografering || "Ukjent", props, title);
    if (type.toLowerCase().includes("bildebestilling")) {
      return "Bildebestilling";
    }
  }
  return shortenLocation(loc);
};

// Deterministic mapping for locations
// We map known locations to specific indices to ensure uniqueness as requested.
// Exceptions: "Reprorom" and "Fotoatelier Kunst på papir" share index 2.
export const LOCATION_MAPPING: Record<string, number> = {
  "foto digitalisering": 10,
  "fotoatelier gjenstand": 9,
  "fotoatelier objekt": 8,
  "objekt": 8,
  "gjenstand": 9,
  "digitalisering": 10,
  "maleri": 0,
  "skulptur": 1,
  "kunst på papir": 2,
  "reprorom": 2, // Shared with Kunst på papir
  "arkitektur": 3,
  "front of house": 4,
  "design": 5,
  "grafikk": 6,
  "foto": 7,
  "ukjent": 11
};

export const getLocationIndex = (location: string): number => {
  if (!location) return 11; // Default to Ukjent (11) instead of Maleri (0)
  
  const lowerLoc = location.toLowerCase().trim();
  
  // Check explicit mapping first
  for (const [key, index] of Object.entries(LOCATION_MAPPING)) {
    if (lowerLoc.includes(key)) return index;
  }

  // Fallback hash for unknown locations
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = location.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return Math.abs(hash) % 12; // 12 is length of locationPalette
};

export const getLocationColor = (location: string) => {
  if (!location) return { hex: "var(--app-stone-100)", text: "text-stone-600", style: { backgroundColor: "var(--app-stone-100)", color: "var(--app-stone-600)" } };
  
  const index = getLocationIndex(location);
  const colorVar = `var(--app-location-palette-${index})`;
  return { hex: colorVar, text: "text-stone-900", style: { backgroundColor: colorVar, color: "var(--app-stone-900)" } };
};

// Deterministic mapping for types
export const TYPE_MAPPING: Record<string, number> = {
  "maleri": 0,
  "utstillingsåpning": 1,
  "skulptur": 2,
  "arkitektur": 3,
  "utstillingsdokumentasjon": 4,
  "gjenstand": 5,
  "objekt": 5,
  "installasjon": 6,
  "portrett": 7,
  "arrangement kveldstid/helg": 8,
  "arrangement kveldstid": 8,
  "arrangement": 9,
  "konservering": 10,
  "kunstverk i utstilling": 11,
  "bilder fra arkiv": 12,
  "annet": 13,
  "press/kommunikasjon/some": 14,
  "presse": 14,
  "fotografering til butikk/markedsføring": 15,
  "kunst på papir": 7, // Shared with portrett
  "intern bildebestilling": 13,
  "ekstern bildebestilling": 14,
  "bildebestilling": 15
};

export const getTypeIndex = (type: string): number => {
  if (!type) return 0;
  
  const lowerType = type.toLowerCase().trim();
  
  // Check explicit mapping first
  for (const [key, index] of Object.entries(TYPE_MAPPING)) {
    if (lowerType.includes(key)) return index;
  }
  
  // Fallback hash for unknown types
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return Math.abs(hash) % 16; // 16 is length of typePalette
};

export const getTypeColor = (type: string) => {
  if (!type) return { hex: "var(--app-stone-900)", text: "text-white", style: { backgroundColor: "var(--app-stone-900)", color: "var(--app-stone-50)" } };
  
  const index = getTypeIndex(type);
  const colorVar = `var(--app-type-palette-${index})`;
  return { hex: colorVar, text: "text-stone-900", style: { backgroundColor: colorVar, color: "var(--app-stone-900)" } };
};

export const LOCATION_PALETTE = Array.from({ length: 12 }, (_, i) => `var(--app-location-palette-${i})`);
export const TYPE_PALETTE = Array.from({ length: 16 }, (_, i) => `var(--app-type-palette-${i})`);

/**
 * Color manipulation utilities for dynamic tag contrast
 */

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToCss = (h: number, s: number, l: number): string => {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
};

export const getContrastColor = (hex: string): string => {
  if (!hex || !hex.startsWith("#")) return "inherit";
  
  const { h, s, l } = hexToHsl(hex);
  
  if (l > 50) {
    // Light background: darkened, saturated version
    // Darken by 50-60%, increase saturation
    const newL = Math.max(10, l - 55);
    const newS = Math.min(100, s + 20);
    return hslToCss(h, newS, newL);
  } else {
    // Dark background: lightened, soft version
    // Lighten by 50-60%, decrease saturation slightly for "soft" feel
    const newL = Math.min(95, l + 55);
    const newS = Math.max(10, s - 10);
    return hslToCss(h, newS, newL);
  }
};

export const getPaletteColor = (palette: string[], index: number) => {
  const hex = palette[index] || "#a8a29e";
  const contrast = getContrastColor(hex);
  return {
    bg: hex,
    text: contrast
  };
};

export const getTagColor = (typeStr: string | null, theme: ThemeColors) => {
  if (!typeStr) return { bg: "transparent", text: "inherit" };
  const lowerType = typeStr.toLowerCase();
  let hex = theme.tagDefault;
  if (lowerType.includes("intern")) hex = theme.tagInternal;
  if (lowerType.includes("ekstern")) hex = theme.tagExternal;
  
  return {
    bg: hex,
    text: getContrastColor(hex)
  };
};

export const extractUrls = (text: string) => {
  if (!text || typeof text !== 'string') return [];
  
  // Attempt to "heal" URLs that are split by newlines (common in wrapped text)
  // We join lines that don't have spaces around the newline
  const healedText = text.replace(/([^\s])[\n\r]+([^\s])/g, "$1$2");
  
  // Standard URL regex on the healed text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = healedText.match(urlRegex) || [];
  
  // Clean up trailing punctuation
  return Array.from(new Set(matches.map(url => url.replace(/[.,!?;:]+$/, ""))));
};

export const getBadgeStyle = (
  badgeStyle: 'solid' | 'outline' | 'soft' | 'subtle' | string,
  colorVar: string
): CSSProperties => {
  if (badgeStyle === 'outline') {
    return {
      border: `1px solid ${colorVar}`,
      color: 'var(--color-stone-900)',
      backgroundColor: 'transparent',
    };
  }
  if (badgeStyle === 'soft') {
    return {
      backgroundColor: `color-mix(in srgb, ${colorVar}, white 60%)`,
      color: 'var(--color-stone-900)',
    };
  }
  if (badgeStyle === 'subtle') {
    return {
      backgroundColor: `${colorVar}15`,
      border: `1px solid ${colorVar}30`,
    };
  }
  return {
    backgroundColor: colorVar,
    color: 'var(--color-text-primary)',
  };
};

export const getCardSizeClasses = (cardSize: 'compact' | 'normal' | 'large') => ({
  padding: cardSize === 'compact' ? 'p-3' : cardSize === 'large' ? 'p-6' : 'p-5',
  title:   cardSize === 'compact' ? 'text-base' : cardSize === 'large' ? 'text-xl' : 'text-lg',
  gap:     cardSize === 'compact' ? 'gap-2' : 'gap-4',
});

export const getTypeBadgeColor = (typeStr: string | null) => {
  if (!typeStr) return "";
  const lowerType = typeStr.toLowerCase();
  if (lowerType.includes("intern")) return "bg-tag-internal text-white";
  if (lowerType.includes("ekstern")) return "bg-tag-external text-white";
  return "bg-tag-default text-stone-900";
};

export const formatPhotographyType = (type: string | null | undefined, props?: any) => {
  if (!type) return null;
  
  // If type is "Annet" and we have a description in props, use it
  if (type.toLowerCase().includes("annet") && props?.tilleggsinformasjon_foto) {
    const desc = props.tilleggsinformasjon_foto.trim();
    if (desc && desc !== "Ingen spesielle ønsker oppgitt.") {
      return desc;
    }
  }

  if (type === "Objekt (store gjenstander som skulpturer, møbler, installasjoner m.m)") {
    return "Objekt (Stor gjenstand)";
  }
  if (type === "Gjenstand (små gjenstander som glass, smykker, keramikk m.m)") {
    return "Gjenstand (Mindre gjenstand)";
  }
  return type;
};

export const isJobNB = (job: any, jobOverrides: Record<string, { sendToNB?: boolean }> = {}) => {
  if (!job || !job.id) return false;
  const idStr = String(job.id);
  // Safely check both the string and raw id in case of type discrepancies from the API
  return !!(jobOverrides[idStr]?.sendToNB || jobOverrides[job.id]?.sendToNB);
};

export const isLargeObject = (dimensions: string | null | undefined, location?: string | null): boolean => {
  if (!dimensions) return false;
  
  // Normalize string: lowercase
  const norm = dimensions.toLowerCase();
  
  // Regex to find numbers and optional units
  const regex = /(\d+(?:[.,]\d+)?)\s*(cm|mm|m)?/g;
  const values: { val: number; unit: string | null }[] = [];
  let lastFoundUnit: string | null = null;
  
  let match;
  while ((match = regex.exec(norm)) !== null) {
    const val = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || null;
    if (unit) lastFoundUnit = unit;
    values.push({ val, unit });
  }
  
  if (values.length === 0) return false;
  
  // If some numbers don't have units, use the last found unit in the string (e.g. "100 x 200 mm")
  // If no unit found at all, default to cm
  const defaultUnit = lastFoundUnit || 'cm';
  
  const cmValues = values.map(v => {
    const unit = v.unit || defaultUnit;
    let val = v.val;
    if (unit === 'm') val *= 100;
    else if (unit === 'mm') val /= 10;
    return val;
  });
  
  const sortedCm = [...cmValues].sort((a, b) => b - a);
  
  const loc = (location || "").toLowerCase();
  const isSpecialLocation = loc.includes("kunst på papir") || loc.includes("reprorom");
  
  if (isSpecialLocation) {
    // Threshold for special rooms: 100x70 cm
    // Large if longest side > 100 OR second longest side > 70
    return sortedCm[0] > 100 || (sortedCm[1] !== undefined && sortedCm[1] > 70);
  }
  
  // Default threshold: 200cm (2 meters)
  return sortedCm[0] >= 200;
};
