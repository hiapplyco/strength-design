
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

  return (
    <div className="min-h-screen flex w-full bg-black relative">
      <AppSidebar />
      <SidebarOverlay />
      <main className="flex-1 w-full relative transition-[margin] duration-300 ease-in-out">
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
