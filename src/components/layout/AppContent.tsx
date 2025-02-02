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

const MainContent = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen flex w-full bg-black relative">
      <AppSidebar />
      <main className="flex-1 overflow-auto pl-0 md:pl-64">
        <SidebarToggle isVisible={!!session} />
        <MainRoutes />
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
    <SidebarProvider>
      <Toaster />
      <Sonner />
      <MainContent />
    </SidebarProvider>
  );
};