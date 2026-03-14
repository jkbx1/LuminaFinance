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
      "text-accent hover:text-accent-hover border-accent/30 hover:bg-accent/20",
    secondary: "text-bright hover:text-accent border-bg-border bg-bg-card/30 hover:bg-bg-card/50",
    danger:
      "text-[#FF0037] hover:text-[#CC002C] border-accent/30 hover:bg-accent/20",
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
