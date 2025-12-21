import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  glass = false,
}) => {
  const baseStyles =
    "rounded-xl border border-border overflow-hidden transition-all duration-300";
  const glassStyles = glass
    ? "bg-white/10 backdrop-blur-glass border-white/20 shadow-glass hover:border-white/30"
    : "bg-card border-border shadow-sm hover:shadow-md";

  return (
    <div className={`${baseStyles} ${glassStyles} ${className}`}>
      {children}
    </div>
  );
};
