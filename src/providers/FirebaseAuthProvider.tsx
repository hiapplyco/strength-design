import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/hooks/firebase/useAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ user: User | null; error: any }>;
  signInWithGoogle: () => Promise<{ user: User | null; error: any }>;
  signInWithPhone: (phoneNumber: string) => Promise<{ confirmationResult: any; error: any }>;
  verifyPhoneCode: (code: string) => Promise<{ user: User | null; error: any }>;
  setupPhoneRecaptcha: (containerId: string) => Promise<void>;
  logout: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}