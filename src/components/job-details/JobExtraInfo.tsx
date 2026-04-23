import React from "react";
import { Target } from "lucide-react";

interface JobExtraInfoProps {
  hasTillegg: boolean;
  hasBruksomrade: boolean;
  tilleggsinformasjon: string;
  bruksomrade: string;
}

export const JobExtraInfo: React.FC<JobExtraInfoProps> = ({
  hasTillegg,
  hasBruksomrade,
  tilleggsinformasjon,
  bruksomrade
}) => {
  if (!hasTillegg && !hasBruksomrade) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-8">
      {hasTillegg && (
        <div className={hasBruksomrade ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-2xl p-6 shadow-sm h-full bg-stone-900 text-text-inverted">
            <h4 className="text-[10px] font-serif font-bold uppercase tracking-widest mb-3 opacity-60 text-text-muted">Tilleggsinformasjon Foto</h4>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {tilleggsinformasjon}
            </div>
          </div>
        </div>
      )}
      {hasBruksomrade && (
        <div className={hasTillegg ? "lg:col-span-1" : "lg:col-span-3"}>
          <div className="border rounded-2xl p-6 shadow-sm h-full bg-stone-50 border-stone-200">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-text-muted" />
              <h4 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-secondary">Bruksområde</h4>
            </div>
            <div className="text-sm font-medium text-text-primary">
              {bruksomrade}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
