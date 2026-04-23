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

export interface Note {
  id: string;
  jobId: string;
  content: string;
  author: string;
  created_at: any;
}

export const useJobNotes = (jobId: string | undefined) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "notes"),
      where("jobId", "==", jobId),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching notes:", err);
      setLoading(false);
      if (err.code === 'permission-denied') {
        setError("Tilgang nektet. Sjekk Firestore Security Rules.");
      } else if (err.code === 'failed-precondition') {
        setError("Mangler Firestore-indeks. Se konsoll for lenke.");
      } else {
        setError(`Firebase feil: ${err.message}`);
      }
    });

    return () => unsubscribe();
  }, [jobId]);

  const saveNote = async (content: string) => {
    if (!content.trim() || !jobId) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, "notes"), {
        jobId,
        content: content.trim(),
        author: "Bruker",
        created_at: serverTimestamp()
      });
      toast.success("Notat lagret");
      return true;
    } catch (err) {
      console.error("Error saving note:", err);
      toast.error("Kunne ikke lagre notat");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
      toast.success("Notat slettet", {
        action: {
          label: "Angre",
          onClick: async () => {
            try {
              await addDoc(collection(db, "notes"), {
                jobId: noteToDelete.jobId,
                content: noteToDelete.content,
                author: noteToDelete.author,
                created_at: serverTimestamp()
              });
              toast.success("Notat gjenopprettet");
            } catch (err) {
              console.error("Error restoring note:", err);
              toast.error("Kunne ikke gjenopprette notatet");
            }
          }
        }
      });
      return true;
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error("Kunne ikke slette notatet");
      return false;
    }
  };

  return { notes, loading, error, isSaving, saveNote, deleteNote };
};
