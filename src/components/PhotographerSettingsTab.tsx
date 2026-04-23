import React, { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { User, Save, Loader2 } from "lucide-react";
import { PhotographerProfile } from "../types";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface PhotographerSettingsTabProps {
  uniqueOwners: string[];
}

export const PhotographerSettingsTab: React.FC<PhotographerSettingsTabProps> = ({ uniqueOwners }) => {
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter out "Ufordelt" or empty owners
  const validOwners = uniqueOwners.filter(o => o && o.toLowerCase() !== "ufordelt");

  useEffect(() => {
    if (!selectedOwner) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "photographer_profiles", selectedOwner);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as PhotographerProfile);
        } else {
          setProfile({
            id: selectedOwner,
            name: selectedOwner,
            strengths: "",
            weaknesses: "",
            experience: "",
            expertise: ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Kunne ikke hente fotografprofil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [selectedOwner]);

  const handleSave = async () => {
    if (!profile || !selectedOwner) return;
    setSaving(true);
    try {
      const docRef = doc(db, "photographer_profiles", selectedOwner);
      await setDoc(docRef, profile);
      toast.success("Profil lagret");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Kunne ikke lagre profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PhotographerProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: List of photographers */}
        <Card className="bg-stone-50 md:col-span-1">
          <div className="mb-4 border-b border-stone-100 pb-2">
            <h3 className="text-[10px] font-serif font-black uppercase tracking-widest text-stone-900">
              Fotografer
            </h3>
          </div>
          <div className="space-y-1">
            {validOwners.length === 0 ? (
              <p className="text-xs text-stone-500">Ingen fotografer funnet.</p>
            ) : (
              validOwners.map(owner => (
                <button
                  key={owner}
                  onClick={() => setSelectedOwner(owner)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedOwner === owner
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">{owner}</span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Main Content: Profile Editor */}
        <div className="md:col-span-2">
          {!selectedOwner ? (
            <Card className="bg-stone-50 h-full flex items-center justify-center min-h-[300px]">
              <div className="text-center text-stone-400 space-y-2">
                <User className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm">Velg en fotograf for å redigere profilen</p>
              </div>
            </Card>
          ) : loading ? (
            <Card className="bg-stone-50 h-full flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </Card>
          ) : profile ? (
            <Card className="bg-stone-50 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-black text-stone-900">{profile.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">
                    AI Fordelingsprofil
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lagre
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Styrker
                  </label>
                  <textarea
                    value={profile.strengths || ""}
                    onChange={(e) => handleChange("strengths", e.target.value)}
                    placeholder="F.eks. Rask, god på portretter, strukturert..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-stone-50 focus:ring-2 focus:ring-stone-900/5 transition-all outline-none min-h-[80px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Svakheter / Utfordringer
                  </label>
                  <textarea
                    value={profile.weaknesses || ""}
                    onChange={(e) => handleChange("weaknesses", e.target.value)}
                    placeholder="F.eks. Liker ikke store grupper, trenger mer tid på redigering..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-stone-50 focus:ring-2 focus:ring-stone-900/5 transition-all outline-none min-h-[80px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Erfaring
                  </label>
                  <textarea
                    value={profile.experience || ""}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    placeholder="F.eks. 5 års erfaring, jobbet mye med bryllup..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-stone-50 focus:ring-2 focus:ring-stone-900/5 transition-all outline-none min-h-[80px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Ekspertise / Spesialområder
                  </label>
                  <textarea
                    value={profile.expertise || ""}
                    onChange={(e) => handleChange("expertise", e.target.value)}
                    placeholder="F.eks. Arkitektur, makro, dronefoto..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-stone-50 focus:ring-2 focus:ring-stone-900/5 transition-all outline-none min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};
