import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MuseumPlusParsingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: (input: string) => Promise<boolean>;
}

export const MuseumPlusParsingModal: React.FC<MuseumPlusParsingModalProps> = ({
  isOpen,
  onClose,
  onParse
}) => {
  const [parseInput, setParseInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!parseInput.trim()) return;
    
    setIsParsing(true);
    const success = await onParse(parseInput);
    setIsParsing(false);
    
    if (success) {
      setParseInput("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-serif font-medium text-stone-900">Parse MuseumPlus Lenker</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                Lim inn MuseumPlus-lenker eller inventarnummer (én per linje). 
                Appen vil automatisk trekke ut ID-ene og legge dem til i verkslisten.
              </p>
              
              <textarea
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                placeholder="https://museumplus.nasjonalmuseet.no/objekt/NG.M.00001&#10;NG.M.00002&#10;..."
                className="w-full h-48 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>
            
            <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleParse}
                disabled={!parseInput.trim() || isParsing}
                className="px-6 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isParsing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Lagre alle verk
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
