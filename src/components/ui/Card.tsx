import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { useTheme } from "../../context/ThemeContext";

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const { theme } = useTheme();
  const settings = theme.cardSettings;

  const shadows = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg"
  };

  const variants = {
    default: `
      bg-white border-stone-200 
      ${shadows[settings?.cardShadow || 'sm']}
    `,
    flat: `
      bg-stone-50 border-stone-100
    `,
    bordered: `
      bg-white border-stone-200
    `,
    elevated: `
      bg-white border-stone-100 
      ${shadows[settings?.cardShadow || 'md']}
    `
  };

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-4 md:p-8",
    lg: "p-6 md:p-12"
  };

  return (
    <motion.div
      className={`
        overflow-hidden
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
      style={{ 
        borderRadius: settings?.cardBorderRadius || '1rem',
        borderWidth: settings?.cardBorderRadius === '0px' ? '2px' : '1px'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
