import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseClasses =
    "glass-button px-6 py-2 flex justify-center items-center gap-2 font-medium focus:outline-none";

  const variantClasses = {
    primary:
      "text-teal-300 hover:text-teal-200 border-teal-500/30 hover:bg-teal-500/20",
    secondary: "text-slate-200 hover:text-white border-white/20",
    danger:
      "text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/20",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
