import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import Index from "@/pages/Index";
import BestAppOfDay from "@/pages/BestAppOfDay";
import Pricing from "@/pages/Pricing";
import DocumentEditor from "@/pages/DocumentEditor";
import SharedDocument from "@/pages/SharedDocument";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import GeneratedWorkouts from "@/pages/GeneratedWorkouts";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const MainContent = () => {
  const { session } = useAuth();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <>
      {session && isMobile && (
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 text-muted-foreground hover:text-accent"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
      <div className="min-h-screen flex w-full bg-black">
        <AppSidebar />
        <main className="flex-1 overflow-auto pl-0 md:pl-64">
          <Routes>
            <Route path="/" element={
              session ? <Navigate to="/workout-generator" replace /> : <Index />
            } />
            <Route path="/best-app-of-day" element={<BestAppOfDay />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/document-editor" element={
              <ProtectedRoute>
                <DocumentEditor />
              </ProtectedRoute>
            } />
            <Route path="/shared-document/:id" element={
              <ProtectedRoute>
                <SharedDocument />
              </ProtectedRoute>
            } />
            <Route path="/workout-generator" element={
              <ProtectedRoute>
                <WorkoutGenerator />
              </ProtectedRoute>
            } />
            <Route path="/video-analysis" element={
              <ProtectedRoute>
                <VideoAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/generated-workouts" element={
              <ProtectedRoute>
                <GeneratedWorkouts />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
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