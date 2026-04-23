import React from "react";
import { Info } from "lucide-react";

interface CustomTypeInputProps {
  jobId: string;
  customType: string;
  saveCustomType: (type: string) => void;
  annetBg: string;
  annetText: string;
}

export const CustomTypeInput: React.FC<CustomTypeInputProps> = ({
  jobId,
  customType,
  saveCustomType,
  annetBg,
  annetText
}) => {
  return (
    <div 
      className="mb-8 p-6 border rounded-2xl shadow-sm"
      style={{ 
        backgroundColor: annetBg + '15', 
        borderColor: annetBg + '40' 
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: annetBg + '30' }}>
          <Info className="w-4 h-4" style={{ color: annetText }} />
        </div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: annetText }}>Tilpasset type fotografering</h4>
      </div>
      <p className="text-xs mb-4 opacity-80" style={{ color: annetText }}>
        Siden dette er merket som "Annet", kan du skrive inn en mer spesifikk beskrivelse her. 
        Dette vil vises på kortene i oversikten.
      </p>
      <div className="flex gap-2">
        <input 
          key={jobId} // Reset input when job changes
          type="text"
          placeholder="F.eks. 'Foto av ramme', 'Detaljfoto av signatur'..."
          defaultValue={customType || ""}
          onBlur={(e) => saveCustomType(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-stone-50"
          style={{ 
            borderColor: annetBg + '60',
            '--tw-ring-color': annetBg + '40'
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
};
