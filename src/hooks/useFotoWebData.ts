import { fetchFotoWebData, FotoWebResult } from '../services/fotowebService';
import { normalizeInvNr } from '../utils/nmUtils';
import { useApiDataMap } from './useApiDataMap';

export const useFotoWebData = (ids: string[], enabled = false) => {
  const normalizedIds = enabled
    ? Array.from(new Set(ids.map(id => normalizeInvNr(id)).filter(Boolean)))
    : [];
  const { dataMap: fotowebDataMap, loading } = useApiDataMap<FotoWebResult[]>(
    normalizedIds, fetchFotoWebData,
    { enabled, staleTime: 1_800_000, queryKeyPrefix: 'fotowebData' }
  );
  return { fotowebDataMap, loading };
};
