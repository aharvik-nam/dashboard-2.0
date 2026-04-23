import React, { createContext, useContext } from "react";
import { JobOverride } from "../hooks/useAllJobOverrides";

export interface JobProgress {
  doneCount: number;
  totalCount: number;
}

interface JobDataContextValue {
  jobOverrides: Record<string, JobOverride>;
  jobProgress: Record<string, JobProgress>;
}

const JobDataContext = createContext<JobDataContextValue>({
  jobOverrides: {},
  jobProgress: {},
});

interface JobDataProviderProps extends JobDataContextValue {
  children: React.ReactNode;
}

export const JobDataProvider: React.FC<JobDataProviderProps> = ({
  jobOverrides,
  jobProgress,
  children,
}) => (
  <JobDataContext.Provider value={{ jobOverrides, jobProgress }}>
    {children}
  </JobDataContext.Provider>
);

export const useJobData = () => useContext(JobDataContext);
