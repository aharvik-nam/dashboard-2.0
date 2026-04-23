import React from "react";
import { Info } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface JobDescriptionProps {
  job: any;
  props: any;
  hasDescription: boolean;
}

export const JobDescription: React.FC<JobDescriptionProps> = ({
  job,
  props,
  hasDescription
}) => {
  const { theme } = useTheme();

  return (
    <>
      {/* Beskrivelse / Notater */}
      {hasDescription && (
        <section>
          <h2 className="text-xs font-serif font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-muted">
            <Info className="w-3.5 h-3.5" />
            Beskrivelse / Interne notater
          </h2>
          <div className="p-6 rounded-xl border prose prose-stone max-w-none leading-relaxed whitespace-pre-wrap italic bg-stone-50 border-stone-100 text-text-secondary">
            {job.description}
          </div>
        </section>
      )}
    </>
  );
};
