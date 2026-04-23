import React, { useMemo, useState } from "react";
import { Job } from "../types";
import { ArchiveList } from "./archive/ArchiveList";
import { ArchiveStatisticsTab } from "./archive/ArchiveStatisticsTab";
import { ArchiveHeader } from "./archive/ArchiveHeader";
import { formatDate, splitTitle, getLocationIndex, getTypeIndex, getPaletteColor, formatType, formatLocation, getJobDate, isInternJob, isExternJob } from "../utils/jobUtils";
import { useTheme } from "../context/ThemeContext";
import { Search, RefreshCw, Clock, MapPin, Camera, User, Database, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface ArchiveViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  selectedLocations?: string[];
  setSelectedLocations?: (locations: string[]) => void;
  uniqueLocations?: string[];
  selectedYear?: string;
  setSelectedYear?: (year: string) => void;
  uniqueYears?: string[];
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  loading?: boolean;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onRefresh?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  archiveTab: "list" | "stats";
  setArchiveTab: (tab: "list" | "stats") => void;
  clearFilters?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ 
  jobs, 
  onSelectJob, 
  selectedOwner, 
  setSelectedOwner,
  uniqueOwners = [],
  selectedLocations = [],
  setSelectedLocations,
  uniqueLocations = [],
  selectedYear = "all",
  setSelectedYear,
  uniqueYears = [],
  showNBOnly = false,
  setShowNBOnly,
  loading = false,
  searchTerm = "",
  setSearchTerm,
  onRefresh,
  onSync,
  isSyncing = false,
  archiveTab,
  setArchiveTab,
  clearFilters
}) => {
  const { theme } = useTheme();
  const [showOwnerSheet, setShowOwnerSheet] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // New filters
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "overdue" | "ontime">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "intern" | "ekstern" | "ukjent">("all");
  const [itemsFilter, setItemsFilter] = useState<"all" | "0" | "1" | "2-5" | ">5">("all");

  const title = selectedOwner && selectedOwner !== "all" 
    ? `Arkiv for ${selectedOwner}`
    : "Arkiv for Seksjon Foto";

  const isAnyFilterActive = useMemo(() => {
    return (selectedOwner && selectedOwner !== "all") || 
           (selectedLocations && selectedLocations.length > 0) || 
           (selectedYear && selectedYear !== "all") || 
           (searchTerm && searchTerm !== "") || 
           deadlineFilter !== "all" || 
           typeFilter !== "all" || 
           itemsFilter !== "all";
  }, [selectedOwner, selectedLocations, selectedYear, searchTerm, deadlineFilter, typeFilter, itemsFilter]);

  const resetFilters = () => {
    if (clearFilters) {
      clearFilters();
    } else {
      setSelectedOwner?.("all");
      setSelectedLocations?.([]);
      setSelectedYear?.("all");
      setSearchTerm?.("");
    }
    setDeadlineFilter("all");
    setTypeFilter("all");
    setItemsFilter("all");
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const props = job.all_properties || {};
      
      // Deadline filter
      if (deadlineFilter !== "all") {
        const deadlineStr = getJobDate(job); // Use getJobDate to get the correct deadline
        if (!deadlineStr) return false;
        const deadlineDate = new Date(deadlineStr);
        const diffTime = new Date().getTime() - deadlineDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (deadlineFilter === "overdue" && diffDays <= 0) return false;
        if (deadlineFilter === "ontime" && diffDays > 0) return false;
      }

      // Type filter
      if (typeFilter !== "all") {
        const isIntern = isInternJob(job);
        const isExtern = isExternJob(job);
        
        if (typeFilter === "intern" && !isIntern) return false;
        if (typeFilter === "ekstern" && !isExtern) return false;
        if (typeFilter === "ukjent" && (isIntern || isExtern)) return false;
      }

      // Items filter
      if (itemsFilter !== "all") {
        const numItems = parseInt(props.hs_num_of_associated_line_items || "0", 10);
        if (itemsFilter === "0" && numItems !== 0) return false;
        if (itemsFilter === "1" && numItems !== 1) return false;
        if (itemsFilter === "2-5" && (numItems < 2 || numItems > 5)) return false;
        if (itemsFilter === ">5" && numItems <= 5) return false;
      }

      return true;
    });
  }, [jobs, deadlineFilter, typeFilter, itemsFilter]);


  return (
    <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto space-y-10 min-h-screen transition-colors duration-500">
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 pb-4">
        <button
          onClick={() => setArchiveTab("stats")}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${
            archiveTab === "stats"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          Statistikk
        </button>
        <button
          onClick={() => setArchiveTab("list")}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${
            archiveTab === "list"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          Oppdragsliste
        </button>
      </div>

      {archiveTab === "stats" ? (
        <ArchiveStatisticsTab />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
            <Database className="absolute inset-0 m-auto w-6 h-6 text-stone-900 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-serif font-medium text-stone-900">Henter arkiv fra HubSpot</h3>
            <p className="text-stone-400 max-w-xs mx-auto text-sm">
              Dette kan ta noen sekunder da vi henter over 3000 oppdrag direkte fra kilden.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <ArchiveHeader
            title={title}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedOwner={selectedOwner}
            setSelectedOwner={setSelectedOwner}
            uniqueOwners={uniqueOwners}
            setShowOwnerSheet={setShowOwnerSheet}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            uniqueLocations={uniqueLocations}
            setShowLocationSheet={setShowLocationSheet}
            showNBOnly={showNBOnly}
            setShowNBOnly={setShowNBOnly}
            onRefresh={onRefresh}
            onSync={onSync}
            isSyncing={isSyncing}
          />

      {/* Year Selector */}
      {uniqueYears.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-stone-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mr-2">Velg år:</span>
          <button
            onClick={() => setSelectedYear?.("all")}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              selectedYear === "all"
                ? "bg-stone-900 text-white shadow-md"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            Alle år
          </button>
          {uniqueYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear?.(year)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                selectedYear === year
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="flex flex-col gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Avanserte filtre</span>
            <Badge variant="outline" className="ml-2">{filteredJobs.length} oppdrag</Badge>
          </div>
          
          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3 h-3" />
              Tøm filtre
            </button>
          )}
        </div>
        
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Frist</span>
              <div className="flex bg-stone-100 rounded-lg p-1">
                {["all", "overdue", "ontime"].map(val => (
                  <button
                    key={val}
                    onClick={() => setDeadlineFilter(val as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                      deadlineFilter === val ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {val === "all" ? "Alle" : val === "overdue" ? "Over frist" : "Innen frist"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Type</span>
              <div className="flex bg-stone-100 rounded-lg p-1">
                {["all", "intern", "ekstern", "ukjent"].map(val => (
                  <button
                    key={val}
                    onClick={() => setTypeFilter(val as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                      typeFilter === val ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {val === "all" ? "Alle" : val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Antall verk</span>
              <div className="flex bg-stone-100 rounded-lg p-1">
                {["all", "0", "1", "2-5", ">5"].map(val => (
                  <button
                    key={val}
                    onClick={() => setItemsFilter(val as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                      itemsFilter === val ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {val === "all" ? "Alle" : val + " verk"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Sheets - Mobile View */}
      <div className="md:hidden">
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
                className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[32px] shadow-2xl flex flex-col max-h-[70vh]"
              >
                <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 shrink-0">
                  <h3 className="text-lg font-serif font-bold text-stone-900">Velg fotograf</h3>
                  <button 
                    onClick={() => { 
                      setSelectedOwner?.('all'); 
                      setShowOwnerSheet(false); 
                    }} 
                    className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                  >
                    Nullstill
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    <button onClick={() => { setSelectedOwner?.('all'); setShowOwnerSheet(false); }} className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${(!selectedOwner || selectedOwner === 'all') ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>Alle Fotografer</button>
                    {uniqueOwners.map(owner => (
                      <button key={owner} onClick={() => { setSelectedOwner?.(owner); setShowOwnerSheet(false); }} className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${selectedOwner === owner ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>{owner}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {showLocationSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLocationSheet(false)}
                className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[32px] shadow-2xl flex flex-col max-h-[70vh]"
              >
                <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 shrink-0">
                  <h3 className="text-lg font-serif font-bold text-stone-900">Velg lokasjon</h3>
                  <button 
                    onClick={() => { 
                      setSelectedLocations?.([]); 
                      setShowLocationSheet(false); 
                    }} 
                    className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                  >
                    Nullstill
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    <button onClick={() => { setSelectedLocations?.([]); setShowLocationSheet(false); }} className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${selectedLocations.length === 0 ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>Alle lokasjoner</button>
                    {uniqueLocations.map(loc => (
                      <button key={loc} onClick={() => { setSelectedLocations?.([loc]); setShowLocationSheet(false); }} className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${selectedLocations.includes(loc) ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>{loc}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Archive List */}
      <section>
        <Card className="bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-100">
                <Clock className="w-4 h-4 text-stone-900" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">Arkiverte oppdrag</h3>
            </div>
            <Badge variant="inverted">
              {jobs.length} oppdrag
            </Badge>
          </div>

          {jobs.length > 0 ? (
            <ArchiveList jobs={jobs} onSelectJob={onSelectJob} />
          ) : (
            <div className="py-12 text-center border-2 border-dashed rounded-2xl border-stone-100">
              <p className="text-stone-400 text-sm">Ingen arkiverte oppdrag funnet.</p>
            </div>
          )}
        </Card>
      </section>
      </>
      )}
    </div>
  );
};
