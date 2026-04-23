import React, { useState, useMemo } from "react";
import { Tag, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Copy } from "lucide-react";
import { normalizeInvNr, getPrimaryNMTitle, getNMArtist, formatNMDimensions, getNMMaterials, getNMTechniques, getNMObjectName, getNMMaterialTechniqueDescription, getNMImage } from "../../utils/nmUtils";
import { isLargeObject } from "../../utils/jobUtils";
import { NMObject } from "../../types/nmTypes";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";
import { Camera } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface JobWorksTableProps {
  sporData: any[];
  nmDataMap: Record<string, NMObject>;
  dimuDataMap?: Record<string, string | null>;
  fotowebDataMap?: Record<string, any[]>;
  onPreviewImage?: (url: string, title: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  requestSort: (key: string) => void;
  handleDeleteExtraWork: (id: string) => void;
  handleUpdateExtraWork: (id: string, newInvNr: string) => Promise<boolean>;
  manualInput: string;
  setManualInput: (value: string) => void;
  handleAddManualWork: () => void;
  isAddingManual: boolean;
  setIsParsingModalOpen: (isOpen: boolean) => void;
  location?: string | null;
  visibleColumns: string[];
  showApiId?: boolean;
  showCollectionBadge?: boolean;
  collectionBadgeColumn?: number;
  fieldMapping?: Record<string, number>;
  columnHeaders?: string[];
  showImages?: boolean;
  doneItems?: Record<string, boolean>;
  onToggleDone?: (id: string) => void;
}

export const JobWorksTable: React.FC<JobWorksTableProps> = ({
  sporData,
  nmDataMap,
  dimuDataMap = {},
  fotowebDataMap = {},
  onPreviewImage,
  sortConfig,
  requestSort,
  handleDeleteExtraWork,
  handleUpdateExtraWork,
  manualInput,
  setManualInput,
  handleAddManualWork,
  isAddingManual,
  setIsParsingModalOpen,
  location,
  visibleColumns,
  showApiId,
  showCollectionBadge = true,
  collectionBadgeColumn = 1,
  fieldMapping = {
    invNr: 0, title: 1, artist: 1, dimensions: 3, material: 2, technique: 2, materialDescription: 2, objectName: 0
  },
  columnHeaders = ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål', 'Status'],
  showImages = true,
  doneItems = {},
  onToggleDone
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleDone = (id: string) => {
    if (onToggleDone) {
      onToggleDone(id);
    }
  };

  const { paginatedData, totalPages, startIndex } = useMemo(() => {
    const total = Math.ceil(sporData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    return {
      paginatedData: sporData.slice(start, start + itemsPerPage),
      totalPages: total,
      startIndex: start
    };
  }, [sporData, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startEditing = (id: string, currentVal: string) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    if (await handleUpdateExtraWork(id, editValue)) {
      setEditingId(null);
      setEditValue("");
    }
  };

  // Helper to check column visibility
  const isVisible = (key: string) => visibleColumns.includes(key);

  // Group fields by column
  const columnFields = useMemo(() => {
    const groups: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
    visibleColumns.forEach(fieldKey => {
      const colIdx = fieldMapping[fieldKey] ?? 0;
      if (groups[colIdx]) {
        groups[colIdx].push(fieldKey);
      }
    });
    return groups;
  }, [visibleColumns, fieldMapping]);

  const isColumnVisible = (idx: number) => columnFields[idx].length > 0;

  return (
    <section className="mb-12">
      <SectionHeader 
        title="Verk i bestilling" 
        icon={Tag} 
        badge={sporData.length}
      >
        <div className="flex items-center gap-4">
          {sporData.length > 10 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-text-muted">Vis:</span>
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="text-[10px] font-bold rounded px-1 py-0.5 outline-none focus:ring-1 transition-all bg-stone-50 border-stone-200 text-text-primary focus:ring-text-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>
      </SectionHeader>
      
      <Card padding="none">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="border-b bg-stone-50 border-stone-200">
                {[0, 1, 2, 3].map((idx) => isColumnVisible(idx) && (
                  <th 
                    key={`head-${idx}`}
                    className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-text-muted"
                  >
                    {columnHeaders[idx] || `Kolonne ${idx + 1}`}
                  </th>
                ))}
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-text-muted">
                  Status
                </th>
                {showApiId && (
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-text-muted">
                    API ID
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {paginatedData.length > 0 ? (
                paginatedData.map((spor) => {
                  const normalizedInvNr = normalizeInvNr(spor.invNr);
                  const nmData = nmDataMap[normalizedInvNr];
                  const nmTitle = nmData ? getPrimaryNMTitle(nmData) : "";
                  const nmArtist = nmData ? getNMArtist(nmData) : "";
                  const nmDimensions = nmData ? formatNMDimensions(nmData) : "";
                  const isLarge = isLargeObject(nmDimensions, location);
                  const nmMaterials = nmData ? getNMMaterials(nmData) : [];
                  const nmTechniques = nmData ? getNMTechniques(nmData) : [];
                  const nmObjectName = nmData ? getNMObjectName(nmData) : "";
                  const nmMaterialTechnique = nmData ? getNMMaterialTechniqueDescription(nmData) : "";
                  const isEditing = editingId === spor.id;
                  const isDone = doneItems[spor.id];
                  
                  return (
                    <tr key={spor.id} className={`block md:table-row border-b transition-all group p-4 md:p-0 border-stone-200 md:border-stone-100 last:border-0 hover:bg-stone-50/50 ${isDone ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                      {[0, 1, 2, 3].map((colIdx) => isColumnVisible(colIdx) && (
                        <td key={`col-${colIdx}`} className="block md:table-cell px-0 py-2 md:px-6 md:py-4 text-sm align-top text-text-secondary">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-wider mb-2 text-text-muted">
                            {columnHeaders[colIdx] || `Kolonne ${colIdx + 1}`}
                          </div>
                          <div className={`flex flex-col gap-3 ${isDone ? 'line-through decoration-stone-400' : ''}`}>
                            {columnFields[colIdx].map((fieldKey) => {
                              if (fieldKey === 'invNr') {
                                return (
                                  <div key="field-invNr" className="flex flex-col">
                                    <div className="flex items-center gap-2 font-medium text-text-primary">
                                      {isEditing ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-32 px-2 py-1 rounded text-xs outline-none transition-all bg-stone-50 border-stone-300 text-text-primary focus:ring-1 focus:ring-text-primary"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveEdit(spor.id);
                                              if (e.key === 'Escape') cancelEditing();
                                            }}
                                          />
                                          <button onClick={() => saveEdit(spor.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={cancelEditing} className="p-1 rounded text-text-muted hover:bg-stone-100">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          {spor.invNr}
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(spor.invNr);
                                                setCopiedId(spor.id);
                                                setTimeout(() => setCopiedId(null), 2000);
                                              }}
                                              className={`p-1 transition-all ${copiedId === spor.id ? 'text-emerald-500' : 'text-text-muted hover:text-text-secondary'}`}
                                              title="Kopier inventarnummer"
                                            >
                                              {copiedId === spor.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            {!spor.isHubSpot && (
                                              <>
                                                <button
                                                  onClick={() => startEditing(spor.id, spor.invNr)}
                                                  className="p-1 transition-all text-text-muted hover:text-text-secondary"
                                                  title="Rediger"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteExtraWork(spor.id)}
                                                  className="p-1 transition-all text-red-400 hover:text-red-600"
                                                  title="Fjern verk"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Image Tags in Verksliste */}
                                    {showImages && onPreviewImage && (
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        {nmData && getNMImage(nmData) && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onPreviewImage(getNMImage(nmData)!, `Nasjonalmuseet: ${nmTitle || spor.invNr}`);
                                            }}
                                            className="px-1.5 py-0.5 text-[8px] font-bold rounded transition-colors bg-stone-900 text-white hover:bg-black"
                                            title="Vis bilde fra Nasjonalmuseet"
                                          >
                                            M+
                                          </button>
                                        )}
                                        {normalizedInvNr && dimuDataMap[normalizedInvNr] && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onPreviewImage(dimuDataMap[normalizedInvNr]!, `Digitalt Museum: ${nmTitle || spor.invNr}`);
                                            }}
                                            className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded hover:bg-blue-700 transition-colors"
                                            title="Vis bilde fra Digitalt Museum"
                                          >
                                            DM
                                          </button>
                                        )}
                                        {normalizedInvNr && fotowebDataMap[normalizedInvNr] && fotowebDataMap[normalizedInvNr].length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {fotowebDataMap[normalizedInvNr].map((result, idx) => (
                                              <button
                                                key={`${normalizedInvNr}-fw-${idx}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onPreviewImage(result.previewUrl || result.assetUrl, `FotoWeb: ${result.filename} (${nmTitle || spor.invNr})`);
                                                }}
                                                className="px-1.5 py-0.5 bg-amber-600 text-white text-[8px] font-bold rounded hover:bg-amber-700 transition-colors"
                                                title={`Vis bilde fra FotoWeb: ${result.filename}`}
                                              >
                                                FW {fotowebDataMap[normalizedInvNr].length > 1 ? idx + 1 : ''}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              
                              if (fieldKey === 'objectName' && nmObjectName) {
                                return (
                                  <Badge key="field-objectName" variant="default" className="normal-case font-medium w-fit">
                                    {nmObjectName}
                                  </Badge>
                                );
                              }

                              if (fieldKey === 'title') {
                                return (
                                  <div key="field-title" className="flex flex-col">
                                    {nmData ? (
                                      <span className="font-medium text-text-primary">{nmTitle || "Ukjent tittel"}</span>
                                    ) : (
                                      <span className="text-xs italic opacity-50 text-text-muted">Venter på data...</span>
                                    )}
                                  </div>
                                );
                              }

                              if (fieldKey === 'artist') {
                                return (
                                  <div key="field-artist" className="flex flex-col">
                                    {nmData ? (
                                      <span className="text-xs text-text-secondary">{nmArtist || "Ukjent kunstner"}</span>
                                    ) : null}
                                  </div>
                                );
                              }

                              if (fieldKey === 'materialDescription') {
                                return (
                                  <div key="field-material-description" className="flex flex-col">
                                    {nmData ? (
                                      nmMaterialTechnique ? (
                                        <div className="mb-2">
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{nmMaterialTechnique}</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs opacity-50 text-text-muted">—</span>
                                      )
                                    ) : (
                                      <span className="text-xs opacity-50 text-text-muted">—</span>
                                    )}
                                  </div>
                                );
                              }

                              if (fieldKey === 'material' || fieldKey === 'technique') {
                                // Only render once per column if both are present
                                if (fieldKey === 'technique' && columnFields[colIdx].includes('material')) return null;
                                
                                return (
                                  <div key="field-material-technique" className="flex flex-col">
                                    {nmData ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {columnFields[colIdx].includes('material') && nmMaterials.map((mat, idx) => (
                                          <Badge key={`mat-${idx}`} variant="inverted">
                                            {mat}
                                          </Badge>
                                        ))}
                                        {columnFields[colIdx].includes('technique') && nmTechniques.map((tech, idx) => (
                                          <Badge key={`tech-${idx}`}>
                                            {tech}
                                          </Badge>
                                        ))}
                                        {(!columnFields[colIdx].includes('material') || nmMaterials.length === 0) && 
                                         (!columnFields[colIdx].includes('technique') || nmTechniques.length === 0) && (
                                          <span className="text-xs text-text-muted opacity-50">—</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-text-muted opacity-50">—</span>
                                    )}
                                  </div>
                                );
                              }

                              if (fieldKey === 'dimensions') {
                                return (
                                  <div key="field-dimensions" className="flex flex-col">
                                    {nmData ? (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-text-primary">{nmDimensions || "Ukjente mål"}</span>
                                          {isLarge && (
                                            <div className="group/tooltip relative">
                                              <div className="p-1 rounded bg-amber-50 text-amber-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-box"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                                              </div>
                                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 bg-stone-900 text-text-inverted">
                                                Stort objekt (&gt;2m)
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[9px] uppercase tracking-tight mt-1 text-text-muted">Publiserbare mål</span>
                                      </>
                                    ) : (
                                      <span className="text-xs italic text-stone-300">-</span>
                                    )}
                                  </div>
                                );
                              }

                              return null;
                            })}
                            
                            {showCollectionBadge && collectionBadgeColumn === colIdx && (
                              <div className="mt-1">
                                <Badge variant="outline">Nasjonalmuseet</Badge>
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="block md:table-cell px-0 py-2 md:px-6 md:py-4 text-sm align-top">
                        <div className="md:hidden text-[10px] font-bold uppercase tracking-wider mb-2 text-text-muted">
                          Status
                        </div>
                        <button
                          onClick={() => toggleDone(spor.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isDone 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-50 border border-stone-200 text-text-muted hover:text-text-primary hover:border-stone-400'
                          }`}
                        >
                          {isDone ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border-2 border-current rounded-sm opacity-30" />}
                          {isDone ? "Ferdig" : "Merk ferdig"}
                        </button>
                      </td>
                      {showApiId && (
                        <td className="block md:table-cell px-0 py-2 md:px-6 md:py-4 text-xs font-mono text-text-muted align-top">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                            API ID
                          </div>
                          {nmData?.id || "-"}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr className="block md:table-row">
                  <td colSpan={4 + (showApiId ? 1 : 0)} className="block md:table-cell px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="w-8 h-8 text-stone-100" />
                      <p className="text-sm text-text-muted">Ingen verk registrert ennå.</p>
                      <p className="text-[10px] text-text-muted opacity-50 uppercase font-bold">Bruk "Parse MuseumPlus" eller legg til manuelt nedenfor</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Manuelt tillegg-rad */}
              <tr className="block md:table-row bg-stone-50/30">
                <td className="block md:table-cell p-4 md:px-6 md:py-4" colSpan={visibleColumns.length + (showApiId ? 1 : 0)}>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-full md:max-w-xs">
                        <input
                          type="text"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddManualWork()}
                          placeholder="Legg til inventarnummer manuelt..."
                          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm transition-all outline-none bg-stone-50 border-stone-200 text-text-primary focus:ring-2 focus:ring-text-primary"
                        />
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      </div>
                      <button
                        onClick={handleAddManualWork}
                        disabled={isAddingManual || !manualInput.trim()}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-stone-900 text-text-inverted hover:bg-stone-800"
                      >
                        {isAddingManual ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Legg til
                      </button>
                    </div>

                    <button
                      onClick={() => setIsParsingModalOpen(true)}
                      className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 bg-stone-100 text-text-secondary hover:bg-stone-200"
                    >
                      <Plus className="w-3 h-3" />
                      Parse MuseumPlus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-stone-50 border-stone-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Viser {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sporData.length)} av {sporData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded transition-colors disabled:opacity-30 text-text-muted hover:bg-stone-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-6 h-6 text-[10px] font-bold rounded transition-all ${
                      currentPage === page 
                        ? 'bg-stone-900 text-text-inverted'
                        : 'text-text-muted hover:bg-stone-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded transition-colors disabled:opacity-30 text-text-muted hover:bg-stone-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
};
