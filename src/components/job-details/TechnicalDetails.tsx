import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TechnicalDetailsProps {
  showAllProperties: boolean;
  setShowAllProperties: (show: boolean) => void;
  otherProperties: [string, any][];
}

export const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({
  showAllProperties,
  setShowAllProperties,
  otherProperties
}) => {
  if (otherProperties.length === 0) return null;

  return (
    <section className="pt-8 border-t border-stone-100">
      <button
        onClick={() => setShowAllProperties(!showAllProperties)}
        className="flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest mx-auto text-text-muted hover:text-text-primary"
      >
        {showAllProperties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAllProperties ? "Skjul tekniske detaljer" : "Vis alle HubSpot-egenskaper"}
      </button>

      <AnimatePresence>
        {showAllProperties && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mt-8 p-8 rounded-2xl border bg-stone-50 border-stone-100">
              {otherProperties.map(([key, value]) => (
                <div key={key} className="flex flex-col border-b pb-2 border-stone-100">
                  <span className="text-[9px] font-mono uppercase tracking-tighter text-text-muted">{key}</span>
                  <span className="text-xs break-words text-text-primary" title={String(value)}>{String(value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
