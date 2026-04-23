import React from "react";
import { Check } from "lucide-react";
import { ThemeColors } from "../../context/ThemeContext";
import { Card } from "../ui/Card";

interface CardsTabProps {
  localTheme: ThemeColors;
  onCardSettingChange: (key: string, value: unknown) => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({ localTheme, onCardSettingChange }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Layout & Størrelse</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-3">Kortstørrelse</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: 'compact', label: 'Kompakt' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Stor' }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onCardSettingChange('cardSize', opt.value)}
                  className={`py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    localTheme.cardSettings?.cardSize === opt.value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-100 text-stone-500 hover:border-stone-200'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-3">Skygge</label>
            <div className="grid grid-cols-4 gap-2">
              {['none', 'sm', 'md', 'lg'].map((shadow) => (
                <button
                  key={shadow}
                  onClick={() => onCardSettingChange('cardShadow', shadow)}
                  className={`py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    localTheme.cardSettings?.cardShadow === shadow
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-100 text-stone-500 hover:border-stone-200'
                  }`}
                >{shadow}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-3">Hjørneradius</label>
            <div className="grid grid-cols-4 gap-2">
              {[{ label: 'Ingen', value: '0' }, { label: 'Liten', value: '0.5rem' }, { label: 'Medium', value: '1rem' }, { label: 'Stor', value: '2rem' }].map((radius) => (
                <button
                  key={radius.value}
                  onClick={() => onCardSettingChange('cardBorderRadius', radius.value)}
                  className={`py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    localTheme.cardSettings?.cardBorderRadius === radius.value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-100 text-stone-500 hover:border-stone-200'
                  }`}
                >{radius.label}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Synlig Innhold</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'showLocation', label: 'Lokasjon' },
            { key: 'showType', label: 'Oppdragstype' },
            { key: 'showTechnique', label: 'Teknikk' },
            { key: 'showDeadline', label: 'Tidsfrist' },
            { key: 'showOwner', label: 'Ansvarlig' },
            { key: 'showImages', label: 'Bilder' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onCardSettingChange(item.key, !localTheme.cardSettings?.[item.key as keyof typeof localTheme.cardSettings])}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                localTheme.cardSettings?.[item.key as keyof typeof localTheme.cardSettings]
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-100 text-stone-600 hover:border-stone-200'
              }`}
            >
              <span className="text-xs font-medium">{item.label}</span>
              {localTheme.cardSettings?.[item.key as keyof typeof localTheme.cardSettings]
                ? <Check className="w-3.5 h-3.5" />
                : <div className="w-3.5 h-3.5 rounded-full border border-stone-200" />}
            </button>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
