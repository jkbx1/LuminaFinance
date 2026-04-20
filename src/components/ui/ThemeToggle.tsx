import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 shadow-[0_0_10px_rgba(255,0,55,0.1)] transition-all duration-300 hover:bg-accent/20 shrink-0"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF0037]" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF0037]" />
      )}
    </motion.button>
  );
};
