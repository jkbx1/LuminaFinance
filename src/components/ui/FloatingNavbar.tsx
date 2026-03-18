import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RefreshCw, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { GlassButton } from "./GlassButton";

interface FloatingNavbarProps {
  isGuest: boolean;
  isSyncing: boolean;
  onLogout: () => void;
  onSync: () => void;
  welcomeName: string;
  isBlurred?: boolean;
}

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  isGuest,
  isSyncing,
  onLogout,
  onSync,
  welcomeName,
  isBlurred = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // On mobile, hide on scroll down, show on scroll up
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
          setIsExpanded(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 px-4 md:px-6 pointer-events-none overflow-hidden">
      <motion.nav
        initial={{ top: -100 }}
        animate={{ top: isVisible ? 24 : -120 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed left-4 right-4 md:left-6 md:right-6 z-30 pointer-events-auto"
      >
        <div className="max-w-7xl mx-auto w-full">
        {/* Glass layer: no opacity animation so backdrop-filter stays visible during enter/leave */}
        <div 
          className="glass-panel w-full flex flex-col overflow-hidden transition-[border-radius,background-color] duration-500 ease-in-out"
          style={{ 
            borderRadius: isExpanded ? "32px" : "100px",
            backgroundColor: isBlurred ? "var(--bg-card)" : "var(--glass-bg)",
            backdropFilter: isBlurred ? "blur(32px)" : "blur(16px)",
            WebkitBackdropFilter: isBlurred ? "blur(32px)" : "blur(16px)",
            border: "1px solid var(--glass-border)"
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: isBlurred
                ? (isVisible ? 0.2 : 0)
                : (isVisible ? 1 : 0),
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`p-1 flex flex-col transition-all duration-500 ${isBlurred ? 'blur-[2px] pointer-events-none' : 'blur-0'}`}
          >
            <div className="flex items-center justify-between w-full h-14 px-3">
              {/* Logo & Welcome */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20 shadow-[0_0_15px_rgba(255,0,55,0.1)] shrink-0 overflow-hidden p-2">
                  <svg viewBox="0 0 256 256" className="w-full h-full object-contain overflow-visible">
                    <defs>
                      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <rect x="144" y="56" width="48" height="72" rx="6" fill="#FF004D" filter="url(#neon-glow)" />
                    <rect x="144" y="56" width="48" height="72" rx="6" fill="#FF004D" />
                    <path 
                      d="M 48 104 Q 128 128 208 104" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      strokeLinecap="round" 
                      className="text-bright" 
                    />
                    <path 
                      d="M 48 104 Q 128 128 208 104 L 208 176 C 208 193.6 193.6 208 176 208 L 80 208 C 62.4 208 48 193.6 48 176 Z" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      strokeLinejoin="round" 
                      className="text-bright" 
                    />
                    <circle cx="72" cy="180" r="4" fill="currentColor" className="text-bright" />
                    <circle cx="92" cy="180" r="4" fill="currentColor" className="text-bright" />
                    <circle cx="112" cy="180" r="4" fill="currentColor" className="text-bright" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-black text-bright tracking-tight leading-none uppercase">Lumina Finance</h1>
                  <p className="text-[10px] text-muted font-bold tracking-wide">Welcome back, {welcomeName}</p>
                </div>
                <div className="sm:hidden flex flex-col font-black uppercase">
                  <span className="text-[10px] text-bright tracking-widest leading-tight">Lumina</span>
                  <span className="text-[8px] text-accent">{welcomeName}</span>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-3">
                <div className="h-6 w-px bg-bg-border mx-1" />
                <ThemeToggle />
                
                {isGuest && (
                  <GlassButton
                    variant="primary"
                    onClick={onSync}
                    disabled={isSyncing}
                    className="px-5 h-10 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(255,0,55,0.15)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync
                  </GlassButton>
                )}

                <GlassButton
                  variant="secondary"
                  onClick={onLogout}
                  className="px-5 h-10 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </GlassButton>
              </div>

              {/* Mobile Toggle */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-10 h-10 rounded-full bg-bg-card/50 flex items-center justify-center border border-bg-border transition-all active:scale-90"
                  aria-label={isExpanded ? "Close menu" : "Open menu"}
                  aria-expanded={isExpanded}
                >
                  <AnimatePresence mode="wait">
                    {isExpanded ? (
                      <motion.div
                        key="close"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <X className="w-5 h-5 text-accent" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Menu className="w-5 h-5 text-bright" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Mobile Expanded Menu (Downwards) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="px-3 pb-6 pt-2 border-t border-bg-border flex flex-col gap-2 mt-1">
                    {isGuest && (
                      <GlassButton
                        variant="primary"
                        onClick={() => {
                          onSync();
                          setIsExpanded(false);
                        }}
                        disabled={isSyncing}
                        className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Data
                      </GlassButton>
                    )}
                    
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        onLogout();
                        setIsExpanded(false);
                      }}
                      className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest"
                    >
                      <LogOut className="w-4 h-4 text-accent" />
                      Logout
                    </GlassButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        </div>
      </motion.nav>
    </div>
  );
};
