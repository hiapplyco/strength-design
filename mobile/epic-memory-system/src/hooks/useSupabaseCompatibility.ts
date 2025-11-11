// Compatibility layer for transitioning from Supabase to Firebase
import { useFirebaseAuth } from '@/providers/FirebaseAuthProvider';
import { useMemo } from 'react';

// Mock Supabase types for compatibility
interface MockSession {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  };
  access_token: string;
}

// Hook that provides Supabase-like interface using Firebase
export function useAuth() {
  const { user, loading, isInitialized } = useFirebaseAuth();

  const session = useMemo<MockSession | null>(() => {
    if (!user) return null;

    return {
      user: {
        id: user.uid,
        email: user.email,
        user_metadata: {
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      },
      access_token: 'firebase-token', // Placeholder
    };
  }, [user]);

  return {
    session,
    user: session?.user ?? null,
    isLoading: loading || !isInitialized,
  };
}