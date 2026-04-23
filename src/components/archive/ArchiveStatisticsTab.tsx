import React, { useState } from "react";
import { StatistikkRapport } from "./StatistikkRapport";
import { FotograferingstidRapport } from "./FotograferingstidRapport";

export const ArchiveStatisticsTab: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'volum' | 'tid'>('volum');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-stone-100 p-1 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveReport('volum')}
          className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeReport === 'volum'
              ? "bg-stone-50 text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Volum & Sesong
        </button>
        <button
          onClick={() => setActiveReport('tid')}
          className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeReport === 'tid'
              ? "bg-stone-50 text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Fotograferingstid
        </button>
      </div>

      {activeReport === 'volum' ? <StatistikkRapport /> : <FotograferingstidRapport />}
    </div>
  );
};
