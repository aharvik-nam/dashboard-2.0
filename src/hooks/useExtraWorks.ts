import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { parseInventoryNumbers, extractNmIds } from "../utils/nmUtils";

export interface ExtraWork {
  id: string;
  jobId: string;
  invNr: string;
  source: 'manual' | 'museumplus';
  created_at: any;
}

export const useExtraWorks = (jobId: string | undefined) => {
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setExtraWorks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "extra_works"),
      where("jobId", "==", jobId),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const worksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExtraWork[];
      setExtraWorks(worksData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching extra works:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  const addManualWork = async (input: string, existingInvNrs: string[]) => {
    if (!jobId || !input.trim()) return;
    
    setIsAdding(true);
    try {
      const ids = parseInventoryNumbers(input.trim());
      
      if (ids.length === 0) {
        toast.error("Ingen gyldige inventarnummer funnet.");
        return false;
      }

      let addedCount = 0;
      const promises = [];
      
      for (const id of ids) {
        const alreadyExists = existingInvNrs.some(invNr => invNr.toUpperCase() === id.toUpperCase());
        if (alreadyExists) continue;

        promises.push(addDoc(collection(db, "extra_works"), {
          jobId,
          invNr: id,
          source: 'manual',
          created_at: serverTimestamp()
        }));
        addedCount++;
      }
      
      await Promise.all(promises);
      
      if (addedCount === 0) {
        toast.info("Verkene finnes allerede i listen.");
      } else {
        toast.success(`${addedCount} verk lagt til`);
      }
      return true;
    } catch (err) {
      console.error("Error adding manual work:", err);
      toast.error("Kunne ikke legge til verk");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const parseMuseumPlus = async (input: string, existingInvNrs: string[]) => {
    if (!jobId || !input.trim()) return;
    
    const ids = extractNmIds(input);
    
    if (ids.length === 0) {
      toast.error("Fant ingen gyldige inventarnummer i teksten.");
      return false;
    }
    
    try {
      let addedCount = 0;
      const promises = [];
      
      for (const id of ids) {
        const alreadyExists = existingInvNrs.some(invNr => invNr.toUpperCase() === id.toUpperCase());
        if (alreadyExists) continue;

        promises.push(addDoc(collection(db, "extra_works"), {
          jobId,
          invNr: id,
          source: 'museumplus',
          created_at: serverTimestamp()
        }));
        addedCount++;
      }
      
      await Promise.all(promises);
      
      if (addedCount === 0) {
        toast.info("Alle verkene i listen finnes allerede i oversikten.");
      } else {
        toast.success(`${addedCount} verk lagt til`);
      }
      return true;
    } catch (err) {
      console.error("Error parsing MuseumPlus IDs:", err);
      toast.error("Kunne ikke lagre alle verk");
      return false;
    }
  };

  const deleteExtraWork = async (workId: string) => {
    const workToDelete = extraWorks.find(w => w.id === workId);
    if (!workToDelete) return;

    try {
      await deleteDoc(doc(db, "extra_works", workId));
      toast.success("Verk fjernet", {
        action: {
          label: "Angre",
          onClick: async () => {
            try {
              await addDoc(collection(db, "extra_works"), {
                jobId: workToDelete.jobId,
                invNr: workToDelete.invNr,
                source: workToDelete.source,
                created_at: serverTimestamp()
              });
              toast.success("Verk gjenopprettet");
            } catch (err) {
              console.error("Error restoring work:", err);
              toast.error("Kunne ikke gjenopprette verket");
            }
          }
        }
      });
      return true;
    } catch (err) {
      console.error("Error deleting work:", err);
      toast.error("Kunne ikke fjerne verket");
      return false;
    }
  };

  const updateExtraWork = async (workId: string, newInvNr: string) => {
    if (!newInvNr.trim()) return false;
    
    try {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "extra_works", workId), {
        invNr: newInvNr.trim()
      });
      toast.success("Verk oppdatert");
      return true;
    } catch (err) {
      console.error("Error updating work:", err);
      toast.error("Kunne ikke oppdatere verket");
      return false;
    }
  };

  return { extraWorks, loading, isAdding, addManualWork, parseMuseumPlus, deleteExtraWork, updateExtraWork };
};
