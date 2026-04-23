import React, { useState, useEffect, useMemo, useRef } from "react";
import { Camera, RefreshCw, Filter, Calendar, ArrowLeft, LayoutGrid, List as ListIcon, Settings, Search, LayoutDashboard, FolderOpen, Archive, Moon, Sun } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Job } from "./types";
import { JobDetails } from "./components/JobDetails";
import { Dashboard } from "./components/Dashboard";
import { ArchiveView } from "./components/ArchiveView";
import { BrowseView } from "./components/BrowseView";
import { CalendarView } from "./components/CalendarView";
import { ThemeSettings } from "./components/ThemeSettings";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { JobDataProvider } from "./context/JobDataContext";
import { Toaster, toast } from "sonner";
import { useJobFilters } from "./hooks/useJobFilters";
import { useAllJobOverrides } from "./hooks/useAllJobOverrides";
import { useAllJobsProgress } from "./hooks/useJobProgress";
import { fetchJobs, fetchArchiveJobs, fetchJobDetails, fetchAllJobsFromFirebase, syncArchiveJobs } from "./services/jobService";
import { Login } from "./components/Login";

type MainView = "dashboard" | "browse" | "calendar" | "settings" | "archive";
type BrowseLayout = "list" | "grid";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('authToken');
  });

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, zoomIn, zoomOut, resetZoom, darkMode, toggleDarkMode } = useTheme();
  
  // Initialize state from URL if present
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      view: (params.get('view') as MainView) || "dashboard",
      job: params.get('job') || null
    };
  };

  const initialState = getInitialState();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialState.job);
  const [mainView, setMainView] = useState<MainView>(initialState.view);
  const [archiveTab, setArchiveTab] = useState<"list" | "stats">("list");
  const [browseLayout, setBrowseLayout] = useState<BrowseLayout>("grid");

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      setMainView(state.view);
      setSelectedJobId(state.job);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentView = params.get('view');
    const currentJob = params.get('job');

    if (currentView !== mainView || currentJob !== selectedJobId) {
      const newParams = new URLSearchParams();
      newParams.set('view', mainView);
      if (selectedJobId) {
        newParams.set('job', selectedJobId);
      }
      
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      
      // If it's the very first render and URL is empty, replace instead of push
      if (!currentView && !currentJob) {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }
    }
  }, [mainView, selectedJobId]);

  const { 
    data: jobs = [], 
    isLoading: loadingJobs, 
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const {
    data: archiveJobs = [],
    isLoading: loadingArchive,
    error: archiveError,
    refetch: refetchArchive
  } = useQuery({
    queryKey: ["archiveJobs"],
    queryFn: fetchArchiveJobs,
    enabled: mainView === "archive" && archiveTab === "list"
  });

  const {
    data: allHistoricalJobs = [],
  } = useQuery({
    queryKey: ["allHistoricalJobs"],
    queryFn: fetchAllJobsFromFirebase,
  });

  const queryClient = useQueryClient();
  const syncArchiveMutation = useMutation({
    mutationFn: syncArchiveJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archiveJobs"] });
      queryClient.invalidateQueries({ queryKey: ["allHistoricalJobs"] });
      toast.success("Arkivet er synkronisert med HubSpot");
    },
    onError: () => {
      toast.error("Kunne ikke synkronisere arkivet");
    }
  });

  const { overrides: jobOverrides } = useAllJobOverrides();
  const { progressMap: jobProgress } = useAllJobsProgress(jobs);

  // Automatically trigger a quick sync of recent archive jobs when navigating to the archive view
  const hasSyncedRecentRef = useRef(false);
  useEffect(() => {
    if (mainView === "archive" && !hasSyncedRecentRef.current) {
      hasSyncedRecentRef.current = true;
      syncArchiveMutation.mutate(true); // true = isRecent
    }
  }, [mainView, syncArchiveMutation]);

  const {
    data: selectedJobDetails,
    isLoading: loadingDetails,
  } = useQuery({
    queryKey: ["job", selectedJobId],
    queryFn: () => selectedJobId ? fetchJobDetails(selectedJobId) : null,
    enabled: !!selectedJobId,
  });

  const { 
    searchTerm,
    setSearchTerm,
    selectedOwner, 
    setSelectedOwner, 
    selectedLocations,
    setSelectedLocations,
    selectedTypes,
    setSelectedTypes,
    uniqueOwners, 
    uniqueLocations,
    uniqueTypes,
    filteredJobs,
    sortConfig,
    setSortConfig,
    handleSort,
    dateFilter,
    setDateFilter,
    selectedYear,
    setSelectedYear,
    uniqueYears,
    showNBOnly,
    setShowNBOnly,
    counts,
    locationCounts,
    typeCounts,
    clearFilters
  } = useJobFilters(mainView === "archive" ? archiveJobs : jobs, jobOverrides);

  // Combine basic job info with details if available
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    const jobsList = mainView === "archive" ? archiveJobs : jobs;
    const basicJob = Array.isArray(jobsList) ? jobsList.find(j => j.id === selectedJobId) : null;
    return selectedJobDetails || basicJob || null;
  }, [selectedJobId, selectedJobDetails, jobs, archiveJobs, mainView]);

  // Set default view for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMainView("dashboard");
        setBrowseLayout("grid");
        setSortConfig({ key: 'deadline', direction: 'asc' });
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefresh = () => {
    refetchJobs();
  };

  const handleSelectJob = React.useCallback((job: Job) => {
    setSelectedJobId(job.id);
  }, []);

  const handleBackToList = React.useCallback(() => {
    setSelectedJobId(null);
  }, []);

  return (
    <div 
      className="flex flex-col h-screen transition-colors duration-500 selection:bg-stone-200"
      style={{ 
        backgroundColor: theme.stone50,
        color: theme.textColorPrimary,
        fontFamily: theme.fontSans
      }}
    >
      <header 
        className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-0 md:h-16 shrink-0 z-10 shadow-sm gap-3 md:gap-0 transition-all duration-500 bg-header-bg border-b border-header-border"
      >
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSelectedJobId(null);
                setMainView("dashboard");
                setDateFilter("all");
              }}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <h1 className="text-sm font-serif font-black tracking-widest text-stone-900">NaMFOTO</h1>
              <p className="text-[10px] font-medium uppercase tracking-tight -mt-0.5 transition-colors text-stone-500">Fotooppdrag Dashboard</p>
            </button>
          </div>

          {/* View Toggles - Moved to Left */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center p-1 rounded-lg shrink-0 transition-colors bg-nav-bg border border-nav-border">
              <button
                onClick={() => {
                  setMainView("dashboard");
                  setSelectedJobId(null);
                  setDateFilter("all");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  mainView === "dashboard" && !selectedJob
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                OVERSIKT
              </button>
              <button
                onClick={() => {
                  setMainView("browse");
                  setSelectedJobId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  mainView === "browse" && !selectedJob
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                BESTILLINGER
              </button>
              <button
                onClick={() => {
                  setMainView("calendar");
                  setSelectedJobId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  mainView === "calendar" && !selectedJob
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                KALENDER
              </button>
              <button
                onClick={() => {
                  setMainView("settings");
                  setSelectedJobId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  mainView === "settings"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="Innstillinger"
              >
                <Settings className="w-3.5 h-3.5" />
                INNSTILLINGER
              </button>
              <button
                onClick={() => {
                  setMainView("archive");
                  setArchiveTab("list");
                  setSelectedJobId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  mainView === "archive" && !selectedJob
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                ARKIV
              </button>
            </div>
          </div>
          
          {/* Dark mode toggle — visible on all screen sizes */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors hover:bg-stone-200 text-stone-500 hover:text-stone-900 shrink-0"
            title={darkMode ? "Lys modus" : "Mørk modus"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => {
                setMainView("archive");
                setArchiveTab("list");
                setSelectedJobId(null);
              }}
              className={`p-2 rounded-full transition-colors hover:bg-stone-200 ${mainView === 'archive' ? 'text-stone-900 bg-stone-100' : 'text-stone-500 hover:text-stone-900'}`}
              title="Arkiv"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setMainView("settings");
                setSelectedJobId(null);
              }}
              className={`p-2 rounded-full transition-colors hover:bg-stone-200 text-stone-500 hover:text-stone-900`}
              title="Innstillinger"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Content Area - Job Details */}
        <JobDataProvider jobOverrides={jobOverrides} jobProgress={jobProgress}>
        <section
          className="flex-1 overflow-y-auto flex flex-col relative w-full"
          style={{ backgroundColor: theme.stone50 }}
        >
          {/* Mobile Back Button */}
          {selectedJob && (
            <div className="md:hidden p-3 border-b sticky top-0 z-40 flex items-center shadow-sm bg-white border-stone-200">
              <button 
                onClick={handleBackToList} 
                className="flex items-center gap-2 px-2 py-1 rounded-md active:bg-stone-100 text-stone-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-xs uppercase tracking-wider">Tilbake til listen</span>
              </button>
            </div>
          )}
          
          {selectedJob ? (
            <JobDetails 
              job={selectedJob} 
              loading={loadingDetails} 
              onBack={handleBackToList} 
              isArchive={mainView === "archive"}
            />
          ) : (jobsError || archiveError) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-stone-900">Kunne ikke laste oppdrag</h2>
              <p className="mb-6 max-w-md text-stone-500">
                Det oppstod en feil under henting av data fra serveren. Vennligst prøv igjen senere.
              </p>
              <button 
                onClick={() => mainView === 'archive' ? refetchArchive() : refetchJobs()}
                className="px-6 py-2 rounded-lg font-medium transition-colors bg-stone-900 text-white hover:bg-stone-800"
              >
                Prøv igjen
              </button>
            </div>
          ) : mainView === "dashboard" ? (
            <Dashboard 
              jobs={filteredJobs} 
              historicalJobs={allHistoricalJobs}
              onSelectJob={handleSelectJob} 
              selectedOwner={selectedOwner} 
              setSelectedOwner={setSelectedOwner}
              uniqueOwners={uniqueOwners}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              uniqueLocations={uniqueLocations}
              showNBOnly={showNBOnly}
              setShowNBOnly={setShowNBOnly}
              onNavigateToBrowse={(filter) => {
                setDateFilter(filter);
                setMainView("browse");
              }}
              loading={loadingJobs}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onRefresh={handleRefresh}
              clearFilters={clearFilters}
            />
          ) : mainView === "archive" ? (
            <ArchiveView 
              jobs={filteredJobs} 
              onSelectJob={handleSelectJob} 
              selectedOwner={selectedOwner} 
              setSelectedOwner={setSelectedOwner}
              uniqueOwners={uniqueOwners}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              uniqueLocations={uniqueLocations}
              showNBOnly={showNBOnly}
              setShowNBOnly={setShowNBOnly}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              uniqueYears={uniqueYears}
              loading={loadingArchive}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onRefresh={() => refetchArchive()}
              onSync={() => syncArchiveMutation.mutate(false)}
              isSyncing={syncArchiveMutation.isPending}
              archiveTab={archiveTab}
              setArchiveTab={setArchiveTab}
              clearFilters={clearFilters}
            />
          ) : mainView === "calendar" ? (
            <CalendarView 
              jobs={filteredJobs} 
              onSelectJob={handleSelectJob} 
              selectedOwner={selectedOwner} 
              setSelectedOwner={setSelectedOwner}
              uniqueOwners={uniqueOwners}
              loading={loadingJobs}
              clearFilters={clearFilters}
            />
          ) : mainView === "settings" ? (
            <ThemeSettings uniqueLocations={uniqueLocations} uniqueTypes={uniqueTypes} uniqueOwners={uniqueOwners} />
          ) : (
            <BrowseView 
              jobs={filteredJobs} 
              onSelectJob={handleSelectJob} 
              layout={browseLayout}
              setLayout={setBrowseLayout}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortConfig={sortConfig}
              handleSort={handleSort}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              counts={counts}
              selectedOwner={selectedOwner}
              setSelectedOwner={setSelectedOwner}
              uniqueOwners={uniqueOwners}
              selectedLocation={selectedLocations}
              setSelectedLocation={setSelectedLocations}
              uniqueLocations={uniqueLocations}
              locationCounts={locationCounts}
              selectedType={selectedTypes}
              setSelectedType={setSelectedTypes}
              uniqueTypes={uniqueTypes}
              typeCounts={typeCounts}
              showNBOnly={showNBOnly}
              setShowNBOnly={setShowNBOnly}
              loading={loadingJobs}
              clearFilters={clearFilters}
            />
          )}
        </section>
        </JobDataProvider>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
