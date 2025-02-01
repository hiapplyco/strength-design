import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
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

export const AppContent = () => {
  const handleConsoleError = useErrorHandler();

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
              <Route path="/" element={<Index />} />
              <Route path="/best-app-of-day" element={<BestAppOfDay />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/document-editor" element={<DocumentEditor />} />
              <Route path="/shared-document/:id" element={<SharedDocument />} />
              <Route path="/workout-generator" element={<WorkoutGenerator />} />
              <Route path="/video-analysis" element={<VideoAnalysis />} />
              <Route path="/generated-workouts" element={<GeneratedWorkouts />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
};