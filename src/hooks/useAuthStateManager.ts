import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useAuthStateManager = () => {
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          toast({
            title: "Session Error",
            description: "Failed to retrieve session. Please try logging in again.",
            variant: "destructive",
          });
          return;
        }

        if (initialSession) {
          console.log("Initial session retrieved:", initialSession.user?.id);
          setSession(initialSession);
        }
      } catch (error) {
        console.error("Unexpected error during session initialization:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);
      
      if (currentSession?.access_token !== session?.access_token) {
        setSession(currentSession);
      }

      switch (event) {
        case 'SIGNED_IN':
          toast({
            title: "Welcome!",
            description: "Successfully signed in.",
          });
          navigate('/');
          break;
        case 'SIGNED_OUT':
          setSession(null);
          toast({
            title: "Signed out",
            description: "Successfully signed out.",
          });
          navigate('/');
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully');
          setSession(currentSession);
          break;
        case 'USER_UPDATED':
          console.log('User updated');
          setSession(currentSession);
          break;
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated');
          break;
        default:
          if (!currentSession) {
            console.error('Auth state change error');
            toast({
              title: "Authentication Error",
              description: "Please try signing in again.",
              variant: "destructive",
            });
          }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate, session]);

  return session;
};