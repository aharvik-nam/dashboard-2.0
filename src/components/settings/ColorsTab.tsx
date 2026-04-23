import React from "react";
import { Info as InfoIcon } from "lucide-react";
import { ThemeColors } from "../../context/ThemeContext";
import { Card } from "../ui/Card";
import { getLocationIndex, getTypeIndex, LOCATION_MAPPING, TYPE_MAPPING } from "../../utils/jobUtils";

interface ColorsTabProps {
  localTheme: ThemeColors;
  uniqueLocations: string[];
  uniqueTypes: string[];
  onChange: (key: string, value: string) => void;
  onArrayChange: (key: string, index: number, value: string) => void;
}

export const ColorsTab: React.FC<ColorsTabProps> = ({
  localTheme,
  uniqueLocations,
  uniqueTypes,
  onChange,
  onArrayChange,
}) => {
  const colorGroups = [
    {
      name: "Gråtoner (Stone)",
      description: "Stone-skalaen brukes til alt fra bakgrunner (50-100) til rammer (200-300) og tekst (600-950).",
      preview: (t: ThemeColors) => (
        <div className="flex h-8 w-full rounded-lg overflow-hidden border border-stone-200 mb-4">
          {['stone50','stone100','stone200','stone300','stone400','stone500','stone600','stone700','stone800','stone900','stone950'].map(k => (
            <div key={k} className="flex-1" style={{ backgroundColor: t[k as keyof ThemeColors] as string }} title={k} />
          ))}
        </div>
      ),
      keys: [
        { key: 'stone50', label: '50 (Bakgrunn lys)' }, { key: 'stone100', label: '100 (Bakgrunn mørk)' },
        { key: 'stone200', label: '200 (Rammer lys)' }, { key: 'stone300', label: '300 (Rammer mørk)' },
        { key: 'stone400', label: '400 (Muted tekst)' }, { key: 'stone500', label: '500' },
        { key: 'stone600', label: '600 (Sekundær tekst)' }, { key: 'stone700', label: '700' },
        { key: 'stone800', label: '800' }, { key: 'stone900', label: '900 (Primær tekst)' },
        { key: 'stone950', label: '950 (Svart)' },
      ],
    },
    {
      name: "Brand Farger",
      description: "Grønn brukes som hovedaksent, Blå og Lilla for interne/eksterne oppdrag.",
      preview: (t: ThemeColors) => (
        <div className="flex gap-2 mb-4">
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: t.brandGreen, color: 'white' }}>Aksent</div>
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: t.brandInternal, color: 'white' }}>Intern</div>
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: t.brandExternal, color: 'white' }}>Ekstern</div>
        </div>
      ),
      keys: [
        { key: 'brandGreen', label: 'Hovedaksent (Grønn)' },
        { key: 'brandInternal', label: 'Intern-markør (Blå)' },
        { key: 'brandExternal', label: 'Ekstern-markør (Lilla)' },
      ],
    },
    {
      name: "Tidsfrister & Fremdrift",
      description: "Farger for å visualisere hastverk på oppdrag.",
      keys: [
        { key: 'statusCritical', label: 'Kritisk (Over 100 dager over frist)' },
        { key: 'statusOverdue', label: 'Forsinket (Mellom 1 og 100 dager over frist)' },
        { key: 'statusWithin', label: 'I rute (Innenfor tidsfrist)' },
        { key: 'statusProgress', label: 'Bilde-fremdrift' },
        { key: 'statusNB', label: 'Sendt til NB' },
      ],
    },
    {
      name: "Tags & Etiketter",
      description: "Farger på små etiketter (badges) for interne vs. eksterne oppdrag.",
      keys: [
        { key: 'tagInternal', label: 'Intern-etikett' },
        { key: 'tagExternal', label: 'Ekstern-etikett' },
        { key: 'tagDefault', label: 'Standard-etikett' },
      ],
    },
    {
      name: "Header & Navigasjon",
      description: "Utseende på toppmenyen og navigasjonslinjen.",
      keys: [
        { key: 'headerBg', label: 'Header Bakgrunn' }, { key: 'headerBorder', label: 'Header Ramme' },
        { key: 'navBg', label: 'Navigasjon Bakgrunn' }, { key: 'navBorder', label: 'Navigasjon Ramme' },
      ],
    },
  ];

  const paletteGroups = [
    { name: "Lokasjon Palett", key: 'locationPalette' as const, items: uniqueLocations.length > 0 ? uniqueLocations : Object.keys(LOCATION_MAPPING) },
    { name: "Type Palett", key: 'typePalette' as const, items: uniqueTypes.length > 0 ? uniqueTypes : Object.keys(TYPE_MAPPING) },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {colorGroups.map((group) => (
          <Card key={group.name} className="bg-stone-50">
            <div className="mb-4 border-b border-stone-100 pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">{group.name}</h3>
              <InfoIcon className="w-3 h-3 text-stone-300" title={group.description} />
            </div>
            {'preview' in group && group.preview && group.preview(localTheme)}
            <div className="space-y-3">
              {group.keys.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">{item.label}</span>
                    <input
                      type="text"
                      value={localTheme[item.key as keyof ThemeColors] as string}
                      onChange={(e) => onChange(item.key, e.target.value)}
                      className="text-[9px] font-mono text-stone-400 uppercase bg-transparent border-none p-0 focus:ring-0 focus:text-stone-900 transition-colors w-20 outline-none"
                    />
                  </div>
                  <input
                    type="color"
                    value={localTheme[item.key as keyof ThemeColors] as string}
                    onChange={(e) => onChange(item.key, e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm ring-1 ring-black/5"
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-stone-50">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Paletter (Lokasjon & Type)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paletteGroups.map((group) => (
            <div key={group.name} className="space-y-4">
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{group.name}</h4>
              <div className="grid grid-cols-1 gap-2">
                {(localTheme[group.key] as string[]).map((color, index) => {
                  const itemsUsingThisColorRaw = group.items.filter(item =>
                    group.key === 'locationPalette'
                      ? getLocationIndex(item) === index
                      : getTypeIndex(item) === index
                  );
                  const seen = new Set<string>();
                  const itemsUsingThisColor = itemsUsingThisColorRaw
                    .filter(item => { const l = item.toLowerCase().trim(); if (seen.has(l)) return false; seen.add(l); return true; })
                    .sort();
                  if (itemsUsingThisColor.length === 0) return null;
                  const label = itemsUsingThisColor.join(", ");
                  return (
                    <div key={`${group.key}-${index}`} className="flex items-center justify-between gap-3 p-1.5 rounded-lg border border-stone-50 bg-stone-50/50">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold text-stone-900 uppercase tracking-wider truncate" title={label}>{label}</span>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => onArrayChange(group.key, index, e.target.value)}
                          className="text-[8px] font-mono text-stone-400 uppercase bg-transparent border-none p-0 focus:ring-0 focus:text-stone-900 transition-colors w-16 outline-none"
                        />
                      </div>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => onArrayChange(group.key, index, e.target.value)}
                        className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm ring-1 ring-black/5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
