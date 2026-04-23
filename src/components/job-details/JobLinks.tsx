import React, { useState } from "react";
import { Folder, ExternalLink, ChevronRight, Plus, Trash2, Link as LinkIcon, Globe } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useJobLinks } from "../../hooks/useJobLinks";
import { motion, AnimatePresence } from "motion/react";

interface JobLinksProps {
  job: any;
  props: any;
  allExtractedUrls: string[];
  setIsParsingModalOpen: (isOpen: boolean) => void;
}

export const JobLinks: React.FC<JobLinksProps> = ({
  job,
  props,
  allExtractedUrls,
  setIsParsingModalOpen
}) => {
  const { theme } = useTheme();
  const { links, isSaving, addLink, deleteLink } = useJobLinks(job?.id);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const rawLocation = props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "";
  const isStudioJob = rawLocation.toLowerCase().includes("fotoatelier");

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    
    if (await addLink(newUrl, newTitle)) {
      setNewUrl("");
      setNewTitle("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* SharePoint Mappe */}
      <div className="space-y-6">
        {job.folder_link && (
          <section>
            <h2 className="text-xs font-serif font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-muted">
              <Folder className="w-3.5 h-3.5" />
              Filer
            </h2>
            <a
              href={job.folder_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg transition-all shadow-md group bg-stone-900 text-text-inverted hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 opacity-60" />
                <span className="text-sm font-medium">SharePoint Mappe</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>
          </section>
        )}

        {/* Manuelt lagrede lenker (Kun for ikke-atelier oppdrag) */}
        {!isStudioJob && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest flex items-center gap-2 text-text-muted">
                <LinkIcon className="w-3.5 h-3.5" />
                Lagrede nettlenker
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1 rounded-full hover:bg-stone-100 transition-colors text-text-muted hover:text-text-primary"
                title="Legg til ny lenke"
              >
                <Plus className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddLink}
                  className="mb-4 p-4 border rounded-xl bg-stone-50 border-stone-200 space-y-3 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Tittel (valgfri)</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="F.eks. 'Arrangement-side', 'Omtale'..."
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Nettadresse (URL)</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      required
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSaving || !newUrl.trim()}
                      className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white hover:bg-black disabled:opacity-50 transition-all"
                    >
                      {isSaving ? "Lagrer..." : "Lagre lenke"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-stone-200 hover:bg-white transition-all"
                    >
                      Avbryt
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {links.length > 0 ? (
                links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 group"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-between p-4 border rounded-lg transition-all shadow-sm bg-white border-stone-200 text-text-primary hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Globe className="w-5 h-5 shrink-0 text-stone-400" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{link.title || "Nettlenke"}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-all shrink-0 text-text-muted" />
                    </a>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 transition-all"
                      title="Slett lenke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : !showAddForm && (
                <div className="p-8 border border-dashed rounded-xl text-center bg-stone-50/50 border-stone-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Ingen lagrede lenker</p>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:underline"
                  >
                    Legg til din første lenke
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {allExtractedUrls.length > 0 && (
          <section>
            <h2 className="text-xs font-serif font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-text-muted">
              <ExternalLink className="w-3.5 h-3.5" />
              Lenker funnet i tekst
            </h2>
            <div className="space-y-3">
              {allExtractedUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border rounded-lg transition-all shadow-sm group bg-white border-stone-200 text-text-primary hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ExternalLink className="w-5 h-5 shrink-0 text-text-muted" />
                    <span className="text-sm font-medium truncate">{url.replace(/^https?:\/\//, '')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-all shrink-0 text-text-muted group-hover:text-text-primary" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
