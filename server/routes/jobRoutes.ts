import express from "express";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { getOwnersData, syncJobsToFirebase } from "../services/firebaseService.js";
import { fetchArchivedJobs, fetchActiveJobs, fetchJobDetails, updateJobStage } from "../services/hubspotService.js";
import { 
  HUBSPOT_TOKEN, 
  ARCHIVE_STAGE_ID, 
  MOCK_JOBS 
} from "../config/constants.js";

const router = express.Router();

router.get("/archive/sync", async (req, res) => {
  if (!HUBSPOT_TOKEN) {
    return res.json([]);
  }

  try {
    const isRecent = req.query.recent === "true";
    console.log(`🔍 Henter arkiv direkte fra HubSpot... (Kun nylige: ${isRecent})`);
    
    const jobs = await fetchArchivedJobs(isRecent);

    console.log(`✅ Hentet ${jobs.length} arkiverte oppdrag fra HubSpot.`);
    syncJobsToFirebase(jobs);
    res.json(jobs);
  } catch (error: any) {
    console.error("❌ Feil ved henting av arkiv fra HubSpot:", error.message);
    res.status(500).json({ error: "Kunne ikke hente arkiv" });
  }
});

router.get("/archive", async (req, res) => {
  try {
    if (!process.env.VITE_FIREBASE_PROJECT_ID) {
      return res.json([]);
    }
    const querySnapshot = await getDocs(collection(db, "jobs"));
    const jobs: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === ARCHIVE_STAGE_ID) {
        jobs.push(data);
      }
    });
    console.log(`✅ Hentet ${jobs.length} arkiverte oppdrag fra Firebase.`);
    res.json(jobs);
  } catch (error: any) {
    console.error("❌ Feil ved henting av arkiv fra Firebase:", error.message);
    res.status(500).json({ error: "Kunne ikke hente arkiv" });
  }
});

router.get("/photographers", async (req, res) => {
  const { list } = await getOwnersData();
  res.json(list);
});

router.get("/jobs", async (req, res) => {
  if (!HUBSPOT_TOKEN) {
    return res.json(MOCK_JOBS);
  }

  try {
    const jobs = await fetchActiveJobs();
    syncJobsToFirebase(jobs);
    res.json(jobs);
  } catch (error: any) {
    console.error("Feil ved henting av oppdrag fra HubSpot:", error.message);
    res.json(MOCK_JOBS);
  }
});

router.get("/all-jobs", async (req, res) => {
  try {
    if (!process.env.VITE_FIREBASE_PROJECT_ID) {
      return res.json([]);
    }
    const querySnapshot = await getDocs(collection(db, "jobs"));
    const jobs: any[] = [];
    querySnapshot.forEach((doc) => {
      jobs.push(doc.data());
    });
    res.json(jobs);
  } catch (error: any) {
    console.error("❌ Feil ved henting av alle oppdrag fra Firebase:", error.message);
    res.status(500).json({ error: "Kunne ikke hente oppdrag" });
  }
});

router.get("/job/:dealId", async (req, res) => {
  const { dealId } = req.params;

  if (!HUBSPOT_TOKEN) {
    const mockJob = MOCK_JOBS.find(j => j.id === dealId) || MOCK_JOBS[0];
    return res.json(mockJob);
  }

  try {
    const job = await fetchJobDetails(dealId);
    res.json(job);
  } catch (error: any) {
    console.error(`Feil ved henting av oppdrag ${dealId}:`, error.message);
    res.status(500).json({ error: "Kunne ikke hente oppdrag" });
  }
});

router.patch("/job/:dealId/stage", async (req, res) => {
  const { dealId } = req.params;
  const { dealstageId } = req.body;

  if (!HUBSPOT_TOKEN) {
    return res.json({ success: true, message: "Mock oppdatert" });
  }

  try {
    await updateJobStage(dealId, dealstageId);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`Feil ved oppdatering av dealstage for ${dealId}:`, error.message);
    res.status(500).json({ error: "Kunne ikke oppdatere dealstage" });
  }
});

export default router;
