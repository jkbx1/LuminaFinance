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
              : "text-[#808080] hover:text-[#F2F2F2]"
          }`}
        >
          {activeOption === option && (
            <motion.div
              layoutId="pill-filter-highlighter"
              className="absolute inset-0 bg-accent/30 border border-accent/40 rounded-full z-[-1] shadow-[0_0_15px_rgba(255,0,55,0.5)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {option}
        </button>
      ))}
    </div>
  );
};
