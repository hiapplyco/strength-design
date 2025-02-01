import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Index from "@/pages/Index";
import BestAppOfDay from "@/pages/BestAppOfDay";
import Pricing from "@/pages/Pricing";
import DocumentEditor from "@/pages/DocumentEditor";
import SharedDocument from "@/pages/SharedDocument";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import VideoAnalysis from "@/pages/VideoAnalysis";
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
    <div className="min-h-screen flex flex-col bg-black">
      <header className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-black via-black/95 to-black/80 border-b border-primary/20 backdrop-blur-sm">
        <div className="container mx-auto">
          <Navbar />
        </div>
      </header>
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/best-app-of-day" element={<BestAppOfDay />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/document-editor" element={<DocumentEditor />} />
          <Route path="/shared-document/:id" element={<SharedDocument />} />
          <Route path="/workout-generator" element={<WorkoutGenerator />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <Sonner />
    </div>
  );
};