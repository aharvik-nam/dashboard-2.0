import React from "react";
import { Eye, Calendar as CalendarIcon, User } from "lucide-react";
import { motion } from "motion/react";
import { ThemeColors } from "../../context/ThemeContext";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface ThemePreviewPanelProps {
  localTheme: ThemeColors;
  previewMode: 'card' | 'details';
  setPreviewMode: (mode: 'card' | 'details') => void;
}

export const ThemePreviewPanel: React.FC<ThemePreviewPanelProps> = ({ localTheme, previewMode, setPreviewMode }) => (
  <div className="sticky top-6 space-y-6">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-stone-500">
        <Eye className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Forhåndsvisning</span>
      </div>
      <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg">
        <button
          onClick={() => setPreviewMode('card')}
          className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
            previewMode === 'card' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
          }`}
        >Kort</button>
        <button
          onClick={() => setPreviewMode('details')}
          className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
            previewMode === 'details' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
          }`}
        >Detaljer</button>
      </div>
    </div>

    {previewMode === 'card' ? (
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-inner">
        <motion.div
          className="bg-white border border-stone-200 overflow-hidden"
          style={{
            borderRadius: localTheme.cardSettings?.cardBorderRadius || "1rem",
            boxShadow: localTheme.cardSettings?.cardShadow === 'none' ? 'none'
              : localTheme.cardSettings?.cardShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              : localTheme.cardSettings?.cardShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          }}
          layout
        >
          <div className="h-1.5 w-full" style={{ backgroundColor: localTheme.statusWithin }} />
          <div className={`p-5 flex flex-col ${
            localTheme.cardSettings?.cardSize === 'compact' ? 'gap-2'
              : localTheme.cardSettings?.cardSize === 'large' ? 'gap-6' : 'gap-4'
          }`}>
            {(localTheme.cardSettings?.showLocation || localTheme.cardSettings?.showType) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {localTheme.cardSettings?.showLocation && (
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all"
                    style={{ backgroundColor: localTheme.locationPalette[0], color: 'white' }}>Atelier</span>
                )}
                {localTheme.cardSettings?.showType && (
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all"
                    style={{ backgroundColor: localTheme.typePalette[0], color: 'white' }}>Maleri</span>
                )}
              </div>
            )}
            <h3 className={`font-serif font-medium leading-tight ${
              localTheme.cardSettings?.cardSize === 'compact' ? 'text-base'
                : localTheme.cardSettings?.cardSize === 'large' ? 'text-xl' : 'text-lg'
            }`} style={{ color: localTheme.textColorPrimary, fontFamily: localTheme.fontSerif }}>
              Brudeferden i Hardanger
            </h3>
            {(localTheme.cardSettings?.showDeadline || localTheme.cardSettings?.showOwner) && (
              <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-stone-100">
                <div className="space-y-1.5 min-w-0">
                  {localTheme.cardSettings?.showDeadline && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight" style={{ color: localTheme.textColorMuted }}>
                      <CalendarIcon className="w-2.5 h-2.5 shrink-0" /><span className="truncate">15. Mai</span>
                    </div>
                  )}
                  {localTheme.cardSettings?.showOwner && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight" style={{ color: localTheme.textColorMuted }}>
                      <User className="w-2.5 h-2.5 shrink-0" /><span className="truncate">Andreas Harvik</span>
                    </div>
                  )}
                </div>
                {localTheme.cardSettings?.showDeadline && (
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-lg font-serif font-bold leading-none" style={{ color: localTheme.statusWithin }}>3</span>
                    <span className="text-[7px] font-bold uppercase tracking-widest mt-0.5" style={{ color: localTheme.statusWithin }}>dager</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    ) : (
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-inner">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-100">
            <div className="flex gap-1.5 mb-2">
              {localTheme.jobDetailsSettings?.highlightFields?.includes('location') && (
                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase" style={{ backgroundColor: localTheme.locationPalette[0], color: 'white' }}>Atelier</span>
              )}
              {localTheme.jobDetailsSettings?.highlightFields?.includes('type') && (
                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase" style={{ backgroundColor: localTheme.typePalette[0], color: 'white' }}>Maleri</span>
              )}
            </div>
            <h4 className="text-sm font-serif font-bold" style={{ color: localTheme.textColorPrimary, fontFamily: localTheme.fontSerif }}>Brudeferden i Hardanger</h4>
          </div>
          <div className="grid grid-cols-2 gap-px bg-stone-100 border-b border-stone-100">
            {localTheme.jobDetailsSettings?.highlightFields?.slice(0, 4).map(f => (
              <div key={f} className="bg-white p-2 flex flex-col gap-0.5">
                <span className="text-[7px] font-bold uppercase tracking-widest text-stone-400">{f}</span>
                <span className="text-[9px] font-medium text-stone-900 truncate">Eksempeldata</span>
              </div>
            ))}
          </div>
          <div className="p-2">
            <table className="w-full text-[8px] border-collapse">
              <thead>
                <tr className="border-b border-stone-100">
                  {localTheme.jobDetailsSettings?.artworkColumnHeaders?.map((h, i) => (
                    <th key={i} className="text-left py-1 font-bold uppercase tracking-tighter text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-stone-50">
                  {[0, 1, 2, 3].map(colIdx => (
                    <td key={colIdx} className="py-1.5">
                      <div className="flex flex-wrap gap-0.5">
                        {localTheme.jobDetailsSettings?.artworkListFields?.filter(f => localTheme.jobDetailsSettings?.artworkFieldMapping?.[f] === colIdx).map(f => (
                          <span key={f} className="px-1 py-0.5 bg-stone-50 rounded text-stone-600 truncate max-w-[40px]">{f}</span>
                        ))}
                        {localTheme.jobDetailsSettings?.showCollectionBadge && (localTheme.jobDetailsSettings as any).collectionBadgeColumn === colIdx && (
                          <span className="px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">NM</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    <Card className="bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">UI Elementer</h4>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Badge>Standard</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="inverted">Inverted</Badge>
        </div>
        <button
          className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
          style={{ backgroundColor: localTheme.stone900, color: 'white' }}
        >
          Primærknapp
        </button>
        <div className="flex gap-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: localTheme.brandGreen }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: localTheme.brandInternal }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: localTheme.brandExternal }} />
        </div>
      </div>
    </Card>
  </div>
);
