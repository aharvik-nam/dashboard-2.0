import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'inverted' | 'success' | 'warning' | 'error' | 'secondary' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = "",
  style
}) => {
  const { theme } = useTheme();
  const badgeStyle = theme.cardSettings?.badgeStyle || 'solid';
  const radius = theme.cardSettings?.cardBorderRadius === '0px' ? '0px' : '4px';

  const variants = {
    default: badgeStyle === 'soft' 
        ? "bg-stone-100 text-stone-600 border-transparent" 
        : badgeStyle === 'outline'
          ? "bg-transparent border-stone-200 text-stone-600"
          : "bg-stone-200 text-stone-700 border-stone-300",
    outline: "bg-transparent border-stone-200 text-stone-500",
    inverted: "bg-stone-900 text-white border-stone-900",
    success: badgeStyle === 'soft'
        ? "bg-emerald-50 text-emerald-700 border-transparent"
        : "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: badgeStyle === 'soft'
        ? "bg-amber-50 text-amber-700 border-transparent"
        : "bg-amber-100 text-amber-800 border-amber-200",
    error: badgeStyle === 'soft'
        ? "bg-red-50 text-red-700 border-transparent"
        : "bg-red-100 text-red-800 border-red-200",
    secondary: "bg-stone-100 text-stone-600 border-stone-200",
    none: ""
  };

  return (
    <span 
      style={{ ...style, borderRadius: radius }}
      className={`
        inline-flex items-center px-2 py-0.5 
        text-[9px] font-bold uppercase tracking-widest border
        transition-colors duration-200
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
