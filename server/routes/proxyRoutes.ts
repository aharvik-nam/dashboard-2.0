import express from "express";
import axios from "axios";
import { DIMU_API_KEY, NM_API_KEY } from "../config/constants.js";

const router = express.Router();

// Nasjonalmuseet API Proxy
router.get("/nm/object", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing nmId" });
  if (!NM_API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  const nmId = id as string;

  const fetchWithId = async (targetId: string) => {
    console.log(`🔍 Prøver direkte oppslag for: ${targetId}`);
    const response = await axios.get(`https://api.nasjonalmuseet.no/api/objects/${encodeURIComponent(targetId)}`, {
      params: { 
        format: "json", 
        lang: "no",
        api_key: NM_API_KEY
      },
      responseType: 'arraybuffer',
      timeout: 10000 // 10 sekunder timeout
    });
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(response.data);
    return JSON.parse(jsonString);
  };

  try {
    try {
      const data = await fetchWithId(nmId);
      return res.json(data);
    } catch (error: any) {
      // Hvis 404 og inneholder kolon (f.eks. NMK.LAAN.2026.0033:1), prøv å fjerne delen etter kolon
      if (error.response?.status === 404 && nmId.includes(':')) {
        const baseId = nmId.split(':')[0];
        console.log(`ℹ️ 404 for ${nmId}, prøver uten del-nummer: ${baseId}`);
        try {
          const data = await fetchWithId(baseId);
          return res.json(data);
        } catch (innerError) {
          // Fortsett
        }
      }

      // Hvis 404, prøv med togglet case på siste tegn (for serier som NAMT)
      if (error.response?.status === 404 && /[a-zA-Z]$/.test(nmId)) {
        const lastChar = nmId.slice(-1);
        const toggledLastChar = lastChar === lastChar.toUpperCase() ? lastChar.toLowerCase() : lastChar.toUpperCase();
        const toggledId = nmId.slice(0, -1) + toggledLastChar;
        
        console.log(`ℹ️ 404 for ${nmId}, prøver med togglet case: ${toggledId}`);
        try {
          const data = await fetchWithId(toggledId);
          return res.json(data);
        } catch (innerError) {
          // Fortsett
        }
      }
      
      // Hvis 404 og inneholder punktum, prøv å erstatte med bindestrek (noen ganger brukt i URL)
      if (error.response?.status === 404 && nmId.includes('.')) {
        const hyphenatedId = nmId.replace(/\./g, '-');
        console.log(`ℹ️ 404 for ${nmId}, prøver med bindestreker: ${hyphenatedId}`);
        try {
          const data = await fetchWithId(hyphenatedId);
          return res.json(data);
        } catch (innerError) {
          // Fortsett
        }

        // Prøv også å fjerne ledende nuller i det siste segmentet (f.eks. NG.M.00939 -> NG.M.939)
        const parts = nmId.split('.');
        const lastPart = parts[parts.length - 1];
        if (/^0+/.test(lastPart)) {
          const strippedLastPart = lastPart.replace(/^0+/, '');
          const strippedId = [...parts.slice(0, -1), strippedLastPart].join('.');
          console.log(`ℹ️ 404 for ${nmId}, prøver uten ledende nuller: ${strippedId}`);
          try {
            const data = await fetchWithId(strippedId);
            return res.json(data);
          } catch (innerError) {
            // Fortsett
          }
        }
      }

      // Hvis fortsatt 404, prøv søk med inventory_number parameter
      if (error.response?.status === 404) {
        console.log(`ℹ️ Fant ikke ${nmId} direkte, prøver søk med inventory_number...`);
        try {
          const searchResponse = await axios.get(`https://api.nasjonalmuseet.no/api/objects/search`, {
            params: { 
              inventory_number: nmId,
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
            console.log(`✅ Fant match via inventory_number søk for ${nmId}`);
            return res.json(searchData.items[0]);
          }
        } catch (searchError: any) {
          if (searchError.response?.status !== 404) {
            console.warn(`⚠️ Søk med inventory_number feilet for ${nmId}:`, searchError.message);
          }
        }
      }

      throw error;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`ℹ️ Fant ikke ${nmId} via inventory_number, prøver generelt søk...`);
      try {
        // Prøv søk med eksakt match først (i anførselstegn)
        const searchResponse = await axios.get(`https://api.nasjonalmuseet.no/api/objects/search`, {
          params: { 
            q: `"${nmId}"`,
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
          console.log(`✅ Fant match via q-søk for ${nmId}`);
          return res.json(searchData.items[0]);
        }

        // Hvis søk med anførselstegn feilet, prøv uten
        const searchResponse2 = await axios.get(`https://api.nasjonalmuseet.no/api/objects/search`, {
          params: { 
            q: nmId,
            format: "json", 
            lang: "no",
            limit: 1,
            api_key: NM_API_KEY
          },
          responseType: 'arraybuffer'
        });

        const searchJsonString2 = searchDecoder.decode(searchResponse2.data);
        const searchData2 = JSON.parse(searchJsonString2);

        if (searchData2 && searchData2.items && searchData2.items.length > 0) {
          console.log(`✅ Fant match via åpent søk for ${nmId}`);
          return res.json(searchData2.items[0]);
        }
      } catch (searchError: any) {
        if (searchError.response?.status !== 404) {
          console.error(`❌ Søk feilet for ${nmId}:`, searchError.message);
        }
      }
      return res.status(404).json({ error: `Fant ikke objekt med ID ${nmId} i Nasjonalmuseets samling.` });
    } else {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      if (status !== 404) {
        console.error(`❌ Feil ved henting av NM-objekt ${nmId} (Status ${status}):`, message);
      }
      return res.status(status).json({ 
        error: "Feil ved henting av data fra Nasjonalmuseet",
        details: message,
        status
      });
    }
  }
});

// Digitalt Museum API Proxy
router.get("/dimu/search", async (req, res) => {
  const { invno, ownerFilter } = req.query;
  if (!invno) return res.status(400).json({ error: "Missing invno" });
  if (!DIMU_API_KEY) {
    return res.status(500).json({ error: "DiMu API key missing" });
  }

  const url = new URL("https://api.dimu.org/api/solr/select");
  url.searchParams.set("q", "*");
  url.searchParams.set("wt", "json");
  url.searchParams.set("rows", "1");
  url.searchParams.set("api.key", DIMU_API_KEY);
  url.searchParams.append("fq", `identifier.id:${invno}`);

  const owner = (ownerFilter as string) || "NMK*";
  if (owner.includes("identifier.owner")) {
    url.searchParams.append("fq", owner);
  } else {
    url.searchParams.append("fq", `identifier.owner:${owner}`);
  }

  url.searchParams.append("fq", "artifact.hasPictures:true");

  try {
    const response = await axios.get(url.toString());
    res.json(response.data);
  } catch (error: any) {
    console.error("DiMu proxy error:", error.message);
    res.status(500).json({ error: "Feil ved henting fra DiMu" });
  }
});

// FotoWeb API Proxy
router.get("/fotoweb/search", async (req, res) => {
  const { q } = req.query;
  console.log(`FotoWeb search called with query: ${q}`);
  if (!q) return res.status(400).json({ error: "Missing query" });

  const token = process.env.FOTOWEB_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "FOTOWEB_API_TOKEN mangler" });
  }

  try {
    const baseUrl = (process.env.FOTOWEB_BASE_URL || "https://images.nasjonalmuseet.no").replace(/\/$/, "");
    
    // Bruk hardkodet arkiv-sti som forespurt
    const archivePath = "/fotoweb/archives/5004-Kunstverk/";
    
    const searchUrl = `${baseUrl}${archivePath}?fn=${encodeURIComponent(q.toString())}`;
    console.log(`📡 FotoWeb søk (fn): ${searchUrl}`);

    let items: any[] = [];
    let searchMethod = "fn";

    try {
      const response = await axios.get(searchUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.fotoware.collection+json"
        },
        timeout: 10000
      });
      
      if (q === 'NG.M.03581' || q === 'NG.M.00939') {
        console.log(`--- DEBUG FotoWeb for ${q} ---`);
        console.log('URL:', searchUrl);
        console.log('Status:', response.status);
        console.log('--------------------------------------------------');
      }

      items = response.data?.data?.items || response.data?.items || response.data?.results || [];
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.warn(`⚠️ FotoWeb API-nøkkel er ugyldig eller utløpt (401).`);
        return res.status(401).json({ error: "Ugyldig FotoWeb API-nøkkel" });
      }
      console.warn(`⚠️ FotoWeb søk feilet for ${q}:`, err.message);
    }
    
    // Hvis fortsatt ingen treff, prøv arkiv 5005 som fallback med q=
    if (items.length === 0 && !res.headersSent) {
      searchMethod = "q (fallback)";
      const archivePath5005 = "/fotoweb/archives/5005/";
      const fallbackUrl = `${baseUrl}${archivePath5005}?q=${encodeURIComponent(q.toString())}`;
      console.log(`ℹ️ Ingen treff i 5004-Kunstverk, prøver arkiv 5005 fallback: ${fallbackUrl}`);
      
      try {
        const response = await axios.get(fallbackUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.fotoware.collection+json"
          },
          timeout: 10000
        });
        
        items = response.data?.data?.items || response.data?.items || response.data?.results || [];
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.warn(`⚠️ FotoWeb fallback søk feilet:`, err.message);
        }
      }
    }

    if (items.length === 0) {
      console.log(`ℹ️ Ingen bilder funnet i FotoWeb for ${q}.`);
      return res.json({ results: [] });
    }

    const firstMatch = items[0];
    const preview = firstMatch.previews?.[0]?.href || firstMatch.quickView || firstMatch.href;
    
    const formattedResult = {
      id: firstMatch.id,
      filename: firstMatch.filename,
      previewUrl: preview ? `${baseUrl}${preview}` : null,
      assetUrl: `${baseUrl}${firstMatch.href}`,
      metadata: firstMatch.metadata
    };

    console.log(`✅ Fant bilde i FotoWeb (${searchMethod}): ${firstMatch.filename}`);
    res.json({ results: [formattedResult] });
  } catch (error: any) {
    const errorData = error.response?.data;
    const errorMessage = typeof errorData === 'string' && errorData.includes('<html') 
      ? "Server returnerte HTML-feilside" 
      : (errorData || error.message);
      
    console.error("🚨 FotoWeb proxy error:", errorMessage);
    res.status(500).json({ 
      error: "Feil ved henting fra FotoWeb", 
      details: error.message,
      upstreamError: errorMessage
    });
  }
});

export default router;
