import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NMObject } from '../../types/nmTypes';
import { getNMImage } from '../../utils/nmUtils';
import { useTheme } from '../../context/ThemeContext';

interface NMObjectDetailsProps {
  nmIds: string[];
  nmDataMap: Record<string, NMObject>;
  loading: boolean;
}

export const NMObjectDetails: React.FC<NMObjectDetailsProps> = ({ 
  nmIds, 
  nmDataMap, 
  loading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const primaryId = nmIds[0];
  const primaryData = primaryId ? nmDataMap[primaryId] : null;
  const imageUrl = primaryData ? getNMImage(primaryData) : null;

  if (nmIds.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-stone-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest mx-auto text-text-muted hover:text-text-primary"
      >
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {isOpen ? "Skjul Nasjonalmuseet data" : `Vis Nasjonalmuseet data (${primaryId})`}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 p-8 rounded-2xl border bg-stone-50 border-stone-100 font-mono text-[11px] leading-relaxed text-gray-700">
              {loading ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Henter data...
                </div>
              ) : primaryData ? (
                <div className="space-y-4">
                  {imageUrl && (
                    <div className="relative group max-w-sm">
                      <img 
                        src={imageUrl} 
                        alt={primaryId} 
                        className="rounded-lg shadow-sm border border-black/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        NM Image
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {Object.entries(primaryData).map(([key, value]) => {
                      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return null;
                      
                      let displayValue = "";
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                        if (displayValue.length > 100) displayValue = displayValue.substring(0, 100) + "...";
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <div key={key} className="flex flex-col border-b pb-2 border-stone-100">
                          <span className="text-[9px] font-mono uppercase tracking-tighter text-text-muted">{key}</span>
                          <span className="text-xs break-words text-text-primary" title={JSON.stringify(value, null, 2)}>{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-4 italic text-gray-400">Ingen data tilgjengelig for {primaryId}. Sjekk om inventarnummeret er korrekt.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
