
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./app-content/LoadingSpinner";
import { MainRoutes } from "./app-content/MainRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SidebarOverlay } from "./app-content/SidebarOverlay";
import { SidebarToggle } from "./app-content/SidebarToggle";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MainContent = () => {
  const { session } = useAuth();
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    // Set a small timeout to ensure styles are applied
    const timer = setTimeout(() => {
      setContentReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.main 
        className="flex-1 min-h-screen bg-background text-foreground relative transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: contentReady ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative min-h-screen">
          <SidebarOverlay />
          <SidebarToggle isVisible={true} />
          <MainRoutes />
        </div>
      </motion.main>
    </AnimatePresence>
  );
};

export const AppContent = () => {
  const handleConsoleError = useErrorHandler();
  const { isLoading } = useAuth();
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    window.addEventListener('error', handleConsoleError);
    
    // Mark the app as mounted after a short delay
    const timer = setTimeout(() => {
      setAppMounted(true);
    }, 100);
    
    return () => {
      window.removeEventListener('error', handleConsoleError);
      clearTimeout(timer);
    };
  }, [handleConsoleError]);

  if (isLoading || !appMounted) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <MainContent />
          <Toaster />
          <Sonner />
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
};
