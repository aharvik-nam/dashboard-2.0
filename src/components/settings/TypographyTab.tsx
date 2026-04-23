import React from "react";
import { ThemeColors } from "../../context/ThemeContext";
import { Card } from "../ui/Card";

interface TypographyTabProps {
  localTheme: ThemeColors;
  onChange: (key: string, value: string) => void;
  onFontSizeOffsetChange: (offset: number) => void;
}

export const TypographyTab: React.FC<TypographyTabProps> = ({ localTheme, onChange, onFontSizeOffsetChange }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-stone-50">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Tekststørrelse</h3>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] text-stone-500">Juster skriftstørrelsen over hele applikasjonen.</p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((offset) => (
              <button
                key={offset}
                onClick={() => onFontSizeOffsetChange(offset)}
                className={`flex flex-col items-center justify-center py-3 border rounded-xl transition-all ${
                  localTheme.fontSizeOffset === offset
                    ? 'bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-900/10'
                    : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-bold">+{offset}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                  {offset === 0 ? 'Standard' : `Size ${offset}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-stone-50">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Font-par (Anbefalte kombinasjoner)</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Montserrat Black & Raleway Regular", sans: '"Raleway", sans-serif', serif: '"Montserrat", sans-serif', mono: '"JetBrains Mono", monospace' },
              { label: "Lobster & Open Sans Regular", sans: '"Open Sans", sans-serif', serif: '"Lobster", cursive', mono: '"JetBrains Mono", monospace' },
              { label: "Ubuntu Bold & Nanum Gothic", sans: '"Nanum Gothic", sans-serif', serif: '"Ubuntu", sans-serif', mono: '"JetBrains Mono", monospace' },
              { label: "Roboto Black & Roboto Mono Light", sans: '"Roboto", sans-serif', serif: '"Roboto", sans-serif', mono: '"Roboto Mono", monospace' },
            ].map((pair) => (
              <button
                key={pair.label}
                onClick={() => { onChange('fontSans', pair.sans); onChange('fontSerif', pair.serif); onChange('fontMono', pair.mono); }}
                className={`w-full text-left p-4 rounded-xl border transition-all group ${
                  localTheme.fontSans === pair.sans && localTheme.fontSerif === pair.serif
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{pair.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontFamily: pair.serif }} className="text-lg font-black">Aa</span>
                    <span style={{ fontFamily: pair.sans }} className="text-sm">Abcdefg 123</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-stone-50">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">Individuelle Fonter</h3>
        </div>
        <div className="space-y-4">
          {[
            {
              key: 'fontSans', label: 'Sans-serif (UI/Body)', value: localTheme.fontSans,
              options: [
                { label: "Inter", value: '"Inter", ui-sans-serif, system-ui, sans-serif' },
                { label: "Roboto", value: '"Roboto", sans-serif' },
                { label: "Open Sans", value: '"Open Sans", sans-serif' },
                { label: "Raleway", value: '"Raleway", sans-serif' },
                { label: "Nanum Gothic", value: '"Nanum Gothic", sans-serif' },
                { label: "System Sans", value: 'ui-sans-serif, system-ui, sans-serif' },
              ],
            },
            {
              key: 'fontSerif', label: 'Serif/Display (Overskrifter)', value: localTheme.fontSerif,
              options: [
                { label: "Montserrat", value: '"Montserrat", sans-serif' },
                { label: "Lobster", value: '"Lobster", cursive' },
                { label: "Ubuntu", value: '"Ubuntu", sans-serif' },
                { label: "Roboto", value: '"Roboto", sans-serif' },
                { label: "Playfair Display", value: '"Playfair Display", serif' },
                { label: "System Serif", value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
              ],
            },
            {
              key: 'fontMono', label: 'Monospace (Data)', value: localTheme.fontMono,
              options: [
                { label: "JetBrains Mono", value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
                { label: "Roboto Mono", value: '"Roboto Mono", monospace' },
                { label: "Courier New", value: '"Courier New", monospace' },
                { label: "System Mono", value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
              ],
            },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">{f.label}</label>
              <select
                value={f.value}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-100 rounded-lg text-xs focus:bg-stone-50 focus:border-stone-900 transition-all outline-none appearance-none cursor-pointer"
              >
                {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                {!f.options.some(opt => opt.value === f.value) && (
                  <option value={f.value}>Egendefinert: {f.value.split(',')[0].replace(/"/g, '')}</option>
                )}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-stone-50">
        <div className="mb-6 border-b border-stone-100 pb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-900">Tekstfarger</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'textColorPrimary', label: 'Primær' },
            { key: 'textColorSecondary', label: 'Sekundær' },
            { key: 'textColorMuted', label: 'Muted' },
            { key: 'textColorInverted', label: 'Invertert' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">{item.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={localTheme[item.key as keyof ThemeColors] as string}
                  onChange={(e) => onChange(item.key, e.target.value)}
                  className="text-[8px] font-mono text-stone-400 uppercase bg-transparent border-none p-0 focus:ring-0 focus:text-stone-900 transition-colors w-16 text-right outline-none"
                />
                <input
                  type="color"
                  value={localTheme[item.key as keyof ThemeColors] as string}
                  onChange={(e) => onChange(item.key, e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm ring-1 ring-black/5"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
