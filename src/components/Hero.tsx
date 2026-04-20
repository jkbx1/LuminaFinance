import React, { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ChevronRight, PieChart, Wallet, Zap, Activity, Cloud, LogIn, Sparkles, LayoutDashboard, BarChart3, FileSpreadsheet } from "lucide-react";
import { AuthModal } from "./AuthModal";
import { GlassButton } from "./ui/GlassButton";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Background3D } from "./ui/Background3D";
import { FeatureShowcase } from "./ui/FeatureShowcase";
import { LuminaLogo } from "./ui/LuminaLogo";
import { Footer } from "./ui/Footer";

// Asset Imports
import dashboardImg from "../assets/lumina_finance (1).webp";
import ratesImg from "../assets/lumina_finance (4).webp";
import csvImg from "../assets/lumina_finance (5).webp";

const customEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Hero: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroFoldRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroFoldRef,
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
      className="w-full relative flex flex-col overflow-x-hidden"
    >
      <Background3D interactive={false} showSpotlight={false} gridSpacing={35} />
      
      {/* Hero fold (First Viewport) */}
      <div ref={heroFoldRef} className="min-h-screen w-full flex flex-col relative overflow-visible">
      {/* Floating Navbar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: customEasing }}
        className="fixed top-4 left-0 right-0 z-30 px-2 md:px-6 pointer-events-none"
      >
        <nav className="max-w-7xl mx-auto w-full flex items-center justify-between pointer-events-auto glass-panel rounded-full px-2 py-2 sm:px-3 sm:py-2.5 shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 shadow-[0_0_10px_rgba(255,0,55,0.1)] shrink-0 overflow-hidden p-1.5 sm:p-2">
              <LuminaLogo className="w-full h-full" />
            </div>
            <span className="text-bright font-bold tracking-widest text-[10px] sm:text-xs uppercase block">
              Lumina Finance
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Pill */}
            <ThemeToggle />

            {/* Sign In Pill */}
            <AnimatePresence mode="wait">
              {!showAuth ? (
                <motion.button
                  layoutId="auth-modal"
                  onClick={() => setShowAuth(true)}
                  transition={{ duration: 0.6, ease: customEasing }}
                  aria-label="Open authentication modal"
                  className="w-9 h-9 sm:w-auto sm:h-10 sm:px-5 flex justify-center items-center sm:gap-2 rounded-full bg-accent/10 border border-accent/20 shadow-[0_0_10px_rgba(255,0,55,0.1)] text-accent font-semibold text-sm transition-all duration-300 hover:bg-accent/20 shrink-0"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="tracking-wide hidden sm:block">Sign In</span>
                </motion.button>
              ) : (
                <div className="px-5 py-2.5 opacity-0 pointer-events-none">
                  Placeholder
                </div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </motion.div>

      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col items-center pt-24 pb-32 px-4 relative z-10">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-2xl max-h-2xl bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: customEasing }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-widest uppercase mb-8 relative z-20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          The Future of Capital
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: customEasing }}
          className="text-3xl sm:text-6xl md:text-8xl font-black text-bright text-center tracking-tighter leading-tight mb-6 max-w-4xl relative z-20 pointer-events-none px-4"
        >
          Evolve your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent to-bright py-1">
            Wealth.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: customEasing }}
          className="text-base md:text-xl text-muted text-center max-w-2xl mb-12 relative z-20 pointer-events-none px-4"
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
            className="px-10 py-4 text-lg font-bold !bg-accent !text-white hover:!bg-accent-hover shadow-xl transition-all border-none"
          >
            Launch App
            <ChevronRight className="w-5 h-5 ml-2" />
          </GlassButton>
        </motion.div>

        {/* 3D Parallax Floating Assets */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Main Portfolio Card */}
          <motion.div
            style={{ y: y1 }}
            variants={assetVariants("-100vw", "-50vh", -12)}
            initial="hidden"
            animate={showAuth ? "authActive" : "visible"}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(255, 0, 55, 0.4)",
            }}
            className="flex absolute left-[50%] -translate-x-1/2 sm:translate-x-0 sm:-left-[5%] md:left-[2%] lg:left-[5%] top-[65%] sm:top-[70%] md:top-[30%] w-60 md:w-72 h-36 md:h-44 glass-panel rounded-2xl p-4 md:p-6 pointer-events-auto border-t-white/40 flex-col justify-between origin-center sm:origin-bottom-left z-0 scale-75 sm:scale-100"
          >
            <div>
              <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-1">
                Total Balance
              </p>
              <h3 className="text-3xl font-bold text-bright">$128,450.00</h3>
            </div>
            <div className="flex justify-between items-end">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <span className="text-accent text-sm font-semibold flex items-center gap-1">
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
              boxShadow: "0 0 25px rgba(255, 255, 255, 0.5)",
            }}
            className="absolute right-[0%] md:right-[5%] lg:right-[10%] top-[5%] md:top-[15%] w-12 h-12 md:w-16 md:h-16 rounded-full glass-panel flex items-center justify-center pointer-events-auto text-bright z-0"
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
              boxShadow: "0 0 25px rgba(255, 0, 55, 0.5)",
            }}
            className="absolute left-[5%] md:left-[10%] lg:left-[15%] bottom-[5%] md:bottom-[15%] w-14 h-14 md:w-20 md:h-20 rounded-full glass-panel flex items-center justify-center pointer-events-auto text-accent z-0"
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
            className="flex absolute left-[50%] -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:-right-[5%] md:right-[5%] lg:right-[8%] top-[80%] sm:top-auto sm:bottom-[20%] w-56 md:w-64 glass-panel rounded-xl p-3 md:p-4 pointer-events-auto items-center gap-3 md:gap-4 origin-center sm:origin-bottom-right z-0 scale-75 sm:scale-100"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bg-card flex items-center justify-center shrink-0 shadow-inner border border-bg-border">
              <Cloud className="w-6 h-6 text-bright" />
            </div>
            <div>
              <h4 className="text-bright text-sm font-bold">Cloud Sync</h4>
              <p className="text-muted text-xs">Real-time Firebase state</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

    {/* Feature Showcase Sections */}
    <div className="relative z-20 pb-32 space-y-12 overflow-visible">
      <FeatureShowcase
        title="Command Your Capital"
        description="Experience financial clarity like never before. Our main dashboard brings all your accounts, assets, and liabilities into one high-fidelity view, powered by real-time analytics and predictive insights."
        image={dashboardImg}
        icon={LayoutDashboard}
      />
      
      <FeatureShowcase
        title="Market Mastery"
        description="Stay ahead of market shifts with integrated live rates. Track global fiat currencies, commodities, and digital assets with surgical precision, ensuring you're always trading on the best information."
        image={ratesImg}
        icon={BarChart3}
        reverse
      />
      
      <FeatureShowcase
        title="Seamless Integration"
        description="Ditch the manual spreadsheets. Upload CSV exports from any financial institution and watch as Lumina's smart engine categorizes and merges your history into a unified ledger in seconds."
        image={csvImg}
        icon={FileSpreadsheet}
      />
    </div>

      {/* Footer Section */}
      <Footer />

      {/* Render AuthModal centrally when active */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};
