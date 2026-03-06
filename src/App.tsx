import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";

const AppContent: React.FC = () => {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return user || isGuest ? <Dashboard /> : <AuthModal />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
