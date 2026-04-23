import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getOwnersData } from '../../_utils/owners.js';

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HUBSPOT_TOKEN) {
    return res.status(200).json({ id, title: "Mock Job (Vercel)" });
  }

  try {
    const [propRes, { map: ownersMap }] = await Promise.all([
      axios.get("https://api.hubspot.com/crm/v3/properties/deals", {
        headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` }
      }),
      getOwnersData()
    ]);
    
    const properties = propRes.data.results.map((p: any) => p.name);

    const response = await axios.get(`https://api.hubspot.com/crm/v3/objects/deals/${id}`, {
      params: { properties: properties.join(",") },
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const deal = response.data;
    const props = deal.properties;
    
    // Finn eiere
    let ownerIds: string[] = [];
    if (props.hs_all_owner_ids) {
      ownerIds = props.hs_all_owner_ids.split(";");
    } else if (props.hubspot_owner_id) {
      ownerIds = [props.hubspot_owner_id];
    }
    
    const ownerNames = ownerIds.map((id: string) => ownersMap[id] || id);

    return res.status(200).json({
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
    });
  } catch (error: any) {
    console.error("HubSpot Detail Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Kunne ikke hente detaljer" });
  }
}
