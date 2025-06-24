
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./app-content/LoadingSpinner";
import { MainRoutes } from "./app-content/MainRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SidebarOverlay } from "./app-content/SidebarOverlay";
import { SidebarToggle } from "./app-content/SidebarToggle";
import { useEffect } from "react";

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
  return (
    <motion.main 
      className="flex-1 min-h-screen bg-background text-foreground relative transition-all duration-300 min-w-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative min-h-screen w-full">
        <SidebarOverlay />
        <SidebarToggle isVisible={true} />
        <MainRoutes />
      </div>
    </motion.main>
  );
};

export const AppContent = () => {
  const handleConsoleError = useErrorHandler();
  const { isLoading } = useAuth();

  useEffect(() => {
    window.addEventListener('error', handleConsoleError);
    return () => {
      window.removeEventListener('error', handleConsoleError);
    };
  }, [handleConsoleError]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full overflow-hidden">
          <AppSidebar />
          <MainContent />
          <Sonner />
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
};
