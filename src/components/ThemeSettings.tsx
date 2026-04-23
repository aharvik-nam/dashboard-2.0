import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Save, RotateCcw, Palette, Type, Layout, CreditCard, User, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { SectionHeader } from "./ui/SectionHeader";
import { Card } from "./ui/Card";
import { PhotographerSettingsTab } from "./PhotographerSettingsTab";
import { ColorsTab } from "./settings/ColorsTab";
import { CardsTab } from "./settings/CardsTab";
import { JobDetailsTab } from "./settings/JobDetailsTab";
import { TypographyTab } from "./settings/TypographyTab";
import { ThemePreviewPanel } from "./settings/ThemePreviewPanel";

interface ThemeSettingsProps {
  uniqueLocations?: string[];
  uniqueTypes?: string[];
  uniqueOwners?: string[];
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ uniqueLocations = [], uniqueTypes = [], uniqueOwners = [] }) => {
  const { theme, updateTheme, resetTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'cards' | 'jobDetails' | 'typography' | 'photographers'>('colors');
  const [previewMode, setPreviewMode] = useState<'card' | 'details'>('card');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('settings_authenticated') === 'true';
  });
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError("");
    
    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('settings_authenticated', 'true');
      } else {
        setAuthError(data.message || "Feil passord");
      }
    } catch (error) {
      setAuthError("Kunne ikke verifisere passord. Prøv igjen senere.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-switch preview mode based on tab
  React.useEffect(() => {
    if (activeTab === 'jobDetails') setPreviewMode('details');
    else if (activeTab === 'cards') setPreviewMode('card');
  }, [activeTab]);

  const handleChange = (key: string, value: string) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
    setHasChanges(true);
    updateTheme({ [key]: value });
  };

  const handleArrayChange = (key: string, index: number, value: string) => {
    const currentArray = localTheme[key as keyof typeof localTheme] as string[];
    const newArray = [...currentArray];
    newArray[index] = value;
    
    const newTheme = { ...localTheme, [key]: newArray };
    setLocalTheme(newTheme);
    setHasChanges(true);
    updateTheme({ [key]: newArray });
  };

  const handleCardSettingChange = (key: string, value: unknown) => {
    const newSettings = { 
      ...localTheme.cardSettings, 
      [key]: value 
    };
    const newTheme = { ...localTheme, cardSettings: newSettings };
    setLocalTheme(newTheme);
    setHasChanges(true);
    updateTheme({ cardSettings: newSettings });
  };

  const handleJobDetailsChange = (key: string, value: unknown) => {
    const newSettings = { 
      ...localTheme.jobDetailsSettings, 
      [key]: value 
    };
    // Ensure defaults if undefined (for migration)
    if (!newSettings.highlightFields) newSettings.highlightFields = ['deadline', 'location', 'usage'];
    if (!newSettings.artworkListFields) newSettings.artworkListFields = ['invNr', 'title', 'artist', 'dimensions', 'material', 'technique', 'materialDescription'];
    if (newSettings.artworkFieldMapping === undefined) {
      newSettings.artworkFieldMapping = {
        invNr: 0, title: 1, artist: 1, dimensions: 3, material: 2, technique: 2, materialDescription: 2, objectName: 0
      };
    }
    if (newSettings.artworkColumnHeaders === undefined) {
      newSettings.artworkColumnHeaders = ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål'];
    }
    
    const newTheme = { ...localTheme, jobDetailsSettings: newSettings };
    setLocalTheme(newTheme);
    setHasChanges(true);
    updateTheme({ jobDetailsSettings: newSettings });
  };

  const handleFieldMappingChange = (fieldKey: string, columnIndex: number) => {
    const newMapping = {
      ...(localTheme.jobDetailsSettings?.artworkFieldMapping || {
        invNr: 0, title: 1, artist: 1, dimensions: 3, material: 2, technique: 2, materialDescription: 2, objectName: 0
      }),
      [fieldKey]: columnIndex
    };
    handleJobDetailsChange('artworkFieldMapping', newMapping);
  };

  const handleColumnHeaderChange = (index: number, value: string) => {
    const newHeaders = [...(localTheme.jobDetailsSettings?.artworkColumnHeaders || ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål'])];
    newHeaders[index] = value;
    handleJobDetailsChange('artworkColumnHeaders', newHeaders);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const handleFontSizeOffsetChange = (offset: number) => {
    const newTheme = { ...localTheme, fontSizeOffset: offset };
    setLocalTheme(newTheme);
    setHasChanges(true);
    updateTheme({ fontSizeOffset: offset });
  };

  const handleSave = async () => {
    await updateTheme(localTheme);
    setHasChanges(false);
  };

  const handleReset = async () => {
    await resetTheme();
    setLocalTheme(theme);
    setHasChanges(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-stone-900" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-serif font-black text-stone-900">Beskyttet område</h2>
              <p className="text-sm text-stone-500">Vennligst oppgi passord for å få tilgang til innstillinger.</p>
            </div>
            
            <form onSubmit={handleVerifyPassword} className="w-full space-y-4">
              <div className="space-y-1.5">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passord"
                  className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-stone-900/5 transition-all outline-none ${
                    authError ? 'border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                  autoFocus
                />
                {authError && (
                  <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider px-1">
                    <AlertCircle className="w-3 h-3" />
                    {authError}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-900/10 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Lås opp
                  </>
                )}
              </button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionHeader 
          title="Temainnstillinger" 
          description="Tilpass farger, fonter og utseende for applikasjonen."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-stone-900 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <RotateCcw className="w-4 h-4" />
            Tilbakestill
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors text-xs font-bold uppercase tracking-widest shadow-lg shadow-stone-900/10"
            >
              <Save className="w-4 h-4" />
              Lagre Endringer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl w-fit flex-wrap">
              {[
                { id: 'colors', icon: Palette, label: 'Farger' },
                { id: 'cards', icon: CreditCard, label: 'Kort' },
                { id: 'jobDetails', icon: Layout, label: 'Detaljer' },
                { id: 'typography', icon: Type, label: 'Tekst' },
                { id: 'photographers', icon: User, label: 'Fotografer' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

          {activeTab === 'photographers' && (
            <PhotographerSettingsTab uniqueOwners={uniqueOwners} />
          )}

          {activeTab === 'jobDetails' && (
            <JobDetailsTab
              localTheme={localTheme}
              onJobDetailsChange={handleJobDetailsChange}
              onFieldMappingChange={handleFieldMappingChange}
              onColumnHeaderChange={handleColumnHeaderChange}
              toggleArrayItem={toggleArrayItem}
            />
          )}

          {activeTab === 'colors' && (
            <ColorsTab
              localTheme={localTheme}
              uniqueLocations={uniqueLocations}
              uniqueTypes={uniqueTypes}
              onChange={handleChange}
              onArrayChange={handleArrayChange}
            />
          )}

          {activeTab === 'cards' && (
            <CardsTab
              localTheme={localTheme}
              onCardSettingChange={handleCardSettingChange}
            />
          )}

          {activeTab === 'typography' && (
            <TypographyTab
              localTheme={localTheme}
              onChange={handleChange}
              onFontSizeOffsetChange={handleFontSizeOffsetChange}
            />
          )}
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-1">
          <ThemePreviewPanel
            localTheme={localTheme}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        </div>
      </div>
    </div>
  );
};
