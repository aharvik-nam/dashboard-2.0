import React from "react";
import { User, Mail, Phone, Clock, Calendar, MapPin, Camera, Info } from "lucide-react";
import { formatPhotographyType, formatDate, getDeadlineInfo, shortenLocation, isInternJob, isExternJob } from "../../utils/jobUtils";
import { useTheme } from "../../context/ThemeContext";

interface JobInfoBarProps {
  props: any;
  job: any;
  highlightFields: string[];
  customType?: string;
}

export const JobInfoBar: React.FC<JobInfoBarProps> = ({ props, job, highlightFields, customType }) => {
  const { theme } = useTheme();
  // Helper to check if a field should be shown
  const shouldShow = (key: string) => highlightFields.includes(key);

  return (
    <div className="py-8 border-y space-y-8 border-stone-200">
      {/* Main Info Grid - Dynamic columns based on content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
        
        {/* Fotograf */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Fotograf</h3>
          <div className="flex items-center gap-2 font-medium text-text-primary">
            <User className="w-4 h-4 text-text-muted" />
            <span className="font-bold">{job.owner_names?.[0] || "Ufordelt"}</span>
          </div>
        </div>

        {/* Contact Info Group */}
        {shouldShow('contact') && (
          <>
            {/* Row 1, Col 1: Bestiller */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Bestiller</h3>
              <div className="flex items-center gap-2 font-medium text-text-primary">
                <User className="w-4 h-4 text-text-muted" />
                <span>{props.first_name} {props.last_name}</span>
              </div>
              <div className="text-xs ml-6 text-text-secondary">
                {props.firma || props.firma_eller_privat}
                <span className="block opacity-60 italic">
                  {isInternJob(job) ? "Intern" : isExternJob(job) ? "Ekstern" : props.intern_eller_ekstern_bestilling || "Ukjent"}
                </span>
              </div>
            </div>

            {/* Row 1, Col 2: Kontaktinfo */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Kontaktinfo</h3>
              {props.email && (
                <a href={`mailto:${props.email}`} className="flex items-center gap-2 text-xs transition-colors text-text-secondary hover:text-text-primary">
                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                  {props.email}
                </a>
              )}
              {props.telefonnummer && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                  {props.telefonnummer}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tidsfrister */}
        {shouldShow('deadline') && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Tidsfrister</h3>
            {(() => {
              const fristRaw = props.frist_for_fotografering || props.dato_og_klokkeslett || job.deadline || job.due_date;
              const planlagtRaw = props.dato_for_fotografering;
              const tidRaw = props.dato_og_klokkeslett;

              const toDateString = (val: any) => {
                if (!val) return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
              };

              const fristDate = toDateString(fristRaw);
              const planlagtDate = toDateString(planlagtRaw);
              const tidDate = toDateString(tidRaw);

              const { statusColor, statusTextColor, label } = getDeadlineInfo(fristRaw, theme);

              return (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-lg font-bold" style={{ color: statusColor }}>
                      <Clock className="w-5 h-5" />
                      <span>Frist: {formatDate(fristRaw)}</span>
                    </div>
                    {label && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: statusColor, color: statusTextColor }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                  
                  {props.dato_for_fotografering && planlagtDate !== fristDate && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span>Planlagt: {props.dato_for_fotografering}</span>
                    </div>
                  )}
                  {props.dato_og_klokkeslett && tidDate !== fristDate && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span>Avtalt tidspunkt: {props.dato_og_klokkeslett}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Lokasjon */}
        {shouldShow('location') && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Lokasjon</h3>
            <div className="flex items-start gap-2 text-xs font-medium text-text-primary">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-text-muted" />
              <span>{shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ikke oppgitt")}</span>
            </div>
            {props.levering_etter_fotografering && (
              <div className="mt-1 text-[11px] ml-6 text-text-secondary">
                <span className="opacity-60 italic">Levering: {props.levering_etter_fotografering}</span>
              </div>
            )}
          </div>
        )}

        {/* Type fotografering */}
        {shouldShow('type') && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Type fotografering</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
              <Camera className="w-3.5 h-3.5 text-text-muted" />
              <span>{customType || (props.type_fotografering ? formatPhotographyType(props.type_fotografering, props) : "Ikke spesifisert")}</span>
            </div>
          </div>
        )}

        {/* Kontaktperson (Komm. & Sammenheng) */}
        {shouldShow('contact') && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-serif font-bold uppercase tracking-widest text-text-muted">Kontaktperson (Komm. & Sammenheng)</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>{props.kontaktperson_pa_kommunikasjon_og_sammenheng || "-"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bruk av bilder - Full width */}
      {shouldShow('usage') && props.bruk_av_bilder && (
        <div className="pt-8 border-t border-stone-100">
          <h3 className="text-xs font-serif font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-stone-900">
            <Info className="w-4 h-4" />
            Bruk av bilder
          </h3>
          <div className="text-sm leading-relaxed p-6 rounded-xl border-l-4 shadow-sm bg-[#F5F0EB] border-stone-200 border-l-stone-900 text-text-primary">
            {props.bruk_av_bilder}
          </div>
        </div>
      )}
    </div>
  );
};
