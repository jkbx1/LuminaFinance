import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>{children}</div>
  );
};
