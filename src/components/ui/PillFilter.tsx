import React from "react";
import { motion } from "framer-motion";

interface PillFilterProps {
  options: string[];
  activeOption: string;
  onChange: (option: string) => void;
  className?: string;
}

export const PillFilter: React.FC<PillFilterProps> = ({
  options,
  activeOption,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`glass-panel p-1 rounded-full inline-flex relative ${className}`}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
            activeOption === option
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeOption === option && (
            <motion.div
              layoutId="pill-filter-highlighter"
              className="absolute inset-0 bg-teal-500/40 border border-teal-400/50 rounded-full z-[-1] shadow-[0_0_15px_rgba(20,184,166,0.5)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {option}
        </button>
      ))}
    </div>
  );
};
