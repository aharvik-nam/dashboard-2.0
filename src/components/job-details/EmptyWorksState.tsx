import React from "react";
import { Camera } from "lucide-react";

interface EmptyWorksStateProps {
  setIsParsingModalOpen: (isOpen: boolean) => void;
}

export const EmptyWorksState: React.FC<EmptyWorksStateProps> = ({ setIsParsingModalOpen }) => {
  return (
    <div className="mb-12 p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center bg-stone-50 border-stone-200">
      <div className="p-3 rounded-full mb-4 bg-stone-100 text-stone-400">
        <Camera className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-serif font-bold uppercase tracking-widest mb-2 text-stone-900">Ingen verk i bestillingen</h3>
      <p className="text-xs max-w-md text-text-muted">
        Dette oppdraget har ingen spesifikke verk registrert. Dette er vanlig for dokumentasjon, arrangementer eller arkitekturfoto.
      </p>
      <button
        onClick={() => setIsParsingModalOpen(true)}
        className="mt-6 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-stone-900 text-white hover:bg-black"
      >
        Legg til verk manuelt
      </button>
    </div>
  );
};
