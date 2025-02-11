
import { useEffect } from "react";
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

  return (
    <div className="min-h-screen flex w-full bg-black relative">
      <AppSidebar />
      <SidebarOverlay />
      <main 
        className={cn(
          "flex-1 w-full relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "ml-64" : "ml-0"
        )}
      >
        <SidebarToggle isVisible={!!session} />
        <div className="relative min-h-screen">
          <MainRoutes />
        </div>
      </main>
    </div>
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
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <MainContent />
      </SidebarProvider>
    </QueryClientProvider>
  );
};
