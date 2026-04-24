import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
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
import { DopSidebar, DopMobileTabBar } from "./components/dop/DopSidebar";
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleNav = (view: MainView) => {
    setSelectedJobId(null);
    setMainView(view);
    if (view !== 'browse') setDateFilter('all');
  };

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-500 selection:bg-stone-200"
      style={{ backgroundColor: theme.stone50, color: theme.textColorPrimary, fontFamily: theme.fontSans }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <div className="hidden md:flex h-full">
        <DopSidebar
          activeView={selectedJobId ? mainView : mainView}
          onNav={handleNav}
          darkMode={darkMode}
          onToggleDark={toggleDarkMode}
          userName={uniqueOwners[0]}
        />
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <JobDataProvider jobOverrides={jobOverrides} jobProgress={jobProgress}>
          <section
            className="flex-1 overflow-y-auto flex flex-col relative w-full"
            style={{ backgroundColor: theme.stone50 }}
          >
            {/* Mobile Back Button */}
            {selectedJob && (
              <div className="md:hidden p-3 border-b sticky top-0 z-40 flex items-center shadow-sm" style={{ background: theme.stone50, borderColor: theme.stone200 }}>
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-2 px-2 py-1 rounded-md active:bg-stone-100"
                  style={{ color: theme.textColorPrimary }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-wider">Tilbake</span>
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
                <h2 className="text-xl font-medium mb-2" style={{ color: theme.textColorPrimary }}>Kunne ikke laste oppdrag</h2>
                <p className="mb-6 max-w-md" style={{ color: theme.textColorMuted }}>
                  Det oppstod en feil under henting av data fra serveren. Vennligst prøv igjen.
                </p>
                <button
                  onClick={() => mainView === 'archive' ? refetchArchive() : refetchJobs()}
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{ background: theme.stone900, color: theme.textColorInverted }}
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

        {/* ── Mobile bottom tab bar ──────────────────────────── */}
        <div className="md:hidden">
          <DopMobileTabBar activeView={mainView} onNav={handleNav} />
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
