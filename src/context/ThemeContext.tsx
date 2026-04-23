import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ThemeColors {
  stone50: string;
  stone100: string;
  stone200: string;
  stone300: string;
  stone400: string;
  stone500: string;
  stone600: string;
  stone700: string;
  stone800: string;
  stone900: string;
  stone950: string;
  brandGreen: string;
  brandInternal: string;
  brandExternal: string;
  
  // Deadlines
  statusCritical: string;
  statusOverdue: string;
  statusWithin: string;
  statusProgress: string;
  statusNB: string;

  // Tags
  tagInternal: string;
  tagExternal: string;
  tagDefault: string;

  // Palettes
  locationPalette: string[];
  typePalette: string[];

  // Typography
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  fontSizeBase: string; // e.g. "16px"
  textColorPrimary: string;
  textColorSecondary: string;
  textColorMuted: string;
  textColorInverted: string;
  fontSizeOffset: number; // 0, 1, 2, 3, 4
  
  // Layout
  radiusBase: string; // e.g. "0.5rem"
  spacingScale: number; // e.g. 1
  
  // Header & Navigation
  headerBg: string;
  headerBorder: string;
  navBg: string;
  navBorder: string;

  // Report / statistics accent palette
  reportPurple: string;
  reportTeal: string;
  reportCoral: string;
  reportAmber: string;
  reportGreen: string;
  reportBlue: string;
  
  // Card Settings
  cardSettings: {
    showLocation: boolean;
    showType: boolean;
    showTechnique: boolean;
    showDeadline: boolean;
    showOwner: boolean;
    cardSize: 'compact' | 'normal' | 'large';
    cardWidth: number; // 0 = auto/responsive
    cardShadow: 'none' | 'sm' | 'md' | 'lg';
    badgeStyle: 'solid' | 'outline' | 'soft';
    cardBorderRadius: string; // e.g. "1rem"
  };

  // Job Details Settings
  jobDetailsSettings: {
    showArtworkImages: boolean;
    highlightFields: string[]; // Fields to highlight in the header/info bar
    artworkListFields: string[]; // Fields to show in the artwork list table
    showArtworkApiId: boolean; // Whether to show the API ID in the artwork list
    showCollectionBadge: boolean; // Whether to show the "Nasjonalmuseet" badge
    collectionBadgeColumn: number; // Which column index (0-3) to show the badge in
    artworkFieldMapping: Record<string, number>; // fieldKey -> column index (0-3)
    artworkColumnHeaders: string[]; // Array of 4 column headers
  };
}

const DARK_OVERRIDES: Partial<ThemeColors> = {
  stone50:  "#0e0c0b",  // app background — darkest
  stone100: "#1a1714",  // card surface — clearly lifted from bg
  stone200: "#2c2724",  // borders, dividers
  stone300: "#3d3835",
  stone400: "#5a5450",
  stone500: "#78716c",
  stone600: "#a8a29e",
  stone700: "#c8c2bc",
  stone800: "#dedad5",
  stone900: "#eeeae5",
  stone950: "#f5f2ee",
  textColorPrimary:   "#eeeae5",
  textColorSecondary: "#a8a29e",
  textColorMuted:     "#5a5450",
  textColorInverted:  "#141210",
  headerBg:    "#1c1917",
  headerBorder: "#28231e",
  navBg:   "rgba(40, 35, 30, 0.85)",
  navBorder: "rgba(255, 255, 255, 0.06)",
  statusCritical: "#DDA84A",
  statusOverdue:  "#D06858",
  statusWithin:   "#60A87A",
  statusProgress: "#6A96C0",
  statusNB:       "#9B7EC0",
  reportPurple: "#7B72D4",
  reportTeal:   "#2E9E7A",
  reportCoral:  "#C05535",
  reportAmber:  "#B07020",
  reportGreen:  "#2EC48F",
  reportBlue:   "#3381C5",
};

const DEFAULT_THEME: ThemeColors = {
  stone50: "#fafaf9",
  stone100: "#f5f5f4",
  stone200: "#e7e5e4",
  stone300: "#d6d3d1",
  stone400: "#a8a29e",
  stone500: "#78716c",
  stone600: "#57534e",
  stone700: "#44403c",
  stone800: "#292524",
  stone900: "#1c1917",
  stone950: "#0c0a09",
  brandGreen: "#7CAE7A",
  brandInternal: "#7BB2D9",
  brandExternal: "#8B687F",

  // Deadlines — urgency scale: brick red → amber → sage green
  statusCritical: "#C49040",
  statusOverdue: "#B85448",
  statusWithin: "#4E8A64",
  statusProgress: "#5580A8",
  statusNB: "#7B5EA0",

  // Tags
  tagInternal: "#78716c", // stone-500
  tagExternal: "#292524", // stone-800
  tagDefault: "#a8a29e",  // stone-400

  // Palettes — locations: cool tones (spatial), types: warm earth tones (categorical)
  locationPalette: [
    "#7AA8C0", "#5E9E8E", "#88A0BE", "#6EA888",
    "#7EB8C8", "#5E88A8", "#9BA0B8", "#6E98A8",
    "#78B0A0", "#8AA8C0", "#5E8898", "#88B0A8"
  ],
  typePalette: [
    "#C8A880", "#B89070", "#C4A090", "#B0A870",
    "#C8B890", "#C09878", "#B8A888", "#B8C0A0",
    "#C0B098", "#B89888", "#C8B078", "#B0B898",
    "#C0A898", "#B8A070", "#C4B0A0", "#A8B8A0"
  ],

  // Typography
  fontSans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fontSerif: '"Playfair Display", serif',
  fontMono: '"JetBrains Mono", monospace',
  fontSizeBase: "16px",
  textColorPrimary: "#1c1917", // stone-900
  textColorSecondary: "#57534e", // stone-600
  textColorMuted: "#a8a29e", // stone-400
  textColorInverted: "#fafaf9", // stone-50
  fontSizeOffset: 0,

  // Layout
  radiusBase: "0.5rem",
  spacingScale: 1,
  
  // Header & Navigation
  headerBg: "#F5F2EE",
  headerBorder: "#E8E2D9",
  navBg: "rgba(231, 229, 228, 0.5)",
  navBorder: "transparent",

  // Report / statistics accent palette
  reportPurple: "#534AB7",
  reportTeal: "#0F6E56",
  reportCoral: "#993C1D",
  reportAmber: "#854F0B",
  reportGreen: "#1D9E75",
  reportBlue: "#185FA5",
  
  // Card Settings
  cardSettings: {
    showLocation: true,
    showType: true,
    showTechnique: true,
    showDeadline: true,
    showOwner: true,
    cardSize: 'normal',
    cardWidth: 0,
    cardShadow: 'sm',
    badgeStyle: 'solid',
    cardBorderRadius: '1rem'
  },

  // Job Details Settings
  jobDetailsSettings: {
    showArtworkImages: true,
    highlightFields: ['deadline', 'location', 'usage'],
    artworkListFields: ['invNr', 'title', 'artist', 'dimensions', 'material', 'technique', 'materialDescription'],
    showArtworkApiId: false,
    showCollectionBadge: true,
    collectionBadgeColumn: 1,
    artworkFieldMapping: {
      invNr: 0,
      title: 1,
      artist: 1,
      dimensions: 3,
      material: 2,
      technique: 2,
      materialDescription: 2,
      objectName: 0
    },
    artworkColumnHeaders: ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål']
  }
};

interface ThemeContextType {
  theme: ThemeColors;
  baseTheme: ThemeColors;
  updateTheme: (newTheme: Partial<ThemeColors>) => Promise<void>;
  resetTheme: () => Promise<void>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  loading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseTheme, setBaseTheme] = useState<ThemeColors>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('darkMode') === 'true');

  const theme: ThemeColors = darkMode ? { ...baseTheme, ...DARK_OVERRIDES } : baseTheme;

  // Load theme from Firestore on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const docRef = doc(db, "settings", "theme");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBaseTheme({ ...DEFAULT_THEME, ...docSnap.data() } as ThemeColors);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    const applyVariables = (obj: any, prefix = 'app') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        // Special handling for font size with offset
        if (key === 'fontSizeBase' || key === 'fontSizeOffset') {
          const base = parseInt(baseTheme.fontSizeBase) || 16;
          const offset = baseTheme.fontSizeOffset || 0;
          root.style.setProperty('--app-font-size-base', `${base + offset}px`);
          return;
        }

        // Skip nested objects for now, or handle them recursively if needed
        if (typeof value === 'object' && !Array.isArray(value)) {
          // For cardSettings and jobDetailsSettings, we could flatten them if needed
          // but for now we focus on the top-level variables
          return;
        }

        const kebabKey = key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
        const variableName = `--${prefix}-${kebabKey}`;

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            root.style.setProperty(`${variableName}-${index}`, String(item));
          });
        } else {
          // Handle stone colors specifically if needed, but kebabKey should handle stone50 -> stone-50
          root.style.setProperty(variableName, String(value));
        }
      });
    };

    applyVariables(theme);
  }, [theme, darkMode]);

  const updateTheme = async (newTheme: Partial<ThemeColors>) => {
    setBaseTheme(prev => {
      const updatedTheme = { ...prev, ...newTheme };
      
      // Save to Firestore
      const saveTheme = async () => {
        try {
          const docRef = doc(db, "settings", "theme");
          await setDoc(docRef, updatedTheme);
        } catch (error) {
          console.error("Failed to save theme:", error);
        }
      };
      saveTheme();
      
      return updatedTheme;
    });
  };

  const resetTheme = async () => {
    setBaseTheme(DEFAULT_THEME);
    try {
      const docRef = doc(db, "settings", "theme");
      await setDoc(docRef, DEFAULT_THEME);
    } catch (error) {
      console.error("Failed to reset theme:", error);
    }
  };

  const zoomIn = () => {
    const currentSize = parseInt(baseTheme.fontSizeBase) || 16;
    updateTheme({ fontSizeBase: `${currentSize + 2}px` });
  };

  const zoomOut = () => {
    const currentSize = parseInt(baseTheme.fontSizeBase) || 16;
    if (currentSize > 8) {
      updateTheme({ fontSizeBase: `${currentSize - 2}px` });
    }
  };

  const resetZoom = () => {
    updateTheme({ fontSizeBase: "16px" });
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, baseTheme, updateTheme, resetTheme, zoomIn, zoomOut, resetZoom, loading, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
