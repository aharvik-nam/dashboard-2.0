import React from "react";
import { CheckCircle2, ExternalLink, Globe, User } from "lucide-react";
import { formatPhotographyType, getTypeBadgeColor, getLocationIndex, getTypeIndex, getPaletteColor, getTagColor, shortenLocation } from "../../utils/jobUtils";
import { useTheme } from "../../context/ThemeContext";
import { useJobLinks } from "../../hooks/useJobLinks";

interface JobHeaderProps {
  name: string;
  type: string | null;
  props: any;
  jobId?: string;
  customType?: string;
  museumPlusLink?: string;
  ownerNames?: string[];
}

export const JobHeader: React.FC<JobHeaderProps> = ({ name, type, props, jobId, customType, museumPlusLink, ownerNames }) => {
  const { theme } = useTheme();
  const { links } = useJobLinks(jobId);
  const hubspotLink = jobId ? `https://app.hubspot.com/contacts/5017862/record/0-3/${jobId}/` : null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {museumPlusLink && (
            <a 
              href={museumPlusLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 transition-all rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border bg-stone-50 border-stone-200 text-text-secondary hover:text-text-primary hover:border-stone-400"
            >
              <ExternalLink className="w-3 h-3" />
              MuseumPlus
            </a>
          )}
          {hubspotLink && (
            <a 
              href={hubspotLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 transition-all rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border bg-stone-50 border-stone-200 text-text-secondary hover:text-text-primary hover:border-stone-400"
            >
              <ExternalLink className="w-3 h-3" />
              HubSpot
            </a>
          )}
          
          {/* Manually saved links */}
          {links.map((link) => (
            <a 
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 transition-all rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border bg-stone-50 border-stone-200 text-text-secondary hover:text-text-primary hover:border-stone-400"
              title={link.url}
            >
              <Globe className="w-3 h-3" />
              {link.title || "Nettlenke"}
            </a>
          ))}
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-serif font-black leading-tight mb-2 text-text-primary">
        {name}
      </h1>

      <div className="flex items-center gap-3 flex-wrap">
        {(() => {
          const loc = shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent");
          const locIndex = getLocationIndex(loc);
          const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
          
          const photoType = props.type_fotografering ? (customType || formatPhotographyType(props.type_fotografering, props)) : null;
          const photoTypeIndex = photoType ? getTypeIndex(photoType) : 0;
          const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, photoTypeIndex);

          return (
            <>
              <span 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded"
                style={{ backgroundColor: locBg, color: locText }}
              >
                {loc}
              </span>
              {photoType && (
                <span 
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded"
                  style={{ backgroundColor: typeBg, color: typeText }}
                >
                  {photoType}
                </span>
              )}
              {type && (
                (() => {
                  const { bg: tagBg, text: tagText } = getTagColor(type, theme);
                  return (
                    <span 
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded"
                      style={{ backgroundColor: tagBg, color: tagText }}
                    >
                      {type}
                    </span>
                  );
                })()
              )}
            </>
          );
        })()}
        {props.bestilling_klar_til_fotografering === "Ja" && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1 bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Klar til foto
          </span>
        )}
        {props.fotooppdrag_ferdig === "Ferdig" && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded bg-blue-100 text-blue-800">
            Ferdig
          </span>
        )}
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1 bg-stone-100 text-stone-600">
          <User className="w-3 h-3" /> {ownerNames?.[0] || "Ufordelt"}
        </span>
      </div>
    </div>
  );
};
