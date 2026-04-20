import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import type { LucideIcon } from "lucide-react";

interface FeatureShowcaseProps {
  title: string;
  description: string;
  image: string;
  icon: LucideIcon;
  reverse?: boolean;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  title,
  description,
  image,
  icon: Icon,
  reverse = false,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, rotate: reverse ? -2 : 2 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      } items-center gap-12 py-20 px-4 max-w-7xl mx-auto`}
    >
      {/* Text Content */}
      <div className="flex-1 space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent">
          <Icon className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Feature</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black text-bright tracking-tight leading-tight">
          {title}
        </h2>
        
        <GlassCard className="border-l-4 border-l-accent bg-black/40 backdrop-blur-3xl w-full">
          <p className="text-lg md:text-xl text-muted leading-relaxed">
            {description}
          </p>
        </GlassCard>
      </div>

      {/* Image Showcase */}
      <div className="flex-1 relative group w-full lg:w-auto">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-accent/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <motion.div
          variants={imageVariants}
          className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl glass-panel p-2 bg-white/5"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-auto rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
