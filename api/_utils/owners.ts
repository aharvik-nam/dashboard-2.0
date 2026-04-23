import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Helper to get env var with or without VITE_ prefix
const getEnv = (key: string) => process.env[`VITE_${key}`] || process.env[key];

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID")
};

// Initialize Firebase (singleton pattern for serverless)
// Only initialize if we have a project ID, otherwise we can't connect anyway
const app = (!getApps().length && firebaseConfig.projectId) 
  ? initializeApp(firebaseConfig) 
  : (getApps().length ? getApp() : undefined);

const db = app ? getFirestore(app) : undefined;

const FALLBACK_FOTOGRAFER = [
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

export async function getOwnersData() {
  console.log("🔄 Henter fotografer...");
  
  if (!db) {
    console.warn("⚠️ Firebase er ikke initialisert (mangler config). Bruker fallback.");
    return { map: FALLBACK_OWNERS_MAP, list: FALLBACK_FOTOGRAFER };
  }

  try {
    const querySnapshot = await getDocs(collection(db, "photographers"));
    console.log(`✅ Hentet ${querySnapshot.size} fotografer fra Firebase.`);
    
    const map: Record<string, string> = {};
    const list: any[] = [];
    
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
      return { map, list };
    } else {
      console.warn("⚠️ Ingen gyldige fotografer funnet i Firebase. Bruker fallback.");
    }
  } catch (error: any) {
    console.error("❌ Firebase Error in API route:", error.message);
  }

  return { map: FALLBACK_OWNERS_MAP, list: FALLBACK_FOTOGRAFER };
}
