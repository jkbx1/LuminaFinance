import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Dashboard } from "./components/Dashboard";
import { Hero } from "./components/Hero";
import { AnimatePresence, LayoutGroup } from "framer-motion";

const AppContent: React.FC = () => {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user || isGuest ? <Dashboard key="dashboard" /> : <Hero key="hero" />}
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <LayoutGroup>
        <AppContent />
      </LayoutGroup>
    </AuthProvider>
  );
}

export default App;
