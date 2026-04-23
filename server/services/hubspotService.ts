import axios from "axios";
import { HUBSPOT_TOKEN, PIPELINE_ID, STAGE_ID, FORDELING_STAGE_ID, ARCHIVE_STAGE_ID } from "../config/constants.js";
import { getOwnersData } from "./firebaseService.js";
import { parseInventoryNumbers } from "../../src/utils/nmUtils.js";

let cachedProperties: string[] = [];

export async function getDealProperties() {
  if (cachedProperties.length > 0) return cachedProperties;
  
  const essentialProperties = [
    "dealname", 
    "dealstage", 
    "pipeline", 
    "hubspot_owner_id", 
    "hs_all_owner_ids", 
    "closedate", 
    "deadline", 
    "description", 
    "nm_id", 
    "mappelink", 
    "oppdragstype", 
    "createdate", 
    "type_fotografering", 
    "lokasjon_for_fotografering", 
    "lokasjon_for_fotografering___ny"
  ];

  try {
    const response = await axios.get("https://api.hubspot.com/crm/v3/properties/deals", {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const apiProperties = response.data.results.map((p: any) => p.name);
    cachedProperties = Array.from(new Set([...essentialProperties, ...apiProperties]));
    return cachedProperties;
  } catch (error) {
    console.error("Feil ved henting av HubSpot-properties:", error);
    return essentialProperties;
  }
}

export async function fetchArchivedJobs(isRecent: boolean) {
  const properties = await getDealProperties();
  const { map: ownersMap } = await getOwnersData();
  
  let allDeals: any[] = [];
  let after = undefined;
  let hasMore = true;
  let count = 0;

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filters: any[] = [
    { propertyName: "dealstage", operator: "EQ", value: ARCHIVE_STAGE_ID },
    { propertyName: "pipeline", operator: "EQ", value: PIPELINE_ID },
  ];

  if (isRecent) {
    filters.push({ propertyName: "hs_lastmodifieddate", operator: "GTE", value: sevenDaysAgo.toString() });
  }

  while (hasMore) {
    const searchResponse: any = await axios.post(
      "https://api.hubspot.com/crm/v3/objects/deals/search",
      {
        filterGroups: [{ filters }],
        properties,
        limit: 100,
        after
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const results = searchResponse.data.results;
    allDeals = allDeals.concat(results);
    count += results.length;

    after = searchResponse.data.paging?.next?.after;
    hasMore = !!after;

    if (count >= 5000) break;
  }

  return allDeals.map((deal: any) => {
    const props = deal.properties;
    let ownerIds: string[] = [];
    if (props.hs_all_owner_ids) {
      ownerIds = props.hs_all_owner_ids.split(";");
    } else if (props.hubspot_owner_id) {
      ownerIds = [props.hubspot_owner_id];
    }
    
    const ownerNames = ownerIds.map((id: string) => ownersMap[id] || id);

    return {
      id: deal.id,
      title: props.dealname || "Uten tittel",
      due_date: props.closedate || props.createdate,
      deadline: props.deadline || null,
      type: props.oppdragstype || "Ukjent",
      nmids: parseInventoryNumbers(props.nm_id),
      folder_link: props.mappelink || "",
      pipeline: props.pipeline,
      status: props.dealstage,
      owner_names: ownerNames,
      all_properties: props,
    };
  });
}

export async function fetchActiveJobs() {
  const properties = await getDealProperties();
  const { map: ownersMap } = await getOwnersData();
  
  const searchResponse = await axios.post(
    "https://api.hubspot.com/crm/v3/objects/deals/search",
    {
      filterGroups: [
        {
          filters: [
            { propertyName: "dealstage", operator: "IN", values: [STAGE_ID, FORDELING_STAGE_ID] },
            { propertyName: "pipeline", operator: "EQ", value: PIPELINE_ID },
          ],
        },
      ],
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

  return searchResponse.data.results.map((deal: any) => {
    const props = deal.properties;
    let ownerIds: string[] = [];
    if (props.hs_all_owner_ids) {
      ownerIds = props.hs_all_owner_ids.split(";");
    } else if (props.hubspot_owner_id) {
      ownerIds = [props.hubspot_owner_id];
    }
    
    const ownerNames = ownerIds.map((id: string) => ownersMap[id] || id);

    const allNmIds = new Set<string>();
    parseInventoryNumbers(props.nm_id || "").forEach(id => allNmIds.add(id));
    for (let i = 1; i <= 20; i++) {
      const fieldName = `inventarnummer_${i}`;
      if (props[fieldName]) {
        parseInventoryNumbers(props[fieldName]).forEach(id => allNmIds.add(id));
      }
    }

    return {
      id: deal.id,
      title: props.dealname || "Uten tittel",
      due_date: props.closedate || props.createdate,
      deadline: props.deadline || null,
      type: props.oppdragstype || "Ukjent",
      nmids: Array.from(allNmIds),
      folder_link: props.mappelink || "",
      pipeline: props.pipeline,
      status: props.dealstage,
      owner_names: ownerNames,
      all_properties: props,
    };
  });
}

export async function fetchJobDetails(dealId: string) {
  const properties = await getDealProperties();
  const { map: ownersMap } = await getOwnersData();

  const response = await axios.get(
    `https://api.hubspot.com/crm/v3/objects/deals/${dealId}?properties=${properties.join(",")}`,
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const deal = response.data;
  const props = deal.properties;
  
  let ownerIds: string[] = [];
  if (props.hs_all_owner_ids) {
    ownerIds = props.hs_all_owner_ids.split(";");
  } else if (props.hubspot_owner_id) {
    ownerIds = [props.hubspot_owner_id];
  }
  
  const ownerNames = ownerIds.map((id: string) => ownersMap[id] || id);

  const allNmIds = new Set<string>();
  parseInventoryNumbers(props.nm_id || "").forEach(id => allNmIds.add(id));
  for (let i = 1; i <= 20; i++) {
    const fieldName = `inventarnummer_${i}`;
    if (props[fieldName]) {
      parseInventoryNumbers(props[fieldName]).forEach(id => allNmIds.add(id));
    }
  }

  return {
    id: deal.id,
    title: props.dealname || "Uten tittel",
    due_date: props.closedate || props.createdate,
    deadline: props.deadline || null,
    type: props.oppdragstype || "Ukjent",
    nmids: Array.from(allNmIds),
    folder_link: props.mappelink || "",
    pipeline: props.pipeline,
    status: props.dealstage,
    owner_names: ownerNames,
    all_properties: props,
  };
}

export async function updateJobStage(dealId: string, dealstageId: string) {
  await axios.patch(
    `https://api.hubspot.com/crm/v3/objects/deals/${dealId}`,
    {
      properties: {
        dealstage: dealstageId
      }
    },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}
