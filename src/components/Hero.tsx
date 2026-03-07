import React, { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Wallet,
  PieChart,
  Activity,
  Cloud,
  LogIn,
  ChevronRight,
  Zap,
  Sparkles,
} from "lucide-react";
import { AuthModal } from "./AuthModal";
import { GlassButton } from "./ui/GlassButton";

const customEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Hero: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -150]);

  // Framer Motion variants for Assets flying in from outside
  const assetVariants = (
    x: string | number,
    y: string | number,
    rotate: number,
  ) => ({
    hidden: { opacity: 0, scale: 0.3, x, y, rotate: rotate + 45 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate,
      transition: { duration: 1.8, ease: customEasing },
    },
    // When Auth is active, morph towards the center (0, 0)
    authActive: {
      x: 0,
      y: 0,
      scale: 0.8,
      opacity: 0.2,
      rotate: 0,
      transition: { duration: 0.8, ease: customEasing },
    },
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        y: "-120vh",
        opacity: 0,
        transition: { duration: 0.8, ease: customEasing },
      }}
      className="min-h-screen w-full relative overflow-hidden flex flex-col"
    >
      {/* Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: customEasing }}
        className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full relative z-20"
      >
        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300">
          <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.15)] shrink-0 overflow-hidden p-1">
            <img
              src="/icon.svg"
              alt="Lumina Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-bold tracking-widest text-xs uppercase">
            Lumina Finance
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.button
              layoutId="auth-modal"
              onClick={() => setShowAuth(true)}
              transition={{ duration: 0.6, ease: customEasing }}
              className="px-8 py-2.5 flex items-center gap-2 rounded-full bg-teal-500/20 hover:bg-teal-500/30 backdrop-blur-md border border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.2)] text-teal-300 font-semibold transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span className="relative z-10 text-sm tracking-wide">
                Sign In
              </span>
            </motion.button>
          ) : (
            <div className="px-8 py-2.5 opacity-0 pointer-events-none">
              Placeholder
            </div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col items-center pt-24 pb-32 px-4 relative z-10">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-2xl max-h-2xl bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: customEasing }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold tracking-widest uppercase mb-8 relative z-20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          The Future of Capital
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: customEasing }}
          className="text-6xl md:text-8xl font-black text-white text-center tracking-tighter leading-tight mb-6 max-w-4xl relative z-20 pointer-events-none"
        >
          Evolve your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-violet-500">
            Wealth.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: customEasing }}
          className="text-lg md:text-xl text-slate-400 text-center max-w-2xl mb-12 relative z-20 pointer-events-none"
        >
          The most intuitive way to track, manage, and grow your assets. Visual
          insights, real-time Firebase sync, and smart categorization in a
          glass-clear interface.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: customEasing }}
          className="relative z-30"
        >
          <GlassButton
            onClick={() => setShowAuth(true)}
            className="px-10 py-4 text-lg font-semibold bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            Launch App
            <ChevronRight className="w-5 h-5 ml-2" />
          </GlassButton>
        </motion.div>

        {/* 3D Parallax Floating Assets */}
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
          {/* Main Portfolio Card */}
          <motion.div
            style={{ y: y1 }}
            variants={assetVariants("-100vw", "-50vh", -12)}
            initial="hidden"
            animate={showAuth ? "authActive" : "visible"}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(20, 184, 166, 0.4)",
            }}
            className="absolute -left-[20%] sm:-left-[5%] md:left-[2%] lg:left-[5%] top-[60%] sm:top-[70%] md:top-[30%] w-60 md:w-72 h-36 md:h-44 glass-panel rounded-2xl p-4 md:p-6 pointer-events-auto border-t-white/40 flex flex-col justify-between origin-bottom-left z-0"
          >
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                Total Balance
              </p>
              <h3 className="text-3xl font-bold text-white">$128,450.00</h3>
            </div>
            <div className="flex justify-between items-end">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-teal-400 text-sm font-semibold flex items-center gap-1">
                +2.4% <Zap className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

          {/* Floating Coin 1 */}
          <motion.div
            style={{ y: y2 }}
            variants={assetVariants("100vw", "-80vh", 15)}
            initial="hidden"
            animate={showAuth ? "authActive" : "visible"}
            whileHover={{
              scale: 1.1,
              boxShadow: "0 0 25px rgba(139, 92, 246, 0.5)",
            }}
            className="absolute right-[0%] md:right-[5%] lg:right-[10%] top-[5%] md:top-[15%] w-12 h-12 md:w-16 md:h-16 rounded-full glass-panel flex items-center justify-center pointer-events-auto text-violet-400 z-0"
          >
            <PieChart className="w-5 h-5 md:w-8 md:h-8" />
          </motion.div>

          {/* Floating Coin 2 */}
          <motion.div
            style={{ y: y3 }}
            variants={assetVariants("-80vw", "100vh", -25)}
            initial="hidden"
            animate={showAuth ? "authActive" : "visible"}
            whileHover={{
              scale: 1.1,
              boxShadow: "0 0 25px rgba(20, 184, 166, 0.5)",
            }}
            className="absolute left-[5%] md:left-[10%] lg:left-[15%] bottom-[5%] md:bottom-[15%] w-14 h-14 md:w-20 md:h-20 rounded-full glass-panel flex items-center justify-center pointer-events-auto text-teal-400 z-0"
          >
            <Wallet className="w-5 h-5 md:w-10 md:h-10" />
          </motion.div>

          {/* Floating Info Card */}
          <motion.div
            style={{ y: y4 }}
            variants={assetVariants("100vw", "80vh", 8)}
            initial="hidden"
            animate={showAuth ? "authActive" : "visible"}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(255, 255, 255, 0.2)",
            }}
            className="absolute -right-[20%] sm:-right-[5%] md:right-[5%] lg:right-[8%] bottom-[10%] md:bottom-[20%] w-56 md:w-64 glass-panel rounded-xl p-3 md:p-4 pointer-events-auto flex items-center gap-3 md:gap-4 origin-bottom-right z-0"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 shadow-inner border border-white/5">
              <Cloud className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Cloud Sync</h4>
              <p className="text-slate-400 text-xs">Real-time Firebase state</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Render AuthModal centrally when active */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};
