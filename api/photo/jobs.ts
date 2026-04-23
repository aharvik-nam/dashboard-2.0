import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getOwnersData } from '../_utils/owners.js';

// Hardkodet konfigurasjon (samme som i server.ts)
const PIPELINE_ID = "702523";
const STAGE_ID = "702529";
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

const MOCK_JOBS = [
  {
    id: "mock-1",
    title: "Foto av maleri: Brudeferden i Hardanger (Vercel Mock)",
    due_date: "2024-05-15",
    deadline: "2024-05-20",
    type: "Maleri",
    nmids: ["NG.M.00467"],
    folder_link: "https://nasjonalmuseet.sharepoint.com/folder1",
    pipeline: PIPELINE_ID,
    status: STAGE_ID,
    description: "Høyoppløselig foto av maleriet for ny katalog.",
    owner_names: ["Andreas Harvik"]
  }
];

// Fallback properties hvis API-kall feiler
const FALLBACK_PROPERTIES = [
  "dealname", "dealstage", "pipeline", "hubspot_owner_id", "hs_all_owner_ids", 
  "closedate", "deadline", "description", "nm_id", "mappelink", "oppdragstype", "createdate"
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HUBSPOT_TOKEN) {
    console.warn("HUBSPOT_TOKEN mangler i Vercel Env Vars, returnerer mock-data.");
    return res.status(200).json(MOCK_JOBS);
  }

  try {
    console.log("🚀 Starter henting av jobber...");
    
    // 1. Hent properties og owners parallelt
    // Vi bruker Promise.allSettled for å sikre at vi får owners selv om properties feiler (eller omvendt)
    const [propResult, ownersResult] = await Promise.allSettled([
      axios.get("https://api.hubspot.com/crm/v3/properties/deals", {
        headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` }
      }),
      getOwnersData()
    ]);

    // Håndter properties resultat
    let properties = FALLBACK_PROPERTIES;
    if (propResult.status === 'fulfilled') {
      properties = propResult.value.data.results.map((p: any) => p.name);
      console.log(`✅ Hentet ${properties.length} properties fra HubSpot.`);
    } else {
      console.warn("⚠️ Kunne ikke hente properties, bruker fallback.", propResult.reason);
    }

    // Håndter owners resultat
    let ownersMap: Record<string, string> = {};
    if (ownersResult.status === 'fulfilled') {
      ownersMap = ownersResult.value.map;
      console.log(`✅ Owners map klar med ${Object.keys(ownersMap).length} entries.`);
    } else {
      console.warn("⚠️ Kunne ikke hente owners data.", ownersResult.reason);
    }

    // 2. Søk etter deals
    console.log("🔍 Søker etter deals i HubSpot...");
    const searchResponse = await axios.post(
      "https://api.hubspot.com/crm/v3/objects/deals/search",
      {
        filterGroups: [{
          filters: [
            { propertyName: "dealstage", operator: "EQ", value: STAGE_ID },
            { propertyName: "pipeline", operator: "EQ", value: PIPELINE_ID },
          ],
        }],
        properties,
        limit: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Fant ${searchResponse.data.results.length} deals.`);

    const jobs = searchResponse.data.results.map((deal: any) => {
      const props = deal.properties;
      
      // Finn eiere
      let ownerIds: string[] = [];
      if (props.hs_all_owner_ids) {
        ownerIds = props.hs_all_owner_ids.split(";");
      } else if (props.hubspot_owner_id) {
        ownerIds = [props.hubspot_owner_id];
      }
      
      const ownerNames = ownerIds.map((id: string) => ownersMap[id] || id);
      
      // Logg hvis vi finner IDer men ingen navn (for debugging)
      if (ownerIds.length > 0 && ownerNames.some(n => n.match(/^\d+$/))) {
        console.log(`⚠️ Fant ukjent eier-ID på deal ${deal.id}:`, ownerIds);
      }

      return {
        id: deal.id,
        title: props.dealname || "Uten tittel",
        due_date: props.closedate || props.createdate,
        deadline: props.deadline,
        type: props.oppdragstype || "Ukjent",
        nmids: props.nm_id ? props.nm_id.split(",").map((s: string) => s.trim()) : [],
        folder_link: props.mappelink || "",
        pipeline: props.pipeline,
        status: props.dealstage,
        owner_names: ownerNames,
        all_properties: props,
      };
    });

    return res.status(200).json(jobs);
  } catch (error: any) {
    console.error("❌ HubSpot Error:", error.response?.data || error.message);
    return res.status(200).json(MOCK_JOBS); // Fallback til mock ved feil
  }
}
