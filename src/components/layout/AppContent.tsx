
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./app-content/LoadingSpinner";
import { SidebarToggle } from "./app-content/SidebarToggle";
import { MainRoutes } from "./app-content/MainRoutes";
import { SidebarOverlay } from "./app-content/SidebarOverlay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const { open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = isMobile ? openMobile : open;
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
      <div className="min-h-screen flex w-full bg-black relative">
        <AppSidebar />
        <SidebarOverlay />
        <motion.main 
          className={cn(
            "flex-1 w-full relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isOpen ? "md:pl-64" : "pl-0"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: contentReady ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <SidebarToggle isVisible={!!session} />
          <div className="relative min-h-screen">
            <MainRoutes />
          </div>
        </motion.main>
      </div>
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
        <Toaster />
        <Sonner />
        <MainContent />
      </SidebarProvider>
    </QueryClientProvider>
  );
};
