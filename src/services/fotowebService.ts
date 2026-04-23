import axios from 'axios';

export interface FotoWebResult {
  id: string;
  filename: string;
  previewUrl: string | null;
  assetUrl: string;
  metadata: any;
}

export const fetchFotoWebData = async (invNr: string): Promise<FotoWebResult[]> => {
  if (!invNr) return [];
  
  try {
    const response = await axios.get(`/api/fotoweb/search`, {
      params: { q: invNr }
    });
    return response.data.results || [];
  } catch (error: any) {
    // Logg kun hvis det ikke er en forventet feil (f.eks. timeout eller 404/500 som vi håndterer i proxyen)
    if (error.response?.status !== 404) {
      console.warn(`Kunne ikke hente FotoWeb-data for ${invNr}:`, error.message);
    }
    return [];
  }
};
