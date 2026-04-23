import React from "react";
import { Search, RefreshCw, Database, X } from "lucide-react";

interface ArchiveHeaderProps {
  title: string;
  searchTerm: string;
  setSearchTerm?: (term: string) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners: string[];
  setShowOwnerSheet: (show: boolean) => void;
  selectedLocations: string[];
  setSelectedLocations?: (locations: string[]) => void;
  uniqueLocations: string[];
  setShowLocationSheet: (show: boolean) => void;
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  onRefresh?: () => void;
  onSync?: () => void;
  isSyncing: boolean;
}

export const ArchiveHeader: React.FC<ArchiveHeaderProps> = ({
  title,
  searchTerm,
  setSearchTerm,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners,
  setShowOwnerSheet,
  selectedLocations,
  setSelectedLocations,
  uniqueLocations,
  setShowLocationSheet,
  showNBOnly = false,
  setShowNBOnly,
  onRefresh,
  onSync,
  isSyncing
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="flex-1">
        <h2 className="text-2xl md:text-4xl font-serif font-medium text-stone-900">{title}</h2>
        <p className="text-stone-400 mt-2">Fullførte oppdrag (Deal Stage 6).</p>
        
        {/* Search & Filters */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-stone-400" />
            <input
              type="text"
              placeholder="Søk i arkivet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              className="
                w-full pl-11 pr-10 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2
                bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-stone-900/10 shadow-sm
              "
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="relative">
              <select
                value={selectedOwner || "all"}
                onChange={(e) => setSelectedOwner?.(e.target.value)}
                className="hidden md:block px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-sm"
              >
                <option value="all">Alle Fotografer</option>
                {uniqueOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              <button
                onClick={() => setShowOwnerSheet(true)}
                className="md:hidden px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-stone-900 shadow-sm whitespace-nowrap"
              >
                {selectedOwner && selectedOwner !== 'all' ? selectedOwner : 'Alle Fotografer'}
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedLocations[0] || "all"}
                onChange={(e) => setSelectedLocations?.(e.target.value === "all" ? [] : [e.target.value])}
                className="hidden md:block px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-sm"
              >
                <option value="all">Alle lokasjoner</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <button
                onClick={() => setShowLocationSheet(true)}
                className="md:hidden px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-stone-900 shadow-sm whitespace-nowrap"
              >
                {selectedLocations.length > 0 ? selectedLocations[0] : 'Alle lokasjoner'}
              </button>
            </div>

            {/* NB Filter */}
            <div className="flex items-center gap-2 px-4 py-3 border border-stone-200 rounded-xl bg-white shadow-sm">
              <input
                type="checkbox"
                id="archive-nb-filter"
                checked={showNBOnly}
                onChange={(e) => setShowNBOnly?.(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/10 cursor-pointer"
              />
              <label 
                htmlFor="archive-nb-filter" 
                className="text-[10px] font-bold uppercase tracking-widest text-stone-900 cursor-pointer select-none"
              >
                Nasjonalbiblioteket
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4">
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200"
            >
              <RefreshCw className="w-3 h-3" />
              Oppdater
            </button>
          )}
          {onSync && (
            <button 
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                isSyncing 
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                  : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              <Database className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Synkroniserer..." : "Synkroniser fra HubSpot"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
