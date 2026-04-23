import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { TextDecoder } from 'util';

const NM_API_KEY = process.env.NM_API_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing nmId parameter' });
  }

  if (!NM_API_KEY) {
    return res.status(500).json({ error: 'Nasjonalmuseet API key is not configured' });
  }

  const nmId = id as string;

  const fetchWithId = async (targetId: string) => {
    const response = await axios.get(`https://api.nasjonalmuseet.no/api/objects/${encodeURIComponent(targetId)}`, {
      params: { 
        format: "json", 
        lang: "no",
        api_key: NM_API_KEY
      },
      responseType: 'arraybuffer'
    });
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(response.data);
    return JSON.parse(jsonString);
  };

  try {
    try {
      // 1. Forsøk direkte oppslag på ID
      const data = await fetchWithId(nmId);
      return res.status(200).json(data);
    } catch (error: any) {
      // Hvis direkte oppslag feiler med 404, og IDen slutter på en bokstav, 
      // prøv å bytte case på den siste bokstaven (f.eks. A -> a)
      if (error.response?.status === 404 && /[a-zA-Z]$/.test(nmId)) {
        const lastChar = nmId.slice(-1);
        const toggledLastChar = lastChar === lastChar.toUpperCase() ? lastChar.toLowerCase() : lastChar.toUpperCase();
        const toggledId = nmId.slice(0, -1) + toggledLastChar;
        
        try {
          console.log(`Direkte oppslag feilet for ${nmId}, prøver med endret case: ${toggledId}`);
          const data = await fetchWithId(toggledId);
          return res.status(200).json(data);
        } catch (innerError) {
          throw error;
        }
      }
      throw error;
    }
  } catch (error: any) {
    // Hvis direkte oppslag feiler, prøv søk som fallback
    if (error.response?.status === 404) {
      try {
        const searchResponse = await axios.get(`https://api.nasjonalmuseet.no/api/objects/search`, {
          params: { 
            q: nmId,
            format: "json", 
            lang: "no",
            limit: 1,
            api_key: NM_API_KEY
          },
          responseType: 'arraybuffer'
        });

        const searchDecoder = new TextDecoder('utf-8');
        const searchJsonString = searchDecoder.decode(searchResponse.data);
        const searchData = JSON.parse(searchJsonString);

        if (searchData && searchData.items && searchData.items.length > 0) {
          // Returner det første treffet
          return res.status(200).json(searchData.items[0]);
        }
      } catch (searchError: any) {
        console.error(`Nasjonalmuseet Search Error for ${nmId}:`, searchError.message);
      }
      
      return res.status(404).json({ error: 'Fant ikke objekt med dette nmId' });
    }
    
    console.error(`Nasjonalmuseet API Error for ID ${nmId}:`, error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ 
      error: 'Det oppstod en feil ved henting av data fra Nasjonalmuseet' 
    });
  }
}
