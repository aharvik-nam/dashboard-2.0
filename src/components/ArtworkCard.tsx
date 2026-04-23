import React from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ArtworkCardProps {
  nmid: string;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ nmid }) => {
  const { theme } = useTheme();
  // Nasjonalmuseet samling URL
  const collectionUrl = `https://www.nasjonalmuseet.no/samlingen/objekt/${nmid}`;

  return (
    <div className="p-3 flex items-center justify-between transition-all bg-stone-50 border border-stone-200 rounded-lg shadow-sm hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-stone-100">
          <ImageIcon className="w-4 h-4 text-text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{nmid}</p>
          <p className="text-xs text-text-secondary">Objekt i samlingen</p>
        </div>
      </div>
      <a
        href={collectionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-muted hover:text-text-primary transition-colors"
        title="Se i samlingen"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
};
