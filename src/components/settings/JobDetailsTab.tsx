import React from "react";
import { Check } from "lucide-react";
import { ThemeColors } from "../../context/ThemeContext";
import { Card } from "../ui/Card";

interface JobDetailsTabProps {
  localTheme: ThemeColors;
  onJobDetailsChange: (key: string, value: unknown) => void;
  onFieldMappingChange: (fieldKey: string, columnIndex: number) => void;
  onColumnHeaderChange: (index: number, value: string) => void;
  toggleArrayItem: (array: string[], item: string) => string[];
}

export const JobDetailsTab: React.FC<JobDetailsTabProps> = ({
  localTheme,
  onJobDetailsChange,
  onFieldMappingChange,
  onColumnHeaderChange,
  toggleArrayItem,
}) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Fremhevet Info</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'deadline', label: 'Tidsfrister' },
            { key: 'location', label: 'Lokasjon' },
            { key: 'usage', label: 'Bruk av bilder' },
            { key: 'contact', label: 'Kontaktinfo' },
            { key: 'type', label: 'Oppdragstype' },
          ].map((field) => (
            <button
              key={field.key}
              onClick={() => onJobDetailsChange('highlightFields', toggleArrayItem(localTheme.jobDetailsSettings?.highlightFields || [], field.key))}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                localTheme.jobDetailsSettings?.highlightFields?.includes(field.key)
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-100 text-stone-600 hover:border-stone-200'
              }`}
            >
              <span className="text-xs font-medium">{field.label}</span>
              {localTheme.jobDetailsSettings?.highlightFields?.includes(field.key)
                ? <Check className="w-3.5 h-3.5" />
                : <div className="w-3.5 h-3.5 rounded-full border border-stone-200" />}
            </button>
          ))}
        </div>
      </Card>

      <Card className="bg-white">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Tabell-innstillinger</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'showArtworkImages', label: 'Vis Bilder' },
            { key: 'showArtworkApiId', label: 'Vis API ID' },
            { key: 'showCollectionBadge', label: 'NM-Badge' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onJobDetailsChange(item.key, !localTheme.jobDetailsSettings?.[item.key as keyof typeof localTheme.jobDetailsSettings])}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                localTheme.jobDetailsSettings?.[item.key as keyof typeof localTheme.jobDetailsSettings]
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-100 text-stone-600 hover:border-stone-200'
              }`}
            >
              <span className="text-xs font-medium">{item.label}</span>
              {localTheme.jobDetailsSettings?.[item.key as keyof typeof localTheme.jobDetailsSettings]
                ? <Check className="w-3.5 h-3.5" />
                : <div className="w-3.5 h-3.5 rounded-full border border-stone-200" />}
            </button>
          ))}
        </div>
      </Card>
    </div>

    <Card className="bg-white">
      <div className="mb-6 border-b border-stone-100 pb-2">
        <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Kolonner & Feltmapping</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Overskrifter</h4>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx}>
                <input
                  type="text"
                  value={localTheme.jobDetailsSettings?.artworkColumnHeaders?.[idx] || ""}
                  onChange={(e) => onColumnHeaderChange(idx, e.target.value)}
                  placeholder={`Kolonne ${idx + 1}`}
                  className="w-full p-2 bg-stone-50 border border-stone-100 rounded-lg text-[10px] font-bold focus:bg-white focus:border-stone-900 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Felt-plassering</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { key: 'invNr', label: 'Inventarnummer' }, { key: 'title', label: 'Tittel' },
              { key: 'artist', label: 'Kunstner' }, { key: 'dimensions', label: 'Mål' },
              { key: 'material', label: 'Materiale' }, { key: 'objectName', label: 'Objektnavn' },
            ].map((field) => (
              <div key={field.key} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localTheme.jobDetailsSettings?.artworkListFields?.includes(field.key) ?? false}
                    onChange={() => onJobDetailsChange('artworkListFields', toggleArrayItem(localTheme.jobDetailsSettings?.artworkListFields || [], field.key))}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="text-[10px] font-bold text-stone-700 uppercase tracking-tight">{field.label}</span>
                </div>
                <select
                  value={localTheme.jobDetailsSettings?.artworkFieldMapping?.[field.key] ?? 0}
                  onChange={(e) => onFieldMappingChange(field.key, parseInt(e.target.value))}
                  className="text-[9px] font-bold bg-white border border-stone-200 rounded px-1.5 py-0.5 outline-none focus:border-stone-900"
                >
                  <option value={0}>K1</option>
                  <option value={1}>K2</option>
                  <option value={2}>K3</option>
                  <option value={3}>K4</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  </div>
);
