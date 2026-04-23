import React, { useMemo, useRef, useState, useCallback } from "react";
import { Job } from "../types";
import { MONTHLY_AVERAGES, MAIN_PHOTOGRAPHERS } from "../constants/dashboardConstants";
import { DashboardStats } from "./dashboard/DashboardStats";
import { JobTable } from "./dashboard/JobTable";
import { TrendChart } from "./dashboard/TrendChart";
import { WorkloadSidebar } from "./dashboard/WorkloadSidebar";
import { DashboardJobCard } from "./dashboard/DashboardJobCard";
import { parseDate, getJobLocationStr, getJobDeadlineStr, categorizeLocation, isJobNB as isJobNBUtil } from "../utils/jobUtils";
import { STATUS } from "../constants/fieldNames";
import { getWeekNumber } from "../utils/dateUtils";
import { getAIRecommendationForJob } from "../services/geminiService";
import { DateFilter } from "../hooks/useJobFilters";
import { useTheme } from "../context/ThemeContext";
import { useJobData } from "../context/JobDataContext";
import { Search, RefreshCw, Clock, PlusCircle, TrendingUp, Users, X, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNMData } from "../hooks/useNMData";
import { useDiMuData } from "../hooks/useDiMuData";
import { ImagePreviewModal } from "./ui/ImagePreviewModal";

interface DashboardProps {
  jobs: Job[];
  historicalJobs?: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  selectedLocations?: string[];
  setSelectedLocations?: (locations: string[]) => void;
  uniqueLocations?: string[];
  showNBOnly?: boolean;
  setShowNBOnly?: (show: boolean) => void;
  onNavigateToBrowse?: (filter: DateFilter) => void;
  loading?: boolean;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onRefresh?: () => void;
  clearFilters?: () => void;
}


export const Dashboard: React.FC<DashboardProps> = ({ 
  jobs, 
  historicalJobs = [],
  onSelectJob, 
  selectedOwner, 
  setSelectedOwner,
  uniqueOwners = [],
  selectedLocations = [],
  setSelectedLocations,
  uniqueLocations = [],
  onNavigateToBrowse,
  loading = false,
  searchTerm = "",
  setSearchTerm,
  onRefresh,
  showNBOnly = false,
  setShowNBOnly,
  clearFilters
}) => {
  const { theme } = useTheme();
  const { jobOverrides } = useJobData();

  const isJobNB = useCallback((job: Job) => {
    return isJobNBUtil(job, jobOverrides);
  }, [jobOverrides]);

  const visibleJobs = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    if (showNBOnly) return jobs; // They are already filtered by hook if showNBOnly is true
    return jobs.filter(job => !isJobNB(job));
  }, [jobs, isJobNB, showNBOnly]);

  const statsJobs = useMemo(() => {
    return Array.isArray(jobs) ? jobs.filter(job => !isJobNB(job)) : [];
  }, [jobs, isJobNB]);

  const statsHistoricalJobs = useMemo(() => {
    return Array.isArray(historicalJobs) ? historicalJobs.filter(job => !isJobNB(job)) : [];
  }, [historicalJobs, isJobNB]);

  const visibleHistoricalJobs = useMemo(() => {
    if (!Array.isArray(historicalJobs)) return [];
    if (showNBOnly) return historicalJobs;
    return historicalJobs.filter(job => !isJobNB(job));
  }, [historicalJobs, isJobNB, showNBOnly]);

  const [showOwnerSheet, setShowOwnerSheet] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const hasActiveFilters = (selectedOwner && selectedOwner !== "all") || 
    (selectedLocations && selectedLocations.length > 0) || 
    (searchTerm && searchTerm.length > 0);
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayEvents = useMemo(() => {
    if (!Array.isArray(visibleJobs)) return [];
    return visibleJobs.filter(job => {
      const props = job.all_properties || {};
      const deadlineStr = getJobDeadlineStr(props, job);
      if (deadlineStr) {
        const deadline = parseDate(deadlineStr);
        if (!deadline) return false;
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() === today.getTime();
      }
      return false;
    });
  }, [visibleJobs, today]);

  const thisWeekJobs = useMemo(() => {
    if (!Array.isArray(visibleJobs)) return [];
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    return visibleJobs.filter(job => {
      const props = job.all_properties || {};
      const deadlineStr = getJobDeadlineStr(props, job);
      if (deadlineStr) {
        const deadline = parseDate(deadlineStr);
        if (!deadline) return false;
        return deadline > today && deadline <= endOfWeek;
      }
      return false;
    }).sort((a, b) => {
      const da = parseDate(a.all_properties?.frist_for_fotografering || a.due_date)?.getTime() || 0;
      const db = parseDate(b.all_properties?.frist_for_fotografering || b.due_date)?.getTime() || 0;
      return da - db;
    });
  }, [visibleJobs, today]);

  const distributionJobs = useMemo(() => {
    if (!Array.isArray(visibleJobs)) return [];
    return visibleJobs.filter(job => {
      const stage = job.all_properties?.dealstage || '';
      const isDistributionStage = stage.toLowerCase().includes('fordeling') || stage === '4' || stage === 'appointmentscheduled';
      const isUnassigned = !job.owner_names || job.owner_names.length === 0 || job.owner_names.includes(STATUS.UNASSIGNED);
      
      return (isDistributionStage || isUnassigned) && job.status !== 'Løst';
    }).slice(0, 5);
  }, [visibleJobs]);

  // Collect all unique NM IDs for indicators
  const allNmIds = useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(visibleJobs)) {
      visibleJobs.forEach(job => {
        if (job.nmids) {
          job.nmids.forEach(id => ids.add(id));
        }
      });
    }
    return Array.from(ids);
  }, [visibleJobs]);

  const { nmDataMap } = useNMData(allNmIds);
  const { dimuDataMap } = useDiMuData(allNmIds);

  const weekStats = useMemo(() => {
    const endOfThisWeek = new Date(today);
    endOfThisWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const startOfNextWeek = new Date(endOfThisWeek);
    startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
    startOfNextWeek.setHours(0, 0, 0, 0);
    
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    let thisWeek = 0;
    let nextWeek = 0;

    if (Array.isArray(visibleJobs)) {
      visibleJobs.forEach(job => {
        const props = job.all_properties || {};
        const deadlineStr = getJobDeadlineStr(props, job);
        const deadline = parseDate(deadlineStr);
        if (deadline) {
          if (deadline >= today && deadline <= endOfThisWeek) thisWeek++;
          if (deadline >= startOfNextWeek && deadline <= endOfNextWeek) nextWeek++;
        }
      });
    }

    return { thisWeek, nextWeek };
  }, [visibleJobs, today]);

  const trendData = useMemo(() => {
    const startTrend = new Date(today);
    startTrend.setMonth(today.getMonth() - 3);
    // Align to start of week (Monday)
    startTrend.setDate(startTrend.getDate() - (startTrend.getDay() === 0 ? 6 : startTrend.getDay() - 1));
    startTrend.setHours(0, 0, 0, 0);

    const endTrend = new Date(today);
    endTrend.setMonth(today.getMonth() + 3); // 3 months into the future
    // Align to end of week (Sunday)
    endTrend.setDate(endTrend.getDate() + (endTrend.getDay() === 0 ? 0 : 7 - endTrend.getDay()));
    endTrend.setHours(23, 59, 59, 999);

    const weeksCount = Math.ceil((endTrend.getTime() - startTrend.getTime()) / (1000 * 3600 * 24 * 7));
    
    const data = new Array(weeksCount).fill(0).map((_, i) => {
      const weekStart = new Date(startTrend);
      weekStart.setDate(startTrend.getDate() + i * 7);
      return {
        date: weekStart,
        count: 0,
        expectedCount: undefined as number | undefined,
        isFuture: weekStart > today
      };
    });

    const processJobs = (jobList: Job[]) => {
      if (Array.isArray(jobList)) {
        jobList.forEach(job => {
          const props = job.all_properties || {};
          const deadlineStr = getJobDeadlineStr(props, job);
          const deadline = parseDate(deadlineStr);
          if (deadline && deadline >= startTrend && deadline <= endTrend) {
            const weekIndex = Math.floor((deadline.getTime() - startTrend.getTime()) / (1000 * 3600 * 24 * 7));
            if (weekIndex >= 0 && weekIndex < weeksCount) {
              data[weekIndex].count++;
            }
          }
        });
      }
    };

    if (Array.isArray(visibleHistoricalJobs) && visibleHistoricalJobs.length > 0) {
      // Use historical jobs for past data
      processJobs(visibleHistoricalJobs.filter(j => {
        if (selectedOwner && selectedOwner !== 'all') {
          const isOwner = j.owner_names?.some(name => 
            name.toLowerCase().includes(selectedOwner.toLowerCase()) || 
            selectedOwner.toLowerCase().includes(name.toLowerCase())
          );
          if (!isOwner) return false;
        }
        const props = j.all_properties || {};
        const deadlineStr = props.frist_for_fotografering || props.dato_og_klokkeslett || j.due_date;
        const deadline = parseDate(deadlineStr);
        return deadline && deadline <= today;
      }));
      // Use current jobs for future data
      processJobs(Array.isArray(visibleJobs) ? visibleJobs.filter(j => {
        const props = j.all_properties || {};
        const deadlineStr = props.frist_for_fotografering || props.dato_og_klokkeslett || j.due_date;
        const deadline = parseDate(deadlineStr);
        return deadline && deadline > today;
      }) : []);
    } else {
      processJobs(visibleJobs);
    }
    
    // Calculate a granular weekly historical pattern from all historical data
    const globalWeeklyAverages: Record<number, number> = {};
    if (Array.isArray(visibleHistoricalJobs) && visibleHistoricalJobs.length > 0) {
      const countsByWeekAndYear: Record<number, Record<number, number>> = {};
      visibleHistoricalJobs.forEach(job => {
        const props = job.all_properties || {};
        const deadlineStr = getJobDeadlineStr(props, job);
        const deadline = parseDate(deadlineStr);
        if (deadline && deadline < today) {
          const week = getWeekNumber(deadline);
          const year = deadline.getFullYear();
          if (!countsByWeekAndYear[week]) countsByWeekAndYear[week] = {};
          countsByWeekAndYear[week][year] = (countsByWeekAndYear[week][year] || 0) + 1;
        }
      });

      for (let w = 1; w <= 53; w++) {
        if (countsByWeekAndYear[w]) {
          const years = Object.keys(countsByWeekAndYear[w]);
          const sum = Object.values(countsByWeekAndYear[w]).reduce((a, b) => a + b, 0);
          globalWeeklyAverages[w] = sum / years.length;
        }
      }
    }

    const monthlyAverages = MONTHLY_AVERAGES;

    // Calculate expected count for future weeks
    if (!selectedOwner || selectedOwner === 'all') {
      data.forEach(d => {
        if (d.isFuture) {
          const week = getWeekNumber(d.date);
          if (globalWeeklyAverages[week] !== undefined) {
            d.expectedCount = globalWeeklyAverages[week];
          } else {
            const month = d.date.getMonth();
            d.expectedCount = monthlyAverages[month] / 4.33;
          }
        }
      });
    } else {
      // Calculate the photographer's share of all jobs over the last 12 months
      let totalRecent = 0;
      let photographerRecent = 0;
      const twelveMonthsAgo = new Date(today);
      twelveMonthsAgo.setFullYear(today.getFullYear() - 1);

      if (Array.isArray(statsHistoricalJobs)) {
        statsHistoricalJobs.forEach(job => {
          const props = job.all_properties || {};
          const deadlineStr = getJobDeadlineStr(props, job);
          const deadline = parseDate(deadlineStr);
          if (deadline && deadline < today && deadline >= twelveMonthsAgo) {
            totalRecent++;
            const isOwner = job.owner_names?.some(name => 
              name.toLowerCase().includes(selectedOwner.toLowerCase()) || 
              selectedOwner.toLowerCase().includes(name.toLowerCase())
            );
            if (isOwner) {
              photographerRecent++;
            }
          }
        });
      }

      let scaleFactor = totalRecent > 20 ? (photographerRecent / totalRecent) : 0.2;
      if (scaleFactor < 0.1) {
        const isMain = MAIN_PHOTOGRAPHERS.some(p => selectedOwner.toLowerCase().includes(p));
        if (isMain) scaleFactor = 0.2;
      }

      data.forEach(d => {
        if (d.isFuture) {
          const week = getWeekNumber(d.date);
          const baseExpected = globalWeeklyAverages[week] !== undefined 
            ? globalWeeklyAverages[week] 
            : (monthlyAverages[d.date.getMonth()] / 4.33);
          
          d.expectedCount = baseExpected * scaleFactor;
        }
      });
    }

    // Smooth the expected counts slightly so it doesn't look too jagged between months
    const smoothedData = [...data];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].isFuture) {
        const prev = data[i-1].expectedCount !== undefined ? data[i-1].expectedCount! : data[i-1].count;
        const curr = data[i].expectedCount!;
        const next = data[i+1].expectedCount !== undefined ? data[i+1].expectedCount! : curr;
        smoothedData[i] = { ...data[i], expectedCount: (prev + curr + next) / 3 };
      }
    }
    
    // Final pass: Expected count can never be lower than the actual booked count
    smoothedData.forEach(d => {
      if (d.isFuture && d.expectedCount !== undefined) {
        d.expectedCount = Math.max(d.expectedCount, d.count);
      }
    });

    return smoothedData;
  }, [statsJobs, statsHistoricalJobs, today, selectedOwner, theme.brandGreen]);

  const locationBreakdown = useMemo(() => {
    let studioCount = 0;
    let locationCount = 0;
    let frontOfHouseCount = 0;
    let nbCount = 0;

    if (Array.isArray(jobs)) {
      jobs.forEach(job => {
        if (isJobNB(job)) {
          nbCount++;
        } else {
          const props = job.all_properties || {};
          const cat = categorizeLocation(getJobLocationStr(props));
          if (cat === 'foh') frontOfHouseCount++;
          else if (cat === 'location') locationCount++;
          else if (cat === 'studio') studioCount++;
        }
      });
    }
    return { studioCount, locationCount, frontOfHouseCount, nbCount };
  }, [jobs, isJobNB]);

  const handleLocationCategoryClick = useCallback((category: 'studio' | 'location' | 'foh' | 'nb') => {
    // Clear other filters first for a clean state
    if (setSelectedOwner) setSelectedOwner("all");
    if (setSearchTerm) setSearchTerm("");
    
    if (category === 'nb') {
      if (setSelectedLocations) setSelectedLocations([]);
      if (setShowNBOnly) setShowNBOnly(true);
      return;
    }

    if (!setSelectedLocations || !uniqueLocations) return;
    
    let keywords: string[] = [];
    if (category === 'studio') {
      keywords = ["maleri", "objekt", "gjenstand", "reprorom", "kunst på papir", "digitalisering"];
    } else if (category === 'location') {
      keywords = ["location", "ute"];
    } else if (category === 'foh') {
      keywords = ["front of house"];
    }

    const matched = uniqueLocations.filter(loc => 
      keywords.some(kw => loc.toLowerCase().includes(kw))
    );
    
    setSelectedLocations(matched);
    if (setShowNBOnly) setShowNBOnly(false);
  }, [setSelectedLocations, uniqueLocations, setShowNBOnly, setSelectedOwner, setSearchTerm]);

  const workload = useMemo(() => {
    const endOf14Days = new Date(today);
    endOf14Days.setDate(today.getDate() + 14);
    
    const counts: Record<string, { total: number, overdue: number, locations: Record<string, number> }> = {};
    if (Array.isArray(statsJobs)) {
      statsJobs.forEach(job => {
        const props = job.all_properties || {};
        const deadlineStr = getJobDeadlineStr(props, job);
        const deadline = parseDate(deadlineStr);
        if (deadline && deadline <= endOf14Days) {
          const isOverdue = deadline < today;
          const owner = job.owner_names?.[0] || "Ufordelt";
          const rawLoc = (getJobLocationStr(props)).toLowerCase();
          
          let locCategory = "Annet";
          if (rawLoc.includes("front of house")) {
            locCategory = "Front of House";
          } else if (rawLoc.includes("location") || rawLoc.includes("ute")) {
            locCategory = "Ekstern Location";
          } else if (rawLoc.includes("maleri") || rawLoc.includes("objekt") || rawLoc.includes("gjenstand") || rawLoc.includes("reprorom") || rawLoc.includes("kunst på papir") || rawLoc.includes("digitalisering")) {
            locCategory = "Studio & Digitalisering";
          }

          if (!counts[owner]) {
            counts[owner] = { total: 0, overdue: 0, locations: {} };
          }
          counts[owner].total++;
          if (isOverdue) {
            counts[owner].overdue++;
          }
          counts[owner].locations[locCategory] = (counts[owner].locations[locCategory] || 0) + 1;
        }
      });
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5);
  }, [statsJobs, today]);

  const [aiRecommendations, setAiRecommendations] = useState<Record<string, { name: string, reasons: string[] }>>({});
  const fetchingRefs = useRef<Set<string>>(new Set());
  const [isFetchingAI, setIsFetchingAI] = useState<Record<string, boolean>>({});

  const handleFetchAIRecommendation = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (aiRecommendations[job.id] || isFetchingAI[job.id]) return;

    setIsFetchingAI(prev => ({ ...prev, [job.id]: true }));
    try {
      const rec = await getAIRecommendationForJob(job, workload);
      if (rec) {
        setAiRecommendations(prev => ({ ...prev, [job.id]: rec }));
      }
    } finally {
      setIsFetchingAI(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const title = selectedOwner && selectedOwner !== "all" 
    ? `Oversikt for ${selectedOwner}`
    : "Oversikt for Seksjon Foto";

  if (loading) {
    return (
      <div className="p-6 md:p-10 w-full max-w-[1600px] mx-auto space-y-10 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-10 rounded w-64 mb-2 bg-stone-200"></div>
            <div className="h-4 rounded w-48 bg-stone-200"></div>
          </div>
          <div className="text-right">
            <div className="h-3 rounded w-24 ml-auto mb-1 bg-stone-200"></div>
            <div className="h-6 rounded w-32 ml-auto bg-stone-200"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-stone-200"></div>)}
        </div>
        <div className="h-64 rounded-2xl bg-stone-200"></div>
      </div>
    );
  }

  const cardDensity = theme.cardSettings?.cardDensity || 'comfortable';
  const paddingClass = cardDensity === 'compact' ? 'p-3' : cardDensity === 'spacious' ? 'p-6' : 'p-4';
  const gapClass = cardDensity === 'compact' ? 'gap-2' : cardDensity === 'spacious' ? 'gap-4' : 'gap-3';

  return (
    <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto space-y-10 min-h-screen transition-colors duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl md:text-4xl font-serif font-medium text-stone-900">{title}</h2>
          <p className="text-stone-400 mt-2">Her er status for fotooppdragene i dag.</p>
          
          {/* Search & Filters */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-stone-400" />
              <input
                type="text"
                placeholder="Søk i alle oppdrag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm?.(e.target.value)}
                className="
                  w-full pl-11 pr-10 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2
                  bg-stone-100 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-stone-900/10 shadow-sm
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
              {/* Owner Filter */}
              <div className="relative">
                <select
                  value={selectedOwner || "all"}
                  onChange={(e) => setSelectedOwner?.(e.target.value)}
                  className="hidden md:block px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-sm"
                >
                  <option value="all">Alle Fotografer</option>
                  {uniqueOwners.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowOwnerSheet(true)}
                  className="md:hidden px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-900 shadow-sm whitespace-nowrap"
                >
                  {selectedOwner && selectedOwner !== 'all' ? selectedOwner : 'Alle Fotografer'}
                </button>
              </div>

              {/* Location Filter */}
              <div className="relative">
                <select
                  value={selectedLocations[0] || "all"}
                  onChange={(e) => setSelectedLocations?.(e.target.value === "all" ? [] : [e.target.value])}
                  className="hidden md:block px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 shadow-sm"
                >
                  <option value="all">Alle lokasjoner</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowLocationSheet(true)}
                  className="md:hidden px-4 py-3 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-900 shadow-sm whitespace-nowrap"
                >
                  {selectedLocations.length > 0 ? selectedLocations[0] : 'Alle lokasjoner'}
                </button>
              </div>

              {/* NB Filter */}
              <div className="flex items-center gap-2 px-4 py-3 border border-stone-200 rounded-xl bg-stone-100 shadow-sm">
                <input
                  type="checkbox"
                  id="dashboard-nb-filter"
                  checked={showNBOnly}
                  onChange={(e) => setShowNBOnly?.(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/10 cursor-pointer"
                />
                <label 
                  htmlFor="dashboard-nb-filter" 
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-900 cursor-pointer select-none"
                >
                  Nasjonalbiblioteket
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Dagens dato</p>
            <p className="text-lg font-medium text-stone-900">
              {new Date().toLocaleDateString("nb-NO", { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          {/* Refresh & Clear Buttons */}
          <div className="flex items-center gap-2">
            {clearFilters && hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-red-50 text-red-600 hover:bg-red-100"
              >
                Tøm filtre
              </button>
            )}
            
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200"
              >
                <RefreshCw className="w-3 h-3" />
                Oppdater data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <DashboardStats 
        jobs={statsJobs} 
        todayEventsCount={todayEvents.length} 
        onNavigateToBrowse={onNavigateToBrowse}
      />

      {/* Trend Overview (Full Width) */}
      <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-stone-400">Frist-oversikt</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-600">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">Denne uken</p>
                  <p className="text-[10px] text-stone-400">Totalt antall frister</p>
                </div>
              </div>
              <span className="text-xl font-serif font-medium text-stone-900">{weekStats.thisWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-stone-50 text-stone-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">Neste uke</p>
                  <p className="text-[10px] text-stone-400">Kommende frister</p>
                </div>
              </div>
              <span className="text-xl font-serif font-medium text-stone-900">{weekStats.nextWeek}</span>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Trend (Siste 6 mnd + 2 mnd)</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.brandGreen }}></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Historikk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Kommende</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Forventet</span>
                </div>
              </div>
            </div>
            <div className="w-full">
              <TrendChart data={trendData} color={theme.brandGreen} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sheets - Mobile View */}
      <div className="md:hidden">
        <AnimatePresence>
          {/* Owner Sheet */}
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
                    <button
                      onClick={() => {
                        setSelectedOwner?.('all');
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
                          setSelectedOwner?.(owner);
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

          {/* Location Sheet */}
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
                className="fixed bottom-0 left-0 right-0 bg-stone-50 z-50 rounded-t-[32px] shadow-2xl flex flex-col max-h-[70vh]"
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
                    <button
                      onClick={() => {
                        setSelectedLocations?.([]);
                        setShowLocationSheet(false);
                      }}
                      className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${
                        selectedLocations.length === 0 
                          ? 'bg-stone-900 text-white' 
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Alle lokasjoner
                    </button>
                    {uniqueLocations.map(loc => (
                      <button
                        key={loc}
                        onClick={() => {
                          setSelectedLocations?.([loc]);
                          setShowLocationSheet(false);
                        }}
                        className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-colors ${
                          selectedLocations.includes(loc) 
                            ? 'bg-stone-900 text-white' 
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="xl:col-span-2 space-y-8">
          {showNBOnly ? (
            <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm border-t-4" style={{ borderTopColor: '#7a68a8' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Library className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">Nasjonalbiblioteket</h3>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{visibleJobs.length} oppdrag sendes til NB</p>
                  </div>
                </div>
              </div>
              <JobTable
                jobs={visibleJobs}
                onSelectJob={onSelectJob}
                title=""
              />
            </section>
          ) : (
            <>
              {/* Dagens fokus */}
          <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Dagens fokus</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-stone-100 text-stone-500">
                {todayEvents.length} oppdrag i dag
              </span>
            </div>
            <JobTable
              jobs={todayEvents}
              onSelectJob={onSelectJob}
              title=""
            />
          </section>

          {/* Forfaller denne uken */}
          <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Forfaller denne uken</h3>
              <button 
                onClick={() => onNavigateToBrowse?.('next7')}
                className="text-[10px] font-bold uppercase tracking-widest hover:underline text-stone-500"
              >
                Se alle
              </button>
            </div>
            
            {thisWeekJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {thisWeekJobs.map(job => (
                  <DashboardJobCard
                    key={job.id}
                    job={job}
                    onSelectJob={onSelectJob}
                    variant="weekly"
                    nmDataMap={nmDataMap}
                    dimuDataMap={dimuDataMap}
                    setPreviewImage={setPreviewImage}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 text-sm border-2 border-dashed rounded-2xl border-stone-100">
                Ingen flere frister denne uken.
              </div>
            )}
          </section>

          {/* Jobber til fordeling */}
          <section className="p-6 rounded-2xl border bg-stone-100 border-stone-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-stone-400">Jobber til fordeling</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {distributionJobs.length > 0 ? distributionJobs.map(job => (
                <DashboardJobCard
                  key={job.id}
                  job={job}
                  onSelectJob={onSelectJob}
                  variant="distribution"
                  aiRecommendation={aiRecommendations[job.id]}
                  isFetchingAI={!aiRecommendations[job.id] && fetchingRefs.current.has(job.id)}
                  onFetchAI={handleFetchAIRecommendation}
                />
              )) : (
                <div className="col-span-full p-8 text-center text-stone-400 text-sm border-2 border-dashed rounded-2xl border-stone-100">
                  Ingen jobber til fordeling akkurat nå.
                </div>
              )}
            </div>
          </section>
            </>
          )}
        </div>

        {/* Sidebar Column */}
        <WorkloadSidebar
          workload={workload}
          locationBreakdown={locationBreakdown}
          onLocationClick={handleLocationCategoryClick}
        />
      </div>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        url={previewImage?.url || ""}
        title={previewImage?.title || ""}
      />
    </div>
  );
};
