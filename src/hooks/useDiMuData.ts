import { getDigitaltMuseumImageUrl } from '../services/dimuService';
import { useApiDataMap } from './useApiDataMap';

export const useDiMuData = (invNos: string[], enabled = false) => {
  const activeIds = enabled ? invNos.filter(id => !!id && id !== '-') : [];
  const { dataMap: dimuDataMap, loading } = useApiDataMap<string | null>(
    activeIds, getDigitaltMuseumImageUrl,
    { enabled, staleTime: 3_600_000, queryKeyPrefix: 'dimuImage' }
  );
  return { dimuDataMap, loading };
};
