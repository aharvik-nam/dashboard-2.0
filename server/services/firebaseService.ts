import { collection, getDocs, setDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../config/firebase.js";

export interface Photographer {
  id: string;
  name: string;
  email: string;
}

const FALLBACK_FOTOGRAFER: Photographer[] = [
  { id: "38748279", name: "Vidar Ibenfeldt", email: "vidar.ibenfeldt@nasjonalmuseet.no" },
  { id: "39387812", name: "Børre Høstland", email: "borre.hostland@nasjonalmuseet.no" },
  { id: "39387857", name: "Annar Bjørgli", email: "annar.bjorgli@nasjonalmuseet.no" },
  { id: "39387861", name: "Frode Larsen", email: "frode.larsen@nasjonalmuseet.no" },
  { id: "63475019", name: "Ina Wesenberg", email: "ina.wesenberg@nasjonalmuseet.no" },
  { id: "63475593", name: "Andreas Harvik", email: "andreas.harvik@nasjonalmuseet.no" },
];

const FALLBACK_OWNERS_MAP: Record<string, string> = FALLBACK_FOTOGRAFER.reduce((acc, curr) => {
  acc[curr.id] = curr.name;
  return acc;
}, {} as Record<string, string>);

let cachedOwnersMap: Record<string, string> | null = null;
let cachedPhotographersList: Photographer[] | null = null;
let lastSync = 0;
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 minutter

export async function getOwnersData() {
  const now = Date.now();
  if (cachedOwnersMap && (now - lastSync < SYNC_INTERVAL)) {
    return { map: cachedOwnersMap, list: cachedPhotographersList! };
  }

  console.log("🔄 Synkroniserer fotografer fra Firebase...");

  try {
    if (!process.env.VITE_FIREBASE_PROJECT_ID) {
      console.warn("⚠️ VITE_FIREBASE_PROJECT_ID mangler. Bruker fallback.");
      return { map: FALLBACK_OWNERS_MAP, list: FALLBACK_FOTOGRAFER };
    }

    const querySnapshot = await getDocs(collection(db, "photographers"));
    console.log(`✅ Hentet ${querySnapshot.size} dokumenter fra Firebase.`);
    
    const map: Record<string, string> = {};
    const list: Photographer[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const hubspotId = data.id || doc.id;
      const name = data.name;

      if (hubspotId && name) {
        map[hubspotId] = name;
        list.push({ 
          id: hubspotId, 
          name: name, 
          email: data.email || "" 
        });
      }
    });

    if (list.length > 0) {
      console.log(`✅ Synkronisering fullført. Fant ${list.length} gyldige fotografer.`);
      cachedOwnersMap = map;
      cachedPhotographersList = list;
      lastSync = now;
      return { map, list };
    } else {
      console.warn("⚠️ Ingen gyldige fotografer funnet i Firebase. Bruker fallback.");
    }
  } catch (error) {
    console.error("❌ Feil ved henting av fotografer fra Firebase:", error);
  }

  return { 
    map: FALLBACK_OWNERS_MAP, 
    list: FALLBACK_FOTOGRAFER 
  };
}

let isSyncingToFirebase = false;

export async function syncJobsToFirebase(jobs: any[]) {
  if (!process.env.VITE_FIREBASE_PROJECT_ID) return;
  if (isSyncingToFirebase) {
    console.log("⏳ En synkronisering pågår allerede. Hopper over denne for å unngå overbelastning.");
    return;
  }
  
  isSyncingToFirebase = true;
  try {
    const uniqueJobs = Array.from(new Map(jobs.map(job => [job.id, job])).values());
    console.log(`Starter synkronisering av ${uniqueJobs.length} unike oppdrag til Firebase...`);
    
    // Bruk batch-skriving for bedre ytelse og for å unngå RESOURCE_EXHAUSTED feil
    const BATCH_SIZE = 400; // Firestore grense er 500, vi bruker 400 for sikkerhets skyld
    
    for (let i = 0; i < uniqueJobs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = uniqueJobs.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(job => {
        const docRef = doc(db, "jobs", job.id);
        batch.set(docRef, job, { merge: true });
      });
      
      await batch.commit();
      console.log(`⏳ Synkronisert ${Math.min(i + BATCH_SIZE, uniqueJobs.length)}/${uniqueJobs.length} oppdrag...`);
      
      // Legg inn en liten pause mellom batcher for å unngå å treffe kvotegrenser
      if (i + BATCH_SIZE < uniqueJobs.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Synkroniserte ${uniqueJobs.length} oppdrag til Firebase.`);
  } catch (error) {
    console.error("❌ Feil ved synkronisering av oppdrag til Firebase:", error);
  } finally {
    isSyncingToFirebase = false;
  }
}
