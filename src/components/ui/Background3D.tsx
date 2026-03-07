import React from "react";
import { motion } from "framer-motion";

export const Background3D: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* Top Left Orb */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] left-[10%] w-64 h-32 rounded-full mix-blend-screen filter blur-[40px] md:blur-[80px] opacity-60"
        style={{
          background: "linear-gradient(90deg, #14b8a6, #3b82f6)",
        }}
      />

      {/* Bottom Right Orb */}
      <motion.div
        animate={{
          y: [0, 40, 0],
          rotate: [0, -15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[20%] right-[10%] w-80 h-40 rounded-full mix-blend-screen filter blur-[50px] md:blur-[100px] opacity-50"
        style={{
          background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
        }}
      />

      {/* Center Left Small Orb */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-[50%] left-[20%] w-32 h-32 rounded-full mix-blend-screen filter blur-[30px] md:blur-[60px] opacity-40"
        style={{
          background: "radial-gradient(circle, #06b6d4, transparent)",
        }}
      />

      {/* Top Right Small Orb */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 45, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute top-[30%] right-[25%] w-48 h-24 rounded-full mix-blend-screen filter blur-[35px] md:blur-[70px] opacity-40"
        style={{
          background: "linear-gradient(45deg, #10b981, #6366f1)",
        }}
      />
    </div>
  );
};
