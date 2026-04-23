import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface WorkStatus {
  id: string;
  jobId: string;
  workId: string;
  isDone: boolean;
  updated_at: any;
}

export const useWorkStatus = (jobId: string | undefined) => {
  const [workStatuses, setWorkStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setWorkStatuses({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "work_status"),
      where("jobId", "==", jobId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statuses: Record<string, boolean> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        statuses[data.workId] = data.isDone;
      });
      setWorkStatuses(statuses);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching work statuses:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  const toggleWorkDone = async (workId: string) => {
    if (!jobId) return;

    const docId = `${jobId}_${workId.replace(/\//g, '_')}`; // Avoid slashes in doc IDs
    const isDone = !workStatuses[workId];

    try {
      await setDoc(doc(db, "work_status", docId), {
        jobId,
        workId,
        isDone,
        updated_at: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Error toggling work status:", err);
      return false;
    }
  };

  return { workStatuses, loading, toggleWorkDone };
};
