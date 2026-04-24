import React, { useState, useMemo } from "react";
import { Job } from "../types";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  HUBSPOT_SHOWN_FIELDS,
  TRACK_FIELD_REGEX,
  INV_NR_FIELD_REGEX,
} from "../constants";
import { NMObjectDetails } from "./job-details/NMObjectDetails";
import { AnimatePresence, motion } from "motion/react";
import {
  splitTitle,
  parseHubSpotTracks,
  extractUrls,
  getTypeIndex,
  getPaletteColor,
  getDeadlineInfo,
  formatDate,
} from "../utils/jobUtils";
import { useNMData } from "../hooks/useNMData";
import { useDiMuData } from "../hooks/useDiMuData";
import { useFotoWebData } from "../hooks/useFotoWebData";
import { useJobNotes } from "../hooks/useJobNotes";
import { useExtraWorks } from "../hooks/useExtraWorks";
import { useJobOverrides } from "../hooks/useJobOverrides";
import { useWorkStatus } from "../hooks/useWorkStatus";
import { useTheme } from "../context/ThemeContext";

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

// ─── Design constants (in sync with sidebar) ─────────────────────────────────
const SIDE  = '#2a251c';
const ACCENT = '#d97757';
const MONO  = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS  = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const S_INK  = '#efece4';
const S_DIM  = 'rgba(239,236,228,0.55)';
const S_RULE = 'rgba(239,236,228,0.15)';

interface JobDetailsProps {
  job: Job | null;
  loading: boolean;
  onBack?: () => void;
  isArchive?: boolean;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  job,
  loading,
  onBack,
  isArchive = false,
}) => {
  const [showAllProperties, setShowAllProperties]   = useState(false);
  const [isParsingModalOpen, setIsParsingModalOpen] = useState(false);
  const [manualInput, setManualInput]               = useState("");
  const [sortConfig, setSortConfig]                 = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [newNote, setNewNote]                       = useState("");
  const [previewImage, setPreviewImage]             = useState<{ url: string; title: string } | null>(null);
  const [isWorksCollapsed, setIsWorksCollapsed]     = useState(false);

  const { theme } = useTheme();

  const { notes, error: notesError, isSaving: isSavingNote, saveNote, deleteNote } = useJobNotes(job?.id);
  const { extraWorks, isAdding: isAddingManual, addManualWork, parseMuseumPlus, deleteExtraWork, updateExtraWork } = useExtraWorks(job?.id);
  const { workStatuses, toggleWorkDone } = useWorkStatus(job?.id);
  const { override, saveCustomType, saveSendToNB } = useJobOverrides(job?.id);

  const props = job?.all_properties || {};

  const hasFrontOfHouseTag = useMemo(() => {
    const tags = props.hubspot_tags || props.tags || "";
    return typeof tags === "string" && tags.includes("NAM FRONT OF HOUSE");
  }, [props]);

  React.useEffect(() => {
    setIsWorksCollapsed(hasFrontOfHouseTag);
  }, [job?.id, hasFrontOfHouseTag]);

  const sporData = useMemo(() => {
    if (!job) return [];
    const spor = parseHubSpotTracks(props);
    extraWorks.forEach((work) => {
      spor.push({ id: work.id, isHubSpot: false, skalFoto: true, invNr: work.invNr, kunstner: "-", teknikk: "-", mal: "-" });
    });
    if (sortConfig !== null) {
      spor.sort((a, b) => {
        // @ts-ignore
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        // @ts-ignore
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return spor;
  }, [job, props, sortConfig, extraWorks]);

  const allNmIds = useMemo(() => {
    if (!job || isArchive) return [];
    const ids = new Set<string>();
    if (job.nmids) job.nmids.forEach((id) => { if (id && id !== "-") ids.add(id); });
    sporData.forEach((spor) => { if (spor.invNr && spor.invNr !== "-") ids.add(spor.invNr); });
    return Array.from(ids);
  }, [job, sporData, isArchive]);

  const { nmDataMap, loading: nmLoading } = useNMData(allNmIds, true);
  const { dimuDataMap }   = useDiMuData(allNmIds, true);
  const { fotowebDataMap } = useFotoWebData(allNmIds, true);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await saveNote(newNote)) setNewNote("");
  };

  const handleAddManualWork = async () => {
    const existingInvNrs = sporData.map((s) => s.invNr);
    if (await addManualWork(manualInput, existingInvNrs)) setManualInput("");
  };

  const handleParseMuseumPlus = async (input: string) => {
    const existingInvNrs = sporData.map((s) => s.invNr);
    return await parseMuseumPlus(input, existingInvNrs);
  };

  const hasDescription = !!(
    job?.description &&
    job.description !== "Ingen beskrivelse tilgjengelig." &&
    job.description !== "Ingen interne notater tilgjengelig." &&
    job.description.trim() !== ""
  );

  const hasTillegg = !!(
    props.tilleggsinformasjon_foto &&
    props.tilleggsinformasjon_foto !== "Ingen spesielle ønsker oppgitt." &&
    props.tilleggsinformasjon_foto.trim() !== ""
  );

  const hasBruksomrade = !!(
    props.bruksomrade &&
    props.bruksomrade !== "Ikke spesifisert" &&
    props.bruksomrade.trim() !== ""
  );

  const shownFields = React.useMemo(() => {
    const fields = [...HUBSPOT_SHOWN_FIELDS];
    if (hasDescription) fields.push("description");
    if (hasTillegg) fields.push("tilleggsinformasjon_foto");
    if (hasBruksomrade) fields.push("bruksomrade");
    const indices = new Set<number>();
    Object.keys(props).forEach((key) => {
      const match = key.match(TRACK_FIELD_REGEX);
      if (match) indices.add(parseInt(match[1], 10));
      const invMatch = key.match(INV_NR_FIELD_REGEX);
      if (invMatch) indices.add(parseInt(invMatch[1], 10));
    });
    Array.from(indices)
      .sort((a, b) => a - b)
      .forEach((i) => {
        fields.push(`bilde_${i}_skal_fotograferes`, `inventarnummer_${i}`, `kunstner_${i}`, `teknikk_og_mal_${i}`, `teknikk_${i}`, `mal_${i}`);
      });
    return fields;
  }, [hasDescription, hasTillegg, hasBruksomrade, props]);

  const otherProperties = React.useMemo(
    () => Object.entries(props).filter(([key, value]) => value && !shownFields.includes(key)),
    [props, shownFields]
  );

  const { name, type } = React.useMemo(() => splitTitle(job?.title || ""), [job?.title]);

  const allExtractedUrls = React.useMemo(() => {
    const descriptionUrls  = extractUrls(job?.description || "");
    const tilleggUrls      = extractUrls(props.tilleggsinformasjon_foto || "");
    const brukAvBilderUrls = extractUrls(props.bruk_av_bilder || "");
    const leveringUrls     = extractUrls(props.levering_etter_fotografering || "");
    return Array.from(new Set([...descriptionUrls, ...tilleggUrls, ...brukAvBilderUrls, ...leveringUrls]))
      .filter((url) => url !== props.link_til_museum__ && url !== job?.folder_link);
  }, [job?.description, props.tilleggsinformasjon_foto, props.bruk_av_bilder, props.levering_etter_fotografering, props.link_til_museum__, job?.folder_link]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const { bg: annetBg, text: annetText } = React.useMemo(() => {
    const index = getTypeIndex("Annet");
    return getPaletteColor(theme.typePalette, index);
  }, [theme.typePalette]);

  // ── Deadline urgency ──────────────────────────────────────────────────────
  const fristRaw = props.frist_for_fotografering || props.dato_og_klokkeslett || job?.deadline || job?.due_date;
  const { statusColor: deadlineColor, label: deadlineLabel } = fristRaw
    ? getDeadlineInfo(fristRaw, theme)
    : { statusColor: '', label: '' };

  const isCritical = deadlineLabel === 'Kritisk' || deadlineLabel === 'Over frist';
  const isOverdue  = deadlineLabel === 'Over frist';

  // ── Color aliases ─────────────────────────────────────────────────────────
  const bg       = theme.stone50;
  const panel    = theme.stone100;
  const ink      = theme.textColorPrimary;
  const ink2     = theme.textColorSecondary;
  const ink3     = theme.textColorMuted;
  const hair     = theme.stone200;
  const critical = theme.statusCritical;
  const ok       = theme.statusWithin;

  const highlightFields = theme.jobDetailsSettings?.highlightFields || ['deadline', 'location', 'usage'];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg }}>
        <div style={{ background: SIDE, height: 56, flexShrink: 0 }} />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 10, background: panel, borderRadius: 4, width: '60%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 32, background: panel, borderRadius: 4, width: '80%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 100, background: panel, borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!job) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg }}>
        <div style={{ background: SIDE, height: 56, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: ink3 }}>
          <Info size={40} style={{ opacity: 0.2 }} />
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em' }}>VELG ET OPPDRAG FOR Å SE DETALJER</p>
        </div>
      </div>
    );
  }

  const isDone = props.fotooppdrag_ferdig === 'Ferdig';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: bg, color: ink, fontFamily: SANS }}>

      {/* ── Cmdbar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: SIDE, color: S_INK,
        padding: '10px 18px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Back */}
        {onBack && (
          <>
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
                color: S_DIM, background: 'none', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = S_INK)}
              onMouseLeave={e => (e.currentTarget.style.color = S_DIM)}
            >
              ← TILBAKE
            </button>
            <div style={{ width: 1, height: 16, background: S_RULE, flexShrink: 0 }} />
          </>
        )}

        {/* Title + id */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: S_DIM, marginTop: 1, letterSpacing: '0.06em' }}>
            {job.id}{type ? ` · ${type.toUpperCase()}` : ''}{isArchive ? ' · ARKIVERT' : ''}
          </div>
        </div>

        {/* MuseumPlus link */}
        {props.link_til_museum__ && (
          <a
            href={props.link_til_museum__}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
              padding: '5px 10px',
              border: `1px solid ${S_RULE}`,
              background: 'transparent', color: S_INK,
              borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            MUSEUMPLUS ↗
          </a>
        )}

        {/* HubSpot link */}
        {job.id && (
          <a
            href={`https://app.hubspot.com/contacts/5017862/record/0-3/${job.id}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
              padding: '5px 10px',
              border: `1px solid ${S_RULE}`,
              background: 'transparent', color: S_DIM,
              borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            HUBSPOT ↗
          </a>
        )}

        {/* Status pill */}
        <div style={{
          fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
          padding: '5px 10px',
          border: `1px solid ${isDone ? ok : S_RULE}`,
          background: isDone ? ok : S_INK,
          color: isDone ? '#fff' : SIDE,
          borderRadius: 3, whiteSpace: 'nowrap', fontWeight: 600,
        }}>
          {isDone ? '✓ FERDIG' : 'PÅGÅR'}
        </div>
      </div>

      {/* ── Urgency banner ──────────────────────────────────────────────── */}
      {isCritical && (
        <div style={{
          background: isOverdue ? `${critical}22` : `${deadlineColor}18`,
          borderBottom: `2px solid ${deadlineColor}`,
          padding: '8px 18px',
          fontFamily: MONO, fontSize: 11,
          color: deadlineColor,
          letterSpacing: '0.08em',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span>
          <span>{isOverdue ? 'OVER FRIST' : 'KRITISK'} · Frist: {formatDate(fristRaw)}</span>
          {deadlineLabel && (
            <span style={{
              marginLeft: 8, fontFamily: MONO, fontSize: 10, padding: '1px 6px',
              background: deadlineColor, color: '#fff', borderRadius: 3, fontWeight: 600,
            }}>
              {deadlineLabel.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* ── Brief/tillegg banner ─────────────────────────────────────────── */}
      {hasTillegg && (
        <div style={{
          background: `${theme.statusCritical}12`,
          borderBottom: `2px solid ${theme.statusCritical}60`,
          padding: '8px 18px',
          fontFamily: MONO, fontSize: 10.5, color: ink2,
          letterSpacing: '0.06em', flexShrink: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontWeight: 600, marginRight: 8, color: ink }}>BRIEF:</span>
          {props.tilleggsinformasjon_foto}
        </div>
      )}

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>

          {/* Header (title, badges, links) */}
          <JobHeader
            name={name}
            type={type}
            props={props}
            jobId={job.id}
            customType={override?.customType}
            museumPlusLink={props.link_til_museum__}
            ownerNames={job.owner_names}
          />

          {/* Info bar (deadline, location, photographer…) */}
          <JobInfoBar
            props={props}
            job={job}
            highlightFields={highlightFields}
            customType={override?.customType}
          />

          {/* Custom type input for "Annet" */}
          {props.type_fotografering?.toLowerCase().includes("annet") && (
            <CustomTypeInput
              jobId={job.id}
              customType={override?.customType || ""}
              saveCustomType={saveCustomType}
              annetBg={annetBg}
              annetText={annetText}
            />
          )}

          {/* Tillegg & bruksområde (above verk) */}
          <JobExtraInfo
            hasTillegg={hasTillegg}
            hasBruksomrade={hasBruksomrade}
            tilleggsinformasjon={props.tilleggsinformasjon_foto || ""}
            bruksomrade={props.bruksomrade || ""}
          />

          {/* ── Verksliste ────────────────────────────────────────────── */}
          {sporData.length > 0 ? (
            <>
              {/* Section header row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em',
                  textTransform: 'uppercase', color: ink3,
                }}>
                  VERK I BESTILLING · {sporData.length} STK
                </div>
                <button
                  onClick={() => setIsWorksCollapsed(!isWorksCollapsed)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em',
                    color: ink3, background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  {isWorksCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  {isWorksCollapsed ? 'VIS' : 'SKJUL'}
                </button>
              </div>

              <AnimatePresence>
                {!isWorksCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
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

          {/* ── NB checkbox ───────────────────────────────────────────── */}
          <div style={{
            margin: '24px 0',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: override?.sendToNB ? `${ACCENT}12` : panel,
            border: `1px solid ${override?.sendToNB ? `${ACCENT}60` : hair}`,
            borderLeft: `3px solid ${override?.sendToNB ? ACCENT : hair}`,
            borderRadius: 6, cursor: 'pointer',
          }}
            onClick={() => saveSendToNB(!override?.sendToNB)}
          >
            <input
              type="checkbox"
              id="sendToNB"
              checked={override?.sendToNB || false}
              onChange={(e) => saveSendToNB(e.target.checked)}
              onClick={e => e.stopPropagation()}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: ACCENT }}
            />
            <div>
              <label htmlFor="sendToNB" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, cursor: 'pointer', color: override?.sendToNB ? ACCENT : ink }}>
                SENDES TIL NB
              </label>
              <div style={{ fontFamily: MONO, fontSize: 10, color: ink3, marginTop: 2 }}>
                Ordren merkes for Nasjonalbiblioteket-leveranse
              </div>
            </div>
          </div>

          {/* ── Notater ───────────────────────────────────────────────── */}
          <div style={{ margin: '24px 0 40px' }}>
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

          {/* ── Lenker + beskrivelse ──────────────────────────────────── */}
          {(hasDescription || props.bruk_av_bilder || job.folder_link || props.link_til_museum__) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, marginBottom: 40 }}>
              <JobLinks
                job={job}
                props={props}
                hasBruksomrade={hasBruksomrade}
                allExtractedUrls={allExtractedUrls}
                setIsParsingModalOpen={setIsParsingModalOpen}
              />
              <JobDescription
                job={job}
                props={props}
                hasDescription={hasDescription}
                hasTillegg={hasTillegg}
              />
            </div>
          )}

          {/* ── NM API data ───────────────────────────────────────────── */}
          {!isArchive && (
            <NMObjectDetails nmIds={allNmIds} nmDataMap={nmDataMap} loading={nmLoading} />
          )}

          {/* ── Tekniske detaljer (vis alle felt) ─────────────────────── */}
          <TechnicalDetails
            showAllProperties={showAllProperties}
            setShowAllProperties={setShowAllProperties}
            otherProperties={otherProperties}
          />
        </div>
      </div>

      {/* ── Modaler ─────────────────────────────────────────────────────── */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />
      <MuseumPlusParsingModal
        isOpen={isParsingModalOpen}
        onClose={() => setIsParsingModalOpen(false)}
        onParse={handleParseMuseumPlus}
      />
    </div>
  );
};
