import React, { useState } from "react";
import { Job } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { User } from "lucide-react";
import { getDeadlineInfo, getJobDate } from "../utils/jobUtils";
import { SortKey, DateFilter } from "../hooks/useJobFilters";
import { useTheme } from "../context/ThemeContext";
import { useNMData } from "../hooks/useNMData";
import { useDiMuData } from "../hooks/useDiMuData";
import { ImagePreviewModal } from "./ui/ImagePreviewModal";

// Import the sub-components
import { BrowseFilters } from "./browse/BrowseFilters";
import { BrowseGrid } from "./browse/BrowseGrid";
import { BrowseList } from "./browse/BrowseList";
import { BrowseToolbar } from "./browse/BrowseToolbar";

interface BrowseViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  layout: 'list' | 'grid';
  setLayout: (layout: 'list' | 'grid') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  handleSort: (key: SortKey) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  counts: { all: number; today: number; critical: number; overdue: number; next7: number };
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;
  uniqueOwners: string[];
  selectedLocation: string[];
  setSelectedLocation: (locations: string[]) => void;
  uniqueLocations: string[];
  locationCounts: Record<string, number>;
  selectedType: string[];
  setSelectedType: (types: string[]) => void;
  uniqueTypes: string[];
  typeCounts: Record<string, number>;
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  loading?: boolean;
  clearFilters?: () => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({ 
  jobs, 
  onSelectJob, 
  layout,
  setLayout,
  searchTerm,
  setSearchTerm,
  sortConfig,
  handleSort,
  dateFilter,
  setDateFilter,
  counts,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners,
  selectedLocation,
  setSelectedLocation,
  uniqueLocations,
  locationCounts,
  selectedType,
  setSelectedType,
  uniqueTypes,
  typeCounts,
  showNBOnly = false,
  setShowNBOnly,
  loading = false,
  clearFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showOwnerSheet, setShowOwnerSheet] = useState(false);
  const { theme } = useTheme();

  // Collect all unique NM IDs from the jobs for indicators
  const allNmIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(jobs)) {
      jobs.forEach(job => {
        if (job.nmids) {
          job.nmids.forEach(id => ids.add(id));
        }
      });
    }
    return Array.from(ids);
  }, [jobs]);

  const { nmDataMap } = useNMData(allNmIds);
  const { dimuDataMap } = useDiMuData(allNmIds);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const title = selectedOwner && selectedOwner !== "all" 
    ? `Bestillinger for ${selectedOwner}`
    : "Bestillinger";

  if (loading) {
    return (
      <div className="p-6 md:p-10 w-full max-w-[1600px] mx-auto space-y-8 animate-pulse">
        <div className="flex flex-col gap-6">
          <div className="h-10 bg-stone-200 rounded w-64"></div>
          <div className="h-10 bg-stone-200 rounded-full w-32"></div>
        </div>
        <div className="h-10 bg-stone-200 rounded-lg w-full md:w-96"></div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-48 bg-stone-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {selectedOwner !== "all" ? (
            <h2 className="hidden md:block text-2xl md:text-4xl font-serif font-medium text-stone-900">{title}</h2>
          ) : null}
          {selectedOwner !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border mt-3 w-fit bg-stone-100 border-stone-200">
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs font-medium text-stone-900">{selectedOwner}</span>
            </div>
          )}
        </div>
      </div>

      <BrowseToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedLocation={selectedLocation}
        selectedType={selectedType}
        dateFilter={dateFilter}
        selectedOwner={selectedOwner}
        setSelectedOwner={setSelectedOwner}
        uniqueOwners={uniqueOwners}
        setShowOwnerSheet={setShowOwnerSheet}
        showNBOnly={showNBOnly}
        setShowNBOnly={setShowNBOnly}
        handleSort={handleSort}
        sortConfig={sortConfig}
        layout={layout}
        setLayout={setLayout}
      />

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <BrowseFilters
              counts={counts}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              uniqueLocations={uniqueLocations}
              locationCounts={locationCounts}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              uniqueTypes={uniqueTypes}
              typeCounts={typeCounts}
              theme={theme}
              clearFilters={clearFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl border-stone-200">
          <p className="text-stone-500 text-sm">Ingen oppdrag funnet med valgte filtre.</p>
        </div>
      ) : (
        layout === 'grid' ? (
          <BrowseGrid
            jobs={jobs}
            onSelectJob={onSelectJob}
            theme={theme}
            nmDataMap={nmDataMap}
            dimuDataMap={dimuDataMap}
            setPreviewImage={setPreviewImage}
          />
        ) : (
          <BrowseList
            jobs={jobs}
            onSelectJob={onSelectJob}
            theme={theme}
          />
        )
      )}

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />

      {/* Owner Sheet for Mobile */}
      <AnimatePresence>
        {showOwnerSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOwnerSheet(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-stone-50 z-50 rounded-t-[32px] shadow-2xl flex flex-col max-h-[70vh]"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
              <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 shrink-0">
                <h3 className="text-lg font-serif font-bold text-stone-900">Velg fotograf</h3>
                <button 
                  onClick={() => {
                    setSelectedOwner('all');
                    setShowOwnerSheet(false);
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                >
                  Nullstill
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedOwner('all');
                      setShowOwnerSheet(false);
                    }}
                    className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${
                      (!selectedOwner || selectedOwner === 'all') 
                        ? 'bg-stone-900 text-white' 
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Alle Fotografer
                  </button>
                  {uniqueOwners.map(owner => (
                    <button
                      key={owner}
                      onClick={() => {
                        setSelectedOwner(owner);
                        setShowOwnerSheet(false);
                      }}
                      className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${
                        selectedOwner === owner 
                          ? 'bg-stone-900 text-white' 
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {owner}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
