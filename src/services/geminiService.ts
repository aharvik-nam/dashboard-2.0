import { GoogleGenAI, Type } from "@google/genai";
import { Job, PhotographerProfile } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

let ai: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const getSystemPrompt = (profiles: PhotographerProfile[]) => {
  let profilesText = "";
  if (profiles.length > 0) {
    profilesText = "\n\nFotografprofiler (Bruk denne informasjonen for å gjøre bedre vurderinger):\n" + profiles.map(p => 
      `- ${p.name}:\n  Styrker: ${p.strengths || 'Ikke oppgitt'}\n  Svakheter/Utfordringer: ${p.weaknesses || 'Ikke oppgitt'}\n  Erfaring: ${p.experience || 'Ikke oppgitt'}\n  Ekspertise: ${p.expertise || 'Ikke oppgitt'}`
    ).join("\n\n");
  }

  return `Du er en AI-assistent som fordeler fotooppdrag for Nasjonalmuseet.
Målet ditt er å foreslå fotograf for et gitt oppdrag, med et spesielt fokus på å skape variasjon og forhindre belastningsskader/monotoni over tid.

Fotografer og standard ansvarsområder:
- Børre Høstland (100% stilling) -> Standard for: Maleri
- Andreas Harvik (50% fotograf, 50% fotoarkivar) -> Standard for: Kunst på Papir (Kapasitet er halvparten av de andre)
- Ina Wesenberg (100% stilling) -> Standard for: Kunst på Papir
- Frode Larsen (100% stilling) -> Standard for: Gjenstander
- Annar Bjørgli (100% stilling) -> Standard for: Store Objekter${profilesText}

Regler for fordeling:
1. Kjenn til standardene: Du vet hvem som "pleier" å ta oppdraget basert på listen over.
2. Foreslå variasjon: I stedet for å alltid velge standardfotografen, skal du aktivt vurdere om noen andre bør ta oppdraget for å bygge krysskompetanse, redusere sårbarhet (hvis noen blir syke), eller bryte opp monotoni.
3. Faremomenter: Hvis en type fotografering skjer over lengre perioder, tenk på ergonomisk belastning og monotoni. Foreslå en annen fotograf for å gi standardfotografen avlastning.
4. Arbeidsmengde: Ta hensyn til nåværende arbeidsmengde (spesielt Andreas sin 50% stilling).
5. Bruk profiler: Ta hensyn til fotografenes styrker, svakheter, erfaring og ekspertise (hvis oppgitt) for å finne den beste matchen.
6. Begrunn valget: Gi 1-3 korte, poengterte begrunnelser for forslaget ditt. Hvis du foreslår en variasjon fra standarden, nevn hvorfor (f.eks. "Avlastning for Børre", "Bygge krysskompetanse på Maleri", "Ergonomisk variasjon"). Hvis du foreslår standardfotografen, nevn hvorfor (f.eks. "Kapasitet tillater det", "Spesialistoppgave").

Du skal returnere et JSON-objekt med:
- name: Navnet på den foreslåtte fotografen.
- reasons: En liste med 1-3 korte begrunnelser (f.eks. "Avlastning for Børre", "Krysskompetanse", "Ergonomisk variasjon").
`;
};

// Cache profiles to avoid fetching them on every request
let cachedProfiles: PhotographerProfile[] | null = null;
let lastProfileFetch = 0;
const PROFILE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const fetchProfiles = async (): Promise<PhotographerProfile[]> => {
  const now = Date.now();
  if (cachedProfiles && (now - lastProfileFetch < PROFILE_CACHE_TTL)) {
    return cachedProfiles;
  }

  try {
    const snapshot = await getDocs(collection(db, "photographer_profiles"));
    const profiles = snapshot.docs.map(doc => doc.data() as PhotographerProfile);
    cachedProfiles = profiles;
    lastProfileFetch = now;
    return profiles;
  } catch (error) {
    console.error("Error fetching photographer profiles:", error);
    return [];
  }
};

export const getAIRecommendationForJob = async (job: Job, workloadContext: any) => {
  try {
    const profiles = await fetchProfiles();
    const systemPrompt = getSystemPrompt(profiles);
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { 
          role: "user", 
          parts: [{ 
            text: `Oppdrag: ${job.title}
Type: ${job.type || "Ukjent"}
Lokasjon: ${job.all_properties?.lokasjon_for_fotografering___ny || job.all_properties?.lokasjon_for_fotografering || "Ukjent"}
Nåværende arbeidsmengde (totalt antall jobber de siste 14 dager): ${JSON.stringify(workloadContext)}` 
          }] 
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            reasons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["name", "reasons"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error: any) {
    const isQuotaExceeded = 
      error?.status === 429 || 
      error?.error?.code === 429 || 
      error?.message?.includes("429") ||
      error?.message?.includes("quota");
      
    if (isQuotaExceeded) {
      console.warn("⚠️ Gemini API kvote overskredet (429). AI-anbefalinger er midlertidig utilgjengelige.");
    } else {
      console.error("Error fetching AI recommendation:", error);
    }
    return null;
  }
};
