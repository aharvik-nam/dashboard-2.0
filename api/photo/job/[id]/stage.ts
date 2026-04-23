import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HUBSPOT_TOKEN) {
    return res.status(200).json({ status: "Mock Updated (Vercel)" });
  }

  const { dealstage } = req.body;

  try {
    const response = await axios.patch(
      `https://api.hubspot.com/crm/v3/objects/deals/${id}`,
      { properties: { dealstage } },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("HubSpot Update Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Kunne ikke oppdatere status" });
  }
}
