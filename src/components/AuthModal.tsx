import React from "react";
import { motion } from "framer-motion";
import { LogIn, User, X } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { GlassButton } from "./ui/GlassButton";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signInWithGoogle, continueAsGuest } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-slate-950/40 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        layoutId="auth-modal"
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <GlassCard className="text-center p-10 flex flex-col items-center border border-white/20 shadow-2xl relative overflow-hidden">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Subtle background glow inside the card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/20 rounded-full blur-[60px] pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 shadow-lg border border-white/10 relative z-10">
            <LogIn className="w-8 h-8 text-teal-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 relative z-10 tracking-tight">
            Lumina Finance
          </h2>
          <p className="text-slate-400 mb-8 relative z-10">
            Sign in to sync your premium expense tracker across devices.
          </p>

          <GlassButton
            onClick={signInWithGoogle}
            className="w-full py-3 relative z-10 font-semibold group"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </GlassButton>

          <div className="w-full flex items-center justify-center gap-4 my-6 opacity-30">
            <div className="h-px bg-white flex-1" />
            <span className="text-xs uppercase tracking-wider font-semibold text-white">
              or
            </span>
            <div className="h-px bg-white flex-1" />
          </div>

          <GlassButton
            onClick={continueAsGuest}
            variant="secondary"
            className="w-full py-3 relative z-10 font-semibold"
          >
            <User className="w-5 h-5 mr-2" />
            Continue as Guest
          </GlassButton>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
