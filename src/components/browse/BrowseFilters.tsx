import React from "react";
import { DateFilter } from "../../hooks/useJobFilters";
import { getLocationIndex, getTypeIndex, getPaletteColor } from "../../utils/jobUtils";
import { ThemeColors } from "../../context/ThemeContext";

export interface BrowseFiltersProps {
  counts: { all: number; today: number; critical: number; overdue: number; next7: number };
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  selectedLocation: string[];
  setSelectedLocation: (locations: string[]) => void;
  uniqueLocations: string[];
  locationCounts: Record<string, number>;
  selectedType: string[];
  setSelectedType: (types: string[]) => void;
  uniqueTypes: string[];
  typeCounts: Record<string, number>;
  theme: ThemeColors;
  clearFilters?: () => void;
}

export const BrowseFilters: React.FC<BrowseFiltersProps> = ({ 
  counts, 
  dateFilter, 
  setDateFilter, 
  selectedLocation, 
  setSelectedLocation, 
  uniqueLocations, 
  locationCounts, 
  selectedType, 
  setSelectedType, 
  uniqueTypes, 
  typeCounts, 
  theme,
  clearFilters
}) => {
  const hasActiveFilters = dateFilter !== 'all' || 
    selectedLocation.length > 0 || 
    selectedType.length > 0;

  return (
    <div className="flex flex-col gap-6 p-0 md:p-6 rounded-2xl md:border bg-transparent md:bg-stone-50/50 border-stone-100">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest ml-1 text-text-muted">Filtre</span>
        {clearFilters && hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
          >
            Tøm filtre
          </button>
        )}
      </div>

      {/* Date Filters Group */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest ml-1 text-text-muted">Tidsfrist</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Alle', count: counts.all },
            { id: 'today', label: 'I dag', count: counts.today },
            { id: 'critical', label: 'Kritisk over frist', count: counts.critical, color: '#C0392B' },
            { id: 'overdue', label: 'Over frist', count: counts.overdue, color: '#B7762E' },
            { id: 'next7', label: '7 dager', count: counts.next7 }
          ].map((filter: any) => {
            const isActive = dateFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id as DateFilter)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border flex items-center gap-2 ${
                  isActive 
                    ? 'bg-stone-900 text-white border-transparent shadow-sm' 
                    : "bg-stone-50 text-text-secondary border-stone-200 hover:border-stone-300"
                }`}
              >
                {filter.label}
                <span 
                  className={`font-mono ${isActive ? 'opacity-100' : 'opacity-70'}`}
                  style={filter.color && !isActive ? { color: filter.color } : {}}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Filters Group */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest ml-1 text-text-muted">Lokasjon</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedLocation([])}
            className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border flex items-center gap-2 ${
              selectedLocation.length === 0
                ? "bg-text-primary text-text-inverted border-text-primary shadow-sm"
                : "bg-stone-50 text-text-secondary border-stone-200 hover:border-stone-300"
            }`}
          >
            Alle steder
            <span className="opacity-50 font-mono">{locationCounts["all"] || 0}</span>
          </button>
          
          {uniqueLocations.map((loc: string) => {
            const locIndex = getLocationIndex(loc);
            const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
            const isActive = selectedLocation.includes(loc);
            const count = locationCounts[loc] || 0;
            if (count === 0 && !isActive) return null;

            return (
              <button
                key={loc}
                onClick={() => {
                  if (isActive) {
                    setSelectedLocation(selectedLocation.filter((l: string) => l !== loc));
                  } else {
                    setSelectedLocation([...selectedLocation, loc]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border flex items-center gap-2 ${
                  isActive 
                    ? "border-transparent shadow-sm text-text-primary" 
                    : "bg-stone-50 text-text-secondary border-stone-200 hover:border-stone-300"
                }`}
                style={isActive ? { backgroundColor: locBg, color: locText } : {}}
              >
                {loc}
                <span className="opacity-50 font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Type Filters Group */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest ml-1 text-text-muted">Kategori / Type</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedType([])}
            className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border flex items-center gap-2 ${
              selectedType.length === 0
                ? "bg-text-primary text-text-inverted border-text-primary shadow-sm"
                : "bg-stone-50 text-text-secondary border-stone-200 hover:border-stone-300"
            }`}
          >
            Alle typer
            <span className="opacity-50 font-mono">{typeCounts["all"] || 0}</span>
          </button>
          
          {Array.from(new Set([
            "Maleri", "Utstillingsåpning", "Utstillingsdokumentasjon", 
            "Gjenstand", "Objekt", "Arrangement Kveldstid/Helg", 
            "Kunstverk i utstilling", "Press/KOMMUNIKASJON/SOME", "Kunst på papir",
            ...uniqueTypes
          ])).map((type: any) => {
            const typeIndex = getTypeIndex(type);
            const { bg: typeBg, text: typeText } = getPaletteColor(theme.typePalette, typeIndex);
            const isActive = selectedType.includes(type);
            const count = typeCounts[type] || 0;
            
            if (count === 0 && !isActive) return null;

            return (
              <button
                key={type}
                onClick={() => {
                  if (isActive) {
                    setSelectedType(selectedType.filter((t: string) => t !== type));
                  } else {
                    setSelectedType([...selectedType, type]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border flex items-center gap-2 ${
                  isActive 
                    ? "border-transparent shadow-sm text-text-primary" 
                    : "bg-stone-50 text-text-secondary border-stone-200 hover:border-stone-300"
                }`}
                style={isActive ? { backgroundColor: typeBg, color: typeText } : {}}
              >
                {type}
                <span className="opacity-50 font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
