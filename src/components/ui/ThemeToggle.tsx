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
      className="glass-button p-2.5 flex items-center justify-center transition-all duration-300"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-[#FF0037]" />
      ) : (
        <Moon className="w-5 h-5 text-[#FF0037]" />
      )}
    </motion.button>
  );
};
