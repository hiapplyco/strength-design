
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/Index";
import JournalPage from "@/pages/JournalPage";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import WorkoutResults from "@/pages/WorkoutResults";
import GeneratedWorkouts from "@/pages/GeneratedWorkouts";
import DocumentEditor from "@/pages/DocumentEditor";
import PublishProgram from "@/pages/PublishProgram";
import MovementAnalysisPage from "@/pages/MovementAnalysisPage";
import Pricing from "@/pages/Pricing";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import ProgramChat from "@/pages/ProgramChat";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Redirect old video-analysis route to publish-program */}
        <Route path="/video-analysis" element={<Navigate to="/publish-program" replace />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/workout-generator" element={<WorkoutGenerator />} />
        <Route path="/workout-results" element={<WorkoutResults />} />
        <Route path="/generated-workouts" element={<GeneratedWorkouts />} />
        <Route path="/document-editor" element={<DocumentEditor />} />
        <Route path="/publish-program" element={<PublishProgram />} />
        <Route path="/movement-analysis" element={<MovementAnalysisPage />} />
        <Route path="/program-chat" element={<ProgramChat />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/checkout-cancel" element={<CheckoutCancel />} />
      </Routes>
    </>
  );
};
