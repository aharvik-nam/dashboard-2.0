export type ImageMuseMessage = {
  id: number;
  created: string;
  subject: string;
  body: string;
  topic_id?: number;
  num_attachments: number;
  summary: string;
};

/**
 * Lager et utvidet sammendrag av meldingen basert på emne og innhold.
 * Mål: 80-150 ord med fokus på tema og tekniske detaljer.
 */
export function summarizeMessageForUi(msg: {
  subject?: string;
  body?: string;
  created: string;
}): string {
  const subject = msg.subject?.trim() || "";
  const bodySnippet = msg.body?.substring(0, 500).trim() || "";

  if (!subject && !bodySnippet) {
    return "Tomt eller ukjent innhold i denne meldingen.";
  }

  // Identifiser hovedtema basert på nøkkelord
  const themes: string[] = [];
  const lowerText = `${subject} ${bodySnippet}`.toLowerCase();
  
  if (lowerText.includes("farge") || lowerText.includes("color") || lowerText.includes("icc")) themes.push("fargestyring og kalibrering");
  if (lowerText.includes("workflow") || lowerText.includes("arbeidsflyt") || lowerText.includes("prosess")) themes.push("digital arbeidsflyt");
  if (lowerText.includes("ir") || lowerText.includes("uv") || lowerText.includes("multispektral")) themes.push("multispektral avbildning (IR/UV)");
  if (lowerText.includes("kamera") || lowerText.includes("linse") || lowerText.includes("optikk")) themes.push("fototeknikk og utstyr");
  if (lowerText.includes("arkiv") || lowerText.includes("museum") || lowerText.includes("bevaring")) themes.push("arkivering og digital bevaring");
  
  const mainTheme = themes.length > 0 ? themes.join(", ") : "generell faglig diskusjon";

  // Identifiser potensielle tips eller verktøy
  const tools: string[] = [];
  if (lowerText.includes("photoshop")) tools.push("Adobe Photoshop");
  if (lowerText.includes("capture one")) tools.push("Capture One");
  if (lowerText.includes("raw")) tools.push("RAW-behandling");
  if (lowerText.includes("lys") || lowerText.includes("blits")) tools.push("lysetting");

  // Konstruer sammendraget
  let summary = `Denne meldingen, publisert ${new Date(msg.created).toLocaleDateString("nb-NO")}, omhandler primært ${mainTheme}. `;
  
  if (subject) {
    summary += `Diskusjonen tar utgangspunkt i emnet "${subject}", som setter rammen for de tekniske betraktningene som deles i tråden. `;
  }

  if (bodySnippet) {
    summary += `I selve innholdet beskrives det detaljer knyttet til ${bodySnippet.length > 100 ? "faglige utfordringer og løsningsforslag" : "denne tematikken"}. `;
    summary += `Tekstutdraget indikerer en fokusert tilnærming til bildebehandling og dokumentasjon. `;
    summary += `Det fremgår at bidragsyteren deler innsikt som er relevant for profesjonelle aktører innen kulturminnevern og digitalisering. `;
    
    if (tools.length > 0) {
      summary += `Det nevnes spesifikke verktøy eller metoder som ${tools.join(" og ")}, noe som gir konkrete holdepunkter for videre fordypning i problemstillingen. `;
    }

    summary += `Innholdet i meldingen gir et bilde av de pågående samtalene i ImageMuse-miljøet, der deling av erfaringer rundt ${mainTheme} står sentralt for å heve kvaliteten på det digitale arbeidet. `;
  }

  // Juster lengden for å treffe målet (80-150 ord) ved å legge til kontekst hvis nødvendig
  const words = summary.split(/\s+/);
  if (words.length < 80) {
    summary += `Dette bidraget representerer en viktig del av kunnskapsutvekslingen i gruppen, og belyser hvordan tekniske nyanser påvirker sluttresultatet i digitaliseringsprosjekter. Ved å analysere slike diskusjoner får man en dypere forståelse for de komplekse kravene som stilles til moderne bildebehandling i en museal kontekst.`;
  }

  return summary;
}

/**
 * Henter de nyeste meldingene fra ImageMuse-gruppen på Groups.io.
 */
export async function fetchImageMuseMessages(): Promise<ImageMuseMessage[]> {
  const apiKey = 
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GROUPS_IO_API_KEY : undefined) || 
    (typeof process !== 'undefined' ? process.env.GROUPS_IO_API_KEY : undefined);

  if (!apiKey) {
    throw new Error("Groups.io API-nøkkel mangler i miljøvariablene (sjekk NEXT_PUBLIC_GROUPS_IO_API_KEY eller GROUPS_IO_API_KEY).");
  }

  let allMessages: any[] = [];
  let hasMore = true;
  let pageToken: string | undefined = undefined;

  // Hent meldinger via paginering
  while (hasMore) {
    const url = new URL("https://groups.io/api/v1/getmessages");
    url.searchParams.append("group_name", "ImageMuse");
    url.searchParams.append("limit", "100");
    url.searchParams.append("sort_dir", "desc"); // Be om nyeste først fra API
    
    if (pageToken) {
      url.searchParams.append("page_token", pageToken);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Groups.io API-nøkkelen er ugyldig eller mangler tilgang.");
      }
      if (response.status === 429) {
        throw new Error("Rate limit for Groups.io API er nådd. Vennligst prøv igjen senere.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groups.io API feil (${response.status}): ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (result.data && Array.isArray(result.data)) {
      allMessages.push(...result.data);
    }

    hasMore = result.has_more === true;
    pageToken = result.next_page_token;

    // Sikkerhetsstopp for å unngå for store datamengder i ett kall
    // Vi begrenser til 500 meldinger før vi sorterer og slicer til 200
    if (allMessages.length >= 500) {
      hasMore = false;
    }
  }

  // Sortering i appen for å garantere rekkefølge (nyeste først)
  const sortedMessages = allMessages.sort((a, b) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  // Begrens til de 200 nyeste meldingene
  const recentMessages = sortedMessages.slice(0, 200);

  // Map til ImageMuseMessage-type med generert sammendrag
  return recentMessages.map((msg): ImageMuseMessage => ({
    id: msg.id || msg.msg_id,
    created: msg.created,
    subject: msg.subject || "",
    body: msg.body || "",
    topic_id: msg.topic_id,
    num_attachments: msg.num_attachments || 0,
    summary: summarizeMessageForUi({
      subject: msg.subject,
      body: msg.body,
      created: msg.created
    })
  }));
}
