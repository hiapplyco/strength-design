import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "@/pages/Index";
import BestAppOfDay from "@/pages/BestAppOfDay";
import Pricing from "@/pages/Pricing";
import DocumentEditor from "@/pages/DocumentEditor";
import SharedDocument from "@/pages/SharedDocument";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import VideoAnalysis from "@/pages/VideoAnalysis";
import GeneratedWorkouts from "@/pages/GeneratedWorkouts";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuthStateManager } from "@/hooks/useAuthStateManager";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = useAuthStateManager();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export const AppContent = () => {
  const handleConsoleError = useErrorHandler();
  const session = useAuthStateManager();

  useEffect(() => {
    window.addEventListener('error', handleConsoleError);
    return () => {
      window.removeEventListener('error', handleConsoleError);
    };
  }, [handleConsoleError]);

  return (
    <>
      <Toaster />
      <Sonner />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-black">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
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
      </SidebarProvider>
    </>
  );
};