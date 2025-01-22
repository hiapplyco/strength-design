import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";
import Index from "@/pages/Index";
import BestAppOfDay from "@/pages/BestAppOfDay";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuthStateManager } from "@/hooks/useAuthStateManager";

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
      <Navbar />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/best-app-of-day" element={<BestAppOfDay />} />
      </Routes>
    </>
  );
};