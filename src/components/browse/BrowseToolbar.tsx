import React from "react";
import { Search, X, Filter, User, Calendar, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List } from "lucide-react";
import { SortKey, DateFilter } from "../../hooks/useJobFilters";

export interface BrowseToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedLocation: string[];
  selectedType: string[];
  dateFilter: DateFilter;
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;
  uniqueOwners: string[];
  setShowOwnerSheet: (show: boolean) => void;
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  handleSort: (key: SortKey) => void;
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  layout: 'list' | 'grid';
  setLayout: (layout: 'list' | 'grid') => void;
}

export const BrowseToolbar: React.FC<BrowseToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  selectedLocation,
  selectedType,
  dateFilter,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners,
  setShowOwnerSheet,
  showNBOnly = false,
  setShowNBOnly,
  handleSort,
  sortConfig,
  layout,
  setLayout
}) => {
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-stone-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-stone-900" />
      : <ArrowDown className="w-3 h-3 text-stone-900" />;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-4 border-b border-stone-100">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full md:w-auto">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Søk i oppdrag, NMID, lokasjon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-lg text-sm focus:outline-none transition-all bg-white border border-stone-200 text-stone-900 focus:ring-2 focus:ring-stone-200 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold uppercase tracking-widest whitespace-nowrap ${
              showFilters || selectedLocation.length > 0 || selectedType.length > 0 || dateFilter !== 'all'
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-500 border-stone-200 hover:border-stone-300 shadow-sm"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? "SKJUL FILTRE" : "FILTRER"}
            {(selectedLocation.length + selectedType.length + (dateFilter !== 'all' ? 1 : 0)) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[8px] bg-white/20">
                {(selectedLocation.length + selectedType.length + (dateFilter !== 'all' ? 1 : 0))}
              </span>
            )}
          </button>

          {/* Owner Filter Dropdown */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 shrink-0 transition-colors bg-white border-stone-200 shadow-sm hover:border-stone-300">
            <User className="w-3.5 h-3.5 transition-colors text-stone-400" />
            
            {/* Desktop Select */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="hidden md:block text-[10px] font-bold uppercase tracking-wider bg-transparent border-none focus:ring-0 cursor-pointer outline-none pr-1 max-w-[120px] md:max-w-none truncate text-stone-900 [&>option]:text-stone-900"
            >
              <option value="all">Alle Fotografer</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>

            {/* Mobile Trigger */}
            <button
              onClick={() => setShowOwnerSheet(true)}
              className="md:hidden text-[10px] font-bold uppercase tracking-wider bg-transparent border-none focus:ring-0 cursor-pointer outline-none pr-1 max-w-[120px] truncate text-stone-900 text-left"
            >
              {selectedOwner === 'all' ? 'Alle Fotografer' : selectedOwner}
            </button>
          </div>

          {/* NB Filter */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 shrink-0 transition-colors bg-white border-stone-200 shadow-sm hover:border-stone-300">
            <input
              type="checkbox"
              id="browse-nb-filter"
              checked={showNBOnly}
              onChange={(e) => setShowNBOnly?.(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900/10 cursor-pointer"
            />
            <label 
              htmlFor="browse-nb-filter" 
              className="text-[10px] font-bold uppercase tracking-widest text-stone-900 cursor-pointer select-none"
            >
              Nasjonalbiblioteket
            </label>
          </div>
        </div>
      </div>
      
      {/* Sort Controls & Layout Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSort('deadline')}
          className="hidden md:flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap bg-white border-stone-200 text-stone-500 hover:bg-stone-50 shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>FRIST {sortConfig.direction === 'asc' ? 'STIGENDE' : 'SYNKENDE'}</span>
          <SortIcon columnKey="deadline" />
        </button>
        
        <div className="hidden md:flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button
            onClick={() => setLayout("grid")}
            className={`p-1.5 rounded-md transition-all ${
              layout === "grid"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
            title="Rutenett"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayout("list")}
            className={`p-1.5 rounded-md transition-all ${
              layout === "list"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
            title="Liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
