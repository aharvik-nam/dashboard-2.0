import React from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";

interface Note {
  id: string;
  jobId: string;
  content: string;
  author: string;
  created_at: any;
}

interface JobNotesProps {
  notes: Note[];
  notesError: string | null;
  newNote: string;
  setNewNote: (value: string) => void;
  isSavingNote: boolean;
  handleSaveNote: (e: React.FormEvent) => Promise<void>;
  handleDeleteNote: (id: string) => Promise<void>;
}

export const JobNotes: React.FC<JobNotesProps> = ({
  notes,
  notesError,
  newNote,
  setNewNote,
  isSavingNote,
  handleSaveNote,
  handleDeleteNote
}) => {
  const { theme } = useTheme();

  return (
    <section className="border rounded-2xl shadow-sm overflow-hidden transition-colors bg-white border-stone-200">
      <div className="p-6 border-b flex items-center justify-between bg-stone-50/50 border-stone-100">
        <h2 className="text-xs font-serif font-bold uppercase tracking-widest flex items-center gap-2 text-text-primary">
          <MessageSquare className="w-4 h-4 text-text-muted" />
          Notater
        </h2>
        {notesError && (
          <span className="text-[10px] text-red-500 font-medium">{notesError}</span>
        )}
      </div>
      
      <div className="p-6 space-y-6">
        {/* Note Form */}
        <form onSubmit={handleSaveNote} className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Skriv et nytt notat..."
            className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all bg-stone-50 border-stone-200 text-text-primary focus:ring-text-primary/5"
            disabled={isSavingNote}
          />
          <button
            type="submit"
            disabled={isSavingNote || !newNote.trim()}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-stone-900 text-text-inverted hover:bg-stone-800"
          >
            {isSavingNote ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Notes List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl p-4 border group transition-colors bg-stone-50 border-stone-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {note.author} • {note.created_at instanceof Timestamp ? note.created_at.toDate().toLocaleString("nb-NO") : "Lagrer..."}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-red-500"
                    title="Slett notat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {note.content}
                </p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center border-2 border-dashed rounded-xl border-stone-100">
              <p className="text-xs text-text-muted">Ingen notater lagret ennå.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
