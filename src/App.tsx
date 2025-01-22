import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import BestAppOfDay from "./pages/BestAppOfDay";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Session } from "@supabase/supabase-js";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        },
      },
    },
  },
});

// Create an error handler for console errors
const handleConsoleError = (event: ErrorEvent) => {
  const { toast } = useToast();
  
  // Check if it's an Edge Function error
  if (event.message.includes('Edge Function')) {
    toast({
      title: "Server Error",
      description: "The workout generation service is temporarily unavailable. Please try again later.",
      variant: "destructive",
    });
    return;
  }

  // Check for accessibility warnings
  if (event.message.includes('DialogContent')) {
    console.warn('Accessibility warning:', event.message);
    return;
  }

  // General error handling
  toast({
    title: "Error",
    description: "An unexpected error occurred. Please try again.",
    variant: "destructive",
  });
};

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Add console error listener
    window.addEventListener('error', handleConsoleError);

    // Get initial session
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

    // Listen for auth changes
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

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('error', handleConsoleError);
    };
  }, [toast, navigate, session]);

  return (
    <>
      <Navbar />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/best-app-of-day" element={<BestAppOfDay />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;