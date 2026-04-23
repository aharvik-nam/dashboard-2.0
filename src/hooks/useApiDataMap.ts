import { useQueries } from '@tanstack/react-query';

interface UseApiDataMapOptions {
  enabled?: boolean;
  staleTime?: number;
  queryKeyPrefix: string;
}

/**
 * Generic hook: fire parallel queries for a list of IDs and collect results
 * into a Record<id, T>. Pass pre-normalised IDs — callers handle normalisation.
 */
export function useApiDataMap<T>(
  ids: string[],
  fetcher: (id: string) => Promise<T>,
  { enabled = false, staleTime = 1000 * 60 * 60, queryKeyPrefix }: UseApiDataMapOptions
): { dataMap: Record<string, T>; loading: boolean } {
  const queries = useQueries({
    queries: ids.map(id => ({
      queryKey: [queryKeyPrefix, id],
      queryFn: () => fetcher(id),
      enabled: enabled && !!id,
      staleTime,
    })),
  });

  const dataMap: Record<string, T> = {};
  let loading = false;

  queries.forEach((query, index) => {
    const id = ids[index];
    if (query.data !== undefined) {
      dataMap[id] = query.data as T;
    }
    if (query.isLoading) loading = true;
  });

  return { dataMap, loading };
}
