import { fetchNMObject } from '../services/nmService';
import { NMObject } from '../types/nmTypes';
import { normalizeInvNr } from '../utils/nmUtils';
import { useApiDataMap } from './useApiDataMap';

export const useNMData = (ids: string[], enabled = false) => {
  const normalizedIds = enabled
    ? Array.from(new Set(ids.map(id => normalizeInvNr(id)).filter(Boolean)))
    : [];
  const { dataMap: nmDataMap, loading } = useApiDataMap<NMObject>(
    normalizedIds, fetchNMObject,
    { enabled, staleTime: 3_600_000, queryKeyPrefix: 'nmObject' }
  );
  return { nmDataMap, loading };
};
