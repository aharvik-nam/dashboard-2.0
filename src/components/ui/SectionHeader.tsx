import React from "react";
import { LucideIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string | number;
  className?: string;
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle,
  description,
  icon: Icon, 
  badge, 
  className = "",
  children
}) => {
  const { theme } = useTheme();
  const desc = subtitle || description;

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-serif font-bold uppercase tracking-widest flex items-center gap-2 text-stone-400">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {title}
          {badge !== undefined && (
            <span className="text-stone-300">({badge})</span>
          )}
        </h2>
        {desc && (
          <p className="text-[10px] font-medium text-stone-500 uppercase tracking-tight">
            {desc}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};
