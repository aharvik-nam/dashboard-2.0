import axios from 'axios';
import { normalizeInvNr } from '../utils/nmUtils';
import { NMObject } from '../types/nmTypes';

/**
 * Henter objektdata fra Nasjonalmuseets API via vår proxy.
 * @param nmId Inventarnummeret (f.eks. "NG.M.00467")
 * @returns Hele JSON-svaret fra API-et
 */
export async function fetchNMObject(nmId: string): Promise<NMObject> {
  try {
    const normalizedId = normalizeInvNr(nmId);
    const response = await axios.get<NMObject>(`/api/nm/object`, {
      params: { id: normalizedId }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Objekt ${nmId} ble ikke funnet i Nasjonalmuseets API (404).`);
    } else {
      console.error(`Teknisk feil ved oppslag av ${nmId}:`, error.message || error);
    }
    throw error;
  }
}
