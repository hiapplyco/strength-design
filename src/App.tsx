import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BestAppOfDay from "./pages/BestAppOfDay";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Configure Supabase Auth to use the current URL as the redirect URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("User is authenticated:", session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        console.log("Auth state changed:", session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/best-app-of-day" element={<BestAppOfDay />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;