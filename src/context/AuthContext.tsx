import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  type UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  clearGuest: () => void;
  signInWithGoogle: () => Promise<UserCredential | undefined>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem("lumina_is_guest") === "true";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // If a real user signs in, automatically wipe guest status to prevent collisions
        setIsGuest(false);
        localStorage.removeItem("lumina_is_guest");
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (_error) {
      console.error("Error signing in with Google: Authentication failed.");
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem("lumina_is_guest", "true");
  };

  const clearGuest = () => {
    setIsGuest(false);
    localStorage.removeItem("lumina_is_guest");
    localStorage.removeItem("lumina_local_data");
  };

  const logout = async () => {
    try {
      if (isGuest) {
        setIsGuest(false);
        localStorage.removeItem("lumina_is_guest");
      } else {
        await signOut(auth);
      }
    } catch (_error) {
      console.error("Error signing out: Sign out process failed.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        continueAsGuest,
        clearGuest,
        signInWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
