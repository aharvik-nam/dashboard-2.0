import axios from 'axios';
import { Job } from '../types';

export async function fetchJobs(): Promise<Job[]> {
  const response = await axios.get<Job[]>("/api/photo/jobs");
  return response.data;
}

export async function fetchArchiveJobs(): Promise<Job[]> {
  const response = await axios.get<Job[]>("/api/photo/archive");
  return response.data;
}

export async function syncArchiveJobs(isRecent: boolean = false): Promise<Job[]> {
  const response = await axios.get<Job[]>(`/api/photo/archive/sync${isRecent ? '?recent=true' : ''}`);
  return response.data;
}

export async function fetchAllJobsFromFirebase(): Promise<Job[]> {
  const response = await axios.get<Job[]>("/api/photo/all-jobs");
  return response.data;
}

export async function fetchJobDetails(jobId: string): Promise<Job> {
  const response = await axios.get<Job>(`/api/photo/job/${jobId}`);
  return response.data;
}

export async function updateDealStage(dealId: string, dealstageId: string) {
  try {
    const response = await axios.patch(`/api/photo/job/${dealId}/stage`, {
      dealstage: dealstageId
    });
    return response.data;
  } catch (error) {
    console.error(`Feil ved oppdatering av deal ${dealId}:`, error);
    throw error;
  }
}
