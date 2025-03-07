
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, isLoading: true });

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Track component mount state
    let mounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (mounted) {
          if (data.session) {
            setSession(data.session);
          }
          // Set loading to false even if no session
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching auth session:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        console.log("Auth state change", event);
        setSession(newSession);
        
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
      }
    });

    // Clean up subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
