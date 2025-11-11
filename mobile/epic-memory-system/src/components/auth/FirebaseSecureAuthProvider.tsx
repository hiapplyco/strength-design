import { createContext, useContext, ReactNode } from "react";
import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";
import { useAuth } from "@/contexts/AuthContext";

interface SecureAuthContextType {
  session: any | null; // Mock session for compatibility
  user: any | null; // Mock user for compatibility
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SecureAuthContext = createContext<SecureAuthContextType>({ 
  session: null, 
  user: null, 
  isLoading: true,
  signOut: async () => {}
});

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error("useSecureAuth must be used within a SecureAuthProvider");
  }
  return context;
};

interface SecureAuthProviderProps {
  children: ReactNode;
}

export function SecureAuthProvider({ children }: SecureAuthProviderProps) {
  // Use the compatibility layer to get Supabase-like data structure
  const { session, user, isLoading } = useAuth();
  const { logout } = useFirebaseAuth();

  const signOut = async () => {
    await logout();
  };

  return (
    <SecureAuthContext.Provider value={{ 
      session, 
      user, 
      isLoading,
      signOut
    }}>
      {children}
    </SecureAuthContext.Provider>
  );
}