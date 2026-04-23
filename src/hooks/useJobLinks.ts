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

export interface JobLink {
  id: string;
  jobId: string;
  url: string;
  title?: string;
  created_at: any;
}

export const useJobLinks = (jobId: string | undefined) => {
  const [links, setLinks] = useState<JobLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "job_links"),
      where("jobId", "==", jobId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobLink[];
      
      // Sort client-side to avoid composite index requirement
      linksData.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setLinks(linksData);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching job links:", err);
      setLoading(false);
      if (err.code === 'permission-denied') {
        setError("Tilgang nektet. Sjekk Firestore Security Rules.");
      } else {
        setError(`Firebase feil: ${err.message}`);
      }
    });

    return () => unsubscribe();
  }, [jobId]);

  const addLink = async (url: string, title?: string) => {
    if (!url.trim() || !jobId) return;

    // Basic URL validation
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "job_links"), {
        jobId,
        url: formattedUrl,
        title: title?.trim() || "",
        created_at: serverTimestamp()
      });
      toast.success("Lenke lagret");
      return true;
    } catch (err) {
      console.error("Error saving link:", err);
      toast.error("Kunne ikke lagre lenke");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await deleteDoc(doc(db, "job_links", linkId));
      toast.success("Lenke slettet");
      return true;
    } catch (err) {
      console.error("Error deleting link:", err);
      toast.error("Kunne ikke slette lenke");
      return false;
    }
  };

  return { links, loading, error, isSaving, addLink, deleteLink };
};
