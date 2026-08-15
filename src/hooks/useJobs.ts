import { useState, useEffect, useCallback, useRef } from 'react';
import { JobOffer } from '../components/JobCard';

export interface UseJobsParams {
  keywords?: string;
  location?: string;
  remoteOnly?: boolean;
  portal?: string;
  seniority?: string;
}

export interface UseJobsResult {
  jobs: JobOffer[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// In-memory request cache
const jobsCache = new Map<string, JobOffer[]>();

export const useJobs = (params: UseJobsParams = {}): UseJobsResult => {
  const { keywords = '', location = 'Wszystkie', remoteOnly = false, portal = 'Wszystkie', seniority = 'Wszystkie' } = params;

  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${keywords}_${location}_${remoteOnly}_${portal}_${seniority}`;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchJobs = useCallback(async (bypassCache = false) => {
    // Check cache
    if (!bypassCache && jobsCache.has(cacheKey)) {
      setJobs(jobsCache.get(cacheKey)!);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (keywords) searchParams.append('keywords', keywords);
      if (location && location !== 'Wszystkie') searchParams.append('location', location);
      if (remoteOnly) searchParams.append('remoteOnly', 'true');
      if (portal && portal !== 'Wszystkie') searchParams.append('portal', portal);
      if (seniority && seniority !== 'Wszystkie') searchParams.append('seniority', seniority);

      const response = await fetch(`/api/jobs?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Błąd serwera (${response.status})`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.jobs)) {
        jobsCache.set(cacheKey, data.jobs);
        if (isMountedRef.current) {
          setJobs(data.jobs);
        }
      } else {
        throw new Error(data.error || 'Nieprawidłowa odpowiedź serwera');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Wystąpił problem z pobieraniem ofert.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, keywords, location, remoteOnly, portal, seniority]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const refetch = useCallback(() => fetchJobs(true), [fetchJobs]);

  return { jobs, isLoading, error, refetch };
};
