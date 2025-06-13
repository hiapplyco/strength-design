
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthErrorHandler } from "@/hooks/useAuthErrorHandler";

interface SecureAuthContextType {
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { handleAuthError } = useAuthErrorHandler();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleAuthError(error, 'signOut');
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      }
    } catch (error) {
      handleAuthError(error, 'signOut');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change:", event);
        
        // Only update session if it's actually different
        if (JSON.stringify(newSession) !== JSON.stringify(session)) {
          setSession(newSession);
        }
        
        // Only show toast for explicit auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You are now signed in"
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "Come back soon!"
          });
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          handleAuthError(error, 'getSession');
        } else {
          setSession(initialSession);
        }
      } catch (error) {
        handleAuthError(error, 'initializeAuth');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, handleAuthError]);

  return (
    <SecureAuthContext.Provider value={{ 
      session, 
      user: session?.user ?? null, 
      isLoading,
      signOut
    }}>
      {children}
    </SecureAuthContext.Provider>
  );
}
