
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import Index from "@/pages/Index";
import BestAppOfDay from "@/pages/BestAppOfDay";
import Pricing from "@/pages/Pricing";
import DocumentEditor from "@/pages/DocumentEditor";
import SharedDocument from "@/pages/SharedDocument";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import WorkoutResults from "@/pages/WorkoutResults";
import VideoAnalysisPage from "@/pages/VideoAnalysis";
import GeneratedWorkouts from "@/pages/GeneratedWorkouts";
import ProgramChat from "@/pages/ProgramChat";

export const MainRoutes = () => {
  const { session } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={session ? <Navigate to="/workout-generator" replace /> : <Index />} 
      />
      <Route path="/best-app-of-day" element={<BestAppOfDay />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/document-editor"
        element={
          <ProtectedRoute>
            <DocumentEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shared-document/:id"
        element={
          <ProtectedRoute>
            <SharedDocument />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout-generator"
        element={
          <ProtectedRoute>
            <WorkoutGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout-results"
        element={
          <ProtectedRoute>
            <WorkoutResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-analysis"
        element={
          <ProtectedRoute>
            <VideoAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generated-workouts"
        element={
          <ProtectedRoute>
            <GeneratedWorkouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/program-chat"
        element={
          <ProtectedRoute>
            <ProgramChat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
