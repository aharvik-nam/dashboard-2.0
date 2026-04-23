import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface JobOverride {
  id: string;
  customType?: string;
  sendToNB?: boolean;
}

export const useAllJobOverrides = () => {
  const [overrides, setOverrides] = useState<Record<string, JobOverride>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, "job_overrides");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const overridesMap: Record<string, JobOverride> = {};
      snapshot.docs.forEach(doc => {
        overridesMap[doc.id] = {
          id: doc.id,
          ...doc.data()
        } as JobOverride;
      });
      setOverrides(overridesMap);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching all job overrides:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { overrides, loading };
};
