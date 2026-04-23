import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Note } from "./useJobNotes";

export const useAllNotes = () => {
  const [allNotes, setAllNotes] = useState<Record<string, Note[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, "notes");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesMap: Record<string, Note[]> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Note;
        const note = {
          id: doc.id,
          ...data
        };
        if (!notesMap[data.jobId]) {
          notesMap[data.jobId] = [];
        }
        notesMap[data.jobId].push(note);
      });
      setAllNotes(notesMap);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching all notes:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { allNotes, loading };
};
