import React, { useState, useMemo } from "react";
import { Job } from "../types";
import { 
  Info, 
  ArrowLeft,
  ChevronDown, 
  ChevronUp,
  Target
} from "lucide-react";
import { 
  HUBSPOT_SHOWN_FIELDS, 
  TRACK_FIELD_REGEX, 
  INV_NR_FIELD_REGEX 
} from "../constants";
import { NMObjectDetails } from "./job-details/NMObjectDetails";
import { motion, AnimatePresence } from "motion/react";
import { splitTitle, parseHubSpotTracks, extractUrls, getTypeIndex, getPaletteColor } from "../utils/jobUtils";
import { useNMData } from "../hooks/useNMData";
import { useDiMuData } from "../hooks/useDiMuData";
import { useFotoWebData } from "../hooks/useFotoWebData";
import { useJobNotes } from "../hooks/useJobNotes";
import { useExtraWorks } from "../hooks/useExtraWorks";
import { useJobOverrides } from "../hooks/useJobOverrides";
import { useWorkStatus } from "../hooks/useWorkStatus";
import { useTheme } from "../context/ThemeContext";

// Sub-components
import { JobHeader } from "./job-details/JobHeader";
import { JobInfoBar } from "./job-details/JobInfoBar";
import { JobWorksTable } from "./job-details/JobWorksTable";
import { JobNotes } from "./job-details/JobNotes";
import { JobDescription } from "./job-details/JobDescription";
import { JobLinks } from "./job-details/JobLinks";
import { MuseumPlusParsingModal } from "./job-details/MuseumPlusParsingModal";
import { CustomTypeInput } from "./job-details/CustomTypeInput";
import { JobExtraInfo } from "./job-details/JobExtraInfo";
import { EmptyWorksState } from "./job-details/EmptyWorksState";
import { TechnicalDetails } from "./job-details/TechnicalDetails";
import { ImagePreviewModal } from "./ui/ImagePreviewModal";

interface JobDetailsProps {
  job: Job | null;
  loading: boolean;
  onBack?: () => void;
  isArchive?: boolean;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ job, loading, onBack, isArchive = false }) => {
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [isParsingModalOpen, setIsParsingModalOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isWorksCollapsed, setIsWorksCollapsed] = useState(false);
  
  const { theme } = useTheme();

  const { notes, error: notesError, isSaving: isSavingNote, saveNote, deleteNote } = useJobNotes(job?.id);
  const { extraWorks, isAdding: isAddingManual, addManualWork, parseMuseumPlus, deleteExtraWork, updateExtraWork } = useExtraWorks(job?.id);
  const { workStatuses, toggleWorkDone } = useWorkStatus(job?.id);
  const { override, saveCustomType, saveSendToNB } = useJobOverrides(job?.id);

  const props = job?.all_properties || {};

  const hasFrontOfHouseTag = useMemo(() => {
    const tags = props.hubspot_tags || props.tags || "";
    return typeof tags === 'string' && tags.includes("NAM FRONT OF HOUSE");
  }, [props]);

  // Reset collapse state when job changes
  React.useEffect(() => {
    setIsWorksCollapsed(hasFrontOfHouseTag);
  }, [job?.id, hasFrontOfHouseTag]);

  const sporData = useMemo(() => {
    if (!job) return [];
    
    const spor = parseHubSpotTracks(props);

    // Fra Firestore (Ekstra verk)
    extraWorks.forEach(work => {
      spor.push({
        id: work.id,
        isHubSpot: false,
        skalFoto: true, // Antar at manuelt lagt til skal fotograferes
        invNr: work.invNr,
        kunstner: "-",
        teknikk: "-",
        mal: "-"
      });
    });

    if (sortConfig !== null) {
      spor.sort((a, b) => {
        // @ts-ignore
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        // @ts-ignore
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return spor;
  }, [job, props, sortConfig, extraWorks]);

  const allNmIds = useMemo(() => {
    if (!job || isArchive) return [];
    const ids = new Set<string>();
    
    // Fra HubSpot hovedfelt
    if (job.nmids) {
      job.nmids.forEach(id => {
        if (id && id !== "-") ids.add(id);
      });
    }
    
    // Fra alle spor (både HubSpot-tabell og Firestore-tillegg)
    sporData.forEach(spor => {
      if (spor.invNr && spor.invNr !== "-") {
        ids.add(spor.invNr);
      }
    });
    
    return Array.from(ids);
  }, [job, sporData, isArchive]);

  const { nmDataMap, loading: nmLoading } = useNMData(allNmIds, true);
  const { dimuDataMap } = useDiMuData(allNmIds, true);
  const { fotowebDataMap } = useFotoWebData(allNmIds, true);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await saveNote(newNote)) {
      setNewNote("");
    }
  };

  const handleAddManualWork = async () => {
    const existingInvNrs = sporData.map(s => s.invNr);
    if (await addManualWork(manualInput, existingInvNrs)) {
      setManualInput("");
    }
  };

  const handleParseMuseumPlus = async (input: string) => {
    const existingInvNrs = sporData.map(s => s.invNr);
    return await parseMuseumPlus(input, existingInvNrs);
  };

  const hasDescription = !!(job?.description && 
    job.description !== "Ingen beskrivelse tilgjengelig." && 
    job.description !== "Ingen interne notater tilgjengelig." &&
    job.description.trim() !== "");

  const hasTillegg = !!(props.tilleggsinformasjon_foto && 
    props.tilleggsinformasjon_foto !== "Ingen spesielle ønsker oppgitt." && 
    props.tilleggsinformasjon_foto.trim() !== "");

  const hasBruksomrade = !!(props.bruksomrade && 
    props.bruksomrade !== "Ikke spesifisert" && 
    props.bruksomrade.trim() !== "");

  const shownFields = React.useMemo(() => {
    const fields = [...HUBSPOT_SHOWN_FIELDS];

    if (hasDescription) fields.push("description");
    if (hasTillegg) fields.push("tilleggsinformasjon_foto");
    if (hasBruksomrade) fields.push("bruksomrade");
    
    // Legg til alle spor-felter i fields dynamisk
    const indices = new Set<number>();
    Object.keys(props).forEach(key => {
      const match = key.match(TRACK_FIELD_REGEX);
      if (match) indices.add(parseInt(match[1], 10));
      const invMatch = key.match(INV_NR_FIELD_REGEX);
      if (invMatch) indices.add(parseInt(invMatch[1], 10));
    });

    const sortedIndices = Array.from(indices).sort((a, b) => a - b);
    for (const i of sortedIndices) {
      fields.push(`bilde_${i}_skal_fotograferes`, `inventarnummer_${i}`, `kunstner_${i}`, `teknikk_og_mal_${i}`, `teknikk_${i}`, `mal_${i}`);
    }
    return fields;
  }, [hasDescription, hasTillegg, hasBruksomrade, props]);

  const otherProperties = React.useMemo(() => {
    return Object.entries(props).filter(([key, value]) => 
      value && !shownFields.includes(key)
    );
  }, [props, shownFields]);

  const { name, type } = React.useMemo(() => splitTitle(job?.title || ""), [job?.title]);

  const allExtractedUrls = React.useMemo(() => {
    const descriptionUrls = extractUrls(job?.description || "");
    const tilleggUrls = extractUrls(props.tilleggsinformasjon_foto || "");
    const brukAvBilderUrls = extractUrls(props.bruk_av_bilder || "");
    const leveringUrls = extractUrls(props.levering_etter_fotografering || "");
    
    return Array.from(new Set([...descriptionUrls, ...tilleggUrls, ...brukAvBilderUrls, ...leveringUrls]))
      .filter(url => url !== props.link_til_museum__ && url !== job?.folder_link);
  }, [job?.description, props.tilleggsinformasjon_foto, props.bruk_av_bilder, props.levering_etter_fotografering, props.link_til_museum__, job?.folder_link]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const { bg: annetBg, text: annetText } = React.useMemo(() => {
    const index = getTypeIndex("Annet");
    return getPaletteColor(theme.typePalette, index);
  }, [theme.typePalette]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex flex-col gap-6">
        <div className="h-10 animate-pulse rounded-lg w-3/4 bg-stone-100" />
        <div className="h-32 animate-pulse rounded-lg bg-stone-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 animate-pulse rounded-lg bg-stone-100" />
          <div className="h-20 animate-pulse rounded-lg bg-stone-100" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center p-4 md:p-8 text-text-muted">
        <div className="text-center">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-light">Velg et oppdrag fra listen for å se detaljer.</p>
        </div>
      </div>
    );
  }

  // Determine which fields to highlight based on theme settings
  const highlightFields = theme.jobDetailsSettings?.highlightFields || ['deadline', 'location', 'usage'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-10 mx-auto w-full max-w-5xl transition-colors duration-500"
    >
      {/* Back Button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="hidden md:flex items-center gap-2 transition-colors mb-6 group text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Tilbake til oversikt</span>
        </button>
      )}

      {/* Header Section */}
      <JobHeader 
        name={name} 
        type={type} 
        props={props} 
        jobId={job.id} 
        customType={override?.customType} 
        museumPlusLink={props.link_til_museum__}
        ownerNames={job.owner_names}
      />
      
      {/* Info Bar - Now using highlighted fields from theme */}
      <JobInfoBar props={props} job={job} highlightFields={highlightFields} customType={override?.customType} />

      {/* Custom Type Input for "Annet" */}
      {props.type_fotografering?.toLowerCase().includes("annet") && (
        <CustomTypeInput 
          jobId={job.id}
          customType={override?.customType || ""}
          saveCustomType={saveCustomType}
          annetBg={annetBg}
          annetText={annetText}
        />
      )}

      {/* Tilleggsinformasjon & Bruksområde (Above Verksliste) */}
      <JobExtraInfo 
        hasTillegg={hasTillegg}
        hasBruksomrade={hasBruksomrade}
        tilleggsinformasjon={props.tilleggsinformasjon_foto || ""}
        bruksomrade={props.bruksomrade || ""}
      />

      {/* Middle Section: Verk i bestilling */}
      {sporData.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsWorksCollapsed(!isWorksCollapsed)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-text-muted hover:text-text-primary"
            >
              {isWorksCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {isWorksCollapsed ? "Vis verk i bestilling" : "Skjul verk i bestilling"}
            </button>
          </div>
          
          <AnimatePresence>
            {!isWorksCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <JobWorksTable 
                  sporData={sporData}
                  nmDataMap={nmDataMap}
                  dimuDataMap={dimuDataMap}
                  fotowebDataMap={fotowebDataMap}
                  onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                  handleDeleteExtraWork={deleteExtraWork}
                  handleUpdateExtraWork={updateExtraWork}
                  manualInput={manualInput}
                  setManualInput={setManualInput}
                  handleAddManualWork={handleAddManualWork}
                  isAddingManual={isAddingManual}
                  setIsParsingModalOpen={setIsParsingModalOpen}
                  location={props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering}
                  visibleColumns={theme.jobDetailsSettings?.artworkListFields || ['invNr', 'title', 'artist', 'dimensions', 'material', 'technique']}
                  showApiId={theme.jobDetailsSettings?.showArtworkApiId}
                  showCollectionBadge={theme.jobDetailsSettings?.showCollectionBadge ?? true}
                  collectionBadgeColumn={theme.jobDetailsSettings?.collectionBadgeColumn ?? 1}
                  fieldMapping={theme.jobDetailsSettings?.artworkFieldMapping}
                  columnHeaders={theme.jobDetailsSettings?.artworkColumnHeaders}
                  doneItems={workStatuses}
                  onToggleDone={toggleWorkDone}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <EmptyWorksState setIsParsingModalOpen={setIsParsingModalOpen} />
      )}

      {/* Send to NB Checkbox */}
      <div className="mb-8 flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 bg-stone-50 border-stone-200 shadow-sm hover:shadow-md">
        <input 
          type="checkbox"
          id="sendToNB"
          checked={override?.sendToNB || false}
          onChange={(e) => saveSendToNB(e.target.checked)}
          className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
        />
        <div className="flex flex-col">
          <label htmlFor="sendToNB" className="text-sm font-bold uppercase tracking-widest text-stone-700 cursor-pointer">
            Sendes til NB
          </label>
          <p className="text-[10px] text-stone-400 font-medium">Denne ordren vil ikke påvirke statistikk eller arbeidsmengde.</p>
        </div>
      </div>

      {/* Notes Section - Now Full Width */}
      <div className="mb-12 mt-12">
        <JobNotes 
          notes={notes}
          notesError={notesError}
          newNote={newNote}
          setNewNote={setNewNote}
          isSavingNote={isSavingNote}
          handleSaveNote={handleSaveNote}
          handleDeleteNote={deleteNote}
        />
      </div>

      {/* Bottom Section: Context & Links */}
      {(hasDescription || props.bruk_av_bilder || job.folder_link || props.link_til_museum__) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          <div className="lg:col-span-1 space-y-10">
            {/* Links & Bruksområde */}
            <JobLinks 
              job={job}
              props={props}
              hasBruksomrade={hasBruksomrade}
              allExtractedUrls={allExtractedUrls}
              setIsParsingModalOpen={setIsParsingModalOpen}
            />
          </div>

          <div className="lg:col-span-2 space-y-10">
            {/* Description & Tillegg */}
            <JobDescription 
              job={job}
              props={props}
              hasDescription={hasDescription}
              hasTillegg={hasTillegg}
            />
          </div>
        </div>
      )}

      {/* Nasjonalmuseet API Data */}
      {!isArchive && (
        <NMObjectDetails 
          nmIds={allNmIds} 
          nmDataMap={nmDataMap} 
          loading={nmLoading} 
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />

      {/* Show More Section */}
      <TechnicalDetails 
        showAllProperties={showAllProperties}
        setShowAllProperties={setShowAllProperties}
        otherProperties={otherProperties}
      />

      {/* MuseumPlus Parsing Modal */}
      <MuseumPlusParsingModal 
        isOpen={isParsingModalOpen}
        onClose={() => setIsParsingModalOpen(false)}
        onParse={handleParseMuseumPlus}
      />
    </motion.div>
  );
};
