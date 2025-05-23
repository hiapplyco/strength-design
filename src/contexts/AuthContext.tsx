
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
    // Get initial session once
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching auth session:", error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change", event);
      
      // Only update session if it's actually different to avoid unnecessary rerenders
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
    });

    // Clean up subscription without checking session again
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
