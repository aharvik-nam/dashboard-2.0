import React, { useState, useMemo } from "react";
import { Job } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, LayoutGrid, List, User } from "lucide-react";
import { getJobDate, splitTitle, getLocationIndex, getPaletteColor, shortenLocation, getBadgeStyle } from "../utils/jobUtils";
import { getWeekNumber } from "../utils/dateUtils";
import { useTheme } from "../context/ThemeContext";
import { useJobData } from "../context/JobDataContext";

interface CalendarViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  selectedOwner?: string;
  setSelectedOwner?: (owner: string) => void;
  uniqueOwners?: string[];
  loading?: boolean;
  clearFilters?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  onSelectJob,
  selectedOwner,
  setSelectedOwner,
  uniqueOwners = [],
  loading = false,
  clearFilters
}) => {
  const { jobOverrides } = useJobData();
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const badgeStyle = theme.cardSettings?.badgeStyle || 'solid';
  const applyBadgeStyle = (colorVar: string) => getBadgeStyle(badgeStyle, colorVar);

  const monthNames = [
    "Januar", "Februar", "Mars", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Desember"
  ];

  const title = selectedOwner && selectedOwner !== "all" 
    ? `Kalender for ${selectedOwner}`
    : "Kalender";

  const nextPeriod = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const prevPeriod = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const calendarData = useMemo(() => {
    const days = [];
    
    // Week view
    const startOfWeek = getStartOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({ 
        day: date.getDate(), 
        date: date, 
        currentMonth: date.getMonth() === currentDate.getMonth(), 
        jobs: [] 
      });
    }

    // Populate jobs
    return days.map(dayObj => {
      const dayJobs = jobs.filter(job => {
        const jobDateStr = getJobDate(job);
        if (!jobDateStr) return false;
        const jobDate = new Date(jobDateStr);
        jobDate.setHours(0, 0, 0, 0);
        const cellDate = new Date(dayObj.date);
        cellDate.setHours(0, 0, 0, 0);
        return jobDate.getTime() === cellDate.getTime();
      });
      return { ...dayObj, jobs: dayJobs };
    });

  }, [currentDate, jobs]);

  const headerTitle = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = monthNames[startOfWeek.getMonth()];
    const endMonth = monthNames[endOfWeek.getMonth()];
    
    if (startMonth === endMonth) {
      return `Uke ${getWeekNumber(startOfWeek)}: ${startMonth} ${startOfWeek.getFullYear()}`;
    } else {
      return `Uke ${getWeekNumber(startOfWeek)}: ${startMonth} - ${endMonth} ${endOfWeek.getFullYear()}`;
    }
  }, [currentDate]);

  if (loading) {
    return (
      <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto min-h-full flex flex-col animate-pulse">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 bg-stone-200 rounded w-64"></div>
            <div className="h-10 bg-stone-200 rounded-lg w-32"></div>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex-auto flex flex-col">
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
            {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="py-3 h-10"></div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 grid-rows-1 bg-stone-100 gap-px">
            {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="bg-white min-h-[120px] p-2"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto min-h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-serif font-black capitalize text-stone-900">
            {headerTitle}
          </h2>
          <div className="flex items-center rounded-lg shadow-sm border bg-white border-stone-200">
            <button onClick={prevPeriod} className="p-2 transition-colors border-r hover:bg-stone-50 text-stone-600 border-stone-200">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToToday} className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors text-stone-600 hover:bg-stone-50">
              I dag
            </button>
            <button onClick={nextPeriod} className="p-2 transition-colors border-l hover:bg-stone-50 text-stone-600 border-stone-200">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photographer Filter */}
        <div className="flex items-center gap-3">
          {setSelectedOwner && uniqueOwners.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-stone-400" />
              <select
                value={selectedOwner || "all"}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              >
                <option value="all">Alle fotografer</option>
                {uniqueOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
          )}
          
          {clearFilters && selectedOwner && selectedOwner !== "all" && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
            >
              Tøm filtre
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-2xl shadow-sm overflow-hidden flex-auto flex flex-col bg-white border-stone-200">
        {/* Desktop View */}
        <div className="hidden md:flex flex-col flex-auto">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-stone-50 border-stone-200">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 flex-1 gap-px min-h-[600px] bg-stone-100">
            {calendarData.map((cell, index) => {
              const isToday = cell.date && 
                cell.date.getDate() === new Date().getDate() && 
                cell.date.getMonth() === new Date().getMonth() && 
                cell.date.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={index} 
                  className={`min-w-0 p-2 flex flex-col gap-1 transition-colors ${
                    cell.currentMonth ? 'bg-white hover:bg-stone-50' : 'bg-stone-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-stone-900 text-white' 
                        : (!cell.currentMonth ? 'text-stone-300' : 'text-stone-400')
                    }`}>
                      {cell.day}
                    </span>
                    {cell.jobs.length > 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-stone-400">
                        {cell.jobs.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {cell.jobs.map(job => {
                      const { name } = splitTitle(job.title);
                      const props = job.all_properties || {};
                      const loc = shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "");
                      const locIndex = getLocationIndex(loc);
                      const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
                      
                      return (
                        <button
                          key={job.id}
                          onClick={() => onSelectJob(job)}
                          className="text-left border transition-all group w-full flex flex-col gap-1 p-2 rounded bg-stone-50 hover:bg-stone-100 border-stone-100 relative"
                          style={{
                            borderTop: `3px solid ${locBg}`
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            {loc && (
                              <span 
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider truncate w-fit max-w-full"
                                style={{ ...applyBadgeStyle(locBg), color: locText }}
                              >
                                {loc}
                              </span>
                            )}
                            {jobOverrides[job.id]?.sendToNB && (
                              <span 
                                className="text-white text-[7px] px-1 py-0.5 rounded font-black leading-none shrink-0"
                                style={{ backgroundColor: theme.statusNB }}
                              >
                                NB
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold truncate leading-tight transition-colors text-stone-700 group-hover:text-stone-900">
                            {name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View - Vertical Stack */}
        <div className="md:hidden flex flex-col divide-y divide-stone-200">
          {calendarData.map((cell, index) => {
            const isToday = cell.date && 
              cell.date.getDate() === new Date().getDate() && 
              cell.date.getMonth() === new Date().getMonth() && 
              cell.date.getFullYear() === new Date().getFullYear();
            
            const dayName = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][cell.date.getDay()];

            return (
              <div key={index} className={`p-4 flex flex-col gap-3 ${isToday ? 'bg-stone-50/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-serif font-black ${isToday ? 'text-indigo-600' : 'text-stone-900'}`}>
                      {dayName} {cell.day}.
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-900 text-white">
                        I dag
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    {cell.jobs.length} oppdrag
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {cell.jobs.length > 0 ? (
                    cell.jobs.map(job => {
                      const { name } = splitTitle(job.title);
                      const props = job.all_properties || {};
                      const loc = shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "");
                      const locIndex = getLocationIndex(loc);
                      const { bg: locBg, text: locText } = getPaletteColor(theme.locationPalette, locIndex);
                      
                      return (
                        <button
                          key={job.id}
                          onClick={() => onSelectJob(job)}
                          className="text-left border transition-all group w-full flex flex-col gap-1 p-3 rounded-xl bg-white hover:bg-stone-50 border-stone-200 relative"
                          style={{
                            borderLeft: `4px solid ${locBg}`
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <p className="text-sm font-bold truncate transition-colors text-stone-900 group-hover:text-stone-900">
                                {name}
                              </p>
                              {jobOverrides[job.id]?.sendToNB && (
                                <span 
                                  className="text-white text-[8px] px-1.5 py-0.5 rounded font-black leading-none shrink-0"
                                  style={{ backgroundColor: theme.statusNB }}
                                >
                                  NB
                                </span>
                              )}
                            </div>
                            {loc && (
                              <span 
                                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider truncate shrink-0"
                                style={{ ...applyBadgeStyle(locBg), color: locText }}
                              >
                                {loc}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs italic text-stone-400">Ingen oppdrag</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
