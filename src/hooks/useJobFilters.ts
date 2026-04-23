import { useMemo, useState, useCallback } from "react";
import { Job } from "../types";
import { splitTitle, getJobDate, parseDate, parseHubSpotTracks, formatType, formatLocation, isJobNB } from "../utils/jobUtils";
import { useAllExtraWorks } from "./useAllExtraWorks";
import { useAllNotes } from "./useAllNotes";

export type SortKey = 'name' | 'location' | 'deadline' | 'owner' | 'type';
export type SortDirection = 'asc' | 'desc';
export type DateFilter = 'all' | 'today' | 'critical' | 'overdue' | 'next7';

interface PreProcessedJob extends Job {
  _parsedDate: Date | null;
  _normalizedLocation: string;
  _normalizedType: string;
  _searchContent: string;
  _isNB: boolean;
}

export const useJobFilters = (jobs: Job[], jobOverrides: Record<string, { sendToNB?: boolean }> = {}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showNBOnly, setShowNBOnlyInternal] = useState(false);
  
  const setShowNBOnly = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof show === 'function' ? show(showNBOnly) : show;
    if (newValue) {
      // Clear specific filters that might hide results when searching for NB specifically
      setSearchTerm("");
      setSelectedOwner("all");
      setSelectedLocations([]);
      setSelectedTypes([]);
      setSelectedYear("all");
      setDateFilter("all");
    }
    setShowNBOnlyInternal(newValue);
  }, [showNBOnly]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'deadline', 
    direction: 'asc' 
  });

  const { allExtraWorks } = useAllExtraWorks();
  const { allNotes } = useAllNotes();

  // Pre-process jobs for faster filtering and sorting
  const processedJobs = useMemo<PreProcessedJob[]>(() => {
    if (!Array.isArray(jobs)) return [];
    
    return jobs.map(job => {
      const props = job.all_properties || {};
      const deadlineStr = getJobDate(job);
      const parsedDate = parseDate(deadlineStr);
      
      const rawLocation = props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent";
      const location = formatLocation(rawLocation, props, job.title);
      const type = formatType(props.type_fotografering || "Ukjent", props, job.title);
      
      const { name, type: titleType } = splitTitle(job.title);
      
      const isNB = isJobNB(job, jobOverrides);

      // Format owner names to handle raw IDs
      const formattedOwners = (job.owner_names || []).map(owner => {
        if (/^\d+$/.test(owner)) {
          return `Ukjent fotograf (#${owner})`;
        }
        return owner;
      });

      const owner = formattedOwners[0] || "Ikke Fordelt";
      const tracks = parseHubSpotTracks(props);
      const extraWorksForJob = allExtraWorks[job.id] || [];
      const notesForJob = allNotes[job.id] || [];
      
      // Build a searchable string once
      const searchContent = [
        name,
        titleType,
        location,
        owner,
        job.description,
        props.bruk_av_bilder,
        props.tilleggsinformasjon_foto,
        props.bruksomrade,
        props.levering_etter_fotografering,
        props.kontaktperson_pa_kommunikasjon_og_sammenheng,
        ...(job.nmids || []),
        ...tracks.flatMap(t => [t.invNr, t.kunstner, t.teknikk, t.mal]),
        ...extraWorksForJob.map(w => w.invNr),
        ...notesForJob.map(n => n.content)
      ].filter(Boolean).join(" ").toLowerCase();

      return {
        ...job,
        owner_names: formattedOwners.length > 0 ? formattedOwners : ["Ikke Fordelt"],
        _parsedDate: parsedDate,
        _normalizedLocation: location,
        _normalizedType: type,
        _searchContent: searchContent,
        _isNB: isNB
      };
    });
  }, [jobs, allExtraWorks, allNotes, jobOverrides]);

  const uniqueOwners = useMemo(() => {
    return Array.from(
      new Set(
        processedJobs
          .flatMap((job) => job.owner_names || [])
          .filter(Boolean)
      )
    ).sort();
  }, [processedJobs]);

  const uniqueLocations = useMemo(() => {
    return Array.from(
      new Set(
        processedJobs
          .map((job) => job._normalizedLocation)
          .filter(Boolean)
      )
    ).sort();
  }, [processedJobs]);

  const uniqueTypes = useMemo(() => {
    return Array.from(
      new Set(
        processedJobs
          .map((job) => job._normalizedType)
          .filter(t => t && t !== "Ukjent")
      )
    ).sort();
  }, [processedJobs]);

  const uniqueYears = useMemo<string[]>(() => {
    const years = new Set<string>();
    processedJobs.forEach((job) => {
      const dateStr = job.due_date || job.all_properties?.closedate || job.all_properties?.createdate;
      if (dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        if (!isNaN(year)) {
          years.add(year.toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [processedJobs]);

  const matchesFilters = useCallback((job: PreProcessedJob, filters: {
    owner?: string;
    locations?: string[];
    types?: string[];
    year?: string;
    date?: DateFilter;
    search?: string;
    showNBOnly?: boolean;
  }, today: Date, next7: Date) => {
    // NB filter
    if (filters.showNBOnly) {
      if (!job._isNB) return false;
    }

    // Owner filter
    if (filters.owner && filters.owner !== "all") {
      if (!job.owner_names || !job.owner_names.includes(filters.owner)) return false;
    }

    // Location filter
    if (filters.locations && filters.locations.length > 0) {
      if (!filters.locations.includes(job._normalizedLocation)) return false;
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      const jobTypeLower = job._normalizedType.toLowerCase();
      if (!filters.types.some(t => jobTypeLower.includes(t.toLowerCase()))) return false;
    }

    // Year filter
    if (filters.year && filters.year !== "all") {
      const dateStr = job.due_date || job.all_properties?.closedate || job.all_properties?.createdate;
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear().toString();
      if (year !== filters.year) return false;
    }

    // Date filter
    if (filters.date && filters.date !== "all") {
      const date = job._parsedDate ? new Date(job._parsedDate) : null;
      if (!date) return false;
      date.setHours(0, 0, 0, 0);

      const time = date.getTime();
      const todayTime = today.getTime();
      const next7Time = next7.getTime();

      if (filters.date === "today") {
        if (time !== todayTime) return false;
      } else if (filters.date === "critical") {
        const diff = Math.round((time - todayTime) / (1000 * 3600 * 24));
        if (diff >= -100) return false;
      } else if (filters.date === "overdue") {
        const diff = Math.round((time - todayTime) / (1000 * 3600 * 24));
        if (diff < -100 || diff >= 0) return false;
      } else if (filters.date === "next7") {
        if (time <= todayTime || time > next7Time) return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchStr = filters.search.toLowerCase();
      // Split by AND operators: "AND", "&", "+"
      // We also treat spaces as separators for terms that must all match
      const terms = searchStr.split(/\s+AND\s+|\s*[&+]+\s*/i).flatMap(t => t.split(/\s+/)).filter(Boolean);
      
      if (terms.length > 0) {
        return terms.every(term => {
          if (term.endsWith('*')) {
            const prefix = term.slice(0, -1);
            if (!prefix) return true;
            // Check if any word in the search content starts with this prefix
            return job._searchContent.split(/\s+/).some(word => word.startsWith(prefix));
          } else {
            return job._searchContent.includes(term);
          }
        });
      }
    }

    return true;
  }, []);

  const filteredJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    return processedJobs.filter(job => 
      matchesFilters(job, {
        owner: selectedOwner,
        locations: selectedLocations,
        types: selectedTypes,
        year: selectedYear,
        date: dateFilter,
        search: searchTerm,
        showNBOnly: showNBOnly
      }, today, next7)
    );
  }, [processedJobs, selectedOwner, selectedLocations, selectedTypes, selectedYear, searchTerm, dateFilter, showNBOnly, matchesFilters]);

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const baseFiltered = processedJobs.filter(job => 
      matchesFilters(job, {
        owner: selectedOwner,
        locations: selectedLocations,
        types: selectedTypes,
        year: selectedYear,
        showNBOnly: showNBOnly
      }, today, next7)
    );

    const results = { all: baseFiltered.length, today: 0, critical: 0, overdue: 0, next7: 0 };
    
    baseFiltered.forEach(job => {
      const date = job._parsedDate ? new Date(job._parsedDate) : null;
      if (!date) return;
      date.setHours(0, 0, 0, 0);
      
      const time = date.getTime();
      const todayTime = today.getTime();
      const next7Time = next7.getTime();
      const diff = Math.round((time - todayTime) / (1000 * 3600 * 24));

      if (time === todayTime) results.today++;
      if (diff < -100) results.critical++;
      if (diff < 0 && diff >= -100) results.overdue++;
      if (time > todayTime && time <= next7Time) results.next7++;
    });

    return results;
  }, [processedJobs, selectedOwner, selectedLocations, selectedTypes, selectedYear, showNBOnly, matchesFilters]);

  const locationCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const baseFiltered = processedJobs.filter(job => 
      matchesFilters(job, {
        owner: selectedOwner,
        types: selectedTypes,
        year: selectedYear,
        date: dateFilter,
        showNBOnly: showNBOnly
      }, today, next7)
    );

    const counts: Record<string, number> = { "all": baseFiltered.length };
    uniqueLocations.forEach(loc => { counts[loc] = 0; });

    baseFiltered.forEach(job => {
      const loc = job._normalizedLocation;
      if (counts[loc] === undefined) counts[loc] = 0;
      counts[loc]++;
    });

    return counts;
  }, [processedJobs, selectedOwner, dateFilter, uniqueLocations, selectedTypes, selectedYear, showNBOnly, matchesFilters]);

  const typeCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const baseFiltered = processedJobs.filter(job => 
      matchesFilters(job, {
        owner: selectedOwner,
        locations: selectedLocations,
        year: selectedYear,
        date: dateFilter,
        showNBOnly: showNBOnly
      }, today, next7)
    );

    const counts: Record<string, number> = { "all": baseFiltered.length };
    uniqueTypes.forEach(type => { counts[type] = 0; });

    baseFiltered.forEach(job => {
      const type = job._normalizedType;
      if (type && type !== "Ukjent") {
        if (counts[type] === undefined) counts[type] = 0;
        counts[type]++;
      }
    });

    return counts;
  }, [processedJobs, selectedOwner, selectedLocations, dateFilter, uniqueTypes, selectedYear, showNBOnly, matchesFilters]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'name':
          const { name: nameA } = splitTitle(a.title);
          const { name: nameB } = splitTitle(b.title);
          comparison = nameA.localeCompare(nameB);
          break;
        case 'location':
          comparison = a._normalizedLocation.localeCompare(b._normalizedLocation);
          break;
        case 'type':
          comparison = a._normalizedType.localeCompare(b._normalizedType);
          break;
        case 'owner':
          const ownerA = a.owner_names?.[0] || "";
          const ownerB = b.owner_names?.[0] || "";
          comparison = ownerA.localeCompare(ownerB);
          break;
        case 'deadline':
        default:
          const timeA = a._parsedDate ? a._parsedDate.getTime() : Infinity;
          const timeB = b._parsedDate ? b._parsedDate.getTime() : Infinity;
          comparison = timeA - timeB;
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredJobs, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedOwner("all");
    setSelectedLocations([]);
    setSelectedTypes([]);
    setSelectedYear("all");
    setDateFilter("all");
    setShowNBOnly(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    selectedOwner,
    setSelectedOwner,
    selectedLocations,
    setSelectedLocations,
    selectedTypes,
    setSelectedTypes,
    selectedYear,
    setSelectedYear,
    showNBOnly,
    setShowNBOnly,
    sortConfig,
    setSortConfig,
    handleSort,
    clearFilters,
    uniqueOwners,
    uniqueLocations,
    uniqueTypes,
    uniqueYears,
    dateFilter,
    setDateFilter,
    counts,
    locationCounts,
    typeCounts,
    filteredJobs: sortedJobs
  };
};
