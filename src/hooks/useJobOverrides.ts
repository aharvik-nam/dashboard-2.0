import { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";

export interface JobOverride {
  customType?: string;
  sendToNB?: boolean;
}

export const useJobOverrides = (jobId: string | undefined) => {
  const [override, setOverride] = useState<JobOverride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setOverride(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "job_overrides", jobId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setOverride(docSnap.data() as JobOverride);
      } else {
        setOverride(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching job override:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  const saveCustomType = async (customType: string) => {
    if (!jobId) return;

    try {
      const docRef = doc(db, "job_overrides", jobId);
      if (customType.trim() === "" && (!override || !override.sendToNB)) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { customType: customType.trim() }, { merge: true });
      }
      return true;
    } catch (err) {
      console.error("Error saving custom type:", err);
      toast.error("Kunne ikke lagre tilpasset type");
      return false;
    }
  };

  const saveSendToNB = async (sendToNB: boolean) => {
    if (!jobId) return;

    try {
      const docRef = doc(db, "job_overrides", jobId);
      await setDoc(docRef, { sendToNB }, { merge: true });
      return true;
    } catch (err) {
      console.error("Error saving sendToNB preference:", err);
      toast.error("Kunne ikke lagre NB-innstilling");
      return false;
    }
  };

  return { override, loading, saveCustomType, saveSendToNB };
};
