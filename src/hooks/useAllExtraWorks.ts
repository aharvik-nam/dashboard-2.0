import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { ExtraWork } from "./useExtraWorks";

export const useAllExtraWorks = () => {
  const [allExtraWorks, setAllExtraWorks] = useState<Record<string, ExtraWork[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, "extra_works");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const worksMap: Record<string, ExtraWork[]> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as ExtraWork;
        const work = {
          id: doc.id,
          ...data
        };
        if (!worksMap[data.jobId]) {
          worksMap[data.jobId] = [];
        }
        worksMap[data.jobId].push(work);
      });
      setAllExtraWorks(worksMap);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching all extra works:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { allExtraWorks, loading };
};
