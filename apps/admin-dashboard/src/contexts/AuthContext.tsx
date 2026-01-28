import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
} from "../lib/firebase";
import type { UserCredential } from "firebase/auth";
import { removeAuthToken, setAuthToken } from "../lib/authToken";

/**
 * Authentication context type definition
 */
interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: FirebaseUser | null;
  /** Loading state during authentication operations */
  loading: boolean;
  /** Sign in with email and password */
  login: (email: string, password: string) => Promise<UserCredential>;
  /** Sign out current user */
  logout: () => Promise<void>;
}

/**
 * Authentication context - provides authentication state and methods
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component that manages Firebase auth state
 * and provides authentication methods to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sign in with email and password
   */
  const login = async (
    email: string,
    password: string,
  ): Promise<UserCredential> => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Clear the stored authentication token
      removeAuthToken();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      // If user is authenticated, get and store a fresh token
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.error("Error getting ID token:", error);
        }
      } else {
        // User is logged out, remove token
        removeAuthToken();
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access the authentication context
 * @throws Error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
